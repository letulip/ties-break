// THE IMPORTER – the owner's replacement tables in, `src/i18n/ru.json` out (wave L1b, spec §4 and §9.1).
//
//   npm run i18n:import                          read docs/localization/*.md, report, rewrite ru.json
//   npm run i18n:import -- --dry                 the same, writing nothing
//   npm run i18n:import -- --mark-landed [doc…]  HIS write-back: APPROVED -> LANDED for rows proven live
//   npm run i18n:import -- --tables <dir> --catalog <file> --ru <file>   (scratch copies, for tests)
//
// ⚠ HIS TABLES ARE DATA, AND THE PARSER TREATS THEM AS DATA. About seventy distinct table shapes live in that
// directory, written by hand over a month. The parser therefore decides nothing it can leave ambiguous:
//   · a table is a replacement table only when its header names an English column and a Russian one (a
//     glossary – «English concept» – is not, and a table with no English column cannot be joined);
//   · a cell is a literal only when it is ONE backticked span (an annotation after it is allowed), or plain
//     text; `` `A` / `B` `` and «`Stats` screen / navigation» are not literals and the row says so;
//   · a row is APPROVED only when a backticked status token says so, in the status column or in a note or
//     inline after the Russian; TWO different tokens in one row is AMBIGUOUS, and ambiguous goes to the
//     report, never to ru.json.
// Everything not DRAFT/QUESTION-and-quiet is accounted for in the report: nothing is dropped silently.
//
// ⚠ THE TWO RECORD FILES ARE NEVER READ. `ru-main-delta-2` and `ru-family-voice-pass` quote RETIRED wording on
// purpose (their «old» columns are the before of a before→after), so compiling them would resurrect it.
// `assertNoRecords` throws if one reaches the reader, and `tools/i18n-check.ts` fails when a name on this list
// no longer exists on disk – a rename must not quietly turn the skip off.
//
// ⚠ A ROW COMPILES ONLY ONTO A KEY THE CODE ALREADY ASKS FOR. The join is by English text, with the row's own
// source location as the tiebreak: «Stats» exists in the catalog as a screen heading, the nav label «Stats»
// (App.vue) does not exist yet, and his ruling for the nav label is «Рейтинг» while the heading may stay
// «Статистика». Joining by text alone would attach the nav ruling to the heading – the `Spent` trap of review
// 15 §3.1 – so a row whose hinted file is not among the key's homes is `foreign-surface`: reported, waiting
// for its own call site, not compiled. The same holds for several keys behind one English text (a context
// tag `nav|Stats` vs `heading|Stats`): the hint picks one, otherwise the row is reported as needing a tag.
// An English literal that is live in source but not yet a key (a short label in a script: the census excludes
// those by its own recall rule) is `waiting`; one that is nowhere is `unmatched`, which is drift.
//
// ⚠ IDENTITY ROWS. A row whose Russian equals its English by ruling (§9.5: generated proper nouns stay Latin;
// the product mark) compiles as an identity entry when the key is live, and is `exempt-latin` – never drift,
// never «untranslated» – when no key asks for it (a generated name is never passed through `t()`).
//
// ⚠ `--mark-landed` IS HIS COMMAND (§9.1). It flips a row only when its key has a `t()`/`cp` call site
// (`wrapped` in the catalog – the copy is wired, not merely found) AND ru.json carries the row's value.
// Nothing here runs it against the real tables.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { splitContext } from '../src/shared/i18n'
import { normKey } from './copy-text'
import type { Catalog } from './i18n-extract'

export const TABLES_DIR = 'docs/localization'
export const RU_PATH = 'src/i18n/ru.json'
/** Records of a before→after, not replacement tables: their old columns quote retired wording on purpose. */
export const RECORD_FILES: readonly string[] = ['ru-main-delta-2-2026-10.md', 'ru-family-voice-pass-2026-10.md']

export type Status = 'DRAFT' | 'QUESTION' | 'APPROVED' | 'LANDED' | 'AMBIGUOUS'

export interface Row {
  doc: string
  /** 1-based line in the doc – `--mark-landed` rewrites exactly this line. */
  line: number
  /** The English literal, or null when the cell is not one clean literal. */
  english: string | null
  russian: string | null
  /** The source file the row cites (`src/App.vue:353` -> `src/App.vue`), when a cell is exactly such a path. */
  hint: string | null
  status: Status
  /** Russian equals English and the row says so (§9.5 / «Latin»): a ruled proper noun. */
  ruledLatin: boolean
}

