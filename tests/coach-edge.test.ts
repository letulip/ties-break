import { describe, it, expect } from 'vitest'
import {
  buildCoachRoster,
  coachById,
  coachEdgePlacement,
  coachEdgePp,
  coachRateBandCents,
  coachTierById,
  COACH_EDGE_CORRIDOR_PP,
  HIREABLE_TIERS,
} from '../src/engine/coach'
import { coachMatchEdge, kidMatchPlayerFor, COACH_EDGE_POINTS_PER_PP } from '../src/engine/world/player'
import {
  coachEdgeView,
  coachMarket,
  coachPlaqueLine,
  createWorld,
  hireCoach,
  COACH_EDGE_REVEAL_WEEKS,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

// THE COACH'S EDGE (docs/specs/coach-match-edge.md). While a coach is paid, every match she plays
// carries a small edge - drawn ONCE for that man, off his id, and constant for as long as he is hers.
//
// The four claims this file exists to hold, in the order the design rests on them:
//
//   1. THE CORRIDORS ARE THE SPEC'S (§1) and obey the rule that cut them: each tier's ceiling is the
//      next tier's midpoint, and no tier reaches two rungs up.
//   2. THE DRAW IS UNIFORM INSIDE ITS CORRIDOR AND NEVER OUTSIDE IT, and the 10/17/8% overlap the
//      spec advertises comes out of the actual draw rather than out of the arithmetic on paper.
//   3. IT IS A FACT ABOUT A PERSON: the same id gives the same number across weeks, across her
//      ageing, and across fire-then-rehire. This is the whole design - «этот оказался находкой» has
//      to survive being said about someone.
//   4. `self` IS EXACTLY ZERO AND TAKES THE IDENTICAL CODE PATH IT TOOK BEFORE THIS SHIPPED, which
//      is invariant 4 of the spec and the reason tools/wall-freeze-probe.ts still reports identical
//      hashes for a self-coached career.

/** Every coach id on the market, by rung. Seed-free by construction: `buildCoachRoster` sets
 *  `id: slot.portrait` off the ECONOMY.coach.roster literal, so any seed lists the same sixteen. */
const IDS_BY_TIER: Record<string, string[]> = Object.fromEntries(
  HIREABLE_TIERS.map((t) => [t, buildCoachRoster('any-seed', 14).filter((c) => c.tier === t).map((c) => c.id)]),
)

const seeds = (n: number, prefix = 'edge'): string[] => Array.from({ length: n }, (_, i) => `${prefix}-${i}`)

describe('the corridors are the spec table, and the rule that cut them holds', () => {
  it('is the §1 table, verbatim', () => {
    expect(COACH_EDGE_CORRIDOR_PP.self).toEqual([0, 0])
    expect(COACH_EDGE_CORRIDOR_PP.budget).toEqual([0.2, 0.7])
    expect(COACH_EDGE_CORRIDOR_PP.middle).toEqual([0.5, 0.9])
    expect(COACH_EDGE_CORRIDOR_PP.high).toEqual([0.7, 1.0])
    expect(COACH_EDGE_CORRIDOR_PP.elite).toEqual([0.9, 1.1])
  })

  it("each tier's ceiling is the next tier's midpoint, and no tier reaches two rungs up", () => {
    const mid = (t: CoachTier): number => (COACH_EDGE_CORRIDOR_PP[t][0] + COACH_EDGE_CORRIDOR_PP[t][1]) / 2
    for (let i = 0; i < HIREABLE_TIERS.length - 1; i++) {
      const here = HIREABLE_TIERS[i]
      const next = HIREABLE_TIERS[i + 1]
      // the ceiling reaches the next rung's middle - a cheap coach CAN be the dear one you did not hire
      expect(COACH_EDGE_CORRIDOR_PP[here][1]).toBeGreaterThanOrEqual(mid(next) - 1e-9)
      // ...and no further: it TOUCHES the floor two rungs up and never crosses it. Budget's 0.7 is
      // exactly high's floor and middle's 0.9 is exactly elite's - and since the draw is `< hi`, no
      // budget coach ever actually reaches the weakest high coach. The ladder's rungs overlap with
      // their neighbour and with nobody else.
      const twoUp = HIREABLE_TIERS[i + 2]
      if (twoUp) expect(COACH_EDGE_CORRIDOR_PP[here][1]).toBeLessThanOrEqual(COACH_EDGE_CORRIDOR_PP[twoUp][0])
    }
  })

  it('...and the DRAW never crosses two rungs either, over 400 seeds', () => {
    // The line above is arithmetic on the table; this is the same claim made of the numbers the
    // draw actually produces, which is what a career meets.
    for (let i = 0; i + 2 < HIREABLE_TIERS.length; i++) {
      const here = HIREABLE_TIERS[i]
      const twoUpFloor = COACH_EDGE_CORRIDOR_PP[HIREABLE_TIERS[i + 2]][0]
      for (const seed of seeds(400, 'tworungs')) {
        for (const id of IDS_BY_TIER[here]) {
          expect(coachEdgePp(seed, id), `${here} ${seed}/${id}`).toBeLessThan(twoUpFloor)
        }
      }
    }
  })

  it('narrows as it climbs – a cheap coach is a lottery, an expensive one is not', () => {
    const width = (t: CoachTier): number => COACH_EDGE_CORRIDOR_PP[t][1] - COACH_EDGE_CORRIDOR_PP[t][0]
    for (let i = 0; i < HIREABLE_TIERS.length - 1; i++) {
      expect(width(HIREABLE_TIERS[i])).toBeGreaterThan(width(HIREABLE_TIERS[i + 1]))
    }
  })
})

describe('the draw', () => {
  it('never leaves its corridor, over every coach on 400 seeds', () => {
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      for (const seed of seeds(400)) {
        for (const id of IDS_BY_TIER[tier]) {
          const pp = coachEdgePp(seed, id)
          expect(pp, `${seed}/${id}`).toBeGreaterThanOrEqual(lo)
          expect(pp, `${seed}/${id}`).toBeLessThan(hi)
        }
      }
    }
  })

  it('is uniform inside it – ten equal buckets, none starved, none crowded', () => {
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      const buckets = Array<number>(10).fill(0)
      let n = 0
      for (const seed of seeds(1000)) {
        for (const id of IDS_BY_TIER[tier]) {
          buckets[Math.min(9, Math.floor((10 * (coachEdgePp(seed, id) - lo)) / (hi - lo)))]++
          n++
        }
      }
      // 4000 draws over ten buckets: expected 400 each, sd ~19, so ±25% is ~5 sd - loose enough
      // never to flake, tight enough that a non-uniform draw (or a corridor read off the wrong tier)
      // cannot pass it.
      for (let b = 0; b < 10; b++) {
        expect(buckets[b], `${tier} bucket ${b} of ${n}`).toBeGreaterThan(0.75 * (n / 10))
        expect(buckets[b], `${tier} bucket ${b} of ${n}`).toBeLessThan(1.25 * (n / 10))
      }
    }
  })

  it('produces the overlap odds the spec advertises: 10% / 17% / 8%', () => {
    // "A budget coach beats the middle one you could have hired instead 10% of the time." Measured
    // as the spec means it: every budget coach against every middle coach of the SAME career.
    const overlap = (lower: CoachTier, upper: CoachTier): number => {
      let wins = 0
      let pairs = 0
      for (const seed of seeds(300, 'overlap')) {
        for (const a of IDS_BY_TIER[lower]) {
          for (const b of IDS_BY_TIER[upper]) {
            if (coachEdgePp(seed, a) > coachEdgePp(seed, b)) wins++
            pairs++
          }
        }
      }
      return wins / pairs
    }
    // A sanity check on the corridors, not a precision claim - the tolerance is deliberately wide.
    expect(overlap('budget', 'middle')).toBeGreaterThan(0.06)
    expect(overlap('budget', 'middle')).toBeLessThan(0.14)
    expect(overlap('middle', 'high')).toBeGreaterThan(0.12)
    expect(overlap('middle', 'high')).toBeLessThan(0.22)
    expect(overlap('high', 'elite')).toBeGreaterThan(0.05)
    expect(overlap('high', 'elite')).toBeLessThan(0.12)
  })

  it('cuts into thirds that are equal in width and therefore equal in odds', () => {
    // ⚠ THE CUT IS THE CLAIM (§7). The draw is uniform inside the corridor, so equal WIDTHS are also
    // equal PROBABILITIES: each of the three verdicts comes up one time in three, none of them is
    // the default answer, and no band is rare enough to read as a special event. That is the whole
    // reason the middle band is not widened - scarcity alone would turn the two ends into praise and
    // blame, which is exactly what §7 forbids.
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      const counts: Record<string, number> = { lower: 0, middle: 0, upper: 0 }
      let n = 0
      for (const seed of seeds(1000, 'thirds')) {
        for (const id of IDS_BY_TIER[tier]) {
          const place = coachEdgePlacement(seed, id)!
          // ...and it is a reading of HIS value against HIS corridor, checked here against the
          // arithmetic rather than against the function under test.
          const pp = coachEdgePp(seed, id)
          const third = (hi - lo) / 3
          expect(place, `${seed}/${id} at ${pp}`).toBe(
            pp < lo + third ? 'lower' : pp < lo + 2 * third ? 'middle' : 'upper',
          )
          counts[place]++
          n++
        }
      }
      for (const band of ['lower', 'middle', 'upper']) {
        expect(counts[band] / n, `${tier} ${band} share`).toBeGreaterThan(0.3)
        expect(counts[band] / n, `${tier} ${band} share`).toBeLessThan(0.37)
      }
    }
  })

  it('names no place where there is no band – nobody hired, and a corridor of zero width', () => {
    expect(coachEdgePlacement('x', null)).toBeNull()
    // `self` is [0, 0] by design, and a bench arm zeroes the whole table to build its control.
    expect(coachEdgePlacement('x', 'no-such-coach')).toBeNull()
  })

  it('tells one coach from another at the same rung – a rung is not a price tag', () => {
    for (const tier of HIREABLE_TIERS) {
      let distinct = 0
      let careers = 0
      for (const seed of seeds(200, 'distinct')) {
        const values = IDS_BY_TIER[tier].map((id) => coachEdgePp(seed, id))
        if (new Set(values).size === values.length) distinct++
        careers++
      }
      // Four draws off a continuous uniform: collisions are a measure-zero event, so this is really
      // "the id reaches the draw at all". A key that ignored the coach would score 0.
      expect(distinct / careers, tier).toBeGreaterThan(0.99)
    }
  })
})

