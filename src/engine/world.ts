import { type Rng, rngFromSeed, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type FamilyBackground,
  type FullBracketMatch,
  type PendingBracketRound,
  type PendingView,
  type PlayerProfile,
  type Snapshot,
  type StandingRow,
  type StopReason,
  type UpcomingEvent,
  type WeekPlan,
  type WorldEvent,
  type WorldMatch,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
import { weekYear } from '../shared/dates'
import type { MatchPlayer } from './match/types'
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TournamentResult } from './season/types'
import { TIERS, buildSeason, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from './season/calendar'
import { generateCohort, driftCohort } from './season/cohort'
import { computeRanking, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament } from './season/tournament'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md) so the load-time RNG replay stays valid.

export const SAVE_SCHEMA_VERSION = 8

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
}

export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
}

// Weekly parent contribution to the war chest, by family background. Emitted as an
// `income` event BEFORE costs each week. No RNG draw, so the per-week draw count is
// unchanged (the load-time RNG replay depends on it).
export const PARENT_INCOME_CENTS: Record<FamilyBackground, number> = {
  wealthy: 800_00,
  middle: 450_00,
  working: 200_00,
}

// Weekly expense draw ranges in cents. A parent-coach saves on coaching fees;
// the ranges differ but the RNG draw COUNT per tick must stay identical across
// profiles – the load-time RNG replay depends on it.
const EXPENSE_RANGE: Record<PlayerProfile['coachSetup'], [number, number]> = {
  hired: [250_00, 700_00],
  parent: [120_00, 400_00],
}

// Two flavor lists, same length: the list is chosen deterministically from the
// plan, so the RNG draw COUNT per tick never depends on player input (the
// load-time RNG replay requires it).
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

const SEASON_MIN_FUTURE = 26 // always keep at least this many future weeks scheduled
const SEASON_CHUNK = 52 // generate the calendar one deterministic year-block at a time
const RESULTS_WINDOW = 52 // ranking window; results older than this never count → prunable
const EVENTS_CAP = 400 // non-`keep` events beyond this are pruned oldest-first
const SNAPSHOT_EVENTS = 60 // events surfaced in a snapshot
const UPCOMING_WEEKS = 8 // calendar horizon surfaced in a snapshot
const RANK_MILESTONES = [100, 50, 10, 1] // kid-rank thresholds that pin a milestone

/** Weekly expense scale from the time split: train 75% ≈ 1.0, more training costs more. */
function planExpenseFactor(plan: WeekPlan): number {
  return 0.55 + 0.006 * plan.train
}

function addEvent(world: WorldState, e: Omit<WorldEvent, 'id'>): void {
  world.events.push({ id: world.nextEventId++, ...e })
}

// --- the kid as a match player -----------------------------------------------
// The kid has no persisted skills in Phase 3 (development lands in Phase 4), so the
// starting build is derived deterministically from the world seed. Stable across a
// career, and snapshotted into every kid-match event for replay.
export function kidMatchPlayer(world: { seed: string; profile: PlayerProfile }): MatchPlayer {
  const r = rngFromSeed(world.seed + ':kid')
  return {
    id: KID_ID,
    name: world.profile.kidName,
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
    world.season.push(...buildSeason(`${world.seed}:s${coveredChunk}`, start, SEASON_CHUNK))
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

function fireRankMilestones(world: WorldState): void {
  for (const t of RANK_MILESTONES) {
    if (world.kidRank <= t) {
      fireMilestone(world, `rank-${t}`, t === 1 ? 'World #1! 🏆' : `Broke into the world top ${t}!`)
    }
  }
}

// --- season wrap-up (Round 5 items 16/21) ------------------------------------
// Fires once, the moment the world ticks into a season year's first off-season week
// (see calendar.ts's isOffSeasonWeek). Everything is read back off the EXISTING
// results/events ledgers for the just-finished year – no new persisted state:
//  - season points / best finish / W-L: results + tournament/match events in range.
//  - rank vs season start: results ledger replayed at the year's first week (still
//    inside the 52-week ranking window, so nothing has been pruned away yet).
//  - funds delta: signed amountCents on expense/income events in range (a flavor
//    figure, not the audit trail – MoneyScreen's ledger stays authoritative).
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
  let wins = 0
  let losses = 0
  for (const e of world.events) {
    if (!inRange(e.week)) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined) {
      if (bestFinish === null || e.finishIdx < bestFinish) bestFinish = e.finishIdx
    } else if (e.type === 'match' && e.match) {
      if (e.match.winnerId === KID_ID) wins++
      else losses++
    }
  }

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
  addEvent(world, { week: world.week, type: 'income', text: "Parents' contribution", amountCents: income })
}

