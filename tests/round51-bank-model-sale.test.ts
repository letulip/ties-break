// =================================================================================================
// ⭐⭐⭐ ROUND 51 #19 – A WITHDRAWAL TAKES THE PROFIT FIRST, AND THE CARD PRINTS THE POSITION THAT IS LEFT
// =================================================================================================
//
// THE ITEM, 13.10: «Индексный фонд всё ещё не пересчитывается после продажи долей, см. скриншот,
// +62673 показывается всё еще хотя там явно написано сколько стоит и сколько заплачено»
//
// THE RULING, 13.10 evening: «была сумма, скажем 100к, ее положили, пришел процент, скажем 50 -
// стало 150к, доходность видна, мы сняли со счета 50к, там снова осталось 100к - какая теперь
// доходность? Мне кажется 0, прибыль изъята. … мы должны пересчитывать тоже в момент добавления
// (это кстати есть, доходность размывается) и в момент снятия (а этого нет)»
//
// THE BANK MODEL, as `sellAsset`'s header states it – a part sale of S from a row at (paid P, value V):
//     profitPart = min(S, max(0, V - P))        principalPart = S - profitPart
//     paid' = P - principalPart                 value' = V - S
//     realisedGain += profitPart                realisedCost += principalPart
// and `shopView` prints `V - P` of the row as it STANDS, over the remaining `paid`.
//
// ⚠⚠ WHAT THIS FILE IS NOT. It does not pin the ledger sentence or its season memo: they keep naming
// the AVERAGE-COST difference of the units that left (`costSoldCents` / `deltaCents`), as shipped –
// the ruling is about the card's yield. tests/round29p2-part-sale.test.ts and
// tests/secondary-market-s4.test.ts carry those, re-aimed under the same ruling.
//
// ⚠ THE FIXTURES ARE POSED, AND THAT IS HONEST HERE. `buyAsset` opens the row through the real
// command, then the POSITION (paid / value) is written by hand, exactly as tests/round34-savings-
// income.test.ts's loss arm does it: a sale reads the row and nothing re-prices it between the pose
// and the call, so the arithmetic under test is the sale's and nobody else's. The one arm that must
// age a row for real (the sequence) uses the deposit, whose growth is a deterministic exponential.
// ⚠⚠ MUTATION-VERIFIED, 14.10, EACH ARM AGAINST ITS OWN CHANGE (one at a time against the shipped code, `git hash-object` of all three touched sources identical before and
// after every restore). Counts are of THIS file; the mounted file's are in tests/component/round51-bank-model-card.test.ts.
//
//   * M1  the view half reverted (`changeCents` folds `realisedGainCents` back in AND `changePct` divides by `paid + realisedCost`)  -> 18 RED / 15 green: the posed live row
//         (6,767,300 where 1,645,400 is expected, i.e. +$67,673 for +$16,454), every table row's card line, the sequence's «card = worth - paid» and the pct arms. The
//         arms about the MEMORY and the wallet (grid, telescoping) stay green, which is right: the view half does not touch them.
//   * M1b only the sum folded back (the pct base kept)                                                                              -> 15 RED / 18 green, same family.
//   * M2  the sale half reverted to the shipped pro-rata release (`principal = round(paid x S / V)`)                                -> 22 RED / 11 green (21 titles): the owner's
//         example (paid 66,667 where 100,000 is expected), the table, the grid, the sequence, the sentence arms and the telescoping arms; the live-row arm stays green.
//   * M3  the confirm-dialog preview back to a share of the row's gain                                                              -> this file 33/33 GREEN, on purpose: it is not an
//         engine claim. The mounted file's two dialog arms go RED alone.
//   * M4  the `Math.max(0, ...)` underwater clamp removed from `bankSaleSplit`                                                      -> 5 RED: both underwater table rows, the
//         underwater loss-carry arm and both underwater telescoping rows. Nothing profitable moves.
//   Not mutated: the units line (`units x (1 - S / V)`) – it is the shipped round-30 line and this file only asserts that it did not move.
import { describe, it, expect } from 'vitest'
import {
  avgUnitPriceCents,
  buyAsset,
  createWorld,
  revalueAssets,
  sellAsset,
  shopView,
  type WorldState,
} from '../src/engine/world'
import type { ShopRowView } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** The two divisible rungs. `sellAsset`'s part path is ONE path for both, which is the claim. */
const RUNGS = ['deposit', 'index-fund'] as const

