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
import { WEEKS_PER_YEAR } from '../season/calendar'
import { ECONOMY } from '../economy'
import type { TierId } from '../season/types'
import { ageFactor, SKILL_KEYS, trainFactor } from '../development'
import type { CoachMarketRow, CoachTier, PlayerProfile } from '../../shared/protocol'
import { parentIncomeForWeekCents } from '../economy'
import { addEvent, seasonStartWeek } from './ledger'
import { ageAtWeek, START_AGE_YEARS } from './age'
import { kidPoints } from './ladder'
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

/** THE COACH-TRAVELS-WITH-HER STANCE. Pure state, zero draws on any stream - it changes only what
 *  the arithmetic downstream of an unchanged pickInt does with the number it drew, so the frozen
 *  MAIN capture cannot move. Takes effect from the NEXT tick; this week's bill is already written.
 *
 *  ⚠ IT NO LONGER MOVES THE RETAINER (owner, 08.08). Until this wave the flag decided whether the
 *  weekly bill was charged on a competition week at all, which conflated travel with the retainer -
 *  see `coachWorksThisWeek` for the owner's own separation of the two. The retainer is now
 *  unconditional and this flag means travel, so it is a persisted stance with no arithmetic behind
 *  it yet: the travel mechanic itself is still deferred (locked row on screen T, 30.07). The field,
 *  the command and the copy are kept so the mechanic has somewhere to land - deleting them would
 *  cost a schema change now and a second one when travel ships. */
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
      ? 'Your coach travels to tournaments with her now.'
      : 'Your coach no longer travels to tournaments – he works with her at home.',
  })
}

/** WHAT THE COACH COSTS OVER A SEASON - one number, because since 08.08 there is only one.
 *
 *  ⚠ THE PAIR IS GONE AND SO IS THE 49-WEEK QUOTE, and the second half is a bug this wave found.
 *  The old shape returned `seasonOffCents` / `seasonOnCents` priced over `WEEKS_PER_YEAR -
 *  OFF_SEASON_WEEKS` = 49 weeks, on the reasoning that the off-season is unbilled for everyone. It
 *  is not: `resolveBaseCosts` runs on every tick and `coachWorksThisWeek` never asked about the
 *  off-season, so the coach has always billed all 52 - confirmed on the owner's save, where weeks
 *  205/206/207 cost $309/$329/$321. The quote was understating his real season by three weeks. It
 *  now prices exactly what the engine charges: every week of the year except the ones a booked
 *  holiday stands him down for.
 *
 *  ⚠ `eventWeeks` IS READ OFF THE SEASON SHE IS IN *OR* THE ONE SHE JUST PLAYED. `world.entries`
 *  empties when the calendar rolls, so a save taken in the off-season used to report 0 tournament
 *  weeks - the owner's own save did, at week 255. It is no longer load-bearing for the bill, but it
 *  is still shown, and a figure that silently reads zero for three weeks a year is worse than none.
 *
 *  Derived at snapshot time; persists nothing. */
export function coachBilling(world: WorldState): {
  onEventWeeks: boolean
  weeklyCents: number
  eventWeeks: number
  /** the weeks of the coming year the retainer is actually charged for */
  billedWeeks: number
  seasonCents: number
} {
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const rate = coach ? coach.rateCents : selfRateCents(age)
  const weeklyCents = coachWeeklyCents(rate, world.plan, world.profile.background)
  const seasonStart = seasonStartWeek(world.week)
  const countEntered = (from: number) => {
    const to = from + WEEKS_PER_YEAR
    return new Set(
      world.season.filter((e) => e.week >= from && e.week < to && world.entries.includes(e.id)).map((e) => e.week),
    ).size
  }
  // The season she is in; and if the calendar has just rolled and she has entered nothing yet, the
  // one she has just finished, which is the honest answer to "how much of her year is tournaments".
  const eventWeeks = countEntered(seasonStart) || countEntered(seasonStart - WEEKS_PER_YEAR)
  const billedWeeks = Math.max(0, WEEKS_PER_YEAR - coachedWeeksLostToRest(world))
  return {
    onEventWeeks: world.coachOnEventWeeks,
    weeklyCents,
    eventWeeks,
    billedWeeks,
    seasonCents: weeklyCents * billedWeeks,
  }
}

