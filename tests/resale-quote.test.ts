// ⭐⭐⭐ THE SECONDARY MARKET'S CORRIDOR, HAZARD AND QUOTE – step S1 of docs/plans/secondary-market-builder-2026-09.md,
// spec docs/specs/secondary-market-2026-09.md §2c–§2i. PURE READS: nothing calls `world/resale.ts` yet, so this file is
// the whole net under it until S3 wires it into the tick.
//
// ⚠⚠ THE HOUSE RULE THIS FILE IS WRITTEN UNDER: a price is checked against a formula the TEST re-derives, not against
// the module's own helpers. The arms that compare a price with "the same draw in calm waters" recompute `u` from the
// documented sub-stream key (`${seed}:sale:${itemId}:${week}:price`), so they pin the key contract from the outside
// and they are exact per sample – no statistics, no tolerance: at a crisis trough the plane's price is BELOW the calm
// price of the SAME draw and the house's ABOVE it, every time.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: any statement about how OFTEN a listing sells. The numbers in
// `ECONOMY.shop.secondary` are starting points and step S6's probe measures them; this file pins the SHAPE (floor never
// zero, thin lots dearer to sell, a hangover that decays) and never a measured rate.
//
// ⚠ MUTATION-VERIFIED (30.09), SIXTEEN ARMS, each applied ALONE to the source, watched, and restored byte-identical
// (the files were hashed before and after). What went red, and how many:
//   * the clamp `Math.min(cap, Math.max(floor, raw))` -> `raw`                 -> ONE: the 500-sample walls arm
//   * the house's `crashShift` 0.2 -> -0.2 (shop.ts)                           -> FOUR: the house sign arm, the walls (the
//     cap is no longer reached), the hangover, and the quote's crash arm
//   * `+ hangoverTerm(...)` -> `+ 0`                                           -> ONE: the hangover arm, alone
//   * the stale drift `- stalePerYear * staleShare` -> `- 0`                   -> TWO: the stale-drift arm and the walls
//   * the freshness floor `row.freshFloor` -> 0 (the miracle buyer gone)       -> THREE: freshness, the floors by class, the quote's wait
//   * the thin exponent -> 0                                                   -> FOUR: the elite car, the stale week, the brand's
//     dampener and the crash multiplier arm (which divides the dampener out)
//   * the thin clamp's low end -> 0                                            -> ONE: the brand's dampener, alone
//   * the memory carry `+ weeksOrZero(freshnessCarry)` dropped                 -> ONE: the memory arm, alone
//   * the academy lot cut to its first stage (`.slice(0, 1)`)                  -> ONE: the academy-lot arm, alone
//   * the week dropped from the price sub-stream key                           -> EIGHT: five same-draw arms, the hangover, the
//     stale drift and the academy lot
//   * a third `rng?` parameter on `crashDepth`                                 -> ONE: the arity arm, alone
//   * `crashArrival` ignored                                                   -> TWO: the crash multiplier arm and the quote's crash arm
//   * the corridor's `crashShift × depth` term -> 0                            -> EIGHT: the walls, all six same-draw sign arms, the quote's crash arm
//   * the fire floor ignoring the crash (`return row.fireX`)                   -> ONE: the quote's crash arm.
//     ⚠ THIS ARM STAYED GREEN AT FIRST. It compared two rounded fractions with a bare `< 0`, and «0 against −1e-10» passes
//     that. It now asserts `fireX × crashShift × depth` to six places – a sign check on a difference that can be rounding
//     noise is not a check.
//   * the restated epoch length 208 -> 104 (the hangover's look-back)          -> ONE: the hangover arm
//   * and the identity pin (tests/principles-t73-economy-identity.test.ts): car `medianWeeks` 4 -> 5 -> the sha pin red, alone.
import { describe, expect, it } from 'vitest'
import { createWorld, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { assetWorthCents, ownedAssets, shopCatalogue, shopItem } from '../src/engine/world/assets'
import { marketCrash, marketCrashLog } from '../src/engine/world/market'
import * as resale from '../src/engine/world/resale'
import {
  QUOTE_HORIZON_WEEKS,
  assetSaleQuote,
  buyerHazard,
  buyerWritesThisWeek,
  crashDepth,
  saleFloorCents,
  saleOfferPriceCents,
  secondaryOf,
  staleAtWeeks,
} from '../src/engine/world/resale'
import type { OwnedAsset } from '../src/shared/protocol'
import { codeOf } from './helpers/source'
import { engineModuleSource } from './worldSource'

type Family = 'car' | 'house' | 'boat' | 'plane' | 'business' | 'academy'
const FAMILIES: readonly Family[] = ['car', 'house', 'boat', 'plane', 'business', 'academy']

/** what a test family owns: one rung each – and for the academy the two delivered stages that make a lot. */
const OWNS: Record<Family, readonly string[]> = {
  car: ['car-sensible'],
  house: ['house-first'],
  boat: ['boat-launch'],
  plane: ['plane-small'],
  business: ['merch-brand'],
  academy: ['academy-land', 'academy-courts'],
}

/** spec §2c's signs, written out here rather than read off the table so a flipped constant cannot flip its own test:
 *  boats and planes dive with the market, the house is the refuge. */
const CRASH_SIGN: Record<Family, 1 | -1> = { car: -1, house: 1, boat: -1, plane: -1, business: -1, academy: -1 }

const rowOf = (family: Family) => ECONOMY.shop.secondary.byFamily[family]

/** A hand-built world that owns exactly `ids`, every row DELIVERED – no listing state exists in S1, so there is none. */
function worldOwning(seed: string, ids: readonly string[]): WorldState {
  const world = createWorld(seed)
  world.assets = []
  for (const id of ids) ownRow(world, id)
  return world
}

function ownRow(world: WorldState, id: string, extra: Partial<OwnedAsset> = {}): OwnedAsset {
  const item = shopItem(id)!
  const row: OwnedAsset = {
    id,
    boughtWeek: 0,
    paidCents: item.entryCents,
    valueCents: item.entryCents,
    entries: [{ week: 0, cents: item.entryCents }],
    ...extra,
  }
  world.assets = [...ownedAssets(world), row]
  return row
}

/** the worth the module reads, recomputed here: `assetWorthCents` per row at `week`, summed (the academy's lot). */
function worthOf(world: WorldState, ids: readonly string[], week = world.week): number {
  let sum = 0
  for (const id of ids) {
    const owned = ownedAssets(world).find((a) => a.id === id)!
    sum += assetWorthCents(world, owned, shopItem(id)!, week - world.week)
  }
  return sum
}

/** the price draw, re-derived from the documented key – the pin on the sub-stream contract. */
const drawU = (seed: string, keyId: string, week: number): number => 2 * rngFromSeed(`${seed}:sale:${keyId}:${week}:price`)() - 1

/** ⚠ CALM = THE CRASH LAYER HAS BEEN OFF ZERO FOR THIRTY WEEKS: no arc open, and no arc closed within the 26-week hangover. */
function isCalm(seed: string, week: number): boolean {
  for (let k = 0; k <= 30; k++) if (marketCrashLog(seed, week - k) !== 0) return false
  return true
}
function calmWeekOf(seed: string, from = 40): number {
  for (let w = from; w < from + 600; w++) if (isCalm(seed, w)) return w
  throw new Error(`no calm week found for ${seed}`)
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/** spec §2d's dampener, re-derived: `(the family's cheapest rung / worth) ** exponent`, clamped to [thinFloor, 1]. A house
 *  APPRECIATES, so its worth outgrows the entry rung and its dampener is a little under 1; a depreciating car's is exactly 1. */
function thinOf(family: Family, worthCents: number): number {
  const entry = Math.min(...shopCatalogue().filter((r) => r.family === family).map((r) => r.entryCents))
  const k = ECONOMY.shop.secondary
  return Math.min(1, Math.max(k.thinFloor, Math.pow(entry / worthCents, k.thinExponent)))
}

describe('the corridor table (spec §2d)', () => {
  it('every rung that can list has a row and an investment has none – the absence is the predicate', () => {
    for (const rung of shopCatalogue()) {
      expect(secondaryOf(rung) === null, `${rung.id} (${rung.family})`).toBe(rung.family === 'investment')
    }
    expect(secondaryOf(shopItem('deposit')!)).toBeNull()
    expect(secondaryOf(shopItem('index-fund')!)).toBeNull()
  })

  it('every row keeps the fire price under the corridor’s calm floor and the cap over its ceiling', () => {
    for (const family of FAMILIES) {
      const r = rowOf(family)
      expect(r.fireX, `${family} fire price sits below base − spread`).toBeLessThan(r.base - r.spread)
      expect(r.base + r.spread, `${family} ceiling sits below the cap`).toBeLessThan(ECONOMY.shop.secondary.capX)
      expect(r.freshFloor, `${family} floor is a miracle buyer, not zero and not the peak`).toBeGreaterThan(0)
      expect(r.freshFloor).toBeLessThan(1)
    }
    expect(WEEKS_PER_YEAR).toBe(52)
  })

  it('the epoch grid: every crisis starts in the first half of a 208-week epoch and ends inside it', () => {
    // ⚠ `resale.ts` restates `market.ts`'s private epoch length for the hangover's look-back; this is what keeps the copy honest.
    for (let i = 0; i < 40; i++) {
      for (let e = 0; e < 12; e++) {
        const c = marketCrash(`grid-${i}`, e)
        expect(c.startWeek).toBeGreaterThanOrEqual(e * 208)
        expect(c.startWeek).toBeLessThan(e * 208 + 104)
        expect(c.endWeek).toBeLessThan((e + 1) * 208)
      }
    }
  })

  it('the crash adapter is the fund’s own path as a share of value lost: 0 in calm waters, 0.15–0.30 at any trough', () => {
    for (let i = 0; i < 40; i++) {
      const seed = `depth-${i}`
      const arc = marketCrash(seed, 1)
      const atTrough = crashDepth(seed, arc.troughWeek)
      expect(atTrough).toBeCloseTo(1 - Math.exp(arc.depthLog), 12)
      expect(atTrough).toBeGreaterThanOrEqual(0.15 - 1e-9)
      expect(atTrough).toBeLessThanOrEqual(0.3 + 1e-9)
      expect(crashDepth(seed, calmWeekOf(seed))).toBe(0)
      for (const w of [10, 100, 250, 300, 500]) expect(crashDepth(seed, w)).toBeCloseTo(1 - Math.exp(marketCrashLog(seed, w)), 12)
    }
  })
})

describe('the price corridor (spec §2c)', () => {
  it('500 sampled prices per family stay between the fire price and worth × capX – and the walls are really reached', () => {
    let atFloor = 0
    let atCap = 0
    for (const family of FAMILIES) {
      const ids = OWNS[family]
      const anchor = ids[0]!
      const world = worldOwning('walls', ids)
      let samples = 0
      for (let i = 0; i < 100; i++) {
        const seed = `walls-${i}`
        world.seed = seed
        const trough = marketCrash(seed, 1).troughWeek
        for (let d = -2; d <= 2; d++) {
          const week = trough + d
          world.week = week
          // half the samples are fresh ads, half have hung anywhere up to 89 weeks – so the stale drift runs a whole year
          const listed = i % 2 === 0 ? 0 : (i * 7 + d * 13 + 200) % 90
          const price = saleOfferPriceCents(world, anchor, week, listed)
          const floor = saleFloorCents(world, anchor, week)
          const cap = Math.round(worthOf(world, ids) * ECONOMY.shop.secondary.capX)
          expect(price, `${family} seed ${i} week ${week}`).toBeGreaterThanOrEqual(floor)
          expect(price, `${family} seed ${i} week ${week}`).toBeLessThanOrEqual(cap)
          if (price === floor) atFloor++
          if (price === cap) atCap++
          samples++
        }
      }
      expect(samples).toBe(500)
    }
    // a clamp that no sample ever touches would be a clamp this test cannot see: cars at the floor in a stale year,
    // houses at the cap in a refuge trough.
    expect(atFloor).toBeGreaterThan(0)
    expect(atCap).toBeGreaterThan(0)
  })

  it.each(FAMILIES)('%s: at a crisis trough the SAME draw prices on the side of calm waters that its crashShift says', (family) => {
    const ids = OWNS[family]
    const anchor = ids[0]!
    const world = worldOwning('signs', ids)
    const row = rowOf(family)
    const troughRatios: number[] = []
    const calmRatios: number[] = []
    for (let i = 0; i < 60; i++) {
      const seed = `signs-${i}`
      world.seed = seed
      const trough = marketCrash(seed, 1).troughWeek
      world.week = trough
      const worth = worthOf(world, ids)
      const price = saleOfferPriceCents(world, anchor, trough, 0)
      const calmPriceOfSameDraw = Math.round(worth * (row.base + row.spread * drawU(seed, anchor, trough)))
      expect(CRASH_SIGN[family] * (price - calmPriceOfSameDraw), `${family} seed ${i}`).toBeGreaterThan(0)
      troughRatios.push(price / worth)

      const calm = calmWeekOf(seed)
      world.week = calm
      calmRatios.push(saleOfferPriceCents(world, anchor, calm, 0) / worthOf(world, ids))
    }
    // …and in the mean, which is the spec's own wording: a plane sits BELOW its quiet mean and a house ABOVE.
    expect(CRASH_SIGN[family] * (mean(troughRatios) - mean(calmRatios))).toBeGreaterThan(0)
  })

  it('the hangover: a touch OPPOSITE a class’s crash response for half a season after the arc closes, then nothing', () => {
    const seeds: { seed: string; end: number }[] = []
    for (let i = 0; seeds.length < 60 && i < 4000; i++) {
      const seed = `hang-${i}`
      const c1 = marketCrash(seed, 1)
      // a window whose next crisis is far enough away that +40 weeks stay clean
      if (marketCrash(seed, 2).startWeek > c1.endWeek + 45) seeds.push({ seed, end: c1.endWeek })
    }
    expect(seeds).toHaveLength(60)

    for (const [id, family] of [['house-first', 'house'], ['plane-small', 'plane']] as const) {
      const world = worldOwning('hang', [id])
      const row = rowOf(family)
      for (const { seed, end } of seeds) {
        world.seed = seed
        const gap: number[] = []
        for (let since = 0; since <= 40; since++) {
          const week = end + since
          world.week = week
          const worth = worthOf(world, [id])
          const price = saleOfferPriceCents(world, id, week, 0)
          const quiet = Math.round(worth * (row.base + row.spread * drawU(seed, id, week)))
          if (since < 26) {
            // the house's refuge premium unwinds BELOW base; the plane rebounds ABOVE it
            expect(CRASH_SIGN[family] * (price - quiet), `${id} ${seed} +${since}`).toBeLessThan(0)
            gap.push(Math.abs(price - quiet) / worth)
          } else {
            expect(price, `${id} ${seed} +${since}`).toBe(quiet)
          }
        }
        // decaying: a fortnight after the close the residual is smaller than at the close
        expect(gap[14]!).toBeLessThan(gap[0]!)
        expect(gap[25]!).toBeLessThan(gap[14]!)
      }
    }
  })

  it('the stale drift: the same draw fetches less the longer the ad has hung – stalePerYear over a year, and no further', () => {
    for (const [id, family] of [['house-first', 'house'], ['merch-brand', 'business']] as const) {
      const seed = 'stale-1'
      const world = worldOwning(seed, [id])
      const week = calmWeekOf(seed)
      world.week = week
      const row = rowOf(family)
      const worth = worthOf(world, [id])
      const u = drawU(seed, id, week)
      let previous = Infinity
      for (const t of [0, 13, 26, 39, 52, 78, 104, 400]) {
        const price = saleOfferPriceCents(world, id, week, t)
        expect(price, `${id} listed ${t} weeks`).toBe(Math.round(worth * (row.base + row.spread * u - row.stalePerYear * Math.min(t / 52, 1))))
        expect(price).toBeLessThanOrEqual(previous)
        previous = price
      }
      expect(saleOfferPriceCents(world, id, week, 0)).toBeGreaterThan(saleOfferPriceCents(world, id, week, 52))
      expect(saleOfferPriceCents(world, id, week, 52)).toBe(saleOfferPriceCents(world, id, week, 400)) // the drift stops at a year
    }
  })

  it('a lot that does not exist prices at 0 and quotes null – never NaN, never negative', () => {
    const world = worldOwning('nothing', ['car-sensible'])
    world.week = calmWeekOf('nothing')
    expect(saleOfferPriceCents(world, 'deposit', world.week, 0)).toBe(0)
    expect(saleOfferPriceCents(world, 'house-first', world.week, 0)).toBe(0) // not owned
    expect(saleOfferPriceCents(world, 'no-such-rung', world.week, 0)).toBe(0)
    expect(assetSaleQuote(world, 'deposit')).toBeNull()
    expect(assetSaleQuote(world, 'index-fund')).toBeNull()
    expect(assetSaleQuote(world, 'house-first')).toBeNull()
    expect(buyerWritesThisWeek(world, 'house-first', world.week, 0, 0)).toBe(false)
    expect(buyerHazard(world, 'deposit', world.week, 0, 0)).toBe(0)
    // a contract still in delivery is not for sale (S2 refuses to list it; the quote has nothing to say)
    ownRow(world, 'plane-small', { readyWeek: world.week + 9 })
    expect(assetSaleQuote(world, 'plane-small')).toBeNull()
    expect(saleOfferPriceCents(world, 'plane-small', world.week, 0)).toBe(0)
    // and the wire is not trusted: NaN / negative / infinite weeks fall back to «none»
    const fresh = saleOfferPriceCents(world, 'car-sensible', world.week, 0)
    expect(fresh).toBeGreaterThan(0)
    expect(saleOfferPriceCents(world, 'car-sensible', world.week, Number.NaN)).toBe(fresh)
    expect(saleOfferPriceCents(world, 'car-sensible', world.week, -7)).toBe(fresh)
    expect(saleOfferPriceCents(world, 'car-sensible', Number.NaN, 0)).toBe(0)
    expect(buyerHazard(world, 'car-sensible', world.week, Number.NaN, Number.NaN)).toBe(buyerHazard(world, 'car-sensible', world.week, 0, 0))
  })
})

describe('the buyer hazard (spec §2d)', () => {
  const seed = 'fresh-1'
  const world = worldOwning(seed, ['car-sensible', 'house-first', 'boat-launch', 'car-unreasonable', 'yacht-big'])
  const week = calmWeekOf(seed)
  world.week = week
  const h = (id: string, age: number, carry = 0): number => buyerHazard(world, id, week, age, carry)

  it('freshness decays from the class peak to a NON-ZERO floor: at 4× the median it is the floor, not zero', () => {
    const row = rowOf('car')
    const peak = 1 - Math.exp(-Math.LN2 / row.medianWeeks) // ln 2 / median, as a weekly probability
    const m = row.medianWeeks
    expect(h('car-sensible', 0)).toBeCloseTo(peak, 12) // the entry rung, calm waters: no dampener, no crash multiplier
    expect(h('car-sensible', 0)).toBeGreaterThan(h('car-sensible', 2 * m))
    expect(h('car-sensible', 4 * m)).toBeGreaterThan(0)
    expect(h('car-sensible', 4 * m)).toBeCloseTo(peak * row.freshFloor, 12)
    expect(h('car-sensible', 40 * m)).toBe(h('car-sensible', 4 * m)) // it holds at the floor for ever
    for (let t = 0; t < 120; t++) expect(h('car-sensible', t + 1)).toBeLessThanOrEqual(h('car-sensible', t))
  })

  it('the floor differs by class: a hung boat keeps at most a quarter of a house’s residual demand', () => {
    const share = (id: string, family: Family): number => h(id, 40 * rowOf(family).medianWeeks) / h(id, 0)
    expect(share('house-first', 'house')).toBeCloseTo(rowOf('house').freshFloor, 12)
    expect(share('boat-launch', 'boat')).toBeCloseTo(rowOf('boat').freshFloor, 12)
    expect(share('boat-launch', 'boat')).toBeLessThan(share('house-first', 'house') / 4)
  })

  it('the stale week is the first whole week at the floor, and it is deterministic and price-dependent', () => {
    for (const [id, family] of [['car-sensible', 'car'], ['house-first', 'house']] as const) {
      const item = shopItem(id)!
      const worth = worthOf(world, [id], week)
      const stale = staleAtWeeks(item, worth)!
      // the span is `decayMedians` medians stretched by the dampener – recomputed here, not read off the module
      expect(stale).toBe(Math.ceil((ECONOMY.shop.secondary.decayMedians * rowOf(family).medianWeeks) / thinOf(family, worth)))
      expect(h(id, stale)).toBe(h(id, stale + 30)) // at the floor
      expect(h(id, stale - 1)).toBeGreaterThan(h(id, stale)) // and not a week before
    }
    // a thin lot stays fresh longer: the same market in slow motion
    const sensible = staleAtWeeks(shopItem('car-sensible')!, worthOf(world, ['car-sensible'], week))!
    const elite = staleAtWeeks(shopItem('car-unreasonable')!, worthOf(world, ['car-unreasonable'], week))!
    expect(elite).toBeGreaterThan(sensible)
    expect(staleAtWeeks(shopItem('deposit')!, 1_000_00)).toBeNull()
  })

  it('a thin market: the elite car’s hazard is below the sensible car’s at equal freshness, by the continuous factor', () => {
    const entry = Math.min(...shopCatalogue().filter((r) => r.family === 'car').map((r) => r.entryCents))
    const worthElite = worthOf(world, ['car-unreasonable'], week)
    const factor = Math.pow(entry / worthElite, ECONOMY.shop.secondary.thinExponent)
    expect(factor).toBeLessThan(1)
    expect(factor).toBeGreaterThan(ECONOMY.shop.secondary.thinFloor)
    expect(h('car-unreasonable', 0)).toBeLessThan(h('car-sensible', 0))
    expect(h('car-unreasonable', 0) / h('car-sensible', 0)).toBeCloseTo(factor, 10)
    // the quote's «may not sell at all» flag is the same dampener at or below `thinQuoteAt` – a yacht, not a Fiat
    expect(assetSaleQuote(world, 'yacht-big')!.thinMarket).toBe(true)
    expect(assetSaleQuote(world, 'car-sensible')!.thinMarket).toBe(false)
  })

  it('the dampener has a floor of its own: a very dear brand is a thin market and never a third of nothing', () => {
    const rich = worldOwning('thin-brand', [])
    ownRow(rich, 'merch-brand', { paidCents: 2_500_000_000, valueCents: 2_500_000_000 }) // $25M against a $250k entry
    const w = calmWeekOf('thin-brand')
    rich.week = w
    const peak = 1 - Math.exp(-Math.LN2 / rowOf('business').medianWeeks)
    expect(buyerHazard(rich, 'merch-brand', w, 0, 0) / peak).toBeCloseTo(ECONOMY.shop.secondary.thinFloor, 12)
  })

  it('the market remembers: a carry of 8 weeks resumes the decay – and it is a plain parameter, no state is read', () => {
    expect(h('house-first', 0, 8)).toBeLessThan(h('house-first', 0, 0))
    expect(h('house-first', 0, 8)).toBe(h('house-first', 8, 0)) // exposure already served, and nothing else
    expect(h('house-first', 4, 4)).toBe(h('house-first', 0, 8))
    // no field on the owned row can change the answer – S3's `listedWeek` / `lastListing` are not read here
    const row = ownedAssets(world).find((a) => a.id === 'house-first') as unknown as Record<string, unknown>
    const before = h('house-first', 3, 2)
    row.listedWeek = week - 5
    row.lastListing = { endedWeek: week - 3, exposedWeeks: 40 }
    expect(h('house-first', 3, 2)).toBe(before)
    delete row.listedWeek
    delete row.lastListing
  })

  it('a crisis moves the chance per class while the arc is open: yacht buyers vanish, house buyers multiply', () => {
    const seedX = 'arrival-1'
    const inside = marketCrash(seedX, 1).troughWeek
    const calm = calmWeekOf(seedX)
    const owner = worldOwning(seedX, ['boat-launch', 'house-first'])
    for (const [id, family] of [['boat-launch', 'boat'], ['house-first', 'house']] as const) {
      owner.week = inside
      const during = buyerHazard(owner, id, inside, 0, 0)
      owner.week = calm
      const quiet = buyerHazard(owner, id, calm, 0, 0)
      // the multiplier is the class's crashArrival – with the dampener divided out, because a house appreciates
      // between the two weeks and its worth (so its dampener) is not the same number at both
      const thinRatio = thinOf(family, worthOf(owner, [id], inside)) / thinOf(family, worthOf(owner, [id], calm))
      expect(during / quiet, id).toBeCloseTo(rowOf(family).crashArrival * thinRatio, 9)
    }
  })
})

describe('the quote (spec §2g)', () => {
  it('is the corridor’s envelope, the fire price, the stale week and the wait – one primitive', () => {
    const seed = 'quote-1'
    const ids = ['car-sensible', 'house-first', 'boat-launch', 'plane-small', 'merch-brand']
    const world = worldOwning(seed, ids)
    const week = calmWeekOf(seed)
    world.week = week

    const los: number[] = []
    for (const [id, family] of [['car-sensible', 'car'], ['house-first', 'house'], ['boat-launch', 'boat'], ['plane-small', 'plane'], ['merch-brand', 'business']] as const) {
      const q = assetSaleQuote(world, id)!
      const row = rowOf(family)
      const worth = worthOf(world, [id])
      expect(q.corridorLoCents, id).toBe(Math.round(worth * (row.base - row.spread)))
      expect(q.corridorHiCents, id).toBe(Math.round(worth * (row.base + row.spread)))
      expect(q.fireCents, id).toBe(Math.round(worth * row.fireX))
      expect(q.fireCents).toBe(saleFloorCents(world, id, week)) // the fire price IS the corridor's floor
      expect(q.fireCents).toBeLessThan(q.corridorLoCents)
      expect(q.staleWeeks).toBe(staleAtWeeks(shopItem(id)!, worth))
      expect(q.thinMarket).toBe(false)

      // the wait is the p10/p90 of the hazard's own CDF – recomputed here through `buyerHazard`, so there is one path
      let survive = 1
      let lo = 0
      let hi = 0
      for (let k = 1; k <= QUOTE_HORIZON_WEEKS && hi === 0; k++) {
        survive *= 1 - buyerHazard(world, id, week, k - 1, 0)
        if (lo === 0 && 1 - survive >= 0.1) lo = k
        if (1 - survive >= 0.9) hi = k
      }
      expect(q.weeksLo, id).toBe(lo || QUOTE_HORIZON_WEEKS)
      expect(q.weeksHi, id).toBe(hi || QUOTE_HORIZON_WEEKS)
      expect(q.weeksLo).toBeLessThanOrEqual(q.weeksHi)
      los.push(q.weeksLo)
    }
    // liquid before illiquid: the first letter comes sooner for a car than for a house than for a boat…
    expect(los).toEqual([...los].sort((a, b) => a - b))
    // …and a hung yacht's p90 is beyond the horizon – «may not sell at all» – while a car's is not
    expect(assetSaleQuote(world, 'plane-small')!.weeksHi).toBe(QUOTE_HORIZON_WEEKS)
    expect(assetSaleQuote(world, 'boat-launch')!.weeksHi).toBe(QUOTE_HORIZON_WEEKS)
    expect(assetSaleQuote(world, 'car-sensible')!.weeksHi).toBeLessThan(QUOTE_HORIZON_WEEKS)
  })

  it('reads today’s crash and no further: in a crisis a plane’s fire price and corridor both fall, a house’s rise', () => {
    const seed = 'quote-crash'
    const world = worldOwning(seed, ['plane-small', 'house-first'])
    const trough = marketCrash(seed, 1).troughWeek
    const calm = calmWeekOf(seed)
    world.week = calm
    const planeCalm = assetSaleQuote(world, 'plane-small')!
    const houseCalm = assetSaleQuote(world, 'house-first')!
    world.week = trough
    const planeCrash = assetSaleQuote(world, 'plane-small')!
    const houseCrash = assetSaleQuote(world, 'house-first')!
    // …as a share of worth, exactly: the corridor moves by crashShift × depth and the fire price – the corridor's own
    // floor – by fireX × crashShift × depth (a bare sign check would pass on rounding noise, which is how a mutation that
    // froze the floor once stayed green here)
    const depth = crashDepth(seed, trough)
    expect(depth).toBeGreaterThan(0.14)
    const share = (cents: number, id: string, at: number): number => cents / worthOf(world, [id], at)
    for (const [id, family, crash, quiet] of [['plane-small', 'plane', planeCrash, planeCalm], ['house-first', 'house', houseCrash, houseCalm]] as const) {
      const row = rowOf(family)
      expect(share(crash.fireCents, id, trough) - share(quiet.fireCents, id, calm), `${id} fire price`).toBeCloseTo(row.fireX * row.crashShift * depth, 6)
      expect(share(crash.corridorLoCents, id, trough) - share(quiet.corridorLoCents, id, calm), `${id} corridor`).toBeCloseTo(row.crashShift * depth, 6)
    }
    // crashArrival at the trough: the wait a plane quotes is longer while buyers are away
    expect(planeCrash.weeksLo).toBeGreaterThan(planeCalm.weeksLo)
  })

  it('the academy sells as ONE LOT: the sum of the delivered stages through the corridor, any stage naming it', () => {
    const seed = 'lot-1'
    const world = worldOwning(seed, ['academy-land', 'academy-courts'])
    const building = ownRow(world, 'academy-building', { readyWeek: 9_999 }) // still being built: nobody buys a construction site
    const week = calmWeekOf(seed)
    world.week = week
    const row = rowOf('academy')
    const lotWorth = worthOf(world, ['academy-land', 'academy-courts'])
    const landAlone = worthOf(world, ['academy-land'])
    expect(lotWorth).toBeGreaterThan(landAlone)

    const q = assetSaleQuote(world, 'academy-land')!
    expect(q.corridorLoCents).toBe(Math.round(lotWorth * (row.base - row.spread)))
    expect(q.corridorHiCents).toBe(Math.round(lotWorth * (row.base + row.spread)))
    expect(q.fireCents).toBe(Math.round(lotWorth * row.fireX))
    // every stage names the lot – even the one still in delivery – and the lot has ONE draw a week
    expect(assetSaleQuote(world, 'academy-courts')).toEqual(q)
    expect(assetSaleQuote(world, 'academy-building')).toEqual(q)
    const price = saleOfferPriceCents(world, 'academy-land', week, 0)
    expect(saleOfferPriceCents(world, 'academy-courts', week, 0)).toBe(price)
    expect(saleOfferPriceCents(world, 'academy-building', week, 0)).toBe(price)
    expect(price).toBe(Math.round(lotWorth * (row.base + row.spread * drawU(seed, 'academy-land', week))))
    expect(buyerHazard(world, 'academy-staff', week, 0, 0)).toBe(buyerHazard(world, 'academy-land', week, 0, 0))

    // once the building lands the lot grows by exactly that stage
    delete building.readyWeek
    const grown = assetSaleQuote(world, 'academy-land')!
    expect(grown.corridorHiCents).toBe(Math.round(worthOf(world, ['academy-land', 'academy-courts', 'academy-building']) * (row.base + row.spread)))
    expect(grown.corridorHiCents).toBeGreaterThan(q.corridorHiCents)

    // and a family with no delivered stage has no lot at all
    expect(assetSaleQuote(worldOwning('lot-none', ['car-sensible']), 'academy-land')).toBeNull()
  })
})

describe('reproducibility, arity and the MAIN stream (invariant 2)', () => {
  it('same seed + item + week gives the same price and the same knock verdict, every time', () => {
    const a = worldOwning('det-1', ['car-sensible'])
    const b = worldOwning('det-1', ['car-sensible'])
    const prices = new Set<number>()
    let knocks = 0
    for (let w = 100; w < 300; w++) {
      a.week = w
      b.week = w
      const p = saleOfferPriceCents(a, 'car-sensible', w, 3)
      expect(saleOfferPriceCents(a, 'car-sensible', w, 3)).toBe(p)
      expect(saleOfferPriceCents(b, 'car-sensible', w, 3)).toBe(p)
      const k = buyerWritesThisWeek(a, 'car-sensible', w, 3, 0)
      expect(buyerWritesThisWeek(a, 'car-sensible', w, 3, 0)).toBe(k)
      expect(buyerWritesThisWeek(b, 'car-sensible', w, 3, 0)).toBe(k)
      prices.add(p)
      if (k) knocks++
    }
    // …and it is a real draw, not a constant: prices vary across weeks and buyers write some weeks and not others
    expect(prices.size).toBeGreaterThan(100)
    expect(knocks).toBeGreaterThan(0)
    expect(knocks).toBeLessThan(200)
    // a different seed is a different market
    const c = worldOwning('det-2', ['car-sensible'])
    c.week = 150
    a.week = 150
    expect(saleOfferPriceCents(c, 'car-sensible', 150, 3)).not.toBe(saleOfferPriceCents(a, 'car-sensible', 150, 3))
  })

  it('the price stream and the knock stream are two streams: the verdict is the knock key’s own draw', () => {
    const world = worldOwning('det-3', ['car-sensible'])
    for (let w = 100; w < 160; w++) {
      world.week = w
      const chance = buyerHazard(world, 'car-sensible', w, 0, 0)
      const own = rngFromSeed(`${world.seed}:sale:car-sensible:${w}:knock`)() < chance
      expect(buyerWritesThisWeek(world, 'car-sensible', w, 0, 0)).toBe(own)
    }
  })

  it('reading writes nothing: the MAIN stream, the row list and the wallet stand exactly as they were', () => {
    const world = worldOwning('pure-1', ['car-sensible', 'house-first', 'academy-land', 'academy-courts'])
    world.week = 180
    const snapshot = (): string => JSON.stringify({ rng: world.rngMain, assets: world.assets, week: world.week, funds: world.fundsCents })
    const before = snapshot()
    for (const id of ['car-sensible', 'house-first', 'academy-land']) {
      for (let w = 170; w < 190; w++) {
        saleOfferPriceCents(world, id, w, 12)
        buyerHazard(world, id, w, 12, 3)
        buyerWritesThisWeek(world, id, w, 12, 3)
        saleFloorCents(world, id, w)
      }
      assetSaleQuote(world, id)
    }
    expect(snapshot()).toBe(before)
  })

  it('no export of resale.ts takes an Rng, touches the MAIN stream or reads a clock – the module text, comments out', () => {
    const code = codeOf(engineModuleSource('world/resale'))
    expect(code.length).toBeGreaterThan(2_000)
    expect(code).not.toMatch(/\bRng\b/)
    expect(code).not.toMatch(/resumeMain|rngMain|mulberry32|initMainState/)
    expect(code).not.toMatch(/Math\.random|new Date|Date\.now/)
    const fromRng = /import\s*\{([^}]*)\}\s*from\s*'\.\.\/rng'/.exec(code)
    expect(fromRng?.[1]?.trim()).toBe('rngFromSeed') // the only thing it takes from the rng module: sub-streams

    // the export inventory and every function's arity are pinned, so a new export – or a new parameter – is a decision
    expect(Object.keys(resale).sort()).toEqual([
      'QUOTE_HORIZON_WEEKS',
      'assetSaleQuote',
      'buyerHazard',
      'buyerWritesThisWeek',
      'crashDepth',
      'saleFloorCents',
      'saleOfferPriceCents',
      'secondaryOf',
      'staleAtWeeks',
    ])
    expect(resale.secondaryOf.length).toBe(1)
    expect(resale.crashDepth.length).toBe(2)
    expect(resale.saleFloorCents.length).toBe(3)
    expect(resale.saleOfferPriceCents.length).toBe(4)
    expect(resale.buyerHazard.length).toBe(5)
    expect(resale.buyerWritesThisWeek.length).toBe(5)
    expect(resale.staleAtWeeks.length).toBe(2)
    expect(resale.assetSaleQuote.length).toBe(2)
  })
})
