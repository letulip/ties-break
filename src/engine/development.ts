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
import { planWeek, sessionCounts, planSessions } from './plan'
import { SESSION_KINDS, type PlayStyle, type SessionKind, type WeekPlan } from '../shared/protocol'

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

/** ⚠⚠ WHAT «PHYSICAL» MEANS, AND IT IS THE PREDICATE `growWeek` ITSELF SPENDS – not a list somebody
 *  typed out beside it. The decline branch below reads `loss = decline * skills[k]` for exactly the
 *  keys this returns true for, and hands `composure` `veteranPoise` instead; so the answer to "which
 *  attributes does age take points off" is defined in ONE place and every reader gets the same four.
 *
 *  A hand-written `['serve', 'ret', 'stamina', 'groundstrokes']` would be a second home for that
 *  answer, and `SKILL_KEYS` is APPEND-ONLY (see above): the day a sixth attribute is appended,
 *  exactly one of the two would be updated and nothing would fail. */
export function isPhysicalSkill(k: SkillKey): boolean {
  return k !== 'composure'
}

/** The attributes `declineFactor` erodes, in `SKILL_KEYS`' order. DERIVED, never written down. */
export const PHYSICAL_SKILL_KEYS: readonly SkillKey[] = SKILL_KEYS.filter(isPhysicalSkill)

/** HER BODY AS ONE NUMBER: the mean of the attributes age takes points off.
 *
 *  ⭐⭐ A SCALAR MEAN IS EXACT HERE RATHER THAN A SIMPLIFICATION, and it has to be said out loud
 *  because the next reader will otherwise assume it is a fudge that got waved through. `growWeek`'s
 *  decline is PROPORTIONAL PER ATTRIBUTE – `loss = decline * skills[k]` – and past `declineStart`
 *  nothing else moves a physical attribute at all (`ageFactor` returns 0 from that age, so the gain
 *  term is 0). Each physical attribute is therefore multiplied by the SAME `(1 - decline)` every
 *  week, so each one keeps the same SHARE of its own peak, week for week – and the mean of numbers
 *  that have all been scaled by one factor is that factor times the mean. `physicalMean(now) / peak`
 *  is not an approximation of "how much of her body is left": it IS each attribute's own share, to
 *  the last decimal.
 *
 *  ⚠ AND THAT IS EXACTLY WHY COMPOSURE IS OUT rather than merely "not very physical". It GAINS
 *  `veteranPoise` past the peak, so folding it in would put a rising number inside a falling one:
 *  the share would understate the decay, and it would do so by more every year. */
export function physicalMean(skills: KidSkills): number {
  let total = 0
  for (const k of PHYSICAL_SKILL_KEYS) total += skills[k]
  return total / PHYSICAL_SKILL_KEYS.length
}

/** WHERE SHE CAN BE BORN, per attribute – the range `startingSkills` (engine/world/player.ts) draws
 *  each birth value out of.
 *
 *  ⚠ IT IS A NAMED CONSTANT SO THAT `SKILL_CEILING_MAX` BELOW CAN BE DERIVED. The five ranges used to
 *  be literals inside `startingSkills`, which was fine while nothing else needed to know them - and
 *  then the radar had to draw an axis whose top is the top of THIS plus the top of `potentialBand`,
 *  and a hand-copied 86 in a Vue file would have been a third place for the same fact to live.
 *
 *  ⚠ THE RANGES ARE UNCHANGED AND SO IS THE DRAW ORDER. `startingSkills` reads these keys in exactly
 *  the order its object literal used to spell them out, which is `SKILL_KEYS`'s order, which is the
 *  order the `seed:kid` sub-stream is walked in. Every career that already exists is born with the
 *  build it was born with, to the hundredth - see the note on SKILL_KEYS for why that matters. */
export const STARTING_SKILL_BAND: Record<SkillKey, readonly [number, number]> = {
  serve: [40, 58],
  ret: [40, 58],
  composure: [35, 55],
  stamina: [40, 60],
  groundstrokes: [40, 58],
}

