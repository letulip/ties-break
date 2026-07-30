// RIVALS BECOME REAL — the cohort's fatigue and play style, both DERIVED (docs/specs/rival-life.md).
//
// THE HARD CONSTRAINT: derive, never store. `world.cohort` is persisted inside every save and
// `generateCohort` draws its attributes sequentially, so adding one stored field would cost a
// schema bump AND shift every subsequent draw for all 199 players (a full cohort re-roll). Both
// halves of this module are therefore pure functions of data the world ALREADY holds:
//   - fatigue  <- the results ledger (`world.results`), which records every draw a rival entered;
//   - style    <- the four attributes she was generated with.
//
// THAT FIRST LINE IS A CONTRACT, AND IT WAS BROKEN ONCE (fix/rival-fatigue-rows). "Records every
// draw a rival entered" is the whole basis of this module, and for a while it was not true: both
// ledger write sites guarded on `points > 0`, which cost nothing while every finish paid – and then
// wave B made a first-round exit worth 0 at every tier, so half of every draw stopped leaving a row
// and this reconstruction read those weeks as REST. `runAiTournament` now writes a row for every
// entrant and `points` carries the award (0 included), so the contract holds by construction rather
// than by luck. A ROW IS AN APPEARANCE; `isCountingResult` is what the STANDINGS read instead.
// No new WorldState field, no schema bump, and ZERO RNG draws – the frozen MAIN-stream pins are
// untouched by construction.
//
// ONE RULE FOR EVERYBODY: every number below comes from ../condition (matchDrain,
// tournamentRunStrain, conditionMatchFactor) or from ECONOMY.condition – the same knobs that
// govern the kid. Rivals get NO injuries, NO physio, NO vacations and NO plan slider: that
// asymmetry is the player's edge, and it is deliberate.
//
// THE CUMULATIVE RUN-FATIGUE LADDER IS SHARED (wave-3 integration decision). Because the strain of
// a reconstructed run is `tournamentRunStrain`, the ladder the run-fatigue slice added applies to
// the cohort too: a rival's deep run costs her the same escalating toll it costs the kid. That is
// the point – if only the kid paid the ladder, a deep run would grind only the player, which is
// exactly the asymmetry this module exists to remove.

import { clamp, conditionMatchFactor, matchDrain, tournamentRunStrain } from '../condition'
import { ECONOMY } from '../economy'
import { rngFromSeed } from '../rng'
import { TIERS, TIER_LADDER, isBlackoutWeek } from './calendar'
import type { SeasonResult } from './ranking'
import type { AiPlayer, TierId } from './types'
import { applySurfaceStyle } from '../match/style'
// Re-exported under its historical name: this module owned a local twin before integration, so
// existing imports (and tests) keep working while there is only ONE implementation.
export { applySurfaceStyle }
import type { MatchPlayer, Surface } from '../match/types'
import type { PlayStyle } from '../../shared/protocol'

// --- Part A: fatigue reconstructed from the ledger ---------------------------

/** How many matches a player played to reach finish index `finish` in a draw of `rounds` rounds.
 *
 *  `finish` is `rounds - round` where `round` is the round she LOST in (0-based), so a loser at
 *  finish f played `rounds - f + 1` matches; the champion (f = 0) never lost and played all
 *  `rounds`. Runner-up and champion therefore play the same number of matches, which is exactly
 *  right – the final is one match for both of them. Pure integer arithmetic. */
export function matchesForFinish(rounds: number, finish: number): number {
  return finish <= 0 ? rounds : Math.min(rounds, rounds - finish + 1)
}

/** What ONE ledger row says about the week it was earned in. */
export interface RivalRun {
  tier: TierId
  /** matches played in that draw (>= 1) */
  matches: number
  /** the run's condition toll, straight off `tournamentRunStrain` */
  strain: number
}

/** The strain of a rival's run. AI-vs-AI matches resolve closed-form and carry NO scoreline, so
 *  every rival match takes `matchDrain`'s score-less branch (straight sets + the tier surcharge) –
 *  the same value the kid pays for a straight-sets match at that tier. Routed through
 *  `tournamentRunStrain` rather than re-derived, so the cumulative run-fatigue ladder lands in ONE
 *  place and BOTH sides inherit it at once: a five-match J300 title costs a rival 5 × 6 + the
 *  ladder (6 at variant C) = 36, exactly what the kid would pay for the same five straight-sets
 *  wins at that tier. */
function runStrain(tier: TierId, matches: number): number {
  return tournamentRunStrain(tier, new Array<{ score?: string }>(matches).fill({}))
}

