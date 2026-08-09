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
  /** 'facility' (v44, docs/specs/split-the-bill-2026-08.md) is the COURT half of the weekly training
   *  bill, split off 'coaching' so the family can read what it is paying for.
   *
   *  ⚠ IT IS A SPLIT, NOT A NEW CHARGE. `ECONOMY.coach.hourlyRateCents` has always priced every rung
   *  INCLUSIVE of court rental – the recorded decision this reverses is coach-tiers.md §3 – so the
   *  two lines are a partition of a total that did not move: `coaching + facility` this week equals
   *  what `coaching` alone was charged before. Its sharpest consequence is that a SELF-COACHED family
   *  now books nothing under 'coaching' at all, which is the honest reading of a parent who works
   *  free: what it was being billed for was always the court.
   *
   *  ⚠ AND AN OLD SAVE HAS NO ROWS OF IT, BY CONSTRUCTION. `byCategory` is a partial record and the
   *  migration back-fills nothing (see migrations.ts v43 -> v44): a career loaded from v43 keeps its
   *  history under 'coaching' and starts splitting from the next tick, so the ledger stays truthful
   *  about what it actually charged rather than being retconned. */
  | 'facility'
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
  /** 'prize' (task #17) is an INCOME-side category: what a tournament pays her, off the finishing
   *  tier's own `prizeCents` table. THE ONLY INCOME THE TENNIS ITSELF PRODUCES – every other income
   *  category in this union is somebody deciding to fund her (a parent, a shop, an academy) or a
   *  bank paying interest on what is left. It exists only on the adult rungs: the junior tour pays
   *  nothing, ever, which is the real rule and the whole thesis of the game.
   *
   *  ⚠ It is also the one category that is NOT priced by the wealth corridor, so the Money breakdown
   *  shows a working family and a wealthy one exactly the same figure for exactly the same week. See
   *  TierDef.prizeCents. */
  | 'prize'
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
  /** W2-ENDINGS: the story has no next week. It outranks everything because its surface REPLACES
   *  the app shell rather than laying a dialog over it – there is nothing behind an epilogue left
   *  to stop for. `advanceWeeks` refuses to tick at all while it is latched. */
  | 'ending'
  /** W2-ENDINGS: SHE IS NINETEEN AND THE FORK IS OPEN (contract §4 #1/#2). Blocks like a knock and
   *  for a stronger reason – two of its three answers end the career. */
  | 'fork'
  /** W2-ENDINGS: the natural end has asked her and she has not answered (contract §5.3). Blocks
   *  like the fork; an off-season question a player can tick past is not a decision. */
  | 'retirement'

/** R11-1: the order the UI must SURFACE a week's stop reasons in, and the order `advanceWeeks`
 *  returns them in. One advance can stop for SEVERAL true reasons at once (the owner's lost injury
 *  popup: a fresh injury landing on the season wrap-up week was reported as 'season-end' alone, so
 *  neither the injury dialog nor a toast ever appeared and the auto-withdrawals happened in
 *  silence). Medical events rank FIRST precisely because they may never be swallowed by a stop that
 *  can wait a click: they cost her entries and money the moment they land. */
export const STOP_PRECEDENCE: readonly StopReason[] = [
  // W2-ENDINGS: FIRST, above even the medical trio, because it is not a stop at all in the sense
  // the rest of this list is. The others halt a week and hand it back to the tab shell; this one
  // says the shell is over. Nothing below it has a surface left to render into.
  'ending',
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
  // W2-ENDINGS. The fork and the natural end's offer sit here, below the knock and above everything
  // that owns a dismissable toast, because they BLOCK: `advanceWeeks` refuses to restart until they
  // are answered. They are below the medical trio for the trio's own reason – those have already
  // cost her money by the time they fire, and a question has not cost anything yet. They can
  // co-occur with 'season-end' (the retirement offer is raised on the wrap week by construction) and
  // with 'funds', which is exactly the ordering these two lines decide.
  'fork',
  'retirement',
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
  /** THREE ANSWERS, not two: a finish ("Semifinalist"), "no result that scored" (she entered and
   *  nothing counted – her result row is award-only, so the ledger has nothing to invert), or
   *  "no tournaments played" (she genuinely did not play). The middle one arrived with
   *  fix/wallet-and-wrapup, which moved this fold off the count-capped event feed and onto
   *  `world.results`; collapsing the first two was how a 44-19 season came to report the third. */
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
  /** WHICH TABLE THIS SEASON WAS PLAYED ON – the track that carried the most competitive matches
   *  (`dominantTrackOfSeason`, engine/world/milestones.ts), falling back to `activeLadderOf` for a
   *  season she did not play at all.
   *
   *  ⚠ IT EXISTS BECAUSE THE WRAP-UP NAMED THE JUNIOR TABLE FOR EVER (fix/wallet-and-wrapup, on the
   *  owner's «на том же экране всегда показывается international, хотя мы уже давно там не
   *  играем»). The rank line was pinned to `LADDER_LABEL.itf` in 79567f9, when a career had two
   *  tables and the junior one was the destination; the professional table landed the next day and
   *  nothing widened it, so a W75 player with no junior point in the 52-week window read "Unranked
   *  – she has not played a Junior Tour event yet".
   *
   *  OPTIONAL, and readers fall back to the junior table exactly as before – the `weeksInjured`
   *  precedent, so no schema bump: a summary banked before this wave never knew its own track. */
  rankTrack?: LadderTrack
  /** Her dense place in `rankTrack` at the wrap, or null when she holds no counting result in it.
   *
   *  ⚠ NOT THE SAME NUMBER AS `endRank`, which is and stays the ITF one (`world.kidRank`) so the
   *  season-history table it also feeds keeps meaning one thing down its whole column. null follows
   *  `LadderView.rank`: unranked is not a number, and a dense place inside the 0-point tie group is
   *  what that rule exists to refuse to print. Same optionality as `rankTrack`. */
  rankInTrack?: number | null
  /** WHAT THE SEASON COULD NOT DO – the entries it spent on rungs whose title could not have entered
   *  her book (schema v45, docs/specs/season-mirror-2026-08.md).
   *
   *  ⚠ IT EXISTS BECAUSE THE LADDER FLOOR GREW A DECISION WHOSE WRONG ANSWER IS INVISIBLE. With the
   *  lower bound gone (`ladder-floor-2026-08.md`, the owner's ruling of 08.08) a rung she has outgrown
   *  is enterable, which is correct – but `human-arm-forward-2026-08.md` then measured a season paying
   *  10.3 entries into rungs that cannot move her, with **six of nine axes still inside the human
   *  envelope**: the matches, the win rate and the money all look like a career that is working. The
   *  coach already says the same thing on the card (`coachLadderNote`), about 1,150 times a career,
   *  which is background rather than signal. This is the season's own count of it.
   *
   *  ⚠ CAPTURED AT ENTRY, NEVER RECONSTRUCTED, and that is the whole reason it is persisted state
   *  rather than a fold. The judgement is «could a title here have entered the book SHE HELD THAT
   *  WEEK», and the book at week W is her results over [W-52, W] – rows `pruneResults` has already
   *  deleted by the wrap. Two ledgers have produced a wrong wrap-up line here for exactly this reason
   *  (`bestResultText` off the 400-row event feed; the season money off the same feed), so this one is
   *  counted in the branch that commits the entry and read at the wrap.
   *
   *  OPTIONAL, AND ABSENT MEANS ABSENT. A migration cannot back-fill a judgement made at a week whose
   *  evidence is gone, so a season that began before the counter did carries no pair at all and the
   *  card shows no line – which is honest, where a 0 would read as "none of them". */
  entryMirror?: SeasonEntryMirror
}

/** The pair the wrap-up prints: how many tournaments the season entered, and how many of those were
 *  entered into a book that could not have taken their title.
 *
 *  ⚠ BOTH NUMBERS COME FROM ONE LEDGER, WHICH IS THE POINT OF PUTTING THEM IN ONE OBJECT. The
 *  denominator cannot be counted off `world.results` – a result row is AWARD-ONLY, so a season of lost
 *  openers leaves no row (see `seasonBestFinish`) – and it cannot be counted off `world.events`, which
 *  is capped at 400 rows. Counting both at the same commit is what stops the line from being a ratio
 *  of two different seasons. */
export interface SeasonEntryMirror {
  /** tournaments entered during the season and PAID FOR. The count follows the fee: a withdrawal
   *  inside the deadline hands the money back and is un-counted with it, every forfeiting exit (a
   *  late cancel, a skip, a medical forfeit) keeps its entry – the same rule `releaseEntry` already
   *  applies to the ITF participation slot. */
  entered: number
  /** ...of those, how many could not have moved her on the table this card names. See
   *  `entryCouldNotMove` in engine/world/ladder.ts for the rule and the measurement that chose it. */
  couldNotMove: number
}

/** THE PERSISTED HALF: the season's entry ledger, written at the entry choke point and reset by the
 *  wrap-up (schema v45). `SeasonEntryMirror` above is what the wrap BANKS out of this.
 *
 *  ⚠ IDS AND NOT TWO COUNTERS, and the reason is a measured off-by-a-season. The count follows the
 *  fee, so a refunding withdrawal has to un-count its entry – and an entry taken in week 45 of one
 *  season can be withdrawn in week 2 of the next, after the wrap has already banked and reset. Two
 *  bare integers would then decrement a season that never counted that entry. The id says which
 *  season's ledger owns the row, so the wrong one cannot be debited.
 *
 *  ⚠ AND `closed` IS A SUBSET OF `entered`, WRITTEN AT THE SAME MOMENT rather than re-derived on the
 *  way out. `bookClosedTo` at withdrawal time would answer about a book that has since moved, which is
 *  the recomputation this whole field exists to avoid.
 *
 *  Bounded by construction: one entry per week is a rule (`enterEvent`), and the ledger resets every
 *  52 weeks, so neither array can exceed a season's worth of ids. */
export interface SeasonEntryLedger {
  /** the week the ledger began counting. The wrap prints its pair only when this is at or before the
   *  season's first week – a ledger that started mid-season describes part of a season, and a part is
   *  not a statistic. */
  fromWeek: number
  /** one row per entry committed since `fromWeek` and not refunded. */
  rows: SeasonEntryRow[]
}

