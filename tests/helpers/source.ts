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

// =================================================================================================
// MARKER REGIONS – R2-12 / TOK-06. A MISSING MARKER IS AN ERROR, NOT A WIDER SLICE.
// =================================================================================================
//
// ⚠⚠ THE FAILURE MODE, WITH ITS RECEIPT. A raw `src.slice(src.indexOf(a), src.indexOf(b))` does
// not fail when `b` has moved or been renamed – `indexOf` returns -1, `slice(start, -1)` means "to one
// character before the end of the string", and the region SILENTLY WIDENS to almost the whole file.
// The pin then asserts against text it was never talking about and goes on passing.
//
// It is not hypothetical and it is not rare here. Wave B found `tests/round13-nav.test.ts` slicing
// `home.slice(home.indexOf('function openKid'), home.indexOf('const showKidHint'))` – with the end
// marker `const showKidHint` living in a DIFFERENT FILE by then. The pin had been reading ~all of
// HomeScreen.vue for an unknown number of waves, green the whole time. The same family has bitten
// this repo at least four other ways (a `grep` scoped to `src/` that skipped `tests/`; a `sed`
// range that collapsed on its start line; `slice(indexOf('<template>'))` running past `</template>`
// once the SFCs grew a `<style>` block – twice).
//
// A widening slice is the worst shape a guard can take, because every direction of failure is
// green: a positive `toContain` finds its needle somewhere else in the file, a `not.toContain`
// trips only by luck, and a length check passes with room to spare.
//
// SO: these six helpers all THROW when a marker is absent. Nothing here returns -1, nothing here
// silently returns '' and nothing here widens. Migrating a raw slice to one of them cannot make a
// pin weaker – the region is identical when the markers are present, and an error when they are not.
//
// WHICH ONE TO USE – named after the shape they replace, one for one:
//
//   src.slice(src.indexOf(A), src.indexOf(B))       -> region(src, A, B)
//   src.slice(src.indexOf(A), src.lastIndexOf(B))   -> regionToLast(src, A, B)
//   src.slice(src.indexOf(A))                       -> after(src, A)
//   src.slice(0, src.indexOf(A))                    -> before(src, A)
//   src.indexOf(A)                     (as a spot)  -> at(src, A)
//   src.lastIndexOf(A)                 (as a spot)  -> lastAt(src, A)
//
// ⚠ THE SECOND SHAPE, AND IT IS THE SAME BUG WEARING A COMPARISON. `expect(a.indexOf(X))
// .toBeLessThan(a.indexOf(Y))` PASSES when X is the marker that went missing, because -1 is less
// than every real index; `toBeGreaterThan` passes when it is Y that went missing. Six such
// assertions were migrated to `at()` on 24.08. `at` is not a tidier spelling of `indexOf` – it is
// the difference between an ordering claim and a claim that quietly stopped being made.
//
// ⚠ ONE DELIBERATE SEMANTIC CHANGE, AND IT IS THE SAFE DIRECTION. `region` looks for the END marker
// AFTER the start, which is what every call site meant; the raw form searched from position 0 and
// so could pick an earlier occurrence and yield an EMPTY region – the other half of the same silent
// failure. Searching forward can only make a region the same size or larger, so a positive pin
// keeps passing and a negative pin gets STRICTER. It never reads less than it read before.

/** Where a marker starts. Throws when it is absent – never -1. */
export function at(src: string, marker: string): number {
  const index = src.indexOf(marker)
  if (index < 0) throw markerError('marker', marker, src)
  return index
}

/** Where a marker's LAST occurrence starts. Throws when it is absent – never -1. */
export function lastAt(src: string, marker: string): number {
  const index = src.lastIndexOf(marker)
  if (index < 0) throw markerError('marker', marker, src)
  return index
}

/** From `start` to the next `end` after it. Both markers must exist, in that order. */
export function region(src: string, start: string, end: string): string {
  const from = at(src, start)
  const to = src.indexOf(end, from + start.length)
  if (to < 0) throw markerError('end marker', end, src, start, from)
  return src.slice(from, to)
}

/** From `start` to the LAST `end` in the source – the `<template>` … `</template>` shape. */
export function regionToLast(src: string, start: string, end: string): string {
  const from = at(src, start)
  const to = src.lastIndexOf(end)
  if (to < 0) throw markerError('end marker', end, src, start, from)
  if (to < from) {
    throw new Error(
      `source region: the last '${abbreviate(end)}' (at ${to}) comes BEFORE the start ` +
        `'${abbreviate(start)}' (at ${from}) – the region is inverted, so the pin is aimed wrong.`,
    )
  }
  return src.slice(from, to)
}

/**
 * EVERY region between `start` and its next `end` – the CSS-rule scanner three files wrote out.
 *
 * ⚠ ZERO OCCURRENCES IS AN ANSWER, NOT AN ERROR, and that is the one difference from `region`.
 * `expect(cssBodies('.surface-dot')).toEqual([])` is a real assertion ("that rule is gone"), so an
 * absent START marker returns `[]`. An OPENED region with no close still throws – that half was
 * unguarded in all three hand-written copies, and it is the widening half.
 */
export function regions(src: string, start: string, end: string): string[] {
  const out: string[] = []
  for (let from = 0; ; ) {
    const open = src.indexOf(start, from)
    if (open < 0) return out
    const close = src.indexOf(end, open + start.length)
    if (close < 0) throw markerError('end marker', end, src, start, open)
    out.push(src.slice(open, close))
    from = open + 1
  }
}

/** From `marker` to the end of the source. */
export function after(src: string, marker: string): string {
  return src.slice(at(src, marker))
}

/** From the start of the source to `marker`. */
export function before(src: string, marker: string): string {
  return src.slice(0, at(src, marker))
}

/** The first line beginning at `marker` – the `slice(at, indexOf('\n', at))` shape. */
export function lineAt(src: string, marker: string): string {
  const from = at(src, marker)
  const end = src.indexOf('\n', from)
  return end < 0 ? src.slice(from) : src.slice(from, end)
}

function abbreviate(marker: string): string {
  const oneLine = marker.replace(/\n/g, '\\n')
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine
}

function markerError(what: string, marker: string, src: string, start?: string, from?: number): Error {
  const where =
    start === undefined
      ? ''
      : ` (the start marker '${abbreviate(start)}' was found at ${from} of ${src.length} characters)`
  return new Error(
    `source region: ${what} not found – '${abbreviate(marker)}'${where}.\n` +
      '  ⚠ This is the -1 slice this helper exists to stop: as a raw `indexOf` the region would have\n' +
      '    SILENTLY WIDENED to almost the whole file and the pin would still be green. The marker has\n' +
      '    moved, been renamed, or left the file – re-aim the pin at text that is actually there.',
  )
}
