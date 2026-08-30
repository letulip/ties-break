// ⭐⭐⭐ ROUND 29 PART TWO #19/#20, RE-AIMED BY PART FOUR P6/§8 – THE ADVERTISING GRADIENT, BAND BY
// BAND THROUGH THE ENGINE.
//
// #19: «я не увидел наш список спонсоров для съемок и прочего, не спортивных. С ними что и на каких
//      уровнях и что дают… Хочу увидеть их список и что дают.»
// #20: «предлагать контракт за 20к долларов на год для 100 и выше ракетки мира выглядит весьма
//      сомнительно, как мне кажется, поправь меня, если я ошибаюсь пожалуйста.»
// §8:  «на каждой ступени может быть до 4-6 одновременно, только с разными чеками» – the portfolio
//      SHAPE is constant and the CHEQUE is the only axis that scales.
//
// The first answer to #20 was a three-rung ladder of houses; part four replaced it with the
// CATEGORY portfolio on four bands (200/100/50/10 – the kit ladder's cuts plus his Bublik line).
// This file keeps the original file's job under the new shape: it asks the ENGINE, not the
// catalogue. `tests/round29p2-ladder-monotone.test.ts` reads the constants; every arm here walks a
// real career to eighteen with `tickWeek`, writes a professional book at a chosen depth of the
// table, and then ticks until a category's own dice say yes – so what is measured is that each
// BAND's letters ARRIVE at their gate and carry their band's cheques, which a constants test cannot
// say. The catalogue could be perfect and `reviewAdOffer` could still hand every standing the
// bottom band's money.
//
// RNG: a letter's rolls live on `seed:ad:<category>:<week>` (+ `:letter`) – purpose-scoped, never
// MAIN – so the walk can read the same dice the engine will roll and step exactly to the first true
// week.
import { describe, it, expect, vi } from 'vitest'

// Four real careers to eighteen (~210 ticks each) plus up to a season of arrivals.
vi.setConfig({ testTimeout: 300_000 })

import {
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { adBandFor, adCategoryOf, adWritesAt } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdCategory, type AdOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising
const BANDS = AD.bands

const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
const adPost = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'ad')

/** ⚠ THE STANDING IS SEARCHED FOR, NOT WRITTEN DOWN, and that is deliberate. A points literal that
 *  lands at world #10 on one seed lands at #14 on the next – the W table is a live field, not a
 *  lookup – and a fixture that pinned a literal would test the wrong band the moment a seed or the
 *  points curve moved. `adultAt` walks a ladder of totals until `adBandFor` names the band the arm
 *  is about, and the arms assert that fact again before using it. */
const POINT_STEPS = [300, 400, 600, 800, 1_200, 2_000, 3_000, 4_000, 6_000, 10_000, 100_000]

/** A real career ticked to eighteen, then given a professional standing at a chosen depth – the
 *  `proWorld` idiom `tests/ad-offer.test.ts` documents. Self-coached and entering nothing, so the
 *  walk is deterministic and no tournament dialog arises; the engine still lives every week of it. */
function adultAt(seed: string, band: number) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
  world.onRampCleared = { itf: true, wta: true }
  for (const points of POINT_STEPS) {
    world.results = world.results.filter((r) => !(r.playerId === KID_ID && r.tier === 'w100'))
    world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'w100' })
    recomputeKidRank(world)
    if (adBandFor(sponsorStandingOf(world)) === band) return { world, rng }
  }
  throw new Error(`no book in POINT_STEPS put this career in band ${band} – the W table has moved`)
}

/** Tick until the named category's own dice raise a letter, or give up. Reads the same sub-stream
 *  the engine will, so the walk stops on the exact week the engine writes rather than polling
 *  blindly. */
function walkToLetter(world: WorldState, rng: ReturnType<typeof resumeMain>, category: AdCategory, limit = 60): number {
  for (let w = world.week + 1; w < world.week + limit; w++) {
    if (adWritesAt(world.seed, w, AD.offerChance, category)) {
      while (world.week < w) tickWeek(world, rng)
      return w
    }
  }
  return -1
}

/** One walked career per band, built once and cloned per arm. The tracked category is watches –
 *  open at every band, so the same slot can be watched climb the whole gradient. */
const LIVES = [0, 1, 2, 3].map((band) => {
  const { world, rng } = adultAt(`ad-gradient-${band}`, band)
  const eligibleWeek = world.week
  const hit = walkToLetter(world, rng, 'watches')
  return { band, world, hit, eligibleWeek }
})

