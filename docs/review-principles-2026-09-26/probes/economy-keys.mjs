#!/usr/bin/env node
// Lane C probe – which ECONOMY keys does anything read? (review of 26.09.2026, baseline 03d92221)
//
// Usage (from the repository root of a checkout with node_modules – it imports the repo's own `typescript`):
//   node docs/review-principles-2026-09-26/probes/economy-keys.mjs <raw-out-dir>
// Writes <raw-out-dir>/economy-keys.json and prints a markdown summary to stdout.
//
// METHOD
//   1. The tree. Parse src/engine/economy.ts, take the object literal of `export const ECONOMY = { … } as const`
//      and walk it. A property whose initializer (after unwrapping `as`, `satisfies`, parentheses) is an object
//      literal is a BRANCH; an identifier initializer naming a module-level const of economy.ts whose own
//      initializer is an object literal (WEALTH_CORRIDOR …) is followed; an array whose elements are object
//      literals becomes a branch with one child `[]` holding the union of the element keys; anything else
//      (number, string, primitive array, call …) is a LEAF. Every leaf is one "leaf key path".
//   2. The readers. One TypeScript program over every tracked .ts under src, tests, tools and e2e, plus every
//      .vue under src as a virtual `<file>.vue.ts` = its <script> blocks + a synthetic function holding each
//      template expression (`{{ … }}` and every `v-*=`, `:x=`, `@x=` attribute value) as `void (…)`, so a
//      template read is a typed read. Every node of every file is visited once:
//        - a property access / literal element access whose OBJECT resolves to a tree node marks the child
//          of that name (chain resolution, so a cast such as `as Record<FamilyBackground, number>` does not
//          hide the literal's children); aliases (`const X = ECONOMY.a.b`, imports and re-exports of such
//          consts, e.g. world.ts's STARTING_FUNDS_CENTS) are followed;
//        - a property access whose SYMBOL's declaration is a tracked property declaration also marks it
//          (catches reads through `typeof ECONOMY.x` parameters and for-of element variables);
//        - destructuring (`const { a, b: { c } } = ECONOMY.x`) marks each named child;
//        - an element access with a NON-literal key marks the children named by the key's string-literal
//          union type if it has one, otherwise the whole subtree as DYNAMIC;
//        - a branch expression used in any other position (call argument, spread, return, for-of,
//          Object.keys, array element, property value …) marks its whole subtree ESCAPED;
//        - anything under a `typeof` type query counts as TYPE-only, not a read.
//      References inside the ECONOMY literal's own declaration are never counted (there are none by
//      construction – an object literal cannot read itself).
//   3. Verdict per leaf: PRODUCT (a runtime read in src/), TEST-ONLY / TOOL-ONLY / E2E-ONLY (read only there),
//      INDIRECT (no direct read; covered only because an ancestor escapes or is dynamically indexed – NOT
//      claimed dead), DEAD (nothing at all). Comments are never nodes, so prose mentions never count.
//   Known blind spots (each makes the probe say "read" too often, never "dead" too often, except the last):
//      an ancestor escape covers every descendant; a `.name` access resolved by symbol through a union covers
//      every union member. The last one: a reader outside src/tests/tools/e2e (scripts/ is .mjs and has no
//      ECONOMY hit: `git grep -l ECONOMY -- scripts` is empty).

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const outDir = process.argv[2]
if (!outDir) { console.error('usage: economy-keys.mjs <raw-out-dir>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const ROOT = process.cwd()
// Optional: `<raw-out-dir> <module path> <CONST NAME>` runs the same method over any config object literal of
// another module (default src/engine/economy.ts ECONOMY); output files are then named after the constant.
const ECON = process.argv[3] ?? 'src/engine/economy.ts'
const CONST_NAME = process.argv[4] ?? 'ECONOMY'

// ---- files -------------------------------------------------------------------------------------------------
const tracked = execFileSync('git', ['ls-files', 'src', 'tests', 'tools', 'e2e'], { encoding: 'utf8' })
  .split('\n').filter((f) => /\.(ts|vue)$/.test(f))
const virtual = new Map() // abs path -> text
function templateExprs(text) {
  const tpl = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')
  const out = []
  for (const m of tpl.matchAll(/\{\{([\s\S]*?)\}\}/g)) out.push(m[1])
  for (const m of tpl.matchAll(/(?:\sv-[\w-]+(?::[\w-]+)?|\s:[\w-]+|\s@[\w-]+)(?:\.[\w]+)*="([^"]*)"/g)) {
    let e = m[1]
    const vf = e.match(/^\s*(?:\([^)]*\)|[\w$]+)\s+(?:in|of)\s+([\s\S]+)$/)
    if (vf) e = vf[1]
    out.push(e)
  }
  return out
}
const rootNames = []
for (const f of tracked) {
  const abs = path.join(ROOT, f)
  if (f.endsWith('.vue')) {
    const text = readFileSync(abs, 'utf8')
    const scripts = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
    const exprs = templateExprs(text).map((e) => `  void (${e.replace(/\n/g, ' ')});`).join('\n')
    virtual.set(abs + '.ts', `${scripts}\nfunction __template__() {\n${exprs}\n}\n`)
    rootNames.push(abs + '.ts')
  } else rootNames.push(abs)
}
const options = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true, noEmit: true, skipLibCheck: true, types: [], lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  allowImportingTsExtensions: true,
}
const host = ts.createCompilerHost(options)
const origGet = host.getSourceFile.bind(host)
host.getSourceFile = (fn, lang, onErr, create) => {
  if (virtual.has(fn)) return ts.createSourceFile(fn, virtual.get(fn), lang, true, ts.ScriptKind.TS)
  return origGet(fn, lang, onErr, create)
}
const origExists = host.fileExists.bind(host)
host.fileExists = (fn) => virtual.has(fn) || origExists(fn)
const origRead = host.readFile.bind(host)
host.readFile = (fn) => (virtual.has(fn) ? virtual.get(fn) : origRead(fn))
const t0 = Date.now()
const program = ts.createProgram({ rootNames, options, host })
const checker = program.getTypeChecker()
const econSf = program.getSourceFile(path.join(ROOT, ECON))

