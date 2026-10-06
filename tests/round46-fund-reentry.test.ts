// =================================================================================================
// ⭐⭐⭐ ROUND 46 #14 – THE FUND CARD AFTER «ALMOST EVERYTHING OUT, THEN IN AGAIN»
// =================================================================================================
//
// THE OWNER: «Индексный фонд не пересчитывается после изъятия почти всех денег и захода снова:
// "8131.90 units – bought at $9,969 each, $10,212 now / +$49,610,632 since you bought it (33%)" – я
// только пару недель назад зашёл на 80млн, они ещё не могли дать такой прирост»
//
// ⚠⚠ THE DIAGNOSIS CAME FIRST AND IT WAS NOT THE BASIS. The line above the gain on his own card is
// the proof: 8131.90 units at $9,969 is $81.07M – the $80M he put in plus a small residue – and
// $10,212 against it is +2.4%. `sellAsset` releases `paidCents` and `units` by the same fraction, so
// the average is honest across any withdrawal (arms 3 and 4 below hold that to the cent). What was
// wrong is the figure UNDER it: round 34 #15 made «since you bought it» the holding's LIFETIME gain
// (the realised half rides beside the unrealised one – his own ruling of 02.09, pinned in
// `round34-savings-income.test.ts`), and only a WHOLE sale deletes the row. «Almost everything» left
// the row alive with every cent of realised history on it, and the $80M arrived beside it.
//
// THE FIX IS ONE COMPARISON IN `buyAsset`: money going in that is at least what is already held
// retires the realised memory, so the card describes the new holding. A smaller top-up keeps it –
// round 34's ruling is untouched – and a part sale still carries it, which arm 2 holds in place.
// NO NEW STATE, NO SCHEMA MOVE: the two fields cleared are the optional ones `shopView` already reads
// as «none recorded» when absent. ZERO DRAWS – the frozen capture is untouched.
//
// ⚠ A ROW ALREADY POLLUTED IN A LIVE SAVE KEEPS ITS MEMORY UNTIL ITS NEXT DOMINATING TOP-UP – arm 5
// holds both halves of that: it loads unchanged, and it heals on the re-entry.
//
// ⚠⚠ MUTATION-VERIFIED against `buyAsset` and `sellAsset`, each restored byte-identical (cmp), and the
// three verdicts differ from one another – which is what says the arms measure different things:
//
//   * the re-entry comparison made `false` (= the unfixed tree) -> FOUR RED: his scenario, the
//     boundary, the walked sequence (its «the re-entry retired the memory» step) and the live-shape
//     heal. The round 34 arm, the proportional-release arm and the pre-round-34 shape stay GREEN,
//     which is right: none of them depends on the new term.
//   * `owned.paidCents -= costSoldCents` deleted from the part sale -> NINE RED: four here (his
//     scenario, the boundary, the walk's memory identity, the proportional release) and five in the
//     files that pin the same arithmetic (round34-savings-income x3, round29p2-part-sale x2).
//   * the comparison made `paidCents >= 0` (a reset on EVERY top-up) -> ONE RED, and it is the round
//     34 arm alone – the arm that stops a SMALLER top-up from retiring the memory.
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
import { migrateSave } from '../src/engine/migrations'
import type { ShopRowView } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const FUND = 'index-fund'
/** whole dollars to cents – money is cents everywhere in the engine. */
const usd = (dollars: number): number => Math.round(dollars * 100)

/** `round34-savings-income.test.ts`'s recipe: move the CLOCK and revalue. The shelf's worth is pure
 *  arithmetic on the row and the week, so this ages a holding with no draws and no phases. */
function ageWeeks(world: WorldState, weeks: number): void {
  world.week += weeks
  revalueAssets(world)
}

function fundRow(world: WorldState): ShopRowView {
  const row = shopView(world).rows.find((r) => r.id === FUND)
  expect(row, 'the index fund row').toBeTruthy()
  return row!
}

function heldFund(world: WorldState) {
  const held = world.assets.find((a) => a.id === FUND)
  expect(held, 'the family holds the fund').toBeTruthy()
  return held!
}

