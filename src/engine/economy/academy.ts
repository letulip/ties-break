// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/academy.md#the-academy-block

import type { FamilyBackground } from '../../shared/protocol'

// THE ACADEMY SCHOLARSHIP (see engine/academy.ts for the whole argument). Reviewed once a year at
// the season boundary; the level is continuous, so every knob below scales rather than switches.
export const academy = {
  /** Junior support only. She is 14 at week 0, so the earliest possible offer is the review that
   *  makes her 15, and the scholarship ends when she turns 19 – which is when junior tennis ends. */
  ageBand: [13, 18] as [number, number],
  /** Rank at review that reads as "a prospect, no argument" – full marks on the results half. */
  rankFull: 40,
  /** ...and the rank at which the results half is worth nothing. Sized to a ~200-strong field
   *  where a career that never scores sits at the tie floor around #120. */
  rankNone: 130,
  /** Where the population's ceilings actually lie (measured: p10 56, p50 62, p90 69), so the
   *  scout's half spans the real distribution instead of saturating at one end. */
  ceilingBand: [56, 70] as [number, number],
  /** How much of the verdict is the scout's eye vs her results. Half and half: results make the
   *  scholarship something to play for, the eye is why a poor 15-year-old gets looked at at all. */
  scoutWeight: 0.5,
  /** Need, and need alone, decides how much of that talent is worth backing. Wealthy is 0 –
   *  a family that can pay, pays. */
  needFactor: { working: 1, middle: 0.6, wealthy: 0 } as Record<FamilyBackground, number>,
  /** Tournaments in the last 52 weeks below which the academy passes: they fund players, not
   *  prospects. Deliberately low – the seasons she cannot afford to travel are exactly the ones
   *  this is meant to rescue, so the gate must not become "you need money to get money". */
  minEventsPerYear: 3,
  /** Below this the academy writes no letter at all. Stops a dribble of $12 scholarships. */
  minLevel: 0.15,
  /** Share of a travel bill covered at level 1. Travel is the bill that breaks the family (bench:
   *  $18k over 14→18 for the working preset, against a $5.7k horizon deficit), so it is the one
   *  this pays.
   *
   *  ⚠ academy.travelCover: 0.8 -> 0.75 (R15-7, owner 01.08: «потолок скидки на поездки можно и по-меньше сделать может быть немного»).
   *  → docs/notes/economy/academy.md#academytravelcover
   */
  travelCover: 0.75,
  /** The kit grant at each review she is supported through, at level 1 – "и экипа". Paid as
   *  money rather than as a gear discount because it arrives once a year, not per purchase. */
  kitCentsAtFull: 900_00,
} as const
