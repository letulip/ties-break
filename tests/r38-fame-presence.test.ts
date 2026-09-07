// ⭐⭐ PRESENCE IS A DIFFERENT FACT FROM A RESULT, AND THE WORLD REMEMBERS IT LONGER.
//
// The owner, 06.09: «спортсменка проводит свой лучший сезон (и не один) находясь в топ-100 и входя
// иногда в топ-50 даже, у нее явно есть и репутация и о ней знают, не могу забыть за год.»
//
// Round 38 #2c, and this file pins the three claims the change is made of, plus the two invariants
// it may not break. What it does NOT pin is the tuned values themselves – 0.6, 312, 0.95, 0.55 and
// 312 are calibration and `docs/specs/fame-presence-2026-09.md` is where they are argued. A test
// that asserted the numbers would go red on the next honest retune and teach nothing.
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { decayAt, fameFloorOf, seasonFloorDecayAt } from '../src/engine/world/fame'
import type { WorldState } from '../src/engine/world'

/** The smallest world `fameFloorOf` will read: a season ledger and nothing else. Everything the
 *  function looks at is guarded with `??`, which is what lets this be four fields rather than a
 *  whole career. */
function worldWithSeasons(ranks: (number | null)[]): WorldState {
  return {
    seasonHistory: ranks.map((endRank, i) => ({
      seasonIndex: i,
      byTrack: { wta: { endRank } },
    })),
  } as unknown as WorldState
}

describe('round 38 #2c – a season inside the top 100 is worth something', () => {
  it('pays a career that never left the top 100 and never entered the top 50', () => {
    // Wrapped at the end of season 0, read one week later: no decay worth speaking of.
    const world = worldWithSeasons([80])
    const floor = fameFloorOf(world, 53)
    expect(floor).toBeGreaterThan(0)
  })

  it('⚠ MUTATION ARM – with the rung removed the same career is worth exactly zero', () => {
    const F = ECONOMY.fame as unknown as { seasonEndBands: { maxEndRank: number; add: number }[] }
    const bands = F.seasonEndBands
    F.seasonEndBands = bands.filter((b) => b.maxEndRank <= 50)
    try {
      expect(fameFloorOf(worldWithSeasons([80]), 53)).toBe(0)
    } finally {
      F.seasonEndBands = bands
    }
  })

  it('still pays the higher bands MORE, so the ladder keeps its order', () => {
    const at = (rank: number) => fameFloorOf(worldWithSeasons([rank]), 53)
    expect(at(5)).toBeGreaterThan(at(15))
    expect(at(15)).toBeGreaterThan(at(40))
    expect(at(40)).toBeGreaterThan(at(80))
    expect(at(80)).toBeGreaterThan(0)
    // ...and a season outside every band is still worth nothing: the ladder ENDS somewhere.
    expect(at(400)).toBe(0)
  })

  it('counts the best matching band once and never two bands for one season', () => {
    // A single top-10 season must not also be paid as a top-20, top-50 and top-100 one.
    const top10 = fameFloorOf(worldWithSeasons([5]), 53)
    const band = ECONOMY.fame.seasonEndBands.find((b) => 5 <= b.maxEndRank)!
    expect(top10).toBeCloseTo(band.add * seasonFloorDecayAt(53 - 52), 6)
  })
})

describe('round 38 #2c – the career clock', () => {
  it('is a SEPARATE curve from the title clock', () => {
    // Same shape, different constant. If someone collapses them back into one function this fails.
    const delta = ECONOMY.fame.seasonHalfLifeWeeks
    expect(seasonFloorDecayAt(delta)).toBeCloseTo(0.5, 10)
    expect(decayAt(delta)).not.toBeCloseTo(0.5, 3)
  })

  it('⚠ IS THE LONGEST OF THE THREE CLOCKS – a season may not be forgotten faster than the title won inside it', () => {
    const longestCampaign = Math.max(...ECONOMY.fame.shootFloorHalfLifeByBand)
    expect(ECONOMY.fame.seasonHalfLifeWeeks).toBeGreaterThan(ECONOMY.fame.halfLifeWeeks)
    expect(ECONOMY.fame.seasonHalfLifeWeeks).toBeGreaterThanOrEqual(longestCampaign)
  })

  it('treats a week before the season as zero, exactly as the title clock does', () => {
    expect(seasonFloorDecayAt(-1)).toBe(0)
  })

  it('makes a long career visible where the title clock made it disappear', () => {
    // Nine seasons in the top 100 over eighteen years, read at the end. On the title clock the
    // oldest of them are gone; on the career clock they are still there.
    const ranks: (number | null)[] = Array.from({ length: 18 }, (_, i) => (i % 2 === 0 ? 80 : null))
    const world = worldWithSeasons(ranks)
    const now = 19 * 52
    const onCareerClock = fameFloorOf(world, now)
    const F = ECONOMY.fame as unknown as { seasonHalfLifeWeeks: number }
    const kept = F.seasonHalfLifeWeeks
    F.seasonHalfLifeWeeks = ECONOMY.fame.halfLifeWeeks
    let onTitleClock: number
    try {
      onTitleClock = fameFloorOf(world, now)
    } finally {
      F.seasonHalfLifeWeeks = kept
    }
    expect(onCareerClock).toBeGreaterThan(onTitleClock * 2)
  })
})

describe('round 38 #2c – the two invariants the tail dials may not break', () => {
  it('⚠⚠ retention stays BELOW 1 – it is the whole proof that the top of the shelf cannot move', () => {
    // world/brand.ts#brandReachOf: `max(fame, retention x strength)`. At a running peak strength IS
    // fame, so retention < 1 makes the max resolve to fame there and the best careers are untouched.
    expect(ECONOMY.business.merch.strength.retention).toBeLessThan(1)
    expect(ECONOMY.business.merch.strength.retention).toBeGreaterThan(0)
  })

  it("⚠ the stock's half-life stays LONGER than fame's, or there is no second stock at all", () => {
    expect(ECONOMY.business.merch.strength.halfLifeWeeks).toBeGreaterThan(ECONOMY.fame.halfLifeWeeks)
  })

  it('the floor share is a share of her own peak and stays inside (0, 1)', () => {
    const fs = ECONOMY.business.merch.strength.floorShare
    expect(fs).toBeGreaterThan(0)
    expect(fs).toBeLessThan(1)
  })
})
