// =================================================================================================
// ⭐⭐ ROUND 30 #2 – «DO BOTH» DRAWS THE SHOOT, because he paid for it and could not see it
// =================================================================================================
//
// THE OWNER, 30.08: «Если выбрать Do both для съёмок и турнира, то в расписании не отображаются
// съёмки». His words are in docs/rounds/round-30.md, where they may be quoted in his own language.
//
// ⚠⚠ THIS IS THE THIRD «YOU PAID AND CANNOT SEE IT» OF THE MONTH, AND THE REPETITION IS THE FINDING.
// Not this bug – the SHAPE, three times in four weeks, in three different files:
//   1. round 29 #3 – the SHOOT WEEK'S MASSEUR. `masseurSessions` carried a `&& !shooting` the engine
//      never had, so the salary was charged on a shoot week and none of his days were drawn.
//   2. round 29 P13 – the TOUR WEEK'S MASSAGE DAYS. The weekly rung's 2/4/7 were laid over a week
//      whose plan is not spent, so the table landed on the travel day and the practice day and
//      missed every match of the week at the entry rung – while `masseurTourWeekCents` billed
//      matches played.
//   3. THIS ONE. `answerShootClash`'s «do both» arm charges `clashConditionPerDay` x 7 and latches
//      the week; `calendarWeekFor`'s trip branch returned before `shoot` was ever filled in, so the
//      grid drew an ordinary tournament week and the charge had no picture at all.
// One rule was broken all three times, and this file's neighbour states it: «the picture is the same
// sentence the sim charges for». It is worth reading before the next block is added, not after.
//
// ⚠ WHAT THIS FILE IS FOR. The strongest arms below are DRIVEN: a real world with a real signed
// campaign and a real entry, answered with a real `answerShootClash` command, snapshotted, and the
// calendar drawn off that snapshot. That is the whole chain the defect lived in – the engine's
// latch, `adShoots`, `arrival`, `calendarWeekFor`, `weekGridFor` – and a fact-bag test would have
// proved the grid could draw a block nobody could reach.
//
// ⚠ IT NEEDS NO NEW SNAPSHOT FIELD, AND THE «WHY» IS AN ARM RATHER THAN A CLAIM.
// `shootClashAccepted` is world state and is not on the wire; it does not have to be, because the
// other three answers REMOVE the collision. §2 drives all four answers and reads the grid back.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arms red, and each was watched:
//   * `shoot: shooting` -> `shoot: false` in `calendarWeekFor`'s trip branch  -> §1 and §2's «both»
//     arm. This is the defect itself, rebuilt.
//   * `TRIP_SHOOT` pushed BEFORE the press hour                              -> the order arm.
//   * `TRIP_SHOOT`'s span 2 -> 5 (the Slam's Sunday overruns the grid)       -> the fits arm.
//   * the shoot hung on every day of the arc instead of the match days       -> the «match days and
//     nowhere else» arm.
import { describe, it, expect } from 'vitest'
import {
  calendarWeekFor,
  tripRoundsFor,
  type CalendarWeek,
  type CalendarWeekFacts,
} from '../../src/composables/weekDays'
import { weekGridFor, type BlockKind, type DayBlock, type GridDay } from '../../src/composables/weekGrid'
import { weekDayNumbers } from '../../src/shared/dates'
import { TIER_LADDER } from '../../src/engine/season/calendar'
import type { TierId } from '../../src/engine/season/types'
import { adOfferId } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { answerShootClash, createWorld, shootClashOpen, toSnapshot, type WorldState } from '../../src/engine/world'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type AdOfferTerms } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// =================================================================================================
// FIXTURES
// =================================================================================================

/** The grid's own hours – the rows the screen draws, and the fence every block must stay inside. */
const GRID_START = 7
const GRID_END = 19

const WEEK = 6
const BRAND = 'Nine Bells'

/** A plain fact bag – the `facts()` idiom `round29-trip-week.test.ts` keeps, copied rather than
 *  imported because a fixture shared across files drifts into being a second production module. */
