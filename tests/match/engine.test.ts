import { describe, it, expect } from 'vitest'
import { simulateMatch, fastMatchProbability } from '../../src/engine/match/engine'
import { createScore, awardPoint, contextOf, formatScore } from '../../src/engine/match/scoring'
import { basePServe } from '../../src/engine/match/point'
import type { MatchPlayer, MatchOptions, SetGames } from '../../src/engine/match/types'

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, ...overrides }
}

function opts(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 'seed-0', ...overrides }
}

// Legal completed-set scores in best-of-3 tennis (either orientation).
function isLegalSet(s: SetGames): boolean {
  const hi = Math.max(s.a, s.b)
  const lo = Math.min(s.a, s.b)
  return (hi === 6 && lo <= 4) || (hi === 7 && (lo === 5 || lo === 6))
}

function setWins(sets: SetGames[]): [number, number] {
  const w: [number, number] = [0, 0]
  for (const s of sets) {
    if (s.a > s.b) w[0]++
    else if (s.b > s.a) w[1]++
  }
  return w
}

describe('simulateMatch — determinism', () => {
  it('same players + same seed produce a deep-equal MatchResult (idempotent)', () => {
    const a = player({ id: 'a', name: 'A', serve: 58, ret: 52 })
    const b = player({ id: 'b', name: 'B', serve: 51, ret: 55 })
    const o = opts({ seed: 'determinism-1' })
    const r1 = simulateMatch(a, b, o)
    const r2 = simulateMatch(a, b, o)
    expect(r1).toEqual(r2)
  })

  it('a different seed yields a different point log', () => {
    const a = player({ id: 'a' })
    const b = player({ id: 'b' })
    const r1 = simulateMatch(a, b, opts({ seed: 'seed-A' }))
    const r2 = simulateMatch(a, b, opts({ seed: 'seed-B' }))
    // Two independent RNG streams over ~160 points cannot realistically coincide.
    expect(r1.log).not.toEqual(r2.log)
  })
})

describe('simulateMatch — result integrity', () => {
  const a = player({ id: 'a', name: 'A', serve: 60, ret: 48 })
  const b = player({ id: 'b', name: 'B', serve: 50, ret: 53 })

  it('produces a legal, self-consistent result across many seeds', () => {
    for (let i = 0; i < 40; i++) {
      const r = simulateMatch(a, b, opts({ seed: `integrity-${i}`, tour: i % 2 ? 'wta' : 'atp' }))

      // winner has exactly two completed set wins
      const wins = setWins(r.sets)
      expect(wins[r.winner]).toBe(2)
      expect(wins[1 - r.winner]).toBeLessThanOrEqual(1)

      // every completed set is a legal tennis score
      for (const s of r.sets) expect(isLegalSet(s)).toBe(true)

      // one log entry per point
      expect(r.totalPoints).toBe(r.log.length)
      expect(r.totalPoints).toBeGreaterThan(0)

      // the final log entry's scoreAfter equals the final match score string
      const finalScore = r.sets.map((s) => `${s.a}-${s.b}`).join(' ')
      expect(r.log[r.log.length - 1].scoreAfter).toBe(finalScore)

      // seed echoed back
      expect(r.seed).toBe(`integrity-${i}`)

      // stats consistency
      const [sa, sb] = r.stats
      expect(sa.servePointsWon).toBeLessThanOrEqual(sa.servePointsPlayed)
      expect(sb.servePointsWon).toBeLessThanOrEqual(sb.servePointsPlayed)
      expect(sa.servePointsPlayed + sb.servePointsPlayed).toBe(r.totalPoints)
      expect(sa.pointsWon + sb.pointsWon).toBe(r.totalPoints)
      expect(sa.breakPointsSaved).toBeLessThanOrEqual(sa.breakPointsFaced)
      expect(sb.breakPointsSaved).toBeLessThanOrEqual(sb.breakPointsFaced)
      expect(sa.longestPointStreak).toBeGreaterThan(0)
      expect(sb.longestPointStreak).toBeGreaterThan(0)
    }
  })

  it('winner point totals: the point-log winners agree with per-side pointsWon', () => {
    const r = simulateMatch(a, b, opts({ seed: 'pointsWon-1' }))
    const counted: [number, number] = [0, 0]
    for (const e of r.log) counted[e.winner]++
    expect(counted[0]).toBe(r.stats[0].pointsWon)
    expect(counted[1]).toBe(r.stats[1].pointsWon)
  })
})

