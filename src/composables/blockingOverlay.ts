// ⭐ WHICH BLOCKING QUESTION IS ON SCREEN – one ordered list, in one place.
//
// The five overlays below all stop the world: `advanceWeeks` refuses to tick a single week until the
// one that is up has been answered, and none of them has a dismiss. So exactly one may be visible,
// and WHICH one is a rule about the story rather than about z-index.
//
// ⚠ WHY THIS IS A FUNCTION AND NOT FIVE COMPUTEDS. It was five computeds, each negating the others
// («show the birthday unless the fork, unless the retirement, unless the knock…»), and that shape has
// two faults that only show up when a new question is added to it:
//
//   1. IT CANNOT BE READ. The answer to "what does the player see the week she turns nineteen" was
//      spread over four `!show*.value` clauses in three comment blocks.
//   2. IT CAN CYCLE. `showRetirement` already read `!showFork`; making the fork wait for the birthday
//      (owner, 12.08) closed the loop birthday → retirement → fork → birthday, which is a Vue
//      computed cycle rather than a wrong dialog. Precedence written as a LIST cannot do that,
//      because a list has no back-edges.
//
// ⚠ AND IT IS THE HALF THAT CAN BE PROVEN. `tests/blocking-overlay.test.ts` walks a real career
// through every state this returns and asserts the queue always empties – see the note there on why
// "cannot deadlock" is a statement about the CLEARING PATHS, not about the order.
import type { Snapshot } from '../shared/protocol'

/** The blocking overlays, HIGHEST PRECEDENCE FIRST. `null` = the shell is free. */
export type BlockingOverlay = 'ending' | 'knock' | 'birthday' | 'fork' | 'retirement' | 'shoot-clash'

/**
 * ⚠ THE ORDER IS THE FEATURE. Each entry says which snapshot field raises it, and every one of these
 * fields is cleared by a command of its own that does not depend on any other entry – which is what
 * makes the walk terminate however many are pending at once.
 *
 *   1. `ending`     – not a dialog at all: it REPLACES the tab shell, so nothing can be laid over it.
 *   2. `knock`      – her BODY, and the week it governs starts now. Ahead of the birthday by
 *                     STOP_PRECEDENCE's own ordering: a sore shoulder is answered before a cake.
 *   3. `birthday`   – ⭐ 12.08, THE OWNER: «можем мы настроить тогда, чтобы информация о самом дне
 *                     рождения показывалась приоритетом первая "ей 19 сегодня", а про дальнейший
 *                     выбор карьеры уже после этого?»
 *
 *                     Her nineteenth birthday and the fork land in the SAME WEEK, and the fork used
 *                     to win – so the game asked him to decide her whole future before it told him
 *                     she had had a birthday. On two of the three answers («college», «stop») the
 *                     career ends on that click, `pendingBirthday` returns null behind an ending, and
 *                     she never got her nineteenth at all. It was not a queue in the wrong order; it
 *                     was a beat that could be deleted by the beat standing in front of it.
 *   4. `fork`       – the most expensive click in the game, and it can wait one tap.
 *   5. `retirement` – the same question at the other end of the career.
 */
