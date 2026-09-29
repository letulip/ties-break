// A-06 / T6.8 – `world/lifeBeat.ts` §3f (the FIRST of the two sections the old file numbered
// «3f») MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ forkPsyCopy: AND THE SECTION WAS FOUND BY ITS BANNER TEXT RATHER THAN BY ITS NUMBER
// ⚠ forkPsyCopy: `ForkStopDriver` and `WorldState` both come back as `import type` – erased at compile time…
// → docs/notes/life-beats/forkPsy.md#forkpsycopyts-header
import type { ForkStopDriver } from '../lifeBeat'
import type { WorldState } from '../state'

// 3f. `'fork-psy'` – THE PSYCHOLOGIST'S READ ON THE SAME `stop` (wave 5, T8). EVERY WORD IS A
// DRAFT. – ⭐⭐⭐ THE SECOND TABLE §3d PROMISED, AND NOT A REWRITE OF THE FIRST. The banner above
// ends «This pool is deliberately shaped so that adding him is a second table and not a
// rewrite of this one» – this is that table. Not one byte of `COACH_COUNSEL` or
// `COUNSEL_HEADING` moved for it.
//
// ⚠⚠ forkPsyCopy: THE SEAT AND NOT A FOCUS.
// ⚠⚠ forkPsyCopy: HE READS `spiritShock` FOR THE **WORDING REGISTER ONLY**
// ⚠⚠ forkPsyCopy: AND HE NEVER NAMES WHAT LANDED.
// ⚠ forkPsyCopy: NOT INDEXED BY HER VOICE AND NOT BY THE BOND BAND, for `COACH_COUNSEL`'s reasons exactly
// → docs/notes/life-beats/forkPsy.md#forkpsycopyts-3f--fork-psy--the-psychologists-read-on-the-same-stop

/** ⭐⭐ WHICH COLUMN OF HIS TABLE IS READ – `'plain'`, or the kind of shock sitting on her.
 *
 *  ⚠⚠ DERIVED FROM THE SCHEMA'S OWN UNION rather than written out, which is what makes the table
 *  below total by TYPE over something that is still growing: `spiritShock.kind` has one member today
 *  and the build plan's steps 7–8 add the others, and the day one lands this record is a compile
 *  error until somebody writes the column. That is `DRIVER_TOTAL`'s and `WANTS_TOTAL`'s guarantee,
 *  taken from a field instead of from a local type. */
export type PsyRegister = 'plain' | NonNullable<WorldState['spiritShock']>['kind']

// ⭐⭐⭐ v85 T1 – `postpartum` JOINED THE UNION AND THIS RECORD WENT RED, WHICH IS THE DESIGN
// ABOVE WORKING EXACTLY AS IT SAYS IT WILL («the day one lands this record is a compile error
// until somebody writes the column»).
// → docs/notes/life-beats/forkPsy.md#psy_register_total--v85-t1--postpartum-joined-the-union-and-this-record
export const PSY_REGISTER_TOTAL: Record<PsyRegister, true> = {
  plain: true,
  breakup: true,
  postpartum: true,
  loss: true,
  bereavement: true,
  // ⭐⭐⭐ v88 – AND THE PARTING'S KIND REDS IT A FOURTH TIME, listed here with its COLUMN owed for
  // `postpartum`'s own reason below.
  divorce: true,
}
export const PSY_REGISTERS = Object.keys(PSY_REGISTER_TOTAL) as readonly PsyRegister[]

/** ⭐⭐ WHAT THE PSYCHOLOGIST SAYS – 6 drafts, his register x the coach's driver.
 *
 *  ⚠ PSY_COUNSEL: THE SHARED OPENING PER COLUMN IS THE POINT OF THE FAMILY
 *  ⚠ PSY_COUNSEL: THE NARRATION SAYS «after the coach» BECAUSE IT ALWAYS IS.
 *  ⚠ PSY_COUNSEL: THE HONESTY LAW: he may name what he can see and what he cannot reach; never a duration, a date, a count, a result…
 *  ⚠⚠ PSY_COUNSEL: TWO CELLS CARRY THE ARCHITECT'S ВЫЧИТКА (13.09) AND HIS WORDING, VERBATIM.
 *  ⚠ PSY_COUNSEL: A GEOGRAPHIC READING MAY NOT COME BACK HERE
 *  ⚠ PSY_COUNSEL: The other four cells did not move, and the shared openings are the point of the family (above)…
 *  → docs/notes/life-beats/forkPsy.md#psy_counsel--what-the-psychologist-says--6-drafts-his-register
 */
