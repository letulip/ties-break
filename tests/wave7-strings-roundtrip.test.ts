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
//
// ⚠⚠ RE-AIMED 28.09 BY T6.8 / A-06 – FROM ONE PATH TO THE MODULE SET, WHICH IS A WIDENING AND NOT A
// WEAKENING. `world/lifeBeat.ts` is being split by beat kind, and `ENGAGED_HER_LINE`, `ENGAGED_DRY`
// and `ENGAGED_HEADING` moved to `world/lifeBeat/weddingCopy.ts` byte for byte. This pin went RED on
// E2 (`src/engine/world/lifeBeat.ts does not contain the row's text`), which is the pin doing its job
// – so it now reads the module through `tests/worldSource.ts`' `engineModuleSource`, the helper that
// exists for exactly this («read it through the reader, not at a path» – CLAUDE.md's source-pin
// gotcha). Every assertion below is POSITIVE containment, so a wider corpus cannot make one pass for
// the wrong reason; and the reader is `<name>.ts` PLUS `<name>/*.ts`, so the next kind module is
// covered the day it lands with no edit here.
//
// ⭐ HARDENED 30.09 (S7 – THE OWNER FOLDED THE ROUND-TRIP CHIP INTO THE SECONDARY-MARKET WAVE): TWO MEASURED HOLES, ONE FIX. (1) THE SHIPPED SIDE IS A WHOLE STRING
// LITERAL NOW, not a bare `includes`: a sentence that GREW past its row (an `s` appended in the source) kept the row as a substring and stayed green – S2's arm A13,
// first measured on `tests/secondary-market-strings-roundtrip.test.ts`, whose `shipped` this file's now is. (2) THE HOME IS READ AS CODE: `codeOnly` strips its comments
// before any row is matched, so the code's word changing while `// was 'Old'` sits beside it can no longer hold the pin up. Only the matching mechanism moved – no row,
// no shipped string, no count and no assertion's direction – and every row of the real tree passed the stricter matcher on its first run, so nothing was loosened to get there.
// THE MODULE SET IS READ AS CODE, TOO: `engineModuleSource` concatenates `lifeBeat.ts` and its kind modules, and the whole of that text goes through `codeOnly`.
// ⭐ S7'S ARMS, EACH ALONE, WATCHED AND RESTORED BYTE FOR BYTE (30.09), all RED by row id, on E2 (its words live in `lifeBeat/weddingCopy.ts`, reached through the module set): a character appended, one
// substituted, the word changed with a whole-line comment quoting the OLD one above it, the same with a trailing comment, and one character of the doc row. THE PRE-S7 PIN STAYED GREEN on the
// appended character and on the comment arm – the measurement of the two holes.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { engineModuleSource } from './worldSource'

interface Row {
  id: string
  home: string
  text: string
}

const TABLE = 'docs/plans/life-wave-7-strings-2026-09.md'
const HOME = "src/engine/world/lifeBeat.ts + world/lifeBeat/*.ts"
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

/** ⭐ S7 (30.09) – THE HOME IS READ AS CODE, NOT AS TEXT: comments are stripped before any row is matched, so a comment that quotes a word can neither
 *  hold a row up (the code's word changes, `// was 'Old'` stays beside it, and a whole-file containment stayed green – it cannot tell a comment from code)
 *  nor pass for a second copy of it. Strip-only: it takes text away from what the pin sees and adds none, so it can only make a pin stricter.
 *  ⚠⚠ LINE COMMENTS GO FIRST, AND THE ORDER IS MEASURED, NOT STYLE (copied from `codeOnly` in `tests/principles-a06-life-beat-direction.test.ts`, T6.10, 28.09):
 *  a line comment that names a path glob puts a slash before a star, the block matcher reads it as an OPENER and runs to the next block close, and the real
 *  code in between is deleted. The second line pass takes a TRAILING comment (a double slash after whitespace on a code line), for the reason the first takes a
 *  whole-line one: `'Word', // was 'Old'` is the same hole from the other end of the line.
 *  ⚠ A `.vue` home also loses its `<!-- -->` comments, first, because they are the outermost comment syntax in a template. */
function codeOnly(text: string, path: string): string {
  const html = path.endsWith('.vue') ? text.replace(/<!--[\s\S]*?-->/g, '') : text
  return html
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/[ \t]\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

/** ⭐ S7 (30.09) – THE ROW AS A WHOLE STRING LITERAL, ported from `tests/secondary-market-strings-roundtrip.test.ts`: it must be found between its own quote marks
 *  (`'…'`, `"…"` or a template literal), never as a bare substring. A plain `includes` cannot see a shipped sentence that has GROWN past its row – the row is still
 *  a substring of the longer sentence (S2's arm A13, 30.09: an `s` appended in the source stayed green) – so growth, shrinkage and substitution now fail the same row.
 *  ⚠ THE ESCAPED SPELLING IS LOAD-BEARING, exactly as it was: the doc quotes the RUNTIME spelling, and a single-quoted source literal escapes its apostrophes. */
function shipped(src: string, text: string): boolean {
  const spellings = [text, text.replaceAll("'", "\\'")]
  return spellings.some((t) => ["'", '"', '`'].some((q) => src.includes(q + t + q)))
}

describe('wave 7 §1 – the engagement\'s strings table IS the corpus', () => {
  const rows = parseSectionOne()
  const src = codeOnly(engineModuleSource('world/lifeBeat'), 'src/engine/world/lifeBeat.ts')

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: §1 rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      expect(shipped(src, row.text), `${row.id}: ${HOME} does not ship the row's text as a whole string literal`).toBe(true)
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
