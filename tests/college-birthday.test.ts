// =================================================================================================
// ⭐⭐⭐ ROUND 24 – HER COLLEGE BIRTHDAYS HAPPEN. The owner, 22.08: «да, день рождения делай»
// (docs/plans/college-the-flow.md, ruling 2).
//
// WHAT WAS TRUE BEFORE THIS WAVE: a girl spent four years at university and not one of her birthdays
// happened. `pendingBirthday` returned null inside the freeze – correctly, because a blocking dialog
// cannot be answered inside a 52-week loop – and the years got a substitute feed line instead
// (owner, 19.08). Round 24's Home shell made the dialog deliverable: the shell is alive underneath
// the college latch, so the year can STOP for her birthday the way it stops for a call-up.
//
// THE DESIGN, in three sentences, walked here end to end:
//   1. `resumeFromCollege` PAUSES on the birthday week – the loop breaks, the latch goes back on
//      with the SAME year's end under it (`resumesWeek`), and the year's opening measurements are
//      persisted (`college.pendingYearStart`, v57) so the finishing press banks against the numbers
//      the year actually opened with.
//   2. The gift dialog renders over the live college Home shell (`blockingOverlay` lets 'birthday'
//      through exactly the resumable college latch) and `chooseGift` answers it WITH THE LATCH ON
//      (`guardNotEndedForGood` – the third member of E2's deliberately short list).
//   3. The next press finishes the year: same academic boundary, one banked row, nothing re-measured
//      and nothing double-banked. A birthday on the boundary week itself banks first and asks at the
//      rest state, where the entry guard holds the next press until it is answered.
//
// ⚠ WHAT A GIFT COSTS AT COLLEGE: NOTHING, BECAUSE IT COSTS NOTHING ANYWHERE – spec §0, the owner:
// «про цену момент, давай не будем это учитывать в нашем кошельке вообще». One catalogue for every
// background and no affordability test is the shipped design, so the college birthday offers the
// SAME list with the same (absent) prices, and the funds assertion below is byte-equality. The
// gift's whole effect is the record row plus a feed line (spec rulings 1-2: no skill, no condition,
// no morale, no kit), and BOTH are fully alive inside the freeze – the feed is written all through
// it and the ask-derivation reads the record wherever it was made. Nothing is meaningless here.
//
// ⚠ AGAINST WALKED WORLDS, NEVER HAND-BUILT ONES – the same discipline every college suite keeps.
// The careers below really play sixty weeks, really answer the fork and really spend the freeze
// through `resumeFromCollege`.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CAREER_ENDED_REFUSAL,
  answerFork,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  endCollegeEarly,
  latchEnding,
  pendingBirthday,
  pendingKnock,
  resumeFromCollege,
  revealTournamentRound,
  skillMeanOf,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { COLLEGE_LEAGUE } from '../src/engine/collegeLeague'
import { NATIONAL_TEAM } from '../src/engine/nationalTeam'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { resumeMain, type Rng } from '../src/engine/rng'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type StopReason } from '../src/shared/protocol'

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** Any pending birthday, answered with the one option EVERY birthday offers – the day together is
 *  never spent and never filtered (see `birthdayOffer`), so this is always a legal answer. */
function answerBirthday(world: WorldState): number {
  const age = pendingBirthday(world)
  expect(age, 'the fixture called answerBirthday with nothing pending').not.toBeNull()
  chooseGift(world, 'day')
  return age!
}

/** A career REALLY at the fork: sixty lived weeks with every knock, reveal and tour birthday
 *  answered on the way – so the only question standing when college opens is the one this file is
 *  about. The funds top-up is the one thumb on the scale every college suite puts there (four years
 *  is 208 weeks of base costs; a career that went bankrupt mid-freeze would measure the budget). */
function openedAtCollege(seed: string, birthMonth: number, birthDay: number): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, birthDay, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (pendingBirthday(world) !== null) answerBirthday(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  answerFork(world, 'college')
  expect(world.ending?.type, 'the fork really latched the college ending').toBe('college')
  return { world, rng }
}

/** One press of the Home shell's college button, with the stops it reported. */
type Press = { week: number; stops: StopReason[]; years: number; paused: boolean }

/** The whole freeze, pressed and answered exactly as a player would: press, answer any birthday the
 *  press stopped for, press again – until she graduates or leaves. Returns every press. */
