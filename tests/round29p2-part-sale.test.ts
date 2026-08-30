// ⭐⭐⭐ ROUND 29 PART TWO #4 – SELLING PART OF A HOLDING, AND THE P&L SURVIVING IT.
//
// THE OWNER, 29.08: «при продаже бумаг надо дать возможность только часть продавать, иными словами
// при продаже надо дать цифровой инпут для ввода суммы продажи.» ⭐ His reasoning came with it: a
// holding money can come back OUT of in parts is a real cash-management decision instead of a
// one-way door.
//
// ⚠⚠ THE TRAP THIS FILE EXISTS FOR IS THE ONE ROUND 29 #11 FELL INTO AND CAUGHT. `revalueAssets`
// recomputes `valueCents` from `basisCents`/`basisWeek` on EVERY tick, so a sale that only lowered
// the value would be silently undone the following week – the money would land in the wallet and the
// holding would grow it straight back. And `paidCents` is the CASH the family put in, so a sale that
// left it alone would make `changeCents = valueCents - paidCents` report the whole holding's gain
// against a fraction of the holding. Both halves are asserted here, and both were watched failing.
//
// ⚠ MUTATION-VERIFIED – each turns exactly the named case red, and each was watched doing it:
//   * `owned.basisCents = owned.valueCents - proceedsCents` deleted -> "a sold part stays sold",
//     ALONE. This is the trap itself: the next tick reinflates the holding.
//   * `owned.paidCents -= costSoldCents` deleted             -> "twice over" (the P&L half) and
//     "the top-up's own P&L survives it", together – they are the same claim on two fixtures.
//   * `Math.round(...)` -> `Math.floor(...)` in `costSoldCents` -> nothing, and that is CORRECT: the
//     realised and unrealised halves still re-add because the remainder is a subtraction. Recorded
//     because a mutation that changes nothing is evidence about the design, not a gap in the net.
//   * `!(asked > 0)` -> `asked < 0`                        -> "a zero sale is refused" AND "a NaN
//     amount is refused" – the two halves of the same comparison, and the NaN half is the one that
//     survived the first draft of this guard.
//   * `asked > owned.valueCents` -> `asked > owned.valueCents * 2` -> "more than they hold", ALONE.
//   * the `item.stake !== 'open'` refusal deleted            -> "a car is sold whole", ALONE.
import { describe, it, expect } from 'vitest'
import {
  buyAsset,
  createWorld,
  ownedAssets,
  revalueAssets,
  sellAsset,
  shopItem,
  shopView,
  assetValueCents,
  type WorldState,
} from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** A family at week 0 with money and one open deposit. ⚠ WEEK 0 IS REACHABLE NOW – part two #6
 *  deleted the professional gate, so this fixture is the game's first week and not a contrivance. */
function withDeposit(seed: string, stakeCents = 100_000_00): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 1_000_000_00
  buyAsset(world, 'deposit', stakeCents)
  return world
}

/** Move the world's CLOCK without ticking it – the shelf's value is pure arithmetic on
 *  `(basisCents, basisWeek, week)`, so this is the honest, cheap way to age a holding and it is what
 *  `revalueAssets` reads. No draws, no phases, nothing else about the world moves. */
function ageWeeks(world: WorldState, weeks: number): void {
  world.week += weeks
  revalueAssets(world)
}

