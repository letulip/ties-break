// ⭐⭐⭐ ROUND 24 #5 – THE FORK MOVES OFF HER BIRTHDAY: ask / hold / depart.
//
// The owner: «В колледж она пошла ровно в день своего рождения, а должна была в начале учебного
// года», ruled in as «пункт 5 запускай как обсудили» (docs/plans/college-the-flow.md, rulings §3;
// the spec is docs/specs/college-departure-2026-08.md). One moment became three:
//
//   ASK     the fork is raised the week SCHOOL ENDS – `forkDue` reads `schoolIsOver`, so the ask
//           lands on `schoolEndWeek(birthMonth)` (242 for Jan–Aug births, 294 for Sep–Dec; age
//           18.0–18.9), not on her nineteenth birthday (weeks ≈261–309 under the old clock).
//   HOLD    the college answer RESERVES: the chosen quote is locked, `fork.departsWeek` is booked
//           (the next academic-year September – `nextAcademicYearStart`), and NOTHING freezes.
//           The gap year is her last junior season, played: entries, reveals, results, the whole
//           game, because every freeze gate reads `inCollege` and she is not in college yet.
//   DEPART  `resolveCollegeDeparture` (resolveEndings step 7c′) enrols her on the departure week:
//           `world.college` is built, B1's entry release fires THERE (full refund, past-deadline
//           exemption, desk letter, zero penalty – the release moved from the answer to the
//           departure on the owner's own ruling), and the college ending latches.
//
// ⚠ THE FACTS ARE PINNED, NOT THE STRINGS – the ask week is the school module's own number, the
// release is asserted through `RELEASE_LINE_PREFIX` and the refund ledger row, and the gap's life
// is a played tournament whose result stands.
//
// ⚠ RNG: the ask, the reservation and the departure draw NOTHING on any stream (the offer rides
// `seed:collegeoffer:<week>`, a sub-stream). The frozen MAIN capture (41550 / e6b0c709) is asserted
// untouched in tests/condition.test.ts, and the pairwise input-independence arms live in
// tests/ending.test.ts and tests/college-second-act.test.ts.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  skipTournament,
  collegeLeagueRevealOpen,
  createWorld,
  tickWeek,
  enterEvent,
  answerFork,
  chooseGift,
  pendingBirthday,
  resumeFromCollege,
  resolveCollegeDeparture,
  revealTournamentRound,
  closeTournament,
  inCollege,
  buildEndingView,
  toSnapshot,
  RELEASE_LINE_PREFIX,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { lookAheadFor, type CalendarWeekFacts } from '../src/composables/weekDays'
import { nextAcademicYearStart, schoolEndWeek } from '../src/engine/kidLife'
import { kidAgeYears } from '../src/engine/world/age'
import { resumeMain, type Rng } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ENDINGS } from '../src/engine/ending'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

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


function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** An ORGANIC career walked to the fork – no hand-opened fork, no forced week: the ask below is the
 *  engine's own. Reveals are closed on the way (`tickWeek` is total; only `advanceWeeks` halts). */
function walkedToTheFork(seed: string, birthMonth: number): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth })
  const rng = resumeMain(world.rngMain)
  // Held solvent so the walk is decided by the CALENDAR, not by a bankruptcy before the fork – the
  // one thumb on the scale every college suite puts there.
  for (let i = 0; i < 6 * WEEKS_PER_YEAR && world.fork === null && world.ending === null; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.fork, 'the career reached the fork by playing').not.toBeNull()
  return { world, rng }
}

/** The latest entry the engine will take inside a play-week window. Nothing is forced: a week the
 *  rulebook refuses is skipped, exactly as the other college suites book. */
function bookBetween(world: WorldState, fromWeek: number, toWeek: number): string | null {
  const cand = world.season
    .filter((e) => e.week > world.week && e.week >= fromWeek && e.week <= toWeek && world.week <= e.deadlineWeek)
    .sort((a, b) => b.week - a.week)
  for (const e of cand) {
    try {
      enterEvent(world, e.id)
      return e.id
    } catch {
      // her rank or her purse refuses this rung – try the next one down
    }
  }
  return null
}

