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
import { captureEntryRow } from './ladder'
import { captureMilestone, emptySeasonEntries } from './milestones'
import { entryStatus } from './medical'
import { isCappedTier, isCappedProTier } from './entryCaps'
import { chargeMandatoryPenalty, mandatoryBinds } from './mandatory'
import { ECONOMY } from '../economy'
import type { EntryReleaseReason } from '../../shared/protocol'
import type { WorldState } from '../world'
// ⚠ FROM ./constants, NOT ./endings, AND THE SWAP IS A CYCLE FIX (round 24). `answerFork` releases
// her outstanding entries when the college answer freezes the career, so `endings.ts` now imports
// `releaseEntry` from THIS file – and this file importing the guard back out of `endings.ts` would
// have been the first value-import cycle in `src/engine/world/*`. The guard's body moved to the leaf;
// `endings.ts` still re-exports it, so nothing else had to move. Same function, same error text.
import { guardNotEnded } from './constants'


/** Enter the kid in a scheduled event: validates deadline / funds / duplicates / ranking
 *  eligibility, then charges the fee immediately (expense event) and records the entry (entry
 *  event). Eligibility is direction-aware: too low to qualify vs graduated out of the tier. */
export function enterEvent(world: WorldState, eventId: string): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
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
  // v45 – THE SEASON MIRROR, CAPTURED HERE BECAUSE HERE IS THE ONLY PLACE IT IS TRUE.
  //
  // `captureEntryRow` reads her live best-N book – twice, in that rung's own currency – and her book is
  // her results over the last 52 weeks. The wrap-up asks about it up to 49 weeks later, by which time
  // `pruneResults` has deleted the rows it was computed from. So this is a capture in the branch that
  // commits the entry, on the `weeksLostToInjury` precedent, and not a fold at the end of the year.
  // Three wrap-up lines have already been wrong in this project for reading a pruned ledger after the
  // fact; this one does not read one. The rule that later reads these facts is `entryCouldNotMove`.
  //
  // ⚠ THE ROW IS WRITTEN WHATEVER THE FACTS SAY. The denominator has to come from the same commit as
  // the numerator or the line is a ratio of two different seasons – `world.results` is award-only (a
  // season of lost openers leaves no row) and `world.events` is capped at 400, so neither can supply it.
  //
  // ⚠ AND IT IS NOT GATED ON THE COACH. `coachLadderNote` makes the same argument on the card, but only
  // at `coachReadsTheBook` rungs and only about a rung she has walked past. The arithmetic is true for a
  // self-coached family too, and a parent who cannot afford a coach is the last one who should be left to
  // work it out unaided. Pure state, zero draws – the frozen MAIN capture cannot see this.
  const ledger = (world.seasonEntries ??= emptySeasonEntries(world.week))
  ledger.rows.push(captureEntryRow(world, eventId, event.tier))
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

/** Withdraw before the deadline: refunds the fee (income event) + records it (entry event).
 *
 *  ⚠ W2-ENDINGS – THE GUARD IS ON THIS FUNCTION AND NOT ON THE BODY BELOW IT, and the split is the
 *  fix for a measured bug rather than tidiness. This is BOTH a player command and an ENGINE step:
 *  the injury auto-withdraw comes through here (as `releaseOutgrownEntries` did until 05.08) and
 *  runs inside `tickWeek`. Guarding the shared implementation made `tickWeek` throw the moment a career
 *  latched while holding an open entry - which is `tickWeek` failing to be total, the one property
 *  the whole ending design is built on. So the PLAYER's door is guarded and the engine's own path
 *  goes straight to `releaseEntry`. Found by tests/travel-home.test.ts, which plays a real career. */
export function withdrawEvent(world: WorldState, eventId: string): void {
  guardNotEnded(world)
  releaseEntry(world, eventId)
}

/** ⚠⚠ THE OPENING WORDS OF THE TWO FEED ROWS A RELEASE CAN WRITE, EXPORTED BECAUSE A SURFACE HAS TO
 *  RECOGNISE ONE OF THEM – AND ROUND-20 #2 IS WHAT IT COSTS WHEN IT CANNOT.
 *
 *  The injury popup's "Cancelled" row lists what the layoff pulled her out of, and it finds those
 *  rows by their opening words because a `WorldEvent` carries no release reason (adding one is a save
 *  schema change for a presentation-only read – see the note at the top of InjuryStopDialog.vue).
 *  It was matching `'Withdrew from '`, which was the ONE sentence this function wrote until 05.08.
 *  `releasedBy` then split it in two so the desk's own action would stop being reported to the player
 *  as a receipt for a choice he never made – a real fix – and the popup was never repointed. From that
 *  day the report could not see an injury withdrawal at all: measured on a real career, a 9-week
 *  layoff pulled her out of two Local Opens, refunded both fees, and the popup counted ZERO and said
 *  "Nothing – every entry stands" (owner, 13.08).
 *
 *  So the words live here, once, and the surface imports them. That does not make the coupling
 *  disappear – it makes it a symbol instead of a spelling, which is the difference between a rename
 *  that breaks a build and a rename that breaks a player's report in silence.
 *  `tests/component/injury-cancelled-row.test.ts` drives a REAL injury and reads the REAL rendered
 *  row, so the two halves are checked together rather than against each other's literals. */
