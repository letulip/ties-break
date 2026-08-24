// P6 (d) – THE SIM PROJECT MUST RUN SERIALISED, IN EVERY SCRIPT THAT RUNS IT.
//
// WHY THIS FILE EXISTS. birpc gives every vitest worker RPC a HARD-CODED 60s timeout
// (node_modules/birpc: DEFAULT_TIMEOUT = 6e4, not configurable in vitest 3.2.7). The sim files are
// minutes of synchronous Monte-Carlo, so run in parallel the forks and the main process fight for
// cores, a pending `onTaskUpdate` ack sits past the minute, and the run exits 1 WITH EVERY TEST
// GREEN. The honest lever is `--no-file-parallelism` on the CLI, because vitest 3.2.7 ignores
// `fileParallelism` at project level (createForksPool builds one pool for the whole run off the
// ROOT config) – the reasoning is spelled out at vite.config.ts's sim project.
//
// THE FAILURE MODE THIS GUARDS. `test:sim` carried the flag; `test:sim:quiet` and `test:all` did
// not, and both reproduced the red-on-green exit (measured 02.08: `test:sim:quiet` EXIT=1, four
// files and 77 tests passed, 2 errors). A fix applied to one script and not its twins is invisible
// until a cron goes red months later, which is exactly what the weekly calibration job is for.
//
// So: any script whose command runs the sim project must carry the flag. Not "the ones we
// remembered" – all of them, checked mechanically.
//
// =================================================================================================
// ⚠⚠ RE-AIMED 24.08 (R2-03), AND IT WAS AIMED AT NOTHING. The review said this guard "scripts TEXT
// rather than the real runner arguments"; a mutation settled it in one run.
//
// WHAT IT USED TO DO. `scriptsRunningSim()` filtered package.json for scripts whose command string
// contains `vitest run`. On 05.08 `test:sim` and `test:sim:quiet` both became `node scripts/sim.mjs`
// – no `vitest run` in either string – so BOTH dropped out of the filter. The only script left
// matching was `test:all`, which is not the sim gate and is not what CI runs. The vacuity check
// (`length > 0`) passed on that one accidental survivor, so the file looked healthy while covering
// none of the sim.
//
// THE MUTATION. Delete `--no-file-parallelism` from `scripts/sim.mjs`'s actual argv – the exact
// regression this file exists to prevent, on the exact line `npm run test:sim` and the weekly CI job
// both execute. RESULT: 4 passed, exit 0. The guard was false.
//
// ⚠ AND SCANNING THE RUNNER'S WHOLE SOURCE WOULD NOT HAVE FIXED IT EITHER: `scripts/sim.mjs`'s own
// header comment names `--no-file-parallelism` in prose, so a file-level `includes` stays green with
// the flag deleted from the command. What is checked below is the ARGV ARRAY the runner spawns.
//
// This is the same move the unit half of this file made on 05.08 and for the same reason – see the
// last test. The sim half simply never followed.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
  scripts: Record<string, string>
}

