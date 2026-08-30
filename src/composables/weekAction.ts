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
//
// ⭐⭐ ROUND 26 #1, SECOND PASS – THE OWNER'S RULING ON THE SPAN PILL, VERBATIM AND IN ONE PLACE
// (25.08). App.vue's template may not carry Cyrillic, so the sentence lives here and the markup
// points at it:
//
//   «давай сделаем ее во-первых слева от основной, а во-вторых по условию, появляться она должна на
//    тех моментах, где либо в календаре нет ни одного события в ближайшие 5 недель, либо у нее
//    травма на 5+ недель или до конца травмы осталось не меньше 5 недель. Иначе это совершенно
//    дурной элемент управления получается, с которым пропускается всё, а еще и прямо под пальцем.»
//
// Two halves, and they land in two different files. The POSITION is App.vue's bar (the pill is the
// first child of `.next-week-bar` now, which in a plain flex row is "left of the main one"); the
// CONDITION is `spanWorthOffering` in engine/world/multiWeek.ts, read by `multiOffered` below.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { blockingOverlay } from './blockingOverlay'
import { MULTI_WEEK_SPAN, spanWeeksFor, spanWorthOffering } from '../engine/world/multiWeek'
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
   *  quiet week, and only while the engine can actually move time. See `multiOffered`.
   *
   *  ⚠⚠ ROUND 26 #1 MADE IT RARER AGAIN, and the owner's objection to the first pass is the whole
   *  reason this field exists in the shape it does: «Иначе это совершенно дурной элемент управления
   *  получается, с которым пропускается всё». "The engine can move time" is true almost every week
   *  of a career, so it was never a gate at all. His rule is `spanWorthOffering`. */
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
// ⭐ ROUND 28 #6 – 'shoot' JOINS THE QUIET SET, and that is a decision not to change anything. A
// shoot week is «not blocked and not double-charged»: the engine ticks straight through it, so a
// span pill that stood down in front of one would be a refusal nothing enforces – the R10-16
// dead-ish control, and the two-readers-disagreeing failure `multiOffered`'s own note is about.
// Before this round the same week was reported as 'training' and offered the span; it still is.
const QUIET_AHEAD: ReadonlySet<WeekAheadKind> = new Set<WeekAheadKind>(['training', 'shoot', 'exam', 'off-season'])

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
      // ⭐⭐ ROUND 29 #6 – THE NUMBER ON THE BUTTON IS THE WEEK'S, NOT THE CODE'S. It used to be
      // `MULTI_WEEK_SPAN` at both ends, so the label was a fact about the engine's historical step
      // and the owner read four against a slot of six. `multiSpanOf` answers both halves at once
      // (offered at all, and how many) so a press can never buy a different number from the one it
      // promised. `MULTI_WEEK_SPAN` survives as the floor below which a "span" is just the week
      // button – see `multiSpanOf`.
      multi: (() => {
        const weeks = multiSpanOf(snap, kind)
        return weeks === 0 ? null : { weeks, label: `Next ${weeks} weeks` }
      })(),
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
 * ⚠⚠ AND `'offer'` IS DELIBERATELY NOT A SEVENTH CLAUSE, WHICH IS A DECISION AND NOT AN OMISSION.
 * The offer stop HALTS a span and does not REFUSE one: `advanceRefusal` does not name it, so the
 * engine will happily tick the week after a letter lands, and a pill that stood down while paper lay
 * on the table would be a refusal the engine does not have – the two readers disagreeing again, in
 * the direction that produces the R10-16 dead-ish control (a button withheld for a reason nothing
 * enforces). The parent is allowed to let a letter expire; «the window is the feature, not a
 * courtesy» (engine/offers.ts), and `snapshot.offerOpen` is the dot that keeps saying so. Asserted
 * rather than assumed in `tests/r2-13-advance-span.test.ts` block D.
 *
 * ⚠ WHY THE SNAPSHOT AND NOT THE ENGINE. The shell holds a `Snapshot`, never a `WorldState`; this is
 * the same move App.vue's birthday gate makes ("the engine sets it from `pendingBirthday`, the
 * identical predicate `advanceWeeks` blocks on") and its injury gate after it. Re-asking is not
 * re-deriving: no clause below invents a rule the engine does not already enforce.
 *
 * ⚠⚠⚠ AND SINCE ROUND 26 #1 (SECOND PASS) THERE IS A FOURTH CLAUSE, WHICH IS THE OWNER'S AND NOT
 * THE ENGINE'S. The three above are all forms of "the engine cannot use this press", and the owner
 * read the result correctly on his own save: they are true almost every week, so the pill was
 * permanent – «совершенно дурной элемент управления получается, с которым пропускается всё, а еще и
 * прямо под пальцем». `spanWorthOffering` is his replacement rule, and it lives in the ENGINE module
 * rather than here for the reason that module's header gives at length: "is there anything in the
 * next five weeks" is a question both sides of the wire can answer, and this codebase's most
 * expensive recurring defect is two surfaces answering one question their own way. Nothing is
 * re-derived here; the snapshot's own `upcoming` and `injury` are handed straight to it.
 *
 * ⚠⚠ ROUND 30 #3 NARROWED THAT FOURTH CLAUSE TO ITS SECOND ARM, AND IT OVERTURNED A DECISION OF MINE
 * RATHER THAN A BUG. The pill was repaired in round 29 #6 and I recorded that deleting it stayed
 * available; he has now played the repaired version and deleted it: «давай вообще эту кнопку про 6
 * недель уберём. Её можно оставить только на длинные травмы». A quiet FIXTURE LIST is not a quiet
 * stretch – «нам в это время приходят письма и идёт запись на новые турниры» – so the arm that read
 * the calendar is gone and only the long layoff is left. `spanWorthOffering` carries the whole
 * ruling; nothing about the three dead-click clauses above changed.
 */
