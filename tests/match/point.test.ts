import { describe, it, expect } from 'vitest'
import { basePServe, calibratedPServe, modifiedPServe, nerveAndLegs, type Streak } from '../../src/engine/match/point'
import type { MatchPlayer, MatchOptions, PointContext, Surface, Tour } from '../../src/engine/match/types'

// Spec constants (mirrored from point.ts for assertions; not exported by the module).
const SKILL_K = 0.0016
const BASE_MIN = 0.42
const BASE_MAX = 0.82
const FINAL_MIN = 0.3
const FINAL_MAX = 0.9

// ⚠ `groundstrokes: 50` ON BOTH SIDES BY DEFAULT (v25), and that is not filler - it is what keeps
// every fixture in this file byte-identical. The rally term in `basePServe` multiplies a DIFFERENCE,
// so two players level off the ground contribute exactly zero and no calibration band moves.
function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

function opts(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 's', ...overrides }
}

function ctx(overrides: Partial<PointContext> = {}): PointContext {
  return {
    pointNumber: 1,
    server: 0,
    tiebreak: false,
    breakPoint: false,
    setPointFor: null,
    matchPointFor: null,
    ...overrides,
  }
}

describe('basePServe', () => {
  it('gives tour average for two 50-skill players on hard', () => {
    const a = player()
    const b = player()
    expect(basePServe(a, b, opts({ tour: 'atp', surface: 'hard' }))).toBeCloseTo(0.63, 10)
    expect(basePServe(a, b, opts({ tour: 'wta', surface: 'hard' }))).toBeCloseTo(0.57, 10)
  })

  it('applies surface serve bonus (grass +0.015, clay -0.015)', () => {
    const a = player()
    const b = player()
    expect(basePServe(a, b, opts({ tour: 'atp', surface: 'grass' }))).toBeCloseTo(0.645, 10)
    expect(basePServe(a, b, opts({ tour: 'atp', surface: 'clay' }))).toBeCloseTo(0.615, 10)
    expect(basePServe(a, b, opts({ tour: 'wta', surface: 'grass' }))).toBeCloseTo(0.585, 10)
    expect(basePServe(a, b, opts({ tour: 'wta', surface: 'clay' }))).toBeCloseTo(0.555, 10)
  })

  it('is monotonic in serve and return with symmetric SKILL_K magnitude', () => {
    const o = opts()
    const base = basePServe(player(), player(), o)
    const higherServe = basePServe(player({ serve: 60 }), player(), o)
    const higherRet = basePServe(player(), player({ ret: 60 }), o)
    expect(higherServe).toBeGreaterThan(base)
    expect(higherRet).toBeLessThan(base)
    // per-point slope is exactly SKILL_K in both directions
    const upOne = basePServe(player({ serve: 51 }), player(), o)
    const downOne = basePServe(player(), player({ ret: 51 }), o)
    expect(upOne - base).toBeCloseTo(SKILL_K, 12)
    expect(base - downOne).toBeCloseTo(SKILL_K, 12)
    // symmetric magnitude: +1 serve and +1 opponent return are equal and opposite
    expect(upOne - base).toBeCloseTo(base - downOne, 12)
  })

  it('holds the base clamp at skill extremes', () => {
    const hi = basePServe(player({ serve: 100 }), player({ ret: 0 }), opts())
    const lo = basePServe(player({ serve: 0 }), player({ ret: 100 }), opts())
    expect(hi).toBeGreaterThanOrEqual(BASE_MIN)
    expect(hi).toBeLessThanOrEqual(BASE_MAX)
    expect(lo).toBeGreaterThanOrEqual(BASE_MIN)
    expect(lo).toBeLessThanOrEqual(BASE_MAX)
    // WTA clay with worst serve vs best return drives the raw value below 0.42 -> clamps
    const clamped = basePServe(
      player({ serve: 0 }),
      player({ ret: 100 }),
      opts({ tour: 'wta', surface: 'clay' }),
    )
    expect(clamped).toBeCloseTo(BASE_MIN, 12)
  })
})

