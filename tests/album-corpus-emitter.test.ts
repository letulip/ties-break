// ⭐⭐⭐ THE EMITTER IS A FIXED POINT OF THE MODULE IT WROTE: `--write` OVER A MODULE THAT IS ALREADY RIGHT IS A
// NO-OP, and this file is what makes that a fact about the repository instead of a builder's eye (B16,
// round 45, 02.10).
//
// ⚠⚠ WHAT IT CLOSES IS THE GAP `tests/album-corpus-roundtrip.test.ts` CANNOT SEE. That pin compares STRINGS –
// the 472 are the document's, character for character. A comment is not a string and a voice column's
// position is not a string, so an emitter that dropped the heirloom block above `the-line` and swapped its
// `quiet` and `deep` columns left every round-trip case green, and was paid for BY HAND three times in one
// day (B8, then B15 twice over), by splicing the pre-emit body back after a `--write`. The fix lives in
// `tools/album-corpus-emit.ts` (read the committed module, carry the comment block above an occasion and the
// voice order forward by id, re-write everything else); this file runs it against the committed module and
// asserts ZERO diff, so the next regression is red on the commit that introduces it.
//
// ⚠ A TEST THAT ONLY COMPARES A GENERATOR WITH THE FILE IT GENERATED CAN PASS VACUOUSLY: delete the heirloom
// from the module and an emitter that never knew about it agrees with the deletion. So the cases below also
// (a) NAME the carried things and look for them in both texts, (b) hand the emitter a block and a reorder it
// has never seen, and (c) hand it a hand-edited STRING and require the document to win – the carry is for
// comments and order and for nothing else.
//
// ⭐ NOTHING HERE IS CORPUS COPY AND NOTHING HERE CHANGES ONE: the module and the document are read, never
// written; the CLI case writes a temp copy and asserts the real module and the real document are untouched.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run on 02.10 against the 8 cases below, and the red it produced.
// Measured, not predicted. Each arm is the emitter with ONE thing changed; the module and the document
// were byte-identical to HEAD when the arms were done.
// -------------------------------------------------------------------------------------------------
//
//   ARM A  ⭐⭐⭐ THE UNFIXED EMITTER – `git show HEAD:tools/album-corpus-emit.ts` put back over the fix (the
//          fix really absent: `grep -c carriedFrom` read 0). The CLI case is left OUT of this arm, because
//          the unfixed CLI ignores `--out` and would have written the REAL module on `--write` – the very
//          defect.
//          **6 RED · 1 green · 1 skipped (8).** The headline case printed the two losses the wave had paid
//          for by hand: the nineteen-line heirloom block above `the-line` («// ⭐⭐⭐ A-L1 · the-line – THE
//          HEIRLOOM (v86 …») missing, replaced by the one-line stub «// A34 · the-line»; and `the-line`'s
//          `deep` column written BEFORE `quiet` (the committed order is `sunny, fiery, quiet, deep`). The
//          other five reds share one cause – the unfixed `emit` has no second argument to carry from, so
//          what it writes is never the committed module, and an in-block comment it neither carries nor
//          refuses.
//          ⭐ THE ONE GREEN IS THE IDEMPOTENCE CASE AND IT IS MEANT TO BE: a lossy emitter that is
//          deterministic is still a fixed point of ITS OWN output. «Idempotent» is the weak claim and
//          «nothing is lost» the strong one – which is why the first case, not that one, is the gate.
//          ⚠ THE FIRST ATTEMPT AT THIS ARM PASSED `-t` THROUGH AN UNQUOTED zsh VARIABLE, which does not
//          word-split: it ran ZERO tests and exited 1. A red with an empty denominator is not a red; the
//          figures above are the re-run with the filter quoted and 8 cases counted.
//   ARM B  the voice order not carried (`for (const voice of ALBUM_VOICES)`). **5 RED · 3 green** – the
//          headline case, the named-things case, the general-carry case, the hand-edited-string case and
//          the CLI case.
//   ARM C  the comment block not carried (the stub written unconditionally). **6 RED · 2 green** – the same
//          five and the renumbering case.
//   ARM D  a lone generated stub treated as hand-written and carried. **1 RED** – only the renumbering
//          case. The committed stubs equal the regenerated ones, so no other case can see this one.
//   ARM E  the in-block refusal silenced (`if (false as boolean)`). **1 RED** – only the «comment INSIDE a
//          block» case.

