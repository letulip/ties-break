/**
 * Fatigue/injury bench (docs/specs/fatigue-bench.md, owner ask 25.07) – a headless "how does the
 * NEW round-9 condition math behave over a season/career" tool.
 *
 * MEASUREMENT ONLY. This file imports the engine and reads condition/injury/match state; it
 * changes NO engine numbers. The B1/C1 main-stream invariance freezes stay untouched: the bench
 * only calls the same public API the UI does (enterEvent / tickWeek / skipTournament /
 * closeTournament) plus two pre-tick state choices a player makes in the UI anyway (the
 * train/rest plan preset and the physio toggle).
 *
 * MATRIX
 *  - Profiles: the real difficulty tiers 8k/25k/120k = working/middle/wealthy, with middle run
 *    both self-coached and hired (same as econ-bench – the coach setup also flips the DEFAULT
 *    physio toggle, so it is a fatigue lever too).
 *  - Policies (the load-management axis this bench exists to compare):
 *      grinder  – plan 85/15 (grind preset), enters EVERYTHING eligible+affordable, ignores the
 *                 fatigue 'caution' level exactly like econ-bench's entry policy v3.
 *      balanced – plan 75/25, same enter-everything rule (the default player).
 *      careful  – plan 60/40 (light preset), physio ALWAYS on, and skips entry while
 *                 condition < the tier's availability floor + 10 (rests until recovered).
 *    Physio for grinder/balanced follows the game default (ON iff hired coach); careful FORCES it.
 *  - Horizons: 52w (one season), 104w (14→16), 208w (14→18). 30 seeds per cell.
 *
 * PAIRED SEEDS: the seed is `fatigue-<background>-<index>` – policy and coach setup are NOT in
 * the seed, so every policy (and both middle presets) faces the SAME calendar, cohort and
 * per-week injury/physio sub-stream rolls. Only tau (the injury threshold), her condition and
 * the entry pattern differ – a paired comparison, which is what makes the 30-seed ordering
 * (grinder vs careful) tight enough to test.
 *
 * Determinism: (profile, policy, seed index, horizon) reproduces byte-identically – the engine
 * forbids wall-clock/Math.random and the bench adds no entropy of its own.
 *
 * Run:  npm run bench:fatigue           (console tables + sparklines, all three horizons)
 *       npm run bench:fatigue -- --csv /path/to/rows.csv   (also dump the weekly time-series)
 */
import { writeFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  isTierEligible,
  kidPoints,
  skipTournament,
  closeTournament,
  availabilityStatus,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import type {
  CoachSetup,
  FamilyBackground,
  InjurySeverity,
  PlayerProfile,
  WeekPlan,
} from '../src/shared/protocol'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

export const START_AGE_YEARS = 14
export const SEEDS_PER_CELL = 30
/** Same near-deadline commit window as econ-bench's entry policy v3. */
export const ENTRY_LOOKAHEAD = 3

export const SEVERITIES: readonly InjurySeverity[] = ['minor', 'moderate', 'major', 'severe']

// --- matrix -------------------------------------------------------------------

export interface Profile {
  label: string
  background: FamilyBackground
  coachSetup: CoachSetup
}

export const PROFILES: Profile[] = [
  { label: '8k   · working · self-coached', background: 'working', coachSetup: 'parent' },
  { label: '25k  · middle  · self-coached', background: 'middle', coachSetup: 'parent' },
  { label: '25k  · middle  · hired coach', background: 'middle', coachSetup: 'hired' },
  { label: '120k · wealthy · hired coach', background: 'wealthy', coachSetup: 'hired' },
]

/** A load-management policy as pure DATA (owner 25.07: axes must stay unbundled so future
 *  axes – FRIENDLY MATCHES, VACATIONS, both season-planner slice and NOT in the engine yet –
 *  are a new field here, never a code fork). */
export interface Policy {
  id: string
  label: string
  plan: WeekPlan
  /** physio toggle: 'on'/'off' force it; 'default' keeps the game default (ON iff hired coach). */
  physio: 'on' | 'off' | 'default'
  /** skip entry while condition < tier availability floor + this margin;
   *  null = enter regardless of the fatigue caution (the enter-everything rule). */
  entryConditionMargin: number | null
}

/** The three HEADLINE policies of the spec (run at 30 seeds over all three horizons). */
export const POLICIES: Policy[] = [
  {
    id: 'grinder',
    label: 'grinder 85/15 enter-all',
    plan: WEEK_PLAN_PRESETS.grind,
    physio: 'default',
    entryConditionMargin: null,
  },
  {
    id: 'balanced',
    label: 'balanced 75/25 enter-all',
    plan: WEEK_PLAN_PRESETS.balanced,
    physio: 'default',
    entryConditionMargin: null,
  },
  {
    id: 'careful',
    label: 'careful 60/40 physio floor+10',
    plan: WEEK_PLAN_PRESETS.light,
    physio: 'on',
    entryConditionMargin: 10,
  },
]

// --- factorial grid (owner 25.07 scope extension: unbundle the axes) -------------
// plan {85/15, 75/25, 60/40} × entry {enter-all, floor-respecting} × physio {on, off}
// = 12 cells per profile, run at GRID_HORIZON_WEEKS with GRID_SEEDS seeds (reduced from 30
// to keep the full bench under a minute – the seed count is logged in the output).

export const GRID_PLANS: { id: string; plan: WeekPlan }[] = [
  { id: '85/15', plan: WEEK_PLAN_PRESETS.grind },
  { id: '75/25', plan: WEEK_PLAN_PRESETS.balanced },
  { id: '60/40', plan: WEEK_PLAN_PRESETS.light },
]
export const GRID_ENTRIES: { id: string; margin: number | null }[] = [
  { id: 'all', margin: null },
  { id: 'floor+10', margin: 10 },
]
export const GRID_PHYSIO: ('on' | 'off')[] = ['on', 'off']
export const GRID_SEEDS = 10
export const GRID_HORIZON_WEEKS = 104

/** The 12 unbundled grid policies, built from the axis tables above. */
export function gridPolicies(): Policy[] {
  const out: Policy[] = []
  for (const p of GRID_PLANS) {
    for (const e of GRID_ENTRIES) {
      for (const ph of GRID_PHYSIO) {
        out.push({
          id: `${p.id}·${e.id}·${ph}`,
          label: `${p.id} ${e.id} physio-${ph}`,
          plan: p.plan,
          physio: ph,
          entryConditionMargin: e.margin,
        })
      }
    }
  }
  return out
}

export interface FatigueHorizon {
  label: string
  weeks: number
  seasons: number
}

export const FATIGUE_HORIZONS: FatigueHorizon[] = [
  { label: '52w (one season)', weeks: 52, seasons: 1 },
  { label: '104w (14→16)', weeks: 104, seasons: 2 },
  { label: '208w (14→18)', weeks: 208, seasons: 4 },
]

// --- career simulation ---------------------------------------------------------

/** Open a deterministic career for a profile+policy+index. The seed excludes policy AND coach
 *  setup on purpose (see the header: paired seeds). The plan preset and the physio toggle are
 *  the two pre-tick state choices the UI exposes (setPlan / setPhysio); setting them here is a
 *  player action, not an engine change. */
export function openFatigueCareer(
  profile: Profile,
  policy: Policy,
  index: number,
): { world: WorldState; rng: Rng; seed: string } {
  const seed = `fatigue-${profile.background}-${index}`
  const playerProfile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: profile.background,
    coachSetup: profile.coachSetup,
  }
  const world = createWorld(seed, playerProfile)
  world.plan = { ...policy.plan }
  if (policy.physio === 'on') world.physioActive = true
  else if (policy.physio === 'off') world.physioActive = false
  const rng = rngFromSeed(world.seed)
  return { world, rng, seed }
}

/** Everything observed in one bench week – the raw material for the metrics AND the tests'
 *  independent condition-trace recomputation. */
export interface WeekFacts {
  week: number
  /** post-week condition: after accrueCondition AND after any committed run's strain. */
  condition: number
  /** she is out injured as the week closes. */
  injured: boolean
  /** a NEW injury landed this week (severity + rolled weeks out), else null. */
  injuryOnset: { severity: InjurySeverity; weeksOut: number } | null
  /** the kid actually competed (a shadow run was computed and committed). */
  played: boolean
  tierPlayed: TierId | null
  /** raw kid-match scorelines of the committed run, in round order ('' = defensive no-score). */
  matchScores: string[]
  wins: number
  losses: number
  /** an entered event fell on an injured week – fee forfeited, no run. */
  walkover: boolean
  /** entries committed THIS week while condition was below the tier's availability floor. */
  cautionEntries: number
  entriesCommitted: number
  /** physio/medical cents billed this week (retainer, rehab, onset scans). */
  physioSpendCents: number
  /** weekly coaching/training bill in cents (the planFactor-scaled base cost) – the money side
   *  of the train slider, so the grid can show the effort↔wallet↔condition triangle. */
  coachingSpendCents: number
}

/** Advance ONE bench week: policy-gated entries, tick, commit any spawned run (skip+close – the
 *  same fast-forward the econ bench uses), then read the week's facts off the world. Shared by
 *  runFatigueCareer and the tests so the policy lives in exactly one place. */
