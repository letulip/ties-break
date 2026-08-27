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

/** ⭐ HOW BREAKABLE SHE IS TODAY – the retirement hazard's OWN freshness curve, and the whole of the
 *  27.08 fix. `condition` is 0-100, the same number she was composed at; 1.0 is the population's
 *  own centre, below 1 is safer than typical and above 1 is likelier to stop.
 *
 *  ⚠ IT EXISTS BECAUSE THE STRENGTH CURVE WAS THE WRONG ONE FOR THIS JOB, and that was measured
 *  before a line of this was written (docs/specs/retirement-shape-2026-08.md §6). `conditionMatchFactor`
 *  returns exactly 1 for every condition at or above its knee, so it borrowed a flat span into a
 *  place that needed a slope: a girl arriving at 95 and a girl arriving at 70 were THE SAME GIRL to
 *  this hazard, x1.00 to the last decimal, across the whole 70-100 band. Measured over 13,529 of her
 *  matches, arriving at 80+ she stopped in 0.70% +/- 0.13% of them and arriving at 70-79 in 1.04%
 *  +/- 0.34% – 0.9 standard errors apart, which is what "no effect" looks like from the outside.
 *  The owner, 27.08: «а если я приезжаю с 80-90 на турнир, то как будто вполне есть высокий шанс
 *  доиграть».
 *
 *  ⚠⚠ IT IS A REDISTRIBUTION, NOT A LEVEL CHANGE, AND THAT IS WHY `RETIRE_K` DID NOT MOVE. The
 *  research anchor is a LEVEL (2.73% of matches end in a retirement by either player) and it was
 *  already met – the professional arm reads 2.71%. So the pivot below is not a taste: it is the
 *  measured hazard-weighted mean condition of every player who steps on court in this game, which
 *  makes the population-weighted mean of this multiplier 1.0 BY CONSTRUCTION. The same number of
 *  retirements happen; a different set of girls suffer them. `tools/retirement-rate.ts` re-measures
 *  both halves and prints the mean it achieved.
 *
 *  ⚠ LINEAR, AND WITH NO KNEE OF ITS OWN. The knee is precisely the defect – the fix cannot be a
 *  second one somewhere else – and a straight line is the one shape whose weighted mean is solvable
 *  in closed form, so "exactly 1.0" is arithmetic rather than a search. Monotone over the WHOLE
 *  0-100 span, which is the property the flat curve did not have.
 *
 *  ⚠ IT CANNOT GO NEGATIVE OR INVERT: the clamp holds `condition` inside the legal 0-100 span, and
 *  `RETIRE_DURABILITY_SPAN` is chosen so the value at 100 stays positive. A hazard multiplied by a
 *  negative number would let a player un-retire, and the running sum in `simulateMatch` would stop
 *  being non-decreasing – the property that makes the sampler a threshold rather than a coin flip. */
export function retireDurability(condition: number): number {
  const c = condition < 0 ? 0 : condition > 100 ? 100 : condition
  return 1 + (RETIRE_DURABILITY_SPAN * (RETIRE_DURABILITY_PIVOT - c)) / 100
}

/** THE RETIREMENT HAZARD – the per-point chance that this player stops.
 *
 *  ⚠ IT IS NOT A KNOB ON THE DOOR SHE WALKED THROUGH, AND THAT IS THE DESIGN INSTRUCTION, NOT AN
 *  ECONOMY. A retirement rate scaled by the sign outside would say "W100s break girls, J30s do not",
 *  which is a statement about tournaments; this says "a long match on tired legs breaks girls",
 *  which is a statement about a body. The spread across the ladder arrives anyway and for free: a
 *  harder draw plays longer matches and more of them, so it integrates more hazard – measured, not
 *  asserted, in docs/specs/match-retirement.md §4.
 *
 *  It reads `spentness`, i.e. THE SAME QUANTITY `modifiedPServe` already subtracts from p past
 *  FATIGUE_START. One fatigue curve in this file, two consumers: it costs her points first and then,
 *  at RETIRE_K times the same number, it costs her the match. A girl with stamina 100 can never
 *  retire, and neither can anybody inside the first FATIGUE_START points – which is the honest
 *  shape, because the fiction is exhaustion and not a slipped ankle at 2-2. See §7 of the spec for
 *  what that deliberately does not model.
 *
 *  ⚠ AND SINCE 27.08 IT TAKES A SECOND NUMBER, `durability`, WHICH IS THE ONE THING `stamina` COULD
 *  NOT SAY. `stamina` conflates talent with freshness; `durability` is `retireDurability` of the
 *  condition she arrived at, handed in by the caller through `MatchOptions.condition`. It defaults
 *  to exactly 1, so every existing caller – and every fixture built without a body – integrates the
 *  identical curve it always did. Note what is still absent: this function has learned HOW FRESH
 *  the player is and nothing about WHO she is.
 *
 *  ⚠ ZERO DRAWS. This is arithmetic; the single uniform per side is drawn by `simulateMatch` off a
 *  sub-stream private to the match seed, so adding this moved no existing sequence anywhere. */
