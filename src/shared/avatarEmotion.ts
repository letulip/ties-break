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
import type { LossStreak, WorldEvent } from './protocol'

/** Every face the game can put on her. `angry` became a real OUTCOME in fix/world-trio (owner's
 *  call: a run of losses); before that it was a member with art and no branch that returned it. */
export type AvatarEmotion = 'norm' | 'happy' | 'sad' | 'serious' | 'tired' | 'injury' | 'angry'

/**
 * R11-2 – which recorded matches are allowed to change her FACE. The owner: «на practice match
 * вообще не вижу смысла менять аватарку на выигрыш или проигравшую – на турнирах да, локальные,
 * региональные, национальные да, а на тренировочных не вижу смысла.»
 *
 * A booked friendly is stored as an ordinary `match` event with `friendly: true` (world.ts
 * resolvePractice) – the same shape a tournament round has – so the result layer picked it up and
 * she came home from a hit-out at the club looking crushed. A practice match now leaves her face
 * alone: she falls back to the IDLE emotion, exactly as on any week she did not compete.
 *
 * THE ONE PREDICATE, and it lives HERE (moved out of composables/kidEmotion.ts by fix/world-trio)
 * because it now has two callers on opposite sides of the engine/UI line: the composable's
 * "what is her latest result" walk, and the engine's consecutive-loss streak. A friendly that did
 * not count as a RESULT must not count as a LOSS either, and one predicate is the only way those
 * two can be guaranteed to agree. `composables/kidEmotion.ts` re-exports it, so the surfaces that
 * already import it from there are unaffected.
 */
export function resultShowsOnHerFace(e: WorldEvent): boolean {
  return !!e.match && !e.friendly
}

/** The band the per-streak anger threshold is drawn from, inclusive (fix/world-trio item 3).
 *
 *  The owner asked for a threshold that is NOT a fixed number the player can count to: «злится
 *  после серии поражений», with the exact length varying. So each streak draws its own from 4..6.
 *  Four is the floor because three losses is an ordinary bad month for a junior – the emotion has
 *  to mean something rarer than that; six is the ceiling because a run that long is already
 *  career-shaking and waiting longer would make the face unreachable in practice.
 *
 *  The DRAW is the engine's (it owns the seed and the RNG discipline: a purpose-scoped sub-stream
 *  keyed on the streak's start week, never the MAIN weekly stream); these bounds live here, next to
 *  the decision that compares against them, so the rule reads in one place. */
export const ANGER_STREAK_MIN = 4
export const ANGER_STREAK_MAX = 6

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
  /** her current run of consecutive competitive losses + the threshold this run turns angry at,
   *  as the ENGINE computed it (Snapshot.lossStreak). Optional/null: callers that cannot supply it
   *  keep the pre-anger behavior exactly. This function does no counting and no drawing of its own –
   *  it compares two numbers, which is what keeps it pure and keeps her face from flickering. */
  lossStreak?: LossStreak | null
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
 * WHERE `angry` SITS – the ordering, and why it is LAST (fix/world-trio item 3).
 *
 * The old note here argued angry had no home, because a single result carries no CAUSE: week /
 * won / lostFinal / tier says nothing about a robbed call or a match she should have won, so any
 * one-result rule would be a disappointment rule wearing anger's face. That objection is answered
 * rather than overruled – the cause is not IN the result, it is the SHAPE OF SEVERAL of them. Four
 * to six straight defeats is a fact no single match can express and no player can mistake for bad
 * luck, and it is the engine (not this function) that observes it.
 *
 * The branch order below is therefore: every existing SOFTENER first, anger only where the model
 * would already have said `sad`.
 *
 *   won                 -> happy      a win ends the streak; nothing here can override it
 *   lostFinal           -> serious    R8-6a: runner-up is 2nd place, a GOOD result
 *   tier === 'local'    -> serious    R9-11: a Local Open exit is not a tragedy
 *   a fresh title       -> serious    R9-11: a champion licking a wound still reads composed
 *   streak === angerAt  -> ANGRY      the CROSSING loss only – see R12-16 below
 *   otherwise           -> sad
 *
 * R12-16 – ANGER IS A MOMENT, NOT A MASK (owner playtest 27.07: "once the streak crossed, she was
 * angry on every single loss after it"). The comparison here was `losses >= angerAt`, which is true
 * for the crossing loss AND for every loss that follows it in the same run – so the fifth defeat
 * put the face on and the sixth, seventh and eighth never took it off. The design intent was a
 * mood: the loss that finally breaks her composure. It is now `===`, so:
 *
 *   losses <  angerAt   -> sad        the run has not broken her yet
 *   losses === angerAt  -> ANGRY      THE loss that did – shown for the week it happened
 *   losses >  angerAt   -> sad        she is past furious and back to hurting
 *
 * A NEW streak draws its OWN threshold, because the draw is keyed on the streak's start week
 * (engine/world.ts computeLossStreak) – so a win, then another bad run, can make her angry again at
 * a different length. The per-streak stability that keeps her face from flickering is untouched:
 * within one streak `angerAt` is still drawn exactly once, and `===` is still a comparison of two
 * numbers this function was handed.
 *
 * That ordering is the point, not an implementation detail. The loss branch has been softened
 * TWICE deliberately (R8-6a, R9-11) and anger must not quietly undo either: a runner-up finish
 * still reads composed even if it is her fifth straight loss, and a reigning champion is still
 * shielded. Anger INTENSIFIES the sad outcome; it does not outrank the reasons not to be sad.
 *
 * The idle layer is untouched. It is a FATIGUE ladder (injury -> tired -> serious -> norm) and
 * anger is not a point on it; a result emotion also decays at the next weekly tick, so her anger
 * lasts exactly the week she earned it and then her state takes over, like every other result.
 */
export function avatarEmotion({
  week,
  condition,
  injured,
  lastResult,
  lastTitle,
  lossStreak,
}: AvatarEmotionInput): AvatarEmotion {
  if (lastResult && lastResult.week === week) {
    if (lastResult.won) return 'happy'
    if (lastResult.lostFinal) return 'serious'
    // R9-11 softeners: a Local Open exit is never a tragedy, and a fresh Regional/National
    // champion is still riding the win – both read `serious`, not `sad`.
    if (lastResult.tier === 'local') return 'serious'
    if (titleShields(week, lastTitle)) return 'serious'
    // ...and only here, under every softener: the ONE loss that broke her (R12-16 – `===`, never
    // `>=`; see the ordering note above). A comparison, never a count and never a draw – the engine
    // did both, once per streak, so this cannot return a different face for the same screen twice.
    if (lossStreak && lossStreak.losses === lossStreak.angerAt) return 'angry'
    return 'sad'
  }
  return idleEmotion(injured, condition)
}
