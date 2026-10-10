// THE CATALOG EXTRACTOR – wave L1b of the localization rig (docs/specs/i18n-2026-10.md §4).
//
//   npm run i18n:extract            regenerate src/i18n/catalog.en.json from the tracked tree
//   npm run i18n:check              (also) fails when the committed file is not what this would write
//
// WHAT THE CATALOG IS. Every key the code ASKS the translator for, once: the census's CERTAIN strings
// (the unwrapped copy that still has to be wrapped) plus every `t('…')` / `` cp`…` `` call site (the copy
// already wrapped). A key is the English literal itself (§3.1), so a hole becomes `{0}`, `{1}` … in order –
// exactly what `cp` builds – and a literal `{`, `}` or `\` is escaped the way the formatter reads it. Each
// entry keeps its home files, its census areas, and for each hole the source expressions seen at that
// position (the hint a translator needs to know whether `{0}` is money, weeks or a name).
//
// ⚠ ONE WALKER. The scan is `tools/copy-census-walk.ts` – the census's own reader, not a second scanner –
// so "what is a player-facing string" has one answer. Importing it runs the scan (~2 s).
//
// ⚠ NO LINE NUMBERS IN THE CATALOG, ON PURPOSE. A line moves whenever anyone edits above it, and a catalog
// that changed on every unrelated edit would be regenerated on every PR and read by nobody. Home is the
// FILE; the owner's tables carry a line hint of their own and the importer uses only its file part.
// What does change the catalog is what should: a string added, reworded or removed – the "catalog diff"
// every later wave's PR lists (spec §4).
//
// ⚠ THE FILE IS NEVER SHIPPED. `src/i18n/catalog.ts` lazy-loads `./{ru,es}.json` by NAME, so this file
// (hundreds of KB) cannot become a chunk; `tests/i18n-pipeline.test.ts` proves the glob cannot match it.
//
// ⚠ WHAT IT CANNOT SEE, stated so nobody quotes the count as a ceiling: a short label in a script
// (`{ label: 'Home' }` – the census EXCLUDES it by its own recall rule) is not a key until a call site wraps
// it in `t('Home')`, and `t(variable)` is invisible – `dynamicCalls` counts those so they are a number,
// not a surprise.
//
// ⭐ L3-T (10.10) – BUT A DYNAMIC CALL CAN BE DECLARED. `tools/i18n-seats.ts` names, for each `t(expr)` the walker lists as unreadable and for each ref the engine writes beside a
// corpus string (`c: { k }`), the KEY SET that reaches it – from the real constants, never retyped. A declared seat does two things here: its strings ENTER the catalog (the gift
// catalogue's 159 were invisible to every census rule) and they are marked `wrapped` with the seat's id, so `--mark-landed` can flip an APPROVED row on a seat-only string.
// The declaration is held against the tree: a seat whose site the walker cannot find, or whose writer no longer says what it said, is STALE and marks nothing (the gate goes red).
import { readFileSync, writeFileSync } from 'node:fs'
import { HOLE, areaOf, callKeys, callStats, certain, dynamicSites, holeify, scopeOf } from './copy-census-walk'
import type { DynamicSite } from './copy-census-walk'
import { DECLARED_SEATS, unseatable } from './i18n-seats'
import type { Seat } from './i18n-seats'

export const CATALOG_PATH = 'src/i18n/catalog.en.json'
export const CATALOG_FORMAT = 1

export interface CatalogEntry {
  /** Repo-relative files that hold the string, sorted. */
  home: string[]
  /** Census areas of those sites (screens, lifebeat, ledger…), sorted. */
  area: string[]
  /** Per hole position: the source expressions seen there, sorted. Absent for a string with no holes. */
  ph?: string[][]
  /** True once at least one `t()` / `cp` call site asks for the key – or a DECLARED SEAT does (L3-T) – the copy is wired, not merely found. */
  wrapped?: true
  /** The declared seats (`tools/i18n-seats.ts`) that can hand the key to the code, sorted. Absent for a key that is asked for by a call site alone. */
  seat?: string[]
}

export interface Catalog {
  format: number
  count: number
  keys: Record<string, CatalogEntry>
}

export interface ExtractStats {
  /** CERTAIN strings the walker found (the census's headline number). */
  certainStrings: number
  /** Call sites read: `t('…')` and `` cp`…` ``. */
  callSites: number
  /** `t(variable)` calls whose key the extractor cannot read. */
  dynamicCalls: number
  /** Distinct keys in the catalog. */
  keys: number
  /** Keys that some call site already wraps. */
  wrapped: number
  /** Keys that live in more than one file. */
  multiHome: number
  /** Declared seats (L3-T) and the distinct keys they reach. */
  seats: number
  seatKeys: number
  /** Of the dynamic `t()` calls above: how many some seat declares, and how many nobody does (the net pins the second at zero). */
  dynamicDeclared: number
  dynamicUndeclared: number
}

