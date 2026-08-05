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

import { spawnSync } from 'node:child_process'

/** Measured, not guessed: the three slowest files under contention, and the only ones holding a
 *  core for double digits of seconds. Re-derive with `--reporter=json` and sum per file. */
const HEAVY_UNIT_FILES = ['tests/economy.test.ts', 'tests/radar.test.ts', 'tests/kidLife.test.ts']

const reporter = process.argv.includes('--verbose') ? 'default' : 'dot'
const started = Date.now()
const failed = []

function run(label, args, env = {}) {
  const at = Date.now()
  process.stdout.write(`  unit  ${label} … `)
  const r = spawnSync('npx', ['vitest', 'run', '--project', 'unit', '--reporter', reporter, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  const secs = ((Date.now() - at) / 1000).toFixed(0)
  const out = (r.stdout || '') + (r.stderr || '')
  if (r.status === 0) {
    const m = out.match(/Tests\s+(\d+) passed/)
    console.log(`ok (${secs}s${m ? `, ${m[1]} tests` : ''})`)
  } else {
    console.log(`FAILED (${secs}s)`)
    failed.push({ label, out })
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
if (failed.length === 0) {
  console.log(`  unit: green in ${total}s`)
} else {
  for (const f of failed) console.error(`\n===== ${f.label} =====\n${f.out}`)
  console.error(`  unit: ${failed.length} run(s) FAILED (${total}s)`)
  process.exitCode = 1
}
