/**
 * Economy bench (Part C of docs/specs/econ-breakdown-bench.md) – a headless
 * "how much does a season eat" tool.
 *
 * MEASUREMENT ONLY. This file imports the engine and reads the finance aggregate; it
 * changes NO engine/economy numbers. It exists so we stop hand-clicking difficulty
 * branches and can diagnose, by category, WHY a tier goes bankrupt over a season.
 *
 * Presets = the real difficulty tiers 8k / 25k / 120k = family backgrounds
 * working / middle / wealthy (the background alone sets STARTING_FUNDS + parent income +
 * expense/travel factors). coachSetup = 'hired' and plan = balanced (75/25) are held
 * constant across presets so ONLY the tier varies.
 *
 * Monte-Carlo: one season is noisy, so we average 30 seeds per preset (seed varied by
 * index, never Math.random – the engine forbids wall-clock/Math.random and same
 * seed+preset must reproduce byte-identically).
 *
 * Entry policy v1 (materially drives the numbers – printed in the header, never hidden):
 *   each week, ENTER EVERY eligible event (any tier) the kid can afford entry+travel for
 *   at that moment, then tick, then resolve any spawned tournament (skip + close).
 * Once funds go negative the affordability gate blocks further entries on its own – the
 * policy stalls – while weekly coaching keeps bleeding (it is never funds-gated). That
 * stall is itself a finding, surfaced in the output.
 *
 * Run:  npm run bench:econ            (console table)
 *       npm run bench:econ -- --csv /path/to/rows.csv   (also dump per-seed rows)
 */
import { writeFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  financeWindow,
  STARTING_FUNDS_CENTS,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CoachSetup, FamilyBackground, PlayerProfile, WorldEventCategory } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'

export const SEASON_WEEKS = 52
export const SEEDS_PER_PRESET = 30

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

/** The per-category buckets we surface, in display order (expenses first, then income). */
export const EXPENSE_CATS: WorldEventCategory[] = ['coaching', 'travel', 'entry', 'gear', 'stringing', 'other']
export const INCOME_CATS: WorldEventCategory[] = ['income', 'sponsor']

export interface SeedResult {
  seed: string
  /** per-category magnitudes in cents (expenses positive, income positive) */
  cats: Record<WorldEventCategory, number>
  /** sum of every expense category (a positive number) */
  grossExpenseCents: number
  /** sum of every income category (parent contribution + sponsor) */
  totalIncomeCents: number
  /** totalIncome - grossExpense (== end funds - start funds) */
  netCents: number
  endFundsCents: number
  /** first week fundsCents < 0, or null if the kid never went into the red */
  weeksToBankrupt: number | null
  /** lowest fundsCents reached across the run (a "peak deficit" when negative) */
  peakDeficitCents: number
}

function zeroCats(): Record<WorldEventCategory, number> {
  return { coaching: 0, travel: 0, entry: 0, gear: 0, stringing: 0, sponsor: 0, income: 0, other: 0 }
}

/**
 * Run ONE 52-week season headless for a preset+index. Deterministic: createWorld and
 * rngFromSeed(seed) are the only entropy sources, so the same (preset, index) reproduces
 * exactly. Mirrors the `busyTournamentSeason` helper in tests/finance.test.ts but with the
 * documented entry policy v1 (every affordable tier, not just local).
 */