export function blockingOverlay(snapshot: Snapshot | null): BlockingOverlay | null {
  if (!snapshot) return null
  // ⭐⭐⭐ ROUND 24 – THE ONE 'ending' A BIRTHDAY MAY BE LAID OVER: the resumable college latch.
  // Entry 1's whole rationale ("it REPLACES the tab shell, so nothing can be laid over it") stopped
  // being true for exactly this latch when D1 put the Home shell back underneath the freeze – and
  // the college year now PAUSES on her birthday week (the owner's «да, день рождения делай»), so a
  // birthday raised there has a live shell to render over and MUST outrank the latch, or the year
  // pauses with its question rendered nowhere and the career strands. The predicate is App.vue's
  // own `showCollege` half ("this ending draws the Home shell, not the epilogue"), so the two
  // cannot part; every other ending, college-after-leaving included, replaces the shell as before.
  const collegeShell = snapshot.ending?.ending?.type === 'college' && snapshot.ending.college !== null
  if (snapshot.ending && !(collegeShell && snapshot.birthdayPrompt)) return 'ending'
  if (snapshot.knockPrompt) return 'knock'
  if (snapshot.birthdayPrompt) return 'birthday'
  if (snapshot.fork) return 'fork'
  if (snapshot.retirementOffer) return 'retirement'
  // ⭐⭐ 6. `shoot-clash` – ROUND 29 #3, and it is LAST for the reason every entry above it is where
  // it is: it is the only question here about a week that has NOT STARTED. The five above are all
  // about something already true – her body, her birthday, the fork she has reached, the offer she
  // has been made, the career that has ended – and a question about next week can wait behind any of
  // them without being lost, because the week it is about cannot begin until it is answered.
  //
  // ⚠ THE ORDER MATTERS MOST AGAINST THE FORK, which is why it is not merely tidy. Two of the fork's
  // three answers END the career, and college takes her off the tour entirely (`releaseEntry` with
  // reason 'college' pulls every entry she holds) – so answering the fork can delete this collision
  // outright. Asking about a shoot week first would be asking him to decide a week that may not
  // happen. `tests/blocking-overlay.test.ts` walks the queue and asserts it always empties.
  if (snapshot.shootClash) return 'shoot-clash'
  return null
}

// =================================================================================================
// ⭐ ROUND-21 #9 – WHEN A POPUP MAY LAND, WHICH IS A DIFFERENT QUESTION FROM WHICH ONE IS NEXT
// =================================================================================================
//
// The owner, 14.08: «Попап с развилкой появился сразу после финального матча чемпионата перекрыв
// интерфейс таблицы и завершения. Нам надо как-то всё-таки разобраться с порядком появления попапов,
// чтобы они не конфликтовали с происходящим на экране в данный момент, кроме травмы, которая как раз
// должна появляться в моменте.»
//
// ⚠ THE GENERAL RULE IS THE ASK, NOT THE ONE COLLISION. The list above answers "which question is
// next"; it never asked "is the screen free to be interrupted at all". Those are different
// questions and the fork proved it: `finalizeTournament` calls `resolveEndings` at engine/world.ts
// while `pendingTournament` IS STILL SET (`p.finished = true` is the line after it, and only
// `closeTournament` clears the reveal) – so the fork is raised, correctly, with the finale, the
// draw and the points still on screen, and the card painted straight over them.
//
// ⚠ WHY THE EXCEPTIONS ARE A SET AND NOT A CLAUSE PER GATE. Every popup in this app used to decide
// on its own whether it could interrupt a reveal – the injury report and the tour briefing each grew
// a private `!snapshot.pending`, the fork, the birthday, the knock and the retirement offer never
// did, and nothing recorded that as a decision. One set means the next dialog somebody adds inherits
// the wait instead of having this bug filed against it again.
//
// ⚠ AND THE WAIT CANNOT STRAND A CAREER, which is the objection this rule has to answer. A held
// question is held behind a reveal, and a reveal is the one thing in the game with a guaranteed exit
// that costs nothing: `closeTournament` is DELIBERATELY not `guardNotEnded`-guarded (world.ts says
// so, and for this exact family of reasons), and App.vue's sticky bar renders its resume button on
// every tab while `pending` is set. Close the tournament and the held question is the next thing on
// screen. Nothing here can hold a dialog behind a state with no way out of it.

