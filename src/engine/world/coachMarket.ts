// THE COACH MARKET: who is available at her age and rung, what they cost, and what hiring one does.
//
// ⚠ THE ROSTER IS DERIVED, NEVER PERSISTED – only the chosen id is. `coachById(seed, ageAtWeek(week),
// id)` rebuilds the same market from the seed and the AGE BAND, which is why `ageAtWeek` must stay
// birth-month-free (see world/age.ts): make the band depend on her birthday and every December
// career's roster re-rolls, and a saved coach resolves to a different person or to nobody.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. `coachLoadNote` moved here from the snapshot region: it
// is the market card's own copy, and it had two callers in two different concerns.
//
// ⚠ RNG: nothing here draws on MAIN. The market is a pure function of (seed, age).
import { bestFitCoachAt, buildCoachRoster, coachById, coachFitFor, coachIncludesPhysio, coachSeasonUplift, coachWeeklyCents, COACH_TIER_LABEL, eliteGateShortfall, practiceCoachRateCents, selfRateCents } from '../coach'
import { OFF_SEASON_WEEKS, TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import { ECONOMY } from '../economy'
import type { SeasonEvent, TierId } from '../season/types'
import { ageFactor, SKILL_KEYS, trainFactor } from '../development'
import type { CoachMarketRow, CoachTier, PlayerProfile } from '../../shared/protocol'
import { parentIncomeForWeekCents } from '../economy'
import { addEvent, seasonStartWeek } from './ledger'
import { ageAtWeek, START_AGE_YEARS } from './age'
import { bookClosedTo, hasOutgrown, kidPoints, tierOpenFor } from './ladder'
import type { WorldState } from '../world'
import { guardNotEnded } from './endings'

// --- THE COACH MARKET (v23) --------------------------------------------------------------------

/** The coach a career OPENS with, from the rung onboarding chose.
 *
 *  `self` means nobody: the parent is on the court, and there is no id to store. Otherwise it is
 *  the coach at that rung who suits her game best, cheapest first among equals - which is what a
 *  parent walking into an academy and naming a budget actually gets. Pure: the roster is derived
 *  from the seed and nothing is drawn on the main stream. */
export function openingCoachId(seed: string, profile: PlayerProfile): string | null {
  if (profile.coachTier === 'self') return null
  return bestFitCoachAt(seed, START_AGE_YEARS, profile.coachTier, profile.playStyle)?.id ?? null
}

/** The friendly's coach rate for one week of THIS world - a thin read of the pure rule in
 *  engine/coach.ts, so the planner sheet and the engine quote the same number. */
export function practiceCoachRateFor(world: WorldState, week: number): number {
  return practiceCoachRateCents(world.seed, ageAtWeek(week), world.coachId, world.profile.playStyle)
}

/** THE HIRE, and it is deliberately cheap to do: no signing fee, no notice period, effective from
 *  the next weekly bill.
 *
 *  Whether swapping coach mid-season should COST something is an open question the spec raises
 *  (§5 - "a free swap makes the choice weightless") and not one this slice answers, so the command
 *  is built to take a fee later without changing shape: the refusals live here in one place, and
 *  the only mutation is the id.
 *
 *  ZERO RNG on any stream - the roster is a derivation and the id is a string. The frozen MAIN
 *  capture cannot move, and neither can the week's own bill until the week actually turns.
 *
 *  `null` fires the parent back onto the court, which must always be allowed: a family that cannot
 *  pay has to be able to stop paying. */
export function hireCoach(world: WorldState, coachId: string | null): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  if (coachId === null) {
    if (world.coachId === null) return
    world.coachId = null
    world.physioActive = false
    addEvent(world, {
      week: world.week,
      type: 'info',
      // ⚠ NOW KEPT, AND TAGGED (skills-radar). Both arms of this command are the moment a coaching
      // arrangement CHANGED, and the radar's "weeks together" is derived from exactly that moment
      // (coachSinceWeek) rather than from a new persisted field. A pruned release event would let a
      // fired coach go on lending his read to the parent who replaced him. Bounded by construction:
      // one row per hire, and a career has a handful.
      keep: true,
      milestoneKey: `${COACH_CHANGE_KEY}${world.week}`,
      text: 'You are coaching her yourself again. The weekly bill is court time only.',
    })
    return
  }
  const coach = coachById(world.seed, ageAtWeek(world.week), coachId)
  if (!coach) throw new Error('No such coach')
  if (world.coachId === coach.id) return
  // ⚠ DOMESTIC, and the merge with the two ladders is why this now has to say so out loud. The
  // gate's threshold (ECONOMY.coach.eliteGate.minPoints = 150) was written as "national-tier
  // eligibility" - it IS TIERS.national.enterPointBand[0] - so the domestic table is the one that
  // preserves its meaning. Reading ITF points here would also make the Elite rung strictly
  // downstream of money (no international travel, no ITF points, no Elite coach ever), which is the
  // opposite of the "earned rather than bought" shape the owner asked the gate for.
  const short = eliteGateShortfall(coach, kidPoints(world, 'domestic'))
  if (short !== null) {
    throw new Error(`${coach.name} only takes players with results – ${short} more ranking points`)
  }
  world.coachId = coach.id
  world.physioActive = coachIncludesPhysio(coach.tier)
  addEvent(world, {
    week: world.week,
    type: 'info',
    keep: true,
    // See the release arm above: the tag is what makes "when did this partnership start" a read
    // over the ledger instead of a persisted field and a migration.
    milestoneKey: `${COACH_CHANGE_KEY}${world.week}`,
    text: `${coach.name} is her coach now – ${COACH_TIER_LABEL[coach.tier]} tier.`,
  })
}

