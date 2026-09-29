// Lane F gap-fill (26.09, baseline 03d92221): which tools import `mean` / `median` from
// `./econ-bench`, parsed over whole (multi-line) import statements, split live / archival by the
// `## Live` list of tools/README.md (RAW/F/live-tools.txt); and which tools still define their own.
// Run from the worktree root: node docs/review-principles-2026-09-26/probes/econ-bench-importers.mjs <live-tools.txt>
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const live = new Set(
  readFileSync(process.argv[2], 'utf8').trim().split('\n')
    .map((l) => l.trim()).filter((l) => l.endsWith('.ts')).map((l) => `tools/${l}`),
)
const tsFiles = execSync('git ls-files -- "tools/*.ts"', { encoding: 'utf8' }).trim().split('\n')
const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]\.\/econ-bench['"]/g
const defRe = (n) => new RegExp(`(function\\s+${n}\\s*\\(|const\\s+${n}\\s*=)`)

const importers = { mean: [], median: [] }
const defs = { mean: [], median: [] }
let econImporters = 0
for (const f of tsFiles) {
  const s = readFileSync(f, 'utf8')
  const names = new Set()
  let m
  let any = false
  while ((m = importRe.exec(s))) {
    any = true
    for (const n of m[1].split(',')) names.add(n.trim().split(/\s+as\s+/)[0])
  }
  if (any) econImporters++
  for (const k of ['mean', 'median']) {
    if (names.has(k)) importers[k].push(f)
    if (f !== 'tools/econ-bench.ts' && defRe(k).test(s)) defs[k].push(f)
  }
}
const either = [...new Set([...importers.mean, ...importers.median])].sort()
const isLive = (f) => live.has(f)
console.log(`tools/*.ts files: ${tsFiles.length}; live list: ${live.size}; files importing anything from ./econ-bench: ${econImporters}`)
for (const k of ['mean', 'median']) {
  console.log(`${k}: imported by ${importers[k].length} (live ${importers[k].filter(isLive).length}); defined locally in ${defs[k].length} (live ${defs[k].filter(isLive).length})`)
}
console.log(`mean OR median imported by ${either.length} (live ${either.filter(isLive).length})`)
console.log(`live importers: ${either.filter(isLive).join(' ')}`)
console.log(`live local median: ${defs.median.filter(isLive).join(' ')}`)
console.log(`live local mean: ${defs.mean.filter(isLive).join(' ')}`)
console.log(`files that import AND define median: ${defs.median.filter((f) => importers.median.includes(f)).join(' ') || 'none'}`)
console.log(`underscore (shared) modules importing: ${either.filter((f) => f.startsWith('tools/_')).join(' ')}`)
