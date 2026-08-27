// THE POLICY-ORDERING SUITE'S FIXTURES – the two profiles, the three policies and the horizon its
// three files measure the load-management axis over.
//
// ⚠ WHY THIS EXISTS. tests/fatigue-bench-policy.test.ts walked into birpc's unraisable 60s RPC
// window: `Tests 2 passed (2)` followed by `Timeout calling "onTaskUpdate"`, exit 1, measured at
// 64.1s on 13.08, 65.2s when the eleven sim files were timed, and 69.73s again on 27.08 – on a
// quiet Mac, alone in its own process. Sharding could not help: `scripts/sim.mjs` already gave that
// file a process of its own, so the FILE was the unit and the file had to be cut. It is now three,
// and they share these fixtures:
//
//   fatigue-bench-policy.test.ts             the injuries/season anchor – the C3 corridor, POOLED
//   fatigue-bench-policy-condition-working   mean condition ordering, the working family
//   fatigue-bench-policy-condition-middle    mean condition ordering, the middle self-coached family
//
// ⚠ IT IS A SPLIT AND NOT A DIET. Every one of the ten Monte-Carlo cells still runs, at the same 30
// paired seeds, over the same 52-week horizon, and all seven assertions are unchanged and unmoved
// from the values they were pinned at. scripts/units.mjs's own rule is what governs it: cutting
// seeds until a file fits buys speed with coverage, and that trade is made deliberately and
// measured, never as a side effect of making a wall.
//
// ⚠ AND THE CUT RUNS THROUGH THE PROFILE LOOP, NOT ONLY BETWEEN THE TWO TESTS, because between them
// is not enough. The file is TEN Monte-Carlo cells at ~5.0s each – six in the mean-condition test,
// four in the injuries one – so a two-file cut leaves a ~32s file against a 52s file that was
// already a coin flip, and 32s needs only a 1.9x unlucky stretch on a project that has measured
// 18s -> 917s on one unchanged file (scripts/sim.mjs). The mean-condition test's
// `for (const profile of [working, middleSelf])` had two INDEPENDENT iterations – three cells and
// two `expect`s each, nothing pooled across them – so the loop boundary became a file boundary and
// both halves still run. The injuries test POOLS its four cells across both profiles into one ratio
// (its own comment says so, and paired seeds are the reason), so it is atomic: four cells is the
// floor for the largest file here, and it is what the largest is. Solo, three runs each:
// 21.9/22.0/21.9 · 16.8/16.9/16.9 · 16.9/17.0/17.2 – scripts/heavy-tests.mjs carries the table and
// the control run that proves the ten cells still cost what they cost.
//
// ⚠ AND `tests/fatigue-bench-policy.test.ts` KEEPS ITS NAME because the name is quoted from OUTSIDE
// the tests – src/engine/season/tournament.ts cites the C3 corridor by that path twice, and
// docs/specs/ai-w-onramp.md three times. The test those citations are about is the injuries/ratio
// one, so that is the test that stayed behind, exactly as tests/radarFixtures.ts kept the original
// suite's section numbers rather than tidying them into nothing.

import {
  PROFILES,
  POLICIES,
  FATIGUE_HORIZONS,
} from '../tools/fatigue-bench'

// The fatigue bench is a MEASUREMENT tool for the round-9 condition math: it must be
// deterministic, its policy ordering must reflect the load-management axis it exists to compare,
// and its condition trace must be exactly the owner's formula – re-derived here INDEPENDENTLY
// from the ECONOMY knobs (no accrueCondition/matchDrain imports) and compared byte-for-byte.

export const working = PROFILES.find((p) => p.background === 'working')!
// ⚠ RE-AIMED by the coach ladder: the bench's profiles moved from `coachSetup: 'parent' | 'hired'`
// to rungs of the ladder ('self' / 'middle'). Same two middle-family cells, same contrast – the
// self-coached family against the one paying a coach – so every assertion below is unchanged.
export const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!

export const grinder = POLICIES.find((p) => p.id === 'grinder')!
export const balanced = POLICIES.find((p) => p.id === 'balanced')!
export const careful = POLICIES.find((p) => p.id === 'careful')!

export const H52 = FATIGUE_HORIZONS.find((h) => h.weeks === 52)!