function resolveBaseCosts(world: WorldState, rng: Rng): void {
  const [lo, hi] = EXPENSE_RANGE[world.profile.coachSetup]
  const expense = Math.round(pickInt(rng, lo, hi) * planExpenseFactor(world.plan))
  world.fundsCents -= expense
  const flavors = world.plan.train >= 70 ? TRAIN_EVENTS : REST_EVENTS
  const flavor = flavors[pickInt(rng, 0, flavors.length - 1)]
  addEvent(world, { week: world.week, type: 'expense', text: flavor, amountCents: -expense })
  if (rng() < 0.06) {
    const gift = pickInt(rng, 500_00, 1500_00)
    world.fundsCents += gift
    addEvent(world, { week: world.week, type: 'income', text: 'A local sponsor chipped in!', amountCents: gift })
  }
}

function chargeTravel(world: WorldState, event: SeasonEvent): void {
  world.fundsCents -= event.travelCostCents
  addEvent(world, {
    week: world.week,
    type: 'expense',
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
  if ((kidRow?.points ?? 0) > 0) fireRankMilestones(world)
}

// Step 6 of a resolved week: prune ledgers/feeds, roll the calendar forward.
function housekeep(world: WorldState): void {
  pruneResults(world)
  pruneEvents(world)
  ensureSeason(world)
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
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points })
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text: `${tier.label} (${event.surface}, W${event.week}): ${world.profile.kidName} – ${finishLabel(kidFinish)} (+${points} pts)`,
    finishIdx: kidFinish,
  })
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

/** Enter the kid in a scheduled event: validates deadline / funds / duplicates, then
 *  charges the fee immediately (expense event) and records the entry (entry event). */
export function enterEvent(world: WorldState, eventId: string): void {
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.entries.includes(eventId)) throw new Error('Already entered this event')
  if (world.week > event.deadlineWeek) throw new Error('Entry deadline has passed')
  const fee = TIERS[event.tier].entryFeeCents
  if (world.fundsCents < fee) throw new Error('Not enough funds for the entry fee')
  world.fundsCents -= fee
  world.entries.push(eventId)
  addEvent(world, {
    week: world.week,
    type: 'expense',
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
    .map((e) => ({
      id: e.id,
      week: e.week,
      tier: e.tier,
      surface: e.surface,
      travelCostCents: e.travelCostCents,
      deadlineWeek: e.deadlineWeek,
      entryFeeCents: TIERS[e.tier].entryFeeCents,
      label: TIERS[e.tier].label,
      entered: entered.has(e.id),
    }))
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
  const enrich = (r: RankingRow): StandingRow => {
    const m = meta.get(r.playerId) ?? { name: r.playerId, nation: '' }
    return { ...r, name: m.name, nation: m.nation, isKid: r.playerId === KID_ID }
  }
  const kidIdx = full.findIndex((r) => r.playerId === KID_ID)
  const top = full.slice(0, 10)
  const around = kidIdx >= 0 ? full.slice(Math.max(0, kidIdx - 2), kidIdx + 3) : []
  const seen = new Set<string>()
  const out: StandingRow[] = []
  for (const r of [...top, ...around]) {
    if (seen.has(r.playerId)) continue
    seen.add(r.playerId)
    out.push(enrich(r))
  }
  return out
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

  // Round 5 item 5: the FULL draw (every match, every player) for every round revealed so
  // far – the kid's matches are always rounds 0..revealed-1 (single elim, she plays every
  // round until eliminated), so that also bounds which OTHER matches are safe to reveal.
  // `score` is always normalised to the WINNER's perspective (conventional "W d. L 6-4 ..."
  // reading) regardless of which bracket side (a/b) actually won – MatchRecord stores it
  // from side A's perspective, so it only needs flipping when B won.
  const maxRevealedRound = revealed - 1
  const fullBracket: FullBracketMatch[] =
    maxRevealedRound < 0
      ? []
      : p.result.matches
          .filter((m) => m.round <= maxRevealedRound)
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
    upcoming: upcomingEvents(world),
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    ...(stopReason ? { stopReason } : {}),
    ...(pending ? { pending } : {}),
  }
}
