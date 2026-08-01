/**
 * Dual-universe double-pay bench – P5 PHASE A, measurement only.
 * Spec: docs/specs/dual-universe.md · Proposal: docs/review/proposals/P5-dual-universe-bench.md
 *
 * THE QUESTION. Every event she enters is played twice and paid twice: `tickWeek` step 4 runs the
 * canonical AI-only bracket for ALL scheduled events, hers included (world.ts:4479-4483 – no
 * exclusion for the entered event), while her own run is a separate shadow bracket on
 * `seed:kidtour:<event.id>` whose AI finishes are computed and thrown away – `finalizeTournament`
 * commits ONLY her row (world.ts:3724). So she can never take points off a rival: the rival she
 * beats in the shadow final banks whatever the canonical universe handed him the same week. This
 * bench quantifies that bias against a PRE-REGISTERED threshold (spec §2, committed before the
 * first sweep ran) so the Phase B decision is a measurement, not a hunch.
 *
 * THE METHOD – a counterfactual ledger, open-loop. For every week she actually played, the bench
 * captures the full shadow finish table off `world.pendingTournament` (complete at spawn – the
 * PendingTournament contract, world.ts:185-199) and the canonical rows the engine really ledgered
 * for the same (week, tier). At each measurement week it builds a mirror of `world.results` in
 * which the canonical AI rows of her played events are replaced by shadow-derived rows, and runs
 * `computeRanking` over both ledgers. The swap key (week, tier, non-kid) is unique per event:
 * `buildSeason` tracks occupancy PER TIER (calendar.ts:711-718) and the event id itself is
 * `${year}-w${week}-${tier}` (calendar.ts:691). OPEN-LOOP, stated plainly: entrant selection and
 * rival fatigue still ran on the canonical ledger, so this is a first-order estimate – the
 * closed-loop number would come from Phase B's before/after paired re-run.
 *
 * ENGINE-UNTOUCHED, and how. The careers are stepped by the fatigue bench's own
 * `openFatigueCareer`/`stepFatigueWeek` (same axes, same `fatigue-<background>-<i>` seed strings,
 * so a cell here is byte-for-byte the same career as the matching `bench:fatigue` cell). But
 * `stepFatigueWeek` spawns AND closes the pending tournament inside one call, so the shadow table
 * is gone by the time it returns. Rather than fork its ~60-line entry policy (a divergence bomb),
 * the bench arms a plain property interceptor on `world.pendingTournament` before stepping:
 * `Object.defineProperty` get/set over a backing slot. The engine reads/writes the property exactly
 * as before, zero RNG draws anywhere, and the one assignment site (world.ts:4398) hands us the
 * spawn. Walkover and medical-withdrawal weeks never assign it (world.ts:4333-4386), so they are
 * naturally invisible here – correct, because in a one-universe world those weeks stay canonical.
 *
 * DETERMINISTIC by construction: no Date.now, no Math.random – seeds only, and the interceptor
 * adds no draw on any stream. Same cell twice ⇒ byte-identical CSV (unit-tested).
 *
 * BASELINE ATTRIBUTION: the output carries a code fingerprint (git rev-parse HEAD, '-dirty' when
 * the tree is not clean) because this run is BASELINE #1 on pre-population main and the spec
 * REQUIRES a re-run after feat/living-field merges (it changes W-tier field composition) before
 * any Phase B decision. Two runs must be attributable to their engine revisions.
 *
 * Run:  npm run bench:dual
 *       npx vite-node tools/dual-universe-bench.ts -- --csv /path/rows.csv
 *       npx vite-node tools/dual-universe-bench.ts -- --seeds 8   (quick look; the spec sweep is 30)
 */

