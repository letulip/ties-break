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
//       seasons, and the merch brand is no longer one of them;
//   §7  ⭐⭐⭐ ROUND 30 #23 – THE DECOUPLING. Income and worth are two functions of one signal set,
//       and the arm that proves it is two careers at IDENTICAL fame worth different money – which
//       was IMPOSSIBLE to write before 30.08, when worth was `16 x a year of income`;
//   #24 ⭐⭐⭐ the season-end band ladder: a top-20 who never wins is no longer invisible to her own
//       brand, and the ladder is best-band-only.
//
// ⚠⚠ ROUND 30 #23 ALSO CORRECTED ONE OF THIS HEADER'S OWN CLAIMS. The paragraph above cites
// Federer's retired On stake falling ~52% as the case for the value falling. The owner ruled that
// out of frame – «но это уже будет после завершения игры, по сути нас это не очень интересует, разве
// нет?» – and NOTHING models a post-career decline. The fall the game is in frame for is the
// IN-CAREER one, and §7's last arm is the one that measures it: a slump where the multiple rises and
// the brand is still worth less.
//
// ⚠ MUTATION-VERIFIED, each applied alone and reverted, each watched – the log is at the foot of
// this file.
import { describe, it, expect } from 'vitest'
import {
  assetEarningsRateCents,
  assetValueCents,
  assetWorthCents,
  brandCrowdMult,
  brandMultipleX,
  brandSignalsOf,
  brandWeeklyGrossCents,
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
  type BrandSignals,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
// (SeasonHistoryEntry is inferred at both fixture sites now that byTrack is complete – no cast)
import type { TierId } from '../src/engine/season/types'

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
function winTitles(world: WorldState, tier: TierId, weeks: number[]): void {
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
    // ⚠⚠ AND THE *WORTH* IS GATED THE SAME WAY, which round 30 #23 made a separate claim. The
    // valuation used to inherit this gate for free by going through the rate above; it now goes
    // through `world/brand.ts`, which prices a brand and has no idea what a shelf family is. An
    // academy stage handed a multiple by mistake must still be worth its floor and never the merch
    // dial – so the gate is repeated in `assetWorthCents`, and this is the arm that keeps it there.
    const land = shopItem('academy-land')!
    const owned = { id: land.id, boughtWeek: 0, paidCents: land.entryCents, valueCents: land.entryCents }
    const mislabelled = { ...land, earningsMultipleX: shopItem(MERCH)!.earningsMultipleX }
    expect(assetWorthCents(w, owned, mislabelled), 'a non-earner priced on earnings is worth its floor')
      .toBe(Math.round(land.entryCents * ECONOMY.shop.businessValueFloorShare))
  })
})

