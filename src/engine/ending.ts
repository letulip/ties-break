// WHERE A CAREER ENDS: the six endings of career-contract-v1.md §4, as pure predicates over a
// narrow view of the world.
//
// ⚠ WHAT THIS FILE IS NOT. It is not a game-over machine. Four of the six endings are ANSWERS to a
// question the game asked her, and the two that are not (bankruptcy, the career-ending injury) are
// facts that have already happened by the time this file reads them. Nothing here decides that a
// career was a failure, because §6 promises the game never grades her: «The game never tells you
// that you failed. It tells you what happened.»
//
// ⚠ DEPENDENCY DIRECTION. A LEAF. No Vue, no Pinia, no `world.ts` – not even as a type. Every
// function takes the narrow slice it needs, which is what lets the whole ending model be tested
// without building a world, and what keeps `world.ts` free to call in.
//
// ⚠ RNG: NOTHING HERE DRAWS, on any stream. Every one of the six is deterministic – a counter, a
// post-draw predicate over an injury the injury sub-stream has already rolled, an age comparison, or
// a player's answer. So the frozen MAIN capture cannot notice this file exists, and a career that
// goes bankrupt mid-replay keeps drawing identically to one that does not.
import { schoolIsOver } from './kidLife'
import type { CareerEnding, CareerEndingType, ForkAnswer, RetirementOffer } from '../shared/protocol'

/** THE KNOBS. Every number here is either measured (`tools/endings-bench.ts`) or anchored in the
 *  contract; none of them is a difficulty setting. */
