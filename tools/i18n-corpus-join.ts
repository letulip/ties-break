// THE CORPUS JOINER – his COORDINATE tables, joined to the live corpora by POSITION (11.10).
//
// Three of his documents translate a corpus the engine already holds as a RECTANGLE – the album (occasion x voice x
// register), the birthday gifts (gift x field) and the week-note grid (voice x moment x stage) – and they do it
// WITHOUT an English column: a cell is addressed by where it sits (`A1 first-court`, `sunny`, `note`), not by the
// sentence it renders. The importer reads a table only when its header names an English column, so about eight hundred
// of his finished lines were invisible to it. This module is the missing half:
//
//   1. a per-family PARSER turns every cell into a COORDINATE (the heading, the row label and the column header carry
//      it – nothing is counted by position in the file);
//   2. the LIVE corpus – the same constants the seats walk (`tools/i18n-seats.ts`) – answers with the English string
//      at that coordinate, and that string IS the catalog key;
//   3. the pair goes to `compile()` as an ordinary `Row`, so conflicts, placeholder adaptation, the pending class,
//      the identity law and the hint's `foreign-surface` guard are the importer's own rails and not a second copy.
//
// ⚠ NO GUESSING. A coordinate that finds no pair in the live corpus – an id that died, a voice or a band the source no
// longer has, a field the corpus never held – is a `corpus-orphan`: named in the report, never in ru.json. The English
// moves under him (his baseline is d69ff15d and main walks on), and a join that quietly attached his line to the
// nearest neighbour would put a sentence about one occasion under another. An EMPTY Russian cell is the importer's own
// `pending` (his column, not yet written); it is not an orphan and not a defect.
//
// ⚠ HIS WORDS ARE NOT TOUCHED. The only transformation a cell undergoes is the importer's (`literalOf`: the backticks
// come off, a run of whitespace is one space – none of the three documents has one inside a cell, measured 11.10) and
// the importer's placeholder adaptation (`{N}` -> the key's `{0}`), which rewrites a hole's SPELLING, never a word.
//
// ⚠ THREE KINDS OF ORPHAN, KEPT APART BECAUSE THEY MEAN DIFFERENT THINGS:
//   · `moved`        the address is gone from the live corpus (the English walked away from his baseline) – his line
//                    waits for him to re-aim it;
//   · `russian-only` the address exists but the FIELD does not: the gift table's `event` is a sentence he added for
//                    Russian because a nominative label cannot be inserted into an accusative sentence (RU-09A §1).
//                    There is no English to be the key, so it cannot be a catalog key until the engine grows the field.
//   · `unreadable`   a row of a recognised table whose cells do not match its header, or a recognised table whose heading no longer names its
//                    address (no occasion id, no gift id, no voice) – counted and named, never guessed at, and never a family quietly gone silent.
//
// ⚠ A LIVE FIELD NO KEY ASKS FOR IS NOT AN ORPHAN. The gift `short` (the diary's noun) is a real string the catalog does
// not key; its row joins to its English and meets the importer's `waiting` class ("live in source, no call site asks
// for it yet") – the same name every other such row already carries.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BEREAVED_WORDS, BIRTHDAY_REFS, DIVORCED_WORDS, EXAM_LINES, FORK_AFTERMATH_WORDS, MOTHERHOOD_WORDS, OFF_SEASON_LINES, VOICE_LINES } from '../src/engine/diary/weekNotes'
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER } from '../src/engine/world/birthday'
import { HOLE_TOKEN, literalOf, readRows, splitRow, TABLES_DIR } from './i18n-import'
import type { Compiled, ParseStats, Row, Status } from './i18n-import'

export type CorpusFamily = 'album' | 'album-facts' | 'gifts' | 'week-notes'

/** The three documents the joiner reads, by name – the gate fails when one is gone from the tables directory (a rename must not quietly turn a family off, the `RECORD_FILES` lesson). `album-facts` is the album document's own `source fact | Russian line` table. */
export const CORPUS_DOCS: Readonly<Record<'album' | 'gifts' | 'week-notes', string>> = {
  album: 'ru-album-corpus-2026-10.md',
  gifts: 'ru-birthday-corpus-2026-10.md',
  'week-notes': 'ru-diary-week-notes-corpus-2026-10.md',
}

/** The file each family's strings are homed on in the catalog – the row's hint, so a text collision with a key of ANOTHER surface is `foreign-surface` (reported), never a silent attach. */
export const HOMES = {
  album: 'src/engine/world/albumCorpus.ts',
  albumFacts: 'src/engine/world/albumBook.ts',
  gifts: 'src/engine/world/birthday.ts',
  weekNotes: 'src/engine/diary/weekNotes.ts',
} as const

// ── the live corpora, as plain data (so a test can hand the joiner a miniature) ─────────────────────────────

