#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only; imports no repo code.
//
// Classifies every tracked `tests/**/*.test.ts` file by what it does with the product:
//   pin     – reads product SOURCE TEXT: worldSource( / diarySource( / engineModuleSource( /
//             engineModuleFunction( / worldFunction( / componentLogic( / componentFile( /
//             readFileSync( or readFile( of a path under src/ (or of a .vue / style.css) / a `?raw` import
//   mount   – mounts a component: mount( / shallowMount( (from @vue/test-utils)
//   behave  – imports a runtime module from src/ (engine, shared, composables …) and is neither of the above
// A file can be pin + mount or pin + behave. `it(` blocks are counted with the baseline's regex
// (`(^|[^A-Za-z0-9_.])it\(`, plus `it.each(` etc.).
// Also reports, per helper, how many files call it, and the comment-stripping helpers' reach.
//
// Usage (from the repo root):  node docs/review-principles-2026-09-26/probes/h-pin-census.mjs [out.json]
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const files = execSync("git ls-files 'tests/*.test.ts'").toString().trim().split('\n')
const PIN = /\b(worldSource|diarySource|engineModuleSource|engineModuleFunction|worldFunction|componentLogic|componentFile)\s*\(|readFileSync\s*\([^)]*(src\/|\.vue|style\.css|['"`]\.\.\/src)|\?raw['"]/
const MOUNT = /\b(mount|shallowMount)\s*\(/
const BEHAVE = /^\s*import\s+(?!type\b)[^;]*from\s+['"](\.\.\/)+src\//m
const IT = /(^|[^A-Za-z0-9_.])it(\.(each|skip|only|todo|concurrent|fails)\b[^(]*)?\(/g
const STRIP = /\b(codeOf|scriptCodeOf)\s*\(/
const HELPERS = ['worldSource', 'diarySource', 'engineModuleSource', 'engineModuleFunction', 'worldFunction', 'componentLogic', 'componentFile', 'region', 'regionToLast', 'regions', 'lineAt', 'codeOf', 'scriptCodeOf']

const rows = []
const helperFiles = Object.fromEntries(HELPERS.map((h) => [h, 0]))
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  const its = (s.match(IT) || []).length
  const pin = PIN.test(s)
  const mount = MOUNT.test(s)
  const behave = BEHAVE.test(s)
  const strips = STRIP.test(s)
  for (const h of HELPERS) if (new RegExp(`\\b${h}\\s*\\(`).test(s)) helperFiles[h]++
  rows.push({ f, its, pin, mount, behave, strips, component: f.startsWith('tests/component/') })
}
const sum = (pred) => rows.filter(pred).reduce((a, r) => ({ files: a.files + 1, its: a.its + r.its }), { files: 0, its: 0 })
const out = {
  files: rows.length,
  its: rows.reduce((a, r) => a + r.its, 0),
  pinCarrying: sum((r) => r.pin),
  pinOnly: sum((r) => r.pin && !r.mount && !r.behave),
  pinAndMount: sum((r) => r.pin && r.mount),
  pinAndBehaveNoMount: sum((r) => r.pin && r.behave && !r.mount),
  mountedNoPin: sum((r) => r.mount && !r.pin),
  mountedAll: sum((r) => r.mount),
  behaveOnly: sum((r) => r.behave && !r.pin && !r.mount),
  neither: sum((r) => !r.pin && !r.mount && !r.behave),
  pinCarryingThatStripComments: sum((r) => r.pin && r.strips),
  styleCssReaders: rows.filter((r) => /style\.css/.test(readFileSync(r.f, 'utf8'))).length,
  helperFiles,
}
console.log(JSON.stringify(out, null, 2))
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ out, rows }, null, 1))
