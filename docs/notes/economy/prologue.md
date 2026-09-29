---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The prologue block

The comment essays that stood above the `prologue` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `prologue`

```ts
  /** ⭐⭐ WHAT THE NINE YEARS DID TO THAT NUMBER – the childhood prologue's only money model
   *  (docs/specs/childhood-prologue-balance-2026-09.md §3, which supersedes
   *  childhood-prologue-money-2026-09.md §2; build spec §4, «the prologue makes it yours»).
   *
   *  ⚠⚠ TWO OF THE THREE FIGURES ARE FACTS ABOUT THE CARD TABLE AND THE THIRD IS A NAMED DIAL. The
   *  reference and the swing are the cheapest and dearest childhoods `src/prologue/cards.ts` can
   *  produce, recomputed by the test rather than trusted; `reserveSwingShare` is a decision, and the
   *  reason it is now written down is that it always existed – the shipped model divided by
   *  `startingFundsCents.middle` and thereby chose 0.399 without saying so. Every background moves
   *  by the same PROPORTION of its own reserve either way, which is §2.4's ruling in one line –
   *  «the player chooses where the family is FROM, not a sum, and the nine years move the number
   *  from there».
   *
   *  ⚠ WHY A PROPORTION AND NOT THE SAME CENTS FOR EVERYONE. The reachable childhoods span
   *  $8,200 - $28,150, which is more than a working family's entire reserve: subtracting cents would
   *  open a career in debt, and «you went bankrupt before she was fourteen» is a mechanic this game
   *  does not have and §7 forbids inventing here.
   *
   *  ⚠ PINNED AGAINST THE TABLE, NEVER RE-TYPED FROM IT. `tests/prologue-handover.test.ts` recomputes
   *  both numbers by walking every reachable run and fails if a card's price moves without these
   *  moving with it – the same discipline `APPETITE_AT` is held to one directory over. */
```

## `prologue.reserveSwingShare`

```ts
    /** ⭐⭐ HOW FAR THE NINE YEARS MAY MOVE A FAMILY'S OWN RESERVE, AND IT IS THE ONE DIAL IN THE
     *  PROLOGUE'S MONEY. The two figures above are facts about the card table; this is a decision,
     *  it is named as one, and it is his to move (docs/specs/childhood-prologue-balance-2026-09.md
     *  §3).
     *
     *  ⚠ IT REPLACES A DIVISOR THAT WAS A CATEGORY ERROR. The shipped model divided the childhood's
     *  spend by `startingFundsCents.middle` – nine years of FLOW over one family's BALANCE – which
     *  came out at 0.399 and nobody had ever written down. His complaint is what that number does at
     *  the bottom: «По суммам минимальным как-то совсем грустно, особенно у рабочих и средних» – a
     *  working family opening on $4,808 against the $8,000 the whole economy was tuned around – and
     *  his aim is «прийти как можно ближе к нашему коридору изначальному, который поигран и померян».
     *  So the swing keeps its SHAPE (the same clamp, the same proportion for all three backgrounds,
     *  §2.4's ruling untouched) and only this number moves: 0.399 -> 0.20.
     *
     *  ⚠ THE CEILING ON IT IS THE GAME'S OWN. `WEALTH_CORRIDOR` puts one background step at 0.25 of
     *  the middle centre (0.75 / 1.00 / 1.25), so a childhood allowed to move the reserve by a
     *  quarter or more could carry a family across a class boundary – and §2.4 is explicit that the
     *  player picks where the family is FROM. A fifth sits inside that bound with room to spare.
     *
     *  ⚠ AND IT IS NOT THE ACCEPTANCE. The acceptance – the poorest arrival surviving its first
     *  season with the coach it arrives with – is met by the coach LADDER, not by this: measured, a
     *  working family's dearest childhood goes under water at week 26 with the old rung and week 94
     *  with the ruled one, and moving this dial across its whole range shifts that by one week. The
     *  rung is the runway; the reserve is not. */
```
