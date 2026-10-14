// ⭐⭐⭐ ROUND 52 F1 (14.10) – HER FEEL FOR THE COACH: the engine core. The owner: «я хочу сделать систему, что ребенок может
// намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь от ребенка для
// принятия решения в случае если химия не растет или незаметно». This file holds the PURE half and the world-level wrapper;
// the screens (the coach card's tile, the week notes, the small-talk copy) are later builders' and test their own.
//
// WHAT IT HOLDS:
//   A. the step table – every threshold edge of `coachFeelStep`, on the named constants
//   B. the too-early gate, and a score that is the stated blend (trend, level, the ramp between them, the doubt)
//   C. the doubt – constant inside a four-week period, redrawn across periods, bounded, purpose-scoped
//   D. ⭐ THE PROPERTY: she is CONFIDENT only when the coach card's gauge would show a figure of the same sign
//   E. the wrapper – null without a coach, the stint restarts on every hire, an absent pair reads chem 0, ZERO MAIN draws
//   F. the snapshot key – ABSENT (not null, not undefined) without a coach, present with one
//   G. the hunch mapping the small-talk hunch line reads (the line itself is tests/r51-coach-real-hunch.test.ts)
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real tree, RUN against this file, RED MEASURED, the file restored with its sha
// checked identical. The table is in docs/specs/the-chemistry-2026-09.md §17 (the run that produced it is the builder's report).
import { describe, it, expect } from 'vitest'
import {
  CHEMISTRY_HUNCH_COLD_AT,
  CHEMISTRY_HUNCH_WARM_AT,
  COACH_FEEL,
  COACH_FEEL_STEPS,
  affinityFor,
  chemistryDriftPerYear,
  chemistryReading,
  coachFeelJitter,
  coachFeelOf,
  coachFeelScore,
  coachFeelStep,
  feelHunch,
  type CoachPair,
} from '../src/engine/chemistry'
import { coachById } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, hireCoach, toSnapshot, type WorldState } from '../src/engine/world'
import { ageAtWeek } from '../src/engine/world/age'
import { coachFeel, coachPairAffinity } from '../src/engine/world/coachFeel'
import { coachSinceWeek } from '../src/engine/world/coachStint'
import { DEFAULT_PROFILE, type CoachFeel } from '../src/shared/protocol'

const SEED = 'r52-f1'
const COACH = 'coach-x'
const LEAN = COACH_FEEL.leanAt
const pairOf = (chem: number, phase = 0): CoachPair => ({ chem, phase, standing: 0 })
/** the ramp, spelled by the test from the named constants – the oracle the score is held against */
const levelWeightAt = (weeks: number): number => Math.min(COACH_FEEL.levelWeightMax, (COACH_FEEL.levelWeightMax * weeks) / COACH_FEEL.levelWeightWeeks)

/** A career with a founding coach on the payroll, standing in week `week` (the stint is then `week` old). */
function coached(seed: string, week = 60): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = week
  if (world.coachId === null) throw new Error('this profile is supposed to start with a coach on the payroll')
  return world
}
const coachOf = (world: WorldState): string => {
  if (world.coachId === null) throw new Error('no coach')
  return world.coachId
}
/** a hireable stranger – the recipe tests/r51-coach-real-hunch.test.ts uses */
const strangerOf = (world: WorldState): string => {
  const row = toSnapshot(world).coachMarket.find((r) => !r.current && r.lockedPoints === null)
  if (row === undefined) throw new Error('no hireable stranger on this board')
  return row.id
}

