// WAVE 9 / T5 – «PRIORITIES SHIFT», AS ROOM RATHER THAN AS A GIFT.
//
// The research digest's one PERMANENT effect and the only skill-adjacent number this branch touches.
// It raises her composure CEILING – round 42 #35's shape, re-used – so ordinary development climbs
// into it and she earns what motherhood gave her room for.
//
// ⚠⚠ WHY A CEILING AND NOT A BUMP, and it is a measurement rather than a preference: wave 8b's arm 7
// found a coached career reaching 96–98% of her own headroom by about twenty-two, and the first
// child arrives at 24+. A bonus clamped to her rolled ceiling would be worth almost nothing to
// almost everybody.
//
// ⚠ AND IT IS DERIVED, SO THIS WAVE OWES NO SCHEMA MOVE. The brief drafted «one appended field so
// the bonus cannot land twice»; a derivation cannot land twice at all.
//
// MUTATION-VERIFIED 21.09: `returnPoiseCeiling 1.5 -> 0` fails «a mother has more room than she
// was born with»; `returnPoiseMax 3 -> 99` fails the cap case. Both reverted.

import { describe, it, expect } from 'vitest'
import { composureCeilingOf, motherhoodPoiseOf } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

describe('wave 9 T5 – the room motherhood leaves', () => {
  it('⭐⭐⭐ a childless career is byte-identical – the first thing this term must not do', () => {
    expect(motherhoodPoiseOf(0), 'no child, no room, no difference to any career ever played').toBe(0)
    expect(composureCeilingOf(61.2, 0 + motherhoodPoiseOf(0)), 'the ceiling is the rolled one to the bit')
      .toBe(61.2)
  })

  it('⭐ a mother has more room than she was born with, and a second child adds its own', () => {
    const one = motherhoodPoiseOf(1)
    const two = motherhoodPoiseOf(2)
    expect(one).toBeGreaterThan(0)
    expect(two).toBeGreaterThan(one)
    expect(one, 'and the step is the constant, not a coincidence').toBe(ECONOMY.motherhood.returnPoiseCeiling)
  })

  it('⚠ the cap holds, so a large family cannot become a composure strategy', () => {
    expect(motherhoodPoiseOf(9), 'nine children buy exactly the cap').toBe(ECONOMY.motherhood.returnPoiseMax)
    expect(motherhoodPoiseOf(9)).toBeLessThan(9 * ECONOMY.motherhood.returnPoiseCeiling)
  })

  it('⚠ it composes with the psychologist\'s bonus rather than replacing it', () => {
    // The seat's own number is untouched by this term, which is what lets a mother who also hires
    // the seat have both. If these were one field, one would have had to win.
    const seatOnly = composureCeilingOf(60, 2 + motherhoodPoiseOf(0))
    const motherOnly = composureCeilingOf(60, 0 + motherhoodPoiseOf(1))
    const both = composureCeilingOf(60, 2 + motherhoodPoiseOf(1))
    expect(both).toBeGreaterThan(seatOnly)
    expect(both).toBeGreaterThan(motherOnly)
    expect(both - seatOnly, 'the mother\'s room is the same size whoever else is paid').toBeCloseTo(
      motherOnly - 60,
      10,
    )
  })

  it('⭐⭐⭐ ON TWO WALKED CAREERS: the child is the only difference, and she really spends the room', () => {
    // ⚠ THE ARM THAT MATTERS, and it is an A/B on ONE seed rather than a threshold. The three cases
    // above are arithmetic; this one asks whether the engine ever SPENDS the room – a ceiling nothing
    // grows into would be a number in a save that never reaches the screen, which is what
    // `composureEaseThisWeek`'s own note warns about.
    //
    // ⚠⚠ THE HORIZON IS MEASURED AND NOT CHOSEN. At +104 weeks she has NOT yet passed her rolled
    // ceiling (66.80 against 66.93) and this case failed on its first shape, correctly: growth into
    // the last of the headroom is asymptotic and she is past her peak. Measured across three
    // horizons the gain over her own childless twin is +0.495 at 104, 208 and 312 weeks alike – it
    // arrives inside two years and then holds – so the case walks to the horizon where BOTH claims
    // are true and the spec's §T5 carries the number.
    const mother = openCareer(PRESETS[2], 0, POLICIES[1])
    while (mother.world.week < 700) stepCareerWeek(mother.world, mother.rng, POLICIES[1])
    const rolled = mother.world.potential.composure
    mother.world.children = [{ bornWeek: mother.world.week, sex: 'girl' }]
    for (let i = 0; i < 208; i++) stepCareerWeek(mother.world, mother.rng, POLICIES[1])

    const twin = openCareer(PRESETS[2], 0, POLICIES[1])
    while (twin.world.week < 700) stepCareerWeek(twin.world, twin.rng, POLICIES[1])
    for (let i = 0; i < 208; i++) stepCareerWeek(twin.world, twin.rng, POLICIES[1])

    expect(twin.world.skills.composure, 'the twin is held at the ceiling she was rolled')
      .toBeLessThanOrEqual(rolled)
    expect(mother.world.skills.composure, '⭐ and the mother is past it – the room was real')
      .toBeGreaterThan(rolled)
    expect(
      mother.world.skills.composure - twin.world.skills.composure,
      'and the child is the whole of the difference between two identical seeds',
    ).toBeGreaterThan(0)
  })
})
