// =================================================================================================
// A TABLE WHERE NOBODY HAS SCORED RANKS NOBODY – round 24 #4
// =================================================================================================
//
// The owner opened a save and the game told him his daughter was world number one. She was not:
// every row of the 200-row junior table was on zero points, competition ranking gave all two hundred
// of them the same number, and that number was 1. (`world.kidRank = 1`, and from there the academy's
// review level, the gear discount and the Stats standings all read a world champion.)
//
// ⚠ THE ALL-ZERO TABLE WAS A SYMPTOM, NOT THE DEFECT. An entry that outlived the college fork froze
// the world's housekeeping for 204 weeks, so nobody played and the 52-week window emptied – that is
// fixed elsewhere (wave 2 / B1, `tools/college-freeze-probe.ts` measured it: 0 events, 1 result row,
// 4017 unpruned rows, `table 200/0, kidRank 1`). THIS file guards the DEFENCE: whatever empties a
// table, an empty table may not crown anybody. A ranking is a statement about who is ahead of whom,
// and a table on which nobody has scored says nothing.
//
// WHAT IT GUARDS, and every one of them has already been got wrong once:
//
//   1. NOBODY IS RANKED when every row is on zero – on EVERY table, rolling ones included. The
//      round-23 fix (`computeRanking`'s tail) covers the season table's January and cannot see this
//      case, because a frozen rolling window empties the same way and never takes that branch.
//   2. THE TABLE KEEPS EVERY ROW. Dropping the unscored was the FIRST attempt at the round-23 bug and
//      it shrank the list the domestic entry bands take their PERCENTILES from – four suites red.
//   3. THE RULE IS INERT THE MOMENT ANYONE SCORES. Applying "the zeroes go last" to a rolling table
//      unconditionally moved her ITF rank 90 -> 200, and that was a regression: with 89 players
//      holding points and 111 on zero, "the zeroes are 90th" is competition ranking answering
//      correctly.
//   4. THE CACHE AND THE FOLD AGREE. The round-23 second attempt special-cased her cached number in
//      `recomputeKidRank` and made the two disagree; `tests/condition.test.ts` B1c caught it. The
//      rule therefore lives in the fold, and this file pins that the cache reaches the same number.
//   5. ONE NUMBERING, TWO TABLES. `computeRanking` and `mergedWtaRanking` both take their rank
//      numbers from `assignCompetitionRanks`, so the merged W standings cannot answer differently.
//
// ⭐ MEASURED, AND THE MEASUREMENT IS WHY THIS IS DEFENCE RATHER THAN A SECOND LIVE DEFECT. Five
// healthy careers walked 160 weeks, all three tables read every week (2,400 table-weeks):
//
//     domestic  15 all-zero table-weeks, EVERY one of them at week-of-season 0, 1 or 2
//     itf        0
//     wta        0
//
// So a rolling table never degenerates in a career that is playing – A1's audit found the same thing
// from the other side, and the owner's ITF table only emptied because the world stopped. The domestic
// column is NOT the freeze: a season-to-date table genuinely opens every January with nobody on it.
// That case was already right (round 23), and it stays byte-identical – the same walk with this rule
// deleted hands out the same rank on all 15 of those weeks (200, the bottom of the table), because
// `computeRanking`'s season arm was already sending them there. This rule adds an answer where there
// was none and changes none where there was one.
//
// ⚠ MUTATION-VERIFIED. Every arm below was watched failing before it was believed:
//   * the rule deleted (`return out` unconditionally) -> 6 of 12 red, including THE DEFECT arm.
//   * the branch kept but `last = 1` (crown everybody anyway) -> the same 6 red.
//   * the `scored ||` guard dropped, i.e. the round-23 regression applied to every table -> 6 red,
//     this time the OTHER six: the one-scorer arms and the plain 1224 numbering.
import { describe, it, expect } from 'vitest'
import {
  BEST_N_BY_TRACK,
  WINDOW_BY_TRACK,
  assignCompetitionRanks,
  computeRanking,
  type SeasonResult,
} from '../../src/engine/season/ranking'
import { mergedWtaRanking, type FieldPro } from '../../src/engine/season/fieldPros'
import { createWorld, recomputeKidRank, tableSize, kidPoints, KID_ID, type WorldState } from '../../src/engine/world'
import { cohortIds, inTrack, rankingFor } from '../../src/engine/world/ladder'
import { DEFAULT_PROFILE, LADDER_TRACKS } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'

function r(playerId: string, week: number, points: number, tier?: SeasonResult['tier']): SeasonResult {
  return tier ? { playerId, week, points, tier } : { playerId, week, points }
}

