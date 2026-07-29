/**
 * Points-curve bench – the measurement wave B slice 1 ("a first-round loss pays ZERO") needs and
 * that neither shipped bench prints.
 *
 * MEASUREMENT ONLY. Imports the engine, changes nothing. It exists because `bench:econ` reports
 * money + entries and `bench:fatigue` reports the body + a single `endPoints` mean, while the
 * question a points retune has to answer is:
 *
 *   1. THE POINTS CURVE – mean and spread of SEASON points, per profile and per policy.
 *   2. BAND CLEARANCE – how long it takes to clear each tier's `enterPointBand` floor. This is the
 *      number most likely to break when points are removed: if she can no longer reach 180, the J
 *      ladder never opens and the whole climb stalls. Reported as "how many careers ever get there"
 *      and "median week of first arrival", per gate.
 *   3. TIER MIX of entries per season – whether the J30/J60 grind actually falls.
 *   4. Season W-L, survival, and the rank bands the career-outcome targets are written against.
 *
 * Axes are borrowed WHOLESALE from the fatigue bench (same PROFILES, same POLICIES, same
 * openFatigueCareer/stepFatigueWeek stepping, same seed strings `fatigue-<background>-<i>`), so a
 * cell here is the same career as the matching cell of `npm run bench:fatigue` – the two are
 * directly comparable and "same seeds before and after" is structural rather than a promise.
 *
 * Run:  npx vite-node tools/points-curve.ts
 *       npx vite-node tools/points-curve.ts -- --csv /path/to/rows.csv
 */

// MUST come before the dynamic import below. fatigue-bench.ts self-runs its whole `main()` on
// import outside vitest (`if (!process.env.VITEST && !process.env.TB_BENCH_NO_AUTORUN)`), which is
// exactly right for `npm run bench:fatigue` and exactly wrong for reusing its axes here – a static
// import would run the entire fatigue sweep before this file did anything. Static ESM imports are
// hoisted above ordinary statements, so borrowing the module has to be a DYNAMIC import placed
// after this assignment. Type-only imports stay static: they are erased and execute nothing.
process.env.TB_BENCH_NO_AUTORUN = '1'

import { writeFileSync } from 'node:fs'
import { kidPoints } from '../src/engine/world'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { Profile, Policy } from './fatigue-bench'

const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek, zeroByTier, mean, stddev } =
  await import('./fatigue-bench')

/** 4 seasons – the full 14→18 career the outcome targets are written against. */
export const HORIZON_WEEKS = 208
export const SEEDS_PER_CELL = 30
export const SEASONS = HORIZON_WEEKS / WEEKS_PER_YEAR
/** The wrap week inside a season year (49) – where lastSeasonSummary is fresh. */
export const SEASON_WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** A gate on the climb: a point total that unlocks (or closes) a rung. Derived from the live
 *  `enterPointBand`s, never hand-written, so a future retable re-aims this bench automatically. */
export interface Gate {
  label: string
  points: number
}

/** Every distinct positive band edge in the catalogue, ascending: the rung floors plus local's
 *  graduation ceiling (the one edge that means "you have outgrown this", not "you may enter"). */
export function gates(): Gate[] {
  const out: Gate[] = []
  for (const t of TIER_LADDER) {
    const [min, max] = TIERS[t].enterPointBand
    if (min > 0) out.push({ label: `${t} opens`, points: min })
    if (max < Number.MAX_SAFE_INTEGER) out.push({ label: `${t} outgrown`, points: max })
  }
  const seen = new Set<number>()
  return out
    .sort((a, b) => a.points - b.points)
    .filter((g) => (seen.has(g.points) ? false : (seen.add(g.points), true)))
}

export interface PointsRun {
  seed: string
  /** ranking points (windowed best-6) at each season wrap – the curve itself. */
  pointsAtWrap: number[]
  /** points EARNED in each season, off lastSeasonSummary. */
  seasonPoints: number[]
  seasonWins: number[]
  seasonLosses: number[]
  /** first week kidPoints >= gate, per gate index; null = never reached inside the horizon. */
  gateWeeks: (number | null)[]
  entriesByTier: Record<TierId, number>
  entriesTotal: number
  wins: number
  losses: number
  survived: boolean
  endPoints: number
  endRank: number
  /** best (lowest) dense rank reached while actually ranked – the econ/fatigue hasResults guard. */
  bestRank: number | null
}

