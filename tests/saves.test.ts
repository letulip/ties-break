import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  writeNamed,
  readSlot,
  listSlots,
  deleteSlot,
  commitAutosave,
  adoptAutosave,
  SaveConflictError,
  readLatestAutosave,
  listCareers,
  deleteCareer,
  closeDb,
} from '../src/db/saves'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { reqToPromise } from '../src/db/idb'
import { compressWorld } from '../src/engine/saveCodec'

// White-box: these are the DB name/store internal to src/db/saves.ts. Kept in sync deliberately
// so the migration + corruption tests can seed and tamper with raw records.
const DB_NAME = 'tennis-sim'
const STORE = 'saves'

function worldAt(seed: string, weeks: number, careerId?: string): WorldState {
  const world = createWorld(seed)
  if (careerId) world.careerId = careerId
  const rng = rngFromSeed(seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

function openRaw(version?: number, onUpgrade?: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = version === undefined ? indexedDB.open(DB_NAME) : indexedDB.open(DB_NAME, version)
    if (onUpgrade) req.onupgradeneeded = () => onUpgrade(req.result)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

// Each test starts from an empty database so the cached connection and monotonic clock reset.
beforeEach(async () => {
  await closeDb()
  await deleteDatabase()
})

describe('save slots (careers + generations)', () => {
  it('writes, lists, reads and deletes a named slot', async () => {
    const cid = 'c-basic'
    const world = worldAt('basic', 30, cid)
    const meta = await writeNamed(world, 'keep', 1)
    expect(meta.week).toBe(30)
    expect(meta.careerId).toBe(cid)
    expect(meta.bytes).toBeGreaterThan(0)

    const slots = await listSlots(cid)
    expect(slots.some((s) => s.slot === `manual:${cid}:keep`)).toBe(true)

    const restored = await readSlot(`manual:${cid}:keep`)
    expect(restored).toEqual(world)

    await deleteSlot(`manual:${cid}:keep`)
    await expect(readSlot(`manual:${cid}:keep`)).rejects.toThrow(/no save/i)
  })

  it('alternates autosave generations a,b,a and keeps both readable', async () => {
    const cid = 'c-alt'
    for (let i = 1; i <= 3; i++) await commitAutosave(worldAt('alt', i, cid), i)

    // gen a received save #1 then save #3; gen b received save #2
    expect((await readSlot(`auto:${cid}:a`)).week).toBe(3)
    expect((await readSlot(`auto:${cid}:b`)).week).toBe(2)

    const slots = await listSlots(cid)
    expect(slots).toHaveLength(2)
    // W1-INTEGRITY-A: each commit stamped its own revision on its generation – unique per commit.
    expect(slots.map((s) => s.revision).sort()).toEqual([2, 3])

    const latest = await readLatestAutosave(cid)
    expect(latest.recovered).toBe(false)
    expect(latest.world.week).toBe(3)
    expect(latest.revision).toBe(3)
  })

  it('falls back to the previous generation when the newer autosave is corrupted', async () => {
    const cid = 'c-corrupt'
    await commitAutosave(worldAt('cor', 1, cid), 1) // gen a
    await commitAutosave(worldAt('cor', 2, cid), 2) // gen b (newer)

    // Flip a byte in the newer generation's stored payload.
    const raw = await openRaw()
    const t = raw.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    const getReq = store.get(`auto:${cid}:b`)
    getReq.onsuccess = () => {
      const rec = getReq.result as { payload: Uint8Array }
      rec.payload[rec.payload.length - 5] ^= 0xff
      store.put(rec)
    }
    await txDone(t)
    raw.close()

    const { world, recovered, revision } = await readLatestAutosave(cid)
    expect(recovered).toBe(true)
    expect(world.week).toBe(1) // the intact older generation
    // The adoption point is the HIGHEST revision on disk, not the loaded record's own (1):
    // adopting 1 would make the next CAS commit (2) collide with the corrupt corpse forever.
    expect(revision).toBe(2)
  })

  it('⚠ E-12 – two generations that TIE resolve by insertion order, not by the comparator flipping', async () => {
    // ⭐ THE COMPARATOR, MADE A TOTAL ORDER (05.09 engine review). `readLatestAutosave` sorted with
    // `(a, b) => recNewer(a, b) ? -1 : 1` – a predicate wearing a comparator's clothes: it never
    // returns 0 and answers 1 for BOTH orders of a tied pair, which is not an ordering.
    //
    // ⚠⚠ AND THE HONEST VERSION OF WHY THIS ARM EXISTS, MEASURED RATHER THAN ASSUMED: the old
    // spelling and the new one produce the SAME answer here, so this arm does NOT redden on the
    // unfixed tree and no arm could. V8 sorts a two-element array by binary insertion and asks
    // `comparefn(later, earlier)`; a comparator that always answers 1 therefore leaves the pair
    // alone (`[a,b].sort(() => 1)` is `[a,b]`, checked on node v26). The defect is one of FORM, and
    // the fix's value is that a comparator which is a total order cannot go wrong when the array
    // grows, when the engine changes, or when somebody copies it.
    //
    // ⚠ SO WHAT THIS ARM PINS IS THE ORDERING CONTRACT ITSELF – a tie resolves to insertion order –
    // and it is mutation-verified against the mistake that IS reachable: making the tie answer -1
    // reddens it with «a tied pair must not be reordered: expected 9 to be 4».
    //
    // ⚠ A TIE NEEDS BOTH HALVES OF `recNewer` TO TIE – same revision AND same `savedAt` – so the
    // commit path cannot produce one and this arm writes the rows itself, exactly as the migration
    // and corruption arms above do. That is the point rather than a caveat: an ordering rule whose
    // wrong case is unreachable by the writer is one that survives being copied somewhere reachable.
    const cid = 'c-tied-generations'
    await commitAutosave(worldAt('tied', 4, cid), 1) // gen a
    await commitAutosave(worldAt('tied', 9, cid), 2) // gen b

    const raw = await openRaw()
    const t = raw.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    const bReq = store.get(`auto:${cid}:b`)
    bReq.onsuccess = () => {
      const b = bReq.result as { revision: number; savedAt: number }
      const aReq = store.get(`auto:${cid}:a`)
      aReq.onsuccess = () => {
        // Give `a` the same revision and the same clock reading as `b`: neither arm of `recNewer`
        // can separate them any more.
        const a = aReq.result as { revision: number; savedAt: number }
        a.revision = b.revision
        a.savedAt = b.savedAt
        store.put(a)
      }
    }
    await txDone(t)
    raw.close()

    // ⚠ THE INSTRUMENT FIRST: the two rows really do tie on BOTH arms of `recNewer`, or the arm
    // below is asserting nothing about ordering at all.
    const check = await openRaw()
    const ct = check.transaction(STORE, 'readonly')
    const [rowA, rowB] = (await Promise.all([
      reqToPromise(ct.objectStore(STORE).get(`auto:${cid}:a`)),
      reqToPromise(ct.objectStore(STORE).get(`auto:${cid}:b`)),
    ])) as { revision: number; savedAt: number }[]
    check.close()
    expect(rowA.revision, 'the pair must tie on revision').toBe(rowB.revision)
    expect(rowA.savedAt, 'and on savedAt').toBe(rowB.savedAt)

    // `readLatestAutosave` reads [a, b] in that order and sorts. Under a total order a tie is left
    // alone, so the FIRST row read wins – generation a, week 4.
    const latest = await readLatestAutosave(cid)
    expect(latest.recovered).toBe(false)
    expect(latest.world.week, 'a tied pair must not be reordered').toBe(4)
    // ...and the adoption point is still the highest revision on disk, tie or no tie.
    expect(latest.revision).toBe(2)
  })

  it('isolates careers: five autosaves each keep two slots and never evict across careers', async () => {
    const A = 'c-alpha'
    const B = 'c-beta'
    for (let i = 1; i <= 5; i++) await commitAutosave(worldAt('alpha', i, A), i)
    for (let i = 1; i <= 5; i++) await commitAutosave(worldAt('beta', i, B), i)

    expect(await listSlots(A)).toHaveLength(2)
    expect(await listSlots(B)).toHaveLength(2)

    // both careers survive independently
    expect((await listCareers()).map((c) => c.careerId).sort()).toEqual([A, B])

    // deleting one career removes only its rows + its meta
    await deleteCareer(A)
    expect(await listSlots(A)).toHaveLength(0)
    expect(await listSlots(B)).toHaveLength(2)
    expect((await listCareers()).map((c) => c.careerId)).toEqual([B])
  })

  it('overwrites a named save in place (name sanitized)', async () => {
    const cid = 'c-named'
    await writeNamed(worldAt('nm', 5, cid), 'My Slot!!', 1)
    await writeNamed(worldAt('nm', 9, cid), 'My Slot!!', 2)

    const named = (await listSlots(cid)).filter((s) => s.slot.startsWith('manual:'))
    expect(named).toHaveLength(1)
    expect(named[0].slot).toBe(`manual:${cid}:myslot`)
    expect((await readSlot(named[0].slot)).week).toBe(9)
  })

  // --- W1-INTEGRITY-A: the CAS + one-transaction commit ---------------------------------------

  it('CAS: a commit at a revision the disk already holds is refused, and refused ATOMICALLY', async () => {
    const cid = 'c-cas'
    await commitAutosave(worldAt('cas', 3, cid), 1)
    await commitAutosave(worldAt('cas', 7, cid), 2)

    // A stale writer (same career loaded earlier, e.g. another tab) tries to commit revision 2
    // again with different content. The refusal must be the TYPED conflict…
    await expect(commitAutosave(worldAt('cas', 99, cid), 2)).rejects.toBeInstanceOf(SaveConflictError)
    await expect(commitAutosave(worldAt('cas', 99, cid), 2)).rejects.toMatchObject({
      diskRevision: 2,
      attemptedRevision: 2,
    })

    // …and because record + careers row ride ONE transaction that the CAS aborts, NEITHER moved:
    // the same real abort machinery any storage failure takes, exercised end to end.
    const latest = await readLatestAutosave(cid)
    expect(latest.world.week).toBe(7)
    expect(latest.revision).toBe(2)
    const meta = (await listCareers()).find((c) => c.careerId === cid)
    expect(meta?.revision).toBe(2)
    expect(meta?.week).toBe(7)
    const weeks = (await listSlots(cid)).map((s) => s.week).sort()
    expect(weeks).toEqual([3, 7]) // week-99 bytes exist nowhere
  })

  it('adopt: a world from outside the disk lineage (import) appends disk+1 instead of clobbering', async () => {
    const cid = 'c-adopt'
    // Fresh career: nothing on disk yet -> revision 1.
    const fresh = await adoptAutosave(worldAt('ad', 1, cid))
    expect(fresh.revision).toBe(1)
    await commitAutosave(worldAt('ad', 2, cid), 2)

    // Importing an OLD export of the same career (its file knows nothing about revisions):
    // the adopt allocates 3 – the import becomes the newest state without erasing the lineage.
    const imported = await adoptAutosave(worldAt('ad', 1, cid))
    expect(imported.revision).toBe(3)
    const latest = await readLatestAutosave(cid)
    expect(latest.revision).toBe(3)
    expect(latest.world.week).toBe(1)
  })

  it('newest-generation choice follows REVISION, not the wall clock', async () => {
    const cid = 'c-revorder'
    await commitAutosave(worldAt('ro', 4, cid), 1)
    await commitAutosave(worldAt('ro', 5, cid), 2)

    // Rewind the newer generation's savedAt below the older one's – the kind of lie a clock
    // jump (or two module instances' monotonic counters) can tell. Revision must still win.
    const raw = await openRaw()
    const t = raw.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    for (const gen of ['a', 'b'] as const) {
      const req = store.get(`auto:${cid}:${gen}`)
      req.onsuccess = () => {
        const rec = req.result as { revision?: number; savedAt: number } | undefined
        if (rec?.revision === 2) {
          rec.savedAt = 1 // long "before" revision 1's timestamp
          store.put(rec)
        }
      }
    }
    await txDone(t)
    raw.close()

    const latest = await readLatestAutosave(cid)
    expect(latest.world.week).toBe(5)
    expect(latest.revision).toBe(2)
    expect(latest.recovered).toBe(false)
  })

  it('migrates a v1 database to v2: career-scoped slots + backfilled careers', async () => {
    // Build real pre-K1 (v4-schema, DB v1) records so the migrated slots are decodable.
    async function legacyRecord(slot: string, seed: string, weeks: number, savedAt: number) {
      const world = worldAt(seed, weeks)
      const v4 = { ...world, schemaVersion: 4 } as Record<string, unknown>
      delete v4.careerId
      const { payload, checksum } = await compressWorld(v4 as unknown as WorldState)
      return { slot, savedAt, week: weeks, seed, bytes: payload.byteLength, checksum, payload }
    }

    const legacy = [
      await legacyRecord('auto-0', 'oldseed', 1, 100),
      await legacyRecord('auto-1', 'oldseed', 2, 200),
      await legacyRecord('auto-2', 'oldseed', 3, 300),
      await legacyRecord('manual', 'oldseed', 3, 250),
    ]

    // Seed a v1-shaped database directly (old schema: single `saves` store, no careers).
    const raw = await openRaw(1, (db) => db.createObjectStore(STORE, { keyPath: 'slot' }))
    const seedTx = raw.transaction(STORE, 'readwrite')
    for (const rec of legacy) seedTx.objectStore(STORE).put(rec)
    await txDone(seedTx)
    raw.close()

    // Opening through the v2 code path triggers onupgradeneeded v<2.
    const careers = await listCareers()
    expect(careers).toHaveLength(1)
    expect(careers[0]).toMatchObject({
      careerId: 'legacy-oldseed',
      kidName: 'Vera',
      country: 'US',
      seed: 'oldseed',
      week: 3,
    })
    expect(careers[0].createdAt).toBe(100)
    expect(careers[0].lastPlayedAt).toBe(300)

    // Old slots are now career-scoped: two newest autosaves become generations, named save renamed.
    const slots = await listSlots('legacy-oldseed')
    const slotKeys = slots.map((s) => s.slot).sort()
    expect(slotKeys).toEqual([
      'auto:legacy-oldseed:a',
      'auto:legacy-oldseed:b',
      'manual:legacy-oldseed:manual',
    ])

    // Newer generation (was auto-2, week 3) and older (was auto-1, week 2) both decode.
    const newer = await readSlot('auto:legacy-oldseed:b')
    expect(newer.week).toBe(3)
    expect(newer.careerId).toBe('legacy-oldseed')
    expect((await readSlot('auto:legacy-oldseed:a')).week).toBe(2)

    const latest = await readLatestAutosave('legacy-oldseed')
    expect(latest.recovered).toBe(false)
    expect(latest.world.week).toBe(3)
  })
})
