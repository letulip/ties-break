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
import type { DiaryFacts, DiaryLifeStage } from '../../shared/protocol'
import type { TravelHomeFacts } from './travelHome'

// ---- short + plural ----
/** Short tier name for the diary's voice, total over null ("the J30 trip" / "the tournament trip"). */
export function short(tier: TierId | null): string {
  return tier ? TIER_SHORT[tier] : 'tournament'
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ---- THE LIFE-STAGE VOICE PREDICATES: ONE FUNCTION PER QUESTION, FOR ALL THREE POOLS ----
//
// ⚠ R2-18 / ARCH-07. The same "family home vs independent" test was written out three times – in
// pool.ts, in weekNotes.ts and (against the travel facts) in travelNotes.ts – so three editorial
// tables each owned a copy of one age rule, and the day the rule gains a stage they disagree. There
// is one copy now, and it is here because this file already IS "the shared vocabulary all three
// phrase pools ask about".
//
// ⚠ THE PARAMETER IS STRUCTURAL, WHICH IS WHY ONE FUNCTION CAN SERVE BOTH FACT SHAPES. `DiaryFacts`
// and `TravelHomeFacts` are different objects with different lives; both carry `lifeStage`, and the
// question "how close is the parent to her ordinary week" is about that field and nothing else. So
// the pools stop having a travel version and a week version of one sentence.
//
// ⚠⚠ AND THE THIRD ONE IS THE ONE THAT WAS MISSING, WHICH IS THE POINT OF THE ITEM. `athome`
// (weekNotes) means "no tournament and no journey"; it has never meant "she is in our house", and
// the review found adult lines licensing household observation from that travel fact. `underOneRoof`
// is the stage question that DOES license it, stated once, so a line about the hall mirror asks for
// it explicitly instead of inheriting it from a week she merely did not fly anywhere.
interface HasLifeStage {
  lifeStage: DiaryLifeStage
}

/** She is at the family home: still at school, or out of it and not yet independent. The parent
 *  shares the ordinary day with her and may write about it from inside the house. */
export const familyHomeVoice = (f: HasLifeStage): boolean =>
  f.lifeStage === 'school' || f.lifeStage === 'after-school'

/** Twenty-two and up, living her own life. The parent hears about the week rather than watching it. */
export const independentVoice = (f: HasLifeStage): boolean => f.lifeStage === 'independent'

/** She is away at college – a stage of its own, and NOT the family home. Named because the copy kept
 *  treating it as "still at home with a timetable", which is what put a kitchen-table gift in front
 *  of a girl in a dorm four birthdays running. */
export const collegeVoice = (f: HasLifeStage): boolean => f.lifeStage === 'college'

/** ⚠⚠ THE KNOWLEDGE LICENCE. "The parent can see this because they are in the same house" – the only
 *  stages that entitle a line to describe her day at close range: the hall mirror, the ice pack in
 *  front of the television, her counting reps out loud, the floor she has stopped picking things up
 *  off. It is `familyHomeVoice` today and it is deliberately a SEPARATE NAME rather than an alias
 *  used directly, because the two are different claims that happen to coincide: one is "which voice
 *  does the parent write in", the other is "what may the parent claim to have witnessed". The day a
 *  residence fact exists in the model (the review: «do not assert residence until residence is
 *  state») this is the one function that has to change, and no line has to be re-read. */
export const underOneRoof = (f: HasLifeStage): boolean => familyHomeVoice(f)

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
