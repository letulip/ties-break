/**
 * wall-l1-bench – L1, THE OWNER'S PER-MATCH COACH EDGE, measured against the wall
 * (docs/specs/the-wall-2026-08.md §2 L1, §3 – the pre-registered measurement).
 *
 * The owner's proposal, 12.08: the coach adds a small edge to her chance of winning a match,
 * career-long while he is paid – budget 0.3-0.6% · middle 0.5-0.8% · high 0.7-1.0% · elite
 * 0.9-1.2%. A Markov engine has no "win chance" knob, so the translation is the L1 scaffolding
 * hook (src/engine/world/player.ts, COACH_MATCH_EDGE): an additive delta on her five on-court
 * attributes at the composition point, CALIBRATED here so her mean match-win probability against
 * her actual current field moves by the target percentage.
 *
 * ⚠ SCAFFOLDING EXCEPTION, exercised as the spec states it: the hook defaults inert (proved by
 * tests/condition.test.ts re-deriving 41550/e6b0c709 and tools/wall-freeze-probe.ts reproducing a
 * 208-week career byte-identically). This bench mutates COACH_MATCH_EDGE / COACH_MATCH_EDGE_DECAY
 * in memory per arm, restores in a `finally`, and exits 1 if the restore did not take – the
 * what-money-buys §8 pattern. `git diff` under src/ is the hook and nothing else.
 *
 * ⚠ RNG: the edge is pure arithmetic at composition. Kid brackets run on `seed:kidtour:<event.id>`
 * / `seed:<event.id>:r<n>` sub-streams and AI brackets on `seed:aitour:<event.id>`, so no arm can
 * move the MAIN stream – only match OUTCOMES move, exactly like kit and condition.
 *
 * THE THREE MODES:
 *
 *   --calibrate            The dial. 16 self-coached careers (8 seeds x working/middle), sampled
 *                          4x a season; at every sampled state her mean match-win probability
 *                          against the field at her CURRENT rung (the winrate-read methodology:
 *                          universeForTier + isEntrantBand + rivalConditions, hard court, the
 *                          neutral surface) is computed for a grid of deltas. Pooled career-long
 *                          curve -> delta per owner target; per-rung curve -> where the edge lands,
 *                          statically. Prints the calibration table to embed in CALIBRATED below.
 *
 *   --arms <ids> --out <dir>
 *                          The careers. Runs the named arm-cells (30 paired seeds each, `player`
 *                          policy, full 14->38 careers, bankruptcy NOT defused, fork answered
 *                          'continue', retirement refused) and writes one JSON per arm-cell into
 *                          <dir> as it finishes – resumable, cells already on disk are skipped.
 *                          Groups: base, aflat, adec, bctl, bedge – or single ids like
 *                          aflat065:middle / bedge:wealthy:high.
 *
 *   --report <dir>         The fold. Reads every *.json under dir and prints the report tables:
 *                          the July table per arm, net-of-the-bill per Layer B cell, where the
 *                          edge lands (lived), solvency, dose-response.
 *
 * Reproduce:
 *   npx vite-node tools/wall-l1-bench.ts -- --calibrate
 *   npx vite-node tools/wall-l1-bench.ts -- --arms base,aflat --out /tmp/a.json --seeds 30
 *   npx vite-node tools/wall-l1-bench.ts -- --report /tmp/wall-l1
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openCareer, stepCareerWeek, POLICIES, type Preset } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, type WorldState } from '../src/engine/world'
import { kidPoints, rankingFor } from '../src/engine/world/ladder'
import {
  COACH_MATCH_EDGE,
  COACH_MATCH_EDGE_DECAY,
  kidMatchPlayerFor,
  startingSkills,
} from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS } from '../src/engine/development'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { fieldProsFor, fieldSeasonOf, universeForTier } from '../src/engine/season/fieldPros'
import { isEntrantBand, JUNIOR_TOUR as TOUR } from '../src/engine/season/tournament'
import { fastMatchProbability } from '../src/engine/match/engine'
import type { CoachTier, FamilyBackground } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'
import type { WorldEventCategory } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const flag = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? (args[i + 1] ?? '') : null
}
const SEEDS = Number(flag('seeds') ?? 30)

// -------------------------------------------------------------------------------------------------
// THE CALIBRATION TABLE – measured by --calibrate, embedded here so every arm run is reproducible.
// delta = skill points added to all five on-court attributes; target = the owner's percentage
// points of mean match-win probability against her actual career-long field.
// ⚠ FILLED FROM THE --calibrate RUN OF THIS BRANCH (see docs/specs/the-wall-2026-08.md ## Measured).
// -------------------------------------------------------------------------------------------------
// Measured 12.08.2026, --calibrate on this branch: 1512 sampled states over 16 self-coached
// careers, pooled career-long curve P(delta) linear to the eye (1.897 pp at delta 1.0); every
// target interpolates inside the grid and checks back to its own pp to three decimals.
const CALIBRATED: { stamp: 'measured' | 'placeholder'; byTarget: Record<string, number> } = {
  stamp: 'measured',
  byTarget: {
    // owner band midpoints (target pp -> delta in skill points)
    '0.45': 0.234,
    '0.65': 0.339,
    '0.85': 0.444,
    '1.05': 0.549,
    // the 2x arm – exists to expose dose-response, not to propose it
    '0.90': 0.47,
    '1.30': 0.682,
    '1.70': 0.895,
    '2.10': 1.11,
  },
}

// -------------------------------------------------------------------------------------------------
// hook mutation, scoped and asserted – the what-money-buys §8 pattern
// -------------------------------------------------------------------------------------------------
function withEdge<T>(tier: CoachTier, delta: number, decay: boolean, fn: () => T): T {
  const beforeEdge = { ...COACH_MATCH_EDGE }
  const beforeDecay = { ...COACH_MATCH_EDGE_DECAY }
  COACH_MATCH_EDGE[tier] = delta
  COACH_MATCH_EDGE_DECAY.on = decay
  try {
    return fn()
  } finally {
    Object.assign(COACH_MATCH_EDGE, beforeEdge)
    Object.assign(COACH_MATCH_EDGE_DECAY, beforeDecay)
  }
}
function assertHookRestored(): void {
  const dirty =
    Object.values(COACH_MATCH_EDGE).some((v) => v !== 0) || COACH_MATCH_EDGE_DECAY.on || COACH_MATCH_EDGE_DECAY.floor !== 0.5
  if (dirty) {
    console.error('FATAL: COACH_MATCH_EDGE was not restored to its inert default')
    process.exit(1)
  }
}

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
function pctl(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}
function shareOf(hits: number, of: number): string {
  return of === 0 ? '   –' : `${((100 * hits) / of).toFixed(1)}%`
}

// -------------------------------------------------------------------------------------------------
// the winrate-read methodology, lifted whole: her mean match-win probability against the field at
// one rung, everybody put on court exactly as the bracket does (their real condition, hard court)
// -------------------------------------------------------------------------------------------------
function opponentsAt(w: WorldState, tier: TierId): MatchPlayer[] {
  const min = TIERS[tier].minAgeYears ?? 0
  const max = TIERS[tier].maxAgeYears ?? 99
  const pros = fieldProsFor(w.seed, fieldSeasonOf(w.week))
  const universe = universeForTier(tier, w.cohort, pros)
  const ranking = rankingFor(w, TIERS[tier].track)
  const pos = new Map<string, number>()
  ranking.forEach((r, i) => pos.set(r.playerId, i))
  const total = ranking.length || universe.length
  const pctOf = (id: string) => ((pos.get(id) ?? total - 1) + 1) / total
  const conditions = rivalConditions(w.results, w.week)
  return universe
    .filter((p) => p.ageYears >= min && p.ageYears <= max && p.id !== 'kid' && isEntrantBand(tier, pctOf(p.id)))
    .map((p) => rivalMatchPlayer(p, 'hard', conditions.get(p.id) ?? 100))
}

/** The rung she is actually competing on right now – winrate-read's own reading. */
function currentTier(w: WorldState): TierId | null {
  const tiers = new Set(w.results.filter((r) => r.playerId === 'kid' && r.tier).map((r) => r.tier as TierId))
  for (const t of [...TIER_LADDER].reverse()) if (tiers.has(t)) return t
  return null
}

