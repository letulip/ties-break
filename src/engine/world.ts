// THE LAYERING, stated once (fix/world-trio item 2). `src/shared/dates.ts` is deliberately
// engine-free – it imports nothing and knows only the fixed epoch – so the dependency runs one way,
// engine -> shared, exactly as it already does for `../shared/protocol` and `../shared/format`.
// This import is therefore the seam, not a violation of one: there is no need for (and must be no)
// second week formatter living inside the engine. The engine keeps counting ABSOLUTE weeks and
// every RNG sub-stream key / save field / pinned capture stays on that index; `weekLabel` is
// applied only where the engine writes a string a PLAYER reads.
// The emotion RULES live in shared/ (pure, UI-free, and the composable reads the same module), so
// the engine borrows the two facts it needs rather than restating them: which recorded matches are
// allowed to move her face (R11-2's one predicate) and the band a streak's anger threshold sits in.
// Type-only on the way back (shared/avatarEmotion imports `type TierId` from engine/season/types),
// so this is a leaf dependency, not a cycle.
// v54 (round-23 #18): the one string the engine writes about her own account. `shared/money.ts` is
// the ONE cents-to-dollars implementation in the app and `weekLabel` above records why the engine is
// allowed to reach into shared/ for a player-facing string.
// THE FIELD TIER (living-field phase W, 01.08). Field pros are DERIVED, NEVER PERSISTED – see
// season/fieldPros.ts for the whole argument. world.ts only ever asks three questions of them:
// the merged W ranking, the W-event candidate universe, and a name for an fp- id on a surface.
// Since W3-FIELD3 the second of those is asked by the CANONICAL brackets as well as by her shadow
// run, and `isFieldProId` earns a fourth job: it is the one predicate that keeps a derived player
// out of the persisted ledger (`runAiTournament`).
// Diary-1: the copy system (facts → licensed phrase, sub-stream selection) and the milestone
// identity rule. diary.ts is deliberately world-free (it takes a narrow structural view), so the
// dependency runs one way: world → diary, exactly like world → condition.
// Screen C's three derived tiles (Personality / School / Friends). Same shape of dependency as the
// diary and the radar: kidLife.ts is world-free and takes a narrow structural view, one way only.
// The skills radar (docs/specs/skills-radar.md, decisions.md #11). Same shape of dependency as the
// diary: radar.ts is world-free and takes a narrow structural view, so world → radar runs one way.
// W4 – THE KNOCK: the ordinary training week's one event and the decision it puts in front of the
// parent. Same dependency shape as the diary, kidLife and the radar: knock.ts is world-free and
// takes a narrow structural view, so world -> knock runs one way and can never cycle. ⚠ Nothing in
// THIS file reads it any more: the rest week's credit went to world/phaseHerWeek.ts and the growth
// factor to world/phaseGrowth.ts with the steps that read them (R2-10 step 2).
// W6c: the anatomy, in a leaf module so diary.ts can read the same twelve parts this draws from.
// THE INBOX (v32, docs/specs/offers-and-the-inbox.md). Same dependency shape as the knock and the
// diary: offers.ts is world-free and takes plain arguments, so world -> offers runs one way. Its
// only randomness is its own `seed:offer:<week>` sub-stream, so nothing it does can reach the MAIN
// weekly stream the frozen capture (41550 / e6b0c709) measures. ⚠ Nothing in THIS file reads it any
// more either: the window review went to world/phaseObligations.ts and the letters' own prune to
// world/bookkeeping.ts, with the steps that call them (R2-10 step 2).
// The load slice (docs/specs/coach-as-load-manager.md): pure, world-free, world -> coachLoad only.
//
// ⚠⚠ A-P3-3 (26.09 lane A, applied 28.09 with T6.5): «WORLD-FREE» IS FALSE OF THREE OF THE SIX
// CLAIMS ABOVE, AND THE RULE THEY WERE REACHING FOR IS «ACYCLIC». Measured on this tree, not
// remembered: `offers.ts:86` imports `world/ledger`, `kidLife.ts:37` imports `world/age` and
// `diary/weekNotes.ts:14` imports `world/birthdayGift` – every one of them at RUNTIME, so for those
// three the dependency does not run one way. `radar.ts`, `knock.ts` and `coachLoad.ts` still take
// nothing from the package at all. The lane counted 16 such edges from 10 engine-root / diary modules
// into `world/*` (C3), which makes a leaf reading one PART of the package the norm here rather than a
// defect – and the property that actually holds is not a promise in a comment but a test,
// `tests/import-cycles.test.ts`. What a leaf may never do is import `world.ts` itself, the barrel,
// and that is the edge the package's own type-only rule protects (see `world/tick.ts`'s banner).
import { seasonIndexOf, seasonStartWeek, financeWindow, financeSeries } from './world/ledger'
import { activeLadderOf, toSnapshot } from './world/snapshot'
export { activeLadderOf, toSnapshot }
import {
  flipScore,
  computeLossStreak,
} from './world/matchNews'
export { flipScore, computeLossStreak }
import { pendingKnock, knockRunning, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek } from './world/knock'
export { pendingKnock, knockRunning, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek }
// ⭐ R2-13 phase 1: the advance's entry gate and the span report, in a leaf module the shell can
// import without pulling the integration core in. Re-exported under `engine/world` like every other
// extraction, so the 280-file public API is unchanged.
import { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, openQuestions, spanDigest, spanRowCount, spanWeeksFor } from './world/multiWeek'
export { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, openQuestions, spanDigest, spanRowCount, spanWeeksFor }
// ⭐⭐ ROUND 29 #3 – the shoot that lands on a tournament week, and the four answers to it. Extracted
// to `world/shootClash.ts` (a leaf) and re-exported here under the historical barrel, exactly as
// every other decomposed concern is.
import { answerShootClash, shootCancelCents, shootClashOpen, shootClashWeek, shootMoveTarget } from './world/shootClash'
export { answerShootClash, shootCancelCents, shootClashOpen, shootClashWeek, shootMoveTarget }
// ⭐⭐ ROUND 26 #1 (second pass): WHEN the span is offered, which is the owner's rule and not the
// engine's refusal – see `world/multiWeek.ts` for why the two are deliberately separate gates.
import { QUIET_WINDOW_WEEKS, LONG_LAYOFF_WEEKS, calendarClearAhead, eventIsHers, longLayoff, spanWorthOffering } from './world/multiWeek'
export { QUIET_WINDOW_WEEKS, LONG_LAYOFF_WEEKS, calendarClearAhead, eventIsHers, longLayoff, spanWorthOffering }
export type { SpanWeek } from './world/multiWeek'
import { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution, practiceMatchId, isPracticeMatchEvent } from './world/planner'
// ⭐ F-07 (26.09) – `practiceMatchId` and `isPracticeMatchEvent` join the barrel because their
// readers are SCREENS: `App.vue` and `SeasonScreen.vue` ask "is this the week's practice friendly"
// and must ask the engine's own predicate rather than spell `e.friendly` a third and fourth time.
export { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution, practiceMatchId, isPracticeMatchEvent }
export type { PracticeCaution } from './world/planner'
import { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRetainerBandOf, coachRoomNote, eliteGateStandingOf, supportPayrollWeeklyCents, coachMarketLabourCents, coachProgressScore, coachRateCents, coachRaiseDue, resolveCoachRaise, settleCoachDeal, COACH_EDGE_REVEAL_WEEKS } from './world/coachMarket'
// ⭐⭐ ROUND 42 #42 – `supportPayrollWeeklyCents` joins the barrel: it is read by `coachMarket`'s own
// affordability arithmetic and by `householdWeekly`, and the bench that priced the cap
// (`tools/r42-team-budget-cap.ts`) asks it the same question the screens do rather than summing two
// salaries a third time.
// ⭐⭐⭐ v82, ROUND 42 #51 – the seven halves of the agreed fee join the barrel. Every one of them is
// read from outside this module (the bench, the pins, `world/form.ts`'s weekly bank and
// `phaseHerWeek`'s anniversary), and the barrel's own rule is that the public API is what the rest of
// the repo imports rather than what world.ts happens to use.
export { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRetainerBandOf, coachRoomNote, eliteGateStandingOf, supportPayrollWeeklyCents, coachMarketLabourCents, coachProgressScore, coachRateCents, coachRaiseDue, resolveCoachRaise, settleCoachDeal, COACH_EDGE_REVEAL_WEEKS }
// W3-KIT: the till and the shop window. ⚠ `GEAR_CATEGORY_LINE` came back from equipment.ts to this
// file until R2-10 step 2; it left with `resolveGear`, its only reader here, and is imported by
// world/phaseFinance.ts now. See the note at `resolveGear` for why it was priced below world.ts.
import { setKitGrade, kitLineViews, kitStateOf, kitPurchaseSplit, goodWeeksFor, recordGearRestWeek, GEAR_REST_WINDOW } from './world/kit'
export { setKitGrade, kitLineViews, kitStateOf, kitPurchaseSplit, goodWeeksFor, recordGearRestWeek, GEAR_REST_WINDOW }
// W3-SUMMER: the holidays as a real training block - one predicate, both halves.
import { summerBlockWeek, summerLoadFactor, summerConditionCost } from './world/summer'
export { summerBlockWeek, summerLoadFactor, summerConditionCost }
import { startingSkills, kidMatchPlayer, kidMatchPlayerFor, comebackMatchFactor } from './world/player'
export { startingSkills, kidMatchPlayer, kidMatchPlayerFor, comebackMatchFactor }
import { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury } from './world/injury'
export { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury }
// ⭐⭐⭐ v80, WAVE F1 + F2 – her form and the third seat. Both modules import `WorldState` as a
// TYPE-ONLY import, so the values come back here and are re-exported under their own names exactly
// as every other extracted concern is.
import { coachFormNote, formMatchlessWeeks } from './world/form'
export { coachFormNote, formMatchlessWeeks }
import { hireSparring, resolveSparring, setSparringRung, setSparringTravels, sparringRungOf, sparringRustCut, sparringStoodDown, sparringUnlocked, sparringWeeklyCents, sparringWorksThisWeek, SPARRING_CHANGE_KEY, SPARRING_LOCKED_DETAIL, SPARRING_RECEIPT } from './world/sparring'
export { hireSparring, resolveSparring, setSparringRung, setSparringTravels, sparringRungOf, sparringRustCut, sparringStoodDown, sparringUnlocked, sparringWeeklyCents, sparringWorksThisWeek, SPARRING_CHANGE_KEY, SPARRING_LOCKED_DETAIL, SPARRING_RECEIPT }
import { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurWorksInWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurSessionCents, masseurWeeksServed, masseurWeeksServedAt, masseurYearsServed, masseurRaiseDue, resolveMasseurRaise, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS } from './world/masseur'
export { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurWorksInWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurSessionCents, masseurWeeksServed, masseurWeeksServedAt, masseurYearsServed, masseurRaiseDue, resolveMasseurRaise, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS }
// ⭐ v76, the psychologist's year (wave 5 T2): THE SECOND SALARIED SEAT, on the line above's own
// pattern – the import list and the re-export list carry the SAME names, because hundreds of files
// import from `engine/world` and that public API is what a leaf's move must not change. Shorter than
// the masseur's by exactly what ruling Б removed: no fare, no travel stance, no tour relief, no
// per-match week, no room note yet (the note is a FOCUS's receipt and arrives with T4's focus).
// ⭐ v76 T3 – THE YEAR-FOCUS joins the same two lines: the command, the three read-only derivations
// the card is built on (`psychologistFocusRefusal` is the one story both the throw and the row are
// written from) and the string catalogue. Nothing else about the barrel moves.
// ⭐ T3b adds ONE more, and it is arithmetic rather than a derivation the card reads:
// `psychologistFocusSeasonFor` is the season a pick made in a given week is FOR (ruling I), written
// once and read by the stamp and the guard alike – exported so the pins can ask the engine what the
// rule is instead of re-deriving it beside the engine and drifting from it.
import { hirePsychologist, psychologistUnlocked, psychologistWorksThisWeek, psychologistWorksInWeek, psychologistRungOf, psychologistWeeklyCents, resolvePsychologist, setPsychologistRung, setPsychologistFocus, psychologistFocusRefusal, psychologistFocusOpen, psychologistFocusDetailOf, psychologistFocusSeasonFor, PSY_FOCUSES, PSY_FOCUS_LABEL, PSY_FOCUS_LINE, PSYCHOLOGIST_CHANGE_KEY, PSYCHOLOGIST_LOCKED_DETAIL, PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL, PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL, PSYCHOLOGIST_FOCUS_SEASON_REFUSAL, PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL, PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL } from './world/psychologist'
export { hirePsychologist, psychologistUnlocked, psychologistWorksThisWeek, psychologistWorksInWeek, psychologistRungOf, psychologistWeeklyCents, resolvePsychologist, setPsychologistRung, setPsychologistFocus, psychologistFocusRefusal, psychologistFocusOpen, psychologistFocusDetailOf, psychologistFocusSeasonFor, PSY_FOCUSES, PSY_FOCUS_LABEL, PSY_FOCUS_LINE, PSYCHOLOGIST_CHANGE_KEY, PSYCHOLOGIST_LOCKED_DETAIL, PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL, PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL, PSYCHOLOGIST_FOCUS_SEASON_REFUSAL, PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL, PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL }
import { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX } from './world/entries'
export { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX }
import { KNOCK_HISTORY_MAX } from './world/knockHistory'
export { KNOCK_HISTORY_MAX }
import { captureBreakEven, maybeFireSeasonWrapUp, emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger } from './world/milestones'
export { emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger, captureBreakEven, maybeFireSeasonWrapUp }
// ⭐⭐⭐ ROUND 44 #7 – the four salaried seats' year-end post, raised one line under the wrap-up in
// `world/phaseAiWeek.ts`. Re-exported under its own name on the barrel's standing rule: the import
// list and the re-export list carry the SAME names, so a caller never learns which module owns one.
import { settleStaffLetters } from './world/staffLetters'
export { settleStaffLetters }
// W2-ENDINGS: the six endings' world-side wiring. Re-exported under these names so the worker, the
// snapshot, the tests and the bench all read the one implementation - the same contract every other
// extracted module here keeps.
import {
  answerFork,
  answerRetirement,
  buildEndingView,
  // ⭐⭐ v73: the fork will not be answered while her opinion of it stands unanswered – the other
  // half of `'life'`'s slot in STOP_PRECEDENCE, off the barrel so a test pins the rule and not a
  // spelling. ⚠ `raiseForkOpinion` rode beside it here until A-03 / T6.6 froze the barrel (28.09):
  // it had no reader through this file, and `world/endings.ts` is where its readers import it from.
  FORK_UNHEARD_REFUSAL,
  guardNotEnded,
  latchEnding,
  lastRungSeasonIndexOf,
  // ⭐ THE LONG GOODBYE STEP 4 – the refusal behind a `retire: false` aimed at an offer that was
  // never a question. Off the barrel for the same reason `CAREER_ENDED_REFUSAL` is: player-facing
  // copy on the worker's error channel, pinned by symbol so a re-wording cannot break a test in
  // silence.
  LAST_OFFER_NOT_A_QUESTION,
  plateauViewOf,
  autoEndingViewOf,
  // ⭐ ROUND 45 – the two doors she decides herself. On the barrel for the reason `plateauViewOf` is:
  // the bench and the tests must read the SHIPPED view and the SHIPPED step, never a second copy of
  // either (`tools/two-doors-bench.ts`, and `weeksLostSoFar`'s own precedent in endings-bench).
  leavingViewOf,
  resolveLeaving,
  wonTopTitleInSeason,
  resolveCollegeDeparture,
  resolveEndings,
  // ⭐⭐ v85 T5 – her decision after a child, and the ninth ending. On the barrel for `resolveLeaving`'s
  // own reason: T9's bench and the suites must read the SHIPPED step, never a second copy of it.
  resolveReturnDecision,
  wasThereAChild,
  // ⭐⭐ v86 – the dynasty's block and the two helpers that own the ancestry format. On the barrel
  // for `resolveReturnDecision`'s own reason: the bench, the suites and `createWorld` must all read
  // the SHIPPED builder, never a second copy of it.
  dynastyHandoverOf,
  dynastyBackgroundOf,
  childSeedFor,
  ancestorSeedOf,
} from './world/endings'
// ⭐ P5 – WHAT IS BEHIND THE DOOR (docs/specs/college-as-a-second-act-2026-08.md). `inCollege` moved
// out of `world/endings.ts` into this module and is re-exported below under its historical name, so
// every existing `from '...engine/world'` call site and test import is untouched. The move was
// forced by a dependency, not by tidiness: the ending VIEW now carries the college progress, so
// endings.ts imports college.ts, and college.ts needed the predicate.
export {
  // ⚠ RENAMED, NOT DROPPED (round 21 #5): `COLLEGE_MATCH_SEASON` was a thirteen-week block and the
  // college years are the SHORTCUT, so it is two trips a year now. Nothing outside `world/college.ts`
  // ever read it – it shipped on 17.08 and this is the same day – so the rename breaks no call site.
  COLLEGE_TRIP_WEEKS,
  // ⭐⭐ THE COLLEGE WAVE: the played rubbers and the predicate that stops them passing in silence.
  callUpRubberId,
  callUpRubbersOf,
  // ⭐⭐⭐ ROUND 27 #6 – THE TIE'S REVEAL, and the letter that arrives the week before it. Six names,
  // the same six shapes the championship's reveal exports two blocks down – deliberately, because it
  // is the same KIND of thing arriving on a different week.
  callUpFor,
  callUpLetterWeek,
  nextCallUpWeekAfter,
  callUpRevealMatches,
  callUpRevealOpen,
  collegeEpilogueLine,
  // ⭐⭐⭐ ROUND 24 – THE STUDENT CHAMPIONSHIP: the one tournament a college year is guaranteed, and
  // the predicate that keeps its week from passing in silence. Same six names, same shape, as the
  // call-up above it – deliberately, because they are the same KIND of thing.
  collegeLeagueMatchId,
  collegeLeagueMatchesOf,
  // ⭐⭐⭐ ROUND 26 #6 – THE REVEAL. The predicate, its matches, and the three commands the
  // tour's own reveal trio dispatches into (see `revealTournamentRound` below).
  collegeLeagueRevealMatches,
  collegeLeagueRevealOpen,
  collegeLeagueWeek,
  collegePausedShareYears,
  inCollege,
  lastLeagueRun,
  measureCollegeOffer,
  resolveCollegeBill,
  skillMeanOf,
} from './world/college'
export {
  answerFork,
  answerRetirement,
  buildEndingView,
  FORK_UNHEARD_REFUSAL,
  guardNotEnded,
  latchEnding,
  lastRungSeasonIndexOf,
  LAST_OFFER_NOT_A_QUESTION,
  plateauViewOf,
  autoEndingViewOf,
  leavingViewOf,
  resolveLeaving,
  wonTopTitleInSeason,
  resolveCollegeDeparture,
  resolveEndings,
  resolveReturnDecision,
  wasThereAChild,
  dynastyHandoverOf,
  dynastyBackgroundOf,
  childSeedFor,
  ancestorSeedOf,
}
export { buildAlbum, buildScroll } from './world/album'
// ⭐ THE ALBUM BOOK (docs/specs/the-album-2026-09.md) – the on-demand assembly the worker's `album`
// query serves, plus the mood table and the draft chapter headings for the tests and the owner's pass.
export { assembleAlbum, ALBUM_MOOD } from './world/albumBook'
import { localSponsorCents, reviewSponsors, reviewAdOffer, sponsorCameoWilling, sponsorCameoCents, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor, bankSponsorCheque } from './world/sponsors'
// ⭐ ROUND-28 #15 – the one splitter every sponsor cheque goes through, re-exported for the same
// reason: a test that wants to know what her cut of a brand's money is must ask the shipped one.
export { bankSponsorCheque }
// ⭐ ROUND 42 #5 – the cameo's cadence half, re-exported beside its need half for the same reason
// `sponsorNeedMet` is: the bench, the tests and the engine must all ask the one implementation.
export { sponsorCameoWilling, sponsorCameoCents }
export { localSponsorCents, reviewSponsors, reviewAdOffer, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor }
import { restRecoveryBonus, recoveryBaseFor, recoveryAgeFade, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, pauseCovering, PREGNANCY_PAUSE_DETAIL, POSTPARTUM_PAUSE_DETAIL, availabilityStatus, entryStatus, arrivalStatus } from './world/medical'
export { restRecoveryBonus, recoveryBaseFor, recoveryAgeFade, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, pauseCovering, PREGNANCY_PAUSE_DETAIL, POSTPARTUM_PAUSE_DETAIL, availabilityStatus, entryStatus, arrivalStatus }
// Pass-throughs that historically lived in the condition/availability block and left with it:
// re-exported here so the ~111 modules importing them from  keep working.
export { matchDrain, runFatigueExtra, tournamentRunStrain, conditionMatchFactor } from './condition'
// ⭐ v72: the private life's leaf, beside condition's and re-exported on the same line of reasoning –
// the barrel is what the rest of the repo imports the engine through. The temperament TYPE travels
// with them because `WorldState.temperament` is declared in it.
export { accrueSpirit, temperamentFor, temperamentIntensity, TEMPERAMENTS } from './spirit'
export type { Temperament } from './spirit'
// ⭐ v79: the chemistry leaf, beside the private life's and on the same line of reasoning – the
// barrel is what the rest of the repo imports the engine through, and `CoachPair` travels with them
// because `WorldState.coachPairs` is declared in it.
export {
  accrueChemistry,
  affinityCentre,
  affinityFor,
  chemistryCeilingPerYear,
  chemistryDriftPerYear,
  chemistryEventNudge,
  chemistryFloorPerYear,
  chemistryReadableAt,
  chemistryWeeklyRate,
  COACH_MANNERS,
  freshCoachPair,
  mannerFromAxes,
  mannerPush,
  mannerVoice,
  nextChemistryPhase,
  quietWeek,
} from './chemistry'
export type { ChemistryWeek, CoachManner } from './chemistry'
export { isExamWeek, isBlackoutWeek } from './season/calendar'
// W4-SCHOOL: the school calendar. Lives in kidLife.ts with `gradeOf`, whose arithmetic it is.
import { schoolEndWeek, schoolIsOver, schoolIsOverForBand } from './kidLife'
export { schoolEndWeek, schoolIsOver, schoolIsOverForBand }
export { isTierAgeOpen, tierAgeBlock } from './season/calendar'
import { vacationForWeek } from './world/bookings'
export { vacationForWeek }
import { inTrack, recomputeKidRank, refreshDerivedRankCaches, kidPoints, isTierEligible, acceptanceRank, tableSize, tierOpenFor, tierFloorOpen, tierOutgrown, outgrewTier, hasOutgrown, bookClosedTo, entryCouldNotMove, captureEntryRow, proDoors, juniorAccessOpen, yearEndJuniorRank, homeWildCardPlace, protectedRankPlace, PLAY_DOWN, playDownBars } from './world/ladder'
export { inTrack, recomputeKidRank, refreshDerivedRankCaches, kidPoints, isTierEligible, acceptanceRank, tableSize, tierOpenFor, tierFloorOpen, tierOutgrown, outgrewTier, hasOutgrown, bookClosedTo, entryCouldNotMove, captureEntryRow, proDoors, juniorAccessOpen, yearEndJuniorRank, homeWildCardPlace, protectedRankPlace, PLAY_DOWN, playDownBars }
import { KID_ID, SLAM_DEBUT_KEY } from './world/constants'
export { KID_ID, SLAM_DEBUT_KEY }
// ⭐⭐ ROUND 24, E2 – THE TWO SENTENCES THE COMMAND GUARD CAN SAY, and the guard that lets the college
// freeze through. Re-exported off the barrel for the same reason `COLLEGE_REVEAL_REFUSAL` is exported
// beside `resumeFromCollege`: they are PLAYER-FACING copy that reaches a toast through the worker's
// error channel, so a test that pinned the spelling instead of the symbol would break a report in
// silence. See the note beside `guardNotEnded` in world/constants.ts for why there are two.
export { CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL, guardNotEndedForGood } from './world/constants'
import { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage, proSubCapUsage } from './world/entryCaps'
// P1 – the junior access rulebook (the Accelerator table and the W15 reserved-place door). Re-exported
// under its own names for the same reason the caps are: the worker, the snapshot and the tools must
// read ONE implementation. `docs/specs/junior-access-2026-08.md`.
import { acceleratorAdmits, acceleratorUsage, juniorReservedRank } from './world/entryCaps'
export { acceleratorAdmits, acceleratorUsage, juniorReservedRank }
// W3-ACT2 §6 - the mandatory regime. Re-exported below under its own names so the worker, the
// snapshot and the tools read one implementation, exactly as entryCaps is.
import {
  buildTourBriefing,
  chargeMandatoryPenalty,
  isSuspendedAt,
  mandatoryBinds,
} from './world/mandatory'
export {
  buildTourBriefing,
  chargeMandatoryPenalty,
  isSuspendedAt,
  mandatoryBinds,
}
export { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage, proSubCapUsage }
import { finishLabel, prizeCentsFor } from './world/labels'
export { finishLabel, prizeCentsFor }
import { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning } from './world/age'
export { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning }
// ⭐ v48 – THE BIRTHDAY POPUP AND THE GIFT (docs/specs/birthday-and-gifts.md). Re-exported under the
// historical convention: 111 files import from `engine/world`, so a leaf's public API arrives here.
import { birthdayOffer, birthdayOfferFor, birthdayOptions, birthdayWords, birthdayHeading, pendingBirthday, buildBirthdayPrompt, chooseGift, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER, DAY_TOGETHER_FROM_AGE } from './world/birthday'
export { birthdayOffer, birthdayOfferFor, birthdayOptions, birthdayWords, birthdayHeading, pendingBirthday, buildBirthdayPrompt, chooseGift, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER, DAY_TOGETHER_FROM_AGE }
// ⭐ v74 (the private life, wave 3): `activeEpisode` and `loveEpisodesOf` arrive on the barrel too –
// the ACTIVE attachment is a question asked of `loveEpisodes`, never a field, so every reader in the
// repo has to arrive at it through this one function or the derivation acquires a second spelling.
// ⚠ THEY COME FROM `./world/loveEpisodes` AND NO LONGER FROM `./world/lifeBeat` – T4's cycle fix, set
// out in full in that leaf's own banner: `engine/spirit.ts` reads `activeEpisode` for the effective
// baseline and `lifeBeat.ts` imports `spirit.ts` at runtime. The two NAMES on this barrel did not
// move, which is the half that matters here (CLAUDE.md: the public API must not change).
// ⭐⭐ v75 (the private life, wave 4 – T2) ADDS THE LEAF'S FIRST WRITER: `endEpisode` is the ONE line
// in the engine that sets `endedWeek`, and it arrives on the barrel for the same reason the three
// selectors did – «an attachment is over» must have exactly one spelling, and a second one written
// against `loveEpisodes` directly would desync from the derivation that reads it.
import { activeEpisode, endEpisode, knownPartner, loveEpisodesOf } from './world/loveEpisodes'
export { activeEpisode, endEpisode, knownPartner, loveEpisodesOf }
// ⭐⭐ v74 (the private life, wave 3 – T3/T5) adds the ARRIVAL half: `rollArrival` is the weekly roll
// the tick calls, and `arrivalEligible` / `arrivalHazardFor` / `drawPartnerWants` / `drawRawLag` /
// `shaveLag` are the pure pieces it is assembled from – exported under the historical convention so
// the corridor tests and T11's census bench can sweep the tables directly instead of posing a world
// per cell (`forkStandingOf`'s own primitives doctrine).
// ⭐⭐ v74 T6 ADDS THE DELIVERY HALF: `deliverKnownPartner` is the weekly check the tick calls on
// `knownWeek`, and `lifeBeatHeading` joins `lifeBeatSaid` / `lifeBeatListenFollowUp` as the third
// pure copy assembler the voice pins walk without posing a world.
// ⭐⭐ v74 T7 ADDS THE PRICING HALF: `lifeBeatOptionsFor` is the ONE reading of what an answer costs
// (`LIFE_BEAT_OPTIONS` alone is now only the `'open'` column), `pendingLifeBeatOptions` is that
// reading for the row in hand – the shape `tools/_lifeBeats.ts` drains beats through – and
// `PARTNER_WANTS` is the two-value list the neutrality pin walks so it cannot go stale on a union.
// ⚠ `LifeBeatAnswer` IS NOT `shared/protocol`'s `LifeBeatOption` and the two names are kept apart on
// purpose: the wire shape the dialog is handed carries `{id, label}` and no price, and this one
// carries the price. Same name on two barrels would have been the duplicate-identifier confusion at
// its most expensive – the priced type silently satisfying the unpriced one.
// ⭐⭐ v74 T8 ADDS TIER 1: `rollSmallTalk` is the fourth and last weekly roll of the wave, and
// `smallTalkChanceFor` / `smallTalkEligible` / `smallTalkThisSeason` / `smallTalkSubjectFor` are the
// pure pieces it is assembled from – the same primitives doctrine the arrival half is exported under.
// `SMALL_TALK_SUBJECTS` is the total list her openers and the census are keyed on.
// ⭐⭐⭐ v74 T15 ADDS THE SOFT SURFACE: `liveSoftBeat` is the selector the Home card exists on (the
// three-week window, DERIVED from `week − row.week` and never stored), `buildSoftBeatInvite` is the
// snapshot half – the card's line plus the prompt it opens, on the ordinary contract – and
// `LIFE_BEAT_BLOCKING` is the per-kind registry both halves of the block contract now read through
// `pendingLifeBeat`. All three are exported for the same reason the rest of this import is: the pins
// walk them directly rather than posing a world per cell.
// ⭐⭐⭐ v75 T2 ADDS THE ENDING HALF, AND IT IS THE ARRIVAL'S MIRROR IN EVERY RESPECT: `rollEnds` is the
// weekly roll the tick calls FIRST of the four (world/phaseHerWeek.ts – the order is rulings F and A
// and is pinned in tests/spirit.test.ts), and `endsEligible` / `endsHazardFor` are the pure pieces it
// is assembled from, on `arrivalHazardFor`'s own primitives doctrine so the corridor tests and T7's
// census sweep the table without posing a world per cell. ⚠ `endsHazardFor` READS `ECONOMY.life
// .endsMult` AND NEVER `temperamentMult` (ruling E) – two columns of one spec table, different
// numbers, and the reason the ends multipliers got a record of their own.
// ⭐⭐⭐ v77 T6 ADDS THE LEAK – THE FIRST THING IN THIS LAYER THAT IS NOT ABOUT THE FAMILY AT ALL.
// `rollLeak` is the weekly roll the tick calls THIRD of the five (world/phaseHerWeek.ts – between the
// arrival and the delivery, and both neighbours are argued at the call site), and `leakEligible` /
// `leakHazardFor` / `leakWrongShareFor` are the pure pieces it is assembled from, on
// `arrivalHazardFor`'s own primitives doctrine so T9's bench and the corridor tests sweep the table
// without posing a world per cell. ⚠ `leakHazardFor` CARRIES A **FAME** FACTOR (the architect's
// ruling I, restoring who-she-is §3c-bis's own formula against the brief's spelling), which is why it
// takes two arguments where `endsHazardFor` takes one; `ECONOMY.fame.cap` is READ there and never
// written, the wave's §8.
// ⭐⭐⭐ v77 T7 ADDS THE BOOTH – the other half of the same day, and the only name in this layer the
// tick does NOT call from the life block. `airBoothMention` runs in `playHerWeek`'s play arm (§10's
// banner carries the measurement: two phases later, where the match she is about to play is in
// hand), and `boothMentionDue` is the pure licence it is assembled from – the fact, the window and
// the once-ness stamps, asked of the episode list and answered without a draw.
// ⭐⭐⭐ v75 T4 ADDS THE ENDING'S CONVERSATION: `drawEndsRead` is the space-vs-company read – the sixth
// and last key of the private life, keyed on the ENDING's week (ruling G.1) and weighted by
// who-she-is §4's own «Wants weights» row, so it is `drawPartnerWants`' twin and not a coin flip.
// `ENDS_READS` and `ENDS_REGISTERS` are the two total lists the completeness pins walk so neither can
// go stale on a union, exactly as `PARTNER_WANTS` does. ⚠ `lifeBeatOptionsFor` GREW A THIRD PARAMETER
// RATHER THAN GAINING A SIBLING (ruling G.3) – it stays the ONE road to a priced answer set, so the
// price `tools/_lifeBeats.ts` drains an `'ended'` row at is the price `answerLifeBeat` charges.
import { answerLifeBeat, arrivalEligible, arrivalHazardFor, buildLifeBeatPrompt, buildSoftBeatInvite, deliverKnownPartner, deliverOwnKey, ownKeyDue, ownKeyThisWeek, drawEndsRead, drawForkWant, drawListenHeard, drawPartnerWants, drawRawLag, forkStopDriverOf, forkWantOf, forkWantWeights, lifeBeatHeading, lifeBeatOptionsFor, lifeBeatSaid, lifeBeatListenFollowUp, lifeBeatFollowUps, metKeptRow, nextWeekIsClear, endedKeptRow, latchedEpisode, lifeLogOf, liveSoftBeat, pendingLifeBeat, pendingLifeBeatOptions, raiseLifeBeat, rollArrival, rollSpouseView, shaveLag, smallTalkSubjectFor, spouseViewEligible, spouseViewOccasionsAt, spouseViewOccasionThisWeek, pregnancyChanceAt, pregnancyEligible, rollPregnancy, landPregnancyAnnouncement, drawConceptionWindow, landPregnancyPause, landBirth, motherhoodBandAt, decisionWeekOf, returnChanceFor, comebackAtReturn, FORK_WANTS, FORK_WANT_ANSWER, FORK_WANT_TILT, LIFE_BEAT_BLOCKING, LIFE_BEAT_OPTIONS, PARTNER_WANTS, SMALL_TALK_SUBJECTS, LEGACY_SMALL_TALK_SUBJECTS, SMALL_TALK_STANCES, SMALL_TALK_STANCE_ID, SMALL_TALK_FACTS, SMALL_TALK_SITUATIONS, SMALL_TALK_EXCLUDE_LAST, SMALL_TALK_FRAMES, SPOUSE_VIEW_OCCASIONS, reachableSituations, withoutRecentSituations, FORK_STOP_DRIVERS, ENDS_READS, ENDS_REGISTERS, type HeardRead, type ForkStopDriver, type ForkWant, type SmallTalkSituation, type SmallTalkVoiceEntry } from './world/lifeBeat'
// ⚠ A HAZARD MODULE'S NAMES COME OFF THE KIND MODULE, NEVER OFF THE HUB (CLAUDE.md, the life-beat
// rule, and `world/lifeBeat/bereavement.ts`'s header for the cycle it avoids). The re-export below is
// UNCHANGED – these are local bindings by the time it names them, so the frozen surface cannot move.
import { rollBereavement, bereavementChanceAt, bereavementEligible } from './world/lifeBeat/bereavement'
import { rollPregnancyLoss, pregnancyLossChanceAt, pregnancyLossEligible, setWeightEnabled } from './world/lifeBeat/weight'
import { landWedding, partnerNameFor, rollWedding, weddingEligible, PARTNER_NAME_POOL } from './world/lifeBeat/wedding'
import { endsEligible, endsHazardFor, rollEnds } from './world/lifeBeat/ended'
import { rollSmallTalk, smallTalkChanceFor, smallTalkEligible, smallTalkThisSeason } from './world/lifeBeat/smallTalk'
import { leakEligible, leakHazardFor, leakWrongShareFor, rollLeak } from './world/lifeBeat/leak'
import { airBoothMention, boothMentionDue } from './world/lifeBeat/booth'
export { airBoothMention, answerLifeBeat, arrivalEligible, arrivalHazardFor, buildLifeBeatPrompt, buildSoftBeatInvite, boothMentionDue, deliverKnownPartner, deliverOwnKey, ownKeyDue, ownKeyThisWeek, drawEndsRead, drawForkWant, drawListenHeard, drawPartnerWants, drawRawLag, forkStopDriverOf, forkWantOf, forkWantWeights, lifeBeatHeading, lifeBeatOptionsFor, lifeBeatSaid, lifeBeatListenFollowUp, lifeBeatFollowUps, metKeptRow, nextWeekIsClear, endedKeptRow, endsEligible, endsHazardFor, leakEligible, leakHazardFor, leakWrongShareFor, latchedEpisode, lifeLogOf, liveSoftBeat, pendingLifeBeat, pendingLifeBeatOptions, landWedding, partnerNameFor, raiseLifeBeat, rollArrival, rollEnds, rollLeak, rollSmallTalk, rollSpouseView, rollWedding, shaveLag, smallTalkChanceFor, smallTalkEligible, smallTalkSubjectFor, smallTalkThisSeason, spouseViewEligible, spouseViewOccasionsAt, spouseViewOccasionThisWeek, weddingEligible, pregnancyChanceAt, pregnancyEligible, rollPregnancy, landPregnancyAnnouncement, drawConceptionWindow, rollPregnancyLoss, pregnancyLossChanceAt, pregnancyLossEligible, rollBereavement, bereavementChanceAt, bereavementEligible, landPregnancyPause, landBirth, motherhoodBandAt, decisionWeekOf, returnChanceFor, comebackAtReturn, setWeightEnabled, FORK_WANTS, FORK_WANT_ANSWER, FORK_WANT_TILT, LIFE_BEAT_BLOCKING, LIFE_BEAT_OPTIONS, PARTNER_WANTS, SMALL_TALK_SUBJECTS, LEGACY_SMALL_TALK_SUBJECTS, SMALL_TALK_STANCES, SMALL_TALK_STANCE_ID, SMALL_TALK_FACTS, SMALL_TALK_SITUATIONS, SMALL_TALK_EXCLUDE_LAST, SMALL_TALK_FRAMES, PARTNER_NAME_POOL, SPOUSE_VIEW_OCCASIONS, reachableSituations, withoutRecentSituations, FORK_STOP_DRIVERS, ENDS_READS, ENDS_REGISTERS, type HeardRead, type ForkStopDriver, type ForkWant, type SmallTalkSituation, type SmallTalkVoiceEntry }
// ⭐ ROUND 26 #4 – THE MEANS BAND, re-exported beside the birthday because the birthday is its first
// reader and because a future copy surface should find it on the same barrel (world/means.ts).
import { familyMeans, householdWalletCents, meansOfCents, MEANS_BANDS } from './world/means'
export { familyMeans, householdWalletCents, meansOfCents, MEANS_BANDS }
// ⭐⭐ v63 – THE SHOP, SLICE 1 (docs/specs/the-shop-2026-08.md §2, §3a-c, §5). The parent's own
// money, and the first shelf in this game that is his. Re-exported under the historical convention.
// ⭐⭐ ROUND 29 #5 added §3f's commissioned families and §3g's academy stages – `assetDelivered`,
// `assetUpkeepCents`, `deliverAssets`, `grantedVacationIds`, `ownsDeliveredOfFamily` and
// `weeklyAssetUpkeepCents` join the list. The pure reads live in `world/assets.ts` now and
// `world/shop.ts` re-exports every one of them, so this line is unchanged in shape.
// ⭐⭐⭐ ROUND 29 PART THREE #16 adds §4's moving price – `assetWorthCents` (the ONE thing that turns
// a holding into a number now that a market is in it), `marketSeasonMove` and `reportMarketSeason`.
// The path itself is `world/market.ts` and is re-exported one line down.
import { ASSET_NAME_MAX_CHARS, assetDelivered, assetEarningsRateCents, assetEntryPriceCents, assetHeldWeeks, assetNameOf, assetNameSuggestions, assetUpkeepCents, assetValueCents, assetWorthCents, avgUnitPriceCents, buyAsset, deliverAssets, deliveredAssets, marketSeasonMove, nameSuggestionsFor, ownedAssets, reachableFundsCents, revalueAssets, sanitiseAssetName, sellAsset, sellableAsset, shopCatalogue, shopItem, shopView, unitPriceCents, unitPriceHistory, weeklyAssetUpkeepCents } from './world/shop'
export { ASSET_NAME_MAX_CHARS, assetDelivered, assetEarningsRateCents, assetEntryPriceCents, assetHeldWeeks, assetNameOf, assetNameSuggestions, assetUpkeepCents, assetValueCents, assetWorthCents, avgUnitPriceCents, buyAsset, deliverAssets, deliveredAssets, marketSeasonMove, nameSuggestionsFor, ownedAssets, reachableFundsCents, revalueAssets, sanitiseAssetName, sellAsset, sellableAsset, shopCatalogue, shopItem, shopView, unitPriceCents, unitPriceHistory, weeklyAssetUpkeepCents }
import { marketCrash, marketCrashFellIn, marketCrashLog, marketIndex, marketWave, worstCrashFreeRatio, worstMarketRatio } from './world/market'
export { marketCrash, marketCrashFellIn, marketCrashLog, marketIndex, marketWave, worstCrashFreeRatio, worstMarketRatio }
// ⭐⭐ ROUND 29 PART FOUR P7 – FAME (the accounted stock, world/fame.ts) and THE PARENT'S
// BUSINESSES (merch follows fame, the academy's stages follow reputation – world/business.ts).
// Re-exported under the historical convention; zero draws anywhere behind these names.
import { completedShootsByBand, completedShootWeeks, fameAt, fameEventWeeks, fameFloorOf, fameShootMultOf, shootFloorDecayAt, slamDebutWeekOf } from './world/fame'
export { completedShootsByBand, completedShootWeeks, fameAt, fameEventWeeks, fameFloorOf, fameShootMultOf, shootFloorDecayAt, slamDebutWeekOf }
// ⭐⭐⭐ WAVE 6 T2 – THE SPOTLIGHT'S LEDGER (world/spotlight.ts): is she news, and what put her in the
// light this week. It READS fame and never tunes it (the wave's §8), and like the stock above it
// draws nothing and writes nothing – a week's exposure is a question asked of records the world
// already keeps. Re-exported under the historical convention so the barrel stays the one door.
// ⭐ v77's T7 TAKES TWO MORE NAMES OFF THE SAME LEAF: `atOrAboveStageBar` (the booth's licence asks
// the one question `'stage'` already asks about a rung) and `boothPrivateLifeAt` (what the booth
// touched at a week, read off the episode's stamps for the snapshot). Both are pure reads, like
// everything else in that module.
import { atOrAboveStageBar, boothPrivateLifeAt, exposureEventsOf, newsStandingOf, type ExposureEvent, type ExposureKind, type NewsStanding } from './world/spotlight'
export { atOrAboveStageBar, boothPrivateLifeAt, exposureEventsOf, newsStandingOf, type ExposureEvent, type ExposureKind, type NewsStanding }
// ⭐⭐⭐ ROUND 32 #4 – THE BRAND'S SLOW STOCK (world/brandStrength.ts). Income keeps reading fame;
// the WORTH reads this. Zero draws, nothing written per week – see the module header.
import { brandStrengthAt, strengthDecayAt } from './world/brandStrength'
export { brandStrengthAt, strengthDecayAt }
// ⭐⭐⭐ ROUND 30 #23/#24 – THE BRAND'S OWN ECONOMICS (world/brand.ts): what a WHOLE brand takes in
// (convex in fame), what multiple the CAREER has earned it, and the two joined. Ownership is applied
// in `world/assets.ts`, not here. Zero draws behind every one of these names – a valuation is a fold
// over history.
import { brandCrowdMult, brandGrossWorthCents, brandMultipleX, brandReachOf, brandSignalsOf, brandWeeklyGrossCents } from './world/brand'
export { brandCrowdMult, brandGrossWorthCents, brandMultipleX, brandReachOf, brandSignalsOf, brandWeeklyGrossCents }
export type { BrandSignals } from './world/brand'
import { academyReputationOf, academyWeeklyIncomeCents, assetKidShareCents, assetWeeklyIncomeCents, merchFamilyWeeklyIncomeCents, merchWeeklyIncomeCents } from './world/business'
export { academyReputationOf, academyWeeklyIncomeCents, assetKidShareCents, assetWeeklyIncomeCents, merchFamilyWeeklyIncomeCents, merchWeeklyIncomeCents }
export type { FamilyMeans } from './world/means'

