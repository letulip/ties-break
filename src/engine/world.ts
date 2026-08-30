import { type Rng, type MainRngState, initMainState, resumeMain } from './rng'
import {
  DEFAULT_PROFILE,
  STOP_PRECEDENCE,
  WEEK_PLAN_PRESETS,
  type FamilyBackground,
  type PlayerProfile,
  type StopReason,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
// THE LAYERING, stated once (fix/world-trio item 2). `src/shared/dates.ts` is deliberately
// engine-free – it imports nothing and knows only the fixed epoch – so the dependency runs one way,
// engine -> shared, exactly as it already does for `../shared/protocol` and `../shared/format`.
// This import is therefore the seam, not a violation of one: there is no need for (and must be no)
// second week formatter living inside the engine. The engine keeps counting ABSOLUTE weeks and
// every RNG sub-stream key / save field / pinned capture stays on that index; `weekLabel` is
// applied only where the engine writes a string a PLAYER reads.
import { weekLabel } from '../shared/dates'
// The emotion RULES live in shared/ (pure, UI-free, and the composable reads the same module), so
// the engine borrows the two facts it needs rather than restating them: which recorded matches are
// allowed to move her face (R11-2's one predicate) and the band a streak's anger threshold sits in.
// Type-only on the way back (shared/avatarEmotion imports `type TierId` from engine/season/types),
// so this is a leaf dependency, not a cycle.
import type { MatchPlayer } from './match/types'
import type { MatchRecord, SeasonEvent } from './season/types'
import {
  TIERS,
  WEEKS_PER_YEAR,
  OFF_SEASON_WEEKS } from './season/calendar'
import { clamp, tournamentRunStrain } from './condition'
import { ECONOMY,
  kidPrizeShareBps,
  kidPrizeShareCents,
  staffPrizeShareCents,
  staffResultShareBps,
} from './economy'
// v54 (round-23 #18): the one string the engine writes about her own account. `shared/money.ts` is
// the ONE cents-to-dollars implementation in the app and `weekLabel` above records why the engine is
// allowed to reach into shared/ for a player-facing string.
import { formatCents } from '../shared/money'
import { generateCohort, COHORT_SIZE } from './season/cohort'
import { physicalMean, rollPotential } from './development'
import { coachIncludesPhysio } from './coach'
import { generatePreHistory } from './season/prehistory'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, RANKABLE_MIN, windowedBestSum } from './season/ranking'
// THE FIELD TIER (living-field phase W, 01.08). Field pros are DERIVED, NEVER PERSISTED – see
// season/fieldPros.ts for the whole argument. world.ts only ever asks three questions of them:
// the merged W ranking, the W-event candidate universe, and a name for an fp- id on a surface.
// Since W3-FIELD3 the second of those is asked by the CANONICAL brackets as well as by her shadow
// run, and `isFieldProId` earns a fourth job: it is the one predicate that keeps a derived player
// out of the persisted ledger (`runAiTournament`).
import {
  isFieldProId,
} from './season/fieldPros'
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
import { addEvent, accrueCoachCut, accrueKidShare, seasonIndexOf, seasonStartWeek, financeWindow, financeSeries } from './world/ledger'
import { activeLadderOf, toSnapshot } from './world/snapshot'
export { activeLadderOf, toSnapshot }
import {
  flipScore,
  kidMatchesOf,
  kidMatchEvent,
  computeLossStreak,
  rivalRetirementNews,
} from './world/matchNews'
export { flipScore, computeLossStreak }
import { pendingKnock, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek } from './world/knock'
export { pendingKnock, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek }
// ⭐ R2-13 phase 1: the advance's entry gate and the span report, in a leaf module the shell can
// import without pulling the integration core in. Re-exported under `engine/world` like every other
// extraction, so the 280-file public API is unchanged.
import { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, SPAN_REPORTS_ONLY, spanDigest, spanRowCount, spanWeeksFor, stoppableOfferWeek } from './world/multiWeek'
export { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, SPAN_REPORTS_ONLY, spanDigest, spanRowCount, spanWeeksFor, stoppableOfferWeek }
// ⭐⭐ ROUND 29 #3 – the shoot that lands on a tournament week, and the four answers to it. Extracted
// to `world/shootClash.ts` (a leaf) and re-exported here under the historical barrel, exactly as
// every other decomposed concern is.
import { answerShootClash, buildShootClashPrompt, shootCancelCents, shootClashOpen, shootClashWeek, shootMoveTarget } from './world/shootClash'
export { answerShootClash, buildShootClashPrompt, shootCancelCents, shootClashOpen, shootClashWeek, shootMoveTarget }
// ⭐⭐ ROUND 26 #1 (second pass): WHEN the span is offered, which is the owner's rule and not the
// engine's refusal – see `world/multiWeek.ts` for why the two are deliberately separate gates.
import { QUIET_WINDOW_WEEKS, LONG_LAYOFF_WEEKS, calendarClearAhead, eventIsHers, longLayoff, spanWorthOffering } from './world/multiWeek'
export { QUIET_WINDOW_WEEKS, LONG_LAYOFF_WEEKS, calendarClearAhead, eventIsHers, longLayoff, spanWorthOffering }
export type { SpanWeek } from './world/multiWeek'
import { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution } from './world/planner'
export { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution }
export type { PracticeCaution } from './world/planner'
import { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRoomNote, COACH_EDGE_REVEAL_WEEKS } from './world/coachMarket'
export { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRoomNote, COACH_EDGE_REVEAL_WEEKS }
// W3-KIT: the till and the shop window. ⚠ `GEAR_CATEGORY_LINE` came back from equipment.ts to this
// file until R2-10 step 2; it left with `resolveGear`, its only reader here, and is imported by
// world/phaseFinance.ts now. See the note at `resolveGear` for why it was priced below world.ts.
import { defaultKitState } from './equipment'
import { setKitGrade, kitLineViews, kitDealView, kitAllowanceRemainingCents, kitStateOf, kitPurchaseSplit, goodWeeksFor, KIT_LINES, gearRestWeeksOf, recordGearRestWeek, GEAR_REST_WINDOW } from './world/kit'
export { setKitGrade, kitLineViews, kitDealView, kitAllowanceRemainingCents, kitStateOf, kitPurchaseSplit, goodWeeksFor, KIT_LINES, gearRestWeeksOf, recordGearRestWeek, GEAR_REST_WINDOW }
// W3-SUMMER: the holidays as a real training block - one predicate, both halves.
import { summerBlockWeek, summerLoadFactor, summerConditionCost } from './world/summer'
export { summerBlockWeek, summerLoadFactor, summerConditionCost }
import { startingSkills, withHeadStart, kidMatchPlayer, kidMatchPlayerFor } from './world/player'
export { startingSkills, kidMatchPlayer, kidMatchPlayerFor }
import { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury } from './world/injury'
export { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury }
import { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurWorksInWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS } from './world/masseur'
export { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurWorksInWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS }
import { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX, INJURY_RELEASE_SUFFIX } from './world/entries'
export { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX, INJURY_RELEASE_SUFFIX }
import { eventById } from './world/bookings'
import { KNOCK_HISTORY_MAX } from './world/knockHistory'
export { KNOCK_HISTORY_MAX }
import { fireMilestone, captureMilestone, captureBreakEven, maybeFireSeasonWrapUp, emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger, seasonWrapDue } from './world/milestones'
export { emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger, captureBreakEven, maybeFireSeasonWrapUp, seasonWrapDue }
// W2-ENDINGS: the six endings' world-side wiring. Re-exported under these names so the worker, the
// snapshot, the tests and the bench all read the one implementation - the same contract every other
// extracted module here keeps.
import {
  answerFork,
  answerRetirement,
  buildDebtView,
  buildEndingView,
  cheapestEntryFeeCents,
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
  resolveCollegeDeparture,
  resolveEndings,
  wasThereAChild,
} from './world/endings'
// ⭐ P5 – WHAT IS BEHIND THE DOOR (docs/specs/college-as-a-second-act-2026-08.md). `inCollege` moved
// out of `world/endings.ts` into this module and is re-exported below under its historical name, so
// every existing `from '...engine/world'` call site and test import is untouched. The move was
// forced by a dependency, not by tidiness: the ending VIEW now carries the college progress, so
// endings.ts imports college.ts, and college.ts needed the predicate.
import { ENDINGS } from './ending'
import {
  bankCollegeYear,
  callUpPlayedThisWeek,
  callUpRevealOpen,
  closeCallUpReveal,
  closeCollegeLeagueReveal,
  collegeEpilogueLine,
  collegeLeaguePlayedThisWeek,
  collegeLeagueRevealOpen,
  leaveCollege as leaveCollegeState,
  openCollegeYear,
  revealCallUpRubber,
  revealCollegeLeagueRound,
  skipCallUpRubbers,
  skipCollegeLeagueRounds,
} from './world/college'
export {
  // ⚠ RENAMED, NOT DROPPED (round 21 #5): `COLLEGE_MATCH_SEASON` was a thirteen-week block and the
  // college years are the SHORTCUT, so it is two trips a year now. Nothing outside `world/college.ts`
  // ever read it – it shipped on 17.08 and this is the same day – so the rename breaks no call site.
  COLLEGE_TRIP_WEEKS,
  bankCollegeYear,
  // ⭐⭐ THE COLLEGE WAVE: the played rubbers and the predicate that stops them passing in silence.
  callUpPlayedThisWeek,
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
  closeCallUpReveal,
  revealCallUpRubber,
  settleCallUpLetter,
  skipCallUpRubbers,
  collegeCoachFactor,
  collegeEpilogueLine,
  // ⭐⭐⭐ ROUND 24 – THE STUDENT CHAMPIONSHIP: the one tournament a college year is guaranteed, and
  // the predicate that keeps its week from passing in silence. Same six names, same shape, as the
  // call-up above it – deliberately, because they are the same KIND of thing.
  collegeLeagueMatchId,
  collegeLeagueMatchesOf,
  collegeLeaguePlayedThisWeek,
  // ⭐⭐⭐ ROUND 26 #6 – THE REVEAL. The predicate, its matches, and the three commands the
  // tour's own reveal trio dispatches into (see `revealTournamentRound` below).
  collegeLeagueRevealMatches,
  collegeLeagueRevealOpen,
  collegeLeagueWeek,
  // ⭐⭐⭐ ROUND 27 #2 – WILL THE NEXT PRESS END AT THE CHAMPIONSHIP? The fact behind the bottom
  // control's fifth label, and the week-level test it is built on.
  collegeLeagueIsNextStop,
  // ⭐⭐⭐ ROUND 27 #6 – ...and the tie is the third stop that predicate's own ⚠⚠ asked for.
  collegeCallUpIsNextStop,
  collegeNextStop,
  isCollegeLeagueWeek,
  collegeMatchesThisWeek,
  collegeProgressOf,
  collegeRecruitViewOf,
  inCollege,
  lastLeagueRun,
  measureCollegeOffer,
  openCollegeYear,
  resolveCallUp,
  resolveCollegeBill,
  resolveCollegeLeague,
  skillMeanOf,
} from './world/college'
export {
  answerFork,
  answerRetirement,
  buildDebtView,
  buildEndingView,
  cheapestEntryFeeCents,
  guardNotEnded,
  latchEnding,
  lastRungSeasonIndexOf,
  LAST_OFFER_NOT_A_QUESTION,
  plateauViewOf,
  autoEndingViewOf,
  resolveCollegeDeparture,
  resolveEndings,
  wasThereAChild,
}
export { buildAlbum, buildScroll } from './world/album'
import { localSponsorCents, reviewSponsors, reviewAdOffer, sponsorNeedMet, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor, academyCoverOf, appearanceFeeFor, resultBonusFor, isRetainerWeek, rolloverKitAllowance, bankSponsorCheque } from './world/sponsors'
// W3-ACT2 §7 - the professional rungs' money, re-exported so the tools and the snapshot read one
// implementation exactly as every other sponsor helper is.
export { appearanceFeeFor, resultBonusFor, isRetainerWeek }
// ⭐ ROUND-28 #15 – the one splitter every sponsor cheque goes through, re-exported for the same
// reason: a test that wants to know what her cut of a brand's money is must ask the shipped one.
export { bankSponsorCheque }
export { localSponsorCents, reviewSponsors, reviewAdOffer, sponsorNeedMet, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor, rolloverKitAllowance }
import { restRecoveryBonus, recoveryBaseFor, recoveryAgeFade, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus } from './world/medical'
export { restRecoveryBonus, recoveryBaseFor, recoveryAgeFade, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus }
export type { AvailabilityStatus, MedicalClearance, MedicalBlock, LayoffBlock, EntryStatus, ArrivalVerdict, ArrivalStatus } from './world/medical'
// Pass-throughs that historically lived in the condition/availability block and left with it:
// re-exported here so the ~111 modules importing them from  keep working.
export { matchDrain, runFatigueExtra, tournamentRunStrain, conditionMatchFactor } from './condition'
export { isExamWeek, isBlackoutWeek } from './season/calendar'
// W4-SCHOOL: the school calendar. Lives in kidLife.ts with `gradeOf`, whose arithmetic it is.
import { schoolEndWeek, schoolIsOver, schoolIsOverForBand } from './kidLife'
export { schoolEndWeek, schoolIsOver, schoolIsOverForBand }
export { isTierAgeOpen, tierAgeBlock } from './season/calendar'
import { vacationForWeek, practiceForWeek } from './world/bookings'
export { vacationForWeek, practiceForWeek }
import { inTrack, fieldProsOf, recomputeKidRank, refreshDerivedRankCaches, kidPoints, kidDomesticPoints, isTierEligible, acceptanceRank, tableSize, tierOpenFor, tierFloorOpen, tierOutgrown, outgrewTier, hasOutgrown, bookClosedTo, entryCouldNotMove, captureEntryRow, proDoors, juniorAccessOpen, yearEndJuniorRank, homeWildCardPlace, PLAY_DOWN, playDownBars } from './world/ladder'
export { inTrack, recomputeKidRank, refreshDerivedRankCaches, kidPoints, kidDomesticPoints, isTierEligible, acceptanceRank, tableSize, tierOpenFor, tierFloorOpen, tierOutgrown, outgrewTier, hasOutgrown, bookClosedTo, entryCouldNotMove, captureEntryRow, proDoors, juniorAccessOpen, yearEndJuniorRank, homeWildCardPlace, PLAY_DOWN, playDownBars }
import { KID_ID } from './world/constants'
export { KID_ID }
// ⭐⭐ ROUND 24, E2 – THE TWO SENTENCES THE COMMAND GUARD CAN SAY, and the guard that lets the college
// freeze through. Re-exported off the barrel for the same reason `COLLEGE_REVEAL_REFUSAL` is exported
// beside `resumeFromCollege`: they are PLAYER-FACING copy that reaches a toast through the worker's
// error channel, so a test that pinned the spelling instead of the symbol would break a report in
// silence. See the note beside `guardNotEnded` in world/constants.ts for why there are two.
export { CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL, guardNotEndedForGood } from './world/constants'
import { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage, proSubCapUsage, proSubCapRefusalDetail, juniorMerit, proMerit, bestJuniorRankInWindow } from './world/entryCaps'
// P1 – the junior access rulebook (the Accelerator table and the W15 reserved-place door). Re-exported
// under its own names for the same reason the caps are: the worker, the snapshot and the tools must
// read ONE implementation. `docs/specs/junior-access-2026-08.md`.
import { ACCELERATOR, JUNIOR_RESERVED, acceleratorAdmits, acceleratorUsage, juniorReservedRank } from './world/entryCaps'
export { ACCELERATOR, JUNIOR_RESERVED, acceleratorAdmits, acceleratorUsage, juniorReservedRank }
// W3-ACT2 §6 - the mandatory regime. Re-exported below under its own names so the worker, the
// snapshot and the tools read one implementation, exactly as entryCaps is.
import {
  buildTourBriefing,
  chargeMandatoryPenalty,
  dueMandatoriesAt,
  isMandatoryTier,
  isSuspendedAt,
  mandatoryBinds,
  mandatoryBindsRank,
  penaltyPointsAt,
  quotaPlayedIn,
  quotaShortfallAt,
  suspensionWeeksLeft,
} from './world/mandatory'
export {
  buildTourBriefing,
  chargeMandatoryPenalty,
  dueMandatoriesAt,
  isMandatoryTier,
  isSuspendedAt,
  mandatoryBinds,
  mandatoryBindsRank,
  penaltyPointsAt,
  quotaPlayedIn,
  quotaShortfallAt,
  suspensionWeeksLeft,
}
export { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage, proSubCapUsage, proSubCapRefusalDetail, juniorMerit, proMerit, bestJuniorRankInWindow }
import { finishLabel, prizeCentsFor } from './world/labels'
export { finishLabel, prizeCentsFor }
import { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning } from './world/age'
export { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning }
// ⭐ v48 – THE BIRTHDAY POPUP AND THE GIFT (docs/specs/birthday-and-gifts.md). Re-exported under the
// historical convention: 111 files import from `engine/world`, so a leaf's public API arrives here.
import { birthdayOffer, birthdayOfferFor, birthdayOptions, birthdayWords, birthdayHeading, collegeBirthdayIndexOf, pendingBirthday, buildBirthdayPrompt, chooseGift, birthdayHistory, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER } from './world/birthday'
export { birthdayOffer, birthdayOfferFor, birthdayOptions, birthdayWords, birthdayHeading, collegeBirthdayIndexOf, pendingBirthday, buildBirthdayPrompt, chooseGift, birthdayHistory, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER }
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
import { ASSET_NAME_MAX_CHARS, assetDelivered, assetEarningsRateCents, assetHeldWeeks, assetNameOf, assetNameSuggestions, assetUpkeepCents, assetValueCents, assetWorthCents, avgUnitPriceCents, buyAsset, deliverAssets, deliveredAssets, grantedVacationIds, isNameable, marketSeasonMove, nameSuggestionsFor, ownedAssets, ownsDeliveredOfFamily, reportMarketSeason, revalueAssets, sanitiseAssetName, sellAsset, sellableAsset, shopCatalogue, shopItem, shopView, unitPriceCents, weeklyAssetUpkeepCents } from './world/shop'
export { ASSET_NAME_MAX_CHARS, assetDelivered, assetEarningsRateCents, assetHeldWeeks, assetNameOf, assetNameSuggestions, assetUpkeepCents, assetValueCents, assetWorthCents, avgUnitPriceCents, buyAsset, deliverAssets, deliveredAssets, grantedVacationIds, isNameable, marketSeasonMove, nameSuggestionsFor, ownedAssets, ownsDeliveredOfFamily, reportMarketSeason, revalueAssets, sanitiseAssetName, sellAsset, sellableAsset, shopCatalogue, shopItem, shopView, unitPriceCents, weeklyAssetUpkeepCents }
import { marketCrash, marketCrashFellIn, marketCrashLog, marketIndex, marketWave, worstCrashFreeRatio, worstMarketRatio } from './world/market'
export { marketCrash, marketCrashFellIn, marketCrashLog, marketIndex, marketWave, worstCrashFreeRatio, worstMarketRatio }
// ⭐⭐ ROUND 29 PART FOUR P7 – FAME (the accounted stock, world/fame.ts) and THE PARENT'S
// BUSINESSES (merch follows fame, the academy's stages follow reputation – world/business.ts).
// Re-exported under the historical convention; zero draws anywhere behind these names.
import { completedShootWeeks, fameAt, fameFloorOf, fameShootMultOf } from './world/fame'
export { completedShootWeeks, fameAt, fameFloorOf, fameShootMultOf }
import { academyReputationOf, academyWeeklyIncomeCents, assetWeeklyIncomeCents, merchWeeklyIncomeCents } from './world/business'
export { academyReputationOf, academyWeeklyIncomeCents, assetWeeklyIncomeCents, merchWeeklyIncomeCents }
export type { MarketCrash } from './world/market'
export type { ShopItem } from './world/shop'
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
import { ACADEMY_NOTICE, academySpokeThisWeek, reviewAcademy, seasonBoundaryAndObligations } from './world/phaseObligations'
export { ACADEMY_NOTICE, academySpokeThisWeek, reviewAcademy }
// ⭐⭐ ROUND 26 #10, SECOND PASS – the tour's one compressed line at a college rest state. Re-exported
// under its own name like every other decomposed symbol: `tests/` reads it from `engine/world`.
import { announceCampusInterlude } from './world/fieldNews'
export { announceCampusInterlude, campusDigestLine, FIELD_NEWS } from './world/fieldNews'
// ⭐ R2-10 STEP 2, PHASE 2 – what the week costs, and the five private helpers it is made of.
// `coachWorksThisWeek` is re-exported under its historical name: the development step below reads
// it, the snapshot reads it, the tests read it, and there must go on being ONE of it.
import { coachWorksThisWeek, weeklyFinance } from './world/phaseFinance'
export { coachWorksThisWeek }
// ⭐ R2-10 STEP 2, PHASE 3 – her body, the week folded once, and her own competition.
// `rivalField` and `TourWeek` come back from the substrate module because the AI side below still
// builds its brackets through the one helper both tournament paths have always shared.
import { deriveWeekField } from './world/weekField'
import { playHerWeek, resolveBodyAndPlanner } from './world/phaseHerWeek'
// ⭐ R2-10 STEP 2, PHASE 4 – the cohort's drift, her development, the knock or the college year's
// own arrivals, and the three dates on the family's calendar.
import { growAndLive } from './world/phaseGrowth'
// ⭐ R2-10 STEP 2, PHASE 5 – the canonical AI brackets and the week's close.
// `ensureSeason` is re-exported under its historical name; `recomputeRankAndMilestones` and
// `housekeep` come back for the two OTHER closing paths that still live in this file –
// `finalizeTournament`'s deferred step 5-6 and `skipEvent`.
import { closeTheWeek } from './world/phaseAiWeek'
import { ensureSeason, housekeep, recomputeRankAndMilestones } from './world/bookkeeping'
export { ensureSeason }
import type { PendingTournament, WorldState } from './world/state'
export type { PendingTournament, WorldState }
import { SAVE_SCHEMA_VERSION } from './world/state'
export { SAVE_SCHEMA_VERSION }