export const ENDINGS = {
  // --- #3 BANKRUPTCY ---------------------------------------------------------------------------
  /** ⚠ MEASURED, NOT PICKED (adult spec B4: «N is a design decision, not an obvious one, and it
   *  should be measured before it is picked»). Swept over {4, 6, 8, 12, 16, 24} against
   *  career-outcome-targets.md's own row - «Family did not go bankrupt, 14→18: 60-80% of all
   *  starts» - on both bench entry policies. The table and the argument are in
   *  docs/specs/endings-and-the-album.md §3; the short version:
   *
   *    N        grinder survives    careful survives
   *    4              39.8%  ✗            78.7%
   *    8              61.1%               79.6%
   *    12             73.1%               79.6%     <- shipped
   *    16             83.3%  ✗            79.6%
   *
   *  ⚠ THREE THINGS PICK 12 OVER 8, AND NONE OF THEM IS TASTE.
   *    1. It is the only candidate that puts BOTH policies MID-band rather than one of them on the
   *       edge: 8 leaves the reckless parent at 61.1%, a rounding error from failing the target.
   *    2. It is three times the reckless policy's MEDIAN DEBT SPELL (4 weeks), so it cannot fire on
   *       a wobble - and a fifth of the careful policy's median spell (57 weeks), so it cannot miss
   *       a real collapse. Those two medians are what the grace window has to sit between.
   *    3. It is exactly the window the Money screen already draws. `FINANCE_WEEKS` is «12w + a full
   *       52w season» and the breakdown opens on "Last 12 weeks", so a family in the grace period
   *       can see the whole of it on one chart - the warning phase B4 demands, with no new surface. */
  bankruptcyGraceWeeks: 12,

  // --- #1/#2 THE FORK AT NINETEEN --------------------------------------------------------------
  /** the birthday the junior story runs out on (adult spec §4.1: real ITF juniors is U18).
   *  ⚠ SINCE ROUND 24 #5 THIS IS A FACT ABOUT THE GAP, NOT THE TRIGGER: the fork is ASKED when
   *  school ends (`forkDue` reads `schoolIsOver`, age 18.0–18.9) and the college DEPARTURE lands on
   *  the next academic-year start – which, for every birth month, is the first 1 September after
   *  this birthday. The junior rungs still close on their own age gates at nineteen, inside the
   *  ask→depart year. Kept because it documents that identity and the e2e stop fixture reads it. */
  forkAgeYears: 19,
  /** §5.1 – four years of student tennis on a scholarship, and she comes back at twenty-two. */
  collegeYears: 4,
  /* ⭐⭐ `collegeClosedFromTier` WAS HERE, AND IT IS RETIRED BY AN OWNER RULING OF 16.08 – NOT BY a
   *  balance pass, and not because the rule was hard to tune. Verbatim: «collegeClosedFromTier – так
   *  ведь нет же там никакой связи с w75, мы же всё узнали. Колледж – это независимая ветка карьеры с
   *  отдельным функционалом и турнирами, альтернативная.»
   *
   *  ⚠ THE RECORD OF WHAT IT WAS AND WHY IT WENT, because deleting the reasoning would delete the
   *  record of a rule that survived four phases on a premise nobody had checked:
   *
   *    * IT WAS `'w75'`, and it removed the college answer from the fork card the first time she
   *      posted a counting result at W75 or above. Round-17 #6 put it there: the owner's complaint
   *      that the fork «offers the academy to a girl already earning on W75+».
   *    * ITS ORIGINAL JUSTIFICATION WAS AN NCAA ELIGIBILITY RULE THAT DOES NOT EXIST – *"A player who
   *      has taken professional prize money has spent her college eligibility"*. The old bylaw let a
   *      prospective player keep $10,000 a year plus expenses before enrolment; since the
   *      Brantmeier/Joint settlement of **15 April 2026** there is **no pre-enrolment cap at all**,
   *      and "amateurism" appears **zero times** in the current Division I Manual
   *      (`docs/research/college-and-the-junior-exit.md` §1b). P4 corrected the comment and left the
   *      constant standing on the owner's own argument instead – *a girl who is already a
   *      professional does not go to college*.
   *    * ⚠ AND THAT ARGUMENT IS THE ONE HE HAS NOW WITHDRAWN. College here is an INDEPENDENT BRANCH
   *      of the career with its own four years, its own tournaments and its own national-team call-up
   *      (P5, `docs/specs/college-as-a-second-act-2026-08.md`) – an alternative, not a consolation.
   *      Nothing in the sport and nothing in this game's own design closes that branch on a RESULT.
   *    * ⚠ IT WAS ALSO ALREADY MEASURED AS BOOKKEEPING. P4 re-measured it firing at median age 19.1
   *      against a fork at 19.0 – *"a gate that fires after the decision is not a gate"* – and stated
   *      the three options in its §6.1. This is option (B), taken by the owner rather than by an
   *      agent, and it is why §6.1 is now closed.
   *
   *  ⚠⚠ WHAT DID **NOT** GO: everything behind the door. The third answer, `endingForForkAnswer`'s
   *  college branch, `world.college`, the four years lived one at a time, `leaveCollege` and the
   *  call-up are all untouched. What went is only the rule that could REMOVE the choice.
   *
   *  ⚠ AND ROUND-21 #8 IS RETIRED BY THIS RULING RATHER THAN DROPPED. He asked then for the fork card
   *  to say WHY the college answer was missing; there is no case in which it is missing now, so the
   *  sentence has nothing left to explain. `docs/specs/college-is-its-own-branch-2026-08.md` §4 says
   *  so out loud rather than letting an answered request disappear quietly. */

  // --- #5/#6 THE NATURAL END -------------------------------------------------------------------
  /** her own decline starts here (`ECONOMY.development.ageCurve.declineStart`), so this is where
   *  the question starts being a real one rather than a rhetorical one */
  askFromAgeYears: 29,
  /** ⚠ THE LAST OFFER, AND IT IS READ OFF HER BODY RATHER THAN OFF A BIRTHDAY (the long goodbye,
   *  docs/specs/the-long-goodbye-2026-08.md §3a). The share of her OWN PEAK PHYSICAL below which the
   *  off-season offer carries `final: true` – `physicalMean(skills) / peakPhysical`, both of them
   *  written by the growth phase, both v62. From 29 the offer still comes every off-season and she
   *  may still always refuse; this is the week the question runs out. It is not a mechanic that
   *  retires her for the player, and the answer is still hers.
   *
   *  ⭐⭐ `stopAskingAgeYears: 38` WAS HERE AND IT IS DELETED RATHER THAN LEFT DANGLING, on the
   *  owner's reading of the news, 26.08: «Roger Federer играл активно до 41 года … отсюда у меня
   *  мысли на тему нашей жесткой концовки в 38 – может быть ее как-то пересмотреть». A fixed number
   *  is what he objected to, not the finish: §2 of the spec measures that DELETING the finish would
   *  leave 41% of the "plays on" arm with no ending at all, which is not a gentler story than a wall.
   *
   *  ⭐ 0.55 IS HIS OWN NUMBER, 26.08: «я бы взял 55% по уходу – согласен, звучит ок». It is a DIAL,
   *  and because the decline is deterministic in age the whole dial maps to ages (§3a):
   *
   *      70% -> 37.8    65% -> 38.9    60% -> 40.0    55% -> 41.2    50% -> 42.3
   *
   *  ⚠⚠ AND 70% IS TODAY'S GAME, WHICH IS WHY THIS IS A STRICT GENERALISATION AND NOT A NEW RULE.
   *  Built at 0.70 first and measured before 0.55 was set: the endings bench came back IDENTICAL to
   *  the run on the deleted constant, ending for ending, median for median, on both retirement arms
   *  (9 presets x 10 seeds, 26.08). A rollback is this one line.
   *
   *  ⚠ THE ONE PLACE 0.70 IS NOT EXACTLY 38, stated because "byte for byte" is what the spec claims
   *  and it is not quite true. The question is raised on ONE week a year, and the crossing is at
   *  37.81 while the old rule woke at 38.00, so a girl whose off-season wrap falls inside that
   *  0.19-year window is asked for the last time a year early. Measured over all 36 birth dates: 8 of
   *  them, every one in December-February. `DEFAULT_PROFILE` (15 June) is not one, which is why the
   *  bench reproduces exactly.
   *
   *  ⚠ IT IS A SHARE OF HER PEAK AND NEVER OF HER POTENTIAL (§3b). Reading against `potential` would
   *  cost nothing – it is already persisted – and it would tell a girl who never came near her
   *  ceiling that she is finished while she is still young. The signal has to be what she reached.
   *
   *  ⚠⚠ AND WHAT IT DOES NOT YET DO, MEASURED, SO NOBODY INFERS IT FROM THE SPEC. §3's promise is
   *  that «a body wrecked by 33 finishes at 33» – TODAY IT DOES NOT, and the rule is age-equivalent
   *  for every career that has ever been played. Nothing in the engine lowers her physical relative
   *  to HER OWN peak: `growWeek` is the only writer of `world.skills`, its gain term is 0 from
   *  `declineStart` (so the peak is frozen the week the decline starts, at share exactly 1) and its
   *  loss is proportional per attribute (so every career keeps the same share at the same age). Four
   *  walked careers with peaks 31% apart – grind against coast – read the same share to three
   *  decimals at every off-season week. What a wrecked body loses is the LEVEL of the peak, which is
   *  real tennis and no part of this trigger. Making the goodbye personal needs a mechanism that does
   *  not exist yet, and §4a's recovery corridor is not it either – it slows her rest weeks, not her
   *  skills. `tests/ending.test.ts` pins this as the measured fact it is, so the day such a mechanism
   *  lands the pin goes red and gets re-aimed instead of quietly agreeing. */
  lastOfferPeakShare: 0.55,
  /** #6 THE PLATEAU – «не могу выйти в топ – уйду». NOT a sixth mechanism: a READING that lets the
   *  natural end ask early. She has to have had a professional life first, or "plateau" just means
   *  "young", so the reading is gated on an age as well as on a drought. */
  plateauFromAgeYears: 24,
  /** ⚠ MEASURED. Seasons with no rung cleared AND a flat rank before the question is raised early.
   *  Swept over {2, 3, 4} in the bench; 3 is the value the rates support (see the spec §4). */
  plateauSeasons: 3,
  /** "flat" – how far her season-end rank may wander inside the window and still count as flat */
  plateauRankBand: 20,

  // --- #4 THE CAREER-ENDING INJURY -------------------------------------------------------------
  /** ⚠ A POST-DRAW PREDICATE, NOT A NEW SEVERITY BAND. Re-mapping `severityBands` would change what
   *  every already-drawn `seed:injury:<week>` roll MEANS; reading the band after it is drawn touches
   *  nothing shipped.
   *
   *  ⚠ AND THE ACCUMULATION IS WEEKS LOST, NOT LAYOFFS COUNTED – because the obvious rule was
   *  MEASURED AND IT WAS UNREACHABLE. P1's proposal was "a fresh severe on a body with >= 2 prior
   *  major-or-severe layoffs", predicted at 1-2% of careers. Instrumented over 90 full careers
   *  (tools/endings-bench.ts, the plays-on arm): 11.1% ever saw a fresh severe at all, mean 0.64
   *  major-or-worse layoffs per WHOLE career, and the joint condition fired 0.0% of the time. It is
   *  not rare, it is impossible - the top band is 2.5% of injuries and major is 7.5%, so needing
   *  three of them in one career is asking for a coincidence the injury model cannot produce.
   *
   *  Weeks lost is reachable AND it is the better rule anyway: it is physical rather than
   *  bookkeeping (a body that has already spent five months off court), it does not care which
   *  labels the severity bands happen to carry, and it is a number the epilogue can print. Measured
   *  at this threshold: 4.4% of full-life careers, and far less across all careers, most of which
   *  end long before a body can accumulate that much. Rare enough to be a story, exactly as B5 asks,
   *  and never a difficulty setting - nothing the player chooses moves it. */
  injuryPriorWeeksOut: 20,
} as const

