/**
 * Lane G probe (principles review 26.09, baseline 03d92221) – COUNTS ONLY, no timing.
 *
 * Question: Phase 0b measured 36–37 derived-memo misses on every post-advance `toSnapshot`
 * (00-baseline.md §B.3). Which memo do they fall in, and does the week tick itself leave the
 * ranking tables warm for the snapshot that follows it?
 *
 * Driver: the benches' `stepCareerWeek` (tools/econ-bench.ts, policy POLICIES[1] 'player'), the same
 * as runtime-career.ts. At each checkpoint week it records per-memo hit/miss counters
 * (src/engine/world/derivedCache.ts `derivedCacheStats`) for three phases:
 *   tick   – the week itself (stepCareerWeek + answering open questions)
 *   snap   – the first toSnapshot after it (what `mutate` runs after an advance)
 *   next   – toSnapshot on a fresh structuredClone (the next command in the same week)
 * and the snapshot's `upcoming` count, `offers` row count and bytes.
 *
 * Usage (from the tb-review worktree root):
 *   npx vite-node docs/review-principles-2026-09-26/probes/memo-breakdown.ts -- <presetIdx> <careerIdx> <out.json>
 */
import { writeFileSync } from 'node:fs'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { answerFork, answerRetirement, pendingBirthday, toSnapshot, type WorldState } from '../../../src/engine/world'
import { derivedCacheStats, resetDerivedCacheStats } from '../../../src/engine/world/derivedCache'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const PRESET = Number(argv[0] ?? 5)
const INDEX = Number(argv[1] ?? 0)
const OUT = argv[2] ?? 'memo-breakdown.json'
const PLAYER = POLICIES[1]
const CHECK = new Set([50, 100, 200, 400, 600, 800, 1000, 1200])

function resolveOpen(world: WorldState): void {
  if (world.ending !== null) return
  drainLifeBeats(world)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}

const rows: Record<string, unknown>[] = []
const opened = openCareer(PRESETS[PRESET], INDEX, PLAYER)
const holder = opened as unknown as { world: WorldState }
let world = holder.world
for (let w = 0; w < 2600 && world.ending === null; w++) {
  const probe = CHECK.has(world.week + 1)
  if (probe) resetDerivedCacheStats()
  stepCareerWeek(world, opened.rng, PLAYER)
  resolveOpen(world)
  if (!probe) continue
  const tick = derivedCacheStats()
  resetDerivedCacheStats()
  const snap = toSnapshot(world)
  const first = derivedCacheStats()
  resetDerivedCacheStats()
  toSnapshot(structuredClone(world))
  const next = derivedCacheStats()
  rows.push({
    week: world.week,
    tick,
    snap: first,
    next,
    upcoming: snap.upcoming.length,
    offersRows: snap.offers.length,
    offersBytes: Buffer.byteLength(JSON.stringify(snap.offers), 'utf8'),
    snapshotBytes: Buffer.byteLength(JSON.stringify(snap), 'utf8'),
  })
  world = holder.world
}
writeFileSync(OUT, JSON.stringify({ probe: 'memo-breakdown', preset: PRESET, index: INDEX, finalWeek: world.week, rows }, null, 1))
console.log(`memo-breakdown: ${rows.length} checkpoints, final week ${world.week} -> ${OUT}`)
