// A-06 / T6.8 – `world/lifeBeat.ts` §3h MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the SPOUSE VIEW's copy half –
// the week the one she married has something to say – and a pure leaf: §3h referenced nothing else in
// the old file and only the dispatcher hub read it. Hub -> here, never back.
//
// ⚠⚠ AND THIS KIND IS THE ONE WHERE THE HAZARD HALF CANNOT FOLLOW AT ALL, for a different reason from
// the others, so it is worth reading. §12 – the opinion SURFACE (`SPOUSE_VIEW_OCCASIONS`,
// `latchedEpisode`, `spouseViewOccasionsAt`, `rollSpouseView` …) – has three INBOUND references
// inside the file: the dispatcher reads it and so does §14, the pregnancy. It also reaches back into
// the hub (§1's queue, §4's `raiseLifeBeat`). So it is imported by what stays AND imports what stays,
// in the source rather than only through the barrel – the textbook «not ready to move», which needs
// dependency inversion rather than a span-move (CLAUDE.md's P4 rules, last bullet).
import type { SpouseViewOccasion } from '../../../shared/protocol/narrative'

// =================================================================================================
// 3h. `'spouse-view'` – THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY (the wedding, wave 7: T5).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// THE FIRST POOL IN THIS FILE WHOSE SPEAKER IS NEITHER HER NOR STAFF. The shape is the counsel's
// (`COACH_COUNSEL`): third-person narration outside the quotation, the speaker's own words inside
// it, keyed on the row's `detail` and on NOTHING else – no voice (he is not her, §3d's argument),
// no bond (he is not the relationship), no register (the week is hers), no presence axis.
//
// ⚠⚠ NO NAME AND NO GENDER ANYWHERE IN THE POOL – the standing law (`ENGAGED_HER_LINE`'s own note):
// the episode holds a persisted NAME since T3, but WHICH surfaces speak it – and whether any may say
// «husband» – is the owner's wording call, carried as a question in T7's table. Until he rules, the
// spouse is «the one she married», which is a fact the world does hold.
//
// ⚠ NO FIGURE AND NO PRICE in any line (rule 4) – the `'money'` occasion says «a large bill» and
// stops there, which is the brief's own fence: beats about money, never accounting.

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
 *  the parent-daughter distance is a fact about it. ⚠ It recommends none of the three answers. */
export const SPOUSE_VIEW_HEADING = 'The one she married has something to say about this season'

/** ⚠ ⚠ DRAFT – the Home card's invitation, `SMALL_TALK_CARD`'s twin for this kind: one short line
 *  saying a word is waiting, never what the word is (the card is only the invitation). */
export const SPOUSE_VIEW_CARD = 'The one she married wants a word.'
