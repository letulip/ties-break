// A-06 / T6.8 – `world/lifeBeat.ts` §3g MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ weddingCopy: THE THREE NAMES ARE `export`ed HERE AND NOT RE-EXPORTED BY THE HUB, on purpose
// ⚠ weddingCopy: THE WEDDING'S OTHER HALF
// → docs/notes/life-beats/wedding.md#weddingcopyts-header
import type { Temperament } from '../../spirit'

// 3g. `'engaged'` – THE WEEK SHE SAYS SHE IS GETTING MARRIED (the wedding, wave 7: T2). ⚠ ⚠
// DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table). –
// SHE ANNOUNCES – §4a's law at the layer's biggest ask so far: no parent menu opened her
// decision, and what the parent holds is a reaction.
//
// ⚠⚠ weddingCopy: RE-AIMED 26.09 (the owner's ruling 19 on B-08): «in both presences» above WAS TRUE OF THE POOL AND FALSE OF THE GAME…
// ⚠ weddingCopy: NOT ONE SURVIVING BYTE MOVED (invariant 4)
// ⚠ weddingCopy: NO NAME AND NO GENDER in any line
// → docs/notes/life-beats/wedding.md#weddingcopyts-3g--engaged--the-week-she-says-she-is-getting-married

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, ONE CHANNEL.
 *
 *  ⚠⚠ ENGAGED_HER_LINE: THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  → docs/notes/life-beats/wedding.md#engaged_her_line--draft--her-announcement-by-voice-one-channel
 */
export const ENGAGED_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called before we had even asked about the week. "We are getting married. I wanted you to hear it from me first."',
  fiery: 'She rang, and led with it. "We are getting married. Yes, we are sure. No, we are not waiting."',
  quiet: 'She sent the season\'s dates through, and this was at the top of the message. "We are getting married. In a couple of months, probably."',
  deep: 'She let the call run almost to the end and said it before goodbye. "We are getting married. I have thought about it. It is right."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENDED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this
 *  rung the parent was never the person it was told to. */
export const ENGAGED_DRY = 'She is getting married. The news reached this house second-hand.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `COUNSEL_HEADING`'s
 *  shape rather than `MET_HEADING`'s ladder, because the one fact of this card is the same fact at
 *  every distance and in every weather: she has decided, and the deciding is hers. The bond band
 *  reaches the card through HER line (own voice against the dry card), never through the frame; a
 *  heading that read the band would say the distance twice. ⚠ It recommends none of the three
 *  answers – «she has made up her mind» is what the parent can see, and which of the three things
 *  to say about it is his. */
export const ENGAGED_HEADING = 'A wedding is coming, and she has made up her mind'
