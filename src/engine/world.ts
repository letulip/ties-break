import { type Rng, type MainRngState, rngFromSeed, initMainState, resumeMain } from './rng'
import {
  DEFAULT_PROFILE,
  STOP_PRECEDENCE,
  WEEK_PLAN_PRESETS,
  type FamilyBackground,
  type PlayerProfile,
  type StopReason,
  type WorldEvent,
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
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TournamentResult } from './season/types'
import {
  TIERS,
  buildSeason,
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
import { generateCohort, driftCohort, COHORT_SIZE } from './season/cohort'
import { growWeek, rollPotential } from './development'
import { coachById, coachIncludesPhysio } from './coach'
import { generatePreHistory } from './season/prehistory'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, RANKABLE_MIN, windowedBestSum } from './season/ranking'
import {
  byAllocationPriority,
  selectEntrants,
  resolveDoubleBookings,
  runTournament,
  ON_RAMP,
  fillOnRamp,
  WILD_CARD,
  hostNationOf,
  wildCardWindow,
} from './season/tournament'
// THE FIELD TIER (living-field phase W, 01.08). Field pros are DERIVED, NEVER PERSISTED – see
// season/fieldPros.ts for the whole argument. world.ts only ever asks three questions of them:
// the merged W ranking, the W-event candidate universe, and a name for an fp- id on a surface.
// Since W3-FIELD3 the second of those is asked by the CANONICAL brackets as well as by her shadow
// run, and `isFieldProId` earns a fourth job: it is the one predicate that keeps a derived player
// out of the persisted ledger (`runAiTournament`).
import {
  isFieldProId,
  universeForTier,
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
// takes a narrow structural view, so world -> knock runs one way and can never cycle.
import {
  knockRestWeek,
  KNOCK_REST_GROWTH,
} from './knock'
// W6c: the anatomy, in a leaf module so diary.ts can read the same twelve parts this draws from.
// THE INBOX (v32, docs/specs/offers-and-the-inbox.md). Same dependency shape as the knock and the
// diary: offers.ts is world-free and takes plain arguments, so world -> offers runs one way. Its
// only randomness is its own `seed:offer:<week>` sub-stream, so nothing it does can reach the MAIN
// weekly stream the frozen capture (41550 / e6b0c709) measures.
import {
  isSponsorReviewWeek,
  pruneEntryLetters,
} from './offers'
// The load slice (docs/specs/coach-as-load-manager.md): pure, world-free, world -> coachLoad only.
import { addEvent, seasonIndexOf, seasonStartWeek, financeWindow, financeSeries } from './world/ledger'
import { activeLadderOf, playerShortName, toSnapshot } from './world/snapshot'
export { activeLadderOf, toSnapshot }
import {
  flipScore,
  kidMatchesOf,
  kidMatchEvent,
  computeLossStreak,
  rivalRetirementNews,
  tierMakesWorldNews,
} from './world/matchNews'
export { flipScore, computeLossStreak }
import { pendingKnock, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek } from './world/knock'
export { pendingKnock, ordinaryTrainingWeek, expireKnock, rollKnock, radarViewOf, coachLoadViewOf, decideKnock, isCompetitionWeek }
// ⭐ R2-13 phase 1: the advance's entry gate and the span report, in a leaf module the shell can
// import without pulling the integration core in. Re-exported under `engine/world` like every other
// extraction, so the 280-file public API is unchanged.
import { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, spanDigest, spanRowCount } from './world/multiWeek'
export { advanceRefusal, ADVANCE_REFUSALS, MULTI_WEEK_SPAN, spanDigest, spanRowCount }
export type { SpanWeek } from './world/multiWeek'
import { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution, prunePlannerBookings, pruneInternationalEntries } from './world/planner'
export { bookVacation, cancelVacation, bookPractice, cancelPractice, consecutivePracticeWeeks, practiceCaution }
export type { PracticeCaution } from './world/planner'
import { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRoomNote, COACH_EDGE_REVEAL_WEEKS } from './world/coachMarket'
export { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, setCoachOnJuniorEvents, coachTravelsWithHer, coachBilling, coachEdgeView, coachPlaqueLine, coachLadderNote, coachMarket, coachRoomNote, COACH_EDGE_REVEAL_WEEKS }
// W3-KIT: the till and the shop window. ⚠ `GEAR_CATEGORY_LINE` came back from equipment.ts to this
// file until R2-10 step 2; it left with `resolveGear`, its only reader here, and is imported by
// world/phaseFinance.ts now. See the note at `resolveGear` for why it was priced below world.ts.
import { defaultKitState } from './equipment'
import { setKitGrade, kitLineViews, kitDealView, kitAllowanceRemainingCents, kitStateOf, kitPurchaseSplit, goodWeeksFor, KIT_LINES } from './world/kit'
export { setKitGrade, kitLineViews, kitDealView, kitAllowanceRemainingCents, kitStateOf, kitPurchaseSplit, goodWeeksFor, KIT_LINES }
// W3-SUMMER: the holidays as a real training block - one predicate, both halves.
import { summerBlockWeek, summerLoadFactor, summerConditionCost } from './world/summer'
export { summerBlockWeek, summerLoadFactor, summerConditionCost }
import { startingSkills, withHeadStart, kidMatchPlayer, kidMatchPlayerFor } from './world/player'
export { startingSkills, kidMatchPlayer, kidMatchPlayerFor }
import { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury } from './world/injury'
export { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio, retirementInjury }
import { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS } from './world/masseur'
export { hireMasseur, masseurUnlocked, masseurWorksThisWeek, masseurRoomNote, resolveMasseur, resolveMasseurReturn, masseurRungOf, masseurWeeklyCents, masseurTourRelief, masseurTourWeekCents, setMasseurSessions, setMasseurTravels, MASSEUR_CHANGE_KEY, MASSEUR_LOCKED_DETAIL, MASSEUR_NOTE_WINDOW_WEEKS }
import { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX, INJURY_RELEASE_SUFFIX } from './world/entries'
export { enterEvent, withdrawEvent, releaseEntry, cancelEntry, RELEASE_LINE_PREFIX, INJURY_RELEASE_SUFFIX }
import { eventById } from './world/bookings'
import { KNOCK_HISTORY_MAX } from './world/knockHistory'
export { KNOCK_HISTORY_MAX }
import { fireMilestone, captureMilestone, captureBreakEven, markSchoolEnd, markCoachTravelOpen, maybeFireSeasonWrapUp, emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger, seasonWrapDue } from './world/milestones'
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
  collegeCoachFactor,
  collegeEpilogueLine,
  collegeLeaguePlayedThisWeek,
  collegeMatchesThisWeek,
  inCollege,
  leaveCollege as leaveCollegeState,
  openCollegeYear,
  resolveCallUp,
  resolveCollegeLeague,
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
  collegeCoachFactor,
  collegeEpilogueLine,
  // ⭐⭐⭐ ROUND 24 – THE STUDENT CHAMPIONSHIP: the one tournament a college year is guaranteed, and
  // the predicate that keeps its week from passing in silence. Same six names, same shape, as the
  // call-up above it – deliberately, because they are the same KIND of thing.
  collegeLeagueMatchId,
  collegeLeagueMatchesOf,
  collegeLeaguePlayedThisWeek,
  collegeLeagueWeek,
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
  plateauViewOf,
  autoEndingViewOf,
  resolveCollegeDeparture,
  resolveEndings,
  wasThereAChild,
}
export { buildAlbum, buildScroll } from './world/album'
import { localSponsorCents, reviewSponsors, reviewAdOffer, sponsorNeedMet, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor, academyCoverOf, appearanceFeeFor, resultBonusFor, isRetainerWeek, rolloverKitAllowance } from './world/sponsors'
// W3-ACT2 §7 - the professional rungs' money, re-exported so the tools and the snapshot read one
// implementation exactly as every other sponsor helper is.
export { appearanceFeeFor, resultBonusFor, isRetainerWeek }
export { localSponsorCents, reviewSponsors, reviewAdOffer, sponsorNeedMet, acceptOffer, declineOffer, travelCostFor, coachTravelFareFor, masseurTravelFareFor, rolloverKitAllowance }
import { restRecoveryBonus, recoveryBaseFor, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus } from './world/medical'
export { restRecoveryBonus, recoveryBaseFor, accrueCondition, adShootHolds, withheldFreeWeekRecovery, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus }
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
import { KID_ID, SEASON_MIN_FUTURE, SEASON_CHUNK, RESULTS_WINDOW, EVENTS_CAP, EVENTS_ORDINARY_FLOOR, FINANCE_WEEKS } from './world/constants'
export { KID_ID }
// ⭐⭐ ROUND 24, E2 – THE TWO SENTENCES THE COMMAND GUARD CAN SAY, and the guard that lets the college
// freeze through. Re-exported off the barrel for the same reason `COLLEGE_REVEAL_REFUSAL` is exported
// beside `resumeFromCollege`: they are PLAYER-FACING copy that reaches a toast through the worker's
// error channel, so a test that pinned the spelling instead of the symbol would break a report in
// silence. See the note beside `guardNotEnded` in world/constants.ts for why there are two.
export { CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL, guardNotEndedForGood } from './world/constants'
import { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage, proSubCapUsage, proSubCapRefusalDetail, juniorMerit, proMerit, bestJuniorRankInWindow, withinAnnualEntryLimit } from './world/entryCaps'
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
  settleMandatoryQuota,
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
import { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning, markBirthday } from './world/age'
export { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, kidAgeAt, ageWindowStartWeek, birthdayWeek, birthdayTurning }
// ⭐ v48 – THE BIRTHDAY POPUP AND THE GIFT (docs/specs/birthday-and-gifts.md). Re-exported under the
// historical convention: 111 files import from `engine/world`, so a leaf's public API arrives here.
import { birthdayOffer, birthdayOptions, birthdayHeading, pendingBirthday, buildBirthdayPrompt, chooseGift, birthdayHistory, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER } from './world/birthday'
export { birthdayOffer, birthdayOptions, birthdayHeading, pendingBirthday, buildBirthdayPrompt, chooseGift, birthdayHistory, giftNoun, BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, BIRTHDAY_TIME_TOGETHER }

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
// ⭐ R2-10 STEP 2, PHASE 2 – what the week costs, and the five private helpers it is made of.
// `coachWorksThisWeek` is re-exported under its historical name: the development step below reads
// it, the snapshot reads it, the tests read it, and there must go on being ONE of it.
import { coachWorksThisWeek, weeklyFinance } from './world/phaseFinance'
export { coachWorksThisWeek }
// ⭐ R2-10 STEP 2, PHASE 3 – her body, the week folded once, and her own competition.
// `rivalField` and `TourWeek` come back from the substrate module because the AI side below still
// builds its brackets through the one helper both tournament paths have always shared.
import { deriveWeekField, rivalField, type TourWeek } from './world/weekField'
import { playHerWeek, resolveBodyAndPlanner } from './world/phaseHerWeek'
import type { PendingTournament, WorldState } from './world/state'
export type { PendingTournament, WorldState }
import { SAVE_SCHEMA_VERSION } from './world/state'
export { SAVE_SCHEMA_VERSION }

