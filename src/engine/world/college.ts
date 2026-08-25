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
import { NATIONAL_TEAM, callUpLine, callUpOpponent, rollCallUp, type CallUpOpponent } from '../nationalTeam'
import {
  COLLEGE_LEAGUE,
  COLLEGE_LEAGUE_ROUNDS,
  collegeLeagueLine,
  collegeLeagueOpponent,
  type CollegeLeagueResult,
} from '../collegeLeague'
import { simulateMatch } from '../match/engine'
import { JUNIOR_TOUR } from '../season/tournament'
import { kidMatchPlayerFor } from './player'
import { KID_ID } from './constants'
import { formatShortName } from '../../shared/format'
import type { MatchPlayer } from '../match/types'
import type { WorldMatch } from '../../shared/protocol'
import {
  COLLEGE_TIERS,
  JUNIOR_RUNGS,
  chosenQuoteOf,
  collegeOfferFor,
  type CollegeRecruitView,
  type JuniorRung,
} from '../collegeOffer'
import type { CollegeLeagueRun, CollegeOffer, CollegeProgressView, CollegeState, CollegeYearStart } from '../../shared/protocol'
import { addEvent } from './ledger'
import { kidAgeYears } from './age'
// ⚠ FROM ./ladder, NOT ./snapshot (TB-07). This file MUTATES the world; snapshot BUILDS the
// aggregate projection over it, and importing upward from one to the other closed two runtime
// cycles (birthday → college → snapshot → birthday, coachMarket → endings → college → snapshot →
// coachMarket). `kidLadderRank` is a composition of ladder functions and now lives with them.
import { kidLadderRank } from './ladder'
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
  // ⚠⚠ `expense`, AND IT WAS `income` FROM v51 UNTIL R2-01 (review-principles-2026-08-23, PROD-06).
  // The SIGN was always right – `amountCents` has been negative since the line was written, and every
  // money AGGREGATE in this game folds by sign rather than by type (`accrueFinance` splits
  // earned/spent on `amountCents > 0`; `financeWindow` and `financeSeries` split income/expense on the
  // per-CATEGORY total; the Money screen's rows are keyed by category and toned by sign). That is why
  // the arithmetic never moved and the defect survived a whole round: nothing that adds up money ever
  // asked this field.
  //
  // ⚠ WHAT DID ASK IT WAS THE PROSE. `WeekRecapCard`'s handwritten scrap under the painting is
  // `weekEvents.find(e => e.type === 'expense').text`, so on every college week the one bill the
  // family actually pays was invisible to the one card whose job is to say where the week's money
  // went – it fell through to the empty string. A row that is a debit in the ledger and an 'income'
  // to the feed is two answers to one question, and this is the half that was wrong.
  addEvent(world, {
    week: world.week,
    type: 'expense',
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
      ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
      skillMean: skillMeanOf(world.skills),
      // ⭐⭐⭐ ROUND 24 – THE LETTER IS EARNED NOW. The owner, 21.08: «вызов в сборную можно будет
      // опереть на результаты студенческого». `lastLeagueRun` is the championship the selectors have
      // in front of them, and `null` – no championship on her record at all – means nobody writes.
      leagueRoundsWon: lastLeagueRun(world.college!)?.roundsWon ?? null,
    },
    rngFromSeed(`${world.seed}:callup:${world.week}`),
  )
  if (!call) return
  // ⭐⭐ AND HERE THE WEEK STOPS BEING A SUMMARY. The owner's brief, 19.08: «в каждом году минимум
  // одни соревнования, которые можно смотреть так же, как и наши текущие, т.е. тот же самый механизм
  // в точности, кроме названий турниров». The fixture above is unchanged – the letter, the ties, the
  // placing – and `rubbersWon` is now COUNTED OFF THE COURT rather than drawn.
  const asPlayed = { ...call, rubbersWon: playCallUpRubbers(world, call.rubbersPlayed) }
  world.college!.pendingCallUp = { week: world.week, ...asPlayed }
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: callUpLine(asPlayed),
  })
}

