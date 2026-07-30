// Typed message protocol between UI and the sim worker.
// The worker owns the authoritative state; the UI only ever sees snapshots.

// Type-only imports (erased at compile – no runtime dependency on the engine).
import type { LadderTrack, MatchRecord, RankingRow, TierId } from '../engine/season/types'
import type { SkillKey } from '../engine/development'
import type { MatchPlayer, Surface } from '../engine/match/types'
import type { AvatarEmotion, PortraitEmotion, PortraitStage } from './avatarEmotion'
import type { EventPreview } from '../engine/season/preview'

export type FamilyBackground = 'wealthy' | 'middle' | 'working'
/** The coach ladder (docs/specs/coach-tiers.md), cheapest rung first. Replaces the old
 *  `CoachSetup = 'parent' | 'hired'` boolean, whose single `hired` band turned out to be a smear
 *  across three real tiers. `self` is the parent on the court – free as a coach, though the court
 *  is still rented. See src/engine/coach.ts for what each rung costs and what it is worth. */
export type CoachTier = 'self' | 'budget' | 'middle' | 'high' | 'elite'
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
  /** which rung of the coach ladder she is on (schema v22) */
  coachTier: CoachTier
  playStyle: PlayStyle
  /** 1-12 (schema v9). Relative-age-effect groundwork (round-3 QA item 16): picked at
   *  onboarding, purely cosmetic until Phase 4 wires the junior age-group dynamics it's
   *  meant to feed. */
  birthMonth: number
  /** her birth DAY within that month, 1-28/30/31 (owner, 30.07: «мы же будем ее с ДР на неделе поздравлять
   *  (и подарки дарить, кстати), чтобы точно знать на какой нам нужен день»).
   *
   *  ⚠ IT AFFECTS THE BIRTHDAY WEEK AND NOTHING ELSE - his own framing, and the right scope. The relative
   *  age effect is a MONTH-resolution idea (position inside the birth year), so `kidAgeExact` and
   *  `relativeAgeHeadStart` deliberately do not read this: refining 1/12 to 1/365 on a quantity whose whole
   *  meaning is "which part of the year" buys nothing, and threading a day into the development path would
   *  add precision nothing reads.
   *
   *  AND IT IS THE PLAYER'S, not derived, which is the part I had wrong. I proposed rolling it off the seed;
   *  he is right that a parent KNOWS his daughter's birthday - and a present has to be plannable, so the
   *  date has to be something he chose rather than something the game told him. */
  birthDay: number
}

