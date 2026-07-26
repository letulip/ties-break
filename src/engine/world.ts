import { type Rng, rngFromSeed, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CountingResult,
  type FamilyBackground,
  type FinanceWeek,
  type FinanceWindow,
  type FullBracketMatch,
  type InjurySeverity,
  type PendingBracketRound,
  type PendingView,
  type PlayerProfile,
  type PracticeBooking,
  type RecoveryBuff,
  type SeasonSummary,
  type Snapshot,
  type SnapshotInjury,
  type StandingRow,
  type StopReason,
  type UpcomingEvent,
  type VacationBooking,
  type WeekPlan,
  type WorldEvent,
  type WorldEventCategory,
  type WorldMatch,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
import { weekYear } from '../shared/dates'
import type { MatchPlayer, Surface } from './match/types'
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TierId, TournamentResult } from './season/types'
import { TIERS, buildSeason, isOffSeasonWeek, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from './season/calendar'
import {
  ECONOMY,
  GEAR_CATEGORIES,
  gearHitForWeek,
  planExpenseFactor,
  practiceFeeCents,
  vacationPackage,
  vacationPriceCents,
} from './economy'
import { generateCohort, driftCohort } from './season/cohort'
import { generatePreHistory } from './season/prehistory'
import { computeRanking, windowedBestSum, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament, JUNIOR_TOUR } from './season/tournament'
import { simulateMatch } from './match/engine'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md) so the load-time RNG replay stays valid.

export const SAVE_SCHEMA_VERSION = 13

/** Detailed weekly simulation starts here; childhood becomes a prologue (Phase 6). */
export const START_AGE_YEARS = 14

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'

/** A tournament whose outcome is fully computed (byte-identical to the old inline resolution)
 *  but is being REVEALED to the player one round at a time. The week that spawned it is not
 *  closed until the run finalizes. Persisted (schema v8) so a mid-reveal save resumes the flow.
 *  `players` holds the pre-drift skill snapshots of the kid + every opponent she faces, so the
 *  revealed match events are identical no matter how the cohort drifts after this week ticks. */
export interface PendingTournament {
  eventId: string
  result: TournamentResult
  /** kid matches already emitted as News events (0..kidMatches.length) */
  revealedRounds: number
  /** true once the last kid match is revealed and points/summary/rank are committed */
  finished: boolean
  players: Record<string, MatchPlayer>
}

export interface WorldState {
  schemaVersion: number
  /** Career this world belongs to. Generated outside the engine (worker/store); the
   *  engine only threads it through. Default here is deterministic so pure callers stay reproducible. */
  careerId: string
  seed: string
  week: number
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  /** ~199 AI juniors; drifts weekly (Phase-4 placeholder). */
  cohort: AiPlayer[]
  /** rolling results ledger; pruned to the ranking window. */
  results: SeasonResult[]
  /** rolling calendar: always ≥ 26 future weeks generated. */
  season: SeasonEvent[]
  /** eventIds the kid is entered in. */
  entries: string[]
  /** structured News/Money feed; capped, `keep` survives pruning. */
  events: WorldEvent[]
  nextEventId: number
  /** the kid's dense rank among cohort + kid (cheap-access cache). */
  kidRank: number
  /** kidRank as it stood at the start of the last resolved week; null before any tick (v7). */
  prevKidRank: number | null
  /** a tournament being revealed round by round; null when no reveal is in progress (v8). */
  pendingTournament: PendingTournament | null
  /** best (smallest) finish index the kid has ever reached per tier (v10); updated at
   *  tournament finalize. Drives the Home season strip's real tier progress. */
  bestFinishByTier: Partial<Record<TierId, number>>
  /** the most recent end-of-season recap (v10); null until the first season wraps up. */
  lastSeasonSummary: SeasonSummary | null
  /** the CURRENT (in-progress) season's kid wins/losses, counted as matches resolve so the
   *  summary never has to re-parse event text and pruning can't lose them (v10). Reset to 0
   *  at each season wrap-up. */
  seasonWins: number
  seasonLosses: number
  /** per-week/per-category signed-cents finance ledger (v11), accrued at the `addEvent` choke
   *  point and pruned to a 60-week trailing window. Feeds the Money breakdown/ledger so they
   *  survive the 60-event snapshot cap; see FinanceWeek in protocol.ts. */
  financeWeeks: FinanceWeek[]
  /** Season-Life (v12): per-week condition 0..100 (100 = fresh). Written ONLY by accrueCondition
   *  (pure arithmetic, zero main-stream RNG); fatigue is the derived 100 - condition, not stored. */
  condition: number
  /** the kid's active injury, or null when healthy. Wired in slice B but ALWAYS null here – Slice C
   *  populates it. The snapshot omits `sinceWeek`. */
  injury: (SnapshotInjury & { sinceWeek: number }) | null
  /** append-only injury log, pruned to the last 20 (Slice C writes it; empty in B). */
  injuryHistory: Array<{ kind: string; severity: string; week: number; weeksOut: number }>
  /** whether physio recovery is active (default = profile.coachSetup === 'hired'). The cost lever
   *  is billed in Slice C; in B the flag just reflects/sets the toggle. */
  physioActive: boolean
  /** Season planner (v13): booked family-vacation weeks. PURE player state – the price was
   *  quoted/charged from the `:vacation:` sub-stream at booking time, so nothing here can move
   *  the MAIN weekly draw sequence. Pruned to `week >= world.week` at housekeeping. */
  vacations: VacationBooking[]
  /** Season planner (v13): booked practice-match (friendly) weeks – same purity contract, priced
   *  off the `:practice:` sub-stream. */
  practices: PracticeBooking[]
  /** Season planner (v13): a carry-over injury-tau buff from a resort/elite vacation package;
   *  null when none is running. Applied POST-draw inside injuryTau. */
  recoveryBuff: RecoveryBuff | null
}

export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
}

// The economy tuning surface now lives in ./economy (the owner's single "ручки регулировки"
// knob object). These aliases keep the old call sites + the public PARENT_INCOME_CENTS export
// (imported by tests) pointing at that one source of truth.
export const PARENT_INCOME_CENTS = ECONOMY.parentIncomeCents
const EXPENSE_RANGE = ECONOMY.expenseRangeCents

// Flavor lists are background-aware but a flavor is always chosen with ONE `pickInt`
// (a single rng() call regardless of list length), so the per-tick draw count is
// identical across backgrounds. middle keeps the original lists verbatim.
const TRAIN_EVENTS = [
  'Coaching block: technique drills',
  'Coaching block: footwork and conditioning',
  'Practice sets at the local club',
  'Sparring with the older kids',
  'Video session: studying her last matches',
]

const REST_EVENTS = [
  'Light week: school catches up',
  'Family weekend away from the courts',
  'Recovery week: stretching and pool',
  'Hitting for fun, no drills',
  'Off week: she reread her favorite book',
]

// working can't afford video analysis – swap that one line for a public-courts clinic.
const WORKING_TRAIN_EVENTS = TRAIN_EVENTS.map((e) =>
  e === 'Video session: studying her last matches' ? 'Group clinic at the public courts' : e,
)

// wealthy adds premium recovery lines to the rest pool.
const WEALTHY_REST_EVENTS = [...REST_EVENTS, 'Physio session', 'Massage & recovery']

function trainFlavors(background: FamilyBackground): string[] {
  return background === 'working' ? WORKING_TRAIN_EVENTS : TRAIN_EVENTS
}

function restFlavors(background: FamilyBackground): string[] {
  return background === 'wealthy' ? WEALTHY_REST_EVENTS : REST_EVENTS
}

const SEASON_MIN_FUTURE = 26 // always keep at least this many future weeks scheduled
const SEASON_CHUNK = 52 // generate the calendar one deterministic year-block at a time
const RESULTS_WINDOW = 52 // ranking window; results older than this never count → prunable
const EVENTS_CAP = 400 // non-`keep` events beyond this are pruned oldest-first
const SNAPSHOT_EVENTS = 60 // events surfaced in a snapshot
const FINANCE_WEEKS = 60 // trailing weeks of the per-category finance ledger retained (12w + a full 52w season)
const SNAPSHOT_FINANCIAL_EVENTS = 50 // financial transactions surfaced to the ledger, cap-independent of `events`
const UPCOMING_WEEKS = 8 // calendar horizon surfaced in a snapshot

function addEvent(world: WorldState, e: Omit<WorldEvent, 'id'>): void {
  world.events.push({ id: world.nextEventId++, ...e })
  // Every financial event (amountCents present) also folds into the persisted finance ledger –
  // the single choke point that captures income/coaching/sponsor/gear/stringing/travel/entry with
  // zero call-site changes, and (unlike `events`) survives pruning so the Money breakdown stays
  // window-accurate. `amount === 0` sponsored line-items move no cash, so they're skipped.
  if (e.amountCents !== undefined && e.amountCents !== 0) accrueFinance(world, e.week, e.category ?? 'other', e.amountCents)
}

// Fold one financial delta into financeWeeks: find-or-create the week entry (keeping the array
// week-ascending – the common case is appending the current, newest week) and add into its category.
function accrueFinance(world: WorldState, week: number, category: WorldEventCategory, amountCents: number): void {
  let entry = world.financeWeeks.find((w) => w.week === week)
  if (!entry) {
    entry = { week, byCategory: {} }
    const last = world.financeWeeks[world.financeWeeks.length - 1]
    if (!last || week >= last.week) world.financeWeeks.push(entry)
    else world.financeWeeks.splice(world.financeWeeks.findIndex((w) => w.week > week), 0, entry)
  }
  entry.byCategory[category] = (entry.byCategory[category] ?? 0) + amountCents
}

/** Pure category-accurate fold of `financeWeeks` from `fromWeek` onward (inclusive). No world
 *  dependency, so the bench and tests call it directly. income/expense/net are derived from the
 *  aggregated per-category totals, so `netCents === incomeCents - expenseCents === Σ byCategory`. */
export function financeWindow(financeWeeks: FinanceWeek[], fromWeek: number): FinanceWindow {
  const byCategory: Partial<Record<WorldEventCategory, number>> = {}
  for (const w of financeWeeks) {
    if (w.week < fromWeek) continue
    for (const [cat, amt] of Object.entries(w.byCategory) as [WorldEventCategory, number][]) {
      byCategory[cat] = (byCategory[cat] ?? 0) + amt
    }
  }
  let incomeCents = 0
  let expenseCents = 0
  for (const amt of Object.values(byCategory)) {
    if ((amt ?? 0) > 0) incomeCents += amt!
    else expenseCents += -(amt ?? 0)
  }
  return { startWeek: fromWeek, byCategory, incomeCents, expenseCents, netCents: incomeCents - expenseCents }
}

