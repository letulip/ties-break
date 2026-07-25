// Round-8 items R8-6a/R8-6b – the avatar emotion, as one pure decision.
//
// Two layers, in priority order:
//  1. RESULT emotion – the kid's most recent on-court result, but ONLY while it is fresh:
//     a result stays on her face until the NEXT weekly tick (result week === current week).
//     Won → happy. Lost the FINAL → serious (runner-up = 2nd place = a GOOD result – the
//     owner's R8-6a: never sad). Any earlier exit → sad.
//  2. IDLE emotion – from the following week the face derives from her current state:
//     injured → injury, condition < 40 → tired, < 60 → serious, else norm.
//
// Pure and UI-free so it can be unit-tested and consumed anywhere an avatar emotion is
// picked (today: App.vue's header avatar; the stage-by-age portrait slice will reuse it).

export type AvatarEmotion = 'norm' | 'happy' | 'sad' | 'serious' | 'tired' | 'injury'

/** The kid's most recent played match, as the caller read it off the snapshot's events. */
export interface LastKidResult {
  /** the week the match was played (fresh ⇔ equals the snapshot's current week) */
  week: number
  won: boolean
  /** the loss was the tournament FINAL – runner-up, a good result (R8-6a) */
  lostFinal: boolean
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
}

/** State-aware idle emotion (R8-6b): what her face settles into once a result has decayed. */
export function idleEmotion(injured: boolean, condition: number): AvatarEmotion {
  if (injured) return 'injury'
  if (condition < 40) return 'tired'
  if (condition < 60) return 'serious'
  return 'norm'
}

/** The avatar emotion right now: a fresh (this-week) result wins; otherwise the idle state. */
export function avatarEmotion({ week, condition, injured, lastResult }: AvatarEmotionInput): AvatarEmotion {
  if (lastResult && lastResult.week === week) {
    if (lastResult.won) return 'happy'
    return lastResult.lostFinal ? 'serious' : 'sad'
  }
  return idleEmotion(injured, condition)
}
