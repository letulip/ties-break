// THE SIM SUITE, ONE FILE PER PROCESS — and the reason is measured, not stylistic.
//
// The Monte-Carlo files run serialised (`--no-file-parallelism`) because birpc's RPC timeout is
// 60 s and a minutes-long SYNCHRONOUS file cannot answer `onTaskUpdate` while it is spinning. That
// flag fixed the per-file case and held for months.
//
// ⚠ IT STOPPED HOLDING WHEN THE POPULATION TRIPLED (05.08, `feat/population-1600`). Measured on a
// quiet machine, every test green in both readings:
//
//     each file alone          exit 0, longest 61 s (fatigue-bench-policy)
//     all eight in one worker  exit 1, 258 s, `[vitest-worker]: Timeout calling "onTaskUpdate"`
//
// So the failure is CUMULATIVE, not per-file: eight files share one worker, the reporter's flush
// waits behind whichever synchronous stretch is running, and somewhere past four minutes one wait
// crosses the 60 s line. Nothing is failing — the run reports `8 passed (8) · 80 tests` and then
// exits 1, which is the worst shape a gate can have, because the number a script reads disagrees
// with the number a human reads.
//
// The fix keeps EVERY test and trades ~2 s of process start per file: each file gets its own
// vitest invocation, so no worker lives long enough to miss a flush. Exit code is the worst of the
// runs, and a file that fails does not stop the others — a full picture beats an early exit when
// the whole point is a nightly-style sweep.
//
// The alternative was cutting seeds until the total fitted, which buys speed with coverage. That
// trade may still be worth making one day; it should be made deliberately and measured, not as a
// side effect of a population change.
//
// =================================================================================================
// ⚠ THE SPLIT DID NOT REMOVE THE FAILURE MODE, IT ONLY MOVED THE THRESHOLD (10.08). And the second
// measurement killed the theory that was about to be acted on, which is why it is written down.
//
// `econ-bench` came back exit 1 on a loaded machine at 61 s with all 13 tests green, and passed at
// 58 s on a quiet one. The plan was to SPLIT THE FILE, on the theory that the 60 s ceiling applies
// to the longest synchronous stretch inside it. So the stretch was measured, per test:
//
//     survival flag / survived === weeksToBankrupt      16.2 s   <- the longest test in the file
//     per-season capture fires (targetAge - 14) times    9.3 s
//     accounting reconciles / net == income - expense    7.9 s
//     entries-per-career counter                         7.8 s
//     ...nine more, each under 5.4 s                     total 51.4 s, exit 0
//
// NOT ONE TEST IS WITHIN THREE TIMES THE CEILING. So the file has no structural problem and
// splitting it would have bought nothing — it is not one long test, it is thirteen short ones, and
// the RPC that times out is starved by the MACHINE rather than blocked by the work. Contention is
// the variable: the same tree read 18 s and 917 s for `fatigue-bench-policy-104w` thirty minutes
// apart, and a full `check` shard read 72 s and 964 s.
//
// So the honest fix is not to make the suite faster. It is to STOP THE GATE REPORTING A MACHINE
// STALL AS A TEST FAILURE, because those are different facts and a gate that confuses them teaches
// everyone to ignore it:
//
//   * a file whose runner exits non-zero while its own summary reports ZERO failed tests is an
//     INFRASTRUCTURE outcome. It is retried ONCE, and a retry that comes back clean is reported as
//     recovered — with the stall still printed, never swallowed.
//   * a retry that stalls again still FAILS the run, and says which kind of failure it is.
//   * a file with a genuinely failing assertion is untouched by any of this: it is never retried
//     and it always fails. A retry loop over real failures would be the actual sin here.
//
// ⚠ AND THE DISTINCTION IS READ OFF VITEST'S OWN SUMMARY, not off a timeout message, because the
// text of the stall varies and the summary does not. If there is no summary AT ALL the file is
// treated as a real failure, which is the safe direction — a crashed runner that printed nothing
// must never read as "green".
//
// ⚠ THE CLASSIFIER MOVED TO scripts/lib/stall.mjs (10.08) BECAUSE THE UNIT PROJECT HIT THE SAME
// WALL ON CI – `Tests 61 passed (61)` on the radar shard at 62.63 s, exit 1 – and two copies of one
// rule is how the rule drifts. That reading also settles what the wall is about: it is not this
// project, not this Mac and not contention alone. It is a 60 s ceiling meeting whatever machine
// happens to be running, and both gates now answer it the same way.

