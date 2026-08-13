/**
 * wall-l1-bench – L1, THE OWNER'S PER-MATCH COACH EDGE, measured against the wall
 * (docs/specs/the-wall-2026-08.md §2 L1, §3 – the pre-registered measurement).
 *
 * The owner's proposal, 12.08: the coach adds a small edge to her chance of winning a match,
 * career-long while he is paid. A Markov engine has no "win chance" knob, so the translation is an
 * additive delta on her five on-court attributes at the composition point, calibrated here so her
 * mean match-win probability against her actual current field moves by the target percentage.
 *
 * ⚠⚠ THE LEVER SHIPPED, AND THIS BENCH NOW DRIVES THE SHIPPED MECHANIC (docs/specs/coach-match-edge.md).
 * Two consequences, both deliberate:
 *
 *   1. THE ARMS ARE CORRIDORS, NOT DOSES. `COACH_EDGE_CORRIDOR_PP` (src/engine/coach.ts) is the knob:
 *      an arm zeroes the whole table and writes the one corridor it is measuring, restores in a
 *      `finally`, and exits 1 if the restore did not take – the what-money-buys §8 pattern. A
 *      degenerate corridor `[pp, pp]` is a flat dose, so every dose the old arms could express is
 *      still expressible; what an arm can no longer do is set a dose and skip the coach.
 *
 *   2. LAYER A IS RETIRED. `aflat` / `adec` put a synthetic dose on a SELF-COACHED career, and the
 *      shipped edge is drawn off a COACH's id – a career with no coach has nothing to draw off, so
 *      those arms could only ever produce baseline careers now, silently. Their measurement is done
 *      and recorded (the-wall-2026-08.md §M3 dose-response, §M7 flat-vs-decay: the same careers, so
 *      the owner picked flat and the decay curve was deleted from the engine). The live question is
 *      Layer B – the shipped ladder, real hires, net of the bill – which is coach-match-edge.md §6.
 *
 * ⚠ RNG: the edge is a re-derivation off `seed:coachedge:<id>` plus arithmetic at composition. Kid
 * brackets run on `seed:kidtour:<event.id>` / `seed:<event.id>:r<n>` sub-streams and AI brackets on
 * `seed:aitour:<event.id>`, so no arm can move the MAIN stream – only match OUTCOMES move, exactly
 * like kit and condition.
 *
 * THE THREE MODES:
 *
 *   --calibrate            The dial behind COACH_EDGE_POINTS_PER_PP. 16 self-coached careers (8
 *                          seeds x working/middle), sampled 4x a season; at every sampled state her
 *                          mean match-win probability against the field at her CURRENT rung (the
 *                          winrate-read methodology: universeForTier + isEntrantBand +
 *                          rivalConditions, hard court, the neutral surface) is computed for a grid
 *                          of deltas. Pooled career-long curve -> delta per target; per-rung curve
 *                          -> where the edge lands, statically. Touches no hook at all: it adds the
 *                          delta to the composed player itself, which is what the composition point
 *                          does, so the dial can be re-measured without the mechanic in the way.
 *
 *   --arms <ids> --out <dir>
 *                          The careers. Runs the named arm-cells (30 paired seeds each, `player`
 *                          policy, full 14->38 careers, bankruptcy NOT defused, fork answered
 *                          'continue', retirement refused) and writes one JSON per arm-cell into
 *                          <dir> as it finishes – resumable, cells already on disk are skipped.
 *                          Groups: base, bctl, bedge – or single ids like bedge:wealthy:high.
 *
 *   --report <dir>         The fold. Reads every *.json under dir and prints the report tables:
 *                          the July table per arm, net-of-the-bill per Layer B cell, where the
 *                          edge lands (lived), solvency.
 *
 * Reproduce:
 *   npx vite-node tools/wall-l1-bench.ts -- --calibrate
 *   npx vite-node tools/wall-l1-bench.ts -- --arms base,bctl,bedge --out /tmp/wall-l1 --seeds 30
 *   npx vite-node tools/wall-l1-bench.ts -- --report /tmp/wall-l1
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openCareer, stepCareerWeek, POLICIES, type Preset } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, type WorldState } from '../src/engine/world'
import { kidPoints, rankingFor } from '../src/engine/world/ladder'
import { kidMatchPlayerFor, startingSkills } from '../src/engine/world/player'
import { COACH_EDGE_CORRIDOR_PP } from '../src/engine/coach'
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
// THE SHIPPED CORRIDORS, captured at import – the restore target, and the `bedge` arm's own setting.
// A deep copy, because the arms mutate the tuples in place.
// -------------------------------------------------------------------------------------------------
const SHIPPED_CORRIDORS = Object.fromEntries(
  Object.entries(COACH_EDGE_CORRIDOR_PP).map(([t, c]) => [t, [c[0], c[1]] as [number, number]]),
) as Record<CoachTier, [number, number]>

// -------------------------------------------------------------------------------------------------
// knob mutation, scoped and asserted – the what-money-buys §8 pattern
// -------------------------------------------------------------------------------------------------
/** Run `fn` with EVERY corridor zeroed except the ones named. Zeroing the rest is what makes a
 *  control arm a control: the corridors ship non-zero now, so a `bctl` cell that only refrained from
 *  setting its own tier would still be carrying the shipped edge and would measure nothing. */
