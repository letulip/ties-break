// A-03 / T6.6 – THE BARREL'S PUBLIC SURFACE IS FROZEN, AND THE FREEZE IS A LIST A MACHINE READS.
//
// ⚠⚠ WHY THIS FILE EXISTS. P4 asked for exactly this pin in its PR0 (`docs/review/proposals/
// P4-world-decomposition.md`, §How) and it was never written; the 26.09 lane measured what a barrel
// costs without one (A-03, `docs/review-principles-2026-09-26/01-architecture.md:273`): 511 of 627
// names were born after the split the barrel exists to shim, 93 of them had no reader through it at
// all, and 39 of the 108 commits that touched `world.ts` in a month changed nothing but import and
// export lines. The owner's ruling 15 is «freeze the barrel and drop its dead names». A name may
// still JOIN this list – that is P4's own stop-rule, one module plus one barrel line – but it joins
// in the same diff as its reader, and it can no longer drift in unread.
//
// ⚠ WHAT IT CLAIMS, EXACTLY, AND IN WHICH HALF OF THE SURFACE.
//   * `Object.keys(await import('…/world'))` returns the VALUE exports and nothing else – a
//     type-only re-export has no runtime key at all. Measured on this tree, not assumed: the module
//     object carries 592 keys and the file's AST lists 592 value exports and 38 type-only ones. So
//     case 1 freezes the 519 VALUE names that survive the drop, and it is the only half a runtime
//     read can see.
//   * Case 2 freezes the other half – the 18 type-only names – off the AST, because there is no
//     other instrument for it. A type has no key, so a `Object.keys` pin that claimed to freeze «the
//     barrel» while omitting 38 names would be a document disagreeing with its own code, which is
//     the class of defect wave 9 shipped through a full gate.
//   * What NEITHER case can prove is that a dropped name had no TYPE-LEVEL reader: an
//     `import type { X } from '…/world'` is erased before any of this runs. That half is
//     `npx vue-tsc -b --force` and `npm run check:tools`, which are the proof A-03 names, and they
//     are what was run on the pruned barrel.
//
// ⚠ AND WHAT IT DELIBERATELY DOES NOT CLAIM:
//   * NOT a line count, NOT a byte count, NOT a claim about function bodies – that is T6.5's
//     `tests/principles-a04-barrel-no-bodies.test.ts`, which is a different sentence about the same
//     file, and this pin does not restate it.
//   * NOT that the 537 remaining names are USED. Most are; the claim here is only that the SURFACE
//     is the surface, so a change to it is a decision somebody made on purpose. «Is this name read?»
//     is the census's question, and its answer decays the moment a reader is added or removed.
//   * NOT a claim about where a name LIVES. `node scripts/world-map.mjs <symbol>` owns that.
//
// ⚠ THE COUNTS LIVE IN THE LISTS, NEVER IN THE PROSE ABOVE. The two numbers this header quotes are
// derived from the arrays below by the cases themselves, so a name added to a list moves the number
// the message prints. CLAUDE.md's rule: a count a document states about itself needs a pin that
// compares it with the thing.
//
// MUTATION ARM (named, per the wave's own rule, and both outputs are quoted in T6.6's report):
// add `export { rankingDeltaSuffix as __mutationArm } from './world/tournamentClose'` to
// src/engine/world.ts and case 1 goes red naming `__mutationArm` as unexpected; remove it and it is
// green again. The RED-FIRST arm is the drop itself: on the un-pruned barrel this file failed with
// 592 keys against 519 frozen names.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

/** THE VALUE HALF – every name `import('…/world')` yields a runtime key for. Sorted, because the
 *  module object's key order is an implementation detail of the loader (measured: NOT sorted under
 *  vitest), and a pin that depended on it would break on a transform change and prove nothing. */
