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
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
  scripts: Record<string, string>
}

/** Scripts that hand the sim project to vitest – either by naming it or by running every project. */
function scriptsRunningSim(): [string, string][] {
  return Object.entries(pkg.scripts).filter(([, cmd]) => {
    if (!cmd.includes('vitest run')) return false
    if (cmd.includes('--project sim')) return true
    // no --project at all means every project, which includes sim
    return !cmd.includes('--project')
  })
}

describe('the sim project runs serialised', () => {
  it('every script that runs it carries --no-file-parallelism', () => {
    const offenders = scriptsRunningSim().filter(([, cmd]) => !cmd.includes('--no-file-parallelism'))
    expect(
      offenders.map(([name]) => name),
      'these scripts run the sim project in parallel and will exit 1 with every test green',
    ).toEqual([])
  })

  it('...and a low-chatter reporter, which is the second half of the same mitigation', () => {
    // Measured 02.08: with the flag but the DEFAULT reporter, `test:sim` exited 1 on one run and 0
    // on the next – the per-test tree re-render keeps far more `onTaskUpdate` acks in flight, so the
    // race against birpc's 60s window is lost more often. `--reporter=dot` still prints the summary
    // and every failure; it only drops the per-test tree nobody reads in CI.
    const offenders = scriptsRunningSim().filter(([, cmd]) => !cmd.includes('--reporter=dot'))
    expect(offenders.map(([name]) => name), 'these run the sim project with the chatty default reporter').toEqual([])
  })

  it('...and there is at least one such script, so the rule above cannot pass vacuously', () => {
    expect(scriptsRunningSim().length).toBeGreaterThan(0)
  })

  it('the unit project is NOT serialised – it is 100+ fast files and parallelism is the point', () => {
    const unit = pkg.scripts['test']
    expect(unit).toContain('--project unit')
    expect(unit).not.toContain('--no-file-parallelism')
  })
})
