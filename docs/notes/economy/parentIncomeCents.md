---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The parentIncomeCents block

The comment essays that stood above the `parentIncomeCents` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `parentIncomeCents`

```ts
  // Weekly parent contribution to the war chest, by family background. Emitted as an
  // `income` event BEFORE costs each week; NO rng draw. TUNED (round-7 economy pass) so
  // that an UNSPONSORED kid (rank > 30 all year, no tournaments) lands the owner's target
  // 52-week net-burn bands: working $4.5–7k, middle $9–14k, wealthy $14–22k. Wealthy's
  // huge weekly support was the "profits feel too easy" driver – the gear/factor/sponsor
  // knobs alone can't make an $800/wk-funded season burn, so the contribution comes down
  // (they still front-load a large STARTING reserve; see world.ts STARTING_FUNDS_CENTS).
  // Working is unchanged – it already sat in-band.
  // WEALTHY RAISED 430 -> 750 (owner, round 12 - his THIRD ask, 27.07 "я уже просил его поднять и
  // не один раз"). His two full 120k careers both ended the same way: bankrupt around week 120-125,
  // with travel overtaking the coach as the top cost centre once the international calendar opened.
  // The old figure was tuned for the round-7 no-tournament burn bands; a real playing season at the
  // J tiers costs $45-60k/season and the age-cap change already trimmed the schedule, so the burn
  // band gives way to the owner's number. He asked for 700-800; 750 is the middle of his range.
  // MIDDLE RAISED 300 -> 425 (owner, round 13, 28.07 - his ask at "400-450" for the SECOND time;
  // wealthy moved in round 12 but middle never did, and his first Diary-1 playtest burned the whole
  // 25k reserve inside one season). 425 is the middle of his range. Same trade as the wealthy
  // re-base: the round-7 idle-year burn band gives way to the owner's number, and the calibration
  // band in tests/economy.test.ts is re-pinned to the measured window at 425, deliberately.
```
