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
//   the score tail     (L3-T, L3-3's ask) the four kid-match keys END in the score hole `{3}`, and the bracket plaque splits
//                      the sentence at its score: a locale VALUE must keep the hole last, once, with nothing after it.
//                      The keys are named in `SCORE_TAIL_KEYS` below and the table is held against the catalog.
//   formats.ru.json    (L3-T) the formatter-locale table is exactly what the importer compiles; every id is a registered
//                      formatter, every pattern parses, reads exactly the parts its formatter declares, and has no long dash.
//   seats              (L3-T) a declared seat (tools/i18n-seats.ts) the tree no longer backs is a RED – it would mark keys wired
//                      that no code asks for.
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
import { FORMAT_EXAMPLES, FORMATS_PATH, serializeFormats } from './i18n-formats'
import type { FormatDef } from './i18n-formats'

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

/** ⭐ L3-T (10.10) – THE SCORE TAIL, as a table. The four kid-match keys (`matchNews.ts`: «she beat / lost to / retired against / beat a retiring …») END in the score hole, and the
 *  bracket plaque on the Season screen splits a row at its score (`text.endsWith(score)`): a translation that puts a word after `{3}`, or moves the score into the middle of the
 *  sentence, degrades the plaque to one line – gracefully, and silently. L3-3's net holds the ENGLISH half (hole 3 IS the kid-perspective score; the sentence ends with it); this is the
 *  locale half, so a ru.json row that breaks it is red the day it is imported, not the day somebody opens the Season screen. The table names the keys; `lintScoreTailTable` holds
 *  it against the catalog, and tests/i18n-l3-t-tooling.test.ts holds it against the source (a FIFTH kid-match key that ends in a hole must arrive in this table). */
export const SCORE_TAIL_KEYS: readonly { key: string; hole: number }[] = [
  { key: '{0}: {1} beat {2} {3}', hole: 3 },
  { key: '{0}: {1} lost to {2} {3}', hole: 3 },
  { key: '{0}: {1} retired against {2} {3}', hole: 3 },
  { key: '{0}: {1} beat a retiring {2} {3}', hole: 3 },
]
const SCORE_TAIL = new Map(SCORE_TAIL_KEYS.map((k) => [k.key, k.hole]))

/** The table is only a rule while the keys it names exist and still end in their hole. */
export function lintScoreTailTable(catalog: Catalog, table: readonly { key: string; hole: number }[] = SCORE_TAIL_KEYS): Problem[] {
  const out: Problem[] = []
  for (const { key, hole } of table) {
    if (!catalog.keys[key]) out.push({ rule: 'score-tail-table', where: key, detail: 'the table names a key the catalog does not hold – the kid-match key moved or was reworded; re-aim SCORE_TAIL_KEYS' })
    else if (!key.endsWith(`{${hole}}`)) out.push({ rule: 'score-tail-table', where: key, detail: `the key no longer ends with its score hole {${hole}} – the rule is moot or the key is wrong` })
  }
  return out
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
    const tailHole = SCORE_TAIL.get(key)
    if (tailHole !== undefined) {
      const hole = `{${tailHole}}`
      const uses = value.split(hole).length - 1
      if (uses !== 1 || !value.endsWith(hole) || value.endsWith(`\\${hole}`)) {
        out.push({ rule: 'score-tail', where: key, detail: `the value «${value}» must END with ${hole}, once (the score is the last hole: the bracket plaque splits the sentence there; words after it, or the score in the middle, degrade the plaque to one line)` })
      }
    }
  }
  return out
}

