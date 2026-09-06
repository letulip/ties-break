// WHO SHE IS, AND HOW A WEEK IS PLANNED.
//
// The onboarding profile and its default, the training dials, and the two player-planned week types
// (a vacation, a practice match) with the recovery buff a good vacation leaves behind.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

// ⚠ `shared/dates.ts` IMPORTS NOTHING AT ALL, which is what makes this edge free: `profileShapeError`
// below needs the days-in-month table and this module stays a leaf of the wire.
import { daysInBirthMonth } from '../dates'
// ⚠ AND `shared/countries.ts` IMPORTS NOTHING EITHER, for the same reason and to the same effect –
// see the country note above `profileShapeError`.
import { isPlayableCountry } from '../countries'

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
  /** ⚠ THE OWNER'S NAME, ASKED FOR TWICE (02.09): «я просил сделать дефолт на Alice Martin». It was
   *  'Vera' from the first onboarding and every prologue career inherited it, which is what made the
   *  ask visible – docs/specs/childhood-prologue-build-2026-09.md §2.8.
   *
   *  ⚠⚠ CHANGING IT MOVES THE THREE FROZEN CAREER HASHES in tests/coachTravelEdgeFixtures.ts, because
   *  `econ-bench`'s `openCareer` spreads this object and her name is PRINTED into `events` text. The
   *  measured per-key diff (two keys of 72: `profile` and `events`, everything else byte-identical,
   *  `rngMain` included) is over `FROZEN` there, and `PRE_NAME_VERA` + `careerHashUnderTheOldName`
   *  are the byte-level proof: the same career RE-WALKED under the old name reproduces all three old
   *  constants exactly, so the name and nothing else is in the difference. */
  kidName: 'Alice',
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

// =================================================================================================
// ⭐⭐ E-06 (05.09 engine review) – IS THIS A CAREER THE ENGINE MAY OPEN?
//
// CLAUDE.md invariant 1 says every command is re-validated engine-side, and `new` was the one
// command that took its payload on trust: it goes straight into `createWorld`. The review measured
// what that costs. `background: 'nope'` threw a bare `TypeError: undefined is not iterable` out of
// `ECONOMY.travelBgFactor[background]` deep inside `ensureSeason` – closed, but as a stack trace
// rather than a sentence – while `birthMonth: 13`, `birthMonth: 0`, `birthDay: 31` in February,
// `kidName: ''`, `coachTier: 'bogus'`, `playStyle: 'bogus'` and `country: 'ZZ'` were all ACCEPTED,
// ticked and reloaded without complaint (`coachTier: 'bogus'` silently yields a self-coached
// career). `new` is the one command that creates PERSISTED state out of its payload, so a payload
// it should never have taken becomes a career on the player's device.
//
// ⚠ IT IS `planShapeError`'s SHAPE AND `planShapeError`'s VOICE – returns the reason it is illegal,
// or null, and the worker prefixes the subject exactly as `setPlan` does. Same reason that one is
// not a boolean: the refusal has to be able to SAY which field, and a validator that answers
// true/false makes the caller invent the sentence.
//
// ⚠⚠ THE THREE ENUMERATIONS ARE DECLARED HERE, module-private, RATHER THAN IMPORTED. `COACH_TIERS`
// already exists in `engine/coach.ts`, and reaching for it would put a RUNTIME edge from the wire
// into the engine (and a second `COACH_TIERS` into the `shared/protocol` barrel, which
// `engine/world.ts` re-exports from – the duplicate-identifier failure CLAUDE.md names). They stay
// private and the drift is caught behaviourally instead: the test walks `engine/coach.ts`'s own
// `COACH_TIERS` through this function and every rung has to be accepted.
//
// ⚠⚠ `country` IS CHECKED AGAINST THE PLAYABLE LIST SINCE 06.09, AND USED TO BE CHECKED AS A SHAPE.
// The owner: «country проверяется на форму, а не по списку – мне кажется это надо исправить, у меня
// в планах было расширить список стран вообще». The old note here argued that the enumeration was
// `COUNTRIES` in `composables/countries.ts`, that that file's header rules it PRESENTATION, and that
// the engine may therefore only ask whether the value LOOKS like an ISO 3166-1 alpha-2 code – so
// 'ZZ' got through and cost a fallback label.
//
// BOTH HALVES OF THAT ARE TRUE AT ONCE, WHICH IS THE DESIGN, and the fix is the split rather than a
// side. *Which* countries are playable is a RULE and now lives in `shared/countries.ts`, which this
// module asks; *how* a country is rendered – the English name, the flag – is presentation and stays
// in the composable, which derives its keys from that same list. Neither file can drift from the
// other and neither had to learn about the other's job. See `shared/countries.ts`'s header for the
// whole argument, and for what adding a twenty-fifth country costs.
// =================================================================================================

