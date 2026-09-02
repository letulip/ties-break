// THE CHILDHOOD, 5 -> 14 – the prologue's development process, and it is NOT the game's curve.
// Phase 1 of docs/specs/childhood-prologue-build-2026-09.md; measured in
// docs/specs/childhood-growth-2026-09.md.
//
// ⚠⚠ WHY THIS IS A MODULE AND NOT A BRANCH IN `development.ts`. The build spec's §1a is the reason
// the whole feature is gated on this file. `ageFactor` clamps at
// `Math.max(0, (age - growthStart) / (growthEnd - growthStart))` with `growthStart = 13`, so every
// age below 13 returns `peakRate` – the maximum junior rate – and the age term summed over a
// prologue is 2.56 against 0.90 for the entire 14->18 window. A prologue run through `growWeek`
// would hand out 2.84x the whole playable junior career before the player is charged a dollar.
// Four things follow, and each one says "separate module":
//
//   1. IT IS A DIFFERENT PROCESS, AND THAT IS THE DESIGN, not an implementation preference. The
//      30.07 note: «"Development" at seven is not the same thing it is at seventeen: it is
//      coordination, habit and whether she likes it, not headroom against a ceiling.» Nothing below
//      reads `potential`, and there is no rate, no headroom and no week.
//   2. UNREACHABILITY BECOMES MECHANICAL. A branch inside `growWeek` is reachable by any caller
//      that hands it an `ageYears` under 13, and `ageYears` is computed from world state. A module
//      that nothing on the tick path imports cannot be reached by an ordinary in-game week at all –
//      and `tests/childhood.test.ts` asserts the import set, so it stays that way.
//   3. `development.ts` IS NOT EDITED, so the frozen MAIN capture (41550 draws / e6b0c709) and every
//      career hash cannot move. Not "were checked and did not move" – cannot.
//   4. `growthStart = 13` KEEPS MEANING WHAT IT SAYS. Extending it downward is precisely the shape
//      that produces the 2.84x, and a reader who sees a 5 there would have no way to know that.
//
// ⚠⚠ AND IT MAY NOT MOVE `potential`. Build spec §4: her ceiling is talent and what you did at eight
// does not change it – «let the prologue raise it and "you made her" quietly becomes "she was always
// going to be good"». This module never imports `rollPotential`, never takes a ceiling and never
// returns one. Same rule the coach spec's §6 and task 55 keep: a timing or effort effect must never
// become a talent effect.
//
// ⚠ RNG: THERE IS NONE, AND THE MODULE NEVER SEES A SEED. Not "a purpose-scoped sub-stream" – no
// draw of any kind. Three reasons, in the order they matter:
//   – Every source of spread the arrival needs is ALREADY drawn. `startingSkills` (`seed:kid`) gives
//     her the build, `rollPotential` (`seed:potential`) gives her the ceiling; the childhood's job is
//     to move her inside a band that is already random, not to add a third source of noise.
//   – His own ruling forbids the alternative in spirit. §2.5: the age-12 fork is DERIVED from what
//     the player did, because «there are no dice in a derived reading» and the trap he named – «на
//     новом заходе она точно должна хотеть» – cannot arise if there is nothing to roll badly. A
//     childhood that rolls its own luck re-opens exactly that trap one layer down.
//   – It is the strongest possible answer to the capture requirement. A function that takes no seed
//     and imports no generator cannot move a stream by construction.
import {
  aimWeights,
  SKILL_KEYS,
  SKILL_POINTS_PER_YEAR,
  STARTING_SKILL_BAND,
  type KidSkills,
  type SkillKey,
} from './development'
import type { SessionKind } from '../shared/protocol'

/** ONE YEAR OF HER CHILDHOOD, as the arithmetic sees it. Three numbers and a kind – deliberately
 *  the smallest shape that can carry a card's answer, because phase 2's cards are a table that maps
 *  onto THIS and must not grow an arithmetic of their own.
 *
 *  ⚠ `practice` IS ABSOLUTE, NOT RELATIVE TO HER AGE. That is the whole anti-grind mechanism: an
 *  hour is an hour, and what changes with age is how many of them a child can take (`appetiteAt`).
 *  A card that buys "as much tennis as money can buy" for a six-year-old therefore buys strain, not
 *  progress, which is what makes the choice a decision instead of a button marked "yes please". */