// =================================================================================================
// A. THE STEP TABLE
// =================================================================================================
describe('round 52 F1 A – the step table', () => {
  it('⭐ the score edges: at +leanAt she hedges good, one hair under it she is unsure; the mirror for off', () => {
    expect(coachFeelStep(LEAN, 0)).toBe('seems-good')
    expect(coachFeelStep(LEAN - 1e-9, 0)).toBe('unsure')
    expect(coachFeelStep(-LEAN, 0)).toBe('seems-off')
    expect(coachFeelStep(-LEAN + 1e-9, 0)).toBe('unsure')
    expect(coachFeelStep(0, 0)).toBe('unsure')
    // a flat score is unsure whatever the level: the level only ever confirms a lean, it cannot create one here
    expect(coachFeelStep(0, 50)).toBe('unsure')
    expect(coachFeelStep(0, -50)).toBe('unsure')
  })

  it('⭐ the confident edges ride the NAMED hunch line: good needs the warm line, off the cold one, and the line itself is a step either side of it', () => {
    expect(coachFeelStep(LEAN, CHEMISTRY_HUNCH_WARM_AT)).toBe('good')
    expect(coachFeelStep(LEAN, CHEMISTRY_HUNCH_WARM_AT - 0.01)).toBe('seems-good')
    expect(coachFeelStep(-LEAN, CHEMISTRY_HUNCH_COLD_AT)).toBe('off')
    expect(coachFeelStep(-LEAN, CHEMISTRY_HUNCH_COLD_AT + 0.01)).toBe('seems-off')
    expect(coachFeelStep(1, 50)).toBe('good')
    expect(coachFeelStep(-1, -50)).toBe('off')
  })

  it('⭐ a level AGAINST the lean makes her doubtful, never confident – the doubt is entirely in the hedged steps', () => {
    expect(coachFeelStep(LEAN, -50)).toBe('seems-good')
    expect(coachFeelStep(1, -50)).toBe('seems-good')
    expect(coachFeelStep(-LEAN, 50)).toBe('seems-off')
    expect(coachFeelStep(-1, 50)).toBe('seems-off')
  })

  it('the confident line sits ABOVE the largest bar a pair can draw – the structural reason the property below holds', () => {
    expect(CHEMISTRY_HUNCH_WARM_AT).toBeGreaterThan(ECONOMY.chemistry.readableCeiling)
    expect(CHEMISTRY_HUNCH_COLD_AT).toBeLessThan(-ECONOMY.chemistry.readableCeiling)
  })

  it('six distinct steps, `too-early` first', () => {
    expect(COACH_FEEL_STEPS.length).toBe(6)
    expect(new Set(COACH_FEEL_STEPS).size).toBe(6)
    expect(COACH_FEEL_STEPS[0]).toBe('too-early')
  })
})

// =================================================================================================
// B. THE GATE AND THE BLEND
// =================================================================================================
describe('round 52 F1 B – the too-early gate and the score', () => {
  it('⭐ under tooEarlyWeeks she says nothing, whatever the pair; from tooEarlyWeeks she is live', () => {
    for (const a of [-1, -0.4, 0, 0.4, 1]) {
      for (const chem of [-30, 0, 30]) {
        for (let w = 0; w < COACH_FEEL.tooEarlyWeeks; w++) {
          expect(coachFeelOf(pairOf(chem), a, w, SEED, COACH), `A ${a} chem ${chem} week ${w}`).toBe('too-early')
        }
      }
    }
    // A = 0.9 at the first live week: trend alone is ~0.83 before a doubt of at most 0.12, so she hedges good on EVERY seed
    expect(coachFeelOf(pairOf(0), 0.9, COACH_FEEL.tooEarlyWeeks, SEED, COACH)).toBe('seems-good')
    expect(coachFeelOf(pairOf(0), -0.9, COACH_FEEL.tooEarlyWeeks, SEED, COACH)).toBe('seems-off')
    // a stint that is negative or not a number is «too early» too – never «unsure»
    expect(coachFeelOf(pairOf(0), 1, -3, SEED, COACH)).toBe('too-early')
    expect(coachFeelOf(pairOf(0), 1, Number.NaN, SEED, COACH)).toBe('too-early')
  })

  it('⭐ the score is (1 - wL) x trend + wL x level + doubt, with wL ramping linearly to levelWeightMax and staying there', () => {
    const doubt = (w: number): number => coachFeelJitter(SEED, COACH, Math.floor(w / COACH_FEEL.periodWeeks))
    const bare = (a: number, chem: number, w: number): number => coachFeelScore(pairOf(chem), a, w, SEED, COACH) - doubt(w)
    for (const w of [0, 6, 13, 26, 52, 80, 156]) {
      const wL = levelWeightAt(w)
      expect(bare(1, 0, w), `trend at a perfect pair, week ${w}`).toBeCloseTo(1 - wL, 9)
      expect(bare(-1, 0, w), `trend at the worst pair, week ${w}`).toBeCloseTo(-(1 - wL), 9)
      expect(bare(0, COACH_FEEL.levelScale, w), `level at +levelScale, week ${w}`).toBeCloseTo(wL, 9)
      expect(bare(0, -COACH_FEEL.levelScale, w), `level at -levelScale, week ${w}`).toBeCloseTo(-wL, 9)
      expect(bare(0, 10 * COACH_FEEL.levelScale, w), `the level saturates, week ${w}`).toBeCloseTo(wL, 9)
    }
    expect(levelWeightAt(COACH_FEEL.levelWeightWeeks)).toBe(COACH_FEEL.levelWeightMax)
    expect(levelWeightAt(10 * COACH_FEEL.levelWeightWeeks), 'and it stays').toBe(COACH_FEEL.levelWeightMax)
  })

  it('the trend is the pair\'s drift normalised by the constants it is read from – not a retyped number', () => {
    const c = ECONOMY.chemistry
    for (const a of [-1, -0.7, -0.25, 0, 0.25, 0.6, 1]) {
      const drift = chemistryDriftPerYear(a)
      const expected = drift / (drift >= 0 ? c.driftAtPerfect : -c.driftAtAnti)
      const trendOnly = coachFeelScore(undefined, a, 0, SEED, COACH) - coachFeelJitter(SEED, COACH, 0)
      expect(trendOnly, `A ${a}`).toBeCloseTo(expected, 9)
    }
  })

  it('an ABSENT pair reads exactly like a pair at chem 0 – she has no history with him, so the level adds nothing', () => {
    for (const w of [6, 20, 60]) {
      expect(coachFeelScore(undefined, 0.3, w, SEED, COACH)).toBe(coachFeelScore(pairOf(0), 0.3, w, SEED, COACH))
      expect(coachFeelOf(undefined, 0.3, w, SEED, COACH)).toBe(coachFeelOf(pairOf(0), 0.3, w, SEED, COACH))
    }
  })

  it('⭐ NO PHASE TERM: the weekly weather and the unread `standing` cannot move her feel (the weather reaches her through `chem`)', () => {
    for (const w of [6, 13, 52, 90]) {
      for (const chem of [-8, -2, 0, 2, 8]) {
        const calm = coachFeelScore({ chem, phase: 0, standing: 0 }, 0.2, w, SEED, COACH)
        expect(coachFeelScore({ chem, phase: 1, standing: 9 }, 0.2, w, SEED, COACH), `chem ${chem} week ${w}`).toBe(calm)
        expect(coachFeelScore({ chem, phase: -1, standing: -9 }, 0.2, w, SEED, COACH)).toBe(calm)
      }
    }
  })
})