// ⭐ R2-10 STEP 1 – THE PERSISTED SCHEMA DECLARES ITSELF IN `./world/state.ts` NOW.
//
// `WorldState`, `PendingTournament` and `SAVE_SCHEMA_VERSION` – with the whole version ladder that
// documents them – left this file for `world/state.ts` unchanged, comment for comment. They come
// back here and are re-exported under their historical names, exactly as every other extraction in
// this barrel is, so no importer of `engine/world` moved.
//
// ⚠ THE MOVE IS TYPE-ONLY PLUS ONE NUMBER, AND THE SAVE DID NOT CHANGE BY A BYTE. Interfaces are
// erased at compile time and `SAVE_SCHEMA_VERSION` is still 59 – the number did not move, no
// persisted field was added, removed, renamed or retyped, and no migration is owed. `createWorld`'s
// object literal, which is what fixes `JSON.stringify`'s key order, was not touched.
// ⭐ R2-10 STEP 2, PHASE 1 – the season boundary and the recurring obligations, and the two private
// helpers that only it called. Re-exported under the historical names for the same reason every
// other extraction in this barrel is: `ACADEMY_NOTICE`, `academySpokeThisWeek` and `reviewAcademy`
// are imported from `engine/world` by the tests, the advance's stop set and the academy's own
// module, and that public API must not change.
import { ACADEMY_NOTICE, reviewAcademy } from './world/phaseObligations'
export { ACADEMY_NOTICE, reviewAcademy }
// ⭐⭐ ROUND 26 #10, SECOND PASS – the tour's one compressed line at a college rest state. Re-exported
// under its own name like every other decomposed symbol: `tests/` reads it from `engine/world`.
export { campusDigestLine } from './world/fieldNews'
// ⭐ R2-10 STEP 2, PHASE 2 – what the week costs, and the five private helpers it is made of.
// `coachWorksThisWeek` is re-exported under its historical name: the development step below reads
// it, the snapshot reads it, the tests read it, and there must go on being ONE of it.
import { coachWorksThisWeek } from './world/phaseFinance'
export { coachWorksThisWeek }
// ⭐ R2-10 STEP 2, PHASE 3 – her body, the week folded once, and her own competition.
// `rivalField` and `TourWeek` come back from the substrate module because the AI side below still
// builds its brackets through the one helper both tournament paths have always shared.
// ⭐ R2-10 STEP 2, PHASE 4 – the cohort's drift, her development, the knock or the college year's
// own arrivals, and the three dates on the family's calendar.
// ⭐ R2-10 STEP 2, PHASE 5 – the canonical AI brackets and the week's close.
// ⭐ v76 (the psychologist's year, wave 5): `PsyFocus` joins the barrel's type surface beside the
// three that were already here – the year-focus union, declared in state.ts with the field it types.
// The barrel is a COMPATIBILITY contract (hundreds of files import from `engine/world`), so a new
// engine type that the seat's commands and T2's snapshot will both name belongs on it from the day it
// exists rather than being reached for through `engine/world/state` by whoever needs it first.
import type { PendingTournament, PsyFocus, WorldState } from './world/state'
export type { PendingTournament, PsyFocus, WorldState }
import { SAVE_SCHEMA_VERSION } from './world/state'
export { SAVE_SCHEMA_VERSION }