// --- the kid as a match player -----------------------------------------------
// The kid has no persisted skills in Phase 3 (development lands in Phase 4), so the
// starting build is derived deterministically from the world seed. Stable across a
// career, and snapshotted into every kid-match event for replay.
export function kidMatchPlayer(world: { seed: string; profile: PlayerProfile }): MatchPlayer {
  const r = rngFromSeed(world.seed + ':kid')
  return {
    id: KID_ID,
    // Round-7 item 17: full "First Last" (was first-name-only) so the match viewer's
    // under-court labels short-name the kid the same way the opponent already is
    // ("V. Martin", not "Vera"). formatShortName is applied at the display layer.
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    serve: pickInt(r, 40, 58),
    ret: pickInt(r, 40, 58),
    composure: pickInt(r, 35, 55),
    stamina: pickInt(r, 40, 60),
  }
}

function cohortIds(world: WorldState): string[] {
  return world.cohort.map((p) => p.id)
}

function eventById(world: WorldState, id: string): SeasonEvent | undefined {
  return world.season.find((e) => e.id === id)
}

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

// --- ranking helpers ---------------------------------------------------------
function fullRanking(world: WorldState): RankingRow[] {
  return computeRanking(world.results, world.week, [...cohortIds(world), KID_ID])
}

/** Refresh the cheap-access kidRank cache from the current results ledger. */
export function recomputeKidRank(world: WorldState): void {
  const row = fullRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRank = row?.rank ?? world.cohort.length + 1
}

// --- milestones (never pruned) -----------------------------------------------
function fireMilestone(world: WorldState, key: string, text: string): void {
  if (world.events.some((e) => e.milestoneKey === key)) return
  addEvent(world, { week: world.week, type: 'milestone', text, keep: true, milestoneKey: key })
}

// --- season wrap-up (Round 5 items 16/21; round-7 item 4) ---------------------
// Fires once, the moment the world ticks into a season year's first off-season week
// (see calendar.ts's isOffSeasonWeek). Season figures are read back off the EXISTING
// ledgers for the just-finished year, EXCEPT W-L which come from the running counters
// (round-7: "count as you go … don't parse text", so pruning can't lose them):
//  - season points / best finish: results + tournament events in range.
//  - W-L: world.seasonWins / seasonLosses (accumulated at finalizeTournament).
//  - rank vs season start: results ledger replayed at the year's first week (still
//    inside the 52-week ranking window, so nothing has been pruned away yet).
//  - funds delta: signed amountCents on expense/income events in range (a flavor
//    figure, not the audit trail – MoneyScreen's ledger stays authoritative).
// The same figures are stored as the structured `lastSeasonSummary` (v10) for the
// SeasonSummaryDialog, then the season counters reset for the year ahead.
function maybeFireSeasonWrapUp(world: WorldState): void {
  if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) return
  const year = Math.floor(world.week / WEEKS_PER_YEAR)
  const yearStart = year * WEEKS_PER_YEAR
  const wrapWeek = world.week

  const inRange = (w: number) => w >= yearStart && w < wrapWeek

  const seasonPoints = world.results
    .filter((r) => r.playerId === KID_ID && inRange(r.week))
    .reduce((sum, r) => sum + r.points, 0)

  let bestFinish: number | null = null
  for (const e of world.events) {
    if (!inRange(e.week)) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined) {
      if (bestFinish === null || e.finishIdx < bestFinish) bestFinish = e.finishIdx
    }
  }

  const wins = world.seasonWins
  const losses = world.seasonLosses

  const fundsDeltaCents = world.events
    .filter((e) => inRange(e.week) && e.amountCents !== undefined)
    .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)

  // Season-Life slice C: weeks lost to injury inside [yearStart, wrapWeek). Derived from
  // injuryHistory (each entry spans [week - weeksOut, week)) + the current injury if she is
  // still out at the wrap – no extra persisted counter, so no schema bump.
  const overlap = (lo: number, hi: number) => Math.max(0, Math.min(hi, wrapWeek) - Math.max(lo, yearStart))
  let weeksInjured = 0
  for (const h of world.injuryHistory) weeksInjured += overlap(h.week - h.weeksOut, h.week)
  if (world.injury) weeksInjured += overlap(world.injury.sinceWeek, wrapWeek)

  const startRanking = computeRanking(world.results, yearStart, [...cohortIds(world), KID_ID])
  const startRank = startRanking.find((r) => r.playerId === KID_ID)?.rank ?? null
  const rankMove =
    startRank === null || startRank === world.kidRank
      ? ''
      : startRank > world.kidRank
        ? ` (↑${startRank - world.kidRank} vs season start)`
        : ` (↓${world.kidRank - startRank} vs season start)`

  const bestText = bestFinish === null ? 'no tournaments played' : `best ${finishLabel(bestFinish)}`
  const fundsSign = fundsDeltaCents >= 0 ? '+' : '-'
  const fundsText = `${fundsSign}$${Math.abs(Math.round(fundsDeltaCents / 100)).toLocaleString('en-US')}`

  fireMilestone(
    world,
    `season-wrap-${year}`,
    `Season ${weekYear(yearStart)} wrap-up: rank #${world.kidRank}${rankMove} · ${seasonPoints} pts this season · ` +
      `${bestText} · ${wins}-${losses} (W-L) · funds ${fundsText}`,
  )
  addEvent(world, { week: world.week, type: 'info', text: 'Off-season: rest, school, family time.' })

  world.lastSeasonSummary = {
    seasonYear: weekYear(yearStart),
    endRank: world.kidRank,
    startRank,
    points: seasonPoints,
    wins,
    losses,
    bestResultText: bestText,
    fundsDeltaCents,
    weeksInjured,
  }
  // The season that just wrapped is banked in the summary – start the next one clean.
  world.seasonWins = 0
  world.seasonLosses = 0
}

// --- finish / stage labels ---------------------------------------------------
// finish index = rounds - round (0 = champion). Higher = earlier exit.
function finishLabel(finish: number): string {
  switch (finish) {
    case 0:
      return 'Champion'
    case 1:
      return 'Runner-up'
    case 2:
      return 'Semifinalist'
    case 3:
      return 'Quarterfinalist'
    default:
      return `Round of ${2 ** finish}`
  }
}

// Stage name of a match played in the given round of a draw of `drawSize`.
function stageLabel(round: number, drawSize: number): string {
  const remaining = drawSize / 2 ** round
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}

// --- Season-Life: condition + availability gate (slice B) --------------------
function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

/** True for a school-exam blackout week – the season-week offset falls inside one of
 *  ECONOMY.availability.examWeeks. Exported so the planner UI can label the calendar row
 *  honestly ("School exams") instead of calling it a training week. */
export function isExamWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return ECONOMY.availability.examWeeks.some(([lo, hi]) => offset >= lo && offset <= hi)
}

/** A "blackout" week for tournaments: the off-season tail (already event-free) or a school-exam
 *  block. Used both by the condition accumulator (extra recovery) and the availability gate. */
export function isBlackoutWeek(week: number): boolean {
  return isOffSeasonWeek(week) || isExamWeek(week)
}

/** The train/rest slider's recovery bonus for a MATCH-FREE week (round-9 owner redesign):
 *  threshold-based on plan.rest, first (highest) matching threshold wins, never interpolated –
 *  the 60/40 preset earns +2, 75/25 earns +1, the 85/15 grind earns 0. Pure, integer. */
export function restRecoveryBonus(restPercent: number): number {
  for (const { minRest, bonus } of ECONOMY.condition.restRecoveryBonus) {
    if (restPercent >= minRest) return bonus
  }
  return 0
}

/** Pure INTEGER condition accumulator (zero RNG). Round-9 owner redesign: fatigue comes from
 *  MATCHES (matchDrain, applied when a run COMMITS at finalizeTournament – so a skipped event
 *  week (R9-9) or a walkover costs nothing by construction); recovery comes from TIME:
 *  recoveryBase every week, + the train/rest slider bonus on match-free weeks only, + the
 *  physio bonus while the retainer runs (R9-14 – the billed value finally visible), + the
 *  blackout bonus on off-season/exam weeks. Clamps to [min,max]. */
export function accrueCondition(world: WorldState, playedThisWeek: boolean): void {
  const c = ECONOMY.condition
  // WEEK-TYPE RECOVERY LADDER (season-planner spec §4, owner 25.07 – 0 / base / base+slider):
  //  - TOURNAMENT week: matchWeekRecoveryBase (0 shipped) – travel + competition, not rest;
  //  - PRACTICE week: the base only – she keeps it but FORFEITS the slider rest bonus, because
  //    she played, even if the match was a friendly (the drain lands in resolvePractice);
  //  - free / vacation week: recoveryBase + the rest-slider bonus (the vacation's package gain
  //    rides on top in resolveVacation).
  // The practice flag is read off world state (not a parameter) so the signature – and with it
  // the zero-RNG, arity-2 contract the B1 invariance test pins – stays exactly as it was.
  const practiced = !playedThisWeek && practiceForWeek(world, world.week) !== undefined
  let recovery = playedThisWeek
    ? c.matchWeekRecoveryBase
    : practiced
      ? c.recoveryBase
      : c.recoveryBase + restRecoveryBonus(world.plan.rest)
  if (world.physioActive) recovery += ECONOMY.physio.conditionBonusPerWeek
  if (isBlackoutWeek(world.week)) recovery += c.blackoutBonus
  world.condition = clamp(world.condition + recovery, c.min, c.max)
}

/** R9-7 (owner redesign): the INTEGER fatigue of ONE kid match – how hard the scoreline was,
 *  plus the tier's per-match surcharge:
 *    straight sets, no tiebreak → 1;  a 3-setter OR a tiebreak in a 2-setter → 2;
 *    +1 more when the match had MORE than 2 tiebreak sets (a three-TB epic) – max 3;
 *    + tierMatchFatigue[tier] (local 0 / regional 1 / national 2 / itf 3).
 *  A set scored 7-6 / 6-7 is a tiebreak set. Hardest national match = 5. Pure state, zero
 *  draws; a record without a score (defensive) counts as straight sets. */
export function matchDrain(tier: TierId, score: string | undefined): number {
  const f = ECONOMY.condition.matchFatigue
  const sets = score ? score.split(' ') : []
  const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
  let drain = sets.length >= 3 || tiebreaks >= 1 ? f.hardMatch : f.straightSets
  if (tiebreaks > 2) drain += f.extraTiebreaks
  return drain + ECONOMY.condition.tierMatchFatigue[tier]
}

/** R9-7: a committed run's total toll = Σ matchDrain over the kid's match records. A 5-match
 *  National run maxes at 25 (the owner's own check). Applied by finalizeTournament. */
export function tournamentRunStrain(tier: TierId, kidMatches: { score?: string }[]): number {
  return kidMatches.reduce((sum, m) => sum + matchDrain(tier, m.score), 0)
}

/** R9-19 (coupling ON, owner curve): NO strength penalty while she is fresh enough
 *  (condition >= matchStrengthKnee), then linear down to matchStrengthFloor at condition 0:
 *    factor = condition >= knee ? 1.0 : floor + (1 − floor) × condition / knee.
 *  Applied ONLY to the kid's MatchPlayer inside the EVENT-scoped shadow tournament
 *  (`seed:kidtour` stream), so the MAIN weekly draw sequence stays byte-identical. */
