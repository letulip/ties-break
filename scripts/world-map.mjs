#!/usr/bin/env node

// THE AREA -> OWNER SYMBOL MAP FOR THE `engine/world` BARREL (TOK-4).
//
// ⚠ WHY THIS EXISTS. `src/engine/world.ts` is COMPATIBILITY, NOT DISCOVERY. It re-exports the
// decomposed `engine/world/*` modules under their historical names so that the 277 files importing
// `engine/world` keep working (CLAUDE.md: "that public API must not change"). The cost is that a
// reader who knows a symbol's NAME has no way to find the module that DEFINES it without opening a
// 3,600-line file – ~59k tokens to answer "where does `rollInjury` live?".
//
// This script answers that question three ways, all of them free:
//
//     node scripts/world-map.mjs rollInjury   one symbol -> its owning module and line
//     node scripts/world-map.mjs              regenerate the checked-in map
//     node scripts/world-map.mjs --check      fail if the checked-in map is stale
//
// ⚠ AND IT IS GENERATED, WHICH IS THE POINT. A hand-written map of 200 symbols is a document that
// silently stops being true the first time somebody moves a function – the exact failure the
// context review spent a chapter on. The area names are not invented here either: each module's own
// banner comment is its label, so renaming a concern in the source renames it in the map.
//
// The map is NOT canonical and must never be cited as truth about behaviour. It is an index.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const BARREL = 'src/engine/world.ts'
const OUTPUT = 'tools/generated/world-symbol-map.md'
// The barrel opens on an import, so it has no banner comment to read. It is the only module here
// whose area has to be stated rather than derived – and what it owns is the integration core.
const BARREL_LABEL =
  'THE INTEGRATION CORE: the world state, the save schema, and the weekly tick – what genuinely ' +
  'still lives in the 3,600-line file'

const args = process.argv.slice(2)
const check = args.includes('--check')
const query = args.find((arg) => !arg.startsWith('-'))

/** Every module the barrel is allowed to resolve into, as a repo-relative path. */
function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null
  const base = path.resolve(path.dirname(path.join(root, fromFile)), specifier)
  return path.relative(root, `${base}.ts`).split(path.sep).join('/')
}

async function readSource(rel) {
  const text = await fs.readFile(path.join(root, rel), 'utf8')
  return { text, node: ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true) }
}

function isExported(node) {
  return ts.getModifiers?.(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false
}

function declaredNames(node) {
  const names = []
  for (const statement of node.statements) {
    if (!isExported(statement)) continue
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push({ name: declaration.name.text, node: declaration })
      }
      continue
    }
    if (statement.name && ts.isIdentifier(statement.name)) names.push({ name: statement.name.text, node: statement })
  }
  return names
}

/** Named import bindings: local name -> the module and name it came from. */
function importBindings(file, node) {
  const bindings = new Map()
  for (const statement of node.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue
    const target = resolveSpecifier(file, statement.moduleSpecifier.text)
    if (!target) continue
    const named = statement.importClause.namedBindings
    if (!named || !ts.isNamedImports(named)) continue
    for (const element of named.elements) {
      bindings.set(element.name.text, {
        target,
        local: (element.propertyName ?? element.name).text,
        typeOnly: statement.importClause.isTypeOnly || element.isTypeOnly,
      })
    }
  }
  return bindings
}

/** `export { a } from './x'`, `export * from './x'` and the bare `export { a }` that follows an
 *  import – all three appear in these modules, and a symbol that passes through two hops has to
 *  resolve to the file that DECLARES it or the map sends the reader to a waypoint. */
function reExports(file, node, bindings) {
  const out = []
  for (const statement of node.statements) {
    if (!ts.isExportDeclaration(statement)) continue
    if (!statement.moduleSpecifier) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
      for (const element of statement.exportClause.elements) {
        const local = (element.propertyName ?? element.name).text
        const binding = bindings.get(local)
        if (binding) out.push({ exported: element.name.text, local: binding.local, target: binding.target })
      }
      continue
    }
    const target = resolveSpecifier(file, statement.moduleSpecifier.text)
    if (!target) continue
    if (!statement.exportClause) {
      out.push({ star: true, target })
      continue
    }
    if (!ts.isNamedExports(statement.exportClause)) continue
    for (const element of statement.exportClause.elements) {
      out.push({
        exported: element.name.text,
        local: (element.propertyName ?? element.name).text,
        target,
      })
    }
  }
  return out
}

