// THE PRIVATE LIFE'S TWO NUMBERS, AND WHO SHE IS – one weekly rule, no draws, no strings.
//
// A new leaf BESIDE `condition.ts` and shaped like it on purpose: the two numbers are weather and
// standing, they compose into the match through the same seam condition already uses, and neither of
// them is ever printed. Design authority: docs/specs/who-she-is-2026-09.md (§4 wins on any drift) and
// docs/plans/the-private-life-build.md §§1b-1d. Every constant lives in `ECONOMY.spirit` /
// `ECONOMY.bond`; nothing below invents a number.
//
// =================================================================================================
// WHAT LIVES HERE, AND WHAT DELIBERATELY DOES NOT
// =================================================================================================
//
//   `temperament`   – WHO SHE IS. Drawn ONCE, at `createWorld`, off `seed:temperament`. The
//                     derivation is `temperamentFor` and there is exactly ONE of it: `createWorld`
//                     calls it and the v71 -> v72 MIGRATION calls the same one, which is the whole
//                     reason an old career "turns out to have always been her" instead of being
//                     re-rolled into somebody else. ⚠⚠ A second copy of this formula is the defect
//                     this module exists to make impossible – see `temperamentFor`.
//
//   `spirit`        – THE WEATHER. 0..100 in tenths, start 70. Written ONLY by `accrueSpirit`
//                     (pure arithmetic, ZERO draws on any stream), read ONLY by `spiritMatchFactor`
//                     at the match seam (`world/player.ts`). No meter, no tile, no bar, no arrow.
//
//   `bond`          – THE STANDING. 0..100 in steps of 0.5, start 70. Moves ONLY on parent
//                     DECISIONS – never on a scoreline, never on the weather – and then regresses
//                     toward 70 at 0.5/week. That regression rides `accrueSpirit`'s own pass: one
//                     weekly function, two numbers, so the week can never move one and forget the
//                     other.
//
// THE DECISION SITES that write `bond`, and they are the only ones (build plan §1d):
//
//   world/knock.ts     `decideKnock`     rest +1 · push −3 · push on a REPEATED part −5
//   world/phaseHerWeek `clearance === 'warn'` arm   played hurt −4
//   world/birthday.ts  `chooseGift`      day +2 / family week +3 / trip +4 ·
//                                        the ASKED-FOR material gift granted +2.5 · refused −1.5 ·
//                                        unprompted material 0
//   world/planner.ts   `resolveVacation` +1
//   this file          the season-boundary zero-vacations block −3 (and −3 to spirit, one moment)
//
// ⚠ WHAT IS HERE NOW AND WAS NOT WHEN THE NUMBERS LANDED (wave 1, step 4). This note used to end
// «this module produces two numbers and nothing that speaks», because her face, the Mood word and
// every diary line were blocked on the owner's wording pass (CLAUDE.md invariant 4 – every
// player-facing word is his). ⭐ THE PASS HAPPENED: `docs/specs/voice-bibles-2026-09.md` is approved
// and the ladder's four cut points were ruled 09.09. So this module now also owns the two pure
// READINGS of the numbers – `spiritBandOf` / `bondBandOf` – and the five approved words the first of
// them names. Still no line, no pool and no component: the diary owns those, and it is handed a
// word, a register and a band.
import { ECONOMY } from './economy'
import { clamp } from './condition'
import { pickInt, rngFromSeed } from './rng'
import { knockGoverns } from './knock'
import { schoolIsOver } from './kidLife'
import { isBlackoutWeek, isExamWeek, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from './season/calendar'
import { birthdayTurning } from './world/age'
import { vacationForWeek } from './world/bookings'
import { seasonStartWeek } from './world/ledger'
import type { BondBand, MoodRegister } from '../shared/protocol'
// ⚠ TYPE-ONLY, so this leaf adds no runtime edge back into the integration core – the same shape
// `academy.ts` uses one floor up and every `world/*.ts` module uses beside it.
import type { WorldState } from './world'

// =================================================================================================
// 1. WHO SHE IS
// =================================================================================================

/** ONE trait, two axes, four temperaments (who-she-is §1). Never chosen, never re-rolled, never
 *  shown as a label – the ids are for code and for the voice pools that wave 1's step 4 will hang
 *  off them.
 *
 *    sunny = open + steady · fiery = open + intense · quiet = private + steady · deep = private + intense
 */
export type Temperament = 'sunny' | 'fiery' | 'quiet' | 'deep'

/** All four, in the order the two axis picks below produce them. Exported so a sweep can walk the
 *  set by name instead of re-listing it (the flat-pool completeness pin of step 4 will need it). */
export const TEMPERAMENTS: readonly Temperament[] = ['sunny', 'fiery', 'quiet', 'deep']

/** THE INTENSITY AXIS, projected. Owns how hard events LAND on her and how long a feeling holds –
 *  the perturbation scale and the return rate, and nothing else in wave 1. */
export function temperamentIntensity(temperament: Temperament): 'steady' | 'intense' {
  return temperament === 'sunny' || temperament === 'quiet' ? 'steady' : 'intense'
}

/**
 * ⚠⚠ THE ONE DERIVATION. `createWorld` calls this and the v71 -> v72 migration calls THIS SAME
 * FUNCTION on the career's own seed – which is the entire reason a career already in flight simply
 * turns out to have always been her, bit-stable, with zero draws on any stream and no re-roll
 * anxiety. TWO COPIES OF THIS FORMULA IS THE DEFECT THE WAVE EXISTS TO AVOID: a migration with its
 * own spelling would hand a live save a different girl from the one `createWorld` would have drawn,
 * and nothing downstream could ever tell which of them was real.
 *
 * ⚠ (seed)-KEYED AND NOTHING ELSE – not the calendar, not the player, not the week. She was born
 * this way, which is CLAUDE.md invariant 2's strongest form: a purpose-scoped sub-stream
 * (`seed:temperament`), re-derived at the call site, persisting nothing, MAIN untouched.
 *
 * TWO AXIS PICKS, one per axis, uniform – so the four temperaments come out 25/25/25/25 by
 * construction rather than by a four-way table that would have to be kept summing to one. Openness
 * is drawn first, then intensity; the order is fixed here for ever, because changing it would
 * re-assign every existing career's temperament without changing a single stored byte.
 */
export function temperamentFor(seed: string): Temperament {
  const r = rngFromSeed(`${seed}:temperament`)
  const open = pickInt(r, 0, 1) === 0
  const steady = pickInt(r, 0, 1) === 0
  return open ? (steady ? 'sunny' : 'fiery') : steady ? 'quiet' : 'deep'
}

// =================================================================================================
// 2. THE MATCH SEAM
// =================================================================================================

/** The SAME curve family as `conditionMatchFactor`, with spirit's own knee and floor: no penalty at
 *  all while she is at or above the knee (60), then linear down to the floor (0.90) at spirit 0.
 *
 *  ⚠ NO BONUS ABOVE THE KNEE, exactly as condition has none above 70. Baseline 70 reads 1.0 and so
 *  does a lifted 75 – what being lifted is worth is DISTANCE FROM THE KNEE (she falls to 47 instead
 *  of 42 and is back sooner), not a stat rebate. Symmetric upside is form's property, not spirit's.
 *
 *  Measured against the yardstick in docs/specs/form-and-slump.md §1: a post-break-up spirit of 47
 *  reads 0.978, i.e. ~0.9-3.4 pp of match-win probability – smaller than fatigue's worst at every
 *  point of the curve by construction (floor 0.90 against condition's 0.55). */
export function spiritMatchFactor(spirit: number): number {
  const s = ECONOMY.spirit
  if (spirit >= s.knee) return 1
  return s.floor + (1 - s.floor) * (spirit / s.knee)
}

// =================================================================================================
// 2b. THE TWO READINGS – the only road either number has to a screen or a sentence
// =================================================================================================
//
// ⚠⚠ THE FOG LAW, RESTATED WHERE IT IS ENFORCED (who-she-is §5; the build plan §1e). `spirit` and
// `bond` are never shown as numbers – no meter, no bar, no arrow, no tile figure, on any surface,
// ever. These two functions are the ENTIRE surface area of both: a band goes out, the number never
// does. Everything downstream (the Mood word, the emotion, the diary's licences) reads a band.

/** The five rungs of the Mood ladder, as ids. The WORDS they map to are the owner's and live in
 *  `MOOD_WORD` below; nothing in the code decides them. */
export type SpiritBand = 'glowing' | 'bright' | 'steady' | 'dimmed' | 'heavy'

/** All five, top down – so a sweep walks the ladder by name instead of re-listing it. */
export const SPIRIT_BANDS: readonly SpiritBand[] = ['glowing', 'bright', 'steady', 'dimmed', 'heavy']

/**
 * ⭐⭐ THE FIVE MOOD WORDS – APPROVED COPY, `docs/specs/voice-bibles-2026-09.md` §C, verbatim.
 *
 * ⚠⚠ CLAUDE.md INVARIANT 4 BINDS THIS TABLE TWICE OVER: it is nothing but wording, and the wording
 * is the owner's. No agent renames one of these, and no agent adds a sixth – the ladder is five
 * words wide because he ruled five.
 *
 * ⚠ «Steady» IS SHARED WITH CONDITION'S OWN WORD BY HIS RULING (who-she-is §7, tail 4: «the neutral
 * state is one state and gets one word»). That is not a collision to be resolved: the two Mood tiles
 * already print `Steady` for the `norm` face, so the neutral rung of this ladder and the neutral rung
 * of the body's say the same thing whichever channel is carrying the week. The gamma lives in the
 * other four.
 */
export const MOOD_WORD: Record<SpiritBand, string> = {
  glowing: 'Glowing',
  bright: 'Bright',
  steady: 'Steady',
  dimmed: 'Dimmed',
  heavy: 'Heavy',
}

/** WHICH RUNG OF THE LADDER THIS WEEK IS ON. The four cut points are `ECONOMY.spirit.mood`, ruled
 *  09.09, each anchored to a mechanical fact – see the constants for the anchors. Pure, total, and
 *  the ONE reader of them. */
export function spiritBandOf(spirit: number): SpiritBand {
  const m = ECONOMY.spirit.mood
  if (spirit < m.heavyBelow) return 'heavy'
  if (spirit < m.dimmedBelow) return 'dimmed'
  if (spirit >= m.glowingFrom) return 'glowing'
  if (spirit >= m.brightFrom) return 'bright'
  return 'steady'
}

/** ...and the same ladder collapsed to the three registers speech needs (who-she-is §5b). Derived
 *  FROM THE BAND rather than from the number a second time, so the word she is handed and the
 *  register her line is licensed under can never be readings of two different weeks. */
export function moodRegisterOf(band: SpiritBand): MoodRegister {
  if (band === 'glowing' || band === 'bright') return 'bright'
  if (band === 'steady') return 'level'
  return 'low'
}

// ⚠ THE RUNG DISTANCE THIS LADDER IS COMPARED ON IS *NOT* HERE, deliberately, and there is exactly
// one spelling of it: `MOOD_DEVIATION` in `shared/avatarEmotion.ts`, beside the body ladder it has to
// be compared against. The ruled collision rule («injury first, then the LARGER DEVIATION of body vs
// mood») is a statement about her FACE, and a second copy of the mapping on this side is precisely
// the drift that would let the word and the picture describe two different weeks.

/** WHAT THE PARENT HAS BUILT WITH HER, as the four bands the diary's channels read (build plan §1e).
 *  A band, never the number – same law as the ladder above. */
export function bondBandOf(bond: number): BondBand {
  const c = ECONOMY.bond.band
  if (bond >= c.close) return 'close'
  if (bond >= c.steady) return 'steady'
  if (bond >= c.strained) return 'strained'
  return 'cold'
}

// =================================================================================================
// 3. THE WEEKLY RULE – ⚠⚠ RETURN FIRST, OFF LAST WEEK'S VALUE, THEN THIS WEEK'S EVENTS
// =================================================================================================

/** Spirit is stored in TENTHS: the intensity multipliers produce fractions (±0.8 / ±1.25 of an
 *  integer row), and the rounding is NAMED rather than left to float drift. Every write goes through
 *  this. */
function roundTenth(x: number): number {
  return Math.round(x * 10) / 10
}

/** Bond moves in HALVES – the delta table has a 2.5 and a −1.5 in it and the regression is 0.5, so
 *  every write lands on the grid the design named (0..100 in steps of 0.5). */
function roundHalf(x: number): number {
  return Math.round(x * 2) / 2
}

/** One step of `by` toward `target`, never past it. The shape both numbers' returns share. */
function stepToward(value: number, target: number, by: number): number {
  const gap = target - value
  if (gap === 0) return value
  return gap > 0 ? value + Math.min(by, gap) : value - Math.min(by, -gap)
}

/**
 * THE SEASON-BOUNDARY ZERO-VACATIONS BLOCK, as a predicate – true on the ONE week a season wraps
 * with not a single family week in it, false on every other week of the career.
 *
 * ⚠ IT LIVES IN THE WEEKLY PASS AND NOT AT A DECISION SITE, and that is the honest place for it:
 * it is the only row of either table that is an ABSENCE rather than a click, so there is no site to
 * put it at – nobody decided anything, which is precisely the complaint. Both numbers take it in the
 * same moment (spirit −3, bond −3), from one predicate, so they can never disagree about whether the
 * family had a holiday.
 *
 * ⚠ THE WEEK IS `maybeFireSeasonWrapUp`'s OWN WEEK TEST – the first off-season week, the moment the
 * season is over in every other sense too. It is not the season-OPENING boundary (`week % 52 === 0`)
 * for a mechanical reason as well as a narrative one: the trailing ledgers below are readable here
 * and no longer readable there.
 *
 * ⚠ AND "BOOKED" IS READ FROM BOTH ENDS, because neither ledger alone can answer it. `vacations`
 * holds what is still AHEAD (it is pruned to a four-week trailing window, so the holiday she took in
 * week 12 is long gone from it), and `gearRestWeeks` – whose one writer, `recordGearRestWeek`, is
 * gated on exactly `vacationForWeek(world, world.week) !== undefined` – is the 52-week record of the
 * family weeks that have already RESOLVED. Their union over the season block is every family week of
 * the season, taken and still to come. The field is read inline rather than through
 * `gearRestWeeksOf` on purpose: `world/kit.ts` carries `offers`/`equipment`/`endings` behind it, and
 * this module is a leaf.
 */
export function seasonWrapsWithNoVacation(world: WorldState): boolean {
  if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) return false
  const from = seasonStartWeek(world.week)
  const to = from + WEEKS_PER_YEAR
  const inSeason = (w: number) => w >= from && w < to
  if ((world.gearRestWeeks ?? []).some(inSeason)) return false
  return !(world.vacations ?? []).some((v) => inSeason(v.week))
}

