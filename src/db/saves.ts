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
  dbPromise ??= openDB(DB_NAME, DB_VERSION, (database, oldVersion, tx) => {
    if (oldVersion < 1) {
      database.createObjectStore(STORE, { keyPath: 'slot' })
    }
    if (oldVersion < 2) {
      const careers = database.objectStoreNames.contains(CAREERS)
        ? tx.objectStore(CAREERS)
        : database.createObjectStore(CAREERS, { keyPath: 'careerId' })
      migrateV1toV2(tx.objectStore(STORE), careers)
    }
  })
  return dbPromise
}

// v1 -> v2, in place inside the versionchange transaction (IDB requests only, no awaits):
//   * every record gains careerId = 'legacy-' + seed, plus kidName/country = DEFAULT_PROFILE ('Vera'/'US')
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
  return { slot: r.slot, careerId: r.careerId, savedAt: r.savedAt, week: r.week, seed: r.seed, bytes: r.bytes }
}

async function buildRecord(slot: string, world: WorldState): Promise<SaveRecord> {
  const { payload, checksum } = await compressWorld(world)
  return {
    slot,
    careerId: world.careerId,
    savedAt: nextSavedAt(),
    week: world.week,
    seed: world.seed,
    bytes: payload.byteLength,
    kidName: world.profile.kidName,
    country: world.profile.country,
    checksum,
    payload,
  }
}

async function getRecord(slot: string): Promise<SaveRecord | undefined> {
  const database = await db()
  return (await reqToPromise(tx(database, STORE, 'readonly').objectStore(STORE).get(slot))) as
    | SaveRecord
    | undefined
}

async function putRecord(record: SaveRecord): Promise<void> {
  const database = await db()
  await reqToPromise(tx(database, STORE, 'readwrite').objectStore(STORE).put(record))
}

// --- careers -----------------------------------------------------------------

export async function listCareers(): Promise<CareerMeta[]> {
  const database = await db()
  const rows = (await reqToPromise(tx(database, CAREERS, 'readonly').objectStore(CAREERS).getAll())) as CareerMeta[]
  return rows.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
}

async function upsertCareer(world: WorldState, playedAt: number): Promise<void> {
  const database = await db()
  const store = tx(database, CAREERS, 'readwrite').objectStore(CAREERS)
  const existing = (await reqToPromise(store.get(world.careerId))) as CareerMeta | undefined
  const meta: CareerMeta = {
    careerId: world.careerId,
    kidName: world.profile.kidName,
    country: world.profile.country,
    seed: world.seed,
    createdAt: existing?.createdAt ?? playedAt,
    lastPlayedAt: playedAt,
    week: world.week,
  }
  await reqToPromise(store.put(meta))
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

export async function writeNamed(world: WorldState, name: string): Promise<SlotMeta> {
  const record = await buildRecord(namedSlot(world.careerId, name), world)
  await putRecord(record)
  await upsertCareer(world, record.savedAt)
  return toMeta(record)
}

// --- autosave (two alternating generations) ----------------------------------

/** Write to the older generation (a/b), then refresh the career's meta. */
export async function autosave(world: WorldState): Promise<SlotMeta> {
  const recA = await getRecord(autoSlot(world.careerId, 'a'))
  const recB = await getRecord(autoSlot(world.careerId, 'b'))
  let gen: Generation
  if (!recA) gen = 'a'
  else if (!recB) gen = 'b'
  else gen = recA.savedAt <= recB.savedAt ? 'a' : 'b'

  const record = await buildRecord(autoSlot(world.careerId, gen), world)
  await putRecord(record)
  await upsertCareer(world, record.savedAt)
  return toMeta(record)
}

/**
 * Read the latest autosave for a career: try the newer generation first, and on a
 * checksum/decode failure fall back to the older one. `recovered` is true only when that
 * fallback actually happened (the newer generation existed but was unreadable).
 */
export async function readLatestAutosave(careerId: string): Promise<{ world: WorldState; recovered: boolean }> {
  const gens = [await getRecord(autoSlot(careerId, 'a')), await getRecord(autoSlot(careerId, 'b'))]
    .filter((r): r is SaveRecord => r !== undefined)
    .sort((a, b) => b.savedAt - a.savedAt) // newest first

  if (gens.length === 0) throw new Error(`No autosave for career "${careerId}"`)

  try {
    const world = await decompressWorld(gens[0].payload, gens[0].checksum)
    return { world, recovered: false }
  } catch (err) {
    if (gens.length > 1) {
      const world = await decompressWorld(gens[1].payload, gens[1].checksum)
      return { world, recovered: true }
    }
    throw err
  }
}
