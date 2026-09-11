// ⚠⚠ THE TAIL-LINT, WIDENED TO THE POOLS NOBODY WAS SWEEPING (wave 3, architect's gate, 11.09)
//
// THE FINDING, and it came out of T10's verification pass rather than from a failing test: the
// bibles' narrator-tail ban is marked «MUST, linted», and the lint swept `WEEK_NOTES` and nothing
// else. Wave 2 put two more pools in `engine/world/lifeBeat.ts` (`HER_LINE`, `ANSWER_EVENT`) and
// wave 3 added five (`MET_HER_LINE`, `MET_MENTION`, `MET_DRY`, `SMALL_TALK_LINE`, `MET_EVENT`).
// Seven pools of player-facing narration, none of them linted, while the rule read as enforced.
//
// ⭐ SAME LESSON AS T6b's FIFTY BROKEN HARNESSES: a green gate is evidence about what the gate RUNS.
// Nothing was failing because nothing was looking.
//
// ⚠ WHY THIS READS THE SOURCE INSTEAD OF CALLING THE FUNCTIONS. `lifeBeatSaid` and
// `lifeBeatHeading` would reach five of the seven, but `ANSWER_EVENT` and `MET_EVENT` are module
// -private `const`s with no exported reader - and `ANSWER_EVENT` is where the one real violation
// lives, so a sweep that could not see it would be the same false comfort one layer up. Banned
// tails are literal substrings, so reading the literals is exact rather than approximate. The cost
// is that this file knows a path; the ARM below is what keeps that honest.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { BANNED_TAILS, narrationOf } from './helpers/bannedTails'

const SOURCE = 'src/engine/world/lifeBeat.ts'

/** Every single-quoted string literal in the file, comments stripped first.
 *  ⚠ COMMENTS MUST GO FIRST and not merely be skipped: this repo records owner rulings verbatim in
 *  comments, and a comment quoting a banned tail to explain the ban would otherwise fail the lint
 *  that the comment is about. */
function literalsOf(src: string): string[] {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((l) => l.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n')
  return [...code.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
}

// ⚠⚠ THE ONE KNOWN VIOLATION, BASELINED RATHER THAN SILENTLY FIXED - the `pins:check` ratchet idiom.
// It is PRE-EXISTING: `b7ed734b` (wave 2) shipped it to main, and wave 3's T6 only moved it
// byte-identically into the per-kind record. Changing it is a WORDING change, which invariant 4
// makes the owner's and never an agent's, so it is carried to the вычитка with a flag rather than
// rewritten here. The count is asserted exactly, so a SECOND violation cannot hide behind this one.
const KNOWN_VIOLATIONS = [
  'She said what she wants after school. We listened, and left it there.',
] as const

describe('the narrator-tail ban reaches every life pool, not just the week notes', () => {
  it('⭐⭐⭐ no banned tail survives in any life string, except the one on the owner\'s desk', () => {
    const literals = literalsOf(readFileSync(SOURCE, 'utf8'))
    // ⚠ THE POSITIVE CONTROL COMES FIRST, because a sweep over an empty list passes forever and
    // that is exactly how the last eight dead tests in this wave died. If the extractor ever stops
    // finding literals - a quoting style changes, the pools move file - this goes red here rather
    // than going quietly green downstream.
    // ⚠ A LOOSE FLOOR ON PURPOSE. This half only has to prove the extractor is not returning an
    // empty list; the line below is the exact control, because it names the very string the one
    // real violation lives in. A tight count would go red every time a pool gains a line, which
    // trains people to edit the number instead of reading the failure.
    expect(literals.length, 'the extractor found the file\'s strings').toBeGreaterThan(150)
    expect(literals, 'and it really reaches the pool the violation lives in')
      .toContain(KNOWN_VIOLATIONS[0])

    const found: string[] = []
    for (const text of literals) {
      const narration = narrationOf(text)
      for (const tail of BANNED_TAILS) {
        if (narration.includes(tail)) found.push(text)
      }
    }
    const unexpected = found.filter((t) => !KNOWN_VIOLATIONS.includes(t as typeof KNOWN_VIOLATIONS[number]))
    expect(unexpected, 'a banned narrator tail reached a life string').toEqual([])
    // ...and the baseline may not grow by accident.
    expect(new Set(found).size, 'exactly the known violations, no more').toBe(KNOWN_VIOLATIONS.length)
  })

  it('⚠ the ban is on the NARRATOR, never on her own words inside quotation marks', () => {
    // The rule the strip exists for, asserted rather than assumed - so a later tightening that
    // dropped the strip would go red here instead of silently banning her from speaking.
    expect(narrationOf('She shrugged. "I left it there."')).not.toContain('left it there')
    expect(narrationOf('She shrugged, and left it there.')).toContain('left it there')
  })
})
