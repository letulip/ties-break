import { describe, it, expect } from 'vitest'
import { basePServe, modifiedPServe, type Streak } from '../../src/engine/match/point'
import type { MatchPlayer, MatchOptions, PointContext } from '../../src/engine/match/types'

// Spec constants (mirrored from point.ts for assertions; not exported by the module).
const SKILL_K = 0.0016
const BASE_MIN = 0.42
const BASE_MAX = 0.82
const FINAL_MIN = 0.3
const FINAL_MAX = 0.9

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, ...overrides }
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
