#!/usr/bin/env node
// Lane F probe – numbers that restate ECONOMY outside it (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repo root): node docs/review-principles-2026-09-26/probes/economy-restated.mjs
// 1. Collects the numeric literals on CODE lines of src/engine/economy.ts (comment lines dropped by
//    the §A2 line rules: a line starting with //, /*, * is a comment; block state tracked).
// 2. Collects numeric literals on code lines of every other src .ts file and of the <script> blocks
//    of every .vue file (templates and <style> are skipped – CSS numbers are not economy numbers).
// 3. Intersects the two, dropping "trivial" values that any code uses for its own reasons: integers
//    0..20, 24, 25, 26, 30, 50, 52, 60, 100, 1000, and the fractions 0.5 / 0.25 / 0.75 / 0.1 / 0.2.
// Prints each shared value with the files outside economy.ts that carry it, split engine / UI, so a
// reader can open the sites. A shared value is a LEAD, not a finding: 0.35 can be two unrelated
// numbers. Pure read.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|vue)$/.test(f))
const TRIVIAL = new Set([...Array.from({ length: 21 }, (_, i) => i), 24, 25, 26, 30, 50, 52, 60, 100, 1000, 0.5, 0.25, 0.75, 0.1, 0.2])
const numRe = /(?<![\w.$'"`])(\d[\d_]*(?:\.\d+)?)(?![\w'"`])/g

function codeLines(path) {
  let text = readFileSync(path, 'utf8')
  if (path.endsWith('.vue')) {
    const m = /<script[^>]*>([\s\S]*?)<\/script>/.exec(text)
    text = m ? m[1] : ''
  }
  const out = []
  let inBlock = false
  for (const raw of text.split('\n')) {
    const t = raw.trim()
    if (inBlock) { if (t.includes('*/')) inBlock = false; continue }
    if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; continue }
    if (t.startsWith('//') || t.startsWith('*')) continue
    out.push(raw.replace(/\/\/.*$/, '').replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''"))
  }
  return out
}
function numsOf(path) {
  const s = new Set()
  for (const l of codeLines(path)) for (const m of l.matchAll(numRe)) { const v = Number(m[1].replace(/_/g, '')); if (Number.isFinite(v) && !TRIVIAL.has(v)) s.add(v) }
  return s
}
const econ = numsOf('src/engine/economy.ts')
const where = new Map()
for (const f of files) {
  if (f === 'src/engine/economy.ts') continue
  for (const v of numsOf(f)) if (econ.has(v)) { const l = where.get(v) ?? []; l.push(f); where.set(v, l) }
}
const rows = [...where.entries()].sort((a, b) => b[1].length - a[1].length)
console.log(`economy.ts code-line literals (non-trivial): ${econ.size}; shared with another src file: ${rows.length}`)
for (const [v, fs] of rows) {
  const ui = fs.filter((f) => !/^src\/(engine|shared|worker|db)\//.test(f))
  const eng = fs.filter((f) => /^src\/(engine|shared|worker|db)\//.test(f))
  console.log(`${String(v).padStart(10)}  engine ${eng.length} [${eng.map((f) => f.replace('src/', '')).join(', ')}]  ui ${ui.length} [${ui.map((f) => f.replace('src/', '')).join(', ')}]`)
}
