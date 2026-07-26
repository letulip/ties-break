/**
 * Economy bench (Part C of docs/specs/econ-breakdown-bench.md, extended to whole-horizon in
 * docs/specs/econ-bench-horizon.md) – a headless "how much does the CAREER eat, and who survives it"
 * tool.
 *
 * MEASUREMENT ONLY. This file imports the engine and reads the finance aggregate; it changes NO
 * engine/economy numbers. It exists so we stop hand-clicking difficulty branches and can diagnose,
 * by category, WHY a tier goes bankrupt and how far each family's bankroll runs.
 *
 * Presets = the real difficulty tiers 8k / 25k / 120k = family backgrounds working / middle / wealthy
 * (the background alone sets STARTING_FUNDS + parent income + expense/travel factors). coachSetup and
 * plan = balanced (75/25) are held per-preset so ONLY the intended lever varies.
 *
 * WHOLE HORIZON (Wave 1): instead of one 52-week season, run the SAME world forward to two career
 * milestones and report, per profile, the cumulative chance of surviving (not going bankrupt) and a
 * reach-rate proxy:
 *   14→16 = 104 weeks (2 seasons, "first prize money" proxy)
 *   14→18 = 208 weeks (4 seasons, "pro attempt" proxy)
 * State carries across seasons because we keep ONE createWorld + ONE rngFromSeed for the whole horizon
 * and just tick further – fundsCents, kidRank, the rolling results ledger, bestFinishByTier and
 * lastSeasonSummary all live on the world.
 *
 * *** CAVEAT – prize money is NOT modeled yet. *** Tournaments award POINTS only; income = parent
 * contribution + local sponsor + gear subsidy. So this bench measures SURVIVAL RUNWAY (how long the
 * family bankroll lasts) plus a POINTS/RANK REACH-RATE proxy – NOT earnings. A literal "first prize
 * money" milestone would need a payout income category in finalizeTournament first, which is out of
 * scope for a measurement-only tool.
 *
 * Finance read (the correctness crux): the engine prunes financeWeeks to a 60-week trailing window,
 * so financeWindow(fw, 0) at horizon end silently drops every season but the last ~60 weeks. Instead
 * we ACCUMULATE per season: at each season wrap (world.week % 52 === 49) we fold that year's block
 * with financeWindow(fw, yearStartWeek) – a full year is always still retained at its own wrap week
 * since 52 < 60 – and sum the per-year folds for the cumulative income/expense/net.
 *
 * Monte-Carlo: one career is noisy, so we average 30 seeds per preset (seed varied by index, never
 * Math.random – the engine forbids wall-clock/Math.random and same seed+preset must reproduce
 * byte-identically).
 *
 * Run:  npm run bench:econ            (console tables, both horizons)
 *       npm run bench:econ -- --csv /path/to/rows.csv   (also dump per-seed rows)
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
  financeWindow,
  availabilityStatus,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CoachSetup, FamilyBackground, PlayerProfile, WorldEventCategory } from '../src/shared/protocol'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

export { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** Careers start at age 14; ageYears = START_AGE_YEARS + Math.floor(week / 52). */
export const START_AGE_YEARS = 14
export const SEEDS_PER_PRESET = 30
/** How many weeks before an event's entry deadline the policy commits to it. A near-deadline window
 *  (not the full rolling horizon) keeps the entry count realistic – see stepCareerWeek. */
export const ENTRY_LOOKAHEAD = 3

/** The tick at which a season wraps (its first off-season week): 49, 101, 153, 205. maybeFireSeasonWrapUp
 *  fires here and overwrites world.lastSeasonSummary, and the full just-finished year is still retained
 *  in the 60-week finance ledger, so this is where we fold each season's finance. */
export const SEASON_WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49