/** A roster the size of a real junior table – 199 rivals and her. */
function roster(n = 200): string[] {
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? KID_ID : `ai-${i}`))
}

/** The cached rank for one track, read the way `rankIn` reads it. */
function cached(world: WorldState, track: LadderTrack): number | undefined {
  return track === 'itf' ? world.kidRank : track === 'domestic' ? world.kidRankDomestic : world.kidRankWta
}

describe('round 24 #4 – a table where every row is on zero ranks nobody', () => {
  it('THE DEFECT: 200 rows on zero, and not one of them is first', () => {
    const ids = roster()
    const table = computeRanking([], 300, BEST_N_BY_TRACK.itf, ids, inTrack('itf'), WINDOW_BY_TRACK.itf)
    expect(table.every((x) => x.points === 0)).toBe(true)
    // The bug, stated as the assertion that used to fail: nobody holds rank 1.
    expect(table.filter((x) => x.rank === 1)).toHaveLength(0)
    expect(new Set(table.map((x) => x.rank))).toEqual(new Set([ids.length]))
  })

  it('...and the table keeps every row, because the entry bands are PERCENTILES of its size', () => {
    const ids = roster()
    const table = computeRanking([], 300, BEST_N_BY_TRACK.itf, ids, inTrack('itf'), WINDOW_BY_TRACK.itf)
    expect(table).toHaveLength(ids.length)
    expect(new Set(table.map((x) => x.playerId))).toEqual(new Set(ids))
  })

  it("the owner's own shape: a ROLLING table whose 52-week window has emptied", () => {
    // A frozen world still HOLDS its ledger – nothing was subtracted, the rows simply aged out of
    // the window while nobody played. Same forty results, read at two weeks.
    const ids = roster()
    const played = ids.slice(0, 40).map((id, i) => r(id, 10 + i, 100 + i, 'j30'))

    const frozen = computeRanking(played, 300, BEST_N_BY_TRACK.itf, ids, inTrack('itf'), 'rolling52')
    expect(frozen.every((x) => x.rank === ids.length)).toBe(true)

    // ⚠ THE SAME LEDGER INSIDE THE WINDOW IS UNTOUCHED – rule 3. Forty players hold points and 160
    // sit on zero, and "the zeroes are 41st" is competition ranking answering correctly.
    const live = computeRanking(played, 60, BEST_N_BY_TRACK.itf, ids, inTrack('itf'), 'rolling52')
    expect(live.find((x) => x.playerId === 'ai-39')!.rank).toBe(1)
    expect(live.filter((x) => x.points === 0).every((x) => x.rank === 41)).toBe(true)
  })

  it('a mandatoryMiss zero is a zero: a table of counting rows worth nothing still ranks nobody', () => {
    // `isCountingResult`'s one exception – a skipped mandatory writes a row that COUNTS and pays 0.
    // A table made entirely of them has rows and no achievement, which is the same statement.
    const ids = ['a', 'b', 'c', 'd', 'e']
    const rows: SeasonResult[] = ids.map((id) => ({ playerId: id, week: 3, points: 0, mandatoryMiss: true }))
    const table = computeRanking(rows, 5, 6, ids)
    expect(table.every((x) => x.rank === 5)).toBe(true)
  })
})

describe('round 24 #4 – one scorer is enough, and the round-23 rule is untouched', () => {
  it('SEASON table: the one scorer is #1 and the rest are last', () => {
    const ids = roster()
    const table = computeRanking([r('ai-7', 5, 30, 'local')], 10, BEST_N_BY_TRACK.domestic, ids, inTrack('domestic'), 'seasonToDate')
    expect(table).toHaveLength(ids.length)
    expect(table.find((x) => x.playerId === 'ai-7')!.rank).toBe(1)
    expect(table.filter((x) => x.playerId !== 'ai-7').every((x) => x.rank === ids.length)).toBe(true)
  })

  it('ROLLING table: the one scorer is #1 and the rest are SECOND, not last', () => {
    // ⚠ THE REGRESSION THIS REFUSES. Sending the zeroes to the bottom of a rolling table moved her
    // ITF rank 90 -> 200 in round 23. Competition ranking is right here and must stay right.
    const ids = roster()
    const table = computeRanking([r('ai-7', 5, 30, 'j30')], 10, BEST_N_BY_TRACK.itf, ids, inTrack('itf'), 'rolling52')
    expect(table.find((x) => x.playerId === 'ai-7')!.rank).toBe(1)
    expect(table.filter((x) => x.playerId !== 'ai-7').every((x) => x.rank === 2)).toBe(true)
  })

  it('the ordinary competition numbering (1224) is byte-identical whenever anyone has scored', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    const results = [r('a', 4, 30), r('b', 4, 20), r('c', 4, 20), r('d', 4, 5)]
    expect(computeRanking(results, 6, 6, ids).map((x) => x.rank)).toEqual([1, 2, 2, 4, 5])
  })
})