/** ONE ENTRY, AS THE WEEK IT WAS MADE SAW IT.
 *
 *  ⚠ THE SPLIT BETWEEN WHAT IS CAPTURED AND WHAT IS FOLDED IS THE WHOLE DESIGN, and it is a fix for a
 *  contradiction found in the browser. Two of these three facts are about her BOOK, which
 *  `pruneResults` deletes 52 weeks later, so they must be captured. The third – which table the rung
 *  pays into – is a property of the calendar and never decays, so it is stored raw and compared at the
 *  wrap against `SeasonSummary.rankTrack`, the table the card itself names two rows above the line.
 *
 *  Judging the table at ENTRY time instead (against `activeLadderOf`) printed a card reading
 *  «Final national rank #3» over «13 could not move her ranking», where all thirteen were the domestic
 *  events that had made her third. One card, two tables, and the reader is right and the card is
 *  wrong – which is the same defect the wrap-up's junior-rank line was, arriving through a new door. */
export interface SeasonEntryRow {
  id: string
  /** which table this rung pays into. Durable: a property of the tier, not of her. */
  track: LadderTrack
  /** CAPTURED: she had already climbed past the rung when she entered (`hasOutgrown`). */
  outgrown: boolean
  /** CAPTURED: her best-N book on that rung's own table was shut to its title (`bookClosedTo`) – the
   *  window was full and its weakest counted row already paid at least what winning would pay. */
  bookShut: boolean
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
  /** W7 – WHAT THE SEASON COST, gross, in positive cents. The owner: «было бы очень интересно где-то
   *  хранить всю историю затрат за карьеру по годам в каком-то виде.»
   *
   *  ⚠ THE NET WAS ALREADY HERE AND IT IS NOT THE SAME QUESTION. `fundsDeltaCents` answers "did the
   *  family end the year up or down", which a season of big prize money and bigger bills can report
   *  as a shrug. He asked about ЗАТРАТЫ – what it cost to keep her playing – and gross spend is the
   *  only number that says it. Both are kept because both are true and neither implies the other.
   *
   *  ⚠ AND IT HAD TO BE BANKED HERE OR IT WAS GONE FOR EVER. The per-category ledger
   *  (`WorldState.financeWeeks`) is pruned to a 60-week trailing window, so a career keeps roughly
   *  1.15 YEARS of spending detail and nothing older – season 1's spend is unrecoverable by the time
   *  season 3 opens, from the save and from anywhere else. `maybeFireSeasonWrapUp` was already
   *  computing this exact figure off that ledger at the wrap-up (when the whole season is still
   *  inside the window) and dropping it into `lastSeasonSummary`, which is overwritten every year.
   *  Banking it costs two numbers a season against a 30-season cap.
   *
   *  OPTIONAL, AND THE OPTIONALITY IS LOAD-BEARING: rows written before v28 have no gross figure and
   *  none can be invented for them, so the surface that reads this must print silence rather than a
   *  zero. Same contract as `bestFinish` above and `SeasonSummary.spentCents`.
   *
   *  BOUNDARY, stated once so both readers agree: the window ENDS at the wrap-up week, so the
   *  season's last two off-season weeks are not in it. That is deliberate and is the same window
   *  `SeasonSummary` reports – the figure describes the season she PLAYED. */
  spentCents?: number
  /** what the season brought in, gross, in positive cents. Same window, same optionality, and it is
   *  here so a year can be read as a pair: a season that cost $9k and earned $4k is a different
   *  story from one that cost $9k and earned nothing, and `fundsDeltaCents` alone tells neither. */
  earnedCents?: number
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

/** One rung's remaining supply this season. `open` counts events she may still enter (her own
 *  entries included); `entered` is how many of those are already hers. */
export interface SeasonSupplyRow {
  tier: TierId
  open: number
  entered: number
}

/** THE PLANNING COUNTER: how much tennis is left this season, and on which rungs. Ladder order,
 *  rungs with nothing left omitted entirely - the list is what she can still do, not a table of
 *  zeroes. */
export interface SeasonSupply {
  /** weeks between now and the season's last week (the off-season is inside the count, because it
   *  is inside the season block - a card that says "over 12 weeks" must not promise playable ones) */
  weeksLeft: number
  rows: SeasonSupplyRow[]
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
  /** why the kid HARD-cannot enter, for the UI lock label; absent when eligible. Point-band reason:
   *  'locked' = not enough ranking points yet (below the tier's minPoints), or below an acceptance
   *  cut. ⚠ 'outgrown' LEFT THIS UNION on 06.08 and is `outgrown` below – a rung she has passed no
   *  longer refuses her. Hard availability blocks (Season-Life slice B, checked after the point band):
   *  'unavailable' = school exams / off-season / a booked family vacation; 'injured' = she is out;
   *  'medical' = the doctor's veto below ECONOMY.availability.medicalFloor (the one hard body-gate
   *  – see availabilityStatus). Ordinary fatigue is NOT here – it is a soft, warned CHOICE (see
   *  cautionReason), so a fatigued event stays eligible.
   *  'capped' = she has spent her year's allowance of INTERNATIONAL entries (the ITF annual entry
   *  cap, docs/research/ranking-points-by-tier.md §2) – a hard block, but one that lifts by itself
   *  when the season turns, which is why it is its own reason and not folded into 'unavailable'. */
  ineligibleReason?: 'locked' | 'injured' | 'unavailable' | 'medical' | 'capped'
  /** SHE HAS PASSED THIS RUNG – and it is not a lock (the owner's ruling on backlog #84, 06.08,
   *  quoted verbatim in docs/specs/ladder-floor-2026-08.md: no lower bound at all, let her play, and
   *  lead with the more relevant tournament of the week when there is one). 'outgrown' used to be an
   *  `ineligibleReason` above and is deliberately no longer in
   *  that union: it is orthogonal to whether she may enter, so the compiler is what stops a surface
   *  from reading it as a refusal again. An outgrown card is ENTERABLE, says so, and loses the week's
   *  slot to any rung she has not passed – see `preferredWeekEvent`. */
  outgrown?: boolean
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
 *  parent would use; nothing in the UI says "domestic", "ITF" or "track".
 *
 *  ⚠ THE THIRD ONE IS "PROFESSIONAL", NOT "WTA" AND NOT "WORLD TOUR". Two acronyms were available and
 *  both are engine vocabulary wearing a tour's logo – a parent watching her daughter does not say
 *  "her WTA ranking", she says the girl has turned professional. It is also the only word that tells
 *  the third table apart from the second on the axis the player actually feels: a W15 is every bit as
 *  INTERNATIONAL as a J30 (same flights, same passport, same two weeks away), so naming it by
 *  geography would have produced two tables called almost the same thing. The break at this table is
 *  junior/professional, and the label says so. */
export const LADDER_LABEL: Record<LadderTrack, string> = {
  domestic: 'National',
  itf: 'International',
  wta: 'Professional',
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

/** WHICH TABLE HOME'S RANK CHIP NAMES - or null for NO CHIP AT ALL (architect's ruling, 02.08, on
 *  the owner's «нужна ли она там вообще?»).
 *
 *  The chip is her current WORKING track, which is `activeLadder` (the engine's one answer - see
 *  `activeLadderOf`: professional once any W result has ever counted, and from that moment
 *  PERMANENTLY; junior while she holds a counting J result; national before either). What this
 *  helper adds is only the empty case: before her first counting result in ANY table there is no
 *  place to report, and a chip reading "Unranked" over a brand-new career is a readout with nothing
 *  to read - so it is not drawn at all.
 *
 *  ⚠ THE PROFESSIONAL ARM RETURNS EVEN WHEN `rank` IS NULL. "She is a professional now" is decided
 *  once and outlives any 52-week drought that empties her live window; on such a week the chip
 *  honestly reads Professional + Unranked rather than pretending she is a junior again. A pure
 *  selection over snapshot fields - no rank is re-derived here (the engine owns all three). */
export function rankChipTrack(
  snap: Pick<Snapshot, 'ladders' | 'activeLadder'> | null | undefined,
): LadderTrack | null {
  if (!snap) return null
  const track = snap.activeLadder
  if (track === 'wta') return 'wta'
  return snap.ladders[track].rank !== null ? track : null
}

/** The unit each table's points are counted in, for a label that has to name the currency (the Home
 *  ladder's entry thresholds are all denominated in NATIONAL points - see engine/season/calendar.ts,
 *  whose own ladder diagram is drawn against "domestic pts"). */
export const LADDER_POINTS_LABEL: Record<LadderTrack, string> = {
  domestic: 'national pts',
  itf: 'international pts',
  // ⚠ AND THIS IS THE UNIT THE PLAYER MUST NOT ADD TO THE OTHER TWO. It is the smallest-looking
  // number on any of the three tables – a W15 title pays 10 where a J300 title pays 300 – and it is
  // the one that means she is a professional. Naming the currency on every figure is what stops the
  // Stats screen reading like a demotion the week she steps up (see LadderTrack in season/types.ts).
  wta: 'professional pts',
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
 *  happen; a dozen rows per career, so the ledger needs no pruning.
 *
 *  ⚠ `prize` joined in round 15 (owner, 01.08: «я believe it's a very memorable moment») – the week
 *  the tennis first PAID her, which on this ladder means her first W-family finish deep enough to
 *  cash. No schema bump: the milestones array is opaque to the migration ladder (rows pass through
 *  untouched), so widening the union is a new capture, not a new shape. */
export type MilestoneType =
  | 'title'
  | 'final'
  | 'prize'
  | 'international'
  | 'injury'
  | 'season-rank'
  /** ⚠ THE TURN, AND IT CANNOT BE RECONSTRUCTED AT THE END (contract §9.4). Slot 6 of the album is
   *  the week her cumulative prize money first passed her cumulative costs – the break-even the
   *  whole game is about. The finance ledger keeps SIXTY WEEKS, and the crossing may happen in
   *  season seven, so by the time the epilogue asks, the arithmetic behind the answer has been
   *  pruned out of the save. It has to be captured the week it happens or the album's central page
   *  is empty for everybody who earned it. Career-total counters (`careerTotals`, v39) are what
   *  make the test cheap enough to run every week. */
  | 'break-even'
  /** ⚠ W4-SCHOOL: THE LAST DAY OF SCHOOL, and it is here because the owner's ruling on how this game
   *  tells a story requires it. School ending is a thing that happens to a family, and a flag that
   *  flipped silently between two weeks would be the wrong shape for it: «Школа должна когда-то
   *  закончиться». Captured the week it happens, back-filled by the v43 migration for every career
   *  already past it - his own is twenty-two - so the scroll never has a hole where a life changed. */
  | 'school'

/** One captured milestone. Deliberately tiny: type + week + the minimal payload its memory line
 *  needs. Identity (for idempotent capture) is `milestoneKey` in engine/diary.ts. */
export interface Milestone {
  type: MilestoneType
  /** the absolute career week it happened */
  week: number
  /** title/final: the tier it happened at. international: the tier of the first entry (absent on
   *  a migrated save that only knows the week). prize: the tier that paid her first cheque. */
  tier?: TierId
  /** injury: the injury kind, e.g. "ankle soreness" */
  kind?: string
  /** season-rank: the season it closed */
  seasonIndex?: number
  /** season-rank: her rank at that season's wrap-up */
  rank?: number
}

// --- THE TITLES LEDGER (schema v31, the Trophy Cabinet) ----------------------------------------

/** Every gold and every silver she has ever taken at ONE tier, as the WEEKS they happened in.
 *
 *  ⚠ `finals` MEANS SHE LOST THE FINAL, and it is the one thing about this shape that has to be
 *  read carefully, because the game already has a second, incompatible sense of the word.
 *  `MilestoneType: 'final'` means SHE REACHED a final, so a title captures it too (`kidFinish <= 1`
 *  in finalizeTournament) - correct for a memory ledger, where "the first final she ever played" is
 *  the moment worth remembering. This ledger counts OBJECTS IN A CABINET: a runner-up plate and a
 *  winner's trophy are two different pieces of silverware and one week produces exactly one of
 *  them. If `finals` included titles, the silver plate would light up the first time she WON
 *  something, and its count would read "5" for a tier she never actually lost a final at. So the
 *  two arrays are disjoint by construction (`=== 0` and `=== 1`, never `<= 1`) and runner-up is
 *  countable on its own, which is the only way the silver half of the screen can be honest.
 *
 *  WEEKS, NOT COUNTS, and not years either. A count could not answer "in which years", which is
 *  half of what the owner asked the screen to say; a YEAR could not be recomputed if the season
 *  arithmetic ever moves, and it would freeze into the save a display decision that belongs to the
 *  reader. The absolute career week is the engine's own unit for everything else it persists, so it
 *  is what gets stored, and the screen derives the year with `seasonYear(Math.floor(week / 52))`.
 *
 *  ⚠ NOT `weekYear(week)` - that is the real calendar year of that week's Monday, and it COLLIDES:
 *  a season is 364 days, so the opening Monday drifts back a day and a quarter a year and
 *  `weekYear(208) === weekYear(260) === 2035`. Two consecutive seasons would print as the same
 *  year and their trophies would merge into one group. That exact collision already ate a season
 *  out of the Stats history table once (see `seasonYear` in shared/dates.ts and the v16 migration).
 *
 *  Append-only and bounded by how many tournaments a career can play, so it is never pruned - which
 *  is the whole reason it exists. Ordered by construction: `finalizeTournament` pushes as weeks
 *  happen, so both arrays are ascending and the screen can group without sorting. */
export interface TierTrophies {
  /** the weeks she WON this tier. `kidFinish === 0`. */
  titles: number[]
  /** the weeks she LOST A FINAL at this tier. `kidFinish === 1` - never a title. */
  finals: number[]
}

// --- THE INBOX (schema v32) --------------------------------------------------------------------
// docs/specs/offers-and-the-inbox.md §2. One durable list on the world: the letters somebody has
// written to this family, and what the parent did about each one.
//
// ⚠ THIS SLICE CARRIES THE KIT SPONSOR AND NOTHING ELSE, on the spec's own build order (§6): it is
// the smallest step that proves the whole shape - arrival, deadline, sign, refuse, expiry - against
// a number that is already balanced. The agent (§4.2) and the investor (§4.3) are later slices and
// deliberately have no representation here yet; `OfferKind` is a union of one so that adding them is
// a widening rather than a redesign.

/** Which instrument wrote. `kit` is the sponsor; `entry` is THE TOURNAMENT DESK (W2-LADDER §6,
 *  owner ruling 1: «у нас уже система писем есть для этого, надо использовать») - the letter that
 *  arrives when she registers for a professional event, and the short confirmation when she
 *  cancels in time. The agent (§4.2) and the investor (§4.3) still have no representation. */
export type OfferKind = 'kit' | 'entry' | 'tour'

/** WHICH RULE A PENALTY WAS (W3-ACT2, act2-pro-tour.md §6). A closed union, and it is closed on
 *  purpose: «мы ни за что не наказываем» means every charge has to be nameable, so a row that could
 *  not say which rule it came from would be exactly the thing the ruling forbids.
 *
 *  `conduct` is DECLARED AND NOT YET WRITTEN. §6 lists on-court conduct as a penalty source «once
 *  psyche (v38) exists» - the anger system finally getting a price tag - and psyche is its own wave.
 *  Naming it here costs nothing and means that wave widens a union rather than redesigning one, the
 *  same courtesy `OfferKind` was built with. */
export type PenaltyReason =
  /** she never entered a mandatory event her standing obliged her to play */
  | 'skip'
  /** she pulled out after the entry list closed - the draw was published with her in it */
  | 'late-withdrawal'
  /** she was in the draw on the day and did not appear */
  | 'no-show'
  /** she finished the season short of the 500-level commitment */
  | 'quota'
  /** reserved: on-court conduct, when psyche ships (§6) */
  | 'conduct'

/** ONE PENALTY, as the tour charged it. Persisted (schema v38, `WorldState.penalties`). */
export interface PenaltyRow {
  /** the absolute week it was charged in - the unit the rolling 52-week window counts */
  week: number
  points: number
  reason: PenaltyReason
  /** the event it was about, where there was one. Absent on the season-end quota row. */
  eventId?: string
  /** true once this row has been spent on a suspension, so the same ten points cannot buy a second
   *  one the following week. The row STAYS in the ledger - it is a record of what she was charged
   *  for, and a career should be able to read its own history back. */
  spent?: boolean
}

/** WHAT A TOUR LETTER SAYS. The desk's third voice: `entry` letters are receipts for something she
 *  did, `kit` letters are a brand's, and these are the REGIME's - the warning that an obligation is
 *  about to fall due, the notice that one was missed and what it cost, and the suspension notice.
 *
 *  ⚠ THE WARNING ARRIVES AT THE ENTRY DEADLINE, A WEEK BEFORE THE EVENT, which is the whole of
 *  «every obligation is announced in a letter BEFORE it can bite». A letter that only ever arrived
 *  after the fact would be a receipt for a punishment, which is the thing the ruling is against. */
export interface TourLetterTerms {
  /** which of the three this is */
  notice: 'due' | 'penalty' | 'suspension'
  /** the rung and its label as the letter was written */
  tier?: TierId
  label?: string
  /** the week she is expected on court (a `due` letter), and the last week to enter free */
  eventWeek?: number
  freeUntilWeek?: number
  /** what it cost, and which rule (a `penalty` letter) */
  points?: number
  reason?: PenaltyReason
  /** her running total inside the rolling window, and the number that triggers a suspension - both
   *  quoted on the paper so the player never has to find them on a screen */
  runningPoints?: number
  suspensionAt?: number
  /** the last week of a suspension, inclusive (a `suspension` letter) */
  untilWeek?: number
}

/** Where an offer is in its life. `open` is the only state a decision is possible in; the others
 *  are terminal and the letter stays in the inbox as a record.
 *
 *  ⚠ `info` IS THE INFORMATIONAL LETTER'S STATE (W2-LADDER §6): a tournament-desk letter is not a
 *  decision - there is nothing to sign and nothing to refuse - so it is born terminal. It never
 *  lights the inbox dot (`isOfferLive` reads `open` only), never enters `offerAnswerError`'s happy
 *  path, and expiry means nothing to it. The obligations it announces get their TEETH in act 3
 *  (§6's penalty regime); in this wave the letter is the transparency itself. */
export type OfferState = 'open' | 'signed' | 'refused' | 'expired' | 'info'

/** WHOSE LETTERHEAD IS ON THE PAPER. The brand ladder a sponsor climbs: the shop in her town, a
 *  national label, a global one. `public/images/sponsors/<tier>.webp` is the mark, looked up by this
 *  key and by nothing else.
 *
 *  ⚠ THE RUNG SAYS WHICH OF HER LINES THE DEAL COVERS, AND THAT IS THE WHOLE LADDER (01.08,
 *  feat/brand-ladder). It is deliberately NOT a prestige number, because a prestige number would be
 *  a new stat the game would then have to explain. Main carries gear condition - strings, frame,
 *  shoes, each feeding the match attributes - so "how many of my lines are covered" is a sentence
 *  the player can already read off a screen he has:
 *
 *    local     strings only. The most frequent line and the truest lever (ECONOMY.equipment: the
 *              string bed dwarfs the frame), but frames and shoes stay hers.
 *    national  strings and frames.
 *    global    everything, and a hand with the travel.
 *
 *  AND IT IS READ OFF THE ARTWORK RATHER THAN INVENTED HERE, which is the same rule
 *  `ECONOMY.sponsorship.localBrand` already keeps. The three marks shipped before this slice did:
 *  local.webp says "STRING HOUSE – LOCAL. HONEST. TIGHT.", national.webp says "NETRALLY
 *  DISTRIBUTION – STRINGS. FRAMES. NATIONWIDE." and global.webp says "PLAY BEYOND – EQUIP. SUPPORT.
 *  ELEVATE.". The coverage ladder is written on the pictures; this type only names it. */
export type SponsorTier = 'local' | 'national' | 'global' | 'tour' | 'premium' | 'icon'

/** THE THREE PROFESSIONAL RUNGS (W3-ACT2, act2-pro-tour.md section 7 - the owner's «да, надо
 *  продумать, предложи что-то», built). They are gated on the WTA rank, which is exactly as real as
 *  the two tables the rungs below read, and what they add is a KIND of money the junior ladder never
 *  had:
 *
 *    tour     WTA <= 200   full kit + a quarterly cash RETAINER + result bonuses from W75 up
 *    premium  WTA <= 50    retainer x5, APPEARANCE FEES (events that pay her to come, real at 250+),
 *                          and a bonus schedule that reaches the Slam rounds
 *    icon     WTA <= 10    the multi-year guarantee - the biggest retainer, the widest bonus, and a
 *                          term long enough to be an epilogue rather than a season
 *
 *  THE SECTION-7 QUESTION IS ANSWERED HERE, AND THE ANSWER IS "ONE LADDER, ORDERED BY GATE". The
 *  spec left it open («either `tour` replaces `global` for professionals, or the two ladders run side
 *  by side with one deal at a time across both - an owner's call at build time»), and W2-FIELD2
 *  settled it by moving the numbers: `global.maxWtaRank` went 31 -> 87 and `national`'s 125 -> 350
 *  when the W cuts were re-derived, so the professional gates now read
 *
 *      national 350  >  tour 200  >  global 87  >  premium 50  >  icon 10
 *
 *  which is a single monotone ladder with `tour` slotting in between the two junior-era rungs rather
 *  than colliding with either. `rungFor` reads it strongest-first and `raiseKitOffers` allows one deal
 *  at a time, so "side by side, one deal across both" is what ships - and it needed no new rule.
 *
 *  AND NONE OF IT SCALES WITH THE WEALTH CORRIDOR (the principle section 7 carries over). A
 *  retainer, an appearance fee and a result bonus are cheques somebody writes to the PLAYER, exactly
 *  like prize money, so they are identical for a working family and a wealthy one. See
 *  `prizeCentsFor`'s note, which is the same rule stated for the same reason. */

/** THE THREE LINES OF KIT the equipment model reads, and the unit the brand ladder is denominated
 *  in. `KitWear` is `Record<KitLine, number>` (engine/equipment.ts) so a fourth line - or a renamed
 *  one - cannot make the two disagree about what a deal covers. Apparel is NOT here: it is not a
 *  line the match reads, and a kit deal is not a clothing allowance. */
export type KitLine = 'strings' | 'frame' | 'shoes'

/** THE QUALITY LADDER, one rung per line, and the thing the PLAYER chooses (W3-KIT, owner: «давайте
 *  сделаем эти ручки для ракеток, обуви и прочего, чтобы пользователь мог выбирать»).
 *
 *  ⚠ FOUR RUNGS, AND THE SECOND ONE IS THE GAME AS IT SHIPPED. `composite` is exactly today's
 *  behaviour on every axis - no handicap, the service life `ECONOMY.equipment` already names, the
 *  injury factor it already produces - which is what lets a career from before this wave migrate onto
 *  it and open byte-identical. `alloy` sits BELOW it and the two above it are what money buys. See
 *  `ECONOMY.equipment.grades` for every number and for why the ladder cannot break the anti-destiny
 *  bound even in principle.
 *
 *  ⚠ AND THE ORDER IS THE LADDER'S OWN ORDER - `KIT_GRADES` (engine/equipment.ts) walks it to decide
 *  what "up" and "down" mean at the till. A rung inserted in the middle re-prices every save that
 *  holds a rung above it, so the array is the one place the sequence is written down. */
export type KitGrade = 'alloy' | 'composite' | 'performance' | 'pro'

/** Which rung she is on, per line. Persisted (schema v37) - it is a DECISION the parent took, and a
 *  decision is the one class of fact this engine never re-derives. */
export type KitGrades = Record<KitLine, KitGrade>

/** HER KIT AS THE SAVE HOLDS IT (schema v37): the rung on each line, and the week she was last put on
 *  a brand-new one of them BY CHOICE.
 *
 *  ⚠ `sinceWeek` IS NOT A SECOND PURCHASE SCHEDULE. The family's recurring gear buys stay exactly
 *  where they always were - drawn off `seed:gear:<category>`, billed by `resolveGear` - and this
 *  records only the over-the-counter purchase the PLAYER made, so that buying a frame today means she
 *  is holding a new frame today. `kitWearAt` reads whichever of the two is more recent. Zero for a
 *  line she has never bought by hand, which is what every migrated career carries and what makes the
 *  migration a no-op on wear. */
export interface KitState {
  grade: KitGrades
  sinceWeek: Record<KitLine, number>
}

/** One line of her kit, as the Money screen reads it. Derived at snapshot time from `KitState` plus
 *  `ECONOMY.equipment` - no screen re-derives a price, a rung order or a condition. */
export interface KitLineView {
  line: KitLine
  /** the rung she is on now */
  grade: KitGrade
  /** the catalogue's own name for that rung, in the game's fictional-brand voice */
  label: string
  /** one line of what it IS - the shop's blurb, not a stat sheet */
  blurb: string
  /** her CONDITION on this line right now, 0 = as new, 1 = spent (`kitWearAt`'s units) */
  wear: number
  /** what the family's recurring bill for this line costs at each rung, cents - the mid of the
   *  background's own band times the rung's price factor, so the corridor is visible at the till.
   *
   *  `payableCents` is what the FAMILY would actually hand over for that rung today, after a signed
   *  deal's allowance (08.08). It equals `priceCents` when nobody is covering the line, and the
   *  screen must print IT rather than deriving the discount itself - the till is the only authority
   *  on what a purchase costs, and until this wave the two disagreed by the whole price.
   *
   *  `goodWeeks` is what the rung BUYS, in weeks before the line reads "Worn" - the only honest unit
   *  for a model in which fresh kit is exactly neutral and wear only ever subtracts. See
   *  `goodWeeksFor`; it is not a power figure because there is no power figure to give. */
  rungs: {
    grade: KitGrade
    label: string
    blurb: string
    priceCents: number
    payableCents: number
    goodWeeks: number
    owned: boolean
  }[]
  /** true while a signed deal covers this line - the brand is supplying her, so the rung she picks
   *  changes what she is billed and almost nothing about how fresh she is (see `kitFreshCap`) */
  sponsored: boolean
}

/** THE SIGNED KIT DEAL AS THE BILLS PAGE READS IT - one running contract, or null.
 *
 * ⚠ IT EXISTS BECAUSE THE QUOTA WAS INVISIBLE (09.08, and the owner diagnosed it himself): «Списались
 * расходы на весь шмот на 38 неделе 34 года, несмотря на наличие спонсора, bills подсвечивает, что
 * всё на нём, но значки free ушли… а почему цена в bills отличается от цены в списаниях? Я понял
 * почему – видимо мы выбрали квоту.»
 *
 * `kitAllowanceCents` is a per-SEASON pot and `world/kit.ts` has always computed what is left of it,
 * but only the purchase dialog ever quoted the figure - so kit that was free last week was charged
 * this week with no warning, the "free" badges vanished unexplained, and the Bills sticker disagreed
 * with the ledger's charge. Both are the same fact seen from two sides, and the missing half is the
 * RUNNING BALANCE. Derived at snapshot time from the persisted offer, like every other view block:
 * a screen that subtracted `coveredCents` itself would be a second authority on the one number the
 * till is the authority on.
 *
 * ⚠ AND IT CARRIES THE TERM (`fromWeek` / `untilWeek` / `seasons`), which is the other half of the
 * same complaint - «Непонятно на какое количество лет спонсор контракт заключает, нигде не видно
 * этой информации». All three were persisted and none of them reached a surface. */
export interface KitDealView {
  /** whose kit she is in - see SponsorTier. */
  tier: SponsorTier
  /** the brand as it signs, frozen on the deal at arrival. */
  brand: string
  /** which of her three lines this deal pays for. */
  covers: readonly KitLine[]
  /** the season's pot, in cents - what the brand will spend on her kit before it stops. */
  allowanceCents: number
  /** ...how much of it this season has already been spent (`Offer.coveredCents`). */
  spentCents: number
  /** ...and what is left, which is the number the parent needs and never had. Never negative. */
  remainingCents: number
  /** how many seasons the contract runs for, and the two weeks that bound it. */
  seasons: number
  fromWeek: number
  untilWeek: number
  /** tournaments she owes them this season, so the obligation is legible where the money is. */
  minEventsPerSeason: number
}

/** What a kit deal actually commits both sides to. FIXED AT ARRIVAL and never re-read from
 *  `ECONOMY` afterwards, which is the rule that makes the deadline mean something: a letter held for
 *  three weeks is the same letter, and the spec's §2 warning ("terms never improve while you hold
 *  the letter") is enforced by the terms being a snapshot rather than a formula.
 *
 *  ⚠ EVERY FIELD HERE IS ON THE PAPER, and that is a hard rule rather than a nicety
 *  (spec §3): "a letter whose consequence is not on its face is a trap rather than a decision". If a
 *  term is added to this interface it has to appear in the letter's own words in the same commit. */
export interface KitOfferTerms {
  /** whose letterhead – see SponsorTier. */
  tier: SponsorTier
  /** the shop's name, as it signs the letter. */
  brand: string
  /** WHAT THE SHOP SPENDS ON HER KIT over the season, in cents. A ceiling, not a cheque: it pays her
   *  racquet, string and shoe bills as they land until this much has been spent, and the family
   *  never sees a penny of it as money. `ECONOMY.sponsorship`'s already-balanced figure. */
  kitAllowanceCents: number
  /** ...AND THE FLOOR UNDER HER KIT'S CONDITION, 0..1 in `KitWear`'s units (0 = as new, 1 = spent).
   *  A sponsored player restrings when the bed dies, not when the budget allows, so no COVERED line
   *  of her kit is allowed past this much wear while the deal runs. See `kitWearAt`.
   *
   *  ⚠ IT APPLIES TO `covers` AND TO NOTHING ELSE (01.08). Before the brand ladder there was one
   *  rung and it supplied all three lines, so a scalar cap and a per-line cap were the same object.
   *  They are not any more, and the difference IS the ladder: a local deal keeps her strings fresh
   *  and lets her frame age exactly as it always did. */
  freshCap: number
  /** ⚠ WHICH OF HER LINES THIS DEAL COVERS - the rung, as a fact rather than as a label, and the one
   *  field the whole slice turns on. It governs BOTH halves of what a sponsor does: which gear BILLS
   *  the brand picks up (`resolveGear`) and which wear lines the freshness ceiling holds down
   *  (`kitFreshCap` -> `kitWearAt`). One list, both effects, so the letter's promise and the match's
   *  arithmetic cannot drift apart.
   *
   *  Frozen at arrival like every other term: a deal signed when `local` meant one thing goes on
   *  meaning that for its whole life, which is why this is stored rather than re-derived from
   *  `tier`. */
  covers: readonly KitLine[]
  /** WHAT SHARE OF A TRIP'S FARE THE BRAND PICKS UP, 0..1. Zero for every rung that does not touch
   *  travel, which today is local and national - `junior-economics.md`: "travel sponsorship only
   *  after national/international wins", so it is the top rung's and nobody else's.
   *
   *  ⚠ IT GOES THROUGH `travelCostFor` AND NOWHERE ELSE. That function is THE definition the charge,
   *  the refund and the planner's quoted price all read; a second computation of the same discount
   *  is arbitrageable (enter at the covered price, withdraw at the full refund, repeat). */
  travelShare: number
  /** HOW MANY SEASONS IT RUNS. One for the local shop, more for the rungs above it -
   *  `02-tennis-economics.md` puts junior equipment deals at "3-4 year terms", and a term longer
   *  than a season is what makes ONE BRAND AT A TIME cost something: a deal that is still running
   *  when the better letter is written is a deal that turns it away. */
  seasons: number
  /** ⚠ THE DOMESTIC STANDING SHE HAS TO KEEP, or absent when the deal does not ask for one.
   *
   *  This is the national rung's own term and it is why it exists: domestic points buy exactly two
   *  things once the ITF tour opens, and one of them is switched off, so National is four weeks a
   *  season at $120 entry plus $400+ travel that buy nothing for a player already at the top of the
   *  domestic table. A national-tier deal gated on her place AT HOME means the domestic ladder has a
   *  job for as long as the contract does: the standings are a rolling 52-week best-6, so a season
   *  spent entirely abroad decays her domestic points to nothing, she slides out of this band, and
   *  the brand does not stay. */
  keepDomesticRank?: number
  /** WHAT SHE OWES IN RETURN: tournaments she must enter over the season for the shop to write
   *  again. A sponsor pays to be SEEN (spec §4.1), and this is the obligation that makes the deal a
   *  decision rather than a free win – the bench says playing more loses. */
  minEventsPerSeason: number
  /** THE QUARTERLY CASH RETAINER, in cents per QUARTER, or absent at the rungs that pay only in kit
   *  (W3-ACT2 section 7). The first money any sponsor has ever handed this family - every rung below
   *  pays in gear, which is the junior tour's own truth, and a professional's contract is a salary.
   *
   *  QUARTERLY AND NOT ANNUAL, because that is what the spec asks for and because it is the shape
   *  that makes it feel like a wage: four arrivals a season, on weeks she can plan against, rather
   *  than one number at the boundary that reads like the old cheque this whole system replaced.
   *
   *  IT DOES NOT SCALE WITH THE WEALTH CORRIDOR - see SponsorTier. */
  retainerCents?: number
  /** WHAT AN EVENT PAYS HER TO TURN UP, in cents, or absent below `premium`. A NEW INCOME LINE and
   *  the first one in the game that is not earned by winning: at the top of the real sport a
   *  tournament pays a name to be on its poster, and it is real from the 250s up.
   *
   *  `appearanceFromTier` is the rung it starts at, stored on the deal rather than derived so a
   *  contract signed under one catalogue keeps its own terms if the ladder is ever retuned. */
  appearanceFeeCents?: number
  appearanceFromTier?: TierId
  /** THE RESULT BONUS, as a SHARE OF THE TOURNAMENT'S OWN CHEQUE, or absent at the rungs that pay
   *  none. A share rather than a schedule of numbers, and that is deliberate: the prize table is
   *  already a per-finish curve the research doc anchored, so a bonus expressed against it inherits
   *  its shape for free and can never invert it (a semi-final bonus larger than a title one). It
   *  also means the bonus grows with the rung she is winning at without a second table to maintain.
   *
   *  `bonusFromTier` is where the schedule starts - W75 for `tour`, and the bigger rungs reach
   *  further down - stored on the deal for the same reason `appearanceFromTier` is. */
  bonusShare?: number
  bonusFromTier?: TierId
  /** ⚠ SET ONLY ON THE END-OF-DEAL LETTER (see `KitEndReason`), never on an offer. Its presence is
   *  what makes a kit letter a NOTICE rather than a proposal: no Sign/Refuse, no deadline, just the
   *  brand saying what happened and why. The rest of the terms are copied from the deal that ended
   *  so the notice can quote its own numbers - what they asked for, what she played. */
  ended?: KitEndReason
  /** end-of-deal letter only: how many events she actually entered in the season under review. */
  endedEventsPlayed?: number
}

/** What a TOURNAMENT-DESK letter states (W2-LADDER §6, the informational half of the entry
 *  lifecycle). Every field is on the paper, per the kit letter's own hard rule - and the one
 *  consequence this wave has no number for is stated as a sentence instead: «after the deadline
 *  the tournament's rules apply». The fines and penalty points those rules mean are act-3 content
 *  (§6's regime); announcing them BEFORE they can bite is this letter's whole job. */
export interface EntryLetterTerms {
  /** the rung, and its label as the letter was written (labels may be retuned; letters may not) */
  tier: TierId
  label: string
  /** the week she is expected on court */
  eventWeek: number
  /** cancellation is free (fee refunded, the year's slot returned) until the END of this week -
   *  the event's own entry deadline, restated on paper so the player plans against a date the
   *  engine actually enforces */
  freeUntilWeek: number
  /** true on the short confirmation the desk sends back when an entry ENDS before the deadline */
  cancelled?: boolean
  /** ...and WHO ended it (fix/outgrown-entry, 05.08). Absent = the parent's own withdrawal, which
   *  is what every letter written before this field meant and what `withdrawEvent`/`cancelEntry`
   *  still mean. Present = the DESK took her name off, and the letter has to say so - see
   *  `EntryReleaseReason` and the released arm of OfferLetter.vue.
   *
   *  ⚠ ADDITIVE AND OPTIONAL, SO NO SCHEMA BUMP - the same move the whole `entry` letter family
   *  shipped as (commit 2763caa left SAVE_SCHEMA_VERSION at 36 while adding the kind, the terms
   *  shape and `cancelled` itself). An old save's letters simply lack it and render exactly as they
   *  did; there is nothing to back-fill, because the reason was never recorded to recover. */
  releasedBy?: EntryReleaseReason
}

/** WHY AN ENTRY ENDED, on the letter the desk sends when it does (owner, 05.08: «моя уже 22 летняя
 *  выиграла 2 w50 подряд и ее автоматом сняли с 3-го письмом без объяснения причины – я понимаю, что
 *  она переросла, но это ощущается очень странно»).
 *
 *  ⚠ THE MISSING REASON WAS THE SMALLER HALF OF THAT BUG. The letter he was shown said «Your
 *  withdrawal ... is confirmed – in time, free of charge, and nothing is recorded against her»: a
 *  RECEIPT FOR A DECISION HE NEVER TOOK, reassuring him about consequences of a choice he had not
 *  made. Agency first, cause second - that is the order this type exists to fix. `'parent'` is the
 *  only value that keeps the old copy, because it is the only one where the old copy is true. */
export type EntryReleaseReason =
  /** she withdrew, in time and by choice – `withdrawEvent` / `cancelEntry` before the deadline */
  | 'parent'
  /** an injury layoff swallows the event week, so the desk takes her name off the list */
  | 'injury'

/** WHY A DEAL STOPPED, on the letter the brand sends when it does (owner, 04.08: «I've figured out
 *  there's no active sponsor. I believe we need to send an email with the termination message»).
 *
 *  ⚠ THE MECHANIC AND THE PAPER WERE ALREADY RIGHT - what was missing was the KNOCK. A deal that
 *  failed its terms updated the status line on the letter she signed a year ago and wrote one line
 *  into the season feed; nothing arrived, nothing lit the bell, and the first evidence the player
 *  got was gear bills he thought the brand was paying. A contract ending is news, so it comes as
 *  news. */
export type KitEndReason =
  /** she entered fewer events than the deal asked for */
  | 'events'
  /** the national rung's standing clause: she slid out of the band they signed her in */
  | 'standing'
  /** it simply ran to the end of its term, terms honoured on both sides */
  | 'term'

export type OfferTerms = KitOfferTerms | EntryLetterTerms | TourLetterTerms

/** ONE LETTER IN THE INBOX. The spec's shape (§2) plus the two bookkeeping fields a signed deal
 *  needs to be honoured for a season and then reviewed. */
export interface Offer {
  id: string
  kind: OfferKind
  /** the week it arrived, and the week it expires. Same contract as `SeasonEvent.deadlineWeek`:
   *  inside the window it can be signed or refused; past it, it is gone. */
  week: number
  deadlineWeek: number
  terms: OfferTerms
  state: OfferState
  /** the week the state left `open` – signed, refused, or the week it lapsed. Absent while open. */
  decidedWeek?: number
  /** SIGNED ONLY: the last week the deal covers. A kit deal runs from the week it is signed to the
   *  end of the LAST season it was offered for - `terms.seasons` of them, starting with the one she
   *  is about to play - and the brand reviews her in each of their off-seasons.
   *
   *  ⚠ IT IS THE SEASON AHEAD, NOT THE ONE JUST GONE (01.08). The letter now arrives in the
   *  off-season, so the deal she signs in the quiet weeks is the deal she opens the year under -
   *  which is what the owner asked for («мне кажется было бы логичным их как раз к старту сезона
   *  привязывать») and what really happens: equipment deals are negotiated in November and December
   *  and align to the calendar year. Signing early buys the last off-season weeks of fresh kit as a
   *  bonus; signing late buys the same season, minus the weeks spent thinking.
   *
   *  ⚠ AND IT ENDS ON WEEK 49 OF ITS LAST SEASON, NOT ON WEEK 51 (schema v41, feat/sponsor-window).
   *  The owner's own words: «заканчивать контракты вместе с сезоном на 49 неделе… т.е. чтобы с 50
   *  точно уже было пусто». The two weeks it gives up carry no tournament and no ranking; what they
   *  buy is a slot that is demonstrably empty while the brands' five-week window is still open, so a
   *  running contract can never turn away the letter meant to replace it. See `contractEndWeek`. */
  untilWeek?: number
  /** SIGNED ONLY: the FIRST week the deal covers (schema v41). Today, unless a contract she is still
   *  under runs past today - in which case the new one starts the week the old one stops, so the two
   *  meet exactly and leave neither an overlap nor a gap.
   *
   *  ⚠ IT EXISTS BECAUSE THE WINDOW OPENS BEFORE THE OLD CONTRACT CLOSES. Letters land from week 47
   *  and a term runs to week 49, so for three weeks a year a parent can sign the next deal while the
   *  present one is still supplying her. `decidedWeek` used to serve as the start of cover and cannot
   *  any more: it would put two deals in force in the same week, and there is at most one
   *  (`activeKitDeal`). Migrated careers take `decidedWeek`, which is exactly what they meant. */
  fromWeek?: number
  /** SIGNED ONLY: what the shop has actually spent on her kit under this deal, in cents. The one
   *  number that says what signing was worth – the same job `AcademySupport.coveredCents` does for
   *  the scholarship, and reported the same way at the season boundary. */
  coveredCents?: number
  /** SIGNED ONLY, written at the season boundary that reviewed it: how many tournaments she actually
   *  entered while the deal ran.
   *
   *  ⚠ IT IS HERE SO THE OUTCOME IS VISIBLE AFTER THE FACT (owner, 31.07: «надо при подписании
   *  прояснить, что будет, если девочка не выполнит условия, сейчас это непонятно совсем»). The
   *  letter tells him what failing the obligation costs BEFORE he signs; this is what lets the inbox
   *  tell him afterwards whether it happened, and against which number. An obligation that fails
   *  silently is the same invisibility one step later.
   *
   *  Absent while the deal is still running – it is the review's verdict, not a live counter. */
  eventsPlayed?: number
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
  /** WHICH family package that week was – the catalogue's own id, or null when she was not away (or
   *  when the booking has aged off the four-week retention and the save no longer knows).
   *
   *  ⚠ IT FEEDS COPY LICENCES NOW, which is a change of category rather than a new field: it reached
   *  the diary from the day the paintings shipped, but only `weekSceneFor` read it, so six different
   *  holidays were captioned with one sentence (owner, 31.07: «куда бы ни поехала ... week recap, ну
   *  кроме картинки»). The photo and condition pools now license on it, one line per package, and the
   *  sentences climb with `conditionGain` so a staycation cannot claim what the clinic delivers. */
  vacationPackageId: string | null
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
   *  she is coming back FROM and the state she is in: reached the final → happy, or sleepy if she is
   *  running on empty; fell short → sad, or sleepy if she was worn out anyway. Both branches are a
   *  coin weighted by her condition, and the final's sits strictly below the other one at every
   *  condition (W7). See engine/diary.ts travelHomeMoodFor. */
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

// --- HOW A CAREER ENDS (schema v39, career-contract-v1.md §4) ----------------------------------

/** THE SIX ENDINGS THE CONTRACT SIGNS OFF, and they are six FATES rather than five failures and a
 *  win (adult-tour-and-endings.md §6 call 4: «"stop" CAN be the right answer at 19»).
 *
 *  ⚠ `'natural'` AND `'plateau'` ARE ONE MECHANISM AND TWO REASONS, on purpose. §5.2 asked for the
 *  plateau «в дешёвой форме»: the natural end already offers her the question each off-season from
 *  29, and the plateau reading simply lets it ask EARLIER. So there is one offer, one answer and one
 *  latch – and the type records WHICH of the two put the question in front of her, because §5.2's
 *  closing line is "the epilogue says which of the two it was".
 *
 *  ⚠ `'college'` IS THE ONLY ONE THAT RESUMES (§5.1). It latches like the rest – the album is shown,
 *  every mutating command refuses – and then the hand-off page's single button spends four years in
 *  one tap and clears the latch. Four years amateur on a scholarship, no ranking points, and she is
 *  back at twenty-two with no ranking at all, which is what a career that entered nothing for 208
 *  weeks has by construction: every result she owned has aged out of the 52-week window. */
export type CareerEndingType =
  | 'stopped'
  | 'college'
  | 'bankruptcy'
  | 'injury'
  | 'natural'
  | 'plateau'

export interface CareerEnding {
  type: CareerEndingType
  /** the absolute career week the story stopped having a next week */
  week: number
  /** her age that week, in whole years – `kidAgeYears`, the GIRL's clock and not the career band */
  ageYears: number
  /** one short line of specifics: the layoff, the debt spell, the seasons flat. Never a verdict. */
  detail: string
  /** COLLEGE ONLY: the week she comes back. Null on the five that do not resume. */
  resumesWeek: number | null
}

export type ForkAnswer = 'continue' | 'college' | 'stop'

/** THE FORK AT NINETEEN (§4 #1/#2, adult spec B2 – "the most expensive click in the game").
 *
 *  ⚠ IT BLOCKS, exactly as an undecided knock does. A question the player can dismiss with one tap
 *  and re-press past is a notification, not a decision, and this is the one decision the whole
 *  second act hangs off. `answer === null` is the open state. */
export interface ForkState {
  askedWeek: number
  answer: ForkAnswer | null
}

/** THE NATURAL END'S OFFER (§5.3). Raised in the off-season, answered before time can move again.
 *
 *  ⚠ `final: true` IS THE FLOOR AT 38, AND THE FLOOR IS NOT A RETIREMENT RULE. 38 is the age at
 *  which the game STOPS ASKING: from 29 she may always refuse, and at 38 the last offer is made and
 *  taken. So the final offer carries no refusal – not because a mechanic retires her, but because
 *  the question has run out. The copy has to carry that and this flag is what lets it. */
export interface RetirementOffer {
  askedWeek: number
  seasonIndex: number
  /** which reading put the question in front of her – `'age'` from 29, `'plateau'` earlier */
  reason: 'age' | 'plateau'
  /** the last offer: made and taken (§5.3) */
  final: boolean
}

/** THE FOUR-YEAR FREEZE (§5.1). Written the week she chooses college; `doneWeek` is null while the
 *  jump has not been spent yet, so a save taken mid-decision resumes into the same button. */
export interface CollegeState {
  fromWeek: number
  untilWeek: number
  doneWeek: number | null
}

/** CAREER-TOTAL MONEY, and it is a NEW FACT rather than a view of an old one – the same argument
 *  `trophiesByTier` makes. `financeWeeks` prunes to a 60-week trailing window (FINANCE_WEEKS), so
 *  by season three the early bills are simply not in the save any more; `seasonHistory` keeps a NET
 *  delta per season, which cannot separate gross in from gross out. A fifteen-season reckoning is
 *  therefore not recoverable from anything already persisted.
 *
 *  ⚠ `prizeCents` IS TRACKED APART FROM `earnedCents` BECAUSE SLOT 6 IS ABOUT THE TENNIS, not about
 *  the household. Parent income, sponsor money, the academy grant and savings interest are all
 *  income; none of them is the tennis paying for itself. The break-even the game is about is prize
 *  money against costs (§9.2 slot 6). */
export interface CareerTotals {
  earnedCents: number
  spentCents: number
  prizeCents: number
  /** ⚠ EVERY WEEK HER BODY HAS EVER SPENT OFF COURT, AND IT LIVES HERE BECAUSE `injuryHistory` IS
   *  PRUNED (v40, docs/specs/fatigue-injury-audit-2026-08.md §6). `rollInjury` keeps the last twenty
   *  layoffs and drops the rest, and the career-ending injury (#4) is keyed on the SUM of them – so
   *  a body past its twentieth layoff started forgetting the earliest ones, and the rule got harder
   *  the more broken she was. Measured over 90 full careers: 13 reached the cap and 1.4% of onsets
   *  were judged against an accumulator a mean of 6.1 weeks short of the truth.
   *
   *  A monotone counter cannot be pruned, and it is also the number the epilogue prints. It counts
   *  RECOVERED layoffs only – the same moment `injuryHistory` gets its row – so an ongoing injury is
   *  not yet in it, which is what «a body that has ALREADY lost N weeks» means. Migrated saves
   *  back-fill from whatever the pruned list still holds: exact for every career under twenty
   *  layoffs, an honest undercount for the rest, and never larger than the truth. */
  weeksLostToInjury: number
}

/** THE DEBT SPELL, surfaced while she is under water – the WARNING PHASE bankruptcy wants before
 *  the fact (adult spec B4). One bad week is never death: the spell resets the week funds recover. */
export interface DebtView {
  sinceWeek: number
  weeks: number
  graceWeeks: number
}

/** ONE PAGE OF THE ALBUM (career-contract-v1.md §9.1). Four things and no fifth. */
export interface AlbumPage {
  /** 1..7 – the slots are FIXED so the album has a shape every career shares (§9.2) */
  slot: number
  /** ⚠ POINT 4, AND IT IS ALWAYS VISIBLE: why this week is in the album. The owner's «видимое
   *  правило отбора». An engine that silently chooses "what mattered" is the game judging; an
   *  engine that shows its reason is the game explaining. */
  why: string
  /** POINT 2: the week in her own hand, ON THE CARD – the polaroid's own bottom lip, in the app's
   *  handwriting face. The engine writes the words; `Polaroid`'s caption slot renders them. */
  caption: string
  /** POINT 3: ONE hard fact off the milestone itself – the cheque, the rank, the opponent, the
   *  layoff. Never a computed summary. Null on an empty face, which has no fact to give. */
  fact: string | null
  /** the absolute career week this page is, or null on an empty face */
  week: number | null
  /** the season the page belongs to, for the date under the caption; null on an empty face */
  seasonIndex: number | null
  /** POINT 1: the photograph, as the art system's two keys. The ENGINE never builds a URL – it
   *  hands over the age band and the week's emotion and the UI calls `portraitUrl`. */
  stage: PortraitStage
  emotion: AvatarEmotion
  /** ⚠ AN EMPTY FACE, and only slots 3 and 6 can ever have one (§9.2, corrected 05.08). Slot 5's
   *  empty face was dropped: injury prevalence is ~51% a season and the slot's own fallback fills
   *  even for a career that never was, so it is never empty in practice. */
  empty: boolean
}

/** §9.3 – UNDERNEATH THE ALBUM: the full scroll, every milestone in order, paged by season. §5.5's
 *  option (a), kept as the floor rather than as the surface. */
export interface ScrollSeason {
  seasonIndex: number
  year: number
  ageYears: number
  rows: { week: number; label: string; detail: string | null }[]
}

/** THE HAND-OFF (§5.6): an OFFER, not a credits roll. One tap to a new career, the next daughter
 *  generated automatically, and exactly ONE question asked – the starting-capital fork the player
 *  already answers at onboarding. Nothing mechanical carries over. */
export interface HandoffView {
  /** ⚠ THE SEAM THAT ALWAYS ANSWERS NO IN v1. «Если ребенка родила за игру – то вполне может
   *  попробовать продолжить»: if a child was born during the career, THAT child is the next
   *  daughter. Pregnancy is post-v1 (§5.4), so this is false for every career this build can
   *  produce – but the question is ASKED, and asking it now is what stops the lineage needing a
   *  retrofit the day the system lands. */
  childBorn: boolean
  /** ⚠ FRESH FORK, NOT THE MOTHER'S BALANCE (§5.6, the architect's call). Carrying her final money
   *  over is exactly the meta-currency §5.6 rules out, and a family that ended rich would open the
   *  next daughter's story with its central tension already resolved. */
  freshCapitalFork: true
  /** COLLEGE ONLY: the week she comes back, and how old she is then. */
  resumesWeek: number | null
  resumesAgeYears: number | null
}

/** THE EPILOGUE, whole. Present on the snapshot exactly while `world.ending` is latched, which is
 *  why the takeover gates on this FIELD and never on a stop reason: permanent state must survive
 *  any fresh snapshot (the same argument App.vue makes for the knock). */
export interface EndingView {
  ending: CareerEnding
  /** exactly seven pages, in slot order */
  album: AlbumPage[]
  scroll: ScrollSeason[]
  handoff: HandoffView
  /** the career's money, whole – not a score, just the two numbers the ledger kept */
  totals: CareerTotals
  seasonsPlayed: number
  /** best (smallest) season-end rank she ever held, or null if she never closed a season */
  bestRank: number | null
  titles: number
  /** how many times she answered "one more year" (§5.3's decade of decisions) */
  oneMoreYearCount: number
}

export interface Snapshot {
  schemaVersion: number
  careerId: string
  seed: string
  week: number
  /** derived: detailed simulation starts at 14 */
  ageYears: number
  /** W4-SCHOOL – THE CAREER WEEK HER SCHOOL YEARS END, and the only school fact the UI is given.
   *
   *  ⚠ A WEEK AND NOT A BOOLEAN, and that is the whole reason it is shaped this way. Three surfaces
   *  ask about weeks that are not this one – the calendar's seven-week look-ahead, the Season
   *  screen's rows, the planner's future bookings – and a boolean captured at the current week would
   *  paint a lesson block on a week she will not be at school in. Every caller asks the same
   *  question: `w >= snap.schoolEndsWeek`.
   *
   *  DERIVED, never persisted: `schoolEndWeek(profile.birthMonth)`, a pure function of her birth
   *  month, so a save from any version answers it the moment it is loaded and nothing can drift out
   *  of step with `world.week`. */
  schoolEndsWeek: number
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
  /** ...and how much tennis is left in the WHOLE season, by rung - the planning counter. See
   *  `seasonSupply` in world.ts for what "available" means and why this is not a longer `upcoming`. */
  seasonSupply: SeasonSupply
  /** R12-15/R12-3: the engine's verdict on the entered event for `week + 1` – the week the sticky
   *  bar's button is about to play – or null when nothing is entered there. See ArrivalPreview. */
  arrival: ArrivalPreview | null
  /** the ITF annual entry cap for the CURRENT season – what the Home tier ladder needs to tell
   *  "capped for the year" apart from "locked on points" and "nothing scheduled". Derived at
   *  snapshot time from the persisted ledger, so it persists nothing of its own. */
  entryCap: EntryCapUsage
  /** THE PRO AER allowance for the CURRENT season (W2-LADDER §5, schema v36's `proEntryWeeks`
   *  behind it) – the junior cap's exact parallel one table up, never merged: the WTA age rule is
   *  "separate from and additional to" the ITF junior one, so a sixteen-year-old holds both
   *  budgets at once. The planner's «Pro entries this season: N of M» line and the W rungs'
   *  "capped" tier state both read THIS, and unlimited seasons read as
   *  `limit: Number.MAX_SAFE_INTEGER` exactly as the junior field does at 17+. */
  proEntryCap: EntryCapUsage
  /** the engine's own per-tier entry verdict - see TierOpenMap */
  tierOpen: TierOpenMap
  /** ...AND WHICH OF THE OPEN ONES SHE HAS ALREADY PASSED (`hasOutgrown`, 06.08). Since the lower
   *  bound stopped refusing, `tierOpen` alone can no longer tell a working rung from one she has
   *  outgrown – they are both `true` – and the two are a completely different sentence on a screen.
   *  ⚠ IT IS NOT A LOCK AND NO SURFACE MAY DRAW IT AS ONE: it is the ladder's own "she is past this
   *  level", and the reason the feed's per-week pick can lead with the more relevant rung.
   *  Derived at snapshot time, persists nothing, and every rung it is true of is a rung she may
   *  still enter. */
  tierOutgrown: TierOpenMap
  /** THE ACCEPTANCE LIST, AS A POSITION, per rung that has one – `acceptanceRank(world, tier)`, absent
   *  for every rung that gates on points instead.
   *
   *  ⚠ IT IS HERE SO THE LOCKED PLAQUE CAN SAY WHEN THE RUNG OPENS (31.07, the owner: «когда
   *  открываются турниры разных типов? Что-то раньше было в интерфейсе видно и понятно, а теперь не
   *  очень»). J60 and J300 gate on her ITF rank position, so their `enterPointBand` is `[0, MAX]` and
   *  every surface that read a band to explain them said either nothing or "0+". The number cannot be
   *  written down in the UI either: it is `enterPct × (cohort + 1)`, so it moves with a re-picked
   *  acceptance list AND with the population – the illustrative "top 50" that used to sit in a comment
   *  was stale by two re-pins when it was found. Derived at snapshot time, persists nothing. */
  tierAcceptance: Partial<Record<TierId, number>>
  /** THE ON-RAMP LATCHES (v34 state, surfaced read-only in R15-9): has she EVER cleared the way
   *  onto each upper table. The event feed no longer reads them directly - W2-LADDER §4's
   *  two-type rule derives its pair from `tierOpen` below (see `feedContext` in
   *  composables/tierState.ts), and the latches reach the feed THROUGH the oracle (the on-ramp
   *  rungs' openness IS the latch). Still surfaced: the pure UI reads them for context, and the
   *  R15-9 story they carry is the two-type rule's ancestor. */
  onRampCleared: { itf: boolean; wta: boolean }
  /** WHO SHE TRAINS WITH (v23): the roster coach's id, or null for the parent on the court. */
  coachId: string | null
  /** THE COACH MARKET (screen T): every coach, priced and read for her. Derived, never stored. */
  coachMarket: CoachMarketRow[]
  /** What the coach costs, weekly and over the coming year.
   *
   *  ⚠ ONE SEASON FIGURE SINCE 08.08, not the OFF/ON pair. The retainer is charged on every week the
   *  coach is not stood down - which is no longer a question the tournament calendar answers - so
   *  there is nothing left to compare. See `coachWorksThisWeek`. */
  coachBilling: {
    /** does he TRAVEL with her (a persisted stance; the mechanic itself is still deferred) */
    onEventWeeks: boolean
    weeklyCents: number
    /** weeks of the season she is entered for – the season she is in, or the one just finished */
    eventWeeks: number
    /** weeks of the coming year the retainer is actually charged for */
    billedWeeks: number
    seasonCents: number
  }
  /** ONE SENTENCE ABOUT HOW MUCH ROOM IS LEFT IN HER (08.08) – the context every uplift on screen T
   *  is relative to, since a rung's worth is a share of remaining headroom and collapses as she
   *  fills her ceiling. Never quotes the ceiling itself; see `coachRoomNote`. */
  coachRoomNote: string
  /** season planner (schema v13): booked vacation weeks from the current week onward. The
   *  calendar renders them by package name; a booked week is a hard blackout for entries. */
  vacations: VacationBooking[]
  /** season planner (schema v13): booked practice-match weeks from the current week onward. */
  practices: PracticeBooking[]
  /** an active resort/elite recovery buff, or null. Surfaced so the UI can show that the
   *  expensive package is still working. */
  recoveryBuff: RecoveryBuff | null
  /** HER KIT, LINE BY LINE (schema v37): the rung she is on, what it costs to move, and how worn
   *  each line is right now. Derived at snapshot time from the persisted `KitState` - the SCREEN
   *  never prices a rung or reads a wear curve, for the reason every other derived block on this
   *  snapshot exists. */
  kit: KitLineView[]
  /** THE DEAL BEHIND THOSE LINES, or null when nobody is kitting her out. See `KitDealView` - the
   *  running allowance is the fact the Bills page was missing. */
  kitDeal: KitDealView | null
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
  /** EVERY TITLE AND EVERY LOST FINAL OF HER CAREER, per tier, as weeks (schema v31). Behind the
   *  Trophy Cabinet. See `TierTrophies` above for the shape and for why `finals` excludes titles.
   *
   *  ⚠ IT IS PERSISTED STATE AND NOT A DERIVATION, WHICH IS UNUSUAL FOR THIS SNAPSHOT, and the
   *  reason is that nothing already in a save can answer the question. `milestones` is firsts-only
   *  (its identity is `title:<tier>`, so five J30 titles leave one row); `bestFinishByTier` is a
   *  single high-water mark with no year on it, and it is OVERWRITTEN the week a silver becomes a
   *  gold; `results` is pruned to a 52-week ranking window; `events` is capped at 400 rows and only
   *  the trailing 60 reach this snapshot. A career-wide "how many, and when" is therefore not
   *  recoverable from any of them, which is exactly what the cabinet has to print.
   *
   *  Every tier is present from week 0 with two empty arrays - the screen shows all eighteen
   *  trophies from the start, locked, so an absent key would be a shape the reader has to defend
   *  against for no gain. */
  trophiesByTier: Record<TierId, TierTrophies>
  /** THE INBOX (schema v32): every letter this career has been sent, oldest first – open, signed,
   *  refused and expired alike. See `Offer`.
   *
   *  ⚠ PERSISTED STATE, LIKE `trophiesByTier` AND FOR THE SAME REASON: a signed deal has to outlive
   *  every prune. The event feed caps at 400 rows and only the trailing 60 reach this snapshot, so a
   *  contract that lives in the feed is a contract that silently stops existing two seasons later.
   *  Bounded by construction – at most a handful of letters a season – so it is never pruned. */
  offers: Offer[]
  /** ⚠ THE INBOX DOT, AND THE ENGINE DECIDES IT. Exactly the bell's discipline (HomeScreen's own
   *  comment: "the bell's dot asserts one FACT and not the 'unread' it cannot know"): this asserts
   *  that AN OFFER IS OPEN AND ITS DEADLINE HAS NOT PASSED, which is a fact the engine holds. It is
   *  never "unread" – the engine cannot know what the player has looked at, and a dot that claims to
   *  is a dot that lies on the second visit.
   *
   *  It goes out on its own: the last open offer being signed, refused or expiring is the same
   *  event as this turning false. */
  offerOpen: boolean
  /** the CURRENT season's kid W-L (round-8, the R6 debt): mirrors the v10 world counters that
   *  accumulate at finalizeTournament and reset at each season wrap-up.
   *
   *  ⚠ THE TOTAL, BOTH LADDERS TOGETHER, and it stays that on purpose. `matchesEverPlayed` folds it
   *  with `seasonHistory` into the radar's confidence, which is documented as a count that may only
   *  ever go UP; `SeasonSummary` and `seasonHistory` bank it per season. Splitting it per ladder is
   *  `seasonRecord` below, which is ADDED beside it rather than replacing it. */
  seasonWins: number
  seasonLosses: number
  /** THE SAME W-L, TOLD APART BY LADDER (31.07, the owner: «national/international разделить победы и
   *  поражения, мне кажется они не должны быть общими»).
   *
   *  Every match the counters see is a tournament match, so every one of them is attributable without
   *  inventing anything: `finalizeTournament` knows the event, the event knows its tier, and the tier
   *  knows its track. Nothing lands in neither bucket and nothing lands in both – a practice friendly
   *  never reaches finalize (R11-2: nothing was on the line), and a walkover or a medical withdrawal
   *  never reaches it either, because she never took the court.
   *
   *  ⚠ WHY A SPLIT W-L IS NOT MERELY COSMETIC. The Stats screen switches every other figure it shows
   *  – rank, points, the standings table, the counting results – with the ladder picker at the top of
   *  it, and left this one figure standing still underneath. A 24–9 that does not move when the
   *  National/International switch does reads as a claim that those 24 wins are in the table currently
   *  on screen, which for a domestic career is false about all of them. */
  seasonRecord: Record<LadderTrack, { wins: number; losses: number }>
  /** her current run of consecutive competitive losses + the threshold that turns it angry, or
   *  null when her last competitive match was a win (or she has never played one). Derived at
   *  snapshot time from the event log – persists nothing, bumps no schema. */
  lossStreak: LossStreak | null
  /** Diary-1: the facts + the selected lines for every diary surface (photo card, condition
   *  note, Memory). Derived at snapshot time – only the milestone ledger behind `memory`
   *  persists (schema v18). */
  diary: DiarySnapshot
  /** THE DURABLE MILESTONE LEDGER, whole (`world.milestones`, schema v18) – her firsts, one row per
   *  identity, never pruned.
   *
   *  ⚠ IT IS ON THE SNAPSHOT BECAUSE `events` IS THE WRONG PLACE TO READ A PERMANENT FACT FROM.
   *  `events` is capped at the trailing 60 rows, positionally, so any surface that scrapes a
   *  milestone out of it works for a couple of months and then silently empties – which is precisely
   *  what happened to the Kid screen's moments strip. `diary.memory` is not a substitute either: it
   *  is ONE rotating card, chosen for this week's story, not the list. A surface that wants "what has
   *  she done so far" reads this. */
  milestones: readonly Milestone[]
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
  /** THE EPILOGUE, or null while the story still has a next week (schema v39).
   *
   *  ⚠ THE TAKEOVER GATES ON THIS FIELD AND NEVER ON THE STOP REASON, for exactly the reason
   *  App.vue gives for the knock: a stop reason is a property of the LAST ADVANCE, and permanent
   *  state has to survive any fresh snapshot. Reload an ended career and the album is there again;
   *  the stop reason is long gone. */
  ending: EndingView | null
  /** the debt spell while she is under water, else null – the warning phase before bankruptcy */
  debt: DebtView | null
  /** the fork at nineteen while it is OPEN and unanswered, else null */
  fork: { askedWeek: number; ageYears: number } | null
  /** the natural end's offer while it is OPEN and unanswered, else null */
  retirementOffer: RetirementOffer | null
  /** her four years at college, once she has chosen them – null for every career that did not */
  college: CollegeState | null
  /** career-total money (v39). On the snapshot always, not only at the end: the Money screen's
   *  "since week one" row reads it, and it is what makes the reckoning cheap. */
  careerTotals: CareerTotals
}

export interface SlotMeta {
  slot: string
  careerId: string
  savedAt: number
  week: number
  seed: string
  bytes: number
  /** W1-INTEGRITY-A: the committed revision this record captured. Lives on the save RECORD
   *  envelope, NOT inside WorldState – the payload/schema is untouched (no schema bump). Optional
   *  because records written before this wave have none; they read as revision 0. */
  revision?: number
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
  /** W1-INTEGRITY-A: the highest committed revision of this career on disk – the compare-and-swap
   *  anchor every autosave write checks before it may clobber (see src/db/saves.ts). Optional for
   *  rows written before this wave; absent reads as 0. */
  revision?: number
}

/** W1-INTEGRITY-A: machine-readable error kinds the UI can dispatch on. Everything else stays a
 *  plain human-readable `error` string, exactly as before – `code` is additive.
 *   STALE_REVISION  the mutation's `baseRevision` is not the worker's committed revision; the
 *                   response's `revision` carries the current one so the caller can refresh.
 *   SAVE_CONFLICT   the on-disk career revision is ahead of the one being written (another tab
 *                   committed since we loaded) – the write was refused, nothing was clobbered. */
export type WorkerErrorCode = 'STALE_REVISION' | 'SAVE_CONFLICT'

export type ToWorker =
  | { id: number; type: 'new'; seed: string; profile: PlayerProfile }
  | { id: number; type: 'tick'; weeks: number; baseRevision: number }
  | { id: number; type: 'advance'; weeks: 1 | 4; baseRevision: number }
  | { id: number; type: 'enterEvent'; eventId: string; baseRevision: number }
  | { id: number; type: 'withdrawEvent'; eventId: string; baseRevision: number }
  | { id: number; type: 'tournamentReveal'; baseRevision: number }
  | { id: number; type: 'tournamentSkip'; baseRevision: number }
  | { id: number; type: 'tournamentClose'; baseRevision: number }
  // R9-9: withdraw POST-deadline at the event week – fee forfeited, travel refunded, no run.
  | { id: number; type: 'skipEvent'; eventId: string; baseRevision: number }
  // R10-13: cancel an entry before its week starts. Past the deadline the fee is FORFEITED and the
  // week becomes plannable again (the escape from the R10-3 dead end); before it, a full refund.
  | { id: number; type: 'cancelEntry'; eventId: string; baseRevision: number }
  // Season planner: book/cancel a vacation or a practice match on an empty FUTURE week.
  // Cancelling before the week starts refunds in full (mirror of entry withdrawal).
  | { id: number; type: 'bookVacation'; week: number; packageId: string; baseRevision: number }
  | { id: number; type: 'cancelVacation'; week: number; baseRevision: number }
  | { id: number; type: 'bookPractice'; week: number; withCoach: boolean; baseRevision: number }
  | { id: number; type: 'hireCoach'; coachId: string | null; baseRevision: number }
  | { id: number; type: 'setCoachOnEventWeeks'; on: boolean; baseRevision: number }
  | { id: number; type: 'cancelPractice'; week: number; baseRevision: number }
  | { id: number; type: 'setPlan'; plan: WeekPlan; baseRevision: number }
  // W4: answer the knock. The ONLY way an undecided knock clears, and the only way time moves again.
  | { id: number; type: 'decideKnock'; choice: KnockChoice; baseRevision: number }
  // THE INBOX (v32): answer a letter. Both are refused past the deadline – the window is the
  // feature, not a courtesy – and `signOffer` is irreversible by design, which is why the UI puts a
  // ConfirmDialog in front of it and the engine puts nothing in front of the confirm.
  | { id: number; type: 'signOffer'; offerId: string; baseRevision: number }
  | { id: number; type: 'refuseOffer'; offerId: string; baseRevision: number }
  | { id: number; type: 'setPhysio'; active: boolean; baseRevision: number }
  // W3-KIT: move one line of her kit onto another rung. Moving UP buys the item over the counter
  // (charged at once, and she is holding a new one from this week); moving DOWN is free and takes
  // effect at the next scheduled purchase - nobody is refunded for a racket they own.
  | { id: number; type: 'setKitGrade'; line: KitLine; grade: KitGrade; baseRevision: number }
  // W2-ENDINGS. Three commands, and every one of them is an ANSWER to a question the engine asked:
  // the fork at nineteen, the natural end's offer, and the single button on a college epilogue.
  // None of them can be issued unprompted – the engine refuses when its question is not open, which
  // is what stops a stale screen ending a career that never asked.
  | { id: number; type: 'answerFork'; answer: ForkAnswer; baseRevision: number }
  | { id: number; type: 'answerRetirement'; retire: boolean; baseRevision: number }
  // «Four years later» – spends the college freeze in one tap and clears the latch (§5.1).
  | { id: number; type: 'resumeFromCollege'; baseRevision: number }
  | { id: number; type: 'save'; slot?: string }
  | { id: number; type: 'saveNamed'; name: string }
  // W1-INTEGRITY-A (TB-01): restore a slot AS THE ACTIVE CAREER – the restored state is committed
  // as the NEWEST autosave before the response says ok, so restore → close → relaunch reopens it.
  // This replaced the old `load`, which swapped the worker's world WITHOUT writing an autosave: a
  // relaunch then picked the newer pre-restore generation and silently rolled the restore back.
  // Loading-for-inspection (read without becoming the active career) is deliberately NOT this
  // command; no surface needs it today, and when one does it must be a separate query.
  | { id: number; type: 'restoreSlot'; slot: string }
  // W1-INTEGRITY-A: read-only snapshot of the committed world – the stale-revision refresh path.
  | { id: number; type: 'getSnapshot' }
  | { id: number; type: 'listSlots'; careerId?: string }
  | { id: number; type: 'deleteSlot'; slot: string }
  | { id: number; type: 'listCareers' }
  | { id: number; type: 'loadCareer'; careerId: string }
  | { id: number; type: 'deleteCareer'; careerId: string }
  | { id: number; type: 'exportSave' }
  | { id: number; type: 'importSave'; bytes: ArrayBuffer }

// Every success carries `revision` – the worker's committed revision AFTER the command (unchanged
// by queries). Mutating requests send it back as `baseRevision`; the worker rejects a stale one
// with code STALE_REVISION instead of applying the command to state the caller has not seen.
export type ToUI =
  | {
      id: number
      ok: true
      type: 'snapshot'
      snapshot: Snapshot
      revision: number
      recovered?: true
      /** set only by `restoreSlot`: the slot the active state was restored from */
      restoredFrom?: string
    }
  | { id: number; ok: true; type: 'slots'; slots: SlotMeta[]; revision: number }
  | { id: number; ok: true; type: 'careers'; careers: CareerMeta[]; revision: number }
  | { id: number; ok: true; type: 'exported'; bytes: ArrayBuffer; filename: string; revision: number }
  | {
      id: number
      ok: false
      error: string
      /** absent for ordinary engine refusals; see WorkerErrorCode for the typed kinds */
      code?: WorkerErrorCode
      /** on STALE_REVISION / SAVE_CONFLICT: the revision the conflict was measured against */
      revision?: number
    }
