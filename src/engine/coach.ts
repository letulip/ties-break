// THE COACH MARKET (docs/specs/coach-tiers.md) - a ladder of tiers, a roster of people on it, and
// a price that depends on which world you are hiring in.
//
// WHAT IT REPLACES. `coachSetup: 'parent' | 'hired'` and two expense bands: parent $120-400/wk,
// hired $250-700/wk. The bench's verdict on that model was unambiguous - 25k middle + hired went
// bankrupt in 120 careers out of 120, at week 61 - and the spec's reading of the owner's price
// research says why: today's single `hired` band is a smear across three real tiers, and its
// midpoint (~$475/wk) is an ELITE coach. The middle family was never choosing a coach; it was being
// handed the most expensive one in the game.
//
// THE WEEKLY BILL IS FOUR NUMBERS MULTIPLIED, and each one is a decision the family owns:
//
//   RATE      what THIS coach charges an hour, drawn once from his tier's band and kept for the
//             career. Tier bands follow the owner's per-hour research, by her AGE band - three rows
//             and not four, because his own caveat is that 17-22 and 22-28 barely differ and 29+
//             holds level once the work becomes maintenance.
//   HOURS     how much of him she gets, off the SAME plan slider that drives development. This is
//             the half the old model was missing: `plan.train` scaled the development rate and
//             (barely) the bill, but hours are what a coach actually charges for. 4 / 5 / 6 sessions
//             across light / balanced / grind.
//   CORRIDOR  which market she trains in. NOT a discount for being poor - the same rung costs
//             different money in a working-class club, an ordinary academy and a premium one,
//             because the court, the city and the queue for that coach's time are different. The
//             owner's correction, and the reason the wealthy family pays MORE for the same rung.
//   JITTER    the week itself: a session moved, a court at a worse hour, an extra half hour before
//             a tournament. This is the ONE main-stream draw the bill spends.
//
// ...and FIT is the fifth number, on the development side rather than the price side: whether this
// coach can teach the game she plays. Screen T's great / good / off pills, sourced from her
// `playStyle` against HIS - a coach coaches the game he played.
//
// RNG DISCIPLINE. The weekly bill spends EXACTLY ONE main-stream draw - the jitter `pickInt`, in
// the same position the old expense `pickInt` held - and rate, hours and corridor are all post-draw
// multiplies off pure look-ups or private sub-streams. The roster is built on `seed:coaches`, its
// own stream. The frozen MAIN capture (41550 draws / e6b0c709) cannot move.

import { ECONOMY } from './economy'
import { pickInt, rngFromSeed } from './rng'
import { SURNAMES } from './season/cohort'
import type { CoachTier, FamilyBackground, PlayStyle, WeekPlan } from '../shared/protocol'

/** The ladder, cheapest first. Exported as an array so the UI, the bench and the tests iterate the
 *  rungs in ONE agreed order instead of each re-listing them. */
export const COACH_TIERS: readonly CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']

/** The four rungs you can actually hire someone at. `self` is the parent, and has no roster. */
export const HIREABLE_TIERS: readonly CoachTier[] = ['budget', 'middle', 'high', 'elite']

/** Screen T's three pills. `great` = he coaches this game for a living, `good` = he can work with
 *  it, `off` = she would be learning someone else's game. */
export type StyleFit = 'great' | 'good' | 'off'

/** Player-facing rung names. Short dash only - never an em dash. */
export const COACH_TIER_LABEL: Record<CoachTier, string> = {
  self: 'Self-coached',
  budget: 'Budget',
  middle: 'Middle',
  high: 'High',
  elite: 'Elite',
}

/** One person on the market. Pure derivation of the world seed - never persisted, so a roster can
 *  never desync from the career that hired off it. */
export interface Coach {
  /** stable id, and also the art stem: 'budget-1', 'elit-3'. Readable in a save. */
  id: string
  tier: CoachTier
  /** the game HE plays, which is what makes him great / good / off for hers */
  style: PlayStyle
  name: string
  /** his own hourly rate in cents, MIDDLE-corridor anchored (see coachWeeklyCents) */
  rateCents: number
}

// Adult first names for the roster. The junior pool in season/cohort.ts is girls' names by
// construction (it names a field of teenage players), so coaches need their own; SURNAMES is the
// shared pool and they draw from it like everyone else. Split by gender because the portraits are
// of specific people - a name that fights the face is a bug you can see.
const COACH_FIRST_M = [
  'Andres', 'Bruno', 'Cesar', 'Damir', 'Emil', 'Ferran', 'Goran', 'Hugo',
  'Ivan', 'Janko', 'Karel', 'Lucas', 'Marek', 'Niko', 'Otto', 'Pavel',
  'Rafa', 'Stefan', 'Tomas', 'Viktor',
]
const COACH_FIRST_F = [
  'Adela', 'Barbara', 'Carla', 'Daniela', 'Eva', 'Fiona', 'Gabi', 'Helena',
  'Irina', 'Judit', 'Katrin', 'Lidia', 'Magda', 'Nadia', 'Paula', 'Renata',
  'Sabine', 'Tania', 'Ulrike', 'Vesna',
]

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

