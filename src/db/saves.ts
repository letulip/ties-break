import { openDB, reqToPromise } from './idb'
import { compressWorld, decompressWorld } from '../engine/saveCodec'
import type { WorldState } from '../engine/world'
import type { SlotMeta, CareerMeta } from '../shared/protocol'

// Save slots in IndexedDB: each record is one compressed, checksummed blob, scoped to a career.
//
// Slot naming
//   autosave     auto:{careerId}:a  /  auto:{careerId}:b   (two alternating generations)
//   named save   manual:{careerId}:{name}                  (name sanitized to [a-z0-9-], <=24)
//
// The `saves` store keeps keyPath `slot`; the `careers` store (keyPath `careerId`) holds one
// meta row per career. DB schema migrations are append-only `if (oldVersion < N)` blocks.
//
// W1-INTEGRITY-A (Codex TB-03 + TB-04's CAS half): every write that commits career progress goes
// through ONE readwrite transaction over BOTH stores, chained on IDB request callbacks and resolved
// only on the transaction's `complete` event – so the save record and the careers row cannot
// diverge, whatever interrupts the tab. Each record carries the `revision` it captured (see
// SlotMeta in shared/protocol.ts – the envelope, NOT the WorldState payload, holds it: no schema
// bump), and the careers row carries the career's highest committed revision. That row is the
// COMPARE-AND-SWAP anchor: `commitAutosave` refuses (SaveConflictError, transaction aborted, both
// stores untouched) whenever the on-disk revision is not strictly older than the one being
// written, so a stale tab gets a typed conflict instead of silently clobbering newer progress.
// ⚠ This is deliberately only the CAS half of Codex TB-04. The full cross-tab lease – Web Locks
// ownership, BroadcastChannel revision broadcasts, read-only secondary tabs with "Take control
// here" – is DEFERRED by docs/plans/launch-plan-2026-08.md (phone-first single-player; the CAS
// alone closes the data-loss). Recorded in the adoption ledger as partially adopted.

const DB_NAME = 'tennis-sim'
const DB_VERSION = 2
const STORE = 'saves'
const CAREERS = 'careers'

type Generation = 'a' | 'b'

interface SaveRecord extends SlotMeta {
  // denormalised profile bits so the careers list / slot rows render without decoding payloads
  kidName: string
  country: string
  checksum: Uint8Array
  payload: Uint8Array
}

// A pre-K1 (DB v1) record, before careers existed.
interface LegacyRecord {
  slot: string
  savedAt: number
  week: number
  seed: string
  bytes: number
  checksum: Uint8Array
  payload: Uint8Array
}

let dbPromise: Promise<IDBDatabase> | null = null

// Autosave rotation and generation ordering rely on strictly increasing timestamps, so two
// saves in the same millisecond can't tie.
let lastSavedAt = 0
function nextSavedAt(): number {
  lastSavedAt = Math.max(Date.now(), lastSavedAt + 1)
  return lastSavedAt
}

export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 24)
}

const autoSlot = (careerId: string, gen: Generation): string => `auto:${careerId}:${gen}`
const namedSlot = (careerId: string, name: string): string => `manual:${careerId}:${sanitizeName(name)}`

/** Close and forget the cached connection. Used by the worker teardown and tests that reset the DB. */
export function closeDb(): Promise<void> {
  const p = dbPromise
  dbPromise = null
  lastSavedAt = 0
  return p ? p.then((d) => d.close(), () => {}) : Promise.resolve()
}

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    // ⚠ A REJECTED OPEN MUST NOT BE CACHED (W1-INTEGRITY-B, TB-06: "a retried database open can
    // succeed without reloading the page"). This promise memoises the connection, and before this
    // catch it memoised FAILURE with exactly the same enthusiasm: one denied/blocked open at boot
    // and every later call – including the recovery screen's own Retry – re-awaited the same dead
    // promise until the tab was reloaded. So a rejection now clears the cache on its way out
    // (identity-checked: by the time this async catch runs, closeDb() or a newer open may already
    // have replaced `dbPromise`, and clobbering a HEALTHY successor with null would re-open a
    // second connection for no reason). The error still propagates to the caller unchanged –
    // resetting is not retrying, it only leaves the door unlocked for whoever retries next.
    const attempt: Promise<IDBDatabase> = openDB(DB_NAME, DB_VERSION, (database, oldVersion, tx) => {
      if (oldVersion < 1) {
        database.createObjectStore(STORE, { keyPath: 'slot' })
      }
      if (oldVersion < 2) {
        const careers = database.objectStoreNames.contains(CAREERS)
          ? tx.objectStore(CAREERS)
          : database.createObjectStore(CAREERS, { keyPath: 'careerId' })
        migrateV1toV2(tx.objectStore(STORE), careers)
      }
    }).catch((err: unknown) => {
      if (dbPromise === attempt) dbPromise = null
      throw err
    })
    dbPromise = attempt
  }
  return dbPromise
}

