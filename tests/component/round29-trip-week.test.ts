// ⭐⭐ ROUND 29 PART FIVE – P15 / P13 / P14: THE TOURNAMENT WEEK, AS LONG AS ITS DRAW AND WITH THE
// TWO THINGS THAT HAPPEN AFTER A MATCH IN IT.
//
// The owner's three sentences, in the order he wrote them (they are in docs/rounds/round-29.md,
// where they may be quoted in his own language):
//
//   P13  «когда массажист есть и ездит на турниры давай добавим в календарь сессии массажа после
//         матчей по плану. (если еще нет)»
//   P14  «после матчей на турнирах бывают пресс-конференции ... на тех уровнях турниров, где это
//         актуально.»
//   P15  «давай здесь тоже сделаем разное количество Draw day в зависимости от уровня турнира: на
//         локалах 3 дня, National 4 (вроде), основная масса 5, а на 1000 вообще 6 (Шлем 7)»
//
// ...and the ruling that made P15 buildable inside one week, after two-week events were put to him
// and declined («Подожди с этим»):
//
//   «Если у нас на неделе ожидается шлем или 1000, то мы вполне можем на предыдущей неделе в
//    Воскресенье начать ехать на турнир ... И тогда не надо ничего менять в нашей раскладке.»
//
// ⚠⚠ THE ONE PROPERTY THIS FILE EXISTS FOR, and it is the reason the three items share a file: the
// arc's length is now a FUNCTION OF THE DRAW, and the massage and the press room hang off whatever
// match days that function produced. Three separate tests would each have passed against a week that
// draws four Draw days for every rung on the ladder – which is exactly what shipped before this.
//
// ⚠ NOTHING HERE IS AN ENGINE CHANGE. No tick, no entry, no schedule and no save field moved; the
// tournament resolves in its own week exactly as it did. Every number below is arithmetic over facts
// the snapshot already carried, and no RNG stream – MAIN or sub – is touched, which is why the frozen
// capture (41550 / e6b0c709) is unmoved by the whole wave.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ THE MUTATION LOG – twenty applied, nineteen red, one honestly recorded GREEN
// -------------------------------------------------------------------------------------------------
// A guard that cannot fail on the version of the code it is describing is decoration. Each of these
// was applied to the shipped source, this file was run, and the source restored from a FILE COPY
// (`git checkout --` restores from the index, which is not the same thing).
//
//   M1   `tripArcFor` ignores its round count (four Draw days for everybody – the pre-P15 shape)  11 red
//   M2   `tripKeepsDeparture` one day looser (`rounds + 1 <= 7`)                                   2 red
//   M3   `addLentDeparture` drops the length guard – every rung borrows a Sunday                   1 red
//   M4   the loan stops asking whether she ENTERED next week's event                               1 red
//   M5   `addLentDeparture` stops checking the hour is free (paints over her homework)             1 red
//   M6   the trip draws the WEEKLY rung's table again – the defect P13 is about                    6 red
//   M7   `PRESS_FROM_TIER` moved down to the ITF W15                                               2 red
//   M8   the tour massage moves to 07:00, before the match                                         1 red
//   M9   `trip.masseur` stops asking whether he travels                                            1 red
//   M10  a trip week lends its own Sunday to the next trip                                         1 red
//   M11  the press block stops sitting one hour behind the draw                                    2 red
//   M12  the court hit survives at every rung, so the arc overruns the week                       10 red
//   M13  the OFF-SEASON lends its Sunday                                                          1 red
//   M14  a booked FAMILY week lends its Sunday                                                    1 red
//   M15  a LAYOFF week lends its Sunday                                                           1 red
//   M16  the Slam's evening return deleted – she never comes home                                 5 red
//   M17  the match day's order swapped back to draw -> press -> table                             2 red
//   M18  `tripKeepsReturn` tightened, so the 1000 loses its travel DAY                            2 red
//   M19  the flight eats the press hour – the compression he has twice refused                    3 red
//   M20  `addEveningReturn`'s `start >= GRID_END_HOUR` guard removed             ⚠⚠ STILL GREEN
//   M21  `TRIP_PRESS` grown to four hours, which breaks M20's premise                             1 red
//
// ⚠⚠ M20 IS IN THIS LIST BECAUSE IT STAYED GREEN, and that is the entry worth reading. The guard is
// unreachable – a match day ends at 16:00 at the very most – so no fixture can redden on it, and a
// comment claiming otherwise would have been the seventeenth dead guard of the week. The PREMISE is
// pinned instead (the "no evening left" test), and M21 is that pin failing on the exact change that
// would make M20's branch start mattering.
//
// ⚠ AND THE TWO "NOT ALL THE SAME" ARMS EXIST BECAUSE OF M1 AND M7: a sixteen-rung sweep whose rows
// all read one number is satisfied by a constant, and a press sweep whose rows all read `false` is
// satisfied by a screen that never draws one.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  PRESS_FROM_TIER,
  TRIP_ROUNDS_FALLBACK,
  calendarWeekFor,
  tierHoldsPress,
  tripRoundsFor,
  type CalendarWeek,
  type CalendarWeekFacts,
} from '../../src/composables/weekDays'
import {
  TRIP_DEFAULT,
  tripKeepsDeparture,
  tripKeepsReturn,
  weekGridFor,
  type BlockKind,
  type DayBlock,
  type GridDay,
} from '../../src/composables/weekGrid'
import { weekDayNumbers } from '../../src/shared/dates'
import { OFF_SEASON_WEEKS, TIERS, TIER_LADDER, WEEKS_PER_YEAR, isOffSeasonWeek } from '../../src/engine/season/calendar'
import type { TierId } from '../../src/engine/season/types'
import { ECONOMY } from '../../src/engine/economy'
import {
  createWorld,
  hireMasseur,
  masseurTourWeekCents,
  setMasseurSessions,
  setMasseurTravels,
  toSnapshot,
} from '../../src/engine/world'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type Snapshot } from '../../src/shared/protocol'

