// Lane A probe (26.09 review, baseline 03d92221). Reads the Phase 0 import graph
// (`import-graph.mjs` output, edges.json) and answers closure / path questions over RUNTIME edges.
// No repo imports; plain node. Usage:
//   node arch-closure.mjs <edges.json> closure <src/file>          – runtime transitive closure (count + lines)
//   node arch-closure.mjs <edges.json> path <src/from> <src/to>    – shortest runtime import path
//   node arch-closure.mjs <edges.json> ui-engine                   – engine/shared/db modules reachable at runtime from any UI file
//   node arch-closure.mjs <edges.json> leaf-up                     – engine ROOT leaves importing world.ts / world/* (runtime and type-only)
//   node arch-closure.mjs <edges.json> typecycle                   – type-only edges whose removal breaks the engine+shared SCC, by target
// Line counts are read from the working tree the command runs in (run from the repo root at the SHA).
import { readFileSync, existsSync } from 'node:fs'

const [, , edgesPath, cmd, a, b] = process.argv
const { edges } = JSON.parse(readFileSync(edgesPath, 'utf8'))
const rt = new Map()
const all = new Map()
for (const e of edges) {
  if (!all.has(e.from)) all.set(e.from, [])
  all.get(e.from).push(e)
  if (e.runtime) {
    if (!rt.has(e.from)) rt.set(e.from, [])
    rt.get(e.from).push(e.to)
  }
}
const lines = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').length : 0)
const layer = (f) => {
  const m = f.match(/^src\/(engine|worker|shared|db|stores|composables|components|prologue|art|audio|viz)\b/)
  if (m) return m[1]
  return f === 'src/pwa.ts' ? 'pwa' : 'other'
}
const UI = new Set(['stores', 'composables', 'components', 'prologue', 'art', 'audio', 'viz', 'pwa', 'other'])
function closure(start) {
  const seen = new Set([start])
  const q = [start]
  while (q.length) {
    const f = q.shift()
    for (const t of rt.get(f) ?? []) if (!seen.has(t)) { seen.add(t); q.push(t) }
  }
  return seen
}
if (cmd === 'closure') {
  const c = closure(a)
  const byLayer = {}
  let total = 0
  for (const f of c) { const l = lines(f); total += l; byLayer[layer(f)] = (byLayer[layer(f)] ?? 0) + 1 }
  console.log(`${a}: runtime closure ${c.size} modules, ${total} lines; by layer ${JSON.stringify(byLayer)}`)
} else if (cmd === 'path') {
  const prev = new Map([[a, null]])
  const q = [a]
  while (q.length) {
    const f = q.shift()
    if (f === b) break
    for (const t of rt.get(f) ?? []) if (!prev.has(t)) { prev.set(t, f); q.push(t) }
  }
  if (!prev.has(b)) { console.log('no runtime path'); process.exit(0) }
  const p = []
  for (let f = b; f; f = prev.get(f)) p.unshift(f)
  console.log(p.join('\n  -> '))
} else if (cmd === 'ui-engine') {
  const reach = new Set()
  for (const f of new Set(edges.map((e) => e.from))) if (UI.has(layer(f))) for (const t of closure(f)) reach.add(t)
  const eng = [...reach].filter((f) => ['engine', 'shared', 'db', 'worker'].includes(layer(f)))
  const rows = eng.map((f) => [f, lines(f)]).sort((x, y) => y[1] - x[1])
  console.log(`engine/shared/db/worker modules reachable at runtime from UI files: ${rows.length}, ${rows.reduce((s, r) => s + r[1], 0)} source lines`)
  for (const [f, l] of rows.slice(0, 40)) console.log(`${l}\t${f}`)
} else if (cmd === 'leaf-up') {
  const leaf = (f) => /^src\/engine\/[^/]+\.ts$/.test(f) && f !== 'src/engine/world.ts'
  const up = (t) => t === 'src/engine/world.ts' || t.startsWith('src/engine/world/')
  const rows = edges.filter((e) => (leaf(e.from) || /^src\/engine\/(season|match|diary)\//.test(e.from)) && up(e.to))
  const rtRows = rows.filter((e) => e.runtime)
  console.log(`engine root/season/match/diary modules importing world.ts or world/*: ${rows.length} edges (${rtRows.length} runtime, ${rows.length - rtRows.length} type-only) from ${new Set(rows.map((e) => e.from)).size} modules`)
  for (const e of rows) console.log(`${e.runtime ? 'RT ' : 'T  '} ${e.from} -> ${e.to}`)
} else if (cmd === 'typecycle') {
  const into = edges.filter((e) => !e.runtime && e.to === 'src/engine/world.ts')
  console.log(`type-only edges into world.ts: ${into.length}`)
  const fromLeaf = into.filter((e) => !e.from.startsWith('src/engine/world/'))
  console.log(`  of which from outside engine/world/: ${fromLeaf.length}`)
  for (const e of fromLeaf) console.log(`  ${e.from}`)
}
