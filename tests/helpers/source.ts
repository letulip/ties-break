// COMMENT STRIPPING FOR SOURCE-PIN TESTS – the house `codeOf`, in one place at last.
//
// WHY IT EXISTS. This codebase documents at length, INCLUDING documenting what it deliberately did
// not do, so a `not.toContain` over raw source fires on a note that merely NAMES the thing it
// forbids. Stripping the prose first is what makes a negative pin honest. Ten test files had
// written that helper out locally; this is the same helper, once.
//
// ⚠⚠ AND HERE IS WHY THERE ARE TWO OF THEM RATHER THAN ONE.
//
// The ten local copies were NOT identical, and the difference is load-bearing in the one direction
// that fails silently. Eight stripped three things (block, HTML, line comments); two stripped only
// the two JS ones. Folding those two into the three-stripper would make every pin they carry read
// LESS text than it reads today – and a source pin that stops seeing something goes GREEN. That is
// a false pass, in the exact family this repo has been burned by (the `indexOf` slice returning -1,
// the grep scoped to `src/` that skipped `tests/`).
//
// The two-stripper is also deliberate rather than accidental, which settles it: tests/knock.test.ts
// reads four files through it, and at the ONE `.vue` call site it re-applies the HTML strip itself
// (`codeOf('../src/components/KnockDialog.vue').replace(/<!--[\s\S]*?-->/g, '')`). It opts in per
// call because it does not want the strip everywhere – notably not for
// `expect(codeOf('../src/worker/sim.worker.ts')).not.toMatch(/world\.knock\s*=/)`, a NEGATIVE pin
// over a `.ts` file. Widening what that scan cannot see is the whole hazard.
//
// So: two named functions, side by side, and `tests/helpers.test.ts` asserts they still differ.
// Measured when they were merged here (19.08): over the four `.ts` files the two-stripper is used
// on today the outputs are byte-identical, so nothing is being papered over – the difference is
// prospective, which is precisely when a guard is worth keeping.

const BLOCK = /\/\*[\s\S]*?\*\//g
const HTML = /<!--[\s\S]*?-->/g
const LINE = /^\s*\/\/.*$/gm

/**
 * Code with the prose taken out: block comments, HTML/template comments, then line comments.
 *
 * The default for a pin that reads anything a `.vue` file can reach – its own history is usually
 * written in `<!-- -->` inside the template, quoting the very markup the pin bans.
 */
export function codeOf(src: string): string {
  return src.replace(BLOCK, '').replace(HTML, '').replace(LINE, '')
}

/**
 * The same, MINUS the HTML strip: JS block and line comments only, `<!-- -->` left standing.
 *
 * ⚠ NOT interchangeable with `codeOf` – see the header. For pins over script sources whose authors
 * chose not to have template comments removed under them. Callers that want the HTML strip on one
 * particular file apply it at that call site, where the choice is visible.
 */
export function scriptCodeOf(src: string): string {
  return src.replace(BLOCK, '').replace(LINE, '')
}
