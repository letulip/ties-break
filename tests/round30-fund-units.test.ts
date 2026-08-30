// ⭐⭐⭐ ROUND 30 #14 – THE FUND IS BOUGHT IN UNITS, AND EVERY CLAIM ABOUT IT IS READ OUT OF A TICKED
// WORLD OR OFF THE CATALOGUE ITSELF.
//
// THE OWNER, 30.08: «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это
// то, что я видел… Во-первых она скорее всего будет менее "галопирующая", во-вторых вряд-ли в таких
// крайностях. И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут
// возможность расти на горизонте и будут давать разные точки входа, как в жизни. Стоимость активов
// будет рассчитываться исходя из стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она
// может вполне удвоиться. Или зашёл на пике при цене 7-8к и увидел просадку на следующий год –
// имеешь возможность усредниться или зафиксировать убыток.»
//
// ⚠⚠ THE ONE THING THIS FILE MUST PROVE ABOVE ALL OTHERS, because it is what the whole ruling is
// for: **averaging down and taking a loss are moves the game can express**, not feelings. Two arms
// carry that – «усредниться» and «зафиксировать убыток» – and both drive real commands.
//
// ⚠ MUTATION-VERIFIED. Each applied ALONE to the engine, watched, and reverted:
//   * `buyAsset`'s `unitPriceCents(world.seed, world.week, item)` -> `(…, held?.boughtWeek ?? 0, …)`
//     (every cheque back-dated to the first) -> «different weeks are different prices» and
//     «усредниться» RED, and `round29p3-market.test.ts`'s two top-up arms with them.
//   * `const units = (held?.units ?? 0) + …` -> `= paidCents / price` (the old money forgotten)
//     -> «a second cheque adds to what they hold» RED, ALONE.
//   * `sellAsset`'s `owned.units -= (owned.units * proceedsCents) / owned.valueCents` deleted
//     -> «зафиксировать убыток» RED and `round29p2-part-sale.test.ts`'s «a sold part stays sold»
//     RED. Two files, one defect, which is the division of labour they are supposed to have.
//   * the same line's `if (owned.units !== undefined)` guard deleted -> «a rung the catalogue has
//     forgotten» RED, ALONE, with `units: 0` written onto a car-shaped row and the row then priced
//     at nothing. ⚠ THAT IS WHY THE GUARD IS NOT DEAD: `sellAsset` only refuses an amount on a rung
//     it can still FIND (`item && item.stake !== 'open'`), so a part sale of a row whose id has left
//     the catalogue is reachable and must not grow a `units` key.
//   * `assetWorthCents`'s `owned.units !== undefined` branch forced false -> the value arms RED and
//     the deposit arm with them; forced TRUE -> the car arm RED (`NaN` cents).
//   * `avgUnitPriceCents`'s `owned.paidCents / owned.units` -> `owned.valueCents / owned.units`
//     (today's price wearing the average's name) -> «the average moves only when they BUY» RED,
//     ALONE. That is the mutation the whole screen line exists to be safe from.
//   * `unitBaseCents: 4_000_00` -> `1_000_00` on the fund -> «his anchor» RED, ALONE, and nothing
//     else moved by a cent – which is the arm's own point: the base is a UNIT of account, so every
//     worth in the game is invariant to it.
//   * `volBps` 900 -> 1_800 (the round 29 number back) -> «the volatility came down» RED, ALONE.
import { describe, it, expect } from 'vitest'
import {
  assetWorthCents,
  avgUnitPriceCents,
  buyAsset,
  closeTournament,
  createWorld,
  marketCrash,
  ownedAssets,
  revalueAssets,
  sellAsset,
  shopCatalogue,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  toSnapshot,
  unitPriceCents,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const FUND = shopItem('index-fund')!
const DEPOSIT = shopItem('deposit')!
const CAR = shopItem('car-sensible')!

/** A real career, ticked through the MAIN stream the worker uses. `round29p3-market.test.ts`'s own
 *  helper, because the claims below are about a WORLD and a source grep proves nothing. */
function career(seed: string, weeks: number, act?: (w: WorldState) => void): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    act?.(world)
  }
  return world
}