/** ⭐⭐ DID HER COUNTRY PLAY **THIS** WEEK – the predicate the year's loop asks so the week cannot
 *  pass in silence (round 23 #16's shape: `academySpokeThisWeek`, one door along).
 *
 *  ⚠⚠ IT IS A READING OF STATE AND NOT A RETURN VALUE, AND THAT IS THE WHOLE POINT. `resolveCallUp`
 *  runs six frames deep inside `tickWeek`; a boolean threaded back out would have to pass through
 *  every one of them, and the one thing round 23 #16 proved about this class of bug is that the
 *  report gets dropped somewhere in the middle. `pendingCallUp` is the week itself, held until
 *  `bankCollegeYear` folds it into the year, so asking the world is asking the fact.
 *
 *  ⚠ AND `rubbersPlayed === 0` STILL COUNTS. She was named, she travelled and she sat: that is a
 *  week the parent should be told about, and the record already says so in its own words
 *  ("She was named in the squad and never took the court"). A stop that fired only when there was a
 *  match to watch would be silent on exactly the outcome nobody expects. */
export function callUpPlayedThisWeek(world: WorldState): boolean {
  return world.college?.pendingCallUp?.week === world.week
}

/** ⭐⭐ THE RUBBERS, PLAYED – the same `simulateMatch` every other match in this game goes through,
 *  and the same record shape, so the app's own viewer replays them without knowing what they are.
 *
 *  ⚠⚠ IT IS THE PRACTICE FRIENDLY'S PATH AND NOT THE TOURNAMENT'S, and the choice is the invariant
 *  rather than convenience. A tournament run is a `PendingTournament` over a `SeasonEvent` in the
 *  calendar, and `finalizeTournament` awards points and a cheque off `TIERS[tier]` – but this
 *  competition awards NEITHER, by its own rulebook (see `engine/nationalTeam.ts`), so a run through
 *  that machinery would either invent a tier or break `finalizeTournament`'s "a result cannot award
 *  one without the other". `resolvePractice` is the shape this game already has for a match that is
 *  really played, really watchable and worth nothing: one `simulateMatch` under a stored seed, one
 *  `match` row carrying the record. `world.results` is still never touched and no rank is recomputed.
 *
 *  ⚠ `friendly: true`, AND THE FLAG'S OWN DOCSTRING IS WHY: "a watchable friendly that awards ZERO
 *  ranking points, so the UI can keep it out of the tournament card and label it honestly". That is
 *  exactly a rubber. It is also what keeps this wave surgical – the flag is the one predicate the
 *  radar (R11-2), the avatar's emotion, the knock history and the Weekly Story all read to decide
 *  whether a match is EVIDENCE about her form, and a national-team week that pays nothing and takes
 *  nothing must not silently become evidence in four subsystems at once. The word is wrong for a tie
 *  and the behaviour it selects is right; renaming a persisted, player-visible flag to fix a noun is
 *  the trade `StopReason`'s own 'walkover' note already declines to make.
 *
 *  ⚠ ZERO BODY COST, DELIBERATELY, AND IT IS A CUT RATHER THAN AN OVERSIGHT. `resolvePractice`
 *  subtracts `matchDrain` and opens a layoff on a retirement; neither happens here. The call-up week
 *  has cost her nothing measurable since it shipped – that is what made it shippable INSIDE the
 *  freeze at all (see `callUpWeek`) – and giving it a condition price is a balance change, which
 *  CLAUDE.md invariant 4 says ships with a bench run and a spec. Playing the rubbers was the ask;
 *  re-pricing the week was not.
 *
 *  ⚠ RNG: `seed:rubbers:<week>`, ITS OWN SUB-STREAM, derived at the call site and persisting
 *  nothing – NOT `seed:callup:<week>`, so the fixture's four draws are byte-identical to what they
 *  were before this shipped and the MAIN stream cannot see any of it (CLAUDE.md invariant 2). Each
 *  match then runs on its own `seed:rubber:<week>:<i>`, which is what makes the stored record
 *  replayable: `simulateMatch` is a pure function of (a, b, {surface, tour, seed}).
 *
 *  ⚠ THE WHOLE SIDE IS DRAWN, NOT JUST THE RUBBERS SHE PLAYS. `tiesInTheWeek` opponents, always, in
 *  the same order – so who her nation drew is a fact about the week rather than about how many
 *  rubbers the captain gave her. Same post-draw discipline `rollCallUp` keeps. */