function walkTheFreeze(world: WorldState, rng: Rng, maxPresses = 24): Press[] {
  const presses: Press[] = []
  for (let guard = 0; guard < maxPresses && world.ending?.type === 'college'; guard++) {
    const stops = resumeFromCollege(world, rng)
    presses.push({
      week: world.week,
      stops,
      years: world.college!.years.length,
      paused: (world.college!.pendingYearStart ?? null) !== null,
    })
    if (pendingBirthday(world) !== null) answerBirthday(world)
  }
  return presses
}

// =================================================================================================
// ⭐⭐⭐ 1. FOUR COLLEGE YEARS, FOUR BIRTHDAYS – each one stops the year and each one is answered
// =================================================================================================
describe('a walked career through four college years gets four birthdays', () => {
  it('⭐⭐⭐ every birthday pauses the year, is answerable on the shell, and lands on the record', () => {
    const { world, rng } = openedAtCollege('cb-four-years', 6, 15) // the DEFAULT_PROFILE birth date
    const forkWeek = world.week
    const rowsBefore = world.birthdays.length
    // The walk, with the feed read AT each answered birthday – the retention policy (`pruneEvents`)
    // is its own tested concern, and a four-year walk legitimately prunes year 1's info rows.
    const feedAtBirthday: string[] = []
    const presses: Press[] = []
    for (let guard = 0; guard < 24 && world.ending?.type === 'college'; guard++) {
      const stops = resumeFromCollege(world, rng)
      presses.push({
        week: world.week,
        stops,
        years: world.college!.years.length,
        paused: (world.college!.pendingYearStart ?? null) !== null,
      })
      if (pendingBirthday(world) !== null) {
        answerBirthday(world)
        feedAtBirthday.push(world.events.filter((e) => e.week === world.week).map((e) => e.text).join(' | '))
      }
    }

    // Four years really spent, and she is out with the latch off.
    expect(world.college!.years, 'four years banked').toHaveLength(ENDINGS.collegeYears)
    expect(world.college!.doneWeek, 'and the course is closed').toBe(forkWeek + 4 * WEEKS_PER_YEAR)

    // FOUR birthdays, one per college year, every one recorded on the week it happened.
    const collegeRows = world.birthdays.slice(rowsBefore)
    expect(collegeRows, 'four college birthdays answered').toHaveLength(4)
    for (const [i, row] of collegeRows.entries()) {
      expect(row.week, `birthday ${row.age} landed inside year ${i + 1}`).toBeGreaterThan(forkWeek + i * WEEKS_PER_YEAR)
      expect(row.week).toBeLessThanOrEqual(forkWeek + (i + 1) * WEEKS_PER_YEAR)
      expect(row.given, 'the chosen gift is on the record').toBe('day')
    }
    // ...and every one of the four weeks carried both halves in the feed when it was lived: the age
    // line (`markBirthday` – the standard sentence, the college variant is gone) and the gift line.
    expect(feedAtBirthday, 'a feed reading per answered birthday').toHaveLength(4)
    for (const texts of feedAtBirthday) {
      expect(texts).toMatch(/she is .+ this week/i)
      expect(texts).toMatch(/Her birthday\./)
    }

    // The pauses are REAL pauses: a press that stopped for a birthday held the year open
    // (`pendingYearStart` persisted, no bank), and the press after it finished the SAME year.
    const pausedPresses = presses.filter((p) => p.stops.includes('birthday') && p.paused)
    expect(pausedPresses.length, 'this birth date pauses mid-year, not on boundaries').toBeGreaterThanOrEqual(3)
    for (const p of pausedPresses) {
      expect(p.stops, 'the pause re-latched the college ending').toContain('ending')
    }

    // ⚠ THE ACADEMIC BOUNDARY DID NOT DRIFT. A paused year is finished, not restarted: every banked
    // year is exactly fifty-two weeks and each opens where the previous closed. This is the
    // assertion that goes red if `yearEnds` ever reads `world.week` instead of the year's opening.
    for (const [i, year] of world.college!.years.entries()) {
      expect(year.untilWeek - year.fromWeek, `year ${i + 1} is a full year`).toBe(WEEKS_PER_YEAR)
      expect(year.fromWeek, `year ${i + 1} opens where year ${i} closed`).toBe(forkWeek + i * WEEKS_PER_YEAR)
    }
  })

  it('⭐⭐ the banked year is measured at its OPENING, not at the pause – pendingYearStart is honest', () => {
    const { world, rng } = openedAtCollege('cb-honest-start', 6, 15)
    const skillAtOpening = skillMeanOf(world.skills)
    const fundsAtOpening = world.fundsCents

    // Press once: this career pauses mid-year on her birthday.
    const stops = resumeFromCollege(world, rng)
    expect(stops).toContain('birthday')
    expect(world.college!.years, 'the paused year is NOT banked').toHaveLength(0)
    expect(world.college!.pendingYearStart, 'its opening is persisted instead').not.toBeNull()
    expect(world.college!.pendingYearStart!.week, 'measured at the fork week').toBeLessThan(world.week)
    expect(world.college!.pendingYearStart!.skill, 'the skill of the opening, already history').toBe(skillAtOpening)

    // Answer, finish the year, and the bank reads the opening – not the pause.
    answerBirthday(world)
    const fundsAtBank = (() => {
      resumeFromCollege(world, rng)
      return world.fundsCents
    })()
    expect(world.college!.years, 'now the year banks').toHaveLength(1)
    const year = world.college!.years[0]
    expect(year.startSkill, 'startSkill is the opening measurement').toBe(skillAtOpening)
    expect(year.fundsDeltaCents, 'the money delta spans the WHOLE year').toBe(fundsAtBank - fundsAtOpening)
    expect(world.college!.pendingYearStart, 'and the start is cleared with the bank').toBeNull()
  })

  it('⭐⭐ the dialog is deliverable where the pause leaves the player: over the college Home shell', () => {
    const { world, rng } = openedAtCollege('cb-overlay', 6, 15)
    resumeFromCollege(world, rng)
    const snap = toSnapshot(world)
    expect(snap.birthdayPrompt, 'the prompt is on the snapshot').not.toBeNull()
    expect(snap.ending?.ending.type, 'the college latch is on underneath it').toBe('college')
    expect(snap.ending?.college, 'and it is the resumable latch – the Home shell case').not.toBeNull()
    expect(snap.ending?.college?.yearInProgress, 'which reports the paused year to the bottom control').toBe(true)
    // ⚠ MUTATION-VERIFIED (arm 5 in the wave report): remove the college carve-out in
    // `blockingOverlay` and this reads 'ending' – the dialog would render nowhere and the career
    // would strand behind a button the entry guard refuses.
    expect(blockingOverlay(snap), 'the birthday outranks exactly this one ending').toBe('birthday')
    // Answered, the shell goes back to the college card – the latch never left.
    answerBirthday(world)
    expect(blockingOverlay(toSnapshot(world))).toBe('ending')
  })

  it('⚠ a gift costs the family nothing at college, because it costs nothing anywhere – spec §0', () => {
    const { world, rng } = openedAtCollege('cb-free', 6, 15)
    resumeFromCollege(world, rng)
    const funds = world.fundsCents
    const rng0 = { ...world.rngMain }
    answerBirthday(world)
    expect(world.fundsCents, 'byte-equal funds: no charge, no corridor, no price').toBe(funds)
    expect(world.rngMain, 'and no draw on MAIN – the offer lives on seed:birthday:<age>').toEqual(rng0)
  })
})

