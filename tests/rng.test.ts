import { describe, it, expect } from 'vitest'
import { rngFromSeed, pickInt, initMainState, resumeMain, mainStateConsistent, type MainRngState } from '../src/engine/rng'

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = rngFromSeed('serena')
    const b = rngFromSeed('serena')
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b())
  })

  it('differs across seeds', () => {
    const a = rngFromSeed('serena')
    const b = rngFromSeed('venus')
    const same = Array.from({ length: 100 }, () => a() === b()).filter(Boolean).length
    expect(same).toBeLessThan(5)
  })

  it('stays in [0, 1) with a sane mean', () => {
    const rng = rngFromSeed('calibration')
    let sum = 0
    for (let i = 0; i < 100_000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      sum += v
    }
    expect(sum / 100_000).toBeGreaterThan(0.49)
    expect(sum / 100_000).toBeLessThan(0.51)
  })

  it('pickInt covers the whole inclusive range', () => {
    const rng = rngFromSeed('range')
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) seen.add(pickInt(rng, 1, 6))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})

// =================================================================================================
// v35 — THE PERSISTED MAIN POSITION (docs/review/proposals/P3-rng-persistence.md).
//
// The whole feature rests on one algebraic fact about mulberry32: the register advances by the
// CONSTANT 0x6d2b79f5 on every draw, independent of the output — so `{s, n}` (register + draw
// count) is a complete, self-checking description of a stream position, and a generator resumed
// from a saved `s` continues byte-identically to a straight run. These tests are the fact's pin:
// if anyone ever swaps the PRNG or perturbs its step, everything below goes loudly red before a
// single save is written under the wrong algebra.
// =================================================================================================
describe('rng — persisted MAIN position (v35)', () => {
  const SEEDS = ['serena', 'bench-working-0', 'naomi', 'x', 'a much longer seed string 42']
  const SPLITS = [0, 1, 7, 100, 1000]

  it('resume equivalence: draw k, JSON-round-trip the state, resume — equals a straight run', () => {
    for (const seed of SEEDS) {
      for (const k of SPLITS) {
        const straight = rngFromSeed(seed)
        const st = initMainState(seed)
        const first = resumeMain(st)
        for (let i = 0; i < k; i++) first()
        // The save/load boundary itself: the state must survive JSON exactly.
        const revived = JSON.parse(JSON.stringify(st)) as MainRngState
        expect(revived).toEqual(st)
        const second = resumeMain(revived)
        for (let i = 0; i < k; i++) straight()
        for (let i = 0; i < 200; i++) {
          expect(second(), `${seed} split ${k} draw ${i}`).toBe(straight())
        }
      }
    }
  })

  it('resumeMain mutates the state in place: n counts every draw, s rides the register', () => {
    const st = initMainState('serena')
    const rng = resumeMain(st)
    expect(st.n).toBe(0)
    for (let i = 1; i <= 50; i++) {
      rng()
      expect(st.n).toBe(i)
      expect(mainStateConsistent('serena', st)).toBe(true)
    }
  })

  it('mainStateConsistent holds after any number of draws and fails on a perturbed s or n', () => {
    for (const seed of SEEDS) {
      const st = initMainState(seed)
      const rng = resumeMain(st)
      expect(mainStateConsistent(seed, st)).toBe(true)
      for (const k of [1, 10, 500]) {
        for (let i = 0; i < k; i++) rng()
        expect(mainStateConsistent(seed, st)).toBe(true)
        // The redundancy IS the checksum: either field off by one breaks the pair.
        expect(mainStateConsistent(seed, { s: (st.s + 1) | 0, n: st.n })).toBe(false)
        expect(mainStateConsistent(seed, { s: st.s, n: st.n + 1 })).toBe(false)
        expect(mainStateConsistent(seed, { s: st.s, n: st.n - 1 })).toBe(false)
      }
      // ...and the wrong seed's register never passes as this seed's.
      expect(mainStateConsistent(seed === 'serena' ? 'venus' : 'serena', st)).toBe(false)
      // Garbage shapes are inconsistent, not crashes.
      expect(mainStateConsistent(seed, { s: st.s, n: 0.5 })).toBe(false)
      expect(mainStateConsistent(seed, { s: st.s, n: -1 })).toBe(false)
      expect(mainStateConsistent(seed, { s: Number.NaN, n: st.n })).toBe(false)
    }
  })

  it('initMainState locks the xmur3 coupling: a fresh state IS rngFromSeed at position zero', () => {
    for (const seed of SEEDS) {
      const st = initMainState(seed)
      expect(st.n).toBe(0)
      // The register is stored SIGNED (int32), exactly the space mulberry32's `a |= 0` works in —
      // so the s/n algebra never has to reason about an unsigned first element.
      expect(st.s).toBe(st.s | 0)
      // Behavioural coupling pin: the first draws of a resumed fresh state are rngFromSeed's.
      const a = resumeMain(st)
      const b = rngFromSeed(seed)
      for (let i = 0; i < 100; i++) expect(a()).toBe(b())
    }
  })
})