// =================================================================================================
// FIXTURES
// =================================================================================================

const WEEK = 6
const SUNDAY = 6

/** A plain fact bag – the `facts()` idiom tests/calendar-grid.test.ts and tests/calendar-screen.test.ts
 *  both keep, copied rather than imported because a fixture shared across files drifts into being a
 *  second production module. */
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

/** THE COMMITTED TRIP, as the engine hands it over: `arrival` names the event's tier and its week. */
function trip(tier: TierId, over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts {
  return facts({
    arrival: { eventId: `e-${tier}`, tier, week: WEEK, verdict: 'play', outgrown: false },
    ...over,
  })
}

/** The three masseur facts, at a named rung. */
function withMasseur(sessions: number, travels: boolean): Partial<CalendarWeekFacts> {
  return { masseurHired: true, masseurSessionsPerWeek: sessions, masseurTravels: travels }
}

function weekOf(f: CalendarWeekFacts, week = WEEK): CalendarWeek {
  return calendarWeekFor(f, week)
}
function gridOf(f: CalendarWeekFacts, week = WEEK, age = 20): GridDay[] {
  return weekGridFor(weekOf(f, week), age, weekDayNumbers(week))
}
const blocksOf = (grid: GridDay[]): DayBlock[] => grid.flatMap((d) => d.blocks)
const countKind = (grid: GridDay[], kind: BlockKind) => blocksOf(grid).filter((b) => b.kind === kind).length
const daysWith = (grid: GridDay[], kind: BlockKind) =>
  grid.filter((d) => d.blocks.some((b) => b.kind === kind)).map((d) => d.index)

/** ⚠ THE RUNGS THIS FILE SWEEPS ARE THE ENGINE'S WHOLE LADDER, not a list retyped here: a
 *  seventeenth rung joins every claim below by existing. */
const RUNGS = TIER_LADDER

/** The dearest masseur rung, so "he drew nothing" and "he drew his sessions" are the widest apart. */
const DAILY = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions
const ENTRY = ECONOMY.masseur.rungs[0].sessions

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// §0 – THE FIXTURE IS WHAT IT CLAIMS TO BE
// =================================================================================================
describe('round 29 P15 – the fixture', () => {
  it('a committed arrival really produces a trip week, at every rung on the ladder', () => {
    for (const tier of RUNGS) {
      const week = weekOf(trip(tier))
      expect(week.days.every((d) => d.kind === 'away'), tier).toBe(true)
      expect(week.trip, `${tier}: the week carries no trip facts`).not.toBeNull()
    }
  })

  it('...and an ordinary week carries none of them', () => {
    const week = weekOf(facts())
    expect(week.days.some((d) => d.kind === 'away')).toBe(false)
    expect(week.trip).toBeNull()
  })
})

// =================================================================================================
// §1 – P15: THE NUMBER OF MATCH DAYS IS THE DRAW'S OWN ROUND COUNT
// =================================================================================================
describe('round 29 P15 – a trip is as long as its draw', () => {
  it('⚠⚠ every rung draws `log2(drawSize)` match days – the engine\'s own arithmetic, not a table', () => {
    // ⚠ MUTATION: make `tripArcFor` ignore its `rounds` argument (the shipped-before-P15 behaviour –
    // four Draw days for everybody) and this reddens on eight of the sixteen rungs at once.
    for (const tier of RUNGS) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      expect(countKind(gridOf(trip(tier)), 'tournament'), `${tier}: a ${TIERS[tier].drawSize}-draw`).toBe(rounds)
    }
  })

  it('⚠ ...and the counts are NOT all the same, or the sweep above proves nothing', () => {
    // A sweep whose sixteen rows all read the same number is satisfied by a constant. This is what
    // stops that reading, and it is the assertion that would survive somebody "simplifying"
    // `tripArcFor` back into a fixed table.
    const counts = new Set(RUNGS.map((t) => countKind(gridOf(trip(t)), 'tournament')))
    expect([...counts].sort(), 'the ladder draws one shape of week').toEqual([3, 4, 5, 6, 7])
  })

  it('the owner\'s own five numbers, by name', () => {
    // His sentence, rung by rung, so the general rule above is anchored to the thing he asked for.
    // ⚠ HIS «National 4 (вроде)» IS ANSWERED BY THE TABLE RATHER THAN AROUND IT: the National Series
    // is a 32-draw in this game, so it is a five-day week like every other 32-draw, and the FOUR-day
    // rung is `regional`. He hedged the number himself; the catalogue is the authority.
    expect(countKind(gridOf(trip('local')), 'tournament'), 'на локалах 3 дня').toBe(3)
    expect(countKind(gridOf(trip('regional')), 'tournament'), 'the 16-draw').toBe(4)
    expect(countKind(gridOf(trip('national')), 'tournament'), 'a 32-draw, like the rest').toBe(5)
    expect(countKind(gridOf(trip('w15')), 'tournament'), 'основная масса').toBe(5)
    expect(countKind(gridOf(trip('wta500')), 'tournament'), 'основная масса').toBe(5)
    expect(countKind(gridOf(trip('wta1000')), 'tournament'), 'на 1000 вообще 6').toBe(6)
    expect(countKind(gridOf(trip('slam')), 'tournament'), 'Шлем 7').toBe(7)
  })

  it('⚠ every trip spends all seven days – no rung leaves an empty column', () => {
    // The silent failure this whole module writes tests against: a week the family paid to be away
    // for, with a blank Wednesday in it because the arithmetic came up short.
    for (const tier of RUNGS) {
      const grid = gridOf(trip(tier))
      expect(grid.length, tier).toBe(7)
      for (const day of grid) expect(day.blocks.length, `${tier}/${day.short}`).toBeGreaterThan(0)
    }
  })

  it('⚠ the JOURNEY is what gives way at the big rungs, never the tennis', () => {
    // His own design: the tournament stays inside its week and the travel moves to the edges. The
    // DEPARTURE day falls away first (lent by the previous Sunday from six rounds up).
    //
    // ⚠⚠ RE-AIMED (P16, his 30.08 ruling): the RETURN never falls away at all any more. It used to –
    // a Slam drew no travel block whatever, because his first sketch put the journey on the Monday of
    // the next week and this screen cannot see that Monday. He then removed the need for it – «можно
    // сделать в Вс после матчей, массажа и конференций» – so the Slam's Sunday carries the flight in
    // its own evening. Every trip of every length now shows her coming home, which is the assertion
    // this row could not make before.
    for (const tier of RUNGS) {
      const rounds = tripRoundsFor(tier)
      const travel = countKind(gridOf(trip(tier)), 'travel')
      const expected = (tripKeepsDeparture(rounds) ? 1 : 0) + 1
      expect(travel, `${tier}: ${rounds} rounds`).toBe(expected)
    }
    expect(countKind(gridOf(trip('w15')), 'travel'), 'out and back').toBe(2)
    expect(countKind(gridOf(trip('wta1000')), 'travel'), 'a whole Sunday for the journey home').toBe(1)
    expect(countKind(gridOf(trip('slam')), 'travel'), 'the Sunday evening after the final').toBe(1)
    // ⚠ AND NOT ONE TRIP ENDS WITHOUT A WAY HOME – the sweep above is satisfied by "some travel
    // somewhere", this is the sentence it is really making.
    for (const tier of RUNGS) {
      const home = blocksOf(gridOf(trip(tier))).filter((b) => b.label === 'Travel home')
      expect(home.length, `${tier}: she never comes home`).toBe(1)
    }
  })

  it('the court hit is the arc\'s furniture and it is the first thing to go', () => {
    // `training` on a trip week is the venue practice – never `drills`, which MEANS the session the
    // plan bought. It survives while the draw leaves room and disappears from five rounds up.
    expect(countKind(gridOf(trip('local')), 'training'), 'a three-round week has room for two').toBe(2)
    expect(countKind(gridOf(trip('regional')), 'training')).toBe(1)
    for (const tier of ['w15', 'wta250', 'wta1000', 'slam'] as TierId[]) {
      expect(countKind(gridOf(trip(tier)), 'training'), `${tier}: no room for a practice day`).toBe(0)
    }
    // ...and not one day of any trip spends a session the plan bought.
    for (const tier of RUNGS) expect(countKind(gridOf(trip(tier)), 'drills'), tier).toBe(0)
  })

  it('⚠ NOT ONE ROUND IS NAMED, at any length of week', () => {
    // The rule that predates all three items and survives them: the week has not been played, so
    // every match day says the same thing – when the tournament is on, not how far she got.
    for (const tier of RUNGS) {
      const blocks = blocksOf(gridOf(trip(tier, withMasseur(DAILY, true))))
      const labels = new Set(blocks.filter((b) => b.kind === 'tournament').map((b) => b.label))
      expect(labels.size, `${tier}: the match days do not all say the same thing`).toBe(1)
      for (const b of blocks) {
        expect(b.label, `"${b.label}" names a round`).not.toMatch(/\b(R\d|QF|SF|final|round|semi|quarter)\b/i)
      }
    }
  })
})

