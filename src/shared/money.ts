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

/** ⭐ AN ENTRY FEE, AND "$0" IS NOT ONE (round-17 #28).
 *
 *  THE OWNER'S REPORT: a Grand Slam entry costs $0. ESTABLISHED: it is CORRECT, and it is not a
 *  wild card, a lottery or an acceptance – it is the real rule, written into the tier table with its
 *  reason: `slam.entryFeeCents: 0`, "SHE IS NOT CHARGED TO ENTER A SLAM. Real rule, and it is the one
 *  entry fee in the game that is genuinely zero: the four majors do not levy one. Travel is still
 *  hers." Every other rung on the ladder charges, from $40 at Local to $1,000 at WTA 1000.
 *
 *  SO THE DEFECT IS PRESENTATIONAL AND IT IS REAL. `formatCents(0)` renders "$0", and a price of "$0"
 *  beside fifteen rungs that quote real prices reads as a number the game failed to fill in – which
 *  is exactly how it was reported. A fact ("no entry fee") and a missing value ("$0") must not look
 *  the same, and the only rung this can ever fire on is the one where it is true.
 *
 *  ⚠ IT SAYS NOTHING ABOUT THE COST OF GOING. A slam's travel is $3,000-$6,000, the most expensive
 *  trip in the game, and it is charged separately – so this must read as "no ENTRY fee" and never as
 *  "free". The word "entry" is load-bearing and is inside the string rather than left to the caller. */
export function entryFeeLabel(cents: number): string {
  return cents === 0 ? 'no entry fee' : `entry ${formatCents(cents)}`
}

/** "+$1,234" / "-$1,234". The signed form: deltas, where the direction IS the message. */
export function formatCentsSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
