#!/usr/bin/env node
// Lane F probe – the tools' local stats/format helpers, classified by BEHAVIOUR (review of 26.09.2026,
// baseline 03d92221; the 05.09 D-05 finding, re-measured).
//
// Usage (from the repo root): node docs/review-principles-2026-09-26/probes/tool-helpers.mjs
// For every `tools/**/*.ts` (and the four .mjs), finds top-level definitions of money / median /
// quantile / pct / mean / argOf, takes the definition's text up to the end of its body (brace or
// statement), strips whitespace, and groups identical bodies. Then applies behaviour tests that do
// not need to run the code:
//   money   – signed (reads the sign before formatting) | unsigned `$${Math.round(c/100)…}` (prints
//             `$-1,234` for a deficit) | formatCents (the shared helper) | other
//   median  – empty input -> 0 | NaN | throws | unguarded; even length -> averaged middle | upper middle
//   quantile/pctl – floor(q*n) | round(q*(n-1)) | interpolated | other
//   pct     – a fraction (1 arg) | numerator/denominator (2 numeric args) | percentile of an array
// Prints counts per class and the files in the minority classes. Pure read.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = execFileSync('git', ['ls-files', 'tools'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|mjs)$/.test(f))
const NAMES = ['money', 'median', 'quantile', 'pctl', 'pct', 'mean', 'argOf']
const re = new RegExp(String.raw`^(export\s+)?(const|function)\s+(${NAMES.join('|')})\b`)

function bodyAt(lines, i) {
  let depth = 0, seen = false, out = []
  for (let k = i; k < Math.min(lines.length, i + 40); k++) {
    const l = lines[k].replace(/\/\/.*$/, '')
    out.push(l)
    for (const c of l) { if (c === '{' || c === '(') { depth++; seen = true } if (c === '}' || c === ')') depth-- }
    if (seen && depth <= 0 && !/[=,(]\s*$/.test(l.trim()) && !/=>\s*$/.test(l.trim())) break
  }
  return out.join('\n')
}

const classify = {
  money: (b) => /formatCents/.test(b) ? 'formatCents' : /(<\s*0|Math\.abs|'-'|"-"|sign)/.test(b) ? 'signed' : /Math\.round\([^)]*\/\s*100\)|\/\s*100\)\.toLocaleString|\/\s*100\s*\)/.test(b) ? 'unsigned ($-1,234 on a deficit)' : 'other',
  median: (b) => {
    const empty = /length\s*===?\s*0\)?\s*(\?|return)\s*(NaN|Number\.NaN)|return NaN|\?\s*NaN/.test(b) ? 'NaN' : /length\s*===?\s*0\)?\s*(\?|return)\s*0|\?\s*0\s*:|!\s*\w+\.length\)?\s*(return|\?)\s*0/.test(b) ? '0' : /throw/.test(b) ? 'throws' : 'unguarded'
    const even = /\/\s*2\s*$|\+\s*\w+\[[^\]]*-\s*1\]\)\s*\/\s*2|\)\s*\/\s*2/.test(b) ? 'averaged' : 'upper-middle'
    return `empty→${empty}, even→${even}`
  },
  quantile: (b) => /Math\.round\([^)]*\(\s*\w+\.length\s*-\s*1\)/.test(b) ? 'round(q·(n−1))' : /Math\.floor\([^)]*\.length/.test(b) ? 'floor(q·n)' : /lo\s*\+|\(1\s*-\s*\w+\)|frac|interp/.test(b) ? 'interpolated' : 'other',
  pctl: (b) => classify.quantile(b),
  pct: (b) => {
    const head = b.split('\n')[0]
    if (/\[\]|readonly number\[\]|xs|arr|sorted/.test(head) && /,\s*(p|q)\b/.test(head)) return 'percentile of an array'
    const args = (/\(([^)]*)\)/.exec(head)?.[1] ?? '').split(',').filter((s) => s.trim())
    return args.length >= 2 ? 'numerator/denominator' : args.length === 1 ? 'a fraction' : 'other'
  },
  mean: (b) => /length\s*\?|length\s*===?\s*0|!\s*\w+\.length/.test(b) ? (/NaN/.test(b) ? 'guarded→NaN' : 'guarded→0') : 'unguarded (NaN on empty by division)',
  argOf: () => 'argOf',
}

const found = []
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  lines.forEach((l, i) => {
    const m = re.exec(l)
    if (!m) return
    const name = m[3]
    const b = bodyAt(lines, i)
    found.push({ name, file: f, line: i + 1, cls: classify[name](b), norm: b.replace(/\s+/g, '') })
  })
}
for (const n of NAMES) {
  const xs = found.filter((d) => d.name === n)
  const by = new Map()
  for (const d of xs) { const l = by.get(d.cls) ?? []; l.push(d); by.set(d.cls, l) }
  console.log(`\n${n}: ${xs.length} definitions in ${new Set(xs.map((d) => d.file)).size} files, ${new Set(xs.map((d) => d.norm)).size} distinct bodies`)
  const cls = [...by.entries()].sort((a, b) => b[1].length - a[1].length)
  for (const [c, l] of cls) console.log(`  ${String(l.length).padStart(3)}  ${c}${l.length <= 8 && cls.length > 1 ? '  – ' + l.map((d) => `${d.file}:${d.line}`).join(', ') : ''}`)
}
