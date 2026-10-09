// THE FORMATTER-OUTPUT ROWS – L3-T (10.10), the carrier for a row whose English is what a FORMATTER prints (spec §4, L2-11's block).
//
// THE PROBLEM. His APPROVED short-year row (RU-13D, §9.9d) pairs the English «W14 '31» with a Russian example of the same label. Its English is not a string anybody wrote: it is the
// OUTPUT of `weekLabel` (`src/shared/dates.ts`) for one week of one career. No catalog key can be spelled with a number in it, so the importer had no key to join and reported the row
// `unmatched` – drift, to the eye – every run since the owner approved it. It is not drift. It is a PATTERN: «W{week} '{yy}» in English, the same two holes in his Russian, and the day a
// display shell next to `dates.ts` wants the Russian label it needs the pattern, not a sentence.
//
// THE DESIGN (the lighter of the two the brief named, and why). The brief offered a `format:` marker or a hint cell naming the formatter, both of which mean EDITING HIS TABLE. This does
// not: the importer recognises a row by the formatter's OWN output. `FORMAT_EXAMPLES` below calls the real formatter on a documented sample (`weekLabel(13, 2031)`) and the row whose
// English cell equals that string IS the formatter's row – the same way a key row is recognised by the literal the code spells. Nothing in his tables changes, so the importer's
// contract with them does not either; a row that names no formatter is joined exactly as before. If the formatter's shape ever moves (`weekLabel` prints «Wk 14 '31»), the registered
// example moves with it and his row goes back to `unmatched` – the same drift alarm a reworded literal sets off, for free.
//
// THE PATTERN. A format declares its PARTS – the pieces of the example that vary, by name (`week` -> «14», `yy` -> «31»). The importer finds each part's digits in his Russian example,
// exactly once (an example that repeats a number cannot say which is which, and the row is reported `ambiguous-cell` with the reason), and writes `{name}` in its place:
// his example with «14» and «31» swapped for `{week}` and `{yy}` is an ordinary message over named arguments, so `formatMessage` renders it with no new machinery. The result compiles into
// `src/i18n/formats.ru.json` – a FORMATTER-LOCALE table of its own, generated, committed and gated fresh by `npm run i18n:check` like ru.json is.
//
// ⚠ WHY ITS OWN FILE AND NOT A RESERVED NAMESPACE OF ru.json: ru.json is the catalog's locale file – «ru.json ⊆ catalog» is a law of the gate and `t()` reads it by catalog key. A pattern is
// not a catalog key (no code asks for the English «W{week} '{yy}»; the formatter builds it), and putting one in ru.json would either break that law or make the catalog list entries no
// call site asks for. A separate file keeps both statements true, costs the bundle NOTHING until a consumer imports it (the lazy glob in `catalog.ts` matches `ru.json` / `es.json` by name
// and cannot match `formats.ru.json` – tests/i18n-l3-t-tooling.test.ts proves it), and is where the L4 display shells will look.
//
// ⚠ THE CONSUMERS ARE NOT BUILT HERE. Nothing reads `formats.ru.json` yet: `weekLabel` still prints English under every locale, and the row stays APPROVED (not LANDED) until a shell
// next to `dates.ts` consults the table – `--mark-landed` says so. This file builds the carrier; the round that wires `weekLabel` (RU-13D) builds the reader.
import { normKey } from './copy-text'
import { weekLabel, weekYearLabel } from '../src/shared/dates'

export const FORMATS_PATH = 'src/i18n/formats.ru.json'

export interface FormatDef {
  /** Stable id: the key of the pattern in `formats.ru.json`. */
  id: string
  /** The formatter the pattern is for. */
  formatter: { file: string; name: string }
  /** The formatter's real output for the documented sample – his table's English cell is matched against this text. */
  example: string
  /** The sample's varying pieces, by name, as they appear in `example`. Each must appear in it exactly once, as a whole number. */
  parts: Readonly<Record<string, string>>
}

// «W14 '31»: absolute week 13 of a career that starts in 2031 – the in-season week is 14, the season year 2031.
// «W27 2033»: absolute week 26, start year 2033 – the full-year header form.
export const FORMAT_EXAMPLES: readonly FormatDef[] = [
  { id: 'dates.weekLabel', formatter: { file: 'src/shared/dates.ts', name: 'weekLabel' }, example: weekLabel(13, 2031), parts: { week: '14', yy: '31' } },
  { id: 'dates.weekYearLabel', formatter: { file: 'src/shared/dates.ts', name: 'weekYearLabel' }, example: weekYearLabel(26, 2033), parts: { week: '27', year: '2033' } },
]

export function formatIndex(defs: readonly FormatDef[] = FORMAT_EXAMPLES): Map<string, FormatDef> {
  const index = new Map<string, FormatDef>()
  for (const d of defs) index.set(normKey(d.example), d)
  return index
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The English pattern of a format: its example with each part replaced by `{name}`. `weekLabel`'s is `W{week} '{yy}`. Used by the net to prove the parts, never by the importer. */
export function englishPattern(def: FormatDef): string {
  let out = def.example
  for (const [name, token] of Object.entries(def.parts)) out = out.replace(new RegExp(`(?<![0-9])${escapeRe(token)}(?![0-9])`), `{${name}}`)
  return out
}

/** His Russian example -> the pattern: each part's digits, found exactly once as a whole number, become `{name}`. */
export function patternFromExample(def: FormatDef, russian: string): { pattern: string } | { error: string } {
  if (/[{}\\]/.test(russian)) return { error: 'his Russian example carries a brace or a backslash, which a message would read as syntax' }
  let pattern = russian
  for (const [name, token] of Object.entries(def.parts)) {
    const re = new RegExp(`(?<![0-9])${escapeRe(token)}(?![0-9])`, 'g')
    const hits = pattern.match(re)?.length ?? 0
    if (hits !== 1) return { error: `his Russian example carries «${token}» ${hits} time(s); the pattern needs it exactly once to know where {${name}} goes` }
    pattern = pattern.replace(re, `{${name}}`)
  }
  return { pattern }
}

export function serializeFormats(entries: ReadonlyMap<string, string>): string {
  const keys = [...entries.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  if (keys.length === 0) return '{}\n'
  return `{\n${keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(entries.get(k))}`).join(',\n')}\n}\n`
}