/** THE TAG ON A COACH-CHANGE EVENT, and the only thing that identifies one. `milestoneKey` already
 *  exists on every event (it is what makes a milestone fire once), it is never pruned when the event
 *  is `keep`, and it needs no schema bump - the same trick the academy's offers use
 *  (`academy-in-<week>`). The week is in the key, so two hires can never collide.
 *
 *  A career migrated from a save written before this tag existed simply has no tagged events, and
 *  `coachSinceWeek` falls back to week 0 - "they have been together as long as anyone can remember",
 *  which is the right answer for a ledger with no record of a change. */
export const COACH_CHANGE_KEY = 'coach-since-'

/** WHEN THE CURRENT COACHING ARRANGEMENT BEGAN - the radar's "weeks together", derived rather than
 *  stored (docs/specs/skills-radar.md §2: no schema bump, no migration, no golden save).
 *
 *  Week 0 for a career that has never changed coach, and the week of the last hire or release
 *  otherwise. BOTH arms count: a new coach has to learn her, and so - as far as the ladder is
 *  concerned - does the parent who takes the court back, because what the rung buys is an eye, and
 *  the eye left with him. */
export function coachSinceWeek(world: WorldState): number {
  let since = 0
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(COACH_CHANGE_KEY) && e.week > since) since = e.week
  }
  return since
}

/** EVERY COMPETITIVE MATCH SHE HAS EVER PLAYED, off the two durable ledgers that already count them:
 *  the running season W-L counters (v10, incremented per kid match at finalizeTournament) and the
 *  per-season history rows (v14, appended at each wrap-up as those counters reset).
 *
 *  ⚠ NOT `world.events.filter(e => e.match)`. The event feed prunes at EVENTS_CAP, so her match
 *  records are a rolling window of roughly the last year and a half - measured on a busy career it
 *  holds 20-40 matches and oscillates rather than grows. The radar needs a count that can only go
 *  UP (see engine/radar.ts, axisEvidence): a confidence that fell because an old match aged out
 *  would re-thicken the fog on its own, which is exactly the shimmer the spec forbids.
 *
 *  Walkovers and medical withdrawals are absent by construction - they never reach finalize, so
 *  they were never counted, and she never took the court. Practice friendlies are absent for the
 *  same reason they are not evidence (R11-2): nothing was on the line. */
export function matchesEverPlayed(world: WorldState): number {
  return (
    world.seasonWins +
    world.seasonLosses +
    world.seasonHistory.reduce((sum, h) => sum + h.wins + h.losses, 0)
  )
}

/** THE TOURNAMENT-WEEK TOGGLE. Pure state, zero draws on any stream - it changes only what the
 *  arithmetic downstream of an unchanged pickInt does with the number it drew, so the frozen MAIN
 *  capture cannot move. Takes effect from the NEXT tick; this week's bill is already written. */
