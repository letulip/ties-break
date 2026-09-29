// A-06 / T6.8 – `world/lifeBeat.ts` §3l MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ bereavementCopy: §16, the death's HAZARD half – the world's dice rather than her personality's – is still in the hub…
// ⚠ bereavementCopy: AND THE SUB-STREAM KEY STAYED WITH §16, WHICH IS WHERE IT IS DRAWN
// → docs/notes/life-beats/bereavement.md#bereavementcopyts-header
import type { Temperament } from '../../spirit'

// 3l. `'bereavement'` – A DEATH IN THE FAMILY (the weight, wave 11: T5). ⚠ ⚠ DRAFT – EVERY
// WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4). – ⚠⚠ **THE DECEASED IS
// UNNAMED, IN MECHANICS AND IN COPY** – RULED 22.09 (question 4), and the reason is a
// collision this game already has: the fridge pool names a grandmother in lines nothing
// licenses, so shipping a NAMED death against an unlicensed «Grandma called» scrap is exactly…
//
// ⚠ bereavementCopy: That also means no relation word: not a grandmother, not an aunt, not a cousin.
// ⚠⚠ bereavementCopy: OPENNESS OWNS THE EXPRESSION AND INTENSITY OWNS NOTHING HERE
// ⚠⚠ bereavementCopy: RE-AIMED 26.09 (the owner's ruling 19 on B-08) – THE SHARED-SPAN RULE STOOD HERE TOO AND HAS NOTHING LEFT TO GOVERN…
// ⚠ bereavementCopy: NOT ONE SURVIVING BYTE MOVED (invariant 4)
// ⚠ bereavementCopy: NO DATE AND NO NUMBER IN ANY LINE (rule 4).
// → docs/notes/life-beats/bereavement.md#bereavementcopyts-3l--bereavement--a-death-in-the-family

/** ⚠ ⚠ DRAFT – WHAT SHE SAYS, BY VOICE, ONE CHANNEL.
 *
 *  ⚠⚠ BEREAVEMENT_HER_LINE: THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  ⚠ BEREAVEMENT_HER_LINE: §4's «private grieves almost silently» is untouched by this: openness reaches the card through the four voice…
 *  → docs/notes/life-beats/bereavement.md#bereavement_her_line--draft--what-she-says-by-voice-one-channel
 */
export const BEREAVEMENT_HER_LINE: Record<Temperament, string> = {
  sunny: 'She rang in the evening, before anything else had been said. "There has been a death in the family. I would rather you heard it from me."',
  fiery: 'She rang and led with it, and was off the phone not long after. "There has been a death in the family. I am not going to be much use this week."',
  quiet: 'She sent the week\'s dates through, and this was underneath them. "There has been a death in the family. There are arrangements to make."',
  deep: 'The call was mostly quiet. She said it once, near the end of it. "There has been a death in the family."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `EXPECTING_DRY`'s
 *  shape and doctrine: it states what the week HOLDS, and the distance is the whole content. */
export const BEREAVEMENT_DRY = 'There has been a death in her family. The house heard it from somebody else.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `EXPECTING_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line rather than through the frame.
 *  ⚠ It recommends nothing and asks nothing: what a parent can see is that it has happened. */
export const BEREAVEMENT_HEADING = 'There has been a death in the family'
