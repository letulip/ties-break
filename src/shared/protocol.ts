// Typed message protocol between UI and the sim worker.
// The worker owns the authoritative state; the UI only ever sees snapshots.

// Type-only imports (erased at compile – no runtime dependency on the engine).
import type { MatchRecord, RankingRow, TierId } from '../engine/season/types'
import type { MatchPlayer, Surface } from '../engine/match/types'
import type { AvatarEmotion, PortraitStage } from './avatarEmotion'

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

/** ONE week of the Home budget card's 12-week chart (epic/redesign-home): what came IN and what
 *  went OUT, both as positive magnitudes. The existing `FinanceWindow` is a FOLD – it answers "how
 *  much this season", which is the wallet's question – and a chart needs the shape over time, which
 *  no fold can give back. Derived at snapshot time from the same `FinanceWeek[]` ledger the windows
 *  fold, so the card and the wallet can never disagree about a week; persists nothing. */
export interface FinanceWeekPoint {
  week: number
  /** sum of the week's POSITIVE category totals, in cents */
  incomeCents: number
  /** magnitude of the week's negative category totals, in cents (a positive number) */
  expenseCents: number
}

export type StopReason =
  | 'tournament'
  | 'deadline'
  | 'funds'
  | 'season-end'
  | 'injury'
  | 'medical'
  /** R12-15: an entered tournament came round while she was still inside her layoff, so the week
   *  resolved as a WALKOVER – 0 points, and the entry fee forfeited (the list had closed with her on
   *  it, so there was nothing to refund). It costs her real money and a real entry, exactly like
   *  'medical', and it used to pass in complete silence. */
  | 'walkover'

/** R11-1: the order the UI must SURFACE a week's stop reasons in, and the order `advanceWeeks`
 *  returns them in. One advance can stop for SEVERAL true reasons at once (the owner's lost injury
 *  popup: a fresh injury landing on the season wrap-up week was reported as 'season-end' alone, so
 *  neither the injury dialog nor a toast ever appeared and the auto-withdrawals happened in
 *  silence). Medical events rank FIRST precisely because they may never be swallowed by a stop that
 *  can wait a click: they cost her entries and money the moment they land. */
export const STOP_PRECEDENCE: readonly StopReason[] = [
  'injury',
  'medical',
  // Third, with its two medical siblings and above everything that can wait a click: a walkover
  // costs her the entry fee. When it lands on the SAME week as the onset (an entry on the very week
  // she gets hurt) both fire – the injury dialog leads, the walkover toast rides above it – because
  // they are two different facts and R11-1's whole point is that a week may be several things.
  'walkover',
  'tournament',
  'season-end',
  'deadline',
  'funds',
]

/** Structured end-of-season recap (schema v10). Written at wrap-up time (the tick into the
 *  season year's first off-season week) off the world state itself – W-L are counted as the
 *  season's kid matches resolve (never re-parsed from event text), so pruning can't lose them.
 *  Surfaced on the snapshot and shown by SeasonSummaryDialog when `advance` reports 'season-end'. */
export interface SeasonSummary {
  /** DISPLAY year of the season that just ended – `seasonYear(seasonIndex)` in shared/dates.ts,
   *  i.e. derived from the season's INDEX, never from the calendar year of its first Monday.
   *  It used to be `weekYear(yearStart)`, which repeats 2035 for seasons 4 and 5 (a season is 364
   *  days, so its opening Monday walks back over New Year); the popup would then have announced
   *  "Season 2035" two years running. Label only – the season's identity is its index. */
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
  /** signed funds delta across the season (== earnedCents - spentCents, and == the change in
   *  `fundsCents` across the season window). R11-12a: this used to be a scrape of the CAPPED
   *  `events` feed over a window that also excluded the wrap-up week, so it disagreed with the
   *  Money screen by hundreds of dollars a season; it is now the same `financeWindow` fold the
   *  wallet reads, over the same window. */
  fundsDeltaCents: number
  /** GROSS spend across the season window (a positive number) – the figure the Money screen's
   *  "This season" donut shows in its centre. OPTIONAL: summaries banked before R11-12a never
   *  stored it, so readers must treat `undefined` as "not recorded" and show nothing. */
  spentCents?: number
  /** GROSS income across the same window (a positive number). Same optionality as `spentCents`. */
  earnedCents?: number
  /** weeks lost to injury inside the season (Season-Life slice C). OPTIONAL – summaries
   *  banked before slice C never stored it; readers default to 0 (no schema bump). */
  weeksInjured?: number
}

