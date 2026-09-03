// Typed message protocol between UI and the sim worker.
// The worker owns the authoritative state; the UI only ever sees snapshots.
//
// ⚠⚠ THIS FILE IS A BARREL SINCE R2-09, AND THE PUBLIC PATH IS THE WHOLE POINT OF THE SPLIT.
// 305 files import from `shared/protocol` (24.08 – count it, do not quote it:
// `git grep -lE "from '[^']*shared/protocol'" -- src tests tools scripts e2e | wc -l`). That path
// still resolves and still exports every name it exported before, so not one call site moved. The
// DTOs now live in `src/shared/protocol/*.ts`, which is the same one-way seam `engine/world.ts` has
// used for `engine/world/*.ts` since P4 (CLAUDE.md): the PARTS NEVER IMPORT THE BARREL BACK, so
// every runtime edge points from here into them and `tests/import-cycles.test.ts` stays green.
//
// ⚠⚠ `export type` VS `export` IS LOAD-BEARING ON EVERY LINE BELOW. Vite transpiles file by file,
// so a TYPE re-exported through a value `export { X } from` becomes a real runtime lookup for a
// name the built module does not have – "does not provide an export named". That is the failure
// mode this file's own history records, and it is why the two lists are kept apart per module
// rather than merged into one convenient `export *`: the boundary has to be readable to be
// checkable. `REPLY_BY_COMMAND` is a RUNTIME value and is deliberately in a plain `export` block;
// everything type-shaped is under `export type`.
//
// WHERE THINGS LIVE (line counts 24.08; a reader after ONE concern opens ONE of these, not 4,171
// lines of everything):
//   protocol/profile.ts       142  who she is, the training dials, and the two planned week types
//   protocol/events.ts        423  world events, the finance rollups, and the stop reasons
//   protocol/health.ts        154  the injury, the injury REPORT, and the knock
//   protocol/competition.ts   685  entries, the draw, the season recap, the tier gates
//   protocol/ladder.ts        195  the three tables and the two helpers that resolve "her rank"
//   protocol/narrative.ts     508  the diary, the memory, her life off court, the radar, the birthday
//   protocol/offers.ts        797  the inbox (five letter kinds), the kit ladder, the coach market
//   protocol/career.ts        482  the fork, college, the six endings, the epilogue
//   protocol/snapshot.ts      532  the one object the UI is ever handed
//   protocol/messages.ts      309  ToWorker, ToUI, and REPLY_BY_COMMAND
//
// ⚠ WHAT IS NOT HERE ANY MORE. The birthday GIFT CATALOGUE's types – `BirthdayGift` and
// `BIRTHDAY_DAY_NOUN` – left the wire format entirely in R2-09 step 1 (TOK-04 §1). They never
// crossed the worker/UI boundary: the engine owns every word of the catalogue and the dialog is
// handed `BirthdayOption` rows, which are still here. They now live in `src/engine/world/
// birthdayGift.ts` – a LEAF beside the catalogue rather than inside it, because `diary/weekNotes.ts`
// reads the noun too and `world/birthday.ts` already reaches that module at runtime. Import from
// the leaf.

// --- profile -------------------------------------------------------------------------------------
export type {
  FamilyBackground,
  CoachTier,
  CoachEdgePlacement,
  PlayStyle,
  PlayerProfile,
  SessionKind,
  PrologueYear,
  PrologueHandover,
  WeekPlan,
  VacationBooking,
  PracticeBooking,
  RecoveryBuff,
  OwnedAsset,
} from './protocol/profile'
export {
  DEFAULT_PROFILE,
  SESSION_KINDS,
  WEEK_PLAN_PRESETS,
} from './protocol/profile'

// --- events --------------------------------------------------------------------------------------
export type {
  WorldEventType,
  WorldEventCategory,
  WorldMatch,
  WorldEvent,
  WorldEventEntryRef,
  FinanceWeek,
  FinanceWeekKidShare,
  FinanceWindow,
  FinanceWeekPoint,
  StopReason,
  CareerTotals,
  DebtView,
} from './protocol/events'
export {
  STOP_PRECEDENCE,
} from './protocol/events'

