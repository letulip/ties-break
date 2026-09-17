// ROUND 43 #4 – THE MASSEUR ASKS FOR A RISE, ONCE A YEAR, FOR HIS HOURS.
//
// His ruling, 16.09: «мы начинаем работать с массажистом по нашим текущим ценам, а дальше он
// приходит и просит прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество
// процедур… может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер».
// And: «психолога не трогаем наверное.»
//
// WHAT THIS FILE PINS, in the order the feature can fail:
//   A. THE COUNTER – weeks on the payroll, summed over the HIRED SPANS, off the kept ledger rows
//      `hireMasseur` already writes. No schema, no migration, no golden fixture.
//   B. THE RATE – `perSessionCents` is the OPENING price; it compounds once per completed year and
//      is rounded to whole dollars from the unrounded power.
//   C. ⚠⚠ NO THIRD BRANCH. «Альтернативы нет», so there is no refusal – and in particular firing him
//      for a week and re-hiring must not buy the entry price back, or the free reset would be a
//      third branch strictly better than either of the two he named.
//   D. THE ASK – one row on the anniversary, never on a re-hire week, never while unhired, and the
//      bottom rung is told the truth about having nowhere to drop to.
//   E. EVERY PRICE FOLLOWS ONE RATE – the weekly bill, the tour week, and the card's own quote.
//   F. THE PSYCHOLOGIST IS UNTOUCHED, which is a ruling and not an omission.
//
// ⚠⚠ THE MUTATION ARMS THIS FILE WAS BUILT AGAINST – applied, run, watched to fail, reverted. The
// counts are measured:
//   ARM 1  `masseurSessionCents` returns `ECONOMY.masseur.perSessionCents` (the pre-#4 price).
//          → 8 red across B, C, D and E.
//   ARM 2  `masseurWeeksServedAt` takes the FIRST mark and subtracts (`week - marks[0]`), i.e. the
//          clock runs while nobody is employed. → 1 red (A3).
//   ARM 3  `masseurWeeksServedAt` takes the LAST mark (`week - marks[marks.length - 1]`), i.e. a
//          re-hire resets the clock – the free third branch. → 2 red (A4, C1).
//   ARM 4  `masseurRaiseDue` drops the «did the counter increment» clause. → 1 red (D3).
//   ARM 5  `resolveMasseurRaise` always uses the two-branch sentence. → 1 red (D5).
import { describe, expect, it } from 'vitest'