/** One FINISHED season, appended to the career's history at wrap-up (schema v14, R10-9).
 *  `lastSeasonSummary` above is overwritten every year, so there was no way to compare against
 *  last season; this is the append-only list behind the Stats screen's season-by-season table.
 *  Deliberately TINY – seven numbers per SEASON (never per week), so a decade of career costs
 *  bytes, not kilobytes: no strings, and the full recap keeps living in SeasonSummary. */
export interface SeasonHistoryEntry {
  /** THE SEASON'S IDENTITY: its 0-based index (`floor(week / WEEKS_PER_YEAR)`), schema v16.
   *
   *  This used to be `year`, the calendar year of the season's first Monday, and that is a value
   *  that REPEATS: a season is 52 weeks = 364 days, so its opening Monday walks ~1.25 days earlier
   *  every year and steps back over New Year at season 5 – `weekYear(208)` and `weekYear(260)` are
   *  both 2035. The wrap-up's "already banked?" guard tested that year, so season 5 looked like a
   *  season already in the list and its whole row was dropped: the player lost a season out of the
   *  Stats table at age 19, from the very feature that table exists for.
   *
   *  An index cannot drift, cannot repeat and needs no calendar to compute. The year the table
   *  PRINTS is derived from it (`seasonYear(seasonIndex)`, shared/dates.ts) – the same function
   *  `weekLabel` uses, so a row's header and the week labels inside that season always agree. */
  seasonIndex: number
  /** her dense rank at the season's wrap-up */
  endRank: number
  /** ranking points earned in-season */
  points: number
  wins: number
  losses: number
  /** signed funds delta across the season */
  fundsDeltaCents: number
  /** the balance she ended the season with (the "how much is left" figure) */
  endFundsCents: number
  /** best tournament finish index that season (0 = champion). Absent when she played none, and
   *  on rows the v14 migration backfilled (the old summary stored only prose for it). */
  bestFinish?: number
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
  /** whether she may ENTER this event right now – the verdict of the engine's one entry gate
   *  (`entryStatus` = point band + availability). Snapshot-only (derived from the results ledger at
   *  snapshot time), so it persists nothing and bumps no schema.
   *
   *  Round-10 R10-5/R10-3, and this is the part that bit: `eligible` is about ENTERING, never about
   *  an entry already made. An entry survives a band crossing once its list has closed (the fee is
   *  committed and the event plays), so an `entered` card can legitimately read `eligible: false` –
   *  and the UI must show it anyway, with `cancellable` as its way out. Hiding or locking an entered
   *  card on this flag is what produced the dead end. */
  eligible: boolean
  /** R10-13: the entry is COMMITTED (its list has closed) but its week has not started – the window
   *  in which the player may CANCEL, forfeiting the fee, and get the week back for a practice match
   *  or a family vacation. Before the deadline the same control is an ordinary refunded withdrawal;
   *  once the week starts, the tournament flow's Skip owns it. */
  cancellable: boolean
  /** why the kid HARD-cannot enter, for the UI lock label; absent when eligible. Point-band reasons:
   *  'locked' = not enough ranking points yet (below the tier's minPoints); 'outgrown' = past its
   *  ceiling now. Hard availability blocks (Season-Life slice B, checked after the point band):
   *  'unavailable' = school exams / off-season / a booked family vacation; 'injured' = she is out;
   *  'medical' = the doctor's veto below ECONOMY.availability.medicalFloor (the one hard body-gate
   *  – see availabilityStatus). Ordinary fatigue is NOT here – it is a soft, warned CHOICE (see
   *  cautionReason), so a fatigued event stays eligible.
   *  'capped' = she has spent her year's allowance of INTERNATIONAL entries (the ITF annual entry
   *  cap, docs/research/ranking-points-by-tier.md §2) – a hard block, but one that lifts by itself
   *  when the season turns, which is why it is its own reason and not folded into 'unavailable'. */
  ineligibleReason?: 'locked' | 'outgrown' | 'injured' | 'unavailable' | 'medical' | 'capped'
  /** a SOFT warning on an event the kid CAN still enter (eligible stays true): 'fatigued' = her
   *  condition is below the tier's floor, so racing risks a deeper hole / injury. The owner's call
   *  is that a tired body is a tough-parent decision, not a hard rule. */
  cautionReason?: 'fatigued'
  /** human-readable caution copy for the soft-warning UI (short dash). */
  cautionDetail?: string
  /** the tier's minPoints threshold, present only when 'locked', so the UI can show "Reach N pts". */
  pointsToEnter?: number
  /** present only when 'capped': the allowance the gate judged THIS event against, so the card can
   *  print "N of M" without re-deriving it. Per-event for the same reason `pointsToEnter` is – an
   *  event in the next season is measured against a different year's allowance than today's. */
  entryCap?: EntryCapUsage
}