// =================================================================================================
// C. THE DOUBT
// =================================================================================================
describe('round 52 F1 C – the doubt', () => {
  it('⭐ constant inside a four-week period, redrawn across periods: at A = 0 and chem = 0 the score IS the period\'s doubt', () => {
    const P = COACH_FEEL.periodWeeks
    const seen = new Set<number>()
    for (let period = 0; period < 40; period++) {
      const first = coachFeelScore(undefined, 0, period * P, SEED, COACH)
      for (let w = period * P; w < (period + 1) * P; w++) {
        expect(coachFeelScore(undefined, 0, w, SEED, COACH), `week ${w} sits in period ${period}`).toBe(first)
      }
      expect(first).toBe(coachFeelJitter(SEED, COACH, period))
      seen.add(first)
    }
    expect(seen.size, 'forty periods, forty fresh draws (a collision would be a keying bug)').toBeGreaterThanOrEqual(39)
  })

  it('bounded by the named half-width, deterministic, and keyed on the career AND the coach', () => {
    let lo = Infinity
    let hi = -Infinity
    for (let p = 0; p < 400; p++) {
      const j = coachFeelJitter(SEED, COACH, p)
      expect(coachFeelJitter(SEED, COACH, p), 'same inputs, same number').toBe(j)
      lo = Math.min(lo, j)
      hi = Math.max(hi, j)
    }
    expect(lo).toBeGreaterThanOrEqual(-COACH_FEEL.jitter)
    expect(hi).toBeLessThan(COACH_FEEL.jitter)
    // the draws are spread across the corridor and not stuck near one end – 400 draws reach well into both halves
    expect(lo).toBeLessThan(-0.8 * COACH_FEEL.jitter)
    expect(hi).toBeGreaterThan(0.8 * COACH_FEEL.jitter)
    const mine = Array.from({ length: 12 }, (_, p) => coachFeelJitter(SEED, COACH, p))
    expect(Array.from({ length: 12 }, (_, p) => coachFeelJitter(SEED, 'coach-y', p)), 'another coach, another doubt').not.toEqual(mine)
    expect(Array.from({ length: 12 }, (_, p) => coachFeelJitter('r52-f1-other', COACH, p)), 'another career, another doubt').not.toEqual(mine)
  })
})

