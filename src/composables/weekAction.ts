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
}

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
    if (snap?.pending) return { kind, label, mode: 'resume', disabled: game.busy, blockedNote: null }
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
      }
    }
    return {
      kind,
      label,
      mode: kind === 'practice' ? 'practice' : 'advance',
      disabled: game.busy || !snap,
      blockedNote: null,
    }
  })
}
