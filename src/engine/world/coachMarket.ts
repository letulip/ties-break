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
import { bestFitCoachAt, buildCoachRoster, coachById, coachEdgePlacement, coachFitFor, coachIncludesPhysio, coachSeasonUplift, coachTierById, coachWeeklyCents, COACH_EDGE_CORRIDOR_PP, COACH_TIER_LABEL, eliteGateShortfall, practiceCoachRateCents, facilityRateCents, tierOf } from '../coach'
import { OFF_SEASON_WEEKS, TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import { ECONOMY } from '../economy'
import type { LadderTrack, SeasonEvent, TierId } from '../season/types'
import { ageFactor, SKILL_KEYS, trainFactor } from '../development'
import { LADDER_LABEL, LADDER_TRACKS } from '../../shared/protocol'
import type { CoachEdgePlacement, CoachMarketRow, CoachTier, KitOfferTerms, PlayerProfile } from '../../shared/protocol'
import { parentIncomeForWeekCents } from '../economy'
import { activeKitDeal } from '../offers'
// ⭐ ROUND-21 #2: the ONE fare definition, read rather than re-derived - see `coachTravelFareFor`,
// which lives beside it in world/sponsors.ts. sponsors.ts imports nothing from this module, so this
// runs one way exactly as `../offers` above does.
import { travelCostFor } from './sponsors'
import { addEvent, seasonIndexOf, seasonStartWeek } from './ledger'
import { ageAtWeek, START_AGE_YEARS } from './age'
import { activeLadderOf, bookClosedTo, hasOutgrown, kidPoints, tierOpenFor } from './ladder'
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
 *  ⚠ IT NO LONGER MOVES THE RETAINER (owner, 08.08). Until that wave the flag decided whether the
 *  weekly bill was charged on a competition week at all, which conflated travel with the retainer -
 *  see `coachWorksThisWeek` for the owner's own separation of the two. The retainer is unconditional
 *  and this flag means travel, and only travel.
 *
 *  ⚠⚠ ROUND-21 #2 - IT HAS A CALLER NOW, AND THAT IS THE WHOLE ITEM. Owner, 14.08, asking for the
 *  THIRD time: «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу сделать.» The
 *  mechanic was cancelled on 30.07 after three STAT versions of it were measured and all three failed
 *  (commit `77e08aa`), and round-20 #1 answered the second ask with an explanation instead of a
 *  build. Asking a third time overrules the cancellation - and what he asked for when asked what to
 *  build is not a fourth invisible bonus: «Присутствие в потоке и трансляции точно надо (если едет).»
 *
 *  SO WHAT THIS SWITCH BUYS IS PRESENCE, AND PRESENCE IS THE WHOLE OF IT HERE. He goes; it costs a
 *  second fare (`coachTravelFareFor`); and the tournament flow, the running commentary and the week's
 *  story all say so. NO STAT MOVES on this branch - the three that were tried are in the commit
 *  above, and re-measuring them on the rebuilt bench is a separate arm of the same wave. */
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
    // ⚠ NO PRONOUN FOR THE COACH (R15-7) – see the note on `coachLoadNote` below for the ruling.
    text: on
      ? 'Your coach travels to tournaments with her now – a second fare on every trip.'
      : 'Your coach no longer travels to tournaments – the work happens at home.',
  })
}

/** ⭐ ROUND-21 #2 - IS HE ON THE TRIP? The one predicate every presence surface reads, so the flow,
 *  the commentary, the week's story and the till can never disagree about whether he was there.
 *
 *  Two clauses and both are the stance stating itself: the switch is on, AND there is somebody to
 *  send. A self-coached family has no second seat to buy (`coachTravelFareFor` refuses the charge for
 *  the same reason), and a parent who is already in the car is not "travelling with her".
 *
 *  ⚠ IT DOES NOT ASK WHETHER THIS WEEK IS A COMPETITION WEEK, deliberately: every caller already
 *  knows it is - the flow is showing a tournament, the commentary is narrating a match, the week's
 *  story is captioning the drive home - and folding that question in here would make the predicate
 *  mean something different at each of them. Pure; zero draws. */