// v1 -> v2, in place inside the versionchange transaction (IDB requests only, no awaits):
//   * every record gains careerId = 'legacy-' + seed, plus kidName/country = 'Vera'/'US'
//     ⚠⚠ 'Vera' IS A HISTORICAL FACT AND MUST NOT FOLLOW `DEFAULT_PROFILE`. It was that profile's
//     name when v1 saves were written; the owner moved the default to `Alice` on 02.09.2026, and a
//     v1 career really was opened on Vera – re-labelling it would rename careers that exist on a
//     player's device. This is an append-only migration: the literal stays.
//   * old slot keys are rewritten to the career-scoped naming (delete + re-put)
//     - the two newest autosaves become generations b (newest) and a; any older autosave is dropped
//       (the new model keeps exactly two generations)
//     - any other slot becomes manual:{careerId}:{sanitized old slot name}
//   * one careers row is backfilled per distinct careerId
function migrateV1toV2(saves: IDBObjectStore, careers: IDBObjectStore): void {
  const getAll = saves.getAll()
  getAll.onsuccess = () => {
    const old = (getAll.result ?? []) as LegacyRecord[]
    if (old.length === 0) return

    const byCareer = new Map<string, LegacyRecord[]>()
    for (const rec of old) {
      const careerId = `legacy-${rec.seed}`
      const list = byCareer.get(careerId)
      if (list) list.push(rec)
      else byCareer.set(careerId, [rec])
    }

    saves.clear()
    for (const [careerId, recs] of byCareer) {
      const autos = recs.filter((r) => r.slot.startsWith('auto-')).sort((a, b) => b.savedAt - a.savedAt)
      const named = recs.filter((r) => !r.slot.startsWith('auto-'))

      const genFor: Generation[] = ['b', 'a'] // newest -> b, second-newest -> a
      autos.slice(0, 2).forEach((r, i) => {
        saves.put(rescope(r, autoSlot(careerId, genFor[i]), careerId))
      })
      for (const r of named) {
        saves.put(rescope(r, namedSlot(careerId, r.slot), careerId))
      }

      const savedAts = recs.map((r) => r.savedAt)
      const newest = recs.reduce((n, r) => (r.savedAt > n.savedAt ? r : n), recs[0])
      const meta: CareerMeta = {
        careerId,
        kidName: 'Vera',
        country: 'US',
        seed: recs[0].seed,
        createdAt: Math.min(...savedAts),
        lastPlayedAt: Math.max(...savedAts),
        week: newest.week,
      }
      careers.put(meta)
    }
  }
}

function rescope(r: LegacyRecord, slot: string, careerId: string): SaveRecord {
  return {
    slot,
    careerId,
    savedAt: r.savedAt,
    week: r.week,
    seed: r.seed,
    bytes: r.bytes,
    kidName: 'Vera',
    country: 'US',
    checksum: r.checksum,
    payload: r.payload,
  }
}

function tx(database: IDBDatabase, stores: string | string[], mode: IDBTransactionMode): IDBTransaction {
  return database.transaction(stores, mode)
}

function toMeta(r: SaveRecord): SlotMeta {
  return {
    slot: r.slot,
    careerId: r.careerId,
    savedAt: r.savedAt,
    week: r.week,
    seed: r.seed,
    bytes: r.bytes,
    revision: r.revision,
  }
}

async function getRecord(slot: string): Promise<SaveRecord | undefined> {
  const database = await db()
  return (await reqToPromise(tx(database, STORE, 'readonly').objectStore(STORE).get(slot))) as
    | SaveRecord
    | undefined
}

// --- the one-transaction commit (W1-INTEGRITY-A) ------------------------------

/** The typed CAS refusal: the on-disk career revision is not older than the write's. Thrown with
 *  the transaction ABORTED, so neither the record nor the careers row moved. The worker maps it to
 *  the wire code 'SAVE_CONFLICT'; `diskRevision` is what the conflict was measured against. */