// --- #3 and #4: the two that HAPPEN TO her ------------------------------------------------------

/** The narrow slice the automatic detectors read. Nothing about her skills, her rank or her tennis
 *  is in here, because neither of these two endings is about how good she is. */
export interface AutoEndingView {
  week: number
  ageYears: number
  fundsCents: number
  /** the first week of the CURRENT unbroken spell below zero, or null when she is solvent */
  debtSinceWeek: number | null
  /** the cheapest entry fee on the visible calendar, in cents – the "no path back" half of B4 */
  cheapestEntryFeeCents: number
  /** the severity of an injury that landed THIS week, or null (an ongoing layoff is not fresh) */
  freshInjurySeverity: string | null
  /** every layoff she has recovered from: what it was, and how long it took. ⚠ PRUNED to the last
   *  twenty by `rollInjury`, which is why the accumulator below exists beside it. */
  injuryHistory: readonly { severity: string; weeksOut: number }[]
  /** the monotone career total of weeks lost (v40, `careerTotals.weeksLostToInjury`). 0 on a
   *  hand-built view, which is why `weeksLostSoFar` takes the larger of the two. */
  weeksLostToInjury?: number
}

/** How many consecutive weeks she has been under water, counting this one. 0 when solvent. */
export function debtWeeks(view: { week: number; debtSinceWeek: number | null }): number {
  if (view.debtSinceWeek === null) return 0
  return view.week - view.debtSinceWeek + 1
}

