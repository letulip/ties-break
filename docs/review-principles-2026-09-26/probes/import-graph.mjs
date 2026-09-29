#!/usr/bin/env node
// Phase 0a probe – the src import graph behind 00-baseline.md §A3 (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repository root of a checkout with node_modules – it imports the repo's own `typescript`):
//   node docs/review-principles-2026-09-26/probes/import-graph.mjs <raw-out-dir>
// Writes <raw-out-dir>/edges.json, <raw-out-dir>/sccs.json, <raw-out-dir>/world-exports.json and prints the
// markdown tables to stdout.
//
// RULES
//   Files: every tracked src/**/*.ts and src/**/*.vue (`git ls-files src`). For .vue, every <script …> block.
//   Parsed with the TypeScript parser (no regex over text, so imports inside comments are never counted):
//     - ImportDeclaration          `import … from 'x'`, `import 'x'`
//     - ExportDeclaration with a module specifier   `export … from 'x'`
//     - CallExpression import('x') with a string-literal argument (dynamic import) – always runtime
//     - `import x = require('x')` (ImportEqualsDeclaration with an external module reference)
//   Type-only: `import type …`, `export type … from`, or a named import/export whose EVERY specifier carries an
//     inline `type` and that has no default or namespace binding. Everything else, side-effect imports included,
//     is runtime. (Syntax only: an unmarked import of a name that happens to be a type is still "runtime" here.)
//   Resolution of a relative specifier (query such as `?url` stripped): exact file, then +.ts, +.vue, +.d.ts,
//     .js→.ts, /index.ts. A resolved .ts/.vue under src is a module node; anything else (css, svg, json, png,
//     a file outside src) is an asset edge and is left out of the graph. Non-relative specifiers are packages.
//   Edges: one per (importer, target) pair; the pair is runtime if ANY of its statements is runtime.
//   Layers: engine, worker, shared, db, stores, composables, components, prologue, art, audio, viz,
//     pwa (src/pwa.ts), other (App.vue, main.ts, buildStamp.ts, vite-env.d.ts).
//   Intended direction: engine / worker / shared / db never import a UI layer (stores, composables,
//     components, prologue, art, audio, viz, pwa, other), nor 'vue' / 'pinia' / '*.vue'; the engine never
//     imports worker, db or stores.
//   SCCs: Tarjan over module nodes, once over runtime edges only, once over all edges.

