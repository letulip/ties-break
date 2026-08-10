// Point-win probability model. Turns a matchup + point context into p, the
// probability the server wins the next point. Pure math, no RNG here – the
// caller draws against the returned p.

import type { Side, Tour, Surface, MatchPlayer, MatchOptions, PointContext } from './types'
import { LEGACY_SNAPSHOT_AGE, serveSpeedBase } from './serveSpeed'

export const TOUR_AVG_P: Record<Tour, number> = { atp: 0.63, wta: 0.57 }
export const SURFACE_SERVE_BONUS: Record<Surface, number> = { hard: 0, grass: 0.015, clay: -0.015 }

const SKILL_K = 0.0016 // p shift per skill point

/** p shift per point of GROUNDSTROKE ADVANTAGE (v25, docs/specs/skills-radar.md §5).
 *
 *  DELIBERATELY BELOW `SKILL_K`. The serve is the most valuable shot in tennis, so a ten-point serve
 *  edge must still outweigh a ten-point forehand; at 0.0011 against 0.0016 it does, by about a third.
 *
 *  It multiplies a DIFFERENCE, which is the whole reason this term can be added to a calibrated
 *  model at all: the rally is contested by both players, so `(server - receiver)` is the honest
 *  shape, and it is exactly zero when they are level. Every symmetric fixture, every calibration
 *  band and the tour's average serve percentage are therefore untouched by construction - the same
 *  "neutral is byte-identical" property match/style.ts is built around. */
const RALLY_K = 0.0011

/** p shift per km/h of AGE-DRIVEN SERVE PACE ADVANTAGE (equipment-and-serve-speed slice).
 *
 *  The owner: «если можем сделать так, чтобы скорость подачи менялась и на что-то в матче влияла -
 *  это будет топ». This is that, and it is admissible for exactly the reason `RALLY_K` is: it
 *  multiplies a DIFFERENCE, so it is zero when the two players match and every symmetric fixture,
 *  every calibration band and the tour average stay byte-identical by construction.
 *
 *  ⚠ IT IS THE AGE HALF OF THE SPEED AND NOTHING ELSE, AND THAT IS NOT A SIMPLIFICATION - IT IS THE
 *  ONLY PART THAT IS NOT ALREADY IN THIS FORMULA. Her full serve speed is `serveSpeedBase(age) +
 *  serve x 0.55`. The second half IS `server.serve`, which the first leg above already reads, and her
 *  equipment already reaches that attribute at the composition point - so a term built on the whole
 *  speed would count her strings, her condition, her surface and her talent a second time, and would
 *  be arithmetically indistinguishable from quietly raising SKILL_K. `serveSpeedBase` is the one
 *  thing here that `basePServe` has never known: how big she is.
 *
 *  ⚠ AND IT READS WHOLE YEARS, the BAND rather than the girl (the distinction world.ts argues at
 *  length for `ageAtWeek` vs `kidAgeExact`). Two reasons, both load-bearing: the cohort stores whole
 *  years while the kid carries a fraction, so comparing them raw would invent a systematic edge out
 *  of a rounding mismatch; and the fractional part is the relative age effect, which this game
 *  ALREADY pays for in skill points (`relativeAgeHeadStart`). Reading it here too would pay for it
 *  twice. Inside one age band this term is exactly 0.
 *
 *  SIZED against the same yardstick as the equipment (SKILL_POINTS_PER_YEAR = 2.4, one year of
 *  junior development). Per year of age gap at the steepest part of the curve it is worth ~0.7 skill
 *  points, and even the widest gap this game can produce - a fourteen-year-old against a nineteen-
 *  year-old, 25 km/h of pace - comes to 2.34, still inside one year of relative age. A tiebreaker
 *  between players, never a replacement for talent. */
const PACE_K = 0.00015

const BASE_CLAMP: [number, number] = [0.42, 0.82]
const FINAL_CLAMP: [number, number] = [0.3, 0.9]
const BIG_POINT_MAX_PENALTY = 0.03
const MOMENTUM_BONUS = 0.015
const MOMENTUM_MIN_STREAK = 3
const FATIGUE_START = 120 // point number
const FATIGUE_RATE = 0.0003 // per point past start, scaled by (1 - stamina/100)
const FATIGUE_CAP = 0.03

export interface Streak {
  side: Side
  length: number
}

function clamp(x: number, [lo, hi]: [number, number]): number {
  return x < lo ? lo : x > hi ? hi : x
}

// Barnett–Clarke matchup adjustment around the tour average, then surface bonus.
//
// FOUR LEGS NOW (v25 made it three). The serve is measured against 50 on the server's side, the
// return against 50 on the receiver's, and the RALLY against THE OTHER PLAYER - because a serve is
// hit by one person and a rally by both. Whoever hits bigger off the ground therefore holds better
// AND breaks better, which is what being the bigger hitter means and which neither of the first two
// terms can say. There is no `- 50` on those legs on purpose: they are a matchup, not a level.
//
// THE FOURTH LEG IS PACE, and it is the same shape for the same reason: a difference, worth exactly
// nothing between two players of the same age. A sixteen-year-old's serve arrives 13 km/h faster than
// a fourteen-year-old's before either of them has any talent, and until this line the model could not
// say that - two girls with `serve: 60` held identically whether one of them was a child. See PACE_K
// for why it is the AGE half of the speed alone and why it reads whole years.
export function basePServe(server: MatchPlayer, receiver: MatchPlayer, opts: MatchOptions): number {
  const p =
    TOUR_AVG_P[opts.tour] +
    (server.serve - 50) * SKILL_K -
    (receiver.ret - 50) * SKILL_K +
    (server.groundstrokes - receiver.groundstrokes) * RALLY_K +
    paceAdvantage(server, receiver) * PACE_K +
    SURFACE_SERVE_BONUS[opts.surface]
  return clamp(p, BASE_CLAMP)
}

