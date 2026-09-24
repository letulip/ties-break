// THE COLLEGE SCENE / T3 – THE GRADUATE'S CHAMPIONSHIP RECORD ON HER ALBUM PAGE.
//
// docs/specs/the-college-scene-2026-09.md §4.1, as CORRECTED by ruling C
// (docs/plans/college-scene-rulings-2026-09.md): the spec asks for «the album's college chapter»
// and there is none – `AlbumBand` has five members and no per-year college page – so the per-year
// lines land as the `graduated` closer's `AlbumNote.lines`, the checklist form the wire already
// declares («short ruled lines instead of a paragraph», mockups AZ-B / AZ-C). The heirloom
// (`dynastyCandidates`) is the precedent: facts that ARE numbers ride the checklist, because the
// corpus's law is «no placeholders and no interpolation».
//
// ⚠ POSED THE WAY `tests/albumBook.test.ts` POSES A COLLEGE CAREER – a REAL `createWorld` world with
// a real `world.college` written onto it, then the REAL `assembleAlbum` – never a save and never a
// hand-typed sentence. The one thing this file does that the album's own college case does not is
// build HONEST `CollegeYear` rows instead of `{ startWeek: 0 } as never`, because the lines are read
// off two of their fields (`index` and `league`) and a `never` row would answer `undefined` for both.
//
// MUTATION LEDGER (each arm applied to `src/engine/world/albumBook.ts`, RUN, red output pasted into
// the wave's report, restored – 24.09):
//   ARM 1  the `lines` dropped from the `graduated` candidate (back to `{ closer: true }`)
//          → 3 red of 5: «the record» (3 lines expected, [] received), «the year's own index» and the
//            surfacing case's own CONTROL arm. The note-text pin and the leagueless case stay GREEN,
//            which is the point of having them: neither can notice a missing checklist, so neither is
//            the net. (2 red of 4 when this arm was first run, before the surfacing case existed.)
//   ARM 2  `wonTheLeague(run)` negated (`!wonTheLeague(run)`)
//          → 1 red of 5: «the record», where the title year prints «Final» (its own exit round) and
//            both exit years print «Won it». The shapes flip, which is the proof the fork is the
//            fork. ⚠ PREDICTED 2 AND MEASURED 1: the index case stays green, and honestly so – it
//            asserts the NUMBERING (three lines, the third one year four, no year three) and is
//            deliberately indifferent to which of the two shapes each line wears. The wording is the
//            record case's job and only it can fail for a wording reason.
//   ARM 3  `noteOf`'s checklist back to the LEAD frame alone (`c.lines ?? []`)
//          → 1 red of 5: the surfacing case, on its second arm only – «the record is the SHEET's, not
//            the lead frame's: expected [] to have a length of 3». Its own control arm (the degree
//            alone on the sheet) stays green, which is what makes the pair a measurement rather than
//            an assertion: the SAME seed and the SAME record, one junior title apart.

import { describe, expect, it } from 'vitest'
import { assembleAlbum, createWorld, kidAgeAt, type WorldState } from '../src/engine/world'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { COLLEGE_LEAGUE } from '../src/engine/collegeLeague'
import { ENDINGS } from '../src/engine/ending'
import type { AlbumSheetModel, CollegeLeagueRun, CollegeYear, Milestone } from '../src/shared/protocol'

/** The first week she is `age` – `tests/albumBook.test.ts`'s own helper, scanned rather than assumed
 *  so a birth-month change cannot silently re-band the case. */