/** The [lo, hi] hourly rate band for one rung at one age, in cents, MIDDLE-corridor anchored. */
export function coachRateBandCents(tier: CoachTier, ageYears: number): readonly [number, number] {
  return ECONOMY.coach.hourlyRateCents[tier][coachAgeBand(ageYears)]
}

/** Billed court hours this week, from the training split. An hour is a session (the owner's own
 *  conversion), and `ECONOMY.coach.sessionsByTrain` anchors the three plan presets at 4 / 5 / 6.
 *
 *  Clamped at both ends, so a plan outside the preset range (the RNG-invariance test pokes
 *  `train: 100`) bills the top of the ladder rather than running off it. Pure arithmetic - ZERO
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

/** What the parent's rung costs an hour: the MIDDLE of the self band.
 *
 *  Self has no roster and nobody to be dearer than, so unlike a hired coach it does not draw a rate
 *  of its own - the band expresses "court time costs $10-30/h" and the rung takes the middle of it.
 *  Rounded to whole cents so the ledger stays integer. */
export function selfRateCents(ageYears: number): number {
  const [lo, hi] = coachRateBandCents('self', ageYears)
  return Math.round((lo + hi) / 2)
}

/** The middle of a background's wealth corridor - the number a QUOTE uses.
 *
 *  The engine bills through one roll mapped into `[lo, hi]` (see coachCorridorFactor), so a real
 *  week lands either side of this. A price on a card has to be one number, and the honest one is
 *  the middle of the market she is buying in. */
export function coachCorridorMid(background: FamilyBackground): number {
  const [lo, hi] = ECONOMY.wealthCorridor[background]
  return (lo + hi) / 2
}

/** The corridor factor for ONE week, off the private `seed:coachbg:<week>` sub-stream - the same
 *  roll, on the same stream, that priced coaching before the tier slice took it off. Mirrors
 *  travelBgFactor / medicalBgFactor: one uniform roll into the background's band, POST-draw, so the
 *  main-stream sequence can never depend on background. */
export function coachCorridorFactor(seed: string, week: number, background: FamilyBackground): number {
  const [lo, hi] = ECONOMY.wealthCorridor[background]
  return lo + rngFromSeed(`${seed}:coachbg:${week}`)() * (hi - lo)
}

/** THE QUOTE: what this rate costs a week in this market, at this plan. `corridor` defaults to the
 *  quoting midpoint; the engine passes the week's own roll when it charges.
 *
 *  One rounding, in one place, so the card, the budget meter and the ledger cannot disagree. */
export function coachWeeklyCents(
  rateCents: number,
  plan: WeekPlan,
  background: FamilyBackground,
  corridor: number = coachCorridorMid(background),
): number {
  return Math.round(rateCents * coachHoursForPlan(plan) * corridor)
}

/** The [lo, hi] weekly bill ONE rate can produce here - what the family's own coaching line will
 *  land between, week to week. Carries the corridor's spread and the week jitter, which are the two
 *  things that still move once a coach is hired and his rate is fixed. */
export function coachBillRangeCents(
  rateCents: number,
  plan: WeekPlan,
  background: FamilyBackground,
): [number, number] {
  const [cLo, cHi] = ECONOMY.wealthCorridor[background]
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  const hours = coachHoursForPlan(plan)
  return [
    Math.floor((rateCents * hours * cLo * jLo) / 10_000),
    Math.ceil((rateCents * hours * cHi * jHi) / 10_000),
  ]
}

/** The [lo, hi] weekly bill a whole RUNG can produce here - the range screen T prints on a tier
 *  section header, and the bound the tests hold a drawn bill inside. Carries the week jitter at
 *  both ends, so it is the true envelope rather than the quote's. */
export function coachWeeklyBandCents(
  tier: CoachTier,
  ageYears: number,
  plan: WeekPlan,
  background: FamilyBackground,
): [number, number] {
  const [rLo, rHi] = coachRateBandCents(tier, ageYears)
  const [cLo, cHi] = ECONOMY.wealthCorridor[background]
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  const hours = coachHoursForPlan(plan)
  return [
    Math.floor((rLo * hours * cLo * jLo) / 10_000),
    Math.ceil((rHi * hours * cHi * jHi) / 10_000),
  ]
}

