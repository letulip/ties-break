// Lane A probe (26.09 review, baseline 03d92221): the exported names of src/engine/world.ts at any
// commit, by the repo's own `typescript` AST (named re-exports + exported declarations). Used to
// separate the barrel's HISTORICAL names (those world.ts exported before the decomposition began,
// b7a9358b, 31.07) from names added to it since.
//   node world-exports-at.mjs <rev> [<rev> ...]     (run from the repo root)
// Prints, per rev, the count; with two revs, also how many names of the second are absent from the first.
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('package.json'))
const ts = require('typescript')
function namesAt(rev) {
  const text = execSync(`git cat-file -p ${rev}:src/engine/world.ts`, { encoding: 'utf8', maxBuffer: 64 << 20 })
  const sf = ts.createSourceFile('world.ts', text, ts.ScriptTarget.Latest, false)
  const names = new Set()
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
      for (const el of st.exportClause.elements) names.add(el.name.text)
      continue
    }
    const mods = ts.canHaveModifiers(st) ? ts.getModifiers(st) : undefined
    if (!mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
    if (st.name) names.add(st.name.text)
    else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text)
  }
  return names
}
const revs = process.argv.slice(2)
const sets = revs.map(namesAt)
revs.forEach((r, i) => console.log(`${r}: ${sets[i].size} exported names`))
if (sets.length === 2) {
  const added = [...sets[1]].filter((n) => !sets[0].has(n))
  const kept = [...sets[1]].filter((n) => sets[0].has(n))
  console.log(`of ${revs[1]}'s ${sets[1].size}: ${kept.length} were exported at ${revs[0]}, ${added.length} were added since`)
}
