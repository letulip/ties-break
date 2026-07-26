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
import {
  TIERS,
  buildSeason,
  isBlackoutWeek,
  isExamWeek,
  isOffSeasonWeek,
  WEEKS_PER_YEAR,
  OFF_SEASON_WEEKS,
} from './season/calendar'
import { clamp, conditionMatchFactor, matchDrain, tournamentRunStrain } from './condition'
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
import { rivalConditions, rivalMatchPlayer } from './season/rival'
import { generatePreHistory } from './season/prehistory'
import { computeRanking, windowedBestSum, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament, JUNIOR_TOUR } from './season/tournament'
import { simulateMatch } from './match/engine'
import { applySurfaceStyle } from './match/style'

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
  /** The week a medical withdrawal fired, so advanceWeeks can halt ONCE on it. Derived, not
   *  meaningful state: optional, so every pre-existing save loads unchanged with no migration, and a
   *  reload simply re-derives it on the next tick that withdraws her. */
  medicalWithdrawalWeek?: number
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

/** THE COMPOSITION POINT: the kid exactly as she steps on court. Her raw build, scaled by the
 *  CONDITION factor (R9-19) and then by the surface x play-style table (docs/specs/surface-style.md).
 *  Both are pure arithmetic with ZERO RNG, they compose multiplicatively, and every path that puts
 *  her in a match – the shadow tournament, the practice friendly, the exhibition viewer – builds her
 *  here, so the modifiers land exactly once per match. `all-court` (and any untouched attribute)
 *  comes back byte-identical to the pre-slice condition-only scaling. */