export function conditionMatchFactor(condition: number): number {
  const c = ECONOMY.condition
  if (condition >= c.matchStrengthKnee) return 1
  return c.matchStrengthFloor + (1 - c.matchStrengthFloor) * (condition / c.matchStrengthKnee)
}

/** Whether the kid can currently ENTER `event`, at three levels. One helper, wired at three engine
 *  surfaces (enterEvent / upcomingEvents / advanceWeeks) so the gate can never desync. Precedence
 *  is injured > unavailable > fatigued.
 *   - 'blocked' HARD stops entry: `injured` (dead branch in B – world.injury is always null – but
 *     wired for Slice C) and `unavailable` (school exams / off-season).
 *   - 'caution' is a SOFT warning that still ALLOWS entry: `fatigued` (condition below the tier's
 *     floor). The owner's call: racing tired is a tough-parent CHOICE with emergent consequences
 *     (deeper condition hole now, higher injury risk once Slice C lands), not a forbidden action.
 *   - 'ok' is clear. */
export interface AvailabilityStatus {
  level: 'ok' | 'caution' | 'blocked'
  reason?: 'injured' | 'fatigued' | 'unavailable'
  detail?: string
}
export function availabilityStatus(world: WorldState, event: SeasonEvent): AvailabilityStatus {
  if (world.injury !== null) {
    return { level: 'blocked', reason: 'injured', detail: `Injured – back in ${world.injury.weeksRemaining} weeks.` }
  }
  // Season planner: a booked family-vacation week is a HARD blackout – the family is away, so
  // nothing is enterable (spec §3). It outranks the exam/off-season blackout copy so the chip
  // names the actual reason she is unavailable.
  const vacation = vacationForWeek(world, event.week)
  if (vacation) {
    return { level: 'blocked', reason: 'unavailable', detail: vacationBlackoutDetail(vacation) }
  }
  if (isBlackoutWeek(event.week)) {
    return { level: 'blocked', reason: 'unavailable', detail: 'School exams this week – no tournaments.' }
  }
  if (world.condition < ECONOMY.availability.minConditionToEnter[event.tier]) {
    return { level: 'caution', reason: 'fatigued', detail: 'Exhausted – racing risks injury.' }
  }
  return { level: 'ok' }
}

// --- Season-Life: injuries + physio (slice C) ---------------------------------
// ALL of this slice's randomness lives on the PRIVATE per-week sub-streams
// `rngFromSeed(seed + ':injury:' + week)` and `rngFromSeed(seed + ':physio:' + week)`.
// Each is re-derived per call and keyed on immutable (seed, week) only, so conditional
// pulls inside them (severity/weeks-out/region only when injured; billing only when owed)
// can never perturb the MAIN weekly stream or any other week – the C1 invariance test
// (count 45239 / hash 9f783705, frozen in slice B) guards it. rollInjury/resolvePhysio
// take only `world`: there is no rng parameter to misuse.

/** The girl injury-age curve (owner research 25.07, peak at 16); ages past the table
 *  fall to the `default` knob. See docs/research/injury-stats-by-age.md §3.1. */
export function ageInjuryFactor(ageYears: number): number {
  const table = ECONOMY.availability.ageInjuryFactor
  return table[ageYears] ?? table.default
}

/** Overuse multiplier for competed weeks in the trailing 4 (research §3.2). Index = count,
 *  clamped to the table's top (4+ straight weeks -> the max factor). */
export function consecutivePlayFactor(playedWeeks: number): number {
  const table = ECONOMY.availability.consecutivePlayFactor
  return table[Math.min(playedWeeks, table.length - 1)]
}

/** True when the kid is entered in an event scheduled for the CURRENT week. */
function enteredScheduledThisWeek(world: WorldState): boolean {
  return world.season.some((e) => e.week === world.week && world.entries.includes(e.id))
}

/** Competed weeks in the trailing 4 (incl. this one), counted from the KID's results ledger –
 *  pure state, zero draws. This week's run has not landed in the ledger yet at roll time, so it
 *  is read off entries+season instead. */
export function playedWeeksInTrailing4(world: WorldState): number {
  const weeks = new Set<number>()
  for (const r of world.results) {
    if (r.playerId === KID_ID && r.week > world.week - 4 && r.week <= world.week) weeks.add(r.week)
  }
  if (enteredScheduledThisWeek(world)) weeks.add(world.week)
  return weeks.size
}

/** The effective per-week injury chance (the occurrence roll's threshold). Pure state, zero
 *  draws: fatigue/age/load/play/physio are post-draw comparison operands, so none of them can
 *  move the draw sequence – only whether the (already drawn) roll counts as an injury. */
export function injuryTau(world: WorldState): number {
  const a = ECONOMY.availability
  const fatigue = 100 - world.condition
  let tau = clamp(a.injuryBaseChance + fatigue * a.injuryFatigueSlope, 0, a.injuryChanceCap)
  tau *= ageInjuryFactor(START_AGE_YEARS + Math.floor(world.week / 52))
  tau *= consecutivePlayFactor(playedWeeksInTrailing4(world))
  if (enteredScheduledThisWeek(world)) tau *= a.injuryPlayingMultiplier
  if (world.physioActive) tau *= ECONOMY.physio.riskReduction
  // Season planner: the resort/elite recovery buff is a POST-DRAW multiply on the threshold
  // (spec §2 "invariance-safe"), so the expensive package buys real protection without ever
  // touching the draw sequence.
  if (world.recoveryBuff && world.week <= world.recoveryBuff.untilWeek) tau *= world.recoveryBuff.factor
  return Math.min(tau, a.injuryChanceCap)
}

// Body-region weights (owner research 25.07): ~48% lower-limb / 28% upper / 24% core, with the
// WTA skew inside `lower` (girls' pattern = ankle+knee sprains take the majority of the lower
// share) and a lumbar bias inside `core` (teen back trouble). Flattened to one cumulative table
// so the region costs exactly ONE pull from the private injury generator.
const BODY_REGIONS: readonly { part: string; weight: number }[] = [
  { part: 'ankle', weight: 0.48 * 0.3 },
  { part: 'knee', weight: 0.48 * 0.25 },
  { part: 'hamstring', weight: 0.48 * 0.15 },
  { part: 'calf', weight: 0.48 * 0.12 },
  { part: 'foot', weight: 0.48 * 0.1 },
  { part: 'hip', weight: 0.48 * 0.08 },
  { part: 'wrist', weight: 0.28 * 0.25 },
  { part: 'shoulder', weight: 0.28 * 0.25 },
  { part: 'elbow', weight: 0.28 * 0.25 },
  { part: 'forearm', weight: 0.28 * 0.25 },
  { part: 'lower back', weight: 0.24 * 0.75 },
  { part: 'abdominal', weight: 0.24 * 0.25 },
]

function drawBodyRegion(rng: Rng): string {
  const u = rng() // exactly one pull
  let cum = 0
  for (const region of BODY_REGIONS) {
    cum += region.weight
    if (u < cum) return region.part
  }
  return BODY_REGIONS[BODY_REGIONS.length - 1].part
}

// kind = "<part> <descriptor>". A 1-week minor reads as a "niggle", a 2-week one as "soreness" –
// deterministic variety off the already-drawn weeks-out, no extra pull.
const SEVERITY_DESCRIPTOR: Record<InjurySeverity, string> = {
  minor: 'soreness',
  moderate: 'strain',
  major: 'stress reaction',
  severe: 'tear',
}

/** One medical bill in cents: draw the MIDDLE-anchored base from `band`, then map ONE uniform
 *  roll from the same physio generator into the background's medical corridor (mirrors
 *  travelBgFactor: same roll, disjoint corridors, so working < middle < wealthy per bill). */
function medicalBillCents(world: WorldState, rng: Rng, band: readonly [number, number]): number {
  const base = pickInt(rng, band[0], band[1])
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[world.profile.background]
  const roll = rng()
  return Math.round(base * (cLo + roll * (cHi - cLo)))
}

/** Weekly injury step (tick step 1c, FIRST – so playedThisWeek/accrueCondition see a walkover).
 *  Injured: count down; at 0 clear + log to injuryHistory + emit a 'recovery' event – the
 *  clearing week is a grace week (the occurrence roll only fires again next tick). Healthy: one
 *  UNCONDITIONAL occurrence roll off `seed:injury:week`; injured iff roll < injuryTau(world). */
export function rollInjury(world: WorldState): void {
  if (world.injury !== null) {
    world.injury.weeksRemaining -= 1
    if (world.injury.weeksRemaining <= 0) {
      const { kind, severity, totalWeeks } = world.injury
      world.injuryHistory.push({ kind, severity, week: world.week, weeksOut: totalWeeks })
      if (world.injuryHistory.length > 20) world.injuryHistory.splice(0, world.injuryHistory.length - 20)
      world.injury = null
      addEvent(world, { week: world.week, type: 'recovery', text: 'Back on court – cleared to play.' })
    }
    return
  }

  const injuryRng = rngFromSeed(`${world.seed}:injury:${world.week}`)
  const roll = injuryRng() // unconditional every healthy week – only tau moves
  if (roll >= injuryTau(world)) return

  // Injured. Severity band, weeks-out and body region pull from the SAME per-week generator
  // (invariance-safe: it is private to this (seed, week)).
  const bands = ECONOMY.availability.severityBands
  const sevRoll = injuryRng()
  const band = bands.find((b) => sevRoll < b.cum) ?? bands[bands.length - 1]
  let weeksOut = pickInt(injuryRng, band.weeksLo, band.weeksHi)
  const part = drawBodyRegion(injuryRng)
  if (world.physioActive) weeksOut = Math.max(1, Math.round(weeksOut * (1 - ECONOMY.physio.recoverySpeedup)))
  const descriptor = band.severity === 'minor' && weeksOut === 1 ? 'niggle' : SEVERITY_DESCRIPTOR[band.severity]
  const kind = `${part} ${descriptor}`
  world.injury = { kind, severity: band.severity, weeksRemaining: weeksOut, totalWeeks: weeksOut, sinceWeek: world.week }

  // One-time scans/treatment at onset, corridor-scaled off the physio sub-stream. minor draws
  // a $0 bill (band [0,0]) and emits no event – she just rests it off.
  const onsetCost = medicalBillCents(world, rngFromSeed(`${world.seed}:physio:${world.week}`), ECONOMY.physio.onsetCostCents[band.severity])
  if (onsetCost > 0) {
    world.fundsCents -= onsetCost
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'physio',
      text: 'Medical – scans and treatment',
      amountCents: -onsetCost,
    })
  }

  // Auto-withdraw every still-refundable (pre-deadline) entry: the family pulls out while the
  // fee can come back. Post-deadline entries forfeit their fee (withdrawEvent refuses past the
  // deadline) – if one lands on its play week while she is out, tickWeek emits the walkover.
  for (const id of [...world.entries]) {
    const e = eventById(world, id)
    if (e && world.week <= e.deadlineWeek) withdrawEvent(world, id)
  }

  // Season planner (spec §4): an injury cancels the practice weeks it swallows – the court
  // rental comes back in full ("no fee forfeit beyond the court rental"). Vacations are left
  // alone: a family week away is still rest, injured or not.
  const backAtWeek = world.week + weeksOut
  for (const p of [...world.practices]) {
    if (p.week >= world.week && p.week < backAtWeek) refundPractice(world, p, 'Injured')
  }

  const wks = `${weeksOut} wk${weeksOut === 1 ? '' : 's'}`
  addEvent(world, {
    week: world.week,
    type: 'injury',
    text:
      band.severity === 'severe'
        ? `Bad news from the clinic: ${kind} – out ~${wks}. The dream takes a hit.`
        : `Injury: ${kind} – out ~${wks}.`,
  })
}

