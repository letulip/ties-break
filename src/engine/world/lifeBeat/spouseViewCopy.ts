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

/** ⚠ ⚠ DRAFT – WHAT THE SPOUSE SAYS, one line per occasion, each spoken about a fact the gate has
 *  just verified the world holds (`SPOUSE_VIEW_OCCASION_AT`, §12) – so no line can describe a season
 *  the career is not having. First person inside the quotation is the counsel pool's own licence:
 *  the narration law binds the frame, not the speech. */
export const SPOUSE_VIEW_SAID: Record<SpouseViewOccasion, string> = {
  'distant-swing': 'The one she married stayed back after the plates were cleared. "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."',
  'road-stretch': 'The one she married said it plainly, on a quiet evening. "The family has been on the road for weeks now. The house does not really get lived in between the trips."',
  'no-vacation': 'The one she married brought it up as the season closed. "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."',
  money: 'The one she married asked it without an edge. "That was a large bill, and the season sits in her account now. I am not counting anybody\'s money. I am asking how this house plans."',
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
