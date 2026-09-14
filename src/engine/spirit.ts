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
// ⚠⚠ AND SINCE v77's T3 IT IS **TWO** ROWS, WHICH IS THE PARAGRAPH ABOVE CORRECTED RATHER THAN
// REWRITTEN. The second is `EXPOSURE_ROW` (§3c below), and it is here for the same KIND of reason
// the first is: the week's exposure list is summed inside `accrueSpirit`'s own pass and nowhere
// else, so «was this an exposure week» is a question this function is already holding the answer to,
// and a second reader re-deciding it from the world is the shape this file refuses everywhere. ⚠ Two
// rows is now the count, and it is the whole count: both go through `addEvent`, neither carries
// `amountCents` or a figure, and this module still owns no pool, no register table, no component.
//
// ⚠ AND IT STILL IMPORTS NOTHING FROM `world/psychologist.ts`, WHICH IS MEASURED AND NOT ASSUMED:
// that module imports `bondBandOf` from THIS file at runtime (its consent gate), so an import back
// would close the value loop the `activeEpisode` note below records being caught once already – and
// since 13.09 the SECOND back-edge is measured too (`psychologist -> college -> player -> spirit`),
// so cutting the consent gate would not open the door either. What the seat's own reads look like
// here is therefore split, and the split is ruling J's: the WORKING WEEK arrives as `accrueSpirit`'s
// `psychologistWorks` parameter, handed down by `world/phaseHerWeek.ts` from the same
// `psychologistWorksThisWeek` that decides the bill; `psychologistFocus` and `psychologistRung` –
// the CHOICE and the DIAL, which no predicate owns – are still read straight off `WorldState`. Both
// halves are argued over `shockBeingWorked`.
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
// ⚠ `loveEpisodesOf` JOINS IT AT THE ARCHITECT'S ВЫЧИТКА (13.09) AND OPENS NO NEW ARROW EITHER – it
// is the SAME leaf, the list `activeEpisode` is a question about, and the receipt's «was there a last
// time» is the other question asked of it. See `hadAnEarlierEnding` below.
import { activeEpisode, loveEpisodesOf } from './world/loveEpisodes'
import type { BondBand, MoodRegister } from '../shared/protocol'
// ⚠ TYPE-ONLY, so this leaf adds no runtime edge back into the integration core – the same shape
// `academy.ts` uses one floor up and every `world/*.ts` module uses beside it.
// ⚠⚠ `ExposureEvent` JOINS IT AT v77's T3 AND OPENS **NO NEW ARROW AT ALL**, which is the wave-6
// brief's §0.1 in its own words («`spirit.ts` imports nothing new»). It is not a second import line:
// the type is widened onto the ONE type-only import this module already had, it comes off the
// `engine/world` BARREL (the historical convention, `world.ts:445`) rather than off `world/spotlight`
// directly, and `import type` is erased at compile time – so there is no runtime edge to `world/` in
// either direction and the leaf is the leaf it was. ⭐ THE VALUE that fills this list is never
// imported here: `exposureEventsOf` is called by `world/phaseHerWeek.ts` and the LIST is handed down,
// which is ruling J's dependency inversion applied a second time, to a second fact.
import type { ExposureEvent, WorldState } from './world'

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
 *
 * ⚠⚠ THE TWO `??` COURTESIES ARE T7's AND THEY ARE A REQUIREMENT OF THE ZERO-DIFF PIN RATHER THAN A
 * TIDINESS. T1 could read both fields raw because NOTHING CALLED THIS. T7 re-points five mechanics
 * onto it, and the reads it replaces were themselves defensive – `world/lifeBeat.ts`'s private
 * `temperamentOf` is `world.temperament ?? temperamentFor(world.seed)` and `accrueSpirit` spelled the
 * same fallback inline, both for the probe worlds hand-built in tests and benches. Dropping the
 * fallback at the swap would have changed those sites' behaviour on exactly those worlds – a
 * temperament-less probe reads `'deep'` through the raw form (`undefined` is neither `'sunny'` nor
 * `'fiery'`, and neither `'sunny'` nor `'quiet'`) where it used to read the seed's own girl – which
 * is the opposite of what a re-point is allowed to do. `wallsFlipped` gets the same courtesy for the
 * harder version of the same reason: a probe world that predates v76 has no such key at all, so the
 * raw `flipped.open` would THROW rather than merely disagree. Every real world – created or migrated
 * – carries both, so neither branch is reachable in play. */