// =================================================================================================
// ⭐⭐ THE CALIBRATED CLOSED FORM (round 38, C4) – and the byte-identity that pays for it.
// =================================================================================================
//
// ⚠ THE PROOF IS NOT AN ASSERTION, AND THAT DISTINCTION IS THE WHOLE POINT OF THIS BLOCK. C4 moved
// `fastMatchProbability`, `ratingOf` and the live curve onto `calibratedPServe`, and the promise
// that bought it was: **a pair level in composure AND stamina gets the same number it got before,
// to the last bit.** The right-hand side of every equality below is `basePServe` – the function C4
// did not touch – so what is compared is literally the PRE-C4 formula evaluated live, not a
// remembered constant. `toBe`, never `toBeCloseTo`: `x + 0 === x` for every finite x, so "the same
// number" here means the same IEEE double and nothing weaker.
describe('the calibrated closed form is byte-identical for a pair level in both', () => {
  const SURFACES: Surface[] = ['hard', 'clay', 'grass']
  const TOURS: Tour[] = ['wta', 'atp']

  it('⚠ nerveAndLegs is EXACTLY zero when composure and stamina are level – any build, any pair', () => {
    // Every other attribute deliberately varies: the term must depend on these two ALONE.
    for (const [sa, ra, ga, sb, rb, gb] of [
      [50, 50, 50, 50, 50, 50],
      [88, 46, 64, 48, 66, 57],
      [0, 100, 0, 100, 0, 100],
      [62.5, 50, 50, 43.75, 50, 50], // the calibration file's own MC fixture
    ] as const) {
      const a = player({ id: 'a', serve: sa, ret: ra, groundstrokes: ga, composure: 61, stamina: 58, age: 21.2 })
      const b = player({ id: 'b', serve: sb, ret: rb, groundstrokes: gb, composure: 61, stamina: 58, age: 13.1 })
      expect(nerveAndLegs(a, b)).toBe(0)
      expect(nerveAndLegs(b, a)).toBe(0)
    }
  })

  it('⚠ calibratedPServe === basePServe for a level pair, on every surface and both tours', () => {
    for (const surface of SURFACES) {
      for (const tour of TOURS) {
        for (const [sa, ra, ga, sb, rb, gb] of [
          [50, 50, 50, 50, 50, 50],
          [71, 44, 50, 50, 50, 50],
          [88, 46, 64, 48, 66, 57],
          [0, 100, 50, 100, 0, 50], // both clamps
        ] as const) {
          for (const [c, s] of [
            [50, 50],
            [100, 100],
            [0, 0],
            [61, 58],
          ] as const) {
            const a = player({ id: 'a', serve: sa, ret: ra, groundstrokes: ga, composure: c, stamina: s })
            const b = player({ id: 'b', serve: sb, ret: rb, groundstrokes: gb, composure: c, stamina: s })
            const o = opts({ surface, tour })
            expect(calibratedPServe(a, b, o), `${surface}/${tour} ${sa}v${sb} c${c} s${s}`).toBe(basePServe(a, b, o))
            expect(calibratedPServe(b, a, o)).toBe(basePServe(b, a, o))
          }
        }
      }
    }
  })

  it('⚠ MUTATION-VERIFIED: a LEVEL-shaped term would break that identity, a DIFFERENCE cannot', () => {
    // The counterfactual C4 rejected: a term reading the server's composure/stamina against 50
    // rather than against the receiver's. It is non-zero for a level pair at anything but 50, which
    // is precisely why the shipped shape is a difference. If this block ever goes green with the
    // shipped term, the term has stopped being a difference.
    const a = player({ id: 'a', composure: 90, stamina: 90 })
    const b = player({ id: 'b', composure: 90, stamina: 90 })
    const levelShaped = (p: MatchPlayer): number => (p.composure - 50) * 2.2e-5 + (p.stamina - 50) * 7.0e-5
    expect(levelShaped(a)).not.toBe(0)
    expect(nerveAndLegs(a, b)).toBe(0)
  })

  it('reads composure and stamina, and only as a difference', () => {
    const o = opts({ tour: 'wta' })
    const flat = player({ id: 'a' })
    const composed = player({ id: 'a', composure: 80 })
    const strong = player({ id: 'a', stamina: 90 })
    const weak = player({ id: 'b', composure: 30, stamina: 30 })
    expect(calibratedPServe(composed, weak, o)).toBeGreaterThan(calibratedPServe(flat, weak, o))
    expect(calibratedPServe(strong, weak, o)).toBeGreaterThan(calibratedPServe(flat, weak, o))
    // ...and stamina is the heavier of the two, because the loop spends it through three channels
    // (per-point fatigue on her serve, on his, and the retirement hazard) against nerve's one.
    const perComposurePoint = calibratedPServe(player({ composure: 51 }), player(), o) - calibratedPServe(player(), player(), o)
    const perStaminaPoint = calibratedPServe(player({ stamina: 51 }), player(), o) - calibratedPServe(player(), player(), o)
    expect(perComposurePoint).toBeCloseTo(2.2e-5, 12)
    expect(perStaminaPoint).toBeCloseTo(7.0e-5, 12)
    // ⚠ AND BOTH ARE STILL BELOW THE SERVE, which is the same ordering RALLY_K is held to: the serve
    // is the most valuable shot in tennis and no calibration term may quietly outrank it.
    expect(perStaminaPoint).toBeLessThan(SKILL_K)
  })

  it('the base clamp still holds at the extremes', () => {
    const o = opts({ tour: 'wta', surface: 'clay' })
    const hi = calibratedPServe(player({ serve: 100, composure: 100, stamina: 100 }), player({ ret: 0, composure: 0, stamina: 0 }), o)
    const lo = calibratedPServe(player({ serve: 0, composure: 0, stamina: 0 }), player({ ret: 100, composure: 100, stamina: 100 }), o)
    expect(hi).toBeLessThanOrEqual(BASE_MAX)
    expect(lo).toBeGreaterThanOrEqual(BASE_MIN)
  })
})

