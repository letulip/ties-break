// A-06 / T6.8 – `world/lifeBeat.ts` §3e MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ endedCopy: THE TWO TYPES AND THE TWO ROSTERS COME…
// ⚠⚠ endedCopy: THE SECOND SPELLING IS NOT OPTIONAL
// ⚠ endedCopy: `PresenceCell` and `Temperament` come back as `import type`, erased at compile time.
// → docs/notes/life-beats/ended.md#endedcopyts-header
import type { Temperament } from '../../spirit'
import type { PresenceCell } from '../lifeBeat'

// 3e. `'ended'` – THE WEEK HE LEARNS IT IS OVER (wave 4, T4). EVERY WORD BELOW IS A DRAFT. –
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T4 and the wave-4 rulings A, B and G. §8
// below decides WHEN an attachment ends; this is the conversation that follows, and it is the
// other end of the arc §3b opened.
//
// ⚠⚠ endedCopy: TWO REGISTERS, AND THEY ARE THE WHOLE SUBJECT OF RULING A.
// ⚠⚠ endedCopy: THE DISCRIMINATOR IS THE `'met'` RECEIPT AND **NEVER** `endedWeek < knownWeek`
// ⚠⚠ endedCopy: AND THE REGISTER IS DERIVED, NEVER STORED (`beatEndsRegister`).
// ⚠⚠ endedCopy: THE LADDER IS TWO RUNGS AND NOT `'met'`'s THREE
// ⚠ endedCopy: A `mention` rung is T6's to add if the architect wants one; it is not omitted for want of room.
// ⚠⚠ endedCopy: PRESENCE FROM DAY ONE (the wave-4 brief §0.3, and it is an absolute): every cell below ships its roof AND its away frame.
// ⚠⚠ endedCopy: AND THE READ – WHAT SHE WANTS FROM HIM THIS WEEK – REACHES THE PLAYER THROUGH THE HEADING AND THE TOLD-LATE FEED LINE…
// ⚠ endedCopy: T6 OWNS THE FULL MATRIX and may move the read onto her line instead; that is a wording decision and this is the draft…
// → docs/notes/life-beats/ended.md#endedcopyts-3e--ended--the-week-he-learns-it-is-over

/** WHICH SCENE THIS IS – derived from the `'met'` receipt (ruling A), never stored on the row. */
export type EndsRegister = 'told-now' | 'told-late'

/** ⚠ BOTH REGISTERS AS A LIST, so the completeness pin can walk them without transcribing the union –
 *  `PARTNER_WANTS`' own shape, and `satisfies` is what keeps the two from parting. */
export const ENDS_REGISTERS = ['told-now', 'told-late'] as const satisfies readonly EndsRegister[]

/** ⭐⭐⭐ WHAT SHE WANTS FROM HIM WHILE IT IS RAW – the space-vs-company read, drawn once on the
 *  ending week (`seed:life:ends:<endedWeek>:react`) and re-derived wherever it is needed.
 *
 *  ⚠ IT IS HER `wants`' SIBLING AND NOT A SECOND AXIS ON IT. `LoveEpisode.wants` is what she asked
 *  be done with the NEWS that somebody exists; this is what she wants from her parent in the weeks
 *  after it stops. Two facts, two streams, two names – who-she-is §4's own «her `wants` reads
 *  (private/open, space/company)» row lists them side by side for exactly that reason. */
export type EndsRead = 'space' | 'company'

export const ENDS_READS = ['space', 'company'] as const satisfies readonly EndsRead[]

/** ⭐⭐ HER LINE, BY VOICE, BY REGISTER, IN BOTH PRESENCES – 16 drafts, and the THIRD table in
 *  this file indexed by temperament (the fence's own shape: the wording knows who she is,
 *  nothing else does).
 *
 *  ⚠⚠ ENDED_HER_LINE: THE TWO-TIER HONESTY LAW BINDS THIS POOL AS HARD AS §3b's AND FOR THE SAME REASON
 *  ⚠ ENDED_HER_LINE: NO FAULT AND NO REASON ANYWHERE, which is not delicacy: a break-up the sim never modelled a cause for cannot have one…
 *  ⚠ ENDED_HER_LINE: THE QUOTED SPAN IS SHARED BETWEEN THE TWO PRESENCES, by the presence law
 *  owner (ENDED_HER_LINE): «цитаты ... общие с домашними рамками»
 *  ⚠ ENDED_HER_LINE: THE NARRATOR'S ADVERB.
 *  ⚠ ENDED_HER_LINE: `fiery`'s slow bag is KEPT BYTE-IDENTICAL: it is an observed action, not a manner word…
 *  ⚠⚠ ENDED_HER_LINE: THE UNLICENSED DURATION, AND IT WAS FALSE ON A REACHABLE WEEK.
 *  ⚠⚠ ENDED_HER_LINE: TWO `deep` FRAMES WERE BYTE-IDENTICAL TO `MET_HER_LINE.deep.open`'s…
 *  ⚠ ENDED_HER_LINE: `quiet`'s away frame said «She wrote to say…».
 *  ⚠⚠ ENDED_HER_LINE: AND THAT SAME ARITHMETIC IS WHY THIS POOL IS WRITTEN AT TWO DIFFERENT REGISTERS THOUGH IT READS NONE.
 *  → docs/notes/life-beats/ended.md#ended_her_line--her-line-by-voice-by-register-in-both-presences
 */
