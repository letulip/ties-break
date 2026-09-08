// ⭐⭐ ROUND 39 #3 – THE AD-CONTRACT TERM LADDER AND THE LIFETIME LETTER.
//
// THE OWNER, 08.09: «мы обсуждали, что на 12 месяцев дают контракты тем, кто только идёт в топ, а
// чем выше - тем дольше. В спорте я видел, что они и на 5, и на 10 лет заключают. А некоторые и
// пожизненно» – and, on the proposed shape: «давай так попробуем, как ты предложил».
//
// The approved ladder, exactly: bands 0–1 (≤400/≤200, the rising career) sign ONE year only; band 2
// (≤100) one to two; band 3 (≤50) one to three; band 4 (≤10) two to five. The 8-year capstone is
// untouched (tests/round29p2-ladder-monotone.test.ts pins it against every band's own max now). And
// the LIFETIME letter: once per career, gated on a Slam title AND the capstone's own tenure read
// (`capstoneSeasonsOf`, reused – never a second derivation), paying its year-fee for ever and
// surviving retirement into the epilogue (`EndingView.lifetimeDeal`).
//
// ⚠ RNG DISCIPLINE, THE ITEM'S OWN HARD RULE: the term is still ONE draw on the letter's own
// sub-stream – the band changes the MAPPING of the uniform, never the number of draws – and §2
// proves it by replaying the exact stream. The lifetime letter, like the capstone, draws only its
// arrival roll on its own purpose scope (`seed:ad:lifetime:<week>`). MAIN is untouched either way;
// tests/condition.test.ts (41550 / e6b0c709) is the standing witness.
import { describe, expect, it } from 'vitest'
import { createWorld, KID_ID, type WorldState } from '../src/engine/world'
import {
  activeAdDeals,
  adCategoryOf,
  adLetterRng,
  adLifetimeTerms,
  adSpokenFor,
  adWritesAt,
  pickAdHouse,
  refuseOffer,
} from '../src/engine/offers'
import { acceptOffer, capstoneSeasonsOf, payAdAnniversaries, reviewAdOffer } from '../src/engine/world/sponsors'
import { buildEndingView, lifetimeDealOf } from '../src/engine/world/endings'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdCategory, type AdOfferTerms, type Offer, type SeasonHistoryEntry } from '../src/shared/protocol'

const AD = ECONOMY.advertising
const L = AD.lifetime

const post = (w: WorldState, c: AdCategory): Offer[] =>
  w.offers.filter((o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === c)

/** The gate-probe idiom (tests/round29p4-ad-portfolio.test.ts): an adult week, a counting book. */
function probeWorld(seed: string, week: number, rank: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
  world.kidRankWta = rank
  return world
}

function rollFor(seed: string, category: AdCategory, from: number, limit = 400): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance, category)) return w
  return -1
}

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

/** A career past the lifetime letter's gate: four banked top-10 seasons and a Slam on the ledger. */
function legend(seed: string, week: number): WorldState {
  const world = probeWorld(seed, week, 5)
  world.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
  world.trophiesByTier.slam ??= { titles: [], finals: [] }
  world.trophiesByTier.slam!.titles.push(week - 30)
  return world
}

describe('round 39 #3 §1 – the ladder is his approved shape, cell for cell', () => {
  it('⭐ 1y · 1y · 1–2 · 1–3 · 2–5, weakest-first, and every band is a real range', () => {
    const cells = AD.bands.map((b) => [b.termYearsMin, b.termYearsMax])
    expect(cells).toEqual([
      [1, 1],
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 5],
    ])
    for (const b of AD.bands) expect(b.termYearsMin).toBeLessThanOrEqual(b.termYearsMax)
  })
})