export interface Horizon {
  /** code label; the arrow is fine in a code label, prose stays on the short dash "–". */
  label: string
  /** total weeks ticked = (targetAge - START_AGE_YEARS) * 52. */
  weeks: number
  /** age reached at the end of the horizon. */
  targetAge: number
  /** one-line prose describing the milestone this horizon proxies. */
  blurb: string
}

// Two horizons, both iterated in main. weeks = (targetAge - 14) * 52.
export const HORIZONS: Horizon[] = [
  { label: '14→16', weeks: 104, targetAge: 16, blurb: 'first prize money proxy (national-tier eligibility)' },
  { label: '14→18', weeks: 208, targetAge: 18, blurb: 'pro attempt proxy (top-50 once ranked, or 300 points)' },
]

// Reach targets. The engine models NO prize money, so the target is defined against existing state.
/** 14→16: national-tier eligibility == kidPoints(world) >= 150 (== isTierEligible('national', pts)). */
export const REACH_TARGET_MONEY = 150
/** 14→18 "pro" proxy: a top-50 rank ONCE she is actually ranked (has a counting result) OR a points
 *  threshold. The `hasResults` guard on the rank arm is REQUIRED – see reachedTarget. */
export const REACH_PRO_RANK = 50
export const REACH_PRO_POINTS = 300

export interface Preset {
  /** table label, e.g. "25k  · middle · hired coach" */
  label: string
  background: FamilyBackground
  /** coaching setup drives the biggest expense line, so it's a preset dimension, not a
   *  constant: a working family self-coaches (parent, $120-400/wk), an affluent one hires
   *  ($250-700/wk). middle is run BOTH ways to expose the coaching lever's swing. */
  coachSetup: CoachSetup
}

// 8k / 25k / 120k = working / middle / wealthy (the tier IS the family background). Coach setup
// is realistic per tier: working self-coaches (can't afford a hired coach); wealthy hires; middle
// is shown both ways because the coach choice is the dominant survivability lever.
export const PRESETS: Preset[] = [
  { label: '8k   · working · self-coached', background: 'working', coachSetup: 'parent' },
  { label: '25k  · middle  · self-coached', background: 'middle', coachSetup: 'parent' },
  { label: '25k  · middle  · hired coach', background: 'middle', coachSetup: 'hired' },
  { label: '120k · wealthy · hired coach', background: 'wealthy', coachSetup: 'hired' },
]

/** The per-category buckets we surface, in display order (expenses first, then income).
 *  'interest' (round-9 R9-1, weekly savings interest) is an INCOME category.
 *  'vacation' / 'practice' (season planner, v13) are expense buckets: the econ bench never books
 *  either (it has no planner policy – that is the fatigue bench's axis), so they read $0 here and
 *  exist only to keep the category fold exhaustive. */
export const EXPENSE_CATS: WorldEventCategory[] = ['coaching', 'travel', 'entry', 'gear', 'stringing', 'physio', 'vacation', 'practice', 'other']
export const INCOME_CATS: WorldEventCategory[] = ['income', 'sponsor', 'interest']

/** One completed season, captured at its wrap week off world.lastSeasonSummary + that year's finance fold. */
export interface PerSeason {
  /** calendar-year label of the season that just ended (weekYear of its first week). */
  seasonYear: number
  /** kid's dense rank at wrap-up. */
  endRank: number
  /** ranking points earned in-season. */
  points: number
  wins: number
  losses: number
  /** this season's net cents (income - expense), from financeWindow(fw, yearStart) at the wrap. */
  netCents: number
}