// ⚠ `EXPENSE_RANGE = ECONOMY.expenseRangeCents` lived here – the two-band weekly coaching draw.
// The ladder replaced it with a per-tier, per-age HOURLY band; resolveBaseCosts reads it through
// `coachRateBandCents` (engine/coach.ts) so the age lookup and the band live in one place.

// the coaching bill's copy tables (flavour lists, the facility venues and the court-time clauses):
// moved to world/phaseFinance.ts with `resolveBaseCosts`, their only reader (R2-10 step 2).


// THE LEDGER PRIMITIVES moved to world/ledger.ts (P4 extraction). `addEvent`/`accrueFinance` are
// imported at the top of this file; the pure finance folds are re-exported here under their
// historical names so every existing `from ...engine/world` call site keeps working.
export { seasonIndexOf, seasonStartWeek, financeWindow, financeSeries }

// player: moved to world/player.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// the rolling calendar (`ensureSeason`), the rank recompute and the housekeeping prunes: moved to
// world/bookkeeping.ts (R2-10 step 2, phase 5). They are shared by three closing paths – a normal
// week, a reveal week's `finalizeTournament` and `skipEvent` – so they belong to none of them.
// `ensureSeason` is imported back below and re-exported under its historical name.


// THE LADDER (ranking helpers + tier eligibility) moved to world/ladder.ts (P4 extraction).
// Imported back below and re-exported under the historical names.
// milestones: moved to world/milestones.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// injury: moved to world/injury.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// THE KNOCK moved to world/knock.ts (P4 extraction); imported back and re-exported.

