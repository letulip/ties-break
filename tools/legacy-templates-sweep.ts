// THE LEGACY-TEMPLATE SWEEP – wave L3-0 (docs/specs/i18n-2026-10.md §5). AN ARCHIVAL PROBE: the one-off that built
// `src/engine/migrations/legacyTemplates.v92.ts`, kept so the table can be re-derived and CHECKED, never to regenerate it in place.
//
//   npx vite-node tools/legacy-templates-sweep.ts            – print the report (sinks, counts, unresolved sites)
//   npx vite-node tools/legacy-templates-sweep.ts --write F  – write the table module to F (the frozen file is never written by hand)
//
// WHAT IT DOES. The TypeScript AST with the TYPE CHECKER over `src/engine`, `src/shared`, `src/worker`: every `addEvent(world, { text })` call
// and every `fireMilestone(world, key, text)` call is a SINK for the text of a `WorldEvent`; the text expression is followed through template
// literals, conditionals (each branch its own sentence), `+` joins, local variables, sentence tables, `join` over a local array of pushed
// sentences and the helper functions that build a whole sentence. A runtime value is a HOLE (`{0}`, `{1}`…, in reading order – `cp`'s own
// spelling). The output is a closed set of sentence templates per sink.
//
// ⚠⚠ RUN IT AGAINST THE TREE THE TABLE WAS BUILT FROM – commit 0fc8191b (the L3-0 base), where `--write` reproduces the frozen file byte for byte.
// Run against a later tree it reports THAT tree's writers, which is the point of a probe and the reason the frozen table is a file and not a call.
// ⚠ NOT SOLD AS COMPLETE: the sinks it cannot resolve are printed, not hidden, and the entries in MANUAL are the sentences it cannot reach (the
// kid-match row is composed in matchNews.ts and handed to the sink as `ev.text`; two flavour lines are produced by a `.map` over a pool). The
// v93 measurement (the golden corpus, the e2e careers, the owner's real save) is the check on it; this file is the method.
import { writeFileSync } from 'node:fs'
import ts from 'typescript'

const ROOT = process.cwd()
const BASE = process.env.L30_BASE ?? '0fc8191b'
const cfg = ts.readConfigFile(`${ROOT}/tsconfig.app.json`, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, ROOT)
const roots = parsed.fileNames.filter((f) => f.endsWith('.ts') && /\/src\/(engine|shared|worker)\//.test(f))
const program = ts.createProgram(roots, { ...parsed.options, noEmit: true, skipLibCheck: true })
const checker = program.getTypeChecker()

interface JoinSpec { sep: string; parts: Alt[][] }
type Part = string | { h: string } | { j: JoinSpec }
type Alt = Part[]
const CAP = 256
// closed vocabularies of whole phrases that sit INSIDE a sentence: expanded to one template each rather than a bare hole
const EXPAND = new Set(['ENDING_TITLE'])
const notes: string[] = []

const HOLE = (src: string): Alt[] => [[{ h: src }]]
const LIT = (s: string): Alt[] => [[s]]

function product(a: Alt[], b: Alt[]): Alt[] {
  if (a.length * b.length > CAP) {
    notes.push(`cap hit: ${a.length}x${b.length}`)
    // collapse the wider side to one hole so the template stays a template
    if (a.length >= b.length) a = HOLE('«wide»')
    else b = HOLE('«wide»')
  }
  const out: Alt[] = []
  for (const x of a) for (const y of b) out.push([...x, ...y])
  return out
}

function srcOf(n: ts.Node): string {
  return n.getText().replace(/\s+/g, ' ').slice(0, 80)
}

function aliased(sym: ts.Symbol | undefined): ts.Symbol | undefined {
  if (!sym) return undefined
  return sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym
}

function enclosingFn(n: ts.Node): ts.Node | undefined {
  let p: ts.Node | undefined = n.parent
  while (p && !(ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isArrowFunction(p) || ts.isMethodDeclaration(p))) p = p.parent
  return p
}

interface Ctx {
  depth: number
  params: Map<ts.Symbol, Alt[]>
  scopeFn: ts.Node | undefined // the function whose locals may contribute holes
  top: boolean // the expression IS the whole text (a table element access may union its members)
}

const INLINE_CALLS = new Set([
  'callUpLine', 'collegeLeagueLine', 'collegeEpilogueLine', 'divorcedKeptRow', 'endedKeptRow', 'metKeptRow', 'leavingLine',
  'facilityFlavor', 'championNote', 'rivalRetirementNews', 'saleTail', 'moneyClause', 'kidMatchEvent', 'rankingDeltaSuffix',
])

function isStringy(alts: Alt[]): boolean {
  return alts.some((a) => a.some((p) => typeof p === 'string' && p.length > 0))
}
function hasHole(alts: Alt[]): boolean {
  return alts.some((a) => a.some((p) => typeof p !== 'string'))
}

function returnsOf(fn: ts.Node): ts.Expression[] {
  const out: ts.Expression[] = []
  if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body)) return [fn.body]
  const body = (fn as ts.FunctionLikeDeclaration).body
  if (!body) return out
  const visit = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n)) return
    if (ts.isReturnStatement(n) && n.expression) out.push(n.expression)
    ts.forEachChild(n, visit)
  }
  visit(body)
  return out
}

