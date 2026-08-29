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

// --- The shop (schema v63) ---------------------------------------------------
// docs/specs/the-shop-2026-08.md §5. The parent's own money, turned into things.

/** ONE THING THE FAMILY OWNS – a row in `WorldState.assets`.
 *
 *  ⚠ `valueCents` IS STORED AND NOT DERIVED, and the spec's reason (§5) is this repo's own scar
 *  tissue: «a derived value would have to be recomputed identically by the screen and the ledger,
 *  and this repo has been bitten twice by two sides asking different functions about one question.»
 *  One writer (`revalueAssets`, at the top of the weekly tick), every reader takes the field. From
 *  slice 2 the value is genuinely path-dependent – drift accumulates and cannot be recomputed from
 *  `paidCents` at all – so the field is not a cache that happens to be redundant today, it is the
 *  same field arriving one slice before its second reason.
 *
 *  ⚠⚠ NO `readyWeek`, NO `frozenUntilWeek`, AND THE SPEC'S OWN SHAPE IS DECLINED HERE ON PURPOSE.
 *  §5 draws both fields as `number | null`, always null until slices 3 (commissioning) and 4
 *  (freeze). Pouring them now would buy nothing and cost something:
 *
 *    1. IT SAVES NO MIGRATION, which is the only thing it was for. This repo's shipped idiom for
 *       exactly this case is an OPTIONAL key whose ABSENCE is the true value – `masseurReturnDue?`
 *       and `injuryHistory[].weeksSaved?` (v59) both went in with no back-fill, because "the key is
 *       not there" already means what the new state means. Slice 3 can add `readyWeek?: number`
 *       (absent = delivered) and slice 4 `frozenUntilWeek?: number` (absent = sellable) the same
 *       way, and every row written by slice 1 is then already correct. The second migration this
 *       shape was meant to avoid is not merely small – it is ZERO – and it is zero *because* these
 *       two fields are not here as required nullables.
 *    2. A REQUIRED FIELD NOTHING CAN WRITE IS A SHAPE THAT LIES. Every reader of this file would
 *       find `readyWeek: null` on every row of every save and go looking for the writer that makes
 *       it a week. There is none, and there is no commissioning system for it to belong to. The
 *       version ladder in `world/state.ts` is a record of what was TRUE at each version; a v63 save
 *       claiming a delivery date it can never carry makes that record wrong at the one place it is
 *       read from.
 *    3. THE SEAM IS KEPT WITHOUT THE STATE. `sellableAsset` in `world/shop.ts` is the predicate
 *       slice 4 widens, and slice 3's build wait is a second predicate beside it – neither needs a
 *       field to exist today, and both name the fields they will read when they do. */
