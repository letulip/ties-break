---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The wealthCorridor block

The comment essays that stood above the `wealthCorridor` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `wealthCorridor`

```ts
// THE app-level wealth-price corridor (owner canon, 25.07): the same [lo, hi] factor band per
// family background prices travel (ECONOMY.travelBgFactor), every medical bill
// (ECONOMY.physio.medicalBgFactor) and the season planner's packages (vacationPriceCents /
// practiceFeeCents) – all of them reference this ONE object. Framing: working = public clinics /
// budget trips, middle = standard, wealthy = private everything. Retuned when real incomes (prize
// money) land – this constant is the single knob.
//
// ⚠⚠ THIS COMMENT SAID "COACHING LEFT THE CORRIDOR" AND HAD BEEN WRONG SINCE 29.07. That was the
// coach-tiers slice's FIRST model - the tier states the family's price level, so keeping the corridor
// would charge the difference twice - and the owner reversed it in Round 2 the same week
// («для 8к все тиры стоят согласно их коридору, для 25к – свои цены, для 120к стоят дороже всего»):
// the corridor is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The reversal landed
// in `coach.coachCorridorFactor` and in world.ts, and this line was never updated, so the one place a
// reader looks up what the corridor prices has been listing three customers where there are five.
//
// ITS REAL CUSTOMERS, all of them referencing this ONE object: travel, medical, the planner's
// packages, THE WEEKLY COACHING BILL (via `seed:coachbg:<week>` in resolveBaseCosts) and - since the
// bill split, docs/specs/split-the-bill-2026-08.md - the FACILITY line that came out of it. The last
// of those is the corridor at its most literal: the same court costs less in a working-class club
// than in a premium academy, and the family can now see the number.
//
// ⭐⭐⭐ AND SINCE ROUND 41 P1 IT HAS A CEILING: THE CORRIDOR PRICES THE LOWER TIERS OF A SERVICE AND
// STOPS. The owner, 12.09, ruling on the gear complaint and then narrowing the corridor himself:
// «Коридор ±25–30% остаётся только на сервисах (физио, перелёты, тренер) и то только на нижних
// тирах, мне кажется что в про карьере с большими чеками цены для всех должны быть равны. По крайней
// мере элит тренеры и массажисты мне кажется вполне могут стоить одинаково для всех.»
//
// So the framing above survives exactly where it was ever true – a working-class club and a premium
// academy really are two different rooms at the bottom of the market – and stops where it stops
// being a fiction: an elite coach's week and a tour clinic's hour are ONE product with ONE price,
// and a family that has reached them is in the big-cheque era he is describing. See
// `UNIFORM_CORRIDOR` and `coach.corridorAppliesAt` for the rungs, and
// docs/specs/one-market-2026-09.md §4 for what stays corridored and why.
```
