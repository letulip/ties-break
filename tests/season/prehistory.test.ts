import { describe, it, expect } from 'vitest'
import {
  generatePreHistory,
  PREHISTORY_FIRST_WEEK,
  PREHISTORY_LAST_WEEK,
} from '../../src/engine/season/prehistory'
import { generateCohort } from '../../src/engine/season/cohort'
import { computeRanking, windowedBestSum } from '../../src/engine/season/ranking'
import { createWorld, tickWeek, kidPoints, isTierEligible, enterEvent, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { AiPlayer } from '../../src/engine/season/types'

// ---------------------------------------------------------------------------
// Ladder-up Part A — cohort PRE-HISTORY.
//
// A fresh career used to open with a 199-way tie at zero points: every AI ranked #1,
// the kid ranked #1 alongside them, and "top international field" was indistinguishable
// from a local one (the R9-2 / R8-9 symptoms). Pre-history writes one synthetic season of
// AI results at NEGATIVE weeks so the table is real from week 1 and ages out by itself
// across the first year.
// ---------------------------------------------------------------------------

const SIZE = 199
const cohortOf = (seed: string): AiPlayer[] => generateCohort(seed, SIZE)

/** Mean of the four match attributes – the strength the pre-history is supposed to track. */
function strength(p: AiPlayer): number {
  return (p.serve + p.ret + p.composure + p.stamina) / 4
}

describe('generatePreHistory — determinism and purity', () => {
  it('same seed + cohort reproduces a deep-equal ledger', () => {
    expect(generatePreHistory('ph-1', cohortOf('ph-1'))).toEqual(
      generatePreHistory('ph-1', cohortOf('ph-1')),
    )
  })

  it('a different seed produces a different ledger', () => {
    expect(generatePreHistory('ph-A', cohortOf('ph-A'))).not.toEqual(
      generatePreHistory('ph-B', cohortOf('ph-B')),
    )
  })

  it('never mutates the cohort it is handed', () => {
    const cohort = cohortOf('ph-pure')
    const snapshot = JSON.stringify(cohort)
    generatePreHistory('ph-pure', cohort)
    expect(JSON.stringify(cohort)).toBe(snapshot)
  })

  it('is a pure function of (seed, cohort) – the family background cannot move it', () => {
    // Pre-history runs on the purpose-scoped `seed:prehistory` sub-stream at createWorld, so it
    // takes no rng parameter and nothing about the player's choices can reach it. Two careers on
    // the same seed but different backgrounds must open on the SAME cohort table.
    const a = createWorld('ph-stream', { ...DEFAULT_PROFILE, background: 'working' })
    const b = createWorld('ph-stream', { ...DEFAULT_PROFILE, background: 'wealthy' })
    expect(a.results).toEqual(b.results)
    expect(a.results).toEqual(generatePreHistory('ph-stream', generateCohort('ph-stream')))
  })
})

describe('generatePreHistory — shape of the ledger', () => {
  const cohort = cohortOf('ph-shape')
  const rows = generatePreHistory('ph-shape', cohort)

  it('writes only NEGATIVE weeks inside the rolling window', () => {
    for (const r of rows) {
      expect(r.week).toBeGreaterThanOrEqual(PREHISTORY_FIRST_WEEK)
      expect(r.week).toBeLessThanOrEqual(PREHISTORY_LAST_WEEK)
      expect(r.week).toBeLessThan(0)
    }
    expect(PREHISTORY_LAST_WEEK).toBe(-1)
    expect(PREHISTORY_FIRST_WEEK).toBe(-51) // week 0 - 51 == inside the 52-week ranking window
  })

  it('never writes a KID row and never writes a zero-point row', () => {
    for (const r of rows) {
      expect(r.playerId).not.toBe(KID_ID)
      expect(r.points).toBeGreaterThan(0)
    }
  })

  it('gives EVERY cohort player at least one counting result (the kid stays the only 0-point player)', () => {
    const withResults = new Set(rows.map((r) => r.playerId))
    expect(withResults.size).toBe(cohort.length)
  })

  it('never puts two of a player\'s results in the same week', () => {
    const seen = new Set<string>()
    for (const r of rows) {
      const key = `${r.playerId}@${r.week}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('is a PYRAMID: few players carry a full book of counting results, most carry one or two', () => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1)
    const values = [...counts.values()]
    const many = values.filter((n) => n >= 5).length
    const few = values.filter((n) => n <= 2).length
    expect(few).toBeGreaterThan(many) // the tail is wider than the head
    expect(many).toBeGreaterThan(0) // ...but the head exists
    expect(Math.max(...values)).toBeLessThanOrEqual(8)
  })
})

describe('generatePreHistory — the table is COHERENT with skill', () => {
  it('the strongest players sit near the top of the table, the weakest near the bottom', () => {
    const cohort = cohortOf('ph-coherent')
    const rows = generatePreHistory('ph-coherent', cohort)
    const ranking = computeRanking(rows, 0, cohort.map((p) => p.id))
    const byId = new Map(cohort.map((p) => [p.id, p]))
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

    const top = ranking.slice(0, 25).map((r) => strength(byId.get(r.playerId)!))
    const bottom = ranking.slice(-25).map((r) => strength(byId.get(r.playerId)!))
    // A 0.9-skill AI must not sit at rank 190 (the spec's coherence bar).
    expect(mean(top)).toBeGreaterThan(mean(bottom) + 5)
  })

  it('the points spread is wide enough to be a real ladder (not a flat tie)', () => {
    const cohort = cohortOf('ph-spread')
    const rows = generatePreHistory('ph-spread', cohort)
    const ranking = computeRanking(rows, 0, cohort.map((p) => p.id))
    const distinct = new Set(ranking.map((r) => r.points))
    expect(distinct.size).toBeGreaterThan(50) // no dense-tie artifact
    expect(ranking[0].points).toBeGreaterThan(ranking[ranking.length - 1].points * 5)
  })
})

describe('createWorld — the fresh career now opens on a REAL ranking', () => {
  it('seeds the results ledger from pre-history (AI only)', () => {
    const world = createWorld('fresh-ph')
    expect(world.results.length).toBeGreaterThan(0)
    expect(world.results.every((r) => r.playerId !== KID_ID)).toBe(true)
    expect(world.results.every((r) => r.week < 0)).toBe(true)
  })

  it('the KID still starts with 0 points and reads as Unranked (rankLabel behavior)', () => {
    const world = createWorld('fresh-ph')
    expect(kidPoints(world)).toBe(0)
    expect(windowedBestSum(world.results, world.week, KID_ID)).toBe(0)
  })

  it('RE-PINNED (was rank #1): the kid starts ranked LAST, behind the whole cohort', () => {
    // Before pre-history every AI was tied at 0 points, so the kid shared dense-rank 1 with the
    // entire field – the artifact the owner saw (a brand-new career reading "#1"). With a real
    // table she is now the ONLY point-less player, i.e. rank cohort.length + 1 = 200. This is the
    // FIX, not a regression; `rankLabel` still shows "Unranked" until she owns a counting result.
    const world = createWorld('fresh-ph')
    expect(world.kidRank).toBe(world.cohort.length + 1)
    expect(world.kidRank).toBe(200)
  })

  it('the week-0 standings are meaningful: the top of the table actually has points', () => {
    const world = createWorld('fresh-ph')
    const ranking = computeRanking(world.results, 0, [...world.cohort.map((p) => p.id), KID_ID])
    expect(ranking.slice(0, 10).every((r) => r.points > 0)).toBe(true)
    expect(ranking[0].rank).toBe(1)
    expect(ranking[0].playerId).not.toBe(KID_ID)
  })
})

describe('pre-history ages out on its own (no new decay logic)', () => {
  it('still counts at week 1 and is gone from the window by week 53', () => {
    const cohort = cohortOf('ph-age')
    const rows = generatePreHistory('ph-age', cohort)
    const id = rows[0].playerId
    expect(windowedBestSum(rows, 1, id)).toBeGreaterThan(0)
    expect(windowedBestSum(rows, 53, id)).toBe(0)
  })

  it('the engine PRUNES every negative-week row away as the first season runs', () => {
    const world = createWorld('ph-prune')
    const rng = rngFromSeed(world.seed)
    expect(world.results.some((r) => r.week < 0)).toBe(true)
    for (let i = 0; i < 53; i++) tickWeek(world, rng)
    expect(world.results.some((r) => r.week < 0)).toBe(false)
  })
})

describe('tier access is UNAFFECTED (entry gating is points-based, not rank-based)', () => {
  it('a fresh kid is still local-only and is still refused a regional entry', () => {
    const world = createWorld('ph-gate')
    expect(kidPoints(world)).toBe(0)
    expect(isTierEligible('local', kidPoints(world))).toBe(true)
    expect(isTierEligible('regional', kidPoints(world))).toBe(false)
    expect(isTierEligible('national', kidPoints(world))).toBe(false)

    const regional = world.season.find((e) => e.tier === 'regional' && e.deadlineWeek >= world.week)
    expect(regional).toBeTruthy()
    expect(() => enterEvent(world, regional!.id)).toThrow(/Not enough ranking points/)

    const local = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)
    expect(local).toBeTruthy()
    expect(() => enterEvent(world, local!.id)).not.toThrow()
  })
})
