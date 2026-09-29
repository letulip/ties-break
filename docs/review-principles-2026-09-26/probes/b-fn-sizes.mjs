// Lane B probe (26.09 review, baseline 03d92221). Read-only.
// Usage (from the worktree root):
//   node <this> sizes <files...>            -> every function-like node: file:line name codeLines params
//   node <this> body <name> <files...>      -> the named function's CODE lines (comment-only and blank lines dropped)
// A "code line" = a line of the node's span that is not blank and not comment-only (same rule as
// line-classifier.mjs: trimmed line starting //, /*, * or inside a block comment is a comment).
import ts from 'typescript'
import { readFileSync } from 'node:fs'

const [mode, ...rest] = process.argv.slice(2)
const wanted = mode === 'body' ? rest.shift() : null
const files = rest

function classify(lines) {
  const code = []
  let inBlock = false
  for (const raw of lines) {
    const t = raw.trim()
    if (inBlock) { if (t.includes('*/')) inBlock = false; code.push(false); continue }
    if (t === '') { code.push(false); continue }
    if (t.startsWith('//') || t.startsWith('*')) { code.push(false); continue }
    if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; code.push(false); continue }
    code.push(true)
  }
  return code
}

const out = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const isCode = classify(lines)
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const visit = (node, owner) => {
    let name = null
    if (ts.isFunctionDeclaration(node) && node.name) name = node.name.text
    else if (ts.isMethodDeclaration(node) && node.name) name = node.name.getText(sf)
    else if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) name = node.parent.name.text
    if (name) {
      const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line
      const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line
      let codeLines = 0
      for (let i = start; i <= end; i++) if (isCode[i]) codeLines++
      const rec = { file, line: start + 1, end: end + 1, name: owner ? `${owner}>${name}` : name, span: end - start + 1, codeLines, params: node.parameters?.length ?? 0 }
      out.push(rec)
      if (wanted && name === wanted) {
        console.log(`// ${file}:${start + 1}-${end + 1} (${codeLines} code lines of ${end - start + 1})`)
        for (let i = start; i <= end; i++) if (isCode[i]) console.log(`${i + 1}: ${lines[i]}`)
      }
      ts.forEachChild(node, (c) => visit(c, owner ? `${owner}>${name}` : name))
      return
    }
    ts.forEachChild(node, (c) => visit(c, owner))
  }
  visit(sf, null)
}
if (mode === 'sizes') {
  const top = out.filter((r) => !r.name.includes('>'))
  top.sort((a, b) => b.codeLines - a.codeLines)
  console.log(`functions (top-level named): ${top.length}; over 50 code lines: ${top.filter((r) => r.codeLines > 50).length}; over 100: ${top.filter((r) => r.codeLines > 100).length}`)
  for (const r of top.slice(0, 40)) console.log(`${r.codeLines}\t${r.span}\t${r.params}\t${r.file}:${r.line}\t${r.name}`)
}
