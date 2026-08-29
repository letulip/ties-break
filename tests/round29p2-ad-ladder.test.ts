// ⭐⭐⭐ ROUND 29 PART TWO #19 / #20 – THE ADVERTISING LADDER, RUNG BY RUNG THROUGH THE ENGINE.
//
// #19: «я не увидел наш список спонсоров для съемок и прочего, не спортивных. С ними что и на каких
//      уровнях и что дают… Хочу увидеть их список и что дают.»
// #20: «предлагать контракт за 20к долларов на год для 100 и выше ракетки мира выглядит весьма
//      сомнительно, как мне кажется, поправь меня, если я ошибаюсь пожалуйста.»
//
// The list he asked for was ONE ROW – Quiet Hour, $20,000, WTA ≤ 200, and NO upper gate at all, so
// the world #21 in his own save was offered exactly what the #199 is. The sourced comparison is in
// `docs/research/off-court-money.md`; the answer it produced is that the FEE is defensible where it
// was written for and the missing CEILING is not, so the fix is a ladder built on top of the shipped
// rung rather than a retune of it.
//
// ⚠ THIS FILE ASKS THE ENGINE, NOT THE CATALOGUE. `tests/round29p2-ladder-monotone.test.ts` reads
// the constants; every arm here walks a real career to eighteen with `tickWeek`, writes a
// professional book at a chosen depth of the table, and then ticks until the house's own dice say
// yes – so what is measured is that the rung ARRIVES at its gate and PAYS its money, which a
// constants test cannot say. The catalogue could be perfect and `reviewAdOffer` could still hand
// every standing the bottom rung.
//
// RNG: the letter's one roll lives on `seed:ad:<week>` – purpose-scoped, never MAIN – so the walk
// can read the same dice the engine will roll and step exactly to the first true week.
import { describe, it, expect, vi } from 'vitest'

// Three real careers to eighteen (~210 ticks each) plus up to a season of arrivals.
vi.setConfig({ testTimeout: 300_000 })

import {
  acceptOffer,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { adRungFor, adWritesAt } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY, kidPrizeShareCents } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type AdTier, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising
const HOUSES = AD.houses

const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
const adPost = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'ad')

/** ⚠ THE STANDING IS SEARCHED FOR, NOT WRITTEN DOWN, and that is deliberate. A points literal that
 *  lands at world #10 on one seed lands at #14 on the next – the W table is a live field, not a
 *  lookup – and a fixture that pinned a literal would test the wrong house the moment a seed or the
 *  points curve moved. `standAt` walks a ladder of totals until `adRungFor` names the rung the arm
 *  is about, and the arms assert that fact again before using it. */
const POINT_STEPS = [300, 400, 600, 800, 1_200, 2_000, 3_000, 4_000, 6_000, 10_000, 100_000]

/** A real career ticked to eighteen, then given a professional standing at a chosen depth – the
 *  `proWorld` idiom `tests/ad-offer.test.ts` documents. Self-coached and entering nothing, so the
 *  walk is deterministic and no tournament dialog arises; the engine still lives every week of it. */
function adultAt(seed: string, tier: AdTier) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
  world.onRampCleared = { itf: true, wta: true }
  for (const points of POINT_STEPS) {
    world.results = world.results.filter((r) => !(r.playerId === KID_ID && r.tier === 'w100'))
    world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'w100' })
    recomputeKidRank(world)
    if (adRungFor(sponsorStandingOf(world)) === tier) return { world, rng }
  }
  throw new Error(`no book in POINT_STEPS put this career in the "${tier}" band – the W table has moved`)
}

/** Tick until the house's own dice raise a letter, or give up. Reads the same sub-stream the engine
 *  will, so the walk stops on the exact week the engine writes rather than polling blindly. */
function walkToLetter(world: WorldState, rng: ReturnType<typeof resumeMain>, limit = 40): number {
  for (let w = world.week + 1; w < world.week + limit; w++) {
    if (adWritesAt(world.seed, w, AD.offerChance)) {
      while (world.week < w) tickWeek(world, rng)
      return w
    }
  }
  return -1
}

/** One walked career per rung, built once and cloned per arm. */
const LIVES = (['watch', 'campaign', 'house'] as const).map((tier) => {
  const { world, rng } = adultAt(`ad-ladder-${tier}`, tier)
  const hit = walkToLetter(world, rng)
  return { tier, world, hit }
})