/** How a coach's game reads against hers. His own style is always `great`; the affinity table says
 *  which neighbours are `good`; everything else is `off`.
 *
 *  Its sharpest consequence is worth saying out loud: aggressive and serve-first read across (both
 *  are first-strike tennis) while counterpuncher is the opposite philosophy and does not, and
 *  all-court is never wrong for anybody in either direction - the generalist's whole job. */
export function styleFitBetween(coachStyle: PlayStyle, kidStyle: PlayStyle): StyleFit {
  if (coachStyle === kidStyle) return 'great'
  return ECONOMY.coach.styleAffinity[coachStyle].includes(kidStyle) ? 'good' : 'off'
}

/** The fit of whoever she actually trains with - `null` being the parent, who taught her the game
 *  she plays and so is never wrong for it and never a specialist in it. */
export function coachFitFor(coach: Coach | null, kidStyle: PlayStyle): StyleFit {
  return coach ? styleFitBetween(coach.style, kidStyle) : ECONOMY.coach.selfFit
}

/** THE DEVELOPMENT MULTIPLIER - what the rung is worth, against what it costs.
 *
 *  Replaces `ECONOMY.development.coachParent` (0.82) and `coachHired` (1.15). Those two values are
 *  kept as the ENDS of the ladder on purpose: they are the measured, tuned numbers Phase 4's
 *  "roughly a factor of two between the laziest and the most committed setup" was measured against,
 *  so pinning the ladder to them means the spread cannot widen by accident and any change the bench
 *  reads comes from the CHOICE becoming real rather than from a bigger ruler.
 *
 *  The steps between them shrink as they climb (+0.13, +0.09, +0.07, +0.04) while the price roughly
 *  doubles every two rungs. That asymmetry is the design: Elite is a luxury, not an optimisation. */
export function coachFactor(tier: CoachTier, fit: StyleFit): number {
  return ECONOMY.coach.developmentFactor[tier] * ECONOMY.coach.fitFactor[fit]
}

/** Does this rung come with the physio relationship `physioActive` defaults to?
 *
 *  The old rule was "a hired coach comes with a physio", and self-coaching is the only rung that is
 *  not a hire - so the rule survives the ladder unchanged. */
export function coachIncludesPhysio(tier: CoachTier): boolean {
  return tier !== 'self'
}

// --- THE ROSTER --------------------------------------------------------------------------------

/** Every coach on the market for this career, cheapest tier first.
 *
 *  A PURE DERIVATION of the seed, which is the whole design: nothing is persisted, so a roster can
 *  never drift away from the career that hired off it, and `coachById` can resolve a saved id years
 *  later without a migration. Drawn on `seed:coaches` - its own stream, never the weekly one.
 *
 *  Who these people ARE is fixed (portrait, tier, style, gender all come from ECONOMY.coach.roster,
 *  because the art is of specific people); what the seed draws is their names and their individual
 *  rates. Two careers on different seeds meet the same faces at different prices under different
 *  names, which is what a market looks like from one family's side of it.
 *
 *  ⚠ The rate depends on her AGE, so a coach's price rises with her - the same person, the same
 *  POSITION in his tier's band, more money because what he is teaching has changed. The draw order
 *  is age-independent, so that position is stable for the whole career even as the band moves under
 *  it: a coach who is dear for his rung at 14 is dear for it at 22. */
export function buildCoachRoster(seed: string, ageYears: number): Coach[] {
  const rng = rngFromSeed(`${seed}:coaches`)
  return ECONOMY.coach.roster.map((slot) => {
    const pool = slot.gender === 'm' ? COACH_FIRST_M : COACH_FIRST_F
    const first = pool[pickInt(rng, 0, pool.length - 1)]
    const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
    const [lo, hi] = coachRateBandCents(slot.tier, ageYears)
    return {
      id: slot.portrait,
      tier: slot.tier,
      style: slot.style,
      name: `${first} ${last}`,
      rateCents: pickInt(rng, lo, hi),
    }
  })
}

/** One coach by id, or null for the parent (and for an id no roster knows). */
export function coachById(seed: string, ageYears: number, id: string | null): Coach | null {
  if (!id) return null
  return buildCoachRoster(seed, ageYears).find((c) => c.id === id) ?? null
}

/** The rung she is training at - `self` when nobody is hired. */
export function tierOf(coach: Coach | null): CoachTier {
  return coach ? coach.tier : 'self'
}

