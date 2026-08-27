// FATIGUE BENCH – THE MEAN-CONDITION ORDERING, THE MIDDLE SELF-COACHED FAMILY (27.08).
//
// The twin of tests/fatigue-bench-policy-condition-working.test.ts: the second iteration of the
// profile loop the mean-condition test always ran. tests/fatigueBenchPolicyFixtures.ts carries the
// account of why tests/fatigue-bench-policy.test.ts had to be cut a third time (69.73s, both tests
// green, exit 1 on birpc's `Timeout calling "onTaskUpdate"`, alone in its own process), and why the
// seam had to run through this loop rather than only between the two tests.
//
// Nothing was re-seeded, re-horizoned or shortened in the move: 30 paired seeds per cell, 52 weeks,
// the same three policies, the same two `toBeLessThan` claims. 16.9 / 17.0 / 17.2 s solo.
import { describe, it, expect, vi } from 'vitest'

// Monte-Carlo cells (30 seeds × 52-208 engine-weeks) finish in ~1-4s on a dev Mac but blow the
// 5s default on a 2-core CI runner (observed: the ordering + 104w-anchor tests timing out in the
// PR run). One generous file-level timeout instead of per-test surgery – these tests are
// deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import { runCell, computeCellStats } from '../tools/fatigue-bench'
import { balanced, careful, grinder, H52, middleSelf } from './fatigueBenchPolicyFixtures'

describe('policy ordering (the load-management axis)', () => {
  // Self-coached profiles are the clean read: physio is OFF for grinder/balanced there, so the
  // three policies actually differ in recovery. (On hired-coach profiles the default physio +2
  // saturates all three at the cap and the ordering collapses to a tie – a bench FINDING, not a
  // bench bug; see the anchor test in tests/fatigue-bench-policy.test.ts.)
  it('mean condition: grinder < balanced < careful (middle self-coached, 52w)', () => {
    const profile = middleSelf
    const g = computeCellStats(profile, grinder, H52, runCell(profile, grinder, H52.weeks))
    const b = computeCellStats(profile, balanced, H52, runCell(profile, balanced, H52.weeks))
    const c = computeCellStats(profile, careful, H52, runCell(profile, careful, H52.weeks))
    expect(g.meanCond).toBeLessThan(b.meanCond)
    expect(b.meanCond).toBeLessThan(c.meanCond)
  })

})