const BACKGROUNDS_ALLOWED: readonly FamilyBackground[] = ['wealthy', 'middle', 'working']
const COACH_TIERS_ALLOWED: readonly CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
const PLAY_STYLES_ALLOWED: readonly PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']

/** The longest name a career may be opened under – PER FIELD, so `kidName` and `kidLastName` get
 *  twenty each and not twenty between them.
 *
 *  ⚠ TWENTY SINCE 06.09, AND IT WAS 200 (owner: «Ограничение имени 200 символов – а зачем нам такие
 *  длинные имена? мы же не твиттер… например 20»). Twenty is his own number and it is still twice
 *  the longest surname the game itself produces: `engine/season/names.ts` tops out at six characters
 *  for a first name (`Camila`, of 44) and ten for a surname (`Ostergaard`, of 211), so every name
 *  the world draws for a rival, for the next daughter on the ending screen and for the wizard's own
 *  dice fits with room to spare.
 *
 *  ⚠⚠ IT IS NO LONGER `saveGuard`'s `MAX_ID_CHARS`, AND THAT IS DELIBERATE RATHER THAN DRIFT. The
 *  spine rule there still refuses an imported save whose `profile.kidName` runs past 200, and it
 *  must: it reads files written by OLDER BUILDS, and a career started yesterday under a forty-
 *  character name is a legitimate file that has to keep loading. The two numbers answer two
 *  different questions – what a player may TYPE today, and what the reader must still ACCEPT – and
 *  the direction that matters is preserved: the creation cap is INSIDE the import cap, so every
 *  career this function opens can still be read back. (`MAX_ID_CHARS` is also the seed/careerId
 *  bound, and generated career ids run to ~30 characters, so moving it would refuse the game's own
 *  saves.) The test asserts the INEQUALITY where it used to assert the equality.
 *
 *  ⚠ AND THE WIZARD CARRIES THE SAME NUMBER as its inputs' `maxlength` (E-06's own risk note: a cap
 *  the wizard does not have is a cap that refuses a name a player really typed). So this bound is
 *  unreachable from the wizard by construction, which is what a hygiene guard should be. That is
 *  `ASSET_NAME_MAX_CHARS`'s own idiom, in that constant's own words: the screen sets the same number
 *  as the field's `maxlength`, so the cap is FELT while typing rather than met as a refusal. */
export const PROFILE_NAME_MAX_CHARS = 20

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function nameError(value: unknown, what: string): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return `${what} is needed`
  if (value.length > PROFILE_NAME_MAX_CHARS) return `${what} is at most ${PROFILE_NAME_MAX_CHARS} characters`
  return null
}

/**
 * IS THIS A PROFILE A CAREER MAY BE OPENED ON? Returns the reason it is not, or null.
 *
 * Total over `unknown` on purpose – this is the engine's re-validation of a WIRE payload, and the
 * whole point is that the sender may be anything.
 */
