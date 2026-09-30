// THE COLLEGE SCENE – THE STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's law, applied to this wave's table: «после вычитки легко исправить Markdown и забыть
// реализацию» – so the document and the shipped string go red together, whichever side moves.
// `tests/wave12-strings-roundtrip.test.ts` is the model and this file is its shape one wave on.
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT against that file's whole source – never a
// region cut. No marker, so nothing can rot silently (the 24.08 lesson is about slices; a boolean
// `includes` fails loudly).
//
// ⚠⚠ TWO OF THE THREE ROWS ARE TEMPLATES, so the doc quotes the template's own text with the
// interpolation in it – `${who}` and `${year.index}` are where a name and a number land on screen,
// which is exactly what the owner needs to read.
//
// ⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE – wave 9's finding verbatim: a count written in prose
// survives a full gate because no test reads it. THREE is asserted below; the document states no
// total.
//
// ⭐⭐ AND THE DOCUMENT'S TWO RENDERED EXAMPLES ARE PINNED TOO, which is the half a containment table
// cannot reach on its own: they are prose, they are not in any source file, and a template's
// rendering is exactly the thing a reader checks the table against. Each one is RECONSTRUCTED from
// the engine's own constants (`COLLEGE_LEAGUE.label`, `stageLabel` through `leagueExitLabel`) and
// compared with the line the document shows – so a re-tuned draw size or a renamed competition
// reddens the paragraph that describes it.
//
// MUTATION-VERIFIED: one character changed in a doc row fails by id; one character changed in the
// shipped template or pool fails the same row with the arrow the other way; and one character
// changed in either rendered example fails the reconstruction. All three measured – the ledger is at
// the foot of this file.
//
// ⭐ HARDENED 30.09 (S7 – THE OWNER FOLDED THE ROUND-TRIP CHIP INTO THE SECONDARY-MARKET WAVE): TWO MEASURED HOLES, ONE FIX. (1) THE SHIPPED SIDE IS A WHOLE STRING
// LITERAL NOW, not a bare `includes`: a sentence that GREW past its row (an `s` appended in the source) kept the row as a substring and stayed green – S2's arm A13,
// first measured on `tests/secondary-market-strings-roundtrip.test.ts`, whose `shipped` this file's now is. (2) THE HOME IS READ AS CODE: `codeOnly` strips its comments
// before any row is matched, so the code's word changing while `// was 'Old'` sits beside it can no longer hold the pin up. Only the matching mechanism moved – no row,
// no shipped string, no count and no assertion's direction – and every row of the real tree passed the stricter matcher on its first run, so nothing was loosened to get there.
// THE RENDERED-EXAMPLE ARM READS THE DOCUMENT ONLY, so it is unchanged: it never touched a source file, and it had neither hole.
// ⭐ S7'S ARMS, EACH ALONE, WATCHED AND RESTORED BYTE FOR BYTE (30.09), all RED by row id, on C1 (the nested template literal in `albumBook.ts`): a character appended, one substituted, the word changed with
// a whole-line comment quoting the OLD one above it, the same with a trailing comment, and one character of the doc row. THE PRE-S7 PIN STAYED GREEN on the appended character and on the comment arm.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { COLLEGE_LEAGUE, leagueExitLabel } from '../src/engine/collegeLeague'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'DRAFT'
const TABLE = 'docs/plans/college-scene-strings-2026-09.md'
const EXPECTED_ROWS = 3

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | C1 | `src/...` | the string | `DRAFT` |
    const m = new RegExp(String.raw`^\| (C\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
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

const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = codeOnly(readFileSync(path, 'utf8'), path)
    sourceCache.set(path, src)
  }
  return src
}

describe('the college scene – the strings table IS the corpus', () => {
  const rows = parseTable(TABLE)

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const src = sourceOf(row.home)
      // ⚠ THE ESCAPED FALLBACK IS THE MODEL'S AND IS KEPT (in `shipped` since S7): a source literal in single quotes escapes
      // its apostrophes, and a later draft of any of these three may well contract a word.
      expect(shipped(src, row.text), `${row.id}: ${row.home} does not ship the row's text as a whole string literal`).toBe(true)
    }
  })

  it('⭐ every row carries the DRAFT status – one truth about where the corpus stands', () => {
    // `grep DRAFT`'s successor, mechanised (wave 8's F2 ruling): the parser only matches rows whose
    // status cell is exactly `DRAFT`, so a row that moves on to an applied-review status simply stops
    // being counted – and the count above says so. This wave has had no pass yet, so all three sit at
    // DRAFT and the two numbers agree.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })

  it("⭐⭐ the document's two rendered examples are the engine's own, reconstructed and not trusted", () => {
    // ⚠ THE RUN IS THE PERSISTED SHAPE, not today's `COLLEGE_LEAGUE.drawSize`: `leagueExitLabel` reads
    // `rounds` off the row for exactly that reason, and a draw of 8 has three of them.
    const rounds = 3
    const won = `Year 1, ${COLLEGE_LEAGUE.label}: Won it`
    // ⚠ RE-AIMED 24.09 by his Q3 ruling (option B) – the reconstruction composes the long exit form
    // exactly as `albumBook.ts` now does; a doc example carrying the old bare round reddens here.
    const out = `Year 2, ${COLLEGE_LEAGUE.label}: Went out in the ${leagueExitLabel({ roundsWon: 0, rounds })}`
    const md = readFileSync(TABLE, 'utf8')
    expect(md.includes(`«${won}»`), `the title example must read «${won}»`).toBe(true)
    expect(md.includes(`«${out}»`), `the exit example must read «${out}»`).toBe(true)
  })
})

// --- THE MUTATION LEDGER (run 24.09, three arms, each reverted and the files verified identical) --
// Recorded rather than described, because a mutation arm nobody wrote down is a claim. Measured
// output, not predicted:
//   · one character removed from C2's text in the DOC ("this stage." -> "this stag.")
//       -> 1 red of 5: «C2: src/viz/commentary.ts does not contain the row's text»
//   · `Won it` -> `Won It` in the SHIPPED template (`albumBook.ts`)
//       -> 1 red of 5: «C1: src/engine/world/albumBook.ts does not contain the row's text»
//     ⚠ PREDICTED TWO RED AND MEASURED ONE, and the arithmetic is worth writing down: the
//     reconstruction below builds its expected title line from a literal `Won it` IN THIS FILE, so it
//     cannot see a change in the source's copy of that word – containment is the arm that does, and it
//     fired. The reconstruction's job is the OTHER direction (the doc's prose against the engine's
//     constants), which arm three is the proof of.
//   · the doc's exit example edited to «Semifinal»
//       -> 1 red of 5: «the exit example must read «Year 2, the College League: Quarterfinal»» – the
//     arm that exists because containment cannot see prose, and the only one that can fail this way
