import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import {
  buildCoachRoster,
  coachEdgePlacement,
  coachEdgePp,
  COACH_EDGE_CORRIDOR_PP,
  HIREABLE_TIERS,
} from '../src/engine/coach'
import { coachMatchEdge, kidMatchPlayerFor, COACH_EDGE_POINTS_PER_PP } from '../src/engine/world/player'
import { coachEdgeView, coachTravelsWithHer, createWorld, hireCoach } from '../src/engine/world'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

// ⭐ THE TRAVEL HELPING (docs/specs/coach-travel-2026-08.md §6). Round-21 #2 shipped PRESENCE - he
// goes, the family pays a second fare, three surfaces say so - and she gained nothing by it. The
// owner's sizing of the bonus, 14.08, is the whole design:
//
//   «что если мы привяжем это как раз к тренерской лестнице? у нас там есть уже верхний процент,
//    будет не так сильно влиять как будто.»
//
// So a coach who travels is worth HIS OWN NUMBER AGAIN, and COACH_EDGE_CORRIDOR_PP is the scale.
// The four claims this file exists to hold:
//
//   1. PER TIER, the edge is larger with travel than without - by exactly his own tier's worth, and
//      never by more than that corridor's own top.
//   2. `self` IS ZERO ON BOTH SIDES OF THE SWITCH. Twice nothing is nothing, and the parent in the
//      car is not "travelling with her".
//   3. IT IS `coachTravelsWithHer` AND NOT A SECOND COPY OF IT. player.ts is a leaf and cannot import
//      the predicate; this file is the device that keeps the two answering the same question.
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.

/** Every coach id on the market, by rung – seed-free, exactly as tests/coach-edge.test.ts builds it. */
const IDS_BY_TIER: Record<string, string[]> = Object.fromEntries(
  HIREABLE_TIERS.map((t) => [t, buildCoachRoster('any-seed', 14).filter((c) => c.tier === t).map((c) => c.id)]),
)

const seeds = (n: number, prefix = 'travel'): string[] => Array.from({ length: n }, (_, i) => `${prefix}-${i}`)

const WINGS = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const