describe('it is a fact about a PERSON, which is the whole design', () => {
  it('is the same number at every age – her ageing moves his PRICE, never his number', () => {
    // ⚠ THE EDGE'S OWN HALF OF THIS IS TRUE BY CONSTRUCTION - `coachEdgePp` takes no age, so it
    // cannot vary with one - and a test that just called it twice would be asserting the signature.
    // What is NOT true by construction, and is what the design actually leans on, is the step in
    // front of it: a career resolves her coach through `coachById(seed, ageAtWeek(week), id)`, and
    // THAT is age-dependent. So this walks the real resolution chain across every age band and
    // checks the two halves separately - the same man comes back, and his price genuinely moved
    // underneath him, so the test is not passing because nothing moved.
    const ages = [14, 16, 17, 22, 23, 30]
    for (const seed of seeds(20, 'age')) {
      for (const tier of HIREABLE_TIERS) {
        for (const id of IDS_BY_TIER[tier]) {
          const resolved = ages.map((a) => coachById(seed, a, id))
          for (const c of resolved) expect(c?.id, `${seed}/${id}`).toBe(id)
          // his PRICE moves with her - that is the roster's whole job, and the reason this is a real
          // question rather than a formality
          expect(new Set(resolved.map((c) => c!.rateCents)).size, `${seed}/${id} price`).toBeGreaterThan(1)
          // ...and his edge does not move with it
          expect(new Set(resolved.map((c) => coachEdgePp(seed, c!.id))).size, `${seed}/${id} edge`).toBe(1)
        }
      }
    }
  })

  it('...and the claim `buildCoachRoster` makes to license that is TRUE, checked directly', () => {
    // The design rests on the roster's own note: a coach's IDENTITY and his POSITION in his band are
    // age-independent, so «a coach who is dear for his rung at 14 is dear for it at 22». If this were
    // false the edge would have to be re-derived per age band and the whole shape would be wrong.
    const [devEnd, proEnd] = ECONOMY.coach.ageBandUpper
    const ages = [14, devEnd, devEnd + 1, proEnd, proEnd + 1, 30]
    for (const seed of seeds(40, 'roster')) {
      const rosters = ages.map((a) => buildCoachRoster(seed, a))
      // (a) THE IDS, and their ORDER, are the same list at every age – so a saved id resolves to the
      //     same man for the whole career, which is what the edge is drawn off.
      const ids = rosters[0].map((c) => c.id)
      for (const r of rosters) expect(r.map((c) => c.id)).toEqual(ids)
      // (b) ...and so are the NAMES, which is the other half of "the seed draws who, not when".
      const names = rosters[0].map((c) => c.name)
      for (const r of rosters) expect(r.map((c) => c.name)).toEqual(names)
      // (c) THE POSITION IN THE BAND holds too. The band itself moves under him (that is the price
      //     rising with her age); where he sits INSIDE it does not, to within pickInt's quantisation
      //     over a band ~1200 cents wide.
      for (let i = 0; i < rosters[0].length; i++) {
        const positions = rosters.map((r, ai) => {
          const [lo, hi] = coachRateBandCents(r[i].tier, ages[ai])
          return (r[i].rateCents - lo) / (hi - lo)
        })
        for (const p of positions) expect(Math.abs(p - positions[0])).toBeLessThan(0.005)
      }
    }
  })

  it('survives fire-then-rehire: the man comes back with the number he left with', () => {
    const world = createWorld('rehire-seed', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const him = IDS_BY_TIER.budget[0]
    hireCoach(world, him)
    const first = coachMatchEdge(world)
    expect(first).toBeGreaterThan(0)

    world.week = 40
    hireCoach(world, null) // back on the court herself
    expect(coachMatchEdge(world)).toBe(0)

    world.week = 90
    hireCoach(world, him) // and he is back
    expect(coachMatchEdge(world)).toBe(first)

    // ...and a career that never let him go reads the same number at every week it is asked.
    const steady = createWorld('rehire-seed', { ...DEFAULT_PROFILE, coachTier: 'self' })
    hireCoach(steady, him)
    for (const week of [0, 13, 52, 104, 208]) {
      steady.week = week
      expect(coachMatchEdge(steady)).toBe(first)
    }
  })

  it('leaves with him – a fired coach is not still coaching her', () => {
    const world = createWorld('leaves-seed', DEFAULT_PROFILE)
    expect(world.coachId).not.toBeNull() // DEFAULT_PROFILE opens on a middle coach
    expect(coachMatchEdge(world)).toBeGreaterThan(0)
    hireCoach(world, null)
    // ⚠ AND `profile.coachTier` STILL SAYS 'middle', because onboarding's record is never rewritten.
    // Reading it here instead of the id is precisely the bug this asserts against.
    expect(world.profile.coachTier).toBe('middle')
    expect(coachMatchEdge(world)).toBe(0)
  })
})

describe('percent becomes tennis at the composition point', () => {
  it('reproduces the measured calibration table to under 1% INSIDE the shipped corridors', () => {
    // The anchor table, measured over 1512 sampled states - see COACH_EDGE_POINTS_PER_PP. One
    // constant stands in for all of it, and this is the check that it may.
    const anchors: Array<[number, number]> = [
      [0.45, 0.234],
      [0.65, 0.339],
      [0.85, 0.444],
      [1.05, 0.549],
    ]
    const floor = COACH_EDGE_CORRIDOR_PP.budget[0]
    const ceiling = COACH_EDGE_CORRIDOR_PP.elite[1]
    for (const [pp, measured] of anchors) {
      // every anchor asserted against is one a shipped corridor can actually produce
      expect(pp).toBeGreaterThanOrEqual(floor)
      expect(pp).toBeLessThanOrEqual(ceiling)
      const predicted = pp * COACH_EDGE_POINTS_PER_PP
      expect(Math.abs(predicted - measured) / measured, `${pp} pp`).toBeLessThan(0.01)
    }
  })

  it("...and the 2x anchor is why the spec's claim says INSIDE the corridors", () => {
    // ⚠ THE ONE MEASURED POINT THE CONSTANT DOES NOT HOLD TO 1% is 2.10 pp -> 1.110 (it predicts
    // 1.097, 1.15% low), and it sits at DOUBLE the elite ceiling: it exists in the-wall §M1 only to
    // expose the dose-response curve, and the owner never proposed shipping it. The drift is the
    // linear fit's own curvature showing up outside the range it was fitted over, which is the
    // honest reason the spec bounds its accuracy claim rather than stating it flatly. Pinned so a
    // future widening of the corridors has to come back and re-read this.
    expect(2.1).toBeGreaterThan(COACH_EDGE_CORRIDOR_PP.elite[1])
    const drift = Math.abs(2.1 * COACH_EDGE_POINTS_PER_PP - 1.11) / 1.11
    expect(drift).toBeGreaterThan(0.01)
    expect(drift).toBeLessThan(0.02)
  })

  it('adds exactly pp x 0.5225 to all five wings, and nothing else', () => {
    const hired = createWorld('compose-seed', DEFAULT_PROFILE)
    const self = createWorld('compose-seed', DEFAULT_PROFILE)
    self.coachId = null
    const a = kidMatchPlayerFor(hired, 'hard')
    const b = kidMatchPlayerFor(self, 'hard')
    const edge = coachEdgePp(hired.seed, hired.coachId) * COACH_EDGE_POINTS_PER_PP
    expect(edge).toBeGreaterThan(0)
    for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
      expect(a[k] - b[k]).toBeCloseTo(edge, 10)
    }
    // her age and her name are hers, not the coach's
    expect(a.age).toBe(b.age)
    expect(a.name).toBe(b.name)
  })
})

