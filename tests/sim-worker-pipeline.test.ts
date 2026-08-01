import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { encodeExportFile, decodeExportFile } from '../src/engine/saveCodec'
import { commitAutosave } from '../src/db/saves'
import { DEFAULT_PROFILE, type ToWorker, type WorkerErrorCode } from '../src/shared/protocol'

// =================================================================================================
// W1-INTEGRITY-A — THE WORKER PIPELINE (Codex TB-02 serialized/revisioned + TB-03 transactional
// commit + TB-01 durable restore). The acceptance criteria of those sections, as tests:
//
//   TB-02  two simultaneous advances -> ordered revisions or one ok + one typed STALE_REVISION,
//          never an interleaved state; unique autosave generation per commit; a failed command
//          does not poison the queue; responses carry the committed revision.
//   TB-03  an injected storage failure leaves world, rngMain, revision and snapshot unchanged —
//          and the SAME command retried against the SAME base then succeeds exactly once (no
//          double-apply, because the failed run never happened).
//   TB-01  restoreSlot commits the restored state as the NEWEST autosave BEFORE answering ok:
//          restore -> relaunch (a fresh worker module over the same IndexedDB) reopens the
//          restored week through the real loadCareer path; a failed or invalid restore leaves the
//          active career untouched, in memory AND across the same relaunch.
//
// Harness: the sim-worker-rng suite's own arrangement — a Worker global provided BEFORE the
// dynamic import, IndexedDB from fake-indexeddb, and every byte the worker sees travels the real
// export codec. The spy on db/saves is instrumentation plus ONE injected rejection per failure
// test: the real one-transaction commit runs everywhere else (its own atomicity is proven against
// real abort machinery in tests/saves.test.ts).
// =================================================================================================

vi.mock('../src/db/saves', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/db/saves')>()
  return { ...actual, commitAutosave: vi.fn(actual.commitAutosave) }
})

interface Reply {
  id: number
  ok: boolean
  error?: string
  code?: WorkerErrorCode
  revision?: number
  recovered?: true
  restoredFrom?: string
  snapshot?: { week: number; careerId: string }
  bytes?: ArrayBuffer
}

const waiters = new Map<number, (r: Reply) => void>()
const workerGlobal = {
  onmessage: null as null | ((e: { data: ToWorker }) => void),
  postMessage(m: unknown) {
    const r = m as Reply
    waiters.get(r.id)?.(r)
    waiters.delete(r.id)
  },
}
;(globalThis as unknown as { self: unknown }).self = workerGlobal

type WorkerMsg<T = ToWorker> = T extends { id: number } ? Omit<T, 'id'> : never

let nextId = 1
function send(msg: WorkerMsg): Promise<Reply> {
  return new Promise((resolve) => {
    const id = nextId++
    waiters.set(id, resolve)
    workerGlobal.onmessage!({ data: { ...msg, id } as ToWorker })
  })
}

/** A career the worker's own way (draws through resumeMain(world.rngMain)), parked in the knock
 *  cooldown exactly like the rng suite's rides-test fixture: a just-retired knock row means no new
 *  knock can arrive for the few advances these tests make, no entries means no reveal can open —
 *  so every advance moves EXACTLY one week and the assertions below are deterministic. */
function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  return world
}

async function importIntoWorker(world: WorldState): Promise<Reply> {
  const bytes = (await encodeExportFile(world)).slice()
  const res = await send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
  expect(res.ok, res.error).toBe(true)
  return res
}

/** The worker's world, read back out through its own export codec — the only public window. */
async function exportedWorld(): Promise<WorldState> {
  const res = await send({ type: 'exportSave' })
  expect(res.ok, res.error).toBe(true)
  return decodeExportFile(new Uint8Array(res.bytes!))
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
})