function assignmentsOf(sym: ts.Symbol, within: ts.Node): ts.Expression[] {
  const out: ts.Expression[] = []
  const visit = (n: ts.Node): void => {
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(n.left) && aliased(checker.getSymbolAtLocation(n.left)) === sym) out.push(n.right)
    ts.forEachChild(n, visit)
  }
  visit(within)
  return out
}

// (a self-recursive `leaves` helper stood here; the sweep evolved past it and check:tools
// rightly flagged the dead declaration – removed 09.10, the architect)

function memberInit(p: ts.ObjectLiteralElementLike): ts.Expression | undefined {
  if (ts.isPropertyAssignment(p)) return p.initializer
  if (ts.isShorthandPropertyAssignment(p)) {
    const vs = aliased(checker.getShorthandAssignmentValueSymbol(p))
    const vd = vs?.valueDeclaration
    if (vd && ts.isVariableDeclaration(vd) && vd.initializer) return vd.initializer
  }
  return undefined
}
function memberName(p: ts.ObjectLiteralElementLike): string | null {
  if (ts.isShorthandPropertyAssignment(p)) return p.name.text
  if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name))) return p.name.text
  return null
}
function nodesOf(node: ts.Expression, d: number): ts.Expression[] {
  if (d > 10) return []
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node)) return nodesOf(node.expression, d + 1)
  if (ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) return [node]
  if (ts.isIdentifier(node)) {
    const sh = shorthandOf.get(node)
    const sym = aliased(sh ? checker.getShorthandAssignmentValueSymbol(sh) : checker.getSymbolAtLocation(node))
    const decl = sym?.valueDeclaration
    if (decl && ts.isVariableDeclaration(decl) && decl.initializer) return nodesOf(decl.initializer, d + 1)
    return []
  }
  if (ts.isConditionalExpression(node)) return [...nodesOf(node.whenTrue, d + 1), ...nodesOf(node.whenFalse, d + 1)]
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const fsym = aliased(checker.getSymbolAtLocation(node.expression))
    const fdecl = fsym?.valueDeclaration
    if (fdecl && (ts.isFunctionDeclaration(fdecl) || ts.isArrowFunction(fdecl))) {
      const out: ts.Expression[] = []
      for (const r of returnsOf(fdecl)) out.push(...nodesOf(r, d + 1))
      return out
    }
    return []
  }
  if (ts.isPropertyAccessExpression(node)) {
    const out: ts.Expression[] = []
    for (const b of nodesOf(node.expression, d + 1)) {
      if (!ts.isObjectLiteralExpression(b)) continue
      for (const p of b.properties) { const mi = memberInit(p); if (mi && memberName(p) === node.name.text) out.push(...nodesOf(mi, d + 1)) }
    }
    return out
  }
  if (ts.isElementAccessExpression(node)) {
    const out: ts.Expression[] = []
    const lit = ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : null
    for (const b of nodesOf(node.expression, d + 1)) {
      if (ts.isObjectLiteralExpression(b)) {
        for (const p of b.properties) {
          const mi = memberInit(p)
          if (!mi) continue
          const nm = memberName(p)
          if (lit === null || nm === lit) out.push(...nodesOf(mi, d + 1))
        }
      } else if (ts.isArrayLiteralExpression(b)) {
        for (const e of b.elements) out.push(...nodesOf(e, d + 1))
      }
    }
    return out
  }
  return []
}