// THE SEASON PLANNER moved to world/planner.ts (P4 extraction); imported back and re-exported.
// THE COACH MARKET moved to world/coachMarket.ts (P4 extraction); imported back and re-exported.


// --- weekly resolution pieces: moved to world/phaseFinance.ts (R2-10 step 2, phase 2) -----------
// Interest, the parent's contribution, `coachWorksThisWeek`, the base costs and the gear
// line-items left together with the phase that is their only caller. `coachWorksThisWeek` is
// imported back below and re-exported under its historical name – the development step in this
// file reads it, and so do the snapshot and the tests, and there must go on being ONE of it.

// sponsors: moved to world/sponsors.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// the junior conveyor + the academy's annual review: moved to world/phaseObligations.ts with the
// season-boundary phase that is their only caller (R2-10 step 2). `ACADEMY_NOTICE`,
// `academySpokeThisWeek` and `reviewAcademy` are imported back below and re-exported under the
// historical names, so every existing `from '...engine/world'` call site keeps working.

// The kid's tournament run. Uses an EVENT-SCOPED sub-RNG only (never the main
// weekly stream) so entering or skipping never perturbs cohort drift / AI results.


// The kid's matches within a full result, in round order (she plays once per round she survives).

// One kid match rendered as a News `match` event: identical text/shape to the old inline
// resolution. Skill snapshots come from the pre-drift `players` map so the record is stable.