/** Weekly physio/medical billing (tick step 1c, LAST). Injured weeks bill rehab regardless of
 *  the retainer toggle; a healthy week bills the retainer only while physioActive. Amounts are
 *  corridor-scaled draws off `seed:physio:week`; the expense event auto-folds into accrueFinance
 *  (Money breakdown) and the season-wrap funds delta. */
export function resolvePhysio(world: WorldState): void {
  const physioRng = rngFromSeed(`${world.seed}:physio:${world.week}`)
  let cost: number
  if (world.injury !== null) {
    cost = medicalBillCents(world, physioRng, ECONOMY.physio.rehabPerWeekCents)
  } else if (world.physioActive) {
    cost = medicalBillCents(world, physioRng, ECONOMY.physio.retainerPerWeekCents)
  } else {
    return
  }
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'physio',
    text: 'Physio / recovery session',
    amountCents: -cost,
  })
}

// --- Season planner: vacations + practice matches ------------------------------
// docs/specs/season-planner.md. TWO player-planned week types on otherwise empty weeks.
//
// RNG DISCIPLINE (the whole reason this slice is safe): a booking is PURE STATE. Prices are
// quoted from the purpose-scoped sub-streams `seed:vacation:week:packageId` /
// `seed:practice:week` (economy.ts), and the friendly itself runs on `seed:practicematch:week`
// – never the MAIN weekly stream. The B1/C1 freezes (count 45239 / hash 9f783705) therefore
// stay byte-identical no matter how much the parent plans; tests/planner.test.ts P1 re-proves
// it with a career that books something every single week.

/** The vacation booked for `week`, if any. */
export function vacationForWeek(world: WorldState, week: number): VacationBooking | undefined {
  return world.vacations.find((v) => v.week === week)
}

/** The practice match booked for `week`, if any. */
export function practiceForWeek(world: WorldState, week: number): PracticeBooking | undefined {
  return world.practices.find((p) => p.week === week)
}

/** The availability copy for a booked vacation week: "Family vacation – {package}" (spec §3). */
function vacationBlackoutDetail(booking: VacationBooking): string {
  return `Family vacation – ${vacationPackage(booking.packageId)?.label ?? booking.packageId}`
}

/** Guard shared by both booking commands: a plannable week is in the FUTURE, free of the kid's
 *  own entries and of another booking, and she is not laid up through it. Throws the
 *  player-facing reason (short dash copy). `kind` shapes the school/off-season rules: the
 *  off-season is family time (no friendlies) but IS the natural family-vacation week, and an
 *  exam block takes neither. */
function assertPlannable(world: WorldState, week: number, kind: 'vacation' | 'practice'): void {
  if (!Number.isInteger(week) || week <= world.week) throw new Error('Only a future week can be planned')
  if (world.injury !== null && week < world.week + world.injury.weeksRemaining) {
    throw new Error(`Injured – back in ${world.injury.weeksRemaining} weeks.`)
  }
  if (isExamWeek(week)) throw new Error('School exams that week – no matches, no trips')
  if (kind === 'practice' && isOffSeasonWeek(week)) throw new Error('Off-season – family time, no matches')
  if (vacationForWeek(world, week)) throw new Error('That week is already a family vacation')
  if (practiceForWeek(world, week)) throw new Error('A practice match is already booked that week')
  if (world.season.some((e) => e.week === week && world.entries.includes(e.id))) {
    throw new Error('She is entered in a tournament that week')
  }
}

/** Book a family vacation on an empty future week: charges the sub-stream quote (spec §2) and
 *  records the booking. The week becomes a hard blackout; the package's condition gain (and, for
 *  the two top packages, its recovery buff) lands when the week ticks. */
export function bookVacation(world: WorldState, week: number, packageId: string): void {
  const pkg = vacationPackage(packageId)
  if (!pkg) throw new Error('Unknown vacation package')
  assertPlannable(world, week, 'vacation')
  const priceCents = vacationPriceCents(world.seed, week, packageId, world.profile.background)
  if (world.fundsCents < priceCents) throw new Error('Not enough funds for that vacation')
  world.fundsCents -= priceCents
  world.vacations.push({ week, packageId, paidCents: priceCents })
  world.vacations.sort((a, b) => a.week - b.week)
  if (priceCents > 0) {
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'vacation',
      text: `Booked: ${pkg.label} – W${week}`,
      amountCents: -priceCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Family vacation booked – W${week} (${pkg.label})` })
}

/** Cancel a booked vacation before its week starts: FULL refund (mirror of entry withdrawal). */
export function cancelVacation(world: WorldState, week: number): void {
  const booking = vacationForWeek(world, week)
  if (!booking) throw new Error('No vacation booked that week')
  if (week <= world.week) throw new Error('That vacation week has already started')
  world.vacations = world.vacations.filter((v) => v !== booking)
  const label = vacationPackage(booking.packageId)?.label ?? booking.packageId
  if (booking.paidCents > 0) {
    world.fundsCents += booking.paidCents
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'vacation',
      text: `Vacation refunded: ${label}`,
      amountCents: booking.paidCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Cancelled the family vacation – W${week}` })
}

/** Book a practice match (a watchable friendly) on an empty future week: charges the court
 *  rental off the `:practice:` sub-stream, plus half a coaching session when the coach comes
 *  along. NEVER blocked by the fatigue guardrail – the caution is advice, not a veto (owner:
 *  "the parent may push, the game warns"); see practiceCaution. */
export function bookPractice(world: WorldState, week: number, withCoach: boolean): void {
  assertPlannable(world, week, 'practice')
  const paidCents = practiceFeeCents(world.seed, week, world.profile.background, withCoach)
  if (world.fundsCents < paidCents) throw new Error('Not enough funds for the court rental')
  world.fundsCents -= paidCents
  world.practices.push({ week, paidCents, withCoach })
  world.practices.sort((a, b) => a.week - b.week)
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'practice',
    text: withCoach ? `Court rental + coach – practice match W${week}` : `Court rental – practice match W${week}`,
    amountCents: -paidCents,
  })
  addEvent(world, { week: world.week, type: 'entry', text: `Practice match booked – W${week}` })
}

/** Cancel a booked practice before its week starts: full refund of the rental. */
export function cancelPractice(world: WorldState, week: number): void {
  const booking = practiceForWeek(world, week)
  if (!booking) throw new Error('No practice match booked that week')
  if (week <= world.week) throw new Error('That practice week has already started')
  refundPractice(world, booking, 'Cancelled')
}

/** Drop a practice booking and hand the rental back (shared by the player cancel and the
 *  injury hook, so the money story is identical either way). */
function refundPractice(world: WorldState, booking: PracticeBooking, reason: 'Cancelled' | 'Injured'): void {
  world.practices = world.practices.filter((p) => p !== booking)
  world.fundsCents += booking.paidCents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'practice',
    text: `Court rental refunded – W${booking.week}`,
    amountCents: booking.paidCents,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text:
      reason === 'Injured'
        ? `Practice match called off – W${booking.week} (she is hurt)`
        : `Cancelled the practice match – W${booking.week}`,
  })
}

/** How many practice weeks run UNBROKEN immediately before `week` (pure, order-free). */
export function consecutivePracticeWeeks(practiceWeeks: readonly number[], week: number): number {
  const booked = new Set(practiceWeeks)
  let n = 0
  while (booked.has(week - 1 - n)) n++
  return n
}

/** The practice GUARDRAIL as a small pure predicate (fatigue-bench finding 25.07: practising
 *  every single week is self-destructive – mean condition 47, 41-44% of weeks under 40). It is a
 *  CAUTION, never a block: the confirm sheet spells the risk out and the Home chip reads the
 *  strain, but the parent may still push. Reasons: 'tired' (below ECONOMY.practice.cautionCondition)
 *  and 'streak' (this would be the cautionStreak-th match week in a row). */
export interface PracticeCaution {
  level: 'ok' | 'caution'
  reasons: Array<'tired' | 'streak'>
  /** player-facing warning copy (short dash), absent when clear */
  detail?: string
}
export function practiceCaution(input: {
  condition: number
  practiceWeeks: readonly number[]
  week: number
}): PracticeCaution {
  const p = ECONOMY.practice
  const reasons: Array<'tired' | 'streak'> = []
  if (input.condition < p.cautionCondition) reasons.push('tired')
  if (consecutivePracticeWeeks(input.practiceWeeks, input.week) >= p.cautionStreak - 1) reasons.push('streak')
  if (reasons.length === 0) return { level: 'ok', reasons }
  const parts: string[] = []
  // Owner's line: «Она уже вымотана – ещё матч?»
  if (reasons.includes('tired')) parts.push('She is already worn out – another match?')
  if (reasons.includes('streak')) parts.push(`${p.cautionStreak} match weeks in a row – that is how bodies break.`)
  return { level: 'caution', reasons, detail: parts.join(' ') }
}

/** Retire an expired recovery buff (pure state). Runs after the week's injury roll, so the last
 *  covered week still gets its protection. */
function expireRecoveryBuff(world: WorldState): void {
  if (world.recoveryBuff && world.week > world.recoveryBuff.untilWeek) world.recoveryBuff = null
}

/** Tick step 1c: resolve a booked vacation week – the package's condition gain on top of the
 *  free-week recovery accrueCondition already granted, plus the resort/elite carry-over buff.
 *  Runs even while she is injured: a family week away is still rest. */
function resolveVacation(world: WorldState): void {
  const booking = vacationForWeek(world, world.week)
  if (!booking) return
  const pkg = vacationPackage(booking.packageId)
  if (!pkg) return
  world.condition = clamp(world.condition + pkg.conditionGain, ECONOMY.condition.min, ECONOMY.condition.max)
  if (pkg.buffFactor < 1) {
    world.recoveryBuff = { untilWeek: world.week + ECONOMY.vacation.buffWeeks, factor: pkg.buffFactor }
  }
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      pkg.buffFactor < 1
        ? `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition, and the recovery holds for ${ECONOMY.vacation.buffWeeks} weeks.`
        : `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition.`,
  })
}

