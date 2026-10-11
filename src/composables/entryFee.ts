import { formatCents } from '../shared/money'
import { t } from '../i18n'

// ⭐ RU-22 (11.10) – THE FEE PILL, SAID THROUGH THE CATALOGUE. It was `entryFeeLabel` in shared/money.ts: a formatter that carried the English word «entry» inside the string, ruled once at L2-4 for the
// Season and Calendar cards ("an English formatter with no catalog row"). The owner's formatter note (docs/localization/ru-formatters-countries-2026-10.md, «Деньги и прочие числа») gave both Russian
// forms and says where the word belongs: «слово – часть фразы, не денежного форматтера». So the word moved out of the formatter into two messages. The sum is still `formatCents` (the one money form,
// ruling 07.10) and the English is the string the old function built, byte for byte (`no entry fee` / `entry $40`).
//
// ⭐ AN ENTRY FEE, AND "$0" IS NOT ONE (round-17 #28), kept from the function this replaced.
//
//   THE OWNER'S REPORT: a Grand Slam entry costs $0. ESTABLISHED: it is CORRECT, and it is not a wild card, a lottery or an acceptance – it is the real rule, written into the tier table with its reason:
//   `slam.entryFeeCents: 0`, "SHE IS NOT CHARGED TO ENTER A SLAM. Real rule, and it is the one entry fee in the game that is genuinely zero: the four majors do not levy one. Travel is still hers."
//   Every other rung on the ladder charges, from $40 at Local to $1,000 at WTA 1000.
//
//   SO THE DEFECT IS PRESENTATIONAL AND IT IS REAL. `formatCents(0)` renders "$0", and a price of "$0" beside fifteen rungs that quote real prices reads as a number the game failed to fill in – which
//   is exactly how it was reported. A fact ("no entry fee") and a missing value ("$0") must not look the same, and the only rung this can ever fire on is the one where it is true.
//
//   ⚠ IT SAYS NOTHING ABOUT THE COST OF GOING. A slam's travel is $3,000-$6,000, the most expensive trip in the game, and it is charged separately – so this must read as "no ENTRY fee" and never as
//   "free". The word "entry" is load-bearing and is inside the message rather than left to the caller.
export function entryFeeText(cents: number): string {
  return cents === 0 ? t('no entry fee') : t('entry {0}', [formatCents(cents)])
}
