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
// The tier CATALOGUE only - a static table, so this module still knows nothing about WorldState.
// It is what lets the run-fatigue ladder be per-FAMILY (R15-6) without a second spelling of
// "which track is this tier" anywhere.
import { TIERS } from './season/calendar'
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
 *  0-based WITHIN THE RUN, so a first match always costs 0 extra. A run longer than the ladder
 *  repeats the ladder's LAST value (a bigger future draw must never silently cost nothing). Pure
 *  integer arithmetic, zero draws.
 *
 *  ⚠ THE LADDER IS PER FAMILY SINCE R15-6 (owner, 01.08: «может быть будет иметь смысл использовать
 *  другой кумулятивный механизм для мировой серии, с меньшими надбавками просто. Я несколько тогда
 *  предлагал»): the domestic and junior rungs keep his measured ladder C ([0,1,1,2,2]) exactly as
 *  shipped, and the W family runs on his flattest proposal D ([0,1,1,1,1]) - see
 *  ECONOMY.condition.runFatigueLadderWta for why that is the honest price of today's soft
 *  professional fields. The TIER therefore has to be named: there is no family-free answer any
 *  more, and a default would be a silent way to charge a W run the junior ladder.
 *
 *  Lives HERE, next to matchDrain, rather than in world.ts: the rival-life slice moved the whole
 *  drain family into this module so the cohort inherits it, and the ladder must apply to BOTH sides
 *  or a deep run would grind only the player. The kid (finalizeTournament) and the rivals
 *  (rival.ts reconstructRun) both arrive through `tournamentRunStrain`, so the split reaches the
 *  two sides from one implementation by construction. */
export function runFatigueExtra(matchIndex: number, tier: TierId): number {
  const ladder =
    TIERS[tier].track === 'wta' ? ECONOMY.condition.runFatigueLadderWta : ECONOMY.condition.runFatigueLadder
  if (ladder.length === 0) return 0
  return ladder[Math.max(0, Math.min(matchIndex, ladder.length - 1))]
}

/** A committed run's total toll = the sum of (matchDrain + the run-fatigue ladder) over the match
 *  records IN ORDER - the reduce index IS the match-within-run index the ladder wants. A 5-match
 *  National run of epics = 30 per-match + 6 ladder (variant C) = 36. A walkover or a skipped event
 *  never reaches finalize, so it has no records and costs nothing, ladder included. */
export function tournamentRunStrain(tier: TierId, matches: { score?: string }[]): number {
  return matches.reduce(
    (sum, m, i) => sum + matchDrain(tier, m.score) - surchargeRebate(tier, i) + runFatigueExtra(i, tier),
    0,
  )
}

/** WHAT THE i-TH MATCH OF A RUN GETS BACK OF ITS TIER SURCHARGE – nothing for the first
 *  `surchargeMatchesPerRun` (5), the whole surcharge for every match after them.
 *
 *  ⚠⚠ IT IS A REBATE RATHER THAN A CONDITION INSIDE `matchDrain` ON PURPOSE. `matchDrain(tier,
 *  score)` is asked "what did ONE match cost" by callers that have no run and no index – the week
 *  recap, the rival reconstruction's per-match reads, the fatigue bench's per-match tables – and
 *  giving it an optional index would have made every one of those silently answer for match 0. The
 *  cap is a property of a RUN, so it lives in the one function that has the run.
 *
 *  ⚠ AND BOTH SIDES INHERIT IT, which the module's own note says is required: the kid arrives here
 *  through `finalizeTournament` and the cohort through `rival.ts reconstructRun`, so a deep run
 *  cannot cost the player more than it costs her rivals.
 *
 *  Zero for every run of five matches or fewer, i.e. for every rung except the two the 128-draw
 *  wave deepened – see ECONOMY.condition.surchargeMatchesPerRun for the measurement that forced it. */
function surchargeRebate(tier: TierId, matchIndex: number): number {
  return matchIndex < ECONOMY.condition.surchargeMatchesPerRun ? 0 : ECONOMY.condition.tierMatchFatigue[tier]
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