// =================================================================================================
// §2 – P15: THE SUNDAY THE NEIGHBOUR LENDS
// =================================================================================================
//
// The half of his design that is not inside the trip week: a draw too long to start at home leaves on
// the previous week's Sunday evening. ⚠ AND THE LENDING WEEK IS STILL ITSELF – «не надо ничего менять
// в нашей раскладке» – so the loan may only ever ADD one hour at the end of a day, and declines
// whenever that hour is spoken for.
describe('round 29 P15 – the previous week lends its Sunday', () => {
  /** An ordinary week that has `tier` entered in the week AFTER it. The event is a real
   *  `UpcomingEvent` off a real world, doctored in three fields – a hand-built one would be a second
   *  spelling of the protocol.
   *
   *  ⚠ THE DEFAULT ARM IS A PROFESSIONAL (`schoolEndsWeek: 0`), and that is not a convenience. The
   *  loan asks for the last hour of the Sunday and takes it only when it is free; past school the
   *  evening is hers, and at fourteen it is homework. A Slam and a 1000 are entered by a professional,
   *  so this is the arm the rule exists for – and the schoolgirl's is asserted on its own below rather
   *  than left as a surprise. */
  function nextEventTemplate() {
    const snap = toSnapshot(createWorld('r29-p15-lend', DEFAULT_PROFILE))
    const template = snap.upcoming[0]
    expect(template, 'the fixture world offers no events at all').toBeDefined()
    return template
  }
  function withNextEvent(tier: TierId, entered: boolean, over: Partial<CalendarWeekFacts> = {}) {
    return facts({
      schoolEndsWeek: 0,
      upcoming: [{ ...nextEventTemplate(), week: WEEK + 1, tier, entered }],
      ...over,
    })
  }

  const sundayTravel = (f: CalendarWeekFacts) =>
    gridOf(f)[SUNDAY].blocks.filter((b) => b.kind === 'travel')

  it('⚠⚠ a Slam next week puts a departure on this week\'s Sunday evening', () => {
    // ⚠ MUTATION: delete the `tripKeepsDeparture` guard in `addLentDeparture` and the 32-draw case
    // below reddens; delete the `entered` filter in `calendarWeekFor` and the not-entered case does.
    const lent = sundayTravel(withNextEvent('slam', true))
    expect(lent.length, 'she is drawn leaving on the Monday morning of a Slam').toBe(1)
    expect(lent[0].label).toBe('Travel out')
    expect(lent[0].start + lent[0].span, 'the loan is the last hour of the day').toBe(19)
  })

  it('...and a 1000 does too, because six rounds leave no Monday to travel on', () => {
    expect(sundayTravel(withNextEvent('wta1000', true)).length).toBe(1)
  })

  it('⚠ a 32-draw does NOT – it starts at home on the Monday, as it always has', () => {
    for (const tier of ['w15', 'wta250', 'wta500', 'national', 'local'] as TierId[]) {
      expect(sundayTravel(withNextEvent(tier, true)).length, `${tier} borrowed a Sunday it does not need`).toBe(0)
    }
  })

  it('⚠ a Slam she did not ENTER lends nothing – it is somebody else\'s fortnight', () => {
    expect(sundayTravel(withNextEvent('slam', false)).length).toBe(0)
  })

  it('⚠ and neither does a week with no next event at all, or no fixture list', () => {
    expect(sundayTravel(facts()).length).toBe(0)
    expect(weekOf(facts()).nextTripRounds).toBeNull()
  })

  it('⚠⚠ THE LENDING WEEK IS UNCHANGED APART FROM THAT ONE HOUR', () => {
    // His «не надо ничего менять в нашей раскладке», asserted rather than trusted: the same week with
    // and without the neighbour, compared day by day. Only the Sunday differs, and only by an
    // addition – no session moved, none was shortened and none was taken away.
    const plain = gridOf(facts({ schoolEndsWeek: 0 }))
    const lending = gridOf(withNextEvent('slam', true))
    for (let d = 0; d < 7; d++) {
      const extra = lending[d].blocks.filter((b) => !plain[d].blocks.some((p) => JSON.stringify(p) === JSON.stringify(b)))
      expect(lending[d].kind, `day ${d} changed what it IS`).toBe(plain[d].kind)
      for (const before of plain[d].blocks) {
        expect(lending[d].blocks, `day ${d} lost or moved a block the plan bought`).toContainEqual(before)
      }
      expect(extra.length, `day ${d} grew a block it should not have`).toBe(d === SUNDAY ? 1 : 0)
    }
  })

  it('⚠ four kinds of week keep their Sunday, and each for its own reason', () => {
    // The conservative direction, chosen deliberately: her own week's identity owns its days.
    const arms: [string, CalendarWeekFacts][] = [
      // two big events back to back – the Sunday is already this trip's last match day
      ['a trip of her own', withNextEvent('slam', true, {
        arrival: { eventId: 'e-own', tier: 'wta1000', week: WEEK, verdict: 'play', outgrown: false },
      })],
      ['a booked family week', withNextEvent('slam', true, {
        vacations: [{ week: WEEK, packageId: ECONOMY.vacation.packages[0].id, paidCents: 0 }],
      })],
      ['a layoff', withNextEvent('slam', true, {
        injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4, sinceWeek: WEEK - 1 },
      })],
    ]
    for (const [what, f] of arms) {
      expect(weekOf(f).nextTripRounds, `${what} lent a Sunday that was not its own to lend`).toBeNull()
    }
    // ...and the off-season, which is told apart by its WEEK NUMBER rather than by a fact on the
    // bag – the first of the season's closing weeks, taken off the engine's own constant so this
    // cannot drift if the shutdown moves.
    const shut = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    expect(isOffSeasonWeek(shut), 'the fixture week is not actually the off-season').toBe(true)
    const off = facts({ upcoming: [{ ...nextEventTemplate(), week: shut + 1, tier: 'slam', entered: true }] })
    expect(calendarWeekFor(off, shut).nextTripRounds, 'the tour is shut and it lent a Sunday').toBeNull()
  })

  it('⚠⚠ it can only ever DECLINE – a SCHOOLGIRL\'S Sunday evening is homework and keeps it', () => {
    // ⚠ MUTATION: delete the `free` check in `addLentDeparture` and this reddens with two blocks on
    // top of each other at 18:00.
    //
    // The fence that keeps this from being a second place a day's shape gets decided. At fourteen the
    // school band puts `Study` at 18:00 on every shape including the rest day, so the loan finds no
    // room and says nothing rather than deleting her homework to make room for a flight. That the
    // rule is therefore a professional's in practice is exactly right for the two rungs it serves.
    const child = withNextEvent('slam', true, { schoolEndsWeek: undefined })
    const sunday = gridOf(child)[SUNDAY]
    expect(sunday.blocks.some((b) => b.kind === 'study' && b.start + b.span === 19), 'the fixture has no evening hour to defend').toBe(true)
    expect(sunday.blocks.filter((b) => b.kind === 'travel').length, 'the loan painted over her homework').toBe(0)
    // ...and no two blocks of any day of either arm may ever overlap, whatever the preset did.
    for (const f of [child, withNextEvent('slam', true, { plan: WEEK_PLAN_PRESETS.grind })]) {
      for (const day of gridOf(f)) {
        for (const a of day.blocks) {
          for (const b of day.blocks) {
            if (a === b) continue
            expect(a.start + a.span <= b.start || b.start + b.span <= a.start, `${day.short}: overlap`).toBe(true)
          }
        }
      }
    }
  })
})