export function stepFatigueWeek(world: WorldState, rng: Rng, policy: Policy): WeekFacts {
  let cautionEntries = 0
  let entriesCommitted = 0
  // Entry rule = econ-bench policy v3 (ranking-eligible + affordable, committed near the
  // deadline, HARD blocks respected) + the careful policy's condition floor. The fatigue
  // 'caution' level is deliberately IGNORED by grinder/balanced – that is their defining trait.
  for (const e of world.season) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue
    if (!isTierEligible(e.tier, kidPoints(world))) continue
    const avail = availabilityStatus(world, e)
    if (avail.level === 'blocked') continue // injured / exam blackout – enterEvent would throw
    if (
      policy.entryConditionMargin !== null &&
      world.condition < ECONOMY.availability.minConditionToEnter[e.tier] + policy.entryConditionMargin
    ) {
      continue // careful: too tired – rest until recovered
    }
    const cost = TIERS[e.tier].entryFeeCents + e.travelCostCents
    if (world.fundsCents < cost) continue
    if (avail.level === 'caution') cautionEntries++ // entered below the tier floor – the tough-parent choice
    enterEvent(world, e.id)
    entriesCommitted++
  }

  const firstNewEventId = world.nextEventId
  tickWeek(world, rng)

  // Commit any spawned run in-week (reveal-flow fast-forward). Capture the kid's matches BEFORE
  // closing: scores/tier feed the strain accounting and the tests' formula spot-check.
  let played = false
  let tierPlayed: TierId | null = null
  let wins = 0
  let losses = 0
  const matchScores: string[] = []
  const p = world.pendingTournament
  if (p) {
    played = true
    tierPlayed = world.season.find((e) => e.id === p.eventId)?.tier ?? null
    for (const m of p.result.matches) {
      if (m.aId !== KID_ID && m.bId !== KID_ID) continue
      matchScores.push(m.score ?? '')
      if (m.winnerId === KID_ID) wins++
      else losses++
    }
    skipTournament(world)
    closeTournament(world)
  }

  // This week's fresh events (ids are monotonic; new ones are never pruned within their own
  // week) carry the walkover marker and every physio/medical bill.
  const newEvents = world.events.filter((ev) => ev.id >= firstNewEventId)
  const walkover = newEvents.some((ev) => ev.type === 'injury' && ev.text.startsWith('Walkover'))
  const physioSpendCents = newEvents
    .filter((ev) => ev.category === 'physio' && (ev.amountCents ?? 0) < 0)
    .reduce((s, ev) => s - (ev.amountCents ?? 0), 0)
  const coachingSpendCents = newEvents
    .filter((ev) => ev.category === 'coaching' && (ev.amountCents ?? 0) < 0)
    .reduce((s, ev) => s - (ev.amountCents ?? 0), 0)

  const injuryOnset =
    world.injury !== null && world.injury.sinceWeek === world.week
      ? { severity: world.injury.severity, weeksOut: world.injury.totalWeeks }
      : null

  return {
    week: world.week,
    condition: world.condition,
    injured: world.injury !== null,
    injuryOnset,
    played,
    tierPlayed,
    matchScores,
    wins,
    losses,
    walkover,
    cautionEntries,
    entriesCommitted,
    physioSpendCents,
    coachingSpendCents,
  }
}

export interface WeeklyPoint {
  week: number
  condition: number
  injured: boolean
  tierPlayed: TierId | null
  matches: number
}

export interface RunResult {
  seed: string
  /** one point per ticked week, in order – the season curve. */
  weekly: WeeklyPoint[]
  meanCondition: number
  /** week counts by condition band (post-week condition). */
  bandLow: number // < 40
  bandMid: number // 40..69
  bandHigh: number // >= 70
  /** weeks pinned at the exact cap/floor – the "rides high"/"death spiral" detectors. */
  weeksAt100: number
  weeksAt0: number
  /** deepest trough of the run. */
  trough: number
  /** condition at each season year's LAST week (week % 52 === 51). */
  endOfSeasonCondition: number[]
  injuriesBySeverity: Record<InjurySeverity, number>
  injuriesTotal: number
  /** weeks that closed with her out injured. */
  weeksInjured: number
  walkovers: number
  cautionEntries: number
  entries: number
  physioSpendCents: number
  coachingSpendCents: number
  /** family funds at horizon end – the wallet corner of the effort↔wallet↔condition triangle. */
  endFundsCents: number
  matchesPlayed: number
  wins: number
  losses: number
  /** best (lowest) dense rank reached while actually ranked (kidPoints > 0) – the same
   *  hasResults guard econ-bench needed against the point-less dense-rank-1 tie. */
  bestRank: number | null
  endRank: number
  endPoints: number
}

