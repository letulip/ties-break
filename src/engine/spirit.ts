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
//   `spiritShock`   – THE MARK AN ENDING LEFT (v75, wave 4's T3), `{week, kind, weeks?}` or null. SET
//                     by `rollEnds` (world/lifeBeat.ts §8) on the week an attachment ends, and CLEARED
//                     here, in `accrueSpirit`'s tail, once she is back within `shockClearWithin` of
//                     her plain baseline. ⚠ This file owns the second half only: the points it is
//                     worth are the weekly rule's, the fact itself is the hazard's. It exists so that
//                     wave 5's psychologist can tell a girl who is under her line from a girl who is
//                     under her line BECAUSE somebody left – 48 looks the same either way.
//                     ⭐ v76's T4 IS THE WAVE THAT CASHED THAT SENTENCE IN, and the optional `weeks`
//                     is the counter it needed (ruling C): the number of weeks the recovery focus
//                     actually worked this shock, incremented here and read once, at the clear.
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
// them names. Still no pool and no component: the diary owns those, and it is handed a word, a
// register and a band.
//
// ⚠⚠ AND SINCE v76's T4 THIS MODULE WRITES EXACTLY ONE FEED ROW, WHICH IS THE ONE SENTENCE OF THE
// BANNER ABOVE THAT HAD TO MOVE («still no LINE» is no longer true). It is `RECOVERY_RECEIPT`, and
// it is here for a reason that is a property of the code rather than a preference: the recovery
// focus's receipt is owed AT THE CLEAR, the clear happens in `accrueSpirit`'s tail, and
// `world.spiritShock` is null by the time any caller could look. Writing it anywhere else would mean
// a second reader re-deciding «did she come back this week», which is the shape this file refuses
// everywhere else. ⚠ WHAT DID **NOT** MOVE: the row is written through `addEvent` like every other,
// it carries no `amountCents` and no figure (the no-cents law), and this module still owns no pool,
// no register table and no component – one line, at one moment, and `resolveMasseurReturn` one seat
// over is the same idiom.
//
// ⚠ AND IT STILL IMPORTS NOTHING FROM `world/psychologist.ts`, WHICH IS MEASURED AND NOT ASSUMED:
// that module imports `bondBandOf` from THIS file at runtime (its consent gate), so an import back
// would close the value loop the `activeEpisode` note below records being caught once already. The
// seat's three fields are read straight off `WorldState` here instead – see `shockBeingWorked`.
import { ECONOMY } from './economy'
import { clamp } from './condition'
import { pickInt, rngFromSeed } from './rng'
import { knockGoverns } from './knock'
import { schoolIsOver } from './kidLife'
import { isBlackoutWeek, isExamWeek, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from './season/calendar'
import { birthdayTurning } from './world/age'
import { vacationForWeek } from './world/bookings'
// ⚠ `addEvent` JOINS THE `seasonStartWeek` IMPORT IN v76's T4 AND OPENS NO NEW ARROW – `world/ledger.ts`
// is the leaf this file already reaches for, it knows `WorldState` as a TYPE ONLY, and it draws on no
// stream (its own banner). The receipt the recovery focus prints at the clear is the one player-facing
// ROW this module has ever written; see the ⚠⚠ note beside `RECOVERY_RECEIPT` for why it is here.
import { addEvent, seasonStartWeek } from './world/ledger'
// ⚠⚠ FROM `world/loveEpisodes` AND DELIBERATELY NOT FROM `world/lifeBeat`, WHICH IS WHERE IT WAS
// DECLARED UNTIL T4. `lifeBeat.ts` imports six values from THIS file at runtime (`applyBondDelta`,
// `bondBandOf`, `moodRegisterOf`, `spiritBandOf`, `temperamentFor`, `temperamentOpenness`), so an
// import of it here would close a value loop – the brief flagged the hazard and it was real. The
// selector moved verbatim to a leaf whose only import is a type; the arrow stays one-way and
// `src/engine/world/*` still has no runtime cycles. See that module's banner for the whole of it.
import { activeEpisode } from './world/loveEpisodes'
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

/** THE OPENNESS AXIS, projected – `temperamentIntensity`'s twin, and the other half of the one trait.
 *  Owns «her flow with people» (who-she-is §1): wave 3's private life reads it for BOTH partner draws
 *  – how likely she is to want the thing said out loud, and how long the parent waits to hear it –
 *  and nothing else in the engine reads it yet.
 *
 *  ⚠ A PROJECTION, NEVER A SECOND TRAIT. The mapping is the one this section's header already states
 *  (`sunny`/`fiery` are the open pair, `quiet`/`deep` the private one), written down ONCE and here,
 *  beside its twin – so `world/lifeBeat.ts` does not grow a second spelling of the same axis, which
 *  is the drift `temperamentFor`'s own ⚠⚠ note refuses one paragraph down.
 *
 *  ⚠ AND THE UNION IS DELIBERATELY `LoveEpisode['wants']`'s. Her REGISTER (born this way) and her
 *  drawn WANT about one particular attachment are two different facts that happen to be spelled with
 *  the same two words; the draw weights one toward the other (`drawPartnerWants`) and they are free
 *  to disagree – which is the whole reason the want is drawn at all instead of read off here. */
export function temperamentOpenness(temperament: Temperament): 'open' | 'private' {
  return temperament === 'sunny' || temperament === 'fiery' ? 'open' : 'private'
}

/** ⭐ THE COMPOSITION – the inverse of the two projections above, and the ONE spelling of it (v76,
 *  the psychologist's year). Two axis poles in, one of the four buckets out.
 *
 *  ⚠⚠ EXTRACTED RATHER THAN COPIED, and the reason is the ⚠⚠ block on `temperamentFor` directly
 *  below, applied to the OTHER half of the mapping. That note refuses a second spelling of the
 *  seed-to-girl derivation; this refuses a second spelling of the pole-to-bucket table, which v76's
 *  `expressedTemperamentOf` would otherwise have had to write out a second time. `temperamentFor`
 *  now composes through here, so the birth draw and the expressed read agree by construction instead
 *  of by two authors' care. ⚠ NOT A BEHAVIOUR CHANGE: the same conditional, the same order, the same
 *  two `pickInt` calls in front of it – the section header's own table («sunny = open + steady ·
 *  fiery = open + intense · quiet = private + steady · deep = private + intense»), written once.
 *
 *  ⚠ NAMED `temperamentFromAxes` AND NOT `temperamentOf`, WHICH WAS THE FIRST SPELLING AND HAD TO
 *  GO: `world/lifeBeat.ts` already has a PRIVATE `temperamentOf(world)` of its own – a different
 *  signature answering a different question (the defensive `?? temperamentFor(seed)` read of the v72
 *  field). Nothing collided at compile time, since that one is not exported and this one is not on
 *  the `engine/world` barrel; the collision would have been in a READER's head, and in
 *  `node scripts/world-map.mjs <symbol>`, which is the tool the repo keeps for exactly that
 *  question. One name, one meaning. */
export function temperamentFromAxes(openness: 'open' | 'private', intensity: 'steady' | 'intense'): Temperament {
  return openness === 'open'
    ? intensity === 'steady'
      ? 'sunny'
      : 'fiery'
    : intensity === 'steady'
      ? 'quiet'
      : 'deep'
}

/**
 * ⭐⭐⭐ WHAT THE MECHANICS READ (v76, the psychologist's year – who-she-is §2a, the 09.09 third-sitting
 * re-cut: «identity is IMMUTABLE – what drifts is WALLS AND REGULATION, expression over an unchanging
 * nature»). Her BIRTH temperament with each FLIPPED axis inverted, mapped back through the same four
 * buckets by the one composition above.
 *
 * ⚠⚠ IT IS NOT A SECOND TEMPERAMENT AND IT NEVER WRITES ONE. `world.temperament` is BIRTH, FOREVER –
 * this function does not touch it, and no caller may store what this returns. A career hashes the
 * same girl at week 0 and at retirement; what this reads is `world.wallsFlipped`, the hysteresis
 * state T7 maintains, and the inversion is recomputed from it on every call.
 *
 * ⚠⚠ THE FENCE (§3, and the wave-5 brief §0.2) – WHO MAY CALL THIS AND WHO MUST NEVER. The MECHANICS
 * read expression: the arrival and ends hazard multipliers and their cooldowns, the feed-lag and
 * wants draws, `returnPerWeek` and `perturbationScale`. The VOICES read birth and only birth – the
 * voice bibles, the tier-0/1 pools, the prompt registers and the birthday-ask weighting – because
 * «the voice bibles read birth alone» is §3's own sentence and a quiet girl behind walls still has a
 * quiet girl's syntax. A call from a voice site is a finding, not a tuning miss.
 *
 * ⚠⚠ AND IN T1 IT HAS ZERO CALL SITES IN `src/` OUTSIDE THIS MODULE, WHICH IS THE POINT OF LANDING IT
 * HERE. Wave 5's T7 re-points the mechanics one swap at a time, each with its own ⚠ comment; this
 * exists first so the zero-diff proof («leanings 0, nothing flipped, and every temperament read is
 * still birth») has something to be proved ABOUT before any reader moves, and so those swaps have a
 * floor to stand on. While `wallsFlipped` is `{open: false, reg: false}` – which is what `createWorld`
 * writes and what the v75 -> v76 migration back-fills on every older save – this returns birth
 * unchanged, and a migrated career therefore plays byte-identical tennis.
 *
 * ⚠ THE ZERO ARM IS TRUE BY CONSTRUCTION AND IS WORTH NOTHING ON ITS OWN. Both flags false means the
 * two projections round-trip, so `expressedTemperamentOf(w) === w.temperament` is arithmetic rather
 * than evidence. What makes it mean anything is the POSITIVE control beside it – flip an axis by hand
 * and the bucket must MOVE, to the specific right one, for all four births on each axis and on both
 * at once. That enumeration is in tests/wave5-psychologist-schema.test.ts §C and it is why §D's zero
 * arm is admissible at all.
 *
 * ⚠ `wallsLean` IS DELIBERATELY NOT READ HERE. The leaning is the slow accumulator; the FLIP is the
 * state, armed past ±`flipArm` and released only inside ±`flipRelease` (T7). Reading the leaning
 * directly would be the flicker the hysteresis exists to abolish – «a flip is an event of seasons,
 * never a flicker» – and would put a threshold in two places at once.
 */
export function expressedTemperamentOf(world: WorldState): Temperament {
  const birth = world.temperament
  const flipped = world.wallsFlipped
  const openness = flipped.open
    ? temperamentOpenness(birth) === 'open'
      ? 'private'
      : 'open'
    : temperamentOpenness(birth)
  const intensity = flipped.reg
    ? temperamentIntensity(birth) === 'steady'
      ? 'intense'
      : 'steady'
    : temperamentIntensity(birth)
  return temperamentFromAxes(openness, intensity)
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
 *
 * ⚠ v76: THE FOUR-WAY CONDITIONAL MOVED INTO `temperamentFromAxes` ABOVE AND THE DRAWS DID NOT MOVE AT ALL.
 * Two `pickInt` calls, in this order, off this key – byte for byte what they were. What changed is
 * that the pole-to-bucket table is now written once instead of twice, which is this function's own
 * ⚠⚠ note applied to the half of the mapping it did not already own.
 */
export function temperamentFor(seed: string): Temperament {
  const r = rngFromSeed(`${seed}:temperament`)
  const open = pickInt(r, 0, 1) === 0
  const steady = pickInt(r, 0, 1) === 0
  return temperamentFromAxes(open ? 'open' : 'private', steady ? 'steady' : 'intense')
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

// =================================================================================================
// 3b. ⭐⭐⭐ «BACK ON HER FEET» – THE RECOVERY FOCUS, v76's T4 (wave 5, the psychologist's year)
// =================================================================================================
//
// THE WHOLE OF THE MECHANIC: while a shock the seat has ALREADY had a week to work on is live and the
// family is paying a psychologist whose chosen year is `'recovery'`, her weekly return is
// `returnPerWeek[intensity] + recoverySlope[rung]` instead of `returnPerWeek[intensity]`. One step,
// the same `stepToward` clamp, the same tenths rounding, and it dies with the clear because the
// predicate below reads the live mark. The spec's §2 row and the wave-5 brief's §2 T4.
//
// ⚠⚠ ONE PREDICATE, AND IT IS ONE RATHER THAN TWO ON THE ARCHITECT'S OWN CORRECTION. The first
// drafting of ruling C said «the slope applies while a shock is live» and «the counter counts the
// weeks it applied» – two sentences that name DIFFERENT SETS, and the difference is the landing week.
// It matters twice, so the predicate carries `shock.week < world.week` and both readers ask THIS
// function:
//
//   · THE RETURN RUNS OFF LAST WEEK'S VALUE, BEFORE THIS WEEK'S SHOCK LANDS – the 09.09 ORDER FIX is
//     the whole reason `accrueSpirit` is shaped the way it is. On the landing week the psychologist
//     would therefore be working a shock that has not happened yet; if she was already under her line
//     for some other reason, that is a real and wrong speed-up of a recovery from something else.
//   · A SHOCK CAN LAND AND CLEAR IN THE SAME WEEK – 90 − 22 = 68 is exactly the clear bar. Counting
//     the landing week would give `weeks = 1` on a shock that cost her nothing, and the receipt would
//     print «she came back sooner than last time» for work nobody did. The `weeks >= 1` half of
//     `recoveryReceiptEarned` exists for precisely that world.

/** ⚠⚠ THE ONE PREDICATE – the shock the seat is working THIS week, or null. Both the slope term and
 *  the `weeks` counter read this and nothing else, which is what makes «the counter counts the weeks
 *  the slope applied» a fact about the code rather than a claim about two conditions that happen to
 *  be typed the same today.
 *
 *  ⚠ IT RETURNS THE MARK RATHER THAN A BOOLEAN so the counter can increment the very object the term
 *  was priced from – no second lookup, no narrowing dance, and no way for the two to disagree about
 *  WHICH shock was worked.
 *
 *  ⚠ `psychologistHired` AND `psychologistFocus` ARE READ STRAIGHT OFF THE WORLD, and that is the
 *  dependency direction rather than a shortcut: `world/psychologist.ts` imports `bondBandOf` from
 *  this file at runtime, so importing its predicates back would close a value loop (the banner's own
 *  measurement, and the hazard the `activeEpisode` import note records being caught once already).
 *  ⚠ THE HONEST LIMIT OF THAT, NAMED: `psychologistWorksThisWeek` ALSO stands the seat down at
 *  college and on a booked family week, and its own comment predicts every focus pass will read it.
 *  This one cannot, so it reads what the brief and ruling C both specify – `hired`. Carried to the
 *  architect rather than decided here; T5-T7 live in modules with no such loop and can ask the real
 *  predicate. Pure read, ZERO draws. */
function shockBeingWorked(world: WorldState): WorldState['spiritShock'] {
  const shock = world.spiritShock ?? null
  if (shock === null || shock.week >= world.week) return null
  if (!(world.psychologistHired ?? false)) return null
  return (world.psychologistFocus ?? null) === 'recovery' ? shock : null
}

/** HOW MANY POINTS A WEEK OF HIS WORK IS WORTH – `ECONOMY.psychologist.recoverySlope` at the rung the
 *  family is paying for.
 *
 *  ⚠ THE `??` FALLBACK IS `psychologistRungOf`'s, MIRRORED: the rung is validated at its one writer
 *  (`setPsychologistRung`), but a hand-built probe world may hold anything, and an unknown value
 *  falls back to the DEFAULT RUNG rather than to `undefined` arithmetic that would poison the whole
 *  weekly sum. ⚠ The two spellings are pinned as an EQUIVALENCE in the T4 suite rather than trusted:
 *  the slope's index and the rung `psychologistRungOf` returns are asked to agree over all three.
 *  Pure read, ZERO draws. */
function recoverySlopeFor(world: WorldState): number {
  const p = ECONOMY.psychologist
  return p.recoverySlope[world.psychologistRung ?? p.defaultRung] ?? p.recoverySlope[p.defaultRung]
}

/** ⭐⭐ MAY THE RECEIPT BE PRINTED for a shock that has just cleared – the architect's ruling C, as
 *  one expression, exported so the pin reads the engine's own rule instead of re-typing it.
 *
 *  «HELD FOR AT LEAST HALF THE SHOCK'S WEEKS», where the span is `week − shock.week` at the clear and
 *  the HELD half is the counter. ⚠ THE `weeks >= 1` GUARD IS NOT DECORATION: a shock that lands and
 *  clears in one week has span 0, and `0 * 2 >= 0` would print a receipt for work nobody did. Pure,
 *  total, zero draws. */
export function recoveryReceiptEarned(shock: NonNullable<WorldState['spiritShock']>, week: number): boolean {
  const weeks = shock.weeks ?? 0
  return weeks >= 1 && weeks * 2 >= week - shock.week
}

/** ⭐⭐ THE RECEIPT – one no-cents feed line at the clear week, and the travelling-team §4 legibility
 *  law made audible for this focus («you paid, and you cannot tell» is the failure).
 *
 *  ⚠⚠ DRAFT (CLAUDE.md invariant 4), and it is the spec's §2 own working sentence for this focus
 *  transcribed rather than invented. NO FIGURE IN IT – the no-cents law (the wave-3 brief §0.5): the
 *  receipt says the work showed, never what it cost or how many points it was worth. No pronoun for
 *  the psychologist, short dash idiom, and nothing that names a session. */
export const RECOVERY_RECEIPT = 'She came back sooner than last time.'

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
 * ⭐⭐ THE TARGET IS THE **EFFECTIVE** BASELINE, AND SINCE T4 (11.09, the private life's wave 3) THAT
 * IS `baseline + attachmentLift` WHILE SOMEONE IS THERE. This note used to end «the slot does not
 * exist until wave 3 – so the lift is DECLARED in `ECONOMY.spirit` and read by nobody, deliberately»;
 * wave 3 built the slot (`world/loveEpisodes.ts`, `activeEpisode`) and this is the step that wires it.
 *
 * ⚠⚠ AND IT ARRIVES THROUGH THE RETURN RULE ABOVE, WITH NO ONE-OFF BUMP ANYWHERE. The owner's
 * sentence is «lifts a little and stays lifted» (build plan §1b): moving the TARGET is the whole
 * mechanism, so she walks the five points up at her own return rate – one step for a steady girl
 * (5/wk), two for an intense one (3 then 2), which is the design's «over ~2 weeks» – and she walks
 * back down the same way, at the same rate, the week the slot empties. A
 * `+5` added to `weekPerturbation` would have produced a spike that decays instead – the opposite
 * shape, and the one thing the design names. `weekPerturbation` therefore has no row for this and
 * `tests/spirit.test.ts`'s re-aimed guard asserts the constant is read HERE and nowhere else.
 *
 * ⚠ NO ARITHMETIC ELSEWHERE MOVES. `spiritMatchFactor` is flat 1.0 from the knee (60) up, so a
 * lifted 75 plays exactly the tennis a baseline 70 does; what the lift buys is DISTANCE FROM THE
 * KNEE when something knocks her down. And `baseline + attachmentLift` (75) sits UNDER `mood.glowingFrom`
 * (80) by construction – pinned in tests/spirit.test.ts – so being attached is not a permanent
 * residence in the top Mood band.
 *
 * ⭐⭐⭐ AND SINCE v75's T3 (12.09) IT IS ALSO WHERE AN ENDING IS PAID FOR – **ADDED AFTER THE SCALE,
 * ON ITS OWN TERM, AND THAT IS THE ARCHITECT'S RULING C RATHER THAN A PLACEMENT PREFERENCE**
 * (docs/plans/life-wave-4-rulings-2026-09.md §C). who-she-is §4's −22 steady / −34 intense are ALREADY
 * intensity-scaled – one base of about −27.5 seen through the two `perturbationScale` values
 * (−27.5 × 0.8 = −22.0, −27.5 × 1.25 = −34.4) – so a row inside `weekPerturbation` would scale them a
 * SECOND time, to −17.6 / −42.5. The constant's own note in `economy.ts` carries the reconstruction;
 * this is the site that obeys it. Same weekly arithmetic, one extra summand, no second curve and no
 * second multiplication.
 *
 * ⚠⚠ IT READS A FACT `rollEnds` WROTE AND OWNS THE NUMBER ITSELF, which is what keeps this function
 * the ONE writer of `world.spirit` in the engine. The ending (world/lifeBeat.ts §8, four calls
 * earlier in the same tick) stamps `world.spiritShock = {week, kind}`; this pass applies the kind's
 * delta on exactly the week that matches, and clears the stamp in its tail once she is back within
 * `shockClearWithin` of her PLAIN baseline (68 – ruling D). The stamp is a mark and never the
 * physics: a spirit of 48 looks identical whichever way it got there, and what it buys is wave 5's
 * psychologist being able to ask why.
 *
 * ⚠⚠ AND THERE IS NO RECOVERY CURVE, ANYWHERE, BY DESIGN. She comes back at `returnPerWeek` toward a
 * baseline the lift has just stopped lifting – the standing weekly rule and nothing else. A second
 * return rate, a «recovering» flag or a taper read off `spiritShock` would all be the same mistake,
 * and §4's own prediction (from a lifted 75: ~1–2 weeks under the knee for a steady girl, ~6–7 for an
 * intense one) is a MEASUREMENT of this arithmetic rather than a target to be engineered toward.
 *
 * ⚠ ZERO DRAWS, ON ANY STREAM. Pure arithmetic over facts the world already holds, which is the
 * strongest possible answer to invariant 2 – the frozen capture (41550 / e6b0c709) cannot see this
 * function. The shock term does not change that: it reads a persisted field, not a stream.
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

  // 1. THE RETURN – off last week's value, toward the EFFECTIVE baseline, capped by the gap so it
  //    can never overshoot into an oscillation.
  //    ⭐ THE ONE READ OF `attachmentLift` IN THE ENGINE (T4): the target rises by it for exactly as
  //    long as `activeEpisode` returns a row, and drops back the week it stops. A target, never a
  //    bump – see the ⚠⚠ note above.
  //    ⭐⭐⭐ AND SINCE v76's T4 THE **RATE** HAS A SECOND SUMMAND – «Back on her feet», §3b above.
  //    ⚠⚠ IT IS THE RATE AND NOT THE TARGET, which is the whole difference between a faster return
  //    and a second mechanic: the psychologist does not move where she is going, he shortens the walk.
  //    The same `stepToward` still clamps it to the gap, so the slope can no more overshoot the
  //    baseline than the standing rate can. ⚠ ONE CALL, so the term and the counter below are
  //    provably about the same week and the same mark.
  const worked = shockBeingWorked(world)
  if (worked !== null) worked.weeks = (worked.weeks ?? 0) + 1
  const target = s.baseline + (activeEpisode(world) === null ? 0 : s.attachmentLift)
  const rate = s.returnPerWeek[intensity] + (worked === null ? 0 : recoverySlopeFor(world))
  const returned = stepToward(world.spirit ?? s.baseline, target, rate)
  // 2. ...and THEN what this week did to her, scaled by how hard things land on this girl.
  // 2b. ⭐⭐⭐ AND WHAT AN ENDING DID TO HER (v75 T3), ON ITS OWN TERM AND **OUTSIDE** THE SCALE – the
  //     ⚠⚠ note above the function argues it in full; the arithmetic is the one line below. The
  //     `?? null` is the same courtesy the three fields above get, for hand-built probe worlds.
  const shock = world.spiritShock ?? null
  const shocked = shock !== null && shock.week === world.week ? s.shock[shock.kind][intensity] : 0
  const moved =
    returned + weekPerturbation(world, wrapWithNoVacation) * s.perturbationScale[intensity] + shocked
  world.spirit = roundTenth(clamp(moved, s.min, s.max))

  // 3. AND THE STANDING, ON THE SAME PASS – one weekly function, two numbers. Same shape, same
  //    order: the regression toward 70 first, then the week's own event. The zero-vacations row is
  //    the only thing here that can move `bond` without a decision, and it is an absence of one.
  const settled = stepToward(world.bond ?? b.start, b.start, b.regressionPerWeek)
  world.bond = roundHalf(clamp(settled, b.min, b.max))
  if (wrapWithNoVacation) applyBondDelta(world, b.delta.seasonWithNoVacation)

  // 4. ⭐⭐ AND THE MARK CLEARS WHEN SHE IS BACK – v75 T3's one line in this tail, read against the
  //    PLAIN baseline (70 − 2 = 68) and never the effective one, which is ruling D and is argued on
  //    `shockClearWithin` itself. It is checked AFTER the write above, so the week a shock lands is
  //    judged on the spirit it produced rather than on the one it replaced.
  if (shock !== null && world.spirit >= s.baseline - s.shockClearWithin) {
    // ⭐⭐⭐ v76 T4 – AND THE RECEIPT, AT THE CLEAR AND NOWHERE ELSE. Ruling C's test, asked of the
    //    counter this pass has been keeping: he is credited only if he worked at least HALF the weeks
    //    the mark was on her.
    //    ⚠ IT READS THE CAPTURED `shock`, NOT `world.spiritShock`, AND THAT IS WHAT MAKES THE ORDER
    //    HERE FREE – measured, because the first version of this note claimed the opposite («read
    //    BEFORE the nulling, the only order that works»). ARM 6 swapped the two statements and went
    //    **0 RED**: the local still points at the record after the field is nulled, so nothing about
    //    the receipt depends on which line runs first. What the receipt DOES depend on is that the
    //    counter was kept on the record rather than in a variable this function throws away, which is
    //    ARM 3's ground. A later editor may move the null; they may NOT re-point this read at the
    //    field.
    //    ⚠ A FIRE-AND-RE-HIRE AT THE CLEAR CANNOT MANUFACTURE THIS: the test is arithmetic over weeks
    //    already worked and asks nothing about who is on the payroll today, which is the hole ruling C
    //    exists to close.
    if (recoveryReceiptEarned(shock, world.week)) {
      addEvent(world, { week: world.week, type: 'info', text: RECOVERY_RECEIPT })
    }
    world.spiritShock = null
  }
  // ⚠⚠ NOTHING GOES BELOW THIS LINE – the architect's ruling F reserves the tail after the clear for
  // T7's weekly leaning pass, so that a flip never bites its own week. `intensity` is read ONCE at the
  // head of this function and spent three ways; the week was lived by the girl she was all week, so a
  // flip that fires here is first read on the NEXT tick and must never be threaded back into this one.
}

/** THE ONE WRITER for every `bond` delta – clamped to 0..100 and rounded onto the 0.5 grid, so no
 *  decision site has to remember either rule. `world.bond` is the only field it touches. */
export function applyBondDelta(world: WorldState, delta: number): void {
  const b = ECONOMY.bond
  world.bond = roundHalf(clamp((world.bond ?? b.start) + delta, b.min, b.max))
}