// =================================================================================================
// §2b – P16: THE SLAM COMES HOME ON ITS OWN SUNDAY EVENING
// =================================================================================================
//
// ⚠⚠ THE HALF OF HIS DESIGN THAT COULD NOT BE DRAWN, AND HOW HE CLOSED IT. His first sketch put the
// return on «в Пн следующей недели», which this screen cannot reach: the calendar draws
// `snapshot.week + 1` and `upcoming` is `week > world.week`, so it looks forward one week and cannot
// look back one at all. Nothing was drawn rather than something guessed. He then removed the need:
//
//   «возвращение со Шлема в понедельник следующей недели – да, окей, можно сделать в Вс после
//    матчей, массажа и конференций»
//
// So the flight is the LAST thing on the Slam's own Sunday, behind all three, and the whole trip is
// inside its own week again.
describe('round 29 P16 – the Slam flies home on its own Sunday', () => {
  const lastDay = (f: CalendarWeekFacts) => gridOf(f)[SUNDAY].blocks

  it('⚠⚠ the Sunday of a Slam holds a final, a rub-down, a press hour AND the flight – all four', () => {
    // ⚠ MUTATION: delete the `else out[out.length - 1] = addEveningReturn(...)` arm and this reddens
    // with three blocks instead of four.
    const day = lastDay(trip('slam', withMasseur(DAILY, true)))
    expect(day.map((b) => b.label), 'his own order: matches, massage, conferences, then home').toEqual([
      'Draw day', 'Body work', 'Press', 'Travel home',
    ])
  })

  it('⚠⚠ ...and all four FIT the grid\'s own hours, with nothing shortened to make room', () => {
    // The compression he has twice refused. Every block keeps the span it has on every other match
    // day of the same trip, and the day ends exactly on the grid's last hour rather than past it.
    const day = lastDay(trip('slam', withMasseur(DAILY, true)))
    const midweek = gridOf(trip('slam', withMasseur(DAILY, true)))[0].blocks
    for (const kind of ['tournament', 'physio', 'press'] as BlockKind[]) {
      const onSunday = day.find((b) => b.kind === kind)!
      const onMonday = midweek.find((b) => b.kind === kind)!
      expect(onSunday.span, `the ${kind} hour was shortened for the flight`).toBe(onMonday.span)
      expect(onSunday.start, `the ${kind} hour was moved for the flight`).toBe(onMonday.start)
    }
    const flight = day.find((b) => b.label === 'Travel home')!
    expect(flight.start, 'the flight starts before the press hour is over').toBe(16)
    expect(flight.start + flight.span, 'the day runs past the end of the grid').toBe(19)
    expect(flight.span, 'an evening flight, which is what a flight home after a final is').toBeGreaterThan(0)
  })

  it('the evening it takes is whatever the day left it, at every combination', () => {
    // Four arms, because the Sunday's content varies with the hire and the rung: the flight is the
    // rest of the evening in each, and never less than nothing.
    const arms: [string, CalendarWeekFacts, number][] = [
      ['a final, nothing else', trip('slam'), 15],
      ['a final and the table', trip('slam', withMasseur(DAILY, true)), 16],
    ]
    for (const [what, f, start] of arms) {
      const flight = lastDay(f).find((b) => b.label === 'Travel home')!
      expect(flight.start, `${what}: the flight is in the wrong hour`).toBe(start)
      expect(flight.start + flight.span, `${what}: the flight does not run to the evening`).toBe(19)
    }
  })

  it('⚠ the 1000 keeps a whole DAY for the journey – that is his other arm, not this one', () => {
    // «либо снова в Вс (если был 1000)» is a travel DAY; only the Slam's evening comes through
    // `addEveningReturn`. ⚠ MUTATION: change `tripKeepsReturn` to `rounds + 1 < WEEK_DAYS` and the
    // 1000 loses its Sunday to a match day, which this catches.
    const sunday = lastDay(trip('wta1000', withMasseur(DAILY, true)))
    expect(sunday.map((b) => b.label)).toEqual(['Travel home'])
    expect(sunday.some((b) => b.kind === 'tournament'), 'the 1000 played on its travel day').toBe(false)
  })

  it('⚠ no other rung grew an evening flight on a match day', () => {
    // The rule is the Slam's alone among shipped rungs, and this is what says so: everywhere else the
    // journey home has a day to itself and no match day carries travel.
    for (const tier of RUNGS) {
      if (!tripKeepsReturn(tripRoundsFor(tier))) continue
      for (const day of gridOf(trip(tier, withMasseur(DAILY, true)))) {
        const mixed = day.blocks.some((b) => b.kind === 'tournament') && day.blocks.some((b) => b.kind === 'travel')
        expect(mixed, `${tier}/${day.short}: a match day grew a flight it does not need`).toBe(false)
      }
    }
  })

  it('⚠⚠ the "no evening left" branch is UNREACHABLE, and its PREMISE is what is pinned', () => {
    // ⚠ HONEST ABOUT WHAT THIS IS. `addEveningReturn` declines when the day already runs to the end
    // of the grid, and nothing can produce that today – a match day ends at 16:00 at the very most –
    // so deleting that guard changes no behaviour and NO test can redden on it. I ran that mutation
    // and it stayed green, which is the definition of a dead guard, so this asserts the premise
    // instead of pretending to cover the branch: no day of any rung ends late enough to need it.
    // ⚠ MUTATION: give `TRIP_PRESS` a span of 4 and this reddens, which is exactly the commit on
    // which that branch would start mattering.
    for (const tier of RUNGS) {
      for (const day of gridOf(trip(tier, withMasseur(DAILY, true)))) {
        const ends = day.blocks.filter((b) => b.kind !== 'travel').map((b) => b.start + b.span)
        const end = ends.length === 0 ? 7 : Math.max(...ends)
        expect(end, `${tier}/${day.short}: no evening left to fly home in`).toBeLessThan(19)
      }
    }
  })

  it('⚠⚠ AND NO NEIGHBOUR IS ASKED FOR THE RETURN – the lookback is gone, not hidden', () => {
    // The property that closes P16: the whole trip is inside its own week, so `nextTripRounds` (the
    // one thing this screen hands its neighbour) is still only ever about a DEPARTURE. A Slam week
    // asks nothing of anybody, and a week after a Slam is an ordinary week with nothing borrowed.
    expect(weekOf(trip('slam')).nextTripRounds, 'a trip week started lending days again').toBeNull()
    const plainAfter = gridOf(facts({ schoolEndsWeek: 0 }), WEEK + 1)
    expect(plainAfter[0].blocks.some((b) => b.kind === 'travel'), 'a Monday grew a flight from nowhere').toBe(false)
  })
})