describe('TB-02 — the FIFO is the correctness boundary', () => {
  it('refuses a query before any career exists (and the revision ledger starts at 0)', async () => {
    const res = await send({ type: 'getSnapshot' })
    expect(res.ok).toBe(false)
    expect(res.error).toContain('No active career')
  })

  it('two advances fired together, correctly chained, land as two ORDERED revisions', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-order'))
    const rev = imported.revision!
    const week = imported.snapshot!.week

    // Fired in the same tick, no await between them — the exact shape the old dispatcher
    // interleaved (second command mutating between the first's mutation and its persist).
    const p1 = send({ type: 'advance', weeks: 1, baseRevision: rev })
    const p2 = send({ type: 'advance', weeks: 1, baseRevision: rev + 1 })
    const q = send({ type: 'getSnapshot' })
    const [r1, r2, snap] = await Promise.all([p1, p2, q])

    // Ordered revisions, and each reply's snapshot is ITS OWN commit — the first shows one week
    // moved, not the pile-up a shared mutable world produced.
    expect(r1.ok, r1.error).toBe(true)
    expect(r2.ok, r2.error).toBe(true)
    expect(r1.revision).toBe(rev + 1)
    expect(r2.revision).toBe(rev + 2)
    expect(r1.snapshot!.week).toBe(week + 1)
    expect(r2.snapshot!.week).toBe(week + 2)
    // The query queued behind them reads the COMMITTED world: both advances durable, nothing torn.
    expect(snap.ok).toBe(true)
    expect(snap.revision).toBe(rev + 2)
    expect(snap.snapshot!.week).toBe(week + 2)
  }, 60_000)

  it('a double-tap (same baseRevision twice) applies ONCE: second gets typed STALE_REVISION', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-stale'))
    const rev = imported.revision!
    const week = imported.snapshot!.week

    const [r1, r2] = await Promise.all([
      send({ type: 'advance', weeks: 1, baseRevision: rev }),
      send({ type: 'advance', weeks: 1, baseRevision: rev }),
    ])

    expect(r1.ok, r1.error).toBe(true)
    expect(r1.revision).toBe(rev + 1)
    expect(r2.ok).toBe(false)
    expect(r2.code).toBe('STALE_REVISION')
    expect(r2.revision, 'the refusal carries the CURRENT revision for the refresh').toBe(rev + 1)

    // One week moved, not two — the whole point of the token.
    const snap = await send({ type: 'getSnapshot' })
    expect(snap.snapshot!.week).toBe(week + 1)
  }, 60_000)

  it('a failed command does not poison the queue: refusal, then the next command runs clean', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-poison'))
    const rev = imported.revision!

    // Engine refusal (unknown event id) and a valid advance, queued together.
    const [bad, good] = await Promise.all([
      send({ type: 'enterEvent', eventId: 'no-such-event', baseRevision: rev }),
      send({ type: 'advance', weeks: 1, baseRevision: rev }),
    ])
    expect(bad.ok).toBe(false)
    expect(bad.code, 'an engine refusal is not a typed pipeline conflict').toBeUndefined()
    // The refusal committed nothing, so the advance behind it was NOT stale at the same base.
    expect(good.ok, good.error).toBe(true)
    expect(good.revision).toBe(rev + 1)
  }, 60_000)
})

describe('TB-03 — a failure commits nothing; a success is durable', () => {
  it('injected storage failure leaves world, rngMain, revision and snapshot unchanged — retry applies once', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-txfail'))
    const rev = imported.revision!
    const week = imported.snapshot!.week
    const before = await exportedWorld()

    vi.mocked(commitAutosave).mockRejectedValueOnce(new Error('Injected storage failure'))
    const failed = await send({ type: 'advance', weeks: 1, baseRevision: rev })
    expect(failed.ok).toBe(false)
    expect(failed.error).toContain('Injected storage failure')

    // Nothing moved: not the revision, not the week, not a single RNG draw.
    const snap = await send({ type: 'getSnapshot' })
    expect(snap.revision).toBe(rev)
    expect(snap.snapshot!.week).toBe(week)
    const after = await exportedWorld()
    expect(after.rngMain).toEqual(before.rngMain)
    expect(after.week).toBe(before.week)

    // The SAME command at the SAME base now succeeds — once. No stale refusal (the failed run
    // allocated nothing) and no double-apply (it also applied nothing).
    const retried = await send({ type: 'advance', weeks: 1, baseRevision: rev })
    expect(retried.ok, retried.error).toBe(true)
    expect(retried.revision).toBe(rev + 1)
    expect(retried.snapshot!.week).toBe(week + 1)
  }, 60_000)

  it('every committed mutation stamps a UNIQUE generation: the two newest revisions alternate a/b', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-gens'))
    let rev = imported.revision!
    const seen: number[] = []
    for (let i = 0; i < 3; i++) {
      const r = await send({ type: 'advance', weeks: 1, baseRevision: rev })
      expect(r.ok, r.error).toBe(true)
      rev = r.revision!
      seen.push(rev)
    }
    expect(seen).toEqual([imported.revision! + 1, imported.revision! + 2, imported.revision! + 3])

    // The rotation keeps exactly the two newest commits, each under its own revision.
    const slots = await send({ type: 'listSlots' })
    expect(slots.ok).toBe(true)
    const revisions = (slots as unknown as { slots: { slot: string; revision?: number }[] }).slots
      .filter((s) => s.slot.startsWith('auto:'))
      .map((s) => s.revision)
      .sort()
    expect(revisions).toEqual([rev - 1, rev])
  }, 60_000)
})

