// Round-8 items R8-6a/R8-6b – the avatar emotion, as one pure decision.
// Round-9 R9-11 adds two softeners to the loss branch:
//  - WIN IMMUNITY: a recent TITLE shields the sad emotion for a while (Regional 1 week,
//    National 2) – a champion licking a first-round wound still reads composed, not crushed;
//  - local-tier losses map to `serious`, never `sad` – a Local Open exit is not a tragedy.
//
// Two layers, in priority order:
//  1. RESULT emotion – the kid's most recent on-court result, but ONLY while it is fresh:
//     a result stays on her face until the NEXT weekly tick (result week === current week).
//     Won → happy. Lost the FINAL → serious (runner-up = 2nd place = a GOOD result – the
//     owner's R8-6a: never sad). Any earlier exit → sad, unless softened per R9-11.
//  2. IDLE emotion – from the following week the face derives from her current state:
//     injured → injury, condition < 40 → tired, < 60 → serious, else norm.
//
// Pure and UI-free so it can be unit-tested and consumed anywhere an avatar emotion is
// picked (the Home card + the Kid screen's big portrait, via useKidEmotion). The app header is
// NOT a consumer since F45-1 – it is age-only and takes the `norm` crop straight from
// `avatarCropPath` below, never from this decision.

import type { TierId } from '../engine/season/types'

/**
 * `angry` is a MEMBER but not yet an OUTCOME: five paintings ship for it and any surface holding
 * an AvatarEmotion can render it, but `avatarEmotion()` below never returns it. That is deliberate
 * – see the note above the result branch. Adding it here is what makes the art reachable at all
 * (scripts/optimize-art.mjs used "not in AvatarEmotion" as its reason to skip encoding it).
 */
export type AvatarEmotion = 'norm' | 'happy' | 'sad' | 'serious' | 'tired' | 'injury' | 'angry'

// --- R9-16: portrait stage by age -------------------------------------------------
// The fem-euro-brunnet art set ships one full painting per stage×emotion; the stage the
// portraits show follows the kid's age (owner: young already from 11-12, teen from 17).
// START_AGE 14 ⇒ a new career OPENS on young-* art – the jun-* placeholder era ends (only the
// onboarding "first time on court" frame stays jun BY DESIGN: it is a narrative flashback).
// `milf` is the fifth and last band, and since the owner's 27.07 call it is REACHED, not just
// painted: a career that runs long enough now ages into its own face instead of freezing at the
// adult art. Every band has full crops, so no band borrows another band's face any more.
export type PortraitStage = 'jun' | 'young' | 'teen' | 'adult' | 'milf'

/** Pure stage resolver – the owner's five bands, 27.07:
 *  `jun <11 · young 11-16 · teen 17-22 · adult 23-30 · milf 31+`.
 *  Owner 25.07: young starts at 11 – the childhood prologue is coming, so the boundary is
 *  deliberately set where the prologue will need it (unreachable before then: START_AGE 14).
 *  `adult` gained an UPPER bound here – it used to swallow every age from 23 up. */
export function portraitStage(ageYears: number): PortraitStage {
  if (ageYears < 11) return 'jun'
  if (ageYears <= 16) return 'young'
  if (ageYears <= 22) return 'teen'
  if (ageYears <= 30) return 'adult'
  return 'milf'
}

/** Where the 256px header/card crop for a stage×emotion lives, relative to the app's BASE_URL.
 *  NO CLAMP. `adult` used to redirect to the teen crops because the adult ones had never been
 *  cut; with the milf band reachable that clamp would have put a 17-year-old's face on a woman of
 *  31, so the missing crops were cut instead (all five bands × seven emotions now exist under
 *  public/avatars/). Kept as one pure function, shared with the emotion-free header (F45-1), so
 *  the two crop surfaces cannot drift apart. */
export function avatarCropPath(stage: PortraitStage, emotion: AvatarEmotion): string {
  return `avatars/${stage}-${emotion}.webp`
}

/** R9-11: how many weeks a TITLE at each tier shields the sad emotion. local titles shield
 *  nothing (losses there are already `serious` at most). Ladder-up: an international title
 *  carries further than a domestic one – a J30 matches national, and the two levels above it
 *  buy an extra week of "nothing can touch me". */
