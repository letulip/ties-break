// A-06 / T6.8 – `world/lifeBeat.ts` §3j MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ pregnancyCopy: §14, the pregnancy's HAZARD half, is still in the hub: it calls back…
// → docs/notes/life-beats/pregnancy.md#pregnancycopyts-header
import type { Temperament } from '../../spirit'

// 3j. `'expecting'` – THE WEEK SHE SAYS SHE IS HAVING A CHILD (the pregnancy, wave 8: T2). ⚠ ⚠
// DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's table). –
// SHE ANNOUNCES – §4a's law at the layer's biggest moment, and the pool is
// `ENGAGED_HER_LINE`'s shape rather than a new one: one cell per voice, no register axis, plus
// the dry card for a `strained`/`cold` home and one heading.
//
// ⚠⚠ pregnancyCopy: SO NO LINE BELOW MAY SAY SHE HAS KNOWN FOR A WHILE
// ⚠⚠ pregnancyCopy: RE-AIMED 26.09 (the owner's ruling 19 on B-08) – THE SHARED-SPAN RULE STOOD HERE AND HAS NOTHING LEFT TO GOVERN…
// ⚠ pregnancyCopy: NOT ONE SURVIVING BYTE MOVED (invariant 4)
// ⚠⚠ pregnancyCopy: NO NAME AND NO GENDER FOR THE ONE SHE MARRIED, the standing law of §3g and §3h
// ⚠⚠ pregnancyCopy: AND NO SEX FOR THE CHILD, WHICH IS A DIFFERENT LAW AND A HARDER ONE.
// owner (pregnancyCopy), 20.09: «пол нужен, но мальчиков у нас пока нет»
// ⚠ pregnancyCopy: NO DATE AND NO NUMBER IN ANY LINE (rule 4).
// → docs/notes/life-beats/pregnancy.md#pregnancycopyts-3j--expecting--the-week-she-says-she-is-having-a-child

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, ONE CHANNEL. The voice bibles govern, `ENGAGED_HER_
 *  LINE`'s own reading of them: `sunny` says it evenly and names the feeling; `fiery` gives the
 *  verdict first, in absolutes; `quiet` says the practical surface and leaves herself out;
 *  `deep` says one true thing, late, stripped of its size, in full stops.
 *
 *  ⚠⚠ EXPECTING_HER_LINE: THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  ⚠⚠ EXPECTING_HER_LINE: IT IS **HER** LINE AND NOT THE NARRATION, AND THE SPLIT IS THE FALLIBLE-PARENT LAW RATHER THAN A PREFERENCE.
 *  ⚠ EXPECTING_HER_LINE: NO NUMBER AND NO DATE IN ANY OF THEM…
 *  ⚠ EXPECTING_HER_LINE: THE OLD SPANS ARE LISTED VERBATIM IN THE WAVE'S REPORT
 *  → docs/notes/life-beats/pregnancy.md#expecting_her_line--draft--her-announcement-by-voice-one-channel
 */
export const EXPECTING_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called on a Sunday, before anything else had been said. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both."',
  fiery: 'She rang between flights and led with it. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished."',
  quiet: 'She sent the next block of dates through, and this was underneath them. "We are having a baby. I have known a while. I will play a while yet, and then I will not."',
  deep: 'She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENGAGED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this rung
 *  the parent was never the person it was told to. */
export const EXPECTING_DRY = 'She is expecting a child. Nobody in this house was told first.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `ENGAGED_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line (her own voice against the dry card)
 *  rather than through the frame, which would otherwise say the distance twice. ⚠ It recommends none
 *  of the three answers – what a parent can see is that she has decided, and which of the three
 *  things to say about it is his. */
export const EXPECTING_HEADING = 'A child is coming, and she has already decided'
