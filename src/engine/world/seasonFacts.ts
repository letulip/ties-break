// WHAT A FINISHED SEASON SAYS ABOUT HER YEAR – ONE SPELLING, shared by the seats' year-end letters and the
// seats' raise requests.
//
// ⭐ ROUND 45 #3b (owner, 02.10): the size of a raise request floats with how the year went, so the request
// has to read «her year» from somewhere. The staff's own year-end letters (`world/staffLetters.ts`, round 44
// #7) already read it off the banked `SeasonHistoryEntry` rows and `trophiesByTier`; these two helpers WERE
// private to that file. They are moved here verbatim – a leaf with no seat module behind it – so the letter
// that REPORTS her year and the request that is SIZED by it can never disagree about what the year held.
//
// ⚠ A LEAF ON PURPOSE: calendar and types only. `staffLetters.ts` reaches every seat module (their hire tags),
// and every seat module reaches `staffRaise.ts`, so the raise's verdict could not import it back without
// closing a cycle (`tests/import-cycles.test.ts`).
//
// ⚠ PURE READS, ZERO DRAWS. Nothing here persists anything.

import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../season/calendar'
import type { LadderTrack } from '../season/types'
import type { WorldState } from './state'

/** The weeks a season is actually PLAYED in – the window the wrap-up itself folds over
 *  (`[yearStart, wrapWeek)`, and `wrapWeek` is the first off-season week). Not 52: the three quiet
 *  weeks carry no tournament and no ranking, and a seat cannot be judged on them. */
export const SEASON_PLAYED_WEEKS = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** HER TITLES INSIDE ONE SEASON, counted off `trophiesByTier` – which stores absolute WEEKS and is
 *  never pruned, so a season's tally is exact however old it is. (The event feed is not: it caps at
 *  400 rows by COUNT, which is how the wrap-up once reported «no tournaments played» over a 44-19
 *  year. `seasonBestFinish` made the same move for the same reason.) */
export function titlesInSeason(world: WorldState, fromWeek: number, untilWeek: number): number {
  let titles = 0
  for (const tier of Object.values(world.trophiesByTier ?? {})) {
    for (const w of tier?.titles ?? []) if (w >= fromWeek && w < untilWeek) titles += 1
  }
  return titles
}

/** WHERE SHE FINISHED THE YEAR AND WHICH TABLE THAT IS A RANK ON.
 *
 *  ⚠ `SeasonHistoryEntry.endRank` IS THE ITF ALIAS, ALWAYS, and printing it unqualified over a
 *  twenty-one-year-old professional is the defect the wrap-up's own rank line had to fix («Unranked
 *  internationally – she has not played a Junior Tour event yet», shown to a WTA player). `byTrack`
 *  is what tells the three tables apart, so the track carrying the most points that season is the
 *  one the letter names.
 *
 *  ⚠ ABSENT TOGETHER ON A PRE-v46 ROW, which carries no `byTrack` at all. Absent is «not recorded»
 *  and never zero – `SeasonTrackRow`'s own rule, and the season mirror's: a figure printed over a
 *  season nobody counted is the class of defect that reported «no tournaments played» over 44-19. */
export function seasonRankOf(row: {
  endRank: number
  byTrack?: Record<LadderTrack, { endRank?: number; points: number }>
}): { endRank?: number; rankTrack?: LadderTrack } {
  if (!row.byTrack) return {}
  let best: { track: LadderTrack; points: number } | null = null
  for (const track of ['domestic', 'itf', 'wta'] as LadderTrack[]) {
    const r = row.byTrack[track]
    if (!r || r.endRank === undefined) continue
    if (!best || r.points > best.points) best = { track, points: r.points }
  }
  if (!best) return {}
  return { endRank: row.byTrack[best.track].endRank, rankTrack: best.track }
}
