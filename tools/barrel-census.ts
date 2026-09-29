// WHICH OF `src/engine/world.ts`'s EXPORTED NAMES IS IMPORTED THROUGH THE BARREL BY NOBODY.
//
//   npx vite-node tools/barrel-census.ts [--json out.json] [--root <dir>] [--extra <path>]
//
// WHY IT EXISTS, AND WHY IT IS A STANDING INSTRUMENT RATHER THAN A REVIEW PROBE. A-03 (the 26.09
// review, `docs/review-principles-2026-09-26/01-architecture.md:273`) found 93 of the barrel's 627
// names unread through it, the owner's ruling 15 dropped them, and T6.6 froze what was left:
// `tests/principles-a03-barrel-surface.test.ts` pins **537** names. That pin deliberately does NOT
// claim the 537 are used – it claims only that the surface is the surface – so «which of them is
// unread today» is a question with nowhere to look unless this file exists. It is the counterpart to
// `scripts/world-map.mjs`, which answers the other half of the barrel problem (which module OWNS a
// name).
//
// ⚠⚠ THE PROVENANCE THAT LICENSES EVERY NUMBER IT PRINTS. The review's own probe
// (`docs/review-principles-2026-09-26/probes/barrel-usage.mjs`) CANNOT BE RE-RUN: its line 15 reads
// `RAW/graph/world-exports.json`, a Phase-0 artefact that was never committed, so it throws
// `ERR_INVALID_ARG_TYPE` before parsing a line of source. That is row 41 of
// `docs/backlog/the-quality-rig.md`. This arm was therefore rebuilt from the AST of `world.ts`
// itself, needs no artefact – and was then pointed at the review's own baseline to see whether it
// agrees with the finding it replaces:
//
//   git archive 03d92221 src tests tools scripts e2e | tar -x -C /tmp/base
//   npx vite-node tools/barrel-census.ts --root /tmp/base
//   → 627 exported names, 93 with no reader through the barrel
//
// **627 and 93 are A-03's own two numbers, reproduced.** That reproduction is what licenses any
// number this file prints; without it a fresh count is just a different program's opinion. `--root`
// exists FOR that check and is the reason it is kept: a census you cannot point at a known answer is
// a census you cannot trust at a new one. (T6.6 measured 630 / 93 at its own head, and the dead SET
// was byte-identical to the baseline's – T6.5's span-moves changed which module DECLARES a name and
// never which specifier a READER spells.)
//
// ⚠⚠ THE SURFACE NEEDS **TWO** COLLECTOR FORMS, AND MISSING THE SECOND IS HOW A-03's ARITHMETIC GOES
// WRONG BY EXACTLY 20. A collector that reads only `export { … }` statements is complete against
// today's barrel – the file holds 0 declarations since T6.5 – and UNDERCOUNTS the review's baseline,
// where `world.ts` still declared `export function tickWeek`, `export function createWorld` and 18
// others. Measured, because I hit it: 607 instead of 627, and the reproduction above silently failed
// until `export function` / `export const` / `export type` / `export interface` / `export class` were
// collected too. So both forms are read, and `declaredExportsInTheBarrel` is PRINTED rather than
// assumed – on a healthy tree it is 0, which is P4's acceptance measured instead of quoted.
//
// ⚠ PARSED, NEVER GREPPED. `world.ts` is three quarters comment and it QUOTES import and export lines
// in its prose; so do its readers. A regex counts a chronicle as a reader.
//
// ⚠⚠ THE FOUR HARD FORMS, AND HOW EACH IS RESOLVED. Getting any of these wrong moves the answer, and
// three of the four move it towards «nothing is dead», which is the comfortable direction:
//
//   1. NAMESPACE IMPORTS ARE A READER OF WHAT THEY TOUCH, NOT OF EVERYTHING. `tools/compound-cost.ts`
//      binds the barrel as `import * as worldMod` and reads exactly ONE name from it – and reads it
//      as `(worldMod as Record<string, unknown>).coachLadderNote`, so the resolver walks a member
//      access down through parentheses, `as`, `satisfies` and `!` to the bare identifier. Marking all
//      630 live off one namespace import would make the census unfalsifiable.
//      ⚠ AND THE BINDING IS SCOPED, WHICH IS A DEFECT I FOUND IN MY OWN ARM RATHER THAN A PRECAUTION.
//      `tests/principles-b02-commit-order.test.ts` holds TWO `vi.mock` factories, each with
//      `const actual = await importOriginal<…>()` – one on the barrel, one on `db/saves`. A file-wide
//      binding credited the barrel with `actual.commitAutosave` and `actual.touchCareer`, which it
//      does not export. Harmless there, but the same collision could mark a REAL barrel name live off
//      another module's namespace read and hide a dead name. A member access counts only inside the
//      block its binding was declared in.
//   2. TYPE-ONLY IMPORTS ARE READERS. `import type { WorldState } from '…/world'` and the inline
//      `import { …, type X }` form both count, and they are the reason ~47 `world/*` modules keep
//      `WorldState` alive. Dropping a re-export a type reader needs breaks `vue-tsc`, which is why
//      A-03 names `vue-tsc -b --force` and `check:tools` as its proof.
//   3. RE-EXPORTS ARE READERS. `export { X } from '…/world'` reads X; `export * from '…/world'` reads
//      EVERYTHING and is reported loudly (it is 0 today, and `principles-a04-barrel-no-bodies` keeps
//      the barrel's own side of that).
//   4. THE DYNAMIC FORMS, INCLUDING THE PIN THAT MADE THIS FILE NECESSARY. One rule covers all five
//      live sites: the module object is bound by the nearest enclosing declaration. An object pattern
//      NAMES its reads (`const { flipScore } = await import('…/world')`); a plain identifier is a
//      namespace binding, resolved by member access as in 1; a qualified type query
//      (`import('…/world').WorldState`) names one; and **anything bound to nothing names nothing** –
//      a `...actual` spread is a pass-through, and `Object.keys(mod)` passes `mod` as an ARGUMENT
//      rather than touching a member. That last clause is what keeps this census from being fooled by
//      `tests/principles-a03-barrel-surface.test.ts`, whose whole job is to `await import` the barrel:
//      it contributes 0 named reads, so the pin cannot prop up the names it pins.
//
// ⚠ UNTRACKED FILES ARE SCANNED, and any name whose readers are ALL untracked is listed separately
// (`liveOnlyViaUntrackedFiles`). In a shared checkout that is the difference between «a file reads
// this» and «a file somebody has not committed reads this», and it is the arm that proves a throwaway
// reader flipped the verdict.
//
// ⚠ `--extra <path>` adds one path to the scanned set, for exactly that arm: point it at a throwaway
// importer and watch a name leave the dead list. A census that cannot be made to change its mind
// about a named symbol is not a measurement.
//
// ⚠ No `tools/_args.ts` here: its two readers parse NUMERIC arm switches (`--seeds 30`), and every
// flag above is a path or a string.
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import ts from 'typescript'