// =================================================================================================
// ⭐⭐⭐ 2. THE COLLISION YEAR – championship week, call-up week and the cake, none swallowed
// =================================================================================================
describe('the collision year: birthday + championship + call-up all deliver', () => {
  // ⚠ THE DATE IS CONSTRUCTED, NOT LUCKY. `COLLEGE_LEAGUE.seasonWeek` is 12 and the league fires on
  // `world.week % 52 === 12` – a CAREER-calendar week, so it collides with a birthday exactly when
  // her date falls in that season week. Measured over ten seasons (tools run, 22.08): born 2 April
  // her birthday's season week is 12 in eight seasons of ten – the championship's own week.
  it('⭐⭐⭐ the championship and the cake in ONE week: both reported, in precedence order, year intact', () => {
    expect(COLLEGE_LEAGUE.seasonWeek, 'the constructed date below assumes the league at 12').toBe(12)
    expect(NATIONAL_TEAM.seasonWeek, 'and the call-up at 14').toBe(14)
    const { world, rng } = openedAtCollege('probe-collide', 4, 2)

    // Press 1: the year pauses on her birthday week, which IS the championship week.
    const first = resumeFromCollege(world, rng)
    expect(world.week % WEEKS_PER_YEAR, 'the pause week is the league week itself').toBe(COLLEGE_LEAGUE.seasonWeek)
    expect(first, 'the championship is reported').toContain('college-league')
    expect(first, 'the birthday is reported beside it').toContain('birthday')
    expect(first.indexOf('college-league'), 'in STOP_PRECEDENCE order: the news leads, the question follows')
      .toBeLessThan(first.indexOf('birthday'))
    expect([...first].sort(), 'and the report IS the precedence filter, not insertion order').toEqual(
      [...STOP_PRECEDENCE.filter((r) => first.includes(r))].sort(),
    )
    expect(world.college!.pendingLeague, 'the championship really was played this press').not.toBeNull()
    expect(world.college!.years, 'and the year is still open').toHaveLength(0)

    // Answer the cake; press 2 finishes the year and the call-up week (14) lands in the second half.
    answerBirthday(world)
    const second = resumeFromCollege(world, rng)
    expect(world.college!.years, 'one banked year, not two halves').toHaveLength(1)
    const year = world.college!.years[0]
    expect(year.league, 'the championship folded into the banked year').not.toBeNull()
    expect(year.callUp, 'the letter came – read off the championship the player had just watched').not.toBeNull()
    expect(second, 'and the finishing press reported it').toContain('call-up')

    // Nothing strands: the remaining years walk out with every birthday answered.
    const presses = walkTheFreeze(world, rng)
    expect(world.college!.years).toHaveLength(ENDINGS.collegeYears)
    expect(world.ending?.type, 'the latch is off – she graduated').not.toBe('college')
    expect(presses.length, 'the loop terminated by graduating, not by the guard').toBeLessThan(24)
  })

  it('⭐ a boundary birthday: the year banks first, the question waits at the rest state, nothing is lost', () => {
    // Born 28 February the birthday's season week equals this fixture's boundary week, so the pause
    // and the bank coincide: the year is genuinely over, so it banks – and the prompt stays pending
    // where the player is standing.
    const { world, rng } = openedAtCollege('probe-boundary', 2, 28)
    const stops = resumeFromCollege(world, rng)
    expect(stops).toContain('birthday')
    expect(world.college!.years, 'the completed year banked – a boundary birthday is not a pause').toHaveLength(1)
    expect(world.college!.pendingYearStart ?? null, 'no year is mid-flight').toBeNull()
    expect(pendingBirthday(world), 'the question stands at the rest state').not.toBeNull()

    // ⚠ THE ENTRY GUARD – the engine is the gate, not the dialog covering the button: a year may not
    // be spent over an unanswered birthday. A no-op report, the same contract `advanceWeeks` keeps.
    const weekBefore = world.week
    const rngBefore = { ...world.rngMain }
    const refused = resumeFromCollege(world, rng)
    expect(refused, 'refused with the reason, nothing else').toEqual(['birthday'])
    expect(world.week, 'not one week ticked').toBe(weekBefore)
    expect(world.rngMain, 'and not one draw spent').toEqual(rngBefore)
    expect(world.college!.years, 'and nothing banked twice').toHaveLength(1)

    answerBirthday(world)
    resumeFromCollege(world, rng)
    expect(world.college!.years, 'answered, the same press works').toHaveLength(2)
  })
})

