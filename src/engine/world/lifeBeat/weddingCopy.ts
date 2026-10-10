// A-06 / T6.8 – `world/lifeBeat.ts` §3g MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ weddingCopy: THE THREE NAMES ARE `export`ed HERE AND NOT RE-EXPORTED BY THE HUB, on purpose
// ⚠ weddingCopy: THE WEDDING'S OTHER HALF
// → docs/notes/life-beats/wedding.md#weddingcopyts-header
import { cp, type CopyRef } from '../../../shared/i18n'
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

/** The span's two numbers in the game's own 52-week year: whole years, and the whole months over. ONE arithmetic
 *  for the words below and the compact form after them, so the two can never count a relationship differently. */
function spanParts(weeks: number): { years: number; months: number } {
  return { years: Math.floor(weeks / 52), months: Math.floor((weeks % 52) / (52 / 12)) }
}

/** ⚠ ⚠ DRAFT – the span as words: whole years and the months over (a 52-week year, the game's own). The
 *  wedding gate is a year together (`ECONOMY.wedding.minEpisodeWeeks`, 52), so an announcement always has at
 *  least a year to say; the under-a-year arms are for a hand-built row and for #9's page, which has no such gate. */
export function togetherSpan(weeks: number): string {
  const { years, months } = spanParts(weeks)
  const y = years === 1 ? '1 year' : `${years} years`
  const m = months === 1 ? '1 month' : `${months} months`
  if (years === 0) return months === 0 ? 'less than a month' : m
  return months === 0 ? y : `${y} and ${m}`
}

// ⭐⭐ ROUND 46 MORNING #3 – THE SPAN, COMPACT. The personal page's relationships cell is a tile line: `nowrap`, on the
// 16-character budget kidLife's `TILE_LINE_MAX` holds every tile to, and `1 year and 6 months` is 19 characters
// before it has a verb. ⚠ ⚠ DRAFT – the forms below are the BUILDER'S DRAFT for the owner's blessing
// (invariant 4): docs/rounds/round-46.md, row R46-S44, with the words form as the alternate (S45).

/** ⚠ ⚠ DRAFT – the span as a tile prints it: `1y 6m`, `3y`, `7m`, and `<1m` before the first whole month. The
 *  longest it can be is `99y 11m` (7 characters), which is exactly what lets `together {span}` – 8 + 1 + 7 – stand
 *  on one 16-character line; the words form never could. The same arithmetic as `togetherSpan` (`spanParts`). */
export function togetherSpanShort(weeks: number): string {
  const { years, months } = spanParts(weeks)
  if (years === 0) return months === 0 ? '<1m' : `${months}m`
  return months === 0 ? `${years}y` : `${years}y ${months}m`
}

/** ⚠ ⚠ DRAFT – the pool line, then how long they have been together. `weeks === null` is «nothing to add» and
 *  returns the line untouched, so every other kind and every row without an episode renders exactly what it
 *  always did. */
export function engagedWithTogether(said: string, weeks: number | null): string {
  return weeks === null ? said : `${said} They have been together for ${togetherSpan(weeks)}.`
}

/** ⭐ L3-5 (10.10) – THE REF BESIDE THE SPAN'S SENTENCE, `togetherSpan`'s nine shapes as nine WHOLE sentences (the house rule for a counted phrase: a form is a sentence, never a
 *  fragment a translator has to reassemble). It reads `spanParts` – the one arithmetic the words, the compact form and this share – and spells each shape out; the net renders the ref
 *  against `engagedWithTogether`'s own text for every week from 0 to 5,200. A number prints as `String(n)`, exactly as the template beside it does. Class (b): derived at snapshot time
 *  off the episode's weeks, never stored, so no old save holds these sentences and the frozen table has no entry for them (the net lists the nine as NEW keys). */
function togetherSentenceRef(weeks: number): CopyRef {
  const { years, months } = spanParts(weeks)
  const m = String(months)
  const y = String(years)
  if (years === 0) {
    if (months === 0) return cp`They have been together for less than a month.`
    return months === 1 ? cp`They have been together for 1 month.` : cp`They have been together for ${m} months.`
  }
  if (years === 1) {
    if (months === 0) return cp`They have been together for 1 year.`
    return months === 1 ? cp`They have been together for 1 year and 1 month.` : cp`They have been together for 1 year and ${m} months.`
  }
  if (months === 0) return cp`They have been together for ${y} years.`
  return months === 1 ? cp`They have been together for ${y} years and 1 month.` : cp`They have been together for ${y} years and ${m} months.`
}

/** The pool line's ref, then the span's: `{0} {1}` over the two, or the pool line's own ref when there is nothing to add (`weeks === null`) – `engagedWithTogether`'s twin. */
export function engagedWithTogetherRef(said: CopyRef, weeks: number | null): CopyRef {
  return weeks === null ? said : cp`${said} ${togetherSentenceRef(weeks)}`
}
