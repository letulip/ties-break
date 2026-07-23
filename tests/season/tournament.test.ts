import { describe, it, expect } from 'vitest'
import {
  selectEntrants,
  runTournament,
  standardSeedOrder,
  bandForPercentile,
  JUNIOR_TOUR,
} from '../../src/engine/season/tournament'
import { TIERS } from '../../src/engine/season/calendar'
import { generateCohort } from '../../src/engine/season/cohort'
import { rngFromSeed } from '../../src/engine/rng'
import { simulateMatch } from '../../src/engine/match/engine'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../../src/engine/season/types'
import type { MatchPlayer, Surface } from '../../src/engine/match/types'

function ev(tier: TierId, week: number, surface: Surface = 'hard'): SeasonEvent {
  return { id: `0-w${week}-${tier}`, week, tier, surface, travelCostCents: 100_00, deadlineWeek: week - 2 }
}

// Rank the cohort by array order: cohort[i] gets rank i+1.
function rankByOrder(cohort: AiPlayer[]): RankingRow[] {
  return cohort.map((p, i) => ({ playerId: p.id, points: cohort.length - i, rank: i + 1 }))
}

function kidPlayer(): MatchPlayer {
  return { id: 'kid', name: 'The Kid', serve: 52, ret: 50, composure: 55, stamina: 54 }
}

const cohort = generateCohort('tourney-cohort', 199)
const ranking = rankByOrder(cohort)

describe('standardSeedOrder — seeded bracket', () => {
  it('is a permutation of 1..n with the top two seeds in opposite halves', () => {
    for (const n of [8, 16, 32]) {
      const order = standardSeedOrder(n)
      expect(order.length).toBe(n)
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i + 1))
      const half = n / 2
      const posOf = (seed: number) => order.indexOf(seed)
      expect(posOf(1)).toBeLessThan(half) // seed 1 in the first half
      expect(posOf(2)).toBeGreaterThanOrEqual(half) // seed 2 in the second half
    }
  })
})

describe('bandForPercentile — percentile bands', () => {
  it('maps top 25% → national, next → regional, rest → local', () => {
    expect(bandForPercentile(0.1)).toBe('national')
    expect(bandForPercentile(0.25)).toBe('national')
    expect(bandForPercentile(0.4)).toBe('regional')
    expect(bandForPercentile(0.6)).toBe('regional')
    expect(bandForPercentile(0.75)).toBe('local')
  })
})

describe('selectEntrants — percentile bands per tier', () => {
  const total = ranking.length
  const rankOf = new Map(ranking.map((r) => [r.playerId, r.rank]))

  for (const tier of ['national', 'regional', 'local'] as const) {
    it(`${tier}: fills to drawSize with in-band players, seeded by rank`, () => {
      const entrants = selectEntrants(ev(tier, 10), cohort, ranking, rngFromSeed(`sel-${tier}`))
      expect(entrants.length).toBe(TIERS[tier].drawSize)
      const ranks = entrants.map((p) => rankOf.get(p.id)!)
      for (const rank of ranks) expect(bandForPercentile(rank / total)).toBe(tier)
      // entrants are returned in seed order = ascending rank
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
      // unique entrants
      expect(new Set(entrants.map((p) => p.id)).size).toBe(entrants.length)
    })
  }

  it('is deterministic given the same rng seed', () => {
    const a = selectEntrants(ev('regional', 10), cohort, ranking, rngFromSeed('same'))
    const b = selectEntrants(ev('regional', 10), cohort, ranking, rngFromSeed('same'))
    expect(a).toEqual(b)
  })
})

// Expected total points a full single-elim draw awards, given TierDef.points.
function expectedTotalPoints(tier: TierId): number {
  const pts = TIERS[tier].points
  const rounds = Math.log2(TIERS[tier].drawSize)
  let total = pts[0] // champion
  for (let v = 1; v <= rounds; v++) total += pts[v] * 2 ** (v - 1)
  return total
}