// =================================================================================================
// D. THE PROPERTY
// =================================================================================================
describe('round 52 F1 D – ⭐ she is CONFIDENT only when the gauge would confirm', () => {
  it('good means the coach card shows a POSITIVE figure, off a NEGATIVE one – every affinity x level x stint x coach x career in the sweep', () => {
    const wrong: string[] = []
    let good = 0
    let off = 0
    let hedgedAgainstTheLevel = 0
    let cells = 0
    for (const seed of ['r52-prop-a', 'r52-prop-b']) {
      for (let c = 0; c < 12; c++) {
        const coachId = `coach-${c}`
        for (let a = -1; a <= 1; a += 0.25) {
          for (let chem = -20; chem <= 20; chem += 0.5) {
            for (const w of [6, 7, 13, 26, 52, 104, 400]) {
              cells += 1
              const pair = pairOf(chem)
              const step = coachFeelOf(pair, a, w, seed, coachId)
              // THE GAUGE'S OWN FUNCTION, not a restated bar: the per-pair threshold is drawn per coach.
              const shown = chemistryReading(pair, seed, coachId)
              if (step === 'good') {
                good += 1
                if (shown === null || !(shown > 0)) wrong.push(`good with a gauge of ${shown} (seed ${seed} ${coachId} A ${a} chem ${chem} week ${w})`)
              } else if (step === 'off') {
                off += 1
                if (shown === null || !(shown < 0)) wrong.push(`off with a gauge of ${shown} (seed ${seed} ${coachId} A ${a} chem ${chem} week ${w})`)
              } else if ((step === 'seems-good' && chem < 0) || (step === 'seems-off' && chem > 0)) {
                hedgedAgainstTheLevel += 1
              }
            }
          }
        }
      }
    }
    expect(wrong, 'a confident step against the gauge').toEqual([])
    // non-vacuous: the sweep reached every kind of cell, and the DOUBT is real (hedged steps do disagree with the level) –
    // otherwise «confident-wrong is zero» would be zero because nothing was ever confident, or nothing ever hedged.
    expect(cells).toBe(2 * 12 * 9 * 81 * 7)
    expect(good, 'good steps in the sweep').toBeGreaterThan(1000)
    expect(off, 'off steps in the sweep').toBeGreaterThan(1000)
    expect(hedgedAgainstTheLevel, 'hedged steps that disagree with the level exist – the doubt lives here').toBeGreaterThan(100)
  })
})

