// ⭐⭐⭐ ROUND 30 #9 – THE BRAND IS AN ASSET WITH A VALUE, AND #11 – WHAT «Holds its value» MEANT.
//
// THE OWNER, 30.08: «сам Merch brand тоже вполне может расти в цене как бизнес по какой-то логике,
// похожей на привязку к её рекламе и результатам. Можно провести анализ доходов и стоимости бренда
// RF (Roger Federer) для референса.»
//
// The research is docs/research/player-brands-and-what-they-are-worth.md and its findings are what
// this file is written against: brand value follows the ACCUMULATED stock and not current form
// (Sugarpova grew through a doping ban; Federer earned $90M in a year he played nothing), it FALLS
// for reasons the player cannot touch (his On stake, about −52% in nineteen months while he was
// retired), and a name-attached brand that stops earning is still worth the MARK (Björn Borg's own
// company went bankrupt and the name sold for $18M).
//
// ⚠ WHAT THIS FILE HOLDS, one describe each:
//   §1  the catalogue: exactly one rung is valued as a business, and no rung has two valuations;
//   §2  the worth is the income's own multiple – the same fuel, on a ticked world;
//   §3  ⭐⭐ IT FALLS. A career that goes quiet is worth less every season;
//   §4  the floor: the mark, and a brand at fame zero is not worth nothing;
//   §5  it is priced the week it is bought and it sells for what the row says;
//   §6  ⭐ #11 – the rungs that still say «neither gains nor loses» really do neither, for fifteen
//       seasons, and the merch brand is no longer one of them.
//
// ⚠ MUTATION-VERIFIED, each applied alone and reverted, each watched – the log is at the foot of
// this file.
import { describe, it, expect } from 'vitest'
import {
  assetEarningsRateCents,
  assetValueCents,
  assetWorthCents,
  brandMultipleX,
  brandSignalsOf,
  buyAsset,
  closeTournament,
  createWorld,
  fameAt,
  fameFloorOf,
  merchWeeklyIncomeCents,
  ownedAssets,
  sellAsset,
  shopCatalogue,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { SeasonHistoryEntry } from '../src/shared/protocol'

const MERCH = 'merch-brand'
const PRICE = 250_000_00

function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

function walk(world: WorldState, n: number, keepSolvent = false): void {
  const rng = rngFromSeed(`${world.seed}:walk`)
  for (let i = 0; i < n; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (keepSolvent) world.fundsCents = 5_000_000_00
  }
}

function shopper(seed: string, weeks = 12): WorldState {
  const world = professional(createWorld(seed))
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 5_000_000_00
  return world
}

/** ⭐ FAME, PUT ON THE CAREER THE WAY THE CAREER PUTS IT ON: dated titles in the trophy ledger, which
 *  is one of the four sources `world/fame.ts` folds. ⚠ NOT A FAME FIELD – there isn't one; fame is
 *  re-derived from records on every read, which is the property that keeps it off the MAIN stream. */
function winTitles(world: WorldState, tier: 'wta250' | 'wta1000' | 'slam', weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.titles.push(...weeks)
}

const rowOf = (w: WorldState, id: string) => shopView(w).rows.find((r) => r.id === id)!
const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)

describe('round 30 #9 §1 – the catalogue carries exactly one business valuation', () => {
  it('⭐⭐ one rung is priced on its earnings, it is the merch brand, and no rung has two prices', () => {
    const priced = shopCatalogue().filter((r) => r.earningsMultipleX !== undefined)
    expect(priced.map((r) => r.id), 'exactly one rung is valued as a business').toEqual([MERCH])
    // ⚠⚠ THE THREE VALUATIONS ARE EXCLUSIVE, and this is the arm that keeps them so. A rung carrying
    // both `unitBaseCents` and `earningsMultipleX` would have two prices and `assetWorthCents` would
    // silently pick whichever branch it reached first.
    for (const item of shopCatalogue()) {
      const kinds = [item.unitBaseCents !== undefined, item.earningsMultipleX !== undefined].filter(Boolean).length
      expect(kinds, `${item.id} is valued exactly one way`).toBeLessThanOrEqual(1)
    }
    // ⚠ AND THE 'business' FAMILY IS THE ONE `assetEarningsRateCents` ANSWERS FOR. A future earning
    // rung has to extend that function rather than inherit the merch dial by accident.
    for (const item of shopCatalogue()) {
      if (item.earningsMultipleX === undefined) continue
      expect(item.family, `${item.id} is priced on earnings, so it must be an earner`).toBe('business')
    }
  })

  it('⚠ ...and a rung that is NOT an earner rates zero, whatever multiple it were given', () => {
    // The anti-vacuity direction of the guard above: `assetEarningsRateCents` is family-gated, so an
    // academy stage handed a multiple by mistake would be worth its floor and never the merch dial.
    const w = shopper('r30-9-family')
    winTitles(w, 'slam', [4, 8])
    expect(assetEarningsRateCents(w, shopItem('academy-land')!)).toBe(0)
    expect(assetEarningsRateCents(w, shopItem('car-good')!)).toBe(0)
    expect(assetEarningsRateCents(w, shopItem(MERCH)!)).toBeGreaterThan(0)
  })
})

