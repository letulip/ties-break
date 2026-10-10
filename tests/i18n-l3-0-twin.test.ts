// L3-0 (09.10) – THE 150-WEEK TWIN, in the form that can live in the suite. docs/specs/i18n-2026-10.md §5: «a 150-week twin career, old arm vs
// new arm, English – every player-visible rendered string byte-identical, `rngMain` identical. The refactor may change representation, never copy.»
//
// The wave's OWN measurement of that sentence was taken against a throwaway worktree of the pre-wave tree (the report names the commit and the
// numbers); a suite cannot carry a second tree, and a digest pinned from it would turn red the day any later wave legitimately changed the
// economy. So what stays here is the half that is true of ANY tree: a fresh 150-week career is migrated as if it were a v92 save, and
//   · nothing but the version and the rows' `c` differs from the career that was played (the migration adds, never alters);
//   · every row that gained a `c` renders back to its stored sentence in English (display parity – the thing the player sees);
//   · `rngMain {s, n}` is the played career's (the migration draws nothing);
//   · a second migration is a no-op.
// It asserts a floor on coverage, NOT a figure: a wording change in a later wave moves the rate and must not redden this file (the v92 golden in
// i18n-l3-0-legacy-match.test.ts carries the frozen, exact claim).
//
// ⭐ RE-AIMED 10.10 (L3-1): «no writer sets `c`» was true for exactly one wave. The ledger / receipt writers set it now, so a played career arrives here
// ALREADY carrying refs on those rows – and the claim that matters becomes the other half: the migration leaves a row that has a ref exactly as the writer
// made it (idempotent, never overwritten) and fills only the rows that have none.
import { describe, expect, it } from 'vitest'
import { migrateSave } from '../src/engine/migrations'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

interface Row { text: string; c?: CopyRef }
type Played = { schemaVersion: number; rngMain: { s: number; n: number }; events: Row[] }

function playedCareer(preset: number, policy: number): Played {
  const { world, rng } = openCareer(PRESETS[preset]!, 0, POLICIES[policy]!)
  for (let w = 0; w < 150; w++) stepCareerWeek(world, rng, POLICIES[policy]!)
  return JSON.parse(JSON.stringify(world)) as Played
}

describe('the 150-week twin – a played career migrated as a v92 save', () => {
  for (const [label, preset, policy] of [['25k middle · middle coach · grinder', 5, 0], ['120k wealthy · elite coach · player', 8, 1]] as const) {
    it(label, () => {
      const played = playedCareer(preset, policy)
      expect(played.events.length, 'the career wrote a ledger').toBeGreaterThan(100)
      expect(played.events.some((e) => e.c !== undefined), 'L3-1: the ledger / receipt writers set `c` on their rows').toBe(true)

      const asV92 = structuredClone(played)
      asV92.schemaVersion = 92
      const migrated = migrateSave(structuredClone(asV92) as never) as unknown as Played

      expect(migrated.schemaVersion).toBe(93)
      expect(migrated.rngMain, 'the step draws nothing').toEqual(played.rngMain)
      let converted = 0
      migrated.events.forEach((e, i) => {
        expect(e.text, `row ${i}: text untouched`).toBe(played.events[i]?.text)
        if (played.events[i]?.c) expect(e.c, `row ${i}: a ref the writer made is left exactly as it is`).toEqual(played.events[i]?.c)
        if (e.c) {
          converted++
          expect(renderCopyRef(e.c, { locale: SOURCE_LOCALE }), `row ${i}: the player reads the same bytes`).toBe(e.text)
        }
      })
      expect(converted / migrated.events.length, 'the table recognises most of a career (a floor, not a figure)').toBeGreaterThan(0.5)

      const strip = (w: Played): string => {
        const copy = structuredClone(w)
        copy.schemaVersion = 0
        for (const e of copy.events) delete e.c
        return JSON.stringify(copy)
      }
      expect(strip(migrated), 'nothing but the version and `c` moved').toBe(strip(played))
      expect(migrateSave(structuredClone(migrated) as never), 'migrating twice is migrating once').toEqual(migrated)
    })
  }
})