export interface ChildhoodYear {
  /** her age at the START of the year: 5 through 13 */
  age: number
  /** how much tennis, 0 (none) .. 1 (as much as anyone does at any age) */
  practice: number
  /** who taught her, 0 (a parent on a municipal court) .. 1 (a club, where the coaches are) */
  teaching: number
  /** what the year was spent on – the engine's own session kinds, so the shape channel below reuses
   *  `SESSION_AIM` rather than inventing a second map from activities to attributes */
  focus: SessionKind
}

/** WHAT ONE YEAR CAME TO, kept per year because phase 2 draws the nine of them and must read the
 *  same numbers the arrival is made of rather than recomputing them. */
export interface ChildhoodYearResult {
  age: number
  /** how much of what a child that age can absorb she actually did, 0..1 – saturating, and the
   *  saturation is against HER CAPACITY THIS YEAR, never against a talent ceiling */
  coordination: number
  /** what she brought into the year from the years before it, 0..1 */
  habit: number
  /** whether she still likes it, 0..1 – falls with accumulated strain and recovers slowly */
  joy: number
  /** the year's earnings, 0..1, before the age weight */
  quality: number
  /** this year's share of the childhood, summing to 1 across the nine */
  weight: number
}

export interface ChildhoodWalk {
  years: ChildhoodYearResult[]
  /** the weighted quality of the whole childhood, 0..1 */
  quality: number
  /** points added to EVERY attribute, against a median childhood: +swingPoints for a devoted one */
  level: number
  /** points moved BETWEEN attributes, summing to zero */
  shape: Record<SkillKey, number>
}

/** THE DIALS. Everything balance depends on is `swingPoints` and `shapeSwingPoints`; the rest is
 *  the shape of the nine years and is measured in docs/specs/childhood-growth-2026-09.md. */
export const CHILDHOOD = {
  /** she starts here – his ruling (§2.1): «я бы поставил начало в 5, 6 происходит где-то в первый
   *  год», so nine cards rather than eight */
  startAge: 5,
  /** ...and hands over here, which is `START_AGE_YEARS` and is not re-declared: the last year runs
   *  from 13 to 14 and the game takes her at its end */
  endAge: 14,

  /** ⭐⭐ WHAT A DEVOTED CHILDHOOD IS WORTH OVER A MEDIAN ONE, ON EVERY ATTRIBUTE – and it is DERIVED
   *  rather than picked. `SKILL_POINTS_PER_YEAR` is the game's own measured price of a junior year
   *  (development.ts: the 14->18 run moved her mean attribute 48.5 -> 57.0-58.6, i.e. ~2.4 a year),
   *  so nine years of the best decisions a parent can make are worth ONE EXTRA YEAR of junior
   *  development, and nine years of the cheapest ones cost about the same.
   *
   *  ⚠ THE MAGNITUDE IS THE POINT OF THE PHASE. The control this replaces – `growWeek` walked from
   *  five – grants 2.84x the whole 14->18 window. This grants a quarter of it, best-to-worst about
   *  half of it, and it is still more than twice the relative-age effect (`relativeAgeHeadStart`,
   *  ±1.1) which the game already treats as a real edge in a match. */
  swingPoints: SKILL_POINTS_PER_YEAR,

  /** ...and what a childhood spent on ONE wing moves that wing by, against the others. Half a year.
   *  Sums to zero across the five: this channel redistributes, it never adds – the same contract
   *  `aimWeights` keeps for a training week, and for the same reason. */
  shapeSwingPoints: SKILL_POINTS_PER_YEAR / 2,

  /** HOW MUCH TENNIS A CHILD CAN TAKE, at five and at thirteen, interpolated between. A
   *  five-year-old's year is a quarter of a thirteen-year-old's and nobody's training programme
   *  changes that; past it the hours stop buying coordination and start buying strain.
   *
   *  ⚠ IT IS ALSO THE YEAR'S WEIGHT (`weightAt`), deliberately, so there is no second table to drift
   *  out of step with this one: a year is worth what a child that age can take. That reproduces §3's
   *  shape without asserting it – three quiet years while she is small, the real years from eight. */
  appetiteAt5: 0.25,
  appetiteAt13: 1,

  /** WHO TAUGHT HER, as a multiplier on what the hours were worth. A parent on a municipal court is
   *  not nothing – she is still hitting balls – so the floor is 0.7 rather than 0, and the club is
   *  where the last 30% is. §3: «the money starts when the club does, at eight». */
  teachingFloor: 0.7,

  /** THE SPLIT BETWEEN THE TWO THINGS A YEAR EARNS. Coordination is this year's hours; habit is
   *  every year before it. 60/40, so a light year at nine is still felt at twelve – which is the
   *  consequence the prologue exists to make legible – without a single year being able to decide
   *  the childhood. */
  coordinationShare: 0.6,
  /** how much of last year's habit survives into this one, before this year is folded in */
  habitCarry: 0.6,

  /** STRAIN: what a year past her appetite costs her joy, and how long it stays. `burn` accumulates
   *  the overshoot and decays at `burnCarry`, so a childhood that pushed a six-year-old is still
   *  paying for it at nine. */
  strainCost: 0.5,
  burnCarry: 0.6,
} as const