describe('round 30 #9 §2 – the worth is years of what it earns, and the earnings are her fame', () => {
  it('⭐⭐⭐ the value is the income\'s own multiple, on a ticked world', () => {
    const w = shopper('r30-9-multiple')
    winTitles(w, 'wta1000', [2, 6, 10])
    // ⭐ ROUND 30 #23 – and a CAREER behind the titles, so the multiple under test is the earned one
    // and not the base. Lost finals move the multiple and never the income (world/brand.ts), which
    // is what makes the ratio below a reading of the ladder rather than of the catalogue.
    loseFinals(w, 'wta250', [1, 3, 5])
    buyAsset(w, MERCH)
    walk(w, 4, true)

    const row = rowOf(w, MERCH)
    const weekly = merchWeeklyIncomeCents(w)
    expect(weekly, 'the brand is really earning on this fixture').toBeGreaterThan(0)
    expect(row.valueCents, 'and it is worth more than the floor, so the multiple is what is under test')
      .toBeGreaterThan(PRICE * ECONOMY.shop.businessValueFloorShare)
    // ⚠ THE RATIO IS THE CLAIM, not a re-derivation of the arithmetic: what the row is worth,
    // divided by a year of what the ledger pays it, IS the multiple. A test that recomputed
    // `fame x dial x 52 x N` would pass on a second copy of the formula.
    // ⭐⭐⭐ ROUND 30 #23 RE-AIMED IT AND MADE IT STRICTER. The multiple is no longer the catalogue
    // constant – it is `base + what the career earned` (world/brand.ts) – so this now reads it off
    // `brandMultipleX` AND checks the SHOP ROW quotes the same number to the whole unit. One
    // arithmetic, two surfaces: a screen that said «Worth 10 years of what it sells» while the shelf
    // priced the row at 14 would be this repo's most-repeated defect with a new coat on.
    const earned = brandMultipleX(brandSignalsOf(w), shopItem(MERCH)!.earningsMultipleX!)
    expect(earned, 'the career has earned something above the base').toBeGreaterThan(shopItem(MERCH)!.earningsMultipleX!)
    expect(row.valueCents! / (weekly * WEEKS_PER_YEAR)).toBeCloseTo(earned, 1)
    expect(row.earningsMultipleX, 'and the card quotes the same multiple, whole').toBe(Math.round(earned))
    // ⭐ SAME FUEL, WHICH IS HIS OWN «похожей на привязку к её рекламе и результатам»: more titles,
    // more income AND more value, off ONE number.
    const richer = shopper('r30-9-multiple')
    winTitles(richer, 'wta1000', [2, 6, 10])
    winTitles(richer, 'slam', [12])
    buyAsset(richer, MERCH)
    walk(richer, 4, true)
    expect(fameAt(richer)).toBeGreaterThan(fameAt(w))
    expect(merchWeeklyIncomeCents(richer)).toBeGreaterThan(weekly)
    expect(rowOf(richer, MERCH).valueCents!).toBeGreaterThan(row.valueCents!)
  })

  it('⚠ the value is NOT what was paid for it, which is what every other fixed rung answers', () => {
    // The discriminating negative: a car of the same age is worth its price times its rate, and the
    // brand is not. Without this the arm above would pass on a rung that simply held its price.
    const w = shopper('r30-9-not-paid')
    winTitles(w, 'slam', [2, 5])
    buyAsset(w, MERCH)
    walk(w, 4, true)
    const held = ownedOf(w, MERCH)!
    expect(held.valueCents).not.toBe(held.paidCents)
    expect(held.valueCents).not.toBe(assetValueCents(shopItem(MERCH)!, held.paidCents, 4))
  })
})