/** #3 – BANKRUPTCY. «Funds below zero and unable to fund the cheapest entry on the calendar for N
 *  consecutive weeks.»
 *
 *  ⚠ THE SECOND CLAUSE IS REDUNDANT AND IT IS WRITTEN OUT ANYWAY. With funds below zero no entry
 *  fee is payable at all (`enterEvent` tests `fundsCents >= entryFeeCents`), so "unable to fund the
 *  cheapest entry" is implied by the first clause on every calendar this game can generate. It
 *  stays here spelled out because the contract words it that way and because the day a rung ships
 *  with a zero fee – a local club draw that costs nothing to enter – the conjunction is what stops
 *  a girl who can still play being declared bankrupt for having no cash.
 *
 *  ⚠ ONE BAD WEEK IS NEVER DEATH. The spell resets the week the money recovers, which is the whole
 *  reason this is a spell and not a floor. A hard debt floor was the runner-up and it is rejected in
 *  the spec: one catastrophic medical bill could end a career in a single week, which is exactly the
 *  instant death the warning phase exists to forbid. */
export function bankruptcyDue(view: AutoEndingView, graceWeeks: number = ENDINGS.bankruptcyGraceWeeks): boolean {
  if (view.fundsCents >= 0) return false
  if (view.fundsCents >= view.cheapestEntryFeeCents) return false
  return debtWeeks(view) >= graceWeeks
}

/** #4 – THE CAREER-ENDING INJURY. A fresh `severe` on a body that has already been through
 *  `injuryPriorMajors` major-or-worse layoffs. */
export function careerEndingInjuryDue(
  view: AutoEndingView,
  priorWeeksOut: number = ENDINGS.injuryPriorWeeksOut,
): boolean {
  if (view.freshInjurySeverity !== 'severe') return false
  return weeksLostSoFar(view) >= priorWeeksOut
}

/** How much of her playing life the body has already spent off court.
 *
 *  ⚠ THE LARGER OF TWO ANSWERS, AND THE REASON IS THE PRUNE. `injuryHistory` keeps the last twenty
 *  layoffs and drops the rest (`rollInjury`), so summing it under-counts exactly the bodies this
 *  rule is about – measured over 90 full careers, 13 reached the cap and 1.4% of onsets were judged
 *  against a total a mean of 6.1 weeks short. `careerTotals.weeksLostToInjury` (v40) is the monotone
 *  counter that cannot be pruned.
 *
 *  It is `max` rather than "prefer the counter" for two reasons, both load-bearing: a hand-built
 *  view (every test in this file, and the endings bench's own probes) carries a history and no
 *  counter, and a MIGRATED save carries a counter back-filled from the same pruned list – so
 *  whichever of the two is bigger is always the more honest number, and neither can ever make the
 *  ending fire on a body that has lost less than the visible history says. */
export function weeksLostSoFar(view: Pick<AutoEndingView, 'injuryHistory' | 'weeksLostToInjury'>): number {
  const fromHistory = view.injuryHistory.reduce((sum, h) => sum + h.weeksOut, 0)
  return Math.max(fromHistory, view.weeksLostToInjury ?? 0)
}

/** The two automatic endings, in the order they are checked. Bankruptcy leads because it is the one
 *  the player was warned about for weeks; an injury that ends a career is a week that has just
 *  happened, and a girl who is both broke and broken should read as the story she was living. */
export function detectEnding(view: AutoEndingView, graceWeeks: number = ENDINGS.bankruptcyGraceWeeks): CareerEnding | null {
  if (bankruptcyDue(view, graceWeeks)) {
    const weeks = debtWeeks(view)
    return {
      type: 'bankruptcy',
      week: view.week,
      ageYears: view.ageYears,
      detail: `${weeks} weeks below zero – there was no next entry fee`,
      resumesWeek: null,
    }
  }
  if (careerEndingInjuryDue(view)) {
    const lost = weeksLostSoFar(view)
    return {
      type: 'injury',
      week: view.week,
      ageYears: view.ageYears,
      detail: `${lost} weeks already lost, and then this one`,
      resumesWeek: null,
    }
  }
  return null
}

// --- #1 and #2: the fork at nineteen ------------------------------------------------------------

