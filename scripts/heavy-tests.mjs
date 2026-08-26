// THE HEAVY-TEST LISTS – ONE SOURCE, THREE READERS.
//
// ⚠ WHY THIS FILE EXISTS (round-22 review). These two lists decide which test files are lifted out
// of a contended worker pool and given a process of their own. They had TWO TRUTHS:
//
//     vite.config.ts      DECLARED both lists, as `**/`-prefixed globs
//     scripts/sim.mjs     REGEX-PARSED `HEAVY_SIM_FILES` back out of the TypeScript source text
//     scripts/units.mjs   kept a hand-maintained SECOND COPY of `HEAVY_UNIT_FILES`
//
// Both failure modes are silent, and both are shapes this repo has already been bitten by. A rename
// the regex stops matching drops a Monte-Carlo file out of `test:sim` while the script still reports
// "N files green" – the exact "the number a script reads disagrees with the number a human reads"
// failure that scripts/sim.mjs's own header was written about. And a unit file added to one copy of
// the list and not the other is either run twice or left in the bulk pool it was supposed to leave,
// whose symptom is the birpc stall this whole mechanism exists to prevent, arriving months later on
// a CI runner with every test green.
//
// So the lists live HERE, in plain ESM, and every reader IMPORTS them: `vite.config.ts` through the
// `.d.mts` beside this file (the same idiom `scripts/optimize-art.mjs` already uses, so no new
// tooling is introduced), and the two plain-Node scripts directly. No TypeScript is parsed by
// anything, there is no second copy to drift, and a rename that misses a reader is now a module
// error instead of a quietly shorter list.
//
// ⚠ THE PATHS ARE BARE AND THE GLOBS ARE DERIVED, not the other way round. A bare
// `tests/x.test.ts` is what both scripts hand vitest on the CLI; the `**/` prefix is a VITEST-CONFIG
// requirement – a project `include`/`exclude` pattern is matched against the resolved path, so it
// needs the leading `**/` to match at all. Deriving a glob from a path is total; deriving a path
// from a glob is a guess about the glob's shape, which is precisely what the deleted regex in
// scripts/sim.mjs was doing (`.replace(/^\*\*\//, '')`).

/** The Monte-Carlo files: 104s of the suite's 183s, and the reason CI's reporter RPC times out.
 *  Declared once so the two vitest projects and the two shard scripts cannot disagree about which
 *  files are heavy.
 *  econ-reach is the reach-tracker describe SPLIT OUT of econ-bench (P6 (d)): that describe alone
 *  was ~40s, and no sim file may sit near birpc's hard 60s RPC ceiling on a 2-core runner. */
export const HEAVY_SIM_FILES = [
  'tests/econ-bench.test.ts',
  'tests/econ-bench-survival.test.ts',
  'tests/econ-reach.test.ts',
  'tests/econ-reach-agree.test.ts',
  'tests/econ-reach-pro.test.ts',
  // ⚠ `endings-bench` USED TO SIT HERE AND HAS MOVED TO HEAVY_UNIT_FILES (13.08). Its entry said it
  // was here "for SERIALISATION, not for cost" – and being out of the PR gate was the price of that
  // placement, which nobody had priced. It is a REGRESSION test (its own header: "the smallest
  // slice that can still catch the three things a refactor could silently break", and "it asserts
  // BEHAVIOUR, not the printed numbers"), and it is 12.2 s wall / 10.9 s of test time solo. A
  // process of its own gives it exactly the serialisation it was placed here for, and the gate gets
  // it back. See the list below and .github/workflows/simulation.yml for where the line is drawn.
  'tests/fatigue-bench.test.ts',
  'tests/fatigue-bench-planner.test.ts',
  'tests/fatigue-bench-policy.test.ts',
  'tests/fatigue-bench-policy-104w.test.ts',
  'tests/match/calibration.test.ts',
]

