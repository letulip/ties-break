// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.

/** ⚠ THE BAND A UNIFORM TIER IS PRICED IN, AND IT IS A BAND RATHER THAN A SKIPPED MULTIPLY ON
 *  PURPOSE (round 41 P1). Every corridor customer in this engine spends ONE uniform roll mapped into
 *  `lo + roll * (hi - lo)`; with `lo === hi === 1` that roll is still spent and still lands on
 *  exactly 1.0, so a tier going uniform changes the ARITHMETIC and not the SHAPE of any sub-stream.
 *  Skipping the draw instead would shift `seed:coachbg:<week>` / `seed:physio:<week>` by one position
 *  for half the tier ladder – a stream change dressed as a price change, and the kind of thing
 *  invariant 2 exists to refuse. */
export const UNIFORM_CORRIDOR: [number, number] = [1, 1]
