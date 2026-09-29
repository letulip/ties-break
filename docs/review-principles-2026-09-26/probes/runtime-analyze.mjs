// Phase 0b – folds the runtime-career.ts JSON outputs into the §B tables (principles review 26.09,
// baseline 03d92221). Pure node, no repo imports.
//   node docs/review-principles-2026-09-26/probes/runtime-analyze.mjs <rawDir> <runTag>
// reads <rawDir>/career-<seed>-<runTag>-{full,bare}.json (runTag '' reads the untagged first run).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
const tag = process.argv[3] ?? 'r2'
const suffix = tag === '' ? '' : `-${tag}`
const re = new RegExp(`^career-([a-z]+[0-9])${suffix}-full\\.json$`)
const seeds = readdirSync(dir).map((f) => f.match(re)?.[1]).filter(Boolean).sort()

const q = (xs, p) => {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]
}
const med = (xs) => q(xs, 0.5)
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '–')
const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : '–')
const kb = (n) => (Number.isFinite(n) ? (n / 1024).toFixed(1) : '–')
const spread = (xs, fmt = f1) => (xs.length ? `${fmt(med(xs))} (${fmt(Math.min(...xs))}–${fmt(Math.max(...xs))})` : '–')

const runs = seeds.map((s) => ({
  seed: s,
  full: JSON.parse(readFileSync(join(dir, `career-${s}${suffix}-full.json`), 'utf8')),
  bare: JSON.parse(readFileSync(join(dir, `career-${s}${suffix}-bare.json`), 'utf8')),
}))

console.log(`## careers (${tag || 'r1'})`)
for (const r of runs) {
  console.log(`${r.full.seed}\t${r.full.preset}\tending ${r.full.ending?.type} w${r.full.finalWeek} age ${r.full.ending?.ageYears}\thash full ${r.full.worldHash} bare ${r.bare.worldHash}\twalk full ${r.full.walkMs} bare ${r.bare.walkMs} ms`)
}

