// ROUND 45 #3b – THE RAISE REQUEST'S SIZE FLOATS WITH THE YEAR, AND THE COACH ASKS TOO.
//
// THE OWNER, 02.10: «мы обсуждали, что там может быть плавающая вилка. тренер тоже вполне может
// просить повышения – с удачных лет по-больше, с неудачных по-меньше, как и все остальные». Repeated
// refusals KEEP the 17.09 «no third branch» ruling: nobody leaves, nobody is punished.
//
// WHAT THIS FILE PINS, in the order the feature can fail:
//   A. THE ONE VERDICT – «was her last year good» (`staffYearVerdict`), derived from the banked season
//      rows (the same facts the staff's year-end letters print), the same answer for every seat.
//   B. THE STEP – good 6% / flat 4% / bad 2%. ⚠ DEFAULTED PARAMETERS: the owner picks the figures later, so
//      the literals below name what the defaults produce and a retune says what moved.
//   C. PER SEAT, a GOOD year's request is bigger than a BAD year's (both arms built, one world each).
//   D. THE CHAIN – the fee is the chain of signed papers: sign two with different steps and the fee is the
//      second paper's `toCents`; a refused paper is not in it; a rung switch keeps the drift.
//   E. THE LEGACY BASELINE – a masseur who was already paying years of silent raises keeps every one of
//      them: the rate the exponent gives when his FIRST paper is written is that paper's `fromCents`.
//   F. THE COACH CONVERTS – a letter on his own cadence, Accept moves the ONE stored fee (and the bill, the
//      card and the market's own row read it), Decline and a lapse leave it, a paper cannot outlive the
//      arrangement, and the AUTOMATIC rise of round 42 is dead.
//
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, docs/rounds/round-45.md «R45 – DRAFT strings»); the
// assertions are about structure and figures, never a whole sentence.
//
// ⚠⚠ MUTATION-VERIFIED – each arm applied, run, WATCHED TO FAIL, reverted (the hand-back lists the counts):
//   M1  `staffYearVerdict` returns the opposite of what it found (good ⇄ bad).
//   M2  `staffDriftFactor` reads the FIRST signed paper and not the chain (the latest is ignored).
//   M3  `resolveCoachRaise` applies the rise itself again (the round-42 automatic re-strike).
//   M4  `staffRaiseStep` ignores the verdict (the flat 4% for every year).
//   M5  `coachRaiseStands` is always true (a paper outlives the arrangement it was written for).
//   M6  `settleCoachRaise` writes nothing (Accept signs the paper and the fee does not move).
//   M7  the masseur's baseline reads `asking` instead of `asking − 1` (the first paper prices his own
//       anniversary into the rate he is paid before it is agreed).
import { describe, expect, it } from 'vitest'

import {
  acceptOffer,
  ageAtWeek,
  coachBilling,
  coachMarket,
  coachMarketLabourCents,
  coachRateCents,
  createWorld,
  declineOffer,
  hireCoach,
  hireMasseur,
  hirePsychologist,
  hireSparring,
  masseurSessionCents,
  psychologistWeeklyCents,
  resolveCoachRaise,
  resolveMasseurRaise,
  settleCoachDeal,
  sparringWeeklyCents,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { resolvePsychologistRaise, psychologistRungWeeklyCents } from '../src/engine/world/psychologist'
import { resolveSparringRaise, sparringRungWeeklyCents } from '../src/engine/world/sparring'
import { STAFF_RAISE_STEPS, staffRaiseStep, staffYearVerdict, type StaffYearVerdict } from '../src/engine/world/staffRaise'
import { coachById } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { expireOffers, staffAskId, staffAsks } from '../src/engine/offers'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type CoachTier, type SeasonHistoryEntry, type StaffLetterTerms, type StaffSeat } from '../src/shared/protocol'

const FLAT = ECONOMY.masseur.raisePerYear
const GOOD = 0.06
const BAD = 0.02
/** One step above a rate, in whole dollars – spelled here, never taken from the engine's own function. */
const above = (from: number, step: number): number => Math.round((from * (1 + step)) / 100) * 100

// ------------------------------------------------------------------------------------------------ fixtures

/** One banked season on the WTA table (the table with the points, so it is the one the row names). A rank of
 *  `undefined` is «unranked on every table». ⚠ HAND-BUILT ROWS: only the fields the verdict reads exist. */
