// A-06 / T6.8 – `world/lifeBeat.ts` §3m MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ divorcedCopy: `EndsRead` NOW COMES FROM A SIBLING MODULE, `./endedCopy`
// → docs/notes/life-beats/divorced.md#divorcedcopyts-header
import type { Temperament } from '../../spirit'
import type { EndsRead } from './endedCopy'

// 3m. `'divorced'` – THE WEEK THE MARRIAGE ENDS (the parting, wave 12: T1/T2). ⚠ HIS REVIEW
// APPLIED 23.09 (invariant 4; T8's table carries per-row status) – awaiting his final pass. –
// `docs/specs/the-parting-2026-09.md` §4. The ending already happens – `rollEnds` ×
// `ECONOMY.wedding.latchEndFactor`, since v83 – and what it has never been able to do is say
// so. Every pool below is §3e's ending read one rung up, with the register axis removed.
//
// ⚠⚠ divorcedCopy: ONE REGISTER, AND IT IS A FACT ABOUT THE MACHINERY RATHER THAN A SIMPLIFICATION.
// ⚠⚠ divorcedCopy: AND THE READ IS THE ENDING'S OWN, DRAWN ON THE ENDING'S OWN KEY.
// ⚠ divorcedCopy: WHAT NO LINE HERE MAY SAY
// → docs/notes/life-beats/divorced.md#divorcedcopyts-3m--divorced--the-week-the-marriage-ends

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `close` / `steady` – HER OWN VOICE,
 *  four temperaments, ONE channel. `ENDED_HER_LINE`'s completeness law kept whole: this is one
 *  of the pools in this file a girl's voice indexes, and a `quiet` girl can never silently
 *  receive a `fiery` girl's line.
 *
 *  ⚠⚠ DIVORCED_HER_LINE: THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  ⚠ DIVORCED_HER_LINE: RE-AIMED 26.09: those siblings are GONE…
 *  ⚠ DIVORCED_HER_LINE: EACH VOICE SAYS THE SAME FACT AND KEEPS ITS OWN HABIT
 *  ⚠ DIVORCED_HER_LINE: AND NOT ONE OF THEM ASKS THE PARENT FOR ANYTHING
 *  ⚠ DIVORCED_HER_LINE: The quotes carry contractions – his 11.09 P2 ruling («цитаты уже с контракциями по P2»)…
 *  → docs/notes/life-beats/divorced.md#divorced_her_line--his-review-applied-2309-awaiting-his-final-pass
 */
export const DIVORCED_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called before the news could travel. "We\'re ending it. I\'m all right. I wanted you to hear it from me."',
  fiery: 'She called and went straight to it. "The marriage is over. It\'s decided. I don\'t want to pick it apart."',
  quiet: 'She called about the next few weeks. "We\'re separating. There are things to sort out. I may go quiet for a bit."',
  deep: 'The call went quiet before she said it. "It\'s over. That\'s all I can say about it today."',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `strained` / `cold` – THE DRY CARD…
 *  ⚠ DIVORCED_DRY: IT CARRIES NO READ, which is why the read lives in the heading: a dry card that named what she needs would be a home…
 *  ⚠ DIVORCED_DRY: AND IT IS ONE STRING RATHER THAN A RECORD, because there is one register.
 *  → docs/notes/life-beats/divorced.md#divorced_dry--his-review-applied-2309-awaiting-his-final-pass
 */
export const DIVORCED_DRY = 'The marriage is over. The news did not come from her.'

/** ⚠ ⚠ DRAFT – THE PARENT'S FRAME, KEYED ON HER READ. §3e's banner inherited exactly: THE READ
 *  IS HERE AND NOWHERE ELSE ON THIS CARD, because the heading is the only surface carried at
 *  every bond band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠⚠ DIVORCED_HEADING: NEITHER CELL NAMES AN ANSWER.
 *  ⚠ DIVORCED_HEADING: BOTH CELLS OPEN ON THE SAME CLAUSE, which is `ENDED_HEADING`'s shape too
 *  ⚠ DIVORCED_HEADING: AND THE READ HALF IS THE STANDING POOL'S OWN WORDING, kept deliberately
 *  → docs/notes/life-beats/divorced.md#divorced_heading--draft--the-parents-frame-keyed-on-her-read
 */
export const DIVORCED_HEADING: Record<EndsRead, string> = {
  space: 'Her marriage is over, and she wants the room to herself',
  company: 'Her marriage is over, and she does not want to be on her own with it',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – THE KEPT FEED ROW, and the album
 *  keeps it for the life of the career (`keep: true`). One clause, licensed at the raise site:
 *  `endEpisode` wrote `endedWeek = world.week`, and `latchedWeek !== null` is what selected
 *  this sentence over the ending's.
 *
 *  ⚠⚠ DIVORCED_NOW_EVENT: THE SECOND CLAUSE («and there is nobody in her life now») IS GONE – his review, must-fix 3.
 *  ⚠ DIVORCED_NOW_EVENT: `ENDED_NOW_EVENT` one rung up still carries the same tail for a break-up – shipped wording…
 *  ⚠ DIVORCED_NOW_EVENT: AND IT DOES NOT OPEN BY ANNOUNCING THE MARRIAGE, which is `ENDED_NOW_EVENT`'s finding 1 inherited
 *  → docs/notes/life-beats/divorced.md#divorced_now_event--his-review-applied-2309-awaiting-his-final-pass
 */
const DIVORCED_NOW_EVENT = 'Her marriage ended this week.'

/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND – `endedKeptRow`'s own law («so «which sentence does
 *  the album keep» has exactly one spelling»), applied to a kind whose answer happens to be a
 *  constant.
 *
 *  ⚠⚠ divorcedKeptRow: IT TAKES NO ARGUMENT AT ALL, AND THE EMPTY SIGNATURE IS THE STATEMENT.
 *  → docs/notes/life-beats/divorced.md#divorcedkeptrow--the-kept-row-one-function-per-kind
 */
export function divorcedKeptRow(): string {
  return DIVORCED_NOW_EVENT
}
