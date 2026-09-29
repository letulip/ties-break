// A-06 / T6.8 – `world/lifeBeat.ts` §3b MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ metCopy: THE REGISTER PREDICATE MOVES WITH THE POOLS IT PICKS BETWEEN
// ⚠ metCopy: `PresenceCell` comes back from the hub and `BondBand`, `LoveEpisode` and `Temperament` from the engine's own modules…
// → docs/notes/life-beats/met.md#metcopyts-header
import type { Temperament } from '../../spirit'
import type { BondBand, LoveEpisode } from '../../../shared/protocol/narrative'
import type { PresenceCell } from '../lifeBeat'

// 3b. `'met'` – THE WEEK HE IS TOLD THERE IS SOMEONE (wave 3, T6). EVERY WORD BELOW IS A
// DRAFT. – ⚠⚠ THE BEAT FIRES ALWAYS; THE BOND BAND PICKS THE REGISTER (architect, 11.09,
// resolving the build plan's §0.1 against its §4 on wave 2's own precedent). Three registers,
// and they are the same three rungs the voice bibles' «her voice, the shared pool, silence»
// ladder already has:
//
// ⚠⚠ metCopy: AND THE TWO-TIER HONESTY LAW BINDS THIS POOL HARDER THAN ANY OTHER IN THE FILE
// ⚠ metCopy: NO LISTEN DETOUR HERE (the brief's own boundary).
// → docs/notes/life-beats/met.md#metcopyts-3b--met--the-week-he-is-told-there-is-someone

/** Which of the three registers the news arrives in. ⚠ NOT `speaksInHerOwnVoice` – that predicate is
 *  the fork's two-rung channel (`close`+`steady` speak) and this beat's ladder has three rungs,
 *  because a mention is a real thing a home at `steady` does and the fork had no room for it. Two
 *  readings, two functions, neither pretending to be the other. */
export type MetRegister = 'her' | 'mention' | 'dry'

export function metRegisterOf(band: BondBand): MetRegister {
  if (band === 'close') return 'her'
  if (band === 'steady') return 'mention'
  return 'dry'
}

/** ⭐⭐ HER OWN LINE AT `close`, BY VOICE – four drafts, and this is the SECOND thing in this
 *  file indexed by temperament (the fence's own shape: the wording knows who she is, nothing
 *  else does).
 *
 *  ⚠ MET_HER_LINE: NO REGISTER SPLIT, AND IT IS A SCOPE STATEMENT RATHER THAN AN OVERSIGHT.
 *  ⚠ MET_HER_LINE: THE FRAME PER VOICE IS THE SAME IN BOTH COLUMNS on purpose
 *  ⚠⚠ MET_HER_LINE: AND THE QUOTATION IS SHARED ACROSS THE TWO REGISTERS, WHICH IS THE HALF WORTH READING TWICE…
 *  ⚠ MET_HER_LINE: `deep` STAYS UNCONTRACTED IN THESE POOLS
 *  ⚠⚠ MET_HER_LINE: THE LAW HOME IS `voice-bibles-2026-09.md`
 *  → docs/notes/life-beats/met.md#met_her_line--her-own-line-at-close-by-voice--four-drafts
 */