/** A family holding one open rung, opened through the real command, its POSITION then posed. */
function posed(seed: string, itemId: string, paidCents: number, valueCents: number): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  buyAsset(world, itemId, 100_000_00)
  const held = world.assets.find((a) => a.id === itemId)!
  held.paidCents = paidCents
  held.valueCents = valueCents
  return world
}

function rowOf(world: WorldState, itemId: string): ShopRowView {
  const row = shopView(world).rows.find((r) => r.id === itemId)
  expect(row, `the ${itemId} row`).toBeTruthy()
  return row!
}

describe('⭐⭐⭐ the owner\'s own example, on both rungs', () => {
  it.each(RUNGS)('%s: 100k in, 150k worth, 50k taken out => paid 100k, worth 100k, gain 0', (id) => {
    const world = posed(`r51-19-example-${id}`, id, 100_000_00, 150_000_00)
    const walletBefore = world.fundsCents
    const unitsBefore = world.assets[0].units!

    // «стало 150к, доходность видна»
    const before = rowOf(world, id)
    expect(before.changeCents, 'the yield is visible before the withdrawal').toBe(50_000_00)
    expect(before.changePct).toBe(50)

    // «мы сняли со счета 50к»
    sellAsset(world, id, 50_000_00)
    const held = world.assets.find((a) => a.id === id)!

    // «там снова осталось 100к» – and the cost of what is left is STILL the 100k that went in
    expect(held.valueCents, 'the account holds 100k again').toBe(100_000_00)
    expect(held.paidCents, 'the profit left first, so the principal did not move').toBe(100_000_00)
    // «какая теперь доходность? Мне кажется 0, прибыль изъята.»
    const after = rowOf(world, id)
    expect(after.changeCents, 'the profit is taken: the yield is 0').toBe(0)
    expect(after.changePct).toBe(0)
    // the memory STAYS and says where the profit went; no principal left
    expect(held.realisedGainCents).toBe(50_000_00)
    expect(held.realisedCostCents).toBe(0)
    expect(world.fundsCents - walletBefore, 'the 50k really reached the wallet').toBe(50_000_00)

    // ⚠ NOT VACUOUS: the shipped pro-rata sale would have left paid at 66,667 and the card at +16,667 (+folded history)
    expect(held.paidCents).not.toBe(100_000_00 - Math.round((100_000_00 * 50_000_00) / 150_000_00))
    // units leave pro rata, as before (a third of them) – so the honest per-unit basis of what remains RISES
    expect(held.units!).toBeCloseTo(unitsBefore * (2 / 3), 6)
    expect(avgUnitPriceCents(held)!, '«bought at» rises: paid stayed, units dropped').toBeGreaterThan(
      100_000_00 / unitsBefore,
    )
  })

  it('...and the yield is visible AGAIN on the next price move – the bank, not a freeze', () => {
    // «доходность» is not pinned at 0 forever: once the profit is out the account holds exactly its cost, so a later revaluation is a fresh gain over the cost that is left.
    // ⚠ AGED FOR REAL, NOT POSED: a posed value that disagrees with the units is overwritten by the next `revalueAssets` (units x price), which would test the pose.
    const world = createWorld('r51-19-example-regrows')
    world.fundsCents = 5_000_000_00
    buyAsset(world, 'deposit', 100_000_00)
    world.week += WEEKS_PER_YEAR * 10
    revalueAssets(world)
    const grown = rowOf(world, 'deposit')
    expect(grown.changeCents!, 'ten years of interest is a real profit to take').toBeGreaterThan(30_000_00)
    sellAsset(world, 'deposit', grown.changeCents!)
    expect(rowOf(world, 'deposit').changeCents, 'exactly the profit out: nothing left on the card').toBe(0)
    expect(world.assets[0].paidCents, 'and the principal did not move').toBe(100_000_00)
    world.week += WEEKS_PER_YEAR
    revalueAssets(world)
    expect(rowOf(world, 'deposit').changeCents!, 'a year of interest on what is left is a new gain').toBeGreaterThan(0)
  })
})