describe('self is zero, and on the same code path it has always been on', () => {
  it('is EXACTLY zero, not a rounded zero', () => {
    const world = createWorld('self-seed', { ...DEFAULT_PROFILE, coachTier: 'self' })
    expect(world.coachId).toBeNull()
    expect(Object.is(coachMatchEdge(world), 0)).toBe(true)
    expect(coachEdgePp(world.seed, null)).toBe(0)
    // and it returns before the corridor is even read, so nothing a bench does to the table can
    // hand the parent an edge
    expect(coachEdgePp('any', null)).toBe(0)
  })

  it('composes to the same bits with the field, without it, and with it null', () => {
    // ⚠ WHAT THIS CAN AND CANNOT PROVE. The BYTE-IDENTITY of a self-coached career is proved by
    // tools/wall-freeze-probe.ts (208 weeks, sha256 of the serialised world, run before and after
    // this shipped) - no unit test can stand in for that, and `x + 0` is bit-identical to `x` for
    // every positive float anyway, so the early return in `kidMatchPlayerFor` is legibility rather
    // than arithmetic. What IS proved here is the seam a pure caller comes through: a world with no
    // `coachId` key at all, and a world whose `coachId` is null, must compose to the same numbers as
    // each other - which is what the `?? null` default is for and what would break if the edge ever
    // reached for `profile.coachTier` when the id was missing.
    const world = createWorld('self-seed', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const withNull = kidMatchPlayerFor(world, 'clay')
    const { coachId: _drop, ...noCoachField } = world
    const withoutField = kidMatchPlayerFor(noCoachField, 'clay')
    expect(withNull).toEqual(withoutField)
    for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
      expect(Object.is(withNull[k], withoutField[k])).toBe(true)
    }
    // ...and the same holds for a girl whose ONBOARDING said `middle` but who has nobody hired: the
    // profile's rung must not leak into the composition.
    const onboardedMiddle = createWorld('self-seed', DEFAULT_PROFILE)
    onboardedMiddle.coachId = null
    expect(kidMatchPlayerFor(onboardedMiddle, 'clay')).toEqual(withoutField)
  })

  it('spends no MAIN draw, at any rung', () => {
    for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
      const world = createWorld('main-seed', { ...DEFAULT_PROFILE, coachTier: tier })
      const before = { ...world.rngMain }
      kidMatchPlayerFor(world, 'hard')
      coachMatchEdge(world)
      coachEdgeView(world)
      expect(world.rngMain).toEqual(before)
    }
  })
})