describe('modifiedPServe', () => {
  it('leaves base untouched when no modifier applies', () => {
    const p = modifiedPServe(0.63, player(), player(), ctx(), null)
    expect(p).toBeCloseTo(0.63, 12)
  })

  it('applies the big-point (break-point) penalty scaled by composure', () => {
    const bp = ctx({ breakPoint: true })
    // composure 100 -> no penalty
    expect(modifiedPServe(0.63, player({ composure: 100 }), player(), bp, null)).toBeCloseTo(0.63, 12)
    // composure 0 -> exactly 0.03 off on a break point
    expect(modifiedPServe(0.63, player({ composure: 0 }), player(), bp, null)).toBeCloseTo(0.6, 12)
    // no penalty when it is not a break point
    expect(modifiedPServe(0.63, player({ composure: 0 }), player(), ctx(), null)).toBeCloseTo(0.63, 12)
  })

  it('applies momentum only for streaks of length >= 3, directed by streak side', () => {
    const server = player()
    const receiver = player()
    const c = ctx({ server: 0 })
    const shortStreak: Streak = { side: 0, length: 2 }
    const forStreak: Streak = { side: 0, length: 3 }
    const againstStreak: Streak = { side: 1, length: 3 }
    expect(modifiedPServe(0.63, server, receiver, c, shortStreak)).toBeCloseTo(0.63, 12)
    expect(modifiedPServe(0.63, server, receiver, c, forStreak)).toBeCloseTo(0.645, 12)
    expect(modifiedPServe(0.63, server, receiver, c, againstStreak)).toBeCloseTo(0.615, 12)
  })

  it('handles fatigue only past the start point, symmetric across stamina', () => {
    const c120 = ctx({ pointNumber: 120 })
    const c220 = ctx({ pointNumber: 220 })
    // no fatigue exactly at the start point
    expect(modifiedPServe(0.63, player({ stamina: 0 }), player({ stamina: 100 }), c120, null)).toBeCloseTo(0.63, 12)
    // both sides equally exhausted -> server penalty and receiver bonus cancel
    expect(modifiedPServe(0.63, player({ stamina: 0 }), player({ stamina: 0 }), c220, null)).toBeCloseTo(0.63, 12)
    // tired server vs fresh receiver -> full -0.03 at point 220
    expect(modifiedPServe(0.63, player({ stamina: 0 }), player({ stamina: 100 }), c220, null)).toBeCloseTo(0.6, 12)
    // fresh server vs tired receiver -> +0.03
    expect(modifiedPServe(0.63, player({ stamina: 100 }), player({ stamina: 0 }), c220, null)).toBeCloseTo(0.66, 12)
  })

  it('caps fatigue at FATIGUE_CAP for very long matches', () => {
    const cLate = ctx({ pointNumber: 600 })
    // raw fatigue term would be (600-120)*0.0003 = 0.144, capped to 0.03
    expect(modifiedPServe(0.63, player({ stamina: 0 }), player({ stamina: 100 }), cLate, null)).toBeCloseTo(0.6, 12)
  })

  it('keeps the result inside the final clamp under pathological stacking', () => {
    const bp220 = ctx({ breakPoint: true, pointNumber: 220, server: 0 })
    const against: Streak = { side: 1, length: 5 }
    // stack every downward modifier on a low base
    const low = modifiedPServe(0.31, player({ composure: 0, stamina: 0 }), player({ stamina: 100 }), bp220, against)
    expect(low).toBeGreaterThanOrEqual(FINAL_MIN)
    expect(low).toBeLessThanOrEqual(FINAL_MAX)
    // an out-of-range base is clamped even with no modifiers
    expect(modifiedPServe(0.05, player(), player(), ctx(), null)).toBeCloseTo(FINAL_MIN, 12)
    expect(modifiedPServe(0.99, player(), player(), ctx(), null)).toBeCloseTo(FINAL_MAX, 12)
    // a high base plus upward momentum still cannot exceed the ceiling
    const forStreak: Streak = { side: 0, length: 5 }
    const high = modifiedPServe(0.9, player(), player(), ctx({ server: 0 }), forStreak)
    expect(high).toBeLessThanOrEqual(FINAL_MAX)
    expect(high).toBeGreaterThanOrEqual(FINAL_MIN)
  })
})
