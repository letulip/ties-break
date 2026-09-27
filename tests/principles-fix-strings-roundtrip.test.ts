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
// ⚠⚠ THE COUNT MOVED IN W4 (27.09, T4.11). E-01's header line and its title are two more DRAFT rows
// (the wave's plan §6), so `EXPECTED_ROWS` went 3 -> 5 with a dated note beside it. ⚠ THE PREDICTION
// THAT «NOTHING ELSE IN THIS FILE CHANGES» WAS WRONG BY ONE CASE, and the correction is kept here
// because a prediction that quietly failed is worse than one that says so: the parser, the
// containment and the status pin ARE count-agnostic by construction, but the HOME SET at the bottom of
// this file is an enumeration, and T4.11's rows live on a screen – a third home. Its own note carries
// why that set is deliberately not count-agnostic.
//
// MUTATION-VERIFIED IN BOTH DIRECTIONS, which is wave 12's own header's requirement and the only way
// a round-trip pin earns the name: one character changed in a doc row fails by id, and one character
// changed in the shipped string fails the same row with the arrow the other way. Both measured – see
// the wave's report.
//
// ⚠⚠ AND THERE ARE TWO CORPORA IN THIS FILE SINCE 27.09 (W4 · T4.13 · E-04), BECAUSE THE TABLE GREW A
// SECOND KIND OF ROW. §1–§3 are DRAFTs – copy that did not exist and needs his approval. §4's rows are
// EXISTING ENGINE SENTENCES REACHING A NEW SURFACE, authorised by ruling 6a, and there is no new word in
// any of them: what he is asked to read is WHERE words he already owns now appear. They therefore carry
// their own status spelling, their own parser, their own count and their own home claim, and
// `EXPECTED_ROWS` below is untouched – it counts the DRAFTs, and its parser keys on the `DRAFT` cell, so
// a §4 row cannot drift into it.
//
// ⚠ THE SECOND BLOCK'S HOME CLAIM IS THE WHOLE POINT OF ITS STATUS: every §4 home is an ENGINE file. If
// one of those rows ever comes to live in a component, the status is a lie – the screen would be
// authoring the sentence again, which is the defect E-04 closed – and the set below says so by name
// rather than leaving a reader to check five paths.
//
// ⚠⚠ AND IT NEEDED ONE NORMALISATION THE FIRST BLOCK DOES NOT: A CONCATENATED TEMPLATE LITERAL. Three
// of the five engine sentences are written as two adjacent template literals joined by `+` so the line
// fits, which is ONE string at runtime and TWO in the file – so plain containment fails on a row that
// is perfectly correct. `joinedSource` closes those seams and nothing else. It is the same kind of gap
// PF5's escaped fallback crosses (the doc quotes the runtime spelling; the source escapes its
// apostrophes), and it is sound in one direction only: a `` ` + ` `` seam in a source file IS runtime
// concatenation, so joining it cannot invent a string the program does not build.

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

/** §4's rows carry a fourth cell – the SURFACE the sentence now reaches – because that is what the
 *  status is a claim about. `[^|]` on every cell rather than `.`: a `.` matches a pipe, so a
 *  non-greedy split could land in the wrong column the day a sentence contains one. */
interface SurfaceRow extends Row {
  surface: string
}

const SURFACE_STATUS = 'engine sentence, new surface'

function parseSurfaceTable(path: string): SurfaceRow[] {
  const md = readFileSync(path, 'utf8')
  const rows: SurfaceRow[] = []
  for (const line of md.split('\n')) {
    // | ES1 | `src/engine/...` | the sentence | the surface | `engine sentence, new surface` |
    const m = new RegExp(
      String.raw`^\| (ES\d+) \| \x60([^|]+?)\x60 \| ([^|]+?) \| ([^|]+?) \| \x60${SURFACE_STATUS}\x60 \|$`,
    ).exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3], surface: m[4] })
  }
  return rows
}

/** The home file with adjacent template-literal seams closed – see the header. `` `a ` + `b` `` is one
 *  string at runtime and two in the file, and three of §4's five sentences are written that way. */
function joinedSource(path: string): string {
  return sourceOf(path).replace(/\x60\s*\+\s*\x60/g, '')
}

const TABLE = 'docs/plans/principles-fix-strings-2026-09.md'
/** ⚠ THE ONE STATEMENT OF THE COUNT. 3 -> 5 on 27.09 (W4 · T4.11 · E-01): the Season header's
 *  pro-budget line and its title, tabled as §3. No other number in this repo states it. */
