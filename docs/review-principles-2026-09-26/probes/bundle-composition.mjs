#!/usr/bin/env node
// Phase 0a probe – who owns the bytes of a built JS chunk (00-baseline.md §A5; review of 26.09.2026, baseline 03d92221).
//
// Usage: node bundle-composition.mjs <source-map-explorer --json output> [topFiles=15]
// Input: `npx --yes source-map-explorer@2.5.3 <chunk.js> <chunk.js.map> --json --no-border-checks`, over a
// `vite build --sourcemap` whose chunk hashes equal the production build's (so the bytes are the shipped ones).
// Groups every mapped source by: src area (the same areaOf() as line-classifier.mjs, §A2) or node_modules
// package (scoped names kept whole); `[unmapped]` and anything else are listed as they come.
import { readFileSync } from 'node:fs'
import { areaOf } from './line-classifier.mjs'

const [input, topArg = '15'] = process.argv.slice(2)
const j = JSON.parse(readFileSync(input, 'utf8'))
const r = j.results[0]
const groups = new Map()
const srcFiles = []
for (const [name, v] of Object.entries(r.files)) {
  const size = typeof v === 'number' ? v : v.size
  let key
  const nm = name.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//)
  const src = name.match(/(?:^|\/)(src\/[^?]+)/)
  if (nm) key = `pkg ${nm[1]}`
  else if (src) { key = `src ${areaOf(src[1])}`; srcFiles.push({ file: src[1] + (name.includes('?') ? name.slice(name.indexOf('?')) : ''), size }) }
  else key = name
  groups.set(key, (groups.get(key) ?? 0) + size)
}
const total = r.totalBytes
const out = [`chunk ${r.bundleName}: total ${total.toLocaleString('en')} bytes, mapped ${r.mappedBytes.toLocaleString('en')}, unmapped ${r.unmappedBytes.toLocaleString('en')}, ${Object.keys(r.files).length} sources`]
const srcSum = [...groups.entries()].filter(([k]) => k.startsWith('src ')).reduce((a, [, v]) => a + v, 0)
const pkgSum = [...groups.entries()].filter(([k]) => k.startsWith('pkg ')).reduce((a, [, v]) => a + v, 0)
out.push(`src ${srcSum.toLocaleString('en')} bytes (${((100 * srcSum) / total).toFixed(1)} %), node_modules ${pkgSum.toLocaleString('en')} bytes (${((100 * pkgSum) / total).toFixed(1)} %)`)
out.push('')
out.push('| owner | bytes | share |')
out.push('| --- | ---: | ---: |')
for (const [k, v] of [...groups.entries()].sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${v.toLocaleString('en')} | ${((100 * v) / total).toFixed(1)} % |`)
out.push('')
out.push('| # | src file | bytes |')
out.push('| ---: | --- | ---: |')
srcFiles.sort((a, b) => b.size - a.size).slice(0, Number(topArg)).forEach((f, i) => out.push(`| ${i + 1} | \`${f.file.replace(/^src\//, '')}\` | ${f.size.toLocaleString('en')} |`))
console.log(out.join('\n'))
