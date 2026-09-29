#!/usr/bin/env node
// Lane C probe – function size and parameter count in the engine LEAF modules (review of 26.09.2026, baseline 03d92221).
// Usage (repo root with node_modules): node docs/review-principles-2026-09-26/probes/leaf-functions.mjs
// Scope as leaf-exports.mjs. For every function declaration, method, arrow function or function expression assigned
// at any depth: CODE lines (lines in its span that carry a non-comment token – measured with the TypeScript scanner,
// so comment-only lines never count), total span lines, parameter count, and positional boolean parameters.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const EXCLUDE = new Set(['src/engine/world.ts', 'src/engine/migrations.ts', 'src/engine/saveCodec.ts', 'src/engine/saveGuard.ts', 'src/engine/rng.ts'])
const files = execFileSync('git', ['ls-files', 'src/engine'], { encoding: 'utf8' }).split('\n')
  .filter((f) => !EXCLUDE.has(f) && (/^src\/engine\/[^/]+\.ts$/.test(f) || /^src\/engine\/(match|season|diary)\/[^/]+\.ts$/.test(f)))
const rows = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.ES2022, true)
  // code-line set: lines carrying a real token – found by walking the AST down to its token leaves (JSDoc nodes
  // skipped), so comment text, template contents and regexes are classified by the parser, not guessed.
  const codeLines = new Set()
  const mark = (n) => {
    if (n.kind >= ts.SyntaxKind.FirstJSDocNode && n.kind <= ts.SyntaxKind.LastJSDocNode) return
    const kids = n.getChildren(sf)
    if (kids.length === 0) {
      const a = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line, b = sf.getLineAndCharacterOfPosition(n.getEnd()).line
      if (n.kind === ts.SyntaxKind.EndOfFileToken) return
      for (let l = a; l <= b; l++) codeLines.add(l)
      return
    }
    for (const k of kids) mark(k)
  }
  mark(sf)
  const visit = (n, owner) => {
    let name = null
    if (ts.isFunctionDeclaration(n) && n.name) name = n.name.text
    else if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name)) name = n.name.text
    else if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && n.parent && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) name = n.parent.name.text
    if (name && n.body) {
      const a = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line, b = sf.getLineAndCharacterOfPosition(n.getEnd()).line
      let code = 0
      for (let l = a; l <= b; l++) if (codeLines.has(l)) code++
      const bools = n.parameters.filter((p) => p.type && p.type.kind === ts.SyntaxKind.BooleanKeyword).length
      rows.push({ file: f, line: a + 1, name: owner ? `${owner}>${name}` : name, code, span: b - a + 1, params: n.parameters.length, bools })
    }
    ts.forEachChild(n, (c) => visit(c, name && n.body ? name : owner))
  }
  visit(sf, null)
}
rows.sort((x, y) => y.code - x.code)
console.log(`functions: ${rows.length} in ${files.length} files; over 80 code lines: ${rows.filter((r) => r.code > 80).length}; over 150: ${rows.filter((r) => r.code > 150).length}`)
console.log('\n## top 25 by code lines\nfile:line\tname\tcode\tspan\tparams')
for (const r of rows.slice(0, 25)) console.log(`${r.file}:${r.line}\t${r.name}\t${r.code}\t${r.span}\t${r.params}`)
console.log('\n## parameter lists over 5, or 2+ positional booleans')
for (const r of rows.filter((r) => r.params > 5 || r.bools >= 2).sort((x, y) => y.params - x.params)) console.log(`${r.file}:${r.line}\t${r.name}\tparams ${r.params}\tbooleans ${r.bools}`)
