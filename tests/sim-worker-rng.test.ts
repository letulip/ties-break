import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import {
  createWorld,
  tickWeek,
  replayMainState,
  maxMainDraws,
  MAIN_DRAWS_PER_WEEK_MAX,
  type WorldState,
} from '../src/engine/world'
import { COHORT_SIZE } from '../src/engine/season/cohort'
import { resumeMain, mainStateConsistent, initMainState } from '../src/engine/rng'
import { encodeExportFile, decodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { workerHarness } from './helpers/workerHarness'

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
  /** W1-INTEGRITY-A: every ok reply carries the committed revision; mutations must send it back */
  revision?: number
}

// ⚠ TOP LEVEL, AND IT MUST STAY TOP LEVEL: the factory assigns `globalThis.self`, and the worker
// module reads it while evaluating – which is why the import of it below is dynamic.
const { send, workerGlobal } = workerHarness<Reply>()

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
    const imported = await importIntoWorker(world)

    // W1-INTEGRITY-A: a mutation carries the revision it was decided against – the import reply's.
    const ticked = await send({ type: 'tick', weeks: 3, baseRevision: imported.revision! })
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

// =================================================================================================
// ⭐⭐ E-04 (05.09 ENGINE REVIEW) – THE BOUND, RELATED TO THE TICK THAT HAS TO FIT INSIDE IT.
//
// `maxMainDraws` had two tests and both compared STORED FIXTURES to it (`goldenSaves`,
// `e2e-fixtures`). Nothing compared it to what a week of the LIVE tick actually spends – and
// measured, the answer was 799.06 draws a week against a bound of 804: a margin of five draws,
// 0.6 %. The failure that margin invites is quiet and expensive. A wave that adds one MAIN draw per
// rival updates the frozen capture as CLAUDE.md prescribes and ships green; from then on every
// career more than a few weeks old fails the plausibility bound on EVERY load, is replayed under
// current code on every load – the O(career) path v35 retired – and shows the repair flag every
// time. Nothing in the suite would have said a word.
//
// ⚠ THIS ARM IS THE THING THAT WOULD SAY IT, AND IT IS A RATIO, NOT A LITERAL. It measures the
// tick's real per-week cost and asserts the bound is at least 1.25× it, so it fails on the wave that
// eats the slack rather than on the wave that changes a number. Mutate to see it: set
// `MAIN_DRAWS_FLAT_PER_WEEK` back to 8 (804/week) and the 1.25 headroom is gone.
// =================================================================================================
describe('the bound is slack the tick can grow into', () => {
  const WEEKS = 52
  /** The headroom E-04 asks the bound to keep: room for half again the tick's whole weekly cost,
   *  so a wave that adds a draw per rival does not silently turn every load into a replay. */
  const REQUIRED_HEADROOM = 1.25

  it('one week of the live tick costs well under the bound one week is given', () => {
    // The cost is MEASURED, from a career walked the worker's own way, never quoted: the whole
    // point of the arm is that the number moves when the tick's draw count moves.
    const world = liveCareer('rng-budget', WEEKS)
    const perWeek = world.rngMain.n / WEEKS
    // The instrument first – a walk that stopped drawing would make the assertion vacuous.
    expect(perWeek, 'the probe must actually spend MAIN draws').toBeGreaterThan(100)
    expect(
      perWeek * REQUIRED_HEADROOM,
      `a week costs ${perWeek.toFixed(2)} draws and the bound gives ${MAIN_DRAWS_PER_WEEK_MAX}`,
    ).toBeLessThanOrEqual(MAIN_DRAWS_PER_WEEK_MAX)
  }, 60_000)

  it('and `maxMainDraws` is that per-week number, scaled – the two cannot drift apart', () => {
    // The named constant and the function are one statement about the budget, not two: a wave that
    // widens one and forgets the other is exactly the drift this item is about.
    expect(maxMainDraws(1, COHORT_SIZE)).toBe(MAIN_DRAWS_PER_WEEK_MAX)
    expect(maxMainDraws(10, COHORT_SIZE)).toBe(10 * MAIN_DRAWS_PER_WEEK_MAX)
    // ...and the COHORT_SIZE floor still holds, which is what lets a v6-era fixture with a trimmed
    // cohort be judged against the field its position was really drawn against.
    expect(maxMainDraws(1, 3)).toBe(MAIN_DRAWS_PER_WEEK_MAX)
    expect(maxMainDraws(1, COHORT_SIZE * 2)).toBeGreaterThan(MAIN_DRAWS_PER_WEEK_MAX)
  })
})
