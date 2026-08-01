// THE "NEXT GOAL" SCRAP – what the week's story tapes under itself, and the ladder behind it.
//
// -------------------------------------------------------------------------------------------------
// WHAT WAS THERE, AND WHY IT WAS WORSE THAN IT LOOKED
// -------------------------------------------------------------------------------------------------
// `WeekRecapCard`'s `goalLine` had two arms. Entered for a tournament -> "Win one match at the
// {label}", FOREVER: it never escalated, so a girl with three titles at that rung was still being
// told to win one match. Otherwise it printed `weekAhead.label`, which is the BUTTON's text - so an
// ordinary week's goal read "Next goal: Training week". That is not a goal, it is the week's name
// written twice.
//
// The owner, 30.07: «надо что-то более осмысленное писать про цель, например писать реально, что она
// на какой-то тир турнира целится, на четверть или полуфинал, на победу потом, т.е. на шаги ее путь
// разложить. Если долго не получается дойти, то разбавлять какими-то навыками, например next goal:
// improve stability».
//
// -------------------------------------------------------------------------------------------------
// THE LADDER, AND WHY IT NEEDS NO ENGINE CHANGE
// -------------------------------------------------------------------------------------------------
// `TierDef.points` is `[W, F, SF, QF, R16, R32]` INDEXED BY FINISH, with the last entry 0 (a
// first-round loss pays nothing - wave B). So a counting result's `points`, read against its own
// tier's table, inverts to the round she reached. Everything below is that one observation plus the
// order of the rungs, and nothing here is persisted, sent over the worker protocol or added to a
// Snapshot: it is arithmetic on fields that have been on the payload since r5.
//
// TWO LIMITS, STATED AS CONVENTIONS RATHER THAN DISCOVERED AS BUGS:
//
//   1. `countingResults` IS THE BEST-6 WINDOW, NOT THE FULL LEDGER. A stronger round that aged out
//      or was displaced by six better ones is not in it, so a goal can in principle move BACKWARDS -
//      she reached a semi-final a year ago, six better results pushed it out, and the scrap goes
//      back to asking for a semi-final. For a NEXT goal that is arguably the right source: it tracks
//      current form rather than a lifetime peak, and a parent asking "what is she aiming at now"
//      means now. It is a choice, it is written down here, and it is the only ledger the payload
//      carries.
//   2. `tier` IS OPTIONAL ON `CountingResult` (pre-r5 saves stored results without it). A result
//      with no tier cannot be inverted at all - the same points value means a different round at
//      every rung - so it is SKIPPED rather than guessed at. A long-running save whose whole window
//      predates r5 therefore falls back to the first rung, which is the honest answer for a ledger
//      nobody can read.
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import { RADAR_AXIS_LABEL } from '../engine/radar'
import { finishPhrase } from './tierState'
import type { CountingResult, RadarAxis, Snapshot, UpcomingEvent } from '../shared/protocol'
import type { TierId } from '../engine/season/types'

/** The facts the goal reads. A `Pick`, so a test or a bench can hand in a plain object – the
 *  `RecapFacts` / `CalendarWeekFacts` idiom. */
export type GoalFacts = Pick<Snapshot, 'week' | 'ladders' | 'upcoming' | 'radar'>

/** One rung of the climb: a round, at a tier. */
export interface GoalRung {
  tier: TierId
  /** the finish index this rung asks for – 0 is the title, and bigger is earlier (see TierDef). */
  finish: number
  /** true for the first rung at a tier, whose copy is "win one match" rather than a round name */
  firstMatch: boolean
}

/** Which round a counting result actually was, or null when it cannot be read (see convention 2).
 *
 *  The inversion is safe because a tier's points are strictly decreasing, so a value appears at most
 *  once in its own table. It is NOT safe across tiers - a local title and a J30 title both pay 30 -
 *  which is exactly why a result with no tier is unreadable rather than guessable. */
export function finishOf(result: CountingResult): { tier: TierId; finish: number } | null {
  if (!result.tier) return null
  const table = TIERS[result.tier]?.points
  if (!table) return null
  const finish = table.indexOf(result.points)
  return finish === -1 ? null : { tier: result.tier, finish }
}

/** THE RUNGS AT ONE TIER, easiest first: win one match -> the quarter-final -> the semi-final -> the
 *  final -> win it.
 *
 *  ⚠ THE MIDDLE RUNGS ARE DROPPED WHEN THE DRAW IS TOO SMALL TO HAVE THEM, and that is not a detail:
 *  a Local Open is a draw of EIGHT, so its first round IS the quarter-final and "reach the
 *  quarter-final" would be a goal she meets by turning up. The rule is mechanical rather than a
 *  table of exceptions - a rung is kept only if it is strictly harder than winning one match - so
 *  the local ladder comes out as three rungs (a match, the final, the title) and a 32-draw as five,
 *  from the same four lines. */
