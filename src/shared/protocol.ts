// Typed message protocol between UI and the sim worker.
// The worker owns the authoritative state; the UI only ever sees snapshots.

// Type-only imports (erased at compile – no runtime dependency on the engine).
import type { MatchRecord, RankingRow, TierId } from '../engine/season/types'
import type { MatchPlayer, Surface } from '../engine/match/types'

export type FamilyBackground = 'wealthy' | 'middle' | 'working'
export type CoachSetup = 'parent' | 'hired'
/** An inclination, not numbers: weights future skill growth (Phase 4), gives build identity now. */
export type PlayStyle = 'aggressive' | 'counterpuncher' | 'serve-first' | 'all-court'

export interface PlayerProfile {
  kidName: string
  /** family name (schema v7); shown in standings/news as "F. Last", full on the Kid screen */
  kidLastName: string
  /** boys' tour is post-v1 content */
  gender: 'girl'
  /** ISO 3166-1 alpha-2, e.g. 'RU'; flag emoji is derived from it in the UI */
  country: string
  background: FamilyBackground
  coachSetup: CoachSetup
  playStyle: PlayStyle
  /** 1-12 (schema v9). Relative-age-effect groundwork (round-3 QA item 16): picked at
   *  onboarding, purely cosmetic until Phase 4 wires the junior age-group dynamics it's
   *  meant to feed. */
  birthMonth: number
}

export const DEFAULT_PROFILE: PlayerProfile = {
  kidName: 'Vera',
  kidLastName: 'Martin',
  gender: 'girl',
  country: 'US',
  background: 'middle',
  coachSetup: 'hired',
  playStyle: 'all-court',
  birthMonth: 6,
}

/** Weekly time split in percent; train + rest === 100. */
export interface WeekPlan {
  train: number
  rest: number
}

export const WEEK_PLAN_PRESETS: Record<'grind' | 'balanced' | 'light', WeekPlan> = {
  grind: { train: 85, rest: 15 },
  balanced: { train: 75, rest: 25 },
  light: { train: 60, rest: 40 },
}

// --- World events (Package M) ------------------------------------------------
// Structured events replace the old flat `log` strings. Financial events carry a
// SIGNED `amountCents` (expense/entry-fee/travel negative, income/refund positive)
// so the Money ledger is a running sum. `keep: true` milestones survive pruning.

export type WorldEventType =
  | 'info'
  | 'expense'
  | 'income'
  | 'entry'
  | 'match'
  | 'tournament'
  | 'milestone'
  | 'injury'
  | 'recovery'

/** Spending/earning bucket a financial event belongs to (Money-breakdown pie, round-7).
 *  Optional on the event: pre-round-7 events carry none and render as 'other'.
 *  'physio' (Season-Life slice C) buckets every medical line: weekly rehab, the one-time
 *  onset treatment, and the healthy-week physio retainer.
 *  'interest' (round-9 R9-1) is an INCOME-side category: the weekly savings interest on a
 *  positive balance ("Savings interest").
 *  'vacation' / 'practice' (season planner, schema v13) bucket the two planner spends: a family
 *  vacation package and a practice-match court rental (+ the optional coach). Refunds are booked
 *  under the SAME category, so a cancelled booking nets to zero on the Money breakdown. */
export type WorldEventCategory =
  | 'coaching'
  | 'travel'
  | 'entry'
  | 'gear'
  | 'stringing'
  | 'sponsor'
  | 'income'
  | 'interest'
  | 'physio'
  | 'vacation'
  | 'practice'
  | 'other'

/** A kid match, replayable on demand: seed (on MatchRecord) + both players' skill
 *  snapshots + surface feed simulateMatch/annotateMatch. No AnnotatedMatch is stored. */
export interface WorldMatch extends MatchRecord {
  eventId: string
  surface: Surface
  /** the non-kid side's display name */
  oppName: string
  /** skill snapshots at match time (AI skills drift week to week) */
  a: MatchPlayer
  b: MatchPlayer
}

export interface WorldEvent {
  id: number
  week: number
  type: WorldEventType
  text: string
  /** signed delta to funds, present on financial events */
  amountCents?: number
  /** spending/earning bucket for the Money breakdown (round-7); absent ⇒ 'other' */
  category?: WorldEventCategory
  match?: WorldMatch
  /** true on a PRACTICE-match record (season planner): a watchable friendly that awards ZERO
   *  ranking points, so the UI can keep it out of the tournament card and label it honestly. */
  friendly?: boolean
  /** milestones are never pruned */
  keep?: boolean
  /** stable key for idempotent milestone firing (e.g. 'first-title', 'rank-10') */
  milestoneKey?: string
  /** present on `tournament` summary events: the kid's finish index for that run
   *  (0 = champion), so the year-end wrap-up (Round 5 item 16/21) can read the
   *  season's best result straight off the event log – no extra persisted state. */
  finishIdx?: number
}

