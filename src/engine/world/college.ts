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
import { coachFactor } from '../coach'
import { SKILL_KEYS, type KidSkills } from '../development'
import { ENDINGS } from '../ending'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { parentIncomeForWeekCents } from '../economy'
import { NATIONAL_TEAM, callUpLine, rollCallUp } from '../nationalTeam'
import {
  COLLEGE_TIERS,
  JUNIOR_RUNGS,
  chosenQuoteOf,
  collegeOfferFor,
  type CollegeRecruitView,
  type JuniorRung,
} from '../collegeOffer'
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
  let juniorTitles = 0
  for (const rung of JUNIOR_RUNGS) {
    const best = world.bestFinishByTier[rung]
    if (best !== undefined) juniorBests[rung] = best
    // ⚠ JUNIOR RUNGS ONLY, and the loop is why: it walks `JUNIOR_RUNGS` and has no name for a
    // professional one, so a title at W75 cannot reach this number by accident.
    juniorTitles += world.trophiesByTier[rung]?.titles.length ?? 0
  }
  return {
    juniorBests,
    juniorTitles,
    background: world.profile.background,
    country: world.profile.country,
    // ⭐⭐ ROUND 21 – THE FAMILY'S REAL POSITION, READ AT THE WEEK SHE ENROLS. The owner, 17.08:
    // «с учетом доходов семьи на момент поступления и прочего».
    //
    // ⚠ BOTH ARE MEASURED AT `world.week`, WHICH IS THE FORK, and that is the whole point of the
    // sentence: the offer is priced against what this family actually has when the question is
    // asked, not against a label chosen at onboarding five seasons earlier. `parentIncomeForWeekCents`
    // has compounded through every season boundary since; `fundsCents` has lived a whole junior
    // career. Neither is knowable from `profile.background` alone.
    //
    // ⚠ ZERO DRAWS ON ANY STREAM. `parentIncomeForWeekCents` derives its own `seed:income:<season>`
    // sub-stream at the call site and persists nothing, and `fundsCents` is a read. The frozen MAIN
    // capture cannot see this (CLAUDE.md invariant 2).
    familyIncomeCents: parentIncomeForWeekCents(world.seed, world.profile.background, world.week) * WEEKS_PER_YEAR,
    familyAssetsCents: world.fundsCents,
  }
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
  // ⭐ THE PLACE SHE PICKED, AND ONLY THAT ONE (17.08). The offer carries a quote for every tier so
  // the card can show a choice; the ledger charges the one she took. `chosenQuoteOf` is the single
  // reader, shared with the screens, so the number printed and the number charged cannot disagree.
  const quote = chosenQuoteOf(world.fork?.offer)
  if (!quote || quote.familyPerYearCents <= 0) return
  const weekly = Math.round(quote.familyPerYearCents / WEEKS_PER_YEAR)
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
    // ⭐⭐ ROUND 21 – THE YEAR'S BILL, OFF THE OFFER SHE AGREED TO AT NINETEEN.
    //
    // ⚠ IT READS `world.fork.offer` RATHER THAN RE-DERIVING THE PRICE, and that is `ForkState.offer`'s
    // own argument kept: the offer is persisted precisely so a later re-tune cannot silently re-price
    // a career halfway through a bill it had already accepted. The number the card prints is the
    // number the tick is charging.
    //
    // ⚠ AND A MIGRATED CAREER READS 0, WHICH IS TRUE FOR IT. A v50 career that entered college before
    // the bill existed carries a null offer, `resolveCollegeBill` returns at its second line, and this
    // says so rather than inventing a price it was never quoted.
    billPerYearCents: chosenQuoteOf(world.fork?.offer)?.familyPerYearCents ?? 0,
    tier: chosenQuoteOf(world.fork?.offer)?.tier ?? null,
  }
}

// =================================================================================================
// ⭐⭐ WHAT THE SQUAD IS FOR – the dual-match season, and the ONE thing a dearer place actually does
// to her tennis (17.08, docs/specs/the-college-choice-2026-08.md §2)
// =================================================================================================
//
// The owner approved two dimensions beyond price – TEAM STRENGTH and THE CHANCE OF RETURNING TO THE
// TOUR – and this phase proposed a third, HOW MUCH HER GAME DEVELOPS IN THE FOUR YEARS. They collapse
// into one mechanism on purpose, and the collapsing is a claim rather than a shortcut:
//
//   * TEAM STRENGTH is what a college programme HAS. On its own it is a number on a card.
//   * WHAT IT DOES is put her on court against it. A stronger squad plays a longer, harder dual-match
//     season, and `growWeek`'s `matchesThisWeek` term is the engine's own already-tuned price of
//     competition (`ECONOMY.development.matchBonus`, 0.18 a match, capped at 3).
//   * THE RETURN TO THE TOUR IS NOT A SECOND KNOB AND MUST NOT BECOME ONE. A per-tier probability
//     that she "makes it back" would be a die that overrides the career the player actually had, and
//     this repo does not grant outcomes – it measures them. What she comes back with is her game and
//     her family's balance, and BOTH already move with the tier. §3 of the spec measures the return
//     per tier instead of assigning it.
//
// ⚠ TWO INVENTED NUMBERS AND THEY SAY SO: the season's length and position (ours), and how many
// matches a week each tier plays (ours – `COLLEGE_TIERS[*].matchesPerWeek`). The NCAA dual-match
// season is real; these numbers are not it.
//
// ⚠ ZERO DRAWS, ZERO EVENTS. It returns a count, at the one call site that feeds `growWeek`. It does
// NOT write to `world.events` or `world.results`: a college match awards no ranking points and no
// money, so a result row for it would break the `prizeCentsFor` invariant ("a result cannot award one
// without the other") to no purpose. The frozen MAIN capture cannot see arithmetic.

