// A-06 / T6.8 – `world/lifeBeat.ts` §3h MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ spouseViewCopy: AND THIS KIND IS THE ONE WHERE THE HAZARD HALF CANNOT FOLLOW AT ALL
// → docs/notes/life-beats/spouseView.md#spouseviewcopyts-header
import type { SpouseViewOccasion } from '../../../shared/protocol/narrative'

// 3h. `'spouse-view'` – THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY (the wedding, wave
// 7: T5). ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's
// table). – THE FIRST POOL IN THIS FILE WHOSE SPEAKER IS NEITHER HER NOR STAFF.
//
// ⚠⚠ spouseViewCopy: NO NAME AND NO GENDER ANYWHERE IN THE POOL
// ⚠ spouseViewCopy: NO FIGURE AND NO PRICE in any line (rule 4) – the `'money'` occasion says «a large bill» and stops there…
// → docs/notes/life-beats/spouseView.md#spouseviewcopyts-3h--spouse-view--the-week-the-one-she-married-has-something-to-say

/** ⚠ ⚠ DRAFT – WHAT THE SPOUSE SAYS, a POOL of lines per occasion, each spoken about a fact the gate has
 *  just verified the world holds (`SPOUSE_VIEW_OCCASION_AT`, §12) – so no line can describe a season
 *  the career is not having. First person inside the quotation is the counsel pool's own licence:
 *  the narration law binds the frame, not the speech.
 *
 *  ⭐ ROUND 46 R3 – A LINE DOES NOT INTRODUCE ITS SPEAKER (owner, 06.10, on the heading's change: «заголовок
 *  уже говорит, что он хочет что-то сказать, а первая фраза это повторяет – это слова ради слов»). The
 *  heading IS the introduction, so a line is a scene and then the quoted speech: no «the one she married»,
 *  no «he said», no gender (the schema holds none). `tests/wave7-spouse-view.test.ts` §G holds it as a
 *  property over every line of every occasion, with the old openings as its control.
 *
 *  ⚠ ENTRY 0 OF EACH POOL IS THE LINE THE OCCASION HAD BEFORE – the same scene and every quoted word, only
 *  its opening re-written – and that is load-bearing, not tidy: a `lifeLog` row raised before the pools grew
 *  carries no `line` (`LifeBeatRecord.line`), and absent reads as 0, which is only TRUE if 0 is what that
 *  row was told. ⚠ THE ORDER IS APPEND-ONLY once shipped (the occasion roster's own rule): a saved index
 *  names a position. The pick – the occasion first, then the line inside it, never the line he said last
 *  for that occasion – is `rollSpouseView`'s, and every string below is a DRAFT row of
 *  docs/rounds/round-46.md (R46-S26 on) for the owner's blessing. */
export const SPOUSE_VIEW_SAID: Record<SpouseViewOccasion, readonly string[]> = {
  'distant-swing': [
    'After the plates were cleared: "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."',
    'Two suitcases stood by the door a week early. "I keep packing in my head long before you do. It is not a complaint. It is just where my evenings go."',
    'The call ended past midnight, cheerful to the last minute. "Those time zones are yours now. I am learning which hours of my day still reach you."',
    'A map stayed open on the kitchen table all week. "I measured it with my thumb. Three thumbs of ocean. Nobody tells you marriage involves this much geography."',
  ],
  'road-stretch': [
    'On a quiet evening, plainly: "The family has been on the road for weeks now. The house does not really get lived in between the trips."',
    'The fridge note said back Thursday, then said nothing for a while. "I have stopped counting weeks and started counting airports. It comes to the same number, but it sounds more like your life."',
    'The neighbours asked when the family would next be under one roof. "I said soon, with the confidence of somebody who has learned not to check the calendar first."',
  ],
  'no-vacation': [
    'As the season closed: "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."',
    'The brochure stayed on the shelf from last winter. "I am not asking for the sea. I am asking for one week where nobody\'s racket comes with us."',
    '"People think being married into tennis means holidays. I showed them a photo of a car park in the rain. They stopped asking."',
  ],
  money: [
    'Without an edge: "That was a large bill, and the season sits in her account now. I am not counting anybody\'s money. I am asking how this house plans."',
    'The bank letter lay opened beside the fruit bowl. "I grew up thinking a good month meant nothing broke. I am still translating what a good month means in this house."',
    '"I paid for dinner and it felt like a historical reenactment. Let me have that one. Some things should still be mine to buy."',
  ],
}

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `COUNSEL_HEADING`'s
 *  shape and its reason: this card is a word from a third person, and neither the week's weather nor
 *  the parent-daughter distance is a fact about it. ⚠ It recommends none of the three answers.
 *
 *  ⭐ ROUND 46 #12 – IT NO LONGER OPENS «THE ONE SHE MARRIED». The heading and the line under it said
 *  the same four words one after the other (owner, 05.10: «The one she married повторяется дважды,
 *  давай может всё-таки напишем он, супруг, или вроде того»). «Her spouse» is his own word, and it is
 *  the form that survives any partner: the schema holds no gender, and the name pool being male first
 *  names does not lift the pool's standing «no gender» law – only his ruling does. DRAFT R46-S7 in
 *  docs/rounds/round-46.md; the property (no shared opening) is tests/wave7-spouse-view.test.ts §G. */
export const SPOUSE_VIEW_HEADING = 'Her spouse has something to say about this season'

/** ⚠ ⚠ DRAFT – the Home card's invitation, `SMALL_TALK_CARD`'s twin for this kind: one short line
 *  saying a word is waiting, never what the word is (the card is only the invitation). */
export const SPOUSE_VIEW_CARD = 'The one she married wants a word.'