/** The nine ages, 5..13. She turns fifteen on the far side of the handover; the last year is 13->14
 *  and the game takes her at its end. */
export const CHILDHOOD_AGES: readonly number[] = Array.from(
  { length: CHILDHOOD.endAge - CHILDHOOD.startAge },
  (_, i) => CHILDHOOD.startAge + i,
)

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/** HOW MUCH TENNIS A CHILD THAT AGE CAN ABSORB, 0..1. Linear between the two dials – a straight line
 *  is a claim about direction and nothing more, which is all this needs to be. */
export function appetiteAt(age: number): number {
  const span = CHILDHOOD.endAge - 1 - CHILDHOOD.startAge
  const t = clamp01((age - CHILDHOOD.startAge) / span)
  return CHILDHOOD.appetiteAt5 + (CHILDHOOD.appetiteAt13 - CHILDHOOD.appetiteAt5) * t
}

/** THIS YEAR'S SHARE OF THE CHILDHOOD, summing to 1 over the nine. A year is worth what a child that
 *  age can take, so this is `appetiteAt` normalised and there is no second table. */
export function weightAt(age: number): number {
  let total = 0
  for (const a of CHILDHOOD_AGES) total += appetiteAt(a)
  return appetiteAt(age) / total
}

/** ⭐ THE FOLD – the nine years walked ONCE, and everything goes through it.
 *
 *  ⚠ IT EXISTS BECAUSE THE ANCHORS ARE THE SAME ARITHMETIC. `childhoodWalk` normalises the level
 *  against a median and a devoted childhood, and the first draft of this module computed those with
 *  a SECOND copy of this loop. Two copies of one model is a model that drifts: a change made in one
 *  and not the other moves the anchor away from the walk it is anchoring, and the only thing that
 *  would have caught it is the median-is-a-no-op test noticing after the fact. One loop, no drift. */
function foldYears(years: readonly ChildhoodYear[]): {
  rows: ChildhoodYearResult[]
  quality: number
  mass: Record<SkillKey, number>
} {
  const rows: ChildhoodYearResult[] = []
  const mass = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) mass[k] = 0

  let carry = 0
  let burn = 0
  let quality = 0

  for (const y of years) {
    const appetite = appetiteAt(y.age)
    const coordination = appetite > 0 ? clamp01(Math.min(y.practice, appetite) / appetite) : 0
    const taught = CHILDHOOD.teachingFloor + (1 - CHILDHOOD.teachingFloor) * clamp01(y.teaching)

    burn = CHILDHOOD.burnCarry * burn + Math.max(0, y.practice - appetite)
    const joy = clamp01(1 - CHILDHOOD.strainCost * burn)

    const habit = carry
    const q =
      joy *
      (CHILDHOOD.coordinationShare * coordination * taught + (1 - CHILDHOOD.coordinationShare) * habit)

    const weight = weightAt(y.age)
    quality += weight * q
    rows.push({ age: y.age, coordination, habit, joy, quality: q, weight })

    // WHERE THE YEAR POINTED. A year she barely played shapes nothing, so the mass is the year's
    // coordination and not its mere existence; `aimWeights` supplies the vector, mean exactly 1.
    const aim = aimWeights([[y.focus]])
    for (const k of SKILL_KEYS) mass[k] += weight * coordination * aim[k]

    // What she keeps: this year's realised work, blended into what she already had.
    carry = CHILDHOOD.habitCarry * carry + (1 - CHILDHOOD.habitCarry) * (joy * coordination)
  }

  return { rows, quality, mass }
}