const heldOf = (world: WorldState, id: string) => ownedAssets(world).find((a) => a.id === id)!

// -------------------------------------------------------------------------------------------------
describe('round 30 #14 – the catalogue says which rungs are held in units', () => {
  it('⭐⭐ EVERY open rung carries `unitBaseCents` and NO fixed one does – both directions', () => {
    const open = shopCatalogue().filter((i) => i.stake === 'open')
    const fixed = shopCatalogue().filter((i) => i.stake === 'fixed')
    // The scan is real: a guard that reads an empty list passes everything.
    expect(open.length).toBeGreaterThan(1)
    expect(fixed.length).toBeGreaterThan(5)
    for (const item of open) {
      expect(item.unitBaseCents, `${item.id} is toppable and divisible, so it is held in units`).toBeGreaterThan(0)
    }
    for (const item of fixed) {
      expect(item.unitBaseCents, `${item.id} has one price and one sale`).toBeUndefined()
    }
  })

  it('⭐⭐ HIS ANCHOR: a unit opens near $4,000 and has about doubled after ten years', () => {
    // «Зашёл, когда доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл на пике
    // при цене 7-8к.» ⚠ A BAND AND NOT A PIN in the first season, because the market is ON at week
    // zero – there is no grace period (his own crash ruling), so «около 4к» is the honest claim.
    let inBand = 0
    let peaked = 0
    for (let s = 0; s < 200; s++) {
      const seed = `r30-anchor-${s}`
      const open = unitPriceCents(seed, 0, FUND)
      if (open > 3_200_00 && open < 4_800_00) inBand++
      // ...and somewhere in the ninth and tenth seasons it passes through the band he named.
      for (let w = 8 * WEEKS_PER_YEAR; w <= 10 * WEEKS_PER_YEAR; w++) {
        const p = unitPriceCents(seed, w, FUND)
        if (p >= 7_000_00 && p <= 8_000_00) {
          peaked++
          break
        }
      }
    }
    expect(inBand / 200, 'a unit really does open around $4,000').toBeGreaterThan(0.7)
    expect(peaked / 200, 'and it really does reach his $7-8k band on the way').toBeGreaterThan(0.7)
    // THE DOUBLING IS THE RATE AND NOT A SECOND CONSTANT: no market at all, ten years of 7%.
    expect((FUND.unitBaseCents! * Math.pow(1.07, 10)) / FUND.unitBaseCents!).toBeGreaterThan(1.9)
  })

  it('⚠ the base is a UNIT OF ACCOUNT: what a holding is WORTH does not depend on it', () => {
    // A rung with a different base is the same rung: the money buys proportionally more units at
    // proportionally lower prices, so `units × price` is invariant. This is what makes $4,000 a
    // choice about legibility rather than a balance knob – and it is why the anchor arm above is
    // the ONLY thing that moves when the constant does.
    const fat = { ...FUND, unitBaseCents: 400_00 }
    const seed = 'r30-unit-of-account'
    const units = 50_000_00 / unitPriceCents(seed, 30, FUND)
    const fatUnits = 50_000_00 / unitPriceCents(seed, 30, fat)
    expect(fatUnits / units).toBeCloseTo(10, 6)
    expect(units * unitPriceCents(seed, 400, FUND)).toBeCloseTo(fatUnits * unitPriceCents(seed, 400, fat), 4)
  })
})