/** ⚠ THE HIGHEST NUMBER THIS GAME CAN PRODUCE – AND NOBODY EVER CHOSE IT.
 *
 *  It is the accidental sum of two constants picked separately and years apart: the top of
 *  `STARTING_SKILL_BAND` (stamina, 60 - the others stop at 55 or 58) and the top of
 *  `ECONOMY.development.potentialBand` (26). Nothing in a career can go past their sum, because
 *  `rollPotential` is the only thing that sets a ceiling and it adds the second to the first; growth
 *  is asymptotic toward that ceiling and never overshoots it. A supremum rather than a maximum,
 *  strictly: `rng()` is in [0, 1), so the number itself is approached and not reached (85.998 was the
 *  best of sixty thousand seeds).
 *
 *  WHY IT IS EXPORTED. The skills radar drew a 0..100 rose, so the outer seventh of the picture was
 *  unreachable in every career for every seed, and the best girl the engine can roll still stopped a
 *  seventh short of the edge with nowhere left to go. Owner, 11.08: «если мы до 100 вообще не можем
 *  дорасти, то явно имеет смысл цену деления пересмотреть на графике, чтобы максимумы упирались в
 *  максимумы». This is the number the axis now ends at.
 *
 *  ⚠ AND IT IS DERIVED RATHER THAN WRITTEN DOWN, deliberately. The day `potentialBand` is widened -
 *  which is a live question, see docs/specs/skill-model-audit-2026-08.md's first dial - the chart has
 *  to follow on its own. A literal 86 in a component would go silently out of date on that commit and
 *  the picture would start lying about the top of the game with nothing failing. */
export const SKILL_CEILING_MAX =
  Math.max(...SKILL_KEYS.map((k) => STARTING_SKILL_BAND[k][1])) + ECONOMY.development.potentialBand[1]

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

// =================================================================================================
// THE RELATIVE AGE EFFECT (task 55) – the birth month stops being decoration
// =================================================================================================
//
// The owner, 30.07, on whether to keep `birthMonth` or take it out: «можно оставить и как раз вместе с
// №70 здесь же сделать». Kept, and this is it.
//
// WHAT IT IS. Junior tennis bands by CALENDAR YEAR, so a girl born in January and one born in December
// compete in the same 14s - and are up to eleven months apart. At fourteen, eleven months is not a
// rounding error: it is a real difference in height, strength and how long she has been training. The
// effect is one of the best-documented in youth sport, and every junior system in the world has it.
//
// ⚠ AND THE MODEL IS NOT A PENALTY, IT IS A CLOCK. A December girl does not develop more SLOWLY - she is
// simply younger than the band she is measured against. Her curve is SHIFTED IN TIME, not scaled: at
// calendar-age 14 she is developmentally ~13.5 and a January girl ~14.5.
//
// ⚠⚠ AND THE SHIFT ALONE IS NOT THE EFFECT - I SHIPPED THAT VERSION FIRST AND IT WAS BACKWARDS. This block
// used to claim "that single substitution produces the whole effect". It does not, and the failure was
// quiet enough to be worth recording: `ageFactor` DECREASES with age (the steep years ease off), so making
// the January girl developmentally OLDER made her develop marginally SLOWER. Both girls still finished at
// plausible levels, so nothing looked wrong - the model was simply inverted, and a test comparing two
// careers on one seed is what said so.
//
// The mistake was thinking the effect is about a RATE. It is not. It is about WHERE SHE IS NOW against the
// girls she is drawn with: at fourteen the January girl has had eleven more months of training and
// growing, so she is further along THIS SEASON - bigger, stronger, better - which is why she gets picked,
// coached and seeded. That is a level, not a slope.
//
// SO IT IS TWO HALVES, and together they are the phenomenon rather than half of it:
//   1. THE HEAD START (`relativeAgeHeadStart`, applied at `createWorld`). She begins ahead or behind.
//   2. THE CATCH-UP (the `ageFactor` shift, in world.ts at `growWeek`'s `ageYears`). The younger girl sits
//      earlier in the steep window and gains marginally faster, so the gap NARROWS - which is exactly why
//      the relative age effect washes out of senior tennis, and it needed no extra code once (1) existed.
//
// Zero new state, no schema, and NO NEW DRAW on either half - both are post-draw arithmetic, and the
// growth generator keeps its key. `birthMonth` has been on the profile since onboarding shipped, so every
// existing save already carries the number this reads.
//
// ⚠ AND THE CEILING IS NOT TOUCHED. `rollPotential` is fed the BIRTH build, never the head-started one -
// see the note at its call site. Being born in January must not make her able to get BETTER, only to be
// further along right now; feeding the head start into the ceiling would turn a timing effect into a
// talent effect, which is the one thing this task must never become.
//
// ⚠ NOT IN THIS SLICE: THE PHYSICAL MISMATCH. A late-born girl also plays opponents who are bigger, which
// should mean more injury exposure - and doing that honestly needs the COHORT to have birth months, which
// it does not. `ageInjuryFactor` is therefore untouched: bucketing her by a shifted age would flip some
// girls into a neighbouring integer bucket and call it epidemiology. Named here rather than half-built.