/** Is the fork due? The week school ends, once, and never again.
 *
 *  ⭐⭐⭐ ROUND 24 #5 – IT MOVED OFF HER BIRTHDAY, and the move is the owner's design rather than a
 *  drift («В колледж она пошла ровно в день своего рождения, а должна была в начале учебного года»;
 *  the approved shape is ask / hold / depart – docs/specs/college-departure-2026-08.md). The
 *  question a family actually decides in her last school year is asked when that year ends:
 *  `schoolEndWeek` – the game's ONE notion of school being finished (kidLife.ts, «Конец школы – в
 *  конце учебного года»), age 18.00–18.92 for every birth month the game can roll. What used to be
 *  asked here on the birthday – enrolment itself – now happens at the DEPARTURE, the next academic
 *  year start, which for every birth month is also the first 1 September after her nineteenth: the
 *  junior rungs close on age (`maxAgeYears: 18` on the J tiers) INSIDE the gap, so the year between
 *  ask and departure is her last junior season, played rather than skipped.
 *
 *  ⚠ A WEEK PREDICATE NOW, NOT AN AGE ONE, because school's end is a September fact and not a
 *  birthday fact – `ENDINGS.forkAgeYears` below keeps naming the age the junior story runs out on,
 *  which is now a fact about the GAP rather than the trigger. */
export function forkDue(week: number, birthMonth: number, alreadyAsked: boolean): boolean {
  return !alreadyAsked && schoolIsOver(week, birthMonth)
}

/* ⭐⭐ `CollegeResultView` AND `collegeDoorOpen` WERE HERE, AND THEY GO WITH THE CONSTANT THEY READ
 *  (owner, 16.08 – the ruling is on the retired `collegeClosedFromTier` above).
 *
 *  ⚠ THE RECORD, because this leaf was the whole of P4's decoupling and its reasoning outlives it.
 *  `collegeStillOpen` used to reach into `TIERS[tier].points` – the LADDER'S PRIZE COLUMN – to decide
 *  what "a result that counted" meant, so a wave re-sizing a rung's points moved the college ending
 *  without saying so, exactly as P3's `w75.acceptsRank` 450 -> 300 had already done. P4 replaced the
 *  read with a three-number view (the rung's index, her best finish, the draw's DEPTH) so that no
 *  acceptance cut and no points edit could reach the door except through the college rule's own knob.
 *
 *  ⚠ THE DECOUPLING WORKED AND THAT IS WHY THIS DELETION IS SMALL. Because the rule was already a
 *  leaf, removing it touches no calendar constant, no acceptance cut and no points table – the
 *  coupling P4 broke is the reason its removal cannot move the ladder. The `finish < rounds - 1`
 *  reading it carried – *she has to have WON A MATCH there* (owner, 13.08) – has no other consumer:
 *  `wtaEverCounted` in `world/endings.ts` states the same test for the WTA table and is untouched. */

export function endingForForkAnswer(
  answer: ForkAnswer,
  week: number,
  ageYears: number,
  collegeYears: number = ENDINGS.collegeYears,
  weeksPerYear = 52,
): CareerEnding | null {
  if (answer === 'continue') return null
  if (answer === 'college') {
    // ⭐⭐ P5 – `resumesWeek` IS ONE YEAR NOW, NOT `collegeYears` OF THEM, and that single expression
    // is what turns a four-year skip into four years she lives through
    // (docs/specs/college-as-a-second-act-2026-08.md). Reality's own case is one year and not four:
    // Diana Shnaider left after about a season and is inside the WTA top 15, so the block was the
    // wrong SHAPE as well as an empty one. `world/college.ts` re-latches this ending with the next
    // year's week each time one is spent, and `leaveCollege` is the answer that stops it.
    //
    // ⚠ `collegeYears` STAYS IN THE SIGNATURE AND STAYS IN THE COPY. It is the length of the course
    // she has enrolled on – four years is what the scholarship is FOR – and the early return is her
    // leaving it, not the course being shorter. A caller that passed a different length still gets
    // a consistent ending.
    return {
      type: 'college',
      week,
      ageYears,
      // ⚠⚠ "the family stops paying" WAS FALSE FROM v51 AND SHIPPED ANYWAY (fixed round 21,
      // docs/specs/the-college-tariff-2026-08.md). `resolveCollegeBill` has debited the family's
      // share of the year every week she is enrolled since v51, so this line asserted the opposite of
      // what the tick does – the same failure the fork card's «the money goes the other way» had, and
      // the fork card was the only one of the three fixed at the time. The line now says what the
      // four years actually are and makes no claim about the direction of the money, because the
      // direction depends on an offer this function is not handed.
      detail: `${collegeYears} years of student tennis – no ranking points, and the family pays its share of each year`,
      resumesWeek: week + weeksPerYear,
    }
  }
  return {
    type: 'stopped',
    week,
    ageYears,
    // ⚠ "at nineteen" UNTIL ROUND 24 #5 – the fork is asked when school ends now (age 18.0–18.9),
    // so the line anchors to the moment that raises it rather than to an age it no longer fires at.
    detail: 'she stopped when school ended, and nobody had to call it a failure',
    resumesWeek: null,
  }
}

