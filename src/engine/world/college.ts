// ⭐⭐ WHAT IS BEHIND THE DOOR – the college years, wired into the world (P5, 16.08.2026,
// docs/specs/college-as-a-second-act-2026-08.md).
//
// BEFORE THIS FILE the college answer latched an ending, drew one button reading "Four years later
// –", and spent 208 weeks in a single call. Nothing happened in them, nothing could be decided in
// them, and the epilogue then asserted "no ranking at all" – a sentence nobody had measured.
//
// TWO THINGS CHANGE, AND THE SECOND IS THE FEATURE:
//   1. THE FREEZE IS SPENT ONE YEAR AT A TIME. Reality's own case is one year, not four – Diana
//      Shnaider left after about a season and is inside the WTA top 15 – so a four-year block is the
//      wrong SHAPE as well as an empty one. Each year ends with a question, and three of the four
//      are real questions.
//   2. ONE WEEK OF EACH YEAR IS NOT HERS. The national-team call-up (`engine/nationalTeam.ts`) is
//      the only tennis in this game that pays neither money nor ranking points, which is exactly why
//      it is the tennis an amateur may play – and it is why the roadmap's #102 and #108 are one
//      mechanic. It fires ONLY inside the freeze, and §3 of the spec is why.
//
// ⚠ RNG: ONE SUB-STREAM, `seed:callup:<week>`, derived at the call site and persisting nothing
// (CLAUDE.md invariant 2). Everything else here is pure state – a counter, two measurements and an
// append. The frozen MAIN capture cannot see any of it.
import { rngFromSeed } from '../rng'
import { SKILL_KEYS, type KidSkills } from '../development'
import { ENDINGS } from '../ending'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { NATIONAL_TEAM, callUpLine, rollCallUp } from '../nationalTeam'
import { JUNIOR_RUNGS, collegeOfferFor, type CollegeRecruitView, type JuniorRung } from '../collegeOffer'
import type { CollegeOffer, CollegeProgressView } from '../../shared/protocol'
import { addEvent } from './ledger'
import { kidAgeYears } from './age'
import { kidLadderRank } from './snapshot'
import type { WorldState } from '../world'

/** ⭐⭐ WHAT A COLLEGE PROGRAMME IS SHOWN WHEN IT LOOKS HER UP – the world side of P4's decoupled-leaf
 *  pattern, and here the decoupling is the fairness property rather than a tidiness one.
 *
 *  ⚠⚠ THREE FIELDS, AND NONE OF THEM IS A PROFESSIONAL RESULT. `CollegeRecruitView` has no rank, no
 *  W-rung finish and no prize money, so there is nothing a tour result can move. The rule the owner
 *  deleted on 16.08 – a result taking the college answer away – cannot be re-created here from the
 *  other side either ("she is too good for college now"), because the fact it would need is not on
 *  the view. That is stronger than a rule that merely does not fire.
 *
 *  ⚠ AND IT IS A CAREER RECORD, NOT A RANK. `bestFinishByTier` is a high-water mark that never goes
 *  backwards, and the junior rungs close at eighteen, so the offer measured on her nineteenth birthday
 *  is the offer any later week would compute. That is what makes the v51 migration exact in principle
 *  and the persisted copy a safety belt rather than a necessity – see `ForkState.offer`. */
export function collegeRecruitViewOf(world: WorldState): CollegeRecruitView {
  const juniorBests: Partial<Record<JuniorRung, number>> = {}
  for (const rung of JUNIOR_RUNGS) {
    const best = world.bestFinishByTier[rung]
    if (best !== undefined) juniorBests[rung] = best
  }
  return { juniorBests, background: world.profile.background, country: world.profile.country }
}

/** THE OFFER, MEASURED ONCE. ⚠ ONE SUB-STREAM, `seed:collegeoffer:<week>`, derived at the call site
 *  and persisting nothing (CLAUDE.md invariant 2). The MAIN stream is not touched, so the frozen
 *  capture (41550 / e6b0c709) is untouched by construction. */
export function measureCollegeOffer(world: WorldState): CollegeOffer {
  return collegeOfferFor(collegeRecruitViewOf(world), rngFromSeed(`${world.seed}:collegeoffer:${world.week}`))
}

/** ⭐⭐ THE WEEKLY BILL – the first cost in this game that is not tennis.
 *
 *  ⚠ WHY A WEEKLY DEBIT AND NOT A LUMP AT ENROLMENT. The family's balance is read every week by the
 *  debt spell and by bankruptcy, and a $30,990 hole punched once a year would have made the college
 *  branch a series of four cliffs rather than a cost of living. `financeWeeks` keeps a 60-week window
 *  and the Money screen draws twelve, so a weekly line is also the only shape either of them can show.
 *
 *  ⚠ ZERO DRAWS ON ANY STREAM. It is arithmetic on a persisted offer, so no ordering hazard and no
 *  re-pin of the frozen capture.
 *
 *  ⚠ AND A NULL OFFER IS CHARGED NOTHING, which is the v51 migration's promise kept: a career that
 *  entered college before this phase existed was never quoted a price and is not billed one now. */
