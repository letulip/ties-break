import { describe, it, expect } from 'vitest'
import { rngFromSeed, pickInt } from '../src/engine/rng'

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