const flag = (name: string): string | undefined => {
  const at = process.argv.indexOf(name)
  return at >= 0 ? process.argv[at + 1] : undefined
}
const flagAll = (name: string): string[] =>
  process.argv.flatMap((a, i) => (a === name ? [process.argv[i + 1]] : [])).filter((v): v is string => Boolean(v))

const rootArg = flag('--root')
const ROOT = resolve(rootArg ?? '.')
// ⚠ `import ts` above resolved BEFORE this chdir, on purpose: a `--root` tree extracted with
// `git archive` has no `node_modules`, so a require-at-use-time would fail there.
if (rootArg) process.chdir(ROOT)
const outPath = flag('--json')
const WORLD = resolve('src/engine/world.ts')
const WORLD_NOEXT = WORLD.replace(/\.ts$/, '')

const parse = (file: string, text: string): ts.SourceFile =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TS)
const codeOf = (file: string): string => {
  const text = readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return text
  // A `.vue` file is code only inside its `<script>` blocks.
  return [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
}
const isBarrel = (fromFile: string, spec: string): boolean => {
  if (!spec.startsWith('.')) return false
  const target = resolve(dirname(fromFile), spec)
  return target === WORLD || target === WORLD_NOEXT
}
const lineOf = (sf: ts.SourceFile, node: ts.Node): number =>
  sf.getLineAndCharacterOfPosition(node.getStart()).line + 1

// ── 1. THE SURFACE: every name world.ts exports, classified value vs type ────────────────────────
// `Object.keys` on the module object returns VALUE exports only – a type-only re-export has no
// runtime key – so both halves are counted and reported apart. T6.6's pin freezes them with two
// different instruments for that reason.
interface Exported {
  isType: boolean
  lines: number[]
}
const barrel = parse(WORLD, readFileSync(WORLD, 'utf8'))
const exported = new Map<string, Exported>()
let starExports = 0
let declaredExports = 0

const note = (name: string, isType: boolean, line: number): void => {
  const prev = exported.get(name)
  if (prev) {
    prev.lines.push(line)
    prev.isType = prev.isType && isType
  } else exported.set(name, { isType, lines: [line] })
}

for (const st of barrel.statements) {
  // FORM (i): a DECLARED export. See the header – this is the form that costs 20 names at A-03's
  // baseline and 0 at a healthy head.
  const modifiers = ts.canHaveModifiers(st) ? ts.getModifiers(st) : undefined
  if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
    const asType = ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st)
    const names: ts.Identifier[] = ts.isVariableStatement(st)
      ? st.declarationList.declarations.map((d) => d.name).filter((n): n is ts.Identifier => ts.isIdentifier(n))
      : (ts.isFunctionDeclaration(st) ||
            ts.isClassDeclaration(st) ||
            ts.isTypeAliasDeclaration(st) ||
            ts.isInterfaceDeclaration(st) ||
            ts.isEnumDeclaration(st)) &&
          st.name &&
          ts.isIdentifier(st.name)
        ? [st.name]
        : []
    for (const n of names) {
      declaredExports += 1
      note(n.text, asType, lineOf(barrel, st))
    }
    continue
  }
  // FORM (ii): a re-export statement, with or without a module specifier.
  if (!ts.isExportDeclaration(st)) continue
  const clause = st.exportClause
  if (!clause || !ts.isNamedExports(clause)) {
    starExports += 1
    continue
  }
  for (const el of clause.elements) {
    // ⚠ THE PUBLIC NAME IS `el.name`, NEVER `propertyName`: `export { foo as bar }` exports `bar`.
    // An IMPORT is the mirror – the name READ from a module is `propertyName ?? name` – and the two
    // loops in this file are deliberately written the opposite way round.
    note(el.name.text, Boolean(st.isTypeOnly || el.isTypeOnly), lineOf(barrel, el))
  }
}