export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
}

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

// --- rolling calendar --------------------------------------------------------
// Extend the season in whole deterministic year-blocks until at least
// SEASON_MIN_FUTURE weeks ahead are scheduled, then drop resolved (past) weeks and
// any entries pointing at events that no longer lie in the future.
export function ensureSeason(world: WorldState): void {
  // Round 5 item 23: notify the player when a NEW block of the calendar appears –
  // but not for the very first block a career/migration ever generates (nothing to
  // be "new" about a calendar the player has never seen yet).
  const hadSeason = world.season.length > 0
  const horizonChunk = Math.floor((world.week + SEASON_MIN_FUTURE) / SEASON_CHUNK)
  let maxWeek = world.week
  for (const e of world.season) if (e.week > maxWeek) maxWeek = e.week
  let coveredChunk = world.season.length ? Math.floor(maxWeek / SEASON_CHUNK) : -1
  while (coveredChunk < horizonChunk) {
    coveredChunk++
    const start = coveredChunk * SEASON_CHUNK
    world.season.push(...buildSeason(`${world.seed}:s${coveredChunk}`, start, SEASON_CHUNK, world.profile.background))
    if (hadSeason) addEvent(world, { week: world.week, type: 'info', text: 'New events on the calendar' })
  }
  world.season = world.season.filter((e) => e.week >= world.week).sort((a, b) => a.week - b.week)
  const future = new Set(world.season.filter((e) => e.week > world.week).map((e) => e.id))
  world.entries = world.entries.filter((id) => future.has(id))
}


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

// Step 5 of a resolved week: recompute the kid's rank vs the whole field and fire rank milestones.
// Shared by a normal tick (inline) and finalizeTournament (deferred for a reveal week).
function recomputeRankAndMilestones(world: WorldState): void {
  world.prevKidRank = world.kidRank
  // All THREE "before" values, captured together, so no surface can diff across two tables.
  world.prevKidRankDomestic = world.kidRankDomestic ?? null
  world.prevKidRankWta = world.kidRankWta ?? null
  // ⚠ ONE WRITER, ONE MEANING. This used to rank with `computeRanking(results, week, ids)` and NO
  // track predicate - so it folded BOTH ladders into one table and wrote that into `kidRank`, while
  // `recomputeKidRank` wrote the ITF rank into the same field and `computeStandings` rendered the
  // ITF table. Whichever ran last won, so Home and the season wrap-up showed her combined-table
  // place (#4 on 604 points) while the Stats table showed her ITF row (#128 on 4) - the owner's
  // playtest finding, and four items on his list are this one bug wearing different clothes.
  //
  // The two-ladder slice removed `kidPoints`' default track for exactly this reason; this call site
  // survived because it reached for `computeRanking` directly instead. It now defers to the one
  // function that owns the caches, so the field cannot mean two things again.
  recomputeKidRank(world)
  // W2-ENDINGS: ...and the ONE milestone this step still fires. It lives here because this is the
  // step that runs on BOTH paths – inline on a normal week, deferred to finalizeTournament on a
  // reveal week – which is exactly the pair the crossing can land on (the cheque arrives at
  // finalize; the costs arrive on any week at all). Idempotent, so being reached twice is free.
  captureBreakEven(world)
  // Rank milestones ("top 10/50/1") intentionally removed: in the early season almost no one
  // has points, so the first result rockets her to a single-digit rank and all of them fire at
  // once (reads absurdly). A real "world" ranking belief system belongs to the world-news
  // feature (Phase 4+), not this placeholder cohort ranking.
}

