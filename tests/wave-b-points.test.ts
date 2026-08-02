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
    // Level off the ground: this field exists to be a seeding ladder, and the v25 rally term must
    // not add a second, unrelated gradient to it.
    groundstrokes: 60,
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

// ⚠ RE-AIMED BY W2-LADDER, NOT WEAKENED - the real chart itself split the rule. Wave B's zero was
// sourced from the ITF junior table (Reg 31(a)) and the professional chart's two BOTTOM rungs,
// and the 2026 WTA chart pays a NOMINAL 1 to an opening-round loser from W50 up (research §4:
// "zero for a first-round loss at the two bottom rungs, a nominal 1 point higher up"). So the
// claim is now the family split the sources actually make: ZERO at every domestic and junior
// rung and at W15/W35 - every rung the "just play cheap events" grind was possible at - and the
// chart's own 1 at W50/W75/WTA125. The 1 cannot rebuild the participation floor wave B removed:
// those rungs sit behind the game's hardest acceptance cuts and the pro entry cap, and a whole
// window of 1-point exits is out-paid by a single W50 semi-final (W-B3 pins the bound).
//
// ⚠ W100's LAST ELEMENT STAYS 0, AND THAT IS CANON, NOT AN OVERSIGHT: the real chart pays it 1,
// but act2-pro-tour.md §2 rules the three shipped rows (w15/w35/w100) canon as-is - only the NEW
// rungs took the in-wave verification. So the nominal-1 set is exactly the W2-LADDER trio, and a
// future owner ruling that re-verifies w100's row should move it and this pin together.
const NOMINAL_ONE_TIERS: readonly TierId[] = ['w50', 'w75', 'wta125']
const firstRoundValue = (tier: TierId) => (NOMINAL_ONE_TIERS.includes(tier) ? 1 : 0)

