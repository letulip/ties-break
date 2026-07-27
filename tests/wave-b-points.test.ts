// Wave B, slice 1 — A FIRST-ROUND LOSS PAYS ZERO AT EVERY TIER.
//
// Grounding (docs/research/ranking-points-by-tier.md §1, ITF Regulation 31(a) verbatim: "No ranking
// points will be awarded to a player until he/she has played and won a round in the Main Draw").
// Every ITF grade pays nothing for a first-round exit; ours paid at all six rungs, which the
// research names as the actual engine of the "just play J30s" degeneracy — 26 J30s a season at 12
// points each is a ~72-point participation floor before she wins anything, and best-6 banks it.
//
// This file is deliberately uniquely named (two agents once collided on tests/round11.test.ts).
//
// The whole change is ONE thing: the LAST element of every `TIERS[t].points` array becomes 0. The
// first block below proves, FROM THE ENGINE, that the last element really is the first-round exit
// before anything asserts that it is zero — the index claim is the load-bearing one, and a comment
// is not evidence.

import { describe, it, expect } from 'vitest'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { runTournament } from '../src/engine/season/tournament'
import { computeRanking, windowedBestSum, type SeasonResult } from '../src/engine/season/ranking'
import { rivalCondition } from '../src/engine/season/rival'
import { generateCohort } from '../src/engine/season/cohort'
import { generatePreHistory } from '../src/engine/season/prehistory'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { MatchPlayer } from '../src/engine/match/types'
import { rngFromSeed } from '../src/engine/rng'

/** A flat AI field of `n` interchangeable players – enough for runTournament, which only reads
 *  id/rating-ish fields through the closed form. Ratings descend so the seeding is well-defined. */
function field(n: number): MatchPlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    serve: 60 - i * 0.1,
    ret: 60 - i * 0.1,
    composure: 60,
    stamina: 60,
  }))
}

function eventFor(tier: TierId): SeasonEvent {
  return {
    id: `test-w10-${tier}`,
    week: 10,
    tier,
    surface: 'hard',
    travelCostCents: 0,
    deadlineWeek: 8,
  }
}

describe('W-B1 — the index claim: the LAST points element IS the first-round exit', () => {
  // runTournament sets `finishes[loser] = rounds - round`, with round 0 = the first round and
  // rounds = log2(drawSize). So a first-round loser's finish is exactly `rounds`, which indexes the
  // last slot of a `rounds + 1`-long array. Proven here per tier off the real bracket, not asserted.
  it('every round-0 loser gets finish === points.length - 1, at every draw size', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const res = runTournament(eventFor(tier), field(def.drawSize), null, 'seed-wb1', rngFromSeed('wb1'))
      const rounds = Math.log2(def.drawSize)
      expect(def.points.length).toBe(rounds + 1)

      const firstRoundLosers = res.matches
        .filter((m) => m.round === 0)
        .map((m) => (m.winnerId === m.aId ? m.bId : m.aId))
      // Half the draw loses in round 1 – that is the population this change is about.
      expect(firstRoundLosers.length).toBe(def.drawSize / 2)
      for (const id of firstRoundLosers) {
        expect(res.finishes[id]).toBe(def.points.length - 1)
      }
      // ...and the champion is index 0, the other end of the same array.
      const champion = Object.entries(res.finishes).find(([, f]) => f === 0)
      expect(champion).toBeDefined()
    }
  })

  it('the finish index is dense and monotone: every slot 0..rounds is somebody', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const res = runTournament(eventFor(tier), field(def.drawSize), null, 'seed-wb1b', rngFromSeed('wb1b'))
      const seen = new Set(Object.values(res.finishes))
      for (let i = 0; i < def.points.length; i++) expect(seen.has(i)).toBe(true)
    }
  })
})

describe('W-B2 — a first-round loss pays ZERO at every tier', () => {
  it('the last element of every points array is 0', () => {
    for (const tier of TIER_LADDER) {
      const pts = TIERS[tier].points
      expect(pts[pts.length - 1]).toBe(0)
    }
  })

  it('end to end: run the real bracket, look the loser up in the real table, get 0', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const res = runTournament(eventFor(tier), field(def.drawSize), null, 'seed-wb2', rngFromSeed('wb2'))
      for (const m of res.matches.filter((x) => x.round === 0)) {
        const loser = m.winnerId === m.aId ? m.bId : m.aId
        // This is byte-for-byte the lookup finalizeTournament/awardAiPoints do:
        //   const points = TIERS[event.tier].points[finish] ?? 0
        expect(def.points[res.finishes[loser]] ?? 0).toBe(0)
      }
    }
  })

  it('ONE win still pays: every non-first-round finish is strictly positive', () => {
    for (const tier of TIER_LADDER) {
      const pts = TIERS[tier].points
      for (let i = 0; i < pts.length - 1; i++) expect(pts[i]).toBeGreaterThan(0)
    }
  })

  it('the table is still strictly descending down to the zero, so a deeper run always pays more', () => {
    for (const tier of TIER_LADDER) {
      const pts = TIERS[tier].points
      for (let i = 1; i < pts.length; i++) expect(pts[i]).toBeLessThan(pts[i - 1])
    }
  })
})

