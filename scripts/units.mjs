// THE UNIT SUITE: the light 218 in one pool, the heavy 13 a process each – strictly one at a time
// on a small runner, a few at a time on a big machine. (It read «the light 109 … the heavy three»
// until 05.09; both halves have roughly doubled since, and the counts are derived, not declared.)
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

import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'
import { classify, recoveredNote } from './lib/stall.mjs'
// ⚠ IMPORTED, NOT A SECOND COPY (round-22 review). This file used to carry its own hand-maintained
// duplicate of the list vite.config.ts declared – measured, commented and correct, and with nothing
// but discipline keeping the two in step. A file added to one and not the other either runs twice
// or stays in the bulk pool it was moved out of, and the symptom of THAT is the birpc stall this
// whole script exists to prevent, arriving months later on a CI runner with every test green.
// One array now, read by this script and by the unit project's `exclude`. See scripts/heavy-tests.mjs
// (which carries the measurements this docblock used to).
import { HEAVY_UNIT_FILES } from './heavy-tests.mjs'

const reporter = process.argv.includes('--verbose') ? 'default' : 'dot'
const started = Date.now()
const failed = []
const stalled = []
const recovered = []

// ⚠ `spawn` AND A PROMISE, WHERE THIS WAS `spawnSync` (P-13, 05.09). Nothing about one shard
// changed – same argv, same buffered stdio, same `classify` on the same exit code – but the caller
// can now hold more than one at a time, which is what the heavy loop below does. A shard that
// cannot be awaited is a shard that cannot be scheduled.
// ⚠ `error` IS SETTLED AS A FAILURE, NOT SWALLOWED. A spawn that never starts (a missing `npx`)
// produces no vitest summary, and `classify(1, '')` reads a summary-less run as a real failure –
// the safe direction, and the same one stall.mjs's header argues for: silence must never read as
// green.
function once(args, env) {
  const at = Date.now()
  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', '--project', 'unit', '--reporter', reporter, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    })
    let out = ''
    let settled = false
    const finish = (status) => {
      if (settled) return
      settled = true
      resolve({ secs: ((Date.now() - at) / 1000).toFixed(0), out, ...classify(status, out) })
    }
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => (out += chunk))
    child.stderr.on('data', (chunk) => (out += chunk))
    child.on('error', (e) => {
      out += `\n${e.stack ?? e.message}\n`
      finish(1)
    })
    child.on('close', finish)
  })
}

// ⚠ ONE RETRY, AND ONLY FOR THE ALL-GREEN-NON-ZERO SHAPE (10.08). CI went red with
// `Tests 61 passed (61)` and `Timeout calling "onTaskUpdate"` on the radar shard at 62.63s - the
// same birpc wall this file's header already describes, arriving on a slower runner rather than on
// a bigger suite. A failing ASSERTION is never retried: see scripts/lib/stall.mjs for why the
// distinction is mechanical rather than a judgement here.
// ⚠ EACH LINE IS NOW PRINTED WHOLE, AT COMPLETION, rather than opened with `  unit  x … ` and
// closed a minute later. The words are byte-identical; only the timing moved. With more than one
// shard in flight the old two-part write braided two shards' halves into one unreadable line, and
// the line is the only thing a CI log carries – so the shard's name and its verdict have to leave
// this function together. The order is completion order rather than list order, which is why every
// line names its shard.
async function run(label, args, env = {}) {
  let line = `  unit  ${label} … `
  let r = await once(args, env)

  if (r.stalled) {
    line += `stalled (${r.secs}s, every test green) – retrying once … `
    const first = r
    r = await once(args, env)
    if (!r.stalled && !r.failed) {
      recovered.push({ label, firstSecs: first.secs })
      console.log(line + `ok (${r.secs}s, recovered)`)
      return
    }
    if (r.stalled) {
      stalled.push({ label, out: r.out })
      console.log(line + `STALLED TWICE (${r.secs}s) – runner, not tests`)
      return
    }
  }

  if (r.failed) {
    console.log(line + `FAILED (${r.secs}s)`)
    failed.push({ label, out: r.out })
  } else {
    const m = r.out.match(/Tests\s+(\d+) passed/)
    console.log(line + `ok (${r.secs}s${m ? `, ${m[1]} tests` : ''})`)
  }
}