/** A family with a wallet that can carry an eight-figure fund, at week 0. */
function family(seed: string): WorldState {
  const world = createWorld(seed)
  world.fundsCents = usd(5_000_000_000)
  return world
}

/** A holding that has EARNED and then had part taken out: $20M in at year 3, eight years of the
 *  fund's own walk, 60% withdrawn – so it carries realised memory – and four weeks on. */
function holdingWithMemory(seed: string): WorldState {
  const world = family(seed)
  ageWeeks(world, WEEKS_PER_YEAR * 3)
  buyAsset(world, FUND, usd(20_000_000))
  ageWeeks(world, WEEKS_PER_YEAR * 8)
  sellAsset(world, FUND, Math.round(heldFund(world).valueCents * 0.6))
  ageWeeks(world, 4)
  return world
}

describe('#14 – a re-entry that outweighs what is left starts the fund card over', () => {
  it('⭐⭐ HIS SCENARIO AS AN ASSERTION: almost everything out, $80M in, the card is about the $80M', () => {
    const world = family('r46-14-his-card')
    // the big stint: $70M in at year 3, ten years of the fund's own walk – so the re-entry lands at
    // year 13, where his own card read $9,969 a unit
    ageWeeks(world, WEEKS_PER_YEAR * 3)
    buyAsset(world, FUND, usd(70_000_000))
    ageWeeks(world, WEEKS_PER_YEAR * 10)
    const grown = fundRow(world)
    // ⚠ THE FIXTURE HAS TO HAVE EARNED A LOT, or «not the old gain» is true of nothing.
    expect(grown.changeCents!, 'ten years of the fund is a large gain').toBeGreaterThan(usd(10_000_000))

    // «изъятие почти всех денег» – 98.5% out, a residue stays
    sellAsset(world, FUND, Math.round(grown.valueCents! * 0.985))
    const residue = fundRow(world)
    // round 34's ruling holds until the re-entry: the lifetime sum did not move on the withdrawal
    expect(residue.changeCents, 'a withdrawal does not shrink what it earned').toBe(grown.changeCents)

    // a few weeks pass, then «зашёл на 80млн»
    ageWeeks(world, 6)
    const memory = {
      gain: heldFund(world).realisedGainCents!,
      cost: heldFund(world).realisedCostCents!,
    }
    expect(memory.gain, 'the stint left a large realised memory on the row').toBeGreaterThan(usd(10_000_000))
    buyAsset(world, FUND, usd(80_000_000))
    // «они ещё не могли дать такой прирост» – two weeks on
    ageWeeks(world, 2)

    const card = fundRow(world)
    const held = heldFund(world)
    // the three figures on the line above the gain (the owner's own sanity check)
    expect(card.paidCents!, 'the $80M plus a small residue').toBeGreaterThan(usd(80_000_000))
    expect(card.paidCents!, 'and not much more than the residue').toBeLessThan(usd(80_000_000) * 1.05)
    expect(
      Math.abs(card.unitsHeld! * card.avgUnitPriceCents! - card.paidCents!),
      'units x «bought at» is what went in',
    ).toBeLessThan(usd(100))
    // the figure under them – the whole item. THE OLD CARD, computed from the memory the row carried,
    // is what the owner read; the control proves the scenario really reproduces his class.
    const oldPct = Math.round(
      ((card.valueCents! - card.paidCents! + memory.gain) / (card.paidCents! + memory.cost)) * 100,
    )
    expect(oldPct, 'the old reading was a large lifetime gain, which two weeks cannot earn').toBeGreaterThan(20)

    expect(card.changeCents, `the card says ${card.changePct}% where it said ${oldPct}%`).toBe(
      card.valueCents! - card.paidCents!,
    )
    expect(Math.abs(card.changePct!), 'two weeks of one fund is a small percentage').toBeLessThanOrEqual(6)
    expect(
      Math.abs(card.changeCents! - card.unitsHeld! * (card.unitPriceCents! - card.avgUnitPriceCents!)),
      'the gain agrees with the units line above it',
    ).toBeLessThan(usd(100))
    expect(held.realisedGainCents, 'the stint is retired from the row').toBeUndefined()
    expect(held.realisedCostCents).toBeUndefined()
  })

  it('⭐ ROUND 34 IS UNTOUCHED: a part sale keeps the lifetime sum, and a SMALLER top-up keeps the memory', () => {
    const world = holdingWithMemory('r46-14-keep')
    const held = heldFund(world)
    const memory = { gain: held.realisedGainCents!, cost: held.realisedCostCents! }
    expect(memory.gain, 'the part sale recorded what it realised').toBeGreaterThan(0)

    const valueNow = fundRow(world).valueCents!
    buyAsset(world, FUND, Math.floor(valueNow * 0.99))
    const card = fundRow(world)
    expect(held.realisedGainCents, 'under half the new holding is new money: memory stays').toBe(memory.gain)
    expect(held.realisedCostCents).toBe(memory.cost)
    expect(card.changeCents, 'the lifetime identity of round 34').toBe(
      held.valueCents - held.paidCents + memory.gain,
    )
  })

  it('⭐ ...AND THE BOUNDARY IS HALF: a top-up that outweighs the holding retires the memory', () => {
    const world = holdingWithMemory('r46-14-boundary')
    const held = heldFund(world)
    expect(held.realisedGainCents!).toBeGreaterThan(0)
    const valueNow = fundRow(world).valueCents!

    buyAsset(world, FUND, Math.ceil(valueNow * 1.01))
    const card = fundRow(world)
    expect(held.realisedGainCents, 'more than half of it is new money: the card starts over').toBeUndefined()
    expect(held.realisedCostCents).toBeUndefined()
    expect(card.changeCents, 'the gain is the current holding\'s own').toBe(held.valueCents - held.paidCents)
    // and the next withdrawal starts a fresh memory, so round 34's ruling applies to the new holding
    const before = fundRow(world).changeCents
    sellAsset(world, FUND, Math.round(held.valueCents / 2))
    expect(fundRow(world).changeCents, 'a withdrawal still does not shrink the sum').toBe(before)
  })

  it('⭐ CONSERVATION: across a walked sequence the basis is only ever moved, so realised + unrealised is the total gained', () => {
    const world = family('r46-14-walk')
    const tally = { cashIn: 0, proceeds: 0, released: 0, archived: 0 }
    const held = () => world.assets.find((a) => a.id === FUND)
    const buy = (stake: number): void => {
      // the memory a dominating re-entry retires is ARCHIVED, never destroyed – the test keeps it
      const memory = held()?.realisedGainCents ?? 0
      const wallet = world.fundsCents
      buyAsset(world, FUND, stake)
      tally.cashIn += wallet - world.fundsCents
      if (held()?.realisedGainCents === undefined) tally.archived += memory
    }
    const sell = (amount: number): void => {
      const wallet = world.fundsCents
      const paidBefore = held()!.paidCents
      sellAsset(world, FUND, amount)
      tally.proceeds += world.fundsCents - wallet
      tally.released += paidBefore - held()!.paidCents
    }
    const check = (step: string): void => {
      const row = held()!
      const realised = tally.proceeds - tally.released
      const unrealised = row.valueCents - row.paidCents
      expect(row.paidCents + tally.released, `${step}: the basis was moved, never made or lost`).toBe(tally.cashIn)
      expect(realised + unrealised, `${step}: realised + unrealised`).toBe(
        row.valueCents + tally.proceeds - tally.cashIn,
      )
      // what the row still carries plus what a re-entry archived is every cent that was realised
      expect((row.realisedGainCents ?? 0) + tally.archived, `${step}: the memory is moved, never lost`).toBe(realised)
    }

    ageWeeks(world, WEEKS_PER_YEAR * 2)
    buy(usd(10_000_000))
    check('opened')
    ageWeeks(world, WEEKS_PER_YEAR * 5)
    sell(Math.round(held()!.valueCents * 0.2))
    check('a fifth out')
    ageWeeks(world, WEEKS_PER_YEAR * 2)
    buy(usd(3_000_000)) // smaller than the holding: the memory stays
    check('a small top-up')
    ageWeeks(world, WEEKS_PER_YEAR * 3)
    sell(Math.round(held()!.valueCents * 0.6))
    check('three fifths out')
    ageWeeks(world, WEEKS_PER_YEAR)
    sell(Math.round(held()!.valueCents * 0.99))
    check('almost everything out')
    ageWeeks(world, 1)
    buy(usd(50_000_000)) // outweighs the residue: the card starts over
    expect(held()!.realisedGainCents, 'the re-entry retired the memory').toBeUndefined()
    expect(tally.archived, 'and it was archived, so nothing was destroyed').toBeGreaterThan(0)
    check('re-entered')
    ageWeeks(world, 2)
    sell(Math.round(held()!.valueCents * 0.3))
    check('a withdrawal from the new holding')
  })

  it('⭐ A PART SALE RELEASES THE BASIS PROPORTIONALLY: half out, half the cost, the same average', () => {
    const world = family('r46-14-half')
    buyAsset(world, FUND, usd(10_000_000))
    ageWeeks(world, WEEKS_PER_YEAR * 3)
    const before = { ...heldFund(world) }
    const avgBefore = avgUnitPriceCents(before)!

    sellAsset(world, FUND, Math.round(before.valueCents / 2))
    const after = heldFund(world)
    expect(Math.abs(after.paidCents - before.paidCents / 2), 'half the cost left with the half').toBeLessThanOrEqual(2)
    expect(Math.abs(after.units! / (before.units! / 2) - 1), 'and half the units').toBeLessThan(1e-6)
    expect(Math.abs(avgUnitPriceCents(after)! / avgBefore - 1), 'the average entry price did not move').toBeLessThan(1e-6)
  })
})