export interface SeedResult {
  seed: string
  /** per-category magnitudes in cents, CUMULATIVE across the horizon (expenses positive, income positive). */
  cats: Record<WorldEventCategory, number>
  /** sum of every expense category over the horizon (a positive number) */
  grossExpenseCents: number
  /** sum of every income category over the horizon (parent contribution + sponsor) */
  totalIncomeCents: number
  /** totalIncome - grossExpense, cumulative over the captured seasons */
  netCents: number
  endFundsCents: number
  /** first week fundsCents < 0, or null if the family never went into the red over the FULL horizon */
  weeksToBankrupt: number | null
  /** true ⇔ the family survived the whole horizon (weeksToBankrupt === null) */
  survived: boolean
  /** lowest fundsCents reached across the run (a "peak deficit" when negative) */
  peakDeficitCents: number
  /** first week the horizon's reach target was met, or null if it never was */
  reachedWeek: number | null
  /** kid's dense rank at horizon end */
  endRank: number
  /** kid's earned ranking points at horizon end */
  endPoints: number
  /** one entry per completed season (2 for 14→16, 4 for 14→18) */
  perSeason: PerSeason[]
  /** tournaments entered over the horizon: total plus the ranking-gated per-tier split.
   *  Every tier in the catalogue is live since ladder-up, so total === Σ byTier. */
  entries: { total: number; byTier: Record<TierId, number> }
  /** DIAGNOSTIC ONLY: financeWindow(financeWeeks, 0).netCents read at horizon end – the OLD BUGGY read
   *  that the 60-week pruning corrupts past 60 weeks. Kept so tests can prove the fix; not featured in
   *  the console table (surfaced in the CSV so the correction is auditable). */
  naiveNetCents: number
}

function zeroCats(): Record<WorldEventCategory, number> {
  return {
    coaching: 0,
    travel: 0,
    entry: 0,
    gear: 0,
    stringing: 0,
    physio: 0,
    vacation: 0,
    practice: 0,
    sponsor: 0,
    income: 0,
    interest: 0,
    other: 0,
  }
}

// --- career simulation -------------------------------------------------------

/** Open a fresh, deterministic career for a preset+index: createWorld + rngFromSeed(world.seed) are
 *  the ONLY entropy sources, so the same (preset, index) reproduces exactly. Exported so tests can
 *  replay a career week by week without duplicating the engine wiring. */
export function openCareer(preset: Preset, index: number): { world: WorldState; rng: Rng; seed: string } {
  const seed = `bench-${preset.background}-${index}`
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: preset.background,
    coachSetup: preset.coachSetup,
  }
  const world = createWorld(seed, profile)
  const rng = rngFromSeed(world.seed)
  return { world, rng, seed }
}

/** Zeroed per-tier counter over the whole live catalogue (ladder-up: six rungs). */
export function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

/** Advance ONE career week under entry policy v3, then tick and resolve any spawned tournament.
 *  Returns the per-tier entries committed this week. Shared by runCareer and the tests so the world
 *  evolution is defined in exactly one place (no duplication of the entry policy). */
export function stepCareerWeek(world: WorldState, rng: Rng): Record<TierId, number> {
  const entered = zeroByTier()
  // Entry policy v3: enter each RANKING-ELIGIBLE event affordable by entry+travel as its deadline
  // APPROACHES (within ENTRY_LOOKAHEAD weeks) – a parent commits a few weeks out, not a year ahead.
  //
  // Ladder-up: the season now stacks several tiers on the same week, so the policy walks the
  // calendar STRONGEST-TIER-FIRST and takes at most one event per week (enterEvent enforces the
  // rule; the policy has to choose, and an ambitious parent picks the biggest event she qualifies
  // for). Without the ordering the policy would just grab whichever rung happened to sort first.
  const byRung = [...world.season].sort(
    (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
  )
  for (const e of byRung) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue // deadline passed – enterEvent would throw
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue // too far out – commit nearer the date
    // One tournament a week: skip the week entirely once something is booked on it.
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    // Ranking gate (before affordability): the kid may only enter tiers her EARNED points open.
    if (!isTierEligible(e.tier, kidPoints(world))) continue
    // Availability gate (Season-Life): skip HARD-blocked events (school exams / injured) the way
    // a parent would – enterEvent throws on them. 'caution' (fatigue) stays enterable by design.
    if (availabilityStatus(world, e).level === 'blocked') continue
    const cost = TIERS[e.tier].entryFeeCents + e.travelCostCents
    if (world.fundsCents < cost) continue // can't afford entry+travel – policy stalls here
    enterEvent(world, e.id)
    entered[e.tier]++
  }
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
  return entered
}