function facts(over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts {
  return {
    week: WEEK - 1,
    plan: WEEK_PLAN_PRESETS.balanced,
    profile: DEFAULT_PROFILE,
    injury: null,
    knock: null,
    vacations: [],
    practices: [],
    upcoming: [],
    arrival: null,
    pending: undefined,
    ...over,
  }
}

/** A committed trip at `tier`, with or without a campaign shooting through it. */
function trip(tier: TierId, shooting: boolean, over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts {
  return facts({
    arrival: { eventId: `e-${tier}`, tier, week: WEEK, verdict: 'play', outgrown: false },
    ...(shooting ? { adShoots: [{ brand: BRAND, weeks: [WEEK] }] } : {}),
    ...over,
  })
}

function weekOf(f: CalendarWeekFacts, week = WEEK): CalendarWeek {
  return calendarWeekFor(f, week)
}
function gridOf(f: CalendarWeekFacts, week = WEEK, age = 20): GridDay[] {
  return weekGridFor(weekOf(f, week), age, weekDayNumbers(week))
}
const blocksOf = (grid: GridDay[]): DayBlock[] => grid.flatMap((d) => d.blocks)
const shootBlocks = (grid: GridDay[]): DayBlock[] => blocksOf(grid).filter((b) => b.label === 'Shoot')
const daysWith = (grid: GridDay[], kind: BlockKind) =>
  grid.filter((d) => d.blocks.some((b) => b.kind === kind)).map((d) => d.index)
const daysWithShoot = (grid: GridDay[]) =>
  grid.filter((d) => d.blocks.some((b) => b.label === 'Shoot')).map((d) => d.index)

/** ⚠ THE ENGINE'S WHOLE LADDER, not a list retyped here – `round29-trip-week.test.ts`'s own rule: a
 *  seventeenth rung joins the sweep by existing rather than by somebody remembering. */
const RUNGS: readonly TierId[] = TIER_LADDER

// -------------------------------------------------------------------------------------------------
// THE DRIVEN COLLISION – `round29-shoot-clash.test.ts`'s `clashWorld`, kept to the field.
// -------------------------------------------------------------------------------------------------

/** Week 216 – offset 8 of season 5, an ordinary in-season adult week, exactly as the engine-side
 *  clash file probes it. The question can only be asked on the week BEFORE, because two of its four
 *  answers stop being possible once the week begins. */
const CLASH = 216
const AT = CLASH - 1

/** THE COLLISION, BUILT: a signed campaign that names `CLASH` and an entry she holds for the same
 *  week, with the world standing on `AT`. Walking a career until a house happened to write AND the
 *  dice happened to name a week she was entered in would be testing `chooseShootWeeks` rather than
 *  what the collision DRAWS. */
function clashWorld(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  world.plan = { train: 60, rest: 40 }
  world.physioActive = false
  world.condition = 50
  world.fundsCents = 500_000_00
  const event: SeasonEvent = {
    id: `${seed}-event`,
    week: CLASH,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: AT - 2,
  }
  world.season = [event]
  world.entries = [event.id]
  world.offers.push({
    id: adOfferId(AT - 10),
    kind: 'ad',
    week: AT - 10,
    deadlineWeek: AT - 7,
    state: 'signed',
    decidedWeek: AT - 10,
    fromWeek: AT - 10,
    untilWeek: AT - 10 + 51,
    terms: {
      brand: BRAND,
      cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[0]!,
      termWeeks: 52,
      shootCount: 2,
      shootWeeks: [CLASH],
    } as AdOfferTerms,
  })
  return world
}

/** The clash week as the CALENDAR sees it, off a real snapshot of a real world. */
function drawnClashWeek(world: WorldState): GridDay[] {
  const snap = toSnapshot(world)
  expect(snap.arrival?.week, 'the fixture really has the tournament in the week ahead').toBe(CLASH)
  return weekGridFor(calendarWeekFor(snap, CLASH), snap.ageYears, weekDayNumbers(CLASH))
}

// =================================================================================================
// §1 – THE REGRESSION: the shoot is ON the tournament week's grid
// =================================================================================================
describe('round 30 #2 §1 – a shoot on a tournament week is drawn', () => {
  it('⚠⚠ the defect itself: a trip week with a live shoot draws Shoot hours, and without one draws none', () => {
    const withShoot = gridOf(trip('w15', true))
    const without = gridOf(trip('w15', false))
    expect(shootBlocks(without), 'a plain tournament week is untouched by this item').toHaveLength(0)
    expect(shootBlocks(withShoot).length, 'the hours he paid for are on the week').toBeGreaterThan(0)
    // ...and the tournament is still the week's shape: nothing was displaced to make room.
    expect(
      daysWith(withShoot, 'tournament'),
      'the draw still owns the same days it owned before',
    ).toEqual(daysWith(without, 'tournament'))
  })

  it('⚠ on the MATCH DAYS and nowhere else – the same days the press hour and the table hang on', () => {
    // ⚠ MUTATION: hang the shoot on every day of the arc and this reddens on the travel and practice
    // days. The rule is one sentence – it goes where the tennis is – and that is also the only rule
    // that always draws SOMETHING: from five rounds up a trip has no practice day left to give.
    for (const tier of RUNGS) {
      const grid = gridOf(trip(tier, true))
      expect(daysWithShoot(grid), `${tier}: the shoot is not on the match days`).toEqual(
        daysWith(grid, 'tournament'),
      )
      expect(shootBlocks(grid).length, `${tier}: one shoot block per match day`).toBe(tripRoundsFor(tier))
    }
  })

  it('⚠ the sweep is not satisfied by "every rung is the same" – the arc lengths really differ', () => {
    // A sixteen-rung sweep whose rows all read one number is satisfied by a constant. `tripRoundsFor`
    // is the thing under test on the line above, so this asserts the ladder is not flat.
    const counts = new Set(RUNGS.map((t) => shootBlocks(gridOf(trip(t, true))).length))
    expect(counts.size, 'every rung draws the same number of shoot hours').toBeGreaterThan(1)
  })

  it('⚠ LAST in the day, behind the order he ruled in round 30 #17', () => {
    // ⚠ MUTATION: push `TRIP_SHOOT` before the press hour and this reddens. His sequence is match ->
    // conference -> massage; the brand gets what the tennis and its conference leave, so it goes on
    // the end and none of his three blocks moves for it.
    const grid = gridOf(
      trip('slam', true, { masseurHired: true, masseurSessionsPerWeek: 7, masseurTravels: true }),
    )
    for (const day of grid) {
      const labels = day.blocks.map((b) => b.label)
      if (!labels.includes('Shoot')) continue
      expect(labels.slice(0, 4), `${day.short}: his order was disturbed`).toEqual([
        'Draw day',
        'Press',
        'Body work',
        'Shoot',
      ])
    }
  })

  it('⚠⚠ and NOTHING overruns the grid or overlaps, at any rung, hire or no hire', () => {
    // The compression he has twice refused, guarded from the other end: the shoot may not push a day
    // past 19:00 and may not be laid over an hour that is already spoken for.
    // ⚠ MUTATION: grow `TRIP_SHOOT`'s span to 5 and the Slam's Sunday runs past the grid – red here.
    for (const tier of RUNGS) {
      for (const hired of [false, true]) {
        const grid = gridOf(
          trip(tier, true, hired ? { masseurHired: true, masseurSessionsPerWeek: 7, masseurTravels: true } : {}),
        )
        for (const day of grid) {
          for (const b of day.blocks) {
            expect(b.start, `${tier}/${day.short}: "${b.label}" starts before the grid`).toBeGreaterThanOrEqual(GRID_START)
            expect(b.start + b.span, `${tier}/${day.short}: "${b.label}" runs past the grid`).toBeLessThanOrEqual(GRID_END)
            expect(b.span, `${tier}/${day.short}: "${b.label}" is not a real hour`).toBeGreaterThan(0)
          }
          for (const a of day.blocks) {
            for (const b of day.blocks) {
              if (a === b) continue
              expect(
                a.start + a.span <= b.start || b.start + b.span <= a.start,
                `${tier}/${day.short}: "${a.label}" and "${b.label}" overlap`,
              ).toBe(true)
            }
          }
        }
      }
    }
  })

  it('⚠ the Slam still comes home on its own Sunday, behind all four blocks', () => {
    // Round 29 P16's rule, re-asked with the shoot in the day: the flight takes the evening that is
    // LEFT and takes an hour from nobody. 10-14 draw, 14-15 press, 15-16 table, 16-18 shoot, 18-19 home.
    const sunday = gridOf(
      trip('slam', true, { masseurHired: true, masseurSessionsPerWeek: 7, masseurTravels: true }),
    )[6].blocks
    expect(sunday.map((b) => b.label)).toEqual(['Draw day', 'Press', 'Body work', 'Shoot', 'Travel home'])
    const flight = sunday.find((b) => b.label === 'Travel home')!
    expect(flight.start, 'the flight starts when the shoot finishes').toBe(18)
    expect(flight.start + flight.span, 'and it runs to the end of the evening').toBe(GRID_END)
  })
})

// =================================================================================================
// §2 – DRIVEN: the four answers, and only one of them draws a shoot
// =================================================================================================
//
// ⚠⚠ THIS IS THE ARM THAT PROVES THE FEATURE IS REACHABLE. §1 above builds fact bags, which can
// prove the grid CAN draw a block and cannot prove that the engine ever hands it one. Every world
// here is answered with the real command and snapshotted, so the whole chain is under test.
describe('round 30 #2 §2 – driven through `answerShootClash`', () => {
  it('⚠⚠ «do both» – the week keeps the tournament, keeps the shoot, and DRAWS the shoot', () => {
    const world = clashWorld('r30-both')
    expect(shootClashOpen(world), 'the fixture really has the question standing').toBe(true)
    answerShootClash(world, 'both')
    expect(shootClashOpen(world), 'and the latch closed it').toBe(false)

    const grid = drawnClashWeek(world)
    expect(daysWith(grid, 'tournament').length, 'she is still playing the tournament').toBeGreaterThan(0)
    expect(shootBlocks(grid).length, 'and the hours the week charged 7 condition for are on it').toBeGreaterThan(0)
    expect(daysWithShoot(grid), 'on the match days').toEqual(daysWith(grid, 'tournament'))
  })

  it('⚠ «move the shoot» – the tournament week stands and draws NO shoot', () => {
    const world = clashWorld('r30-move')
    answerShootClash(world, 'move-shoot')
    const grid = drawnClashWeek(world)
    expect(daysWith(grid, 'tournament').length, 'the draw still owns the week').toBeGreaterThan(0)
    expect(shootBlocks(grid), 'the shoot left this week, so it is not drawn on it').toHaveLength(0)
  })

  it('⚠ «cancel the shoot» – same picture, and for the same reason: the week is no longer named', () => {
    const world = clashWorld('r30-cancel')
    answerShootClash(world, 'cancel-shoot')
    expect(shootBlocks(drawnClashWeek(world))).toHaveLength(0)
  })

  it('⚠⚠ «withdraw» – there is no trip week left to draw a shoot on', () => {
    // The fourth answer is the one that proves no new snapshot field is owed: with the entry gone
    // the week is not a trip at all, so «an entered trip AND a named shoot week» can only be the
    // «do both» week once the question has been answered. That is the whole argument for reading
    // two existing fields instead of putting `shootClashAccepted` on the wire.
    const world = clashWorld('r30-withdraw')
    answerShootClash(world, 'withdraw')
    const snap = toSnapshot(world)
    expect(snap.arrival, 'the entry really was cancelled').toBeNull()
    const grid = weekGridFor(calendarWeekFor(snap, CLASH), snap.ageYears, weekDayNumbers(CLASH))
    expect(daysWith(grid, 'tournament'), 'no tournament').toEqual([])
    // ...and the shoot is drawn the way an ORDINARY shoot week draws it – the whole-day call sheet,
    // which is the shape this item deliberately did not touch.
    expect(shootBlocks(grid).length, 'the ordinary shoot week is unchanged by this item').toBeGreaterThan(0)
    expect(
      shootBlocks(grid).every((b) => b.span > 2),
      'a shoot-only day is the whole working day, not the two hours a match day leaves',
    ).toBe(true)
  })
})
