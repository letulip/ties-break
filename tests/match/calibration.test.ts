import { describe, it, expect } from 'vitest'
import { simulateMatch, fastMatchProbability } from '../../src/engine/match/engine'
import { basePServe } from '../../src/engine/match/point'
import type { MatchPlayer, MatchOptions, Tour, Surface, MatchResult } from '../../src/engine/match/types'

// All Monte Carlo runs use fixed string seeds, so every number below is deterministic.

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, ...overrides }
}

function baseOpts(over: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 's', ...over }
}

// Regular (non-tiebreak) games in a completed set: a 7-6 set has one tiebreak "game".
function regularGames(sets: MatchResult['sets']): number {
  let g = 0
  for (const s of sets) {
    const isTiebreakSet = (s.a === 7 && s.b === 6) || (s.a === 6 && s.b === 7)
    g += isTiebreakSet ? s.a + s.b - 1 : s.a + s.b
  }
  return g
}

// Hold rate over n mirror matches = holds / service games = 1 - breaks / regularGames.
function holdRate(tour: Tour, surface: Surface, n: number): number {
  const a = player({ id: 'a' })
  const b = player({ id: 'b' })
  let games = 0
  let breaks = 0
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(a, b, baseOpts({ tour, surface, seed: `hold-${tour}-${surface}-${i}` }))
    games += regularGames(r.sets)
    breaks += r.stats[0].breaksWon + r.stats[1].breaksWon
  }
  return 1 - breaks / games
}

// Fraction of matches side A (index 0) wins.
function winRateA(
  a: MatchPlayer,
  b: MatchPlayer,
  n: number,
  over: Partial<MatchOptions>,
  tag: string,
): number {
  let wins = 0
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(a, b, baseOpts({ ...over, seed: `${tag}-${i}` }))
    if (r.winner === 0) wins++
  }
  return wins / n
}

// Large Monte Carlo runs exceed vitest's default 5s per-test timeout; the sizes
// are fixed by the spec, so raise the timeout rather than shrink the samples.
const MC_TIMEOUT = 60000

describe('calibration — service hold rate bands (10k mirror matches)', () => {
  it(
    'ATP hard hold rate is in [0.74, 0.84]',
    () => {
      const hold = holdRate('atp', 'hard', 10000)
      expect(hold).toBeGreaterThanOrEqual(0.74)
      expect(hold).toBeLessThanOrEqual(0.84)
    },
    MC_TIMEOUT,
  )

  it(
    'WTA hard hold rate is in [0.60, 0.72]',
    () => {
      const hold = holdRate('wta', 'hard', 10000)
      expect(hold).toBeGreaterThanOrEqual(0.6)
      expect(hold).toBeLessThanOrEqual(0.72)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — fairness of equal players', () => {
  it(
    'equal players with momentum on win ~50% each over 20k matches',
    () => {
      const rate = winRateA(player({ id: 'a' }), player({ id: 'b' }), 20000, { momentum: true }, 'fair')
      expect(rate).toBeGreaterThanOrEqual(0.48)
      expect(rate).toBeLessThanOrEqual(0.52)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — Monte Carlo tracks the closed form', () => {
  it(
    'MC(50k) match win prob is within 0.015 of pMatchBo3 (base ~ 0.65 vs 0.62)',
    () => {
      // Neutralize the non-iid modifiers so MC estimates the closed form directly:
      // composure 100 (no big-point penalty), equal stamina (fatigue cancels), momentum off.
      const a = player({ id: 'a', serve: 62.5, ret: 50, composure: 100, stamina: 100 })
      const b = player({ id: 'b', serve: 43.75, ret: 50, composure: 100, stamina: 100 })
      const o = baseOpts({ tour: 'atp', surface: 'hard', momentum: false })
      // Confirm the crafted regime.
      expect(basePServe(a, b, o)).toBeCloseTo(0.65, 10)
      expect(basePServe(b, a, o)).toBeCloseTo(0.62, 10)

      const expected = fastMatchProbability(a, b, o) // pMatchBo3(0.65, 0.62)
      const mc = winRateA(a, b, 50000, { tour: 'atp', surface: 'hard', momentum: false }, 'mc')
      expect(Math.abs(mc - expected)).toBeLessThan(0.015)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — momentum is bounded', () => {
  it(
    '|winRate(momentum on) - winRate(momentum off)| < 0.02 for equal players (20k each)',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const on = winRateA(a, b, 20000, { momentum: true }, 'mom')
      const off = winRateA(a, b, 20000, { momentum: false }, 'mom')
      expect(Math.abs(on - off)).toBeLessThan(0.02)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — composure matters but is bounded', () => {
  it(
    'composure 100 vs composure 0 (else mirror 50s) wins in (0.50, 0.60) over 20k',
    () => {
      const composed = player({ id: 'a', composure: 100 })
      const nervy = player({ id: 'b', composure: 0 })
      const rate = winRateA(composed, nervy, 20000, {}, 'comp')
      expect(rate).toBeGreaterThan(0.5)
      expect(rate).toBeLessThan(0.6)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — performance', () => {
  it(
    'runs 10,000 simulateMatch calls in under 3 seconds',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const t0 = performance.now()
      for (let i = 0; i < 10000; i++) {
        simulateMatch(a, b, baseOpts({ tour: 'atp', surface: 'hard', seed: `perf-${i}` }))
      }
      const elapsed = performance.now() - t0
      expect(elapsed).toBeLessThan(3000)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — match length sanity', () => {
  it(
    'mean totalPoints of ATP mirror matches is in [120, 220]',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const n = 3000
      let total = 0
      for (let i = 0; i < n; i++) {
        total += simulateMatch(a, b, baseOpts({ tour: 'atp', surface: 'hard', seed: `len-${i}` })).totalPoints
      }
      const mean = total / n
      expect(mean).toBeGreaterThanOrEqual(120)
      expect(mean).toBeLessThanOrEqual(220)
    },
    MC_TIMEOUT,
  )
})