// Step 6 of a resolved week: prune ledgers/feeds, roll the calendar forward.
function housekeep(world: WorldState): void {
  pruneResults(world)
  pruneEvents(world)
  pruneFinanceWeeks(world)
  prunePlannerBookings(world)
  pruneInternationalEntries(world)
  // W2-LADDER §6: the tournament desk's receipts age out after a year; contracts never do.
  world.offers = pruneEntryLetters(world.offers, world.week)
  ensureSeason(world)
}

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
      text:
        herShare > 0
          ? `${tier.label} prize money – ${finishLabel(kidFinish)}, less her ${kidPrizeShareBps(ageNow) / 100}% share`
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
  const appearance = appearanceFeeFor(world, event.tier)
  if (appearance > 0) {
    world.fundsCents += appearance
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'income',
      text: `Appearance fee – ${tier.label}`,
      amountCents: appearance,
    })
  }
  const bonus = resultBonusFor(world, event.tier, kidFinish)
  if (bonus > 0) {
    world.fundsCents += bonus
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'income',
      text: `Sponsor bonus – ${finishLabel(kidFinish)} at the ${tier.label}`,
      amountCents: bonus,
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
  world.pendingTournament = null
}

// The canonical AI-only bracket for one event. Runs on its OWN EVENT-SCOPED stream
// `seed:aitour:<event.id>` – the exact mirror of the kid's `seed:kidtour:<event.id>` – covering
// BOTH the entrant selection and the AI-vs-AI matches. ZERO main-stream draws.
//
// Why it is scoped and not on the main weekly stream: the calendar is content. While the brackets
// drew from the main stream, adding a tier or densifying a cadence changed the per-week draw count
// by construction, which re-based every frozen invariance pin – the ladder-up slice had to move
// them for exactly that reason. Scoped by (world.seed, event.id) – two immutable values, and
// event.id is unique per (year, week, tier) – the AI world is now a pure function of the event, so
// content is free and a reloaded career replays its brackets by construction rather than by the
// worker fast-forwarding the main stream onto precisely the right draw.
//
// RIVALS BECOME REAL: the field is built through `rivalField`, so the bracket runs on rivals who
// are tired from their own recent schedule and coloured by how their style suits the surface. That
// costs no draw – both are pure derivations – so everything above still holds. The awarded rows now
// record their `tier`, which is what lets next week's reconstruction read them EXACTLY instead of
// guessing (SeasonResult.tier has always been optional, so this is not a schema bump).
//
// EVERY ENTRANT LEAVES A ROW – SCORING OR NOT (fix/rival-fatigue-rows). This loop used to guard on
// `points > 0`, which was harmless while every finish paid: "has a row" and "played that week" were
// the same fact. Wave B's first-round zero ended that, and the guard then deleted the ONLY record
// that half of every draw had played at all – so `season/rival.ts`, which reconstructs a cohort
// player's strain from her rows, read a rival who lost her opener as having RESTED. She banked
// `recoveryBase` for a week she spent travelling and playing. Measured on the real engine
// (tools/rival-fatigue-audit.ts, 12 cells × 30 seeds × 208w): 45.6% of all cohort appearances were
// charged no strain whatever, the field ran ~4 points of condition fresher than the tennis it
// played, and the cohort's win% against the kid moved with it.
//
// So the row is written for EVERY entrant of the draw and `points` carries the award, 0 included.
// The two facts now live in two fields instead of one presence check, which is what
// `isCountingResult` exists to keep honest: nothing that reads the ledger as a STANDINGS table sees
// a scoreless row (computeRanking / windowedBestSum / the counting-results list all filter it out),
// and the one system that reads it as a record of PLAY – the rival fatigue window – sees all of it.
// This is the same shape `season/prehistory.ts` has always written; the live path is what moved.
//
// COSTS NOTHING ON THE STREAM: pushing a row draws no RNG on any stream, and the loop already
// visited every entrant (`result.finishes` is dense over the whole draw). The frozen MAIN capture
// 41550 / e6b0c709 is untouched by construction – points are post-draw arithmetic, read off a table
// after the bracket has already been resolved. The ledger roughly doubles in size (a 32-draw writes
// 32 rows instead of 16); it is still pruned on the same 52-week rule and stays ~2k rows.
//
// ⚠ SPLIT IN TWO BY THE NO-DOUBLE-BOOKING RULE (31.07), AND THE SPLIT IS THE LOAD-BEARING PART.
// The draw and the bracket used to be one call because they share one `aiRng`: `selectEntrants`
// spends the first N numbers of `seed:aitour:<id>` and `runTournament` continues from N+1. A rule
// that has to see EVERY event of the week before ANY bracket runs cannot be written inside a
// function shaped like that – but re-seeding a second stream for the bracket would restart it at
// draw 0 and move every AI result ever recorded. So `drawAiEntrants` makes the draw and hands the
// LIVE RNG OBJECT on; `runAiTournament` resumes on exactly the number it would have read anyway.
// Same stream, same position, same values: the split is invisible to every sub-stream in the game.
// ⚠⚠ AND SINCE W3-FIELD3 (04.08) A W-TRACK CANONICAL BRACKET IS PLAYED BY PROFESSIONALS.
//
// THE SHAPE, in one sentence: the W rungs' candidate universe becomes LIVE cohort ∪ derived field
// pros positioned by the MERGED W standings – the same `universeForTier` seam, the same
// `selectEntrants`, the same age gate, the same entrant bands the kid's shadow run has used since
// living-field phase W – and `runAiTournament` then writes a ledger row for the LIVE entrants ONLY.
//
// THE FENCE THIS REPLACES said a pro must never be in a canonical draw BECAUSE a pro must never
// write a persisted row. The second clause is still law and is enforced one function down; the
// first turned out not to follow from it, and holding the two together is what shipped a Grand Slam
// at draw 32 (calendar.ts `slam`) and a professional tour whose events no professional played.
//
// WHAT IT COSTS IN PERSISTED STATE: NOTHING, and slightly less than nothing. A 32-draw W event used
// to push 32 junior rows into `world.results`; it now pushes only as many as it drew LIVE girls,
// which at the shipped bands is a handful. No schema, no migration, no new field – and the 52-week
// prune is doing strictly less work than it did yesterday. The two alternatives considered and not
// taken: a parallel non-persisted results view (a second ledger for `rivalConditions` to read, i.e.
// a second thing to keep in step with the first) and a bounded per-season pro-results structure (a
// schema bump to buy a pro a ranking that moves – which is phase 2's pro contour, and it should
// arrive with aging and retirement rather than ahead of them).
//
// WHAT IT COSTS IN FIDELITY, stated so it is not discovered later: a pro's canonical results change
// nothing about her – her standing stays her derived `wtaPoints`, she banks no fatigue, so she is
// fresh every week. See the superseded fence in season/fieldPros.ts for the full accounting.
//
// ⚠ RNG. Zero MAIN draws, exactly as before: `drawAiEntrants` opens `seed:aitour:<event.id>` and
// `runAiTournament` resumes on it, and the frozen capture (41550 / e6b0c709) re-derives
// byte-for-byte on this branch. What DID move is the COMPOSITION of each W event's own sub-stream –
// `selectEntrants` spends one draw per band candidate and a W band now selects from 563 people
// rather than 199 – which is the documented mutable class (every band and age re-pick has moved it)
// and is NOT a fairness break: the count is a function of (seed, week, the kid-free ledger, the
// derived field), every one of which is independent of what the player has entered or won. The six
// non-W rungs are byte-identical, because `universeForTier` hands them back the same array instance.
// `TourWeek` and `W_TRACK_PROBE`: moved to world/weekField.ts with `deriveWeekField`, which is the
// only thing that builds one (R2-10 step 2, phase 3). The type is imported back for the three
// functions below that are handed one.

