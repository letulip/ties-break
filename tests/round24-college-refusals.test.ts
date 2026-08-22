// ⭐⭐⭐ ROUND 24, E2 – WHAT A REFUSED COMMAND SAYS TO A PARENT WHOSE DAUGHTER IS AT UNIVERSITY.
//
// ⚠⚠ THE BREAKAGE THIS NETS IS NEWLY REACHABLE, NOT OLD. College is implemented as an ENDING that
// can be resumed, so `guardNotEnded` has refused every mutating command through the four years since
// W2-ENDINGS shipped. Until D1's shell (c473258) the epilogue REPLACED the app, so not one of those
// controls could be pressed. Now the tab bar is live underneath the freeze and every one of them is
// one tap away – and every one of them told a nineteen-year-old at university that her career had
// ended. Nothing corrupted (the refusal is engine-side and total); the sentence was simply false.
//
// WHAT THE ROUND CHANGED, AND THIS FILE HOLDS:
//   1. THE SENTENCE. `guardNotEnded` names WHICH latch it hit – `COLLEGE_FREEZE_REFUSAL` while the
//      career is frozen, `CAREER_ENDED_REFUSAL` behind a latch that never comes off.
//   2. THE TWO OPENINGS. `cancelVacation` / `cancelPractice` take `guardNotEndedForGood`, so a
//      family may take back a booking it made before the fork. Everything else stays refused – the
//      audit is in the wave report and the reasons are beside each guard.
//   3. THE TERMINAL LATCH IS UNTOUCHED. All five real endings still refuse everything, including
//      the two that opened, with the sentence they always used.
//
// ⚠ AGAINST A WALKED WORLD, NEVER A HAND-BUILT ONE. Every career below really plays sixty weeks,
// really answers the fork and really spends a college year through `resumeFromCollege`. A probe
// world with `ending` assigned by hand would prove the guard reads a field, which is not the claim.
//
// ⚠ AND THE SPELLINGS ARE IMPORTED, NOT TYPED. Both sentences are player-facing copy that reaches a
// toast through the worker's error channel; a literal copied into a test is a rename that breaks a
// report in silence. Same precedent as `RELEASE_LINE_PREFIX` and `COLLEGE_REVEAL_REFUSAL`.
import { describe, it, expect } from 'vitest'
import {
  CAREER_ENDED_REFUSAL,
  COLLEGE_FREEZE_REFUSAL,
  acceptOffer,
  answerFork,
  answerRetirement,
  bookPractice,
  bookVacation,
  cancelEntry,
  cancelPractice,
  cancelVacation,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  declineOffer,
  enterEvent,
  guardNotEnded,
  guardNotEndedForGood,
  hireCoach,
  inCollege,
  latchEnding,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  setCoachOnEventWeeks,
  setCoachOnJuniorEvents,
  setKitGrade,
  skipEvent,
  tickWeek,
  withdrawEvent,
  type WorldState,
} from '../src/engine/world'
import { resumeMain, type Rng } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CareerEndingType } from '../src/shared/protocol'

// =================================================================================================
// The walked career – the same shape tests/college-freeze.test.ts uses, for the same reason
// =================================================================================================

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** A career that has really been played: a calendar, a cohort, a ledger and a table with points on
 *  it. `tickWeek` is total (only `advanceWeeks` halts), so the loop closes any reveal it makes. */
function playedCareer(seed: string, weeks: number): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  return { world, rng }
}

/** ⚠ THE ONE THUMB ON THE SCALE, AND IT IS THE ONE college-freeze.test.ts ALREADY PUTS THERE. Four
 *  college years is 208 weeks of base costs; a career that went bankrupt halfway through would be
 *  measuring the family budget instead of the guard. Zero RNG implications – `resolveBaseCosts`
 *  draws its three whatever the balance is. */
function openTheFork(world: WorldState): void {
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: null }
}

