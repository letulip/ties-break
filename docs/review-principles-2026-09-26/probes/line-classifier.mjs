#!/usr/bin/env node
// Phase 0a probe – the line classifier behind 00-baseline.md §A2 (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repository root, any checkout):
//   node <this file> [--json <out.json>] <root> [<root> ...]
// Files are the TRACKED files under each root (`git ls-files`), extensions .ts .mts .mjs .js .vue .css.
//
// RULES (applied per physical line, after trimming whitespace):
//   1. blank    – the trimmed line is empty.
//   2. comment  – we are inside a block comment (`/* … */` or `<!-- … -->`) that an earlier line opened;
//                 the line that closes it is a comment line too.
//   3. comment  – the trimmed line STARTS with `//`, `/*`, `*` or `<!--`. If it opens `/*` or `<!--`
//                 and does not close it on the same line, the following lines are inside that block (rule 2).
//                 (A line that closes a block and then carries code, e.g. `*/ foo()`, still counts as comment.)
//   4. code     – everything else, including a code line with a trailing comment. If a code line opens a
//                 `/*` (outside a '…', "…" or `…` literal on that line) or a `<!--` without closing it,
//                 the following lines are inside that block (rule 2).
// The "prefix-only" count is rules 1, 3 and 4 WITHOUT the block state (the architect's pre-read method):
// a line is a comment only if it starts with one of the four markers. Both counts are reported.
// Comment share = comment / (code + comment), i.e. of non-blank lines.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const EXT = /\.(ts|mts|mjs|js|vue|css)$/

export function classify(text) {
  const lines = text.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  let blank = 0, code = 0, comment = 0, prefixComment = 0, prefixCode = 0
  let inBlock = null // '*/' or '-->'
  for (const raw of lines) {
    const t = raw.trim()
    if (t === '') { blank++; continue }
    const startsComment = t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('<!--')
    if (startsComment) prefixComment++; else prefixCode++
    if (inBlock) {
      comment++
      if (t.includes(inBlock)) inBlock = null
      continue
    }
    if (startsComment) {
      comment++
      if (t.startsWith('/*') && !t.slice(2).includes('*/')) inBlock = '*/'
      else if (t.startsWith('<!--') && !t.slice(4).includes('-->')) inBlock = '-->'
      continue
    }
    code++
    const open = openerOutsideStrings(t)
    if (open) inBlock = open
  }
  return { total: lines.length, blank, code, comment, prefixCode, prefixComment }
}

// Scan a code line for an unclosed `/*` (outside simple quote literals) or `<!--`.
function openerOutsideStrings(t) {
  let quote = null
  let state = null
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (state === '*/') { if (c === '*' && t[i + 1] === '/') { state = null; i++ } continue }
    if (state === '-->') { if (t.startsWith('-->', i)) { state = null; i += 2 } continue }
    if (quote) { if (c === '\\') { i++; continue } if (c === quote) quote = null; continue }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === '/' && t[i + 1] === '/') return state
    if (c === '/' && t[i + 1] === '*') { state = '*/'; i++; continue }
    if (t.startsWith('<!--', i)) { state = '-->'; i += 3; continue }
  }
  return state
}

// AREAS (the --areas mode, src only). One row per area; a file belongs to exactly one row.
export function areaOf(file) {
  const p = file.replace(/^src\//, '')
  if (p === 'engine/world.ts') return 'engine/world.ts (the integration core)'
  if (/^engine\/[^/]+$/.test(p)) return 'engine root leaf modules (excl. world.ts)'
  let m = p.match(/^engine\/([^/]+)\//)
  if (m) return `engine/${m[1]}`
  if (p.startsWith('shared/protocol/')) return 'shared/protocol'
  if (p.startsWith('shared/')) return 'shared (root)'
  if (p.startsWith('components/screens/')) return 'components/screens'
  if (p.startsWith('components/ui/')) return 'components/ui'
  if (p.startsWith('components/album/')) return 'components/album'
  if (p.startsWith('components/')) return 'components (root)'
  if (p === 'pwa.ts') return 'pwa'
  m = p.match(/^([^/]+)\//)
  if (m) return m[1]
  return `other (${p})`
}

// Rollups printed under the per-area rows (prefix match on the area name).
const ROLLUPS = [
  ['engine, all', (a) => a.startsWith('engine')],
  ['engine root incl. world.ts', (a) => a.startsWith('engine root') || a.startsWith('engine/world.ts')],
  ['shared, all', (a) => a.startsWith('shared')],
  ['components, all', (a) => a.startsWith('components')],
  ['UI side (stores+composables+components+prologue+art+audio+viz+pwa+other)', (a) => !/^(engine|worker|shared|db)/.test(a)],
]

function areaReport(rows) {
  const by = new Map()
  const add = (key, r) => {
    const a = by.get(key) ?? { files: 0, total: 0, blank: 0, code: 0, comment: 0 }
    a.files++; a.total += r.total; a.blank += r.blank; a.code += r.code; a.comment += r.comment
    by.set(key, a)
  }
  for (const r of rows) add(areaOf(r.file), r)
  const areas = [...by.keys()]
  const fmt = (name, a) => `| ${name} | ${a.files} | ${a.code.toLocaleString('en')} | ${a.comment.toLocaleString('en')} | ${a.blank.toLocaleString('en')} | ${((100 * a.comment) / (a.code + a.comment)).toFixed(1)} % |`
  const out = ['| area | files | code | comment | blank | comment share |', '| --- | ---: | ---: | ---: | ---: | ---: |']
  for (const k of areas.sort()) out.push(fmt(k, by.get(k)))
  for (const [name, pred] of ROLLUPS) {
    const a = { files: 0, total: 0, blank: 0, code: 0, comment: 0 }
    for (const k of areas.filter(pred)) for (const f of Object.keys(a)) a[f] += by.get(k)[f]
    out.push(fmt(`**${name}**`, a))
  }
  return out.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--areas') {
    const rows = JSON.parse(readFileSync(args[1], 'utf8'))
    console.log(areaReport(rows.filter((r) => r.file.startsWith('src/'))))
    return
  }
  let jsonOut = null
  const roots = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') jsonOut = args[++i]
    else roots.push(args[i])
  }
  const files = execFileSync('git', ['ls-files', ...roots], { encoding: 'utf8' })
    .split('\n').filter((f) => EXT.test(f))
  const rows = files.map((file) => ({ file, ...classify(readFileSync(file, 'utf8')) }))
  const sum = rows.reduce((a, r) => {
    for (const k of ['total', 'blank', 'code', 'comment', 'prefixCode', 'prefixComment']) a[k] += r[k]
    return a
  }, { files: rows.length, total: 0, blank: 0, code: 0, comment: 0, prefixCode: 0, prefixComment: 0 })
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 1))
  const share = (c, k) => ((100 * c) / (c + k)).toFixed(1)
  console.log(JSON.stringify({ roots, ...sum, commentShare: share(sum.comment, sum.code), prefixCommentShare: share(sum.prefixComment, sum.prefixCode) }))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
