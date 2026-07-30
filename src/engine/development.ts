// THE DEVELOPMENT SYSTEM (Phase 4) – she gets better, and it is earned.
//
// WHAT IT REPLACES. Until now her build was drawn once from `seed:kid` and never moved again.
// Measured over 6 careers, her raw power was 48.33 at week 1 and 48.33 at week 180, while the
// cohort's top ten climbed 57.8 -> 62.8 and its median 46.6 -> 51.0. The game had no story of
// growth in it at all: it had a dice roll at birth, and a world that slowly walked away from her.
// That is also the whole explanation for the owner's "killer" career - a high roll stayed high
// forever, because nothing developed.
//
// THE SHAPE IS THE PLAN'S, NOT AN INVENTION (docs/plan.md, Phase 4): "potential + age curves
// (calibrate to real milestones: points ~17-18, top-100 ~4.5 yrs later, peak 23-28, decline ~29+),
// weekly training allocation, coach quality". Four ideas, and each one is a lever the player either
// owns or must live with:
//
//   POTENTIAL is a ceiling per attribute, rolled once per career and never shown (decisions.md #11:
//     "axes without numbers; contour sharpens as coach confidence grows"). It is what makes two
//     girls different beyond their starting numbers, and what makes a parent's job finite: you
//     cannot train her into someone else.
//   HEADROOM makes growth asymptotic. A week's gain is proportional to how far she still is from
//     her ceiling, so early years move fast, the last few points never quite arrive, and nobody
//     grinds their way past their own talent.
//   THE AGE CURVE decides how much of that headroom a week can take: steep at 14-17, tapering
//     through the early twenties, a plateau across the peak, then decline.
//   THE PLAYER'S LEVERS are the training split (the plan slider) and the coach. Between the
//     laziest and the most committed setup there is roughly a factor of two - enough that the
//     choice matters, not so much that one right answer exists.
//
// DECLINE IS NOT SYMMETRIC, because bodies are not. Past the peak the physical attributes fall and
// composure keeps creeping up: the veteran is slower and calmer, which is the shape of every real
// late career and the reason a 30-year-old is still worth watching.
//
// RNG DISCIPLINE. Growth runs inside the weekly tick, so it may not touch the MAIN stream: the
// frozen capture (41550 draws / e6b0c709) must not move by a single draw. Every number here comes
// off `seed:growth:<week>` or `seed:potential`, created fresh and thrown away. Nothing in this file
// draws from the stream the tick is walking.

import { rngFromSeed } from './rng'
import { ECONOMY } from './economy'
import { coachFactor, coachFitFor, tierOf, type Coach } from './coach'
import type { PlayStyle, WeekPlan } from '../shared/protocol'

/** The attributes the match engine reads. Kept as a bare record so it serialises into the save as
 *  numbers and nothing else.
 *
 *  ⚠ FIVE SINCE v25 (owner, 30.07: «maybe add one or two other skills to our wind rose»). See
 *  docs/specs/skills-radar.md §5 for the argument; the short version is that the point model has
 *  three legs in real tennis - the serve, the return, and the rally that follows - and it had two. */
export interface KidSkills {
  serve: number
  ret: number
  composure: number
  stamina: number
  /** 0-100: how much she hurts people OFF THE GROUND - the rally, which is the leg the model was
   *  missing. Enters `basePServe` as a DIFFERENCE (the rally is contested by both players, unlike
   *  the serve and the return), so the bigger hitter both holds and breaks better. */
  groundstrokes: number
}

export type SkillKey = keyof KidSkills

/** ⚠ APPEND-ONLY, AND THIS IS NOT A STYLE PREFERENCE - THE ORDER IS A DRAW ORDER. `rollPotential`
 *  below walks this array taking one draw per key off `seed:potential`, and `startingSkills`
 *  (world.ts) draws in the same order off `seed:kid`. Appending a key adds its draw at the END of
 *  those sub-streams, which leaves every earlier draw byte-identical, so no existing career's build
 *  or ceiling moves by a hundredth. INSERTING one anywhere else would re-roll every career in
 *  existence from that position on. */
export const SKILL_KEYS: readonly SkillKey[] = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes']

/** Her ceiling, rolled once per career and never displayed. The band is deliberately wide: a career
 *  where the ceiling is barely above the floor is a real career, and it is the one the game has
 *  never been able to tell.
 *
 *  Drawn from `seed:potential` – its own stream, so adding this cannot move anything else. */
export function rollPotential(seed: string, start: KidSkills): KidSkills {
  const rng = rngFromSeed(`${seed}:potential`)
  const { potentialBand } = ECONOMY.development
  const out = {} as KidSkills
  for (const k of SKILL_KEYS) {
    const [lo, hi] = potentialBand
    // Headroom is measured from where she STARTS, so a girl who begins with a big serve does not
    // also get the biggest serve ceiling for free - the roll is what she can still add.
    out[k] = start[k] + lo + rng() * (hi - lo)
  }
  return out
}

