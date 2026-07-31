import { describe, it, expect } from 'vitest'
import {
  acceptanceRank,
  createWorld,
  enterEvent,
  entryStatus,
  isTierEligible,
  kidPoints,
  recomputeKidRank,
  tierOpenFor,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { LADDER_POINTS_LABEL } from '../src/shared/protocol'
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
    // ⚠ RE-AIMED 31.07 (fix/ladder-separation), and it is STRICTER than what it replaced. The copy
    // said "ranking points" / "(120 pts)" while the game holds two point tables that never convert
    // into one another, so the sentence was checkable against the wrong number. The assertion now
    // reads the unit out of `LADDER_POINTS_LABEL` rather than spelling it, so it pins that the gate
    // NAMES ITS CURRENCY without freezing which word that currency is called by.
    expect(() => enterEvent(world, event.id)).toThrow(
      `Not enough ${LADDER_POINTS_LABEL.domestic} for ${TIERS.regional.label} yet (need 65)`,
    )
    expect(world.entries).not.toContain(event.id)
  })

  it('rejects a graduated (past-the-ceiling) total with an "outgrown" message', () => {
    const { world, event } = firstEventOfTier('gate-grad', 'local')
    giveKidPoints(world, 120) // 120 > local maxPoints (85)
    // ⚠ RE-AIMED 31.07 (fix/ladder-separation), and it is STRICTER than what it replaced. The copy
    // said "ranking points" / "(120 pts)" while the game holds two point tables that never convert
    // into one another, so the sentence was checkable against the wrong number. The assertion now
    // reads the unit out of `LADDER_POINTS_LABEL` rather than spelling it, so it pins that the gate
    // NAMES ITS CURRENCY without freezing which word that currency is called by.
    expect(() => enterEvent(world, event.id)).toThrow(
      `You've outgrown ${TIERS.local.label} (120 ${LADDER_POINTS_LABEL.domestic})`,
    )
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
      } else if (TIERS[e.tier].track === 'wta') {
        // ⚠ THE THIRD TABLE JOINS THE CASE, AND IT IS A THIRD KIND OF NOT-YET (task #17). Neither of
        // the two arms above fits it: she has not OUTGROWN a W15 (nobody outgrows the professional
        // tour, its ceiling is the MAX sentinel), and it is not the acceptance-list lock J300 wears
        // either - W15 is an ON-RAMP, so it reads her ITF JUNIOR total against a points threshold,
        // exactly as J30 reads her domestic one. Her 78-point junior book is a long way short of the
        // 120 it wants, so the verdict is 'locked' WITH a points number. W35/W100 above it are the
        // acceptance-list kind, quoted in professional rank she does not have yet.
        //
        // This is the shape the whole case is about, one table further on: something outgrown below,
        // something open in the middle, and something still to climb above - and the ladder now has
        // enough above her that the third rung of the third table is barely visible from here.
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('locked')
        if (TIERS[e.tier].enterPct === undefined) {
          expect(e.pointsToEnter).toBe(TIERS[e.tier].enterPointBand[0]) // W15: the ITF on-ramp
        } else {
          expect(e.rankToEnter).toBe(acceptanceRank(world, e.tier)) // W35 / W100: the list
        }
      } else {
        expect(e.eligible).toBe(false)
        expect(e.ineligibleReason).toBe('outgrown') // 700 is past the ceiling – too good now
      }
    }
  })
})