export interface GiftLike {
  id: string
  label: string
  note: string
  again: string
  ask: string
  short: string
  unlicensed?: { ask?: string; note?: string; again?: string }
}
export interface BandLike {
  from: number
  to: number
  gifts: readonly GiftLike[]
}
type Strings = Readonly<Record<string, string>>
type Matrix<T> = Readonly<Record<string, Readonly<Record<string, T>>>>
/** A live cell: its English, or null where the cell is a template function (its key is the ref's, not derivable here). */
type Cells = Readonly<Record<string, string | null>>

export interface Corpora {
  album: {
    occasions: readonly { id: string; voices: Matrix<string> }[]
    /** direction -> voice -> { note, line } */
    arc: Matrix<Strings>
  }
  gifts: { day: GiftLike; bands: readonly BandLike[]; college: BandLike }
  weekNotes: {
    /** voice -> moment -> stage -> cell */
    staged: Matrix<Cells>
    exams: Cells
    /** the KEY (the `cp` template, hole and all) of each birthday cell: voice -> stage -> key */
    birthday: Matrix<string | null>
    offSeason: Matrix<string | null>
    motherhood: Matrix<string>
    bereaved: Strings
    divorced: Strings
    fork: Matrix<string>
  }
}

const cellText = (t: string | ((f: never) => string)): string | null => (typeof t === 'string' ? t : null)
const mapValues = <T, U>(o: Readonly<Record<string, T>>, f: (v: T) => U): Record<string, U> => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]))

/** The real corpora: the engine's own constants, never retyped. */
export function liveCorpora(): Corpora {
  return {
    album: {
      occasions: ALBUM_CORPUS.map((o) => ({
        id: o.id,
        // ⚠ r49 №7 – the RU tables and this join still speak ONE hand per voice. The throw is a
        // ratchet: the content half that grows a pool must extend the fixture grammar and this
        // shape together, not silently translate variants[0] and drop the rest.
        voices: mapValues(o.voices, (pool) => {
          if (pool.length !== 1) throw new Error(`r49 №7: «${o.id}» grew ${pool.length} variant hands – extend the i18n join and the RU fixture grammar before growing a pool`)
          return { note: pool[0].note, caption: pool[0].caption, line: pool[0].line }
        }),
      })),
      arc: mapValues(ALBUM_ARC, (vs) => mapValues(vs, (h) => ({ note: h.note, line: h.line }))),
    },
    gifts: { day: BIRTHDAY_DAY_TOGETHER, bands: BIRTHDAY_BANDS.filter((b) => b !== BIRTHDAY_COLLEGE_BAND), college: BIRTHDAY_COLLEGE_BAND },
    weekNotes: {
      staged: mapValues(VOICE_LINES, (moments) => mapValues(moments, (stages) => mapValues(stages, cellText))),
      exams: mapValues(EXAM_LINES, cellText),
      // a birthday cell is a template function; its key is the `cp` ref's – read off the engine's own ref with a stand-in age, the way the seats read the tournament row
      birthday: mapValues(BIRTHDAY_REFS, (stages) => mapValues(stages, (ref) => ref({ birthdayAge: 14 } as never).k)),
      offSeason: mapValues(OFF_SEASON_LINES, (stages) => mapValues(stages, cellText)),
      motherhood: MOTHERHOOD_WORDS,
      bereaved: BEREAVED_WORDS,
      divorced: DIVORCED_WORDS,
      fork: FORK_AFTERMATH_WORDS,
    },
  }
}

/** Every English string a family's live corpus holds that a catalog key can be – what "covered" is measured against. */
export function liveStrings(c: Corpora): Record<'album' | 'gifts' | 'week-notes', string[]> {
  const uniq = (l: string[]): string[] => [...new Set(l)]
  const walk = (x: unknown, out: string[]): string[] => {
    if (typeof x === 'string') out.push(x)
    else if (x !== null && typeof x === 'object') for (const v of Object.values(x)) walk(v, out)
    return out
  }
  const gifts = [c.gifts.day, ...c.gifts.bands.flatMap((b) => b.gifts), ...c.gifts.college.gifts]
  const w = c.weekNotes
  return {
    album: uniq([...c.album.occasions.flatMap((o) => walk(o.voices, [])), ...walk(c.album.arc, [])]),
    gifts: uniq(gifts.flatMap((g) => [g.label, g.note, g.again, g.ask, ...Object.values(g.unlicensed ?? {}).filter((v): v is string => typeof v === 'string')])),
    'week-notes': uniq(walk([w.staged, w.exams, w.birthday, w.offSeason, w.motherhood, w.bereaved, w.divorced, w.fork], [])),
  }
}

// ── reading a document: headings and tables, with their lines ──────────────────────────────────────────────

interface Heading {
  kind: 'heading'
  level: number
  text: string
  line: number
}
interface Table {
  kind: 'table'
  line: number
  header: string[]
  rows: { line: number; cells: string[] }[]
}

