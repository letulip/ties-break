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

// =================================================================================================
// ⚠⚠ AND THE ORDERING WAS ITSELF THE FAILURE THE NOTE ABOVE DESCRIBES – T6.11, 28.09.
// =================================================================================================
//
// ⭐ THE SENTENCE THAT IS THE FINDING. The header argues that folding the two strippers «would make
// every pin they carry read LESS text than it reads today – and a source pin that stops seeing
// something goes GREEN». That reasoning was right and it was pointed at the wrong change. The
// stripping ORDER was already doing exactly that, in 85 files, every day, and nothing said so.
//
// WHAT THESE THREE USED TO BE, and the order they ran in:
//
//     const BLOCK = /\/\*[\s\S]*?\*\//g
//     const HTML  = /<!--[\s\S]*?-->/g
//     const LINE  = /^\s*\/\/.*$/gm
//     codeOf       = src.replace(BLOCK, '').replace(HTML, '').replace(LINE, '')
//     scriptCodeOf = src.replace(BLOCK, '').replace(LINE, '')
//
// BLOCK ran FIRST. This codebase writes path globs in prose – `world/*`, `world/*.ts`,
// `public/images/**` – and a glob puts a SLASH IMMEDIATELY BEFORE A STAR. So a `//` line, or a
// regex literal, or a quoted marker in a string, could OPEN a block comment that ran to the next
// `*/` anywhere below and deleted the code in between. Found in `tests/import-cycles.test.ts`, whose
// own copy of this order left it unable to see a planted import cycle (T6.9); this is the same
// defect in the house helper, where 27 test files read through it.
//
// ⚠⚠ MEASURED BEFORE THE CHANGE, 1,355 files across `src`, `tests`, `tools`, `e2e`, `scripts`:
// **85 files in which `codeOf()` deleted code a comment-aware strip keeps, 183,115 non-whitespace
// characters.** `tests/offers.test.ts` 47,739 · `tests/knock.test.ts` 18,854 ·
// `tests/wave4-ended-beat.test.ts` 15,965 · `tests/spirit.test.ts` 11,202 ·
// `tests/wave6-spotlight-pressure.test.ts` 9,212 · `tools/album-corpus-emit.ts` 4,020.
//
// ⭐⭐ WHY NOT JUST SWAP THE TWO CALLS, which is the obvious fix and is what `import-cycles` first
// tried. Because it is not correct, and here the difference is not theoretical: a block comment whose
// closing marker sits on a line beginning `//` loses its terminator to the LINE pass and the block
// then runs on exactly as before, and neither ordering knows what a STRING is. Measured on the same
// 1,355 files: **the swap still disagrees with the scanner in 41 of them, and in all 41 it is the
// swap that eats** – `tests/offers.test.ts` +34,596 characters, `tests/knock.test.ts` +11,248,
// `tests/spirit.test.ts` +11,202, `tools/album-corpus-emit.ts` +4,020. Test files quote comment
// markers and regexes for a living, which is exactly where the 27 readers point.
//
// ⚠ THE CHANGE IS DELIBERATELY MONOTONE, and this is what makes the triage of those 27 readable:
// **0 files lose a single character.** The scanner reproduces the old semantics exactly – a line
// comment is dropped only when it was the whole line, a trailing `code // note` is KEPT verbatim
// (it simply can no longer open a block), block and HTML comments are replaced by '' with no newline
// kept, like the regexes – so the only difference anywhere is that an opener inside a string, a
// template or a comment is no longer an opener. Text can only come BACK, which makes every negative
// pin STRICTER and never weaker, so a new red is a real hole and not a re-calibration.
//
// ⚠ ITS STATED LIMIT, UNCHANGED FROM `tests/import-cycles.test.ts`: **it is not regex-literal-aware.**
// The claim is «a lexer for comments, strings and templates», and no more. Telling a regex literal
// from a division needs a real parser. This is not idle – `tests/wave4-spirit-shock.test.ts` holds
// `.replace(/\/\*[\s\S]*?\*\//g, '')`, whose bytes contain a `*` next to a `/`, and an earlier draft
// of this scanner that treated a TRAILING `//` as a comment deleted 498 characters there. Restricting
// the drop to whole-line comments closes that case too: a regex literal never begins a line with two
// slashes. A `/*` inside a regex literal on a line of its own would still fool it; the tree holds
// none, and when one appears the honest fix is a parser, not another special case.
//
// ⚠ WHAT `<!--` NOW DOES. It is folded into the same pass rather than left as a second regex beside
// it, so `codeOf` treats it as a comment ONLY where it is markup: inside a string or a template
// literal it is now ordinary text and survives, where the old `HTML` regex removed it wherever it
// appeared. That is the same monotone direction (text comes back) and it is the honest reading – a
// `'<!-- x -->'` inside a quoted string is a string, not a template comment. `scriptCodeOf` does not
// treat `<!--` as a comment at all, which is the whole reason the two helpers exist.