export function rungsFor(tier: TierId): GoalRung[] {
  const table = TIERS[tier].points
  // one better than a first-round exit: the finish index that means she won a match
  const oneMatch = table.length - 2
  const seen = new Set<number>()
  const out: GoalRung[] = []
  for (const finish of [oneMatch, 3, 2, 1, 0]) {
    if (finish > oneMatch || finish < 0 || seen.has(finish)) continue
    seen.add(finish)
    out.push({ tier, finish, firstMatch: finish === oneMatch })
  }
  return out
}

/** Where she stands: the STRONGEST tier she holds a readable counting result at, her best round
 *  there, and the week she first reached it. Null when the window holds nothing readable.
 *
 *  The strongest tier rather than the busiest one, because the goal is about where she is CLIMBING.
 *  A girl with five Local titles and one National quarter-final is aiming at the National. */
export function ladderStandingFor(
  facts: Pick<GoalFacts, 'ladders'>,
): { tier: TierId; finish: number; sinceWeek: number } | null {
  // ⚠ ALL THREE TABLES (task #17). This read the two it knew about, and the day the professional
  // rungs existed a W15 title would have been invisible to the one surface whose whole job is to say
  // what she is climbing towards - she would have won her first professional tournament and the goal
  // card would still have been asking her to reach a J300 semi-final. The fold below is already
  // per-tier and orders by TIER_LADDER, so the third table needs no special case, only inclusion.
  const read = [
    ...facts.ladders.domestic.countingResults,
    ...facts.ladders.itf.countingResults,
    ...facts.ladders.wta.countingResults,
  ]
    .map((r) => ({ ...finishOf(r), week: r.week }))
    .filter((r): r is { tier: TierId; finish: number; week: number } => r.tier !== undefined)
  if (!read.length) return null
  let tier = read[0].tier
  for (const r of read) if (TIER_LADDER.indexOf(r.tier) > TIER_LADDER.indexOf(tier)) tier = r.tier
  const here = read.filter((r) => r.tier === tier)
  const finish = Math.min(...here.map((r) => r.finish))
  // The EARLIEST week that reached it: she has been asking for the next round since the first time
  // she got this far, not since the most recent repeat of it.
  const sinceWeek = Math.min(...here.filter((r) => r.finish === finish).map((r) => r.week))
  return { tier, finish, sinceWeek }
}

/** The rung after a given standing at a tier – null when she has already won the thing. */
function rungAfter(tier: TierId, best: number | null): GoalRung | null {
  const rungs = rungsFor(tier)
  if (best === null) return rungs[0] ?? null
  return rungs.find((r) => r.finish < best) ?? null
}

/** The tier above, or null at the top of the ladder. */
function tierAbove(tier: TierId): TierId | null {
  return TIER_LADDER[TIER_LADDER.indexOf(tier) + 1] ?? null
}

/** THE RUNG SHE IS ON. Never null: a career with no readable results at all is on the first rung of
 *  the first tier, which is exactly true of a girl who has not won a match yet.
 *
 *  Winning a tier moves her up and starts again at "win one match", which is the owner's own
 *  sentence («потом на победу... т.е. на шаги ее путь разложить») and also what actually happens -
 *  a title at a rung is what opens the next one. At the top of the ladder there is nothing above, so
 *  the goal stays "win it": a W100 title is not a rung anybody climbs past. (It was J300's line until
 *  the adult rungs landed - and the rung a J300 title now hands her is W15, which is the whole point
 *  of the fork at 19: the biggest thing she has ever won opens the smallest thing she will ever be
 *  paid for.) */
export function nextRungFor(facts: Pick<GoalFacts, 'ladders'>): GoalRung {
  const standing = ladderStandingFor(facts)
  if (!standing) return rungsFor(TIER_LADDER[0])[0]
  const next = rungAfter(standing.tier, standing.finish)
  if (next) return next
  const up = tierAbove(standing.tier)
  return up ? rungsFor(up)[0] : { tier: standing.tier, finish: 0, firstMatch: false }
}

/** How long she has been asking for the same thing, in weeks.
 *
 *  Measured from the result that put her on this rung; a career with nothing readable in its window
 *  has been trying to win its first match since week 0, which is what the whole career length says. */