export function runPointsCareer(profile: Profile, policy: Policy, index: number): PointsRun {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)
  const g = gates()
  const gateWeeks: (number | null)[] = g.map(() => null)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const entriesByTier = zeroByTier()
  const pointsAtWrap: number[] = []
  const seasonPoints: number[] = []
  const seasonWins: number[] = []
  const seasonLosses: number[] = []
  let wins = 0
  let losses = 0
  let bankrupt = false
  let bestRank: number | null = null

  for (let i = 0; i < HORIZON_WEEKS; i++) {
    const f = stepFatigueWeek(world, rng, policy, plannerState)
    for (const t of f.entryTiers) entriesByTier[t]++
    wins += f.wins
    losses += f.losses
    if (f.fundsCents < 0) bankrupt = true

    const pts = kidPoints(world, 'itf')
    if (pts > 0 && (bestRank === null || world.kidRank < bestRank)) bestRank = world.kidRank
    for (let k = 0; k < g.length; k++) {
      if (gateWeeks[k] === null && pts >= g[k].points) gateWeeks[k] = f.week
    }

    if (world.week % WEEKS_PER_YEAR === SEASON_WRAP_OFFSET) {
      pointsAtWrap.push(pts)
      const s = world.lastSeasonSummary
      seasonPoints.push(s?.points ?? 0)
      seasonWins.push(s?.wins ?? 0)
      seasonLosses.push(s?.losses ?? 0)
    }
  }

  return {
    seed,
    pointsAtWrap,
    seasonPoints,
    seasonWins,
    seasonLosses,
    gateWeeks,
    entriesByTier,
    entriesTotal: TIER_LADDER.reduce((s, t) => s + entriesByTier[t], 0),
    wins,
    losses,
    survived: !bankrupt,
    endPoints: kidPoints(world, 'itf'),
    endRank: world.kidRank,
    bestRank,
  }
}

// --- stats --------------------------------------------------------------------

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export interface CellPoints {
  profile: Profile
  policy: Policy
  runs: PointsRun[]
}

// --- rendering ----------------------------------------------------------------

function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s
}
function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

const PROF_W = 30
const POL_W = 12

/** Pooled per-season points across every seed and season of a cell. */
function allSeasonPoints(runs: PointsRun[]): number[] {
  return runs.flatMap((r) => r.seasonPoints)
}

function pointsTable(cells: CellPoints[]): string {
  const out: string[] = []
  out.push('')
  out.push('THE POINTS CURVE – ranking points, 208w / 4 seasons, 30 seeds per cell')
  out.push(
    '  ' +
      padEnd('profile', PROF_W) +
      padEnd('policy', POL_W) +
      ['seasonPts', '±sd', 'min', 'max', 'S1', 'S2', 'S3', 'S4', 'endBest6'].map((c) => pad(c, 10)).join(''),
  )
  for (const c of cells) {
    const sp = allSeasonPoints(c.runs)
    const perSeason = Array.from({ length: SEASONS }, (_, s) =>
      mean(c.runs.filter((r) => r.seasonPoints[s] !== undefined).map((r) => r.seasonPoints[s])),
    )
    const cells2 = [
      mean(sp).toFixed(0),
      '±' + stddev(sp).toFixed(0),
      Math.min(...sp).toFixed(0),
      Math.max(...sp).toFixed(0),
      ...perSeason.map((x) => x.toFixed(0)),
      mean(c.runs.map((r) => r.endPoints)).toFixed(0),
    ]
    out.push('  ' + padEnd(c.profile.label, PROF_W) + padEnd(c.policy.id, POL_W) + cells2.map((x) => pad(x, 10)).join(''))
  }
  return out.join('\n')
}

function gateTable(cells: CellPoints[]): string {
  const g = gates()
  const out: string[] = []
  out.push('')
  out.push('BAND CLEARANCE – "n/30 careers that ever clear it · median week of first arrival"')
  out.push('  (a gate never cleared by anyone is the ladder stalling – that is the loud failure mode)')
  out.push('  ' + padEnd('profile', PROF_W) + padEnd('policy', POL_W) + g.map((x) => pad(`${x.label} ${x.points}`, 23)).join(''))
  for (const c of cells) {
    const cellsOut = g.map((_, k) => {
      const hit = c.runs.map((r) => r.gateWeeks[k]).filter((w): w is number => w !== null)
      return pad(`${hit.length}/${c.runs.length} ${hit.length ? '· w' + median(hit) : '· –'}`, 23)
    })
    out.push('  ' + padEnd(c.profile.label, PROF_W) + padEnd(c.policy.id, POL_W) + cellsOut.join(''))
  }
  return out.join('\n')
}

function tierMixTable(cells: CellPoints[]): string {
  const out: string[] = []
  out.push('')
  out.push('TIER MIX – entries per season (mean over 30 seeds x 4 seasons)')
  out.push(
    '  ' +
      padEnd('profile', PROF_W) +
      padEnd('policy', POL_W) +
      [...TIER_LADDER, 'TOTAL', 'J-share'].map((c) => pad(c, 9)).join(''),
  )
  for (const c of cells) {
    const per = (t: TierId) => mean(c.runs.map((r) => r.entriesByTier[t])) / SEASONS
    const total = mean(c.runs.map((r) => r.entriesTotal)) / SEASONS
    const jShare = total === 0 ? 0 : (per('j30') + per('j60') + per('j300')) / total
    const cellsOut = [
      ...TIER_LADDER.map((t) => per(t).toFixed(1)),
      total.toFixed(1),
      (jShare * 100).toFixed(0) + '%',
    ]
    out.push('  ' + padEnd(c.profile.label, PROF_W) + padEnd(c.policy.id, POL_W) + cellsOut.map((x) => pad(x, 9)).join(''))
  }
  return out.join('\n')
}