// =================================================================================================
// §3 – P13: THE MASSAGE, AFTER THE MATCHES
// =================================================================================================
//
// ⚠⚠ WHAT WAS WRONG, MEASURED ON THE SHIPPED BUILD BEFORE THIS. The tour week laid the WEEKLY rung's
// table over `planDays` – the training plan the trip does not spend – so at the entry rung his two
// sessions landed on the Monday (travel out) and the Tuesday (the practice hit) and NOT ONE fell on a
// match day. At the middle rung two of the four match days were missed. The owner asked for «сессии
// массажа после матчей», and the money already agreed with him: `resolveMasseur` stands the weekly
// bill DOWN on the week he boards and `masseurTourWeekCents` charges MATCHES PLAYED instead.
describe('round 29 P13 – the masseur works the match days', () => {
  it('⚠⚠ every session he draws on tour is on a day she plays', () => {
    // ⚠ MUTATION: put `masseurDays: masseurDaysFor(masseurSessions, planDays)` back on the trip
    // branch of `calendarWeekFor` – the shipped defect – and this reddens at every rung, because his
    // table reappears on the travel day and the practice day.
    for (const tier of RUNGS) {
      for (const rung of ECONOMY.masseur.rungs) {
        const grid = gridOf(trip(tier, withMasseur(rung.sessions, true)))
        const table = daysWith(grid, 'physio')
        const play = daysWith(grid, 'tournament')
        expect(table, `${tier} at ${rung.sessions}/wk: his table is not on the match days`).toEqual(play)
      }
    }
  })

  it('...one session per match day, and the count is the one the ledger bills', () => {
    // ⭐ FOLLOW THE MONEY. The rung buys nothing on tour – the weekly bill stands down – so the
    // drawn count is the MATCH count, which is exactly the count `masseurTourWeekCents` prices.
    for (const tier of RUNGS) {
      const grid = gridOf(trip(tier, withMasseur(DAILY, true)))
      const sessions = countKind(grid, 'physio')
      expect(sessions, tier).toBe(tripRoundsFor(tier))
      expect(masseurTourWeekCents(sessions), `${tier}: the picture and the bill are different sums`).toBe(
        sessions * ECONOMY.masseur.perSessionCents,
      )
    }
  })

  it('⚠ the RUNG does not change a tour week, because the engine does not read it there', () => {
    // The entry rung and the daily rung draw the same tour week. That is not an oversight: on the
    // week he boards the dial buys nothing at all, and a picture that showed 2 against 7 would be
    // promising a difference the ledger does not make.
    const entry = gridOf(trip('wta1000', withMasseur(ENTRY, true)))
    const daily = gridOf(trip('wta1000', withMasseur(DAILY, true)))
    expect(countKind(entry, 'physio')).toBe(countKind(daily, 'physio'))
    expect(countKind(entry, 'physio'), 'six match days at a 1000').toBe(6)
  })

  it('⚠ AFTER the match, never before it', () => {
    for (const tier of RUNGS) {
      for (const day of gridOf(trip(tier, withMasseur(DAILY, true)))) {
        const draw = day.blocks.find((b) => b.kind === 'tournament')
        const table = day.blocks.find((b) => b.kind === 'physio')
        if (!table) continue
        expect(draw, `${tier}/${day.short}: a rub-down on a day with no match`).toBeDefined()
        expect(table.start, `${tier}/${day.short}: the table is before the match`).toBeGreaterThanOrEqual(
          draw!.start + draw!.span,
        )
      }
    }
  })

  it('⚠ a masseur who stays home draws nothing – the retainer runs and the table does not', () => {
    // The engine's own asymmetry, kept: `resolveMasseur` charges the weekly salary on a tournament
    // week he stays home from, and the calendar draws no table for it, which is the truth about both.
    for (const tier of RUNGS) {
      expect(countKind(gridOf(trip(tier, withMasseur(DAILY, false))), 'physio'), tier).toBe(0)
    }
    // ...and so does a family that never hired one.
    expect(countKind(gridOf(trip('slam')), 'physio')).toBe(0)
  })

  it('⚠ the HOME week is untouched – his rung still buys the days the plan bought', () => {
    // The round-28 rule this item must not have broken: on a week she is not away, the table follows
    // the plan and the drawn count is the rung's.
    const home = weekOf(facts(withMasseur(ENTRY, true)))
    expect(home.masseurDays.length, 'the weekly rung stopped drawing at home').toBe(ENTRY)
    expect(countKind(gridOf(facts(withMasseur(DAILY, true))), 'physio')).toBe(DAILY)
  })
})

