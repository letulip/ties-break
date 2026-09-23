// WAVE 12 – THE STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's law, applied to the parting's table: «после вычитки легко исправить Markdown и забыть
// реализацию» – so the document and the shipped string go red together, whichever side moves.
// `tests/wave1011-strings-roundtrip.test.ts` is the model and this file is its shape one wave on.
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT AGAINST THAT FILE'S SOURCE, which is the
// whole corpus this time – wave 10/11 had two importable copy tables (`DYNASTY_COPY`, `WEIGHT_COPY`)
// and this wave has none: the parting's words live in module-private pools, in an options record, in
// a feed-line record and in two arrays of template FUNCTIONS. Containment and never a region cut –
// no marker, no slice, nothing to rot silently (the 24.08 lesson is about slices; a boolean
// `includes` fails loudly).
//
// ⚠⚠ AND A TEMPLATE FUNCTION IS WHY THE BOOTH'S FOUR ROWS CARRY `${who}` VERBATIM. Those lines are
// `(who) => \`…\`` in source, so the string the pin holds is the template's own text with the
// interpolation in it – which is also exactly what the owner needs to read, because `${who}` is
// where her name lands on screen.
//
// ⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE – wave 9's finding verbatim: a count written in prose
// survives a full gate because no test reads it. 34 is asserted below; the document deliberately
// states no total.
//
// ⭐ RE-AIMED 23.09 BY HIS STRINGS REVIEW, NOT WEAKENED: the corpus went 38 -> 34 (the her-line
// presence axis collapsed – a roof divorce cannot happen in a real career) and every status cell
// moved `DRAFT` -> the applied-review status, wave 9's own convention. The parser now matches THAT
// status exactly, so the provenance property is unchanged in shape: a row whose status moves again
// (his final pass) drops out of the count and this file goes red, which is the tripwire working.
//
// MUTATION-VERIFIED: one character changed in a doc row fails by id, and one character changed in
// the shipped pool fails the same row with the arrow the other way. Both measured – see the wave's
// report; re-measured 23.09 after the re-aim.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'HIS REVIEW APPLIED 23.09 – awaiting his final pass'

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | P1 | `src/...` | the string | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
    const m = new RegExp(String.raw`^\| (P\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
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

const TABLE = 'docs/plans/life-wave-12-strings-2026-09.md'
const EXPECTED_ROWS = 34

describe('wave 12 – the strings table IS the corpus', () => {
  const rows = parseTable(TABLE)

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const src = sourceOf(row.home)
      // ⚠ THE ESCAPED FALLBACK IS LOAD-BEARING: the doc quotes the RUNTIME spelling, and a source
      // literal in single quotes escapes its apostrophes (`next week\'s dates`, every contracted
      // quote). Several rows of this table need it – the count is the corpus's, not this comment's.
      const escaped = row.text.replaceAll("'", "\\'")
      expect(
        src.includes(row.text) || src.includes(escaped),
        `${row.id}: ${row.home} does not contain the row's text`,
      ).toBe(true)
    }
  })

  it('⭐ every row carries the applied-review status – one truth about where the corpus stands', () => {
    // ⚠ RE-AIMED 23.09, `grep DRAFT`'s successor (wave 8's F2 ruling, mechanised): the parser only
    // matches rows whose status cell is exactly the applied-review status, so a row that moves on
    // (his final pass) or slides back simply stops being counted – and the count above says so.
    // ⚠ AND NO ROW SAYS `DRAFT` ANY MORE: a new draft appearing in this table without the review
    // would claim a provenance the corpus no longer has.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
    expect(md.includes('| `DRAFT` |'), 'no row still claims the pre-review status').toBe(false)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })
})
