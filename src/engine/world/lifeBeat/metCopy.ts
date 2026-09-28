// A-06 / T6.8 – `world/lifeBeat.ts` §3b MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is `'met'`'s copy half – the week
// he is told there is someone – and a pure leaf: §3b referenced nothing else in the old file. Its
// readers are all in the hub: the dispatcher's said/heading, «learning to listen»'s `metHeadingFor`,
// and §6's `metKeptRow` and `MET_EVENT`. Hub -> here, never back.
//
// ⚠ THE REGISTER PREDICATE MOVES WITH THE POOLS IT PICKS BETWEEN, which is the point of cutting by
// KIND rather than by shape: `metRegisterOf` is the bond band's read on this beat and nothing else uses
// it. `MetRegister` is exported beside it because a `Record<MetRegister, …>` crosses the module edge.
//
// ⚠ `PresenceCell` comes back from the hub and `BondBand`, `LoveEpisode` and `Temperament` from the
// engine's own modules – all four as `import type`, erased at compile time, so
// `tests/import-cycles.test.ts` counts no arrow (CLAUDE.md's P4 rules).
import type { Temperament } from '../../spirit'
import type { BondBand, LoveEpisode } from '../../../shared/protocol/narrative'
import type { PresenceCell } from '../lifeBeat'

// =================================================================================================
// 3b. `'met'` – THE WEEK HE IS TOLD THERE IS SOMEONE (wave 3, T6). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// ⚠⚠ THE BEAT FIRES ALWAYS; THE BOND BAND PICKS THE REGISTER (architect, 11.09, resolving the build
// plan's §0.1 against its §4 on wave 2's own precedent). Three registers, and they are the same
// three rungs the voice bibles' «her voice, the shared pool, silence» ladder already has:
//
//     close              HER OWN LINE, in her own four voices – she came and said it
//     steady             A MENTION – the parent heard it, not from her, and not as a scene
//     strained / cold    A DRY CARD – no line of hers anywhere on it
//
// A band that decided whether the beat HAPPENED would make a distant parent's career quieter rather
// than colder; a band that only decides how the news sounds makes it colder, which is the layer's
// whole subject.
//
// ⚠⚠ AND THE TWO-TIER HONESTY LAW BINDS THIS POOL HARDER THAN ANY OTHER IN THE FILE, because the
// sim holds ALMOST NOTHING about the partner and that is deliberate (`LoveEpisode`: no name, no
// gender, no place, no age, nothing). So not one line below names a person, a place, a plan or a
// duration – «there is someone» is the entire consequential fact any of them may assert, and every
// other word is delivery texture the frame itself licenses.
//
// ⚠ NO LISTEN DETOUR HERE (the brief's own boundary). At the fork «say nothing and let her talk»
// buys more of her, because she came to say something and has more of it. This is news, not a
// question: the four answers are REACTIONS, and one of them is saying nothing – a plain answer with
// a plain price, not a second panel.

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