export interface ParseStats {
  files: number
  tables: number
  /** Tables with an English and a Russian column. */
  replacement: number
  glossary: number
  noEnglish: number
  /** Rows in tables the parser could not classify – counted, never hidden. */
  unclassifiedRows: number
  malformedRows: number
  /** `doc:line first-cell` of every skipped row (glossary, no English column, malformed) that carries an
   *  APPROVED/LANDED token – a status the parser could not read is shown to the owner, never dropped. */
  skippedStatus: string[]
}

// ── cells ───────────────────────────────────────────────────────────────────────────────────────────────

/** A markdown table row's cells, split on pipes that are not escaped (`\|`), edges trimmed. */
export function splitRow(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i] ?? ''
    if (c === '\\' && line[i + 1] === '|') {
      cur += '\\|'
      i++
    } else if (c === '|') {
      cells.push(cur)
      cur = ''
    } else cur += c
  }
  cells.push(cur)
  if ((cells[0] ?? '').trim() === '') cells.shift()
  if (cells.length > 0 && (cells[cells.length - 1] ?? '').trim() === '') cells.pop()
  return cells.map((c) => c.trim())
}

/** A cell as a literal: ONE backticked span (an annotation may follow), or plain text. Anything else is null. */
export function literalOf(cell: string): { text: string | null; rest: string } {
  const c = cell.replace(/\\\|/g, '|').trim()
  if (c === '') return { text: null, rest: '' }
  if (!c.includes('`')) return { text: c.replace(/\s+/g, ' '), rest: '' }
  const m = /^`([^`]+)`([\s\S]*)$/.exec(c)
  if (!m) return { text: null, rest: c }
  const rest = (m[2] ?? '').trim()
  if (rest === '' || /^(?:·|\(|[–—-]\s)/.test(rest)) return { text: (m[1] ?? '').replace(/\s+/g, ' ').trim(), rest }
  return { text: null, rest }
}

const HINT = /^`?((?:[\w.-]+\/)*[\w.-]+\.(?:vue|ts))(?::\d+(?:[-–]\d+)?)?`?$/

interface Shape {
  pairs: { en: number; ru: number }[]
  status: number | null
}

/** The header's shape, or a reason the table is not a replacement table. */
function classify(header: string[]): Shape | 'glossary' | 'no-english' | 'no-russian' {
  const h = header.map((c) => c.replace(/`/g, '').trim().toLowerCase())
  if (h.some((c) => c.includes('concept'))) return 'glossary'
  const en: number[] = []
  const ru: number[] = []
  h.forEach((c, i) => {
    if (/^(?:english(?: (?:source|form|pool line))?|английск\S*(?: \S+)?)$/.test(c)) en.push(i)
    else if (/(?:russian|русск)/.test(c) && !/(?:old|retired|dead)/.test(c)) ru.push(i)
  })
  // With no English column, a column literally called `source` IS the English text (diary and commentary tables).
  if (en.length === 0 && ru.length > 0) {
    const s = h.indexOf('source')
    if (s >= 0) en.push(s)
  }
  if (en.length === 0) return 'no-english'
  const pairs: Shape['pairs'] = []
  en.forEach((e, k) => {
    const next = en[k + 1] ?? Infinity
    const r = ru.find((x) => x > e && x < next)
    if (r !== undefined) pairs.push({ en: e, ru: r })
  })
  if (pairs.length === 0) return 'no-russian'
  const st = h.indexOf('status')
  return { pairs, status: st >= 0 ? st : null }
}

