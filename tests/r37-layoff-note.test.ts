import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { layoffNoteFor, layoffReturnWeek } from '../src/composables/weekDays'
import { weekLabel } from '../src/shared/dates'
import type { SnapshotInjury } from '../src/shared/protocol'
import { at } from './helpers/source'

// =================================================================================================
// ⭐⭐ THE LAYOFF SENTENCE HAS ONE HOME (owner, 06.09: «layoffNote пишется трижды, причём в одном
// месте с точкой на конце»).
//
// ⚠ THIS IS NOT A WORDING CHANGE AND MUST NEVER BECOME ONE – CLAUDE.md invariant 4. The three copies
// were the SAME WORDS and the SAME arithmetic; the only difference between them was a trailing full
// stop at one of the three sites, and that stop is still there, because at that site a second
// sentence follows the note inside the same paragraph. What moved is where the words live.
//
// The three that computed it: src/components/PlanWeekSheet.vue, src/components/screens/
// CalendarScreen.vue, src/components/screens/SeasonScreen.vue – and all three carried a comment
// saying they used «the tournament card's injured lock's own words», which was a fourth copy of them
// in `lockLabel`, in the third of those files. Four writers of one sentence, each citing another.
//
// ⚠ MUTATION-VERIFIED, and the mutations are named above each block.
// =================================================================================================

const FILES: Record<string, string> = {
  'PlanWeekSheet.vue': '../src/components/PlanWeekSheet.vue',
  'CalendarScreen.vue': '../src/components/screens/CalendarScreen.vue',
  'SeasonScreen.vue': '../src/components/screens/SeasonScreen.vue',
}

const sources: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([name, rel]) => [name, readFileSync(new URL(rel, import.meta.url), 'utf8')]),
)

/** The words themselves, as they read on screen. Anything that CONTAINS this outside
 *  `composables/weekDays.ts` is a second writer of the owner's sentence. */
const THE_WORDS = 'Injured – back'

function hurt(week: number, weeksRemaining: number): { week: number; injury: SnapshotInjury } {
  return {
    week,
    injury: { kind: 'wrist', severity: 'moderate', weeksRemaining, totalWeeks: weeksRemaining, sinceWeek: week },
  }
}

// MUTATION-VERIFIED: `layoffNoteFor` made to return the sentence with a long dash -> the first arm
// red; made to append a full stop -> the second assertion of that arm red; the `back === null` branch
// made to answer the sentence anyway -> the healthy arm red.
describe('the words themselves', () => {
  it('says the return week the calendar counts, with no full stop', () => {
    expect(layoffNoteFor(hurt(40, 6))).toBe(`Injured – back ${weekLabel(46)}`)
    expect(layoffNoteFor(hurt(40, 6)).endsWith('.')).toBe(false)
    // The short dash is the house rule for player-facing copy (CLAUDE.md Style).
    expect(layoffNoteFor(hurt(40, 6))).not.toContain('—')
  })

  it('is the week `layoffReturnWeek` names, never a second piece of arithmetic', () => {
    const snap = hurt(12, 3)
    const back = layoffReturnWeek(snap)
    expect(back).toBe(15)
    expect(layoffNoteFor(snap)).toContain(weekLabel(back!))
  })

  it('is empty on a healthy girl and on no snapshot at all', () => {
    expect(layoffNoteFor({ week: 40, injury: null })).toBe('')
    expect(layoffNoteFor(null)).toBe('')
    expect(layoffNoteFor(undefined)).toBe('')
  })
})

// MUTATION-VERIFIED: any one of the three `layoffNote` computeds restored to its own template
// literal -> that file's row goes red in both arms (it stops calling `layoffNoteFor`, and the words
// come back into the file).
describe('and every site reads them from that one home', () => {
  it.each(Object.keys(FILES))('%s calls layoffNoteFor and imports it from weekDays', (name) => {
    // `at` throws on an absent marker – the marker-helper discipline. A raw indexOf would score a
    // moved call as -1 and pass.
    expect(at(sources[name], 'layoffNoteFor(')).toBeGreaterThanOrEqual(0)
    expect(sources[name], `${name} imports the note from somewhere else`).toMatch(
      /import \{[^}]*layoffNoteFor[^}]*\} from '[^']*composables\/weekDays'/,
    )
  })

  it('⚠ AND NOT ONE OF THEM WRITES THE SENTENCE OUT ANY MORE – counted, not quoted', () => {
    // The count is over the three files the owner named, and it includes `lockLabel`'s arm in
    // SeasonScreen: it is the copy the other three cited as their source, so leaving it behind would
    // keep four writers and call it one. If a fifth surface ever needs the sentence, it CALLS
    // `layoffNoteFor` – it does not paste the words.
    for (const [name, src] of Object.entries(sources)) {
      expect(src.split(THE_WORDS).length - 1, `${name} still writes the layoff sentence itself`).toBe(0)
    }
  })

  it('the one home is the only place in src/ the words are written', () => {
    const home = readFileSync(new URL('../src/composables/weekDays.ts', import.meta.url), 'utf8')
    // Once in the function, and the docblock above it deliberately does not repeat it.
    expect(home.split(THE_WORDS).length - 1).toBe(1)
  })
})