// =================================================================================================
// §4 – P14: THE PRESS ROOM, WHERE THERE IS ONE
// =================================================================================================
describe('round 29 P14 – the press conference, at the rungs that hold one', () => {
  it('⚠⚠ the WTA main tour holds one and nothing below it does', () => {
    // ⚠ MUTATION: move `PRESS_FROM_TIER` down to 'w15' and the second half of this reddens; move it
    // up to 'slam' and the first half does.
    const holds = RUNGS.filter((t) => tierHoldsPress(t))
    expect(holds, 'the cut is not the WTA main tour').toEqual(['wta250', 'wta500', 'wta1000', 'slam'])
    expect(PRESS_FROM_TIER).toBe('wta250')
  })

  it('...and the GRID agrees with the rule, rung by rung', () => {
    for (const tier of RUNGS) {
      const drawn = countKind(gridOf(trip(tier)), 'press')
      expect(drawn > 0, `${tier}: the grid and \`tierHoldsPress\` disagree`).toBe(tierHoldsPress(tier))
      // where there is a press room there is one conference per match day, and nowhere else
      expect(drawn, tier).toBe(tierHoldsPress(tier) ? tripRoundsFor(tier) : 0)
      expect(daysWith(gridOf(trip(tier)), 'press')).toEqual(
        tierHoldsPress(tier) ? daysWith(gridOf(trip(tier)), 'tournament') : [],
      )
    }
  })

  it('⚠ the sweep is not satisfied by "everybody" or "nobody"', () => {
    const yes = RUNGS.filter((t) => tierHoldsPress(t)).length
    expect(yes, 'every rung answers the same way, so the sweep proves nothing').toBeGreaterThan(0)
    expect(yes).toBeLessThan(RUNGS.length)
  })

  it('⚠ it follows the match, in the order the OWNER named – draw, table, press', () => {
    // ⚠ RE-AIMED (P16): the first draft asserted the press hour sat directly on the draw block, on my
    // own reasoning that a real conference follows a match within the half-hour. His sentence closing
    // the return lists them in his order – «после матчей, массажа и конференций» – so the table comes
    // first and this asserts HIS sequence rather than mine. ⚠ MUTATION: swap the two pushes in
    // `tripMatchDay` and this reddens on the masseur arm while the no-masseur arm stays green, which
    // is why both arms are here.
    for (const day of gridOf(trip('slam'))) {
      const draw = day.blocks.find((b) => b.kind === 'tournament')!
      const press = day.blocks.find((b) => b.kind === 'press')!
      expect(press.start, 'a press conference before the match').toBe(draw.start + draw.span)
      expect(press.span).toBe(1)
    }
    for (const day of gridOf(trip('slam', withMasseur(DAILY, true)))) {
      const draw = day.blocks.find((b) => b.kind === 'tournament')!
      const table = day.blocks.find((b) => b.kind === 'physio')!
      const press = day.blocks.find((b) => b.kind === 'press')!
      expect(table.start, 'the table is not straight off the court').toBe(draw.start + draw.span)
      expect(press.start, 'the microphone came before the table').toBe(table.start + table.span)
    }
  })

  it('⚠⚠ IT IS FLAVOUR: it costs nothing and changes nothing about the week', () => {
    // The item's own boundary. A WTA 500 and a WTA 250 differ from a W100 in exactly one way here –
    // the press blocks – and in nothing else: same title, same sentence under the grid, same trip
    // length, same masseur days, same animation verdict.
    const quiet = weekOf(trip('wta125', withMasseur(DAILY, true)))
    const loud = weekOf(trip('wta250', withMasseur(DAILY, true)))
    expect(loud.title).toBe(quiet.title)
    expect(loud.masseurDays).toEqual(quiet.masseurDays)
    expect(loud.animates).toBe(quiet.animates)
    expect(loud.trip!.rounds, 'the two rungs are the same length of week').toBe(quiet.trip!.rounds)
    // ...and the grids differ by the press blocks and by the hour the table moved into behind them.
    const kinds = (t: TierId) =>
      blocksOf(gridOf(trip(t, withMasseur(DAILY, true)))).map((b) => b.kind).filter((k) => k !== 'press')
    expect(kinds('wta250')).toEqual(kinds('wta125'))
  })
})