/** Run ONE career headless to `horizonWeeks`. Deterministic per (profile, policy, index, horizon). */
export function runFatigueCareer(
  profile: Profile,
  policy: Policy,
  index: number,
  horizonWeeks: number,
): RunResult {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)

  const weekly: WeeklyPoint[] = []
  const injuriesBySeverity: Record<InjurySeverity, number> = { minor: 0, moderate: 0, major: 0, severe: 0 }
  const endOfSeasonCondition: number[] = []
  let condSum = 0
  let bandLow = 0
  let bandMid = 0
  let bandHigh = 0
  let weeksAt100 = 0
  let weeksAt0 = 0
  let trough: number = ECONOMY.condition.max
  let weeksInjured = 0
  let walkovers = 0
  let cautionEntries = 0
  let entries = 0
  let physioSpendCents = 0
  let coachingSpendCents = 0
  let wins = 0
  let losses = 0
  let bestRank: number | null = null

  for (let i = 0; i < horizonWeeks; i++) {
    const f = stepFatigueWeek(world, rng, policy)
    weekly.push({
      week: f.week,
      condition: f.condition,
      injured: f.injured,
      tierPlayed: f.tierPlayed,
      matches: f.matchScores.length,
    })
    condSum += f.condition
    if (f.condition < 40) bandLow++
    else if (f.condition < 70) bandMid++
    else bandHigh++
    if (f.condition === ECONOMY.condition.max) weeksAt100++
    if (f.condition === ECONOMY.condition.min) weeksAt0++
    if (f.condition < trough) trough = f.condition
    if (f.injured) weeksInjured++
    if (f.injuryOnset) {
      injuriesBySeverity[f.injuryOnset.severity]++
    }
    if (f.walkover) walkovers++
    cautionEntries += f.cautionEntries
    entries += f.entriesCommitted
    physioSpendCents += f.physioSpendCents
    coachingSpendCents += f.coachingSpendCents
    wins += f.wins
    losses += f.losses
    if (kidPoints(world) > 0 && (bestRank === null || world.kidRank < bestRank)) bestRank = world.kidRank
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 1) endOfSeasonCondition.push(f.condition)
  }

  return {
    seed,
    weekly,
    meanCondition: condSum / horizonWeeks,
    bandLow,
    bandMid,
    bandHigh,
    weeksAt100,
    weeksAt0,
    trough,
    endOfSeasonCondition,
    injuriesBySeverity,
    injuriesTotal: SEVERITIES.reduce((s, sev) => s + injuriesBySeverity[sev], 0),
    weeksInjured,
    walkovers,
    cautionEntries,
    entries,
    physioSpendCents,
    coachingSpendCents,
    endFundsCents: world.fundsCents,
    matchesPlayed: wins + losses,
    wins,
    losses,
    bestRank,
    endRank: world.kidRank,
    endPoints: kidPoints(world),
  }
}

/** All 30 seeds of one (profile, policy, horizon) cell. */
export function runCell(profile: Profile, policy: Policy, horizonWeeks: number, seeds = SEEDS_PER_CELL): RunResult[] {
  const rows: RunResult[] = []
  for (let i = 0; i < seeds; i++) rows.push(runFatigueCareer(profile, policy, i, horizonWeeks))
  return rows
}

// --- stats ----------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

/** Population standard deviation (the 30 seeds are the whole population of the cell). */
export function stddev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export interface CellStats {
  profile: Profile
  policy: Policy
  horizon: FatigueHorizon
  runs: RunResult[]
  meanCond: number
  meanCondSd: number
  /** pooled week shares across all seeds, in percent. */
  pctLow: number
  pctMid: number
  pctHigh: number
  pctAt100: number
  troughMean: number
  troughMin: number
  /** mean condition at each season year's last week. */
  endOfSeasonMean: number[]
  injPerSeason: number
  injPerSeasonSd: number
  sevPerSeason: Record<InjurySeverity, number>
  weeksLostPerSeason: number
  walkoversPerCareer: number
  cautionPerSeason: number
  physioPerSeasonCents: number
  coachingPerSeasonCents: number
  endFundsMeanCents: number
  endPointsMean: number
  /** pooled kid match-win %: sum wins / sum matches across the cell. */
  winPct: number
  matchesPerSeason: number
  entriesPerSeason: number
  /** mean best rank over the seeds that got ranked at all, + how many did. */
  bestRankMean: number | null
  rankedCount: number
  /** mean weekly condition across seeds – the sparkline source (length = horizon weeks). */
  meanWeekly: number[]
}