const FROZEN_VALUE_EXPORTS: readonly string[] = [
  'ACADEMY_NOTICE', 'ADVANCE_REFUSALS', 'ALBUM_MOOD', 'ASSET_NAME_MAX_CHARS', 'BIRTHDAY_BANDS',
  'BIRTHDAY_COLLEGE_BAND', 'BIRTHDAY_DAY_TOGETHER', 'BIRTHDAY_TIME_TOGETHER', 'CAREER_ENDED_REFUSAL',
  'COACH_EDGE_REVEAL_WEEKS', 'COACH_MANNERS', 'COLLEGE_FREEZE_REFUSAL', 'COLLEGE_REVEAL_REFUSAL',
  'COLLEGE_TRIP_WEEKS', 'DAY_TOGETHER_FROM_AGE', 'ENDS_READS', 'ENDS_REGISTERS', 'FORK_STOP_DRIVERS',
  'FORK_UNHEARD_REFUSAL', 'FORK_WANTS', 'FORK_WANT_ANSWER', 'FORK_WANT_TILT', 'GEAR_REST_WINDOW', 'KID_ID',
  'KNOCK_HISTORY_MAX', 'LAST_OFFER_NOT_A_QUESTION', 'LEGACY_SMALL_TALK_SUBJECTS', 'LIFE_BEAT_BLOCKING',
  'LIFE_BEAT_OPTIONS', 'LONG_LAYOFF_WEEKS', 'MAIN_DRAWS_PER_WEEK_MAX', 'MASSEUR_CHANGE_KEY',
  'MASSEUR_LOCKED_DETAIL', 'MASSEUR_NOTE_WINDOW_WEEKS', 'MEANS_BANDS', 'MULTI_WEEK_SPAN',
  'PARENT_INCOME_CENTS', 'PARTNER_NAME_POOL', 'PARTNER_WANTS', 'PLAY_DOWN', 'POSTPARTUM_PAUSE_DETAIL',
  'PREGNANCY_PAUSE_DETAIL', 'PROLOGUE_COACH_LADDER', 'PSYCHOLOGIST_CHANGE_KEY',
  'PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL', 'PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL',
  'PSYCHOLOGIST_FOCUS_SEASON_REFUSAL', 'PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL',
  'PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL', 'PSYCHOLOGIST_LOCKED_DETAIL', 'PSY_FOCUSES', 'PSY_FOCUS_LABEL',
  'PSY_FOCUS_LINE', 'QUIET_WINDOW_WEEKS', 'RELEASE_LINE_PREFIX', 'SAVE_SCHEMA_VERSION', 'SLAM_DEBUT_KEY',
  'SMALL_TALK_EXCLUDE_LAST', 'SMALL_TALK_FACTS', 'SMALL_TALK_FRAMES', 'SMALL_TALK_SITUATIONS',
  'SMALL_TALK_STANCES', 'SMALL_TALK_STANCE_ID', 'SMALL_TALK_SUBJECTS', 'SPARRING_CHANGE_KEY',
  'SPARRING_LOCKED_DETAIL', 'SPARRING_RECEIPT', 'SPOUSE_VIEW_OCCASIONS', 'STARTING_FUNDS_CENTS',
  'START_AGE_YEARS', 'TEMPERAMENTS', 'academyReputationOf', 'academyWeeklyIncomeCents',
  'acceleratorAdmits', 'acceleratorUsage', 'acceptOffer', 'acceptanceRank', 'accrueChemistry',
  'accrueCondition', 'accrueSpirit', 'activeEpisode', 'activeLadderOf', 'adShootHolds', 'advanceRefusal',
  'advanceWeeks', 'affinityCentre', 'affinityFor', 'ageAtWeek', 'ageInjuryFactor', 'ageWindowStartWeek',
  'airBoothMention', 'ancestorSeedOf', 'annualEntryLimit', 'annualProEntryLimit', 'answerFork',
  'answerLifeBeat', 'answerRetirement', 'answerShootClash', 'arrivalEligible', 'arrivalHazardFor',
  'arrivalStatus', 'assembleAlbum', 'assetDelivered', 'assetEarningsRateCents', 'assetEntryPriceCents',
  'assetHeldWeeks', 'assetKidShareCents', 'assetNameOf', 'assetNameSuggestions', 'assetUpkeepCents',
  'assetValueCents', 'assetWeeklyIncomeCents', 'assetWorthCents', 'atOrAboveStageBar', 'autoEndingViewOf',
  'availabilityStatus', 'avgUnitPriceCents', 'bankSponsorCheque', 'bereavementChanceAt',
  'bereavementEligible', 'birthdayHeading', 'birthdayOffer', 'birthdayOfferFor', 'birthdayOptions',
  'birthdayTurning', 'birthdayWeek', 'birthdayWords', 'bookClosedTo', 'bookPractice', 'bookVacation',
  'boothMentionDue', 'boothPrivateLifeAt', 'brandCrowdMult', 'brandGrossWorthCents', 'brandMultipleX',
  'brandReachOf', 'brandSignalsOf', 'brandStrengthAt', 'brandWeeklyGrossCents', 'buildAlbum',
  'buildBirthdayPrompt', 'buildEndingView', 'buildLifeBeatPrompt', 'buildScroll', 'buildSoftBeatInvite',
  'buildTourBriefing', 'buyAsset', 'calendarClearAhead', 'callUpFor', 'callUpLetterWeek',
  'callUpRevealMatches', 'callUpRevealOpen', 'callUpRubberId', 'callUpRubbersOf', 'campusDigestLine',
  'cancelEntry', 'cancelPractice', 'cancelVacation', 'captureBreakEven', 'captureEntryRow',
  'chargeMandatoryPenalty', 'chemistryCeilingPerYear', 'chemistryDriftPerYear', 'chemistryEventNudge',
  'chemistryFloorPerYear', 'chemistryReadableAt', 'chemistryWeeklyRate', 'childSeedFor', 'chooseGift',
  'closeTournament', 'coachBilling', 'coachEdgeView', 'coachFormNote', 'coachLadderNote',
  'coachLoadViewOf', 'coachMarket', 'coachMarketLabourCents', 'coachPlaqueLine', 'coachProgressScore',
  'coachRaiseDue', 'coachRateCents', 'coachRetainerBandOf', 'coachRoomNote', 'coachSinceWeek',
  'coachTravelFareFor', 'coachTravelsWithHer', 'coachWorksThisWeek', 'collegeEpilogueLine',
  'collegeLeagueMatchId', 'collegeLeagueMatchesOf', 'collegeLeagueRevealMatches',
  'collegeLeagueRevealOpen', 'collegeLeagueWeek', 'collegePausedShareYears', 'comebackAtReturn',
  'comebackMatchFactor', 'completedShootWeeks', 'completedShootsByBand', 'computeLossStreak',
  'conditionMatchFactor', 'consecutivePlayFactor', 'consecutivePracticeWeeks', 'createWorld',
  'decideKnock', 'decisionWeekOf', 'declineOffer', 'deliverAssets', 'deliverKnownPartner', 'deliverOwnKey',
  'deliveredAssets', 'drawConceptionWindow', 'drawEndsRead', 'drawForkWant', 'drawListenHeard',
  'drawPartnerWants', 'drawRawLag', 'dynastyBackgroundOf', 'dynastyHandoverOf', 'eliteGateStandingOf',
  'emptySeasonEntries', 'emptySeasonRecord', 'emptyTrophyLedger', 'endCollegeEarly', 'endEpisode',
  'endedKeptRow', 'endsEligible', 'endsHazardFor', 'enterEvent', 'entryCapUsage', 'entryCouldNotMove',
  'entryStatus', 'eventIsHers', 'expireKnock', 'exposureEventsOf', 'fameAt', 'fameEventWeeks',
  'fameFloorOf', 'fameShootMultOf', 'familyMeans', 'financeSeries', 'financeWindow', 'finishLabel',
  'flipScore', 'forkStopDriverOf', 'forkWantOf', 'forkWantWeights', 'formMatchlessWeeks', 'freshCoachPair',
  'giftNoun', 'goodWeeksFor', 'guardNotEnded', 'guardNotEndedForGood', 'hasOutgrown', 'hireCoach',
  'hireMasseur', 'hirePsychologist', 'hireSparring', 'homeWildCardPlace', 'householdWalletCents',
  'inCollege', 'inTrack', 'injuryTau', 'isBlackoutWeek', 'isCappedProTier', 'isCappedTier',
  'isCompetitionWeek', 'isExamWeek', 'isPracticeMatchEvent', 'isSuspendedAt', 'isTierAgeOpen',
  'isTierEligible', 'juniorAccessOpen', 'juniorReservedRank', 'kidAgeAt', 'kidAgeExact', 'kidAgeYears',
  'kidBirthYear', 'kidMatchPlayer', 'kidMatchPlayerFor', 'kidPoints', 'kitLineViews', 'kitPurchaseSplit',
  'kitStateOf', 'knockRunning', 'knownPartner', 'landBirth', 'landPregnancyAnnouncement',
  'landPregnancyPause', 'landWedding', 'lastLeagueRun', 'lastRungSeasonIndexOf', 'latchEnding',
  'latchedEpisode', 'layoffBlock', 'layoffCovering', 'layoffCoversWeek', 'leakEligible', 'leakHazardFor',
  'leakWrongShareFor', 'leavingViewOf', 'lifeBeatFollowUps', 'lifeBeatHeading', 'lifeBeatListenFollowUp',
  'lifeBeatOptionsFor', 'lifeBeatSaid', 'lifeLogOf', 'liveSoftBeat', 'localSponsorCents', 'longLayoff',
  'loveEpisodesOf', 'mandatoryBinds', 'mannerFromAxes', 'mannerPush', 'mannerVoice', 'marketCrash',
  'marketCrashFellIn', 'marketCrashLog', 'marketIndex', 'marketSeasonMove', 'marketWave',
  'masseurRaiseDue', 'masseurRoomNote', 'masseurRungOf', 'masseurSessionCents', 'masseurTourRelief',
  'masseurTourWeekCents', 'masseurTravelFareFor', 'masseurUnlocked', 'masseurWeeklyCents',
  'masseurWeeksServed', 'masseurWeeksServedAt', 'masseurWorksInWeek', 'masseurWorksThisWeek',
  'masseurYearsServed', 'matchDrain', 'matchesEverPlayed', 'maxMainDraws', 'maybeFireSeasonWrapUp',
  'meansOfCents', 'measureCollegeOffer', 'medicalBlock', 'medicalClearance',
  'merchFamilyWeeklyIncomeCents', 'merchWeeklyIncomeCents', 'metKeptRow', 'motherhoodBandAt',
  'nameSuggestionsFor', 'newsStandingOf', 'nextCallUpWeekAfter', 'nextChemistryPhase', 'nextWeekIsClear',
  'openQuestions', 'openingCoachId', 'ordinaryTrainingWeek', 'outgrewTier', 'ownKeyDue', 'ownKeyThisWeek',
  'ownedAssets', 'partnerNameFor', 'pauseCovering', 'pendingBirthday', 'pendingKnock', 'pendingLifeBeat',
  'pendingLifeBeatOptions', 'plateauViewOf', 'playDownBars', 'playedWeeksInTrailing4', 'practiceCaution',
  'practiceCoachRateFor', 'practiceMatchId', 'pregnancyChanceAt', 'pregnancyEligible',
  'pregnancyLossChanceAt', 'pregnancyLossEligible', 'prizeCentsFor', 'proDoors', 'proEntryCapUsage',
  'proSubCapUsage', 'prologueCoachTier', 'prologuePlayStyle', 'protectedRankPlace',
  'psychologistFocusDetailOf', 'psychologistFocusOpen', 'psychologistFocusRefusal',
  'psychologistFocusSeasonFor', 'psychologistRungOf', 'psychologistUnlocked', 'psychologistWeeklyCents',
  'psychologistWorksInWeek', 'psychologistWorksThisWeek', 'quietWeek', 'radarViewOf', 'raiseLifeBeat',
  'rankingDeltaSuffix', 'reachableFundsCents', 'reachableSituations', 'recomputeKidRank',
  'recordGearRestWeek', 'recoveryAgeFade', 'recoveryBaseFor', 'refreshDerivedRankCaches', 'releaseEntry',
  'replayMainState', 'resolveCoachRaise', 'resolveCollegeBill', 'resolveCollegeDeparture',
  'resolveEndings', 'resolveLeaving', 'resolveMasseur', 'resolveMasseurRaise', 'resolveMasseurReturn',
  'resolvePhysio', 'resolvePsychologist', 'resolveReturnDecision', 'resolveSparring', 'restRecoveryBonus',
  'resumeFromCollege', 'retirementInjury', 'returnChanceFor', 'revalueAssets', 'revealTournamentRound',
  'reviewAcademy', 'reviewAdOffer', 'reviewSponsors', 'rollArrival', 'rollBereavement', 'rollEnds',
  'rollInjury', 'rollKnock', 'rollLeak', 'rollPregnancy', 'rollPregnancyLoss', 'rollSmallTalk',
  'rollSpouseView', 'rollWedding', 'runFatigueExtra', 'sanitiseAssetName', 'schoolEndWeek', 'schoolIsOver',
  'schoolIsOverForBand', 'seasonIndexOf', 'seasonStartWeek', 'seedWorldForV6', 'sellAsset',
  'sellableAsset', 'setCoachOnEventWeeks', 'setCoachOnJuniorEvents', 'setKitGrade', 'setMasseurSessions',
  'setMasseurTravels', 'setPsychologistFocus', 'setPsychologistRung', 'setSparringRung',
  'setSparringTravels', 'setWeightEnabled', 'settleCoachDeal', 'settleStaffLetters', 'shaveLag',
  'shootCancelCents', 'shootClashOpen', 'shootClashWeek', 'shootFloorDecayAt', 'shootMoveTarget',
  'shopCatalogue', 'shopItem', 'shopView', 'skillMeanOf', 'skipEvent', 'skipTournament', 'slamDebutWeekOf',
  'smallTalkChanceFor', 'smallTalkEligible', 'smallTalkSubjectFor', 'smallTalkThisSeason', 'spanDigest',
  'spanRowCount', 'spanWeeksFor', 'spanWorthOffering', 'sparringRungOf', 'sparringRustCut',
  'sparringStoodDown', 'sparringUnlocked', 'sparringWeeklyCents', 'sparringWorksThisWeek',
  'sponsorCameoCents', 'sponsorCameoWilling', 'spouseViewEligible', 'spouseViewOccasionThisWeek',
  'spouseViewOccasionsAt', 'startingSkills', 'strengthDecayAt', 'summerBlockWeek', 'summerConditionCost',
  'summerLoadFactor', 'supportPayrollWeeklyCents', 'tableSize', 'temperamentFor', 'temperamentIntensity',
  'tickWeek', 'tierAgeBlock', 'tierFloorOpen', 'tierOpenFor', 'tierOutgrown', 'toSnapshot',
  'tournamentRunStrain', 'travelCostFor', 'unitPriceCents', 'unitPriceHistory', 'vacationForWeek',
  'wasThereAChild', 'weddingEligible', 'weeklyAssetUpkeepCents', 'withdrawEvent',
  'withheldFreeWeekRecovery', 'withoutRecentSituations', 'wonTopTitleInSeason', 'worstCrashFreeRatio',
  'worstMarketRatio', 'yearEndJuniorRank',
]