// ⚠ ROUND 26 #4 – THE NUMBERS MOVED TO `./economy`, THE NAME DID NOT. Same alias shape as
// `PARENT_INCOME_CENTS` eight lines below, and for the same reason: the economy tuning surface is one
// object. What forced it is `world/means.ts`, which turns a balance into a means band and may not
// import `world.ts` back – that edge is a runtime cycle, and `economy.ts` is a leaf. Every one of the
// twelve readers of this export (MoneyScreen, EndingScreen, five tests, two tools) is untouched.
export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = ECONOMY.startingFundsCents

// The economy tuning surface now lives in ./economy (the owner's single "ручки регулировки"
// knob object). These aliases keep the old call sites + the public PARENT_INCOME_CENTS export
// (imported by tests) pointing at that one source of truth.
export const PARENT_INCOME_CENTS = ECONOMY.parentIncomeCents
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


/** The clause appended to a tournament summary that explains the EFFECTIVE ranking change
 *  (round-5 item 1a). `delta` is the change in the kid's windowed best-N sum caused by the
 *  new result: `points` when nothing was displaced, `points − displaced` when a counted
 *  result was pushed out, `0` when the result didn't crack the best N. `bestN` is the TRACK's
 *  window width (W2-LADDER §3) so the sentence names the rule it measured against - "best 6" on a
 *  junior summary, "best 18" on a professional one - instead of quoting the junior rule at both.
 *  It reads the constant rather than a literal, so the 05.08 correction from sixteen to the
 *  rulebook's eighteen changed this copy without touching this function.
 *
 *  ⚠ AND THE THIRD CASE IS THE MINIMUM (points-by-the-book, 05.08, §VIII.A.2.b). A player who has
 *  scored but is not yet on the list has `after === 0` with `points > 0`, and the old two-case
 *  sentence would have told her the result "does not improve best 18" – true of the arithmetic and
 *  nonsense to read, because the reason is not that her window was full, it is that she has no
 *  window yet. `notRanked` says which rule is holding her instead. It is passed by the call site
 *  rather than derived here, because this function is a formatter and knows nothing about tables. */
export function rankingDeltaSuffix(points: number, delta: number, bestN: number, notRanked = false): string {
  if (points <= 0) return ''
  if (notRanked) return ` (+${points} banked – a ranking needs ${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points})`
  if (delta <= 0) return ` (does not improve best ${bestN})`
  if (delta < points) return ` (ranking total +${delta})`
  return ''
}