/** The ITF annual entry cap as it stands for ONE season (docs/research/ranking-points-by-tier.md
 *  §2, Appendix F of the 2026 ITF junior regulations): how many INTERNATIONAL events (j30/j60/j300)
 *  a player of that age may enter in a year, and how many of them she has already spent. The
 *  domestic tiers are our own invention and are not counted – see ECONOMY.entryCap.
 *  `limit === Number.MAX_SAFE_INTEGER` means unrestricted (17 and over). */
export interface EntryCapUsage {
  used: number
  limit: number
  /** `limit - used`, floored at 0. `remaining <= 0` is the whole gate. */
  remaining: number
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

/** The kid's current run of consecutive COMPETITIVE losses, and the threshold at which this
 *  particular run turns her face angry (fix/world-trio item 3, owner's call).
 *
 *  Computed by the ENGINE (it owns the seed, the full event log and the RNG discipline) and carried
 *  on the snapshot so the pure `avatarEmotion` decision only has to compare two numbers. Null when
 *  her most recent competitive match was a WIN, or when she has never played one.
 *
 *  WHAT COUNTS (see `computeLossStreak` in engine/world.ts for the reasoning):
 *   - a tournament match she lost           -> counts, and extends the streak;
 *   - a tournament match she won            -> BREAKS the streak (nothing else does);
 *   - a practice friendly, either result    -> invisible (R11-2: a friendly never moves her face);
 *   - a walkover / medical withdrawal       -> invisible: she never took the court, so there is no
 *                                              defeat to add and nothing to forgive either. */
export interface LossStreak {
  /** consecutive competitive losses ending at her most recent competitive match (>= 1) */
  losses: number
  /** the week the streak's FIRST loss was played – the sub-stream key `angerAt` is drawn on, and
   *  what makes the threshold stable for the life of one streak instead of re-rolled per render */
  startWeek: number
  /** how many consecutive losses THIS streak needs before her face turns angry (4..6, drawn once) */
  angerAt: number
}

/** R12-15 / R12-3 – WHAT THE "next week" BUTTON IS ACTUALLY ABOUT TO DO.
 *
 *  The sticky bar's label used to be derived from one fact: is there an entered event on
 *  `week + 1`? If yes it said "🏆 Play {TIER} ▶", whatever her body or her ranking points had done
 *  since. So an entry that was going to resolve as a walkover was advertised as a tournament, and
 *  a committed entry to a tier she had outgrown was advertised as an ordinary one.
 *
 *  This is the ENGINE's own arrival verdict for that event (`arrivalStatus` in engine/world.ts) –
 *  the very verdict `tickWeek` will resolve the week with – carried on the snapshot so the button
 *  reads it instead of guessing. Null when no entry sits on `week + 1`.
 *
 *  ONLY FACTS ARE PREVIEWED. The layoff window and the point band are pure state: they cannot
 *  change between this snapshot and the tick that reads them, so previewing them is safe. The
 *  DOCTOR's arm is deliberately absent – his verdict is re-read on arrival against a condition that
 *  can still rise before then (physio, a blackout week), so a "not cleared" preview could turn out
 *  false and a button that cried wolf would be a NEW lie in place of the old one. A medical
 *  withdrawal announces itself the way it always has: it halts the advance with the 'medical' stop
 *  and its own toast. */
export interface ArrivalPreview {
  eventId: string
  tier: TierId
  /** the event's week – always `snapshot.week + 1` by construction */
  week: number
  /** 'injured' = the layoff still covers that week, so it will be a walkover (0 pts, fee
   *  forfeited); 'play' = she takes the court, as far as anything knowable today says. */
  verdict: 'play' | 'injured'
  /** player-facing reason, present exactly when `verdict === 'injured'` */
  detail?: string
  /** her points have passed the tier's ceiling. The entry is COMMITTED and still plays (R10-3) –
   *  this is here so the button can say so, never so a surface can block it. */
  outgrown: boolean
}

// --- Diary-1 + Memory (docs/specs/family-diary.md, D1/D2/D3 + D10) -------------
// The diary speaks in WORDS licensed by FACTS. The engine assembles the facts at snapshot time
// (nothing here is persisted except the milestone ledger), selects at most one line per surface
// off the `seed:diary:<week>` sub-stream, and the UI renders the strings verbatim – so a phrase
// can never assert something the simulation did not do. src/engine/diary.ts owns the whole system.

/** The durable moments a career keeps forever (D10, schema v18). Captured AT THE MOMENT they
 *  happen; a dozen rows per career, so the ledger needs no pruning. */
export type MilestoneType = 'title' | 'final' | 'international' | 'injury' | 'season-rank'

/** One captured milestone. Deliberately tiny: type + week + the minimal payload its memory line
 *  needs. Identity (for idempotent capture) is `milestoneKey` in engine/diary.ts. */
export interface Milestone {
  type: MilestoneType
  /** the absolute career week it happened */
  week: number
  /** title/final: the tier it happened at. international: the tier of the first entry (absent on
   *  a migrated save that only knows the week). */
  tier?: TierId
  /** injury: the injury kind, e.g. "ankle soreness" */
  kind?: string
  /** season-rank: the season it closed */
  seasonIndex?: number
  /** season-rank: her rank at that season's wrap-up */
  rank?: number
}

/** How drained she is, as a WORD (D3 – Home speaks words; Stats keeps the number). */
export type ConditionBand = 'fresh' | 'ok' | 'worn' | 'drained'

/** How the family wallet is breathing, as a band – the diary never quotes the balance. */
export type FundsPressure = 'tight' | 'watchful' | 'ok'

/** Everything a diary phrase is allowed to know – assembled by the ENGINE at snapshot time, all
 *  read off facts that already exist on the world. A phrase is selected BY these and may assert
 *  nothing they do not carry (the honesty pin in tests/diary.test.ts sweeps exactly that). */
export interface DiaryFacts {
  week: number
  /** the ONE face decision, computed engine-side (same inputs the paintings render) */
  emotion: AvatarEmotion
  /** a competitive result from THIS week is on her face (the emotion above is a result emotion) */
  resultFresh: boolean
  /** fresh result: she won her last match this week */
  won: boolean
  /** fresh result: the loss was the FINAL – runner-up, a good result (R8-6a) */
  lostFinal: boolean
  /** a tournament TITLE landed this week (finishIdx 0 on this week's summary) */
  titleThisWeek: boolean
  /** tier of the fresh result, when it could be resolved */
  resultTier: TierId | null
  /** her rank after this week's standings recompute is strictly better than before it –
   *  the engine's capture (never derived in the UI) behind the third loss softener */
  rankClimbed: boolean
  /** R13-2: the ranking points her run AWARDED this week (the kid's result rows at `week`).
   *  finalizeTournament writes a row only when points > 0, so since wave B's first-round zero
   *  "> 0" is exactly "she WON matches this week" – the licence the climb softener and the
   *  good-loss diary lines require, because rank is relative and can climb on a zero-point week
   *  purely off rivals' results decaying out of their 52-week windows. */
  runPointsThisWeek: number
  /** consecutive competitive losses ending at her most recent competitive match (0 = none) */
  lossStreak: number
  /** raw condition 0..100 – the diary module bands it; surfaces print words, not this number */
  condition: number
  conditionBand: ConditionBand
  /** the active injury, or null when healthy */
  injured: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** this week's drains, read off the week's own events/state */
  travelled: boolean
  playedTournament: boolean
  playedPractice: boolean
  examsWeek: boolean
  offSeasonWeek: boolean
  vacationWeek: boolean
  fundsPressure: FundsPressure
  /** a milestone captured THIS week, if any */
  freshMilestone: MilestoneType | null
}

/** The Memory card (D10): a past milestone, the painting from the age band she was in THEN, and
 *  one line. `anniversary` = the milestone's week is ~52 weeks ago (±1); `echo` = the deterministic
 *  every-4-6-weeks pick off `seed:memory:<week>`. */
export interface MemoryCard {
  kind: 'anniversary' | 'echo'
  milestone: Milestone
  /** e.g. "one year ago" (anniversary) or the milestone's week label "W14 '31" (echo) */
  whenLabel: string
  /** the age band she was in at the milestone's week – what makes time felt */
  stage: PortraitStage
  /** the painting emotion the memory shows (title → happy, injury → injury, …) */
  emotion: AvatarEmotion
  line: string
}

/** The diary as the UI sees it: the facts, plus at most ONE selected line per surface. The photo
 *  line may be null – silence is allowed and meaningful (an ordinary week may say nothing). */
export interface DiarySnapshot {
  facts: DiaryFacts
  /** the one phrase under her name on the Home photo card (D2), or null for a quiet week */
  photoLine: string | null
  /** epic/redesign-home: the time-of-day word the diary page opens with – "Good morning" before the
   *  week is played, "Good evening" once its tournaments have resolved, otherwise varied off
   *  `seed:greet:<week>` and never repeating a word the caption already used. See greetingFor. */
  greeting: string
  /** the one WHY line beside the condition bar (D1) – never empty */
  conditionNote: string
  /** the Memory card to show this week, or null */
  memory: MemoryCard | null
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
   *  60-event cap). window12w = last 12 weeks; season = the current 52-week season block;
   *  weekly12 = the SAME 12 weeks kept week-by-week, for the Home budget card's chart (a fold
   *  cannot be un-folded, so the shape over time has to be carried separately). */
  finance: { window12w: FinanceWindow; season: FinanceWindow; weekly12: FinanceWeekPoint[] }
  /** most recent financial transactions (amountCents present), id-ascending, up to 50 –
   *  independent of the mixed 60-event `events` cap so the ledger isn't starved by news. */
  financialEvents: WorldEvent[]
  /** scheduled events over the next 8 weeks, with entry state */
  upcoming: UpcomingEvent[]
  /** R12-15/R12-3: the engine's verdict on the entered event for `week + 1` – the week the sticky
   *  bar's button is about to play – or null when nothing is entered there. See ArrivalPreview. */
  arrival: ArrivalPreview | null
  /** the ITF annual entry cap for the CURRENT season – what the Home tier ladder needs to tell
   *  "capped for the year" apart from "locked on points" and "nothing scheduled". Derived at
   *  snapshot time from the persisted ledger, so it persists nothing of its own. */
  entryCap: EntryCapUsage
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
  /** her current run of consecutive competitive losses + the threshold that turns it angry, or
   *  null when her last competitive match was a win (or she has never played one). Derived at
   *  snapshot time from the event log – persists nothing, bumps no schema. */
  lossStreak: LossStreak | null
  /** Diary-1: the facts + the selected lines for every diary surface (photo card, condition
   *  note, Memory). Derived at snapshot time – only the milestone ledger behind `memory`
   *  persists (schema v18). */
  diary: DiarySnapshot
  /** the most recent end-of-season recap (schema v10), or null before the first season ends */
  lastSeasonSummary: SeasonSummary | null
  /** every finished season, oldest first (schema v14, R10-9) – the season-by-season table on
   *  Stats. Empty until the first wrap-up. */
  seasonHistory: SeasonHistoryEntry[]
  /** EVERY reason an `advance` stopped early, in STOP_PRECEDENCE order; absent when the advance ran
   *  its full course. R11-1: this replaced a single `stopReason`, which could only ever report one
   *  of the week's true reasons and silently dropped the rest (a fresh injury on the wrap-up week
   *  came back as 'season-end' alone). The UI dispatches off the SET, so an injury and the season
   *  wrap-up are both reachable from one advance. */
  stopReasons?: StopReason[]
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
  // R10-13: cancel an entry before its week starts. Past the deadline the fee is FORFEITED and the
  // week becomes plannable again (the escape from the R10-3 dead end); before it, a full refund.
  | { id: number; type: 'cancelEntry'; eventId: string }
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