export function runSeason(preset: Preset, index: number): SeedResult {
  const seed = `bench-${preset.background}-${index}`
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: preset.background,
    coachSetup: preset.coachSetup,
  }
  const world = createWorld(seed, profile)
  const rng = rngFromSeed(world.seed)

  let peak = world.fundsCents
  let bankruptWeek: number | null = world.fundsCents < 0 ? 0 : null

  for (let i = 0; i < SEASON_WEEKS; i++) {
    // Entry policy v1: enter EVERY eligible event (any tier) affordable by entry+travel NOW.
    for (const e of world.season) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek) continue // deadline passed – enterEvent would throw
      const cost = TIERS[e.tier].entryFeeCents + e.travelCostCents
      if (world.fundsCents < cost) continue // can't afford entry+travel – policy stalls here
      enterEvent(world, e.id)
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (world.fundsCents < peak) peak = world.fundsCents
    if (bankruptWeek === null && world.fundsCents < 0) bankruptWeek = world.week
  }

  // Read the whole season block off the persisted aggregate (survives the 60-event cap).
  const win = financeWindow(world.financeWeeks, 0)
  const cats = zeroCats()
  for (const cat of EXPENSE_CATS) cats[cat] = -(win.byCategory[cat] ?? 0) // negatives -> positive magnitude
  for (const cat of INCOME_CATS) cats[cat] = win.byCategory[cat] ?? 0

  return {
    seed,
    cats,
    grossExpenseCents: win.expenseCents,
    totalIncomeCents: win.incomeCents,
    netCents: win.netCents,
    endFundsCents: world.fundsCents,
    weeksToBankrupt: bankruptWeek,
    peakDeficitCents: peak,
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

function renderPreset(preset: Preset, rows: SeedResult[]): string {
  const startFunds = STARTING_FUNDS_CENTS[preset.background]
  const out: string[] = []
  out.push('')
  out.push(RULE)
  const coachRange = preset.coachSetup === 'parent' ? 'self-coached $120-400/wk base' : 'hired coach $250-700/wk base'
  out.push(
    `  PRESET ${preset.label}   (start $${(startFunds / 100).toLocaleString('en-US')}, ${coachRange}, plan balanced 75/25)`,
  )
  out.push(RULE)
  out.push(header())

  out.push('  -- expense by category (season spend) --')
  for (const cat of EXPENSE_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('GROSS EXPENSE', rows.map((r) => r.grossExpenseCents)))

  out.push('  -- income --')
  for (const cat of INCOME_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('TOTAL INCOME', rows.map((r) => r.totalIncomeCents)))

  out.push('  -- bottom line --')
  out.push(statRow('NET (season)', rows.map((r) => r.netCents)))
  out.push(statRow('end funds', rows.map((r) => r.endFundsCents)))
  out.push(statRow('peak deficit', rows.map((r) => r.peakDeficitCents)))

  // Bankruptcy summary: how many of the 30 seeds ever went red, and the median week they did.
  const bankrupt = rows.filter((r) => r.weeksToBankrupt !== null)
  const bankruptWeeks = bankrupt.map((r) => r.weeksToBankrupt as number)
  const medWeek = bankrupt.length ? median(bankruptWeeks).toString() : '–'
  out.push(
    '  ' +
      padEnd('bankrupt', LABEL_W) +
      `${bankrupt.length} / ${rows.length} seeds went red` +
      (bankrupt.length ? `  (median week ${medWeek}, earliest week ${Math.min(...bankruptWeeks)})` : ''),
  )
  return out.join('\n')
}

const POLICY_HEADER = [
  'Ties Break – economy bench (measurement only; changes no engine numbers)',
  `Entry policy v1: each week, enter EVERY eligible event (any tier) the kid can afford`,
  `  entry+travel for at that moment; then tick; then skip+close any spawned tournament.`,
  `  Once funds go red the affordability gate stalls entries; weekly coaching still bleeds.`,
  `${SEEDS_PER_PRESET} seeds/preset · ${SEASON_WEEKS}-week season · coach setup per preset (see each block) · plan balanced (75/25).`,
  `Money is whole-dollar rounded; ±sd is the population stddev across the ${SEEDS_PER_PRESET} seeds.`,
].join('\n')

// --- CSV ---------------------------------------------------------------------

function toCsv(all: { preset: Preset; rows: SeedResult[] }[]): string {
  const cols = [
    'preset',
    'background',
    'seed',
    ...EXPENSE_CATS.map((c) => `${c}_cents`),
    ...INCOME_CATS.map((c) => `${c}_cents`),
    'gross_expense_cents',
    'total_income_cents',
    'net_cents',
    'end_funds_cents',
    'weeks_to_bankrupt',
    'peak_deficit_cents',
  ]
  const lines = [cols.join(',')]
  for (const { preset, rows } of all) {
    for (const r of rows) {
      const cells = [
        preset.label.trim(),
        preset.background,
        r.seed,
        ...EXPENSE_CATS.map((c) => r.cats[c].toString()),
        ...INCOME_CATS.map((c) => r.cats[c].toString()),
        r.grossExpenseCents.toString(),
        r.totalIncomeCents.toString(),
        r.netCents.toString(),
        r.endFundsCents.toString(),
        r.weeksToBankrupt === null ? '' : r.weeksToBankrupt.toString(),
        r.peakDeficitCents.toString(),
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

  const all: { preset: Preset; rows: SeedResult[] }[] = []
  for (const preset of PRESETS) {
    const rows: SeedResult[] = []
    for (let i = 0; i < SEEDS_PER_PRESET; i++) rows.push(runSeason(preset, i))
    all.push({ preset, rows })
    console.log(renderPreset(preset, rows))
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
// imports the exports above without ever triggering the 90-season run.
if (!process.env.VITEST) {
  main()
}