/** How many of the NEXT `WEEKS_PER_YEAR` weeks the coach is stood down for, which since 08.08 is
 *  booked family holidays and nothing else. College is not counted here: a career inside the fork is
 *  not shopping for a coach, and the market screen is the only caller.
 *
 *  ⚠ IT IS THE ONE PLACE "how much of him does she actually get" IS ANSWERED, and both callers need
 *  the same answer: the season price above, and `coachMarket`'s uplift below. A rung quoted over 52
 *  coached weeks that she only buys 49 of is exactly the over-quote this wave exists to remove, and
 *  two copies of this arithmetic would drift the first time a third exemption is added. */
function coachedWeeksLostToRest(world: WorldState): number {
  // A VacationBooking is exactly one week - `vacationForWeek` matches on `v.week === week` - so a
  // fortnight at the sea is two bookings and counting rows is counting weeks.
  const from = world.week
  const to = from + WEEKS_PER_YEAR
  const weeks = new Set((world.vacations ?? []).map((v) => v.week).filter((w) => w >= from && w < to))
  return Math.min(WEEKS_PER_YEAR, weeks.size)
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
  // ⚠ THE QUOTE IS OVER THE WEEKS SHE WILL ACTUALLY HAVE HIM (08.08). Same arithmetic the season
  // price uses, from the same helper, so the card and the bill can never describe different years.
  const coachedWeeks = ECONOMY.coach.upliftHorizonWeeks - coachedWeeksLostToRest(world)
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
      coachedWeeks,
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

/**
 * HOW MUCH ROOM IS LEFT IN HER, in one sentence - the context every number on screen T is relative to.
 *
 * ⚠ WHY THIS EXISTS (owner, 08.08). `coachSeasonUplift` is a share of REMAINING headroom, so as she
 * fills her ceiling every rung's quote collapses towards zero AND towards each other. Measured on the
 * owner's own save at 93.4% realised: the cheapest budget coach prints +0.1-0.2% and the dearest elite
 * one +0.2-0.5%, so the entire ladder fits inside four tenths of a point and his $312/wk high coach
 * reads identically to the elite rung above it. The market had stopped discriminating and the screen
 * said nothing about why - which is how a number that moves on its own reads as a swindle.
 *
 * ⚠ IT IS A SENTENCE, NOT A STAT, and deliberately: `KidScreen` keeps her ceiling behind a fog of war
 * («the truth never crosses this line - `Snapshot` carries no `skills`»), so printing "93.4% of her
 * potential" here would hand the player through the back door the whole radar design exists to shut.
 * A band of four phrasings says the thing that changes a decision - is a better coach worth buying -
 * without ever quoting the ceiling itself.
 *
 * Pure, zero draws, derived at snapshot time.
 */
export function coachRoomNote(world: WorldState): string {
  const skills = SKILL_KEYS.map((k) => world.skills[k])
  const headroom = SKILL_KEYS.map((k) => Math.max(0, world.potential[k] - world.skills[k]))
  const level = skills.reduce((a, b) => a + b, 0) / skills.length
  const room = headroom.reduce((a, b) => a + b, 0) / headroom.length
  if (level + room <= 0) return ''
  const realised = level / (level + room)
  if (realised < 0.6) return 'She has a long way to go – this is where a coach buys the most.'
  if (realised < 0.8) return 'There is real room left in her game, and a coach is what buys it.'
  if (realised < 0.92) return 'She is closing on her own ceiling – every rung is worth less than it was.'
  return 'She is near her own ceiling now. No coach can add much more, whatever he costs.'
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
