import { describe, it, expect } from 'vitest'
import { createWorld, enterEvent, isTierEligible, kidPoints, toSnapshot, KID_ID, type WorldState } from '../src/engine/world'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// Phase-4 "Season Life" slice 1, increment 2: a POINTS eligibility BAND per tier. A tier is a window
// `[minPoints, maxPoints]` on the kid's EARNED ranking points (her windowed best-6 sum – an absolute
// measure of achievement, NOT a competition position). A fresh (0-point) kid starts at the BOTTOM
// (local only) and climbs local → regional → national as she earns results; a tier graduates her out
// once she is past its ceiling. This replaces the inverted dense-rank model where a point-less kid,
// tied at 0 with the field, collapsed to a HIGH rank and could enter the top tiers immediately.

const PLAYABLE: TierId[] = ['local', 'regional', 'national'] // itf is never scheduled

/** Grant the kid a single counting result so her best-6 (== kidPoints) equals `points`. */
function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'local' })
  expect(kidPoints(world)).toBe(points)
}

describe('tier point bands (the tunable thresholds)', () => {
  it('pins the tuned band per tier (local open from 0, national at the top)', () => {
    expect(TIERS.local.enterPointBand).toEqual([0, 85])
    expect(TIERS.regional.enterPointBand).toEqual([65, 230])
    expect(TIERS.national.enterPointBand).toEqual([150, Number.MAX_SAFE_INTEGER])
  })
})

describe('isTierEligible — pure points check, both directions', () => {
  it('is true strictly inside a tier band', () => {
    expect(isTierEligible('regional', 150)).toBe(true) // 65 <= 150 <= 230
    expect(isTierEligible('national', 200)).toBe(true) // 200 >= 150
    expect(isTierEligible('local', 40)).toBe(true) // 0 <= 40 <= 85
  })

  it('is false below minPoints (not enough earned yet – locked)', () => {
    expect(isTierEligible('regional', 50)).toBe(false) // 50 < 65
    expect(isTierEligible('national', 100)).toBe(false) // 100 < 150
  })

  it('is false above maxPoints (past the ceiling – outgrown)', () => {
    expect(isTierEligible('local', 100)).toBe(false) // 100 > 85
    expect(isTierEligible('regional', 231)).toBe(false) // 231 > 230
  })

  it('is inclusive at both boundaries', () => {
    for (const tier of PLAYABLE) {
      const [min, max] = TIERS[tier].enterPointBand
      expect(isTierEligible(tier, min)).toBe(true)
      expect(isTierEligible(tier, max)).toBe(true)
      if (min > 0) expect(isTierEligible(tier, min - 1)).toBe(false)
      if (max !== Number.MAX_SAFE_INTEGER) expect(isTierEligible(tier, max + 1)).toBe(false)
    }
  })
})

describe('ladder invariant — every point total keeps at least one tier open', () => {
  it('for every point total 0..1000 at least one playable tier is eligible', () => {
    for (let pts = 0; pts <= 1000; pts++) {
      const open = PLAYABLE.filter((t) => isTierEligible(t, pts))
      expect(open.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('a fresh (0-point) kid starts at the BOTTOM: local only', () => {
    expect(isTierEligible('local', 0)).toBe(true)
    expect(isTierEligible('regional', 0)).toBe(false)
    expect(isTierEligible('national', 0)).toBe(false)
  })

  it('national holds the top (huge points) and local holds the bottom (0 points)', () => {
    expect(isTierEligible('national', 5_000)).toBe(true)
    expect(isTierEligible('local', 0)).toBe(true)
  })
})

describe('overlap windows — two tiers open at once', () => {
  it('has a point total where local AND regional are both eligible', () => {
    expect(isTierEligible('local', 70)).toBe(true) // 0 <= 70 <= 85
    expect(isTierEligible('regional', 70)).toBe(true) // 65 <= 70 <= 230
    expect(isTierEligible('national', 70)).toBe(false) // 70 < 150
  })

  it('has a point total where regional AND national are both eligible', () => {
    expect(isTierEligible('regional', 180)).toBe(true) // 65 <= 180 <= 230
    expect(isTierEligible('national', 180)).toBe(true) // 180 >= 150
    expect(isTierEligible('local', 180)).toBe(false) // 180 > 85
  })
})

// The earliest still-open event of a given tier in a fresh world.
function firstEventOfTier(seed: string, tier: TierId): { world: ReturnType<typeof createWorld>; event: SeasonEvent } {
  const world = createWorld(seed)
  const event = world.season.find((e) => e.tier === tier && e.deadlineWeek >= world.week)
  if (!event) throw new Error(`no ${tier} event in the fresh season for seed ${seed}`)
  return { world, event }
}

describe('enterEvent — points enforcement (direction-aware messages)', () => {
  it('rejects too-few points with a "need <minPoints>" message', () => {
    const { world, event } = firstEventOfTier('gate-low', 'regional')
    // a fresh kid has 0 points, below regional's minPoints (65)
    expect(kidPoints(world)).toBe(0)
    expect(() => enterEvent(world, event.id)).toThrow(
      `Not enough ranking points for ${TIERS.regional.label} yet (need 65)`,
    )
    expect(world.entries).not.toContain(event.id)
  })

  it('rejects a graduated (past-the-ceiling) total with an "outgrown" message', () => {
    const { world, event } = firstEventOfTier('gate-grad', 'local')
    giveKidPoints(world, 120) // 120 > local maxPoints (85)
    expect(() => enterEvent(world, event.id)).toThrow(`You've outgrown ${TIERS.local.label} (120 pts)`)
    expect(world.entries).not.toContain(event.id)
  })

  it('succeeds when the points are inside the band', () => {
    const { world, event } = firstEventOfTier('gate-ok', 'regional')
    giveKidPoints(world, 150) // 65 <= 150 <= 230
    const before = world.fundsCents
    enterEvent(world, event.id)
    expect(world.entries).toContain(event.id)
    expect(world.fundsCents).toBe(before - TIERS.regional.entryFeeCents)
  })

  it('a fresh kid can always enter local (the entry tier, minPoints 0)', () => {
    const { world, event } = firstEventOfTier('gate-fresh', 'local')
    expect(kidPoints(world)).toBe(0)
    enterEvent(world, event.id)
    expect(world.entries).toContain(event.id)
  })
})

describe('upcomingEvents — surfaces eligibility both directions', () => {
  it('a fresh (0-point) kid: local open, regional/national locked (not enough points yet)', () => {
    const world = createWorld('snap-low')
    expect(kidPoints(world)).toBe(0)
    const upcoming = toSnapshot(world).upcoming
    for (const e of upcoming) {
      expect(e.eligible).toBe(isTierEligible(e.tier, 0))
      if (e.tier === 'local') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('locked') // 0 is below minPoints – not there yet
      }
    }
  })

  it('a high-point kid: national open, local/regional locked (outgrown)', () => {
    const world = createWorld('snap-top')
    giveKidPoints(world, 700) // outgrown local (>85) & regional (>230); national opens at 150
    const upcoming = toSnapshot(world).upcoming
    for (const e of upcoming) {
      expect(e.eligible).toBe(isTierEligible(e.tier, 700))
      if (e.tier === 'national') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('outgrown') // 700 is past the ceiling – too good now
      }
    }
  })
})