describe('runTournament — bracket integrity', () => {
  for (const tier of ['local', 'regional', 'national'] as const) {
    const event = ev(tier, 12, 'clay')
    const entrants = selectEntrants(event, cohort, ranking, rngFromSeed(`ent-${tier}`))

    it(`${tier}: drawSize-1 matches, each with a winner from its pairing`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run-${tier}`))
      expect(result.eventId).toBe(event.id)
      expect(result.matches.length).toBe(TIERS[tier].drawSize - 1)
      for (const m of result.matches) {
        expect([m.aId, m.bId]).toContain(m.winnerId)
        expect(m.aId).not.toBe(m.bId)
      }
    })

    it(`${tier}: finishes cover every entrant, exactly one champion, histogram matches the bracket`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run2-${tier}`))
      const drawSize = TIERS[tier].drawSize
      const rounds = Math.log2(drawSize)
      expect(Object.keys(result.finishes).length).toBe(drawSize)
      const champions = Object.values(result.finishes).filter((f) => f === 0)
      expect(champions.length).toBe(1)
      // finish histogram: finish 0 → 1, finish v → 2^(v-1)
      const hist: Record<number, number> = {}
      for (const f of Object.values(result.finishes)) {
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(rounds)
        hist[f] = (hist[f] ?? 0) + 1
      }
      expect(hist[0]).toBe(1)
      for (let v = 1; v <= rounds; v++) expect(hist[v]).toBe(2 ** (v - 1))
      // champion = winner of the final (the single round rounds-1 match)
      const final = result.matches.filter((m) => m.round === rounds - 1)
      expect(final.length).toBe(1)
      const championId = Object.keys(result.finishes).find((id) => result.finishes[id] === 0)
      expect(final[0].winnerId).toBe(championId)
    })

    it(`${tier}: total awarded points equal the tier's structural total`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run3-${tier}`))
      const pts = TIERS[tier].points
      let awarded = 0
      for (const id of Object.keys(result.finishes)) awarded += pts[result.finishes[id]]
      expect(awarded).toBe(expectedTotalPoints(tier))
    })

    it(`${tier}: is deterministic given the same rng`, () => {
      const a = runTournament(event, entrants, null, 'W', rngFromSeed(`det-${tier}`))
      const b = runTournament(event, entrants, null, 'W', rngFromSeed(`det-${tier}`))
      expect(a).toEqual(b)
    })
  }
})

describe('runTournament — the kid enters', () => {
  const event = ev('local', 20, 'grass')
  const entrants = selectEntrants(event, cohort, ranking, rngFromSeed('kid-ent'))
  const kid = kidPlayer()

  it('keeps the draw at drawSize by bumping the lowest-ranked entrant, kid included', () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    expect(Object.keys(result.finishes)).toContain('kid')
    expect(Object.keys(result.finishes).length).toBe(TIERS.local.drawSize)
    // the lowest-ranked entrant (last in seed order) was bumped out
    const bumped = entrants[entrants.length - 1].id
    expect(Object.keys(result.finishes)).not.toContain(bumped)
  })

  it("kid's matches carry a seed + score and reproduce via simulateMatch", () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    const lookup = (id: string): MatchPlayer =>
      id === kid.id ? kid : entrants.find((p) => p.id === id)!
    const kidMatches = result.matches.filter((m) => m.aId === kid.id || m.bId === kid.id)
    expect(kidMatches.length).toBeGreaterThanOrEqual(1)
    for (const m of kidMatches) {
      expect(m.seed).toBeTruthy()
      expect(m.score).toBeTruthy()
      const a = lookup(m.aId)
      const b = lookup(m.bId)
      const replay = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      const replayWinner = replay.winner === 0 ? m.aId : m.bId
      expect(replayWinner).toBe(m.winnerId)
      expect(replay.sets.map((s) => `${s.a}-${s.b}`).join(' ')).toBe(m.score)
    }
  })

  it('AI-AI matches never carry a seed or score', () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    for (const m of result.matches) {
      if (m.aId !== kid.id && m.bId !== kid.id) {
        expect(m.seed).toBeUndefined()
        expect(m.score).toBeUndefined()
      }
    }
  })
})
