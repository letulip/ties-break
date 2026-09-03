// ⭐⭐⭐ ROUND 30 #15 – A CAR COSTS SOMETHING TO KEEP, AND IT GETS DEARER WHILE IT GETS CHEAPER.
//
// THE OWNER, 30.08: «Для машин вполне можно ввести годовую стоимость обслуживания, которая может с
// каждым годом немного расти, как в реальности, пока стоимость авто на рынке падает.»
//
// TWO CURVES AND THEY RUN IN OPPOSITE DIRECTIONS. `annualRateBps` (already there, negative on every
// car) takes the market value down; `upkeepGrowthBps` (new) takes the weekly bill up. Neither is a
// new mechanism – both are fields on the catalogue read by functions that already existed – and the
// whole item is that the second one now has an AGE to be read against.
//
// ⚠ WHAT THIS FILE HOLDS, one describe each:
//   §1  the four cars carry a bill and the elite rungs' bills did not move ONE CENT;
//   §2  the bill really rises with the car's age, on a TICKED world, in the wallet and the ledger;
//   §3  the two curves cross – the value falls while the bill rises, on one car, in one career;
//   §4  ⭐⭐ the cap: it can at most double, and «мы ни за что не наказываем» survives it;
//   §5  the card and the till quote ONE number – the defect `assetUpkeepCents`' own note is about.
//
// ⚠ EVERY FIGURE IS READ OUT OF A TICKED WORLD OR OFF THE VIEW THE SCREEN READS, never off the
// constant that produced it – `tests/round29-shop-elite.test.ts`'s own rule, and the reason a retune
// has to come through this file.
import { describe, it, expect } from 'vitest'
import {
  assetUpkeepCents,
  buyAsset,
  closeTournament,
  createWorld,
  ownedAssets,
  sellAsset,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  weeklyAssetUpkeepCents,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** The door the engine opens, `tests/round29-shop-elite.test.ts`'s own helper verbatim. */
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

function shopper(seed: string, weeks = 12, fundsCents = 5_000_000_00): WorldState {
  const world = professional(createWorld(seed))
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = fundsCents
  return world
}

/** Tick `n` weeks of a real career. ⚠ THE WALLET IS TOPPED BACK UP EACH WEEK on purpose in the long
 *  walks: what is under test is the BILL over fifteen years, and a career that goes bankrupt in year
 *  nine stops ticking and would answer a different question quietly. */
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

const CARS = ['car-sensible', 'car-good', 'car-nineteen', 'car-unreasonable'] as const
const rowOf = (w: WorldState, id: string) => shopView(w).rows.find((r) => r.id === id)!
const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)

describe('round 30 #15 §1 – the cars carry a bill, and nothing else on the shelf moved', () => {
  it('⭐⭐ all four cars now cost something to keep, and it climbs with the rung', () => {
    const w = shopper('r30-15-ladder')
    const bills = CARS.map((id) => rowOf(w, id).upkeepCents)
    for (const [i, id] of CARS.entries()) {
      expect(bills[i], `${id} costs something to keep`).toBeGreaterThan(0)
    }
    // ⚠ STRICTLY INCREASING, which is the ladder's own claim: a dearer car is dearer to keep in
    // money AND in share of what it cost. Both halves, because only the second is a design decision.
    for (let i = 1; i < bills.length; i++) {
      expect(bills[i], `${CARS[i]} costs more a week than ${CARS[i - 1]}`).toBeGreaterThan(bills[i - 1])
      expect(
        shopItem(CARS[i])!.upkeepBps!,
        `${CARS[i]} costs a LARGER SHARE of its price than ${CARS[i - 1]}`,
      ).toBeGreaterThanOrEqual(shopItem(CARS[i - 1])!.upkeepBps!)
    }
    // ⭐ AND THE TOP RUNG IS THE POINT OF THE LADDER – §3f's «the toys compete with the team for the
    // same money», read one family down: the unreasonable car is about an elite coach a week.
    expect(rowOf(w, 'car-unreasonable').upkeepCents).toBeGreaterThan(400_00)
  })

  it('⚠⚠ ...and the elite rungs\' bills did not move ONE CENT, which is the scope of the item', () => {
    // He said «для машин». The boats and the planes keep the flat 6-10% §3f's «nothing here can
    // strand a family» was measured against, and they carry no growth at all – so the arithmetic
    // for every rung that shipped before this item is byte-identical whatever age is passed in.
    const w = shopper('r30-15-elite')
    for (const [id, weekly] of [
      ['boat-launch', 1_040_00],
      ['boat-sail', 2_770_00],
      ['yacht', 23_080_00],
      ['yacht-big', 53_850_00],
      ['plane', 27_690_00],
    ] as [string, number][]) {
      const item = shopItem(id)!
      expect(item.upkeepGrowthBps, `${id} carries no growth`).toBeUndefined()
      expect(Math.abs(rowOf(w, id).upkeepCents - weekly), `${id} weekly upkeep is §3f's own`).toBeLessThanOrEqual(10_00)
      // ⚠ THE AGE ARGUMENT IS IGNORED ENTIRELY on a rung with no growth, at any age at all – which
      // is what makes «nothing that shipped moved» a property rather than a claim about today's
      // catalogue. Twenty years apart, to the cent.
      expect(assetUpkeepCents(item, item.entryCents, 20 * WEEKS_PER_YEAR)).toBe(
        assetUpkeepCents(item, item.entryCents, 0),
      )
    }
    // ...and the rungs that cost nothing to keep still cost nothing.
    for (const id of ['deposit', 'index-fund', 'house-first', 'house-garden', 'merch-brand', 'academy-land']) {
      expect(rowOf(w, id).upkeepCents, `${id} costs nothing to keep`).toBe(0)
    }
  })
})