/** Every replacement-table row of one document. */
export function parseTables(doc: string, text: string): { rows: Row[]; stats: Omit<ParseStats, 'files'> } {
  const lines = text.split('\n')
  const rows: Row[] = []
  const stats: Omit<ParseStats, 'files'> = { tables: 0, replacement: 0, glossary: 0, noEnglish: 0, unclassifiedRows: 0, malformedRows: 0, skippedStatus: [] }
  const noteSkipped = (n: number): void => {
    const raw = lines[n] ?? ''
    if (/`(?:APPROVED|LANDED)`/.test(raw)) stats.skippedStatus.push(`${doc}:${n + 1} ${(splitRow(raw)[0] ?? '').slice(0, 50)}`)
  }
  for (let i = 0; i + 1 < lines.length; i++) {
    const head = lines[i] ?? ''
    if (!head.startsWith('|') || !/^\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) continue
    stats.tables++
    const header = splitRow(head)
    const shape = classify(header)
    let j = i + 2
    for (; j < lines.length && (lines[j] ?? '').startsWith('|'); j++) {
      if (typeof shape === 'string') {
        stats.unclassifiedRows++
        noteSkipped(j)
        continue
      }
      const cells = splitRow(lines[j] ?? '')
      if (cells.length !== header.length) {
        stats.malformedRows++
        noteSkipped(j)
        continue
      }
      for (const pair of shape.pairs) rows.push(rowFrom(doc, j + 1, cells, shape, pair))
    }
    if (shape === 'glossary') stats.glossary++
    else if (typeof shape === 'string') stats.noEnglish++
    else stats.replacement++
    i = j - 1
  }
  return { rows, stats }
}

function rowFrom(doc: string, line: number, cells: string[], shape: Shape, pair: { en: number; ru: number }): Row {
  const en = literalOf(cells[pair.en] ?? '')
  const ru = literalOf(cells[pair.ru] ?? '')
  const others = cells.filter((_, k) => k !== pair.en && k !== pair.ru)
  let hint: string | null = null
  for (const o of others) {
    const m = HINT.exec(o.trim())
    if (m) {
      hint = m[1] ?? null
      break
    }
  }
  const tokens = new Set<string>()
  const scan = (s: string): void => {
    for (const m of s.matchAll(/`(DRAFT|QUESTION|APPROVED|LANDED)`/g)) tokens.add(m[1] ?? '')
  }
  for (const o of others) scan(o)
  scan(ru.rest)
  scan(en.rest)
  if (shape.status !== null) {
    const m = /\b(DRAFT|QUESTION|APPROVED|LANDED)\b/.exec(cells[shape.status] ?? '')
    if (m) tokens.add(m[1] ?? '')
  }
  const status: Status = tokens.size === 0 ? 'DRAFT' : tokens.size === 1 ? ([...tokens][0] as Status) : 'AMBIGUOUS'
  const ruledLatin = ru.text !== null && ru.text === en.text && /§\s*9\.5|\bLatin\b/i.test(cells.join(' '))
  return { doc, line, english: en.text, russian: ru.text, hint, status, ruledLatin }
}

// ── the files ───────────────────────────────────────────────────────────────────────────────────────────

/** The reader's tripwire: a record file reaching it is a defect, not a skipped input. */
export function assertNoRecords(docs: readonly string[]): void {
  const bad = docs.filter((d) => RECORD_FILES.includes(d.split('/').pop() ?? d))
  if (bad.length > 0) throw new Error(`record file(s) must never be read as replacement tables: ${bad.join(', ')}`)
}

/** `ru-*.md` and the README, minus the two records. Sorted, so two runs read in the same order. */
export function listDocs(dir = TABLES_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !RECORD_FILES.includes(f))
    .sort()
}

export function readRows(docs: readonly string[], dir = TABLES_DIR): { rows: Row[]; stats: ParseStats } {
  assertNoRecords(docs)
  const rows: Row[] = []
  const total: ParseStats = { files: docs.length, tables: 0, replacement: 0, glossary: 0, noEnglish: 0, unclassifiedRows: 0, malformedRows: 0, skippedStatus: [] }
  for (const doc of docs) {
    const parsed = parseTables(doc, readFileSync(join(dir, doc), 'utf8'))
    rows.push(...parsed.rows)
    total.tables += parsed.stats.tables
    total.replacement += parsed.stats.replacement
    total.glossary += parsed.stats.glossary
    total.noEnglish += parsed.stats.noEnglish
    total.unclassifiedRows += parsed.stats.unclassifiedRows
    total.malformedRows += parsed.stats.malformedRows
    total.skippedStatus.push(...parsed.stats.skippedStatus)
  }
  return { rows, stats: total }
}

// ── the join ────────────────────────────────────────────────────────────────────────────────────────────