function drawAiEntrants(
  world: WorldState,
  event: SeasonEvent,
  aiRanking: RankingRow[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  /** see `computeShadowTournament`'s own note - the AER ledger, required for the same reason. */
  entries: ReadonlyMap<string, number>,
): { event: SeasonEvent; entrants: AiPlayer[]; rng: Rng } {
  const rng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  // `universeForTier` is the seam and it is asked BY TIER, so a non-W event provably gets
  // `world.cohort` itself back (reference equality, pinned in tests/season/fieldPros.test.ts) and
  // reads the mixed junior table it always read.
  const isW = TIERS[event.tier].track === 'wta'
  const universe = withinAnnualEntryLimit(
    universeForTier(event.tier, world.cohort, tour.pros),
    event.tier,
    entries,
    TIERS[event.tier].drawSize,
  ) as AiPlayer[]
  return {
    event,
    entrants: selectEntrants(event, universe, isW ? tour.ranking : aiRanking, rng, fatigue),
    rng,
  }
}

/** THE HELD SLOTS OF THE WHOLE WEEK (W3-ONRAMP, 04.08) – step 4b½, between the week's resolution and
 *  its brackets.
 *
 *  WHY IT IS ITS OWN PASS AND NOT PART OF THE DRAW: `season/tournament.ts`'s ⚠⚠ box has the
 *  measurement. In one sentence – a held slot filled at DRAW time can land on a junior the same
 *  week's J300 has also drawn, `resolveDoubleBookings` then correctly hands her to the higher rung,
 *  and the junior event backfills with a STRONGER player. Every held slot silently upgraded a junior
 *  draw. Filling here, from the players the resolved week has left free, makes "one body, one week"
 *  true of the held slots by construction and leaves the junior tour untouched.
 *
 *  STRONGEST RUNG FIRST, exactly as `resolveDoubleBookings` orders itself – literally so since
 *  round 22: both call the one `byAllocationPriority` in season/tournament.ts, so "exactly as" is a
 *  fact the compiler holds rather than one this comment promises. A graduate good enough for a W100
 *  is therefore not spent on the W15 that happens to sort first in the calendar. The brackets still
 *  PLAY in calendar order (the ledger's row order is unchanged); only the filling is re-ordered, and
 *  each event's own `seed:aitour:<id>` stream sees its draws in the same place either way. */
function fillWeekOnRamps(
  world: WorldState,
  drawn: readonly { event: SeasonEvent; entrants: AiPlayer[]; rng: Rng }[],
  fields: Map<string, AiPlayer[]>,
  aiRanking: RankingRow[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  /** the AER ledger - see `computeShadowTournament`'s note. Required for the same reason. */
  entries: ReadonlyMap<string, number>,
): void {
  const booked = new Set<string>()
  for (const field of fields.values()) for (const p of field) booked.add(p.id)
  const wEvents = drawn
    .filter((d) => TIERS[d.event.tier].track === 'wta')
    .sort((a, b) => byAllocationPriority(a.event, b.event))
  for (const d of wEvents) {
    const before = fields.get(d.event.id) ?? d.entrants
  // ⭐⭐ ...AND THE AER REACHES THE BACKFILLS TOO, which is where the first attempt leaked. Gating
  // the DRAW's universe left `ai-177` one entry over her row, because the held slots do not come
  // from that universe: this pool is `world.cohort` itself, and the on-ramp exists precisely to hand
  // W slots to juniors - the one population the rule caps. A gate the backfills can walk around is
  // the thing `selectEntrants`' own age-gate comment warns about, one storey up.
    const after = fillOnRamp(
      d.event,
      before,
      tour.ranking,
      d.rng,
      {
        pool: withinAnnualEntryLimit(world.cohort, d.event.tier, entries, ON_RAMP.slots) as AiPlayer[],
        ranking: aiRanking,
        admits: tour.doors.at(d.event.tier),
        slots: ON_RAMP.slots,
      },
      fatigue,
      booked,
    )
    const withCards = fillWildCards(world, d.event, after, tour, fatigue, booked, entries)
    fields.set(d.event.id, withCards)
    for (const p of withCards) booked.add(p.id)
  }
}

/** ⭐⭐ THE EIGHT WILD CARDS OF A SLAM DRAW (round 21 #2b) – `fillOnRamp` in its second
 *  configuration, and NOT a second held-slot mechanism. See `WILD_CARD` in season/tournament.ts for
 *  what a wild card is here, why the ground is the home nation, and why a returning name is not
 *  expressible.
 *
 *  THE FOUR THINGS THIS CALL SITE DECIDES, all of which `fillOnRamp` then obeys unchanged:
 *
 *  1. **THE POOL IS THE HOST NATION'S PLAYERS** – `fillOnRamp` has no idea what a nation is and is
 *     not being taught one. The whole home-nation ground is a filter on the pool it is handed, which
 *     is the same seam `universeForTier` uses to keep a population question out of bracket code.
 *     ⚠ It is the event's WHOLE universe (cohort ∪ derived professionals), not `world.cohort`: at
 *     #113-#333 of a 1,799-row table almost everybody is a professional, and a wild card drawn from
 *     the live juniors alone would be `ON_RAMP` again under a different name.
 *
 *  2. **THE DOOR IS INVERTED** – `OnRamp.admits` is normally "the rung accepts her"; here it is
 *     `wildCardWindow`, i.e. "the rung REFUSED her and she is still of the level". A direct
 *     acceptance who was also handed a wild card would make the marker on the card a lie.
 *
 *  3. **ITS OWN SUB-STREAM, so the event's `seed:aitour:` draws do not move** – one draw per
 *     host-nation candidate off `seed:wildcard:<eventId>`. Nothing is added to MAIN (invariant 2),
 *     and the field the week already selected is bit-for-bit the field it selected.
 *
 *  4. **AFTER THE ON-RAMP, not before.** Both passes drop the last direct acceptances, so whichever
 *     runs second can displace what the first put in. The order is the entry list's own – places
 *     close, then the tournament announces its wild cards – and it is very nearly moot in practice:
 *     the on-ramp's candidates must clear `doors.at('slam')`, i.e. sit inside #112 of a table with
 *     1,600 professionals in it, which a live junior essentially never does.
 *
 *  ⚠ HER OWN DRAW IS NOT TOUCHED, and that is the seam `fillOnRamp`'s ⚠ SCOPE box already names:
 *  the shadow bracket she plays in (`seed:kidtour:`) fills from professionals alone, so widening it
 *  moves her measured difficulty at every W rung and is a second change wanting its own measurement.
 *  What decides whether SHE holds a wild card is the entry gate, not this function – see
 *  `homeWildCardPlace` in world/ladder.ts, which reads the same `wildCardWindow`. */
function fillWildCards(
  world: WorldState,
  event: SeasonEvent,
  field: AiPlayer[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  booked: ReadonlySet<string>,
  /** the AER ledger - see `computeShadowTournament`'s note. A wild card is a DOOR and not an
   *  exemption: it decides WHO the host nation may promote, never how many events a fifteen-year-old
   *  may play. Same reading as `fillWeekOnRamps` one function up. */
  entries: ReadonlyMap<string, number>,
): AiPlayer[] {
  if (event.tier !== WILD_CARD.tier || WILD_CARD.slots <= 0) return field
  const host = hostNationOf(world.seed, event.id)
  const pool = withinAnnualEntryLimit(
    tour.universe.filter((p) => p.nation === host),
    event.tier,
    entries,
    WILD_CARD.slots,
  ) as AiPlayer[]
  if (!pool.length) return field
  const accepts = acceptanceRank(world, event.tier)
  const total = tour.ranking.length
  const rankOf = new Map<string, number>()
  for (const r of tour.ranking) rankOf.set(r.playerId, r.rank)
  return fillOnRamp(
    event,
    field,
    tour.ranking,
    rngFromSeed(`${world.seed}:wildcard:${event.id}`),
    {
      pool,
      ranking: tour.ranking,
      admits: (id) => wildCardWindow(event.tier, rankOf.get(id) ?? total, total, accepts),
      slots: WILD_CARD.slots,
    },
    fatigue,
    booked,
  )
}

function runAiTournament(
  world: WorldState,
  event: SeasonEvent,
  entrants: AiPlayer[],
  aiRng: Rng,
  fatigue: Map<string, number>,
): void {
  const field = rivalField(entrants, event, fatigue)
  const result = runTournament(event, field, null, world.seed, aiRng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    // ⚠ THE LEDGER IS FOR LIVE PLAYERS, AND THIS LINE IS THE WHOLE OF THAT RULE (W3-FIELD3). A
    // field pro is derived state: she has no persisted identity, her standing is `wtaPoints` and
    // her condition is 100 by construction, so a row for her would be a row nothing ever reads –
    // bought with permanent bytes in a save that prunes on a 52-week window sized for 199 people.
    // She played the tournament; the tournament simply does not write her down.
    // ⭐⭐ v53 – THE FIELD'S POINTS ARE KEPT NOW, AS A TALLY RATHER THAN AS ROWS. This line used to be
    // a bare `continue`, and the comment above it argued – correctly – that a per-finisher ROW for a
    // field pro is bytes nobody reads in a save pruned for 199 people. What it did not see is that
    // throwing the row away also threw away the RESULT: her standing was a pure function of (seed,
    // season), so no match anybody played could move it. The owner found it from the seat: «таблица
    // просто "стоит"… и номер 1 мы обыгрывали на шлеме».
    //
    // ⚠ SO THE ROW STAYS GONE AND THE POINTS STAY. One number per pro per season, ~3 KB, against
    // ~6,048 rows – see `WorldState.fieldSeasonPoints`. Zero RNG: the finish is already decided.
    if (isFieldProId(playerId)) {
      const earned = pts[finish] ?? 0
      if (earned > 0) {
        world.fieldSeasonPoints ??= {}
        world.fieldSeasonPoints[playerId] = (world.fieldSeasonPoints[playerId] ?? 0) + earned
      }
      continue
    }
    world.results.push({ playerId, week: world.week, points: pts[finish] ?? 0, tier: event.tier })
  }
  announceTourChampion(world, event, result)
}

// WHICH RUNGS' CANONICAL CHAMPIONS MAKE THE NEWS – now `tierMakesWorldNews` in world/matchNews.ts,
// moved there whole by round 23 #3b when the retirement line became its second reader. The rule and
// the feed-budget arithmetic behind it are unchanged; see that function's own note.

/** THE W TOUR CAN NAME ITS CHAMPION NOW, AND SHE CAN BE A PROFESSIONAL (W3-FIELD3, acceptance
 *  criterion 2). Before this wave the canonical brackets resolved in silence and the only champion
 *  line in the game was `finalizeTournament`'s, about the draw SHE played in; the field's ⚠ said in
 *  as many words that AI W-tour news could name LIVE players only, because no pro was ever in a
 *  canonical draw to win one.
 *
 *  ⚠ ONE TOURNAMENT, ONE CHAMPION. The event she ENTERED is skipped here, because her shadow run
 *  and the canonical bracket are two different universes for the same event id (they always have
 *  been – separate streams, separate fields) and printing both would put two champions of one
 *  tournament in one week's news. Hers is the draw she actually played, so hers is the one that
 *  speaks. This reads `world.entries`, i.e. player input – deliberately, and it is confined to a
 *  news row: ZERO RNG, no ledger row, nothing any draw or ranking can see.
 *
 *  Names resolve through `playerShortName`, the same id→name function every bracket surface uses,
 *  so an `fp-` id comes back as a person rather than as an id. */
function announceTourChampion(world: WorldState, event: SeasonEvent, result: TournamentResult): void {
  if (!tierMakesWorldNews(event.tier)) return
  if (world.entries.includes(event.id)) return
  const championId = Object.entries(result.finishes).find(([, f]) => f === 0)?.[0]
  if (!championId) return
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `🏆 ${playerShortName(world, championId)} won the ${TIERS[event.tier].label}.`,
  })
}

function pruneResults(world: WorldState): void {
  world.results = world.results.filter((r) => world.week - r.week <= RESULTS_WINDOW)
}

// ⚠ HER MATCHES ARE PRUNED LAST, AND THE RADAR IS WHY (31.07).
//
// `radarViewOf` builds the radar's whole evidence base by scraping `world.events` for her own
// competitive match records - and this function trims that feed BY COUNT, oldest-first. Those two
// facts together make an undocumented coupling with teeth: **every non-match row any feature adds
// permanently displaces one of her matches from the window `axisEvidence` measures over.** The
// offers slice found it the expensive way - one extra row per season pushed the radar's worst fog
// re-widening from 0.36 to 0.64 against a 0.5 bound - and designed around it rather than into it.
//
// Designing around it does not scale, because the pressure is not the new feature. Measured on a
// career that plays no tournaments at all, the retained feed is 217 expense + 168 income rows out
// of 400: the window the radar reads is **overwhelmingly bookkeeping**. Money rows accrue every
// single week of a career; her matches accrue only on the weeks she competes. Left alone, the
// arithmetic guarantees that the longer a career runs the less of her tennis the radar can see -
// which is the exact opposite of what a confidence model is supposed to do.
//
// So the budget is unchanged and only the ORDER OF SACRIFICE moves: milestones first (they always
// were), then her competitive matches, then everything else. The cap still bites at the same size,
// the feed is still bounded, and a feature that writes to the feed can no longer quietly cost the
// radar its evidence. A practice friendly is deliberately NOT protected - the radar ignores
// friendlies by design (R11-2), so protecting one would spend the budget on a row it will not read.
function isRadarEvidence(e: WorldEvent): boolean {
  return e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID)
}