export function multiOffered(snap: Parameters<typeof blockingOverlay>[0], kind: WeekAheadKind): boolean {
  if (!snap) return false
  if (snap.pending) return false
  if (blockingOverlay(snap) !== null) return false
  if (!QUIET_AHEAD.has(kind)) return false
  // ⚠ THE OWNER'S GATE IS LAST, AND THE ORDER IS NOT COSMETIC: everything above says the press
  // would not WORK, this says it should not be OFFERED. Keeping them in that order is what lets the
  // three dead-click clauses keep their own tests (`r2-13-advance-span.test.ts` block D) without
  // this one having to be satisfied first.
  return spanWorthOffering(snap.week, snap.upcoming, snap.injury)
}

/** ⭐⭐ ROUND 29 #6 – HOW MANY WEEKS THIS PRESS BUYS, or 0 when there is no press to offer.
 *
 *  ⚠⚠ ONE FUNCTION FOR BOTH HALVES, and that is the whole repair. The shipped control asked
 *  `multiOffered` whether to render and then wrote `MULTI_WEEK_SPAN` on itself, so the label and the
 *  week it was standing on were never connected: the owner had a six-week gap at the tail of a
 *  season and the button said four. Now the count is the answer, and the label is built from it.
 *
 *  ⚠ THE FLOOR IS `MULTI_WEEK_SPAN` AND IT IS A FLOOR, NOT THE ANSWER. A slot of one or two weeks is
 *  not a span – it is the week button pressed once or twice – and a pill offering "Next 2 weeks"
 *  beside "Next week" is the dead-ish control R2-13 spends its length avoiding. The floor is the
 *  engine's own historical step because that is the size R2-13 was argued and measured at; it only
 *  ever REMOVES a pill the gate above already allowed, which is the same direction round 26 #1's
 *  rule runs in.
 *
 *  ⚠ AND IT NEVER EXCEEDS WHAT THE SNAPSHOT CAN SEE – `spanWeeksFor` caps at `UPCOMING_WEEKS`, the
 *  clip on `snapshot.upcoming` itself. See that function for why the cap is derived and not picked.
 *
 *  ⚠⚠ ROUND 30 #3 – AND IT NEVER SPENDS THE LAST WEEK OF A LAYOFF, which is why the injury is handed
 *  down. `spanWeeksFor` caps the count at `weeksRemaining - 1` («минус 1 день от длины окна»), so a
 *  six-week layoff offers five and a week is always left inside the window to answer a letter or
 *  enter the tournament she comes back for. Off a layoff it returns 0, so this and `multiOffered`
 *  agree by construction rather than by inspection. */
export function multiSpanOf(snap: Parameters<typeof blockingOverlay>[0], kind: WeekAheadKind): number {
  if (!snap) return 0
  if (!multiOffered(snap, kind)) return 0
  const weeks = spanWeeksFor(snap.week, snap.upcoming, snap.injury)
  return weeks >= MULTI_WEEK_SPAN ? weeks : 0
}
