import { describe, it, expect } from 'vitest'
import { computeRanking, windowedBestSum, type SeasonResult } from '../../src/engine/season/ranking'
import { rankingDeltaSuffix } from '../../src/engine/world'

function r(playerId: string, week: number, points: number): SeasonResult {
  return { playerId, week, points }
}

describe('computeRanking — rolling 52-week window', () => {
  it('keeps a week-1 result at week 53 and drops it at week 54', () => {
    const results = [r('a', 1, 30)]
    expect(computeRanking(results, 53).find((x) => x.playerId === 'a')?.points).toBe(30)
    expect(computeRanking(results, 54).find((x) => x.playerId === 'a')?.points).toBe(0)
  })

  it('ignores results in the future relative to currentWeek', () => {
    const results = [r('a', 10, 30)]
    expect(computeRanking(results, 5).find((x) => x.playerId === 'a')?.points).toBe(0)
  })
})

describe('computeRanking — best 6 of the window', () => {
  it('sums the best six results, ignoring the weakest when there are seven', () => {
    const results = [10, 20, 30, 40, 50, 60, 70].map((p, i) => r('a', 2 + i, p))
    const row = computeRanking(results, 20).find((x) => x.playerId === 'a')
    expect(row?.points).toBe(20 + 30 + 40 + 50 + 60 + 70) // weakest (10) dropped
  })
})

describe('computeRanking — tie-break by recency', () => {
  it('ranks equal-point players by the more recent best result, sharing the dense rank', () => {
    const results = [r('x', 40, 50), r('y', 45, 50)]
    const ranking = computeRanking(results, 50)
    const x = ranking.find((v) => v.playerId === 'x')!
    const y = ranking.find((v) => v.playerId === 'y')!
    expect(x.points).toBe(50)
    expect(y.points).toBe(50)
    expect(x.rank).toBe(y.rank) // dense: equal points → equal rank
    // more recent (y, week 45) is listed before x (week 40)
    expect(ranking.findIndex((v) => v.playerId === 'y')).toBeLessThan(
      ranking.findIndex((v) => v.playerId === 'x'),
    )
  })
})

describe('computeRanking — dense ranks', () => {
  it('assigns dense ranks (equal points share a rank, next distinct is +1)', () => {
    const results = [r('a', 3, 30), r('b', 3, 30), r('c', 3, 10)]
    const ranking = computeRanking(results, 5)
    const rankOf = (id: string) => ranking.find((v) => v.playerId === id)!.rank
    expect(rankOf('a')).toBe(1)
    expect(rankOf('b')).toBe(1)
    expect(rankOf('c')).toBe(2) // dense, not 3
  })
})

describe('computeRanking — totality over a roster', () => {
  it('includes every roster member, zero-point players after pointed ones in stable order', () => {
    const roster = ['a', 'b', 'c', 'kid']
    const results = [r('a', 4, 30), r('b', 4, 10)]
    const ranking = computeRanking(results, 6, roster)
    expect(ranking.map((v) => v.playerId).sort()).toEqual(['a', 'b', 'c', 'kid'])
    const rankOf = (id: string) => ranking.find((v) => v.playerId === id)!.rank
    expect(rankOf('a')).toBe(1)
    expect(rankOf('b')).toBe(2)
    expect(rankOf('c')).toBe(3)
    expect(rankOf('kid')).toBe(3) // both zero-point → same dense rank
    // stable order among zero-point players: c before kid (roster order)
    expect(ranking.findIndex((v) => v.playerId === 'c')).toBeLessThan(
      ranking.findIndex((v) => v.playerId === 'kid'),
    )
  })

  it('is pure — does not mutate the results array', () => {
    const results = [r('a', 4, 30), r('b', 4, 10)]
    const snapshot = JSON.stringify(results)
    computeRanking(results, 6, ['a', 'b'])
    expect(JSON.stringify(results)).toBe(snapshot)
  })

  it('ranks are contiguous from 1 (dense) across a full roster', () => {
    const roster = ['a', 'b', 'c', 'd', 'e']
    const results = [r('a', 4, 30), r('b', 4, 20), r('c', 4, 20), r('d', 4, 5)]
    const ranking = computeRanking(results, 6, roster)
    const ranks = ranking.map((v) => v.rank)
    // dense: 1 (a=30), 2,2 (b,c=20), 3 (d=5), 4 (e=0)
    expect(ranks).toEqual([1, 2, 2, 3, 4])
    // e (zero points) is last
    expect(ranking[ranking.length - 1].playerId).toBe('e')
  })
})