describe('⭐ the formula table: every branch of profit-first', () => {
  // [name, P, V, S, paid', value', realisedGain', realisedCost']
  const CASES: Array<[string, number, number, number, number, number, number, number]> = [
    ['inside the profit (the example)', 100_000_00, 150_000_00, 50_000_00, 100_000_00, 100_000_00, 50_000_00, 0],
    ['half of the profit', 100_000_00, 150_000_00, 25_000_00, 100_000_00, 125_000_00, 25_000_00, 0],
    ['beyond the profit dips into principal', 100_000_00, 150_000_00, 120_000_00, 30_000_00, 30_000_00, 50_000_00, 70_000_00],
    ['one cent past the profit', 100_000_00, 150_000_00, 50_000_01, 99_999_99, 99_999_99, 50_000_00, 1],
    ['underwater: all principal, the loss carries', 100_000_00, 50_000_00, 25_000_00, 75_000_00, 25_000_00, 0, 25_000_00],
    ['at cost: no profit to take', 80_000_00, 80_000_00, 20_000_00, 60_000_00, 60_000_00, 0, 20_000_00],
    ['one cent of a profit', 100_000_00, 100_000_01, 1, 100_000_00, 100_000_00, 1, 0],
  ]

  for (const id of RUNGS) {
    it.each(CASES)(`${id}: %s`, (_name, P, V, S, paid, value, gain, cost) => {
      const world = posed(`r51-19-table-${id}-${P}-${V}-${S}`, id, P, V)
      sellAsset(world, id, S)
      const held = world.assets.find((a) => a.id === id)!
      expect(held.paidCents, 'paid').toBe(paid)
      expect(held.valueCents, 'value').toBe(value)
      expect(held.realisedGainCents, 'realised gain = the profit part').toBe(gain)
      expect(held.realisedCostCents, 'realised cost = the principal part').toBe(cost)
      // the card is the honest subtraction of the two figures it prints beside the sentence
      const row = rowOf(world, id)
      expect(row.paidCents).toBe(paid)
      expect(row.valueCents).toBe(value)
      expect(row.changeCents).toBe(value - paid)
      expect(row.changePct).toBe(paid > 0 ? Math.round(((value - paid) / paid) * 100) : null)
    })
  }

  it('⭐ an UNDERWATER sale realises nothing: the absolute loss is the same before and after', () => {
    for (const id of RUNGS) {
      const world = posed(`r51-19-underwater-${id}`, id, 100_000_00, 50_000_00)
      const before = rowOf(world, id)
      expect(before.changeCents).toBe(-50_000_00)
      sellAsset(world, id, 25_000_00)
      const after = rowOf(world, id)
      expect(after.changeCents, 'the loss in dollars did not move').toBe(before.changeCents)
      // ...and the percentage is read against the cost that is LEFT, so it deepens: -50/75, not -50/100
      expect(after.changePct).toBe(Math.round((-50_000_00 / 75_000_00) * 100))
      expect(after.changePct!).toBeLessThan(before.changePct!)
    }
  })
})

describe('⭐⭐ the invariant: nothing is created or lost by a sale at a fixed price', () => {
  it('realised + (value - paid), paid + realisedCost and realised gain + cost hold across a grid of sales', () => {
    let cases = 0
    for (const id of RUNGS) {
      for (const P of [50_000_00, 100_000_00]) {
        for (const V of [30_000_00, 100_000_00, 100_000_01, 180_000_00]) {
          const gainOnHand = Math.max(0, V - P)
          const sales = new Set([1, 999, 20_000_00, gainOnHand, gainOnHand + 1, V - 1].filter((s) => s > 0 && s < V))
          for (const S of sales) {
            const world = posed(`r51-19-grid-${id}-${P}-${V}-${S}`, id, P, V)
            const held = world.assets.find((a) => a.id === id)!
            // a row with a history, so the invariant is not 'from zero' only
            held.realisedGainCents = 7_000_00
            held.realisedCostCents = 3_000_00
            const walletBefore = world.fundsCents

            sellAsset(world, id, S)
            cases++

            const gain = held.realisedGainCents!
            const cost = held.realisedCostCents!
            const label = `${id} P=${P} V=${V} S=${S}`
            expect(gain + (held.valueCents - held.paidCents), `lifetime gain, ${label}`).toBe(7_000_00 + (V - P))
            expect(held.paidCents + cost, `cash that ever went in, ${label}`).toBe(P + 3_000_00)
            expect(gain + cost, `everything ever taken out, ${label}`).toBe(7_000_00 + 3_000_00 + S)
            expect(held.valueCents, `value, ${label}`).toBe(V - S)
            expect(world.fundsCents - walletBefore, `wallet, ${label}`).toBe(S)
            // profit-first: the principal moves only once the profit is exhausted
            expect(held.paidCents <= P, `paid never grows on a sale, ${label}`).toBe(true)
            expect(held.paidCents === P, `paid untouched iff inside the profit, ${label}`).toBe(S <= gainOnHand)
            expect(held.paidCents, `no negative cost, ${label}`).toBeGreaterThan(0)
          }
        }
      }
    }
    // the grid is not accidentally empty (the lesson of the zero-denominator A/B of 28.09)
    expect(cases, 'a non-empty denominator').toBeGreaterThan(40)
  })
})