export function coachTravelsWithHer(world: WorldState): boolean {
  return world.coachOnEventWeeks && world.coachId !== null
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
  /** ⭐ ROUND-21 #2: WHAT SENDING HIM WOULD ADD over the trips she has actually booked this season,
   *  in cents. Zero when nothing is booked, and zero for a self-coached family - see
   *  `coachTravelFareFor`, which is the one definition this sums and the reason the row on screen T
   *  and the line on the till can never quote different money. Quoted whether the switch is ON or
   *  OFF, because it is the price of the decision rather than a receipt for one. */
  travelFareCents: number
  /** ...and how many trips that is, so the screen can say "over the 9 she has booked" rather than
   *  printing a season total with nothing to divide it by. */
  travelTrips: number
  /** ⭐ ROUND-21 #12: THE CAP THE BUDGET METER DRAWS AGAINST, carried rather than reverse-engineered.
   *
   *  The screen used to RECOVER it from any row that was over budget
   *  (`weeklyCents - overBudgetCents === the cap`), which worked only while some row was over. Fixing
   *  the income made the owner's own case - a million banked - the case where NO row is over, and the
   *  meter would then have printed a $0.00 weekly cap with a full bar beside it. A number the screen
   *  needs is a number the engine should hand over. */
  weeklyIncomeCents: number
} {
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const rate = coach ? coach.rateCents : facilityRateCents(age, tierOf(coach))
  const weeklyCents = coachWeeklyCents(rate, world.plan, world.profile.background)
  const seasonStart = seasonStartWeek(world.week)
  const enteredIn = (from: number) => {
    const to = from + WEEKS_PER_YEAR
    return world.season.filter((e) => e.week >= from && e.week < to && world.entries.includes(e.id))
  }
  const countEntered = (from: number) => new Set(enteredIn(from).map((e) => e.week)).size
  // The season she is in; and if the calendar has just rolled and she has entered nothing yet, the
  // one she has just finished, which is the honest answer to "how much of her year is tournaments".
  const thisSeason = enteredIn(seasonStart)
  const booked = thisSeason.length > 0 ? thisSeason : enteredIn(seasonStart - WEEKS_PER_YEAR)
  const eventWeeks = countEntered(seasonStart) || countEntered(seasonStart - WEEKS_PER_YEAR)
  const billedWeeks = Math.max(0, WEEKS_PER_YEAR - coachedWeeksLostToRest(world))
  // ⭐ ROUND-21 #2: the second seat, over the trips on her card. `travelCostFor` is the ONE fare
  // definition (world/sponsors.ts) and `coachTravelFareFor` is its doubling, so this cannot drift
  // from the number the till charges - but it is priced for a family that has NOT flipped the switch
  // yet, which is the whole point of a price, so the stance is deliberately not consulted here.
  const travelFareCents = world.coachId === null ? 0 : booked.reduce((sum, e) => sum + travelCostFor(world, e), 0)
  return {
    onEventWeeks: world.coachOnEventWeeks,
    weeklyCents,
    eventWeeks,
    billedWeeks,
    seasonCents: weeklyCents * billedWeeks,
    travelFareCents,
    travelTrips: world.coachId === null ? 0 : booked.length,
    weeklyIncomeCents: familyWeeklyIncomeCents(world),
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

/** ⭐ ROUND-21 #12 – WHAT ARRIVES EVERY WEEK, ALL OF IT (owner, 14.08).
 *
 *  His report, verbatim: «у нас есть ещё %, надо их тоже учитывать и суммировать, а то на счету
 *  1млн, а элитного тренера какого-то нельзя брать.»
 *
 *  ⚠ MEASURED BEFORE ANYTHING WAS CHANGED, on a real career at week 120 with his million banked:
 *  the parents' contribution was $482.94/wk, the savings interest $600.00/wk, and the market's
 *  affordability test read the FIRST NUMBER ALONE - so all four Elite coaches printed "$33-176
 *  over" while more than half of the family's weekly money was invisible to the test that was
 *  refusing them. The «%» he names is `ECONOMY.savings.apyWeekly`: `accrueSavingsInterest` credits
 *  round(fundsCents x apyWeekly) at the top of EVERY tick, deterministically and with zero RNG -
 *  it is a wage the balance pays, not a windfall, and at a million it is larger than the parents'
 *  own. So this is a defect in the DENOMINATOR, not a wording problem.
 *
 *  ⚠ WHAT COUNTS IS "ARRIVES EVERY WEEK WHATEVER SHE DOES", and the two exclusions are the rule
 *  stating itself. PRIZE MONEY, appearance fees and result bonuses are not here: they are paid for
 *  a RESULT, a season of them is lumpy, and a weekly retainer underwritten by them is a family one
 *  bad draw away from not being able to pay. THE RESERVE is not here either - that is the original
 *  ruling on `overBudgetCents` below ("a reserve pays for one week of anything") and it survives
 *  untouched: this changes what the week's income IS, not what income means.
 *
 *  ⚠ AND A KIT RETAINER IS PRO-RATED RATHER THAN COUNTED ON ITS OWN WEEK. `payRetainer` pays it
 *  four times a year (`isRetainerWeek`, at season offsets 0/13/26/39), so counting it whole would
 *  make an Elite coach affordable on four weeks of the year and refused on the other forty-eight -
 *  a market that flickers. It is a contracted wage, and a wage divided by the weeks it covers is
 *  what a family can actually spend of it each week.
 *
 *  Pure: zero draws on any stream, derived at snapshot time like everything else on this screen. */
export function familyWeeklyIncomeCents(world: WorldState): number {
  const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  // The owner's «%», in the SAME expression `accrueSavingsInterest` charges - so the market and the
  // ledger can never disagree about what the balance earns. Floored at zero: an overdrawn family
  // earns nothing, it is not billed negative interest (the accrual returns early below 1 cent).
  const interest = Math.max(0, Math.round(world.fundsCents * ECONOMY.savings.apyWeekly))
  const deal = activeKitDeal(world.offers, world.week)
  const retainerCents = deal ? ((deal.terms as KitOfferTerms).retainerCents ?? 0) : 0
  return parents + interest + Math.round((retainerCents * RETAINERS_A_YEAR) / WEEKS_PER_YEAR)
}

/** How many times a signed kit deal pays its retainer in a year - `isRetainerWeek` is
 *  `week % (WEEKS_PER_YEAR / 4) === 0`, so it is four, and the two must not drift apart. */
const RETAINERS_A_YEAR = 4

/** THE MARKET, as the screen needs it: every coach, priced in HER family's corridor at HER age and
 *  HER plan, read against HER game, with what each rung would add for her.
 *
 *  Derived at snapshot time, so it persists nothing and bumps no schema. The ENGINE decides fit,
 *  price, affordability and the gate; the screen only lays them out - the same division upcoming
 *  events already use, and the reason two surfaces can never disagree about what a coach costs. */
export function coachMarket(world: WorldState): CoachMarketRow[] {
  const age = ageAtWeek(world.week)
  const points = kidPoints(world, 'domestic') // ⚠ the Elite gate's currency – see hireCoach above
  // ⭐ ROUND-21 #12: every stream that arrives every week, not the parents' line alone. See
  // `familyWeeklyIncomeCents` for the measurement that made this a bug rather than a wording fix.
  const weeklyIncome = familyWeeklyIncomeCents(world)
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
      // ⭐ ROUND-21 #12: that income is now ALL of it (`familyWeeklyIncomeCents`) and not the
      // parents' line alone. The ruling above is unchanged - the reserve is still not counted - it
      // is the week's income that was being under-read, by more than half on his own save.
      overBudgetCents: Math.max(0, coachWeeklyCents(coach.rateCents, world.plan, world.profile.background) - weeklyIncome),
      lockedPoints: eliteGateShortfall(coach, points),
      upliftPct: [upliftLo, upliftHi] as [number, number],
      // ⚠ THE RUNG'S CORRIDOR, NEVER HIS OWN NUMBER (spec §4). A number on an unhired card turns the
      // market into a shop window with the prices written on the back: hire, read, fire, repeat until
      // the 0.7 budget coach turns up - and since the value is a property of the MAN, that search
      // would always succeed. The corridor is genuinely all a market can tell you about a price
      // bracket, and it is what the owner asked for («может по-проще "+0.3-0.6% per match"»).
      edgePct: [...COACH_EDGE_CORRIDOR_PP[coach.tier]] as [number, number],
      loadNote: coachLoadNote(coach.tier),
    }
  })
}

