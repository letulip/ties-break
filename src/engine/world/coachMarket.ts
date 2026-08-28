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
import { bestFitCoachAt, buildCoachRoster, coachById, coachEdgeCorridorPp, coachEdgePlacement, coachFitFor, coachIncludesPhysio, coachSeasonUplift, coachTierById, coachWeeklyCents, COACH_TIER_LABEL, eliteGateShortfall, practiceCoachRateCents, facilityRateCents, tierOf } from '../coach'
import { OFF_SEASON_WEEKS, TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import { ECONOMY } from '../economy'
import type { LadderTrack, SeasonEvent, TierId } from '../season/types'
import { ageFactor, SKILL_KEYS, trainFactor } from '../development'
import { LADDER_LABEL, LADDER_TRACKS } from '../../shared/protocol'
import type { CoachEdgePlacement, CoachMarketRow, CoachTier, HouseholdWeekly, KitOfferTerms, PlayerProfile } from '../../shared/protocol'
import { kidPrizeShareCents, parentIncomeForWeekCents } from '../economy'
import { activeKitDeal, kitTravelShare } from '../offers'
// ⭐ ROUND-21 #2: the ONE fare definition, read rather than re-derived - see `coachTravelFareFor`,
// which lives beside it in world/sponsors.ts. sponsors.ts imports nothing from this module, so this
// runs one way exactly as `../offers` above does.
import { coachTravelFareFor, supportedTravelCents, travelCostFor } from './sponsors'
// ⭐ ROUND-28 #8 – the other two seats the household's week has to know about. Both are leaves that
// import nothing from this file (masseur: economy/condition/ledger/constants/ladder/college/bookings;
// shop: economy/calendar/ladder/endings/ledger/money), so there is no runtime cycle to make here.
import { masseurWeeklyCents } from './masseur'
// ⚠ REPOINTED AT THE LEAF AT ROUND 29 #5 – same functions, same behaviour. `world/assets.ts` holds
// the shelf's pure reads and `world/shop.ts` re-exports them, so this is a shorter path to the same
// symbols and not a change: this file only ever asked the shelf questions.
import { assetValueCents, ownedAssets, shopItem, weeklyAssetUpkeepCents } from './assets'
import { addEvent, seasonIndexOf, seasonStartWeek } from './ledger'
import { ageAtWeek, kidAgeAt, START_AGE_YEARS } from './age'
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

/** ⭐ v49 – ...AND TO THE RUNGS THAT PAY HER NOTHING TOO. The nested half of the stance above, and a
 *  separate decision because it is a separate, more expensive one.
 *
 *  ⚠ IT IS THE PLAYER'S CALL AND THE ENGINE REFUSES NOTHING (owner, 15.08): «делаем тогда», and the
 *  model - «По мне игрок сам решает: есть деньги - едет тренер, нет - не едет, или едет, но быстрее
 *  банкротится.» The bench says what that costs (8/30 wealthy·elite and 15/30 middle·middle careers
 *  bankrupt, every one in the junior years - docs/specs/coach-travel-2026-08.md), so screen T warns
 *  before the first fare is charged and then does as it is told. A gate on the OUTCOME would be this
 *  engine overruling him on his own money.
 *
 *  ⚠ IT DOES NOT IMPLY THE FIRST SWITCH and does not turn it on. The fare reads both stances (the one
 *  gate, `coachTravelFareFor`), so this alone sends nobody anywhere - which is why the row on screen T
 *  is nested under the other one rather than standing beside it. Setting it with the first switch off
 *  is a stance recorded for the day it is turned on, exactly as the v24 stance is for a self-coached
 *  family. Pure state, zero draws on any stream. */
export function setCoachOnJuniorEvents(world: WorldState, on: boolean): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command, because the worker is not the gate.
  guardNotEnded(world)
  if ((world.coachOnJuniorEvents ?? false) === on) return
  world.coachOnJuniorEvents = on
  addEvent(world, {
    week: world.week,
    type: 'info',
    // ⚠ NO PRONOUN FOR THE COACH (R15-7) – the roster puts a woman on every list by construction.
    text: on
      ? 'Your coach travels to junior and domestic tournaments too – a second fare on trips that pay no prize money.'
      : 'Your coach stays home for junior and domestic tournaments – the second fare is for the events that pay.',
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
  /** ⭐ v49: does he go to the rungs that pay her nothing too - the nested half of the stance. */
  onJuniorEvents: boolean
  /** ⭐ ROUND-21 #2: WHAT SENDING HIM WOULD ADD over the trips she has actually booked this season,
   *  in cents. Zero when nothing is booked, and zero for a self-coached family - see
   *  `coachTravelFareFor`, which is the one definition this sums and the reason the row on screen T
   *  and the line on the till can never quote different money. Quoted whether the switch is ON or
   *  OFF, because it is the price of the decision rather than a receipt for one.
   *
   *  ⚠ GROSS SINCE 15.08, AND THAT IS THE FIX THIS FIGURE OWED THE SCREEN. It summed `travelCostFor` -
   *  HER fare, net of the academy scholarship and the brand's share - while the till charged his seat
   *  at the full price (`coachTravelFareFor`, and the owner's principle behind it). So the one family
   *  the number mattered most to was quoted less than it would pay. It reads the fare function itself
   *  now, which is the only way the two can never disagree again.
   *
   *  ⚠ 17.08 – AND "GROSS" IS NOW "WHATEVER THE FARE FUNCTION SAYS", WHICH IS WHY THIS FIGURE NEEDED
   *  NO CHANGE. A sponsor's travel share reduces his seat at the rungs that pay prize money, so the
   *  word above is no longer literally true - but the SUM was rewritten to read `coachTravelFareFor`
   *  rather than to re-derive a price, and that is exactly the property that made an amendment to the
   *  rule cost nothing here. The academy scholarship still never reaches it. */
  travelFareCents: number
  /** ...and how many trips that is, so the screen can say "over the 9 he would be on" rather than
   *  printing a season total with nothing to divide it by.
   *
   *  ⚠ TRIPS HE WOULD BE ON, NOT TRIPS SHE HAS BOOKED, since the fare gate. They are different
   *  numbers the moment a junior rung is on her card and he is not going to it, and a count that
   *  includes the trips the figure does NOT cover is the same lie in a different unit. */
  travelTrips: number
  /** ⭐ 15.08 – WHAT **HER** SEATS COST OVER THOSE SAME TRIPS, net of every cover she holds.
   *
   *  It exists because "twice the fare" stopped being true for the families it mattered to. His seat
   *  did not follow her covers, so for a girl on a scholarship the trip is her discounted seat plus
   *  his whole one - and the screen has to be able to print both figures rather than a multiple that
   *  is right only for a family paying full price.
   *
   *  ⚠ 17.08 – AND "TWICE THE FARE" IS TRUE AGAIN FOR ONE FAMILY IN PARTICULAR: the one whose only
   *  cover is a sponsor contract. That share now comes off both seats, so the two figures are EQUAL
   *  for her and the trip really does cost double - which is the owner's own model of the rule and
   *  the headline assertion of §4 in tests/support-never-pays-the-coach.test.ts. The scholarship is
   *  what still splits them, and it is the only thing that does. */
  travelHerFareCents: number
  /** ⭐ v49 – WHAT THE NESTED OPTION WOULD ADD on top, over the same booked season, and over how many
   *  more trips. The two sets are disjoint by construction (a rung either pays prize money or does
   *  not), so this is the price of the second decision on its own, priced the same way: through
   *  `coachTravelFareFor`, with the stance not consulted. */
  travelJuniorCents: number
  travelJuniorTrips: number
  /** ⭐ 15.08 – IS ANY SUPPORT REDUCING HER TRAVEL AT ALL this week (a scholarship, a brand's share,
   *  or anything added to `travelCostFor` after today)? Asked of the ONE fare definition rather than
   *  of a list of covers, so a cover invented tomorrow is inside the answer by construction - and
   *  answerable with nothing booked, which is when a junior family most needs the sentence. */
  travelCovered: boolean
  /** ⭐⭐ ROUND-21 #2, 17.08 – AND IS A CONTRACT REDUCING **HIS** SEAT, as a whole percentage, 0 when
   *  nothing is. The one number that makes the sentence beside the switch true again: it has said
   *  since 15.08 that "the coach travels at the full fare", and for a family under a big deal at the
   *  professional rungs that is no longer so.
   *
   *  ⚠ A PERCENTAGE AND NOT A BOOLEAN, because the sentence has to name the figure - a cover the
   *  player cannot size is indistinguishable from a price that quietly moved, which is the exact
   *  dishonesty `chargeTravel`'s payer text exists to prevent.
   *
   *  ⚠ AND IT IS THE TERM ITSELF, NOT `1 - travelFareCents / gross`. Those trips are the ones he is
   *  ON, and every one of them is a prize-money rung, so the ratio would agree today - but it would
   *  start lying the day a rung is exempted, and a figure that is right by coincidence is the kind
   *  that survives review. */
  coachFareCoverPct: number
  /** ⭐ ROUND-21 #12: THE CAP THE BUDGET METER DRAWS AGAINST, carried rather than reverse-engineered.
   *
   *  The screen used to RECOVER it from any row that was over budget
   *  (`weeklyCents - overBudgetCents === the cap`), which worked only while some row was over. Fixing
   *  the income made the owner's own case - a million banked - the case where NO row is over, and the
   *  meter would then have printed a $0.00 weekly cap with a full bar beside it. A number the screen
   *  needs is a number the engine should hand over. */
  weeklyIncomeCents: number
  /** ⭐⭐ ROUND-28 #8 – the whole household's week, the masseur and the shelf included. Computed from
   *  `weeklyCents` below rather than from a second read of the coach, so the block on screen T and
   *  the meter inside it cannot describe two different bills. See `householdWeekly`. */
  household: HouseholdWeekly
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
  // ⭐ ROUND-21 #2 / 15.08 / v49 – THE SECOND SEAT, over the trips on her card, ASKED OF THE FARE
  // FUNCTION ITSELF.
  //
  // ⚠ IT USED TO SUM `travelCostFor` AND THAT WAS THE DEFECT. Her fare is net of the academy
  // scholarship and the brand's travel share; HIS is gross (the owner's principle, 15.08: «механизм
  // точечной поддержки нуждающихся... не должен поддерживать их чрезмерные траты»), so the screen was
  // under-quoting exactly the families the support exists for - and it did not apply the rung gate at
  // all, so a fourteen-year-old's junior season was priced as if he were coming to every trip of it.
  // Two wrong numbers on the one line the decision is made from.
  //
  // ⚠ SO THE FARE FUNCTION IS ASKED ON PROBE WORLDS, AND NO GATE IS COPIED HERE. `coachTravelFareFor`
  // is the ONE place that decides both "does he come to this rung" and "what does the seat cost"; a
  // second copy of either test in this file is exactly how the row and the till come to disagree. The
  // probes flip stances and nothing else.
  //
  // ⚠ AND THE TWO FIGURES ANSWER TWO DIFFERENT QUESTIONS, deliberately. `travelFareCents` is WHAT
  // SENDING HIM COSTS under the junior stance the family actually holds - so a fourteen-year-old who
  // has opened junior travel sees her real season and not a professional one she has not reached.
  // `travelJuniorCents` is WHAT THE NESTED OPTION WOULD ADD, priced with the stance forced both ways,
  // because a price the row quotes for its own switch must not change the moment the switch is
  // flipped. Only the first switch is assumed on in both: it is the price of a decision, not a
  // receipt for one.
  const asIfTravelling: WorldState = { ...world, coachOnEventWeeks: true }
  const asIfJuniorToo: WorldState = { ...world, coachOnEventWeeks: true, coachOnJuniorEvents: true }
  const asIfWSeriesOnly: WorldState = { ...world, coachOnEventWeeks: true, coachOnJuniorEvents: false }
  let travelFareCents = 0
  let travelTrips = 0
  let travelHerFareCents = 0
  let travelJuniorCents = 0
  let travelJuniorTrips = 0
  for (const e of booked) {
    const his = coachTravelFareFor(asIfTravelling, e)
    if (his > 0) {
      travelFareCents += his
      travelTrips++
      // HER seat on the same trip, net of every cover - the second half of the sentence on screen.
      travelHerFareCents += travelCostFor(world, e)
    }
    // The trips only the nested option buys. Disjoint from the W-series ones by construction (a rung
    // either pays prize money or it does not), so this is a difference and never a double count.
    const extra = coachTravelFareFor(asIfJuniorToo, e) - coachTravelFareFor(asIfWSeriesOnly, e)
    if (extra > 0) {
      travelJuniorCents += extra
      travelJuniorTrips++
    }
  }
  return {
    onEventWeeks: world.coachOnEventWeeks,
    onJuniorEvents: world.coachOnJuniorEvents ?? false,
    weeklyCents,
    eventWeeks,
    billedWeeks,
    seasonCents: weeklyCents * billedWeeks,
    travelFareCents,
    travelTrips,
    travelHerFareCents,
    travelJuniorCents,
    travelJuniorTrips,
    travelCovered: travelCoverReachesHer(world),
    // ⭐⭐ ROUND-21 #2 (17.08) – the brand's own hand on the SECOND seat, read straight off the deal.
    // The SAME share her fare reads: one sponsor number applied to two seats, not two terms. Zero for
    // every family holding no deal that pays towards travel, which is most of them.
    coachFareCoverPct: Math.round(kitTravelShare(world.offers, world.week) * 100),
    weeklyIncomeCents: familyWeeklyIncomeCents(world),
    // ⭐⭐ ROUND-28 #8 – and the same week, for the whole household. `weeklyCents` is handed over
    // rather than re-derived: one bill, quoted once, read by both figures in the block.
    household: householdWeekly(world, weeklyCents),
  }
}

/** ⭐ 15.08 – IS ANY SUPPORT TAKING ANYTHING OFF HER TRAVEL RIGHT NOW?
 *
 *  ⚠ ASKED OF `travelCostFor` AND NOT OF A LIST OF COVERS, which is the whole reason it is a function
 *  rather than `world.academy !== null`. That function is THE definition every cover has to arrive
 *  through - the charge, the refund and the planner's quote all read it, and `kitTravelShare`'s own
 *  note says a fare may only ever be reduced there - so a support stream added tomorrow is inside
 *  this answer without anybody remembering to come back here. A named-cover version of this line
 *  would be stale the day the third one ships.
 *
 *  ⚠ AND IT IS A PROBE RATHER THAN A REAL EVENT, because the screen needs the sentence when nothing
 *  is booked at all - a junior family with a scholarship is exactly who has no W-series trip on her
 *  card yet and most needs to be told whose seat the scholarship pays for. The amount is large enough
 *  that no percentage cover rounds away to nothing. Pure; zero draws. */
function travelCoverReachesHer(world: WorldState): boolean {
  // `supportedTravelCents` reads the world and `event.travelCostCents`, and nothing else on the
  // event, so the cast names what this object is FOR rather than pretending it is a real trip.
  const probe = { travelCostCents: 10_000_00 } as SeasonEvent
  // ⚠⚠ RE-AIMED AT ROUND 29 #5, AND THE CLAIM IS UNCHANGED – it asked `travelCostFor` and it now
  // asks the SUPPORT half of it. The question on screen is «is any support taking anything off her
  // travel», and §3f gave the family a way to cut its own fare that is emphatically not support: it
  // bought an aeroplane. Left pointed at `travelCostFor`, a family with a plane and no scholarship
  // would have been told a brand or an academy was paying for her seat, which is a sentence nothing
  // in the world would support. The note above still holds in full for every SUPPORT stream added
  // later – they all arrive through `supportedTravelCents`.
  return supportedTravelCents(world, probe) < probe.travelCostCents
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
 *  refusing them. So that was a defect in the DENOMINATOR, not a wording problem.
 *
 *  ⚠⚠ AND THE «%» HE NAMED NO LONGER EXISTS – ROUND 29 #12, HIS OWN LATER RULING. «Убрать авто
 *  начисление % на текущий счёт»: `ECONOMY.savings` is deleted and `world/phaseFinance.ts` no longer
 *  credits the balance, so the interest term is gone from the sum below too. THE PARAGRAPH ABOVE IS
 *  KEPT AS THE RECORD OF WHY THIS FUNCTION EXISTS AT ALL – the rule it established, «what counts is
 *  what ARRIVES every week», is unchanged and is what forces the term out now that nothing arrives.
 *  ⚠ The consequence he will see is written out at the deleted term itself, below: a wealthy family
 *  reads Elite rungs as «over» again, flagged and never refused, and the answer is the shelf.
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
 *  ⚠⚠ AND THE RETAINER IS QUOTED NET OF HER CUT SINCE ROUND-28 #15. The owner ruled her prize ramp
 *  onto sponsor cheques («с чеков спонсоров… как и с призовых»), and `payRetainer` now banks
 *  `retainer - herShare` into `world.fundsCents`. A cap that went on quoting the GROSS would be the
 *  round-21 #12 defect in mirror image – the same "the meter and the till disagree" failure, this
 *  time over-reading instead of under-reading – so this is a correctness consequence of his ruling
 *  and not a second balance decision. ⚠ WHAT IT MOVES, in closed form rather than by a bench,
 *  because it is linear: the cap falls by `bps/10000 x retainerCents x 4 / 52` for a family holding
 *  a kit deal, and by NOTHING AT ALL for a family holding none (most of them, and every family below
 *  the tour rung). At the icon rung's $37,500 a quarter that is $288/wk at her first 10% and
 *  $1,442/wk at the 50% cap; at the tour rung's $1,500 it is $11.50 and $57.70. ⚠ AND NOBODY IS
 *  LOCKED OUT BY IT: `hireCoach` does not consult the budget at all – `overBudgetCents` colours a
 *  card and nothing else – so a narrower cap warns, it never refuses. That is what keeps this inside
 *  «мы ни за что не наказываем».
 *
 *  Pure: zero draws on any stream, derived at snapshot time like everything else on this screen. */
export function familyWeeklyIncomeCents(world: WorldState): number {
  const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  // ⚠⚠ THE SAVINGS INTEREST TERM STOOD HERE AND ROUND 29 #12 TOOK IT OUT WITH THE ACCRUAL, because
  // this figure must be «the money that really arrives» and it no longer arrives. Leaving it would
  // be the round-21 #12 defect in mirror image – the meter and the till disagreeing, this time
  // over-reading – which is the same correctness argument round 28 #15 made one paragraph up.
  //
  // ⚠⚠ AND IT PARTLY UNDOES ROUND 21 #12, WHICH IS HIS OWN EARLIER RULING – SAY SO RATHER THAN LET
  // HIM REDISCOVER IT. His report then: «у нас есть ещё %, надо их тоже учитывать и суммировать, а
  // то на счету 1млн, а элитного тренера какого-то нельзя брать.» On that same million the interest
  // was $600/wk against the parents' $482 – MORE THAN HALF the family's weekly money – so a wealthy
  // family will again see Elite rungs flagged «over». ⚠ FLAGGED, NEVER REFUSED: `hireCoach` does not
  // consult the budget at all (`overBudgetCents` colours a card and nothing else), which is what
  // keeps this inside «мы ни за что не наказываем». The honest answer to the re-opened complaint is
  // the shelf, not a restored wage on the current account: a family that puts the million into the
  // index fund is earning again, deliberately, and `householdWeekly` already shows that money in the
  // household's week.
  const deal = activeKitDeal(world.offers, world.week)
  const retainerCents = deal ? ((deal.terms as KitOfferTerms).retainerCents ?? 0) : 0
  // ⚠ HER CUT COMES OFF THE CHEQUE BEFORE IT IS PRO-RATED, and in that order, because that is the
  // order the till pays in: `payRetainer` splits the quarter's cheque once and the family's part is
  // what has to last thirteen weeks. Pro-rating first and splitting the weekly figure would round in
  // a different place and quote a cap the ledger never delivers.
  const familyRetainerCents = retainerCents - kidPrizeShareCents(retainerCents, kidAgeAt(world, world.week))
  return parents + Math.round((familyRetainerCents * RETAINERS_A_YEAR) / WEEKS_PER_YEAR)
}

/** How many times a signed kit deal pays its retainer in a year - `isRetainerWeek` is
 *  `week % (WEEKS_PER_YEAR / 4) === 0`, so it is four, and the two must not drift apart. */
const RETAINERS_A_YEAR = 4

/** ⭐⭐ ROUND-28 #8 – THE WHOLE HOUSEHOLD'S WEEK, and the shape of it is in `HouseholdWeekly`.
 *
 *  THE OWNER, 28.08: «можно совокупную всю цифру показывать с учётом массажиста (и психолога в
 *  будущем), и даже на магазин растянуть». The block on screen T showed the COACH's line and called
 *  it the week's spending; his masseur was $525 a week of it and was nowhere in the figure.
 *
 *  ⚠ THE INCOME SIDE IS `familyWeeklyIncomeCents` AND NOT A SECOND SUM OF THE SAME STREAMS. That
 *  function is the one definition of "what arrives every week", the cap the meter draws and the
 *  denominator every `overBudgetCents` is cut from; a household total that re-derived the parents'
 *  contribution would be exactly the two-sides-asking-different-functions defect this file's own
 *  round-21 #12 note was written about.
 *
 *  ⚠ AND THE TRAINING LINE IS THE ONE `coachBilling` QUOTES, for the same reason – `weeklyCents` is
 *  passed IN rather than recomputed here, so the household total and the meter above it can never
 *  describe two different coaches. It is court time alone for a self-coached family, which is the
 *  honest answer: the family still rents the court. (The old meter read the CURRENT ROW's price and
 *  therefore showed a self-coached family $0.00 committed while it paid the facility rate every
 *  week – a second thing this figure quietly gets right.)
 *
 *  ⚠ THE MASSEUR IS GATED ON THE HIRE (`masseurHired`) AND NOT ON `masseurWorksThisWeek`, and that
 *  is deliberate symmetry with the coach: `coachBilling.weeklyCents` is a standing QUOTE that does
 *  not consult `coachWorksThisWeek` either, so a college freeze or a booked holiday stands both
 *  seats down on the ledger without either of them vanishing from the family's standing budget. A
 *  PSYCHOLOGIST joins as one more line in this list and nothing else moves.
 *
 *  ⚠ THE SHELF IS ONE MORE WEEK OF HOLDING, ASKED OF `assetValueCents` ITSELF. Slice 1's whole design
 *  is that there is exactly one arithmetic for what a thing is worth (`revalueAssets` is its only
 *  writer); a weekly rate derived from `annualRateBps` here would be a second one, and it would drift
 *  the day slice 2 adds drift. Difference of the same function at `held` and `held + 1` – so when the
 *  curve changes, this changes with it, for free.
 *
 *  Pure: zero draws on any stream, derived at snapshot time like everything else on this screen. */
export function householdWeekly(world: WorldState, trainingCents: number): HouseholdWeekly {
  const staffCents = (world.masseurHired ?? false) ? masseurWeeklyCents(world) : 0
  // WHAT ONE MORE WEEK OF HOLDING DOES TO THE SHELF, signed, summed over what the family owns.
  let shelfCents = 0
  for (const owned of ownedAssets(world)) {
    const item = shopItem(owned.id)
    if (!item) continue // a rung retired from the catalogue keeps its value; see `revalueAssets`
    // ⚠⚠ THE SAME BASIS AND THE SAME CLOCK `revalueAssets` USES, and round 29 #11 is why this line
    // says it twice. A top-up REBASES the holding (`OwnedAsset.basisCents` / `basisWeek`), and this
    // meter reading `paidCents` / `boughtWeek` after one would be the exact defect the note above
    // forbids – two functions asking one question and getting different answers. The `??` pair is
    // the same one `revalueAssets` carries, and on a holding never topped up it is the identical
    // arithmetic this line has always done.
    const basis = owned.basisCents ?? owned.paidCents
    const held = world.week - (owned.basisWeek ?? owned.boughtWeek)
    shelfCents += assetValueCents(item, basis, held + 1) - assetValueCents(item, basis, held)
  }
  // ⭐⭐ ROUND 29 #5 – ...AND WHAT IT COSTS TO KEEP, WHICH IS CASH AND NOT A VALUATION. §3f's weekly
  // upkeep really leaves the wallet every week (`resolveAssetUpkeep` charges it), so unlike
  // `shelfCents` it belongs in the OUT figure without qualification. ⚠ ASKED OF THE SAME FUNCTION
  // THE TILL ASKS – `weeklyAssetUpkeepCents` – for the reason this whole file keeps repeating: the
  // meter and the bill must not be two arithmetics. A yacht is $23,076 a week, which is roughly
  // thirty-eight coaches, and a household block that did not know about it would be round 28 #8's
  // own defect (the masseur's $525) again and larger.
  const upkeepCents = weeklyAssetUpkeepCents(world)
  const incomeCents = familyWeeklyIncomeCents(world) + Math.max(0, shelfCents)
  const outgoingCents = trainingCents + staffCents + Math.max(0, -shelfCents) + upkeepCents
  return { incomeCents, outgoingCents, netCents: incomeCents - outgoingCents, shelfCents, upkeepCents }
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
  // ⭐ ROUND-21 #12: every stream that arrives every week, not the parents' line alone. See
  // `familyWeeklyIncomeCents` for the measurement that made this a bug rather than a wording fix.
  const weeklyIncome = familyWeeklyIncomeCents(world)
  // ⚠ THE QUOTE IS OVER THE WEEKS SHE WILL ACTUALLY HAVE HIM (08.08). Same arithmetic the season
  // price uses, from the same helper, so the card and the bill can never describe different years.
  const coachedWeeks = ECONOMY.coach.upliftHorizonWeeks - coachedWeeksLostToRest(world)
  // ⭐ ROUND-21 #2, THE LAST OPEN ITEM – DOES THIS FAMILY SEND HIM? Asked ONCE, of the one predicate
  // every presence surface reads, and never per row: it is a fact about the FAMILY's stance and not
  // about the man on the card, so a row-by-row answer would be the same question asked sixteen times
  // with sixteen chances to disagree. See `edgeTravelPct` below for what it gates.
  const travels = coachTravelsWithHer(world)
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
      edgePct: coachEdgeCorridorPp(coach.tier),
      // ⭐ ...AND TWICE THAT ON THE TRIPS HE IS ON (round-21 #2, the last open item). Until this the
      // card quoted the HOME corridor to a family paying a second fare to every W event: the doubling
      // shipped in the engine, was measured at 500 paired careers, and said nothing on the one screen
      // that sells the decision.
      //
      // ⚠ NULL RATHER THAN THE HOME BAND REPEATED, so a family that leaves him at home reads exactly
      // what it read before and the screen has one thing to test rather than two identical figures to
      // tell apart. The gate is the STANCE (`coachTravelsWithHer`: somebody to send, and the switch
      // on), which is the same pair the fare itself is charged on.
      //
      // ⚠ AND IT IS STILL THE RUNG AND NEVER THE MAN – §4's anti-shopping rule, which twice a bracket
      // does not touch: `coachEdgeCorridorPp` reads the tier table and no coach id, so this column
      // cannot leak an individual draw any more than `edgePct` above can.
      //
      // ⚠ WHAT IT DOES NOT PROMISE IS A FLAT DOUBLING, and the copy carries that rather than this
      // field. `coachTravelFareFor` sends him only to rungs that pay prize money unless the family has
      // opened the junior stance too, so a J-series week doubles nothing even here - which is why the
      // card says «travelling with her» and not «doubled».
      edgeTravelPct: travels ? coachEdgeCorridorPp(coach.tier, true) : null,
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
/** ⭐⭐ REWRITTEN 20.08, ALL OF THEM – the owner could not read the old ones and said so:
 *  «я значит не так понял эту фразу про "that band" и вообще что это такое, думаю, что и у игроков
 *  такой вопрос может возникнуть… фразу про "that band" точно надо переписать в более понятной
 *  манере, и, вероятно, все 3 фразы даже, а не только эту одну».
 *
 *  ⚠ THE REFERENT WAS THE WHOLE PROBLEM. "That band" pointed at the uplift corridor printed two lines
 *  above on the card (`+1.2-3.4% a season`), and a sentence whose subject lives in another element is
 *  a sentence that only works if the reader's eye has been where the author's was. He read it, wrote
 *  the game, and still did not know what it meant – so no player will.
 *
 *  ⭐ THE FIX IS TO NAME THE COMPARISON INSTEAD OF POINTING AT IT. What the placement actually means
 *  is "against other coaches costing what he costs", and now it says that. No referent, no figure,
 *  and the sentence stands alone wherever it is printed.
 *
 *  ⚠⚠ AND NO PRONOUN, WHICH IS WHY IT SAYS "THIS PRICE" AND NOT "HIS". R15-7: a slot's gender is
 *  fixed, so "his" is right today and wrong the moment a portrait is swapped - the plaque has never
 *  carried one and `coach-edge.test.ts` enforces it across all eleven states. The first draft of this
 *  rewrite said "his price" in every line and the guard caught all of them at once.
 *
 *  ⚠⚠ IT TOOK FOUR GOES, AND THE OWNER WROTE THE FOURTH. The record is short and it is the useful
 *  part of this comment:
 *    «the upper end of that band»    - the referent was an element two lines up on the card. He wrote
 *                                      this game and could not read it, so no player would.
 *    «more than most at this price»  - visible referent, WRONG SUBJECT. Centring the fee made a line
 *                                      about her progress read as a coach complaining about wages:
 *                                      «звучит как "мне недостаточно платят"».
 *    «more than most coaches would»  - still a statistic wearing a person's coat.
 *    what is here now                - HIS OWN DRAFT, edited to fit. A coach does not compare
 *                                      himself to a population; he says what he hoped for and what
 *                                      he is seeing. «Давай как-то попробуем абстрагироваться от
 *                                      бендов и цены и более доступным языком донести эти мысли.»
 *
 *  ⚠ THE REGISTER IS STILL SYMMETRIC, which is what the no-praise rule was protecting: "more than"
 *  and "less than I had hoped for" are the same sentence with one word moved, so a low draw is
 *  reported exactly as calmly as a high one.
 *
 *  ⚠ "HER PROGRESS" IS THE SHARED REFERENT. §7's pairing needs the revealed sentence and the not-yet
 *  arm to point at one thing, and now both are about the girl rather than about the man or his fee.
 *
 *  ⚠ NO PRAISE EITHER - `good`, `better`, `value`, `bargain` and their family are banned outright, so
 *  a low draw is reported in the same register as a high one. Measured: every composed sentence is
 *  50-59 characters, inside the 49-58 band the old nine occupied and under §4a's 60-character
 *  two-line ceiling at 320px. */
const PLACEMENT_PHRASE: Record<CoachEdgePlacement, string> = {
  upper: 'more than I had hoped for',
  middle: 'about the pace I expected',
  lower: 'less than I had hoped for',
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
      ? 'Her progress – I will know in the off-season.'
      : 'Her progress – too soon, ask next off-season.'
  }
  const place = PLACEMENT_PHRASE[view.placement]
  // ONE SEASON IS ONE LOOK. The hedge is doing honest work here: a season is a small sample and the
  // sentence says so in the register a parent would use, not in a confidence interval.
  if (view.seasonsTogether <= 1) return `A season in – it looks like ${place}.`
  // TWO SEASONS: THE FIRST READ SURVIVED A SECOND YEAR. "It holds" is the whole of the middle band -
  // the same placement, arrived at twice.
  if (view.seasonsTogether === 2) return `Two seasons in and it holds – ${place}.`
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
  /** ⭐ ROUND-21 #2, THE LAST OPEN ITEM – ...AND THE SAME BAND DOUBLED, for a family whose coach is on
   *  the trip with her. `null` when this family would not send him (no coach, or the stance off), so
   *  a career that leaves him at home reads exactly what it read before.
   *
   *  ⚠ IT IS A BRACKET AND NOT HIS FIGURE, exactly like `corridorPct` beside it - see
   *  `coachEdgeCorridorPp`, which is cut from the tier table and reads no coach id. §7's rule that no
   *  screen may quote his own value is untouched, and so is §4's that the market may not quote a man. */
  travelCorridorPct: [number, number] | null
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
  /** ⭐ ROUND-21 #2 – THE ONE SENTENCE THAT KEEPS THE SECOND FIGURE HONEST, or '' when there is no
   *  second figure. See `TRAVEL_EDGE_LINE` for why it names a condition instead of claiming a
   *  doubling, and why it is composed here rather than on the card. */
  travelLine: string
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
  // ⭐ ROUND-21 #2, THE LAST OPEN ITEM – the same stance the fare is charged on, asked of the same
  // predicate the flow, the commentary and the week's story ask. The corridor is a fact about the
  // rung; whether it is doubled this season is a fact about the FAMILY, and only one function in this
  // engine is allowed to answer that.
  const travels = coachTravelsWithHer(world)
  return {
    corridorPct: coachEdgeCorridorPp(tier),
    travelCorridorPct: travels ? coachEdgeCorridorPp(tier, true) : null,
    placement,
    revealed,
    weeksTogether,
    revealWeek,
    seasonsTogether,
    plaqueLine: coachPlaqueLine({ placement, week: world.week, revealWeek, seasonsTogether }),
    travelLine: travels ? TRAVEL_EDGE_LINE : '',
  }
}

/** ⭐ ROUND-21 #2, THE LAST OPEN ITEM – WHAT THE SECOND FIGURE IS FOR, in one sentence under it.
 *
 *  ⚠ «TWICE THAT ON THE TRIPS», NEVER «DOUBLED». The travel helping is gated on `coachTravelFareFor`,
 *  which sends him only to rungs that pay prize money unless the family has opened the junior stance
 *  as well - so a J-series week doubles nothing even for a family that always sends him, and a card
 *  that said "the corridor is doubled" would be quoting a season this girl may not be playing yet.
 *  What IS unconditionally true is the conditional: on the trips the coach travels to, twice that.
 *
 *  ⚠ IT QUOTES NO NUMBER AT ALL, deliberately, and it sits under a plaque that quotes none either.
 *  The figure is on the line above it (`edgeTravelPct`), which is a price bracket; this sentence's job
 *  is the CONDITION, and a second copy of the numbers here would be one more place for them to drift.
 *
 *  ⚠ AND IT DOES NOT TOUCH THE PLACEMENT, which needs no qualifier beside it: the helping scales the
 *  corridor rather than shifting it, so the upper third of 0.5-0.9 IS the upper third of 1.0-1.8 and
 *  «the upper end of that band» stays true of both bands at once (`coachEdgeCorridorPp`). The plaque
 *  is a fact about the man; this is a fact about the trip; neither has to hedge the other.
 *
 *  ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08) - `buildCoachRoster` puts a woman on every roster
 *  by construction, so "the trips he travels to" would print under Sabine Kobayashi. Short dash, and
 *  45 characters: inside the 60 a real browser measured as the two-line ceiling for this column at
 *  320px (§4a), so it costs the card the same two lines the plaque costs. */
const TRAVEL_EDGE_LINE = 'Twice that on the trips the coach travels to.'

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
 * ⭐ ROUND-23 #1 - AND THE BAND NOW HAS A NAME IN FRONT OF IT. Owner, 19.08: «Давай как-то по-другому
 * оформим подсказки про уровень девушки на карточке тренера. Может что-то вроде "она близка к своему
 * потолку" или "ещё есть куда расти" или "у неё большой потенциал" или что-то в таком духе, что даст
 * игроку понять более явно».
 *
 * ⚠ HE IS NOT ASKING FOR THE NUMBER, and the fog-of-war ruling two paragraphs up STANDS. Every one of
 * his three examples is a BAND said in plain words - "big potential", "still room to grow", "close to
 * her ceiling" - which is the quantity this function already computes and was already saying, only
 * buried inside a remark. What changes is that the band is now the first thing on the line, in its own
 * two or three words, with the argument for it after a dash. Nothing new is revealed: `realised` is
 * still bucketed to four values before a word of it is written, so the sentence carries exactly the
 * two bits it carried yesterday.
 *
 * ⚠ THE LABEL AND THE SENTENCE ARE ONE STRING, joined by `ROOM_NOTE_SEP`, because `Snapshot` carries
 * `coachRoomNote` as a plain `string` and this wave may not widen the protocol. Screen T splits on the
 * FIRST separator to set the label in bold; a note with no separator degrades to a plain sentence
 * there, so the split can never be the thing that empties the line.
 *
 * ⚠ MONOTONE IN HEADROOM AND UNABLE TO FLICKER. `level + room` is `mean(potential)` for every skill at
 * or under its ceiling, so `realised` is `mean(skills) / mean(potential)` - and `growSkills` adds
 * `rate * headroom * luck` with `weekLuck` positive at both ends, so skills only rise until
 * `declineFactor` opens at 29. The band index is therefore non-decreasing week over week on a career
 * that is merely progressing, with no hysteresis needed and nothing persisted to give it any.
 * `tests/coachTiers.test.ts` ticks a real career and asserts exactly that.
 *
 * Pure, zero draws, derived at snapshot time.
 */
export function coachRoomNote(world: WorldState): string {
  const skills = SKILL_KEYS.map((k) => world.skills[k])
  const headroom = SKILL_KEYS.map((k) => Math.max(0, world.potential[k] - world.skills[k]))
  const level = skills.reduce((a, b) => a + b, 0) / skills.length
  const room = headroom.reduce((a, b) => a + b, 0) / headroom.length
  if (level + room <= 0) return ''
  const band = ROOM_BANDS[coachRoomBandIndex(level / (level + room))]
  return `${band.label}${ROOM_NOTE_SEP}${band.note}`
}

/** What separates the named band from its argument. One definition, two readers - this module writes
 *  it and screen T splits on it - so the two can never disagree about where the label ends. Short
 *  dash, spaced, which is the app's own prose separator (CLAUDE.md style). */
export const ROOM_NOTE_SEP = ' – '

/** ⭐⭐ THE BAND ALONE – the plain-language reading of how much of her game is still ahead of her,
 *  without the argument that follows it (round 23 #1, re-aimed 20.08).
 *
 *  ⚠ IT EXISTS SO THAT TWO SCREENS DO NOT EACH SPLIT THE SAME STRING. `CoachMarketScreen` had the
 *  split inline; the coach card on Home now needs the same clause, and a second `indexOf` would be
 *  the "two sides asking different functions about one question" defect this project keeps finding.
 *  One splitter, one separator, one answer.
 *
 *  Returns '' when there is no note or no separator, which is what both callers already treat as
 *  "say nothing" – the fog stays intact and no digit can appear, because none is in the note. */
export function coachRoomBand(note: string): string {
  const at = note.indexOf(ROOM_NOTE_SEP)
  return at > 0 ? note.slice(0, at) : ''
}

/** THE FOUR BANDS, cheapest headroom last, in the owner's own vocabulary.
 *
 *  ⚠ THE ORDER IS THE LADDER. Index 0 is the most room left and index 3 the least, so a reader can
 *  compare two careers by index without re-reading the thresholds - which is what makes "monotone in
 *  headroom" a mechanical claim rather than a promise about four strings.
 *
 *  ⚠ AND NOT ONE OF THEM CONTAINS A DIGIT. That is the fog-of-war rule restated as a property a test
 *  can check on the RENDERED line, and it is why the labels are words ("Huge potential") rather than
 *  the obvious grades ("Band 1 of 4"), which would be the percentage wearing a hat. */
const ROOM_BANDS: { label: string; note: string }[] = [
  {
    label: 'Huge potential',
    note: 'most of her game is still ahead of her, and this is where a coach buys the most.',
  },
  {
    label: 'Still room to grow',
    note: 'there is real room left in her game, and a coach is what buys it.',
  },
  {
    label: 'Close to her ceiling',
    note: 'she is running out of room, and every rung is worth less than it was.',
  },
  {
    label: 'At her ceiling',
    note: 'no coach can add much more now, whatever the price.',
  },
]

/** Which band a realisation share falls in, as an INDEX rather than a string - the form the
 *  monotonicity and no-flicker checks need, and the form that keeps the thresholds in one place.
 *
 * ⚠⚠ THE BOTTOM TWO THRESHOLDS MOVED, AND THEY MOVED BECAUSE THEY WERE MEASURED (round-23 #1). The
 * 08.08 ladder was 0.6 / 0.8 / 0.92, written before anybody had looked at what `realised` actually
 * does over a career - and the first thing this item did was look. Twelve careers, budget and middle
 * rungs, ticked ten seasons, realised share by age:
 *
 *     age    min    p25    med    p75    max
 *      14   68.2   78.2   80.6   82.7   87.2
 *      16   82.8   87.8   88.9   90.0   92.8
 *      18   89.4   92.1   92.8   93.3   95.2
 *      20   92.5   94.2   94.6   95.1   96.4
 *      24   94.9   95.3   95.9   96.1   97.2
 *
 * SHE IS NEVER BELOW 68%, at any age, in any career. So the first band was DEAD COPY - a string no
 * player could ever be shown - and under those thresholds the second one lasted five to thirty-five
 * weeks of the first season before expiring (walked week by week on three seeds: every one opened on
 * band 1 and was in the top band by 17, 17 and 18). Four bands were really two, and the loud version
 * of this item would have shipped that fact in bold, which is the reason they were re-cut here rather
 * than reported and left. ⚠ NO ENGINE BEHAVIOUR MOVES WITH THEM: this function is read by one
 * sentence of copy and by nothing else - no draw, no bill, no schema, no frozen hash.
 *
 * ⚠ THE TOP THRESHOLD DID NOT MOVE, and that is the other half of the same measurement. What the band
 * is for is whether a better coach is still worth buying, so the calibration target is the SPREAD the
 * market still offers - `coachSeasonUplift`'s dearest elite quote minus its dearest budget one:
 *
 *     realised    70%    80%    84%    88%    91%    93%    95%    96%
 *     spread     2.44   1.48   0.98   0.66   0.44   0.31   0.20   0.08  pp
 *
 * 0.92 is where that falls under half a point, which is the owner's own «весь ладдер в четырёх
 * десятых» at 93.4% - the complaint this sentence was written for on 08.08. It is earned; it stays.
 * The two below it are placed on the same curve, at roughly a doubling of the spread each: under 0.82
 * the top rung is worth about three times the bottom one in absolute terms, and by 0.92 the whole
 * market is inside a rounding error. Re-walked on five seeds afterwards, EVERY ONE of them now enters
 * all four in order and never steps back: band 0 from week 0, band 1 at weeks 12-82, band 2 at weeks
 * 78-159, band 3 from ages 17-19. Four readings a player actually passes through, which is what the
 * owner asked for when he asked to be told «более явно». */
export function coachRoomBandIndex(realised: number): number {
  if (realised < 0.82) return 0
  if (realised < 0.88) return 1
  if (realised < 0.92) return 2
  return 3
}

/** The band a WORLD is in, or null when there is nothing to say (a career with no ceiling at all).
 *  Exported for the tests that walk a real career week by week; the screen never sees a world. */
export function coachRoomBandOf(world: WorldState): number | null {
  const skills = SKILL_KEYS.map((k) => world.skills[k])
  const headroom = SKILL_KEYS.map((k) => Math.max(0, world.potential[k] - world.skills[k]))
  const level = skills.reduce((a, b) => a + b, 0) / skills.length
  const room = headroom.reduce((a, b) => a + b, 0) / headroom.length
  if (level + room <= 0) return null
  return coachRoomBandIndex(level / (level + room))
}

/** The label of one band, for a test that wants the words without re-deriving them from a sentence. */
export function coachRoomBandLabel(index: number): string {
  return ROOM_BANDS[index].label
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

// =================================================================================================
// ⭐ ROUND-23 #5 – WHO THIS ONE IS, and the point of it is that he is not the other three
// =================================================================================================
//
// Owner, 19.08: «Разный текст для каждой из карточек тренеров с микро описанием каждого из них в
// своём тире». The card already said three things about a coach and every one of them was a fact
// about his RUNG or about a table: the fit pill is `styleAffinity`, the uplift band is
// `coachSeasonUplift` on his tier, the per-match corridor is `coachEdgeCorridorPp` on his tier, and
// `coachLoadNote` above is literally a `switch (tier)`. Four coaches on a rung therefore printed four
// identical arguments under four drawn names - one man with four faces - and the choice between them
// read as arbitrary because nothing on the card was about the PERSON.
//
// ⚠ KEYED ON THE ID, WHICH IS THE PORTRAIT STEM, so this is the one column of the card that belongs
// to the individual and not to his bracket. `buildCoachRoster` draws a coach's NAME and his RATE off
// `seed:coaches` and takes everything else - portrait, tier, style, gender - from
// `ECONOMY.coach.roster`, so the man in the picture is the same man in every career and his
// description can be too. Nothing is rolled here, at render time or at snapshot time: two careers on
// two seeds meet `high-2` under two names with one description, exactly as they meet her under one
// face. A drawn line would have made the same card say different things on two consecutive snapshots.
//
// ⚠ DISTINCT WITHIN THE TIER IS THE WHOLE ASK, and it is checked mechanically rather than admired -
// `tests/coachTiers.test.ts` groups the real roster by rung and refuses a duplicate. They happen to
// be distinct GLOBALLY too, which is a stronger property and free, but the tier is what the owner
// asked about and the tier is what the test asserts.
//
// ⚠ NO PRONOUN NAMES THE COACH ON ANY OF THEM. This is R15-7 (owner, 09.08) applied one level
// further in: `ECONOMY.coach.roster` fixes a gender per slot, so a pronoun here would be CORRECT
// today and silently wrong the day somebody swaps a portrait's gender - the failure R15-7 already
// paid for once, when four tier sentences called Sabine Kobayashi "he". Writing them with no personal
// pronoun at all costs nothing at this length and cannot rot; the test pins it.
//
// ⚠ AND NOT ONE OF THEM QUOTES A NUMBER. Spec §4's anti-shopping rule says a coach's own value may
// never appear on an unhired card - that is what `edgePct` quotes a RUNG for, and what the plaque
// waits a season to say. A CV line reading "two into the top 200" would be that number wearing a
// story, so the descriptions carry character and no arithmetic.
//
// Length: 60 characters or under, each. That is the ceiling a real browser measured for this column
// at 320px (§4a, and see TRAVEL_EDGE_LINE above), so every one of these costs the card at most the
// two lines `.cm-load` already costs it and no row grows a third.

/** The micro-description for one coach, by id. Empty for an id no roster knows - the same shape
 *  `coachById` takes, so a save holding a retired portrait degrades to a card with one less line
 *  rather than to `undefined` printed on screen. */
export function coachBlurb(id: string): string {
  return COACH_BLURB[id] ?? ''
}

/** ⚠ ONE ENTRY PER `ECONOMY.coach.roster` SLOT, and the test asserts the two lists match - a portrait
 *  added to the roster without a line here is a coach who says nothing about himself, which is the
 *  defect this item exists to close. Ordered as the roster is: budget, middle, high, elite. */
const COACH_BLURB: Record<string, string> = {
  // BUDGET – the club end of the market. Nobody here has been anywhere; what separates them is what
  // they believe, and each of the four believes something the other three do not.
  'budget-1': 'A club-court lifer – patience first, power much later.',
  'budget-2': 'Teaches the basics, and drills them until they hold.',
  'budget-3': 'An ex-satellite hitter who still swings for the lines.',
  // ⚠ `middle-4` IS A BUDGET SLOT. The stem names the master art file and not the rung (see the
  // roster's own note in economy.ts), so the description follows the SLOT, not the filename.
  'middle-4': 'Cheap, blunt, and obsessed with a repeatable toss.',

  // MIDDLE – the first rung where somebody is running a programme rather than an hour.
  'middle-1': 'Builds a whole game slowly, one shot at a time.',
  'middle-2': 'Keeps a notebook on every opponent in the region.',
  'middle-3': 'Serve and forehand first – the rest can wait.',
  'middle-5': 'Drills the first strike until it lands more often.',

  // HIGH – people who have been on the road with somebody else's daughter already.
  'high-1': 'Has taken pupils onto the tour – thinks in seasons.',
  'high-2': 'Believes the extra ball back wins more than the winner.',
  'high-3': 'Short points, high risk – coaches the way the tour plays.',
  'high-4': 'Rebuilt a serve from scratch once, and teaches it that way.',

  // ELITE – a CV, and the price of one.
  'elit-1': 'A tour-bench veteran with a plan for every draw.',
  'elit-2': 'A Grand Slam quarter-final on the CV, and no time to waste.',
  'elit-3': 'Built two tour serves, and prices the third accordingly.',
  'elit-4': 'A chess player – will make a pupil think a set ahead.',
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
