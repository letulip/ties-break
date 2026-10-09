// THE REVERSE MATCHER – v92 -> v93, wave L3-0 of the localization rig (docs/specs/i18n-2026-10.md §5).
//
// WHAT IT DOES. A legacy save holds `WorldEvent.text`: English prose with its params already
// interpolated. Class (c) of the spec (stored prose) can only be shown in another language if the
// row also says WHICH sentence it is and WHAT was poured into it – a `CopyRef`, `{ k, p }`. The
// templates old code could have stored are a closed set (`legacyTemplates.v92.ts`, frozen), so
// the reverse is pure string work: find the template whose literal anchors the text carries, capture
// what sits in the holes.
//
// ⚠⚠ PURE STRING WORK AND NOTHING ELSE. No RNG import, no clock, no world, no I/O: the same text
// answers the same ref on every call, in every process. That is what makes the migration lawful under
// invariant 2 (ZERO DRAWS) and what `tests/i18n-l3-0-legacy-match.test.ts` pins by reading this file's
// imports.
//
// ⚠⚠ A MATCH IS ONLY EVER KEPT IF IT RENDERS BACK TO THE STORED BYTES. After a template matches and
// its holes are captured, the ref is rendered through the SAME formatter the UI runs
// (`renderCopyRef`, English) and compared with the original text; any difference – a template with a
// literal brace the formatter would read as syntax, a capture the anchors split differently – and the
// row is left alone and counted as unmatched. So a wrong TABLE can cost coverage; it can never cost a
// player a different sentence in English. (The translation quality of a ref whose holes were split at
// the wrong seam is the table's to get right: `h` classes pin the seams that are ambiguous.)
//
// ⚠ HOLES CAPTURE STRINGS. The params are the rendered values exactly as they stood in the text – the
// spec allows plain values – because the migration cannot know whether `12` was a number or a name.
// The renderer prints a string param as itself and a plural argument accepts a numeric string, so a
// Russian message with `{0, plural, ...}` still works on a captured `"12"`.
//
// ⚠ WHICH CANDIDATE WINS. A text can satisfy more than one template (a short generic shape and a long
// specific one). Order of preference: an exact hole-free template first (the text IS the sentence);
// then the template with the most literal characters (its anchors say more about the text than a
// shorter template's); then fewer holes; then table order. The brief's wording was «fewer holes, then
// longer anchors» – applied literally that prefers `{0} – {1}` over `Entered {0} – {1} ({2})`, so the
// anchors come first here, and `ambiguous` in the stats says how often it mattered.
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../../shared/i18n'
import { HOLE_CLASS_PATTERNS, LEGACY_JOINED_V92, LEGACY_TEMPLATES_V92, type HoleClass, type LegacyTemplateEntry } from './legacyTemplates.v92'

interface Compiled {
  k: string
  holes: number
  literalLength: number
  order: number
  re: RegExp
}

const HOLE_MARK = /\{(\d+)\}/g

let exactIndex: Map<string, string> | null = null
let compiledList: Compiled[] | null = null

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const HOLE_NUMBER = /\{(\d+)\}/g

/** The sentences a joined family stands for: every ordered non-empty selection of its parts, one alternative per chosen part, joined by the
 *  family's separator with the holes renumbered across the join (and the classes shifted with them). The table stores the parts once because the
 *  selections run to 287 sentences – ~85 KiB of strings in the worker bundle (measured: 816,162 -> 730,621 bytes) against an install ceiling that had 59 KiB of
 *  headroom (scripts/install-size.mjs: 16,446 KiB with the sentences spelled out, 16,363 KiB with the parts stored once). */
function expandFamilies(): LegacyTemplateEntry[] {
  const out: LegacyTemplateEntry[] = []
  for (const family of LEGACY_JOINED_V92) {
    const walk = (index: number, key: string, classes: Record<number, HoleClass>, holes: number): void => {
      if (index === family.parts.length) {
        if (key !== '') out.push(Object.keys(classes).length > 0 ? [key, classes] : key)
        return
      }
      walk(index + 1, key, classes, holes) // this part did not fire
      for (const alt of family.parts[index] ?? []) {
        const altKey = typeof alt === 'string' ? alt : alt[0]
        const altClasses = typeof alt === 'string' ? undefined : alt[1]
        const shifted = altKey.replace(HOLE_NUMBER, (_m, n: string) => `{${Number(n) + holes}}`)
        const nextClasses: Record<number, HoleClass> = { ...classes }
        if (altClasses) for (const [at, cls] of Object.entries(altClasses)) nextClasses[Number(at) + holes] = cls
        walk(index + 1, key === '' ? shifted : key + family.sep + shifted, nextClasses, holes + (altKey.match(HOLE_NUMBER)?.length ?? 0))
      }
    }
    walk(0, '', {}, 0)
  }
  return out
}