// --- #5 and #6: the natural end, and the plateau reading ----------------------------------------

/** What the plateau reading needs, and all it needs.
 *
 *  ⭐ ROUND-19 #1 – EVERY FIGURE IN HERE IS ABOUT ONE TABLE, THE ONE SHE IS CURRENTLY ON. The view
 *  is built by `plateauViewOf` (engine/world/endings.ts), which resolves that table once through
 *  `activeLadderOf` and reads both fields below against it. This leaf never learns which table it
 *  is, and does not need to – but it may not be handed two. */
export interface PlateauView {
  ageYears: number
  /** the season index that just closed */
  seasonIndex: number
  /** her season-end rank per finished season ON THAT TABLE, oldest first – and ONLY the seasons that
   *  carry one. A season she was not ranked in it, and a season banked before the per-track record
   *  existed at all (v46), are not comparable and are simply absent, which is what makes the two
   *  guards in `plateauReading` below into "decline to fire". */
  seasonEndRanks: readonly { seasonIndex: number; endRank: number }[]
  /** the season she last cleared a rung in – the first title or final at the highest tier she has
   *  ever reached one at ON THAT SAME TABLE – or null if she has never reached a final there */
  lastRungSeasonIndex: number | null
  /** ⭐⭐ HOW MUCH OF HER OWN BODY IS LEFT: `physicalMean(skills) / peakPhysical` (the long goodbye
   *  §3a, v62's stored peak). 1 at her peak and falling every week from `declineStart`.
   *
   *  ⚠ IT IS READ BY `retirementDue` AND NOT BY `plateauReading` – the plateau is a RESULTS reading
   *  and stays one, deliberately (§7.2: «a body-driven last word and a results-driven mid-career
   *  question are different things»). It lives on this view because this is the view the off-season
   *  question is asked of, which is also where `ageYears` already lives for the same reason. */
  physicalShare: number
}

/** #6 – THE PLATEAU. «Не могу выйти в топ – уйду.»
 *
 *  Two conditions, both of which a player could check by hand from the Stats screen:
 *    1. NO RUNG CLEARED for `plateauSeasons` seasons – her highest rung is the one she already had.
 *    2. THE RANK IS FLAT – no season in the window beat her best from before it, and the window's
 *       own ranks sit inside `plateauRankBand` of each other.
 *
 *  ⚠ CONDITION 2 IS A CONJUNCTION AND BOTH HALVES ARE LOAD-BEARING. "No improvement" alone would
 *  fire on a career that is falling apart – which is a different story and one the natural end
 *  should not be telling. "Inside the band" alone would fire on the three quiet seasons of a
 *  nineteen-year-old who is about to break through. Together they mean what the owner's sentence
 *  means: she is where she is going to be. */
export function plateauReading(view: PlateauView, seasons: number = ENDINGS.plateauSeasons): boolean {
  if (view.ageYears < ENDINGS.plateauFromAgeYears) return false
  // ⭐ ROUND-19 #1 – THESE TWO GUARDS ARE WHERE THE RULE DECLINES, and what they refuse changed with
  // the view rather than with a line here. There are exactly `seasons` season indices in the range
  // this filter keeps, so a short window means a season inside it carries no rank ON HER TABLE – and
  // an empty `before` means there is nothing on that table to have improved on. Either way the
  // question cannot be asked of one ladder, so it is not asked at all.
  const window = view.seasonEndRanks.filter((s) => s.seasonIndex > view.seasonIndex - seasons)
  if (window.length < seasons) return false
  const before = view.seasonEndRanks.filter((s) => s.seasonIndex <= view.seasonIndex - seasons)
  if (before.length === 0) return false

  // 1. no rung cleared inside the window
  if (view.lastRungSeasonIndex !== null && view.lastRungSeasonIndex > view.seasonIndex - seasons) return false

  // 2a. nothing in the window beat her best from before it (smaller rank is better)
  const bestBefore = Math.min(...before.map((s) => s.endRank))
  const bestInWindow = Math.min(...window.map((s) => s.endRank))
  if (bestInWindow < bestBefore) return false

  // 2b. ...and the window itself is flat rather than collapsing
  const worstInWindow = Math.max(...window.map((s) => s.endRank))
  return worstInWindow - bestInWindow <= ENDINGS.plateauRankBand
}

