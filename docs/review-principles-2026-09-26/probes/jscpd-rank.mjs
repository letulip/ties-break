#!/usr/bin/env node
// Phase 0a probe – ranks a jscpd 5.1.2 JSON report (00-baseline.md §A4; review of 26.09.2026, baseline 03d92221).
//
// Usage: node jscpd-rank.mjs <jscpd-report.json> <path-prefix> [top=20]
//   <path-prefix> is prepended to jscpd's names, which are relative to the scanned root (e.g. `src/`).
// Prints: per-format statistics; the <top> largest clone PAIRS by tokens with both file:line spans (SFC
// sub-block names such as `X.vue:css` are shown as `X.vue` plus the format, their line numbers are
// file-absolute); and the multi-site clusters – connected components of clone fragments, where two
// fragments are joined when they are the two sides of one pair or overlap in the same file.

import { readFileSync } from 'node:fs'

const [report, prefix = '', topArg = '20'] = process.argv.slice(2)
const top = Number(topArg)
const j = JSON.parse(readFileSync(report, 'utf8'))
const fileOf = (name) => prefix + name.replace(/:(css|html|typescript|javascript)$/, '')
const span = (f) => `${fileOf(f.name)}:${f.startLoc.line}-${f.endLoc.line}`

const out = []
const t = j.statistics.total
out.push(`total: files ${t.sources}, lines ${t.lines}, clones ${t.clones}, duplicated lines ${t.duplicatedLines} (${t.percentage.toFixed(2)} %), duplicated tokens ${t.duplicatedTokens} (${t.percentageTokens.toFixed(2)} %)`)
for (const [fmt, s] of Object.entries(j.statistics.formats)) {
  const x = s.total ?? s
  out.push(`  ${fmt}: files ${x.sources}, lines ${x.lines}, clones ${x.clones}, dup lines ${x.duplicatedLines} (${x.percentage.toFixed(2)} %), dup tokens ${x.duplicatedTokens} (${x.percentageTokens.toFixed(2)} %)`)
}
const dups = j.duplicates.slice().sort((a, b) => b.tokens - a.tokens || b.lines - a.lines)
out.push('')
out.push('| # | tokens | lines | format | first | second |')
out.push('| ---: | ---: | ---: | --- | --- | --- |')
dups.slice(0, top).forEach((d, i) => out.push(`| ${i + 1} | ${d.tokens} | ${d.lines} | ${d.format} | \`${span(d.firstFile)}\` | \`${span(d.secondFile)}\` |`))

// clusters
const frags = []
const idOf = new Map()
const parent = []
const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
const union = (a, b) => { parent[find(a)] = find(b) }
const add = (f, d) => {
  const key = `${fileOf(f.name)}|${f.startLoc.line}|${f.endLoc.line}`
  if (!idOf.has(key)) { idOf.set(key, frags.length); parent.push(frags.length); frags.push({ file: fileOf(f.name), a: f.startLoc.line, b: f.endLoc.line, tokens: d.tokens }) }
  return idOf.get(key)
}
for (const d of j.duplicates) union(add(d.firstFile, d), add(d.secondFile, d))
const byFile = new Map()
frags.forEach((f, i) => { const l = byFile.get(f.file) ?? []; l.push(i); byFile.set(f.file, l) })
for (const l of byFile.values()) for (let x = 0; x < l.length; x++) for (let y = x + 1; y < l.length; y++) {
  const A = frags[l[x]], B = frags[l[y]]
  if (A.a <= B.b && B.a <= A.b) union(l[x], l[y])
}
const comps = new Map()
frags.forEach((f, i) => { const r = find(i); const l = comps.get(r) ?? []; l.push(f); comps.set(r, l) })
const clusters = [...comps.values()].map((fs) => ({ sites: fs.length, files: new Set(fs.map((f) => f.file)).size, maxTokens: Math.max(...fs.map((f) => f.tokens)), fs }))
  .sort((a, b) => b.sites - a.sites || b.maxTokens - a.maxTokens)
out.push('')
out.push(`clusters: ${clusters.length}; with ≥3 sites: ${clusters.filter((c) => c.sites >= 3).length}; largest by sites:`)
for (const c of clusters.filter((c) => c.sites >= 3).slice(0, 10)) {
  out.push(`  ${c.sites} sites in ${c.files} files (max ${c.maxTokens} tok): ${c.fs.slice(0, 6).map((f) => `${f.file}:${f.a}-${f.b}`).join(', ')}${c.fs.length > 6 ? ' …' : ''}`)
}
console.log(out.join('\n'))