export interface Live {
  catalog: Catalog
  /** Every literal the census walker saw anywhere in scope, `normKey`-normalised: «live in source, no key yet». */
  seen: ReadonlySet<string>
}

/** A catalog key as the comparison text: tag stripped, escapes undone, every placeholder one marker. */
export function joinKeyOfKey(key: string): string {
  const text = splitContext(key).text.replace(/\\([{}\\#])|\{[A-Za-z0-9_]+\}/g, (_m, esc: string | undefined) => esc ?? '¤')
  return normKey(text.replace(/¤/g, '${x}'))
}

export function indexCatalog(catalog: Catalog): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const key of Object.keys(catalog.keys)) {
    const j = joinKeyOfKey(key)
    const list = index.get(j)
    if (list) list.push(key)
    else index.set(j, [key])
  }
  return index
}

const homeMatches = (home: string, hint: string): boolean => home === hint || home.endsWith(`/${hint}`)

export type Disposition =
  | 'compiled'
  | 'waiting'
  | 'foreign-surface'
  | 'unmatched'
  | 'ambiguous-key'
  | 'ambiguous-cell'
  | 'ambiguous-status'
  | 'conflict'
  | 'exempt-latin'
  | 'pending'
  | 'pending-dead'
  | 'no-literal'

export interface Outcome {
  row: Row
  disposition: Disposition
  key?: string
  value?: string
  why?: string
  /** The homes of the key the row joined (or of its candidates) when that key lives on more than one file. */
  multiSurface?: string[]
}

export interface Prov {
  doc: string
  line: number
  status: Status
  /** Russian equals English: a ruled proper noun or the product mark – never «untranslated». */
  identity: boolean
}

export interface Compiled {
  entries: Map<string, string>
  prov: Map<string, Prov>
  outcomes: Outcome[]
}

const HOLE_TOKEN = /\{\{[^}]*\}\}|\$\{[^}]*\}|\{[A-Za-z_][\w.]*\}|\{\d+\}|\*[A-Za-z]{1,12}\*/g