export const RELEASE_LINE_PREFIX: Record<EntryReleaseReason, string> = {
  parent: 'Withdrew from ',
  injury: 'Taken out of ',
  college: 'Released from ',
}

/** ⚠⚠ WHICH RELEASES A CLOSED LIST CAN STILL REFUSE – the deadline rule, written as a table so the
 *  next reason on `EntryReleaseReason` cannot inherit an answer nobody chose for it.
 *
 *  `true` is the historical rule and it is about a PULL-OUT: past `deadlineWeek` the list has closed
 *  with her name in it, so the organisers keep the fee whatever the reason she does not appear
 *  (`cancelEntry`'s late arm, `skipEvent`, the medical withdrawal in `tickWeek` – all three forfeit).
 *  The fee HAS to bite there or «enter it and see» becomes the dominant strategy. `'parent'` is that
 *  rule by definition; `'injury'` keeps it too and its caller already filters on the same date
 *  (`world/injury.ts`: `world.week <= e.deadlineWeek`), so that arm is byte-identical.
 *
 *  ⭐ `'college'` IS THE FIRST `false`, AND IT IS THE OWNER'S OWN LAW RATHER THAN A CONVENIENCE.
 *  «Мы ни за что не наказываем.» She is not skipping a tournament: she has answered the fork, and
 *  the GAME is taking her off the tour for four years – the plan's own sentence is «an entry made
 *  four years ago is not a commitment she made» (docs/plans/college-the-flow.md §4). Charging a
 *  forfeited fee, or the late-withdrawal penalty points `cancelEntry` can add, would put a price on
 *  the most expensive click in the game that the fork card never quoted – a punishment for answering
 *  a question the game itself raised. So this release refunds in full and returns the slot however
 *  late it lands, and it never touches `mandatoryBinds`/`chargeMandatoryPenalty` (which live in
 *  `cancelEntry` alone and are not reachable from here). */
const REFUSED_PAST_DEADLINE: Record<EntryReleaseReason, boolean> = {
  parent: true,
  injury: true,
  college: false,
}

/** ...and the clause the injury row ends with, so a surface can quote the ENTRY without repeating the
 *  reason it is already standing under. */
export const INJURY_RELEASE_SUFFIX = ', she is not fit for that week.'

/** The withdrawal itself, with no command guard on it – the engine's own path.
 *
 *  ⚠ `releasedBy` IS NOT DECORATION, IT IS THE BUG (fix/outgrown-entry, 05.08). Two callers reach
 *  here and only ONE of them is the parent deciding something: his in-time withdrawal, and the
 *  injury auto-withdraw that runs inside `tickWeek`. Both used to write the same two sentences -
 *  a feed row reading «Withdrew from World Tour 50» and a desk letter reading «Your withdrawal ...
 *  is confirmed – in time, free of charge, and nothing is recorded against her» - so the ENGINE's
 *  own action was reported back to the player as a receipt for a choice he never made. The owner
 *  hit it and said so: «ее автоматом сняли с 3-го письмом без объяснения причины». The missing
 *  reason was the smaller half; the misattributed agency was the disorienting one.
 *
 *  The default is `'parent'`, and every byte of that arm is unchanged - same feed text, same letter
 *  terms, same ids. Only a caller that is NOT the parent has to say so, which is the shape that
 *  makes the next engine-side release impossible to add silently. */