// RIVALS BECOME REAL (`rivalField`) and the kid's shadow run (`computeShadowTournament`): moved to
// world/weekField.ts and world/phaseHerWeek.ts respectively (R2-10 step 2, phase 3). `rivalField` is
// the ONE place both tournament paths build a rival, so it went to the substrate both phases read
// rather than into either of them; `runAiTournament` below imports it from there.


// ⭐⭐ A-04 (a) / T6.5 – THE TOURNAMENT CLOSE moved to world/tournamentClose.ts: `finalizeTournament`
// with its `rankingDeltaSuffix`, the `emitKidMatch` both reveal paths share, and the three commands
// that read a finished run out (`revealTournamentRound`, `skipTournament`, `closeTournament`). They
// called each other and nothing else in this file called them – the 26.09 lane's call-back probe
// measured the cluster at zero edges into the core – so the span moved whole and verbatim. The four
// historical names are re-exported here, so every `from '...engine/world'` call site keeps working.
export { rankingDeltaSuffix, revealTournamentRound, skipTournament, closeTournament } from './world/tournamentClose'

// the canonical AI bracket family (`drawAiEntrants` / `fillWeekOnRamps` / `fillWildCards` /
// `runAiTournament` / `announceTourChampion`): moved to world/phaseAiWeek.ts with the step that is
// their only caller (R2-10 step 2, phase 5).

