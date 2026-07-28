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
import { isExamWeek, isOffSeasonWeek } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'

/** Short tier names for width-starved UI (this button, the Home season strip). `TIERS[id].label`
 *  is the full "Regional Championship" – no 375px button carries that. */
export const TIER_SHORT: Record<TierId, string> = {
  local: 'Local',
  regional: 'Regional',
  national: 'National',
  j30: 'J30',
  j60: 'J60',
  j300: 'J300',
}

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
  /** the button's whole label, leading glyph included. Player copy: short dash, no Cyrillic. */
  label: string
}

// U+FE0F on 🏋️ / 🏖️ – both codepoints default to TEXT presentation, so without the selector they can
// render as a flat mono glyph next to the emoji-presentation 🏆/🎾/📚/🌴.
const TRAINING: WeekAhead = { kind: 'training', label: '🏋️ Training week ▶' }

/** The plan for `snapshot.week + 1`, as a button label. Precedence is "most committed first": a
 *  tournament she paid to enter outranks a booked week, which outranks the calendar's own defaults. */
export function useWeekAhead(): ComputedRef<WeekAhead> {
  const game = useGameStore()
  return computed<WeekAhead>(() => {
    const snap = game.snapshot
    if (!snap) return TRAINING
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
      if (arrival.verdict === 'injured') return { kind: 'walkover', label: '🩹 Injured – walkover ▶' }
      // A committed entry to a tier she has since outgrown still PLAYS (R10-3: the list closed with
      // her on it). It is not a block and the button is not disabled – but the parent should know
      // which week she is spending.
      if (arrival.outgrown) return { kind: 'tournament', label: `🏆 ${tier} (outgrown) ▶` }
      return { kind: 'tournament', label: `🏆 Play ${tier} ▶` }
    }
    if (snap.vacations.some((v) => v.week === next)) return { kind: 'vacation', label: '🏖️ Leave on vacation ▶' }
    if (snap.practices.some((p) => p.week === next)) return { kind: 'practice', label: '🎾 Practice match ▶' }
    if (isExamWeek(next)) return { kind: 'exam', label: '📚 Exam week ▶' }
    if (isOffSeasonWeek(next)) return { kind: 'off-season', label: '🌴 Off-season week ▶' }
    return TRAINING
  })
}
