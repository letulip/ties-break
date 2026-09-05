// THE DAYS CROSS THEMSELVES OUT – the owner's «простую анимацию вычеркивания дней».
//
// His whole description, because every clause of it is a decision below: a gentle animation of the
// days of the week being crossed out one by one; it runs through, or PAUSES on a match / an injury /
// a knock and then continues; and it ends on the end-of-week screen.
//
// -------------------------------------------------------------------------------------------------
// WHAT THIS FILE IS, AND WHAT IT IS NOT
// -------------------------------------------------------------------------------------------------
// It is the SCHEDULE and the PREFERENCE. The drawing is seven spans and a transition in
// CalendarScreen.vue; the week is still advanced by the shell's one handler. Splitting it this way is
// not tidiness: a timeline expressed as numbers can be pinned by a test without a clock, and "how long
// does the sweep take" is exactly the kind of number the owner is going to want to move by eye.
//
// -------------------------------------------------------------------------------------------------
// ⚠ IT PAUSES ONLY ON FACTS THAT ARE ALREADY TRUE
// -------------------------------------------------------------------------------------------------
// The days are struck out on the way INTO a week – the advance fires when the sweep finishes – so the
// three beats it can hold on are the three the snapshot already knows: a booked practice match, a live
// injury layoff, and a live knock. `composables/weekDays.ts` derives them (see `DayBeat` there); this
// file only asks how long to wait. An animation that paused on "she got hurt on Thursday" would be the
// screen inventing a week the sim has not resolved yet.
//
// -------------------------------------------------------------------------------------------------
// THE TWO PACES, AND WHY BOTH SHIP
// -------------------------------------------------------------------------------------------------
// The owner asked for a ~2s and a ~5s variant behind one named constant so he can pick by eye, so both
// are here and the choice is a live setting rather than a rebuild. `brisk` is the DEFAULT, and the
// reason is arithmetic rather than taste: this sweep sits in front of the one action a player performs
// fifty-two times a season, so at the gentle pace a single season spends about four minutes watching
// days being struck out. Two seconds reads as a beat; five reads as a gate. The gentle pace is one tap
// away for anyone who wants the ceremony, and the whole thing is one tap away from OFF.
//
// -------------------------------------------------------------------------------------------------
// THE PREFERENCE IS `localStorage`, NOT A SAVE FIELD – the `weekRecap.ts` idiom, deliberately copied
// -------------------------------------------------------------------------------------------------
// The same three arguments that file makes, and they are just as true here:
//  1. IT IS NOT A FACT ABOUT THE CAREER. Every field in the save is something that happened to her.
//     This is a fact about the person holding the phone, and it would be wrong the moment he started a
//     second career.
//  2. IT WOULD COST A SCHEMA BUMP AND A MIGRATION for a boolean the engine never reads.
//  3. THE APP ALREADY HAS FOUR OF EXACTLY THIS - sound, music, haptics and the week story - each a
//     plain localStorage flag behind pure functions, on its own key, working before any career loads.
//     This is the fifth, and copying their shape is what makes it obvious to the next reader.
// DEFAULT ON, like the other four: the absence of the key means the days cross themselves out.

import { prefersReducedMotion } from './reducedMotion'

/** Which of the two paces. Both ship; the owner picks by eye (see the note above). */
export type DayCrossPaceId = 'brisk' | 'gentle'

export interface DayCrossPace {
  /** The whole sweep across the seven days on a week with nothing in it. THE named constant. */
  sweepMs: number
  /** How much longer the sweep waits after striking out a day that carries a beat. A pause ADDS time
   *  rather than borrowing it from the other days: "it pauses and then continues" is what he asked
   *  for, and a sweep that sped up to make room for its own pauses would not read as a pause at all. */
  holdMs: number
}

/** THE DURATION, AS ONE CONSTANT WITH TWO SETTINGS. `brisk` is the default – see the note above.
 *  The holds are ~1/5 of the sweep in both, so a pause is legible at either pace without either
 *  turning into a stop. */
export const DAY_CROSS_PACE: Record<DayCrossPaceId, DayCrossPace> = {
  // ⚠ 2000 -> 3000 (owner, 31.07, after playing): «настройка Pace в 2 секунды выглядит ну слишком
  // быстро, давай сделаем хотя бы 3 так будет оптимально и прочитать и прочувствовать».
  //
  // The note above argued 2s from arithmetic - fifty-two sweeps a season, so the gentle pace spends
  // about four minutes a season on it - and that arithmetic is still right about the CEILING. What
  // it got wrong is the floor: it optimised for the cost of the animation and never asked whether
  // the animation had time to be READ. Seven days are struck out in that window, one of which may
  // hold a beat; at 2s a day gets under 300ms, which is a flicker rather than a moment. 3s buys
  // ~430ms a day and costs 52 seconds a season. `gentle` stays at 5 for whoever wants it slower,
  // which is the owner's own framing: «5 оставим для тех, кто любит по-медленнее».
  brisk: { sweepMs: 3000, holdMs: 620 },
  gentle: { sweepMs: 5000, holdMs: 900 },
}