import { execFileSync } from 'node:child_process'
import { existsSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const outDir = process.argv[2]
if (!outDir) { console.error('usage: import-graph.mjs <raw-out-dir>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })

const files = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|vue)$/.test(f))
const fileSet = new Set(files)

export function layerOf(f) {
  const p = f.replace(/^src\//, '')
  if (p === 'pwa.ts') return 'pwa'
  const m = p.match(/^([^/]+)\//)
  if (m) return m[1]
  return 'other'
}
const LAYERS = ['engine', 'worker', 'shared', 'db', 'stores', 'composables', 'components', 'prologue', 'art', 'audio', 'viz', 'pwa', 'other']
const CORE = new Set(['engine', 'worker', 'shared', 'db'])
const UI = new Set(LAYERS.filter((l) => !CORE.has(l)))

function scriptBlocks(file, text) {
  if (!file.endsWith('.vue')) return [text]
  return [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
}

function resolve(from, spec) {
  const clean = spec.replace(/[?#].*$/, '')
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), clean))
  const cands = [base, `${base}.ts`, `${base}.vue`, `${base}.d.ts`, base.replace(/\.js$/, '.ts'), `${base}/index.ts`]
  for (const c of cands) if (fileSet.has(c)) return { kind: 'module', target: c }
  for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return { kind: 'asset', target: c }
  return { kind: 'unresolved', target: base }
}

function allTypeSpecifiers(elements) {
  return elements.length > 0 && elements.every((e) => e.isTypeOnly)
}

const statements = [] // {from, spec, typeOnly, how}
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const block of scriptBlocks(file, text)) {
    const sf = ts.createSourceFile(file, block, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
    const visit = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const c = node.importClause
        let typeOnly = false
        if (c) {
          if (c.isTypeOnly) typeOnly = true
          else if (!c.name && c.namedBindings && ts.isNamedImports(c.namedBindings) && allTypeSpecifiers(c.namedBindings.elements)) typeOnly = true
        }
        statements.push({ from: file, spec: node.moduleSpecifier.text, typeOnly, how: 'import' })
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        let typeOnly = node.isTypeOnly
        if (!typeOnly && node.exportClause && ts.isNamedExports(node.exportClause) && allTypeSpecifiers(node.exportClause.elements)) typeOnly = true
        statements.push({ from: file, spec: node.moduleSpecifier.text, typeOnly, how: 'export-from' })
      } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && ts.isStringLiteral(node.moduleReference.expression)) {
        statements.push({ from: file, spec: node.moduleReference.expression.text, typeOnly: node.isTypeOnly, how: 'import-equals' })
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        statements.push({ from: file, spec: node.arguments[0].text, typeOnly: false, how: 'dynamic' })
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
        statements.push({ from: file, spec: node.argument.literal.text, typeOnly: true, how: 'import-type-node' })
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
}

// Resolve and fold into pair edges.
const edges = new Map() // key from|to -> {from,to,runtime,statements,hows}
const packages = new Map() // layer -> Map(pkg -> {runtime,type})
const assets = []
const unresolved = []
for (const s of statements) {
  if (s.spec.startsWith('.')) {
    const r = resolve(s.from, s.spec)
    if (r.kind === 'module') {
      const key = `${s.from}|${r.target}`
      const e = edges.get(key) ?? { from: s.from, to: r.target, runtime: false, statements: 0, hows: new Set() }
      e.runtime ||= !s.typeOnly
      e.statements++
      e.hows.add(s.how)
      edges.set(key, e)
    } else if (r.kind === 'asset') assets.push({ from: s.from, spec: s.spec, target: r.target })
    else unresolved.push({ from: s.from, spec: s.spec })
  } else {
    const pkg = s.spec.startsWith('@') ? s.spec.split('/').slice(0, 2).join('/') : s.spec.split('/')[0]
    const layer = layerOf(s.from)
    const m = packages.get(layer) ?? new Map()
    const v = m.get(pkg) ?? { runtime: 0, type: 0 }
    if (s.typeOnly) v.type++; else v.runtime++
    m.set(pkg, v)
    packages.set(layer, m)
  }
}
const edgeList = [...edges.values()].map((e) => ({ ...e, hows: [...e.hows] }))
writeFileSync(path.join(outDir, 'edges.json'), JSON.stringify({ statements: statements.length, edges: edgeList, assets, unresolved }, null, 1))

const out = []
const P = (s = '') => out.push(s)
P(`Parsed ${files.length} files, ${statements.length} import/export-from/dynamic statements → ${edgeList.length} module pair edges (${edgeList.filter((e) => e.runtime).length} runtime, ${edgeList.filter((e) => !e.runtime).length} type-only), ${assets.length} asset edges, ${unresolved.length} unresolved relative specifiers${unresolved.length ? ': ' + unresolved.map((u) => `${u.from} → ${u.spec}`).join('; ') : ''}.`)
P(`Dynamic import() statements: ${statements.filter((s) => s.how === 'dynamic').length} (${[...new Set(statements.filter((s) => s.how === 'dynamic').map((s) => `${s.from} → ${s.spec}`))].join('; ')}).`)
P()

// Layer matrix
const mat = {}
for (const a of LAYERS) { mat[a] = {}; for (const b of LAYERS) mat[a][b] = { r: 0, t: 0 } }
for (const e of edgeList) {
  const a = layerOf(e.from), b = layerOf(e.to)
  if (e.runtime) mat[a][b].r++; else mat[a][b].t++
}
P('**Layer matrix** – rows import columns; each cell is `runtime / type-only` unique file-pair edges; `·` = none.')
P()
P(`| from \\ to | ${LAYERS.join(' | ')} |`)
P(`| --- | ${LAYERS.map(() => '---:').join(' | ')} |`)
for (const a of LAYERS) P(`| **${a}** | ${LAYERS.map((b) => (mat[a][b].r || mat[a][b].t ? `${mat[a][b].r} / ${mat[a][b].t}` : '·')).join(' | ')} |`)
P()

// Packages per layer
P('**External packages per layer** – statements, `runtime / type-only`.')
P()
P('| layer | packages |')
P('| --- | --- |')
for (const l of LAYERS) {
  const m = packages.get(l)
  if (!m) continue
  P(`| ${l} | ${[...m.entries()].sort((x, y) => y[1].runtime + y[1].type - x[1].runtime - x[1].type).map(([k, v]) => `\`${k}\` ${v.runtime}/${v.type}`).join(', ')} |`)
}
P()

// Direction violations
const bad = []
for (const e of edgeList) {
  const a = layerOf(e.from), b = layerOf(e.to)
  if (CORE.has(a) && (UI.has(b) || e.to.endsWith('.vue'))) bad.push({ ...e, why: `${a} → UI layer ${b}` })
  else if (a === 'engine' && ['worker', 'db', 'stores'].includes(b)) bad.push({ ...e, why: `engine → ${b}` })
}
const badPkgs = []
for (const l of CORE) for (const [pkg, v] of packages.get(l) ?? []) if (/^(vue|pinia|@vue\/|vue-)/.test(pkg)) badPkgs.push(`${l} → ${pkg} (${v.runtime}/${v.type})`)
P(`**Edges against the intended direction**: ${bad.length} module edges${bad.length ? ': ' + bad.map((e) => `\`${e.from}\` → \`${e.to}\` (${e.runtime ? 'runtime' : 'type-only'}; ${e.why})`).join('; ') : ''}; ${badPkgs.length} core→UI-framework package imports${badPkgs.length ? ': ' + badPkgs.join('; ') : ''}.`)
P()

// Other cross-layer edges worth listing: worker/shared/db → engine etc. are allowed; list core-to-core counts.
// SCCs
function tarjan(nodes, adj) {
  let index = 0
  const idx = new Map(), low = new Map(), onStack = new Set(), stack = [], comps = []
  for (const root of nodes) {
    if (idx.has(root)) continue
    const work = [[root, 0]]
    idx.set(root, index); low.set(root, index); index++; stack.push(root); onStack.add(root)
    while (work.length) {
      const frame = work[work.length - 1]
      const [v, i] = frame
      const succ = adj.get(v) ?? []
      if (i < succ.length) {
        frame[1]++
        const w = succ[i]
        if (!idx.has(w)) { idx.set(w, index); low.set(w, index); index++; stack.push(w); onStack.add(w); work.push([w, 0]) }
        else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)))
      } else {
        work.pop()
        if (work.length) { const u = work[work.length - 1][0]; low.set(u, Math.min(low.get(u), low.get(v))) }
        if (low.get(v) === idx.get(v)) {
          const comp = []
          let w
          do { w = stack.pop(); onStack.delete(w); comp.push(w) } while (w !== v)
          if (comp.length > 1) comps.push(comp.sort())
        }
      }
    }
  }
  return comps.sort((a, b) => b.length - a.length)
}
const adjOf = (pred) => {
  const adj = new Map()
  for (const e of edgeList) if (pred(e)) { const l = adj.get(e.from) ?? []; l.push(e.to); adj.set(e.from, l) }
  return adj
}
const sccRuntime = tarjan(files, adjOf((e) => e.runtime))
const sccAll = tarjan(files, adjOf(() => true))
const selfLoops = edgeList.filter((e) => e.from === e.to)
writeFileSync(path.join(outDir, 'sccs.json'), JSON.stringify({ runtime: sccRuntime, all: sccAll, selfLoops }, null, 1))
const short = (f) => f.replace(/^src\//, '')
const sccTable = (name, comps) => {
  P(`**SCCs over ${name}**: ${comps.length} components of size > 1, covering ${comps.reduce((a, c) => a + c.length, 0)} files; sizes ${comps.map((c) => c.length).join(', ') || '–'}.`)
  P()
  if (!comps.length) return
  P('| # | size | layers | members |')
  P('| ---: | ---: | --- | --- |')
  comps.slice(0, 20).forEach((c, i) => {
    const layers = [...new Set(c.map(layerOf))].join(', ')
    const members = c.length > 40 ? `${c.slice(0, 40).map((f) => `\`${short(f)}\``).join(', ')} … (+${c.length - 40}, full list in sccs.json)` : c.map((f) => `\`${short(f)}\``).join(', ')
    P(`| ${i + 1} | ${c.length} | ${layers} | ${members} |`)
  })
  P()
}
sccTable('runtime edges', sccRuntime)
sccTable('all edges (runtime + type-only)', sccAll)

