// ⭐⭐⭐ **THE ALBUM'S CATALOGUE IS GENERATED FROM THE DOCUMENT, NEVER RETYPED**, and this file is what
// makes that sentence enforceable rather than a promise in a commit message. It is round 44's shape
// (`tests/round44-corpus-roundtrip.test.ts`) pointed at the album spec's §8 step 2.
//
// ⚠⚠ THE FAILURE IT EXISTS TO STOP IS NOT A BUG, IT IS A TYPO NOBODY CAN SEE. The corpus document
// holds **400 authored strings** – 128 notes, 128 captions, 128 loose lines and 16 arc strings. An
// agent retyping them produces typos, and **no test written by that agent can catch them, because the
// test compares against what was typed.** So `tools/album-corpus-emit.ts` wrote
// `src/engine/world/albumCorpus.ts` out of `docs/specs/album-corpus-2026-09.md` once; the output is
// committed as ordinary source (no build step, no codegen in the pipeline, «boring TypeScript»
// intact); and this file RE-PARSES THE DOCUMENT ON EVERY RUN and compares the committed module to it
// string for string. A hand-edit of the generated file goes red. A document edit that was never
// re-emitted goes red. A parser that silently drops a row goes red on the counts before it ever
// reaches a string.
//
// ⚠⚠ AND THE COPY IS HIS. Invariant 4: «USER-FACING WORDING IS NOT AN AGENT'S TO CHANGE». Every one of
// the 400 is a DRAFT until he has read it, and when he edits one he edits the DOCUMENT and the
// emitter is re-run. This pin is the thing that makes «the document is the source of truth» a fact
// about the repository rather than a habit.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run, and the red it produced. Measured, not predicted.
// -------------------------------------------------------------------------------------------------
//
//   ARM A  one character changed in a committed NOTE in `src/engine/world/albumCorpus.ts`
//          (`A1`/`sunny`: «You were so excited.» → «You were so Excited.»).
//          **2 RED** · «⭐⭐⭐ every one of the 128 notes is the document's, character for character»,
//          naming `A1/sunny` – and the HIS-copy case, because the string it touched is one of his
//          three. ⭐ That second red is the arm reporting more than it was asked: an agent editing
//          the owner's own wording is told so by name rather than by a diff.
//   ARM B  one committed CAPTION replaced by another row's caption (`A2`/`deep` given `A3`/`deep`'s).
//          **2 RED** · «⭐⭐⭐ every one of the 128 captions is the document's», and the uniqueness
//          half of the hygiene case, which read 399 distinct strings against 400. ⭐ The second red is
//          the one worth having: it is what an accidental copy-paste between two sheets looks like,
//          and the round-trip alone would only catch it because the document happened to disagree.
//   ARM C  one committed loose LINE re-worded (`A32`/`quiet`: «what it meant» → «what it means»).
//          **1 RED** · «⭐⭐⭐ every one of the 128 loose lines is the document's».
//   ARM D  an occasion deleted from the committed module (`A16` · `injury-return`, 1,144 characters).
//          **10 RED** · the anti-vacuity counts case (31 committed against the document's 32), the id
//          sweep, and every per-row sweep, because `builtFor` THROWS where the committed catalogue has
//          no such occasion – the discipline this file and the parser share: a row that cannot be
//          matched is REPORTED, never skipped.
//   ARM E  ⭐⭐⭐ **THE DOCUMENT EDITED AND THE CATALOGUE NOT RE-EMITTED** – one word of `A15`/`deep`'s
//          note changed in `docs/specs/album-corpus-2026-09.md` alone («nothing for a day» →
//          «nothing all day»).
//          **1 RED** · «⭐⭐⭐ every one of the 128 notes is the document's», naming `A15/deep`.
//          ⭐ THIS IS THE ARM THAT MATTERS MOST and it is the only one that runs in the direction the
//          task is about: the document is the source of truth, so an edit there that never reached the
//          emitter is a divergence, not a customisation. It is also the likeliest real event, because
//          it is what happens the first time HE edits a line.
//   ARM F  one whole register table deleted from the DOCUMENT alone (`A20`'s `caption` table).
//          **1 RED, AND IT IS THE PARSER THAT SAYS SO** · the file does not even collect – «album
//          corpus, line 786: A20's tables are out of order: expected caption, found line», and vitest
//          reports «no tests». Not one comparison case runs, because a malformed row throws where it
//          is READ. That is the discipline: a row the parser cannot read is reported, never patched
//          around, and the report names the line.
//   ARM G  the arc's `reserved` direction deleted from the committed module.
//          **4 RED** · the counts case (`['open']` against both directions), «⭐⭐ the arc is the
//          document's too», the arc's completeness-shape case, and the hygiene sweep (392 strings
//          swept against 400).
//   ARM H  ⚠ THE ANTI-VACUITY ARM, and it is the one that proves the sweeps are not vacuous: the
//          document's `A11` heading broken so the parser SKIPS the row (`### A11` → `#### A11`), which
//          is exactly the shape a silently-dropping parser has.
//          **6 RED** · the counts case first (31 occasions, 124/124/124), then the id sweep, then
//          every per-register sweep on its own «all 128 were compared, not a subset» line. ⭐ Without
//          those size assertions a parse that returned FEWER rows would make every per-row comparison
//          pass on the rows that survived, and the document would quietly shrink.
//   ARM I  `A7`/`fiery`'s loose line given back its first-draft wording («They ask when you lose»),
//          in BOTH the document and the catalogue, so the round-trip itself stays green.
//          **1 RED** · «⭐⭐ the note addresses her and the caption and the line do not». ⭐ This is the
//          arm that says the register pin is a real assertion and not decoration: it is the only one
//          here that reddens on a divergence the round-trip CANNOT see, because both sides agree. And
//          it is not hypothetical – that sentence is what the first draft actually shipped, and this
//          pin is what found it.
//
// ⚠ ONE CANDIDATE ARM WAS NOT BUILT AND IS RECORDED RATHER THAN QUIETLY DROPPED. «A line longer than
// its own note» looks like the natural size pin and it would be RED ON HIS OWN COPY: `A1`'s line
// («Some journeys start with a simple "Can I?"») is one character longer than `A1`'s note («First day
// on court. You were so excited.»), and both are his, off the mockups. A pin that reddens on his
// wording is a pin that gets his wording edited, which is invariant 4 pointing backwards. The caption
// bound below is the half that IS true of every row, and §1 of the document records the near-miss.

