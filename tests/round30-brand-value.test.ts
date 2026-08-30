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
  buyAsset,
  closeTournament,
  createWorld,
  fameAt,
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
    buyAsset(w, MERCH)
    walk(w, 4, true)

    const row = rowOf(w, MERCH)
    const weekly = merchWeeklyIncomeCents(w)
    expect(weekly, 'the brand is really earning on this fixture').toBeGreaterThan(0)
    expect(row.valueCents, 'and it is worth more than the floor, so the multiple is what is under test')
      .toBeGreaterThan(PRICE * ECONOMY.shop.businessValueFloorShare)
    // ⚠ THE RATIO IS THE CLAIM, not a re-derivation of the arithmetic: what the row is worth,
    // divided by a year of what the ledger pays it, IS the multiple. A test that recomputed
    // `fame x dial x 52 x 16` would pass on a second copy of the formula.
    expect(row.valueCents! / (weekly * WEEKS_PER_YEAR)).toBeCloseTo(shopItem(MERCH)!.earningsMultipleX!, 1)
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
    // ⭐ TWO SEASONS IS THE HALF-LIFE, so the drop is about half – asserted as a band because the
    // fixture's own titles are spread over several weeks.
    expect(twoOn / atPeak).toBeGreaterThan(0.4)
    expect(twoOn / atPeak).toBeLessThan(0.65)
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
    expect(rowOf(w, MERCH).earningsMultipleX, 'the screen is told which sentence to say').toBe(16)
    expect(rowOf(w, 'academy-land').earningsMultipleX, 'and the academy is not').toBeNull()
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