// ---- the tree ----------------------------------------------------------------------------------------------
function unwrap(e) {
  while (e && (ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isTypeAssertionExpression(e))) e = e.expression
  return e
}
const moduleConsts = new Map() // name -> initializer node (economy.ts module level)
for (const st of econSf.statements) {
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) moduleConsts.set(d.name.text, d)
}
const nodes = [] // {id, path, leaf, children: Map, decls:Set, refs:[]}
const byDecl = new Map() // declaration ts.Node -> tree node
const byConstDecl = new Map() // VariableDeclaration ts.Node -> tree node (WEALTH_CORRIDOR …)
function mk(p, leaf, line) { const n = { id: nodes.length, path: p, leaf, line, children: new Map(), refs: [] }; nodes.push(n); return n }
function lineOf(sf, pos) { return sf.getLineAndCharacterOfPosition(pos).line + 1 }
function build(pathStr, init, declNode, seen = new Set()) {
  let e = unwrap(init)
  let viaConst = null
  if (e && ts.isIdentifier(e) && moduleConsts.has(e.text) && !seen.has(e.text)) {
    viaConst = moduleConsts.get(e.text); seen = new Set([...seen, e.text]); e = unwrap(viaConst.initializer)
  }
  const line = lineOf(econSf, declNode.getStart(econSf))
  if (e && ts.isObjectLiteralExpression(e)) {
    const n = mk(pathStr, false, line)
    for (const p of e.properties) {
      if ((ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name))) {
        const name = p.name.text
        const child = build(`${pathStr}.${name}`, ts.isPropertyAssignment(p) ? p.initializer : p.name, p, seen)
        n.children.set(name, child)
      }
    }
    if (viaConst) byConstDecl.set(viaConst, n)
    byDecl.set(declNode, n)
    return n
  }
  if (e && ts.isArrayLiteralExpression(e) && e.elements.length && e.elements.every((x) => ts.isObjectLiteralExpression(unwrap(x)))) {
    const n = mk(pathStr, false, line)
    const el = mk(`${pathStr}[]`, false, line)
    n.children.set('[]', el)
    for (const x of e.elements) {
      for (const p of unwrap(x).properties) {
        if (!(ts.isPropertyAssignment(p) && p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) continue
        const name = p.name.text
        let c = el.children.get(name)
        if (!c) { c = build(`${pathStr}[].${name}`, p.initializer, p, seen); el.children.set(name, c) } else byDecl.set(p, c)
      }
    }
    if (viaConst) byConstDecl.set(viaConst, n)
    byDecl.set(declNode, n)
    return n
  }
  const n = mk(pathStr, true, line)
  byDecl.set(declNode, n)
  if (viaConst) byConstDecl.set(viaConst, n)
  return n
}
const econDecl = moduleConsts.get(CONST_NAME)
const root = build(CONST_NAME, econDecl.initializer, econDecl)
const literalStart = econDecl.getStart(econSf), literalEnd = econDecl.getEnd()