describe('a coach who travels is worth his own number again, per tier', () => {
  it('is strictly larger with travel than without, at every rung, for every coach', () => {
    for (const tier of HIREABLE_TIERS) {
      for (const seed of seeds(200)) {
        for (const id of IDS_BY_TIER[tier]) {
          const stays = coachEdgePp(seed, id)
          const travels = coachEdgePp(seed, id, true)
          expect(stays, `${tier} ${seed}/${id}`).toBeGreaterThan(0)
          expect(travels, `${tier} ${seed}/${id}`).toBeGreaterThan(stays)
        }
      }
    }
  })

  it('...and larger by EXACTLY his own number – which is also the proof that no second draw is spent', () => {
    // ⚠ THIS IS THE RNG ASSERTION AS WELL AS THE ARITHMETIC ONE. Exact proportionality to the bit can
    // only come from re-using the SAME uniform: an independent second draw off a second sub-stream
    // would land somewhere else in the corridor and this would fail on the first seed. So "the travel
    // helping spends no draw" is checked here rather than asserted in a comment.
    for (const tier of HIREABLE_TIERS) {
      for (const seed of seeds(200)) {
        for (const id of IDS_BY_TIER[tier]) {
          const stays = coachEdgePp(seed, id)
          expect(coachEdgePp(seed, id, true), `${tier} ${seed}/${id}`).toBe(stays * 2)
          expect(coachEdgePp(seed, id, true) - stays, `${tier} ${seed}/${id}`).toBe(stays)
        }
      }
    }
  })

  it('adds no more than that corridor\'s own top, and no less than its floor', () => {
    // «у нас там есть уже верхний процент» – the bound is the table's, and it is structural rather
    // than a clamp: the helping IS his draw from the bracket, so it cannot leave the bracket.
    for (const tier of HIREABLE_TIERS) {
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
      for (const seed of seeds(200, 'bound')) {
        for (const id of IDS_BY_TIER[tier]) {
          const added = coachEdgePp(seed, id, true) - coachEdgePp(seed, id)
          expect(added, `${tier} ${seed}/${id}`).toBeGreaterThanOrEqual(lo)
          expect(added, `${tier} ${seed}/${id}`).toBeLessThan(hi)
        }
      }
    }
  })

  it('is a LADDER on the road as well as at home – elite adds more than budget, rung by rung', () => {
    // The decision the owner wants to exist: an expensive coach's fare is worth paying and a cheap
    // one's is marginal. Measured as the mean helping per rung, which is the corridor's own midpoint.
    const meanHelping = (tier: CoachTier): number => {
      const vals = seeds(300, 'ladder').flatMap((s) =>
        IDS_BY_TIER[tier].map((id) => coachEdgePp(s, id, true) - coachEdgePp(s, id)),
      )
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }
    const means = HIREABLE_TIERS.map(meanHelping)
    for (let i = 0; i < means.length - 1; i++) {
      expect(means[i], `${HIREABLE_TIERS[i]} vs ${HIREABLE_TIERS[i + 1]}`).toBeLessThan(means[i + 1])
    }
    // ...and the whole thing still fits inside the ladder it is tied to: the dearest helping is under
    // the corridor's top, which is what makes this a re-reading of the table rather than a new dial.
    expect(Math.max(...means)).toBeLessThan(COACH_EDGE_CORRIDOR_PP.elite[1])
  })

  it('SCALES the ladder rather than shifting it, so the budget lottery survives the trip', () => {
    // ⚠ WHY THE OPERATION IS A MULTIPLY. §1's rule - each tier's ceiling is the next tier's midpoint,
    // no tier reaches two rungs up - is a rule about RATIOS, so it is invariant under scaling and is
    // destroyed by a shift. Both halves are checked, because "we chose a multiply" is only a design
    // decision if the alternative would have done something different.
    const doubled = (t: CoachTier): [number, number] => [COACH_EDGE_CORRIDOR_PP[t][0] * 2, COACH_EDGE_CORRIDOR_PP[t][1] * 2]
    for (let i = 0; i + 2 < HIREABLE_TIERS.length; i++) {
      expect(doubled(HIREABLE_TIERS[i])[1]).toBeLessThanOrEqual(doubled(HIREABLE_TIERS[i + 2])[0])
    }
    const spread = (lo: [number, number], hi: [number, number]): number =>
      (hi[0] + hi[1]) / (lo[0] + lo[1])
    const shipped = spread(COACH_EDGE_CORRIDOR_PP.budget, COACH_EDGE_CORRIDOR_PP.elite)
    // the elite rung is worth ~2.2x the budget one, at home and on the road alike
    expect(spread(doubled('budget'), doubled('elite'))).toBeCloseTo(shipped, 10)
    // ...whereas the +3.0 pp SHIFT the spec recommended would have made every rung nearly the same
    // coach, which is the reason that dose could not simply be attached to the switch.
    const shift = (t: CoachTier): [number, number] => [COACH_EDGE_CORRIDOR_PP[t][0] + 3, COACH_EDGE_CORRIDOR_PP[t][1] + 3]
    expect(spread(shift('budget'), shift('elite'))).toBeLessThan(1.3)
  })
})

