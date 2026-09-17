// ⭐⭐⭐ ROUND 44 – **THE CATALOGUE IS GENERATED FROM THE DOCUMENT, NEVER RETYPED**, and this file is
// what makes that sentence enforceable rather than a promise in a commit message.
//
// ⚠⚠ THE FAILURE IT EXISTS TO STOP IS NOT A BUG, IT IS A TYPO NOBODY CAN SEE. The corpus document
// holds 817 authored strings – 172 openers, 129 stance labels, 516 replies. An agent retyping 817
// strings produces typos, and **no test written by that agent can catch them, because the test
// compares against what was typed.** The round's own ledger names this as the central instruction.
//
// So: `tools/small-talk-corpus-emit.ts` wrote `src/engine/world/smallTalkCorpus.ts` out of
// `docs/specs/small-talk-corpus-2026-09.md` once; the output is committed as ordinary source (no
// build step, no codegen in the pipeline, «boring TypeScript» intact); and this file RE-PARSES THE
// DOCUMENT ON EVERY RUN and compares the committed module to it string for string. A hand-edit of
// the generated file goes red. A document edit that was never re-emitted goes red. A parser that
// silently drops a row goes red on the counts before it ever reaches a string.
//
// ⚠ THE COUNTS ARE ASSERTED FIRST AND THEY ARE THE DOCUMENT'S OWN ARITHMETIC. The round opened on a
// measurement – 43/43 rows, 172/172 openers, 129/129 labels, 516/516 replies, zero failures – so a
// parser that reads 42 rows is a parser defect and not a document defect, and the counts say which
// before any string comparison confuses the two.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run, and the red it produced.
// -------------------------------------------------------------------------------------------------
//
//   ARM A  one character changed in a committed reply in `src/engine/world/smallTalkCorpus.ts`
//          (`R1`/`sunny`/`invite`: «two people waiting for a bus» → «two people waiting for a Bus»).
//          **1 RED** · «⭐⭐⭐ every one of the 516 replies is the document's, character for
//          character», naming the row, the voice and the stance.
//   ARM B  one committed OPENER replaced by another row's opener (`R2`/`deep` given `R1`/`deep`'s).
//          **1 RED** · «⭐⭐⭐ every one of the 172 openers is the document's».
//   ARM C  one committed stance LABEL re-worded (`R7`/`respond`).
//          **1 RED** · «⭐⭐ every one of the 129 stance labels is the document's, in the document's
//          own order».
//   ARM D  a row deleted from the committed module (`R44`).
//          **2 RED** · «the committed catalogue holds exactly the document's 43 rows, by id and in
//          the document's order» and the per-row sweep.
//   ARM E  THE DOCUMENT EDITED AND THE CATALOGUE NOT RE-EMITTED – one word of `R1`/`quiet`/`invite`
//          changed in `docs/specs/small-talk-corpus-2026-09.md` alone.
//          **1 RED** · «⭐⭐⭐ every one of the 516 replies is the document's», naming `R1/quiet/invite`.
//          ⭐ THIS IS THE ARM THAT MATTERS MOST and it is the only one that runs in the direction the
//          round is about: the document is the source of truth, so an edit there that never reached
//          the emitter is a divergence, not a customisation.
//   ARM F  `corpusId` made an identity function (the apostrophe left in `the-stranger's-sock`).
//          **1 RED** · «⚠ R3's key carries no apostrophe – it is persisted», and the id sweep.
//   ARM G  one reply LINE deleted from the document (`R1`/`quiet`/`invite`).
//          **1 RED, AND IT IS THE PARSER THAT SAYS SO** · «small-talk corpus, line 296: R1's invite
//          reply 4 is unreadable». The counts case never runs, because a short row throws where it is
//          read – which is the discipline: a row the parser cannot read is REPORTED, never skipped.
//
// ⚠ ONE ARM DID NOT DISCRIMINATE AND IS RECORDED RATHER THAN QUIETLY DROPPED. `parseCorpus`'s
// withdrawn-row skip was widened from «the heading says WITHDRAWN» to «this row has no opener table»,
// and the suite stayed **GREEN** – because on THIS document the two readings agree exactly, R26 being
// both. The strict form is kept anyway, and the reason is the one the arm could not demonstrate: a
// row that merely FAILED to parse must not be able to look like a row he withdrew. That is a claim
// about a future document, so no arm against today's can redden it.
//
// ⚠ AND THE ANTI-VACUITY HALF IS THE FIRST CASE: a comparison of two empty lists passes. Every sweep
// below asserts its own size against the document's stated arithmetic before it compares a byte.

import { describe, expect, it } from 'vitest'

import { SMALL_TALK_SITUATIONS, TEMPERAMENTS, type SmallTalkSituation } from '../src/engine/world'
import { SMALL_TALK_CORPUS } from '../src/engine/world/smallTalkCorpus'
import {
  readCorpus,
  corpusCounts,
  corpusId,
  CORPUS_STANCES,
  CORPUS_VOICES,
  type CorpusRow,
} from '../tools/small-talk-corpus-parse'

/** The document, parsed once. ⚠ Read through the SAME parser the emitter used, which is the whole
 *  design: two parsers would be two truths about one file, and the one that rotted would be the one
 *  nobody ran. */