// ⚠⚠ ...AND THE ORDER OF SACRIFICE IS NOT ALLOWED TO REACH ZERO (fix/wallet-and-wrapup, 05.08).
//
// The paragraph above is still the rule and still right: an ordinary row is cheaper to lose than one
// of her matches. What it did not say is what happens when the protected class STOPS LEAVING ROOM,
// and the answer was measured on the owner's own save at week 412: 382 match rows + 18 kept
// milestones = 400 = the whole cap, `rest` empty, and therefore EVERY income and expense row of
// EVERY week deleted on the tick that wrote it. His week recap read «FINANCES · Income +$0 · Spent
// +$0» beside three real matches, and the Money screen's ledger tab had no transactions at all.
//
// The asymmetry is structural rather than accidental: ordinary rows are a FLOW (2-6 a week, for
// ever) and her matches are a STOCK, so absolute priority for the stock is not a preference between
// two competing classes – it is a guarantee that the flow reaches zero on a long enough career. The
// two ledger-side fixes in this wave (the recap's money, the wrap-up's best result) mean no SCREEN
// depends on this any more, but the feed still owns things nothing else records – the flavour lines,
// the ledger's individual transactions, the tournament summary the travel note quotes – and none of
// those is reconstructible from a per-category total. So the newest `EVENTS_ORDINARY_FLOOR` of them
// are off the table until her matches have been trimmed to their own share. See constants.ts.
function pruneEvents(world: WorldState): void {
  if (world.events.length <= EVENTS_CAP) return
  const kept = world.events.filter((e) => e.keep)
  const evidence = world.events.filter((e) => !e.keep && isRadarEvidence(e))
  const rest = world.events.filter((e) => !e.keep && !isRadarEvidence(e))
  const overflow = world.events.length - EVENTS_CAP
  // Ordinary rows go first, oldest-first, but only down to the floor.
  const sacrificeable = Math.max(0, rest.length - EVENTS_ORDINARY_FLOOR)
  const fromRest = Math.min(overflow, sacrificeable)
  let stillOver = overflow - fromRest
  // Then her matches, oldest-first as before.
  const fromEvidence = Math.min(stillOver, evidence.length)
  stillOver -= fromEvidence
  const evidenceTrimmed = evidence.slice(fromEvidence)
  // And only when trimming every match she has ever played is STILL not enough does the floor
  // itself give way – a career whose kept milestones alone approach the cap.
  const restTrimmed = rest.slice(fromRest + stillOver)
  world.events = [...kept, ...evidenceTrimmed, ...restTrimmed].sort((a, b) => a.id - b.id)
}

