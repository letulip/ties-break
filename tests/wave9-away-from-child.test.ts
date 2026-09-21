// WAVE 9 / T2 – THE ROAD COSTS HER SOMETHING AT HOME.
//
// His ruling of 21.09 chose the SPIRIT shape over the money one: a fare is something she already
// pays and would have read as a tax, while a week away from a small child belongs to the layer that
// prices weeks. The mechanic is one line in `weekPerturbation` behind one predicate.
//
// ⚠⚠ TWO ARMS, AND THE SECOND ONE IS WHY THIS FILE IS LONGER THAN THE MECHANIC.
//
//   A. THE PREDICATE, posed – the band (three weeks against four) and the age window. It uses the
//      `roadWeeks` idiom `tests/wave7-spouse-view.test.ts` already established for this exact seam,
//      because a THRESHOLD is arithmetic and a posed pair is the honest way to read an arithmetic
//      boundary from both sides.
//   B. ⭐⭐⭐ THE WALK, and it exists because arm A on its own is the defect class this layer has
//      caught four times: a test that poses the state the code reads proves the arithmetic and says
//      NOTHING about whether any career can reach it. So B walks a married career to a real birth on
//      the engine's own stream, ENTERS real events through `enterEvent`, and lets the finance phase
//      write the travel rows the predicate reads. Nothing in arm B is written by the test except the
//      entries a player would click.
//
// MUTATION-VERIFIED (21.09, exit codes from files): `awayFromSmallChild: -2 -> 0` turns arm B's
// decisive case RED («the child cost her something»), and `childSmallWeeks: 156 -> 0` turns arm A's
// window case RED. Both reverted.

import { describe, it, expect } from 'vitest'
import { createWorld, kidAgeExact, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { accrueSpirit } from '../src/engine/spirit'
// ⚠ THE BENCH'S OWN WALKER, the one `tests/coachTravelEdgeFixtures.ts` already walks the frozen
// careers with. A test may not invent a second way to live a career.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
// ⚠ THE BAND IS THE TILE'S OWN CONSTANT AND NOT A 4 TYPED HERE – the predicate under test reads
// exactly this, so a retune moves both sides together and this arm cannot quietly pass a band that
// the mechanic no longer uses.
import { AWAY_OFTEN } from '../src/engine/kidLife'

function weekAtAge(world: WorldState, years: number): number {
  let w = 0
  while (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) < years) w += 1
  return w
}

/** The posed idiom `tests/wave7-spouse-view.test.ts` established for this seam: travel-billed weeks
 *  in the trailing window, written as the finance phase writes them. */
function roadWeeks(world: WorldState, n: number): void {
  world.financeWeeks = []
  for (let i = 0; i < n; i++) {
    world.financeWeeks.push({ week: world.week - i, byCategory: { travel: -50000 } })
  }
}

/** The spirit the weekly pass leaves her on, for a world exactly as handed in. ⚠ A CLONE, so the
 *  caller's world is never advanced by the measurement itself. */
function spiritAfterOneWeek(world: WorldState): number {
  const probe = structuredClone(world)
  accrueSpirit(probe, false, [])
  return probe.spirit ?? ECONOMY.spirit.baseline
}

// =================================================================================================
// A. THE PREDICATE – the band and the window, both sides of each
// =================================================================================================
describe('wave 9 T2 A – the two halves of «away from a small child»', () => {
  it('⭐ the road is the friends tile\'s own band: three billed weeks is not a stretch, four is', () => {
    const world = createWorld('w9-t2-band')
    world.week = weekAtAge(world, 27)
    world.children = [{ bornWeek: world.week - 10, sex: 'girl' }]
    roadWeeks(world, 3)
    const atThree = spiritAfterOneWeek(world)
    roadWeeks(world, 4)
    const atFour = spiritAfterOneWeek(world)
    expect(atFour, '⚠ the fourth billed week of the trailing twelve is what costs her').toBeLessThan(atThree)
  })

  it('⭐ «small» is the child\'s own age, and a grown child costs nothing', () => {
    const world = createWorld('w9-t2-window')
    world.week = weekAtAge(world, 33)
    roadWeeks(world, 6)
    world.children = [{ bornWeek: world.week - (ECONOMY.motherhood.childSmallWeeks - 1), sex: 'girl' }]
    const small = spiritAfterOneWeek(world)
    world.children = [{ bornWeek: world.week - (ECONOMY.motherhood.childSmallWeeks + 1), sex: 'girl' }]
    const grown = spiritAfterOneWeek(world)
    expect(small, '⚠ inside the window the road costs her; outside it the same road is free').toBeLessThan(grown)
  })

  it('⚠ and a career with NO child is untouched – the first test the predicate makes', () => {
    const world = createWorld('w9-t2-none')
    world.week = weekAtAge(world, 27)
    roadWeeks(world, 8)
    const childless = spiritAfterOneWeek(world)
    world.children = [{ bornWeek: world.week - 10, sex: 'girl' }]
    expect(spiritAfterOneWeek(world), 'the child is the whole difference between these two worlds')
      .toBeLessThan(childless)
  })
})

// =================================================================================================
// B. ⭐⭐⭐ THE WALK – a REAL career's travel bills, written by the finance phase and nothing else
// =================================================================================================
//
// ⚠⚠ THE FIRST SHAPE OF THIS ARM WAS WRONG AND THE ARM ITSELF SAID SO, which is the whole reason it
// exists. It posed a career at twenty-seven, walked it to a real birth, and then tried to enter
// events – and the engine refused every one of them: «World Tour 500 takes the top 120 – she has no
// professional ranking yet». A career posed at an age has never PLAYED, so nothing will admit her
// and nothing bills travel. The test was measuring an empty calendar and would have been green on
// any threshold at all if the assertion had been weaker.
//
// So the career is WALKED from fourteen through the bench's own opener – the same `openCareer` /
// `stepCareerWeek` the frozen-career fixtures use – until she has a professional ranking that opens
// doors. The marriage row and the child row are then posed, exactly as every wave-8 test poses them,
// because neither is the thing under test: what is under test is that the ENGINE's own travel bills
// reach the spirit pass, and every travel row below is written by the finance phase.
describe('wave 9 T2 B – the travel rows are the engine\'s, on a career that really played', () => {
  it('⭐⭐⭐ a walked career, a posed child, and the road she really paid for costs her spirit', () => {
    const { world, rng } = openCareer(PRESETS[2], 0, POLICIES[1])
    // to twenty-two: far enough that the W rungs admit her, cheap enough for a unit file
    const to = weekAtAge(world, 22)
    while (world.week < to) stepCareerWeek(world, rng, POLICIES[1])

    const billed = world.financeWeeks.filter(
      (w) => w.week > world.week - 12 && w.week <= world.week && (w.byCategory.travel ?? 0) < 0,
    ).length
    expect(billed, '⚠⚠ THE ARM ITSELF: this career really travelled in the trailing window')
      .toBeGreaterThanOrEqual(AWAY_OFTEN)

    const childless = spiritAfterOneWeek(world)
    world.children = [{ bornWeek: world.week - 20, sex: 'girl' }]
    expect(spiritAfterOneWeek(world), '⭐ the child is the only difference, and the road now costs her')
      .toBeLessThan(childless)
  })
})