const moduleCache = new Map()
async function loadModule(rel) {
  if (moduleCache.has(rel)) return moduleCache.get(rel)
  let loaded = null
  try {
    const { text, node } = await readSource(rel)
    const bindings = importBindings(rel, node)
    loaded = {
      file: rel,
      text,
      declared: new Map(declaredNames(node).map((entry) => [entry.name, entry.node])),
      reExports: reExports(rel, node, bindings),
      banner: rel === BARREL ? BARREL_LABEL : banner(text),
    }
  } catch {
    loaded = null
  }
  moduleCache.set(rel, loaded)
  return loaded
}

/** A module's own opening banner, joined to its first full sentence. Every `engine/world/*` file
 *  opens with one, and it is a better area name than anything this script could invent. */
function banner(text) {
  const lines = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('//')) break
    const stripped = line.replace(/^\/\/\s?/, '').trim()
    if (!stripped) break
    lines.push(stripped)
    if (/[.:]$/.test(stripped) && lines.length > 1) break
  }
  if (!lines.length) return ''
  const joined = lines.join(' ')
  const stop = joined.indexOf('. ')
  const sentence = stop === -1 ? joined : joined.slice(0, stop + 1)
  return sentence.replace(/\s+/g, ' ').replace(/\.$/, '').trim()
}

/** Walk re-export hops until the module that actually declares `name`. */
async function ownerOf(startFile, name, seen = new Set()) {
  if (seen.has(`${startFile}:${name}`)) return null
  seen.add(`${startFile}:${name}`)
  const module = await loadModule(startFile)
  if (!module) return null
  if (module.declared.has(name)) return { file: startFile, node: module.declared.get(name) }

  for (const entry of module.reExports) {
    if (entry.star) {
      const found = await ownerOf(entry.target, name, seen)
      if (found) return found
      continue
    }
    if (entry.exported !== name) continue
    const found = await ownerOf(entry.target, entry.local, seen)
    if (found) return found
  }
  return null
}

function lineOf(module, node) {
  if (!module || !node) return null
  return ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart()).line + 1
}

/** Everything `engine/world` exposes, with the module that declares each name. */
async function buildMap() {
  const { text, node } = await readSource(BARREL)
  const imports = importBindings(BARREL, node)
  const entries = []

  for (const statement of node.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
      const fromModule = statement.moduleSpecifier
        ? resolveSpecifier(BARREL, statement.moduleSpecifier.text)
        : null
      for (const element of statement.exportClause.elements) {
        const exported = element.name.text
        const local = (element.propertyName ?? element.name).text
        const typeOnly = statement.isTypeOnly || element.isTypeOnly
        if (fromModule) {
          entries.push({ exported, local, module: fromModule, typeOnly })
          continue
        }
        const binding = imports.get(local)
        if (binding) {
          entries.push({
            exported,
            local: binding.local,
            module: binding.target,
            typeOnly: typeOnly || binding.typeOnly,
          })
          continue
        }
        // Exported by name but never imported: declared in the barrel itself.
        entries.push({ exported, local, module: BARREL, typeOnly })
      }
      continue
    }
    if (!isExported(statement)) continue
    const typeOnly =
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          entries.push({ exported: declaration.name.text, local: declaration.name.text, module: BARREL, typeOnly: false })
        }
      }
      continue
    }
    if (statement.name && ts.isIdentifier(statement.name)) {
      entries.push({ exported: statement.name.text, local: statement.name.text, module: BARREL, typeOnly })
    }
  }

  const resolved = []
  const seenExports = new Set()
  for (const entry of entries) {
    if (seenExports.has(entry.exported)) continue
    seenExports.add(entry.exported)
    const owner = await ownerOf(entry.module, entry.local, new Set())
    const ownerFile = owner?.file ?? entry.module
    const ownerModule = await loadModule(ownerFile)
    resolved.push({
      ...entry,
      owner: ownerFile,
      line: owner ? lineOf(ownerModule, owner.node) : null,
      banner: ownerModule?.banner ?? '',
      unresolved: !owner,
    })
  }

  resolved.sort((a, b) => a.exported.localeCompare(b.exported))
  return { resolved, barrelLines: text.split(/\r?\n/).length }
}

function renameNote(entry) {
  return entry.local === entry.exported ? '' : ` (declared \`${entry.local}\`)`
}