/** How much of a year's head start her birth month gives her over the MIDDLE of her band.
 *
 *  The band's median birth month is 6.5, so January (1) is +0.458 years and December (12) is -0.458.
 *  Symmetric by construction, so a random cohort of birth months is unbiased overall - the effect
 *  redistributes development timing inside a year, it does not add or remove any.
 *
 *  ⚠ CONSISTENT WITH `kidLife.ts`'s STANDING NOTE, which has said since the school tile shipped that
 *  «its `relativeAge(birthMonth) = (12 - birthMonth) / 12` keeps meaning exactly what it means today».
 *  That expression is this one plus a constant (it runs 0.917..0 where this runs +0.458..-0.458), so the
 *  note stays literally true and the two surfaces cannot disagree about who is the older girl. */
export function relativeAgeYears(birthMonth: number): number {
  const clamped = Math.max(1, Math.min(12, Math.round(birthMonth)))
  return (6.5 - clamped) / 12
}

/** What a year of junior development is worth, in skill points, for pricing the head start below.
 *
 *  MEASURED, not guessed: the skills run over 14->18 moved her mean attribute from 48.5 to 57.0-58.6
 *  depending on the coach rung, i.e. ~2.4 points a year. So the eleven months between a January girl and
 *  a December one is worth about 2.2 points of every attribute - a real edge in a match, and nothing like
 *  a different player. */
export const SKILL_POINTS_PER_YEAR = 2.4

/**
 * HER HEAD START AT WEEK 0, in skill points, for being older inside her own band.
 *
 * ⚠ THIS IS THE HALF I FIRST GOT WRONG, and a test caught it. My first wiring shifted ONLY the age handed
 * to `ageFactor` - and `ageFactor` DECREASES with age (the steep years ease off), so making the January
 * girl developmentally older made her develop marginally SLOWER. The model produced the exact opposite of
 * the relative age effect, and it did so quietly: both girls still ended a career at plausible levels.
 *
 * The error was thinking the effect is about a RATE. It is not. It is about WHERE SHE IS NOW relative to
 * the girls she is drawn against: at fourteen the January girl has had eleven more months of training and
 * growing, so she is simply further along - bigger, stronger, better THIS SEASON. That is why she gets
 * picked, coached and seeded, and none of it is a statement about her rate.
 *
 * So the effect is TWO halves, and together they are the phenomenon:
 *   1. THE HEAD START, here. She begins ahead, by the offset times what a year is worth.
 *   2. THE CATCH-UP, which the rate shift already produces for free - the younger girl sits earlier in
 *      the steep window, so she gains marginally faster and the gap narrows. That is precisely why the
 *      relative age effect is a JUNIOR phenomenon that washes out in senior tennis, and it needed no
 *      extra code at all once the first half was right.
 */
