// ⭐⭐ ROUND-23 #6 – THE PERSONAL PAGE STOPS SAYING "School finished" FOR TWENTY YEARS.
//
// THE OWNER, 19.08:
//   «Что можем вместо school finished на личной странице написать? Может быть разное что-то там
//    можно отображать в течение взросления? Про колледж и его окончание (если пошла и закончила
//    конечно) ещё что-то предложишь?»
//   ...and, on the shape he was offered back (one line for the whole college period plus a separate
//   line once she has finished): «да, давай так».
//
// (The quotes live in a test rather than in the template they are about: tests/round13-nav.test.ts
// bans Cyrillic inside a Vue template, comments included.)
//
// WHAT IS ACTUALLY BEING CLAIMED, and each of the four is a separate arm below:
//
//   1. THE TENSE. Grades 8-12 moved once a year for four years and then the cell froze. Past the
//      last grade it now walks a ladder, and the ladder is monotone in her age - it never steps
//      back, which is the property a LIFE has and a status flag does not.
//   2. THREE COLLEGE STATES AND NOT TWO. `resumeFromCollege` spends the four years one at a time and
//      `endCollegeEarly` is a real answer at every boundary, so "she went" splits into studying,
//      graduated and LEFT. The sharpest assertion in this file is that a girl who left after one
//      year is not handed the graduate's line.
//   3. THE CELL'S OWN NAME MOVES WITH IT. School -> College -> After school.
//   4. THE TWO UNDER-GRID NOTES CANNOT BOTH SPEAK. `schoolCutOffNote` is silent once she is out;
//      `collegeNote` is silent until she is.
//
// ⚠ MUTATION-VERIFIED (each mutation applied alone, then reverted):
//   * `afterSchoolTile` returns the `'The last bell'` rung for every post-school week
//        -> "the ladder moves" and "monotone AND all three rungs reached" go red.
//   * drop the `college.yearsDone >= college.totalYears` test, so every finished course graduates
//        -> "a girl who left after one year is not a graduate" goes red (and only that).
//   * `stageLabelOf` returns `STAGE_LABEL.school` always
//        -> the label arm goes red.
//   * `collegeNote` returns its sentence for a `null` college
//        -> "silent for a career that never went" goes red.
import { describe, it, expect } from 'vitest'
import {
  buildKidLife,
  collegeNote,
  GROWN_UP_AGE_YEARS,
  lifeStageTile,
  schoolEndWeek,
  schoolIsOver,
  stageLabelOf,
  STAGE_LABEL,
  TILE_LINE_MAX,
  type KidLifeWorldView,
} from '../src/engine/kidLife'
import { COLLEGE_TIER_NAME } from '../src/engine/collegeOffer'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import {
  closeTournament,
  collegeLeagueRevealOpen,
  skipTournament,
  answerFork,
  buildBirthdayPrompt,
  chooseGift,
  createWorld,
  decideKnock,
  endCollegeEarly,
  kidAgeExact,
  pendingBirthday,
  pendingKnock,
  resumeFromCollege,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { POLICIES, stepCareerWeek } from '../tools/econ-bench'
import { seasonYear } from '../src/shared/dates'
import { DEFAULT_PROFILE, type CollegeTier } from '../src/shared/protocol'

/** ⭐⭐⭐ ROUND 26 #6 RE-AIM – THE PRESS THAT ANSWERS THE CHAMPIONSHIP. `resumeFromCollege` now PAUSES
 *  the year on the College League week the way it already pauses on her birthday, because the owner
 *  had been told about the tournament instead of shown it. So every walk here answers the reveal the
 *  way the player does – «Skip all rounds», then the finale's «Continue», which are `skipTournament`
 *  and `closeTournament` dispatched at the college reveal. Nothing measured below moved; the walk
 *  answers one more question and its press ceiling grows by one a year. The full note is in
 *  tests/college-league.test.ts, and the flow itself in tests/round26-college-flow.test.ts. */
function answerLeagueReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}


/** A view for one week of one career. Her age is HER OWN (`kidAgeExact`), never the band's – the
 *  one-clock ruling – because the after-school ladder's last rung is an age comparison. */
