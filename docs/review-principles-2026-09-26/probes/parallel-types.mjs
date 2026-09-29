#!/usr/bin/env node
// Lane F probe – two declarations of one shape (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repo root): node docs/review-principles-2026-09-26/probes/parallel-types.mjs
// Parses the listed TypeScript files with the repo's own `typescript` package, reads the members of
// each named type (an interface, a type literal on a property of an interface, or the object-literal
// RETURN TYPE of an exported function), and prints, per pair, the members both declare, the members
// only one side declares, and – for the shared members – whether the two type texts are identical.
// Also counts, in src/engine/diary.ts, the `x: view.x` pass-through lines for the shared members.
// Pure read.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require(process.cwd() + '/node_modules/typescript')

function sourceOf(path) {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
}
function membersOf(node, sf) {
  const out = new Map()
  for (const m of node.members ?? []) {
    if (!ts.isPropertySignature(m) || !m.name) continue
    out.set(m.name.getText(sf), { type: m.type ? m.type.getText(sf).replace(/\s+/g, ' ') : '?', optional: Boolean(m.questionToken) })
  }
  return out
}
function find(path, spec) {
  const sf = sourceOf(path)
  let hit = null
  const visit = (n) => {
    if (hit) return
    if (spec.interface && ts.isInterfaceDeclaration(n) && n.name.text === spec.interface) {
      if (!spec.prop) hit = membersOf(n, sf)
      else for (const m of n.members) if (ts.isPropertySignature(m) && m.name?.getText(sf) === spec.prop && m.type && ts.isTypeLiteralNode(m.type)) hit = membersOf(m.type, sf)
    }
    if (spec.fnReturn && ts.isFunctionDeclaration(n) && n.name?.text === spec.fnReturn && n.type && ts.isTypeLiteralNode(n.type)) hit = membersOf(n.type, sf)
    ts.forEachChild(n, visit)
  }
  visit(sf)
  if (!hit) throw new Error(`not found: ${path} ${JSON.stringify(spec)}`)
  return hit
}

const PAIRS = [
  ['DiaryWorldView (engine) vs DiaryFacts (protocol)', ['src/engine/diary/facts.ts', { interface: 'DiaryWorldView' }], ['src/shared/protocol/narrative.ts', { interface: 'DiaryFacts' }]],
  ['coachBilling() return vs Snapshot.coachBilling', ['src/engine/world/coachMarket.ts', { fnReturn: 'coachBilling' }], ['src/shared/protocol/snapshot.ts', { interface: 'Snapshot', prop: 'coachBilling' }]],
  ['coachEdgeView() return vs Snapshot.coachEdge', ['src/engine/world/coachMarket.ts', { fnReturn: 'coachEdgeView' }], ['src/shared/protocol/snapshot.ts', { interface: 'Snapshot', prop: 'coachEdge' }]],
  ['ShopItem (engine) vs ShopRowView (protocol)', ['src/engine/world/assets.ts', { interface: 'ShopItem' }], ['src/shared/protocol/offers.ts', { interface: 'ShopRowView' }]],
]
for (const [label, [pa, sa], [pb, sb]] of PAIRS) {
  let a, b
  try { a = find(pa, sa); b = find(pb, sb) } catch (e) { console.log(`${label}: ${e.message}`); continue }
  const shared = [...a.keys()].filter((k) => b.has(k))
  const sameType = shared.filter((k) => a.get(k).type === b.get(k).type)
  console.log(`\n${label}`)
  console.log(`  members: ${a.size} vs ${b.size}; declared on both sides: ${shared.length} (identical type text: ${sameType.length})`)
  console.log(`  only left:  ${[...a.keys()].filter((k) => !b.has(k)).join(', ') || '–'}`)
  console.log(`  only right: ${[...b.keys()].filter((k) => !a.has(k)).join(', ') || '–'}`)
  const differ = shared.filter((k) => a.get(k).type !== b.get(k).type)
  if (differ.length) console.log(`  shared, different type text: ${differ.map((k) => `${k} (${a.get(k).type} | ${b.get(k).type})`).join('; ')}`)
  if (label.startsWith('DiaryWorldView')) {
    const diary = readFileSync('src/engine/diary.ts', 'utf8')
    const pass = shared.filter((k) => new RegExp(String.raw`^\s+${k}: view\.${k},?\s*$`, 'm').test(diary))
    console.log(`  src/engine/diary.ts carries a one-to-one \`k: view.k\` line for ${pass.length} of the ${shared.length} shared members`)
  }
}
