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
  // ⚠⚠ 27.08: `fatigue-bench-policy` HAD TO BE CUT, AND THE CUT WENT ONE LEVEL DEEPER THAN THE TWO
  // BEFORE IT. The header's own table below already recorded it RED – «fatigue-bench-policy 65.2
  // (RED: two tests green, exit 1 – birpc's wall, on a quiet Mac)» – and it never stopped being a
  // coin flip: 64.1 s on 13.08, 65.2 s in the eleven-file timing, and 69.73 s re-measured today with
  // both tests green and `Timeout calling "onTaskUpdate"`. Paired against its base branch it read
  // 52 s / 53 s on one and 51 s / 68 s (exit 1) on the other, so it is neither branch's doing – it
  // is a file sitting ON the wall. It was already alone in its process from `scripts/sim.mjs`, so
  // the FILE was the unit and the file had to be cut, exactly as radar's was on 11.08.
  //
  // ⚠ AND TWO FILES WOULD NOT HAVE DONE IT, which is the finding worth carrying. There were only
  // two `it`s, and the file is TEN Monte-Carlo cells at ~5.0 s each – six in the mean-condition
  // test, four in the injuries one – so cutting between the two tests leaves a ~32 s file against a
  // 52 s file that was already a coin flip. 32 s needs a 1.9x unlucky stretch to cross, and this
  // project has measured 18 s -> 917 s on ONE unchanged file thirty minutes apart (scripts/sim.mjs).
  // That is not a cut, it is a shorter coin flip.
  //
  // So the seam went one level deeper, through the mean-condition test's own
  // `for (const profile of [working, middleSelf])` loop, whose two iterations were INDEPENDENT –
  // three cells and two `expect`s each, nothing pooled across them. The injuries test POOLS its
  // four cells into one ratio across both profiles (paired seeds, its own comment says why), so it
  // is atomic: four cells is the floor for the largest file here, and it is what the largest is.
  //
  // MEASURED SOLO, THREE RUNS EACH, the real `scripts/sim.mjs` invocation (sim project,
  // `--no-file-parallelism`, `--reporter dot`), one file per process:
  //
  //     fatigue-bench-policy             (injuries, 4 cells)  21.9 / 22.0 / 21.9 s   exit 0
  //     fatigue-bench-policy-condition-working  (3 cells)     16.8 / 16.9 / 16.9 s   exit 0
  //     fatigue-bench-policy-condition-middle   (3 cells)     16.9 / 17.0 / 17.2 s   exit 0
  //
  // Under 0.4 s of spread across nine runs, which is the point: the file it replaced read 52 / 53 s
  // on one branch and 51 / 68 s on another, and that spread WAS the defect.
  //
  // ⚠ AND THE SHORTFALL WAS CONTROLLED FOR RATHER THAN POCKETED. 21.9 + 16.8 + 16.9 = 55.6 s
  // against a file that reproduced at 69.73 s, and 14 s of free speed is exactly what a silently
  // dropped cell looks like. So all four were re-run back to back under IDENTICAL conditions (one
  // file, serialised, dot), the old file restored from git alongside the new three:
  //
  //     old file, both tests, 10 cells   52.3 s
  //     injuries          4 cells        22.0 s
  //     condition-working 3 cells        16.7 s
  //     condition-middle  3 cells        16.8 s
  //                                      ------
  //     the three, summed                55.5 s   = the old file + 3.2 s
  //
  // The +3.2 s is two extra vitest starts (~1.6 s each). TEN CELLS COST THE SAME BEFORE AND AFTER,
  // ~5.0 s each either way – that sum is the proof no cell went missing, and it is why the number
  // is here. The 69.73 s reproduction was taken under `--reporter verbose`, which this module's
  // neighbours already record as the second variable in this exact race (vite.config.ts: the
  // per-test tree re-render keeps far more `onTaskUpdate` acks in flight). The gate runs dot.
  //
  // The largest new file is 22 s – it needs a 2.7x stretch to reach the wall, and it lands
  // FOURTH-CHEAPEST of the twelve sim files, well under econ-reach-pro (41.9 s) and econ-bench
  // (39.0 s), both of which pass the weekly 2-core runner today.
  //
  // ⚠ AND IN-SUITE IS DEARER THAN SOLO, WHICH IS THE NUMBER THAT ACTUALLY GATES. Read off three
  // full `npm run test:sim` runs back to back – twelve files, ~400 s of continuous Monte-Carlo, the
  // machine never idle – the same three files land at 33/32/32 s, 24/24/24 s and 24/24/24 s, about
  // 1.5x their solo cost (`fatigue-bench-policy-104w` moves the same way: 19.7 s recorded solo,
  // 23/22/23 s here). Still nowhere near the wall, and not one stall in three runs: 12 files green
  // in 363 s, 417 s and 422 s, exit 0 every time, no retry consumed.
  //
  // ⚠ NOT ONE SEED, NOT ONE HORIZON AND NOT ONE ASSERTION MOVED. Ten cells before, ten after; 30
  // paired seeds a cell throughout; 52 weeks throughout; seven `expect`s before and seven after at
  // the same pinned values. The one thing that DID change is two test NAMES, and only because the
  // split made the old one false: `(both self-coached profiles, 52w)` is now `(working
  // self-coached, 52w)` and `(middle self-coached, 52w)`. The describe name is untouched, and
  // `fatigue-bench-policy.test.ts` keeps its path because src/engine/season/tournament.ts and
  // docs/specs/ai-w-onramp.md cite the C3 corridor by it – the test they mean is the one left there.
  'tests/fatigue-bench-policy.test.ts',
  'tests/fatigue-bench-policy-condition-working.test.ts',
  'tests/fatigue-bench-policy-condition-middle.test.ts',
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
 *                           ⚠ AND IT STAYED RED FOR TWO WEEKS. Cut into three on 27.08 – see the
 *                           block against it in HEAVY_SIM_FILES above. This row is the record of
 *                           the reading, not of a file that still measures this.
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
  // ⚠⚠ AN ORPHANED COMMENT LIVED HERE AND IT WAS MINE (corrected 27.08). It read «THE FROZEN MAIN
  // CAPTURE LIVES HERE NOW» – true when twelve files were promoted on 26.08, false four hours later
  // when the list was cut back to two and `tests/condition.test.ts` went out with the other nine.
  // The entry left; the sentence claiming it stayed. **A comment that survives the line it describes
  // is worse than no comment**, because it is read as a fact about the list. The capture is fine and
  // runs in the bulk pool, where it has passed 51/51 on every gate since.
  //
  // ⚠⚠ PROMOTED 27.08, AND THE REASON IS THAT SAME NARROWING. The 26.08 sweep measured this file at
  // 41.4 s in-pool / 14 s solo and NAMED it – and then the twelve candidates were cut to two, because
  // the in-pool ranking had been taken on a Mac whose ~9 workers sit on 4 performance cores and so
  // described this laptop rather than CI. That correction was right for CI and left the LOCAL gate
  // fragile, which is the gate every hand-off is measured on: `npm run check` has since come back red
  // four times on nothing but this file, every run with ZERO assertion failures and the file passing
  // 68/68 in 18 s alone.
  //
  // ⚠ IT IS A TEST TIMEOUT, NOT BIRPC'S WALL – a different failure from every entry above it, and the
  // distinction matters. The wall is a 60 s reporter RPC; this is vitest's own 20 s per-test ceiling,
  // reached because the corpus walks 68 golden saves while 170 other files share the cores. Same
  // remedy, different mechanism, and a later reader must not conclude the wall moved.
  'tests/goldenSaves.test.ts',
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