export function weeksOnRung(facts: Pick<GoalFacts, 'week' | 'ladders'>): number {
  const standing = ladderStandingFor(facts)
  return Math.max(0, facts.week - (standing?.sinceWeek ?? 0))
}

/** The line a rung prints, given what to call the event. `where` is a tournament's own label when
 *  she is entered for one and the tier's label otherwise. */
export function rungLine(rung: GoalRung, where: string): string {
  if (rung.firstMatch) return `Win one match at the ${where}`
  if (rung.finish === 0) return `Win the ${where}`
  return `Reach the ${finishPhrase(rung.finish, TIERS[rung.tier].drawSize)} at the ${where}`
}

// =================================================================================================
// ⚠ THE SKILL GOAL, AND IT READS THE FOG RATHER THAN HER SKILLS
// =================================================================================================
//
// «Если долго не получается дойти, то разбавлять какими-то навыками, например next goal: improve
//  stability». Agreed - and the source matters more than the wording.
//
// Naming a wing off her TRUE attributes would leak exactly what the radar's fog exists to hide
// (docs/specs/skills-radar.md, decisions.md #11): her real values never leave the engine, screen C
// is handed an estimate with an error band, and a weekly goal naming the truth would be a second
// channel around all of it. The honest source is `RadarAxis` - the estimate the player is ALREADY
// SHOWN, and the coach's per-axis sentence, which is words only and never a digit.
//
// So the skill goal exists only when the coach actually has something to say (`note !== null`),
// which is correct rather than convenient: a stranger of a daughter has no diagnosis to offer, and
// on a week-1 radar he is silent about half her wings. Of the wings he speaks about, the goal names
// the one HIS OWN ESTIMATE puts lowest - the weakest wing as the player can already see it on screen
// C, never as the engine knows it.
//
// ⚠ THE SENTENCE ITSELF STAYS ON SCREEN C, and that is deliberate: half the note pool is praise
// ("She hits through people. That ends points on its own."), which is a verdict rather than a task,
// and a scrap headed "Next goal" cannot print one. The scrap takes the WING and says the thing a
// parent would say about it.
export function skillGoalFor(facts: Pick<GoalFacts, 'radar'>): string | null {
  const spoken = facts.radar.filter((a: RadarAxis) => a.note !== null)
  if (!spoken.length) return null
  let weakest = spoken[0]
  for (const axis of spoken) if (axis.shownValue < weakest.shownValue) weakest = axis
  return `Work on her ${RADAR_AXIS_LABEL[weakest.key].toLowerCase()}`
}

/** ⚠ HOW LONG "STUCK" IS, AND IT IS A MEASURED NUMBER RATHER THAN A FELT ONE.
 *
 *  The spec asked for the measurement before the copy, and named the answer that would have meant
 *  the ladder itself was wrong: "if 'win one match at Regional' takes thirty weeks on average, the
 *  skill line is not a garnish - it is the state the scrap is in most of the time".
 *
 *  `tools/next-goal-bench.ts` walks whole careers week by week under the econ bench's own entry
 *  policy. 12 seeds x 3 family backgrounds x 208 weeks (14 -> 18) = 36 careers, 7488 career-weeks:
 *
 *      HOW LONG THE RUNG STAYS THE SAME   median 11w · mean 18.5w · p75 24w · p90 53w · longest 111w
 *      DISTINCT RUNGS PER CAREER          9.7 over four seasons
 *      `weeksOnRung` (what this constant is compared to)
 *                                         median 16w · mean 19.6w · p75 32w · p90 45w · longest 52w
 *      A TOURNAMENT IS ALREADY BOOKED ON  86.4% of weeks
 *
 *  THE RUNGS ARE NOT SPACED WRONG. Half of all rungs are cleared inside eleven weeks - three or four
 *  tournaments at the calendar's density - and a career really does climb about ten of them in four
 *  seasons, which is the path-broken-into-steps the owner asked for. But the tail is heavy: p90 is
 *  fifty-three weeks and 47% of all career weeks fall inside a run of forty weeks or more. The
 *  stalls the owner is describing are real, and on those weeks a scrap that keeps asking for the
 *  same semi-final is the thing he called out.
 *
 *  WHY 20. The threshold barely moves how OFTEN the skill line appears - 10.7% of weeks at a
 *  6-week threshold against 4.0% at 30 - because the booked-tournament arm already owns 86% of
 *  weeks and those name the draw whatever this number says. So it is chosen for MEANING rather than
 *  for frequency, and the meaning is "longer than an ordinary rung": 20 is comfortably past the
 *  median rung (11w) and past the median `weeksOnRung` (16w), so a stall has to be genuinely long
 *  before the scrap changes the subject. It lands the skill line on 6.4% of weeks - about one week
 *  in sixteen - and the bench confirms the second gate never bites: on every stuck, unbooked week in
 *  36 careers the coach had something to say (0 weeks where the line was wanted and unavailable).
 *
 *  ⚠ ONE LIMIT THE MEASUREMENT EXPOSED, AND IT IS CONVENTION 1 SHOWING ITS EDGE. `weeksOnRung` tops
 *  out at 52 weeks while real runs reach 111, because the best-6 window ages the result out from
 *  under her: after about a year the ledger no longer remembers when she got there. So this number
 *  UNDERSTATES the longest stalls, and it can only ever err toward saying the skill line less often
 *  than a full ledger would. That is the safe direction and it is the ledger the payload carries. */