// --- the losing streak (fix/world-trio item 3) --------------------------------
// `angry` finally has a trigger, and it is the owner's: she gets angry after a RUN of losses, of a
// length the player cannot count to (a threshold drawn per streak in ANGER_STREAK_MIN..MAX).
//
// WHY THE ENGINE OWNS THIS. `avatarEmotion()` is a pure function of one result – no seed, no
// history – so it can neither count a streak nor draw a threshold. Both are done here, once, and
// travel on the snapshot; the pure decision then only compares two numbers. That split is also what
// makes the face STABLE: a threshold re-drawn on every render would flip her between `sad` and
// `angry` on the same screen (a UI-side draw has no idea it has already been made).
//
// THE STREAK RULES, and the reasoning for each:
//
//  * A COMPETITIVE MATCH SHE LOST extends it; a COMPETITIVE MATCH SHE WON ends it. Those are the
//    only two things that move it. Note this makes an entire tournament RUN self-clearing: a run
//    that reaches the final is W,W,W,L in the feed, so walking back from the newest event stops at
//    the first of those wins and the streak is 1 – a good week cannot leave anger banked.
//
//  * A PRACTICE FRIENDLY IS INVISIBLE – it neither counts nor breaks. Forced by R11-2 (the owner:
//    a friendly must not move her face at all): if a friendly LOSS could push her over the edge, a
//    hit-out at the club would have changed her face, and if a friendly WIN could clear a run of
//    real defeats, it would have changed it just as much in the other direction. Consistency here
//    is not a judgement call, it is the same rule read twice – so it is the same predicate, too
//    (`resultShowsOnHerFace`, shared/avatarEmotion.ts).
//
//  * A WALKOVER OR A MEDICAL WITHDRAWAL IS INVISIBLE – neither counts nor breaks. She never took
//    the court: there is no defeat to add (losing to her own body is what `injury`/`tired` are for,
//    and the injury emotion outranks the whole idle ladder anyway), and there is no performance to
//    forgive her with either. Making it BREAK the streak would be perverse – a forfeited entry
//    would launder away four real losses – and making it COUNT would punish her for an injury
//    twice. This falls out of the walk for free: both emit `injury`-type events carrying no
//    `match`, so the predicate above already skips them. Stated explicitly because "it happens to
//    work" is exactly how such a rule rots.
//
//  * The streak spans SEASONS. A season boundary is a calendar fact, not something that happens to
//    her; nothing about New Year makes the fifth defeat land softer.
//
// COST ON THE MAIN STREAM: ZERO. The threshold comes from `rngFromSeed(seed:angry:<startWeek>)` –
// a purpose-scoped sub-stream, the same shape as `:injury:<week>` and `:aitour:<eventId>` – and
// nothing here touches the weekly `rng`. The frozen capture (41550 / e6b0c709) cannot move: this
// runs at SNAPSHOT time, which is not part of the tick at all.
//
// The start week is the key because it is the ONE thing about a streak that does not change while
// the streak grows – keying on the length would re-draw at every new loss, which is the flicker
// again. At most one competitive loss can exist per week (one tournament a week, and a bracket
// eliminates her exactly once), so a start week identifies its streak uniquely.

