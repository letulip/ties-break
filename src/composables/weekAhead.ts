// R10-7: what the week AHEAD actually holds, as one player-facing button label.
//
// The sticky bar used to say a flat "Next week ▶", which told the parent nothing about the decision
// she had already made for that week. This derives the label from the Snapshot the UI already has –
// an entered tournament, a booked family week, a booked practice match, school exams, the off-season,
// or an ordinary training week. NOTHING was added to the engine or the snapshot payload.
//
// WHICH WEEK. `advance(1)` runs `tickWeek`, which increments `world.week` FIRST and only then
// resolves – so the week the button plays is `snapshot.week + 1`, never the already-resolved
// `snapshot.week`. Every lookup below is against `week + 1`.
//
// R12-15 / R12-3 – THE BUTTON STOPPED GUESSING. This file used to answer the tournament case with
// one fact – "is there an entered event on week + 1?" – and print "🏆 Play {TIER} ▶" whatever her
// body or her ranking points had done since. The comment that stood here said the injury layoff was
// "deliberately NOT a branch", on the grounds that `weeksRemaining` was mid-rework and a wrong
// recovery label would read as a bug. R10-17 finished that rework; the off-by-one is settled, and
// the engine now hands the answer over ready-made.
//
// So the tournament branch reads `snapshot.arrival` – the ENGINE's own arrival verdict for that
// event, the same one `tickWeek` will resolve the week with (engine/world.ts arrivalStatus). The
// button can no longer promise a tournament the engine has already decided is a walkover, and it
// names a committed entry to an outgrown tier for what it is. Nothing is DISABLED: advancing time
// must always be possible (a week the player cannot leave is the R10-3 dead end), so the button
// still acts – it just stops lying about what the act will produce, which is the other half of the
// R10-16 doctrine.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { isExamWeek, isOffSeasonWeek, TIER_SHORT } from '../engine/season/calendar'

/** Short tier names for width-starved UI (this button, the Home season strip). THE TABLE MOVED to
 *  engine/season/calendar.ts (Diary-1): the diary's copy system speaks the same short names, and
 *  one table on the engine side is the only way the button and the phrase can never disagree.
 *  Re-exported here unchanged, so every existing import path keeps working. */
export { TIER_SHORT }

export type WeekAheadKind =
  | 'tournament'
  | 'walkover'
  | 'vacation'
  | 'practice'
  | 'exam'
  | 'off-season'
  | 'training'

export interface WeekAhead {
  kind: WeekAheadKind
  /** the button's whole label. Player copy: short dash, no Cyrillic.
   *
   *  A3 (owner, 28.07): NO EMOJI, NO TRAILING ARROW. The redesign's buttons are the export's CTAs -
   *  a lime pill with one plain word on it, like "+ Plan week" and "Start Match" - and a row of
   *  emoji was the loudest thing left on the page. The `kind` still carries the same meaning for
   *  anything that wants to colour or branch on it; only the picture went. */
  label: string
}

const TRAINING: WeekAhead = { kind: 'training', label: 'Training week' }

/**
 * IS THE WEEK AHEAD ONE THE CALENDAR IS ABOUT? (owner, 30.07: the Calendar tab is «активной при
 * нетурнирных неделях» - and the second reading of that is the one he meant: not DISABLED on tournament
 * weeks, but the tab you LAND on when the week ahead is not one.)
 *
 * ⚠ 'walkover' COUNTS AS A TOURNAMENT WEEK, and that is the one non-obvious member. She is entered and
 * injured, so the week belongs to the withdrawal and its popup, not to a grid of training days she is not
 * going to do.
 *
 * A vacation, an exam fortnight and the off-season all count as calendar weeks: nothing is going to be
 * played, and what the week IS is exactly what the calendar draws.
 */
export function calendarOwnsWeekAhead(kind: WeekAheadKind): boolean {
  return kind !== 'tournament' && kind !== 'walkover'
}

/** The plan for `snapshot.week + 1`, as a button label. Precedence is "most committed first": a
 *  tournament she paid to enter outranks a booked week, which outranks the calendar's own defaults. */
export function useWeekAhead(): ComputedRef<WeekAhead> {
  const game = useGameStore()
  return computed<WeekAhead>(() => {
    const snap = game.snapshot
    if (!snap) return TRAINING
    // R13-8 – A PAUSED TOURNAMENT OWNS THE BUTTON, first and before every week-ahead lookup. While
    // a reveal is pending (the player backed out of the overlay), THIS week is not resolved: the
    // label must keep saying what the click will do – play the championship – instead of moving on
    // to next week's plan while a tiny banner holds the truth. App.vue routes the click back into
    // the overlay in this state; time cannot tick past a pending reveal anyway (advanceWeeks
    // returns 'tournament' without a tick), so any other label here would be a lie twice over.
    if (snap.pending) return { kind: 'tournament', label: `Play ${TIER_SHORT[snap.pending.tier]}` }
    const next = snap.week + 1
    // The entered-tournament case, answered by the ENGINE (see the header note). `arrival` is
    // non-null exactly when an entry sits on `next`, so it replaces the old `upcoming` lookup
    // outright rather than second-guessing it.
    const arrival = snap.arrival
    if (arrival) {
      const tier = TIER_SHORT[arrival.tier]
      // She is still inside her layoff when it comes round: the fee is already committed and the
      // week WILL resolve as a walkover. Say so on the button that is about to spend it, instead of
      // sending her to a tournament that does not happen. The TIER is dropped from this label and
      // the one below on purpose – .next-week-btn ellipsises at 375px and the labels here have to
      // stay inside the ~22-character budget the vacation label already proves fits (style.css).
      if (arrival.verdict === 'injured') return { kind: 'walkover', label: 'Injured – walkover' }
      // A committed entry to a tier she has since outgrown still PLAYS (R10-3: the list closed with
      // her on it). It is not a block and the button is not disabled – but the parent should know
      // which week she is spending.
      if (arrival.outgrown) return { kind: 'tournament', label: `${tier} (outgrown)` }
      return { kind: 'tournament', label: `Play ${tier}` }
    }
    if (snap.vacations.some((v) => v.week === next)) return { kind: 'vacation', label: 'Leave on vacation' }
    if (snap.practices.some((p) => p.week === next)) return { kind: 'practice', label: 'Practice match' }
    // W4-SCHOOL: the NEXT week's own answer – she may leave school between this week and it.
    if (isExamWeek(next, snap.schoolEndsWeek !== undefined && next >= snap.schoolEndsWeek)) {
      return { kind: 'exam', label: 'Exam week' }
    }
    if (isOffSeasonWeek(next)) return { kind: 'off-season', label: 'Off-season week' }
    return TRAINING
  })
}