export const DEFAULT_PROFILE: PlayerProfile = {
  kidName: 'Vera',
  kidLastName: 'Martin',
  gender: 'girl',
  country: 'US',
  background: 'middle',
  // A middle-class family's default is the STANDARD private coach, not the dearest one on the
  // ladder. The old default read `coachSetup: 'hired'`, which the spec's conversion prices at
  // ~$475/wk – an Elite coach, and precisely the wall this slice exists to close.
  coachTier: 'middle',
  playStyle: 'all-court',
  birthMonth: 6,
  birthDay: 15,
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
  /** 'academy' (v21) is an INCOME-side category: the once-a-year kit grant that comes with a
   *  scholarship. The travel half of the same scholarship is NOT booked here – it is taken off the
   *  travel line itself, so the ledger shows the reduced price the family actually paid.
   *
   *  ⚠ The comparison this used to draw – "exactly like the racket sponsor's gear discount" – is
   *  gone with that discount (30.07, tune/rank-numbers). The local sponsor no longer reduces a line;
   *  it pays a flat annual grant under 'sponsor', the way this kit grant already did. See
   *  ECONOMY.sponsorship. Travel-cover remains the only price-reducing subsidy in the game. */
  | 'academy'
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
  /** what the family HAD at the end of this week, in cents – the running balance, reconstructed
   *  backwards from today's funds so the last point of the series IS the number printed above the
   *  chart. Signed: a family below zero charts below zero. (A2, the owner's chart ruling: the card
   *  draws the line the export draws, and the line a parent actually watches is the balance, not
   *  the per-week churn – the slope toward zero is the whole game.) */
  balanceCents: number
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
  /** W4: she came off court with a KNOCK and the parent has not answered yet. Unlike every reason
   *  above it does not merely halt the advance, it BLOCKS it – `advanceWeeks` refuses to tick at all
   *  while a knock is undecided, the same contract `pendingTournament` has. That is the whole point:
   *  the owner's complaint was that training weeks «просто скипались», and a stop the player can
   *  skip past is not a decision. See engine/knock.ts. */
  | 'knock'

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
  // W4: fourth, above everything that can wait a click, for a stronger reason than the three
  // medical beats have – the advance CANNOT continue until it is answered (`advanceWeeks` returns
  // early on an undecided knock). A stop nobody surfaces would strand the career, so it has to
  // outrank every reason that owns a dismissable toast. It sits BELOW the medical trio because those
  // have already cost money by the time they fire, and a knock has not cost anything yet.
  //
  // It can never collide with 'tournament' or 'season-end' on the same week (a knock only arrives on
  // an ordinary training week – no tournament, no off-season), but it CAN co-occur with 'deadline'
  // and 'funds', which is exactly the ordering this line decides.
  'knock',
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
  /** travel the academy paid for inside the season, in cents (schema v21). 0 when nobody was
   *  backing her. OPTIONAL for the same reason as the two above: a recap is a record of what was
   *  said, and summaries banked before v21 never knew this number. */
  academyCoveredCents?: number
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
  /** THE DAY'S TEMPERATURE, for the live match's weather plate. The SAME number the Season card
   *  showed for this tournament – `eventTemperature`, one source, so the two surfaces cannot
   *  disagree about the weather at one event. Decorative: nothing reads it but a screen.
   *  ⚠ `upcoming` is filtered to `week > world.week`, so an event BEING PLAYED has already dropped
   *  out of it and its preview is unreachable. That is why this rides on the pending view instead
   *  of the viewer re-deriving it – two call sites computing one number is how they drift. */
  temperatureC: number
  /** stage of the round currently being presented, e.g. "Round of 16", "Final" */
  roundLabel: string
  /** WHICH TABLE THIS TOURNAMENT IS PLAYED ON – `TIERS[tier].track`, carried rather than re-derived.
   *
   *  ⚠ THE BUG THIS CLOSES (31.07, fix/ladder-separation). The owner, after a National: «по итогам
   *  матча national в таблице пишут # из international». Every rank on this overlay – the splash's
   *  VS panel, the pre-match scene, the post-match box score, and the two the live MatchViewer
   *  prints over the players' heads – came from ONE table: the kid's off `Snapshot.kidRank` (the
   *  ITF alias) and the opponent's off `fullRanking`, which is `rankingFor(world, 'itf')` with its
   *  name filed off. So a National quarter-final between two girls with no international result
   *  showed two numbers from a table neither of them was playing in, next to a trophy worth 70
   *  NATIONAL points. Two currencies with no exchange rate (docs/specs/two-ladders.md) and the one
   *  screen where both players are on the court at once was quoting the wrong one.
   *
   *  It rides on the pending view rather than being re-derived in the component for the same reason
   *  `temperatureC` does: the event has already dropped out of `upcoming` by the time it is played,
   *  and a second derivation of "which ladder is this" is a second thing to get wrong. */
  ladder: LadderTrack
  /** HER rank in `ladder`, or null when she holds no counting result in it.
   *
   *  ⚠ NULL IS NOT #1 and it is not the tie floor either – the same distinction `LadderView.rank`
   *  carries, for the same reason. This used to be read off `Snapshot.kidRank`, which is a NUMBER at
   *  all times: with nobody holding a point the whole field ties at zero, competition ranking hands
   *  every member of that tie the same place, and `recomputeKidRank` falls back to `cohort.length + 1`
   *  on top of that. So a fourteen-year-old walking into her first Local Open was introduced on the
   *  splash as "Rank #119". */
  kidRank: number | null
  /** the kid's opponent this round: short name, ISO-2 nation, and her rank IN THE SAME TABLE –
   *  null when she holds no counting result in it, by the identical rule. A rank printed beside
   *  another rank has to be measured in the same units or the comparison the card invites is a lie. */
  opponent: { name: string; nation: string; rank: number | null }
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
  /** how many people came, for the E brief's fourth fact. The SAME decorative reading the Season
   *  card's `UpcomingEvent.preview.crowd` carries, off the same `seed:crowd:<eventId>` sub-stream –
   *  carried here because a preview leaves the snapshot the week its event arrives (upcomingEvents
   *  filters to `week > world.week`), and screen E must not print a second, different number for the
   *  same tournament. Decorative: nothing in the simulation reads it (engine/season/preview.ts). */
  crowd: number
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

// --- THE KNOCK (schema v26) --------------------------------------------------
// The ordinary training week's one EVENT: she picks up something sore, and the parent decides
// whether to rest it or send her back out. Owner, 30.07, asking a second time – see engine/knock.ts
// for the whole design, the anti-farming argument and the RNG discipline.

/** What he chose to do about it. `rest` writes the week off; `push` keeps it and loads the dice. */
export type KnockChoice = 'rest' | 'push'

/** A knock, as the world persists it. ⚠ THE ONE PIECE OF NEW PERSISTED STATE in this slice, and the
 *  reason it has to be persisted rather than derived: `choice` is a DECISION THE PLAYER MADE, and a
 *  decision that does not survive a reload is not a decision. */
export interface Knock {
  /** where it hurts – "shoulder", "lower back" … (engine/knock.ts KNOCK_PARTS) */
  part: string
  /** the week she came off court with it */
  sinceWeek: number
  /** she has been sent back out on THIS part before (engine/knock.ts pushedParts) – the thread */
  repeat: boolean
  /** null until he answers. While it is null the advance is BLOCKED, exactly like a pending
   *  tournament: a week cannot resolve around a question nobody answered. */
  choice: KnockChoice | null
  /** the last week this knock still matters. Set when the choice is made (knockUntilWeek): the rest
   *  week for `rest`, KNOCK_PUSH_WEEKS out for `push`. Equals `sinceWeek` while undecided. */
  untilWeek: number
}

/** A retired knock, for the accumulating thread. Bounded by pruning, like `injuryHistory`. */
export interface KnockRecord {
  part: string
  sinceWeek: number
  untilWeek: number
  choice: KnockChoice
  /** it turned into a real injury while he was pushing through it – the thread's bill */
  brokeDown?: true
}

/** Everything the decision dialog shows, DERIVED at snapshot time (no schema cost).
 *
 *  The copy lives in the engine and not in the template for the reason KidScreen's own header gives:
 *  a line that lives in the engine can be tested, and a line that lives in a template is decoration.
 *  `read` is deliberately FOGGED – no number anywhere – which is buildTrainingRead's idiom: the coach
 *  has an opinion, not a probability readout. */
export interface KnockPrompt {
  part: string
  repeat: boolean
  /** what happened, in the parent's voice */
  line: string
  /** what the coach makes of it */
  read: string
  /** ⚠ THE LEGIBILITY REQUIREMENT: one plain sentence per branch, naming the currency he is
   *  spending. The player must be able to see what he traded. */
  restCost: string
  pushCost: string
}

/** Her academy scholarship as the UI needs it (schema v21). The engine keeps the level; the screens
 *  only ever want the SHARE of a trip somebody else is paying, which is the level already scaled by
 *  `ECONOMY.academy.travelCover` – so the number here is the one the card prints and nothing has to
 *  re-derive it. */
export interface SnapshotAcademy {
  /** 0..1 – the share of every travel bill the academy covers right now. */
  coverShare: number
  /** the week the current unbroken run of support began. */
  sinceWeek: number
  /** travel the academy has paid for since the last review, in cents. */
  coveredCents: number
}

/** A scheduled event surfaced to the UI, with the kid's entry state + tier lookups. */
/** ONE ROW OF THE COACH MARKET (screen T, schema-free - derived at snapshot time).
 *
 *  The ENGINE decides fit, price, affordability and the gate; the screen only lays them out. That
 *  is the same division `UpcomingEvent` uses for a tournament, and it is why two surfaces can never
 *  disagree about what a coach costs. */
export interface CoachMarketRow {
  /** stable id, and also the portrait stem under public/images/coaches */
  id: string
  tier: CoachTier
  name: string
  /** the game HE plays */
  style: PlayStyle
  /** how that reads against hers - the great / good / off pill */
  fit: 'great' | 'good' | 'off'
  /** his weekly price in HER family's market, at HER plan and HER age */
  weeklyCents: number
  /** true for the coach she trains with today */
  current: boolean
  /** how much his weekly price exceeds the week's parent income, or 0 when it fits */
  overBudgetCents: number
  /** ranking points still needed before he would take her, or null when nothing is stopping her.
   *  Always null while ECONOMY.coach.eliteGate is off, which is its shipped state. */
  lockedPoints: number | null
  /** [lo, hi] percent of her CURRENT level this rung could add over a season, above what the
   *  parent alone would manage. Computed from her own headroom - see coachSeasonUplift. */
  upliftPct: [number, number]
  /** WHAT HE DOES ABOUT HER BODY, in one sentence (docs/specs/coach-as-load-manager.md).
   *
   *  Added because a ladder nobody can see is not a product. The load wave gave the rungs two new
   *  differences - how well their medical team protects her (`physioQuality`) and how much of the
   *  week-to-week deciding they take off the parent (`coachEscalates`) - and both were invisible on the
   *  one screen where the money is spent. The market card carried a development uplift and nothing else,
   *  so the whole slice would have read as "the numbers moved for no reason".
   *
   *  A SENTENCE, not two more numbers. The uplift range is already the card's quantitative claim, and
   *  the honest thing to say about load is qualitative: the measured spread between rungs is real but
   *  small (a few injury weeks over four years), and printing "-2.7 weeks" would promise a precision the
   *  120-seed run does not support. */
  loadNote: string
}

export interface UpcomingEvent {
  id: string
  week: number
  tier: TierId
  surface: Surface
  /** what the Season card may say about an event she has not played: her odds in ROUND ONE against
   *  the field as it would be drawn today, who that opponent would be, how strong the field is, and
   *  two decorative readings (the temperature and the crowd). Derived at snapshot time, persists
   *  nothing, and draws only on the event's own `seed:kidtour:` / `seed:weather:` / `seed:crowd:`
   *  sub-streams. Explicitly an estimate about a field that will have moved by the time the event
   *  plays – see engine/season/preview.ts. */
  preview: EventPreview
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
  /** THE HIRED COACH'S OWN OPINION about this trip (docs/specs/coach-as-load-manager.md §8), or absent.
   *
   *  Present only when a coach is HIRED and he would advise against it; never on a self-coached career,
   *  because there is nobody to have the opinion. A SENTENCE rather than a flag, for the same reason
   *  `cautionDetail` is one: the card prints what he said.
   *
   *  ⚠ ITS OWN FIELD, NOT A NEW `cautionReason`, and the two are independent on purpose. `'fatigued'`
   *  is the ENGINE's rule (she is under `minConditionToEnter`), and this is a PERSON's read of her -
   *  which can fire when the engine's rule does not, because the coach's margin is scaled by what he
   *  believes about her stamina. A cheap coach who thinks she is tough will stay quiet on a trip the
   *  fatigue caution is already flagging; an expensive one will speak up before it does. Folding them
   *  into one enum would have made those two states indistinguishable, and the gap between them IS the
   *  thing being sold.
   *
   *  NEVER A BLOCK. "The parent may push" is a standing rule of this game and the doctor's veto
   *  (`ineligibleReason: 'medical'`) is its single exception. `eligible` stays true. */
  coachCaution?: string
  /** the tier's minPoints threshold, present only when 'locked', so the UI can show "Reach N pts". */
  pointsToEnter?: number
  /** the ITF rank an international rung accepts down to, on a card locked by an ACCEPTANCE LIST
   *  rather than by points (docs/specs/two-ladders.md). The card says "takes the top N" instead of
   *  quoting a points number she cannot read off her own table. N is DERIVED from the tier's
   *  `enterPct` and the live field size (see acceptanceRank), so it moves with a re-picked list and
   *  with the population - do not quote a literal here, as the "top 50" this comment used to name
   *  was stale by two re-pins when it was found on 30.07. */
  rankToEnter?: number
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
/** WHICH RUNGS THE ENGINE WILL ACTUALLY LET HER ENTER, as the engine itself decides it
 *  (`tierOpenFor`). Derived at snapshot time; persists nothing.
 *
 *  ⚠ IT EXISTS BECAUSE THE TWO LADDERS BROKE A SHARED ASSUMPTION. `composables/tierState.ts` read
 *  `enterPointBand` for every tier, which was the one rule while every rung gated on points. Since
 *  the two-ladder slice, J60 and J300 gate on her ITF RANK POSITION and their bands are `[0, MAX]` -
 *  so the readout said "Unlocked - enter your first!" about events the engine refuses, which is
 *  exactly the failure HomeScreen's own comment warns against. The screens now ask the engine
 *  rather than re-deriving a rule that no longer covers every rung. */
export type TierOpenMap = Record<TierId, boolean>

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

/** ONE LADDER, EVERYTHING ABOUT IT - see `computeLadderView` in engine/world.ts for the argument.
 *
 *  There are two of these on a Snapshot because docs/specs/two-ladders.md designed two tables with
 *  two currencies and no exchange rate between them. They are the SAME SHAPE on purpose: a screen
 *  should render "a ladder" once, not branch on which one it was handed. */
export interface LadderView {
  /** Her dense place in this table, or NULL when she holds no counting result in it - i.e. she is not
   *  ranked here at all.
   *
   *  ⚠ null IS NOT #1, and the distinction is load-bearing. Competition ranking gives every member of
   *  a tie the same place, so while nobody holds a point the whole field ties at zero and a point-less
   *  kid comes out as a single digit. Every screen used to guard that with its own
   *  `countingResults.length > 0` check; carrying it in the type means none of them can forget. */
  rank: number | null
  /** Her place in THIS table at the start of the last resolved week; null before any tick.
   *
   *  ⚠ Per-ladder on purpose. A movement arrow is (previous - current), and with one shared "previous
   *  rank" a screen showing her national place would have diffed it against last week's international
   *  place - a quieter instance of the bug that produced #4 on Home against #128 in Stats. */
  prevRank: number | null
  /** Her windowed best-6 total IN THIS TABLE'S CURRENCY. National points and ITF points are different
   *  units and must never be added, compared or silently swapped for one another. */
  points: number
  /** Top 10 + a window around her, rank order - this table only. */
  standings: StandingRow[]
  /** The results THIS table counted, strongest first. Pairs with `rank`: a rank and the results that
   *  earned it have to come from the same table or the explanation contradicts the number. */
  countingResults: CountingResult[]
}

/** Both tables, keyed by the engine's own track names.
 *
 *  ⚠ THESE KEYS ARE NOT PLAYER-FACING COPY. The owner's rule is that a player must never need the
 *  word "track", and "domestic"/"itf" are engine vocabulary. The player-facing labels live in exactly
 *  one place - `LADDER_LABEL` below - so no screen invents its own name for a table. */
export type LadderViews = Record<LadderTrack, LadderView>

/** The player-facing name of each table, defined ONCE. "National" and "International" are the words a
 *  parent would use; nothing in the UI says "domestic", "ITF" or "track". */
export const LADDER_LABEL: Record<LadderTrack, string> = {
  domestic: 'National',
  itf: 'International',
}

/** HER LADDER AND HER PLACE ON IT, resolved once for the surfaces that want "her rank" and have no
 *  table of their own to be about.
 *
 *  ⚠ IT EXISTS BECAUSE `snapshot.kidRank` IS THE WRONG ANSWER TO AN OBVIOUS QUESTION, and it is the
 *  answer three surfaces reached for (31.07, fix/ladder-separation): the week recap's rank-move line
 *  and both friendly-match cards. `kidRank` is the ITF alias and it is always a NUMBER, so an
 *  unranked girl came out as the tie floor she shares with half the field, in a table the Stats
 *  screen was calling "Unranked" on the next tab. Home, Stats and the Kid screen already ask
 *  `ladders[activeLadder]`; this is the same question with one implementation, so the answer cannot
 *  drift for the fourth surface that needs it.
 *
 *  `rank` is null when she holds no counting result in that table – see `LadderView.rank`. */
export function activeLadderOfSnapshot(
  snap: Pick<Snapshot, 'ladders' | 'activeLadder'> | null | undefined,
): { track: LadderTrack; label: string; rank: number | null; points: number } {
  const track = snap?.activeLadder ?? 'domestic'
  const view = snap?.ladders[track]
  return { track, label: LADDER_LABEL[track], rank: view?.rank ?? null, points: view?.points ?? 0 }
}

/** The unit each table's points are counted in, for a label that has to name the currency (the Home
 *  ladder's entry thresholds are all denominated in NATIONAL points - see engine/season/calendar.ts,
 *  whose own ladder diagram is drawn against "domestic pts"). */
export const LADDER_POINTS_LABEL: Record<LadderTrack, string> = {
  domestic: 'national pts',
  itf: 'international pts',
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
  /** the ONE face decision, computed engine-side (same inputs the paintings render).
   *  `PortraitEmotion`, not `AvatarEmotion`: the decision can land on the painting-only `rehab`
   *  (R14-1 – the layoff is a state and wears its own picture), and nothing renders a crop of it. */
  emotion: PortraitEmotion
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
  /** HOW HARD SHE WORKED THIS WEEK – `plan.train`, the percentage the player set (60 / 75 / 85 on
   *  the presets). W2: the one fact about an ordinary week the diary had no access to, and the only
   *  one that is the PLAYER's decision rather than the world's. Every other field here is something
   *  that happened to her; this is something he chose, which is why the week-note pool is licensed on
   *  it. Derived (the plan lives on the world already) – no schema. */
  trainPct: number
  fundsPressure: FundsPressure
  /** a milestone captured THIS week, if any */
  freshMilestone: MilestoneType | null
  /** the scene of the journey home, on a week she came back from an away tournament; null
   *  otherwise. See engine/diary.ts travelHomeSceneFor for the rule and the draw. */
  travelHomeScene: TravelHomeScene | null
  /** HOW she came home, on exactly the weeks `travelHomeScene` is non-null (null on every other
   *  week, and the two are null together by construction). The owner's rule, read off the tournament
   *  she is coming back FROM and the state she is in: reached the final → happy or sleepy, fell
   *  short → sad, or sleepy if she was worn out anyway. See engine/diary.ts travelHomeMoodFor. */
  travelHomeMood: TravelHomeMood | null
  /** W4 – WHAT THE KNOCK IS DOING TO THIS WEEK, or null. `'rest'` = she is spending the week off the
   *  training court; `'push'` = she is training on it and the coach knows.
   *
   *  ⚠ THE WEEK-NOTE POOL HAD TO LEARN ABOUT THIS OR IT WOULD LIE. W2's ordinary-week band is licensed
   *  on `plainTraining`, and a rested week would otherwise still be eligible for "Six days on court.
   *  She ate like someone twice her size." – which the honesty pin exists to catch. So the fact rides
   *  on the facts object, `plainTraining` excludes it, and the knock gets its own band of lines.
   *  Derived: `world.knock` is persisted, this is a reading of it. */
  knockChoice: KnockChoice | null
  /** W4: where the live knock is, on exactly the weeks `knockChoice` is non-null. Null together with
   *  it by construction – the note pool needs the part to name it. */
  knockPart: string | null
  /** THE AGE SHE TURNS THIS WEEK, or null on the other fifty-one (owner, 30.07). Derived from her birth
   *  month against the calendar - no schema, and it cannot disagree with `kidAgeExact` because both read
   *  the same two facts.
   *
   *  It is a NUMBER rather than a boolean because the age is the point. A December girl turning fourteen in
   *  the last month of a season she played as a thirteen-year-old is the relative-age story told in one
   *  line, and it is where the player first meets it. */
  birthdayAge: number | null
}

/** THE JOURNEY HOME (owner, 29.07: «sleepy показываем рандомно после выездов на турниры в конце на
 *  экране Week story как в макете»). Four paintings of the same girl asleep on the way back –
 *  `fem-euro-brunnet-travel-{mood}-{scene}.webp`.
 *
 *  NOT PART OF THE PORTRAIT MATRIX, and deliberately not typed as one: they are NOT band-scoped.
 *  The same four serve a fourteen-year-old and a woman of thirty-one, because the picture is of a
 *  journey rather than of a face – she is asleep in all four. Forcing them into `PortraitEmotion`
 *  would have implied five copies of each that do not exist and never will. */
/** THE MOOD OF THE JOURNEY HOME. The owner's 29.07 art drop turned four paintings into twelve:
 *  «если дошла до финала можем рандомно показывать happy/sleepy разные, если не дошла - sad или
 *  sleepy если сильно устала при этом». The ENGINE picks it; nothing here decides. */
export type TravelHomeMood = 'sleepy' | 'happy' | 'sad'

export type TravelHomeScene = 'airport' | 'plane' | 'bus' | 'car'

/** W5 — WHICH PAINTING A WEEK SHOWS (owner, 30.07: «week recap сделаем на каждую неделю ... Для
 *  недель с тренировками можем использовать наши арты тренировки, для недель с восстановлением после
 *  травмы соответственно. Если был отпуск - есть соответствующие картинки отпуска»).
 *
 *  A DISCRIMINATED UNION AND NOT A URL, because the two are different jobs: the ENGINE decides what
 *  the week was (`engine/diary.ts weekSceneFor`, which is where the priority order is written down and
 *  argued), the ART LAYER spells the filename (`art/weeks.ts weekSceneArtUrl`) and the CARD writes the
 *  description. A screen handed a URL cannot be asked what the week was; a screen handed this cannot
 *  answer it differently from any other screen.
 *
 *  Every arm carries `week`, so the filename builder needs no second argument and the vacation arm can
 *  fall back to the week frame for a package whose picture has not been painted yet.
 *
 *  W6 ADDED `exam` AND `knock` (owner's art, 30.07), and each closed a week the frame was contradicting
 *  rather than merely generalising:
 *    `exam`  – the school fortnight drew ladder drills on a week she cannot enter anything.
 *    `knock` – the owner, reading the trace: «Неделя с заминкой показывает заминку в записке и в сводке
 *              - но картинка ей противоречит». A rested knock is a FOURTH state the art had no frame
 *              for: not training, not a holiday, not a layoff (`world.injury` stays null and she is
 *              still entry-eligible) - she is at home, off the court, back on Monday.
 *  Both are BAND-SCOPED like `rehab`, because both are pictures of HER rather than of a place. */
export type WeekScene =
  | { kind: 'travel'; week: number; scene: TravelHomeScene; mood: TravelHomeMood }
  | { kind: 'rehab'; week: number; stage: PortraitStage }
  | { kind: 'vacation'; week: number; packageId: string }
  | { kind: 'exam'; week: number; stage: PortraitStage }
  | { kind: 'knock'; week: number; stage: PortraitStage }
  | { kind: 'week'; week: number }

/** The Memory card (D10): a past milestone, the painting from the age band she was in THEN, and
 *  one line.
 *    `anniversary` – the milestone's week is ~52 weeks ago (±1). The loud one.
 *    `debut`       – the career's OPENING WEEK (W3, owner 30.07). Carries no milestone: week 0 is a
 *                    fact of every career, so it needs no ledger entry and persists nothing.
 *    `echo`        – an older memory the rotation came round to.
 *    `recent`      – the rotation landed on her newest. A3: the card is titled "Recent memory", and a
 *                    quiet week used to make it say "Too early for memories" to a girl four seasons
 *                    into her career. Silence is a fine thing for a diary LINE; on a card with a
 *                    heading it is a lie. The distinction survives in `kind` so the loud weeks can
 *                    still look different from the quiet ones. */
export interface MemoryCard {
  kind: 'anniversary' | 'debut' | 'echo' | 'recent'
  /** null on the `debut` card ONLY – see `kind`. Widening this costs no schema: `MemoryCard` is
   *  derived at snapshot time and never saved; the milestone LEDGER behind it is untouched. */
  milestone: Milestone | null
  /** e.g. "one year ago" (anniversary) or the milestone's week label "W14 '31" (echo/recent) */
  whenLabel: string
  /** the age band she was in at the milestone's week – what makes time felt */
  stage: PortraitStage
  /** the painting emotion the memory shows (title → happy, injury → injury, …).
   *  Stays the NARROW union on purpose: a memory is a picture of a WEEK THAT HAPPENED, so every
   *  value here is a moment face – `injury` is the week she went down, never the layoff after it
   *  (R14-1). Nothing a milestone can map to is painting-only. */
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
  /** THE NOTE ON THE SCRAP UNDER THE JOURNEY PAINTING (screen D). Non-null on exactly the weeks
   *  `facts.travelHomeScene` is non-null, and never null on those – the picture is of a journey and
   *  a picture of a journey wants a caption, the same argument that keeps `conditionNote` from being
   *  silent. Written in the PARENT's voice, about her, in the third person; every line is licensed
   *  by facts of the trip she is coming back from, so it can never describe a final she did not
   *  reach. See engine/diary.ts TRAVEL_NOTES. */
  travelNote: string | null
  /** THE ORDINARY WEEK'S NOTE, on the same scrap `travelNote` uses (screen D) and in the same
   *  parent's hand – null on most weeks, and null on every week `travelNote` speaks. W2: the owner's
   *  «чтобы тренировочные недели не просто скипались ... что происходит на этих неделях». See
   *  engine/diary.ts WEEK_NOTES for the cadence and the licences. */
  weekNote: string | null
  /** the Memory card to show this week, or null */
  memory: MemoryCard | null
  /** W5: WHICH PAINTING THIS WEEK SHOWS – the journey home, the layoff, the holiday, or the week's
   *  own frame. One decision, taken in engine/diary.ts (`weekSceneFor`) where the priority order is
   *  written down, so no surface can derive a different answer. Derived at snapshot time from facts
   *  that already exist; adds no draw and bumps no schema. `art/weeks.ts weekSceneArtUrl` turns it
   *  into a filename. */
  scene: WeekScene
}

// --- her life off the court (engine/kidLife.ts) -------------------------------
// The three tiles of screen C's attribute grid that are about the GIRL rather than her results:
// Personality, School and Friends. The design draws all three; the engine derives all three, from
// her play style, her age and birth month, and the week's own facts. Derived at snapshot time
// exactly like `radar` and `coachMarket` – it persists nothing and bumps no schema.

/** One tile: two short lines, as the design's cells are drawn. Both are `white-space: nowrap` on
 *  screen C, so both are written to a hard 17-character budget (see TILE_LINE_MAX). */
export interface KidLifeTile {
  /** the first line – the fact ("10th grade", "Patient", "Close to Sofia") */
  lead: string
  /** the second line – what it means or how it is going ("Oldest in class", "And stubborn") */
  note: string
}

export interface KidLife {
  /** her play style, read as a person and never as tennis. Fixed for the career. */
  personality: KidLifeTile
  /** her grade, on a 1-September school year, plus her place in the class by age. Moves once a
   *  year, and says "Exams this week" while the calendar is holding an exam blackout. */
  school: KidLifeTile
  /** who she is closest to this school year, and how that is going this week. Deterministic
   *  (purpose-scoped sub-streams, never Math.random), and it moves with both clocks. */
  friends: KidLifeTile
}

// --- the skills radar (docs/specs/skills-radar.md, decisions.md #11) ----------
// ONE AXIS OF THE FOG-OF-WAR CONTOUR, and the whole of what the UI is ever told about her build.
// NOT ONE FIELD HERE IS A TRUE VALUE: `shownValue` is an estimate that is deliberately wrong while
// she is undiscovered, and the two ceiling edges are a haze over a `potential` the screen never
// receives. A surface cannot leak what it has never been given.
//
// Derived at snapshot time by engine/radar.ts, exactly like `coachMarket` – it persists nothing and
// bumps no schema. Every number is on the SAME 0..100 axis the four attributes live on.

export interface RadarAxis {
  /** which attribute – the engine's own `SkillKey`, in `SKILL_KEYS` order */
  key: SkillKey
  /** THE ESTIMATE, 0..100. At low confidence it is deliberately wrong, and wrong in a direction
   *  that is FIXED for the career (drawn once off `seed:read:<axis>`), so the contour converges
   *  instead of breathing week to week. */
  shownValue: number
  /** THE FOG: how far the estimate may be from the truth, in the same points. The true value is
   *  ALWAYS inside [shownValue - band, shownValue + band] – the band is an honest claim, not a
   *  decoration. 0 = fully discovered; `RADAR_BAND_MAX` (12) = she is a stranger. */
  band: number
  /** THE OUTER HAZE over her ceiling. The true potential always lies at or below `ceilingHi`; the
   *  width narrows with confidence toward a FLOOR (`CEILING_FLOOR_HALF`) and stops there, and the
   *  midpoint is deliberately off-centre – you learn the range, never the number. `ceilingLo` is
   *  never drawn below `shownValue` (a ceiling under where she already stands is incoherent). */
  ceilingLo: number
  ceilingHi: number
  /** the coach's sentence about this axis, or null when he has nothing to say yet. Words only –
   *  no numbers, ever (decisions.md #11: "axes without numbers"). */
  note: string | null
}

/** WHAT MOVED THIS WEEK, for the Weekly Story's Training card (screen D) – or null on a week with
 *  nothing worth saying, which is most of them.
 *
 *  ⚠ THIS IS THE SHAPE THAT EXISTS INSTEAD OF SKILL DELTAS, and the reason is the radar's, not the
 *  card's. Design D lists "Serve +8%"; a Snapshot that carried that number every week would let a
 *  player sum it from week one and reconstruct her exact build, and the fog above would be
 *  decoration. So the engine does the reading and hands over the RESULT: a wing, and a sentence.
 *  There is no number on this object and there must never be one – see engine/radar.ts
 *  (`buildTrainingRead`) for the four things that keep it from being a delta channel in prose. */
export interface TrainingRead {
  /** which wing the line is about, or null when the line is about the fog rather than about her */
  key: SkillKey | null
  /** the engine's own word for that wing (`RADAR_AXIS_LABEL`), so `ret` never reaches a player as
   *  "Ret". Null on a fog line. */
  label: string | null
  /** the coach's sentence – words only, never a digit and never an arrow with a value */
  text: string
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
   *  reflects/sets the flag, default = every coach tier but self-coached). */
  physioActive: boolean
  /** W4 – THE UNANSWERED KNOCK, or null. Non-null on exactly the weeks a decision is outstanding
   *  (`knock.choice === null`), which is the same condition `advanceWeeks` blocks on – so the dialog
   *  and the engine can never disagree about whether the career is waiting for him.
   *
   *  DERIVED, not the persisted `Knock`: the copy is assembled per snapshot (buildKnockPrompt) and
   *  the state it is assembled from lives on the world. Once he answers, this goes null while the
   *  knock itself stays live for its weeks – there is nothing left to ask. */
  knockPrompt: KnockPrompt | null
  /** W4: the knock that is LIVE this week, decided or not – what the week is being spent under.
   *  Null on a week with nothing wrong. The UI reads `choice` off this to say "resting the ankle"
   *  rather than re-deriving anything. */
  knock: Knock | null
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
  /** the engine's own per-tier entry verdict - see TierOpenMap */
  tierOpen: TierOpenMap
  /** WHO SHE TRAINS WITH (v23): the roster coach's id, or null for the parent on the court. */
  coachId: string | null
  /** THE COACH MARKET (screen T): every coach, priced and read for her. Derived, never stored. */
  coachMarket: CoachMarketRow[]
  /** What the coach costs over a season with tournament weeks OFF and ON, so the toggle can be
   *  priced rather than guessed. The weekly rate is the same either way; the week COUNT differs. */
  coachBilling: {
    onEventWeeks: boolean
    weeklyCents: number
    /** weeks of the current season she is entered for */
    eventWeeks: number
    seasonOffCents: number
    seasonOnCents: number
  }
  /** season planner (schema v13): booked vacation weeks from the current week onward. The
   *  calendar renders them by package name; a booked week is a hard blackout for entries. */
  vacations: VacationBooking[]
  /** season planner (schema v13): booked practice-match weeks from the current week onward. */
  practices: PracticeBooking[]
  /** an active resort/elite recovery buff, or null. Surfaced so the UI can show that the
   *  expensive package is still working. */
  recoveryBuff: RecoveryBuff | null
  /** her academy scholarship, or null when nobody is backing her (schema v21). Surfaced because
   *  every travel figure the planner quotes is already net of it, and a smaller number with no
   *  explanation is worse than no discount at all. */
  academy: SnapshotAcademy | null
  /** the kid's current dense rank among the cohort + kid */
  kidRank: number
  /** the kid's rank at the start of the last resolved week; null before any tick (schema v7) */
  prevKidRank: number | null
  /** top 10 + 5 around the kid, deduped, rank order. THE ITF TABLE - an alias of `ladders.itf`. */
  standings: StandingRow[]
  /** the kid's counted best-6 results (round-5 item 1b), strongest first. THE ITF TABLE - an alias of
   *  `ladders.itf.countingResults`. */
  countingResults: CountingResult[]
  /** BOTH TABLES (docs/specs/two-ladders.md). `kidRank`, `standings` and `countingResults` above are
   *  the ITF ones and remain as aliases of `ladders.itf`, so nothing that already reads them changes;
   *  a test pins the aliasing, because two names for one fact is precisely how the rank bug began. */
  ladders: LadderViews
  /** WHICH TABLE SHE IS ACTUALLY COMPETING IN, decided by the engine (`activeLadderOf`) so the screens
   *  cannot answer it three different ways: the international one once she holds a counting result in
   *  it, her national one before that. A screen showing "her rank" with no further question asked
   *  should show THIS ladder's. */
  activeLadder: LadderTrack
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
  /** HER LIFE OFF THE COURT: the Personality / School / Friends tiles of screen C, derived in
   *  engine/kidLife.ts from her play style, her age and birth month, and the week's facts. Derived
   *  at snapshot time, persists nothing, bumps no schema. */
  life: KidLife
  /** THE SKILLS RADAR: four axes, always in `SKILL_KEYS` order (serve, ret, composure, stamina).
   *  An ESTIMATE of her build and a haze over her ceiling – never the truth, which stays in the
   *  engine. Derived at snapshot time, persists nothing, bumps no schema. See RadarAxis. */
  radar: RadarAxis[]
  /** THE WEEKLY STORY'S TRAINING LINE: what came along this week, in words, or null for a quiet
   *  week. The same fog as `radar`, one step further on – see TrainingRead. */
  trainingRead: TrainingRead | null
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
  | { id: number; type: 'hireCoach'; coachId: string | null }
  | { id: number; type: 'setCoachOnEventWeeks'; on: boolean }
  | { id: number; type: 'cancelPractice'; week: number }
  | { id: number; type: 'setPlan'; plan: WeekPlan }
  // W4: answer the knock. The ONLY way an undecided knock clears, and the only way time moves again.
  | { id: number; type: 'decideKnock'; choice: KnockChoice }
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