// MUST come before the dynamic import below – the exact pattern of tools/points-curve.ts:28-40.
// fatigue-bench.ts self-runs its whole `main()` on import outside vitest, which is exactly right
// for `npm run bench:fatigue` and exactly wrong for borrowing its axes here; static ESM imports are
// hoisted, so the borrow has to be a DYNAMIC import placed after this assignment. The pre-set value
// is captured first so THIS file keeps the same importer contract for whoever borrows from it next.
const IMPORTED_WITH_NO_AUTORUN = !!process.env.TB_BENCH_NO_AUTORUN
process.env.TB_BENCH_NO_AUTORUN = '1'

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { computeRanking } from '../src/engine/season/ranking'
import { inTrack, KID_ID } from '../src/engine/world'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { RankingRow, TierId, LadderTrack } from '../src/engine/season/types'
import type { WorldState, PendingTournament } from '../src/engine/world'
import type { Profile, Policy } from './fatigue-bench'

const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek, mean } = await import('./fatigue-bench')

// --- the pre-registered frame (spec §2 – do not move these after numbers exist) -----------------

/** The rank-plateau cell: money never binds, the default player's habits. */
export const CELL_PROFILE: Profile = PROFILES.find((p) => p.background === 'wealthy')!
export const CELL_POLICY: Policy = POLICIES.find((p) => p.id === 'balanced')!

export const SEEDS_PER_CELL = 30
/** ±10 table places – rank-plateau §1's peer definition, unchanged. */
export const PEER_SPAN = 10
/** = RESULTS_WINDOW (world.ts:496) = WINDOW_WEEKS (ranking.ts, private). Restated here because both
 *  are module-private; the counterfactual must prune on the very same rule the engine does. */
export const WINDOW_WEEKS = 52

export interface Horizon {
  weeks: number
  /** measurement weeks – state read at END of week w, post-commit, post-housekeep. */
  measureAt: number[]
}
/** 208w = the 14→18 career the outcome targets are written against; 416w = the adult continuation.
 *  The 208-horizon careers are PREFIXES of the 416 ones (same seed strings, same stream), which the
 *  sweep exploits as a free determinism cross-check: h208@w and h416@w must agree per seed. */
export const HORIZONS: Horizon[] = [
  { weeks: 208, measureAt: [104, 208] },
  { weeks: 416, measureAt: [104, 208, 312, 416] },
]

/** Pre-registered materiality threshold (spec §2): the bias is material if EITHER trips. */
export const THRESHOLD_SUPPRESSION_PLACES = 10 // median ITF suppression > this, at any (horizon, week) cell
export const THRESHOLD_INVERSION_SHARE = 0.25 // careers with ≥1 beaten-rival inversion at week 208 > this
export const THRESHOLD_INVERSION_WEEK = 208

// --- capture ------------------------------------------------------------------------------------

/** One played event, both universes of it. */
export interface PlayedEventCapture {
  week: number
  tier: TierId
  eventId: string
  /** the SHADOW bracket's full finish table (dense over the draw, kid included), snapshotted at
   *  spawn – world.ts:4398 assigns it fully computed, and nothing mutates it afterwards. */
  finishes: Record<string, number>
  /** rivals she beat in this run (kid matches with winnerId === KID_ID). */
  beatenIds: string[]
  shadowChampionId: string | null
  /** what the CANONICAL bracket really ledgered at this (week, tier) – non-kid rows copied out of
   *  `world.results` after the week closed (runAiTournament pushed them, world.ts:3870-3873). */
  canonicalRows: SeasonResult[]
  canonicalChampionId: string | null
}

/** Everything the interceptor can know at spawn time (canonical rows land later the same tick). */
interface SpawnCapture {
  week: number
  tier: TierId
  eventId: string
  finishes: Record<string, number>
  beatenIds: string[]
  shadowChampionId: string | null
}

/** Arm a get/set interceptor on `world.pendingTournament`. The engine's one non-null assignment
 *  (world.ts:4398) fires `onSpawn` with the fully-computed shadow run; reads and null-assignments
 *  behave exactly as a plain property. Zero draws on any stream – pure JS property plumbing. */
export function armShadowCapture(
  world: { pendingTournament: PendingTournament | null },
  onSpawn: (p: PendingTournament) => void,
): void {
  let backing: PendingTournament | null = world.pendingTournament
  Object.defineProperty(world, 'pendingTournament', {
    configurable: true,
    enumerable: true,
    get: () => backing,
    set: (v: PendingTournament | null) => {
      if (v) onSpawn(v)
      backing = v
    },
  })
}