/** The server's age-driven pace edge over the receiver, in km/h. Exactly 0 inside one age band, and
 *  exactly 0 for any player built without an age (every fixture, every calibration case), so this
 *  leg can never perturb a number that was calibrated before it existed. */
export function paceAdvantage(server: MatchPlayer, receiver: MatchPlayer): number {
  const bandOf = (p: MatchPlayer): number => Math.floor(p.age ?? LEGACY_SNAPSHOT_AGE)
  return serveSpeedBase(bandOf(server)) - serveSpeedBase(bandOf(receiver))
}

// Per-point term (already min-capped at FATIGUE_CAP) for one player's stamina.
//
// ⚠ EXPORTED SINCE THE RETIREMENT SLICE, and the export is the whole design of that feature rather
// than a convenience. See `retireHazard` directly below.
export function fatigueTerm(pointNumber: number, stamina: number): number {
  return Math.min(FATIGUE_CAP, (pointNumber - FATIGUE_START) * FATIGUE_RATE * (1 - stamina / 100))
}

/** How much she is spent, per point, as a NON-NEGATIVE number – `fatigueTerm` clamped at zero.
 *
 *  `fatigueTerm` is allowed to go negative (it is subtracted from p before `FATIGUE_START`, where
 *  the multiplication by a negative point offset is harmless because the caller gates on
 *  `ctx.pointNumber > FATIGUE_START`). A hazard cannot be negative, so the gate is expressed here
 *  instead of being assumed by every reader. Exactly 0 for a player with stamina 100 and for every
 *  point up to and including FATIGUE_START. */
export function spentness(pointNumber: number, stamina: number): number {
  return pointNumber <= FATIGUE_START ? 0 : Math.max(0, fatigueTerm(pointNumber, stamina))
}

/** THE RETIREMENT HAZARD – the per-point chance that this player stops.
 *
 *  ⚠ IT IS NOT A TIER KNOB, AND THAT IS THE DESIGN INSTRUCTION, NOT AN ECONOMY. A retirement rate
 *  scaled by the sign on the door would say "W100s break girls, J30s do not", which is a statement
 *  about tournaments; this says "a long match on tired legs breaks girls", which is a statement
 *  about a body. Tier-dependence arrives anyway and for free: a harder draw plays longer matches
 *  and more of them, so it integrates more hazard – measured, not asserted, in
 *  docs/specs/match-retirement.md §4.
 *
 *  It reads `spentness`, i.e. THE SAME QUANTITY `modifiedPServe` already subtracts from p past
 *  FATIGUE_START. One fatigue curve in this file, two consumers: it costs her points first and then,
 *  at RETIRE_K times the same number, it costs her the match. A girl with stamina 100 can never
 *  retire, and neither can anybody inside the first FATIGUE_START points – which is the honest
 *  shape, because the fiction is exhaustion and not a slipped ankle at 2-2. See §7 of the spec for
 *  what that deliberately does not model.
 *
 *  ⚠ ZERO DRAWS. This is arithmetic; the single uniform per side is drawn by `simulateMatch` off a
 *  sub-stream private to the match seed, so adding this moved no existing sequence anywhere. */
export function retireHazard(pointNumber: number, stamina: number): number {
  return RETIRE_K * spentness(pointNumber, stamina)
}

/** The multiplier that turns "how spent she is" into "how likely she is to stop".
 *
 *  CALIBRATED, NOT CHOSEN. Target: 2.73% of matches end in a retirement by either player – women's
 *  ITF World Tennis Tour, 7,291 of ~266,900 matches (PLOS ONE, June 2024; see
 *  docs/research/retirement-and-withdrawal.md §7). Measured against a full career corpus in
 *  docs/specs/match-retirement.md §4; re-measure there before moving this number. */
export const RETIRE_K = 0.07

export function modifiedPServe(
  base: number,
  server: MatchPlayer,
  receiver: MatchPlayer,
  ctx: PointContext,
  streak: Streak | null,
): number {
  let p = base

  // 1. Momentum: a run of >= MOMENTUM_MIN_STREAK points nudges p toward the streak holder.
  if (streak && streak.length >= MOMENTUM_MIN_STREAK) {
    p += streak.side === ctx.server ? MOMENTUM_BONUS : -MOMENTUM_BONUS
  }

  // 2. Big point (Klaassen–Magnus): servers underperform on break points, more so with low composure.
  if (ctx.breakPoint) {
    p -= (1 - server.composure / 100) * BIG_POINT_MAX_PENALTY
  }

  // 3. Fatigue: past FATIGUE_START the server tires (subtract) while a tired returner helps (add).
  if (ctx.pointNumber > FATIGUE_START) {
    p -= fatigueTerm(ctx.pointNumber, server.stamina)
    p += fatigueTerm(ctx.pointNumber, receiver.stamina)
  }

  // 4. Final clamp.
  return clamp(p, FINAL_CLAMP)
}