/** HOW LONG BEFORE A COACH'S OWN NUMBER GOES ON HIS PLAQUE – a full season with her (spec §4).
 *
 *  You learn what a coach is worth by employing him: that is what scouting is, and it arrives far too
 *  late to shop with. It is also the payoff of the budget lottery and the reason the corridor on the
 *  card is worth reading at all.
 *
 *  ⚠ SINCE ROUND-21 #7c IT IS THE LENGTH OF A SEASON AND NO LONGER THE GATE ITSELF – see
 *  `coachRevealWeek`, which anchors the reveal to a WEEK OF THE CALENDAR instead of counting off a
 *  stopwatch. It stays exported under this name (world.ts re-exports it, and 111 files import from
 *  there) and it stays load-bearing: half of it is the owner's first-half / second-half split. */
export const COACH_EDGE_REVEAL_WEEKS = WEEKS_PER_YEAR

/** ⭐ ROUND-21 #7c – WHEN THE VERDICT LANDS, AND IT IS A DATE IN HER YEAR RATHER THAN A STOPWATCH.
 *
 *  The owner, 14.08: «У тренера на карточке "Too early to tell 49 weeks of 52" - звучит довольно
 *  смешно, сезон уже сыгран. Мне кажется надо во-первых заменить на "обсудим в межсезонье", а
 *  во-вторых убрать привязку к 52 неделям. Если Тренера меняли в первой половине сезона, тогда это
 *  актуально, если во второй - уже можно готовить "мало времени прошло" или вроде того и сдвигать
 *  эту планку дальше по году, может у нас сейчас так - надо проверить.»
 *
 *  ⚠ IT DID NOT ALREADY WORK THAT WAY, and he asked to be told before anything was built. The old
 *  gate was `weeksTogether >= COACH_EDGE_REVEAL_WEEKS`: a ROLLING 52-week bar off `coachSinceWeek`
 *  and nothing else - no season, no calendar, no hire month anywhere in the function. A coach taken
 *  on in week 2 of a season and one taken on in week 40 were treated identically, and the card he
 *  photographed printed "49 weeks of 52" in an off-season with that season already played, counting
 *  down to a Tuesday three weeks into the NEXT year.
 *
 *  THE BAR IS THE OFF-SEASON NOW, because the off-season is when the question is answerable at all:
 *  a season of results is in, and nothing further is learned until the next one starts. This returns
 *  the FIRST off-season week (`isOffSeasonWeek` – the last `OFF_SEASON_WEEKS` of a season year) of
 *  the season he has been present for, and "present for" is the owner's own split: hired in the
 *  first half of a season, that season counts; hired in the second, it does not, and the bar moves a
 *  year down the calendar.
 *
 *  ⚠ THE ANTI-SHOPPING RULE SURVIVES THE MOVE, AND IN THE SECOND HALF IT GETS STRICTER. §4 exists so
 *  the market cannot be read by hire-look-fire, and the price of one read used to be a flat 52
 *  weeks; it is now 24 at the cheapest (hired at season-week 25, revealed at 49) and 75 at the
 *  dearest (hired at season-week 26). What keeps that honest is that the price is no longer
 *  something the player can pay whenever they like: the reveal is pinned to a week of the CALENDAR,
 *  so a hire timed one week late costs a whole extra year – and what it buys is still a THIRD of a
 *  corridor and never a number (§7).
 *
 *  Pure integer arithmetic on the absolute week. Zero draws, nothing persisted. */