/** ⭐⭐ HER OWN LINE AT `close`, BY VOICE – four drafts, and this is the SECOND thing in this file
 *  indexed by temperament (the fence's own shape: the wording knows who she is, nothing else does).
 *
 *  The bible each one is written to, in a phrase: `sunny` volunteers it and names the ordinary
 *  feeling; `fiery` is talking before she is through the door and closes the subject herself;
 *  `quiet` says it sideways, in the middle of a household action, and leaves herself out of it;
 *  `deep` waits for the room to be quiet and gives the conclusion with nothing round it.
 *
 *  ⚠ NO REGISTER SPLIT, AND IT IS A SCOPE STATEMENT RATHER THAN AN OVERSIGHT. The fork's pool splits
 *  `low` from `up` because the fork is a decision her week can weigh on; this is one piece of news
 *  and the spirit register is already carried by the heading above it. T10 owns the expansion (the
 *  brief's own «~8–12 lines» is the FEED's matrix, and this pool is its four-line neighbour).
 *
 *  ⭐⭐⭐ v74 T7 – AND THE SECOND AXIS IS `wants`, WHICH IS THE ONLY PLACE THE FLIP IS EVER SURFACED.
 *  Her drawn `wants` re-prices two of the four answers (`ECONOMY.bond.delta.metWarmPrivate` /
 *  `metSilentPrivate`), and the player is told which way by THE WORDING AND BY NOTHING ELSE – no
 *  meter, no badge, no label, no marked option. That is the birthday-ask scene generalised: the ask
 *  is in the line she says, a parent who is listening hears it, and a parent who is not pays for it
 *  over months. ⚠ THE FRAME PER VOICE IS THE SAME IN BOTH COLUMNS on purpose – she is the same girl
 *  with the same habits, and what differs is the request she attaches. The `open` column is T6's
 *  four lines, with only its QUOTED SPAN moved by the вычитка below.
 *
 *  ⭐⭐⭐ 11.09, THE OWNER'S ВЫЧИТКА – THE THIRD AXIS IS PRESENCE, AND THE EIGHT `away` FRAMES BELOW
 *  ARE HIS OWN WORDS, FOLDED VERBATIM. The roof frames stage a house – the dinner table, the bag
 *  going down, the shopping put away, the room going quiet – and from `college` on the parent is not
 *  in that house. So every away frame carries its own delivery: she rang, she called, she said it at
 *  the end of a message about something else.
 *
 *  ⚠⚠ AND THE QUOTATION IS SHARED ACROSS THE TWO REGISTERS, WHICH IS THE HALF WORTH READING TWICE
 *  («цитаты уже с контракциями по P2, они общие с домашними рамками»). Presence moves the FRAME and
 *  never the sentence: the roof quotes were re-cut to HIS contracted forms so that each (voice,
 *  want) reads the identical span at both distances, and the pin extracts both spans and compares
 *  them rather than trusting that anyone remembers.
 *
 *  ⚠ `deep` STAYS UNCONTRACTED IN THESE POOLS – the bible's «lightly»: her formality is load-bearing
 *  in a confession. ⚠⚠ THE LAW HOME IS `voice-bibles-2026-09.md` §Contractions, NOT THIS COMMENT,
 *  and the distinction matters: the bible licenses `deep` lightly rather than never, so a future
 *  `deep` line where a contraction genuinely works is ALLOWED. An absolute written here would send
 *  whoever meets that line to «fix» the wrong side of it (the owner's correction, 11.09 – absolutes
 *  are reserved for licensing law).
 *
 *  The other three contract where it is natural – a local fold of the same section, and the same
 *  pointer applies: sunny and fiery throughout, quiet mostly. His own label said «контракции
 *  sunny/fiery» while his delivered text contracts `quiet` too and leaves `deep` alone at every
 *  cell; the delivered text is what the player reads, so the text won. Both `deep` cells below are
 *  byte-identical to what T6 shipped. */
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

/** ⭐ `steady` – A MENTION, AND NOT ONE WORD OF HERS IN IT. She said it somewhere in the week and the
 *  parent caught it; there is no scene, because a scene is what `close` has and this home does not.
 *
 *  ⚠ ONE LINE PER READING, NOT FOUR. It is the PARENT'S narration and the fence keeps temperament out
 *  of that – `HER_LINE` and `MET_HER_LINE` are the only pools in this file a girl's voice indexes.
 *  The `wants` axis is not the fence: it is not who she is, it is what she asked for.
 *
 *  ⭐⭐ 11.09, THE ВЫЧИТКА – `open`'s TAIL WAS EXPLAINING AN ABSENCE. It read «…and did not stop to
 *  say who», which is the narrator telling the player what DIDN'T happen and why it matters, one
 *  rung below the banned-tail line but the same move. The replacement states the absence as a fact
 *  of the week instead: «No name came with it.»
 *
 *  ⚠⚠ AND THAT SECOND SENTENCE IS HONEST PRECISELY BECAUSE THE SIM HOLDS NO NAME. `LoveEpisode`
 *  carries no name, no gender and no place, deliberately, so «no name came with it» is not the
 *  parent's guess about her reticence – it is the two-tier honesty law's own discipline printed as a
 *  sentence: the line asserts exactly the consequential fact the world holds, and the reason it can
 *  never be contradicted is that there is nothing there to contradict it. */
