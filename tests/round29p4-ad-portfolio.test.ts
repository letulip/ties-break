// ⭐⭐⭐ ROUND 29 PART FOUR P6/P7/P9 – THE ADVERTISING PORTFOLIO: one deal per category, the
// gradient's cheques, the double programme, the churn, the capstone, and the winter shoot season.
//
// The owner's rulings, verbatim, one per mechanism under test:
//   P6  «Федерер получал контракт с Nike на 10+ миллионов, это 1-2млн для родителя. Таких
//       контрактов может быть несколько.» – the portfolio, and the $10M/yr capstone.
//   §7  «У нас они частично есть уже. Можно даже текущих использовать двойной программой. И еще
//       парочку накинуть» – categories, and the kit brand writing an ad campaign of its own.
//   §8  «на каждой ступени может быть до 4-6 одновременно, только с разными чеками» – the shelf's
//       shape is constant, the cheque scales.
//   P6's churn: terms run 1–3 years and «игрок устанет смотреть на одно и то же название без смены
//       ГОДАМИ» – 2–4 houses per category, and no house twice running at the top band.
//   P9  «межсезонье … у нас 6 пустых недель там» – the winter is the shoot season and its cost is
//       the displaced rest.
//
// ⚠ EVERY GUARD HERE WAS MUTATION-CHECKED BEFORE IT WAS BELIEVED (the ten-dead-guards week). The
// mutations applied, one at a time, each watched fail in the arm named:
//   * `adSpokenFor` without its category filter (the old whole-post rule) → the coexistence arm
//     («two categories run at once») reddens: the second letter never arrives.
//   * `reviewAdOffer` raising clothing with no live kit deal → the double-programme negative arm.
//   * `capstoneSeasonsOf` counting `<= 11` (or the gate at `>= 3`) → the tenure boundary arm.
//   * `pickAdHouse` without the top-band exclusion → BOTH churn arms: the pure boundary probe
//     (roll 0 keeps the pool's head) and the walked witness seed `p4a-churn-5`, which repeats the
//     same house deterministically under the mutant. ⚠ The first draft's walked arm used an
//     arbitrary seed and SURVIVED the mutant (a 3-house pool repeats only ~1/3 of the time) – the
//     witness replaced it.
//   * `payAdAnniversaries` had a `yearIndex > years` stop and the mutation log KILLED IT AS DEAD:
//     `activeAdDeals`' liveness window already stops the year-(N+1) fee provably (the anniversary
//     falls past `untilWeek`), so the guard could not be distinguished by any test and was removed
//     rather than covered. The term-end arm pins the WINDOW doing that job (mutant: widen
//     `activeAdDeals` past `untilWeek` → the arm reddens).
//   * `chooseShootWeeks` without the winter preference → the winter-booking arm.
//
// RNG: everything here reads purpose-scoped sub-streams (`seed:ad:<category>:<week>`), never MAIN;
// the input-independence arm at the bottom proves signing the whole shelf leaves `rngMain`
// byte-identical, which is the permanent law restated for this feature.
import { describe, it, expect, vi } from 'vitest'

vi.setConfig({ testTimeout: 300_000 })

import {
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  KID_ID,
  bankSponsorCheque,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import {
  activeAdDealIn,
  activeAdDeals,
  adCategoryOf,
  adSpokenFor,
  adWritesAt,
  isWinterShootWeek,
  kitTermsFor,
  pickAdHouse,
  signOffer,
} from '../src/engine/offers'
import { reviewAdOffer, acceptOffer, capstoneSeasonsOf, payAdAnniversaries, sponsorStandingOf } from '../src/engine/world/sponsors'
import { recoveryBaseFor } from '../src/engine/world/medical'
import { ECONOMY, managerCommissionCents } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdCategory, type AdOfferTerms, type KitOfferTerms, type Offer, type SeasonHistoryEntry } from '../src/shared/protocol'