describe('round 39 #3 §2 – ONE term draw, band-mapped: the stream replays to the letter', () => {
  it('⭐⭐ a top-band cars letter is exactly the two draws the flat code spent – author, then term', () => {
    const seed = 'r39-3-one-draw'
    const hit = rollFor(seed, 'cars', 300)
    expect(hit).toBeGreaterThan(0)
    const world = probeWorld(seed, hit, 5)
    reviewAdOffer(world)
    const t = post(world, 'cars')[0].terms as AdOfferTerms
    // The same purpose-scoped stream the engine rolled, replayed draw for draw: the author is the
    // FIRST uniform, the term is the SECOND – the draw count did not move when the mapping did.
    const rng = adLetterRng(seed, hit, 'cars')
    const brand = pickAdHouse(AD.categories.cars.houses, null, true, rng())
    const top = AD.bands[AD.bands.length - 1]
    const years = top.termYearsMin + Math.floor(rng() * (top.termYearsMax - top.termYearsMin + 1))
    expect(t.brand).toBe(brand)
    expect(t.termYears).toBe(years)
    expect(t.termYears).toBeGreaterThanOrEqual(2)
    expect(t.termYears).toBeLessThanOrEqual(5)
  })

  it('⚠ a rising-career letter still SPENDS its term draw, mapping it onto {1}', () => {
    // The anti-vacuity direction of «never add or remove draws»: if a 1-year band skipped the term
    // draw, every later draw on that stream would shift by one and a replayed career would diverge.
    const seed = 'r39-3-spent-draw'
    const hit = rollFor(seed, 'drinks', 300)
    const world = probeWorld(seed, hit, 380) // the ≤400 band – drinks is one of its two open cells
    reviewAdOffer(world)
    const t = post(world, 'drinks')[0].terms as AdOfferTerms
    const rng = adLetterRng(seed, hit, 'drinks')
    const brand = pickAdHouse(AD.categories.drinks.houses, null, false, rng())
    rng() // the term draw – spent, mapped onto {1}
    expect(t.brand).toBe(brand)
    expect(t.termYears).toBe(1)
  })
})

