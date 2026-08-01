import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { createWorld, tickWeek, replayMainState, type WorldState } from '../src/engine/world'
import { resumeMain, mainStateConsistent, initMainState } from '../src/engine/rng'
import { encodeExportFile, decodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, type ToWorker } from '../src/shared/protocol'

// =================================================================================================
// v35 — THE WORKER'S RNG REGIME (docs/review/proposals/P3-rng-persistence.md).
//
// Three claims, each of which is the wave's acceptance list verbatim:
//   1. A load performs ZERO tickWeek calls — the persisted position is verified and resumed, and
//      the whole-career replay is GONE from the load paths. Proved at the module boundary with
//      spies, not with a grep: a regex can miss a re-import, a spy cannot.
//   2. A corrupted `rngMain` load still SUCCEEDS, through `recoverMainState`, and the snapshot
//      arrives carrying `recovered: true` — the same flag (and the same UI surfacing) the autosave
//      generation fallback has always used. Both corruption shapes are exercised: a pair that
//      breaks the s/n algebra, and a pair that satisfies it but fails the plausibility bound.
//   3. The position RIDES THE WORLD: after the worker ticks, its own export carries an advanced,
//      consistent pair — the autosave-by-construction property the module variable `rng` could
//      never give.
//
// Harness: the dev-fast-forward suite's own arrangement — a Worker global provided BEFORE the
// dynamic import, IndexedDB from fake-indexeddb, and every byte the worker sees travels the real
// export codec.
// =================================================================================================

// The spies sit on the module boundary the worker imports through. `importOriginal` keeps every
// other export live — this is instrumentation, not stubbing: the real tickWeek/replayMainState run,
// they just count.
vi.mock('../src/engine/world', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/world')>()
  return {
    ...actual,
    tickWeek: vi.fn(actual.tickWeek),
    replayMainState: vi.fn(actual.replayMainState),
  }
})

interface Reply {
  id: number
  ok: boolean
  error?: string
  recovered?: true
  snapshot?: { week: number }
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

/** A career built the worker's own way: draws through `resumeMain(world.rngMain)`, so the
 *  persisted pair is LIVE (n tracks every draw) exactly as a real save's would be. */
function liveCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

async function importIntoWorker(world: WorldState): Promise<Reply> {
  const bytes = (await encodeExportFile(world)).slice()
  return send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
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

describe('a load verifies and resumes — it never replays', () => {
  it('a 20-season import performs ZERO tickWeek calls and ZERO replays', async () => {
    const world = liveCareer('rng-regime-20s', 20 * 52)
    expect(world.rngMain.n).toBeGreaterThan(0)

    vi.mocked(tickWeek).mockClear()
    vi.mocked(replayMainState).mockClear()
    const res = await importIntoWorker(world)
    expect(res.ok, res.error).toBe(true)
    expect(res.snapshot!.week).toBe(20 * 52)
    // The acceptance line itself: no tick, no replay, no recovery — the pair verified and stood.
    expect(vi.mocked(tickWeek)).not.toHaveBeenCalled()
    expect(vi.mocked(replayMainState)).not.toHaveBeenCalled()
    expect(res.recovered).toBeUndefined()

    // ...and the position the worker holds is the position the save carried, to the draw.
    const held = await exportedWorld()
    expect(held.rngMain).toEqual(world.rngMain)
  }, 60_000)

  it('the position rides the world: ticking advances the persisted pair the next export carries', async () => {
    const world = liveCareer('rng-regime-rides', 10)
    // The W1-QUICK guard is LAW here too: `tick` refuses at entry on an open knock and stops
    // mid-loop on one that arrives. This test is about the position, not the guard, so the career
    // states "she had a knock last week" — retired row inside KNOCK_COOLDOWN_WEEKS (the
    // condition.test.ts fixture trick), nothing pending, nothing new for longer than the 3 ticks
    // below. A legitimate world, and it leaves the property under test the only thing in play.
    world.knock = null
    world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
    await importIntoWorker(world)

    const ticked = await send({ type: 'tick', weeks: 3 })
    expect(ticked.ok, ticked.error).toBe(true)

    const after = await exportedWorld()
    expect(after.week).toBe(13)
    // Strictly more draws than the save arrived with, and still algebraically consistent — the
    // in-place mutation reached the world that autosave/export serialise, with no mirror to forget.
    expect(after.rngMain.n).toBeGreaterThan(world.rngMain.n)
    expect(mainStateConsistent(after.seed, after.rngMain)).toBe(true)
  }, 60_000)
})

describe('corruption recovers, loudly', () => {
  it('a pair that breaks the s/n algebra loads via recovery with recovered: true', async () => {
    const world = liveCareer('rng-regime-corrupt', 30)
    world.rngMain = { s: (world.rngMain.s + 1) | 0, n: world.rngMain.n } // one bit of rot

    vi.mocked(replayMainState).mockClear()
    const res = await importIntoWorker(world)
    expect(res.ok, res.error).toBe(true)
    expect(res.recovered, 'the UI must be told the position was rebuilt').toBe(true)
    expect(vi.mocked(replayMainState)).toHaveBeenCalledTimes(1)

    // The repaired pair passes the verifier it just failed...
    const repaired = await exportedWorld()
    expect(mainStateConsistent(repaired.seed, repaired.rngMain)).toBe(true)
    // ...and is exactly the replay's best-effort answer for this career's length.
    expect(repaired.rngMain.n).toBeGreaterThan(0)
  }, 60_000)

  it('a pair that satisfies the algebra but fails the plausibility bound recovers too', async () => {
    const world = liveCareer('rng-regime-implausible', 10)
    // A position no 10-week career can have spent: algebraically valid (built by really drawing),
    // wildly over budget. This is the bound's arm of the verifier, not the algebra's.
    const st = initMainState(world.seed)
    const burn = resumeMain(st)
    for (let i = 0; i < 200_000; i++) burn()
    world.rngMain = st
    expect(mainStateConsistent(world.seed, world.rngMain)).toBe(true)

    const res = await importIntoWorker(world)
    expect(res.ok, res.error).toBe(true)
    expect(res.recovered).toBe(true)

    const repaired = await exportedWorld()
    expect(mainStateConsistent(repaired.seed, repaired.rngMain)).toBe(true)
  }, 60_000)

  it('a clean save never trips the fallback (no false alarms)', async () => {
    const world = liveCareer('rng-regime-clean', 30)
    const res = await importIntoWorker(world)
    expect(res.ok, res.error).toBe(true)
    expect(res.recovered).toBeUndefined()
  }, 60_000)
})