export function expressedTemperamentOf(world: WorldState): Temperament {
  const birth = world.temperament ?? temperamentFor(world.seed)
  const flipped = world.wallsFlipped ?? { open: false, reg: false }
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
// ⚠⚠ «IS PAYING» IS LITERAL SINCE 13.09 (ruling J, T4b) AND IT USED TO BE A FIGURE OF SPEECH: T4's
// gate was `psychologistHired`, which is TRUE on the two weeks `resolvePsychologist` charges nothing
// for. A college freeze and a booked family week now stand the WORK down exactly as they stand the
// BILL down – one predicate for both, the masseur's own shape – and the flag survives both, so the
// slope comes back by itself the first week after.
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
 *  ⚠⚠ THE SEAT'S WORKING WEEK ARRIVES AS A PARAMETER AND IS NOT READ OFF THE WORLD – the architect's
 *  ruling J (13.09), and it CORRECTS what T4 shipped one commit earlier. T4 gated the slope on
 *  `world.psychologistHired` alone, so on a college-freeze week and on a booked family week – the two
 *  weeks `resolvePsychologist` charges NOTHING for, its own first line – the slope still ran. Pay
 *  nothing, receive the work: the travelling-team §4 legibility law read backwards. The masseur is
 *  this seat's twin and rides one predicate for both halves (`world/medical.ts` spends
 *  `masseurWorksThisWeek` inside `accrueCondition`; `phaseHerWeek`'s own comment says it in words –
 *  «His effects ride the same predicate»), and the psychologist is a twin here too.
 *
 *  ⚠⚠ WHY A PARAMETER RATHER THAN THE TWIN'S OWN DIRECT IMPORT, MEASURED RATHER THAN ASSUMED. A
 *  `psychologistWorksThisWeek` import from this file closes a real value cycle, and BOTH of its
 *  back-edges are live – walked over the tree's own import graph, `import type` excluded:
 *    · `world/psychologist.ts` -> `engine/spirit.ts`                                  (T3's `bondBandOf`)
 *    · `world/psychologist.ts` -> `world/college.ts` -> `world/player.ts` -> `engine/spirit.ts`
 *      (T2's `inCollege`, closing through `player.ts`'s `spiritMatchFactor`)
 *  Cutting the first removes one edge and the second still closes the loop, and moving `inCollege` to
 *  a cycle-free leaf is a 23-file change. `spirit.ts` reaches `psychologist.ts` by ZERO paths today,
 *  so the import would be the closing edge and nothing else would be.
 *
 *  ⚠ SO THE CALLER ANSWERS IT, BECAUSE THE CALLER ALREADY HOLDS THE FACT: `world/phaseHerWeek.ts`
 *  imports `accrueSpirit`, `inCollege` AND `resolvePsychologist`, and hands down
 *  `psychologistWorksThisWeek(world)` at the call site where it is self-describing. One
 *  implementation, no new arrow, no cycle. ⚠ `psychologistFocus` is still read straight off the
 *  world – it is a CHOICE and not a working week, no predicate owns it, and no import is involved.
 *  ⚠⚠ AND THE EXCEPTION IS WIDER THAN RULING J BELIEVED – MEASURED ON THE SAME GRAPH, for every
 *  module the wave names, and carried back rather than decided here. Ruling J closes «T5, T6 and T7's
 *  other readers do NOT have this cycle and must use the twin's own method». Two of the three:
 *    · `engine/development.ts` (T5's site, ruling D) closes **SIX** cycle paths, the shortest being
 *      `psychologist -> college -> development` – and it closes on a VALUE, `world/college.ts:23`
 *      importing `SKILL_KEYS` and spending it at `:173`. T5 meets this same wall.
 *    · `world/lifeBeat.ts` (T6/T7) closes **ZERO** and may import the predicate directly, exactly as
 *      ruling J says – and `world/medical.ts` closes zero too, which is WHY the masseur's method
 *      works there and is a method rather than a coincidence.
 *  So the rule is not «spirit.ts is special»: it is that a focus pass living UNDER `world/college.ts`
 *  must be handed the fact, and one living beside it may ask. Pure read, ZERO draws. */
function shockBeingWorked(world: WorldState, psychologistWorks: boolean): WorldState['spiritShock'] {
  const shock = world.spiritShock ?? null
  if (shock === null || shock.week >= world.week) return null
  if (!psychologistWorks) return null
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

/** ⭐⭐⭐ WAS THERE A LAST TIME – the ARCHITECT'S ВЫЧИТКА, 13.09, and the half of the receipt's
 *  condition that is about HER HISTORY rather than about this shock's weeks.
 *
 *  ⚠⚠ THE DEFECT IT CLOSES, SAID ONCE. `RECOVERY_RECEIPT` is «She came back sooner than last time.»
 *  and T9's string sweep found it printing on a career's FIRST EVER shock, where there is no last time
 *  to be sooner than. The sentence is one of the wave's nine RULED rows – the spec §2's own wording –
 *  so it does not move. The TRIGGER does, and this is it.
 *
 *  ⚠⚠ DERIVED FROM DATES THE WORLD ALREADY PERSISTS, AND NOT FROM A NEW COUNTER (the architect's own
 *  fence: «no new field, no schema move»). The chain that makes it exact:
 *    · `world.spiritShock` is written in ONE place in the engine – `rollEnds` (`world/lifeBeat.ts`),
 *      `kind: 'breakup'`, on the SAME LINE-RUN as `endEpisode(world, world.week)` and never
 *      conditionally (that function's own ⚠). So this mark's episode has `endedWeek === shock.week`,
 *      and «an ending» and «a shock» are the same event seen from two fields.
 *    · Rows are appended in calendar order, only the tail is ever open (`arrivalEligible` clause 2)
 *      and `endEpisode` dates the ACTIVE row alone – so at most one episode ends in any one week.
 *  Therefore «there was an earlier shock» IS «some episode carries a non-null `endedWeek` STRICTLY
 *  BELOW this mark's week», which is what the line below asks.
 *
 *  ⚠ STRICTLY BELOW, NEVER `<=`: at `<=` the mark's OWN episode – dated `shock.week` by the run above
 *  – answers the question with itself, and every first shock prints again. It is the whole defect
 *  wearing one character.
 *
 *  ⚠ A DATE RELATION AND NOT A COUNT, on the architect's own instruction: «a count of two is the same
 *  claim only if endings are strictly sequential». `loveEpisodes.length >= 2` is satisfied by an open
 *  row beside an ended one, which is a girl in her FIRST break-up with somebody new already there.
 *
 *  ⚠ IT ASKS NOTHING ABOUT `knownWeek`. Whether the PARENT was told there was anybody is a different
 *  question (`activeEpisode`'s own note), `rollEnds` stamps the mark either way, and a receipt about
 *  HER coming back may not be gated on his knowledge – the told-late scene exists precisely because
 *  those two facts come apart. Pure, total, zero draws. */
function hadAnEarlierEnding(world: WorldState, shockWeek: number): boolean {
  return loveEpisodesOf(world).some((episode) => episode.endedWeek !== null && episode.endedWeek < shockWeek)
}

/** ⭐⭐ MAY THE RECEIPT BE PRINTED for a shock that has just cleared – the architect's ruling C and
 *  his 13.09 вычитка, as ONE expression, exported so the pin reads the engine's own rule instead of
 *  re-typing it.
 *
 *  «HELD FOR AT LEAST HALF THE SHOCK'S WEEKS», where the span is `week − shock.week` at the clear and
 *  the HELD half is the counter. ⚠ THE `weeks >= 1` GUARD IS NOT DECORATION: a shock that lands and
 *  clears in one week has span 0, and `0 * 2 >= 0` would print a receipt for work nobody did.
 *
 *  ⚠⚠ AND THE THIRD CLAUSE IS THE SENTENCE'S OWN CLAIM, NOT A SECOND RULE ABOUT THE WORK. The first
 *  two ask «did he earn it»; `hadAnEarlierEnding` asks whether the thing the line says is true at all.
 *  They are deliberately ANDed in one function rather than split across the call site, so that «the
 *  receipt's condition» keeps one spelling and a pin cannot assert half of it and believe it has the
 *  rule. ⚠ IT TAKES THE WORLD FOR THAT CLAUSE AND FOR NOTHING ELSE. Pure, total, zero draws. */
export function recoveryReceiptEarned(
  world: WorldState,
  shock: NonNullable<WorldState['spiritShock']>,
  week: number,
): boolean {
  const weeks = shock.weeks ?? 0
  return weeks >= 1 && weeks * 2 >= week - shock.week && hadAnEarlierEnding(world, shock.week)
}

/** ⭐⭐ THE RECEIPT – one no-cents feed line at the clear week, and the travelling-team §4 legibility
 *  law made audible for this focus («you paid, and you cannot tell» is the failure).
 *
 *  ⚠⚠ DRAFT (CLAUDE.md invariant 4), and it is the spec's §2 own working sentence for this focus
 *  transcribed rather than invented. NO FIGURE IN IT – the no-cents law (the wave-3 brief §0.5): the
 *  receipt says the work showed, never what it cost or how many points it was worth. No pronoun for
 *  the psychologist, short dash idiom, and nothing that names a session.
 *
 *  ⚠⚠ THE SENTENCE SURVIVED THE ARCHITECT'S ВЫЧИТКА (13.09) AND ITS TRIGGER DID NOT, which is the
 *  right way round and is worth the line: T9's sweep found the row printing on a career's FIRST ever
 *  shock, and «sooner than last time» is false there. A builder's instinct is to soften the words;
 *  invariant 4 forbids it and the fix is better – the WORDS are the owner's and stay byte-identical,
 *  and `recoveryReceiptEarned` now asks `hadAnEarlierEnding` so the state where the line would lie is
 *  a state where it does not print. ⭐ A string is not a place to hedge a condition. */
export const RECOVERY_RECEIPT = 'She came back sooner than last time.'

// =================================================================================================
// 3c. ⭐⭐⭐ THE SPOTLIGHT'S PRESSURE – v77's T3 (wave 6, who-she-is §3c / §3c-bis)
// =================================================================================================
//
// THE OWNER, 09.09: «давление известности и как она с ним справляется (и справляется ли вообще).»
//
// THE WHOLE OF THE MECHANIC: the weeks that put her in the light cost her spirit, priced per event,
// summed over the week, applied as ONE named summand inside `accrueSpirit`'s own pass. The LIST of
// events is not derived here – `world/spotlight.ts` answers «what put her in the light» for a week
// and `world/phaseHerWeek.ts` hands the answer down, which is §0.1's dependency inversion and the
// second use of ruling J's shape in this file.
//
// ⚠⚠ AND THE WEEK IT IS ASKED ABOUT IS THE ONE THAT HAS **CLOSED**, NOT THE ONE BEING LIVED – the
// architect's RULING P (14.09), which overturned ruling M after T3 measured what M had missed. The
// caller asks `exposureEventsOf(world, world.week − 1)`, and the argument is the TICK's own order,
// not a taste: a trophy and a result row are stamped by `finalizeTournament` inside `playHerWeek`,
// which runs TWO PHASES AFTER this pass, so asked in-week `'stage'` and `'publicLoss'` returned
// nothing every week for ever. Nothing about the SIZE of the term changed – only which pass carries
// it – and the lag is the truer reading in any case: the cameras were on her at the weekend and the
// week she pays for it is the week after. `world/phaseHerWeek.ts` carries the tick table.
//
// ⚠⚠ IT IS WEATHER, NOT A SHOCK, AND THAT IS THE WAVE'S OWN §8 RATHER THAN A PLACEMENT PREFERENCE.
// Nothing here writes `world.spiritShock`, nothing here touches the return curve, and no new shock
// kind exists: the break-up stays the ONE shock in the game. What recovers a pressured week is the
// standing return toward baseline, at her own rate, exactly as it recovers a bad exam fortnight.
//
// ⚠⚠ AND THERE IS NO SUCCESS TAX ANYWHERE IN IT (§0.4, «мы ни за что не наказываем», 09.09). The
// term is keyed on EVENTS and never on rank, prize, fame or a standing weekly drain: a week with no
// exposure event contributes exactly `0` and is byte-identical to wave-5 behaviour, whatever her
// fame. That is a pin (§B of the T3 suite) and not a claim, and it is run against a FAMOUS world,
// because run against a quiet one it would prove nothing about this wave.

/** ⭐⭐ THE DRAFT ROW – one no-cents feed line on an exposure week, and the legibility law made
 *  audible (§3c: «every dip explainable»).
 *
 *  ⚠⚠ A DRAFT UNDER CLAUDE.md INVARIANT 4, AND IT IS T8's AND THE ARCHITECT'S ВЫЧИТКА TO SETTLE –
 *  the wave's §5 binds every player-facing word in T8's list, and this is row 2 of that list. It is
 *  deliberately NOT polished here: what T3 owes is an honest plain sentence in the right register,
 *  and the register is the row's neighbours (`RECOVERY_RECEIPT` above, the met/ended rows in
 *  `world/lifeBeat.ts`) – quiet, no figure, no exclamation, short dash idiom, nothing gendered.
 *
 *  ⚠⚠ AND THE ONE REAL CONSTRAINT ON IT IS THAT **ONE SENTENCE HAS TO COVER FIVE KINDS**, which is
 *  the legibility law's own «one row per week, not per event» (§3c: the feed is not a ledger). The
 *  brief's territory line is «The cameras were everywhere this week»; it reads true of `'stage'`,
 *  `'shoot'` and `'publicLoss'` and reads oddly of `'aired'` (a commentary booth) and `'wrongStory'`
 *  (a tabloid), and a week can hold any mixture of the five. So the draft below names the ATTENTION
 *  rather than the lens, which is the one thing all five weeks have in common. ⚠ CARRIED TO THE
 *  ARCHITECT AS A QUESTION rather than decided here: if he wants the cameras named, the honest
 *  shape is a row per kind, and that is a second sentence in the feed's budget, not a word swap.
 *
 *  ⚠⚠ AND THE SECOND CONSTRAINT IS NEW, IT IS THE ARCHITECT'S **RULING P**, AND IT IS WHY THE DRAFT
 *  MOVED ONCE ALREADY (v77's T3b). T3 shipped «…about her **this week**», which was true of the week
 *  the row asked about under ruling M's horizon. Ruling P corrected that horizon: the caller asks
 *  `exposureEventsOf(world, world.week − 1)`, because the tick stamps a trophy or a result two phases
 *  AFTER the spirit pass, so `'stage'` and `'publicLoss'` could never be seen in-week. The row is
 *  still stamped with the week it PRINTS in – the feed's rows are dated by when the player reads
 *  them – but the attention it names happened in the week that has closed. «this week» was therefore
 *  a sentence about the wrong week the day the horizon moved, and a row that names the wrong week is
 *  the legibility law failing quietly. ⚠ STILL A DRAFT AND DELIBERATELY NOT POLISHED: T8 and the
 *  вычитка own the words, and what T3b owes is a plain sentence that is TRUE. */
export const EXPOSURE_ROW = 'People were talking about her last week.'

// =================================================================================================
// 3c-psy. ⭐⭐⭐ «THE PUBLIC LIFE» – v77's T5 (wave 6, the psychologist's fifth focus, O7 ruled 13.09)
// =================================================================================================
//
// THE SPEC'S OWN ROW (`docs/specs/the-psychologists-year-2026-09.md` §2): «while held, the
// spotlight's pressure shrinks by rung and habituation accelerates». Two effects, ONE question –
// «is the seat working HER PUBLIC LIFE this week, and at what rung» – and therefore one function to
// answer it, spent twice: `publicLifeShrinkAt` in `exposurePressure`'s product below, and
// `publicLifeAccelAt` in `growHabituation`'s growth further down.
//
// ⚠⚠ THE BRIEF SAYS BOTH EFFECTS «RIDE `psychologistWorkingRung(world, 'publicLife')`» AND THIS FILE
// CANNOT CALL IT – measured, carried back to the architect, and spelled the way the house already
// answers this exact wall. `psychologistWorkingRung` lives in `world/psychologist.ts`, and ruling J
// measured that an import of that module FROM HERE closes a real value cycle by TWO live back-edges
// (`psychologist -> spirit` through `bondBandOf`, and `psychologist -> college -> player -> spirit`
// through `inCollege`). `world/psychologist.ts` says so in its own words on that function: «`spirit.ts`
// cannot import this file – the cycle ruling J measured – so T4's focus had to re-spell the rung read
// in its own module». So the fact that cannot be imported is HANDED DOWN (the billing predicate,
// already a parameter of `accrueSpirit` since ruling J and now of `growHabituation` too), and the two
// facts that CAN be read are read straight off the world – which is ruling J's own closing sentence:
// «`psychologistFocus` is still read straight off the world – it is a CHOICE and not a working week,
// no predicate owns it, and no import is involved».
//
// ⚠⚠ AND THE RE-SPELLING IS **PINNED AS AN EQUIVALENCE** RATHER THAN TRUSTED – wave 5's own practice
// on `recoverySlopeFor` («the two spellings are pinned as an EQUIVALENCE in the T4 suite rather than
// trusted: the slope's index and the rung `psychologistRungOf` returns are asked to agree over all
// three»). `tests/wave6-spotlight-focus.test.ts` §C asks both spellings the same question over the
// whole grid – three rungs × five focuses × hired/unhired × the two stand-downs – so a future edit to
// either one goes red instead of quietly giving the family two answers.
//
// ⚠ ONE FUNCTION AND NOT TWO COPIES OF THE CONDITION, which is the defect `psychologistWorkingRung`
// was created to close one wave ago («a focus pass that spelled `psychologistHired && focus === …`
// instead would be T4's own defect, corrected one commit later»). Both of T5's effects ask THIS.

/** ⭐⭐ THE RUNG THE SEAT IS WORKING **HER PUBLIC LIFE** AT THIS WEEK, or `undefined` when it is not
 *  working that focus at all – not hired, stood down, or hired for a different year.
 *  `psychologistWorkingRung(world, 'publicLife')` re-spelled in this module for the cycle's sake (the
 *  section note above), and pinned equal to it.
 *
 *  ⚠⚠ THE STAND-DOWNS COME IN THROUGH THE PARAMETER AND ARE NOT RE-SPELLED HERE, which is the whole
 *  of ruling J: `psychologistWorks` is `psychologistWorksThisWeek(world)` at the one engine call
 *  site, so a college freeze and a booked family week stand this focus's TWO EFFECTS down exactly as
 *  they stand the INVOICE down. Pay nothing, receive nothing. A version of this function that asked
 *  `world.psychologistHired` would be the defect ruling J corrected one wave ago, on a different
 *  focus, one commit after it shipped.
 *
 *  ⚠ THE `??` FALLBACK IS `recoverySlopeFor`'s AND `psychologistWorkingRung`'s, MIRRORED for their
 *  reason: the rung is validated at its one writer (`setPsychologistRung`), but a hand-built probe
 *  world may hold anything, so an unknown value reads as the DEFAULT rung rather than poisoning a
 *  multiplier. ⚠ And `undefined` means ONE thing here – «he is not working her public life» – which
 *  is why a missing rung falls back rather than switching the effect off. Pure read, ZERO draws. */
function publicLifeRung(world: WorldState, psychologistWorks: boolean): 0 | 1 | 2 | undefined {
  if (!psychologistWorks) return undefined
  if ((world.psychologistFocus ?? null) !== 'publicLife') return undefined
  return world.psychologistRung ?? ECONOMY.psychologist.defaultRung
}

/** ⭐⭐⭐ WHAT A YEAR ON HER PUBLIC LIFE TAKES OFF EVERY EXPOSURE EVENT – the FIFTH factor of
 *  `exposurePressure`'s product, and **exactly `1`** on every week the seat is not working this
 *  focus.
 *
 *  ⚠⚠ THE `1` IS THE IDENTITY AND NOT A DEFAULT, which is what makes «a career with nobody on this
 *  focus plays exactly the tennis it played before T5 existed» arithmetic rather than a promise – the
 *  same claim ruling Q part 3 made of habituation at zero, and it is pinned the same way (§E of the
 *  T5 suite, byte-identity against a live world). `undefined` in, `1` out.
 *
 *  ⚠ IT TAKES THE RUNG AND NEVER THE WORLD, for `exposurePressure`'s own reason (ruling L part 3):
 *  the pass reads the world once and hands values down, so no helper can re-derive a fact the week
 *  has already fixed. Pure, total, ZERO draws. */
export function publicLifeShrinkAt(rung: 0 | 1 | 2 | undefined): number {
  if (rung === undefined) return 1
  const p = ECONOMY.psychologist
  return p.publicLifeShrink[rung] ?? p.publicLifeShrink[p.defaultRung]
}

/** ⭐⭐⭐ HOW MUCH FASTER SHE LEARNS TO LIVE KNOWN WHILE THE YEAR IS HELD – the multiplier on
 *  `growHabituation`'s weekly `+1`, and **exactly `1`** on every week the seat is not working this
 *  focus.
 *
 *  ⚠⚠ IT NEVER REACHES A WALLED OR AN UNKNOWN GIRL, AND THAT IS THE CALLER'S EARLY RETURNS RATHER
 *  THAN A NUMBER IN THIS ROW. `growHabituation` returns before this is read when she is not news or
 *  when either wall is flipped, so ruling H's `×0` beats any accelerator by construction and there is
 *  no `Math.max` to reach for. The composition is pinned (§D of the T5 suite) precisely because it is
 *  the place a builder would reach for one.
 *
 *  ⚠ AND IT CANNOT OUT-RUN THE CAP: `growHabituation` clamps at `habituationFullWeeks`, which is also
 *  `habituationScale`'s denominator, so a faster walk reaches the same floor sooner and never passes
 *  it. Pure, total, ZERO draws. */
export function publicLifeAccelAt(rung: 0 | 1 | 2 | undefined): number {
  if (rung === undefined) return 1
  const p = ECONOMY.psychologist
  return p.publicLifeAccel[rung] ?? p.publicLifeAccel[p.defaultRung]
}

/**
 * ⭐⭐⭐ WHAT THE WEEK'S EXPOSURE COST HER, in spirit points – the whole of T3's arithmetic, as one
 * pure fold over the list the caller handed down.
 *
 * THE PRODUCT, per event, and it is the spec's own five factors in the spec's own order:
 *
 *     base[kind] × perturbationScale[intensity] × opennessScale[openness] × habituation × focus
 *
 * ⚠⚠ `perturbationScale` IS THE **STANDING** SCALE AND NEVER A NEW CONSTANT (§4, «the intensity
 * scale is the STANDING `perturbationScale`»), and it is applied EXACTLY ONCE, here, because
 * `pressureBase` is drafted «−2..−4 BEFORE scaling». That is the architect's ruling L part 1, and
 * the defect it refuses is recorded in this file already: `spirit.shock`'s constants are ALREADY
 * intensity-scaled, so they are added OUTSIDE `weekPerturbation`'s multiplication – and a row for
 * the spotlight placed INSIDE that function would scale these bases a SECOND time (−4 × 0.8 × 0.8).
 * A future editor tempted by the tidiness of one more `perturb` row is looking at the same mistake
 * on new numbers.
 *
 * ⚠⚠ IT DOES NOT ROUND ITSELF – ruling L part 2. There is ONE `roundTenth` and one `clamp` in the
 * weekly pass, at the end, on the sum. A term that rounded its own tenths would quantise the small
 * values FIRST, and a single event at ×0.75 through a deep habituation discount is exactly where
 * this term's small values live: ruling N measured a habituated, focus-held, calm, open girl taking
 * −0.33 from the worst week of her public life. Rounded here that is −0.3 before it ever meets the
 * week's other weather; left alone it is the 0.33 the sum deserves.
 *
 * ⚠⚠ BOTH AXES ARE PARAMETERS AND NEITHER IS READ OFF THE WORLD – ruling L part 3, and it is why
 * this function does not take `world` at all. `accrueSpirit` reads `expressedTemperamentOf(world)`
 * EXACTLY ONCE at its head (its own ⚠⚠: «Do not re-read it after this line»), and T3 needs BOTH
 * projections of that one value; a second `expressedTemperamentOf(world)` call here would be a
 * second read of a girl wave 5 ruled is one girl for the whole week. Taking the two poles as
 * arguments makes that structural instead of disciplined.
 *
 * ⚠⚠ ALL FIVE FACTORS ARE REAL SINCE v77's T5, AND THE LAST TWO ARE **PARAMETERS** RATHER THAN WORLD
 * READS:
 *   · `habituation` is T4's – `habituationScale(world.spotlightHabituation)`, read by `accrueSpirit`
 *     off the world and handed down here as a plain number.
 *   · `focus` is T5's – the fifth psychologist focus «The public life»,
 *     `publicLifeShrinkAt(publicLifeRung(world, psychologistWorks))`, read by `accrueSpirit` the same
 *     way and **exactly `1`** on every week no seat is working that year. T3 wrote it out as a
 *     literal `1` with a note naming this task; the literal is gone and the product's shape is
 *     unchanged, which is what writing it out bought.
 *   ⚠⚠ BOTH ARE PARAMETERS AND NOT WORLD READS FOR RULING L PART 3's OWN REASON, which is the same
 *   reason `intensity` and `openness` are: a helper that could reach the world could re-derive a fact
 *   the pass has already fixed for the week, and the pin below («no world reaches the term») is what
 *   makes that structural instead of disciplined. T4 obeyed the rule it found rather than amending
 *   it, and T5 obeys it for the one factor that genuinely wanted the world – the seat's year and its
 *   rung are read ONCE, at the pass's own line, and arrive here as a number.
 *
 * ⚠ ZERO DRAWS, PURE, TOTAL. Arithmetic over a list, and an empty list returns exactly `0` – which
 * is what makes §0.4's byte-identity claim arithmetic rather than a promise. ⭐ AND THE EMPTY LIST IS
 * WHY T4 CANNOT DISTURB A QUIET WEEK: `habituation` is a factor INSIDE the loop, so a week with no
 * exposure is `0` at every habituation, and «a career that has never been news plays the tennis it
 * played before T4 existed» is arithmetic here rather than a promise there.
 */
function exposurePressure(
  exposure: readonly ExposureEvent[],
  intensity: 'steady' | 'intense',
  openness: 'open' | 'private',
  habituation: number,
  focus: number,
): number {
  const s = ECONOMY.spirit
  const p = ECONOMY.spotlight
  let total = 0
  for (const event of exposure) {
    total +=
      p.pressureBase[event.kind] * s.perturbationScale[intensity] * p.opennessScale[openness] * habituation * focus
  }
  return total
}

// =================================================================================================
// 3c-hab. ⭐⭐⭐ HABITUATION – v77's T4 (wave 6, who-she-is §3c: «unless walls are up»)
// =================================================================================================
//
// THE SPEC'S OWN SENTENCE, and the whole model is in it: «sustained fame slowly shrinks her own
// pressure scale (she learns to live known) – unless walls are up: walls freeze habituation. A
// veteran star from a good home shrugs at cameras that once cost her sleep.»
//
// TWO FUNCTIONS AND ONE FIELD. `growHabituation` counts the weeks she has actually lived known onto
// `world.spotlightHabituation`; `habituationScale` reads that count back as the fourth factor of
// T3's product. They are in one file and one section on purpose – a growth whose reader lives
// somewhere else is how a cap and a denominator come to disagree.
//
// ⚠⚠ IT ONLY EVER GROWS, AND THAT IS v1 SPEAKING RATHER THAN AN OVERSIGHT (brief §0.5): **she does
// not unlearn living known.** There is no decay term here, no half-life, no «quiet season» rule, and
// none is coming without a ruling. It is written down because a missing decay is exactly the kind of
// absence a later reader repairs as an obvious omission – and repairing it would be a design change
// nobody asked for.
//
// ⚠⚠ AND NOTHING PRINTS IT – THE FOG LAW, `wallsLean`'s own absence one section down and for the
// same reason. No meter, no bar, no line, no snapshot field, no diary sentence: the spotlight is
// READ through the feed's plain words, the Mood dips, the diary and the booth. A habituation
// printout would turn a weather system into a progress bar, which is the one shape §3c forbids. The
// wave's §8 names it twice («no publicity meter, no habituation surface»).

/** ⭐⭐⭐ WHAT BEING USED TO IT SAVES HER – the fourth factor of T3's product, linear from 1 at zero
 *  weeks down to `habituationFloor` at `habituationFullWeeks`.
 *
 *      habituationScale = 1 − (1 − habituationFloor) × (habituation / habituationFullWeeks)
 *
 *  ⚠⚠ ZERO SCALES TO EXACTLY `1`, BY CONSTRUCTION AND NOT BY ROUNDING – the architect's ruling Q
 *  part 3, and it is the property the whole task is pinned against: a career that has never been
 *  news must play EXACTLY the tennis it played before T4 existed, because `1` is the literal this
 *  function replaces. Byte-identity, not «close enough»: the subtracted product is `× 0`, so the
 *  expression is `1 − 0` and no float tail exists to round.
 *
 *  ⚠ NO CLAMP HERE, AND THAT IS DELIBERATE RATHER THAN FORGOTTEN. The formula is the ruled one
 *  verbatim, and it is total and exact on `[0, habituationFullWeeks]` – the interval the ONE writer
 *  keeps the counter inside by its own clamp, which is pinned. A second clamp here would be a second
 *  place the floor is decided, and the two could disagree; worse, it would let a broken writer pass
 *  unnoticed. The coupling is real and is written out on `habituationFloor` itself so a future second
 *  writer meets it before it meets this line.
 *
 *  ⚠ IT TAKES THE COUNT AND NEVER THE WORLD, for `exposurePressure`'s own reason (ruling L part 3):
 *  the pass reads the world once and hands values down, so no helper can re-derive a fact the week
 *  has already fixed. */
export function habituationScale(habituation: number): number {
  const p = ECONOMY.spotlight
  return 1 - (1 - p.habituationFloor) * (habituation / p.habituationFullWeeks)
}

/** ⭐⭐⭐ THE WEEK SHE LIVED KNOWN, COUNTED – `+1` per week while she is news, `×0` while a wall is
 *  up, clamped at `habituationFullWeeks`. The ONE writer of `world.spotlightHabituation`.
 *
 *  ⚠⚠ A SIBLING OF `accrueSpirit` AND NOT A BLOCK IN ITS TAIL, AND IT RUNS **AFTER** IT – the
 *  architect's RULING Q part 1, and the middle reason is the load-bearing one:
 *    · `accrueSpirit` stays the one writer of `world.spirit` and gains no second field to own;
 *    · **THE SCALE MUST BE READ WITH THE HABITUATION SHE CAME INTO THE WEEK HOLDING.** A growth that
 *      ran first would discount THIS week's own exposure by THIS week's own growth – an off-by-one
 *      no test would ever name, which reads from the outside as «the constants are slightly too
 *      weak». Calling it after the pass makes that defect unspellable rather than merely absent;
 *    · a sibling keeps `engine/spirit.ts`'s import list closed, which §0.1 requires.
 *
 *  ⚠⚠ AND IT RUNS **BEFORE** `driftWalls`, WHICH IS THE SECOND HALF OF THE SAME LAW AND IS NOT IN
 *  RULING Q. `driftWalls` is the pass that FLIPS a wall, and its own ⚠ says «whatever flips here is
 *  first read on the NEXT tick: every reader of `expressedTemperamentOf` in this tick has already
 *  run». This function is a new reader of `wallsFlipped` in that same tick, so it has to sit on the
 *  same side of the drift as the pressure it is the scale for – otherwise a girl who flipped THIS
 *  week would be CHARGED as the girl she was all week (the expression `accrueSpirit` read at its
 *  head) and FROZEN as the girl she became at the end of it. Wave 5's «one girl for the whole week»
 *  is the rule; this is that rule applied to a third reader.
 *
 *  ⚠⚠ THE NEWS GATE ARRIVES AS A **BOOLEAN**, handed down at the caller – §0.1's dependency
 *  inversion, ruling J's shape, and the third use of it in this file (after `psychologistWorks` and
 *  the exposure list). `engine/spirit.ts` gains no arrow to `world/spotlight.ts`, and the WEEK the
 *  gate is asked about stays visible at the call site, one line under the horizon the pressure uses.
 *  ⚠ Ruling Q part 2: it is `world.week − 1`, the SAME horizon, because ruling P gave this wave one
 *  clock and «which week is this about» is the question that cost the wave two dead kinds. At step 3
 *  of the tick it is also the same ANSWER – fame derives from stamps written in earlier weeks – so
 *  the coherent spelling is free.
 *
 *  ⚠⚠ EITHER AXIS FREEZES HER, AND IT IS THE **FLAG** AND NEVER THE LEAN – the architect's ruling H,
 *  settled and not a builder question. «Up» is the spec's word for the FLIPPED state, both axes are
 *  walls (the openness wall makes her expressed-closed, the regulation wall dysregulated), and the
 *  pressure ALREADY reads both axes – so a one-axis freeze would acclimatise a girl the same pass
 *  has just charged double. `wallsLean` is a continuous leaning and a girl leaning toward walls has
 *  not raised them.
 *
 *  ⭐⭐⭐ THE FIFTH FOCUS'S ACCELERATION IS REAL SINCE v77's T5 – `publicLifeAccel[rung]` while «The
 *  public life» is the year being worked (O7), and exactly `1` otherwise. T4 wrote it out as a
 *  literal `1` with a note naming T5; the literal is gone and the growth's shape is unchanged, which
 *  is what writing it out bought.
 *
 *  ⚠⚠ THE SEAT ARRIVES AS THE **THIRD BOOLEAN PARAMETER** AND NOT AS A WORLD READ – the same
 *  dependency inversion the news gate above uses, and for the harder reason: `psychologistWorksThisWeek`
 *  cannot be imported into this file at all (ruling J's two live back-edges, argued at §3c-psy). So
 *  the billing predicate is handed down at the call site, one line under the horizon and the same
 *  expression `accrueSpirit` and `driftWalls` are given on the lines around it. ⚠ A college-freeze
 *  week and a booked family week therefore stand the ACCELERATION down with the bill, exactly as they
 *  stand the shrink and the invoice down.
 *
 *  ⚠⚠ AND THE ACCELERATOR IS READ **AFTER** BOTH GATES, WHICH IS THE COMPOSITION AND NOT A TIDINESS:
 *  a girl who is not news, or who has either wall up, has already returned – so ruling H's `×0` beats
 *  any accelerator by construction, a walled girl holding this focus grows exactly NOTHING, and no
 *  `Math.max` is reachable from here. That is where a builder reaches for one, so §D of the T5 suite
 *  pins it.
 *
 *  ⚠ ZERO DRAWS AND NO CLOCK: four reads and one assignment. The frozen MAIN capture cannot see it.
 *  ⚠ AND IT WRITES NOTHING ON A WEEK IT DOES NOT COUNT – the early returns are what keep a quiet
 *  career's world byte-identical to the one it had before this pass existed. */
export function growHabituation(world: WorldState, isNews: boolean, psychologistWorks: boolean): void {
  const p = ECONOMY.spotlight
  // ⚠ THE `??` COURTESY IS `accrueSpirit`'s and `driftWalls`'s, for their reason: every real world –
  // created or migrated – carries the field, and a probe world hand-built in a test or a bench
  // predates it. ⭐ `0` is the IDENTITY here and not a placeholder for one (T1's own ⭐): it counts
  // weeks she has actually lived known, and a world that never had the field has lived none.
  const held = world.spotlightHabituation ?? 0
  // 1. SHE HAS TO BE KNOWN TO GET USED TO BEING KNOWN. An unknown girl acclimatises to nothing –
  //    there is no spotlight on her to acclimatise to, which is the same gate every other mechanic
  //    in this wave sits behind.
  if (!isNews) return
  // 2. ⭐⭐⭐ AND WALLS FREEZE IT – §3c verbatim, ruling H's EITHER-axis, on the FLAG.
  const flipped = world.wallsFlipped ?? { open: false, reg: false }
  if (flipped.open || flipped.reg) return
  // 3. ⚠ THE CAP IS A `Math.min` AND NOT AN `if (held < full)`, so a counter already at the ceiling
  //    is written back unchanged rather than skipped – the two behave identically today and the
  //    `Math.min` stays correct if the step ever stops being 1. `habituationFullWeeks` is BOTH this
  //    cap and `habituationScale`'s denominator, which is what makes the floor exactly reachable and
  //    never passable.
  // 4. ⭐⭐⭐ AND «THE PUBLIC LIFE» MAKES THE WALK SHORTER (v77's T5, O7) – `publicLifeAccel[rung]`
  //    while that year is being worked and paid for, `1` otherwise. ⚠ IT IS READ HERE AND NOT AT THE
  //    HEAD: both gates above have already returned, so this multiplier is only ever reached on a
  //    week that was going to count one anyway.
  const focusAccel = publicLifeAccelAt(publicLifeRung(world, psychologistWorks))
  world.spotlightHabituation = roundTenth(Math.min(held + 1 * focusAccel, p.habituationFullWeeks))
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
 *
 * ⚠⚠ `psychologistWorks` IS THE SEAT'S BILLING PREDICATE, HANDED DOWN – ruling J (13.09), argued in
 * full over `shockBeingWorked`. It is `psychologistWorksThisWeek(world)` at the one engine call site,
 * which is the same answer `resolvePsychologist` gives itself four calls later in the same tick, so
 * the week the family is charged and the week the work lands are ONE set by construction and can
 * never drift apart. ⚠ IT IS A `boolean` AND NEVER AN `Rng`: the zero-draw contract this function has
 * always carried is untouched, and tests/spirit.test.ts asserts that of the SIGNATURE rather than of
 * the arity, precisely so a parameter like this one cannot quietly retire the claim.
 *
 * ⭐⭐⭐ AND SINCE v77's T3 THE THIRD ARGUMENT IS THE WEEK'S EXPOSURE – what put her in the light,
 * derived by `world/spotlight.ts` and HANDED DOWN by `world/phaseHerWeek.ts`, which is §0.1 of the
 * wave-6 brief and the second use of ruling J's dependency inversion in this signature. The list is
 * computed by a leaf this module never imports; `spirit.ts` gains no arrow, only a type widened onto
 * the one type-only import it already had (see that import's ⚠⚠).
 *
 * ⚠⚠ IT IS **REQUIRED AND NEVER DEFAULTED**, AND THAT IS THE ARCHITECT'S RULING A RATHER THAN A
 * STYLE. `Function.length` counts the parameters BEFORE the first one carrying a default, so
 * `exposure: readonly ExposureEvent[] = []` would leave `tests/spirit.test.ts`'s arity pin reading
 * **2** – GREEN through the exact change it exists to notice, and the next wave inheriting a counter
 * that has quietly stopped counting. That is the «unable to fail» family in its eleventh costume and
 * this wave is not adding a twelfth for convenience. Required also makes every one of the call sites
 * state «no exposure this week» out loud, which is the honest spelling, and the churn is paid by the
 * compiler: `vue-tsc -b --force` names all of them. ⚠ `tools/spirit-bench.ts` passes `[]` at both of
 * its sites deliberately – a bench that quietly gained exposure would stop measuring what it says it
 * measures.
 *
 * ⚠ AND THE DECLARATION STAYS ON ONE LINE. The same pin reads this line as TEXT and asserts it
 * contains `{`, precisely so it can prove it is not reading a wrapped fragment – a signature broken
 * across lines makes its sibling assertion («must take no Rng, whatever else it takes») pass on a
 * truncated string. Measured: this line is 119 characters, the repository carries no prettier or
 * eslint width config, and this file already holds lines of 163.
 */
export function accrueSpirit(world: WorldState, psychologistWorks: boolean, exposure: readonly ExposureEvent[]): void {
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A («`accrueSpirit`'s intensity read
  // is evaluated now ⇒ expressed»). It is spent three ways on this pass – `returnPerWeek[intensity]`,
  // `perturbationScale[intensity]` and `shock[kind][intensity]` – and not one of the three is stored,
  // so all three are about the girl she is THIS week. An `intense` girl who learned to regulate takes
  // the world at ×0.8 and comes back at 5/wk from the tick after her flip, and that is what «she
  // learned to breathe» has to mean arithmetically or it means nothing.
  // ⚠⚠ AND IT IS READ EXACTLY ONCE, HERE AT THE HEAD, WHICH IS RULING F AND IS WHY `driftWalls` IS A
  // SIBLING OF THIS FUNCTION RATHER THAN A BLOCK IN ITS TAIL (ruling P). The week's perturbation was
  // experienced by the girl she was ALL week; a flip that fired mid-pass would price half the week as
  // one person and half as another. Do not re-read it after this line, and never thread a new value
  // into the same tick.
  // ⚠ `expressedTemperamentOf` CARRIES THE `?? temperamentFor(world.seed)` COURTESY INSIDE IT, so the
  // probe-world fallback this line used to spell out has not been dropped – it has moved one level
  // down and is shared by all five re-pointed sites. See its own ⚠⚠ note.
  // ⚠⚠ v77's T3 HOISTS THE CALL INTO A LOCAL AND TAKES **BOTH** PROJECTIONS OFF IT – the architect's
  // ruling L part 3, and it is the ⚠⚠ directly above obeyed rather than amended. The spotlight's
  // pressure scales by openness as well as by intensity (§3c's ×0.75 / ×1.5), and a second
  // `expressedTemperamentOf(world)` call for the second axis would be a SECOND READ of the girl this
  // pass is about – wave 5 ruled that the girl who experienced the week is one girl. One call, one
  // value, two projections: the two axes can now no more disagree about who she was this week than
  // the return rate and the perturbation scale can.
  const expressed = expressedTemperamentOf(world)
  const intensity = temperamentIntensity(expressed)
  const openness = temperamentOpenness(expressed)
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
  const worked = shockBeingWorked(world, psychologistWorks)
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
  // 2c. ⭐⭐⭐ AND WHAT BEING LOOKED AT DID TO HER (v77 T3) – §3c above, as a **FOURTH SUMMAND** and
  //     for the shock's own reason, which is the architect's RULING L part 1: `pressureBase` is
  //     drafted «before scaling», `exposurePressure` applies `perturbationScale` exactly once inside
  //     itself, and a row inside `weekPerturbation` would therefore scale it a SECOND time – the
  //     recorded defect on `spirit.shock`'s constants, repeated on new numbers. An empty list is
  //     exactly 0, so a no-exposure week's arithmetic is byte-identical to what it was before this
  //     line existed – §0.4's «no success tax», as a property of the addition rather than a promise.
  //     ⭐⭐⭐ AND SINCE v77's T4 THE FOURTH FACTOR OF THAT PRODUCT IS REAL: `habituationScale` reads
  //     the weeks she has ALREADY lived known and shrinks every event of this week by them. ⚠⚠ THE
  //     COUNT IS THE ONE SHE CAME INTO THE WEEK HOLDING, and that is a property of the CALL SITE
  //     rather than of this comment – `growHabituation` is a SIBLING of this function and runs on the
  //     line after it (the architect's ruling Q part 1, `world/phaseHerWeek.ts`). A growth that ran
  //     first would discount this week's own exposure by this week's own growth, which is an
  //     off-by-one no test would name and which reads as «the constants are slightly too weak».
  //     ⚠ AT ZERO IT IS EXACTLY `1`, so a career that has never been news takes the identity factor
  //     T3 shipped as a literal – ruling Q part 3, pinned as BYTE-IDENTITY and not as an endpoint.
  //     ⭐⭐⭐ AND SINCE v77's T5 THE **FIFTH** FACTOR IS REAL TOO: «The public life», the psychologist's
  //     fifth year-focus (O7), shrinks every event of this week by the rung the family is paying for.
  //     ⚠⚠ THE SEAT'S YEAR IS READ **HERE**, AT THE PASS'S OWN LINE, AND HANDED DOWN AS A NUMBER –
  //     ruling L part 3's law applied to the one factor that wanted the world, and §3c-psy's own note
  //     argues why the rung is re-spelled in this file rather than imported (ruling J's cycle).
  //     ⚠ AND IT RIDES `psychologistWorks`, THE BILLING PREDICATE THIS PASS ALREADY HOLDS, so a
  //     college-freeze week and a booked family week stand the shrink down with the bill – pay
  //     nothing, receive nothing (ruling J). With no seat, no year, or a different year, it is exactly
  //     `1` and this line is byte-identical to what T4 shipped.
  const pressured = exposurePressure(
    exposure,
    intensity,
    openness,
    habituationScale(world.spotlightHabituation ?? 0),
    publicLifeShrinkAt(publicLifeRung(world, psychologistWorks)),
  )
  const moved =
    returned + weekPerturbation(world, wrapWithNoVacation) * s.perturbationScale[intensity] + shocked + pressured
  // ⚠⚠ ONE `roundTenth`, ONE `clamp`, AT THE END, ON THE SUM – ruling L part 2, and the reason the
  // term above does not round itself: quantising a single small exposure before it meets the week's
  // other weather is how three tenths become nothing.
  world.spirit = roundTenth(clamp(moved, s.min, s.max))
  // 2d. ⭐⭐ THE LEGIBILITY LAW – ONE ROW, ON AN EXPOSURE WEEK, IN PLAIN WORDS (§3c: «every dip
  //     explainable»). ⚠⚠ IT IS GATED ON THE **EVENTS** AND NEVER ON THE POINTS, which is deliberate
  //     and is ruling N's measurement turned into a rule: the term's worst contribution for a calm
  //     open girl is 2.40 against a 2.50 distance to the `dimmed` edge, and a habituated one takes
  //     three tenths – so a row gated on «did the number move visibly» would go silent on exactly
  //     the weeks the player most needs the sentence. A week the light was on is a week the feed
  //     says so.
  //     ⚠⚠ AND THE ROW IS DATED BY WHEN IT PRINTS, WHICH IS ONE WEEK AFTER WHAT IT NAMES – ruling P
  //     (v77 T3b). The list handed down describes `world.week − 1`; the row is stamped `world.week`
  //     because a feed row is dated by the week the player reads it, exactly like the pressure it
  //     explains, which also lands in THIS week's spirit. So the row sits beside the dip it accounts
  //     for, which is the legibility law's whole point, and `EXPOSURE_ROW`'s own draft says «last
  //     week» rather than «this week» so the sentence and the stamp agree.
  //     ⚠ ONE ROW PER WEEK AND NOT ONE PER EVENT – §3c's own «the feed is not a ledger». A week that
  //     held a title, a shoot and a wrong story is charged three times and printed once.
  //     ⚠ NO `amountCents` AND NO FIGURE (the no-cents law, wave-3 §0.5): the row says the light was
  //     on, never what it cost – the fog law forbids the number as firmly here as on any screen.
  //     ⚠ AND NO `lifeKind`. The stamp's type is `LifeBeatKind` and §8 forbids a new member of it,
  //     so this row carries none. ⚠⚠ AND THE CONSEQUENCE IS MEASURED RATHER THAN LEFT TO A PLAYTEST:
  //     `lifeRowGlyph(undefined)` resolves through `?? 'met'` to `LIFE_ROW_EMOJI.life`, the owner's
  //     own 11.09 white heart, so this row wears the ROMANCE thread's mark in the feed's glyph
  //     column. who-she-is §5a forbids an agent picking a glyph unasked, so none was picked – the
  //     T3 suite's §H pins the fallback and the finding is carried to the architect.
  if (exposure.length > 0) {
    // ⚠ THE KEEP FLAG IS §4's OWN PROPOSAL AND IT IS UNRULED: «keep the first exposure row of a
    // season, drop repeats». The first exposure week of a season leaves a permanent trace (the album
    // can find the thread seasons later); the repeats are ordinary rows and prune with everything
    // else, so a famous career does not fill its save with a hundred identical sentences. ⚠ THE
    // QUESTION IS ASKED OF THE SEASON AND OF THIS ROW'S OWN TEXT, through `seasonStartWeek` – the
    // same helper `seasonWrapsWithNoVacation` above already reads, so «which season is this» keeps
    // one spelling in this module.
    const from = seasonStartWeek(world.week)
    const firstOfSeason = !world.events.some((e) => e.week >= from && e.text === EXPOSURE_ROW)
    addEvent(world, { week: world.week, type: 'life', text: EXPOSURE_ROW, ...(firstOfSeason ? { keep: true } : {}) })
  }

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
    //    ⚠⚠ AND SINCE THE ARCHITECT'S ВЫЧИТКА (13.09) THE TEST ALSO ASKS WHETHER THE SENTENCE IS
    //    TRUE – «sooner than last time» needs a last time, and `hadAnEarlierEnding` reads it off
    //    `loveEpisodes`' own dates. The predicate takes the world for that clause alone.
    if (recoveryReceiptEarned(world, shock, world.week)) {
      addEvent(world, { week: world.week, type: 'info', text: RECOVERY_RECEIPT })
    }
    world.spiritShock = null
  }
  // ⚠⚠ NOTHING GOES BELOW THIS LINE, AND THE LEANING PASS IS NOT WHAT GOES HERE – ruling F reserved
  // this tail for it and RULING P (13.09) moved it out again, to `driftWalls` immediately below,
  // called from `phaseHerWeek` the line after this function returns. Ruling F's REQUIREMENT is met
  // more exactly by the sibling than it was by the tail: «after `accrueSpirit` returns» is a place
  // nobody can drift away from. What the ruling protects is unchanged and is the reason both notes
  // exist: `intensity` is read ONCE at the head of this function and spent three ways, the week was
  // lived by the girl she was all week, and a flip is first read on the NEXT tick. ⚠ And what the
  // move buys is this function's ZERO-DRAW CONTRACT, which three pins and `phaseHerWeek`'s own
  // comment lean on: the flip hazard is a draw, and it is scoped to the function beside this one.
}

// =================================================================================================
// 4. ⭐⭐⭐ HER WALLS AND HER REGULATION – v76's T7 (who-she-is §2a, the 09.09 third-sitting re-cut)
// =================================================================================================
//
// «IDENTITY IS IMMUTABLE – WHAT DRIFTS IS WALLS AND REGULATION, EXPRESSION OVER AN UNCHANGING
// NATURE.» `world.temperament` is BIRTH, forever; this section maintains `world.wallsLean` – two slow
// accumulators of DISPLACEMENT from her own baseline – and `world.wallsFlipped`, the hysteresis state
// `expressedTemperamentOf` (§1) reads. Nothing here ever writes `temperament`, and nothing anywhere
// stores what `expressedTemperamentOf` returns.
//
// ⚠⚠ THE SIGN IS THE ARCHITECT'S RULING N AND EVERYTHING ELSE FOLLOWS FROM IT. **The lean is
// ABSOLUTE, and zero is her nature**:
//
//   axis    negative                                   0                positive
//   open    more private – walls up, she stops telling  as drawn        more open than her baseline
//   reg     more intense – dysregulated, she braces     as drawn        more steady than her baseline
//
// ⚠⚠ AND EACH GIRL HAS EXACTLY **ONE ARMABLE DIRECTION PER AXIS**, DECIDED AT BIRTH, because a flip
// means «the expressed pole is the opposite of birth» and there has to BE an opposite pole to reach:
//
//   born open    arms at −`flipArm` (expressed-private)   · positive is CLAMPED AT 0 – nowhere to grow
//   born private arms at +`flipArm` (expressed-open)      · negative accumulates and arms NOTHING
//   born steady  arms at −`flipArm` (expressed-intense)   · positive is CLAMPED AT 0
//   born intense arms at +`flipArm` (expressed-steady)    · negative accumulates and arms NOTHING
//
// ⭐ THE DIRECTION THAT CANNOT FLIP IS NOT WASTED – IT IS THE WHOLE OF «REPAIR IS FREE, GROWTH IS
// WORK». A born-private girl who was kicked for seasons carries a negative lean that changes no
// bucket and shows on no surface, and she must be walked back to 0 before a single point of growth
// can be bought. Neglect costs her the LADDER even where it cannot change who she is read as. That is
// why the lean is PERSISTED rather than derived.
//
// ⚠⚠ NO SURFACE SHOWS ANY OF THIS, AND THE ABSENCE IS DELIBERATE AND NAMED SO NOBODY ADDS ONE (the
// wave-5 brief's T7, in bold): no leaning on any screen, no flip line, no announcement, nothing on
// the wire – `wallsLean` and `wallsFlipped` are not on `Snapshot` and never become so. The existing
// surfaces ARE the telegraph: her face dims, the Mood word cools, the diary goes guarded, the feed
// goes quiet, for seasons before a flip lands. The album reads the arc later (step 6+).
//
// ⚠ WHAT THIS SECTION DOES NOT DO: it writes no feed row, raises no beat, moves no `bond` and no
// `spirit`, and reads no string. It is two numbers, two booleans and one hazard.

/** THE TWO AXES, as the ids the leanings, the flips and the streams are keyed by. `open` is the
 *  openness axis (`temperamentOpenness`), `reg` the regulation one (`temperamentIntensity`) – the
 *  field names `world.wallsLean` / `world.wallsFlipped` already carry, written down once here so a
 *  sweep can walk the pair by name. */
export type WallsAxis = 'open' | 'reg'

/** Both, in the order `driftWalls` visits them – exported so the tests and the census walk the set
 *  instead of re-listing it (`TEMPERAMENTS`' own argument, one concept over). */
export const WALLS_AXES: readonly WallsAxis[] = ['open', 'reg']

/** ⭐⭐ HAS THIS GIRL ANYWHERE TO GROW ON THIS AXIS – ruling N's table, as one predicate, and the ONE
 *  spelling of it. True for a born-PRIVATE girl on `open` and a born-INTENSE one on `reg`: those are
 *  the two who have an opposite pole to reach, so those are the two whose POSITIVE lean means
 *  anything. False for born-open and born-steady, whose positive side is clamped at 0.
 *
 *  ⚠ IT IS ALSO THE SIGN OF THE ARMABLE DIRECTION (`+1` when true, `−1` when false), which is why it
 *  is one predicate and not two: the direction a girl can flip in and the direction she can grow in
 *  are the same direction, by construction – that is what «beyond her baseline» means. */
function wallsGrowable(birth: Temperament, axis: WallsAxis): boolean {
  return axis === 'open' ? temperamentOpenness(birth) === 'private' : temperamentIntensity(birth) === 'intense'
}

/**
 * ⭐⭐⭐ THE WEEKLY LEANING PASS AND THE FLIP HAZARD – a SIBLING of `accrueSpirit`, never a block
 * inside it (the architect's RULING P, 13.09), called from `world/phaseHerWeek.ts` on the line
 * immediately after it.
 *
 * ⚠⚠ WHY A SIBLING, WHICH IS THE HALF RULING F GUESSED WRONG AND RULING P MEASURED. Ruling F put this
 * pass «at the tail of `accrueSpirit`» and its REASON – a flip must not bite its own week – is
 * untouched and is honoured here more exactly: «after `accrueSpirit` returns» is not a place a later
 * editor can drift away from, and the `intensity` const at that function's head stays ONE read for
 * that whole pass. What the location buys is the other property: `accrueSpirit` today reaches no
 * stream at all, `phaseHerWeek` states its **zero-draw contract** in a comment one commit old, and
 * THIS function's flip hazard is a draw. Keeping the draw out of it leaves that contract provable and
 * gives the count-keys net an exact subject instead of a whole weekly pass.
 *
 * ⚠⚠ THE ORDER INSIDE IS DRIFT FIRST, THEN THE HAZARD, and both are per axis. The week's pattern is
 * priced onto the lean, and only then do the dice ask whether it showed – so the week a lean reaches
 * the arm can be the week it fires. Ruling F is satisfied by the CALL SITE and not by this order:
 * whatever flips here is first READ on the next tick, because every reader of
 * `expressedTemperamentOf` in the tick has already run.
 *
 * ⚠⚠ ZERO DRAWS UNLESS AN AXIS IS ARMED, AND THAT IS THE LOAD-BEARING SHAPE RATHER THAN A SAVING:
 * the whole leaning arithmetic is deterministic, and `rngFromSeed` is not reached at all on an
 * unarmed axis-week – never derive-and-discard. Two axes arm independently on two keys
 * (`seed:life:walls:open:<week>` / `…:reg:<week>`), so §1f's one-value-per-key law is satisfied by
 * the axis being IN the key. MAIN is untouched: the frozen capture (41550 / e6b0c709) cannot see this
 * function.
 *
 * ⚠⚠ `psychologistWorks` IS THE SEAT'S BILLING PREDICATE, HANDED DOWN – ruling J's law and ruling P's
 * own ⚠ («O6's ×0.75 is the seat's work and a standing-down seat slows nothing»). It is the SAME
 * value `accrueSpirit` was given on the line above, which is the same answer `resolvePsychologist`
 * gives itself later in the tick. All THREE of the seat's walls effects ride it – the O6 slow-down,
 * the `'herself'` acceleration and the beyond-baseline hazard scale – so there is no week on which
 * the family pays nothing and receives any of them. ⚠ `psychologistFocus` and `psychologistRung` are
 * read straight off the world for `shockBeingWorked`'s own reason: a CHOICE and a DIAL are not a
 * working week and no predicate owns them.
 *
 * ⚠⚠ AND THE DRIFT ITSELF RUNS ON EVERY WEEK OF EVERY CAREER, INCLUDING A COLLEGE FREEZE AND A
 * BOOKED FAMILY WEEK. Only the seat stands down. The walls are a fact about her life and her parent,
 * not about a retainer – §2a's «walls RISE from neglect itself – no purchase, no work» – so the bond
 * band is asked every week and the free repair runs every week. This is also why the frozen careers,
 * which never hire, still drift: that is this wave's own expected diff, not a leak.
 *
 * ⚠ IT WRITES `world.wallsLean` AND `world.wallsFlipped` AND NOTHING ELSE. No `spirit`, no `bond`, no
 * `events`, no `lifeLog`, no string. `accrueSpirit` stays the one writer of `world.spirit`.
 */
export function driftWalls(world: WorldState, psychologistWorks: boolean): void {
  const w = ECONOMY.life.walls
  const p = ECONOMY.psychologist
  // ⚠ THE `??` COURTESIES ARE `accrueSpirit`'s, for its reason: every real world – created or
  // migrated – carries all of these, and a probe world hand-built in a test or a bench predates them.
  const birth = world.temperament ?? temperamentFor(world.seed)
  const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
  // ⭐ THE TWO HALVES OF THE LADDER, AND THEY EXHAUST IT – `bondBandOf` returns exactly these four, so
  // every week of every career is either a kick week or a care week and the lean always moves.
  const kicked = band === 'strained' || band === 'cold'
  const rung = world.psychologistRung ?? p.defaultRung
  // ⚠ ALL THREE SEAT TERMS ASK `psychologistWorks` FIRST, so a stood-down week is a ×1 week.
  const retained = psychologistWorks && rung >= 2
  const herself = psychologistWorks && (world.psychologistFocus ?? null) === 'herself'
  const lean = world.wallsLean ?? { open: 0, reg: 0 }
  const flipped = world.wallsFlipped ?? { open: false, reg: false }

  for (const axis of WALLS_AXES) {
    const growable = wallsGrowable(birth, axis)
    let value = lean[axis] ?? 0

    // 1. THE DRIFT, BY THE CURRENT BOND BAND (§2a's three bullets, in ruling N's signs).
    if (kicked) {
      // ⚠⚠ WALLS UP ON **BOTH** AXES, AND WITH NO CLAMP AT 0 ON THE WAY DOWN – kicks close her and
      // dysregulate her, and a positive lean is eaten first. That is the owner's 09.09 re-cut in
      // arithmetic: «если она стала более открытой, а ее начали пинать, то она вполне может и назад
      // откатиться». The one-way door was the thesis half-applied.
      // ⚠ O6: a RETAINED seat at rung ≥ 2 slows the RISE, any focus. It does not touch the hazard.
      value -= w.risePerWeek * (retained ? p.wallsRetentionSlow : 1)
    } else if (value < 0) {
      // ⚠⚠ REPAIR IS FREE AND STOPS AT HER NATURE. `Math.min(0, …)` is «toward 0 and NOT past it» –
      // the walk home ends at her own baseline, and going further is a different thing that has to be
      // bought with her own work. ⚠ THE TERM RUNS WITH NOBODY HIRED: `psychologistWorks` appears only
      // inside the ×1.5, never in front of the step. Gating any part of this road behind the retainer
      // is a design violation and not a tuning miss (§0.3, «мы ни за что не наказываем»).
      value = Math.min(0, value + w.repairPerWeek * (herself ? p.wallsHerselfRepair : 1))
    } else if (growable && herself) {
      // ⚠⚠ BEYOND HER BASELINE – AND THIS BRANCH IS THE ANTI-«HUGGED INTO AN EXTRAVERT» DAM. Reaching
      // it needs ALL THREE at once: a `close`/`steady` bond (the `else` of `kicked`), the `'herself'`
      // focus actually being worked this week, and an axis with somewhere to grow. A caring career
      // with no focus produces ZERO beyond-baseline movement, ever – a hard invariant, not a corridor
      // (§2a: «without HER chosen work, her nature holds and only the relationship opens»).
      value += w.growthPerWeek
    }
    // ⚠ AND THE FOURTH CASE IS «NOTHING», WHICH IS A ROW OF THE TABLE AND NOT A GAP IN IT: a POSITIVE
    // lean on a caring week with no focus held simply STAYS. What she has built does not decay under
    // care – it decays under kicks, which is the branch above. §2a's only decay rule is «walls RISE
    // from neglect itself»; there is no «growth fades» row anywhere in the model, and inventing one
    // would make the `'herself'` year a subscription rather than a year's work.

    // 2. THE CLAMPS. ⚠ A GIRL WITH NOWHERE TO GROW NEVER GOES POSITIVE – ruling N's «positive is
    //    clamped at 0: she is already open, there is nowhere to grow». It is belt-and-braces beside
    //    the branch above (which never adds for her) and it is the line that makes the claim true of
    //    a POKED world too, which is where a test can reach it.
    if (!growable) value = Math.min(0, value)
    value = roundTenth(clamp(value, -w.leanMax, w.leanMax))
    lean[axis] = value

    // 3. IS THE AXIS ARMED – ruling N's hysteresis, as STATE rather than as a rule of thumb. A flip
    //    does NOT reset the lean; the boolean and the accumulator are independent and the lean keeps
    //    drifting under a flip.
    //
    //    ⚠⚠ THE THRESHOLD IS READ ALONG THE GIRL'S OWN ARMABLE DIRECTION (`toward`, below) AND NOT AS
    //    `|lean|`, AND THE DIFFERENCE IS MEASURED RATHER THAN STYLISTIC. Ruling N writes the un-flip
    //    as «`|lean| <= flipRelease`», and on the three-quarters of cases the ruling's own examples
    //    reach the two readings are IDENTICAL – a born-open girl's lean is clamped at 0, so her only
    //    flip and her only un-flip both live on the negative side. They part in exactly one place: a
    //    born-PRIVATE (or born-INTENSE) girl who GREW past +`flipArm`, flipped, and was then kicked
    //    all the way through the release band and past −`flipRelease`. Under `|lean|` she is stuck
    //    EXPRESSED-OPEN with deep walls and nothing can arm the un-flip until she is walked back up
    //    to −40 – the girl who stopped telling you anything, still read by every mechanic as the open
    //    one. Under the signed reading the collapse un-does the flip it was a collapse from, which is
    //    what the walls are for. ⚠ CARRIED BACK TO THE ARCHITECT AS A CORRECTION TO RULING N.
    //
    //    `toward` is the lean measured in the direction birth left open: positive means «displaced
    //    toward the pole she can reach», negative «displaced the other way, where nothing arms».
    const toward = growable ? value : -value
    const armed = flipped[axis] ? toward <= w.flipRelease : toward >= w.flipArm
    // ⚠⚠ THE DEAD ZONE IS THE `else` OF THIS LINE AND IT ARMS NOTHING IN EITHER DIRECTION: unflipped
    //    below `flipArm`, or flipped above `flipRelease`. It is what makes a flip «an event of
    //    seasons» rather than a flicker, and it is the whole of the hysteresis.
    if (!armed) continue
    // ⚠⚠ THE RUNG SCALES THE BEYOND-BASELINE **FLIP** AND NOTHING ELSE – ruling N: «the seat
    //    accelerates her own work and never her collapse». So: not on a walls-up flip, not on ANY
    //    un-flip (`!flipped[axis]` is the whole of it), and not on a week the seat stands down.
    const scale = !flipped[axis] && growable && psychologistWorks ? (p.wallsHazardScale[rung] ?? 1) : 1
    // ⭐ ONE UNIFORM, ONE AXIS, ONE WEEK, ITS OWN KEY – and `<` rather than `<=`, `rollArrival`'s own
    //    reason: a hazard of 0 must be impossible rather than merely unlikely, since `rngFromSeed`
    //    can return exactly 0.
    if (rngFromSeed(`${world.seed}:life:walls:${axis}:${world.week}`)() < w.flipHazardPerWeek * scale) {
      flipped[axis] = !flipped[axis]
    }
  }

  // ⚠ THE TWO OBJECTS ARE WRITTEN BACK RATHER THAN MUTATED IN PLACE ALONE, so a probe world that
  // carried neither key ends the pass carrying both – the same courtesy `rollArrival`'s `??=` extends
  // to `loveEpisodes`, and the reason the `??` reads above cannot silently drop a week's drift.
  world.wallsLean = lean
  world.wallsFlipped = flipped
}

/** THE ONE WRITER for every `bond` delta – clamped to 0..100 and rounded onto the 0.5 grid, so no
 *  decision site has to remember either rule. `world.bond` is the only field it touches. */
export function applyBondDelta(world: WorldState, delta: number): void {
  const b = ECONOMY.bond
  world.bond = roundHalf(clamp((world.bond ?? b.start) + delta, b.min, b.max))
}