describe('part two #4 – a part sale takes money out and leaves the rest working', () => {
  it('⭐⭐ TWICE OVER: the wallet, the remaining holding and the P&L, at every step', () => {
    const world = withDeposit('p2-part-sale-twice')
    ageWeeks(world, WEEKS_PER_YEAR)
    const held = world.assets[0]
    // A season of the deposit's own rate on $100,000 – the engine's arithmetic, asked for here
    // rather than copied, because the RATE is part two #3's business and not this item's.
    const grown = assetValueCents(shopItem('deposit')!, 100_000_00, WEEKS_PER_YEAR)
    expect(held.valueCents).toBe(grown)
    expect(held.paidCents).toBe(100_000_00)
    const gain = grown - 100_000_00
    expect(gain, 'the fixture really has a gain to split').toBeGreaterThan(0)

    // ---- SALE ONE: $30,000 out of it -------------------------------------------------------
    const wallet0 = world.fundsCents
    sellAsset(world, 'deposit', 30_000_00)
    expect(world.fundsCents, 'the wallet gets exactly what was asked for').toBe(wallet0 + 30_000_00)
    expect(ownedAssets(world), 'and the holding is still there').toHaveLength(1)
    expect(held.valueCents, 'worth what is left').toBe(grown - 30_000_00)
    // ⚠ THE COST OF WHAT LEFT, ONE ROUNDING – and the cost of what stayed is the subtraction, so the
    // two re-add to the original stake to the cent.
    const costSold1 = Math.round((100_000_00 * 30_000_00) / grown)
    expect(held.paidCents).toBe(100_000_00 - costSold1)
    // ⭐ THE P&L: the realised half is on the ledger row, the unrealised half is on the holding, and
    // they add back up to the gain the family actually had. That identity is the whole item.
    const realised1 = 30_000_00 - costSold1
    const unrealised1 = held.valueCents - held.paidCents
    expect(realised1 + unrealised1, 'realised + unrealised = the gain, to the cent').toBe(gain)
    const row1 = world.events[world.events.length - 1]
    expect(row1.amountCents).toBe(30_000_00)
    expect(row1.text, 'the sentence says it was a part, and names the realised difference').toContain(
      'Sold $30,000 of: A savings deposit',
    )
    expect(row1.text).toContain('more than it cost')

    // ---- SALE TWO: another $20,000, off the already-reduced holding ------------------------
    const valueBefore2 = held.valueCents
    const paidBefore2 = held.paidCents
    const wallet1 = world.fundsCents
    sellAsset(world, 'deposit', 20_000_00)
    expect(world.fundsCents).toBe(wallet1 + 20_000_00)
    expect(held.valueCents).toBe(valueBefore2 - 20_000_00)
    const costSold2 = Math.round((paidBefore2 * 20_000_00) / valueBefore2)
    expect(held.paidCents).toBe(paidBefore2 - costSold2)
    // ...and the identity holds a second time, against the gain that was still on the holding.
    expect(20_000_00 - costSold2 + (held.valueCents - held.paidCents)).toBe(valueBefore2 - paidBefore2)
    // ⚠ AND THE SCREEN AGREES WITH THE WORLD: `changeCents` is the unrealised half and nothing else.
    const row = shopView(world).rows.find((r) => r.id === 'deposit')!
    expect(row.valueCents).toBe(held.valueCents)
    expect(row.paidCents).toBe(held.paidCents)
    expect(row.changeCents).toBe(held.valueCents - held.paidCents)
  })

  it('⚠⚠ a sold part STAYS sold – the next tick may not grow it back', () => {
    // ⚠⚠⚠ THE TRAP, AND THE FIXTURE IS THE HALF THAT MAKES THIS ARM HONEST. `revalueAssets` is the
    // one writer of `valueCents` and recomputes it from `(basisCents ?? paidCents, basisWeek ??
    // boughtWeek)`, so a part sale that lowered the value alone would be undone on the next tick with
    // the cash already banked.
    //
    // ⚠⚠ AND THE FIRST VERSION OF THIS ARM WAS DEAD – recorded rather than quietly fixed, because it
    // is the trap's own shape. It used a freshly-bought deposit, which carries NO `basisCents` at
    // all, so the fallback read `paidCents` – and `paidCents` had been scaled by the very same
    // fraction, which made a rebase-less sale arithmetically identical on that fixture. The mutation
    // passed. A TOPPED-UP holding is the fixture where the basis is real and stale, and there the
    // missing rebase restores the whole holding on the next revaluation.
    const sold = withDeposit('p2-part-sale-stays', 50_000_00)
    ageWeeks(sold, WEEKS_PER_YEAR)
    buyAsset(sold, 'deposit', 50_000_00)
    expect(sold.assets[0].basisCents, 'the fixture really carries a basis of its own').toBeGreaterThan(0)
    ageWeeks(sold, WEEKS_PER_YEAR)

    const before = sold.assets[0].valueCents
    const half = Math.round(before / 2)
    sellAsset(sold, 'deposit', half)
    const held = sold.assets[0]
    // ⭐ THE REBASE ITSELF, ASSERTED: what is left, struck today.
    expect(held.valueCents).toBe(before - half)
    expect(held.basisCents, 'the basis is what is LEFT, not what it was').toBe(before - half)
    expect(held.basisWeek, 'and the compounding clock restarted here').toBe(sold.week)
    // ...so a revaluation in the SAME week changes nothing, which is `revalueAssets`' own contract.
    revalueAssets(sold)
    expect(held.valueCents).toBe(before - half)

    // ⭐⭐ AND A SEASON LATER IT IS STILL HALF A HOLDING. Without the rebase this line reads the STALE
    // basis and reinflates the deposit to the full amount – the sale reversed, the money kept.
    const leftAtSale = held.valueCents
    ageWeeks(sold, WEEKS_PER_YEAR)
    expect(held.valueCents, 'the sale was not quietly reversed').toBeLessThan(before)
    // NEUTRAL, TO THE CENT: what is left tracks the same curve, scaled. No punishment for selling and
    // no free money either – «мы ни за что не наказываем», and its mirror.
    expect(held.valueCents).toBe(assetValueCents(shopItem('deposit')!, leftAtSale, WEEKS_PER_YEAR))
  })

  it("⚠⚠ the top-up's own P&L survives a part sale – round 29 #11's split, both directions", () => {
    // ⭐ THE SAME FIELDS FROM THE OTHER END. A top-up REBASES `basisCents` and ADDS to `paidCents`;
    // a part sale rebases the other way and SUBTRACTS. Doing one after the other must leave
    // `changeCents = valueCents - paidCents` meaning what it has always meant.
    const world = withDeposit('p2-part-sale-after-topup', 50_000_00)
    ageWeeks(world, WEEKS_PER_YEAR)
    const held = world.assets[0]
    buyAsset(world, 'deposit', 50_000_00) // the top-up: rebases, and paidCents becomes the cash in
    expect(held.paidCents, 'the cash the family put in, both cheques').toBe(100_000_00)
    expect(held.basisWeek, 'and the compounding clock restarted').toBe(world.week)
    ageWeeks(world, WEEKS_PER_YEAR)
    const gainBefore = held.valueCents - held.paidCents
    expect(gainBefore, 'there is a real gain to split').toBeGreaterThan(0)

    const out = 40_000_00
    const valueBefore = held.valueCents
    const paidBefore = held.paidCents
    sellAsset(world, 'deposit', out)
    const costSold = Math.round((paidBefore * out) / valueBefore)
    expect(held.paidCents).toBe(paidBefore - costSold)
    expect(out - costSold + (held.valueCents - held.paidCents), 'nothing is lost between the halves').toBe(gainBefore)
    // ⚠ AND `boughtWeek` IS STILL THE WEEK THEY OPENED IT – neither writer touches it.
    expect(held.boughtWeek).toBe(0)
  })
})