function render({ resolved, barrelLines }) {
  const byOwner = new Map()
  for (const entry of resolved) {
    const list = byOwner.get(entry.owner) ?? []
    list.push(entry)
    byOwner.set(entry.owner, list)
  }
  const owners = [...byOwner.entries()].sort((a, b) => {
    if (a[0] === BARREL) return -1
    if (b[0] === BARREL) return 1
    return b[1].length - a[1].length || a[0].localeCompare(b[0])
  })

  const out = []
  out.push('<!-- GENERATED by `node scripts/world-map.mjs` – do not edit by hand. -->')
  out.push('')
  out.push('# `engine/world` – area to owner')
  out.push('')
  out.push(
    `The barrel \`${BARREL}\` (${barrelLines.toLocaleString('en-US')} lines) re-exports the decomposed ` +
      'modules under their historical names, so every importer sees one flat surface. That is a ' +
      'COMPATIBILITY contract, not a discovery one – this file is the discovery half.',
  )
  out.push('')
  out.push(
    'Regenerate with `node scripts/world-map.mjs`; `node scripts/world-map.mjs --check` fails when ' +
      'it is stale, and CI runs that on every pull request.',
  )
  out.push('')
  out.push(
    '**Do not read this file to answer one question** – that is the habit it exists to replace. ' +
      '`node scripts/world-map.mjs <symbol>` prints the owner and the line, and a plain ' +
      '`grep <symbol> tools/generated/world-symbol-map.md` does the same for a partial name.',
  )
  out.push('')
  out.push(`${resolved.length} exported names across ${owners.length} owning modules.`)
  out.push('')
  out.push('## Areas')
  out.push('')
  out.push('| owner module | area | symbols |')
  out.push('| --- | --- | ---: |')
  for (const [owner, list] of owners) {
    const label = list[0].banner || '–'
    out.push(`| \`${owner}\` | ${label} | ${list.length} |`)
  }
  out.push('')
  out.push('## Symbols by owner')
  out.push('')
  for (const [owner, list] of owners) {
    out.push(`### \`${owner}\``)
    out.push('')
    if (list[0].banner) {
      out.push(`${list[0].banner}.`)
      out.push('')
    }
    // ⚠⚠ NO LINE NUMBERS IN THE CHECKED-IN MAP, DELIBERATELY (19.08). They were here for one day and
    // the `--check` in CI went red on the very next commit - the diff was SIX LINES and every one of
    // them was a line number that had moved; all 233 symbols and all 30 owners were identical. A map
    // that reddens when somebody adds a COMMENT above an export is not a stale map, it is a tripwire
    // on formatting, and a CI step that cries wolf every wave is one people learn to skip. That is
    // the same trap TOK-8 avoided by making size budgets a warning rather than a failure.
    //
    // ⭐ NAVIGATION DID NOT MOVE - IT GOT BETTER. `node scripts/world-map.mjs <symbol>` still prints
    // owner AND line, and it reads the source live, so it is exact at the moment you ask instead of
    // exact at the moment somebody last regenerated. What the FILE answers is the question a file can
    // answer honestly: which module owns this symbol.
    for (const entry of [...list].sort((a, b) => a.exported.localeCompare(b.exported))) {
      const kind = entry.typeOnly ? ' *(type)*' : ''
      out.push(`- \`${entry.exported}\`${kind} – \`${owner}\`${renameNote(entry)}`)
    }
    out.push('')
  }
  const unresolved = resolved.filter((entry) => entry.unresolved)
  if (unresolved.length) {
    out.push('')
    out.push('## Unresolved')
    out.push('')
    out.push(
      'These names are re-exported from a module this script could not read a declaration out of ' +
        '(a `.d.ts`, a package, or a shape it does not parse). The module named is the one the ' +
        'barrel points at.',
    )
    out.push('')
    for (const entry of unresolved) out.push(`- \`${entry.exported}\` – \`${entry.module}\``)
  }
  out.push('')
  return out.join('\n')
}

async function main() {
  const map = await buildMap()

  if (query) {
    const hits = map.resolved.filter((entry) => entry.exported.toLowerCase().includes(query.toLowerCase()))
    if (!hits.length) {
      console.log(`no export named '${query}' reaches ${BARREL} – it is not on the barrel's surface`)
      process.exitCode = 1
      return
    }
    for (const entry of hits) {
      const where = entry.line ? `:${entry.line}` : ''
      console.log(`${entry.exported}${entry.typeOnly ? ' (type)' : ''}  ->  ${entry.owner}${where}${renameNote(entry).replace(/`/g, '')}`)
      if (entry.banner) console.log(`    ${entry.banner}`)
    }
    return
  }

  const rendered = render(map)
  const target = path.join(root, OUTPUT)

  if (check) {
    let current = null
    try {
      current = await fs.readFile(target, 'utf8')
    } catch {
      console.error(`world map: ${OUTPUT} is missing – run \`node scripts/world-map.mjs\``)
      process.exitCode = 1
      return
    }
    if (current !== rendered) {
      console.error(`world map: ${OUTPUT} is stale – run \`node scripts/world-map.mjs\` and commit the result`)
      process.exitCode = 1
      return
    }
    console.log(`world map: ${OUTPUT} is current (${map.resolved.length} symbols)`)
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, rendered)
  console.log(`world map: wrote ${OUTPUT} – ${map.resolved.length} symbols`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
