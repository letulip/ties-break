// WHO SHE IS, AND HOW A WEEK IS PLANNED.
//
// The onboarding profile and its default, the training dials, and the two player-planned week types
// (a vacation, a practice match) with the recovery buff a good vacation leaves behind.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

export type FamilyBackground = 'wealthy' | 'middle' | 'working'
/** The coach ladder (docs/specs/coach-tiers.md), cheapest rung first. Replaces the old
 *  `CoachSetup = 'parent' | 'hired'` boolean, whose single `hired` band turned out to be a smear
 *  across three real tiers. `self` is the parent on the court – free as a coach, though the court
 *  is still rented. See src/engine/coach.ts for what each rung costs and what it is worth. */
export type CoachTier = 'self' | 'budget' | 'middle' | 'high' | 'elite'
/** WHERE A COACH FELL IN HIS OWN TIER'S CORRIDOR, in thirds (docs/specs/coach-match-edge.md §7).
 *  The only thing about his personal edge a screen may ever say: the VALUE is not observable in
 *  principle, the PLACE is what a family learns in a year. See `coachEdgePlacement`. */
export type CoachEdgePlacement = 'lower' | 'middle' | 'upper'
/** An inclination, not numbers: weights future skill growth (Phase 4), gives build identity now. */
export type PlayStyle = 'aggressive' | 'counterpuncher' | 'serve-first' | 'all-court'

export interface PlayerProfile {
  kidName: string
  /** family name (schema v7); shown in standings/news as "F. Last", full on the Kid screen */
  kidLastName: string
  /** boys' tour is post-v1 content */
  gender: 'girl'
  /** ISO 3166-1 alpha-2, e.g. 'RU'; flag emoji is derived from it in the UI */
  country: string
  background: FamilyBackground
  /** which rung of the coach ladder she is on (schema v22) */
  coachTier: CoachTier
  playStyle: PlayStyle
  /** 1-12 (schema v9). Relative-age-effect groundwork (round-3 QA item 16): picked at
   *  onboarding, purely cosmetic until Phase 4 wires the junior age-group dynamics it's
   *  meant to feed. */
  birthMonth: number
  /** her birth DAY within that month, 1-28/30/31 (owner, 30.07: «мы же будем ее с ДР на неделе поздравлять
   *  (и подарки дарить, кстати), чтобы точно знать на какой нам нужен день»).
   *
   *  ⚠ IT AFFECTS THE BIRTHDAY WEEK AND NOTHING ELSE - his own framing, and the right scope. The relative
   *  age effect is a MONTH-resolution idea (position inside the birth year), so `kidAgeExact` and
   *  `relativeAgeHeadStart` deliberately do not read this: refining 1/12 to 1/365 on a quantity whose whole
   *  meaning is "which part of the year" buys nothing, and threading a day into the development path would
   *  add precision nothing reads.
   *
   *  AND IT IS THE PLAYER'S, not derived, which is the part I had wrong. I proposed rolling it off the seed;
   *  he is right that a parent KNOWS his daughter's birthday - and a present has to be plannable, so the
   *  date has to be something he chose rather than something the game told him. */
  birthDay: number
}

export const DEFAULT_PROFILE: PlayerProfile = {
  kidName: 'Vera',
  kidLastName: 'Martin',
  gender: 'girl',
  country: 'US',
  background: 'middle',
  // A middle-class family's default is the STANDARD private coach, not the dearest one on the
  // ladder. The old default read `coachSetup: 'hired'`, which the spec's conversion prices at
  // ~$475/wk – an Elite coach, and precisely the wall this slice exists to close.
  coachTier: 'middle',
  playStyle: 'all-court',
  birthMonth: 6,
  birthDay: 15,
}