describe('part two #4 – the three guards, and one more the item did not name', () => {
  it('⚠ refuses MORE than they hold, and names the figure', () => {
    const world = withDeposit('p2-guard-over')
    const wallet = world.fundsCents
    const events = world.events.length
    expect(() => sellAsset(world, 'deposit', 100_000_01)).toThrow('They only hold $100,000 of that')
    expect(world.fundsCents, 'nothing moved').toBe(wallet)
    expect(world.events).toHaveLength(events)
    expect(world.assets[0].valueCents).toBe(100_000_00)
  })

  it('⚠ refuses a NEGATIVE amount', () => {
    const world = withDeposit('p2-guard-negative')
    const wallet = world.fundsCents
    expect(() => sellAsset(world, 'deposit', -5_000_00)).toThrow('not an amount to sell')
    expect(world.fundsCents).toBe(wallet)
    expect(world.assets[0].paidCents).toBe(100_000_00)
  })

  it('⚠⚠ refuses a ZERO sale – no zero-op that still writes a row', () => {
    // The sharpest of the three: zero would pass every «not more than they hold» check, move no
    // money, and still put a «Sold $0 of:» line in the ledger for the player to puzzle over.
    const world = withDeposit('p2-guard-zero')
    const wallet = world.fundsCents
    const events = world.events.length
    expect(() => sellAsset(world, 'deposit', 0)).toThrow('not an amount to sell')
    expect(world.fundsCents).toBe(wallet)
    expect(world.events, 'and NO ledger row was written').toHaveLength(events)
  })

  it('⚠ a car is sold WHOLE, and an amount on one is refused rather than ignored', () => {
    // ⚠ THE ONE PLACE THIS DOES NOT MIRROR `buyAsset`, and `sellAsset`'s header says why: ignoring a
    // stake on a buy means paying the catalogue's stated price, while ignoring an amount on a sale
    // would mean disposing of the whole car when half was asked for.
    const world = createWorld('p2-guard-fixed')
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-sensible')
    expect(() => sellAsset(world, 'car-sensible', 10_000_00)).toThrow('can only be sold whole')
    expect(world.assets, 'and it is still theirs').toHaveLength(1)
    expect(() => sellAsset(world, 'car-sensible'), 'the whole sale still works').not.toThrow()
    expect(world.assets).toHaveLength(0)
  })

  it('⚠ asking for everything is a WHOLE sale, not a refusal – we punish nobody for rounding up', () => {
    const world = withDeposit('p2-guard-exact')
    const wallet = world.fundsCents
    sellAsset(world, 'deposit', 100_000_00)
    expect(world.fundsCents).toBe(wallet + 100_000_00)
    expect(ownedAssets(world), 'the holding is closed, not left at zero').toHaveLength(0)
    expect(world.events[world.events.length - 1].text).toContain('Sold: A savings deposit')
  })

  it('⚠⚠ refuses a NaN amount – the guard that read like it covered this and did not', () => {
    // `NaN <= 0` is FALSE and `NaN > value` is FALSE, so a malformed amount off the wire walks past
    // both comparisons and writes NaN into `valueCents` and `basisCents`. A career corrupted by a
    // guard nobody had mutated. `!(asked > 0)` is the form that catches it.
    const world = withDeposit('p2-guard-nan')
    const wallet = world.fundsCents
    expect(() => sellAsset(world, 'deposit', Number.NaN)).toThrow('not an amount to sell')
    expect(world.fundsCents).toBe(wallet)
    expect(Number.isInteger(world.assets[0].valueCents), 'the holding is still a number').toBe(true)
    expect(world.assets[0].valueCents).toBe(100_000_00)
  })

  it('⚠ and a sale with NO amount is what it always was – the whole holding', () => {
    const world = withDeposit('p2-guard-undefined')
    const wallet = world.fundsCents
    sellAsset(world, 'deposit')
    expect(world.fundsCents).toBe(wallet + 100_000_00)
    expect(ownedAssets(world)).toHaveLength(0)
  })
})