function playCallUpRubbers(world: WorldState, rubbers: number): number {
  const rng = rngFromSeed(`${world.seed}:rubbers:${world.week}`)
  const surface = NATIONAL_TEAM.surface
  const opponents: CallUpOpponent[] = []
  for (let i = 0; i < NATIONAL_TEAM.tiesInTheWeek; i++) {
    opponents.push(callUpOpponent(callUpRubberId(world.week, i), rng))
  }
  // ⚠ AFTER the draws, never before them – that is what "the count cannot depend on the outcome"
  // means, and returning early above would have made the whole side depend on the captain's team
  // sheet. She was named and she sat: a real outcome, and the record says so in its own words.
  if (rubbers <= 0) return 0
  // She hits at her CURRENT condition and on the court her style earns her – the one composition
  // point every path that puts her in a match goes through, so a rubber is not a different game.
  const kid = kidMatchPlayerFor(world, surface)
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  let won = 0
  for (let i = 0; i < rubbers; i++) {
    const { player: opp, nation } = opponents[i]
    const eventId = callUpRubberId(world.week, i)
    const seed = `${world.seed}:rubber:${world.week}:${i}`
    const result = simulateMatch(kid, opp, { surface, tour: JUNIOR_TOUR, seed })
    const score = result.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    const kidWon = result.winner === 0
    if (kidWon) won += 1
    // ⚠ A RUBBER IS A MATCH AND SHE CAN STOP IN ONE – the same sentence `resolvePractice` writes,
    // and for the same reason: a short scoreline with no verb is the lie the number tells by itself.
    const retiredId = result.retired ? (result.retired.side === 0 ? KID_ID : opp.id) : undefined
    const verb = retiredId === KID_ID ? 'had to stop against' : retiredId ? 'was playing a retiring' : kidWon ? 'beat' : 'lost to'
    const match: WorldMatch = {
      round: i,
      aId: KID_ID,
      bId: opp.id,
      winnerId: kidWon ? KID_ID : opp.id,
      seed,
      score,
      ...(retiredId ? { retiredId } : {}),
      eventId,
      surface,
      oppName: opp.name,
      a: { ...kid },
      b: { ...opp },
    }
    addEvent(world, {
      week: world.week,
      type: 'match',
      friendly: true,
      // ⚠ KEPT, like the summary line one call up. `pruneResults` deletes everything else about
      // these weeks and the album is drawn four years later; a week she is still allowed to watch
      // has to still be in the feed to open. Twelve rows at the very outside, over a whole degree.
      keep: true,
      text:
        `${NATIONAL_TEAM.label}: ${kidShort} ${verb} ` +
        `${formatShortName(opp.name)} (${nation}) ${score} – no ranking points`,
      match,
    })
  }
  return won
}

/** The id a rubber is filed under. ⚠ IT NAMES NO TIER ON PURPOSE: `occasionOf` derives the
 *  commentary's occasion from the event id, and a rubber genuinely has no rung behind it – the same
 *  answer `practice-w<week>` gets, and for the same reason. */
export function callUpRubberId(week: number, index: number): string {
  return `nations-w${week}-r${index}`
}

/** ⭐ THE RUBBERS OF ONE CALL-UP WEEK, out of the feed – what the epilogue's year card offers to
 *  replay. Derived rather than persisted: the records live in `world.events` exactly like every
 *  other match in the game, so this adds no save field, no migration and no golden fixture (the
 *  same argument `CollegeProgressView.billPerYearCents` makes one door along). */