export function retireHazard(pointNumber: number, stamina: number, durability = 1): number {
  return RETIRE_K * spentness(pointNumber, stamina) * durability
}

/** The multiplier that turns "how spent she is" into "how likely she is to stop".
 *
 *  CALIBRATED, NOT CHOSEN. Target: 2.73% of matches end in a retirement by either player – women's
 *  ITF World Tennis Tour, 7,291 of ~266,900 matches (PLOS ONE, June 2024; see
 *  docs/research/retirement-and-withdrawal.md §7). Measured against a full career corpus in
 *  docs/specs/match-retirement.md §4; re-measure there before moving this number. */
export const RETIRE_K = 0.07

/** ⭐ THE CONDITION AT WHICH `retireDurability` IS EXACTLY 1 – and it is a MEASUREMENT, not a taste.
 *
 *  It is the hazard-weighted mean condition of every player who steps on court in this game: her on
 *  one side of the net and her opponent on the other, each match weighted by the hazard it actually
 *  carries (a match under FATIGUE_START carries none and votes not at all). Weighted that way, and
 *  only that way, does the population-weighted mean of a straight line through this point come out
 *  at 1.0 – and the expected number of retirements is `Σ hazard × durability`, so a mean of 1.0 over
 *  exactly that weighting is what leaves the 2.73% anchor standing.
 *
 *  ⚠ THE MATCH-COUNT-WEIGHTED MEAN IS THE WRONG ONE AND IT IS THE OBVIOUS MISTAKE HERE. Worn players
 *  play LONGER matches (153 points against 147 – retirement-shape-2026-08.md §3.3, and the sign is
 *  the opposite of what match-retirement.md §4.1 assumed), so they carry more hazard per match than
 *  their head-count deserves. Centring on the plain mean would leave the heavy end of the curve
 *  over-weighted in the only sum that matters and quietly RAISE the rate.
 *
 *  Re-measured by `npm run bench:retire`, which prints the weighted mean condition and the mean
 *  multiplier it achieved. Move this only with that run in hand. */
export const RETIRE_DURABILITY_PIVOT = 79.8

/** ⭐ HOW WIDE THE FRESHNESS LEVER IS – the full swing of `retireDurability` from condition 0 to
 *  condition 100, in multiples of the population's own risk.
 *
 *  ⚠ THE ONE FREE PARAMETER IN THE FIX. The pivot above is measured and the mean is arithmetic;
 *  this is the design choice, and the design brief is the owner's sentence: arriving at 80-90 must
 *  buy a materially better chance of finishing than arriving at 50, and the gap has to be legible in
 *  ONE career rather than only in a corpus of sixteen. Measured at 2.6, both condition channels
 *  together, at a 260-point match: 85 against 50 is **x2.67** and 90 against 50 is **x3.14** – where
 *  the whole 70-to-100 band was worth exactly **x1.00** before. Over six seasons the careful player
 *  now takes ~1.4 retirements and the grinder ~9 (it was 2.1 against 4.1), which is the "one career"
 *  half of the brief. Match length is still the dominant term at x21 and is deliberately untouched –
 *  retirement-shape-2026-08.md §10.3 belongs to the owner.
 *
 *  ⚠ ITS CEILING IS ARITHMETIC, NOT TASTE: the value at condition 100 is `1 - SPAN x (100 - PIVOT)
 *  / 100`, so a span at or above `100 / (100 - PIVOT)` would make a perfectly fresh player's hazard
 *  zero and then negative – and a negative multiplier would break the one property the sampler
 *  stands on, that the running sum is non-decreasing. That ceiling is 4.95 here. 2.6 leaves the
 *  freshest girl in the game at 0.475 of the population's risk and the emptiest at 3.075 – rare and
 *  common rather than impossible and certain, which is what the research says about both of them.
 *
 *  ⚠⚠ AND IT IS THE ONE DIAL IF THE OWNER WANTS THIS SOFTER. It is linear in effect and the trade is
 *  written out in retirement-shape-2026-08.md §13.3: a redistribution moves sub-populations by
 *  construction, so the professional arm – which arrives ~43 points BELOW the pivot every week under
 *  today's unre-priced economy – goes from 2.71% of matches to 3.92%. Holding that arm still would
 *  need a span of 0.07, at which arriving fresh buys x1.02 and nothing has been fixed. */
export const RETIRE_DURABILITY_SPAN = 2.6

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