// --- the counterfactual ledger (pure – unit-tested on a hand-built fixture) ---------------------

/** Shadow-derived AI rows for one played event: exactly the rows `runAiTournament` would have
 *  written had the shadow bracket been the paying one – every entrant of the draw leaves a row,
 *  scoring or not (`points[finish] ?? 0`, world.ts:3870-3873), tier recorded, kid excluded (her
 *  own row is already in the real ledger via finalizeTournament and is identical in both
 *  universes). Keeping the 0-point appearance rows costs nothing and keeps the mirror shaped like
 *  the ledger it mirrors – `computeRanking` drops them via `isCountingResult` either way. */
export function shadowAiRows(finishes: Record<string, number>, week: number, tier: TierId): SeasonResult[] {
  const pts = TIERS[tier].points
  const rows: SeasonResult[] = []
  for (const [playerId, finish] of Object.entries(finishes)) {
    if (playerId === KID_ID) continue
    rows.push({ playerId, week, points: pts[finish] ?? 0, tier })
  }
  return rows
}

/** The mirror ledger: `results` with the canonical AI rows of her played events replaced by
 *  shadow-derived rows. The swap keys on (week, tier, non-kid) – unique per event because a tier
 *  runs at most one event per week (buildSeason occupancy is per tier, calendar.ts:711-718, and the
 *  id is `${year}-w${week}-${tier}`, calendar.ts:691). Rows with no tier are pre-r5 kid history
 *  and are never swapped. Events older than WINDOW_WEEKS are skipped entirely: the engine prunes
 *  both universes' rows on the same 52-week rule (world.ts:496), and `computeRanking` re-filters
 *  the window anyway, so a stale swap could only add noise. Pure: no world, no RNG, no clock. */
export function counterfactualLedger(
  results: readonly SeasonResult[],
  played: readonly Pick<PlayedEventCapture, 'week' | 'tier' | 'finishes'>[],
  currentWeek: number,
): SeasonResult[] {
  const inWindow = played.filter((p) => p.week <= currentWeek && currentWeek - p.week <= WINDOW_WEEKS)
  const swapped = new Set(inWindow.map((p) => `${p.week}:${p.tier}`))
  const out = results.filter(
    (r) => r.playerId === KID_ID || r.tier === undefined || !swapped.has(`${r.week}:${r.tier}`),
  )
  for (const p of inWindow) out.push(...shadowAiRows(p.finishes, p.week, p.tier))
  return out
}

// --- table lookups (pure) -----------------------------------------------------------------------

/** Competition rank of `id`; absent ⇒ one past the table, `recomputeKidRank`'s own fallback. */
export function rankOf(rows: readonly RankingRow[], id: string): number {
  return rows.find((r) => r.playerId === id)?.rank ?? rows.length + 1
}

export function pointsOf(rows: readonly RankingRow[], id: string): number {
  return rows.find((r) => r.playerId === id)?.points ?? 0
}

/** Rank-plateau §1's peers: the AI players within ±`span` TABLE PLACES (order positions, not rank
 *  numbers – ties share a rank number but not a row) of her position in `rows`. */
export function peerIds(rows: readonly RankingRow[], kidId: string, span = PEER_SPAN): string[] {
  const kidIdx = rows.findIndex((r) => r.playerId === kidId)
  if (kidIdx === -1) return []
  return rows
    .slice(Math.max(0, kidIdx - span), kidIdx + span + 1)
    .filter((r) => r.playerId !== kidId)
    .map((r) => r.playerId)
}

/** Beaten-rival inversions: rivals she beat on court who sit ABOVE her in the real table (strictly
 *  better rank number) and BELOW her in the counterfactual (strictly worse). Strict on both sides:
 *  a tie is not an inversion. */
