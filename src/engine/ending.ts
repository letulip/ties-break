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
  /** the birthday the junior story runs out on (adult spec §4.1: real ITF juniors is U18) */
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
  /** ⚠ THE FLOOR, AND IT IS NOT A RETIREMENT RULE (§5.3, and the owner asked exactly the right
   *  clarifying question about it). 38 is the age at which the game STOPS ASKING. From 29 the offer
   *  comes every off-season and she may always refuse; at 38 the last offer is made and taken. So
   *  the decade from 29 is a decade of "one more year" decisions and this is the week the question
   *  runs out – not a mechanic that retires her for the player. */
  stopAskingAgeYears: 38,
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

/** The severities that count toward the accumulation MEASURE (`majorPlusCount` in the bench). The
 *  predicate itself reads weeks lost – see `injuryPriorWeeksOut` for the measurement that decided
 *  it – but the bench still reports this, because it is the shape P1 proposed and the record of why
 *  it was not shipped belongs beside the number that ruled it out. */
export const CAREER_ENDING_PRIOR_SEVERITIES: readonly string[] = ['major', 'severe']

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

/** Is the fork due? Her nineteenth birthday week, once, and never again.
 *
 *  ⚠ IT IS RAISED ON THE BIRTHDAY AND NOT AT THE SEASON BOUNDARY, because the junior cap is an AGE
 *  rule (`maxAgeYears: 18` on the J tiers), so the week her calendar loses the ladder she has been
 *  climbing is the week she turns nineteen – not the following January. */
export function forkDue(ageYears: number, alreadyAsked: boolean): boolean {
  return !alreadyAsked && ageYears >= ENDINGS.forkAgeYears
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
      detail: `${collegeYears} years on a scholarship – no ranking points, and the family stops paying`,
      resumesWeek: week + weeksPerYear,
    }
  }
  return {
    type: 'stopped',
    week,
    ageYears,
    detail: 'she stopped at nineteen, and nobody had to call it a failure',
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
 *  ⚠ THE FLOOR ARRIVES HERE AS `final: true`, NOT AS A LATCH. At 38 the offer is still an offer –
 *  it is simply the last one, and the copy says so. Nothing in this file retires her; the answer
 *  does, and at 38 the only answer on the card is yes. */
export function retirementDue(view: PlateauView): RetirementOffer | null {
  if (view.ageYears >= ENDINGS.askFromAgeYears) {
    return {
      askedWeek: 0,
      seasonIndex: view.seasonIndex,
      reason: 'age',
      final: view.ageYears >= ENDINGS.stopAskingAgeYears,
    }
  }
  if (plateauReading(view)) {
    return { askedWeek: 0, seasonIndex: view.seasonIndex, reason: 'plateau', final: false }
  }
  return null
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
    ? `${ENDINGS.stopAskingAgeYears} – the last time anybody asked`
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
export const ENDING_TITLE: Record<CareerEndingType, string> = {
  stopped: 'She stopped at nineteen',
  college: 'She went to college',
  bankruptcy: 'The money ran out',
  injury: 'The body stopped first',
  natural: 'She played until she was done',
  plateau: 'She had gone as far as she was going',
}

/** One sentence under the headline. Present tense for the two that are her decision, past for the
 *  two that happened to her – the grammar is doing the same job the copy is. */
export const ENDING_BLURB: Record<CareerEndingType, string> = {
  stopped:
    'The junior ladder ran out and the next one wanted more than the family had. She put the racket down at nineteen, and that is an ending, not a loss.',
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