import { spawnSync } from 'node:child_process'
import { classify, recoveredNote } from './lib/stall.mjs'
// ⚠ IMPORTED, NOT REGEX-PARSED OUT OF vite.config.ts (round-22 review). This script used to read
// the config's SOURCE TEXT and pull `HEAVY_SIM_FILES` out of it with two regexes, stripping the
// `**/` off each entry to get a path back. It worked, and it was one rename away from silently
// running fewer files than it printed – the exact "the number a script reads disagrees with the
// number a human reads" shape this file's header was written about, one level up. The list and the
// `sim` project's `include` are now the same array. See scripts/heavy-tests.mjs.
import { HEAVY_SIM_FILES } from './heavy-tests.mjs'

function runFile(file) {
  const at = Date.now()
  const run = spawnSync(
    'npx',
    ['vitest', 'run', '--project', 'sim', '--no-file-parallelism', '--reporter', 'dot', file],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
  )
  const output = (run.stdout || '') + (run.stderr || '')
  // The classifier is shared with scripts/units.mjs – the same wall hit the unit project on CI, and
  // a rule written twice is a rule that drifts. See scripts/lib/stall.mjs.
  return { secs: ((Date.now() - at) / 1000).toFixed(0), output, ...classify(run.status, output) }
}

const files = HEAVY_SIM_FILES
const started = Date.now()
const failed = []
const stalled = []
const recovered = []

for (const [i, file] of files.entries()) {
  const label = file.replace(/^tests\//, '').replace(/\.test\.ts$/, '')
  process.stdout.write(`  sim ${String(i + 1).padStart(2)}/${files.length}  ${label} … `)
  let r = runFile(file)

  if (r.stalled) {
    // ONE retry, and only for the all-green-non-zero shape. Never for a real assertion.
    process.stdout.write(`stalled (${r.secs}s, every test green) – retrying once … `)
    const first = r
    r = runFile(file)
    if (!r.stalled && !r.failed) {
      recovered.push({ file, firstSecs: first.secs, output: first.output })
      console.log(`ok (${r.secs}s, recovered)`)
      continue
    }
    if (r.stalled) {
      stalled.push({ file, output: r.output })
      console.log(`STALLED TWICE (${r.secs}s) – runner, not tests`)
      continue
    }
  }

  if (r.failed) {
    console.log(`FAILED (${r.secs}s)`)
    failed.push({ file, output: r.output })
  } else if (!r.stalled) {
    console.log(`ok (${r.secs}s)`)
  }
}

const total = ((Date.now() - started) / 1000).toFixed(0)

// The stalls are printed whether or not they cost the run its exit code. Swallowing a recovered
// stall would rebuild the same lie one level down: the gate would be quietly retrying a machine
// that is falling over, and nobody would know until it stopped recovering.
for (const r of recovered) console.error(recoveredNote(r.file, r.firstSecs))

if (failed.length === 0 && stalled.length === 0) {
  const tail = recovered.length ? ` (${recovered.length} recovered after a stall)` : ''
  console.log(`  sim: ${files.length} files green in ${total}s${tail}`)
} else {
  for (const f of [...failed, ...stalled]) {
    console.error(`\n===== ${f.file} =====\n${f.output}`)
  }
  const parts = []
  if (failed.length) parts.push(`${failed.length} FAILED`)
  if (stalled.length) parts.push(`${stalled.length} stalled twice (runner, not tests)`)
  console.error(`  sim: ${parts.join(', ')} of ${files.length} files (${total}s)`)
  process.exitCode = 1
}