describe('round 30 #9 §3 – ⭐⭐ IT FALLS', () => {
  it('⭐⭐⭐ a career that goes quiet is worth less every season, with no new titles at all', () => {
    const w = shopper('r30-9-falls')
    // A real reign, dated early, and then nothing: the fame stock decays on its 104-week half-life
    // and the brand is valued on what is left of it. This is the On-stake shape from the research –
    // the asset falls while nothing about the person changes.
    winTitles(w, 'slam', [2, 4])
    winTitles(w, 'wta1000', [3, 6, 9])
    buyAsset(w, MERCH)
    walk(w, 2, true)
    const atPeak = ownedOf(w, MERCH)!.valueCents
    const titlesThen = w.trophiesByTier.slam!.titles.length + w.trophiesByTier.wta1000!.titles.length

    walk(w, 2 * WEEKS_PER_YEAR, true)
    const twoOn = ownedOf(w, MERCH)!.valueCents
    walk(w, 2 * WEEKS_PER_YEAR, true)
    const fourOn = ownedOf(w, MERCH)!.valueCents

    expect(twoOn, 'two seasons of quiet').toBeLessThan(atPeak)
    expect(fourOn, '...and it keeps falling').toBeLessThan(twoOn)
    // ⚠ AND IT IS THE DECAY AND NOT A LOST TROPHY: the ledger is append-only and nothing was
    // removed, so the fall is the half-life doing what it was built to do.
    expect(w.trophiesByTier.slam!.titles.length + w.trophiesByTier.wta1000!.titles.length).toBe(titlesThen)
    // ⭐⭐ TWO SEASONS IS THE HALF-LIFE, SO THE FAME HALVES – AND THE BRAND LOSES ABOUT THREE
    // QUARTERS, because round 30 #23 made the income CONVEX in fame: half the fame is a quarter of
    // the money. ⚠ THE BAND MOVED AND THE CLAIM DID NOT. It read 0.40–0.65 (a fall of about a half)
    // against the linear dial; it is the same half-life doing the same thing to a curve that squares
    // it, and this is the arm that would have caught the curve being flattened back out.
    expect(twoOn / atPeak).toBeGreaterThan(0.16)
    expect(twoOn / atPeak).toBeLessThan(0.42)
  })

  it('⚠⚠ ...and a NEW title turns it back up, so the fall is a stock and not a clock', () => {
    // The discriminating arm: if the value simply decayed with age it would fall here too. It does
    // not, because what decays is a fold over dated records and a fresh record enters at full weight.
    const w = shopper('r30-9-turns')
    winTitles(w, 'wta1000', [2])
    buyAsset(w, MERCH)
    walk(w, WEEKS_PER_YEAR, true)
    const faded = ownedOf(w, MERCH)!.valueCents
    winTitles(w, 'slam', [w.week - 1])
    walk(w, 1, true)
    expect(ownedOf(w, MERCH)!.valueCents, 'a Slam is worth something to the brand').toBeGreaterThan(faded)
  })
})

describe('round 30 #9 §4 – the floor is the mark', () => {
  it('⭐⭐ a brand with no fame at all is worth a quarter of what it cost, and never zero', () => {
    const w = shopper('r30-9-floor')
    // No titles, no Slam finals, no top-10 seasons, no shoots: fame is genuinely 0 here, which is
    // most of a career and the state a family buying early is in.
    expect(fameAt(w), 'the fixture really has no fame').toBe(0)
    buyAsset(w, MERCH)
    const held = ownedOf(w, MERCH)!
    expect(held.valueCents).toBe(Math.round(PRICE * ECONOMY.shop.businessValueFloorShare))
    expect(held.valueCents).toBeGreaterThan(0)
    // ⚠⚠ AND IT IS A REAL LOSS, WHICH IS THE HALF THE FIRST DRAFT OF THIS ARM COULD NOT SEE. Reading
    // the constant back at itself passes at ANY share, 1.0 included – and a floor at the full price
    // would mean a brand can never be worth less than it cost, which is exactly the risk-free shape
    // the fund spent two rounds removing. Caught in this file's own mutation pass (the share moved
    // to 1.0 and nothing went red) and closed by asserting the DIRECTION as well as the figure.
    expect(held.valueCents, 'a brand nobody has heard of is worth less than it cost').toBeLessThan(PRICE)
    // ⚠ AND THE FLOOR IS A FLOOR RATHER THAN THE ANSWER: a famous career is worth far more than it,
    // which is what makes the assertion above about the quiet case and not about the mechanic.
    const famous = shopper('r30-9-floor-2')
    winTitles(famous, 'slam', [2, 5])
    buyAsset(famous, MERCH)
    expect(ownedOf(famous, MERCH)!.valueCents).toBeGreaterThan(held.valueCents)
  })
})

