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
import type { TierId } from './season/types'

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
  /** ⭐ THE RUNG AT WHICH THE SCHOLARSHIP STOPS BEING AN OPTION (round-17 #6).
   *
   *  The owner: the fork «offers the academy to a girl already earning on W75+». It did – the
   *  college answer had no precondition of any kind, so a nineteen-year-old with a professional
   *  ranking, a tour kit deal and prize money in the bank was offered "four years of student tennis.
   *  No ranking points, and the money goes the other way" as an equal third of the card.
   *
   *  ⚠⚠ THE JUSTIFICATION THIS COMMENT USED TO CARRY IS FACTUALLY WRONG, AND IT IS CORRECTED HERE
   *  RATHER THAN QUIETLY DROPPED (P4, 16.08). It read: *"it is a PRECONDITION and not a WARNING. A
   *  player who has taken professional prize money has spent her college eligibility."* **That has
   *  been false for the whole life of this project.** The NCAA let a prospective college player keep
   *  $10,000 of prize money a year plus actual and necessary expenses before enrolment, and since the
   *  Brantmeier/Joint settlement of **15 April 2026** there is **no pre-enrolment cap at all**;
   *  "amateurism" appears **zero times** in the current Division I Manual. The one real edge is at
   *  ENROLMENT – after it, prize money may not exceed expenses – so the sport's cliff is a day she
   *  walks through, never a result she posts. `docs/research/college-and-the-junior-exit.md` §1b has
   *  the sources.
   *
   *  ⚠ THE CONSTANT IS NOT WRONG – ITS OLD REASON WAS. There is a perfectly good argument for a rung
   *  threshold and it is the owner's own: **a girl who is already a professional does not go to
   *  college.** That needs no rulebook to stand up, and it is the argument this constant now rests
   *  on. What went with the old reason is the word PRECONDITION: the owner ruled on 15.08 that we
   *  model the rule as it stands («как стало, по идее нам вообще ничего не надо делать здесь»), and a
   *  rule the sport does not have may not be sprung on the player in silence. So the entry that
   *  spends this now WARNS FIRST – see `entryCostsCollege` and `UpcomingEvent.costsCollege`.
   *
   *  ⚠⚠ AND THE HONEST THING TO SAY ABOUT THIS CONSTANT TODAY IS THAT IT HAS ALMOST STOPPED FIRING
   *  BEFORE THE DECISION IT GATES. Re-measured on the P1-P3 ladder (P0's frozen battery, n = 90,
   *  `college-gate-decoupled-2026-08.md` §2): the door is still lost in **83 of 90** careers, but at
   *  **median age 19.1** against P0's 17.3 – and the fork is at **19.0**. So it removes an answer
   *  from the card in **4 careers of 90**; it used to remove it in 83. **The rule did not become
   *  correct, it became LATE**, because P1 moved her first counting W75 from 17.2 to 19.2 rather
   *  than putting it out of reach (she still reaches W75 in 82 of 90 careers).
   *
   *  ⚠ THE SIX WEEKS BETWEEN 19.0 AND 19.2 ARE AN ACCIDENT AND NOTHING HOLDS THEM. Any tuning that
   *  speeds her up by a month shuts this door again in most careers, silently – the two rules no
   *  longer share a constant but they still name the same rung. Whether the gate should stay at all
   *  is a DESIGN question and it is the owner's: that spec's §6.1 states it and deliberately does not
   *  answer it. Leaving it here is the do-nothing option, chosen as such.
   *
   *  ⚠ W75 IS THE OWNER'S OWN MARKER, quoted from the report, and it is a RUNG rather than a sum of
   *  money on purpose. `w15` opens at sixteen and the game actively wants a junior to play a few, so
   *  "has ever entered a professional event" would delete the college ending from almost every
   *  career. A counting result at W75 or above is the line between a junior who has tried the tour
   *  and a professional who is on it.
   *
   *  ⚠ AND MONEY WAS NEVER THE DISCRIMINATOR, EVEN WHEN A MONEY ARM WAS GOING TO SHIP. Measured over
   *  90 careers (`college-fork-2026-08.md` §4c/§5): the weakest third banks **$114,260** by nineteen
   *  against the strongest third's **$155,865**, and the weak band's p75 sits ABOVE the top band's
   *  p25. The populations interleave, so no dollar line through them sorts anybody. That is the
   *  record of why the money arm is not here, and it is not an invitation to try again.
   *
   *  ⚠⚠ AND THIS IS NOT `TIERS.w75.acceptsRank`, WHICH IS THE DEFECT P4 WAS SENT TO FIX. That
   *  constant decides WHO MAY ENTER a W75; this one decides WHERE THE COLLEGE ENDING STOPS EXISTING.
   *  Two unrelated decisions that happened to name the same rung, and for a long time only
   *  `calendar.ts` said so – this file mentioned neither the coupling nor the other constant. **P3
   *  moved `w75.acceptsRank` from 450 to 300 and moved the college door with it, and nothing in the
   *  repo objected.** The gate below no longer reads a single tuning constant off `TIERS`: see
   *  `collegeDoorOpen`, which takes a view and owns its own rule. */
  collegeClosedFromTier: 'w75' as TierId,

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

