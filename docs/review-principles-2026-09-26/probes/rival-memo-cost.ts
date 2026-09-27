// Lane C probe, T3.2's SECOND half – what does C-01's fix COST? (26.09.2026, arms measured 27.09)
//
// C-01's plan line is a CHOICE: «Key the run-index cache on the content of every knob `runStrain`
// reads, or drop the memo – measure both arms and ship the cheaper correct one.» Both arms are
// correct (`tests/principles-c01-rival-memo.test.ts` passes on both, and reddens on the two-ladder
// key either way). This probe is the other half of the decision, and it takes WALL CLOCK – so read
// the load average it prints before you believe any row of it. CLAUDE.md's 16.08 incident is the
// reason that line exists: a red gate was twice blamed on a wave and twice was `mobileassetd`.
//
// ⚠⚠ IT MEASURES THE INSTALLED `season/rival.ts`, NOT A COPY OF IT. The probe imports
// `reconstructRun` and `rivalConditions` from the engine, so whichever arm is in the working tree is
// what gets timed – which is the point. A probe carrying its own three implementations would be the
// hazard CLAUDE.md names ("a bench came back byte-identical from an arm that never reached the code
// it was measuring"). It therefore prints a FINGERPRINT of the arm it is running against, read out
// of the source file, so a row can never be attributed to the wrong arm:
//   stale  – `runsIndexCache.ladder === ladder` (the two-ladder identity key, the pre-fix tree)
//   armA   – `strainKnobsUnchanged` (the content key over all five knobs, checked once per ROW)
//   armA'  – `reconstructRunIn` (the same key, resolved once per FIELD READ – the shipped arm)
//   armB   – no `runsIndexCache` at all (the memo dropped, rebuilt per call)
//
// WHAT THE TWO SECTIONS MEAN.
//   HOT PATH – `reconstructRun` on one row, in a tight loop. This is the per-ROW cost of the
//     freshness decision: for the stale arm two reference compares, for arm A ~40 integer compares,
//     for arm B a whole index build (16 tiers, 96 (tier, finish) pairs, <= 490 matchDrain calls and
//     96 sorts). `rivalConditions` calls it once per ledger row in the window, so this number is
//     multiplied by the row count on every call.
//   FIELD – `rivalConditions` over a synthetic ledger, the call the engine actually makes
//     (`world/weekField.ts:118`, `world/snapshot.ts:443`, `season/preview.ts:660`; the third is
//     per preview card, so a snapshot makes several). Row counts bracket the shipped scale rather
//     than asserting one: the review measured ~22.3 events per rival per season over 199 rivals,
//     which is ~1370 rows inside the 16-week `rivalFatigueWindowWeeks`.
//
// Usage (from the root of the worktree, after installing the arm you want to time):
//   npx vite-node docs/review-principles-2026-09-26/probes/rival-memo-cost.ts
import { readFileSync } from 'node:fs'
import { loadavg } from 'node:os'
import { ECONOMY } from '../../../src/engine/economy'
import { TIERS, TIER_LADDER } from '../../../src/engine/season/calendar'
import { reconstructRun, rivalConditions } from '../../../src/engine/season/rival'
import type { SeasonResult } from '../../../src/engine/season/ranking'
import type { TierId } from '../../../src/engine/season/types'

const SRC = new URL('../../../src/engine/season/rival.ts', import.meta.url)
function arm(): string {
  const src = readFileSync(SRC, 'utf8')
  if (src.includes('runsIndexCache.ladder === ladder')) return 'stale (two-ladder identity key)'
  if (src.includes('reconstructRunIn')) return "armA' (content key, resolved once per field read)"
  if (src.includes('strainKnobsUnchanged')) return 'armA (content key, checked once per ROW)'
  if (!src.includes('runsIndexCache')) return 'armB (memo dropped, rebuilt per call)'
  return 'UNKNOWN – do not attribute this run'
}

/** The lowest of `reps` timings of `fn` run `iters` times, in nanoseconds per call. The MIN is the
 *  estimator, not the mean: for CPU-bound work every sample is the true cost plus whatever the
 *  machine stole, so noise is one-sided and the mean measures the machine. The median is printed
 *  beside it – a wide gap between them is the tell that the machine was busy. */
function timePerCall(iters: number, reps: number, fn: () => void): { min: number; med: number } {
  const samples: number[] = []
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now()
    for (let i = 0; i < iters; i++) fn()
    samples.push(((performance.now() - t0) * 1e6) / iters)
  }
  samples.sort((a, b) => a - b)
  return { min: samples[0], med: samples[Math.floor(samples.length / 2)] }
}

const WEEK = 400
const WINDOW = ECONOMY.condition.rivalFatigueWindowWeeks

/** `rows` ledger rows spread over the fatigue window, across 199 rivals and every rung – the shape
 *  `rivalConditions` walks. Deterministic (no RNG): the row count is the variable under study. */
function ledger(rows: number): SeasonResult[] {
  const out: SeasonResult[] = []
  for (let i = 0; i < rows; i++) {
    const tier = TIER_LADDER[i % TIER_LADDER.length] as TierId
    const points = TIERS[tier].points[i % TIERS[tier].points.length]
    out.push({ playerId: `ai-${i % 199}`, week: WEEK - (i % WINDOW), points, tier })
  }
  return out
}

const oneRow: SeasonResult = { playerId: 'ai-x', week: WEEK - 2, points: TIERS.w35.points[0], tier: 'w35' }

console.log(`arm: ${arm()}`)
console.log(`node ${process.version}, loadavg before ${loadavg().map((n: number) => n.toFixed(2)).join(' ')}`)
console.log(`window ${WINDOW} weeks, ${Object.keys(TIERS).length} tiers`)

// --- HOT PATH ---------------------------------------------------------------------------------
reconstructRun(oneRow) // warm
const hotIters = 20_000
const hot = timePerCall(hotIters, 7, () => {
  reconstructRun(oneRow)
})
console.log(`HOT reconstructRun  ${hotIters} iters x7   min ${hot.min.toFixed(0)} ns/call   med ${hot.med.toFixed(0)} ns/call`)

// --- FIELD ------------------------------------------------------------------------------------
for (const rows of [200, 1400, 5000]) {
  const results = ledger(rows)
  rivalConditions(results, WEEK) // warm
  const iters = rows >= 5000 ? 20 : rows >= 1400 ? 60 : 200
  const field = timePerCall(iters, 7, () => {
    rivalConditions(results, WEEK)
  })
  console.log(
    `FIELD rivalConditions ${String(rows).padStart(4)} rows  ${String(iters).padStart(3)} iters x7   ` +
      `min ${(field.min / 1e6).toFixed(3)} ms/call   med ${(field.med / 1e6).toFixed(3)} ms/call`,
  )
}
console.log(`loadavg after ${loadavg().map((n: number) => n.toFixed(2)).join(' ')}`)