export function coachRevealWeek(sinceWeek: number): number {
  const start = seasonStartWeek(Math.max(0, sinceWeek))
  // His split, in one expression: the first half of a season is a season he was there for.
  const inSecondHalf = Math.max(0, sinceWeek) - start >= COACH_EDGE_REVEAL_WEEKS / 2
  return start + (inSecondHalf ? WEEKS_PER_YEAR : 0) + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
}

/** WHERE HE FELL, SAID IN A FAMILY'S OWN WORDS – the three halves of the plaque's second clause
 *  (docs/specs/coach-match-edge.md §7).
 *
 *  ⚠ «THAT BAND» IS THE PRE-REVEAL SENTENCE'S OWN REFERENT, and the pairing is the point. Before the
 *  season is up the card says "Too early to tell WHERE IN THAT BAND"; after it, "the upper end of
 *  that band". One question and its answer, in the same words, pointing at the corridor printed two
 *  lines above - so §4a's shipped copy needed no change at all to carry §7's reformulation.
 *
 *  ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08). `buildCoachRoster` picks a first name off
 *  COACH_FIRST_M *or* COACH_FIRST_F, so a woman sits on every roster by construction - "his bracket"
 *  would print under Sabine Kobayashi. The band belongs to the RUNG anyway, which is why "that band"
 *  is both the pronoun-free phrasing and the accurate one.
 *
 *  ⚠ AND NONE OF THE THREE PRAISES OR BLAMES. They are coordinates, not verdicts: no evaluative word
 *  appears in any of them, the frame around them is byte-identical, and the card draws all three in
 *  the same colour (`.cm-plaque` is deliberately not accent-coloured). A low draw is reported exactly
 *  as a high one is - «мы ни за что не наказываем», read as a rule about copy. */