/** The document as a stream of headings and tables (code fences skipped). The table test is the importer's own: a `|` line followed by a rule line. */
export function walkDoc(text: string): (Heading | Table)[] {
  const lines = text.split('\n')
  const out: (Heading | Table)[] = []
  let fenced = false
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] ?? ''
    if (/^\s*```/.test(l)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const h = /^(#{1,6})\s+(\S.*?)\s*$/.exec(l)
    if (h) {
      out.push({ kind: 'heading', level: (h[1] ?? '').length, text: h[2] ?? '', line: i + 1 })
      continue
    }
    if (l.startsWith('|') && /^\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) {
      const rows: Table['rows'] = []
      let j = i + 2
      for (; j < lines.length && (lines[j] ?? '').startsWith('|'); j++) rows.push({ line: j + 1, cells: splitRow(lines[j] ?? '') })
      out.push({ kind: 'table', line: i + 1, header: splitRow(l), rows })
      i = j - 1
    }
  }
  return out
}

const bare = (cell: string): string => cell.replace(/`/g, '').trim()
/** A label compared as the code spells it: «fresh body» = `freshBody`, «off-season» = `offSeason`. */
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// ── cells, resolution, orphans ─────────────────────────────────────────────────────────────────────────────

export type OrphanKind = 'moved' | 'russian-only' | 'unreadable'

export type Resolved = { english: string; home: string } | { orphan: string; kind: OrphanKind }

/** One cell of a coordinate table, parsed: where it is, what it says, and how to ask the live corpus what sits at that coordinate. */
export interface Cell {
  family: Exclude<CorpusFamily, 'album-facts'>
  doc: string
  line: number
  /** The coordinate as the report prints it. */
  coord: string
  /** His Russian cell, raw (the importer's `literalOf` reads it). */
  raw: string
  resolve: (c: Corpora) => Resolved
}

export interface CorpusOrphan {
  family: CorpusFamily
  doc: string
  line: number
  coord: string
  kind: OrphanKind
  why: string
  /** His Russian text, so the orphan can be re-aimed without reopening the table. */
  ru: string | null
}

export interface ParsedDoc {
  cells: Cell[]
  /** The album's `source fact | Russian line` pairs – ordinary English->Russian rows, already rows. */
  facts: Row[]
  unreadable: CorpusOrphan[]
  /** Tables the family's parser recognised and read / tables of the document it left alone (voice key, ledgers…). */
  tables: number
  ignored: number
  rows: number
}

const moved = (why: string): Resolved => ({ orphan: why, kind: 'moved' })
const only = (why: string): Resolved => ({ orphan: why, kind: 'russian-only' })
const fresh = (): ParsedDoc => ({ cells: [], facts: [], unreadable: [], tables: 0, ignored: 0, rows: 0 })

/** A recognised table's row, or an `unreadable` orphan when its cells do not match its header. */
function rowCells(parsed: ParsedDoc, family: CorpusFamily, doc: string, t: Table, r: Table['rows'][number]): string[] | null {
  parsed.rows++
  if (r.cells.length === t.header.length) return r.cells
  parsed.unreadable.push({ family, doc, line: r.line, coord: `row «${bare(r.cells[0] ?? '').slice(0, 30)}»`, kind: 'unreadable', why: `the row has ${r.cells.length} cells under a ${t.header.length}-cell header`, ru: null })
  return null
}

/** A table whose SHAPE a family recognises but whose address is missing (the heading above it no longer names an occasion, a gift, a voice): every row is an `unreadable` orphan, named – a heading that drifted must be LOUD, never a family silently gone quiet. */
function lostAddress(parsed: ParsedDoc, family: CorpusFamily, doc: string, t: Table, why: string): void {
  parsed.tables++
  for (const r of t.rows) {
    parsed.rows++
    parsed.unreadable.push({ family, doc, line: r.line, coord: `row «${bare(r.cells[0] ?? '').slice(0, 30)}»`, kind: 'unreadable', why, ru: null })
  }
}

// ── family 1 · the album ───────────────────────────────────────────────────────────────────────────────────