export function callUpRubbersOf(world: WorldState, week: number): WorldMatch[] {
  return world.events
    .filter((e) => e.week === week && e.match !== undefined && e.match.eventId.startsWith(`nations-w${week}-r`))
    .map((e) => e.match!)
}

// =================================================================================================
// ⭐⭐⭐ THE ONE TOURNAMENT THE YEAR IS GUARANTEED – round 24, the owner's design (21.08)
// =================================================================================================
//
// «я бы хотел, чтобы как минимум 1 турнир в год колледжа был… какой-то студенческий турнир,
// например. Тогда вызов в сборную можно будет опереть на результаты студенческого и тогда у нас
// будет минимум 1, максимум 2 турнира на учебный год»
//
// ⚠⚠ WHAT WAS MEASURED, BECAUSE THE ITEM CAME FROM A MEASUREMENT. Over 12 careers × 4 years = 48
// college years the year held three marked weeks: two squad trips that write no rows and cannot be
// watched, and one call-up that was a bare roll – it landed in 19 of 48 (40%) and she took the court
// in 17 (35%). **0.71 watchable matches per college year.** On two thirds of college years the
// calendar held one openable row and it was empty. The epilogue used to hide that behind a photo
// album; D1's Home shell shows it.
//
// ⚠ THE FLOOR IS ARITHMETIC, NOT PROBABILITY. `COLLEGE_LEAGUE.seasonWeek` is compared against
// `world.week % WEEKS_PER_YEAR`, and a college year is exactly fifty-two consecutive ticked weeks –
// so every season week occurs in it EXACTLY ONCE, for every career, at every tier, with no draw
// anywhere near the question. That is what makes "at least one tournament a year" a guarantee rather
// than a high probability.
//
// ⚠ AND THE CEILING IS THE SAME ARITHMETIC. Two season weeks carry a tournament – 12 and 14 – and
// each occurs once, so a year holds at most two and never three, which is the owner's own bound.
// `tests/college-league.test.ts` pins both ends over walked careers rather than asserting them here.

/** IS THIS THE WEEK THE STUDENT CHAMPIONSHIP IS PLAYED? A season-week comparison and nothing else –
 *  the same shape `callUpWeek` has, and guarded on `inCollege` for the same reason: this is a closed
 *  student field and a girl on the tour is not in it. */
export function collegeLeagueWeek(world: WorldState): boolean {
  return inCollege(world) && world.week % WEEKS_PER_YEAR === COLLEGE_LEAGUE.seasonWeek
}

/** ⭐⭐⭐ THE CHAMPIONSHIP, PLAYED AND FILED. The college mirror of `resolveCallUp`, two weeks up the
 *  calendar from it, and it is the week that decides whether that one happens at all.
 *
 *  ⚠ IT WRITES NO RESULT ROW AND NO CHEQUE, exactly like the call-up. `world.results` is untouched,
 *  no rank is recomputed, and the `prizeCentsFor` invariant ("a result cannot award one without the
 *  other") is not being bent – there is no result. She is an AMATEUR while she is there, which is
 *  why the sponsors, the academy and the gear shop are all shut inside the freeze (W2-ENDINGS,
 *  «nobody writes to an amateur»); a student fixture paying WTA/ITF points would make four years of
 *  college a quiet ranking route and the fork would stop being a real choice.
 *
 *  ⚠ RNG: `seed:collegeleague:<week>`, its own sub-stream, derived at the call site and persisting
 *  nothing – NOT `seed:callup:<week>`, so the call-up's four draws are byte-identical to what they
 *  were before this shipped and the MAIN capture cannot see any of it (CLAUDE.md invariant 2). */
