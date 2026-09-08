// ⭐⭐ A BRAND IS A PROCESS, NOT A PURCHASE – round 38 #16.
//
// THE OWNER, 07.09, overturning the rule he had approved the day before: «если мы до пика известности
// бренд не покупали, то он всё равно поднимался в цене? Это супер-странно. Я бы сказал, что он
// неизменно для первого открытия стоит 250к, а потом МОЖЕТ набрать свои 5млн, но не за 1 день, т.к.
// это процесс… при высокой известности будет идти быстрее (может быть кратно быстрее)» – and on the
// number: «полураспад 2 года при средней славе, кратно быстрее при высокой».
//
// ⚠⚠ THIS FILE REPLACES `r38-purchase-price.test.ts`, WHICH PINNED THE WITHDRAWN RULE. The claim it
// carried – that a rung cannot be sold and bought straight back for a profit – is kept and is the
// first block below; what changed is WHERE that is true. #14 charged `max(catalogue, worth)` at the
// door, which made a FIRST brand on a famous career cost $5,172,791 against a $250,000 sticker. #16
// closes the same loop one layer down, in what a fresh row is WORTH, so the sticker is honest again.
//
// ⚠ THE MEASURED DEFECT, on his own week-1115 save through the shipped commands, before either fix:
//   merch-brand sold for $2,576,989 and bought back for $250,000 – +$2,326,989 of WEALTH a cycle,
//   repeatable in one week. The academy premium (#8) opened a second at about $1M a cycle.
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { rampedWorthCents, worthRampHalfLife } from '../src/engine/world/assets'

const R = ECONOMY.shop.worthRamp

describe('round 38 #16 – the ramp closes the loop by construction', () => {
  it('⚠⚠ a rung bought THIS week is worth exactly what was paid for it', () => {
    // The whole of the fix: there is no gap to arbitrage on the week of purchase, whatever the world
    // says the thing is eventually worth.
    for (const derived of [0, 250_000_00, 5_172_791_00]) {
      expect(rampedWorthCents(250_000_00, derived, 0, 104), `derived ${derived}`).toBe(250_000_00)
    }
  })

  it('and it really does converge on the derived value, given time', () => {
    const paid = 250_000_00
    const derived = 5_172_791_00
    const near = rampedWorthCents(paid, derived, 104 * 8, 104)
    expect(near).toBeGreaterThan(derived * 0.99)
    expect(near).toBeLessThanOrEqual(derived)
  })

  it('one half-life closes exactly half the gap', () => {
    const paid = 100_00
    const derived = 300_00
    expect(rampedWorthCents(paid, derived, 104, 104)).toBe(200_00)
  })

  it('⭐ it converges DOWNWARD too – a fading brand walks to its value instead of dropping to it', () => {
    // «делая его более плавным», item 2, from the other side: one curve, both directions.
    const paid = 5_000_000_00
    const derived = 1_000_000_00
    const half = rampedWorthCents(paid, derived, 104, 104)
    expect(half).toBe(3_000_000_00)
    expect(half).toBeLessThan(paid)
    expect(half).toBeGreaterThan(derived)
  })
})

describe('round 38 #16 – the pace is the driver, and it is his sentence', () => {
  it('median fame gives the two years he named', () => {
    expect(worthRampHalfLife(R.medianFame, R.medianFame)).toBe(R.halfLifeWeeks)
    expect(R.halfLifeWeeks).toBe(104)
  })

  it('⭐ high fame is «кратно быстрее» – above the median the gap closes proportionally faster', () => {
    // ⚠ RE-AIMED, ROUND 39 #5 (owner 08.09 «давай попробуем» on A+C) – WAS «three times the median
    // closes the gap three times faster», and the 52-week floor now stands exactly where that arm
    // measured (104/3 ≈ 34.7 < 52). «Кратно» survives at the ratio the floor still admits – 1.5x
    // the median is 1.5x the speed – and everything past DOUBLE the median rides the floor: at the
    // fame cap the half-life is 52, one year, where the old 13-week floor let it reach ~13.3 and
    // handed a fresh $250k brand $1.84M in its first week (the reopened item's own measurement).
    expect(worthRampHalfLife(R.medianFame * 1.5, R.medianFame)).toBeCloseTo(R.halfLifeWeeks / 1.5, 6)
    expect(worthRampHalfLife(R.medianFame * 1.5, R.medianFame)).toBeLessThan(R.halfLifeWeeks)
    expect(worthRampHalfLife(R.medianFame * 3, R.medianFame), 'past 2x the floor holds').toBe(R.minHalfLifeWeeks)
  })

  it('a career the world has never heard of takes years, but not for ever', () => {
    expect(worthRampHalfLife(0, R.medianFame)).toBe(R.maxHalfLifeWeeks)
    expect(R.maxHalfLifeWeeks).toBeLessThan(1000)
  })

  it('⚠ and the fastest it can ever go is still a process', () => {
    expect(worthRampHalfLife(1e9, R.medianFame)).toBe(R.minHalfLifeWeeks)
    expect(R.minHalfLifeWeeks).toBeGreaterThan(0)
  })

  it('⚠ a zero or negative median cannot divide the world into a NaN', () => {
    expect(worthRampHalfLife(50, 0)).toBe(R.maxHalfLifeWeeks)
    expect(Number.isFinite(rampedWorthCents(1, 2, 3, 0))).toBe(true)
  })

  it('the medians are the measured ones, not round numbers somebody liked', () => {
    // fame across the owner's 22 professional careers: p10 3.2, MEDIAN 12.8, p90 39.3, max 81.3.
    expect(R.medianFame).toBeGreaterThan(3)
    expect(R.medianFame).toBeLessThan(40)
    expect(R.medianReputationOver1).toBeGreaterThan(0)
  })
})