const PLACEMENT_PHRASE: Record<CoachEdgePlacement, string> = {
  upper: 'the upper end of that band',
  middle: 'the middle of that band',
  lower: 'the lower end of that band',
}

/** THE PLAQUE, IN ONE SENTENCE (docs/specs/coach-match-edge.md §7 + §8a) - what the coach she
 *  actually has turned out to be, or that it is too early to say.
 *
 *  ⚠ IT IS COMPOSED HERE AND NOT ON THE SCREEN, because its two halves answer to DIFFERENT THINGS
 *  and keeping them apart is the whole of §8's ruling 1. The PLACE follows the MAN (a pure draw off
 *  his id, which fire-and-rehire cannot move); the CONFIDENCE follows the CLOCK (`coachSinceWeek`,
 *  which fire-and-rehire restarts). A component holding both would be a second copy of that rule,
 *  and the failure mode is silent: a re-hired coach reading as a different person.
 *
 *  ⚠ THREE BANDS OF CERTAINTY, AT ONE / TWO / THREE-AND-ON SEASONS, and the hedge is the only thing
 *  that moves between them (§8a: «one season is a small sample … by the third the hedge goes»). This
 *  is the radar's own fog applied to a person - confidence grows with observation - and it costs
 *  nothing: no number changes, only how certain the words are. Three rather than two because the
 *  product of §8a is that a long relationship is worth something ON SCREEN by itself, and with two
 *  bands the second season shows the player nothing new. It saturates at three, for the reason §8b
 *  gives for its own curve: the knowledge of a person is mostly acquired early.
 *
 *  ⚠ AND NO SENTENCE QUOTES HIS NUMBER, at any tenure. The only numerals any of these can print are
 *  the weeks of the season she has not finished yet - a clock, never a value.
 *
 *  Player copy: short dash only, and no sentence may promise the radar - the whole corridor is under
 *  half a skill point against a visibility floor of 3 (§3), so "you will see it in her game" is a lie
 *  this screen could not back. */