// Commit the kid's run: award points, emit the summary + milestones, recompute rank + housekeep.
// Runs once, when the last kid match is revealed. Keeps `pendingTournament` alive (finished: true)
// so the finale stays a real snapshot; `closeTournament` clears it.
function finalizeTournament(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) {
    world.pendingTournament = null
    return
  }
  const tier = TIERS[event.tier]
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  const points = tier.points[kidFinish] ?? 0
  // ⚠ SHE STOPPED, AND THE OWNER'S RULING IS THAT NOTHING ON THIS LINE CHANGES (10.08: «если травма
  // до матча – ничего не защитываем, если во время – защитываем поражение в текущей ступени»).
  // A retirement is a defeat in the round she reached and pays that round in full - the same finish
  // index, the same points table, the same cheque. There is no partial credit and no haircut, at any
  // level: ITF WTT Regs Women's §XII.C.5.b ("she shall receive the loser's prize money / points for
  // the round in which she retired"), WTA §VIII.B.3.a.i(b) + §IX.C.1.a.ii, ITF Juniors Reg 31 a) i)
  // (where the question does not arise because juniors are paid nothing, ever). See
  // docs/research/retirement-and-withdrawal.md §§2-3 and docs/specs/match-retirement.md §3.
  //
  // ⚠ WHICH IS WHY THIS IS A LOOKUP AND NOT A BRANCH. `retiredRound` is read purely to write the
  // right sentence and to open the injury; the arithmetic above it never sees it. A version of this
  // feature that discounted the points would have needed a reason, and there is not one anywhere in
  // four rulebooks.
  const retiredMatch = kidMatchesOf(p.result).find((m) => m.retiredId === KID_ID)

  // v10: remember the kid's best (smallest) finish index per tier – drives the Home season strip.
  const priorBest = world.bestFinishByTier[event.tier]
  if (priorBest === undefined || kidFinish < priorBest) world.bestFinishByTier[event.tier] = kidFinish

  // v31: ...AND THE CABINET REMEMBERS EVERY ONE OF THEM, which the line above cannot. That is a
  // high-water mark: it holds 0 or 1 and never both, it carries no week, and the day she finally
  // wins a tier it OVERWRITES the runner-up it was holding. Nothing else in the save counts either:
  // `milestones` keeps firsts (one row per tier however many she wins), `results` prunes at 52
  // weeks, `events` at 400. So five J30 titles were, until this line, one row and no years.
  //
  // ⚠ THE TWO ARRAYS ARE DISJOINT: `=== 0` and `=== 1`, never `<= 1`. The milestone capture eight
  // lines below deliberately uses `<= 1`, because reaching a first final is the moment a MEMORY
  // wants and winning it is reaching it. A CABINET is the other question - which piece of
  // silverware came home - and one week produces exactly one piece. Counted the milestone's way,
  // the silver plate would light up the first time she WON something and would then claim a tally
  // of finals she never lost. Runner-up has to be countable on its own or the silver half of the
  // screen is a lie. (See `TierTrophies` in protocol.ts.)
  //
  // No draw, no stream, no reordering - a push onto an array the RNG cannot see. The frozen MAIN
  // capture (41550 / e6b0c709) is untouched by construction.
  //
  // The row is created on demand rather than assumed, and that is v30's lesson written down: a
  // migration runs ONCE, so a save upgraded today holds exactly today's tiers, and the week a tenth
  // rung joins TIER_LADDER every one of those saves reaches this line with no shelf for it. That is
  // precisely how `record[track].wins++` came to throw on `undefined` when `LadderTrack` gained
  // `wta`. `emptyTrophyLedger` already follows the ladder for NEW careers; this makes the existing
  // ones grow a shelf the first time they need one, so no future rung needs a migration at all.
  const cabinet = (world.trophiesByTier[event.tier] ??= { titles: [], finals: [] })
  if (kidFinish === 0) cabinet.titles.push(world.week)
  else if (kidFinish === 1) cabinet.finals.push(world.week)

  // v10: count this season's kid wins/losses as they resolve (never re-parsed from text; pruning
  // can't lose them). Every match on the kid's path is one played match.
  //
  // v28: AND THE SAME MATCH IS COUNTED INTO ITS OWN LADDER, one line further on. This is the whole of
  // the owner's «разделить победы и поражения» and it needs no new fact: the event is right here, the
  // event carries its tier, and the tier carries its track, so the attribution is read rather than
  // decided. The two counters and the pair are maintained together on purpose – the pair is a
  // DECOMPOSITION of the totals, not a replacement for them, and anything that increments one and not
  // the other breaks the invariant the Stats screen shows both halves of.
  const track = tier.track
  const record = (world.seasonRecord ??= emptySeasonRecord())
  for (const m of p.result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    if (m.winnerId === KID_ID) {
      world.seasonWins++
      record[track].wins++
    } else {
      world.seasonLosses++
      record[track].losses++
    }
  }

  // A2: AND THIS IS WHERE THE TENNIS FINALLY PAYS HER (task #17). Same commit point as the points,
  // off the same finish index, out of the tier's own table – so a result cannot award one without
  // the other and a skipped event or a medical withdrawal pays nothing because it never reaches
  // finalize.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08), AND READ THIS BEFORE TRUSTING THE SENTENCE ABOVE.
  // It used to end "...a skipped event or a walkover pays nothing because it never reaches
  // finalize", and a reader took from it the rule that AN INJURY WEEK NEVER PAYS. That rule is now
  // FALSE, and leaving the old wording would have been worse than no comment at all. What is true:
  //
  //   NEVER REACHES FINALIZE (still, and unchanged): a skipped event; the walkover branch in
  //     tickWeek (entered, the layoff covers the week, she never takes the court); the medical
  //     withdrawal. All three are the rulebooks' WITHDRAWAL, not their walkover – see the note on
  //     `arrivalStatus`' verdict and research §1 – and all three correctly pay nothing.
  //   REACHES FINALIZE AND IS PAID IN FULL (new): a RETIREMENT. She took the court and stopped, so
  //     the round she had reached is hers, cheque included. This is the whole of the owner's ruling
  //     and it is also what every rulebook says.
  //
  // The distinguishing question was never "did she get hurt" – it is "did she strike a ball". The
  // real tours price exactly that difference deliberately, to make a player start the match: an ITF
  // first-round WITHDRAWAL "will receive no prize money, and the Tournament shall not count on their
  // record" (§XII.C.5.b.i.2.d) while a retirement in the same round is paid. Two more comments in
  // this file (the appearance fee, ~40 lines down; the run's condition strain, ~70 down) and one in
  // shared/protocol.ts (`SeasonSummary.prizeCents`) leaned on the same invariant and are restated in
  // the same terms.
  //
  // ⚠ NO WEALTH CORRIDOR ON THIS LINE, AND THAT IS THE WHOLE POINT OF IT. Everything else the family
  // touches is priced by where they come from: the trip that got her here was multiplied by
  // ECONOMY.travelBgFactor, the coach is billed in the market they can afford, the physio bill has
  // its own factor. The cheque is not a price, it is what the tournament pays the person who won the
  // match, and a working family and a wealthy one are handed the identical piece of paper. It is the
  // only number in the game of which that is true, and it is what makes the cliff mean the same thing
  // to everybody. If a future slice wants a background-scaled income, it must NOT reach for this one.
  const prize = prizeCentsFor(event.tier, kidFinish)
  if (prize > 0) {
    // ⭐⭐ ROUND-23 #18 – AND FROM EIGHTEEN THE CHEQUE IS SPLIT BEFORE IT REACHES THE FAMILY.
    //
    // The owner: «после появления её счета в банке в 18 начать ей призовые переводить какие-то суммы,
    // например начать с 10-20% и может быть наращивать год к году», and on the ceiling: «может не до
    // 30, а до 40 или 50 вообще, это всё-таки ее карьера?». The ramp is `ECONOMY.kidShare` (10% at
    // 18, +5 a birthday, half from 26); nothing about it is spelled out here.
    //
    // ⚠⚠ IT LEAVES THE FAMILY WALLET, AND THAT IS THE DECISION. `world.fundsCents` receives the
    // family's part ONLY, so a parent watching his daughter's cheques get bigger also watches his own
    // share of them get smaller – which is the mechanic he asked for. The alternative on the table was
    // to credit the wallet in full and tally hers beside it; that costs the player nothing, decides
    // nothing, and «это всё-таки её карьера» is an argument about whose money it is.
    //
    // ⚠ ONE ROUNDING, AND THE FAMILY GETS THE REMAINDER. `kidPrizeShareCents` rounds once and this
    // subtracts, so the two balances add up to the tournament's cheque to the cent – a player can put
    // the two numbers side by side on screen and they must not disagree by a penny.
    //
    // ⚠ THE LEDGER ROW IS WHAT THE FAMILY ACTUALLY BANKED, which is the academy travel subsidy's own
    // precedent one file over: a scholarship's travel half «is taken off the travel line itself, so
    // the ledger shows the reduced price the family actually paid». `careerTotals.prizeCents` follows
    // it and therefore becomes prize money THE FAMILY KEPT – the number the album's break-even page
    // is really about, since the family is the side that did the spending.
    //
    // ⚠ HER REAL AGE (`kidAgeYears`), never the band's – the one-clock ruling of 09.08. Zero draws:
    // this is integer arithmetic on a cheque that has already been decided.
    const ageNow = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    const herShare = kidPrizeShareCents(prize, ageNow)
    const familyShare = prize - herShare
    world.fundsCents += familyShare
    world.kidFundsCents = (world.kidFundsCents ?? 0) + herShare
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'prize',
      // Names the finish, because the whole design is that the player should be able to read this
      // line against the travel line two rows up and feel the arithmetic. Short dash only.
      // ⚠ AND IT NAMES THE SPLIT WHEN THERE IS ONE, because a prize row that quietly shrank by half
      // would read as a bug in the till. Silent before her eighteenth, where nothing is deducted.
      //
      // ⭐⭐ ROUND 26 #5b – ...AND SINCE 25.08 IT NAMES THE MONEY AND NOT ONLY THE RATE. The owner:
      // «неплохо бы об этом где-то игроку сообщать, кстати». The percentage alone cannot be read
      // against the figure beside it: a parent looking at «+$3,250.00 · less her 35% share» has to
      // do the arithmetic to learn what left, and the whole design of this row is that he should be
      // able to READ it. The `info` row two blocks down already carries the cents, but it has no
      // `amountCents` and `snapshot.financialEvents` filters on exactly that – so on the MONEY
      // screen, the one surface a parent opens to look at money, the transfer was invisible. Same
      // rounding, same variable: `herShare` is the cents the account actually received, not a second
      // computation of it, so the two rows can never disagree.
      text:
        herShare > 0
          ? `${tier.label} prize money – ${finishLabel(kidFinish)}, less her ${kidPrizeShareBps(ageNow) / 100}% share (${formatCents(herShare)})`
          : `${tier.label} prize money – ${finishLabel(kidFinish)}`,
      amountCents: familyShare,
    })
    // ...and the transfer itself gets a row of its own, so the money can be followed out of one
    // account and into the other. NO `amountCents`: the family ledger has already recorded what it
    // received, and booking her share as a family EXPENSE would count the same cents twice - once
    // against `careerTotals.spentCents`, which is the denominator of the album's break-even page.
    if (herShare > 0) {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `${world.profile.kidName}'s share of the prize money – ${formatCents(herShare)} into her own account`,
      })
      // ⭐⭐ ...AND THE SAME CENTS ARE PARKED ON THE DURABLE LEDGER, so the week recap can say it too.
      //
      // THE OWNER, 27.08: «на плашке Finances на week recap после турниров можно писать что-то вроде
      // Income $sum / Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее»
      // – and, once shown that subtracting it again would double-count, «(B) мемо под балансом - вот
      // это хорошо, да». So the recap prints it BELOW the balance as a memo and the balance does not
      // move: `Income` there is `familyShare`, already net, exactly as this block decided above.
      //
      // ⚠ NOT ON THE `info` ROW ABOVE, AND THE CHOICE IS MEASURED, NOT STYLISTIC. The recap's
      // Finances tile was moved OFF the event feed on 05.08 because the feed is count-capped
      // (EVENTS_CAP = 400) and the owner's own save at week 412 deleted every money row on the tick
      // that wrote it – see the tile's note in WeekRecapCard.vue: «"the money for one week" is a
      // question a count-capped feed must never be asked.» Her cut for the week is money for one
      // week, so it goes where the tile's other three figures already come from: `financeWeeks`,
      // which prunes on a 60-WEEK window and therefore always holds the week the card is showing.
      //
      // ⚠ `herShare` ITSELF, NOT A RATIO INVERTED BACK OUT of the family's row – the one-rounding
      // rule stated twenty lines up. And the RATE beside it is `kidPrizeShareBps(ageNow)`, the very
      // call the sentence above divides by, so the memo and the ledger row can never quote two
      // different percentages. Zero draws: a state write on a cheque already decided.
      // ⭐⭐ ROUND 29 #10 – AND THE BASE IS `prize`, THE GROSS CHEQUE, not the `familyShare` the row
      // two blocks up reports. That distinction IS the item: the ledger row is deliberately «what
      // the family actually banked», so the only prize figure any screen could reach was already
      // net of the very cut the memo was quoting a percentage of.
      // ⭐⭐⭐ ROUND 30 #21 – tagged `prize`, so the week recap can name HER RAMP («50% of every prize
      // cheque», the rule the budget screen states) instead of averaging it with a brand cheque that
      // splits under a different rule entirely. The rate handed in is unchanged.
      accrueKidShare(world, world.week, herShare, kidPrizeShareBps(ageNow), prize, 'prize')
    }
    // ⭐⭐ ROUND-24 – AND THE TEAM IS PAID ON THE RESULT (owner 22.08, docs/plans/the-team-share.md
    // §3 as re-ruled). His model verbatim: «3млн призовые из них отчисляется процент дочери (скажем
    // 30 для примера) и тренеру (скажем 10 для примера) – это будет 900к дочери и 300к тренеру плюс
    // остальные расходы» – and the masseur joined the same day, smaller («может по-меньше чем
    // тренеру, но давать»). A UNIVERSAL rule, not a contract form: computed here from `ECONOMY`
    // constants and the finish, nothing persisted, nothing chosen at hire – the architect's
    // form-choice design is dead by the owner's own ruling.
    //
    // ⚠ TITLES AND FINALS ONLY («за победы или 2е места», «за 2е только по-меньше») – below a
    // final `staffPrizeShareCents` returns 0 and no row is written. PRO TOUR ONLY (`track ===
    // 'wta'`): junior tennis is not the convention's world and its cheques are pocket change.
    // INDEPENDENT OF ANY TRAVEL SWITCH – «тренер может не ездить, но долю получать … вполне
    // может» – but only a FILLED seat: a self-coached family owes no coach share and an empty
    // table no masseur share.
    //
    // ⚠ BOTH SHARES OFF THE GROSS, EACH ROUNDED ONCE, THE FAMILY KEEPS THE REMAINDER – the kid
    // ramp's own discipline, fourth and fifth hands on the same cheque: her share is untouched
    // above, and funds move by familyShare − coachShare − masseurShare, so the four pieces re-add
    // to the tournament's cheque to the cent.
    //
    // ⚠ EXPENSE ROWS, NOT A SMALLER INCOME ROW, and the categories are the seats' own: the coach's
    // share lands under `coaching` and the masseur's under `staff`, so the Money screen's
    // breakdown, the season wrap and `careerTotals.spentCents` all absorb them through `addEvent`'s
    // one choke point with no second tally – the coaching line the wrap prints simply stops lying
    // by never having been given the chance. Zero draws: integer arithmetic on a decided cheque.
    const coachShare = track === 'wta' && world.coachId !== null ? staffPrizeShareCents('coach', prize, kidFinish) : 0
    if (coachShare > 0) {
      world.fundsCents -= coachShare
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'coaching',
        // No pronoun names the coach (R15-7 – women are on every roster by construction).
        text: `Coach's share of the prize money – ${staffResultShareBps('coach', kidFinish) / 100}% of the ${tier.label} cheque`,
        amountCents: -coachShare,
      })
      // ⭐⭐ ROUND 29 PART TWO #13 – AND THE SAME CENTS ARE PARKED ON THE DURABLE LEDGER, so the
      // WEEKLY screen can name them. The owner, 29.08: «вот и можно как раз добавить cut тренера на
      // weekly экране для прозрачности». Part-one #13 put the RULE on the coaches page; this is the
      // FIGURE, on the week he actually reads.
      //
      // ⚠ NOT ON THE EXPENSE ROW ABOVE, AND THE CHOICE IS THE ONE HER CUT ALREADY MADE, MEASURED:
      // the recap's Finances tile was moved off the event feed on 05.08 because the feed is
      // count-capped (EVENTS_CAP = 400) and a save at week 412 deleted every money row on the tick
      // that wrote it. «The money for one week» is a question a count-capped feed must never be
      // asked, so this goes where the tile's other figures come from – `financeWeeks`, pruned on a
      // 60-WEEK window and therefore always holding the week the card is showing.
      //
      // ⚠ `coachShare` ITSELF and `staffResultShareBps` ITSELF, the same two values the row above
      // prints and the wallet was debited by, so the memo and the ledger row can never quote two
      // different percentages. ⚠ It does NOT re-book the money: `accrueCoachCut` writes a memo
      // field, never `byCategory` – the expense is the row above and it is counted exactly once.
      // Zero draws: a state write on a cheque already decided.
      accrueCoachCut(world, world.week, coachShare, staffResultShareBps('coach', kidFinish))
    }
    const masseurShare = track === 'wta' && (world.masseurHired ?? false) ? staffPrizeShareCents('masseur', prize, kidFinish) : 0
    if (masseurShare > 0) {
      world.fundsCents -= masseurShare
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'staff',
        text: `Masseur's share of the prize money – ${staffResultShareBps('masseur', kidFinish) / 100}% of the ${tier.label} cheque`,
        amountCents: -masseurShare,
      })
    }
    // D10 + R15-5: THE FIRST CHEQUE IS A MILESTONE (owner, 01.08: «я believe it's a very memorable
    // moment»). The first week the tennis pays her anything at all - after years of the family
    // paying for everything - is a beat the career keeps: captured into the durable ledger (one row
    // per career, `milestoneKey` collapses repeats) and fired once into the feed with the real
    // figure on it, because "$130 for a first-round exit" and "$2,200 for the title" are different
    // memories and the ledger line two rows up already taught the player to read the number.
    // Same commit point as the cheque itself, so a walkover or a skip can never fire it. Zero draws.
    captureMilestone(world, { type: 'prize', week: world.week, tier: event.tier })
    fireMilestone(
      world,
      'first-prize',
      `💰 First prize money – $${Math.round(prize / 100).toLocaleString('en-US')} at the ${tier.label}!`,
    )
  }

  // A3 (W3-ACT2 §7): AND THE BRAND PAYS TOO, at the same commit point and for the same reason. An
  // APPEARANCE FEE is money for being on the poster and a RESULT BONUS is a share of the cheque she
  // just won - both are the professional rungs' own terms (tour / premium / icon), both are zero
  // while no such deal is running, and both are frozen onto the signed offer rather than re-read
  // from ECONOMY, so a contract is honoured under the numbers it was signed under.
  //
  // ⚠ COMMITTED HERE AND NOWHERE ELSE, which is what makes an appearance fee conditional on
  // APPEARING: a skipped event, a walkover or a medical withdrawal never reaches finalize, so
  // neither line pays. And neither scales with the wealth corridor - see the prize note above, which
  // is the same rule for the same reason.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08). "Conditional on APPEARING" is still exactly right,
  // and the retirement is the case that shows what the word was always doing: she DID appear. She
  // was on the poster, she walked out, she played. So both lines pay on a retirement, and that is
  // not a loophole – an appearance fee is money for being there, and she was. What still pays
  // nothing is the trio that never reaches this function: a skipped event, the injury walkover and
  // the medical withdrawal, none of which put her on a court. See the fuller restatement above the
  // prize money.
  //
  // ⭐⭐ ROUND-28 #15 – AND BOTH ARE SPLIT WITH HER, at the ramp the prize money above already uses.
  // The owner: «С чеков спонсоров мне кажется ребёнку тоже нужно % перечислять, как и с призовых».
  // `bankSponsorCheque` credits the family and her from ONE rounding and writes both rows – the
  // whole ruling, and the list of which sponsor money it does and does not reach, is in its header
  // in world/sponsors.ts. The RESULT BONUS is the sharpest case there: it is literally a fraction of
  // the very cheque split forty lines up, so leaving it whole would make her realised share of a
  // winning week fall as sponsorship grows.
  const appearance = appearanceFeeFor(world, event.tier)
  if (appearance > 0) {
    bankSponsorCheque(world, appearance, { category: 'income', text: `Appearance fee – ${tier.label}` })
  }
  const bonus = resultBonusFor(world, event.tier, kidFinish)
  if (bonus > 0) {
    bankSponsorCheque(world, bonus, {
      category: 'income',
      text: `Sponsor bonus – ${finishLabel(kidFinish)} at the ${tier.label}`,
    })
  }

  // R9-7: the run's physical toll lands HERE, when it commits – per-match, not flat per tier.
  // A skipped event week (R9-9) or a walkover never reaches finalize, so neither costs strain.
  //
  // ⚠⚠ RESTATED BY THE RETIREMENT SLICE (10.08). A RETIREMENT DOES REACH FINALIZE, so it DOES cost
  // strain – and it costs the honest amount without a rule of its own, which is the point worth
  // recording. `tournamentRunStrain` folds `matchDrain` over the run's records and `matchDrain`
  // reads the SCORELINE; a retirement's scoreline is the partial one she stopped at, so a match she
  // walked off after five games is priced as the shorter thing it was. Her body then takes the
  // layoff on top, opened below by `retirementInjury` – so the week charges her for the tennis she
  // played and for the injury separately, which is the truth of it.
  // ⭐ v59 STEP 2 – AND THE HANDS THAT MADE THE TRIP TAKE SOME OF IT BACK (the owner's deep-run
  // question, «влияет ли он на восстановление на глубоких играх»). `masseurTourRelief` is per
  // NIGHT BETWEEN ROUNDS – × (matches − 1), capped at the strain – so a first-round exit buys
  // nothing and a title week buys the most, which is the fare pricing exactly the thing it
  // insures. Gated on `p.masseurThere`, written in the arm that CHARGED the fare: the bill and
  // the effect are one decision about one week by construction. Zero draws on any stream.
  const runMatches = kidMatchesOf(p.result)
  const runStrain = tournamentRunStrain(event.tier, runMatches)
  const tourRelief = masseurTourRelief(runMatches.length, runStrain, p.masseurThere ?? false)
  world.condition = clamp(
    world.condition - (runStrain - tourRelief),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // The receipt, on a run deep enough to have really used the table – the legibility half of the
  // plan's §4 law, one bounded line per tournament. Quiet on shallow weeks: a beat for every
  // R1 exit would teach the player the line means nothing.
  if (tourRelief > 0 && runMatches.length >= 3) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: 'Deep week, fresh legs – the table work on tour kept the run from eating her.',
    })
  }
  // ⭐ ...AND THE WEEK HE BOARDED IS BILLED PER MATCH (owner 22.08: «на неделе выезда по-матчевая
  // цена заменяет недельную»). `resolveMasseur` stood the weekly rung bill down when the play arm
  // recorded `masseurThere`; this is the replacement, at the one point the matches are known –
  // matches played × the $75 session, so a Slam title week is 7 × $75 = $525 (exactly the daily
  // rung's home week) and a first-round exit is one session. Charged off the recorded fact, not
  // the current hire – he made the trip whatever the family decided since (the round-21 #2
  // doctrine). Fare on top, exactly as at home. Zero draws.
  if (p.masseurThere ?? false) {
    const tourBill = masseurTourWeekCents(runMatches.length)
    if (tourBill > 0) {
      world.fundsCents -= tourBill
      addEvent(world, {
        week: world.week,
        type: 'expense',
        category: 'staff',
        text: `Masseur on tour – ${runMatches.length} ${runMatches.length === 1 ? 'match' : 'matches'} worked, billed per match`,
        amountCents: -tourBill,
      })
    }
    // A trip he MADE settles any older return debt too: the between-rounds relief was this
    // week's work, and the return she comes home from is this tournament's, not a stale one's.
    delete world.masseurReturnDue
  } else if (world.masseurHired ?? false) {
    // ⭐ THE RETURN-WEEK SESSION'S MARK (owner 22.08: «довесить послетурнирное восстановление 1
    // сеанс массажа по возвращении»): he was NOT flown, so the first non-played week after this
    // run gets one extra session's worth of recovery – settled and receipted by
    // `resolveMasseurReturn`. Written at the commit point for the same reason the cheque is: a
    // walkover, a skip or a medical withdrawal never reaches finalize, and none of them is a trip
    // to return from. Overwriting an unspent older mark is correct – she has been home since.
    world.masseurReturnDue = world.week
  }

  // Effective ranking delta = kid's windowed best-6 sum after adding the result minus before.
  //
  // THE KID'S ROW IS STILL AWARD-ONLY, deliberately (fix/rival-fatigue-rows). The cohort's rows
  // became APPEARANCE rows because the ledger is the only record rival fatigue has; the kid needs
  // no such record – her run's strain is charged directly, twenty lines above, off the very match
  // list that produced it. What she does still read out of the ledger is `playedWeeksInTrailing4`
  // (the consecutive-play multiplier on injury risk), and THAT is under-counting a week she lost
  // her opener in, exactly as rival fatigue was. It is left alone here on purpose: it moves injury
  // exposure, which is a tuning decision with its own targets, and folding it into this slice would
  // make the cohort-fatigue measurement unattributable. Flagged for the owner in the commit message.
  // ⚠ IN THE EVENT'S OWN TRACK, AT THAT TRACK'S WINDOW WIDTH (W2-LADDER §3 - and a latent bug
  // fixed by the same stroke). This pair used to fold the WHOLE ledger with no track filter, so
  // the "best 6" being diffed was a mixed-currency pool: a girl carrying a J300-heavy book who
  // won a W15 was told "does not improve best 6" about a table her result plainly improved,
  // because the junior 300s crowded the mixed six. The suffix now diffs the one table the result
  // pays into, under that table's own N - which is what the sentence always claimed to mean.
  // (`track` is the v28 attribution const a few lines up - the same fact, read once.)
  // ⚠ AND UNDER THAT TABLE'S OWN WINDOW TOO (round 23 #12/#13, 19.08). This pair folded ROLLING for
  // every track, so once the domestic table became season-to-date the diary could say "does not
  // improve her best 6" about a result the table plainly improved – a sentence wrong in the one place
  // the player is looking when she reads it. The window is the table's fact, exactly like `bestN`
  // beside it, so it is asked for by the same key rather than assumed.
  const window = WINDOW_BY_TRACK[track]
  const before = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track), window)
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: event.tier })
  const after = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track), window)
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text:
      `${tier.label} (${event.surface}, ${weekLabel(event.week)}): ${world.profile.kidName} – ` +
      // ⚠ A CLAUSE ON THE END, NOT A REPLACEMENT FOR THE FINISH. `finishLabel` is a NOUN – she is the
      // Semifinalist, and she still is: that is the owner's ruling («защитываем поражение в текущей
      // ступени») and it must be the first thing the line says, unqualified and with the points
      // beside it. What no existing token can say is that she did not finish, and a week that ended
      // with her walking off court must not read identically to a week she was beaten in. So the
      // clause comes AFTER the arithmetic, which is the sentence doing its second job: the player
      // reads "Semifinalist (+30 pts) – she retired hurt" on one line and learns the rule (the round
      // she reached is hers, in full) without ever being told it.
      `${finishLabel(kidFinish)} (+${points} pts)${rankingDeltaSuffix(points, after - before, BEST_N_BY_TRACK[track], after === 0)}${retiredMatch ? ' – she retired hurt' : ''}`,
    finishIdx: kidFinish,
  })
  // ...AND THE BODY GETS ITS BILL. Opened here, at the commit point, for the same reason the cheque
  // is: the run is over and its result is final, so nothing that follows can be re-decided by it.
  //
  // ⚠ AFTER the summary line and BEFORE the champion's, so the feed reads in the order it happened –
  // she stopped, the run is scored, the clinic says how long. `retirementInjury` emits its own
  // `'injury'` event and its own scans expense, sweeps the entries the layoff swallows and retires a
  // live knock, exactly as an ordinary onset does; it draws only from `seed:retire:<week>`.
  //
  // ⚠ AND IT CANNOT DOUBLE-OPEN ONE. `finalizeTournament` returns at its first line when `p.finished`
  // (the reveal trio all pass through it, more than once by construction), so this runs exactly once
  // per run. `rollInjury` at step 1c has already run this week and found her healthy – if it had
  // not, the walkover branch in `tickWeek` would have resolved the week and no run would exist to
  // finalize.
  if (retiredMatch) retirementInjury(world)
  // World news: who actually took the title of the draw she played in. When the kid IS the
  // champion, the summary + first-title milestone already celebrate it, so only report others.
  const championId = Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0]
  if (championId && championId !== KID_ID) {
    // A W draw's champion can be a field pro now (living-field phase W, 01.08), and she is in
    // neither the cohort nor `players` unless the kid met her – so the derived field is the third
    // place to ask before falling back to the raw id.
    const champName =
      world.cohort.find((c) => c.id === championId)?.name ??
      p.players[championId]?.name ??
      (isFieldProId(championId) ? fieldProsOf(world).find((c) => c.id === championId)?.name : undefined) ??
      championId
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `🏆 ${formatShortName(champName)} won the ${tier.label} (${event.surface}).`,
    })
  }
  if (kidFinish === 0) fireMilestone(world, 'first-title', `🏆 First career title: ${tier.label}!`)
  // D10: the durable ledger remembers the FIRST title and the FIRST final per tier, at the moment
  // they land. A title week captures both – reaching the final is part of winning it.
  if (kidFinish === 0) captureMilestone(world, { type: 'title', week: world.week, tier: event.tier })
  if (kidFinish <= 1) captureMilestone(world, { type: 'final', week: world.week, tier: event.tier })
  if (
    event.tier === 'national' &&
    p.result.matches.some((m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID)
  ) {
    fireMilestone(world, 'first-national', '🏆 First win at National level!')
  }
  recomputeRankAndMilestones(world)
  housekeep(world)
  // W2-ENDINGS: the deferred step 7. A reveal week's money is not settled until here – the entry
  // fee and the travel went out on the tick, the cheque comes in on this line – so a bankruptcy
  // check on the tick would have been reading a balance that was about to change.
  resolveEndings(world)
  p.finished = true
}

