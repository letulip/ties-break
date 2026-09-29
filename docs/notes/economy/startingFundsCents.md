---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The startingFundsCents block

The comment essays that stood above the `startingFundsCents` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `startingFundsCents`

```ts
  /** ⭐ THE WAR CHEST THE FAMILY OPENS WITH, and the game's own three pictures of what a family HAS.
   *
   *  ⚠ MOVED HERE FROM world.ts BY ROUND 26 #4, AND NOTHING ELSE MOVED WITH IT. `world.ts` keeps the
   *  historical export (`export const STARTING_FUNDS_CENTS = ECONOMY.startingFundsCents`) on the same
   *  line as `PARENT_INCOME_CENTS` three lines below it, so all twelve readers – two screens, five
   *  tests, two tools – are untouched. It comes here because a MEANS BAND needs it and the module
   *  that needs it (`world/means.ts`) may not import `world.ts` back: that edge is a runtime cycle,
   *  and this file imports nothing from the engine above `rng`.
   *
   *  ⚠ AND IT IS THE ONLY HONEST SOURCE FOR "IS THIS FAMILY POOR". Every other wealth figure in the
   *  game is a per-week flow (`parentIncomeCents`) or a per-bill factor (`wealthCorridor`); these
   *  three are the only BALANCES the design ever named, and the whole economy was tuned against them
   *  – the round-12/13 comments below argue about a career going bankrupt out of the 120k reserve and
   *  a first playtest burning the 25k one inside a season. See `world/means.ts` for what reads them. */
```