export function relativeAgeHeadStart(birthMonth: number): number {
  return relativeAgeYears(birthMonth) * SKILL_POINTS_PER_YEAR
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

/** The training split, as a multiplier. `plan.train` runs 60 (light) to 85 (grind).
 *
 *  ⚠ SINCE v47 `plan.train` IS A PROJECTION OF THE TICKED WEEK (4/5/6 sessions -> 60/75/85), so this
 *  function is unchanged and now means "how BIG the week is". Where it points is `aimWeights` below,
 *  and the two are deliberately different channels: the size buys the rate, the aim spends it. */
export function trainFactor(plan: WeekPlan): number {
  const { trainAt60, trainAt85 } = ECONOMY.development
  const t = Math.max(0, Math.min(1, (plan.train - 60) / 25))
  return trainAt60 + (trainAt85 - trainAt60) * t
}

// =================================================================================================
// WHERE THE WEEK POINTS (v47, docs/specs/training-dials.md §4) – and it REDISTRIBUTES, never adds
// =================================================================================================
//
// ⚠⚠ THE WEEK'S TOTAL RATE IS FIXED BY ITS SIZE; THE ROWS ONLY DECIDE WHERE IT LANDS. Six serve
// sessions do not improve her MORE than six mixed ones – they improve her DIFFERENTLY. If a row added
// rate rather than redirecting it, the choice would be a button marked "yes please", and knock.ts's
// standing rule is that a branch which always ends better is not a decision. The weight vector below
// therefore RENORMALISES: it always sums to `SKILL_KEYS.length`, so its mean is exactly 1 and the
// week's rate is conserved by construction rather than by tuning.
//
// ⚠ AND NO PENALTY TERM EXISTS OR IS NEEDED, which is the other half of «мы ни за что не наказываем».
// A season aimed at one wing is self-limiting through arithmetic that already ships: `growWeek` takes
// a share of the REMAINING distance to her ceiling, so a week pointed at a nearly-full wing converts
// into almost nothing – `max(0, potential[k] - skills[k])` is small – while the cohort keeps drifting
// up. The exploit eats itself, and nothing was added to make it.
//
// ⚠ THE BYTE-IDENTITY OF A MIGRATED CAREER LIVES IN THIS TABLE. `general` aims at all five, so a week
// of nothing but general sessions produces the all-ones vector for ANY session count – and it does so
// EXACTLY, in integer arithmetic, not by floating-point luck (see AIM_UNIT). That is what makes a v46
// save read back as itself: every shipped career has been running a general week since week one.

/** What each kind of session works on. The kinds the owner named, mapped onto the five attributes the
 *  match engine actually reads.
 *
 *  ⚠ `serve` IS TWO SKILLS AND THAT IS THE POINT: the block is «Serve & return», the first two shots
 *  of the point, and `basePServe` spends them as a pair. A block that trained only the serve would
 *  leave the return with no home at all. */
export const SESSION_AIM: Record<SessionKind, readonly SkillKey[]> = {
  general: SKILL_KEYS,
  serve: ['serve', 'ret'],
  rally: ['groundstrokes'],
  fitness: ['stamina'],
  matchplay: ['composure'],
}

/** ⚠ AIM IS ACCUMULATED IN INTEGER UNITS, AND THE REASON IS THE MIGRATION. A session spreads one unit
 *  of aim across its targets, and the target counts are 1, 2 and 5 – so a denominator of 10 makes
 *  every contribution a whole number and `5 * aim / (10 * sessions)` comes out at EXACTLY 1.0 for an
 *  all-general week of any size. Computed in floats it would not: `5 * (6/5) / 6` happens to land on 1
 *  today and is one rounding rule away from 0.9999999999999999, which would move a shipped career's
 *  skills in the seventh decimal and break §12 criterion 8 in a way no reader could see. */
const AIM_UNIT = 10

/** ⚠ §12 ITEM 3, OPEN AND WIRED RATHER THAN HALF-BUILT: does an untargeted skill get zero, or a floor?
 *  A serve session still involves moving, so a small spill is the truer fiction – and the spec's own
 *  answer is that BALANCE DOES NOT DEPEND ON IT (§5's asymptote does the work either way), so it is a
 *  fiction choice with a number attached and the number is the owner's to pick.
 *
 *  SHIPS AT 0, which is what §5's worked table states out loud ("groundstrokes, stamina and composure
 *  take none"). A bench that wants the other reading moves this one constant: the spill is defined as
 *  the share of a session's aim that spreads evenly over all five skills, so 0.1 gives every skill a
 *  tenth of every session and the identity above survives untouched – a kind that already aims at
 *  everything has nothing to spill, so `general` stays exactly 1.0 at any value. */
export const SESSION_SPILL: number = 0

/** WHERE THE WEEK POINTS, as a multiplier per skill. Sums to `SKILL_KEYS.length`; all ones for a week
 *  of ordinary practice. ZERO draws – pure arithmetic over a matrix of strings. */
export function aimWeights(week: readonly (readonly SessionKind[])[]): Record<SkillKey, number> {
  const out = {} as Record<SkillKey, number>
  const sessions = planSessions(week)
  // A week with no sessions in it has nothing to aim: the all-ones vector is what every pre-v47 career
  // ran, and it keeps `growWeek` byte-identical on a week the plan buys nothing in.
  if (sessions === 0) {
    for (const k of SKILL_KEYS) out[k] = 1
    return out
  }
  const counts = sessionCounts(week)
  const aim = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) aim[k] = 0
  for (const kind of SESSION_KINDS) {
    const n = counts[kind]
    if (n === 0) continue
    const targets = SESSION_AIM[kind]
    if (targets.length === SKILL_KEYS.length) {
      // It already aims at everything, so there is nothing for the spill to spread – and taking this
      // arm keeps `general` on the exact integer path whatever SESSION_SPILL is set to.
      for (const k of SKILL_KEYS) aim[k] += (n * AIM_UNIT) / targets.length
      continue
    }
    for (const k of targets) aim[k] += (n * AIM_UNIT * (1 - SESSION_SPILL)) / targets.length
    if (SESSION_SPILL > 0) {
      for (const k of SKILL_KEYS) aim[k] += (n * AIM_UNIT * SESSION_SPILL) / SKILL_KEYS.length
    }
  }
  for (const k of SKILL_KEYS) out[k] = (SKILL_KEYS.length * aim[k]) / (AIM_UNIT * sessions)
  return out
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
  /** ⭐⭐⭐ SOMEBODY ELSE IS COACHING HER THIS WEEK, and the family is not paying for it – the college
   *  programme (round 21, `docs/specs/the-college-answers-2026-08.md` §10). Replaces the
   *  `coachFactor(...)` term outright for the weeks it is supplied.
   *
   *  ⚠⚠ IT IS AN OVERRIDE AND NOT AN ADDITION, deliberately. She trains with the programme INSTEAD of
   *  with whoever the family hired, not as well as – and until round 21 the college weeks read
   *  `coach: null`, i.e. `self` = 0.82, the parent-on-the-court rate, for a girl at a university with
   *  a squad and a training week. That was the defect the owner's «она училась и работала» names.
   *
   *  ⚠ WHY NOT A `Coach` OBJECT. `tierOf`, the market, the portraits and the retainer all key off a
   *  real coach, and a synthetic one would leak into every one of them. A programme is not hireable
   *  and has no portrait; what it has is a RATE, so a rate is what it hands in.
   *
   *  ⚠ AND WHY NOT `coachWorksThisWeek`. That predicate's own comment says one clause moves the BILL
   *  and the RATE together – right for a hire, wrong here, because the scholarship's whole economic
   *  point is that the family stops paying. This argument moves the rate and nothing else; no billing
   *  code reads it.
   *
   *  ⚠ UNDEFINED EVERYWHERE ELSE, so every existing call site is byte-identical and no shipped
   *  career's growth moves. ZERO RNG IMPLICATIONS: a multiplier, drawn from nothing. */
  coachFactorOverride?: number
}): KidSkills {
  const d = ECONOMY.development
  const { skills, potential, ageYears, plan, coach, playStyle, matchesThisWeek } = args
  const decline = declineFactor(ageYears)
  const rate =
    ageFactor(ageYears) *
    trainFactor(plan) *
    (args.loadFactor ?? 1) *
    (args.coachFactorOverride ?? coachFactor(tierOf(coach), coachFitFor(coach, playStyle))) *
    (1 + Math.min(matchesThisWeek, d.matchBonusCap) * d.matchBonus)

  // One draw for the whole week, shared across the attributes: a good week is a good week, and four
  // independent rolls would average into a smooth line that never feels like anything.
  //
  // ⚠ AND THE TICKS MAY NEVER MOVE IT (v47, spec §11 item 2). The luck value is drawn BEFORE the
  // per-skill loop, in the same position, off the same key, so a career's week 30 draws the same
  // number under every week the player can possibly build. What the ticks change is what is DONE with
  // it – `aim[k]` below is a post-draw multiply and nothing else. That is CLAUDE.md invariant 2 read
  // literally: the plan is player input, and player input may not re-roll the world's dice.
  const rng = rngFromSeed(`${args.seed}:growth:${args.week}`)
  const luck = d.weekLuck[0] + rng() * (d.weekLuck[1] - d.weekLuck[0])

  // WHERE THE WEEK POINTED. All ones for an ordinary practice week – which is every week of every
  // career shipped before v47 – so this multiply is exactly 1.0 on a migrated save and its skills come
  // out byte-identical. See `aimWeights`.
  const aim = aimWeights(planWeek(plan))

  const out = {} as KidSkills
  for (const k of SKILL_KEYS) {
    const headroom = Math.max(0, potential[k] - skills[k])
    const gain = rate * headroom * luck * aim[k]
    // Composure keeps rising past the peak – experience is the one thing that does not fade.
    // ⚠ THE PREDICATE, NOT A REPEAT OF IT (v62). These two lines used to spell `k !== 'composure'`
    // and `k === 'composure'` inline, which was fine while this was the only thing that cared. The
    // stored peak physical reads the same question now (`physicalMean`, and through it
    // `WorldState.peakPhysical`), so the answer is `isPhysicalSkill` in both places and the two
    // cannot drift apart. Byte-identical behaviour: `isPhysicalSkill` IS `k !== 'composure'`.
    const loss = decline > 0 && isPhysicalSkill(k) ? decline * skills[k] : 0
    const veteranPoise = decline > 0 && !isPhysicalSkill(k) ? d.veteranPoise : 0
    out[k] = Math.max(d.floor, skills[k] + gain - loss + veteranPoise)
  }
  return out
}