// --- finance aggregate (Part A) ----------------------------------------------
// The Money breakdown/ledger can't read `events`: those are capped (the snapshot's trailing 60,
// the engine's retained 400) so old finance is pruned away and a tournament-heavy stretch buries
// the rest under news. Instead the world maintains a tiny per-week/per-category signed-cents
// ledger that survives pruning, and the snapshot carries pre-folded windows off it.

/** Signed cents per (week, category): income positive, expense negative – matches the event
 *  convention. One entry per week that had >=1 financial event, week-ascending. Maintained on
 *  the world (survives event pruning), pruned only to a 60-week trailing career window. */
export interface FinanceWeek {
  week: number
  byCategory: Partial<Record<WorldEventCategory, number>>
}

/** A category-accurate rollup of `FinanceWeek[]` over a trailing window (pure fold; the bench and
 *  the Money screen both read one of these instead of scraping events). */
export interface FinanceWindow {
  startWeek: number
  /** signed cents per category (income positive, expense negative) */
  byCategory: Partial<Record<WorldEventCategory, number>>
  /** sum of the positive category totals */
  incomeCents: number
  /** magnitude of the negative category totals (a positive number) */
  expenseCents: number
  /** income - expense (== the signed sum of byCategory) */
  netCents: number
}

export type StopReason = 'tournament' | 'deadline' | 'funds' | 'season-end' | 'injury'

/** Structured end-of-season recap (schema v10). Written at wrap-up time (the tick into the
 *  season year's first off-season week) off the world state itself – W-L are counted as the
 *  season's kid matches resolve (never re-parsed from event text), so pruning can't lose them.
 *  Surfaced on the snapshot and shown by SeasonSummaryDialog when `advance` reports 'season-end'. */
export interface SeasonSummary {
  /** calendar year label of the season that just ended (weekYear of its first week) */
  seasonYear: number
  /** kid's dense rank at wrap-up */
  endRank: number
  /** kid's dense rank at the season's first week (null if it couldn't be reconstructed) */
  startRank: number | null
  /** season points (sum of the kid's results earned in-season) */
  points: number
  wins: number
  losses: number
  /** e.g. "best Semifinalist" or "no tournaments played" */
  bestResultText: string
  /** signed funds delta across the season (flavor figure, matches the wrap-up milestone) */
  fundsDeltaCents: number
  /** weeks lost to injury inside the season (Season-Life slice C). OPTIONAL – summaries
   *  banked before slice C never stored it; readers default to 0 (no schema bump). */
  weeksInjured?: number
}

// --- Tournament experience (feat/tournament-experience) -----------------------
// One revealed round on the kid's path through the bracket (the between-rounds strip).
export interface PendingBracketRound {
  roundLabel: string
  /** short opponent name */
  oppName: string
  kidWon: boolean
  /** kid's-perspective scoreline, e.g. "6-4 3-6 7-6" */
  score?: string
}

/** One match in the FULL draw view (Round 5 item 5) – every match of a revealed round,
 *  not just the kid's. AI-vs-AI matches never carry a `score` (they resolve from a single
 *  closed-form probability draw, no point-by-point sim), so it stays undefined for those. */
export interface FullBracketMatch {
  round: number
  roundLabel: string
  aId: string
  bId: string
  aName: string
  bName: string
  winnerId: string
  /** kid-vs-anyone matches only; AI-AI matches have no simulated scoreline */
  score?: string
}

/** The live view of an in-progress tournament reveal. Present on the snapshot only while
 *  `world.pendingTournament` is set; drives the full-screen TournamentFlow overlay. Lean:
 *  enough for the pre-match card, the post-match card, the bracket strip and the finale. */
export interface PendingView {
  eventId: string
  tier: TierId
  surface: Surface
  /** stage of the round currently being presented, e.g. "Round of 16", "Final" */
  roundLabel: string
  /** the kid's opponent this round: short name, ISO-2 nation, current standings rank */
  opponent: { name: string; nation: string; rank: number }
  /** the current round's record – MatchReplay source + post-match stats */
  kidMatch?: WorldMatch
  /** revealed rounds so far, the kid's path (oldest first) */
  bracket: PendingBracketRound[]
  /** every match (all players) from every round revealed so far, round order (Round 5 item 5) */
  fullBracket: FullBracketMatch[]
  /** true once the last kid match has been revealed and the run finalized */
  finished: boolean
  kidChampion: boolean
  /** finale card copy */
  tierLabel: string
  points: number
  finishLabel: string
}

/** Injury severity (Season-Life). Slice B wires the field but never populates it; Slice C does. */
export type InjurySeverity = 'minor' | 'moderate' | 'major' | 'severe'

