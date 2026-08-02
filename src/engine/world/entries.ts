// THE ENTRY COMMANDS: putting her in a draw, and taking her back out.
//
// Three player verbs that share one rulebook – `enterEvent` validates the deadline, the funds, the
// duplicate and the ranking gate before it charges anything; `withdrawEvent` is the before-deadline
// undo that refunds in full; `cancelEntry` the after-deadline one that does not. They live together
// because the refund story only makes sense read as a set.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. `skipEvent` deliberately stayed behind: it closes a
// week (it reaches the tick pipeline's own deferred steps) and is a tick concern, not an entry one.
//
// ⚠ RNG: zero draws. Entering or withdrawing must never move the MAIN weekly sequence – that is the
// input-independence law, and it is why the fee/refund path is pure state plus ledger writes.
import { TIERS } from '../season/calendar'
import { weekLabel } from '../../shared/dates'
import { raiseEntryLetter, raiseEntryCancelLetter } from '../offers'
import { addEvent } from './ledger'
import { eventById, refundPractice, practiceForWeek } from './bookings'
import { captureMilestone } from './milestones'
import { entryStatus } from './medical'
import { isCappedTier, isCappedProTier } from './entryCaps'
import type { WorldState } from '../world'


/** Enter the kid in a scheduled event: validates deadline / funds / duplicates / ranking
 *  eligibility, then charges the fee immediately (expense event) and records the entry (entry
 *  event). Eligibility is direction-aware: too low to qualify vs graduated out of the tier. */
export function enterEvent(world: WorldState, eventId: string): void {
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.entries.includes(eventId)) throw new Error('Already entered this event')
  if (world.week > event.deadlineWeek) throw new Error('Entry deadline has passed')
  // Ladder-up: the calendar now stacks several tiers on the same week, so "one event per week" is
  // no longer guaranteed by the schedule and has to be a rule. She has one body and one week –
  // the abundance is a CHOICE between events, not a licence to play two.
  if (world.season.some((e) => e.week === event.week && world.entries.includes(e.id))) {
    throw new Error('She is already entered in a tournament that week')
  }
  const fee = TIERS[event.tier].entryFeeCents
  if (world.fundsCents < fee) throw new Error('Not enough funds for the entry fee')
  // THE ONE GATE (round-10 R10-5): point band + availability, in one call, shared with the snapshot
  // and the advance stop – so no surface can decide differently about the same event. Only a HARD
  // block stops entry; fatigue is a soft, warned CHOICE (level 'caution'), so racing tired is
  // allowed – its cost is emergent, not a veto.
  const gate = entryStatus(world, event)
  if (gate.level === 'blocked') throw new Error(gate.detail ?? 'Unavailable this week')
  // Season planner: the real thing wins over the friendly. A practice match booked on this week
  // gives way (rental refunded in full) instead of stacking a friendly onto a tournament week –
  // she can only play one week's worth of tennis. A booked VACATION can't collide: it is a hard
  // availability block, so the guard above already refused.
  const collidingPractice = practiceForWeek(world, event.week)
  if (collidingPractice) refundPractice(world, collidingPractice, 'Cancelled')
  world.fundsCents -= fee
  world.entries.push(eventId)
  // ITF annual cap: an international entry spends one of the year's slots. Recorded by the EVENT's
  // week, which is both the slot's identity (one tournament a week) and the season it belongs to.
  if (isCappedTier(event.tier)) {
    world.internationalEntryWeeks.push(event.week)
    // D10: her FIRST international entry (j30+) is a moment the family keeps – captured here, at
    // the moment the form goes in, which is what "first entry" means. Idempotent, so every later
    // entry (and a withdrawal of this one) leaves the memory untouched.
    captureMilestone(world, { type: 'international', week: world.week, tier: event.tier })
  }
  // The PRO ledger, maintained exactly like the junior one and never with it (W2-LADDER §5): a W
  // entry spends one of the season's WTA-age-rule slots, recorded by the EVENT's week.
  if (isCappedProTier(event.tier)) {
    world.proEntryWeeks.push(event.week)
    // ...and THE TOURNAMENT DESK WRITES (W2-LADDER §6, owner ruling 1): registration on the
    // professional tour is an obligation, and the obligation is announced through the existing
    // mail surface the moment it is taken on - "you are entered; cancel free until week N; after
    // that the tournament's rules apply". Zero draws (a receipt, not weather - see offers.ts).
    raiseEntryLetter(world.offers, world.week, event, TIERS[event.tier].label)
  }
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'entry',
    text: `Entry fee: ${TIERS[event.tier].label} (${weekLabel(event.week)})`,
    amountCents: -fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Entered ${TIERS[event.tier].label} – ${weekLabel(event.week)} (${event.surface})`,
  })
}

/** Withdraw before the deadline: refunds the fee (income event) + records it (entry event). */
export function withdrawEvent(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.week > event.deadlineWeek) throw new Error('Cannot withdraw after the deadline')
  const fee = TIERS[event.tier].entryFeeCents
  world.fundsCents += fee
  world.entries = world.entries.filter((id) => id !== eventId)
  // THE SLOT FOLLOWS THE FEE. This is the only path that hands the money back, and it is the only
  // one that hands the year's slot back – the ITF counts PARTICIPATION, and a name taken off an
  // open list never participated. Every forfeiting exit keeps both (cancelEntry past the deadline,
  // skipEvent on the week, the medical withdrawal in tickWeek): the list closed with her on it, so
  // she was an entrant. Nothing else needs to know the rule, because the two automatic pull-outs
  // that DO refund – the injury auto-withdraw and releaseOutgrownEntries – both come through here.
  if (isCappedTier(event.tier)) {
    const at = world.internationalEntryWeeks.indexOf(event.week)
    if (at >= 0) world.internationalEntryWeeks.splice(at, 1)
  }
  // The pro slot follows the fee by the same rule: only the refunding withdrawal hands it back
  // (a name off an open list never participated); every forfeiting exit keeps it.
  if (isCappedProTier(event.tier)) {
    const at = world.proEntryWeeks.indexOf(event.week)
    if (at >= 0) world.proEntryWeeks.splice(at, 1)
    // The desk confirms a free, in-time cancellation in writing (§6 step 2) - this path IS the
    // inside-the-deadline exit (`cancelEntry` delegates here before the deadline; the forfeiting
    // exits never come through, and act 3 is where those grow teeth).
    raiseEntryCancelLetter(world.offers, world.week, event, TIERS[event.tier].label)
  }
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: `Entry refunded: ${TIERS[event.tier].label}`,
    amountCents: fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Withdrew from ${TIERS[event.tier].label} – ${weekLabel(event.week)}`,
  })
}

