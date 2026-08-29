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
  sellableAsset,
  shopCatalogue,
  shopItem,
  activeLadderOf,
  shopView,
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

/** ⚠ THE PROFESSIONAL MARK, SET THE WAY THE ENGINE SETS IT. `activeLadderOf`'s professional arm
 *  reads the never-pruned mark `wtaEverCounted` off `bestFinishByTier`, so writing that mark is the
 *  same one-way door a real counting W-series result walks through.
 *  ⚠ IT NO LONGER OPENS THE SHELF – part two #6 deleted that gate – and it is KEPT because the
 *  fixtures below are about a career that is on the pro table for every other reason (prize money,
 *  the masseur, the ladder). Its post-condition used to be `shopUnlocked(world) === true`; that
 *  predicate is gone, and the assertion is now the mark itself. */
function turnProfessional(world: WorldState): void {
  world.bestFinishByTier.wta250 = 3
  expect(activeLadderOf(world), 'the fixture really is professional now').toBe('wta')
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
  // ⚠⚠ RE-AIMED AT ROUND 29 #5, NEVER DELETED, AND THE CLAIM IS THE SAME CLAIM. This pin exists so
  // that a rung cannot arrive on the shelf without a line in a test saying it did; the owner asked
  // for three storeys – «В магазине всё ещё не хватает яхт, самолётов и стойки академии» – so ten
  // rows arrive and every one of them is named here. What is STILL absent is what is still absent:
  // no bonds and no club stake (§3a's upper rungs), and neither of the two items that were about HER
  // (§3d became a birthday gift, §3e was struck). The negative below moved with the positive, which
  // is the honest form of a re-aim: it can no longer refuse the words this slice legitimately adds.
  it('⭐ carries §3a-c, §3f and §3g – and still nothing else', () => {
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
      'boat-launch',
      'boat-motor',
      'yacht',
      'yacht-big',
      'plane',
      'plane-long',
      'academy-land',
      'academy-courts',
      'academy-building',
      'academy-staff',
    ])
    // §3a's two minimums and §3b's four prices are the spec's own numbers, quoted here so a retune
    // has to come through this file.
    expect(shopItem('deposit')!.entryCents).toBe(1_000_00)
    expect(shopItem('index-fund')!.entryCents).toBe(5_000_00)
    expect(rows.filter((r) => r.family === 'car').map((r) => r.entryCents)).toEqual([
      60_000_00, 110_000_00, 190_000_00, 300_000_00,
    ])
    // ⚠ AND THE SLICES THAT ARE STILL NOT MINE ARE STILL NOT HERE. No bonds and no club stake (§3a's
    // upper rungs) – and neither of the two items that were about HER, which left the shelf entirely
    // (§3d became a birthday gift, §3e was struck). ⚠ `court` and `flat` are the two of hers and
    // they stay in the pattern; `academy-courts` is the ACADEMY's, so the pattern is anchored on the
    // word standing alone rather than on a substring, which is what «no court for her» means.
    expect(rows.some((r) => /bond|club|flat/i.test(r.id))).toBe(false)
    expect(rows.some((r) => r.id === 'court' || r.id === 'home-court')).toBe(false)
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
    // ⚠ RE-AIMED BY ROUND 29 PART TWO #3, NOT DELETED: the deposit's literal was 1.02 and is 1.0317,
    // because his ruling moved the current account's own rate onto Savings («не вижу проблем сделать
    // ставку 3.17% на Savings»). The literal is written out here rather than read off the catalogue
    // on purpose – a pin that computed `1 + annualRateBps / 10_000` would be comparing the engine
    // with itself and would have followed the constant anywhere it went.
    expect(assetValueCents(shopItem('deposit')!, 10_000_00, WEEKS_PER_YEAR)).toBe(Math.round(10_000_00 * 1.0317))
    expect(assetValueCents(shopItem('index-fund')!, 10_000_00, WEEKS_PER_YEAR)).toBe(Math.round(10_000_00 * 1.07))
    // ⚠⚠ AND IT IS REALLY THE RATE THE CURRENT ACCOUNT USED TO PAY, which is the whole of item 3 –
    // asserted against the ENGINE's constant and not as an arithmetic identity. `ECONOMY.savings`
    // was `apyWeekly: 0.0006` before round 29 #12 deleted it, and `(1 + 0.0006)^52 − 1 = 3.17%/yr`.
    // ⚠ A line reading `expect(Math.round((1.0006 ** 52 - 1) * 10_000)).toBe(317)` would have been a
    // constant compared with itself: green forever, and green through the rate being moved back.
    expect(shopItem('deposit')!.annualRateBps, "the deposit pays the deleted account's own rate").toBe(
      Math.round((1.0006 ** 52 - 1) * 10_000),
    )
  })

  it('⚠ is a WHOLE NUMBER OF CENTS – the fraction never leaves this function', () => {
    for (const item of shopCatalogue()) {
      for (const weeks of [1, 7, 33, 104, 511]) {
        expect(Number.isInteger(assetValueCents(item, 1_234_57, weeks))).toBe(true)
      }
    }
  })
})