// =================================================================================================
// 1 + 2. THE THREE MOMENTS, ON A WALKED CAREER – and the gap is genuinely playable
// =================================================================================================
describe('the three moments, on a career that reaches the fork by playing', () => {
  it('⭐⭐⭐ ask at school\'s end, hold with the game alive, depart on the academic September – release included', () => {
    const { world, rng } = walkedToTheFork('r24-d2-moments', 6)

    // --- THE ASK: school's end, not her birthday --------------------------------------------------
    expect(world.fork!.askedWeek, 'asked the week school ends').toBe(schoolEndWeek(6))
    expect(kidAgeYears(world.fork!.askedWeek, 6, 15), 'she is eighteen on the card').toBe(18)
    expect(
      world.events.some((e) => e.week === world.fork!.askedWeek && e.text.startsWith('School is over.')),
      'the milestone names the moment that raises it',
    ).toBe(true)

    // --- THE ANSWER RESERVES ----------------------------------------------------------------------
    answerFork(world, 'college')
    const departs = world.fork!.departsWeek!
    expect(departs, 'the next academic-year September, strictly after the ask').toBe(nextAcademicYearStart(world.week))
    expect(departs, '...which is exactly one year for an ask that lands ON a September').toBe(schoolEndWeek(6) + WEEKS_PER_YEAR)
    expect(world.college, 'the hold: reserved, not enrolled').toBeNull()
    expect(world.ending, 'and nothing ended').toBeNull()
    expect(inCollege(world)).toBe(false)
    expect(toSnapshot(world).collegeDepartsWeek, 'the departure is on the wire for the calendar').toBe(departs)

    // --- THE GAP IS PLAYED: an entry made after the answer, scheduled before September ------------
    const playedId = bookBetween(world, world.week + 2, world.week + 10)
    expect(playedId, 'the gap accepts an entry – the game is alive').not.toBeNull()
    const playedEvent = world.season.find((e) => e.id === playedId)!
    while (world.week < playedEvent.week) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    finishAnyReveal(world)
    expect(world.ending, 'playing the gap ends nothing').toBeNull()
    // `finalizeTournament` is the only writer of a 'tournament' event (the v28 migration's own
    // anchor), so a row at the played week IS the run having really resolved – and it stays: no
    // release, no refund, the result stands.
    expect(
      world.events.some((e) => e.week === playedEvent.week && e.type === 'tournament'),
      'the tournament was played and its result STANDS',
    ).toBe(true)
    expect(world.entries.includes(playedId!), 'a played entry is consumed, never refunded').toBe(false)
    expect(
      world.events.some((ev) => ev.week === playedEvent.week && ev.type === 'income' && ev.text === `Entry refunded: ${TIERS[playedEvent.tier].label}`),
      'and no refund row appears for it',
    ).toBe(false)

    // --- THE DEPARTURE: enrolment, and B1's release fires THERE -----------------------------------
    // Book an entry that will still be outstanding when she leaves (play week past the departure).
    while (world.week < departs - 4) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    const strandedId = bookBetween(world, departs, departs + 4)
    expect(strandedId, 'an entry can be booked right up to the departure').not.toBeNull()
    const strandedEvent = world.season.find((e) => e.id === strandedId)!
    const fee = TIERS[strandedEvent.tier].entryFeeCents
    const penaltiesBefore = world.penalties.length

    for (let i = 0; i < 8 && world.ending === null; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }

    expect(world.ending?.type, 'the college ending latches at the departure').toBe('college')
    expect(world.ending!.week, 'on the departure week itself').toBe(departs)
    expect(world.ending!.resumesWeek, 'one year at a time, from the departure').toBe(departs + WEEKS_PER_YEAR)
    expect(world.college!.fromWeek, 'enrolment is the departure week').toBe(departs)
    expect(world.college!.untilWeek, 'the whole course runs from there').toBe(departs + ENDINGS.collegeYears * WEEKS_PER_YEAR)
    expect(inCollege(world)).toBe(true)

    // B1's release, asserted with his own predicates: entries empty, the refund row carries the
    // whole fee, the desk letter speaks in the desk's voice, and nothing is punished.
    expect(world.entries, 'nothing outlives the departure').toHaveLength(0)
    const refunds = world.events.filter(
      (e) => e.week === departs && e.type === 'income' && e.text === `Entry refunded: ${TIERS[strandedEvent.tier].label}`,
    )
    expect(refunds, 'one full-refund row, at the departure week').toHaveLength(1)
    expect(refunds[0].amountCents, 'the whole fee, not a forfeit and not a part of one').toBe(fee)
    const released = world.events.filter((e) => e.week === departs && e.type === 'entry')
    expect(released.length, 'the release is on the record').toBeGreaterThan(0)
    for (const row of released) {
      expect(row.text.startsWith(RELEASE_LINE_PREFIX.college), row.text).toBe(true)
      expect(row.text.startsWith(RELEASE_LINE_PREFIX.parent), 'nobody tells him HE withdrew her').toBe(false)
    }
    expect(world.penalties, '«мы ни за что не наказываем» – no points, no suspension').toHaveLength(penaltiesBefore)

    // ...and the reservation stops being marked once it is honoured.
    expect(toSnapshot(world).collegeDepartsWeek, 'the marker leaves the wire at enrolment').toBeNull()
  }, 120_000)
})

