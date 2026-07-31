/**
 * NEXT-GOAL BENCH – how long does a career actually sit on one rung?
 *
 * ⚠ MEASURE BEFORE WIRING THE COPY. The spec (docs/specs/calendar-week-grid.md §4b.2) is explicit
 * about the order and about why: «И "stuck" is a number to be measured, not felt. How many weeks
 * does a mid-tier career really sit on one rung? If "win one match at Regional" takes thirty weeks
 * on average, the skill line is not a garnish - it is the state the scrap is in most of the time,
 * and the ladder's rungs are spaced wrong.» Same order that cancelled the coach-travel mechanic on
 * 30.07: measure, then decide.
 *
 * MEASUREMENT ONLY. This file imports the engine and the goal module and changes neither. It reuses
 * the econ bench's own career loop (`stepCareerWeek`) so the entry policy is the one already argued
 * for and calibrated there rather than a second parent invented here - an ambitious parent who
 * enters the strongest event she qualifies for and can afford, a few weeks before each deadline.
 *
 * WHAT IT REPORTS, per preset and pooled:
 *   - the run-length distribution of the RUNG (how many consecutive weeks the goal asks for the same
 *     thing): median, mean, p90, longest;
 *   - the share of career weeks that fall inside a run of N+ weeks, for a few candidate thresholds -
 *     which is the number that actually decides how often the skill line would appear;
 *   - how many distinct rungs a career visits, which is the "are the rungs spaced wrong" question in
 *     its most direct form.
 *
 * Run:  npx vite-node tools/next-goal-bench.ts
 *       npx vite-node tools/next-goal-bench.ts -- --seeds 24 --weeks 208
 */
import { createWorld, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'
import { stepCareerWeek, POLICIES } from './econ-bench'
import { nextRungFor, weeksOnRung, skillGoalFor, nextGoalFor } from '../src/composables/nextGoal'

const arg = (name: string, fallback: number): number => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : Number(process.argv[i + 1])
}

const SEEDS = arg('seeds', 12)
/** 14 -> 18, the econ bench's own "pro attempt" horizon. Four seasons is long enough for a career to
 *  climb two or three rungs and long enough for a stall to be visible as a stall. */
const WEEKS = arg('weeks', 208)

/** Three families, so "a mid-tier career" is not one bankroll's answer. The coach rung is the one
 *  each family realistically buys, exactly as the econ bench pairs them. */
const PRESETS: { label: string; background: FamilyBackground }[] = [
  { label: 'working', background: 'working' },
  { label: 'middle', background: 'middle' },
  { label: 'wealthy', background: 'wealthy' },
]

interface Run {
  key: string
  weeks: number
}

/** One career week, as the copy decision sees it. `onRung` is the number the threshold is actually
 *  compared against, which is NOT the same thing as the run length above: the run length is how long
 *  the rung KEY is unchanged, while `weeksOnRung` counts from the counting result that put her
 *  there - and the best-6 window can drop that result out from under her. Both are reported. */
interface WeekSample {
  onRung: number
  entered: boolean
  hasSkill: boolean
}

function runsFor(
  seed: string,
  profile: PlayerProfile,
): { runs: Run[]; samples: WeekSample[] } {
  const world = createWorld(seed, profile, `bench-${seed}`)
  const rng = rngFromSeed(seed)
  const runs: Run[] = []
  const samples: WeekSample[] = []
  let current: Run | null = null
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, POLICIES[0])
    const snap = toSnapshot(world)
    const rung = nextRungFor(snap)
    const key = `${rung.tier}:${rung.finish}`
    if (current && current.key === key) current.weeks++
    else {
      if (current) runs.push(current)
      current = { key, weeks: 1 }
    }
    samples.push({
      onRung: weeksOnRung(snap),
      // An entered tournament owns the goal whatever the threshold is, so these weeks can never
      // carry the skill line and must not be counted as if they could.
      entered: nextGoalFor(snap).kind === 'rung' && snap.upcoming.some((e) => e.entered),
      hasSkill: skillGoalFor(snap) !== null,
    })
  }
  if (current) runs.push(current)
  return { runs, samples }
}