import { describe, expect, it } from 'vitest'

import { TEMPERAMENTS } from '../src/engine/spirit'
import { ALBUM_CORPUS, ALBUM_ARC, type AlbumOccasion } from '../src/engine/world/albumCorpus'
import {
  readAlbumCorpus,
  albumCounts,
  ALBUM_ARC_DIRECTIONS,
  ALBUM_BANDS,
  ALBUM_REGISTERS,
  ALBUM_VOICES,
  type AlbumRow,
} from '../tools/album-corpus-parse'

/** The document, parsed once. ⚠ Read through the SAME parser the emitter used, which is the whole
 *  design: two parsers would be two truths about one file, and the one that rotted would be the one
 *  nobody ran. */
const DOC = readAlbumCorpus()

/** The committed occasions, indexed by the id the document gives them. */
const BUILT = new Map<string, AlbumOccasion>(ALBUM_CORPUS.map((o) => [o.id, o]))

function builtFor(row: AlbumRow): AlbumOccasion {
  const o = BUILT.get(row.id)
  if (o === undefined) throw new Error(`${row.ref}: the committed catalogue has no ${row.id}`)
  return o
}

/** ⚠ Second person, in every form the corpus actually uses. The note addresses her; nothing else
 *  does. Contractions are spelled out rather than trusted to `\w`, because `you'd` must match and
 *  `young` must not. */