export function resolveCollegeLeague(world: WorldState): void {
  if (!collegeLeagueWeek(world)) return
  const run: CollegeLeagueRun = { week: world.week, ...playCollegeLeague(world) }
  world.college!.pendingLeague = run
  // ⭐⭐⭐ ROUND 26 #6 – AND THE WEEK NOW STOPS TO BE WATCHED. The owner, having asked once before:
  // «в чем проблема использовать наш флоу турниров полностью и дать возможность игроку их смотреть
  // и сопереживать? Я уже просил это сделать». Round 25 played the matches and wrote the rows; the
  // parent was handed the scoreline. This is the half that was missing – the reveal, opened here on
  // the week the fixture happens, so `resumeFromCollege` pauses the year on it and the app's own
  // `TournamentFlow` walks it round by round.
  //
  // ⚠ IT IS OPENED AFTER THE ROWS ARE WRITTEN AND NOT INSTEAD OF THEM. The tour DEFERS its match
  // events to the reveal because its points, cheque and rank recompute are deferred with them
  // (`finalizeTournament`); this fixture commits nothing at all, so there is nothing to defer – and
  // making the record conditional on a flow completing is precisely how round 26 #7 («реплеев этих
  // матчей нигде нет») would come back. The rows are written by the tick, `keep: true`, exactly as
  // they were before this shipped; the reveal is a cursor over them.
  world.college!.leagueReveal = { week: world.week, revealed: 0 }
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: collegeLeagueLine(run),
  })
}

// -------------------------------------------------------------------------------------------------
// ⭐⭐⭐ ROUND 26 #6 – THE REVEAL: THE TOUR'S OWN FLOW, OVER A FIXTURE THAT AWARDS NOTHING
// -------------------------------------------------------------------------------------------------
//
// ⚠⚠ THE THREE FUNCTIONS BELOW ARE `revealTournamentRound` / `skipTournament` / `closeTournament`
// FOR THIS COMPETITION, AND THEY ARE REACHED THROUGH THOSE VERY NAMES. `world.ts` dispatches each of
// the three to its twin here when a college reveal is the one that is open, so the worker's command
// table, the store's actions and every button in `TournamentFlow.vue` are untouched: one road, two
// kinds of tournament on it. That is «использовать наш флоу турниров полностью» taken literally,
// and it is also the cheapest thing to keep correct – a second set of commands would be a second
// place for the reveal to strand.
//
// ⚠ AND `world.pendingTournament` IS NEVER WRITTEN. Every payout in this game is reached through
// `TIERS[event.tier]`, and this fixture has no rung (`collegeLeagueMatchId` names none on purpose),
// so the amateur line is held by the state's SHAPE rather than by a branch somebody has to remember:
// there is nothing here `finalizeTournament` could be pointed at.

/** IS A CHAMPIONSHIP WAITING TO BE WATCHED? The predicate `resumeFromCollege` refuses on and the
 *  snapshot builds its `pending` view from. */
export function collegeLeagueRevealOpen(world: WorldState): boolean {
  return (world.college?.leagueReveal ?? null) !== null
}

/** The matches the open reveal is walking – off the feed, exactly like every other reader of these
 *  records, so the reveal holds a cursor and never a second copy of the run. */
export function collegeLeagueRevealMatches(world: WorldState): WorldMatch[] {
  const reveal = world.college?.leagueReveal ?? null
  return reveal ? collegeLeagueMatchesOf(world, reveal.week) : []
}

/** Show one more round. ⚠ IT WRITES NO EVENT, which is the one place this differs from
 *  `revealTournamentRound` and the difference is stated at `resolveCollegeLeague`: the rows are
 *  already in the feed. Idempotent at the end of the run, exactly like its twin. */
export function revealCollegeLeagueRound(world: WorldState): void {
  const reveal = world.college?.leagueReveal ?? null
  if (!reveal) return
  const played = collegeLeagueMatchesOf(world, reveal.week).length
  if (reveal.revealed >= played) return
  reveal.revealed += 1
}

/** «Skip all rounds» – straight to the finale. */
export function skipCollegeLeagueRounds(world: WorldState): void {
  const reveal = world.college?.leagueReveal ?? null
  if (!reveal) return
  reveal.revealed = collegeLeagueMatchesOf(world, reveal.week).length
}

/** The finale's Continue: the reveal is answered and the year may go on. ⚠ A BARE CLEAR, like
 *  `closeTournament`, and callable at any point in the walk – the owner is allowed to stop watching,
 *  and nothing about the record depends on how far he got. */