export function computeCellStats(
  profile: Profile,
  policy: Policy,
  horizon: FatigueHorizon,
  runs: RunResult[],
): CellStats {
  const seasons = horizon.weeks / WEEKS_PER_YEAR
  const totalWeeks = runs.length * horizon.weeks
  const meanWeekly: number[] = []
  for (let w = 0; w < horizon.weeks; w++) meanWeekly.push(mean(runs.map((r) => r.weekly[w].condition)))
  const sevPerSeason = { minor: 0, moderate: 0, major: 0, severe: 0 } as Record<InjurySeverity, number>
  for (const sev of SEVERITIES) sevPerSeason[sev] = mean(runs.map((r) => r.injuriesBySeverity[sev] / seasons))
  const endOfSeasonMean: number[] = []
  for (let s = 0; s < seasons; s++) endOfSeasonMean.push(mean(runs.map((r) => r.endOfSeasonCondition[s])))
  const totalWins = runs.reduce((s, r) => s + r.wins, 0)
  const totalMatches = runs.reduce((s, r) => s + r.matchesPlayed, 0)
  const ranked = runs.filter((r) => r.bestRank !== null)
  return {
    profile,
    policy,
    horizon,
    runs,
    meanCond: mean(runs.map((r) => r.meanCondition)),
    meanCondSd: stddev(runs.map((r) => r.meanCondition)),
    pctLow: (100 * runs.reduce((s, r) => s + r.bandLow, 0)) / totalWeeks,
    pctMid: (100 * runs.reduce((s, r) => s + r.bandMid, 0)) / totalWeeks,
    pctHigh: (100 * runs.reduce((s, r) => s + r.bandHigh, 0)) / totalWeeks,
    pctAt100: (100 * runs.reduce((s, r) => s + r.weeksAt100, 0)) / totalWeeks,
    troughMean: mean(runs.map((r) => r.trough)),
    troughMin: Math.min(...runs.map((r) => r.trough)),
    endOfSeasonMean,
    injPerSeason: mean(runs.map((r) => r.injuriesTotal / seasons)),
    injPerSeasonSd: stddev(runs.map((r) => r.injuriesTotal / seasons)),
    sevPerSeason,
    weeksLostPerSeason: mean(runs.map((r) => r.weeksInjured / seasons)),
    walkoversPerCareer: mean(runs.map((r) => r.walkovers)),
    cautionPerSeason: mean(runs.map((r) => r.cautionEntries / seasons)),
    physioPerSeasonCents: mean(runs.map((r) => r.physioSpendCents / seasons)),
    coachingPerSeasonCents: mean(runs.map((r) => r.coachingSpendCents / seasons)),
    endFundsMeanCents: mean(runs.map((r) => r.endFundsCents)),
    endPointsMean: mean(runs.map((r) => r.endPoints)),
    winPct: totalMatches === 0 ? 0 : (100 * totalWins) / totalMatches,
    matchesPerSeason: mean(runs.map((r) => r.matchesPlayed / seasons)),
    entriesPerSeason: mean(runs.map((r) => r.entries / seasons)),
    bestRankMean: ranked.length ? mean(ranked.map((r) => r.bestRank as number)) : null,
    rankedCount: ranked.length,
    meanWeekly,
  }
}

// --- rendering -------------------------------------------------------------------

const BLOCKS = '▁▂▃▄▅▆▇█'

/** One condition value (0..100) to one sparkline block. */
export function sparkChar(condition: number): string {
  const idx = Math.min(BLOCKS.length - 1, Math.max(0, Math.floor(condition / (100 / BLOCKS.length))))
  return BLOCKS[idx]
}

/** The cell's mean weekly condition as one 52-char row per season. */
export function sparkRows(meanWeekly: number[]): string[] {
  const rows: string[] = []
  for (let s = 0; s * WEEKS_PER_YEAR < meanWeekly.length; s++) {
    rows.push(
      meanWeekly
        .slice(s * WEEKS_PER_YEAR, (s + 1) * WEEKS_PER_YEAR)
        .map(sparkChar)
        .join(''),
    )
  }
  return rows
}

function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}
function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s
}

const POLICY_W = 31

function tableHeader(): string {
  const cols = [
    ['cond', 6],
    ['±sd', 5],
    ['%<40', 6],
    ['40-69', 6],
    ['≥70', 6],
    ['@100', 6],
    ['low', 8],
    ['inj/s', 7],
    ['mn/mo/mj/sv', 21],
    ['lost/s', 7],
    ['WO/c', 5],
    ['caut/s', 7],
    ['phys$/s', 8],
    ['win%', 6],
    ['mt/s', 6],
    ['ent/s', 6],
    ['bestRk', 7],
  ] as [string, number][]
  return '  ' + padEnd('policy', POLICY_W) + cols.map(([c, w]) => pad(c, w)).join('')
}

function cellRow(c: CellStats): string {
  const sev = SEVERITIES.map((s) => c.sevPerSeason[s].toFixed(2)).join('/')
  const bestRk = c.bestRankMean === null ? '–' : `#${Math.round(c.bestRankMean)}`
  const cells: [string, number][] = [
    [c.meanCond.toFixed(1), 6],
    [c.meanCondSd.toFixed(1), 5],
    [c.pctLow.toFixed(1), 6],
    [c.pctMid.toFixed(1), 6],
    [c.pctHigh.toFixed(1), 6],
    [c.pctAt100.toFixed(1), 6],
    [`${c.troughMean.toFixed(0)}·${c.troughMin}`, 8],
    [c.injPerSeason.toFixed(2), 7],
    [sev, 21],
    [c.weeksLostPerSeason.toFixed(1), 7],
    [c.walkoversPerCareer.toFixed(2), 5],
    [c.cautionPerSeason.toFixed(2), 7],
    [`$${Math.round(c.physioPerSeasonCents / 100)}`, 8],
    [c.winPct.toFixed(1), 6],
    [c.matchesPerSeason.toFixed(1), 6],
    [c.entriesPerSeason.toFixed(1), 6],
    [bestRk, 7],
  ]
  return '  ' + padEnd(c.policy.label, POLICY_W) + cells.map(([s, w]) => pad(s, w)).join('')
}

