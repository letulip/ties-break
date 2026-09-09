// ⭐⭐ ROUND 39 #5 (REOPENED) – THE SELL-AND-REBUY LOOP, CLOSED OVER TIME AND NOT ONLY AT THE TRADE.
//
// THE OWNER, 08.09: «Я завел бренд у Инэс, он за несколько недель стал стоить 22 млн, я его продал.
// Потом купил новый за 250к, а он снова за несколько недель уже 30+ стоит. Кажется надо ещё что-то с
// этой механикой подумать» – and, approving the A+C proposal: «давай попробуем».
//
// ⚠ WHY ROUND 38'S FIX MISSED, precisely (the reopened ledger's own diagnosis): #16's «merch-brand
// $0» was measured AT `weeksHeld = 0`, where `rampedWorthCents` returns the paid price BY
// CONSTRUCTION. True and meaningless – the loop was shut on the day of the trade and never tested
// over time, and his cycle is sell at the ramped worth, re-buy at the flat $250,000, wait out the
// ramp again. Two prongs close it now, and this file holds both:
//
//   A. A REPEAT founding is priced at the market's CURRENT derived worth (`assetEntryPriceCents`,
//      fed by `world.brandFounded` – v71, the three-part schema move). The FIRST founding of a
//      career still costs the flat catalogue $250,000: his round-38 law «неизменно для первого
//      открытия стоит 250к» is untouchable and §1 pins it.
//   C. `ECONOMY.shop.worthRamp.minHalfLifeWeeks` 13 → 52. His round-38 law stands – «полураспад 2
//      года при средней славе, кратно быстрее при высокой» – because 104/52 = 2x at the cap is
//      still «кратно», where the old floor allowed 8x (a 13.3-week half-life at the cap:
//      $250,000 → $1,844,174 in ONE week, his own «за несколько недель» measured).
//
// ⚠ MEASURED (tools/r39-brand-loop.ts, synthetic cap-fame state – his saves are read-only and never
// fixtures): re-buy curve at the cap w1/5/13/26/52 before $1.84M/$8.2M/$17.7M/$26.6M/$33.5M-shaped,
// after ~$723k at week 1 and half-value at a year; full cycle yield before ≈ derived − $250k, after
// ≈ $0 (the unconverged sliver of the ramp, ≤0). The ledger line carries the run.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  assetEntryPriceCents,
  assetWorthCents,
  brandGrossWorthCents,
  brandSignalsOf,
  buyAsset,
  closeTournament,
  createWorld,
  fameAt,
  ownedAssets,
  revalueAssets,
  SAVE_SCHEMA_VERSION,
  sellAsset,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { worthRampHalfLife } from '../src/engine/world/assets'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'

const MERCH = 'merch-brand'
const PRICE = 250_000_00
const R = ECONOMY.shop.worthRamp

// The round30-brand-value fixture idiom, verbatim in shape: a professional world, ticked a few
// weeks, kept rich enough that no arm here is about the wallet.
const FUNDS = 500_000_000_00

function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
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
  world.fundsCents = FUNDS
  return world
}

function winTitles(world: WorldState, tier: TierId, weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.titles.push(...weeks)
}

const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)
const rowOf = (w: WorldState, id: string) => shopView(w).rows.find((r) => r.id === id)!