export function profileShapeError(profile: unknown): string | null {
  if (!isObject(profile)) return 'A career needs a profile'

  const first = nameError(profile.kidName, 'A first name')
  if (first !== null) return first
  const last = nameError(profile.kidLastName, 'A family name')
  if (last !== null) return last

  if (profile.gender !== 'girl') return `Unknown gender: ${String(profile.gender)}`
  // ⚠ THE LIST, NOT THE SHAPE – see the country note in the block above. `'ZZ'` is a well-formed
  // alpha-2 code and is not a country this game offers, so it is refused here rather than surfacing
  // later as a bare label and a pair of stray letters where the flag belongs. The SENTENCE is
  // unchanged: it said «Unknown country» when it meant "not two capitals" and it says «Unknown
  // country» now that it means "not one of ours", which is the word that was always right.
  if (!isPlayableCountry(profile.country)) {
    return `Unknown country: ${String(profile.country)}`
  }
  if (!BACKGROUNDS_ALLOWED.includes(profile.background as FamilyBackground)) {
    return `Unknown family background: ${String(profile.background)}`
  }
  if (!COACH_TIERS_ALLOWED.includes(profile.coachTier as CoachTier)) {
    return `Unknown coach tier: ${String(profile.coachTier)}`
  }
  if (!PLAY_STYLES_ALLOWED.includes(profile.playStyle as PlayStyle)) {
    return `Unknown play style: ${String(profile.playStyle)}`
  }

  const month = profile.birthMonth
  if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12) {
    return 'A birth month is 1 to 12'
  }
  // ⚠ THE DAY IS JUDGED AGAINST ITS OWN MONTH, which is what makes `birthDay: 31` in February a
  // refusal rather than a date. `daysInBirthMonth` is the same function the wizard's own day picker
  // and the prologue's identity card count with – February is 28 there and 28 here, for the reason
  // that function's note gives (her birth year is not a leap year).
  const days = daysInBirthMonth(month)
  const day = profile.birthDay
  if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > days) {
    return `A birth day is 1 to ${days}`
  }
  return null
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

// --- the childhood prologue's handover (phase 4) --------------------------------------------------
// docs/specs/childhood-prologue-build-2026-09.md §4. The nine years the player lived, on the wire,
// so `createWorld` can spend them on a girl who is already fourteen when the game opens.
//
// ⚠⚠ NOTHING HERE IS PERSISTED AND NO SAVE FIELD IS OWED. This rides the `new` COMMAND, not the
// world: §4's whole list – `startingSkills` shifted post-draw, `fundsCents`, `playStyle`,
// the coach rung – is applied AT CREATION onto fields every save has carried since v22, so a career
// that came through the prologue and one that came through the wizard are the same object with
// different numbers in it. `SAVE_SCHEMA_VERSION` (69) does not move, no migration is owed and no
// fixture is added. See `createWorld` for the applied end and docs/specs/childhood-prologue-money-
// 2026-09.md for the one piece of arithmetic that is new.

/** ONE YEAR OF HER CHILDHOOD, as the prologue hands it over.
 *
 *  ⚠ IT LIVES HERE RATHER THAN IN `src/prologue/cards.ts` (where phase 2 declared it) BECAUSE IT
 *  CROSSES THE WIRE. The card table and the worker now read one declaration instead of two, and the
 *  engine's own `ChildhoodYear` (engine/childhood.ts) stays where it is: that module is pinned as
 *  importable by `engine/world.ts` alone, so the protocol may not reach it, and
 *  `tests/prologue-cards.test.ts` asserts the two shapes are assignable in both directions. */
export interface PrologueYear {
  /** her age at the START of the year: 5 through 13 */
  age: number
  /** how much tennis, 0 (none) .. 1 (as much as anyone does at any age) – ABSOLUTE, not relative to
   *  her age. That is phase 1's anti-grind mechanism and nothing downstream may soften it. */
  practice: number
  /** who taught her, 0 (a parent on a municipal court) .. 1 (a club, where the coaches are) */
  teaching: number
  focus: SessionKind
}

/** WHAT THE NINE CARDS CAME TO – the whole of what a prologue hands `createWorld`.
 *
 *  ⚠ TWO FIELDS AND NOT FIVE. The build she arrives with, the rung she arrives on and the style she
 *  earned are all DERIVED in the engine from `years`, because deriving them in the UI would mean the
 *  UI importing `engine/childhood.ts` – which `tests/childhood.test.ts` pins as reachable from
 *  `engine/world.ts` and nothing else. `spentCents` is here because the costs live in the card table
 *  and the engine has no way to re-derive them. */