/** The (tier, finish) index every reconstruction reads: for each points value, every run that
 *  could have produced it, CHEAPEST FIRST.
 *
 *  Derived, and MEMOISED ON THE LIVE RUN-FATIGUE LADDER rather than built once at module load. The
 *  tier point arrays are compile-time constants, so the shape is a tiny static table – but the
 *  STRAIN column is a function of `ECONOMY.condition.runFatigueLadder`, and a module-load snapshot
 *  silently froze the rivals on whatever ladder happened to be live at import time. That broke the
 *  one property the shared ladder exists for: the fatigue bench's `--scenario runfat-*` sections
 *  swap the knob to compare the owner's four ladders, and with a frozen index the KID moved while
 *  the cohort stayed on variant C – so the comparison the owner reads to pick a ladder measured
 *  half the game. Keyed on array IDENTITY (withScenario patches in a fresh copy and restores the
 *  original instance), which is also how the rest of the engine treats ECONOMY: a knob object is
 *  replaced, never scribbled on in place. */
let runsIndexCache: { ladder: readonly number[]; byPoints: Map<number, RivalRun[]>; fallback: RivalRun } | null = null

function runsIndex(): { byPoints: Map<number, RivalRun[]>; fallback: RivalRun } {
  const ladder = ECONOMY.condition.runFatigueLadder
  if (runsIndexCache && runsIndexCache.ladder === ladder) return runsIndexCache
  const byPoints = new Map<number, RivalRun[]>()
  for (const tier of TIER_LADDER) {
    const rounds = Math.log2(TIERS[tier].drawSize)
    TIERS[tier].points.forEach((points, finish) => {
      const matches = matchesForFinish(rounds, finish)
      const run: RivalRun = { tier, matches, strain: runStrain(tier, matches) }
      const list = byPoints.get(points)
      if (list) list.push(run)
      else byPoints.set(points, [run])
    })
  }
  // Cheapest reading first; ties break by ladder order (the lower rung), so the choice is total
  // and deterministic rather than dependent on iteration order.
  for (const list of byPoints.values()) {
    list.sort((a, b) => a.strain - b.strain || TIER_LADDER.indexOf(a.tier) - TIER_LADDER.indexOf(b.tier))
  }
  // The cheapest run any tier could have produced – the last-resort reading for a points value that
  // matches no tier at all (a hand-edited or future-tier save). One match at the entry tier: never a
  // crash, and never free. Her first match of a run pays 0 ladder, so this is pure matchDrain.
  const fallback: RivalRun = { tier: TIER_LADDER[0], matches: 1, strain: runStrain(TIER_LADDER[0], 1) }
  runsIndexCache = { ladder, byPoints, fallback }
  return runsIndexCache
}

/** Reconstruct what a rival actually PLAYED from one results row.
 *
 *  With `tier` present (every row this slice writes) the answer is exact: `points` inverts through
 *  `TIERS[tier].points` – strictly descending, so the finish index is unique – and the finish gives
 *  the match count.
 *
 *  WITHOUT `tier` (it is optional on `SeasonResult`, and every AI row written before this slice
 *  omitted it, pre-history included) the points value alone can be ambiguous: 30 is a Local title,
 *  a J30 last-16 and a J300 first round at once. Such a row resolves to the CHEAPEST reading by
 *  strain – deterministic, and a legacy save can never invent fatigue a rival may not have earned.
 *  It is explicitly never treated as free: the cheapest reading is still at least one match.
 *
 *  0 POINTS IS THE MOST AMBIGUOUS VALUE THERE IS – six tiers produce it, one first-round exit each –
 *  and it is also the value a scoreless appearance carries, which is now the commonest row in the
 *  ledger. Every row that can hold it comes from a write site that records `tier` (the live bracket
 *  and pre-history both have since the rival-life slice), so the exact branch above always fires and
 *  the collision is unreachable in practice. A tier-LESS 0-point row can only come from a
 *  hand-edited save; it reads as the cheapest first-round exit (Local, one match), which is the
 *  right instinct for an unknown row: never free, never inflated. */
export function reconstructRun(result: SeasonResult): RivalRun {
  const { byPoints, fallback } = runsIndex()
  const candidates = byPoints.get(result.points)
  if (result.tier !== undefined) {
    const exact = candidates?.find((c) => c.tier === result.tier)
    if (exact) return exact
    // A tier that no longer awards this value (a retuned points array under an old save): fall
    // through to the same cheapest-reading rule rather than crashing.
  }
  return candidates?.[0] ?? fallback
}