function sentenceLike(alts: Alt[]): boolean {
  return alts.every((a) => {
    const lit = a.filter((p): p is string => typeof p === 'string').join('')
    return lit.length >= 20 && lit.includes(' ')
  })
}
function tableUnion(node: ts.Expression, ctx: Ctx): Alt[] {
  const out: Alt[] = []
  const seenNodes = new Set<ts.Node>()
  const c2 = { ...ctx, depth: ctx.depth + 1, top: false }
  const walkLeaves = (n: ts.Expression, d: number): void => {
    if (d > 8 || seenNodes.has(n)) return
    seenNodes.add(n)
    if (ts.isObjectLiteralExpression(n)) {
      for (const p of n.properties) { const mi = memberInit(p); if (mi) walkLeaves(mi, d + 1) }
    } else if (ts.isArrayLiteralExpression(n)) {
      for (const e of n.elements) walkLeaves(e, d + 1)
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
      out.push(...ev(n, { ...c2, scopeFn: enclosingFn(n) }))
    }
  }
  for (const n of nodesOf(node, 0)) walkLeaves(n, 0)
  if (out.length > 0 && out.length <= 400 && (ctx.top || sentenceLike(out)) && (!hasHole(out) || ctx.scopeFn !== undefined)) return out
  return []
}

