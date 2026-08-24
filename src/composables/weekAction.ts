// ONE WEEK BUTTON, TWO PROJECTIONS (the calendar slice, 30.07).
//
// The owner asked for the Calendar screen to carry "the main action button, like Home has". That
// sentence hides the only real hazard in this slice, and it is the hazard `arrivalStatus` was written
// to kill - so this file exists before either button is drawn.
//
// WHAT WENT WRONG THE LAST TIME A SECOND SURFACE ANSWERED THIS QUESTION (engine/world.ts, "THE
// ARRIVAL GATE"): three places asked "what will actually happen when this entered week arrives?" and
// each answered it its own way. `tickWeek` read `world.injury !== null` inline, `weekAhead.ts` asked
// NOTHING and printed "Play {tier}" whatever her body had done, and nothing at all mentioned a
// committed entry to an outgrown tier. The owner's click did nothing he could see. The fix was ONE
// rule with three readers, and the lesson generalises: two controls that mean the same press must not
// each compute what the press does.
//
// So the Calendar's button and Home's floating pill read THIS, and nothing else:
//
//   * WHAT IT SAYS  - `label`, straight off `useWeekAhead`, which already reads the engine's own
//                     `snapshot.arrival` verdict. Not re-derived here; re-exported through here so
//                     there is one import for a caller and no temptation to compose two.
//   * WHAT IT DOES  - `mode`, the three-way the shell's one handler switches on. It is DERIVED from
//                     the same facts as the label, in the same order, so a button that says
//                     "Play J30" cannot route to an ordinary tick and a button that says "Practice
//                     match" cannot skip the flow.
//   * WHETHER IT MAY ACT - `disabled` plus, when it is blocked for a reason a player can read,
//                     `blockedNote`. R10-16's doctrine, restated: a dead control with no reason on
//                     screen is the bug; a disabled control WITH its reason is the fix.
//
// ⚠ WHY THE KNOCK IS A BRANCH HERE AND IS NOT ONE IN App.vue TODAY. `advanceWeeks` refuses to tick a
// single week while `knock.choice` is null - the week is a question and the engine will not resolve
// around it. App.vue gets away with never asking, because `KnockDialog` is the last thing in its
// template and paints over the whole screen, so the button underneath cannot be pressed. That is
// cover, not an answer: it holds only for as long as every advance control sits UNDER that dialog,
// and a screen that grew its own control on the strength of "the dialog is on top" is precisely how
// the arrival gate's three answers came about. Asked once, here, both controls are honest even if one
// of them is ever drawn somewhere the dialog is not.
//
// NOTHING IS ADDED TO THE SNAPSHOT and nothing is added to the engine: every fact below is one the
// shell was already reading, in the order it was already reading it.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { blockingOverlay } from './blockingOverlay'
import { MULTI_WEEK_SPAN } from '../engine/world/multiWeek'
import { useWeekAhead, type WeekAheadKind } from './weekAhead'

/** What the one handler behind the button has to do with the press.
 *
 *  `resume`   - a tournament reveal is paused: re-open its overlay. Costs nothing and ticks nothing
 *               (`advanceWeeks` returns 'tournament' untouched in this state, which is what used to
 *               make this click a silent no-op - R13-5).
 *  `practice` - a booked friendly sits on the week ahead: advance, then open the flow on the match
 *               the tick resolved (R10-12's path).
 *  `advance`  - everything else: play the week. */
export type WeekActionMode = 'resume' | 'practice' | 'advance'

export interface WeekAction {
  /** the week-ahead kind, for anything that wants to colour or branch on it */
  kind: WeekAheadKind
  /** the button's whole label. Player copy: short dash, no arrow, no emoji (A3, owner 28.07). */
  label: string
  mode: WeekActionMode
  /** the control must not act right now */
  disabled: boolean
  /** why not, in the parent's language, or null when the only reason is a request in flight.
   *  A caller that has room SHOWS this; one that has not still gets `disabled` right. */
  blockedNote: string | null
  /** ⭐ R2-13 PHASE 1 – THE SECOND PRESS, or `null` when the week must not offer one.
   *
   *  ⚠ IT IS NULL FAR MORE OFTEN THAN IT IS NOT, AND THAT IS THE FEATURE. The skip-4 shipped once
   *  and was deleted on 28.07 with a one-line verdict that is still the design constraint: "it was a
   *  testing shortcut that offered to skip the thing the player came to play" (App.vue, A3). R2-13
   *  brings it back under the rule that makes that verdict false – the span is offered ONLY on a
   *  quiet week, and only while the engine can actually move time. See `multiOffered`. */
  multi: { weeks: number; label: string } | null
}