/** Walk `runs` (a single rival's reconstructed runs, keyed by the week they were earned) forward
 *  across the window ending at `week`, applying the kid's own week ladder:
 *    - a week she competed earns `matchWeekRecoveryBase` (0 shipped) – travel and competition,
 *      not rest – and then pays the run's strain;
 *    - a quiet week earns `recoveryBase`, plus `blackoutBonus` when the calendar is dark
 *      (off-season / school exams). A week's TYPE is a property of the week, so it applies to
 *      everybody;
 *    - and that is ALL: no plan slider, no physio, no vacation. The player's edge.
 *  Starts the scan at full condition, so the window is the rival's memory (see the knob's note in
 *  economy.ts). Clamped to the same [min, max] as the kid's. */
function walkWindow(runs: Map<number, RivalRun[]>, week: number): number {
  const c = ECONOMY.condition
  let condition: number = c.max
  for (let w = week - c.rivalFatigueWindowWeeks + 1; w <= week; w++) {
    const played = runs.get(w)
    const recovery = played
      ? c.matchWeekRecoveryBase
      : c.recoveryBase + (isBlackoutWeek(w) ? c.blackoutBonus : 0)
    condition = clamp(condition + recovery, c.min, c.max)
    if (played) {
      for (const run of played) condition = clamp(condition - run.strain, c.min, c.max)
    }
  }
  return condition
}

/** ONE rival's condition (0..100, 100 = fresh) at `week`, derived from the results ledger.
 *
 *  Takes the LEDGER rather than the world: it is a pure function of (results, playerId, week), so
 *  the tests and the bench call it directly and nothing about a world's other state can leak in.
 *  Zero RNG draws. For a whole field prefer `rivalConditions`, which indexes the ledger once. */
export function rivalCondition(results: readonly SeasonResult[], playerId: string, week: number): number {
  const runs = new Map<number, RivalRun[]>()
  const from = week - ECONOMY.condition.rivalFatigueWindowWeeks + 1
  for (const r of results) {
    if (r.playerId !== playerId || r.week < from || r.week > week) continue
    const list = runs.get(r.week)
    if (list) list.push(reconstructRun(r))
    else runs.set(r.week, [reconstructRun(r)])
  }
  return walkWindow(runs, week)
}

/** Every rival's condition at `week`, indexing the ledger ONCE. The engine calls this per tick, so
 *  the per-week cost is O(rows in the window) rather than O(players × rows). Players with no rows
 *  in the window are absent from the map – they are at full condition by construction, and
 *  `rivalMatchPlayer` treats a missing entry as exactly that. */
export function rivalConditions(results: readonly SeasonResult[], week: number): Map<string, number> {
  const from = week - ECONOMY.condition.rivalFatigueWindowWeeks + 1
  const byPlayer = new Map<string, Map<number, RivalRun[]>>()
  for (const r of results) {
    if (r.week < from || r.week > week) continue
    let runs = byPlayer.get(r.playerId)
    if (!runs) {
      runs = new Map<number, RivalRun[]>()
      byPlayer.set(r.playerId, runs)
    }
    const list = runs.get(r.week)
    if (list) list.push(reconstructRun(r))
    else runs.set(r.week, [reconstructRun(r)])
  }
  const conditions = new Map<string, number>()
  for (const [playerId, runs] of byPlayer) conditions.set(playerId, walkWindow(runs, week))
  return conditions
}

// --- Part B: play style, derived from the attributes she was generated with ---

/** The style thresholds, as ONE exported knob object so the tests, the bench and any future
 *  tuning pass read the same numbers the engine does.
 *
 *  Calibrated against the generation ranges (`generateCohort`: serve 30-60, ret 30-60, composure
 *  25-70, stamina 30-70) to give all four styles a real share of a 199-player cohort – see the
 *  histogram test. `high*` sit just above each range's midpoint, so "high" means "top ~half of
 *  what this cohort can be", and `serveEdge` is a clear gap rather than a coin-flip on noise. */
export const RIVAL_STYLE = {
  /** serve − ret at or above this ⇒ a serve-first build */
  serveEdge: 8,
  /** "high" serve (generation range 30-60) */
  highServe: 46,
  /** "high" return (generation range 30-60) */
  highRet: 46,
  /** "high" stamina (generation range 30-70) */
  highStamina: 52,
} as const

/** A rival's play style: a PURE function of the attributes she already has, in the spec's order.
 *
 *  A serve clearly ahead of the return is the loudest signal there is, so it wins first; then legs
 *  behind a return (the counterpuncher's actual weapon is the third ball, not the first); then two
 *  weapons without the legs to grind (the aggressive baseliner); and everything else is all-court.
 *  Nothing is stored: the same player always reads the same style, and drift moves it only when her
 *  attributes genuinely move. */