function season(index: number, wtaRank: number | undefined): SeasonHistoryEntry {
  const empty = { points: 0, wins: 0, losses: 0 }
  return {
    seasonIndex: index,
    endRank: wtaRank ?? 0,
    points: 0,
    wins: 0,
    losses: 0,
    fundsDeltaCents: 0,
    endFundsCents: 0,
    byTrack: {
      domestic: { ...empty },
      itf: { ...empty },
      wta: { ...(wtaRank === undefined ? {} : { endRank: wtaRank }), points: wtaRank === undefined ? 0 : 500, wins: 0, losses: 0 },
    },
  } as unknown as SeasonHistoryEntry
}

/** A title won inside a season (absolute WEEK, the way `trophiesByTier` keeps them). */
function titleIn(world: WorldState, seasonIndex: number): void {
  const cabinet = (world.trophiesByTier.w15 ?? { titles: [] }) as { titles: number[] }
  world.trophiesByTier.w15 = { ...cabinet, titles: [...cabinet.titles, seasonIndex * WEEKS_PER_YEAR + 10] } as never
}

function bareWorld(seed = 'r45-float'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.fundsCents = 1_000_000_00
  return world
}

/** The three arms of the year, as banked books. GOOD: she finished it better placed than the year before.
 *  BAD: worse placed and no title. FLAT: no season banked at all. */
function books(world: WorldState, verdict: StaffYearVerdict): void {
  world.seasonHistory = verdict === 'good' ? [season(0, 100), season(1, 60)] : verdict === 'bad' ? [season(0, 60), season(1, 100)] : []
  world.trophiesByTier = {} as never
}

// ------------------------------------------------------------------------------------------------ A. the verdict

describe('round 45 #3b A – ONE verdict for «was her last year good», read off the banked seasons', () => {
  const verdictOf = (rows: SeasonHistoryEntry[], titleSeasons: number[] = []): StaffYearVerdict => {
    const world = bareWorld('r45-verdict')
    world.seasonHistory = rows
    world.trophiesByTier = {} as never
    for (const s of titleSeasons) titleIn(world, s)
    return staffYearVerdict(world)
  }

  it('⭐⭐ a ranking that rose is a good year, one that fell with nothing won is a bad one, a held place is flat', () => {
    expect(verdictOf([season(0, 100), season(1, 60)]), 'rose').toBe('good')
    expect(verdictOf([season(0, 60), season(1, 100)]), 'fell, no title').toBe('bad')
    expect(verdictOf([season(0, 80), season(1, 80)]), 'held').toBe('flat')
  })

  it('⭐ a title is a good year unless she also slipped – and a slip with a title is flat, not bad', () => {
    expect(verdictOf([season(0, 80), season(1, 80)], [1]), 'held + title').toBe('good')
    expect(verdictOf([season(0, 60), season(1, 100)], [1]), 'slipped + title').toBe('flat')
    expect(verdictOf([season(0, 60), season(1, 100)], [0]), 'a title in the YEAR BEFORE does not save this one').toBe('bad')
  })

  it('⭐ the first season has nothing to be compared with: a title makes it good, nothing makes it flat, and no row at all is flat', () => {
    expect(verdictOf([], [])).toBe('flat')
    expect(verdictOf([season(0, 200)])).toBe('flat')
    expect(verdictOf([season(0, 200)], [0])).toBe('good')
  })

  it('⚠ `null` is not a zero on either side – entering the table is a rise, losing every place is a slip', () => {
    expect(verdictOf([season(0, undefined), season(1, 300)]), 'unranked → ranked').toBe('good')
    expect(verdictOf([season(0, 300), season(1, undefined)]), 'ranked → unranked').toBe('bad')
    expect(verdictOf([season(0, undefined), season(1, undefined)]), 'unranked both years').toBe('flat')
  })

  it('⚠ a row banked before v46 carries no per-table ranks and cannot be compared: the titles alone decide', () => {
    const old = (index: number, endRank: number): SeasonHistoryEntry =>
      ({ seasonIndex: index, endRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0 }) as unknown as SeasonHistoryEntry
    expect(verdictOf([old(0, 100), old(1, 400)]), 'no byTrack: a fall nobody can vouch for').toBe('flat')
    expect(verdictOf([old(0, 100), old(1, 400)], [1])).toBe('good')
  })

  it('⭐ the verdict reads the LATEST banked year against the one before it, not the whole career', () => {
    expect(verdictOf([season(0, 500), season(1, 100), season(2, 150)]), 'a good year long ago and a bad one now').toBe('bad')
  })
})