/** How much of the available headroom a week can take, by age. The plan's calibration targets:
 *  first points at 17-18, top-100 about four and a half years later, peak 23-28, decline from 29. */
export function ageFactor(ageYears: number): number {
  const c = ECONOMY.development.ageCurve
  if (ageYears < c.growthEnd) {
    // 13-17: the steep years, easing off towards the top of the band rather than stopping dead.
    const t = Math.max(0, (ageYears - c.growthStart) / (c.growthEnd - c.growthStart))
    return c.peakRate * (1 - c.growthEase * t)
  }
  if (ageYears < c.plateauStart) {
    // 18-22: still climbing, and this is where the real gap between a managed career and a
    // squandered one opens up.
    const t = (ageYears - c.growthEnd) / (c.plateauStart - c.growthEnd)
    return c.peakRate * (1 - c.growthEase) * (1 - t) + c.plateauRate * t
  }
  if (ageYears < c.declineStart) return c.plateauRate // 23-28: the peak. Maintenance, not growth.
  return 0 // 29+: handled by `declineFactor` – past the peak she is not gaining at all.
}

/** Past the peak, what she LOSES per week. Physical only; composure is handled by the caller. */
export function declineFactor(ageYears: number): number {
  const c = ECONOMY.development.ageCurve
  if (ageYears < c.declineStart) return 0
  // Gentle at first and steeper every year, which is how careers actually end: a season of "still
  // fine", then a season where the legs are gone.
  return c.declineRate * (1 + (ageYears - c.declineStart) * c.declineAccel)
}

/** The training split, as a multiplier. `plan.train` runs 60 (light) to 85 (grind). */
export function trainFactor(plan: WeekPlan): number {
  const { trainAt60, trainAt85 } = ECONOMY.development
  const t = Math.max(0, Math.min(1, (plan.train - 60) / 25))
  return trainAt60 + (trainAt85 - trainAt60) * t
}

// ⚠ RE-AIMED: `coachFactor` moved to engine/coach.ts, and it is no longer a two-way switch – it
// reads a rung of the ladder AND how the COACH SHE HIRED fits the game she plays. The two values it
// used to return (0.82 parent, 1.15 hired) are unchanged, and are now the ends of that ladder.

/** ONE WEEK of development. Pure, total, and the only place skills change.
 *
 *  `matchesThisWeek` is competition: playing teaches things practice cannot, so a match week earns
 *  a bonus on top of its training. It is capped, because a girl who plays four matches in a week is
 *  not learning four times as much - she is getting tired, which the condition model already
 *  charges her for. */
export function growWeek(args: {
  skills: KidSkills
  potential: KidSkills
  ageYears: number
  plan: WeekPlan
  /** whoever she trains with, or null for the parent on the court */
  coach: Coach | null
  /** her game, which decides whether her coach can teach it (the great / good / off read) */
  playStyle: PlayStyle
  matchesThisWeek: number
  seed: string
  week: number
  /** W4 – HOW MUCH OF THE WEEK SHE ACTUALLY TRAINED, as a multiplier on the whole rate. Defaults to
   *  1, so every existing call site is byte-identical and no shipped career's growth moves.
   *
   *  ⚠ WHY THIS EXISTS RATHER THAN A LOWER `plan.train`. `trainFactor` clamps `(train - 60) / 25` to
   *  [0, 1], so a week written as train:40 develops at exactly the Light rate - and a career already
   *  on Light would have paid NOTHING for it. The knock's rest branch (engine/knock.ts) needs a cost
   *  that lands at every plan setting, so it is charged here, outside the clamp.
   *
   *  ZERO RNG IMPLICATIONS: the luck draw below is unchanged in count, key and position. */
  loadFactor?: number
}): KidSkills {
  const d = ECONOMY.development
  const { skills, potential, ageYears, plan, coach, playStyle, matchesThisWeek } = args
  const decline = declineFactor(ageYears)
  const rate =
    ageFactor(ageYears) *
    trainFactor(plan) *
    (args.loadFactor ?? 1) *
    coachFactor(tierOf(coach), coachFitFor(coach, playStyle)) *
    (1 + Math.min(matchesThisWeek, d.matchBonusCap) * d.matchBonus)

  // One draw for the whole week, shared across the attributes: a good week is a good week, and four
  // independent rolls would average into a smooth line that never feels like anything.
  const rng = rngFromSeed(`${args.seed}:growth:${args.week}`)
  const luck = d.weekLuck[0] + rng() * (d.weekLuck[1] - d.weekLuck[0])

  const out = {} as KidSkills
  for (const k of SKILL_KEYS) {
    const headroom = Math.max(0, potential[k] - skills[k])
    const gain = rate * headroom * luck
    // Composure keeps rising past the peak – experience is the one thing that does not fade.
    const loss = decline > 0 && k !== 'composure' ? decline * skills[k] : 0
    const veteranPoise = decline > 0 && k === 'composure' ? d.veteranPoise : 0
    out[k] = Math.max(d.floor, skills[k] + gain - loss + veteranPoise)
  }
  return out
}
