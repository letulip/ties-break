// ⭐⭐⭐ ROUND 46 #9 – WHAT A CAREER EARNED AND WHAT IT ACTUALLY COST.
//
// THE OWNER, 18.09, off his finished career: «наша математика затрат и заработков… сказала в
// альбоме, что заработано было 13млн (причем вообще не ясно откуда эта цифра), а потрачено 83млн…
// мы как-то некорректно читаем траты на теннис (о которых речь) и заработки. Эта математика
// критична и ее тоже надо починить.» He finished holding $10M+ liquid, a $20M+ fund, houses, an
// academy and a brand – a family that cannot possibly have earned $13M against $83M spent.
//
// ⚠ THE DIAGNOSIS IS MEASURED AND LIVES IN `tools/album-money-probe.ts`: on a walked career that
// buys the way he does, 59.7% of «spent» ($15,490,000 of $25,935,355) was the `'shop'` category –
// a house, the brand, the academy and the fund – money MOVED and not consumed, sitting in the same
// save under `assets` at $39,327,362. And «won» is `careerTotals.prizeCents`, the family's half of
// the prize cheques, which on that career was $17,164,973 against the $28,749,334 in HER account
// and $10,862,617 of wages, sponsors, grants and businesses that no epilogue figure ever named.
//
// WHAT THIS FILE PINS, and every arm is mutation-verified in its own comment:
//   1. the split itself – `outlayCents` is `spentCents` minus what the family still owns;
//   2. the identity, on a real walked career that really buys something;
//   3. a career that owns NOTHING is byte-identical, which is every frozen career and every bench;
//   4. a SOLD asset stays consumed – the realised loss is a real cost and must not be excused;
//   5. the break-even milestone moved WITH the figures, so the page and its gate cannot disagree;
//   6. the migrated-save clamp;
//   7. the album's slot 6 quotes the honest number.
import { describe, it, expect } from 'vitest'
import {
  buyAsset,
  captureBreakEven,
  closeTournament,
  createWorld,
  sellAsset,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { addEvent, careerMoney } from '../src/engine/world/ledger'
import { slotTheTurn } from '../src/engine/world/album'
import { rngFromSeed } from '../src/engine/rng'
import { formatCents } from '../src/shared/money'

function career(seed: string, weeks: number): { world: WorldState; openingFundsCents: number } {
  const world = createWorld(seed)
  const openingFundsCents = world.fundsCents
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return { world, openingFundsCents }
}

describe('⭐⭐⭐ round 46 #9 – the money that left, and the money that only moved', () => {
  it('⭐⭐⭐ takes what the family STILL OWNS back out of «spent», and keeps the gross beside it', () => {
    const { world } = career('r46-money-a', 40)
    const spentBefore = world.careerTotals.spentCents
    world.fundsCents += 500_000_00
    buyAsset(world, 'index-fund', 400_000_00)

    const money = careerMoney(world)
    expect(money.spentCents, 'the raw accumulator counted the deposit, as it always has').toBe(spentBefore + 400_000_00)
    expect(money.heldCents, 'and the deposit is what the family still owns, at cost').toBe(400_000_00)
    // ⚠⚠ THE ARM. Mutate `careerMoney` to return `totals.spentCents` for `outlayCents` and this line
    // goes red by exactly the deposit – measured 18.09: 6 of the 7 tests in this file turn red.
    expect(money.outlayCents, 'so nothing the family still holds is inside «spent»').toBe(spentBefore)
    expect(money.holdingsCents, 'what it is worth is a different fact and gets its own figure').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ THE IDENTITY, on a career that really buys: what came in, minus what went for good, is what it ended up with', () => {
    const { world, openingFundsCents } = career('r46-money-b', 60)
    // ⚠ THE MONEY ARRIVES THROUGH THE LEDGER, NOT BY POKING THE WALLET, and that is the whole point
    // of this arm: the identity is a statement about cash that CROSSED the ledger, so a hand-injected
    // balance would be an inheritance the accumulators never saw and the equation would be false for
    // an honest reason. `addEvent` is the seam every real income uses.
    world.fundsCents += 250_000_00
    addEvent(world, { week: world.week, type: 'income', category: 'income', text: 'A windfall', amountCents: 250_000_00 })
    buyAsset(world, 'index-fund', 120_000_00)
    buyAsset(world, 'car-sensible')

    const m = careerMoney(world)
    // ⚠ THE OPENING RESERVE IS NOT AN EARNING – the family had it before week zero and it never
    // crossed the ledger, which is why it is subtracted rather than counted.
    expect(m.cameInCents - m.outlayCents, 'cameIn − spent = wallet growth + what is held + her account').toBe(
      world.fundsCents - openingFundsCents + m.heldCents + m.herAccountCents,
    )
    // ...and the two accumulators still reconcile with the wallet exactly as they always did, which
    // is what makes the line above a decomposition rather than a second, parallel arithmetic.
    expect(m.earnedCents - m.spentCents).toBe(world.fundsCents - openingFundsCents)
  })

  it('⭐⭐ a family that owns NOTHING reads byte-identically – every frozen career, every bench', () => {
    const { world } = career('r46-money-c', 60)
    expect(world.assets, 'the fixture really bought nothing').toHaveLength(0)
    const m = careerMoney(world)
    expect(m.heldCents).toBe(0)
    expect(m.outlayCents, 'so «spent» is the accumulator, unchanged').toBe(world.careerTotals.spentCents)
    expect(m.holdingsCents).toBe(0)
  })

  it('⭐⭐⭐ a SOLD asset is consumed again, and the realised loss is the cost – no bookkeeping needed', () => {
    const { world } = career('r46-money-d', 40)
    world.fundsCents += 300_000_00
    buyAsset(world, 'car-sensible')
    const boughtFor = world.assets[0].paidCents
    expect(careerMoney(world).outlayCents, 'held while it is held').toBe(world.careerTotals.spentCents - boughtFor)

    // ...five years on the car is worth less, and selling it realises that loss for good.
    for (let i = 0; i < 5; i++) {
      const rng = rngFromSeed(`${world.seed}:hold:${i}`)
      for (let w = 0; w < 52; w++) {
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
      }
    }
    const soldFor = world.assets[0].valueCents
    expect(soldFor, 'the car really did lose money – §3b of the shop spec').toBeLessThan(boughtFor)
    sellAsset(world, 'car-sensible')

    const m = careerMoney(world)
    expect(m.heldCents, 'nothing is held any more').toBe(0)
    // ⚠⚠ THE ARM THAT MATTERS: the purchase stays inside `spentCents` and the proceeds inside
    // `earnedCents`, so the PAIR nets to the loss. Excusing a sold asset would have made a family
    // that churned depreciating things look as though it had spent nothing at all.
    expect(m.outlayCents, 'so the whole purchase is spend again').toBe(m.spentCents)
    expect(m.cameInCents - m.outlayCents, 'and the loss is what the household is down by').toBeLessThan(
      m.cameInCents - (m.spentCents - boughtFor + soldFor),
    )
  })

  it('⭐⭐⭐ the break-even milestone moved WITH the figures – a deposit can no longer hold the turn away', () => {
    const { world } = career('r46-money-e', 30)
    world.careerTotals = { earnedCents: 900_00, spentCents: 500_00, prizeCents: 600_00, weeksLostToInjury: 0 }
    world.milestones = world.milestones.filter((m) => m.type !== 'break-even')
    captureBreakEven(world)
    expect(world.milestones.filter((m) => m.type === 'break-even' && m.kind === 'career'), 'it crosses').toHaveLength(1)

    // Now the same career, with the same prize money, having put $400 into a fund the week before.
    const again = career('r46-money-e', 30).world
    again.careerTotals = { earnedCents: 900_00, spentCents: 500_00, prizeCents: 600_00, weeksLostToInjury: 0 }
    again.milestones = again.milestones.filter((m) => m.type !== 'break-even')
    again.fundsCents += 5_000_00
    buyAsset(again, 'index-fund', 1_000_00)
    expect(again.careerTotals.spentCents, 'the raw total really did pass the prize money').toBeGreaterThan(
      again.careerTotals.prizeCents,
    )
    captureBreakEven(again)
    // ⚠⚠ THE ARM. Point `captureBreakEven`'s career arm back at `t.spentCents` and this goes red:
    // measured 1 failing assertion here, and the page's own figures would then be claiming a
    // crossing the milestone denied. That disagreement is the whole reason the two read one fold.
    expect(
      again.milestones.filter((m) => m.type === 'break-even' && m.kind === 'career'),
      'the deposit is not a cost, so the turn still happened',
    ).toHaveLength(1)
  })

  it('⚠ a migrated save whose totals under-count cannot print a negative spend', () => {
    const { world } = career('r46-money-f', 30)
    world.fundsCents += 300_000_00
    buyAsset(world, 'index-fund', 200_000_00)
    // The v38 -> v39 step reconstructed `careerTotals` off a ledger already pruned to sixty weeks and
    // calls itself «a documented undercount for an old one», so a real save can hold more than it
    // remembers paying for.
    world.careerTotals.spentCents = 1_000_00
    expect(careerMoney(world).outlayCents, 'floored, never negative').toBe(0)
    expect(careerMoney(world).heldCents, 'and the holding still says what it cost').toBe(200_000_00)
  })

  it('⭐⭐ the album\'s slot 6 quotes the honest number, and so does the snapshot the screens read', () => {
    const { world } = career('r46-money-g', 40)
    world.fundsCents += 500_000_00
    buyAsset(world, 'index-fund', 300_000_00)
    const m = careerMoney(world)

    const fact = slotTheTurn(world).fact ?? ''
    expect(fact, 'the page says what left for good').toContain(formatCents(m.outlayCents))
    expect(fact, 'and never the figure that counts the fund as spending').not.toContain(formatCents(m.spentCents))

    const snap = toSnapshot(world)
    expect(snap.careerMoney, 'the same fold reaches every screen through one field').toEqual(m)
    expect(snap.careerTotals, 'and the raw accumulators are untouched on the wire').toEqual(world.careerTotals)
  })
})
