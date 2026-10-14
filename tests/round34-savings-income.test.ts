// =================================================================================================
// ⭐⭐⭐ ROUND 34 #15 – WHAT THE SAVINGS ROW CALLS INCOME MUST NOT FALL WHEN MONEY IS TAKEN OUT
// =================================================================================================
//
// THE OWNER, 02.09: «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она не
// должна меняться, просто новое поступление будет меньше»
//
// ⚠⚠ THE REPRODUCTION CAME FIRST AND IT SETTLED WHICH FIGURE HE MEANT, because the card carries
// three that could be read as income and only one of them moved (`tools/r34-savings-income.ts`,
// $100,000 held for ten years, then half taken out):
//
//   RATE      «Gains about 3% a season»            3%  ->  3%       a RATE, and it did not move
//   BRINGS IN «Brings in $N a week right now»      $0  ->  $0       zero on a deposit by design
//   CHANGE    «+$36,626 since they bought it»  $36,626 -> $18,313   THIS is the one he saw
//
// So it is an AMOUNT and not a rate, and it was being recomputed from the balance that REMAINS:
// `changeCents = valueCents - paidCents`, with a part sale scaling both sides by the same fraction.
// The family was not poorer – the $68,313 was in the wallet – but the card answered «what is the
// gain on what is still held» to a sentence that asks «what has this earned».
//
// HIS READING IS THE SPECIFICATION. The gain now carries the realised half with it, and his second
// clause needed nothing: the next week's accrual on a halved balance really is half ($41 against
// $83), which is «просто новое поступление будет меньше» already built.
//
// ⚠ NOT A SCHEMA MOVE, and `OwnedAsset.realisedGainCents` carries the argument: the two fields are
// optional, absent means «no realised gain recorded» – what every save written before this means –
// and the fallback is the shipped arithmetic to the cent. `gearRestWeeks?` and `shootClashAccepted?`
// are the precedents.
//
// ⚠⚠ MUTATION-VERIFIED. Each reverted one at a time against the shipped engine, and the four
// verdicts differ from one another – which is what says the arms are measuring different things:
//
//   * `owned.realisedGainCents = ... + deltaCents` deleted from `sellAsset` -> the four arms about
//     the FIGURE all RED (the sum, the percentage, the identity, the loss); the two about the
//     unchanged halves – backwards compatibility and «the new accrual is smaller» – stay GREEN,
//     which is exactly right: neither depends on the new term. round29p2-part-sale.test.ts's
//     re-aimed identity RED with them, its wallet, guard and revaluation arms untouched.
//   * `owned.realisedCostCents = ... + costSoldCents` deleted -> «neither does the percentage» and
//     «the two halves re-add» RED, and the sum arm stays GREEN. That pair is the whole reason this
//     field is separate from the one above: it is the denominator, and the denominator is the number
//     he did NOT complain about.
//   * `changeCents` put back to `valueCents - paidCents` in `shopView` -> the same four figure arms
//     RED, and the mounted arm in tests/component/round34-money-shelf.test.ts RED with them. That is
//     the engine-and-screen pair: the sentence a person reads is the one the engine wrote.
//   * the `?? 0` fallbacks in `shopView` made `?? 1` -> «a holding that has never been sold reads
//     exactly what it always read» RED, along with the sum and loss arms. The backwards-compatible
//     fallback is asserted rather than assumed, because it is what makes this not a schema move.
// =================================================================================================
// ⚠⚠⚠ ROUND 51 #19 (14.10) – THE OWNER REVERSED THE CARD HALF OF THIS FILE, AND THE LIFETIME HALF STAYS PINNED.
// =================================================================================================
//
// Everything above is the 02.09 ruling and the measurements behind it, kept as history. On 13.10 the owner saw it in play: «Индексный фонд всё ещё не
// пересчитывается после продажи долей, см. скриншот, +62673 показывается всё еще хотя там явно написано сколько стоит и сколько заплачено», and ruled on the
// bank: «была сумма, скажем 100к, ее положили, пришел процент, скажем 50 - стало 150к, доходность видна, мы сняли со счета 50к, там снова осталось 100к - какая теперь доходность? Мне кажется 0, прибыль изъята.» «…мы должны пересчитывать тоже в момент добавления (это кстати есть, доходность размывается) и в момент снятия (а этого нет)».
//
// So the card's «since you bought it» is the gain of the position that is LEFT – `valueCents - paidCents`, over the remaining `paidCents` – and `sellAsset` takes the
// profit first. The four arms about the FIGURE below are re-aimed to say that. What of round 34 still holds, and is still asserted here: the realised memory stays on
// the row (the lifetime truth), realised gain + the card is the same number before and after a sale, and a loss is never made to disappear. The arms that were about
// the UNCHANGED halves (a holding never sold; the next accrual is smaller) are untouched. The new law's own arms are tests/round51-bank-model-sale.test.ts.
import { describe, it, expect } from 'vitest'
import {
  buyAsset,
  createWorld,
  revalueAssets,
  sellAsset,
  shopView,
  type WorldState,
} from '../src/engine/world'
// ⚠ `ShopRowView` is a PROTOCOL type and lives in `src/shared/protocol`, not in the engine barrel –
// `engine/world` re-exports `shopView` (the function) but not the shape it returns. Round 34 wrote
// this import against the engine barrel and only the wave gate caught it, because the bundles are
// told not to run vue-tsc (its tsBuildInfoFile writes into the shared symlinked node_modules).
import type { ShopRowView } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** A family holding one open rung, opened through the real command. */
function holding(seed: string, itemId: string, stakeCents: number): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  buyAsset(world, itemId, stakeCents)
  return world
}

