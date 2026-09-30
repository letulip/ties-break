// THE FEEDBACK CHANNEL'S STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// The mechanism is `tests/secondary-market-strings-roundtrip.test.ts`'s, copied whole and stated here so this file reads alone:
//   · the doc table (docs/plans/feedback-strings-2026-09.md) is parsed, one row per sentence;
//   · each row's text must be a WHOLE string literal ('…', "…" or a template literal) in its home – never a bare substring, so a
//     sentence that GREW (an appended character) or changed (a substituted one) goes red, by row id;
//   · the home is read as CODE: comments are stripped first, so a comment quoting the old word can neither hold a row up nor pass
//     for a second copy of it;
//   · every row is exactly ONE quoted literal in its home;
//   · THE COUNT LIVES HERE AND NOWHERE IN PROSE (wave 9: a count written in prose survives a full gate because no test reads it).
// ONE ADDITION, for a wave whose sentences all live in ONE module: the module's exported sentence constants are read out of its
// source and every one must be tabled – a sentence added to the code and forgotten in the table is the drift the row-by-row arm
// cannot see. The only rows that are NOT constants are the three literals inside the two line builders, named below.
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT AGAINST THAT FILE'S SOURCE – never a region cut (the 24.08 lesson: a raw
// `indexOf` that misses returns -1, the slice widens to the whole file and the pin stays green).
//
// ⚠ EACH ARM MUTATED, ALONE, WATCHED RED BY ROW ID AND RESTORED (30.09, F2); the table is what to break to see it again. An arm that changes a
// row's TEXT fails «every row matches the shipped string ...» first, and the «exactly ONE» test with it (the row is no longer a literal in the
// home) – and the completeness test too when the changed row is a constant; the two arms that leave every row's text alone fail only the test named:
//   FB7  `'Send feedback'` -> `'Send feedbacks'`               (a character APPENDED in src/feedback.ts)   3 red, first by id: FB7
//   FB2  `'Please attach …'` -> `'Pleese attach …'`             (a character SUBSTITUTED in the code)       3 red, first by id: FB2
//   FB16 `Send it to ${FEEDBACK_ADDRESS}` -> `Send it too …`    (a TEMPLATE-literal row)                    2 red, first by id: FB16
//   FB9  `career` -> `careers` in the DOC row                  (the table moved, the code did not)         3 red, first by id: FB9
//   FB12 a second `'Send'` literal added in the code           "every row is exactly ONE quoted literal ..." only (FB12 quoted 2 times)
//   a new `export const FEEDBACK_EXTRA_LINE = '…'` with no row "every sentence constant the module exports is tabled ..." only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'DRAFT'
const TABLE = 'docs/plans/feedback-strings-2026-09.md'
const HOME = 'src/feedback.ts'

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | FB1 | `src/...` | the string | `DRAFT` |
    const m = new RegExp(String.raw`^\| (FB\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3] })
  }
  return rows
}

/** THE HOME IS READ AS CODE, NOT AS TEXT (copied from the secondary-market pin, S7): comments are stripped before any row is
 *  matched. Strip-only: it takes text away from what the pin sees and adds none, so it can only make a pin stricter.
 *  ⚠⚠ LINE COMMENTS GO FIRST, AND THE ORDER IS MEASURED, NOT STYLE: a line comment that names a path glob puts a slash before a
 *  star, the block matcher reads it as an OPENER and runs to the next block close, deleting the real code in between. The second
 *  line pass takes a TRAILING comment for the reason the first takes a whole-line one. */
function codeOnly(text: string): string {
  return text
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/[ \t]\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = codeOnly(readFileSync(path, 'utf8'))
    sourceCache.set(path, src)
  }
  return src
}

/** ⚠ THE ROW AS A WHOLE STRING LITERAL – found between its own quote marks, never as a bare substring: an `s` appended to a
 *  sentence in the source stayed green under a plain `includes` (measured 30.09, secondary market S2). The doc quotes the RUNTIME
 *  spelling and a single-quoted source literal escapes its apostrophes, so both spellings are tried. */
function shipped(src: string, text: string): boolean {
  const spellings = [text, text.replaceAll("'", "\\'")]
  return spellings.some((t) => ["'", '"', '`'].some((q) => src.includes(q + t + q)))
}

/** How many whole-literal spellings of the row the home holds. `shipped` answers «at least one», which is not enough for a row of
 *  one word: a comment quoting it back once held a pin up while the code moved. A row that is exactly one literal has nowhere to hide. */
function literalCount(src: string, text: string): number {
  const spellings = [...new Set([text, text.replaceAll("'", "\\'")])]
  let n = 0
  for (const t of spellings) for (const q of ["'", '"', '`']) n += src.split(q + t + q).length - 1
  return n
}

/** ⚠ THE ONE STATEMENT OF THE COUNT. 16 on 30.09 (F1 + F2): the six sentences F1 shipped in the module (FB1–FB6) and the ten F2 adds
 *  for the control and the dialog (FB7–FB16). A step that tables more sentences moves it with a dated note beside it. */
const EXPECTED_ROWS = 16

/** The three rows that are not exported constants: the literals inside `errorCountLine` and `feedbackAddressLine`. They carry a
 *  number or the address, so they are functions – and a function's literal is a row of its own, placeholder and all. */
const BUILDER_ROWS = ['1 recent error', '${n} recent errors', 'Send it to ${FEEDBACK_ADDRESS}']

describe('the feedback channel – the strings table IS the corpus', () => {
  const rows = parseTable(TABLE)

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const src = sourceOf(row.home)
      expect(shipped(src, row.text), `${row.id}: ${row.home} does not ship the row's text as a whole string literal`).toBe(true)
    }
  })

  it('every row is exactly ONE quoted literal in its home – a comment quoting it back cannot hold the pin up', () => {
    for (const row of rows) {
      expect(literalCount(sourceOf(row.home), row.text), `${row.id}: ${row.home} quotes the row's text more than once (or not at all)`).toBe(1)
    }
  })

  it('every row is still a DRAFT – one truth about where the corpus stands', () => {
    // The parser only matches rows whose status cell is exactly `DRAFT`, so a row that moves on – his pass, or an applied review –
    // simply stops being counted, and the count above says so. That is the tripwire working, not a failure to fix.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })

  it('⚠ the sentences have exactly one home, and it is a real file', () => {
    // ONE HOME ON PURPOSE (see the header of the module): the owner's wording pass edits one file and the Vue files carry no copy.
    // A second home is a decision – it moves this list on purpose, never by accident.
    expect(() => sourceOf(HOME), HOME).not.toThrow()
    expect(new Set(rows.map((r) => r.home))).toEqual(new Set([HOME]))
  })

  it('⭐ every sentence constant the module exports is tabled, and the only other rows are the line builders\' three', () => {
    // `FEEDBACK_ADDRESS` is an address, not a sentence – the lookahead leaves it out; `MAILTO_BODY_MAX` is a number.
    const src = sourceOf(HOME)
    const constants = [...src.matchAll(/export const (?:REPORT|FEEDBACK)_(?!ADDRESS\b)[A-Z_]+ = (['"])(.*?)\1/g)].map((m) => m[2])
    expect(constants.length, 'the pattern found the module\'s sentence constants at all').toBeGreaterThan(0)
    const tabled = rows.map((r) => r.text)
    for (const text of constants) {
      expect(tabled, `an exported sentence constant has no row in the table: «${text}»`).toContain(text)
    }
    expect(tabled.filter((t) => !constants.includes(t)).sort()).toEqual([...BUILDER_ROWS].sort())
  })
})