function pct(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}
const mean = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0)

function main(): void {
  console.log(`NEXT-GOAL BENCH – ${SEEDS} seeds x ${WEEKS} weeks x ${PRESETS.length} presets\n`)
  const pooled: number[] = []
  const pooledDistinct: number[] = []
  const samples: WeekSample[] = []
  for (const preset of PRESETS) {
    const lengths: number[] = []
    const distinct: number[] = []
    for (let i = 0; i < SEEDS; i++) {
      const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: preset.background }
      const run = runsFor(`ng-${preset.label}-${i}`, profile)
      lengths.push(...run.runs.map((r) => r.weeks))
      distinct.push(new Set(run.runs.map((r) => r.key)).size)
      samples.push(...run.samples)
    }
    pooled.push(...lengths)
    pooledDistinct.push(...distinct)
    console.log(
      `${preset.label.padEnd(8)} runs ${String(lengths.length).padStart(4)}  ` +
        `median ${String(pct(lengths, 50)).padStart(3)}w  mean ${mean(lengths).toFixed(1).padStart(5)}w  ` +
        `p90 ${String(pct(lengths, 90)).padStart(3)}w  max ${String(Math.max(...lengths)).padStart(3)}w  ` +
        `distinct rungs/career ${mean(distinct).toFixed(1)}`,
    )
  }
  console.log('\nPOOLED – how long the RUNG stays the same')
  console.log(`  runs           ${pooled.length}`)
  console.log(`  median         ${pct(pooled, 50)}w`)
  console.log(`  mean           ${mean(pooled).toFixed(1)}w`)
  console.log(`  p75 / p90      ${pct(pooled, 75)}w / ${pct(pooled, 90)}w`)
  console.log(`  longest        ${Math.max(...pooled)}w`)
  console.log(`  distinct rungs per career (mean)  ${mean(pooledDistinct).toFixed(1)}`)
  const totalWeeks = pooled.reduce((s, x) => s + x, 0)
  console.log('\n  share of CAREER WEEKS spent inside a run of at least N weeks:')
  for (const n of [4, 6, 8, 10, 12, 16, 20, 26, 30, 40]) {
    const inside = pooled.filter((x) => x >= n).reduce((s, x) => s + x, 0)
    console.log(`    ${String(n).padStart(3)}w+   ${((inside / totalWeeks) * 100).toFixed(1)}%`)
  }

  // THE NUMBER THE THRESHOLD IS ACTUALLY COMPARED AGAINST, and the consequence of every candidate.
  const onRung = samples.map((s) => s.onRung)
  console.log('\nPOOLED – `weeksOnRung`, the number STUCK_AFTER_WEEKS is compared to')
  console.log(`  weeks sampled  ${onRung.length}`)
  console.log(`  median         ${pct(onRung, 50)}w`)
  console.log(`  mean           ${mean(onRung).toFixed(1)}w`)
  console.log(`  p75 / p90      ${pct(onRung, 75)}w / ${pct(onRung, 90)}w`)
  console.log(`  longest        ${Math.max(...onRung)}w`)
  const enteredWeeks = samples.filter((s) => s.entered).length
  console.log(
    `\n  a tournament is already booked on ${((enteredWeeks / samples.length) * 100).toFixed(1)}% of weeks – ` +
      'those weeks name the draw whatever the threshold is',
  )
  console.log('\n  share of weeks the SKILL line would take, per candidate threshold:')
  for (const n of [6, 8, 10, 12, 16, 20, 26, 30]) {
    const skill = samples.filter((s) => !s.entered && s.onRung >= n && s.hasSkill).length
    const stuckMute = samples.filter((s) => !s.entered && s.onRung >= n && !s.hasSkill).length
    console.log(
      `    ${String(n).padStart(3)}w+   ${((skill / samples.length) * 100).toFixed(1)}%` +
        `   (stuck, free, and the coach has nothing to say: ${stuckMute})`,
    )
  }
}

main()