function view(week: number, over: Partial<KidLifeWorldView> = {}): KidLifeWorldView {
  const birthMonth = over.birthMonth ?? 6
  return {
    seed: 'round23-life',
    week,
    ageYears: Math.floor(kidAgeExact(week, birthMonth, 15)),
    seasonYear: seasonYear(Math.floor(week / WEEKS_PER_YEAR)),
    playStyle: 'all-court',
    birthMonth,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    college: null,
    kidFundsCents: 0,
    ...over,
  }
}

const collegeView = (over: Partial<KidLifeWorldView['college']> & object = {}) => ({
  studying: false,
  yearsDone: 0,
  totalYears: ENDINGS.collegeYears,
  tier: 'state' as CollegeTier,
  ...over,
})

// =================================================================================================
// 1 – THE TENSE: the cell keeps moving after the last bell
// =================================================================================================
/**
 * ⚠ ASK THE ENGINE WHAT IT IS OFFERING, DO NOT REBUILD IT (R2-18).
 *
 * These harnesses used to answer a birthday with `birthdayOffer(world.seed, age).options[0].id` -
 * a SECOND derivation of the offer, sitting beside the engine's own and agreeing with it only for
 * as long as the offer depended on nothing but the seed and the age. The moment it depended on one
 * more fact (`atCollege`, so a girl in a hall of residence is not offered a kitchen table for her
 * flat) the replay diverged and `chooseGift` rejected every answer these careers gave - which is
 * the engine's re-validation working exactly as designed, catching a stale client.
 *
 * `buildBirthdayPrompt` is what the DIALOG reads, so answering from it is what the PLAYER does, and
 * no future rule about which band a birthday draws from can make this harness wrong again.
 */
function answerableGift(world: WorldState): string {
  const prompt = buildBirthdayPrompt(world)
  if (prompt === null) throw new Error('no birthday to answer')
  return prompt.options[0].id
}

describe('#6a – the life-stage ladder past the last grade', () => {
  it('⭐⭐ "School finished" is gone from every week of a twenty-five-year career', () => {
    for (const bm of [1, 6, 9, 12]) {
      for (let week = 0; week < WEEKS_PER_YEAR * 25; week += 3) {
        const tile = lifeStageTile(view(week, { birthMonth: bm }))
        expect(tile.lead, `bm ${bm} w${week}`).not.toBe('School finished')
        expect(tile.note, `bm ${bm} w${week}`).not.toBe('No more bells')
      }
    }
  })

  it('⭐⭐ IT MOVES – four distinct readings across one career, and it never steps back', () => {
    // The ladder as an ORDER: a grade, then the year out, then tennis full-time, then grown. Read as
    // rung indices so the assertion is about the SHAPE and survives a rewording of any rung.
    const rung = (week: number): number => {
      const lead = lifeStageTile(view(week)).lead
      if (/ grade$/.test(lead)) return 0
      if (lead === 'The last bell') return 1
      if (lead === 'Tennis full-time') return 2
      if (lead === 'Grown up') return 3
      throw new Error(`unknown rung: ${lead}`)
    }
    let last = -1
    const seen = new Set<number>()
    for (let week = 0; week < WEEKS_PER_YEAR * 20; week++) {
      const r = rung(week)
      expect(r, `w${week} stepped back from ${last}`).toBeGreaterThanOrEqual(last)
      last = r
      seen.add(r)
    }
    expect([...seen].sort(), 'all four rungs are reached, in order').toEqual([0, 1, 2, 3])
  })

  it('the hand-over is EXACTLY `schoolIsOver`, so the tile and the engine cannot disagree', () => {
    for (const bm of [1, 6, 9, 12]) {
      const end = schoolEndWeek(bm)
      for (const week of [end - 1, end, end + 1]) {
        const printsGrade = / grade$/.test(lifeStageTile(view(week, { birthMonth: bm })).lead)
        expect(printsGrade, `bm ${bm} w${week}`).toBe(!schoolIsOver(week, bm))
      }
    }
  })

  it('the year out is exactly one year, and the grown-up rung opens on the diary\'s own birthday', () => {
    const end = schoolEndWeek(6)
    expect(lifeStageTile(view(end)).lead).toBe('The last bell')
    expect(lifeStageTile(view(end + WEEKS_PER_YEAR - 1)).lead).toBe('The last bell')
    expect(lifeStageTile(view(end + WEEKS_PER_YEAR)).lead).toBe('Tennis full-time')
    // ...and the last rung is the 22 `diaryLifeStageFor` splits 'after-school' from 'independent' on.
    const justBefore = view(WEEKS_PER_YEAR * 8, { ageYears: GROWN_UP_AGE_YEARS - 1 })
    const justAfter = view(WEEKS_PER_YEAR * 8, { ageYears: GROWN_UP_AGE_YEARS })
    expect(lifeStageTile(justBefore).lead).toBe('Tennis full-time')
    expect(lifeStageTile(justAfter).lead).toBe('Grown up')
  })

  it('every line still fits the cell – the 115px nowrap budget the whole module is written to', () => {
    const lines: string[] = []
    for (const bm of [1, 6, 9, 12]) {
      for (let week = 0; week < WEEKS_PER_YEAR * 25; week += 7) {
        const tile = lifeStageTile(view(week, { birthMonth: bm }))
        lines.push(tile.lead, tile.note)
      }
    }
    for (const years of [0, 1, 2, 3, 4]) {
      for (const studying of [true, false]) {
        const tile = lifeStageTile(view(400, { college: collegeView({ studying, yearsDone: years }) }))
        lines.push(tile.lead, tile.note)
      }
    }
    for (const l of new Set(lines)) {
      expect(l.length, `"${l}" is ${l.length} characters`).toBeLessThanOrEqual(TILE_LINE_MAX)
      expect(l.length, 'and no line is ever blank').toBeGreaterThan(0)
      expect(l, 'player copy: short dash only').not.toContain('—')
    }
  })
})