describe('self is exactly zero on BOTH sides of the switch', () => {
  it('is zero for nobody hired, travelling or not', () => {
    expect(Object.is(coachEdgePp('any', null), 0)).toBe(true)
    expect(Object.is(coachEdgePp('any', null, true), 0), 'twice nothing is nothing').toBe(true)
  })

  it('is zero for a degenerate corridor too – the bench control cannot be handed an edge by the trip', () => {
    // `self` is [0, 0] by design and a bench arm zeroes the whole table; an id no roster knows reads
    // `self` for the same reason.
    expect(Object.is(coachEdgePp('any', 'no-such-coach', true), 0)).toBe(true)
  })

  it('leaves a self-coached career on the code path it has always been on, switch or no switch', () => {
    const off = createWorld('self-travel', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const on = createWorld('self-travel', { ...DEFAULT_PROFILE, coachTier: 'self' })
    on.coachOnEventWeeks = true
    expect(on.coachId).toBeNull()
    expect(coachTravelsWithHer(on), 'nobody to send – so nobody travels').toBe(false)
    expect(Object.is(coachMatchEdge(on), 0)).toBe(true)
    const a = kidMatchPlayerFor(on, 'clay')
    const b = kidMatchPlayerFor(off, 'clay')
    expect(a).toEqual(b)
    for (const k of WINGS) expect(Object.is(a[k], b[k]), k).toBe(true)
  })
})

describe('it IS `coachTravelsWithHer`, not a second copy of it', () => {
  it('doubles exactly when that predicate is true, over all four states of the two clauses', () => {
    // ⚠ THE ANTI-DRIFT DEVICE. player.ts is a leaf and cannot import a predicate that lives in
    // world/coachMarket.ts (which imports the ledger, the ladder and world/sponsors at runtime), so
    // the two clauses are read structurally there and pinned to the predicate HERE. If either side
    // ever grows a third clause, this goes red.
    for (const seed of seeds(25, 'predicate')) {
      for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
        for (const on of [false, true]) {
          const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
          world.coachOnEventWeeks = on
          const base = coachEdgePp(world.seed, world.coachId) * COACH_EDGE_POINTS_PER_PP
          const expected = coachTravelsWithHer(world) ? base * 2 : base
          expect(coachMatchEdge(world), `${seed} ${tier} on=${on}`).toBe(expected)
          expect(coachTravelsWithHer(world), `${seed} ${tier} on=${on}`).toBe(on && tier !== 'self')
        }
      }
    }
  })

  it('follows the coach out of the door and back in, with the switch left on', () => {
    const world = createWorld('leaves-travel', DEFAULT_PROFILE)
    world.coachOnEventWeeks = true
    const him = world.coachId!
    const travelling = coachMatchEdge(world)
    expect(travelling).toBe(coachEdgePp(world.seed, him) * 2 * COACH_EDGE_POINTS_PER_PP)

    hireCoach(world, null)
    expect(world.coachOnEventWeeks, 'the stance is untouched by the firing').toBe(true)
    expect(Object.is(coachMatchEdge(world), 0), 'nobody to send').toBe(true)

    hireCoach(world, him)
    expect(coachMatchEdge(world), 'the same man comes back with the same trip').toBe(travelling)
  })
})

