// Package L – the rolling ranking. Pure and total: a deterministic function of the
// results ledger and the current week. No RNG, no mutation of the input.

import type { LadderTrack, RankingRow, TierId } from './types'

/** ONE APPEARANCE in a draw – "she was in it", with what it paid.
 *
 *  SHE PLAYED and SHE SCORED are two different facts and this row carries BOTH: the (playerId,
 *  week, tier) triple says she was in that draw, `points` says what the finish was worth. They used
 *  to be the same fact – every finish paid something, so "has a row" and "played" were
 *  interchangeable – and wave B's first-round zero pulled them apart (docs/specs/
 *  wave-b-first-round-zero.md §5). A scoreless row is therefore NORMAL and load-bearing: it is the
 *  only record `season/rival.ts` has that a cohort player spent that week travelling and playing
 *  rather than resting.
 *
 *  Which half a reader wants is now an explicit choice, made through `isCountingResult` below –
 *  never by re-spelling `points > 0` at each site, which is exactly how the two halves of the
 *  engine came to disagree in the first place. */
export interface SeasonResult {
  playerId: string
  week: number
  /** what the finish PAID. 0 is a real, written value: a first-round exit (every tier, wave B). */
  points: number
  /** the tier this result was earned at (round-5: set on kid results for the "counting
   *  results" list; optional so AI results and pre-r5 saves can omit it). Never affects ranking. */
  tier?: TierId
}

/** THE ranking half of the row: a result COUNTS when it scored. A scoreless appearance is a record
 *  of play, not an achievement – it never enters the standings, the best-6 sum, or the kid's
 *  counting-results list. Splitting it out here (rather than leaving a `points > 0` in each reader)
 *  is what keeps the standings arithmetic byte-identical now that scoreless rows exist: without it
 *  a scoreless row would lend its week to `recency`, silently reordering tied players and with them
 *  the entrant percentiles `selectEntrants` reads. */
export function isCountingResult(r: SeasonResult): boolean {
  return r.points > 0
}

const WINDOW_WEEKS = 52

/** HOW MANY RESULTS A TABLE COUNTS - the adult best-16 window, per track (W2-LADDER;
 *  act2-pro-tour.md §3, the owner's 30.07 call re-affirmed 02.08).
 *
 *  ⚠ THE SPLIT IS THE REAL SPORT'S OWN. The ITF junior ranking counts "the six best singles
 *  results" (Reg 10, verbatim in ranking-points-by-tier.md §1) and our domestic ladder has always
 *  mirrored it; the WTA ranking counts SIXTEEN. Under best-6 a professional season was worth
 *  nothing past six results - "playing more" bought points for nobody - which wasted the
 *  availability currency the load-manager wave built precisely where scheduling becomes the game:
 *  fatigue's ladder D prices a dense season at ~15-20 events, so sixteen counted results is
 *  "almost everything a full season earns", a thin season is visibly thin, and a full one is worth
 *  playing.
 *
 *  ⚠ A PLAIN OBJECT, NOT `as const`, DELIBERATELY: the before/after bench
 *  (tools/best16-bench.ts) patches `.wta` back to 6 for its A arm and restores it - the same
 *  patch-and-restore idiom the fatigue bench uses on `matchWeekRecoveryBase`. Engine code never
 *  writes it. */
export const BEST_N_BY_TRACK: Record<LadderTrack, number> = { domestic: 6, itf: 6, wta: 16 }

/** A single player's windowed best-N points sum at `currentWeek` – the exact value
 *  `computeRanking` assigns as that player's `points`. Pure; ignores `tier`. Used to
 *  diff the effective ranking delta of a freshly-added result (round-5 item 1).
 *  Scoreless appearances are skipped: they add 0 to the sum but would otherwise consume best-N
 *  slots from a player who has fewer than N counting results.
 *
 *  ⚠ `bestN` IS REQUIRED AND SITS BEFORE THE FILTER, DELIBERATELY (W2-LADDER §3). The window
 *  width stopped being one number when the adult table went to best-16, and a default of 6 here
 *  would be a silent way to count a professional season on the junior rule - the exact class of
 *  "one answer to two questions" bug the two-ladders work spent a round unpicking. Every caller
 *  therefore states its track's N (BEST_N_BY_TRACK above), and the compiler visits them all. */
export function windowedBestSum(
  results: SeasonResult[],
  currentWeek: number,
  playerId: string,
  /** the track's window width - BEST_N_BY_TRACK[track] at every real call site */
  bestN: number,
  /** Same track filter `computeRanking` takes, for the same reason: her domestic points and her ITF
   *  points are two numbers, and every caller has to say which one it is asking for. */
  countsFor?: (r: SeasonResult) => boolean,
): number {
  return results
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === playerId &&
        (!countsFor || countsFor(r)) &&
        r.week <= currentWeek &&
        currentWeek - r.week <= WINDOW_WEEKS,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .slice(0, bestN)
    .reduce((sum, r) => sum + r.points, 0)
}