describe('what the UI slice reads', () => {
  it('puts the TIER CORRIDOR on every market card, and never the man', () => {
    const world = createWorld('market-seed', DEFAULT_PROFILE)
    const rows = coachMarket(world)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.edgePct).toEqual(COACH_EDGE_CORRIDOR_PP[r.tier])
      // his own number is inside that corridor and is NOT what the card carries - two coaches on the
      // same rung print the same range and play different tennis
      const his = coachEdgePp(world.seed, r.id)
      expect(his).toBeGreaterThanOrEqual(r.edgePct[0])
      expect(his).toBeLessThan(r.edgePct[1])
    }
    const budget = rows.filter((r) => r.tier === 'budget')
    expect(new Set(budget.map((r) => JSON.stringify(r.edgePct))).size).toBe(1)
    expect(new Set(budget.map((r) => coachEdgePp(world.seed, r.id))).size).toBe(budget.length)
  })

  it('withholds where he fell until a full season with her, then says it', () => {
    const world = createWorld('reveal-seed', DEFAULT_PROFILE)
    const him = world.coachId!
    expect(coachEdgeView(world)).toMatchObject({
      corridorPct: COACH_EDGE_CORRIDOR_PP.middle,
      placement: null,
      revealed: false,
      weeksTogether: 0,
      seasonsTogether: 0,
      revealAfterWeeks: COACH_EDGE_REVEAL_WEEKS,
    })

    world.week = COACH_EDGE_REVEAL_WEEKS - 1
    expect(coachEdgeView(world).revealed).toBe(false)
    expect(coachEdgeView(world).placement).toBeNull()

    world.week = COACH_EDGE_REVEAL_WEEKS
    const shown = coachEdgeView(world)
    expect(shown.revealed).toBe(true)
    expect(shown.placement).toBe(coachEdgePlacement(world.seed, him))
    expect(shown.weeksTogether).toBe(COACH_EDGE_REVEAL_WEEKS)
    expect(shown.seasonsTogether).toBe(1)
  })

  /** ⚠ THE SNAPSHOT CARRIES NO NUMBER FOR HIM AT ALL (§7), and that is structural rather than a
   *  matter of discipline. A field the UI can read is a rule the next helpful screen can break; the
   *  engine keeps `coachEdgePp` for the match composition and hands the surface a PLACE. */
  it('offers the UI no per-match figure of his to print', () => {
    const world = createWorld('reveal-seed', DEFAULT_PROFILE)
    world.week = 300
    const view = coachEdgeView(world)
    expect(view.revealed).toBe(true)
    const pp = coachEdgePp(world.seed, world.coachId)
    expect(pp).toBeGreaterThan(0)
    for (const value of Object.values(view)) {
      if (typeof value === 'number') expect(value).not.toBe(pp)
      if (typeof value === 'string') {
        expect(value).not.toContain(pp.toFixed(2))
        expect(value).not.toContain(pp.toFixed(1))
        expect(value, 'no per-match figure in the plaque').not.toMatch(/\+\d+\.\d+%/)
      }
    }
    expect(Object.keys(view)).not.toContain('realisedPct')
  })

  it('re-earns the plaque after a re-hire, and the place behind it does not move', () => {
    const world = createWorld('reveal-seed', DEFAULT_PROFILE)
    const him = world.coachId!
    world.week = 200
    const known = coachEdgeView(world).placement
    expect(known).not.toBeNull()
    // ⚠ FOUR SEASONS IN, THE HEDGE IS GONE - which is what makes the restart below visible.
    expect(coachEdgeView(world).seasonsTogether).toBe(3)
    expect(coachEdgeView(world).plaqueLine).toMatch(/^Season after season – /)

    hireCoach(world, null)
    expect(coachEdgeView(world)).toMatchObject({ corridorPct: [0, 0], placement: null, revealed: false })

    hireCoach(world, him)
    // the clock restarted - "a full season with her" is what the spec says, and it is the
    // conservative direction for the anti-shopping rule
    expect(coachEdgeView(world).revealed).toBe(false)
    world.week = 200 + COACH_EDGE_REVEAL_WEEKS
    const back = coachEdgeView(world)
    expect(back.placement, 'the same man, the same place').toBe(known)
    // ...and the SENTENCE has started over, because the partnership has (§8, ruling 1).
    expect(back.seasonsTogether).toBe(1)
    expect(back.plaqueLine).toMatch(/^A season in – it looks like /)
  })

  it('says nothing at all about a parent on the court', () => {
    const world = createWorld('self-seed', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = 300
    expect(coachEdgeView(world)).toMatchObject({ corridorPct: [0, 0], placement: null, revealed: false })
  })
})

