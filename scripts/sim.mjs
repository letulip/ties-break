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

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Parsed out of vite.config.ts so the list cannot drift from the project definition. */
function simFiles() {
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
  const block = config.match(/const HEAVY_SIM_FILES = \[([\s\S]*?)\]/)
  if (!block) throw new Error('scripts/sim.mjs: HEAVY_SIM_FILES not found in vite.config.ts')
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1].replace(/^\*\*\//, ''))
}

const files = simFiles()
const started = Date.now()
const failed = []

for (const [i, file] of files.entries()) {
  const label = file.replace(/^tests\//, '').replace(/\.test\.ts$/, '')
  process.stdout.write(`  sim ${String(i + 1).padStart(2)}/${files.length}  ${label} … `)
  const at = Date.now()
  const run = spawnSync(
    'npx',
    ['vitest', 'run', '--project', 'sim', '--no-file-parallelism', '--reporter', 'dot', file],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
  )
  const secs = ((Date.now() - at) / 1000).toFixed(0)
  if (run.status === 0) {
    console.log(`ok (${secs}s)`)
  } else {
    console.log(`FAILED (${secs}s)`)
    failed.push({ file, output: (run.stdout || '') + (run.stderr || '') })
  }
}

const total = ((Date.now() - started) / 1000).toFixed(0)
if (failed.length === 0) {
  console.log(`  sim: ${files.length} files green in ${total}s`)
} else {
  for (const f of failed) {
    console.error(`\n===== ${f.file} =====\n${f.output}`)
  }
  console.error(`  sim: ${failed.length} of ${files.length} files FAILED (${total}s)`)
  process.exitCode = 1
}