import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emit } from '../tools/album-corpus-emit'
import { ALBUM_DOC, ALBUM_VOICES, readAlbumCorpus } from '../tools/album-corpus-parse'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MODULE = new URL('../src/engine/world/albumCorpus.ts', import.meta.url)

/** The document, parsed by the SAME parser the emitter and the round-trip pin use. */
const DOC = readAlbumCorpus()
/** The module exactly as committed – the thing every case below holds the emitter to. */
const COMMITTED = readFileSync(MODULE, 'utf8')

/** The first line of the one hand-written block the module carries: `the-line`'s heirloom (A-L1, wave 10 T6a). */
const HEIRLOOM = '// ⭐⭐⭐ A-L1 · the-line – THE HEIRLOOM'
const VOICE_HEAD = /^ {6}(sunny|fiery|deep|quiet): \{$/

const linesOf = (text: string): string[] => text.split('\n')

/** The order an occasion's voice columns stand in, read off the text of a module. */
function voiceOrder(text: string, id: string): string[] {
  const ls = linesOf(text)
  const at = ls.indexOf(`    id: '${id}',`)
  if (at === -1) throw new Error(`${id}: no such block in the module`)
  const order: string[] = []
  for (let i = at; i < ls.length && ls[i] !== '  },'; i++) {
    const head = VOICE_HEAD.exec(ls[i])
    if (head !== null) order.push(head[1])
  }
  return order
}

/** The module's text with ONE occasion's four voice columns in reverse order. A column is five lines:
 *  its head, the note, the caption, the line and its closing brace. */
function reverseVoices(text: string, id: string): string {
  const ls = linesOf(text)
  const at = ls.indexOf(`    id: '${id}',`)
  const first = ls.findIndex((l, i) => i > at && VOICE_HEAD.test(l))
  const end = ls.indexOf('    },', first)
  if (at === -1 || first === -1 || end === -1) throw new Error(`${id}: the block is not shaped as the emitter writes it`)
  const columns: string[][] = []
  for (let i = first; i < end; i += 5) columns.push(ls.slice(i, i + 5))
  return [...ls.slice(0, first), ...columns.reverse().flat(), ...ls.slice(end)].join('\n')
}

describe('the album emitter is a fixed point of the module it wrote (B16, 02.10)', () => {
  it('⭐⭐⭐ emitting the document over the committed module changes not one byte – the heirloom block and the voice order survive', () => {
    const emitted = emit(DOC, COMMITTED)
    // ⚠ COMPARED AS LINES FIRST, so a regression reads as «this nineteen-line block became one stub line and
    // these two columns swapped» and not as a 48,000-character blob.
    expect(linesOf(emitted), 'a re-emit that is not a no-op has dropped, added or reordered something').toEqual(linesOf(COMMITTED))
    expect(emitted === COMMITTED, 'and the bytes agree, trailing newline included').toBe(true)
  })

  it('⭐ IDEMPOTENT: a second pass over the first one\'s own output is a no-op – from the committed module and from a cold start', () => {
    const warm = emit(DOC, COMMITTED)
    expect(emit(DOC, warm) === warm, 'warm: `--write` twice is `--write` once').toBe(true)
    // ⚠ THE COLD START IS THE OTHER HALF: with no module to carry from, the emitter writes its defaults – a
    // one-line stub per occasion, the document's voice order – and a second pass must read that stub back as
    // ITS OWN, never as a hand-written block to be preserved.
    const cold = emit(DOC, '')
    expect(cold.length, 'a cold start writes a whole module, not an empty one').toBeGreaterThan(40_000)
    expect(cold, 'and it is not the committed module: the two carried things are real, not coincidentally the defaults').not.toBe(COMMITTED)
    expect(emit(DOC, cold) === cold, 'cold: the generated stubs are re-derived, never carried').toBe(true)
  })

  it('⭐ the two carried things are named, and are in the committed module AND in what the emitter writes', () => {
    const emitted = emit(DOC, COMMITTED)
    for (const [which, text] of [['committed', COMMITTED], ['emitted', emitted]] as const) {
      expect(text, `${which}: the heirloom block`).toContain(HEIRLOOM)
      expect(voiceOrder(text, 'the-line'), `${which}: the-line's columns stand quiet before deep`).toEqual(['sunny', 'fiery', 'quiet', 'deep'])
      expect(voiceOrder(text, 'first-court'), `${which}: an ordinary occasion keeps the document's order`).toEqual([...ALBUM_VOICES])
    }
  })

  it('⭐ THE CARRY IS GENERAL, NOT A SPECIAL CASE FOR `the-line`: a block and a reorder the emitter has never seen survive', () => {
    const ls = linesOf(COMMITTED)
    const at = ls.indexOf("    id: 'first-court',")
    // the stub sits two lines above the id: `  // A1 · first-court`, then `  {`, then `    id: …`
    expect(ls[at - 2], 'the stub this arm replaces').toMatch(/^ {2}\/\/ A\d+ · first-court$/)
    ls.splice(at - 2, 1, '  // ⭐ A HAND-WRITTEN BLOCK THE EMITTER HAS NEVER SEEN', '  //', '  // a second paragraph of the same block.')
    const perturbed = reverseVoices(ls.join('\n'), 'first-court')
    expect(perturbed, 'the arm changed the module').not.toBe(COMMITTED)
    expect(voiceOrder(perturbed, 'first-court'), 'and reversed the columns').toEqual(['quiet', 'deep', 'fiery', 'sunny'])
    expect(emit(DOC, perturbed) === perturbed, 'both carried verbatim, in the order they stand').toBe(true)
  })

  it('⭐ AND THE CARRY NEVER CARRIES A STRING: a hand-edit of a note in the module is overwritten by the document\'s', () => {
    const edited = COMMITTED.replace("'First day on court. You were so excited.'", "'First day on court. You were so Excited.'")
    expect(edited, 'the arm changed the module').not.toBe(COMMITTED)
    expect(emit(DOC, edited) === COMMITTED, 'the document wins, and the carried things are untouched').toBe(true)
  })

  it('⚠ a comment INSIDE an occasion\'s block cannot be carried, so it is REFUSED rather than silently dropped', () => {
    const inside = COMMITTED.replace('    voices: {\n      sunny: {', '    voices: {\n      // a hand-written aside\n      sunny: {')
    expect(inside, 'the arm changed the module').not.toBe(COMMITTED)
    expect(() => emit(DOC, inside), 'the one slot for hand-written comments is directly above the `{`').toThrow(/INSIDE its block/)
  })

  it('⭐ A GENERATED STUB IS RE-DERIVED, NOT CARRIED: a renumbered occasion lands, and the hand-written block beside it does not move', () => {
    // ⚠ A hand-written block is verbatim and so can drift from the document – `the-line`'s own block still says
    // A-L1 where the document's heading says A34 – which is exactly why the emitter's OWN one-line stub must not
    // be carried the same way: a stub that kept its old ref for ever would be a comment that lies about which
    // row of the document it came from.
    const renumbered = { ...DOC, occasions: DOC.occasions.map((o) => (o.id === 'first-court' ? { ...o, ref: 'A99' } : o)) }
    const emitted = emit(renumbered, COMMITTED)
    expect(emitted, 'the new ref is written').toContain('  // A99 · first-court\n  {')
    expect(emitted, 'and the old one is not carried').not.toContain('  // A1 · first-court')
    expect(emitted, 'while the hand-written block is still verbatim').toContain(HEIRLOOM)
    expect(emit(renumbered, emitted) === emitted, 'and the renumbered module is itself a fixed point').toBe(true)
  })

  it('⭐⭐⭐ THE REAL CLI: `--write --out` over a temp copy writes the module back byte for byte, and the document and the real module are untouched', () => {
    const dir = mkdtempSync(join(tmpdir(), 'album-emit-'))
    const target = join(dir, 'albumCorpus.ts')
    const docBefore = readFileSync(ALBUM_DOC, 'utf8')
    try {
      writeFileSync(target, COMMITTED)
      // ⚠ THE CLI'S OWN GUARD: under vitest `main()` does not run, so the child must not inherit VITEST. And
      // the case asserts «wrote» was SAID – a CLI that prints nothing and exits 0 is the failure that matters.
      const env = { ...process.env }
      delete env.VITEST
      const said = execFileSync('npx', ['vite-node', 'tools/album-corpus-emit.ts', '--write', '--out', target], {
        cwd: ROOT,
        env,
        encoding: 'utf8',
        timeout: 100_000,
      })
      expect(said, 'main() ran and wrote').toContain('wrote ')
      const written = readFileSync(target, 'utf8')
      expect(written === COMMITTED, '`--write` over the committed module changed not one byte').toBe(true)
      expect(emit(DOC, written) === COMMITTED, 'and `--write` again is the same module').toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    expect(readFileSync(ALBUM_DOC, 'utf8') === docBefore, 'the document is read, never written').toBe(true)
    expect(readFileSync(MODULE, 'utf8') === COMMITTED, 'and the real module was not touched by a temp-mode run').toBe(true)
  }, 120_000)
})