// ⭐⭐ A-04 (a) / T6.5 – THE BIRTH OF A CAREER moved to world/create.ts: `createWorld` with the
// 93-property literal, the ⭐⭐⭐ HANDOVER section (the four `prologue*` derivations, `taughtShareOf`
// and `PROLOGUE_COACH_LADDER`), the two `ECONOMY` aliases the birth reads, and `seedWorldForV6`.
// Everything in that cluster runs ONCE at week 0 and nothing there is reachable from `tickWeek`, and
// the 26.09 lane's call-back probe measured it at zero edges into this file. `createWorld` is also
// imported back, because `replayMainState` below still calls it.
//
// ⚠ THE TWELVE READERS OF `STARTING_FUNDS_CENTS` AND `PARENT_INCOME_CENTS` ARE UNTOUCHED, which is
// the reason the aliases went WITH the birth rather than being left behind as the file's last two
// declarations: they are re-exported here under their historical names, exactly as before, and the
// numbers themselves never left `./economy` (see the note the two consts carry, in create.ts now).
import { createWorld } from './world/create'
export { createWorld }
export {
  PARENT_INCOME_CENTS,
  PROLOGUE_COACH_LADDER,
  prologueCoachTier,
  prologuePlayStyle,
  seedWorldForV6,
  STARTING_FUNDS_CENTS,
} from './world/create'