export class SaveConflictError extends Error {
  constructor(
    readonly diskRevision: number,
    readonly attemptedRevision: number,
  ) {
    super(
      `Save conflict: this career is at revision ${diskRevision} on disk, ` +
        `refusing to overwrite it with revision ${attemptedRevision}`,
    )
    this.name = 'SaveConflictError'
  }
}

/** Newer-generation ordering: committed revision first (the commit order – a clock cannot be one
 *  across tabs and process restarts), `savedAt` as the tie-break for pre-revision records. */
function recNewer(a: SaveRecord, b: SaveRecord): boolean {
  const ra = a.revision ?? 0
  const rb = b.revision ?? 0
  return ra !== rb ? ra > rb : a.savedAt > b.savedAt
}

interface AutosaveCommit {
  meta: SlotMeta
  revision: number
}

/**
 * The single write path for career progress: save record + careers row, ONE readwrite transaction,
 * resolved only on `complete` (a request's `success` does not mean durability – the transaction
 * can still abort after it). Everything async (gzip, sha256) happens BEFORE the transaction opens,
 * because an awaited non-IDB promise auto-commits an open IndexedDB transaction (see idb.ts).
 *
 * Two modes, one flow:
 *   cas    the caller knows its committed revision and writes `revision`; refused with
 *          SaveConflictError when the on-disk row is already at that revision or ahead – the
 *          TB-04 compare-and-swap that keeps a stale tab from clobbering newer progress.
 *   adopt  the world arrives from OUTSIDE the disk lineage (new career, imported file) and has no
 *          base to compare; the next revision is allocated INSIDE the transaction as
 *          disk revision + 1, so even an import over a live career cannot clobber – it appends.
 */
async function runAutosaveTx(
  world: WorldState,
  opts: { mode: 'cas'; revision: number } | { mode: 'adopt' },
): Promise<AutosaveCommit> {
  const { payload, checksum } = await compressWorld(world)
  const savedAt = nextSavedAt()
  const database = await db()

  return new Promise<AutosaveCommit>((resolve, reject) => {
    const transaction = tx(database, [STORE, CAREERS], 'readwrite')
    const saves = transaction.objectStore(STORE)
    const careers = transaction.objectStore(CAREERS)

    let out: AutosaveCommit | null = null
    let failure: Error | null = null
    const fail = (err: Error): void => {
      failure ??= err
      try {
        transaction.abort()
      } catch {
        /* already aborting/finished – the reject below still carries `failure` */
      }
    }

    transaction.oncomplete = () =>
      out ? resolve(out) : reject(failure ?? new Error('Autosave commit finished without writing'))
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Autosave commit aborted'))
    transaction.onerror = () => {
      failure ??= transaction.error ?? new Error('Autosave commit failed')
    }

    // 1. The careers row – the CAS anchor – read INSIDE the same transaction that will write it.
    const metaReq = careers.get(world.careerId)
    metaReq.onsuccess = () => {
      const existing = metaReq.result as CareerMeta | undefined
      const diskRevision = existing?.revision ?? 0
      const revision = opts.mode === 'adopt' ? diskRevision + 1 : opts.revision
      if (opts.mode === 'cas' && revision <= diskRevision) {
        fail(new SaveConflictError(diskRevision, revision))
        return
      }

      // 2. Both generations, same transaction: pick the OLDER one to overwrite.
      const aReq = saves.get(autoSlot(world.careerId, 'a'))
      const bReq = saves.get(autoSlot(world.careerId, 'b'))
      let pending = 2
      const results: (SaveRecord | undefined)[] = [undefined, undefined]
      const step = (): void => {
        if (--pending > 0) return
        const [recA, recB] = results
        let gen: Generation
        if (!recA) gen = 'a'
        else if (!recB) gen = 'b'
        else gen = recNewer(recA, recB) ? 'b' : 'a'

        const record: SaveRecord = {
          slot: autoSlot(world.careerId, gen),
          careerId: world.careerId,
          savedAt,
          week: world.week,
          seed: world.seed,
          bytes: payload.byteLength,
          kidName: world.profile.kidName,
          country: world.profile.country,
          revision,
          checksum,
          payload,
        }
        const meta: CareerMeta = {
          careerId: world.careerId,
          kidName: world.profile.kidName,
          country: world.profile.country,
          seed: world.seed,
          createdAt: existing?.createdAt ?? savedAt,
          lastPlayedAt: savedAt,
          week: world.week,
          revision,
          // One clock, on the Careers list too (09.08) – the row printed the band before this.
          birthMonth: world.profile.birthMonth,
        birthDay: world.profile.birthDay,
        }
        saves.put(record)
        careers.put(meta)
        out = { meta: toMeta(record), revision }
      }
      aReq.onsuccess = () => {
        results[0] = aReq.result as SaveRecord | undefined
        step()
      }
      bReq.onsuccess = () => {
        results[1] = bReq.result as SaveRecord | undefined
        step()
      }
    }
  })
}