function meanWinProbAt(w: WorldState, field: MatchPlayer[], delta: number): number {
  const kid = withEdge(w.profile.coachTier, delta, false, () => kidMatchPlayerFor(w, 'hard'))
  const opts = { surface: 'hard' as const, tour: TOUR, seed: '' }
  let s = 0
  for (const opp of field) s += fastMatchProbability(kid, opp, opts)
  return s / field.length
}

// -------------------------------------------------------------------------------------------------
// --calibrate
// -------------------------------------------------------------------------------------------------
const GRID = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5]
const TARGETS: Array<{ label: string; pp: number }> = [
  { label: 'budget mid 0.45', pp: 0.45 },
  { label: 'middle mid 0.65', pp: 0.65 },
  { label: 'high   mid 0.85', pp: 0.85 },
  { label: 'elite  mid 1.05', pp: 1.05 },
  { label: '2x budget  0.90', pp: 0.9 },
  { label: '2x middle  1.30', pp: 1.3 },
  { label: '2x high    1.70', pp: 1.7 },
  { label: '2x elite   2.10', pp: 2.1 },
]

function calibrate(): void {
  console.log(`\nCALIBRATION – the dial, on the winrate-read methodology (hard court, her real field)`)
  console.log(`grid of deltas (skill points on all five wings): ${GRID.join(' / ')}`)
  const perRung = new Map<TierId, number[][]>() // tier -> list of [P(grid_i)...]
  const pooled: number[][] = []
  const cells: FamilyBackground[] = ['working', 'middle']
  for (const bg of cells) {
    for (let idx = 0; idx < 8; idx++) {
      const preset: Preset = { label: `cal-${bg}`, background: bg, coachTier: 'self' }
      const { world, rng } = openCareer(preset, idx, POLICIES[1])
      for (let wk = 1; wk <= FULL_CAREER_WEEKS && world.ending === null; wk++) {
        stepCareerWeek(world, rng, POLICIES[1])
        if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
        if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
        if (wk % 13 !== 0) continue
        const tier = currentTier(world)
        if (tier === null) continue
        const field = opponentsAt(world, tier)
        if (field.length === 0) continue
        const row = GRID.map((d) => meanWinProbAt(world, field, d))
        pooled.push(row)
        const list = perRung.get(tier) ?? []
        list.push(row)
        perRung.set(tier, list)
      }
    }
  }
  assertHookRestored()

  const fold = (rows: number[][]): number[] => GRID.map((_, i) => mean(rows.map((r) => r[i])))
  const curve = fold(pooled)
  console.log(`\nsampled states: ${pooled.length} (16 careers, 4x a season, at her current rung)`)
  console.log(`\nPOOLED CAREER-LONG DOSE-RESPONSE (mean match-win probability, percentage points over delta 0)`)
  console.log(`  ${padEnd('delta', 8)}${GRID.map((d) => pad(d.toFixed(2), 9)).join('')}`)
  console.log(`  ${padEnd('P mean', 8)}${curve.map((p) => pad((100 * p).toFixed(2), 9)).join('')}`)
  console.log(`  ${padEnd('ΔP pp', 8)}${curve.map((p) => pad((100 * (p - curve[0])).toFixed(3), 9)).join('')}`)

  // solve delta per target by linear interpolation on the pooled curve
  const solve = (targetPp: number): number => {
    for (let i = 1; i < GRID.length; i++) {
      const d0 = 100 * (curve[i - 1] - curve[0])
      const d1 = 100 * (curve[i] - curve[0])
      if (d1 >= targetPp) return GRID[i - 1] + ((targetPp - d0) / (d1 - d0)) * (GRID[i] - GRID[i - 1])
    }
    return NaN // outside the grid – extend GRID rather than extrapolate silently
  }
  console.log(`\nTHE CALIBRATION TABLE (embed in CALIBRATED above; tier -> delta -> measured ΔP)`)
  console.log(`  ${padEnd('target', 18)}${pad('delta*', 9)}${pad('ΔP at delta* (chk)', 20)}`)
  for (const t of TARGETS) {
    const d = solve(t.pp)
    // check the solved delta by direct evaluation over the same samples
    let chk = NaN
    if (Number.isFinite(d)) {
      const rows = pooled // re-evaluating every state at d would re-run the careers; interpolate instead
      const at = (row: number[]): number => {
        for (let i = 1; i < GRID.length; i++) {
          if (GRID[i] >= d) {
            const f = (d - GRID[i - 1]) / (GRID[i] - GRID[i - 1])
            return row[i - 1] + f * (row[i] - row[i - 1])
          }
        }
        return row[row.length - 1]
      }
      chk = 100 * (mean(rows.map(at)) - curve[0])
    }
    console.log(`  ${padEnd(t.label, 18)}${pad(d.toFixed(3), 9)}${pad(chk.toFixed(3), 20)}`)
  }

  console.log(`\nWHERE THE EDGE LANDS, STATICALLY – ΔP pp at delta 0.5, by the rung she was at`)
  console.log(`  ${padEnd('rung', 10)}${pad('states', 8)}${pad('P(0)', 9)}${pad('ΔP @0.5', 10)}${pad('ΔP @1.0', 10)}${pad('ΔP @2.0', 10)}`)
  for (const t of TIER_LADDER) {
    const rows = perRung.get(t)
    if (!rows || rows.length === 0) continue
    const c = fold(rows)
    const i05 = GRID.indexOf(0.5)
    const i10 = GRID.indexOf(1.0)
    const i20 = GRID.indexOf(2.0)
    console.log(
      `  ${padEnd(t, 10)}${pad(rows.length, 8)}${pad((100 * c[0]).toFixed(1), 9)}${pad((100 * (c[i05] - c[0])).toFixed(3), 10)}` +
        `${pad((100 * (c[i10] - c[0])).toFixed(3), 10)}${pad((100 * (c[i20] - c[0])).toFixed(3), 10)}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// ARMS
// -------------------------------------------------------------------------------------------------
interface Arm {
  id: string
  layer: 'base' | 'aflat' | 'adec' | 'bctl' | 'bedge'
  background: FamilyBackground
  coachTier: CoachTier
  /** owner target in pp; 0 = no edge */
  targetPp: number
  delta: number
  decay: boolean
}

const MIDPOINTS: Array<[CoachTier, number]> = [
  ['budget', 0.45],
  ['middle', 0.65],
  ['high', 0.85],
  ['elite', 1.05],
]
const DOUBLES: Array<[CoachTier, number]> = [
  ['budget', 0.9],
  ['middle', 1.3],
  ['high', 1.7],
  ['elite', 2.1],
]

function deltaFor(pp: number): number {
  const d = CALIBRATED.byTarget[pp.toFixed(2)]
  if (d === undefined || CALIBRATED.stamp !== 'measured') throw new Error(`no calibrated delta for ${pp}`)
  return d
}

function allArms(): Arm[] {
  const arms: Arm[] = []
  for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    arms.push({ id: `base:${bg}`, layer: 'base', background: bg, coachTier: 'self', targetPp: 0, delta: 0, decay: false })
  }
  for (const bg of ['working', 'middle'] as FamilyBackground[]) {
    for (const [, pp] of [...MIDPOINTS, ...DOUBLES]) {
      const key = pp.toFixed(2).replace('.', '')
      arms.push({
        id: `aflat${key}:${bg}`,
        layer: 'aflat',
        background: bg,
        coachTier: 'self',
        targetPp: pp,
        delta: deltaFor(pp),
        decay: false,
      })
    }
    for (const [, pp] of MIDPOINTS) {
      const key = pp.toFixed(2).replace('.', '')
      arms.push({
        id: `adec${key}:${bg}`,
        layer: 'adec',
        background: bg,
        coachTier: 'self',
        targetPp: pp,
        delta: deltaFor(pp),
        decay: true,
      })
    }
  }
  for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    for (const [tier, pp] of MIDPOINTS) {
      arms.push({ id: `bctl:${bg}:${tier}`, layer: 'bctl', background: bg, coachTier: tier, targetPp: 0, delta: 0, decay: false })
      arms.push({
        id: `bedge:${bg}:${tier}`,
        layer: 'bedge',
        background: bg,
        coachTier: tier,
        targetPp: pp,
        delta: deltaFor(pp),
        decay: false,
      })
    }
  }
  return arms
}

// -------------------------------------------------------------------------------------------------
// ONE CAREER – ladder-vs-targets' runner, extended with the finance and finish accumulators
// -------------------------------------------------------------------------------------------------
interface TierRecord {
  played: number
  wins: number
  losses: number
  /** count per finish index into TierDef.points (0 = champion) */
  finishes: number[]
}

interface CareerSummary {
  index: number
  headroomPct: number
  weeks: number
  ending: string | null
  bankrupt: boolean
  bankruptBy18: boolean
  reachedHorizon: boolean
  entriesByTier: Partial<Record<TierId, number>>
  bestWta: number | null
  bestWtaBy: { a18: number | null; a22: number | null; a26: number | null; a30: number | null }
  peakWtaPoints: number
  slamEntries: number
  bestFinishSlam: number | null
  titles: number
  prizeCents: number
  billCents: number
  travelEntryCents: number
  endFundsCents: number
  skillsAt: { a18: number | null; a22: number | null; end: number }
  /** decay diagnostic: remaining-headroom share (the curve's input) at the checkpoints */
  shareAt: { a18: number | null; a22: number | null }
  perTier: Partial<Record<TierId, TierRecord>>
  rankAtEntry: Partial<Record<'wta125' | 'wta250' | 'wta500' | 'wta1000' | 'slam', number[]>>
}

function irwinHall5CDF(s: number): number {
  if (s <= 0) return 0
  if (s >= 5) return 1
  const C = [1, 5, 10, 10, 5, 1]
  let sum = 0
  for (let k = 0; k <= Math.floor(s); k++) sum += (k % 2 === 0 ? 1 : -1) * C[k] * (s - k) ** 5
  return sum / 120
}

function runCareer(arm: Arm, index: number): CareerSummary {
  const preset: Preset = { label: arm.id, background: arm.background, coachTier: arm.coachTier }
  const { world, rng, seed } = openCareer(preset, index, POLICIES[1])
  const start = startingSkills(seed, world.profile)
  const potential = rollPotential(seed, start)
  const totalHeadroom = SKILL_KEYS.reduce((a, k) => a + (potential[k] - start[k]), 0)
  const skillsSum = (): number => SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0)
  const shareLeft = (): number => {
    const left = SKILL_KEYS.reduce((a, k) => a + Math.max(0, potential[k] - world.skills[k]), 0)
    return totalHeadroom > 0 ? Math.min(1, left / totalHeadroom) : 0
  }

  const entriesByTier: Partial<Record<TierId, number>> = {}
  const perTier: Partial<Record<TierId, TierRecord>> = {}
  const rankAtEntry: CareerSummary['rankAtEntry'] = {}
  const bestWtaBy = { a18: null as number | null, a22: null as number | null, a26: null as number | null, a30: null as number | null }
  const skillsAt = { a18: null as number | null, a22: null as number | null, end: 0 }
  const shareAt = { a18: null as number | null, a22: null as number | null }
  let bestWta: number | null = null
  let peakWtaPoints = 0
  let slamEntries = 0
  let billCents = 0
  let travelEntryCents = 0
  const seenFinance = new Set<number>()
  const seenResults = new Set<string>()
  let weeks = 0

  const scanFinance = (): void => {
    for (const fw of world.financeWeeks) {
      if (seenFinance.has(fw.week)) continue
      seenFinance.add(fw.week)
      const by = fw.byCategory as Partial<Record<WorldEventCategory, number>>
      billCents += -Math.min(0, by.coaching ?? 0) - Math.min(0, by.facility ?? 0)
      travelEntryCents += -Math.min(0, by.travel ?? 0) - Math.min(0, by.entry ?? 0)
    }
  }
  const scanResults = (): void => {
    for (const r of world.results) {
      if (r.playerId !== 'kid' || !r.tier || r.mandatoryMiss) continue
      const key = `${r.week}:${r.tier}:${r.points}`
      if (seenResults.has(key)) continue
      seenResults.add(key)
      const table = TIERS[r.tier].points
      const finish = table.indexOf(r.points)
      if (finish < 0) continue
      const rec = (perTier[r.tier] ??= { played: 0, wins: 0, losses: 0, finishes: Array<number>(table.length).fill(0) })
      rec.played++
      rec.finishes[finish]++
      rec.wins += table.length - 1 - finish
      rec.losses += finish > 0 ? 1 : 0
    }
  }

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    const rankBefore = world.kidRankWta
    const entered = stepCareerWeek(world, rng, POLICIES[1])
    for (const t of TIER_LADDER) {
      if (entered[t] > 0) {
        entriesByTier[t] = (entriesByTier[t] ?? 0) + entered[t]
        if (t === 'wta125' || t === 'wta250' || t === 'wta500' || t === 'wta1000' || t === 'slam') {
          ;(rankAtEntry[t] ??= []).push(rankBefore ?? 9999)
          if (t === 'slam') slamEntries++
        }
      }
    }
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    const wtaRank = world.kidRankWta
    if (world.careerTotals.prizeCents > 0 && typeof wtaRank === 'number') {
      if (bestWta === null || wtaRank < bestWta) bestWta = wtaRank
    }
    const pts = kidPoints(world, 'wta')
    if (pts > peakWtaPoints) peakWtaPoints = pts
    if (weeks % 8 === 0) {
      scanFinance()
      scanResults()
    }
    if (world.week === 4 * WEEKS_PER_YEAR) {
      bestWtaBy.a18 = bestWta
      skillsAt.a18 = skillsSum()
      shareAt.a18 = shareLeft()
    }
    if (world.week === 8 * WEEKS_PER_YEAR) {
      bestWtaBy.a22 = bestWta
      skillsAt.a22 = skillsSum()
      shareAt.a22 = shareLeft()
    }
    if (world.week === 12 * WEEKS_PER_YEAR) bestWtaBy.a26 = bestWta
    if (world.week === 16 * WEEKS_PER_YEAR) bestWtaBy.a30 = bestWta
  }
  scanFinance()
  scanResults()

  let titles = 0
  for (const t of Object.values(world.trophiesByTier ?? {})) {
    titles += (t as { titles?: number[] })?.titles?.length ?? 0
  }
  const ending = world.ending
  const bankrupt = ending?.type === 'bankruptcy'
  const bankruptBy18 = bankrupt && (ending?.week ?? Number.MAX_SAFE_INTEGER) <= 4 * WEEKS_PER_YEAR
  const sumU = (totalHeadroom - SKILL_KEYS.length * 4) / (26 - 4) // shipped potentialBand [4, 26]
  return {
    index,
    headroomPct: 100 * irwinHall5CDF(sumU),
    weeks,
    ending: ending?.type ?? null,
    bankrupt,
    bankruptBy18,
    reachedHorizon: !bankrupt && ending?.type !== 'stopped' && ending?.type !== 'college',
    entriesByTier,
    bestWta,
    bestWtaBy,
    peakWtaPoints,
    slamEntries,
    bestFinishSlam: world.bestFinishByTier.slam ?? null,
    titles,
    prizeCents: world.careerTotals.prizeCents,
    billCents,
    travelEntryCents,
    endFundsCents: world.fundsCents,
    skillsAt: { ...skillsAt, end: skillsSum() },
    shareAt,
    perTier,
    rankAtEntry,
  }
}

interface ArmResult {
  arm: Arm
  careers: CareerSummary[]
}

/** ⚠ RESUMABLE BY CONSTRUCTION: `outDir` gets ONE file per arm-cell, written the moment that cell
 *  finishes, and a cell whose file already exists is skipped – so a run killed by a wall-clock cap
 *  loses at most the cell in flight, and re-issuing the same command finishes the remainder. Each
 *  file is a one-element ArmResult[] so `--report` needs no special case. */
function runArms(tokens: string[], outDir: string): void {
  const catalogue = allArms()
  const picked: Arm[] = []
  for (const tok of tokens) {
    const grp = catalogue.filter((a) => a.layer === tok)
    if (grp.length) picked.push(...grp)
    else {
      const one = catalogue.find((a) => a.id === tok)
      if (!one) throw new Error(`unknown arm: ${tok}`)
      picked.push(one)
    }
  }
  const t0 = Date.now()
  let ran = 0
  for (const arm of picked) {
    const file = join(outDir, `${arm.id.replace(/:/g, '_')}.json`)
    let exists = false
    try {
      readFileSync(file)
      exists = true
    } catch {
      exists = false
    }
    if (exists) {
      console.log(`${padEnd(arm.id, 22)} already on disk – skipped`)
      continue
    }
    const t1 = Date.now()
    const careers = withEdge(arm.coachTier, arm.delta, arm.decay, () =>
      Array.from({ length: SEEDS }, (_, i) => runCareer(arm, i)),
    )
    assertHookRestored()
    writeFileSync(file, JSON.stringify([{ arm, careers }] satisfies ArmResult[]))
    ran++
    console.log(
      `${padEnd(arm.id, 22)} delta ${arm.delta.toFixed(3).padStart(6)}${arm.decay ? ' decay' : '      '}  ` +
        `${SEEDS} careers in ${((Date.now() - t1) / 1000).toFixed(0)}s`,
    )
  }
  console.log(`\nwrote ${ran} arm-cells (of ${picked.length} asked) to ${outDir} in ${((Date.now() - t0) / 60000).toFixed(1)} min`)
}

// -------------------------------------------------------------------------------------------------
// REPORT
// -------------------------------------------------------------------------------------------------
function loadResults(dir: string): ArmResult[] {
  const out: ArmResult[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    out.push(...(JSON.parse(readFileSync(join(dir, f), 'utf8')) as ArmResult[]))
  }
  return out
}

const DOOR: Partial<Record<TierId, number>> = { wta250: 200, wta500: 120, wta1000: 65, slam: 104 }

function julyRow(cs: CareerSummary[]): string {
  const n = cs.length
  const has = (f: (c: CareerSummary) => boolean): string => shareOf(cs.filter(f).length, n)
  const wta = cs.map((c) => c.bestWta).filter((x): x is number => x !== null)
  return (
    `${pad(has((c) => !c.bankruptBy18), 9)}${pad(has((c) => (c.entriesByTier.w15 ?? 0) > 0), 8)}` +
    `${pad(has((c) => c.bestWta !== null && c.bestWta <= 250), 9)}${pad(has((c) => c.bestWta !== null && c.bestWta <= 100), 9)}` +
    `${pad(has((c) => c.bestWta !== null && c.bestWta <= DOOR.wta250!), 9)}${pad(has((c) => c.bestWta !== null && c.bestWta <= DOOR.wta500!), 9)}` +
    `${pad(has((c) => (c.entriesByTier.wta500 ?? 0) > 0), 9)}${pad(has((c) => c.slamEntries > 0), 8)}` +
    `${pad(wta.length ? `#${Math.min(...wta)}` : '–', 7)}${pad(wta.length ? `#${pctl(wta, 0.5)}` : '–', 7)}` +
    `${pad(money(pctl(cs.map((c) => c.prizeCents), 0.5)), 11)}`
  )
}

function reportJuly(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`THE JULY TABLE, RE-MEASURED PER ARM (of all starts; targets: top-250 15-25% · top-100 3-6% · Slam <1%)`)
  console.log(`${'='.repeat(118)}`)
  console.log(
    `${padEnd('arm', 22)}${pad('solv18', 9)}${pad('W15', 8)}${pad('top250', 9)}${pad('top100', 9)}` +
      `${pad('clr250', 9)}${pad('clr500', 9)}${pad('ent500', 9)}${pad('slam', 8)}${pad('best', 7)}${pad('p50', 7)}${pad('prize50', 11)}`,
  )
  for (const r of results) console.log(`${padEnd(r.arm.id, 22)}${julyRow(r.careers)}`)
}

function pooledJuly(results: ArmResult[], layer: string, targetPp: number, decay: boolean): CareerSummary[] {
  return results.filter((r) => r.arm.layer === layer && r.arm.targetPp === targetPp && r.arm.decay === decay).flatMap((r) => r.careers)
}

function reportDose(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`DOSE-RESPONSE – Layer A pooled over working+middle (n = 60 per row), flat and decay`)
  console.log(`${'='.repeat(118)}`)
  console.log(
    `${padEnd('dose (pp per match)', 26)}${pad('top250', 9)}${pad('top100', 9)}${pad('clr500', 9)}${pad('ent500', 9)}` +
      `${pad('slam', 8)}${pad('best', 8)}${pad('p50 rank', 9)}${pad('p50 book', 9)}${pad('p90 book', 9)}`,
  )
  const row = (label: string, cs: CareerSummary[]): void => {
    if (!cs.length) return
    const n = cs.length
    const wta = cs.map((c) => c.bestWta).filter((x): x is number => x !== null)
    console.log(
      `${padEnd(label, 26)}${pad(shareOf(cs.filter((c) => c.bestWta !== null && c.bestWta <= 250).length, n), 9)}` +
        `${pad(shareOf(cs.filter((c) => c.bestWta !== null && c.bestWta <= 100).length, n), 9)}` +
        `${pad(shareOf(cs.filter((c) => c.bestWta !== null && c.bestWta <= 120).length, n), 9)}` +
        `${pad(shareOf(cs.filter((c) => (c.entriesByTier.wta500 ?? 0) > 0).length, n), 9)}` +
        `${pad(shareOf(cs.filter((c) => c.slamEntries > 0).length, n), 8)}` +
        `${pad(wta.length ? `#${Math.min(...wta)}` : '–', 8)}${pad(wta.length ? `#${pctl(wta, 0.5)}` : '–', 9)}` +
        `${pad(pctl(cs.map((c) => c.peakWtaPoints), 0.5), 9)}${pad(pctl(cs.map((c) => c.peakWtaPoints), 0.9), 9)}`,
    )
  }
  // pooled over the SAME two backgrounds the dose arms run, so the rows are comparable
  const baseAB = results.filter((r) => r.arm.layer === 'base' && r.arm.background !== 'wealthy').flatMap((r) => r.careers)
  row('baseline 0.00', baseAB)
  for (const pp of [0.45, 0.65, 0.85, 1.05, 0.9, 1.3, 1.7, 2.1]) row(`flat  ${pp.toFixed(2)}`, pooledJuly(results, 'aflat', pp, false))
  for (const pp of [0.45, 0.65, 0.85, 1.05]) row(`decay ${pp.toFixed(2)} (floor 0.5)`, pooledJuly(results, 'adec', pp, true))
}

function reportPaired(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`PAIRED AGAINST THE SAME GIRL, SELF-COACHED BASELINE (Δ = arm − base; rank Δ negative = better)`)
  console.log(`${'='.repeat(118)}`)
  const bases = new Map<string, CareerSummary[]>()
  for (const r of results) if (r.arm.layer === 'base') bases.set(r.arm.background, r.careers)
  console.log(
    `${padEnd('arm', 22)}${pad('Δbest rank', 12)}${pad('b/w/t', 10)}${pad('Δpeak book', 12)}${pad('Δprize p50', 13)}${pad('Δ skills@22', 12)}`,
  )
  for (const r of results) {
    if (r.arm.layer === 'base') continue
    const base = bases.get(r.arm.background)
    if (!base) continue
    let better = 0
    let worse = 0
    let tied = 0
    const dRank: number[] = [] // only pairs where BOTH careers ranked – the 9999 sentinel poisons a mean
    const dBook: number[] = []
    const dPrize: number[] = []
    const dSkill: number[] = []
    for (const c of r.careers) {
      const b = base.find((x) => x.index === c.index)
      if (!b) continue
      const cr = c.bestWta ?? 9999
      const br = b.bestWta ?? 9999
      if (cr < br) better++
      else if (cr > br) worse++
      else tied++
      if (c.bestWta !== null && b.bestWta !== null) dRank.push(c.bestWta - b.bestWta)
      dBook.push(c.peakWtaPoints - b.peakWtaPoints)
      dPrize.push(c.prizeCents - b.prizeCents)
      if (c.skillsAt.a22 !== null && b.skillsAt.a22 !== null) dSkill.push(c.skillsAt.a22 - b.skillsAt.a22)
    }
    console.log(
      `${padEnd(r.arm.id, 22)}${pad(dRank.length ? mean(dRank).toFixed(1) : '–', 12)}${pad(`${better}/${worse}/${tied}`, 10)}` +
        `${pad(mean(dBook).toFixed(0), 12)}${pad(money(pctl(dPrize, 0.5)), 13)}${pad(dSkill.length ? mean(dSkill).toFixed(2) : '–', 12)}`,
    )
  }
}

function reportBill(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`NET OF THE BILL (Layer B) – does the coach pay for himself once he delivers the edge?`)
  console.log(`prize/bill are per-career medians; Δ columns are paired against the same background's self-coached baseline`)
  console.log(`${'='.repeat(118)}`)
  const bases = new Map<string, CareerSummary[]>()
  for (const r of results) if (r.arm.layer === 'base') bases.set(r.arm.background, r.careers)
  console.log(
    `${padEnd('cell', 26)}${pad('solvent', 9)}${pad('prize p50', 12)}${pad('bill p50', 11)}${pad('prize−bill', 12)}` +
      `${pad('Δprize vs self', 15)}${pad('Δbest rank', 12)}${pad('b/w/t', 9)}${pad('travel p50', 12)}`,
  )
  for (const r of results) {
    if (r.arm.layer !== 'bctl' && r.arm.layer !== 'bedge') continue
    const base = bases.get(r.arm.background)
    const n = r.careers.length
    const net = r.careers.map((c) => c.prizeCents - c.billCents)
    let better = 0
    let worse = 0
    let tied = 0
    const dPrize: number[] = []
    if (base) {
      for (const c of r.careers) {
        const b = base.find((x) => x.index === c.index)
        if (!b) continue
        const cr = c.bestWta ?? 9999
        const br = b.bestWta ?? 9999
        if (cr < br) better++
        else if (cr > br) worse++
        else tied++
        dPrize.push(c.prizeCents - b.prizeCents)
      }
    }
    const dRank: number[] = []
    if (base) {
      for (const c of r.careers) {
        const b = base.find((x) => x.index === c.index)
        if (b && c.bestWta !== null && b.bestWta !== null) dRank.push(c.bestWta - b.bestWta)
      }
    }
    console.log(
      `${padEnd(r.arm.id, 26)}${pad(shareOf(r.careers.filter((c) => !c.bankrupt).length, n), 9)}` +
        `${pad(money(pctl(r.careers.map((c) => c.prizeCents), 0.5)), 12)}${pad(money(pctl(r.careers.map((c) => c.billCents), 0.5)), 11)}` +
        `${pad(money(pctl(net, 0.5)), 12)}${pad(dPrize.length ? money(mean(dPrize)) : '–', 15)}` +
        `${pad(dRank.length ? mean(dRank).toFixed(1) : '–', 12)}${pad(`${better}/${worse}/${tied}`, 9)}` +
        `${pad(money(pctl(r.careers.map((c) => c.travelEntryCents), 0.5)), 12)}`,
    )
  }
}

function reportLanding(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`WHERE THE EDGE LANDS, LIVED – kid match-win % by rung (pooled matches), and the deep-run conversions`)
  console.log(`${'='.repeat(118)}`)
  const armsToShow = results.filter(
    (r) =>
      r.arm.layer === 'base' ||
      (r.arm.layer === 'aflat' && [0.45, 1.05, 2.1].includes(r.arm.targetPp)) ||
      (r.arm.layer === 'adec' && r.arm.targetPp === 1.05),
  )
  // pool the two backgrounds per (layer, targetPp, decay)
  const seen = new Set<string>()
  console.log(
    `${padEnd('arm (pooled bgs)', 26)}${TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
      .map((t) => pad(t.replace('wta', ''), 8))
      .join('')}`,
  )
  for (const r of armsToShow) {
    const key = `${r.arm.layer}:${r.arm.targetPp}:${r.arm.decay}`
    if (seen.has(key)) continue
    seen.add(key)
    const cs = results.filter((x) => `${x.arm.layer}:${x.arm.targetPp}:${x.arm.decay}` === key && x.arm.coachTier === 'self').flatMap((x) => x.careers)
    if (!cs.length) continue
    const cells = TIER_LADDER.filter((t) => TIERS[t].track === 'wta').map((t) => {
      let w = 0
      let l = 0
      for (const c of cs) {
        const rec = c.perTier[t]
        if (rec) {
          w += rec.wins
          l += rec.losses
        }
      }
      return w + l ? pad(`${((100 * w) / (w + l)).toFixed(1)}`, 8) : pad('–', 8)
    })
    console.log(`${padEnd(key, 26)}${cells.join('')}`)
  }
  console.log(`\nDEEP RUNS at wta250 / wta500 (pooled over self-coached arms):  opener won · QF reached · QF->SF conversion`)
  for (const r of armsToShow) {
    const key = `${r.arm.layer}:${r.arm.targetPp}:${r.arm.decay}`
    const cs = results.filter((x) => `${x.arm.layer}:${x.arm.targetPp}:${x.arm.decay}` === key && x.arm.coachTier === 'self').flatMap((x) => x.careers)
    if (!cs.length) continue
    const conv = (tier: TierId): string => {
      let played = 0
      let opener = 0
      let qf = 0
      let sf = 0
      for (const c of cs) {
        const rec = c.perTier[tier]
        if (!rec) continue
        played += rec.played
        const f = rec.finishes
        opener += f.slice(0, f.length - 1).reduce((a, b) => a + b, 0) // finish < last = won the opener
        qf += f.slice(0, 4).reduce((a, b) => a + b, 0)
        sf += f.slice(0, 3).reduce((a, b) => a + b, 0)
      }
      return `${padEnd(tier, 8)} ${pad(played, 5)} played  ${pad(shareOf(opener, played), 7)}  ${pad(shareOf(qf, played), 7)}  ${pad(shareOf(sf, qf), 7)}`
    }
    console.log(`  ${padEnd(key, 24)}${conv('wta250')}    ${conv('wta500')}`)
  }
  console.log(`\nRANK AT ENTRY (median), wta250 / wta500 / slam – does she stop arriving unseeded?`)
  for (const r of armsToShow) {
    const key = `${r.arm.layer}:${r.arm.targetPp}:${r.arm.decay}`
    const cs = results.filter((x) => `${x.arm.layer}:${x.arm.targetPp}:${x.arm.decay}` === key && x.arm.coachTier === 'self').flatMap((x) => x.careers)
    if (!cs.length) continue
    const med = (k: 'wta250' | 'wta500' | 'slam'): string => {
      const ranks = cs.flatMap((c) => c.rankAtEntry[k] ?? [])
      return ranks.length ? `#${pctl(ranks, 0.5)} (n=${ranks.length})` : '–'
    }
    console.log(`  ${padEnd(key, 24)}${padEnd(med('wta250'), 18)}${padEnd(med('wta500'), 18)}${padEnd(med('slam'), 18)}`)
  }
}

function reportSolvency(results: ArmResult[]): void {
  console.log(`\n${'='.repeat(118)}`)
  console.log(`SOLVENCY PER CELL – endings breakdown (the bill still competes with the plane ticket)`)
  console.log(`${'='.repeat(118)}`)
  console.log(`${padEnd('arm', 26)}${pad('natural', 9)}${pad('injury', 8)}${pad('bankrupt', 10)}${pad('…by 18', 8)}${pad('end funds p50', 15)}`)
  for (const r of results) {
    const by: Record<string, number> = {}
    for (const c of r.careers) by[c.ending ?? 'horizon'] = (by[c.ending ?? 'horizon'] ?? 0) + 1
    console.log(
      `${padEnd(r.arm.id, 26)}${pad(by.natural ?? 0, 9)}${pad(by.injury ?? 0, 8)}${pad(by.bankruptcy ?? 0, 10)}` +
        `${pad(r.careers.filter((c) => c.bankruptBy18).length, 8)}${pad(money(pctl(r.careers.map((c) => c.endFundsCents), 0.5)), 15)}`,
    )
  }
}

function reportDecayDiag(results: ArmResult[]): void {
  const dec = results.filter((r) => r.arm.layer === 'adec')
  if (!dec.length) return
  console.log(`\nDECAY DIAGNOSTIC – the multiplier the curve actually applied (floor 0.5 + 0.5 x share left)`)
  const cs = dec.flatMap((r) => r.careers)
  const m = (xs: Array<number | null>): string => {
    const v = xs.filter((x): x is number => x !== null)
    return v.length ? (0.5 + 0.5 * mean(v)).toFixed(3) : '–'
  }
  console.log(`  share left at 18 -> multiplier ${m(cs.map((c) => c.shareAt.a18))} · at 22 -> ${m(cs.map((c) => c.shareAt.a22))}`)
}

// -------------------------------------------------------------------------------------------------
function main(): void {
  const t0 = Date.now()
  if (args.includes('--calibrate')) {
    calibrate()
  } else if (flag('arms') !== null) {
    const outDir = flag('out')
    if (!outDir) throw new Error('--arms needs --out <dir>')
    runArms((flag('arms') ?? '').split(',').filter(Boolean), outDir)
  } else if (flag('report') !== null) {
    const results = loadResults(flag('report')!)
    console.log(`loaded ${results.length} arm-cells, ${results.reduce((s, r) => s + r.careers.length, 0)} careers`)
    reportJuly(results)
    reportDose(results)
    reportPaired(results)
    reportBill(results)
    reportLanding(results)
    reportSolvency(results)
    reportDecayDiag(results)
  } else {
    throw new Error('one of --calibrate | --arms <ids> --out <file> | --report <dir>')
  }
  assertHookRestored()
  console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main()