/** ONE revealed kid match: the `match` row itself, and – when the girl across the net could not
 *  finish – the one news row that says so (round 23 #3b).
 *
 *  ⚠ IT SITS RIGHT UNDER THE MATCH IT IS ABOUT, and that is the whole reason it is emitted here
 *  rather than beside the champion line in `finalizeTournament`: the feed then reads in the order
 *  the week happened – the scoreline, then why it stopped – and it reads the same whether the player
 *  watched the reveal round by round or hit "Skip tournament". Both paths call this, which is also
 *  why it exists: two copies of the emit is exactly how the two paths drift apart.
 *
 *  ⚠ TYPE `'info'`, NOT `'injury'` – the same ruling `world/knock.ts` records for the same reason:
 *  `'injury'` is a row about HER body, and the Memory card's first-injury milestone reads that
 *  channel. Nothing has happened to the kid here. ZERO RNG. */
function emitKidMatch(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): void {
  const ev = kidMatchEvent(world, event, m, players)
  addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
  const hurt = rivalRetirementNews(world, event, m, players)
  if (hurt) addEvent(world, { week: world.week, type: 'info', text: hurt })
}

/** Reveal ONE more kid match: emit its News `match` event, bump `revealedRounds`, and finalize the
 *  run once the kid's last match (elimination or the final) has been shown. Idempotent when done. */
export function revealTournamentRound(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  //
  // ⭐⭐⭐ ROUND 26 #6 – AND THE COLLEGE LEAGUE COMES DOWN THIS ROAD. The owner: «в чем проблема
  // использовать наш флоу турниров полностью… Я уже просил это сделать». The dispatch is here rather
  // than in the worker because the engine is where every command is re-validated (invariant 1), and
  // it is THREE LINES rather than a parallel command set because that is what «полностью» means:
  // `TournamentFlow`'s Watch, Skip all rounds and Continue reach the college reveal by the same
  // store action, the same worker case and the same engine entry point they always used.
  if (collegeLeagueRevealOpen(world)) return revealCollegeLeagueRound(world)
  // ⭐⭐⭐ ROUND 27 #6 – AND THE NATIONS CUP TIE COMES DOWN THE SAME ROAD, for round 26 #6's reason
  // said once more: the owner asked for «обычный флоу турнира», and a second command set would be a
  // second place for a reveal to strand. One line per command, exactly as the championship took.
  if (callUpRevealOpen(world)) return revealCallUpRubber(world)
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  const m = kidMatches[p.revealedRounds]
  if (!m) {
    finalizeTournament(world)
    return
  }
  emitKidMatch(world, event, m, p.players)
  p.revealedRounds++
  if (p.revealedRounds >= kidMatches.length) finalizeTournament(world)
}

/** Reveal every remaining round at once, then finalize – the "Skip tournament" path to the finale. */
export function skipTournament(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  // ⭐⭐⭐ ROUND 26 #6 – the college reveal's «Skip all rounds», by the same dispatch as one door up.
  if (collegeLeagueRevealOpen(world)) return skipCollegeLeagueRounds(world)
  // ⭐⭐⭐ ROUND 27 #6 – the tie's «Skip all rounds», by the same dispatch as one door up.
  if (callUpRevealOpen(world)) return skipCallUpRubbers(world)
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  while (p.revealedRounds < kidMatches.length) {
    emitKidMatch(world, event, kidMatches[p.revealedRounds], p.players)
    p.revealedRounds++
  }
  finalizeTournament(world)
}

/** Dismiss a finished reveal (the finale's "Continue"): clear the pending state so the week closes. */
export function closeTournament(world: WorldState): void {
  // ⚠ W2-ENDINGS – DELIBERATELY NOT `guardNotEnded`, AND THE REASON IS A MEASURED BUG. The reveal
  // trio completes an action that STARTED before the ending: `resolveEndings` runs at the end of
  // `finalizeTournament`, while `pendingTournament` is still set and waiting to be closed, so a
  // career that goes bankrupt on the very week it plays a tournament latches with the reveal still
  // open. Guard these and that career can never clear `pendingTournament` – which is the one piece
  // of state `advanceWeeks` refuses to tick past. The mutating commands that are DECISIONS (entries,
  // bookings, hires, offers, kit) are the ones the guard belongs on; finishing a week already in
  // flight is not a decision. Found by tests/travel-home.test.ts, which plays a real career.
  // ⭐⭐⭐ ROUND 26 #6 – the college reveal's finale «Continue», by the same dispatch. Answering it is
  // what lets `resumeFromCollege` spend the rest of the year, exactly as closing a tour reveal is
  // what lets `advanceWeeks` tick again.
  if (collegeLeagueRevealOpen(world)) return closeCollegeLeagueReveal(world)
  // ⭐⭐⭐ ROUND 27 #6 – the tie's finale «Continue». Answering it is what lets `resumeFromCollege`
  // spend the rest of the year, exactly as answering the championship's does.
  if (callUpRevealOpen(world)) return closeCallUpReveal(world)
  world.pendingTournament = null
}

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

