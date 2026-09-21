// WAVE 9 / T3 – THE SECOND CHILD.
//
// Wave 8 shipped a SCOPE BRAKE – `world.children.length > 0` refused every pregnancy after the
// first – and named W5 as the task that lifts it. This is that task, and the brake is REPLACED
// rather than deleted: the count-aware hazard his design asked for («the repeat hazard reads the
// age window AND the count of children, so a third stays rare rather than routine»), plus one
// cooldown clause that protects the comeback rather than decency.
//
// The rates are his digest's own row and nothing else: «Second child | 28–38 | 1–2% | even less
// influence» (docs/research/life-events-motherhood.md).
//
// ⚠ WHAT THIS FILE MUST ALSO PROVE, and the reason half of it is about the FIRST pregnancy: wave 8's
// whole census was measured under the brake. If lifting it moved a single first-pregnancy number,
// every corridor in the motherhood spec would be describing a model that no longer exists.
// MUTATION-VERIFIED (21.09): `repeatCountFactor 0.5 -> 1` fails «a third is rarer than a second»;
// `repeatCooldownWeeks 52 -> 0` fails the cooldown case; pointing the repeat curve at
// `perWeekByAge` fails «the second child has its own window». All reverted.

import { describe, it, expect } from 'vitest'
import { createWorld, kidAgeExact, pregnancyChanceAt, pregnancyEligible, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import type { LoveEpisode } from '../src/shared/protocol'

function weekAtAge(world: WorldState, years: number): number {
  let w = 0
  while (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) < years) w += 1
  return w
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `ep-${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    latchedWeek,
    partnerName: 'Nadia',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
  }
}

/** A married career standing at `age`, with `born` children delivered `sinceBirth` weeks ago. */
function mother(seed: string, age: number, born: number, sinceBirth = 200): WorldState {
  const world = createWorld(seed)
  world.week = weekAtAge(world, age)
  world.loveEpisodes = [married(world.week - 208, world.week - 156)]
  world.children = Array.from({ length: born }, (_, i) => ({
    bornWeek: world.week - sinceBirth - i * 60,
    sex: 'girl' as const,
  }))
  return world
}

describe('wave 9 T3 – the brake is replaced by a hazard, not deleted', () => {
  it('⭐⭐⭐ a mother is eligible again – the clause wave 8 named W5 as the lifter of', () => {
    const world = mother('w9-t3-lift', 30, 1)
    expect(world.children.length, 'she has a child').toBe(1)
    expect(pregnancyEligible(world), '⚠ wave 8 answered false here BY DESIGN; W5 answers true').toBe(true)
    expect(pregnancyChanceAt(world), 'and the hazard is live, not zero').toBeGreaterThan(0)
  })

  it('⭐ the second child has its OWN window – open at 30, shut at 26 where the first curve was open', () => {
    const young = mother('w9-t3-young', 26, 1)
    const middle = mother('w9-t3-mid', 30, 1)
    expect(pregnancyChanceAt(young), '⚠ 26 is inside the FIRST curve and outside the repeat one')
      .toBe(0)
    expect(pregnancyChanceAt(middle), 'the digest\'s second-child window opens at 28').toBeGreaterThan(0)
    // ...and it closes later than the first curve's 35, which is the other half of «a later window»
    const late = mother('w9-t3-late', 36, 1)
    expect(pregnancyChanceAt(late), 'a second child is still possible at 36').toBeGreaterThan(0)
  })

  it('⭐ and it is LOWER than the first pregnancy\'s rate at the same age – his digest\'s 1–2 vs 2–4', () => {
    const first = mother('w9-t3-cmp-a', 30, 0)
    const second = mother('w9-t3-cmp-b', 30, 1)
    expect(pregnancyChanceAt(second)).toBeLessThan(pregnancyChanceAt(first))
  })

  it('⭐⭐ a third is rarer than a second, and a fourth rarer again – the count in the term', () => {
    const second = pregnancyChanceAt(mother('w9-t3-c1', 30, 1))
    const third = pregnancyChanceAt(mother('w9-t3-c2', 30, 2))
    const fourth = pregnancyChanceAt(mother('w9-t3-c3', 30, 3))
    expect(third).toBeLessThan(second)
    expect(fourth).toBeLessThan(third)
    expect(third / second, 'the factor is the constant and not a coincidence')
      .toBeCloseTo(ECONOMY.motherhood.repeatCountFactor, 5)
  })

  it('⚠ the cooldown refuses inside the year after a birth, and opens on its far side', () => {
    const cool = ECONOMY.motherhood.repeatCooldownWeeks
    expect(pregnancyEligible(mother('w9-t3-cd1', 31, 1, cool - 1)), 'inside the cooldown').toBe(false)
    expect(pregnancyEligible(mother('w9-t3-cd2', 31, 1, cool)), 'on its far side').toBe(true)
  })

  it('⚠⚠ AND EIGHT WEEKS AFTER A BIRTH IS REFUSED – the claim, stated without the constant in it', () => {
    // ⚠ THE CASE ABOVE CANNOT SEE A COOLDOWN OF ZERO and this one exists because of that: it reads
    // `repeatCooldownWeeks` on both sides, so it MOVES WITH the constant and stays green however
    // small the constant becomes. Caught by mutating to 0 and watching the file stay green (21.09),
    // which is the same defect class as a test posing the state it checks. A fixed eight weeks is
    // the behavioural claim the mechanic actually makes: a pregnancy may not start in the weeks the
    // comeback is being decided, whatever the constant is tuned to.
    expect(pregnancyEligible(mother('w9-t3-cd3', 31, 1, 8)), 'eight weeks after a birth').toBe(false)
  })

  it('⚠⚠ AND THE FIRST PREGNANCY IS UNTOUCHED – every wave-8 corridor still describes this model', () => {
    // A career with no children reads the shipped curve at every rung, unchanged. If this case ever
    // fails, the motherhood spec's census, its age distribution and its decision rates are all
    // describing a model the engine no longer runs.
    for (const [age, expected] of [[24, 0.02], [27, 0.03], [30, 0.04], [34, 0.03], [35, 0]] as const) {
      const world = mother(`w9-t3-first-${age}`, age, 0)
      expect(pregnancyChanceAt(world), `age ${age} on the first curve`).toBeCloseTo(expected / 52, 10)
    }
    const childless = mother('w9-t3-first-gate', 30, 0)
    expect(pregnancyEligible(childless), 'and the gate still opens for a first pregnancy').toBe(true)
  })
})