export function resolveCollegeBill(world: WorldState): void {
  if (!inCollege(world)) return
  const offer = world.fork?.offer
  if (!offer || offer.familyPerYearCents <= 0) return
  const weekly = Math.round(offer.familyPerYearCents / WEEKS_PER_YEAR)
  if (weekly <= 0) return
  world.fundsCents -= weekly
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'tuition',
    text: "The family's share of the college year",
    amountCents: -weekly,
  })
}

/** IS SHE AT COLLEGE THIS WEEK? Derived from the span, never a second flag – so it can never drift
 *  out of step with `world.week` and a save taken mid-freeze answers the same question on reload.
 *
 *  ⚠ IT MOVED HERE FROM `endings.ts` (P5) FOR A DEPENDENCY REASON AND NOT A TIDINESS ONE. This file
 *  needs it (the call-up fires only inside the freeze) and `endings.ts` needs this file (the ending
 *  view carries the college progress), so leaving it there would have made a runtime cycle between
 *  two modules that both run at import time. The edge now points one way: endings -> college. Every
 *  historical import still resolves – `world.ts` re-exports it under the same name. */
export function inCollege(world: WorldState): boolean {
  return world.college !== null && world.week < world.college.untilWeek
}

/** Her build as one number, 0-100. The same fold `academy.ts`'s `ceilingOf` runs over the potentials
 *  – one function per question, and this one asks about what she IS rather than what she could be. */
export function skillMeanOf(skills: KidSkills): number {
  let sum = 0
  for (const k of SKILL_KEYS) sum += skills[k]
  return sum / SKILL_KEYS.length
}

/** IS THIS THE WEEK HER COUNTRY PLAYS? A season-week comparison and nothing else.
 *
 *  ⚠ IT IS GUARDED ON `inCollege` AND THAT IS A SCOPE DECISION, NOT AN OVERSIGHT. The competition's
 *  real minimum age is fourteen (`NATIONAL_TEAM.minAgeYears`), so a girl on the tour is eligible for
 *  it every year of her career – but a call-up week ON THE TOUR displaces a week she would have
 *  played for points and money, and that is a BALANCE change which P6's re-measure owns. Inside the
 *  freeze it displaces a week that is empty by construction, so it costs nothing measurable and this
 *  phase can ship it as content. The spec's §6 states the cut and what it would take to lift it. */
export function callUpWeek(world: WorldState): boolean {
  return inCollege(world) && world.week % WEEKS_PER_YEAR === NATIONAL_TEAM.seasonWeek
}

/** THE COLLEGE MIRROR OF `rollKnock`, and it sits exactly where that does in the tick.
 *
 *  On an ordinary week the thing that happens TO her is a sore shoulder. In these four years it is a
 *  letter – and it is the only thing in them that arrives from outside. She does not enter it, she
 *  is not asked, and she may not decline: research §0.7 (the National Association nominates) and
 *  §0.8 (availability is a Good Standing criterion her own federation judges unappealably).
 *
 *  ⚠ IT WRITES A NEWS ROW AND NOTHING ELSE. No ranking points and no money, because the sport awards
 *  neither – so `world.results` is untouched, no rank is recomputed, and the `prizeCentsFor`
 *  invariant ("a result cannot award one without the other") is not being bent: there is no result.
 *  The row is `keep: true` so the album's own record still has it four years later, when
 *  `pruneResults` has deleted everything else about these weeks. */
export function resolveCallUp(world: WorldState): void {
  if (!callUpWeek(world)) return
  const call = rollCallUp(
    {
      ageYears: kidAgeYears(world.week, world.profile.birthMonth),
      skillMean: skillMeanOf(world.skills),
    },
    rngFromSeed(`${world.seed}:callup:${world.week}`),
  )
  if (!call) return
  world.college!.pendingCallUp = { week: world.week, ...call }
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: callUpLine(call),
  })
}

/** THE YEAR, BANKED. Called once per college year, on the week it ends.
 *
 *  ⚠ THE TWO ENDS ARE MEASURED RATHER THAN DERIVED LATER, and that is invariant 3's own argument in
 *  miniature: `pruneResults` deletes a result 52 weeks after it happened, so by the time the fourth
 *  year's card is drawn there is no way to recover what her rank was at the start of the first. A
 *  measurement taken at the moment is a new fact and it has to be persisted. */
export function bankCollegeYear(world: WorldState, start: CollegeYearStart): void {
  const college = world.college
  if (!college) return
  college.years.push({
    index: college.years.length + 1,
    fromWeek: start.week,
    untilWeek: world.week,
    startSkill: start.skill,
    endSkill: skillMeanOf(world.skills),
    startRank: start.rank,
    endRank: kidLadderRank(world, 'wta'),
    fundsDeltaCents: world.fundsCents - start.fundsCents,
    callUp: college.pendingCallUp,
  })
  college.pendingCallUp = null
}