/** R10-13: CANCEL an entry, at any point before its week starts. THE ESCAPE HATCH.
 *
 *  The owner's dead end (R10-3): she was entered in a Local, the list closed, and only THEN did she
 *  outgrow the tier and run out of gas. `withdrawEvent` refuses past the deadline, the planner
 *  refuses a week that holds an entry, and the calendar had hidden the card – so the week could be
 *  neither played, planned, nor abandoned. Nothing was possible. This is the way out.
 *
 *  THE FEE RULE, kept coherent with `skipEvent` (R9-9) and with the medical withdrawal in tickWeek:
 *  once the list has closed, the organisers keep the fee whatever the reason she does not appear.
 *  So all three pull-outs forfeit it, and the only difference between them is what else was already
 *  charged at the moment of the pull-out:
 *    - BEFORE the deadline  -> this is a withdrawal, not a forfeit: delegates to `withdrawEvent`
 *                             (full refund). One command for the UI, the refund rule untouched.
 *    - after the deadline, before the week -> fee forfeited. Travel has not been charged yet
 *                             (tickWeek charges it on the play week), so there is nothing to hand
 *                             back, and the week becomes plannable again (practice or vacation).
 *    - ON the event week    -> not this command's business: tickWeek has already charged travel and
 *                             stashed the run, so `skipEvent` owns it (fee forfeited, travel back).
 *  Refunding here instead would make "enter it and see" the dominant strategy, which is the same
 *  reason the medical withdrawal forfeits – the fee has to bite.
 *
 *  Pure state, ZERO RNG draws. */
export function cancelEntry(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (event.week <= world.week) {
    throw new Error('That week has already started – skip the tournament instead')
  }
  // Still refundable: the list is open, so this is an ordinary withdrawal and the fee comes back.
  if (world.week <= event.deadlineWeek) {
    withdrawEvent(world, eventId)
    return
  }
  world.entries = world.entries.filter((id) => id !== eventId)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Cancelled ${TIERS[event.tier].label} – ${weekLabel(event.week)}, entry fee forfeited.`,
  })
}