// =================================================================================================
// §5 – THE HOUSE RULES, OVER EVERY NEW BLOCK
// =================================================================================================
describe('round 29 P13/P14/P15 – player copy', () => {
  it('every label on every trip: no Cyrillic, the short dash only, no word over six characters', () => {
    // The measured layout rule (a block is ~35px at 375pt and a longer word breaks mid-syllable) and
    // the house language rule, swept over every rung and both new blocks.
    for (const tier of RUNGS) {
      for (const blocks of [
        blocksOf(gridOf(trip(tier))),
        blocksOf(gridOf(trip(tier, withMasseur(DAILY, true)))),
      ]) {
        for (const b of blocks) {
          expect(b.label.trim().length, `${tier}: an empty label`).toBeGreaterThan(0)
          expect(b.label, `${tier}: "${b.label}" has Cyrillic in it`).not.toMatch(/[Ѐ-ӿ]/)
          expect(b.label, `${tier}: "${b.label}" uses the long dash`).not.toContain('—')
          for (const word of b.label.split(/[\s–-]+/)) {
            expect(word.length, `${tier}: "${word}" in "${b.label}" is too long for the column`).toBeLessThanOrEqual(6)
          }
        }
      }
    }
  })

  it('no block of any trip falls outside the grid\'s own hours', () => {
    for (const tier of RUNGS) {
      for (const b of blocksOf(gridOf(trip(tier, withMasseur(DAILY, true))))) {
        expect(b.start, `${tier}: "${b.label}" starts before the grid`).toBeGreaterThanOrEqual(7)
        expect(b.start + b.span, `${tier}: "${b.label}" runs past the grid`).toBeLessThanOrEqual(19)
      }
    }
  })

  it('⚠ and no two blocks of one day overlap, at any rung, with both extras on', () => {
    for (const tier of RUNGS) {
      for (const day of gridOf(trip(tier, withMasseur(DAILY, true)))) {
        for (const a of day.blocks) {
          for (const b of day.blocks) {
            if (a === b) continue
            expect(a.start + a.span <= b.start || b.start + b.span <= a.start, `${tier}/${day.short}`).toBe(true)
          }
        }
      }
    }
  })

  it('the two "nobody said" defaults are the catalogue\'s number, not one somebody picked', () => {
    // `TRIP_DEFAULT` (the grid, asked with no trip facts) and `TRIP_ROUNDS_FALLBACK` (the composable,
    // handed a tier the catalogue does not know) must both be the common week. Tied to the ladder so
    // neither can drift into being a hand-typed 5.
    expect(TRIP_DEFAULT.rounds).toBe(tripRoundsFor('w15'))
    expect(TRIP_ROUNDS_FALLBACK).toBe(tripRoundsFor('w15'))
    expect(TRIP_DEFAULT.masseur, 'a caller who said nothing must not be given a masseur').toBe(false)
    expect(TRIP_DEFAULT.press, 'a caller who said nothing must not be given a press room').toBe(false)
    expect(tripRoundsFor('made-up-rung' as TierId), 'an unknown rung throws instead of degrading').toBe(
      TRIP_ROUNDS_FALLBACK,
    )
  })
})