describe('round 39 #3 §3 – the lifetime letter: gate, paper, money, once, epilogue', () => {
  it('⭐⭐ it arrives only past BOTH halves of the gate – the capstone\'s tenure read plus a Slam', () => {
    const seed = 'r39-3-gate'
    const hit = rollFor(seed, 'lifetime', 300)
    expect(hit).toBeGreaterThan(0)

    const ready = legend(seed, hit)
    expect(capstoneSeasonsOf(ready)).toBeGreaterThanOrEqual(L.seasonsInTop10)
    reviewAdOffer(ready)
    expect(post(ready, 'lifetime'), 'the legend hears from the house').toHaveLength(1)

    // ...no Slam, no letter, whatever the tenure says – the half the capstone never asks.
    const noSlam = probeWorld(seed, hit, 5)
    noSlam.seasonHistory = [seasonAt(0, 8), seasonAt(1, 4), seasonAt(2, 10), seasonAt(3, 2)]
    reviewAdOffer(noSlam)
    expect(post(noSlam, 'lifetime'), 'four top-10 seasons and no Slam is not a legend').toHaveLength(0)

    // ...and a Slam without the tenure is not one either: the gate REUSES capstoneSeasonsOf.
    // ⚠ RE-AIMED 08.09, when the owner cut the gate from four seasons to three: this fixture used to
    // bank three top-10 seasons to sit one under the bar, and the cut made those three PASS - the
    // negative arm was asserting nothing. It is built off the constant now, so it can never again
    // be silently overtaken by a threshold move. The claim is unchanged.
    const noTenure = probeWorld(seed, hit, 5)
    noTenure.seasonHistory = Array.from({ length: Math.max(0, L.seasonsInTop10 - 1) }, (_, i) => seasonAt(i, 4))
    noTenure.trophiesByTier.slam ??= { titles: [], finals: [] }
    noTenure.trophiesByTier.slam!.titles.push(hit - 30)
    expect(capstoneSeasonsOf(noTenure)).toBeLessThan(L.seasonsInTop10)
    reviewAdOffer(noTenure)
    expect(post(noTenure, 'lifetime')).toHaveLength(0)
  })

  it('⭐ the paper: the flag, the icon-band fee, zero shoot weeks, the kit-author rule', () => {
    const t = adLifetimeTerms('Baseline Athletic')
    expect(t.lifetime).toBe(true)
    expect(t.category).toBe('lifetime')
    expect(t.cashCents).toBe(L.cashCents)
    expect(t.cashCents, 'the icon band\'s own biggest trade cheque, made permanent')
      .toBe(AD.categories.fragrance.feeCentsByBand[AD.bands.length - 1])
    expect(t.shootCount).toBe(0)
    expect(t.termYears).toBeUndefined()
    expect(t.termWeeks).toBe(0)
    // ...and through the gate on a career between kit deals, the icon rung's brand signs it.
    const seed = 'r39-3-author'
    const hit = rollFor(seed, 'lifetime', 300)
    const world = legend(seed, hit)
    reviewAdOffer(world)
    expect((post(world, 'lifetime')[0].terms as AdOfferTerms).brand).toBe(ECONOMY.sponsorship.icon.brand)
  })

  it('⭐⭐⭐ signed, it pays every anniversary for ever, and its slot never re-opens', () => {
    const seed = 'r39-3-forever'
    const hit = rollFor(seed, 'lifetime', 300)
    const world = legend(seed, hit)
    reviewAdOffer(world)
    const letter = post(world, 'lifetime')[0]
    acceptOffer(world, letter.id)
    expect(letter.state).toBe('signed')
    expect(letter.untilWeek, 'a lifetime paper has NO untilWeek – absent is the honest value').toBeUndefined()
    expect((letter.terms as AdOfferTerms).shootWeeks).toEqual([])

    // live this week, live a decade on, live a career-length on: the window never shuts...
    for (const at of [hit, hit + 10 * WEEKS_PER_YEAR, hit + 30 * WEEKS_PER_YEAR]) {
      expect(activeAdDeals(world.offers, at).some((o) => o === letter), `live at +${at - hit}`).toBe(true)
      expect(adSpokenFor(world.offers, at, 'lifetime'), `spoken for at +${at - hit}`).toBe(true)
    }

    // ...so no second letter is ever raised – «once per career» with no counter to keep.
    const again = rollFor(seed, 'lifetime', hit + 1)
    expect(again).toBeGreaterThan(0)
    world.week = again
    world.results.push({ playerId: KID_ID, week: again, points: 100, tier: 'w100' })
    reviewAdOffer(world)
    expect(post(world, 'lifetime')).toHaveLength(1)

    // ...and every anniversary banks the year-fee through the one splitter, for ever. The family's
    // half is the manager's commission; the exact split is bankSponsorCheque's own tested contract –
    // here the claim is WHEN it pays: on the anniversary, still paying decades on, never between.
    for (const [years, pays] of [
      [1, true],
      [2, true],
      [10, true],
      [25, true],
    ] as const) {
      world.week = hit + years * WEEKS_PER_YEAR
      const before = world.fundsCents
      payAdAnniversaries(world)
      expect(world.fundsCents > before, `anniversary ${years} pays the family its share`).toBe(pays)
    }
    world.week = hit + 3 * WEEKS_PER_YEAR + 7
    const between = world.fundsCents
    payAdAnniversaries(world)
    expect(world.fundsCents, 'no fee between anniversaries').toBe(between)
  })

  it('⚠ a REFUSED letter shuts nothing – the house may write again («мы ни за что не наказываем»)', () => {
    const seed = 'r39-3-refuse'
    const hit = rollFor(seed, 'lifetime', 300)
    const world = legend(seed, hit)
    reviewAdOffer(world)
    const letter = post(world, 'lifetime')[0]
    refuseOffer(world.offers, letter.id, world.week)
    const again = rollFor(seed, 'lifetime', hit + 1)
    expect(again).toBeGreaterThan(0)
    world.week = again
    world.results.push({ playerId: KID_ID, week: again, points: 100, tier: 'w100' })
    reviewAdOffer(world)
    expect(post(world, 'lifetime'), 'a mis-tap does not cost the career its one lifetime deal').toHaveLength(2)
  })

  it('⭐⭐ it SURVIVES retirement into the epilogue – the fact on the paper, stated', () => {
    const seed = 'r39-3-epilogue'
    const hit = rollFor(seed, 'lifetime', 300)
    const world = legend(seed, hit)
    reviewAdOffer(world)
    acceptOffer(world, post(world, 'lifetime')[0].id)
    const brand = (post(world, 'lifetime')[0].terms as AdOfferTerms).brand
    world.week = hit + 5 * WEEKS_PER_YEAR
    world.ending = { type: 'natural', week: world.week, ageYears: 33, detail: 'the fixture', resumesWeek: null }
    const view = buildEndingView(world)!
    expect(view.lifetimeDeal).toEqual({ brand, cashCents: L.cashCents })
    // ...and the hook is null exactly when no lifetime paper was ever signed.
    const quiet = legend('r39-3-no-deal', hit)
    quiet.ending = { type: 'natural', week: hit, ageYears: 33, detail: 'the fixture', resumesWeek: null }
    expect(buildEndingView(quiet)!.lifetimeDeal).toBeNull()
    expect(lifetimeDealOf(quiet)).toBeNull()
  })
})