export const MET_HER_LINE: Record<Temperament, Record<LoveEpisode['wants'], PresenceCell>> = {
  sunny: {
    open: {
      roof: 'She brought it up over dinner, before anyone asked. "There\'s someone. I wanted you to hear it from me first."',
      away: 'She rang just to say it, nothing else on the list. "There\'s someone. I wanted you to hear it from me first."',
    },
    private: {
      roof: 'She brought it up over dinner, and wished straight away that she had not. "There\'s someone. Please don\'t go telling people."',
      away: 'She said it fast, at the end of an ordinary call. "There\'s someone. Please don\'t go telling people."',
    },
  },
  fiery: {
    open: {
      roof: 'She was talking before her bag was down. "There\'s someone. It\'s good. That\'s all you\'re getting."',
      away: 'She called, and was already talking. "There\'s someone. It\'s good. That\'s all you\'re getting."',
    },
    private: {
      roof: 'She was talking before her bag was down. "There\'s someone. And no, we\'re not doing questions about it."',
      away: 'She called, said it, and changed the subject herself. "There\'s someone. And no, we\'re not doing questions about it."',
    },
  },
  quiet: {
    open: {
      roof: 'She said it while she put the shopping away, between two other things. "There\'s someone I see now."',
      away: 'She slipped it in with the week\'s other news. "There\'s someone I see now."',
    },
    private: {
      roof: 'She said it while she put the shopping away, and did not look up. "There\'s someone. I\'d rather that stayed in this room."',
      away: 'She said it at the end of a message about something else. "There\'s someone. I\'d rather that stayed in this room."',
    },
  },
  deep: {
    open: {
      roof: 'She waited until the house was quiet, then said it once. "There is someone. That is all."',
      away: 'She called late, when the day was done, and said it once. "There is someone. That is all."',
    },
    private: {
      roof: 'She waited until the house was quiet, and asked first that it go no further. "There is someone. Now please let it be."',
      away: 'She called once she was sure of the words, and asked first that it go no further. "There is someone. Now please let it be."',
    },
  },
}

/** ⭐ `steady` – A MENTION, AND NOT ONE WORD OF HERS IN IT. She said it somewhere in the week
 *  and the parent caught it; there is no scene, because a scene is what `close` has and this
 *  home does not.
 *
 *  ⚠ MET_MENTION: ONE LINE PER READING, NOT FOUR.
 *  ⚠⚠ MET_MENTION: AND THAT SECOND SENTENCE IS HONEST PRECISELY BECAUSE THE SIM HOLDS NO NAME.
 *  → docs/notes/life-beats/met.md#met_mention--steady--a-mention-and-not-one-word-of-hers
 */
export const MET_MENTION: Record<LoveEpisode['wants'], string> = {
  open: 'She mentioned someone this week, in passing. No name came with it.',
  private: 'She let someone slip this week, caught herself, and moved the conversation on.',
}

/** ⭐⭐ `strained` / `cold` – THE DRY CARD. No quotation at all, which is a stronger silence than
 *  the fork's flat pool: there she at least answered a question, and here the parent found out
 *  without her. The loss is the whole content of the line, and nothing in it is rude.
 *
 *  ⚠⚠ MET_DRY: AND IT CARRIES THE `wants` READ TOO, WHICH IS THE DECISION WORTH READING TWICE.
 *  ⚠ MET_DRY: AND IT IS NOT `MET_EVENT['found-out'].private`, WHICH IS THE NEIGHBOUR IT COULD MOST EASILY HAVE COLLIDED…
 *  → docs/notes/life-beats/met.md#met_dry--strained--cold--the-dry-card
 */
export const MET_DRY: Record<LoveEpisode['wants'], string> = {
  open: 'There is someone in her life. She did not say so, and the house found out anyway.',
  private: 'There is someone in her life. She had been keeping it close, and it surfaced without her.',
}

/** The parent's frame over the card, one per register. ⚠ IT KEYS ON THE BOND BAND AND NOT ON THE
 *  MOOD LADDER, unlike the fork's `HEADING`: what this week is ABOUT is the distance between them,
 *  and a heading that read her spirit would be answering a different question from the card's. */
export const MET_HEADING: Record<MetRegister, string> = {
  her: 'She has told us there is someone',
  mention: 'Something she mentioned this week',
  dry: 'There is someone in her life',
}

/** ⭐⭐⭐ v77 T6 – THE HEADLINE REGISTER, AND IT IS **ONE LINE ON THE STANDING POOL** rather than
 *  a fourth column of it (the brief's own boundary: «the one addition is a headline-register
 *  intro variant on the standing prompt – NO new beat kind, no new delivery path»).
 *
 *  ⚠⚠ MET_HEADING_HEADLINE: IT KEYS ON NOTHING – not the bond band the three standing frames key on, and deliberately.
 *  ⚠ MET_HEADING_HEADLINE: A DRAFT, like every word in this file's pools – T8's вычитка and the owner's playtest are the gate…
 *  → docs/notes/life-beats/met.md#met_heading_headline--v77-t6--the-headline-register-and-it-is-one-line
 */
export const MET_HEADING_HEADLINE = 'We read about it before she told us'
