import { type Rng, rngFromSeed, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CountingResult,
  type FamilyBackground,
  type FinanceWeek,
  type FinanceWindow,
  type FullBracketMatch,
  type PendingBracketRound,
  type PendingView,
  type PlayerProfile,
  type SeasonSummary,
  type Snapshot,
  type StandingRow,
  type StopReason,
  type UpcomingEvent,
  type WeekPlan,
  type WorldEvent,
  type WorldEventCategory,
  type WorldMatch,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
import { weekYear } from '../shared/dates'
import type { MatchPlayer } from './match/types'
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TierId, TournamentResult } from './season/types'
import { TIERS, buildSeason, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from './season/calendar'
import { ECONOMY, GEAR_CATEGORIES, gearHitForWeek, planExpenseFactor } from './economy'
import { generateCohort, driftCohort } from './season/cohort'
import { computeRanking, windowedBestSum, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament } from './season/tournament'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md) so the load-time RNG replay stays valid.

export const SAVE_SCHEMA_VERSION = 11

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
const BG_EXPENSE_FACTOR = ECONOMY.bgExpenseFactor

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

// --- weekly resolution pieces ------------------------------------------------
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
  // Draw first (unchanged), THEN scale by background – draw count stays background-independent.
  const expense = Math.round(
    pickInt(rng, lo, hi) * planExpenseFactor(world.plan.train) * BG_EXPENSE_FACTOR[world.profile.background],
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
  const kid = kidMatchPlayer(world)
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
  const world: WorldState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    careerId,
    seed,
    week: 0,
    fundsCents,
    profile,
    plan: { ...WEEK_PLAN_PRESETS.balanced },
    cohort: generateCohort(seed),
    results: [],
    season: [],
    entries: [],
    events: [],
    nextEventId: 0,
    kidRank: 1,
    prevKidRank: null,
    pendingTournament: null,
    bestFinishByTier: {},
    lastSeasonSummary: null,
    seasonWins: 0,
    seasonLosses: 0,
    financeWeeks: [],
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
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  delete save.log
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

  // 0. parent's weekly contribution BEFORE costs (no RNG draw)
  resolveParentIncome(world)

  // 1. base costs (main stream, plan-independent draw count)
  resolveBaseCosts(world, rng)

  // 1b. recurring gear line-items (round-7 a). Zero main-stream draws – purpose-scoped
  //     sub-streams only – so this never perturbs the weekly draw count.
  resolveGear(world)

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
  if (enteredThisWeek) {
    chargeTravel(world, enteredThisWeek)
    world.pendingTournament = computeShadowTournament(world, enteredThisWeek, aiRanking)
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
      const deadlineSoon = world.season.some(
        (e) =>
          (e.tier === 'regional' || e.tier === 'national') &&
          !world.entries.includes(e.id) &&
          world.fundsCents >= TIERS[e.tier].entryFeeCents &&
          (e.deadlineWeek === world.week || e.deadlineWeek === nextWeek),
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
      // 'outgrown' = too good (past the tier's ceiling) now.
      const eligible = isTierEligible(e.tier, points)
      const minPoints = TIERS[e.tier].enterPointBand[0]
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
        ...(eligible ? {} : { ineligibleReason: points < minPoints ? ('locked' as const) : ('outgrown' as const) }),
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
    events: world.events.slice(-SNAPSHOT_EVENTS),
    // Category-accurate windows off the persisted ledger (immune to the 60-event cap). season
    // keeps the current MoneyScreen semantics: the current 52-week season block from its first week.
    finance: {
      window12w: financeWindow(world.financeWeeks, world.week - 11),
      season: financeWindow(world.financeWeeks, Math.floor(world.week / 52) * 52),
    },
    financialEvents: world.events.filter((e) => e.amountCents !== undefined).slice(-SNAPSHOT_FINANCIAL_EVENTS),
    upcoming: upcomingEvents(world),
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    countingResults: computeCountingResults(world),
    bestFinishByTier: { ...world.bestFinishByTier },
    lastSeasonSummary: world.lastSeasonSummary,
    ...(stopReason ? { stopReason } : {}),
    ...(pending ? { pending } : {}),
  }
}