/**
 * THIS WEEK'S PERTURBATION, in raw (unscaled) points – the build plan §1b table, verbatim, read off
 * facts the world already carries. ZERO draws. Rows compose additively: a week can be several things
 * at once and each one is priced once.
 *
 * ⚠ THE EXAM ROW AND THE BLACKOUT ROW CAN BOTH FIRE, and that is the table as written rather than an
 * oversight: `isBlackoutWeek` is the off-season OR an exam block, so a grinding exam fortnight reads
 * −2 +1 = −1 net. School is out of the way of both after `schoolIsOver`.
 *
 * ⚠ THE VACATION ROW READS THE BOOKING, NOT `resolveVacation`'s RETURN. That call is four steps
 * further down the same phase (this one sits immediately after `accrueCondition`), so the honest
 * question here is the one it asks first – is there a booking for this week – and it is the same
 * `vacationForWeek` both of them read.
 */
function weekPerturbation(world: WorldState, wrapWithNoVacation: boolean): number {
  const p = ECONOMY.spirit.perturb
  const schoolOver = schoolIsOver(world.week, world.profile.birthMonth)
  let d = 0
  if (world.injury !== null) {
    d += world.injury.sinceWeek === world.week ? p.injuryOnset : p.laidUpWeek
  }
  if (knockGoverns(world.knock, world.week) && world.knock?.choice === 'push') d += p.knockPushedWeek
  if (vacationForWeek(world, world.week) !== undefined) d += p.vacationResolved
  if (birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay) !== null) {
    d += p.birthdayWeek
  }
  if (isExamWeek(world.week, schoolOver) && world.plan.train >= ECONOMY.spirit.examTrainFloor) {
    d += p.hardExamWeek
  }
  if (isBlackoutWeek(world.week, schoolOver)) d += p.blackoutWeek
  if (wrapWithNoVacation) d += p.seasonWithNoVacation
  return d
}