// ---- declared types: a branch typed by an interface (`as VacationPackage[]`, `satisfies …`) is read through that
// interface's property declarations, so map those declarations to the tree node of the same name as well.
let declaredLinks = 0
function linkDeclared(n, t) {
  if (!t) return
  const el = n.children.get('[]')
  if (el) { const et = checker.getIndexTypeOfType(t, ts.IndexKind.Number) ?? (checker.isTupleType?.(t) ? undefined : undefined); if (et) linkDeclared(el, et); if (checker.isArrayLikeType(t) && t.typeArguments?.[0]) linkDeclared(el, t.typeArguments[0]) }
  for (const [name, c] of n.children) {
    if (name === '[]') continue
    const types = t.isUnion() ? t.types : [t]
    for (const tt of types) {
      const ps = tt.getProperty?.(name)
      if (!ps) continue
      for (const d of ps.declarations ?? []) if (!byDecl.has(d)) { byDecl.set(d, c); declaredLinks++ }
      if (!c.leaf) linkDeclared(c, checker.getTypeOfSymbol(ps))
    }
  }
}
linkDeclared(root, checker.getTypeAtLocation(econDecl.name))

// ---- resolution --------------------------------------------------------------------------------------------
const aliasOf = new Map() // ts.Symbol -> tree node
function symOf(n) {
  let s = checker.getSymbolAtLocation(n)
  if (s && s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s) } catch { /* */ } }
  return s
}
function nodeFromSymbol(s) {
  if (!s) return null
  if (aliasOf.has(s)) return aliasOf.get(s)
  for (const d of s.declarations ?? []) {
    if (d === econDecl) return root
    if (byConstDecl.has(d)) return byConstDecl.get(d)
    if (byDecl.has(d)) return byDecl.get(d)
  }
  return null
}
function resolve(e) {
  e = unwrap(e)
  if (!e) return null
  if (ts.isIdentifier(e)) return nodeFromSymbol(symOf(e))
  if (ts.isPropertyAccessExpression(e)) {
    const parent = resolve(e.expression)
    if (parent) return parent.children.get(e.name.text) ?? null
    return nodeFromSymbol(symOf(e.name))
  }
  if (ts.isElementAccessExpression(e)) {
    const parent = resolve(e.expression)
    if (!parent) return null
    const a = e.argumentExpression
    if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) return parent.children.get(a.text) ?? null
    if (parent.children.has('[]')) return parent.children.get('[]')
    return null
  }
  return null
}

// ---- marking -----------------------------------------------------------------------------------------------
function rel(sf) { return path.relative(ROOT, sf.fileName).replace(/\.vue\.ts$/, '.vue') }
function mark(n, sf, pos, how) { n.refs.push({ file: rel(sf), line: lineOf(sf, pos), how }) }
function markSubtree(n, sf, pos, how) { mark(n, sf, pos, how); for (const c of n.children.values()) markSubtree(c, sf, pos, how) }
function inTypeQuery(n) { for (let p = n.parent; p; p = p.parent) { if (ts.isTypeQueryNode(p)) return true; if (ts.isStatement(p)) return false } return false }
function isInsideLiteral(sf, n) { return sf === econSf && n.getStart(sf) >= literalStart && n.getEnd() <= literalEnd }
function outerOf(e) { let p = e; while (p.parent && (ts.isAsExpression(p.parent) || ts.isSatisfiesExpression(p.parent) || ts.isParenthesizedExpression(p.parent) || ts.isNonNullExpression(p.parent))) p = p.parent; return p }

// pass 1: aliases (twice, for chains)
for (let pass = 0; pass < 3; pass++) {
  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile || !sf.fileName.startsWith(ROOT) || sf.fileName.includes('node_modules')) continue
    const visit = (n) => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && n !== econDecl && !byConstDecl.has(n)) {
        const t = resolve(n.initializer)
        if (t) { const s = checker.getSymbolAtLocation(n.name); if (s) aliasOf.set(s, t) }
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
  }
}