/** ⭐⭐ WHAT THE COLLEGE RULE READS, AND IT IS THE WHOLE OF WHAT IT READS (P4, 16.08).
 *
 *  ⚠ THIS INTERFACE IS THE COUPLING BREAK. `collegeStillOpen` used to reach into `TIERS[tier].points`
 *  to decide what "a result that counted" meant – so the college door was reading a LADDER TUNING
 *  TABLE, and a wave that re-sized a rung's points moved the college ending without saying so. The
 *  same shape as the defect P3 fired: `w75.acceptsRank` 450 -> 300 moved WHO MAY ENTER a W75 and
 *  therefore WHEN THE COLLEGE ENDING STOPS EXISTING, two unrelated decisions on one constant.
 *
 *  The world layer now resolves the ladder's facts and hands over the three that this rule is about.
 *  Nothing below imports `TIERS`, `TIER_LADDER` or any calendar constant, so no acceptance cut, no
 *  points edit and no re-pinned field size can reach the college door except through
 *  `ENDINGS.collegeClosedFromTier` – which is this rule's own knob and says so. */
export interface CollegeResultView {
  /** the rung's position on the ladder, and the college rung's position on the SAME ladder – so the
   *  comparison is "at or above", exactly as before, without this leaf knowing any rung's name */
  rungIndex: number
  /** her BEST finish there: 0 is the champion, and the largest index is the girl who lost her first
   *  match. `bestFinishByTier`'s own convention, carried across unchanged. */
  finish: number
  /** how many finishing positions that rung's draw has. A STRUCTURAL fact about the draw – how deep
   *  it goes – and deliberately NOT the points paid at each one, which is the tuning table this rule
   *  used to read and no longer does. */
  rounds: number
}

/** ⭐ IS THE SCHOLARSHIP STILL A DOOR SHE CAN WALK THROUGH? The rule itself, as a pure predicate.
 *
 *  ⚠ SHE HAS TO HAVE WON A MATCH THERE (owner, 13.08: «чини дверь по набранному результату, а не по
 *  единице»). The test used to be `points[finish] > 0`, and that is not the line the constant says it
 *  is drawing. THE MEASUREMENT THAT PRODUCED THE RULING (endings bench, 9 presets x 20 seeds): W75
 *  shut the door in 95.2% of closures, and **12 of 25 sampled closures were a FIRST-ROUND LOSS** –
 *  because `w75.points` ends in a trailing 1, the wooden spoon handed to everyone who turns up and
 *  loses. So the door was being shut by exactly the case `collegeClosedFromTier`'s own comment calls
 *  safe: «a junior who has tried the tour».
 *
 *  ⚠⚠ AND DROPPING THE POINTS READ CHANGES NOTHING, WHICH IS WHY IT COULD SHIP AS A DECOUPLING
 *  RATHER THAN AS A BALANCE CHANGE. The old rule was `finish < rounds - 1 && points[finish] > 0`;
 *  the second clause can only bite on an INTERIOR zero – a finishing position that is not the
 *  opening round and still pays nothing – and no rung at or above W75 has one (W75 [75,49,29,16,9,1],
 *  W100 [...,12,0], WTA 125/250/500 all trail 1, WTA 1000 and Slam trail 10). So the clause was dead
 *  on every rung this rule can see. `tests/ending.test.ts` asserts that emptiness against the live
 *  table rather than trusting this paragraph, so the day a rung ships an interior zero the pin says
 *  so instead of the door silently moving. */
export function collegeDoorOpen(results: readonly CollegeResultView[], closedFromIndex: number): boolean {
  return !results.some((r) => {
    if (r.rungIndex < closedFromIndex) return false
    // The last index is the opening round: `bestFinishByTier` holds the smallest (best) index, so
    // `rounds - 1` is the girl who lost her first match and everything below it won at least one.
    return r.finish < r.rounds - 1
  })
}

export function endingForForkAnswer(
  answer: ForkAnswer,
  week: number,
  ageYears: number,
  collegeYears: number = ENDINGS.collegeYears,
  weeksPerYear = 52,
): CareerEnding | null {
  if (answer === 'continue') return null
  if (answer === 'college') {
    return {
      type: 'college',
      week,
      ageYears,
      detail: `${collegeYears} years on a scholarship – no ranking points, and the family stops paying`,
      resumesWeek: week + collegeYears * weeksPerYear,
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
  college:
    'A scholarship, a closed league that pays no ranking points, and four years in which the money finally goes the other way. She comes back at twenty-two with a degree, an unbroken body and no ranking at all.',
  bankruptcy:
    'Week after week below zero, and then a week with no entry fee in it. Nobody chose this one – the arithmetic did.',
  injury:
    'The body had been telling the same story for years. This time it was not a layoff, it was the end of the sentence.',
  natural:
    'She was asked every off-season and for years she said one more. This year she did not.',
  plateau:
    'The rung above stayed where it was and so did she. Her own words for it were the plainest ones – she could not reach the top, so she went.',
}