describe('round 30 #9 §2 – the worth is years of what it earns, and the earnings are her fame', () => {
  it('⭐⭐⭐ the value is the income\'s own multiple, on a ticked world', () => {
    const w = shopper('r30-9-multiple')
    winTitles(w, 'wta1000', [2, 6, 10])
    // ⭐ ROUND 30 #23 – and a CAREER behind the titles, so the multiple under test is the earned one
    // and not the base. Lost finals move the multiple and never the income (world/brand.ts), which
    // is what makes the ratio below a reading of the ladder rather than of the catalogue.
    // ⚠ SIX, NOT THREE, AND THE NUMBER IS LOAD-BEARING. With three the earned multiple was 14.3,
    // which ROUNDS TO THE BASE – so the card arm below passed on a `shopView` that had gone back to
    // sending the catalogue constant. Found in this file's own mutation pass (M14, green on the first
    // run). Six finals put it at 14.6, which rounds to 15, and the two answers are distinguishable.
    // ⚠ ROUND 32 #3 WIDENED THAT GAP RATHER THAN CLOSING IT: with the base a ramp in fame this
    // fixture's earned multiple is nowhere near 14, so M14's mutation is even easier to see. The
    // sentence above is kept because the REASON six was chosen has to survive the retune.
    loseFinals(w, 'wta250', [1, 3, 5, 7, 9, 11])
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
    // ⭐⭐ ROUND 32 #3 RE-AIMED IT AGAIN, AND THE FLOOR OF THE LADDER IS NO LONGER THE CATALOGUE'S
    // BASE. The base is now what the fame RAMP reaches at `ECONOMY.fame.cap`; the floor a career with
    // nothing behind it and nobody watching sits at is `value.unknownX`. The claim is unchanged –
    // this career earned something above the floor – and the number it is read against moved.
    // ⭐⭐⭐ ROUND 32 #4 RE-AIMED IT A THIRD TIME AND THE 31.08 REVISION AIMED IT BACK, which is worth
    // recording rather than quietly reverting. #4 priced the WORTH on the slow stock while the income
    // kept reading fame, so this ratio stopped being the multiple and became «the multiple times the
    // distance the two clocks had drifted». The owner read the consequence and stopped it – «На пятом
    // году бренд стоит $166 060 при годовом доходе $1 352» – and the memory moved INTO the income
    // (`brandReachOf`). ⭐⭐ So round 30 #9's claim is not merely repaired, it is RESTORED: the row's
    // worth over a year of what the ledger pays it IS the multiple again, to the cent, and it is
    // therefore bounded by the multiple's own band at every week of every career.
    const s = brandSignalsOf(w)
    const earned = brandMultipleX(s, shopItem(MERCH)!.earningsMultipleX!)
    expect(earned, 'the career has earned something above the floor of the ladder')
      .toBeGreaterThan(ECONOMY.business.merch.value.unknownX)
    // ⚠ THE RATIO IS THE CLAIM. A test that recomputed `fame x dial x 52 x N` would pass on a second
    // copy of the formula; this reads the engine's own income for the row it is pricing.
    expect(row.valueCents! / (brandWeeklyGrossCents(s) * WEEKS_PER_YEAR)).toBeCloseTo(earned, 1)
    expect(row.earningsMultipleX, 'and the card quotes the same multiple, whole').toBe(Math.round(earned))
    // ⚠ AND THE STOCK IS REALLY LIVE ON THIS FIXTURE, which is what stops the arm above being a
    // tautology about a career sitting on its own peak.
    expect(s.strength, 'the stock is never below the noise').toBeGreaterThanOrEqual(s.fame)
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
    // ⭐⭐ ROUND 32 #3's CONTROL, READ OFF THE SAME WALK. Asking the shipped `brandMultipleX` at
    // fame = cap returns the PRE-ROUND-32 multiple for the same career exactly, because the base now
    // ramps to it there – so the before/after below is one walk read twice and cannot suffer the
    // arm-divergence hazard. ⚠ NOT a copy of the old formula: there is nothing here to drift from.
    // ⚠⚠ AND SINCE THE 31.08 REVISION EVERY CONTROL HERE HAS TO NEUTRALISE THE REACH AS WELL, or it
    // is not a pre-wave arm at all. `bare` is the signal set with the stock collapsed onto fame;
    // `brandReachOf` then resolves to fame (because `retention < 1`), so both the income and the
    // multiple below read exactly what they read before round 32 #4 – through the SHIPPED functions,
    // with nothing to drift from. This is the null-arm check CLAUDE.md records, applied in advance.
    const bare = (world: WorldState): BrandSignals => {
      const sig = brandSignalsOf(world)
      return { ...sig, strength: sig.fame }
    }
    const preWorth = (world: WorldState): number =>
      brandWeeklyGrossCents(bare(world)) *
      WEEKS_PER_YEAR *
      brandMultipleX({ ...bare(world), fame: ECONOMY.fame.cap, strength: ECONOMY.fame.cap }, shopItem(MERCH)!.earningsMultipleX!)
    // the round-32-#3 reading of the SAME week, on the fame clock – the other half of the control
    // pair below. It is a function of the world, so it is captured at the two moments that matter.
    const fameClock = (world: WorldState): number =>
      brandWeeklyGrossCents(bare(world)) *
      WEEKS_PER_YEAR *
      brandMultipleX(bare(world), shopItem(MERCH)!.earningsMultipleX!)
    walk(w, 2, true)
    const atPeak = ownedOf(w, MERCH)!.valueCents
    const preAtPeak = preWorth(w)
    const at32Peak = fameClock(w)
    const titlesThen = w.trophiesByTier.slam!.titles.length + w.trophiesByTier.wta1000!.titles.length

    walk(w, 2 * WEEKS_PER_YEAR, true)
    const twoOn = ownedOf(w, MERCH)!.valueCents
    const preTwoOn = preWorth(w)
    const at32TwoOn = fameClock(w)
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
    // ⚠⚠ AND IT MOVED AGAIN IN ROUND 32 #3, DOWNWARD, WHICH IS THAT WAVE'S OWN COST MADE VISIBLE:
    // the multiple now falls with fame too, so the fall COMPOUNDS – a quarter of the income times a
    // smaller multiple. The band is read off the measurement rather than guessed
    // (docs/specs/brand-multiple-follows-fame-2026-08.md §6).
    // ⭐⭐⭐ AND IT MOVED BACK UP IN ROUND 32 #4, WHICH IS THAT WAVE'S WHOLE POINT AND NOT A
    // REGRESSION. «Инерция бренда – звучит интересно, давай попробуем»: the brand now reads a stock
    // that halves on four years instead of this week's fame, which halves on two, so two quiet
    // seasons no longer take three quarters of the asset. IT STILL FALLS – that is asserted three
    // lines up and is the claim this arm exists for.
    //
    // ⚠⚠ AND THE 31.08 REVISION MOVED IT BACK DOWN AGAIN, WHICH IS NAMED HERE RATHER THAN QUIETLY
    // RE-BANDED. #4 held the row at about a THIRD of its peak by flooring the WORTH directly while
    // the income kept collapsing, and the owner stopped exactly that: «На пятом году бренд стоит
    // $166 060 при годовом доходе $1 352». The memory now enters through the REVENUE
    // (`brandReachOf`), and the income curve squares its argument – so a floor worth `retention` of
    // the stock buys `retention²` of the income and the hold is about a FIFTH rather than a third.
    // ⭐ It is still far above the pre-#4 arithmetic, which is the comparison that matters: the same
    // two seasons cost five sixths of the asset before this wave and cost four fifths of it now,
    // against an income that has stopped collapsing. docs/specs/brand-inertia-2026-08.md §16.
    expect(twoOn / atPeak).toBeGreaterThan(0.18)
    expect(twoOn / atPeak).toBeLessThan(0.40)
    // ⚠ AND IT IS ABOVE ITS OWN PRE-#4 CONTROL ON THE SAME FIXTURE, so «about a fifth» is a
    // measurement of the feature and not of its absence. `fameClock` is round 32 #3's arithmetic
    // read off this same walk, with the stock neutralised.
    expect(twoOn / atPeak, 'the stock still holds more than a fame-priced brand would')
      .toBeGreaterThan(at32TwoOn / at32Peak)
    // ⭐⭐⭐ AND THE COMPOUNDING IS ASSERTED AGAINST ITS OWN CONTROL RATHER THAN DESCRIBED. The same
    // two weeks priced by the pre-round-32 multiple fall by LESS, because that multiple could not
    // fall at all. This is the arm that reddens if the ramp is ever flattened back to a constant –
    // the two ratios become equal – and it needs no second worktree and no second walk to say so.
    //
    // ⚠⚠ ROUND 32 #4 RE-AIMED THE COMPARISON AND DID NOT WEAKEN IT. `preWorth` prices at fame; the
    // OWNED ROW is now priced at the STOCK, so the two readings answer different questions and the
    // inequality between them stopped meaning what #3 wrote it to mean (measured: the row now falls
    // LESS than its own pre-32 control, which is #4 working and says nothing about the ramp). Both
    // sides are therefore asked ON THE SAME CLOCK – this week's fame, which is what #3's claim is
    // about – so the arm still catches the one thing it was built to catch and catches nothing else.
    expect(preTwoOn / preAtPeak, 'the pre-32 multiple could not fall, so the fall was shallower')
      .toBeGreaterThan(at32TwoOn / at32Peak)
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
    // ⭐⭐ ROUND 30 #23 – A CAREER WITH NOTHING BEHIND IT IS PRICED AT THE FLOOR OF THE LADDER, and
    // that is the discriminating reading of it: `shopper` has banked no season, lost no final and
    // played no professional match, so every rung of `world/brand.ts` adds exactly zero and the row
    // quotes the floor. An arm that pinned a number would pass on a floor that had silently moved.
    // ⭐⭐⭐ ROUND 32 #3 MOVED WHICH CONSTANT THAT IS, AND IT IS THE POINT OF THE WAVE. It used to be
    // the catalogue's `earningsMultipleX` – «even an unknown's brand trades at 14x», which is what
    // the owner was looking at. It is now `value.unknownX`, because this fixture has fame 0 and the
    // base ramps with fame. The row is still rounded whole at the boundary (his 26.08 rule).
    expect(rowOf(w, MERCH).earningsMultipleX, 'the screen is told which sentence to say')
      .toBe(Math.round(ECONOMY.business.merch.value.unknownX))
    expect(fameAt(w), 'and it says the FLOOR because nobody has heard of her – the ramp is at 0').toBe(0)
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
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { points: 0, wins: 0, losses: 0 },
        wta: { endRank, points: 0, wins, losses },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    })
  }
}