// --- lifecycle ---------------------------------------------------------------
export function createWorld(
  seed: string,
  profile: PlayerProfile = DEFAULT_PROFILE,
  careerId: string = `legacy-${seed}`,
): WorldState {
  const fundsCents = STARTING_FUNDS_CENTS[profile.background]
  const cohort = generateCohort(seed)
  // Ladder-up Part A: the cohort arrives with a season already behind it (season/prehistory.ts),
  // so week-1 entrant fields are ranking-MEANINGFUL and the standings are not a 199-way tie at 0.
  // Rows sit at NEGATIVE weeks [-51, -1]; they count inside the existing rolling-52 window at
  // week 0 and are pruned away by the normal `world.week - r.week <= RESULTS_WINDOW` rule as the
  // first season runs – NO new field and NO schema bump. Audited before adopting the shape: the
  // only week-sensitive reads over `results` are pruneResults, computeRanking/windowedBestSum
  // (all three use the same `<= WINDOW` difference, which is sign-agnostic), playedWeeksInTrailing4
  // and computeCountingResults (KID-only, and pre-history is AI-only), and maybeFireSeasonWrapUp's
  // `inRange` (`w >= yearStart`, so negative weeks are excluded from every season figure). Nothing
  // clamps a result week at 0 and nothing feeds a result week to weekYear.
  // The kid gets NO pre-history: she still starts on 0 points and reads "Unranked".
  const world: WorldState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    careerId,
    seed,
    week: 0,
    // v35: the MAIN stream is born at position zero, ON the world. From here on the position and
    // the career are one object — the worker resumes from this pair and its draws advance it.
    rngMain: initMainState(seed),
    fundsCents,
    // v54: her own account opens empty and stays empty until the first cheque after her eighteenth –
    // `kidPrizeShareBps` returns 0 for every week of the junior story, so this is not a placeholder,
    // it is the true balance for the first four seasons of every career.
    kidFundsCents: 0,
    profile,
    plan: { ...WEEK_PLAN_PRESETS.balanced },
    cohort,
    results: generatePreHistory(seed, cohort),
    season: [],
    entries: [],
    events: [],
    nextEventId: 0,
    // Placeholder only – recomputeKidRank below replaces it with the real value (last, behind the
    // whole cohort, because she is the only player without a counting result).
    kidRank: cohort.length + 1,
    prevKidRank: null,
    // Both shut. She starts on zero points in every table, so she has cleared nothing - and the
    // `recomputeKidRank` at the end of this function will not open them either, which is the on-ramp
    // doing its job. The FIRST thing this game asks of her is to earn her way onto the domestic
    // table, and that has not changed.
    onRampCleared: { itf: false, wta: false },
    // Phase 4: her starting build is the SAME derivation that used to be recomputed on demand, so
    // week 0 is byte-identical to the pre-development engine. What changed is that it is now state,
    // and state moves.
    // ⚠ TASK 55 – AND THE HEAD START HER BIRTH MONTH BOUGHT HER. `startingSkills` stays the pure birth
    // derivation (the build she was BORN with, seed-only, and the radar's baseline for every existing
    // save); this adds the eleven months of extra training a January girl has had by the time the game
    // opens. Applied HERE rather than inside `startingSkills` for two reasons: that function is
    // documented as the birth build and two girls with the same seed really do have the same one, and
    // every save written before this existed keeps a radar baseline that has not moved.
    // POST-DRAW arithmetic, so no stream is touched.
    skills: withHeadStart(startingSkills(seed, profile), profile.birthMonth),
    // ⚠ THE CEILING IS ROLLED OFF THE BIRTH BUILD, NOT THE HEAD-STARTED ONE. `rollPotential` adds a band
    // on top of where she starts, so feeding it the head start would hand the January girl a higher
    // CEILING as well as a better start - turning a timing effect into a talent effect, which is exactly
    // what task 55 must not become. Being born in January does not make her able to get better.
    potential: rollPotential(seed, startingSkills(seed, profile)),
    // Nobody is backing her yet. The first review is the season boundary at week 52 – she has to
    // put a year in front of them before anyone writes a letter.
    academy: null,
    // R12-S1: season 0's start rank is set below, once `recomputeKidRank` has produced the real
    // value – she starts dead last behind the whole cohort, because she is the only player without
    // a counting result, and that is a true and meaningful thing for her first wrap-up to say.
    seasonStartRank: null,
    pendingTournament: null,
    bestFinishByTier: {},
    // v31: eighteen empty shelves. She has won nothing, and the cabinet says so by showing her all
    // eighteen things she has not won yet.
    trophiesByTier: emptyTrophyLedger(),
    lastSeasonSummary: null,
    seasonHistory: [],
    seasonWins: 0,
    seasonLosses: 0,
    seasonRecord: emptySeasonRecord(),
    // v45: week 0 IS season 0's first week, so a career born here is tracked from its first entry and
    // its very first wrap-up can print the line. `emptySeasonEntries` is shared with the wrap's reset
    // and with the migration, which needs the same shape from a different starting week.
    seasonEntries: emptySeasonEntries(0),
    financeWeeks: [],
    condition: ECONOMY.condition.start,
    injury: null,
    injuryHistory: [],
    physioActive: coachIncludesPhysio(profile.coachTier),
    // v23: onboarding picks a RUNG, so the world picks the person on it - the coach at that rung
    // who suits her game best, and the cheapest of those when several tie. That is what a parent
    // walking into an academy and saying "we can afford this much" actually gets, and it means a
    // career opens with a real named coach rather than an abstraction.
    coachId: openingCoachId(seed, profile),
    // Default OFF - the automatic rule is that competition weeks are not coach weeks.
    coachOnEventWeeks: false,
    // ...and the junior half is OFF under the same rule, which is also what every career shipped
    // before v49 wakes up as. Turning it on is a decision the player takes on screen T, warned.
    coachOnJuniorEvents: false,
    vacations: [],
    practices: [],
    recoveryBuff: null,
    // W4: nothing hurts yet, and nothing is on her record. Week 1 is the earliest a knock can arrive
    // (rollKnock runs after the week's work), which is right - she has to train before she can pull
    // something doing it.
    knock: null,
    knockHistory: [],
    // ⭐ v48: no birthday has been lived yet. Her FIRST one lands on whatever week the calendar puts
    // it – a girl born in February has it inside the opening month, a December girl waits eleven.
    birthdays: [],
    // v32: nobody has written to her yet, and nobody can until she has put a season in front of
    // them. The first review is the season boundary at week 52 - the same moment the academy makes
    // up its mind, and for the same reason.
    offers: [],
    milestones: [],
    internationalEntryWeeks: [],
    proEntryWeeks: [],
    // The penalty ledger and the tour's own sentence (v38, W3-ACT2 §6). A fresh career owes the
    // tour nothing and is not serving anything - both are the identity, so the migration's back-fill
    // is the same pair.
    penalties: [],
    suspendedUntilWeek: null,
    // v37: the shipped rung on every line. She turns up with the frame most juniors own - the ladder
    // runs one rung below it and two above, and which way she goes is the parent's money.
    kit: defaultKitState(),
    // W2-ENDINGS (v39). Every one of these is the identity: the story has a next week, the family is
    // solvent, nothing has been earned or spent, nobody has been asked anything and she has not been
    // to college. The migration's back-fill is the same set, for the same reason.
    ending: null,
    debtSinceWeek: null,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    fork: null,
    retirementOffer: null,
    oneMoreYearCount: 0,
    college: null,
    // v59: no masseur on day one – he is pro-career gated, and the hire is a decision, never a
    // default. ⚠ LAST KEYS OF THE LITERAL, deliberately: the frozen-career identity in
    // tests/coach-travel-edge.test.ts reproduces the pre-v59 hashes by dropping exactly these
    // three keys, which only works while the rest of the serialisation order is untouched. The
    // dial opens on the middle rung (the professional default the pricing is anchored to) and the
    // travel stance opens OFF – the coach's own default: the switch is what buys the seat.
    masseurHired: false,
    masseurSessionsPerWeek: ECONOMY.masseur.defaultSessions,
    masseurTravels: false,
    // ⭐ v62 (the long goodbye, step 1): the best her body has ever been. On week 0 that is the body
    // she turned up with – a running maximum's identity element is its first observation, and there
    // is no earlier week to have been better in. `world/phaseGrowth.ts` raises it from here.
    // ⚠ THE HEAD-STARTED BUILD, deliberately: it is `skills` above, which is what the tick will
    // compare against from week 1. Seeding the birth build instead would put the January girl's
    // eleven months of extra training on the wrong side of her own peak.
    // ⚠ LAST KEY OF THE LITERAL, for the reason the masseur's three above give: the frozen-career
    // identity in tests/coach-travel-edge.test.ts reproduces the pre-v62 hashes by dropping exactly
    // this key, which only works while the rest of the serialisation order is untouched.
    peakPhysical: physicalMean(withHeadStart(startingSkills(seed, profile), profile.birthMonth)),
    // ⭐ v63 (the shop, slice 1): the family owns nothing on day one. Empty is the identity here in
    // the plainest sense: nothing has been bought yet.
    // ⚠ THIS NOTE USED TO SAY «and the shelf is not even visible – it opens with her professional
    // career (`shopUnlocked`)». Round 29 part two #6 deleted that gate on his ruling («магазин
    // открыт всегда с начала игры»), so the shelf IS visible from week 0 and the family simply owns
    // nothing on it – see the block where the gate stood, in world/shop.ts.
    // ⚠ LAST KEY OF THE LITERAL, for the reason the masseur's three and `peakPhysical` above give:
    // the frozen-career identity in tests/coach-travel-edge.test.ts reproduces each older schema's
    // hashes by dropping exactly the keys appended since, which only works while every key stays in
    // the order it was appended in.
    assets: [],
  }
  addEvent(world, {
    week: 0,
    type: 'info',
    keep: true,
    text: `${profile.kidName}'s career started (seed "${seed}"). Family budget: $${(fundsCents / 100).toLocaleString('en-US')}.`,
  })
  ensureSeason(world)
  recomputeKidRank(world)
  world.seasonStartRank = world.kidRank // R12-S1 – see the field above
  return world
}

// --- v35: the ONE remaining replay, and the budget its verifier is bounded by --------------------

/** The probe replay: a fresh world on the same seed, ticked `weeks` times, drawing through a
 *  resumed position so the returned state carries BOTH the register and the count.
 *
 *  This is byte-for-byte what the worker's `restoreRng` used to do on EVERY load. Under v35 it has
 *  exactly two callers left, and both are terminal: the v34 -> v35 migration (which stamps its
 *  output into the save, once per career, and never runs again) and the worker's
 *  `recoverMainState` (reachable only from a failed consistency check on a corrupted save). It is
 *  valid for the same reason the old replay was — the per-week MAIN draw count is independent of
 *  player input, so a probe with no entries walks the same positions the real career did — and it
 *  is best-effort in the same way too: it replays under CURRENT code, so it lands where current
 *  code says, not where history did. v35 freezes that answer once instead of re-rolling it on
 *  every load for ever (see the migration block's note in migrations.ts). */
export function replayMainState(seed: string, profile: PlayerProfile, weeks: number): MainRngState {
  const st = initMainState(seed)
  const rng = resumeMain(st)
  const probe = createWorld(seed, profile)
  for (let w = 0; w < weeks; w++) tickWeek(probe, rng)
  return st
}

/** The MOST MAIN draws `weeks` of career can legitimately have spent — the plausibility half of
 *  the load-time verifier (the redundancy check `mainStateConsistent` is the other, sharper half).
 *
 *  Derived from what the weekly tick actually spends TODAY, not from a remembered cost table:
 *  `resolveBaseCosts` draws 3 (jitter, flavor, sponsor roll) plus 1 more when the roll hits, and
 *  `driftCohort` draws exactly 4 per rival (see the tick's own header) — so a week costs at most
 *  4 + 4×field. The 8 keeps the bound GENEROUS on purpose: it is corruption detection, not
 *  accounting, and a bound that has to be re-derived every time a draw is added would be the old
 *  frozen-capture tax wearing a new hat. Floored at COHORT_SIZE because the draws were made
 *  against the GENERATED field: a v6/v7-era fixture persists a trimmed shape-sample of its
 *  cohort, but the probe that computed its position drifted all 199. */
export function maxMainDraws(weeks: number, cohortSize: number): number {
  return weeks * (8 + 4 * Math.max(cohortSize, COHORT_SIZE))
}

/** Hydrate the Phase-3 systems onto a pre-v6 save. Idempotent for v6+. */
export function seedWorldForV6(save: Partial<WorldState> & { seed: string; week: number; log?: string[] }): void {
  save.cohort = generateCohort(save.seed)
  save.results = []
  save.entries = []
  save.internationalEntryWeeks = []
  save.proEntryWeeks = []
  save.penalties = []
  save.suspendedUntilWeek = null
  save.season = []
  save.nextEventId = 0
  const oldLog = Array.isArray(save.log) ? save.log : []
  save.events = oldLog.map((text) => ({ id: save.nextEventId!++, week: save.week, type: 'info' as const, text }))
  save.kidRank = save.cohort.length + 1
  save.pendingTournament = null
  save.bestFinishByTier = {}
  save.lastSeasonSummary = null
  save.seasonHistory = []
  save.seasonWins = 0
  save.seasonLosses = 0
  save.financeWeeks = []
  save.condition = ECONOMY.condition.start
  save.injury = null
  save.injuryHistory = []
  save.physioActive = coachIncludesPhysio(save.profile?.coachTier ?? DEFAULT_PROFILE.coachTier)
  save.coachId = openingCoachId(save.seed, save.profile ?? DEFAULT_PROFILE)
  save.coachOnEventWeeks = false
  save.vacations = []
  save.practices = []
  save.recoveryBuff = null
  save.milestones = []
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  // R12-S1 (v17): a pre-v6 save carries no season history at all, so the honest value for "the rank
  // she entered this season on" is the one the rebuilt world has right now.
  save.seasonStartRank = save.kidRank ?? null
  delete save.log
}