// --- round-5 item 1: ranking transparency ------------------------------------
describe('windowedBestSum — the value the standings show', () => {
  it('equals the player points computeRanking assigns (sum shown = standings points)', () => {
    const results = [10, 20, 30, 40, 50, 60, 70].map((p, i) => r('a', 2 + i, p))
    const standingsPoints = computeRanking(results, 20).find((x) => x.playerId === 'a')!.points
    expect(windowedBestSum(results, 20, 'a')).toBe(standingsPoints)
    expect(windowedBestSum(results, 20, 'a')).toBe(20 + 30 + 40 + 50 + 60 + 70) // weakest (10) dropped
  })

  it('respects the 52-week window (drops a result that ages out)', () => {
    const results = [r('a', 1, 30)]
    expect(windowedBestSum(results, 53, 'a')).toBe(30)
    expect(windowedBestSum(results, 54, 'a')).toBe(0)
  })

  it('is zero for a player with no counted results', () => {
    expect(windowedBestSum([r('a', 4, 30)], 6, 'kid')).toBe(0)
  })
})

describe("owner's ranking scenarios — effective delta of a new result", () => {
  // Six existing counted results; the weakest is 15. computeRanking counts all six.
  const six = () => [r('kid', 1, 30), r('kid', 2, 30), r('kid', 3, 28), r('kid', 4, 20), r('kid', 5, 18), r('kid', 6, 15)]

  it('DISPLACED result: net delta = new − displaced (the pushed-out 6th best)', () => {
    const before = windowedBestSum(six(), 6, 'kid')
    const withNew = [...six(), r('kid', 6, 48)] // beats the weakest counted result (15)
    const after = windowedBestSum(withNew, 6, 'kid')
    expect(after - before).toBe(48 - 15) // +33: only the improvement over the displaced 15 counts
    expect(rankingDeltaSuffix(48, after - before)).toBe(' (ranking total +33)')
  })

  it('BELOW the 6th best: net delta 0, "does not improve best 6"', () => {
    const before = windowedBestSum(six(), 6, 'kid')
    const withNew = [...six(), r('kid', 6, 10)] // weaker than the current weakest counted (15)
    const after = windowedBestSum(withNew, 6, 'kid')
    expect(after - before).toBe(0)
    expect(rankingDeltaSuffix(10, after - before)).toBe(' (does not improve best 6)')
  })

  it('FRESH add (fewer than 6 counted): full points count, no suffix', () => {
    const before = windowedBestSum([r('kid', 1, 30)], 2, 'kid')
    const withNew = [r('kid', 1, 30), r('kid', 2, 48)]
    const after = windowedBestSum(withNew, 2, 'kid')
    expect(after - before).toBe(48)
    expect(rankingDeltaSuffix(48, after - before)).toBe('') // delta === points → nothing extra
  })
})

describe('rankingDeltaSuffix — pure formatter', () => {
  it('covers displaced / net-zero / full / degenerate cases', () => {
    expect(rankingDeltaSuffix(48, 48)).toBe('') // nothing displaced
    expect(rankingDeltaSuffix(48, 33)).toBe(' (ranking total +33)') // displaced
    expect(rankingDeltaSuffix(10, 0)).toBe(' (does not improve best 6)') // below 6th
    expect(rankingDeltaSuffix(0, 0)).toBe('') // no points awarded (degenerate)
  })
})