// computeRanking – rolling 52-week window, best-N results per player (N is the TRACK's window
// width, stated by every caller – see BEST_N_BY_TRACK), competition
// ranks (ties share a rank; the next rank skips by the tie count, e.g. 4, 4, 6).
// Ties on points break by the more recent counted result for *order* only; remaining
// ties keep a stable order (roster order, then first-appearance in results). Passing
// `roster` makes the table total: every roster member appears, zero-point players
// ranked after pointed ones in stable order.
//
// A STANDINGS TABLE IS BUILT FROM COUNTING RESULTS ONLY (`isCountingResult`). The ledger also
// carries scoreless appearances now – the record a played-but-unrewarded week leaves for the
// fatigue reconstruction – and they are dropped here BEFORE anything reads them, in both places a
// row can enter the table: the per-player list and the "seen only in results" tail of the base
// order. So showing up and losing your opener neither banks points nor puts you on the table nor
// refreshes your `recency`, which is exactly the pre-wave-B behaviour this function must keep.
export function computeRanking(
  results: SeasonResult[],
  currentWeek: number,
  /** THE TRACK'S WINDOW WIDTH, REQUIRED AND THIRD (W2-LADDER §3): best-6 for domestic/itf, best-16
   *  for the professional table (BEST_N_BY_TRACK). Required for the same reason `kidPoints` has no
   *  default track - "how many results count" stopped having one answer, and a silent 6 would fold
   *  a professional season on the junior rule without a single call site changing. Placed before
   *  the optional pair so the compiler walks every caller. */
  bestN: number,
  roster?: string[],
  /** TWO TABLES OUT OF ONE LEDGER (docs/specs/two-ladders.md). A result already carries the tier it
   *  was won at, so a track is a filter and not a second ledger - which is why two ranking tables
   *  cost no persisted state, no schema bump and no migration. Absent ⇒ every result counts, which
   *  is what the pre-history generator and the old single-table callers want. */
  countsFor?: (r: SeasonResult) => boolean,
): RankingRow[] {
  // Keep only counting results inside the window (age ≤ 52 weeks, not in the future).
  const perPlayer = new Map<string, SeasonResult[]>()
  for (const res of results) {
    if (!isCountingResult(res)) continue
    if (countsFor && !countsFor(res)) continue
    if (res.week > currentWeek || currentWeek - res.week > WINDOW_WEEKS) continue
    const list = perPlayer.get(res.playerId)
    if (list) list.push(res)
    else perPlayer.set(res.playerId, [res])
  }

  // WHO IS IN THE TABLE. A roster, when one is passed, is now a FILTER and not merely a base order.
  //
  // ⚠ THE BUG THIS CLOSES. It used to seed the order from the roster and then add anybody with a
  // counting result in the window, roster or not. That was harmless while every id with results
  // stayed in the cohort for ever - and the junior conveyor made it a bug: a player who leaves at
  // nineteen keeps her results for 52 weeks, so for a year afterwards she still held a ranking
  // place, printed as a raw id (her card is gone, so `computeStandings` falls back to the id) and
  // pushing everyone below her - the kid included - down a spot. Seen live on the Stats screen:
  // "ai-153", 1715 pts. See docs/specs/junior-conveyor.md.
  //
  // With NO roster the old behaviour stands: rank whoever has results. That is what the pre-history
  // generator and several tests want, and it is a different question ("who scored?") from the one a
  // roster asks ("where do these players stand?").
  const order: string[] = []
  const seen = new Set<string>()
  const add = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      order.push(id)
    }
  }
  if (roster) for (const id of roster) add(id)
  else for (const res of results) if (isCountingResult(res)) add(res.playerId)

  // Per player: best-N points sum + recency (latest week among the counted N).
  const rows = order.map((playerId, idx) => {
    const list = (perPlayer.get(playerId) ?? [])
      .slice()
      .sort((a, b) => b.points - a.points || b.week - a.week)
    const best = list.slice(0, bestN)
    const points = best.reduce((sum, x) => sum + x.points, 0)
    const recency = best.length ? Math.max(...best.map((x) => x.week)) : -1
    return { playerId, points, recency, idx }
  })

  rows.sort((a, b) => b.points - a.points || b.recency - a.recency || a.idx - b.idx)

  // Competition ranks (standard "1224" numbering, same convention real tennis rankings
  // use): tied points share one rank, and the next distinct points value takes the rank
  // equal to how many players sit ahead of it (+1) – i.e. it skips by the tie count
  // (4, 4, 6 – never 4, 4, 5). Recency (set above, sort only) still breaks the *order*
  // among equal-points players; it never affects the rank number they share.
  const ranking: RankingRow[] = []
  let rank = 0
  let prevPoints: number | null = null
  rows.forEach((row, i) => {
    if (prevPoints === null || row.points !== prevPoints) {
      rank = i + 1
      prevPoints = row.points
    }
    ranking.push({ playerId: row.playerId, points: row.points, rank })
  })
  return ranking
}