// =================================================================================================
// ⭐⭐ 3. THE GUARDS AROUND IT – what still refuses, and with which sentence
// =================================================================================================
describe('the guards: ended stays ended, and the early return respects the paused year', () => {
  it('⚠ a genuinely ended career still refuses chooseGift with the ended sentence', () => {
    // A tour career standing ON its birthday week, then hurt out of the game: the dialog would have
    // been next, and the epilogue deletes it – `pendingBirthday` is null behind a terminal latch and
    // `guardNotEndedForGood` throws before it is even asked. The ENDED sentence, never the college one.
    const world = createWorld('cb-ended', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 200 && pendingBirthday(world) === null; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
      if (pendingKnock(world)) decideKnock(world, 'rest')
    }
    expect(pendingBirthday(world), 'the fixture reached a birthday week').not.toBeNull()
    latchEnding(world, { type: 'injury', week: world.week, ageYears: 15, detail: 'the fixture', resumesWeek: null })
    expect(() => chooseGift(world, 'day')).toThrow(CAREER_ENDED_REFUSAL)
  })

  it('⚠ the early return stands down while a year is paused – and works again at the boundary', () => {
    const { world, rng } = openedAtCollege('cb-early-return', 6, 15)
    // Year 1 pauses on her birthday; a career with a banked year behind it is the precondition the
    // engine already checks, so spend year 1 first, then pause year 2.
    resumeFromCollege(world, rng) // pause in year 1
    answerBirthday(world)
    resumeFromCollege(world, rng) // year 1 banks
    resumeFromCollege(world, rng) // pause in year 2
    expect(world.college!.pendingYearStart, 'year 2 is mid-flight').not.toBeNull()
    answerBirthday(world)
    expect(() => endCollegeEarly(world), 'mid-year the door is shut, with the reason').toThrow(/still running/)
    expect(toSnapshot(world).ending?.college?.yearInProgress, 'and the screen is told to stand its button down').toBe(true)
    resumeFromCollege(world, rng) // year 2 banks – a boundary again
    expect(world.college!.pendingYearStart ?? null).toBeNull()
    expect(() => endCollegeEarly(world), 'at the boundary the early return works as it always did').not.toThrow()
    expect(world.ending, 'she is back on tour').toBeNull()
  })
})