const OCCASION = /^(A\d+) · `([^`]+)`/
const ARC = /^Arc towards `([^`]+)`/
const FACT_SOURCE = /^`[^`]+`$/

function resolveAlbum(id: string, voice: string, field: string): (c: Corpora) => Resolved {
  return (c) => {
    const o = c.album.occasions.find((x) => x.id === id)
    if (o === undefined) return moved(`occasion «${id}» is not in ALBUM_CORPUS`)
    const hand = o.voices[voice]
    if (hand === undefined) return moved(`occasion «${id}» has no «${voice}» voice`)
    const english = hand[field]
    return typeof english === 'string' ? { english, home: HOMES.album } : only(`the live album hand has no «${field}» register`)
  }
}

function resolveArc(direction: string, voice: string, field: string): (c: Corpora) => Resolved {
  return (c) => {
    const d = c.album.arc[direction]
    if (d === undefined) return moved(`the arc has no «${direction}» direction`)
    const hand = d[voice]
    if (hand === undefined) return moved(`the arc towards ${direction} has no «${voice}» voice`)
    const english = hand[field]
    return typeof english === 'string' ? { english, home: HOMES.album } : only(`the live arc hand has no «${field}» register`)
  }
}

export function parseAlbumDoc(doc: string, text: string): ParsedDoc {
  const out = fresh()
  let occasion: { n: string; id: string } | null = null
  let arc: string | null = null
  for (const item of walkDoc(text)) {
    if (item.kind === 'heading') {
      occasion = null
      arc = null
      if (item.level === 3) {
        const o = OCCASION.exec(item.text)
        if (o) occasion = { n: o[1] ?? '', id: o[2] ?? '' }
        const a = ARC.exec(item.text)
        if (a) arc = a[1] ?? ''
      }
      continue
    }
    const header = item.header.map((h) => bare(h).toLowerCase())
    const shape = header.join('|')
    const factTable = shape === 'source fact|russian line'
    const voiceTable = occasion !== null && shape === 'voice|note|caption|line'
    const arcTable = arc !== null && shape === 'birth voice|note|line'
    if (shape === 'voice|note|caption|line' && occasion === null) {
      lostAddress(out, 'album', doc, item, 'the heading above the table names no occasion (expected «A<n> · `id`»)')
      continue
    }
    if (shape === 'birth voice|note|line' && arc === null) {
      lostAddress(out, 'album', doc, item, 'the heading above the table names no arc direction (expected «Arc towards `open`»)')
      continue
    }
    if (!voiceTable && !arcTable && !factTable) {
      out.ignored++
      continue
    }
    out.tables++
    for (const r of item.rows) {
      const cells = rowCells(out, factTable ? 'album-facts' : 'album', doc, item, r)
      if (cells === null) continue
      if (factTable) {
        // an ordinary English -> Russian pair, but only when the source cell is ONE backticked literal: «mother's full name» is a note about a display, not a sentence
        const src = cells[0] ?? ''
        if (!FACT_SOURCE.test(src)) continue
        const en = literalOf(src).text
        const ru = literalOf(cells[1] ?? '')
        out.facts.push({ doc, line: r.line, english: en, russian: ru.text, russianBlank: ru.text === null && ru.rest === '', hint: HOMES.albumFacts, status: statusOf(ru.rest), ruledLatin: false, coord: `${occasion === null ? 'album' : `${occasion.n} ${occasion.id}`} · fact «${(en ?? '').slice(0, 30)}»`, corpus: 'album-facts' })
        continue
      }
      const voice = bare(cells[0] ?? '').toLowerCase()
      for (let k = 1; k < header.length; k++) {
        const field = header[k] ?? ''
        const raw = cells[k] ?? ''
        if (voiceTable && occasion !== null) out.cells.push({ family: 'album', doc, line: r.line, coord: `${occasion.n} ${occasion.id} · ${voice} · ${field}`, raw, resolve: resolveAlbum(occasion.id, voice, field) })
        else if (arc !== null) out.cells.push({ family: 'album', doc, line: r.line, coord: `arc ${arc} · ${voice} · ${field}`, raw, resolve: resolveArc(arc, voice, field) })
      }
    }
  }
  return out
}

// ── family 2 · the birthday gifts ──────────────────────────────────────────────────────────────────────────

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** «fourteen» -> 14, «twenty-two» -> 22; null when it is not a number word. */
export function numberWord(w: string): number | null {
  const [a = '', b] = w.toLowerCase().split('-')
  const u = UNITS.indexOf(a)
  if (b === undefined) {
    if (u >= 0) return u
    const t = TENS.indexOf(a)
    return t >= 2 ? t * 10 : null
  }
  const t = TENS.indexOf(a)
  const o = UNITS.indexOf(b)
  return t >= 2 && o >= 1 && o <= 9 ? t * 10 + o : null
}

type BandSpec = { kind: 'day' } | { kind: 'college' } | { kind: 'range'; from: number; to: number | 'open' }

/** The band a section heading names, from the words in it («Age fifteen», «Ages nineteen to twenty-one», «Through fourteen», «Age twenty-nine and later»); null when it names none. */
export function bandOfHeading(heading: string): BandSpec | null {
  const h = heading.replace(/^\d+\.\s*/, '').toLowerCase()
  if (/^shared non-object option/.test(h)) return { kind: 'day' }
  if (/^college birthday band/.test(h)) return { kind: 'college' }
  const through = /^through ([a-z-]+)/.exec(h)
  if (through) {
    const n = numberWord(through[1] ?? '')
    return n === null ? null : { kind: 'range', from: 0, to: n }
  }
  const later = /^ages? ([a-z-]+) and later/.exec(h)
  if (later) {
    const n = numberWord(later[1] ?? '')
    return n === null ? null : { kind: 'range', from: n, to: 'open' }
  }
  const span = /^ages ([a-z-]+) to ([a-z-]+)/.exec(h)
  if (span) {
    const a = numberWord(span[1] ?? '')
    const b = numberWord(span[2] ?? '')
    return a === null || b === null ? null : { kind: 'range', from: a, to: b }
  }
  const one = /^age ([a-z-]+)/.exec(h)
  if (one) {
    const n = numberWord(one[1] ?? '')
    return n === null ? null : { kind: 'range', from: n, to: n }
  }
  return null
}

function resolveGift(spec: BandSpec | null, bandName: string, id: string, field: string, arm: 'base' | 'unlicensed'): (c: Corpora) => Resolved {
  return (c) => {
    if (spec === null) return moved(`the section heading «${bandName}» names no live birthday band`)
    let pool: readonly GiftLike[]
    if (spec.kind === 'day') pool = [c.gifts.day]
    else if (spec.kind === 'college') pool = c.gifts.college.gifts
    else {
      const bands = c.gifts.bands.filter((b) => b.from === spec.from && (spec.to === 'open' ? b.to >= 99 : b.to === spec.to))
      if (bands.length !== 1) return moved(`${bands.length === 0 ? 'no' : bands.length} live birthday band(s) cover «${bandName}»`)
      pool = bands[0]?.gifts ?? []
    }
    const hits = pool.filter((g) => g.id === id)
    if (hits.length === 0) return moved(`band «${bandName}» has no gift «${id}»`)
    if (hits.length > 1) return moved(`${hits.length} gifts of band «${bandName}» carry the id «${id}»`)
    const gift = hits[0] as GiftLike
    if (arm === 'base') {
      const english = (gift as unknown as Record<string, unknown>)[field]
      return typeof english === 'string' ? { english, home: HOMES.gifts } : only(`the live gift has no «${field}» field`)
    }
    const english = (gift.unlicensed as Record<string, string | undefined> | undefined)?.[field]
    return typeof english === 'string' ? { english, home: HOMES.gifts } : only(`the live gift has no unlicensed «${field}» arm`)
  }
}

export function parseGiftsDoc(doc: string, text: string): ParsedDoc {
  const out = fresh()
  let band: { spec: BandSpec | null; name: string } = { spec: null, name: '' }
  let gift: string | null = null
  for (const item of walkDoc(text)) {
    if (item.kind === 'heading') {
      if (item.level === 2) {
        band = { spec: bandOfHeading(item.text), name: item.text.replace(/^\d+\.\s*/, '') }
        gift = null
      } else if (item.level === 3) gift = /^`([^`]+)`/.exec(item.text)?.[1] ?? null
      continue
    }
    const header = item.header.map((h) => bare(h).toLowerCase())
    if (header[0] !== 'field' || (header.length !== 2 && header.length !== 3)) {
      out.ignored++
      continue
    }
    if (gift === null) {
      lostAddress(out, 'gifts', doc, item, 'the heading above the table names no gift (expected «### `id`»)')
      continue
    }
    out.tables++
    for (const r of item.rows) {
      const cells = rowCells(out, 'gifts', doc, item, r)
      if (cells === null) continue
      const field = bare(cells[0] ?? '').toLowerCase()
      out.cells.push({ family: 'gifts', doc, line: r.line, coord: `gift ${gift} [${band.name}] · ${field}`, raw: cells[1] ?? '', resolve: resolveGift(band.spec, band.name, gift, field, 'base') })
      // the three-column tables (licensed/plenty | unlicensed means, hardship wording | other means): the third column is the live `unlicensed` arm, and `same` says the arm keeps the base words
      const arm = cells[2]
      if (arm !== undefined && bare(arm).toLowerCase() !== 'same') out.cells.push({ family: 'gifts', doc, line: r.line, coord: `gift ${gift} [${band.name}] · unlicensed ${field}`, raw: arm, resolve: resolveGift(band.spec, band.name, gift, field, 'unlicensed') })
    }
  }
  return out
}