/** The key's placeholders in order of appearance (`{0}` -> `0`), escapes skipped. */
function keyHoles(key: string): string[] {
  const out: string[] = []
  for (const m of splitContext(key).text.matchAll(/\\[{}\\#]|\{([A-Za-z0-9_]+)\}/g)) if (m[1] !== undefined) out.push(m[1])
  return out
}

/** His placeholders (`{n}`, `*N*`, `{{ x }}`) become the key's (`{0}`) by position in his English cell. */
export function adaptPlaceholders(english: string, russian: string, key: string): { value: string } | { error: string } {
  const eh = english.match(HOLE_TOKEN) ?? []
  const kh = keyHoles(key)
  if (eh.length !== kh.length) return { error: `his English has ${eh.length} placeholder(s), the live key has ${kh.length}` }
  const map = new Map<string, string>()
  for (let i = 0; i < eh.length; i++) {
    const tok = eh[i] ?? ''
    const prev = map.get(tok)
    if (prev !== undefined && prev !== kh[i]) return { error: `his ${tok} stands for two different holes of the key` }
    map.set(tok, kh[i] ?? '')
  }
  let bad = ''
  let value = russian.replace(HOLE_TOKEN, (tok) => {
    const n = map.get(tok)
    if (n === undefined) {
      bad = tok
      return tok
    }
    return `{${n}}`
  })
  if (bad !== '') return { error: `his Russian uses ${bad}, which his English cell does not have` }
  value = value.replace(/\{([A-Za-z_]\w*)(\s*,\s*(?:plural|select)\b)/g, (m, name: string, rest: string) => {
    const n = map.get(`{${name}}`)
    if (n === undefined) {
      bad = `{${name},`
      return m
    }
    return `{${n}${rest}`
  })
  if (bad !== '') return { error: `his Russian switches on ${bad}, which his English cell does not have` }
  return { value }
}

export function compile(rows: readonly Row[], live: Live): Compiled {
  const index = indexCatalog(live.catalog)
  const entries = new Map<string, string>()
  const prov = new Map<string, Prov>()
  const outcomes: Outcome[] = []
  const claimed = new Map<string, number>() // key -> index of its compiled outcome, for conflicts
  const conflicted = new Set<string>()

  for (const row of rows) {
    const eligible = row.status === 'APPROVED' || row.status === 'LANDED' || row.ruledLatin
    const out = (disposition: Disposition, extra: Partial<Outcome> = {}): void => {
      outcomes.push({ row, disposition, ...extra })
    }
    if (row.status === 'AMBIGUOUS') {
      out('ambiguous-status', { why: 'two different status tokens on one row' })
      continue
    }
    if (row.english === null) {
      if (eligible) out('ambiguous-cell', { why: 'the English cell is not one clean literal' })
      else out('no-literal')
      continue
    }
    const jk = normKey(row.english)
    const candidates = index.get(jk) ?? []
    let key: string | undefined
    let disposition: Disposition | null = null
    let why: string | undefined
    if (candidates.length > 0) {
      if (row.hint !== null) {
        const homed = candidates.filter((k) => live.catalog.keys[k]?.home.some((h) => homeMatches(h, row.hint ?? '')))
        if (homed.length === 1) key = homed[0]
        else if (homed.length === 0) {
          disposition = 'foreign-surface'
          why = `the English is live on ${[...new Set(candidates.flatMap((k) => live.catalog.keys[k]?.home ?? []))].join(', ')} but not on ${row.hint}`
        } else {
          disposition = 'ambiguous-key'
          why = `${homed.length} keys carry this English on ${row.hint} (${homed.join(' / ')}) – it needs a context tag`
        }
      } else if (candidates.length === 1) key = candidates[0]
      else {
        disposition = 'ambiguous-key'
        why = `${candidates.length} keys carry this English (${candidates.join(' / ')}) – it needs a context tag`
      }
    }
    const homes = key !== undefined ? live.catalog.keys[key]?.home : undefined
    const multiSurface = homes && homes.length > 1 ? homes : undefined

    if (!eligible) {
      out(candidates.length > 0 ? 'pending' : 'pending-dead', { key, multiSurface })
      continue
    }
    if (disposition !== null) {
      out(disposition, { why })
      continue
    }
    if (key === undefined) {
      if (!row.ruledLatin) {
        const live2 = live.seen.has(jk)
        out(live2 ? 'waiting' : 'unmatched', { why: live2 ? 'the literal is live in source but no call site asks for it yet' : 'no such literal anywhere in the scanned source' })
      } else out('exempt-latin', { why: 'a ruled proper noun no call site passes through t()' })
      continue
    }
    if (row.russian === null) {
      out('ambiguous-cell', { key, why: 'the Russian cell is not one clean literal' })
      continue
    }
    const adapted = adaptPlaceholders(row.english, row.russian, key)
    if ('error' in adapted) {
      out('ambiguous-cell', { key, why: adapted.error })
      continue
    }
    const had = entries.get(key)
    if (had !== undefined && had !== adapted.value) {
      conflicted.add(key)
      const first = claimed.get(key)
      if (first !== undefined) {
        const o = outcomes[first]
        if (o) {
          o.disposition = 'conflict'
          o.why = `another approved row gives «${adapted.value}»`
        }
      }
      out('conflict', { key, value: adapted.value, why: `another approved row gives «${had}»` })
      continue
    }
    if (conflicted.has(key)) {
      out('conflict', { key, value: adapted.value, why: 'this key already has conflicting approved rows' })
      continue
    }
    entries.set(key, adapted.value)
    prov.set(key, { doc: row.doc, line: row.line, status: row.status, identity: adapted.value === row.english })
    claimed.set(key, outcomes.length)
    out('compiled', { key, value: adapted.value, multiSurface })
  }
  // A conflicted key compiles nowhere: two approved rows disagree and neither is more right.
  for (const key of conflicted) {
    entries.delete(key)
    prov.delete(key)
  }
  return { entries, prov, outcomes }
}

export function serializeRu(entries: ReadonlyMap<string, string>): string {
  const keys = [...entries.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  if (keys.length === 0) return '{}\n'
  return `{\n${keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(entries.get(k))}`).join(',\n')}\n}\n`
}

export function readRu(path = RU_PATH): Record<string, string> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>
  } catch {
    return null
  }
}

export function writeRu(entries: ReadonlyMap<string, string>, path = RU_PATH): void {
  writeFileSync(path, serializeRu(entries))
}

// ── --mark-landed ───────────────────────────────────────────────────────────────────────────────────────

export interface LandedChange {
  doc: string
  line: number
  before: string
  after: string
}

/** The rows that may flip: APPROVED, compiled, the key wired by a call site, ru.json carrying exactly the value. */
export function planLanded(
  compiled: Compiled,
  live: Live,
  ru: Readonly<Record<string, string>>,
  dir = TABLES_DIR,
  onlyDocs?: readonly string[],
): { changes: LandedChange[]; skipped: string[] } {
  const changes: LandedChange[] = []
  const skipped: string[] = []
  const texts = new Map<string, string[]>()
  for (const o of compiled.outcomes) {
    if (o.disposition !== 'compiled' || o.row.status !== 'APPROVED' || o.key === undefined) continue
    if (onlyDocs && !onlyDocs.includes(o.row.doc)) continue // one command per batch (§9.1)
    const where = `${o.row.doc}:${o.row.line}`
    if (!live.catalog.keys[o.key]?.wrapped) {
      skipped.push(`${where} «${o.key}» – no call site asks for the key yet`)
      continue
    }
    if (ru[o.key] !== o.value) {
      skipped.push(`${where} «${o.key}» – ru.json does not carry this row's value`)
      continue
    }
    let lines = texts.get(o.row.doc)
    if (!lines) {
      lines = readFileSync(join(dir, o.row.doc), 'utf8').split('\n')
      texts.set(o.row.doc, lines)
    }
    const before = lines[o.row.line - 1] ?? ''
    if ((before.match(/`APPROVED`/g) ?? []).length !== 1) {
      skipped.push(`${where} «${o.key}» – the status token is not unique on its line`)
      continue
    }
    changes.push({ doc: o.row.doc, line: o.row.line, before, after: before.replace('`APPROVED`', '`LANDED`') })
  }
  return { changes, skipped }
}