export function closeCollegeLeagueReveal(world: WorldState): void {
  if (!world.college) return
  world.college.leagueReveal = null
}

/** ⭐⭐ DID THE CHAMPIONSHIP HAPPEN **THIS** WEEK – the predicate `resumeFromCollege` asks so the week
 *  cannot pass in silence. A reading of state and never a return value, for `callUpPlayedThisWeek`'s
 *  own reason: `resolveCollegeLeague` runs six frames deep inside `tickWeek` and a boolean threaded
 *  back out is a report that gets dropped somewhere in the middle (round 23 #16's finding). */
export function collegeLeaguePlayedThisWeek(world: WorldState): boolean {
  return world.college?.pendingLeague?.week === world.week
}

/** ⭐⭐⭐ THE CHAMPIONSHIP THE SELECTORS HAVE IN FRONT OF THEM – the most recent one on her record,
 *  or `null` if she has not played one yet.
 *
 *  ⚠⚠ IT LOOKS AT THE YEAR IN PROGRESS FIRST AND THE BANKED YEARS SECOND, WHICH IS THE WHOLE OF THE
 *  CAUSALITY. In the ordinary case the championship (season week 12) and the call-up (season week
 *  14) are two weeks apart in the SAME academic year, so the letter is read off the result the
 *  player has just watched.
 *
 *  ⚠ AND THE FALLBACK TO A BANKED YEAR IS NOT A CONVENIENCE EITHER. A college year is fifty-two
 *  weeks from whatever week she enrolled on, so for two enrolment weeks in fifty-two (season weeks
 *  12 and 13) the call-up comes round BEFORE that year's championship. Those years read the previous
 *  year's result – which is what a selection panel with a year-old form line would actually do – and
 *  in year one there is no previous result, so no letter comes. Both cases are stated at
 *  `NATIONAL_TEAM.callChanceNoLeague` and measured in `tests/college-league.test.ts`.
 *
 *  ⚠ ONE PERSISTED COPY AND A LOOKUP, NEVER A SECOND «last result» FIELD. Two copies of one fact is
 *  how a cache comes to disagree with its source; this cannot, because there is only one source. */
export function lastLeagueRun(college: CollegeState): CollegeLeagueRun | null {
  if (college.pendingLeague) return college.pendingLeague
  for (let i = college.years.length - 1; i >= 0; i--) {
    const run = college.years[i].league
    if (run) return run
  }
  return null
}

/** ⭐⭐ THE ROUNDS, PLAYED – the same `simulateMatch` every other match in this game goes through and
 *  the same record shape, so `MatchReplay` replays them without knowing what they are. Deliberately
 *  `playCallUpRubbers`' twin: one mechanism for "a real match that is worth nothing", not two.
 *
 *  ⚠⚠ IT IS A KNOCKOUT AND THE LOOP BREAKS ON A LOSS, which is the one structural difference from a
 *  tie. A rubber set is a fixed three matches whatever happens in them; a draw is over when she
 *  loses. So the number of matches is BETWEEN ONE AND THREE and is the result itself, which is
 *  exactly what makes «at least one watchable match a year» true by construction.
 *
 *  ⚠ THE WHOLE DRAW IS COMPOSED, NOT ONLY THE ROUNDS SHE REACHES – `COLLEGE_LEAGUE_ROUNDS`
 *  opponents, always, in the same order, before a ball is struck. Same post-draw discipline
 *  `playCallUpRubbers` and `rollCallUp` keep: who was waiting in the final is a fact about the draw
 *  rather than about how far she got, and a loop that composed as it went would make the eventual
 *  champion's identity depend on her own first-round result.
 *
 *  ⚠ `friendly: true`, on `playCallUpRubbers`' own argument: the flag is the one predicate the radar
 *  (R11-2), the avatar's emotion, the knock history and the Weekly Story read to decide whether a
 *  match is EVIDENCE about her form, and a week that pays nothing and takes nothing must not
 *  silently become evidence in four subsystems at once.
 *
 *  ⚠ ZERO BODY COST AND ZERO DEVELOPMENT, DELIBERATELY, AND IT IS A CUT RATHER THAN AN OVERSIGHT –
 *  the identical cut `playCallUpRubbers` states. A condition drain, a layoff on a retirement, or
 *  feeding `growWeek`'s `matchesThisWeek` are each a balance change, and CLAUDE.md invariant 4 says
 *  those ship with a bench run and a spec. Adding the fixture was the ask; re-pricing the year was
 *  not, and doing both at once would have made the measurement unreadable. */