export const WIN_IMMUNITY_WEEKS: Record<TierId, number> = {
  local: 0,
  regional: 1,
  national: 2,
  j30: 2,
  j60: 3,
  j300: 3,
}

/** The kid's most recent played match, as the caller read it off the snapshot's events. */
export interface LastKidResult {
  /** the week the match was played (fresh ⇔ equals the snapshot's current week) */
  week: number
  won: boolean
  /** the loss was the tournament FINAL – runner-up, a good result (R8-6a) */
  lostFinal: boolean
  /** the tier the result happened at (R9-11: local losses are never sad); optional – callers
   *  that cannot resolve it keep the pre-R9-11 behavior */
  tier?: TierId
}

/** R9-11: the kid's most recent TITLE (tournament win), for the win-immunity window. */
export interface LastKidTitle {
  tier: TierId
  /** the week the title was won */
  week: number
}

export interface AvatarEmotionInput {
  /** the snapshot's current week */
  week: number
  /** the kid's condition 0..100 */
  condition: number
  /** true while an injury is active */
  injured: boolean
  /** most recent kid match, or null before any match */
  lastResult: LastKidResult | null
  /** most recent title, or null/absent when she has never won one (R9-11) */
  lastTitle?: LastKidTitle | null
}

/** State-aware idle emotion (R8-6b): what her face settles into once a result has decayed. */
export function idleEmotion(injured: boolean, condition: number): AvatarEmotion {
  if (injured) return 'injury'
  if (condition < 40) return 'tired'
  if (condition < 60) return 'serious'
  return 'norm'
}

/** R9-11: true while a past title still shields the sad emotion – a title won at week W
 *  covers losses through W + WIN_IMMUNITY_WEEKS[tier]. */
function titleShields(week: number, lastTitle: LastKidTitle | null | undefined): boolean {
  if (!lastTitle) return false
  const weeksSince = week - lastTitle.week
  return weeksSince >= 0 && weeksSince <= WIN_IMMUNITY_WEEKS[lastTitle.tier]
}

/**
 * The avatar emotion right now: a fresh (this-week) result wins; otherwise the idle state.
 *
 * WHY `angry` IS NOT RETURNED HERE (27.07). It is a member of AvatarEmotion and its five
 * paintings ship, but no branch below produces it, on purpose:
 *
 *  - The result layer is the obvious home for it, and it is the wrong one. Anger needs a CAUSE –
 *    a robbed line call, a rival's mouth, a match she was supposed to win. `LastKidResult` carries
 *    week / won / lostFinal / tier and nothing else: there is no opponent strength, no seeding, no
 *    scoreline, so every candidate rule ("a first-round exit at j300 is angry") would be a
 *    disappointment rule wearing anger's face. `sad` already covers disappointment.
 *  - It also cuts against the direction the loss branch has been moved TWICE. R8-6a made
 *    runner-up `serious` rather than sad; R9-11 softened local exits and shielded fresh champions.
 *    The kid this model describes gets composed after a loss, not furious.
 *  - The idle layer is a FATIGUE ladder (injury → tired → serious → norm). Anger is not a point
 *    on it, and low condition is already spoken for.
 *
 * So the art is wired and the type is real, and the trigger is left to the owner. The natural
 * hook when the design grows one is the rival system – a rival's taunt or a loss to a named rival
 * is a cause, which is exactly what this input is missing. That needs a new field on
 * AvatarEmotionInput, not a reinterpretation of the ones here.
 */
export function avatarEmotion({ week, condition, injured, lastResult, lastTitle }: AvatarEmotionInput): AvatarEmotion {
  if (lastResult && lastResult.week === week) {
    if (lastResult.won) return 'happy'
    if (lastResult.lostFinal) return 'serious'
    // R9-11 softeners: a Local Open exit is never a tragedy, and a fresh Regional/National
    // champion is still riding the win – both read `serious`, not `sad`.
    if (lastResult.tier === 'local') return 'serious'
    if (titleShields(week, lastTitle)) return 'serious'
    return 'sad'
  }
  return idleEmotion(injured, condition)
}
