// ⭐⭐ THE SHOP, SLICE 1 – the tab, static prices, buy / own / sell.
// docs/specs/the-shop-2026-08.md §2, §3a-c, §5 and §11 row 1.
//
// ⚠ WHAT THIS FILE IS FOR, in the order the acceptance is written (§11 row 1 / §2e):
//   1. a bench career buys the good car, sells it two seasons later, and THE LEDGER SHOWS THE LOSS
//      TO THE CENT – the loss is the feature (§3b: «this family exists to LOSE money»);
//   2. `careerTotals` grows by NOTHING and nothing else moves;
//   3. THE FROZEN MAIN CAPTURE IS UNMOVED – asserted here as input-independence (CLAUDE.md §2's
//      permanent law) rather than only as a hash somewhere else;
//   4. a v62 save loads with `assets: []` and plays identically;
//   5. §2e-5's own number lives in `tools/shop-probe.ts`, because it is a claim about the whole
//      economy over hundreds of careers rather than about one world.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  buyAsset,
  sellAsset,
  assetValueCents,
  ownedAssets,
  revalueAssets,
  shopCatalogue,
  shopItem,
  shopUnlocked,
  shopView,
  SHOP_LOCKED_DETAIL,
  SAVE_SCHEMA_VERSION,
  skipTournament,
  closeTournament,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { financeWindow } from '../src/engine/world/ledger'
import { fnv1aHex } from './helpers/hash'

/** ⚠ THE DOOR IS OPENED THE WAY THE ENGINE OPENS IT. `activeLadderOf`'s professional arm reads the
 *  never-pruned mark `wtaEverCounted` off `bestFinishByTier`, so writing that mark is the same
 *  one-way door a real counting W-series result walks through – not a flag poked on the side of the
 *  gate. Every test below that needs a shoppable career says so by calling this. */
function turnProfessional(world: WorldState): void {
  world.bestFinishByTier.wta250 = 3
  expect(shopUnlocked(world), 'the fixture really is professional now').toBe(true)
}