/** Walk, answer «college», and really spend a year of it. Returns the world sitting INSIDE the
 *  freeze with one year banked – the exact state a player is in when he taps the coach's card.
 *
 *  ⚠ RE-AIMED BY THE COLLEGE BIRTHDAY (round 24, «да, день рождения делай»), NOT WEAKENED: the year
 *  now PAUSES on her birthday week so the gift dialog can be answered, so spending a year is
 *  press-answer-press rather than one press – exactly what the Home shell's button does. The state
 *  handed back is the same one as before: latched at a boundary, one year banked. */
function careerAtCollege(seed: string): { world: WorldState; rng: Rng } {
  const { world, rng } = playedCareer(seed, 60)
  openTheFork(world)
  answerFork(world, 'college')
  for (let press = 0; press < 4 && world.college!.years.length === 0; press++) {
    resumeFromCollege(world, rng)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  expect(world.ending?.type, 'the latch is back on with the next year under it').toBe('college')
  expect(inCollege(world), 'and she really is at a university this week').toBe(true)
  expect(world.college!.years.length, 'a year really was spent, not skipped over').toBe(1)
  return { world, rng }
}

/** The first future week in `[from, to)` that the planner will actually take, booked through the
 *  engine's own gate. ⚠ NOTHING IS FORCED: a week written past a refusal would be our fiction, so a
 *  week the rulebook turns down is skipped rather than pushed onto `world.vacations` by hand. */
function bookableWeek(world: WorldState, kind: 'vacation' | 'practice', from: number, to: number): number | null {
  for (let w = from; w < to; w++) {
    try {
      if (kind === 'vacation') bookVacation(world, w, 'grandma')
      else bookPractice(world, w, false)
      return w
    } catch {
      // exams, the off-season, an entry, another booking, her body – try the next week
    }
  }
  return null
}

/** A career at college that carries the two bookings its family made BEFORE the fork, both on weeks
 *  in year TWO – far enough out that the year this walk really spends cannot consume them first.
 *  This is the save a player actually has when he opens the Season screen at university. */
function careerAtCollegeWithBookings(seed: string): { world: WorldState; vacWeek: number; pracWeek: number } {
  const { world, rng } = playedCareer(seed, 60)
  openTheFork(world)
  const vacWeek = bookableWeek(world, 'vacation', world.week + 60, world.week + 95)
  const pracWeek = bookableWeek(world, 'practice', world.week + 60, world.week + 95)
  expect(vacWeek, 'the fixture needs a bookable holiday week in year two').not.toBeNull()
  expect(pracWeek, 'the fixture needs a bookable practice week in year two').not.toBeNull()

  answerFork(world, 'college')
  // ⚠ Press-answer-press, exactly as `careerAtCollege` above – the year pauses for her birthday now.
  for (let press = 0; press < 4 && world.college!.years.length === 0; press++) {
    resumeFromCollege(world, rng)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  expect(world.ending?.type).toBe('college')
  // ⚠ AND BOTH SURVIVED THE YEAR – `prunePlannerBookings` keeps four trailing weeks, and these are
  // still ahead of her. If this ever goes false the test below is measuring nothing.
  expect(world.vacations.some((v) => v.week === vacWeek), 'the holiday is still on the calendar').toBe(true)
  expect(world.practices.some((p) => p.week === pracWeek), 'and so is the court').toBe(true)
  return { world, vacWeek: vacWeek!, pracWeek: pracWeek! }
}

/** Every mutating command that STAYS refused at college, called with arguments that would be
 *  rejected on their own merits a line later – the guard is first in every one of these bodies, so
 *  what comes back is the guard's sentence and nothing else.
 *
 *  ⚠ RE-AIMED BY THE COLLEGE BIRTHDAY (round 24, «да, день рождения делай»), NOT WEAKENED:
 *  `chooseGift` LEFT the college half of this list – it takes `guardNotEndedForGood` now, the third
 *  member of the short list, because the year pauses on her birthday week and the answer has to land
 *  while the latch is on. It is still in the TERMINAL half (`kind: 'ended'`): a career that has
 *  really ended refuses it with the unchanged sentence, which section 3 walks. Its college-side
 *  behaviour – refusing on its OWN rule on a week with no birthday – has its own case below, the
 *  same shape the two cancels' own-rules case takes.
 *
 *  ⚠ THE WORKER'S TWO INLINE SITES ARE THE LAST ROW. `setPlan` and `setPhysio` call `guardNotEnded`
 *  in the handler body rather than in an engine command, so the direct call IS what they run. */
function refusedCommands(world: WorldState, kind: 'college' | 'ended' = 'college'): Array<[string, () => unknown]> {
  const anyEvent = world.season[0]?.id ?? 'no-such-event'
  return [
    ['enterEvent', () => enterEvent(world, anyEvent)],
    ['withdrawEvent', () => withdrawEvent(world, anyEvent)],
    ['cancelEntry', () => cancelEntry(world, anyEvent)],
    ['skipEvent', () => skipEvent(world, anyEvent)],
    ...(kind === 'ended' ? ([['chooseGift', () => chooseGift(world, 'day-together')]] as Array<[string, () => unknown]>) : []),
    ['hireCoach', () => hireCoach(world, null)],
    ['setCoachOnEventWeeks', () => setCoachOnEventWeeks(world, true)],
    ['setCoachOnJuniorEvents', () => setCoachOnJuniorEvents(world, true)],
    ['answerFork', () => answerFork(world, 'continue')],
    ['answerRetirement', () => answerRetirement(world, false)],
    ['setKitGrade', () => setKitGrade(world, 'frame', 'pro')],
    ['decideKnock', () => decideKnock(world, 'rest')],
    ['bookVacation', () => bookVacation(world, world.week + 12, 'grandma')],
    ['bookPractice', () => bookPractice(world, world.week + 12, false)],
    ['acceptOffer', () => acceptOffer(world, 'no-such-offer')],
    ['declineOffer', () => declineOffer(world, 'no-such-offer')],
    ['guardNotEnded (setPlan / setPhysio, inline in the worker)', () => guardNotEnded(world)],
  ]
}

// =================================================================================================
// ⭐⭐ 1. THE SENTENCE A PARENT AT COLLEGE ACTUALLY READS
// =================================================================================================
describe('a refused command at college says where she is', () => {
  it('⭐⭐⭐ every still-refused command names the FREEZE, and none of them says the career has ended', () => {
    const { world } = careerAtCollege('e2-sentence')
    for (const [name, run] of refusedCommands(world)) {
      expect(run, `${name} still refuses`).toThrow(COLLEGE_FREEZE_REFUSAL)
      // ⚠ THE NEGATIVE IS THE ITEM. "It refuses" was always true; what was broken is WHAT it said.
      expect(run, `${name} does not tell a girl at university her career is over`).not.toThrow(
        CAREER_ENDED_REFUSAL,
      )
    }
  })

  it('the sentence is true on its face: alive, at a university, and it resumes', () => {
    const { world } = careerAtCollege('e2-truth')
    expect(world.ending!.resumesWeek, 'the freeze has an end date on the ending itself').not.toBeNull()
    expect(world.ending!.resumesWeek! > world.week, 'and it is in the future').toBe(true)
    // House law, checked here rather than trusted: short dash only, no Cyrillic in player copy.
    expect(COLLEGE_FREEZE_REFUSAL).not.toMatch(/—/)
    expect(COLLEGE_FREEZE_REFUSAL).not.toMatch(/[Ѐ-ӿ]/)
    expect(CAREER_ENDED_REFUSAL).not.toMatch(/[Ѐ-ӿ]/)
  })

  it('⚠ THE REFUSAL DRAWS NOTHING – sixteen of them do not move the MAIN stream', () => {
    const { world } = careerAtCollege('e2-rng')
    const before = { ...world.rngMain }
    const fundsBefore = world.fundsCents
    const eventsBefore = world.events.length
    for (const [, run] of refusedCommands(world)) expect(run).toThrow()
    expect(world.rngMain, 'a refusal is not a draw').toEqual(before)
    expect(world.fundsCents, 'and it spends nothing').toBe(fundsBefore)
    expect(world.events.length, 'and it writes no row').toBe(eventsBefore)
  })
})

// =================================================================================================
// ⭐⭐ 2. THE TWO THAT OPENED – the family's own calendar
// =================================================================================================
//
// ⚠ WHY THESE TWO AND NOT THE BOOKINGS. `resolveVacation` and `resolvePractice` sit in `tickWeek`
// with NO `inCollege` gate around them, unlike the academy, the sponsors, the gear, the knock and
// the birthday. So a booking made before the fork is really honoured inside the freeze – inside a
// call that spends fifty-two weeks in one click – and until this round the parent could not take it
// back. The first test below proves the trap is real rather than asserting it.
describe('the family may take back a booking it made before the fork', () => {
  it('⚠ THE TRAP IS REAL: a practice booked before the fork is really PLAYED inside the freeze', () => {
    const { world, rng } = playedCareer('e2-trap', 60)
    openTheFork(world)
    const week = bookableWeek(world, 'practice', world.week + 6, world.week + 30)
    expect(week, 'the fixture needs a bookable week inside year one').not.toBeNull()

    answerFork(world, 'college')
    // ⚠ Press-answer-press (round 24): the year pauses on her birthday, which can land before the
    // booked court – the whole year has to be spent for the trap to be provably real.
    for (let press = 0; press < 4 && world.college!.years.length === 0; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }

    // The friendly's own record, keyed by the week it was booked for – `resolvePractice` writes it.
    expect(
      world.events.some((e) => e.match?.eventId === `practice-w${week}`),
      'the freeze played the match the family booked, with nobody watching',
    ).toBe(true)
  })

  it('⭐⭐⭐ cancelVacation works at college, refunds in full, and leaves the week free', () => {
    const { world, vacWeek } = careerAtCollegeWithBookings('e2-cancel-vac')
    const paid = world.vacations.find((v) => v.week === vacWeek)!.paidCents
    expect(paid, 'grandma has a price floor, so there is a refund to measure').toBeGreaterThan(0)
    const funds = world.fundsCents

    expect(() => cancelVacation(world, vacWeek)).not.toThrow()
    expect(world.vacations.some((v) => v.week === vacWeek), 'the week is free again').toBe(false)
    expect(world.fundsCents - funds, 'and the money came back in full').toBe(paid)
  })

  it('⭐⭐⭐ cancelPractice works at college, and the court fee comes back', () => {
    const { world, pracWeek } = careerAtCollegeWithBookings('e2-cancel-prac')
    const paid = world.practices.find((p) => p.week === pracWeek)!.paidCents
    const funds = world.fundsCents

    expect(() => cancelPractice(world, pracWeek)).not.toThrow()
    expect(world.practices.some((p) => p.week === pracWeek), 'the court is given up').toBe(false)
    expect(world.fundsCents - funds, 'full refund, the same one a tour week gets').toBe(paid)
  })

  it('⭐ ROUND 24: chooseGift passed the freeze too – and refuses on its OWN rule on an ordinary week', () => {
    // The third member of the short list (the college birthday, «да, день рождения делай»). At a
    // year boundary that is not her birthday week the guard lets it through and the command's own
    // re-validation speaks – never the freeze sentence, and never the ended one. The answering path
    // itself – a birthday week inside the freeze, answered with the latch on – is walked in
    // tests/college-birthday.test.ts.
    const { world } = careerAtCollege('e2-gift-rules')
    expect(pendingBirthday(world), 'the fixture rests on an ordinary week').toBeNull()
    expect(() => chooseGift(world, 'day')).toThrow('There is no birthday to answer this week')
    expect(() => chooseGift(world, 'day'), 'and it does not call the career frozen').not.toThrow(COLLEGE_FREEZE_REFUSAL)
  })

  it('a cancel at college still refuses on its OWN rules – the guard is the only thing that moved', () => {
    const { world } = careerAtCollege('e2-cancel-rules')
    expect(() => cancelVacation(world, world.week + 30)).toThrow('No vacation booked that week')
    expect(() => cancelPractice(world, world.week + 30)).toThrow('No practice match booked that week')
    world.vacations.push({ week: world.week, packageId: 'grandma', paidCents: 100 })
    expect(
      () => cancelVacation(world, world.week),
      'a week already under way is still past taking back',
    ).toThrow('already started')
  })

  it('⚠ the cancels draw nothing either', () => {
    const { world, vacWeek, pracWeek } = careerAtCollegeWithBookings('e2-cancel-rng')
    const before = { ...world.rngMain }
    cancelVacation(world, vacWeek)
    cancelPractice(world, pracWeek)
    expect(world.rngMain, 'state removal plus ledger rows – no stream is touched').toEqual(before)
  })
})

// =================================================================================================
// ⚠⚠ 3. THE GUARD OVER WHAT WAS NOT MEANT TO MOVE – a career that really ended
// =================================================================================================
const TERMINAL: CareerEndingType[] = ['stopped', 'bankruptcy', 'injury', 'natural', 'plateau']

describe('a career that has really ended still hears that it has ended', () => {
  it('⭐⭐⭐ all five terminal endings refuse EVERY command with the unchanged sentence', () => {
    for (const type of TERMINAL) {
      const { world } = playedCareer(`e2-end-${type}`, 40)
      latchEnding(world, {
        type,
        week: world.week,
        ageYears: 19,
        detail: 'the fixture',
        resumesWeek: null, // ⚠ the five that do not resume – college is the only one that does
      })
      for (const [name, run] of refusedCommands(world, 'ended')) {
        expect(run, `${type}/${name} refuses`).toThrow(CAREER_ENDED_REFUSAL)
        expect(run, `${type}/${name} is not told she is at college`).not.toThrow(COLLEGE_FREEZE_REFUSAL)
      }
      // ⚠⚠ AND THE TWO THAT OPENED ARE STILL SHUT HERE. This is the whole point of a second guard
      // rather than a deleted one: `guardNotEndedForGood` lets the FREEZE through and nothing else.
      world.vacations.push({ week: world.week + 10, packageId: 'grandma', paidCents: 100 })
      world.practices.push({ week: world.week + 11, paidCents: 100, withCoach: false })
      expect(() => cancelVacation(world, world.week + 10), `${type}: cancelVacation`).toThrow(CAREER_ENDED_REFUSAL)
      expect(() => cancelPractice(world, world.week + 11), `${type}: cancelPractice`).toThrow(CAREER_ENDED_REFUSAL)
      expect(() => guardNotEndedForGood(world), `${type}: the guard itself`).toThrow(CAREER_ENDED_REFUSAL)
    }
  })

  it('⭐ the WALKED terminal answer – «стоп» at the fork – refuses exactly the same way', () => {
    const { world } = playedCareer('e2-walked-stop', 60)
    openTheFork(world)
    answerFork(world, 'stop')
    expect(world.ending?.type, 'a real ending latched by a real answer').toBe('stopped')
    expect(world.ending!.resumesWeek, 'and it does not come back').toBeNull()
    expect(() => hireCoach(world, null)).toThrow(CAREER_ENDED_REFUSAL)
    expect(() => guardNotEndedForGood(world)).toThrow(CAREER_ENDED_REFUSAL)
  })

  it('⚠ AND A CAREER-ENDING INJURY INSIDE THE FREEZE GOES BACK TO SAYING "ended"', () => {
    // The half-predicate is `ending.type`, not `inCollege`, and this is the week they part: a girl
    // hurt out of the game at university is finished, and the guard must stop calling that a freeze.
    const { world } = careerAtCollege('e2-hurt-at-college')
    expect(() => hireCoach(world, null), 'frozen a moment ago').toThrow(COLLEGE_FREEZE_REFUSAL)
    latchEnding(world, { type: 'injury', week: world.week, ageYears: 20, detail: 'the fixture', resumesWeek: null })
    expect(inCollege(world), 'she is still enrolled this week – the college row has not moved').toBe(true)
    expect(() => hireCoach(world, null), 'and the sentence is the true one now').toThrow(CAREER_ENDED_REFUSAL)
  })

  it('a live career refuses nothing – the guard is inert with no latch on', () => {
    const { world } = playedCareer('e2-live', 30)
    expect(world.ending).toBeNull()
    expect(() => guardNotEnded(world)).not.toThrow()
    expect(() => guardNotEndedForGood(world)).not.toThrow()
  })
})