/** `vitest run` on a shell command line. */
const SHELL_VITEST_RUN = /\bvitest\s+run\b/
/** `--project sim` in every spelling in use: `--project sim`, `--project=sim`, `'--project', 'sim'`. */
const PROJECT_SIM = /--project['"]?\s*[,= ]\s*['"]?sim\b/
/** any `--project` at all, so "no --project means every project" can still be answered. */
const ANY_PROJECT = /--project\b/
/** the low-chatter reporter, same three spellings. */
const DOT_REPORTER = /--reporter['"]?\s*[,= ]\s*['"]?dot\b/
/** a runner this repo delegates to – `node scripts/sim.mjs`. */
const RUNNER_PATH = /scripts\/[\w.-]+\.mjs/g
/** the vitest ARGV ARRAY a runner spawns, source text only: `['vitest', 'run', …]`. Deliberately
 *  stops at the first `]`, and deliberately not the whole file – see the header. */
const VITEST_ARGV = /\[\s*['"]vitest['"]\s*,[^\]]*\]/g

function runnerSource(rel: string): string | null {
  try {
    return readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8')
  } catch {
    return null // a script naming a file that is not there is not this test's problem
  }
}

/** Every place ONE package script actually hands the sim project to vitest: the command string when
 *  the script IS the invocation, and the spawned ARGV when it delegates to a runner. */
function simInvocationsOf(name: string, cmd: string): { where: string; command: string }[] {
  const out: { where: string; command: string }[] = []
  if (SHELL_VITEST_RUN.test(cmd) && (PROJECT_SIM.test(cmd) || !ANY_PROJECT.test(cmd))) {
    out.push({ where: `package.json "${name}"`, command: cmd })
  }
  for (const [rel] of cmd.matchAll(RUNNER_PATH)) {
    const src = runnerSource(rel)
    if (!src) continue
    for (const [argv] of src.matchAll(VITEST_ARGV)) {
      // A runner is only in scope when its own argv NAMES the sim project. `scripts/units.mjs`
      // spawns `'--project', 'unit'` and is none of this rule's business.
      if (PROJECT_SIM.test(argv)) out.push({ where: `${rel}, spawned by "${name}"`, command: argv })
    }
  }
  return out
}

function simInvocations(): { where: string; command: string }[] {
  return Object.entries(pkg.scripts).flatMap(([name, cmd]) => simInvocationsOf(name, cmd))
}

describe('the sim project runs serialised', () => {
  it('every invocation that runs it carries --no-file-parallelism', () => {
    const offenders = simInvocations().filter(({ command }) => !command.includes('--no-file-parallelism'))
    expect(
      offenders.map((o) => o.where),
      'these run the sim project in parallel and will exit 1 with every test green',
    ).toEqual([])
  })

  it('...and a low-chatter reporter, which is the second half of the same mitigation', () => {
    // Measured 02.08: with the flag but the DEFAULT reporter, `test:sim` exited 1 on one run and 0
    // on the next – the per-test tree re-render keeps far more `onTaskUpdate` acks in flight, so the
    // race against birpc's 60s window is lost more often. `--reporter=dot` still prints the summary
    // and every failure; it only drops the per-test tree nobody reads in CI.
    const offenders = simInvocations().filter(({ command }) => !DOT_REPORTER.test(command))
    expect(offenders.map((o) => o.where), 'these run the sim project with the chatty default reporter').toEqual([])
  })

  it('⚠ ...and what `npm run test:sim` ACTUALLY runs is one of them – the rule cannot pass by proxy', () => {
    // ⚠⚠ THE ANTI-VACUOUS CLAIM, AND IT IS STRICTLY STRONGER THAN THE `length > 0` IT REPLACES. That
    // one was satisfied by `test:all` alone – a script nobody runs as the sim gate – for the nineteen
    // days `test:sim` spent invisible to this file. The gate has to be covered by NAME, or the rules
    // above are being kept by somebody else's script.
    expect(simInvocations().length, 'the rules above have nothing to check').toBeGreaterThan(0)
    const gate = simInvocationsOf('test:sim', pkg.scripts['test:sim'])
    expect(gate.length, 'the sim gate itself is invisible to the rules above').toBeGreaterThan(0)
  })

  it('the unit project is NOT serialised – it is 100+ fast files and parallelism is the point', () => {
    // ⚠ RE-AIMED 05.08, and it caught a real change before it could ship – which is the point of it.
    //
    // `npm test` used to be a literal vitest invocation, so the guard could read the flags straight
    // off the script string. It is now `node scripts/units.mjs`, because the population going
    // 520 -> 1,600 pushed the unit suite past birpc's unraisable 60s RPC window on CI (everything
    // green, exit 1 — see that script's header). The heavy tail gets a process each; the other 109
    // files still run in parallel, which is what this test actually cares about.
    //
    // So the assertion moves from the SCRIPT STRING to the THING IT RUNS. Serialisation is still
    // forbidden, now checked wherever the unit project is actually invoked, and the runner must
    // still be pointed at the unit project. Not weakened: it reads the real command now instead of
    // a string that happened to contain it.
    const unit = pkg.scripts['test']
    const runner = unit.includes('scripts/units.mjs')
      ? readFileSync(fileURLToPath(new URL('../scripts/units.mjs', import.meta.url)), 'utf8')
      : unit
    expect(runner, 'the unit suite must run the unit project').toContain("'--project', 'unit'")
    expect(runner, 'the unit project must never be serialised').not.toContain('--no-file-parallelism')
  })
})