describe('round 30 #15 §2 – the bill really rises, on a ticked world', () => {
  it('⭐⭐⭐ eight seasons on, the same car is charged MORE every week – in the wallet and the ledger', () => {
    const w = shopper('r30-15-rise')
    buyAsset(w, 'car-good')
    // The first year's figure, off the view the screen reads.
    const first = rowOf(w, 'car-good').upkeepCents
    expect(first).toBeGreaterThan(0)

    // ⚠ THE CHARGE IS READ OUT OF THE LEDGER, not computed here: what is under test is the money
    // that actually left, and `resolveAssetUpkeep` is the only thing that moves it. ⚠ KEYED ON
    // `world.week` AND NOT ON `world.week - 1`: the finance phase books the row under the week the
    // tick has just moved TO, which is the same week `shopView` is answering about – that identity
    // is the whole of §5 below, and getting it wrong here is how a test would read a stale row.
    const chargeThisWeek = (world: WorldState): number => {
      // ⚠ RE-AIMED AT ROUND 35 #5 – `car-good`'s LABEL is «The luxury four-by-four» since 03.09 (his
      // painting for the $110,000 rung is a four-by-four, not a saloon). The bill this row asserts
      // is unchanged to the cent; the string it is filed under is the rung's new name.
      const row = world.events.find((e) => e.week === world.week && e.text === 'Upkeep: The luxury four-by-four')
      return row ? -(row.amountCents ?? 0) : 0
    }
    walk(w, 1, true)
    const early = chargeThisWeek(w)
    // ⚠ ONE WEEK OF GROWTH ALREADY, WHICH IS THE MECHANIC AND NOT AN ERROR: the curve is continuous
    // (`assetUpkeepCents`' own note), so the first charge is a week older than the shop window's
    // quote and a hair dearer. A whole cent-for-cent match here would mean the growth was a yearly
    // STEP, which is exactly the shape this item did not build.
    expect(early, 'the first charge is the first-year figure plus one week of the curve').toBeGreaterThan(first)
    expect(early / first, '...and only a hair of it').toBeLessThan(1.002)

    walk(w, 8 * WEEKS_PER_YEAR, true)
    const late = chargeThisWeek(w)
    expect(late, 'eight seasons on it costs more').toBeGreaterThan(early)
    // 6% a year for eight years is 1.594x. Asserted as a band rather than a figure, because the walk
    // lands a week either side of the anniversary and the curve is continuous.
    expect(late / early).toBeGreaterThan(1.55)
    expect(late / early).toBeLessThan(1.65)
    // ⚠ AND THE HOUSEHOLD METER AGREES WITH THE TILL, at the new figure – one arithmetic, two
    // readers, which is the rule `weeklyAssetUpkeepCents` exists to keep.
    expect(weeklyAssetUpkeepCents(w)).toBe(late)
  })

  it('⚠ a car bought LATER is charged its own first year, not the older car\'s bill', () => {
    // The clock is the THING's, not the career's – `assetHeldWeeks` reads `basisWeek ?? boughtWeek`,
    // the same span the value depreciates over. A family that replaces a car starts again.
    const w = shopper('r30-15-clock')
    buyAsset(w, 'car-good')
    const atPurchase = rowOf(w, 'car-good').upkeepCents
    walk(w, 6 * WEEKS_PER_YEAR, true)
    const aged = rowOf(w, 'car-good').upkeepCents
    expect(aged).toBeGreaterThan(atPurchase)
    // The SAME rung, unowned by a fresh family in the same week, quotes the first year again.
    const fresh = shopper('r30-15-clock-2')
    walk(fresh, 6 * WEEKS_PER_YEAR, true)
    expect(rowOf(fresh, 'car-good').upkeepCents, 'the shop window quotes the bill this purchase would START').toBe(
      atPurchase,
    )
  })
})