/** THE TYPE-ONLY HALF – re-exported with `export type` or an inline `type` specifier, so erased
 *  before runtime and invisible to case 1. Read off the AST instead. */
const FROZEN_TYPE_EXPORTS: readonly string[] = [
  'BrandSignals', 'ChemistryWeek', 'CoachManner', 'ExposureEvent', 'ExposureKind', 'FamilyMeans',
  'ForkStopDriver', 'ForkWant', 'HeardRead', 'NewsStanding', 'PendingTournament', 'PracticeCaution',
  'PsyFocus', 'SmallTalkSituation', 'SmallTalkVoiceEntry', 'SpanWeek', 'Temperament', 'WorldState',
]

const WORLD = '../src/engine/world.ts'
const source = readFileSync(new URL(WORLD, import.meta.url), 'utf8')

/** The barrel's type-only export names, off the AST – `export type { … }` on the statement and the
 *  inline `export { …, type X }` form both count. ⚠ Parsed, never grepped: this file's neighbours in
 *  `world.ts` quote export lines in their prose, and a regex reads a chronicle as a surface. */
function typeOnlyExportsOf(text: string): string[] {
  const sf = ts.createSourceFile('world.ts', text, ts.ScriptTarget.Latest, true)
  const names = new Set<string>()
  for (const st of sf.statements) {
    if (!ts.isExportDeclaration(st)) continue
    const ec = st.exportClause
    if (!ec || !ts.isNamedExports(ec)) continue
    // ⚠ THE PUBLIC NAME IS `el.name`: `export { foo as bar }` puts `bar` on the barrel. (The barrel
    // aliases nothing today, and this pin is what would notice the first alias.)
    for (const el of ec.elements) if (st.isTypeOnly || el.isTypeOnly) names.add(el.name.text)
  }
  return [...names].sort()
}

