// THE THREE REGISTRY GATES, AND WHERE EACH ONE RUNS – T5.8 / H-02 (a) + (b), 26.09.
//
// ⚠⚠ THE HOUSE PATTERN: THE RULE LIVES IN THE RUNNER, AND THE SUITE'S JOB IS TO PROVE THE RUNNER IS
// WIRED IN (`tests/sim-serialisation.test.ts`, `tests/round29p2-offline-install.test.ts`). A gate that
// runs nowhere is this repository's oldest tooling defect – `check:tools` «used to run on demand,
// which meant it ran never», and the 02.09 review found it red with nine errors across six tools. So
// what is asserted here is not what the checks DO, it is WHERE they run: `pins:check` and
// `decisions:check` lived only in `npm run check` until 26.09 and no CI job touched them, and the
// pre-commit hook that catches a stale registry at the commit is a file somebody can delete.
//
// ⚠ WHY IT MATTERS IN NUMBERS (H-02, replayed over all 1,036 commits of the 22 days to 26.09):
// 132 commits (12.7 %) leave at least one of the three generated files stale – `tools/README.md`,
// `tools/generated/world-symbol-map.md`, the block inside `docs/decisions.md` – in 34 onsets, about
// four commits per episode, 16 catch-up commits. None of main's first-parent commits is red: the
// staleness lives on branches, which is where agents gate. Twice a wave's own BASE was red, and
// because `npm run check` is an `&&` chain with these at steps 5-7, that hides the typecheck, the
// unit gate, the component project and the build behind a docs error.
import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const pkg = JSON.parse(read('package.json'))
const ci = read('.github/workflows/ci.yml')
const hook = read('.githooks/pre-commit')

describe('the registry gates are wired where they are supposed to run', () => {
  it('CI runs pins:check and decisions:check – H-02 (b), the half that had no job at all', () => {
    // ⚠ The `- run:` prefix is load-bearing: both names appear in this file's own comments, and a
    // grep for the bare name would be satisfied by prose. This asserts a STEP.
    expect(ci).toContain('- run: npm run pins:check')
    expect(ci).toContain('- run: npm run decisions:check')
  })

  it('...and the pre-push gate still runs all four, in its own order', () => {
    const check: string = pkg.scripts.check
    for (const name of ['pins:check', 'decisions:check', 'map:world:check', 'tools:registry:check']) {
      expect(check, `npm run check no longer runs ${name}`).toContain(name)
    }
  })

  it('the pre-commit hook exists, is executable, and is wired by `prepare`', () => {
    // `core.hooksPath` is relative, so each worktree runs its own copy – which is why `prepare`
    // setting it once for the repository is enough and why this wave's hook cannot reach the owner's
    // checkout before the merge does.
    expect(pkg.scripts.prepare).toContain('core.hooksPath .githooks')
    expect(statSync(join(ROOT, '.githooks/pre-commit')).mode & 0o111).toBeGreaterThan(0)
  })

  it('the hook runs each check only when ITS inputs are staged, and names the fix on red', () => {
    // Three checks, three regenerating commands. A hook that refused without naming the command is
    // a hook that gets `--no-verify`d, and then the staleness is back.
    expect(hook).toContain('npm run decisions')
    expect(hook).toContain('npm run map:world')
    expect(hook).toContain('npm run tools:registry')
    expect(hook).toContain('git diff --cached --name-only --diff-filter=ACMR')
  })

  it('...and it never blocks a commit it cannot judge – measured at 0.01 s when it judges nothing', () => {
    // ⚠⚠ THE ARM THAT MATTERS MOST. A hook that exits non-zero without a toolchain turns every
    // commit into a puzzle, on a machine where nobody can read the puzzle. Proven 26.09 in a bare
    // scratch repository: no `node_modules` -> exit 0; `node_modules` but no scripts -> exit 0; no
    // `node` on PATH -> exit 0; and `git commit` in that repository succeeded. These are the four
    // doors that produced those exits, in the order the hook reads them.
    expect(hook).toMatch(/command -v node[^\n]*\|\| exit 0/)
    expect(hook).toMatch(/command -v git[^\n]*\|\| exit 0/)
    expect(hook).toMatch(/\[ -d node_modules \] \|\| exit 0/)
    expect(hook).toMatch(/\[ -f "\$script" \] \|\| return 0/)
    // Nothing staged is the overwhelmingly common commit, and it must cost one `git diff`.
    expect(hook).toMatch(/\[ -n "\$staged" \] \|\| exit 0/)
  })
})
