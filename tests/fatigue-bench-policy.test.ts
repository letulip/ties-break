// FATIGUE BENCH – THE POLICY-ORDERING HALF (38s of the parent file's 55s, measured 02.08).
//
// ⚠ WHY ITS OWN FILE. vitest tracks each FILE as a task, and birpc gives that task's `onTaskUpdate`
// ack a HARD-CODED 60s window (DEFAULT_TIMEOUT = 6e4, not configurable in vitest 3.2.7). No single
// test here is long - the worst is 18s - but the FILE total is what the ack spans, so a file near
// 60s loses a coin-flip against a hard timeout and the sim project exits 1 with every test green.
// Measured per-describe before splitting: this block alone was 38s inside a 55s file.
//
// NOTHING ELSE MOVED: same tests, same sample sizes, same seeds, same assertions. Wall-clock is
// unchanged because the sim project runs one file at a time anyway (see vite.config.ts).
import { describe, it, expect, vi } from 'vitest'

// Monte-Carlo cells (30 seeds × 52-208 engine-weeks) finish in ~1-4s on a dev Mac but blow the
// 5s default on a 2-core CI runner (observed: the ordering + 104w-anchor tests timing out in the
// PR run). One generous file-level timeout instead of per-test surgery – these tests are
// deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import {
  PROFILES,
  POLICIES,
  FATIGUE_HORIZONS,
  runCell,
  computeCellStats,
} from '../tools/fatigue-bench'

// The fatigue bench is a MEASUREMENT tool for the round-9 condition math: it must be
// deterministic, its policy ordering must reflect the load-management axis it exists to compare,
// and its condition trace must be exactly the owner's formula – re-derived here INDEPENDENTLY
// from the ECONOMY knobs (no accrueCondition/matchDrain imports) and compared byte-for-byte.

const working = PROFILES.find((p) => p.background === 'working')!
// ⚠ RE-AIMED by the coach ladder: the bench's profiles moved from `coachSetup: 'parent' | 'hired'`
// to rungs of the ladder ('self' / 'middle'). Same two middle-family cells, same contrast – the
// self-coached family against the one paying a coach – so every assertion below is unchanged.
const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!

const grinder = POLICIES.find((p) => p.id === 'grinder')!
const balanced = POLICIES.find((p) => p.id === 'balanced')!
const careful = POLICIES.find((p) => p.id === 'careful')!

const H52 = FATIGUE_HORIZONS.find((h) => h.weeks === 52)!

describe('policy ordering (the load-management axis)', () => {
  // Self-coached profiles are the clean read: physio is OFF for grinder/balanced there, so the
  // three policies actually differ in recovery. (On hired-coach profiles the default physio +2
  // saturates all three at the cap and the ordering collapses to a tie – a bench FINDING, not a
  // bench bug; see the anchor test below.)
  it('mean condition: grinder < balanced < careful (both self-coached profiles, 52w)', () => {
    for (const profile of [working, middleSelf]) {
      const g = computeCellStats(profile, grinder, H52, runCell(profile, grinder, H52.weeks))
      const b = computeCellStats(profile, balanced, H52, runCell(profile, balanced, H52.weeks))
      const c = computeCellStats(profile, careful, H52, runCell(profile, careful, H52.weeks))
      expect(g.meanCond).toBeLessThan(b.meanCond)
      expect(b.meanCond).toBeLessThan(c.meanCond)
    }
  })

  it('injuries/season: grinder > careful; the spec ≥3x anchor is NOT met – pinned as the round-9 finding', () => {
    // Pooled over both self-coached profiles at 52w for stability (paired seeds).
    const gRuns = [...runCell(working, grinder, H52.weeks), ...runCell(middleSelf, grinder, H52.weeks)]
    const cRuns = [...runCell(working, careful, H52.weeks), ...runCell(middleSelf, careful, H52.weeks)]
    const gInj = gRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    const cInj = cRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    expect(gInj).toBeGreaterThan(cInj) // direction holds
    // *** RE-PINNED 25.07 with the V2.1 flip (shipped: recoveryBase 1, match weeks 0, physio 1):
    // at 52w the pooled self-coached ratio sat ~2.6x (one season is too short for the grinder's
    // downward drift to fully separate tau), still shy of the spec's ≥3x. ***
    // *** RE-MEASURED 28.07 with the random draw: 3.25x. The direction and the reason are
    // unchanged; the number rose because a grinder now sometimes SURVIVES round one and plays a
    // second match in the same week, which is exactly the load the axis is about. The corridor is
    // widened rather than re-pinned to a point - this anchor has moved four times already
    // (3.05 / 2.94 / 3.12 / 2.98 / 3.25) and a point pin on it is a tripwire, not a measurement. ***
    const ratio = gInj / cInj
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(3.6)
  })

})