function withCorridors<T>(override: Partial<Record<CoachTier, [number, number]>>, fn: () => T): T {
  const before = Object.fromEntries(
    Object.entries(COACH_EDGE_CORRIDOR_PP).map(([t, c]) => [t, [c[0], c[1]]]),
  ) as Record<CoachTier, [number, number]>
  for (const t of Object.keys(COACH_EDGE_CORRIDOR_PP) as CoachTier[]) COACH_EDGE_CORRIDOR_PP[t] = [0, 0]
  for (const [t, c] of Object.entries(override)) COACH_EDGE_CORRIDOR_PP[t as CoachTier] = [c[0], c[1]]
  try {
    return fn()
  } finally {
    Object.assign(COACH_EDGE_CORRIDOR_PP, before)
  }
}
function assertHookRestored(): void {
  const dirty = (Object.keys(SHIPPED_CORRIDORS) as CoachTier[]).some(
    (t) => COACH_EDGE_CORRIDOR_PP[t][0] !== SHIPPED_CORRIDORS[t][0] || COACH_EDGE_CORRIDOR_PP[t][1] !== SHIPPED_CORRIDORS[t][1],
  )
  if (dirty) {
    console.error('FATAL: COACH_EDGE_CORRIDOR_PP was not restored to its shipped table')
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

/** ⚠ THE DELTA IS ADDED HERE, NOT THROUGH THE MECHANIC. The calibration measures pp-per-skill-point
 *  and must stay measurable whatever the shipped mechanic looks like – and the careers it samples are
 *  SELF-COACHED, so there is no coach to hang a corridor on. This reproduces exactly what
 *  `kidMatchPlayerFor` does with a non-zero edge: `+delta` on all five wings, after the whole
 *  composition. */
function meanWinProbAt(w: WorldState, field: MatchPlayer[], delta: number): number {
  const composed = kidMatchPlayerFor(w, 'hard')
  const kid: MatchPlayer =
    delta === 0
      ? composed
      : {
          ...composed,
          serve: composed.serve + delta,
          ret: composed.ret + delta,
          composure: composed.composure + delta,
          stamina: composed.stamina + delta,
          groundstrokes: composed.groundstrokes + delta,
        }
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
  console.log(`\nTHE CALIBRATION TABLE (the anchor behind COACH_EDGE_POINTS_PER_PP; target -> delta -> measured ΔP)`)
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
  layer: 'base' | 'bctl' | 'bedge'
  background: FamilyBackground
  coachTier: CoachTier
  /** the corridor this arm's rung runs under, in pp per match. [0, 0] = no edge (the controls). */
  corridor: [number, number]
}

const HIRED: readonly CoachTier[] = ['budget', 'middle', 'high', 'elite']
const BACKGROUNDS: readonly FamilyBackground[] = ['working', 'middle', 'wealthy']

/** THE SHIPPED LADDER, MEASURED AGAINST ITSELF (coach-match-edge.md §6). Three arms per cell:
 *
 *   base   – self-coached, no coach, no bill. The paired control every Δ is taken against.
 *   bctl   – the real hire with every corridor ZEROED: the coach she was buying before this shipped.
 *   bedge  – the same hire under the SHIPPED corridors: the coach she is buying now.
 *
 *  `bedge` runs the real corridor rather than a flat midpoint, so the spread the design bought – a
 *  budget coach who might be a find – is inside the measurement instead of averaged out of it. */
function allArms(): Arm[] {
  const arms: Arm[] = []
  for (const bg of BACKGROUNDS) {
    arms.push({ id: `base:${bg}`, layer: 'base', background: bg, coachTier: 'self', corridor: [0, 0] })
  }
  for (const bg of BACKGROUNDS) {
    for (const tier of HIRED) {
      arms.push({ id: `bctl:${bg}:${tier}`, layer: 'bctl', background: bg, coachTier: tier, corridor: [0, 0] })
      arms.push({
        id: `bedge:${bg}:${tier}`,
        layer: 'bedge',
        background: bg,
        coachTier: tier,
        corridor: [...SHIPPED_CORRIDORS[tier]] as [number, number],
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
  /** how much of her total headroom is still unrealised at the checkpoints – see reportHeadroom */
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
    const careers = withCorridors({ [arm.coachTier]: arm.corridor }, () =>
      Array.from({ length: SEEDS }, (_, i) => runCareer(arm, i)),
    )
    assertHookRestored()
    writeFileSync(file, JSON.stringify([{ arm, careers }] satisfies ArmResult[]))
    ran++
    console.log(
      `${padEnd(arm.id, 22)} corridor ${arm.corridor[0].toFixed(2)}-${arm.corridor[1].toFixed(2)} pp  ` +
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
  // ⚠ POOLED BY (layer, rung) ACROSS BACKGROUNDS, which is the grouping Layer B needs: the question
  // is what the edge does to her TENNIS, and the background decides only whether she can pay for it.
  const keyOf = (a: Arm): string => `${a.layer}:${a.coachTier}`
  const armsToShow = results.filter((r) => r.arm.layer === 'base' || r.arm.layer === 'bctl' || r.arm.layer === 'bedge')
  const seen = new Set<string>()
  console.log(
    `${padEnd('arm (pooled bgs)', 26)}${TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
      .map((t) => pad(t.replace('wta', ''), 8))
      .join('')}`,
  )
  for (const r of armsToShow) {
    const key = keyOf(r.arm)
    if (seen.has(key)) continue
    seen.add(key)
    const cs = results.filter((x) => keyOf(x.arm) === key).flatMap((x) => x.careers)
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
  console.log(`\nDEEP RUNS at wta250 / wta500 (pooled over backgrounds):  opener won · QF reached · QF->SF conversion`)
  const seenDeep = new Set<string>()
  for (const r of armsToShow) {
    const key = keyOf(r.arm)
    if (seenDeep.has(key)) continue
    seenDeep.add(key)
    const cs = results.filter((x) => keyOf(x.arm) === key).flatMap((x) => x.careers)
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
  const seenRank = new Set<string>()
  for (const r of armsToShow) {
    const key = keyOf(r.arm)
    if (seenRank.has(key)) continue
    seenRank.add(key)
    const cs = results.filter((x) => keyOf(x.arm) === key).flatMap((x) => x.careers)
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

function reportHeadroom(results: ArmResult[]): void {
  // ⚠ WAS THE DECAY DIAGNOSTIC, and it outlived the curve it was built for. The decay arm measured
  // the same careers as flat (the-wall §M7) so the owner shipped flat and the curve was deleted – but
  // "how full is she by 18 and by 22" is the context every uplift on the coach card is relative to,
  // and it is the cheapest sanity check that a cell's girls are not all at their ceiling already.
  const cs = results.flatMap((r) => r.careers)
  if (!cs.length) return
  const m = (xs: Array<number | null>): string => {
    const v = xs.filter((x): x is number => x !== null)
    return v.length ? `${(100 * mean(v)).toFixed(1)}%` : '–'
  }
  console.log(`\nHEADROOM LEFT (mean share of her total headroom still unrealised)`)
  console.log(`  at 18 -> ${m(cs.map((c) => c.shareAt.a18))} · at 22 -> ${m(cs.map((c) => c.shareAt.a22))}`)
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
    reportPaired(results)
    reportBill(results)
    reportLanding(results)
    reportSolvency(results)
    reportHeadroom(results)
  } else {
    throw new Error('one of --calibrate | --arms <ids> --out <file> | --report <dir>')
  }
  assertHookRestored()
  console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main()
