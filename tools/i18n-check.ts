// THE I18N GATE – `npm run i18n:check`, inside `npm run check` (wave L1b, spec §4).
//
// What it holds, each a RED when broken:
//   catalog fresh      src/i18n/catalog.en.json is exactly what the extractor writes from the tracked tree
//                      (the registry pattern: regenerate, compare, fail on drift). A string added, reworded or
//                      removed must arrive with its catalog diff – the translator's moving-target treaty.
//   ru.json fresh      ru.json is exactly what the importer compiles from his tables against that catalog.
//                      A hand edit, or a table edit nobody re-imported, is drift of the same kind.
//   ru.json ⊆ catalog  orphans listed. (The importer cannot produce one; a hand edit can.)
//   placeholder parity the arguments a value reads are exactly the arguments its key reads. A dropped `{0}` is
//                      the classic breakage: the sentence renders with a hole, or a number silently vanishes.
//   ICU parses         every value AND every key, with the formatter's own parser (`analyzeMessage`) – one
//                      parser, never two. A source literal that does not format is a bug in the source.
//   plural categories  a plural in a Russian value carries one/few/many/other (`Intl.PluralRules` says which).
//   the `—` lint       no long dash in a Russian VALUE (CLAUDE.md style; RU-14's own ask – 141 cells were
//                      hand-fixed once and the machine holds the line now).
//   record files       the two skipped files exist under the names the importer skips.
//   not shipped        nothing under src/ imports catalog.en.json (a static import would bundle it).
//
// What it REPORTS and never fails on: the same-English-many-surfaces flag (until a ctx column exists in his
// tables), drift among DRAFT rows (his baseline is d69ff15d and main moves), and the coverage per batch.
//
// ⚠ EVERY RULE IS A PURE FUNCTION OVER PLAIN DATA (`lintRu`, `lintCatalogKeys`), so the mutation arms in
// tests/i18n-pipeline.test.ts drive the SAME code with a fabricated mutation and watch it go red – a gate no
// test has ever seen fail is not known to be a gate.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeMessage, MessageError, splitContext } from '../src/shared/i18n'
import { buildCatalog, CATALOG_PATH, diffCatalogs, parseCatalog, readCatalogText, seenLiterals, serializeCatalog } from './i18n-extract'
import type { Catalog } from './i18n-extract'
import { compile, listDocs, readRows, RECORD_FILES, renderReport, RU_PATH, serializeRu, TABLES_DIR } from './i18n-import'

export interface Problem {
  rule: string
  where: string
  detail: string
}

const EM_DASH = '—'

/** The plural categories a locale requires, from the platform's own rules (`ru`: one, few, many, other). */
export function requiredPluralCategories(locale: string): string[] {
  return new Intl.PluralRules(locale).resolvedOptions().pluralCategories.slice().sort()
}

/** The catalog's own keys must format: a bad English literal is a bug in the source. */
export function lintCatalogKeys(catalog: Catalog): Problem[] {
  const out: Problem[] = []
  for (const key of Object.keys(catalog.keys)) {
    try {
      analyzeMessage(splitContext(key).text)
    } catch (e) {
      if (!(e instanceof MessageError)) throw e
      out.push({ rule: 'key-syntax', where: key, detail: e.message })
    }
  }
  return out
}

/** Everything wrong with a locale file's values, key by key. */
export function lintRu(ru: Readonly<Record<string, string>>, catalog: Catalog, locale = 'ru'): Problem[] {
  const out: Problem[] = []
  const required = requiredPluralCategories(locale)
  for (const [key, value] of Object.entries(ru)) {
    if (!catalog.keys[key]) {
      out.push({ rule: 'orphan', where: key, detail: 'ru.json holds a key the catalog does not (a hand edit, or a string that went)' })
      continue
    }
    if (value.includes(EM_DASH)) out.push({ rule: 'em-dash', where: key, detail: `the value «${value}» carries a long dash; the house dash is the short one (–)` })
    let shape: ReturnType<typeof analyzeMessage>
    try {
      shape = analyzeMessage(value)
    } catch (e) {
      if (!(e instanceof MessageError)) throw e
      out.push({ rule: 'icu', where: key, detail: e.message })
      continue
    }
    let keyArgs: string[] = []
    try {
      keyArgs = analyzeMessage(splitContext(key).text).args
    } catch {
      // The key's own syntax error is reported by lintCatalogKeys; parity has nothing to compare against.
      continue
    }
    const dropped = keyArgs.filter((a) => !shape.args.includes(a))
    const invented = shape.args.filter((a) => !keyArgs.includes(a))
    if (dropped.length > 0) out.push({ rule: 'parity', where: key, detail: `the value drops {${dropped.join('}, {')}} that the English key reads` })
    if (invented.length > 0) out.push({ rule: 'parity', where: key, detail: `the value reads {${invented.join('}, {')}} that the English key does not have` })
    for (const p of shape.plurals) {
      const missing = required.filter((c) => !p.selectors.includes(c))
      if (missing.length > 0) out.push({ rule: 'plural', where: key, detail: `plural on {${p.name}} lacks ${missing.join(', ')} (${locale} needs ${required.join(', ')})` })
    }
  }
  return out
}