describe('simulateMatch — PointContext equivalence to contextOf', () => {
  // The engine gates the (expensive) contextOf probe for performance; this proves
  // the log's context fields are byte-identical to a pure contextOf replay.
  const cases: MatchOptions[] = [
    opts({ seed: 'equiv-hard-atp', tour: 'atp', surface: 'hard' }),
    opts({ seed: 'equiv-clay-wta', tour: 'wta', surface: 'clay' }),
    opts({ seed: 'equiv-grass', tour: 'atp', surface: 'grass', firstServer: 1 }),
    opts({ seed: 'equiv-nomom', tour: 'atp', momentum: false }),
  ]
  const a = player({ id: 'a', serve: 55, ret: 51 })
  const b = player({ id: 'b', serve: 52, ret: 54 })

  for (const o of cases) {
    it(`matches contextOf and formatScore for seed ${o.seed}`, () => {
      const r = simulateMatch(a, b, o)
      const score = createScore(o.firstServer ?? 0)
      for (let i = 0; i < r.log.length; i++) {
        const ref = contextOf(score, i + 1)
        const e = r.log[i]
        expect(e.pointNumber).toBe(i + 1)
        expect(e.server).toBe(ref.server)
        expect(e.tiebreak).toBe(ref.tiebreak)
        expect(e.breakPoint).toBe(ref.breakPoint)
        expect(e.setPointFor).toBe(ref.setPointFor)
        expect(e.matchPointFor).toBe(ref.matchPointFor)
        awardPoint(score, e.winner)
        expect(e.scoreAfter).toBe(formatScore(score))
      }
      expect(score.winner).toBe(r.winner)
    })
  }
})

describe('simulateMatch — pServe bounds and big-point penalty', () => {
  it('every logged pServe is within the final clamp [0.30, 0.90]', () => {
    const a = player({ id: 'a', serve: 100, ret: 0, composure: 0, stamina: 0 })
    const b = player({ id: 'b', serve: 100, ret: 0, composure: 0, stamina: 0 })
    const r = simulateMatch(a, b, opts({ seed: 'bounds-1', surface: 'grass' }))
    for (const e of r.log) {
      expect(e.pServe).toBeGreaterThanOrEqual(0.3)
      expect(e.pServe).toBeLessThanOrEqual(0.9)
    }
  })

  it('break-point entries have server pServe reduced when composure is 0 (momentum off)', () => {
    // Both players composure 0 and equal stamina -> fatigue cancels, momentum off ->
    // on a break point pServe == base - 0.03 exactly, strictly below base otherwise.
    const a = player({ id: 'a', composure: 0, stamina: 50 })
    const b = player({ id: 'b', composure: 0, stamina: 50 })
    const o = opts({ momentum: false })
    const base = basePServe(a, b, o) // identical both directions (mirror skills)
    const bpEntries = []
    for (let i = 0; i < 6; i++) {
      const r = simulateMatch(a, b, opts({ seed: `bp-${i}`, momentum: false }))
      for (const e of r.log) if (e.breakPoint) bpEntries.push(e)
    }
    expect(bpEntries.length).toBeGreaterThan(0)
    for (const e of bpEntries) {
      expect(e.pServe).toBeLessThan(base)
      expect(e.pServe).toBeCloseTo(base - 0.03, 10)
    }
  })
})

describe('fastMatchProbability', () => {
  it('is exactly 0.5 for equal 50-skill players', () => {
    const a = player({ id: 'a' })
    const b = player({ id: 'b' })
    expect(fastMatchProbability(a, b, opts({ tour: 'atp' }))).toBeCloseTo(0.5, 9)
    expect(fastMatchProbability(a, b, opts({ tour: 'wta' }))).toBeCloseTo(0.5, 9)
  })

  it('is symmetric: p(a beats b) + p(b beats a) = 1', () => {
    const a = player({ id: 'a', serve: 62, ret: 49 })
    const b = player({ id: 'b', serve: 51, ret: 55 })
    const o = opts({ surface: 'clay' })
    expect(fastMatchProbability(a, b, o) + fastMatchProbability(b, a, o)).toBeCloseTo(1, 9)
  })

  it('favors the stronger server and uses no RNG (independent of seed)', () => {
    const a = player({ id: 'a', serve: 70 })
    const b = player({ id: 'b', serve: 50 })
    const p1 = fastMatchProbability(a, b, opts({ seed: 'x' }))
    const p2 = fastMatchProbability(a, b, opts({ seed: 'totally-different' }))
    expect(p1).toBe(p2)
    expect(p1).toBeGreaterThan(0.5)
  })
})
