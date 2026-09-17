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
// ⚠ RNG: NOTHING HERE DRAWS, on any stream, AND THAT SURVIVED ROUND 45 INTACT. Every one of the six
// is deterministic – a counter, a post-draw predicate over an injury the injury sub-stream has
// already rolled, an age comparison, or a player's answer. So the frozen MAIN capture cannot notice
// this file exists, and a career that goes bankrupt mid-replay keeps drawing identically to one that
// does not.
//
// ⚠⚠ THE TWO DOORS ADDED IN ROUND 45 (`peak`, `fall`) ARE THE FIRST ENDINGS WITH A COIN IN THEM, AND
// THE COIN IS DELIBERATELY NOT HERE. `peakLeavingDue` / `fallLeavingDue` / `leavingDoorDue` answer
// «could she» and nothing else; the draw that answers «does she» lives at the one call site, in
// `world/endings.ts`'s `resolveLeaving`, on a purpose-scoped sub-stream. That is what keeps this
// file testable without a world AND keeps the frozen capture blind to it.
import { schoolIsOver } from './kidLife'
import type { CareerEnding, CareerEndingType, ForkAnswer, RetirementOffer } from '../shared/protocol'
// ⚠ A TYPE-ONLY IMPORT, ERASED AT COMPILE TIME, so the leaf stays a leaf at runtime – the same
// discipline every `import type { WorldState } from '../world'` in `world/*.ts` keeps. `Temperament`
// is a four-value union and nothing here calls into `spirit.ts`; round 45's two doors need the union
// for ONE purpose and it is the only one it may ever be used for here – the WORDS she leaves in
// (`leavingLine`). It reaches no gate; see that function's own note and `peakLeavingDue`'s.
import type { Temperament } from './spirit'

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
   *  the question starts being a real one rather than a rhetorical one.
   *
   *  ⭐⭐ ROUND 31 #10/#13 GAVE EVERY CAREER ITS OWN DECLINE AGE AND THIS NUMBER DELIBERATELY DID NOT
   *  FOLLOW IT. A direct-route career now declines from about 27; it is still first asked about
   *  retiring at 29, and that is a decision rather than an oversight – three reasons, in the order
   *  they decided it:
   *
   *  1. THE ASK IS SOCIAL, NOT PHYSICAL. `lastOfferPeakShare` below is the half that reads her BODY,
   *     and it already does: the winter the question runs out moves with the career, per player, and
   *     always has. What this constant sets is when the sport starts asking – the age at which "how
   *     much longer" becomes a normal thing to be asked, which is a fact about tennis and not about
   *     her legs.
   *  2. THE SENTENCE IS HIS. `RetirementDialog`'s approved lede says «Twenty-nine is when the question
   *     starts being asked, not a countdown to anything» – round 30 #7, signed off by the owner. A
   *     per-career ask-age makes that line false for most careers, and CLAUDE.md invariant 4 puts the
   *     copy out of an agent's reach: moving the number here would have moved his words by proxy.
   *  3. AND THE GAP IS THE STORY. A player whose body went at 27 and who is first asked at 29 has had
   *     two seasons of knowing before anybody offers her the door, which is the shape §9 of the round
   *     is about – she is at 93% and nothing has said so. */
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

  // --- #7/#8 THE TWO SHE DECIDES HERSELF (round 45, the-two-more-doors-2026-09.md) --------------
  /** ⚠⚠ THE RATE IS A DESIGN CONSTRAINT AND NOT A REALISM NOTE, and his own sentence is the reason:
   *  «у обоих не больше 1–2%… это всё-таки событие, которое принудительно заканчивает игру». A door
   *  that ends the career WITHOUT the player choosing it has to be rare enough to read as a story
   *  rather than as the game being taken away.
   *
   *  ⚠⚠ AND HIS 1–2% IS OF **CAREERS**, NEVER OF SEASONS – the two are a decade apart and only the
   *  first is what he said. These two numbers are the per-OFF-SEASON chance among the careers that
   *  are ELIGIBLE at all (at a peak / in a collapse, with the matching temperament), which is a much
   *  smaller population than "all careers". The conversion is the bench's job, not arithmetic's:
   *  `tools/two-doors-bench.ts` reports the career rate, the eligibility rate and the realised rate
   *  separately, precisely so a 0% can be told apart from an unreachable gate – the mistake
   *  `injuryPriorWeeksOut` above records («It is not rare, it is impossible»).
   *
   *  ⭐⭐ 0.02 IS MEASURED AND NOT PICKED, AND THE FIRST GUESS WAS WRONG BY THREE TO FIVE TIMES – 0.12
   *  was predicted to land inside his band and measured at **6.73% / 7.09% of careers**. The sweep
   *  that corrected it is exact rather than a re-run, on `sweepGrace`'s own trick: the eligibility
   *  census does not depend on the chance, so one pass prices every candidate.
   *
   *  ⚠⚠⚠ RE-MEASURED 17.09 AFTER THE UN-PARTITIONING AND HIS 25+ FLOOR, AND **THE FALL DOOR IS NOW
   *  OVER HIS CEILING**. `--spread --seeds 24`, 72 careers over 72 DISTINCT seeds:
   *
   *      chance    peak     fall     both
   *        1%     0.88%    1.12%    2.00%
   *        2%     1.72%    2.23%    3.96%   <- shipped: peak inside his 1-2%, FALL OVER IT
   *        3%     2.55%    3.33%    5.88%
   *       12%     8.95%   12.86%   21.81%
   *
   *  ⚠⚠ THE CONSTANT WAS **NOT** MOVED TO MAKE THE TABLE AGREE, and that is deliberate: «у обоих не
   *  больше 1–2%» is his ruling, so the value that satisfies it is his to pick. What the build owes
   *  is the number and the alternatives, not a quiet correction. `fallLeavingChance: 0.01` prices the
   *  fall at 1.12%; a tighter threshold instead of a smaller coin is the other one-line answer.
   *
   *  ⭐ AND THE CAUSE IS A POPULATION EFFECT, NOT A LOOSER DOOR: not one fall threshold changed, but
   *  deleting `DOOR_BY_TEMPERAMENT` doubled the careers the gate is ever asked about (37.5% -> 76.4%
   *  of all careers). The same door meets twice as many girls. ⚠ The peak took the same doubling and
   *  is inside the band anyway ONLY because of his age floor – without it the peak reads 3.21% and
   *  fires on an eighteen-year-old (the isolation arm, spec §10.4).
   *
   *  ⚠⚠ RUN IT WITH `--spread`, ALWAYS, AND THE REASON IS A TRAP THAT ALREADY CAUGHT THIS WAVE.
   *  `openCareer` seeds on the BACKGROUND and the index and never on the coach tier, so the default
   *  nine presets collapse onto three seed families: a 9 x 8 run walks 72 careers over **24 distinct
   *  seeds**. Both coins and her temperament are seed-derived, so that run's peak read REALISED 0.0%
   *  against EXPECTED 6.7% – a null produced by an effective n of nine distinct `peak` girls, not by
   *  anything in this file. The bench prints its distinct-seed count for exactly this reason.
   *
   *  ⚠ THE PAIR IS NO LONGER EQUAL "ON PURPOSE" AND THE OLD REASON IS GONE WITH THE TABLE. It used
   *  to read «two halves of one partition at two different rates would be a career script», which was
   *  an argument about `DOOR_BY_TEMPERAMENT`; he deleted that on 17.09. They are both 0.02 today
   *  because the sweep puts both inside his band at 0.02 and not because anything couples them, and
   *  no test asserts the equality any more – a pin whose reason has been deleted is a pin that starts
   *  meaning something nobody decided.
   *
   *  ✅ AND HIS SENTENCE'S SECOND READING IS SETTLED (17.09): «у обоих не больше 1–2%» is PER DOOR –
   *  «верно». The combined figure is recorded and is not the constraint.
   *
   *  PREDICTED vs MEASURED lives in docs/specs/the-two-more-doors-2026-09.md §6.5 and §10. */
  peakLeavingChance: 0.02,
  /** ⭐⭐⭐ HIS RULING, 17.09: 0.02 → **0.01**, and the reason is measured rather than tidy. At 0.02
   *  the fall read **2.23%** of careers – outside the 1–2% band he set, and outside it for a
   *  POPULATION reason rather than a loose door: un-partitioning the temperaments (§9's [P1]) took
   *  this door's eligible careers from 37.5% to 76.4%, because it is now open to all four voices
   *  instead of two. No threshold moved and none was tuned; the constant is what changed.
   *
   *  ⚠ The band is not a realism note, it is his design constraint – «это всё-таки событие, которое
   *  принудительно заканчивает игру» – so a door over the ceiling is the game taking itself away more
   *  often than he allowed. At 0.01 the sweep prices it at **1.12%**.
   *
   *  ⭐ He took the lower one on its own merit: «красивая цифра». */
  fallLeavingChance: 0.01,
  /** ⚠ "AT THE TOP" IS A PLACE – §2's own warning about the four named cases. Barty (#1), Henin
   *  (#1), Bartoli (#7 and a Wimbledon title), Dementieva (inside the ten): the rank clause alone
   *  covers all four, and the title clause below only ever ADDS a case it would miss. */
  peakRankBand: 10,
  /** ⭐⭐⭐ HIS RULING, 17.09, AND IT OVERTURNS THIS DOOR'S ORIGINAL "NO AGE" NOTE: «медианный возраст
   *  первой подходящей недели у пика — 21 … это вообще не очень по отношению к игроку, особенно на
   *  супер-талантливом сиде. Я бы сказал 25+.»
   *
   *  ⚠ WHAT §2 ACTUALLY SAID AND WHAT IT DID NOT. «What they share is not an age» was a statement
   *  about the four cases' SPREAD – 25, 25, 28, 28 – and it licensed not inventing a NARROW window
   *  around them. It never licensed taking the career away from a twenty-one-year-old who has just
   *  arrived, which is what the bench then measured the door doing: the median FIRST eligible winter
   *  landed at 21. A floor is not the window §2 refused; it is the bottom of his own four cases.
   *
   *  ⚠ IT IS A FLOOR AND NOT A GATE. It can only ever REFUSE a season the place or the title already
   *  opened, so every other clause in `peakLeavingDue` still says what it says. The cost is measured
   *  and recorded in the spec's §10 rather than argued. */
  peakMinAgeYears: 25,
  /** ⚠ A COLLAPSE IS A **RESULTS** EVENT, NOT A DECLINE EVENT (§1, and it is his correction to his
   *  own worry that the round-44 seats might make a collapse unreachable). The seats soften skill
   *  loss by a couple of points over years; they prevent no injury, no mid-match retirement and no
   *  variance, so a collapse stays exactly as reachable as it was.
   *
   *  ⭐ EVERY THRESHOLD BELOW IS ANCHORED ON HIS OWN WORKED EXAMPLE – the fall from #13 to #59 with
   *  4,008 points expiring against 1,584 replacing them. That career reads share 0.395 (inside 0.50),
   *  factor 4.5x (past 2.0) and 46 places (past 30), so the case the door is FOR passes all three
   *  with room. The three terms are a conjunction for `plateauReading`'s reason: any one of them
   *  alone fires on a career that is merely having a bad year. */
  fallPointsShare: 0.5,
  /** ...and the season she fell FROM has to have been a real one, or "lost most of its points" is a
   *  sentence about a girl who had none. In the paid table's own currency. */
  fallPointsFloor: 200,
  /** the rank has to at least DOUBLE – scale-free, so #13 -> #59 counts and #4 -> #8 does not... */
  fallRankFactor: 2,
  /** ...and it has to be a long way in absolute places too, so a fall at the very top of the table
   *  (#2 -> #5 is a doubling) is a bad season rather than a collapse. */
  fallRankPlaces: 30,

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

