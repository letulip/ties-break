import { describe, it, expect } from 'vitest'
import { generateCohort, driftCohort, makeJunior, power } from '../../src/engine/season/cohort'
import { RIVAL_GS_SPREAD, rivalGroundstrokes, rivalGroundstrokePotential } from '../../src/engine/season/rival'
import { relativeAgeHeadStart } from '../../src/engine/development'
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
    // ⚠ RE-AIMED BY TASK 55's COHORT HALF, AND SPLIT INTO THE TWO FACTS IT WAS CONFLATING. `generateCohort`
    // now applies a birth-month head start AFTER the draws (`applyRelativeAge`), so a December junior
    // generated on the floor lands just under it - measured, 29.7 against a floor of 30. That is correct: the
    // band describes what the GENERATOR produces, and where she sits inside her own year is a later,
    // separate fact about her. The old assertion could not tell those apart.
    //
    // So the generator's contract is checked on the BIRTH BUILD, exactly as strictly as before, and the
    // shipped value is checked against the band widened by the most a birthday can move it. Both halves are
    // now guarded where they were one loose one.
    const maxBump = Math.abs(relativeAgeHeadStart(1))
    expect(maxBump, 'a birthday must not be able to move a junior far').toBeLessThan(1.5)
    const inBand = (v: number, lo: number, hi: number, what: string) => {
      expect(v, `${what} under ${lo}`).toBeGreaterThanOrEqual(lo)
      expect(v, `${what} over ${hi}`).toBeLessThanOrEqual(hi)
    }
    // 1. THE GENERATOR, untouched by birthdays - the fact this test has always been about.
    const rng = rngFromSeed('bands')
    for (let i = 0; i < 199; i++) {
      const p = makeJunior(rng, `ai-${i}`)
      inBand(p.serve, 30, 60, `${p.id} serve`)
      inBand(p.ret, 30, 60, `${p.id} ret`)
      inBand(p.composure, 25, 70, `${p.id} composure`)
      inBand(p.stamina, 30, 70, `${p.id} stamina`)
      inBand(p.growth, 0.5, 1.5, `${p.id} growth`)
    }
    // 2. THE SHIPPED FIELD: the same bands, widened by at most one birthday's worth. `growth` is not
    //    touched by a birth month at all, so it keeps the exact band.
    for (const p of generateCohort('bands', 199)) {
      inBand(p.serve, 30 - maxBump, 60 + maxBump, `${p.id} serve`)
      inBand(p.ret, 30 - maxBump, 60 + maxBump, `${p.id} ret`)
      inBand(p.composure, 25 - maxBump, 70 + maxBump, `${p.id} composure`)
      inBand(p.stamina, 30 - maxBump, 70 + maxBump, `${p.id} stamina`)
      inBand(p.growth, 0.5, 1.5, `${p.id} growth`)
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

describe('driftCohort — development, bounded by a ceiling and an age', () => {
  it('a week can never take more than the headroom, and never leaves [0, 100]', () => {
    // ⚠ RE-AIMED at v20. The old bound was `0..0.05*growth`, a flat step with no ceiling - which is
    // exactly the thing that made the field a rising tide: about 1.5 a year, for ever, so no career
    // could catch the ladder. The bound now is the one that matters: a week takes a SHARE of the
    // distance still to go, so nobody can pass her own limit, however long the save runs.
    const cohort = generateCohort('drift', 60)
    const before = clone(cohort)
    driftCohort(cohort, rngFromSeed('drift-week'))
    for (let i = 0; i < cohort.length; i++) {
      const b = before[i]
      const a = cohort[i]
      for (const k of ['serve', 'ret', 'composure', 'stamina'] as const) {
        const delta = a[k] - b[k]
        const headroom = Math.max(0, b.potential[k] - b[k])
        // A growing player gains at most her whole headroom; a declining one only ever loses.
        expect(delta, `${k} delta`).toBeLessThanOrEqual(headroom + 1e-9)
        if (b.ageYears < 29) expect(delta, `${k} delta`).toBeGreaterThanOrEqual(-1e-9)
        expect(a[k]).toBeGreaterThanOrEqual(0)
        expect(a[k]).toBeLessThanOrEqual(100)
      }
      expect(a.growth).toBe(b.growth) // growth itself does not drift
      expect(a.ageYears).toBe(b.ageYears) // ...and a WEEK does not age anybody
      expect(a.potential).toEqual(b.potential) // ...nor move a ceiling
    }
  })

  it('a ceiling is a ceiling: a century of weeks never passes it', () => {
    // The property the old flat step could not have, stated the only way worth stating it.
    const cohort = generateCohort('ceiling', 40)
    const ceilings = clone(cohort).map((p) => ({ ...p.potential }))
    for (let w = 0; w < 520; w++) driftCohort(cohort, rngFromSeed(`ceil-${w}`))
    for (let i = 0; i < cohort.length; i++) {
      for (const k of ['serve', 'ret', 'composure', 'stamina'] as const) {
        expect(cohort[i][k], `${cohort[i].id}.${k}`).toBeLessThanOrEqual(ceilings[i][k] + 1e-9)
      }
    }
  })

  it('past the peak the body goes and the head does not', () => {
    const cohort = generateCohort('veteran', 12)
    for (const p of cohort) p.ageYears = 33
    const before = clone(cohort)
    for (let w = 0; w < 52; w++) driftCohort(cohort, rngFromSeed(`vet-${w}`))
    for (let i = 0; i < cohort.length; i++) {
      expect(cohort[i].serve, 'serve').toBeLessThan(before[i].serve)
      expect(cohort[i].stamina, 'stamina').toBeLessThan(before[i].stamina)
      expect(cohort[i].composure, 'composure').toBeGreaterThanOrEqual(before[i].composure)
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

// =================================================================================================
// THE FIFTH AXIS, ROUND 22 – a rival's groundstroke is HERS, and it develops toward a ceiling
// =================================================================================================
//
// Owner: «ты же вроде сделал хорошую формулу для него [power()]. Мне кажется надо на нее опираться,
// тогда у всех появится аналог пятого навыка».
//
// It used to be `(serve + ret) / 2 + offset(±RIVAL_GS_SPREAD)`, which failed that ask twice over: a
// rival could never sit more than the offset away from what her first-strike pair already said (so
// the cohort could not contain a groundstroke SPECIALIST – only the kid could specialise on the
// fifth axis), and it had no ceiling of its own to develop toward. It reads `mean(four) + offset`
// now, and `rivalGroundstrokePotential` is the same function fed her ceilings.
//
// These cases are written so the OLD formula fails them. Mutation-verified against it: reverting
// rival.ts turns the first two red, which is what makes the block worth its runtime.
describe('the fifth axis – a rival specialises off the ground, and grows into it', () => {
  const firstStrike = (p: AiPlayer): number => (p.serve + p.ret) / 2

  it('is not a restatement of serve and return: real specialists exist, both ways', () => {
    // THE CUT IS `RIVAL_GS_SPREAD` ITSELF, WHICH IS WHY THIS TEST CANNOT PASS ON THE OLD ANCHOR.
    // Under `(serve + ret) / 2 + offset` the deviation from the first-strike pair WAS the offset, so
    // |dev| > RIVAL_GS_SPREAD had probability zero for all 199 – not "rare", impossible. Measured on
    // the shipped anchor: 52-71 of 199 across five seeds (tools/fifth-skill-probe.ts). The bound is
    // set at 20, well under the measured floor, so it fails on a real regression and not on a seed.
    const cohort = generateCohort('bench-working-0')
    const devs = cohort.map((p) => rivalGroundstrokes(p) - firstStrike(p))
    expect(devs.filter((d) => d > RIVAL_GS_SPREAD).length).toBeGreaterThan(20)
    expect(devs.filter((d) => d < -RIVAL_GS_SPREAD).length).toBeGreaterThan(20)
  })

  it('develops toward a ceiling of its own, and a century of weeks never passes it', () => {
    const cohort = generateCohort('gs-ceiling', 60)
    // A ceiling is a property of the PLAYER, so it must not move while she develops – exactly what
    // `potential` promises for the other four (the block above pins that).
    const ceilings = cohort.map(rivalGroundstrokePotential)
    const start = cohort.map(rivalGroundstrokes)
    for (let i = 0; i < cohort.length; i++) {
      expect(start[i], `${cohort[i].id} starts under her ceiling`).toBeLessThanOrEqual(ceilings[i] + 1e-9)
    }
    for (let w = 0; w < 520; w++) driftCohort(cohort, rngFromSeed(`gs-ceil-${w}`))
    let climbed = 0
    for (let i = 0; i < cohort.length; i++) {
      const now = rivalGroundstrokes(cohort[i])
      expect(rivalGroundstrokePotential(cohort[i]), `${cohort[i].id} ceiling moved`).toBeCloseTo(ceilings[i], 12)
      expect(now, `${cohort[i].id} passed her ceiling`).toBeLessThanOrEqual(ceilings[i] + 1e-9)
      if (now > start[i] + 1e-9) climbed++
    }
    // ...and it really is DEVELOPMENT and not a fixed number: the old formula grew only because
    // serve/ret did, and had nothing to arrive at. Ten years of weeks moves nearly everybody.
    expect(climbed).toBeGreaterThan(cohort.length / 2)
  })

  it('is personal: two rivals with identical attributes still hit differently', () => {
    // The offset is drawn off her own `gs:<id>` sub-stream, so it is hers and nobody else's – which
    // is what stops the axis collapsing into a deterministic function of the other four.
    const rng = rngFromSeed('twins')
    const a = makeJunior(rng, 'ai-twin-a', 14)
    const b: AiPlayer = { ...a, id: 'ai-twin-b', potential: { ...a.potential } }
    expect(rivalGroundstrokes(a)).not.toBeCloseTo(rivalGroundstrokes(b), 6)
    // ...and `power()` carries exactly one fifth of that difference through – no more, because the
    // fifth term no longer re-states serve/ret on top of its own content (see cohort.ts's note).
    expect(power(a) - power(b)).toBeCloseTo((rivalGroundstrokes(a) - rivalGroundstrokes(b)) / 5, 12)
  })

  it('costs the MAIN stream nothing: driftCohort still spends exactly four draws per rival', () => {
    // THE LAW THIS WHOLE DESIGN IS BUILT AROUND (season/types.ts's Omit note, tests/condition.test.ts
    // B1b). A fifth STORED attribute or a fifth ceiling in the cohort row would want a fifth weekly
    // draw and move the frozen MAIN capture; deriving both off `gs:<id>` costs nothing here.
    const cohort = generateCohort('draw-count', 10)
    let spent = 0
    const base = rngFromSeed('count')
    driftCohort(cohort, () => {
      spent++
      return base()
    })
    expect(spent).toBe(4 * cohort.length)
    // ...and neither derivation draws on a passed stream at all – they take no generator.
    for (const p of cohort) {
      rivalGroundstrokes(p)
      rivalGroundstrokePotential(p)
    }
    expect(spent).toBe(4 * cohort.length)
  })
})