/** The kid's active injury as surfaced to the UI (schema v12). null = healthy. Always null in
 *  slice B – Slice C (injuries + physio) brings it alive. The persisted world carries one extra
 *  field (`sinceWeek`) that the snapshot omits. */
export interface SnapshotInjury {
  kind: string
  severity: InjurySeverity
  weeksRemaining: number
  totalWeeks: number
}

// --- Season planner (schema v13) ---------------------------------------------
// Two player-planned week types on otherwise empty weeks. Both are PURE STATE (no engine RNG
// draw at booking time): prices come from purpose-scoped sub-streams, so a booking can never
// perturb the world's main draw sequence.

/** A booked family-vacation week: the package + what the family actually paid for it. */
export interface VacationBooking {
  week: number
  packageId: string
  paidCents: number
}

/** A booked practice-match week: the court rental (plus the optional coach) already charged. */
export interface PracticeBooking {
  week: number
  paidCents: number
  /** «+ тренер на игру» – the coach came along (50% of a session, the other half "paid by the
   *  opponent's family"). Cosmetic in v1; re-priced per coach tier when the coach slice lands. */
  withCoach: boolean
}

/** A carry-over recovery buff from a resort/elite vacation: injury tau × factor through
 *  `untilWeek` (inclusive). Applied POST-draw, so it moves the threshold, never the stream. */
export interface RecoveryBuff {
  untilWeek: number
  factor: number
}

/** A scheduled event surfaced to the UI, with the kid's entry state + tier lookups. */
export interface UpcomingEvent {
  id: string
  week: number
  tier: TierId
  surface: Surface
  travelCostCents: number
  deadlineWeek: number
  entryFeeCents: number
  label: string
  entered: boolean
  /** the kid's EARNED ranking points meet this tier's point band (both directions). Snapshot-only
   *  (derived from the results ledger at snapshot time), so it persists nothing and bumps no schema. */
  eligible: boolean
  /** why the kid HARD-cannot enter, for the UI lock label; absent when eligible. Point-band reasons:
   *  'locked' = not enough ranking points yet (below the tier's minPoints); 'outgrown' = past its
   *  ceiling now. Hard availability blocks (Season-Life slice B, checked after the point band):
   *  'unavailable' = school exams / off-season / a booked family vacation; 'injured' = she is out;
   *  'medical' = the doctor's veto below ECONOMY.availability.medicalFloor (the one hard body-gate
   *  – see availabilityStatus). Ordinary fatigue is NOT here – it is a soft, warned CHOICE (see
   *  cautionReason), so a fatigued event stays eligible. */
  ineligibleReason?: 'locked' | 'outgrown' | 'injured' | 'unavailable' | 'medical'
  /** a SOFT warning on an event the kid CAN still enter (eligible stays true): 'fatigued' = her
   *  condition is below the tier's floor, so racing risks a deeper hole / injury. The owner's call
   *  is that a tired body is a tough-parent decision, not a hard rule. */
  cautionReason?: 'fatigued'
  /** human-readable caution copy for the soft-warning UI (short dash). */
  cautionDetail?: string
  /** the tier's minPoints threshold, present only when 'locked', so the UI can show "Reach N pts". */
  pointsToEnter?: number
}

/** A standings row enriched for display (RankingRow only carries ids). */
export interface StandingRow extends RankingRow {
  name: string
  nation: string
  isKid: boolean
  /** true when one or more ranked players were omitted between this row and the
   *  previous displayed row (the standings table shows top 10 + a window around the
   *  kid, not the full field). Competition ranking means a rank number jumping by
   *  more than 1 is no longer proof of an omission on its own (a tie does that too),
   *  so the UI must use this flag rather than diffing `rank` values. */
  gapBefore: boolean
}

/** One of the kid's counted (best-6, windowed) results, for the Kid-screen transparency
 *  list (round-5 item 1b). `tier` is optional: pre-r5 kid results were stored without it. */
export interface CountingResult {
  week: number
  tier?: TierId
  points: number
}