/** ⭐⭐ THE WALK – nine years folded into what they came to. Pure, seedless, and the only place the
 *  childhood's arithmetic lives.
 *
 *  ⚠ THE THREE TERMS ARE THE SPEC'S OWN WORDS AND NOT AN INVENTION: «at seven it is coordination,
 *  habit and whether she likes it, not headroom against a ceiling.»
 *    COORDINATION – this year's hours, SATURATING at what a child that age can absorb. The cap is
 *      her capacity this year; nothing here knows her ceiling exists.
 *    HABIT – what she carried in from the years before. This is why a light year has a price later
 *      and why a childhood cannot be bought back at twelve.
 *    JOY – whether she still likes it. It falls with accumulated strain and multiplies the year, so
 *      pushing a six-year-old does not merely fail to help, it costs.
 *
 *  ⚠ AND THAT IS WHY THE GRINDER LOSES. knock.ts's standing rule is that a branch which always ends
 *  better is not a decision. Maximum practice at every age is the branch a player reaches for first,
 *  and here it lands BELOW a median childhood – measured, see the spec's §3a and §4.
 *
 *  ⭐⭐ AND IT ANSWERS A CHILDHOOD THAT IS STILL RUNNING – phase 12, and the change is one anchor.
 *  See `docs/specs/childhood-on-court-2026-09.md`. The owner found the gap at a Local Open: a
 *  ten-year-old was drawn straight out of `STARTING_SKILL_BAND`, so «a player who paid for the club,
 *  one-to-one hours and the sports school watches her play exactly like a neglected girl». The
 *  honest build for a girl who has lived six years of a childhood is this function over those six
 *  years – and it used to lie about them, because the FAULT WAS IN THE DENOMINATOR. */
export function childhoodWalk(years: readonly ChildhoodYear[]): ChildhoodWalk {
  const { rows, quality, mass } = foldYears(years)
  // ⚠ THE LEVEL IS NORMALISED AGAINST THE TWO REFERENCE CHILDHOODS, and that is what makes the dial
  // mean what it says: a median childhood is EXACTLY zero – so a prologue that made ordinary choices
  // hands the game the same girl `startingSkills` has always produced – and a devoted one is exactly
  // `swingPoints`. Without the anchor `swingPoints` would be "roughly this much, depending on the
  // shape of the weights", which is the kind of dial that drifts.
  //
  // ⭐⭐ THE TWO ANCHORS ARE READ AT DIFFERENT LENGTHS, AND THAT IS THE WHOLE OF PHASE 12.
  //
  //     level = swingPoints x (quality_so_far - qMedian_SO_FAR) / (qDevoted_FULL - qMedian_FULL)
  //
  // The NUMERATOR asks «how far off ordinary are the years she has actually lived?» and must
  // therefore compare like with like: `quality` is a sum over the years it was handed, so the median
  // it is measured against has to be a sum over THE SAME YEARS. Before phase 12 both anchors were
  // folded over all nine whatever it was handed, so six lived years were a six-year sum against a
  // nine-year median and every partial childhood – a devoted one included – read as far below
  // ordinary purely for being short. Measured: a devoted childhood truncated at age nine read
  // -1.81 of a +2.40 swing.
  //
  // The DENOMINATOR stays the FULL childhood, deliberately, because it is the unit the dial is
  // written in: `swingPoints` is «what nine years of the best decisions a parent can make are
  // worth», so dividing by a six-year span would re-scale a six-year-old's answer up to the full
  // swing and the years would stop showing at all. Kept full, a devoted road reads about half the
  // swing at ten and all of it at fourteen – ⭐ the gap is SMALL AT TEN AND VISIBLE AT THIRTEEN,
  // which is the prologue revealing an upbringing gradually rather than in a jump.
  //
  // ⚠ AND AT FOURTEEN NOTHING MOVED, BY CONSTRUCTION rather than by measurement. A finished
  // childhood has lived all nine years, so `qMedianSoFar` IS `qMedianFull` – the same subtraction,
  // the same division, the same double. The balance pass's numbers stay true.
  //
  // ⚠ IT IS THE SAME FUNCTION WITH MATCHED ANCHORS, NOT A SECOND STRENGTH MODEL. `foldYears` is
  // still the one loop everything goes through (see its own note), and the years it is handed are
  // still the player's own – phase 11's objection was to a SECOND model in `src/prologue`, and this
  // is the first one, answering a shorter question.
  const median = medianChildhood()
  const lived = new Set(years.map((y) => y.age))
  const qMedianSoFar = foldYears(median.filter((y) => lived.has(y.age))).quality
  const qMedianFull = foldYears(median).quality
  const qDevotedFull = foldYears(devotedChildhood()).quality
  const level = CHILDHOOD.swingPoints * ((quality - qMedianSoFar) / (qDevotedFull - qMedianFull))

  let massMean = 0
  for (const k of SKILL_KEYS) massMean += mass[k]
  massMean /= SKILL_KEYS.length
  const shape = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) {
    shape[k] = (CHILDHOOD.shapeSwingPoints * (mass[k] - massMean)) / (SKILL_KEYS.length - 1)
  }

  return { years: rows, quality, level, shape }
}