/** ⭐⭐⭐ ROUND 39 #14a – THE PLATEAU CARD'S LEDE, AND IT ESCALATES WITH HER OWN ANSWERS.
 *
 *  THE OWNER, 08.09: «„She said it in the car. Three seasons on the professional table and it has
 *  not moved…" – одно и то же опять, давай какую-то вариативность в этих фразах сделаем, какие
 *  варианты?» The card printed ONE sentence for the life of a career: a woman who had already said
 *  «one more year» three times read the paragraph she read the first time, word for word.
 *
 *  `oneMoreYearCount` is the state that can tell those two apart – `lastWordLine` above says why it
 *  is the richest field on this card – and on the plateau reading it is exact: the plateau branch of
 *  `retirementDue` cannot fire past `askFromAgeYears`, so every answer counted here was given to
 *  THIS card. It is incremented by `answerRetirement` AFTER the answer, so while the card is on
 *  screen it reads how many times she has said those words BEFORE this winter.
 *
 *  ⚠ EXPORTED, AND THE COPY LIVES IN THE ENGINE RATHER THAN IN THE TEMPLATE, on `lastWordLine`'s own
 *  precedent (and `RELEASE_LINE_PREFIX`'s before it): a test pins the four bands through the symbol
 *  instead of through a spelling, and the four sentences cannot be four `v-if` arms that no engine
 *  test can read. Nothing is drawn here – see the RNG note at the top of this file – so re-opening
 *  the card cannot change a word of it, which is round 31 #4's defect and not to be re-shipped.
 *
 *  ⚠⚠ EVERY LEDE IS HER DOUBT AND NOT ONE OF THEM IS A FORECAST, AND THAT IS MEASURED RATHER THAN A
 *  MATTER OF TASTE. `tools/r40-retire-trigger.ts`, 108 careers x 900 weeks, on the engine's own
 *  `plateauViewOf`: the card asks on 52 of them, and in 52 of 52 she LATER beat the rank she held
 *  the day it fired – 96.2% of them after the very FIRST ask. Read as a prediction this card is
 *  wrong almost always; read as her doubt it is right every time, because she says she cannot reach
 *  the top, the parent says keep going, and she breaks through. So a lede may say what SHE believes;
 *  it may never say what the world is going to do, because the world does the opposite and the
 *  player watches it happen. A lede that predicts is a defect here, not a style choice.
 *
 *  ⚠⚠ AND NO LEDE MAY ASSERT A NUMBER THE STATE CANNOT KEEP. The drafts said «Four seasons at the
 *  same table» and «three more winters»: each is true at exactly ONE value of `oneMoreYearCount`,
 *  and the 3+ band has no such value – «three» becomes a lie the moment she says yes again. Worse,
 *  neither quantity is on the save at all: the asks need not be consecutive (a rung cleared inside
 *  the window pushes the next reading out by seasons, and `plateauReading` declines on a short
 *  window too), so «how many seasons flat» cannot be recovered from an answer count. What IS exact
 *  is `oneMoreYearCount` itself. Hence the rule these four obey: a count may be SPELLED only where
 *  the band pins its value, and the open band interpolates the real number or says none.
 *
 *  ⚠⚠ BAND 0 IS THE SHIPPED SENTENCE, BYTE-IDENTICAL – it is the owner's copy and invariant 4 puts
 *  it out of reach, its «Three» included (that word is his, not `ENDINGS.plateauSeasons` seen
 *  through a template). It is also the DEFAULT branch rather than an `=== 0` one, deliberately: a
 *  count this function cannot read – a poked save, a NaN – falls back to the words that have always
 *  been there instead of printing something strange into one of the new ones.
 *
 *  ⚠ ALL FOUR STILL LEAVE THE DOOR OPEN, because 14b («she is done» as a state) is NOT built: the
 *  plateau offer draws two answers and either is legal, so a lede that closed the question would
 *  contradict the controls under it. */