describe('round 30 #9 §5 – bought and sold at the number on the row', () => {
  it('⭐⭐ it is priced the WEEK it is bought, not a tick later', () => {
    const w = shopper('r30-9-atbuy')
    winTitles(w, 'slam', [2, 4, 6])
    buyAsset(w, MERCH)
    const held = ownedOf(w, MERCH)!
    // ⚠ NO TICK BETWEEN THE PURCHASE AND THE READ. `revalueAssets` would have corrected this next
    // week; a player looking at the row he has just bought would have seen $250,000 in the meantime.
    expect(held.valueCents).not.toBe(PRICE)
    expect(held.valueCents).toBe(assetWorthCents(w, held, shopItem(MERCH)!))
    // ...and every other fixed rung is byte-identical to what it always was at purchase.
    buyAsset(w, 'car-good')
    expect(ownedOf(w, 'car-good')!.valueCents).toBe(110_000_00)
  })

  it('⚠⚠ the week the worth is asked ABOUT is the week it answers for – the meter\'s week ahead', () => {
    // ⚠⚠ `assetWorthCents`' fourth argument is `householdWeekly`'s «one more week of holding», and
    // it is the argument a business valuation could most easily drop on the floor: the two other
    // branches use it through a price and a rate, and this one has to thread it into `fameAt`.
    // Caught in this file's own mutation pass – the first draft had no arm in which the offset could
    // matter, so `fameAt(world, week)` and `fameAt(world, world.week)` were indistinguishable.
    const w = shopper('r30-9-offset')
    winTitles(w, 'slam', [2, 4])
    buyAsset(w, MERCH)
    walk(w, 4, true)
    const held = ownedOf(w, MERCH)!
    const item = shopItem(MERCH)!
    const now = assetWorthCents(w, held, item, 0)
    const nextWeek = assetWorthCents(w, held, item, 1)
    expect(nextWeek, 'a week further from her titles is a week less famous').toBeLessThan(now)
    // ...and it really is the fame moving, not a rounding: the same brand three seasons on is
    // further down again, in the same direction, off the same argument.
    expect(assetWorthCents(w, held, item, 3 * WEEKS_PER_YEAR)).toBeLessThan(nextWeek)
  })

  it('⚠ the sale hands back exactly the row\'s figure', () => {
    const w = shopper('r30-9-sale')
    winTitles(w, 'wta1000', [2, 4])
    buyAsset(w, MERCH)
    walk(w, 8, true)
    const worth = ownedOf(w, MERCH)!.valueCents
    const before = w.fundsCents
    sellAsset(w, MERCH)
    expect(w.fundsCents - before).toBe(worth)
    expect(ownedOf(w, MERCH)).toBeUndefined()
  })
})

