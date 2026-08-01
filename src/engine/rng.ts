// Deterministic seeded RNG. The whole simulation must be reproducible from a seed:
// same seed -> same career. Never use Math.random() inside the engine.

export type Rng = () => number

// xmur3 string hash -> 32-bit seeds for mulberry32
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

export function mulberry32(a: number): Rng {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rngFromSeed(seed: string): Rng {
  return mulberry32(xmur3(seed)())
}

export function pickInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

// -------------------------------------------------------------------------------------------------
// THE PERSISTED MAIN POSITION (schema v35, docs/review/proposals/P3-rng-persistence.md).
//
// mulberry32's register advances by the CONSTANT below on every draw, whatever the output — look at
// the closure above: `a = (a + 0x6d2b79f5) | 0` is the only write to `a`. So a stream position is
// completely described by the pair `{s, n}` — the register and how many draws produced it — and the
// two are REDUNDANT: s must equal (seed32 + n·C) mod 2³², always. That redundancy is the whole
// integrity story for the persisted position: corrupt either field and `mainStateConsistent` fails
// with probability ~1−2⁻³², no separate checksum needed.
//
// ⚠ THE REGISTER IS STORED SIGNED (int32). xmur3 hands out an UNSIGNED word (`h >>> 0`) but
// mulberry32's first act is `a |= 0`, so the arithmetic the stream actually lives in is signed
// int32 space. `initMainState` normalises with `| 0` at birth so the s/n algebra never has to
// carry an unsigned first element as a special case — the one subtlety in this file, and the kind
// that would otherwise surface years later as "a fresh save fails its own consistency check".
//
// ⚠ DO NOT TOUCH `mulberry32`/`xmur3`/`rngFromSeed` THEMSELVES. `resumeMain` re-states mulberry32's
// arithmetic over an external register on purpose: the closure above owns a private `a` that cannot
// be read back out, and every byte of every existing stream depends on that arithmetic staying
// exactly as it is. The equivalence suite in tests/rng.test.ts pins the two implementations to each
// other; if they ever drift apart it goes red before a save is written under the wrong algebra.
// -------------------------------------------------------------------------------------------------

/** mulberry32's per-draw register step. Named here once; the algebra in `mainStateConsistent`
 *  and the inlined step in `resumeMain` must be the same number or nothing above holds. */
const MULBERRY_STEP = 0x6d2b79f5

/** The MAIN stream's persisted position: register + cumulative draw count (schema v35).
 *  Two JSON numbers on WorldState — see `WorldState.rngMain`. Sub-streams have no state to
 *  persist: every one is derived fresh at its call site from a purpose-scoped seed string. */
export interface MainRngState {
  s: number
  n: number
}

/** Position zero for a seed: the register rngFromSeed would start from (signed), zero draws. */
export function initMainState(seed: string): MainRngState {
  return { s: xmur3(seed)() | 0, n: 0 }
}

/** A generator that continues the MAIN stream from `st` and MUTATES `st` in place on every draw —
 *  which is the anti-desync design in one line: the world object carries the position, the
 *  generator writes it back as it goes, and whatever autosaves the world persists the true
 *  position by construction. Byte-identical to mulberry32 resumed at the same register
 *  (test-proved in tests/rng.test.ts). */
export function resumeMain(st: MainRngState): Rng {
  return () => {
    st.s = ((st.s | 0) + MULBERRY_STEP) | 0
    st.n += 1
    let t = Math.imul(st.s ^ (st.s >>> 15), 1 | st.s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The redundancy check: does the register sit exactly n constant-steps from this seed's origin?
 *  `n` must be a non-negative integer — the modular algebra alone would let a negative or
 *  fractional count masquerade as a valid position, and both can only mean corruption. */
export function mainStateConsistent(seed: string, st: MainRngState): boolean {
  if (typeof st.s !== 'number' || !Number.isInteger(st.n) || st.n < 0) return false
  return st.s === (((xmur3(seed)() | 0) + Math.imul(st.n, MULBERRY_STEP)) | 0)
}