export function setCoachOnEventWeeks(world: WorldState, on: boolean): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  if (world.coachOnEventWeeks === on) return
  world.coachOnEventWeeks = on
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: on
      ? 'Your coach travels to tournaments now – billed on competition weeks too.'
      : 'Your coach stays home on tournament weeks – those weeks are no longer billed.',
  })
}

/** WHAT THE COACH COSTS OVER A SEASON, both ways, so the toggle can be priced rather than guessed.
 *
 *  `weeklyCents` is the same either way - what differs is HOW MANY weeks are billed, so the honest
 *  pair of numbers is the season, not the week. Counted off the season she is actually in: the
 *  off-season weeks are already unbilled for everyone, and `eventWeeks` is the weeks of it she is
 *  entered for. Derived at snapshot time; persists nothing. */
export function coachBilling(world: WorldState): {
  onEventWeeks: boolean
  weeklyCents: number
  eventWeeks: number
  seasonOffCents: number
  seasonOnCents: number
} {
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const rate = coach ? coach.rateCents : selfRateCents(age)
  const weeklyCents = coachWeeklyCents(rate, world.plan, world.profile.background)
  const seasonStart = seasonStartWeek(world.week)
  const seasonEnd = seasonStart + WEEKS_PER_YEAR
  const inSeason = (w: number) => w >= seasonStart && w < seasonEnd
  const eventWeeks = new Set(
    world.season.filter((e) => inSeason(e.week) && world.entries.includes(e.id)).map((e) => e.week),
  ).size
  // The playable weeks of a season are everything but the off-season block.
  const playableWeeks = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
  return {
    onEventWeeks: world.coachOnEventWeeks,
    weeklyCents,
    eventWeeks,
    seasonOffCents: weeklyCents * Math.max(0, playableWeeks - eventWeeks),
    seasonOnCents: weeklyCents * playableWeeks,
  }
}

/** THE MARKET, as the screen needs it: every coach, priced in HER family's corridor at HER age and
 *  HER plan, read against HER game, with what each rung would add for her.
 *
 *  Derived at snapshot time, so it persists nothing and bumps no schema. The ENGINE decides fit,
 *  price, affordability and the gate; the screen only lays them out - the same division upcoming
 *  events already use, and the reason two surfaces can never disagree about what a coach costs. */
export function coachMarket(world: WorldState): CoachMarketRow[] {
  const age = ageAtWeek(world.week)
  const points = kidPoints(world, 'domestic') // ⚠ the Elite gate's currency – see hireCoach above
  const weeklyIncome = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  return buildCoachRoster(world.seed, age).map((coach) => {
    const fit = coachFitFor(coach, world.profile.playStyle)
    const [upliftLo, upliftHi] = coachSeasonUplift({
      skills: SKILL_KEYS.map((k) => world.skills[k]),
      potential: SKILL_KEYS.map((k) => world.potential[k]),
      plan: world.plan,
      tier: coach.tier,
      fit,
      ageFactor: ageFactor(age),
      trainFactor: trainFactor(world.plan),
    })
    return {
      id: coach.id,
      tier: coach.tier,
      name: coach.name,
      style: coach.style,
      fit,
      weeklyCents: coachWeeklyCents(coach.rateCents, world.plan, world.profile.background),
      current: world.coachId === coach.id,
      // AFFORDABLE MEANS "against the week's income", not "against the reserve". A reserve pays for
      // one week of anything; what the family is actually deciding is whether this bill fits the
      // money that arrives every week, which is the number the budget meter draws.
      overBudgetCents: Math.max(0, coachWeeklyCents(coach.rateCents, world.plan, world.profile.background) - weeklyIncome),
      lockedPoints: eliteGateShortfall(coach, points),
      upliftPct: [upliftLo, upliftHi] as [number, number],
      loadNote: coachLoadNote(coach.tier),
    }
  })
}