function ev(node: ts.Expression, ctx: Ctx): Alt[] {
  if (ctx.depth > 14) return HOLE(srcOf(node))
  const sub = (n: ts.Expression, top = false): Alt[] => ev(n, { ...ctx, depth: ctx.depth + 1, top: ctx.top && top })
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return LIT(node.text)
  if (node.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node) && node.text === 'undefined')) return []
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) return sub(node.expression, true)
  if (ts.isTemplateExpression(node)) {
    let acc: Alt[] = LIT(node.head.text)
    for (const span of node.templateSpans) {
      const inner = sub(span.expression)
      acc = product(acc, inner)
      acc = product(acc, LIT(span.literal.text))
    }
    return acc
  }
  if (ts.isConditionalExpression(node)) return [...sub(node.whenTrue, true), ...sub(node.whenFalse, true)]
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind
    if (op === ts.SyntaxKind.PlusToken) {
      const l = sub(node.left, true)
      const r = sub(node.right, true)
      if (isStringy(l) || isStringy(r)) return product(l, r)
      return HOLE(srcOf(node))
    }
    if (op === ts.SyntaxKind.QuestionQuestionToken || op === ts.SyntaxKind.BarBarToken) {
      return [...sub(node.left, true), ...sub(node.right, true)]
    }
    return HOLE(srcOf(node))
  }
  if (ts.isCallExpression(node)) {
    const calleeName = ts.isIdentifier(node.expression) ? node.expression.text : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : ''
    if (ts.isPropertyAccessExpression(node.expression) && calleeName === 'trim') return sub(node.expression.expression, true)
    if (ts.isPropertyAccessExpression(node.expression) && calleeName === 'join' && ts.isIdentifier(node.expression.expression) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!)) {
      const sep = (node.arguments[0] as ts.StringLiteral).text
      const asym = aliased(checker.getSymbolAtLocation(node.expression.expression))
      const fnScope = enclosingFn(node)
      const pushes: ts.Expression[] = []
      const scan = (n: ts.Node): void => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'push' && ts.isIdentifier(n.expression.expression) && aliased(checker.getSymbolAtLocation(n.expression.expression)) === asym && n.arguments[0]) pushes.push(n.arguments[0])
        ts.forEachChild(n, scan)
      }
      if (fnScope && asym) scan(fnScope)
      if (pushes.length > 0 && pushes.length <= 8) {
        // ⚠ KEPT AS A FAMILY, NOT EXPANDED: the row is the join of whichever pushes fired, so its closed set is every ordered non-empty selection of
        // the parts – 287 sentences for the winter kit-letter row, ~85 KiB of strings in the worker bundle. The table stores the parts once and the
        // matcher expands them when it loads (install-size's 16,384 KiB ceiling is the reason this is not the plain list).
        const familyParts: Alt[][] = pushes.map((pe) => ev(pe, { ...ctx, depth: ctx.depth + 1, scopeFn: fnScope, top: false }))
        return [[{ j: { sep, parts: familyParts } }]]
      }
      return HOLE(srcOf(node))
    }
    if (ts.isParenthesizedExpression(node.expression) && (ts.isArrowFunction(node.expression.expression) || ts.isFunctionExpression(node.expression.expression))) {
      const fn = node.expression.expression
      const out: Alt[] = []
      for (const r of returnsOf(fn)) out.push(...ev(r, { ...ctx, depth: ctx.depth + 1, scopeFn: fn, top: ctx.top }))
      return out.length > 0 ? out : HOLE(srcOf(node))
    }
    if (INLINE_CALLS.has(calleeName) || (ctx.top && calleeName !== '' && !/^(format|String|Math|Number|pick|weekLabel)/.test(calleeName))) {
      const sym = aliased(checker.getSymbolAtLocation(ts.isIdentifier(node.expression) ? node.expression : (node.expression as ts.PropertyAccessExpression).name))
      const decl = sym?.valueDeclaration
      let fn: ts.Node | undefined
      if (decl && (ts.isFunctionDeclaration(decl) || ts.isArrowFunction(decl) || ts.isFunctionExpression(decl))) fn = decl
      else if (decl && ts.isVariableDeclaration(decl) && decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) fn = decl.initializer
      if (fn) {
        const params = new Map(ctx.params)
        const fnParams = (fn as ts.FunctionLikeDeclaration).parameters
        fnParams.forEach((p, i) => {
          const psym = checker.getSymbolAtLocation(p.name)
          const arg = node.arguments[i]
          if (psym) params.set(psym, arg ? sub(arg) : HOLE(p.name.getText()))
        })
        const rets = returnsOf(fn)
        const out: Alt[] = []
        for (const r of rets) out.push(...ev(r, { ...ctx, depth: ctx.depth + 1, params, scopeFn: fn, top: ctx.top }))
        if (out.length === 0) {
          notes.push(`call ${calleeName}: no returns`)
          return HOLE(srcOf(node))
        }
        return out
      }
      notes.push(`call ${calleeName}: declaration not found`)
    }
    return HOLE(srcOf(node))
  }
  if (ts.isObjectLiteralExpression(node)) return HOLE(srcOf(node))
  if (ts.isIdentifier(node)) {
    const sh = shorthandOf.get(node)
    const sym = aliased(sh ? checker.getShorthandAssignmentValueSymbol(sh) : checker.getSymbolAtLocation(node))
    if (!sym) return HOLE(srcOf(node))
    const bound = ctx.params.get(sym)
    if (bound) return bound
    const decl = sym.valueDeclaration
    if (!decl) return HOLE(srcOf(node))
    if (ts.isVariableDeclaration(decl)) {
      const local = ctx.scopeFn !== undefined && enclosingFn(decl) === ctx.scopeFn
      const inits: ts.Expression[] = []
      if (decl.initializer) inits.push(decl.initializer)
      if (local) inits.push(...assignmentsOf(sym, ctx.scopeFn as ts.Node))
      if (inits.length === 0) return HOLE(srcOf(node))
      const out: Alt[] = []
      for (const i of inits) out.push(...ev(i, { ...ctx, depth: ctx.depth + 1, scopeFn: local ? ctx.scopeFn : enclosingFn(decl), top: ctx.top }))
      // a module-level const that is not a pure sentence is a runtime value: a hole by name
      if (!local && hasHole(out)) return HOLE(srcOf(node))
      if (!local && !isStringy(out)) return HOLE(srcOf(node))
      return out
    }
    return HOLE(srcOf(node))
  }
  if (ts.isPropertyAccessExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'row' && node.name.text === 'text') {
      const fnDecl = enclosingFn(node)
      const fnName = fnDecl && ts.isFunctionDeclaration(fnDecl) && fnDecl.name ? fnDecl.name.text : ''
      if (fnName === 'bankSponsorCheque') {
        const out: Alt[] = []
        for (const call of bankCalls) {
          const arg = call.arguments[2]
          if (!arg || !ts.isObjectLiteralExpression(arg)) continue
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'text') out.push(...ev(prop.initializer, { depth: ctx.depth + 1, params: new Map(), scopeFn: enclosingFn(call), top: false }))
          }
        }
        if (out.length > 0) return out
      }
    }
    const sym = aliased(checker.getSymbolAtLocation(node.name))
    const decl = sym?.valueDeclaration
    if (decl && ts.isPropertyAssignment(decl)) {
      const out = ev(decl.initializer, { ...ctx, depth: ctx.depth + 1, scopeFn: undefined, top: ctx.top })
      if (!hasHole(out) && isStringy(out)) return out
    }
    // a property chain with literal names navigates to ONE value: no sentence-likeness gate needed
    const exactNodes = nodesOf(node, 0)
    if (exactNodes.length > 0 && exactNodes.length <= 6 && exactNodes.every((n) => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n))) {
      const out2: Alt[] = []
      for (const n of exactNodes) out2.push(...ev(n, { ...ctx, depth: ctx.depth + 1, scopeFn: enclosingFn(n), top: false }))
      if (!hasHole(out2) && isStringy(out2)) return out2
    }
    const u2 = tableUnion(node, ctx)
    if (u2.length > 0) return u2
    return HOLE(srcOf(node))
  }
  if (ts.isElementAccessExpression(node)) {
    const forced = EXPAND.has(node.expression.getText())
    const u = tableUnion(node, forced ? { ...ctx, top: true } : ctx)
    if (u.length > 0) return u
    return HOLE(srcOf(node))
  }
  return HOLE(srcOf(node))
}