const AD = ECONOMY.advertising

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)
const post = (w: WorldState, c: AdCategory): Offer[] =>
  w.offers.filter((o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === c)

/** The gate-probe idiom (tests/ad-offer.test.ts): a fresh world moved to an adult week with a
 *  counting professional book at `rank`. `reviewAdOffer` reads nothing else about her. */
function probeWorld(seed: string, week: number, rank: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
  world.kidRankWta = rank
  return world
}

/** The first week at or after `from` whose dice write the named category. -1 for none. */
function rollFor(seed: string, category: AdCategory, from: number, limit = 200): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance, category)) return w
  return -1
}

/** A signed kit deal at a rung, through the engine's own signature – never a hand-built shape. */
function signKit(world: WorldState, rung: 'tour' | 'premium' | 'icon'): KitOfferTerms {
  const terms = kitTermsFor(sponsorStandingOf(world), rung)
  if (!terms) throw new Error(`no kit terms at ${rung}`)
  const offer: Offer = { id: `kit-test-${world.week}`, kind: 'kit', week: world.week, deadlineWeek: world.week + 4, state: 'open', terms }
  world.offers.push(offer)
  signOffer(world.offers, offer.id, world.week)
  return terms
}

/** One banked season ended at `endRank` on the professional table – the shape `wrapSeason` writes
 *  and the capstone gate folds over. Only the fields the gate reads are non-trivial. */
