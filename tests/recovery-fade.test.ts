import { describe, it, expect } from 'vitest'
import {
  createWorld,
  kidAgeExact,
  activeLadderOf,
  isBlackoutWeek,
  recoveryAgeFade,
  recoveryBaseFor,
  accrueCondition,
  withheldFreeWeekRecovery,
} from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { ageAtPhysicalShare, declineFactor, physicalMean } from '../src/engine/development'
import { rivalCondition } from '../src/engine/season/rival'
import { schoolIsOver } from '../src/engine/kidLife'
import { ENDINGS } from '../src/engine/ending'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

// ⭐⭐⭐ THE FADING RECOVERY CORRIDOR (the long goodbye §4a, docs/specs/the-long-goodbye-2026-08.md).
// The owner's own addition to the spec, 26.08: «для концовок и возраста предлагаю еще уменьшать
// недельное восстановление после матчей, т.е. и физика будет падать и восстанавливаться будет
// дольше». Until this, the ONLY thing age touched was the attribute VALUE – a thirty-eight-year-old
// drained from a match exactly as fast as a twenty-two-year-old and came back exactly as fast, so
// the old body was weaker but never TIREDER, which is backwards.
//
// `recoveryBaseFor` now multiplies the phase's base by the share of her own peak physical she has
// left – the SAME ratio §3a's ending trigger reads – floored at `ECONOMY.condition.recoveryAgeFloor`.
//
// ⚠ WHAT THIS FILE PINS IS THE FACT, NEVER A SPELLING, exactly as tests/peak-physical.test.ts does
// for the peak it spends. Every assertion is about a number the engine produces: that the junior era
// is untouched, that the corridor closes continuously and by the share, that the floor is where the
// owner set it and is nearly inert under the shipped threshold, that every reader of the helper
// inherits the fade, and that the rivals do not.
//
// ⚠ RNG: NOTHING HERE DRAWS. `recoveryAgeFade` is a comparison and a division over state `growWeek`
// has already computed. The frozen MAIN capture (41550 / e6b0c709, tests/condition.test.ts) cannot
// see this change, and the last case in this file asserts the helper leaves `rngMain` where it was.

/** ONE WEEK OF THE REAL GROWTH PHASE – the harness tests/peak-physical.test.ts introduced, for the
 *  same reason: reaching the decline is 15+ years of weeks and a full `tickWeek` costs ~160x this
 *  per week. `growWeek` is the only writer of `world.skills`, and `world.peakPhysical` is written on
 *  the line after it, so both halves of the share this file is about are maintained here exactly as
 *  the shipped tick maintains them. */
function stepGrowth(world: WorldState, rng: Rng): void {
  world.week += 1
  growAndLive(world, rng)
}

const ageOf = (world: WorldState): number =>
  kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)

const shareOf = (world: WorldState): number => physicalMean(world.skills) / world.peakPhysical

function born(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  return { world, rng: rngFromSeed(world.seed) }
}

function walkTo(world: WorldState, rng: Rng, age: number, onWeek?: (w: WorldState) => void): void {
  while (ageOf(world) < age) {
    stepGrowth(world, rng)
    onWeek?.(world)
  }
}

/** Her first counting W-series finish on the never-pruned mark – the one-way door `activeLadderOf`
 *  reads, and therefore the boundary between base 8 and base 5. Same helper tests/condition.test.ts
 *  uses for the phase split. */
function turnPro(world: WorldState): void {
  world.bestFinishByTier.w15 = 0
}

