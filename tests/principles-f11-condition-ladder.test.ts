// F-11 (principles review, 26.09) – THE CONDITION LADDER IS ONE LADDER, AND IT IS WRITTEN DOWN ONCE.
//
// The finding: 40 and 60 were spelled in three places – `conditionDeviation` and `idleRead` in
// `shared/avatarEmotion.ts`, and `conditionBandOf` in `engine/diary/facts.ts`. The first two were
// pinned against each other (tests/spirit.test.ts, «the two rung counts are one ladder counted
// twice»); the third was not pinned to anything at all, and its own note CLAIMED the parity it did
// not have – «the 80/60/40 rungs mirror the idle-emotion ladder (tired < 40, serious < 60)». The
// hazard is the one `avatarEmotion.ts` states over `conditionDeviation`: the day they disagree the
// face and the word start describing different weeks.
//
// ⚠⚠ THE FIX IS FORM A, NOT FORM B (docs/specs/engine-ui-parity-2026-09.md §1). All three readers
// ask `shared/avatarEmotion.ts` for `CONDITION_TIRED_BELOW` / `CONDITION_SERIOUS_BELOW`, so there is
// no second implementation left to drift: the parity is a property of the code and THIS FILE CAN ONLY
// WITNESS IT. What the file adds on top of the witness is the thing form A cannot give by itself – a
// guard against a FOURTH copy appearing later, which is §3's sweep rather than a paired mount.
//
// THE MUTATION TABLE, both arms RUN (26.09):
//   arm A – the SHARED SOURCE moved (`CONDITION_TIRED_BELOW` 40 → 30) on the tree where the three
//           ladders still spelled their own literals: 3 RED, one per ladder, each naming the
//           condition it disagreed at. That is the pre-fix tree and it is what «three surfaces
//           holding a number the shared module owns» looks like from outside.
//   arm B – the same mutation after the conversion: GREEN, all three ladders moved together
//           (condition 35 went from 2 / 'tired' / 'drained' to 1 / 'serious' / 'worn' in one edit).
//   arm C – the SHARING broken on ONE surface (`conditionBandOf` put back to a literal 60) with the
//           constant mutated: 1 RED, in this file alone, and `tests/diary.test.ts` stays green –
//           §2's asymmetry, which is the argument for this file existing beside them.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CONDITION_SERIOUS_BELOW,
  CONDITION_TIRED_BELOW,
  conditionDeviation,
  idleEmotion,
  idleRead,
} from '../src/shared/avatarEmotion'
import { conditionBandOf } from '../src/engine/diary'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** Every `.ts` / `.vue` under `src/`, comments stripped – a pin that reads prose is a pin the next
 *  writer repairs by deleting a sentence. The local walk is the idiom tests/spirit.test.ts and
 *  tests/wave4-spirit-shock.test.ts already use; F-02's shared helper is wave 5's job. */