/** WHAT EACH RUNG DOES ABOUT HER BODY, for the market card - the load wave's two new differences said
 *  in one sentence each: how good the medical team is, and how much deciding he takes off the parent.
 *
 *  Written as PROSE rather than numbers on purpose. The measured spread between hired rungs is a few
 *  injury weeks over four years - real, and far too small to print as a figure without promising a
 *  precision 120 seeds do not support. What IS crisply different is the second half (taps per career run
 *  6.7 at budget to 2.0 at elite, a 3.4x ladder), and that is a thing a sentence can say honestly. */
export function coachLoadNote(tier: CoachTier): string {
  switch (tier) {
    case 'self':
      return 'You manage her load – every call is yours, and nobody is watching her but you.'
    case 'budget':
      return 'Basic physio. He handles the easy calls and brings you the rest.'
    case 'middle':
      return 'Proper physio. He decides most weeks himself.'
    case 'high':
      return 'A good medical team. He rarely needs to ask you.'
    case 'elite':
      return 'The best medical team money buys. He handles her body, and you hear about it after.'
  }
}

/** What he says when he would rather she skipped a trip. Three sentences, picked by HOW tired she is
 *  rather than by luck - a draw here would make the same coach say different things about the same
 *  Tuesday, and the card is re-derived on every snapshot. Player copy: short dash only.
 *
 *  The J300 line names the stake because that is the honest argument at the top of the ladder: the
 *  entry fee and the flights are real money, and a first-round exit spends them for nothing. */
export function coachEntryLine(tier: TierId, condition: number): string {
  const floor = ECONOMY.availability.minConditionToEnter[tier]
  if (condition < floor - 5) return 'Your coach would not take her. She is empty.'
  if (condition < floor) return 'Your coach would skip this one and get her legs back.'
  return 'Your coach thinks she is a week short of her best for this.'
}

// =================================================================================================
// THE COACH AS SCHEDULER – his opinion about WHICH EVENT (the owner, 08.08: «да, идём этим путём,
// начинай с расписания»)
// =================================================================================================
//
// ⚠ WHY THIS EXISTS, AND IT IS NOT A BRAKE BOLTED ONTO A LADDER FIX. The coach was a skill-growth
// multiplier and nothing else, and growth is a share of REMAINING headroom - so past ~90% realised
// he buys nothing measurable (budget and elite were measured printing the SAME number at 93.4%
// realised, while elite still bills $312 a week). The role did not degrade gracefully; it ran out of
// a job. The owner's answer is an arc: early years he buys growth, later he buys SCHEDULING, load,
// opponent preparation and the emotional part. The reason to pay him at twenty-two is not that he
// makes her better - she is at her ceiling - it is that he stops her wasting seasons.
//
// SCHEDULING IS THE FIRST PILLAR AND THIS IS IT. It arrives with the ladder floor because the floor
// is what created the decision: having somewhere to play every week is the correct state of the
// world (his ruling), what she does with those weeks is the PLAYER's, and this is the person he is
// already paying making that decision informed rather than blind.
//
// ⚠ IT INVENTS NO MECHANIC, which is `docs/specs/coach-as-load-manager.md`'s own standing rule for
// this family - "what moves is WHO DECIDES". The surface is built: `coachCaution` renders on the
// event row in both feeds, and SeasonScreen already folds it into the enter-confirm and turns the
// button from "Enter" into "Push through" when he speaks. What is added is one thing he has an
// opinion about. Today he only ever talks about her CONDITION and has no view on WHICH event.
//
// ⚠ HE ONLY EVER TALKS ABOUT A RUNG SHE HAS WALKED PAST. That single gate is what bounds the rate:
// her working rung is where he wants her and he has nothing to add there, and a genuine choice
// INSIDE her window is the player's taste, not his business. Measured in
// docs/specs/ladder-floor-2026-08.md §4.
//
// ⚠ AND HE SPEAKS ONLY WITH AN ARGUMENT. A rung she has outgrown on a week with nothing better and
// nothing to say about her book gets SILENCE - because there she should play, which is exactly what
// the owner ruled. A caution on every row is wallpaper inside two seasons; a high rate is a wrong
// threshold, not thoroughness.

