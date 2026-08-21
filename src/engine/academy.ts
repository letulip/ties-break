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
import type { AcademyEndReason, AcademyLetterTerms, FamilyBackground } from '../shared/protocol'
import { academyLetterId, newestAcademyLetter, raiseAcademyLetter } from './offers'
import { seasonIndexOf } from './world/ledger'
import { WEEKS_PER_YEAR } from './season/calendar'
import { kidAgeAt } from './world/age'
import { KID_ID, RESULTS_WINDOW } from './world/constants'
// ⚠ TYPE ONLY, ERASED AT COMPILE TIME – the rule `world/ledger.ts` states at its own import of this
// type. Nothing here calls back into `world.ts` at runtime, so `world.ts` can keep importing this
// module without a cycle. `./offers` does not import this file, which is what makes the runtime
// import above safe in the other direction.
import type { WorldState } from './world'

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

// --- THE ACADEMY'S POST (round 24 #1) -----------------------------------------------------------
//
// THE OWNER, 20.08: «сейчас как-то незаметно появляется один маленький попапчик сверху, который
// призывает изучить scholarship и кнопка dismiss. Я бы и рад изучить, да только далее не знаю где.»
//
// ⚠⚠ HALF OF THAT IS THE ROUND-23 FIX WORKING, AND IT STAYS. #16 found the verdict landing on
// `week % 52 === 0` – the one week a `+4` advance can never reach – and gave it a stop. The stop is
// what says WHEN. What it never had is a DESTINATION: the toast said "check her scholarship" and
// there was no scholarship to check anywhere in the game.
//
// SO THE THREE NOTICES BECOME LETTERS, AND THE FEED KEEPS ITS LINES. Two surfaces, one event, the
// shape `markSchoolEnd` already uses – because they answer different questions. The feed answers
// "what happened this week" and is pruned to 400 rows; the inbox answers "what did somebody write to
// this family", is never pruned for a non-`entry`/`tour` kind, and is the surface the player already
// goes to for the sponsor's paper. Only the ARRIVAL survives the feed prune today (`fireMilestone`
// writes it `keep: true`); the changed share and the ending are ordinary rows that a long career has
// already lost, which is exactly the half of his complaint that is a real defect.
//
// ⚠ RNG: ZERO, on every arm. This is arithmetic over state the review already decided plus one
// idempotent push onto `world.offers`. The frozen MAIN capture (41550 draws / e6b0c709) cannot see
// it, and no player choice reaches it at all.

/** THE SHARE, AS THE WHOLE PERCENT EVERY SURFACE QUOTES. One definition, so the feed line, the
 *  scholarship's own paper and anything that ever prints the number cannot disagree by a decimal.
 *
 *  ⚠ `reviewAcademy` (engine/world.ts) still holds its own copy of this expression – the wave that
 *  wires `settleAcademyLetters` into the tick should fold it into this call, and until it does
 *  `tests/round24-academy-letters.test.ts` pins the two against a walked career rather than against
 *  each other's source. */
export function travelCoverPct(level: number): number {
  return Math.round(level * ECONOMY.academy.travelCover * 100)
}

/** WHY IT STOPPED, from the same two facts the review judged it on. The one definition of the
 *  distinction the feed line already draws: "she aged out" and "she stopped playing" are different
 *  stories, and the second one is a lesson. */
export function academyEndReason(args: { ageYears: number; playedLastYear: number }): AcademyEndReason {
  if (args.ageYears > ECONOMY.academy.ageBand[1]) return 'aged-out'
  if (args.playedLastYear < ECONOMY.academy.minEventsPerYear) return 'stopped-playing'
  return 'not-this-year'
}

/** Tournaments she entered in the last 52 weeks – the review's own hard gate, recomputed here for
 *  the ending letter's reason. Same window and same predicate as `reviewAcademy`. */
function playedLastYear(world: WorldState): number {
  return world.results.filter((r) => r.playerId === KID_ID && world.week - r.week <= RESULTS_WINDOW).length
}

/** THE GRANT THAT LANDED WITH THIS REVIEW, read out of the ledger the review already wrote rather
 *  than recomputed here.
 *
 *  ⚠ THAT IS THE ROUND-23 DISCIPLINE, NOT A SHORTCUT. `academySpokeThisWeek` derives the stop from
 *  the feed row for the same reason: the review's grant is `kitGrantCents(level)` adjusted by
 *  whichever kit lines a live brand deal already covers, and a second copy of that arithmetic here
 *  would be a number that can drift away from the one the family actually banked. The income row IS
 *  that number. Absent (a brand covers all three lines, or she is outside a supported year) means
 *  the letter simply does not quote a grant. */