// ⭐⭐ A-04 (a) / T6.5 – THE WEEK ITSELF moved to world/tick.ts, and with it the last function body
// this file held: `tickWeek` and its header, `advanceWeeks`, `skipEvent`, the college exit
// (`resumeFromCollege`, `endCollegeEarly`, `finishCollege`, `COLLEGE_REVEAL_REFUSAL`), the v35 probe
// replay `replayMainState` and the MAIN-draw budget (`maxMainDraws`, `MAIN_DRAWS_*`). They are one
// module because everything there is a caller of the tick, and the college exit is the only caller of
// it besides the span – see that file's banner for why it may not live in `world/college.ts`.
//
// ⚠⚠ AND THIS IS WHERE P4 ENDS. `world.ts` is now the barrel and its layering comments and NOTHING
// ELSE: `tests/principles-a04-barrel-no-bodies.test.ts` parses this file with the repo's own
// `typescript` and fails on the first function body that appears in it, whatever the diff looks like
// to a reviewer. That is P4's acceptance (`:88`) and its stop-rule (`:75`, «a PR adding a function
// body to world.ts fails review») stopping being a sentence in a proposal. The forward rule is
// unchanged and now mechanical: new engine behaviour is a new or existing module under
// `src/engine/world/`, plus one line here.
export { advanceWeeks, endCollegeEarly, maxMainDraws, replayMainState, resumeFromCollege, skipEvent, tickWeek } from './world/tick'
export { COLLEGE_REVEAL_REFUSAL, MAIN_DRAWS_PER_WEEK_MAX } from './world/tick'



// snapshot: moved to world/snapshot.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.