const DOC: CorpusRow[] = readCorpus()

/** The committed rows, indexed by the id the document gives them. */
const BUILT = new Map<string, SmallTalkSituation>(SMALL_TALK_CORPUS.map((s) => [s.id, s]))

function builtFor(row: CorpusRow): SmallTalkSituation {
  const s = BUILT.get(row.id)
  if (s === undefined) throw new Error(`${row.ref}: the committed catalogue has no ${row.id}`)
  return s
}

describe('round 44 – the committed corpus IS the document', () => {
  it('the sweep has something to sweep, and the counts are the document\'s own arithmetic', () => {
    // ⚠⚠ THE ANTI-VACUITY CASE, AND IT IS FIRST DELIBERATELY. Every comparison below iterates the
    // parsed document; a parser that returned an empty list would make all of them pass in silence.
    const counts = corpusCounts(DOC)
    expect(counts, 'the document parses completely – 43 rows, 172 openers, 129 labels, 516 replies').toEqual({
      rows: 43,
      openers: 172,
      labels: 129,
      replies: 516,
    })
    expect(SMALL_TALK_CORPUS.length, 'and the committed catalogue holds the same 43').toBe(43)
    expect(CORPUS_VOICES.length, 'four voices').toBe(4)
    expect(CORPUS_STANCES.length, 'three stances').toBe(3)
  })

  it('⭐ the committed catalogue holds exactly the document\'s 43 rows, by id and in the document\'s order', () => {
    expect(SMALL_TALK_CORPUS.map((s) => s.id), 'id for id, in order').toEqual(DOC.map((r) => r.id))
  })

  it('⭐ every row\'s subject, stages and fact are the document\'s', () => {
    for (const row of DOC) {
      const s = builtFor(row)
      expect(s.subject, `${row.ref}: subject`).toBe(row.subject)
      expect([...s.stages], `${row.ref}: stages`).toEqual(row.stages)
      expect(s.fact, `${row.ref}: fact`).toBe(row.fact)
    }
  })

  it('⭐⭐⭐ every one of the 172 openers is the document\'s, character for character', () => {
    let compared = 0
    for (const row of DOC) {
      const s = builtFor(row)
      for (const voice of CORPUS_VOICES) {
        const column = s.voices[voice]
        expect(column, `${row.ref}/${voice}: the committed row has no column`).toBeDefined()
        expect(column!.opener, `${row.ref}/${voice}: the opener`).toBe(row.openers[voice])
        compared++
      }
    }
    expect(compared, 'all 172 openers were compared, not a subset').toBe(172)
  })

  it('⭐⭐ every one of the 129 stance labels is the document\'s, in the document\'s own order', () => {
    // ⚠ THE LABEL IS ONE PER SITUATION PER STANCE and the four voices carry the SAME words – the
    // parent says one thing. The document writes it once on the row's `**Parent:**` line and again as
    // each block's header, and the parser refuses a mismatch; this asserts the catalogue agrees with
    // both.
    let compared = 0
    for (const row of DOC) {
      const s = builtFor(row)
      for (const block of row.stances) {
        for (const voice of CORPUS_VOICES) {
          expect(s.voices[voice]!.branches[block.stance].label, `${row.ref}/${voice}/${block.stance}: the label`).toBe(
            block.label,
          )
        }
        compared++
      }
    }
    expect(compared, 'all 129 labels were compared, not a subset').toBe(129)
  })

  it('⭐⭐⭐ every one of the 516 replies is the document\'s, character for character', () => {
    let compared = 0
    for (const row of DOC) {
      const s = builtFor(row)
      for (const block of row.stances) {
        for (const voice of CORPUS_VOICES) {
          expect(s.voices[voice]!.branches[block.stance].said, `${row.ref}/${voice}/${block.stance}: the reply`).toBe(
            block.replies[voice],
          )
          compared++
        }
      }
    }
    expect(compared, 'all 516 replies were compared, not a subset').toBe(516)
  })

  it('⚠ R3\'s key carries no apostrophe – it is PERSISTED into `lifeLog` and compared in the exclusion sets', () => {
    // The one id the round normalises. `the-stranger's-sock` in the document, `the-strangers-sock` in
    // the save: an apostrophe is a character in a sentence and this is a machine key.
    const r3 = DOC.find((r) => r.ref === 'R3')
    expect(r3, 'R3 is in the document').toBeDefined()
    expect(r3!.id, 'the apostrophe is stripped at the door, once, in the parser').toBe('the-strangers-sock')
    expect(corpusId("the-stranger's-sock"), 'and the normaliser really is what does it').toBe('the-strangers-sock')
    for (const s of SMALL_TALK_SITUATIONS) {
      expect(s.id, `${s.id}: a persisted id carries an apostrophe`).not.toMatch(/'/)
    }
  })

  it('⚠ every corpus row is written in all four voices, and the ids are unique across the whole catalogue', () => {
    for (const row of DOC) {
      const s = builtFor(row)
      expect(Object.keys(s.voices).sort(), `${row.ref}: not four-voiced`).toEqual([...TEMPERAMENTS].slice().sort())
    }
    const ids = SMALL_TALK_SITUATIONS.map((s) => s.id)
    expect(new Set(ids).size, 'an id collision would make two conversations read back as one').toBe(ids.length)
  })
})
