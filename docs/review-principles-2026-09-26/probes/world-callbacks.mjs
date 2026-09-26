// Lane A probe (26.09 review, baseline 03d92221): P4's own method, re-run on what is left in
// src/engine/world.ts. For every top-level function / const DECLARED in world.ts (not imported,
// not re-exported), list the other world.ts-local declarations its body references (comments are
// not identifiers, so prose never counts) and who inside world.ts calls it. A block with 0 local
// call-backs is a mechanical span-move candidate under P4's rule; >0 needs the callee moved down
// first (P4 field notes, "move the something DOWN").
//   node world-callbacks.mjs [path-to-world.ts]    (run from the repo root; uses the repo's typescript)
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('package.json'))
const ts = require('typescript')
const file = process.argv[2] ?? 'src/engine/world.ts'
const text = readFileSync(file, 'utf8')
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)

const decls = new Map() // name -> { node, kind, exported, lines }
for (const st of sf.statements) {
  const exported = !!(ts.canHaveModifiers(st) && ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
  const lines = (n) => sf.getLineAndCharacterOfPosition(n.getEnd()).line - sf.getLineAndCharacterOfPosition(n.getStart()).line + 1
  if (ts.isFunctionDeclaration(st) && st.name) decls.set(st.name.text, { node: st, kind: 'function', exported, lines: lines(st) })
  else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) decls.set(d.name.text, { node: d, kind: 'const', exported, lines: lines(st) })
}
const refs = new Map()
for (const [name, { node }] of decls) {
  const seen = new Set()
  const visit = (n) => {
    if (ts.isIdentifier(n) && decls.has(n.text) && n.text !== name) {
      // skip property names (`x.name`) and object keys
      const p = n.parent
      const isProp = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n)
      if (!isProp) seen.add(n.text)
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  refs.set(name, seen)
}
const callers = new Map([...decls.keys()].map((k) => [k, []]))
for (const [name, set] of refs) for (const r of set) callers.get(r).push(name)
const rows = [...decls.entries()].map(([name, d]) => ({ name, kind: d.kind, exported: d.exported, lines: d.lines, callbacks: [...refs.get(name)], calledBy: callers.get(name) }))
rows.sort((a, b) => b.lines - a.lines)
console.log(`world.ts-local declarations: ${rows.length} (${rows.filter((r) => r.kind === 'function').length} functions, ${rows.filter((r) => r.kind === 'const').length} consts)`)
console.log('name\tkind\texported\tlines\tlocal call-backs\tcalled by (inside world.ts)')
for (const r of rows) console.log(`${r.name}\t${r.kind}\t${r.exported ? 'yes' : 'no'}\t${r.lines}\t${r.callbacks.length} [${r.callbacks.join(', ')}]\t[${r.calledBy.join(', ')}]`)