/**
 * ⭐⭐ THE WEEK, FOR BOTH NUMBERS. Its own call in `resolveBodyAndPlanner`, immediately after
 * `accrueCondition(world, playedThisWeek)` – never a parameter of it, because that function's
 * arity-2, zero-RNG contract is pinned by B1 in tests/condition.test.ts and must not gain one.
 *
 * ⚠⚠ THE ORDER IS THE WHOLE MECHANIC (the 09.09 ORDER FIX, who-she-is §4). The return runs FIRST,
 * off LAST week's value, and only THEN does this week's event land on top. In the drafted
 * perturb-then-return order a steady girl's vacation (+5 × 0.8 = +4) met the same-tick return of 4
 * and VANISHED – and with it most ordinary weather and most of the Mood ladder's words. Get this
 * backwards and the wave is worthless, which is why every perturbation row has a from-baseline unit
 * test per intensity arm: the next week must show the FULL scaled delta.
 *
 * ⚠ THE TARGET IS `baseline`, FLAT. §1b's effective baseline is `baseline + attachmentLift` while
 * the attachment slot is full, and the slot does not exist until wave 3 – so the lift is DECLARED in
 * `ECONOMY.spirit` and read by nobody, deliberately. Wiring a lift to a slot that cannot be full
 * would be a rule with no way to be wrong.
 *
 * ⚠ ZERO DRAWS, ON ANY STREAM. Pure arithmetic over facts the world already holds, which is the
 * strongest possible answer to invariant 2 – the frozen capture (41550 / e6b0c709) cannot see this
 * function.
 *
 * ⚠ THE `??` COURTESIES are the same one `accrueFinance` extends to `careerTotals`: probe worlds
 * hand-built in tests and tools predate these three fields, and a defensive read costs nothing while
 * a crash on a bench world costs an afternoon. Every real world – created or migrated – carries all
 * three.
 */