// --- careers -----------------------------------------------------------------

export async function listCareers(): Promise<CareerMeta[]> {
  const database = await db()
  const rows = (await reqToPromise(tx(database, CAREERS, 'readonly').objectStore(CAREERS).getAll())) as CareerMeta[]
  return rows.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
}

/** OPENING a career counts as playing it (owner, 29.07).
 *
 *  THE BUG THIS FIXES. `lastPlayedAt` was written by exactly two paths - autosave and a named save -
 *  so LOADING an old career never touched it. The store boots into
 *  `careers.sort(b.lastPlayedAt - a.lastPlayedAt)[0]`, so after picking an old save and closing the
 *  app you came back to whichever career had most recently been SAVED, which in practice is the last
 *  one you created. The owner reported it as "it always loads the newest career, no matter what".
 *
 *  A career you have deliberately opened is the career you are playing, so the timestamp moves when
 *  it opens rather than waiting for the first week to tick. */
export async function touchCareer(careerId: string, at: number = Date.now()): Promise<void> {
  const database = await db()
  const store = tx(database, CAREERS, 'readwrite').objectStore(CAREERS)
  const existing = (await reqToPromise(store.get(careerId))) as CareerMeta | undefined
  if (!existing) return // nothing to touch - a slot with no meta row is already an inconsistency
  await reqToPromise(store.put({ ...existing, lastPlayedAt: at }))
}

/** Delete every slot belonging to a career plus its meta row, in one transaction. */
export async function deleteCareer(careerId: string): Promise<void> {
  const database = await db()
  const transaction = tx(database, [STORE, CAREERS], 'readwrite')
  const saves = transaction.objectStore(STORE)
  const records = (await reqToPromise(saves.getAll())) as SaveRecord[]
  for (const r of records) {
    if (r.careerId === careerId) saves.delete(r.slot)
  }
  transaction.objectStore(CAREERS).delete(careerId)
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('deleteCareer failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('deleteCareer aborted'))
  })
}

// --- slots -------------------------------------------------------------------

export async function listSlots(careerId: string): Promise<SlotMeta[]> {
  const database = await db()
  const records = (await reqToPromise(tx(database, STORE, 'readonly').objectStore(STORE).getAll())) as SaveRecord[]
  return records
    .filter((r) => r.careerId === careerId)
    .map(toMeta)
    .sort((a, b) => b.savedAt - a.savedAt)
}

export async function readSlot(slot: string): Promise<WorldState> {
  const record = await getRecord(slot)
  if (!record) throw new Error(`No save in slot "${slot}"`)
  return decompressWorld(record.payload, record.checksum)
}

export async function deleteSlot(slot: string): Promise<void> {
  const database = await db()
  await reqToPromise(tx(database, STORE, 'readwrite').objectStore(STORE).delete(slot))
}

/**
 * Write a named slot AND refresh the careers row in one transaction (TB-03's "record and metadata
 * cannot diverge", applied to the manual path too). The record stamps the committed `revision` it
 * captured. A named write is the player's explicit act on a slot of their own naming, so it is
 * never CAS-refused – but the careers row only moves FORWARD: `week`/`revision` update only when
 * this write's revision is not behind the row (a named save from a stale tab must not regress the
 * career list's resume pointer), while `lastPlayedAt` always bumps (saving is playing).
 */