// =================================================================================================
// 2 – THREE COLLEGE STATES, AND THE ONE THAT MATTERS IS THE THIRD
// =================================================================================================
describe('#6b – studying, graduated, and left', () => {
  it('⭐⭐ A GIRL WHO LEFT AFTER ONE YEAR IS NOT HANDED THE GRADUATE\'S LINE', () => {
    const left = lifeStageTile(view(400, { college: collegeView({ studying: false, yearsDone: 1 }) }))
    const grad = lifeStageTile(view(400, { college: collegeView({ studying: false, yearsDone: ENDINGS.collegeYears }) }))
    expect(left.lead).toBe('Left college')
    expect(left.note).toBe(`1 of ${ENDINGS.collegeYears} years`)
    expect(grad.lead).toBe('Graduate')
    expect(left.lead).not.toBe(grad.lead)
    // ...and the sentence under the grid says the same thing in words.
    const leftNote = collegeNote(view(400, { college: collegeView({ studying: false, yearsDone: 1 }) }))
    const gradNote = collegeNote(view(400, { college: collegeView({ studying: false, yearsDone: ENDINGS.collegeYears }) }))
    expect(leftNote).toMatch(/left before the course ended/)
    expect(gradNote).toMatch(/finished the course/)
    expect(leftNote).not.toBe(gradNote)
  })

  it('the studying line carries the YEAR and moves through the course', () => {
    const leads = [0, 1, 2, 3].map(
      (yearsDone) => lifeStageTile(view(400, { college: collegeView({ studying: true, yearsDone }) })).lead,
    )
    expect(leads).toEqual([
      `Year 1 of ${ENDINGS.collegeYears}`,
      `Year 2 of ${ENDINGS.collegeYears}`,
      `Year 3 of ${ENDINGS.collegeYears}`,
      `Year 4 of ${ENDINGS.collegeYears}`,
    ])
    expect(new Set(leads).size, 'four years, four different lines').toBe(4)
    // The last of them says so, which is the beat the epilogue's own `final` flag is about.
    expect(lifeStageTile(view(400, { college: collegeView({ studying: true, yearsDone: 2 }) })).note).toBe(
      'Student tennis',
    )
    expect(lifeStageTile(view(400, { college: collegeView({ studying: true, yearsDone: 3 }) })).note).toBe('Final year')
  })

  it('the sentence NAMES THE PLACE, off the one table the fork card and the epilogue share', () => {
    for (const tier of ['state', 'national', 'private'] as CollegeTier[]) {
      const note = collegeNote(view(400, { college: collegeView({ studying: true, yearsDone: 1, tier }) }))
      expect(note).toContain(COLLEGE_TIER_NAME[tier])
      expect(note).toContain(`year 2 of ${ENDINGS.collegeYears}`)
      expect(note, 'player copy: short dash only').not.toContain('—')
    }
    // A career migrated from v51 was never quoted a tier. The line still says the true thing.
    const unknown = collegeNote(view(400, { college: collegeView({ studying: true, yearsDone: 1, tier: null }) }))
    expect(unknown).toMatch(/^The college place she took/)
    expect(unknown.length).toBeGreaterThan(0)
  })

  it('college OUTRANKS the age ladder – a twenty-year-old on a scholarship is at college', () => {
    const enrolled = view(400, { ageYears: 20, college: collegeView({ studying: true, yearsDone: 1 }) })
    expect(lifeStageTile(enrolled).lead).toBe(`Year 2 of ${ENDINGS.collegeYears}`)
    expect(lifeStageTile({ ...enrolled, college: null }).lead).toBe('Tennis full-time')
  })

  it('⚠ AND IT IS SILENT FOR A CAREER THAT NEVER WENT – the commonest case of all', () => {
    for (let week = 0; week < WEEKS_PER_YEAR * 20; week += 13) {
      expect(collegeNote(view(week)), `w${week}`).toBe('')
    }
  })
})

