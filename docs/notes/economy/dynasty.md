---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The dynasty block

The comment essays that stood above the `dynasty` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `dynasty`

```ts
  /** ⭐⭐⭐ THE DYNASTY (v86, wave 10 T3 – docs/specs/the-dynasty-2026-09.md §7). His ruling, 22.09:
   *  «наследственность темперамента – можно и забенчить, мне кажется».
   *
   *  ⚠ ONE NUMBER AND ONE AXIS, and both halves of that are decisions. `opennessLean` is the chance
   *  the daughter takes her mother's OPENNESS pole; the intensity axis stays uniform and is not
   *  listed here, because a constant for «no lean» would be a dial somebody would eventually turn.
   *  §7's reason, verbatim: openness is the EXPRESSIVE axis – heredity the player can HEAR in the
   *  diary's voice – while intensity prices costs and depths, where a lean would correlate the
   *  dynasty with cost profiles for no story gain.
   *
   *  ⚠⚠ IT RE-MAPS A DRAW AND NEVER ADDS ONE. `temperamentFor` takes exactly two draws off
   *  `seed:temperament` with the lean and without it (`engine/spirit.ts`), so a dynasty career and a
   *  wizard career sit at the same stream position afterwards and the frozen MAIN capture cannot see
   *  this constant at all.
   *
   *  ⚠ DRAFTED AT 0.65 AND THE BENCH CONFIRMS IT (T7 §1, N=400, §8 row 1). 0.5 would be no heredity
   *  at all and 1.0 would make the line a copy of itself; the number is the one the spec drafted and
   *  it moves only on a measurement, never on an agent's word (invariant 5). */
```
