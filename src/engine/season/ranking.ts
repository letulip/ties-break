// Package L — the rolling ranking. Pure and total: a deterministic function of the
// results ledger and the current week. No RNG, no mutation of the input.

import type { RankingRow } from './types'

/** One awarded result. Mirrors the WorldState `results` entries added in Package M. */
export interface SeasonResult {
  playerId: string
  week: number
  points: number
}

const WINDOW_WEEKS = 52
const BEST_N = 6

// computeRanking — rolling 52-week window, best-6 results per player, dense ranks.
// Ties on points break by the more recent counted result; remaining ties keep a
// stable order (roster order, then first-appearance in results). Passing `roster`
// makes the table total: every roster member appears, zero-point players ranked
// after pointed ones in stable order.
export function computeRanking(
  results: SeasonResult[],
  currentWeek: number,
  roster?: string[],
): RankingRow[] {
  // Keep only results inside the window (age ≤ 52 weeks, not in the future).
  const perPlayer = new Map<string, SeasonResult[]>()
  for (const res of results) {
    if (res.week > currentWeek || currentWeek - res.week > WINDOW_WEEKS) continue
    const list = perPlayer.get(res.playerId)
    if (list) list.push(res)
    else perPlayer.set(res.playerId, [res])
  }

  // Stable base order: roster first (if given), then any player seen only in results.
  const order: string[] = []
  const seen = new Set<string>()
  const add = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      order.push(id)
    }
  }
  if (roster) for (const id of roster) add(id)
  for (const res of results) add(res.playerId)

  // Per player: best-6 points sum + recency (latest week among the counted six).
  const rows = order.map((playerId, idx) => {
    const list = (perPlayer.get(playerId) ?? [])
      .slice()
      .sort((a, b) => b.points - a.points || b.week - a.week)
    const best = list.slice(0, BEST_N)
    const points = best.reduce((sum, x) => sum + x.points, 0)
    const recency = best.length ? Math.max(...best.map((x) => x.week)) : -1
    return { playerId, points, recency, idx }
  })

  rows.sort((a, b) => b.points - a.points || b.recency - a.recency || a.idx - b.idx)

  // Dense ranks: rank increments only when the points value changes.
  const ranking: RankingRow[] = []
  let rank = 0
  let prevPoints: number | null = null
  for (const row of rows) {
    if (prevPoints === null || row.points !== prevPoints) {
      rank++
      prevPoints = row.points
    }
    ranking.push({ playerId: row.playerId, points: row.points, rank })
  }
  return ranking
}