describe('⭐⭐ the sequence: sell, then top up, then sell again keeps every identity', () => {
  it('a deposit aged six years: profit out, a top-up, two more years, more out', () => {
    const world = createWorld('r51-19-sequence')
    world.fundsCents = 5_000_000_00
    buyAsset(world, 'deposit', 80_000_00)
    world.week += WEEKS_PER_YEAR * 6
    revalueAssets(world)
    const held = world.assets.find((a) => a.id === 'deposit')!
    let cashIn = 80_000_00
    let taken = 0
    const walletStart = world.fundsCents

    const identities = (step: string): void => {
      const row = rowOf(world, 'deposit')
      // the card reconciles with its own worth and paid lines
      expect(row.changeCents, `${step}: card = worth - paid`).toBe(held.valueCents - held.paidCents)
      expect(row.changePct, `${step}: pct over the remaining cost`).toBe(Math.round(((held.valueCents - held.paidCents) / held.paidCents) * 100))
      // the cash that went in, and what came out, are carried exactly
      expect(held.paidCents + (held.realisedCostCents ?? 0), `${step}: paid + realised cost = cash in`).toBe(cashIn)
      expect((held.realisedGainCents ?? 0) + (held.realisedCostCents ?? 0), `${step}: realised gain + cost = taken out`).toBe(taken)
      // the economic lifetime gain is the same figure however it is split
      expect((held.realisedGainCents ?? 0) + row.changeCents!, `${step}: lifetime gain`).toBe(taken + held.valueCents - cashIn)
      // units x bought-at reconciles with paid (bought-at is rounded once: half a cent a unit at most)
      expect(Math.abs(row.unitsHeld! * row.avgUnitPriceCents! - row.paidCents!), `${step}: units x bought-at ~ paid`).toBeLessThanOrEqual(row.unitsHeld! / 2 + 1)
    }

    const grown = rowOf(world, 'deposit')
    expect(grown.changeCents!, 'six years of interest is a real gain to take').toBeGreaterThan(10_000_00)
    identities('start')

    // 1. a withdrawal inside the profit: the principal does not move
    sellAsset(world, 'deposit', 10_000_00)
    taken += 10_000_00
    expect(held.paidCents, 'inside the profit').toBe(80_000_00)
    identities('after the first sale')
    const afterFirst = rowOf(world, 'deposit')
    expect(afterFirst.changeCents, 'the profit shrank by exactly what was taken').toBe(grown.changeCents! - 10_000_00)

    // 2. a top-up under what is held (so the memory is not cleared) but big enough to move a WHOLE percentage: the yield DILUTES
    buyAsset(world, 'deposit', 40_000_00)
    cashIn += 40_000_00
    expect(held.realisedGainCents, 'a small top-up keeps the memory').toBe(10_000_00)
    identities('after the top-up')
    const afterTopUp = rowOf(world, 'deposit')
    expect(afterTopUp.changeCents, 'a top-up at the current price adds to worth and paid alike').toBe(afterFirst.changeCents)
    expect(afterTopUp.changePct!, 'the percentage is diluted by the larger cost').toBeLessThan(afterFirst.changePct!)

    // 3. two more years of interest
    world.week += WEEKS_PER_YEAR * 2
    revalueAssets(world)
    identities('after two more years')

    // 4. a second withdrawal that outruns the profit and dips into principal
    const grownAgain = rowOf(world, 'deposit')
    const outrun = grownAgain.changeCents! + 20_000_00
    sellAsset(world, 'deposit', outrun)
    taken += outrun
    identities('after the second sale')
    expect(held.paidCents, 'the principal gave up exactly the part past the profit').toBe(grownAgain.paidCents! - 20_000_00)
    expect(rowOf(world, 'deposit').changeCents, 'profit exhausted: the yield is 0 again').toBe(0)
    expect(world.fundsCents - walletStart, 'wallet = taken out - cash in').toBe(taken - 40_000_00)
  })
})