// =================================================================================================
// 3. A TERMINAL ENDING IN THE GAP VOIDS THE RESERVATION
// =================================================================================================
describe('a terminal ending in the gap', () => {
  it('⭐⭐ bankruptcy before September: she never departs, and the epilogue shows no college', () => {
    const { world, rng } = walkedToTheFork('r24-d2-void', 6)
    answerFork(world, 'college')
    const departs = world.fork!.departsWeek!

    // The family goes under early in the gap: a hole no weekly income can climb out of, held for
    // the whole grace window. 7b latches bankruptcy ABOVE the departure step by construction.
    world.fundsCents = -5_000_000_00
    for (let i = 0; i < ENDINGS.bankruptcyGraceWeeks + 2 && world.ending === null; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
      world.fundsCents = Math.min(world.fundsCents, -5_000_000_00)
    }
    expect(world.ending?.type, 'the career ended in the gap').toBe('bankruptcy')
    expect(world.ending!.week, 'before the departure ever came').toBeLessThan(departs)
    expect(world.college, 'she never departed').toBeNull()

    // The reservation is VOID, not dormant: ticking past the booked September resurrects nothing.
    // (`tickWeek` is total by design – `replayMainState` re-ticks ended worlds – so this is the
    // exact path a resurrect bug would use.)
    while (world.week < departs + 4) tickWeek(world, rng)
    expect(world.college, 'the booked September came and went – still no college').toBeNull()
    expect(world.ending?.type, 'and the latched ending was never overwritten').toBe('bankruptcy')

    // The epilogue does not show a college she never attended.
    const view = buildEndingView(world)!
    expect(view.ending.type).toBe('bankruptcy')
    expect(view.college, 'no open college question on the epilogue').toBeNull()
    expect(toSnapshot(world).collegeDepartsWeek, 'and no departure marker either').toBeNull()

    // Direct call too – the guard is on the function, not only on its caller's ordering.
    resolveCollegeDeparture(world)
    expect(world.college, 'the departure refuses to run behind a latched ending').toBeNull()
  }, 120_000)
})

// =================================================================================================
// 4. TODAY'S SAVES – answered college, already latched – continue exactly as they do now
// =================================================================================================
describe('a v57 save already inside the freeze', () => {
  it('⭐ migrates with departsWeek null, never consults it, and spends its next year unchanged', () => {
    const raw = JSON.parse(readFileSync(new URL('./fixtures/saves/v57.json', import.meta.url), 'utf8')) as unknown
    const world = migrateSave(raw)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(world.fork!.answer, 'the fixture is an answered college career').toBe('college')
    expect(world.fork!.departsWeek, 'the v58 migration writes the explicit null – nothing invented').toBeNull()
    expect(world.college, 'already enrolled under the birthday-era clock').not.toBeNull()
    const collegeBefore = JSON.stringify(world.college)

    // The departure step is inert behind an enrolment – nothing about the redesign touches it.
    resolveCollegeDeparture(world)
    expect(JSON.stringify(world.college), 'byte-for-byte inert').toBe(collegeBefore)

    // ...and the freeze machinery it lives under still works: the next year spends exactly as now.
    const rng = resumeMain(world.rngMain)
    const yearsBefore = world.college!.years.length
    const from = world.week
    for (let press = 0; press < 4 && world.college!.years.length === yearsBefore; press++) {
      resumeFromCollege(world, rng)
      answerLeagueReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.college!.years.length, 'one more year banked').toBe(yearsBefore + 1)
    expect(world.week, 'exactly fifty-two weeks later').toBe(from + WEEKS_PER_YEAR)
  }, 90_000)
})

