/**
 * Phase 0b probe – the engine runtime along one whole career (principles review 26.09, baseline 03d92221).
 *
 * Drives the SAME entry points the worker drives on every command, in the worker's order
 * (src/worker/sim.worker.ts `mutate`): structuredClone(world) -> the command -> compressWorld (the
 * autosave's encode, src/db/saves.ts runAutosaveTx) -> toSnapshot. The week itself is the benches'
 * driver `stepCareerWeek` (tools/econ-bench.ts, policy POLICIES[1] 'player' – the e2e fixtures'
 * policy), with open questions answered the way tools/e2e-fixtures.ts `answerOpenQuestions` does
 * (drain life beats, fork 'continue', retirement only when final) plus the neutral birthday gift
 * (tools/_birthday.ts). The IndexedDB put itself is not reachable from node and is not measured.
 *
 * Usage (from the tb-review worktree root):
 *   node --expose-gc node_modules/vite-node/vite-node.mjs \
 *     docs/review-principles-2026-09-26/probes/runtime-career.ts -- <presetIdx> <careerIdx> <mode> <out.json> [capWeeks]
 * mode: 'full'  – tick + clone + encode + snapshot every week, checkpoint batteries
 *       'bare'  – tick only (engine throughput without the per-command work interleaved)
 * A throwaway warm-up career (preset 0, index 99, 104 weeks, same per-week work as the mode) runs
 * first in the same process, so JIT warm-up is not charged to the measured career's early window.
 */
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import v8 from 'node:v8'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import {
  answerFork,
  answerRetirement,
  pendingBirthday,
  toSnapshot,
  refreshDerivedRankCaches,
  type WorldState,
} from '../../../src/engine/world'
import { compressWorld, decompressWorld } from '../../../src/engine/saveCodec'
import { clearDerivedCache, derivedCacheStats, resetDerivedCacheStats } from '../../../src/engine/world/derivedCache'
import type { Rng } from '../../../src/engine/rng'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const PRESET = Number(argv[0] ?? 5)
const INDEX = Number(argv[1] ?? 0)
const MODE = (argv[2] ?? 'full') as 'full' | 'bare'
const OUT = argv[3] ?? 'runtime-career.json'
const CAP = Number(argv[4] ?? 2600)
const PLAYER = POLICIES[1]
const CHECKPOINTS = new Set([100, 200, 400, 800, 1200, 1600])

const now = (): number => performance.now()
const utf8 = (s: string): number => Buffer.byteLength(s, 'utf8')
const quant = (xs: number[], q: number): number => {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]
}
const r3 = (n: number): number => Math.round(n * 1000) / 1000

function resolveOpen(world: WorldState): void {
  if (world.ending !== null) return
  drainLifeBeats(world)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}

/** Every array (and every object's key count) down to depth 3 – the growth census. */
function census(root: unknown): Record<string, { len: number; bytes: number }> {
  const out: Record<string, { len: number; bytes: number }> = {}
  const visit = (v: unknown, path: string, depth: number): void => {
    if (v === null || typeof v !== 'object') return
    if (Array.isArray(v)) {
      out[path] = { len: v.length, bytes: utf8(JSON.stringify(v)) }
      return
    }
    if (depth >= 3) return
    for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
      if (child !== null && typeof child === 'object') visit(child, path === '' ? k : `${path}.${k}`, depth + 1)
    }
  }
  visit(root, '', 0)
  return out
}

function topFields(obj: Record<string, unknown>): { key: string; bytes: number; len: number | null }[] {
  return Object.entries(obj)
    .map(([key, v]) => ({
      key,
      bytes: v === undefined ? 0 : utf8(JSON.stringify(v) ?? ''),
      len: Array.isArray(v) ? v.length : null,
    }))
    .sort((a, b) => b.bytes - a.bytes)
}

interface WeekRow {
  week: number
  stepMs: number
  resolveMs: number
  cloneMs?: number
  encodeMs?: number
  snapMs?: number
  snapMiss?: number
  snapHit?: number
  snapWarmMs?: number
  payloadBytes?: number
  snapJsonBytes?: number
  snapV8Bytes?: number
}

