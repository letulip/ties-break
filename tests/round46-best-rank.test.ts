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
//
// ⭐⭐⭐ AMENDED 18.09 BY RULING C – THE TABLE IS THE HIGHEST SHE EVER REACHED. «делаем на высшей
// ступени из тех, на которых она была, если ушла после J – значит это высшая, если ушла с W – значит
// эта высшая. Остальные отдельно ниже можно написать или на отдельных слайдах до этого.» The last
// block in this file is what that ruling added; every arm above it is untouched, because the
// professional arm of `activeLadderOf` is already a one-way door and therefore already obeyed him.
import { describe, it, expect } from 'vitest'
import { closeTournament, createWorld, skipTournament, tickWeek, KID_ID, type WorldState } from '../src/engine/world'
import {
  activeLadderOf,
  bestRankEver,
  bestRankOn,
  bestSeasonClose,
  everCountedOn,
  highestLadderReached,
  kidPoints,
} from '../src/engine/world/ladder'
import { buildEndingView } from '../src/engine/world/endings'
import { slotBestWeek } from '../src/engine/world/album'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
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

// =================================================================================================
// ⭐⭐⭐ RULING C, 18.09 – «НА ВЫСШЕЙ СТУПЕНИ ИЗ ТЕХ, НА КОТОРЫХ ОНА БЫЛА»
// =================================================================================================
//
// > «делаем на высшей ступени из тех, на которых она была, если ушла после J – значит это высшая,
// > если ушла с W – значит эта высшая.»
//
// ⚠⚠ THE CAREER THE RULING IS ABOUT, and it is one shape only: a girl who played the junior circuit,
// left it, and never had a counting W result. `activeLadderOf`'s junior arm is a LIVE read
// (`kidPoints(itf) > 0`) and that is deliberate there – «J is a stage she passes through» – so once
// her ITF book decays out of the 52-week window that function correctly says `'domestic'`, and the
// epilogue was printing her best NATIONAL standing over an international career. «Ушла после J» is
// exactly that career, and `highestLadderReached` is exactly that word.
describe('⭐⭐⭐ round 46 #10, ruling C – the highest table she was ever ON, not the one she is on now', () => {
  /** A junior who won a J60 and then left the game – no W result, and no live ITF points, because
   *  `world.results` prunes at 52 weeks and she has not played in years. */
  function leftAfterJuniors(seed: string): WorldState {
    const world = career(seed, 30)
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    // The never-pruned mark: a J60 TITLE, whose points-table row pays > 0.
    world.bestFinishByTier.j60 = 0
    world.seasonHistory = [
      {
        seasonIndex: 0,
        endRank: 40,
        points: 0,
        wins: 0,
        losses: 0,
        byTrack: {
          domestic: { points: 0, wins: 0, losses: 0, endRank: 4 },
          itf: { points: 0, wins: 0, losses: 0, endRank: 22 },
          wta: { points: 0, wins: 0, losses: 0 },
        },
        fundsDeltaCents: 0,
        endFundsCents: 0,
      },
    ]
    return world
  }

  it('⭐⭐⭐ «если ушла после J – значит это высшая» – the epilogue reads the junior table, not the national one', () => {
    const world = leftAfterJuniors('r46-rC-a')
    // The premise, stated rather than assumed: she really has no live points on either table, so the
    // live reader really does fall back to the national one.
    expect(kidPoints(world, 'itf'), 'her junior book has decayed out of the window').toBe(0)
    expect(kidPoints(world, 'wta')).toBe(0)
    expect(activeLadderOf(world), 'which table is she competing in TODAY – none of them').toBe('domestic')

    expect(highestLadderReached(world), 'which table did she ever REACH – the junior one').toBe('itf')
    // ⚠⚠ THE ARM. Point `bestRankEver` back at `activeLadderOf` – the shipped reader until 18.09 –
    // and this goes red with `{ rank: 4, track: 'domestic' }`: measured 18.09, RED [1 test,
    // 1 assertion]. The number it would print is her best NATIONAL close over a career that stood
    // #22 in the world as a junior, which is his sentence reproduced.
    expect(bestRankEver(world), 'the highest rung of those she was on').toEqual({ rank: 22, track: 'itf' })
  })

  it('⭐⭐ ...and `activeLadderOf` is NOT touched, which is the load-bearing half', () => {
    const world = leftAfterJuniors('r46-rC-b')
    // ⚠⚠ THE ARM IN THE OTHER DIRECTION, and it is the one worth having. Make `activeLadderOf` read
    // the high-water mark too and this goes red – measured 18.09, RED [2 tests, 2 assertions] (this
    // one and the premise stated in the arm above it) – and the real damage is off-screen: Home's chip, the Stats tabs and the wrap-up card all ask that
    // function «which table is hers» and would start printing a table she has not played on in years.
    // Two questions, two readers, one rule each.
    expect(activeLadderOf(world), 'the live question keeps its live answer').toBe('domestic')
    expect(highestLadderReached(world), 'and the historical one keeps its own').toBe('itf')
  })

  it('⭐⭐ the album\'s page moved WITH the epilogue – the one-reader discipline, again', () => {
    const world = leftAfterJuniors('r46-rC-c')
    world.milestones = world.milestones.filter((m) => m.type !== 'title')
    // ⚠⚠ THE ARM. Leave `slotBestWeek` on `activeLadderOf` while the epilogue moves and this goes red
    // – measured 18.09, RED [1 test, 1 assertion]: the page prints «#4 at the close of 2031». A page
    // whose figure disagreed with the last page of the same album is the exact defect round 46 #10
    // was opened for; a ruling that moves the table has to move both copies or it re-creates it.
    expect(slotBestWeek(world).fact, 'the page names her junior close').toContain('#22')
    expect(slotBestWeek(world).fact, 'and never the national one').not.toContain('#4')
  })

  it('⚠ a girl who never left the national ladder is unchanged – the two readers agree on her', () => {
    const world = career('r46-rC-d', 30)
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    world.bestFinishByTier = {}
    world.seasonHistory = [
      {
        seasonIndex: 0,
        endRank: 90,
        points: 0,
        wins: 0,
        losses: 0,
        byTrack: {
          domestic: { points: 0, wins: 0, losses: 0, endRank: 6 },
          itf: { points: 0, wins: 0, losses: 0 },
          wta: { points: 0, wins: 0, losses: 0 },
        },
        fundsDeltaCents: 0,
        endFundsCents: 0,
      },
    ]
    expect(highestLadderReached(world)).toBe('domestic')
    expect(activeLadderOf(world)).toBe('domestic')
    expect(bestRankEver(world), 'her own table, her own number').toEqual({ rank: 6, track: 'domestic' })
  })

  it('⚠ a SCORELESS exit is not evidence she was there – the same standard on all three tables', () => {
    const world = career('r46-rC-e', 30)
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    world.bestFinishByTier = {}
    // A W15 first-round loss: a real cheque, and zero points. `tests/round41-kid-share-first-w.test.ts`
    // pins that `wtaEverCounted` says «she has never been there» about exactly this row, and ruling C
    // inherits the standard rather than inventing a looser one for the other two tables.
    const w15 = TIERS.w15.points.length - 1
    expect(TIERS.w15.points[w15], 'the fixture really is a scoreless finish').toBe(0)
    world.bestFinishByTier.w15 = w15
    expect(everCountedOn(world, 'wta'), 'a cheque is not a counting result').toBe(false)
    expect(highestLadderReached(world), 'so she has not «been on» the professional table').toBe('domestic')
  })

  it('⭐⭐ HIS SECOND SENTENCE IS BUILT, not promised – all three tables are one call away', () => {
    // «Остальные отдельно ниже можно написать или на отдельных слайдах до этого.» The reader takes
    // the table; what has NOT shipped is the PAGE, because one `<dl>` row becoming three is a 375px
    // layout decision and `Best rank` cannot survive the split – both his (drafts R46-4/5/6).
    const world = career('r46-rC-f', 30)
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    turnProfessional(world)
    world.seasonHistory = [
      {
        seasonIndex: 0,
        endRank: 14,
        points: 0,
        wins: 0,
        losses: 0,
        byTrack: {
          domestic: { points: 0, wins: 0, losses: 0, endRank: 10 },
          itf: { points: 0, wins: 0, losses: 0, endRank: 14 },
          wta: { points: 0, wins: 0, losses: 0, endRank: 12 },
        },
        fundsDeltaCents: 0,
        endFundsCents: 0,
      },
    ]
    // ⚠ The probe career's own three figures, to the place (`--arm 0`, docs/specs/
    // the-reckoning-2026-09.md §4b): #10 National, #14 International, #12 Professional.
    expect(bestRankOn(world, 'domestic')).toBe(10)
    expect(bestRankOn(world, 'itf')).toBe(14)
    expect(bestRankOn(world, 'wta')).toBe(12)
    // ...and the primary reader is one of those three rather than a fourth fold, which is what stops
    // a second copy of «what is her best rank» appearing the day the page grows its other two rows.
    expect(bestRankEver(world)).toEqual({ rank: 12, track: 'wta' })

    // ⚠ A TABLE SHE NEVER TOUCHED ANSWERS `null`, never a floor – so a caller can render one row for
    // the girl who stayed at home and three for the woman who went all the way, with no branch.
    const junior = leftAfterJuniors('r46-rC-g')
    expect(bestRankOn(junior, 'wta'), 'nothing recorded, nothing invented').toBeNull()
  })
})