function playCollegeLeague(world: WorldState): CollegeLeagueResult {
  const rng = rngFromSeed(`${world.seed}:collegeleague:${world.week}`)
  const rounds = COLLEGE_LEAGUE_ROUNDS
  const surface = COLLEGE_LEAGUE.surface
  const draw: MatchPlayer[] = []
  for (let r = 0; r < rounds; r++) draw.push(collegeLeagueOpponent(collegeLeagueMatchId(world.week, r), rng))
  const kid = kidMatchPlayerFor(world, surface)
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  let roundsWon = 0
  for (let r = 0; r < rounds; r++) {
    const opp = draw[r]
    const eventId = collegeLeagueMatchId(world.week, r)
    const seed = `${world.seed}:collegematch:${world.week}:${r}`
    const result = simulateMatch(kid, opp, { surface, tour: JUNIOR_TOUR, seed })
    const score = result.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    const kidWon = result.winner === 0
    // ⚠ A ROUND IS A MATCH AND SHE CAN STOP IN ONE – the same sentence `resolvePractice` and
    // `playCallUpRubbers` write, and for the same reason: a short scoreline with no verb is the lie
    // the number tells by itself.
    const retiredId = result.retired ? (result.retired.side === 0 ? KID_ID : opp.id) : undefined
    const verb = retiredId === KID_ID ? 'had to stop against' : retiredId ? 'was playing a retiring' : kidWon ? 'beat' : 'lost to'
    const match: WorldMatch = {
      round: r,
      aId: KID_ID,
      bId: opp.id,
      winnerId: kidWon ? KID_ID : opp.id,
      seed,
      score,
      ...(retiredId ? { retiredId } : {}),
      eventId,
      surface,
      oppName: opp.name,
      a: { ...kid },
      b: { ...opp },
    }
    addEvent(world, {
      week: world.week,
      type: 'match',
      friendly: true,
      // ⚠ KEPT. `pruneResults` and `pruneEvents` delete everything else about these weeks and the
      // year card is drawn after them; a week she is still allowed to watch has to still be in the
      // feed to open. Twelve rows at the very outside, over a whole degree.
      keep: true,
      text:
        `${COLLEGE_LEAGUE.label}: ${kidShort} ${verb} ` +
        `${formatShortName(opp.name)} ${score} – no ranking points`,
      match,
    })
    if (!kidWon) break
    roundsWon += 1
  }
  return { roundsWon, rounds }
}

/** The id a championship match is filed under. ⚠ IT NAMES NO TIER, on `callUpRubberId`'s own
 *  argument: `occasionOf` derives the commentary's occasion from the event id by reading the LAST
 *  dash-segment as a tier, and a student championship genuinely has no rung behind it. The art side
 *  answers the same question a different way – `occasionArtUrl('college-league', …)` borrows the
 *  regional set by OCCASION, so a picture never needs a tier invented for it either. */
export function collegeLeagueMatchId(week: number, round: number): string {
  return `college-w${week}-r${round}`
}

/** ⭐ THE MATCHES OF ONE CHAMPIONSHIP, out of the feed – what the year card offers to replay. Derived
 *  rather than persisted, exactly like `callUpRubbersOf`: the records live in `world.events` like
 *  every other match in the game, so this adds no save field of its own. */