/** Pick the week's sparring partner: a cohort player from the kid's own neighbourhood of the
 *  standings (one draw on the private practice stream). Flavor + a fair hit-out, never a result. */
function pickSparringPartner(world: WorldState, rng: Rng): AiPlayer {
  const ranking = fullRanking(world).filter((r) => r.playerId !== KID_ID)
  const byId = new Map(world.cohort.map((p) => [p.id, p]))
  const kidIdx = Math.max(0, Math.min(ranking.length - 1, world.kidRank - 1))
  const lo = Math.max(0, kidIdx - 10)
  const hi = Math.min(ranking.length - 1, kidIdx + 10)
  const pick = pickInt(rng, lo, hi) // exactly one pull
  return byId.get(ranking[pick]?.playerId ?? '') ?? world.cohort[0]
}

/** Tick step 1c: play a booked practice match. A watchable friendly through the SAME record
 *  shape a tournament match uses (MatchReplay re-simulates from the stored seed), ZERO ranking
 *  points, and the spec's drain: `max(1, local-scoreline drain − 1)` – a friendly is one lighter
 *  than the same match at a local, never free. Injury cancels the week (the rental was already
 *  refunded at onset); the friendly runs on the private `seed:practicematch:week` stream, so it
 *  adds no MAIN-stream draws. */
function resolvePractice(world: WorldState): void {
  const booking = practiceForWeek(world, world.week)
  if (!booking) return
  if (world.injury !== null) {
    refundPractice(world, booking, 'Injured')
    return
  }
  const rng = rngFromSeed(`${world.seed}:practicematch:${world.week}`)
  const opponent = pickSparringPartner(world, rng)
  // She hits at her CURRENT condition, exactly like a tournament run (R9-19 coupling).
  const factor = conditionMatchFactor(world.condition)
  const raw = kidMatchPlayer(world)
  const kid: MatchPlayer = {
    ...raw,
    serve: raw.serve * factor,
    ret: raw.ret * factor,
    composure: raw.composure * factor,
    stamina: raw.stamina * factor,
  }
  const opp: MatchPlayer = {
    id: opponent.id,
    name: opponent.name,
    serve: opponent.serve,
    ret: opponent.ret,
    composure: opponent.composure,
    stamina: opponent.stamina,
  }
  const surface: Surface = 'hard' // the home club's courts
  const seed = `${world.seed}:practicematch:${world.week}:m`
  const result = simulateMatch(kid, opp, { surface, tour: JUNIOR_TOUR, seed })
  const score = result.sets.map((s) => `${s.a}-${s.b}`).join(' ')
  const kidWon = result.winner === 0
  // The spec's drain rule, graded off the real scoreline via the SAME matchDrain the tour uses.
  const drain = Math.max(1, matchDrain('local', score) - 1)
  world.condition = clamp(world.condition - drain, ECONOMY.condition.min, ECONOMY.condition.max)
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  addEvent(world, {
    week: world.week,
    type: 'match',
    friendly: true,
    text: `Practice match: ${kidShort} ${kidWon ? 'beat' : 'lost to'} ${formatShortName(opp.name)} ${score} – no ranking points`,
    match: {
      round: 0,
      aId: KID_ID,
      bId: opp.id,
      winnerId: kidWon ? KID_ID : opp.id,
      seed,
      score,
      eventId: `practice-w${world.week}`,
      surface,
      oppName: opp.name,
      a: { ...kid },
      b: { ...opp },
    },
  })
}

/** Housekeeping: bookings are kept for a short TRAILING window after their week resolves, not
 *  dropped on the spot – the guardrail's consecutive-practice streak (and the Home strain chip)
 *  has to be able to see "she already played the last two weeks". Bounded, so the save stays
 *  small no matter how long the career runs. */
const PLANNER_TRAIL_WEEKS = 4
function prunePlannerBookings(world: WorldState): void {
  const from = world.week - PLANNER_TRAIL_WEEKS
  world.vacations = world.vacations.filter((v) => v.week >= from)
  world.practices = world.practices.filter((p) => p.week >= from)
}

// --- weekly resolution pieces ------------------------------------------------
// R9-1: weekly savings interest on a POSITIVE balance, credited on the CARRIED-IN funds as
// the week opens – before any of this week's flows (refunds, contribution, costs). Emitted
// only when it rounds to >= 1 cent, under the dedicated income category 'interest'. Zero RNG.
function resolveInterest(world: WorldState): void {
  if (world.fundsCents <= 0) return
  const interest = Math.round(world.fundsCents * ECONOMY.savings.apyWeekly)
  if (interest < 1) return
  world.fundsCents += interest
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'interest',
    text: 'Savings interest',
    amountCents: interest,
  })
}

// The parent's weekly contribution to the budget. Runs BEFORE costs and draws no RNG.
function resolveParentIncome(world: WorldState): void {
  const income = PARENT_INCOME_CENTS[world.profile.background]
  world.fundsCents += income
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: "Parents' contribution",
    amountCents: income,
  })
}

function resolveBaseCosts(world: WorldState, rng: Rng): void {
  const [lo, hi] = EXPENSE_RANGE[world.profile.coachSetup]
  // Draw first (byte-identical MAIN-stream pickInt, background-independent), THEN scale by the
  // background's wealth corridor: ONE uniform roll from the private `seed:coachbg:week` sub-stream
  // maps into wealthCorridor[background] (mirrors travelBgFactor / medicalBgFactor – same roll,
  // disjoint corridors, so working < middle < wealthy holds per week). POST-draw multiply only,
  // so the main-stream draw count/order never depends on background.
  const [cLo, cHi] = ECONOMY.wealthCorridor[world.profile.background]
  const coachRoll = rngFromSeed(`${world.seed}:coachbg:${world.week}`)()
  const expense = Math.round(
    pickInt(rng, lo, hi) * planExpenseFactor(world.plan.train) * (cLo + coachRoll * (cHi - cLo)),
  )
  world.fundsCents -= expense
  const flavors = world.plan.train >= 70 ? trainFlavors(world.profile.background) : restFlavors(world.profile.background)
  const flavor = flavors[pickInt(rng, 0, flavors.length - 1)]
  addEvent(world, { week: world.week, type: 'expense', category: 'coaching', text: flavor, amountCents: -expense })
  // Local-sponsor cameo: the ROLL (and the gift draw when it hits) run for EVERY background so
  // the main-stream draw count is background-independent (round-7 keeps the draws exactly as they
  // were). The payout is now NEED-BASED: only an eligible (working) kid actually banks it; for
  // everyone else the drawn result is discarded – no funds move, no event.
  if (rng() < ECONOMY.sponsor.rollChance) {
    const [glo, ghi] = ECONOMY.sponsor.amountCents
    const gift = pickInt(rng, glo, ghi)
    if (ECONOMY.sponsor.eligible.includes(world.profile.background)) {
      world.fundsCents += gift
      addEvent(world, {
        week: world.week,
        type: 'income',
        category: 'sponsor',
        text: 'A local sponsor chipped in!',
        amountCents: gift,
      })
    }
  }
}

// Recurring gear line-items (round-7 a). Scheduled DETERMINISTICALLY off per-category
// purpose-scoped sub-streams – NEVER the main weekly `rng` – so they add zero main-stream
// draws and cohort drift / the RNG replay stay untouched. The product-sponsorship valve
// (round-7 amendment) reads the kid's cached rank AT PURCHASE TIME to subsidise gear for a
// well-ranked kid; the line-item is still emitted (halved / zeroed) so the Money breakdown
// shows the sponsor relationship instead of the cost simply vanishing.
function resolveGear(world: WorldState): void {
  const bg = world.profile.background
  for (const category of GEAR_CATEGORIES) {
    const hit = gearHitForWeek(world.seed, category, bg, world.week)
    if (!hit) continue
    const line = ECONOMY.gear[category]
    let amount = hit.amountCents
    let text = line.flavor[bg]
    if (world.kidRank <= ECONOMY.sponsorship.freeMaxRank) {
      amount = 0
      text += ' – covered by your racket sponsor'
    } else if (world.kidRank <= ECONOMY.sponsorship.halfPriceMaxRank) {
      amount = Math.round(amount / 2)
      text += ' – sponsor covers half'
    }
    world.fundsCents -= amount
    // `-amount` would be -0 for a fully-covered item; keep it +0 so the event/ledger stay clean.
    addEvent(world, { week: world.week, type: 'expense', category: line.breakdown, text, amountCents: amount === 0 ? 0 : -amount })
  }
}

function chargeTravel(world: WorldState, event: SeasonEvent): void {
  world.fundsCents -= event.travelCostCents
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'travel',
    text: `Travel to ${TIERS[event.tier].label}`,
    amountCents: -event.travelCostCents,
  })
}

// The kid's tournament run. Uses an EVENT-SCOPED sub-RNG only (never the main
// weekly stream) so entering or skipping never perturbs cohort drift / AI results.
/** "2-6 6-4 1-6" -> "6-2 4-6 6-1" */
export function flipScore(score: string): string {
  return score
    .split(' ')
    .map((set) => set.split('-').reverse().join('-'))
    .join(' ')
}

function fallbackPlayer(id: string): MatchPlayer {
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50 }
}

// The kid's matches within a full result, in round order (she plays once per round she survives).
function kidMatchesOf(result: TournamentResult): MatchRecord[] {
  return result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
}

// One kid match rendered as a News `match` event: identical text/shape to the old inline
// resolution. Skill snapshots come from the pre-drift `players` map so the record is stable.
function kidMatchEvent(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): { text: string; match: WorldMatch } {
  const tier = TIERS[event.tier]
  const oppId = m.aId === KID_ID ? m.bId : m.aId
  const oppName = (players[oppId] ?? fallbackPlayer(oppId)).name
  const kidWon = m.winnerId === KID_ID
  const stage = stageLabel(m.round, tier.drawSize)
  // MatchRecord scores are from bracket side A's perspective; news reads from the kid's.
  const kidScore = m.score && m.bId === KID_ID ? flipScore(m.score) : m.score
  // Short names for EVERYONE: cohort names are "First Last"; the kid's full name is
  // kidName + last name (kidMatchPlayer only carries the first name).
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  const a = { ...(players[m.aId] ?? fallbackPlayer(m.aId)) }
  const b = { ...(players[m.bId] ?? fallbackPlayer(m.bId)) }
  return {
    text: `${stage}: ${kidShort} ${kidWon ? 'beat' : 'lost to'} ${formatShortName(oppName)} ${kidScore ?? ''}`.trim(),
    match: { ...m, eventId: event.id, surface: event.surface, oppName, a, b },
  }
}