// ------------------------------------------------------------------------------------------------ B. the step

describe('round 45 #3b B – the step: good 6% / flat 4% / bad 2% (DEFAULTED – the owner picks the figures)', () => {
  const SEATS: Exclude<StaffSeat, 'coach'>[] = ['masseur', 'psychologist', 'sparring']

  it('⭐⭐ every seat maps the one verdict to the one figure, and good > flat > bad', () => {
    for (const seat of SEATS) {
      const world = bareWorld('r45-step')
      books(world, 'good')
      const good = staffRaiseStep(seat, world)
      books(world, 'flat')
      const flat = staffRaiseStep(seat, world)
      books(world, 'bad')
      const bad = staffRaiseStep(seat, world)
      expect([bad, flat, good], seat).toEqual([BAD, FLAT, GOOD])
      expect(bad).toBeLessThan(flat)
      expect(flat).toBeLessThan(good)
    }
  })

  it('⚠ the flat year is the masseur`s own ruled 4% read live, and no seat has a number of its own yet', () => {
    expect(FLAT).toBe(0.04)
    expect(STAFF_RAISE_STEPS.masseur).toEqual(STAFF_RAISE_STEPS.psychologist)
    expect(STAFF_RAISE_STEPS.psychologist).toEqual(STAFF_RAISE_STEPS.sparring)
  })

  it('⚠ «не так интенсивно как тренер» still holds against the coach`s corridor as a whole: a good year`s 6% is under his ceiling', () => {
    expect(GOOD).toBeLessThan(ECONOMY.coach.raise.askCeiling)
    expect(FLAT).toBeLessThan(ECONOMY.coach.raise.askFloor)
  })
})

// ------------------------------------------------------------------------------------------------ C. per seat

interface SeatKit {
  seat: Exclude<StaffSeat, 'coach'>
  base: number
  hire: (w: WorldState, on: boolean) => void
  resolve: (w: WorldState) => void
  fee: (w: WorldState) => number
  /** every rung's price, where the seat has a dial of them */
  rungs?: (w: WorldState) => number[]
  catalogue?: number[]
}

const KITS: SeatKit[] = [
  {
    seat: 'masseur',
    base: ECONOMY.masseur.perSessionCents,
    hire: hireMasseur,
    resolve: resolveMasseurRaise,
    fee: masseurSessionCents,
  },
  {
    seat: 'psychologist',
    base: ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung].salaryCents,
    hire: hirePsychologist,
    resolve: resolvePsychologistRaise,
    fee: psychologistWeeklyCents,
    rungs: psychologistRungWeeklyCents,
    catalogue: ECONOMY.psychologist.rungs.map((r) => r.salaryCents),
  },
  {
    seat: 'sparring',
    base: ECONOMY.sparring.rungs[ECONOMY.sparring.defaultRung].weeklyCents,
    hire: hireSparring,
    resolve: resolveSparringRaise,
    fee: sparringWeeklyCents,
    rungs: sparringRungWeeklyCents,
    catalogue: ECONOMY.sparring.rungs.map((r) => r.weeklyCents),
  },
]

const HIRED_AT = 100
const year = (n: number): number => HIRED_AT + n * WEEKS_PER_YEAR

/** The seat hired at week 100 and standing on its `n`th anniversary, with the books of that year. */
function onAnniversary(kit: SeatKit, n: number, verdict: StaffYearVerdict, seed = `r45-float-${kit.seat}`): WorldState {
  const world = bareWorld(seed)
  world.week = HIRED_AT
  kit.hire(world, true)
  books(world, verdict)
  world.week = year(n)
  return world
}

const askOf = (world: WorldState, seat: StaffSeat, n: number) =>
  staffAsks(world.offers, seat).find((o) => o.id === staffAskId(seat, n))