// ── 2. THE READERS ───────────────────────────────────────────────────────────────────────────────
const gitFiles = (args: string): string[] => {
  try {
    return execSync(`git ls-files ${args} src tests tools scripts e2e`, { encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch {
    return []
  }
}
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' || e.name.startsWith('.') ? [] : e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
  )

const inGitTree = !rootArg
const tracked = inGitTree
  ? gitFiles('')
  : ['src', 'tests', 'tools', 'scripts', 'e2e'].filter(existsSync).flatMap(walk).map((f) => relative(ROOT, resolve(f)))
const untracked = new Set(inGitTree ? gitFiles('--others --exclude-standard') : [])
const files = [...new Set([...tracked, ...untracked, ...flagAll('--extra')])]
  .filter((f) => /\.(ts|mts|cts|vue|mjs|cjs|js)$/.test(f) && !f.endsWith('.d.ts') && existsSync(f))
  .filter((f) => resolve(f) !== WORLD) // the barrel is not a reader of itself

interface Exotic {
  file: string
  line: number
  form: string
}
const readBy = new Map<string, Set<string>>()
const exotic: Exotic[] = []
const noteRead = (name: string, file: string): void => {
  const at = readBy.get(name)
  if (at) at.add(file)
  else readBy.set(name, new Set([file]))
}

for (const file of files) {
  const sf = parse(file, codeOf(file))
  /** Namespace-like bindings onto the barrel, each with the SCOPE its member accesses must sit in –
   *  see hard form 1 in the header for the two-`vi.mock` collision this prevents. */
  const namespaces: { name: string; scope: ts.Node }[] = []
  let touchesBarrel = false

  const visit = (node: ts.Node): void => {
    // (a) the static forms.
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      isBarrel(file, node.moduleSpecifier.text)
    ) {
      touchesBarrel = true
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause
        if (clause) {
          if (clause.name) noteRead('default', file)
          const bindings = clause.namedBindings
          if (bindings && ts.isNamespaceImport(bindings)) {
            namespaces.push({ name: bindings.name.text, scope: sf })
            exotic.push({ file, line: lineOf(sf, node), form: `import * as ${bindings.name.text}` })
          } else if (bindings) {
            // ⚠ the READ name is `propertyName ?? name` – the mirror of the export loop above.
            for (const el of bindings.elements) noteRead((el.propertyName ?? el.name).text, file)
          }
        }
      } else {
        const clause = node.exportClause
        if (!clause || !ts.isNamedExports(clause)) {
          exotic.push({ file, line: lineOf(sf, node), form: 'export * – the WHOLE surface is read here' })
          for (const name of exported.keys()) noteRead(name, file)
        } else for (const el of clause.elements) noteRead((el.propertyName ?? el.name).text, file)
      }
    }
    // (b) the dynamic forms: `import('…')` as a call, and `import('…')` as a TYPE.
    const dynamic: ts.Expression | undefined =
      ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
        ? node.arguments[0]
        : ts.isImportTypeNode(node) && node.argument && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : undefined
    if (dynamic && ts.isStringLiteral(dynamic) && isBarrel(file, dynamic.text)) {
      touchesBarrel = true
      if (ts.isImportTypeNode(node) && node.qualifier) {
        const q = ts.isIdentifier(node.qualifier) ? node.qualifier.text : node.qualifier.right.text
        noteRead(q, file)
        exotic.push({ file, line: lineOf(sf, node), form: `import('…/world').${q}` })
      } else {
        let owner: ts.Node | undefined = node.parent
        while (owner && !ts.isVariableDeclaration(owner) && !ts.isSourceFile(owner)) owner = owner.parent
        if (owner && ts.isVariableDeclaration(owner) && ts.isObjectBindingPattern(owner.name)) {
          for (const el of owner.name.elements) {
            const n = el.propertyName ?? el.name
            if (ts.isIdentifier(n)) noteRead(n.text, file)
          }
          exotic.push({ file, line: lineOf(sf, node), form: 'const { … } = await import(…)' })
        } else if (owner && ts.isVariableDeclaration(owner) && ts.isIdentifier(owner.name)) {
          let scope: ts.Node | undefined = owner.parent
          while (scope && !ts.isBlock(scope) && !ts.isModuleBlock(scope) && !ts.isSourceFile(scope)) scope = scope.parent
          namespaces.push({ name: owner.name.text, scope: scope ?? sf })
          exotic.push({ file, line: lineOf(sf, node), form: `const ${owner.name.text} = … import(…)` })
        } else {
          // ⚠ THE CLAUSE THAT KEEPS THE CENSUS HONEST ABOUT ITS OWN PIN – see hard form 4.
          exotic.push({ file, line: lineOf(sf, node), form: 'import(…) bound to nothing – reads no name' })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sf, visit)
  if (!touchesBarrel || namespaces.length === 0) continue

  // (c) resolve every namespace-like binding by the members it touches, inside its own scope.
  const bare = (e: ts.Expression): ts.Expression => {
    let x = e
    for (;;) {
      if (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x) || ts.isSatisfiesExpression(x) || ts.isTypeAssertionExpression(x)) x = x.expression
      else return x
    }
  }
  const boundHere = (node: ts.Node, name: string): boolean =>
    namespaces.some((b) => {
      if (b.name !== name) return false
      for (let up: ts.Node | undefined = node; up; up = up.parent) if (up === b.scope) return true
      return false
    })
  const members = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) {
      const root = bare(node.expression)
      if (ts.isIdentifier(root) && boundHere(node, root.text)) noteRead(node.name.text, file)
    } else if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
      const root = bare(node.expression)
      if (ts.isIdentifier(root) && boundHere(node, root.text)) noteRead(node.argumentExpression.text, file)
    }
    ts.forEachChild(node, members)
  }
  ts.forEachChild(sf, members)
}

