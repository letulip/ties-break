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
// Deliberately NOT a branch here: the injury layoff. `injury.weeksRemaining` is measured against the
// return week (`week + weeksRemaining`), so "is she still out NEXT week" is `weeksRemaining > 1` –
// an off-by-one that is being actively reworked in the r10/fix injury pass (R10-17). A wrong recovery
// label would read as a bug, so the button stays on the five week types that are stable state.
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

export type WeekAheadKind = 'tournament' | 'vacation' | 'practice' | 'exam' | 'off-season' | 'training'

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
    const entered = snap.upcoming.find((e) => e.entered && e.week === next)
    if (entered) return { kind: 'tournament', label: `🏆 Play ${TIER_SHORT[entered.tier]} ▶` }
    if (snap.vacations.some((v) => v.week === next)) return { kind: 'vacation', label: '🏖️ Leave on vacation ▶' }
    if (snap.practices.some((p) => p.week === next)) return { kind: 'practice', label: '🎾 Practice match ▶' }
    if (isExamWeek(next)) return { kind: 'exam', label: '📚 Exam week ▶' }
    if (isOffSeasonWeek(next)) return { kind: 'off-season', label: '🌴 Off-season week ▶' }
    return TRAINING
  })
}