describe.each(KITS)('round 45 #3b C/D – the $seat: a good year asks for more than a bad one, and the fee is the chain of the papers', (kit) => {
  const figures = (verdict: StaffYearVerdict) => {
    const world = onAnniversary(kit, 1, verdict)
    kit.resolve(world)
    const paper = askOf(world, kit.seat, 1)!
    return { world, paper, ask: (paper.terms as StaffLetterTerms).ask! }
  }

  it('⭐⭐⭐ BOTH ARMS BUILT: the good year`s request is bigger than the flat one, which is bigger than the bad one`s – by the figures', () => {
    const good = figures('good').ask
    const flat = figures('flat').ask
    const bad = figures('bad').ask
    expect(good.fromCents, 'all three quote what the seat is paid now').toBe(kit.base)
    expect(flat.fromCents).toBe(kit.base)
    expect(bad.fromCents).toBe(kit.base)
    expect(good.toCents).toBe(above(kit.base, GOOD))
    expect(flat.toCents).toBe(above(kit.base, FLAT))
    expect(bad.toCents).toBe(above(kit.base, BAD))
    expect(good.toCents - good.fromCents).toBeGreaterThan(flat.toCents - flat.fromCents)
    expect(flat.toCents - flat.fromCents).toBeGreaterThan(bad.toCents - bad.fromCents)
    expect(bad.toCents, 'even the bad year asks for SOMETHING – nobody asks for less').toBeGreaterThan(bad.fromCents)
  })

  it('⭐⭐ the paper freezes its figures when it is written – the books changing afterwards moves nothing on it', () => {
    const { world, ask } = figures('good')
    books(world, 'bad')
    expect((askOf(world, kit.seat, 1)!.terms as StaffLetterTerms).ask).toEqual(ask)
    expect(kit.fee(world), 'and the bill is still the old price until yes').toBe(kit.base)
  })

  it('⭐⭐⭐ THE CHAIN: sign two papers with DIFFERENT steps and the fee is the second paper`s toCents, quoted from the first`s', () => {
    const world = onAnniversary(kit, 1, 'bad')
    kit.resolve(world)
    const first = (askOf(world, kit.seat, 1)!.terms as StaffLetterTerms).ask!
    acceptOffer(world, staffAskId(kit.seat, 1))
    expect(kit.fee(world), 'after the first: its toCents').toBe(first.toCents)
    // A year later the books are good: the second request is a BIGGER step, quoted from what he is paid NOW.
    world.week = year(2)
    books(world, 'good')
    kit.resolve(world)
    const second = (askOf(world, kit.seat, 2)!.terms as StaffLetterTerms).ask!
    expect(second.fromCents, 'quoted from the first paper`s figure').toBe(first.toCents)
    expect(second.toCents).toBe(above(first.toCents, GOOD))
    expect(kit.fee(world), 'the open second paper moves nothing').toBe(first.toCents)
    acceptOffer(world, staffAskId(kit.seat, 2))
    expect(kit.fee(world), '⭐ the fee is the SECOND paper`s toCents – the latest, not the first and not an exponent').toBe(second.toCents)
    expect(second.toCents - second.fromCents, 'and the two steps really differed').toBeGreaterThan(first.toCents - first.fromCents)
  })

  it('⭐⭐ A REFUSED paper is not in the chain: the fee stays and the NEXT request is one step above what he is paid now', () => {
    const world = onAnniversary(kit, 1, 'good')
    kit.resolve(world)
    declineOffer(world, staffAskId(kit.seat, 1))
    expect(kit.fee(world), 'the fee stays').toBe(kit.base)
    world.week = year(2)
    books(world, 'flat')
    kit.resolve(world)
    const next = (askOf(world, kit.seat, 2)!.terms as StaffLetterTerms).ask!
    expect(next, 'the declined year is forgone, not banked – and the new year`s own step applies').toEqual({
      fromCents: kit.base,
      toCents: above(kit.base, FLAT),
    })
  })

  it('⭐ a LAPSED paper is not in the chain either, and cannot be signed late', () => {
    const world = onAnniversary(kit, 1, 'good')
    kit.resolve(world)
    const paper = askOf(world, kit.seat, 1)!
    expireOffers(world.offers, paper.deadlineWeek + 1)
    expect(paper.state).toBe('expired')
    expect(kit.fee(world)).toBe(kit.base)
    world.week = paper.deadlineWeek + 1
    expect(() => acceptOffer(world, paper.id)).toThrow()
  })

  it('⭐⭐ the drift belongs to the SEAT: a signed good-year paper lifts every rung of the dial by the same multiplier', () => {
    if (!kit.rungs || !kit.catalogue) return
    const world = onAnniversary(kit, 1, 'good')
    kit.resolve(world)
    acceptOffer(world, staffAskId(kit.seat, 1))
    const ratio = above(kit.base, GOOD) / kit.base
    kit.rungs(world).forEach((price, rung) => {
      // The paper's own whole-dollar rounding stands on its rung; the other rungs carry the same multiplier.
      expect(Math.abs(price - kit.catalogue![rung] * ratio), `rung ${rung}`).toBeLessThanOrEqual(100)
    })
    expect(kit.fee(world), 'the rung she is on IS the paper').toBe(above(kit.base, GOOD))
  })
})