// =================================================================================================
// ⭐⭐ 4. AN OLD SAVE – lived birthdays stay absent; only the week it is standing on can ask
// =================================================================================================
describe('a v56 save migrated mid-college is not retro-asked and not retro-billed', () => {
  const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

  it('⭐⭐ the golden v56 college save loads quietly: no dialogs, no rows, no charge', () => {
    const raw = JSON.parse(readFileSync(`${DIR}/v56.json`, 'utf8')) as { birthdays: unknown; fundsCents: number }
    const birthdaysBefore = JSON.stringify(raw.birthdays)
    const fundsBefore = raw.fundsCents
    const world = migrateSave(JSON.parse(readFileSync(`${DIR}/v56.json`, 'utf8')))
    expect(world.schemaVersion).toBe(57)
    expect((world.college as { pendingYearStart?: unknown }).pendingYearStart, 'the new field arrives null').toBeNull()
    expect(JSON.stringify(world.birthdays), 'not one row invented for a lived year').toBe(birthdaysBefore)
    expect(world.fundsCents, 'and not a cent moved – there is no gift billing to be retro about').toBe(fundsBefore)
    // This save rests at a year boundary that is NOT her birthday week (born 15.6, week 333), so the
    // shell comes up exactly as it did on v56: the college card, no dialog.
    expect(pendingBirthday(world), 'nothing is pending on load').toBeNull()
    expect(blockingOverlay(toSnapshot(world))).toBe('ending')
  })

  it('⭐ a v56-shaped save RESTING on a birthday boundary gets exactly one dialog – the present week\'s', () => {
    // Constructed as the state a v56 engine really produced: a boundary rest with the college
    // birthdays ABSENT (nobody was asked inside the freeze). The walk builds the boundary, then the
    // college-era rows are removed and the shape is stamped v56 – the honest simulation, since the
    // old engine cannot be run from here.
    const { world, rng } = openedAtCollege('probe-boundary', 2, 28)
    const forkWeek = world.week
    resumeFromCollege(world, rng)
    answerBirthday(world) // the new engine answers it; the v56 shape below un-answers it
    const asV56 = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    asV56.schemaVersion = 56
    delete (asV56.college as Record<string, unknown>).pendingYearStart
    asV56.birthdays = (asV56.birthdays as Array<{ week: number }>).filter((b) => b.week <= forkWeek)

    const migrated = migrateSave(asV56)
    // Exactly ONE question: the week the save is standing on – its own birthday, asked properly.
    expect(pendingBirthday(migrated), 'the resting week itself may ask').not.toBeNull()
    expect(migrated.week, 'and it is the current week, not a lived one').toBe(world.week)
    // The three-years-of-absent-rows stay absent: answering the present adds ONE row, at THIS week.
    chooseGift(migrated, 'day')
    const collegeRows = migrated.birthdays.filter((b) => b.week > forkWeek)
    expect(collegeRows, 'one row, the present week\'s – no retro-offers behind it').toHaveLength(1)
    expect(collegeRows[0].week).toBe(migrated.week)
    expect(pendingBirthday(migrated), 'and the question is spent').toBeNull()
  })
})