export async function writeNamed(world: WorldState, name: string, revision: number): Promise<SlotMeta> {
  const { payload, checksum } = await compressWorld(world)
  const savedAt = nextSavedAt()
  const database = await db()

  return new Promise<SlotMeta>((resolve, reject) => {
    const transaction = tx(database, [STORE, CAREERS], 'readwrite')
    let out: SlotMeta | null = null
    transaction.oncomplete = () =>
      out ? resolve(out) : reject(new Error('Named save finished without writing'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Named save aborted'))
    transaction.onerror = () => {
      /* the abort that follows carries transaction.error */
    }

    const record: SaveRecord = {
      slot: namedSlot(world.careerId, name),
      careerId: world.careerId,
      savedAt,
      week: world.week,
      seed: world.seed,
      bytes: payload.byteLength,
      kidName: world.profile.kidName,
      country: world.profile.country,
      revision,
      checksum,
      payload,
    }
    transaction.objectStore(STORE).put(record)

    const careers = transaction.objectStore(CAREERS)
    const metaReq = careers.get(world.careerId)
    metaReq.onsuccess = () => {
      const existing = metaReq.result as CareerMeta | undefined
      const ahead = revision >= (existing?.revision ?? 0)
      careers.put({
        careerId: world.careerId,
        kidName: world.profile.kidName,
        country: world.profile.country,
        seed: world.seed,
        createdAt: existing?.createdAt ?? savedAt,
        lastPlayedAt: savedAt,
        week: ahead ? world.week : (existing?.week ?? world.week),
        revision: ahead ? revision : existing?.revision,
        // One clock, on the Careers list too (09.08) – the row printed the band before this.
        birthMonth: world.profile.birthMonth,
        birthDay: world.profile.birthDay,
      } satisfies CareerMeta)
      out = toMeta(record)
    }
  })
}

// --- autosave (two alternating generations) ----------------------------------

// ⚠ The old `autosave(world)` – write record, then careers row, in two separate transactions with
// no revision anywhere – is GONE, replaced by the two commits below. Its callers (every worker
// mutation) now go through the candidate-commit path in sim.worker.ts, which is what makes "the
// response said ok" and "the bytes are durable" the same statement.

/** Commit the next revision of a career the caller is already playing (CAS mode – see
 *  runAutosaveTx). `revision` must be the caller's committed revision + 1. */
export async function commitAutosave(world: WorldState, revision: number): Promise<SlotMeta> {
  const { meta } = await runAutosaveTx(world, { mode: 'cas', revision })
  return meta
}

/** Commit a world that arrived from OUTSIDE the disk lineage (new career, imported file):
 *  allocates disk revision + 1 inside the transaction and returns it for the caller to adopt. */
export async function adoptAutosave(world: WorldState): Promise<{ meta: SlotMeta; revision: number }> {
  return runAutosaveTx(world, { mode: 'adopt' })
}

/**
 * Read the latest autosave for a career: try the newer generation first, and on a
 * checksum/decode failure fall back to the older one. `recovered` is true only when that
 * fallback actually happened (the newer generation existed but was unreadable).
 *
 * "Newer" is decided by committed revision (savedAt only for pre-revision records – see recNewer):
 * the revision is the commit order by construction, while savedAt is a wall clock.
 *
 * `revision` is the ADOPTION POINT for the caller's committed-revision counter: the highest
 * revision known on disk for this career – whichever generation actually loaded – so the next
 * CAS commit (adopted + 1) is ahead of everything, including a newer-but-corrupt generation the
 * fallback skipped (adopting the LOADED record's revision there would wedge every later commit
 * against the corpse's higher number).
 */
export async function readLatestAutosave(
  careerId: string,
): Promise<{ world: WorldState; recovered: boolean; revision: number }> {
  // One readonly transaction for all three rows: a commit from another tab cannot interleave a
  // torn view of generation pair + careers row into this read.
  const database = await db()
  const transaction = tx(database, [STORE, CAREERS], 'readonly')
  const saves = transaction.objectStore(STORE)
  const [recA, recB, meta] = (await Promise.all([
    reqToPromise(saves.get(autoSlot(careerId, 'a'))),
    reqToPromise(saves.get(autoSlot(careerId, 'b'))),
    reqToPromise(transaction.objectStore(CAREERS).get(careerId)),
  ])) as [SaveRecord | undefined, SaveRecord | undefined, CareerMeta | undefined]

  const gens = [recA, recB]
    .filter((r): r is SaveRecord => r !== undefined)
    .sort((a, b) => (recNewer(a, b) ? -1 : 1)) // newest first

  if (gens.length === 0) throw new Error(`No autosave for career "${careerId}"`)
  const revision = Math.max(meta?.revision ?? 0, ...gens.map((g) => g.revision ?? 0))

  try {
    const world = await decompressWorld(gens[0].payload, gens[0].checksum)
    return { world, recovered: false, revision }
  } catch (err) {
    if (gens.length > 1) {
      const world = await decompressWorld(gens[1].payload, gens[1].checksum)
      return { world, recovered: true, revision }
    }
    throw err
  }
}