/**
 * Code with the prose taken out: block comments, HTML/template comments, then line comments.
 *
 * The default for a pin that reads anything a `.vue` file can reach – its own history is usually
 * written in `<!-- -->` inside the template, quoting the very markup the pin bans.
 */
export function codeOf(src: string): string {
  return stripComments(src, { html: true, newlines: false })
}

/**
 * The same, MINUS the HTML strip: JS block and line comments only, `<!-- -->` left standing.
 *
 * ⚠ NOT interchangeable with `codeOf` – see the header. For pins over script sources whose authors
 * chose not to have template comments removed under them. Callers that want the HTML strip on one
 * particular file apply it at that call site, where the choice is visible.
 */
export function scriptCodeOf(src: string): string {
  return stripComments(src, { html: false, newlines: false })
}

// =================================================================================================
// ⚠⚠ ONE LEXER, AND IT IS SHARED WITH `tests/import-cycles.test.ts` – T6.11, 28.09.
// =================================================================================================
//
// WHY IT IS NOT TWO. The cycle judge had its own copy of this scan, and the argument for folding them
// is not tidiness (F-03 / T5.14's rule): **the thing that would drift between two copies is the
// DEFINITION OF A COMMENT, and that definition is exactly what both instruments were wrong about, in
// two different ways, inside one wave.** A shared lexer with a parameter is one definition with a
// parameter; two lexers that differ in one behaviour are two definitions that happen to agree today.
// The defect bit the live `world/lifeBeat.ts`, a fixture written to demonstrate it, and the probe
// written to measure it – three times in one session, in a codebase that writes globs and regexes in
// prose.
//
// ⚠ THE TWO OPTIONS ARE BOTH REQUIRED, with no default, so every call site states what it wants and
// nobody inherits a reading they did not choose. `tests/helpers.test.ts` pins both values of
// `newlines` against the same input, so the flag's meaning is asserted rather than implied.
/**
 * ONE left-to-right pass that knows what a comment IS – see the block above for the defect it
 * replaces, the measurement, and its stated limit (it is NOT regex-literal-aware).
 *
 * `html` – does `<!-- -->` count as a comment? True for `codeOf`, false for `scriptCodeOf` and for
 *          the cycle judge, whose reading of `src/` must not move.
 * `newlines` – does a block/HTML comment leave its newlines behind?
 *          **false** reproduces the regexes this replaced, which is what the 26 pins reading through
 *          `codeOf` are calibrated to: a multi-line comment collapses and the text around it joins.
 *          **true** keeps the line structure, which `tests/import-cycles.test.ts` needs because its
 *          parser is `^`-anchored – with the newlines dropped, an inline comment between two import
 *          statements JOINS them into one line and the second one stops being seen at all.
 */
