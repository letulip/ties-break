#!/usr/bin/env node
// Lane F probe – the local world-building helper census (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repo root): node docs/review-principles-2026-09-26/probes/helper-census.mjs [--json out.json]
// Reads `git ls-files tests tools e2e` (*.ts), finds every LOCAL definition of the named helpers
// (`function X(`, `async function X(`, `const X = (`, `const X = async (`, `const X = function`),
// extracts its body by brace matching, strips comments and whitespace, and prints:
//   1. per name: definitions, split by what the body actually does (a feature signature);
//   2. exact clusters: bodies byte-identical after normalisation (comments/whitespace removed,
//      the helper's own name kept) – each cluster is a set of copies a shared helper would replace;
//   3. the career-walk signatures: which engine verbs each copy calls, so near-copies with a
//      different policy (skip tournaments or not, drain life beats or not) are visible as such.
// Nothing is written unless --json is given. Pure read; no repo code is imported.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const NAMES = ['walk', 'careerAt', 'walkTo', 'expecting', 'clashWorld', 'worldAt', 'tickTo', 'base', 'freshWorld', 'runTo']
const files = execFileSync('git', ['ls-files', 'tests', 'tools', 'e2e'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.ts'))

const defRe = new RegExp(
  String.raw`^\s*(export\s+)?(async\s+)?function\s+(${NAMES.join('|')})\s*[<(]|^\s*(export\s+)?const\s+(${NAMES.join('|')})\s*(:[^=]+)?=\s*(async\s*)?(\(|function|[a-z]\w*\s*=>)`,
)

function stripComments(s) {
  // remove block and line comments outside string literals (good enough for this corpus)
  let out = ''
  let i = 0
  let q = null
  while (i < s.length) {
    const c = s[i]
    const n = s[i + 1]
    if (q) {
      out += c
      if (c === '\\') { out += n ?? ''; i += 2; continue }
      if (c === q) q = null
      i++
      continue
    }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue }
    if (c === '/' && n === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue }
    if (c === '/' && n === '/') { const e = s.indexOf('\n', i); i = e < 0 ? s.length : e; continue }
    out += c
    i++
  }
  return out
}

function extract(lines, at) {
  // from the definition line, take text until the braces opened after the parameter list close.
  const text = lines.slice(at, at + 400).join('\n')
  const clean = stripComments(text)
  let depthParen = 0
  let started = false
  let depth = 0
  let q = null
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (q) { if (c === '\\') { i++; continue } if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; continue }
    if (c === '(') depthParen++
    if (c === ')') depthParen--
    if (c === '{' ) { depth++; started = true }
    if (c === '}') { depth--; if (started && depth === 0) return clean.slice(0, i + 1) }
    if (!started && c === '\n' && depthParen === 0 && /=>\s*[^{\s]/.test(clean.slice(0, i))) {
      // expression-bodied arrow: take to the end of the statement (a blank line or 40 lines)
      const rest = clean.slice(0, i + 1) + clean.slice(i + 1).split(/\n\s*\n/)[0]
      return rest
    }
  }
  return clean.slice(0, 2000)
}

const has = (b, re) => re.test(b)
function signature(body, name) {
  // the helper's own name is not evidence of delegation (recursion, or the definition line itself)
  const others = body.replace(new RegExp(`\\b${name}\\b`, 'g'), '·')
  if (has(body, /readdirSync|statSync|readdir\(/)) return 'fs-directory-walk'
  if (has(body, /Prologue|road\b|PrologueRun/)) return 'prologue-card-walk'
  if (has(others, /openCareer|stepCareerWeek/)) return 'career-via-econ-bench'
  if (has(body, /Object\.entries|Array\.isArray/) && !has(others, /tickWeek|createWorld/)) return 'object-graph-walk'
  if (!has(others, /createWorld|tickWeek|resumeFromCollege|advanceWeeks|careerSnapshot|careerAt\(|walk\(|walkTo\(/)) return 'other'
  const verbs = []
  if (has(body, /createWorld/)) verbs.push('create')
  if (has(body, /tickWeek|advanceWeeks/)) verbs.push('tick')
  if (has(body, /skipTournament/)) verbs.push('skipT')
  if (has(body, /closeTournament/)) verbs.push('closeT')
  if (has(body, /enterEvent/)) verbs.push('enter')
  if (has(body, /drainLifeBeats|answerLifeBeat/)) verbs.push('lifeBeats')
  if (has(body, /answerBirthday|chooseGift/)) verbs.push('birthday')
  if (has(body, /decideKnock|answerKnock|_knocks/)) verbs.push('knock')
  if (has(body, /Reveal|reveal/)) verbs.push('reveal')
  if (has(body, /resumeFromCollege|College/)) verbs.push('college')
  if (has(body, /toSnapshot/)) verbs.push('snapshot')
  if (has(others, /careerSnapshot|careerAt\(|walk\(|walkTo\(|runCareer\(/)) verbs.push('delegates')
  return 'career:' + verbs.join('+')
}

const defs = []
for (const f of files) {
  let src
  try { src = readFileSync(f, 'utf8') } catch { continue }
  const lines = src.split('\n')
  lines.forEach((l, i) => {
    const m = defRe.exec(l)
    if (!m) return
    const name = m[3] ?? m[5]
    const body = extract(lines, i)
    const norm = body.replace(/\s+/g, ' ').trim()
    defs.push({ name, file: f, line: i + 1, sig: signature(body, name), hash: createHash('sha1').update(norm).digest('hex').slice(0, 10), bodyLines: body.split('\n').length })
  })
}

const out = []
out.push(`definitions: ${defs.length} in ${new Set(defs.map((d) => d.file)).size} files (tests/tools/e2e *.ts, ${files.length} files scanned)`)
for (const n of NAMES) {
  const ds = defs.filter((d) => d.name === n)
  if (!ds.length) continue
  const by = new Map()
  for (const d of ds) by.set(d.sig, (by.get(d.sig) ?? 0) + 1)
  const roots = { tests: ds.filter((d) => d.file.startsWith('tests/')).length, tools: ds.filter((d) => d.file.startsWith('tools/')).length, e2e: ds.filter((d) => d.file.startsWith('e2e/')).length }
  out.push(`\n## ${n}: ${ds.length} (tests ${roots.tests} · tools ${roots.tools} · e2e ${roots.e2e})`)
  for (const [s, c] of [...by.entries()].sort((a, b) => b[1] - a[1])) out.push(`  ${String(c).padStart(3)}  ${s}`)
}
out.push('\n## exact clusters (normalised body identical), size >= 2')
const byHash = new Map()
for (const d of defs) { const l = byHash.get(d.hash) ?? []; l.push(d); byHash.set(d.hash, l) }
for (const [h, l] of [...byHash.entries()].filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length)) {
  out.push(`  ${l.length} × ${l[0].name} [${l[0].sig}] ${h}: ${l.map((d) => `${d.file}:${d.line}`).join(', ')}`)
}
out.push('\n## career-walk definitions by signature (all names)')
const career = defs.filter((d) => d.sig.startsWith('career:'))
const bySig = new Map()
for (const d of career) { const l = bySig.get(d.sig) ?? []; l.push(d); bySig.set(d.sig, l) }
for (const [s, l] of [...bySig.entries()].sort((a, b) => b[1].length - a[1].length)) {
  out.push(`  ${String(l.length).padStart(3)}  ${s}  (distinct bodies ${new Set(l.map((d) => d.hash)).size})  e.g. ${l.slice(0, 3).map((d) => `${d.file}:${d.line}`).join(', ')}`)
}
console.log(out.join('\n'))
const j = process.argv.indexOf('--json')
if (j > 0) writeFileSync(process.argv[j + 1], JSON.stringify(defs, null, 1))