export function coachPlaqueLine(view: {
  placement: CoachEdgePlacement | null
  /** the week she is in now */
  week: number
  /** the off-season week the verdict lands in – `coachRevealWeek(coachSinceWeek(world))` */
  revealWeek: number
  seasonsTogether: number
}): string {
  // ⭐ ROUND-21 #7a/#7b – THE PRE-REVEAL SENTENCE NAMES THE OFF-SEASON AND COUNTS NOTHING.
  //
  // #7a: «надо во-первых заменить на "обсудим в межсезонье"». The verdict is a conversation the
  // off-season has, so that is what both arms say; "too early to tell" said only that it was not
  // now, which is why it read as absurd printed in an off-season with the season already played.
  //
  // #7b: «во-вторых убрать привязку к 52 неделям». No numeral survives on either arm. A rolling
  // 52-week bar was the wrong clock for a question the SEASON answers, and printing its progress
  // made the card argue with the calendar beside it.
  //
  // ⚠ WHICH ARM IS THE WHOLE OF #7c, AND IT IS READ OFF THE SEASON SHE IS IN rather than off the
  // hire month directly. Same season as the reveal -> the coming off-season is the one, which is
  // his «в первой половине сезона - тогда это актуально». A season short -> «мало времени прошло»
  // and the bar is named a year out. Reading it this way means the sentence FOLLOWS the calendar:
  // a coach hired in week 40 says "ask next off-season" all through that autumn and switches to the
  // near arm by himself when the new season opens, which is the «сдвигать эту планку дальше по году»
  // half. Deriving it from the hire month would have needed a second rule to do that.
  //
  // ⚠ AND «THAT BAND» IS STILL THE REFERENT ON BOTH (§7's pairing): the plaque asks where in the
  // corridor printed two lines above, and the revealed sentence answers in the same words. The
  // LENGTHS are measured, not taste - 52 and 51 characters, inside the 49-58 the nine revealed
  // sentences occupy and under the 60-character two-line ceiling §4a/§7 measured in a real browser
  // at 320px. So both wrap to exactly two lines at 320px and at 375px, and the card does not jump
  // when the reveal lands.
  if (view.placement === null) {
    return seasonIndexOf(view.week) === seasonIndexOf(view.revealWeek)
      ? 'Where in that band – we will know in the off-season.'
      : 'Where in that band – too soon, ask next off-season.'
  }
  const place = PLACEMENT_PHRASE[view.placement]
  // ONE SEASON IS ONE LOOK. The hedge is doing honest work here: a season is a small sample and the
  // sentence says so in the register a parent would use, not in a confidence interval.
  if (view.seasonsTogether <= 1) return `A season in – it looks like ${place}.`
  // TWO SEASONS: THE FIRST READ SURVIVED A SECOND YEAR. "It holds" is the whole of the middle band -
  // the same placement, arrived at twice.
  if (view.seasonsTogether === 2) return `Two seasons in, and it holds – ${place}.`
  // THREE AND ON: THE HEDGE IS GONE, and its absence is the confidence. No counter either - "season
  // after season" saturates the way §8a says the knowledge does, and it cannot go stale at ten.
  return `Season after season – ${place}.`
}

/** WHAT THE COACH'S EDGE IS WORTH ON THIS CAREER, as the UI needs it (docs/specs/coach-match-edge.md
 *  §4 and §7) - the rung's corridor always, and WHERE IN IT HE FELL once she has had him for a season.
 *
 *  ⚠ THE ENGINE OWNS "HAS HE BEEN HERS FOR A SEASON", not the component. It is a rule about the
 *  career, it decides whether the reveal may be shown at all, and a screen that re-derived it from a
 *  hire date would be the second copy of a rule this file already keeps - `coachSinceWeek` is the
 *  SAME "weeks together" the radar's fog reads, so a coach cannot be new to his plaque and old to her
 *  confidence on the same Tuesday.
 *
 *  ⚠ FIRE-THEN-REHIRE RESETS THE CLOCK, AND DOES NOT RESET THE PLACE (§8, ruling 1). `coachSinceWeek`
 *  is the week the current arrangement began, so a man who is let go and taken back has to earn his
 *  plaque again - which is what "a full season with her" literally says, and it is the conservative
 *  direction for the anti-shopping rule §4 exists for. What he cannot do is come back a DIFFERENT
 *  coach: the placement is re-derived off his id, so it is the same verdict waiting behind the same
 *  season, and only the hedging has started over.
 *
 *  Derived at snapshot time; persists nothing, exactly like `coachMarket` and `coachBilling`. */