export const DAY_CROSS_PACE_LABEL: Record<DayCrossPaceId, string> = {
  brisk: 'Brisk 3s',
  gentle: 'Gentle 5s',
}

/** The paces in the order a picker shows them. */
export const DAY_CROSS_PACES: readonly DayCrossPaceId[] = ['brisk', 'gentle']

export interface DayCrossSchedule {
  /** `at[i]` = when day `i` is struck out, in ms from the press. Strictly increasing. */
  at: number[]
  /** when the week is over and the advance fires */
  total: number
  /** the transition each stroke is drawn over – one step, so a line finishes as the next one starts */
  strokeMs: number
}

/** THE WHOLE TIMELINE, AS NUMBERS. Pure, so the pace is a thing a test can hold to account instead of
 *  a thing that has to be watched. `beats[i]` is "day i carries one of the three beats".
 *
 *  The hold falls AFTER the day it belongs to is struck out, which is the beat the owner described: the
 *  line goes through Saturday, the sweep waits on it, and then it carries on. */
export function dayCrossSchedule(beats: readonly boolean[], pace: DayCrossPace): DayCrossSchedule {
  const step = beats.length > 0 ? pace.sweepMs / beats.length : 0
  const at: number[] = []
  let t = 0
  for (let i = 0; i < beats.length; i++) {
    t += step
    at.push(Math.round(t))
    if (beats[i]) t += pace.holdMs
  }
  return { at, total: Math.round(t), strokeMs: Math.round(step) }
}

// -------------------------------------------------------------------------------------------------
// The preference pair, in the shape sfx / music / haptics / the week story all share.
// -------------------------------------------------------------------------------------------------

const OFF_KEY = 'tb-day-cross-off'
const PACE_KEY = 'tb-day-cross-pace'

function readOff(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === '1'
  } catch {
    return false // storage unavailable (private mode, tests, ...) – default to ON
  }
}

function readPace(): DayCrossPaceId {
  try {
    return localStorage.getItem(PACE_KEY) === 'gentle' ? 'gentle' : 'brisk'
  } catch {
    return 'brisk'
  }
}

let off = readOff()
let paceId = readPace()

/** Has the player turned the sweep off? With it off the press advances the week immediately – exactly
 *  what it did before this slice, which is the whole promise of the switch. */
export function isDayCrossOff(): boolean {
  return off
}

export function setDayCrossOff(value: boolean): void {
  off = value
  try {
    localStorage.setItem(OFF_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable – the switch still works for this session, it just will not persist
  }
}

export function dayCrossPace(): DayCrossPaceId {
  return paceId
}

export function setDayCrossPace(value: DayCrossPaceId): void {
  paceId = value
  try {
    localStorage.setItem(PACE_KEY, value)
  } catch {
    // as above
  }
}

/* ⚠ THE SYSTEM PREFERENCE OUTRANKS BOTH, and it is not a nicety: an animation is the one thing an OS
   accessibility switch is explicitly about. `prefers-reduced-motion: reduce` means the sweep does not
   run at all – the week advances the moment the button is pressed – and the CSS drops the transitions
   as well, so nothing can crawl in through a stale class. The app already honours this switch on the
   Coach Market's toggle; this is the second consumer.

   ⭐ U-05 – `prefersReducedMotion` WAS DEFINED HERE and is `composables/reducedMotion.ts`'s now. This
   file's guarded spelling is the one that moved (see that module for why it is the survivor of the
   five); what changed here is only where it is written. Its five callers were five spellings. */

/** Should the days cross themselves out at all, for this press? Composed here, next to the two flags
 *  it reads, so the screen asks one question and the answer cannot be assembled two ways – the reason
 *  `storyOpensItself` exists in composables/weekRecap.ts rather than at App.vue's watcher.
 *
 *  `animates` is the WEEK's own half of it (a tournament trip has its own flow and its own screens, so
 *  there is nothing for a sweep to narrate) and comes off `calendarWeekFor`. */
export function dayCrossRuns(animates: boolean): boolean {
  return animates && !isDayCrossOff() && !prefersReducedMotion()
}