describe('percent becomes tennis – twice, at the same seam', () => {
  it('adds exactly 2 x pp x 0.5225 to all five wings and to nothing else', () => {
    const travels = createWorld('compose-travel', DEFAULT_PROFILE)
    travels.coachOnEventWeeks = true
    const stays = createWorld('compose-travel', DEFAULT_PROFILE)
    const self = createWorld('compose-travel', DEFAULT_PROFILE)
    self.coachId = null

    const a = kidMatchPlayerFor(travels, 'hard')
    const b = kidMatchPlayerFor(stays, 'hard')
    const c = kidMatchPlayerFor(self, 'hard')
    const one = coachEdgePp(travels.seed, travels.coachId) * COACH_EDGE_POINTS_PER_PP
    expect(one).toBeGreaterThan(0)
    for (const k of WINGS) {
      expect(a[k] - c[k], `${k} vs self`).toBeCloseTo(2 * one, 10)
      expect(b[k] - c[k], `${k} vs self, staying`).toBeCloseTo(one, 10)
      expect(a[k] - b[k], `${k} – the helping itself`).toBeCloseTo(one, 10)
    }
    // her age and her name are hers, not the coach's, and not the trip's
    expect(a.age).toBe(c.age)
    expect(a.name).toBe(c.name)
  })

  it('spends no MAIN draw at any rung, with the switch ON', () => {
    for (const tier of ['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]) {
      const world = createWorld('main-travel', { ...DEFAULT_PROFILE, coachTier: tier })
      world.coachOnEventWeeks = true
      const before = { ...world.rngMain }
      kidMatchPlayerFor(world, 'hard')
      coachMatchEdge(world)
      coachEdgeView(world)
      expect(world.rngMain, tier).toEqual(before)
    }
  })

  it('is undefined-safe: a pure caller with no stance composes as a career that does not travel', () => {
    const world = createWorld('pure-travel', DEFAULT_PROFILE)
    world.coachOnEventWeeks = false
    const { coachOnEventWeeks: _drop, ...noStanceField } = world
    const withField = kidMatchPlayerFor(world, 'clay')
    const withoutField = kidMatchPlayerFor(noStanceField, 'clay')
    expect(withField).toEqual(withoutField)
    for (const k of WINGS) expect(Object.is(withField[k], withoutField[k]), k).toBe(true)
  })
})

describe('the plaque is about the MAN, and the trip is not part of who he is', () => {
  it('names the same third of the same corridor whether or not he travels', () => {
    // `coachEdgePlacement` reads his own draw and takes no trip: a coach cannot be a different person
    // at an away tournament. Asserted on the VIEW as well, because that is what a screen reads.
    const stays = createWorld('plaque-travel', DEFAULT_PROFILE)
    const travels = createWorld('plaque-travel', DEFAULT_PROFILE)
    travels.coachOnEventWeeks = true
    stays.week = travels.week = 300
    expect(coachEdgeView(travels)).toEqual(coachEdgeView(stays))
    expect(coachEdgePlacement(travels.seed, travels.coachId)).toBe(coachEdgePlacement(stays.seed, stays.coachId))
    // ⚠ AND THAT IS ALSO A GAP THIS SLICE DELIBERATELY DOES NOT CLOSE: `corridorPct` and the market
    // card's `edgePct` still print the rung's HOME corridor to a family that travels. The engine
    // change is invisible on screen T until the owner rules on the copy - flagged in the spec's §6
    // rather than smuggled in beside a balance change.
    expect(coachEdgeView(travels).corridorPct).toEqual(COACH_EDGE_CORRIDOR_PP.middle)
  })
})

// =================================================================================================
// ⚠⚠ A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL – the invariant-2 claim, as a frozen capture
// =================================================================================================
//
// The three hashes below were measured at commit `2d7d336`, the commit BEFORE the travel helping,
// and they are the same three the changed engine produces: `sha256(JSON.stringify(world))` after 156
// weeks, which is the exact serialisation `compressWorld` feeds gzip, so "identical here" is
// "identical in a save". The two grinder careers hold a hired coach for the whole run with
// `coachOnEventWeeks` FALSE; the player-policy one has the switch ON and nobody to send.
//
// ⚠ THEY ARE A DOCUMENTED MEASUREMENT AND NOT A CHANGE-GATE, in exactly the sense CLAUDE.md's
// invariant 2 gives the frozen MAIN capture: a wave that legitimately moves a career updates them.
// What they may never do is move because of a change to the coach's edge that was supposed to be
// scoped to the trip.
const FROZEN = {
  /** PRESETS[5] · 25k middle family, middle coach · grinder policy (never travels) */
  middleGrinder: '48003a8a0ddd8b2f269923097618b2cae4719ccba8f6c28756a0dc8e0624f43f',
  /** PRESETS[8] · 120k wealthy family, elite coach · grinder policy (never travels) */
  eliteGrinder: '4addc20212f16e24cf441c4b97e84cf69f9953706b66c495db01994e9efd6d5e',
  /** PRESETS[0] · 8k working family, SELF-COACHED · player policy (switch on, nobody to send) */
  selfTravelling: '71d75d524bb97b74414a61a85e46401c8c9466c1b376c54083ab5b8ff77a3b40',
}
const FREEZE_WEEKS = 156

function careerHash(presetIndex: number, policyIndex: number, force?: Partial<{ coachOnEventWeeks: boolean }>): string {
  const { world, rng } = openCareer(PRESETS[presetIndex], 0, POLICIES[policyIndex])
  if (force?.coachOnEventWeeks !== undefined) world.coachOnEventWeeks = force.coachOnEventWeeks
  for (let w = 0; w < FREEZE_WEEKS; w++) stepCareerWeek(world, rng, POLICIES[policyIndex])
  return createHash('sha256').update(JSON.stringify(world)).digest('hex')
}

describe('the byte-identity of a career that does not travel', () => {
  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
  })

  it('MOVES when the same career sends him – so the three pins above are not vacuous', () => {
    // ⚠ THE MUTATION CHECK, and it is what makes this file a test rather than a photograph. The same
    // preset, the same policy, the same seed and the same 156 weeks, with only the stance flipped:
    // if the travel helping were inert the two would hash the same and the pins would be proving
    // nothing. (The fare moves with the switch too, which is the point of the switch - what is
    // isolated to the edge alone is asserted arithmetically further up this file.)
    expect(careerHash(5, 0, { coachOnEventWeeks: true })).not.toBe(FROZEN.middleGrinder)
  })
})