// Which edges close the largest all-edge SCC through the barrel? count edges inside SCCs by kind
for (const [name, comps] of [['runtime', sccRuntime], ['all', sccAll]]) {
  for (const c of comps.slice(0, 3)) {
    const set = new Set(c)
    const inside = edgeList.filter((e) => set.has(e.from) && set.has(e.to))
    P(`- ${name} SCC of ${c.length}: ${inside.length} internal edges (${inside.filter((e) => e.runtime).length} runtime, ${inside.filter((e) => !e.runtime).length} type-only); edges into \`engine/world.ts\` from inside it: ${inside.filter((e) => e.to === 'src/engine/world.ts').length} (${inside.filter((e) => e.to === 'src/engine/world.ts' && e.runtime).length} runtime).`)
  }
}
P()

// Fan-in / fan-out
const fin = new Map(), fout = new Map()
for (const e of edgeList) {
  const a = fin.get(e.to) ?? { r: 0, t: 0 }; if (e.runtime) a.r++; else a.t++; fin.set(e.to, a)
  const b = fout.get(e.from) ?? { r: 0, t: 0 }; if (e.runtime) b.r++; else b.t++; fout.set(e.from, b)
}
const top = (m) => [...m.entries()].sort((x, y) => y[1].r + y[1].t - x[1].r - x[1].t).slice(0, 15)
const ti = top(fin), to = top(fout)
P('**Fan-in and fan-out, top 15** – distinct src modules importing it / imported by it, `total (runtime / type-only)`.')
P()
P('| # | fan-in module | in | fan-out module | out |')
P('| ---: | --- | ---: | --- | ---: |')
for (let i = 0; i < 15; i++) {
  const a = ti[i], b = to[i]
  P(`| ${i + 1} | \`${short(a[0])}\` | ${a[1].r + a[1].t} (${a[1].r} / ${a[1].t}) | \`${short(b[0])}\` | ${b[1].r + b[1].t} (${b[1].r} / ${b[1].t}) |`)
}
P()

