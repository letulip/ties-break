import { describe, it, expect } from 'vitest'
import { generateCohort, driftCohort } from '../../src/engine/season/cohort'
import { rngFromSeed } from '../../src/engine/rng'
import type { AiPlayer } from '../../src/engine/season/types'

function clone(c: AiPlayer[]): AiPlayer[] {
  return c.map((p) => ({ ...p }))
}

describe('generateCohort — determinism', () => {
  it('same seed produces a deep-equal cohort', () => {
    expect(generateCohort('cohort-1')).toEqual(generateCohort('cohort-1'))
  })

  it('a different seed produces a different cohort', () => {
    expect(generateCohort('cohort-A')).not.toEqual(generateCohort('cohort-B'))
  })

  it('defaults to 199 members and honours an explicit size', () => {
    expect(generateCohort('sz').length).toBe(199)
    expect(generateCohort('sz', 40).length).toBe(40)
  })

  it('every player has a unique id and a two-part name', () => {
    const ids = new Set<string>()
    for (const p of generateCohort('names')) {
      expect(p.id).toBeTruthy()
      ids.add(p.id)
      expect(p.name.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2)
    }
    expect(ids.size).toBe(199)
  })
})

describe('generateCohort — age-14 skill bands', () => {
  it('keeps every skill and growth inside the spec bands', () => {
    for (const p of generateCohort('bands', 199)) {
      expect(p.serve).toBeGreaterThanOrEqual(30)
      expect(p.serve).toBeLessThanOrEqual(60)
      expect(p.ret).toBeGreaterThanOrEqual(30)
      expect(p.ret).toBeLessThanOrEqual(60)
      expect(p.composure).toBeGreaterThanOrEqual(25)
      expect(p.composure).toBeLessThanOrEqual(70)
      expect(p.stamina).toBeGreaterThanOrEqual(30)
      expect(p.stamina).toBeLessThanOrEqual(70)
      expect(p.growth).toBeGreaterThanOrEqual(0.5)
      expect(p.growth).toBeLessThanOrEqual(1.5)
    }
  })

  it('nations are ISO-2 codes and cover several distinct tennis countries', () => {
    const nations = new Set<string>()
    for (const p of generateCohort('nations', 199)) {
      expect(p.nation).toMatch(/^[A-Z]{2}$/)
      nations.add(p.nation)
    }
    expect(nations.size).toBeGreaterThan(6)
  })
})

describe('driftCohort — bounded weekly drift', () => {
  it('nudges every skill by 0..0.05*growth and never leaves [0, 100]', () => {
    const cohort = generateCohort('drift', 60)
    const before = clone(cohort)
    driftCohort(cohort, rngFromSeed('drift-week'))
    for (let i = 0; i < cohort.length; i++) {
      const b = before[i]
      const a = cohort[i]
      for (const k of ['serve', 'ret', 'composure', 'stamina'] as const) {
        const delta = a[k] - b[k]
        expect(delta).toBeGreaterThanOrEqual(0)
        expect(delta).toBeLessThanOrEqual(0.05 * b.growth + 1e-9)
        expect(a[k]).toBeGreaterThanOrEqual(0)
        expect(a[k]).toBeLessThanOrEqual(100)
      }
      expect(a.growth).toBe(b.growth) // growth itself does not drift
    }
  })

  it('is deterministic given the same rng seed', () => {
    const c1 = generateCohort('det', 30)
    const c2 = generateCohort('det', 30)
    driftCohort(c1, rngFromSeed('same'))
    driftCohort(c2, rngFromSeed('same'))
    expect(c1).toEqual(c2)
  })

  it('clamps at 100 for a maxed skill', () => {
    const cohort = generateCohort('clamp', 5)
    for (const p of cohort) p.serve = 100
    driftCohort(cohort, rngFromSeed('w'))
    for (const p of cohort) expect(p.serve).toBe(100)
  })
})