export const ENDED_HER_LINE: Record<Temperament, Record<EndsRegister, PresenceCell>> = {
  sunny: {
    'told-now': {
      roof: 'She said it at the table and stayed sitting there afterwards. "It\'s over. I\'m alright. I will be, anyway."',
      away: 'She called that evening and said it before anything else. "It\'s over. I\'m alright. I will be, anyway."',
    },
    'told-late': {
      roof: 'She raised it herself on an ordinary evening, out of nothing. "There was someone. It\'s finished, and I should have said."',
      away: 'She came home for the weekend and said it before she went back. "There was someone. It\'s finished, and I should have said."',
    },
  },
  fiery: {
    'told-now': {
      roof: 'She came in, put her bag down slowly, and sat. "It\'s finished. No, I don\'t want to go through it."',
      away: 'She rang, and it was a short call. "It\'s finished. No, I don\'t want to go through it."',
    },
    'told-late': {
      roof: 'She said it on her way through the kitchen and did not stop. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
      away: 'She put it in a voice note about something else entirely. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
    },
  },
  quiet: {
    'told-now': {
      roof: 'She took her racquets out of the hall and re-stacked them by the door. "The weekend\'s free now. That\'s finished."',
      away: 'She texted the week\'s plans through, and this was under them. "The weekend\'s free now. That\'s finished."',
    },
    'told-late': {
      roof: 'She had the weekend bag open on the floor when she said it. "There was someone. It didn\'t need saying at the time."',
      away: 'She put it in the family chat, after the travel dates were settled. "There was someone. It didn\'t need saying at the time."',
    },
  },
  deep: {
    'told-now': {
      roof: 'She let the week finish before she said anything at all. "It\'s over. I\'d rather not say more."',
      away: 'She let the message sit a while, and answered it with this. "It\'s over. I\'d rather not say more."',
    },
    'told-late': {
      roof: 'She said it to the window rather than to the room. "There was someone. It is over. That was mine to keep."',
      away: 'She said it at the door on a visit home, already leaving. "There was someone. It is over. That was mine to keep."',
    },
  },
}

/** ⭐ `strained` / `cold` – THE DRY CARD, one per register and not one word of hers in it. The
 *  parent knows because a household knows, and the loss is the whole content of the line.
 *
 *  ⚠ ENDED_DRY: IT IS `MET_DRY`'s SHAPE AND NOT ITS SENTENCE.
 *  ⚠ ENDED_DRY: AND IT CARRIES NO READ, WHICH IS WHY THE READ LIVES IN THE HEADING.
 *  ⚠ ENDED_DRY: `told-now` SAID HOW THE NEWS SURFACED («She did not say so, and the house worked it out»)…
 *  ⚠⚠ ENDED_DRY: `told-late` LOST «for a while» – the unlicensed duration, false on ruling A's collision week.
 *  → docs/notes/life-beats/ended.md#ended_dry--strained--cold--the-dry-card-one-per-register
 */
export const ENDED_DRY: Record<EndsRegister, string> = {
  'told-now': 'It is over. She is getting on with the week and not talking about it.',
  'told-late': 'There was someone in her life, and it is already over. Nobody was told at the time.',
}

/** The parent's frame over the card – by register, and by HER READ. ⚠ THE READ IS HERE AND NOWHERE
 *  ELSE ON THIS CARD, which is the banner's own decision: the heading is the only surface carried at
 *  every bond band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠ NOT ONE OF THE FOUR NAMES AN ANSWER. «She wants the room» is what the parent can see; which of
 *  the four things to say about it is his, and a heading that recommended one would be the meter this
 *  layer refuses to build, spelled in words. */
export const ENDED_HEADING: Record<EndsRegister, Record<EndsRead, string>> = {
  'told-now': {
    space: 'It is over, and she wants the room to herself',
    company: 'It is over, and she does not want to be on her own with it',
  },
  'told-late': {
    // ⚠ NOT «leave it there» – the past tense of that phrase is a BANNED TAIL and the present tense
    // is the same narrator move one conjugation away. See `ENDED_LATE_EVENT` below.
    // ⚠ RE-CUT 12.09, HIS WORD ON THE AXIS («давай попробуем»): the told-late headings used to state
    // the read as RECOUNTING («would rather not go into it» / «is not done talking about it») while
    // both registers' answers price PRESENCE – the reader argued about talking and the buttons
    // offered company. Both cells (and the two told-late feed rows) now speak the presence axis the
    // told-now pair already speaks; e2e pins the shared prefix, so the pin survived by construction.
    space: 'There was someone, it is already over, and she wants the room to herself',
    // ⚠⚠ RE-CUT BY v75 T6. It read «and she has been round more since», and that cell asserted TWO
    // things the world does not hold: a count of VISITS (the sim models none, at any stage) and a
    // SPAN, on a card raised in the very week the news lands, when «since» is empty. It is also the
    // one reading that cannot survive the stages – a thirty-year-old in her own household is not
    // «round». The read itself is a persisted draw and IS licensed, so what the heading carries now
    // is the read and nothing round it, in the parent's own frame.
    company: 'There was someone, it is already over, and she does not want to be on her own with it',
  },
}
