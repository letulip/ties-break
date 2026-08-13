// THE UNIT SUITE: the light 109 in parallel, the heavy three one per process.
//
// ⚠ THIS IS THE SAME 60 s BIRPC WALL THAT ALREADY PUSHED THE MONTE-CARLO FILES OUT OF THE GATE
// (.github/workflows/simulation.yml's header tells that story). It came back on the UNIT project
// on 05.08, on CI, after `FIELD.size` went 520 -> 1,600:
//
//     Test Files  112 passed (112) · Tests  2387 passed (2387) · Errors 1 error
//     Error: [vitest-worker]: Timeout calling "onTaskUpdate"   -> exit 1, 230.88s
//
// Everything green, exit 1. Measured locally on a quiet machine, no single file and no single test
// is anywhere near the wall — radar is 24 s solo (17 s before the population change) and the
// longest single test is 16.1 s. The suite simply crept up ~40% and CI's slower cores, running
// several workers at once, stretch one of them past 60 s of wall while it holds the CPU.
//
// ⚠ AND THE TIMEOUT CANNOT BE RAISED. Traced it: birpc's `DEFAULT_TIMEOUT = 6e4`, and vitest's
// worker builds its RPC through `createForksRpcOptions` with no path from user config to that
// option. `simulation.yml` already says "birpc's hard-coded 60s, which nothing in vitest's config
// can raise" — this run is the receipt.
//
// SO THE FIX IS THE ONE THAT KEEPS EVERY TEST IN THE GATE. Unit tests are regression tests and
// belong in front of a pull request — unlike the Monte-Carlo sweeps, which are calibration and were
// correctly moved to a weekly run. Only the heavy tail is taken out of the contended pool and given
// a process each, so no worker holds a core long enough to miss a flush:
//
//     bulk    109 files, parallel as before
//     heavy   3 files, one vitest invocation each
//
// Same coverage, same gate, ~2 s of process start per heavy file. If the tail grows, add to
// HEAVY_UNIT_FILES rather than trimming assertions — cutting seeds until a suite fits buys speed
// with coverage, and that trade should be made deliberately and measured, never as a side effect.
//
// ⚠ THE SECOND TIME, AND THE RETRY BELOW COULD NOT COVER IT (11.08). The radar shard stalled TWICE
// on the all-green-non-zero shape, which is exactly the shape the retry exists for – because a
// retry is a fix for a file NEAR the wall, and radar had stopped being one. It was OVER it:
//
//     24 s solo when this header was written -> 34.2 s solo re-measured -> 64.51 s on CI
//
// AND THERE WAS NOTHING LEFT TO SHARD: radar already ran alone, in a process of its own, from the
// line below. When a file is its own shard the FILE is the unit, so the file has to be cut. It is
// now three, sharing tests/radarFixtures.ts, and they run the SAME 61 tests under the SAME names –
// not one seed and not one week count was trimmed, per the rule in the paragraph above:
//
//     radar            §1 §2 §3 §9 §12   16 tests    9.3 s solo   (CI ~18 s)
//     radar-read       §4 §5 §7 §8       24 tests   15.0 s solo   (CI ~29 s)
//     radar-training   §6 §10 §11 §13    21 tests   10.3 s solo   (CI ~20 s)
//                                        ---------
//                                        61 tests, the same 61
//
// ⚠ THE FILE THAT CAME BACK (13.08), and it is this mechanism used in the opposite direction.
//
// The Monte-Carlo sweeps left the gate for good reasons that still hold (.github/workflows/
// simulation.yml). But the sim project had also collected a file that is NOT a sweep:
// `tests/endings-bench.test.ts` – "the smallest slice that can still catch the three things a
// refactor could silently break", asserting BEHAVIOUR and explicitly not the printed numbers. It
// was filed there for SERIALISATION rather than for cost (vite.config.ts said so in as many words),
// and the price of that filing was that it stopped gating anything.
//
// THE BILL ARRIVED AND IT WAS PAID THREE TIMES. Measuring the whole project, one file per process,
// found THREE pre-existing failures nobody was looking at:
//
//     endings-bench           red on clean `main` – the fork test threw on round-17's college
//                             precondition, which had made one of its three answers illegal
//     fatigue-bench-planner   red – the doctor-veto direction check, 72 against 75
//     fatigue-bench-policy    64.1 s, TWO TESTS GREEN, exit 1 – birpc's wall, hit on a quiet
//                             10-core Mac, in a process of its own, with nothing left to shard
//
// One is luck; three is a feedback loop nobody is in. "Rot gets caught within a week rather than
// never" (simulation.yml) only holds if somebody reads the weekly run.
//
// MEASURED, ALL ELEVEN, solo, one vitest process each, quiet machine – so the cut below is a
// reading rather than a preference. Wall clock; file test-time is ~1.1 s less in every row:
//
//     econ-reach-pro           41.9 s      fatigue-bench-planner    22.3 s   RED (assertion)
//     econ-bench               39.0 s      fatigue-bench-policy-104w 19.7 s
//     econ-reach               37.9 s      match/calibration        14.9 s
//     econ-reach-agree         35.8 s      endings-bench            12.2 s   <- the only one moved
//     fatigue-bench            29.4 s      fatigue-bench-policy     65.2 s   RED (birpc stall)
//     econ-bench-survival      29.1 s
//
// ⚠ THE BAR IS TWO TESTS AND BOTH ARE LOAD-BEARING: a regression test BY ITS OWN HEADER, and real
// headroom under the 60 s wall at CI's ~1.9x local. Cost alone would have let `match/calibration`
// (14.9 s) back in, and it is calibration – 10k simulated matches against hold-rate bands – which is
// precisely the file family simulation.yml was written about. endings-bench is the only file that
// clears both: 12.2 s local is ~23 s on CI, a third of the window, and it can triple before it is
// near the wall. It costs the gate ~12 s.
//
// `--reporter default`, one file at a time, against the ambient desktop load the 34.2 s baseline was
// taken under (no competing suite; verified before each run). CI runs ~1.9x local – radar's own
// 34.2 s -> 64.51 s IS that calibration rather than a guess – so the worst of the three now lands at
// about HALF the window, and can double before it is anywhere near the wall again.
//
// ⚠ AND THE SEAM IS NOT "RADAR VERSUS TRAINING READ", which is the obvious cut and the wrong one.
// Six tests each spin a LIVE career through the engine and are 30.7 s of the old file's 34.2 s –
// 90 % of it – and they are spread across BOTH subjects, so the split had to separate those six
// from EACH OTHER rather than separating the topics.
//
// ⚠ AND THIS IS WHERE THE NEXT CUT GOES, measured so nobody has to re-derive it under pressure:
// `radar – the estimate does not shimmer` is 13.9 s of radar-read's 14.5 s of test time – 96 %, so
// that file essentially IS that one describe, and two live sweeps inside it are the whole cost
// (5.5 s "THE MISREADING KEEPS ITS SIGN", 8.4 s "the fog can re-widen"). There is no describe left
// to move out of it: the next cut splits that describe, putting those two sweeps in different
// files. Do that before trimming a seed from either of them.

