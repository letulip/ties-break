// THE DIARY'S SHARED VOCABULARY: the small word helpers and the travel predicates that all three
// phrase pools ask about.
//
// ⚠ WHY THIS FILE EXISTS, and it is the same shape as world/ladder.ts. The three pools - the photo
// line, the travel scrap and the ordinary-week note - each declared some of these and borrowed the
// rest from a sibling: DIARY_POOL needed `capitalise`/`ageWord` (declared down in the week notes)
// and `asleep`/`ordinary`/`road` (declared in the travel notes), while the week notes needed
// `asleep` back. Measured, that is 5 / 1 / 1 callbacks between three blocks that each want to be a
// file. Lifting the shared words into a leaf turns all three into 0 and makes the pools independent.
//
// ⚠ DEPENDENCY DIRECTION. Bottom of the diary package alongside facts.ts: types only, no engine
// state, no RNG.
import type { TierId } from '../season/types'
import { TIER_SHORT } from '../season/calendar'
import type { DiaryFacts } from '../../shared/protocol'
import type { TravelHomeFacts } from './travelHome'

// ---- short + plural ----
/** Short tier name for the diary's voice, total over null ("the J30 trip" / "the tournament trip"). */
export function short(tier: TierId | null): string {
  return tier ? TIER_SHORT[tier] : 'tournament'
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ---- justHurt + quiet ----

/** THE WEEK IT HAPPENED (R14-1). Nothing has been ticked off the layoff yet – `rollInjury` sets
 *  `weeksRemaining = totalWeeks` at onset and decrements at the TOP of every later week, so this is
 *  true on the onset week and on no other, a one-week injury included.
 *
 *  It exists because the split the owner asked for on her FACE has to hold in her PARENT'S VOICE
 *  too: `idleEmotion` no longer returns `injury` at all, so a licence reading `emotion === 'injury'`
 *  would be dead copy – but the lines it used to carry are not interchangeable. One of them is
 *  about the day the ice pack came out; the others are about week six. Derived from facts the diary
 *  already carries, so no new field and no schema question. */
export const justHurt = (f: DiaryFacts): boolean =>
  f.injured !== null && f.injured.weeksRemaining === f.injured.totalWeeks

/** An ordinary, healthy, event-free week – the licence behind every quiet line AND the silences. */
export const quiet = (f: DiaryFacts): boolean =>
  !f.resultFresh &&
  f.injured === null &&
  !f.travelled &&
  !f.playedTournament &&
  !f.playedPractice &&
  !f.examsWeek &&
  !f.offSeasonWeek &&
  !f.vacationWeek

// ---- the travel predicates ----
/** ⚠ W5: THE SCENE, NOT THE TIER. This was `!t.abroad` – true while `track` decided the transport,
 *  false the moment the owner's tier gate let a National fly home and a J30 come back on a bus. The
 *  note is the CAPTION of the picture above it, so "we were out of the car park" has to be licensed
 *  by there being a car in the frame, and nothing else. */
export const road = (t: TravelHomeFacts): boolean => t.scene === 'bus' || t.scene === 'car'
/** ...and its other half, for the lines that name a gate, a flight or a landing. */
export const air = (t: TravelHomeFacts): boolean => t.scene === 'airport' || t.scene === 'plane'
/** ...and the narrow half of the road, for the lines that name the family car. See the `car` claim. */
export const inCar = (t: TravelHomeFacts): boolean => t.scene === 'car'
/** A journey with hours in it – every rung above the Local Open. See the `longWay` claim. */
export const longWay = (t: TravelHomeFacts): boolean => t.tier !== 'local'
/** ...and its complement: the club two towns over, which W5 made a journey at all. */
export const shortHop = (t: TravelHomeFacts): boolean => t.tier === 'local'
export const asleep = (t: TravelHomeFacts): boolean => t.mood === 'sleepy'
export const awake = (t: TravelHomeFacts): boolean => t.mood !== 'sleepy'
/** Everything below the injury and the first passport, which take a week to themselves. */
export const ordinary = (t: TravelHomeFacts): boolean => !t.injured && !t.firstAbroad
/** She lost, and the loss was not the final – the ordinary weeks the junior road is mostly made of. */
export const plainLoss = (t: TravelHomeFacts): boolean => ordinary(t) && !t.reachedFinal

// ---- AGE_WORD + ageWord + capitalise ----
/** The age she turns, in words. A parent's register, not a scoreboard's - and total on any number a
 *  career can reach, falling back to the numeral past the years that read naturally as words. */
export const AGE_WORD: Record<number, string> = {
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
}
export const ageWord = (age: number | null): string => (age === null ? 'a year older' : (AGE_WORD[age] ?? String(age)))
export const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