export function stripComments(src: string, options: { html: boolean; newlines: boolean }): string {
  const { html, newlines } = options
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    // A LINE COMMENT. Dropped only when it was the whole line – the old `LINE` regex was anchored
    // with `^\s*`, and a trailing comment stays so this change cannot take text away from any pin.
    if (c === '/' && src[i + 1] === '/') {
      const from = i
      while (i < n && src[i] !== '\n') i++
      const lineStart = out.lastIndexOf('\n') + 1
      if (out.slice(lineStart).trim() === '') out = out.slice(0, lineStart)
      else out += src.slice(from, i)
      continue
    }
    // A BLOCK COMMENT. Replaced by '' – with its newlines when `newlines`, exactly as the regex did
    // when not. See the options' note: dropping them JOINS the lines around the comment.
    if (c === '/' && src[i + 1] === '*') {
      i += 2
      let broke = 0
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') broke++
        i++
      }
      i += 2
      if (newlines) out += '\n'.repeat(broke)
      continue
    }
    // AN HTML/TEMPLATE COMMENT, for `codeOf` only.
    if (html && c === '<' && src.startsWith('<!--', i)) {
      i += 4
      let broke = 0
      while (i < n && !src.startsWith('-->', i)) {
        if (src[i] === '\n') broke++
        i++
      }
      i += 3
      if (newlines) out += '\n'.repeat(broke)
      continue
    }
    // A STRING. ⚠ BOUNDED TO THE LINE: an unterminated quote is a `.vue` template's apostrophe
    // («she's»), not a string, and a scan that ran on to the next quote would swallow the file.
    if (c === '"' || c === "'") {
      const quote = c
      out += c
      i++
      while (i < n && src[i] !== quote && src[i] !== '\n') {
        if (src[i] === '\\') {
          out += src[i]
          i++
          if (i < n) {
            out += src[i]
            i++
          }
          continue
        }
        out += src[i]
        i++
      }
      if (i < n && src[i] === quote) {
        out += quote
        i++
      }
      continue
    }
    // A TEMPLATE LITERAL, whose `${ … }` nests and may hold another backtick.
    if (c === '`') {
      out += c
      i++
      let depth = 0
      while (i < n) {
        if (src[i] === '\\') {
          out += src[i]
          i++
          if (i < n) {
            out += src[i]
            i++
          }
          continue
        }
        if (depth === 0 && src[i] === '`') {
          out += '`'
          i++
          break
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          depth++
          out += '${'
          i += 2
          continue
        }
        if (depth > 0 && src[i] === '}') {
          depth--
          out += '}'
          i++
          continue
        }
        out += src[i]
        i++
      }
      continue
    }
    out += c
    i++
  }
  return out
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

// =================================================================================================
// ⭐ L2-2 (08.10) – THE `t()`-TRANSPARENT READER, AND IT EXISTS TO END A CHURN (L2-1 finding 7).
// =================================================================================================
//
// THE CHURN. Every landing wave wraps player-facing strings in `t('…')`, and a source-SHAPE pin
// (`expect(src).toContain("label: 'Coach yourself'")`, `/aria-label="Dismiss"/`) is written against
// the wording AS WRAPPED OR NOT. L2-1 re-aimed seventeen of them by hand, one dated note each, and
// the next wave would have re-aimed its own seventeen – every one of them for a reason that is not
// a premise dying: the STRING is the same, only the way it is spelled in source moved.
//
// WHAT THIS DOES. It reads source the way the pin was written, whether or not the site is wrapped:
//   · `t('LIT')`, `t("LIT")`, `` t(`LIT`) `` and `t('LIT', params…)` become the bare literal;
//   · the three seats a wrapped string sits in become what the unwrapped one looked like –
//     `get label() { return LIT }` → `label: LIT`, `label: () => LIT` → `label: LIT`, and, in a
//     template, `{{ LIT }}` → the bare text and `:aria-label="LIT"` → `aria-label="…"`.
//
// ⚠⚠ WHAT IT MUST NEVER DO: HIDE A WORDING CHANGE. A pin whose asserted STRING changed must still
// fail, and it does – `t('Coach yourselfX')` reads `'Coach yourselfX'`, which is not
// `'Coach yourself'`. The reader forgives the SPELLING of the call, never the words. (CLAUDE.md
// invariant 4's corollary – a wording change is the one diff no test catches – is why this stays a
// literal-for-literal rewrite and not a fuzzy match.)
//
// ⚠ WHAT IT LEAVES ALONE, ON PURPOSE – a call it cannot read as a plain literal is not a literal:
// `t(variable)`, `t('a' + 'b')`, `` t(`a${b}`) ``, `format('x')`, `emit('x')`, `obj.t('x')`, `$t('x')`.
// A pin over one of those has to say so itself; guessing would be the silent widening this file's
// whole header is about.
//
// PURE STRING TRANSFORM, THROWS ON NOTHING: an unterminated literal, an unbalanced call or an empty
// string comes back as it went in. `tests/helpers.test.ts` pins that, and the mutation that proves
// the reader is load-bearing (a reader that did nothing turns the wrapped-fixture arm red).
//
// ⚠ APPLY IT TO THE PINS A WAVE WOULD OTHERWISE RE-AIM, not as a reflex: `tTransparent(src)` in the
// reader of a pin that asserts a string's spelling; a pin whose premise is "this site calls `t()`"
// (the wiring itself) reads the raw source. L2-1's seventeen are done and are not retrofitted.

/** Characters that make a `t` part of a longer name (`emit(`, `obj.t(`, `$t(`). */
const NAME_CHAR = /[A-Za-z0-9_$.]/