// ------------------------------------------------------------------------------------------------ E. legacy

describe('round 45 #3b E – the masseur`s silent-era raises are kept: the exponent at first-paper time is the paper`s fromCents', () => {
  const OPENING = ECONOMY.masseur.perSessionCents
  /** The silent era's rate after `y` raises, spelled out here. */
  const silent = (y: number): number => Math.round((OPENING * (1 + FLAT) ** y) / 100) * 100

  function legacy(): WorldState {
    // Hired at 100 and three anniversaries behind him, no paper on file: the career this round did not write.
    const world = bareWorld('r45-float-legacy')
    world.week = HIRED_AT
    hireMasseur(world, true)
    world.week = year(3) + 1
    return world
  }

  it('⭐⭐⭐ the first paper is quoted FROM the rate he is paying, never from the opening price', () => {
    const world = legacy()
    expect(masseurSessionCents(world), 'three silent raises, already paid').toBe(silent(3))
    world.week = year(4) - 1
    const paid = masseurSessionCents(world)
    expect(paid).toBe(silent(3))
    world.week = year(4)
    books(world, 'good')
    resolveMasseurRaise(world)
    const ask = (askOf(world, 'masseur', 4)!.terms as StaffLetterTerms).ask!
    expect(ask.fromCents, 'continuity: the rate he was paid the week before').toBe(paid)
    expect(ask.toCents, 'and the first paper`s step floats').toBe(above(paid, GOOD))
    expect(masseurSessionCents(world), 'the bill does not move until yes').toBe(paid)
    acceptOffer(world, staffAskId('masseur', 4))
    expect(masseurSessionCents(world)).toBe(ask.toCents)
  })

  it('⭐⭐ a REFUSED first paper leaves him on the baseline, and the second chains from there – nothing is lost, nothing is banked', () => {
    const world = legacy()
    world.week = year(4)
    books(world, 'bad')
    resolveMasseurRaise(world)
    declineOffer(world, staffAskId('masseur', 4))
    expect(masseurSessionCents(world), 'the refused year is not paid, and the silent raises are').toBe(silent(3))
    world.week = year(5)
    books(world, 'flat')
    resolveMasseurRaise(world)
    expect((askOf(world, 'masseur', 5)!.terms as StaffLetterTerms).ask).toEqual({
      fromCents: silent(3),
      toCents: above(silent(3), FLAT),
    })
  })

  it('⚠ a career with no papers at all pays exactly what it paid, at any length of service', () => {
    for (const n of [0, 1, 2, 5]) {
      const world = bareWorld('r45-float-nopapers')
      world.week = HIRED_AT
      hireMasseur(world, true)
      world.week = year(n) + 1
      expect(masseurSessionCents(world), `${n} anniversaries`).toBe(silent(n))
    }
  })
})

// ------------------------------------------------------------------------------------------------ F. the coach

function coachedWorld(tier: CoachTier = 'middle', seed = 'r45-float-coach'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
  settleCoachDeal(world)
  return world
}

/** A deal struck well under the market, so the anniversary has room to ask. */
function roomToAsk(world: WorldState): { labour: number } {
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)!
  const labour = Math.round(coachMarketLabourCents(world, coach) / 2)
  world.coachDeal = { ...world.coachDeal!, labourCents: labour, agreedWeek: 0 }
  return { labour }
}

const coachAsks = (world: WorldState) => staffAsks(world.offers, 'coach')
const heldCoach = (world: WorldState) => coachById(world.seed, ageAtWeek(world.week), world.coachId)!