function windowsFor(end) {
  const w = [['early 1–100', 1, 100]]
  if (end >= 250) w.push(['~200: 151–250', 151, 250])
  if (end >= 400) {
    const c = Math.round(end / 2)
    w.push([`mid ${c - 49}–${c + 50}`, c - 49, c + 50])
  }
  if (end >= 850) w.push(['~800: 751–850', 751, 850])
  if (end >= 1650) w.push(['~1600: 1551–1650', 1551, 1650])
  if (end >= 250) w.push([`late ${end - 99}–${end}`, end - 99, end])
  return w
}
const WINDOW_KEYS = ['early', '~200', 'mid', '~800', '~1600', 'late']
const agg = {}
for (const r of runs) {
  for (const [label, a, b] of windowsFor(r.full.finalWeek)) {
    const key = WINDOW_KEYS.find((k) => label.startsWith(k))
    const bare = r.bare.rows.filter((x) => x.week >= a && x.week <= b)
    const full = r.full.rows.filter((x) => x.week >= a && x.week <= b)
    const o = (agg[key] ??= { seeds: 0, labels: new Set(), bareStepMed: [], bareWps: [], stepP95: [], fullWps: [], clone: [], encode: [], snap: [], snapP95: [], snapWarm: [], snapWarmP95: [], miss: [], payload: [], snapJson: [], snapV8: [], snapJsonMax: [] })
    o.seeds++
    o.labels.add(label)
    const steps = bare.map((x) => x.stepMs)
    o.bareStepMed.push(med(steps))
    o.stepP95.push(q(steps, 0.95))
    o.bareWps.push((1000 * bare.length) / bare.reduce((n, x) => n + x.stepMs + x.resolveMs, 0))
    o.fullWps.push((1000 * full.length) / full.reduce((n, x) => n + x.stepMs + x.resolveMs + x.cloneMs + x.encodeMs + x.snapMs, 0))
    o.clone.push(med(full.map((x) => x.cloneMs)))
    o.encode.push(med(full.map((x) => x.encodeMs)))
    o.snap.push(med(full.map((x) => x.snapMs)))
    o.snapP95.push(q(full.map((x) => x.snapMs), 0.95))
    o.snapWarm.push(med(full.map((x) => x.snapWarmMs)))
    o.snapWarmP95.push(q(full.map((x) => x.snapWarmMs), 0.95))
    o.miss.push(med(full.map((x) => x.snapMiss)))
    o.payload.push(med(full.map((x) => x.payloadBytes)))
    o.snapJson.push(med(full.map((x) => x.snapJsonBytes)))
    o.snapJsonMax.push(Math.max(...full.map((x) => x.snapJsonBytes)))
    o.snapV8.push(med(full.map((x) => x.snapV8Bytes)))
  }
}
console.log('\n## throughput per window: value = median across seeds (min–max across seeds)')
console.log('window | seeds | stepCareerWeek med ms (bare) | step p95 ms | weeks/s bare (step+resolve) | weeks/s worker path (step+resolve+clone+encode+snapshot)')
for (const k of WINDOW_KEYS) {
  const o = agg[k]
  if (!o) continue
  console.log(`${[...o.labels].join(' / ')} | ${o.seeds} | ${spread(o.bareStepMed, f2)} | ${spread(o.stepP95, f2)} | ${spread(o.bareWps, (n) => n.toFixed(0))} | ${spread(o.fullWps, (n) => n.toFixed(0))}`)
}
console.log('\n## per-command cost per window (full run): medians across seeds of per-seed window medians')
console.log('window | structuredClone(world) ms | compressWorld ms | toSnapshot after advance med / p95 ms | memo misses | toSnapshot next same-week command med / p95 ms')
for (const k of WINDOW_KEYS) {
  const o = agg[k]
  if (!o) continue
  console.log(`${k} | ${spread(o.clone, f2)} | ${spread(o.encode, f2)} | ${spread(o.snap)} / ${spread(o.snapP95)} | ${spread(o.miss, (n) => n.toFixed(0))} | ${spread(o.snapWarm)} / ${spread(o.snapWarmP95)}`)
}
console.log('\n## message + save size per window (medians of per-seed window medians, KiB)')
console.log('window | snapshot JSON KiB | snapshot v8 KiB | snapshot JSON max KiB | autosave payload KiB')
for (const k of WINDOW_KEYS) {
  const o = agg[k]
  if (!o) continue
  console.log(`${k} | ${spread(o.snapJson, kb)} | ${spread(o.snapV8, kb)} | ${spread(o.snapJsonMax, kb)} | ${spread(o.payload, kb)}`)
}

// checkpoints
const CP = ['w100', 'w200', 'w400', 'w800', 'w1200', 'end']
const cpOf = (r, label) => r.full.checkpoints.find((c) => (label === 'end' ? c.label.startsWith('end') : c.label === label))
console.log('\n## checkpoints: median across seeds (min–max); n = seeds reaching it')
console.log('checkpoint | n | world JSON KiB | world v8 KiB | stored payload KiB | compressWorld ms | decompressWorld ms | refreshDerivedRankCaches ms | structuredClone(world) ms | toSnapshot warm memo-on med/p95 | memo-off med/p95 | snapshot JSON KiB | snapshot v8 KiB | structuredClone(snapshot) ms')
for (const label of CP) {
  const cs = runs.map((r) => cpOf(r, label)).filter(Boolean)
  if (label === 'end') cs.splice(0, cs.length, ...runs.filter((r) => r.full.finalWeek > 1000).map((r) => cpOf(r, 'end')))
  if (!cs.length) continue
  const g = (fn, fmt = f1) => spread(cs.map(fn), fmt)
  console.log(`${label}${label === 'end' ? ' (long careers)' : ''} | ${cs.length} | ${g((c) => c.worldJsonBytes, kb)} | ${g((c) => c.worldV8Bytes, kb)} | ${g((c) => c.storedPayloadBytes, kb)} | ${g((c) => c.compressWorldX10.med, f2)} | ${g((c) => c.decompressWorldX10.med, f2)} | ${g((c) => c.refreshDerivedRankCachesX10.med, f2)} | ${g((c) => c.structuredCloneWorld.med, f2)} | ${g((c) => c.toSnapshotX100.med, f2)} / ${g((c) => c.toSnapshotX100.p95, f2)} | ${g((c) => c.toSnapshotCacheOffX100.med, f2)} / ${g((c) => c.toSnapshotCacheOffX100.p95, f2)} | ${g((c) => c.snapshotJsonBytes, kb)} | ${g((c) => c.snapshotV8Bytes, kb)} | ${g((c) => c.structuredCloneSnapshot.med, f2)}`)
}
const short = runs.filter((r) => r.full.finalWeek <= 1000)
for (const r of short) {
  const c = cpOf(r, 'end')
  console.log(`short career ${r.full.seed} end w${c.week} (${c.label}): world ${kb(c.worldJsonBytes)} KiB, stored ${kb(c.storedPayloadBytes)} KiB, snapshot ${kb(c.snapshotJsonBytes)} KiB`)
}

