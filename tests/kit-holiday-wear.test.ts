// ROUND-29 #20 – A VACATION PAUSES THE WEAR CLOCK. The owner's ruling 5 of 09.08, asked four times.
//
// His words, and they are the entire specification: «Ну да, занятий же нет, по-моему логично» – there
// are no sessions, so the kit is not being used. Round-15 #14 wrote it down as "wear should count
// weeks she trained or played", round-16 #8 re-asked it, the round-29 audit found `equipment.ts` still
// carried no vacation term at all, and he confirmed it this week: «вот это важно, да».
//
// ⚠⚠ WHY THIS FILE TICKS A REAL CAREER INSTEAD OF PROBING THE PURE FUNCTION. He reports from a
// running build, and a source grep proves nothing – the previous three askings all ended with the
// ruling written down and no code. Every number below is read off a WORLD THAT HAS BEEN TICKED, never
// off a constant, and the two arms are the same career with and without a booked holiday.
//
// ⭐ AND THE SECOND HALF IS THE GUARD AGAINST THE OBVIOUS OVER-REACH: a TRAINING week is a week she
// plays. Only the booked family holiday is «занятий нет». The third `describe` below pins that, and it
// is the mistake this change invites – "she has no tournament this week" is not "she is on holiday".
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  bookVacation,
  tickWeek,
  kitLineViews,
  recordGearRestWeek,
  goodWeeksFor,
  GEAR_REST_WINDOW,
  type WorldState,
} from '../src/engine/world'
import { kitAgeWeeks, DEFAULT_KIT_GRADES } from '../src/engine/equipment'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type FamilyBackground, type KitLine } from '../src/shared/protocol'

const BG: FamilyBackground = 'middle'
/** The length of the holiday under test – a fortnight plus a week, so "exactly the holiday's weeks"
 *  is a number bigger than any off-by-one could produce by accident. */
const HOLIDAY = 3
/** The two lines whose service life is long enough to hold a three-week holiday. Strings run a 3-week
 *  cadence for this background, so their span is not always wide enough to contain one – they are
 *  covered by the pure arithmetic, not by this career. */
const LONG_LINES: readonly KitLine[] = ['frame', 'shoes']

/** `bookVacation` refuses an exam week, and the off-season tail is worth avoiding for readability. */
function bookable(week: number): boolean {
  const offset = week % 52
  return offset < 49 && !(offset >= 24 && offset <= 25)
}

/** Build the career, book the holidays it is given, and TICK IT to `to`. Everything asserted below is
 *  read out of the world this returns. `staycation` is the free package (`priceCents: [0, 0]`), so the
 *  holiday arm does not even differ from the plain arm on the money paper trail. */
function careerTo(seed: string, to: number, holidays: readonly number[] = []): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: BG })
  for (const h of holidays) bookVacation(world, h, 'staycation')
  const rng = rngFromSeed(world.seed)
  while (world.week < to) tickWeek(world, rng)
  return world
}

/** What the Money screen prints as "(N left)" for one line – `goodWeeksFor(rung) - the line's age`, so
 *  it IS the remaining service life and it is the number the owner reads. */
function weeksLeft(world: WorldState, line: KitLine): number {
  const view = kitLineViews(world).find((v) => v.line === line)
  if (!view) throw new Error(`no view for ${line}`)
  // null means a signed kit deal is holding the line under the Worn edge and nothing is counting
  // down. These careers sign nothing, so a null here is a broken fixture rather than a soft answer.
  if (view.goodWeeksLeft === null) throw new Error(`${line} is capped by a deal – fixture no longer isolates wear`)
  return view.goodWeeksLeft
}

/** A week to read at, chosen so the holiday genuinely falls INSIDE the span the wear curve walks AND
 *  the countdown is still live at both ends of the comparison.
 *
 *  ⚠ THIS IS SCAFFOLDING, NOT THE MEASUREMENT. The gear purchase schedule is a pure function of the
 *  seed (`seed:gear:<category>`), so the week can be picked before anything is ticked; every assertion
 *  still reads a ticked world. Picking blind would make the test a coin flip - land the holiday just
 *  after a purchase and the span is two weeks long, the three-week difference cannot fit, and a green
 *  run would mean nothing.
 *
 *  ⚠⚠ AND THE SECOND CONSTRAINT IS THE ONE THAT ALREADY BIT: `goodWeeksLeftFor` is `Math.max(0, ...)`,
 *  and the shoes' countdown (8 weeks on the shipped rung) is SHORTER than their purchase cadence
 *  (10-14), so a shoe line sits saturated at 0 for the last weeks of every cycle. Two arms three weeks
 *  apart both read 0 there and the difference collapses to a false green. The window below keeps the
 *  whole comparison inside the live part of the countdown, so the number really is moving. */