function seasonAt(index: number, endRank: number): SeasonHistoryEntry {
  return {
    seasonIndex: index,
    endRank: 40,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0 },
      wta: { endRank, points: 0, wins: 0, losses: 0 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

// =================================================================================================
// 1 – ONE DEAL PER CATEGORY, AND THE CATEGORIES ARE INDEPENDENT SLOTS
// =================================================================================================
describe('one deal per category – «Таких контрактов может быть несколько»', () => {
  it('⭐⭐ a category never holds two live deals: its slot seals for the whole term', () => {
    const SEED = 'p4a-slot'
    const w1 = rollFor(SEED, 'watches', 300)
    const world = probeWorld(SEED, w1, 150)
    reviewAdOffer(world)
    expect(post(world, 'watches')).toHaveLength(1)
    acceptOffer(world, post(world, 'watches')[0].id)

    // Every watches-true week of the whole running term is walked through the gate, and none of
    // them writes: the slot is sealed by the SIGNED deal, not by letter-vs-letter timing.
    const until = post(world, 'watches')[0].untilWeek!
    let rolls = 0
    for (let w = w1 + 1; w <= until; w++) {
      if (!adWritesAt(SEED, w, AD.offerChance, 'watches')) continue
      rolls++
      world.week = w
      world.results.push({ playerId: KID_ID, week: w, points: 100, tier: 'w100' })
      reviewAdOffer(world)
      expect(post(world, 'watches'), `a second watches letter at week ${w}, mid-term`).toHaveLength(1)
      expect(activeAdDeals(world.offers, w).filter((o) => adCategoryOf(o.terms as AdOfferTerms) === 'watches')).toHaveLength(1)
    }
    expect(rolls, 'the dice really said yes inside the term – the silence is the guard`s').toBeGreaterThan(0)
    // ...and the week after the term, the same dice reopen the same slot.
    const next = rollFor(SEED, 'watches', until + 1)
    world.week = next
    world.results.push({ playerId: KID_ID, week: next, points: 100, tier: 'w100' })
    reviewAdOffer(world)
    expect(post(world, 'watches')).toHaveLength(2)
  })

  it('⭐⭐ ...while ANOTHER category writes straight past the signed deal – the portfolio itself', () => {
    const SEED = 'p4a-coexist'
    const w1 = rollFor(SEED, 'watches', 300)
    const world = probeWorld(SEED, w1, 150)
    reviewAdOffer(world)
    acceptOffer(world, post(world, 'watches')[0].id)
    // The next drinks-true week inside the watches term – found by the dice, asserted real.
    const w2 = rollFor(SEED, 'drinks', w1 + 1)
    expect(w2).toBeGreaterThan(0)
    expect(w2, 'the probe week is inside the running watches term').toBeLessThanOrEqual(post(world, 'watches')[0].untilWeek!)
    world.week = w2
    world.results.push({ playerId: KID_ID, week: w2, points: 100, tier: 'w100' })
    reviewAdOffer(world)
    const drinks = post(world, 'drinks')
    expect(drinks, 'the drinks slot is its own post – a signed watch deal does not shut it').toHaveLength(1)
    acceptOffer(world, drinks[0].id)
    // Two live deals, two categories, at once – §8's shelf, in the world's own state.
    const live = activeAdDeals(world.offers, world.week)
    expect(live).toHaveLength(2)
    expect(new Set(live.map((o) => adCategoryOf(o.terms as AdOfferTerms)))).toEqual(new Set(['watches', 'drinks']))
    expect(adSpokenFor(world.offers, world.week, 'watches')).toBe(true)
    expect(adSpokenFor(world.offers, world.week, 'cars')).toBe(false)
  })
})

// =================================================================================================
// 2 – THE DOUBLE PROGRAMME: the kit brand's ad campaign, beside its kit deal
// =================================================================================================
describe('the double programme – «Можно даже текущих использовать двойной программой»', () => {
  it('⭐⭐ a kit brand`s poster campaign coexists with its kit deal, one brand, two papers', () => {
    const SEED = 'p4a-double'
    const hit = rollFor(SEED, 'clothing', 300)
    const world = probeWorld(SEED, hit, 150)
    const kit = signKit(world, 'tour')
    reviewAdOffer(world)
    const letters = post(world, 'clothing')
    expect(letters).toHaveLength(1)
    const t = letters[0].terms as AdOfferTerms
    // ONE brand: the campaign's author is the house that already dresses her.
    expect(t.brand).toBe(kit.brand)
    acceptOffer(world, letters[0].id)
    // TWO papers, both in force: the kit deal is untouched by the ad signature and vice versa.
    expect(activeAdDealIn(world.offers, 'clothing', world.week)).not.toBeNull()
    expect(world.offers.filter((o) => o.kind === 'kit' && o.state === 'signed')).toHaveLength(1)
    // ...and SEPARATE money: the ad fee is its own cheque at the clothing cell, not kit arithmetic.
    expect(t.cashCents).toBe(AD.categories.clothing.feeCentsByBand[0])
  })

  it('⚠ and with NO kit deal there is nobody to write it – the same week, the same dice, no letter', () => {
    const SEED = 'p4a-double'
    const hit = rollFor(SEED, 'clothing', 300)
    const world = probeWorld(SEED, hit, 150) // identical, minus the kit signature
    reviewAdOffer(world)
    expect(post(world, 'clothing')).toEqual([])
  })
})

// =================================================================================================
// 3 – THE CAPSTONE: gate = 4 seasons ENDED inside the top 10, read off seasonHistory
// =================================================================================================
describe('the capstone – «Федерер получал контракт с Nike на 10+ миллионов», gated on tenure', () => {
  const SEED = 'p4a-capstone'
  const hit = rollFor(SEED, 'capstone', 300)

  it('fixture fact: the capstone dice say yes somewhere in the probe span', () => {
    expect(hit).toBeGreaterThan(0)
  })

  it('⭐⭐⭐ three top-10 seasons buy no letter; the fourth buys it – the boundary, exactly', () => {
    const three = probeWorld(SEED, hit, 5)
    three.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10)]
    expect(capstoneSeasonsOf(three)).toBe(3)
    reviewAdOffer(three)
    expect(post(three, 'capstone')).toEqual([])

    const four = probeWorld(SEED, hit, 5)
    four.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
    expect(capstoneSeasonsOf(four)).toBe(4)
    reviewAdOffer(four)
    const letters = post(four, 'capstone')
    expect(letters).toHaveLength(1)
    const t = letters[0].terms as AdOfferTerms
    expect(t.cashCents).toBe(10_000_000_00) // his sentence, exactly
    expect(t.termYears).toBe(8) // kit-shaped
    expect(t.termWeeks).toBe(8 * 52)
  })

  it('⚠ the gate counts seasons ENDED inside the top 10 – an 11th place and a not-recorded row count nothing', () => {
    const world = probeWorld(SEED, hit, 5)
    world.seasonHistory = [
      seasonAt(0, 8),
      seasonAt(1, 11), // ended OUTSIDE – tenure is where the season ENDED, not where she visited
      { ...seasonAt(2, 3), byTrack: undefined }, // a v45 row: absent means «not recorded», never «top-10»
      seasonAt(3, 9),
      seasonAt(4, 1),
    ]
    expect(capstoneSeasonsOf(world)).toBe(3)
    reviewAdOffer(world)
    expect(post(world, 'capstone')).toEqual([])
  })

  it('⭐ kit-shaped means the kit house writes it: her live kit brand, or the icon rung`s between deals', () => {
    const bare = probeWorld(SEED, hit, 5)
    bare.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
    reviewAdOffer(bare)
    expect((post(bare, 'capstone')[0].terms as AdOfferTerms).brand).toBe(ECONOMY.sponsorship.icon.brand)

    const dressed = probeWorld(SEED, hit, 5)
    dressed.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
    const kit = signKit(dressed, 'icon')
    reviewAdOffer(dressed)
    expect((post(dressed, 'capstone')[0].terms as AdOfferTerms).brand).toBe(kit.brand)
  })

  it('one at a time: a running capstone term turns the next letter away for eight years', () => {
    const world = probeWorld(SEED, hit, 5)
    world.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
    reviewAdOffer(world)
    acceptOffer(world, post(world, 'capstone')[0].id)
    const next = rollFor(SEED, 'capstone', hit + 1, 400)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThanOrEqual(post(world, 'capstone')[0].untilWeek!)
    world.week = next
    world.results.push({ playerId: KID_ID, week: next, points: 100, tier: 'w100' })
    reviewAdOffer(world)
    expect(post(world, 'capstone')).toHaveLength(1)
  })
})

