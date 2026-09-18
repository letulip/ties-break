// ⭐⭐⭐ ROUND 46 #10 – THE BEST RANK SHE EVER HELD.
//
// THE OWNER, 18.09: «некорректный BEST RANK на финале (лучший 27)» – his career touched #17.
//
// ⚠ THE DIAGNOSIS, and it was wrong twice over. `buildEndingView` folded
// `min(seasonHistory[].endRank)`, and that field is «⚠ THE ITF ONE, always» by its own documentation:
//   (a) THE WRONG TABLE – a woman who had spent twenty seasons on the professional tour was handed
//       her best JUNIOR year-end;
//   (b) SEASON CLOSES ONLY – a peak reached in May and lost by December is invisible, and a career
//       that ends MID-season never wrote its last close at all (`maybeFireSeasonWrapUp` fires at
//       week 49 of a season and nowhere else).
// Measured over ten walked careers (`tools/album-money-probe.ts --census 10`): the old fold missed
// the rank she really held by a mean of 11.6 places and by as much as 20 – one career read #21 over
// a girl who had actually stood at #1. The reader that replaces it misses by 2.6 on the same ten.
//
// ⚠⚠ WHAT IS STILL OUT OF REACH AND IS NOT BUILT HERE: nothing on any save retains the rank she held
// in an ordinary week, so a peak that rose and fell inside one season cannot be seen by ANY reader.
// Closing that is a persisted running minimum – a schema move, and therefore the owner's call.
//
// ⭐⭐⭐ HE CALLED IT ON 18.09 AND THE ANSWER WAS NO (ruling 1): «достаточно лучшего ранга по итогам
// сезона, они у нас все есть, можно даже все ранги перечислить из каждого уровня чемпионатов
// отдельно.» So the reader these arms pin is the FINAL one and the gap above is the gap he has
// chosen to live with – ⚠ it is not to be re-proposed, and this file's arms are not a staging post
// for a schema move. The paragraph above is left as written because it is the question he answered.
// His second sentence is a separate, unbuilt ask about listing the tables separately; it stops at a
// written proposal, docs/specs/the-reckoning-2026-09.md §4b, and touches nothing pinned here.
import { describe, it, expect } from 'vitest'
import { closeTournament, createWorld, skipTournament, tickWeek, KID_ID, type WorldState } from '../src/engine/world'
import { bestRankEver, bestSeasonClose } from '../src/engine/world/ladder'
import { buildEndingView } from '../src/engine/world/endings'
import { slotBestWeek } from '../src/engine/world/album'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { SeasonHistoryEntry } from '../src/shared/protocol'