export function kidMatchPlayerFor(
  world: { seed: string; profile: PlayerProfile; condition: number },
  surface: Surface,
): MatchPlayer {
  const raw = kidMatchPlayer(world)
  const factor = conditionMatchFactor(world.condition)
  return applySurfaceStyle(
    {
      ...raw,
      serve: raw.serve * factor,
      ret: raw.ret * factor,
      composure: raw.composure * factor,
      stamina: raw.stamina * factor,
    },
    world.profile.playStyle,
    surface,
  )
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
// The condition MATH (clamp / matchDrain / tournamentRunStrain / conditionMatchFactor) and the
// week-TYPE predicates (isExamWeek / isBlackoutWeek) were extracted to ./condition and
// ./season/calendar by the rival-life slice, so the AI cohort can run the SAME rules without a
// world.ts import cycle. They are re-exported here under their historical names – every existing
// call site and test import keeps working, and there is still exactly one implementation.
export { matchDrain, runFatigueExtra, tournamentRunStrain, conditionMatchFactor } from './condition'
export { isExamWeek, isBlackoutWeek } from './season/calendar'

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

/** The kid's age (whole years) in a given absolute week – the same arithmetic the snapshot uses. */
export function ageAtWeek(week: number): number {
  return START_AGE_YEARS + Math.floor(week / WEEKS_PER_YEAR)
}

/** Pure age gate for a tier (ladder-up): the junior tour is 13+, the domestic ladder has no
 *  minimum. No world/RNG dependency, so the childhood prologue and the tests call it directly. */
export function isTierAgeOpen(tier: TierId, ageYears: number): boolean {
  const minAge = TIERS[tier].minAgeYears
  return minAge === undefined || ageYears >= minAge
}

/** Whether the kid can currently ENTER `event`, at three levels. One helper, wired at three engine
 *  surfaces (enterEvent / upcomingEvents / advanceWeeks) so the gate can never desync. Precedence
 *  is injured > unavailable > medical > fatigued.
 *   - 'blocked' HARD stops entry: `injured` (she is already out), `unavailable` (school exams /
 *     off-season / a booked family vacation – WEEK-level reasons, so they name the week), and
 *     `medical` (the doctor's veto below ECONOMY.availability.medicalFloor).
 *   - 'caution' is a SOFT warning that still ALLOWS entry: `fatigued` (condition below the tier's
 *     floor). The owner's call: racing tired is a tough-parent CHOICE with emergent consequences
 *     (deeper condition hole now, higher injury risk), not a forbidden action.
 *   - 'ok' is clear.
 *
 *  The 'medical' branch (owner R9-19b, shipped with the Wave-2 tuning slice) is the FIRST hard
 *  body-gate in the game and the single exception to "the parent may push": under the floor she is
 *  not cleared to play at all. It sits far below every tier caution floor (20-45), so a normal
 *  career never meets it – it exists for the pathological zone the fatigue bench found (a
 *  self-coached grinder competing at condition 0 for ~4.4% of her weeks). */
export interface AvailabilityStatus {
  level: 'ok' | 'caution' | 'blocked'
  reason?: 'injured' | 'fatigued' | 'unavailable' | 'medical'
  detail?: string
}

/** What the doctor says about a body at `condition`, as ONE pure knob-driven rule read at BOTH
 *  medical surfaces – the entry gate (`availabilityStatus`) and the ARRIVAL check on the play week
 *  (`tickWeek` step 2). Owner 26.07:
 *    'withdraw' – under ECONOMY.availability.medicalFloor: not cleared, at any price. The single
 *                 exception to "the parent may push";
 *    'warn'     – in [medicalFloor, medicalWarningCeiling): she plays, and he warns the family
 *                 ("я вас предупреждаю о последствиях, формально запретить не могу");
 *    'clear'    – above the band: medicine has nothing to say (the tier fatigue caution still may).
 *  Pure integer comparison, zero RNG. A ceiling at or below the floor collapses the band to
 *  nothing, which is how the warning is switched off without touching the veto. */
export type MedicalClearance = 'withdraw' | 'warn' | 'clear'
export function medicalClearance(condition: number): MedicalClearance {
  const a = ECONOMY.availability
  if (condition < a.medicalFloor) return 'withdraw'
  if (condition < a.medicalWarningCeiling) return 'warn'
  return 'clear'
}
export function availabilityStatus(world: WorldState, event: SeasonEvent): AvailabilityStatus {
  // R10-17 (owner playtest 26.07 – "the news said she is out until week 21, but at week 22 and
  // every week after, no tournament could be entered"). A layoff is a RANGE OF WEEKS and the event
  // is weeks away, so the question this gate has to answer is "will she still be out IN
  // `event.week`?" – not "is she hurt TODAY?". Reading today's injury against a future event week
  // locked the ENTIRE 8-week horizon for the whole layoff, and because entry lists close two weeks
  // out, every list she could have joined on the way back had already shut by the time the lock
  // lifted – which is what made it feel permanent.
  //
  // The boundary is the one the planner's `assertPlannable` has always used (`week < world.week +
  // weeksRemaining`), so a tournament and a vacation now agree to the week about when she is back:
  // rollInjury clears the injury at the TOP of week `world.week + weeksRemaining`, BEFORE the
  // play-week check reads it, so that week is hers again. It is also exactly the week the UI has
  // been printing all along ("back wk {week + weeksRemaining}"), so the label and the lock finally
  // tell the same story. Note the CONDITION-driven branches below stay current-week reads: her
  // condition in a future week is unknowable, which is why the doctor re-checks her on arrival.
  if (world.injury !== null && event.week < world.week + world.injury.weeksRemaining) {
    return { level: 'blocked', reason: 'injured', detail: `Injured – back in ${world.injury.weeksRemaining} weeks.` }
  }
  // Ladder-up: the junior international tour opens at 13. Our detailed sim starts at 14, so this
  // never fires today – it is wired now so the childhood prologue (Phase 6) inherits the rule for
  // free instead of re-deriving it, and so the tier table stays the single source of truth.
  const minAge = TIERS[event.tier].minAgeYears
  if (minAge !== undefined && !isTierAgeOpen(event.tier, ageAtWeek(event.week))) {
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail: `${TIERS[event.tier].label} opens at ${minAge} – she is too young.`,
    }
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
  // THE DOCTOR'S VETO: under the medical floor no tier is enterable, at any price. Ranked AFTER
  // the week-level blackouts (a vacation/exam week is unenterable for everyone, so it names the
  // week) and BEFORE the soft fatigue caution, which it replaces in the pathological zone.
  if (medicalClearance(world.condition) === 'withdraw') {
    return { level: 'blocked', reason: 'medical', detail: 'Not cleared to play – she needs rest.' }
  }
  if (world.condition < ECONOMY.availability.minConditionToEnter[event.tier]) {
    return { level: 'caution', reason: 'fatigued', detail: 'Exhausted – racing risks injury.' }
  }
  return { level: 'ok' }
}

/** THE ENTRY GATE – the ONE rule that answers "may she enter THIS event, right now?".
 *
 *  Round-10 R10-5 (owner playtest): the tier POINT BAND used to be re-derived at every surface that
 *  needed it – inline in `enterEvent`, inline again in `upcomingEvents`, via `isTierEligible` in
 *  `advanceWeeks` – and absent from the fourth (the play-week resolution). `availabilityStatus`
 *  existed so the BODY/WEEK half could never desync, but nothing did that job for the band, so the
 *  band was free to drift, and it did: the owner was in a Local at 122 points (band [0, 85]) with no
 *  lock shown anywhere. This helper closes the hole – it is the only place the two halves are
 *  combined, and every gate reads it instead of re-deriving anything.
 *
 *  PRECEDENCE: the point band FIRST (it is the hard, permanent headline – "Reach N pts" /
 *  "Outgrown"), then availability (injured > unavailable > medical > fatigued). That is the order
 *  `enterEvent` threw in and the order `upcomingEvents` documented, so the wiring is a
 *  de-duplication, not a behaviour change.
 *
 *  SCOPE, and this is the subtle half of R10-5/R10-3: this gate governs ENTERING. It does NOT
 *  govern an entry already made. Once a list has CLOSED with her on it the fee is committed and the
 *  event plays (the owner's real-world rule, see `releaseOutgrownEntries`) – so a committed entry
 *  she has since outgrown is not "illegal", it is a decision that needs an exit, which is what
 *  `cancelEntry` (R10-13) is. Treating the entry gate's verdict as a lock on a committed entry is
 *  precisely what removed the escape and produced the R10-3 dead end.
 *
 *  Pure state, ZERO RNG draws. */
export interface EntryStatus {
  level: 'ok' | 'caution' | 'blocked'
  reason?: 'locked' | 'outgrown' | 'injured' | 'fatigued' | 'unavailable' | 'medical'
  detail?: string
  /** the tier's minPoints threshold, present only when 'locked' (so the UI can say "Reach N pts") */
  pointsToEnter?: number
}
export function entryStatus(world: WorldState, event: SeasonEvent): EntryStatus {
  const tier = TIERS[event.tier]
  const minPoints = tier.enterPointBand[0]
  const points = kidPoints(world)
  if (points < minPoints) {
    return {
      level: 'blocked',
      reason: 'locked',
      detail: `Not enough ranking points for ${tier.label} yet (need ${minPoints})`,
      pointsToEnter: minPoints,
    }
  }
  if (outgrewTier(event.tier, points)) {
    return { level: 'blocked', reason: 'outgrown', detail: `You've outgrown ${tier.label} (${points} pts)` }
  }
  return availabilityStatus(world, event)
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
 *  and 'streak' (a run of consecutive match weeks).
 *
 *  WAVE-2 RETUNE (bench 26.07): the streak arm is GATED on real strain – `cautionStreak` (3) in a
 *  row warns only below `cautionStreakCondition`, while `cautionStreakAlways` (4) in a row warns at
 *  any condition. It used to fire on a perfectly fresh kid (careful pushed through 8-11
 *  cautions/season at condition 92), which is how a warning becomes noise. */
export interface PracticeCaution {
  level: 'ok' | 'caution'
  reasons: Array<'tired' | 'streak'>
  /** how many match weeks in a row this booking would make (1 = the first) – so the chip and the
   *  sheet can NAME the run without re-deriving it. */
  streakWeeks: number
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
  // The booking under consideration closes the run, so it is the (unbroken run before it + 1)-th.
  const streakWeeks = consecutivePracticeWeeks(input.practiceWeeks, input.week) + 1
  if (input.condition < p.cautionCondition) reasons.push('tired')
  const strainedStreak = streakWeeks >= p.cautionStreak && input.condition < p.cautionStreakCondition
  if (strainedStreak || streakWeeks >= p.cautionStreakAlways) reasons.push('streak')
  if (reasons.length === 0) return { level: 'ok', reasons, streakWeeks }
  const parts: string[] = []
  // Owner's line: «Она уже вымотана – ещё матч?»
  if (reasons.includes('tired')) parts.push('She is already worn out – another match?')
  if (reasons.includes('streak')) parts.push(`${streakWeeks} match weeks in a row – that is how bodies break.`)
  return { level: 'caution', reasons, streakWeeks, detail: parts.join(' ') }
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
  const surface: Surface = 'hard' // the home club's courts
  // She hits at her CURRENT condition, exactly like a tournament run (R9-19 coupling), and on the
  // court her style earns her (surface-style): one composition point, applied once.
  const kid = kidMatchPlayerFor(world, surface)
  const opp: MatchPlayer = {
    id: opponent.id,
    name: opponent.name,
    serve: opponent.serve,
    ret: opponent.ret,
    composure: opponent.composure,
    stamina: opponent.stamina,
  }
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

/** RIVALS BECOME REAL: turn the selected cohort rows into the players who actually take the court
 *  for `event` – base attributes → surface/style modifier → condition factor, exactly once and in
 *  the same order as the kid's, via the single `rivalMatchPlayer` helper (season/rival.ts).
 *
 *  THE one place both tournament paths (the kid's shadow run and the canonical AI bracket) build a
 *  rival, so the two can never disagree about who she is. `fatigue` is the week's derived
 *  conditions; a player absent from it has no results inside the fatigue window and is fresh.
 *  Pure – the cohort rows are read, never written – and ZERO RNG draws. */
function rivalField(entrants: AiPlayer[], event: SeasonEvent, fatigue: Map<string, number>): MatchPlayer[] {
  return entrants.map((p) => rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max))
}

// Compute the kid's full shadow tournament: same event-scoped RNG, same entrant selection, same
// bracket. Emits NO events and awards NO points – that is deferred to reveal/finalize. Snapshots
// the kid + every opponent she faces at PRE-drift skills so the revealed match records are stable
// no matter how the cohort drifts afterwards; since rival-life those snapshots are the FATIGUED,
// surface-styled opponents, i.e. exactly who she played, so a replay reproduces the match.
function computeShadowTournament(
  world: WorldState,
  event: SeasonEvent,
  ranking: RankingRow[],
  fatigue: Map<string, number>,
): PendingTournament {
  // R9-19 coupling ON: the kid plays at her CURRENT condition (post this week's accrual –
  // step 1c runs before step 2), on the event's surface as her play style meets it (surface-style).
  // The SCALED player is both what runs the bracket and what is snapshotted into `players`, so
  // revealed records and replays stay byte-identical no matter how her condition moves afterwards –
  // and the run's every round shares this ONE build. Fractional skills are fine for the match engine.
  const kid = kidMatchPlayerFor(world, event.surface)
  const kidRng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const field = rivalField(selectEntrants(event, world.cohort, ranking, kidRng), event, fatigue)
  const result = runTournament(event, field, kid, world.seed, kidRng)
  const players: Record<string, MatchPlayer> = { [KID_ID]: { ...kid } }
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = field.find((p) => p.id === oppId)
    players[oppId] = ai ? { ...ai } : fallbackPlayer(oppId)
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
function runAiTournament(
  world: WorldState,
  event: SeasonEvent,
  aiRanking: RankingRow[],
  fatigue: Map<string, number>,
): void {
  const aiRng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  const field = rivalField(selectEntrants(event, world.cohort, aiRanking, aiRng), event, fatigue)
  const result = runTournament(event, field, null, world.seed, aiRng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    const points = pts[finish]
    if (points > 0) world.results.push({ playerId, week: world.week, points, tier: event.tier })
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
    if (!outgrewTier(event.tier, points)) continue // still inside (or under) the band
    withdrawEvent(world, id)
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `Entry released – she's outgrown ${TIERS[event.tier].label}. Fee refunded.`,
    })
  }
}

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
  // Canonical ranking excludes the kid so AI-field selection never depends on the kid's own
  // results / entry history – the canonical AI world stays the same world whatever she does.
  const aiRanking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    ids,
  )

  // RIVALS BECOME REAL: every cohort player's condition for THIS week, derived ONCE from the
  // results ledger before any of the week's brackets run. Deriving it up front (rather than per
  // event) is what keeps the week coherent: every event scheduled this week sees the same rivals,
  // and the kid's shadow run (step 2) and the canonical AI brackets (step 4) can never disagree
  // about how tired an opponent is. Pure derivation, ZERO main-stream draws.
  const rivalFatigue = rivalConditions(world.results, world.week)

  // 2. the kid's entered event this week (event-scoped RNG only): charge travel and stash the
  //    fully-computed shadow tournament. Nothing kid-specific is emitted/awarded here – the flow does.
  const enteredThisWeek = scheduled.find((e) => world.entries.includes(e.id))
  // An injury turns an entered event into a walkover: no travel, no shadow run, 0 points.
  // Only a POST-deadline entry can still be live here – pre-deadline entries were auto-withdrawn
  // (and refunded) at onset by rollInjury; past the deadline the fee is forfeited (withdrawEvent
  // refuses), so the walkover event is all that remains of the trip that never happened.
  //
  // THE DOCTOR CHECKS HER ON ARRIVAL (owner 26.07). The medical floor used to gate ENTRY only, and
  // entries commit ENTRY_LOOKAHEAD weeks ahead of the play week – so a run entered healthy could
  // still be PLAYED at condition 0 and nothing intervened (the fatigue bench traced 14 straight
  // such weeks). The floor is therefore re-read HERE, on the play week, against the condition she
  // will actually take the court at (step 1c has already accrued, so this is the same number
  // computeShadowTournament would scale her by). Precedence mirrors availabilityStatus exactly –
  // injured > medical – so the two surfaces can never disagree about which beat fires.
  // Pure state: ZERO new RNG draws, on any stream.
  const clearance = enteredThisWeek ? medicalClearance(world.condition) : 'clear'
  if (enteredThisWeek && world.injury !== null) {
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Walkover: too injured to play the ${TIERS[enteredThisWeek.tier].label} – 0 pts, entry fee forfeited.`,
    })
  } else if (enteredThisWeek && clearance === 'withdraw') {
    // WITHDRAWN ON MEDICAL GROUNDS: no travel charge (she never boards), no shadow run, 0 points.
    // The ENTRY FEE IS FORFEITED – the same rule skipEvent uses for a post-deadline pull-out, and
    // the same rule the injury walkover above uses. Chosen over a refund because it is the identical
    // real-world situation: the list closed with her on it, so the organisers keep the fee whatever
    // the reason she does not appear. Refunding here would also make the doctor's veto financially
    // FREE, i.e. a cheap late exit from any entry she regrets – the fee has to bite or "enter it and
    // see" becomes the dominant strategy.
    world.entries = world.entries.filter((id) => id !== enteredThisWeek.id)
    // Mark the week so advanceWeeks halts ONCE on it (see the stop below). The owner hit exactly this
    // trap with injuries – he skipped weeks, an entry was silently withdrawn, and he only found out
    // in the news three weeks later – so a forfeited entry must never pass by unseen either. The
    // marker is derived state, not saved: a reload replays the tick and re-derives it.
    world.medicalWithdrawalWeek = world.week
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Withdrawn from the ${TIERS[enteredThisWeek.tier].label} – not cleared to play on medical advice. 0 pts, entry fee forfeited.`,
    })
    // The week is match-free after all, so she earns the FULL free-week recovery ladder that
    // accrueCondition withheld when it still believed she would play (it ran with played = true, so
    // she banked matchWeekRecoveryBase instead of recoveryBase + the rest-slider bonus). Written as
    // the DIFFERENCE so it lands on exactly what a non-playing week pays, whatever the two knobs
    // are set to – and so this stays byte-consistent with the bench's independent trace, which
    // reads the week as free. Integer, clamped, zero draws.
    //
    // NOTE for the architect: skipEvent (R9-9) hands back the rest-slider bonus ALONE. That was
    // exactly right when it was written (matchWeekRecoveryBase == recoveryBase == 2) and quietly
    // became a short payment at the V2 flip, which set matchWeekRecoveryBase to 0 – so a skipped
    // event week still under-pays by recoveryBase. NOT touched here: fixing it moves shipped
    // condition traces, which is a tuning call, not a merge call.
    world.condition = clamp(
      world.condition +
        (ECONOMY.condition.recoveryBase - ECONOMY.condition.matchWeekRecoveryBase) +
        restRecoveryBonus(world.plan.rest),
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
  } else if (enteredThisWeek) {
    chargeTravel(world, enteredThisWeek)
    // ...and the WARNING BAND: cleared, but only just. She plays; the doctor goes on record. Emitted
    // after the travel charge so the week reads chronologically in the news feed (trip → the doctor
    // sees her → her matches). Type 'info' rather than 'injury': nothing has happened to her body,
    // somebody SAID something, which is what the 💬 channel is for.
    if (clearance === 'warn') {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `Doctor's warning – she is cleared for the ${TIERS[enteredThisWeek.tier].label}, but only just. He can warn you; he cannot forbid it.`,
      })
    }
    world.pendingTournament = computeShadowTournament(world, enteredThisWeek, aiRanking, rivalFatigue)
  }

  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  driftCohort(world.cohort, rng)

  // 4. canonical AI tournaments for ALL scheduled events. ZERO main-stream draws: each event's
  //    bracket runs on its own `seed:aitour:<event.id>` stream, so the calendar's SIZE no longer
  //    touches the weekly draw count. The main stream ends here carrying base costs + drift only.
  for (const e of scheduled) runAiTournament(world, e, aiRanking, rivalFatigue)

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

