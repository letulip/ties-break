// ⭐⭐ ROUND 29 #3 – THE SHOOT THAT LANDS ON A TOURNAMENT WEEK, AND THE FOUR ANSWERS TO IT.
//
// Round 28 shipped the shoot week and deliberately exempted a tournament week: the shoot is «not
// blocked and not double-charged», so a campaign week that happened to be a playing week simply
// happened, at no extra cost and with nothing said. The owner looked at that exemption and rejected
// it – «но она же осталась на турнирной неделе, значит надо понять как с ней быть. И варианты
// пользователю предложить.» His words are in docs/rounds/round-29.md, where they may be quoted in
// his own language.
//
// ⭐⭐ AND HE NAMED THE ANSWERS HIMSELF, WHICH IS WHY THIS IS A QUESTION AND NOT A RULE. He was
// offered a fork between moving the shoot and paying for it, and ruled that the CHOICE BELONGS TO
// THE PLAYER: cancel the tournament; cancel or move the shoot; or do both and pay for it in
// condition. So the week ASKS, and this module is the question.
//
// -------------------------------------------------------------------------------------------------
// WHY IT IS A BLOCKING QUESTION, AND WHY IT IS ASKED THE WEEK BEFORE
// -------------------------------------------------------------------------------------------------
//
// THE SHAPE IS THE FORK'S AND THE KNOCK'S, not a new one: a predicate the tick refuses to move past
// (`advanceRefusal`), a prompt derived onto the snapshot, a dialog in `blockingOverlay`'s ordered
// list, and one command that answers it. Nothing here invents a stopping model – R2-13's own rule.
//
// ⚠⚠ AND THE WEEK IT IS ASKED ON IS FORCED BY THE ANSWERS, not chosen for taste. Two of the four
// arms are only POSSIBLE before the week starts:
//   * `cancelEntry` refuses outright once `event.week <= world.week` («That week has already started
//     – skip the tournament instead»), and `skipEvent` – the on-the-week exit – needs a
//     `pendingTournament` that does not exist until the tick has run;
//   * a shoot cannot be MOVED out of a week that is already being lived.
// So the question is raised about `world.week + 1`, which is also the week every week-control in the
// app is already about (`useWeekAhead`, `calendarWeekFor` and the CTA all draw `week + 1`).
//
// ⚠ NOTHING IS INVENTED AS A PENALTY. Cancelling the tournament is `cancelEntry` exactly as the
// player could have called it from the calendar – the fee is forfeited past the deadline and
// `mandatoryBinds`/`chargeMandatoryPenalty` apply if the event binds her – and no new consequence is
// written for it. Cancelling the SHOOT is the one place the owner asked for a consequence («явно
// должны быть последствия какие-то») and it is read off the CONTRACT rather than tuned: the cheque
// bought `shootCount` shoots, so one cancelled shoot hands back its own share of it.
//
// ⚠ RNG: ZERO DRAWS on any stream, in every arm. `chooseShootWeeks` rolls at the SIGNATURE; a move
// here is the first eligible week by the paper's own rules, deterministically, because a draw taken
// at the moment of a player's answer would be a decision re-rolling the world's dice.
import { ECONOMY } from '../economy'
import { activeAdDeal } from '../offers'
import { TIERS } from '../season/calendar'
import { isOffSeasonWeek } from '../season/calendar'
import type { SeasonEvent } from '../season/types'
import type { AdOfferTerms, Offer, ShootClashChoice, ShootClashPrompt } from '../../shared/protocol'
import { weekLabel } from '../../shared/dates'
import { PLAN_DAYS } from '../plan'
import { cancelEntry } from './entries'
import { addEvent } from './ledger'
import { adShootHolds } from './medical'
import { mandatoryBinds } from './mandatory'
import { guardNotEnded } from './constants'
import type { WorldState } from '../world'

/** THE WEEK THE QUESTION IS ABOUT – always the week ahead, or null when there is nothing to ask. */
export function shootClashWeek(world: WorldState): number | null {
  const week = world.week + 1
  // A layoff already owns the week: `isCompetitionWeek` is false while she is hurt, so she will not
  // play, the collision is not real, and the medical withdrawal / walkover paths own that story.
  // Asking here would be a question with no consequence – R10-16's dead control wearing a dialog.
  if (world.injury !== null) return null
  if (!adShootHolds(world, week)) return null
  if (clashEvent(world, week) === null) return null
  return week
}