describe('round 30 #15 §3 – the two curves cross', () => {
  it('⭐⭐⭐ the car is worth less every season and costs more every season, in one career', () => {
    const w = shopper('r30-15-cross')
    buyAsset(w, 'car-nineteen')
    const worth0 = ownedOf(w, 'car-nineteen')!.valueCents
    const bill0 = weeklyAssetUpkeepCents(w)
    walk(w, 10 * WEEKS_PER_YEAR, true)
    const worth10 = ownedOf(w, 'car-nineteen')!.valueCents
    const bill10 = weeklyAssetUpkeepCents(w)

    expect(worth10, 'ten seasons of 12% a year').toBeLessThan(worth0)
    expect(bill10, '...and the bill went the other way').toBeGreaterThan(bill0)

    // ⭐⭐ AND THE SHARE IS THE FINDING, WHICH IS WHY IT IS ASSERTED SEPARATELY FROM THE TWO LEVELS.
    // A year of upkeep against what the car is now WORTH climbs far faster than either curve alone,
    // because the numerator rises while the denominator falls. That compounding is the whole of «как
    // в реальности» and it falls out of the two fields rather than out of a third rule.
    const share0 = (bill0 * WEEKS_PER_YEAR) / worth0
    const share10 = (bill10 * WEEKS_PER_YEAR) / worth10
    expect(share10 / share0, 'a year of keeping it, as a share of what it is now worth').toBeGreaterThan(3)
  })
})

describe('round 30 #15 §4 – the cap, and nothing can strand a family', () => {
  it('⭐⭐ the bill can at most DOUBLE, however long it is kept', () => {
    const item = shopItem('car-good')!
    const first = assetUpkeepCents(item, item.entryCents, 0)
    // ⚠ FORTY YEARS, WHICH NO CAREER REACHES – the point is that the bound is a property of the
    // function and not of the horizon anybody happens to walk. ⚠ AND THE TWO ARE ASSERTED EQUAL TO
    // EACH OTHER rather than to `first x cap`: the engine rounds ONCE, at the end, so `2 x round(x)`
    // and `round(2x)` differ by a cent on this rung – and it is the engine that is right. A test
    // that double-rounded would be pinning its own arithmetic instead of the function's.
    const capped = assetUpkeepCents(item, item.entryCents, 40 * WEEKS_PER_YEAR)
    expect(assetUpkeepCents(item, item.entryCents, 100 * WEEKS_PER_YEAR), 'a real ceiling').toBe(capped)
    expect(Math.abs(capped - first * ECONOMY.shop.upkeepGrowthCapX), 'and the ceiling IS the cap').toBeLessThanOrEqual(1)
    // ...and it is still CLIMBING before the cap, so the cap is a ceiling rather than a flat rate.
    const eight = assetUpkeepCents(item, item.entryCents, 8 * WEEKS_PER_YEAR)
    expect(eight).toBeGreaterThan(first)
    expect(eight).toBeLessThan(capped)
  })

  it('⚠⚠ a car can always be sold, so no family is ever locked under a rising bill', () => {
    // §3f's own safety property, checked against the new curve rather than assumed from it: a car
    // has NO build wait, so it is sellable from the week it is bought and every week after. The
    // rising bill can always be ended by the family that started it.
    const w = shopper('r30-15-escape')
    buyAsset(w, 'car-unreasonable')
    expect(rowOf(w, 'car-unreasonable').readyWeek, 'no wait, so no locked weeks').toBeNull()
    walk(w, 12 * WEEKS_PER_YEAR, true)
    expect(weeklyAssetUpkeepCents(w)).toBeGreaterThan(0)
    const before = w.fundsCents
    const worth = ownedOf(w, 'car-unreasonable')!.valueCents
    w.fundsCents = before
    // sold whole, at the stored value, and the bill goes with it
    sellAsset(w, 'car-unreasonable')
    expect(w.fundsCents).toBe(before + worth)
    expect(weeklyAssetUpkeepCents(w), 'the bill ended with the car').toBe(0)
  })
})

describe('round 30 #15 §5 – the card and the till quote ONE number', () => {
  it('⭐⭐ an owned row quotes what the ledger is charging TODAY, not what it charged in year one', () => {
    // ⚠ THIS IS THE DEFECT `assetUpkeepCents`' OLD NOTE WAS ABOUT, kept by moving the card rather
    // than by freezing the bill: «a weekly cost that drifts away from the number on the card is the
    // shape of defect this file's own one-arithmetic-one-writer rule exists to stop».
    const w = shopper('r30-15-one-number')
    buyAsset(w, 'car-sensible')
    walk(w, 7 * WEEKS_PER_YEAR, true)
    const row = rowOf(w, 'car-sensible')
    const charged = w.events.find((e) => e.week === w.week && e.text === 'Upkeep: The sensible estate')
    expect(charged, 'the till charged this week').toBeDefined()
    expect(row.upkeepCents, 'and the card says the same number').toBe(-(charged!.amountCents ?? 0))
    // ...and the whole-shelf figure the strip reads is the same one again.
    expect(shopView(w).upkeepCents).toBe(row.upkeepCents)
  })
})