export function countInversions(
  beaten: readonly string[],
  real: readonly RankingRow[],
  cf: readonly RankingRow[],
  kidId: string,
): number {
  const kidReal = rankOf(real, kidId)
  const kidCf = rankOf(cf, kidId)
  let n = 0
  for (const id of new Set(beaten)) {
    if (rankOf(real, id) < kidReal && rankOf(cf, id) > kidCf) n++
  }
  return n
}

export function median(xs: readonly number[]): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// --- one career ---------------------------------------------------------------------------------

const TRACKS: LadderTrack[] = ['domestic', 'itf', 'wta']

export interface MeasurePoint {
  week: number
  /** competition rank per track, real ledger vs counterfactual. ITF is the headline (kidRank's own
   *  table, rank-plateau's "her rank"); domestic and wta ride along as supporting columns. */
  rankReal: Record<LadderTrack, number>
  rankCf: Record<LadderTrack, number>
  /** headline metric (a): rankReal.itf − rankCf.itf. Positive = the double-pay costs her places. */
  suppressionItf: number
  /** her own windowed best-6 on the ITF table – MUST be identical in both ledgers (her rows are
   *  untouched by the swap); the runner throws if not, as a self-check of the builder. */
  kidPointsItf: number
  /** metric (b): peers fixed on the REAL ITF table (±PEER_SPAN places), their mean points there vs
   *  the same ids' mean points on the counterfactual table. Positive delta = points the double-pay
   *  handed exactly the players she is racing. */
  peerMeanReal: number
  peerMeanCf: number
  peerDelta: number
  peersN: number
  /** metric (c): beaten-rival inversions on the ITF table, beaten set = rivals she beat in played
   *  events inside the current 52w window (older events differ in neither ledger). */
  beatenConsidered: number
  inversions: number
  /** played events inside the current 52w window – the events the swap actually touches. When this
   *  is 0 the two ledgers coincide and every delta above is exactly 0 BY CONSTRUCTION (she has no
   *  tournament activity in the ranking window), which is a fact about the career, not the bias. */
  playedInWindow: number
  /** metric (d): CANONICAL points banked by AI players out of her entered events – career-cumulative
   *  at this week, and normalised per season. This is the raw double-paid volume. */
  playedEvents: number
  doublePaidPts: number
  doublePaidPerSeason: number
  /** supporting: played events where the news' champion (shadow, world.ts:3736-3744) differs from
   *  the champion the table actually paid (canonical) – the on-screen contradiction, counted. */
  championContradictions: number
}

export interface DualRun {
  seed: string
  seedIndex: number
  horizonWeeks: number
  points: MeasurePoint[]
}

function measure(world: WorldState, played: readonly PlayedEventCapture[]): MeasurePoint {
  const w = world.week
  // Same roster recomputeKidRank ranks against: the live cohort + her (world.ts:699-701, 749-757).
  const roster = [...world.cohort.map((c) => c.id), KID_ID]
  const cfResults = counterfactualLedger(world.results, played, w)

  const rankReal = {} as Record<LadderTrack, number>
  const rankCf = {} as Record<LadderTrack, number>
  let realItf: RankingRow[] = []
  let cfItf: RankingRow[] = []
  for (const track of TRACKS) {
    const real = computeRanking(world.results, w, roster, inTrack(track))
    const cf = computeRanking(cfResults, w, roster, inTrack(track))
    rankReal[track] = rankOf(real, KID_ID)
    rankCf[track] = rankOf(cf, KID_ID)
    if (track === 'itf') {
      realItf = real
      cfItf = cf
    }
  }

  const kidPointsItf = pointsOf(realItf, KID_ID)
  const kidPointsItfCf = pointsOf(cfItf, KID_ID)
  if (kidPointsItf !== kidPointsItfCf) {
    // Her rows are the one thing the swap must never touch; a drift here means the builder swapped
    // a kid row or invented one, and every number downstream would be garbage. Fail loudly.
    throw new Error(`counterfactual moved HER points at week ${w}: ${kidPointsItf} -> ${kidPointsItfCf}`)
  }

  const peers = peerIds(realItf, KID_ID)
  const peerMeanReal = peers.length ? mean(peers.map((id) => pointsOf(realItf, id))) : 0
  const peerMeanCf = peers.length ? mean(peers.map((id) => pointsOf(cfItf, id))) : 0

  const playedSoFar = played.filter((p) => p.week <= w)
  const playedInWindow = playedSoFar.filter((p) => w - p.week <= WINDOW_WEEKS)
  const beaten = playedInWindow.flatMap((p) => p.beatenIds)
  const doublePaidPts = playedSoFar.reduce(
    (s, p) => s + p.canonicalRows.reduce((t, r) => t + r.points, 0),
    0,
  )
  const championContradictions = playedSoFar.filter(
    (p) => p.shadowChampionId !== null && p.canonicalChampionId !== null && p.shadowChampionId !== p.canonicalChampionId,
  ).length

  return {
    week: w,
    rankReal,
    rankCf,
    suppressionItf: rankReal.itf - rankCf.itf,
    kidPointsItf,
    peerMeanReal,
    peerMeanCf,
    peerDelta: peerMeanReal - peerMeanCf,
    peersN: peers.length,
    beatenConsidered: new Set(beaten).size,
    inversions: countInversions(beaten, realItf, cfItf, KID_ID),
    playedInWindow: playedInWindow.length,
    playedEvents: playedSoFar.length,
    doublePaidPts,
    doublePaidPerSeason: w === 0 ? 0 : doublePaidPts / (w / WEEKS_PER_YEAR),
    championContradictions,
  }
}

