// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/wealthCorridor.md#the-wealthcorridor-block

import type { FamilyBackground } from '../../shared/protocol'

// THE app-level wealth-price corridor (owner canon, 25.07): the same [lo, hi] factor band per
// family background prices travel (ECONOMY.travelBgFactor), every medical bill
// (ECONOMY.physio.medicalBgFactor) and the season planner's packages (vacationPriceCents /
// practiceFeeCents) – all of them reference this ONE object. Framing: working = public clinics
// / budget trips, middle = standard, wealthy = private everything.
//
// ⚠⚠ wealthCorridor: THIS COMMENT SAID "COACHING LEFT THE CORRIDOR" AND HAD BEEN WRONG SINCE 29.07.
// owner (wealthCorridor), 29.07: «для 8к все тиры стоят согласно их коридору, для 25к – свои цены, для 120к стоят дороже всего»
// owner (wealthCorridor), 12.09: «Коридор ±25–30% остаётся только на сервисах (физио, перелёты, тренер) и то только на нижних тирах»…
// → docs/notes/economy/wealthCorridor.md#wealthcorridor
export const WEALTH_CORRIDOR = {
  working: [0.7, 0.8],
  middle: [0.95, 1.05],
  wealthy: [1.2, 1.3],
} as Record<FamilyBackground, [number, number]>