// ── family 3 · the week-note grid ──────────────────────────────────────────────────────────────────────────

const VOICE_HEADING = /\b(sunny|fiery|quiet|deep) voice\b/i

function lookup<T>(o: Readonly<Record<string, T>> | undefined, label: string): { key: string; value: T } | null {
  if (o === undefined) return null
  const key = Object.keys(o).find((k) => norm(k) === norm(label))
  return key === undefined ? null : { key, value: o[key] as T }
}

const NULL_CELL = 'is a template function in the live source – its key is the ref\'s, and this joiner will not invent one'

/** Staged cells: voice -> moment -> stage. */
function resolveStaged(voice: string, moment: string, stage: string): (c: Corpora) => Resolved {
  return (c) => {
    const v = c.weekNotes.staged[voice]
    if (v === undefined) return moved(`the voice «${voice}» is not in VOICE_LINES`)
    const m = lookup(v, moment)
    if (m === null) return moved(`VOICE_LINES · ${voice} has no moment «${moment}»`)
    const english = m.value[stage]
    if (english === undefined) return moved(`VOICE_LINES · ${voice} · ${m.key} has no stage «${stage}»`)
    return english === null ? moved(`VOICE_LINES · ${voice} · ${m.key} · ${stage} ${NULL_CELL}`) : { english, home: HOMES.weekNotes }
  }
}

