// THE WEEKLY CALIBRATION'S OWN GUARD – written 07.09, because the step that reports on the run had
// no reader of its own.
//
// ⚠⚠ WHY THIS IS A UNIT TEST AND NOT "the next weekly run will tell us". It will not, and that is
// the entire finding of 07.09. `.github/workflows/simulation.yml` filed ZERO Issues across three
// weeks of red runs – it declared no `permissions:` block, so its token was read-only and
// `issues.create` 403'd every time – and nothing anywhere said so, because the failure of a
// REPORTING step is only ever visible in the log nobody is reading. Six of the workflow's seven
// runs were red and the owner found it himself, which is the job the Issue existed to take off him.
//
// A weekly cron is the slowest feedback loop in this repository. Every fault that can be moved out
// of it and into a millisecond is worth moving, so the shape of that file is pinned here: four jobs
// that cannot silence one another, the writer declaring its write, and a matrix that is GENERATED
// rather than copied.
//
// ⚠ Each assertion is mutation-verified: delete the line it guards and it goes red. That is the
// only reason to trust a pin over a config file.

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { region } from './helpers/source'
import { HEAVY_SIM_FILES } from '../scripts/heavy-tests.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const workflow = readFileSync(new URL('../.github/workflows/simulation.yml', import.meta.url), 'utf8')

// ⚠ THE NEGATIVE PIN BELOW READS THE YAML WITH ITS PROSE TAKEN OUT, for the reason
// tests/helpers/source.ts opens with: this file documents at length, including documenting the very
// thing the pin forbids ("tests/endings-bench.test.ts arrived because it drives careers"), so a
// negative assertion over raw source fires on the note rather than on the code. `codeOf` strips
// JS and HTML comments and this is YAML, so the house helper does not apply – full-line `#` only,
// which is what a YAML comment is.
const yamlCode = workflow.replace(/^\s*#.*$/gm, '')

describe('the weekly simulation calibration', () => {
  it('runs as four jobs, so that no step can silence the one that reports on it', () => {
    // The 07.09 shape. Before it, `npm audit` sat behind `test:sim` in ONE job and had therefore
    // never executed once in the workflow's life: a red sim skipped it every week.
    for (const job of ['  list:', '  sim:', '  audit:', '  report:']) {
      expect(workflow).toContain(job)
    }
  })

  it('declares issues: write on the job that opens the Issue', () => {
    // THE BUG ITSELF. `actions/github-script` needs this scope; the repository default is
    // read-only, and a workflow that declares nothing gets the default.
    const report = region(workflow, '  report:', '      - uses: actions/github-script@v7')
    expect(report).toContain('issues: write')
  })

  it('keeps fail-fast off, so one dead file cannot hide the twelve behind it', () => {
    const sim = region(workflow, '  sim:', '    steps:')
    expect(sim).toContain('fail-fast: false')
  })

  it('generates the matrix instead of carrying a second copy of the file list', () => {
    // ⚠ A list hand-copied into YAML would be the THIRD copy of the list whose second copy
    // scripts/heavy-tests.mjs was created to abolish – and a copy that drifts runs fewer files than
    // it prints, which is the failure scripts/sim.mjs's own header opens with.
    expect(yamlCode).not.toMatch(/tests\/[\w./-]+\.test\.ts/)
    expect(workflow).toContain('fromJSON(needs.list.outputs.files)')
  })
})

describe('scripts/sim.mjs as the matrix calls it', () => {
  it('refuses a file that is not in HEAVY_SIM_FILES rather than running nothing', () => {
    // The matrix hands this script one name per job. If an entry ever stops matching the list, the
    // job must go RED – a silent pass-through would run zero tests and report itself green, once
    // per job, thirteen times a week.
    const run = spawnSync(process.execPath, ['scripts/sim.mjs', 'tests/not-a-real-bench.test.ts'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
    expect(run.status).not.toBe(0)
    expect(run.stderr).toContain('HEAVY_SIM_FILES')
    // ⚠ AND IT MUST REFUSE BEFORE IT RUNS ANYTHING. Without this line the pin passes for the wrong
    // reason: delete the guard and vitest still exits non-zero on a file that is not there, with
    // the same stderr, so the assertions above cannot tell a refusal from a failed run. The loop
    // writes "  sim  1/1  <name> … " before spawning, so silent stdout IS the refusal.
    expect(run.stdout).toBe('')
  })

  it('names only files that exist, so a generated matrix cannot point at a ghost', () => {
    const missing = HEAVY_SIM_FILES.filter((f) => !existsSync(new URL(f, new URL(ROOT, 'file:'))))
    expect(missing).toEqual([])
  })
})