// ------------------------------------------------------------------------------------------------
describe('the junior era cannot move, and it is the AGE GATE that guarantees it', () => {
  it('the multiplier is EXACTLY 1 on every week of a career walked to the peak', () => {
    const { world, rng } = born('fade-junior')
    let weeks = 0
    let lowestShare = 1
    // ⚠ THE GUARD INSIDE THE CALLBACK IS LOAD-BEARING, not defensive: `walkTo` steps until she is
    // PAST the age asked for, so its last week is already a week into the decline – where the fade
    // is correctly no longer 1.
    walkTo(world, rng, ECONOMY.development.ageCurve.declineStart, (w) => {
      if (ageOf(w) >= ECONOMY.development.ageCurve.declineStart) return
      weeks += 1
      lowestShare = Math.min(lowestShare, shareOf(w))
      expect(recoveryAgeFade(w), `week ${w.week}, age ${ageOf(w).toFixed(2)}`).toBe(1)
    })
    expect(weeks, 'the walk really covered the junior era and the whole pre-peak career').toBeGreaterThan(700)
    // ⭐ MEASURED, AND IT CORRECTS SOMETHING I WROTE BEFORE I RAN IT. I expected a knock to dip the
    // share below 1 for a few weeks and it does not: a rested knock costs her the GROWTH of that
    // week (`KNOCK_REST_GROWTH`), it does not take points off. `growWeek` is the only writer of
    // `world.skills`, its gain is non-negative and its loss term is `declineFactor(age) * skill`,
    // which is 0 before `declineStart` – so a pre-peak career's physical is monotone and the running
    // maximum equals it exactly, every week. Today the share is IDENTICALLY 1 before the peak and
    // the age gate is therefore belt AND braces rather than the only strap. It is kept anyway, and
    // the next case is why.
    expect(lowestShare, 'nothing in the shipped engine lowers her physical before the peak').toBe(1)
  })

  it('⚠ and the gate is the AGE, not the ratio – so a future atrophy term cannot reach the juniors', () => {
    // §3a names three shapes that would make the goodbye personal, and the first is «an atrophy term
    // that takes physical off a body that is injured or unloaded». The day one of them lands, the
    // share stops being identically 1 before the peak – and a fade written as «multiply by the
    // share» would quietly start slowing the JUNIOR recovery, where the benches are pinned reference
    // tables and a drift is invisible (fatigue-reprice-2026-08.md §5).
    //
    // So this case builds that future by hand: a sixteen-year-old standing at 80% of her own peak.
    // Nothing in the engine can produce it today, which is exactly why it has to be constructed – a
    // guarantee that is only true by coincidence is not a guarantee.
    const { world, rng } = born('fade-gate-is-age')
    walkTo(world, rng, 16)
    world.peakPhysical = physicalMean(world.skills) / 0.8
    expect(shareOf(world)).toBeCloseTo(0.8, 10)
    expect(recoveryAgeFade(world), 'below the peak, and the multiplier is still exactly 1').toBe(1)
    expect(recoveryBaseFor(world)).toBe(ECONOMY.condition.recoveryBase)
    // ...and past `declineStart` the same planted body DOES fade, so the gate is a gate and not a
    // disabled branch.
    // (the planted peak is a running maximum like any other, so thirteen more years of growth
    //  overtake it – what survives to the far side is that the multiplier is no longer pinned)
    walkTo(world, rng, ECONOMY.development.ageCurve.declineStart + 1)
    expect(recoveryAgeFade(world)).toBeLessThan(1)
    expect(recoveryAgeFade(world)).toBeCloseTo(shareOf(world), 12)
  })

  it('a junior rest week still returns exactly base 8 + slider, to the point', () => {
    const { world, rng } = born('fade-junior-week')
    walkTo(world, rng, 16)
    // ...onto an ordinary week: the off-season and the exam weeks pay `blackoutBonus` on top, which
    // is a fact about the CALENDAR and has nothing to do with the fade.
    while (isBlackoutWeek(world.week, schoolIsOver(world.week, world.profile.birthMonth))) {
      stepGrowth(world, rng)
    }
    world.physioActive = false
    world.plan = { train: 60, rest: 40 }
    expect(activeLadderOf(world), 'still on the junior side of the handover').not.toBe('wta')
    expect(recoveryBaseFor(world)).toBe(ECONOMY.condition.recoveryBase)
    world.condition = 50
    accrueCondition(world, false)
    expect(world.condition, 'base 8 + the 60/40 slider 2, and no fraction in sight').toBe(60)
    expect(Number.isInteger(world.condition)).toBe(true)
  })
})