/** The GRADUATED-OUT half of the band, on its own: her points have passed the tier's ceiling.
 *  Round-10: pulled out as a named rule because two places need exactly this direction (the entry
 *  gate's 'outgrown' verdict and the deadline release), and each used to spell the comparison out
 *  by hand – which is how "outgrown" came to mean slightly different things on different surfaces. */
export function outgrewTier(tier: TierId, points: number): boolean {
  return points > TIERS[tier].enterPointBand[1]
}

/** Enter the kid in a scheduled event: validates deadline / funds / duplicates / ranking
 *  eligibility, then charges the fee immediately (expense event) and records the entry (entry
 *  event). Eligibility is direction-aware: too low to qualify vs graduated out of the tier. */
export function enterEvent(world: WorldState, eventId: string): void {
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.entries.includes(eventId)) throw new Error('Already entered this event')
  if (world.week > event.deadlineWeek) throw new Error('Entry deadline has passed')
  // Ladder-up: the calendar now stacks several tiers on the same week, so "one event per week" is
  // no longer guaranteed by the schedule and has to be a rule. She has one body and one week –
  // the abundance is a CHOICE between events, not a licence to play two.
  if (world.season.some((e) => e.week === event.week && world.entries.includes(e.id))) {
    throw new Error('She is already entered in a tournament that week')
  }
  const fee = TIERS[event.tier].entryFeeCents
  if (world.fundsCents < fee) throw new Error('Not enough funds for the entry fee')
  // THE ONE GATE (round-10 R10-5): point band + availability, in one call, shared with the snapshot
  // and the advance stop – so no surface can decide differently about the same event. Only a HARD
  // block stops entry; fatigue is a soft, warned CHOICE (level 'caution'), so racing tired is
  // allowed – its cost is emergent, not a veto.
  const gate = entryStatus(world, event)
  if (gate.level === 'blocked') throw new Error(gate.detail ?? 'Unavailable this week')
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