// -------------------------------------------------------------------------------------------------
describe('round 30 #14 – money becomes units at the price of its own week', () => {
  it('⭐⭐ a purchase converts at THIS week`s price, and the holding is `units x price`', () => {
    const world = career('r30-buy', 120, (w) => {
      if (w.week === 40) buyAsset(w, 'index-fund', 60_000_00)
    })
    const held = heldOf(world, 'index-fund')
    expect(held.units!).toBeCloseTo(60_000_00 / unitPriceCents(world.seed, 40, FUND), 8)
    expect(held.valueCents).toBe(Math.round(held.units! * unitPriceCents(world.seed, world.week, FUND)))
    // The one entry point agrees, which is what stops the till and the meter pricing two markets.
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    // ⚠ AND NOTHING WAS REBASED – there is no basis to rebase.
    expect(held.basisWeek, 'no clock but the one it was bought on').toBeUndefined()
    expect(held.boughtWeek).toBe(40)
  })

  it('⭐⭐ DIFFERENT WEEKS ARE DIFFERENT PRICES – «разные точки входа, как в жизни»', () => {
    // Two families, one seed, one market, the same money – and they end up holding different
    // numbers of units because they came in on different weeks. That sentence is the item.
    const early = career('r30-entries', 200, (w) => {
      if (w.week === 20) buyAsset(w, 'index-fund', 50_000_00)
    })
    const late = career('r30-entries', 200, (w) => {
      if (w.week === 120) buyAsset(w, 'index-fund', 50_000_00)
    })
    const a = heldOf(early, 'index-fund')
    const b = heldOf(late, 'index-fund')
    expect(a.paidCents, 'the same money').toBe(b.paidCents)
    expect(a.units).not.toBe(b.units)
    // ...and the one who got more units for it is the one who came in at the lower price.
    const cheaper = unitPriceCents(early.seed, 20, FUND) < unitPriceCents(early.seed, 120, FUND)
    expect(a.units! > b.units!).toBe(cheaper)
  })

  it('⭐ a second cheque ADDS units, it does not replace them', () => {
    const world = career('r30-second-cheque', 150, (w) => {
      if (w.week === 30) buyAsset(w, 'index-fund', 40_000_00)
      if (w.week === 90) buyAsset(w, 'index-fund', 25_000_00)
    })
    const held = heldOf(world, 'index-fund')
    expect(held.paidCents).toBe(65_000_00)
    expect(held.units!).toBeCloseTo(
      40_000_00 / unitPriceCents(world.seed, 30, FUND) + 25_000_00 / unitPriceCents(world.seed, 90, FUND),
      8,
    )
    // ⭐ AND THE AVERAGE IS A REAL WEIGHTED AVERAGE OF THE TWO PRICES, which is the number the
    // screen prints and the number the next decision is made against.
    const p30 = unitPriceCents(world.seed, 30, FUND)
    const p90 = unitPriceCents(world.seed, 90, FUND)
    const avg = avgUnitPriceCents(held)!
    expect(avg).toBeGreaterThanOrEqual(Math.min(p30, p90))
    expect(avg).toBeLessThanOrEqual(Math.max(p30, p90))
    expect(avg).toBeCloseTo(65_000_00 / held.units!, 6)
  })

  it('⚠ a car has no units at all, and is worth what it was worth yesterday', () => {
    const world = career('r30-car', 90, (w) => {
      if (w.week === 10) buyAsset(w, 'car-sensible')
    })
    const car = heldOf(world, 'car-sensible')
    expect(car.units).toBeUndefined()
    expect(car.valueCents).toBe(assetWorthCents(world, car, CAR))
    expect(car.valueCents, 'and it really did depreciate – no arm here is a no-op').toBeLessThan(car.paidCents)
  })

  it('⚠⚠ a DEPOSIT is held in units too, and not one cent of it moved', () => {
    // The equality that let the rebase be deleted outright instead of kept for one rung: with no
    // `volBps` the unit price is `base × (1+r)^years` dead flat, so `units × price` IS the
    // «(basis + top-up) × (1+r)^t» the rebase computed. Asserted against a hand-written statement
    // of the OLD arithmetic, top-up and all, so it cannot be true by construction.
    const world = career('r30-deposit', 160, (w) => {
      if (w.week === 20) buyAsset(w, 'deposit', 100_000_00)
      if (w.week === 100) buyAsset(w, 'deposit', 60_000_00)
    })
    const dep = heldOf(world, 'deposit')
    const pow = (weeks: number) => Math.pow(1 + DEPOSIT.annualRateBps / 10_000, weeks / WEEKS_PER_YEAR)
    // The rebase, reproduced by hand: grown to week 100, plus the new money, then grown to today.
    const atTopUp = 100_000_00 * pow(80) + 60_000_00
    expect(dep.valueCents).toBeCloseTo(Math.round(atTopUp * pow(world.week - 100)), -1)
    // ...and it rode NO crisis, which is the zero-vol guard doing its one job.
    expect(dep.valueCents).toBeGreaterThan(dep.paidCents)
  })
})

