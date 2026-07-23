import { type Rng, rngFromSeed, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type FamilyBackground,
  type PlayerProfile,
  type Snapshot,
  type StandingRow,
  type StopReason,
  type UpcomingEvent,
  type WeekPlan,
  type WorldEvent,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
import type { MatchPlayer } from './match/types'
import type { AiPlayer, RankingRow, SeasonEvent } from './season/types'
import { TIERS, buildSeason } from './season/calendar'
import { generateCohort, driftCohort } from './season/cohort'
import { computeRanking, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament } from './season/tournament'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md) so the load-time RNG replay stays valid.

export const SAVE_SCHEMA_VERSION = 7

/** Detailed weekly simulation starts here; childhood becomes a prologue (Phase 6). */
export const START_AGE_YEARS = 14

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'

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
  const horizonChunk = Math.floor((world.week + SEASON_MIN_FUTURE) / SEASON_CHUNK)
  let maxWeek = world.week
  for (const e of world.season) if (e.week > maxWeek) maxWeek = e.week
  let coveredChunk = world.season.length ? Math.floor(maxWeek / SEASON_CHUNK) : -1
  while (coveredChunk < horizonChunk) {
    coveredChunk++
    const start = coveredChunk * SEASON_CHUNK
    world.season.push(...buildSeason(`${world.seed}:s${coveredChunk}`, start, SEASON_CHUNK))
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

// Emits per-round match events (with replayable skill snapshots) plus one summary.
function runKidTournament(world: WorldState, event: SeasonEvent, ranking: RankingRow[]): void {
  const kid = kidMatchPlayer(world)
  const kidRng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const entrants = selectEntrants(event, world.cohort, ranking, kidRng)
  const result = runTournament(event, entrants, kid, world.seed, kidRng)
  const tier = TIERS[event.tier]

  const skillOf = (id: string): MatchPlayer => {
    if (id === KID_ID) return { ...kid }
    const ai = entrants.find((p) => p.id === id)
    if (!ai) return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50 }
    return { id: ai.id, name: ai.name, serve: ai.serve, ret: ai.ret, composure: ai.composure, stamina: ai.stamina }
  }

  // Short names for EVERYONE in news match texts: cohort names are "First Last"; the
  // kid's full name is kidName + last name (kidMatchPlayer only carries the first name).
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)

  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const oppName = skillOf(oppId).name
    const kidWon = m.winnerId === KID_ID
    const stage = stageLabel(m.round, tier.drawSize)
    // MatchRecord scores are from bracket side A's perspective; news reads from the kid's.
    const kidScore = m.score && m.bId === KID_ID ? flipScore(m.score) : m.score
    addEvent(world, {
      week: world.week,
      type: 'match',
      text: `${stage}: ${kidShort} ${kidWon ? 'beat' : 'lost to'} ${formatShortName(oppName)} ${kidScore ?? ''}`.trim(),
      match: { ...m, eventId: event.id, surface: event.surface, oppName, a: skillOf(m.aId), b: skillOf(m.bId) },
    })
  }

  const kidFinish = result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  const points = tier.points[kidFinish] ?? 0
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points })
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text: `${tier.label} (${event.surface}, W${event.week}): ${kid.name} — ${finishLabel(kidFinish)} (+${points} pts)`,
  })

  if (kidFinish === 0) fireMilestone(world, 'first-title', `🏆 First career title: ${tier.label}!`)
  if (
    event.tier === 'national' &&
    result.matches.some((m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID)
  ) {
    fireMilestone(world, 'first-national', '🏆 First win at National level!')
  }
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
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  delete save.log
}

// Full weekly resolution. Draw order on the MAIN stream is fixed per week regardless
// of player input: base costs → (kid tournament uses an event-scoped RNG, zero main
// draws) → cohort drift → canonical AI tournaments for every scheduled event.
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

  // 2. the kid's entered event this week (event-scoped RNG only)
  const enteredThisWeek = scheduled.find((e) => world.entries.includes(e.id))
  if (enteredThisWeek) {
    chargeTravel(world, enteredThisWeek)
    runKidTournament(world, enteredThisWeek, aiRanking)
  }

  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  driftCohort(world.cohort, rng)

  // 4. canonical AI tournaments for ALL scheduled events (main stream, fixed pattern)
  for (const e of scheduled) runAiTournament(world, e, aiRanking, rng)

  // 5. recompute the kid's rank + fire rank milestones (only once the kid has points).
  // Snapshot the previous week's rank first so the UI can show week-over-week movement.
  world.prevKidRank = world.kidRank
  const full = computeRanking(world.results, world.week, [...ids, KID_ID])
  const kidRow = full.find((r) => r.playerId === KID_ID)
  world.kidRank = kidRow?.rank ?? full.length
  if ((kidRow?.points ?? 0) > 0) fireRankMilestones(world)

  // 6. housekeeping
  pruneResults(world)
  pruneEvents(world)
  ensureSeason(world)
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
    text: `Entered ${TIERS[event.tier].label} — W${event.week} (${event.surface})`,
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
    text: `Withdrew from ${TIERS[event.tier].label} — W${event.week}`,
  })
}

/** Tick up to `weeks`, stopping early on a tournament week (after resolving it), an
 *  imminent affordable regional+ deadline, or funds crossing below zero. */
export function advanceWeeks(world: WorldState, rng: Rng, weeks: number): StopReason | undefined {
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
    const stopForTournament = world.entries.some((id) => {
      const e = eventById(world, id)
      return !!e && e.week === nextWeek
    })
    tickWeek(world, rng)
    if (world.fundsCents < 0) {
      stopReason = 'funds'
      break
    }
    if (stopForTournament) {
      stopReason = 'tournament'
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

export function toSnapshot(world: WorldState, stopReason?: StopReason): Snapshot {
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
  }
}