export interface PrologueHandover {
  readonly years: readonly PrologueYear[]
  /** what the nine years cost, in cents (house law: money is in cents everywhere) */
  readonly spentCents: number
}

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
   *  `changeCents` is still `valueCents - paidCents`.
   *
   *  ⚠⚠ ROUND 30 #14 KEPT BOTH WRITERS AND CHANGED NEITHER'S ARITHMETIC. A unit buy adds the cash; a
   *  part sale takes out the cost of the units that left – and because `proceeds / value` IS
   *  `unitsSold / units`, that is the same rounding it has always done. What the field gained is a
   *  second job: divided by `units` it is the AVERAGE PRICE the family entered at
   *  (`avgUnitPriceCents`), which is the number «усредниться или зафиксировать убыток» is decided
   *  against. That is also why the part sale scales it PROPORTIONALLY rather than realising the
   *  oldest units first: the average must not move when a family takes money out.
   *
   *  ⚠⚠ ROUND 34 #15 DID NOT TOUCH THIS FIELD EITHER, and that is the point of the two below: what
   *  a part sale takes out of `paidCents` is now REMEMBERED beside it rather than forgotten, so the
   *  lifetime gain can be stated without this field having to mean two things at once. */
  paidCents: number
  /** what it is worth THIS week, in cents, whole. Written by `revalueAssets` on every tick. */
  valueCents: number
  /** ⭐⭐⭐ ROUND 34 #15 – WHAT THE FAMILY HAS ALREADY EARNED AND TAKEN OUT OF THIS HOLDING, in
   *  cents. Accumulated by `sellAsset` on a PART sale: `proceeds - costOfUnitsSold`, the same
   *  `deltaCents` the ledger sentence already names («$4,800 more than it cost»).
   *
   *  THE OWNER, 02.09: «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она
   *  не должна меняться, просто новое поступление будет меньше»
   *
   *  ⚠⚠ HE IS DESCRIBING A REAL DEFECT AND IT WAS MEASURED BEFORE ANYTHING MOVED
   *  (`tools/r34-savings-income.ts`): $100,000 held for ten years reads «+$36,626 since they bought
   *  it», and taking half out re-reads it as «+$18,313» the same week. The family is not poorer –
   *  the money is in the wallet – but the card was answering «what is the gain on what is STILL
   *  HELD» to a sentence that asks «what has this earned». `changeCents` adds this term, so the
   *  answer stops depending on how much of the holding is left. His own second clause is what the
   *  engine already did and still does: the next week's accrual on a halved balance really is half.
   *
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE – `gearRestWeeks?`'s own rule, and `shootClashAccepted?`'s
   *  before it. Absent means exactly what every save written before this means: no realised gain is
   *  RECORDED, so `changeCents` falls back to `valueCents - paidCents` and an in-flight career reads
   *  the figure it read yesterday, to the cent. It starts remembering from the next withdrawal on.
   *  ⚠ A WHOLE sale deletes the row, so nothing accumulates there and nothing needs to: there is no
   *  card left to put a number on. */
  realisedGainCents?: number
  /** ⭐⭐⭐ ROUND 34 #15 – ...AND WHAT THAT REALISED GAIN COST, in cents: the `costSoldCents` the
   *  same part sale took out of `paidCents`.
   *
   *  ⚠⚠ IT IS THE PERCENTAGE'S HALF OF THE ITEM, and without it the fix would move the number he did
   *  NOT complain about. `changePct` divides the gain by what the family put in; leave the
   *  denominator as `paidCents` alone and the ten-year deposit above jumps from 37% to 73% on the
   *  withdrawal – the same defect, one column to the right. Lifetime gain over lifetime cost holds
   *  at 37% across the sale, which is what «она не должна меняться» asks of the whole sentence.
   *
   *  ⚠ SAME OPTIONALITY, SAME REASON: absent is a save that never recorded one, and the fallback is
   *  the shipped arithmetic. */
  realisedCostCents?: number
  /** ⭐⭐⭐ ROUND 30 #8 AND #10 – WHAT THE FAMILY CALLED IT. Present on the FIRST row of a nameable
   *  family the household bought (the merch brand; the academy's land) and absent on every other row
   *  – including the academy's three later stages, which read the land's name rather than carrying
   *  three copies of it (`assetNameOf`).
   *
   *  THE OWNER, 30.08: «Merch brand давай предложим пользователю несколько вариантов именования при
   *  покупке… один из вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу.»
   *
   *  ⚠⚠ IT IS THE ONLY PLAYER-AUTHORED FREE TEXT IN A SAVE BESIDES HER NAME, so it is bounded TWICE
   *  and neither pass is a substitute for the other. `buyAsset` runs `sanitiseAssetName` before it is
   *  ever stored – a cap of `ASSET_NAME_MAX_CHARS` code points over an allow-list – which covers
   *  every name a player of this game can create. `assetNameOf` runs the SAME function again on every
   *  read, which is what covers a file: an imported or hand-edited save can carry a row no command
   *  ever wrote, and `saveGuard`'s 32,768-character ceiling stops a hostile payload without going
   *  anywhere near a broken layout.
   *
   *  ⚠ OPTIONAL, AND ABSENCE IS A REAL STATE rather than a missing value: a probe world built by
   *  hand and any row of a family whose name lives on an earlier row both have none. `assetNameOf`
   *  skips a nameless row instead of answering null for the whole family, which is what keeps the
   *  academy's stages readable in any order. ⚠ v66 back-fills it on every owned business and academy
   *  row so no career the game itself produced is ever nameless. */
  name?: string
  /** ⭐⭐⭐ ROUND 30 #14 – HOW MANY UNITS OF THE RUNG THEY HOLD. Present on every row of a rung that
   *  carries `unitBaseCents` and absent on every other, which is every car, house, boat, plane,
   *  academy stage and business.
   *
   *  THE OWNER, 30.08: «И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут
   *  возможность расти на горизонте и будут давать разные точки входа, как в жизни… Зашёл, когда
   *  доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл на пике при цене 7-8к и
   *  увидел просадку на следующий год – имеешь возможность усредниться или зафиксировать убыток.»
   *
   *  ⚠⚠ THIS FIELD REPLACES `basisCents` AND THE WHOLE REBASE. Round 29 #11 valued a topped-up
   *  holding by restating its basis at today's worth and restarting its clock; part two #4's part
   *  sale scaled the same two numbers down. Both were arithmetically the unit model already – that
   *  is WHY they were correct – but they threw the entry price away in the act, and the entry price
   *  is the thing he asked to be able to see and to average against. Units keep it: money buys units
   *  at the price of ITS OWN week, and nothing a later purchase does can restate an earlier one.
   *
   *  ⚠ FRACTIONAL, AND THAT IS NOT A BREACH OF «money is in cents». Cents are money; this is a
   *  COUNT of shares and a real one is fractional – $5,000 into a $4,000 unit is 1.25 units, not one
   *  unit and a lost thousand. The cents are `Math.round(units × price)`, rounded ONCE in
   *  `assetWorthCents`, and the owner's «у пользователя целые в интерфейсе» is honoured where it is
   *  addressed – at the display, which rounds both PRICES and shows the count to two places.
   *
   *  ⚠ OPTIONAL IN THE TYPE AND REQUIRED IN FACT: `buyAsset` writes it on every unit-priced purchase
   *  and the v66 migration back-fills it on every historical row, converting at the price of the
   *  row's own basis week so the family's history is preserved rather than reset. Absence means «not
   *  a unit-priced rung», never «a unit-priced rung with no units» – and
   *  `tests/round30-fund-units.test.ts` holds the catalogue and the migration to that, both ways. */
  units?: number
  /** the compounding clock's start, when it is not `boughtWeek`. Absent on everything bought and
   *  delivered in the same week, which is most of the shelf.
   *
   *  ⚠ ROUND 29 #5 GAVE IT A SECOND WRITER AND NOT A SECOND MEANING. A COMMISSIONED thing (§3f –
   *  the boats and the planes) is ordered years before it exists, so its clock starts on the week it
   *  ARRIVES: `buyAsset` writes `basisWeek = readyWeek` on the order, and `assetValueCents`'s own
   *  `Math.max(0, weeksHeld)` then holds the contract at what was paid for the whole wait. One
   *  field, one sentence – «the compounding clock's start» – and no second value model.
   *
   *  ⚠⚠ ROUND 30 #14 TOOK THE **OTHER** WRITER AWAY AND LEFT THE SENTENCE STANDING. The top-up and
   *  the part sale used to restate this week along with `basisCents`; there is no rebase any more,
   *  so the commissioned order is its ONLY writer and no unit-priced row ever carries it. That is
   *  what keeps `assetWorthCents`'s `?? boughtWeek` live in both directions rather than a habit: a
   *  car has none, a yacht has one, and neither of them has units. */
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
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE – `WorldEvent.entryRef`'s recorded rule, the one `basisWeek`
   *  is written under. Absent is exactly what every historical row already means («it is here,
   *  it arrived»), so no migration is owed and `SAVE_SCHEMA_VERSION` does not move. The spec named
   *  this field and this exact reasoning a slice in advance (§12a). */
  readyWeek?: number
}
