// THE COACH LADDER (docs/specs/coach-tiers.md) – a ladder of tiers instead of a boolean.
//
// WHAT IT REPLACES. `coachSetup: 'parent' | 'hired'` and two expense bands: parent $120-400/wk,
// hired $250-700/wk, both scaled by the family's wealth corridor. The bench's verdict on that
// model was unambiguous – 25k middle + hired went bankrupt in 120 careers out of 120, at week 61 –
// and the spec's reading of the owner's own price research says why: today's single `hired` band
// is a smear across three real tiers, and its midpoint (~$475/wk) is an ELITE coach. The middle
// family was never choosing a coach; it was being handed the most expensive one in the game.
//
// THE MODEL IS THREE NUMBERS MULTIPLIED, and each one is a decision the family owns:
//
//   RATE   what an hour of this tier's time costs, by her AGE band. The owner's research is a
//          per-hour ladder (docs/specs/coach-tiers.md §2), so that is the unit we keep. Age raises
//          it because what is being coached has changed – the same hour is worth more to a
//          seventeen-year-old than to an eleven-year-old.
//   HOURS  how much of him she gets, off the SAME plan slider that drives development. This is the
//          half the old model was missing: `plan.train` scaled the development rate and (barely)
//          the bill, but hours are what a coach actually charges for. 3 sessions a week at 60,
//          6 at 85.
//   FIT    whether this coach can teach the game she plays. Screen T's great / good / off pills,
//          sourced from data we already have (her `playStyle` against what the tier's money buys).
//
// The weekly bill is RATE x HOURS. It is NOT wealth-corridor scaled, and that is deliberate: the
// tier now says explicitly what the corridor used to say implicitly, so keeping both would charge
// the difference twice – a working family would pick Budget AND get a discount on it. A coach's
// rate is a market rate; it is the same number for everyone, and what differs is who can pay it
// (the same argument that keeps prize money outside the corridor). The corridor still prices
// travel, medical and the planner's packages, where it belongs.
//
// RNG DISCIPLINE. The weekly bill spends EXACTLY ONE main-stream draw – the rate `pickInt`, in the
// same position the old expense `pickInt` held – and everything else here is post-draw arithmetic
// off pure look-ups. The frozen MAIN capture (41550 draws / e6b0c709) cannot move.

import { ECONOMY } from './economy'
import type { CoachTier, PlayStyle, WeekPlan } from '../shared/protocol'

/** The ladder, cheapest first. Exported as an array so the UI, the bench and the tests iterate the
 *  rungs in ONE agreed order instead of each re-listing them. */
export const COACH_TIERS: readonly CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']

/** Screen T's three pills. `great` = he coaches this game for a living, `good` = he can work with
 *  it, `off` = she would be learning someone else's game. */
export type StyleFit = 'great' | 'good' | 'off'

/** Player-facing rung names. Short dash only – never an em dash. */
export const COACH_TIER_LABEL: Record<CoachTier, string> = {
  self: 'Self-coached',
  budget: 'Budget coach',
  middle: 'Middle-tier coach',
  high: 'High-tier coach',
  elite: 'Elite coach',
}

/** Which age-rate row `ageYears` falls in: 0 = the 12-16 development years, 1 = 17-22, 2 = 23+.
 *
 *  Three rows, not four, and that is the owner's own caveat: 17-22 and 22-28 barely differ, and
 *  29+ holds level because past the peak the work becomes maintenance rather than construction. */
export function coachAgeBand(ageYears: number): 0 | 1 | 2 {
  const [devEnd, proEnd] = ECONOMY.coach.ageBandUpper
  if (ageYears <= devEnd) return 0
  if (ageYears <= proEnd) return 1
  return 2
}

/** The [lo, hi] hourly rate band, in cents, for one rung at one age. */
export function coachRateBandCents(tier: CoachTier, ageYears: number): readonly [number, number] {
  return ECONOMY.coach.hourlyRateCents[tier][coachAgeBand(ageYears)]
}

