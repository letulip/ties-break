#!/usr/bin/env node
// Phase 0a probe – what the built install is made of (00-baseline.md §A5; review of 26.09.2026, baseline 03d92221).
//
// Usage: node precache-composition.mjs <dist-dir>
// Reads <dist>/sw.js the way scripts/install-size.mjs does (the same `{url:"…",revision:…}` regex, one entry per
// distinct url+revision pair), stats every entry under <dist>, and prints:
//   - every emitted JS/CSS file under <dist> (assets/ plus the worker scripts at the root) with raw bytes and
//     gzip bytes (node zlib, level 9 – vite's reporter also uses level 9) and whether it is precached;
//   - the precache grouped by type: js, css, fonts (woff2), images (webp/png/svg), audio (mp3), other (html,
//     webmanifest, …), with the top-level folder breakdown of images and audio;
//   - the 25 largest precached files.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = process.argv[2] ?? 'dist'
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8')
const all = [...sw.matchAll(/\{url:"(.*?)",revision:(null|"[0-9a-f]+")\}/g)]
const unique = new Map()
for (const [, url, revision] of all) unique.set(`${url}|${revision}`, url)
const urls = [...unique.values()]
const bytesOf = (url) => statSync(join(DIST, decodeURIComponent(url).replace(/^\//, ''))).size
const typeOf = (u) => {
  const ext = u.split('.').pop().toLowerCase()
  if (ext === 'js') return 'js'
  if (ext === 'css') return 'css'
  if (ext === 'woff2') return 'fonts'
  if (['webp', 'png', 'svg', 'jpg', 'jpeg'].includes(ext)) return 'images'
  if (ext === 'mp3') return 'audio'
  return 'other'
}
const entries = urls.map((u) => ({ url: u, bytes: bytesOf(u), type: typeOf(u) }))
const KiB = (b) => (b / 1024).toFixed(1)
const out = []
out.push(`manifest pairs: ${all.length} {url,revision} literals, ${urls.length} distinct pairs, ${KiB(entries.reduce((a, e) => a + e.bytes, 0))} KiB`)

// JS/CSS chunks
const precached = new Set(urls.map((u) => u.replace(/^\//, '')))
const files = []
const walk = (d, rel = '') => { for (const e of readdirSync(join(DIST, rel), { withFileTypes: true })) { const r = rel ? `${rel}/${e.name}` : e.name; if (e.isDirectory()) walk(d, r); else files.push(r) } }
walk(DIST)
out.push('')
out.push('| file | raw bytes | gzip bytes | precached |')
out.push('| --- | ---: | ---: | --- |')
for (const f of files.filter((f) => /\.(js|css)$/.test(f)).sort((a, b) => statSync(join(DIST, b)).size - statSync(join(DIST, a)).size)) {
  const buf = readFileSync(join(DIST, f))
  out.push(`| \`${f}\` | ${buf.length.toLocaleString('en')} | ${gzipSync(buf, { level: 9 }).length.toLocaleString('en')} | ${precached.has(f) ? 'yes' : 'no'} |`)
}

// by type
const byType = new Map()
for (const e of entries) { const v = byType.get(e.type) ?? { n: 0, b: 0 }; v.n++; v.b += e.bytes; byType.set(e.type, v) }
const total = entries.reduce((a, e) => a + e.bytes, 0)
out.push('')
out.push('| type | entries | KiB | share |')
out.push('| --- | ---: | ---: | ---: |')
for (const [t, v] of [...byType.entries()].sort((a, b) => b[1].b - a[1].b)) out.push(`| ${t} | ${v.n} | ${KiB(v.b)} | ${((100 * v.b) / total).toFixed(1)} % |`)
out.push(`| **total** | ${entries.length} | ${KiB(total)} | 100 % |`)

// folder breakdown for images/audio/other
const byDir = new Map()
for (const e of entries) {
  const parts = e.url.replace(/^\//, '').split('/')
  const dir = parts.length > 2 ? `${parts[0]}/${parts[1]}/` : parts.length > 1 ? `${parts[0]}/` : '(root)'
  const v = byDir.get(dir) ?? { n: 0, b: 0 }; v.n++; v.b += e.bytes; byDir.set(dir, v)
}
out.push('')
out.push('| folder (two levels) | entries | KiB |')
out.push('| --- | ---: | ---: |')
for (const [d, v] of [...byDir.entries()].sort((a, b) => b[1].b - a[1].b)) out.push(`| \`${d}\` | ${v.n} | ${KiB(v.b)} |`)

out.push('')
out.push('| # | precached file | KiB | type |')
out.push('| ---: | --- | ---: | --- |')
entries.sort((a, b) => b.bytes - a.bytes).slice(0, 25).forEach((e, i) => out.push(`| ${i + 1} | \`${e.url}\` | ${KiB(e.bytes)} | ${e.type} |`))
console.log(out.join('\n'))