// --- R8-7a, RETIRED 05.08: AN ENTRY ALREADY TAKEN IS HONOURED -------------------------------------
//
// THE STEP THAT USED TO BE HERE. `releaseOutgrownEntries` ran at the top of every tick, walked the
// still-refundable (pre-deadline) entries, and cancelled any whose rung had closed under her -
// refunding the fee and writing «Entry released – she's outgrown W50. Fee refunded.» into the feed.
// Both ceilings triggered it: `outgrewTier` (her domestic points passed the band) and `tierOutgrown`
// (the ladder's own sliding window, act2-pro-tour.md §11). It was read from a real rule - «players
// out of band at close are removed and refunded» (owner 25.07) - and applied to the wrong moment.
//
// ⚠ THE OWNER PLAYED IT AND IT WAS WRONG (05.08): «моя уже 22 летняя выиграла 2 w50 подряд и ее
// автоматом сняли с 3-го письмом без объяснения причины – я понимаю, что она переросла, но это
// ощущается очень странно. Надо поправить.» She won two W50s, the points those wins earned closed
// the rung, and the game cancelled the W50 she had ALREADY ENTERED.
//
// ⚠⚠ IN THE SPORT, ACCEPTANCE INTO A DRAW IS NOT REVOKED BECAUSE YOUR RANKING IMPROVED. You play,
// and it is your last event at that level. Outgrowing a rung is a statement about what she may enter
// NEXT; it is not a retroactive claim on what she has already committed to. So a rung closing now
// removes it from the FEED and the OFFER LIST - which is what `tierOpenFor` and `entryStatus` have
// always done, untouched by this change - and never from her SCHEDULE.
//
// ⚠ THE TWO CEILINGS STILL AGREE, which is what the retired comment demanded of them: `outgrewTier`
// and `tierOutgrown` "are the same event for the player and must have the same consequence". They
// do - the consequence is now identically NOTHING for a committed entry and identically "closed" for
// the next one, on both. The asymmetry this deletes is the one that was actually visible: the
// PRE-deadline entry was cancelled while the POST-deadline entry played on, so which of two
// identical commitments survived depended on a date the player was not thinking about.
//
// ⚠ AND THE DEAD END IT ONCE GUARDED IS GUARDED ELSEWHERE, twice over, which is why this can simply
// go. R10-3's trap - an entry to a rung she outgrew that could be neither played, planned nor
// abandoned - was closed by `cancelEntry` (R10-13, the escape hatch, still there) and by
// `arrivalStatus` returning `verdict: 'play'` with `outgrown: true` (R12-3, pinned in
// tests/round12.test.ts, still there). The week is playable, the card is visible, the button says
// "(outgrown)", and the parent may still pull her out himself if he wants the fee back.
//
// MEASURED before it was removed (tools/outgrown-entry-probe.ts, and see the report on this branch):
// the release fired on the domestic rungs at fourteen in almost every career and on a professional
// rung only for the careers strong enough to climb past one - exactly the owner's case. Honouring
// the entry costs her a low-paying draw she was going to play anyway.

// Full weekly resolution. The MAIN stream carries exactly TWO things, in this fixed order:
// resolveBaseCosts (3 draws, 4 when the sponsor roll hits) and driftCohort (4 per cohort player).
// Nothing else – both tournament sides run on EVENT-scoped streams (`seed:kidtour:<id>` for the
// kid's shadow run, `seed:aitour:<id>` for the canonical AI bracket), so the weekly draw count is
// independent of player input AND of how much content the calendar carries.
//
// When the kid has an entered event this week the resolution PAUSES: the shadow tournament is
// computed (byte-identical to the old inline run) and stashed in `world.pendingTournament`, but its
// match/summary/milestone events, ranking points and the week's rank recompute are all deferred to
// the reveal/finalize flow (revealTournamentRound / skipTournament). The main-stream work (base
// costs, drift) and the AI brackets still run, so the per-week draw count is unchanged.
export function tickWeek(world: WorldState, rng: Rng): void {
  world.week += 1

  // 1. THE SEASON BOUNDARY AND THE RECURRING OBLIGATIONS (R2-10 step 2, phase 1) – steps 0a00 to
  //    0a0c-ter, moved whole into world/phaseObligations.ts and unchanged there. Zero MAIN draws:
  //    the phase takes no `rng`, which is the guarantee rather than a claim about it.
  seasonBoundaryAndObligations(world)

  // 2. WHAT THE WEEK COSTS (R2-10 step 2, phase 2) – steps 0a0 to 1b, moved whole into
  //    world/phaseFinance.ts and unchanged there. ⚠ THIS IS THE PHASE THAT HOLDS THE MAIN STREAM:
  //    `resolveBaseCosts` spends its 3 (4 on a sponsor hit) inside it, in the same position in the
  //    tick they have always been, ahead of `driftCohort`'s 4-per-rival below.
  weeklyFinance(world, rng)

  // 3. HER BODY AND THE WEEK'S PLAN (R2-10 step 2, phase 3a) – step 1c and everything in it, moved
  //    whole into world/phaseHerWeek.ts. Zero MAIN draws: the phase takes no `rng`.
  //    ⚠ `playedThisWeek` is THREADED, not re-asked – the medical arm of step 2 below removes her
  //    entry, so a second `isCompetitionWeek` would answer differently on the weeks it matters.
  const playedThisWeek = resolveBodyAndPlanner(world)

  // 4. THE WEEK, DERIVED ONCE – the standings, the rivals' condition, the AER ledger and the
  //    professional side, folded before any bracket runs so her competition and the AI's see ONE
  //    world (world/weekField.ts). Zero draws. ⚠ IT IS THE SAME OBJECT BOTH COMPETITIONS ARE HANDED,
  //    at step 5 and again at step 7, which is the whole point of folding it: two calls to this
  //    function would be two agreeing derivations rather than one, and agreeing is not identical.
  const field = deriveWeekField(world)

  // 5. HER OWN COMPETITION (R2-10 step 2, phase 3b) – step 2 and the masseur's bill, moved whole
  //    into world/phaseHerWeek.ts. Event-scoped RNG only (`seed:kidtour:<event.id>`).
  playHerWeek(world, field, playedThisWeek)

  // 6. BOTH SIDES OF THE LADDER MOVE, AND SHE HAS A LIFE (R2-10 step 2, phase 4) – steps 3 to 3f,
  //    moved whole into world/phaseGrowth.ts and unchanged there. ⚠ `driftCohort`'s 4-per-rival is
  //    the tick's SECOND and last MAIN draw, in the same position it has always been: after her
  //    competition, before the canonical brackets below.
  growAndLive(world, rng)

  // 7. THE REST OF THE WORLD PLAYS, AND THE WEEK CLOSES (R2-10 step 2, phase 5) – steps 4 to 7,
  //    moved whole into world/phaseAiWeek.ts. Event-scoped RNG only (`seed:aitour:<event.id>`):
  //    the MAIN stream ended one phase ago carrying base costs + the cohort drift, which is exactly
  //    what the frozen capture (41550 / e6b0c709) measures.
  closeTheWeek(world, field)
}

// entries: moved to world/entries.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

/** R9-9: skip an entered tournament AT its event week – entering the begin flow is no longer a
 *  one-way door. A POST-deadline withdrawal, real-world style: the entry fee stays committed
 *  (the list closed with her on it), the travel charge tickWeek took is refunded in full (she
 *  never boards), NO run is committed (no points, no W-L, no strain – the shadow result is
 *  discarded), and the week then closes exactly like a normal non-playing week (the same
 *  deferred steps finalizeTournament would have run). Only callable before the first reveal;
 *  once a match has been shown the run is under way. Zero draws – the discarded shadow already
 *  ran on its event-scoped stream, so the MAIN weekly sequence is untouched either way. */
