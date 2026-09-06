import { describe, expect, it } from 'vitest'
import { componentFile } from './worldSource'
import { coachBilling } from '../src/engine/world/coachMarket'
import { coachBillRangeCents, coachById, facilityRateCents, tierOf, weeklyBillSplit } from '../src/engine/coach'
import { ageAtWeek, createWorld } from '../src/engine/world'
import { toSnapshot } from '../src/engine/world/snapshot'
import { DEFAULT_PROFILE } from '../src/shared/protocol/profile'

// =================================================================================================
// U-03 – ONE ARITHMETIC FOR THE COACH'S WEEK
// =================================================================================================
// 05.09 review. `MoneyScreen` and `ThisWeekScreen` each rebuilt the coach's weekly bill out of
// `seed`, through `ageAtWeek` -> `coachById` -> `tierOf`/`facilityRateCents` -> `weeklyBillSplit`
// and `coachBillRangeCents`. Three copies of one sum, and the copies HAD ALREADY DRIFTED: the
// comment those two screens still carry records a December girl being quoted the development rate
// against a bill charged at the professional one for 49 weeks, because the two clocks straddle a
// coach rate row (12-16 / 17-22 / 23+).
//
// The projection makes the drift unreachable: the engine runs the sum once, on the world the till
// bills, and the screens read it. The two claims below are the two halves of that, and each fails
// on the tree before the fix:
//   * the numbers are ON the snapshot and are the engine's own;
//   * the screens no longer IMPORT the generator - which is the half a value assertion cannot make,
//     because a screen that recomputes the same number agrees with it until the day it does not.
describe('U-03: the coach billing is projected, not recomputed', () => {
  const world = createWorld('u03-seed', { ...DEFAULT_PROFILE, background: 'middle' })

  it('the snapshot carries the week range and the split', () => {
    const snap = toSnapshot(world)
    expect(snap.coachBilling.weekRangeCents, 'the spread is on the wire').toHaveLength(2)
    expect(snap.coachBilling.split.totalCents, 'and so is what the week is made of').toBeGreaterThan(0)
  })

  it('and they are the engine s own numbers, not a second spelling', () => {
    // The reference is what a screen USED to compute for itself, spelled out here on purpose: this
    // is the only place that arithmetic is allowed to be written twice, and it is written to be
    // compared, not to be read by a player.
    const age = ageAtWeek(world.week)
    const coach = coachById(world.seed, age, world.coachId)
    const rate = coach ? coach.rateCents : facilityRateCents(age, tierOf(coach))
    const expectedRange = coachBillRangeCents(rate, world.plan, world.profile.background)
    const expectedSplit = weeklyBillSplit({
      rateCents: rate,
      ageYears: age,
      tier: tierOf(coach),
      plan: world.plan,
      background: world.profile.background,
    })
    const billing = coachBilling(world)
    expect(billing.weekRangeCents).toEqual(expectedRange)
    expect(billing.split).toEqual(expectedSplit)
    // ...and the whole the parts add up to is the one the till charges.
    expect(billing.split.totalCents).toBe(billing.weeklyCents)
    expect(billing.split.coachCents + billing.split.facilityCents).toBe(billing.split.totalCents)
  })

  // ⚠ A NEGATIVE CLAIM ABOUT TWO FILES, so it reads `componentFile` - the .vue ALONE. Widening it to
  // `componentLogic` would pull in composables these screens import and trip on a symbol this claim
  // was never about (CLAUDE.md's positive/negative helper rule).
  it.each([
    ['components/screens/MoneyScreen.vue', ['coachBillRangeCents', 'weeklyBillSplit', 'coachById']],
    ['components/screens/ThisWeekScreen.vue', ['coachBillRangeCents', 'coachById', 'facilityRateCents']],
  ])('%s no longer imports the generator', (path, symbols) => {
    const file = componentFile(path)
    const imports = file
      .split('\n')
      .filter((line) => line.startsWith('import '))
      .join('\n')
    for (const symbol of symbols) {
      expect(imports, `${path} still imports ${symbol}`).not.toContain(symbol)
    }
    // Anti-vacuity: the file was read and it does have imports.
    expect(imports.length, 'the import block was found at all').toBeGreaterThan(200)
  })
})
