import { describe, it, expect } from 'vitest'
import { simulateMatch, fastMatchProbability } from '../../src/engine/match/engine'
import { createScore, awardPoint, contextOf, formatScore } from '../../src/engine/match/scoring'
import { basePServe } from '../../src/engine/match/point'
import type { MatchPlayer, MatchOptions, SetGames } from '../../src/engine/match/types'

// ⚠ `groundstrokes: 50` ON BOTH SIDES BY DEFAULT (v25), and that is not filler - it is what keeps
// every fixture in this file byte-identical. The rally term in `basePServe` multiplies a DIFFERENCE,
// so two players level off the ground contribute exactly zero and no calibration band moves.
function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
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

      // ⚠ RE-AIMED, NOT RELAXED (10.08, the retirement slice). Both claims below were written when
      // the only way to end a match was to win two sets, and both stay asserted verbatim on every
      // match that ends that way. A RETIREMENT ends one without: the last element of `sets` is the
      // set she stopped IN, which is legal tennis in progress and illegal as a finished set (4-2),
      // and the winner has at most one completed set. So the retirement arm asserts the properties a
      // stopped match genuinely has, and they are STRICTER, not weaker – it must be undecided.
      // An UNfinished set can only ever be the last element, and there is at most one of them: she
      // stops in the set she is in. (When she stops at a change of ends there is none at all – the
      // empty set is trimmed – which is why this is read off the SCORE and not off the position.)
      const completed = r.sets.filter(isLegalSet)
      expect(r.sets.length - completed.length, 'at most one unfinished set').toBeLessThanOrEqual(1)
      for (const s of r.sets.slice(0, r.sets.length - 1)) {
        expect(isLegalSet(s), 'only the LAST set may be unfinished').toBe(true)
      }
      const wins = setWins(completed)
      if (r.retired) {
        // Nobody had won it. That is what makes it a retirement rather than a stolen result.
        expect(wins[0], 'a decided match cannot be retired from').toBeLessThanOrEqual(1)
        expect(wins[1], 'a decided match cannot be retired from').toBeLessThanOrEqual(1)
        // The winner is the side that did NOT stop, and the loser is the one who did.
        expect(r.winner).toBe(r.retired.side === 0 ? 1 : 0)
      } else {
        // winner has exactly two completed set wins
        expect(r.sets.length, 'a finished match has no unfinished set').toBe(completed.length)
        expect(wins[r.winner]).toBe(2)
        expect(wins[1 - r.winner]).toBeLessThanOrEqual(1)
      }

      // one log entry per point
      expect(r.totalPoints).toBe(r.log.length)
      expect(r.totalPoints).toBeGreaterThan(0)

      // the final log entry's scoreAfter equals the final match score string
      //
      // ⚠ RE-AIMED, NOT RELAXED (10.08, the retirement slice). On a completed match the last point IS
      // the match, so the two strings are equal and that is still asserted verbatim. A retirement's
      // last point is an ordinary point in an ordinary game, so its `scoreAfter` carries the live
      // game on the end ("7-6 6-7 0-0 15-40") – and the property that survives is the STRONGER one
      // worth having: the sets on the result sheet are a PREFIX of the score at the moment she
      // stopped. That is what makes the truncation honest rather than a rewrite.
      const finalScore = r.sets.map((s) => `${s.a}-${s.b}`).join(' ')
      const lastScore = r.log[r.log.length - 1].scoreAfter
      if (r.retired) expect(lastScore.startsWith(finalScore), `${lastScore} vs ${finalScore}`).toBe(true)
      else expect(lastScore).toBe(finalScore)

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