/** THE WEEKS A SPAN MAY START ON, and every member is a week with nothing in it to watch.
 *
 *  ⚠ WHAT IS EXCLUDED IS THE ARGUMENT. 'tournament' and 'walkover' are the trip and its withdrawal;
 *  'practice' is a booked friendly with a flow of its own; 'vacation' is a beat the family paid for.
 *  Those four are the thing the player came to play, and a control offering to spend four weeks
 *  starting with one of them is the 28.07 button again. What is left – ordinary training, the exam
 *  fortnight and the off-season – is exactly the "quiet stretch" R2-13 exists to stop charging a
 *  press a week for.
 *
 *  ⚠ IT GATES THE FIRST WEEK ONLY, DELIBERATELY. Weeks two to four are the ENGINE's business, and
 *  the engine already stops on every one of them that turns out to hold something: an entered
 *  tournament sets `pendingTournament` inside the tick and halts the span there, so nothing is
 *  skipped and the flow opens exactly as it would have on the fourth separate press. Re-deriving
 *  "what is in week +3" here would be a second stopping model, which is the one thing R2-13 forbids. */
const QUIET_AHEAD: ReadonlySet<WeekAheadKind> = new Set<WeekAheadKind>(['training', 'exam', 'off-season'])

/** THE ONE ANSWER both week controls read. Precedence is `useWeekAhead`'s, deliberately: a paused
 *  reveal owns the press first, and everything else follows the "most committed first" order the
 *  label is already built on. */
export function useWeekAction(): ComputedRef<WeekAction> {
  const game = useGameStore()
  const ahead = useWeekAhead()
  return computed<WeekAction>(() => {
    const snap = game.snapshot
    const { kind, label } = ahead.value
    // A PAUSED REVEAL FIRST, exactly as the label is. Re-opening an overlay is free, so this arm is
    // never blocked by anything below it - and it must not be, or a player who backed out of a
    // tournament splash would have no way back into it.
    if (snap?.pending) return { kind, label, mode: 'resume', disabled: game.busy, blockedNote: null, multi: null }
    // THE UNANSWERED KNOCK. The engine will not move time until he decides, so a button that acts is
    // a button that does nothing - the R12-15 dead click, one beat earlier in the week.
    const knock = snap?.knockPrompt
    if (knock) {
      return {
        kind,
        label,
        mode: 'advance',
        disabled: true,
        blockedNote: `Her ${knock.part} is waiting on your call – nothing moves until you answer.`,
        multi: null,
      }
    }
    return {
      kind,
      label,
      mode: kind === 'practice' ? 'practice' : 'advance',
      disabled: game.busy || !snap,
      blockedNote: null,
      // ⚠⚠ THE LABEL MAY NOT BEGIN WITH "Play", AND THAT IS A CONTRACT WITH THE e2e SUITE RATHER THAN
      // a matter of taste. `e2e/journey.ts` finds the advance control by its accessible NAME, against
      // a deliberately CLOSED set that includes `Play .+` – and it is unscoped, because until now
      // "there is exactly one advance button in the whole product". A second control saying
      // "Play 4 weeks" makes that locator ambiguous and every journey fails Playwright's strict mode.
      // "Next" also happens to be the honest word: this button does not play a week, it spends four.
      multi: multiOffered(snap, kind) ? { weeks: MULTI_WEEK_SPAN, label: `Next ${MULTI_WEEK_SPAN} weeks` } : null,
    }
  })
}

/**
 * MAY THIS WEEK OFFER THE SPAN? R2-13's "only when the engine can stop before a blocking event",
 * as a predicate, exported so a test can walk a real career through it without mounting anything.
 *
 * ⚠⚠ THE FIRST CLAUSE IS THE ENGINE'S OWN REFUSAL, ASKED OF THE SNAPSHOT. `advanceWeeks` returns a
 * reason and ticks NOTHING in six states (engine/world/multiWeek.ts `advanceRefusal`): an ending, an
 * open reveal, an unanswered knock, an unanswered birthday, the fork and the retirement offer. Five
 * of those six are exactly what `blockingOverlay` enumerates – it was written from the same list,
 * for the same reason ("the five overlays below all stop the world") – and the sixth is `pending`.
 * So the two readers are the same rule seen from either side of the wire, and
 * `tests/r2-13-advance-span.test.ts` walks a world into every one of the six and asserts they agree.
 *
 * ⚠ WHY THE SNAPSHOT AND NOT THE ENGINE. The shell holds a `Snapshot`, never a `WorldState`; this is
 * the same move App.vue's birthday gate makes ("the engine sets it from `pendingBirthday`, the
 * identical predicate `advanceWeeks` blocks on") and its injury gate after it. Re-asking is not
 * re-deriving: no clause below invents a rule the engine does not already enforce.
 */
export function multiOffered(snap: Parameters<typeof blockingOverlay>[0], kind: WeekAheadKind): boolean {
  if (!snap) return false
  if (snap.pending) return false
  if (blockingOverlay(snap) !== null) return false
  return QUIET_AHEAD.has(kind)
}