/** Nothing under src/ may import the catalog file: a static import would make it a chunk every player downloads. */
export function catalogImportsInSrc(): string[] {
  try {
    const out = execFileSync('git', ['grep', '-nE', `(from|import)\\s*\\(?\\s*['"][^'"]*catalog\\.en`, '--', 'src'], { encoding: 'utf8' })
    return out.split('\n').filter(Boolean)
  } catch {
    return [] // git grep exits 1 when nothing matches
  }
}

export interface GateResult {
  lines: string[]
  problems: Problem[]
}

export function runGate(opts: { tablesDir?: string; catalogPath?: string; ruPath?: string } = {}): GateResult {
  const tablesDir = opts.tablesDir ?? TABLES_DIR
  const catalogPath = opts.catalogPath ?? CATALOG_PATH
  const ruPath = opts.ruPath ?? RU_PATH
  const lines: string[] = []
  const problems: Problem[] = []

  for (const r of RECORD_FILES) {
    if (!existsSync(join(tablesDir, r))) problems.push({ rule: 'record-file', where: r, detail: 'a record file the importer skips by name is gone – a rename would silently turn the skip off' })
  }

  const fresh = buildCatalog()
  const committedText = readCatalogText(catalogPath)
  if (committedText === null) {
    problems.push({ rule: 'catalog-stale', where: catalogPath, detail: 'the file does not exist – run npm run i18n:extract' })
  } else if (committedText !== serializeCatalog(fresh.catalog)) {
    let detail = 'the committed catalog is not what the extractor writes now – run npm run i18n:extract and commit the diff'
    try {
      const d = diffCatalogs(parseCatalog(committedText), fresh.catalog)
      detail += ` (+${d.added.length} added, -${d.removed.length} removed, ~${d.changed.length} changed${d.added[0] ? `; e.g. + «${d.added[0].slice(0, 60)}»` : ''}${d.removed[0] ? `; - «${d.removed[0].slice(0, 60)}»` : ''})`
    } catch {
      detail += ' (and it does not parse)'
    }
    problems.push({ rule: 'catalog-stale', where: catalogPath, detail })
  }
  const catalog = committedText !== null ? safeParse(committedText) : null
  const s = fresh.stats
  lines.push(`catalog   ${s.keys} keys from ${s.certainStrings} CERTAIN strings + ${s.callSites} call sites (${s.wrapped} wired by t()/cp, ${s.multiHome} on several files, ${s.dynamicCalls} dynamic t() calls unreadable)`)
  problems.push(...lintCatalogKeys(fresh.catalog))

  const { rows, stats } = readRows(listDocs(tablesDir), tablesDir)
  const compiled = compile(rows, { catalog: catalog ?? fresh.catalog, seen: seenLiterals })
  const ruText = existsSync(ruPath) ? readFileSync(ruPath, 'utf8') : null
  const wanted = serializeRu(compiled.entries)
  if (ruText !== wanted) problems.push({ rule: 'ru-stale', where: ruPath, detail: 'ru.json is not what the importer compiles from the tables now – run npm run i18n:import and commit the diff' })
  let ru: Record<string, string> = {}
  try {
    ru = ruText !== null ? (JSON.parse(ruText) as Record<string, string>) : {}
  } catch {
    problems.push({ rule: 'ru-stale', where: ruPath, detail: 'ru.json does not parse' })
  }
  problems.push(...lintRu(ru, catalog ?? fresh.catalog))
  for (const o of compiled.outcomes) {
    if (o.disposition === 'conflict') problems.push({ rule: 'conflict', where: `${o.row.doc}:${o.row.line}`, detail: `«${o.row.english}»: ${o.why ?? 'two approved rows disagree'}` })
  }

  for (const hit of catalogImportsInSrc()) problems.push({ rule: 'shipped', where: hit, detail: 'src/ imports catalog.en.json; it would become a chunk every player downloads' })

  lines.push(`ru.json   ${Object.keys(ru).length} entries (${[...compiled.prov.values()].filter((p) => p.identity).length} identity: product mark / ruled Latin), compiled from ${stats.replacement} replacement tables, ${RECORD_FILES.length} record files skipped`)
  lines.push(...renderReport(compiled, stats, { catalog: catalog ?? fresh.catalog, seen: seenLiterals }).map((l) => `  ${l}`))
  lines.push(`i18n:check ${problems.length === 0 ? 'green' : `RED (${problems.length})`} in ${process.uptime().toFixed(1)} s of process time (the tree scan at import is most of it)`)
  return { lines, problems }
}

function safeParse(text: string): Catalog | null {
  try {
    return parseCatalog(text)
  } catch {
    return null
  }
}