/** Apply a plan to the tables on disk (or to scratch copies of them). */
export function applyLanded(changes: readonly LandedChange[], dir = TABLES_DIR): void {
  const byDoc = new Map<string, LandedChange[]>()
  for (const c of changes) byDoc.set(c.doc, [...(byDoc.get(c.doc) ?? []), c])
  for (const [doc, list] of byDoc) {
    const path = join(dir, doc)
    const lines = readFileSync(path, 'utf8').split('\n')
    for (const c of list) {
      if (lines[c.line - 1] !== c.before) throw new Error(`${doc}:${c.line} changed since the plan was made – re-run`)
      lines[c.line - 1] = c.after
    }
    writeFileSync(path, lines.join('\n'))
  }
}

// ── the report ──────────────────────────────────────────────────────────────────────────────────────────

export interface BatchCounts {
  rows: number
  approved: number
  compiled: number
  waiting: number
  foreign: number
  unmatched: number
  ambiguous: number
  exempt: number
  pending: number
  pendingDead: number
  multi: number
}

export function coverageByBatch(compiled: Compiled): Map<string, BatchCounts> {
  const by = new Map<string, BatchCounts>()
  for (const o of compiled.outcomes) {
    if (o.disposition === 'no-literal') continue
    let c = by.get(o.row.doc)
    if (!c) {
      c = { rows: 0, approved: 0, compiled: 0, waiting: 0, foreign: 0, unmatched: 0, ambiguous: 0, exempt: 0, pending: 0, pendingDead: 0, multi: 0 }
      by.set(o.row.doc, c)
    }
    c.rows++
    if (o.row.status === 'APPROVED' || o.row.status === 'LANDED' || o.row.ruledLatin) c.approved++
    if (o.multiSurface) c.multi++
    switch (o.disposition) {
      case 'compiled':
        c.compiled++
        break
      case 'waiting':
        c.waiting++
        break
      case 'foreign-surface':
        c.foreign++
        break
      case 'unmatched':
        c.unmatched++
        break
      case 'exempt-latin':
        c.exempt++
        break
      case 'pending':
        c.pending++
        break
      case 'pending-dead':
        c.pendingDead++
        break
      default:
        c.ambiguous++
    }
  }
  return by
}