/** The entry that collides with the shoot, or null. `isCompetitionWeek`'s own read of "she plays
 *  this week", asked of a week that has not arrived yet. */
export function clashEvent(world: WorldState, week: number): SeasonEvent | null {
  return world.season.find((e) => e.week === week && world.entries.includes(e.id)) ?? null
}

/** IS THE QUESTION STANDING IN FRONT OF THE WEEK? The one predicate `advanceRefusal` blocks on and
 *  the snapshot's prompt is derived from, so the dialog can never be missing on a week the engine
 *  has refused to tick – the contract `pendingKnock` and `pendingBirthday` already keep.
 *
 *  ⚠ THE LATCH IS THE ONLY THING «do both» LEAVES BEHIND, and it is what stops the question being
 *  asked for ever: the other three answers remove the collision itself. See
 *  `WorldState.shootClashAccepted`. Pure read, zero draws. */
export function shootClashOpen(world: WorldState): boolean {
  const week = shootClashWeek(world)
  return week !== null && !(world.shootClashAccepted ?? []).includes(week)
}

/** WHAT ONE SHOOT COST THE BRAND, read off the paper: the campaign fee divided by the number of
 *  shoots the term asked for. Cancelling one hands that share back.
 *
 *  ⚠ IT IS THE CONTRACT'S OWN ARITHMETIC AND NOT A TUNED PENALTY. The owner asked for consequences
 *  and did not name them, and the terms already say what a shoot was worth: `cashCents` bought
 *  `shootCount` of them. Nothing new is invented, nothing new is persisted, and a retuned catalogue
 *  moves this with it because the terms are frozen per deal (`AdOfferTerms`' own rule). Money in
 *  cents; integer by construction. */
export function shootCancelCents(terms: AdOfferTerms): number {
  return Math.round(terms.cashCents / Math.max(1, terms.shootCount))
}

/** THE DEAL THAT NAMED THIS WEEK, or null – the paper every arm below writes to. */
function clashDeal(world: WorldState, week: number): Offer | null {
  return activeAdDeal(world.offers, week)
}

/** WHERE A MOVED SHOOT LANDS: the first week after the clash that the letter's own promises still
 *  allow. `chooseShootWeeks`' clauses, re-asked one at a time rather than re-rolled –
 *
 *   * inside the term (`fromWeek`..`untilWeek`), because the campaign ends when it ends;
 *   * IN-SEASON, «an off-season cost is free money wearing a cost's clothes» (plan §5.2, owner-ruled);
 *   * not ADJACENT to another shoot week – «a campaign is not a tour», the signature's own filter;
 *   * and not a week she is entered in, which is this item's whole point: a move that landed on the
 *     next tournament would raise the same question again next month.
 *
 *  Null when the term has no room left – and that is a real answer rather than a failure: the dialog
 *  simply does not offer the move, which is the R10-16 rule (never a control that cannot act).
 *  Deterministic, zero draws. */
export function shootMoveTarget(world: WorldState, week: number): number | null {
  const deal = clashDeal(world, week)
  if (!deal) return null
  const terms = deal.terms as AdOfferTerms
  const others = (terms.shootWeeks ?? []).filter((w) => w !== week)
  const until = deal.untilWeek ?? -1
  for (let w = week + 1; w <= until; w++) {
    if (isOffSeasonWeek(w)) continue
    if (others.some((s) => Math.abs(s - w) <= 1)) continue
    if (clashEvent(world, w) !== null) continue
    return w
  }
  return null
}

/** THE QUESTION, AS THE SCREEN READS IT. Derived per snapshot off the same predicate `advanceWeeks`
 *  refuses on, so the two cannot disagree about whether the career is waiting for him – the contract
 *  `buildKnockPrompt` and `buildBirthdayPrompt` already keep.
 *
 *  Every number the card prints is here, and none of them is assembled prose: the `AcademyLetterTerms`
 *  rule, so a copy edit cannot change what the player is told a thing costs. */