/** The measurements a year has to be opened with, taken before the first of its weeks ticks. */
export interface CollegeYearStart {
  week: number
  skill: number
  rank: number | null
  fundsCents: number
}

export function openCollegeYear(world: WorldState): CollegeYearStart {
  return {
    week: world.week,
    skill: skillMeanOf(world.skills),
    rank: kidLadderRank(world, 'wta'),
    fundsCents: world.fundsCents,
  }
}

/** ⭐ THE EARLY RETURN – the sport's own case, and the reason the freeze stopped being one call.
 *
 *  ⚠ IT MOVES `untilWeek` BACK RATHER THAN SETTING A SECOND FLAG. `inCollege` is derived from the
 *  span and its own comment says why – "so it can never drift out of step with `world.week`". A
 *  `leftEarly: true` beside an `untilWeek` still four years out would be exactly that drift, and
 *  every one of the six `inCollege` guards in the tick would have had to learn about it. */
export function leaveCollege(world: WorldState): void {
  const college = world.college
  if (!college || college.doneWeek !== null) throw new Error('She is not at college')
  college.untilWeek = world.week
  college.doneWeek = world.week
}

/** WHAT THE EPILOGUE SCREEN IS ALLOWED TO KNOW – and `null` the moment she is out, because this view
 *  is the state of an OPEN question. */
export function collegeProgressOf(world: WorldState): CollegeProgressView | null {
  const college = world.college
  if (!college || college.doneWeek !== null) return null
  return {
    yearsDone: college.years.length,
    totalYears: ENDINGS.collegeYears,
    last: college.years[college.years.length - 1] ?? null,
    // ⚠ IT MEANS "THE NEXT YEAR IS THE LAST ONE", not "she is done" – a career that is done has no
    // ending latched at all, so the done state is never rendered and a flag for it would be dead.
    // What the screen needs is the difference between a question with years behind it and the last
    // question there will be, which is exactly `RetirementOffer.final`'s job one door along.
    final: college.years.length + 1 >= ENDINGS.collegeYears,
  }
}

/** ⭐⭐ WHAT SHE COMES BACK WITH, AND IT IS MEASURED RATHER THAN ASSERTED.
 *
 *  ⚠⚠ THE LINE THIS REPLACES WAS WRONG IN TWO WAYS AND ONE OF THEM WAS A NUMBER. It read: *"Four
 *  years, a degree and no ranking at all. She is 23, and the only way back in is qualifying."*
 *    (a) "Four years" was unconditional, so an early return would have printed it after one;
 *    (b) "no ranking at all" was never measured. It is now, and the measurement is in the spec's §4:
 *        her professional rank is IDENTICAL at both ends of the freeze in the median career,
 *        because she was already off the list when she walked in. The four years did not cost her a
 *        ranking – the ranking was the reason the door looked open.
 *
 *  ⚠ AND IT STATES THE MONEY, because that is the one thing the years demonstrably did. The
 *  scholarship is the only stretch of this game where the balance goes the other way, and the
 *  measured median over four years is larger than any family's starting capital. The line says the
 *  number; it does not say whether that was worth it. (`career-contract-v1.md` §6: the game does not
 *  grade her.) */
export function collegeEpilogueLine(world: WorldState): string {
  const college = world.college
  if (!college) return ''
  const years = college.years.length
  const banked = college.years.reduce((sum, y) => sum + y.fundsDeltaCents, 0)
  const calls = college.years.filter((y) => y.callUp !== null).length
  const rank = kidLadderRank(world, 'wta')
  const age = kidAgeYears(world.week, world.profile.birthMonth)
  const played =
    calls === 0
      ? 'Her country never called'
      : `Her country called ${calls === 1 ? 'once' : `${calls} times`}, and paid her nothing, which is what it pays everybody`
  const standing =
    rank === null
      ? 'She is on no professional list at all, and the only way back in is qualifying'
      : `She is #${rank}, and the only way up is qualifying`
  return `${years} ${years === 1 ? 'year' : 'years'} of student tennis. ${played}. ${moneyClause(banked)} She is ${age}. ${standing}.`
}

/** ⚠ THE SIGN IS A DIFFERENT SENTENCE, NOT A DIFFERENT NUMBER IN THE SAME ONE. The scholarship
 *  normally leaves the family better off – that is its whole economic point – but a career carrying
 *  debt into it can come out further under water, and "$4,000 worse better off" is what a formatter
 *  that only flipped the figure would have printed. */
function moneyClause(cents: number): string {
  const dollars = Math.round(cents / 100)
  const money = `$${Math.abs(dollars).toLocaleString('en-US')}`
  if (dollars < 0) return `The family is ${money} further under than the week she went in.`
  return `The family is ${money} better off than the week she went in.`
}