export function coachEdgeView(world: WorldState): {
  /** [lo, hi] pp per match for the rung she is on - [0, 0] self-coached, which is not a corridor */
  corridorPct: [number, number]
  /** WHICH THIRD of that corridor he landed in, or null while there is nothing honest to show. His
   *  own pp figure is deliberately NOT on this view: it is not observable in principle (§7). */
  placement: CoachEdgePlacement | null
  /** is `placement` set - the plaque's own gate, so the screen never asks twice */
  revealed: boolean
  /** how long they have been together, in weeks */
  weeksTogether: number
  /** ⭐ ROUND-21 #7c: ...and THE WEEK THE VERDICT LANDS IN – an off-season, absolute, not a duration.
   *  Was `revealAfterWeeks: 52`, a rolling bar that ignored the calendar; see `coachRevealWeek`. */
  revealWeek: number
  /** the same clock in whole seasons - what §8a bands the plaque's confidence on */
  seasonsTogether: number
  /** the plaque, written: place x confidence, one sentence */
  plaqueLine: string
} {
  const tier = coachTierById(world.coachId)
  const since = coachSinceWeek(world)
  const weeksTogether = Math.max(0, world.week - since)
  // ⚠ SEASONS ARE DERIVED HERE AND NOT IN THE COMPONENT, for the same reason the reveal gate is:
  // "how long has he been hers" is the engine's question, and the confidence bands are one more
  // reading of the answer. Whole seasons only - a partial one has not been observed yet.
  const seasonsTogether = Math.floor(weeksTogether / WEEKS_PER_YEAR)
  // ⭐ ROUND-21 #7c – THE GATE IS A DATE NOW. It was `weeksTogether >= COACH_EDGE_REVEAL_WEEKS`, and
  // the copy above may only promise an off-season if the reveal really arrives in one: a sentence
  // this screen could not back is the failure mode the whole plaque family is written against.
  const revealWeek = coachRevealWeek(since)
  const seasoned = world.coachId !== null && world.week >= revealWeek
  const placement = seasoned ? coachEdgePlacement(world.seed, world.coachId) : null
  // ⚠ `revealed` IS "THERE IS A PLACE TO NAME", not "the clock is up" - so a degenerate corridor
  // (a zeroed bench table, an id no roster knows) leaves the card saying it is too early rather than
  // announcing a reveal with nothing behind it. The two can only disagree in a state that cannot
  // ship, and disagreeing quietly is exactly how a screen ends up printing an empty plaque.
  const revealed = placement !== null
  return {
    corridorPct: [...COACH_EDGE_CORRIDOR_PP[tier]] as [number, number],
    placement,
    revealed,
    weeksTogether,
    revealWeek,
    seasonsTogether,
    plaqueLine: coachPlaqueLine({ placement, week: world.week, revealWeek, seasonsTogether }),
  }
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
  return 'She is near her own ceiling now. No coach can add much more, whatever the price.'
}

/** WHAT EACH RUNG DOES ABOUT HER BODY, for the market card - the load wave's two new differences said
 *  in one sentence each: how good the medical team is, and how much deciding he takes off the parent.
 *
 *  Written as PROSE rather than numbers on purpose. The measured spread between hired rungs is a few
 *  injury weeks over four years - real, and far too small to print as a figure without promising a
 *  precision 120 seeds do not support. What IS crisply different is the second half (taps per career run
 *  6.7 at budget to 2.0 at elite, a 3.4x ladder), and that is a thing a sentence can say honestly.
 *
 *  ⚠ AND NO PRONOUN NAMES THE COACH ON ANY OF THEM (R15-7, owner 09.08). `buildCoachRoster` picks a
 *  first name off COACH_FIRST_M *or* COACH_FIRST_F by `slot.gender`, so a woman sits on every roster
 *  by construction, and these four rungs all called her "he". The owner's own fix: drop the pronoun
 *  and join the two halves with a dash. The LADDER these sentences draw is untouched - each rung still
 *  says how good the medical team is and how much of the deciding comes off the parent - and the
 *  parent stays the subject wherever the sentence has one, so none of them slid into a form's voice. */