/** ⭐⭐ THE GIRL THE PROLOGUE HANDS OVER, at fourteen – AND THE GIRL A LOCAL OPEN MEETS, at ten.
 *
 *  ⚠ IT TAKES A BUILD, NOT A SEED, and that is the RNG answer in one line: there is nothing here to
 *  draw with. `born` is `startingSkills(seed, profile)` – the draw the game has always made – and
 *  the nine years MOVE her inside the band rather than generating a second one.
 *
 *  ⭐ SINCE PHASE 12 `years` MAY BE THE YEARS SHE HAS ACTUALLY LIVED and not only the finished nine,
 *  which is what puts the childhood on a prologue court (`prologueEntrant`, src/prologue/pool.ts).
 *  There is no second entry point and no `age` argument: the length of the list IS her age, and
 *  `childhoodWalk` matches its median anchor to it. The clamp below is unchanged and still right at
 *  ten – pool.ts's own header is why: the eight children she meets are on the game's own attribute
 *  scale too, and their AGE is what says they are ten.
 *
 *  ⚠⚠ AND THE CLAMP IS THE ACCEPTANCE CRITERION MADE STRUCTURAL. She is held inside
 *  `STARTING_SKILL_BAND`, which is the exact range `startingSkills` draws from, so the set of girls
 *  a prologue can hand over is the SAME SET a freshly created fourteen-year-old is drawn from – not
 *  an overlapping one. A girl already born at the top of an axis cannot be raised past the top of
 *  what this game says a fourteen-year-old is, and that is the honest reading of the guard rather
 *  than an apology for it.
 *
 *  ⚠ POST-DRAW ARITHMETIC, exactly the shipped `relativeAgeHeadStart` pattern (world.ts, and the
 *  head start is applied AFTER this one on top of it): no schema, no new draw, no stream touched.
 *  Rounded to two decimals for the same reason `withHeadStart` rounds – the save carries the number
 *  and a twelfth decimal is noise in a diff. */
export function childhoodArrival(born: KidSkills, years: readonly ChildhoodYear[]): KidSkills {
  const walk = childhoodWalk(years)
  const out = { ...born }
  for (const k of SKILL_KEYS) {
    const [lo, hi] = STARTING_SKILL_BAND[k]
    const raw = born[k] + walk.level + walk.shape[k]
    out[k] = Math.round(Math.max(lo, Math.min(hi, raw)) * 100) / 100
  }
  return out
}

// --- THE THREE REFERENCE CHILDHOODS ---------------------------------------------------------------
//
// ⚠ TWO OF THEM ARE ARITHMETIC AND NOT FIXTURES. `medianChildhood` and `devotedChildhood` are the
// anchors `childhoodWalk` normalises the level against, so they are exported from the engine rather
// than kept in a test: changing one is a balance change and belongs in a spec with a bench run.

function path(practiceShare: number, teaching: number, focus: SessionKind = 'general'): ChildhoodYear[] {
  return CHILDHOOD_AGES.map((age) => ({
    age,
    practice: practiceShare * appetiteAt(age),
    teaching,
    focus,
  }))
}

/** The cheapest nine years a parent who kept going can produce: a third of what she could take, on
 *  a municipal court. Not "she never played" – that is a career the prologue ends, not a handover. */
export function neglectedChildhood(): ChildhoodYear[] {
  return path(0.35, 0)
}

/** THE ORDINARY CHILDHOOD, and the anchor: it lands EXACTLY on `startingSkills`, so a player who
 *  made unremarkable choices hands the game the girl it has always started with. */
export function medianChildhood(): ChildhoodYear[] {
  return path(0.7, 0.5)
}

/** Everything a parent can do without pushing her past what a child that age can take. Worth
 *  `CHILDHOOD.swingPoints` on every attribute – one extra year of junior development. */
export function devotedChildhood(): ChildhoodYear[] {
  return path(1, 1)
}