/** End (exclusive) of the PLAIN string literal that opens at `from`, or -1: single, double, or a backtick
 *  literal with no `${`. A literal that never closes (or a single/double one that runs onto a new line) is -1. */
function plainLiteralEnd(src: string, from: number): number {
  const quote = src[from]
  if (quote !== "'" && quote !== '"' && quote !== '`') return -1
  for (let i = from + 1; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (quote === '`' && ch === '$' && src[i + 1] === '{') return -1
    if (ch === quote) return i + 1
    if (ch === '\n' && quote !== '`') return -1
  }
  return -1
}

/** End (exclusive) of ANY string literal opening at `from` – a backtick literal may hold `${…}` – or -1. */
function anyLiteralEnd(src: string, from: number): number {
  const quote = src[from]
  for (let i = from + 1; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (quote === '`' && ch === '$' && src[i + 1] === '{') {
      const close = closerAt(src, i + 2, '}')
      if (close < 0) return -1
      i = close
      continue
    }
    if (ch === quote) return i + 1
  }
  return -1
}

/** The first `closer` at nesting depth 0 at or after `from`, reading string literals whole; -1 if none. */
function closerAt(src: string, from: number, closer: ')' | '}'): number {
  let depth = 0
  for (let i = from; i < src.length; i++) {
    const ch = src[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      const end = anyLiteralEnd(src, i)
      if (end < 0) return -1
      i = end - 1
      continue
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth === 0) return ch === closer ? i : -1
      depth--
    }
  }
  return -1
}

/** `t(LIT)` / `t(LIT, …)` starting at `i` (which holds the `t`): the literal text and where the call ends, or null. */
function tCallAt(src: string, i: number): { literal: string; end: number } | null {
  const skip = (j: number): number => {
    while (/\s/.test(src[j] ?? 'x')) j++
    return j
  }
  let j = skip(i + 1)
  if (src[j] !== '(') return null
  j = skip(j + 1)
  const litEnd = plainLiteralEnd(src, j)
  if (litEnd < 0) return null
  const k = skip(litEnd)
  if (src[k] === ')') return { literal: src.slice(j, litEnd), end: k + 1 }
  if (src[k] !== ',') return null
  const close = closerAt(src, k + 1, ')')
  return close < 0 ? null : { literal: src.slice(j, litEnd), end: close + 1 }
}

const LIT = String.raw`'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|` + '`(?:[^`\\\\$]|\\\\.|\\$(?!\\{))*`'
const PROP = String.raw`[A-Za-z_$][\w$]*|'[^'\n]*'|"[^"\n]*"`
const GETTER_SEAT = new RegExp(String.raw`\bget\s+(${PROP})\s*\(\s*\)\s*\{\s*return\s+(${LIT})\s*;?\s*\}`, 'g')
const THUNK_SEAT = new RegExp(String.raw`(${PROP})(\s*:\s*)\(\s*\)\s*=>\s*(${LIT})`, 'g')
const MUSTACHE_SEAT = new RegExp(String.raw`\{\{\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")\s*\}\}`, 'g')
const BOUND_ATTR_SEAT = new RegExp(String.raw`(\s):([A-Za-z][\w:.-]*)="'((?:[^'"\\\n]|\\.)*)'"`, 'g')
const unescapeQuotes = (inner: string): string => inner.replace(/\\(['"\\])/g, '$1')

/**
 * The source as the pin was written, wrapped in `t()` or not – see the block above for what it rewrites,
 * what it refuses to touch and why it can never hide a wording change. Pure; throws on nothing.
 */
export function tTransparent(source: string): string {
  let bare = ''
  for (let i = 0; i < source.length; ) {
    const hit = source[i] === 't' && !NAME_CHAR.test(source[i - 1] ?? ' ') ? tCallAt(source, i) : null
    if (hit) {
      bare += hit.literal
      i = hit.end
    } else {
      bare += source[i]
      i++
    }
  }
  return bare
    .replace(GETTER_SEAT, '$1: $2')
    .replace(THUNK_SEAT, '$1$2$3')
    .replace(MUSTACHE_SEAT, (_m, lit: string) => unescapeQuotes(lit.slice(1, -1)))
    .replace(BOUND_ATTR_SEAT, (_m, space: string, name: string, inner: string) => `${space}${name}="${unescapeQuotes(inner)}"`)
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