// world.ts exports
const W = 'src/engine/world.ts'
const wText = readFileSync(W, 'utf8')
const wsf = ts.createSourceFile(W, wText, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
const importedFrom = new Map() // local name -> module spec
for (const st of wsf.statements) {
  if (ts.isImportDeclaration(st) && st.importClause) {
    const spec = st.moduleSpecifier.text
    if (st.importClause.name) importedFrom.set(st.importClause.name.text, spec)
    const nb = st.importClause.namedBindings
    if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) importedFrom.set(el.name.text, spec)
    if (nb && ts.isNamespaceImport(nb)) importedFrom.set(nb.name.text, spec)
  }
}
const exportsList = [] // {name, source: 'local'|spec, kind, typeOnly}
const localKinds = []
const lineOf = (pos) => wsf.getLineAndCharacterOfPosition(pos).line + 1
for (const st of wsf.statements) {
  if (ts.isExportDeclaration(st)) {
    const typeOnly = st.isTypeOnly
    const spec = st.moduleSpecifier ? st.moduleSpecifier.text : null
    if (!st.exportClause) { exportsList.push({ name: '*', source: spec, typeOnly, via: 'export * from' }); continue }
    for (const el of st.exportClause.elements) {
      const local = (el.propertyName ?? el.name).text
      const src = spec ?? importedFrom.get(local) ?? 'local'
      exportsList.push({ name: el.name.text, source: src, typeOnly: typeOnly || el.isTypeOnly, via: spec ? 'export … from' : 'import + export { }' })
    }
    continue
  }
  if (ts.isImportDeclaration(st)) continue
  const exported = st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  const span = lineOf(st.getEnd()) - lineOf(st.getStart()) + 1
  let kind = ts.SyntaxKind[st.kind]
  const names = []
  if (ts.isFunctionDeclaration(st)) { kind = 'function'; names.push(st.name?.text) }
  else if (ts.isVariableStatement(st)) { kind = 'const/let'; for (const d of st.declarationList.declarations) names.push(d.name.getText(wsf)) }
  else if (ts.isTypeAliasDeclaration(st)) { kind = 'type'; names.push(st.name.text) }
  else if (ts.isInterfaceDeclaration(st)) { kind = 'interface'; names.push(st.name.text) }
  else if (ts.isClassDeclaration(st)) { kind = 'class'; names.push(st.name?.text) }
  localKinds.push({ kind, names, exported: !!exported, start: lineOf(st.getStart()), end: lineOf(st.getEnd()), span })
  if (exported) for (const n of names) exportsList.push({ name: n, source: 'local', typeOnly: kind === 'type' || kind === 'interface', via: 'declaration' })
}
writeFileSync(path.join(outDir, 'world-exports.json'), JSON.stringify({ exportsList, localKinds }, null, 1))
const bySource = new Map()
for (const e of exportsList) {
  const k = e.source === 'local' ? 'declared in world.ts' : e.source.startsWith('./world/') ? 'world/* modules' : `other modules`
  const v = bySource.get(k) ?? { values: 0, types: 0 }
  if (e.typeOnly) v.types++; else v.values++
  bySource.set(k, v)
}
const names = new Set(exportsList.map((e) => e.name))
P(`**\`engine/world.ts\` exports** (TypeScript AST over the file): ${exportsList.length} exported names (${names.size} distinct), ${exportsList.filter((e) => e.name === '*').length} \`export *\`.`)
P()
P('| exported from | values | types |')
P('| --- | ---: | ---: |')
for (const [k, v] of bySource) P(`| ${k} | ${v.values} | ${v.types} |`)
const otherMods = new Map()
for (const e of exportsList) if (e.source !== 'local' && !e.source.startsWith('./world/')) otherMods.set(e.source, (otherMods.get(e.source) ?? 0) + 1)
P()
P(`Re-exports from outside world/*: ${[...otherMods.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}.`)
const worldMods = new Set(exportsList.filter((e) => e.source.startsWith('./world/')).map((e) => e.source))
P(`world/* modules re-exported through the barrel: ${worldMods.size} of ${files.filter((f) => f.startsWith('src/engine/world/')).length}.`)
P()
const kindSum = new Map()
for (const k of localKinds) {
  const key = `${k.kind}${k.exported ? ' (exported)' : ' (internal)'}`
  const v = kindSum.get(key) ?? { n: 0, lines: 0 }
  v.n++; v.lines += k.span
  kindSum.set(key, v)
}
P('**What remains in `world.ts`** besides imports and re-exports – top-level declarations, count and physical lines they span (JSDoc above a declaration is not inside its span):')
P()
P('| kind | count | lines spanned |')
P('| --- | ---: | ---: |')
for (const [k, v] of [...kindSum.entries()].sort((a, b) => b[1].lines - a[1].lines)) P(`| ${k} | ${v.n} | ${v.lines} |`)
P()
P('Largest top-level declarations: ' + localKinds.slice().sort((a, b) => b.span - a.span).slice(0, 12).map((k) => `\`${k.names.join(',')}\` (${k.kind}, ${k.start}–${k.end}, ${k.span} lines)`).join('; ') + '.')
console.log(out.join('\n'))
