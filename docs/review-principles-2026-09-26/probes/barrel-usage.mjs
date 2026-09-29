// Lane A probe (26.09 review, baseline 03d92221): which of `engine/world.ts`'s exported names are
// actually imported THROUGH the barrel, by whom, and how many barrel importers take only names that
// live in a tiny module. Parses with the repo's own `typescript` (run from the repo root), so imports
// inside comments never count. `.vue` files: the <script> blocks are parsed.
//   node barrel-usage.mjs <world-exports.json> <out.json>
// world-exports.json is Phase 0's AST export list of src/engine/world.ts (RAW/graph/world-exports.json).
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, resolve, relative } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(resolve('package.json'))
const ts = require('typescript')
const [, , exportsPath, outPath] = process.argv
const { exportsList } = JSON.parse(readFileSync(exportsPath, 'utf8'))
const source = new Map(exportsList.map((e) => [e.name, e.source]))
const WORLD = resolve('src/engine/world.ts')

const files = execSync('git ls-files src tests tools scripts e2e', { encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(ts|mts|vue)$/.test(f) && !f.endsWith('.d.ts'))

const used = new Map() // name -> Set(file)
const perFile = [] // { file, root, names:[], namespace:boolean }
for (const f of files) {
  let text = readFileSync(f, 'utf8')
  if (f.endsWith('.vue')) {
    text = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
  }
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const names = []
  let namespace = false
  let hit = false
  for (const st of sf.statements) {
    if (!(ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) || !st.moduleSpecifier) continue
    const spec = st.moduleSpecifier.text
    if (!spec.startsWith('.')) continue
    const target = resolve(dirname(f), spec)
    if (target !== WORLD.replace(/\.ts$/, '') && target !== WORLD) continue
    hit = true
    if (ts.isImportDeclaration(st)) {
      const c = st.importClause
      if (!c) continue
      if (c.name) names.push('default')
      const nb = c.namedBindings
      if (nb && ts.isNamespaceImport(nb)) namespace = true
      else if (nb) for (const el of nb.elements) names.push((el.propertyName ?? el.name).text)
    } else {
      const ec = st.exportClause
      if (!ec) namespace = true
      else if (ts.isNamedExports(ec)) for (const el of ec.elements) names.push((el.propertyName ?? el.name).text)
      else namespace = true
    }
  }
  if (!hit) continue
  for (const n of names) {
    if (!used.has(n)) used.set(n, new Set())
    used.get(n).add(f)
  }
  perFile.push({ file: f, root: f.split('/')[0], names: [...new Set(names)], namespace })
}

const all = exportsList.map((e) => e.name)
const never = all.filter((n) => !used.has(n))
const byRoot = {}
for (const p of perFile) byRoot[p.root] = (byRoot[p.root] ?? 0) + 1
// Per importer: how many distinct owning modules its names come from.
const owners = perFile.map((p) => new Set(p.names.map((n) => source.get(n) ?? '(world.ts itself)')))
const oneOwner = perFile.filter((p, i) => !p.namespace && owners[i].size === 1).length
const ns = perFile.filter((p) => p.namespace).length
const sizeHist = {}
for (const p of perFile) { const k = p.names.length > 10 ? '>10' : String(p.names.length); sizeHist[k] = (sizeHist[k] ?? 0) + 1 }
const srcImporters = perFile.filter((p) => p.root === 'src')
const out = {
  files: perFile.length,
  byRoot,
  exported: all.length,
  importedThroughBarrel: used.size,
  neverImportedThroughBarrel: never.length,
  never,
  neverSample: never.slice(0, 60),
  namespaceImporters: ns,
  importersTakingNamesFromOneOwningModule: oneOwner,
  namesPerImporterHistogram: sizeHist,
  topNames: [...used.entries()].map(([n, s]) => [n, s.size, source.get(n) ?? '(world.ts)']).sort((a, b) => b[1] - a[1]).slice(0, 25),
  srcImporters: srcImporters.map((p) => ({ file: p.file, names: p.names, owners: [...new Set(p.names.map((n) => source.get(n) ?? '(world.ts)'))] })),
}
writeFileSync(outPath, JSON.stringify(out, null, 1))
console.log(JSON.stringify({ ...out, srcImporters: undefined, neverSample: out.neverSample.slice(0, 20) }, null, 1))
