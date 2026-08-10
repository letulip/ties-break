// ECON REACH – THE 14→18 PRO-PROXY HALF (~18s of the parent file's 56s, measured 02.08).
//
// ⚠ WHY ITS OWN FILE, and it is the same reason econ-reach itself was split out of econ-bench.
// vitest tracks each FILE as a task and birpc gives that task's ack a HARD-CODED 60s window
// (DEFAULT_TIMEOUT = 6e4, not configurable in 3.2.7). No single test here is long - the worst in the
// whole sim project is 18s - but the ack spans the FILE, so a file near 60s loses a coin-flip
// against a hard timeout and the project exits 1 with every test green. econ-reach measured 56s on
// one run and 72s on the next: over the line, from variance alone.
//
// NOTHING ELSE MOVED: same tests, same presets, same horizons, same assertions.
import { describe, it, expect, vi } from 'vitest'

// ⚠ SPLIT OUT OF tests/econ-bench.test.ts (P6 (d), chore/w1-quick-wins) — MOVED, NOT REWRITTEN.
// The reach-tracker describe alone was ~40s of Monte-Carlo on a fast machine, and birpc's
// HARD-CODED 60s RPC timeout (node_modules/birpc DEFAULT_TIMEOUT = 6e4, not configurable in
// vitest 3.2.7) fired while the fork's event loop sat blocked in it — `test:sim` exited 1 with
// every test green. No sim file may sit near the minute mark, so the tracker gets a file of its
// own, and the whole-PRESETS loops become it.each so the event loop yields between presets and no
// single test body can block tens of seconds on the weekly runner's slower cores.
// Every assertion, comment block, owner decision and RE-PIN note below is carried over verbatim.

// Whole-horizon career replays are deterministic but SLOW, and they sit close enough to vitest's
// 5s default that a busy run tips them over - the gate then goes red on timing, not on a claim.
// Same generous file-level timeout econ-bench and the fatigue bench carry, same reason.
vi.setConfig({ testTimeout: 240_000 })
import {
  runCareer,
  openCareer,
  stepCareerWeek,
  PRESETS,
  HORIZONS,
  REACH_PRO_RANK,
} from '../tools/econ-bench'
import { kidPoints } from '../src/engine/world'

/** The working family that BUYS a coach – the cell where the 14→18 pro proxy still splits the field
 *  (6 of 30 clear it under the grinder policy). `working` above is the self-coached one, whose
 *  careers reach 0 of 30 at that horizon: a real answer about that family, and a useless fixture for
 *  a case whose whole job is to fire BOTH branches of the tracker. */
const wealthy = PRESETS.find((p) => p.background === 'wealthy')!

const H18 = HORIZONS.find((h) => h.weeks === 208)!

describe('reach tracker – the 14→18 pro proxy', () => {
  //
  // ⚠ ONE CASE, TWO its SINCE THE FILE SPLIT: the fresh-career fixture below sat ABOVE the
  // per-preset loop inside a single `it`; converting that loop to it.each would have re-run a
  // one-time pin nine times, so the fixture keeps its own `it` and every assertion is unchanged.
  it('a fresh career starts at the tie floor, outside the pro rank, with no counting result', () => {
    const fresh = openCareer(wealthy, 0)
    expect(fresh.world.kidRank).toBe(120)
    expect(fresh.world.kidRank).toBeGreaterThan(REACH_PRO_RANK)
    expect(kidPoints(fresh.world, 'itf')).toBe(0) // ...and still no counting result
  })

  it.each(PRESETS)('the 14→18 pro proxy guards the rank arm with hasResults (no rank credit until a counting result) – $label', (preset) => {
    // reachedWeek(pro) must match an INDEPENDENT replay of the GUARDED predicate, and must NOT be the
    // week-1 degenerate value: the rank arm only fires once she owns a counting result (points > 0),
    // which mirrors the engine's `ranked = countingResults.length > 0` signal.
    for (const index of [0, 1, 2]) {
      const r = runCareer(preset, index, H18.weeks)
      const { world, rng } = openCareer(preset, index)
      let firstReach: number | null = null
      for (let i = 0; i < H18.weeks; i++) {
        stepCareerWeek(world, rng)
        const pts = kidPoints(world, 'itf')
        const hasResults = pts > 0 // == computeCountingResults(world).length > 0 (every kid result scores)
        // ⚠ ONE ARM SINCE 10.08 - the points arm was inert on all nine presets at every
        // threshold 60-600 and was removed rather than re-tuned. tools/econ-bench.ts carries
        // the measurement and what reviving it would need. This replay follows it exactly,
        // which is the whole point of the file: two readings of ONE predicate.
        const met = hasResults && world.kidRank <= REACH_PRO_RANK
        if (firstReach === null && met) firstReach = world.week
      }
      expect(r.reachedWeek).toBe(firstReach)
      expect(r.reachedWeek).not.toBe(1) // the guard kills the week-1 degeneracy (null or a real week)
      if (r.reachedWeek !== null) expect(r.reachedWeek).toBeGreaterThan(2) // only after a scoring result lands
    }
  })
})
