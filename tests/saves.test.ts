import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  writeNamed,
  readSlot,
  listSlots,
  deleteSlot,
  autosave,
  readLatestAutosave,
  listCareers,
  deleteCareer,
  closeDb,
} from '../src/db/saves'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
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
    const meta = await writeNamed(world, 'keep')
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
    for (let i = 1; i <= 3; i++) await autosave(worldAt('alt', i, cid))

    // gen a received save #1 then save #3; gen b received save #2
    expect((await readSlot(`auto:${cid}:a`)).week).toBe(3)
    expect((await readSlot(`auto:${cid}:b`)).week).toBe(2)

    const slots = await listSlots(cid)
    expect(slots).toHaveLength(2)

    const latest = await readLatestAutosave(cid)
    expect(latest.recovered).toBe(false)
    expect(latest.world.week).toBe(3)
  })

  it('falls back to the previous generation when the newer autosave is corrupted', async () => {
    const cid = 'c-corrupt'
    await autosave(worldAt('cor', 1, cid)) // gen a
    await autosave(worldAt('cor', 2, cid)) // gen b (newer)

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

    const { world, recovered } = await readLatestAutosave(cid)
    expect(recovered).toBe(true)
    expect(world.week).toBe(1) // the intact older generation
  })

  it('isolates careers: five autosaves each keep two slots and never evict across careers', async () => {
    const A = 'c-alpha'
    const B = 'c-beta'
    for (let i = 1; i <= 5; i++) await autosave(worldAt('alpha', i, A))
    for (let i = 1; i <= 5; i++) await autosave(worldAt('beta', i, B))

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
    await writeNamed(worldAt('nm', 5, cid), 'My Slot!!')
    await writeNamed(worldAt('nm', 9, cid), 'My Slot!!')

    const named = (await listSlots(cid)).filter((s) => s.slot.startsWith('manual:'))
    expect(named).toHaveLength(1)
    expect(named[0].slot).toBe(`manual:${cid}:myslot`)
    expect((await readSlot(named[0].slot)).week).toBe(9)
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