describe('round 39 #5 §1 – the first founding is his round-38 law, untouched', () => {
  it('⚠⚠ a FIRST brand on a famous career still costs exactly the catalogue $250,000', () => {
    const w = shopper('r39-5-first')
    winTitles(w, 'slam', [2, 4, 6])
    expect(w.brandFounded, 'no founding on record yet').toBeUndefined()
    // the sticker before the purchase...
    expect(rowOf(w, MERCH).entryCents, 'the card says the catalogue price').toBe(PRICE)
    const before = w.fundsCents
    buyAsset(w, MERCH)
    // ...is the price the door took, and the row opens at what was paid (the ramp's own law).
    expect(before - w.fundsCents, 'the till took the catalogue price').toBe(PRICE)
    expect(ownedOf(w, MERCH)!.paidCents).toBe(PRICE)
    expect(ownedOf(w, MERCH)!.valueCents).toBe(PRICE)
    // ...and the founding is now on the career, which is the whole of the v71 field.
    expect(w.brandFounded).toBe(true)
  })

  it('every other rung answers the catalogue price whatever the career remembers', () => {
    const w = shopper('r39-5-others')
    winTitles(w, 'slam', [2, 4])
    w.brandFounded = true
    for (const id of ['car-good', 'house-first', 'academy-land']) {
      const item = shopItem(id)!
      expect(assetEntryPriceCents(w, item), `${id} is not a repeat founding`).toBe(item.entryCents)
    }
  })
})

describe('round 39 #5 §2 – a REPEAT founding is priced at the market, and the sticker says so', () => {
  it('⭐⭐⭐ sell at the worth, re-buy at the worth: the cycle no longer prints money', () => {
    const w = shopper('r39-5-cycle')
    winTitles(w, 'slam', [2, 4, 6])
    buyAsset(w, MERCH)
    // A brand held long enough to converge – his own was 235 weeks in; eight half-lives leave 0.4%
    // of the gap. Aging the row backwards is the fixture idiom for «held for years» without walking
    // eight seasons of world; `revalueAssets` then stores what the engine itself says it is worth.
    ownedOf(w, MERCH)!.boughtWeek -= 8 * R.minHalfLifeWeeks
    revalueAssets(w)
    const proceeds = ownedOf(w, MERCH)!.valueCents
    const before = w.fundsCents
    sellAsset(w, MERCH)
    expect(w.fundsCents - before, 'the sale pays the row figure').toBe(proceeds)
    // ⚠ the founding survives the sale – the row is gone, the fact is not.
    expect(ownedOf(w, MERCH)).toBeUndefined()
    expect(w.brandFounded).toBe(true)
    // The re-buy: the sticker quotes the derived worth, the door charges the same figure, and the
    // cycle yield collapses from (derived − $250k) to the unconverged sliver of the ramp.
    const derived = brandGrossWorthCents(brandSignalsOf(w), shopItem(MERCH)!.earningsMultipleX!)
    expect(derived, 'the fixture is famous enough for the market to out-price the garage').toBeGreaterThan(PRICE * 10)
    const sticker = rowOf(w, MERCH).entryCents
    expect(sticker, 'the shelf ticket tells the truth').toBe(Math.max(PRICE, derived))
    const cash = w.fundsCents
    buyAsset(w, MERCH)
    const charged = cash - w.fundsCents
    expect(charged, 'the door charges the sticker, to the cent').toBe(sticker)
    // ⭐ the row bought at the market is worth the market – no instant gap in either direction.
    expect(ownedOf(w, MERCH)!.valueCents).toBe(charged)
    const yieldCents = proceeds - charged
    const oldYieldCents = proceeds - PRICE
    expect(yieldCents, 'the cycle hands the family nothing').toBeLessThanOrEqual(0)
    // ...and the sliver it costs is the ramp's own remainder, bounded by 0.5^8 of the gap – against
    // an old yield of essentially the whole derived worth.
    expect(Math.abs(yieldCents)).toBeLessThan((derived - PRICE) * 0.01)
    expect(oldYieldCents).toBeGreaterThan(derived * 0.9)
  })

  it('⚠ a repeat founding on a career the world forgot floors at the catalogue price', () => {
    const w = shopper('r39-5-quiet')
    expect(fameAt(w), 'the fixture really has no fame').toBe(0)
    w.brandFounded = true
    expect(assetEntryPriceCents(w, shopItem(MERCH)!), 'never cheaper the second time').toBe(PRICE)
    expect(rowOf(w, MERCH).entryCents).toBe(PRICE)
  })

  it('⚠ affordable is read against the repeat price, not the catalogue', () => {
    const w = shopper('r39-5-afford')
    winTitles(w, 'slam', [2, 4, 6])
    w.brandFounded = true
    const sticker = rowOf(w, MERCH).entryCents
    expect(sticker).toBeGreaterThan(PRICE)
    w.fundsCents = sticker - 1
    expect(rowOf(w, MERCH).affordable, 'one cent short of the true price').toBe(false)
    w.fundsCents = sticker
    expect(rowOf(w, MERCH).affordable).toBe(true)
  })
})