/** R10-13: CANCEL an entry, at any point before its week starts. THE ESCAPE HATCH.
 *
 *  The owner's dead end (R10-3): she was entered in a Local, the list closed, and only THEN did she
 *  outgrow the tier and run out of gas. `withdrawEvent` refuses past the deadline, the planner
 *  refuses a week that holds an entry, and the calendar had hidden the card – so the week could be
 *  neither played, planned, nor abandoned. Nothing was possible. This is the way out.
 *
 *  THE FEE RULE, kept coherent with `skipEvent` (R9-9) and with the medical withdrawal in tickWeek:
 *  once the list has closed, the organisers keep the fee whatever the reason she does not appear.
 *  So all three pull-outs forfeit it, and the only difference between them is what else was already
 *  charged at the moment of the pull-out:
 *    - BEFORE the deadline  -> this is a withdrawal, not a forfeit: delegates to `withdrawEvent`
 *                             (full refund). One command for the UI, the refund rule untouched.
 *    - after the deadline, before the week -> fee forfeited. Travel has not been charged yet
 *                             (tickWeek charges it on the play week), so there is nothing to hand
 *                             back, and the week becomes plannable again (practice or vacation).
 *    - ON the event week    -> not this command's business: tickWeek has already charged travel and
 *                             stashed the run, so `skipEvent` owns it (fee forfeited, travel back).
 *  Refunding here instead would make "enter it and see" the dominant strategy, which is the same
 *  reason the medical withdrawal forfeits – the fee has to bite.
 *
 *  Pure state, ZERO RNG draws. */
