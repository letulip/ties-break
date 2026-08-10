// WHAT AN EVENT'S CONTROL IS CALLED, once, for the two screens that carry one.
//
// ⚠ WHY THIS IS A MODULE AND NOT A TEMPLATE LITERAL IN EACH SCREEN. It is the same argument
// `preferredWeekEvent` makes one file over in `tierState.ts` – "the Calendar screen's markers pick
// through the same function, so the two surfaces cannot disagree about which tournament a week IS".
// Two surfaces disagreeing about what a tournament is CALLED is the same defect one layer up, and
// `docs/specs/e2e-coverage.md` D11 already records what it costs: duplicate names across live
// surfaces produce strict-mode collisions and journeys that have to route around them.
//
// ⚠ THE DEFECT THIS EXISTS FOR IS D4, THE HIGHEST-PRIORITY ITEM IN THAT DOCUMENT. Every event card
// on Season renders a button whose entire accessible name is the word "Enter", so a feed of eight
// cards is eight controls with one name – and §8.1 records the consequence: entering a tournament
// through the UI has NO end-to-end coverage at all, because no selector can say which Enter it
// means. "Fixing D4 alone unlocks 8.1" is that document's own sentence.
//
// ⚠ AND THE VISIBLE WORD IS STILL THE FIRST WORD (WCAG 2.5.3, Label in Name). A control whose
// accessible name does not CONTAIN its visible label breaks speech input: a user who says "Enter"
// must reach the button that reads Enter. So the name is the visible label plus what it acts on,
// in that order – never a replacement for it.
import { weekRange } from '../shared/dates'

/** Just enough of an event to name a control about it. Deliberately structural rather than
 *  `UpcomingEvent`, so the Calendar's marker (a different shape with the same two fields) can use
 *  the one function too. */
export interface NameableEvent {
  label: string
  week: number
}

/**
 * The accessible name for the ENTER control on a given event: `Enter the World Tour 50, May 9–15,
 * 2039`.
 *
 * The dates are here because the label alone is not unique either – a season carries the same rung
 * several times, and "Enter the World Tour 50" would be ambiguous the moment two of them sit in one
 * feed. The week is what makes it an identity, and `weekRange` is the app's one date formatter, so
 * this name and the dates printed on the card cannot drift apart.
 */
export function enterActionName(event: NameableEvent): string {
  return `Enter the ${event.label}, ${weekRange(event.week)}`
}