/** THE HEAVY UNIT TAIL – regression tests, so they stay in the PR gate, but they hold a core long
 *  enough to matter. Measured 05.08 with `--reporter=json`, summed per file under contention:
 *  economy 44s, radar 24s solo (17s before `FIELD.size` went 520 -> 1,600), kidLife 22s. Nothing
 *  here is near birpc's 60s window ALONE; together with 109 other files on CI's slower cores, one
 *  of them is. `scripts/units.mjs` gives each a process; this list is what it skips in the bulk
 *  pass (vite.config.ts appends it to the unit project's `exclude` when `TB_UNIT_SKIP_HEAVY` is
 *  set). Grow it rather than trimming assertions if the tail grows.
 *
 *  ⚠ 11.08: A PROCESS OF ITS OWN STOPPED BEING ENOUGH FOR RADAR. It grew to 34.2s solo and went
 *  over birpc's window on CI at 64.51s - every test green, exit 1 - and it was already alone in its
 *  process, so there was nothing left to shard. The FILE was the unit, so the file was split into
 *  the three listed below (same 61 tests, same seeds, same week counts; scripts/units.mjs's header
 *  carries the measurement). All three stay heavy: 9.3s / 15.0s / 10.3s solo, so the largest is
 *  about where the original stood when this list was first written.
 *
 *  ⚠ 13.08: THE LIST NOW ALSO TAKES REGRESSION TESTS BACK OUT OF THE SIM PROJECT, and that is the
 *  same rule read in the other direction rather than a new one. The sim project's exclusion from
 *  the gate is about MONTE-CARLO SWEEPS – deterministic calibration that catches a changed model,
 *  not a flake (simulation.yml's header argues it in full, and it is right). `endings-bench` is not
 *  one: it is a behaviour regression test that happens to drive careers, and it had been filed with
 *  the sweeps because it shares their SHAPE. Filed there, it left the gate, and it went red on
 *  clean `main` and stayed red unnoticed – which is the cost of the misfiling, measured.
 *
 *  All eleven sim files were timed solo before anything moved (one vitest process each, quiet
 *  machine, wall clock) – scripts/units.mjs carries the table and what it turned up:
 *
 *      econ-reach-pro 41.9 · econ-bench 39.0 · econ-reach 37.9 · econ-reach-agree 35.8
 *      fatigue-bench 29.4 · econ-bench-survival 29.1 · fatigue-bench-planner 22.3 (RED)
 *      fatigue-bench-policy-104w 19.7 · match/calibration 14.9 · endings-bench 12.2  <- moved
 *      fatigue-bench-policy 65.2 (RED: two tests green, exit 1 – birpc's wall, on a quiet Mac)
 *
 *  ⚠ THE BAR IS TWO TESTS AND BOTH MATTER: a regression test by its own header, AND real headroom
 *  under birpc's 60 s wall at CI's ~1.9x local (scripts/units.mjs's own calibration). On cost alone
 *  `match/calibration` at 14.9 s would come back too – and it is calibration, which is exactly the
 *  file family the exclusion was written about. endings-bench is the only file clearing both: 12.2 s
 *  local is ~23 s on CI, about a third of the window, and it can triple before it is near it. */
