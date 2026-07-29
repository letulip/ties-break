// THE condition math – one rule, everybody.
//
// Extracted verbatim out of world.ts by the rival-life slice so the AI cohort can reuse the exact
// same drain / recovery / strength curve the kid uses WITHOUT importing world.ts (which imports the
// rival module back – a cycle). Nothing here knows about WorldState: these are pure functions of
// (tier, scoreline) and (condition), so the engine, the cohort, the tests and the bench all read
// one implementation and the two sides can never drift apart.
//
// world.ts re-exports every symbol below under its historical name, so all existing call sites and
// test imports (`from '../src/engine/world'`) keep working unchanged.

import { ECONOMY } from './economy'
import type { TierId } from './season/types'

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

/** R9-7 (owner redesign): the INTEGER fatigue of ONE match – how hard the scoreline was,
 *  plus the tier's per-match surcharge (BASE RAISED 1 → 2, owner 26.07):
 *    straight sets, no tiebreak → 2;  a 3-setter OR a tiebreak in a 2-setter → 3;
 *    +1 more when the match had MORE than 2 tiebreak sets (a three-TB epic) – max 4;
 *    + tierMatchFatigue[tier] (local 0 / regional 1 / national 2 / j30 3 / j60 4 / j300 5).
 *  A set scored 7-6 / 6-7 is a tiebreak set. Hardest national match = 6. Pure state, zero
 *  draws; a record without a score (defensive) counts as straight sets – which is also the
 *  branch every RIVAL match takes, since AI-vs-AI results carry no scoreline (rival-life). */
export function matchDrain(tier: TierId, score: string | undefined): number {
  const f = ECONOMY.condition.matchFatigue
  const sets = score ? score.split(' ') : []
  const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
  let drain = sets.length >= 3 || tiebreaks >= 1 ? f.hardMatch : f.straightSets
  if (tiebreaks > 2) drain += f.extraTiebreaks
  return drain + ECONOMY.condition.tierMatchFatigue[tier]
}

/** R9-7: a committed run's total toll = Σ matchDrain over the run's match records. A 5-match
 *  National run of epics maxes at 30 per-match (it was 25, the owner's own check, before the base
 *  raise of 26.07) + the cumulative ladder. Applied by finalizeTournament for the kid,
 *  and by the rival ledger reconstruction for the cohort – so if a cumulative run-fatigue ladder
 *  is ever added it lands HERE and both sides inherit it at once. */
/** CUMULATIVE RUN FATIGUE (owner idea 26.07): the EXTRA condition the n-th match of ONE tournament
 *  run costs on top of its own scoreline drain, because the rounds are played on consecutive (or
 *  every-other) days - the deeper she goes, the more the week grinds her down. `matchIndex` is
 *  0-based WITHIN THE RUN, so a first match always costs 0 extra. A run longer than
 *  ECONOMY.condition.runFatigueLadder repeats the ladder's LAST value (a bigger future draw must
 *  never silently cost nothing). Pure integer arithmetic, zero draws.
 *
 *  Lives HERE, next to matchDrain, rather than in world.ts: the rival-life slice moved the whole
 *  drain family into this module so the cohort inherits it, and the ladder must apply to BOTH sides
 *  or a deep run would grind only the player. */
export function runFatigueExtra(matchIndex: number): number {
  const ladder = ECONOMY.condition.runFatigueLadder
  if (ladder.length === 0) return 0
  return ladder[Math.max(0, Math.min(matchIndex, ladder.length - 1))]
}

/** A committed run's total toll = the sum of (matchDrain + the run-fatigue ladder) over the match
 *  records IN ORDER - the reduce index IS the match-within-run index the ladder wants. A 5-match
 *  National run of epics = 30 per-match + 6 ladder (variant C) = 36. A walkover or a skipped event
 *  never reaches finalize, so it has no records and costs nothing, ladder included. */
export function tournamentRunStrain(tier: TierId, matches: { score?: string }[]): number {
  return matches.reduce((sum, m, i) => sum + matchDrain(tier, m.score) + runFatigueExtra(i), 0)
}

/** R9-19 (coupling ON, owner curve): NO strength penalty while she is fresh enough
 *  (condition >= matchStrengthKnee), then linear down to matchStrengthFloor at condition 0:
 *    factor = condition >= knee ? 1.0 : floor + (1 − floor) × condition / knee.
 *  The kid scales by it inside her EVENT-scoped shadow tournament; the cohort scales by the SAME
 *  curve inside theirs (rival-life), so one rule governs everybody. */
export function conditionMatchFactor(condition: number): number {
  const c = ECONOMY.condition
  if (condition >= c.matchStrengthKnee) return 1
  return c.matchStrengthFloor + (1 - c.matchStrengthFloor) * (condition / c.matchStrengthKnee)
}
