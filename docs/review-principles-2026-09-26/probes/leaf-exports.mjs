#!/usr/bin/env node
// Lane C probe – exports of the engine LEAF modules and who consumes them (review of 26.09.2026, baseline 03d92221).
//
// Usage (from the repository root of a checkout with node_modules – it imports the repo's own `typescript`):
//   node docs/review-principles-2026-09-26/probes/leaf-exports.mjs <raw-out-dir>
//
// SCOPE: the leaf modules of lane C – every tracked src/engine/*.ts except world.ts, migrations.ts, saveCodec.ts,
// saveGuard.ts and rng.ts (lanes B/D), plus src/engine/match/*, src/engine/season/*, src/engine/diary/*.
// METHOD: one TypeScript program over every tracked .ts in src, tests, tools, e2e and every src .vue as a virtual
// `<file>.vue.ts` (its <script> blocks; template expressions appended as `void (…)` statements). Every identifier in
// every file is resolved with `checker.getSymbolAtLocation`, following import/re-export aliases to the original
// symbol; a reference is counted against the export whose declaration it resolves to, by the file it sits in.
// Declarations themselves and the export keyword's own name are not references. Verdicts per export:
//   EXTERNAL-SRC  referenced by another src file (the product consumes it)
//   TEST/TOOL     referenced outside its file only from tests/, tools/ or e2e/
//   INTERNAL      referenced only inside its own file – the `export` keyword has no consumer
//   DEAD          referenced nowhere, not even in its own file
// The world.ts barrel re-exports count as a reference only if a file then imports the name from the barrel
// (aliases are followed to the original symbol, so a barrel import lands on the leaf's export).
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const outDir = process.argv[2]
if (!outDir) { console.error('usage: leaf-exports.mjs <raw-out-dir>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const ROOT = process.cwd()
const tracked = execFileSync('git', ['ls-files', 'src', 'tests', 'tools', 'e2e'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|vue)$/.test(f))
const EXCLUDE = new Set(['src/engine/world.ts', 'src/engine/migrations.ts', 'src/engine/saveCodec.ts', 'src/engine/saveGuard.ts', 'src/engine/rng.ts'])
const isLeaf = (f) => !EXCLUDE.has(f) && (/^src\/engine\/[^/]+\.ts$/.test(f) || /^src\/engine\/(match|season|diary)\/[^/]+\.ts$/.test(f))

const virtual = new Map()
function templateExprs(text) {
  const tpl = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')
  const out = []
  for (const m of tpl.matchAll(/\{\{([\s\S]*?)\}\}/g)) out.push(m[1])
  for (const m of tpl.matchAll(/(?:\sv-[\w-]+(?::[\w-]+)?|\s:[\w-]+|\s@[\w-]+)(?:\.[\w]+)*="([^"]*)"/g)) {
    let e = m[1]; const vf = e.match(/^\s*(?:\([^)]*\)|[\w$]+)\s+(?:in|of)\s+([\s\S]+)$/); if (vf) e = vf[1]; out.push(e)
  }
  return out
}
const rootNames = []
for (const f of tracked) {
  const abs = path.join(ROOT, f)
  if (f.endsWith('.vue')) {
    const text = readFileSync(abs, 'utf8')
    const scripts = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
    virtual.set(abs + '.ts', `${scripts}\nfunction __template__() {\n${templateExprs(text).map((e) => `  void (${e.replace(/\n/g, ' ')});`).join('\n')}\n}\n`)
    rootNames.push(abs + '.ts')
  } else rootNames.push(abs)
}
const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true, skipLibCheck: true, types: [], lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], allowImportingTsExtensions: true }
const host = ts.createCompilerHost(options)
const og = host.getSourceFile.bind(host), oe = host.fileExists.bind(host), orr = host.readFile.bind(host)
host.getSourceFile = (fn, l, e, c) => (virtual.has(fn) ? ts.createSourceFile(fn, virtual.get(fn), l, true, ts.ScriptKind.TS) : og(fn, l, e, c))
host.fileExists = (fn) => virtual.has(fn) || oe(fn)
host.readFile = (fn) => (virtual.has(fn) ? virtual.get(fn) : orr(fn))
const program = ts.createProgram({ rootNames, options, host })
const checker = program.getTypeChecker()
const rel = (sf) => path.relative(ROOT, sf.fileName).replace(/\.vue\.ts$/, '.vue')

// exports of leaf files
const exportsBySym = new Map() // symbol -> {file, name, line, kind, refs: {own, src, other}}
for (const sf of program.getSourceFiles()) {
  const f = rel(sf)
  if (!isLeaf(f)) continue
  const modSym = checker.getSymbolAtLocation(sf)
  if (!modSym) continue
  for (const s of checker.getExportsOfModule(modSym)) {
    if (s.flags & ts.SymbolFlags.Alias) continue // re-exports belong to their origin
    const d = s.declarations?.[0]
    if (!d || d.getSourceFile() !== sf) continue
    const isType = !!(s.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) && !(s.flags & ts.SymbolFlags.Value)
    exportsBySym.set(s, { file: f, name: s.name, line: sf.getLineAndCharacterOfPosition(d.getStart(sf)).line + 1, kind: isType ? 'type' : 'value', own: 0, src: 0, tests: 0, tools: 0, e2e: 0, srcFiles: new Set() })
  }
}
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile || !sf.fileName.startsWith(ROOT) || sf.fileName.includes('node_modules')) continue
  const f = rel(sf)
  const visit = (n) => {
    if (ts.isIdentifier(n)) {
      const p = n.parent
      const isDeclName = p && (p.name === n) && (ts.isFunctionDeclaration(p) || ts.isVariableDeclaration(p) || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p) || ts.isTypeAliasDeclaration(p) || ts.isEnumDeclaration(p))
      const isImportSide = p && (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p))
      if (!isDeclName && !isImportSide) {
        let s = checker.getSymbolAtLocation(n)
        if (s && s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s) } catch { /* */ } }
        const e = s && exportsBySym.get(s)
        if (e) {
          if (f === e.file) e.own++
          else if (f.startsWith('src/')) { e.src++; e.srcFiles.add(f) }
          else e[f.split('/')[0]]++
        }
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}
const rows = [...exportsBySym.values()].map((e) => ({ ...e, srcFiles: [...e.srcFiles], verdict: e.src ? 'EXTERNAL-SRC' : (e.tests || e.tools || e.e2e) ? 'TEST/TOOL' : e.own ? 'INTERNAL' : 'DEAD' }))
const counts = {}
for (const r of rows) { const k = `${r.kind}:${r.verdict}`; counts[k] = (counts[k] ?? 0) + 1 }
writeFileSync(path.join(outDir, 'leaf-exports.json'), JSON.stringify({ baseline: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), counts, rows }, null, 1))
console.log(`# leaf-module exports – ${execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim()}; ${rows.length} exports in ${new Set(rows.map((r) => r.file)).size} files`)
console.log(JSON.stringify(counts))
for (const v of ['DEAD', 'INTERNAL', 'TEST/TOOL']) {
  console.log(`\n## ${v}`)
  for (const r of rows.filter((x) => x.verdict === v)) console.log(`${r.kind}\t${r.file}:${r.line}\t${r.name}\town ${r.own} tests ${r.tests} tools ${r.tools} e2e ${r.e2e}`)
}