/** One paired-seed career: the REAL universe is stepped exactly as `bench:fatigue` steps it (same
 *  helpers, same plannerState shape, same seed string), the counterfactual is derived – never
 *  stepped – so "paired" is structural, not a promise. */
export function runDualCareer(
  profile: Profile,
  policy: Policy,
  index: number,
  horizon: Horizon,
): DualRun {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)

  const played: PlayedEventCapture[] = []
  let spawn: SpawnCapture | null = null
  armShadowCapture(world, (p) => {
    // At assignment time (world.ts:4398) the week is already the play week and the event is in
    // `world.season`; the finish table is complete (PendingTournament contract, world.ts:185-199).
    // Canonical rows for the same (week, tier) do not exist yet – step 4 runs later the same tick –
    // so the capture completes after the step returns.
    const event = world.season.find((e) => e.id === p.eventId)
    if (!event) throw new Error(`shadow spawn for unknown event ${p.eventId}`)
    const beatenIds: string[] = []
    for (const m of p.result.matches) {
      if (m.aId !== KID_ID && m.bId !== KID_ID) continue
      if (m.winnerId === KID_ID) beatenIds.push(m.aId === KID_ID ? m.bId : m.aId)
    }
    spawn = {
      week: world.week,
      tier: event.tier,
      eventId: p.eventId,
      finishes: { ...p.result.finishes },
      beatenIds,
      shadowChampionId: Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0] ?? null,
    }
  })

  // The same per-career plannerState `runFatigueCareer` threads through (fatigue-bench.ts:1022) –
  // letting stepFatigueWeek fall back to its per-call default would reset the practice/vacation
  // memory every week and quietly step a DIFFERENT career than bench:fatigue does.
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const measureAt = new Set(horizon.measureAt)
  const points: MeasurePoint[] = []

  for (let i = 0; i < horizon.weeks; i++) {
    stepFatigueWeek(world, rng, policy, plannerState)

    if (spawn !== null) {
      const s: SpawnCapture = spawn
      if (s.week !== world.week) throw new Error(`spawn week ${s.week} != closed week ${world.week}`)
      // The canonical bracket's ledger rows for her event, exactly as runAiTournament pushed them
      // this tick (world.ts:3870-3873): non-kid rows at the played (week, tier). Copied, because
      // the engine prunes this array later and the capture must outlive the window.
      const canonicalRows = world.results
        .filter((r) => r.week === s.week && r.tier === s.tier && r.playerId !== KID_ID)
        .map((r) => ({ ...r }))
      let canonicalChampionId: string | null = null
      let best = -1
      for (const r of canonicalRows) {
        if (r.points > best) {
          best = r.points
          canonicalChampionId = r.playerId
        }
      }
      played.push({ ...s, canonicalRows, canonicalChampionId })
      spawn = null
    }

    if (measureAt.has(world.week)) points.push(measure(world, played))
  }

  return { seed, seedIndex: index, horizonWeeks: horizon.weeks, points }
}