export function accrueSpirit(world: WorldState): void {
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  const intensity = temperamentIntensity(world.temperament ?? temperamentFor(world.seed))
  // ⚠ ASKED ONCE AND HANDED TO BOTH, so the two numbers can never disagree about whether the family
  // had a holiday this season – the same "asked once, carried" doctrine the masseur's fare follows.
  const wrapWithNoVacation = seasonWrapsWithNoVacation(world)

  // 1. THE RETURN – off last week's value, toward the baseline, capped by the gap so it can never
  //    overshoot into an oscillation.
  const returned = stepToward(world.spirit ?? s.baseline, s.baseline, s.returnPerWeek[intensity])
  // 2. ...and THEN what this week did to her, scaled by how hard things land on this girl.
  const moved = returned + weekPerturbation(world, wrapWithNoVacation) * s.perturbationScale[intensity]
  world.spirit = roundTenth(clamp(moved, s.min, s.max))

  // 3. AND THE STANDING, ON THE SAME PASS – one weekly function, two numbers. Same shape, same
  //    order: the regression toward 70 first, then the week's own event. The zero-vacations row is
  //    the only thing here that can move `bond` without a decision, and it is an absence of one.
  const settled = stepToward(world.bond ?? b.start, b.start, b.regressionPerWeek)
  world.bond = roundHalf(clamp(settled, b.min, b.max))
  if (wrapWithNoVacation) applyBondDelta(world, b.delta.seasonWithNoVacation)
}

/** THE ONE WRITER for every `bond` delta – clamped to 0..100 and rounded onto the 0.5 grid, so no
 *  decision site has to remember either rule. `world.bond` is the only field it touches. */
export function applyBondDelta(world: WorldState, delta: number): void {
  const b = ECONOMY.bond
  world.bond = roundHalf(clamp((world.bond ?? b.start) + delta, b.min, b.max))
}
