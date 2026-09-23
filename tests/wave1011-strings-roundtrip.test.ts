// WAVES 10–11 – THE STRINGS TABLES AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's own law, extended to the two tables the layer's close assembled for his pass: «после
// вычитки легко исправить Markdown и забыть реализацию» – so the document and the shipped string
// must go red together, whichever side moves. The wave-9 parser test is the model; what differs
// here is the corpus shape, so the pin differs with it:
//
//   · a home column ending in `#OBJECT.field` is compared against the LIVE exported value,
//     strict equality – the strongest pin, used for everything importable;
//   · a bare path is a containment pin against that file's SOURCE. The doc quotes the RUNTIME
//     spelling, so a source literal that escapes its apostrophes ('mother\'s') is matched through
//     the escaped fallback. Containment and never a region cut – no marker, no slice, nothing to
//     rot silently (the 24.08 lesson is about slices; a boolean `includes` fails loudly).
//
// ⚠ THE COUNTS LIVE HERE AND NOWHERE IN PROSE – the wave-9 finding verbatim: a count written in
// prose survives a full gate because no test reads it. 34 and 37 are asserted below; the docs
// deliberately state no totals.
//
// MUTATION-VERIFIED 23.09: one character changed in a doc row fails by id; one character changed
// in `BEREAVED_WORDS` fails the same row with the arrow the other way.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DYNASTY_COPY, WEIGHT_COPY } from '../src/composables/identityCopy'

interface Row {
  id: string
  home: string
  text: string
}

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | D1 | `src/...` | the string | `DRAFT` |
    const m = /^\| ([DW]\d+) \| `(.+?)` \| (.+?) \| `DRAFT` \|$/.exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3] })
  }
  return rows
}

/** The importable corpus the `#` homes resolve against – the two copy tables, by name. */
const EXPORTED: Record<string, Record<string, string>> = {
  DYNASTY_COPY: DYNASTY_COPY as unknown as Record<string, string>,
  WEIGHT_COPY: WEIGHT_COPY as unknown as Record<string, string>,
}

const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = readFileSync(path, 'utf8')
    sourceCache.set(path, src)
  }
  return src
}

function pinRows(table: string, expected: number): void {
  const rows = parseTable(table)
  it(`the parser found the table at all – ${expected} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${table}: rows found`).toBe(expected)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const hash = row.home.indexOf('#')
      if (hash >= 0) {
        const file = row.home.slice(0, hash)
        const [obj, field] = row.home.slice(hash + 1).split('.')
        const table_ = EXPORTED[obj]
        expect(table_, `${row.id}: ${obj} is importable here`).toBeDefined()
        expect(table_[field], `${row.id} <-> ${file}#${obj}.${field}`).toBe(row.text)
      } else {
        const src = sourceOf(row.home)
        const escaped = row.text.replaceAll("'", "\\'")
        expect(
          src.includes(row.text) || src.includes(escaped),
          `${row.id}: ${row.home} contains the row's text`,
        ).toBe(true)
      }
    }
  })
}

describe('wave 10 – the strings table IS the corpus', () => {
  pinRows('docs/plans/life-wave-10-strings-2026-09.md', 34)
})

describe('wave 11 – the strings table IS the corpus', () => {
  pinRows('docs/plans/life-wave-11-strings-2026-09.md', 37)
})
