// WAVE 9 – THE STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// His review of 21.09, finding 4: «Тест проверяет форму, длину и достижимость, но не сравнивает
// документ с кодом посимвольно. После вычитки легко исправить Markdown и забыть реализацию.»
//
// ⚠⚠ AND THE DRIFT HE PREDICTED HAD ALREADY HAPPENED, twice, in the same wave that shipped the
// corpus: the strings table and the spec said 28 while the builder brief and the implementation's
// own comment said 32. Nothing was wrong with the CODE – the number of lines was always 28 – which
// is exactly why it survived a full gate: a count in prose is invisible to every test that reads
// the pool.
//
// ⚠ THIS IS A PARSER AND NOT AN EMITTER, deliberately. The album's corpus is generated because it is
// 412 strings and the document is the authoring surface; 28 lines do not earn a build step, and a
// parser gives the same protection in both directions – edit either side and this goes red.
//
// MUTATION-VERIFIED 22.09: changing one character in the Markdown fails by row id; changing one
// character in `MOTHERHOOD_WORDS` fails the same case with the arrow the other way.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { MOTHERHOOD_WORDS } from '../src/engine/diary/weekNotes'
import type { Temperament } from '../src/engine/spirit'
import type { MotherhoodBand } from '../src/shared/protocol'

const TABLE = 'docs/plans/life-wave-9-strings-2026-09.md'

interface Row {
  id: string
  voice: string
  band: string
  text: string
}

function parseTable(): Row[] {
  const md = readFileSync(TABLE, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | M1 | `sunny` | `announced` | the string | status |
    const m = /^\| (M\d+) \| `(\w+)` \| `(\w+)` \| (.+?) \| `.+` \|$/.exec(line)
    if (m) rows.push({ id: m[1], voice: m[2], band: m[3], text: m[4] })
  }
  return rows
}

describe('wave 9 – the strings table IS the corpus', () => {
  const rows = parseTable()

  it('⭐⭐⭐ every row of the document matches the shipped string character for character', () => {
    expect(rows.length, 'the parser found the table at all – a renamed heading would empty it').toBe(28)
    for (const row of rows) {
      const shipped = MOTHERHOOD_WORDS[row.voice as Temperament]?.[row.band as MotherhoodBand]
      expect(shipped, `${row.id}: the document names a cell the code does not have`).toBeDefined()
      expect(shipped, `${row.id} (${row.voice}/${row.band}) – document vs code`).toBe(row.text)
    }
  })

  it('⚠ ...and every shipped string is in the document – the other direction, which a spot-check misses', () => {
    const seen = new Set(rows.map((r) => `${r.voice}/${r.band}`))
    for (const voice of Object.keys(MOTHERHOOD_WORDS) as Temperament[]) {
      for (const band of Object.keys(MOTHERHOOD_WORDS[voice]) as MotherhoodBand[]) {
        expect(seen.has(`${voice}/${band}`), `${voice}/${band} ships and is in no row of the table`).toBe(true)
      }
    }
  })

  it('⚠ the document\'s own count claim agrees with the pool – the drift his review caught', () => {
    const md = readFileSync(TABLE, 'utf8')
    const claimed = /\*\*(\d+) strings\*\*/.exec(md)
    expect(claimed, 'the table states its own size').not.toBeNull()
    expect(Number(claimed?.[1]), 'and the number in the prose is the number in the pool').toBe(rows.length)
  })
})