export const HEAVY_UNIT_FILES = [
  'tests/economy.test.ts',
  'tests/radar.test.ts',
  'tests/radar-read.test.ts',
  'tests/radar-training.test.ts',
  'tests/kidLife.test.ts',
  // ⚠ CAME BACK FROM THE SIM PROJECT (13.08) – see THE FILE THAT CAME BACK in scripts/units.mjs's
  // header. 12.2 s solo.
  'tests/endings-bench.test.ts',
  // ⚠ MOVED 13.08 AFTER CI STALLED WITH EVERY TEST GREEN – `Timeout calling "onTaskUpdate"`, 132
  // files and 2762 tests passed, exit 1, «1 stalled twice (runner, not tests)». The unit bulk's
  // summed test time was 733 s on a TWO-CORE runner, and these two were the largest files still in
  // it: travel-home 39.8 s and ladder-floor 28.4 s locally (measured under load, so the ordering is
  // the signal, not the absolute). Both drive real careers, and the bench policy was rebuilt the
  // same day so that every career now plays a professional calendar instead of village events –
  // three times the matches, which is where the time went. A file near 40 s locally is past birpc's
  // unraisable 60 s window at CI's ~1.9x. Same remedy as every entry above: one process each.
  'tests/travel-home.test.ts',
  'tests/ladder-floor.test.ts',
  // ⚠⚠ THE THIRD TIME, AND THIS TIME THE BULK POOL ITSELF WENT OVER THE WALL (26.08, round 26).
  // `npm test` stalled on CI at 19+ minutes against a 25-minute ceiling, and the same shape
  // reproduced ON A QUIET MAC – `--reporter=json` over the bulk pass returned `success: true`,
  // 3455 tests, 0 failed, EXIT 1. Not a slower runner this time: the pool has simply grown to 172
  // files and 3455 tests, and the contention penalty measured uniformly x2.9 (solo -> in-pool).
  //
  // The bar is this file's own, unchanged: a file near 40 s in-pool locally is past birpc's
  // unraisable 60 s window at CI's ~1.9x, so the line sits at ~32 s in-pool. Twelve files crossed
  // it. Measured both ways before anything moved, in-pool -> solo:
  //
  //     college-birthday    77.7 -> 27      college-second-act  42.0 -> 14
  //     coach-travel-edge   59.9 -> 21      goldenSaves         41.4 -> 14
  //     season-mirror       45.8 -> 16      world-trio          36.7 -> 13
  //     viz/commentary      42.8 -> 14      coach-load          36.2 -> 13
  //     blocking-overlay    42.3 -> 15      round23-kid-share   33.8 -> 13
  //                                         condition           33.7 -> 11
  //                                         round26-world-speaks 31.9 -> 12
  //
  // ⚠ NOT ONE OF THEM IS HEAVY ON ITS OWN – the largest is 27 s solo, well under half the window.
  // That is the finding: the wall is being hit by CONTENTION, not by any file, so the remedy is the
  // same one every entry above used (a process each) and NOT a trimmed assertion anywhere. The x2.9
  // penalty is what a growing pool costs, and it will keep claiming files every round or two: when
  // the next one crosses, measure in-pool with `TB_UNIT_SKIP_HEAVY=1 npx vitest run --project unit
  // --reporter=json` and move it here. If the serial tail ever costs more than the pool saves, the
  // honest next step is fewer workers per core, measured – not fewer tests.
  'tests/college-birthday.test.ts',
  'tests/coach-travel-edge.test.ts',
  'tests/season-mirror.test.ts',
  'tests/viz/commentary.test.ts',
  'tests/blocking-overlay.test.ts',
  'tests/college-second-act.test.ts',
  'tests/goldenSaves.test.ts',
  'tests/world-trio.test.ts',
  'tests/coach-load.test.ts',
  'tests/round23-kid-share.test.ts',
  // ⚠ THE FROZEN MAIN CAPTURE LIVES HERE NOW. A shard placement changes nothing it asserts – the
  // capture is still 41550 / e6b0c709 and still fails the same way – but it does mean the RNG law's
  // own guard can no longer be lost to a runner stall that has nothing to do with it.
  'tests/condition.test.ts',
  'tests/round26-world-speaks.test.ts',
]

/** The same list in the form a VITEST PROJECT's `include`/`exclude` needs.
 *
 *  ⚠ THE `**\/` PREFIX IS LOAD-BEARING AND IT IS NOT DECORATION. Project patterns are matched
 *  against the resolved path, so a bare `tests/economy.test.ts` in an `exclude` matches nothing and
 *  the heavy file quietly stays in the bulk pool – which is the failure this whole module exists to
 *  make impossible. Every config-side use goes through this helper so the prefix cannot be
 *  forgotten at one call site and remembered at another. */
export function asProjectGlobs(files) {
  return files.map((file) => `**/${file}`)
}