/** Should the natural end ask her this off-season, and with what reason? Null when it should not.
 *
 *  ⚠ THE LAST OFFER ARRIVES HERE AS `final: true`, NOT AS A LATCH. It is still an offer – it is
 *  simply the last one, and the copy says so. Nothing in this file retires her; the answer does,
 *  and on that one the only answer on the card is yes.
 *
 *  ⭐⭐⭐ AND WHICH ONE IS LAST IS HER BODY'S ANSWER NOW, NOT A BIRTHDAY (the long goodbye §3a). This
 *  line read `view.ageYears >= ENDINGS.stopAskingAgeYears` – the same 38 for every career the game
 *  has ever run. It reads the share of her own peak physical she has left, so the ceiling has to be
 *  earned: §3a maps the shipped threshold to age 41.2 on an undamaged career, which is the age the
 *  owner's own question was about.
 *
 *  ⚠ `askFromAgeYears` STILL GATES EVERYTHING AND HAS NOT MOVED – nothing fires before 29 whatever
 *  the share says. Note that it cannot: `declineStart` IS 29, so the share is exactly 1 until then
 *  and a "wrecked" body reads 100% at 28 as surely as a kept one. The gate is not redundant, it is
 *  the reason the share is meaningful when it is finally read.
 *
 *  ⚠ THE PLATEAU BRANCH IS UNTOUCHED, on the spec's §7.2: a results-driven mid-career question and a
 *  body-driven last word are different things, and the second one moving is no reason for the first. */
export function retirementDue(view: PlateauView): RetirementOffer | null {
  if (view.ageYears >= ENDINGS.askFromAgeYears) {
    return {
      askedWeek: 0,
      seasonIndex: view.seasonIndex,
      reason: 'age',
      // ⚠ `<=`, NOT `<`. The threshold is the share she may still stand at and be asked again, so
      // the off-season she is AT it is the off-season the question runs out.
      final: view.physicalShare <= ENDINGS.lastOfferPeakShare,
    }
  }
  if (plateauReading(view)) {
    return { askedWeek: 0, seasonIndex: view.seasonIndex, reason: 'plateau', final: false }
  }
  return null
}

/** ⭐⭐⭐ HER OWN LAST WORD (the long goodbye step 4, §4) – THE ONE SENTENCE THAT IS HERS, WRITTEN
 *  ONCE AND RENDERED IN THREE PLACES: the feed line the off-season writes, the card that used to ask
 *  the parent a question with one legal answer, and – through `endingForRetirement` below – the
 *  epilogue's own detail. Exported so a test can pin the line without pinning a spelling, on the
 *  precedent of `RELEASE_LINE_PREFIX` and `COLLEGE_FREEZE_REFUSAL`.
 *
 *  ⚠⚠ WHAT THIS SENTENCE MAY NOT SAY, AND EVERY CLAUSE OF IT WAS MEASURED BEFORE IT WAS WRITTEN.
 *  The spec's own proposed line was «she did not come back from the winter», and step 3 measured it
 *  FALSE: `opens next` at 30/33/35/37/39/41 reads 83/84/90/91/93/97, because she plays 19.7 matches
 *  a season at 42 against 38.9 at 16 and less tennis outruns slower recovery. **She opens her last
 *  seasons better, not worse.** So nothing here may imply she is too tired to go on.
 *
 *  ⚠ NOR MAY IT IMPLY SHE WORE OUT FASTER THAN ANYBODY ELSE, or that the player's management brought
 *  this on. §3a's third correction: the share is a function of her AGE alone – two careers 26% apart
 *  in peak read identical shares to three decimals – so a line blaming a body, a load or a decision
 *  would be a promise the engine does not keep.
 *
 *  ⭐ WHAT IS LEFT IS THE HONEST MATERIAL, AND IT IS BETTER THAN WHAT WAS PROPOSED. Composure does
 *  not decline: `growWeek` hands every non-physical attribute `veteranPoise` from `declineStart`, so
 *  she is at her most composed the day she stops – see `physicalMean`'s own note in development.ts,
 *  which excludes composure from the share for exactly this reason. «steadily» is that fact said
 *  in-fiction, and it is the only thing in this line that is about HER rather than about the week.
 *
 *  ⭐ AND THE COUNT IS THE RICHEST STATE ON THE CARD. A woman who has said one more year four times
 *  is telling a different story from one who never had to, and `oneMoreYearCount` is the only field
 *  that can tell them apart. It counts BOTH questions – the plateau's and the age one – which is
 *  correct: the sentence says how often she has said those words, not which reading prompted them.
 *
 *  ⚠ IT GRADES NOTHING (the house rule, «мы ни за что не наказываем»). It does not say the career
 *  was good or wasted, it does not console, and it does not tell the player they should have done
 *  something else. It reports who spoke and how. */
export const LAST_WORD_OPENING = 'Nobody asked her this time. She said it herself, and she said it steadily.'

/** Her line, with the one piece of state it reads. `oneMoreYearCount` is defensive against a poked
 *  save: a count of 0 is unreachable in normal play (she is asked from 29 and the share cannot reach
 *  the threshold until her forties) but it is a number on a save file, so it gets its own branch
 *  rather than printing «one more year 0 times». */
