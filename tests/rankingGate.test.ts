import { describe, it, expect } from 'vitest'
import { createWorld, enterEvent, isTierEligible, toSnapshot } from '../src/engine/world'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// Phase-4 "Season Life" slice 1: a ranking eligibility BAND per tier. A tier is a window
// `[bestRank, worstRank]` on the kid's dense rank (1 = best): a tier opens once the kid is good
// enough (kidRank <= worstRank) and graduates her out once she's too good (kidRank < bestRank).

const PLAYABLE: TierId[] = ['local', 'regional', 'national'] // itf is never scheduled

describe('tier ranking bands (the tunable thresholds)', () => {
  it('pins the provisional band per tier (local open at the bottom, national at the top)', () => {
    expect(TIERS.local.enterRankBand).toEqual([41, Number.MAX_SAFE_INTEGER])
    expect(TIERS.regional.enterRankBand).toEqual([11, 130])
    expect(TIERS.national.enterRankBand).toEqual([1, 40])
  })
})

describe('isTierEligible — pure rank check, both directions', () => {
  it('is true strictly inside a tier band', () => {
    expect(isTierEligible('regional', 50)).toBe(true) // 11 <= 50 <= 130
    expect(isTierEligible('national', 20)).toBe(true)
    expect(isTierEligible('local', 200)).toBe(true) // open bottom
  })

  it('is false below bestRank (too good – graduated out)', () => {
    expect(isTierEligible('local', 40)).toBe(false) // 40 < 41
    expect(isTierEligible('regional', 10)).toBe(false) // 10 < 11
  })

  it('is false above worstRank (not good enough yet)', () => {
    expect(isTierEligible('regional', 131)).toBe(false) // 131 > 130
    expect(isTierEligible('national', 41)).toBe(false) // 41 > 40
  })

  it('is inclusive at both boundaries', () => {
    for (const tier of PLAYABLE) {
      const [best, worst] = TIERS[tier].enterRankBand
      expect(isTierEligible(tier, best)).toBe(true)
      expect(isTierEligible(tier, worst)).toBe(true)
      expect(isTierEligible(tier, best - 1)).toBe(false)
      if (worst !== Number.MAX_SAFE_INTEGER) expect(isTierEligible(tier, worst + 1)).toBe(false)
    }
  })
})

describe('ladder invariant — every rank keeps at least one tier open', () => {
  it('for every rank 1..(cohort.length + 1) at least one playable tier is eligible', () => {
    const cohortLen = createWorld('ladder').cohort.length
    for (let rank = 1; rank <= cohortLen + 1; rank++) {
      const open = PLAYABLE.filter((t) => isTierEligible(t, rank))
      expect(open.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('national holds the top (rank 1) and local holds the bottom (worst rank)', () => {
    expect(isTierEligible('national', 1)).toBe(true)
    expect(isTierEligible('local', 5_000)).toBe(true)
  })
})

describe('overlap windows — two tiers open at once', () => {
  it('has a rank where local AND regional are both eligible', () => {
    expect(isTierEligible('local', 100)).toBe(true)
    expect(isTierEligible('regional', 100)).toBe(true)
    expect(isTierEligible('national', 100)).toBe(false)
  })

  it('has a rank where regional AND national are both eligible', () => {
    expect(isTierEligible('regional', 20)).toBe(true)
    expect(isTierEligible('national', 20)).toBe(true)
    expect(isTierEligible('local', 20)).toBe(false)
  })
})

// The earliest still-open event of a given tier in a fresh world.
function firstEventOfTier(seed: string, tier: TierId): { world: ReturnType<typeof createWorld>; event: SeasonEvent } {
  const world = createWorld(seed)
  const event = world.season.find((e) => e.tier === tier && e.deadlineWeek >= world.week)
  if (!event) throw new Error(`no ${tier} event in the fresh season for seed ${seed}`)
  return { world, event }
}

describe('enterEvent — ranking enforcement (direction-aware messages)', () => {
  it('rejects a too-low rank with a "reach #<worstRank>" message', () => {
    const { world, event } = firstEventOfTier('gate-low', 'regional')
    world.kidRank = 200 // 200 > regional worstRank (130)
    expect(() => enterEvent(world, event.id)).toThrow(
      `Not ranked high enough for ${TIERS.regional.label} (reach #130)`,
    )
    expect(world.entries).not.toContain(event.id)
  })

  it('rejects a graduated (too-good) rank with an "outgrown" message', () => {
    const { world, event } = firstEventOfTier('gate-grad', 'local')
    world.kidRank = 5 // 5 < local bestRank (41)
    expect(() => enterEvent(world, event.id)).toThrow(`You've outgrown ${TIERS.local.label} (rank #5)`)
    expect(world.entries).not.toContain(event.id)
  })

  it('succeeds when the rank is inside the band', () => {
    const { world, event } = firstEventOfTier('gate-ok', 'local')
    world.kidRank = 100 // 41 <= 100 <= ∞
    const before = world.fundsCents
    enterEvent(world, event.id)
    expect(world.entries).toContain(event.id)
    expect(world.fundsCents).toBe(before - TIERS.local.entryFeeCents)
  })
})

describe('upcomingEvents — surfaces eligibility both directions', () => {
  it('a low-ranked kid: local open, regional/national locked (reach the band)', () => {
    const world = createWorld('snap-low')
    world.kidRank = 200
    const upcoming = toSnapshot(world).upcoming
    for (const e of upcoming) {
      expect(e.eligible).toBe(isTierEligible(e.tier, 200))
      if (e.tier === 'local') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('locked') // 200 is above the worstRank – not there yet
      }
    }
  })

  it('a top-ranked kid: national open, local/regional locked (outgrown)', () => {
    const world = createWorld('snap-top')
    world.kidRank = 5
    const upcoming = toSnapshot(world).upcoming
    for (const e of upcoming) {
      expect(e.eligible).toBe(isTierEligible(e.tier, 5))
      if (e.tier === 'national') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('outgrown') // 5 is below the bestRank – too good now
      }
    }
  })
})