export function releaseEntry(world: WorldState, eventId: string, releasedBy: EntryReleaseReason = 'parent'): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (REFUSED_PAST_DEADLINE[releasedBy] && world.week > event.deadlineWeek) {
    throw new Error('Cannot withdraw after the deadline')
  }
  const fee = TIERS[event.tier].entryFeeCents
  world.fundsCents += fee
  world.entries = world.entries.filter((id) => id !== eventId)
  // THE SLOT FOLLOWS THE FEE. This is the only path that hands the money back, and it is the only
  // one that hands the year's slot back – the ITF counts PARTICIPATION, and a name taken off an
  // open list never participated. Every forfeiting exit keeps both (cancelEntry past the deadline,
  // skipEvent on the week, the medical withdrawal in tickWeek): the list closed with her on it, so
  // she was an entrant. Nothing else needs to know the rule, because the automatic pull-out that
  // DOES refund – the injury auto-withdraw – comes through here.
  if (isCappedTier(event.tier)) {
    const at = world.internationalEntryWeeks.indexOf(event.week)
    if (at >= 0) world.internationalEntryWeeks.splice(at, 1)
  }
  // v45: AND THE SEASON MIRROR FOLLOWS THE FEE BY THE SAME RULE, which is why it is written here rather
  // than beside the other two exits. A withdrawal inside the deadline is money back and a week back, so
  // it was not a wasted entry and the season must not count it. Every forfeiting exit keeps it – a late
  // cancel, a skip on the week, the medical forfeit – because she paid and the week went.
  //
  // ⚠ THE ROW CARRIES ITS ID AND THAT IS WHAT MAKES THIS SAFE ACROSS A SEASON BOUNDARY. An entry taken
  // in week 45 can be withdrawn in week 2 of the next season, after the wrap has banked and reset; a
  // bare counter would debit a season that never counted it. `filter` on the id can only ever remove a
  // row this ledger actually holds, so the stale case is a no-op instead of an off-by-one.
  if (world.seasonEntries) {
    world.seasonEntries.rows = world.seasonEntries.rows.filter((r) => r.id !== eventId)
  }
  // The pro slot follows the fee by the same rule: only the refunding withdrawal hands it back
  // (a name off an open list never participated); every forfeiting exit keeps it.
  if (isCappedProTier(event.tier)) {
    const at = world.proEntryWeeks.indexOf(event.week)
    if (at >= 0) world.proEntryWeeks.splice(at, 1)
    // The desk confirms an inside-the-deadline exit in writing (§6 step 2) - this path IS that exit
    // (`cancelEntry` delegates here before the deadline; the forfeiting exits never come through,
    // and act 3 is where those grow teeth). WHO took it goes on the paper.
    raiseEntryCancelLetter(world.offers, world.week, event, TIERS[event.tier].label, releasedBy)
  }
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: `Entry refunded: ${TIERS[event.tier].label}`,
    amountCents: fee,
  })
  // ⚠ THE FEED ROW OBEYS THE SAME RULE AS THE LETTER, and it has to: the letter is one tap away in
  // the inbox, this line is in the news, and a player who reads only the news must not be told he
  // withdrew her either. "Withdrew" is the parent's own verb and stays exactly as it was.
  //
  // ⚠ EXHAUSTIVE ON PURPOSE (no `default`, no ternary): a new `EntryReleaseReason` must not be able
  // to inherit somebody else's sentence. TypeScript refuses the switch the day one is added, which
  // is the only mechanism that reliably makes an author write the copy.
  const label = TIERS[event.tier].label
  let line: string
  switch (releasedBy) {
    case 'parent':
      line = `${RELEASE_LINE_PREFIX.parent}${label} – ${weekLabel(event.week)}`
      break
    case 'injury':
      line = `${RELEASE_LINE_PREFIX.injury}${label} – ${weekLabel(event.week)}${INJURY_RELEASE_SUFFIX}`
      break
    case 'college':
      // ⚠ NOT "Withdrew", FOR THE REASON THE WHOLE SWITCH EXISTS: he answered a question about her
      // future, not this tournament, and a feed row telling him he pulled her out of a World Tour
      // 500 would be the 05.08 bug in college colours. And no apology and no price in the sentence –
      // the fee is back, and the release is the game's own housekeeping.
      line = `${RELEASE_LINE_PREFIX.college}${label} – ${weekLabel(event.week)}, she is taking the scholarship.`
      break
  }
  addEvent(world, { week: world.week, type: 'entry', text: line })
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
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
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
  // ⚠ THE LATE WITHDRAWAL, AND THIS IS THE ONE PLACE IT CAN BE CHARGED (W3-ACT2 §6). Past the
  // deadline the entry list has CLOSED and the draw is published with her name in it, so the tour
  // loses a seed and a slot rather than merely an entry - which is why it costs more than never
  // having entered at all (`lateWithdrawalPoints` 3 against `skipPoints` 2), and why the free,
  // in-time exit above delegates to `withdrawEvent` and reaches none of this.
  //
  // ⚠ `mandatoryBinds` IS CONSULTED AGAINST THE EVENT ITSELF, so the same "an obligation she could
  // not meet is not an obligation" rule that governs the skip governs here: an injured player, a
  // suspended one, or one the acceptance list has since refused pulls out for nothing. And she has
  // already been WRITTEN to about this event - the desk's entry letter quoted this very deadline
  // when she registered, and the tour's due-notice quoted it again. Nothing here can surprise her.
  if (mandatoryBinds(world, event)) {
    chargeMandatoryPenalty(
      world,
      world.week,
      ECONOMY.mandatory.lateWithdrawalPoints,
      'late-withdrawal',
      event,
    )
  }
}
