// Lane G probe (principles review 26.09, baseline 03d92221) – SIZES AND LINES ONLY, no timing.
//
// Question: which SOURCE LINES of a module did a built chunk keep? A module that the UI never calls
// but that ships in the UI chunk anyway shows up here as "only its top-level initialisers are mapped".
//
// Input: a chunk and its sourcemap from Phase 0a's sourcemap build (RAW/dist-sourcemap, same chunk
// hashes as the production build – 00-baseline.md §A5). Uses the repo's own `source-map-js`.
//
// Usage (from the tb-review worktree root, so `source-map-js` resolves from its node_modules):
//   node docs/review-principles-2026-09-26/probes/g-chunk-lines.mjs <chunk.js.map> <src-suffix>...
// e.g.
//   node …/g-chunk-lines.mjs RAW/dist-sourcemap/assets/index-Cp7uBwDI.js.map \
//     src/engine/world/albumBook.ts src/engine/world/albumCorpus.ts src/engine/world/milestones.ts \
//     src/engine/diary.ts src/engine/diary/weekNotes.ts
// Prints, per source: the number of distinct mapped original lines, their min–max, and the mapped
// lines that begin a top-level declaration (`const` / `let` / `function` / `class`, exported or not).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(`${process.cwd()}/package.json`)
const { SourceMapConsumer } = require('source-map-js')

const [mapPath, ...wanted] = process.argv.slice(2)
if (!mapPath || wanted.length === 0) {
  console.error('usage: g-chunk-lines.mjs <chunk.js.map> <src-suffix>...')
  process.exit(2)
}
const consumer = new SourceMapConsumer(JSON.parse(readFileSync(mapPath, 'utf8')))
const lines = new Map(wanted.map((w) => [w, new Set()]))
consumer.eachMapping((m) => {
  const s = m.source ?? ''
  for (const w of wanted) if (s.endsWith(w)) lines.get(w).add(m.originalLine)
})
for (const w of wanted) {
  const set = [...lines.get(w)].sort((a, b) => a - b)
  let src = []
  try {
    src = readFileSync(w, 'utf8').split('\n')
  } catch {
    /* a suffix that is not a path from the cwd: counts only */
  }
  const top = set.filter((l) => /^(export )?(const|let|function|class)\b/.test(src[l - 1] ?? ''))
  console.log(
    `${w}: ${set.length} mapped lines` +
      (set.length ? ` (${set[0]}–${set[set.length - 1]})` : '') +
      `; top-level declarations mapped: ${top.length ? top.join(',') : '–'}`,
  )
}