/** HOW FAR AHEAD HE PLANS, by his own rung – and it is what makes paying for him a decision again.
 *
 *  The owner's arc in one constant: «a budget coach notices the obvious, an elite one sees the block
 *  ahead». A budget coach is on the court with her, so he can tell you the W50 on Tuesday is a
 *  better draw than the club event on the SAME Tuesday - both are in front of him. He is not sitting
 *  with a calendar three weeks out. Nobody is on a self-coached career, which is the load wave's own
 *  rule ("nobody is being paid to have a view") read one storey up.
 *
 *  ⚠ ZERO IS NOT "SILENT". A budget coach still answers the same-week question, which is the one a
 *  player asks most often; what a horizon of 0 buys is that he never volunteers a plan. */
export const COACH_HORIZON_WEEKS: Record<CoachTier, number> = {
  self: -1,
  budget: 0,
  middle: 2,
  high: 4,
  elite: 6,
}

/** ...AND WHETHER HE IS TRACKING HER RANKING WINDOW AT ALL – the other half of the tier read, and
 *  the same distinction stated as a job rather than as a number. "Even a title here would not move
 *  her ranking" is not something you see from the court: it is a fact about her best-N book that
 *  somebody has to be keeping. Budget does not; middle and up do, which is precisely what
 *  `coachLoadNote` already promises of those rungs ("Proper physio. He decides most weeks himself"). */
export function coachReadsTheBook(tier: CoachTier): boolean {
  return tier === 'middle' || tier === 'high' || tier === 'elite'
}

/** WOULD HE RATHER SHE SPENT THIS WEEK SOMEWHERE ELSE? Null when he has nothing to say, which is
 *  most of the time by construction.
 *
 *  The clauses, in the order a player needs them:
 *    0. she has not passed this rung, or nobody is paid to have a view -> silence.
 *    1. THIS WEEK'S CHOICE. A rung she has NOT passed is on the same week -> he names it. The most
 *       actionable thing he can say, because it tells the player what to click instead.
 *    2. THE BOOK. Even a title here cannot enter her ranking window -> he says so. Arithmetic rather
 *       than opinion, and only from a coach who keeps the book (see `coachReadsTheBook`).
 *    3. THE BLOCK AHEAD. A rung she has not passed lands inside HIS horizon -> he would save her for
 *       it, and he NAMES it: a caution that only says no is a guard rail, not a coach.
 *    4. otherwise -> silence. Nothing better exists, so playing is right.
 *
 *  ⚠ THE ALTERNATIVES ARE A RUNG TEST AND NOT AN EVENT GATE, deliberately. Asking `entryStatus` of
 *  every candidate would put a second full gate walk inside the snapshot's per-card loop for an
 *  opinion, and the honest content of the sentence is "there is a W50 on the calendar in three
 *  weeks", which is a fact about the RUNG. If she turns out to be unavailable that week he was wrong
 *  about a Tuesday, which is a thing a coach is allowed to be.
 *
 *  ⚠ THE TIER IS A PARAMETER RATHER THAN A LOOKUP. `coachById` rebuilds the whole roster from the
 *  seed, and the caller already holds the answer (`toSnapshot` computes it once per snapshot for the
 *  body arm). Passing it in also makes whose opinion this is impossible to get wrong. */
export function coachLadderNote(world: WorldState, event: SeasonEvent, coachTier: CoachTier): string | null {
  const horizon = COACH_HORIZON_WEEKS[coachTier]
  if (horizon < 0) return null
  if (!hasOutgrown(world, event.tier)) return null
  const better = (from: number, to: number) =>
    world.season
      .filter((e) => e.week >= from && e.week <= to && tierOpenFor(world, e.tier) && !hasOutgrown(world, e.tier))
      .sort((a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
  const sameWeek = better(event.week, event.week)
  if (sameWeek) {
    return `Your coach says the ${TIERS[sameWeek.tier].label} is the week – this one will not move anything.`
  }
  if (coachReadsTheBook(coachTier) && bookClosedTo(world, event.tier)) {
    return 'Your coach says even a title here would not move her ranking.'
  }
  const ahead = horizon > 0 ? better(event.week + 1, event.week + horizon) : undefined
  if (!ahead) return null
  const weeks = ahead.week - event.week
  const when = weeks === 1 ? 'next week' : `in ${weeks} weeks`
  return `Your coach would save her for the ${TIERS[ahead.tier].label} ${when}.`
}