// Drop finance-ledger weeks older than the 60-week trailing window (retain week >= week - 59).
// Bounded by career length, not event volume, so it stays ≤ ~60 entries no matter the season.
function pruneFinanceWeeks(world: WorldState): void {
  world.financeWeeks = world.financeWeeks.filter((w) => w.week >= world.week - (FINANCE_WEEKS - 1))
}

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
  //    world (world/weekField.ts). Zero draws. Destructured on the next line so the AI step below
  //    reads exactly as it did.
  const field = deriveWeekField(world)
  const { scheduled, aiRanking, rivalFatigue, rivalEntries, tour: tourWeek } = field

  // 5. HER OWN COMPETITION (R2-10 step 2, phase 3b) – step 2 and the masseur's bill, moved whole
  //    into world/phaseHerWeek.ts. Event-scoped RNG only (`seed:kidtour:<event.id>`).
  playHerWeek(world, field, playedThisWeek)

  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  driftCohort(world.cohort, rng)

  // 3b. SHE DEVELOPS (Phase 4). Deliberately here, beside the cohort's own drift: the whole point
  //     is that both sides of the ladder move, and putting them on adjacent lines is the cheapest
  //     way to keep it that way. ZERO main-stream draws – `growWeek` reads `seed:growth:<week>`,
  //     its own stream – so the frozen capture cannot move.
  //
  //     The matches that feed it are the ones she has actually played, so a tournament week teaches
  //     her and a training week does not pretend to.
  //
  // ⚠ LAST WEEK'S, NOT THIS WEEK'S, AND THE OFF-BY-ONE WAS A BUG THAT MADE THIS TERM DEAD CODE.
  //   This line used to read `e.week === world.week`, described as "counted off the ledger she just
  //   wrote". She had not written it. `tickWeek` increments `world.week` at its first statement and
  //   reaches here at step 3b; the draw for this week is only COMPUTED here (step 2 sets
  //   `pendingTournament`) and its match rows are written later, by `revealNextRound` /
  //   `skipTournament`, which are COMMANDS the caller issues after the tick returns. So the filter
  //   asked for rows that could not exist yet, and `matchesThisWeek` was 0 on every week of every
  //   career: `matchBonus` (up to +54% on a week's rate, `1 + min(m, 3) x 0.18`) had never once
  //   fired. Measured before the fix, tools/skill-ceiling.ts: 0 firing weeks over 31,000 weeks of
  //   career against 20,659 matches actually played.
  //
  //   `world.week - 1` is the honest read and needs no new state: `advanceWeeks` refuses to move
  //   while a reveal is open, so by the time the next tick runs, the previous week's rows are
  //   complete and final. The sentence the model tells is now "the competition she played last week
  //   is in her legs this week", which is also the truer one - a girl does not learn from a match
  //   on the morning she plays it.
  //
  //   ZERO RNG IMPLICATIONS: `growWeek` spends exactly one draw off `seed:growth:<week>` whatever
  //   this number is, and this file's own MAIN budget (base costs + 4 x cohort) is untouched, so the
  //   frozen capture (41550 / e6b0c709) cannot move. What DOES move is her skills, and through them
  //   the results she goes on to produce - see docs/specs/skill-model-audit-2026-08.md for the
  //   measured size (peak skill +0.3 on a managed career, +1.0 on a grinder).
  const matchesThisWeek = world.events.filter(
    (e) => e.week === world.week - 1 && e.type === 'match' && !e.friendly,
  ).length
  world.skills = growWeek({
    skills: world.skills,
    potential: world.potential,
    // ⚠ HER REAL AGE, not the band's - and this REPLACED a hybrid that said the same thing worse. It used
    // to be `ageAtWeek(week) + relativeAgeYears(birthMonth)`: the band's age plus an offset standing in
    // for a birthday. `kidAgeExact` is the birthday itself, off the game's own calendar, so the number is
    // now a fact rather than a correction - and a December girl develops at 13 because she IS 13, which is
    // the owner's point. Same magnitude, one concept instead of two. No new draw: `growWeek` keeps
    // `seed:growth:<week>`.
    ageYears: kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay),
    plan: world.plan,
    // ⚠ HE ONLY COACHES THE WEEKS HE IS PAID FOR, and since 08.08 that is every week except college
    //     and a booked family holiday. The pairing is the invariant, not the list: a week the family
    //     is billed for is a week he is there, and a week it is not billed for develops at the
    //     self-coached rate. Same predicate the bill used at step 1, so the two can never disagree
    //     about whether he came - which is what made the R4 reversal a one-line change here.
    coach: coachWorksThisWeek(world) ? coachById(world.seed, ageAtWeek(world.week), world.coachId) : null,
    playStyle: world.profile.playStyle,
    // ⭐⭐ AND AT COLLEGE THE MATCHES ARE THE SQUAD'S (17.08, docs/specs/the-college-choice-2026-08.md).
    //
    // `world.events` has no match rows inside the freeze – she enters nothing – so this term was 0 for
    // 208 weeks and a college programme was, developmentally, a girl practising alone. It is the one
    // thing a dearer place buys her tennis: a stronger squad plays a longer, harder dual-match season.
    //
    // ⚠ THE ADDITION IS SAFE BECAUSE EXACTLY ONE OF THE TWO IS EVER NON-ZERO. `collegeMatchesThisWeek`
    // returns 0 outside the freeze, and inside it the filter above finds nothing. ⚠ AND IT SPENDS THE
    // ENGINE'S OWN TUNED TERM RATHER THAN A NEW ONE – `matchBonus` / `matchBonusCap` are unchanged, so
    // this phase cannot inflate its own dimension by raising the ceiling on what a match is worth.
    // ⚠ ZERO DRAWS: a count, not a roll.
    matchesThisWeek: matchesThisWeek + collegeMatchesThisWeek(world),
    // ⭐⭐⭐ AND AT COLLEGE THE PROGRAMME COACHES HER (round 21, the owner's ruling of 17.08:
    // «она училась и работала»). `undefined` on every other week of every career, so this line is
    // provably inert outside the freeze – see `collegeCoachFactor`, which returns undefined the
    // moment `inCollege` is false or the career was never quoted a place.
    //
    // ⚠ THE `coach:` LINE ABOVE STAYS AS IT IS AND IS STILL `null` HERE, because `coachWorksThisWeek`
    // is what the BILL reads: the family is not paying for the programme's coaching and must not be.
    // The override replaces the rate; it does not hire anybody.
    coachFactorOverride: collegeCoachFactor(world),
    seed: world.seed,
    week: world.week,
    // ⚠ W4 – THE PRICE OF RESTING A KNOCK, and the whole reason `growWeek` gained this knob. She is
    // doing rehab and light hitting, not training, so the week earns KNOCK_REST_GROWTH of what it
    // would have. Expressed HERE as a multiplier on the week rather than as a lower `plan.train`
    // because `trainFactor` clamps below 60 – a career already on Light would otherwise have rested
    // for free, which is the farming hole this shape closes (knock.ts, note (a)).
    //
    // ⚠ W3-SUMMER – AND THE OTHER DIRECTION, ON THE SAME KNOB. The holidays have no school in them, so
    // she is on court twice a day, and the owner's ruling is that this is VOLUME rather than a better
    // multiplier: «если мы летом сделаем реальную нагрузку с 2 тренировками в день... это как раз
    // частично компенсирует недостаток тренерских недель в другие периоды». `loadFactor` is exactly
    // the right channel - its own note calls it "HOW MUCH OF THE WEEK SHE ACTUALLY TRAINED" - and the
    // coach, the plan slider and the luck draw are all untouched, which is what keeps summer from
    // being a second, hidden coach.
    //
    // The two never multiply into nonsense: `summerBlockWeek` refuses on a rested knock (she is off
    // the training court, so she cannot also be on it twice a day), so exactly one of these is ever
    // different from 1. ZERO draw implications - `growWeek` keeps `seed:growth:<week>`, one pull.
    loadFactor: (knockRestWeek(world.knock, world.week) ? KNOCK_REST_GROWTH : 1) * summerLoadFactor(world),
  })

  // 3c. W4 – AND SHE CAME OFF COURT SORE. Deliberately LAST of the things that happen to her body,
  //     and after `growWeek`: the week's work is done and banked, and the knock is what she is left
  //     with on the Friday. Anything earlier would read as a knock she then trained through anyway.
  //
  //     ZERO main-stream draws – `drawKnock` reads `seed:knock:<week>`, its own per-week sub-stream,
  //     exactly as `rollInjury` reads `seed:injury:<week>` – so the frozen capture (41550 /
  //     e6b0c709) cannot move. `ordinaryTrainingWeek` also rules out every week with a pending
  //     tournament, so a knock can never arrive on a week the reveal flow still owns.
  // ⚠ AND NOT AT COLLEGE, for a mechanical reason as well as a fictional one: a knock BLOCKS the
  //   advance until the parent answers it, and there is no parent in the loop for those four years -
  //   an unanswered knock raised inside the freeze would strand the jump. `seed:knock:<week>` is a
  //   sub-stream, so the skipped draw is invisible to the MAIN capture.
  // ⭐ P5 – AND AT COLLEGE THE THING THAT HAPPENS TO HER IS A LETTER INSTEAD. Deliberately the same
  //   slot as the knock, because it is the same KIND of step: something arriving from outside that
  //   she did not ask for and cannot refuse. `resolveCallUp` fires at most once a year, only inside
  //   the freeze, and draws on `seed:callup:<week>` – its own sub-stream, exactly as `rollKnock`
  //   reads `seed:knock:<week>` – so the frozen MAIN capture cannot see it either.
  //   It pays NO money and NO ranking points, because the sport awards neither: it never touches
  //   `world.results` and no rank is recomputed for it. See engine/nationalTeam.ts for the sources.
  // ⭐⭐⭐ ROUND 24 – AND ONE WEEK OF THE YEAR IS HERS: THE STUDENT CHAMPIONSHIP. The owner, 21.08:
  //   «как минимум 1 турнир в год колледжа… тогда вызов в сборную можно будет опереть на результаты
  //   студенческого». Measured before it: 48 college years held 0.71 watchable matches between them,
  //   because the two squad trips write no rows and the letter was a 40% roll.
  //   ⚠ THE LEAGUE IS RESOLVED FIRST AND THAT IS CAUSAL ORDER RATHER THAN NEED. The two fire on
  //   different weeks (season 12 and 14), so neither can see the other's tick; the order here says
  //   which one the reader should understand first, and `resolveCallUp` reads the championship
  //   through `lastLeagueRun` rather than through anything this line arranges.
  //   ⚠ ITS OWN SUB-STREAM, `seed:collegeleague:<week>`, plus one `seed:collegematch:<week>:<r>` per
  //   round – so `seed:callup:<week>` is byte-identical to what it was and the frozen MAIN capture
  //   (41550 / e6b0c709) cannot see either of them.
  if (!inCollege(world)) rollKnock(world)
  else {
    resolveCollegeLeague(world)
    resolveCallUp(world)
  }

  // 3d. AND SHE HAS A BIRTHDAY. The owner, 30.07: the birth month should show up in the notes.
  //
  //     ONE WEEK A YEAR, and it is the first thing in the game that says her birth month out loud. The
  //     player picks it in onboarding and until now it fed one cosmetic line on screen C - so the number
  //     deciding her whole relative-age story was invisible. Now the week it names stops and says so.
  //     ZERO DRAWS: a calendar comparison. Placed after `rollKnock` so a birthday week that also carries
  //     a knock reads in the order it happened - she came off court sore, and it was her birthday.
  //     ⭐⭐⭐ ROUND 24: ...AND THE COLLEGE YEARS GET THE DIALOG NOW, SO THE SPECIAL LINE IS GONE
  //     (owner, 22.08: «да, день рождения делай», superseding 19.08's feed-line substitute). The
  //     prompt is raised inside the freeze too - `resumeFromCollege` pauses the year on this very
  //     week - so the line is one sentence for every birthday of her life; see `markBirthday`.
  markBirthday(world)

  // 3e. ...AND ONE SEPTEMBER SHE DOES NOT GO BACK (W4-SCHOOL). The owner: «Школа должна когда-то
  //     закончиться, ей уже 21» and «Конец школы – в конце учебного года». Beside the birthday for
  //     the same reason the birthday is here: it is a date on the family's calendar rather than a
  //     result, it fires at most once, and it costs one integer comparison and no draws. AFTER the
  //     birthday, because the year she leaves she is already eighteen and the two lines read in that
  //     order.
  markSchoolEnd(world)

  // 3f. ⭐ ROUND-21 #2 – ...AND THE ONE TIME THE GAME TELLS HER THE COACH CAN COME TOO. The owner
  //     asked for this notice on 08.08 and `docs/decisions.md` recorded that it could not be built
  //     while travel could never happen. It can now. Beside the two dates above for the same reasons
  //     they are beside each other: at most once per career, a comparison and a scan, zero draws.
  markCoachTravelOpen(world)

  // 4. canonical AI tournaments for ALL scheduled events. ZERO main-stream draws: each event's
  //    bracket runs on its own `seed:aitour:<event.id>` stream, so the calendar's SIZE no longer
  //    touches the weekly draw count. The main stream ends here carrying base costs + drift only.
  //
  //    ⚠ DRAW THE WHOLE WEEK, THEN RESOLVE IT, THEN PLAY IT (31.07 – «они физически не могут сразу
  //    везде играть, ведь так?»). It used to be one loop that drew and played each event in turn,
  //    which is why the same rival could be in two of a week's draws: each `selectEntrants` call saw
  //    the same condition map and nothing else about the week. The three phases below are the ONLY
  //    way to say "not twice" without touching a draw:
  //      4a. every event draws its field exactly as it always did – same stream, same order, same
  //          count. Safe to hoist because it always was independent of the brackets: `aiRanking` and
  //          `rivalFatigue` are snapshots taken above, `world.cohort` is read-only here, and
  //          `runAiTournament`'s ledger rows are never read back inside the same week. So phase 4a
  //          returns, event for event, precisely what the old loop's first line returned.
  //      4b. pure post-draw arithmetic on those arrays – higher tier keeps her, the loser backfills
  //          by standings position. ZERO draws on any stream (season/tournament.ts).
  //      4c. the brackets play, in the ORIGINAL calendar order and each on the very number of its
  //          own sub-stream it was going to read, so the ledger's row order is unchanged too.
  //
  //    ⚠ AND A WEEK NOW HOLDS TWO UNIVERSES (W3-FIELD3). The W events draw from LIVE ∪ pros against
  //    the merged W table; the six junior/domestic rungs draw from the cohort against the mixed one.
  //    4b spans both with ONE `booked` set, because it has to: the cohort's 16-18s are eligible for
  //    both tours, so "she cannot be in two draws" is a claim about the WEEK and not about a track.
  //
  //    ⚠ AND 4b½: THE HELD SLOTS (W3-ONRAMP). The W rungs keep `ON_RAMP.slots` of their draws for
  //    LIVE players coming up from the junior table – the closed loop W3-FIELD3 left behind was that
  //    a cohort player could never be drawn into a W event, so could never earn a W point, so could
  //    never leave the position that kept her out (measured: 0.0 LIVE W rows a season). It runs
  //    AFTER 4b on purpose, from the players the resolved week has left free: see `fillWeekOnRamps`.
  const weekDraws = scheduled.map((e) => drawAiEntrants(world, e, aiRanking, tourWeek, rivalFatigue, rivalEntries))
  const weekFields = resolveDoubleBookings(weekDraws, world.cohort, aiRanking, rivalFatigue, {
    universe: tourWeek.universe,
    ranking: tourWeek.ranking,
  })
  fillWeekOnRamps(world, weekDraws, weekFields, aiRanking, tourWeek, rivalFatigue, rivalEntries)
  for (const d of weekDraws) {
    runAiTournament(world, d.event, weekFields.get(d.event.id) ?? d.entrants, d.rng, rivalFatigue)
  }

  // 5-6. rank recompute + housekeeping. For a reveal week these are deferred to finalizeTournament
  //      (after the kid's points land), so the rank milestones keep their id order behind the kid's
  //      match/summary events. A normal week resolves them inline as before.
  if (!world.pendingTournament) {
    recomputeRankAndMilestones(world)
    housekeep(world)
    // ⚠ THE SEASON'S COMMITMENT IS SETTLED ON THE WRAP WEEK AND BEFORE THE WRAP-UP READS ANYTHING
    // (W3-ACT2 §6). `maybeFireSeasonWrapUp` fires on the first off-season week; the 500-level quota
    // is a fact about the season that has just finished, so it has to be charged on the same week
    // and ahead of the summary that reports it. Both are no-ops on every other week and neither
    // draws. `isSponsorReviewWeek` is the same predicate one line's worth of arithmetic away, which
    // is deliberate: the tour and the brands both settle up in the first quiet week.
    if (isSponsorReviewWeek(world.week)) settleMandatoryQuota(world, world.week)
    maybeFireSeasonWrapUp(world)
    // 7. W2-ENDINGS – WHERE THE CAREER ENDS. Last, and AFTER the wrap-up, because the natural end's
    //    offer is a reading of the season that has just closed: `seasonHistory` has to have that
    //    row in it before the plateau can be measured against it. Pure state, ZERO draws on any
    //    stream, and `tickWeek` still has no ended-world early return (see world/endings.ts).
    resolveEndings(world)
  }
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
    if (world.fundsCents < 0) stops.add('funds')
    // W2-ENDINGS. The three that the week may have just produced. `'ending'` is collected rather
    // than returned early so a week that is BOTH an ending and something else (the classic: the
    // season wraps up and she takes the offer on the same week) still reports both – R11-1's rule,
    // and the epilogue is the surface that renders last anyway.
    if (world.ending) stops.add('ending')
    if (world.fork !== null && world.fork.answer === null) stops.add('fork')
    if (world.retirementOffer !== null) stops.add('retirement')
    if (stops.size > 0) break
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
  // ⭐⭐⭐ ROUND 24 – AND NOT OVER AN UNANSWERED BIRTHDAY EITHER (the owner's «да, день рождения
  // делай»). The identical contract `advanceWeeks` keeps at its own entry, engine-side because the
  // worker is not the gate (invariant 1): the dialog covers the button, but a stale screen must not
  // be able to spend a year past the one popup the owner asked to fire ALWAYS. A RETURN and not a
  // throw, unlike the reveal above, because this state is HEALTHY – the dialog is on screen off the
  // snapshot field, `chooseGift` is its exit, and the same click works the moment it is answered.
  // Nothing is mutated and nothing is drawn; `['birthday']` is the same no-op report the advance
  // gives, so the caller cannot mistake a refusal for a spent year.
  if (pendingBirthday(world) !== null) return ['birthday']
  // ⭐ THE YEAR IN PROGRESS, OR A FRESH ONE. `pendingYearStart` is non-null exactly when the last
  // press paused mid-year on her birthday: the year's opening measurements are HISTORY by now (her
  // skill, her rank and the family balance have moved since), so they are persisted at the pause and
  // read back here rather than re-measured – or the banked year would open at the birthday week with
  // the wrong four numbers. `?? null` because the field is optional (see CollegeState: D2 owns
  // `answerFork` next, so enrolment does not write it; absent and null mean the same thing).
  const start = college.pendingYearStart ?? openCollegeYear(world)
  // Off the year's own OPENING, not off `world.week`: for a fresh year the two are the same week,
  // and for a resumed one this is what keeps the academic boundary where the first press put it –
  // a year paused for a cake is finished, not restarted.
  const yearEnds = Math.min(college.untilWeek, start.week + WEEKS_PER_YEAR)
  world.ending = null
  const stops = new Set<StopReason>()
  while (world.week < yearEnds && world.ending === null) {
    tickWeek(world, rng)
    if (world.pendingTournament) throw new Error(COLLEGE_REVEAL_REFUSAL)
    // ⚠ ASKED AFTER THE TICK AND OF THE WORLD, never threaded back through `tickWeek` – the whole
    // point of `callUpPlayedThisWeek` being a predicate. One `stops.add`, exactly like the academy's.
    if (callUpPlayedThisWeek(world)) stops.add('call-up')
    // ⭐⭐⭐ ROUND 24 – AND THE ONE WEEK THAT ALWAYS HAPPENS. Unlike every other member of this set
    // the championship is not a roll, so this line fires in EVERY college year – which is the point:
    // a year that produced a tournament and reported nothing would be the silence round 23 #16 was
    // about, with better tennis behind it.
    if (collegeLeaguePlayedThisWeek(world)) stops.add('college-league')
    // ⭐⭐⭐ ROUND 24 – HER BIRTHDAY, THE ONE MID-YEAR STOP. Unlike the two reports above it BREAKS,
    // because it is a QUESTION: `chooseGift` records the gift against `world.week`, so the answer
    // has to land ON the birthday week and a blocking dialog cannot be answered inside this loop –
    // the exact sentence `pendingBirthday`'s old college exclusion was built on, now honoured by
    // pausing instead of by silence. Collected before the break so a birthday that lands on the
    // championship week reports both (R11-1's rule: one week can be several things at once).
    if (pendingBirthday(world) !== null) {
      stops.add('birthday')
      break
    }
  }
  // ⭐⭐⭐ THE PAUSE – the year stops mid-flight for her birthday and is NOT banked. The latch goes
  // back on with the SAME year's end under it, the opening measurements are persisted for the press
  // that finishes it, and the dialog renders over the college Home shell (blockingOverlay lets the
  // birthday through exactly this one latch). Assigned directly rather than through `latchEnding`,
  // deliberately: the latch writes a kept «College years – N of 4…» milestone per call, which is the
  // YEAR's row – a paused year is the same year continued, and a second row about it every birthday
  // would be the feed announcing an event that did not happen.
  if (world.ending === null && world.week < yearEnds && pendingBirthday(world) !== null) {
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