/** Degeneracy screens the spec asks the report to surface: pinned condition, injury spirals,
 *  unplayable calendars. Returns human-readable findings (empty = nothing degenerate). */
export function degeneracyFindings(c: CellStats): string[] {
  const out: string[] = []
  const pooledAt0 = (100 * c.runs.reduce((s, r) => s + r.weeksAt0, 0)) / (c.runs.length * c.horizon.weeks)
  if (pooledAt0 > 1) out.push(`condition pinned at 0 for ${pooledAt0.toFixed(1)}% of weeks`)
  if (c.pctAt100 > 90) out.push(`condition pinned at 100 for ${c.pctAt100.toFixed(1)}% of weeks`)
  if (c.weeksLostPerSeason > 26) out.push(`injury spiral: ${c.weeksLostPerSeason.toFixed(1)} weeks lost/season`)
  if (c.entriesPerSeason < 1) out.push(`unplayable calendar: ${c.entriesPerSeason.toFixed(1)} entries/season`)
  return out.map((f) => `${c.profile.label.trim()} × ${c.policy.id}: ${f}`)
}

// --- grid rendering ---------------------------------------------------------

const GRID_COLS: [string, number][] = [
  ['plan', 7],
  ['entry', 10],
  ['physio', 7],
  ['cond', 7],
  ['low', 8],
  ['inj/s', 7],
  ['lost/s', 7],
  ['win%', 6],
  ['mt/s', 6],
  ['ent/s', 6],
  ['coach$/s', 9],
  ['phys$/s', 8],
  ['endFunds', 10],
  ['endPts', 7],
  ['bestRk', 7],
]

function gridHeader(): string {
  return '  ' + GRID_COLS.map(([c, w]) => pad(c, w)).join('')
}

function gridRow(planId: string, entryId: string, physio: string, c: CellStats): string {
  const bestRk = c.bestRankMean === null ? '–' : `#${Math.round(c.bestRankMean)}`
  const endFunds = `$${Math.round(c.endFundsMeanCents / 100).toLocaleString('en-US')}`
  const cells = [
    planId,
    entryId,
    physio,
    c.meanCond.toFixed(1),
    `${c.troughMean.toFixed(0)}·${c.troughMin}`,
    c.injPerSeason.toFixed(2),
    c.weeksLostPerSeason.toFixed(1),
    c.winPct.toFixed(1),
    c.matchesPerSeason.toFixed(1),
    c.entriesPerSeason.toFixed(1),
    `$${Math.round(c.coachingPerSeasonCents / 100).toLocaleString('en-US')}`,
    `$${Math.round(c.physioPerSeasonCents / 100)}`,
    endFunds,
    c.endPointsMean.toFixed(0),
    bestRk,
  ]
  return '  ' + cells.map((s, i) => pad(s, GRID_COLS[i][1])).join('')
}

/** Pooled corner-case screens over every grid cell – the owner's "does ANYTHING bite?" read. */
function gridCornerBlock(cells: CellStats[]): string[] {
  const out: string[] = []
  const neverBelowKnee = cells.filter((c) => c.troughMin >= ECONOMY.condition.matchStrengthKnee)
  out.push(
    `  knee (${ECONOMY.condition.matchStrengthKnee}) never crossed in ${neverBelowKnee.length}/${cells.length} cells` +
      ` – the win% coupling is inert there; worst trough anywhere = ${Math.min(...cells.map((c) => c.troughMin))}.`,
  )
  const dipped = cells.filter((c) => c.troughMin < ECONOMY.condition.matchStrengthKnee)
  for (const c of dipped) {
    out.push(`  below-knee cell: ${c.profile.label.trim()} × ${c.policy.id} (worst trough ${c.troughMin})`)
  }
  const anyLow = cells.filter((c) => c.pctLow > 0)
  out.push(
    anyLow.length === 0
      ? '  no cell EVER sees a week under condition 40 – the <40 band is unreachable under the current knobs.'
      : `  cells with <40 weeks: ${anyLow.map((c) => `${c.profile.label.trim()} × ${c.policy.id}`).join(', ')}`,
  )
  const maxLost = cells.reduce((a, b) => (a.weeksLostPerSeason >= b.weeksLostPerSeason ? a : b))
  out.push(
    `  heaviest injury toll: ${maxLost.profile.label.trim()} × ${maxLost.policy.id} at ` +
      `${maxLost.weeksLostPerSeason.toFixed(1)} weeks lost/season (${maxLost.injPerSeason.toFixed(2)} inj/season).`,
  )
  // Axis effects, pooled across profiles (paired seeds make the deltas meaningful).
  const byPhysio = (ph: string) => cells.filter((c) => c.policy.id.endsWith(ph))
  const injOf = (xs: CellStats[]) => mean(xs.map((c) => c.injPerSeason))
  const condOf = (xs: CellStats[]) => mean(xs.map((c) => c.meanCond))
  out.push(
    `  physio axis (pooled): inj/season ${injOf(byPhysio('·on')).toFixed(2)} on vs ${injOf(byPhysio('·off')).toFixed(2)} off · ` +
      `mean cond ${condOf(byPhysio('·on')).toFixed(1)} vs ${condOf(byPhysio('·off')).toFixed(1)}.`,
  )
  const byPlan = (planId: string) => cells.filter((c) => c.policy.id.startsWith(planId))
  out.push(
    '  plan axis (pooled): ' +
      GRID_PLANS.map((p) => `${p.id} cond ${condOf(byPlan(p.id)).toFixed(1)} / inj ${injOf(byPlan(p.id)).toFixed(2)}`).join(' · ') +
      '.',
  )
  const byEntry = (entryId: string) => cells.filter((c) => c.policy.id.includes(`·${entryId}·`))
  out.push(
    '  entry axis (pooled): ' +
      GRID_ENTRIES.map((e) => {
        const xs = byEntry(e.id)
        return `${e.id} mt/s ${mean(xs.map((c) => c.matchesPerSeason)).toFixed(1)} / inj ${injOf(xs).toFixed(2)} / caut/s ${mean(xs.map((c) => c.cautionPerSeason)).toFixed(2)}`
      }).join(' · ') +
      '.',
  )
  return out
}

