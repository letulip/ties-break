// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/travelBgFactor.md#the-travelbgfactor-block

import { WEALTH_CORRIDOR } from './wealthCorridor'

// Travel scales with family means (wealthier travel = pricier + a money-sink; poorer =
// cheaper), and the owner wants the price to sit in a CORRIDOR for every trip, not on a fixed
// multiplier. A per-event uniform roll (from a purpose-scoped sub-stream keyed by the event –
// see calendar.ts) maps into the band: `factor = lo + roll * (hi - lo)`.
// → docs/notes/economy/travelBgFactor.md#travelbgfactor
export const travelBgFactor = WEALTH_CORRIDOR
