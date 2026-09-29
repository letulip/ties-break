// Lane C probe – hand-mirrored tables inside ECONOMY (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the root of the baseline worktree): npx vite-node docs/review-principles-2026-09-26/probes/economy-mirrors.ts
//
// METHOD. Walk the live ECONOMY object (imported, so every computed value – `8 + 31`, `0.03 / 52` – is the
// value the engine sees). For every BRANCH (plain object or array) collect its direct numeric leaves in
// declaration order as a VECTOR. Two branches are a MIRROR CANDIDATE when their vectors have length ≥ 3 and are
// identical (exact ===, same order). Separately, every pair of whole SUBTREES that serialise identically
// (JSON.stringify, length ≥ 3 leaves) is listed – that is a table copied under another key. Arrays of numbers
// count as one leaf each (their vector is their own elements). Keys are ignored for the vector test on
// purpose: a mirror written under new names (the divorce block) has different keys and the same numbers.
import { ECONOMY } from '../../../src/engine/economy'

type Row = { path: string; vec: number[]; json: string; leaves: number }
const rows: Row[] = []
function leafCount(v: unknown): number {
  if (v === null || typeof v !== 'object') return 1
  return Object.values(v as Record<string, unknown>).reduce<number>((n, x) => n + leafCount(x), 0)
}
function walk(v: unknown, path: string): void {
  if (v === null || typeof v !== 'object') return
  const entries = Object.entries(v as Record<string, unknown>)
  const vec = entries.filter(([, x]) => typeof x === 'number').map(([, x]) => x as number)
  rows.push({ path, vec, json: JSON.stringify(v), leaves: leafCount(v) })
  for (const [k, x] of entries) walk(x, Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`)
}
walk(ECONOMY, 'ECONOMY')

const byVec = new Map<string, string[]>()
for (const r of rows) if (r.vec.length >= 3) { const k = r.vec.join(','); byVec.set(k, [...(byVec.get(k) ?? []), r.path]) }
const byJson = new Map<string, string[]>()
for (const r of rows) if (r.leaves >= 3) byJson.set(r.json, [...(byJson.get(r.json) ?? []), r.path])

console.log(`branches walked: ${rows.length}`)
console.log('\n## identical numeric vectors (length >= 3) across different branches')
for (const [k, ps] of byVec) if (ps.length > 1) console.log(`[${k}]\t${ps.join('  |  ')}`)
console.log('\n## shared contiguous runs (>= 3 numbers, not all equal) between different branches')
const cand = rows.filter((r) => r.vec.length >= 3)
for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
  const a = cand[i].vec, b = cand[j].vec
  if (cand[j].path.startsWith(cand[i].path + '.') || cand[i].path.startsWith(cand[j].path + '.')) continue
  let best = 0, at = -1
  for (let x = 0; x < a.length; x++) for (let y = 0; y < b.length; y++) { let k = 0; while (x + k < a.length && y + k < b.length && a[x + k] === b[y + k]) k++; if (k > best) { best = k; at = x } }
  const run = a.slice(at, at + best)
  if (best >= 3 && new Set(run).size > 1 && (best < a.length || best < b.length)) console.log(`[${run.join(',')}]\t${cand[i].path}  |  ${cand[j].path}`)
}
console.log('\n## whole-subtree identity: same object (===) or a copy?')
const E = ECONOMY as unknown as Record<string, any>
console.log(`wealthCorridor === travelBgFactor: ${E.wealthCorridor === E.travelBgFactor}; wealthCorridor === physio.medicalBgFactor: ${E.wealthCorridor === E.physio.medicalBgFactor}`)
console.log('\n## identical whole subtrees (>= 3 leaves)')
for (const [, ps] of byJson) if (ps.length > 1) console.log(ps.join('  |  '))
