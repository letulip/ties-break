import { describe, it, expect } from 'vitest'
import {
  acceptanceRank,
  createWorld,
  enterEvent,
  isTierEligible,
  kidPoints,
  recomputeKidRank,
  tierOpenFor,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// Phase-4 "Season Life" slice 1, increment 2: a POINTS eligibility BAND per tier. A tier is a window
// `[minPoints, maxPoints]` on the kid's EARNED ranking points (her windowed best-6 sum – an absolute
// measure of achievement, NOT a competition position). A fresh (0-point) kid starts at the BOTTOM
// (local only) and climbs local → regional → national as she earns results; a tier graduates her out
// once she is past its ceiling. This replaces the inverted dense-rank model where a point-less kid,
// tied at 0 with the field, collapsed to a HIGH rank and could enter the top tiers immediately.

// RE-PINNED by ladder-up Part B: every tier in the catalogue is playable now (the inert `itf`
// placeholder became the live j30/j60/j300 family), so the ladder invariants below run over all six.
const PLAYABLE: TierId[] = [...TIER_LADDER]

/** Grant the kid a single counting result so her best-6 (== kidPoints) equals `points`. */
function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'local' })
  expect(kidPoints(world, 'domestic')).toBe(points)
}

describe('tier point bands (the tunable thresholds)', () => {
  it('pins the tuned band per tier (local open from 0, national at the top)', () => {
    // ⚠ RE-AIMED by the National stagger: regional's ceiling moved 230 → 250, onto J30's new floor.
    expect(TIERS.local.enterPointBand).toEqual([0, 85])
    expect(TIERS.regional.enterPointBand).toEqual([65, 250])
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
    expect(isTierEligible('regional', 251)).toBe(false) // ⚠ 251 > 250 (ceiling re-aimed onto J30's floor)
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
    expect(kidPoints(world, 'domestic')).toBe(0)
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
    expect(kidPoints(world, 'domestic')).toBe(0)
    enterEvent(world, event.id)
    expect(world.entries).toContain(event.id)
  })
})

describe('upcomingEvents — surfaces eligibility both directions', () => {
  it('a fresh (0-point) kid: local open, regional/national locked (not enough points yet)', () => {
    // ⚠ RE-AIMED by the two ladders (29.07). The claim survives whole - at zero she has Local and
    // nothing else - but the LOCK now comes in two kinds and the label differs with it. A domestic
    // rung (and j30, the on-ramp, which reads her national standing) says "Reach N pts". The rungs
    // above j30 are an acceptance list and say a RANK instead, because a points number she cannot
    // read off her own table would be no help at all.
    const world = createWorld('snap-low')
    expect(kidPoints(world, 'domestic')).toBe(0)
    const upcoming = toSnapshot(world).upcoming
    for (const e of upcoming) {
      if (e.tier === 'local') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
        continue
      }
      expect(e.eligible).toBe(false)
      expect(e.ineligibleReason).toBe('locked')
      if (TIERS[e.tier].enterPct === undefined) {
        expect(e.pointsToEnter).toBe(TIERS[e.tier].enterPointBand[0])
      } else {
        expect(e.rankToEnter).toBe(acceptanceRank(world, e.tier))
      }
    }
  })

  it('a high-point kid: the top rungs open, local/regional outgrown, j300 still out of reach', () => {
    // RE-PINNED by ladder-up Part B: at 700 points she has outgrown local (>85) and regional
    // (>230), national/j30/j60 are all open (their ceilings are the MAX sentinel), and j300 is
    // still LOCKED. That is the ladder working: outgrown below, open in the middle, something
    // still to climb above.
    //
    // ⚠ RE-AIMED by the two ladders (docs/specs/two-ladders.md). TWO THINGS MOVED.
    //   (1) "She has the points for it" is no longer one number. 700 DOMESTIC points buy nothing
    //       international above the j30 on-ramp, so the fixture now gives her an ITF book as well –
    //       a J60 title, a J60 final and a J300 round of 16, 156 points, which is #65 on this seed:
    //       inside j60's top 120 and outside j300's top 50. Without it "the top rungs open" was
    //       simply not a state this world could be in, and the case had nothing left to assert.
    //   (2) j300's lock is no longer a 900-point band – it is an ACCEPTANCE LIST – so the card
    //       carries `rankToEnter` where it used to carry `pointsToEnter` (900). Same verdict, same
    //       rung, stated in the currency she can actually read off her own table.
    // WHAT IS UNCHANGED is the fact this case exists for: the SHAPE of the ladder around her – two
    // rungs outgrown below, three open in the middle, and exactly one still to climb above.
    //
    // ⚠ FIXTURE RE-AIMED AGAIN (30.07, tune/rank-numbers), and ONLY the fixture. The acceptance lists
    // were re-picked - j60 0.40 → 0.50 (top 100 here) and j300 0.25 → 0.40 (top 80) - so the old
    // 156-point book, which put her at #65, is now INSIDE j300's list and the case lost the one state
    // it needs: a rank that sits BETWEEN the two cuts. Her book shrinks to a J60 title plus a J30
    // final (78 points, #86 on this seed), which is 6 clear of j300's cut and 14 clear of j60's.
    //
    // The two assertions below are written against `acceptanceRank` rather than against literals
    // precisely so the next re-pick moves them for free; it is the FIXTURE that has to be re-centred
    // by hand each time, and this note exists so the next person knows that is the job.
    const world = createWorld('snap-top')
    giveKidPoints(world, 700)
    world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'j60' }) // a J60 title
    world.results.push({ playerId: KID_ID, week: world.week, points: 18, tier: 'j30' }) // ...and a J30 final
    recomputeKidRank(world)
    expect(kidPoints(world, 'domestic')).toBe(700)
    expect(world.kidRank).toBeGreaterThan(acceptanceRank(world, 'j300')!) // outside j300's list...
    expect(world.kidRank).toBeLessThanOrEqual(acceptanceRank(world, 'j60')!) // ...and inside j60's
    const upcoming = toSnapshot(world).upcoming
    expect(upcoming.length).toBeGreaterThan(0)
    for (const e of upcoming) {
      // The ENGINE'S OWN gate, not a re-derived one. `isTierEligible` is the DOMESTIC half only –
      // a points band – and j60/j300 no longer have a meaningful one ([0, MAX]), so it would read
      // both as open to anybody with any points at all.
      expect(e.eligible).toBe(tierOpenFor(world, e.tier))
      if (e.tier === 'national' || e.tier === 'j30' || e.tier === 'j60') {
        expect(e.eligible).toBe(true)
        expect(e.ineligibleReason).toBeUndefined()
      } else if (e.tier === 'j300') {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('locked') // #86 – outside the acceptance list, not there yet
        // Derived, not a literal: the card must quote whatever list the tier actually keeps, so this
        // survives the next re-pick instead of pinning today's 80.
        expect(e.rankToEnter).toBe(acceptanceRank(world, 'j300'))
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('outgrown') // 700 is past the ceiling – too good now
      }
    }
  })
})