function readWeekFor(seed: string): number {
  for (let w = 24; w < 160; w += 1) {
    const holidays = [w - 3, w - 2, w - 1]
    if (!holidays.every(bookable)) continue
    const age = kitAgeWeeks(seed, BG, w, null, [])
    const live = (line: KitLine) =>
      age[line] >= HOLIDAY && age[line] < goodWeeksFor(line, DEFAULT_KIT_GRADES[line])
    if (LONG_LINES.every(live)) return w
  }
  throw new Error('no week whose gear span can hold the holiday with a live countdown')
}

describe('round-29 #20 – a booked family holiday stops the kit wearing (owner ruling 5, 09.08)', () => {
  const seed = 'r29-20-holiday'
  const read = readWeekFor(seed)
  const holidays = [read - 3, read - 2, read - 1]

  it('records exactly the holiday weeks on the ticked world, and nothing on a career without one', () => {
    expect(careerTo(seed, read, holidays).gearRestWeeks).toEqual(holidays)
    // ⚠ The plain arm must record NOTHING – if the recorder fired on ordinary weeks the difference
    // below would still be 3 and the whole measurement would be an artefact.
    expect(careerTo(seed, read).gearRestWeeks ?? []).toEqual([])
  })

  it('⭐ leaves the gear exactly HOLIDAY weeks more life than the same career that stayed home', () => {
    const plain = careerTo(seed, read)
    const rested = careerTo(seed, read, holidays)
    expect(plain.week).toBe(rested.week) // same career, same week – only the holiday differs
    for (const line of LONG_LINES) {
      expect(weeksLeft(rested, line) - weeksLeft(plain, line)).toBe(HOLIDAY)
    }
  })

  it('⭐ stands the clock STILL: after the holiday her kit is where it was before it', () => {
    // The sharpest statement of the ruling. Three weeks pass on the calendar and the kit does not
    // age a day, so she comes back off holiday holding what she left with.
    const before = careerTo(seed, read - HOLIDAY)
    const rested = careerTo(seed, read, holidays)
    for (const line of LONG_LINES) {
      expect(weeksLeft(rested, line)).toBe(weeksLeft(before, line))
    }
  })

  it('is idempotent – `housekeep` is reached three ways and a week is never counted twice', () => {
    // A normal week resolves inline; a reveal week defers to `finalizeTournament` / `skipTournament`.
    // Double-counting would silently hand back a week of service life that was never rested.
    const world = careerTo(seed, read, holidays)
    recordGearRestWeek(world)
    recordGearRestWeek(world)
    expect(world.gearRestWeeks).toEqual(holidays)
  })
})

describe('⚠ round-29 #20, the over-reach guard – a training week is a week she PLAYS', () => {
  // ⚠⚠ THE SCOPE IS THE VACATION AND ONLY THE VACATION. He named the holiday, twice, and the ruling's
  // reason is «занятий нет» – no SESSIONS. A week that merely carries no tournament still has her on
  // court, so it must wear the kit at the normal rate. If someone widens the rest term to "any week
  // she did not compete", this goes red, and it is the likeliest wrong turn this change invites.
  const seed = 'r29-20-training'
  const read = readWeekFor(seed)

  it('wears the kit by exactly one week per training week – these careers enter no tournament at all', () => {
    const before = careerTo(seed, read - HOLIDAY)
    const after = careerTo(seed, read)
    // Every week between the two arms is a plain training week: nothing is entered, nothing is booked.
    expect(after.entries).toEqual([])
    for (const line of LONG_LINES) {
      expect(weeksLeft(before, line) - weeksLeft(after, line)).toBe(HOLIDAY)
    }
  })

  it('writes nothing to the stand-down ledger for a week that is merely tournament-free', () => {
    expect(careerTo(seed, read).gearRestWeeks ?? []).toEqual([])
  })
})

describe('round-29 #20 – the stand-down ledger stays bounded without eating a week the curve reads', () => {
  it('⚠ GEAR_REST_WINDOW clears the longest gear cadence with room to spare', () => {
    // `kitAgeWeeks` can only ever ask about a span as long as the longest purchase cadence, because
    // the clock resets on every purchase. The window is the prune boundary, and the same discipline
    // as `pruneInternationalEntries` applies: it may never eat a slot a reader still reaches. Measured
    // against the real table rather than against the comment that quotes it, so re-tuning a cadence
    // past the window turns this RED instead of silently truncating the ledger.
    const cadences = Object.values(ECONOMY.gear).flatMap((line) =>
      Object.values(line.cadenceWeeks as Record<string, readonly [number, number]>).map(([, hi]) => hi),
    )
    const longest = Math.max(...cadences)
    expect(longest).toBeGreaterThan(0) // the table was read, not an empty flatMap
    expect(GEAR_REST_WINDOW).toBeGreaterThan(longest * 2)
  })
})