export const MET_MENTION: Record<LoveEpisode['wants'], string> = {
  open: 'She mentioned someone this week, in passing. No name came with it.',
  private: 'She let someone slip this week, caught herself, and moved the conversation on.',
}

/** ⭐⭐ `strained` / `cold` – THE DRY CARD. No quotation at all, which is a stronger silence than the
 *  fork's flat pool: there she at least answered a question, and here the parent found out without
 *  her. The loss is the whole content of the line, and nothing in it is rude.
 *
 *  ⚠⚠ AND IT CARRIES THE `wants` READ TOO, WHICH IS THE DECISION WORTH READING TWICE. The flip
 *  applies at EVERY band – a cold home's four answers are priced exactly as a close home's – so a
 *  pool that only split at `close` would leave the far half of the ladder paying a rule it could
 *  never read. The parent at this distance is not told what she wants; he is told she kept it, which
 *  is the same fact arriving as an inference instead of as a request.
 *
 *  ⭐⭐ 11.09, THE ВЫЧИТКА – A TWO-ROW POOL THAT ENDED THE SAME WAY TWICE. Both rows closed on «and
 *  the house found out anyway», so the one axis this pool exists to carry – what she wanted done
 *  with it – arrived under a tail the player had already read. `open` keeps it, because that is the
 *  row the tail was written for: nobody was asked to keep anything, and the house simply learned.
 *  `private` now ends on the thing that is actually different about it – she was holding it, and it
 *  got out from under her.
 *
 *  ⚠ AND IT IS NOT `MET_EVENT['found-out'].private`, WHICH IS THE NEIGHBOUR IT COULD MOST EASILY
 *  HAVE COLLIDED WITH: that row reads «She had been keeping it to herself.» and is the FEED's
 *  permanent record of the same week. Two surfaces, two sentences – the card says how it surfaced,
 *  the kept row says what she had been doing. */
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

/** ⭐⭐⭐ v77 T6 – THE HEADLINE REGISTER, AND IT IS **ONE LINE ON THE STANDING POOL** rather than a
 *  fourth column of it (the brief's own boundary: «the one addition is a headline-register intro
 *  variant on the standing prompt – NO new beat kind, no new delivery path»). The overtake is
 *  who-she-is §0's founding scene given its mechanism – «a parent learning about a boyfriend from a
 *  photograph» – and the only thing about the card that may move is the frame the parent reads it
 *  under. Her line, the options, the follow-up and the `LifeBeatRecord` itself are BYTE-IDENTICAL to
 *  an ordinary delivery's, which is the property T6's pin asserts by deep-equalling the two.
 *
 *  ⚠⚠ IT KEYS ON NOTHING – not the bond band the three standing frames key on, and deliberately.
 *  `MET_HEADING`'s ladder says how far apart the two of them are when the news lands; this frame
 *  says WHERE THE NEWS CAME FROM, and that fact outranks the distance in the one week it is true:
 *  a `her`-band parent who read it in the paper was not told by her either. A per-band headline row
 *  would be three sentences about one scene, and §5a's rule (no agent widens a pool unasked) is the
 *  other half of the argument.
 *
 *  ⚠ A DRAFT, like every word in this file's pools – T8's вычитка and the owner's playtest are the
 *  gate (invariant 4, the wave's §5). */
export const MET_HEADING_HEADLINE = 'We read about it before she told us'
