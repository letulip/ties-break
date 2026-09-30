// THE SECONDARY MARKET'S STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's law, applied to this wave's table: «после вычитки легко исправить Markdown и забыть реализацию» – so the
// document and the shipped string go red together, whichever side moves. `tests/principles-fix-strings-roundtrip.test.ts`
// is the model and this file is its shape one wave on (its first corpus only: this wave has no «engine sentence, new
// surface» rows yet, and a second parser would be a second count with nothing to count).
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT AGAINST THAT FILE'S SOURCE – never a region cut. No marker, no
// slice, nothing to rot silently (the 24.08 lesson is about slices: `indexOf` returns -1, the region widens to the whole
// file and the pin stays green; a boolean `includes` fails loudly instead).
//
// ⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE – wave 9's finding verbatim: a count written in prose survives a full gate
// because no test reads it. `EXPECTED_ROWS` below is the only statement of it; the document states no total. A step that
// tables more sentences moves it with a dated note beside it.
//
// ⚠ THE ROWS QUOTE THE SOURCE, PLACEHOLDER AND ALL: `Put on the market: ${label}` is in the document exactly as the template
// literal is in `world/shop.ts`, which is why the code names a `label` before it writes the row – a doc row that read
// `${listingLabel(world, item)}` would pin the wiring instead of the sentence.
//
// MUTATION-VERIFIED IN BOTH DIRECTIONS (30.09, S2), each arm applied ALONE, watched and restored: one character changed in a
// doc row fails that row by id; one character changed in the shipped string fails the same row with the arrow the other way.
// ⚠ AND ONE STRICTER THAN THE MODEL FILE, FOUND BY THAT SAME RUN: the shipped side is matched as a WHOLE string literal, not as a
// substring. An `s` appended to a sentence in the source passed a bare `includes` – the row was still inside the longer string –
// and only the engine test that compares the message with the row caught it. Both arms (an appended character, a substituted
// one) now fail this file as well.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'DRAFT'
const TABLE = 'docs/plans/secondary-market-strings-2026-09.md'

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | SM1 | `src/...` | the string | `DRAFT` |
    const m = new RegExp(String.raw`^\| (SM\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3] })
  }
  return rows
}

const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = readFileSync(path, 'utf8')
    sourceCache.set(path, src)
  }
  return src
}

/** ⚠ THE ROW AS A WHOLE STRING LITERAL – found between its own quote marks (`'…'`, `"…"` or a template literal), never as a bare
 *  substring. A plain `includes` cannot see a shipped sentence that has GROWN past the row's text, because the row is still a
 *  substring of the longer sentence (measured on 30.09: an `s` appended to SM4 in the source stayed green under the model file's
 *  containment). Growth, shrinkage and substitution now all fail the same row.
 *  ⚠ THE ESCAPED SPELLING IS LOAD-BEARING: the doc quotes the RUNTIME spelling, and a source literal in single quotes escapes its
 *  apostrophes – a row that reads `The mother's story` is `The mother\'s story` in the file. */
function shipped(src: string, text: string): boolean {
  const spellings = [text, text.replaceAll("'", "\\'")]
  return spellings.some((t) => ["'", '"', '`'].some((q) => src.includes(q + t + q)))
}

/** ⚠ THE ONE STATEMENT OF THE COUNT. 6 on 30.09 (S2): four refusals (SM1–SM4) and the two Money-feed lines (SM5, SM6). */
const EXPECTED_ROWS = 6

describe('the secondary market – the strings table IS the corpus', () => {
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

  it('⭐ every row is still a DRAFT – one truth about where the corpus stands', () => {
    // The parser only matches rows whose status cell is exactly `DRAFT`, so a row that moves on – his pass, or an applied
    // review – simply stops being counted, and the count above says so. That is the tripwire working, not a failure to fix:
    // it is the moment somebody has to come back and state where the corpus now stands.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })

  it('⚠ every home is a real file, and the one home is the engine\'s shop commands', () => {
    // Without this a typo in a home path is a `readFileSync` throw whose message is about a path rather than about the row.
    // The home set is an enumeration on purpose: a home is a claim about WHERE the wave puts words, and a row that moves to
    // a component would be the screen authoring a sentence the engine owns.
    for (const row of rows) {
      expect(() => sourceOf(row.home), `${row.id}: ${row.home}`).not.toThrow()
    }
    expect(new Set(rows.map((r) => r.home))).toEqual(new Set(['src/engine/world/shop.ts']))
  })
})
