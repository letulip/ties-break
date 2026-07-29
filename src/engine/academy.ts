// THE ACADEMY SCHOLARSHIP – somebody else starts paying for the plane tickets.
//
// WHY IT EXISTS. Phase 4 gave her a development curve, and the bench immediately showed what that
// costs a family: over 14→18, careers that reached the international ladder went BROKE reaching it.
// The 8k working family survived 18 of 120 careers. The mechanism is not subtle – a J30 trip is
// $900-2000 before the wealth factor against a $60-120 local, so the moment she is good enough to
// travel she is too expensive to keep. Development promotes her into a bill her parents cannot pay.
//
// THE OWNER'S ANSWER, in his words (28.07): "у нас на пути помощь академий для талантливых и
// играющих с частичной компенсацией поездок и экипа (шараповой же давали в юниорстве)". Partial
// compensation of travel and kit for the talented ones who actually compete. It is also simply what
// happens in real junior tennis: the academies fund the prospects they want, and a family with no
// money and a real prospect is exactly who gets funded.
//
// WHAT THE ACADEMY LOOKS AT, and what it deliberately does not:
//
//   RESULTS – her ranking as she comes out of a season. The visible, earned half. It is what makes
//     the scholarship something the player plays FOR rather than something that happens to them.
//   THE SCOUT'S EYE – her ceiling. Academies fund potential, not just standings, and a 15-year-old
//     with nothing on paper can still be obviously worth backing. This half is the one place in the
//     game where her hidden potential leaks into the world, which is a FEATURE (decisions.md #11:
//     the radar has axes without numbers and its contour sharpens as confidence grows) – an offer,
//     or the size of one, is the first honest read on her ceiling the player ever gets.
//   NEED – the family background, and nothing else. The owner's rule is a subsidy for the poor and
//     talented, "не проигрывающего, а малоимущего, но талантливого". CURRENT BALANCE IS NOT AN
//     INPUT, on purpose: a scholarship that keys off the bank balance pays the player to run
//     themselves broke, and would turn a support mechanic into an exploit.
//   THAT SHE PLAYS – a hard gate on tournaments entered in the last 52 weeks. Nobody funds a
//     prospect who does not compete.
//
// SIZE, NOT A SWITCH. The owner asked for exactly this ("регулировать размер помощи - вот это мне
// кажется лучше"): the level is continuous in 0..1 and everything above scales it, so the middle of
// the distribution gets a middling scholarship instead of a cliff at some threshold.
//
// REVIEWED ONCE A YEAR, at the season boundary. Not weekly: a weekly test on a rank that wobbles
// would flicker the scholarship on and off in the ledger, and an annual review is what a real
// academy does anyway. It gives the player something to aim a season at, and the verdict is a beat.
//
// RNG DISCIPLINE. Nothing here draws from anything. The level is arithmetic on state that already
// exists and the kit grant scales off the level, so the review adds ZERO draws to any stream and
// cannot move the frozen MAIN capture (41550 draws / e6b0c709) by a single one.

import { ECONOMY } from './economy'
import type { KidSkills } from './development'
import { SKILL_KEYS } from './development'
import type { FamilyBackground } from '../shared/protocol'

/** Her scholarship, or the absence of one. Persisted (schema v21) because a scholarship is a
 *  relationship, not a derived value: it must not re-decide itself between the annual reviews, and
 *  the season's covered total has nowhere else to live. */
export interface AcademySupport {
  /** 0..1 – how much of the academy's maximum backing she has earned. */
  level: number
  /** the week the CURRENT unbroken run of support began, so "with them since 2033" is answerable
   *  and a renewal does not read as a new offer. */
  sinceWeek: number
  /** the season index of the review that set this level – the review is idempotent per season. */
  seasonIndex: number
  /** travel the academy has paid for since that review, in cents. Reset at each review, reported
   *  in the season wrap-up: the one number that says what the scholarship was actually worth. */
  coveredCents: number
}

/** The scout's read: her ceiling, as the mean of the four attribute potentials. One number, because
 *  an academy backs a player and not a serve. */
export function ceilingOf(potential: KidSkills): number {
  let sum = 0
  for (const k of SKILL_KEYS) sum += potential[k]
  return sum / SKILL_KEYS.length
}

/** 0..1 from a dense rank in a ~200-strong junior field: 1 at `rankFull` or better, 0 at
 *  `rankNone` or worse, linear between. */
export function resultScore(rank: number): number {
  const { rankFull, rankNone } = ECONOMY.academy
  if (rank <= rankFull) return 1
  if (rank >= rankNone) return 0
  return (rankNone - rank) / (rankNone - rankFull)
}

/** 0..1 from her ceiling over the band the population actually occupies. */
export function scoutScore(ceiling: number): number {
  const [lo, hi] = ECONOMY.academy.ceilingBand
  return Math.max(0, Math.min(1, (ceiling - lo) / (hi - lo)))
}

/** How much of the academy's backing this family's need unlocks. Wealthy is 0: a scholarship is
 *  need-based, and a family that can already pay is exactly who pays. */
export function needFactor(background: FamilyBackground): number {
  return ECONOMY.academy.needFactor[background]
}

/** THE ANNUAL VERDICT, as a pure function of what the academy can see. Returns 0 when they pass:
 *  outside the junior age band, not competing, or a level too small to be worth a letter. */
export function reviewLevel(args: {
  rank: number
  potential: KidSkills
  background: FamilyBackground
  /** tournaments she entered in the last 52 weeks (every tier – a local counts as competing). */
  playedLastYear: number
  ageYears: number
}): number {
  const a = ECONOMY.academy
  const [minAge, maxAge] = a.ageBand
  if (args.ageYears < minAge || args.ageYears > maxAge) return 0
  if (args.playedLastYear < a.minEventsPerYear) return 0

  const talent = a.scoutWeight * scoutScore(ceilingOf(args.potential)) + (1 - a.scoutWeight) * resultScore(args.rank)
  const level = talent * needFactor(args.background)
  return level < a.minLevel ? 0 : Math.min(1, level)
}

/** The share of a travel bill the academy picks up at this level. THE single definition – every
 *  charge, every refund and every price the planner quotes reads this one function, which is what
 *  makes the discount impossible to arbitrage (enter, get the discount, withdraw, be refunded the
 *  full fare). */
export function travelCoverShare(academy: AcademySupport | null): number {
  if (!academy || academy.level <= 0) return 0
  return academy.level * ECONOMY.academy.travelCover
}

/** What the family actually pays for a trip, given the scholarship. Rounded to whole cents so the
 *  charge and the refund are the same integer. */
export function netTravelCents(fullCents: number, academy: AcademySupport | null): number {
  const share = travelCoverShare(academy)
  if (share <= 0) return fullCents
  return fullCents - Math.round(fullCents * share)
}

/** The kit grant that lands at each review she is supported through: rackets, strings, shoes, the
 *  bag with the academy's name on it. Scales with the level, like everything else here. */
export function kitGrantCents(level: number): number {
  return Math.round(ECONOMY.academy.kitCentsAtFull * level)
}