// ⚠⚠ RE-AIMED BY ROUND 29 PART TWO #6, NOT DELETED – AND THE INVERSION IS THE POINT. This block used
// to be «the gate – §2, the professional era and never the junior years»: three arms asserting that a
// junior career could not buy, that the professional mark opened the shelf one-way, and that selling
// was never gated either way. His ruling of 29.08 – «магазин открыт всегда с начала игры» – overturns
// the first two, so they now assert the OPPOSITE with the same fixtures. The third is untouched: it
// was never about the gate. ⭐ These are the arms that would have caught a gate quietly surviving.
describe('the shelf is open from week one – part two #6, his ruling', () => {
  it('⭐ a junior family can BUY, on the very fixture that used to be refused', () => {
    const world = career('shop-gate-junior', 30)
    expect(activeLadderOf(world), 'the fixture really is a junior career').not.toBe('wta')
    world.fundsCents = 500_000_00
    expect(() => buyAsset(world, 'car-sensible'), 'no professional-era refusal is left').not.toThrow()
    expect(world.assets.map((a) => a.id)).toEqual(['car-sensible'])
    // ...and the screen sees the same shelf: every rung, no shut arm to print.
    expect(toSnapshot(world).shop.rows).toHaveLength(shopCatalogue().length)
  })

  it('⭐⭐ ...and so can a fourteen-year-old family in its very first week', () => {
    // ⚠ THE HORIZON ASK 12b WAS ABOUT. Round 29 #12 removed the current account's interest and
    // measured the loss at its cleanest on the junior sink; the deposit that replaces it now exists
    // there. Week 0, no ticks, no results – the earliest the game can be asked the question.
    const world = createWorld('shop-open-week-zero')
    expect(world.week).toBe(0)
    world.fundsCents = 50_000_00
    expect(() => buyAsset(world, 'deposit', 10_000_00)).not.toThrow()
    expect(world.assets[0].paidCents).toBe(10_000_00)
  })

  it('⭐⭐ ...and NOTHING IN THE CATALOGUE BREAKS AT FOURTEEN – the half of #6 that could be a defect', () => {
    // ⚠⚠ A RUNG THE PRICE KEEPS OUT OF REACH IS LEGIBLE; A RUNG THAT BREAKS AT THAT AGE IS NOT. So
    // this walks the WHOLE shelf on a week-0 world and asserts that every row is a sane, finite,
    // whole-number offer and that every rule that used to sit behind the gate still answers.
    const world = createWorld('shop-open-catalogue-14')
    const view = shopView(world)
    expect(view.rows).toHaveLength(shopCatalogue().length)
    for (const row of view.rows) {
      expect(Number.isInteger(row.entryCents) && row.entryCents > 0, `${row.id} price`).toBe(true)
      expect(Number.isInteger(row.annualRatePct), `${row.id} rate`).toBe(true)
      expect(Number.isInteger(row.upkeepCents) && row.upkeepCents >= 0, `${row.id} upkeep`).toBe(true)
      expect(row.valueCents, `${row.id} is not owned on day one`).toBeNull()
      expect(row.label.length, `${row.id} has a name`).toBeGreaterThan(0)
      expect(row.blurb.length, `${row.id} says what it is`).toBeGreaterThan(0)
    }
    // ⚠ THE TWO RULES THAT USED TO SIT BEHIND THE GATE STILL ANSWER, which is what «does not break»
    // has to mean: the academy is still ordered, and the price is still the thing that gates.
    const courts = view.rows.find((r) => r.requiresId !== null)!
    expect(courts.requirementMet, 'a stage whose predecessor is unbuilt is not orderable').toBe(false)
    world.fundsCents = 100_000_000_00
    expect(() => buyAsset(world, courts.id), 'and the engine says which stage comes first').toThrow(
      /has to come first/,
    )
    // ...while the cheapest rung is reachable on a fourteen-year-old's family funds, which is the
    // whole of what ask 12b was about.
    const funds = createWorld('shop-open-catalogue-14').fundsCents
    expect(shopItem('deposit')!.entryCents, 'the deposit clears a starting wallet').toBeLessThanOrEqual(funds)
  })

  it('⚠ SELLING IS NOT GATED, and that is deliberate', () => {
    // A family that owned something must always be able to get out of it. §4's freeze, when it
    // lands, is the ONE thing allowed to stop a sale (`sellableAsset`) – and since part two #6 it is
    // the only door in the file, which is what the two arms above now assert from the other side.
    const world = career('shop-sell-ungated', 20)
    turnProfessional(world)
    world.fundsCents = 200_000_00
    buyAsset(world, 'car-sensible')
    world.bestFinishByTier = {}
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
      // ⚠ RE-AIMED AT ROUND 29 #5, NOT WEAKENED – `sellableAsset` is now false while a commissioned
      // thing is still being built (§3f: «the contract cannot be sold»), so an unconditional sale
      // threw and the arm stopped at the first boat. Asking the predicate keeps every rung in the
      // sweep and makes it STRICTER than it was: the contracts stay on the books, `deliverAssets`
      // fires on the week each one lands, and the weekly upkeep runs from there – so this now
      // proves input-independence over the delivery and the bill as well as over buy/sell.
      for (const owned of [...ownedAssets(w)]) if (sellableAsset(w, owned)) sellAsset(w, owned.id)
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

  it('a career that never turned professional gets the WHOLE shelf – part two #6', () => {
    // ⚠ RE-AIMED, NOT DELETED. This arm read «gets the shelf shut and no rows to press» and asserted
    // `unlocked: false` beside the locked sentence. Both fields are gone with the gate; what it was
    // really guarding – that `shopView` is TOTAL and hands the screen every rung whatever the career
    // has done – is the half that survives his ruling, and it is now the whole claim.
    const view = shopView(career('shop-view-junior', 40))
    expect(view.rows).toHaveLength(shopCatalogue().length)
    expect(view.cheapestId, 'and it introduces itself with a real thing at a real price').toBe('deposit')
  })
})