// =================================================================================================
// 3 – THE CELL'S NAME, AND THE TWO NOTES THAT MAY NEVER COLLIDE
// =================================================================================================
describe('#6 – the heading, and the notes under the grid', () => {
  it('the label walks School -> College -> After school', () => {
    expect(stageLabelOf(view(100))).toBe(STAGE_LABEL.school)
    expect(stageLabelOf(view(400, { college: collegeView({ studying: true, yearsDone: 1 }) }))).toBe(
      STAGE_LABEL.college,
    )
    expect(stageLabelOf(view(400))).toBe(STAGE_LABEL.after)
    expect(stageLabelOf(view(400, { college: collegeView({ studying: false, yearsDone: 4 }) }))).toBe(STAGE_LABEL.after)
    expect(new Set(Object.values(STAGE_LABEL)).size, 'three names, all different').toBe(3)
  })

  it('⚠ THE SEPTEMBER NOTE AND THE COLLEGE NOTE ARE NEVER BOTH ON SCREEN', () => {
    // The one is only true while she is at school; the other only once she is out. Swept over the
    // four birth months that can produce a September note at all, for twenty years.
    for (const bm of [9, 10, 11, 12]) {
      for (let week = 0; week < WEEKS_PER_YEAR * 20; week += 5) {
        // The worst case for a collision: a career that DID go, sampled at every week of it. The
        // college state is attached only from the weeks it can physically exist in - she is out of
        // school before the fork is ever raised - so this is a career and not a hand-built impossibility.
        const v = view(week, {
          birthMonth: bm,
          college: schoolIsOver(week, bm) ? collegeView({ studying: true, yearsDone: 1 }) : null,
        })
        const life = buildKidLife(v)
        expect(
          life.schoolWhy !== '' && life.collegeNote !== '',
          `bm ${bm} w${week}: both notes spoke`,
        ).toBe(false)
      }
    }
  })

  it('buildKidLife carries all of it, so the screen derives nothing', () => {
    const life = buildKidLife(view(400, { college: collegeView({ studying: true, yearsDone: 2 }) }))
    expect(life.schoolLabel).toBe(STAGE_LABEL.college)
    expect(life.school.lead).toBe(`Year 3 of ${ENDINGS.collegeYears}`)
    expect(life.collegeNote).toContain(COLLEGE_TIER_NAME.state)
    expect(life.friends.lead.length).toBeGreaterThan(0)
  })
})