/** True ⇔ the horizon's reach target is currently met. 14→16: national eligibility (points >= 150).
 *  14→18: (ranked AND top-50) OR a 300-point threshold. Keyed on targetAge derived from the horizon. */
function reachedTarget(world: WorldState, horizonWeeks: number): boolean {
  const targetAge = START_AGE_YEARS + Math.floor(horizonWeeks / WEEKS_PER_YEAR)
  const points = kidPoints(world)
  if (targetAge >= 18) {
    // hasResults mirrors the engine's `ranked` signal (StatsScreen/HomeScreen use
    // `countingResults.length > 0`): the kid isn't really ranked until she owns a counting result.
    // Every kid result carries points > 0 (finalizeTournament only pushes scoring results), so
    // `points > 0` IS `computeCountingResults(world).length > 0`. The guard is REQUIRED: without it the
    // point-less field ties at dense-rank 1, firing kidRank<=50 at week 1 for everyone. The points arm
    // stays UNGUARDED (earned, not tie-degenerate).
    const hasResults = points > 0
    return (hasResults && world.kidRank <= REACH_PRO_RANK) || points >= REACH_PRO_POINTS
  }
  return points >= REACH_TARGET_MONEY
}

/**
 * Run ONE career headless to `horizonWeeks` for a preset+index. Deterministic: (preset, index,
 * horizon) reproduces byte-identically. Carries state across seasons by continuing to tick the SAME
 * world – fundsCents, kidRank, the results ledger and lastSeasonSummary all persist on it.
 *
 * The finance read accumulates per season at each wrap (world.week % 52 === 49) with
 * financeWindow(fw, yearStartWeek), summing the per-year folds – so it stays correct past the engine's
 * 60-week finance-ledger pruning, which financeWindow(fw, 0) at horizon end would fall foul of.
 */