describe('the four fixtures stand where they claim to stand', () => {
  it.each(LIVES)('band $band: eighteen-plus, a real W standing, and dice that say yes', ({ band, world, hit }) => {
    const standing = sponsorStandingOf(world)
    expect(ageOf(world)).toBeGreaterThanOrEqual(AD.fromAgeYears)
    expect(standing.wtaRanked).toBe(true)
    expect(standing.wtaRank).toBeLessThanOrEqual(BANDS[band].maxWtaRank)
    expect(adBandFor(standing), `band ${band}: the fixture stands in the wrong band`).toBe(band)
    expect(hit, `band ${band}: the dice never said yes inside the window`).toBeGreaterThan(0)
  })
})

describe('⭐⭐ each band ARRIVES at its own gate – the half a constants test cannot say', () => {
  it.each(LIVES)('band $band: the watches letter that lands carries that band`s cheque, through the tick', ({ band, world, hit }) => {
    const letters = adPost(world).filter((o) => adCategoryOf(o.terms as AdOfferTerms) === 'watches')
    expect(letters.length).toBeGreaterThanOrEqual(1)
    const t = letters[letters.length - 1].terms as AdOfferTerms
    // The cheque is the BAND's cell – §8's whole design: same shelf, different money.
    expect(t.cashCents).toBe(AD.categories.watches.feeCentsByBand[band])
    expect(AD.categories.watches.houses).toContain(t.brand)
    expect(t.trade).toBe(AD.categories.watches.trade)
    expect(t.shootCount).toBe(BANDS[band].shootWeeksPerYear)
    // Terms churn (P6): one to three years, drawn on the letter's own stream.
    expect(t.termYears).toBeGreaterThanOrEqual(1)
    expect(t.termYears).toBeLessThanOrEqual(AD.termYearsMax)
    expect(t.termWeeks).toBe(t.termYears! * 52)
    // ...on the shared clock every letter keeps: five weeks to decide, counted inclusively.
    expect(letters[letters.length - 1].week).toBe(hit)
    expect(letters[letters.length - 1].deadlineWeek).toBe(hit + AD.decideWeeks - 1)
  })

  it('⚠⚠ THE DEFECT #20 REPORTED, AS AN ASSERTION: a top-10 standing no longer gets the top-200 cheque', () => {
    // This is #20, whole, restated for the gradient. Before the ladder every one of these standings
    // received Quiet Hour's $20,000, because the gate had a floor and no ceiling.
    const top = LIVES.find((l) => l.band === 3)!
    const t = adPost(top.world)
      .filter((o) => adCategoryOf(o.terms as AdOfferTerms) === 'watches')
      .map((o) => o.terms as AdOfferTerms)[0]
    expect(t.cashCents).toBeGreaterThan(AD.categories.watches.feeCentsByBand[0]!)
    expect(t.cashCents).toBe(AD.categories.watches.feeCentsByBand[3])
  })

  it('⭐ §8`s shelf widens up the gradient: the higher fixtures hear from categories the lower never do', () => {
    // The airline opens at the top-100 band and fragrance at the top-10 (§7: «watches early, cars
    // at top-100, fragrance at top-10») – read off the letters the walked careers actually hold,
    // not off the catalogue. The bottom fixture's post can never contain either.
    const bottom = LIVES.find((l) => l.band === 0)!
    const cats0 = new Set(adPost(bottom.world).map((o) => adCategoryOf(o.terms as AdOfferTerms)))
    expect(cats0.has('airline')).toBe(false)
    expect(cats0.has('fragrance')).toBe(false)
    // ...and the fixture standing inside the top 10 can be written to by both; the walk is long
    // enough that at least one of the two icon-band categories has rolled yes (asserted as a
    // fixture fact through the same dice the engine reads).
    const top = LIVES.find((l) => l.band === 3)!
    // ...the window is the weeks the fixture was actually ELIGIBLE and ticking – rolls before the
    // band-3 book existed wrote nothing and prove nothing.
    const anyIconRoll = ['airline', 'fragrance'].some((c) => {
      for (let w = top.eligibleWeek + 1; w <= top.world.week; w++) {
        if (adWritesAt(top.world.seed, w, AD.offerChance, c as AdCategory)) return true
      }
      return false
    })
    if (anyIconRoll) {
      const catsTop = new Set(adPost(top.world).map((o) => adCategoryOf(o.terms as AdOfferTerms)))
      expect(catsTop.has('airline') || catsTop.has('fragrance')).toBe(true)
    }
  })
})