import { spawnSync } from 'node:child_process'
import { classify, recoveredNote } from './lib/stall.mjs'

/** Measured, not guessed: the slowest files under contention, and the only ones holding a core for
 *  double digits of seconds. Re-derive with `--reporter=json` and sum per file. The three radar
 *  entries were one file until 11.08 – see THE SECOND TIME, above. */
const HEAVY_UNIT_FILES = [
  'tests/economy.test.ts',
  'tests/radar.test.ts',
  'tests/radar-read.test.ts',
  'tests/radar-training.test.ts',
  'tests/kidLife.test.ts',
  // ⚠ CAME BACK FROM THE SIM PROJECT (13.08) – see THE FILE THAT CAME BACK, above. 12.2 s solo.
  'tests/endings-bench.test.ts',
]

const reporter = process.argv.includes('--verbose') ? 'default' : 'dot'
const started = Date.now()
const failed = []
const stalled = []
const recovered = []

function once(args, env) {
  const at = Date.now()
  const r = spawnSync('npx', ['vitest', 'run', '--project', 'unit', '--reporter', reporter, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  const out = (r.stdout || '') + (r.stderr || '')
  return { secs: ((Date.now() - at) / 1000).toFixed(0), out, ...classify(r.status, out) }
}

// ⚠ ONE RETRY, AND ONLY FOR THE ALL-GREEN-NON-ZERO SHAPE (10.08). CI went red with
// `Tests 61 passed (61)` and `Timeout calling "onTaskUpdate"` on the radar shard at 62.63s - the
// same birpc wall this file's header already describes, arriving on a slower runner rather than on
// a bigger suite. A failing ASSERTION is never retried: see scripts/lib/stall.mjs for why the
// distinction is mechanical rather than a judgement here.
function run(label, args, env = {}) {
  process.stdout.write(`  unit  ${label} … `)
  let r = once(args, env)

  if (r.stalled) {
    process.stdout.write(`stalled (${r.secs}s, every test green) – retrying once … `)
    const first = r
    r = once(args, env)
    if (!r.stalled && !r.failed) {
      recovered.push({ label, firstSecs: first.secs })
      console.log(`ok (${r.secs}s, recovered)`)
      return
    }
    if (r.stalled) {
      stalled.push({ label, out: r.out })
      console.log(`STALLED TWICE (${r.secs}s) – runner, not tests`)
      return
    }
  }

  if (r.failed) {
    console.log(`FAILED (${r.secs}s)`)
    failed.push({ label, out: r.out })
  } else {
    const m = r.out.match(/Tests\s+(\d+) passed/)
    console.log(`ok (${r.secs}s${m ? `, ${m[1]} tests` : ''})`)
  }
}

// ⚠ THE SKIP IS AN ENV VAR, NOT `--exclude`. Measured: passing `--exclude` three times on the CLI
// still ran all 112 files, because the unit project declares its own `exclude` and the CLI flag does
// not merge into it. vite.config.ts reads TB_UNIT_SKIP_HEAVY and appends the same list there.
run('bulk', [], { TB_UNIT_SKIP_HEAVY: '1' })
for (const file of HEAVY_UNIT_FILES) {
  run(file.replace(/^tests\//, '').replace(/\.test\.ts$/, ''), [file])
}

const total = ((Date.now() - started) / 1000).toFixed(0)
for (const r of recovered) console.error(recoveredNote(r.label, r.firstSecs))

if (failed.length === 0 && stalled.length === 0) {
  const tail = recovered.length ? ` (${recovered.length} recovered after a stall)` : ''
  console.log(`  unit: green in ${total}s${tail}`)
} else {
  for (const f of [...failed, ...stalled]) console.error(`\n===== ${f.label} =====\n${f.out}`)
  const parts = []
  if (failed.length) parts.push(`${failed.length} run(s) FAILED`)
  if (stalled.length) parts.push(`${stalled.length} stalled twice (runner, not tests)`)
  console.error(`  unit: ${parts.join(', ')} (${total}s)`)
  process.exitCode = 1
}
