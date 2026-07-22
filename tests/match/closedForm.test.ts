import { describe, it, expect } from 'vitest'
import { pGame, pTiebreak, pSet, pMatchBo3 } from '../../src/engine/match/closedForm'

describe('pGame', () => {
  it('matches the reference hold-probability curve within 0.002', () => {
    const refs: [number, number][] = [
      [0.55, 0.623],
      [0.6, 0.736],
      [0.65, 0.83],
      [0.7, 0.901],
      [0.75, 0.949],
    ]
    for (const [p, expected] of refs) {
      expect(Math.abs(pGame(p) - expected)).toBeLessThan(0.002)
    }
  })

  it('is exact at the fixed points', () => {
    expect(pGame(0.5)).toBeCloseTo(0.5, 12)
    expect(pGame(1)).toBeCloseTo(1, 12)
    expect(pGame(0)).toBeCloseTo(0, 12)
  })

  it('is strictly increasing in p', () => {
    let prev = pGame(0.3)
    for (let p = 0.31; p <= 0.9; p += 0.01) {
      const cur = pGame(p)
      expect(cur).toBeGreaterThan(prev)
      prev = cur
    }
  })
})

describe('symmetry (equal players -> 0.5)', () => {
  it('holds for tiebreak, set, and match', () => {
    for (const p of [0.5, 0.55, 0.6, 0.62, 0.7]) {
      expect(pTiebreak(p, p)).toBeCloseTo(0.5, 9)
      expect(pSet(p, p)).toBeCloseTo(0.5, 9)
      expect(pMatchBo3(p, p)).toBeCloseTo(0.5, 9)
    }
  })
})

describe('serve-order independence of the set', () => {
  it('gives the same set probability regardless of first server', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.6, 0.55],
      [0.7, 0.6],
      [0.58, 0.6],
      [0.5, 0.5],
    ]
    for (const [a, b] of pairs) {
      expect(Math.abs(pSet(a, b, 0) - pSet(a, b, 1))).toBeLessThan(1e-9)
    }
  })
})

describe('pMatchBo3 edge amplification', () => {
  it('lands in the research bands', () => {
    const m1 = pMatchBo3(0.65, 0.62)
    expect(m1).toBeGreaterThanOrEqual(0.64)
    expect(m1).toBeLessThanOrEqual(0.655)

    const m2 = pMatchBo3(0.63, 0.62)
    expect(m2).toBeGreaterThanOrEqual(0.545)
    expect(m2).toBeLessThanOrEqual(0.56)

    const m3 = pMatchBo3(0.7, 0.6)
    expect(m3).toBeGreaterThanOrEqual(0.88)
    expect(m3).toBeLessThanOrEqual(0.9)
  })
})

describe('pMatchBo3 monotonicity', () => {
  it('strictly increases in pA and decreases in pB across a grid', () => {
    const grid = [0.5, 0.55, 0.6, 0.62, 0.65, 0.7]
    // increasing pA (fixed pB) strictly increases the match probability
    for (const pB of grid) {
      let prev = pMatchBo3(0.45, pB)
      for (const pA of grid) {
        const cur = pMatchBo3(pA, pB)
        expect(cur).toBeGreaterThan(prev)
        prev = cur
      }
    }
    // increasing pB (fixed pA) strictly decreases the match probability
    for (const pA of grid) {
      let prev = pMatchBo3(pA, 0.45)
      for (const pB of grid) {
        const cur = pMatchBo3(pA, pB)
        expect(cur).toBeLessThan(prev)
        prev = cur
      }
    }
  })
})

describe('pMatchBo3 complement', () => {
  it('the two orientations sum to 1', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.7, 0.6],
      [0.55, 0.5],
      [0.62, 0.63],
    ]
    for (const [a, b] of pairs) {
      expect(pMatchBo3(a, b) + pMatchBo3(b, a)).toBeCloseTo(1, 9)
    }
  })
})