export function runCareer(preset: Preset, index: number, horizonWeeks: number): SeedResult {
  const { world, rng, seed } = openCareer(preset, index)

  let peak = world.fundsCents
  let bankruptWeek: number | null = world.fundsCents < 0 ? 0 : null
  let reachedWeek: number | null = null
  const entries = { total: 0, byTier: zeroByTier() }

  // Per-season finance accumulation (survives the engine's 60-week pruning; see file header).
  const signedCats = zeroCats() // signed per category: income positive, expense negative
  let cumIncome = 0
  let cumExpense = 0
  let cumNet = 0
  const perSeason: PerSeason[] = []

  for (let i = 0; i < horizonWeeks; i++) {
    const e = stepCareerWeek(world, rng)
    for (const tier of TIER_LADDER) {
      entries.byTier[tier] += e[tier]
      entries.total += e[tier]
    }

    if (world.fundsCents < peak) peak = world.fundsCents
    if (bankruptWeek === null && world.fundsCents < 0) bankruptWeek = world.week
    if (reachedWeek === null && reachedTarget(world, horizonWeeks)) reachedWeek = world.week

    // Season wrap: fold this just-finished year's finance and bank its summary. The wrap week is
    // always off-season (no scheduled event, so no pending tournament), so maybeFireSeasonWrapUp has
    // already run inside tickWeek and world.lastSeasonSummary is this year's recap.
    if (world.week % WEEKS_PER_YEAR === SEASON_WRAP_OFFSET) {
      const yearStartWeek = Math.floor(world.week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR
      const fold = financeWindow(world.financeWeeks, yearStartWeek)
      for (const [cat, amt] of Object.entries(fold.byCategory) as [WorldEventCategory, number][]) {
        signedCats[cat] += amt
      }
      cumIncome += fold.incomeCents
      cumExpense += fold.expenseCents
      cumNet += fold.netCents
      const s = world.lastSeasonSummary
      perSeason.push({
        seasonYear: s?.seasonYear ?? START_AGE_YEARS + Math.floor(world.week / WEEKS_PER_YEAR),
        endRank: s?.endRank ?? world.kidRank,
        points: s?.points ?? 0,
        wins: s?.wins ?? 0,
        losses: s?.losses ?? 0,
        netCents: fold.netCents,
      })
    }
  }

  const cats = zeroCats()
  for (const cat of EXPENSE_CATS) cats[cat] = -signedCats[cat] // negatives -> positive magnitude
  for (const cat of INCOME_CATS) cats[cat] = signedCats[cat]

  return {
    seed,
    cats,
    grossExpenseCents: cumExpense,
    totalIncomeCents: cumIncome,
    netCents: cumNet,
    endFundsCents: world.fundsCents,
    weeksToBankrupt: bankruptWeek,
    survived: bankruptWeek === null,
    peakDeficitCents: peak,
    reachedWeek,
    endRank: world.kidRank,
    endPoints: kidPoints(world),
    perSeason,
    entries,
    naiveNetCents: financeWindow(world.financeWeeks, 0).netCents,
  }
}

// --- stats -------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

/** Population standard deviation (we have the whole 30-seed population, not a sample). */
export function stddev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// --- formatting --------------------------------------------------------------

/** Whole-dollar money for the console, e.g. -1863042 -> "-$18,630". */
function fmtUsd(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s // right-align
}
function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

const LABEL_W = 16
const COL_W = 13

function statRow(label: string, xs: number[]): string {
  const cells = [fmtUsd(mean(xs)), '±' + fmtUsd(stddev(xs)), fmtUsd(Math.min(...xs)), fmtUsd(Math.max(...xs))]
  return '  ' + padEnd(label, LABEL_W) + cells.map((c) => pad(c, COL_W)).join('')
}

function header(): string {
  return '  ' + padEnd('', LABEL_W) + ['mean', '±sd', 'min', 'max'].map((c) => pad(c, COL_W)).join('')
}

// --- rendering ---------------------------------------------------------------

const RULE = '─'.repeat(2 + LABEL_W + COL_W * 4)

function renderPreset(preset: Preset, horizon: Horizon, rows: SeedResult[]): string {
  const startFunds = STARTING_FUNDS_CENTS[preset.background]
  const out: string[] = []
  out.push('')
  out.push(RULE)
  const coachRange = preset.coachSetup === 'parent' ? 'self-coached $120-400/wk base' : 'hired coach $250-700/wk base'
  out.push(
    `  PRESET ${preset.label}   [${horizon.label}, ${horizon.weeks} wk / ${horizon.targetAge - START_AGE_YEARS} seasons]`,
  )
  out.push(`  start $${(startFunds / 100).toLocaleString('en-US')}, ${coachRange}, plan balanced 75/25`)
  out.push(RULE)
  out.push(header())

  out.push('  -- expense by category (cumulative over horizon) --')
  for (const cat of EXPENSE_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('GROSS EXPENSE', rows.map((r) => r.grossExpenseCents)))

  out.push('  -- income (cumulative; NO prize money – points only) --')
  for (const cat of INCOME_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('TOTAL INCOME', rows.map((r) => r.totalIncomeCents)))

  out.push('  -- bottom line --')
  out.push(statRow('NET (horizon)', rows.map((r) => r.netCents)))
  out.push(statRow('end funds', rows.map((r) => r.endFundsCents)))
  out.push(statRow('peak deficit', rows.map((r) => r.peakDeficitCents)))

  // How many tournaments the ranking gate actually let the kid enter over the horizon, total + split.
  const meanEntry = (sel: (r: SeedResult) => number) => mean(rows.map(sel)).toFixed(1)
  const totals = rows.map((r) => r.entries.total)
  const split = TIER_LADDER.map((t) => `${t} ${meanEntry((r) => r.entries.byTier[t])}`).join(' · ')
  out.push('  -- entries (ranking-gated, whole horizon) --')
  out.push(
    '  ' +
      padEnd('entries/career', LABEL_W) +
      `${meanEntry((r) => r.entries.total)} mean  ` +
      `[min ${Math.min(...totals)} / max ${Math.max(...totals)}]`,
  )
  out.push('  ' + padEnd('  per tier', LABEL_W) + split)

  // SURVIVAL (the headline): cumulative bankruptcy-survival over the FULL horizon.
  const survivors = rows.filter((r) => r.survived)
  const red = rows.filter((r) => r.weeksToBankrupt !== null)
  const redWeeks = red.map((r) => r.weeksToBankrupt as number)
  const medRedWeek = red.length ? median(redWeeks).toString() : '–'
  out.push('  -- survival & reach (SURVIVAL RUNWAY + points/rank proxy; prize money not modeled) --')
  out.push(
    '  ' +
      padEnd('survival', LABEL_W) +
      `survived ${survivors.length}/${rows.length} · median week-to-red = ${medRedWeek}` +
      (red.length ? ` (earliest week ${Math.min(...redWeeks)})` : ''),
  )

  // REACH-RATE proxy: % of seeds meeting the horizon target within the horizon, + median reach week.
  const reached = rows.filter((r) => r.reachedWeek !== null)
  const reachWeeks = reached.map((r) => r.reachedWeek as number)
  const reachPct = ((reached.length / rows.length) * 100).toFixed(0)
  const medReachWeek = reached.length ? median(reachWeeks).toString() : '–'
  out.push(
    '  ' +
      padEnd('reach', LABEL_W) +
      `reached ${reached.length}/${rows.length} (${reachPct}%) · median reach week = ${medReachWeek}  ` +
      `[target: ${horizon.blurb}]`,
  )

  // Per-season progression (mean end-of-season rank), so the multi-season carry is visible.
  const seasonCount = horizon.targetAge - START_AGE_YEARS
  const rankBySeason: string[] = []
  for (let s = 0; s < seasonCount; s++) {
    const ranks = rows.filter((r) => r.perSeason[s]).map((r) => r.perSeason[s].endRank)
    rankBySeason.push(ranks.length ? `S${s + 1} #${Math.round(mean(ranks))}` : `S${s + 1} –`)
  }
  out.push('  ' + padEnd('season endRank', LABEL_W) + rankBySeason.join(' · ') + '  (mean dense rank)')
  return out.join('\n')
}

const POLICY_HEADER = [
  'Ties Break – economy bench (measurement only; changes no engine numbers)',
  '',
  '*** CAVEAT – prize money is NOT modeled yet. Tournaments award POINTS only; income = parent',
  '    contribution + local sponsor + gear subsidy. This bench measures SURVIVAL RUNWAY (how long the',
  '    family bankroll lasts) plus a POINTS/RANK REACH-RATE proxy – NOT earnings. A literal "first',
  '    prize money" needs a payout income category in finalizeTournament first (out of scope here). ***',
  '',
  'Horizons run against the SAME continued world (state carries across seasons):',
  `  14→16 = 104 wk (2 seasons) – ${HORIZONS[0].blurb}`,
  `  14→18 = 208 wk (4 seasons) – ${HORIZONS[1].blurb}`,
  'Finance is folded per season at each wrap (financeWindow from the year start, summed) so it stays',
  '  correct past the engine\'s 60-week ledger pruning – a naive financeWindow(fw,0) would drop early seasons.',
  '',
  `Entry policy v3: each week, enter every RANKING-ELIGIBLE event (a tier her EARNED points open) the`,
  `  kid can afford entry+travel for AS ITS DEADLINE NEARS (within ${ENTRY_LOOKAHEAD} wk); tick; skip+close any`,
  `  spawned tournament. Funds red ⇒ entries stall; coaching still bleeds.`,
  `${SEEDS_PER_PRESET} seeds/preset · coach setup per preset · plan balanced (75/25).`,
  `Money is whole-dollar rounded; ±sd is the population stddev across the ${SEEDS_PER_PRESET} seeds.`,
].join('\n')

// --- CSV ---------------------------------------------------------------------

function toCsv(all: { horizon: Horizon; preset: Preset; rows: SeedResult[] }[]): string {
  const cols = [
    'horizon',
    'horizon_weeks',
    'preset',
    'background',
    'seed',
    ...EXPENSE_CATS.map((c) => `${c}_cents`),
    ...INCOME_CATS.map((c) => `${c}_cents`),
    'gross_expense_cents',
    'total_income_cents',
    'net_cents',
    'naive_window_net_cents',
    'end_funds_cents',
    'weeks_to_bankrupt',
    'survived',
    'peak_deficit_cents',
    'reached_week',
    'end_rank',
    'end_points',
    'seasons_captured',
    'entries_total',
    ...TIER_LADDER.map((t) => `entries_${t}`),
  ]
  const lines = [cols.join(',')]
  for (const { horizon, preset, rows } of all) {
    for (const r of rows) {
      const cells = [
        horizon.label,
        horizon.weeks.toString(),
        preset.label.trim(),
        preset.background,
        r.seed,
        ...EXPENSE_CATS.map((c) => r.cats[c].toString()),
        ...INCOME_CATS.map((c) => r.cats[c].toString()),
        r.grossExpenseCents.toString(),
        r.totalIncomeCents.toString(),
        r.netCents.toString(),
        r.naiveNetCents.toString(),
        r.endFundsCents.toString(),
        r.weeksToBankrupt === null ? '' : r.weeksToBankrupt.toString(),
        r.survived ? '1' : '0',
        r.peakDeficitCents.toString(),
        r.reachedWeek === null ? '' : r.reachedWeek.toString(),
        r.endRank.toString(),
        r.endPoints.toString(),
        r.perSeason.length.toString(),
        r.entries.total.toString(),
        ...TIER_LADDER.map((t) => r.entries.byTier[t].toString()),
      ]
      lines.push(cells.join(','))
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ---------------------------------------------------------------------

function parseCsvPath(argv: string[]): string | null {
  const i = argv.indexOf('--csv')
  if (i === -1) return null
  const path = argv[i + 1]
  if (!path || path.startsWith('--')) {
    throw new Error('--csv requires a file path argument')
  }
  return path
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const csvPath = parseCsvPath(argv)

  console.log(POLICY_HEADER)

  const all: { horizon: Horizon; preset: Preset; rows: SeedResult[] }[] = []
  for (const horizon of HORIZONS) {
    console.log('')
    console.log(`${'═'.repeat(2 + LABEL_W + COL_W * 4)}`)
    console.log(`  HORIZON ${horizon.label}  (${horizon.weeks} weeks, ${horizon.targetAge - START_AGE_YEARS} seasons) – ${horizon.blurb}`)
    console.log(`${'═'.repeat(2 + LABEL_W + COL_W * 4)}`)
    for (const preset of PRESETS) {
      const rows: SeedResult[] = []
      for (let i = 0; i < SEEDS_PER_PRESET; i++) rows.push(runCareer(preset, i, horizon.weeks))
      all.push({ horizon, preset, rows })
      console.log(renderPreset(preset, horizon, rows))
    }
  }
  console.log('')

  if (csvPath) {
    writeFileSync(csvPath, toCsv(all))
    console.log(`Per-seed rows written to ${csvPath}`)
  }
}

// Run only when invoked as the CLI script, never when imported by the test. Under vite-node
// process.argv[1] is the runner (not this file), so the usual argv[1] entry check doesn't apply;
// the reliable signal is simply "not inside vitest" (vitest sets process.env.VITEST). The test
// imports the exports above without ever triggering the full run.
if (!process.env.VITEST) {
  main()
}