const HEADER = [
  'Ties Break – fatigue/injury bench (round-9 condition math; measurement only, zero engine changes)',
  '',
  `Policies: grinder = plan 85/15, enters everything eligible+affordable (ignores the fatigue caution);`,
  `  balanced = plan 75/25, same entry rule; careful = plan 60/40, physio ALWAYS on, skips entry while`,
  `  condition < tier floor + 10. Physio for grinder/balanced follows the game default (ON iff hired coach).`,
  `Entries commit within ${ENTRY_LOOKAHEAD} weeks of the deadline (econ-bench policy v3); spawned runs are`,
  '  skip-revealed and closed the same week, so per-match strain lands the week it is played.',
  `Seeds are paired: fatigue-<background>-<index> – policies and both middle presets face the SAME`,
  '  calendar, cohort and injury/physio sub-stream rolls; only condition, tau and entries differ.',
  `${SEEDS_PER_CELL} seeds/cell. Columns: cond = mean weekly condition; %<40 / 40-69 / ≥70 = pooled week share`,
  '  by band; @100 = share of weeks at the exact cap; low = mean trough · worst trough; inj/s = injuries',
  '  per season (mn/mo/mj/sv = severity split per season); lost/s = injured weeks per season; WO/c =',
  '  walkovers per career; caut/s = caution entries (below tier floor) per season; phys$/s = physio+medical',
  '  spend per season; win% = pooled kid match-win rate; mt/s = matches per season; ent/s = entries per',
  '  season; bestRk = mean best dense rank while ranked. Sparklines: mean weekly condition, one row of 52',
  '  chars per season (▁=0-12 … █=88-100).',
  '',
  `FACTORIAL GRID (owner 25.07): plan × entry × physio unbundled = 12 cells per profile at ${GRID_HORIZON_WEEKS}w,`,
  `  ${GRID_SEEDS} seeds/cell (REDUCED from ${SEEDS_PER_CELL} for runtime; the headline trio keeps ${SEEDS_PER_CELL}). Money coupling per cell:`,
  '  coach$/s = planFactor-scaled coaching spend per season; endFunds = mean family funds at horizon end.',
  'NOT MODELED YET: friendly matches and vacations (season-planner slice) – both are condition levers',
  '  this grid cannot see. Re-run the grid when they land; policies are data (gridPolicies), so the new',
  '  axis is a field, not a fork.',
].join('\n')

// --- CSV ---------------------------------------------------------------------

