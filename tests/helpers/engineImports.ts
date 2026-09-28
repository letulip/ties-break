// WHAT A FILE IMPORTS, RESOLVED – the one definition of «this file reaches `engine/world`», T6.7 (Q3).
//
// ⚠⚠ THE DEFECT THAT PUT THIS HERE, AND IT IS A GATE AND A PIN SAYING OPPOSITE THINGS ABOUT ONE EDIT.
// Two negative pins asserted `expect(src).not.toContain('engine/world')` –
// `tests/calendar-screen.test.ts` on `CalendarScreen.vue` and `tests/trophy-podium.test.ts` on
// `src/art/trophies.ts` + `src/composables/trophyArrival.ts`. A substring cannot tell the BARREL from
// the PACKAGE: `'../engine/world/labels'` contains `'../engine/world'`. So the day one of those files
// legitimately imports a pure constant from an owning module – which is exactly the spelling
// `CLAUDE.md`'s P4 rule and `tests/principles-a02-ui-barrel-ratchet.test.ts` ASK for – the pin reddens
// on the conversion the gate demanded, and it reddens on somebody who has no context for it. It is
// also satisfied by TEXT: a comment naming `engine/world/medical.ts` as the home of a rule reddens a
// claim about imports, and this repository writes exactly those notes on purpose.
//
// ⚠ ONE DEFINITION, NOT THREE, and that is the T6.11 argument rather than tidiness
// (`helpers/source.ts`'s lexer header): **the thing that would drift between copies is the definition
// of «reaches the barrel»**, and that definition is what all three instruments were wrong about in
// different ways. The A-02 ratchet, the calendar pin and the podium pin now share this module.
//
// ⚠ WHAT IT IS NOT: not a module graph and not transitive. It answers «what does THIS file's own
// import list name», which is what a negative pin about one file can honestly claim. Reachability is
// `tests/import-cycles.test.ts`'s subject.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ts from 'typescript'
import { regions } from './source'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
/** `src/engine/world.ts` – the barrel itself, bodiless since T6.5. */
export const WORLD_BARREL = resolve(ROOT, 'src/engine/world.ts')
/** `src/engine/world/` – the package the barrel re-exports, where the symbols actually live. */
export const WORLD_PACKAGE = resolve(ROOT, 'src/engine/world')

const SCRIPT_OPEN = 'lang="ts">'

export interface ImportRecord {
  /** The importing file, as it was passed in. */
  file: string
  /** 1-based line WITHIN the script body it was found in – a `.vue` has one body per `<script>`. */
  line: number
  /** The specifier exactly as written. */
  specifier: string
  /** The specifier resolved against the importing file's directory, with no extension appended. */
  resolved: string
  names: string[]
  /** A MIXED import is a `value`: it emits a runtime edge. */
  kind: 'type' | 'value'
}

/** The script bodies a parser should see: a `.ts` file whole, a `.vue` file's `<script … lang="ts">`
 *  blocks (both spellings in the tree end in that marker, and the non-`setup` form exists too).
 *  ⚠ Cut with `regions` from `./source`, never a raw `indexOf` – CLAUDE.md's rule, and its reason:
 *  `indexOf` returns -1 and the region silently widens to almost the whole file. `regions` answers
 *  `[]` for an absent start marker, which for a `.vue` would mean READING NO IMPORTS AT ALL, so that
 *  case throws here rather than passing quietly. */
export function scriptBodies(file: string, text: string): string[] {
  if (!file.endsWith('.vue')) return [text]
  const bodies = regions(text, SCRIPT_OPEN, '</script>').map((b) => b.slice(SCRIPT_OPEN.length))
  if (bodies.length === 0) {
    throw new Error(`${file}: no <script … ${SCRIPT_OPEN} block – a parser would read this SFC as importing nothing`)
  }
  return bodies
}

/**
 * Every `import`/`export … from` in one file, with its specifier RESOLVED.
 *
 * `file` is a repo-relative path (or an absolute one); `text` is read from disk when not supplied, so
 * a caller that already holds the source does not read it twice. Only relative specifiers are
 * resolved – a bare package name is returned as itself, because there is no path to compare.
 */
export function importsOf(file: string, text?: string): ImportRecord[] {
  const abs = resolve(ROOT, file)
  const src = text ?? readFileSync(abs, 'utf8')
  const out: ImportRecord[] = []
  for (const body of scriptBodies(file, src)) {
    const sf = ts.createSourceFile(abs, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) && !ts.isExportDeclaration(st)) continue
      if (!st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue
      const specifier = st.moduleSpecifier.text
      const clause = ts.isImportDeclaration(st) ? st.importClause : null
      const nb = clause?.namedBindings
      // ⚠ THE RE-EXPORT ARM READS ITS OWN ELEMENTS. `isTypeOnly` lives on an `ExportDeclaration` and
      // on an import's CLAUSE, never on an `ImportDeclaration` – the sibling ratchet was bitten by
      // exactly that, and the silent half was `export { type X } from …` filed as a value.
      const exportEls = ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)
        ? [...st.exportClause.elements]
        : []
      const els = nb && ts.isNamedImports(nb) ? [...nb.elements] : exportEls
      const statementTypeOnly = clause?.isTypeOnly || (ts.isExportDeclaration(st) && st.isTypeOnly)
      out.push({
        file,
        line: sf.getLineAndCharacterOfPosition(st.getStart()).line + 1,
        specifier,
        resolved: specifier.startsWith('.') ? resolve(dirname(abs), specifier) : specifier,
        names: els.map((el) => (el.propertyName ?? el.name).text),
        kind: statementTypeOnly || (els.length > 0 && els.every((el) => el.isTypeOnly)) ? 'type' : 'value',
      })
    }
  }
  return out
}

/** ⚠ EXACT, so `src/engine/world/constants` is NOT the barrel. Both spellings of the same file, since
 *  a specifier may or may not carry `.ts`. */
export const isWorldBarrel = (r: ImportRecord): boolean =>
  r.resolved === WORLD_BARREL || r.resolved === WORLD_BARREL.replace(/\.ts$/, '')

/** The barrel OR any module inside `src/engine/world/` – the whole package, for a pin whose claim is
 *  «this file reads the snapshot and nothing else» rather than «this file uses the right specifier». */
export const isWorldPackage = (r: ImportRecord): boolean =>
  isWorldBarrel(r) || r.resolved.startsWith(`${WORLD_PACKAGE}${'/'}`)

/** One-line offender strings for an `expect(…).toEqual([])`, which names WHAT and WHERE on a red. */
export const describeReaches = (reaches: ImportRecord[]): string[] =>
  reaches.map((r) => `${r.file}:${r.line} ${r.kind} import { ${r.names.join(', ')} } from '${r.specifier}'`)

/** Every `.ts`/`.vue` file under a repo-relative directory, or the file itself when it is one. */
export function filesUnder(rel: string): string[] {
  const abs = resolve(ROOT, rel)
  if (!statSync(abs).isDirectory()) return [rel]
  const walk = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))
  return walk(abs)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.vue'))
    .map((f) => f.slice(ROOT.length + 1))
}