// Compute the kid's full shadow tournament: byte-identical to the old inline resolution (same
// event-scoped RNG, same entrant selection, same bracket). Emits NO events and awards NO points –
// that is deferred to reveal/finalize. Snapshots the kid + every opponent she faces at PRE-drift
// skills so the revealed match records are stable no matter how the cohort drifts afterwards.
function computeShadowTournament(
  world: WorldState,
  event: SeasonEvent,
  ranking: RankingRow[],
): PendingTournament {
  // R9-19 coupling ON: the kid plays at her CURRENT condition (post this week's accrual –
  // step 1c runs before step 2). The SCALED player is both what runs the bracket and what is
  // snapshotted into `players`, so revealed records and replays stay byte-identical no matter
  // how her condition moves afterwards. Fractional skills are fine for the match engine.
  const factor = conditionMatchFactor(world.condition)
  const raw = kidMatchPlayer(world)
  const kid: MatchPlayer = {
    ...raw,
    serve: raw.serve * factor,
    ret: raw.ret * factor,
    composure: raw.composure * factor,
    stamina: raw.stamina * factor,
  }
  const kidRng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const entrants = selectEntrants(event, world.cohort, ranking, kidRng)
  const result = runTournament(event, entrants, kid, world.seed, kidRng)
  const players: Record<string, MatchPlayer> = { [KID_ID]: { ...kid } }
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = entrants.find((p) => p.id === oppId)
    players[oppId] = ai
      ? { id: ai.id, name: ai.name, serve: ai.serve, ret: ai.ret, composure: ai.composure, stamina: ai.stamina }
      : fallbackPlayer(oppId)
  }
  return { eventId: event.id, result, revealedRounds: 0, finished: false, players }
}

// Step 5 of a resolved week: recompute the kid's rank vs the whole field and fire rank milestones.
// Shared by a normal tick (inline) and finalizeTournament (deferred for a reveal week).
function recomputeRankAndMilestones(world: WorldState): void {
  world.prevKidRank = world.kidRank
  const full = computeRanking(world.results, world.week, [...cohortIds(world), KID_ID])
  const kidRow = full.find((r) => r.playerId === KID_ID)
  world.kidRank = kidRow?.rank ?? full.length
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
  ensureSeason(world)
}

/** The clause appended to a tournament summary that explains the EFFECTIVE ranking change
 *  (round-5 item 1a). `delta` is the change in the kid's windowed best-6 sum caused by the
 *  new result: `points` when nothing was displaced, `points − displaced` when a counted
 *  result was pushed out, `0` when the result didn't crack the best 6. */
export function rankingDeltaSuffix(points: number, delta: number): string {
  if (points <= 0) return ''
  if (delta <= 0) return ' (does not improve best 6)'
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

  // v10: remember the kid's best (smallest) finish index per tier – drives the Home season strip.
  const priorBest = world.bestFinishByTier[event.tier]
  if (priorBest === undefined || kidFinish < priorBest) world.bestFinishByTier[event.tier] = kidFinish

  // v10: count this season's kid wins/losses as they resolve (never re-parsed from text; pruning
  // can't lose them). Every match on the kid's path is one played match.
  for (const m of p.result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    if (m.winnerId === KID_ID) world.seasonWins++
    else world.seasonLosses++
  }

  // R9-7: the run's physical toll lands HERE, when it commits – per-match, not flat per tier.
  // A skipped event week (R9-9) or a walkover never reaches finalize, so neither costs strain.
  world.condition = clamp(
    world.condition - tournamentRunStrain(event.tier, kidMatchesOf(p.result)),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )

  // Effective ranking delta = kid's windowed best-6 sum after adding the result minus before.
  const before = windowedBestSum(world.results, world.week, KID_ID)
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: event.tier })
  const after = windowedBestSum(world.results, world.week, KID_ID)
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text:
      `${tier.label} (${event.surface}, W${event.week}): ${world.profile.kidName} – ` +
      `${finishLabel(kidFinish)} (+${points} pts)${rankingDeltaSuffix(points, after - before)}`,
    finishIdx: kidFinish,
  })
  // World news: who actually took the title of the draw she played in. When the kid IS the
  // champion, the summary + first-title milestone already celebrate it, so only report others.
  const championId = Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0]
  if (championId && championId !== KID_ID) {
    const champName = world.cohort.find((c) => c.id === championId)?.name ?? p.players[championId]?.name ?? championId
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `🏆 ${formatShortName(champName)} won the ${tier.label} (${event.surface}).`,
    })
  }
  if (kidFinish === 0) fireMilestone(world, 'first-title', `🏆 First career title: ${tier.label}!`)
  if (
    event.tier === 'national' &&
    p.result.matches.some((m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID)
  ) {
    fireMilestone(world, 'first-national', '🏆 First win at National level!')
  }
  recomputeRankAndMilestones(world)
  housekeep(world)
  p.finished = true
}

/** Reveal ONE more kid match: emit its News `match` event, bump `revealedRounds`, and finalize the
 *  run once the kid's last match (elimination or the final) has been shown. Idempotent when done. */
export function revealTournamentRound(world: WorldState): void {
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
  const ev = kidMatchEvent(world, event, m, p.players)
  addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
  p.revealedRounds++
  if (p.revealedRounds >= kidMatches.length) finalizeTournament(world)
}

/** Reveal every remaining round at once, then finalize – the "Skip tournament" path to the finale. */
export function skipTournament(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  while (p.revealedRounds < kidMatches.length) {
    const ev = kidMatchEvent(world, event, kidMatches[p.revealedRounds], p.players)
    addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
    p.revealedRounds++
  }
  finalizeTournament(world)
}

/** Dismiss a finished reveal (the finale's "Continue"): clear the pending state so the week closes. */
export function closeTournament(world: WorldState): void {
  world.pendingTournament = null
}

// The canonical AI-only bracket for one event. Runs on the MAIN stream with a fixed
// draw pattern (independent of the kid), awarding AI points into the results ledger.
function runAiTournament(world: WorldState, event: SeasonEvent, aiRanking: RankingRow[], rng: Rng): void {
  const entrants = selectEntrants(event, world.cohort, aiRanking, rng)
  const result = runTournament(event, entrants, null, world.seed, rng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    const points = pts[finish]
    if (points > 0) world.results.push({ playerId, week: world.week, points })
  }
}

function pruneResults(world: WorldState): void {
  world.results = world.results.filter((r) => world.week - r.week <= RESULTS_WINDOW)
}

function pruneEvents(world: WorldState): void {
  if (world.events.length <= EVENTS_CAP) return
  const kept = world.events.filter((e) => e.keep)
  const rest = world.events.filter((e) => !e.keep)
  const overflow = world.events.length - EVENTS_CAP
  const trimmed = overflow >= rest.length ? [] : rest.slice(overflow)
  world.events = [...kept, ...trimmed].sort((a, b) => a.id - b.id)
}

// Drop finance-ledger weeks older than the 60-week trailing window (retain week >= week - 59).
// Bounded by career length, not event volume, so it stays ≤ ~60 entries no matter the season.
function pruneFinanceWeeks(world: WorldState): void {
  world.financeWeeks = world.financeWeeks.filter((w) => w.week >= world.week - (FINANCE_WEEKS - 1))
}

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
    fundsCents,
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
    pendingTournament: null,
    bestFinishByTier: {},
    lastSeasonSummary: null,
    seasonWins: 0,
    seasonLosses: 0,
    financeWeeks: [],
    condition: ECONOMY.condition.start,
    injury: null,
    injuryHistory: [],
    physioActive: profile.coachSetup === 'hired',
    vacations: [],
    practices: [],
    recoveryBuff: null,
  }
  addEvent(world, {
    week: 0,
    type: 'info',
    keep: true,
    text: `${profile.kidName}'s career started (seed "${seed}"). Family budget: $${(fundsCents / 100).toLocaleString('en-US')}.`,
  })
  ensureSeason(world)
  recomputeKidRank(world)
  return world
}

/** Hydrate the Phase-3 systems onto a pre-v6 save. Idempotent for v6+. */
export function seedWorldForV6(save: Partial<WorldState> & { seed: string; week: number; log?: string[] }): void {
  save.cohort = generateCohort(save.seed)
  save.results = []
  save.entries = []
  save.season = []
  save.nextEventId = 0
  const oldLog = Array.isArray(save.log) ? save.log : []
  save.events = oldLog.map((text) => ({ id: save.nextEventId!++, week: save.week, type: 'info' as const, text }))
  save.kidRank = save.cohort.length + 1
  save.pendingTournament = null
  save.bestFinishByTier = {}
  save.lastSeasonSummary = null
  save.seasonWins = 0
  save.seasonLosses = 0
  save.financeWeeks = []
  save.condition = ECONOMY.condition.start
  save.injury = null
  save.injuryHistory = []
  save.physioActive = save.profile?.coachSetup === 'hired'
  save.vacations = []
  save.practices = []
  save.recoveryBuff = null
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  delete save.log
}

// --- Round-8 R8-7a: entry lists close at the deadline --------------------------
// Real-world rule (owner 25.07): players out of band at close are removed and refunded.
// If the kid's points have grown OUT of a tier's band while she still holds a
// still-refundable (pre-deadline) entry of that tier, the organisers release the entry
// at the top of the weekly tick: full refund via the existing withdrawEvent (mirror of
// slice C's injury auto-withdraw) + an info beat. A POST-deadline entry is never touched
// – the list closed with her in band, the fee is committed and the event still plays.
// Pure state, ZERO RNG draws – the B1/C1 main-stream invariance freezes stay untouched.
function releaseOutgrownEntries(world: WorldState): void {
  if (world.entries.length === 0) return
  const points = kidPoints(world)
  for (const id of [...world.entries]) {
    const event = eventById(world, id)
    if (!event || world.week > event.deadlineWeek) continue // closed list – fee committed
    if (points <= TIERS[event.tier].enterPointBand[1]) continue // still inside (or under) the band
    withdrawEvent(world, id)
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `Entry released – she's outgrown ${TIERS[event.tier].label}. Fee refunded.`,
    })
  }
}