/** The three stage-scoped moments: exams (school only), the birthday (two roof stages) and the off-season (two away ones). */
function resolveScoped(voice: string, moment: string, stage: string): (c: Corpora) => Resolved {
  return (c) => {
    const w = c.weekNotes
    const m = norm(moment)
    let english: string | null | undefined
    if (m === 'exams') {
      if (norm(stage) !== 'school') return moved(`EXAM_LINES has no stage «${stage}» (exams are school-only)`)
      english = w.exams[voice]
    } else if (m === 'birthday') english = w.birthday[voice]?.[stage]
    else if (m === 'offseason') english = w.offSeason[voice]?.[stage]
    else return moved(`no stage-scoped moment «${moment}»`)
    if (english === undefined) return moved(`${moment} · ${voice} · ${stage} is not in the live corpus`)
    return english === null ? moved(`${moment} · ${voice} · ${stage} ${NULL_CELL}`) : { english, home: HOMES.weekNotes }
  }
}

function resolveMotherhood(voice: string, band: string): (c: Corpora) => Resolved {
  return (c) => {
    const v = c.weekNotes.motherhood[voice]
    if (v === undefined) return moved(`MOTHERHOOD_WORDS has no voice «${voice}»`)
    const b = lookup(v, band)
    return b === null ? moved(`MOTHERHOOD_WORDS · ${voice} has no band «${band}»`) : { english: b.value, home: HOMES.weekNotes }
  }
}

function resolveFork(voice: string, arm: 'with' | 'against'): (c: Corpora) => Resolved {
  return (c) => {
    const english = c.weekNotes.fork[voice]?.[arm]
    return typeof english === 'string' ? { english, home: HOMES.weekNotes } : moved(`FORK_AFTERMATH_WORDS has no «${voice}» · ${arm}`)
  }
}

function resolveState(voice: string, state: 'bereaved' | 'divorced'): (c: Corpora) => Resolved {
  return (c) => {
    const english = c.weekNotes[state][voice]
    return typeof english === 'string' ? { english, home: HOMES.weekNotes } : moved(`${state.toUpperCase()}_WORDS has no voice «${voice}»`)
  }
}

export function parseWeekNotesDoc(doc: string, text: string, c: Corpora): ParsedDoc {
  const out = fresh()
  let voice: string | null = null
  const bands = new Set(Object.values(c.weekNotes.motherhood).flatMap((v) => Object.keys(v).map(norm)))
  for (const item of walkDoc(text)) {
    if (item.kind === 'heading') {
      if (item.level === 2) voice = VOICE_HEADING.exec(item.text)?.[1]?.toLowerCase() ?? null
      continue
    }
    const header = item.header.map((h) => bare(h))
    const head = (header[0] ?? '').toLowerCase()
    const rest = header.slice(1)
    const forkArm = (h: string): 'with' | 'against' | null => (/\bwent with\b/i.test(h) ? 'with' : /\bwent against\b/i.test(h) ? 'against' : null)
    const motherhood = head === 'voice' && rest.some((h) => bands.has(norm(h)) || forkArm(h) !== null)
    const states = head === 'state' && rest.length > 0 && rest.every((h) => c.weekNotes.bereaved[h.toLowerCase()] !== undefined)
    if ((head === 'moment' || (head === 'moment/stage' && header.length === 2)) && voice === null) {
      lostAddress(out, 'week-notes', doc, item, 'the heading above the table names no voice (expected «<Sunny|Fiery|Quiet|Deep> voice»)')
      continue
    }
    const staged = head === 'moment'
    const scoped = head === 'moment/stage' && header.length === 2
    if (!motherhood && !states && !staged && !scoped) {
      out.ignored++
      continue
    }
    out.tables++
    for (const r of item.rows) {
      const cells = rowCells(out, 'week-notes', doc, item, r)
      if (cells === null) continue
      const label = bare(cells[0] ?? '')
      const put = (coord: string, raw: string | undefined, resolve: Cell['resolve']): void => {
        out.cells.push({ family: 'week-notes', doc, line: r.line, coord, raw: raw ?? '', resolve })
      }
      if (staged && voice !== null) {
        for (let k = 1; k < header.length; k++) put(`${voice} · ${label} · ${header[k]}`, cells[k], resolveStaged(voice, label, (header[k] ?? '').toLowerCase()))
      } else if (scoped && voice !== null) {
        const [moment = '', stage = ''] = label.split(',').map((s) => s.trim())
        if (stage === '') out.unreadable.push({ family: 'week-notes', doc, line: r.line, coord: `${voice} · ${label}`, kind: 'unreadable', why: 'the row label is not «moment, stage»', ru: literalOf(cells[1] ?? '').text })
        else put(`${voice} · ${moment} · ${stage}`, cells[1], resolveScoped(voice, moment, stage.toLowerCase()))
      } else if (motherhood) {
        const v = label.toLowerCase()
        for (let k = 1; k < header.length; k++) {
          const arm = forkArm(header[k] ?? '')
          if (arm !== null) put(`fork ${v} · ${arm}`, cells[k], resolveFork(v, arm))
          else put(`motherhood ${v} · ${header[k]}`, cells[k], resolveMotherhood(v, header[k] ?? ''))
        }
      } else if (states) {
        const state = /bereave/i.test(label) ? 'bereaved' : /divorc/i.test(label) ? 'divorced' : null
        for (let k = 1; k < header.length; k++) {
          if (state === null) out.unreadable.push({ family: 'week-notes', doc, line: r.line, coord: `${label} · ${header[k]}`, kind: 'unreadable', why: 'the row label is neither bereaved nor divorced', ru: literalOf(cells[k] ?? '').text })
          else put(`${state} · ${header[k]}`, cells[k], resolveState((header[k] ?? '').toLowerCase(), state))
        }
      }
    }
  }
  return out
}