// ---------------------------------------------------------------------------
// THE ON-RAMP IS A THRESHOLD, NOT A STANDING CONDITION (v34).
//
// Owner, 31.07, playing: «бусинка много времени за сезон провела на J серии, побеждая и занимая
// там крутые места, получила global спонсора и возможность w15, но теперь не может играть в J
// серии, потому что ранг в national упал» - and, on the rule: «въезд – это порог, который
// переходят один раз, а не условие, которое держат постоянно».
//
// WHAT WAS WRONG. Both on-ramps are denominated in the table BELOW them (J30 reads her domestic
// best-6, W15 reads her ITF junior best-6) and both of those are ROLLING 52-WEEK windows. So a
// season spent abroad aged out every domestic result and the door she had come through closed
// behind her - the better she did internationally, the more certainly it shut. Measured before the
// fix (tools/j30-onramp-lock.ts, 216 careers): 209 went through the J30 door and were shut out
// again, and 160 of those were locked out of J30 while J60 or J300 stood OPEN.
// ---------------------------------------------------------------------------
describe('an on-ramp she has crossed stays crossed', () => {
  it('J30 survives a season abroad that ages out every domestic point', () => {
    const world = createWorld('onramp-ratchet')
    // She earns the domestic standard the rung asks for, and the door opens.
    giveKidPoints(world, TIERS.j30.enterPointBand[0])
    recomputeKidRank(world)
    expect(tierOpenFor(world, 'j30')).toBe(true)
    expect(world.onRampCleared.itf).toBe(true)

    // A year abroad: the domestic results age out of the rolling window entirely. This is the exact
    // state the owner reported - nothing about her got worse, she simply stopped playing at home.
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    world.week += 60
    recomputeKidRank(world)
    expect(kidPoints(world, 'domestic')).toBe(0)
    expect(tierOpenFor(world, 'j30')).toBe(true)
  })

  it('...and the latch is EARNED - a fresh career is still shut out of it', () => {
    // The other half of the rule, and the one that keeps it a rung rather than a formality: nothing
    // latches for free. A girl who has never cleared the domestic standard has no J30.
    const world = createWorld('onramp-fresh')
    recomputeKidRank(world)
    expect(world.onRampCleared.itf).toBe(false)
    expect(tierOpenFor(world, 'j30')).toBe(false)
  })

  it('a counting result on the table latches it even with the band already decayed', () => {
    // The clause that matters most in practice: she is visibly out there playing J60s while her
    // domestic book reads zero. Being ON the table is stronger evidence than the band that lets you
    // onto it, so it must latch too - otherwise the owner's own save would have had to earn the
    // on-ramp a second time before it could reopen.
    const world = createWorld('onramp-abroad')
    world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'j60' })
    recomputeKidRank(world)
    expect(kidPoints(world, 'domestic')).toBe(0)
    expect(world.onRampCleared.itf).toBe(true)
    expect(tierOpenFor(world, 'j30')).toBe(true)
  })

  it('⚠ ACCEPTANCE LISTS DO NOT LATCH - J300 still wants a rank she holds TODAY', () => {
    // The deliberate limit of the rule, and it is not an oversight. Only the bottom rung of a table
    // is an on-ramp; J60/J300/W35/W100 are acceptance cuts, and a real entry list is never judged on
    // a ranking held two years ago. The latch guarantees a way back ONTO the table. It never
    // guarantees a place in a field.
    const world = createWorld('onramp-acceptance')
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
    recomputeKidRank(world)
    expect(world.onRampCleared.itf).toBe(true)

    // Her international results age out; the on-ramp holds, the acceptance list does not.
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    world.week += 60
    recomputeKidRank(world)
    expect(tierOpenFor(world, 'j30'), 'the on-ramp is hers for good').toBe(true)
    expect(tierOpenFor(world, 'j300'), 'the draw is not').toBe(false)
  })

  it('W15 survives eighteen, which is where this rule earns its keep', () => {
    // ⚠ THE HARDER HALF. The J rungs shut at eighteen on AGE, so from her birthday she cannot earn
    // another junior point however well she plays - and a W15 on-ramp read against a rolling junior
    // window would therefore close on its own a year later with nothing she could do about it. That
    // is a wall across the handover at 19 (task #47), built out of two rules that are each fine
    // alone. Measured before the fix: 188/216 careers had at least one week at 18+ with NOTHING open
    // on either the ITF or the WTA table, median 47 weeks of it.
    const world = createWorld('onramp-eighteen')
    world.results.push({ playerId: KID_ID, week: world.week, points: TIERS.w15.enterPointBand[0], tier: 'j300' })
    recomputeKidRank(world)
    expect(tierOpenFor(world, 'w15')).toBe(true)
    expect(world.onRampCleared.wta).toBe(true)

    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    world.week += 60
    recomputeKidRank(world)
    expect(kidPoints(world, 'itf')).toBe(0)
    expect(tierOpenFor(world, 'w15')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ⚠ ONE RULE, NOT TWO THAT AGREE TODAY.
//
// `tierOpenFor` (what the calendar draws) and `entryStatus` (what `enterEvent` and `advanceWeeks`
// enforce) are two functions answering one question, and this project has now watched them come
// apart TWICE for the same reason - both times because someone taught one arm a new rule and left
// the other reading the old signal:
//   * task #17, when W15 fell into the domestic gate and was refused in the wrong currency;
//   * v34, when the on-ramp started latching in `tierOpenFor` and `entryStatus` went on comparing
//     live points, so the calendar offered a J30 that `enterEvent` then threw on.
// Both times the econ bench crashed on the disagreement mid-sweep, which is a poor substitute for a
// test. This is the test: over every rung, in states that pull the two arms apart, they must return
// the same verdict.
// ---------------------------------------------------------------------------
describe('the calendar and the turnstile never disagree', () => {
  // Each state is chosen to have broken one of the arms at some point in this file's history.
  const STATES: { label: string; apply: (w: WorldState) => void }[] = [
    { label: 'fresh, nothing earned', apply: () => {} },
    {
      label: 'domestic standard met, nothing played abroad',
      apply: (w) => giveKidPoints(w, TIERS.j30.enterPointBand[0]),
    },
    {
      label: 'on the ITF table with the domestic book already decayed',
      apply: (w) => {
        w.results.push({ playerId: KID_ID, week: w.week, points: 300, tier: 'j300' })
      },
    },
    {
      label: 'crossed both on-ramps, then every result aged out',
      apply: (w) => {
        w.results.push({ playerId: KID_ID, week: w.week, points: 300, tier: 'j300' })
        recomputeKidRank(w)
        w.results = w.results.filter((r) => r.playerId !== KID_ID)
        w.week += 60
      },
    },
    { label: 'outgrown the domestic rungs', apply: (w) => giveKidPoints(w, 700) },
  ]

  for (const state of STATES) {
    it(`agrees on every rung – ${state.label}`, () => {
      const world = createWorld(`two-gates-${state.label.length}`)
      state.apply(world)
      recomputeKidRank(world)
      for (const tier of TIER_LADDER) {
        // A synthetic event of this tier, far enough out that no deadline or availability rule can
        // colour the verdict - the ONLY thing under test here is the ranking gate.
        const event: SeasonEvent = {
          id: `probe-${tier}`,
          week: world.week + 6,
          tier,
          surface: 'hard',
          travelCostCents: 0,
          deadlineWeek: world.week + 4,
        }
        const blocked = entryStatus(world, event).level === 'blocked'
        const open = tierOpenFor(world, tier)
        // An event can be blocked for reasons that are not the ranking gate (age caps, exams). What
        // must never happen is the other direction: the calendar saying OPEN on a rung the turnstile
        // refuses on RANKING, which is the state that crashed the bench.
        if (open) {
          const status = entryStatus(world, event)
          expect(
            status.level === 'blocked' && status.reason === 'locked',
            `${tier}: the calendar says open, the turnstile says locked`,
          ).toBe(false)
        } else {
          expect(blocked, `${tier}: the calendar says shut, the turnstile lets her through`).toBe(true)
        }
      }
    })
  }
})