// Full weekly resolution. Draw order on the MAIN stream is fixed per week regardless
// of player input: base costs → (kid tournament uses an event-scoped RNG, zero main
// draws) → cohort drift → canonical AI tournaments for every scheduled event.
//
// When the kid has an entered event this week the resolution PAUSES: the shadow tournament is
// computed (byte-identical to the old inline run) and stashed in `world.pendingTournament`, but its
// match/summary/milestone events, ranking points and the week's rank recompute are all deferred to
// the reveal/finalize flow (revealTournamentRound / skipTournament). The main-stream work (base
// costs, drift, AI brackets) still runs, so the per-week draw count is unchanged.
export function tickWeek(world: WorldState, rng: Rng): void {
  world.week += 1

  // 0a0. R9-1: savings interest on the carried-in balance. ZERO draws.
  resolveInterest(world)

  // 0a. Round-8 R8-7a: release (refund) still-refundable entries whose tier she has
  //     outgrown. Pure state, ZERO draws, so it sits safely ahead of every RNG step.
  releaseOutgrownEntries(world)

  // 0. parent's weekly contribution BEFORE costs (no RNG draw)
  resolveParentIncome(world)

  // 1. base costs (main stream, plan-independent draw count)
  resolveBaseCosts(world, rng)

  // 1b. recurring gear line-items (round-7 a). Zero main-stream draws – purpose-scoped
  //     sub-streams only – so this never perturbs the weekly draw count.
  resolveGear(world)

  // 1c. Season-Life availability. ZERO main-stream draws: rollInjury/resolvePhysio pull only
  //     from the private per-week `:injury:`/`:physio:` sub-streams and accrueCondition is pure
  //     arithmetic. Sits here (not inside the pendingTournament block) so it runs exactly once
  //     per real week, reveal weeks included. rollInjury runs FIRST so a fresh injury reads as
  //     the walkover it is (played = false ⇒ she keeps the match-free slider bonus). R9-7:
  //     match fatigue no longer accrues here – it lands per-match at finalizeTournament, so a
  //     walkover/skipped week costs none by construction.
  //     Season planner (v13): the booked week types resolve INSIDE this step, on private
  //     sub-streams only. Order matters – rollInjury first (so an injury can still cancel the
  //     friendly and refund the court), then the week-type accrual, then the vacation gain /
  //     the friendly's drain, exactly like finalizeTournament applies its strain after accrual.
  rollInjury(world)
  expireRecoveryBuff(world)
  const playedThisWeek =
    world.season.some((e) => e.week === world.week && world.entries.includes(e.id)) &&
    world.injury === null // injured on the play week => walkover
  accrueCondition(world, playedThisWeek)
  resolveVacation(world)
  resolvePractice(world)
  resolvePhysio(world)

  const ids = cohortIds(world)
  const scheduled = world.season.filter((e) => e.week === world.week)
  // Canonical ranking excludes the kid so AI-field selection (and thus its main-stream
  // draw count) never depends on the kid's own results / entry history.
  const aiRanking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    ids,
  )

  // 2. the kid's entered event this week (event-scoped RNG only): charge travel and stash the
  //    fully-computed shadow tournament. Nothing kid-specific is emitted/awarded here – the flow does.
  const enteredThisWeek = scheduled.find((e) => world.entries.includes(e.id))
  // An injury turns an entered event into a walkover: no travel, no shadow run, 0 points.
  // Only a POST-deadline entry can still be live here – pre-deadline entries were auto-withdrawn
  // (and refunded) at onset by rollInjury; past the deadline the fee is forfeited (withdrawEvent
  // refuses), so the walkover event is all that remains of the trip that never happened.
  if (enteredThisWeek && world.injury === null) {
    chargeTravel(world, enteredThisWeek)
    world.pendingTournament = computeShadowTournament(world, enteredThisWeek, aiRanking)
  } else if (enteredThisWeek) {
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Walkover: too injured to play the ${TIERS[enteredThisWeek.tier].label} – 0 pts, entry fee forfeited.`,
    })
  }

  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  driftCohort(world.cohort, rng)

  // 4. canonical AI tournaments for ALL scheduled events (main stream, fixed pattern)
  for (const e of scheduled) runAiTournament(world, e, aiRanking, rng)

  // 5-6. rank recompute + housekeeping. For a reveal week these are deferred to finalizeTournament
  //      (after the kid's points land), so the rank milestones keep their id order behind the kid's
  //      match/summary events. A normal week resolves them inline as before.
  if (!world.pendingTournament) {
    recomputeRankAndMilestones(world)
    housekeep(world)
    maybeFireSeasonWrapUp(world)
  }
}

/** The kid's EARNED ranking points: her windowed best-6 sum at the current week – the same value
 *  `computeRanking` assigns her, an absolute measure of achievement (a fresh kid = 0). Derived on the
 *  fly from the results ledger (no persisted state → no schema bump); the eligibility ladder reads it. */
export function kidPoints(world: WorldState): number {
  return windowedBestSum(world.results, world.week, KID_ID)
}

/** Pure eligibility check for a tier (Phase-4 "Season Life" slice 1, increment 2). A tier is a WINDOW
 *  `[minPoints, maxPoints]` on the kid's EARNED ranking points: eligible ⇔ the points sit inside the
 *  band. Points (not dense-rank POSITION) so a fresh/point-less kid starts at the BOTTOM (local only)
 *  and climbs local → regional → national as she earns results. No world/RNG dependency, so the bench
 *  and tests call it directly. */
export function isTierEligible(tier: TierId, points: number): boolean {
  const [minPoints, maxPoints] = TIERS[tier].enterPointBand
  return minPoints <= points && points <= maxPoints
}

/** Enter the kid in a scheduled event: validates deadline / funds / duplicates / ranking
 *  eligibility, then charges the fee immediately (expense event) and records the entry (entry
 *  event). Eligibility is direction-aware: too low to qualify vs graduated out of the tier. */
export function enterEvent(world: WorldState, eventId: string): void {
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.entries.includes(eventId)) throw new Error('Already entered this event')
  if (world.week > event.deadlineWeek) throw new Error('Entry deadline has passed')
  const fee = TIERS[event.tier].entryFeeCents
  if (world.fundsCents < fee) throw new Error('Not enough funds for the entry fee')
  const [minPoints, maxPoints] = TIERS[event.tier].enterPointBand
  const points = kidPoints(world)
  if (points < minPoints) {
    throw new Error(`Not enough ranking points for ${TIERS[event.tier].label} yet (need ${minPoints})`)
  }
  if (points > maxPoints) {
    throw new Error(`You've outgrown ${TIERS[event.tier].label} (${points} pts)`)
  }
  // Season-Life availability gate (slice B): same helper the UI + advance read, so they can't
  // desync. Only a HARD block (injured / school exams) stops entry; fatigue is a soft, warned
  // CHOICE (level 'caution'), so racing tired is allowed – its cost is emergent, not a veto.
  const availability = availabilityStatus(world, event)
  if (availability.level === 'blocked') throw new Error(availability.detail ?? 'Unavailable this week')
  // Season planner: the real thing wins over the friendly. A practice match booked on this week
  // gives way (rental refunded in full) instead of stacking a friendly onto a tournament week –
  // she can only play one week's worth of tennis. A booked VACATION can't collide: it is a hard
  // availability block, so the guard above already refused.
  const collidingPractice = practiceForWeek(world, event.week)
  if (collidingPractice) refundPractice(world, collidingPractice, 'Cancelled')
  world.fundsCents -= fee
  world.entries.push(eventId)
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'entry',
    text: `Entry fee: ${TIERS[event.tier].label} (W${event.week})`,
    amountCents: -fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Entered ${TIERS[event.tier].label} – W${event.week} (${event.surface})`,
  })
}

/** Withdraw before the deadline: refunds the fee (income event) + records it (entry event). */
export function withdrawEvent(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.week > event.deadlineWeek) throw new Error('Cannot withdraw after the deadline')
  const fee = TIERS[event.tier].entryFeeCents
  world.fundsCents += fee
  world.entries = world.entries.filter((id) => id !== eventId)
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: `Entry refunded: ${TIERS[event.tier].label}`,
    amountCents: fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Withdrew from ${TIERS[event.tier].label} – W${event.week}`,
  })
}

/** R9-9: skip an entered tournament AT its event week – entering the begin flow is no longer a
 *  one-way door. A POST-deadline withdrawal, real-world style: the entry fee stays committed
 *  (the list closed with her on it), the travel charge tickWeek took is refunded in full (she
 *  never boards), NO run is committed (no points, no W-L, no strain – the shadow result is
 *  discarded), and the week then closes exactly like a normal non-playing week (the same
 *  deferred steps finalizeTournament would have run). Only callable before the first reveal;
 *  once a match has been shown the run is under way. Zero draws – the discarded shadow already
 *  ran on its event-scoped stream, so the MAIN weekly sequence is untouched either way. */
