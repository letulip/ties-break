// THE LADDER FLOOR – the lower bound is a sorting key, not a wall (owner ruling on backlog #84,
// 06.08; docs/specs/ladder-floor-2026-08.md).
//
// WHAT THIS FILE PROTECTS, and each of the four is a claim that failed on the owner's own save
// before the change (165 of 189 future events blocked, 112 of them `outgrown`, 27 of his 46
// remaining event weeks with nothing enterable on them at all):
//
//   1. THE TWO CEILINGS HAVE ONE CONSEQUENCE. `outgrewTier` (a domestic band's ceiling) and
//      `tierOutgrown` (the sliding window's) must behave identically, or the player meets a gate
//      that cannot be explained. world.ts has demanded this in a comment since 05.08; `hasOutgrown`
//      is where it became a property, and this is where it is a test.
//   2. NEITHER OF THEM REFUSES. A rung she has passed is enterable and SAYS it is passed.
//   3. THE UPPER BOUND IS UNTOUCHED. An acceptance cut is the tour's own rule; a rung she has not
//      reached still refuses her, with the same words.
//   4. THE CALENDAR AND THE TURNSTILE STILL AGREE (R10-5). `tierOpenFor` and `entryStatus` are one
//      rule read at two surfaces; the ceiling had to leave BOTH of them or a rung would be shut on
//      the calendar and open at the door. That is not a hypothetical - the first cut of this change
//      left the domestic ceiling inside `tierFloorOpen` via `isTierEligible`, and the sweep below
//      is what fails when it does.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  entryStatus,
  enterEvent,
  hasOutgrown,
  tierOpenFor,
  tierOutgrown,
  outgrewTier,
  kidPoints,
  recomputeKidRank,
  tickWeek,
  ageAtWeek,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