async function perCommand(world: WorldState, row: WeekRow): Promise<void> {
  let t = now()
  structuredClone(world)
  row.cloneMs = r3(now() - t)
  t = now()
  const { payload } = await compressWorld(world)
  row.encodeMs = r3(now() - t)
  row.payloadBytes = payload.byteLength
  resetDerivedCacheStats()
  t = now()
  const snap = toSnapshot(world)
  row.snapMs = r3(now() - t)
  const st = derivedCacheStats()
  row.snapMiss = st.ranking.miss + st.preview.miss + st.rated.miss
  row.snapHit = st.ranking.hit + st.preview.hit + st.rated.hit
  // the NEXT command in the same week (setPlan, enterEvent…): mutate clones, then toSnapshot again
  const clone = structuredClone(world)
  t = now()
  toSnapshot(clone)
  row.snapWarmMs = r3(now() - t)
  row.snapJsonBytes = utf8(JSON.stringify(snap))
  row.snapV8Bytes = v8.serialize(snap).byteLength
}

async function battery(world: WorldState, label: string): Promise<Record<string, unknown>> {
  // toSnapshot warmed x100 – the 05.09 method (04-performance.md §B: "toSnapshot alone, warmed")
  for (let i = 0; i < 5; i++) toSnapshot(world)
  const snapTimes: number[] = []
  for (let i = 0; i < 100; i++) {
    const t = now()
    toSnapshot(world)
    snapTimes.push(now() - t)
  }
  // the same x100, with the Wave A derived-table memo switched off (TB_SNAPSHOT_CACHE=off, read per
  // call by derivedCache.ts snapshotCacheEnabled) – the full derivation 05.09 measured at 13.04 ms
  const prevEnv = process.env.TB_SNAPSHOT_CACHE
  process.env.TB_SNAPSHOT_CACHE = 'off'
  for (let i = 0; i < 5; i++) toSnapshot(world)
  const snapOffTimes: number[] = []
  for (let i = 0; i < 100; i++) {
    const t = now()
    toSnapshot(world)
    snapOffTimes.push(now() - t)
  }
  if (prevEnv === undefined) delete process.env.TB_SNAPSHOT_CACHE
  else process.env.TB_SNAPSHOT_CACHE = prevEnv
  const snap = toSnapshot(world)
  const snapJson = JSON.stringify(snap)
  const snapV8 = v8.serialize(snap)
  const scTimes: number[] = []
  for (let i = 0; i < 20; i++) {
    const t = now()
    structuredClone(snap)
    scTimes.push(now() - t)
  }
  const worldJson = JSON.stringify(world)
  const encTimes: number[] = []
  const decTimes: number[] = []
  const refreshTimes: number[] = []
  let payloadBytes = 0
  for (let i = 0; i < 10; i++) {
    let t = now()
    const { payload, checksum } = await compressWorld(world)
    encTimes.push(now() - t)
    payloadBytes = payload.byteLength
    t = now()
    const loaded = await decompressWorld(payload, checksum)
    decTimes.push(now() - t)
    t = now()
    refreshDerivedRankCaches(loaded)
    refreshTimes.push(now() - t)
  }
  const wcTimes: number[] = []
  for (let i = 0; i < 20; i++) {
    const t = now()
    structuredClone(world)
    wcTimes.push(now() - t)
  }
  const stat = (xs: number[]) => ({ med: r3(quant(xs, 0.5)), p95: r3(quant(xs, 0.95)), max: r3(Math.max(...xs)), n: xs.length })
  return {
    label,
    week: world.week,
    ended: world.ending?.type ?? null,
    toSnapshotX100: stat(snapTimes),
    toSnapshotCacheOffX100: stat(snapOffTimes),
    snapshotJsonBytes: utf8(snapJson),
    snapshotV8Bytes: snapV8.byteLength,
    snapshotTopLevelKeys: Object.keys(snap).length,
    structuredCloneSnapshot: stat(scTimes),
    snapshotFields: topFields(snap as unknown as Record<string, unknown>).slice(0, 12),
    worldJsonBytes: utf8(worldJson),
    worldV8Bytes: v8.serialize(world).byteLength,
    worldTopLevelKeys: Object.keys(world).length,
    storedPayloadBytes: payloadBytes,
    storedRecordBytes: payloadBytes + 32, // payload + sha256 checksum, the two Uint8Arrays of a SaveRecord
    exportFileBytes: payloadBytes + 44, // saveCodec HEADER_BYTES
    compressWorldX10: stat(encTimes),
    decompressWorldX10: stat(decTimes),
    refreshDerivedRankCachesX10: stat(refreshTimes),
    structuredCloneWorld: stat(wcTimes),
    worldFields: topFields(world as unknown as Record<string, unknown>).slice(0, 15),
    census: census(world),
  }
}