// -------------------------------------------------------------------------------------------------
describe('round 30 #14 – ⭐⭐⭐ the two moves he is buying with this change', () => {
  it('⭐⭐⭐ «УСРЕДНИТЬСЯ»: buying below your average really moves the average down', () => {
    // The fixture is a real crisis, named: this seed's epoch-0 crash troughs deep enough that the
    // family is under water on the week it doubles in.
    const SEED = 'r30-average-down'
    const c = marketCrash(SEED, 0)
    let avgBefore = 0
    let priceAtAdd = 0
    const world = career(SEED, c.endWeek + 4, (w) => {
      if (w.week === 4) buyAsset(w, 'index-fund', 60_000_00)
      if (w.week === c.troughWeek) {
        const held = heldOf(w, 'index-fund')
        avgBefore = avgUnitPriceCents(held)!
        priceAtAdd = unitPriceCents(w.seed, w.week, FUND)
        // ⚠ THE PRECONDITION IS THE DECISION: the screen is showing them a price under their own
        // average. Without that this is not averaging down, it is just buying.
        expect(priceAtAdd, 'the fixture really is a drawdown').toBeLessThan(avgBefore)
        expect(held.valueCents, 'and the family is really under water').toBeLessThan(held.paidCents)
        buyAsset(w, 'index-fund', 60_000_00)
      }
    })
    const held = heldOf(world, 'index-fund')
    const avgAfter = avgUnitPriceCents(held)!
    // ⭐ THE MOVE ITSELF: the average came down, and it landed between the two prices.
    expect(avgAfter).toBeLessThan(avgBefore)
    expect(avgAfter).toBeGreaterThan(priceAtAdd)
    // ⭐⭐ AND IT PAID: the same $120,000 put in all at once at the first price would be worth less
    // today. That is «доли дадут возможность расти на горизонте» with a number on it.
    const allAtOnce = Math.round((120_000_00 / unitPriceCents(SEED, 4, FUND)) * unitPriceCents(SEED, world.week, FUND))
    expect(held.valueCents).toBeGreaterThan(allAtOnce)
  })

  it('⭐⭐⭐ «ЗАФИКСИРОВАТЬ УБЫТОК»: selling part at a loss realises it and leaves the average alone', () => {
    const SEED = 'r30-take-the-loss'
    const c = marketCrash(SEED, 0)
    let realised = 0
    let avgBefore = 0
    let avgAfter = 0
    let unitsBefore = 0
    let unitsAfter = 0
    const world = career(SEED, c.troughWeek + 2, (w) => {
      if (w.week === 2) buyAsset(w, 'index-fund', 90_000_00)
      if (w.week === c.troughWeek) {
        const held = heldOf(w, 'index-fund')
        expect(held.valueCents, 'the fixture really is a loss').toBeLessThan(held.paidCents)
        avgBefore = avgUnitPriceCents(held)!
        unitsBefore = held.units!
        const paidBefore = held.paidCents
        const valueBefore = held.valueCents
        const out = Math.round(valueBefore / 3)
        sellAsset(w, 'index-fund', out)
        realised = out - Math.round((paidBefore * out) / valueBefore)
        avgAfter = avgUnitPriceCents(heldOf(w, 'index-fund'))!
        unitsAfter = heldOf(w, 'index-fund').units!
      }
    })
    // ⭐ THE LOSS IS REAL AND IT IS IN THE LEDGER, named to the cent by the sale's own sentence.
    expect(realised).toBeLessThan(0)
    const row = world.events.find((e) => e.category === 'shop' && e.text.startsWith('Sold '))!
    expect(row.text).toContain('less than it cost')
    // ⭐⭐ AND THE AVERAGE DID NOT MOVE, which is what makes the next decision the same decision:
    // a third of the units left and a third of the cash basis went with them.
    //
    // ⚠ «DID NOT MOVE» IS TO WITHIN HALF A CENT AND NOT TO THE BIT, and the reason is named rather
    // than absorbed by a loose tolerance: `costSoldCents` rounds ONCE (`round(paid × proceeds /
    // value)`, `kidPrizeShareCents`' own discipline) while the units are scaled by the exact
    // fraction, so the two sides can differ by up to half a cent of cost spread over the units. On a
    // $3,800 average that is the eighth decimal place. It is discriminating where it matters: the
    // mutation this arm exists for – the average read off `valueCents` instead of `paidCents` –
    // moves it by hundreds of dollars.
    expect(avgAfter).toBeCloseTo(avgBefore, 0)
    expect(unitsAfter).toBeCloseTo(unitsBefore * (2 / 3), 4)
    // ...and two ticks on it is still two thirds of a holding – the sale was not undone.
    const held = heldOf(world, 'index-fund')
    expect(held.units!).toBeCloseTo(unitsAfter, 8)
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
  })

  it('⚠ a rung the catalogue has forgotten can still be part-sold, and grows no units doing it', () => {
    // ⚠⚠ THIS IS WHY `sellAsset`'s `if (owned.units !== undefined)` IS NOT A DEAD GUARD. The stake
    // refusal above it reads `item && item.stake !== 'open'`, so a row whose id has left the
    // catalogue walks past it – and such a row can be a CAR, with no units. Writing `units` onto it
    // would hand it to `assetWorthCents`' unit branch and price a $110,000 car at nothing.
    const world = career('r30-orphan-row', 20)
    world.assets = [{ id: 'a-rung-that-no-longer-exists', boughtWeek: 5, paidCents: 110_000_00, valueCents: 90_000_00 }]
    sellAsset(world, 'a-rung-that-no-longer-exists', 30_000_00)
    const left = world.assets[0]
    expect(left.units, 'no units key was invented').toBeUndefined()
    expect(left.valueCents).toBe(60_000_00)
    expect(left.paidCents).toBe(110_000_00 - Math.round((110_000_00 * 30_000_00) / 90_000_00))
    // ...and a revaluation leaves it exactly there – an unknown rung is not re-priced at all.
    revalueAssets(world)
    expect(world.assets[0].valueCents).toBe(60_000_00)
  })
})