export function plateauLede(oneMoreYearCount: number, tableName: string): string {
  // 1 – SHE HAS SAID IT ONCE ALREADY, and the count is spelled as a word because this branch is
  // reachable at exactly one value. «Four seasons at the same table» was the draft here and is the
  // sentence the header refuses: it counts a thing the save does not carry.
  if (oneMoreYearCount === 1) {
    return (
      'She brought it up before the airport this time. She has said one more year once already, and she has ' +
      'stopped pretending the next season is different. She would still play a year for you – she said that too.'
    )
  }
  // 2 – ...AND THIS ONE COUNTS NOTHING AT ALL, WHICH IS ITS ESCALATION: no argument, no question,
  // the two numbers put down in front of the parent and a silence. It carries no count for the same
  // reason it carries no adjectives.
  if (oneMoreYearCount === 2) {
    return (
      'She did not argue and she did not ask. She put the season on the table – where it started, where it ' +
      'ended – and waited. If you want another year, she will give you one more.'
    )
  }
  // 3+ – THE OPEN BAND, AND THE ONLY ONE THAT MAY CARRY A NUMBER, because it is the only one whose
  // value its own band does not pin. The number is `oneMoreYearCount` itself and not a count of
  // seasons or winters, in the engine's existing idiom («She has said one more year 4 times»,
  // `lastWordLine`) so the two surfaces count the same thing in the same words. Always plural: the
  // band starts at three. The table clause is a PRESENT reading and says nothing about the years in
  // between – whether it moved and came back is not on the save either.
  if (oneMoreYearCount >= 3) {
    return (
      `This time she said it looking out of the window. She has said one more year ${oneMoreYearCount} times, ` +
      `and the ${tableName} table has not moved. She will not fight you on one more – but you both know what she wants.`
    )
  }
  // 0 – THE SHIPPED SENTENCE, WORD FOR WORD, and the fallback for every count this function cannot
  // read. See the header.
  return (
    `Three seasons on the ${tableName} table and it has not moved. If she cannot reach the top, she would ` +
    'rather go now – that is how she put it. She will keep playing if you want her to.'
  )
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

// --- #7 and #8: the two she decides herself -----------------------------------------------------

/** ⚠⚠⚠ THERE IS NO `DOOR_BY_TEMPERAMENT` AND THERE MAY NOT BE ONE. IT SHIPPED ON 17.09 AND HE
 *  DELETED IT THE SAME DAY, AND THE DELETION IS WORTH MORE THAN THE TABLE WAS.
 *
 *  What it did: it mapped each voice to exactly one door for life – `fiery`/`quiet` to the fall,
 *  `deep`/`sunny` to the peak – so **a `fiery` world number one could not leave at the peak and a
 *  `deep` player could not leave after a collapse.** His finding: «That is a temperament-driven
 *  career script.»
 *
 *  ⚠ AND THE ARITHMETIC THE TABLE'S OWN DEFENCE GOT WRONG. It argued it was a PARTITION and not a
 *  weight, «two voices each at the same chance, so temperament moves WHICH story a leaving is and
 *  never HOW LIKELY one is». Equal coins are not equal likelihood when the gates are not equally
 *  REACHABLE, and the same build had already measured that they are not: the peak gate opened for
 *  19.4% of careers and the fall's for 40.3%. Two voices were therefore about twice as likely to
 *  leave as the other two, which is the career script arriving through the side the defence was not
 *  looking at.
 *
 *  ⭐ SO §4's SENTENCE IS KEPT AND ITS TABLE IS NOT: «two players in identical careers leave
 *  differently because they are different people» is a claim about HOW she leaves, never about which
 *  exits exist for her. Every girl reaches BOTH doors on identical terms; her voice decides the words
 *  she goes out in (`leavingLine`) and nothing else. `drawForkWant`'s fence – «HER TEMPERAMENT DOES
 *  NOT AND MAY NOT [weight the draw] … otherwise temperament becomes a career script» – needed no
 *  override after all, and now has none anywhere in this file.
 *
 *  ⚠ WHAT A FUTURE WAVE MAY NOT DO: re-key either gate, either chance or either threshold on
 *  `view.temperament`. The field is on the view for the VOICE, and `leavingDoorDue` is where a test
 *  proves neither gate can see it. */

/** What the two doors read, and all they read.
 *
 *  ⭐ EVERY FIGURE IN HERE IS ABOUT ONE TABLE, THE ONE SHE IS CURRENTLY ON – `PlateauView`'s own
 *  doctrine, and for its reason: the two halves of a collapse (points and place) have to be spoken
 *  of the same career or the rule is comparing a junior season with a professional one. The view is
 *  built by `leavingViewOf` (engine/world/endings.ts), which resolves that table once through
 *  `activeLadderOf` and reads every field below against it.
 *
 *  ⚠ THIS LEAF STILL NEVER LEARNS WHICH TABLE IT IS. It learns exactly one bit about it – whether it
 *  is the PAID one – and it must, because #10 on a domestic ladder at fifteen is not a peak and a
 *  junior points collapse is not the story §3 is about. One bit, resolved once, handed down. */
export interface LeavingView {
  /** ⚠ HER BIRTH TEMPERAMENT, AND IT REACHES NO GATE – it is read by `leavingLine` alone, for the
   *  words. Birth rather than `expressedTemperamentOf` for the reason every voice site in this
   *  engine reads birth: expression drifts with `wallsFlipped`, which the psychologist and the shape
   *  of the career move, so an expressed read would make her own sentence a fact about the parent's
   *  management. `world.temperament` is immutable by construction («identity is IMMUTABLE – what
   *  drifts is WALLS AND REGULATION»), so a career hashes the same girl at week 0 and at the door. */
  temperament: Temperament
  /** the season index that just closed */
  seasonIndex: number
  /** ⚠ HER WHOLE YEARS ON THE WRAP WEEK – read by the peak door's floor and by nothing else. It is
   *  `kidAgeYears`, the one clock that is hers (world/age.ts), never the season band. */
  ageYears: number
  /** is the table she is on the PAID one – the only table either door is read on */
  professional: boolean
  /** her season-end rank in that table for the season that just closed, or null when she held no
   *  counting result in it (the `SeasonTrackRow.endRank` contract: absent is not a place) */
  endRank: number | null
  /** ...and the same figure for the season immediately before it */
  prevEndRank: number | null
  /** ranking points earned IN THAT TABLE'S CURRENCY in the season that just closed... */
  points: number
  /** ...and in the season immediately before it */
  prevPoints: number
  /** did she win a title at the top rung of the sport inside the season that just closed */
  topTitleThisSeason: boolean
}

/** ⭐ DID THE **PLACE** OPEN THE PEAK DOOR, as opposed to the title. One spelling, two readers, and
 *  that is the whole reason it exists: `peakLeavingDue` asks it to decide whether the door opens, and
 *  `endingForLeaving` asks it to decide which fact the record names.
 *
 *  ⚠⚠ THE SECOND READER IS A DEFECT REPAIR AND NOT A TIDY-UP (his 17.09, [P1]). The renderer used to
 *  prefer the rank whenever it was non-null, while the gate could open on a title ALONE – so a
 *  champion who finished #15 latched a valid `peak` ending and then read «She left at the top – she
 *  was #15 the week she said it», which is the record contradicting itself in one sentence. **The
 *  detail must mirror WHICH CLAUSE opened the door**, never which field happens to be populated, and
 *  two callers of one predicate is what makes that structural instead of remembered. */
export function peakRankClauseOpened(view: LeavingView, band: number = ENDINGS.peakRankBand): boolean {
  return view.endRank !== null && view.endRank <= band
}

/** #7 – SHE LEAVES AT THE PEAK. «She is AT the top when she goes, and the decision is HERS.»
 *
 *  ⚠ IT READS NO TEMPERAMENT. The shipped build gated this on `DOOR_BY_TEMPERAMENT` and he deleted
 *  that table the same day; the note where it stood says why at length.
 *
 *  ⭐⭐ THE AGE FLOOR IS HIS (`ENDINGS.peakMinAgeYears`, 17.09), AND IT IS THE ONE CLAUSE HERE THAT
 *  WAS ADDED AGAINST THE ORIGINAL DESIGN'S OWN INSTRUCTION. §2 said «what they share is not an age»
 *  and the build took it literally; the bench then measured the median FIRST eligible winter at 21,
 *  and his answer was «это вообще не очень по отношению к игроку … я бы сказал 25+». His four named
 *  cases are 25, 25, 28 and 28, so the floor is the bottom of the evidence rather than a fifth fact
 *  invented on top of it.
 *
 *  ⚠ THE FLOOR SITS ABOVE THE TITLE CLAUSE ON PURPOSE. A twenty-one-year-old who just won the
 *  biggest tournament there is has *more* career in front of her, not less, so the clause that is
 *  meant to widen the door may not be the clause that steps around the floor.
 *
 *  ⚠ THE TITLE CLAUSE ONLY EVER ADDS. All four named cases pass on rank alone; this is the girl who
 *  won the biggest tournament there is and finished the year at #15, which is a peak by any reading
 *  the sport would accept and one the rank clause would miss. */
export function peakLeavingDue(view: LeavingView, band: number = ENDINGS.peakRankBand): boolean {
  if (!view.professional) return false
  if (view.ageYears < ENDINGS.peakMinAgeYears) return false
  if (view.topTitleThisSeason) return true
  return peakRankClauseOpened(view, band)
}

/** #8 – SHE LEAVES AFTER THE FALL. The story `plateauReading` above refuses to tell and defers to in
 *  its own comment: «"No improvement" alone would fire on a career that is FALLING APART – which is
 *  a different story and one the natural end should not be telling.» The plateau was right to refuse
 *  it; this is the story it was deferring to.
 *
 *  THREE TERMS, ALL THREE LOAD-BEARING, and they are a conjunction for `plateauReading`'s reason –
 *  any one of them alone fires on a career that is merely having a bad year:
 *    1. THE SEASON SHE FELL FROM WAS REAL. Below `fallPointsFloor` there is nothing to lose.
 *    2. MOST OF THE POINTS WENT. At most `fallPointsShare` of last season's, in the same currency.
 *    3. AND THE PLACE WENT WITH THEM – at least doubled AND at least `fallRankPlaces` places, so
 *       neither a fall at the very top (#2 -> #5 doubles) nor churn at the bottom (#300 -> #340 is
 *       forty places) can pass on its own.
 *
 *  ⚠ IT IS NOT CERTAINTY AND MAY NEVER BECOME ONE – his own «абсолютное большинство выступают до тех
 *  пор, пока позволяют здоровье, мотивация». Most players who fall keep playing; the draw at the
 *  call site is what says so. This predicate answers «could she», never «does she».
 *
 *  ⚠ A SEASON WITH NO FIGURE ON HER TABLE IS NOT COMPARABLE, SO IT IS NOT COMPARED – the same
 *  decline-to-fire `plateauReading`'s two guards make. `prevEndRank === null` means she held no
 *  counting result in that table last season, and a fall has to be FROM somewhere.
 *
 *  ⚠ IT READS NO TEMPERAMENT EITHER – see the note where `DOOR_BY_TEMPERAMENT` stood.
 *
 *  ⚠ AND NO AGE FLOOR, WHICH IS AN ASYMMETRY ON PURPOSE RATHER THAN AN OMISSION. His 17.09 ruling
 *  was about the peak and its reason does not transfer: a floor there stops the game taking a career
 *  away from a girl who has only just arrived AT THE TOP. The fall's own three terms already require
 *  a real season to have fallen FROM (`fallPointsFloor` in the paid table's currency, a place that at
 *  least doubled and moved thirty), which a career cannot have built in its first professional year.
 *  If he wants one here it is one line; the build will not invent it. */
export function fallLeavingDue(view: LeavingView): boolean {
  if (!view.professional) return false
  if (view.endRank === null || view.prevEndRank === null) return false
  if (view.prevPoints < ENDINGS.fallPointsFloor) return false
  if (view.points > ENDINGS.fallPointsShare * view.prevPoints) return false
  if (view.endRank < view.prevEndRank * ENDINGS.fallRankFactor) return false
  return view.endRank - view.prevEndRank >= ENDINGS.fallRankPlaces
}

/** Which door, if any, this season could open for this girl. Null on every season that is neither.
 *
 *  ⚠⚠ THE ORDERING IS LOAD-BEARING NOW, AND IT WAS NOT BEFORE. While `DOOR_BY_TEMPERAMENT` stood,
 *  each girl was asked exactly one of the two and the order was a reader's convenience. With both
 *  doors open to every voice the two gates can – just – answer on the same season: a girl who wins
 *  the biggest title there is and still loses most of her points and thirty-odd places passes the
 *  peak's TITLE clause and all three of the fall's terms. (The peak's RANK clause cannot collide:
 *  `endRank <= 10` and `endRank - prevEndRank >= 30` together would need a place above zero.)
 *
 *  ⭐ PEAK WINS THAT SEASON, DELIBERATELY: a year that ended with the top title in the sport is not a
 *  year she left after a collapse, whatever the points column did. `tests/two-doors.test.ts` pins the
 *  collision rather than leaving it to this function's line order.
 *
 *  ZERO DRAWS – the draw is the caller's, on its own purpose-scoped sub-stream. */
export function leavingDoorDue(view: LeavingView): 'peak' | 'fall' | null {
  if (peakLeavingDue(view)) return 'peak'
  if (fallLeavingDue(view)) return 'fall'
  return null
}

/** ⭐⭐⭐ HER OWN WORDS FOR IT – **EIGHT** EXITS, FOUR VOICES ACROSS TWO DOORS, and the count is the
 *  whole shape of his 17.09 correction. §4 wrote four, one per voice, because each voice owned one
 *  door; with `DOOR_BY_TEMPERAMENT` deleted every voice reaches both, so a `fiery` girl at the top
 *  and a `deep` girl after a collapse each need words that are hers AND about the door she went out
 *  of. Four lines across two doors would have put the collapse's sentence in a champion's mouth.
 *
 *  ⚠⚠ ALL EIGHT ARE **DRAFTS** UNTIL HE HAS READ THEM – CLAUDE.md invariant 4, and the round's brief
 *  says so in capitals. They are collected for his review in
 *  `docs/specs/the-two-doors-corpus-2026-09.md`, which is the one document to read them in. He may
 *  rewrite any of them without asking and without a test going red; that is the design of the pins
 *  below, not an accident of them.
 *
 *  ⚠⚠ WHAT NONE OF THEM MAY SAY, and it is `lastWordLine`'s rule and the small-talk corpus's rule
 *  arriving at the same place: **a line may not assert more than its situation licenses, and a
 *  leaving may not blame a body, a load or a decision.** No tiredness (she opens her last seasons
 *  BETTER – measured, see `LAST_WORD_OPENING`), no schedule, no coach, no money, and nothing the
 *  parent did.
 *
 *  ⚠⚠ AND THE SHARPER HALF OF THAT RULE, WHICH IS WHAT HE CAUGHT THE FIRST DRAFTS ON: **this
 *  function receives two things – the door and the voice – so a line may assert nothing else.** The
 *  shipped four claimed that the parent «finally asked», that she had decided «a long time before»,
 *  and that she said it «on a good day»: three facts about a conversation and a week that no
 *  parameter here carries. The repair is the one he named – **her own reported account, or nothing**.
 *  Every line below is «She said …», which is a claim about what she said and is therefore always
 *  licensed, or it is about the door itself, which is a parameter.
 *
 *  ⚠ THE FALL'S LINES MAY NOT NAME NEXT SEASON'S ENTRIES. The `quiet` draft leaned on «she did not
 *  enter anything for next season» as a literal description, and he found it is not an observable
 *  one: the career LATCHES on the wrap week, so the player never reaches an entry window to notice
 *  her absent from it. An event the engine never lets anybody see is not a fact a line may lean on.
 *
 *  ⚠ AND NONE OF THEM GRADES HER (§6: «The game never tells you that you failed. It tells you what
 *  happened.»). Four of the eight are the hard door and none consoles the player about it – a line
 *  that reassures is a line that has quietly decided the ending was the wrong one.
 *
 *  ⚠ BIRTH TEMPERAMENT, exactly like every other voice site in this engine – «the voice bibles read
 *  birth alone» (who-she-is §3). Nothing drawn, nothing stored: the same career prints the same
 *  sentence every time this is called, so re-opening a screen cannot change a word of it (round 31
 *  #4's defect, not to be re-shipped). */
export function leavingLine(door: 'peak' | 'fall', temperament: Temperament): string {
  if (door === 'peak') {
    switch (temperament) {
      // FIERY at the top. «Хлопнула дверью» in its other key: the same refusal to negotiate, on a
      // good year instead of a bad one. ⚠ SHORT ON PURPOSE – [P3], his 17.09: the door-slamming voice
      // had been given 27 words in two sentences, which is not a door slamming.
      case 'fiery':
        return 'She said she was stopping at the top, and that was the whole conversation.'
      // QUIET at the top. No announcement, and the understatement is the voice: the biggest news of
      // her life delivered as if it were already common knowledge.
      case 'quiet':
        return 'She said she was stopping here, while it was still good, and she did not make a thing of it.'
      // DEEP at the top. Barty's shape – settled before it was said. ⚠ REPORTED, NOT ASSERTED: «she
      // said she had known for a while» is a claim about her claim, which is the one kind of thing
      // this function is always licensed to make. The first draft stated it as fact and he cut it.
      case 'deep':
        return 'She said she had known for a while, and that she waited until the season was over so it would be finished and not just decided.'
      // SUNNY at the top. The only leaving in the game that is not a loss, and the hardest to write:
      // warm about HER without congratulating the player. ⚠ IT NO LONGER SAYS «she is not leaving
      // tennis» – his finding, and he is plainly right: the engine ends her tennis career in that
      // exact week, so the line was contradicting the event it was printed for.
      case 'sunny':
        return 'She said she was going to go and have the rest of her life, and she sounded like someone with plans.'
    }
  }
  switch (temperament) {
    // FIERY after the fall. She will not be seen losing it back. One sentence, and no second one.
    case 'fiery':
      return 'She said she was not going to be watched losing it back, and she said it once.'
    // QUIET after the fall. «Не выдержала», without a scene – and without the two things the first
    // draft borrowed to build the scene: the parent asking, and next season's entry list.
    case 'quiet':
      return 'She said she was stopping, and she said it as if it were something you already knew.'
    // DEEP after the fall. She turns things over; the season did not decide it for her, it agreed
    // with her. Hers throughout, and it names nothing the season did not do.
    case 'deep':
      return 'She said she had been turning it over all season, and that the season had only told her what she already thought.'
    // SUNNY after the fall. Warm on the hard door, which is the hardest of the eight: glad about what
    // she did, and unwilling to spend a year on getting it back. It grades nothing and consoles nobody.
    case 'sunny':
      return 'She said she was glad she had done it, and that she did not want to spend the next year getting it back.'
  }
}

/** The ending itself, composed at the door. `detail` is a FRAGMENT by the house contract that
 *  `latchEnding` composes («`${ENDING_TITLE[type]} – ${detail}.`»): no capital opening it, no full
 *  stop of its own, no long dash.
 *
 *  ⚠ THE FACTS IN IT ARE THE ONES THE PLAYER JUST WATCHED and no others. The peak names where she
 *  was standing; the fall names the two places, which is his own worked example's shape («#13 to
 *  #59») and the plainest true sentence there is about a collapse. Neither says why.
 *
 *  ⚠⚠ AND THE PEAK'S DETAIL MIRRORS **WHICH CLAUSE OPENED THE DOOR**, WHICH IS A DEFECT REPAIR
 *  (his 17.09, [P1]). It used to prefer the rank whenever it was non-null, while the gate opens on a
 *  title ALONE – so a champion who finished the year at #15 latched a perfectly valid ending and
 *  then read «She left at the top – she was #15 the week she said it», a record that contradicts
 *  itself in one sentence. `peakRankClauseOpened` is now the single predicate both the gate and this
 *  line ask, so the two cannot drift apart again by anybody forgetting. */
export function endingForLeaving(
  door: 'peak' | 'fall',
  view: LeavingView,
  week: number,
  ageYears: number,
): CareerEnding {
  if (door === 'peak') {
    const detail = peakRankClauseOpened(view)
      ? `she was #${view.endRank} the week she said it`
      : 'a title at the top of the sport, and she went the same season'
    return { type: 'peak', week, ageYears, detail, resumesWeek: null }
  }
  // ⚠ BOTH PLACES ARE NON-NULL HERE BY `fallLeavingDue`'s OWN GUARD, and the `??` is the defensive
  // read every hand-built probe view in this repo gets rather than a case play can reach.
  return {
    type: 'fall',
    week,
    ageYears,
    detail: `#${view.prevEndRank ?? 0} to #${view.endRank ?? 0} in one season`,
    resumesWeek: null,
  }
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
  // ⚠ ROUND 45, AND BOTH OF THESE ARE DRAFTS (invariant 4) – see
  // docs/specs/the-two-doors-corpus-2026-09.md, which is where he reads them.
  // ⚠ THE PEAK ONE MAY NOT CONGRATULATE. «None of these may console» is the rule on the record
  // above, and its mirror is just as binding on the one ending that looks like a win: a blurb that
  // cheers is the game grading her, which §6 forbids in both directions.
  peak:
    'She was at the top of the sport the season she stopped. Nobody put the question to her and nobody had to – it was decided before anybody else heard about it.',
  // ⚠ AND THE FALL ONE MAY NOT CONSOLE, which is the harder half of the same rule. It states what
  // the season did and what she did about it, and it offers the player nothing to feel better with.
  // ⚠⚠ TWO CLAIMS CUT ON HIS 17.09 REVIEW AND NEITHER WAS A MATTER OF TASTE. (1) It said «the years
  // in front of it», which OVERSTATES the gate by a decade: `fallLeavingDue` compares the closing
  // season with the ONE before it and asks only `fallPointsFloor` prior points, so a two-season
  // career can pass it and the blurb would then be describing years that never happened. (2) It said
  // «She did not enter the next one», the same unobservable event the `quiet` exit leaned on – the
  // career latches on the wrap week, before next season is playable, so nobody can ever see it.
  fall:
    'One season took most of what the season before it had built. Nobody asked her to stop and nobody talked her out of it.',
}

export const ENDING_TITLE: Record<CareerEndingType, string> = {
  stopped: 'She stopped after school',
  college: 'She went to college',
  bankruptcy: 'The money ran out',
  injury: 'The body stopped first',
  natural: 'She played until she was done',
  plateau: 'She had gone as far as she was going',
  // ⚠ ROUND 45 – DRAFTS, both of them, and both are flat statements of what happened in the idiom
  // the six above already keep: no adjective, no verdict, no consolation.
  peak: 'She left at the top',
  fall: 'She stopped after the fall',
}