// ---- sinks ----
interface Sink { file: string; line: number; kind: string; alts: Alt[]; notes: string[] }
const sinks: Sink[] = []
const bankCalls: ts.CallExpression[] = []
for (const sf0 of program.getSourceFiles()) {
  if (!/\/src\/engine\//.test(sf0.fileName)) continue
  const v0 = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'bankSponsorCheque') bankCalls.push(n)
    ts.forEachChild(n, v0)
  }
  v0(sf0)
}
const shorthandOf = new Map<ts.Identifier, ts.ShorthandPropertyAssignment>()

for (const sf of program.getSourceFiles()) {
  const rel = sf.fileName.slice(ROOT.length + 1)
  if (!/^src\/(engine|shared|worker)\//.test(rel)) continue
  const text = sf.text
  if (!text.includes('addEvent(') && !text.includes('fireMilestone(')) continue
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const name = n.expression.text
      let textExpr: ts.Expression | undefined
      let kind = ''
      if (name === 'addEvent' && n.arguments.length >= 2) {
        const obj = n.arguments[1]
        if (obj && ts.isObjectLiteralExpression(obj)) {
          for (const p of obj.properties) {
            if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'text') textExpr = p.initializer
            else if (ts.isShorthandPropertyAssignment(p) && p.name.text === 'text') { textExpr = p.name; shorthandOf.set(p.name, p) }
          }
          kind = 'addEvent'
        }
      } else if (name === 'fireMilestone' && n.arguments.length >= 3 && !ts.isFunctionDeclaration(n.parent)) {
        textExpr = n.arguments[2]
        kind = 'fireMilestone'
      }
      if (textExpr) {
        notes.length = 0
        const before = notes.length
        const alts = ev(textExpr, { depth: 0, params: new Map(), scopeFn: enclosingFn(n), top: true })
        sinks.push({ file: rel, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, kind, alts, notes: notes.slice(before) })
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

// ---- render alts to keys ----
function keyOf(alt: Alt): { k: string; holes: string[] } {
  let k = ''
  const holes: string[] = []
  for (const p of alt) {
    if (typeof p === 'string') k += p
    else if ('h' in p) {
      k += `{${holes.length}}`
      holes.push(p.h)
    } else throw new Error('a joined family can only be the whole text of a sink')
  }
  return { k, holes }
}

const table = new Map<string, { sites: string[]; holes: string[][] }>()
interface Family { site: string; sep: string; parts: { k: string; holes: string[] }[][] }
const families: Family[] = []
const pureDynamic: string[] = []
const report: string[] = []
for (const s of sinks) {
  let n = 0
  for (const a of s.alts) {
    const only = a.length === 1 ? a[0] : undefined
    if (only !== undefined && typeof only !== 'string' && 'j' in only) {
      // the same sentence reaches a part by more than one road (a ternary read through a local, a table union): one alternative per distinct key
      const distinct = (alts: Alt[]): { k: string; holes: string[] }[] => {
        const seen = new Set<string>()
        return alts.map(keyOf).filter((x) => (seen.has(x.k) ? false : (seen.add(x.k), true)))
      }
      families.push({ site: `${s.file}:${s.line}`, sep: only.j.sep, parts: only.j.parts.map(distinct) })
      n++
      continue
    }
    const { k, holes } = keyOf(a)
    if (/^(\{\d+\})+$/.test(k) || k === '') {
      pureDynamic.push(`${s.file}:${s.line} :: ${holes.join(' | ')}`)
      continue
    }
    n++
    const e = table.get(k) ?? { sites: [], holes: [] }
    e.sites.push(`${s.file}:${s.line}`)
    e.holes.push(holes)
    table.set(k, e)
  }
  report.push(`${s.file}:${s.line} [${s.kind}] -> ${n} templates${s.notes.length ? '  NOTES: ' + s.notes.join('; ') : ''}`)
}

// ---- the module text ----
interface TableRow { k: string; sites: string[]; holes: string[] }
const MANUAL: TableRow[] = [
  {
    "k": "{0}: {1} beat {2} {3}",
    "sites": [
      "src/engine/world/matchNews.ts:kidMatchEvent MANUAL"
    ],
    "holes": [
      "stage",
      "kidShort",
      "formatShortName(oppName)",
      "kidScore"
    ]
  },
  {
    "k": "{0}: {1} lost to {2} {3}",
    "sites": [
      "src/engine/world/matchNews.ts:kidMatchEvent MANUAL"
    ],
    "holes": [
      "stage",
      "kidShort",
      "formatShortName(oppName)",
      "kidScore"
    ]
  },
  {
    "k": "{0}: {1} retired against {2} {3}",
    "sites": [
      "src/engine/world/matchNews.ts:kidMatchEvent MANUAL"
    ],
    "holes": [
      "stage",
      "kidShort",
      "formatShortName(oppName)",
      "kidScore"
    ]
  },
  {
    "k": "{0}: {1} beat a retiring {2} {3}",
    "sites": [
      "src/engine/world/matchNews.ts:kidMatchEvent MANUAL"
    ],
    "holes": [
      "stage",
      "kidShort",
      "formatShortName(oppName)",
      "kidScore"
    ]
  },
  {
    "k": "Group clinic at the public courts",
    "sites": [
      "src/engine/world/phaseFinance.ts:117 MANUAL (WORKING_TRAIN_EVENTS map)"
    ],
    "holes": []
  },
  {
    "k": "Light week: the rest of life catches up",
    "sites": [
      "src/engine/world/phaseFinance.ts:126 MANUAL (AFTER_SCHOOL map)"
    ],
    "holes": []
  }
]

const byKey = new Map<string, TableRow>()
for (const r of [...table].map(([k, v]) => ({ k, sites: v.sites, holes: v.holes[0] ?? [] })).concat(MANUAL)) {
  const e = byKey.get(r.k)
  if (e) e.sites.push(...r.sites)
  else byKey.set(r.k, { k: r.k, sites: [...r.sites], holes: r.holes ?? [] })
}
const q = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`

const HOLE_RE = /\{(\d+)\}/g
function classesOf(k: string, srcHoles: readonly string[]): Record<number, string> {
  const classes: Record<number, string> = {}
  ;[...k.matchAll(HOLE_RE)].forEach((m, i) => {
    const src = srcHoles[i] ?? ''
    if (/score/i.test(src)) classes[Number(m[1])] = 'score'
    else if (/tier\.label|TIERS\[[^\]]*\]\.label|\.tier\]\.label/.test(src)) classes[Number(m[1])] = 'tier'
    else if (/^finishLabel\(/.test(src)) classes[Number(m[1])] = 'finish'
    // the hole right before ' – no ranking points' is always the scoreline (practice, national team, college league rows)
    if (k.slice(m.index! + m[0].length).startsWith(' – no ranking points')) classes[Number(m[1])] = 'score'
  })
  return classes
}
function entryText(k: string, classes: Record<number, string>): string {
  return Object.keys(classes).length > 0 ? `[${q(k)}, { ${Object.entries(classes).map(([i, c]) => `${i}: ${q(c)}`).join(', ')} }]` : q(k)
}
const lines: string[] = []
let withHoles = 0
let literal = 0
let classed = 0
const adjacency: string[] = []
const risky: string[] = []
for (const r of [...byKey.values()].sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0))) {
  const holes = [...r.k.matchAll(HOLE_RE)]
  const classes = classesOf(r.k, r.holes)
  // hole adjacency: two holes separated by at most one literal char
  for (let i = 0; i + 1 < holes.length; i++) {
    const a = holes[i]!
    const b = holes[i + 1]!
    const gap = r.k.slice(a.index! + a[0].length, b.index!)
    if (gap.length <= 1 && !classes[Number(a[1])] && !classes[Number(b[1])]) adjacency.push(`${r.k}   (gap ${JSON.stringify(gap)})`)
  }
  if (/[\\{}]/.test(r.k.replace(HOLE_RE, ''))) risky.push(r.k)
  if (/^(\{\d+\}|\s|[.,;:–—!?-])*$/.test(r.k)) risky.push(`NEAR-EMPTY: ${r.k}`)
  const sites = [...new Set(r.sites)].slice(0, 2).join(', ')
  if (holes.length > 0) withHoles++
  else literal++
  if (Object.keys(classes).length > 0) classed++
  lines.push(`  ${entryText(r.k, classes)}, // ${sites}`)
}
// the joined families: the parts once each, the expansion left to the matcher
const familyLines: string[] = []
let expansions = 0
for (const f of families) {
  let n = 1
  for (const alts of f.parts) n *= 1 + alts.length
  expansions += n - 1
  familyLines.push(`  // ${f.site} – the join of whichever of these parts fired, in order (${n - 1} sentences)`)
  familyLines.push(`  {`)
  familyLines.push(`    sep: ${q(f.sep)},`)
  familyLines.push(`    parts: [`)
  for (const alts of f.parts) {
    familyLines.push(`      [`)
    for (const alt of alts) familyLines.push(`        ${entryText(alt.k, classesOf(alt.k, alt.holes))},`)
    familyLines.push(`      ],`)
  }
  familyLines.push(`    ],`)
  familyLines.push(`  },`)
}

const banner = `// THE FROZEN LEGACY-TEMPLATE TABLE – v92. ⚠⚠ NEVER EDITED AFTER THE v93 COMMIT THAT CREATED IT.
//
// docs/specs/i18n-2026-10.md §5. Until schema v93 a \`WorldEvent\` stored its sentence as \`text\`: English prose
// with the params already poured in. v93 adds \`c?: CopyRef\` beside it, and the v92 -> v93 migration back-fills
// \`c\` on every old row it can recognise – by matching the stored text against THIS table (\`reverseMatch.ts\`).
//
// ⚠ THE NAME IS THE CONTRACT. It is named for the LAST version whose code could only store prose, and it is the
// closed set of sentences that code could write: old saves cannot contain strings future code writes, so a
// wording change in the engine tomorrow never touches this file – a row written under the old wording must still
// be recognised, and the only thing that recognises it is a snapshot of the old wording. A change here would
// re-interpret every save the migration has not yet run on; \`tests/i18n-l3-0-legacy-match.test.ts\` pins the
// file's content hash so that touching it is a decision somebody has to make on purpose, and make again there.
//
// ⚠ HOW IT WAS BUILT, SO IT CAN BE REBUILT AND CHECKED. A static sweep (the TypeScript AST with the type
// checker, tools/legacy-templates-sweep.ts) of every place the engine at commit ${BASE} writes the text of a
// \`WorldEvent\`: each \`addEvent(world, { text })\` call and each \`fireMilestone(world, key, text)\` call, the
// text expression followed through template literals, conditionals (every branch is its own sentence – English
// plural forks are separate literals, spec §3.3), \`+\` joins, local variables, sentence tables and the helper
// functions that build a whole sentence. A runtime value (a name, a figure, a tier label, a week label, a
// formatted sum) is a HOLE. Nothing here was typed in by hand except the entries marked MANUAL, which are the
// sentences the sweep cannot reach (the kid-match row is composed in \`matchNews.ts\` and handed in as \`ev.text\`).
// ${byKey.size} entries stored directly (${literal} whole sentences and ${withHoles} templates with holes), plus ${families.length} JOINED FAMILY (the winter
// kit-letter row: the join of whichever of its parts fired) whose ${expansions} ordered selections the matcher expands when the table loads – ${byKey.size + expansions} sentences in all,
// less any that coincide with a direct entry.
//
// ⚠ SPELLING. A key is the English text byte for byte as the code would have produced it for those branches,
// holes numbered in reading order as \`{0}\`, \`{1}\` – the spelling \`cp\` (shared/i18n.ts) gives a tagged template,
// so a later wave that converts a writer to \`cp\` lands on the SAME key and the Russian catalog translates the
// migrated rows and the new ones alike. Where a later wave words its \`cp\` call differently (it may: a plural
// fork can become one ICU message), the old rows keep their English until the catalog is taught the old key –
// which \`ru.json\` can be, key for key, without this file moving.
//
// ⚠ A HOLE CLASS (\`h\`) PINS A SEAM THE ANCHORS CANNOT. Two holes with one space between them – a name and the
// score after it – can be split anywhere; the class says what the second one is made of. Three: a scoreline, a tier label and a finish.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: sentences nothing in the engine writes into an event (the diary, the album,
// the letters – separate classes, later waves may need moves of their own), and the retired wordings of earlier
// versions (a row written under wording that no longer exists in the code does not match, keeps its text and is
// counted – that count is the measured distance from the owner's ruling 4, reported rather than hidden).
`

const body = `
export type HoleClass = 'score' | 'tier' | 'finish'
export type LegacyTemplateEntry = string | readonly [string, Readonly<Record<number, HoleClass>>]

/** A row that is the \`sep\`-join of whichever of its parts fired, in order: its closed set is every ordered non-empty selection, one alternative per
 *  chosen part, with the holes renumbered across the join. Stored as the parts because the selections run to hundreds of sentences (see the matcher). */
export interface JoinedFamily {
  readonly sep: string
  readonly parts: readonly (readonly LegacyTemplateEntry[])[]
}

/** The regular-expression source each class stands for (the hole's capture group wraps it). */
export const HOLE_CLASS_PATTERNS: Readonly<Record<HoleClass, string>> = {
  // a scoreline as the match engine writes it: sets separated by a space, a tiebreak in brackets
  score: '\\\\d+-\\\\d+(?:\\\\(\\\\d+\\\\))?(?: \\\\d+-\\\\d+(?:\\\\(\\\\d+\\\\))?)*',
  // a tier label as the calendar names it: a short Title Case phrase with numbers ('World Tour 15', 'Local Open')
  tier: "[A-Z][A-Za-z]*(?: (?:[A-Z][A-Za-z]*|\\\\d+)){0,3}",
  // a finish as the draw sheet says it ('Champion', 'Runner-up', 'Semifinalist', 'Round of 16')
  finish: "[A-Z][A-Za-z-]*(?: of \\\\d+)?",
}

export const LEGACY_TEMPLATES_V92: readonly LegacyTemplateEntry[] = [
${lines.join('\n')}
]

export const LEGACY_JOINED_V92: readonly JoinedFamily[] = [
${familyLines.join('\n')}
]
`

const out = banner + body
const writeIdx = process.argv.indexOf('--write')
if (writeIdx >= 0 && process.argv[writeIdx + 1]) writeFileSync(process.argv[writeIdx + 1] as string, out)
console.log('sinks', sinks.length, 'direct entries', byKey.size, 'literal', literal, 'withHoles', withHoles, 'classed', classed, 'joined families', families.length, 'expansions', expansions)
console.log(report.filter((r) => r.includes('NOTES') || r.includes('-> 0 ')).join('\n'))
console.log('--- pure dynamic (no sentence to recognise) ---')
console.log(pureDynamic.join('\n'))
console.log('--- adjacent holes with no class (seam arbitrary) ---')
console.log(adjacency.join('\n'))