// =================================================================================================
// E. THE WRAPPER
// =================================================================================================
describe('round 52 F1 E – the world-level wrapper', () => {
  it('⭐ null when nobody is employed – the parent on the court has no coach to feel anything about', () => {
    const world = coached('r52-f1-alone')
    expect(coachFeel(world), 'with a coach it speaks').not.toBeNull()
    hireCoach(world, null)
    expect(world.coachId).toBeNull()
    expect(coachFeel(world)).toBeNull()
  })

  it('it reads the pair, the tick\'s own affinity and the stint exactly as the pure function takes them', () => {
    const world = coached('r52-f1-compose', 70)
    const id = coachOf(world)
    const coach = coachById(world.seed, ageAtWeek(world.week), id)!
    expect(coachSinceWeek(world), 'a founding coach has been with her since week 0').toBe(0)
    // the ONE spelling the tick (`accrueCoachPair`) and her feel share
    expect(coachPairAffinity(world, coach)).toBe(affinityFor(world.seed, id, world.temperament, coach.manner))
    for (const chem of [-9, -2, 0, 1.5, 9]) {
      world.coachPairs[id] = pairOf(chem)
      expect(coachFeel(world), `chem ${chem}`).toBe(coachFeelOf(pairOf(chem), affinityFor(world.seed, id, world.temperament, coach.manner), 70, world.seed, id))
    }
    // a stint of 70 weeks puts the level at its full weight: a clear level beats any trend (|0.3 x trend| <= 0.3 < 0.7 - lean - doubt)
    world.coachPairs[id] = pairOf(12)
    expect(coachFeel(world)).toBe('good')
    world.coachPairs[id] = pairOf(-12)
    expect(coachFeel(world)).toBe('off')
  })

  it('an absent pair reads chem 0 (no row until the first paid week) and never throws', () => {
    const world = coached('r52-f1-absent', 40)
    const id = coachOf(world)
    delete world.coachPairs[id]
    const absent = coachFeel(world)
    world.coachPairs[id] = pairOf(0)
    expect(absent).toBe(coachFeel(world))
  })

  it('⭐ a hire restarts the clock: the new coach is `too-early` for tooEarlyWeeks even with a big pair on the books, then she is live', () => {
    const world = coached('r52-f1-restart', 60)
    const old = coachOf(world)
    world.coachPairs[old] = pairOf(15)
    expect(coachFeel(world)).toBe('good')
    const stranger = strangerOf(world)
    // a pair on the stranger's row would not matter either – the stint is what gates her
    world.coachPairs[stranger] = pairOf(15)
    hireCoach(world, stranger)
    expect(coachSinceWeek(world), 'the hire is stamped with the week the world stands in').toBe(60)
    expect(coachFeel(world)).toBe('too-early')
    world.week = 60 + COACH_FEEL.tooEarlyWeeks - 1
    expect(coachFeel(world), 'one week short').toBe('too-early')
    world.week = 60 + COACH_FEEL.tooEarlyWeeks
    expect(coachFeel(world), 'the first live week').not.toBe('too-early')
  })

  it('⭐ ZERO MAIN DRAWS: the persisted MAIN position is identical after any number of feel reads and snapshots', () => {
    const world = coached('r52-f1-zero', 50)
    const at = JSON.stringify(world.rngMain)
    for (let i = 0; i < 5; i++) {
      coachFeel(world)
      toSnapshot(world)
    }
    expect(JSON.stringify(world.rngMain), 'reading her feel drew nothing from MAIN').toBe(at)
  })

  it('the same world says the same thing every time, and a rebuilt world says it too (nothing persisted, nothing drifts)', () => {
    const a = coached('r52-f1-stable', 33)
    const b = coached('r52-f1-stable', 33)
    for (const w of [33, 34, 35, 36, 37]) {
      a.week = w
      b.week = w
      expect(coachFeel(a)).toBe(coachFeel(a))
      expect(coachFeel(a), `week ${w}`).toBe(coachFeel(b))
    }
  })
})

// =================================================================================================
// F. THE SNAPSHOT KEY
// =================================================================================================
describe('round 52 F1 F – Snapshot.coachFeel', () => {
  it('⭐ the key is ABSENT – not null, not undefined – with nobody employed, and present with a coach', () => {
    const alone = coached('r52-f1-snap-alone')
    hireCoach(alone, null)
    const bare = toSnapshot(alone)
    expect(Object.prototype.hasOwnProperty.call(bare, 'coachFeel'), 'own key').toBe(false)
    expect('coachFeel' in bare).toBe(false)
    expect(JSON.stringify(bare)).not.toContain('"coachFeel"')

    const world = coached('r52-f1-snap-coach')
    const snap = toSnapshot(world)
    expect(Object.prototype.hasOwnProperty.call(snap, 'coachFeel')).toBe(true)
    expect(COACH_FEEL_STEPS).toContain(snap.coachFeel as CoachFeel)
    expect(snap.coachFeel, 'the wire carries exactly what the wrapper says').toBe(coachFeel(world))
    expect(JSON.stringify(snap)).toContain('"coachFeel"')
  })

  it('a fresh hire reads `too-early` on the wire, and the same career a season on reads a live step', () => {
    const world = coached('r52-f1-snap-live', 0)
    expect(toSnapshot(world).coachFeel, 'week 0, founding coach: nothing yet').toBe('too-early')
    world.week = 52
    expect(toSnapshot(world).coachFeel).not.toBe('too-early')
  })
})

// =================================================================================================
// G. THE HUNCH MAPPING
// =================================================================================================
describe('round 52 F1 G – the small-talk hunch reads her feel', () => {
  it('⭐ good and seems-good lean warm, off and seems-off cold, unsure and too-early even – all six steps, once each', () => {
    const expected: Record<CoachFeel, 'warm' | 'even' | 'cold'> = {
      'too-early': 'even',
      unsure: 'even',
      'seems-good': 'warm',
      'seems-off': 'cold',
      good: 'warm',
      off: 'cold',
    }
    for (const step of COACH_FEEL_STEPS) expect(feelHunch(step), step).toBe(expected[step])
    expect(Object.keys(expected).sort()).toEqual([...COACH_FEEL_STEPS].sort())
  })
})