// --- health --------------------------------------------------------------------------------------
export type {
  InjurySeverity,
  SnapshotInjury,
  InjuryCircumstanceKind,
  InjuryEntryRow,
  InjuryReport,
  KnockChoice,
  Knock,
  KnockRecord,
  KnockPrompt,
} from './protocol/health'

// --- competition ---------------------------------------------------------------------------------
export type {
  SeasonSummary,
  SeasonEntryMirror,
  SeasonEntryLedger,
  SeasonEntryRow,
  SeasonTrackRow,
  SeasonHistoryEntry,
  PendingBracketRound,
  FullBracketMatch,
  PendingView,
  SeasonSupplyRow,
  SeasonSupply,
  UpcomingEvent,
  TierOpenMap,
  TierRefusal,
  EntryCapUsage,
  TierTrophies,
  LossStreak,
  ArrivalPreview,
} from './protocol/competition'

// --- ladder --------------------------------------------------------------------------------------
export type {
  StandingRow,
  CountingResult,
  LadderView,
  LadderViews,
} from './protocol/ladder'
export {
  LADDER_LABEL,
  LADDER_TRACKS,
  activeLadderOfSnapshot,
  rankChipTrack,
  LADDER_POINTS_LABEL,
} from './protocol/ladder'

// --- narrative -----------------------------------------------------------------------------------
export type {
  MilestoneType,
  Milestone,
  BirthdayOption,
  BirthdayPrompt,
  BirthdayRecord,
  ConditionBand,
  FundsPressure,
  DiaryLifeStage,
  DiaryFacts,
  TravelHomeMood,
  TravelHomeScene,
  WeekScene,
  MemoryCard,
  DiarySnapshot,
  KidLifeTile,
  KidLife,
  RadarAxis,
  TrainingRead,
} from './protocol/narrative'

// --- offers --------------------------------------------------------------------------------------
export type {
  OfferKind,
  PenaltyReason,
  PenaltyRow,
  TourLetterTerms,
  TourBriefingRow,
  TourBriefing,
  OfferState,
  SponsorTier,
  AdTier,
  AdCategory,
  KitLine,
  KitGrade,
  KitGrades,
  KitState,
  KitLineView,
  KitDealView,
  ShopPricePoint,
  ShopRowView,
  ShopView,
  KitOfferTerms,
  EntryLetterTerms,
  EntryReleaseReason,
  KitEndReason,
  AcademyNotice,
  AcademyEndReason,
  AcademyLetterTerms,
  AdOfferTerms,
  AdPortfolioRow,
  ShootClashChoice,
  ShootClashPrompt,
  CallUpLetterTerms,
  OfferTerms,
  Offer,
  CoachMarketRow,
  SnapshotAcademy,
} from './protocol/offers'
// ⭐ ROUND 34 #19 – a VALUE export, not a type: the four windows on the fund's chart are read by the
// engine (for how long a series to send) and by the screen (to draw the picker).
export { SHOP_PRICE_RANGE_MONTHS } from './protocol/offers'

// --- career --------------------------------------------------------------------------------------
export type {
  CareerEndingType,
  CareerEnding,
  ForkAnswer,
  ForkState,
  CollegeTier,
  CollegeQuote,
  CollegeOffer,
  RetirementOffer,
  CollegeState,
  CollegeYearStart,
  CollegeYear,
  CollegeLeagueRun,
  CollegeLeagueReveal,
  CollegeCallUpReveal,
  CollegeCallUp,
  AlbumPage,
  ScrollSeason,
  HandoffView,
  AcademyEpilogue,
  EndingView,
  CollegeProgressView,
} from './protocol/career'

// --- snapshot ------------------------------------------------------------------------------------
export type {
  HandoverBaseBand,
  HouseholdWeekly,
  Snapshot,
} from './protocol/snapshot'

// --- messages ------------------------------------------------------------------------------------
export type {
  SlotMeta,
  CareerMeta,
  SavePeek,
  WorkerErrorCode,
  ToWorker,
  ToUI,
  OkReply,
  ErrorReply,
  SnapshotReply,
  SlotsReply,
  CareersReply,
  ExportedReply,
  PeekReply,
  OkReplyFor,
  ReplyFor,
} from './protocol/messages'
export {
  REPLY_BY_COMMAND,
} from './protocol/messages'
