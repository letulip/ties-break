// THE SERVE SPEED, AND IT IS HER AGE'S NUMBER (docs/specs/equipment-and-serve-speed.md §1).
//
// What shipped before this file existed, in one line: `128 + serve x 0.45, jitter +/-8`. There was
// NO AGE TERM AT ALL, so a fourteen-year-old and a nineteen-year-old with the same `serve` attribute
// served identically, and the 128 was a floor - nobody in this game had ever served slower than
// about 120 km/h. The owner, playing: «мои "пушки" показывают иной раз 160+ км/ч на подаче».
//
// Reality, and the corridor he approved: a fourteen-year-old girl's first serve is 120-140 km/h, a
// strong one about 150; WTA professionals average roughly 155-165. So the shipped model handed every
// child a good adult's serve and then added her skill on top.
//
// ⚠ THE AGE TERM IS A FUNCTION, NOT A TABLE OF TWO ROWS, and that is a requirement rather than a
// preference. The owner wants the childhood prologue to «дорасти» into the corridor
// (docs/specs/childhood-prologue.md), which means the SAME curve has to be readable at six as at
// nineteen. A two-row table for {14, 19} would have to be extended by hand for every age the
// prologue invents; a function inherits for free, and `serveSpeedBase(6)` already answers.
//
// It is a LOGISTIC because that is the shape a growing body actually has: nearly flat in early
// childhood, steepest through puberty, flattening into an adult plateau. A straight line through the
// owner's two checkpoints would be negative at age 6 and would have a twenty-five-year-old serving
// 200 km/h on average, and both of those are the line being asked to do a curve's job.
//
// PURE, ZERO RNG. Every consumer (the box score, the ace rate, any future prologue screen) reads the
// same two functions, so the number on one screen can never disagree with the number on another.

/** Small-child asymptote: the floor the curve flattens onto below about age 8. */
const SPEED_FLOOR = 48
/** Adult plateau: growth stops paying and only skill moves the number after ~22. */
const SPEED_PLATEAU = 126
/** Steepest point of the growth curve - 13, which is where a girl's growth spurt actually peaks. */
const SPEED_MIDPOINT = 13
/** Steepness, SOLVED (not chosen) from the owner's two checkpoints together with SPEED_MIDPOINT. */
const SPEED_STEEPNESS = 0.4137

/** What a point of `serve` is worth in km/h. Raised from the shipped 0.45 deliberately: with the
 *  floor gone, TALENT has to show more than the base does, which is the whole complaint about the
 *  old model. At 0.55 the spread from skill 30 to skill 90 is 33 km/h against a 25 km/h spread from
 *  age 14 to 19 - so at any age her serve is her own, and at any skill her age is still legible. */
export const SPEED_PER_SKILL = 0.55

/** Uniform +/- band around the mean, per serve struck. Unchanged from the shipped model. */
export const SPEED_JITTER = 8

/** A second serve is struck this much slower. Unchanged from the shipped model. */
export const SECOND_SERVE_DROP = 14

/** Pre-branch `WorldMatch.a/.b` snapshots were frozen into saves without an age (the field did not
 *  exist), and those box scores are still re-openable. They fall back to the age the career opens
 *  at, which is what almost every surviving snapshot actually is: the event log is capped at 400
 *  rows and pruned, so a stored match is rarely more than a season or two old. Cosmetic either way -
 *  it moves the "Max serve" row of an old box score and nothing else. */
export const LEGACY_SNAPSHOT_AGE = 14

/**
 * The age half of the serve: what a girl of `ageYears` serves before any skill is added, in km/h.
 *
 * Anchored on the owner's two checkpoints, which this curve reproduces exactly rather than
 * approximately (95.0 at 14, 120.0 at 19 - see tests/match/serveSpeed.test.ts):
 *
 *   age  |  6    10    12    14    16    18    19    22    25
 *   base | 52.1  65.5  79.0  95.0 108.5 117.2 120.0 124.2 125.5
 *
 * Accepts a FRACTIONAL age on purpose - `kidAgeExact` is what the world holds, and a December girl
 * genuinely serves a shade slower than a January girl in the same draw. That is the relative age
 * effect showing up in a place it has every right to.
 */
export function serveSpeedBase(ageYears: number): number {
  return SPEED_FLOOR + (SPEED_PLATEAU - SPEED_FLOOR) / (1 + Math.exp(-SPEED_STEEPNESS * (ageYears - SPEED_MIDPOINT)))
}

/**
 * Her serve speed with the jitter taken out: the number the model MEANS, in km/h.
 *
 * This is the honest readout the design asks for. It moves for exactly two reasons and both are
 * real: she got older, or her effective `serve` moved - which is how a dead string bed reaches this
 * number without anything feeding km/h back into the match (see engine/equipment.ts).
 */
export function expectedServeSpeed(ageYears: number, serveSkill: number): number {
  return serveSpeedBase(ageYears) + serveSkill * SPEED_PER_SKILL
}

/** One struck serve, jittered. `rng` is the caller's per-point speed stream; exactly one draw. */
export function serveSpeedOf(rng: () => number, ageYears: number, serveSkill: number, secondServe: boolean): number {
  const jitter = (rng() * 2 - 1) * SPEED_JITTER
  return Math.round(expectedServeSpeed(ageYears, serveSkill) + jitter - (secondServe ? SECOND_SERVE_DROP : 0))
}