export function collegeLeagueMatchesOf(world: WorldState, week: number): WorldMatch[] {
  return world.events
    .filter((e) => e.week === week && e.match !== undefined && e.match.eventId.startsWith(`college-w${week}-r`))
    .map((e) => e.match!)
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
    // ⭐⭐ ROUND 24 – THE YEAR'S CHAMPIONSHIP, folded in beside the letter it earned. ⚠ NULL ON A YEAR
    // CUT SHORT BEFORE WEEK 12 CAME ROUND (an ending mid-year), which is the honest record of a year
    // that really held none – the same discipline `callUp: null` already keeps one line up.
    league: college.pendingLeague,
  })
  college.pendingCallUp = null
  // ⚠ CLEARED AFTER THE FOLD, AND `lastLeagueRun` IS WHY THAT IS SAFE. The result is not lost when
  // this is nulled – it is now in `years[n].league`, which is the second place that lookup reads. A
  // second «last result» field kept alive across the boundary would be a copy that can drift.
  college.pendingLeague = null
  // ⭐⭐⭐ v60 – AND THE REVEAL DIES WITH THE YEAR IT BELONGED TO. It cannot normally be open here –
  // `resumeFromCollege` pauses the year on it and will not spend another week until it is answered –
  // but a year CUT SHORT BY AN ENDING on the championship week itself reaches this line with one
  // still standing, and a reveal outliving its college state is a question with no surface left to
  // ask it on (`collegeProgressOf` is null the moment `doneWeek` is set). Cleared here rather than
  // guarded against everywhere, which is `pendingCallUp`'s own argument two lines up.
  college.leagueReveal = null
  // ⭐ v57 – AND THE PAUSED YEAR'S OPENING GOES WITH THEM, whose lifetime it shares: it exists from
  // a birthday pause to the bank, and a start left standing here would open the NEXT year with the
  // LAST year's four numbers. Written unconditionally so the key normalises to null the first time
  // any career banks a year (the field is optional at enrolment – see `CollegeState`).
  college.pendingYearStart = null
}

/** The measurements a year has to be opened with, taken before the first of its weeks ticks.
 *
 *  ⚠ v57 – THE SHAPE MOVED TO `shared/protocol.ts` (`CollegeYearStart`), because the birthday pause
 *  made it persisted state: a year interrupted mid-flight banks against its own opening, and by the
 *  press that finishes it the opening is history. Re-exported here so every historical import keeps
 *  resolving. */
export type { CollegeYearStart }

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
  const last = college.years[college.years.length - 1] ?? null
  return {
    yearsDone: college.years.length,
    totalYears: ENDINGS.collegeYears,
    last,
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
    // ⭐⭐ THE COLLEGE WAVE – the year's rubbers, so the card that reports the week can also OFFER it.
    // Read out of the feed by week, never persisted twice (see `callUpRubbersOf`). A year with no
    // letter has no week to read, and says so with an empty list rather than a null.
    rubbers: last?.callUp ? callUpRubbersOf(world, last.callUp.week) : [],
    // ⭐⭐⭐ ROUND 24 – THE CHAMPIONSHIP THE YEAR IS GUARANTEED, and the matches it produced.
    //
    // ⚠ IT IS `lastLeagueRun` AND NOT `last?.league`, WHICH IS A DIFFERENT QUESTION BY ONE WEEK. The
    // banked year answers "what did the year that just closed hold"; this answers "what is the most
    // recent championship on her record" – and those differ for the two enrolment weeks whose year
    // runs out between the championship and the following call-up. The card is reporting the fact
    // the selectors are about to use, so it has to be the same fact they read.
    league: lastLeagueRun(college),
    leagueMatches: (() => {
      const run = lastLeagueRun(college)
      return run ? collegeLeagueMatchesOf(world, run.week) : []
    })(),
    // ⭐ v57 – IS A YEAR PAUSED MID-FLIGHT (her birthday stopped it)? Off the persisted fact itself,
    // so the bottom control's «Finish the year» and the engine's own early-return refusal cannot
    // disagree about whether one is.
    yearInProgress: (college.pendingYearStart ?? null) !== null,
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
  const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
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