function injectEvent(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const e: SeasonEvent = {
    id: `floor-${week}-${tier}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** A world with a DOMESTIC book of `points`, which is the currency the domestic bands and the ITF
 *  on-ramp are written in. */
function domesticWorld(seed: string, points: number): WorldState {
  const world = createWorld(seed)
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
  recomputeKidRank(world)
  return world
}

/** ...and one with a PROFESSIONAL book, aged into the W era – the arm where the ceiling is the
 *  sliding window rather than a band. Same shape as the unranked-sentinel suite's `worldAt`. */
function proWorld(seed: string, age: number, book: number): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (ageAtWeek(world.week) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  if (book > 0) world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return world
}

// =================================================================================================
// 1 + 2. THE TWO CEILINGS, ONE CONSEQUENCE – AND THE CONSEQUENCE IS NOT A REFUSAL
// =================================================================================================

describe('the two ceilings are the same event for the player', () => {
  it('the DOMESTIC band ceiling admits her, and says she is past the rung', () => {
    const world = domesticWorld('floor-band', 122) // local's band is [0, 85]
    expect(outgrewTier('local', kidPoints(world, 'domestic')), 'the band ceiling is crossed').toBe(true)
    const ev = injectEvent(world, world.week + 3, 'local')
    const gate = entryStatus(world, ev)
    expect(gate.level, 'the lower bound is a sorting key, not a wall').not.toBe('blocked')
    expect(gate.outgrown).toBe(true)
    expect(() => enterEvent(world, ev.id)).not.toThrow()
    expect(world.entries).toContain(ev.id)
  })

  it('the SLIDING WINDOW ceiling admits her too, and says the same thing', () => {
    // A book that opens W75 closes W15 behind it - the rung three above, `tierOutgrown`'s own rule.
    const world = proWorld('floor-window', 17, 140)
    expect(tierOutgrown(world, 'w15'), 'the window ceiling is crossed').toBe(true)
    const ev = injectEvent(world, world.week + 3, 'w15')
    const gate = entryStatus(world, ev)
    expect(gate.level).not.toBe('blocked')
    expect(gate.outgrown).toBe(true)
    expect(() => enterEvent(world, ev.id)).not.toThrow()
  })

  it('⚠ ONE FUNCTION ANSWERS BOTH – the drift world.ts demands be impossible', () => {
    // The claim is not "both happen to say true today". It is that there is ONE answer: `hasOutgrown`
    // is true exactly when either ceiling is, on every rung of the ladder, at every book. Written as
    // an equivalence so a future arm added to one and not the other fails here.
    for (const [seed, world] of [
      ['band', domesticWorld('floor-eq-band', 122)],
      ['fresh', domesticWorld('floor-eq-fresh', 0)],
      ['deep', domesticWorld('floor-eq-deep', 600)],
      ['pro', proWorld('floor-eq-pro', 17, 140)],
      ['pro-early', proWorld('floor-eq-early', 17, 10)],
    ] as const) {
      for (const tier of TIER_LADDER) {
        const bandTrack = TIERS[tier].track === 'wta' ? 'itf' : 'domestic'
        const either =
          outgrewTier(tier, kidPoints(world, bandTrack)) || tierOutgrown(world, tier)
        expect(hasOutgrown(world, tier), `${seed} / ${tier}`).toBe(either)
      }
    }
  })
})

// =================================================================================================
// 3. THE UPPER BOUND IS THE TOUR'S OWN RULE AND IS UNTOUCHED
// =================================================================================================

describe('the upper bound stays a wall', () => {
  it('a domestic rung below her floor still refuses, with its own words', () => {
    const world = domesticWorld('floor-below', 0)
    const ev = injectEvent(world, world.week + 3, 'national') // floor 150
    const gate = entryStatus(world, ev)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('locked')
    expect(gate.pointsToEnter).toBe(TIERS.national.enterPointBand[0])
    expect(tierOpenFor(world, 'national')).toBe(false)
  })

  it('an acceptance cut she is outside still refuses', () => {
    const world = proWorld('floor-cut', 17, 10) // a ten-point book stands nowhere near #350
    const ev = injectEvent(world, world.week + 3, 'w100')
    const gate = entryStatus(world, ev)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('locked')
    expect(gate.rankToEnter).toBe(TIERS.w100.acceptsRank)
    expect(tierOpenFor(world, 'w100')).toBe(false)
  })

  it('...and outgrowing a rung never opens one above it', () => {
    // The failure this forbids is the mirror of the one the wave fixes: a ceiling that stopped
    // refusing must not become a reason to ADMIT. `hasOutgrown` is a label; it enters nothing.
    const world = proWorld('floor-no-lift', 17, 140)
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(tierOpenFor(world, 'wta125')).toBe(false)
    expect(tierOpenFor(world, 'w100')).toBe(false)
  })
})

// =================================================================================================
// 4. THE CALENDAR AND THE TURNSTILE ARE ONE RULE (R10-5, re-asked for the new shape)
// =================================================================================================

describe('tierOpenFor and entryStatus cannot disagree about a rung', () => {
  // ⚠ THIS IS THE SWEEP THAT CATCHES THE LEAK. Taking the ceiling out of `tierOpenFor` alone leaves
  // the domestic ceiling inside `tierFloorOpen` (it read the WHOLE band through `isTierEligible`),
  // and then Local is shut on the calendar at 86 points while `entryStatus`, which only ever tested
  // the floor, admits her. Both directions are asserted, over the whole domestic band and both
  // ends of the professional one.
  it('a rung the calendar holds open is never refused for a POINT reason at the door', () => {
    const worlds: WorldState[] = [
      ...[0, 40, 86, 122, 200, 260, 400, 600].map((p) => domesticWorld(`sweep-dom-${p}`, p)),
      ...[10, 50, 75, 140, 400].map((b) => proWorld(`sweep-pro-${b}`, 17, b)),
    ]
    let openSeen = 0
    let shutSeen = 0
    for (const world of worlds) {
      for (const tier of TIER_LADDER) {
        const ev = injectEvent(world, world.week + 3, tier)
        const gate = entryStatus(world, ev)
        const pointRefusal = gate.level === 'blocked' && gate.reason === 'locked'
        if (tierOpenFor(world, tier)) {
          openSeen++
          expect(pointRefusal, `w${world.week} ${tier}: the calendar says open, the turnstile says locked`).toBe(false)
        } else {
          shutSeen++
          // The converse: a rung the calendar shuts must refuse at the door for a POINT reason and
          // not merely because she happens to be injured or it is the off-season that week.
          expect(gate.level, `${tier}: the calendar says shut, the turnstile lets her through`).toBe('blocked')
        }
      }
    }
    // ...and the sweep really visited both sides, so a rule that answered one way everywhere would
    // not pass by vacuity.
    expect(openSeen).toBeGreaterThan(20)
    expect(shutSeen).toBeGreaterThan(20)
  })
})

// =================================================================================================
// 5. THE FACT REACHES THE SCREEN, AND THE FEED AND THE STRIP READ IT DIFFERENTLY
// =================================================================================================

describe('the ceiling is carried to the UI as a label, never as a lock', () => {
  it('the snapshot carries a per-rung ceiling beside the per-rung floor', () => {
    const world = proWorld('floor-snap', 17, 140)
    const snap = toSnapshot(world)
    for (const tier of TIER_LADDER) {
      expect(typeof snap.tierOutgrown[tier], tier).toBe('boolean')
      expect(snap.tierOutgrown[tier], tier).toBe(hasOutgrown(world, tier))
    }
    // The one that matters: open AND passed at the same time, which `tierOpen` alone cannot say.
    expect(snap.tierOpen.w15).toBe(true)
    expect(snap.tierOutgrown.w15).toBe(true)
  })

  it('an outgrown card is eligible, carries the flag, and names no ineligible reason', () => {
    const world = domesticWorld('floor-card', 122)
    injectEvent(world, world.week + 3, 'local')
    const up = toSnapshot(world).upcoming.find((e) => e.tier === 'local')!
    expect(up.eligible).toBe(true)
    expect(up.ineligibleReason).toBeUndefined()
    expect(up.outgrown).toBe(true)
  })

  it('the FEED shows the rungs beneath her; the WORKING window does not', () => {
    // Two questions, two answers, and the split is the whole reason `working` exists: a week whose
    // only event is beneath her has to render (that is the defect being fixed), while the Home
    // strip's collapse is about the rungs her career is currently ABOUT.
    const world = proWorld('floor-feed', 17, 140)
    const snap = toSnapshot(world)
    const ctx = feedContext({
      ageYears: snap.ageYears ?? 0,
      tierOpen: snap.tierOpen,
      tierOutgrown: snap.tierOutgrown,
      upcoming: [],
    })
    expect(ctx.rungs).toContain('w15')
    expect(ctx.working).not.toContain('w15')
    expect(ctx.working.every((t) => ctx.rungs.includes(t))).toBe(true)
    // ...and a card on a rung beneath her still renders, which is the point of the whole wave.
    expect(feedShows({ id: 'x', tier: 'w15', entered: false }, ctx)).toBe(true)
  })

  it('the working window never empties, even when every open rung is behind her', () => {
    // "Everything is behind her" and "nothing is hers" are different sentences, and a blank strip
    // says the second one.
    const ctx = feedContext({
      ageYears: 22,
      tierOpen: { local: true, regional: true },
      tierOutgrown: { local: true, regional: true },
      upcoming: [],
    })
    expect(ctx.working).toEqual(['local', 'regional'])
  })

  it('the card still leads with the rung she has NOT passed', () => {
    // «Lead with the more relevant tournament of the week when there is one» – and the rule that
    // expresses it is the LADDER tiebreak, not an outgrown one. See `preferredWeekEvent`'s note for
    // why a "prefer not-outgrown" clause would have been wrong.
    const ev = (tier: TierId) => ({ tier, entered: false, eligible: true, id: tier })
    expect(preferredWeekEvent([ev('local'), ev('w50')])!.tier).toBe('w50')
    expect(preferredWeekEvent([ev('w50'), ev('local')])!.tier).toBe('w50')
    // ...and a week that only carries the rung beneath her still offers it, rather than nothing.
    expect(preferredWeekEvent([ev('local')])!.tier).toBe('local')
  })
})
