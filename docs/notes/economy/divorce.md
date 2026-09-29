---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The divorce block

The comment essays that stood above the `divorce` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `divorce`

```ts
  /** ⭐⭐⭐ v88 – THE PARTING (wave 12; `docs/specs/the-parting-2026-09.md` §4,
   *  `docs/plans/life-wave-12-builder-2026-09.md` §T2.1). The marriage `ECONOMY.wedding` started is
   *  the marriage this block ends, and it holds **four bond deltas and nothing else** – which is the
   *  shortest block in this file and is the wave's own boundary made structural.
   *
   *  ⚠⚠ NO MONEY, AND THE ABSENCE IS A RULING RATHER THAN AN OVERSIGHT. His wedding ruling of 18.09
   *  – «я думаю как с подарками, никто и нисколько» – extends to the parting by the spec's §2.4, so
   *  there is no `costCents`, no settlement, no claim and no ledger event anywhere in this wave. The
   *  design sketch's claim-beats stay a playtest-era option, unbuilt. A reader looking for the
   *  divorce's price will find this paragraph instead, which is the point.
   *
   *  ⚠⚠ NO HAZARD EITHER, AND THAT IS THE LOUDER ABSENCE. The ending's rate is
   *  `ECONOMY.life.endsPerWeek × endsMult[temperament] × ECONOMY.wedding.latchEndFactor` and it has
   *  been since v83 – SAME key, SAME uniform, SAME threshold. This wave changes zero draws (spec
   *  §9), so a `divorcePerWeek` row appearing here would be a second, silent hazard beside the one
   *  that actually fires.
   *
   *  ⚠ ⚠ **ALL FOUR NUMBERS ARE DRAFTS, AND THEY ARE DRAFTS OF A PARTICULAR KIND**: the spec's §4
   *  says «four answers modeled on the `'ended'` pool's shapes … whose drafted values mirror the
   *  ended deltas», so what is carried here is the SHAPE of `ECONOMY.bond.delta.ended*` (+3 / −3 /
   *  −1 / −4) under names of this block's own. Mirroring is the honest default for a card that is
   *  the same scene one rung up: it prices the parent's four moves exactly as the break-up card
   *  prices them, and leaves the question of whether a divorce should cost MORE to the owner, who
   *  has the shock row above to read it against. ⚠ THE BUILDER DID NOT INVENT A SPREAD – that would
   *  be a design decision wearing a constant (invariant 5), and the spec asked for a mirror. */
```
