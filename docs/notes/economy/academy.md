---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The academy block

The comment essays that stood above the `academy` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `academy.travelCover`

```ts
    /** Share of a travel bill covered at level 1. Travel is the bill that breaks the family
     *  (bench: $18k over 14→18 for the working preset, against a $5.7k horizon deficit), so it is
     *  the one this pays.
     *
     *  ⚠ 0.8 -> 0.75 (R15-7, owner 01.08: «потолок скидки на поездки можно и по-меньше сделать
     *  может быть немного»). A nudge, not a rebuild - and MEASURED before shipping, because the
     *  academy is THE survival mechanism for working-background careers. The econ bench's working
     *  presets at 30 seeds, before -> after: BACKING and SURVIVAL hold (backed 27-30/30 -> 27-30/30,
     *  max -2 careers per 30; survival deltas -3..+3, both directions), so the mechanism itself is
     *  intact and the change ships. What visibly gives is TRIP VOLUME at the long horizons: a
     *  backed family's net fare rises a few percent, the affordability-gated policy books fewer
     *  international weeks (self-coached grinder j30 entries 55 -> 45 over 14->20, covered travel
     *  mean $7.5k -> $5.7k), and the points-denominated reach proxy softens with it (worst working
     *  cell 24 -> 16 of 30 at 14->18). Flagged in the round-15 report for the owner's call rather
     *  than smoothed over: it is the intended lever doing exactly its arithmetic, at a size he may
     *  or may not want. If a future pass lowers the ceiling further, run this same arm first. */
```