function outcomeTable(cells: CellPoints[]): string {
  const out: string[] = []
  out.push('')
  out.push('SEASON W-L, SURVIVAL AND RANK BANDS')
  out.push('  survived = never went below zero funds across 208w ("family solvent", of ALL starts).')
  out.push('  The rank bands are the kid\'s BEST dense rank in a 200-strong field (199 cohort + kid).')
  out.push(
    '  ' +
      padEnd('profile', PROF_W) +
      padEnd('policy', POL_W) +
      ['W/season', 'L/season', 'win%', 'survived', 'bestRk', 'top-3', 'top-10', 'top-20'].map((c) => pad(c, 10)).join(''),
  )
  for (const c of cells) {
    const w = mean(c.runs.map((r) => r.wins)) / SEASONS
    const l = mean(c.runs.map((r) => r.losses)) / SEASONS
    const tw = c.runs.reduce((s, r) => s + r.wins, 0)
    const tl = c.runs.reduce((s, r) => s + r.losses, 0)
    const ranked = c.runs.filter((r) => r.bestRank !== null)
    const band = (n: number) => c.runs.filter((r) => r.bestRank !== null && r.bestRank <= n).length
    const cellsOut = [
      w.toFixed(1),
      l.toFixed(1),
      tw + tl === 0 ? '–' : ((tw / (tw + tl)) * 100).toFixed(1),
      `${c.runs.filter((r) => r.survived).length}/${c.runs.length}`,
      ranked.length ? '#' + Math.round(mean(ranked.map((r) => r.bestRank as number))) : '–',
      `${band(3)}/${c.runs.length}`,
      `${band(10)}/${c.runs.length}`,
      `${band(20)}/${c.runs.length}`,
    ]
    out.push('  ' + padEnd(c.profile.label, PROF_W) + padEnd(c.policy.id, POL_W) + cellsOut.map((x) => pad(x, 10)).join(''))
  }
  return out.join('\n')
}

// --- CSV ----------------------------------------------------------------------

function toCsv(cells: CellPoints[]): string {
  const g = gates()
  const cols = [
    'profile',
    'background',
    'policy',
    'seed',
    ...Array.from({ length: SEASONS }, (_, s) => `season${s + 1}_points`),
    ...Array.from({ length: SEASONS }, (_, s) => `season${s + 1}_wrap_best6`),
    ...g.map((x) => `gate_${x.points}_week`),
    ...TIER_LADDER.map((t) => `entries_${t}`),
    'entries_total',
    'wins',
    'losses',
    'survived',
    'end_points',
    'end_rank',
    'best_rank',
  ]
  const lines = [cols.join(',')]
  for (const c of cells) {
    for (const r of c.runs) {
      lines.push(
        [
          c.profile.label.trim(),
          c.profile.background,
          c.policy.id,
          r.seed,
          ...Array.from({ length: SEASONS }, (_, s) => r.seasonPoints[s] ?? ''),
          ...Array.from({ length: SEASONS }, (_, s) => r.pointsAtWrap[s] ?? ''),
          ...r.gateWeeks.map((w) => (w === null ? '' : w)),
          ...TIER_LADDER.map((t) => r.entriesByTier[t]),
          r.entriesTotal,
          r.wins,
          r.losses,
          r.survived ? '1' : '0',
          r.endPoints,
          r.endRank,
          r.bestRank ?? '',
        ].join(','),
      )
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ----------------------------------------------------------------------

export function main(argv: string[] = process.argv.slice(2)): void {
  const i = argv.indexOf('--csv')
  const csvPath = i === -1 ? null : argv[i + 1]

  console.log('Ties Break – points-curve bench (measurement only; changes no engine numbers)')
  console.log('')
  console.log(`Axes borrowed from bench:fatigue: ${PROFILES.length} profiles x ${POLICIES.length} policies x ${SEEDS_PER_CELL} seeds,`)
  console.log(`  horizon ${HORIZON_WEEKS}w (${SEASONS} seasons), seeds \`fatigue-<background>-<i>\` – the SAME careers that bench runs.`)
  console.log('Live points table under measurement:')
  for (const t of TIER_LADDER) {
    console.log(`  ${padEnd(t, 10)} [${TIERS[t].points.join(', ')}]   band [${TIERS[t].enterPointBand[0]}, ${TIERS[t].enterPointBand[1] === Number.MAX_SAFE_INTEGER ? 'MAX' : TIERS[t].enterPointBand[1]}]`)
  }

  const cells: CellPoints[] = []
  for (const profile of PROFILES) {
    for (const policy of POLICIES) {
      const runs: PointsRun[] = []
      for (let s = 0; s < SEEDS_PER_CELL; s++) runs.push(runPointsCareer(profile, policy, s))
      cells.push({ profile, policy, runs })
    }
  }

  console.log(pointsTable(cells))
  console.log(gateTable(cells))
  console.log(tierMixTable(cells))
  console.log(outcomeTable(cells))
  console.log('')

  if (csvPath) {
    writeFileSync(csvPath, toCsv(cells))
    console.log(`Per-seed rows written to ${csvPath}`)
  }
}

if (!process.env.VITEST) {
  main()
}
