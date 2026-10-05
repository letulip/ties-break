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

// ⭐⭐ ROUND 46 #11d – «HOW LONG THEY HAVE BEEN TOGETHER», ADDED AFTER HER ANNOUNCEMENT.
// The owner, round 46 #11 (05.10): «она объявит о свадьбе заранее (увидел, объявила, можно там тоже писать
// сколько они вместе, кстати, как вариант)». ⚠ ⚠ DRAFT – the sentence below is the BUILDER'S DRAFT for the
// owner's blessing (invariant 4): docs/rounds/round-46.md, `## DRAFT strings (R46-S…)`.
// ⚠ It is APPENDED to the pool line at assembly (`lifeBeatPromptFor`) rather than written into the four voices
// and the dry card, so not one surviving byte of `ENGAGED_HER_LINE` / `ENGAGED_DRY` moved, and the one fact is
// said once for every voice and every distance – `ENGAGED_HEADING`'s own reason for being keyed on nothing.
// It names NO name and NO gender, the pool's own fence.

/** ⚠ ⚠ DRAFT – the span as words: whole years and the months over (a 52-week year, the game's own). The
 *  wedding gate is a year together (`ECONOMY.wedding.minEpisodeWeeks`, 52), so an announcement always has at
 *  least a year to say; the under-a-year arms are for a hand-built row and for #9's page, which has no such gate. */
export function togetherSpan(weeks: number): string {
  const years = Math.floor(weeks / 52)
  const months = Math.floor((weeks % 52) / (52 / 12))
  const y = years === 1 ? '1 year' : `${years} years`
  const m = months === 1 ? '1 month' : `${months} months`
  if (years === 0) return months === 0 ? 'less than a month' : m
  return months === 0 ? y : `${y} and ${m}`
}

/** ⚠ ⚠ DRAFT – the pool line, then how long they have been together. `weeks === null` is «nothing to add» and
 *  returns the line untouched, so every other kind and every row without an episode renders exactly what it
 *  always did. */
export function engagedWithTogether(said: string, weeks: number | null): string {
  return weeks === null ? said : `${said} They have been together for ${togetherSpan(weeks)}.`
}
