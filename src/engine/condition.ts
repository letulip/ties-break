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
 *    + tierMatchFatigue[tier] – three steps, 1 / 2 / 3, by STAGE (owner, 02.10): local, j30 and W15-W75 take 1;
 *      regional, j60 and W100-WTA 250 take 2; national, j300 and WTA 500 up take 3.
 *  A set scored 7-6 / 6-7 is a tiebreak set. Hardest match anywhere = 7. Pure state, zero
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
  const ladder = ladderFor(tier)
  if (ladder.length === 0) return 0
  return ladder[Math.max(0, Math.min(matchIndex, ladder.length - 1))]
}

/** THE RUNGS THAT RUN ON THE THIRD LADDER, NAMED BY TIER (05.10, round 46 #7). Until then the third ladder belonged to «a draw over
 *  32», which is a statement about the BRACKET; the owner's ruling below is a statement about three RUNGS – the 500, the 1000 and the
 *  Slam – and the 500 is not over 32, so a draw test could never have said it. A rung joins the third ladder by being added HERE, on
 *  purpose, rather than by crossing a threshold. */
const MAJOR_RUNGS: ReadonlySet<TierId> = new Set<TierId>(['wta500', 'wta1000', 'slam'])

/** WHICH LADDER A RUNG RUNS ON – three of them, and the third is keyed on the TIER (it was keyed on the DRAW until 05.10).
 *
 *  ⚠⚠ 05.10 – THE THIRD LADDER IS `[0, 0, 0, 1, 1, 1, 1]` AND THE DISCOUNT IT CARRIED IS DELETED (round 46 #7). The owner:
 *  «по 7 надо сделать разумно, например: 250-12, 500-15, 1000-18, шлем-21 что скажешь? это примерные цифры, посчитай по нашей математике
 *  пожалуйста. в 1000 на 1 матч больше, чем в 500, а в шлеме на 2. Мне кажется это справедливая логика.» The first three matches of a
 *  run carry no run surcharge and every match from the fourth carries +1, on the 500, the 1000 and the Slam alike. Through the masseur's
 *  relief (3 a night between rounds) that lands his four numbers to the digit for a straight-sets TITLE run: 250 → 12 (the W ladder,
 *  untouched), 500 → 15, 1000 → 18, Slam → 21 – a match nets +3 (a gross 6 less the relief), the 1000 plays one match more than the
 *  500 and the Slam two. Before it the 1000 netted 12 and the Slam 14 against a 500 at 17: `[-2, -1, 0]` opened R128/R64 at 3-4 a
 *  match against the 500's flat 5 and the relief compounded it. Early exits at the 1000 and the Slam rise from 3-4 to 5 a short visit –
 *  the discount's death, predicted. NOTHING ELSE MOVED: the tier surcharges (02.10), the W-32 ladder `[0, 1, 1, 1, 1]` for 15-250 and
 *  the junior and domestic ladders are byte-identical.
 *  The NAME `runFatigueLadderDeep` is history (it meant «a draw over 32»). It stays because the rival memo key, four benches and a notes
 *  anchor read it; it now means «the third ladder – the three majors».
 *
 *  ⚠ EVERYTHING BELOW IS THE 14.08–02.10 CHRONICLE, KEPT AS HISTORY: the `[-2, -1, 0]` it argues for, the draw key and the
 *  «behaviour-neutral on every other rung» claim are retired by the ruling above, and the rows it quotes were never a target after 02.10.
 *
 *  ⚠⚠ THE THIRD IS THE OWNER'S OWN CURVE, GIVEN AS TWO ROWS OF NUMBERS ON 14.08 – the cheapest and
 *  dearest a match may cost at a Slam and a 1000, round by round:
 *
 *      min  5 6 7 7 7 7 7          max  7 8 9 9 9 9 9
 *
 *  Read against `matchDrain`'s own parts (scoreline 2..4, plus the rung's surcharge of 5) that says
 *  the surcharge RAMPS to its full value over three matches instead of landing flat on the first:
 *  2+3, 2+4, 2+5, 2+5 … So the ladder for a deep rung is `[-2, -1, 0]`, and the ZEROES ARE THE
 *  POINT – the plateau is the tier's own surcharge, untouched, so this cannot drift away from
 *  `tierMatchFatigue` if that is ever retuned.
 *
 *  ⚠ 02.10: THE SURCHARGE THE CURVE RAMPS TO IS 3 NOW, AND THE ROWS ABOVE ARE HISTORY, NOT A TARGET. They were
 *  priced at a surcharge of 5; the owner's 02.10 ruling put the 1000 and the Slam on the table's top step, 3
 *  (round 45 #1), and because the ladder is an OFFSET it followed without being touched: a Slam straight-sets
 *  match now reads 3, 4, 5, 5, 5, 5, 5. «The rest stays as it is» was the ruling – the ladder was not re-cut.
 *
 *  ⚠ A NEGATIVE "EXTRA" IS A DISCOUNT AND IT IS DELIBERATE. The flat surcharge prices *"international
 *  travel, time zones and a fortnight from home"*, and it was calibrated when every draw in the game
 *  was 32 – i.e. when the whole tax landed inside five matches. On a seven-match week the same tax
 *  is spread over more tennis, so the opening rounds carry less of it. His own summary: «сама идея
 *  накопленной усталости сохранится нормально как раз».
 *
 *  ⚠ AND IT REPLACES A WORSE ATTEMPT OF MINE, which is why he wrote the curve out. I had capped the
 *  surcharge at five matches per run, which made the deep rounds cost 2 where the shallow ones cost
 *  8 – a cliff, not a plateau («а сейчас немного некорректно получается»). His curve is monotone
 *  non-decreasing and settles; mine collapsed. The cap and its constant are gone.
 *
 *  ⚠ BEHAVIOUR-NEUTRAL ON EVERY OTHER RUNG BY CONSTRUCTION: `drawSize > 32` is false for all twelve
 *  of them, so they keep the exact ladder they had. The two it is true for are the two the owner
 *  named. */
function ladderFor(tier: TierId): number[] {
  const c = ECONOMY.condition
  if (MAJOR_RUNGS.has(tier)) return c.runFatigueLadderDeep
  return TIERS[tier].track === 'wta' ? c.runFatigueLadderWta : c.runFatigueLadder
}

/** A committed run's total toll = the sum of (matchDrain + the run-fatigue ladder) over the match
 *  records IN ORDER - the reduce index IS the match-within-run index the ladder wants. A 5-match
 *  National run of epics = 30 per-match + 6 ladder (variant C) = 36. A walkover or a skipped event
 *  never reaches finalize, so it has no records and costs nothing, ladder included. */
export function tournamentRunStrain(tier: TierId, matches: { score?: string }[]): number {
  return matches.reduce((sum, m, i) => sum + matchDrain(tier, m.score) + runFatigueExtra(i, tier), 0)
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
