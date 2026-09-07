// ⭐⭐ WHICH SKILLS AGE, AND HOW FAST RELATIVE TO EACH OTHER – round 38 #6c.
//
// The owner, 07.09: «может быть и навыки могут деградировать, это вполне ок, надо только подумать
// какие и с какой скоростью» – and, on the four weights: «веса ок, строй и меряй пожалуйста».
//
// ⚠⚠ THE INVARIANT THIS FILE EXISTS FOR IS THE NORMALISATION, not the four numbers. Everything
// downstream of ageing reads `physicalMean(skills) / peakPhysical` – the last off-season offer, the
// recovery corridor, the coach's ceiling read – and the weights are safe ONLY because their
// normalised mean is exactly 1. The four raw values are calibration and belong in
// docs/specs/what-ages-first-2026-09.md; a test that pinned them would go red on the next honest
// retune and teach nothing.
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { PHYSICAL_SKILL_KEYS, SKILL_KEYS, ageWeightOf, isPhysicalSkill } from '../src/engine/development'

describe('round 38 #6c – the weights are normalised, by construction', () => {
  it('⚠⚠ the normalised weights have a mean of EXACTLY 1 over the physical keys', () => {
    let total = 0
    for (const k of PHYSICAL_SKILL_KEYS) total += ageWeightOf(k)
    expect(total / PHYSICAL_SKILL_KEYS.length).toBeCloseTo(1, 12)
  })

  it('⚠ MUTATION ARM – editing ONE raw weight re-bases the others instead of speeding the decline up', () => {
    const raw = ECONOMY.development.ageWeight as Record<string, number>
    const kept = raw.serve
    raw.serve = kept! * 4
    try {
      let total = 0
      for (const k of PHYSICAL_SKILL_KEYS) total += ageWeightOf(k)
      // the mean is STILL 1 – which is the property. The shape moved; the overall rate did not.
      expect(total / PHYSICAL_SKILL_KEYS.length).toBeCloseTo(1, 12)
      // ...and the serve is now the FASTEST rather than the slowest, so the arm is not vacuous.
      expect(ageWeightOf('serve')).toBeGreaterThan(ageWeightOf('stamina'))
    } finally {
      raw.serve = kept!
    }
  })

  it('every key in the constant is a real skill – the check `Record<string, number>` gives up', () => {
    for (const k of Object.keys(ECONOMY.development.ageWeight)) {
      expect(SKILL_KEYS as readonly string[], `"${k}" is not a skill`).toContain(k)
      expect(isPhysicalSkill(k as never), `"${k}" does not decline, so a weight on it is inert`).toBe(true)
    }
  })

  it('an attribute with no row declines ORDINARILY rather than not at all', () => {
    // The fallback is a raw 1, not 0. A fifth physical skill appended to SKILL_KEYS without a row
    // here must age like the others, never be frozen young.
    const raw = ECONOMY.development.ageWeight as Record<string, number>
    const kept = raw.groundstrokes
    delete raw.groundstrokes
    try {
      expect(ageWeightOf('groundstrokes')).toBeGreaterThan(0)
    } finally {
      raw.groundstrokes = kept!
    }
  })
})

describe('round 38 #6c – the shape it is FOR', () => {
  it('the serve outlives the legs, which is the whole claim', () => {
    expect(ageWeightOf('serve')).toBeLessThan(ageWeightOf('groundstrokes'))
    expect(ageWeightOf('groundstrokes')).toBeLessThan(ageWeightOf('ret'))
    expect(ageWeightOf('ret')).toBeLessThan(ageWeightOf('stamina'))
  })

  it('⚠ composure is not in it, and would be inert if it were', () => {
    expect(Object.keys(ECONOMY.development.ageWeight)).not.toContain('composure')
    expect(isPhysicalSkill('composure')).toBe(false)
  })
})