export function cancelEntry(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (event.week <= world.week) {
    throw new Error('That week has already started – skip the tournament instead')
  }
  // Still refundable: the list is open, so this is an ordinary withdrawal and the fee comes back.
  if (world.week <= event.deadlineWeek) {
    withdrawEvent(world, eventId)
    return
  }
  world.entries = world.entries.filter((id) => id !== eventId)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Cancelled ${TIERS[event.tier].label} – W${event.week}, entry fee forfeited.`,
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
    // A medical withdrawal costs her an entry AND its fee, so it halts the advance for the same
    // reason a fresh injury does: the player must see it happen, not read about it later.
    if (world.medicalWithdrawalWeek === world.week) {
      stopReason = 'medical'
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
  return world.season
    .filter((e) => e.week > world.week && e.week <= world.week + UPCOMING_WEEKS)
    .sort((a, b) => a.week - b.week)
    .map((e) => {
      // Round-10 R10-5: ONE call, the same `entryStatus` enterEvent and advanceWeeks read, instead
      // of this function's own copy of the point band + a separate availability call. `eligible`
      // and `ineligibleReason` therefore describe exactly what enterEvent would do, by construction
      // rather than by two implementations happening to agree.
      //
      // NOTE the scope: this is the ENTRY verdict. It is NOT a verdict on `entered` – a list that
      // closed with her on it keeps her on it whatever her points did afterwards, so an entered
      // card must never be treated as a lock (see `cancellable`, and R10-3).
      const gate = entryStatus(world, e)
      const isEntered = entered.has(e.id)
      const reason =
        gate.level === 'blocked'
          ? {
              ineligibleReason: gate.reason as 'locked' | 'outgrown' | 'injured' | 'unavailable' | 'medical',
              ...(gate.pointsToEnter !== undefined ? { pointsToEnter: gate.pointsToEnter } : {}),
            }
          : gate.level === 'caution'
            ? { cautionReason: gate.reason as 'fatigued', cautionDetail: gate.detail }
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
        entered: isEntered,
        // A fatigued event is a CAUTION, not a block: she stays eligible. Only a HARD block
        // (point band, injured, unavailable, medical) removes eligibility.
        eligible: gate.level !== 'blocked',
        // R10-13: the entry is COMMITTED (the list has closed) but the week has not started yet –
        // the only window in which cancelling costs the fee and frees the week. Every row here is
        // a FUTURE week by construction, so the closed list is the whole condition.
        cancellable: isEntered && world.week > e.deadlineWeek,
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