// =================================================================================================
// THE PLAQUE'S NINE SENTENCES (§7 x §8a) – the copy, and the two clocks it answers to
// =================================================================================================
describe('the sentence on the plaque', () => {
  const line = (placement: 'lower' | 'middle' | 'upper' | null, seasonsTogether: number, weeksTogether = 4) =>
    coachPlaqueLine({ placement, seasonsTogether, weeksTogether, revealAfterWeeks: COACH_EDGE_REVEAL_WEEKS })

  it('is the §7/§8a table, verbatim – three places by three bands of certainty', () => {
    expect(line('upper', 1)).toBe('A season in – it looks like the upper end of that band.')
    expect(line('middle', 1)).toBe('A season in – it looks like the middle of that band.')
    expect(line('lower', 1)).toBe('A season in – it looks like the lower end of that band.')

    expect(line('upper', 2)).toBe('Two seasons in, and it holds – the upper end of that band.')
    expect(line('middle', 2)).toBe('Two seasons in, and it holds – the middle of that band.')
    expect(line('lower', 2)).toBe('Two seasons in, and it holds – the lower end of that band.')

    expect(line('upper', 3)).toBe('Season after season – the upper end of that band.')
    expect(line('middle', 3)).toBe('Season after season – the middle of that band.')
    expect(line('lower', 3)).toBe('Season after season – the lower end of that band.')
  })

  it('saturates at the third season and never goes stale', () => {
    // §8a: «by the third the hedge goes» - and then nothing more happens, for the reason §8b gives
    // for its own curve. A counter here would read as a different sentence every year for ever.
    for (const n of [3, 4, 7, 12, 40]) expect(line('upper', n)).toBe(line('upper', 3))
  })

  it('keeps §4a\'s not-yet sentence exactly as it shipped, counter and all', () => {
    expect(line(null, 0, 4)).toBe('Too early to tell where in that band – 4 weeks of 52.')
    // One week is one week - a counter that says "1 weeks" is the tell that nobody read it.
    expect(line(null, 0, 1)).toBe('Too early to tell where in that band – 1 week of 52.')
  })

  it('carries no figure, no praise and no promise about her game, in any of the ten states', () => {
    const all = [
      line(null, 0, 4),
      ...([1, 2, 3] as const).flatMap((s) => (['lower', 'middle', 'upper'] as const).map((p) => line(p, s))),
    ]
    for (const text of all) {
      // A per-match figure for him is the one thing §7 removed; the not-yet counter's bare weeks are
      // a clock and are allowed, so this asks for the FORMAT a value would arrive in.
      expect(text, text).not.toMatch(/[+-]?\d+\.\d+\s*%?/)
      expect(text, text).not.toMatch(/\b(better|worse|best|worst|good|bad|great|poor|value|bargain|lucky)\b/i)
      expect(text, text).not.toMatch(/\b(skills?|radar|her game)\b/i)
      // R15-7: no pronoun names a coach on this screen - the roster puts women on every list by
      // construction, and «his bracket» would print under Sabine Kobayashi.
      expect(text, text).not.toMatch(/\b(he|him|his|she|her|hers)\b/i)
      // Player copy: the short dash, never the long one.
      expect(text).not.toContain('—')
    }
  })

  it('is one frame per band, with the place as its only variable', () => {
    // The owner's constraint, mechanically: a low draw is reported in the SAME WORDS as a high one,
    // so stripping the coordinate must leave three identical sentences.
    for (const seasons of [1, 2, 3]) {
      const frames = (['lower', 'middle', 'upper'] as const).map((p) =>
        line(p, seasons).replace(/the (upper end|middle|lower end) of that band/, 'X'),
      )
      expect(new Set(frames).size, `season ${seasons}`).toBe(1)
    }
  })
})

describe('the rung lookup the whole thing hangs on', () => {
  it('reads the ROSTER, not the id string – `middle-4` is a BUDGET coach', () => {
    expect(coachTierById('middle-4')).toBe('budget')
    expect(COACH_EDGE_CORRIDOR_PP[coachTierById('middle-4')]).toEqual(COACH_EDGE_CORRIDOR_PP.budget)
    const pp = coachEdgePp('tier-seed', 'middle-4')
    expect(pp).toBeGreaterThanOrEqual(0.2)
    expect(pp).toBeLessThan(0.7)
  })

  it('agrees with the roster on all sixteen, at every age band', () => {
    for (const age of [14, 20, 30]) {
      for (const coach of buildCoachRoster('lookup-seed', age)) {
        expect(coachTierById(coach.id)).toBe(coach.tier)
      }
    }
  })

  it('is `self` for nobody and for an id no roster knows – the rung that buys nothing', () => {
    expect(coachTierById(null)).toBe('self')
    expect(coachTierById('no-such-coach')).toBe('self')
    expect(coachEdgePp('x', 'no-such-coach')).toBe(0)
  })
})