describe('round 24 #4 – one numbering, two tables', () => {
  const pro = (id: string, wtaPoints: number): FieldPro =>
    ({ id, name: `Pro ${id}`, nation: 'IT', ageYears: 24, wtaPoints }) as unknown as FieldPro

  it('the MERGED W standings answer exactly as the live fold does', () => {
    // `mergedWtaRanking` re-ranks from scratch, so a rule written only in `computeRanking` would be
    // ERASED on the professional table – the second answer to one question this consolidation exists
    // to prevent.
    const live = computeRanking([], 300, BEST_N_BY_TRACK.wta, ['ai-0', 'ai-1', KID_ID], inTrack('wta'), WINDOW_BY_TRACK.wta)
    const merged = mergedWtaRanking(live, [pro('fp-0', 0), pro('fp-1', 0), pro('fp-2', 0)])
    expect(merged).toHaveLength(6)
    expect(merged.every((x) => x.rank === 6)).toBe(true)

    // ...and one professional holding a point restores ordinary numbering to the whole table.
    const withOne = mergedWtaRanking(live, [pro('fp-0', 40), pro('fp-1', 0), pro('fp-2', 0)])
    expect(withOne[0].playerId).toBe('fp-0')
    expect(withOne[0].rank).toBe(1)
    expect(withOne.filter((x) => x.points === 0).every((x) => x.rank === 2)).toBe(true)
  })

  it('the rule is the shared numbering’s, so any table folded through it gets it', () => {
    const rows = [{ playerId: 'a', points: 0 }, { playerId: 'b', points: 0 }]
    expect(assignCompetitionRanks(rows, (x, y) => y.points - x.points).map((x) => x.rank)).toEqual([2, 2])
    const one = [{ playerId: 'a', points: 1 }, { playerId: 'b', points: 0 }]
    expect(assignCompetitionRanks(one, (x, y) => y.points - x.points).map((x) => x.rank)).toEqual([1, 2])
    expect(assignCompetitionRanks([], () => 0)).toEqual([])
  })
})

describe('round 24 #4 – the cache and the fold agree', () => {
  /** A world with an empty ledger – the state the freeze left behind, without the freeze. */
  function emptiedWorld(): WorldState {
    const world = createWorld('round24-unranked', DEFAULT_PROFILE) as WorldState
    world.results = []
    recomputeKidRank(world)
    return world
  }

  it('world.kidRank is the FOLD’s own number for her, on all three tables', () => {
    const world = emptiedWorld()
    for (const track of LADDER_TRACKS) {
      const table = rankingFor(world, track)
      const hers = table.find((x) => x.playerId === KID_ID)
      expect(hers, `she must be in the ${track} table`).toBeTruthy()
      // ⚠ THE PROPERTY, not the number: whatever the fold says, the cache says the same thing.
      expect(cached(world, track)).toBe(hers!.rank)
    }
  })

  it('...and on the two tables that ARE all-zero, that number is the table’s own size', () => {
    const world = emptiedWorld()
    for (const track of ['domestic', 'itf'] as const) {
      const table = rankingFor(world, track)
      expect(table.every((x) => x.points === 0), `${track} must be the degenerate case`).toBe(true)
      expect(kidPoints(world, track)).toBe(0)
      // The bottom of the table IS `tableSize` – the same value `recomputeKidRank`'s `??` writes for
      // a player who is not in the table at all. Two routes, one answer.
      expect(table.every((x) => x.rank === tableSize(world, track))).toBe(true)
      expect(cached(world, track)).toBe(tableSize(world, track))
      expect(cached(world, track)).not.toBe(1)
    }
    // The roster is the cohort and her – so "the bottom" and "the table's size" are the same 200.
    expect(tableSize(world, 'itf')).toBe(cohortIds(world).length + 1)
  })

  it('the professional table is NOT degenerate – the field holds points, so nothing changes there', () => {
    // ⚠ THE CONTROL FOR THE ARM ABOVE. `mergedWtaRanking` interleaves ~364 derived professionals who
    // carry a book whatever the live world has been doing, so the W table can answer normally on the
    // very world whose junior tables have emptied. She sits with the other zeroes, not at the top.
    const world = emptiedWorld()
    const table = rankingFor(world, 'wta')
    expect(table.some((x) => x.points > 0)).toBe(true)
    expect(world.kidRankWta).toBeGreaterThan(1)
  })
})