/** The formatter-locale table's rules (L3-T): ids are registered, patterns parse, read exactly the formatter's parts, carry no long dash. */
export function lintFormats(formats: Readonly<Record<string, string>>, defs: readonly FormatDef[] = FORMAT_EXAMPLES): Problem[] {
  const out: Problem[] = []
  const byId = new Map(defs.map((d) => [d.id, d]))
  for (const [id, pattern] of Object.entries(formats)) {
    const def = byId.get(id)
    if (def === undefined) {
      out.push({ rule: 'format-orphan', where: id, detail: 'formats.ru.json holds a formatter id the registry does not (a hand edit, or a formatter that went)' })
      continue
    }
    if (pattern.includes(EM_DASH)) out.push({ rule: 'em-dash', where: id, detail: `the pattern «${pattern}» carries a long dash; the house dash is the short one (–)` })
    let shape: ReturnType<typeof analyzeMessage>
    try {
      shape = analyzeMessage(pattern)
    } catch (e) {
      if (!(e instanceof MessageError)) throw e
      out.push({ rule: 'icu', where: id, detail: e.message })
      continue
    }
    const want = Object.keys(def.parts).sort()
    const dropped = want.filter((a) => !shape.args.includes(a))
    const invented = shape.args.filter((a) => !want.includes(a))
    if (dropped.length > 0) out.push({ rule: 'parity', where: id, detail: `the pattern drops {${dropped.join('}, {')}} that ${def.formatter.name} supplies` })
    if (invented.length > 0) out.push({ rule: 'parity', where: id, detail: `the pattern reads {${invented.join('}, {')}} that ${def.formatter.name} does not supply` })
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

export function runGate(opts: { tablesDir?: string; catalogPath?: string; ruPath?: string; formatsPath?: string; build?: Parameters<typeof buildCatalog>[0] } = {}): GateResult {
  const tablesDir = opts.tablesDir ?? TABLES_DIR
  const catalogPath = opts.catalogPath ?? CATALOG_PATH
  const ruPath = opts.ruPath ?? RU_PATH
  const formatsPath = opts.formatsPath ?? FORMATS_PATH
  const lines: string[] = []
  const problems: Problem[] = []

  for (const r of RECORD_FILES) {
    if (!existsSync(join(tablesDir, r))) problems.push({ rule: 'record-file', where: r, detail: 'a record file the importer skips by name is gone – a rename would silently turn the skip off' })
  }

  const fresh = buildCatalog(opts.build)
  // ⭐ L3-T: a declared seat the tree no longer backs is a RED (it would mark keys wired that no code asks for); a dynamic call NO seat declares is printed, and
  // tests/i18n-l3-t-tooling.test.ts holds it at zero – the same «a number, not a surprise» the L1b gate always gave `t(variable)`, with the net behind it.
  for (const p of fresh.seatProblems) problems.push({ rule: p.rule, where: p.seat, detail: p.detail })
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
  lines.push(`catalog   ${s.keys} keys from ${s.certainStrings} CERTAIN strings + ${s.callSites} call sites (${s.wrapped} wired by t()/cp or a declared seat, ${s.multiHome} on several files, ${s.dynamicCalls} dynamic t() calls: ${s.dynamicDeclared} declared, ${s.dynamicUndeclared} unreadable)`)
  lines.push(`seats     ${s.seats} declared (tools/i18n-seats.ts) reach ${s.seatKeys} catalog keys${fresh.undeclared.length > 0 ? `; UNDECLARED dynamic calls: ${fresh.undeclared.map((d) => `${d.file}:${d.line} t(${d.arg})`).join(', ')}` : ''}`)
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
  problems.push(...lintScoreTailTable(catalog ?? fresh.catalog))
  // ⭐ L3-T: the formatter-locale table is generated like ru.json, so a hand edit or a table edit nobody re-imported is drift of the same kind.
  const formatsText = existsSync(formatsPath) ? readFileSync(formatsPath, 'utf8') : null
  if (formatsText !== serializeFormats(compiled.formats)) problems.push({ rule: 'formats-stale', where: formatsPath, detail: 'formats.ru.json is not what the importer compiles from the tables now – run npm run i18n:import and commit the diff' })
  let formats: Record<string, string> = {}
  try {
    formats = formatsText !== null ? (JSON.parse(formatsText) as Record<string, string>) : {}
  } catch {
    problems.push({ rule: 'formats-stale', where: formatsPath, detail: 'formats.ru.json does not parse' })
  }
  problems.push(...lintFormats(formats))
  for (const o of compiled.outcomes) {
    if (o.disposition === 'conflict') problems.push({ rule: 'conflict', where: `${o.row.doc}:${o.row.line}`, detail: `«${o.row.english}»: ${o.why ?? 'two approved rows disagree'}` })
  }

  for (const hit of catalogImportsInSrc()) problems.push({ rule: 'shipped', where: hit, detail: 'src/ imports catalog.en.json; it would become a chunk every player downloads' })

  lines.push(`ru.json   ${Object.keys(ru).length} entries (${[...compiled.prov.values()].filter((p) => p.identity).length} identity: product mark / ruled Latin), compiled from ${stats.replacement} replacement tables, ${RECORD_FILES.length} record files skipped`)
  lines.push(`formats   ${Object.keys(formats).length} formatter pattern(s) of ${FORMAT_EXAMPLES.length} registered (${formatsPath})`)
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
