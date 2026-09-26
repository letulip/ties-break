// WAVE 7 §1 – THE ENGAGEMENT'S STRINGS TABLE AND THE CODE ARE ONE CORPUS, AND THE COUNT LIVES HERE
//
// WHY THIS FILE EXISTS, AND WHY IT ARRIVES THREE WAVES LATE. Waves 9 to 12 each pinned their strings
// table to the shipped source (`tests/wave9-strings-roundtrip.test.ts`,
// `tests/wave1011-strings-roundtrip.test.ts`, `tests/wave12-strings-roundtrip.test.ts`) on wave 9's
// law – «после вычитки легко исправить Markdown и забыть реализацию», so the document and the string
// go red together, whichever side moves. Wave 7's table never got one, and on 26.09 that became
// load-bearing: the owner's ruling 19 on B-08 removed four of §1's rows, so §0's stated totals (96,
// 96, and «T2 16») all moved at once – and wave 9's own finding is that a count written in prose
// survives a full gate, because no test reads it. §0 therefore states no total any more and points
// here.
//
// ⚠ SCOPE, SAID PLAINLY: **§1 ONLY**, the engagement beat. Wave 7's table has seven sections with
// three different row shapes and three different status spellings, and its `home` column is a
// constant path («`ENGAGED_HER_LINE.sunny`») rather than a file – so a whole-document pin needs a
// per-section file map and is its own piece of work. §1 is the section ruling 19 touched, every one of
// its rows lives in `src/engine/world/lifeBeat.ts`, and a pin that covered less than it claimed would
// be the «guard whose scope is narrower than its sentence» family this repo has met twenty times. The
// other sections remain unpinned and §0 says so rather than guessing a number for them.
//
// ⚠ CONTAINMENT AND NEVER A REGION CUT – the wave-10/11/12 pins' own choice. No marker, no slice,
// nothing to rot silently (CLAUDE.md's `indexOf`/`slice` gotcha); a boolean `includes` fails loudly.
// The escaped fallback is load-bearing: the document quotes the RUNTIME spelling and a single-quoted
// source literal escapes its apostrophes (`the season\'s dates`).
//
// MUTATION-VERIFIED: one character changed in a document row fails by id, and one character changed
// in `ENGAGED_HER_LINE` fails the same row with the arrow the other way. Both are in the wave's report.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const TABLE = 'docs/plans/life-wave-7-strings-2026-09.md'
const HOME = 'src/engine/world/lifeBeat.ts'
const STATUS = 'DRAFT – awaiting his pass'

// ⚠⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE (wave 9's finding verbatim).
//
// 12 is §1 after ruling 19: four voices of `ENGAGED_HER_LINE` (was eight – the roof column went), the
// dry card, the heading, three answer labels and three feed rows. A roof row put back in the document
// fails this line, and so does a row silently dropped.
const EXPECTED_ROWS = 12

/** §1's rows: `| E<n> | home | when | the string | status |`. The `when` column is prose and is not
 *  pinned – it describes the surface rather than quoting it. */
function parseSectionOne(): Row[] {
  const md = readFileSync(TABLE, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    const m = new RegExp(String.raw`^\| (E\d+) \| (.+?) \| .+? \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3] })
  }
  return rows
}

describe('wave 7 §1 – the engagement\'s strings table IS the corpus', () => {
  const rows = parseSectionOne()
  const src = readFileSync(HOME, 'utf8')

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: §1 rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const escaped = row.text.replaceAll("'", "\\'")
      expect(
        src.includes(row.text) || src.includes(escaped),
        `${row.id}: ${HOME} does not contain the row's text`,
      ).toBe(true)
    }
  })

  it('⭐⭐⭐ no row names a ROOF cell any more – ruling 19, 26.09 (B-08)', () => {
    // ⚠ THE OTHER HALF OF THE REMOVAL, AND THE ONE A COUNT CANNOT MAKE. Twelve rows could be twelve
    // rows with a roof cell among them; this says the `home` column itself has stopped naming one.
    // `ENGAGED_HER_LINE` is `Record<Temperament, string>` now, so a `.roof` home would be a document
    // describing a shape the code does not have.
    for (const row of rows) {
      expect(row.home.includes('.roof'), `${row.id} still names a roof cell: ${row.home}`).toBe(false)
    }
    // ...and the four voices really are all here, or «no roof cell» is true of an empty pool.
    for (const voice of ['sunny', 'fiery', 'quiet', 'deep']) {
      expect(rows.some((r) => r.home.includes(`ENGAGED_HER_LINE.${voice}`)), `${voice}'s row`).toBe(true)
    }
  })

  it('⚠ §0 states no total for this wave – the number is this file\'s', () => {
    // ⚠ THE DOCUMENT-SIDE HALF OF WAVE 9'S FINDING, MECHANISED. §0 used to say «96» twice and
    // «T2 16»; ruling 19 moved all three. If a total ever comes back into that prose it will rot the
    // next time a row moves, so this refuses the shape rather than any particular number.
    const md = readFileSync(TABLE, 'utf8')
    expect(md).toContain('THE TOTALS ARE NO LONGER STATED HERE')
    expect(md.includes('| player-facing **strings** the wave ADDED to the tree | **'),
      '§0 states a bolded total again – move it into this file').toBe(false)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })
})