const SECOND_PERSON = /\byou(?:'(?:d|ve|ll|re))?\b|\byour\b|\byourself\b/i

describe('the committed album corpus IS the document', () => {
  it('⚠⚠ the sweep has something to sweep, and the counts are the document\'s own arithmetic', () => {
    // ⚠⚠ THE ANTI-VACUITY CASE, AND IT IS FIRST DELIBERATELY. Every comparison below iterates the
    // parsed document; a parser that returned an empty list – or, as ARM H showed, a list one row
    // short – would make all of them pass in silence on whatever survived.
    const counts = albumCounts(DOC)
    expect(counts, 'the document parses completely – 32 occasions, 128 notes, 128 captions, 128 lines, 8 arc cells, 16 arc strings').toEqual({
      occasions: 32,
      notes: 128,
      captions: 128,
      lines: 128,
      arcCells: 8,
      arcStrings: 16,
    })
    expect(counts.notes + counts.captions + counts.lines + counts.arcStrings, '400 authored strings').toBe(400)
    expect(ALBUM_CORPUS.length, 'and the committed catalogue holds the same 32').toBe(32)
    expect(DOC.arc.length, 'the arc has two directions and no third').toBe(2)
    expect(Object.keys(ALBUM_ARC).sort(), 'and the committed arc has the same two').toEqual([...ALBUM_ARC_DIRECTIONS].sort())
    expect(ALBUM_VOICES.length, 'four voices').toBe(4)
    expect(ALBUM_REGISTERS.length, 'three registers').toBe(3)
  })

  it('⭐ the committed catalogue holds exactly the document\'s 32 occasions, by id and in the document\'s order', () => {
    // ⚠ THE ORDER IS THE DOCUMENT'S because a diff of the generated file should read down the page
    // the document does – the same reason round 44 kept its own. An id is a machine key the selector
    // names and the sheet reads back, so a rename is a real event, not a tidy-up.
    expect(ALBUM_CORPUS.map((o) => o.id), 'id for id, in the document\'s order').toEqual(DOC.occasions.map((r) => r.id))
    const ids = ALBUM_CORPUS.map((o) => o.id)
    expect(new Set(ids).size, 'an id collision would make two occasions resolve to one sheet').toBe(ids.length)
    for (const id of ids) expect(id, `${id}: an id is a machine key`).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('⭐ every occasion\'s kind, bands and gate are the document\'s', () => {
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      expect(o.kind, `${row.ref}: kind`).toBe(row.kind)
      expect([...o.bands], `${row.ref}: bands`).toEqual(row.bands)
      expect(o.gate, `${row.ref}: gate`).toBe(row.gate)
    }
  })

  it('⭐⭐⭐ every one of the 128 notes is the document\'s, character for character', () => {
    let compared = 0
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      for (const voice of ALBUM_VOICES) {
        expect(o.voices[voice], `${row.ref}/${voice}: the committed occasion has no column`).toBeDefined()
        expect(o.voices[voice].note, `${row.ref}/${voice}: the note`).toBe(row.voices[voice].note)
        compared++
      }
    }
    expect(compared, 'all 128 notes were compared, not a subset').toBe(128)
  })

  it('⭐⭐⭐ every one of the 128 captions is the document\'s, character for character', () => {
    let compared = 0
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      for (const voice of ALBUM_VOICES) {
        expect(o.voices[voice].caption, `${row.ref}/${voice}: the caption`).toBe(row.voices[voice].caption)
        compared++
      }
    }
    expect(compared, 'all 128 captions were compared, not a subset').toBe(128)
  })

  it('⭐⭐⭐ every one of the 128 loose lines is the document\'s, character for character', () => {
    let compared = 0
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      for (const voice of ALBUM_VOICES) {
        expect(o.voices[voice].line, `${row.ref}/${voice}: the loose line`).toBe(row.voices[voice].line)
        compared++
      }
    }
    expect(compared, 'all 128 loose lines were compared, not a subset').toBe(128)
  })

  it('⭐⭐ the arc is the document\'s too, in both directions and all four voices', () => {
    // ⚠ THE ARC IS A DIFFERENT SHAPE AND THAT IS WHY IT NEEDS ITS OWN CASE: it is keyed on what she
    // was BORN × where the lean went, not on an occasion, and it carries two registers rather than
    // three (spec §5 – its sentence needs both points in it and a caption cannot hold two points).
    // A sweep that only walked the occasions would leave 16 authored strings outside the claim,
    // which is the shape this whole file exists to abolish.
    let compared = 0
    for (const row of DOC.arc) {
      const built = ALBUM_ARC[row.direction]
      expect(built, `the committed arc has no ${row.direction}`).toBeDefined()
      for (const voice of ALBUM_VOICES) {
        expect(built[voice].note, `ARC/${row.direction}/${voice}: the note`).toBe(row.voices[voice].note)
        expect(built[voice].line, `ARC/${row.direction}/${voice}: the loose line`).toBe(row.voices[voice].line)
        compared += 2
      }
    }
    expect(compared, 'all 16 arc strings were compared, not a subset').toBe(16)
  })

  // ===============================================================================================
  // THE COMPLETENESS PIN – every occasion the spec names, in all four voices and all three registers
  // ===============================================================================================

  it('⭐⭐ COMPLETENESS: all four voices, all three registers, on every one of the 32 – no partial row', () => {
    // ⚠ «Or the document says explicitly why not» is the escape the ask allowed, and this corpus
    // does not use it for an occasion: the only declared exception in the whole document is the
    // ARC's two-register shape, which §5 argues and the case below asserts as a SHAPE rather than
    // tolerating as a hole. So this pin is total, and it is the one that would go red if a voice
    // were ever left «to be written later».
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      expect(Object.keys(o.voices).sort(), `${row.ref}: not four-voiced`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of ALBUM_VOICES) {
        for (const register of ALBUM_REGISTERS) {
          const written = o.voices[voice][register]
          expect(typeof written, `${row.ref}/${voice}/${register}: missing`).toBe('string')
          expect(written.length, `${row.ref}/${voice}/${register}: empty`).toBeGreaterThan(0)
        }
      }
    }
    // ⚠ And the ENGINE's four temperaments are exactly the corpus's four, asserted from the other
    // side: a fifth temperament added to `spirit.ts` would make `Record<Temperament, AlbumHand>` a
    // compile error, and this says the same thing at runtime for a reader of the test.
    expect([...ALBUM_VOICES].sort(), 'the corpus\'s voices are the engine\'s temperaments').toEqual([...TEMPERAMENTS].slice().sort())
  })

  it('⭐ COMPLETENESS: the arc\'s declared exception is a SHAPE – both directions, four voices, two registers', () => {
    for (const direction of ALBUM_ARC_DIRECTIONS) {
      const built = ALBUM_ARC[direction]
      expect(Object.keys(built).sort(), `arc ${direction}: not four-voiced`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of ALBUM_VOICES) {
        expect(Object.keys(built[voice]).sort(), `arc ${direction}/${voice}: the two registers, and no caption`).toEqual(['line', 'note'])
        expect(built[voice].note.length, `arc ${direction}/${voice}: empty note`).toBeGreaterThan(0)
        expect(built[voice].line.length, `arc ${direction}/${voice}: empty line`).toBeGreaterThan(0)
      }
    }
    // ⚠⚠ AND THERE IS NO THIRD DIRECTION, WHICH IS A RULING AND NOT AN OMISSION. Spec §4b measured
    // the psychologist hired in 1 career of 9, and `wallsLean` moved on exactly that one; the other
    // eight take `A32` rather than being told in the parent's hand that they stayed themselves.
    expect(ALBUM_ARC_DIRECTIONS.length, 'two directions – there is no «she never drifted» line').toBe(2)
    expect(BUILT.has('retired'), 'and the sheet the eight take instead exists').toBe(true)
  })

  // ===============================================================================================
  // THE RULES OF §1 AND §3, WHICH A REVIEWER CANNOT HOLD 400 STRINGS IN THEIR HEAD FOR
  // ===============================================================================================

  it('⭐⭐ the note addresses her and the caption and the line do not – the register boundary, checked', () => {
    // ⭐ §1: «the note speaks TO the daughter, the caption speaks ABOUT her, the loose line is the
    // parent thinking aloud». That is the ask's own sentence and this is the only half of it a
    // machine can check. It caught a real slip in the first draft – see ARM I.
    let notes = 0
    let others = 0
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      for (const voice of ALBUM_VOICES) {
        expect(o.voices[voice].note, `${row.ref}/${voice}: a note that does not address her`).toMatch(SECOND_PERSON)
        expect(o.voices[voice].caption, `${row.ref}/${voice}: a caption is ABOUT her, never to her`).not.toMatch(SECOND_PERSON)
        expect(o.voices[voice].line, `${row.ref}/${voice}: a loose line is the parent thinking, addressed to nobody`).not.toMatch(SECOND_PERSON)
        notes++
        others += 2
      }
    }
    for (const row of DOC.arc) {
      for (const voice of ALBUM_VOICES) {
        expect(row.voices[voice].note, `ARC/${row.direction}/${voice}: a note that does not address her`).toMatch(SECOND_PERSON)
        expect(row.voices[voice].line, `ARC/${row.direction}/${voice}: a loose line addressed to her`).not.toMatch(SECOND_PERSON)
        notes++
        others++
      }
    }
    expect(notes, 'all 136 notes were checked').toBe(136)
    expect(others, 'and all 264 captions and lines').toBe(264)
  })

  it('⭐ a caption is the photograph\'s lip: short, and shorter than its own note', () => {
    for (const row of DOC.occasions) {
      const o = builtFor(row)
      for (const voice of ALBUM_VOICES) {
        const { caption, note } = o.voices[voice]
        expect(caption.length, `${row.ref}/${voice}: a caption over 60 characters is a note in the wrong place`).toBeLessThanOrEqual(60)
        expect(caption.length, `${row.ref}/${voice}: the caption is not shorter than its note`).toBeLessThan(note.length)
      }
    }
  })

  it('⚠ no string carries a name, a placeholder, an em-dash or a Cyrillic character', () => {
    // §3.2 – her name is the PLAYER's, so the catalogue is 400 finished sentences and not 400
    // templates: no interpolation, no token, nothing for a renderer to fill in.
    // §3.5 – the house's two copy rules, and the second one is the one an agent breaks by habit.
    let swept = 0
    const every: string[] = []
    for (const o of ALBUM_CORPUS) {
      for (const voice of ALBUM_VOICES) every.push(o.voices[voice].note, o.voices[voice].caption, o.voices[voice].line)
    }
    for (const direction of ALBUM_ARC_DIRECTIONS) {
      for (const voice of ALBUM_VOICES) every.push(ALBUM_ARC[direction][voice].note, ALBUM_ARC[direction][voice].line)
    }
    for (const written of every) {
      expect(written, `a placeholder in player-facing copy: ${written}`).not.toMatch(/[{}$]|%[sd]\b/)
      expect(written, `the long dash is not ours: ${written}`).not.toMatch(/—/)
      expect(written, `Cyrillic on a screen: ${written}`).not.toMatch(/[Ѐ-ӿ]/)
      swept++
    }
    expect(swept, 'all 400 strings were swept, not a subset').toBe(400)
    expect(new Set(every).size, 'no two of the 400 are the same string – an album that repeats itself reads as a copy-paste').toBe(400)
  })

  it('⚠ no occasion names the `jun` band – chapter 1 is the prologue, measured at 0 of 9', () => {
    // Spec §3 and §4b: the band under 11 is unreachable (the world starts at thirteen) and carried
    // zero milestones on every one of his nine careers. An occasion that named it would be an
    // occasion written to be skipped. The parser refuses the word; this says it of the catalogue.
    for (const o of ALBUM_CORPUS) {
      for (const band of o.bands) {
        expect(band, `${o.id}: an unreachable band`).not.toBe('jun')
        expect([...ALBUM_BANDS], `${o.id}: ${band} is not a chapter of the album`).toContain(band)
      }
      expect(o.bands.length, `${o.id}: an occasion with no band can never be selected`).toBeGreaterThan(0)
    }
    // ⭐ And the prologue band is really used, rather than declared and forgotten: his ruling (а)
    // – «Первый раз на корте, первый турнир и/или победа» – is four occasions, and chapter 1 is
    // empty without them.
    expect(ALBUM_CORPUS.filter((o) => o.bands.includes('prologue')).map((o) => o.id)).toEqual([
      'first-court',
      'first-tournament',
      'first-win',
      'first-cup',
    ])
  })

  it('⭐ the three registers of `first-court`\'s `sunny` column are HIS, off the mockups, character for character', () => {
    // ⚠⚠ INVARIANT 4 HAS A POSITIVE HALF AND THIS IS IT. These three strings are the owner's own,
    // carried out of the mockup archive: they are the anchor the other 397 were written against, and
    // the one place in this corpus where a diff is a wording change he did not ask for. Transcribed
    // here, never imported – an import would make this compare the catalogue with itself.
    const firstCourt = BUILT.get('first-court')
    expect(firstCourt, 'the occasion his mockups named exists').toBeDefined()
    expect(firstCourt!.voices.sunny.note).toBe('First day on court. You were so excited.')
    expect(firstCourt!.voices.sunny.caption).toBe('She asked if she could try.')
    expect(firstCourt!.voices.sunny.line).toBe('Some journeys start with a simple "Can I?"')
  })
})