describe('W-B2 — a first-round loss pays ZERO at every rung the grind was possible at', () => {
  it('the last element of every points array is the family split: 0 everywhere but the chart-1 trio', () => {
    for (const tier of TIER_LADDER) {
      const pts = TIERS[tier].points
      expect(pts[pts.length - 1], tier).toBe(firstRoundValue(tier))
    }
  })

  it('end to end: run the real bracket, look the loser up in the real table, get the split value', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const res = runTournament(eventFor(tier), field(def.drawSize), null, 'seed-wb2', rngFromSeed('wb2'))
      for (const m of res.matches.filter((x) => x.round === 0)) {
        const loser = m.winnerId === m.aId ? m.bId : m.aId
        // This is byte-for-byte the lookup finalizeTournament/awardAiPoints do:
        //   const points = TIERS[event.tier].points[finish] ?? 0
        expect(def.points[res.finishes[loser]] ?? 0, tier).toBe(firstRoundValue(tier))
      }
    }
  })

  it('ONE win still pays: every non-first-round finish is strictly positive', () => {
    for (const tier of TIER_LADDER) {
      const pts = TIERS[tier].points
      for (let i = 0; i < pts.length - 1; i++) expect(pts[i]).toBeGreaterThan(0)
    }
  })

  it('the table is still strictly descending down to the last slot, so a deeper run always pays more', () => {
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
    expect(windowedBestSum(results, 52, 'kid', 6)).toBe(0)
    const rank = computeRanking(results, 52, 6, ['kid'])
    expect(rank[0].points).toBe(0)
  })

  // ⚠ RE-AIMED by W2-LADDER: three rungs now pay the chart's nominal 1 at the door (see
  // NOMINAL_ONE_TIERS above), so "every opener everywhere = 0" stopped being what the sources say.
  // What the participation-floor claim actually protects is a BOUND, and the bound is pinned in
  // both directions: the grindable rungs still bank exactly nothing, and the nominal-1 rungs can
  // never bank more than one point per counted slot - a whole window of first-round exits at the
  // chart-1 trio is out-paid by ONE W50 semi-final. (Best-6 here; under the adult best-16 the
  // ceiling is 16, still under W50's 20-point semi-final - the bound survives the window widening.)
  it('losing every opener everywhere banks 0 from the grindable rungs and only the bounded nominal 1s', () => {
    const zeroSide: SeasonResult[] = []
    const oneSide: SeasonResult[] = []
    let week = 1
    for (const tier of TIER_LADDER) {
      for (let i = 0; i < 6; i++) {
        const pts = TIERS[tier].points[TIERS[tier].points.length - 1]
        const bucket = NOMINAL_ONE_TIERS.includes(tier) ? oneSide : zeroSide
        if (pts > 0) bucket.push({ playerId: 'kid', week: week++, points: pts, tier })
      }
    }
    expect(zeroSide).toEqual([]) // the grindable rungs leave no row at all (finalize guards on > 0)
    expect(windowedBestSum(oneSide, 52, 'kid', 6)).toBe(6) // best-6 of pure 1s: one point per slot
    expect(windowedBestSum(oneSide, 52, 'kid', 16)).toBeLessThan(TIERS.w50.points[2]) // < one W50 SF (best-16 too: 16 x 1 < 20)
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
  //
  // ⚠ RE-CLAIMED BY fix/rival-fatigue-rows, WHICH IS THE DECISION (1) WAS WAITING FOR. The cohort
  // write site no longer guards on `points > 0`: every entrant of every draw leaves a row and
  // `points` carries the award, 0 included, exactly as pre-history has always written it. So (2)'s
  // disagreement is resolved – in pre-history's favour – and (1) is gone: measured over 12 cells ×
  // 30 seeds × 208w, the share of cohort appearances charged no strain went 45.6% → 0.0% and the
  // field's mean condition 81.3 → 75.8 (tools/rival-fatigue-audit.ts). The mechanism-level pins
  // live in tests/rival-fatigue.test.ts. What stays HERE is the part that belongs to the points
  // table: a zero in the table must never be able to erase a week of tennis.
  it('a first-round exit is worth 0 and still costs a rival a match of condition', () => {
    const tier: TierId = 'j30'
    const pts = TIERS[tier].points[TIERS[tier].points.length - 1]
    expect(pts).toBe(0)

    // The row the engine now writes for that exit, and what the fatigue window makes of it.
    const scoreless: SeasonResult[] = [{ playerId: 'ai-x', week: 10, points: pts, tier }]
    const playedAndLost = rivalCondition(scoreless, 'ai-x', 10)
    const rested = rivalCondition([], 'ai-x', 10)
    expect(playedAndLost).toBeLessThan(rested) // showing up is never free…
    // …and a deeper run still costs more, so the ordering the points table implies survives.
    const wonOne: SeasonResult[] = [{ playerId: 'ai-x', week: 10, points: TIERS[tier].points[4], tier }]
    expect(rivalCondition(wonOne, 'ai-x', 10)).toBeLessThan(playedAndLost)
  })

  it('pre-history writes the scoreless week, and the live path now writes it too', () => {
    const cohort = generateCohort('wave-b-ph')
    const rows = generatePreHistory('wave-b-ph', cohort)
    const zero = rows.filter((r) => r.points === 0)
    // It never had a `points > 0` guard, and it is the shape the live path was moved onto.
    expect(zero.length).toBeGreaterThan(0)
    // Which leaves cohort players who "played" a whole pre-season and hold nothing: they sit on the
    // table at 0 points, sharing the last rank the kid opens on. That follows from THIS slice (the
    // points table), not from whether the scoreless rows are written at all – `computeRanking`
    // counts only scoring rows, so dropping them cannot move anybody's total by a single point.
    const ids = cohort.map((p) => p.id)
    const ranking = computeRanking(rows, 0, 6, ids)
    expect(ranking.some((r) => r.points === 0)).toBe(true)
    expect(computeRanking(rows.filter((r) => r.points > 0), 0, 6, ids)).toEqual(ranking)
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
    // ⚠ RE-AIMED by the two ladders: at zero points the DOMESTIC ladder still opens only Local, and
    // that is the claim this test exists for - the domestic climb must be reachable from below. The
    // J rungs are open at zero too, because they gate on an acceptance list and a J30 has none;
    // they are a different ladder and cannot stall this one.
    expect(openAtZero.filter((t) => ['local', 'regional', 'national'].includes(t))).toEqual(['local'])
    expect(bestSixCeiling(['local'])).toBeGreaterThanOrEqual(TIERS.regional.enterPointBand[0])
  })
})