// --- aggregation --------------------------------------------------------------------------------

export interface CellSummary {
  horizonWeeks: number
  week: number
  seeds: number
  medianRankReal: number
  medianRankCf: number
  medianSuppressionItf: number
  minSuppressionItf: number
  maxSuppressionItf: number
  medianSuppressionDom: number
  medianSuppressionWta: number
  meanPeerDelta: number
  careersWithInversion: number
  meanInversions: number
  meanDoublePaidPerSeason: number
  meanPlayedPerSeason: number
  /** mean played events inside the 52w window at this measurement – 0 means the cell is vacuous
   *  (no activity for the swap to touch), which the spec must report as such. */
  meanPlayedInWindow: number
  contradictionShare: number
}

export function summarise(runs: readonly DualRun[], horizonWeeks: number, week: number): CellSummary {
  const pts = runs
    .filter((r) => r.horizonWeeks === horizonWeeks)
    .map((r) => r.points.find((p) => p.week === week))
    .filter((p): p is MeasurePoint => p !== undefined)
  const supp = pts.map((p) => p.suppressionItf)
  const contradTotal = pts.reduce((s, p) => s + p.championContradictions, 0)
  const playedTotal = pts.reduce((s, p) => s + p.playedEvents, 0)
  return {
    horizonWeeks,
    week,
    seeds: pts.length,
    medianRankReal: median(pts.map((p) => p.rankReal.itf)),
    medianRankCf: median(pts.map((p) => p.rankCf.itf)),
    medianSuppressionItf: median(supp),
    minSuppressionItf: Math.min(...supp),
    maxSuppressionItf: Math.max(...supp),
    medianSuppressionDom: median(pts.map((p) => p.rankReal.domestic - p.rankCf.domestic)),
    medianSuppressionWta: median(pts.map((p) => p.rankReal.wta - p.rankCf.wta)),
    meanPeerDelta: mean(pts.map((p) => p.peerDelta)),
    careersWithInversion: pts.filter((p) => p.inversions > 0).length,
    meanInversions: mean(pts.map((p) => p.inversions)),
    meanDoublePaidPerSeason: mean(pts.map((p) => p.doublePaidPerSeason)),
    meanPlayedPerSeason: mean(pts.map((p) => (p.week === 0 ? 0 : p.playedEvents / (p.week / WEEKS_PER_YEAR)))),
    meanPlayedInWindow: mean(pts.map((p) => p.playedInWindow)),
    contradictionShare: playedTotal === 0 ? 0 : contradTotal / playedTotal,
  }
}

/** The pre-registered verdict, computed – never eyeballed. */
export function verdict(runs: readonly DualRun[]): {
  material: boolean
  suppressionTripped: { horizonWeeks: number; week: number; median: number }[]
  inversionShare: number
  inversionTripped: boolean
} {
  const suppressionTripped: { horizonWeeks: number; week: number; median: number }[] = []
  for (const h of HORIZONS) {
    for (const w of h.measureAt) {
      const s = summarise(runs, h.weeks, w)
      if (s.seeds > 0 && s.medianSuppressionItf > THRESHOLD_SUPPRESSION_PLACES) {
        suppressionTripped.push({ horizonWeeks: h.weeks, week: w, median: s.medianSuppressionItf })
      }
    }
  }
  // Week 208 exists in both horizons and is identical per seed (prefix property); read it off the
  // longest horizon so the verdict never depends on which duplicate is sampled.
  const longest = Math.max(...HORIZONS.map((h) => h.weeks))
  const at208 = runs
    .filter((r) => r.horizonWeeks === longest)
    .map((r) => r.points.find((p) => p.week === THRESHOLD_INVERSION_WEEK))
    .filter((p): p is MeasurePoint => p !== undefined)
  const inversionShare = at208.length === 0 ? 0 : at208.filter((p) => p.inversions > 0).length / at208.length
  const inversionTripped = inversionShare > THRESHOLD_INVERSION_SHARE
  return {
    material: suppressionTripped.length > 0 || inversionTripped,
    suppressionTripped,
    inversionShare,
    inversionTripped,
  }
}

