// A-06 / T6.8 – `world/lifeBeat.ts` §3m MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is `'divorced'`'s copy half – the
// week the marriage ends, wave 12's parting – and a pure leaf: §3m referenced nothing else in the old
// file and its readers are all in the hub (the dispatcher's said/heading, and §8's latched branch,
// which writes `divorcedKeptRow()` into the feed). Hub -> here, never back.
//
// ⚠ `EndsRead` NOW COMES FROM A SIBLING MODULE, `./endedCopy`, and that is a LEAF-TO-LEAF type import
// rather than a reach back at the hub: the `'ended'` beat owns the type and moved one commit earlier.
// `Temperament` is the engine's own. Both are `import type`, erased at compile time.
import type { Temperament } from '../../spirit'
import type { EndsRead } from './endedCopy'

// =================================================================================================
// 3m. `'divorced'` – THE WEEK THE MARRIAGE ENDS (the parting, wave 12: T1/T2).
//     ⚠ HIS REVIEW APPLIED 23.09 (invariant 4; T8's table carries per-row status) – awaiting his
//     final pass.
// =================================================================================================
//
// `docs/specs/the-parting-2026-09.md` §4. The ending already happens – `rollEnds` ×
// `ECONOMY.wedding.latchEndFactor`, since v83 – and what it has never been able to do is say so.
// Every pool below is §3e's ending read one rung up, with the register axis removed.
//
// ⚠⚠ ONE REGISTER, AND IT IS A FACT ABOUT THE MACHINERY RATHER THAN A SIMPLIFICATION. `'ended'`
// carries told-now / told-late because an episode can end before its `knownWeek` arrives. A LATCHED
// one cannot: the latch is written by `landWedding`, which needs an ANSWERED `'engaged'` row, which
// needs the delivered episode – so a married row always holds the `'met'` receipt and the ending
// never falls through to `deliverKnownPartner`'s late path. The spec's §2.2 states it and T2's tests
// pin both halves; nothing below has a second cell for a scene that cannot happen.
//
// ⚠⚠ AND THE READ IS THE ENDING'S OWN, DRAWN ON THE ENDING'S OWN KEY. `seed:life:ends:<week>:react`
// is derived once at the raise site and spent on the heading and the price, exactly as it has been
// since v75 – ZERO new streams, which is the wave's law (§9). A `:divorce:react` key would put a
// new draw on every marriage ending in every career, the frozen corpus included.
//
// ⚠ WHAT NO LINE HERE MAY SAY: whose fault it was, how long it had been coming, what was divided,
// or a word about money. The world holds none of them (§2.4: «no accounting, ever»), and a sentence
// that reached for one would be inventing the consequential fact the layer refuses to model. The
// husband's NAME is on the episode since v83 and is deliberately not spoken here either – which
// surface speaks it is the owner's question, and a card that answered it by default would settle it
// for him.

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `close` / `steady` – HER OWN VOICE, four
 *  temperaments, ONE channel. `ENDED_HER_LINE`'s completeness law kept whole: this is one of the
 *  pools in this file a girl's voice indexes, and a `quiet` girl can never silently receive a
 *  `fiery` girl's line.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (his 23.09 review, must-fix 1). A `roof` divorce cannot happen: the latch needs 23+,
 *  `independent` begins at 22 and `college` is an away stage too – so every divorce a real career
 *  can produce is `away`, and eight cells would be four reachable lines towing four dead ones. The
 *  `Record<Temperament, string>` says so in the type; the sibling roof cells then still standing in
 *  the wave-7 and wave-11 pools were the same finding one wave back, listed in the backlog rather
 *  than churned here. ⚠ RE-AIMED 26.09: those siblings are GONE (ruling 19 on B-08 – `'engaged'`,
 *  `'expecting'` and `'bereavement'` collapsed the same way), and the reachability argument this
 *  paragraph makes by hand is now MEASURED for all four pools at once by
 *  `tests/principles-b08-presence-reach.test.ts`, which also refuses a FIFTH pool keyed on presence
 *  behind a gate at 22 or over.
 *
 *  ⚠ EACH VOICE SAYS THE SAME FACT AND KEEPS ITS OWN HABIT: `sunny` reassures before the news has
 *  landed, `fiery` closes the subject in the same breath, `quiet` arrives at it through the
 *  arrangements, `deep` gives the thing its size and stops. ⚠ AND NOT ONE OF THEM ASKS THE PARENT
 *  FOR ANYTHING – what she wants is the READ, which the heading carries; a line that asked would
 *  answer the card for him. ⚠ The quotes carry contractions – his 11.09 P2 ruling («цитаты уже с
 *  контракциями по P2»), the spoken register rather than the written one. */
