// THE PRINCIPLES FIX'S STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's law, applied to this fix's table: «после вычитки легко исправить Markdown и забыть
// реализацию» – so the document and the shipped string go red together, whichever side moves.
// `tests/wave12-strings-roundtrip.test.ts` is the model and this file is its shape one wave on.
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT AGAINST THAT FILE'S SOURCE – never a region
// cut. No marker, no slice, nothing to rot silently (the 24.08 lesson is about slices: `indexOf`
// returns -1, the region widens to the whole file and the pin stays green; a boolean `includes` fails
// loudly instead).
//
// ⚠⚠ AND ONE HOME IS A MODULE THAT THE BARREL DELIBERATELY DOES NOT RE-EXPORT.
// `UNKNOWN_CHOICE_REFUSAL` is not on `engine/world`'s public surface, so the row's home is
// `src/engine/world/constants.ts` itself. A pin aimed at the barrel would be green today for the
// wrong reason – the string is not there – and would go on being green if the constant moved.
//
// ⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE – wave 9's finding verbatim: a count written in prose
// survives a full gate because no test reads it, and wave 9 shipped two documents saying 32 where the
// corpus held 28, through `check`, `e2e` and the sims. `EXPECTED_ROWS` below is the only statement of
// it; the document states no total.
//
// ⚠⚠ THE COUNT MOVES IN W4 AND IT IS MEANT TO BE ONE LINE. E-01's header line and its title are two
// more DRAFT rows (the wave's plan §6, T4.11), so `EXPECTED_ROWS` goes 3 -> 5 in that wave with a
// dated note beside it and NOTHING ELSE in this file changes – the parser, the containment and the
// status pin are all count-agnostic by construction.
//
// MUTATION-VERIFIED IN BOTH DIRECTIONS, which is wave 12's own header's requirement and the only way
// a round-trip pin earns the name: one character changed in a doc row fails by id, and one character
// changed in the shipped string fails the same row with the arrow the other way. Both measured – see
// the wave's report.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'DRAFT'

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | PF1 | `src/...` | the string | `DRAFT` |
    const m = new RegExp(String.raw`^\| (PF\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
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

const TABLE = 'docs/plans/principles-fix-strings-2026-09.md'
/** ⚠ THE ONE STATEMENT OF THE COUNT. W4 takes it to 5 (E-01's line and title) with a dated note. */
const EXPECTED_ROWS = 3

describe('the principles fix – the strings table IS the corpus', () => {
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
      // literal in single quotes escapes its apostrophes – `The mother\'s story` is the shipped
      // spelling of a row this table reads as `The mother's story`.
      const escaped = row.text.replaceAll("'", "\\'")
      expect(
        src.includes(row.text) || src.includes(escaped),
        `${row.id}: ${row.home} does not contain the row's text`,
      ).toBe(true)
    }
  })

  it('⭐ every row is still a DRAFT – one truth about where the corpus stands', () => {
    // ⚠ `grep DRAFT`'s successor (wave 8's F2 ruling, mechanised): the parser only matches rows whose
    // status cell is exactly `DRAFT`, so a row that moves on – his pass, or an applied review – simply
    // stops being counted, and the count above says so. That is the tripwire working, not a failure to
    // fix: it is the moment somebody has to come back and state where the corpus now stands.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })

  it('⚠ every home is a real file, and the two the fix added are the wire and the engine leaf', () => {
    // Without this a typo in a home path is a `readFileSync` throw whose message is about a path
    // rather than about the row – and the second half states the claim the barrel note makes: the
    // engine leaf is the home, never `src/engine/world.ts`.
    for (const row of rows) {
      expect(() => sourceOf(row.home), `${row.id}: ${row.home}`).not.toThrow()
    }
    expect(new Set(rows.map((r) => r.home))).toEqual(
      new Set(['src/shared/protocol/profile.ts', 'src/engine/world/constants.ts']),
    )
  })
})