function career(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('the shelf itself', () => {
  it('⭐ carries §3a-c and nothing else – two investments, four cars, two house tiers', () => {
    const rows = shopCatalogue()
    expect(rows.map((r) => r.id)).toEqual([
      'deposit',
      'index-fund',
      'car-sensible',
      'car-good',
      'car-nineteen',
      'car-unreasonable',
      'house-first',
      'house-garden',
    ])
    // §3a's two minimums and §3b's four prices are the spec's own numbers, quoted here so a retune
    // has to come through this file.
    expect(shopItem('deposit')!.entryCents).toBe(1_000_00)
    expect(shopItem('index-fund')!.entryCents).toBe(5_000_00)
    expect(rows.filter((r) => r.family === 'car').map((r) => r.entryCents)).toEqual([
      60_000_00, 110_000_00, 190_000_00, 300_000_00,
    ])
    // ⚠ AND THE SLICES THAT ARE NOT MINE ARE NOT HERE. No bonds, no club stake (§3a's upper rungs),
    // no elite ladder (§3f), no academy (§3g) – and neither of the two items that were about HER,
    // which left the shelf entirely (§3d became a birthday gift, §3e was struck).
    expect(rows.some((r) => /bond|club|yacht|plane|academy|court|flat/i.test(r.id))).toBe(false)
  })

  it('⭐⭐ §3b – THE CARS LOSE MONEY, and that is the point of having them', () => {
    const cars = shopCatalogue().filter((r) => r.family === 'car')
    expect(cars.map((c) => c.annualRateBps)).toEqual([-600, -900, -1200, -1500])
    // ⚠ THE DEARER THE FASTER, which is §3b's shape rather than a coincidence: «the ladder makes the
    // dressing thinner the higher you climb».
    for (let i = 1; i < cars.length; i++) {
      expect(cars[i].entryCents).toBeGreaterThan(cars[i - 1].entryCents)
      expect(cars[i].annualRateBps).toBeLessThan(cars[i - 1].annualRateBps)
    }
    // ⚠⚠ AND THE SHELF IS NOT A SAVINGS ACCOUNT WITH PICTURES (§3b's own words): something on it
    // really goes down. A shelf where every rate was positive would pass every other test in this
    // file and fail the feature.
    expect(shopCatalogue().some((r) => r.annualRateBps < 0)).toBe(true)
  })

  it('the four families behave differently – a shop whose only axis is price is a list', () => {
    const rates = new Set(shopCatalogue().map((r) => r.annualRateBps))
    expect(rates.size).toBeGreaterThanOrEqual(5)
    // §3a's own axis is liquidity against return: the two investments name a MINIMUM, everything
    // else names a price.
    expect(shopCatalogue().filter((r) => r.stake === 'open').map((r) => r.id)).toEqual(['deposit', 'index-fund'])
  })
})

describe('what a thing is worth', () => {
  it('⭐ is arithmetic on the weeks held, and exact at the season boundaries the spec speaks in', () => {
    const car = shopItem('car-good')!
    expect(assetValueCents(car, 110_000_00, 0)).toBe(110_000_00)
    expect(assetValueCents(car, 110_000_00, WEEKS_PER_YEAR)).toBe(Math.round(110_000_00 * 0.91))
    expect(assetValueCents(car, 110_000_00, 2 * WEEKS_PER_YEAR)).toBe(Math.round(110_000_00 * 0.91 * 0.91))
    // ⚠ CONTINUOUS, NOT A CLIFF: half a season is half the exponent, not nothing and not the whole
    // step. A step would create a week to sell before, which is the play §4's freeze exists to stop.
    const half = assetValueCents(car, 110_000_00, WEEKS_PER_YEAR / 2)
    expect(half).toBeLessThan(110_000_00)
    expect(half).toBeGreaterThan(assetValueCents(car, 110_000_00, WEEKS_PER_YEAR))
  })

  it('...and the investments go the other way, at §3a’s rates', () => {
    expect(assetValueCents(shopItem('deposit')!, 10_000_00, WEEKS_PER_YEAR)).toBe(Math.round(10_000_00 * 1.02))
    expect(assetValueCents(shopItem('index-fund')!, 10_000_00, WEEKS_PER_YEAR)).toBe(Math.round(10_000_00 * 1.07))
  })

  it('⚠ is a WHOLE NUMBER OF CENTS – the fraction never leaves this function', () => {
    for (const item of shopCatalogue()) {
      for (const weeks of [1, 7, 33, 104, 511]) {
        expect(Number.isInteger(assetValueCents(item, 1_234_57, weeks))).toBe(true)
      }
    }
  })
})

describe('the gate – §2, the professional era and never the junior years', () => {
  it('⭐ refuses in the junior years, with the same sentence the screen prints', () => {
    const world = career('shop-gate-junior', 30)
    expect(shopUnlocked(world)).toBe(false)
    world.fundsCents = 500_000_00
    expect(() => buyAsset(world, 'car-sensible')).toThrow(SHOP_LOCKED_DETAIL)
    // R10-16: one sentence, so the disabled control and the refused click cannot disagree.
    expect(toSnapshot(world).shop.lockedDetail).toBe(SHOP_LOCKED_DETAIL)
    expect(toSnapshot(world).shop.unlocked).toBe(false)
  })

  it('...and opens on the professional mark, which is a ONE-WAY door', () => {
    const world = career('shop-gate-pro', 30)
    turnProfessional(world)
    // The mark is never pruned, so an empty 52-week window cannot shut the shelf again – the same
    // property `masseurUnlocked` is built on.
    world.results = []
    expect(shopUnlocked(world)).toBe(true)
  })

  it('⚠ SELLING IS NOT GATED, and that is deliberate', () => {
    // A family that owned something before the door could ever close must always be able to get out
    // of it. The gate is on entering the shop, not on leaving it – and §4's freeze, when it lands,
    // is the ONE thing allowed to stop a sale (`sellableAsset`).
    const world = career('shop-sell-ungated', 20)
    turnProfessional(world)
    world.fundsCents = 200_000_00
    buyAsset(world, 'car-sensible')
    world.bestFinishByTier = {}
    expect(shopUnlocked(world), 'the shelf is shut again on this fixture').toBe(false)
    expect(() => sellAsset(world, 'car-sensible')).not.toThrow()
  })
})

describe('buying and selling', () => {
  function shoppableCareer(seed: string): WorldState {
    const world = career(seed, 20)
    turnProfessional(world)
    world.fundsCents = 500_000_00
    return world
  }

  it('⭐ moves the money through the same till every other cost uses (§5, one wallet)', () => {
    const world = shoppableCareer('shop-buy-till')
    const before = world.fundsCents
    buyAsset(world, 'car-good')
    expect(world.fundsCents).toBe(before - 110_000_00)
    const row = world.events[world.events.length - 1]
    expect(row.type).toBe('expense')
    expect(row.category).toBe('shop')
    expect(row.amountCents).toBe(-110_000_00)
    // ...and it is on the finance ledger, which is what makes it visible on the Money breakdown.
    expect(financeWindow(world.financeWeeks, 0).byCategory.shop).toBe(-110_000_00)
    // No second currency: the asset is stored, the wallet is the wallet.
    expect(ownedAssets(world)).toEqual([
      { id: 'car-good', boughtWeek: world.week, paidCents: 110_000_00, valueCents: 110_000_00 },
    ])
  })

  it('refuses a second copy, an unknown rung, a stake under the minimum, and an empty wallet', () => {
    const world = shoppableCareer('shop-buy-refusals')
    buyAsset(world, 'car-good')
    expect(() => buyAsset(world, 'car-good')).toThrow('already owns')
    expect(() => buyAsset(world, 'no-such-thing')).toThrow('nothing like that')
    expect(() => buyAsset(world, 'index-fund', 4_999_99)).toThrow('starts at')
    world.fundsCents = 10_00
    expect(() => buyAsset(world, 'car-sensible')).toThrow('Not enough funds')
  })

  it('⭐ §3a – an OPEN rung takes the amount the family names, and a FIXED one takes the price', () => {
    const world = shoppableCareer('shop-open-stake')
    buyAsset(world, 'deposit', 40_000_00)
    expect(ownedAssets(world)[0].paidCents).toBe(40_000_00)
    // ⚠ A FIXED RUNG IGNORES A STAKE RATHER THAN REFUSING IT: the price of a car is the
    // catalogue's, and a screen able to send its own number would be a screen able to name it.
    buyAsset(world, 'car-sensible', 1_00)
    expect(ownedAssets(world).find((a) => a.id === 'car-sensible')!.paidCents).toBe(60_000_00)
  })

  it('⚠ `valueCents` is STORED and the TICK is its one writer (§5)', () => {
    const world = shoppableCareer('shop-stored-value')
    buyAsset(world, 'car-good')
    expect(ownedAssets(world)[0].valueCents).toBe(110_000_00)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < WEEKS_PER_YEAR; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(ownedAssets(world)[0].valueCents).toBe(Math.round(110_000_00 * 0.91))
    // ...and it is idempotent, which is what makes a single named writer safe to call anywhere.
    const twice = ownedAssets(world)[0].valueCents
    revalueAssets(world)
    expect(ownedAssets(world)[0].valueCents).toBe(twice)
  })

  it('selling returns the STORED value and books it as income under the same category', () => {
    const world = shoppableCareer('shop-sell-till')
    buyAsset(world, 'car-good')
    world.assets[0].valueCents = 91_091_00
    const before = world.fundsCents
    sellAsset(world, 'car-good')
    expect(world.fundsCents).toBe(before + 91_091_00)
    expect(ownedAssets(world)).toEqual([])
    const row = world.events[world.events.length - 1]
    expect(row.type).toBe('income')
    expect(row.category).toBe('shop')
    expect(row.amountCents).toBe(91_091_00)
    // ⭐ THE SENTENCE NAMES THE LOSS, to the cent, so a player is shown a loss rather than two prices.
    expect(row.text).toContain('$18,909 less than it cost')
    expect(() => sellAsset(world, 'car-good')).toThrow('does not own')
  })

  it('⭐⭐ §2e-1 – bought, held two seasons, sold: THE LEDGER SHOWS THE LOSS TO THE CENT', () => {
    const world = shoppableCareer('shop-acceptance-1')
    buyAsset(world, 'car-good')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 2 * WEEKS_PER_YEAR; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    const worth = ownedAssets(world)[0].valueCents
    expect(worth, 'two full seasons of 9%').toBe(Math.round(110_000_00 * 0.91 * 0.91))
    expect(worth).toBe(91_091_00)
    sellAsset(world, 'car-good')

    const loss = 110_000_00 - 91_091_00
    expect(loss).toBe(18_909_00)

    // ⚠⚠ AND HERE IS THE THING THE ACCEPTANCE DOES NOT SAY, FOUND BY WRITING IT: AT TWO SEASONS THE
    // PURCHASE HAS LEFT THE LEDGER. `financeWeeks` keeps a SIXTY-WEEK window (`FINANCE_WEEKS`) and
    // `pruneEvents` caps the feed at 400 rows – and two seasons is 104 weeks. So a player who buys a
    // car and sells it two seasons later cannot see the two prices side by side ANYWHERE: by the week
    // of the sale, the week of the purchase is gone from both the breakdown and the transactions tab.
    // A test that asserted "the ledger holds both rows" would only pass because it held them for less
    // than sixty weeks, which is not what §2e-1 describes.
    expect(world.events.some((e) => e.category === 'shop' && (e.amountCents ?? 0) < 0), 'the purchase row is pruned by then').toBe(false)
    expect(financeWindow(world.financeWeeks, 0).byCategory.shop, 'and so is its ledger week').toBe(91_091_00)

    // ⭐⭐ SO THE SALE ROW HAS TO CARRY THE LOSS IN ITS OWN WORDS, AND THAT IS WHY IT DOES. This is
    // acceptance §2e-1 read literally – «the ledger shows the loss to the cent» – and it is the one
    // reading that survives the sixty-week window, because the sentence travels with the row rather
    // than with the arithmetic between two rows. `sellAsset` takes the figure off `paidCents`, which
    // is stored on the asset and never re-written for exactly this.
    const sale = world.events.filter((e) => e.category === 'shop').at(-1)!
    expect(sale.amountCents).toBe(91_091_00)
    expect(sale.text).toBe('Sold: The good saloon – $18,909 less than it cost')

    // ...and inside the window the netting works too, which is what the breakdown shows a player who
    // sells sooner: one line whose size IS the loss.
    const quick = shoppableCareer('shop-acceptance-1-quick')
    const quickFundsBefore = quick.fundsCents
    buyAsset(quick, 'car-good')
    quick.assets[0].valueCents = 91_091_00
    sellAsset(quick, 'car-good')
    expect(financeWindow(quick.financeWeeks, 0).byCategory.shop, 'bought and sold inside one window').toBe(-loss)

    // ⚠ AND THE WALLET AGREES ON THE QUICK CAREER, where nothing else has had time to happen: the
    // money that left and came back differs by exactly the loss and by nothing else.
    expect(quick.fundsCents).toBe(quickFundsBefore - loss)
  })

  it('⚠ an id retired from the catalogue is still sellable and stops being re-priced', () => {
    // A save can outlive a catalogue edit, and §5's whole promise is that adding or removing a rung
    // is not a migration. What the family owns must survive it.
    const world = shoppableCareer('shop-retired-rung')
    buyAsset(world, 'car-good')
    world.assets[0].id = 'a-rung-that-was-retired'
    const held = world.assets[0].valueCents
    world.week += WEEKS_PER_YEAR
    revalueAssets(world)
    expect(ownedAssets(world)[0].valueCents, 'no rate to apply, so it keeps its last value').toBe(held)
    expect(() => sellAsset(world, 'a-rung-that-was-retired')).not.toThrow()
  })
})

describe('§2e-2 – careerTotals grows by nothing, and nothing else moves', () => {
  it('⭐ has exactly the four fields it had at v39/v40', () => {
    const world = createWorld('shop-totals-shape')
    expect(Object.keys(world.careerTotals).sort()).toEqual([
      'earnedCents',
      'prizeCents',
      'spentCents',
      'weeksLostToInjury',
    ])
  })

  it('⚠ AND A PURCHASE READS AS SPEND ON IT, WHICH IS STATED RATHER THAN HIDDEN', () => {
    // `accrueFinance` is the choke point every money movement passes, so a car adds its price to
    // `spentCents` and a sale adds its proceeds to `earnedCents`. That is the honest CASH-FLOW
    // reading – the money really did leave the wallet that week – but it means the album's «went out
    // before anybody knew the answer» line and the fork card's total now include a car. No field is
    // added to net it out: slice 1's budget is «at most two» and it spends zero, because nothing in
    // this slice reads such a field and a counter with no reader is the thing v62's own note warns
    // about. Recorded here so the next slice inherits the decision instead of rediscovering it.
    const world = career('shop-totals-flow', 20)
    turnProfessional(world)
    world.fundsCents = 500_000_00
    const before = { ...world.careerTotals }
    buyAsset(world, 'car-good')
    expect(world.careerTotals.spentCents).toBe(before.spentCents + 110_000_00)
    expect(world.careerTotals.prizeCents, 'a car is not prize money').toBe(before.prizeCents)
    world.assets[0].valueCents = 91_091_00
    sellAsset(world, 'car-good')
    expect(world.careerTotals.earnedCents).toBe(before.earnedCents + 91_091_00)
  })
})

describe('§2e-3 – the frozen MAIN capture cannot see any of this', () => {
  /** The A/B `planner.test.ts` P1 uses, aimed at the shop: the SAME career, ticked the same number
   *  of weeks, with and without a shelf full of purchases. */
  function record(mutate?: (w: WorldState) => void): { draws: number[]; world: WorldState } {
    const world = createWorld('bench-working-0')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 52; i++) {
      if (mutate) mutate(world)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    return { draws, world }
  }

  it('⭐⭐ buying and selling EVERY WEEK taps an identical MAIN sequence (CLAUDE.md §2, input-independence)', () => {
    const base = record()
    const { draws, world } = record((w) => {
      // The door, then the money, then the whole shelf – bought and sold again every single week.
      w.bestFinishByTier.wta250 = 3
      w.fundsCents = 99_999_999_00
      for (const item of shopCatalogue()) {
        try {
          buyAsset(w, item.id, item.entryCents * 3)
        } catch {
          /* already owned this week */
        }
      }
      for (const owned of [...ownedAssets(w)]) sellAsset(w, owned.id)
    })
    expect(draws.length, 'the same number of MAIN draws').toBe(base.draws.length)
    expect(fnv1aHex(draws.join(',')), 'and the same sequence').toBe(fnv1aHex(base.draws.join(',')))
    // ...and the branch was really exercised, or this proves nothing.
    expect(world.events.filter((e) => e.category === 'shop').length).toBeGreaterThan(50)
  })

  it('⚠ and the shelf module draws nothing at all – the signature is the guarantee', async () => {
    // `world/shop.ts` takes no `Rng` and imports none. Asserted on the source, because "it does not
    // draw" is a claim about what is NOT there and a behavioural test can only sample it.
    const { engineModuleSource } = await import('./worldSource')
    // ⚠ COMMENTS STRIPPED FIRST, or this pin fails on its own explanation: the module's header names
    // the sub-stream slice 2 will use (`seed:asset:<id>:<week>`) precisely so the next builder knows
    // where it goes. `condition-boundary.test.ts`'s component sweep strips comments for the same
    // reason – a rule about what the CODE does may not be enforced against what the prose says.
    const src = engineModuleSource('world/shop')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n')
    expect(src).not.toMatch(/rngFromSeed|Math\.random|['"][^'"]*\/rng['"]/)
    // Anti-vacuity: the stripper must not have eaten the file.
    expect(src).toContain('export function buyAsset')
  })
})

describe('§2e-4 – a v62 save loads with an empty shelf and plays identically', () => {
  it('⭐ the migration seeds `assets: []` and invents nothing', () => {
    const migrated = migrateSave({ schemaVersion: 62, seed: 's', week: 3, profile: {} }) as unknown as WorldState
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.assets).toEqual([])
  })

  it('is idempotent, and a non-array value is rewritten whole (v30’s rule)', () => {
    const once = migrateSave({ schemaVersion: 62, seed: 's', week: 3, profile: {} }) as unknown as WorldState
    const twice = migrateSave(JSON.parse(JSON.stringify(once))) as unknown as WorldState
    expect(twice.assets).toEqual([])
    const junk = migrateSave({ schemaVersion: 62, seed: 's', week: 3, profile: {}, assets: 'nonsense' }) as unknown as WorldState
    expect(junk.assets).toEqual([])
  })

  it('⚠ ...and an existing career’s own rows are NOT touched by a re-run', () => {
    const kept = migrateSave({
      schemaVersion: 63,
      seed: 's',
      week: 3,
      profile: {},
      assets: [{ id: 'car-good', boughtWeek: 1, paidCents: 1, valueCents: 1 }],
    }) as unknown as WorldState
    expect(kept.assets).toHaveLength(1)
  })
})

