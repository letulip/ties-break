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
// prose survives a full gate because no test reads it. 34 and 29 are asserted below; the docs
// deliberately state no totals.
//
// ⭐ RE-AIMED 26.09 BY THE OWNER'S RULING 19 ON B-08, NOT WEAKENED – and wave 12's re-aim of 23.09 is
// the model followed here. Wave 11's corpus went **37 -> 29**: `EXPECTING_HER_LINE` and
// `BEREAVEMENT_HER_LINE` lost their presence axis (both cards fire at 23 or over, and no stage at 23
// is a roof stage), so eight ROOF rows left the table – W8/W10/W12/W14 and W22/W24/W26/W28. Only the
// COUNT moved on this side: the surviving rows keep their ids, their text and their `DRAFT` status,
// because those four-and-four are still awaiting his pass and a status that claimed otherwise would
// be claiming a provenance the corpus does not have (wave 12's own warning, which is why its status
// moved and this one must not). The ids are deliberately NOT re-flowed, so W9 in an older report still
// names the string it always named; `Set(ids).size === rows.length` below is what keeps that honest.
// The removal's argument and its measurement live in `tests/principles-b08-presence-reach.test.ts`.
//
// MUTATION-VERIFIED 23.09: one character changed in a doc row fails by id; one character changed
// in `BEREAVED_WORDS` fails the same row with the arrow the other way. Re-measured 26.09 after the
// re-aim: a roof row put back in the document fails the count, and the surviving `away` rows fail by
// id if the pool's text moves.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { homeSource } from './worldSource'
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

// ⚠⚠ RE-AIMED 28.09 BY T6.9 – THE HOME IS READ THROUGH ITS MODULE SET, AND THE TRADE IS NAMED.
//
// It was `readFileSync(row.home)`, and on the branch head that was RED with nothing wrong with the
// string: T6.8 / A-06 moved the life-beat copy sections into `src/engine/world/lifeBeat/<kind>Copy.ts`
// and every W-row whose home says `src/engine/world/lifeBeat.ts` lost sight of its own words –
//
//     W9: src/engine/world/lifeBeat.ts contains the row's text: expected false to be true
//
// – while `BEREAVED_WORDS` shipped, unmoved, one directory deeper. The reader's scope broke, not the
// corpus, which is the same defect `tests/worldSource.ts`' own header records in two other shapes.
//
// ⚠ THE DOCUMENT IS NOT EDITED. `docs/plans/life-wave-11-strings-2026-09.md` is the record of what
// shipped in wave 11; rewriting a historical record so an instrument stops failing is rewriting
// history to satisfy the instrument. `homeSource` resolves an `src/engine/**.ts` home through
// `engineModuleSource`, so the home the owner reads stays the home the document states.
//
// ⚠⚠ WHAT IS TRADED, SAID PLAINLY: the claim goes from «this string lives in this FILE» to «this
// string lives in this MODULE SET». That is a real loss of precision – a row can no longer tell a
// reader which file of a package holds its words – and it is accepted because the property these
// tables exist for is «the document and the code say the same thing», which never depended on a file
// boundary. Nothing else weakens: the strict `#OBJECT.field` homes are untouched, the count is
// untouched, and for a module with no package directory `homeSource` is the old read byte for byte.
const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = homeSource(path)
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
  // ⚠ 37 -> 29 on 26.09 (ruling 19 on B-08): the eight unreachable roof rows left the table. See the
  // header – the ids of the survivors are unchanged on purpose.
  pinRows('docs/plans/life-wave-11-strings-2026-09.md', 29)
})