/** ⭐⭐ THE TWO TRIPS – and they REPLACE a thirteen-week dual-match season (round 21 #5, 17.08,
 *  docs/specs/the-college-answers-2026-08.md §5).
 *
 *  ⚠⚠ THE OWNER'S OBJECTION WAS LORE AND IT IS DECISIVE. College was designed as the SHORTCUT –
 *  «1-2 национальных выезда в год и перелистывание 1 года за клик» – and «родители не будут посещать
 *  все игры в колледже». A thirteen-week season at one to three matches a week is a PLAYABLE SEASON:
 *  thirty-nine simulated matches a year that the parent, who is the player of this game, is not at and
 *  cannot act on. The shortcut is the feature; a second season inside it is the thing the fork exists
 *  to skip.
 *
 *  ⚠ SO IT IS TWO WEEKS A YEAR, HIS OWN NUMBER, and the tier still differs on them
 *  (`matchesPerWeek` 1 / 2 / 3). What the shrink costs is measured rather than assumed – §5 of the
 *  spec – and it is one constant to put back if he wants the season instead.
 *
 *  ⚠ NEITHER IS THE NATIONAL-TEAM WEEK (`NATIONAL_TEAM.seasonWeek` = 14). The thirteen-week block
 *  deliberately CONTAINED it, on the argument that she is playing tennis that week either way; with
 *  two trips the argument reverses – three separate weeks of tennis in a year read as three beats,
 *  and a trip landing on the call-up week would silently be one. */
export const COLLEGE_TRIP_WEEKS = [8, 20] as const

/** How many matches the programme plays her in THIS week – 0 outside college and outside a trip week.
 *  ⚠ THE DEAR TIER SATURATES THE ENGINE'S OWN CAP (`matchBonusCap` = 3) and that is deliberate: the
 *  ceiling on what competition is worth was tuned long before college had a price, and this phase is
 *  not entitled to raise it to make its own dimension look bigger. */
export function collegeMatchesThisWeek(world: WorldState): number {
  if (!inCollege(world)) return 0
  const tier = chosenQuoteOf(world.fork?.offer)?.tier
  if (!tier) return 0
  const seasonWeek = world.week % WEEKS_PER_YEAR
  if (!(COLLEGE_TRIP_WEEKS as readonly number[]).includes(seasonWeek)) return 0
  return COLLEGE_TIERS[tier].matchesPerWeek
}

/** ⭐⭐⭐ WHO COACHES HER FOR FOUR YEARS – the owner's ruling of 17.08, «она училась и работала»
 *  (docs/specs/the-college-answers-2026-08.md §10). `undefined` outside college, so every other week
 *  of every career is byte-identical.
 *
 *  ⚠⚠ WHAT THIS FIXES IS OLDER THAN THE SEASON IT REPLACES. `growWeek` reads
 *  `coachFactor(tierOf(coach), …)` and at college `coach` is `null`, so for 208 weeks she developed at
 *  **`self` = 0.82** – the parent-on-the-court rate, for a girl who is not with her parent and is at a
 *  university with a squad, a training week and a strength programme. The dimension the owner asked
 *  for was never really a missing feature; it was that nobody was coaching her.
 *
 *  ⚠ IT IS A SEPARATE INPUT AND NOT A CHANGE TO `coachWorksThisWeek`, AND THAT IS THE WHOLE CARE
 *  TAKEN HERE. That predicate's own comment says one clause moves the BILL and the RATE together –
 *  which is exactly right for a hired coach and exactly wrong here, because the scholarship's whole
 *  economic point is that the family stops paying (owner, W2-ENDINGS §5.1). So the rate moves and the
 *  bill does not, through an argument no billing code reads.
 *
 *  ⚠ A MIGRATED CAREER KEEPS WHAT IT HAD. A v50/v51 career at college was never quoted a place, has no
 *  chosen tier, and gets `undefined` – the same discipline `resolveCollegeBill` keeps when it declines
 *  to charge a career that was never quoted a price.
 *
 *  ⚠ ZERO DRAWS. It returns a constant off a persisted offer; the frozen MAIN capture cannot see it. */
export function collegeCoachFactor(world: WorldState): number | undefined {
  if (!inCollege(world)) return undefined
  const tier = chosenQuoteOf(world.fork?.offer)?.tier
  if (!tier) return undefined
  // ⚠ THE FIT TERM IS NEUTRAL AND THAT IS A STATEMENT, NOT A DEFAULT. `coachFitFor` asks whether ONE
  // man's game transfers to hers; a programme is several coaches, so the question does not apply and
  // inventing an answer to it would be a fourth invented number. `good` is the 1.0 rung.
  return coachFactor(COLLEGE_TIERS[tier].coachesAt, 'good')
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
      ? 'no professional ranking. Qualifying is the front door again'
      : `a ranking of #${rank}. Qualifying is the way forward again`
  const yearsLine = `${years} ${years === 1 ? 'year' : 'years'} of student tennis, lived one season at a time.`
  return `${yearsLine} ${played}. ${moneyClause(banked)} She comes back at ${age}, with ${standing}.`
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