async function walk(world: WorldState, rng: Rng, weeks: number, rows: WeekRow[] | null, checkpoints: Record<string, unknown>[] | null): Promise<void> {
  for (let i = 0; i < weeks && world.ending === null; i++) {
    const row: WeekRow = { week: 0, stepMs: 0, resolveMs: 0 }
    let t = now()
    stepCareerWeek(world, rng, PLAYER)
    row.stepMs = r3(now() - t)
    t = now()
    resolveOpen(world)
    row.resolveMs = r3(now() - t)
    row.week = world.week
    if (MODE === 'full') await perCommand(world, row)
    if (rows) rows.push(row)
    if (checkpoints && MODE === 'full' && (CHECKPOINTS.has(world.week) || world.ending !== null)) {
      checkpoints.push(await battery(world, world.ending !== null ? `end (${world.ending.type})` : `w${world.week}`))
    }
  }
}

async function main(): Promise<void> {
  const t0 = now()
  const warm = openCareer(PRESETS[0], 99, PLAYER)
  await walk(warm.world, warm.rng, 104, null, null)
  const warmMs = now() - t0

  const gc = (): void => (globalThis as { gc?: () => void }).gc?.()
  gc()
  const heapBefore = process.memoryUsage().heapUsed

  const opened = openCareer(PRESETS[PRESET], INDEX, PLAYER)
  const holder: { world: WorldState | null } = { world: opened.world }
  const { rng, seed } = opened
  const rows: WeekRow[] = []
  const checkpoints: Record<string, unknown>[] = []
  const tWalk = now()
  await walk(holder.world!, rng, CAP, rows, checkpoints)
  const walkMs = now() - tWalk

  const world = holder.world!
  const worldHash = createHash('sha256').update(JSON.stringify(world)).digest('hex').slice(0, 16)
  const finalWeek = world.week
  const ending = world.ending ? { type: world.ending.type, week: world.ending.week, ageYears: world.ending.ageYears } : null
  gc()
  const heapAfter = process.memoryUsage().heapUsed
  // the Wave A memo can hold rows that point into the world – empty it so the drop below frees the world
  clearDerivedCache()
  gc()
  const heapAfterMemoCleared = process.memoryUsage().heapUsed
  // retained size of the world itself: drop every reference we hold and collect again
  holder.world = null
  ;(opened as { world: WorldState | null }).world = null
  gc()
  const heapWithoutWorld = process.memoryUsage().heapUsed

  const out = {
    probe: 'runtime-career.ts',
    sha: '03d92221',
    node: process.version,
    mode: MODE,
    preset: PRESETS[PRESET].label,
    seed,
    policy: 'POLICIES[1] player',
    capWeeks: CAP,
    finalWeek,
    ending,
    warmupMs: Math.round(warmMs),
    walkMs: Math.round(walkMs),
    heapUsedBeforeMB: r3(heapBefore / 1048576),
    heapUsedAfterMB: r3(heapAfter / 1048576),
    heapUsedAfterMemoClearedMB: r3(heapAfterMemoCleared / 1048576),
    heapUsedAfterDroppingWorldMB: r3(heapWithoutWorld / 1048576),
    gcExposed: typeof (globalThis as { gc?: unknown }).gc === 'function',
    worldHash,
    rows,
    checkpoints,
  }
  writeFileSync(OUT, JSON.stringify(out))
  console.log(
    `${seed} ${MODE}: ended ${ending?.type ?? 'no'} at week ${finalWeek}; walk ${out.walkMs} ms; heap ${out.heapUsedBeforeMB} -> ${out.heapUsedAfterMB} (without world ${out.heapUsedAfterDroppingWorldMB}) MB; hash ${worldHash}`,
  )
}

void main().then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
