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
}

export const DEFAULT_PROFILE: PlayerProfile = {
  kidName: 'Vera',
  kidLastName: 'Martin',
  gender: 'girl',
  country: 'US',
  background: 'middle',
  coachSetup: 'hired',
  playStyle: 'all-court',
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
  match?: WorldMatch
  /** milestones are never pruned */
  keep?: boolean
  /** stable key for idempotent milestone firing (e.g. 'first-title', 'rank-10') */
  milestoneKey?: string
  /** present on `tournament` summary events: the kid's finish index for that run
   *  (0 = champion), so the year-end wrap-up (Round 5 item 16/21) can read the
   *  season's best result straight off the event log – no extra persisted state. */
  finishIdx?: number
}

export type StopReason = 'tournament' | 'deadline' | 'funds'

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
}

/** A standings row enriched for display (RankingRow only carries ids). */
export interface StandingRow extends RankingRow {
  name: string
  nation: string
  isKid: boolean
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
  /** most recent 60 events, chronological (oldest first) */
  events: WorldEvent[]
  /** scheduled events over the next 8 weeks, with entry state */
  upcoming: UpcomingEvent[]
  /** the kid's current dense rank among the cohort + kid */
  kidRank: number
  /** the kid's rank at the start of the last resolved week; null before any tick (schema v7) */
  prevKidRank: number | null
  /** top 10 + 5 around the kid, deduped, rank order */
  standings: StandingRow[]
  /** the kid's counted best-6 results (round-5 item 1b), strongest first */
  countingResults: CountingResult[]
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
  | { id: number; type: 'setPlan'; plan: WeekPlan }
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
