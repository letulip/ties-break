// FATIGUE BENCH – THE MEAN-CONDITION ORDERING, THE WORKING FAMILY (27.08).
//
// ⚠ THE SAME 60s WALL THAT SPLIT THE PARENT FILE ON 02.08 AND 05.08, ARRIVING A THIRD TIME.
// tests/fatigue-bench-policy.test.ts was 69.73s with both of its tests green and exit 1 on birpc's
// `Timeout calling "onTaskUpdate"`, on a quiet Mac, already alone in its own process – so the FILE
// was the unit and the file was cut. tests/fatigueBenchPolicyFixtures.ts carries the whole account.
//
// ⚠ AND THE SEAM RUNS THROUGH THE PROFILE LOOP, which is one level below the seam the two earlier
// cuts used, because between the two tests is not enough: the mean-condition test is six of the
// file's ten Monte-Carlo cells at ~5.0s each, so a two-file cut leaves a ~32s file against a 52s
// file that was already a coin flip. The test always ran
// `for (const profile of [working, middleSelf])` over two INDEPENDENT iterations: three cells and
// two `expect`s each, nothing pooled between them. So the iteration boundary became a file
// boundary. This file is the `working` half; the `middleSelf` half is
// tests/fatigue-bench-policy-condition-middle.test.ts, and between them they run exactly the six
// cells and make exactly the four assertions the one test did. 16.8 / 16.9 / 16.9 s solo.
//
// Nothing was re-seeded, re-horizoned or shortened in the move: 30 paired seeds per cell, 52 weeks,
// the same three policies, the same two `toBeLessThan` claims.
import { describe, it, expect, vi } from 'vitest'

// Monte-Carlo cells (30 seeds × 52-208 engine-weeks) finish in ~1-4s on a dev Mac but blow the
// 5s default on a 2-core CI runner (observed: the ordering + 104w-anchor tests timing out in the
// PR run). One generous file-level timeout instead of per-test surgery – these tests are
// deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import { runCell, computeCellStats } from '../tools/fatigue-bench'
import { balanced, careful, grinder, H52, working } from './fatigueBenchPolicyFixtures'

describe('policy ordering (the load-management axis)', () => {
  // Self-coached profiles are the clean read: physio is OFF for grinder/balanced there, so the
  // three policies actually differ in recovery. (On hired-coach profiles the default physio +2
  // saturates all three at the cap and the ordering collapses to a tie – a bench FINDING, not a
  // bench bug; see the anchor test in tests/fatigue-bench-policy.test.ts.)
  it('mean condition: grinder < balanced < careful (working self-coached, 52w)', () => {
    const profile = working
    const g = computeCellStats(profile, grinder, H52, runCell(profile, grinder, H52.weeks))
    const b = computeCellStats(profile, balanced, H52, runCell(profile, balanced, H52.weeks))
    const c = computeCellStats(profile, careful, H52, runCell(profile, careful, H52.weeks))
    expect(g.meanCond).toBeLessThan(b.meanCond)
    expect(b.meanCond).toBeLessThan(c.meanCond)
  })

})
