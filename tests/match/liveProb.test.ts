import { describe, it, expect } from 'vitest'
import { matchWinProbability } from '../../src/engine/match/liveProb'
import { pMatchBo3 } from '../../src/engine/match/closedForm'
import { createScore, awardPoint } from '../../src/engine/match/scoring'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { basePServe } from '../../src/engine/match/point'
import type { MatchScore, MatchPlayer, MatchOptions, Side } from '../../src/engine/match/types'

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, ...overrides }
}
function opts(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 'seed-0', ...overrides }
}

// A fresh in-progress score (server 0, love-all first set).
function freshScore(server: Side = 0): MatchScore {
  return createScore(server)
}

describe('liveProb — required test 1: fresh match equals closed-form Bo3', () => {
  it('equal p -> 0.5 within 1e-9', () => {
    for (const p of [0.5, 0.55, 0.6, 0.62, 0.7]) {
      expect(matchWinProbability(freshScore(), p, p)).toBeCloseTo(0.5, 9)
    }
  })

  it('equals pMatchBo3(pA, pB) within 1e-9 for unequal p (both serve orders)', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.7, 0.6],
      [0.58, 0.63],
      [0.55, 0.5],
      [0.62, 0.63],
    ]
    for (const [pA, pB] of pairs) {
      expect(matchWinProbability(freshScore(0), pA, pB)).toBeCloseTo(pMatchBo3(pA, pB), 9)
      // serve order is irrelevant to the fresh-match probability
      expect(matchWinProbability(freshScore(1), pA, pB)).toBeCloseTo(pMatchBo3(pA, pB), 9)
    }
  })

  it('the two orientations of a fresh match sum to 1', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.7, 0.6],
      [0.55, 0.5],
    ]
    for (const [pA, pB] of pairs) {
      const forward = matchWinProbability(freshScore(), pA, pB)
      const backward = matchWinProbability(freshScore(), pB, pA)
      expect(forward + backward).toBeCloseTo(1, 9)
    }
  })
})

describe('liveProb — required test 2: winProbA after the last point is the indicator', () => {
  it('across 10 matches the final annotated winProbA is exactly 1 or 0', () => {
    const a = player({ id: 'a', name: 'A', serve: 60, ret: 50 })
    const b = player({ id: 'b', name: 'B', serve: 52, ret: 55 })
    for (let i = 0; i < 10; i++) {
      const o = opts({ seed: `final-${i}`, tour: i % 2 ? 'wta' : 'atp' })
      const result = simulateMatch(a, b, o)
      const ann = annotateMatch(result, a, b, o)
      const last = ann.points[ann.points.length - 1]
      expect(last.winProbA).toBe(result.winner === 0 ? 1 : 0)
    }
  })

  it('a decided MatchScore returns exactly 1 or 0 regardless of p', () => {
    const decidedA: MatchScore = {
      sets: [
        { a: 6, b: 4 },
        { a: 6, b: 3 },
      ],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: 0,
    }
    const decidedB: MatchScore = { ...decidedA, sets: [{ a: 4, b: 6 }, { a: 3, b: 6 }], winner: 1 }
    expect(matchWinProbability(decidedA, 0.61, 0.59)).toBe(1)
    expect(matchWinProbability(decidedB, 0.61, 0.59)).toBe(0)
  })
})

describe('liveProb — required test 3: monotone sanity', () => {
  it('holding a match point -> prob > 0.9 for the holder', () => {
    // A won the first set, serving at 5-4, 40-30 in set 2 -> match point for A.
    const matchPointA: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 5, b: 4 }],
      game: { a: 3, b: 2 }, // 40-30, A serving
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(matchPointA, 0.62, 0.62)).toBeGreaterThan(0.9)

    // Mirror: B holds the match point -> A's prob < 0.1.
    const matchPointB: MatchScore = {
      sets: [{ a: 4, b: 6 }, { a: 4, b: 5 }],
      game: { a: 2, b: 3 }, // B serving, 30-40
      inTiebreak: false,
      server: 1,
      winner: null,
    }
    expect(matchWinProbability(matchPointB, 0.62, 0.62)).toBeLessThan(0.1)
  })

  it('down a set at equal p -> prob < 0.5', () => {
    const downASet: MatchScore = {
      sets: [{ a: 4, b: 6 }, { a: 0, b: 0 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(downASet, 0.6, 0.6)).toBeLessThan(0.5)
  })

  it('up a set at equal p -> prob > 0.5 (complement of down a set)', () => {
    const upASet: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 0, b: 0 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(upASet, 0.6, 0.6)).toBeGreaterThan(0.5)
  })

  it('up a break in set 3 at 4-3, equal p -> > 0.5', () => {
    // Decider (one set each). A leads 4-3 having broken once; B serves the 8th game.
    const set3Break: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 4, b: 3 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 1, // B to serve game 8
      winner: null,
    }
    expect(matchWinProbability(set3Break, 0.6, 0.6)).toBeGreaterThan(0.5)
  })

  it('leading in a decider tiebreak at equal p -> > 0.5', () => {
    const tb: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 6 }],
      game: { a: 5, b: 2 }, // TB 5-2 to A
      inTiebreak: true,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(tb, 0.6, 0.6)).toBeGreaterThan(0.5)
  })
})

describe('liveProb — required test 4: never NaN / out of range over real matches', () => {
  it('every annotated winProbA of 20 simulated matches is a finite number in [0, 1]', () => {
    const a = player({ id: 'a', name: 'A', serve: 61, ret: 49 })
    const b = player({ id: 'b', name: 'B', serve: 53, ret: 56 })
    for (let i = 0; i < 20; i++) {
      const surface = (['hard', 'clay', 'grass'] as const)[i % 3]
      const o = opts({ seed: `range-${i}`, surface, tour: i % 2 ? 'wta' : 'atp' })
      const result = simulateMatch(a, b, o)
      const ann = annotateMatch(result, a, b, o)
      for (const pt of ann.points) {
        expect(Number.isFinite(pt.winProbA)).toBe(true)
        expect(pt.winProbA).toBeGreaterThanOrEqual(0)
        expect(pt.winProbA).toBeLessThanOrEqual(1)
      }
    }
  })

  it('directly probes matchWinProbability on every post-point score without NaN', () => {
    const a = player({ id: 'a', serve: 58, ret: 52 })
    const b = player({ id: 'b', serve: 55, ret: 54 })
    const o = opts({ seed: 'probe-1', surface: 'clay' })
    const pA = basePServe(a, b, o)
    const pB = basePServe(b, a, o)
    const result = simulateMatch(a, b, o)
    // Replay to reconstruct each post-point score and probe liveProb directly.
    const score = createScore(o.firstServer ?? 0)
    for (const e of result.log) {
      awardPoint(score, e.winner)
      const v = matchWinProbability(score, pA, pB)
      expect(Number.isFinite(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