export function skipEvent(world: WorldState, eventId: string): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command; the worker is not the gate.
  guardNotEnded(world)
  const p = world.pendingTournament
  if (!p || p.eventId !== eventId) throw new Error('No tournament to skip this week')
  if (p.finished || p.revealedRounds > 0) throw new Error('The tournament is already under way')
  const event = eventById(world, eventId)
  if (!event) {
    // calendar lost the event (defensive – finalize handles this the same way): just clear.
    world.pendingTournament = null
    return
  }
  // v21: refund WHAT SHE PAID, not what the calendar prints. `travelCostFor` is the same function
  // chargeTravel used minutes ago, so a scholarship can never be turned into free money by entering
  // and withdrawing; the covered part is handed back to the academy's season tally at the same time.
  const paid = travelCostFor(world, event)
  // ...and the academy's tally is handed back exactly what it was credited, never the brand's share
  // as well (see `academyCoverOf`): two payers, two ledgers, and a withdrawal must unwind each of
  // them by its own contribution.
  const covered = academyCoverOf(world, event)
  world.fundsCents += paid
  if (world.academy && covered > 0) world.academy.coveredCents = Math.max(0, world.academy.coveredCents - covered)
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'travel',
    text: `Travel refunded: ${TIERS[event.tier].label}`,
    amountCents: paid,
  })
  world.entries = world.entries.filter((id) => id !== eventId)
  world.pendingTournament = null
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Skipped ${TIERS[event.tier].label} – entry fee forfeited.`,
  })
  // ⚠ THE NO-SHOW, AND IT IS THE DEAREST OF THE THREE SOURCES (W3-ACT2 §6, `noShowPoints` 4 against
  // a late withdrawal's 3 and a plain skip's 2). The ordering is about what the TOURNAMENT lost, not
  // about her: never entering costs it an entry, pulling out after the list closed costs it a hole
  // in a published draw, and not appearing on the day costs it the hole AND an empty court on a
  // court schedule that cannot be refilled.
  //
  // ⚠ THE MEDICAL WITHDRAWAL IS NOT THIS PATH, which is the real tour's own distinction and the one
  // that keeps «мы ни за что не наказываем» true here. `mandatoryBinds` answers false while she is
  // injured, so a body that gives out on the Sunday is never a no-show; the doctor's veto in
  // tickWeek pulls her out through its own route and this line simply does not fire.
  if (mandatoryBinds(world, event)) {
    chargeMandatoryPenalty(world, world.week, ECONOMY.mandatory.noShowPoints, 'no-show', event)
  }
  // The week ends match-free after all, so she earns the slider recovery bonus that tickWeek
  // withheld when it still believed she would play (accrueCondition ran with played = true).
  // Integer, clamped – "the week then resolves as a normal non-playing week".
  //
  // ⭐⭐ AND THE BASE RECOVERY WITH IT SINCE 18.08 – THE SAME EXPRESSION THE MEDICAL WITHDRAWAL USES.
  // This line handed back the slider bonus ALONE, and the note left for the architect beside the
  // withdrawal explained why: it was exactly right when written, because `matchWeekRecoveryBase` and
  // `recoveryBase` were both 2 and the difference was zero. The V2 flip set `matchWeekRecoveryBase`
  // to 0 and the two paths silently parted by `recoveryBase` – EIGHT condition points for the same
  // match-free week, depending only on whether the doctor pulled her out or the parent chose not to
  // enter.
  //
  // ⚠ IT WAS NEVER A DESIGNED PENALTY, WHICH IS WHY THIS IS A FIX AND NOT A TUNING CHANGE. The owner,
  // 18.08: «мне кажется тут всё явно: она и в одном случае не играла и в другом» - and the standing
  // ruling it offends is «мы ни за что не наказываем». A week with no match is a week with no match.
  //
  // ⚠ THE THIRD CASE IS DELIBERATELY UNTOUCHED, and the owner named it: retiring MID-MATCH through
  // injury. She walked on court and played, so that week is not match-free and never reaches here.
  //
  // ⭐ SHOOT-AWARE SINCE AD STEP 2 (§4a): the oracle pays nothing on a shoot week – the travel
  // figure was banked and the travel figure is what that week's rest is worth, skipped event or no.
  // ⭐ ROUND-25 COLLECT: the oracle also carries the phase base (variant C) and the masseur's
  // table since the merge – the two waves' parallel edits to this seam, folded into one expression.
  world.condition = clamp(
    world.condition + withheldFreeWeekRecovery(world, 'tournament'),    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // Close the week: the rank recompute + housekeeping that tickWeek deferred to the flow.
  recomputeRankAndMilestones(world)
  housekeep(world)
}

/** Tick up to `weeks`, stopping early when a tournament week spawns a reveal (the week is not
 *  closed until it resolves), an imminent affordable regional+ deadline appears, or funds cross
 *  below zero. A reveal already in progress blocks any advance until it is closed.
 *
 *  Returns EVERY reason the advance stopped, in STOP_PRECEDENCE order (empty = it ran its full
 *  course). R11-1 – THE BUG this shape fixes (owner 26.07, "the injury popup does not always
 *  appear – once it did, once it did not"): the old signature carried ONE reason and `break`ed on
 *  the first match in source order, so a fresh injury that landed on the season wrap-up week was
 *  reported as 'season-end' alone. The injury dialog never mounted, the toast had no copy for
 *  'injury' either (R10-16 moved it onto the dialog), and her auto-withdrawals happened with
 *  NOTHING shown. One week can be several things at once; the caller gets all of them and decides
 *  the order to show them in. ZERO extra RNG draws and the identical number of ticks – the loop
 *  still breaks on the first week that stops it, it just no longer forgets the rest of the news. */
export function advanceWeeks(world: WorldState, rng: Rng, weeks: number): StopReason[] {
  // ⚠⚠ THE SIX REFUSALS MOVED TO `world/multiWeek.ts` (R2-13 phase 1), COMMENTS AND ORDER INTACT,
  // AND THEY MOVED FOR ONE REASON: a second week control has to know whether this function will move
  // time at all, and a button that answers that question for itself is the arrival gate's three
  // disagreeing answers all over again (composables/weekAction.ts spells that lesson out). One
  // predicate, two readers: the engine calls it here, and the shell re-asks the same six of the
  // snapshot through `blockingOverlay` + `pending`, pinned agreeing in tests/r2-13-advance-span.ts.
  // Nothing about the behaviour changed – zero ticks, one reason, the identical order.
  const refusal = advanceRefusal(world)
  if (refusal) return [refusal]
  const stops = new Set<StopReason>()
  for (let i = 0; i < weeks; i++) {
    const nextWeek = world.week + 1
    // Pre-tick guards bite only after the first tick, so a single step always progresses.
    if (i > 0) {
      // Round-9 leftover FIX (owner-visible bug, season-planner slice): the stop must only fire
      // for an event she could ACTUALLY enter. The availability gate alone let the sim halt at
      // W1/W3 with 0 points for regional/national deadlines she was nowhere near qualifying for,
      // so the point-band eligibility is now AND-ed in – the same isTierEligible enterEvent uses,
      // which also silences a tier she has OUTGROWN (points past the ceiling).
      const deadlineSoon = world.season.some(
        (e) =>
          // Ladder-up: "regional or national" was "anything above the entry tier" – it now reads
          // that way literally, so the J levels (the most expensive commitments in the game) stop
          // the sim too. NOTE for the tuning pass: with j30 every 2 weeks this roughly doubles how
          // often an advance halts once she is J-eligible; if that proves noisy the fix belongs in
          // a player-side "don't stop for tier X" preference, not in silently skipping the stop.
          e.tier !== 'local' &&
          !world.entries.includes(e.id) &&
          world.fundsCents >= TIERS[e.tier].entryFeeCents &&
          (e.deadlineWeek === world.week || e.deadlineWeek === nextWeek) &&
          // Round-10 R10-5: the point band AND the availability gate, read through the ONE helper
          // every other surface reads (`entryStatus` = band + availability). This used to be
          // `isTierEligible(...) && availabilityStatus(...) !== 'blocked'` spelled out here – the
          // same verdict, but a third independent copy of the rule. Don't stop-for-deadline on an
          // event she HARD-cannot enter (locked/outgrown on points, school exams, a booked family
          // vacation, injured); a FATIGUED event is still enterable (soft caution), so the sim MAY
          // stop so the player can make the tough call.
          entryStatus(world, e).level !== 'blocked',
      )
      if (deadlineSoon) {
        stops.add('deadline')
        break
      }
    }
    tickWeek(world, rng)
    // EVERY reason this week stops the advance is collected – no `break` between them, because a
    // week that is two things at once (the classic: she gets hurt in the season's last playing
    // week) must report both. The loop still breaks ONCE, after the week has been read out.
    //
    // A tournament this week paused the resolution: stop so the flow can take over.
    if (world.pendingTournament) stops.add('tournament')
    // W4: she came off court sore and the parent has to answer. The `break` below then ends the
    // advance, and the guard at the top of this function refuses to restart it until he has.
    if (pendingKnock(world)) stops.add('knock')
    // ⭐ v48: it is her birthday and nobody has answered it. Collected rather than returned early for
    // R11-1's own reason – a birthday CAN land on a week that is also a tournament, an injury or the
    // season wrap, and a week that is several things must report all of them.
    if (pendingBirthday(world) !== null) stops.add('birthday')
    // Season just wrapped up (the tick landed on the year's first off-season week, week 49 of
    // the year): stop AFTER the wrap-up resolved, before week 50, so the season-summary popup
    // shows. Off-season weeks never carry a tournament, so this can't collide with 'tournament'.
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) stops.add('season-end')
    // A FRESH injury (onset this very tick) halts the advance so the medical event surfaces;
    // an ongoing recovery never re-stops the sim on every week she sits out.
    if (world.injury !== null && world.injury.sinceWeek === world.week) stops.add('injury')
    // A medical withdrawal costs her an entry AND its fee, so it halts the advance for the same
    // reason a fresh injury does: the player must see it happen, not read about it later.
    if (world.medicalWithdrawalWeek === world.week) stops.add('medical')
    // R12-15: ...and so does a WALKOVER, for exactly the same reason. This was the owner's dead
    // click: the entry fee was forfeited, the trip never happened, and the only trace was one line
    // in a news feed the player had no reason to open – because the click that caused it had just
    // promised a tournament. Note this fires INDEPENDENTLY of 'injury': the walkover usually lands
    // a week or more AFTER the onset, when the injury is no longer fresh and nothing else stops.
    if (world.walkoverWeek === world.week) stops.add('walkover')
    // ⭐⭐ ROUND 23 #16 – THE ACADEMY'S VERDICT, and the reason it needed a stop is arithmetic rather
    // than luck. The owner: «Что-то я не увидел когда академия появилась, покрывающая расходы на
    // поездки». It fired correctly and it is still in his ledger 205 weeks later – but
    // `reviewAcademy` speaks at `week % 52 === 0`, this loop hard-stops at `% 52 === 49`, and the
    // shell's step is FOUR. 49 + 4 = 53, so the verdict week is the one week of the season a player
    // stepping by four can never land on, and `WeekRecapCard` renders only the current week. Measured
    // across seven careers: the landings round the boundary are `…, 49, 53, 57, …` in every one.
    //
    // ⚠ A SCHOLARSHIP IS NOT A COST, so it sits below the medical trio and the walkover – it can wait
    // a click, which is exactly what a stop is for. What it may not do is pass in silence, which is
    // the same complaint R12-15's walkover answered.
    if (academySpokeThisWeek(world)) stops.add('academy')
    // ⭐ R2-13's OWN ITEM TEXT LISTS «OFFERS» AND PHASE 1 DID NOT STOP FOR ONE. The digest reported
    // the letter and the inbox dot lit, which is exactly the pair of surfaces round-23 #16 proved
    // insufficient for the academy's verdict: the parent has no reason to open an inbox he was not
    // told had anything in it, and unlike every other row a span can bury, this one EXPIRES.
    //
    // ⚠ THE RULE IS `stoppableOfferWeek`'s, NOT THIS LINE'S, and it is deliberately narrow: a
    // DECISION (`state: 'open'`) that ARRIVED this week. A notice does not stop the span and a letter
    // already lying open does not stop it a second time – see world/multiWeek.ts for both halves.
    // No new stopping model: one more `stops.add` in the same collect-then-break loop as the twelve
    // above it, so a week that is an offer AND something else still reports both (R11-1).
    if (stoppableOfferWeek(world)) stops.add('offer')
    if (world.fundsCents < 0) stops.add('funds')
    // W2-ENDINGS. The three that the week may have just produced. `'ending'` is collected rather
    // than returned early so a week that is BOTH an ending and something else (the classic: the
    // season wraps up and she takes the offer on the same week) still reports both – R11-1's rule,
    // and the epilogue is the surface that renders last anyway.
    if (world.ending) stops.add('ending')
    if (world.fork !== null && world.fork.answer === null) stops.add('fork')
    if (world.retirementOffer !== null) stops.add('retirement')
    // ⭐⭐ ROUND 29 #6 – THE LOOP BREAKS ON A REASON THAT HALTS, NOT ON EVERY REASON IT COLLECTED.
    // It used to be `if (stops.size > 0) break`, and the one member that difference is about is
    // 'season-end': a press made at the tail of a season bought two weeks of a six-week gap and
    // handed back the wrap-up, which is the owner's «увидел сообщение о конце года ... а календарь
    // так и остался на 51й неделе». `SPAN_REPORTS_ONLY` carries the whole argument for why that one
    // reason may pass and no other may – including the measured half, that the recap dialog reads
    // the SNAPSHOT and not this reason, so nothing about it is lost.
    //
    // ⚠ A ONE-WEEK PRESS IS BYTE-IDENTICAL EITHER WAY: the loop runs once and ends on its own
    // counter, so this line can only ever be reached by a span.
    if ([...stops].some((r) => !SPAN_REPORTS_ONLY.has(r))) break
  }
  // Precedence order, not insertion order: the caller renders them in this sequence, and the
  // medical pair leads it so nothing can bury them (see STOP_PRECEDENCE).
  return STOP_PRECEDENCE.filter((r) => stops.has(r))
}

/** ⭐ ROUND 24, RULE 2 – WHAT `resumeFromCollege` SAYS WHEN A REVEAL IS STILL OPEN. Exported so a
 *  test can pin the refusal without pinning a spelling, on the precedent of `RELEASE_LINE_PREFIX`:
 *  the wording is player-facing (it reaches the toast through the worker's error channel) and a
 *  string literal copied into a test is a rename that breaks a report in silence.
 *
 *  ⚠ IT NAMES THE STATE AND THE WAY OUT, which is R10-16's doctrine – a refused control with no
 *  reason on screen is the bug. Nothing here shames the player: it is the game's own bookkeeping. */
export const COLLEGE_REVEAL_REFUSAL =
  'A tournament is still waiting to be resolved – close it before spending another college year'

/** «ANOTHER YEAR» – the one command that CLEARS an ending (contract §5.1).
 *
 *  College is the only ending that resumes, and this is where it does. The latch comes off, ONE year
 *  of weeks is spent, the year is banked, and the latch goes back on with the next year's date under
 *  it – until she has spent all four or answers `endCollegeEarly`.
 *
 *  ⭐⭐ P5 – IT USED TO SPEND FOUR YEARS IN ONE CALL AND THE BUTTON SAID «Four years later –».
 *  Reality's own case is one year and not four (Diana Shnaider left NC State after about a season
 *  and is inside the WTA top 15), so the four-year block was the wrong SHAPE as well as an empty
 *  one. Four years, one at a time, is three real questions and a fourth year that is not one –
 *  `CollegeProgressView.final` is what carries that difference to the screen.
 *
 *  ⚠ THE WEEKS ARE REALLY TICKED, not skipped over. The world has to LIVE those years: the cohort
 *  ages, the conveyor turns it over, the field she will come back to is not the field she left, and
 *  she keeps developing on the age curve. A `world.week += 52` would have handed back a world whose
 *  ranking table, calendar and rivals were all a year stale.
 *
 *  ⚠⚠ AND HER RANKING GOES ON ITS OWN, WITH NO RULE WRITTEN FOR IT – WHICH IS NOW MEASURED RATHER
 *  THAN ASSERTED. The old note here said she "arrives at twenty-two on zero points, below the whole
 *  field – «no ranking at all»". Half of that is false and the half that is true is not news:
 *  measured over 52 careers at the fork (docs/specs/college-as-a-second-act-2026-08.md §4) her
 *  professional rank is **#290 before the freeze and #290 after it**, IDENTICAL, because she was
 *  already off the list the week she walked in. What the four years actually cost is the ladder
 *  moving without her: the same seeds spent on tour finish at **#169**. The cost is 121 places she
 *  did not lose but never gained, and the price of them is **$106,699** – college banks $152,243
 *  against the tour's $45,544. That is the trade the year card now states, and it is why the
 *  question at each boundary is a real one.
 *
 *  ⚠ THE LOOP BREAKS ON A FRESH ENDING. A career-ending injury can land at college – she is playing
 *  a lot of tennis – and when it does she never comes back, which is a true story rather than an
 *  edge case to be defended against.
 *
 *  ⭐⭐⭐ AND IT NOW REPORTS THE WEEK THAT IS NOT HERS – the college wave, the owner's item 3:
 *  «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие».
 *
 *  ⚠⚠ THE HAZARD THIS ANSWERS IS ROUND 23 #16's, ARRIVING FROM THE OTHER SIDE. That item was an
 *  academy verdict firing on the one week a `+4` advance could never land on; this is a national-team
 *  week firing inside a loop that spends FIFTY-TWO weeks with nobody watching. Now that the rubbers
 *  are really played (`world/college.ts`), a year that produced three matches and reported one
 *  sentence would be the same silence with better tennis behind it.
 *
 *  ⚠ IT COLLECTS, IT DOES NOT HALT – and that is the owner's own ruling rather than a shortcut. He
 *  designed college as the SHORTCUT: «1-2 национальных выезда в год и перелистывание 1 года за клик»,
 *  and «родители не будут посещать все игры в колледже» is why `COLLEGE_TRIP_WEEKS` shrank a
 *  thirteen-week season to two trips. A year that stopped in the middle and demanded a second click
 *  to finish itself would be the playable season the fork exists to skip. So the year is still ONE
 *  click, and what changes is that the click hands back the reason – `mutate` puts it on the
 *  snapshot exactly as it does for an advance, the epilogue's year card offers the rubbers to
 *  replay, and the toast says the week happened. `stops` is a Set filtered through STOP_PRECEDENCE
 *  for the identical reason `advanceWeeks` does it: one call can be several things at once (the
 *  classic here: a call-up in April and the ending re-latched in December), and the caller decides
 *  the order to show them in.
 *
 *  ⭐⭐⭐ ROUND 24 – WITH ONE EXCEPTION, AND IT IS A QUESTION RATHER THAN A REPORT: HER BIRTHDAY
 *  (the owner, 22.08: «да, день рождения делай»). A call-up is news and can be read at the year's
 *  end; a birthday is the one popup the owner asked to fire ALWAYS, all four of its buttons are
 *  answers, and `chooseGift` records against `world.week` – so it cannot be collected, it has to be
 *  ASKED, on its own week. The year therefore PAUSES there: the loop breaks, the latch goes back on
 *  with the SAME year's end under it (`pendingYearStart` keeps the opening measurements honest), the
 *  dialog renders over the live college Home shell, and the next press finishes the year. This does
 *  not reopen the playable-season trade above – it is one extra click in the years that hold a
 *  birthday, for the beat the owner explicitly asked to stop for, exactly as the tour's own `+4`
 *  stops for it. */
export function resumeFromCollege(world: WorldState, rng: Rng): StopReason[] {
  const college = world.college
  if (!college || college.doneWeek !== null) throw new Error('She is not at college')
  if (!world.ending || world.ending.type !== 'college') throw new Error('This career is not on the college branch')
  // ⭐⭐⭐ ROUND 24, RULE 2 – A YEAR MAY NOT BE SPENT OVER AN UNANSWERED REVEAL. THIS IS THE RULE THAT
  // CLOSES THE CLASS, and it is the guard `advanceWeeks` (`if (world.pendingTournament) return
  // ['tournament']`) and the worker's dev `tick` (P6 (c): "a refusal at entry, a stop mid-loop") have
  // both had for waves. This command – the only one in the game that CLEARS an ending, and the only
  // other producer of stop reasons – never had it, and that is the whole of why the owner's career
  // could die in silence: with a reveal open, `tickWeek` skips its entire step 5-6, so every week
  // after it costs its RNG draws and buys nothing. His save proves the weeks really ticked
  // (`rngMain.n` 166k at week 474) and that the world simply had nothing in it.
  //
  // ⚠⚠ A REFUSAL AND NOT A STOP, AND THE EPILOGUE IS THE REASON. `advanceWeeks` can return
  // 'tournament' because its caller is the app shell, where `TournamentFlow` mounts and the sticky
  // bar's primary button re-opens it on every tab. THIS caller is behind the epilogue: `App.vue`
  // branches `EndingScreen` with `v-else-if` ABOVE the shell, `TournamentFlow` lives inside the
  // `v-else`, and `blockingOverlay`'s INTERRUPTS set lets 'ending' show over a pending reveal – so
  // while the college latch is on there is no surface in the app that can draw the reveal at all. A
  // stop reason handed to a screen that cannot act on it is a silent no-op, which is the failure
  // being fixed rather than a fix. A throw is loud, and through the worker it is also FREE: `mutate`
  // runs on a candidate clone, so a refusal provably leaves the committed career without one tick
  // applied – close the reveal (or repair it) and the same click works.
  //
  // ⚠ MID-LOOP TOO, ON THE SAME CONTRACT AND FOR THE SAME REASON. After rule 3 no reveal can be
  // CONSTRUCTED inside the freeze, so this is a tripwire over a state that should not exist; if a
  // later wave finds a new way to open one, the career stops at that week with nothing committed
  // instead of ticking out the year and the three after it.
  if (world.pendingTournament) throw new Error(COLLEGE_REVEAL_REFUSAL)
  // ⭐⭐⭐ ROUND 26 #6 – AND NOT OVER A CHAMPIONSHIP HE HAS NOT WATCHED. The same contract as the
  // line above and the deliberate opposite treatment, which is the whole reconciliation this item
  // needed. Round 24's refusal THROWS because a `pendingTournament` inside the freeze had no surface
  // anywhere in the app – «a stop reason handed to a screen that cannot act on it is a silent no-op,
  // which is the failure being fixed rather than a fix». This state is the other case: it is
  // HEALTHY, it is raised on purpose, and D1's Home shell draws it – `snapshot.pending` carries it,
  // `TournamentFlow` mounts over the shell, the college bar stands down while it is up
  // (HomeScreen's own `!game.snapshot?.pending`) and App.vue's global week bar offers the resume
  // press on every tab. So it is a RETURN and not a throw, on `pendingBirthday`'s own argument one
  // line down: nothing is mutated, nothing is drawn, and the same click works the moment the reveal
  // is answered. Round 24's law is not weakened by this – `world.pendingTournament` is still never
  // written inside the freeze and the throw above is still unreachable.
  if (collegeLeagueRevealOpen(world)) return ['college-league']
  // ⭐⭐⭐ ROUND 27 #6 – AND NOT OVER A TIE HE HAS NOT WATCHED EITHER. The same contract, the same
  // treatment and the same reason as the line above: the state is HEALTHY, it is raised on purpose,
  // and the app draws it – `snapshot.pending` carries it, `TournamentFlow` mounts over the college
  // Home shell, and the global week bar offers the resume press. A RETURN and not a throw: nothing is
  // mutated, nothing is drawn, and the same click works the moment the reveal is answered.
  if (callUpRevealOpen(world)) return ['call-up']
  // ⭐⭐⭐ ROUND 24 – AND NOT OVER AN UNANSWERED BIRTHDAY EITHER (the owner's «да, день рождения
  // делай»). The identical contract `advanceWeeks` keeps at its own entry, engine-side because the
  // worker is not the gate (invariant 1): the dialog covers the button, but a stale screen must not
  // be able to spend a year past the one popup the owner asked to fire ALWAYS. A RETURN and not a
  // throw, like the college reveal above it and unlike round 24's `pendingTournament` throw two
  // guards up – the test is whether the state HAS A SURFACE, and this one does: the dialog is on
  // screen off the snapshot field, `chooseGift` is its exit, and the same click works the moment it
  // is answered.
  // Nothing is mutated and nothing is drawn; `['birthday']` is the same no-op report the advance
  // gives, so the caller cannot mistake a refusal for a spent year.
  if (pendingBirthday(world) !== null) return ['birthday']
  // ⭐ THE YEAR IN PROGRESS, OR A FRESH ONE. `pendingYearStart` is non-null exactly when the last
  // press paused the year mid-flight – on her birthday since round 24, and on the championship since
  // round 26 #6: the year's opening measurements are HISTORY by now (her
  // skill, her rank and the family balance have moved since), so they are persisted at the pause and
  // read back here rather than re-measured – or the banked year would open at the birthday week with
  // the wrong four numbers. `?? null` because the field is optional (see CollegeState: D2 owns
  // `answerFork` next, so enrolment does not write it; absent and null mean the same thing).
  const start = college.pendingYearStart ?? openCollegeYear(world)
  // Off the year's own OPENING, not off `world.week`: for a fresh year the two are the same week,
  // and for a resumed one this is what keeps the academic boundary where the first press put it –
  // a year paused for a cake is finished, not restarted.
  const yearEnds = Math.min(college.untilWeek, start.week + WEEKS_PER_YEAR)
  // ⭐⭐⭐ ROUND 26 #10, SECOND PASS – WHERE THE PRESS STARTED, so the row written when it stops can
  // be gated on the press having actually moved time. See `announceCampusInterlude` below the loop.
  const pressFrom = world.week
  world.ending = null
  const stops = new Set<StopReason>()
  while (world.week < yearEnds && world.ending === null) {
    tickWeek(world, rng)
    if (world.pendingTournament) throw new Error(COLLEGE_REVEAL_REFUSAL)
    // ⚠ ASKED AFTER THE TICK AND OF THE WORLD, never threaded back through `tickWeek` – the whole
    // point of `callUpPlayedThisWeek` being a predicate. One `stops.add`, exactly like the academy's.
    // ⚠ ONE `pauseHere` FOR ALL THREE QUESTIONS, hoisted above the first of them since round 27 #6:
    // the rule is R11-1's – a week can be several things at once, and every one of them has to reach
    // the `stops` set before anything breaks the loop.
    let pauseHere = false
    // ⭐⭐⭐ ROUND 27 #6 – AND IT NOW BREAKS, WHICH IS THE ITEM. Round 25 played the rubbers and round
    // 26 left the report where it was, so the week was over and forty weeks behind him by the time
    // the year handed the screen back: «матчи только постфактум». The year PAUSES on the tie instead,
    // in the shape the championship two branches down already uses.
    //
    // ⚠ THE PAUSE READS `callUpRevealOpen` AND NOT `callUpPlayedThisWeek`, and the two differ by two
    // things that matter: a career migrated from v63 mid-freeze has no reveal for a tie it already
    // lived, and a year in which she was NAMED AND SAT has no rubber to walk (`resolveCallUp` opens
    // no reveal on `rubbersPlayed === 0`). Neither may be halted in front of a flow with nothing in
    // it – and both still REPORT, because `stops.add` is outside the question.
    if (callUpPlayedThisWeek(world)) {
      stops.add('call-up')
      if (callUpRevealOpen(world)) pauseHere = true
    }
    // ⭐⭐⭐ ROUND 24 – AND THE ONE WEEK THAT ALWAYS HAPPENS. Unlike every other member of this set
    // the championship is not a roll, so this line fires in EVERY college year – which is the point:
    // a year that produced a tournament and reported nothing would be the silence round 23 #16 was
    // about, with better tennis behind it.
    // ⭐⭐⭐ ROUND 26 #6 – AND IT NOW BREAKS, WHICH IS THE ITEM. Round 24 reported the week and kept
    // ticking, so the championship was over, banked and forty weeks behind him by the time the year
    // handed the screen back: «опять сообщили только постфактум». The year PAUSES on the fixture
    // instead, in the shape her birthday already uses one branch down – the loop breaks, the latch
    // goes back on with the SAME year's end under it, the opening measurements are persisted for the
    // press that finishes it, and the reveal renders on the live Home shell.
    //
    // ⚠ THE STOP READS `collegeLeagueRevealOpen` AND NOT `collegeLeaguePlayedThisWeek`, and the two
    // differ by one thing that matters: a career migrated from v59 mid-freeze has no reveal for a
    // championship it already lived, and must not be halted in front of a flow with nothing to walk.
    if (collegeLeaguePlayedThisWeek(world)) {
      stops.add('college-league')
      if (collegeLeagueRevealOpen(world)) pauseHere = true
    }
    // ⭐⭐⭐ ROUND 24 – HER BIRTHDAY, THE ONE MID-YEAR STOP. Unlike the two reports above it BREAKS,
    // because it is a QUESTION: `chooseGift` records the gift against `world.week`, so the answer
    // has to land ON the birthday week and a blocking dialog cannot be answered inside this loop –
    // the exact sentence `pendingBirthday`'s old college exclusion was built on, now honoured by
    // pausing instead of by silence. Collected before the break so a birthday that lands on the
    // championship week reports both (R11-1's rule: one week can be several things at once).
    if (pendingBirthday(world) !== null) {
      stops.add('birthday')
      pauseHere = true
    }
    // ⚠⚠ ONE BREAK FOR BOTH, AND IT IS R11-1's RULE RATHER THAN A TIDY-UP. A birthday landing on the
    // championship week must report BOTH – the sentence above says so and `college-birthday.test.ts`
    // measures it – so a `break` inside the championship arm would swallow the cake exactly the way
    // the lost-injury popup was swallowed by the season wrap. Both questions are then open at the
    // pause, and the UI already knows what to do with that: `popupMayShow` holds the gift dialog
    // behind the reveal (`screenBusy`), the reveal has a guaranteed exit, and the birthday is the
    // next thing on screen when it closes.
    if (pauseHere) break
  }
  // ⭐⭐⭐ ROUND 26 #10, SECOND PASS – THE ONE ROW THAT CANNOT BE STALE. The owner, after the first
  // pass: «предпоследняя новость были из мира "до колледжа" на протяжении всей учебы… я бы хотел,
  // чтобы "мир жил" и пока она в колледже, пусть и сжато». Measured over 48 rest states, the card at
  // rest reaches ninety weeks back and covers 45% of the weeks a press actually spends, so a line
  // written on an ordinary freeze week is a line he sees by luck. This one is written ON the rest
  // week itself – the week at the very top of the feed he is handed – which is what makes it
  // CURRENT by construction rather than by budget. `world/fieldNews.ts` carries the whole argument,
  // the arithmetic and the two rejected alternatives.
  //
  // ⚠ HERE AND NOT IN THE FOUR RETURNS BELOW: every exit from this command – a banked year, a
  // birthday pause, a championship pause, the graduating press – hands back the same Home shell, and
  // four copies of one call is how three of them come to disagree. ⚠ GATED ON THE PRESS HAVING MOVED
  // TIME, so a press that only ticked into a refusal writes nothing; and gated on the freeze still
  // being the state, because a career-ending injury mid-year hands back an EPILOGUE, and the tour's
  // succession is not what that screen is for.
  if (world.week > pressFrom && world.ending === null) announceCampusInterlude(world)
  // ⭐⭐⭐ THE PAUSE – the year stops mid-flight (for her birthday, or since round 26 #6 for the
  // championship the player is being shown) and is NOT banked. The latch goes
  // back on with the SAME year's end under it, the opening measurements are persisted for the press
  // that finishes it, and the dialog renders over the college Home shell (blockingOverlay lets the
  // birthday through exactly this one latch). Assigned directly rather than through `latchEnding`,
  // deliberately: the latch writes a kept «College years – N of 4…» milestone per call, which is the
  // YEAR's row – a paused year is the same year continued, and a second row about it every birthday
  // would be the feed announcing an event that did not happen.
  //
  // ⭐⭐⭐ ROUND 26 #6 – AND THE CHAMPIONSHIP PAUSES IT THE SAME WAY, THROUGH THE SAME BLOCK. Two
  // causes, one pause, deliberately: the year's opening measurements, the latch and its `resumesWeek`
  // are the same three facts whichever question stopped the loop, and a second copy of this block is
  // how two pauses come to disagree about where the academic year ends. A birthday landing ON the
  // championship week takes this branch once and both stops are already in the set (R11-1).
  if (
    world.ending === null &&
    world.week < yearEnds &&
    (pendingBirthday(world) !== null || collegeLeagueRevealOpen(world) || callUpRevealOpen(world))
  ) {
    college.pendingYearStart = start
    world.ending = {
      type: 'college',
      week: world.week,
      ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
      detail: `${college.years.length} of ${ENDINGS.collegeYears} years on the scholarship`,
      resumesWeek: yearEnds,
    }
    stops.add('ending')
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  // ⚠ A YEAR CUT SHORT BY AN ENDING IS STILL BANKED. The album's last page is allowed to say what
  // she was doing when it happened, and a row that stops mid-year is the honest record of that.
  // (`bankCollegeYear` also clears `pendingYearStart`, so a resumed year cannot leak its start into
  // the next one.) ⚠ A BIRTHDAY ON THE BOUNDARY WEEK ITSELF takes this path, not the pause: the year
  // is genuinely over, so it banks and re-latches (or graduates) as always – and the prompt simply
  // stays pending at the rest state, where the dialog shows and the entry guard above holds the next
  // press until it is answered. Nothing is swallowed; 'birthday' is already in the stops.
  bankCollegeYear(world, start)
  if (world.ending !== null) {
    college.doneWeek = world.week
    // ⚠ 'ending' JOINS THE SET RATHER THAN REPLACING IT, which is R11-1's rule kept on a second
    // caller: the year she got hurt out of the game may ALSO be the year her country called, and a
    // return that reported one of them would be the lost-injury-popup bug wearing college colours.
    stops.add('ending')
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  if (world.week >= college.untilWeek) {
    finishCollege(world)
    // ⚠ NO 'ending' HERE, AND THE ASYMMETRY IS THE FACT. `finishCollege` takes the latch OFF for
    // good – she has graduated and the tab shell comes back – so the toast this returns is the one
    // the player can actually read, on the one call of the four where nothing covers the screen.
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  // ⭐ THE LATCH GOES BACK ON, and this is the whole of "one year at a time". The screen that asks
  // «another year?» is the epilogue screen, so the epilogue has to still be there to ask it – and
  // `buildEndingView` fills `college` from `collegeProgressOf`, which is null the moment she leaves.
  latchEnding(world, {
    type: 'college',
    week: world.week,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    detail: `${college.years.length} of ${ENDINGS.collegeYears} years on the scholarship`,
    resumesWeek: Math.min(college.untilWeek, world.week + WEEKS_PER_YEAR),
  })
  stops.add('ending')
  return STOP_PRECEDENCE.filter((r) => stops.has(r))
}

/** ⭐ THE EARLY RETURN – «I am going back on tour now», answered at a year boundary.
 *
 *  ⚠ IT IS A SEPARATE COMMAND AND NOT A FLAG ON `resumeFromCollege`, because the two answers do
 *  opposite things to the latch: one puts it back on, this one takes it off for good. Folding them
 *  into one call with a boolean would have made the most expensive click in this part of the game
 *  depend on an argument nobody reads.
 *
 *  ⚠ AND IT REFUSES ON A CAREER THAT IS NOT AT A BOUNDARY, engine-side, because the worker is not
 *  the gate (CLAUDE.md invariant 1). The screen stops drawing the button; this is what makes that a
 *  rule rather than a decoration. */
export function endCollegeEarly(world: WorldState): void {
  const college = world.college
  if (!college || college.doneWeek !== null) throw new Error('She is not at college')
  if (!world.ending || world.ending.type !== 'college') throw new Error('This career is not on the college branch')
  if (college.years.length === 0) throw new Error('She has not spent a year there yet')
  // ⭐ ROUND 24 – "AT A BOUNDARY" GAINED A SECOND FAILURE MODE AND THIS CLOSES IT. The birthday
  // pause created the first mid-year rest state this command can be reached from, and taking the
  // latch off there would move `untilWeek` back to a week in the middle of an academic year and
  // leave the half-spent year unbanked – a shape no reader of `college.years` expects (`isFullYear`,
  // the album, the graduation card all assume years bank whole or are cut by an ENDING). The
  // early return is answered at year boundaries, which is this function's own stated contract; the
  // screen stands its button down too, and this is what makes that a rule rather than a decoration.
  if ((college.pendingYearStart ?? null) !== null) {
    throw new Error('The year she started is still running – it finishes first, then she can come back on tour')
  }
  leaveCollegeState(world)
  world.ending = null
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: collegeEpilogueLine(world),
  })
}

/** The four years, spent. One place, so the early return and the full course write the same row. */
function finishCollege(world: WorldState): void {
  leaveCollegeState(world)
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: collegeEpilogueLine(world),
  })
}



// snapshot: moved to world/snapshot.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.
