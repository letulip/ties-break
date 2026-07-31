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
//
// ⚠ AND SINCE 31.07 THAT PROMISE COVERS THE JITTERED NUMBER TOO - see `pointServeSpeeds` at the foot
// of this file. The owner asked for the speed of the serve ON THE COURT SCREEN, live, next to the
// player who struck it; that is a SECOND reader of a number the box score already reports, and two
// readers of one serve that disagree is worse than no reading at all. The seeding recipe (which
// stream, and in what order the serves draw from it) therefore moved down here beside the model
// instead of being copied into the viewer.

import type { AnnotatedPoint } from '../../viz/types'
import { rngFromSeed } from '../rng'
import type { MatchPlayer, Side } from './types'

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

/** A serve as it was actually struck in a point, tied to the shot it is. */
export interface StruckServe {
  /** index into the point's `rally.shots`, so a caller watching one shot can find its own reading */
  shotIndex: number
  /** who struck it */
  side: Side
  /** km/h, integer - the number both the box score and the court screen report */
  kmh: number
  /** true for a second serve, which the model strikes SECOND_SERVE_DROP slower */
  secondServe: boolean
}

/**
 * EVERY SERVE STRUCK IN ONE POINT, IN THE ORDER IT WAS STRUCK, IN KM/H.
 *
 * ⚠ THIS IS THE ONLY PLACE THE PER-POINT SPEED STREAM IS SEEDED OR READ, and that is the whole
 * reason it exists. Two things have to be true at once for the screen not to lie:
 *
 *   1. The seed is per POINT (`<match seed>:spd:<point number>`), so a match always reports the same
 *      speeds however many times it is re-opened, re-simulated or watched back.
 *   2. Every serve in the point draws from that one stream IN STRIKE ORDER - first serve, then the
 *      second if there was one. Draw them in a different order, or open a second stream for the
 *      second reader, and the live number stops being the number the box score sums.
 *
 * Both callers - `matchStats.computeMatchStats` (the box score's avg/max rows) and MatchViewer's
 * live reading in the court's bottom run-off band - go through here, so they agree BY CONSTRUCTION
 * rather than by two implementations happening to match. tests/match/matchStats.test.ts re-derives
 * the box score from this function's output to prove the two readings are one number.
 *
 * `pointNumber` is taken off `point.entry` rather than `point.rally` deliberately: the box score has
 * always seeded from the log entry's number, and asking each caller to remember which of the two to
 * pass is exactly the drift this function is here to remove.
 *
 * Pure and total: a point with no serve shots at all returns an empty list.
 */
export function pointServeSpeeds(
  seed: string,
  point: AnnotatedPoint,
  playerA: MatchPlayer,
  playerB: MatchPlayer,
): StruckServe[] {
  const age: [number, number] = [playerA.age ?? LEGACY_SNAPSHOT_AGE, playerB.age ?? LEGACY_SNAPSHOT_AGE]
  const serveSkill: [number, number] = [playerA.serve, playerB.serve]
  const rng = rngFromSeed(`${seed}:spd:${point.entry.pointNumber}`)
  const struck: StruckServe[] = []
  const shots = point.rally.shots
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i]
    if (shot.kind !== 'serve1' && shot.kind !== 'serve2') continue
    const side = shot.by
    const secondServe = shot.kind === 'serve2'
    struck.push({
      shotIndex: i,
      side,
      kmh: serveSpeedOf(rng, age[side], serveSkill[side], secondServe),
      secondServe,
    })
  }
  return struck
}