/** THE ELITE GATE, and it is OFF by default (ECONOMY.coach.eliteGate.enabled). The owner asked for
 *  it as an option: an Elite coach does not take a fourteen-year-old with nothing to show, so the
 *  top rung becomes something earned rather than something rich families buy in week 1.
 *
 *  Every surface asks THIS - the market's row state, the hire command's refusal and the screen's
 *  lock - so turning it on is one flag and not a hunt. */
export function coachHireable(coach: Coach, kidPoints: number): boolean {
  const gate = ECONOMY.coach.eliteGate
  if (!gate.enabled || coach.tier !== 'elite') return true
  return kidPoints >= gate.minPoints
}

/** How many ranking points short of an Elite coach she is, or null when he is not refusing. */
export function eliteGateShortfall(coach: Coach, kidPoints: number): number | null {
  if (coachHireable(coach, kidPoints)) return null
  return ECONOMY.coach.eliteGate.minPoints - kidPoints
}

// --- WHAT A RUNG IS WORTH TO HER, RIGHT NOW ----------------------------------------------------

/** The share of her remaining headroom a season of weekly growth takes, at one coach factor and one
 *  luck draw. `growWeek` gains `rate x headroom x luck` each week, so what is left of the headroom
 *  decays by `(1 - rate x luck)` per week and the share taken is one minus that, compounded. */
function headroomShareTaken(rateWeekly: number, luck: number, weeks: number): number {
  return 1 - Math.pow(Math.max(0, 1 - rateWeekly * luck), weeks)
}

/** WHAT THIS COACH WOULD ADD, FOR HER, RIGHT NOW - the projection screen T prints on a coach row.
 *
 *  THE OWNER ASKED FOR THIS AS A NUMBER and sketched the answer himself: «"budget может добавить
 *  0-2%", "middle 1-3%", "high 2-4%" но всё зависит от ребенка». It is COMPUTED rather than written
 *  down, because the game already knows it and a hand-written band drifts the moment a knob moves.
 *  (Measured on a fresh 14-year-old at the balanced plan, the computation reproduces his three
 *  bands almost exactly - the strongest evidence available that this is the quantity he meant.)
 *
 *  WHAT IT MEASURES, precisely: the extra overall level she would reach over one season with THIS
 *  rung rather than self-coached, as a percentage of the level she is at today. The baseline is the
 *  parent because the parent is the free option, so this answers "what am I buying".
 *
 *  "ВСЁ ЗАВИСИТ ОТ РЕБЕНКА" IS NOT A DISCLAIMER - IT IS THE HEADROOM. `growWeek` takes a share of
 *  the distance still to go, so the same coach is worth more to a thirteen-year-old with room than
 *  to a girl already against her ceiling, and this returns exactly that. It also falls away as the
 *  age curve flattens, which is true and which no written band could say.
 *
 *  A RANGE, NEVER A NUMBER: the weekly luck draw is real spread (0.55-1.45), so the two ends are
 *  that band's ends. And never a promise - the copy says what a rung CAN add.
 *
 *  Pure: zero draws on any stream. Returns [lo, hi] as percentages of her current level. */
export function coachSeasonUplift(input: {
  /** her attributes today, in any fixed order */
  skills: readonly number[]
  /** her ceilings, in the SAME order */
  potential: readonly number[]
  plan: WeekPlan
  /** the rung being priced */
  tier: CoachTier
  /** how that rung's coach reads against her game */
  fit: StyleFit
  /** the age and train factors, injected so this file does not import development.ts back */
  ageFactor: number
  trainFactor: number
}): [number, number] {
  const n = input.skills.length
  if (n === 0) return [0, 0]
  const current = input.skills.reduce((a, b) => a + b, 0) / n
  const headroom = input.skills.reduce((a, v, i) => a + Math.max(0, input.potential[i] - v), 0) / n
  if (current <= 0 || headroom <= 0) return [0, 0]

  const weeks = ECONOMY.coach.upliftHorizonWeeks
  const [luckLo, luckHi] = ECONOMY.development.weekLuck
  const base = input.ageFactor * input.trainFactor
  const rateCoach = base * coachFactor(input.tier, input.fit)
  const rateSelf = base * coachFactor('self', ECONOMY.coach.selfFit)

  const at = (luck: number): number =>
    ((headroomShareTaken(rateCoach, luck, weeks) - headroomShareTaken(rateSelf, luck, weeks)) * headroom * 100) /
    current

  // Luck is shared by both arms, so the ends of the band are the ends of the DIFFERENCE too: a
  // lucky season grows the gap as well as the gain. Clamped at zero - a rung never subtracts.
  const lo = Math.max(0, at(luckLo))
  const hi = Math.max(0, at(luckHi))
  return lo <= hi ? [lo, hi] : [hi, lo]
}
