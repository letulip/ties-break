// Package L – the cohort's PRE-HISTORY: one synthetic season of AI results, written once at
// `createWorld`, so a fresh career opens on a REAL ranking table instead of a 199-way tie at zero.
//
// WHY IT EXISTS (docs/specs/ladder-up-impl.md §Part A). Entrant fields are selected from AI
// ranking PERCENTILES. In year 1 every AI used to start at 0 points, so a "top international
// field" was indistinguishable from a local one – the owner saw both symptoms (R9-2: a
// Regional/National running in week 1 with a zero-point field; R8-9: a National champion missing
// from the top 10). The kid also shared the field's dense rank 1 and read "#1" on a brand-new save.
//
// WHY NEGATIVE WEEKS. `computeRanking` / `windowedBestSum` keep a rolling
// `[currentWeek - 52, currentWeek]` window, and `world.ts` prunes the ledger on the SAME rule
// (`world.week - r.week <= RESULTS_WINDOW`). Rows written at weeks [-51, -1] therefore
//   * count in full at week 0,
//   * age out one at a time across the first season, and
//   * are pruned away entirely by week 53
// with NO new field, NO decay logic and NO schema bump (results are already persisted as
// `{playerId, week, points}`). Verified against every week-sensitive read in the engine before
// committing to the shape – see the audit note in `world.ts` at the createWorld call site.
//
// RNG DISCIPLINE. Everything here is drawn from the purpose-scoped sub-stream
// `rngFromSeed(seed + ':prehistory')`, once, at world creation. The MAIN weekly stream is never
// touched, so the B1/C1 draw-stream freezes stay byte-identical.

import { rngFromSeed, pickInt } from '../rng'
import { TIERS } from './calendar'
import { topBandForPercentile } from './tournament'
import type { SeasonResult } from './ranking'
import type { AiPlayer } from './types'

/** Oldest pre-history week. `0 - 51 <= 52`, so the whole block still counts at week 0. */
export const PREHISTORY_FIRST_WEEK = -51
/** Newest pre-history week: the week before the career starts. 51 slots in all (-51 … -1). */
export const PREHISTORY_LAST_WEEK = -1

// --- distribution knobs -------------------------------------------------------
// The target shape (spec): "a realistic pyramid – a few strong players with several counting
// results, a long tail with one or two", strength CORRELATED with the player's skills.

/** Uniform ± half of this is added to a player's skill mean before ordering, so the table
 *  correlates with skill without being a straight copy of it – real seasons have over- and
 *  under-performers, and a perfectly skill-ordered table would make the standings redundant. */
const PERFORMANCE_JITTER = 10

/** Counting results = 1 + round(RESULT_SPAN × (1 − q)^RESULT_SHAPE) + a coin flip, where q is the
 *  player's percentile (0 = best). q≈0 → 6-7 results (a full best-6 book), q=0.5 → 3-4, q=1 → 1-2. */
const RESULT_SPAN = 5
const RESULT_SHAPE = 1.6

/** Finish depth = rng()^(1 + DEPTH_SKEW × (1 − q)): the top of the table converts its entries into
 *  titles and finals, the tail exits early. At q=1 the exponent is 1, i.e. a flat draw. */
const DEPTH_SKEW = 2.5

/**
 * One synthetic season of AI results for `cohort`, deterministic in `seedStr`.
 *
 * Pure: the cohort is read, never mutated, and no other state is consulted – so the ledger is a
 * function of (seed, cohort) alone and two careers on the same seed always open identically.
 */
export function generatePreHistory(seedStr: string, cohort: AiPlayer[]): SeasonResult[] {
  const rng = rngFromSeed(`${seedStr}:prehistory`)
  const size = cohort.length
  if (size === 0) return []

  // Strength = the flat mean of the four attributes the match engine actually reads, so a player
  // who sits high in this table is genuinely one who wins matches. One jitter draw per player, in
  // cohort order, so the draw sequence is fixed by the cohort alone.
  const ordered = cohort
    .map((p) => ({
      p,
      score: (p.serve + p.ret + p.composure + p.stamina) / 4 + (rng() - 0.5) * PERFORMANCE_JITTER,
    }))
    .sort((a, b) => b.score - a.score)

  const results: SeasonResult[] = []
  ordered.forEach(({ p }, pos) => {
    // Percentile in (0, 1], 0 = best – the SAME convention selectEntrants uses, so a player's
    // pre-history is earned at the HIGHEST tier she will actually be entering from week 1. That
    // matters once the J family is live: if the elite's history were domestic-only, the first
    // week of real J300 results (1000 for a title) would blow the table away instantly.
    const q = (pos + 1) / size
    const tier = topBandForPercentile(q)
    const points = TIERS[tier].points

    const count = 1 + Math.round(RESULT_SPAN * (1 - q) ** RESULT_SHAPE) + (rng() < 0.5 ? 1 : 0)
    // One result per week per player (a player cannot be in two draws at once). `count` is at most
    // 7 and there are 51 slots, so the walk always terminates.
    const usedWeeks = new Set<number>()
    for (let i = 0; i < count; i++) {
      const depth = rng() ** (1 + DEPTH_SKEW * (1 - q))
      const finish = Math.min(points.length - 1, Math.floor(depth * points.length))
      let week = -pickInt(rng, -PREHISTORY_LAST_WEEK, -PREHISTORY_FIRST_WEEK)
      while (usedWeeks.has(week)) week = week === PREHISTORY_LAST_WEEK ? PREHISTORY_FIRST_WEEK : week + 1
      usedWeeks.add(week)
      // Every tier's points array is strictly positive, so every drawn finish is a counting result:
      // that is what makes the KID the only 0-point player on the table at week 0.
      results.push({ playerId: p.id, week, points: points[finish] })
    }
  })

  // Week-ascending, mirroring how the live ledger grows (append per resolved week). Ties keep the
  // per-player insertion order, so the array is stable for the golden/save round-trip.
  results.sort((a, b) => a.week - b.week)
  return results
}
