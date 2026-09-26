#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only; imports no repo code.
//
// The anatomy of the comment corpus: not HOW MUCH (00-baseline §A2 has the shares, and this probe's
// line classifier is the same four rules, so its totals reproduce §A2's), but WHAT KIND.
//
// Line rules (as §A2): blank; inside a block comment opened earlier (/* or <!--) = comment; a line
// starting //, /*, * or <!-- = comment (an unclosed /* or <!-- opens a block); else code.
// A comment BLOCK is a maximal run of comment lines (a blank line ends it).
// A block is DATED when it holds a day.month token of the project's lifetime (dd.07 / dd.08 / dd.09 –
// the first commit is 22.07.2026), e.g. «(17.08)», «on 23.09». It is a CHRONICLE block when it is dated
// OR names a round / wave / review item (round 29, wave 8, R2-13, T-01, P-14, #23) – the re-aim and
// incident record. It CARRIES A RULING when it holds a « guillemet quote or Cyrillic text (the owner's
// verbatim words, which the convention keeps at the site).
//
// Usage (repo root): node h-comment-anatomy.mjs <out.json> <path>...   (paths: files or dirs, git ls-files)
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const [out, ...roots] = process.argv.slice(2)
const files = execFileSync('git', ['ls-files', ...roots]).toString().trim().split('\n')
  .filter((f) => /\.(ts|mts|vue)$/.test(f) && !f.endsWith('.d.ts'))

const DATED = /(^|[^\d.])(0?[1-9]|[12]\d|3[01])\.(07|08|09)(?![\d])/
const CHRON = /\b(round|wave|Round|Wave|ROUND|WAVE)[ -]?\d+|\bR\d+-\d+|\b[TP]-\d{2}\b|\bQA-\d+|#\d{1,3}\b|RE-AIMED|RE-PINNED/
const RULING = /«|[Ѐ-ӿ]/

function classify(text) {
  const kinds = []
  let block = null // '*/' or '-->'
  for (const raw of text.split('\n')) {
    const t = raw.trim()
    if (!t) { kinds.push('b'); continue }
    if (block) { kinds.push('c'); if (t.includes(block)) block = null; continue }
    if (t.startsWith('//') || t.startsWith('*')) { kinds.push('c'); continue }
    if (t.startsWith('/*')) { kinds.push('c'); if (!t.slice(2).includes('*/')) block = '*/'; continue }
    if (t.startsWith('<!--')) { kinds.push('c'); if (!t.includes('-->')) block = '-->'; continue }
    kinds.push('k')
    // a code line opening an unclosed block comment outside a literal (approximation of §A2's rule)
    const noStr = t.replace(/'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`/g, '')
    const o = noStr.lastIndexOf('/*')
    if (o >= 0 && noStr.indexOf('*/', o) < 0) block = '*/'
    else if (noStr.includes('<!--') && !noStr.includes('-->')) block = '-->'
  }
  return kinds
}

const rows = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const lines = text.split('\n')
  const kinds = classify(text)
  let code = 0, comment = 0, codeChars = 0, commentChars = 0
  const blocks = []
  let cur = null
  for (let i = 0; i < lines.length; i++) {
    const k = kinds[i]
    if (k === 'k') { code++; codeChars += lines[i].length + 1 }
    if (k === 'c') { comment++; commentChars += lines[i].length + 1 }
    if (k === 'c') { if (!cur) cur = { start: i + 1, lines: [] }; cur.lines.push(lines[i]) }
    else if (cur) { blocks.push(cur); cur = null }
  }
  if (cur) blocks.push(cur)
  let datedLines = 0, chronLines = 0, rulingLines = 0, big10 = 0, big30 = 0, big30Lines = 0, maxBlock = 0
  for (const b of blocks) {
    const body = b.lines.join('\n'); const n = b.lines.length
    if (DATED.test(body)) datedLines += n
    if (DATED.test(body) || CHRON.test(body)) chronLines += n
    if (RULING.test(body)) rulingLines += n
    if (n >= 10) big10++
    if (n >= 30) { big30++; big30Lines += n }
    if (n > maxBlock) maxBlock = n
  }
  rows.push({ f, total: lines.length, code, comment, codeChars, commentChars, blocks: blocks.length, big10, big30, big30Lines, maxBlock, datedLines, chronLines, rulingLines })
}
const agg = (rs) => rs.reduce((a, r) => { for (const k of Object.keys(r)) if (typeof r[k] === 'number') a[k] = (a[k] || 0) + r[k]; return a }, { files: rs.length })
const all = agg(rows)
const pct = (a, b) => (100 * a / b).toFixed(1) + ' %'
const summary = {
  files: all.files, code: all.code, comment: all.comment, commentShare: pct(all.comment, all.code + all.comment),
  codeChars: all.codeChars, commentChars: all.commentChars, commentCharShare: pct(all.commentChars, all.codeChars + all.commentChars),
  blocks: all.blocks, blocksGE10: all.big10, blocksGE30: all.big30, linesInBlocksGE30: all.big30Lines,
  datedLines: all.datedLines, datedShareOfComment: pct(all.datedLines, all.comment),
  chronicleLines: all.chronLines, chronicleShareOfComment: pct(all.chronLines, all.comment),
  rulingLines: all.rulingLines, rulingShareOfComment: pct(all.rulingLines, all.comment),
}
const top = [...rows].sort((a, b) => b.total - a.total).slice(0, 15).map((r) => ({
  f: r.f, total: r.total, code: r.code, comment: r.comment, codeChars: r.codeChars, commentChars: r.commentChars,
  blocksGE30: r.big30, maxBlock: r.maxBlock, chronicle: pct(r.chronLines, r.comment), dated: pct(r.datedLines, r.comment), ruling: pct(r.rulingLines, r.comment),
}))
console.log(JSON.stringify({ summary, top }, null, 1))
writeFileSync(out, JSON.stringify({ summary, rows }, null, 1))