/** ⚠ `TierId` AND NOT A HAND-PICKED UNION, since round 30 #23's crowd arms: the room is read off
 *  EVERY shelf a career holds, juniors included, so a helper that only accepted the two professional
 *  rungs the earlier arms happened to use could not express the claim. `vue-tsc` caught this – the
 *  unit runner does not typecheck, so the arms ran green for a while against a narrower signature. */
function loseFinals(world: WorldState, tier: TierId, weeks: number[]): void {
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
    // (below every fame band, so the stock cannot move) and a winning record.
    proSeasons(durable, 10, 60, 20, 8)
    // ⚠⚠ THE TEN LOST FINALS ARE NOW GIVEN TO BOTH CAREERS, RE-AIMED BY ROUND 34 #17 (03.09). They
    // used to be `durable`'s alone, because a lost final below a Slam bought no fame and could
    // therefore differentiate the MULTIPLE while leaving fame untouched. Round 34 made a lost final
    // pay 40% of its tier's title into the fame floor, so a fixture that holds fame equal has to
    // hold the finals equal too. ⚠ THE EXPERIMENT IS UNCHANGED: what still differs is the ten banked
    // seasons and the winning record, and the arms below still read a multiple that only `durable`
    // has earned. Giving them to both is what keeps «fame is held EQUAL by construction» true.
    const finals = [W - 3, W - 4, W - 6, W - 7, W - 8, W - 9, W - 11, W - 12, W - 13, W - 14]
    loseFinals(durable, 'wta500', finals)
    loseFinals(flash, 'wta500', finals)

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

    // ⚠⚠ ROUND 32 #3 – EVERY ARM IN THIS BLOCK IS READ AGAINST `unknownX` AND NOT `base`, because
    // these fixtures carry no fame at all: the base is now the TOP of a ramp that starts here. The
    // four rungs themselves are untouched by that wave, which is what these arms are about.
    const bare = shopper('r30-23-bare')
    expect(fameAt(bare), 'the fixtures in this arm are fameless, so the ramp is at its floor').toBe(0)
    expect(mult(bare), 'nothing behind it and nobody watching is the floor and nothing more').toBe(V.unknownX)

    // «сколько играет» – seasons on tour, at a rank no band notices
    const played = shopper('r30-23-played')
    proSeasons(played, 3, 60, 0, 0)
    // ⚠ the multiple is week-independent by construction (it reads records, not their dates), which
    // is why these arms need no parking and the fame arms below do.
    expect(mult(played)).toBeCloseTo(V.unknownX + 3 * V.seasonX, 5)

    // «она же топ-20» – and it is worth more per season than merely being there
    const high = shopper('r30-23-high')
    proSeasons(high, 3, 15, 0, 0)
    expect(mult(high)).toBeCloseTo(V.unknownX + 3 * V.seasonX + 3 * V.topSeasonX, 5)
    expect(mult(high), 'a top-20 season is worth more than an unnoticed one').toBeGreaterThan(mult(played))

    // «как глубоко проходит» – professional finals reached and LOST
    // ⚠⚠ RE-AIMED BY ROUND 34 #17 (03.09). The block's premise above – «these fixtures carry no fame
    // at all» – stopped being true of THIS one and only this one: a lost final now pays 40% of its
    // tier's title into the fame floor, so `deep` is no longer fameless and the ramp under its
    // multiple is no longer at `unknownX`. The rung is therefore isolated by asking the pricing
    // function about the same career AT FAME ZERO, which is exactly what the arm always meant.
    const deep = shopper('r30-23-deep')
    loseFinals(deep, 'wta250', [2, 3, 4])
    expect(fameAt(deep), 'round 34: the finals themselves now buy fame').toBeGreaterThan(0)
    const deepAtZero = { ...brandSignalsOf(deep), fame: 0, strength: 0 }
    expect(brandMultipleX(deepAtZero, base)).toBeCloseTo(V.unknownX + 3 * V.finalX, 5)

    // «сколько выигрывает» – the win rate, as a share of its own window
    const winner = shopper('r30-23-winner')
    proSeasons(winner, 1, 60, 9, 1) // 90% – at or above the top of the window, so the term is full
    expect(mult(winner)).toBeCloseTo(V.unknownX + V.seasonX + V.winRateX, 5)
    const loser = shopper('r30-23-loser')
    proSeasons(loser, 1, 60, 1, 3) // 25% – under the window, and charged NOTHING for it
    expect(mult(loser)).toBeCloseTo(V.unknownX + V.seasonX, 5)
    // ⚠ AND THE WINDOW REALLY IS A WINDOW: a rate INSIDE it earns a proportional share, which is the
    // arm that fails on a term that had silently become a step.
    const middling = shopper('r30-23-middling')
    // ⚠ 29/40 = 0.725 EXACTLY, which is the midpoint of the shipped [0.60, 0.85] window. A record
    // built by rounding a percentage lands a couple of points off and the arm then reads a
    // tolerance rather than the term – the middle of a window has to be hit, not approached.
    const mid = (V.winRateFrom + V.winRateTo) / 2
    expect(mid, 'the fixture below is the shipped window\'s own midpoint').toBeCloseTo(0.725, 5)
    proSeasons(middling, 1, 60, 29, 11)
    expect(mult(middling)).toBeCloseTo(V.unknownX + V.seasonX + V.winRateX * 0.5, 5)

    // ⚠ AND THE CEILING BINDS, which is what stops a $250,000 rung running away with the shelf.
    // ⚠⚠ ROUND 32 #3 – AND IT NOW TAKES FAME AS WELL AS A CAREER TO REACH IT, which is the wave's
    // headline measurement written as an arm: with the base a ramp, `maxX` binds only near the top of
    // the fame range and a fameless legend sits far below it. Both directions are asserted, because a
    // cap that had silently stopped binding would pass on the first alone.
    const legend = shopper('r30-23-legend')
    proSeasons(legend, 20, 5, 40, 5)
    loseFinals(legend, 'wta500', Array.from({ length: 30 }, (_, i) => i + 1))
    expect(mult(legend), 'every rung capped, and nobody watching – still nowhere near the ceiling')
      .toBeLessThan(V.maxX)
    const famous = brandMultipleX({ ...brandSignalsOf(legend), fame: ECONOMY.fame.cap }, base)
    expect(famous, '...and the same career, known to the whole world, is at it').toBe(V.maxX)
  })

  it('⚠⚠ a TITLE reaches the multiple through FAME and never through the four career rungs', () => {
    // ⚠ FOUND BY MUTATION (M15): making the depth signal count titles as well as lost finals left
    // every arm green. It is exactly the one-dial defect coming back in through the ladder – what she
    // WON is already fully priced into the income through fame, so a title in the LADDER as well is
    // the same fact charged twice.
    //
    // ⚠⚠ ROUND 32 #3 OVERTURNED HALF OF THIS ARM AND KEPT THE HALF M15 GUARDS. The old title said «a
    // title moves the income and NOT the multiple», and that stopped being true the week the base
    // became a ramp in fame: a title raises fame, so it raises the multiple too. That is deliberate
    // and it is the OWNER'S OWN RULING – «главное, чтобы эта известность участвовала в механизме» –
    // and its defence is that these are not one fact priced twice but the two questions a buyer
    // actually asks: how much does it earn, and how BIG is it. What must still be true, and is what
    // M15 was really protecting, is that the four CAREER rungs never see a title: at fame held equal
    // the two careers below are worth the same multiple to the cent.
    const base = shopItem(MERCH)!.earningsMultipleX!
    const W = 6 * WEEKS_PER_YEAR
    const quiet = parkAt(shopper('r30-23-title-a'), W)
    const decorated = parkAt(shopper('r30-23-title-b'), W)
    winTitles(quiet, 'wta250', [W - 3])
    winTitles(decorated, 'wta250', [W - 3])
    winTitles(decorated, 'slam', [W - 2, W - 4])
    expect(fameAt(decorated), 'the Slams really are worth something to her fame').toBeGreaterThan(fameAt(quiet))
    expect(assetEarningsRateCents(decorated, shopItem(MERCH)!), '...and to the income')
      .toBeGreaterThan(assetEarningsRateCents(quiet, shopItem(MERCH)!))
    // ⭐⭐ THE LADDER, READ ALONE. Asking the shipped function at fame = cap puts both careers at the
    // top of the ramp, so what is left of the difference between them IS the four rungs – and there
    // is none, which is M15's claim intact. ⚠ NOT a re-derivation: it is `brandMultipleX` itself.
    const ladderOnly = (w: WorldState): number =>
      brandMultipleX({ ...brandSignalsOf(w), fame: ECONOMY.fame.cap }, base)
    expect(ladderOnly(decorated), 'but the four career rungs never see a title').toBe(ladderOnly(quiet))
    // ...and the multiple really does move, which is the anti-vacuity direction of the arm above: a
    // ramp that had been flattened back to a constant would pass on `ladderOnly` alone.
    expect(brandMultipleX(brandSignalsOf(decorated), base), 'while the multiple itself rises with her fame')
      .toBeGreaterThan(brandMultipleX(brandSignalsOf(quiet), base))
  })

  it('⚠⚠ the win rate is the WTA track alone – a junior season of easy wins buys no multiple', () => {
    // ⚠ FOUND BY MUTATION (M16): reading `SeasonHistoryEntry.wins`, which ADDS all three tables
    // together, left every arm green – and it would let a junior record rate her as a professional
    // winner. `byTrack.wta` is the professional record and is the only one a brand may see, which is
    // the same rule that keeps junior draws out of the fame floor.
    const base = shopItem(MERCH)!.earningsMultipleX!
    const w = shopper('r30-23-junior')
    w.seasonHistory = [
      {
        seasonIndex: 0,
        endRank: 60,
        // the FOLD says she won 96 of 100 – almost all of it junior
        points: 0,
        wins: 96,
        losses: 4,
        byTrack: {
          // ⚠ THE JUNIOR AND DOMESTIC WINS LIVE IN THE FOLD ABOVE AND NOWHERE ELSE, which is the
          // point: `LadderTrack` is domestic / itf / wta, so a junior record reaches a reader only
          // through `SeasonHistoryEntry.wins` – the very field this arm forbids the brand to read.
          domestic: { points: 0, wins: 0, losses: 0 },
          itf: { points: 0, wins: 0, losses: 0 },
          // ...and on the professional table she is under the window and buys nothing for it
          wta: { endRank: 60, points: 0, wins: 1, losses: 3 },
        },
        fundsDeltaCents: 0,
        endFundsCents: 0,
      },
    ]
    const V = ECONOMY.business.merch.value
    expect(brandSignalsOf(w).winRate, 'read off the WTA track, not the fold').toBeCloseTo(0.25, 5)
    // ⚠ ROUND 32 #3 – read against `unknownX`: this fixture carries no fame, so the ramp is at its
    // floor and the only thing above it is the one banked season.
    expect(fameAt(w), 'a hand-built season list and no trophy shelf – fame is 0 here').toBe(0)
    expect(brandMultipleX(brandSignalsOf(w), base), 'so only the season itself counts')
      .toBeCloseTo(V.unknownX + V.seasonX, 5)
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

describe('round 30 #23 §8 – ⭐⭐⭐ THE CROWD, and it is the corridor and never the draw', () => {
  it('⭐⭐⭐ two careers with the SAME fame and the SAME multiple earn differently by the ROOM', () => {
    // ⚠⚠ THE ARM THE OWNER'S OVERRULE TURNS ON. «У нас есть понимание коридора зрителей на каждом
    // турнире, мне кажется этого достаточно вполне.» Both careers hold the same professional record
    // in the same weeks, so the fame stock is identical to the last decimal and `finalsLost` and
    // therefore the MULTIPLE are identical. The only difference is the SIZE OF THE ROOMS they played
    // in besides.
    //
    // ⚠⚠ RE-AIMED BY ROUND 34 #17 (03.09) AND THE CLAIM IS UNCHANGED. The fixture used to make the
    // rooms differ with a w15 shelf against a wta1000 one, which worked because a lost final below a
    // Slam bought no fame. Round 34 pays every professional lost final into the fame floor, so those
    // two shelves are no longer the same fame – and the room difference has moved to the JUNIOR
    // rungs, which buy no fame at all and are not in `finalsLost` either, but which the crowd ledger
    // reads deliberately («the CROWD does not care what the world reads»). ⭐ It is a better fixture
    // for the claim than the old one: a J30 draws 30-90 and a J300 draws 900-2,600, which is the
    // table's own point that the room is NOT ordered by prestige.
    const W = 6 * WEEKS_PER_YEAR
    const small = parkAt(shopper('r30-23-room-small'), W)
    const big = parkAt(shopper('r30-23-room-big'), W)
    const pro = [W - 3, W - 4, W - 5, W - 6]
    loseFinals(small, 'w50', pro)
    loseFinals(big, 'w50', pro)
    const junior = [W - 8, W - 10, W - 12, W - 14, W - 16, W - 18, W - 20, W - 22]
    winTitles(small, 'j30', junior)
    winTitles(big, 'j300', junior)

    const base = shopItem(MERCH)!.earningsMultipleX!
    expect(fameAt(big), 'fame is EQUAL by construction – the world does not read junior draws')
      .toBeCloseTo(fameAt(small), 10)
    expect(fameAt(small), '...and it is a real stock, not two zeros compared').toBeGreaterThan(0)
    expect(brandMultipleX(brandSignalsOf(big), base), '...and so is the multiple: four finals each')
      .toBeCloseTo(brandMultipleX(brandSignalsOf(small), base), 10)

    expect(brandSignalsOf(big).roomSize, 'the room really is the thing that differs')
      .toBeGreaterThan(brandSignalsOf(small).roomSize * 10)
    expect(assetEarningsRateCents(big, shopItem(MERCH)!), 'so the bigger room sells more')
      .toBeGreaterThan(assetEarningsRateCents(small, shopItem(MERCH)!))
  })

  it('⚠ it is BOUNDED both ways and 1 with no evidence – it tilts the answer, never carries it', () => {
    const C = ECONOMY.business.merch.crowd
    const bare = shopper('r30-23-room-none')
    expect(brandSignalsOf(bare).roomSize, 'no recorded appearance at all').toBe(0)
    expect(brandCrowdMult(brandSignalsOf(bare)), 'no evidence is 1, never 0 – an empty ledger is not an empty stand')
      .toBe(1)
    // the two ends, driven to absurdity and clamped
    const tiny = { ...brandSignalsOf(bare), roomSize: 1 }
    const huge = { ...brandSignalsOf(bare), roomSize: 10_000_000 }
    expect(brandCrowdMult(tiny)).toBe(C.minMult)
    expect(brandCrowdMult(huge)).toBe(C.maxMult)
    // ...and it is CENTRED: the reference room reads exactly 1, which is what holds the day-one anchor
    expect(brandCrowdMult({ ...brandSignalsOf(bare), roomSize: C.refRoom })).toBeCloseTo(1, 10)
  })

  it('⭐⭐ the room is RECOMPUTABLE FROM THE SAVE – it is a signal, not a session artefact', () => {
    // ⚠⚠ THE COORDINATOR'S OWN TEST, and it is why the signal reads the trophy ledger rather than her
    // entries: NO career-long record of what she ENTERED survives. `world.results` prunes at 52
    // weeks, the news feed caps at 400 rows, and `seasonEntries` and `proEntryWeeks` are both pruned
    // to the current season. `trophiesByTier[tier].titles/finals` is the only dated, per-tier,
    // NEVER-PRUNED appearance ledger in the game – so this reads the rooms she reached finals day in,
    // which is narrower than «who saw her» and is the part a save can still answer for.
    const W = 6 * WEEKS_PER_YEAR
    const w = parkAt(shopper('r30-23-room-reload'), W)
    winTitles(w, 'wta500', [W - 2])
    loseFinals(w, 'wta1000', [W - 3, W - 9])
    const before = brandSignalsOf(w).roomSize
    expect(before).toBeGreaterThan(0)
    // a round trip through the wire, which is what a load is
    const reloaded = JSON.parse(JSON.stringify(w)) as WorldState
    expect(brandSignalsOf(reloaded).roomSize, 'the same answer after a save and a load').toBe(before)
    // ⚠ AND IT IS THE CORRIDOR AND NOT THE DRAW, which is what keeps `eventCrowd` decorative and its
    // grep guard green: the same tier gives the same room every time, with no event id anywhere in it.
    expect(brandSignalsOf(w).roomSize).toBe(brandSignalsOf(w).roomSize)
  })

  it('⚠⚠ a JUNIOR final counts a room even though it buys no fame – the two ledgers disagree on purpose', () => {
    // ⚠ THE FAME FLOOR IGNORES JUNIOR DRAWS BECAUSE THE WORLD DOES NOT READ THEM. The crowd does not
    // care what the world reads: a J300 is played in front of 900-2,600 people – FORTY TIMES a W15's
    // 20-70 – and that is the fact «сколько зрителей на трибуны приходит» is about. This is also the
    // arm that fails if the room ever gets narrowed to `titleFloor`'s key set.
    // ⚠⚠ THE FIRST DRAFT OF THIS ARM WAS A DEAD GUARD and the mutation pass caught it (M20). It gave
    // both careers a professional title and compared the means, so narrowing the room to
    // `titleFloor`'s key set – which deletes the junior shelf outright – still left the junior side
    // larger, for a reason that had nothing to do with juniors. The claim has to be made on a career
    // that has NOTHING ELSE, or the professional shelf answers it.
    const W = 6 * WEEKS_PER_YEAR
    const junior = parkAt(shopper('r30-23-room-junior'), W)
    junior.trophiesByTier.j300 ??= { titles: [], finals: [] }
    junior.trophiesByTier.j300.titles.push(W - 3, W - 4)
    expect(fameFloorOf(junior, junior.week), 'the junior shelf buys no fame at all').toBe(0)
    expect(brandSignalsOf(junior).roomSize, '...and yet a J300 final is played in front of people')
      .toBeGreaterThan(0)

    // ...and the corridor's own shape is the thing being read: a J300 is a junior Slam feeder with a
    // federation busing children in (900-2,600), a W15 is an outside court at a club nobody has heard
    // of (20-70). The professional rung is the SMALLER room, which is exactly what
    // `season/preview.ts` says out loud – «the crowd she plays in front of gets smaller as the tennis
    // gets better».
    const w15only = parkAt(shopper('r30-23-room-w15'), W)
    loseFinals(w15only, 'w15', [W - 3, W - 4])
    expect(brandSignalsOf(w15only).roomSize).toBeGreaterThan(0)
    expect(brandSignalsOf(junior).roomSize).toBeGreaterThan(brandSignalsOf(w15only).roomSize * 10)
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
    // ⚠⚠ ROUND 32 #3 TOOK THE SECOND HALF OF THIS ARM AND IT IS NAMED RATHER THAN QUIETLY WEAKENED.
    // It used to read «...and is worth more than the bare mark». With the multiple's base a ramp in
    // fame, this career – four top-20 seasons, no title, fame ≈ 7 – priced BELOW the mark, so the
    // mark was what the row was worth again. #24's own claim survived and is asserted above and
    // below: the brand SELLS, where before #24 it earned exactly zero. What went was the capital
    // gain, and it went because her fame is small, which is the wall round 31 §5 and the elite-shape
    // research already filed. THE COST WAS RECORDED in docs/specs/brand-multiple-follows-fame-2026-08.md
    // §7.
    //
    // ⭐⭐⭐ ROUND 32 #4 GAVE IT BACK AND THE 31.08 REVISION TOOK IT AWAY AGAIN, WHICH IS THE ONE
    // ACCEPTANCE CRITERION THE REVISION COSTS AND IS WRITTEN OUT RATHER THAN QUIETLY RE-BANDED.
    //
    // #4 priced the WORTH on the brand's slow stock – 8.61 here against a fame of 7.24 – and the row
    // cleared the mark at $67,011 against a gross of $45,823. THE OWNER THEN STOPPED THAT MECHANISM:
    // «На пятом году бренд стоит $166 060 при годовом доходе $1 352» – a valuation floored while its
    // earnings collapse under it. The memory moved into the REVENUE, where it enters as
    // `max(fame, retention x strength)`, and this career is only ONE SEASON past her wrap: her stock
    // is 1.19x her fame, `retention` is 0.78, and 0.78 x 8.61 < 7.24 – SO THE FLOOR DOES NOT BIND ON
    // HER AT ALL. She is back at the mark. ⚠ Measured, and it is not a tuning question: the floor
    // would have to retain 97% of the stock to lift her over the mark, which is a retention that has
    // stopped being one. docs/specs/brand-inertia-2026-08.md §19a has the sweep.
    //
    // ⭐ AND WHAT DOES LIFT HER IS SIGNING THE LETTERS HER BAND ALREADY WRITES HER, which is the
    // owner's own item #5 answering the owner's own question: this fixture has signed NOTHING, and
    // the same career with two band-2 deals is worth $105,512 with no new mechanism at all. The arm
    // below asserts that direction rather than the capital gain #4 briefly gave her.
    expect(ownedOf(w, MERCH)!.valueCents, 'a career that signs nothing is worth the mark, and the mark is real money')
      .toBe(Math.round(PRICE * ECONOMY.shop.businessValueFloorShare))
    // ⭐⭐ ...and the SAME career once she signs what her band already writes her clears it, on the
    // multiplier that has always been there plus the collaboration add round 32 #5 put on the floor.
    const signed = parkAt(shopper('r30-24-top20-signed'), 5 * WEEKS_PER_YEAR)
    proSeasons(signed, 4, 18, 24, 12)
    for (const [id, offset] of [['a', 0], ['b', 3]] as [string, number][]) {
      signed.offers ??= []
      signed.offers.push({
        id: `ad-${id}`,
        kind: 'ad',
        week: 1,
        deadlineWeek: 6,
        state: 'signed',
        terms: {
          brand: `House ${id}`,
          category: 'watches',
          cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[2]!,
          termWeeks: signed.week,
          shootCount: 2,
          shootWeeks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => signed.week - 1 - k * 26 - offset).filter((x) => x > 0),
        },
      })
    }
    buyAsset(signed, MERCH)
    expect(ownedOf(signed, MERCH)!.valueCents, 'the top-20 career that signs its own shelf clears the mark')
      .toBeGreaterThan(Math.round(PRICE * ECONOMY.shop.businessValueFloorShare))
    // ⚠ THE MARK IS STILL THE FLOOR UNDER HER and is still the thing that stops a quiet brand
    // reaching zero – asserted on a career with no results at all, so the guard cannot be read as
    // «the floor was removed».
    const unknown = parkAt(shopper('r30-24-unknown'), 5 * WEEKS_PER_YEAR)
    buyAsset(unknown, MERCH)
    expect(fameAt(unknown, unknown.week), 'nobody has heard of her').toBe(0)
    expect(ownedOf(unknown, MERCH)!.valueCents, 'and the mark is what her name is worth')
      .toBe(Math.round(PRICE * ECONOMY.shop.businessValueFloorShare))
    // ⭐ AND THE SAME CAREER, ONCE THE WORLD KNOWS HER, IS WORTH REAL MONEY – which is the direction
    // #24 was about and the arm that stops «worth the mark» being read as «invisible again».
    const known = brandMultipleX({ ...brandSignalsOf(w), fame: ECONOMY.fame.cap }, shopItem(MERCH)!.earningsMultipleX!)
    expect(known, 'her top-20 seasons are still on the ladder and still paid for')
      .toBeGreaterThan(shopItem(MERCH)!.earningsMultipleX!)
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
//
// --- ROUND 30 #23/#24, 30.08. Same regime, each applied ALONE and reverted FROM A FILE COPY. THREE
//     OF THE EIGHT WERE GREEN ON THE FIRST PASS and each one is written up beside the arm that now
//     catches it. -------------------------------------------------------------------------------
//  M11 the income curve flattened back to linear (`famePivot` dropped) -> 2 RED: §2's «pays a curve»
//      in round29p5-business, and §3's half-life band here – half the fame is a QUARTER of the money
//      now, and the band knows it.
//  M12 `brandMultipleX` returning the base (the earned ladder deleted) -> 4 RED, including «two
//      careers at IDENTICAL fame … worth different money», which is the whole item.
//  M13 `seasonEndBands` back to one top-10 rung (#24 reverted)   -> 3 RED: the ladder arm in
//      round29p5-business and both #24 arms here.
//  M14 `shopView` sending the CATALOGUE base instead of the career's multiple -> ⚠ **GREEN on the
//      first pass.** The §2 fixture's earned multiple was 14.3, which ROUNDS TO THE BASE – so the
//      card arm could not tell a live number from a constant. Closed by taking the fixture to six
//      lost finals (14.6 -> 15) and RED after.
//  M15 the depth signal counting TITLES as well as lost finals   -> ⚠ **GREEN on the first pass**,
//      and it is the one-dial defect coming back through the ladder: a title is already fully priced
//      into the income through fame. Closed by «a TITLE moves the income and NOT the multiple» and
//      RED after.
//  M16 the win rate reading `SeasonHistoryEntry.wins` (the three-table FOLD) instead of
//      `byTrack.wta` -> ⚠ **GREEN on the first pass**, and it would rate a junior record as
//      professional form. Closed by the junior-season arm and RED after.
//  M17 `maxX` removed (the ceiling on the whole multiple)        -> 1 RED, ALONE: the caps arm.
//  M18 the worth ignoring the multiple entirely (`x baseX`)      -> 2 RED: the ratio arm and the
//      decoupling arm.
//
// --- THE CROWD OVERRULE, 30.08 (§8). One more dead guard, and the mutation pass found it. --------
//  M19 the crowd term dropped from the income                    -> 1 RED, ALONE: «two careers with
//      the SAME fame and the SAME multiple earn differently by the ROOM».
//  M20 the room narrowed to `titleFloor`'s key set (juniors deleted) -> ⚠ **GREEN on the first
//      pass.** The junior arm gave BOTH careers a professional title and compared the means, so the
//      professional shelf answered it and the junior shelf was never load-bearing. Closed by making
//      the claim on a career that has NOTHING but junior silverware – fame floor 0, room > 0 – and
//      RED after.
//  M21 the room made a decayed TOTAL instead of a mean           -> 1 RED: the same-fame arm. This is
//      the mutation that turns the signal back into fame wearing a hat, which is what the mean exists
//      to prevent.
//  M22 the clamp removed                                          -> 2 RED, including §7's decoupling
//      arm – an unbounded tilt stops being a tilt.
//  M23 «no evidence» answering `minMult` instead of 1             -> 2 RED. An empty appearance ledger
//      is not an empty stand, which is `shared/money.ts`' house rule about facts and missing values.
// =================================================================================================