function weekAtAge(world: WorldState, age: number): number {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

function run(roundsWon: number, week: number): CollegeLeagueRun {
  return { week, roundsWon, rounds: 3 }
}

/** ONE BANKED YEAR, whole. ⚠ `index` IS PASSED RATHER THAN DERIVED FROM THE ARRAY POSITION, which is
 *  what lets the four-year case below prove the lines read the ROW's number: `bankCollegeYear` writes
 *  `years.length + 1`, so year 4 is year 4 even when it is the third line on the page. */
function year(index: number, league: CollegeLeagueRun | null, from: number): CollegeYear {
  return {
    index,
    fromWeek: from,
    untilWeek: from + 52,
    startSkill: 40,
    endSkill: 44,
    startRank: null,
    endRank: null,
    fundsDeltaCents: 0,
    callUp: null,
    league,
  }
}

/** A graduate, posed: the full course behind her and the degree in hand, which is the ONLY gate the
 *  `graduated` sheet has (`finishedTheCourse` – the same predicate the emotion layer and the
 *  graduation card read). Her college runs to the week the course closes at `graduatesAt`.
 *
 *  ⚠ THE AGE IS A PARAMETER BECAUSE THE BAND DEPENDS ON IT: `portraitStage` puts 17–22 in `teen` and
 *  23–30 in `adult`, so a graduate at 22 shares her chapter with everything she did at seventeen and
 *  a graduate at 23 does not. That difference is what the surfacing case below is about. */
function graduate(seed: string, years: CollegeYear[], graduatesAt = 23): WorldState {
  const world = createWorld(seed)
  const done = weekAtAge(world, graduatesAt)
  world.week = done + 10
  world.college = {
    fromWeek: done - 52 * ENDINGS.collegeYears,
    untilWeek: done,
    doneWeek: done,
    years,
    pendingCallUp: null,
    pendingLeague: null,
  }
  return world
}

/** Four banked years, the shape ruling C describes: a title, an exit, a year that really held no
 *  championship, and one more exit – and the leagueless year is year THREE, so the third line has to
 *  say «Year 4» or it is counting instead of reading. */
function fourYears(world: WorldState): CollegeYear[] {
  const from = world.college!.fromWeek
  return [
    year(1, run(3, from + 12), from),
    year(2, run(0, from + 64), from + 52),
    year(3, null, from + 104),
    year(4, run(1, from + 168), from + 156),
  ]
}

/** THE SHEET THE DEGREE IS ON – found through the corpus, never through an index, because the wire
 *  deliberately carries WORDS and not occasion ids (`tests/albumBook.test.ts`'s `occasionsOf` reads
 *  the book the same way round). */
function graduatedSheet(world: WorldState): AlbumSheetModel {
  const voice = world.temperament!
  const caption = ALBUM_CORPUS.find((o) => o.id === 'graduated')!.voices[voice].caption
  const sheet = assembleAlbum(world).sheets.find((s) => s.frames.some((f) => f.caption === caption))
  if (!sheet) throw new Error('the posed graduate has no graduation sheet – the gate, not the checklist, is broken')
  return sheet
}

describe('the college scene T3 – the championship record on the graduate\'s page', () => {
  it('⭐⭐ the record: one line per banked year that held a championship, in year order, two shapes', () => {
    const world = graduate('college-album-record', [])
    world.college!.years = fourYears(world)
    expect(graduatedSheet(world).note!.lines, 'three championships in four years, and the null holds its peace').toEqual([
      'Year 1, the College League: Won it',
      // ⚠ RE-AIMED 24.09 by his Q3 ruling (option B) – the long exit form; same pin, his words.
      'Year 2, the College League: Went out in the Quarterfinal',
      'Year 4, the College League: Went out in the Semifinal',
    ])
  })

  it('⚠ the year\'s own index, never the line\'s position – the leagueless year is skipped, not renumbered', () => {
    const world = graduate('college-album-index', [])
    world.college!.years = fourYears(world)
    const lines = graduatedSheet(world).note!.lines
    expect(lines, 'three lines off four years').toHaveLength(3)
    expect(lines[2], 'the third line is year FOUR – `bankCollegeYear` writes the row its own number').toContain('Year 4')
    expect(lines.some((l) => l.includes('Year 3')), 'and year three, which held none, says nothing').toBe(false)
  })

  it('⚠ a course whose every year held no championship renders NO lines – an absent fact prints nothing', () => {
    const world = graduate('college-album-empty', [])
    const from = world.college!.fromWeek
    world.college!.years = [1, 2, 3, 4].map((i) => year(i, null, from + 52 * (i - 1)))
    expect(graduatedSheet(world).note!.lines, 'no championship, no checklist – and no «no championship» row either').toEqual([])
  })

  it('⚠⚠ the graduation note is the CORPUS\'s, unchanged – the checklist is beside his words, never over them', () => {
    const world = graduate('college-album-note', [])
    world.college!.years = fourYears(world)
    const voice = world.temperament!
    const hand = ALBUM_CORPUS.find((o) => o.id === 'graduated')!.voices[voice]
    const sheet = graduatedSheet(world)
    expect(sheet.note!.text, 'A30\'s own note for her voice').toBe(hand.note)
    expect(sheet.line, 'A30\'s own margin line').toBe(hand.line)
    expect(sheet.frames.some((f) => f.caption === hand.caption), 'A30\'s own caption').toBe(true)
    // the competition is named by the leaf's constant and never by a real body – CLAUDE.md Style
    for (const line of sheet.note!.lines) expect(line).toContain(COLLEGE_LEAGUE.label)
  })

  // ⚠⚠ CAPTURED IS NOT SURFACED, AND THIS IS THE CASE THAT PROVES IT. `portraitStage` puts 17–22 in
  // ONE band, so a girl who enrolled at eighteen and graduated at twenty-two shares her chapter with
  // her seventeenth year – and those weeks sort AHEAD of the degree. `noteOf` used to read the LEAD
  // frame's checklist, so one earlier teen moment dropped the whole championship record on the way to
  // the page: built, banked, and printed nowhere. Invisible while the heirloom was the only writer,
  // because it always leads its own sheet.
  it('⭐⭐ a teen-band graduate keeps her record even when an EARLIER moment leads the sheet', () => {
    const bare = graduate('college-album-teen', [], 22)
    bare.college!.years = fourYears(bare)
    bare.week = bare.college!.doneWeek! + 8
    expect(graduatedSheet(bare).note!.lines, 'alone on the sheet – the control arm').toHaveLength(3)

    const shared = graduate('college-album-teen', [], 22)
    shared.college!.years = fourYears(shared)
    shared.week = shared.college!.doneWeek! + 8
    // one junior title in the SAME teen band, eight weeks before she enrolled
    shared.milestones.push({ type: 'title', week: shared.college!.fromWeek - 8, tier: 'j30' } as Milestone)
    const sheet = graduatedSheet(shared)
    expect(sheet.frames.length, 'the degree now shares its sheet').toBeGreaterThan(1)
    expect(sheet.frames[0].caption, 'and it does not lead it – the junior title is the earlier week').not.toBe(
      ALBUM_CORPUS.find((o) => o.id === 'graduated')!.voices[shared.temperament!].caption,
    )
    expect(sheet.note!.lines, 'the record is the SHEET\'s, not the lead frame\'s').toHaveLength(3)
  })
})