// =================================================================================================
// §6 – ON THE SCREEN, WHICH IS WHERE HE IS LOOKING
// =================================================================================================
//
// The composable tests above are values; these two are the rendered grid, because "it is in the
// composable" is one layer short of the surface the owner reads.
describe('round 29 P13/P14 – the Calendar tab draws both', () => {
  function mountAt(tier: TierId, sessions: number, travels: boolean) {
    const world = createWorld('r29-trip-screen', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = WEEK - 1
    world.bestFinishByTier.w15 = 0
    hireMasseur(world, true)
    setMasseurSessions(world, sessions)
    setMasseurTravels(world, travels)
    const snap: Snapshot = {
      ...toSnapshot(world),
      arrival: { eventId: 'e-screen', tier, week: WEEK, verdict: 'play', outgrown: false },
    }
    useGameStore().snapshot = snap
    return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
  }
  const saying = (w: ReturnType<typeof mount>, text: string) =>
    w.findAll('.cal-block').filter((b) => b.text() === text).length

  it('a Slam week: seven match days, seven press conferences, seven rub-downs', () => {
    const wrapper = mountAt('slam', DAILY, true)
    expect(saying(wrapper, 'Draw day')).toBe(7)
    expect(saying(wrapper, 'Press')).toBe(7)
    expect(saying(wrapper, 'Body work')).toBe(7)
    expect(wrapper.findAll('.cal-block--press').length, 'the press block has no colour rule').toBe(7)
    // ⭐ P16 – ...and she flies home on the Sunday evening, after all three.
    expect(saying(wrapper, 'Travel home'), 'the Slam week never brings her home').toBe(1)
    wrapper.unmount()
  })

  it('a W15 week: five match days, five rub-downs and no press room at all', () => {
    const wrapper = mountAt('w15', ENTRY, true)
    expect(saying(wrapper, 'Draw day')).toBe(5)
    expect(saying(wrapper, 'Press'), 'a W15 in a municipal park held a press conference').toBe(0)
    expect(saying(wrapper, 'Body work'), 'the entry rung missed three of her five matches').toBe(5)
    wrapper.unmount()
  })
})
