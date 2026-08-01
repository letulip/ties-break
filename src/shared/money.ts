// Money, formatted for the player — ONE implementation for the whole UI.
//
// THE CONTRACT IS IN THE FILENAME AND THE FUNCTION NAMES: cents in, whole dollars out, en-US
// grouping. Every money figure in this game is an integer number of CENTS from the engine
// (fundsCents, entryFeeCents, prizeCents, ...), and the display rounds it to whole dollars —
// nothing in the UI ever shows a decimal point on money.
//
// WHY A MODULE FOR EIGHT LINES: before it, this exact body was re-implemented fifteen times across
// thirteen components under three names, and one of the copies — MoneyScreen's old
// `formatDollars(dollars)` — took DOLLARS while its seven same-named siblings took cents. That is a
// ×100 display bug waiting on the first code move between screens, in the game whose pillar is
// honest economics. With the unit in the name there is no ambiguous `formatDollars` left to reach
// for, and tests/money-format.test.ts gates the copies from coming back.
//
// A sibling of shared/format.ts rather than a lodger in it: format.ts's charter is name/rank
// display; money's one-contract rule deserves a filename that states the unit, and a grep for
// "money" finds it.
//
// ⚠ THE -0 EDGE IS LOAD-BEARING: Math.round(-49 / 100) is NEGATIVE ZERO, and `-0 < 0` is false, so
// sub-dollar debt prints "$0" (never "-$0") and the signed form prints "+$0". That is the exact
// behaviour every deleted local copy had; the behavioural tests pin it as the contract.

/** "$1,234" / "-$1,234". The unsigned form: plain figures, fees, balances. */
export function formatCents(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

/** "+$1,234" / "-$1,234". The signed form: deltas, where the direction IS the message. */
export function formatCentsSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
