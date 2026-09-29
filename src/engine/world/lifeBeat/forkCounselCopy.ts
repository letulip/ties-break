// A-06 / T6.8 – `world/lifeBeat.ts` §3d MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ forkCounselCopy: `ForkStopDriver` COMES BACK AS `import type`
// → docs/notes/life-beats/forkCounsel.md#forkcounselcopyts-header
import type { ForkStopDriver } from '../lifeBeat'

// 3d. `'fork-counsel'` – THE COACH'S READ ON A `stop` (wave 3, T17). EVERY WORD BELOW IS A
// DRAFT. – ⭐⭐⭐ THE OWNER'S «обсуждать с тренером», RULED 11.09 off his own playtest. When the
// want she states at the fork is `stop`, answering her raises ONE more row before the fork may
// be answered: the coach says what he sees.
//
// ⚠⚠ forkCounselCopy: THE VOICE IS NOT HERS AND THIS POOL IS THEREFORE **NOT INDEXED BY TEMPERAMENT**.
// ⚠ forkCounselCopy: AND NOT BY THE BOND BAND EITHER.
// ⚠⚠ forkCounselCopy: THE PSYCHOLOGIST'S COUNSEL IS WAVE 5's AND HE DOES NOT EXIST.
// → docs/notes/life-beats/forkCounsel.md#forkcounselcopyts-3d--fork-counsel--the-coachs-read-on-a-stop

/** ⭐⭐ WHAT THE COACH SAYS, BY DRIVER – 3 drafts, the «the tennis is not the question» family.
 *
 *  ⚠ COACH_COUNSEL: THE SHARED OPENING IS THE POINT OF THE FAMILY and not a lazy prefix
 *  ⚠ COACH_COUNSEL: THE HONESTY LAW BINDS HIM AS HARD AS IT BINDS HER.
 *  → docs/notes/life-beats/forkCounsel.md#coach_counsel--what-the-coach-says-by-driver--3-drafts
 */
export const COACH_COUNSEL: Record<ForkStopDriver, string> = {
  worn: 'Her coach came by that evening. "The tennis is not the question. She has had nothing left to give a session, and I cannot coach that out of her."',
  strained:
    'Her coach rang, and stayed on after the practice talk was done. "The tennis is not the question. Whatever this is, it sits outside the court, and I cannot reach it from where I stand."',
  own: 'Her coach rang the same evening, and did not argue any of it. "The tennis is not the question. She is not running from anything, and I would think less of her if she stayed to please us."',
}

/** The parent's frame over the counsel card. ONE line and not a register table: the week's weather is
 *  hers, and this card is a phone call from somebody else. ⚠ It also says why the fork is still shut,
 *  which is R10-16's doctrine (a control held back with no reason on screen is the bug). */
export const COUNSEL_HEADING = 'She wants to stop, and her coach has asked for a word before we answer'