// ------------------------------------------------------------------------------------------------
describe('from declineStart the corridor closes, continuously, by the share of her own peak', () => {
  it('the multiplier IS the share, week for week, for fifteen years past the peak', () => {
    const { world, rng } = born('fade-tracks-share')
    walkTo(world, rng, ECONOMY.development.ageCurve.declineStart)
    let checked = 0
    walkTo(world, rng, 42, (w) => {
      checked += 1
      const share = shareOf(w)
      if (share > ECONOMY.condition.recoveryAgeFloor) {
        expect(recoveryAgeFade(w), `age ${ageOf(w).toFixed(2)}`).toBeCloseTo(share, 12)
      }
    })
    expect(checked).toBeGreaterThan(600)
  })

  it('⭐ it reproduces §4a’s corrected table – 5.00 / 4.46 / 4.09 / 3.45 / 2.79 at 29 / 33 / 35 / 38 / 41', () => {
    // ⚠ THE CORRECTED TABLE, NOT THE FIRST DRAFT. §4a's first version evaluated `declineFactor` once
    // a year and held it constant across the 52 weeks; the engine raises her age EVERY WEEK, so the
    // loss compounds against a continuously rising factor and the real curve is 2-3 points kinder at
    // every age. This walks the engine's own weeks and is therefore the arbiter.
    const { world, rng } = born('fade-table')
    turnPro(world)
    const table: [number, number][] = [
      [29, 5.0],
      [33, 4.46],
      [35, 4.09],
      [38, 3.45],
      [41, 2.79],
    ]
    for (const [age, expected] of table) {
      walkTo(world, rng, age)
      expect(activeLadderOf(world), 'the pro base is the one the table is written about').toBe('wta')
      // ⚠ ±0.02 AND NOT TWO DECIMALS EXACTLY, for an honest reason rather than a slack one: the
      // table names an AGE and the walk stops on the first week PAST it, and the curve moves about
      // 0.005 a week at 41. Tightening this to `toBeCloseTo(x, 2)` would pin the birthday's
      // remainder, not the corridor. Loosen it past ~0.05 and it stops distinguishing 41 from 40.
      expect(Math.abs(recoveryBaseFor(world) - expected), `age ${age}`).toBeLessThan(0.02)
    }
  })

  it('...and it FALLS every year, with no steps in it – «затухающая динамика», not a hard binding', () => {
    // His own words, 26.08: «можно даже сделать на каждый год затухающую динамику – будет вообще
    // красиво, а не жесткую привязку». The mechanic is continuous by construction; what this pins is
    // that nobody has quantised it back into 5 -> 4 -> 3 on the way past.
    const { world, rng } = born('fade-monotone')
    turnPro(world)
    walkTo(world, rng, ECONOMY.development.ageCurve.declineStart)
    let previous = recoveryBaseFor(world)
    let distinct = 0
    walkTo(world, rng, 40, (w) => {
      const now = recoveryBaseFor(w)
      expect(now, `age ${ageOf(w).toFixed(2)}`).toBeLessThan(previous)
      if (now !== previous) distinct += 1
      previous = now
    })
    // A quantised corridor would have produced two or three distinct values across eleven years.
    expect(distinct, 'a fresh value every single week, which is what «continuous» has to mean').toBeGreaterThan(500)
  })

  it('the engine KEEPS the fraction – her condition is genuinely not a whole number in the pro era', () => {
    // Owner, 26.08: «у нас в логике могут быть дробные числа – это окей, а у пользователя целые в
    // интерфейсе» · «пусть падает, но на фронт едет в отображение округленное значение». The
    // rounding belongs at the snapshot boundary and nowhere else – tests/condition-boundary.test.ts
    // is the other half of this pair.
    const { world, rng } = born('fade-fraction')
    turnPro(world)
    walkTo(world, rng, 35)
    world.physioActive = false
    world.plan = { train: 85, rest: 15 }
    world.condition = 50
    accrueCondition(world, false)
    expect(Number.isInteger(world.condition), 'a quantised mechanic is exactly what §4a forbids').toBe(false)
    expect(world.condition).toBeGreaterThan(53)
    expect(world.condition).toBeLessThan(55)
  })
})

// ------------------------------------------------------------------------------------------------
describe('the floor, at the value the owner approved – and it is nearly inert', () => {
  it('is 0.5, so a professional rest week can never return less than 2.5 – «пол 2.5 ок»', () => {
    expect(ECONOMY.condition.recoveryAgeFloor).toBe(0.5)
    expect(ECONOMY.condition.proPhaseRecoveryBase * ECONOMY.condition.recoveryAgeFloor).toBe(2.5)
  })

  it('holds at the floor however old she gets, and never dips below it', () => {
    const { world, rng } = born('fade-floor')
    turnPro(world)
    walkTo(world, rng, 44)
    expect(shareOf(world), 'she really is past the crossing, or the floor is not being tested').toBeLessThan(
      ECONOMY.condition.recoveryAgeFloor,
    )
    expect(recoveryAgeFade(world)).toBe(ECONOMY.condition.recoveryAgeFloor)
    expect(recoveryBaseFor(world)).toBeCloseTo(2.5, 10)
    walkTo(world, rng, 50)
    expect(recoveryAgeFade(world), 'it is a floor, not a slope with a kink').toBe(ECONOMY.condition.recoveryAgeFloor)
  })

  it('⚠ FIRES AFTER THE CAREER HAS ALREADY ENDED – a safety net, not a dial, and a live tripwire on both', () => {
    // §4a, and it is the paragraph anybody reaching for this knob has to read first: «nobody should
    // later raise the floor to fix something without noticing it is not currently doing anything».
    // The share crosses `recoveryAgeFloor` at ~42.3; `ENDINGS.lastOfferPeakShare` (0.55) has ended
    // the career at ~41.2. So the floor exists for the outliers – a migrated save, a body that
    // somehow held past the threshold, a future dial – and for nothing else.
    //
    // ⚠ THIS PIN IS AIMED AT THE RELATIONSHIP, NOT AT THE TWO NUMBERS. Move either dial and it still
    // asks the right question; make the floor bite BEFORE the ending and it goes red, which is
    // exactly the moment somebody needs to be told that the floor has started deciding careers.
    const floorBitesAt = ageAtPhysicalShare(ECONOMY.condition.recoveryAgeFloor)
    const careerEndsAt = ageAtPhysicalShare(ENDINGS.lastOfferPeakShare)
    expect(floorBitesAt).toBeGreaterThan(careerEndsAt)
    expect(careerEndsAt).toBeCloseTo(41.17, 1)
    expect(floorBitesAt).toBeCloseTo(42.31, 1)
  })
})