// =================================================================================================
// 4 – END TO END: a career that really enrols, really leaves, and really graduates
// =================================================================================================
//
// ⚠ THE THREE ARMS ABOVE ARE VIEWS. This one is the world: `toSnapshot` assembling the college slice
// out of `world.college` and `world.fork.offer`, on a career that reached the fork by playing. It is
// the arm that would catch a snapshot wiring the tile to the wrong field – which no amount of
// testing `collegeNote` in isolation can.
describe('#6b – on a career that really went', () => {
  it('⭐⭐ enrolled, then left after one year, and the page says so at every step', () => {
    const world = createWorld('round23-college', {
      ...DEFAULT_PROFILE,
      birthMonth: 6,
      background: 'middle',
      coachTier: 'middle',
    })
    const rng = rngFromSeed(world.seed)
    while (!(world.fork !== null && world.fork.answer === null) && world.week < 400 && !world.ending) {
      // Held solvent so the arm is decided by the CALENDAR and not by a bankruptcy before the fork.
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
      stepCareerWeek(world, rng, POLICIES[1])
    }
    expect(world.fork, 'she reached the fork at nineteen').not.toBeNull()
    // ⚠ ROUND 24: the walk exits the moment the fork opens, which is her nineteenth birthday's own
    // week – and the real flow answers the BIRTHDAY first (blockingOverlay, the 12.08 ruling). An
    // unanswered birthday would now refuse the first college press, exactly as it refuses a `+4`.
    {
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
    }

    // Before the answer: out of school, no college, no college line.
    const before = toSnapshot(world).life
    expect(before.schoolLabel).toBe(STAGE_LABEL.after)
    expect(before.collegeNote).toBe('')

    answerFork(world, 'college')
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    // ⚠ ROUND 24 #5: the answer reserves – the gap to the September departure is walked with the
    // SAME player-policy step the career arrived on (it enters, plays and closes its own reveals;
    // a bare tick would strand one open and the departure never resolves past it).
    for (let i = 0; i < 56 && world.ending === null; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
      stepCareerWeek(world, rng, POLICIES[1])
    }
    // Press-answer-press (round 24): the year pauses on her birthday so the gift can be answered.
    for (let press = 0; press < 4 && world.college!.years.length === 0; press++) {
      resumeFromCollege(world, rng)
      answerLeagueReveal(world)
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
    }
    // ONE year lived, and she is still enrolled – the state the shipped flow spends the four years in.
    const enrolled = toSnapshot(world).life
    expect(enrolled.schoolLabel).toBe(STAGE_LABEL.college)
    expect(enrolled.school.lead).toBe(`Year 2 of ${ENDINGS.collegeYears}`)
    expect(enrolled.collegeNote).toMatch(/she is in year 2 of/)
    expect(enrolled.collegeNote).toContain(COLLEGE_TIER_NAME[world.fork!.offer!.chosen!])

    endCollegeEarly(world)
    const left = toSnapshot(world).life
    expect(left.schoolLabel).toBe(STAGE_LABEL.after)
    expect(left.school.lead).toBe('Left college')
    expect(left.school.note).toBe(`1 of ${ENDINGS.collegeYears} years`)
    expect(left.collegeNote).toMatch(/left before the course ended/)
    // ⚠ AND IT IS NOT THE GRADUATE'S LINE, which is the whole reason this state exists.
    expect(left.collegeNote).not.toMatch(/finished the course/)
  })

  it('⭐ ...and a career that stays the whole course gets the OTHER line', () => {
    const world = createWorld('round23-college', {
      ...DEFAULT_PROFILE,
      birthMonth: 6,
      background: 'middle',
      coachTier: 'middle',
    })
    const rng = rngFromSeed(world.seed)
    while (!(world.fork !== null && world.fork.answer === null) && world.week < 400 && !world.ending) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
      stepCareerWeek(world, rng, POLICIES[1])
    }
    // ⚠ ROUND 24: her nineteenth (the fork's own week) is answered before the fork, as the real
    // flow orders it – an unanswered birthday refuses the college press now.
    {
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
    }
    answerFork(world, 'college')
    // ⚠ ROUND 24 #5: the answer reserves – the gap to the September departure is walked with the
    // SAME player-policy step the career arrived on (see the leaving case above for why).
    for (let i = 0; i < 56 && world.ending === null; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
      stepCareerWeek(world, rng, POLICIES[1])
    }
    // Press-answer-press (round 24): each year pauses on her birthday week.
    for (let press = 0; press < 4 * ENDINGS.collegeYears && world.college!.doneWeek === null; press++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      resumeFromCollege(world, rng)
      answerLeagueReveal(world)
      const age = pendingBirthday(world)
      if (age !== null) chooseGift(world, answerableGift(world))
    }
    expect(world.college!.doneWeek, 'the course is over').not.toBeNull()
    expect(world.college!.years.length).toBe(ENDINGS.collegeYears)
    const life = toSnapshot(world).life
    expect(life.school.lead).toBe('Graduate')
    expect(life.collegeNote).toMatch(/finished the course/)
    expect(life.collegeNote).not.toMatch(/left before/)
  })
})