export const DIVORCED_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called before the news could travel. "We\'re ending it. I\'m all right. I wanted you to hear it from me."',
  fiery: 'She called and went straight to it. "The marriage is over. It\'s decided. I don\'t want to pick it apart."',
  quiet: 'She called about the next few weeks. "We\'re separating. There are things to sort out. I may go quiet for a bit."',
  deep: 'The call went quiet before she said it. "It\'s over. That\'s all I can say about it today."',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `strained` / `cold` – THE DRY CARD, and
 *  not one word of hers in it. `ENDED_DRY`'s told-now row one rung up: by this band the parent was
 *  never the person it was told to, and the line now says exactly that distance and nothing else –
 *  the news reached this house around her.
 *
 *  ⚠ IT CARRIES NO READ, which is why the read lives in the heading: a dry card that named what she
 *  needs would be a home at this distance being told it, which is the one thing the rung is defined
 *  by not having. ⚠ AND IT IS ONE STRING RATHER THAN A RECORD, because there is one register. */
export const DIVORCED_DRY = 'The marriage is over. The news did not come from her.'

/** ⚠ ⚠ DRAFT – THE PARENT'S FRAME, KEYED ON HER READ. §3e's banner inherited exactly: THE READ IS
 *  HERE AND NOWHERE ELSE ON THIS CARD, because the heading is the only surface carried at every bond
 *  band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠⚠ NEITHER CELL NAMES AN ANSWER. «She wants the room» is what the parent can SEE; which of the
 *  four things to say about it is his, and a heading that recommended one would be the meter this
 *  layer refuses to build, spelled in words – `ENDED_HEADING`'s own rule, word for word.
 *
 *  ⚠ BOTH CELLS OPEN ON THE SAME CLAUSE, which is `ENDED_HEADING`'s shape too: the fact is not what
 *  varies between them, the read is. ⚠ AND THE READ HALF IS THE STANDING POOL'S OWN WORDING, kept
 *  deliberately – «she wants the room to herself» / «she does not want to be on her own with it» is
 *  one fact with one sentence in this file, and a second way of saying it would put two readings of
 *  one draw on two screens. */
export const DIVORCED_HEADING: Record<EndsRead, string> = {
  space: 'Her marriage is over, and she wants the room to herself',
  company: 'Her marriage is over, and she does not want to be on her own with it',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – THE KEPT FEED ROW, and the album keeps
 *  it for the life of the career (`keep: true`). One clause, licensed at the raise site:
 *  `endEpisode` wrote `endedWeek = world.week`, and `latchedWeek !== null` is what selected this
 *  sentence over the ending's.
 *
 *  ⚠⚠ THE SECOND CLAUSE («and there is nobody in her life now») IS GONE – his review, must-fix 3.
 *  It was licensed off `activeEpisode === null`, which is true of the SLOT and false of the LIFE:
 *  an ended marriage does not erase parents, children, friends or a coach, and the wave's own law
 *  says the children are untouched state. The row states the one fact and needs no second clause.
 *  ⚠ `ENDED_NOW_EVENT` one rung up still carries the same tail for a break-up – shipped wording,
 *  not this wave's to change; listed in the backlog for his eye.
 *
 *  Nothing else: no reason, no fault, no name, no duration, no bond band and no money. ⚠ AND IT DOES
 *  NOT OPEN BY ANNOUNCING THE MARRIAGE, which is `ENDED_NOW_EVENT`'s finding 1 inherited: the
 *  wedding's own kept row said it already and both rows are `keep: true`, so a closing row that
 *  introduced the husband would read as the album meeting him for a second first time. */
const DIVORCED_NOW_EVENT = 'Her marriage ended this week.'

/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND – `endedKeptRow`'s own law («so «which sentence does the
 *  album keep» has exactly one spelling»), applied to a kind whose answer happens to be a constant.
 *
 *  ⚠⚠ IT TAKES NO ARGUMENT AT ALL, AND THE EMPTY SIGNATURE IS THE STATEMENT. `endedKeptRow` takes a
 *  register, a read and a coached frame; this kind has ONE register (the receipt, §3m's banner), the
 *  read is refused on this surface by ruling O (the told-now row is read-free in both arms, and a
 *  row that acquired one would be a surface gaining information – «a focus may change how an existing
 *  surface reads; it may not create a surface»), and no `'divorced'` raise site derives the listen
 *  coin. So there is nothing for a parameter to select, and a defaulted one would be an axis nobody
 *  can reach pretending there is a choice here. ⭐ IT IS A FUNCTION ANYWAY rather than the constant
 *  inlined at the raise site, because the ONE-OWNER rule is about where the sentence is DECIDED: the
 *  day this row gains an axis, one call site changes and every reader keeps working. */
export function divorcedKeptRow(): string {
  return DIVORCED_NOW_EVENT
}