export interface Snapshot {
  schemaVersion: number
  careerId: string
  seed: string
  week: number
  /** derived: detailed simulation starts at 14 */
  ageYears: number
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  /** the kid's per-week condition 0..100 (100 = fresh); fatigue is the derived 100 - condition
   *  (Season-Life slice B, schema v12). */
  condition: number
  /** the kid's active injury, or null when healthy. Always null in slice B (Slice C populates it). */
  injury: SnapshotInjury | null
  /** whether physio recovery is active (its cost lever is billed in Slice C; in B this just
   *  reflects/sets the flag, default = coachSetup === 'hired'). */
  physioActive: boolean
  /** most recent 60 events, chronological (oldest first) */
  events: WorldEvent[]
  /** category-accurate spending/income over the full retained finance history (survives the
   *  60-event cap). window12w = last 12 weeks; season = the current 52-week season block. */
  finance: { window12w: FinanceWindow; season: FinanceWindow }
  /** most recent financial transactions (amountCents present), id-ascending, up to 50 –
   *  independent of the mixed 60-event `events` cap so the ledger isn't starved by news. */
  financialEvents: WorldEvent[]
  /** scheduled events over the next 8 weeks, with entry state */
  upcoming: UpcomingEvent[]
  /** season planner (schema v13): booked vacation weeks from the current week onward. The
   *  calendar renders them by package name; a booked week is a hard blackout for entries. */
  vacations: VacationBooking[]
  /** season planner (schema v13): booked practice-match weeks from the current week onward. */
  practices: PracticeBooking[]
  /** an active resort/elite recovery buff, or null. Surfaced so the UI can show that the
   *  expensive package is still working. */
  recoveryBuff: RecoveryBuff | null
  /** the kid's current dense rank among the cohort + kid */
  kidRank: number
  /** the kid's rank at the start of the last resolved week; null before any tick (schema v7) */
  prevKidRank: number | null
  /** top 10 + 5 around the kid, deduped, rank order */
  standings: StandingRow[]
  /** the kid's counted best-6 results (round-5 item 1b), strongest first */
  countingResults: CountingResult[]
  /** best (smallest) finish index the kid has ever reached per tier (schema v10); drives the
   *  Home season strip's real tier progress. Untouched tiers are absent. */
  bestFinishByTier: Partial<Record<TierId, number>>
  /** the CURRENT season's kid W-L (round-8, the R6 debt): mirrors the v10 world counters that
   *  accumulate at finalizeTournament and reset at each season wrap-up. The Snapshot is derived,
   *  so surfacing them bumps no schema. Drives the Stats header's W–L figure. */
  seasonWins: number
  seasonLosses: number
  /** the most recent end-of-season recap (schema v10), or null before the first season ends */
  lastSeasonSummary: SeasonSummary | null
  /** set when an `advance` stopped early */
  stopReason?: StopReason
  /** present while a tournament reveal is in progress (drives TournamentFlow) */
  pending?: PendingView
}

export interface SlotMeta {
  slot: string
  careerId: string
  savedAt: number
  week: number
  seed: string
  bytes: number
}

/** One career the player can switch between; backs the Careers list in the UI. */
export interface CareerMeta {
  careerId: string
  kidName: string
  /** ISO 3166-1 alpha-2 */
  country: string
  seed: string
  createdAt: number
  lastPlayedAt: number
  week: number
}

export type ToWorker =
  | { id: number; type: 'new'; seed: string; profile: PlayerProfile }
  | { id: number; type: 'tick'; weeks: number }
  | { id: number; type: 'advance'; weeks: 1 | 4 }
  | { id: number; type: 'enterEvent'; eventId: string }
  | { id: number; type: 'withdrawEvent'; eventId: string }
  | { id: number; type: 'tournamentReveal' }
  | { id: number; type: 'tournamentSkip' }
  | { id: number; type: 'tournamentClose' }
  // R9-9: withdraw POST-deadline at the event week – fee forfeited, travel refunded, no run.
  | { id: number; type: 'skipEvent'; eventId: string }
  // Season planner: book/cancel a vacation or a practice match on an empty FUTURE week.
  // Cancelling before the week starts refunds in full (mirror of entry withdrawal).
  | { id: number; type: 'bookVacation'; week: number; packageId: string }
  | { id: number; type: 'cancelVacation'; week: number }
  | { id: number; type: 'bookPractice'; week: number; withCoach: boolean }
  | { id: number; type: 'cancelPractice'; week: number }
  | { id: number; type: 'setPlan'; plan: WeekPlan }
  | { id: number; type: 'setPhysio'; active: boolean }
  | { id: number; type: 'save'; slot?: string }
  | { id: number; type: 'saveNamed'; name: string }
  | { id: number; type: 'load'; slot: string }
  | { id: number; type: 'listSlots'; careerId?: string }
  | { id: number; type: 'deleteSlot'; slot: string }
  | { id: number; type: 'listCareers' }
  | { id: number; type: 'loadCareer'; careerId: string }
  | { id: number; type: 'deleteCareer'; careerId: string }
  | { id: number; type: 'exportSave' }
  | { id: number; type: 'importSave'; bytes: ArrayBuffer }

export type ToUI =
  | { id: number; ok: true; type: 'snapshot'; snapshot: Snapshot; recovered?: true }
  | { id: number; ok: true; type: 'slots'; slots: SlotMeta[] }
  | { id: number; ok: true; type: 'careers'; careers: CareerMeta[] }
  | { id: number; ok: true; type: 'exported'; bytes: ArrayBuffer; filename: string }
  | { id: number; ok: false; error: string }