export interface OwnedAsset {
  /** the `ECONOMY.shop.catalogue` id – one row per id, never two (see `WorldState.assets`). */
  id: string
  boughtWeek: number
  /** what left the wallet, net of what has since been taken back out. The loss §2e-1 measures is
   *  `valueCents - paidCents`, so this has to be the cost of what is STILL HELD.
   *
   *  ⚠ IT READ «Never re-written» UNTIL ROUND 29 #11 AND PART TWO #4, AND BOTH WRITERS ARE THE SAME
   *  SENTENCE READ IN OPPOSITE DIRECTIONS. A top-up ADDS the new cash (round 29 #11); a PART SALE
   *  SUBTRACTS the cost of the part that left, `round(paidCents x proceeds / value)`, with the
   *  remainder taken by subtraction so the two halves re-add to the cent. What the old note was
   *  protecting is intact: this is CASH the family put in and never an accrued gain, which is why
   *  `basisCents` below exists and why `changeCents` is still `valueCents - paidCents`. */
  paidCents: number
  /** what it is worth THIS week, in cents, whole. Written by `revalueAssets` on every tick. */
  valueCents: number
  /** ⭐⭐ ROUND 29 #11 – THE COMPOUNDING BASIS AND THE WEEK IT STARTED FROM, written only by a
   *  TOP-UP and absent on a holding that has never had one.
   *
   *  THE OWNER: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
   *  будет вести себя так же – тоже надо исправить.»
   *
   *  ⚠⚠ WHY THIS IS NOT JUST `paidCents += more`. The value is `basis x (1+r)^years` off ONE start
   *  week, so money added in season six has not been compounding since season one and must not be
   *  treated as though it had. A top-up therefore REBASES: the basis becomes what the holding is
   *  worth today plus the new money, and the clock restarts from this week. That is exactly
   *  `V x (1+r)^t + T x (1+r)^t` – the arithmetic a real account does – with no second value model.
   *
   *  ⚠ AND `paidCents` STAYS WHAT THE FAMILY PUT IN, WHICH IS WHY THE BASIS IS A SEPARATE FIELD.
   *  Folding the rebase into `paidCents` would make it include accrued gains, so §2e-1's «the ledger
   *  shows the loss to the cent» would reset to zero on every top-up and the shelf would stop
   *  teaching the one thing it exists to teach. `paidCents` accumulates the CASH; the basis carries
   *  the COMPOUNDING; `changeCents` is still `valueCents - paidCents` and is still the truth.
   *
   *  ⚠ `boughtWeek` IS NOT TOUCHED – it stays the week the family first opened the holding, which is
   *  what it says it is and what any «how long have they had it» line would mean.
   *
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE – `WorldEvent.entryRef`'s recorded rule (commit 2763caa's
   *  precedent). Absent is exactly what every historical save already means here: «never topped up,
   *  so the basis IS `paidCents` and the clock IS `boughtWeek`», which is what `revalueAssets` reads
   *  when they are missing. No migration is owed and `SAVE_SCHEMA_VERSION` does not move. */
  basisCents?: number
  /** the week `basisCents` was struck – the compounding clock's start. Absent with it.
   *
   *  ⚠ ROUND 29 #5 GAVE IT A SECOND WRITER AND NOT A SECOND MEANING. A COMMISSIONED thing (§3f –
   *  the boats and the planes) is ordered years before it exists, so its clock starts on the week it
   *  ARRIVES: `buyAsset` writes `basisWeek = readyWeek` on the order, and `assetValueCents`'s own
   *  `Math.max(0, weeksHeld)` then holds the contract at what was paid for the whole wait. One
   *  field, one sentence – «the compounding clock's start» – and no second value model. */
  basisWeek?: number
  /** ⭐⭐ ROUND 29 #5, §3f – THE WEEK IT ARRIVES, and ABSENT ONCE IT HAS.
   *
   *  THE OWNER: «Со временем постройки около реальным – купил и ждешь пока будет готово, яхты
   *  строят несколько лет.»
   *
   *  Between the order and this week the family owns a CONTRACT and not a boat: `sellableAsset`
   *  refuses it (§3f – «the contract cannot be sold»), `weeklyAssetUpkeepCents` charges nothing for
   *  it (there is no crew on a hull), it grants no vacation week and it flies nobody anywhere. A
   *  rung with no `buildWeeks` never carries this key at all, which is every car, house and
   *  investment on the shelf and every row any save has ever written.
   *
   *  ⚠ THE KEY IS DELETED ON ARRIVAL rather than left behind as a date, because «absent = delivered»
   *  is the shape §12a of the spec drew for it and the shape every reader below is written against.
   *  `deliverAssets` is its one remover and it compares `>=`, so a week skipped in a multi-week
   *  advance still delivers.
   *
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE – `WorldEvent.entryRef`'s recorded rule and `basisCents`'s
   *  own, one paragraph up. Absent is exactly what every historical row already means («it is here,
   *  it arrived»), so no migration is owed and `SAVE_SCHEMA_VERSION` does not move. The spec named
   *  this field and this exact reasoning a slice in advance (§12a). */
  readyWeek?: number
}