function build(): void {
  const exact = new Map<string, string>()
  const compiled: Compiled[] = []
  const seen = new Set<string>()
  const entries: LegacyTemplateEntry[] = [...LEGACY_TEMPLATES_V92, ...expandFamilies()]
  entries.forEach((entry: LegacyTemplateEntry, order: number) => {
    const k = typeof entry === 'string' ? entry : entry[0]
    if (seen.has(k)) return // a family selection that coincides with a direct entry: the first stands
    seen.add(k)
    const classes = typeof entry === 'string' ? undefined : entry[1]
    HOLE_MARK.lastIndex = 0
    if (!HOLE_MARK.test(k)) {
      exact.set(k, k)
      return
    }
    let source = '^'
    let last = 0
    let holes = 0
    let literal = 0
    HOLE_MARK.lastIndex = 0
    for (let m = HOLE_MARK.exec(k); m !== null; m = HOLE_MARK.exec(k)) {
      const lit = k.slice(last, m.index)
      source += escapeRegex(lit)
      literal += lit.length
      const cls = classes?.[Number(m[1])]
      source += cls ? `(${HOLE_CLASS_PATTERNS[cls]})` : '([\\s\\S]*?)'
      holes++
      last = m.index + m[0].length
    }
    const tail = k.slice(last)
    source += `${escapeRegex(tail)}$`
    literal += tail.length
    compiled.push({ k, holes, literalLength: literal, order, re: new RegExp(source) })
  })
  exactIndex = exact
  compiledList = compiled
}

/** Every sentence and template the matcher knows once the joined families are expanded – for the tests that check the table is well formed. */
export function allTemplateKeys(): string[] {
  if (exactIndex === null || compiledList === null) build()
  return [...exactIndex!.keys(), ...compiledList!.map((c) => c.k)]
}

/** What a stored sentence matched, or `null`. `candidates` is how many templates fit (1 = unambiguous). */
export interface ReverseMatch {
  ref: CopyRef
  candidates: number
}

/** Render a ref the way an English player sees it – the identity check every kept match passes. */
function renderEnglish(ref: CopyRef): string {
  return renderCopyRef(ref, { locale: SOURCE_LOCALE })
}

/** Reverse one stored sentence. `null` = no template fits (or none fits and renders back identically):
 *  the caller keeps the text and counts it. */
export function reverseMatchText(text: string): ReverseMatch | null {
  if (typeof text !== 'string' || text === '') return null
  if (exactIndex === null || compiledList === null) build()
  const hit = exactIndex!.get(text)
  // An exact, hole-free template is the most specific answer there is – but its key must still survive
  // the formatter (a literal brace would not), so it goes through the same identity check as the rest.
  if (hit !== undefined) {
    const ref: CopyRef = { k: hit }
    return renderEnglish(ref) === text ? { ref, candidates: 1 } : null
  }
  let best: { c: Compiled; groups: string[] } | null = null
  let fitting = 0
  for (const c of compiledList!) {
    const m = c.re.exec(text)
    if (m === null) continue
    fitting++
    if (
      best === null ||
      c.literalLength > best.c.literalLength ||
      (c.literalLength === best.c.literalLength && (c.holes < best.c.holes || (c.holes === best.c.holes && c.order < best.c.order)))
    ) {
      best = { c, groups: m.slice(1) }
    }
  }
  if (best === null) return null
  const ref: CopyRef = { k: best.c.k, p: best.groups }
  return renderEnglish(ref) === text ? { ref, candidates: fitting } : null
}

/** EVERY template the text fits, in table order – for the tests and the measurement that need to see the
 *  ambiguity the preference rule resolves. Not used by the migration itself. */
export function fittingTemplates(text: string): string[] {
  if (exactIndex === null || compiledList === null) build()
  const out: string[] = []
  if (exactIndex!.has(text)) out.push(text)
  for (const c of compiledList!) if (c.re.test(text)) out.push(c.k)
  return out
}

/** The v93 step's whole job, kept apart from `migrateSave` so a test (and the measurement) can run it on
 *  any row list and read the answer. Mutates the rows in place: a row that already carries `c` is left
 *  alone (idempotent), a row whose sentence matches gains `c` BESIDE its `text` (the English stays – ruling 4: «legacy English may be
 *  retained internally for save compatibility» – and every reader that compares text keeps working),
 *  and a row nothing matches is untouched and listed. */
export interface ReverseStats {
  /** rows looked at (rows with a string `text` and no `c` yet) */
  total: number
  matched: number
  /** matched rows that fitted more than one template */
  ambiguous: number
  /** the distinct stored sentences nothing matched, in first-seen order */
  unmatched: string[]
  /** how many ROWS those sentences account for */
  unmatchedRows: number
}

export function attachCopyRefs(events: unknown): ReverseStats {
  const stats: ReverseStats = { total: 0, matched: 0, ambiguous: 0, unmatched: [], unmatchedRows: 0 }
  if (!Array.isArray(events)) return stats
  const seenMiss = new Set<string>()
  for (const row of events as { text?: unknown; c?: unknown }[]) {
    if (typeof row !== 'object' || row === null) continue
    if (typeof row.text !== 'string' || row.c !== undefined) continue
    stats.total++
    const hit = reverseMatchText(row.text)
    if (hit === null) {
      stats.unmatchedRows++
      if (!seenMiss.has(row.text)) {
        seenMiss.add(row.text)
        stats.unmatched.push(row.text)
      }
      continue
    }
    row.c = hit.ref
    stats.matched++
    if (hit.candidates > 1) stats.ambiguous++
  }
  return stats
}