// growth census: arrays whose length only grows across the checkpoints of every long career
console.log('\n## growth census (long careers): array paths, median len / KiB at each checkpoint')
const long = runs.filter((r) => r.full.finalWeek > 1000)
const paths = new Set()
for (const r of long) for (const c of r.full.checkpoints) for (const p of Object.keys(c.census)) paths.add(p)
const rowsOut = []
for (const p of paths) {
  let mono = true
  let grew = true
  for (const r of long) {
    const seq = CP.map((l) => cpOf(r, l)?.census[p]?.len ?? 0)
    for (let i = 1; i < seq.length; i++) if (seq[i] < seq[i - 1]) mono = false
    if (seq[seq.length - 1] <= seq[0]) grew = false
  }
  const at = (l, k) => med(long.map((r) => cpOf(r, l)?.census[p]?.[k] ?? 0))
  rowsOut.push({ p, mono, grew, endBytes: at('end', 'bytes'), cells: CP.map((l) => `${at(l, 'len')} / ${kb(at(l, 'bytes'))}`) })
}
rowsOut.sort((a, b) => b.endBytes - a.endBytes)
console.log(`path | only grows | ${CP.join(' | ')}`)
for (const r of rowsOut.filter((x) => x.endBytes >= 300 || (x.mono && x.grew))) {
  console.log(`${r.p} | ${r.mono && r.grew ? 'yes' : r.grew ? 'grows, not monotone' : 'no'} | ${r.cells.join(' | ')}`)
}

console.log('\n## world top-level fields at end (long careers, median KiB) and at w100')
const wf = {}
for (const r of long) for (const l of ['w100', 'end']) for (const f of cpOf(r, l).worldFields) ((wf[f.key] ??= { w100: [], end: [] })[l]).push(f.bytes)
Object.entries(wf).sort((a, b) => med(b[1].end) - med(a[1].end)).slice(0, 15).forEach(([k, v]) => console.log(`${k} | ${kb(med(v.w100))} | ${kb(med(v.end))}`))

console.log('\n## snapshot top-level fields at w100 and end (long careers, median KiB, median len)')
const sf = {}
for (const r of long) for (const l of ['w100', 'end']) for (const f of cpOf(r, l).snapshotFields) ((sf[f.key] ??= { w100: [], end: [], lenEnd: [], len100: [] })[l]).push(f.bytes), l === 'end' ? sf[f.key].lenEnd.push(f.len ?? NaN) : sf[f.key].len100.push(f.len ?? NaN)
Object.entries(sf).sort((a, b) => med(b[1].end) - med(a[1].end)).slice(0, 14).forEach(([k, v]) => console.log(`${k} | ${kb(med(v.w100))} (${med(v.len100)}) | ${kb(med(v.end))} (${med(v.lenEnd)})`))

console.log('\n## heap (MB, process heapUsed after gc; includes vite-node and the loaded module graph)')
for (const r of runs) {
  const f = r.full
  const b = r.bare
  console.log(`${f.seed} w${f.finalWeek} | full: warm ${f.heapUsedBeforeMB} -> end ${f.heapUsedAfterMB} -> memo cleared ${f.heapUsedAfterMemoClearedMB ?? '–'} -> world dropped ${f.heapUsedAfterDroppingWorldMB} | bare: ${b.heapUsedBeforeMB} -> ${b.heapUsedAfterMB} -> ${b.heapUsedAfterMemoClearedMB ?? '–'} -> ${b.heapUsedAfterDroppingWorldMB}`)
}