/** Billed court hours this week, from the training split. The owner's conversion bills one hour per
 *  session, so sessions ARE hours here (docs/specs/coach-tiers.md §2 prices its table "x4 h/wk" off
 *  "3-5 sessions a week"); `ECONOMY.coach.sessionsByTrain` anchors the three plan presets and this
 *  interpolates linearly between them.
 *
 *  Clamped at both ends, so a plan outside the preset range (the RNG-invariance test pokes
 *  `train: 100`) bills the top of the ladder rather than running off it. Pure arithmetic – ZERO
 *  draws on any stream, so nothing here can move the frozen MAIN capture. */
export function coachHoursForPlan(plan: WeekPlan): number {
  const anchors = ECONOMY.coach.sessionsByTrain
  const train = plan.train
  if (train <= anchors[0][0]) return anchors[0][1]
  for (let i = 1; i < anchors.length; i++) {
    const [x0, y0] = anchors[i - 1]
    const [x1, y1] = anchors[i]
    if (train <= x1) return y0 + ((y1 - y0) * (train - x0)) / (x1 - x0)
  }
  return anchors[anchors.length - 1][1]
}

/** THE WEEKLY BILL, given an already-drawn hourly rate: rate x hours, rounded once to whole cents.
 *
 *  Split out from the draw so the UI can quote the band's ends with the same arithmetic the engine
 *  charges the middle of, and so the one place rounding happens is here. */
export function coachWeeklyCostCents(rateCents: number, plan: WeekPlan): number {
  return Math.round(rateCents * coachHoursForPlan(plan))
}

/** The [lo, hi] weekly bill this rung can produce at this age and this plan – the band the UI
 *  quotes and the tests bound the drawn bill by. */
export function coachWeeklyBandCents(tier: CoachTier, ageYears: number, plan: WeekPlan): [number, number] {
  const [lo, hi] = coachRateBandCents(tier, ageYears)
  return [coachWeeklyCostCents(lo, plan), coachWeeklyCostCents(hi, plan)]
}

/** How this rung reads against the game she plays.
 *
 *  Sourced from what the money buys, which is the only honest source we have before the Coach
 *  Market screen gives coaches names and specialisations of their own: a club coach taking four
 *  kids at once teaches shape and consistency, a technical specialist builds weapons, and a former
 *  tour player has seen all of it. The consequence is a real one and worth saying out loud – a big
 *  serve is the expensive build, because nobody below High can teach one. */
export function coachStyleFit(tier: CoachTier, style: PlayStyle): StyleFit {
  const row = ECONOMY.coach.styleFit[tier]
  if (row.great.includes(style)) return 'great'
  if (row.good.includes(style)) return 'good'
  return 'off'
}

/** THE DEVELOPMENT MULTIPLIER – what the rung is worth, against what it costs.
 *
 *  Replaces `ECONOMY.development.coachParent` (0.82) and `coachHired` (1.15). Those two values are
 *  kept as the ENDS of the ladder on purpose: they are the measured, tuned numbers Phase 4's
 *  "roughly a factor of two between the laziest and the most committed setup" was measured
 *  against, so pinning the ladder to them means the spread cannot widen by accident and any change
 *  the bench reads comes from the CHOICE becoming real rather than from a bigger ruler.
 *
 *  The steps between them shrink as they climb (+0.13, +0.09, +0.07, +0.04) while the price roughly
 *  doubles every two rungs. That asymmetry is the design: Elite is a luxury, not an optimisation,
 *  and the wealthy family buys it because it can rather than because it pays. */
export function coachFactor(tier: CoachTier, fit: StyleFit): number {
  return ECONOMY.coach.developmentFactor[tier] * ECONOMY.coach.fitFactor[fit]
}

/** Does this rung come with the physio relationship `physioActive` defaults to?
 *
 *  The old rule was "a hired coach comes with a physio", and self-coaching is the only rung that
 *  is not a hire – so the rule survives the ladder unchanged. */
export function coachIncludesPhysio(tier: CoachTier): boolean {
  return tier !== 'self'
}