const EXPECTED_ROWS = 5

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

  it('⚠ every home is a real file, and the three are the wire, the engine leaf and the screen', () => {
    // Without this a typo in a home path is a `readFileSync` throw whose message is about a path
    // rather than about the row – and the second half states the claim the barrel note makes: the
    // engine leaf is the home, never `src/engine/world.ts`.
    //
    // ⚠⚠ THE HEADER ABOVE PROMISED «NOTHING ELSE IN THIS FILE CHANGES» IN W4 AND WAS WRONG ABOUT THIS
    // ONE CASE (27.09). The parser, the containment and the status pin really are count-agnostic; this
    // set is not, and it is deliberately not – a home is a claim about WHERE the fix puts words, and
    // T4.11's two rows put them on a SCREEN for the first time, which is the fact a reader of this
    // corpus should be made to notice. The correction is recorded here rather than in the header,
    // because the header's own sentence is what went stale.
    for (const row of rows) {
      expect(() => sourceOf(row.home), `${row.id}: ${row.home}`).not.toThrow()
    }
    expect(new Set(rows.map((r) => r.home))).toEqual(
      new Set([
        'src/shared/protocol/profile.ts',
        'src/engine/world/constants.ts',
        'src/components/screens/SeasonScreen.vue',
      ]),
    )
  })
})

/** ⚠ THE SECOND CORPUS'S ONLY STATEMENT OF ITS COUNT. Five surfaces from T4.13 (W4 · E-04, ruling 6a);
 *  the document states no total, for the same wave-9 reason `EXPECTED_ROWS` carries. It is a SEPARATE
 *  number from the DRAFT count on purpose: the two corpora move for different reasons – a DRAFT leaves
 *  when he approves it, a surface row leaves when the code stops printing the engine's sentence there. */
const EXPECTED_SURFACE_ROWS = 5

describe('the principles fix – engine sentences on new surfaces (§4)', () => {
  const rows = parseSurfaceTable(TABLE)

  it(`the parser found §4 at all – ${EXPECTED_SURFACE_ROWS} rows`, () => {
    expect(rows.length, `${TABLE}: §4 rows found`).toBe(EXPECTED_SURFACE_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('⭐⭐ every row matches the ENGINE\'s own sentence character for character', () => {
    // The whole claim of this status, mechanised: the sentence is the engine's, so it must BE in the
    // engine. A row whose text has drifted from its home fails by id here; a home whose sentence has
    // been reworded fails the same row from the other side, which is what makes this a round trip.
    for (const row of rows) {
      const escaped = row.text.replaceAll("'", "\\'")
      const src = joinedSource(row.home)
      expect(
        src.includes(row.text) || src.includes(escaped),
        `${row.id}: ${row.home} does not contain the row's text`,
      ).toBe(true)
    }
  })

  it('⚠⚠ every §4 home is an ENGINE file – the status\'s own claim, by name', () => {
    // «Engine sentence» is falsifiable exactly here. A home under `src/components` or
    // `src/composables` would mean a screen authoring the words again, which is the defect E-04 closed,
    // and then the status cell would be describing something that is not true of the row.
    for (const row of rows) expect(() => sourceOf(row.home), `${row.id}: ${row.home}`).not.toThrow()
    expect(new Set(rows.map((r) => r.home))).toEqual(
      new Set(['src/engine/world/medical.ts', 'src/engine/world/entryCaps.ts']),
    )
    for (const row of rows) {
      expect(row.home.startsWith('src/engine/'), `${row.id} is not authored by a screen`).toBe(true)
    }
  })

  it('⚠ each row names the surface it reaches, and no two DIFFERENT sentences share one surface cell', () => {
    // The surface cell is the payload of this block – a row that named no surface would be a row about
    // words, which is what §1-§3 are for. ES1 and ES2 deliberately share one SENTENCE across two
    // surfaces (a tooltip and an accessible name are two places a repair can reach one of), so the
    // uniqueness runs the other way round: every surface cell is its own.
    for (const row of rows) expect(row.surface.trim().length, `${row.id} names a surface`).toBeGreaterThan(8)
    expect(new Set(rows.map((r) => r.surface)).size, 'each surface is named once').toBe(rows.length)
  })

  it('⚠ the LATENT row says so, and it is the only one', () => {
    // A row he cannot reach in a playtest must be readable as a diagnostic or his pass is spent on copy
    // no career prints. ES5's surface cell carries the mark and the section carries the measurement
    // (mean 0.0 over n = 90 careers, 676 weeks); this asserts the mark is where a reader will meet it.
    const latent = rows.filter((r) => r.surface.includes('LATENT'))
    expect(latent.map((r) => r.id), 'the sub-cap, and nothing else').toEqual(['ES5'])
    expect(latent[0].home, 'and its home is the allowance that cannot bind yet').toBe('src/engine/world/entryCaps.ts')
  })

  it('⚠ §4 carries no DRAFT cell, so the two corpora cannot be counted as one', () => {
    // The guard on the seam between the blocks. `EXPECTED_ROWS`'s status pin counts every `\`DRAFT\``
    // in the whole document, so a §4 row that arrived wearing that status would break the DRAFT count
    // for a reason nobody would look for here.
    for (const row of rows) {
      expect(row.text.includes('DRAFT'), `${row.id} carries a DRAFT cell`).toBe(false)
      expect(row.surface.includes('DRAFT'), `${row.id}'s surface carries a DRAFT cell`).toBe(false)
    }
  })

  it('⚠ no row carries the long dash', () => {
    // CLAUDE.md's style rule, on the engine's sentences this time.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
      expect(row.surface.includes('—'), `${row.id}'s surface cell carries the long dash`).toBe(false)
    }
  })
})