/** Every popup the shell can raise – the five blocking questions plus the reports that are gated the
 *  same way. Named here so the rule below is total over all of them.
 *
 *  ⚠ `onboarding-tour` IS IN THE SET, and it is the case this file's header predicted ("one set means
 *  the next dialog somebody adds inherits the wait"). The coach marks are not a dialog and do not
 *  block – `.coach-tour` is `pointer-events: none` everywhere but the card – but they black the
 *  screen out behind a 4000px shadow and hang a card off a measured rect, so landing them on a
 *  tournament reveal is exactly the collision round-21 #9 was raised about.
 *
 *  ⚠ `college-graduation` JOINED IT IN ROUND 24 (#4) AND THAT IS THIS HEADER'S PREDICTION COMING
 *  TRUE A SECOND TIME. It is the card that closes the college years, and because college stopped
 *  borrowing the epilogue as its shell that week is now an ORDINARY week on the tab shell – so the
 *  new report inherits the wait by being named here instead of by growing a private `!pending`.
 *
 *  ⚠ `week-span` JOINED IT AT R2-13 AND IT IS THE PREDICTION'S THIRD OUTING. It is the report of a
 *  four-week advance, and its collision is the ordinary one: a span that ends on a tournament week
 *  hands the screen to `TournamentFlow`, so a card listing what the four weeks cost must wait for
 *  the reveal exactly as the season summary does. Named here rather than carrying its own
 *  `!pending`, which is the whole discipline of this set. */
export type Popup =
  | BlockingOverlay
  | 'injury'
  | 'season-summary'
  | 'tour-briefing'
  | 'onboarding-tour'
  | 'college-graduation'
  | 'week-span'

/** ⭐ THE POPUPS THAT MAY LAND ON A BUSY SCREEN, and there are exactly two.
 *
 *  * `injury` – the owner's own exception: «кроме травмы, которая как раз должна появляться в
 *    моменте». It is the one report that is ABOUT the moment it interrupts – round-16 #19 wired it
 *    to the snapshot precisely so a retirement mid-tournament could not go by as a scoreline, and
 *    the note it carried then («the report waits for the reveal to be resolved») is what this
 *    ruling overturns. The data is ready when it fires: `retirementInjury` opens the layoff inside
 *    `finalizeTournament`, ahead of `resolveEndings`, so nothing about the report is still pending
 *    while the finale is up.
 *  * `ending` – not a dialog at all. It REPLACES the tab shell, taking the reveal with it, so it
 *    cannot be "held behind" anything; and holding it would be a deadlock rather than a wait, since
 *    the shell it would be waiting for is the one it removes. */
const INTERRUPTS: ReadonlySet<Popup> = new Set<Popup>(['ending', 'injury'])

export function popupInterrupts(id: Popup): boolean {
  return INTERRUPTS.has(id)
}

/** IS THE SCREEN MID-SENTENCE? Two states, and both are sequences the player is being shown rather
 *  than screens they are sitting on:
 *
 *  * `snapshot.pending` – the tournament takeover: the draw, each match as it is revealed, the
 *    result table and the finale. This is the whole of the owner's collision.
 *  * `liveMatch` – the practice friendly playing in `PracticeFlow`. It is local shell state rather
 *    than a snapshot field, so it is passed in; a rule that could only see half the sequences on
 *    screen would be a rule with an unstated exception in it. */
export function screenBusy(snapshot: Snapshot | null, liveMatch = false): boolean {
  return liveMatch || !!snapshot?.pending
}

/** May this popup be on screen right now? The ordering rule, in one place, for every popup. */
export function popupMayShow(id: Popup, snapshot: Snapshot | null, liveMatch = false): boolean {
  return popupInterrupts(id) || !screenBusy(snapshot, liveMatch)
}

/** WHICH blocking question the player can see – precedence and the idle rule together.
 *
 *  ⚠ `blockingOverlay` STAYS THE ANSWER TO "WHAT IS PENDING". The two are not interchangeable: the
 *  reports below the queue must wait for a question that is merely HELD as well as for one that is
 *  showing, or closing a tournament would raise the season summary and the fork in the same frame. */
export function visibleOverlay(snapshot: Snapshot | null, liveMatch = false): BlockingOverlay | null {
  const next = blockingOverlay(snapshot)
  return next !== null && popupMayShow(next, snapshot, liveMatch) ? next : null
}
