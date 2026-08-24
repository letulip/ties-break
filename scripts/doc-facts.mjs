// THE VOLATILE FACTS, MECHANICALLY SOURCED (R2-04 / TOK-01, owner-approved 23.08).
//
// ⚠ THE PROBLEM THIS EXISTS FOR, IN THE AFFECTED DOC'S OWN WORDS: «THAT NUMBER ROTS SILENTLY
// BECAUSE NOTHING CHECKS IT – wrong three times now». A context pack quoted schema v53 while the
// code was at v59; the delivery router named round 22 as live while main carried round 25. Both
// documents are honest, well-written and were repaired by hand before – repair without ownership
// is why the second review found them stale again «only days after their repair».
//
// SO THE RULE IS NOT «write fewer facts». It is: a fact that a machine can read from the source
// must BE read from the source. Three kinds live here and nothing else belongs:
//   1. a constant the code owns (the save schema);
//   2. a file the tree owns (the newest round ledger);
//   3. a count the corpus owns (the number of ledgers).
// Everything else – reasoning, rulings, history – stays prose, unchecked, and is the reason the
// docs are worth reading at all.
//
// A failure names the file, the line, what it says and what is true. `--fix` is deliberately NOT
// offered: the sentence around the number usually needs a human edit too.
import { readFileSync, readdirSync } from 'node:fs'

const read = (p) => readFileSync(p, 'utf8')
const fail = []

// 1. The save schema, quoted in the saves context pack.
const schema = /SAVE_SCHEMA_VERSION = (\d+)/.exec(read('src/engine/world.ts'))?.[1]
if (!schema) fail.push('doc-facts: SAVE_SCHEMA_VERSION not found in src/engine/world.ts')
else {
  const p = 'docs/context/saves-and-worker.md'
  const lines = read(p).split('\n')
  const i = lines.findIndex((l) => /`SAVE_SCHEMA_VERSION` is v\d+/.test(l))
  if (i < 0) fail.push(`doc-facts: ${p} no longer states the schema version – restore the sentence or retire this check`)
  else {
    const said = /`SAVE_SCHEMA_VERSION` is v(\d+)/.exec(lines[i])[1]
    if (said !== schema) fail.push(`${p}:${i + 1} says schema v${said}; src/engine/world.ts says v${schema}`)
  }
}

// 2. The live wave, named by the delivery router: the newest ledger in docs/rounds is the truth.
const rounds = readdirSync('docs/rounds')
  .map((f) => /^round-(\d+)\.md$/.exec(f)?.[1])
  .filter(Boolean)
  .map(Number)
  .sort((a, b) => a - b)
const newest = rounds[rounds.length - 1]
{
  const p = 'docs/now-next-later.md'
  const lines = read(p).split('\n')
  const i = lines.findIndex((l) => /THE LIVE WAVE IS ROUND (\d+)/.test(l))
  if (i < 0) fail.push(`${p} carries no machine-checked live-wave line – add «⚙ THE LIVE WAVE IS ROUND <n>» under Now, or retire this check`)
  else {
    const said = Number(/THE LIVE WAVE IS ROUND (\d+)/.exec(lines[i])[1])
    if (said !== newest) fail.push(`${p}:${i + 1} says the live wave is round ${said}; docs/rounds' newest ledger is round-${newest}.md`)
  }
}

if (fail.length) {
  console.error('doc facts: STALE – a fact a machine can source must be sourced')
  for (const f of fail) console.error('  ' + f)
  process.exit(1)
}
console.log(`doc facts: ok – schema v${schema}, live wave round ${newest}`)