function srcFiles(): [string, string][] {
  const out: [string, string][] = []
  const walk = (dir: string, prefix = ''): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${dir}${entry.name}/`, `${prefix}${entry.name}/`)
      else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
    }
  }
  walk(SRC)
  return out
}

function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

describe('F-11 – the condition ladder has one source, and all three readers ask it', () => {
  it('the constants are the shipped numbers, and only their SOURCE moved', () => {
    // ⚠ INVARIANT 4's half of this task: nothing a player reads may move. The two numbers are the
    // ones that shipped, asserted as literals HERE because this is the one file allowed to say them.
    expect(CONDITION_TIRED_BELOW).toBe(40)
    expect(CONDITION_SERIOUS_BELOW).toBe(60)
    expect(CONDITION_TIRED_BELOW, 'tired is the LOWER rung').toBeLessThan(CONDITION_SERIOUS_BELOW)
  })

  it('⭐ all three ladders agree with the constants on every legal condition – the whole 0..100 range', () => {
    // ⚠⚠ THE EXPECTATIONS ARE DERIVED FROM THE CONSTANTS, WHICH IS WHAT MAKES THIS THE MUTATION
    // DETECTOR. A ladder that stops reading them keeps answering at 40/60 while this file starts
    // asking at the mutated rung, so the sweep reddens exactly on the interval between the two – and
    // the message names the condition and the three answers. Under the shipped values it cannot fail,
    // and that is form A's own point: there is nothing left to drift.
    //
    // ⚠ HALF-POINTS, NOT INTEGERS. `condition` is not an integer anywhere in this engine – the
    // recovery and drain arithmetic produces fractions – and a ladder is a set of STRICT cuts, so the
    // value just below a rung is the one that separates a `<` from a `<=`.
    for (let condition = 0; condition <= 100; condition += 0.5) {
      const tired = condition < CONDITION_TIRED_BELOW
      const serious = !tired && condition < CONDITION_SERIOUS_BELOW
      const where = `condition ${condition}`
      expect(conditionDeviation(condition), `${where}: the rung count`).toBe(tired ? 2 : serious ? 1 : 0)
      expect(idleEmotion(false, condition), `${where}: the face`).toBe(tired ? 'tired' : serious ? 'serious' : 'norm')
      expect(idleRead(false, condition).channel, `${where}: ...spoken by the body`).toBe('body')
      // ⚠ THE DIARY'S THIRD RUNG IS ITS OWN AND STAYS: `fresh` at 80+ is «genuinely fresh», the line
      // the honesty pin holds tired-copy against. It is not a rung of THIS ladder, so it is spelled
      // here as the diary's own literal rather than derived from the pair.
      expect(conditionBandOf(condition), `${where}: the word Home speaks`)
        .toBe(condition >= 80 ? 'fresh' : tired ? 'drained' : serious ? 'worn' : 'ok')
    }
  })

  it('⚠ and the rung boundaries themselves are strict on all three, in one table', () => {
    // The four values a re-spelling gets wrong first: each rung and the half-point below it.
    const rows: [number, number, string, string][] = [
      [CONDITION_TIRED_BELOW - 0.5, 2, 'tired', 'drained'],
      [CONDITION_TIRED_BELOW, 1, 'serious', 'worn'],
      [CONDITION_SERIOUS_BELOW - 0.5, 1, 'serious', 'worn'],
      [CONDITION_SERIOUS_BELOW, 0, 'norm', 'ok'],
    ]
    for (const [condition, rung, face, word] of rows) {
      expect(conditionDeviation(condition), `condition ${condition}`).toBe(rung)
      expect(idleEmotion(false, condition), `condition ${condition}`).toBe(face)
      expect(conditionBandOf(condition), `condition ${condition}`).toBe(word)
    }
  })

  it('⚠⚠ and no FOURTH copy of the ladder exists anywhere in src/', () => {
    // ⭐ THE HALF FORM A CANNOT GUARANTEE BY ITSELF. Once the constants exist, nothing stops a later
    // wave writing `condition < 40` again in a composable, and the sweep above would stay green on it
    // at the shipped values – which is exactly how this finding was born. So the SPELLING is swept:
    // a comparison of anything called `condition*` against a bare 40 or 60, in code and never in
    // prose, may appear in no file at all.
    //
    // ⚠ DELIBERATELY NARROW. It reads 40 and 60 only, and only against an identifier beginning
    // `condition` – `knock.ts`' own `condition < 50` is a different rule with a different source and
    // is none of this pin's business. Measured before the fix: 6 hits in 2 files
    // (`shared/avatarEmotion.ts` ×4, `engine/diary/facts.ts` ×2), which is the finding.
    const ladder = /\bcondition[A-Za-z]*\s*(?:<=|>=|<|>|===|!==)\s*(?:40|60)\b|\b(?:40|60)\s*(?:<=|>=|<|>|===|!==)\s*condition[A-Za-z]*\b/
    const files = srcFiles()
    expect(files.length, 'the walk really found src/').toBeGreaterThan(100)
    const copies = files.filter(([, text]) => ladder.test(codeOnly(text))).map(([path]) => path)
    expect(copies, 'the ladder is spelled as constants, never as literals').toEqual([])
    // ...and the sweep can see a copy at all, so the assertion above is not vacuous: the regex finds
    // the shape it is looking for in a line built here.
    expect(ladder.test('  if (condition < 40) return 2')).toBe(true)
    expect(ladder.test('  if (conditionNow >= 60) return true')).toBe(true)
    expect(ladder.test('  if (condition < 50) return 1'), 'and it leaves other rules alone').toBe(false)
  })
})
