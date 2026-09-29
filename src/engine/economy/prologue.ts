// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/prologue.md#the-prologue-block

/** ⭐⭐ WHAT THE NINE YEARS DID TO THAT NUMBER – the childhood prologue's only money model
 *  (docs/specs/childhood-prologue-balance-2026-09.md §3, which supersedes
 *  childhood-prologue-money-2026-09.md §2; build spec §4, «the prologue makes it yours»).
 *
 *  ⚠⚠ prologue: TWO OF THE THREE FIGURES ARE FACTS ABOUT THE CARD TABLE AND THE THIRD IS A NAMED DIAL.
 *  ⚠ prologue: WHY A PROPORTION AND NOT THE SAME CENTS FOR EVERYONE.
 *  ⚠ prologue: PINNED AGAINST THE TABLE, NEVER RE-TYPED FROM IT.
 *  → docs/notes/economy/prologue.md#prologue
 */
export const prologue = {
  /** the childhood today's flat reserve already represents: the midpoint of what the nine cards
   *  can cost, `(cheapest + dearest) / 2` */
  referenceSpendCents: 18_175_00,
  /** ...and half the spread, `(dearest - cheapest) / 2`, which is the furthest either way a run
   *  can move the reference. */
  spendSwingCents: 9_975_00,

  /** ⭐⭐ HOW FAR THE NINE YEARS MAY MOVE A FAMILY'S OWN RESERVE, AND IT IS THE ONE DIAL IN THE
   *  PROLOGUE'S MONEY. The two figures above are facts about the card table; this is a decision,
   *  it is named as one, and it is his to move (docs/specs/childhood-prologue-balance-2026-09.md
   *  §3).
   *
   *  ⚠ prologue.reserveSwingShare: IT REPLACES A DIVISOR THAT WAS A CATEGORY ERROR.
   *  owner (prologue.reserveSwingShare): «По суммам минимальным как-то совсем грустно, особенно у рабочих и средних»
   *  owner (prologue.reserveSwingShare): «прийти как можно ближе к нашему коридору изначальному, который поигран и померян»
   *  ⚠ prologue.reserveSwingShare: THE CEILING ON IT IS THE GAME'S OWN.
   *  ⚠ prologue.reserveSwingShare: AND IT IS NOT THE ACCEPTANCE.
   *  → docs/notes/economy/prologue.md#prologuereserveswingshare
   */
  reserveSwingShare: 0.2,
} as const
