// THE LETTERS' LEGACY ADAPTER – docs/specs/i18n-2026-10.md §8 row L3-2.
//
// ⚠ WHAT THIS FILE IS FOR, AND THE FINDING BEHIND IT. A persisted `Offer` carries NO letter prose: its
// `terms` hold numbers, enums, ids and NAMES, and `OfferLetter.vue` rebuilds every sentence from them
// each time the paper is read (the rule `AcademyLetterTerms` and `TourLetterTerms` both state). So the
// letter bodies are assembled at render and wire through `t()` with no schema move. TWO fields are the
// exception, because the engine writes a finished English phrase into the save:
//   · `AdOfferTerms.trade`            – the house's opening clause ("We make watches"), six of them
//   · `TourLetterTerms.requirements`  – the season notice's list ("All 4 Grand Slams"), two shapes
// A stored phrase is read here as what it is: a KEY. `tradeClause` maps the finite set of clauses the
// engine has ever written to `t()` thunks, and `requirementLine` splits the two shapes back into their
// parts (a count and a tier label, which the writer built with `plural(count, '', 's')` and so reverses
// exactly). A phrase this file does not know is returned as stored – English, never a thrown render and
// never a guess – and the net (tests/i18n-l3-2-letters.test.ts) reads the engine for every phrase the
// writers can produce, so a new house or a new rung fails there instead of in a Russian inbox.
//
// ⚠ NO SCHEMA MOVE, ON PURPOSE. Typed rows (a category id, a requirement count) are the better shape for
// a save and the editorial note asks for them (RU-06 §33.3, §37.1), but they are a v94 with a reverse
// match and four re-stamped records, and the stored set here is TWO fields of at most one live letter
// each (`pruneEntryLetters` drops a finished season's tour notice; an ad letter is one per house).
// This adapter serves old and new letters alike, so the day typed rows ship it is the legacy half of
// that migration rather than throwaway code. The measured remainder on the owner's real save is in the
// spec's L3-2 note.
import { t } from '../i18n'

/** The six clauses `economy/advertising.ts` and `engine/offers.ts` write into `AdOfferTerms.trade`.
 *  Each `t()` literal is the stored English, so the key is the sentence the engine wrote. */
const TRADE_CLAUSE: ReadonlyMap<string, () => string> = new Map([
  ['We make watches', () => t('We make watches')],
  ['We make cars', () => t('We make cars')],
  ['We make drinks', () => t('We make drinks')],
  ['We make her kit', () => t('We make her kit')],
  ['We fly people across the world', () => t('We fly people across the world')],
  ['We make perfume', () => t('We make perfume')],
])

/** The stored clause of `AdOfferTerms.trade`, under the current locale. Unknown -> as stored. */
export function tradeClause(stored: string): string {
  return TRADE_CLAUSE.get(stored)?.() ?? stored
}

/** Every stored clause this adapter knows – the net compares it with the engine's own writers. */
export const KNOWN_TRADE_CLAUSES: readonly string[] = [...TRADE_CLAUSE.keys()]

/** One entry of `TourLetterTerms.requirements`, under the current locale.
 *
 *  The writer (`briefingRequirements` in world/mandatory.ts) builds two shapes:
 *    `All ${count} ${label}${count === 1 ? '' : 's'}`   -> a per-event rung ("All 4 Grand Slams")
 *    `${quota} of the ${offered} ${label}s`             -> the quota rung  ("6 of the 10 World Tour 500s")
 *  and both are reversed here into a count and the label (singular, as the tier table spells it).
 *  The English plural 's' stays in the plural key and the singular is its own key, the house rule for a
 *  counted phrase – a translation owns its own plural forms and never inherits the English one. */
export function requirementLine(stored: string): string {
  const all = /^All (\d+) (.+)$/.exec(stored)
  if (all) {
    const n = Number(all[1])
    const rest = all[2]!
    if (n === 1) return t('All {0} {1}', [n, rest])
    if (rest.endsWith('s')) return t('All {0} {1}s', [n, rest.slice(0, -1)])
  }
  const quota = /^(\d+) of the (\d+) (.+)s$/.exec(stored)
  if (quota) return t('{0} of the {1} {2}s', [Number(quota[1]), Number(quota[2]), quota[3]!])
  return stored
}

/** The unit a staff seat is paid in, WITH its article, as a message of its own: the phrase carries its
 *  own preposition in a language that needs one, so the raise request's sentences take it as a param
 *  instead of gluing English "a session" onto a translated clause. `unit` is `staffAskPer(seat)`'s
 *  return – the engine still owns which seat is paid in what; this only localizes the word. The tag is
 *  `rate|` because "a week" is also a DURATION on the build letter ("After a week") and the two need
 *  different Russian. */
export function staffAskPerPhrase(unit: string): string {
  if (unit === 'a session') return t('rate|a session')
  if (unit === 'a week') return t('rate|a week')
  if (unit === 'an hour') return t('rate|an hour')
  return unit
}