// ⚠ THE SKIP IS AN ENV VAR, NOT `--exclude`. Measured: passing `--exclude` three times on the CLI
// still ran all 112 files, because the unit project declares its own `exclude` and the CLI flag does
// not merge into it. vite.config.ts reads TB_UNIT_SKIP_HEAVY and appends the same list there.
// ⚠⚠ CI SPLIT THE WALL, NOT THE WORK (owner, 30.08, measured on his own Actions log). The gate ran
// 18m32s and `npm test` was 15m08s of it: `bulk` 501 s, then the eleven heavy files STRICTLY
// SERIALLY for a further 406 s (501 + 406 = 907, and the log said 908 – the sum, to the second).
// A heavy file is one process, so for 406 s of every run HALF THE RUNNER IDLED BY CONSTRUCTION.
//
// ⚠ AND THE FIX IS NOT TO RUN THEM SIDE BY SIDE HERE. Separate processes exist because of birpc's
// stall under contention (the note at the top of this file); crowding them back onto two cores is
// the defect they were carved out of. The split belongs in CI, where each job gets its OWN runner –
// `npm ci` measured at 6 s, so a second job costs six seconds of billing to save minutes of wall.
//
// So this script learns two halves and no scheduling of its own: the default still runs everything,
// in the same order, on one machine.
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length)
if (only && only !== 'bulk' && only !== 'heavy') {
  console.error(`units: --only takes 'bulk' or 'heavy', got '${only}'`)
  process.exit(2)
}
// ⚠⚠ THE HEAVY TAIL IS NO LONGER STRICTLY SERIAL ON A MACHINE WITH CORES TO SPARE – AND ON CI IT
// STILL IS, WHICH IS THE WHOLE DESIGN (P-13 of the 05.09 review). Every incident in this file's
// header was a shard crossing birpc's unraisable 60 s wall, and every one of them was CI's two
// cores. The serialisation is the fix for THAT machine. On the ten-core Mac the same rule was
// costing 219 s of every gate with nine cores idle by construction, which is not the same trade.
//
// So the bound is DERIVED FROM THE MACHINE and nothing has to be remembered:
//
//     availableParallelism()   2  (GitHub runner, private repo)  ->  1   today's behaviour exactly
//                              4  (GitHub runner, public repo)   ->  1   today's behaviour exactly
//                              10 (this Mac)                     ->  2
//
// ⚠⚠ THE DIVISOR IS 4 AND IT WAS 3 FOR AN HOUR, AND THE HOUR IS THE POINT. Three lanes is faster
// and it puts the two biggest shards ON the line. Measured by alternating the arms back to back on
// one machine at one ambient load (5.9-8.6), so the comparison is between the arms and not between
// two moments:
//
//     lanes   heavy tail wall            worst shard
//     1       217 / 243 s                25 s   (and one ambient spike to 44 s, at ONE lane)
//     2       118 / 119 s                26 s   (identical in both runs)
//     3        94 /  97 /  98 s          28 / 29 / 31 s
//
// Three lanes buys 23 s more and spends 4-5 s of every big shard's headroom to get it. On a QUIET
// machine three lanes reads 26 s and looks free; on a machine with an agent on it, which is the
// machine this gate actually runs on, it reads 30 and 31. Two lanes read 26 s in both conditions.
// The gate is not allowed to become 23 s faster and one busy afternoon closer to the wall, so the
// divisor is 4. It also keeps strict serialisation all the way to seven cores, which covers every
// runner shape this project has ever used.
//
// THE NUMBER IT WAS COSTING, measured at 919105e7 on this ten-core Mac. Three runs per arm of
// `node scripts/units.mjs --only=heavy`, machine checked quiet before each (`uptime` recorded,
// `pgrep -lf "vitest|vite-node|playwright|vite build"` empty at every start), every exit code
// echoed into a file and read back from the FILE, never through a pipe:
//
//     one at a time (before)    211 / 214 / 214 s    median 214    worst shard 25 s
//     two at a time (after)     132 / 127 / 118 /    median 119    worst shard 26 s
//                               119 / 118 s
//
// ~95 s off the median for one second on the biggest shard: economy 25 -> 26, college-birthday
// 25 -> 26, and every other file within 2 s of where it stood. `node scripts/units.mjs` in full,
// exit 0 and the same 4,574 tests either way (bulk 4,217 + 357 across the thirteen).
// ⚠ The five «after» readings span two ambient loads on purpose – 118 s is a quiet machine and
// 132 s is one with another agent's suite on it. The worst shard is 26 s in both, which is the
// number that matters.
//
// ⚠ AND THE OTHER CEILING WAS CHECKED, BECAUSE A FASTER GATE THAT FLAKES IS WORSE THAN A SLOW ONE.
// The unit project's per-test ceiling is 20 s (vite.config.ts), and contention is what has fired it
// before, so it is the ceiling that matters more than birpc's. The three largest shards,
// `--reporter=json`, run one at a time and then ALL THREE at once – a deliberate over-estimate,
// since the divisor now runs two. Slowest single test in each:
//
//     economy             6.8 s -> 7.1 s      college-birthday   3.6 s -> 3.7 s
//     coach-travel-edge   1.7 s -> 1.9 s      (wall for the three: 67 s -> 25 s)
//
// Even at three lanes the slowest test in the heavy tail moves by 0.3 s and sits at a third of its
// ceiling, so the per-test wall is not what the divisor is protecting – the per-SHARD wall is.
//
// ⚠ THE BAR IS THE SHARD, NOT THE TOTAL, and it is the bar every entry in scripts/heavy-tests.mjs
// is already measured against: birpc's window is 60 s of ONE shard's wall clock, CI runs ~1.9x
// local, so a shard printing much over ~30 s here is one unlucky runner away from the
// all-green-non-zero exit this whole scheme exists to dodge. If a shard ever crosses it, the
// divisor is wrong, and the honest answer is the one heavy-tests.mjs gives: fewer workers per core,
// measured – never fewer tests.
//
// ⚠ NOT SORTED LONGEST-FIRST, though that would shave a few more seconds off the makespan. The
// order stays HEAVY_UNIT_FILES' order so one log can be diffed against another and against the
// list; a schedule that ranks files by duration is a second, invisible copy of a measurement only
// scripts/heavy-tests.mjs is allowed to hold, and this file's own history is a catalogue of what a
// second copy of that list costs.
//
// ⚠ AND THE BULK PASS IS UNTOUCHED, still first and still alone. It already saturates the pool, so
// starting a heavy shard beside it would be exactly the contention the tail was carved out of.
const HEAVY_LANES = Math.max(1, Math.floor(availableParallelism() / 4))

async function runHeavy(files) {
  const lanes = Math.min(HEAVY_LANES, files.length)
  console.log(`  unit  heavy: ${files.length} files, ${lanes} at a time (${availableParallelism()} cores)`)
  const queue = [...files]
  const lane = async () => {
    for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
      await run(file.replace(/^tests\//, '').replace(/\.test\.ts$/, ''), [file])
    }
  }
  await Promise.all(Array.from({ length: lanes }, lane))
}

if (only !== 'heavy') await run('bulk', [], { TB_UNIT_SKIP_HEAVY: '1' })
if (only !== 'bulk') await runHeavy(HEAVY_UNIT_FILES)

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