describe('round 39 #5 §3 – the 52-week floor: «кратно быстрее», not «за несколько недель»', () => {
  it('⭐⭐ at the fame cap the half-life is the floor, and the floor is a year', () => {
    // Under the 13-week floor cap fame ran the half-life to ~13.3 weeks – $250,000 → $1,844,174 in
    // one week on his save. 104/52 = 2x at the cap is still his «кратно быстрее»; 8x was the leak.
    expect(R.minHalfLifeWeeks).toBe(52)
    expect(worthRampHalfLife(ECONOMY.fame.cap, R.medianFame)).toBe(52)
    // the floor binds from exactly double the median driver...
    expect(worthRampHalfLife(R.medianFame * 2, R.medianFame)).toBe(52)
    // ...and his two-year median law is byte-identical where it always held.
    expect(worthRampHalfLife(R.medianFame, R.medianFame)).toBe(R.halfLifeWeeks)
  })

  it('one week at the cap closes ~1.3% of the gap – the $723k week, not the $1.84M one', () => {
    const w = shopper('r39-5-week1')
    winTitles(w, 'slam', [2, 4, 6])
    winTitles(w, 'wta1000', [3, 5, 7, 9, 11])
    buyAsset(w, MERCH)
    const item = shopItem(MERCH)!
    const worth1 = assetWorthCents({ ...w, week: w.week + 1 } as WorldState, ownedOf(w, MERCH)!, item)
    const derived = brandGrossWorthCents(brandSignalsOf(w, w.week + 1), item.earningsMultipleX!)
    // the share of the gap one week may close is 1 − 0.5^(1/half-life); at the floor that is 1.32%,
    // where the old floor's 13.3 weeks closed 5.1% – the week-one multiple his report started from.
    const closed = (worth1 - PRICE) / (derived - PRICE)
    expect(closed).toBeGreaterThan(0)
    expect(closed).toBeLessThan(0.014)
    expect(worth1, 'a week-old brand is nowhere near its derived worth').toBeLessThan(derived * 0.05 + PRICE)
  })
})

describe('round 39 #5 §4 – the schema move, all three parts live', () => {
  const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
  const v70 = () => JSON.parse(readFileSync(`${DIR}/v70.json`, 'utf8'))

  it('⭐ a v70 save that OWNS a brand migrates with the founding on record', () => {
    const migrated = migrateSave(v70())
    // ⚠ THE HEAD OF THE LADDER, NOT THIS ITEM'S OWN RUNG – a v70 save walks every step there is, so
    // this number moves with `SAVE_SCHEMA_VERSION` and is read from it rather than re-typed. The
    // claim underneath is unchanged: the walk carries the brand founding through to the head.
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect((migrated.assets ?? []).some((a) => a.id === MERCH), 'the corpus fixture owns one').toBe(true)
    expect(migrated.brandFounded, 'owning one proves founding one').toBe(true)
  })

  it('⚠ a v70 save that owns none keeps the benefit of the doubt – first-founding price', () => {
    const save = v70()
    save.assets = (save.assets as { id: string }[]).filter((a) => a.id !== MERCH)
    const migrated = migrateSave(save)
    expect(migrated.brandFounded, 'no record, no repeat').toBeUndefined()
    expect(assetEntryPriceCents(migrated, shopItem(MERCH)!)).toBe(PRICE)
  })
})
