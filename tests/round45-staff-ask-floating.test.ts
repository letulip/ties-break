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
//   G. THE BANK (B17, 02.10 fourth batch) – «можно принцип сделать похожим, но размер немного изменить для
//      supportов»: a refused year is not forgotten in the price. The next ask quotes the product of every year
//      since the fee last moved, each year's step from ITS OWN verdict, at the seat's own 2/4/6% scale; a family
//      that signs every year is quoted the single steps it always was; a re-hire resets the bank; the masseur's
//      silent-era years never enter it.
//
// ⚠ RE-AIMED 02.10 (B17): the two arms of C/D and E that said «a refused year is forgone, not banked» (the next ask
// one step above what the seat is paid) now say what the fourth batch ruled – the next ask CARRIES the refused
// year. Their old single-step figures live on as the nothing-refused arm of G.
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
//   M8  (B17 a) banking off: the span is always one year (`staffRaiseYears` – the single step again).
//   M9  (B17 b) the verdict of EVERY year in the span is the latest year's (`staffYearVerdictAt` ignored).
//   M10 (B17 c) the anchor ignores the signed papers (the bank counts from the hire, always).
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
  masseurWeeklyCents,
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
import { STAFF_RAISE_STEPS, staffRaiseStep, staffYearVerdict, staffYearVerdictAt, type StaffYearVerdict } from '../src/engine/world/staffRaise'
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
  /** what the seat BILLS in a week at the rung the family is on (the masseur's fee is per session) */
  bill: (w: WorldState) => number
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
    bill: masseurWeeklyCents,
  },
  {
    seat: 'psychologist',
    base: ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung].salaryCents,
    hire: hirePsychologist,
    resolve: resolvePsychologistRaise,
    fee: psychologistWeeklyCents,
    bill: psychologistWeeklyCents,
    rungs: psychologistRungWeeklyCents,
    catalogue: ECONOMY.psychologist.rungs.map((r) => r.salaryCents),
  },
  {
    seat: 'sparring',
    base: ECONOMY.sparring.rungs[ECONOMY.sparring.defaultRung].weeklyCents,
    hire: hireSparring,
    resolve: resolveSparringRaise,
    fee: sparringWeeklyCents,
    bill: sparringWeeklyCents,
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

  it('⭐⭐ A REFUSED paper is not in the chain: the fee stays – and ⚠ 02.10 fourth batch (B17): the NEXT request CARRIES the refused year', () => {
    // It was «the declined year is forgone – the next request is one step above what he is paid now». The fourth
    // batch ruled the coach's principle for the seats, at their own scale. The refused year here was GOOD (6%) and the
    // new one is FLAT (4%): the next ask quotes both, from what he is paid now.
    const world = onAnniversary(kit, 1, 'good')
    kit.resolve(world)
    declineOffer(world, staffAskId(kit.seat, 1))
    expect(kit.fee(world), 'the fee stays').toBe(kit.base)
    world.week = year(2)
    world.seasonHistory = [season(0, 100), season(1, 60), season(2, 60)] // the next year's books: she held her place
    kit.resolve(world)
    const next = (askOf(world, kit.seat, 2)!.terms as StaffLetterTerms).ask!
    expect(next, 'the declined year is BANKED – the new year`s own step stacks on it, from the fee he is paid now').toEqual({
      fromCents: kit.base,
      toCents: Math.round((kit.base * ((1 + FLAT) * (1 + GOOD))) / 100) * 100,
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

  it('⭐⭐ a REFUSED first paper leaves him on the baseline, and the second chains from there – nothing is lost; ⚠ 02.10 (B17) the refused year is BANKED, the silent ones are not', () => {
    const world = legacy()
    world.week = year(4)
    books(world, 'bad')
    resolveMasseurRaise(world)
    declineOffer(world, staffAskId('masseur', 4))
    expect(masseurSessionCents(world), 'the refused year is not paid, and the silent raises are').toBe(silent(3))
    world.week = year(5)
    world.seasonHistory = [season(0, 60), season(1, 100), season(2, 100)] // the next year's books: she held her place
    resolveMasseurRaise(world)
    expect(
      (askOf(world, 'masseur', 5)!.terms as StaffLetterTerms).ask,
      'the flat year and the refused bad one – two years, never the three silent ones as well',
    ).toEqual({
      fromCents: silent(3),
      toCents: Math.round((silent(3) * ((1 + FLAT) * (1 + BAD))) / 100) * 100,
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

// ------------------------------------------------------------------------------------------------ G. the bank

// ⭐⭐⭐ B17, 02.10 FOURTH BATCH – «можно принцип сделать похожим, но размер немного изменить для supportов». The
// coach's principle is that a refused year is not forgotten in the price; the three seats adopt it at THEIR OWN
// scale (2 / 4 / 6% a year – his is a 5–15% corridor). The next ask quotes the product of (1 + step) over every
// year since the fee last moved, each year's step from the verdict of THAT year. «No third branch» is untouched:
// nobody leaves, nobody is punished – the refusal lives only in the figure of the next ask.

/** Her WTA year-end rank, one per season, and the verdict each season's row gives (no titles unless an arm adds one):
 *    s0 100 – the first season, nothing before it          FLAT
 *    s1 100 – held                                          FLAT
 *    s2 150 – slipped, nothing won                          BAD
 *    s3  90 – rose                                          GOOD
 *    s4 150 – slipped, nothing won                          BAD
 *    s5 150 – held                                          FLAT
 *    s6 150 – held                                          FLAT
 *    s7  90 – rose                                          GOOD
 *  ⚠ The verdicts are spelled out by hand and then checked against the engine's own reading (the first arm), so a
 *  script that stopped saying what it says fails loudly instead of quietly moving every figure below. */
const RANKS = [100, 100, 150, 90, 150, 150, 150, 90]
const VERDICTS: StaffYearVerdict[] = ['flat', 'flat', 'bad', 'good', 'bad', 'flat', 'flat', 'good']
const stepOf = (verdict: StaffYearVerdict): number => (verdict === 'good' ? GOOD : verdict === 'bad' ? BAD : FLAT)

/** The books as the wrap-up leaves them when anniversary `n`'s request is written: seasons 0..n banked and nothing
 *  after (a seat hired at week 100 asks on week 48 of season n+1, a week before that season's own wrap-up). */
function bankThrough(world: WorldState, through: number): void {
  world.seasonHistory = RANKS.slice(0, through + 1).map((rank, i) => season(i, rank))
  world.trophiesByTier = {} as never
}

/** What a request carrying `years` (newest first) asks for, SPELLED OUT HERE and not taken from the engine: the
 *  product of the years' steps, rounded to whole dollars ONCE. */
const bankedAbove = (from: number, years: number[]): number =>
  Math.round((from * years.reduce((growth, y) => growth * (1 + stepOf(VERDICTS[y])), 1)) / 100) * 100

function hiredWorld(kit: SeatKit, seed: string): WorldState {
  const world = bareWorld(seed)
  world.week = HIRED_AT
  kit.hire(world, true)
  return world
}

/** Anniversary `n`'s request, written on books banked through season `n` – the two figures it prints. */
function askAt(kit: SeatKit, world: WorldState, n: number): { fromCents: number; toCents: number } {
  bankThrough(world, n)
  world.week = year(n)
  kit.resolve(world)
  return (askOf(world, kit.seat, n)!.terms as StaffLetterTerms).ask!
}

describe.each(KITS)('round 45 B17 – the $seat: a refused year is not forgotten in the price', (kit) => {
  it('⭐ the staged books say what the arms below are computed from', () => {
    const world = bareWorld('r45-bank-fixture')
    bankThrough(world, RANKS.length - 1)
    expect(RANKS.map((_, y) => staffYearVerdictAt(world, y))).toEqual(VERDICTS)
    expect(staffYearVerdict(world), 'the latest-year special case reads the latest season').toBe(VERDICTS[RANKS.length - 1])
  })

  it('⭐⭐⭐ REFUSED TWO YEARS RUNNING: the third ask quotes fee × (1+s1)(1+s2)(1+s3), each step from ITS OWN year`s verdict', () => {
    const world = hiredWorld(kit, `r45-bank-twice-${kit.seat}`)
    const mainBefore = { ...world.rngMain }
    expect(askAt(kit, world, 1), 'nothing refused yet: the single step, as always').toEqual({
      fromCents: kit.base,
      toCents: bankedAbove(kit.base, [1]),
    })
    declineOffer(world, staffAskId(kit.seat, 1))
    expect(askAt(kit, world, 2), 'one year refused: this year`s step and the refused one`s, from what the seat is paid now').toEqual({
      fromCents: kit.base,
      toCents: bankedAbove(kit.base, [2, 1]),
    })
    // ...and a LAPSED year banks exactly like a refused one.
    const lapsing = askOf(world, kit.seat, 2)!
    expireOffers(world.offers, lapsing.deadlineWeek + 1)
    expect(lapsing.state).toBe('expired')
    expect(kit.fee(world), 'two years not signed, and not a cent more is paid').toBe(kit.base)
    const third = askAt(kit, world, 3)
    expect(third.fromCents).toBe(kit.base)
    expect(third.toCents, 'three years, three steps').toBe(bankedAbove(kit.base, [3, 2, 1]))
    expect([3, 2, 1].map((y) => staffYearVerdictAt(world, y)), 'and the three verdicts really are three different ones').toEqual([
      'good',
      'bad',
      'flat',
    ])
    expect(third.toCents, 'more than the latest year`s single step').not.toBe(above(kit.base, GOOD))
    expect(third.toCents, 'and not the latest verdict read three times').not.toBe(Math.round((kit.base * (1 + GOOD) ** 3) / 100) * 100)
    expect(world.rngMain, 'nothing here draws on the MAIN stream').toEqual(mainBefore)
  })

  it('⭐⭐⭐ ACCEPT AFTER BANKED YEARS: the fee jumps the whole product in ONE signature, the bill follows, and the bank is spent', () => {
    const world = hiredWorld(kit, `r45-bank-accept-${kit.seat}`)
    askAt(kit, world, 1)
    declineOffer(world, staffAskId(kit.seat, 1))
    askAt(kit, world, 2)
    declineOffer(world, staffAskId(kit.seat, 2))
    const third = askAt(kit, world, 3)
    const billBefore = kit.bill(world)
    expect(kit.fee(world), 'the open paper moves nothing').toBe(kit.base)
    acceptOffer(world, staffAskId(kit.seat, 3))
    expect(kit.fee(world), 'one signature, the whole product').toBe(bankedAbove(kit.base, [3, 2, 1]))
    expect(kit.fee(world)).toBe(third.toCents)
    expect(kit.bill(world) * third.fromCents, 'and the bill follows the fee by exactly the paper`s own ratio').toBe(billBefore * third.toCents)
    expect(askAt(kit, world, 4), 'a signature empties the bank: ONE step above what he is paid now').toEqual({
      fromCents: third.toCents,
      toCents: above(third.toCents, BAD),
    })
  })

  it('⭐⭐ THE ANCHOR IS THE LAST SIGNATURE: sign one year, refuse two, and the next ask banks exactly those two – and itself', () => {
    const world = hiredWorld(kit, `r45-bank-anchor-${kit.seat}`)
    const first = askAt(kit, world, 1)
    acceptOffer(world, staffAskId(kit.seat, 1))
    askAt(kit, world, 2)
    declineOffer(world, staffAskId(kit.seat, 2))
    askAt(kit, world, 3)
    declineOffer(world, staffAskId(kit.seat, 3))
    expect(kit.fee(world), 'the fee stands on the signed paper').toBe(first.toCents)
    expect(askAt(kit, world, 4), 'years 2, 3 and 4 – never the signed year 1 again').toEqual({
      fromCents: first.toCents,
      toCents: bankedAbove(first.toCents, [4, 3, 2]),
    })
  })

  it('⭐⭐⭐ BACKWARD-NEUTRAL: a family that signs every year is quoted exactly the single steps it always was', () => {
    const world = hiredWorld(kit, `r45-bank-neutral-${kit.seat}`)
    let fee = kit.base
    for (let n = 1; n <= 7; n++) {
      const ask = askAt(kit, world, n)
      // The PRE-bank formula, spelled out: one step above what the seat is paid, from the latest year's verdict
      // (the seven years carry all three verdicts).
      expect(ask, `year ${n}`).toEqual({ fromCents: fee, toCents: above(fee, stepOf(VERDICTS[n])) })
      acceptOffer(world, staffAskId(kit.seat, n))
      fee = ask.toCents
      expect(kit.fee(world), `year ${n} paid`).toBe(fee)
    }
  })

  it('⭐⭐ A RE-HIRE RESETS THE BANK: a year refused under an earlier arrangement is not carried into the new one', () => {
    // CONTROL – nobody leaves: the second ask banks the refused first year.
    const kept = hiredWorld(kit, `r45-bank-kept-${kit.seat}`)
    askAt(kit, kept, 1)
    declineOffer(kept, staffAskId(kit.seat, 1))
    expect(askAt(kit, kept, 2), 'control: no release, the bank stands').toEqual({
      fromCents: kit.base,
      toCents: bankedAbove(kit.base, [2, 1]),
    })
    // THE ARM – the same refusal, then a release at 160 and a re-hire at 170. The service clock RESUMES (60 weeks
    // served, so the next anniversary is 44 weeks after the re-hire, week 214); the bank does not.
    const world = hiredWorld(kit, `r45-bank-rehired-${kit.seat}`)
    askAt(kit, world, 1)
    declineOffer(world, staffAskId(kit.seat, 1))
    world.week = 160
    kit.hire(world, false)
    world.week = 170
    kit.hire(world, true)
    bankThrough(world, 3)
    world.week = 214
    kit.resolve(world)
    expect((askOf(world, kit.seat, 2)!.terms as StaffLetterTerms).ask, 'the new arrangement starts clean: ONE step').toEqual({
      fromCents: kit.base,
      toCents: bankedAbove(kit.base, [3]),
    })
  })

  it('⭐⭐ a title in a REFUSED year counts for THAT year – each year`s verdict is recomputed from its own facts', () => {
    const world = hiredWorld(kit, `r45-bank-title-${kit.seat}`)
    bankThrough(world, 1)
    titleIn(world, 1) // season 1: she held her place AND won a title – a GOOD year, where the bare rank reads flat
    world.week = year(1)
    kit.resolve(world)
    expect((askOf(world, kit.seat, 1)!.terms as StaffLetterTerms).ask).toEqual({ fromCents: kit.base, toCents: above(kit.base, GOOD) })
    declineOffer(world, staffAskId(kit.seat, 1))
    bankThrough(world, 2)
    titleIn(world, 1)
    world.week = year(2)
    kit.resolve(world)
    expect((askOf(world, kit.seat, 2)!.terms as StaffLetterTerms).ask, 'year 2 (bad) with the refused year 1 (good, by its title)').toEqual({
      fromCents: kit.base,
      toCents: Math.round((kit.base * ((1 + BAD) * (1 + GOOD))) / 100) * 100,
    })
  })
})

describe('round 45 B17 – the masseur`s silent-era years never enter the bank', () => {
  const OPENING = ECONOMY.masseur.perSessionCents
  const silent3 = Math.round((OPENING * (1 + FLAT) ** 3) / 100) * 100

  it('⭐⭐⭐ a legacy career: the exponent baseline, then the letters` own years – and no silent year counted twice', () => {
    const kit = KITS[0]
    const world = bareWorld('r45-bank-legacy')
    world.week = HIRED_AT
    hireMasseur(world, true)
    // Hired at 100 and standing on his FOURTH anniversary with no paper on file: three silent raises behind him.
    expect(askAt(kit, world, 4), 'his first letter spans ONE year – the silent three are in the rate he is paid').toEqual({
      fromCents: silent3,
      toCents: bankedAbove(silent3, [4]),
    })
    declineOffer(world, staffAskId('masseur', 4))
    expect(masseurSessionCents(world), 'the refused year is not paid, and the silent raises still are').toBe(silent3)
    expect(askAt(kit, world, 5), 'the second letter banks the refused year: two years, never five').toEqual({
      fromCents: silent3,
      toCents: bankedAbove(silent3, [5, 4]),
    })
    acceptOffer(world, staffAskId('masseur', 5))
    const paid = masseurSessionCents(world)
    expect(paid).toBe(bankedAbove(silent3, [5, 4]))
    expect(askAt(kit, world, 6), 'and after the signature, one step again').toEqual({ fromCents: paid, toCents: above(paid, FLAT) })
  })
})