// =================================================================================================
// 4 – THE CHURN: 1–3 year terms, and no house twice running at the top band
// =================================================================================================
describe('the churn – «игрок устанет смотреть на одно и то же название без смены ГОДАМИ»', () => {
  it('⭐⭐ at the top band the previous signed house steps back from the next letter', () => {
    // ⚠ THE SEED IS A FOUND WITNESS, NOT AN ARBITRARY LABEL (the adjacency-witness discipline,
    // tests/ad-offer.test.ts). Under the exclusion-stripped mutant this exact signature draws the
    // SAME house twice running – first letter Halfpast at w309 (3 years), second raw draw Halfpast
    // again at w472 – so this arm fails DETERMINISTICALLY under that mutation, where an arbitrary
    // seed would only fail with probability ~1/3 per run. The pure boundary probe below kills the
    // same mutant from the other side (roll 0 must leave the pool's head).
    const SEED = 'p4a-churn-5'
    const w1 = rollFor(SEED, 'watches', 300)
    expect(w1).toBe(309) // the witness's own arithmetic – if the dice move, re-derive the witness
    const world = probeWorld(SEED, w1, 5) // top band
    reviewAdOffer(world)
    const first = post(world, 'watches')[0]
    acceptOffer(world, first.id)
    const firstBrand = (first.terms as AdOfferTerms).brand

    const until = first.untilWeek!
    const w2 = rollFor(SEED, 'watches', until + 1)
    world.week = w2
    world.results.push({ playerId: KID_ID, week: w2, points: 100, tier: 'w100' })
    world.kidRankWta = 5
    reviewAdOffer(world)
    const second = post(world, 'watches').find((o) => o.week === w2)!
    expect(second).toBeDefined()
    expect((second.terms as AdOfferTerms).brand, 'the same house wrote twice running at the top band').not.toBe(firstBrand)
  })

  it('⚠ below the top band a repeat is allowed – the rule is the top band`s own', () => {
    // The pure pick, probed at the boundary: the same roll that must avoid the last house at the
    // top band may land on it below. (0.0 always picks the first pool entry.)
    const houses = AD.categories.watches.houses
    expect(pickAdHouse(houses, houses[0], true, 0)).not.toBe(houses[0])
    expect(pickAdHouse(houses, houses[0], false, 0)).toBe(houses[0])
    // ...and a one-house pool can never deadlock, top band or not.
    expect(pickAdHouse(['Only House'], 'Only House', true, 0.5)).toBe('Only House')
  })

  it('terms run one to three years, and the drawn years price the whole paper', () => {
    // Swept over many letters: every term the engine issues is 1–3 years, the span is years×52,
    // and at least two different lengths occur – the churn is real, not a constant wearing dice.
    const seen = new Set<number>()
    for (let n = 0; n < 12; n++) {
      const seed = `p4a-years-${n}`
      const hit = rollFor(seed, 'cars', 300)
      const world = probeWorld(seed, hit, 150)
      reviewAdOffer(world)
      const t = post(world, 'cars')[0]?.terms as AdOfferTerms | undefined
      if (!t) continue
      expect(t.termYears).toBeGreaterThanOrEqual(1)
      expect(t.termYears).toBeLessThanOrEqual(AD.termYearsMax)
      expect(t.termWeeks).toBe(t.termYears! * WEEKS_PER_YEAR)
      seen.add(t.termYears!)
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })
})

// =================================================================================================
// 5 – THE MONEY: the fee is per contract year, paid at signature and on each anniversary
// =================================================================================================
describe('the anniversaries – three 1-year deals pay what one 3-year deal pays', () => {
  /** A signed multi-year paper built the legacy-probe way, so the payment schedule is the only
   *  thing under test. Fee $100,000/yr for 2 years, signed at `week`. */
  function signedTwoYear(week: number): WorldState {
    const world = probeWorld('p4a-anniv', week, 150)
    world.offers.push({
      id: `ad-cars-${week - 1}`,
      kind: 'ad',
      week: week - 1,
      deadlineWeek: week + 3,
      state: 'signed',
      decidedWeek: week,
      fromWeek: week,
      untilWeek: week + 104 - 1,
      terms: { category: 'cars', brand: 'Caldera Auto', trade: 'We make cars', cashCents: 100_000_00, termYears: 2, termWeeks: 104, shootCount: 1, shootWeeks: [] },
    })
    return world
  }

  // ⚠ RE-AIMED BY ROUND 29 PART THREE P3, 29.08. This arm's claim is «the anniversary pays one
  // year-fee and it goes through `bankSponsorCheque` like every sponsor cheque» – which is exactly
  // what P6 said it was for and is unchanged. What moved is the SPLIT that function applies: her
  // ramp became the manager's commission, so the family banks the fee and she banks the rest.
  it('⭐⭐ the anniversary pays the year-fee through the splitter; the off-years and the term`s end pay nothing', () => {
    const world = signedTwoYear(300)
    // Week 352 – the first anniversary: one year-fee, split at the manager's commission.
    world.week = 352
    const before = world.fundsCents
    const kidBefore = world.kidFundsCents ?? 0
    payAdAnniversaries(world)
    const hers = 100_000_00 - managerCommissionCents(100_000_00)
    expect(world.fundsCents - before).toBe(100_000_00 - hers)
    expect((world.kidFundsCents ?? 0) - kidBefore).toBe(hers)
    const row = world.events.find((e) => e.week === 352 && e.category === 'sponsor')
    expect(row?.text).toContain('year 2 of 2')

    // An ordinary mid-term week pays nothing...
    const quiet = signedTwoYear(300)
    quiet.week = 330
    payAdAnniversaries(quiet)
    expect(quiet.events.filter((e) => e.category === 'sponsor')).toEqual([])
    // ...and the second anniversary is PAST the term – the deal died at week 403 and owes nothing.
    const past = signedTwoYear(300)
    past.week = 404
    const fundsPast = past.fundsCents
    payAdAnniversaries(past)
    expect(past.fundsCents).toBe(fundsPast)
  })

  it('⚠ every letter written before the portfolio is unreachable: a 52-week term has no anniversary inside it', () => {
    const world = probeWorld('p4a-anniv-legacy', 300, 150)
    world.offers.push({
      id: 'ad-290',
      kind: 'ad',
      week: 290,
      deadlineWeek: 294,
      state: 'signed',
      decidedWeek: 291,
      fromWeek: 291,
      untilWeek: 291 + 51,
      terms: { brand: 'Quiet Hour', cashCents: 20_000_00, termWeeks: 52, shootCount: 2, shootWeeks: [] },
    })
    for (let w = 291; w <= 291 + 60; w++) {
      world.week = w
      payAdAnniversaries(world)
    }
    expect(world.events.filter((e) => e.category === 'sponsor')).toEqual([])
  })
})

// =================================================================================================
// 6 – P9: THE WINTER SHOOT SEASON, AND THE DISPLACED REST, READ OUT OF A TICKED WORLD
// =================================================================================================
describe('P9 – the winter is the shoot season, and its cost is the rest it displaces', () => {
  it('⭐⭐ a letter signed on the way into winter books its shoot into the winter weeks', () => {
    // A real adult career, walked to the week before the winter window, handed a letter and a
    // signature through the engine's own commands – then the paper is read back.
    const world = createWorld('p4a-winter', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = resumeMain(world.rngMain)
    while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
    // ...to season offset 44 of the CURRENT season year: just before the winter, with the whole
    // window still ahead of the lead.
    while (world.week % WEEKS_PER_YEAR !== 44) tickWeek(world, rng)
    world.results.push({ playerId: KID_ID, week: world.week, points: 400, tier: 'w100' })
    world.onRampCleared = { itf: true, wta: true }
    recomputeKidRank(world)
    const standing = sponsorStandingOf(world)
    expect(standing.wtaRanked).toBe(true)
    reviewAdOffer(world) // the gate may or may not roll a letter on this exact week...
    const terms = { category: 'watches' as const, brand: 'Quiet Hour', trade: 'We make watches', cashCents: 20_000_00, termYears: 1, termWeeks: 52, shootCount: 1 }
    world.offers.push({ id: `ad-watches-${world.week}`, kind: 'ad', week: world.week, deadlineWeek: world.week + 4, state: 'open', terms })
    acceptOffer(world, `ad-watches-${world.week}`)
    const named = (terms as AdOfferTerms).shootWeeks!
    expect(named).toHaveLength(1)
    expect(isWinterShootWeek(named[0]), `the shoot went to week ${named[0]}, not the winter`).toBe(true)
    expect(named[0]).toBeGreaterThanOrEqual(world.week + AD.shootLeadWeeks)
  })

  it('⭐⭐⭐ the displaced rest, out of a TICKED world: the winter shoot week recovers like a trip', () => {
    // Two identical careers ticked through the same winter week; one holds a signed deal naming it
    // a shoot week. The whole difference in what the week gives back is the free week's own rest –
    // base + slider – which is precisely «the cost there is displaced rest, not in-season
    // condition» (P9). Blackout and physio ride equally on both arms, so they cancel.
    function through(shoot: boolean): { condition: number; base: number } {
      const world = createWorld('p4a-winter-cost', { ...DEFAULT_PROFILE, coachTier: 'self' })
      const rng = resumeMain(world.rngMain)
      while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
      while (world.week % WEEKS_PER_YEAR !== 48) tickWeek(world, rng)
      const target = world.week + 1 // season offset 49 – deep winter, event-free by the calendar
      expect(isWinterShootWeek(target)).toBe(true)
      if (shoot) {
        world.offers.push({
          id: 'ad-drinks-test',
          kind: 'ad',
          week: world.week - 10,
          deadlineWeek: world.week - 6,
          state: 'signed',
          decidedWeek: world.week - 10,
          fromWeek: world.week - 10,
          untilWeek: world.week - 10 + 51,
          terms: { category: 'drinks', brand: 'Cold Current', trade: 'We make drinks', cashCents: 8_000_00, termYears: 1, termWeeks: 52, shootCount: 1, shootWeeks: [target] },
        })
      }
      world.plan = { train: 60, rest: 40 }
      world.condition = 50
      const base = recoveryBaseFor(world) // her own phase's base, read off the world under test
      tickWeek(world, rng)
      expect(world.week).toBe(target)
      return { condition: world.condition, base }
    }
    const rested = through(false)
    const shot = through(true)
    // The 60/40 plan's free-week rest is base + the slider's +2; the shoot week keeps the winter's
    // own blackout bonus and forfeits exactly that rest. Read as a difference so the +blackout
    // cancels out, and the base is the engine's own (`recoveryBaseFor` – phase-dependent), never a
    // constant this test guessed.
    expect(rested.base).toBe(shot.base)
    expect(rested.condition - shot.condition).toBeGreaterThan(0)
    expect(rested.condition - shot.condition).toBe(
      Math.round(rested.base) + 2 - ECONOMY.condition.matchWeekRecoveryBase,
    )
  })

  it('⚠ the in-season machinery is untouched: an in-season shoot still recovers like a trip too', () => {
    // The four-way clash suite (tests/round29-shoot-clash.test.ts) and the recovery probes
    // (tests/ad-offer.test.ts step 2.2) carry the in-season behaviour; this arm pins only the
    // boundary this file introduced – `isWinterShootWeek` – so a retuned window cannot silently
    // reclassify the season.
    expect(isWinterShootWeek(46)).toBe(true)
    expect(isWinterShootWeek(45)).toBe(false)
    expect(isWinterShootWeek(51)).toBe(true)
    expect(isWinterShootWeek(52)).toBe(false) // offset 0 of the next year
  })
})

// =================================================================================================
// 7 – RNG: INPUT-INDEPENDENCE, RESTATED FOR THE SHELF
// =================================================================================================
describe('the permanent law: signing the whole shelf never touches MAIN', () => {
  it('⭐⭐ an action-laden fortnight and a silent one tap identical MAIN sequences', () => {
    const SEED = 'p4a-rng'
    const build = () => {
      const world = createWorld(SEED, { ...DEFAULT_PROFILE, coachTier: 'self' })
      const rng = resumeMain(world.rngMain)
      while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
      world.results.push({ playerId: KID_ID, week: world.week, points: 400, tier: 'w100' })
      world.onRampCleared = { itf: true, wta: true }
      recomputeKidRank(world)
      return { world, rng }
    }
    const a = build()
    const b = build()
    for (let i = 0; i < 30; i++) {
      tickWeek(a.world, a.rng)
      tickWeek(b.world, b.rng)
      // B signs every advertising letter the moment it lands; A never answers.
      for (const o of b.world.offers.filter((x) => x.kind === 'ad' && x.state === 'open')) {
        acceptOffer(b.world, o.id)
      }
    }
    expect(b.world.offers.some((o) => o.kind === 'ad' && o.state === 'signed'), 'the B arm really signed something').toBe(true)
    expect(b.world.rngMain).toEqual(a.world.rngMain)
  })

  it('bankSponsorCheque is reachable from the anniversary path with zero draws – arithmetic on a decided deal', () => {
    const world = probeWorld('p4a-cheque', 300, 150)
    const main = structuredClone(world.rngMain)
    bankSponsorCheque(world, 1_000_00, { category: 'sponsor', text: 'probe' })
    payAdAnniversaries(world)
    expect(world.rngMain).toEqual(main)
  })
})