describe('A-03 · the world barrel is a frozen list of names (P4 PR0, owner ruling 15)', () => {
  it('⚠⚠ the RUNTIME surface of engine/world is exactly the frozen value list', async () => {
    const mod = await import('../src/engine/world')
    const keys = Object.keys(mod).sort()
    const frozen = [...FROZEN_VALUE_EXPORTS].sort()
    expect(
      keys,
      `engine/world exports ${keys.length} value names; the frozen list holds ${frozen.length}. ` +
        'A name joins this barrel in the same diff as the file that reads it through it – see the ' +
        'header. A name that LEAVES needs its re-export line gone too.',
    ).toEqual(frozen)
  })

  it('⚠ and the type-only half is frozen too – it has no runtime key, so it is read off the AST', () => {
    const types = typeOnlyExportsOf(source)
    const frozen = [...FROZEN_TYPE_EXPORTS].sort()
    expect(
      types,
      `world.ts re-exports ${types.length} type-only names; the frozen list holds ${frozen.length}. ` +
        'These are the 38-minus-20 that `Object.keys` above cannot see: an `export type` is erased ' +
        'before the module object exists.',
    ).toEqual(frozen)
  })

  it('⭐ the two halves are disjoint and together are the whole surface', () => {
    // The sentence that keeps the two cases above from drifting into overlap or into a gap: a name is
    // on exactly one of the lists, and every named export of the file is on one of them. Without this
    // case, moving a name from the value list to the type list would pass both cases while silently
    // changing what callers get.
    const both = FROZEN_VALUE_EXPORTS.filter((n) => FROZEN_TYPE_EXPORTS.includes(n))
    expect(both, 'a name is either a value or a type on this barrel, never both').toEqual([])
    const sf = ts.createSourceFile('world.ts', source, ts.ScriptTarget.Latest, true)
    const all = new Set<string>()
    for (const st of sf.statements) {
      if (!ts.isExportDeclaration(st)) continue
      const ec = st.exportClause
      if (!ec || !ts.isNamedExports(ec)) continue
      for (const el of ec.elements) all.add(el.name.text)
    }
    expect(
      [...all].sort(),
      `the file names ${all.size} exports; the two frozen lists hold ` +
        `${FROZEN_VALUE_EXPORTS.length + FROZEN_TYPE_EXPORTS.length} between them`,
    ).toEqual([...FROZEN_VALUE_EXPORTS, ...FROZEN_TYPE_EXPORTS].sort())
  })
})