export function lastWordLine(oneMoreYearCount: number): string {
  if (oneMoreYearCount <= 0) return `${LAST_WORD_OPENING} This season was the last one.`
  const times = oneMoreYearCount === 1 ? 'time' : 'times'
  return `${LAST_WORD_OPENING} She has said one more year ${oneMoreYearCount} ${times}, and this season was the last one.`
}

export function endingForRetirement(
  offer: RetirementOffer,
  week: number,
  ageYears: number,
  oneMoreYearCount: number,
): CareerEnding {
  const type: CareerEndingType = offer.reason === 'plateau' ? 'plateau' : 'natural'
  if (offer.reason === 'plateau') {
    return {
      type,
      week,
      ageYears,
      detail: `${ENDINGS.plateauSeasons} seasons and the table would not move`,
      resumesWeek: null,
    }
  }
  const detail = offer.final
    // ⚠ HER REAL AGE, NOT A CONSTANT (the long goodbye step 2). This read
    // `${ENDINGS.stopAskingAgeYears}` and printed the same 38 into every epilogue ever written;
    // there is no such number any more, because the last offer lands where her body puts it.
    // `ageYears` arrives already whole (`kidAgeYears` floors), so the number is what it always was.
    // ⭐⭐ AND STEP 4 IS THE REWRITE STEP 2 PROMISED. It said «the last time anybody asked», and
    // after `LAST_WORD_OPENING` above nobody asks: the final offer is her statement, so an epilogue
    // whose one-line summary of it names a question is an epilogue contradicting its own card. Same
    // number, same length, and the voice is now hers. It reads in place as
    // «She played until she was done – 41, and nobody had to ask her.»
    ? `${ageYears}, and nobody had to ask her`
    : oneMoreYearCount > 0
      ? `${oneMoreYearCount} more ${oneMoreYearCount === 1 ? 'year' : 'years'} after the first time she was asked`
      : 'the first time she was asked, she said yes'
  return { type, week, ageYears, detail, resumesWeek: null }
}

// --- the copy -----------------------------------------------------------------------------------

/** The headline of the epilogue. Six lines, and not one of them is a grade.
 *
 *  ⚠ NONE OF THESE MAY CONSOLE, and that is a harder rule than it sounds. «Стоп» must be able to be
 *  the right answer (ruling 4, 30.07); a line that reassures the player about it is a line that has
 *  quietly decided it was the wrong one. */
/** ⭐⭐ RESTORED 18.08 – DELETED FOR A DAY AND PUT BACK BY THE OWNER, and the reason is worth keeping.
 *  A grep for consumers is exactly right for a CONSTANT and exactly wrong for authored copy: this is
 *  six lines of epilogue prose, one per ending, and "nothing renders it" means the ending SCREEN has
 *  not been built out yet, not that the writing is dead. The owner: «может быть мы просто не добрались
 *  еще до концовок и рано что-то удалять».
 *
 *  ⚠ SO THE RULE THIS CORRECTS: an unconsumed EXPORT is a candidate for deletion; unconsumed WRITING
 *  is a candidate for the owner. `ENDING_TITLE` below is live and this is its unwritten other half. */
export const ENDING_BLURB: Record<CareerEndingType, string> = {
  // ⚠ ROUND 24 #5 – the fork is asked when school ends now, so this stopped saying "at nineteen":
  // she answers at 18.0–18.9, with her last junior season still ahead of her, and the blurb may not
  // assert a year she chose not to play.
  stopped:
    'School ended and the next ladder wanted more than the family had. She put the racket down there, and that is an ending, not a loss.',
  // ⚠ P5 – IT NO LONGER PROMISES FOUR YEARS OR A DEGREE, because she may leave after one and the
  // sport's own case is that she does. It also no longer asserts "no ranking at all": measured over
  // the freeze (spec §4) her professional rank is IDENTICAL at both ends in the median career,
  // because she was already off the list the week she walked in. The line that replaced it says the
  // thing that IS true of every college career and of nothing else in this game.
  college:
    'A scholarship, a closed league that pays no ranking points, and a stretch of years in which the money finally goes the other way. The tour does not wait, and it does not remember.',
  bankruptcy:
    'Week after week below zero, and then a week with no entry fee in it. Nobody chose this one – the arithmetic did.',
  injury:
    'The body had been telling the same story for years. This time it was not a layoff, it was the end of the sentence.',
  natural:
    'She was asked every off-season and for years she said one more. This year she did not.',
  plateau:
    'The rung above stayed where it was and so did she. Her own words for it were the plainest ones – she could not reach the top, so she went.',
}

export const ENDING_TITLE: Record<CareerEndingType, string> = {
  stopped: 'She stopped after school',
  college: 'She went to college',
  bankruptcy: 'The money ran out',
  injury: 'The body stopped first',
  natural: 'She played until she was done',
  plateau: 'She had gone as far as she was going',
}