export function buildShootClashPrompt(world: WorldState): ShootClashPrompt | null {
  if (!shootClashOpen(world)) return null
  const week = shootClashWeek(world)!
  const event = clashEvent(world, week)!
  const deal = clashDeal(world, week)
  if (!deal) return null
  const terms = deal.terms as AdOfferTerms
  return {
    week,
    weekLabel: weekLabel(week),
    brand: terms.brand,
    eventLabel: TIERS[event.tier].label,
    entryFeeCents: TIERS[event.tier].entryFeeCents,
    // A withdrawal on this week is always past the deadline in practice, but the engine is the
    // authority on both halves and neither is re-derived on the screen.
    entryRefunded: world.week <= event.deadlineWeek,
    mandatoryPenalty: mandatoryBinds(world, event),
    moveToWeek: shootMoveTarget(world, week),
    moveToLabel: (() => {
      const to = shootMoveTarget(world, week)
      return to === null ? null : weekLabel(to)
    })(),
    cancelShootCents: shootCancelCents(terms),
    conditionCost: ECONOMY.advertising.clashConditionPerDay * PLAN_DAYS,
  }
}

/** THE PARENT ANSWERS. One command, four arms, and every one of them either removes the collision or
 *  latches the week – so the question is asked once and time moves again.
 *
 *  ⚠ THE ENGINE RE-VALIDATES, because the worker is not the gate: an answer arriving for a week that
 *  no longer collides is refused rather than applied to whatever week the world is on now.
 *
 *  ZERO RNG draws on any stream, in every arm. */
export function answerShootClash(world: WorldState, choice: ShootClashChoice): void {
  guardNotEnded(world)
  const week = shootClashWeek(world)
  if (week === null || !shootClashOpen(world)) throw new Error('There is no shoot to decide about this week')
  const event = clashEvent(world, week)!
  const deal = clashDeal(world, week)
  if (!deal) throw new Error('There is no campaign to decide about this week')
  const terms = deal.terms as AdOfferTerms

  if (choice === 'withdraw') {
    // ⚠ THE ENGINE'S EXISTING WITHDRAWAL AND NOTHING BESIDE IT. `cancelEntry` refunds inside the
    // deadline and forfeits past it, and charges the late-withdrawal points where `mandatoryBinds`
    // says the event bound her. The owner did not specify what pulling out should cost here, so
    // nothing new is written: this costs exactly what pulling out of that tournament costs on any
    // other week, from the calendar.
    cancelEntry(world, event.id)
    return
  }

  if (choice === 'move-shoot') {
    const to = shootMoveTarget(world, week)
    if (to === null) throw new Error('There is no week left in the term to move the shoot to')
    terms.shootWeeks = [...(terms.shootWeeks ?? []).filter((w) => w !== week), to].sort((a, b) => a - b)
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `${terms.brand} shoot moved to ${weekLabel(to)} – the ${TIERS[event.tier].label} week stands.`,
    })
    return
  }

  if (choice === 'cancel-shoot') {
    // ⚠ THE CONSEQUENCE THE OWNER ASKED FOR («явно должны быть последствия какие-то»), and it is the
    // contract's own number rather than a tuned one: the shoot's share of the campaign fee goes
    // back. Booked under 'sponsor', the category brand money has always used, so the Money breakdown
    // files it beside the cheque it reverses.
    terms.shootWeeks = (terms.shootWeeks ?? []).filter((w) => w !== week)
    const cents = shootCancelCents(terms)
    world.fundsCents -= cents
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'sponsor',
      text: `${terms.brand} shoot cancelled – the campaign takes its share back`,
      amountCents: -cents,
    })
    return
  }

  // «жарить прямо с чемпионатом с последствиями» – both stand, and the week is latched so the
  // question is not asked again. What it COSTS is charged by `accrueCondition` off the fact that she
  // shot and played, never off this list; see the field's own note.
  world.shootClashAccepted = [...(world.shootClashAccepted ?? []), week]
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `${terms.brand} shoot and the ${TIERS[event.tier].label} in one week – a heavy week ahead.`,
  })
}
