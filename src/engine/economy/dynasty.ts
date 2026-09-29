// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/dynasty.md#the-dynasty-block

/** ⭐⭐⭐ THE DYNASTY (v86, wave 10 T3 – docs/specs/the-dynasty-2026-09.md §7). His ruling, 22.09:
 *  «наследственность темперамента – можно и забенчить, мне кажется».
 *
 *  ⚠ dynasty: ONE NUMBER AND ONE AXIS, and both halves of that are decisions.
 *  ⚠⚠ dynasty: IT RE-MAPS A DRAW AND NEVER ADDS ONE.
 *  ⚠ dynasty: DRAFTED AT 0.65 AND THE BENCH CONFIRMS IT (T7 §1, N=400, §8 row 1).
 *  → docs/notes/economy/dynasty.md#dynasty
 */
export const dynasty = {
  /** the chance a daughter takes her mother's openness pole; the rest takes the opposite */
  opennessLean: 0.65,
} as const