function grantBankedThisWeek(world: WorldState): number | undefined {
  const row = world.events.find(
    (e) => e.week === world.week && e.category === 'academy' && (e.amountCents ?? 0) > 0,
  )
  return row?.amountCents
}

/**
 * THE ACADEMY'S POST, SETTLED. Idempotent, pure state, zero draws – safe to call on any week, and
 * meant to be called on every one of them (the tick's inbox block, beside `settleTourSeasonNotice`).
 *
 * THREE ARMS, AND THEY ARE NOT SYMMETRIC – which is the whole of the "does an old career get its
 * letters" question:
 *
 *   ARRIVED    – raised on ANY week, because its week comes from DATA (`AcademySupport.sinceWeek`)
 *                and not from "now". A career that has been on a scholarship for five seasons and
 *                has never had a letter therefore gets its arrival back, at the right week and at
 *                the share it is on, the first time this runs. Nothing is invented: `sinceWeek` is
 *                the week the run began and `level` is what they cover.
 *   REVIEWED    – the review's own week only. The share it MOVED FROM is read off the previous
 *                letter, so the letters are their own history and no new persisted field is needed.
 *   ENDED       – the review's own week only, with the reason recomputed from the same two facts
 *                the review judged on.
 *
 * ⚠ THE LAST TWO REFUSE TO FIRE OFF THE BOUNDARY, AND THAT REFUSAL IS THE HONEST HALF. A share that
 * changed three seasons ago and a scholarship that ended are NOT derivable from a save: the feed
 * rows that carried them are `info` rows and `pruneEvents` has already dropped them, and
 * `world.academy` holds one level and no history. Stamping either at today's week would be a letter
 * about a week nothing happened in – a fabrication that reads exactly like a record. So an old
 * career gets what its save can prove and nothing else.
 */
export function settleAcademyLetters(world: WorldState): void {
  const now = world.academy
  const previous = newestAcademyLetter(world.offers)
  const prevTerms = previous ? (previous.terms as AcademyLetterTerms) : null
  // An ended run is a zero: the next thing the academy says after it is an arrival, not a rise.
  const prevPct = prevTerms && prevTerms.notice !== 'ended' ? prevTerms.sharePct : 0
  // The review speaks at the season boundary and nowhere else – `reviewAcademy`'s own clock.
  const onReviewWeek = world.week % WEEKS_PER_YEAR === 0

  if (now) {
    const pct = travelCoverPct(now.level)
    // THE ARRIVAL IS KEYED ON THE SEASON THE RUN BEGAN IN, not on the season of the last review, so
    // a back-fill lands on the week it actually happened and a fresh arrival (where the two are the
    // same season) writes the identical letter.
    const arrivalSeason = seasonIndexOf(now.sinceWeek)
    if (prevPct <= 0 && !world.offers.some((o) => o.id === academyLetterId(arrivalSeason))) {
      raiseAcademyLetter(world.offers, now.sinceWeek, {
        notice: 'arrived',
        sharePct: pct,
        sinceWeek: now.sinceWeek,
        seasonIndex: arrivalSeason,
        ...(onReviewWeek ? { grantCents: grantBankedThisWeek(world) } : {}),
      })
      return
    }
    if (!onReviewWeek || pct === prevPct) return
    raiseAcademyLetter(world.offers, world.week, {
      notice: 'reviewed',
      sharePct: pct,
      wasPct: prevPct,
      sinceWeek: now.sinceWeek,
      seasonIndex: now.seasonIndex,
      grantCents: grantBankedThisWeek(world),
    })
    return
  }

  // ...and nobody is backing her. Only a run that this inbox has a letter for can END here: a career
  // that never had a scholarship has nothing to say, and one whose paper predates the feature is not
  // told about an ending it cannot date.
  if (!onReviewWeek || !prevTerms || prevPct <= 0) return
  raiseAcademyLetter(world.offers, world.week, {
    notice: 'ended',
    sharePct: 0,
    reason: academyEndReason({ ageYears: kidAgeAt(world, world.week), playedLastYear: playedLastYear(world) }),
    sinceWeek: prevTerms.sinceWeek,
    seasonIndex: seasonIndexOf(world.week),
  })
}
