// ⭐ L3-7 (10.10) – A LINE OF COPY: THE ENGLISH A BUILDER COMPOSED, AND THE REF THAT TRANSLATES IT, BUILT FROM ONE SOURCE.
// docs/specs/i18n-2026-10.md §3.2 / §8 row L3-7.
//
// ⚠ WHAT THIS IS FOR. `buildCommentary` and `buildPreview` compose a row from clauses, cut it to a character budget
// (`clausesUpTo`) and hand the English to the viewer. The viewer renders refs under the current locale, so every sentence
// these two builders produce now exists in two shapes at once: the English string they always returned (the log's budget is
// counted on it, the tests and the key cut read it) and the `CopyRef` a translator's catalog is keyed by. They are made
// TOGETHER, from the same `cp` template, so they cannot drift: `line(cp`…`)` renders the ref under the source locale to get
// the string, and the string is therefore the ref's English by construction – not by a second spelling kept in step.
//
// ⚠ NO PROSE IS AUTHORED HERE. A template that was a template literal is the same characters after a backtick prefix (§3.2's
// «one backtick prefix per call site»); `tests/i18n-l3-7-twin.test.ts` holds the pre-wave tree's digest of every row.
//
// ⚠ A JOIN IS `{0} {1}`, NEVER A FLATTENED KEY. A beat is a claim, a manner clause and a room clause, kept or dropped by the
// row's budget, so the combinations are open-ended; a flattened key per combination would put every product in front of a
// translator (and an unlisted product would render English in a Russian log). The join carries each clause as a nested ref,
// the renderer recurses, and the catalog holds the clauses as keys of their own – the arrangement L3-5 made for small talk.
import { cp, renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../shared/i18n'

/** One row's worth of copy: `text` is the English, `c` the ref that renders to it. */
export interface Line {
  text: string
  c: CopyRef
}

const EN = { locale: SOURCE_LOCALE } as const

/** The line a `cp` template makes. The English is the ref rendered under the source locale – draws nothing, reads no clock. */
export function line(c: CopyRef): Line {
  return { text: renderCopyRef(c, EN), c }
}

/** Clauses read as one run, a space between. One clause is itself; two are `{0} {1}`; three are `{0} {1} {2}` (a beat never carries more). */
export function joinLines(parts: readonly Line[]): Line {
  const [a, b, c] = parts
  if (a === undefined) return { text: '', c: { k: '' } }
  if (b === undefined) return a
  const text = parts.map((p) => p.text).join(' ')
  if (c === undefined) return { text, c: cp`${a.c} ${b.c}` }
  if (parts.length > 3) throw new Error('a beat joins at most three clauses')
  return { text, c: cp`${a.c} ${b.c} ${c.c}` }
}
