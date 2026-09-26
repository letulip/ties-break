/**
 * Phase 0b probe – the 05.09 method re-run on the committed e2e careers (principles review 26.09,
 * baseline 03d92221), so today's toSnapshot number is comparable with 05.09's 13.04 ms
 * (docs/review-principles-2026-09-05/04-performance.md §B: "toSnapshot alone, warmed, x200", pro fixture).
 *
 * Each fixture is read the way the worker's `importSave` reads a file (`decodeExportFile`, which
 * verifies, gunzips, guards and runs `migrateSave`), then `refreshDerivedRankCaches` as
 * `ensureMainState` does on every load. Measured per fixture:
 *   - toSnapshot, first call after the load with the Wave A memo emptied (the loadCareer reply);
 *   - toSnapshot warmed x200, memo on (the path every same-week command now takes);
 *   - toSnapshot warmed x200, TB_SNAPSHOT_CACHE=off (the full derivation – the 05.09-comparable arm);
 *   - snapshot JSON / structured-clone (v8.serialize) bytes, top-level fields, structuredClone(snapshot);
 *   - world JSON / v8 bytes, compressWorld x10 (autosave encode), decompressWorld x10 (load decode).
 *
 * Usage (from the tb-review worktree root):
 *   npx vite-node docs/review-principles-2026-09-26/probes/runtime-fixtures.ts -- <out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import v8 from 'node:v8'
import { toSnapshot, refreshDerivedRankCaches } from '../../../src/engine/world'
import { compressWorld, decompressWorld, decodeExportFile } from '../../../src/engine/saveCodec'
import { clearDerivedCache } from '../../../src/engine/world/derivedCache'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const OUT = argv[0] ?? 'runtime-fixtures.json'
const FIXTURES = ['fresh', 'junior', 'pro', 'engaged', 'expecting', 'parting']

const now = (): number => performance.now()
const utf8 = (s: string): number => Buffer.byteLength(s, 'utf8')
const r3 = (n: number): number => Math.round(n * 1000) / 1000
const quant = (xs: number[], q: number): number => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]
}
const stat = (xs: number[]) => ({ med: r3(quant(xs, 0.5)), p95: r3(quant(xs, 0.95)), max: r3(Math.max(...xs)), n: xs.length })

function timed(n: number, fn: () => void): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = now()
    fn()
    out.push(now() - t)
  }
  return out
}

async function main(): Promise<void> {
  const results: Record<string, unknown>[] = []
  for (const name of FIXTURES) {
    const bytes = new Uint8Array(readFileSync(`e2e/fixtures/${name}.tsave`))
    let t = now()
    const world = await decodeExportFile(bytes)
    const importMs = now() - t
    t = now()
    refreshDerivedRankCaches(world)
    const refreshMs = now() - t

    clearDerivedCache()
    t = now()
    toSnapshot(world)
    const firstMs = now() - t

    for (let i = 0; i < 10; i++) toSnapshot(world)
    const warmOn = timed(200, () => toSnapshot(world))

    process.env.TB_SNAPSHOT_CACHE = 'off'
    for (let i = 0; i < 10; i++) toSnapshot(world)
    const warmOff = timed(200, () => toSnapshot(world))
    delete process.env.TB_SNAPSHOT_CACHE

    const snap = toSnapshot(world)
    const snapJson = JSON.stringify(snap)
    const snapClone = timed(100, () => structuredClone(snap))
    const worldClone = timed(50, () => structuredClone(world))

    const enc: number[] = []
    const dec: number[] = []
    let payloadBytes = 0
    for (let i = 0; i < 10; i++) {
      let t2 = now()
      const { payload, checksum } = await compressWorld(world)
      enc.push(now() - t2)
      payloadBytes = payload.byteLength
      t2 = now()
      await decompressWorld(payload, checksum)
      dec.push(now() - t2)
    }
    const fields = Object.entries(snap as unknown as Record<string, unknown>)
      .map(([key, v]) => ({ key, bytes: v === undefined ? 0 : utf8(JSON.stringify(v) ?? ''), len: Array.isArray(v) ? v.length : null }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10)
    const row = {
      fixture: name,
      week: world.week,
      fileBytes: bytes.byteLength,
      importMs: r3(importMs),
      refreshDerivedRankCachesMs: r3(refreshMs),
      toSnapshotFirstAfterLoadMs: r3(firstMs),
      toSnapshotWarmMemoOnX200: stat(warmOn),
      toSnapshotWarmMemoOffX200: stat(warmOff),
      snapshotJsonBytes: utf8(snapJson),
      snapshotV8Bytes: v8.serialize(snap).byteLength,
      snapshotTopLevelKeys: Object.keys(snap).length,
      structuredCloneSnapshot: stat(snapClone),
      snapshotFields: fields,
      worldJsonBytes: utf8(JSON.stringify(world)),
      worldV8Bytes: v8.serialize(world).byteLength,
      structuredCloneWorld: stat(worldClone),
      storedPayloadBytes: payloadBytes,
      compressWorldX10: stat(enc),
      decompressWorldX10: stat(dec),
    }
    results.push(row)
    console.log(
      `${name} w${world.week}: first ${row.toSnapshotFirstAfterLoadMs} ms; warm on ${row.toSnapshotWarmMemoOnX200.med} / off ${row.toSnapshotWarmMemoOffX200.med} (p95 ${row.toSnapshotWarmMemoOffX200.p95}); snap ${row.snapshotJsonBytes} B json, ${row.snapshotV8Bytes} B v8; world ${row.worldJsonBytes} B -> ${payloadBytes} B stored`,
    )
  }
  writeFileSync(OUT, JSON.stringify({ probe: 'runtime-fixtures.ts', sha: '03d92221', node: process.version, results }))
}

void main().then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