/** A declaration the tree no longer backs, or a key set that cannot be a key set. A seat with a problem marks nothing. */
export interface SeatProblem {
  rule: 'seat-stale' | 'seat-unseatable' | 'seat-empty'
  seat: string
  detail: string
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** A literal piece, in the formatter's spelling: `{`, `}` and `\` would otherwise be read as syntax. */
const escapeLiteral = (s: string): string => s.replace(/[\\{}]/g, (c) => `\\${c}`)

/** The key a census string becomes: holes numbered by position, literal braces escaped. */
export function keyFromCensusText(text: string): { key: string; arity: number } {
  const parts = holeify(text).split(HOLE)
  let key = ''
  for (let i = 0; i < parts.length; i++) {
    key += escapeLiteral(parts[i] ?? '')
    if (i < parts.length - 1) key += `{${i}}`
  }
  return { key, arity: parts.length - 1 }
}

interface Acc {
  home: Set<string>
  area: Set<string>
  ph: Set<string>[]
  wrapped: boolean
  seat: Set<string>
}

const textOf = (path: string): string | null => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

/** Holds ONE seat against the tree: its site really is a dynamic call the walker found / its writer still says what it said, and its key set is non-empty and seatable. */
export function checkSeat(seat: Seat, sites: readonly DynamicSite[], read: (path: string) => string | null = textOf): { problems: SeatProblem[]; groups: ReturnType<Seat['groups']> } {
  const problems: SeatProblem[] = []
  const bad = (rule: SeatProblem['rule'], detail: string): void => void problems.push({ rule, seat: seat.id, detail })
  if (seat.via === 'call') {
    if ((seat.sites ?? []).length === 0) bad('seat-stale', 'a call seat names no site')
    for (const st of seat.sites ?? []) {
      if (!sites.some((d) => d.file === st.file && d.arg === st.arg)) bad('seat-stale', `the walker finds no dynamic t(${st.arg}) in ${st.file} – the call moved, was renamed or became a literal; re-declare the seat or drop it`)
    }
  } else {
    if ((seat.writers ?? []).length === 0) bad('seat-stale', 'a ref seat names no writer')
    for (const w of seat.writers ?? []) {
      const text = read(w.file)
      if (text === null || !text.includes(w.needle)) bad('seat-stale', `${w.file} does not contain «${w.needle}» – the engine no longer writes this ref (or writes it differently); re-declare the seat or drop it`)
    }
  }
  const groups = seat.groups()
  if (groups.every((g) => g.keys.length === 0)) bad('seat-empty', 'the seat\'s key set is empty')
  let shown = 0
  for (const g of groups) {
    for (const key of g.keys) {
      const why = unseatable(key, seat.via)
      if (why !== null && shown++ < 3) bad('seat-unseatable', `«${key.slice(0, 60)}» (${g.home}) ${why}`)
    }
  }
  return { problems, groups }
}

export function buildCatalog(opts: { seats?: readonly Seat[]; sites?: readonly DynamicSite[]; read?: (path: string) => string | null } = {}): { catalog: Catalog; stats: ExtractStats; seatProblems: SeatProblem[]; undeclared: DynamicSite[] } {
  const seats = opts.seats ?? DECLARED_SEATS
  const sites = opts.sites ?? dynamicSites
  const acc = new Map<string, Acc>()
  const add = (key: string, file: string, area: string | null, holes: readonly string[] | undefined, arity: number, wrapped: boolean, seatId?: string): void => {
    let a = acc.get(key)
    if (!a) {
      a = { home: new Set(), area: new Set(), ph: [], wrapped: false, seat: new Set() }
      acc.set(key, a)
    }
    a.home.add(file)
    if (area !== null) a.area.add(area)
    if (wrapped) a.wrapped = true
    if (seatId !== undefined) a.seat.add(seatId)
    // A hint only when the walker's hole list lines up with the key's holes – a mismatch is a hint the
    // reader should not trust, so it is dropped rather than guessed at.
    if (holes && holes.length === arity) {
      holes.forEach((expr, i) => {
        while (a.ph.length <= i) a.ph.push(new Set())
        if (expr !== '') a.ph[i]?.add(expr)
      })
    }
  }
  for (const it of certain) {
    const { key, arity } = keyFromCensusText(it.text)
    add(key, it.file, it.area, it.holes, arity, false)
  }
  for (const c of callKeys) {
    const arity = c.via === 'cp' ? c.holes.length : 0
    add(c.key, c.file, c.area, c.via === 'cp' ? c.holes : undefined, arity, true)
  }
  // ⭐ L3-T: the declared seats. A seat the tree does not back marks NOTHING (it is reported, and the gate is red); one it backs enters its strings under the file that holds them.
  const seatProblems: SeatProblem[] = []
  const declaredSites = new Set<string>()
  for (const seat of seats) {
    for (const st of seat.sites ?? []) declaredSites.add(`${st.file}\u0000${st.arg}`)
    const { problems, groups } = checkSeat(seat, sites, opts.read)
    if (problems.length > 0) {
      seatProblems.push(...problems)
      continue
    }
    for (const g of groups) {
      const area = areaOf(g.home, scopeOf(g.home) ?? 'engine', false, 'declared-seat', null)
      // a key the census already met keeps the area(s) it was read under – a seat adds a HOME and a wire, never a second opinion about what the string is
      for (const key of g.keys) add(key, g.home, acc.has(key) ? null : area, undefined, 0, true, seat.id)
    }
  }
  const undeclared = sites.filter((d) => !declaredSites.has(`${d.file}\u0000${d.arg}`))
  const keys: Record<string, CatalogEntry> = {}
  let seatKeys = 0
  let wrapped = 0
  let multiHome = 0
  for (const key of [...acc.keys()].sort(cmp)) {
    const a = acc.get(key)
    if (!a) continue
    const entry: CatalogEntry = { home: [...a.home].sort(cmp), area: [...a.area].sort(cmp) }
    if (a.ph.some((s) => s.size > 0)) entry.ph = a.ph.map((s) => [...s].sort(cmp))
    if (a.wrapped) {
      entry.wrapped = true
      wrapped++
    }
    if (a.seat.size > 0) {
      entry.seat = [...a.seat].sort(cmp)
      seatKeys++
    }
    if (entry.home.length > 1) multiHome++
    keys[key] = entry
  }
  const count = Object.keys(keys).length
  return {
    catalog: { format: CATALOG_FORMAT, count, keys },
    stats: {
      certainStrings: certain.length,
      callSites: callKeys.length,
      dynamicCalls: callStats.dynamic,
      keys: count,
      wrapped,
      multiHome,
      seats: seats.length,
      seatKeys,
      dynamicDeclared: sites.length - undeclared.length,
      dynamicUndeclared: undeclared.length,
    },
    seatProblems,
    undeclared,
  }
}

/** One key per line: a diff of this file IS the list of strings that appeared, changed or went. */
export function serializeCatalog(c: Catalog): string {
  const body = Object.keys(c.keys)
    .sort(cmp)
    .map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(c.keys[k])}`)
    .join(',\n')
  return `{\n  "format": ${c.format},\n  "count": ${c.count},\n  "keys": {\n${body}\n  }\n}\n`
}

export function readCatalogText(path = CATALOG_PATH): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

export function parseCatalog(text: string): Catalog {
  const raw = JSON.parse(text) as Catalog
  if (raw.format !== CATALOG_FORMAT || typeof raw.keys !== 'object' || raw.keys === null) {
    throw new Error(`catalog.en.json is not format ${CATALOG_FORMAT}`)
  }
  return raw
}

export function writeCatalog(c: Catalog, path = CATALOG_PATH): void {
  writeFileSync(path, serializeCatalog(c))
}

export interface CatalogDiff {
  added: string[]
  removed: string[]
  changed: string[]
}

/** What differs between the committed catalog and a fresh one – keys only, sorted. */
export function diffCatalogs(committed: Catalog, fresh: Catalog): CatalogDiff {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  for (const k of Object.keys(fresh.keys)) {
    const was = committed.keys[k]
    if (!was) added.push(k)
    else if (JSON.stringify(was) !== JSON.stringify(fresh.keys[k])) changed.push(k)
  }
  for (const k of Object.keys(committed.keys)) if (!fresh.keys[k]) removed.push(k)
  return { added: added.sort(cmp), removed: removed.sort(cmp), changed: changed.sort(cmp) }
}

/** The set of literals the walker saw anywhere in scope, normalised – for telling a row whose English is
 *  still live in source (waiting for its call site) from one whose English is gone (drift). */
export { seen as seenLiterals, normKey } from './copy-census-walk'