// ── 3. THE VERDICT ───────────────────────────────────────────────────────────────────────────────
const all = [...exported.keys()].sort()
const dead = all.filter((n) => !readBy.has(n))
const live = all.filter((n) => readBy.has(n))
const typeOf = (n: string): boolean => exported.get(n)?.isType ?? false
const report = {
  tree: inGitTree ? execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() : `(tree at ${ROOT})`,
  worldLines: readFileSync(WORLD, 'utf8').split('\n').length,
  exportStarStatements: starExports,
  declaredExportsInTheBarrel: declaredExports,
  exportedNames: all.length,
  valueExports: all.filter((n) => !typeOf(n)).length,
  typeOnlyExports: all.filter((n) => typeOf(n)).length,
  filesScanned: files.length,
  readThroughTheBarrel: live.length,
  deadNames: dead.length,
  dead: dead.map((n) => `${n}${typeOf(n) ? ' (type)' : ''} @world.ts:${exported.get(n)?.lines.join(',')}`),
  deadPlain: dead,
  liveOnlyViaUntrackedFiles: live
    .filter((n) => [...(readBy.get(n) ?? [])].every((f) => untracked.has(f)))
    .map((n) => `${n} <- ${[...(readBy.get(n) ?? [])].join(', ')}`),
  exotic,
}
if (outPath) {
  const usedBy = Object.fromEntries([...readBy].map(([k, v]) => [k, [...v]]))
  writeFileSync(outPath, `${JSON.stringify({ ...report, usedBy }, null, 1)}\n`)
}
console.log(JSON.stringify(report, null, 1))