/** WHAT ONE KIND OF SESSION IS (v47, docs/specs/training-dials.md §2). Five blocks, one line each on
 *  the plan tab, seven checkboxes under it.
 *
 *  ⚠ `general` IS A KIND AND NOT AN ABSENCE OF ONE, and the whole migration rests on it. Four ticks
 *  across four kinds would also be "a bit of everything", and it is not the same thing: four ticks is
 *  four sessions and four billed hours, while ONE general tick is one session that touches all five
 *  skills. It is also what every shipped career has been doing – `growWeek` has always grown the five
 *  at one shared rate – which is precisely why a v46 save reads back as itself (§10).
 *
 *  ⚠ REST IS THE ABSENCE OF A TICK, not a sixth kind. A day whose array is empty is a day off, which
 *  removes the whole class of "what happens if you tick rest and serve on the same day". */
export type SessionKind = 'general' | 'serve' | 'rally' | 'fitness' | 'matchplay'

/** ⚠ APPEND-ONLY, like `SKILL_KEYS`, and for a weaker reason than that one: no draw walks this array,
 *  but the plan tab's block order is read off it and a save carries the strings. Order is display. */
export const SESSION_KINDS: readonly SessionKind[] = ['general', 'serve', 'rally', 'fitness', 'matchplay']

/** Weekly time split in percent; train + rest === 100. */
export interface WeekPlan {
  /** ⚠ LEGACY AND KEPT, AND SINCE v47 A PROJECTION OF `week` RATHER THAN THE PLAN ITSELF: 4 sessions
   *  -> 60/40, 5 -> 75/25, 6 -> 85/15 (`planTrainPct`). Four engine systems and two screens read it –
   *  `trainFactor`, `coachHoursForPlan`, `knockChance`, `restRecoveryBonus` – so keeping it as a
   *  projection is what makes every one of those readers byte-identical and the migration a pure
   *  default. The drift risk is real and the answer is the one `weeklyBillSplit` uses for
   *  `coach + facility === total`: `setPlan` is the ONLY writer of either field. */
  train: number
  rest: number
  /** v47 – Monday..Sunday. THE PLAN (docs/specs/training-dials.md §2, §10). Each day holds the kinds
   *  she trains that day: an empty array is a day off, and a day may hold at most two (§3 – one
   *  session on a school day, two on a day with no school). Between 4 and 6 sessions across the week.
   *
   *  ⚠ OPTIONAL, AND THE SPEC ASKED FOR IT REQUIRED. Making it required would have forced a seven-day
   *  matrix onto 48 `{ train, rest }` literals across 17 files – including `tests/condition.test.ts`'s
   *  RNG-invariance variants, whose whole job is to poke a HOSTILE plan (`{ train: 100, rest: 0 }`) at
   *  the tick, i.e. it would have meant rewriting the guard this slice most has to leave alone.
   *  Absence is also a shape with a meaning here rather than a hole: it reads back as the week the
   *  calendar has been DRAWING all along (`planWeek` – `sessionsForPlan` days, all of them general),
   *  which is exactly what the v46 -> v47 migration writes. One derivation, two callers, and a save
   *  that predates the field can never disagree with a save that carries it. */
  week?: SessionKind[][]
}

export const WEEK_PLAN_PRESETS: Record<'grind' | 'balanced' | 'light', WeekPlan> = {
  grind: { train: 85, rest: 15 },
  balanced: { train: 75, rest: 25 },
  light: { train: 60, rest: 40 },
}

// --- Season planner (schema v13) ---------------------------------------------
// Two player-planned week types on otherwise empty weeks. Both are PURE STATE (no engine RNG
// draw at booking time): prices come from purpose-scoped sub-streams, so a booking can never
// perturb the world's main draw sequence.

/** A booked family-vacation week: the package + what the family actually paid for it. */
export interface VacationBooking {
  week: number
  packageId: string
  paidCents: number
}

/** A booked practice-match week: the court rental (plus the optional coach) already charged. */
export interface PracticeBooking {
  week: number
  paidCents: number
  /** «+ тренер на игру» – the coach came along (50% of a session, the other half "paid by the
   *  opponent's family"). Cosmetic in v1; re-priced per coach tier when the coach slice lands. */
  withCoach: boolean
}

/** A carry-over recovery buff from a resort/elite vacation: injury tau × factor through
 *  `untilWeek` (inclusive). Applied POST-draw, so it moves the threshold, never the stream. */
export interface RecoveryBuff {
  untilWeek: number
  factor: number
}