export function skipEvent(world: WorldState, eventId: string): void {
  const p = world.pendingTournament
  if (!p || p.eventId !== eventId) throw new Error('No tournament to skip this week')
  if (p.finished || p.revealedRounds > 0) throw new Error('The tournament is already under way')
  const event = eventById(world, eventId)
  if (!event) {
    // calendar lost the event (defensive – finalize handles this the same way): just clear.
    world.pendingTournament = null
    return
  }
  world.fundsCents += event.travelCostCents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'travel',
    text: `Travel refunded: ${TIERS[event.tier].label}`,
    amountCents: event.travelCostCents,
  })
  world.entries = world.entries.filter((id) => id !== eventId)
  world.pendingTournament = null
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Skipped ${TIERS[event.tier].label} – entry fee forfeited.`,
  })
  // The week ends match-free after all, so she earns the slider recovery bonus that tickWeek
  // withheld when it still believed she would play (accrueCondition ran with played = true).
  // Integer, clamped – "the week then resolves as a normal non-playing week".
  world.condition = clamp(
    world.condition + restRecoveryBonus(world.plan.rest),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // Close the week: the rank recompute + housekeeping that tickWeek deferred to the flow.
  recomputeRankAndMilestones(world)
  housekeep(world)
}

/** Tick up to `weeks`, stopping early when a tournament week spawns a reveal (the week is not
 *  closed until it resolves), an imminent affordable regional+ deadline appears, or funds cross
 *  below zero. A reveal already in progress blocks any advance until it is closed. */
export function advanceWeeks(world: WorldState, rng: Rng, weeks: number): StopReason | undefined {
  // A pending reveal must resolve (and close) before time moves on.
  if (world.pendingTournament) return 'tournament'
  let stopReason: StopReason | undefined
  for (let i = 0; i < weeks; i++) {
    const nextWeek = world.week + 1
    // Pre-tick guards bite only after the first tick, so a single step always progresses.
    if (i > 0) {
      // Round-9 leftover FIX (owner-visible bug, season-planner slice): the stop must only fire
      // for an event she could ACTUALLY enter. The availability gate alone let the sim halt at
      // W1/W3 with 0 points for regional/national deadlines she was nowhere near qualifying for,
      // so the point-band eligibility is now AND-ed in – the same isTierEligible enterEvent uses,
      // which also silences a tier she has OUTGROWN (points past the ceiling).
      const points = kidPoints(world)
      const deadlineSoon = world.season.some(
        (e) =>
          (e.tier === 'regional' || e.tier === 'national') &&
          !world.entries.includes(e.id) &&
          world.fundsCents >= TIERS[e.tier].entryFeeCents &&
          (e.deadlineWeek === world.week || e.deadlineWeek === nextWeek) &&
          isTierEligible(e.tier, points) &&
          // Season-Life: don't stop-for-deadline only on an event she HARD-cannot enter (school
          // exams, a booked family vacation, or injured in Slice C). A fatigued event is still
          // enterable (soft caution), so the sim MAY stop so the player can make the tough call.
          availabilityStatus(world, e).level !== 'blocked',
      )
      if (deadlineSoon) {
        stopReason = 'deadline'
        break
      }
    }
    tickWeek(world, rng)
    // A tournament this week paused the resolution: stop so the flow can take over.
    if (world.pendingTournament) {
      stopReason = 'tournament'
      break
    }
    // Season just wrapped up (the tick landed on the year's first off-season week, week 49 of
    // the year): stop AFTER the wrap-up resolved, before week 50, so the season-summary popup
    // shows. Off-season weeks never carry a tournament, so this can't collide with 'tournament'.
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) {
      stopReason = 'season-end'
      break
    }
    // A FRESH injury (onset this very tick) halts the advance so the medical event surfaces;
    // an ongoing recovery never re-stops the sim on every week she sits out.
    if (world.injury !== null && world.injury.sinceWeek === world.week) {
      stopReason = 'injury'
      break
    }
    if (world.fundsCents < 0) {
      stopReason = 'funds'
      break
    }
  }
  return stopReason
}

// --- snapshot ----------------------------------------------------------------
function upcomingEvents(world: WorldState): UpcomingEvent[] {
  const entered = new Set(world.entries)
  const points = kidPoints(world)
  return world.season
    .filter((e) => e.week > world.week && e.week <= world.week + UPCOMING_WEEKS)
    .sort((a, b) => a.week - b.week)
    .map((e) => {
      // Snapshot-only points eligibility (no persisted state → no schema bump). `ineligibleReason`
      // names which side of the band the kid failed: 'locked' = not enough ranking points yet,
      // 'outgrown' = too good (past the tier's ceiling) now. Season-Life slice B then folds in the
      // availability gate via the SAME helper enterEvent uses, so the card and the engine agree.
      const pointEligible = isTierEligible(e.tier, points)
      const avail = availabilityStatus(world, e)
      // A fatigued event is a CAUTION, not a block: she stays eligible. Only a point-band failure or
      // a HARD availability block (injured / unavailable) removes eligibility.
      const eligible = pointEligible && avail.level !== 'blocked'
      const minPoints = TIERS[e.tier].enterPointBand[0]
      // Precedence matches enterEvent (point band first, then availability): the point-band reason
      // is the hard-lock headline; a hard availability block (injured/unavailable) only surfaces
      // once she is point-eligible; fatigue is surfaced separately as a soft caution.
      const reason = !pointEligible
        ? points < minPoints
          ? { ineligibleReason: 'locked' as const, pointsToEnter: minPoints }
          : { ineligibleReason: 'outgrown' as const }
        : avail.level === 'blocked'
          ? { ineligibleReason: avail.reason as 'injured' | 'unavailable' }
          : avail.level === 'caution'
            ? { cautionReason: avail.reason as 'fatigued', cautionDetail: avail.detail }
            : {}
      return {
        id: e.id,
        week: e.week,
        tier: e.tier,
        surface: e.surface,
        travelCostCents: e.travelCostCents,
        deadlineWeek: e.deadlineWeek,
        entryFeeCents: TIERS[e.tier].entryFeeCents,
        label: TIERS[e.tier].label,
        entered: entered.has(e.id),
        eligible,
        ...reason,
      }
    })
}

// The kid's counted best-6 results (round-5 item 1b): same window + sort as computeRanking,
// so their points sum equals the kid's standings points. Strongest first.
function computeCountingResults(world: WorldState): CountingResult[] {
  return world.results
    .filter(
      (r) => r.playerId === KID_ID && r.week <= world.week && world.week - r.week <= RESULTS_WINDOW,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .slice(0, 6)
    .map((r) => ({ week: r.week, tier: r.tier, points: r.points }))
}

function computeStandings(world: WorldState): StandingRow[] {
  const full = fullRanking(world)
  const meta = new Map<string, { name: string; nation: string }>()
  for (const p of world.cohort) meta.set(p.id, { name: p.name, nation: p.nation })
  // Full name so the UI can render "V. Last" for the kid like everyone else (formatShortName).
  meta.set(KID_ID, {
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    nation: world.profile.country,
  })
  const enrich = (r: RankingRow, gapBefore: boolean): StandingRow => {
    const m = meta.get(r.playerId) ?? { name: r.playerId, nation: '' }
    return { ...r, name: m.name, nation: m.nation, isKid: r.playerId === KID_ID, gapBefore }
  }
  // Top 10 + a window around the kid, as *positions in `full`* rather than as slices
  // deduped by id – tracking the underlying index (not the rank number) is what lets
  // `gapBefore` below tell a genuine omission from a competition-ranking tie-skip,
  // which also jumps the rank number by more than 1 without anyone being left out.
  const kidIdx = full.findIndex((r) => r.playerId === KID_ID)
  const topEnd = Math.min(10, full.length)
  const aroundStart = kidIdx >= 0 ? Math.max(0, kidIdx - 2) : -1
  const aroundEnd = kidIdx >= 0 ? Math.min(full.length, kidIdx + 3) : -1
  const includedIdx: number[] = []
  for (let i = 0; i < topEnd; i++) includedIdx.push(i)
  for (let i = Math.max(aroundStart, topEnd); i < aroundEnd; i++) includedIdx.push(i)
  return includedIdx.map((idx, pos) => enrich(full[idx], pos > 0 && idx !== includedIdx[pos - 1] + 1))
}

// Any id -> short display name, for anyone who could appear in a bracket (kid or AI),
// not just the kid's own opponents (unlike `players`, which only snapshots those).
function playerShortName(world: WorldState, id: string): string {
  if (id === KID_ID) return formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  const ai = world.cohort.find((c) => c.id === id)
  return formatShortName(ai?.name ?? id)
}

// The live view of an in-progress reveal (drives TournamentFlow). Lean: the revealed path, the
// current round's opponent + record, and the finale copy. Scorelines belong to the record and are
// never shown by the UI before a match has been watched/skipped.
function pendingView(world: WorldState): PendingView | undefined {
  const p = world.pendingTournament
  if (!p) return undefined
  const event = eventById(world, p.eventId)
  if (!event) return undefined
  const tier = TIERS[event.tier]
  const kidMatches = kidMatchesOf(p.result)
  const revealed = p.revealedRounds

  const bracket: PendingBracketRound[] = kidMatches.slice(0, revealed).map((m) => {
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    return {
      roundLabel: stageLabel(m.round, tier.drawSize),
      oppName: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      kidWon: m.winnerId === KID_ID,
      score: m.score && m.bId === KID_ID ? flipScore(m.score) : m.score,
    }
  })

  // Round 5 item 5: the FULL draw (every match, every player). During her run this is bounded
  // to the kid's played rounds (0..revealed-1; single elim, she plays every round until
  // eliminated) so later rounds stay spoiler-free. Round-7 (spectate): once her run is FINISHED
  // there are no spoilers left to protect, so the whole draw is exposed – every round through
  // the Final – letting the flow spectate the tournament to its conclusion past her exit.
  // `score` is always normalised to the WINNER's perspective (conventional "W d. L 6-4 ..."
  // reading) regardless of which bracket side (a/b) actually won – MatchRecord stores it
  // from side A's perspective, so it only needs flipping when B won.
  const lastRound = p.finished ? Math.max(...p.result.matches.map((m) => m.round)) : revealed - 1
  const fullBracket: FullBracketMatch[] =
    lastRound < 0
      ? []
      : p.result.matches
          .filter((m) => m.round <= lastRound)
          .map((m) => ({
            round: m.round,
            roundLabel: stageLabel(m.round, tier.drawSize),
            aId: m.aId,
            bId: m.bId,
            aName: playerShortName(world, m.aId),
            bName: playerShortName(world, m.bId),
            winnerId: m.winnerId,
            score: m.score && m.winnerId === m.bId ? flipScore(m.score) : m.score,
          }))

  // The round being presented: the next unrevealed match, or (finished) the last one played.
  const currentIdx = revealed < kidMatches.length ? revealed : kidMatches.length - 1
  const current = kidMatches[currentIdx]
  const oppId = current.aId === KID_ID ? current.bId : current.aId
  const ranks = new Map(fullRanking(world).map((r) => [r.playerId, r.rank]))
  const oppRank = ranks.get(oppId) ?? world.cohort.length + 1
  const oppNation = world.cohort.find((c) => c.id === oppId)?.nation ?? ''
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)

  return {
    eventId: p.eventId,
    tier: event.tier,
    surface: event.surface,
    roundLabel: stageLabel(current.round, tier.drawSize),
    opponent: {
      name: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      nation: oppNation,
      rank: oppRank,
    },
    // Only expose a record to watch while there is still an unrevealed round.
    kidMatch: revealed < kidMatches.length ? kidMatchEvent(world, event, current, p.players).match : undefined,
    bracket,
    fullBracket,
    finished: p.finished,
    kidChampion: kidFinish === 0,
    tierLabel: tier.label,
    points: tier.points[kidFinish] ?? 0,
    finishLabel: finishLabel(kidFinish),
  }
}

export function toSnapshot(world: WorldState, stopReason?: StopReason): Snapshot {
  const pending = pendingView(world)
  return {
    schemaVersion: world.schemaVersion,
    careerId: world.careerId,
    seed: world.seed,
    week: world.week,
    ageYears: START_AGE_YEARS + Math.floor(world.week / 52),
    fundsCents: world.fundsCents,
    profile: world.profile,
    plan: world.plan,
    condition: world.condition,
    // injury is always null in slice B; drop the persisted-only `sinceWeek` when surfacing it.
    injury: world.injury
      ? {
          kind: world.injury.kind,
          severity: world.injury.severity,
          weeksRemaining: world.injury.weeksRemaining,
          totalWeeks: world.injury.totalWeeks,
        }
      : null,
    physioActive: world.physioActive,
    events: world.events.slice(-SNAPSHOT_EVENTS),
    // Category-accurate windows off the persisted ledger (immune to the 60-event cap). season
    // keeps the current MoneyScreen semantics: the current 52-week season block from its first week.
    finance: {
      window12w: financeWindow(world.financeWeeks, world.week - 11),
      season: financeWindow(world.financeWeeks, Math.floor(world.week / 52) * 52),
    },
    financialEvents: world.events.filter((e) => e.amountCents !== undefined).slice(-SNAPSHOT_FINANCIAL_EVENTS),
    upcoming: upcomingEvents(world),
    // Season planner (v13): the bookings the calendar renders, plus the short trailing window the
    // guardrail's consecutive-practice read needs (the calendar only ever looks at future weeks,
    // so the tail is invisible there). Prices are re-derivable by the UI from the same pure quote
    // functions the engine charges (economy.ts), so nothing else is needed on the wire.
    vacations: world.vacations.map((v) => ({ ...v })),
    practices: world.practices.map((p) => ({ ...p })),
    recoveryBuff: world.recoveryBuff ? { ...world.recoveryBuff } : null,
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    countingResults: computeCountingResults(world),
    bestFinishByTier: { ...world.bestFinishByTier },
    // Round-8 (R6 debt): the running season W-L counters, already persisted since v10 –
    // surfacing them is derivation, not schema.
    seasonWins: world.seasonWins,
    seasonLosses: world.seasonLosses,
    lastSeasonSummary: world.lastSeasonSummary,
    ...(stopReason ? { stopReason } : {}),
    ...(pending ? { pending } : {}),
  }
}
