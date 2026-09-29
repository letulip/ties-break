// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/parentIncomeCents.md#the-parentincomecents-block

import type { FamilyBackground } from '../../shared/protocol'

// Weekly parent contribution to the war chest, by family background. Emitted as an `income`
// event BEFORE costs each week; NO rng draw. TUNED (round-7 economy pass) so that an
// UNSPONSORED kid (rank > 30 all year, no tournaments) lands the owner's target 52-week
// net-burn bands: working $4.5–7k, middle $9–14k, wealthy $14–22k.
// → docs/notes/economy/parentIncomeCents.md#parentincomecents
export const parentIncomeCents = {
  wealthy: 750_00,
  middle: 425_00,
  working: 245_00,
} as Record<FamilyBackground, number>