describe('#14 – a save written before this change', () => {
  it('⭐ a career that already carries the memory loads unchanged through the migration path, and heals on its re-entry', () => {
    const world = holdingWithMemory('r46-14-legacy-memory')
    const raw = JSON.parse(JSON.stringify(world)) as { assets: Array<Record<string, unknown>> }
    // the shape the shipped code wrote: unit holding, memory on the row – exactly what this world IS
    const row = raw.assets.find((a) => a.id === FUND)!
    expect(row.realisedGainCents, 'the old shape carries the memory').toBeGreaterThan(0)

    const loaded = migrateSave(raw)
    const card = fundRow(loaded)
    expect(Number.isFinite(card.changeCents!) && Number.isFinite(card.changePct!), 'sane figures').toBe(true)
    expect(card.changeCents, 'the card reads what it read yesterday, to the cent').toBe(fundRow(world).changeCents)
    expect(card.changePct).toBe(fundRow(world).changePct)

    // ...and the first dominating top-up on the LOADED career retires the stale memory
    buyAsset(loaded, FUND, Math.ceil(card.valueCents! * 1.01))
    const healed = fundRow(loaded)
    expect(healed.changeCents).toBe(heldFund(loaded).valueCents - heldFund(loaded).paidCents)
    expect(heldFund(loaded).realisedGainCents).toBeUndefined()
  })

  it('⭐ a save from before round 34 (no memory fields at all) reads value minus cost, to the cent', () => {
    const world = holdingWithMemory('r46-14-legacy-bare')
    const raw = JSON.parse(JSON.stringify(world)) as { assets: Array<Record<string, unknown>> }
    const row = raw.assets.find((a) => a.id === FUND)!
    delete row.realisedGainCents
    delete row.realisedCostCents

    const loaded = migrateSave(raw)
    const held = heldFund(loaded)
    expect(fundRow(loaded).changeCents).toBe(held.valueCents - held.paidCents)
    // a dominating top-up on a row with nothing to retire is a plain top-up
    buyAsset(loaded, FUND, Math.ceil(held.valueCents * 1.01))
    expect(heldFund(loaded).realisedGainCents).toBeUndefined()
    expect(fundRow(loaded).changeCents).toBe(heldFund(loaded).valueCents - heldFund(loaded).paidCents)
  })
})
