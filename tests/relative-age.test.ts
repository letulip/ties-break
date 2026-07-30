// =================================================================================================
// TASK 55 — THE RELATIVE AGE EFFECT (engine/development.ts relativeAgeYears)
// =================================================================================================
//
// The owner, 30.07, on whether `birthMonth` earns its keep or comes out: «можно оставить и как раз вместе
// с №70 здесь же сделать.» Kept, and wired inside the load wave as he asked.
//
// WHAT IS PINNED HERE:
//   1. THE MODEL IS A CLOCK, NOT A PENALTY. Symmetric about the band's median month, so a random
//      population is unbiased - the effect redistributes development timing inside a year rather than
//      adding or removing any. A one-sided version would be a stealth difficulty knob.
//   2. IT REALLY REACHES HER DEVELOPMENT. A January girl and a December girl on the SAME SEED must end a
//      junior career at different skill levels, or the whole task is a comment.
//   3. ⚠ IT IS TWO HALVES, AND THE FIRST DRAFT ONLY HAD THE WRONG ONE. The ADVANTAGE is a head start in
//      level (`relativeAgeHeadStart`); the CATCH-UP is the rate shift, which points the other way on
//      purpose because `ageFactor` decreases with age. Shipping the rate shift alone inverted the whole
//      effect and looked fine doing it - so both signs are pinned, not just the magnitudes.
//   3b. AND THE CEILING IS UNTOUCHED. A timing effect must never become a talent effect.
//   4. NO NEW DRAW, and the frozen MAIN capture cannot move.
//   5. THE SCHOOL TILE'S STANDING NOTE STAYS TRUE - kidLife.ts has claimed since it shipped that
//      `relativeAge(birthMonth) = (12 - birthMonth) / 12` "keeps meaning exactly what it means today".
import { describe, expect, it } from 'vitest'
import {
  ageFactor,
  relativeAgeHeadStart,
  relativeAgeYears,
  SKILL_KEYS,
  SKILL_POINTS_PER_YEAR,
} from '../src/engine/development'
import {
  closeTournament,
  createWorld,
  decideKnock,
  pendingKnock,
  skipTournament,
  tickWeek,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

/** Her total skill after `weeks`, born in `birthMonth`. Everything else identical, including the seed. */
function levelAfter(seed: string, birthMonth: number, weeks: number): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, coachTier: 'self', background: 'wealthy' })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  return SKILL_KEYS.reduce((s, k) => s + world.skills[k], 0)
}

