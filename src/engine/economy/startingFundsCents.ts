// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/startingFundsCents.md#the-startingfundscents-block

import type { FamilyBackground } from '../../shared/protocol'

/** ⭐ THE WAR CHEST THE FAMILY OPENS WITH, and the game's own three pictures of what a family
 *  HAS.
 *
 *  ⚠ startingFundsCents: MOVED HERE FROM world.ts BY ROUND 26 #4, AND NOTHING ELSE MOVED WITH IT.
 *  ⚠ startingFundsCents: AND IT IS THE ONLY HONEST SOURCE FOR "IS THIS FAMILY POOR".
 *  → docs/notes/economy/startingFundsCents.md#startingfundscents
 */
export const startingFundsCents = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
} as Record<FamilyBackground, number>