// =================================================================================================
// 4b. THE CALENDAR CARRIES THE DEPARTURE – the look-ahead's own marker idiom, no new art
// =================================================================================================
describe('the look-ahead marks the departure week', () => {
  /** The same minimal fact bag every weekDays case builds – the composable's optional-field
   *  contract is exactly for fixtures like this one. */
  const facts = (over: Partial<CalendarWeekFacts>): CalendarWeekFacts =>
    ({
      week: 100,
      plan: { train: 3, rest: 2, school: 2 },
      profile: { ...DEFAULT_PROFILE },
      injury: null,
      knock: null,
      vacations: [],
      practices: [],
      upcoming: [],
      arrival: null,
      pending: null,
      ...over,
    }) as CalendarWeekFacts

  it('⭐ a booked departure inside the window is a row of its own kind, and an unbooked one is not', () => {
    const rows = lookAheadFor(facts({ collegeDepartsWeek: 105 }))
    const marked = rows.find((r) => r.week === 105)
    expect(marked, 'the departure week is in the seven-week window').toBeDefined()
    expect(marked!.kind, 'the week identity the family cannot rebook').toBe('college')
    expect(marked!.note).toBe('Leaves for college')
    expect(rows.filter((r) => r.kind === 'college'), 'exactly one week is the departure').toHaveLength(1)

    const unbooked = lookAheadFor(facts({ collegeDepartsWeek: null }))
    expect(unbooked.every((r) => r.kind !== 'college'), 'no reservation, no marker').toBe(true)
  })
})

// =================================================================================================
// 5. THE LEAGUE FLOOR AND THE BIRTHDAY PAUSE HOLD ACROSS DEPARTURE ALIGNMENTS
// =================================================================================================
describe('G1\'s floor and E3\'s pause survive the new enrolment week', () => {
  // ⚠ TWO BIRTH MONTHS, TWO DEPARTURES: June (ask 242, departs 294) and October (ask 294, departs
  // 346). Both walked organically through the ask, the gap and all four years – the League floor is
  // arithmetic over 52 consecutive ticked weeks and E3's pause reads her real birthday, so both
  // must hold wherever the September lands.
  for (const [bm, ask, departs] of [
    [6, 242, 294],
    [10, 294, 346],
  ] as const) {
    it(`⭐⭐ birth month ${bm}: ask ${ask}, depart ${departs}, four years with a championship and a cake in each`, () => {
      const { world, rng } = walkedToTheFork(`r24-d2-align-${bm}`, bm)
      expect(world.fork!.askedWeek).toBe(ask)
      expect(schoolEndWeek(bm)).toBe(ask)
      answerFork(world, 'college')
      expect(world.fork!.departsWeek).toBe(departs)
      for (let i = 0; i < WEEKS_PER_YEAR + 4 && world.ending === null; i++) {
        world.fundsCents = Math.max(world.fundsCents, 500_000_00)
        tickWeek(world, rng)
        finishAnyReveal(world)
      }
      expect(world.college?.fromWeek).toBe(departs)

      const birthdaysBefore = world.birthdays.length
      for (let press = 0; press < 4 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
        world.fundsCents = Math.max(world.fundsCents, 500_000_00)
        resumeFromCollege(world, rng)
        answerLeagueReveal(world)
        if (pendingBirthday(world) !== null) chooseGift(world, 'day')
      }

      // G1's floor: every full year holds its championship – enrolment at offset 34 puts the League
      // (season week 12) at week 30 of every academic year, two weeks before the call-up it feeds.
      expect(world.college!.years, 'the whole course was lived').toHaveLength(ENDINGS.collegeYears)
      for (const [i, year] of world.college!.years.entries()) {
        expect(year.untilWeek - year.fromWeek, `year ${i + 1} is a full year`).toBe(WEEKS_PER_YEAR)
        expect(year.league, `year ${i + 1} holds its guaranteed championship`).not.toBeNull()
        expect(year.league!.week % WEEKS_PER_YEAR, 'played on the League\'s own season week').toBe(12)
      }
      // E3's pause: her birthday happened INSIDE the freeze, every year – answered, on the record.
      const inFreeze = world.birthdays.slice(birthdaysBefore).filter((b) => b.week > departs && b.week <= departs + 4 * WEEKS_PER_YEAR)
      expect(inFreeze.length, 'four college birthdays, one per year, all answered').toBe(4)
    }, 240_000)
  }
})