describe('W-B3 — the participation floor is gone', () => {
  // The number the research names: 26 J30s a season, all first-round exits, used to bank a 72-point
  // best-6 floor (12 × 6). It must now be exactly nothing – she earns her first point by winning.
  it('a whole season of first-round exits at the densest tier banks 0 ranking points', () => {
    const results: SeasonResult[] = []
    for (let w = 1; w <= 26; w++) {
      const pts = TIERS.j30.points[TIERS.j30.points.length - 1]
      // finalizeTournament only pushes a result when points > 0; mirror that guard.
      if (pts > 0) results.push({ playerId: 'kid', week: w * 2, points: pts, tier: 'j30' })
    }
    expect(windowedBestSum(results, 52, 'kid')).toBe(0)
    const rank = computeRanking(results, 52, ['kid'])
    expect(rank[0].points).toBe(0)
  })

  it('showing up at all six rungs, losing every opener, is still 0', () => {
    const results: SeasonResult[] = []
    let week = 1
    for (const tier of TIER_LADDER) {
      for (let i = 0; i < 6; i++) {
        const pts = TIERS[tier].points[TIERS[tier].points.length - 1]
        if (pts > 0) results.push({ playerId: 'kid', week: week++, points: pts, tier })
      }
    }
    expect(windowedBestSum(results, 52, 'kid')).toBe(0)
  })
})

describe('W-B3b — THE SIDE EFFECT: "played" and "scored" have come apart', () => {
  // The engine records a tournament week by pushing a row into `world.results`, and BOTH write
  // sites guard on `points > 0` (world.ts: finalizeTournament for the kid, awardAiPoints for the
  // cohort). Until now every finish paid, so "has a row" was a faithful proxy for "played that
  // week". Zeroing the first round breaks that equivalence for the first time, and two systems
  // read the ledger as a record of PLAY rather than of SCORE:
  //
  //   1. rival.ts `rivalCondition` – reconstructs a rival's fatigue from her rows. A rival who
  //      loses her opener now looks like she RESTED: her week earns `recoveryBase` instead of
  //      costing a trip plus a match. The whole cohort is therefore fresher than before.
  //   2. prehistory.ts – has NO `points > 0` guard, so it still writes first-round exits, now as
  //      0-point rows. The two halves of the engine disagree about whether a scoreless week exists.
  //
  // Pinned here so the coupling is visible and cannot regress silently while the owner decides.
  // Neither is fixed in this slice: the fix lives in world.ts / prehistory.ts, not in the table.
  it('a first-round exit produces no ledger row, so it is invisible to rival fatigue', () => {
    const tier: TierId = 'j30'
    const pts = TIERS[tier].points[TIERS[tier].points.length - 1]
    expect(pts).toBe(0)
    // finalizeTournament / awardAiPoints both do `if (points > 0) results.push(...)`.
    const wouldWriteRow = pts > 0
    expect(wouldWriteRow).toBe(false)

    // ...and with no row, the fatigue window sees a QUIET week: full recovery, no strain.
    const playedButScoreless: SeasonResult[] = [] // exactly what the ledger holds after that week
    const restedAll = rivalCondition(playedButScoreless, 'ai-x', 10)
    const wonOne: SeasonResult[] = [{ playerId: 'ai-x', week: 10, points: TIERS[tier].points[4], tier }]
    const playedAndScored = rivalCondition(wonOne, 'ai-x', 10)
    expect(restedAll).toBeGreaterThan(playedAndScored)
  })

  it('pre-history still writes the scoreless week, so the two halves disagree', () => {
    const cohort = generateCohort('wave-b-ph')
    const rows = generatePreHistory('wave-b-ph', cohort)
    const zero = rows.filter((r) => r.points === 0)
    // It has no `points > 0` guard – unlike both live write sites.
    expect(zero.length).toBeGreaterThan(0)
    // Which leaves cohort players who "played" a whole pre-season and hold nothing.
    const ranking = computeRanking(rows, 0, cohort.map((p) => p.id))
    expect(ranking.some((r) => r.points === 0)).toBe(true)
  })
})

describe('W-B4 — the ladder must not stall: every enterPointBand stays reachable from below', () => {
  // THE LOUD ONE. Zeroing R1 removes income the bands were tuned against, so the risk is a rung
  // whose gate can no longer be cleared by the rungs that are open under it. Checked structurally:
  // for each rung, the best-6 ceiling of everything already open at 0 points and below it must
  // clear its `minPoints`. The bench measures how LONG it takes; this pins that it is possible.

  /** Best-6 ceiling from a set of tiers: six times the best title among them. */
  const bestSixCeiling = (tiers: TierId[]) => 6 * Math.max(...tiers.map((t) => TIERS[t].points[0]))

  it('a fresh 0-point kid can score at all: local is open and pays for one win', () => {
    const [min] = TIERS.local.enterPointBand
    expect(min).toBe(0)
    // Draw 8: R1 → SF → F. Winning one match = reaching the semi = index rounds-1 = 2.
    const oneWin = TIERS.local.points[TIERS.local.points.length - 2]
    expect(oneWin).toBeGreaterThan(0)
  })

  it('each rung is reachable from the rungs open beneath it', () => {
    for (let i = 1; i < TIER_LADDER.length; i++) {
      const tier = TIER_LADDER[i]
      const below = TIER_LADDER.slice(0, i)
      const [minPoints] = TIERS[tier].enterPointBand
      expect(bestSixCeiling(below)).toBeGreaterThanOrEqual(minPoints)
    }
  })

  it('regional (65) is reachable on local results alone, which is the only rung open at 0', () => {
    // Local is the ONLY tier with minPoints 0, so the very first gate must fall to local results.
    const openAtZero = TIER_LADDER.filter((t) => TIERS[t].enterPointBand[0] === 0)
    expect(openAtZero).toEqual(['local'])
    expect(bestSixCeiling(['local'])).toBeGreaterThanOrEqual(TIERS.regional.enterPointBand[0])
  })
})
