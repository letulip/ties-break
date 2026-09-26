#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only; imports no repo code.
//
// THE BLAST RADIUS OF MOVING COMMENTS: which source pins in tests/ are anchored on COMMENT text?
// Any option that shortens or relocates comments in src/ breaks exactly these (loudly, when the
// marker helpers throw; silently, when a positive `toContain` on a raw source string simply stops
// finding its text – no: that reddens too. The silent class is the NEGATIVE one, which is not counted
// here because moving text out can only make a negative pin pass more easily).
//
// Method: split every tracked src/**/*.{ts,vue} into code lines and comment lines (the §A2 rules,
// same as h-comment-anatomy.mjs). Extract from tests/**/*.ts every string literal (no `${}`) passed as
// a MARKER – region( / regionToLast( / regions( / at( / lastAt( / lineAt( / after( / before( –
// and every literal in a POSITIVE `.toContain('…')` (not preceded by `.not`). For each literal of
// >= 6 characters, ask: does it occur in some src file's CODE text, only in some src file's COMMENT
// text, or in neither (a rendered/computed string, or a test's own text)?
//
// Usage (repo root): node h-comment-pins.mjs <out.json>
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2]
const ls = (...p) => execFileSync('git', ['ls-files', ...p]).toString().trim().split('\n').filter(Boolean)

function split(text) {
  const code = [], comment = []
  let block = null
  for (const raw of text.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    if (block) { comment.push(raw); if (t.includes(block)) block = null; continue }
    if (t.startsWith('//') || t.startsWith('*')) { comment.push(raw); continue }
    if (t.startsWith('/*')) { comment.push(raw); if (!t.slice(2).includes('*/')) block = '*/'; continue }
    if (t.startsWith('<!--')) { comment.push(raw); if (!t.includes('-->')) block = '-->'; continue }
    code.push(raw)
    const noStr = t.replace(/'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`/g, '')
    const o = noStr.lastIndexOf('/*')
    if (o >= 0 && noStr.indexOf('*/', o) < 0) block = '*/'
  }
  return { code: code.join('\n'), comment: comment.join('\n') }
}

const srcCode = [], srcComment = []
for (const f of ls('src').filter((f) => /\.(ts|vue|css)$/.test(f))) {
  const { code, comment } = split(readFileSync(f, 'utf8'))
  srcCode.push(code); srcComment.push(comment)
}
const CODE = srcCode.join('\n'), COMMENT = srcComment.join('\n')

const LIT = `(['"\`])((?:\\\\.|(?!\\1)[^\\\\])*?)\\1`
const MARKER = new RegExp(`\\b(region|regionToLast|regions|at|lastAt|lineAt|after|before)\\(\\s*[A-Za-z_$][\\w$.()]*\\s*,\\s*${LIT.replace(/\\1/g, '\\2')}(?:\\s*,\\s*${LIT.replace(/\\1/g, '\\4')})?`, 'g')
const CONTAIN = new RegExp(`(\\.not)?\\.toContain\\(\\s*${LIT.replace(/\\1/g, '\\2')}`, 'g')
const unescape = (s) => s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n')

const res = { marker: { code: 0, commentOnly: 0, neither: 0 }, positiveContain: { code: 0, commentOnly: 0, neither: 0 }, commentOnlyByFile: {}, samples: [] }
function judge(kind, lit, file, line) {
  if (lit.length < 6 || lit.includes('${')) return
  const s = unescape(lit)
  const where = CODE.includes(s) ? 'code' : COMMENT.includes(s) ? 'commentOnly' : 'neither'
  res[kind][where]++
  if (where === 'commentOnly') {
    res.commentOnlyByFile[file] = (res.commentOnlyByFile[file] || 0) + 1
    if (res.samples.length < 40) res.samples.push(`${kind} ${file}:${line} ${JSON.stringify(s.slice(0, 80))}`)
  }
}
for (const f of ls('tests').filter((f) => f.endsWith('.ts'))) {
  const text = readFileSync(f, 'utf8')
  const lineOf = (i) => text.slice(0, i).split('\n').length
  for (const m of text.matchAll(MARKER)) {
    judge('marker', m[3], f, lineOf(m.index))
    if (m[5] !== undefined) judge('marker', m[5], f, lineOf(m.index))
  }
  // positive contains only in files that read source and mount nothing: a mounted test's toContain is
  // about RENDERED text, which may coincide with a comment without depending on it.
  const readsSource = /\b(worldSource|diarySource|engineModuleSource|engineModuleFunction|worldFunction|componentLogic|componentFile)\s*\(|readFileSync\s*\([^)]*(src\/|\.vue|['"`]\.\.\/src)/.test(text)
  const mounts = /\b(mount|shallowMount)\s*\(/.test(text)
  if (readsSource && !mounts) for (const m of text.matchAll(CONTAIN)) if (!m[1]) judge('positiveContain', m[3], f, lineOf(m.index))
}
const files = Object.entries(res.commentOnlyByFile).sort((a, b) => b[1] - a[1])
console.log(JSON.stringify({ marker: res.marker, positiveContain: res.positiveContain, filesWithCommentOnlyAnchors: files.length, topFiles: files.slice(0, 12), samples: res.samples.slice(0, 20) }, null, 1))
writeFileSync(out, JSON.stringify(res, null, 1))