describe('the three fixtures stand where they claim to stand', () => {
  it.each(LIVES)('$tier: eighteen-plus, a real W standing, and the rung its band opens', ({ tier, world, hit }) => {
    const standing = sponsorStandingOf(world)
    expect(ageOf(world)).toBeGreaterThanOrEqual(AD.fromAgeYears)
    expect(standing.wtaRanked).toBe(true)
    expect(standing.wtaRank).toBeLessThanOrEqual(HOUSES[tier].maxWtaRank)
    expect(adRungFor(standing), `${tier}: the fixture stands in the wrong band`).toBe(tier)
    expect(hit, `${tier}: the dice never said yes inside the window`).toBeGreaterThan(0)
  })
})

describe('⭐⭐ each rung ARRIVES at its own gate – the half a constants test cannot say', () => {
  it.each(LIVES)('$tier: the letter that lands is that house`s, through the tick', ({ tier, world, hit }) => {
    const post = adPost(world)
    expect(post).toHaveLength(1)
    const t = post[0].terms as AdOfferTerms
    expect(t.tier).toBe(tier)
    expect(t.brand).toBe(HOUSES[tier].brand)
    expect(t.trade).toBe(HOUSES[tier].trade)
    expect(t.cashCents).toBe(HOUSES[tier].cashCents)
    expect(t.shootCount).toBe(HOUSES[tier].shootWeeksPerTerm)
    expect(post[0].week).toBe(hit)
    // ...on the shared clock every house keeps: five weeks to decide, counted inclusively.
    expect(post[0].deadlineWeek).toBe(hit + AD.decideWeeks - 1)
  })

  it('⚠⚠ THE DEFECT, AS AN ASSERTION: a top-10 standing no longer gets the top-200 letter', () => {
    // This is #20, whole. Before the ladder every one of these standings received Quiet Hour's
    // $20,000, because the gate had a floor and no ceiling.
    const houseLife = LIVES.find((l) => l.tier === 'house')!
    const t = adPost(houseLife.world)[0].terms as AdOfferTerms
    expect(t.brand).not.toBe(HOUSES.watch.brand)
    expect(t.cashCents).toBeGreaterThan(HOUSES.watch.cashCents)
    // ...and a top-10 girl is NOT written to by the middle rung either – the strongest she clears.
    expect(t.tier).toBe('house')
  })
})

describe('⭐⭐ ...and each rung PAYS its money, into the two wallets round 28 #15 split', () => {
  it.each(LIVES)('$tier: signing banks the fee, less her share, once', ({ tier, world: base }) => {
    const world = structuredClone(base)
    const offer = adPost(world)[0]
    const t = offer.terms as AdOfferTerms
    const fundsBefore = world.fundsCents
    const kidBefore = world.kidFundsCents ?? 0

    acceptOffer(world, offer.id)

    // Her cut of a sponsor cheque is the prize ramp's rate (round 28 #15), computed by the engine's
    // own helper so this cannot drift from the rule.
    const hers = kidPrizeShareCents(t.cashCents, ageOf(world))
    expect(world.kidFundsCents ?? 0).toBe(kidBefore + hers)
    expect(world.fundsCents - fundsBefore).toBe(t.cashCents - hers)
    // The whole fee reached somebody, to the cent: no rounding lost between the two wallets.
    expect(world.fundsCents - fundsBefore + ((world.kidFundsCents ?? 0) - kidBefore)).toBe(t.cashCents)
    expect(t.cashCents).toBe(HOUSES[tier].cashCents)
  })

  it.each(LIVES)('$tier: the signature names exactly the shoot weeks the paper promised', ({ tier, world: base }) => {
    const world = structuredClone(base)
    const offer = adPost(world)[0]
    acceptOffer(world, offer.id)
    const t = offer.terms as AdOfferTerms
    const weeks = t.shootWeeks ?? []
    expect(weeks).toHaveLength(HOUSES[tier].shootWeeksPerTerm)
    // ...inside the term, no earlier than the lead, and never two in a row – the promises
    // `chooseShootWeeks` makes, checked at the count this rung actually asks for.
    for (const w of weeks) {
      expect(w).toBeGreaterThanOrEqual(offer.decidedWeek! + AD.shootLeadWeeks)
      expect(w).toBeLessThanOrEqual(offer.untilWeek!)
    }
    const sorted = [...weeks].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThan(1)
  })

  it('⭐ the biggest house costs her six weeks of the season, which is the plan`s whole annual cap', () => {
    // Round 29 #3 made a shoot on a tournament week a four-way decision, so this is a real price and
    // not a line in a letter: six of 49 in-season weeks, each recovering like a travel week.
    const houseLife = LIVES.find((l) => l.tier === 'house')!
    const world = structuredClone(houseLife.world)
    const offer = adPost(world)[0]
    acceptOffer(world, offer.id)
    expect((offer.terms as AdOfferTerms).shootWeeks).toHaveLength(6)
    // ...and one deal at a time plus a one-year term is what makes that the CEILING for a year.
    expect(HOUSES.house.termWeeks).toBe(52)
  })
})