// ------------------------------------------------------------------------------------------------
describe('every reader of the helper inherits the fade – that is why it lives inside it', () => {
  /** A world at 38, professional, physio off, on the 60/40 slider. */
  function veteran(seed: string): WorldState {
    const { world, rng } = born(seed)
    turnPro(world)
    walkTo(world, rng, 38)
    world.physioActive = false
    world.plan = { train: 60, rest: 40 }
    return world
  }

  it('the accumulator pays the faded base on a free week – 3.45 + the slider, not 5 + the slider', () => {
    const world = veteran('fade-accrue')
    const faded = recoveryBaseFor(world)
    expect(faded).toBeCloseTo(3.45, 2)
    world.condition = 40
    accrueCondition(world, false)
    expect(world.condition).toBeCloseTo(40 + faded + 2, 10)
  })

  it('⚠ AND SO DOES THE MAKEUP, or the doctor’s veto becomes worth more than an ordinary week', () => {
    // `withheldFreeWeekRecovery` is the ONE oracle the three refund sites read (world.ts's
    // medical-withdrawal arm, `skipEvent`, and planner.ts's practice cancellation). If it paid the
    // un-faded base while the ordinary week paid the faded one, a withdrawn entry would hand a
    // thirty-eight-year-old MORE than a rest week – the exact incoherence the 22.08 phase split had
    // to close, one step further on.
    const world = veteran('fade-makeup')
    const faded = recoveryBaseFor(world)
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBeCloseTo(faded + 2, 10)
    // ⚠ AND AGAINST THE UN-FADED FIGURE TOO, or the case above is only a consistency check between
    // two expressions that could both be wrong: with the fade removed from the helper the line above
    // still passes (both sides move together) and THIS one does not.
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBeLessThan(
      ECONOMY.condition.proPhaseRecoveryBase + 2,
    )
    // The practice arm banked the base already, so only the slider comes back – unchanged by the
    // fade, because the faded base sits on BOTH sides of that subtraction.
    expect(withheldFreeWeekRecovery(world, 'practice')).toBeCloseTo(2, 10)
  })

  it('a professional MATCH week is untouched – the fade is about what a REST week returns', () => {
    const world = veteran('fade-match-week')
    world.condition = 60
    accrueCondition(world, true)
    expect(world.condition).toBe(60 + ECONOMY.condition.matchWeekRecoveryBase)
  })
})

// ------------------------------------------------------------------------------------------------
describe('the rivals do not fade, and they CANNOT – field-pro ageing is a separate item', () => {
  it('a rival’s condition is a function of (results, id, week) with no body in it at all', () => {
    // season/rival.ts's `walkWindow` reads `ECONOMY.condition.recoveryBase` DIRECTLY rather than
    // through `recoveryBaseFor` (medical.ts's header says so), and `rivalCondition` takes no world,
    // no skills and no peak – so there is nothing for a share of a peak to be taken against. The
    // fade is structurally invisible here, and this is the pin that says so out loud: field-pro
    // ageing is its own backlog item and this spec does not open it.
    const late = 40 * 52
    const fresh = rivalCondition([], 'rival-a', late)
    expect(fresh).toBe(ECONOMY.condition.max)
    expect(Number.isInteger(fresh), 'integer arithmetic, exactly as before').toBe(true)
    // One run in the window, thirty years into the game: the recovery ladder that walks back out of
    // it is the un-faded one.
    const worked = rivalCondition(
      [{ playerId: 'rival-a', week: late - 1, points: 250, tier: 'wta250' }],
      'rival-a',
      late,
    )
    expect(worked).toBeLessThan(fresh)
    expect(Number.isInteger(worked)).toBe(true)
  })
})

// ------------------------------------------------------------------------------------------------
describe('RNG: the fade draws nothing', () => {
  it('reading the helper a thousand times leaves the MAIN position exactly where it was', () => {
    const { world, rng } = born('fade-rng')
    turnPro(world)
    walkTo(world, rng, 38)
    const before = { ...world.rngMain }
    for (let i = 0; i < 1000; i++) {
      recoveryAgeFade(world)
      recoveryBaseFor(world)
    }
    expect(world.rngMain).toEqual(before)
    // ...and the decline it reads is real at this age, so the loop above was not measuring a no-op.
    expect(declineFactor(ageOf(world))).toBeGreaterThan(0)
  })
})
