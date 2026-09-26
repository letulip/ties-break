// Lane A probe (26.09 review, baseline 03d92221). Read-only; imports no repo code (only the repo's
// own `typescript` package for parsing).
//
// Cohesion of src/engine/world/lifeBeat.ts by its OWN numbered section headers. Every top-level
// declaration is assigned to the section it sits in (the `// N. TITLE` / `// 3x. TITLE` banners),
// and every identifier reference from one top-level declaration to another is counted as an edge
// within or across sections. Output: per section – lines, declarations, exports; and the
// cross-section edge matrix. A section with few outbound edges is a span-move candidate.
//
// Usage (from the baseline worktree): node <this> src/engine/world/lifeBeat.ts
import ts from 'typescript'
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const text = readFileSync(file, 'utf8')
const lines = text.split('\n')
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)

// Sections: a banner line `// =====` followed by `// <id>. TITLE` where id is 1..16 or 3a..3m / 3c-2.
const sections = [{ id: 'head', start: 1 }]
for (let i = 0; i < lines.length - 1; i++) {
  if (/^\/\/ =+$/.test(lines[i])) {
    const m = lines[i + 1].match(/^\/\/ (\d+[a-z]?(?:-\d)?)\. /)
    if (m) sections.push({ id: m[1], start: i + 2 })
  }
}
const sectionOf = (line) => {
  let s = sections[0]
  for (const x of sections) if (x.start <= line) s = x
  return s.id
}

const decls = new Map() // name -> {section, exported, line}
for (const st of sf.statements) {
  const line = sf.getLineAndCharacterOfPosition(st.getStart()).line + 1
  const exported = !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  const names = []
  if (ts.isFunctionDeclaration(st) && st.name) names.push(st.name.text)
  else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.push(d.name.text)
  else if ((ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) && st.name) names.push(st.name.text)
  for (const n of names) decls.set(n, { section: sectionOf(line), exported, line, node: st })
}

const edges = new Map() // "a->b" -> count
for (const [name, d] of decls) {
  const seen = new Set()
  const visit = (node) => {
    if (ts.isIdentifier(node) && decls.has(node.text) && node.text !== name && !seen.has(node.text)) {
      seen.add(node.text)
      const to = decls.get(node.text).section
      if (to !== d.section) {
        const k = `${d.section} -> ${to}`
        edges.set(k, (edges.get(k) ?? 0) + 1)
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(d.node, visit)
}

console.log(`file ${file}: ${lines.length} lines, ${decls.size} top-level declarations, ${sections.length} sections`)
console.log('section | first line | lines | decls | exported')
sections.forEach((s, i) => {
  const end = i + 1 < sections.length ? sections[i + 1].start - 1 : lines.length
  const ds = [...decls.values()].filter((d) => d.section === s.id)
  console.log(`${s.id} | ${s.start} | ${end - s.start + 1} | ${ds.length} | ${ds.filter((d) => d.exported).length}`)
})
console.log('cross-section references (declaration-level, distinct targets):')
for (const [k, v] of [...edges].sort((a, b) => b[1] - a[1])) console.log(`${k} | ${v}`)
const out = new Map(), inn = new Map()
for (const [k, v] of edges) {
  const [a, b] = k.split(' -> ')
  out.set(a, (out.get(a) ?? 0) + v)
  inn.set(b, (inn.get(b) ?? 0) + v)
}
console.log('section | out | in')
for (const s of sections) console.log(`${s.id} | ${out.get(s.id) ?? 0} | ${inn.get(s.id) ?? 0}`)