describe('the shelf as the screen reads it', () => {
  it('⭐ §2 – an empty shelf names the cheapest thing and its price, never a locked row', () => {
    const world = career('shop-view-empty', 20)
    turnProfessional(world)
    const view = toSnapshot(world).shop
    expect(view.unlocked).toBe(true)
    expect(view.ownedCount).toBe(0)
    expect(view.cheapestId, 'the deposit, at $1,000').toBe('deposit')
    expect(view.rows.find((r) => r.id === 'deposit')!.entryCents).toBe(1_000_00)
    // ⚠ EVERY ROW IS ON THE SHELF WHETHER SHE CAN REACH IT OR NOT. A shop window is a thing you
    // look into before you can afford it (§2), so nothing is hidden and nothing is locked – only
    // `affordable` moves, and it moves the CONTROL rather than the row.
    expect(view.rows).toHaveLength(shopCatalogue().length)
    expect(view.rows.some((r) => !r.affordable), 'a $300,000 car is not affordable at this week').toBe(true)
  })

  it('...and stops introducing itself the moment the family owns anything', () => {
    const world = career('shop-view-owned', 20)
    turnProfessional(world)
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-good')
    world.assets[0].valueCents = 91_091_00
    const view = toSnapshot(world).shop
    expect(view.cheapestId).toBeNull()
    expect(view.ownedCount).toBe(1)
    expect(view.ownedValueCents).toBe(91_091_00)
    const row = view.rows.find((r) => r.id === 'car-good')!
    expect(row.paidCents).toBe(110_000_00)
    expect(row.valueCents).toBe(91_091_00)
    // ⭐ THE LOSS IS COMPUTED HERE AND NOT ON SCREEN – §5's whole argument, one subtraction.
    expect(row.changeCents).toBe(-18_909_00)
  })

  it('⚠⚠ every figure that crosses for a person to read is WHOLE (owner, 26.08)', () => {
    const world = career('shop-view-whole', 20)
    turnProfessional(world)
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-good')
    // A value that is genuinely fractional as a ratio: -17.19...% of what was paid.
    world.assets[0].valueCents = 91_091_00
    for (const row of toSnapshot(world).shop.rows) {
      expect(Number.isInteger(row.annualRatePct), `${row.id} rate`).toBe(true)
      expect(row.changePct === null || Number.isInteger(row.changePct), `${row.id} change`).toBe(true)
      expect(row.valueCents === null || Number.isInteger(row.valueCents), `${row.id} value`).toBe(true)
    }
    const car = toSnapshot(world).shop.rows.find((r) => r.id === 'car-good')!
    expect(car.annualRatePct).toBe(-9)
    expect(car.changePct, 'rounded once, at the boundary').toBe(Math.round((-18_909_00 / 110_000_00) * 100))
    expect(car.changePct).toBe(-17)
  })

  it('a career that never turned professional gets the shelf shut and no rows to press', () => {
    const view = shopView(career('shop-view-junior', 40))
    expect(view.unlocked).toBe(false)
    expect(view.lockedDetail).toBe(SHOP_LOCKED_DETAIL)
    // ⚠ THE ROWS EXIST EVEN SO, and the screen is what does not draw them: the view is not the gate,
    // which keeps `shopView` total and keeps one refusal sentence for both sides of the door.
    expect(view.rows).toHaveLength(shopCatalogue().length)
  })
})