describe('round 45 #3b F – the coach asks with a LETTER, on his own cadence, and the fee moves when the parent signs', () => {
  it('⭐⭐⭐ the letter is written on the anniversary of THIS contract and on no other week', () => {
    const world = coachedWorld()
    roomToAsk(world)
    for (let w = 1; w < WEEKS_PER_YEAR; w++) {
      world.week = w
      resolveCoachRaise(world)
    }
    expect(coachAsks(world), 'nothing in the fifty-one weeks before').toHaveLength(0)
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    const [letter, ...rest] = coachAsks(world)
    expect(rest).toHaveLength(0)
    expect(letter.state, 'a proposal – two doors – and not a notice').toBe('open')
    expect(letter.id).toBe(staffAskId('coach', 1))
    expect(letter.deadlineWeek, 'the sponsor letters` four-week window').toBe(world.week + 3)
    expect((letter.terms as StaffLetterTerms).seat).toBe('coach')
    resolveCoachRaise(world)
    expect(coachAsks(world), 'idempotent on its id').toHaveLength(1)
  })

  it('⭐⭐⭐ THE AUTOMATIC RISE IS DEAD: the anniversary moves no fee, writes no feed row, and a REAL year of ticks does the same', () => {
    const world = coachedWorld('middle', 'r45-float-coach-walk')
    const { labour } = roomToAsk(world)
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < WEEKS_PER_YEAR; w++) tickWeek(world, rng)
    expect(world.week, 'sitting on the anniversary').toBe(WEEKS_PER_YEAR)
    expect(coachAsks(world), 'the tick wrote the letter').toHaveLength(1)
    expect(world.coachDeal!.labourCents, 'and the stored fee did not move on its own').toBe(labour)
    expect(world.events.some((e) => e.text.includes('has asked for more after a year together')), 'no automatic notice').toBe(false)
  })

  it('⭐⭐⭐ ACCEPT moves the ONE stored fee – and the bill, the budget meter and the market`s own row all read the move', () => {
    const world = coachedWorld()
    const { labour } = roomToAsk(world)
    world.week = WEEKS_PER_YEAR
    const coach = heldCoach(world)
    const rateBefore = coachRateCents(world, coach)
    const weeklyBefore = coachBilling(world).weeklyCents
    resolveCoachRaise(world)
    const [letter] = coachAsks(world)
    const ask = (letter.terms as StaffLetterTerms).ask!
    expect(ask.fromCents, 'quoted from what she is billed now').toBe(rateBefore)
    expect(coachRateCents(world, coach), 'the open paper moves nothing').toBe(rateBefore)
    acceptOffer(world, letter.id)
    expect(letter.state).toBe('signed')
    expect(world.coachDeal!.labourCents, 'by exactly the labour the paper asked for').toBe(labour + (ask.toCents - ask.fromCents))
    expect(coachRateCents(world, coach), 'the bill reads the one stored value').toBe(ask.toCents)
    expect(coachBilling(world).weeklyCents, 'so does the budget meter').toBeGreaterThan(weeklyBefore)
    const current = coachMarket(world).find((r) => r.current)
    expect(current?.weeklyCents, 'and the card for the man she has is the same number – no second spelling').toBe(coachBilling(world).weeklyCents)
    expect(world.coachDeal!.agreedWeek, 'the clock restarts at the paper`s own week').toBe(WEEKS_PER_YEAR)
    expect(() => acceptOffer(world, letter.id), 'a signed paper cannot be signed twice').toThrow()
  })

  it('⭐⭐ the cadence survives a late answer, and a second year`s paper does not collide with the first', () => {
    const world = coachedWorld()
    roomToAsk(world)
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    world.week = WEEKS_PER_YEAR + 2 // answered two weeks into the window
    acceptOffer(world, staffAskId('coach', 1))
    expect(world.coachDeal!.agreedWeek, 'dated from the PAPER, not from the day it was answered').toBe(WEEKS_PER_YEAR)
    // Give him room again and walk to the next anniversary: a signed raise re-dates the deal, so a
    // years-since-the-deal key would be `1` again and swallow the paper – the id is the season's.
    const coach = heldCoach(world)
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(coachMarketLabourCents(world, coach) / 2) }
    world.week = 2 * WEEKS_PER_YEAR
    resolveCoachRaise(world)
    expect(coachAsks(world).map((o) => o.id)).toEqual([staffAskId('coach', 1), staffAskId('coach', 2)])
  })

  it('⭐⭐⭐ DECLINE leaves the fee and the marks, writes nothing else, and NOBODY LEAVES – next year he asks again', () => {
    const world = coachedWorld()
    const { labour } = roomToAsk(world)
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    const [letter] = coachAsks(world)
    const funds = world.fundsCents
    const events = world.events.length
    const hiredAs = world.coachId
    declineOffer(world, letter.id)
    expect(letter.state).toBe('refused')
    expect(world.coachDeal!.labourCents, 'the fee stays').toBe(labour)
    expect(world.coachDeal!.agreedWeek, 'and so does the contract`s own date').toBe(0)
    expect(world.fundsCents, 'no punishment: no money moved').toBe(funds)
    expect(world.events.length, 'no feed row, no mood, nothing').toBe(events)
    expect(world.coachId, 'he did not leave – the 17.09 «no third branch» ruling stands').toBe(hiredAs)
    // A year on, the cadence is the contract's own and the request is again against what he is paid NOW.
    world.week = 2 * WEEKS_PER_YEAR
    resolveCoachRaise(world)
    const second = coachAsks(world).find((o) => o.id === staffAskId('coach', 2))
    expect(second, 'he asks again').toBeDefined()
    const ask = (second!.terms as StaffLetterTerms).ask!
    expect((ask.toCents - ask.fromCents) / labour, 'one corridor step above the labour he really has').toBeGreaterThanOrEqual(ECONOMY.coach.raise.askFloor - 1e-9)
    expect((ask.toCents - ask.fromCents) / labour).toBeLessThanOrEqual(ECONOMY.coach.raise.askCeiling + 1e-9)
  })

  it('⭐ an unanswered paper lapses on the ordinary clock, leaves the fee, and cannot be signed late', () => {
    const world = coachedWorld()
    const { labour } = roomToAsk(world)
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    const [letter] = coachAsks(world)
    expireOffers(world.offers, letter.deadlineWeek + 1)
    expect(letter.state).toBe('expired')
    expect(world.coachDeal!.labourCents).toBe(labour)
    world.week = letter.deadlineWeek + 1
    expect(() => acceptOffer(world, letter.id)).toThrow()
  })

  it('⚠ a live paper cannot be signed once the arrangement it was written for has gone (re-validated engine-side)', () => {
    // released inside the window
    const released = coachedWorld()
    roomToAsk(released)
    released.week = WEEKS_PER_YEAR
    resolveCoachRaise(released)
    const [letter] = coachAsks(released)
    hireCoach(released, null)
    expect(() => acceptOffer(released, letter.id), 'nobody to raise').toThrow()
    expect(letter.state, 'and nothing was written').toBe('open')
    expect(() => declineOffer(released, letter.id), 'a refusal is always allowed to say no').not.toThrow()

    // the same man re-hired inside the window is a NEW arrangement, dated from the re-hire
    const rehired = coachedWorld('middle', 'r45-float-coach-rehire')
    roomToAsk(rehired)
    rehired.week = WEEKS_PER_YEAR
    resolveCoachRaise(rehired)
    const [paper] = coachAsks(rehired)
    const man = rehired.coachId!
    hireCoach(rehired, null)
    rehired.week = WEEKS_PER_YEAR + 1
    hireCoach(rehired, man)
    const labour = rehired.coachDeal!.labourCents
    expect(() => acceptOffer(rehired, paper.id), 'the old paper cannot raise the new arrangement').toThrow()
    expect(rehired.coachDeal!.labourCents, 'and the fee is exactly what it was').toBe(labour)
  })

  it('⭐ no room means no letter: a fee at the market is not asked past it, however the year went', () => {
    const world = coachedWorld()
    const coach = heldCoach(world)
    world.coachDeal = { ...world.coachDeal!, labourCents: coachMarketLabourCents(world, coach), agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    expect(coachAsks(world)).toHaveLength(0)
  })

  it('⭐ the letter and the signature draw nothing on the MAIN stream', () => {
    const world = coachedWorld()
    roomToAsk(world)
    world.week = WEEKS_PER_YEAR
    const before = { ...world.rngMain }
    resolveCoachRaise(world)
    acceptOffer(world, staffAskId('coach', 1))
    expect(world.rngMain).toEqual(before)
  })
})