// ── from cells to rows ─────────────────────────────────────────────────────────────────────────────────────

function statusOf(rest: string): Status {
  const tokens = new Set<string>()
  for (const m of rest.matchAll(/`(DRAFT|QUESTION|APPROVED|LANDED)`/g)) tokens.add(m[1] ?? '')
  return tokens.size === 0 ? 'DRAFT' : tokens.size === 1 ? ([...tokens][0] as Status) : 'AMBIGUOUS'
}

/** The English cell the importer will adapt his holes against: the live key, with its one hole spelled the way HIS Russian spells it (`{N}` for the key's `{0}`). Anything with more than one hole is left as the key stands and the importer says what it cannot map – a position is never guessed. */
export function englishFor(key: string, russian: string | null): string {
  if (russian === null) return key
  const his = [...new Set(russian.match(HOLE_TOKEN) ?? [])]
  const ours = [...new Set(key.match(HOLE_TOKEN) ?? [])]
  if (his.length === 0 || his.every((t) => ours.includes(t))) return key
  return his.length === 1 && ours.length === 1 ? key.split(ours[0] ?? '').join(his[0] ?? '') : key
}

function toRow(cell: Cell, english: string, home: string): Row {
  const ru = literalOf(cell.raw)
  return {
    doc: cell.doc,
    line: cell.line,
    english: englishFor(english, ru.text),
    russian: ru.text,
    russianBlank: ru.text === null && ru.rest === '',
    hint: home,
    status: statusOf(ru.rest),
    ruledLatin: false,
    coord: cell.coord,
    corpus: cell.family,
  }
}

export interface CorpusJoin {
  rows: Row[]
  orphans: CorpusOrphan[]
  /** Per family: the cells the tables hold (rows that joined + orphans) and what the live corpus holds. */
  cells: Record<CorpusFamily, number>
  tables: { read: number; ignored: number; rows: number }
}

const emptyJoin = (): CorpusJoin => ({ rows: [], orphans: [], cells: { album: 0, 'album-facts': 0, gifts: 0, 'week-notes': 0 }, tables: { read: 0, ignored: 0, rows: 0 } })

/** Read the corpus documents that are among `docs` and exist in `dir`, and join every cell to the live corpora. */
export function joinCorpora(docs: readonly string[], dir: string, corpora: Corpora): CorpusJoin {
  const join_ = emptyJoin()
  const readDoc = (name: string): string | null => (docs.includes(name) && existsSync(join(dir, name)) ? readFileSync(join(dir, name), 'utf8') : null)
  const sources: [string, (t: string) => ParsedDoc][] = [
    [CORPUS_DOCS.album, (t) => parseAlbumDoc(CORPUS_DOCS.album, t)],
    [CORPUS_DOCS.gifts, (t) => parseGiftsDoc(CORPUS_DOCS.gifts, t)],
    [CORPUS_DOCS['week-notes'], (t) => parseWeekNotesDoc(CORPUS_DOCS['week-notes'], t, corpora)],
  ]
  for (const [name, parse] of sources) {
    const text = readDoc(name)
    if (text === null) continue
    const parsed = parse(text)
    join_.tables.read += parsed.tables
    join_.tables.ignored += parsed.ignored
    join_.tables.rows += parsed.rows
    for (const cell of parsed.cells) {
      join_.cells[cell.family]++
      const r = cell.resolve(corpora)
      if ('orphan' in r) join_.orphans.push({ family: cell.family, doc: cell.doc, line: cell.line, coord: cell.coord, kind: r.kind, why: r.orphan, ru: literalOf(cell.raw).text })
      else join_.rows.push(toRow(cell, r.english, r.home))
    }
    for (const f of parsed.facts) {
      join_.cells['album-facts']++
      join_.rows.push(f)
    }
    for (const u of parsed.unreadable) {
      join_.cells[u.family]++
      join_.orphans.push(u)
    }
  }
  return join_
}

export interface AllRows {
  rows: Row[]
  stats: ParseStats
  corpus: CorpusJoin
}

/** THE READER EVERYTHING THAT COMPILES SHOULD CALL: his replacement tables, then the corpus joiner's rows after them (so a conflict names the table row first). `readRows` stays the tables alone, for the tests that read one document. */
export function readAllRows(docs: readonly string[], dir = TABLES_DIR, corpora: Corpora = liveCorpora()): AllRows {
  const base = readRows(docs, dir)
  const corpus = joinCorpora(docs, dir, corpora)
  return { rows: [...base.rows, ...corpus.rows], stats: base.stats, corpus }
}