describe('⭐ his live fund row reconciles with its own lines, no migration', () => {
  it('paid 32,110, worth 48,564, 51,219 realised before the ruling => +16,454 (51%)', () => {
    const world = posed('r51-19-live-row', 'index-fund', 32_110_00, 48_564_00)
    const held = world.assets.find((a) => a.id === 'index-fund')!
    // the memory a pre-ruling sale left behind: NOT his real realised cost (the brief does not carry it) – any figure shows the old fold
    held.realisedGainCents = 51_219_00
    held.realisedCostCents = 44_000_00
    const row = rowOf(world, 'index-fund')
    expect(row.changeCents, 'worth - paid, nothing folded in').toBe(16_454_00)
    expect(row.changePct).toBe(51)
    // ⚠ NOT VACUOUS: the folded figure the shipped card printed
    expect(row.changeCents).not.toBe(16_454_00 + 51_219_00)
  })
})

describe('⭐⭐ the ledger follows the bank, because it must: the memos telescope to the true profit or loss', () => {
  /** every realised memo the family's sales wrote, summed – `FinanceWeek.realisedCents`, the year-end card's own source. */
  const memoSum = (world: WorldState): number => world.financeWeeks.reduce((sum, w) => sum + (w.realisedCents ?? 0), 0)

  it.each(RUNGS)('%s: the example\'s sentence names the 50k as profit, and the memo carries it', (id) => {
    const world = posed(`r51-19-sentence-${id}`, id, 100_000_00, 150_000_00)
    sellAsset(world, id, 50_000_00)
    const last = world.events[world.events.length - 1]
    expect(last.text).toContain('Sold $50,000 of:')
    expect(last.text, 'all of it was profit, none of it principal').toContain('$50,000 more than it cost')
    expect(memoSum(world)).toBe(50_000_00)
  })

  it.each(RUNGS)('%s: an underwater part sale is returned principal – exactly what it cost, no memo', (id) => {
    const world = posed(`r51-19-sentence-uw-${id}`, id, 100_000_00, 50_000_00)
    sellAsset(world, id, 25_000_00)
    expect(world.events[world.events.length - 1].text).toContain('exactly what it cost')
    expect(memoSum(world), 'a part sale cannot fix a loss: it rides on the row').toBe(0)
  })

  // [name, paid, value, part sale]
  const SCENARIOS: Array<[string, number, number, number]> = [
    ['profit, then close', 100_000_00, 150_000_00, 50_000_00],
    ['past the profit, then close', 100_000_00, 150_000_00, 120_000_00],
    ['underwater, then close', 100_000_00, 50_000_00, 25_000_00],
    ['at cost, then close', 80_000_00, 80_000_00, 20_000_00],
  ]
  for (const id of RUNGS) {
    it.each(SCENARIOS)(`${id}: %s – the memos sum to proceeds minus the cash that went in`, (_name, P, V, S) => {
      const world = posed(`r51-19-telescope-${id}-${P}-${V}-${S}`, id, P, V)
      const walletBefore = world.fundsCents
      sellAsset(world, id, S)
      sellAsset(world, id)
      expect(world.assets.find((a) => a.id === id), 'the closing sale deletes the row').toBeUndefined()
      const proceeds = world.fundsCents - walletBefore
      expect(proceeds, 'the part and the rest are all of the value').toBe(V)
      expect(memoSum(world), 'what the year-end card reads back is the true profit or loss').toBe(proceeds - P)
    })
  }
})
