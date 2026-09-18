// ⭐⭐⭐ ROUND 44 – **THE CATALOGUE IS GENERATED FROM THE DOCUMENT, NEVER RETYPED**, and this file is
// what makes that sentence enforceable rather than a promise in a commit message.
//
// ⚠⚠ THE FAILURE IT EXISTS TO STOP IS NOT A BUG, IT IS A TYPO NOBODY CAN SEE. The corpus document
// holds 969 authored strings – 204 openers, 153 stance labels, 612 replies. An agent retyping them
// produces typos, and **no test written by that agent can catch them, because the test
// compares against what was typed.** The round's own ledger names this as the central instruction.
//
// ⭐⭐ IT WAS 817 ACROSS 43 SITUATIONS WHEN THIS FILE WAS WRITTEN, AND THE SECOND HALF OF ROUND 44 IS
// WHY IT IS NOT. The EIGHT situations the game had actually been running since wave 2 lived
// hand-written in `SMALL_TALK_SHIPPED` in `src/engine/world/lifeBeat.ts` while the 43 were generated
// out of the document – **two sources of truth in two formats**, of which this pin could only see
// one. The eight moved into the document as `R45`–`R52` and were brought from eleven voice columns to
// thirty-two; `SMALL_TALK_SHIPPED` is DELETED and `SMALL_TALK_SITUATIONS` is the generated array. So
// the pin covers 51 rows instead of 43, and «fixed in the code, the document drifted» has no shape
// left to take. ⚠ The one format the document could not express is expressed now: `court-four` is a
// two-beat `story`, so a row may carry a `**shared**` block, and its four lines are compared here
// like every other string rather than sitting outside the claim.
//
// So: `tools/small-talk-corpus-emit.ts` wrote `src/engine/world/smallTalkCorpus.ts` out of
// `docs/specs/small-talk-corpus-2026-09.md` once; the output is committed as ordinary source (no
// build step, no codegen in the pipeline, «boring TypeScript» intact); and this file RE-PARSES THE
// DOCUMENT ON EVERY RUN and compares the committed module to it string for string. A hand-edit of
// the generated file goes red. A document edit that was never re-emitted goes red. A parser that
// silently drops a row goes red on the counts before it ever reaches a string.
//
// ⚠ THE COUNTS ARE ASSERTED FIRST AND THEY ARE THE DOCUMENT'S OWN ARITHMETIC. The round opened on a
// measurement – 43/43 rows, 172/172 openers, 129/129 labels, 516/516 replies, zero failures – and
// closes on 51/51, 204/204, 153/153, 612/612 plus 4/4 shared, so a parser that reads 50 rows is a
// parser defect and not a document defect, and the counts say which before any string comparison
// confuses the two.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run, and the red it produced.
// -------------------------------------------------------------------------------------------------
//
//   ARM A  one character changed in a committed reply in `src/engine/world/smallTalkCorpus.ts`
//          (`R1`/`sunny`/`invite`: «two people waiting for a bus» → «two people waiting for a Bus»).
//          **1 RED** · «⭐⭐⭐ every one of the 612 replies is the document's, character for
//          character», naming the row, the voice and the stance.
//   ARM B  one committed OPENER replaced by another row's opener (`R2`/`deep` given `R1`/`deep`'s).
//          **1 RED** · «⭐⭐⭐ every one of the 204 openers is the document's».
//   ARM C  one committed stance LABEL re-worded (`R7`/`respond`).
//          **1 RED** · «⭐⭐ every one of the 153 stance labels is the document's, in the document's
//          own order».
//   ARM D  a row deleted from the committed module (`R44`).
//          **2 RED** · «the committed catalogue holds exactly the document's 51 rows, by id and in
//          the document's order» and the per-row sweep.
//   ARM H  ROUND 44's SECOND HALF, and it is ARM E pointed at the format the document could not
//          express until this round: `court-four`'s whole `**shared**` BLOCK deleted from the
//          DOCUMENT alone (476 characters), the committed catalogue left exactly as it is.
//          **2 RED** · «⭐⭐ the one two-beat row's 4 shared lines are the document's too», on its
//          NEGATIVE half – «R50/sunny: a second beat the document does not write» – and the counts
//          case, which reads `shared: 0` against 4. ⭐ The second red is the anti-vacuity half doing
//          exactly its job: without it, a second beat deleted from BOTH sides would read as «this row
//          never had one» and four authored strings would leave the catalogue in silence.
//   ARM I  one of the eight given a NEW id in the DOCUMENT alone (`line-call` → `line-call-2`) – the
//          move this round was most able to make by accident, and the one that orphans a `lifeLog`
//          row in a shipped save.
//          **7 RED** · the id sweep first («id for id, in order»), then every per-row case, because
//          `builtFor` throws where the committed catalogue has no such row – which is the discipline
//          the parser and this file share: a row that cannot be matched is REPORTED, never skipped.
//   ARM E  THE DOCUMENT EDITED AND THE CATALOGUE NOT RE-EMITTED – one word of `R1`/`quiet`/`invite`
//          changed in `docs/specs/small-talk-corpus-2026-09.md` alone.
//          **1 RED** · «⭐⭐⭐ every one of the 612 replies is the document's», naming `R1/quiet/invite`.
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
    expect(counts, 'the document parses completely – 51 rows, 204 openers, 153 labels, 612 replies, 4 shared').toEqual({
      rows: 51,
      openers: 204,
      labels: 153,
      replies: 612,
      shared: 4,
    })
    expect(SMALL_TALK_CORPUS.length, 'and the committed catalogue holds the same 51').toBe(51)
    expect(CORPUS_VOICES.length, 'four voices').toBe(4)
    expect(CORPUS_STANCES.length, 'three stances').toBe(3)
    // ⭐⭐ ROUND 44's SECOND HALF, AND THE NUMBER IS THE WHOLE CLAIM: 51 and not 43. The eight
    // situations that shipped before this document existed were hand-written in `SMALL_TALK_SHIPPED`
    // while the 43 were generated, so this pin covered five sixths of the catalogue and the sixth it
    // did not cover was the sixth an agent could retype. `SMALL_TALK_SHIPPED` is gone; the engine's
    // whole catalogue is this array, which is what the next case asserts from the other side.
    expect(SMALL_TALK_SITUATIONS.length, 'and the ENGINE\'s catalogue is exactly the document – no hand-written half left').toBe(51)
    expect(SMALL_TALK_SITUATIONS.map((s) => s.id), 'the same rows, in the same order').toEqual(SMALL_TALK_CORPUS.map((s) => s.id))
  })

  it('⭐ the committed catalogue holds exactly the document\'s 51 rows, by id and in the document\'s order', () => {
    expect(SMALL_TALK_CORPUS.map((s) => s.id), 'id for id, in order').toEqual(DOC.map((r) => r.id))
    // ⚠⚠ AND THE EIGHT ARE FIRST, BY THE IDS THEY SHIPPED WITH. An id is PERSISTED as half of a
    // `lifeLog` row's `detail`, so a rename orphans an old career's record of a conversation that
    // really happened; and the ORDER is that career's situation draw, because the draw is `pickInt`
    // over the filtered pool and `pickInt` reads position. Transcribed, never imported – an import
    // would make this compare the catalogue with itself.
    expect(SMALL_TALK_CORPUS.slice(0, 8).map((s) => s.id), 'the eight that shipped, first and unrenamed').toEqual([
      'practice-clicked',
      'line-call',
      'march-entry',
      'coach-real',
      'watching-players',
      'court-four',
      'new-place',
      'beat-her-conqueror',
    ])
  })

  it('⭐ every row\'s subject, stages and fact are the document\'s', () => {
    for (const row of DOC) {
      const s = builtFor(row)
      expect(s.subject, `${row.ref}: subject`).toBe(row.subject)
      expect([...s.stages], `${row.ref}: stages`).toEqual(row.stages)
      expect(s.fact, `${row.ref}: fact`).toBe(row.fact)
    }
  })

  it('⭐⭐⭐ every one of the 204 openers is the document\'s, character for character', () => {
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
    expect(compared, 'all 204 openers were compared, not a subset').toBe(204)
  })

  it('⭐⭐ the one two-beat row\'s 4 shared lines are the document\'s too, and the other 50 carry none', () => {
    // ⚠⚠ THE HOLE THIS CLOSES IS THE REASON THE EIGHT COULD NOT MOVE WITHOUT IT. `court-four` is a
    // `story`, and §8d.2 of the exchange spec makes a story TWO beats: the incident is heard by every
    // route before its own branch, and it is told in her own words, so it is per voice. The document
    // format had no way to say that until this round, and a `shared` line the round-trip did not
    // compare would be four authored strings sitting outside the «string for string» claim – which is
    // precisely the shape the whole pin exists to abolish.
    // ⚠ AND THE NEGATIVE HALF IS ASSERTED, not assumed: an emitter that wrote `shared` onto every
    // column would give fifty rows a second beat their openers already contain, and every positive
    // case here would still pass.
    let withBeat = 0
    let without = 0
    for (const row of DOC) {
      const s = builtFor(row)
      for (const voice of CORPUS_VOICES) {
        const column = s.voices[voice]!
        if (row.shared === null) {
          expect(column.shared, `${row.ref}/${voice}: a second beat the document does not write`).toBeUndefined()
          without++
        } else {
          expect(column.shared, `${row.ref}/${voice}: the shared incident`).toBe(row.shared[voice])
          withBeat++
        }
      }
    }
    expect(withBeat, 'the one story with a second beat, in all four voices').toBe(4)
    expect(without, 'and the other fifty rows carry none').toBe(200)
  })

  it('⭐⭐ every one of the 153 stance labels is the document\'s, in the document\'s own order', () => {
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
    expect(compared, 'all 153 labels were compared, not a subset').toBe(153)
  })

  it('⭐⭐⭐ every one of the 612 replies is the document\'s, character for character', () => {
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
    expect(compared, 'all 612 replies were compared, not a subset').toBe(612)
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
