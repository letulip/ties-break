#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only; imports no repo code.
//
// What a reader pays, in tokens, to load a file whole – split into its code lines and its comment
// lines (the §A2 classifier rules). The tokenizer is `@anthropic-ai/tokenizer@0.0.4`, fetched with
// `npx --yes -p @anthropic-ai/tokenizer@0.0.4` into ~/.npm/_npx (nothing in the repository) and
// reached through NODE_PATH. It is the published legacy tokenizer, NOT the current model's, so the
// absolute counts are an estimate; the probe calibrates them against one count the harness itself
// reported (its Read tool refused 00-baseline.md as 57,501 tokens) and prints the ratio. The
// load-bearing number is the SHARE, which a uniform scale factor does not move.
//
// Usage: NODE_PATH=<npx dir>/node_modules node h-comment-tokens.cjs <calibration.md> <file>...
const { countTokens } = require('@anthropic-ai/tokenizer')
const { readFileSync } = require('node:fs')

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

const [calib, ...files] = process.argv.slice(2)
const c = countTokens(readFileSync(calib, 'utf8'))
console.log(`calibration: ${calib} – legacy tokenizer ${c}; harness-reported 57501; scale ${(57501 / c).toFixed(3)}`)
console.log('file | whole | code | comment | comment share of tokens')
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const { code, comment } = split(text)
  const w = countTokens(text), k = countTokens(code), m = countTokens(comment)
  console.log(`${f} | ${w} | ${k} | ${m} | ${(100 * m / (k + m)).toFixed(1)} %`)
}