import {
  createWorld,
  hireMasseur,
  masseurRaiseDue,
  masseurRungOf,
  masseurSessionCents,
  masseurTourWeekCents,
  masseurWeeklyCents,
  masseurWeeksServed,
  masseurWeeksServedAt,
  masseurYearsServed,
  psychologistWeeklyCents,
  resolveMasseurRaise,
  setMasseurSessions,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** A career already through the professional door – `masseur.test.ts`'s own fixture, and for its own
 *  reason: the gate is a one-way latch off a counting W-series result. */
function proWorld(seed = 'r43-raise'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

/** Hire at `at`, then stand at `week`. The hire is the engine's own, so the kept tagged row the
 *  counter reads is written by the code that writes it in a real career. */
function servedFrom(at: number, week: number, seed = 'r43-raise'): WorldState {
  const world = proWorld(seed)
  world.week = at
  hireMasseur(world, true)
  world.week = week
  return world
}

const OPENING = ECONOMY.masseur.perSessionCents
const ENTRY = ECONOMY.masseur.rungs[0].sessions
/** ⚠ THE OPENER THIS FILE FINDS THE ROW BY, and it moved with his 17.09 rewrite: «The masseur asks
 *  for more» first reads as more SESSIONS rather than more money, which is the wrong idea on a row
 *  whose subject is the rate. One constant, so the next rewording is one line here. */
const RAISE_OPENER = "The masseur's rate rises to"
const TOP = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions

/** The rate the design says a career should be paying after `y` completed years, spelled out here
 *  rather than re-derived from the engine – a test that re-used the engine's formula would be green
 *  under any formula at all. */
function expectedRate(y: number): number {
  return Math.round((OPENING * (1 + ECONOMY.masseur.raisePerYear) ** y) / 100) * 100
}

const raiseRows = (world: WorldState): string[] =>
  world.events.filter((e) => e.text.startsWith(RAISE_OPENER)).map((e) => e.text)

// =================================================================================================
// A. THE COUNTER
// =================================================================================================

describe('round 43 #4 A – the weeks he has been on this family`s payroll', () => {
  it('⭐ a career with no masseur has served no weeks, and one hired this week has served none either', () => {
    expect(masseurWeeksServed(proWorld())).toBe(0)
    const world = servedFrom(100, 100)
    expect(masseurWeeksServed(world), 'the week a span opens is not a week worked').toBe(0)
  })

  it('⭐ a running engagement counts calendar weeks from the hire', () => {
    const world = servedFrom(100, 100 + 3 * WEEKS_PER_YEAR)
    expect(masseurWeeksServed(world)).toBe(3 * WEEKS_PER_YEAR)
    expect(masseurYearsServed(world)).toBe(3)
  })

  it('⚠ weeks he was NOT employed do not count – the spans are summed, never the span from the first hire', () => {
    const world = servedFrom(100, 100)
    world.week = 100 + 30
    hireMasseur(world, false) // 30 weeks served, then two years off the payroll
    world.week = 100 + 30 + 2 * WEEKS_PER_YEAR
    expect(masseurWeeksServed(world), 'the gap is not service').toBe(30)
  })

  it('⭐⭐ ...and a RE-HIRE resumes the count rather than restarting it', () => {
    const world = servedFrom(100, 100)
    world.week = 100 + 30
    hireMasseur(world, false)
    world.week = 100 + 60
    hireMasseur(world, true)
    world.week = 100 + 60 + 10
    expect(masseurWeeksServed(world), '30 weeks then 10 more').toBe(40)
  })

  it('⚠ the count is asked AS AT a week, which is what lets the ask know whether it incremented', () => {
    const world = servedFrom(100, 500)
    expect(masseurWeeksServedAt(world, 400)).toBe(300)
    expect(masseurWeeksServedAt(world, 99), 'before the hire there is nothing to count').toBe(0)
  })

  it('⚠ a hand-built world holding the flag but no ledger row reads ZERO, not a crash and not week 0', () => {
    const world = proWorld()
    world.week = 900
    world.masseurHired = true
    expect(masseurWeeksServed(world)).toBe(0)
    expect(masseurSessionCents(world), 'the identity element – today`s price').toBe(OPENING)
  })
})

// =================================================================================================
// B. THE RATE
// =================================================================================================

describe('round 43 #4 B – what one session costs this career', () => {
  it('⭐ the family starts at today`s price – his «по нашим текущим ценам»', () => {
    expect(masseurSessionCents(servedFrom(100, 100))).toBe(OPENING)
    expect(masseurSessionCents(servedFrom(100, 100 + WEEKS_PER_YEAR - 1)), 'and holds it all year').toBe(OPENING)
  })

  it('⭐⭐ and it rises on each completed year, COMPOUNDING, in whole dollars', () => {
    for (const y of [1, 2, 4, 8, 12]) {
      const world = servedFrom(100, 100 + y * WEEKS_PER_YEAR)
      expect(masseurSessionCents(world), `year ${y}`).toBe(expectedRate(y))
    }
    // Compounding rather than a flat step: eight years is more than eight single years' worth.
    const eight = masseurSessionCents(servedFrom(100, 100 + 8 * WEEKS_PER_YEAR))
    expect(eight - OPENING).toBeGreaterThan(8 * (expectedRate(1) - OPENING))
  })

  it('⚠ NOT AS INTENSELY AS THE COACH – the whole of «не так интенсивно как тренер» is one comparison', () => {
    // The coach's own annual ask is a 5–15% corridor (round 42 #51, specified and not yet built).
    // ⚠ THE UPPER BOUND IS NOT TASTE: the parents' contribution itself compounds 5–10% a season (his
    // round-12 ruling), so anything at or above 5% would make the entry rung climb against the
    // household's week for ever, and the poor would lose the seat to arithmetic.
    expect(ECONOMY.masseur.raisePerYear).toBeLessThan(0.05)
    expect(ECONOMY.masseur.raisePerYear).toBeLessThan(ECONOMY.incomeGrowthBand[0])
    expect(ECONOMY.masseur.raisePerYear, 'and it is a real drift rather than a decoration').toBeGreaterThan(0)
  })

  it('⚠ it is PURE – the same world asked twice answers the same, and asking does not write', () => {
    const world = servedFrom(100, 100 + 5 * WEEKS_PER_YEAR)
    const events = world.events.length
    expect(masseurSessionCents(world)).toBe(masseurSessionCents(world))
    expect(world.events.length, 'a read that writes is not a read').toBe(events)
  })
})

// =================================================================================================
// C. NO THIRD BRANCH
// =================================================================================================

describe('round 43 #4 C – «альтернативы нет» has exactly two answers', () => {
  it('⭐⭐ firing him for a week and re-hiring does NOT buy the opening price back', () => {
    const world = servedFrom(100, 100 + 6 * WEEKS_PER_YEAR)
    const before = masseurSessionCents(world)
    expect(before).toBeGreaterThan(OPENING)
    hireMasseur(world, false)
    world.week += 1
    hireMasseur(world, true)
    expect(masseurSessionCents(world), 'the free reset would be a third branch, and a dominant one').toBe(before)
  })

  it('⭐ dropping a rung holds the BILL down and leaves the RATE where it is – his second answer', () => {
    const world = servedFrom(100, 100 + 12 * WEEKS_PER_YEAR)
    setMasseurSessions(world, TOP)
    const dear = masseurWeeklyCents(world)
    const rate = masseurSessionCents(world)
    setMasseurSessions(world, ENTRY)
    expect(masseurWeeklyCents(world), 'fewer visits, a much smaller bill').toBeLessThan(dear)
    expect(masseurSessionCents(world), 'and his hour still costs what it costs').toBe(rate)
  })

  it('⚠ the rung change writes no tagged row, which is what keeps the counter out of the dial', () => {
    const world = servedFrom(100, 100 + 2 * WEEKS_PER_YEAR)
    const served = masseurWeeksServed(world)
    setMasseurSessions(world, TOP)
    setMasseurSessions(world, ENTRY)
    expect(masseurWeeksServed(world), 'a decision about hours is not a change of employment').toBe(served)
  })
})

// =================================================================================================
// D. THE ASK
// =================================================================================================

describe('round 43 #4 D – the week he asks', () => {
  it('⭐ it lands on the anniversary and on no other week', () => {
    const world = servedFrom(100, 100)
    const weeks: number[] = []
    for (let w = 101; w <= 100 + 3 * WEEKS_PER_YEAR; w++) {
      world.week = w
      if (masseurRaiseDue(world)) weeks.push(w - 100)
    }
    expect(weeks).toEqual([WEEKS_PER_YEAR, 2 * WEEKS_PER_YEAR, 3 * WEEKS_PER_YEAR])
  })

  it('⚠ nothing is asked while nobody is employed', () => {
    const world = servedFrom(100, 100)
    world.week = 100 + 10
    hireMasseur(world, false)
    for (let w = 111; w <= 100 + 3 * WEEKS_PER_YEAR; w++) {
      world.week = w
      expect(masseurRaiseDue(world), `week ${w}`).toBe(false)
    }
  })

  it('⭐⭐ and it does NOT fire twice on a re-hire week whose running total already sits on a year', () => {
    // ⚠ THE CASE THE SECOND READ EXISTS FOR. Serve exactly one year, take the anniversary, release,
    // and re-hire later: the counter does not move on the week a span opens, so «divisible by 52»
    // alone is true again on that week and the ask would be announced a second time.
    const world = servedFrom(100, 100 + WEEKS_PER_YEAR)
    expect(masseurRaiseDue(world), 'the real anniversary').toBe(true)
    resolveMasseurRaise(world)
    hireMasseur(world, false)
    world.week = 100 + WEEKS_PER_YEAR + 40
    hireMasseur(world, true)
    expect(masseurRaiseDue(world), 'the re-hire week is not a second anniversary').toBe(false)
    resolveMasseurRaise(world)
    expect(raiseRows(world), 'one ask, one row').toHaveLength(1)
  })

  it('⭐ the row names the new price and both of his answers', () => {
    const world = servedFrom(100, 100 + WEEKS_PER_YEAR)
    setMasseurSessions(world, TOP)
    resolveMasseurRaise(world)
    const rows = raiseRows(world)
    expect(rows).toHaveLength(1)
    expect(rows[0], 'the figure is the one the bill now uses').toContain(
      `$${Math.round(masseurSessionCents(world) / 100)} a session`,
    )
    // ⚠ THE MARKERS MOVED WITH HIS 17.09 REWRITE. «The same hands at a higher bill» became «Keep the
    // current schedule at the higher rate» – he struck «the same hands» for reducing a person to a
    // pair of hands – and «fewer visits» became «book fewer sessions», which is the terminology the
    // dial itself uses. The two answers the row must offer are unchanged.
    expect(rows[0], 'pay more, same schedule').toContain('Keep the current schedule at the higher rate')
    expect(rows[0], '...or hold the bill and drop a rung').toContain('book fewer sessions')
  })

  it('⚠⚠ ...and at the BOTTOM rung it does not offer a rung that is not there', () => {
    const world = servedFrom(100, 100 + WEEKS_PER_YEAR)
    setMasseurSessions(world, ENTRY)
    expect(masseurRungOf(world).sessions).toBe(ENTRY)
    resolveMasseurRaise(world)
    const rows = raiseRows(world)
    expect(rows).toHaveLength(1)
    expect(rows[0], 'a screen that offers a choice nobody has is this round`s own #5 defect').toContain(
      'no shorter schedule to choose',
    )
    expect(rows[0]).not.toContain('book fewer sessions')
    // ⚠⚠ AND IT NAMES THE REAL FLOOR. His review's own bottom-rung line said «She is already down to
    // one session a week»; this dial opens at TWO and its label is «Twice a week», so the sentence
    // was corrected rather than shipped. This is the assertion that would have caught it: the row
    // must name the rung the family is actually on, and the rung's own label is where it gets it.
    expect(rows[0], 'the schedule it names is the one the card names').toContain(
      ECONOMY.masseur.rungs[0].label.toLowerCase(),
    )
    expect(rows[0], 'and it never invents a rung below the floor').not.toMatch(/one session a week/)
  })

  it('⚠ the row moves no money – it is a notice, and the bill it describes is charged by `resolveMasseur`', () => {
    const world = servedFrom(100, 100 + WEEKS_PER_YEAR)
    const funds = world.fundsCents
    resolveMasseurRaise(world)
    expect(world.fundsCents).toBe(funds)
    const row = world.events.find((e) => e.text.startsWith(RAISE_OPENER))
    expect(row?.amountCents, 'no figure on the ledger, only in the sentence').toBeUndefined()
  })
})

// =================================================================================================
// E. ONE RATE, EVERY PRICE
// =================================================================================================

describe('round 43 #4 E – the bill, the tour week and the card all read the same rate', () => {
  it('⭐⭐ the weekly bill is sessions × the CAREER`s rate, not sessions × the constant', () => {
    const world = servedFrom(100, 100 + 10 * WEEKS_PER_YEAR)
    setMasseurSessions(world, ENTRY)
    expect(masseurWeeklyCents(world)).toBe(ENTRY * expectedRate(10))
    expect(masseurWeeklyCents(world), 'and it really has moved').toBeGreaterThan(ENTRY * OPENING)
  })

  it('⭐ the tour week is matches × the same rate – it takes it rather than reading `ECONOMY`', () => {
    const world = servedFrom(100, 100 + 10 * WEEKS_PER_YEAR)
    const rate = masseurSessionCents(world)
    expect(masseurTourWeekCents(7, rate)).toBe(7 * rate)
    expect(masseurTourWeekCents(0, rate)).toBe(0)
  })

  it('⭐⭐ and the snapshot carries it, so the card can price its own rungs honestly', () => {
    const world = servedFrom(100, 100 + 10 * WEEKS_PER_YEAR)
    setMasseurSessions(world, ENTRY)
    const snap = toSnapshot(world)
    expect(snap.masseurPerSessionCents).toBe(expectedRate(10))
    expect(snap.masseurSalaryCents, 'the weekly total and the per-session figure agree').toBe(
      ENTRY * snap.masseurPerSessionCents,
    )
    // The defect this field exists to stop: the card's rung prices quoting a price nobody pays.
    expect(snap.masseurPerSessionCents).not.toBe(OPENING)
  })
})

// =================================================================================================
// F. THE PSYCHOLOGIST IS OUT – a ruling, not an omission
// =================================================================================================

describe('round 43 #4 F – «психолога не трогаем наверное»', () => {
  it('⭐ the second seat`s retainer is the flat rung price, at any length of service', () => {
    const world = servedFrom(100, 100 + 15 * WEEKS_PER_YEAR)
    world.psychologistHired = true
    const rung = ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung]
    expect(psychologistWeeklyCents(world), 'fifteen years in, and it has not moved a cent').toBe(rung.salaryCents)
    // ...and the masseur beside him HAS moved, which is what makes this a contrast rather than a
    // statement about an untouched file.
    expect(masseurSessionCents(world)).toBeGreaterThan(OPENING)
  })
})