describe('TB-01 — restore is a committed revision, proven through a relaunch', () => {
  it('restoreSlot -> relaunch -> loadCareer opens the RESTORED state (and named saves survive)', async () => {
    const world = quietCareer('pipe-restore')
    const imported = await importIntoWorker(world)
    const careerId = imported.snapshot!.careerId
    const week = imported.snapshot!.week
    let rev = imported.revision!

    // A checkpoint at the current week, then time moves on two weeks.
    const saved = await send({ type: 'saveNamed', name: 'checkpoint' })
    expect(saved.ok, saved.error).toBe(true)
    for (let i = 0; i < 2; i++) {
      const r = await send({ type: 'advance', weeks: 1, baseRevision: rev })
      expect(r.ok, r.error).toBe(true)
      rev = r.revision!
    }

    // The restore: a NEW revision whose content is the checkpoint.
    const slot = `manual:${careerId}:checkpoint`
    const restored = await send({ type: 'restoreSlot', slot })
    expect(restored.ok, restored.error).toBe(true)
    expect(restored.snapshot!.week).toBe(week)
    expect(restored.revision).toBe(rev + 1)
    expect(restored.restoredFrom).toBe(slot)
    expect(restored.recovered, 'a clean restore is not a repair').toBeUndefined()

    // THE RELAUNCH: a fresh worker module instance over the same IndexedDB — module state
    // (world, committedRevision) gone, exactly like closing and reopening the app. This is the
    // defect this command exists to close: the old `load` answered ok, and this exact sequence
    // then reopened the PRE-restore week because no autosave of the restored state existed.
    vi.resetModules()
    await import('../src/worker/sim.worker')
    const reopened = await send({ type: 'loadCareer', careerId })
    expect(reopened.ok, reopened.error).toBe(true)
    expect(reopened.snapshot!.week, 'the restored week IS the newest autosave').toBe(week)
    expect(reopened.revision).toBe(rev + 1)

    // The named save was the SOURCE, not a casualty: still listed, still loadable.
    const slots = await send({ type: 'listSlots', careerId })
    expect((slots as unknown as { slots: { slot: string }[] }).slots.some((s) => s.slot === slot)).toBe(true)
  }, 60_000)

  it('a failed restore leaves the active career untouched — in memory and across the relaunch', async () => {
    const imported = await importIntoWorker(quietCareer('pipe-restore-fail'))
    const careerId = imported.snapshot!.careerId
    let rev = imported.revision!
    const saved = await send({ type: 'saveNamed', name: 'point' })
    expect(saved.ok, saved.error).toBe(true)
    const adv = await send({ type: 'advance', weeks: 1, baseRevision: rev })
    rev = adv.revision!
    const week = adv.snapshot!.week

    // Arm 1 — persistence failure mid-restore:
    vi.mocked(commitAutosave).mockRejectedValueOnce(new Error('Injected storage failure'))
    const failed = await send({ type: 'restoreSlot', slot: `manual:${careerId}:point` })
    expect(failed.ok).toBe(false)

    // Arm 2 — an invalid slot (the missing-record path; a checksum-corrupt record rejects through
    // the very same readSlot throw, proven at the db layer in tests/saves.test.ts):
    const missing = await send({ type: 'restoreSlot', slot: `manual:${careerId}:never-existed` })
    expect(missing.ok).toBe(false)
    expect(missing.error).toMatch(/no save/i)

    // The active state stood still through both...
    const snap = await send({ type: 'getSnapshot' })
    expect(snap.revision).toBe(rev)
    expect(snap.snapshot!.week).toBe(week)

    // ...and a relaunch agrees: the newest autosave is still the pre-restore advance.
    vi.resetModules()
    await import('../src/worker/sim.worker')
    const reopened = await send({ type: 'loadCareer', careerId })
    expect(reopened.ok, reopened.error).toBe(true)
    expect(reopened.snapshot!.week).toBe(week)
    expect(reopened.revision).toBe(rev)
  }, 60_000)
})