export function toCsv(all: { horizon: FatigueHorizon; profile: Profile; policy: Policy; runs: RunResult[] }[]): string {
  const lines = ['horizon_weeks,profile,policy,seed,week,condition,injured,tier_played,matches']
  for (const { horizon, profile, policy, runs } of all) {
    for (const r of runs) {
      for (const w of r.weekly) {
        lines.push(
          [
            horizon.weeks.toString(),
            profile.label.trim().replace(/\s+/g, ' '),
            policy.id,
            r.seed,
            w.week.toString(),
            w.condition.toString(),
            w.injured ? '1' : '0',
            w.tierPlayed ?? '',
            w.matches.toString(),
          ].join(','),
        )
      }
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ---------------------------------------------------------------------

function parseCsvPath(argv: string[]): string | null {
  const i = argv.indexOf('--csv')
  if (i === -1) return null
  const path = argv[i + 1]
  if (!path || path.startsWith('--')) throw new Error('--csv requires a file path argument')
  return path
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const csvPath = parseCsvPath(argv)
  console.log(HEADER)

  const all: { horizon: FatigueHorizon; profile: Profile; policy: Policy; runs: RunResult[] }[] = []
  const degenerate: string[] = []

  for (const horizon of FATIGUE_HORIZONS) {
    const rule = '═'.repeat(120)
    console.log('')
    console.log(rule)
    console.log(`  HORIZON ${horizon.label} – ${horizon.seasons} season${horizon.seasons > 1 ? 's' : ''}`)
    console.log(rule)
    for (const profile of PROFILES) {
      console.log('')
      console.log(`  PROFILE ${profile.label}`)
      console.log(tableHeader())
      const cellsOfProfile: CellStats[] = []
      for (const policy of POLICIES) {
        const runs = runCell(profile, policy, horizon.weeks)
        all.push({ horizon, profile, policy, runs })
        const stats = computeCellStats(profile, policy, horizon, runs)
        cellsOfProfile.push(stats)
        degenerate.push(...degeneracyFindings(stats))
        console.log(cellRow(stats))
      }
      // Season shape: mean weekly condition sparkline per policy, one 52-char row per season.
      for (const stats of cellsOfProfile) {
        const rows = sparkRows(stats.meanWeekly)
        rows.forEach((row, s) => {
          const label = s === 0 ? `shape ${stats.policy.id}` : ''
          console.log('  ' + padEnd(label, 17) + `S${s + 1} ` + row)
        })
      }
      // End-of-season condition per season – the carry-over signal.
      for (const stats of cellsOfProfile) {
        console.log(
          '  ' +
            padEnd(`endSeason ${stats.policy.id}`, 20) +
            stats.endOfSeasonMean.map((c, s) => `S${s + 1} ${c.toFixed(1)}`).join(' · '),
        )
      }
      // Anchors (spec): balanced vs real junior prevalence; grinder-vs-careful injury ratio.
      const grinder = cellsOfProfile[0]
      const balanced = cellsOfProfile[1]
      const careful = cellsOfProfile[2]
      const minorShare =
        balanced.injPerSeason === 0 ? 0 : (100 * balanced.sevPerSeason.minor) / balanced.injPerSeason
      const ratio =
        careful.injPerSeason === 0 ? Infinity : grinder.injPerSeason / careful.injPerSeason
      console.log(
        `  anchors: balanced inj/season ${balanced.injPerSeason.toFixed(2)} (target ~0.5-1.1; minors ${minorShare.toFixed(0)}%)` +
          ` · grinder/careful injury ratio ${ratio === Infinity ? 'inf' : ratio.toFixed(1)}x (anchor ≥3x)`,
      )
    }
  }

  // --- factorial grid (12 unbundled cells per profile, one horizon, reduced seeds) ---
  const gridHorizon = FATIGUE_HORIZONS.find((h) => h.weeks === GRID_HORIZON_WEEKS)!
  const gridCells: CellStats[] = []
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log(
    `  FACTORIAL GRID – plan × entry × physio, ${GRID_HORIZON_WEEKS}w, ${GRID_SEEDS} seeds/cell` +
      ` (reduced from ${SEEDS_PER_CELL}; headline trio above keeps ${SEEDS_PER_CELL})`,
  )
  console.log(rule)
  for (const profile of PROFILES) {
    console.log('')
    console.log(`  PROFILE ${profile.label}`)
    console.log(gridHeader())
    for (const p of GRID_PLANS) {
      for (const e of GRID_ENTRIES) {
        for (const ph of GRID_PHYSIO) {
          const policy = gridPolicies().find((g) => g.id === `${p.id}·${e.id}·${ph}`)!
          const runs = runCell(profile, policy, GRID_HORIZON_WEEKS, GRID_SEEDS)
          all.push({ horizon: gridHorizon, profile, policy, runs })
          const stats = computeCellStats(profile, policy, gridHorizon, runs)
          gridCells.push(stats)
          degenerate.push(...degeneracyFindings(stats))
          console.log(gridRow(p.id, e.id, ph, stats))
        }
      }
    }
  }
  console.log('')
  console.log('  GRID CORNER CASES')
  for (const line of gridCornerBlock(gridCells)) console.log(line)

  console.log('')
  if (degenerate.length) {
    console.log('DEGENERATE CELLS:')
    for (const d of degenerate) console.log('  ' + d)
  } else {
    console.log('Degenerate cells: none (no 0/100 pinning beyond thresholds, no injury spirals, no unplayable calendars).')
  }
  console.log(
    'REMINDER: friendly matches + vacations are not in the engine yet (season-planner slice) – re-run this',
  )
  console.log('  bench, grid included, when they land.')

  if (csvPath) {
    writeFileSync(csvPath, toCsv(all))
    console.log(`Weekly time-series written to ${csvPath}`)
  }
}

// Run only when invoked as the CLI script, never when imported by the test (vitest sets
// process.env.VITEST – same guard as econ-bench; under vite-node argv[1] is the runner).
if (!process.env.VITEST) {
  main()
}