function career(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** A banked season, told apart by table the way the wrap banks it (v46 `byTrack`). */
function season(seasonIndex: number, itf: number, wta?: number): SeasonHistoryEntry {
  return {
    seasonIndex,
    endRank: itf,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0, endRank: itf },
      wta: { points: 0, wins: 0, losses: 0, ...(wta === undefined ? {} : { endRank: wta }) },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

/** The one-way door `activeLadderOf` reads – a counting W-series finish on the never-pruned mark,
 *  which is how the engine itself makes a career professional. */
function turnProfessional(world: WorldState): void {
  world.bestFinishByTier.wta250 = 3
}

/** ⚠ A POINT ON THE PROFESSIONAL TABLE, WHICH IS WHAT MAKES HER LIVE RANK A NUMBER AT ALL. `rankIn`
 *  answers with the table's SIZE when the cache is empty, so every reader asks `kidPoints > 0` first
 *  – «unranked is not a number». A fixture that set `kidRankWta` alone would be describing a girl
 *  the engine considers unranked, and the live term would correctly refuse to read it. */
function givePoints(world: WorldState): void {
  world.results.push({ playerId: KID_ID, week: world.week, points: 400, tier: 'w100' })
}

describe('⭐⭐⭐ round 46 #10 – the best rank the epilogue is allowed to print', () => {
  it('⭐⭐⭐ reads HER table, not the junior one – the defect the owner caught', () => {
    const world = career('r46-rank-a', 30)
    turnProfessional(world)
    world.seasonHistory = [season(0, 40, 300), season(1, 27, 120), season(2, 55, 17)]
    world.kidRankWta = 240

    // ⚠⚠ THE ARM. Restore `min(seasonHistory[].endRank)` and this goes red with #27 – the owner's own
    // number, reproduced: measured 18.09, 5 of the 7 tests in this file turn red.
    expect(bestRankEver(world), 'her best professional standing, not her best junior year').toEqual({
      rank: 17,
      track: 'wta',
    })
  })

  it('⭐⭐ the junior career still reads the junior table, so nothing regresses for a girl who never turned pro', () => {
    const world = career('r46-rank-b', 30)
    world.seasonHistory = [season(0, 90), season(1, 27), season(2, 44)]
    world.kidRankWta = undefined
    const best = bestRankEver(world)
    expect(best?.track, 'she never had a counting W result').not.toBe('wta')
  })

  it('⭐⭐⭐ sees the final, PARTIAL season the wrap never reached – the second half of the defect', () => {
    const world = career('r46-rank-c', 30)
    turnProfessional(world)
    world.seasonHistory = [season(0, 40, 300), season(1, 30, 120)]
    // She is standing somewhere right now, in a season that will never be wrapped because the career
    // ends inside it. `maybeFireSeasonWrapUp` fires at week 49 and nowhere else.
    givePoints(world)
    world.kidRankWta = 200
    expect(bestRankEver(world)?.rank, 'the closes still win when they are better').toBe(120)

    world.kidRankWta = 9
    // ⚠⚠ THE ARM. Drop the live-rank term and this goes red at 120 – measured 18.09, 2 of 7 red.
    expect(bestRankEver(world)?.rank, 'and the live rank is seen when it is her best').toBe(9)
  })

  it('⚠ «unranked is not a number» – a table she holds no point in cannot contribute a tie floor', () => {
    const world = career('r46-rank-d', 30)
    turnProfessional(world)
    world.seasonHistory = [season(0, 40, 300)]
    world.kidRankWta = undefined
    // `rankIn` answers with the whole table's size when the cache is empty; that is not a standing.
    expect(bestRankEver(world)?.rank, 'the recorded close, never the floor').toBe(300)
  })

  it('⚠ a pre-v46 row can still answer for the junior table and for neither of the others', () => {
    const world = career('r46-rank-e', 30)
    const old = season(0, 33)
    delete old.byTrack
    world.seasonHistory = [old]
    expect(bestSeasonClose(world, 'itf'), 'the bare endRank IS the ITF one').toEqual({
      rank: 33,
      seasonIndex: 0,
      week: WEEKS_PER_YEAR - OFF_SEASON_WEEKS,
    })
    expect(bestSeasonClose(world, 'wta'), 'and none can be invented for the others').toBeNull()
  })

  it('⭐⭐ the epilogue and the album read the SAME rule, so a third copy cannot appear', () => {
    const world = career('r46-rank-f', 30)
    turnProfessional(world)
    givePoints(world)
    world.seasonHistory = [season(0, 40, 300), season(1, 27, 61)]
    world.kidRankWta = 88
    world.ending = { type: 'natural', week: world.week, ageYears: 31, detail: 'she stopped', resumesWeek: null }
    // ⚠ The album's slot 4 falls back to a rank only when she never won a title – the fixture never did.
    world.milestones = world.milestones.filter((m) => m.type !== 'title')

    const view = buildEndingView(world)
    expect(view?.bestRank).toBe(61)
    expect(view?.bestRankTrack).toBe('wta')
    // ⚠⚠ THE ARM THAT MATTERS FOR THE SECOND COPY. Restore the `season-rank` milestone scan in
    // `slotBestWeek` and this goes red – measured 18.09, 2 of 7: the page would read a junior number
    // for a professional career, which is the epilogue's own bug living on in the album.
    expect(slotBestWeek(world).fact, 'the page names her professional close').toContain('#61')
  })

  it('⚠ the album still says «at the close of», so it folds the CLOSES only and never the live rank', () => {
    const world = career('r46-rank-g', 30)
    turnProfessional(world)
    givePoints(world)
    world.seasonHistory = [season(0, 40, 300), season(1, 27, 61)]
    world.kidRankWta = 2
    world.milestones = world.milestones.filter((m) => m.type !== 'title')
    const fact = slotBestWeek(world).fact ?? ''
    expect(fact, 'a mid-season standing would make the sentence false').not.toContain('#2')
    expect(fact).toContain('#61')
    expect(bestRankEver(world)?.rank, 'while the epilogue, which claims no such thing, does see it').toBe(2)
  })
})