// pass 2: references
const escapes = []
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile || !sf.fileName.startsWith(ROOT) || sf.fileName.includes('node_modules')) continue
  const visit = (n) => {
    if (isInsideLiteral(sf, n)) return
    const typeOnly = () => inTypeQuery(n)
    // destructuring
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectBindingPattern(n.name)) {
      const t = resolve(n.initializer)
      if (t) {
        const walkPat = (pat, tn) => {
          for (const el of pat.elements) {
            const nm = el.propertyName ?? el.name
            if (!ts.isIdentifier(nm) && !ts.isStringLiteral(nm)) continue
            const c = tn.children.get(nm.text)
            if (!c) continue
            if (ts.isObjectBindingPattern(el.name)) walkPat(el.name, c)
            else if (c.leaf) mark(c, sf, el.getStart(sf), 'direct')
            else { mark(c, sf, el.getStart(sf), 'alias'); const s = checker.getSymbolAtLocation(el.name); if (s) aliasOf.set(s, c) }
          }
        }
        walkPat(n.name, t)
      }
    }
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isIdentifier(n)) {
      // skip the identifier that is the .name of a property access (handled via its parent), and declarations
      const p = n.parent
      const isNamePart = ts.isIdentifier(n) && p && ((ts.isPropertyAccessExpression(p) && p.name === n) || ts.isPropertyAssignment(p) && p.name === n || ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || (ts.isVariableDeclaration(p) && p.name === n) || ts.isBindingElement(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isParameter(p) && p.name === n || ts.isShorthandPropertyAssignment(p) && false)
      if (!isNamePart) {
        let t = resolve(n)
        // symbol channel for `.name` accesses on values that are not resolvable by chain (typeof params, for-of vars)
        if (!t && ts.isPropertyAccessExpression(n)) {
          const s = checker.getSymbolAtLocation(n.name)
          if (s) for (const d of s.declarations ?? []) { const tn = byDecl.get(d); if (tn) { mark(tn, sf, n.getStart(sf), typeOnly() ? 'type' : 'symbol') } }
        }
        if (ts.isElementAccessExpression(n) && !t) {
          const parent = resolve(n.expression)
          if (parent) {
            const at = checker.getTypeAtLocation(n.argumentExpression)
            const lits = (at.isUnion() ? at.types : [at]).filter((x) => x.isStringLiteral()).map((x) => x.value)
            const how = typeOnly() ? 'type' : 'dynamic'
            if (lits.length && lits.length === (at.isUnion() ? at.types.length : 1)) {
              for (const l of lits) { const c = parent.children.get(l); if (c) markSubtree(c, sf, n.getStart(sf), how) }
            } else markSubtree(parent, sf, n.getStart(sf), how)
          }
        }
        if (t) {
          const outer = outerOf(n)
          const op = outer.parent
          const continued = op && ((ts.isPropertyAccessExpression(op) && op.expression === outer) || (ts.isElementAccessExpression(op) && op.expression === outer))
          if (!continued) {
            const how = typeOnly() ? 'type' : 'direct'
            if (t.leaf) mark(t, sf, n.getStart(sf), how)
            else if (how === 'type') mark(t, sf, n.getStart(sf), 'type')
            else if (op && ts.isVariableDeclaration(op) && op.initializer === outer) mark(t, sf, n.getStart(sf), 'alias')
            else if (!(ts.isIdentifier(n) && t === root && op && (ts.isImportSpecifier(op) || ts.isExportSpecifier(op)))) {
              markSubtree(t, sf, n.getStart(sf), 'escape')
              escapes.push({ path: t.path, file: rel(sf), line: lineOf(sf, n.getStart(sf)), context: ts.SyntaxKind[op?.kind ?? 0] })
            }
          } else mark(t, sf, n.getStart(sf), typeOnly() ? 'type' : (t.leaf ? 'direct' : 'step')) // a leaf continued by `.some(`, `.length`, `[0]` is read
        }
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

// ---- the name channel: does product code (src/, outside the ECONOMY literal) name the leaf's key at all?
const nameUse = new Map() // key -> count in src code (property-access names, binding names, string literals)
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile || !rel(sf).startsWith('src/')) continue
  const visit = (n) => {
    if (isInsideLiteral(sf, n)) return
    let k = null
    if (ts.isPropertyAccessExpression(n)) k = n.name.text
    else if (ts.isBindingElement(n)) { const nm = n.propertyName ?? n.name; if (ts.isIdentifier(nm)) k = nm.text }
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) k = n.text
    else if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name)) k = '__prop__' + n.name.text
    if (k) nameUse.set(k, (nameUse.get(k) ?? 0) + 1)
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