// ── the report ─────────────────────────────────────────────────────────────────────────────────────────────

export interface FamilyTally {
  family: CorpusFamily
  cells: number
  joined: number
  pending: number
  conflict: number
  /** a live field no key asks for yet (`waiting`) */
  waiting: number
  /** foreign-surface, ambiguous, unmatched… – the importer's other dispositions, each named in its own report */
  other: number
  orphan: number
  /** the live corpus' own strings (a family with no live corpus of its own reports -1) and how many of them ru.json now carries */
  live: number
  translated: number
}

export function tallyCorpus(corpus: CorpusJoin, compiled: Compiled, corpora: Corpora): FamilyTally[] {
  const live = liveStrings(corpora)
  const families: CorpusFamily[] = ['album', 'album-facts', 'gifts', 'week-notes']
  return families.map((family) => {
    const mine = compiled.outcomes.filter((o) => o.row.corpus === family)
    const n = (d: string): number => mine.filter((o) => o.disposition === d).length
    const own = family === 'album-facts' ? null : live[family]
    return {
      family,
      cells: corpus.cells[family],
      joined: n('compiled'),
      pending: n('pending'),
      conflict: n('conflict'),
      waiting: n('waiting'),
      other: mine.length - n('compiled') - n('pending') - n('conflict') - n('waiting'),
      orphan: corpus.orphans.filter((o) => o.family === family).length,
      live: own === null ? -1 : own.length,
      translated: own === null ? -1 : own.filter((s) => compiled.entries.has(s)).length,
    }
  })
}

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** The corpus joiner's report: one line per family, then every orphan NAMED (grouped where the reason is the same). Orphans are reported and the gate does not fail on them – see `runGate`. */
export function renderCorpusReport(corpus: CorpusJoin, compiled: Compiled, corpora: Corpora, opts: { verbose?: boolean } = {}): string[] {
  const out: string[] = []
  const w = (s: string | number, n: number): string => String(s).padStart(n)
  out.push('corpus joiner – his coordinate tables (no English column) joined to the live corpora by POSITION; the live string at the coordinate is the key')
  out.push(`  ${'family'.padEnd(12)}${w('cells', 6)}${w('joined', 8)}${w('pending', 9)}${w('conflict', 10)}${w('waiting', 9)}${w('other', 7)}${w('orphan', 8)}   live corpus strings -> in ru.json`)
  for (const t of tallyCorpus(corpus, compiled, corpora)) {
    out.push(`  ${t.family.padEnd(12)}${w(t.cells, 6)}${w(t.joined, 8)}${w(t.pending, 9)}${w(t.conflict, 10)}${w(t.waiting, 9)}${w(t.other, 7)}${w(t.orphan, 8)}   ${t.live < 0 ? 'ordinary EN->RU pairs (the album\'s «source fact» table)' : `${t.live} -> ${t.translated}`}`)
  }
  out.push(`  tables read by the joiner: ${corpus.tables.read} (${corpus.tables.rows} rows), ${corpus.tables.ignored} other tables of the same documents left alone (voice key, ledgers, the English-sourced pools the ordinary reader already reads)`)
  const byKind = (k: OrphanKind): number => corpus.orphans.filter((o) => o.kind === k).length
  out.push(`  corpus-orphan: ${corpus.orphans.length} (moved ${byKind('moved')}, russian-only ${byKind('russian-only')}, unreadable ${byKind('unreadable')}) – REPORTED ONLY, the gate does not fail on it: the English walks away from his baseline (d69ff15d) and a Russian-only sentence has no key yet; both wait for him, exactly like a dead DRAFT row`)
  const groups = new Map<string, CorpusOrphan[]>()
  for (const o of corpus.orphans) {
    const key = `${o.family} · ${o.kind} · ${o.why}`
    groups.set(key, [...(groups.get(key) ?? []), o])
  }
  for (const [key, list] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const names = list.slice(0, opts.verbose ? list.length : 6).map((o) => `${o.doc.replace(/^ru-|-20\d\d-\d\d\.md$/g, '')}:${o.line} ${o.coord}`)
    out.push(`    ${list.length} × ${key}`)
    for (const n of names) out.push(`        ${n}`)
    if (!opts.verbose && list.length > names.length) out.push(`        … and ${list.length - names.length} more (npm run i18n:import -- --dry --verbose names them all)`)
  }
  if (opts.verbose) for (const o of corpus.orphans) out.push(`    his Russian for ${o.doc}:${o.line} ${o.coord}: «${clip(o.ru ?? '', 80)}»`)
  return out
}

/** Whether every document the joiner reads is on disk – the gate's `corpus-file` rule. */
export function missingCorpusDocs(dir = TABLES_DIR): string[] {
  return Object.values(CORPUS_DOCS).filter((d) => !existsSync(join(dir, d)))
}