const pad = (v: string | number, w: number): string => String(v).padStart(w)
const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** The importer's report: every row that is not quietly DRAFT, then the per-batch coverage. */
export function renderReport(compiled: Compiled, parse: ParseStats, live: Live, opts: { verbose?: boolean } = {}): string[] {
  const out: string[] = []
  const count = (d: Disposition): number => compiled.outcomes.filter((o) => o.disposition === d).length
  out.push(
    `tables: ${parse.files} files, ${parse.tables} tables (${parse.replacement} replacement, ${parse.glossary} glossary, ${parse.noEnglish} without an English column), ${parse.unclassifiedRows} rows in unclassified tables, ${parse.malformedRows} malformed rows`,
  )
  out.push(
    `rows with a clean English cell: ${compiled.outcomes.filter((o) => o.disposition !== 'no-literal').length} (pending ${count('pending')} joined to a live key, ${count('pending-dead')} with no live key)`,
  )
  const eligible = compiled.outcomes.filter((o) => o.row.status === 'APPROVED' || o.row.status === 'LANDED' || o.row.ruledLatin || o.disposition === 'ambiguous-status')
  out.push(
    `APPROVED / LANDED / ruled rows: ${eligible.length} – compiled ${count('compiled')}, waiting ${count('waiting')}, foreign-surface ${count('foreign-surface')}, unmatched ${count('unmatched')}, exempt-latin ${count('exempt-latin')}, ambiguous ${count('ambiguous-key') + count('ambiguous-cell') + count('ambiguous-status')}, conflict ${count('conflict')}`,
  )
  for (const o of eligible) {
    const r = o.row
    const ru = o.value ?? r.russian ?? ''
    out.push(`  ${r.doc.replace(/^ru-|-20\d\d-\d\d\.md$/g, '')}:${r.line}  ${r.status.padEnd(8)} ${o.disposition.padEnd(16)} «${clip(r.english ?? '?', 40)}» -> «${clip(ru, 40)}»${o.key !== undefined && o.key !== r.english ? `  [key ${o.key}]` : ''}${o.why ? `  (${o.why})` : ''}`)
  }
  out.push(`APPROVED / LANDED tokens inside tables the parser does not read as replacement tables (glossary, no English column, malformed row): ${parse.skippedStatus.length}`)
  for (const s of parse.skippedStatus) out.push(`  ${s}`)
  const flagged = compiled.outcomes.filter((o) => o.multiSurface)
  const flaggedEligible = flagged.filter((o) => o.disposition === 'compiled')
  out.push(`same English on several surfaces (needs a ctx tag if the meanings differ; REPORT, not a failure): ${flagged.length} rows, ${flaggedEligible.length} of them compiled`)
  for (const o of flaggedEligible) out.push(`  «${clip(o.key ?? '', 40)}» -> ${o.multiSurface?.join(', ')}`)
  if (opts.verbose) {
    for (const o of compiled.outcomes.filter((x) => x.disposition === 'pending-dead')) out.push(`  drift? ${o.row.doc}:${o.row.line} «${clip(o.row.english ?? '', 70)}»`)
  }
  out.push('coverage per editorial batch (a batch = the doc a row came from; rows = rows with a clean English cell)')
  out.push(`  ${'batch'.padEnd(34)}${pad('rows', 6)}${pad('apprv', 6)}${pad('comp', 6)}${pad('wait', 6)}${pad('forgn', 6)}${pad('unmat', 6)}${pad('ambig', 6)}${pad('pend', 6)}${pad('dead', 6)}${pad('multi', 6)}`)
  const by = coverageByBatch(compiled)
  for (const doc of [...by.keys()].sort()) {
    const c = by.get(doc)
    if (!c) continue
    out.push(`  ${doc.replace(/^ru-|-20\d\d-\d\d\.md$/g, '').padEnd(34)}${pad(c.rows, 6)}${pad(c.approved, 6)}${pad(c.compiled, 6)}${pad(c.waiting, 6)}${pad(c.foreign, 6)}${pad(c.unmatched, 6)}${pad(c.ambiguous, 6)}${pad(c.pending, 6)}${pad(c.pendingDead, 6)}${pad(c.multi, 6)}`)
  }
  const keys = Object.keys(live.catalog.keys).length
  out.push(`ru.json: ${compiled.entries.size} of ${keys} catalog keys (${((compiled.entries.size / Math.max(1, keys)) * 100).toFixed(2)}%)`)
  return out
}