/** `round29p2-part-sale.test.ts`'s own recipe: move the CLOCK and revalue. The shelf's worth is pure
 *  arithmetic on the row and the week, so this ages a holding with no draws and no phases. */
function ageWeeks(world: WorldState, weeks: number): void {
  world.week += weeks
  revalueAssets(world)
}

function depositRow(world: WorldState): ShopRowView {
  const row = shopView(world).rows.find((r) => r.id === 'deposit')
  expect(row, 'the savings row').toBeTruthy()
  return row!
}

describe('#15 – (round 51 #19: re-aimed) the card describes the position that is left; the memory keeps what was earned', () => {
  it('⭐⭐ THE REPRODUCTION, RE-AIMED: the LIFETIME sum does not move when money is taken out – the card shows what is left', () => {
    const world = holding('r34-15-sum', 'deposit', 100_000_00)
    ageWeeks(world, WEEKS_PER_YEAR * 10)

    const before = depositRow(world)
    // ⚠ THE FIXTURE HAS TO HAVE EARNED SOMETHING, or "it did not move" is true of zero and the test
    // is vacuous. Ten years of the deposit's own rate on $100,000 is the walk the tool printed.
    expect(before.changeCents!, 'ten years of a 3.17% deposit really is a gain').toBeGreaterThan(30_000_00)

    const half = Math.round(before.valueCents! / 2)
    sellAsset(world, 'deposit', half)

    const after = depositRow(world)
    const held = world.assets.find((a) => a.id === 'deposit')!
    // ⚠⚠ ROUND 51 #19: half the account is more than the whole profit, so the profit left first and the position that remains has earned nothing yet – «Мне кажется 0, прибыль изъята.»
    expect(after.changeCents, 'the profit was taken: the card reads nothing').toBe(0)
    // ...and the round-34 truth is where it always was, split between the card and the memory: what it earned is what it earned
    expect(held.realisedGainCents! + after.changeCents!, 'what it earned is what it earned').toBe(before.changeCents)
    // ...and the money really did leave the holding, so this is not "nothing happened".
    expect(after.valueCents!).toBe(before.valueCents! - half)
    expect(world.fundsCents).toBeGreaterThan(0)
  })

  it('⭐ ...and the percentage beside it is read against the cost that is LEFT', () => {
    // ⚠ A WITHDRAWAL SMALLER THAN THE PROFIT, so something is left on the card and the base of the percentage is what is being tested. Round 34 divided by the
    // LIFETIME cost; round 51 #19 divides by the remaining `paidCents` – and a profit-first withdrawal inside the profit leaves that cost untouched.
    const world = holding('r34-15-pct', 'deposit', 100_000_00)
    ageWeeks(world, WEEKS_PER_YEAR * 10)
    const before = depositRow(world)
    sellAsset(world, 'deposit', 10_000_00)
    const after = depositRow(world)
    expect(after.paidCents, 'inside the profit, so the principal did not move').toBe(100_000_00)
    expect(after.changeCents, 'the profit shrank by exactly what was taken').toBe(before.changeCents! - 10_000_00)
    expect(after.changePct, 'the return on the cost that is left').toBe(Math.round((after.changeCents! / after.paidCents!) * 100))
    expect(after.changePct!, 'and it fell with the profit').toBeLessThan(before.changePct!)
  })

  it('⭐ the realised and unrealised halves re-add to the lifetime gain, to the cent', () => {
    // ⚠ «IT DID NOT MOVE» IS NOT ENOUGH ON ITS OWN – a figure frozen at the wrong value would pass. This is the arithmetic underneath: what is still on the holding
    // plus what previous sales took out IS the lifetime gain (everything taken out and everything still held, less the cash that went in).
    const world = holding('r34-15-identity', 'deposit', 80_000_00)
    ageWeeks(world, WEEKS_PER_YEAR * 6)
    sellAsset(world, 'deposit', 10_000_00)
    ageWeeks(world, WEEKS_PER_YEAR * 2)
    sellAsset(world, 'deposit', 25_000_00)

    const held = world.assets.find((a) => a.id === 'deposit')!
    const row = depositRow(world)
    expect(held.realisedGainCents!, 'two sales, both realised').toBeGreaterThan(0)
    expect(row.changeCents, 'the card is the position that is left').toBe(held.valueCents - held.paidCents)
    expect(held.realisedGainCents! + row.changeCents!, 'the lifetime gain, split between the memory and the card').toBe(35_000_00 + held.valueCents - 80_000_00)
    expect(row.changePct).toBe(Math.round((row.changeCents! / held.paidCents) * 100))
  })

  it('⚠ a LOSS is not fixed by a part sale – it rides on what is left, unchanged in dollars', () => {
    // ⚠⚠ THE MIRROR, AND IT IS THE ARM THAT STOPS THIS BECOMING FREE MONEY: a sale must never make a loss vanish off the card. Round 34 kept it by realising a share of
    // it; the bank (round 51 #19) has no profit to hand over on a sunken holding, so the withdrawal is all principal and the whole loss stays where it was.
    // ⚠ A CAR IS SOLD WHOLE, so the losing fixture is a divisible rung: only an 'open' rung takes money out in parts.
    const fund = holding('r34-15-loss-fund', 'index-fund', 100_000_00)
    ageWeeks(fund, WEEKS_PER_YEAR)
    const held = fund.assets.find((a) => a.id === 'index-fund')!
    // Force the holding under water without touching the market model: the price is the world's, the
    // POSITION is this fixture's, and a family that put in more than it is worth is an ordinary state.
    held.paidCents = held.valueCents * 2

    const rowBefore = shopView(fund).rows.find((r) => r.id === 'index-fund')!
    expect(rowBefore.changeCents!, 'the fixture really is under water').toBeLessThan(0)
    const out = Math.round(held.valueCents / 2)
    sellAsset(fund, 'index-fund', out)

    const rowAfter = shopView(fund).rows.find((r) => r.id === 'index-fund')!
    expect(held.realisedGainCents, 'nothing was profit, so nothing was realised').toBe(0)
    expect(held.realisedCostCents, 'the whole withdrawal was principal coming back').toBe(out)
    expect(rowAfter.changeCents, 'the loss does not evaporate when money is taken out').toBe(rowBefore.changeCents)
  })

  it('⚠ a holding that has never been sold reads exactly what it always read', () => {
    // BACKWARDS COMPATIBILITY, ASSERTED RATHER THAN ASSUMED. The two fields are absent on every save
    // written before this item and on every holding nobody has taken money out of, and absent has to
    // mean the shipped arithmetic to the cent – that is the whole reason this is not a schema move.
    const world = holding('r34-15-untouched', 'deposit', 40_000_00)
    ageWeeks(world, WEEKS_PER_YEAR * 3)
    const held = world.assets.find((a) => a.id === 'deposit')!
    expect(held.realisedGainCents, 'nothing has been sold, so nothing is recorded').toBeUndefined()
    expect(held.realisedCostCents).toBeUndefined()
    const row = depositRow(world)
    expect(row.changeCents).toBe(held.valueCents - held.paidCents)
    expect(row.changePct).toBe(Math.round(((held.valueCents - held.paidCents) / held.paidCents) * 100))
  })

  it('⭐ his second clause was already true: the new accrual IS smaller', () => {
    // «просто новое поступление будет меньше». Nothing was built for this – it is what the engine
    // does – but it is asserted here so the item's two halves are both on the record, and so that a
    // future fix to the FIGURE can never be mistaken for freezing the MECHANIC.
    const world = holding('r34-15-accrual', 'deposit', 100_000_00)
    ageWeeks(world, WEEKS_PER_YEAR)
    const held = world.assets.find((a) => a.id === 'deposit')!
    const beforeSale = held.valueCents
    ageWeeks(world, 1)
    const fullWeek = held.valueCents - beforeSale
    expect(fullWeek, 'a week of interest on the whole balance').toBeGreaterThan(0)

    sellAsset(world, 'deposit', Math.round(held.valueCents / 2))
    const halved = held.valueCents
    ageWeeks(world, 1)
    const halfWeek = held.valueCents - halved
    expect(halfWeek, 'half the balance earns about half the interest').toBeLessThan(fullWeek)
    expect(halfWeek * 2).toBeCloseTo(fullWeek, -1)
  })
})