export const PSY_COUNSEL: Record<PsyRegister, Record<ForkStopDriver, string> | null> = {
  plain: {
    worn: 'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is tired the way a long season makes a person tired, and tired has an end to it."',
    strained:
      'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. What she is short of is a room where the answer is already yes, and that is not a room I can build from a call."',
    own: 'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is clear, she has been clear for a while, and being clear is not a symptom."',
  },
  breakup: {
    worn: 'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. Underneath it she is also tired, and those are two different things to be."',
    strained:
      'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. She has nowhere easy to set it down, and a weight with nowhere to go starts to feel permanent when it is not."',
    own: 'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. What she wants is her own and I would not argue it – only that a month like this one does some of the wanting."',
  },
  /** ⭐⭐⭐ v85 T1 – THE COLUMN IS OWED, AND `null` IS THE ONLY HONEST CELL A SCHEMA TASK CAN PUT
   *  HERE. Wave 8's T1 widened `spiritShock.kind` with `'postpartum'` (the build plan's step-7
   *  row reserved it) and this table went red, which is the totality above doing its job.
   *
   *  ⚠⚠ PSY_COUNSEL: What the red asks for is THREE MORE SENTENCES IN HIS VOICE, under the honesty law two blocks up…
   *  ⚠ PSY_COUNSEL: THE TEMPTING SHORTCUT IS REFUSED AND NAMED
   *  ⚠⚠ PSY_COUNSEL: AND IT IS UNREACHABLE FOR A STRUCTURAL REASON, NOT MERELY «UNTIL T4»
   *  ⚠ PSY_COUNSEL: The throw below is what makes that safe to rely on: the day a second raise site appears it names this cell by register…
   *  → docs/notes/life-beats/forkPsy.md#psy_counsel--v85-t1--the-column-is-owed
   */
  postpartum: null,
  /** ⭐⭐⭐ v87 – THE SAME TWO COLUMNS OWED, FOR THE SAME REASON AND WITH THE SAME STRUCTURAL
   *  UNREACHABILITY, and they are written as `null` rather than aliased to `plain`'s for the
   *  refusal named one cell up: a man telling a woman the week after a loss that «nothing is
   *  sitting on top of this one» is a bug that reads well.
   *
   *  ⚠⚠ PSY_COUNSEL: UNREACHABLE BY THE SAME THREE FACTS, and this time the ages make it airtight rather than merely true today.
   *  ⚠ PSY_COUNSEL: WHAT A FUTURE COLUMN WOULD OWE
   *  → docs/notes/life-beats/forkPsy.md#psy_counsel--v87--the-same-two-columns-owed-for-the-same-reason
   */
  loss: null,
  bereavement: null,
  /** ⭐⭐⭐ v88 – A FOURTH COLUMN OWED, AND THE UNREACHABILITY ARGUMENT IS THE TIGHTEST OF THE FOUR.
   *  The register is stamped at ONE site, off a `'fork-opinion'` row answered `stop` – the fork
   *  at NINETEEN, which blocks the calendar until it is answered.
   *
   *  ⚠ PSY_COUNSEL: `null` RATHER THAN AN ALIAS TO `breakup`'s COLUMN
   *  → docs/notes/life-beats/forkPsy.md#psy_counsel--v88--a-fourth-column-owed
   */
  divorce: null,
}

/** The parent's frame over his card. ONE line and not a register table, `COUNSEL_HEADING`'s own call:
 *  the week's weather is hers and this is a second phone call from somebody else. ⚠ It says why the
 *  fork is STILL shut after the coach has been answered, which is R10-16's doctrine – a control held
 *  back with no reason on screen is the bug, and the second card is exactly where a player would
 *  otherwise wonder. */
export const PSY_HEADING = 'She wants to stop, and her psychologist has asked for a word too, before we answer'