// ---- verdicts ----------------------------------------------------------------------------------------------
const leaves = nodes.filter((n) => n.leaf)
function areaOf(f) { return f.startsWith('src/') ? 'src' : f.split('/')[0] }
const verdicts = []
for (const l of leaves) {
  const runtime = l.refs.filter((r) => r.how !== 'type')
  const direct = runtime.filter((r) => r.how === 'direct' || r.how === 'symbol')
  const areas = new Set(direct.map((r) => areaOf(r.file)))
  const indirect = runtime.filter((r) => r.how === 'escape' || r.how === 'dynamic')
  const indirectAreas = new Set(indirect.map((r) => areaOf(r.file)))
  let v
  if (areas.has('src')) v = 'PRODUCT'
  else if (indirectAreas.has('src')) v = 'PRODUCT-INDIRECT'
  else if (areas.size || indirectAreas.size) v = [...new Set([...areas, ...indirectAreas])].sort().join('+').toUpperCase() + '-ONLY'
  else v = 'DEAD'
  const key = l.path.split('.').pop().replace('[]', '')
  verdicts.push({ path: l.path, line: l.line, verdict: v, nameInSrc: nameUse.get(key) ?? 0, direct: direct.length, indirect: indirect.length, typeRefs: l.refs.length - runtime.length, sample: [...direct, ...indirect].slice(0, 6) })
}
// top-level keys: does anything read them at all (any how)?
const top = [...root.children.entries()].map(([k, n]) => {
  const all = []
  const walk = (x) => { all.push(...x.refs); for (const c of x.children.values()) walk(c) }
  walk(n)
  const rt = all.filter((r) => r.how !== 'type')
  return { key: k, line: n.line, leaves: nodes.filter((x) => x.leaf && (x.path === n.path || x.path.startsWith(n.path + '.') || x.path.startsWith(n.path + '['))).length, srcRefs: rt.filter((r) => r.file.startsWith('src/')).length, otherRefs: rt.filter((r) => !r.file.startsWith('src/')).length }
})
const counts = {}
for (const v of verdicts) counts[v.verdict] = (counts[v.verdict] ?? 0) + 1
writeFileSync(path.join(outDir, CONST_NAME === 'ECONOMY' ? 'economy-keys.json' : `keys-${CONST_NAME}.json`), JSON.stringify({ baseline: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), files: rootNames.length, leaves: leaves.length, branches: nodes.length - leaves.length, counts, top, escapes, verdicts }, null, 1))
console.log(`# ${CONST_NAME} (${ECON}) leaf key paths – ${execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim()}`)
console.log(`program: ${rootNames.length} files (${virtual.size} .vue as virtual .ts), built+walked in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
console.log(`tree: ${nodes.length} nodes, ${leaves.length} leaf key paths, ${nodes.length - leaves.length} branches, ${root.children.size} top-level keys`)
console.log(`verdicts: ${JSON.stringify(counts)}; declared-type links ${declaredLinks}`)
console.log(`INDIRECT leaves whose key is never named in src code: ${verdicts.filter((x) => x.verdict === 'PRODUCT-INDIRECT' && x.nameInSrc === 0).length}`)
console.log(`escapes (a branch used whole): ${escapes.length}`)
for (const e of escapes) console.log(`  ESCAPE ${e.path}  ${e.file}:${e.line}  (${e.context})`)
console.log('\n## non-PRODUCT leaves')
for (const v of verdicts.filter((x) => !x.verdict.startsWith('PRODUCT'))) console.log(`${v.verdict}\t${v.path}\teconomy.ts:${v.line}\tnameInSrc ${v.nameInSrc}\t${v.sample.map((r) => `${r.file}:${r.line}(${r.how})`).join(' ')}`)
console.log('\n## PRODUCT-INDIRECT leaves')
for (const v of verdicts.filter((x) => x.verdict === 'PRODUCT-INDIRECT')) console.log(`${v.path}\teconomy.ts:${v.line}\tnameInSrc ${v.nameInSrc}\t${v.sample.slice(0, 2).map((r) => `${r.file}:${r.line}(${r.how})`).join(' ')}`)
console.log('\n## top-level keys')
for (const t of top) console.log(`${t.key}\tline ${t.line}\tleaves ${t.leaves}\tsrc refs ${t.srcRefs}\tother refs ${t.otherRefs}`)