// -------------------------------------------------------------------------------------------------
describe('round 30 #14 – what the screen is given, and the volatility that came down', () => {
  it('⭐⭐ the row carries units held, the average price and today`s price – rounded once', () => {
    const world = career('r30-view', 140, (w) => {
      if (w.week === 30) buyAsset(w, 'index-fund', 45_000_00)
      if (w.week === 100) buyAsset(w, 'index-fund', 25_000_00)
    })
    const view = shopView(world)
    const fund = view.rows.find((r) => r.id === 'index-fund')!
    const held = heldOf(world, 'index-fund')
    expect(fund.unitsHeld).toBe(held.units)
    expect(fund.unitPriceCents).toBe(Math.round(unitPriceCents(world.seed, world.week, FUND)))
    expect(fund.avgUnitPriceCents).toBe(Math.round(avgUnitPriceCents(held)!))
    // ⚠ THE TWO PRICES ARE WHOLE CENTS AT THE BOUNDARY (the owner, 26.08) and the COUNT is not –
    // rounding 1.25 units to 1 would print a quarter of a holding out of existence.
    expect(Number.isInteger(fund.unitPriceCents!)).toBe(true)
    expect(Number.isInteger(fund.avgUnitPriceCents!)).toBe(true)
    expect(Number.isInteger(fund.unitsHeld!), 'a count of shares is fractional, and must be').toBe(false)
    // ⚠ THE PRICE IS ON THE ROW BEFORE THERE IS A HOLDING – «зашёл на пике при цене 7-8к» is only a
    // thing a player can see himself doing if the entry price is on screen unowned.
    const car = view.rows.find((r) => r.id === 'car-sensible')!
    expect(car.unitPriceCents, 'and a car has no unit price at all').toBeNull()
    expect(car.unitsHeld).toBeNull()
    const idle = shopView(career('r30-view-idle', 40))
    expect(idle.rows.find((r) => r.id === 'index-fund')!.unitPriceCents).toBeGreaterThan(0)
    expect(idle.rows.find((r) => r.id === 'index-fund')!.unitsHeld).toBeNull()
    expect(idle.rows.find((r) => r.id === 'index-fund')!.avgUnitPriceCents).toBeNull()
    // ...and the snapshot really carries it, so this is not a claim about an unused function.
    expect(toSnapshot(world).shop.rows.find((r) => r.id === 'index-fund')!.unitsHeld).toBe(held.units)
  })

  it('⭐⭐ the average moves only when they BUY – a part sale leaves it exactly where it was', () => {
    const world = career('r30-avg-stable', 120, (w) => {
      if (w.week === 20) buyAsset(w, 'index-fund', 80_000_00)
    })
    const held = heldOf(world, 'index-fund')
    const before = avgUnitPriceCents(held)!
    sellAsset(world, 'index-fund', Math.round(held.valueCents / 4))
    // ⚠ HALF A CENT, AND THE REASON IS `costSoldCents`' ONE ROUNDING – written out on the
    // «зафиксировать убыток» arm above.
    expect(avgUnitPriceCents(heldOf(world, 'index-fund'))!).toBeCloseTo(before, 0)
    // ...and a week of the market moving does not move it either: it is a fact about what they PAID.
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    expect(avgUnitPriceCents(heldOf(world, 'index-fund'))!).toBeCloseTo(before, 0)
    // A BUY does move it, and the direction is exact rather than a tolerance: a weighted average of
    // the old average and the new price lands strictly between them.
    const priceNow = unitPriceCents(world.seed, world.week, FUND)
    buyAsset(world, 'index-fund', 40_000_00)
    const after = avgUnitPriceCents(heldOf(world, 'index-fund'))!
    expect(Math.min(before, priceNow) < after && after < Math.max(before, priceNow)).toBe(true)
    expect(Math.abs(after - before), 'and it really moved, not by a rounding').toBeGreaterThan(100)
  })

  it('⭐⭐ THE VOLATILITY CAME DOWN, measured against round 29`s own numbers', () => {
    // «Волатильность… очень большая по ощущениям +65/-15… менее галопирующая… вряд-ли в таких
    // крайностях.» ⚙ The probe at 4,000 seeds reads 24.5% of seasons negative (round 29: 30.8%),
    // worst season -32.5% (round 29: -39.9%) and season sd 15.1% (round 29: 16.8%). This is the
    // same measurement on a smaller sample, as a BAND, because he will judge it by feel again.
    const moves: number[] = []
    for (let s = 0; s < 400; s++) {
      const seed = `r30-vol-${s}`
      for (let w = 0; w + WEEKS_PER_YEAR <= 780; w += 26) {
        moves.push(unitPriceCents(seed, w + WEEKS_PER_YEAR, FUND) / unitPriceCents(seed, w, FUND) - 1)
      }
    }
    const negative = moves.filter((m) => m < 0).length / moves.length
    const mean = moves.reduce((a, b) => a + b, 0) / moves.length
    const sd = Math.sqrt(moves.reduce((a, b) => a + (b - mean) ** 2, 0) / moves.length)
    // ⭐ «ROUGHLY ONE YEAR IN FOUR OR FIVE» – the figure he approved before his crises pushed it to
    // nearly one in three. The band is wide enough to survive re-tuning and narrow enough to catch
    // the round 29 number coming back: at `volBps: 1_800` this reads ~31% and goes red.
    expect(negative).toBeGreaterThan(0.18)
    expect(negative).toBeLessThan(0.28)
    // ...and the extremes came in with it. Round 29's worst season was -39.9%.
    expect(Math.min(...moves)).toBeGreaterThan(-0.36)
    expect(sd).toBeLessThan(0.16)
    // ⚠ AND IT IS STILL A MARKET, not a rail – the risk has to be FELT or the item deleted itself.
    expect(negative, 'a fund that never has a bad year is the risk-free 7% again').toBeGreaterThan(0.15)
    expect(Math.min(...moves), 'and a crisis still bites').toBeLessThan(-0.2)
  })
})