export function styleOf(player: Pick<MatchPlayer, 'serve' | 'ret' | 'stamina'>): PlayStyle {
  const s = RIVAL_STYLE
  if (player.serve - player.ret >= s.serveEdge) return 'serve-first'
  if (player.ret >= s.highRet && player.stamina >= s.highStamina) return 'counterpuncher'
  if (player.serve >= s.highServe && player.ret >= s.highRet) return 'aggressive'
  return 'all-court'
}

/** The surface/style transform lives in ONE place for the whole game: `match/style.ts`, shipped by
 *  the surface-style slice. This file used to carry a local twin (written when that slice was not
 *  yet on this branch); the two were collapsed onto the canonical table at integration, which is
 *  the stricter of the pair – its per-attribute deltas SUM TO ZERO across the three surfaces, so a
 *  specialist trades one court for another instead of gaining outright. Rivals and the kid are now
 *  provably shaped by the same rule. */

/** HOW HARD A RIVAL HITS OFF THE GROUND (v25) - derived, never stored. Sibling of `styleOf` above,
 *  and it exists for the same two reasons: a stored field would cost a cohort schema bump, and a
 *  fifth weekly draw in `driftCohort` would move the frozen MAIN capture. See season/types.ts.
 *
 *  ANCHORED ON HER FIRST-STRIKE LEVEL, `(serve + ret) / 2`, so it tracks her development for free -
 *  a rival who closes on her ceiling hits harder every season, with no new state and no new draws.
 *  It also reads the styles correctly without being told them, which is the part worth noticing:
 *  a serve-first rival (serve well ahead of return) lands BELOW her serve, because her groundstroke
 *  is her weaker half; a counterpuncher (high return, high legs) lands in the middle, because she
 *  does not hit through people; an aggressive rival (both weapons high) lands high. Exactly what
 *  `styleOf` says about the same three numbers.
 *
 *  THE OFFSET IS WHY THIS IS AN ATTRIBUTE AND NOT A FORMULA. Without it `opp.groundstrokes` would be
 *  a deterministic function of `opp.serve`/`opp.ret`, and the radar's evidence read for the new axis
 *  ("has anybody out-hit her") would collapse into a restatement of its serve/return reads. One
 *  uniform draw off the player's own `gs:<id>` sub-stream gives the field genuine spread on the new
 *  axis: stable for ever (the id never changes), and ZERO draws on any stream the tick is walking. */
export const RIVAL_GS_SPREAD = 8

export function rivalGroundstrokes(player: Pick<AiPlayer, 'id' | 'serve' | 'ret'>): number {
  const base = (player.serve + player.ret) / 2
  const u = rngFromSeed(`gs:${player.id}`)()
  return clamp(base + RIVAL_GS_SPREAD * (2 * u - 1), 0, 100)
}

/** THE one helper both tournament paths call (the kid's shadow run and the canonical AI bracket),
 *  so a rival can never be built two different ways.
 *
 *  Composition order mirrors the kid's exactly (spec §Composition):
 *      base attributes → surface/style modifier → condition factor
 *  applied exactly ONCE. `condition` defaults to full, so a rival with no rows in the fatigue
 *  window (or any caller that has not derived one) is simply fresh.
 *
 *  ⚠ THE DERIVED GROUNDSTROKE JOINS BEFORE `applySurfaceStyle`, not after, so the surface x style
 *  table can move it like any other attribute - an aggressive rival on a hard court hits bigger, by
 *  the same row that does it for the kid. Deriving it afterwards would silently exempt the whole
 *  cohort from the one row v25 added to that table. */
export function rivalMatchPlayer(player: AiPlayer, surface: Surface, condition: number = ECONOMY.condition.max): MatchPlayer {
  const styled = applySurfaceStyle(
    { ...player, groundstrokes: rivalGroundstrokes(player) },
    styleOf(player),
    surface,
  )
  const factor = conditionMatchFactor(condition)
  return {
    id: styled.id,
    name: styled.name,
    serve: styled.serve * factor,
    ret: styled.ret * factor,
    composure: styled.composure * factor,
    stamina: styled.stamina * factor,
    groundstrokes: styled.groundstrokes * factor,
  }
}

/** Re-exported so a caller that already has a rival's condition can read her strength factor
 *  through the same curve without reaching into ../condition. */
export { conditionMatchFactor, matchDrain }