/** h208 careers are prefixes of h416 ones – shared measurement weeks must agree per seed, or the
 *  bench itself is non-deterministic. Returns the mismatches (expected: none). */
export function crossCheck(runs: readonly DualRun[]): string[] {
  const bad: string[] = []
  const byKey = new Map<string, MeasurePoint>()
  for (const r of runs) {
    if (r.horizonWeeks !== HORIZONS[0].weeks) continue
    for (const p of r.points) byKey.set(`${r.seedIndex}:${p.week}`, p)
  }
  for (const r of runs) {
    if (r.horizonWeeks === HORIZONS[0].weeks) continue
    for (const p of r.points) {
      const twin = byKey.get(`${r.seedIndex}:${p.week}`)
      if (!twin) continue
      if (JSON.stringify(twin) !== JSON.stringify(p)) bad.push(`seed ${r.seedIndex} week ${p.week}`)
    }
  }
  return bad
}

// --- CSV ----------------------------------------------------------------------------------------

export function toCsv(runs: readonly DualRun[], fingerprint: string): string {
  const cols = [
    'fingerprint',
    'profile',
    'policy',
    'horizon',
    'seed',
    'week',
    'rank_real_itf',
    'rank_cf_itf',
    'suppression_itf',
    'rank_real_dom',
    'rank_cf_dom',
    'rank_real_wta',
    'rank_cf_wta',
    'kid_points_itf',
    'peer_mean_real',
    'peer_mean_cf',
    'peer_delta',
    'peers_n',
    'beaten_considered',
    'inversions',
    'played_in_window',
    'played_events',
    'double_paid_pts',
    'double_paid_per_season',
    'champion_contradictions',
  ]
  const lines = [cols.join(',')]
  for (const r of runs) {
    for (const p of r.points) {
      lines.push(
        [
          fingerprint,
          CELL_PROFILE.background,
          CELL_POLICY.id,
          r.horizonWeeks,
          r.seed,
          p.week,
          p.rankReal.itf,
          p.rankCf.itf,
          p.suppressionItf,
          p.rankReal.domestic,
          p.rankCf.domestic,
          p.rankReal.wta,
          p.rankCf.wta,
          p.kidPointsItf,
          p.peerMeanReal.toFixed(2),
          p.peerMeanCf.toFixed(2),
          p.peerDelta.toFixed(2),
          p.peersN,
          p.beatenConsidered,
          p.inversions,
          p.playedInWindow,
          p.playedEvents,
          p.doublePaidPts,
          p.doublePaidPerSeason.toFixed(1),
          p.championContradictions,
        ].join(','),
      )
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ----------------------------------------------------------------------------------------

/** Short git head of the tree the numbers came from – BASELINE #1 vs the required post-living-field
 *  re-run must be attributable (spec §3). Deterministic for a given tree state; '-dirty' is part of
 *  the honesty. */
export function codeFingerprint(): string {
  try {
    const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 12)
    const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim() ? '-dirty' : ''
    return head + dirty
  } catch {
    return 'unknown'
  }
}

function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const csvIdx = argv.indexOf('--csv')
  const csvPath = csvIdx === -1 ? null : argv[csvIdx + 1]
  const seedsIdx = argv.indexOf('--seeds')
  const seeds = seedsIdx === -1 ? SEEDS_PER_CELL : Number(argv[seedsIdx + 1])

  const fp = codeFingerprint()
  console.log('Ties Break – dual-universe bench (P5 Phase A: measurement only, engine untouched)')
  console.log(`  code fingerprint: ${fp}   ← BASELINE runs must be attributable (spec §3)`)
  console.log(`  cell: ${CELL_PROFILE.label.trim()} × ${CELL_POLICY.id} (rank-plateau's cell) · ${seeds} paired seeds`)
  console.log(`  horizons: ${HORIZONS.map((h) => `${h.weeks}w@[${h.measureAt.join(',')}]`).join('  ')}`)
  console.log(`  counterfactual: canonical AI rows of her played events → shadow rows, ${WINDOW_WEEKS}w window`)
  console.log(
    `  pre-registered threshold: median ITF suppression > ${THRESHOLD_SUPPRESSION_PLACES} places at any cell,` +
      ` OR careers with a beaten-rival inversion at w${THRESHOLD_INVERSION_WEEK} > ${THRESHOLD_INVERSION_SHARE * 100}%`,
  )
  console.log('')

  const runs: DualRun[] = []
  for (const h of HORIZONS) {
    for (let i = 0; i < seeds; i++) runs.push(runDualCareer(CELL_PROFILE, CELL_POLICY, i, h))
  }

  for (const h of HORIZONS) {
    console.log(`HORIZON ${h.weeks}w – rank suppression (real − counterfactual, ITF table; +ve = double-pay costs her places)`)
    console.log(
      '  ' +
        ['week', 'rankReal', 'rankCf', 'medSupp', 'min..max', 'domSupp', 'wtaSupp', 'peerΔ', 'inv n/N', 'inWin', 'dblPaid/ssn', 'contra%']
          .map((c) => pad(c, 12))
          .join(''),
    )
    for (const w of h.measureAt) {
      const s = summarise(runs, h.weeks, w)
      console.log(
        '  ' +
          [
            w,
            '#' + s.medianRankReal,
            '#' + s.medianRankCf,
            s.medianSuppressionItf,
            `${s.minSuppressionItf}..${s.maxSuppressionItf}`,
            s.medianSuppressionDom,
            s.medianSuppressionWta,
            s.meanPeerDelta.toFixed(1),
            `${s.careersWithInversion}/${s.seeds}`,
            s.meanPlayedInWindow.toFixed(1),
            s.meanDoublePaidPerSeason.toFixed(0),
            (s.contradictionShare * 100).toFixed(1),
          ]
            .map((c) => pad(c, 12))
            .join(''),
      )
    }
    console.log('')
  }

  const bad = crossCheck(runs)
  console.log(
    bad.length === 0
      ? 'paired-horizon cross-check: OK (h208 measurements byte-agree with h416 at shared weeks)'
      : `paired-horizon cross-check: FAILED at ${bad.join(', ')} – the bench is non-deterministic, numbers void`,
  )

  const v = verdict(runs)
  console.log('')
  console.log('PRE-REGISTERED VERDICT (spec §2, threshold committed before the first sweep):')
  if (v.suppressionTripped.length > 0) {
    for (const t of v.suppressionTripped) {
      console.log(`  suppression TRIPPED: median ${t.median} places at ${t.horizonWeeks}w/${t.week} (> ${THRESHOLD_SUPPRESSION_PLACES})`)
    }
  } else {
    console.log(`  suppression: no cell's median exceeds ${THRESHOLD_SUPPRESSION_PLACES} places`)
  }
  console.log(
    `  beaten-rival inversions at w${THRESHOLD_INVERSION_WEEK}: ${(v.inversionShare * 100).toFixed(0)}% of careers` +
      ` (threshold > ${THRESHOLD_INVERSION_SHARE * 100}%) – ${v.inversionTripped ? 'TRIPPED' : 'not tripped'}`,
  )
  console.log(`  ⇒ the bias is ${v.material ? 'MATERIAL – Phase B is arguable (owner gates)' : 'NOT MATERIAL – Phase B stays closed'}`)

  if (csvPath) {
    writeFileSync(csvPath, toCsv(runs, fp))
    console.log('')
    console.log(`Per-seed rows written to ${csvPath}`)
  }
}

if (!process.env.VITEST && !IMPORTED_WITH_NO_AUTORUN) {
  main()
}