describe('round 30 #11 – what the engine does to the rungs that say they neither gain nor lose', () => {
  it('⭐⭐⭐ they really do neither, for fifteen seasons, to the cent', () => {
    // ⚠⚠ THIS IS THE FACT THE RE-WORDING RESTS ON, and it was checked before a word moved. The
    // owner: «Holds its value странно звучит – это напрямую значит, что оно обесценивается, а это
    // вроде бы не совсем так». He is right: a rung at rate 0 is worth `paid x 1^n` – the same cents
    // every week, for as long as it is held – and the sale hands the whole figure back with no
    // spread, no fee and no haircut. There is no inflation anywhere in this engine either, so there
    // is not even a real-terms slide behind the nominal figure.
    const w = shopper('r30-11-holds')
    const zeros = shopCatalogue().filter((r) => r.annualRateBps === 0 && r.earningsMultipleX === undefined)
    expect(zeros.map((r) => r.id), 'the rungs the sentence is now said of').toEqual([
      'academy-land',
      'academy-courts',
      'academy-building',
      'academy-staff',
    ])
    for (const item of zeros) {
      const owned = { id: item.id, boughtWeek: 0, paidCents: item.entryCents, valueCents: item.entryCents }
      for (const years of [1, 5, 15]) {
        const later = { ...w, week: years * WEEKS_PER_YEAR } as WorldState
        expect(assetWorthCents(later, owned, item), `${item.id} after ${years} seasons`).toBe(item.entryCents)
      }
    }
    // ⭐ AND THE SALE IS WHOLE. Bought, held four seasons, sold: the family gets its money back.
    w.fundsCents = 20_000_000_00
    buyAsset(w, 'academy-land')
    walk(w, 4 * WEEKS_PER_YEAR, true)
    const before = w.fundsCents
    sellAsset(w, 'academy-land')
    expect(w.fundsCents - before, 'four seasons later, to the cent').toBe(2_000_000_00)
  })

  it('⚠⚠ ...and the merch brand is no longer one of them, which is why the row he read changed', () => {
    // The other half of #11, and it is #9's doing: the rung he was probably reading «Holds its
    // value» on is now priced as a business, so it never reaches the rate branch at all.
    expect(shopItem(MERCH)!.annualRateBps, 'its rate is still a dead 0 in the catalogue').toBe(0)
    expect(shopItem(MERCH)!.earningsMultipleX, '...and the valuation no longer reads it').toBeDefined()
    const w = shopper('r30-11-merch')
    // ⭐⭐ ROUND 30 #23 – A CAREER WITH NOTHING BEHIND IT IS PRICED AT THE BASE, and that is the
    // discriminating reading of the new ladder: `shopper` has banked no season, lost no final and
    // played no professional match, so every rung of `world/brand.ts` adds exactly zero and the row
    // quotes the catalogue's own figure. An arm that pinned a number would pass on a base that had
    // silently stopped being the floor of the ladder.
    expect(rowOf(w, MERCH).earningsMultipleX, 'the screen is told which sentence to say')
      .toBe(shopItem(MERCH)!.earningsMultipleX)
    expect(rowOf(w, 'academy-land').earningsMultipleX, 'and the academy is not').toBeNull()
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 30 #23 §7 – THE DECOUPLING, WHICH IS THE WHOLE REPAIR
//
// THE OWNER, on being told a convex income curve would hand a $250,000 rung an ~$8.7M peak: «а что с
// этой цифрой не так? вроде бы как раз спонсорские коллаборации со спортсменами дают и не такое, а
// кратно большее.» The block was never a real conflict – it was one dial doing two jobs. Income is
// CURRENT FORM and the multiple is the ACCUMULATED CAREER, which is the research's finding §5.1 as
// arithmetic, and these arms are what make that sentence checkable.
// =================================================================================================

/** ⚠⚠ A BANKED SEASON HAS TO HAVE HAPPENED, and this helper is why the arms below park the world
 *  first. `fameFloorOf` decays each season from its OWN wrap week – `(seasonIndex + 1) x 52` – and
 *  `decayAt` answers ZERO for a week in the future, because «fame is an account of what has
 *  happened». A fixture that pushes ten seasons onto a world sitting at week 12 has written ten
 *  seasons that have not been played yet: the multiple sees them (it is week-independent) and the
 *  fame floor does not, which is a silently half-live fixture. Park, then plant. */
function parkAt(world: WorldState, week: number): WorldState {
  world.week = week
  return world
}

/** Seasons the ranking bands DELIBERATELY do not notice (#60 is below the top-50 rung), so a fixture
 *  can add professional tenure, matches won and lost finals WITHOUT moving the fame stock. ⚠ That is
 *  what makes §7a an experiment rather than a demonstration: fame is held fixed by construction and
 *  asserted equal before the worth is compared. */
function proSeasons(world: WorldState, n: number, endRank: number, wins: number, losses: number): void {
  world.seasonHistory ??= []
  for (let i = 0; i < n; i++) {
    world.seasonHistory.push({
      seasonIndex: i,
      endRank,
      points: 0,
      wins,
      losses,
      byTrack: {
        itf: { endRank, points: 0, wins: 0, losses: 0 },
        wta: { endRank, points: 0, wins, losses },
        junior: { points: 0, wins: 0, losses: 0 },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    } as SeasonHistoryEntry)
  }
}

function loseFinals(world: WorldState, tier: 'wta250' | 'wta500', weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.finals.push(...weeks)
}

describe('round 30 #23 §7 – income and worth are two functions, not one dial', () => {
  it('⭐⭐⭐ two careers at IDENTICAL fame earn the same and are worth different money', () => {
    // ⚠⚠ THE ARM THE WHOLE ITEM TURNS ON. Before 30.08 this was IMPOSSIBLE by construction: worth
    // was `16 x a year of income` and income was a function of fame alone, so equal fame forced
    // equal worth to the cent. If this arm ever goes green on a fixture whose two worlds are worth
    // the same, the repair has been undone.
    // ⚠ BOTH PARKED AT THE SAME LATE WEEK, so ten banked seasons are ten seasons that have been
    // PLAYED (see `parkAt`), and the titles are dated relative to that week so the fame stock is
    // healthy rather than decayed to nothing – a comparison of two zeros proves nothing.
    const W = 11 * WEEKS_PER_YEAR
    const flash = parkAt(shopper('r30-23-flash'), W)
    const durable = parkAt(shopper('r30-23-durable'), W)
    winTitles(flash, 'wta1000', [W - 2, W - 5])
    winTitles(durable, 'wta1000', [W - 2, W - 5])
    // ...and the durable one has a CAREER behind the same noise: ten professional seasons at #60
    // (below every fame band, so the stock cannot move), a winning record, and ten lost finals.
    proSeasons(durable, 10, 60, 20, 8)
    loseFinals(durable, 'wta500', [W - 3, W - 4, W - 6, W - 7, W - 8, W - 9, W - 11, W - 12, W - 13, W - 14])

    expect(fameAt(durable), 'fame is held EQUAL by construction – that is the experiment')
      .toBe(fameAt(flash))
    expect(assetEarningsRateCents(durable, shopItem(MERCH)!), '...so they earn the same to the cent')
      .toBe(assetEarningsRateCents(flash, shopItem(MERCH)!))

    buyAsset(flash, MERCH)
    buyAsset(durable, MERCH)
    const thin = ownedOf(flash, MERCH)!.valueCents
    const thick = ownedOf(durable, MERCH)!.valueCents
    expect(thick, 'the career that lasted is the better asset').toBeGreaterThan(thin)
    // ⚠ AND BY THE MULTIPLE, WHICH IS THE MECHANISM AND NOT A COINCIDENCE: the ratio of the two
    // worths IS the ratio of the two multiples, because the income underneath them is identical.
    const base = shopItem(MERCH)!.earningsMultipleX!
    expect(thick / thin).toBeCloseTo(
      brandMultipleX(brandSignalsOf(durable), base) / brandMultipleX(brandSignalsOf(flash), base),
      2,
    )
  })

  it('⭐⭐ each of the four signals he named moves the multiple on its own, and each cap binds', () => {
    // «У нас есть её профессионализм, сколько играет, сколько выигрывает, как глубоко проходит.»
    // Four rungs, four arms – so a rung that stops being read cannot hide behind the other three.
    const base = shopItem(MERCH)!.earningsMultipleX!
    const V = ECONOMY.business.merch.value
    const mult = (w: WorldState): number => brandMultipleX(brandSignalsOf(w), base)

    const bare = shopper('r30-23-bare')
    expect(mult(bare), 'nothing behind it is the base and nothing more').toBe(base)

    // «сколько играет» – seasons on tour, at a rank no band notices
    const played = shopper('r30-23-played')
    proSeasons(played, 3, 60, 0, 0)
    // ⚠ the multiple is week-independent by construction (it reads records, not their dates), which
    // is why these arms need no parking and the fame arms below do.
    expect(mult(played)).toBeCloseTo(base + 3 * V.seasonX, 5)

    // «она же топ-20» – and it is worth more per season than merely being there
    const high = shopper('r30-23-high')
    proSeasons(high, 3, 15, 0, 0)
    expect(mult(high)).toBeCloseTo(base + 3 * V.seasonX + 3 * V.topSeasonX, 5)
    expect(mult(high), 'a top-20 season is worth more than an unnoticed one').toBeGreaterThan(mult(played))

    // «как глубоко проходит» – professional finals reached and LOST, which nothing else in the game
    // has ever read below a Slam
    const deep = shopper('r30-23-deep')
    loseFinals(deep, 'wta250', [2, 3, 4])
    expect(mult(deep)).toBeCloseTo(base + 3 * V.finalX, 5)

    // «сколько выигрывает» – the win rate, as a share of its own window
    const winner = shopper('r30-23-winner')
    proSeasons(winner, 1, 60, 9, 1) // 90% – at or above the top of the window, so the term is full
    expect(mult(winner)).toBeCloseTo(base + V.seasonX + V.winRateX, 5)
    const loser = shopper('r30-23-loser')
    proSeasons(loser, 1, 60, 1, 3) // 25% – under the window, and charged NOTHING for it
    expect(mult(loser)).toBeCloseTo(base + V.seasonX, 5)
    // ⚠ AND THE WINDOW REALLY IS A WINDOW: a rate INSIDE it earns a proportional share, which is the
    // arm that fails on a term that had silently become a step.
    const middling = shopper('r30-23-middling')
    // ⚠ 29/40 = 0.725 EXACTLY, which is the midpoint of the shipped [0.60, 0.85] window. A record
    // built by rounding a percentage lands a couple of points off and the arm then reads a
    // tolerance rather than the term – the middle of a window has to be hit, not approached.
    const mid = (V.winRateFrom + V.winRateTo) / 2
    expect(mid, 'the fixture below is the shipped window\'s own midpoint').toBeCloseTo(0.725, 5)
    proSeasons(middling, 1, 60, 29, 11)
    expect(mult(middling)).toBeCloseTo(base + V.seasonX + V.winRateX * 0.5, 5)

    // ⚠ AND THE CEILING BINDS, which is what stops a $250,000 rung running away with the shelf.
    const legend = shopper('r30-23-legend')
    proSeasons(legend, 20, 5, 40, 5)
    loseFinals(legend, 'wta500', Array.from({ length: 30 }, (_, i) => i + 1))
    expect(mult(legend)).toBe(V.maxX)
  })

  it('⭐⭐⭐ the worth FALLS during a live career, and the multiple going UP does not save it', () => {
    // ⚠⚠ THE OWNER'S OWN CORRECTION SCOPES THIS ARM (30.08): a retired player's brand decaying is
    // «после завершения игры» and out of frame. What is IN frame is the slump he plays through – a
    // season with no title, fame decaying while she is not winning – and it has to bite there.
    const w = shopper('r30-23-slump')
    winTitles(w, 'slam', [2])
    winTitles(w, 'wta1000', [3, 5])
    buyAsset(w, MERCH)
    walk(w, 4, true)
    const base = shopItem(MERCH)!.earningsMultipleX!
    const before = ownedOf(w, MERCH)!.valueCents
    const multBefore = brandMultipleX(brandSignalsOf(w), base)

    // a season goes by: no new title, and the career banks a professional season, so the MULTIPLE
    // rises while the fame stock falls.
    proSeasons(w, 2, 15, 20, 10)
    walk(w, WEEKS_PER_YEAR, true)
    const after = ownedOf(w, MERCH)!.valueCents
    const multAfter = brandMultipleX(brandSignalsOf(w), base)

    expect(multAfter, 'the career really did earn a higher multiple over that year').toBeGreaterThan(multBefore)
    expect(after, '...and the brand is still worth less, because the income fell further').toBeLessThan(before)
  })
})

describe('round 30 #24 – a top-20 who never wins is no longer invisible to her own brand', () => {
  it('⭐⭐⭐ a career with no title, no Slam final and no top-10 season is worth something', () => {
    // ⚠ THE STRUCTURAL CLAIM, and it is arithmetic rather than a measurement: before the two lower
    // rungs the fame floor for this career was EXACTLY ZERO, so its brand earned nothing and was
    // worth the mark – however high she ranked. His words, three times: «она же топ-20 в мире».
    const w = parkAt(shopper('r30-24-top20'), 5 * WEEKS_PER_YEAR)
    proSeasons(w, 4, 18, 24, 12)
    expect(w.trophiesByTier.slam?.titles ?? [], 'she has won nothing').toEqual([])
    expect(fameFloorOf(w, w.week), 'and the world now notices her anyway').toBeGreaterThan(0)
    buyAsset(w, MERCH)
    expect(assetEarningsRateCents(w, shopItem(MERCH)!), 'so the brand sells').toBeGreaterThan(0)
    expect(ownedOf(w, MERCH)!.valueCents, '...and is worth more than the bare mark')
      .toBeGreaterThan(Math.round(PRICE * ECONOMY.shop.businessValueFloorShare))
  })

  it('⚠ the ladder is BEST-BAND-ONLY, so a top-10 season is never also a top-20 and a top-50 one', () => {
    // `academy.reputationBands`' own rule, and the arm that catches a ladder re-ordered by mistake:
    // the bands are strongest-first and `find` takes the first that holds.
    // ⚠ ONE season each, all three parked at the SAME week, so the decay is identical across the
    // three readings and the RATIOS below are the ladder and nothing else.
    const at = 3 * WEEKS_PER_YEAR
    const ten = parkAt(shopper('r30-24-ten'), at)
    proSeasons(ten, 1, 5, 0, 0)
    const twenty = parkAt(shopper('r30-24-twenty'), at)
    proSeasons(twenty, 1, 15, 0, 0)
    const fifty = parkAt(shopper('r30-24-fifty'), at)
    proSeasons(fifty, 1, 40, 0, 0)
    const bands = ECONOMY.fame.seasonEndBands
    expect(bands.map((b) => b.maxEndRank), 'strongest first, or `find` takes the wrong rung')
      .toEqual([...bands].sort((a, b) => a.maxEndRank - b.maxEndRank).map((b) => b.maxEndRank))
    const tenFloor = fameFloorOf(ten, ten.week)
    expect(tenFloor).toBeGreaterThan(0)
    expect(fameFloorOf(twenty, twenty.week) / tenFloor).toBeCloseTo(bands[1].add / bands[0].add, 5)
    expect(fameFloorOf(fifty, fifty.week) / tenFloor).toBeCloseTo(bands[2].add / bands[0].add, 5)
    // ⚠ AND A SEASON THE LADDER DOES NOT REACH BUYS NOTHING, which is the anti-vacuity direction:
    // without it every rung above would pass on a ladder that simply paid everybody.
    const nobody = parkAt(shopper('r30-24-nobody'), at)
    proSeasons(nobody, 1, 200, 0, 0)
    expect(fameFloorOf(nobody, nobody.week)).toBe(0)
  })
})

// =================================================================================================
// ⚠⚠ MUTATION LOG – each applied ALONE, reverted, and RUN. Every line below is a measured result,
// not a prediction. Two of these found DEAD GUARDS in this file's own draft and both are written up
// where the arm that fixes them lives.
//
//  M1  `earningsMultipleX` deleted from the merch rung          -> 9 RED of 11.
//  M2  `assetEarningsRateCents`' family gate removed            -> 1 RED, ALONE: «a rung that is NOT
//      an earner rates zero».
//  M3  `assetWorthCents`' business branch forced off            -> 6 RED.
//  M4  `Math.max(floor, ...)` -> the annual figure alone        -> 1 RED, ALONE: «never zero».
//  M5  `businessValueFloorShare` 0.25 -> 1.0                    -> ⚠ **GREEN on the first pass.** The
//      arm read the constant back at itself, which passes at any share – including a floor at the
//      full price, which would mean a brand can never be worth less than it cost. Closed by adding
//      the DIRECTION («worth less than it cost») and RED after.
//  M6  `fameAt(world, week)` -> `fameAt(world, world.week)`, i.e. the week argument ignored
//      -> ⚠ **GREEN on the first pass**, because no arm in the draft used a non-zero `weekOffset` –
//      and that offset is what `householdWeekly` quotes the week's move with. Closed by the
//      «meter's week ahead» arm and RED after.
//  M7  `buyAsset`'s `row.valueCents = assetWorthCents(...)` deleted -> 2 RED («priced the WEEK it is
//      bought» and the floor arm), every other arm green – which is exactly the one-week window that
//      arm exists to close.
//  M8  the merch rung's `annualRateBps` 0 -> -600               -> 1 RED, ALONE, confirming the
//      valuation really has stopped reading the rate.
//  M9  `earningsMultipleX` 16 -> 40                             -> 1 RED: the view arm. ⚠ The RATIO
//      arm does not move and should not: it asserts «the worth IS the multiple of a year's income»
//      off the catalogue's own figure, and pinning 16 is the other arm's job.
//  M10 `academy-land`'s rate 0 -> -300                          -> 1 RED, ALONE: «they really do
//      neither, for fifteen seasons» – which is the fact round 30 #11's re-wording rests on.
// =================================================================================================