export const STUCK_AFTER_WEEKS = 20

export interface NextGoal {
  /** the line the scrap prints */
  text: string
  /** which arm produced it – for tests and the bench; never shown to anybody */
  kind: 'rung' | 'skill'
  rung: GoalRung
  weeks: number
}

/** THE GOAL. One answer, so the scrap and any surface that ever wants the same sentence cannot
 *  disagree about what she is aiming at. */
export function nextGoalFor(facts: GoalFacts): NextGoal {
  const rung = nextRungFor(facts)
  const weeks = weeksOnRung(facts)
  // AN ENTERED TOURNAMENT OWNS THE GOAL. She is going to play it this week or next, so the scrap
  // names it - and it names the rung she is on AT THAT EVENT'S TIER rather than her overall one,
  // because the goal has to be about the draw she is actually walking into. This is the arm the
  // card already had; what changed is that it now escalates instead of asking for one match forever.
  const entered = facts.upcoming.find((e: UpcomingEvent) => e.entered)
  if (entered) {
    const standing = ladderStandingFor(facts)
    const best = standing && standing.tier === entered.tier ? standing.finish : bestAt(facts, entered.tier)
    const here = rungAfter(entered.tier, best)
    if (here) return { text: rungLine(here, entered.label), kind: 'rung', rung: here, weeks }
    // ⚠ SHE ALREADY HOLDS THIS TIER'S TITLE, so this draw has no rung left to name (owner, playing,
    // 01.08: the scrap read "Next goal: Win the World Tour 15" the week AFTER she won the W15 -
    // she was entered for the next one, `rungAfter` was null because the title is hers, and the old
    // fallback `{finish: 0}` printed "win it again"). A repeat title is not a goal, it is a chore -
    // so the scrap escalates to the GLOBAL rung instead, under the TIER's own label rather than the
    // entered event's: she may be playing another W15 this week, but what she is climbing towards
    // is the World Tour 35, and that is the only honest sentence left at this draw.
    return { text: rungLine(rung, TIERS[rung.tier].label), kind: 'rung', rung, weeks }
  }
  // STUCK, and the coach has a diagnosis: say the thing she can actually work on this week.
  if (weeks >= STUCK_AFTER_WEEKS) {
    const skill = skillGoalFor(facts)
    if (skill) return { text: skill, kind: 'skill', rung, weeks }
  }
  return { text: rungLine(rung, TIERS[rung.tier].label), kind: 'rung', rung, weeks }
}

/** Her best readable finish at ONE tier, or null – for the entered-tournament arm, where the rung is
 *  about that draw rather than about the strongest tier she has ever played.
 *
 *  ⚠ ALL THREE TABLES (01.08, round 15) - the same latent twin `ladderStandingFor`'s fold already
 *  fixed under task #17, one function down and unnoticed. This read the two tables it knew about, so
 *  a girl entered for a W15 while her STANDING sat at a different tier (a W35 book, say) had her W15
 *  results invisible to this arm and was told to win one match at a draw she had already gone deep
 *  in. The filter below is already per-tier, so the third table needs no special case, only
 *  inclusion. */
function bestAt(facts: Pick<GoalFacts, 'ladders'>, tier: TierId): number | null {
  const here = [
    ...facts.ladders.domestic.countingResults,
    ...facts.ladders.itf.countingResults,
    ...facts.ladders.wta.countingResults,
  ]
    .map(finishOf)
    .filter((r): r is { tier: TierId; finish: number } => r !== null && r.tier === tier)
  return here.length ? Math.min(...here.map((r) => r.finish)) : null
}