export function coachLoadNote(tier: CoachTier): string {
  switch (tier) {
    case 'self':
      return 'You manage her load – every call is yours, and nobody is watching her but you.'
    case 'budget':
      return 'Basic physio – the easy calls are handled, and the rest come to you.'
    case 'middle':
      return 'Proper physio – most weeks are decided without you.'
    case 'high':
      return 'A good medical team – you are rarely the one asked.'
    case 'elite':
      return 'The best medical team money buys – her body is handled, and you hear about it after.'
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
// THE COACH AS SCHEDULER – his opinion about WHICH EVENT (the owner's ruling of 08.08, quoted
// verbatim in docs/specs/ladder-floor-2026-08.md §4: yes, take that route, start with scheduling)
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
 *  `coachLoadNote` already promises of those rungs ("Proper physio – most weeks are decided without
 *  you"). */
export function coachReadsTheBook(tier: CoachTier): boolean {
  return tier === 'middle' || tier === 'high' || tier === 'elite'
}

/** WOULD HE RATHER SHE SPENT THIS WEEK SOMEWHERE ELSE? Null when he has nothing to say, which is
 *  most of the time by construction.
 *
 *  The clauses, in the order a player needs them:
 *    0. she has not passed this rung, or nobody is paid to have a view -> silence.
 *    1. THIS WEEK'S CHOICE. A rung she has NOT passed, on a table she is CLIMBING, is on the same
 *       week -> he names it. The most actionable thing he can say, because it tells the player what
 *       to click instead. The half-sentence after the dash is whichever of three claims is TRUE:
 *         a. the card pays into a table she is not climbing -> he says THAT, and names the currency.
 *            Checked FIRST, even when that dead table's window also happens to be full: the track is
 *            the situation's own name, and it stays true when the window empties. A National Series
 *            title may still move her national standing - it just is not the table her career is on.
 *         b. her book is shut to this card's title -> "this one will not move anything". The
 *            strongest claim in the function, and it is bookClosedTo's sentence, so it now asks
 *            bookClosedTo - and only a coach who keeps the book may say it (`coachReadsTheBook`).
 *            After (a), the card is on a climbing table, so a shut window really does mean nothing
 *            anywhere can move: a title pays into exactly one table.
 *         c. otherwise -> "she has outgrown this one", the gate that let him speak at all. A result
 *            here could still move her ranking, so no stronger claim is available to him.
 *    2. THE BOOK. Even a title here cannot enter her ranking window -> he says so. Arithmetic rather
 *       than opinion, and only from a coach who keeps the book (see `coachReadsTheBook`).
 *    3. THE BLOCK AHEAD. A rung she has not passed lands inside HIS horizon -> he would save her for
 *       it, and he NAMES it: a caution that only says no is a guard rail, not a coach.
 *    4. otherwise -> silence. Nothing better exists, so playing is right.
 *
 *  ⚠ WHY 1b IS GATED AND 1a/1c ARE NOT (the owner's card of 12.08: «the National Series is the week
 *  - this one will not move anything» on a World Tour 35 whose book had room). "Will not move
 *  anything" borrowed clause 2's arithmetic without asking clause 2's question: measured on the
 *  probe's careers (tools/coach-ladder-claim-probe.ts), 87% of the cards it dismissed had room in
 *  their own best-N book - the sentence was false - and 84% of the alternatives it held up paid into
 *  a DIFFERENT table, usually a domestic rung held up against her professional card. The claim is
 *  arithmetic, so it now fires only when the arithmetic says it (a shut book moves nothing anywhere:
 *  a title pays into exactly one table, and that table's window cannot take it). Which table an
 *  event pays into and which table she is on are court-visible facts, so 1a/1c stay open to every
 *  hired rung - the same license split clause 2 has always had.
 *
 *  ⚠ AND THE ALTERNATIVE MUST BE ON A TABLE SHE IS CLIMBING - `activeLadderOf` and up, never down.
 *  `better()` used to rank candidates by TIER_LADDER alone, so a domestic rung whose band her decayed
 *  domestic points no longer clear ("not outgrown" by the window's arithmetic, not by her level)
 *  outranked nothing-this-week on a professional card. The professional arm is a one-way door
 *  (activeLadderOf's own rule); the coach does not point back through it.
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
  const firstClimbed = LADDER_TRACKS.indexOf(activeLadderOf(world))
  const climbs = (track: LadderTrack): boolean => LADDER_TRACKS.indexOf(track) >= firstClimbed
  const better = (from: number, to: number) =>
    world.season
      .filter(
        (e) =>
          e.week >= from && e.week <= to && climbs(TIERS[e.tier].track) && tierOpenFor(world, e.tier) && !hasOutgrown(world, e.tier),
      )
      .sort((a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
  const shut = coachReadsTheBook(coachTier) && bookClosedTo(world, event.tier)
  const sameWeek = better(event.week, event.week)
  if (sameWeek) {
    const alt = TIERS[sameWeek.tier].label
    if (!climbs(TIERS[event.tier].track)) {
      const currency = LADDER_LABEL[TIERS[event.tier].track].toLowerCase()
      return `Your coach says the ${alt} is the week – this pays ${currency} points, not the table she is climbing.`
    }
    if (shut) return `Your coach says the ${alt} is the week – this one will not move anything.`
    return `Your coach says the ${alt} is the week – she has outgrown this one.`
  }
  if (shut) return 'Your coach says even a title here would not move her ranking.'
  const ahead = horizon > 0 ? better(event.week + 1, event.week + horizon) : undefined
  if (!ahead) return null
  const weeks = ahead.week - event.week
  const when = weeks === 1 ? 'next week' : `in ${weeks} weeks`
  return `Your coach would save her for the ${TIERS[ahead.tier].label} ${when}.`
}