describe('task 55 — the relative age effect', () => {
  it('⚠ SYMMETRIC: a random population of birth months is unbiased', () => {
    // The property that makes this a clock rather than a difficulty knob. If the twelve offsets did not
    // sum to zero, every career in the game would have been quietly made easier or harder.
    const all = [...Array(12).keys()].map((i) => relativeAgeYears(i + 1))
    expect(all.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 10)
    // January is the oldest in her band, December the youngest, and the ends mirror each other
    expect(relativeAgeYears(1)).toBeCloseTo(0.4583, 3)
    expect(relativeAgeYears(12)).toBeCloseTo(-0.4583, 3)
    expect(relativeAgeYears(1)).toBeCloseTo(-relativeAgeYears(12), 10)
    // monotone: every later month is younger than the one before
    for (let m = 2; m <= 12; m++) expect(relativeAgeYears(m)).toBeLessThan(relativeAgeYears(m - 1))
  })

  it('total and safe on rubbish input – it reads a persisted field', () => {
    // `birthMonth` comes off a save written by onboarding, which is a `<select>`, but the field has been
    // persisted since v10 and a clamp costs nothing.
    for (const bad of [0, -3, 13, 99, 6.4]) {
      const v = relativeAgeYears(bad)
      expect(Number.isFinite(v), `${bad}`).toBe(true)
      expect(Math.abs(v)).toBeLessThanOrEqual(0.46)
    }
  })

  it('⚠ IT REALLY REACHES HER DEVELOPMENT: same seed, same everything, different birthday', () => {
    // Two seeds, so this cannot be one lucky career. The January girl is developmentally ~11 months
    // ahead of the December one inside the same band, and at 14-16 that is the steep part of the curve.
    for (const seed of ['ra-1', 'ra-2']) {
      const jan = levelAfter(seed, 1, 104)
      const dec = levelAfter(seed, 12, 104)
      expect(jan, `${seed}: an older-in-band girl must be ahead at 16`).toBeGreaterThan(dec)
    }
  })

  it('⚠ THE HEAD START IS THE ADVANTAGE, and it is priced off a measured number', () => {
    // The half I got wrong first: the effect is a LEVEL, not a slope. See development.ts's own note.
    expect(relativeAgeHeadStart(1)).toBeGreaterThan(0)
    expect(relativeAgeHeadStart(12)).toBeLessThan(0)
    // eleven months apart, at ~2.4 points a year, is ~2.2 points of every attribute
    expect(relativeAgeHeadStart(1) - relativeAgeHeadStart(12)).toBeCloseTo(0.9167 * SKILL_POINTS_PER_YEAR, 3)
    // ...and it really lands on the world she starts in
    const jan = createWorld('ra-start', { ...DEFAULT_PROFILE, birthMonth: 1 })
    const dec = createWorld('ra-start', { ...DEFAULT_PROFILE, birthMonth: 12 })
    for (const k of SKILL_KEYS) expect(jan.skills[k], k).toBeGreaterThan(dec.skills[k])
  })

  it('⚠ AND THE RATE SHIFT IS THE CATCH-UP, pointing the other way ON PURPOSE', () => {
    // `ageFactor` DECREASES with age, so the YOUNGER girl gains marginally faster - which is what closes
    // the gap and why the effect is a junior one. Getting this backwards is exactly the bug that shipped
    // in my first draft (the shift alone, no head start), so the SIGN is pinned rather than the magnitude.
    const rateGap = (age: number) => ageFactor(age + relativeAgeYears(1)) - ageFactor(age + relativeAgeYears(12))
    expect(rateGap(14), 'the older girl must not ALSO gain faster - that would be a talent effect').toBeLessThan(0)
    expect(Math.abs(rateGap(14)), 'and the catch-up is gentle, not a second mechanic').toBeLessThan(0.01)
    expect(rateGap(25), 'gone at the plateau, where age stops mattering').toBeCloseTo(0, 10)
  })

  it('⚠ THE CEILING IS UNTOUCHED – a timing effect must not become a talent effect', () => {
    // `rollPotential` is fed the BIRTH build, so the January girl starts closer to the same ceiling rather
    // than getting a higher one. If this ever flips, being born in January makes her a better player
    // forever, which is not what the relative age effect is.
    const jan = createWorld('ra-ceiling', { ...DEFAULT_PROFILE, birthMonth: 1 })
    const dec = createWorld('ra-ceiling', { ...DEFAULT_PROFILE, birthMonth: 12 })
    for (const k of SKILL_KEYS) expect(jan.potential[k], k).toBeCloseTo(dec.potential[k], 10)
  })

  it('the school tile and the development clock agree about who is older', () => {
    // kidLife.ts's standing note: «its `relativeAge(birthMonth) = (12 - birthMonth) / 12` keeps meaning
    // exactly what it means today». That expression is this one plus a constant, so the ORDER the two
    // surfaces put the twelve months in must be identical - otherwise screen C could call her the oldest
    // in her class while the engine develops her as the youngest in her band.
    const kidLifeStyle = (m: number) => (12 - m) / 12
    for (let m = 2; m <= 12; m++) {
      const engineOlder = relativeAgeYears(m - 1) > relativeAgeYears(m)
      const tileOlder = kidLifeStyle(m - 1) > kidLifeStyle(m)
      expect(engineOlder, `month ${m}`).toBe(tileOlder)
    }
    // ...and they differ by exactly a constant, which is the claim the note makes
    const deltas = [...Array(12).keys()].map((i) => kidLifeStyle(i + 1) - relativeAgeYears(i + 1))
    for (const d of deltas) expect(d).toBeCloseTo(deltas[0], 10)
  })

  it('adds NO draw – the growth generator keeps its key, only the age it is handed moves', () => {
    // The frozen capture is re-proved in tests/knock.test.ts and tests/condition.test.ts; what belongs here
    // is the narrower claim that this slice is a pure input change. Same seed, two birthdays, and the
    // number of MAIN draws must be identical even though the skills differ.
    const drawsFor = (birthMonth: number) => {
      const world = createWorld('ra-draws', { ...DEFAULT_PROFILE, birthMonth, coachTier: 'self' })
      const base = rngFromSeed(world.seed)
      let n = 0
      const rng = () => {
        n++
        return base()
      }
      for (let w = 0; w < 52; w++) {
        tickWeek(world, rng)
        if (pendingKnock(world)) decideKnock(world, 'rest')
      }
      return n
    }
    expect(drawsFor(1)).toBe(drawsFor(12))
  })
})
