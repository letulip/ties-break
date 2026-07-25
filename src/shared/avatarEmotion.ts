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
// picked (App.vue's header avatar + the Home/Kid big portraits via useKidEmotion).

import type { TierId } from '../engine/season/types'

export type AvatarEmotion = 'norm' | 'happy' | 'sad' | 'serious' | 'tired' | 'injury'

// --- R9-16: portrait stage by age -------------------------------------------------
// The fem-euro-brunnet art set ships one full painting per stage×emotion; the stage the
// portraits show follows the kid's age (owner: young already from 11-12, teen from 17;
// adult/milf are later-life content). START_AGE 14 ⇒ a new career OPENS on young-* art –
// the jun-* placeholder era ends (only the onboarding "first time on court" frame stays
// jun BY DESIGN: it is a narrative flashback).
export type PortraitStage = 'jun' | 'young' | 'teen' | 'adult'

/** Pure stage resolver: jun < 12, young 12-16, teen 17-22, adult beyond (later content). */
export function portraitStage(ageYears: number): PortraitStage {
  if (ageYears < 12) return 'jun'
  if (ageYears <= 16) return 'young'
  if (ageYears <= 22) return 'teen'
  return 'adult'
}

/** R9-11: how many weeks a TITLE at each tier shields the sad emotion. local titles shield
 *  nothing (losses there are already `serious` at most); itf mirrors national – the tier is
 *  locked in Phase 3, so the value is a placeholder until ITF unlocks. */
export const WIN_IMMUNITY_WEEKS: Record<TierId, number> = {
  local: 0,
  regional: 1,
  national: 2,
  itf: 2,
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

/** The avatar emotion right now: a fresh (this-week) result wins; otherwise the idle state. */
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
