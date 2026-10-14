// ROUND 51 ITEM 6 – THE HOUSEHOLD STRIP COUNTS CASH ONLY, AND SAYS NOTHING ABOUT THE SHELF'S PAPER.
//
// THE OWNER, 13.10, item 6: «При этом (п.5) на экране Рынка тренеров написано, что доход 1814 в
// неделю, но его нигде не видно, это тоже надо проверить, что это за доход вообще, что в этой
// цифре.» And his ruling that evening, once the figure was traced: «вообще не должно его быть на
// экране тренеров, мы им не оперируем там никак, он только заблуждает».
//
// ⚠⚠ WHAT THE FIGURE WAS. His save read «$1,814 in – $627 out – $1,187 left over». The cash that
// really arrives was $425 a week: the other $1,389 was the houses and the fund getting dearer on
// PAPER (`revalueAssets` writes only `valueCents`; no cash moves until a sale), which
// `householdWeekly` had been adding to IN since round 28 #8. The honest strip reads $425 in – $627
// out – $202 SHORT, and these arms hold it to that shape.
//
// WHAT THIS FILE HOLDS:
//   §1  the ENGINE (`householdWeekly`): a rising asset adds nothing to IN, a falling one adds nothing
//       to OUT, what the shelf costs to KEEP (cash) stays in OUT, and a mixed shelf moves the totals
//       by that upkeep alone. Every expectation is rebuilt from the world's OTHER functions, never
//       read back off `household` – a figure compared with itself moves with the defect.
//   §2  the SCREEN: the sentence about the shelf is gone for a rising and a falling shelf alike while
//       the upkeep sentence stays, and a household whose paper gain would have flipped it to
//       «left over» now reads «short» – the magnitude printed, the sign carried by the word (the
//       component's own rule), no minus sign, the figure marked `short`.
//
// ⚠ WHY THE NEGATIVE SHAPE IS SAFE ON A PHONE WITHOUT A LAYOUT MEASUREMENT: happy-dom has no layout,
// so "fits 375px" cannot be asserted here. What can be shown is that the new shape is NOT WIDER than
// the one it replaces – "short" is shorter than "left over", and the magnitude has the same digits
// as the positive net it was – and `.budget-household` is a wrapping flex row (`flex-wrap: wrap`)
// either way.
//
// ⚠ MUTATION-VERIFIED (13.10, round 51 B7), two mutations, each applied alone with `git apply -R` of
// its own diff and restored with the forward apply (the three source files hashed identically before
// and after both). What each ACTUALLY reddened, measured rather than predicted:
//
//   A. the ENGINE half reverted (`householdWeekly` back to `+ Math.max(0, shelfCents)` in IN and
//      `+ Math.max(0, -shelfCents)` in OUT) -> 8 reds across 5 files: §1's three arms and §2's
//      negative-net arm here, the re-aimed §3 figure arm in round28-household-block, the new parity
//      arm in round28-household-shared, the boat arm in round29-shop-elite and the strip-total arm in
//      round29p5-business. §2's two hint arms stay GREEN, correctly: they ask the template.
//   B. the TEMPLATE half reverted (the shelf paragraph and its `shelfCents` read put back) -> 4 reds:
//      both hint arms here, the re-aimed note arm in round28-household-block and the household-strip
//      copy arm in i18n-l2-6. §1 and the negative-net arm stay GREEN, correctly: they ask the engine.
//   The two halves redden DISJOINT sets, which is what says they are two claims and not one.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN SHEET, for the same reason as the household files beside this one.
import '../../src/style.css'
import HouseholdStrip from '../../src/components/HouseholdStrip.vue'
import { useGameStore } from '../../src/stores/game'
import {
  buyAsset,
  createWorld,
  hireMasseur,
  masseurWeeklyCents,
  setMasseurSessions,
  toSnapshot,
  weeklyAssetUpkeepCents,
  type WorldState,
} from '../../src/engine/world'
import { householdWeekly } from '../../src/engine/world/coachMarket'
import { ECONOMY, parentIncomeForWeekCents } from '../../src/engine/economy'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A professional career with a full purse, so the shelf can be stocked. Built through the real
 *  protocol, exactly as the household files beside this one build theirs. */
function pro(seed: string, profile = DEFAULT_PROFILE): WorldState {
  const world = createWorld(seed, profile)
  world.bestFinishByTier.w15 = 0
  world.fundsCents = 20_000_000_00
  return world
}

/** The training line handed to `householdWeekly`; the engine takes it IN, so any number will do. */
const TRAINING = 500_00

/** What the TILL says arrives and leaves in a week, rebuilt from the world's OTHER functions: the
 *  parents' weekly money (a fresh career holds no kit deal and no business, so that is the whole of
 *  IN) and the three bills the till charges – training, the masseur's payroll, the upkeep. */
function cash(world: WorldState) {
  return {
    income: parentIncomeForWeekCents(world.seed, world.profile.background, world.week),
    out: TRAINING + masseurWeeklyCents(world) + weeklyAssetUpkeepCents(world),
  }
}

const flat = (text: string) => text.replace(/\s+/g, ' ').trim()

function mountStrip(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(HouseholdStrip)
}

// =================================================================================================
// 1 – THE ENGINE: CASH IN, CASH OUT, AND THE PAPER NOWHERE
// =================================================================================================
describe('§1 householdWeekly counts cash and nothing else', () => {
  it('⭐⭐ a RISING asset adds nothing to IN – the paper gain is not a weekly line', () => {
    const world = pro('r51-6-rise')
    hireMasseur(world, true)
    buyAsset(world, 'house-first')
    const house = householdWeekly(world, TRAINING)
    expect(house.shelfCents, 'the house really gains on paper, or this arm is vacuous').toBeGreaterThan(0)
    const want = cash(world)
    expect(house.incomeCents, 'IN is the cash that arrives').toBe(want.income)
    expect(house.outgoingCents).toBe(want.out)
    expect(house.netCents).toBe(want.income - want.out)
    // The pre-ruling figure, asserted NOT to hold: `Math.max(0, shelfCents)` used to ride into IN.
    expect(house.incomeCents).not.toBe(want.income + house.shelfCents)
  })

  it('⭐⭐ a FALLING asset adds nothing to OUT – and what it costs to KEEP still does', () => {
    const world = pro('r51-6-fall')
    hireMasseur(world, true)
    buyAsset(world, 'car-sensible')
    const car = householdWeekly(world, TRAINING)
    expect(car.shelfCents, 'the car really loses value, or this arm is vacuous').toBeLessThan(0)
    const upkeep = weeklyAssetUpkeepCents(world)
    expect(upkeep, 'and it really costs something to keep (round 30 #15)').toBeGreaterThan(0)
    expect(car.upkeepCents).toBe(upkeep)
    const want = cash(world)
    expect(car.incomeCents).toBe(want.income)
    expect(car.outgoingCents, 'OUT is training + payroll + upkeep').toBe(TRAINING + masseurWeeklyCents(world) + upkeep)
    expect(car.outgoingCents).toBe(want.out)
    // The pre-ruling figure, asserted NOT to hold: `Math.max(0, -shelfCents)` used to ride into OUT.
    expect(car.outgoingCents).not.toBe(want.out - car.shelfCents)
  })

  it('a MIXED shelf – a house gaining, a car losing – moves the totals by the upkeep alone', () => {
    const bare = pro('r51-6-mixed')
    hireMasseur(bare, true)
    const world = pro('r51-6-mixed')
    hireMasseur(world, true)
    buyAsset(world, 'house-first')
    buyAsset(world, 'car-sensible')
    const before = householdWeekly(bare, TRAINING)
    const after = householdWeekly(world, TRAINING)
    expect(after.shelfCents, 'the memo carries the signed net of the two').not.toBe(0)
    expect(after.incomeCents - before.incomeCents, 'owning things brings no cash into IN').toBe(0)
    expect(after.outgoingCents - before.outgoingCents, 'and puts only the upkeep into OUT').toBe(
      weeklyAssetUpkeepCents(world),
    )
  })
})

// =================================================================================================
// 2 – THE SCREEN: NO SENTENCE ABOUT THE SHELF, AND A SHORTFALL READS AS ONE
// =================================================================================================
describe('§2 the strip on screen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it.each([
    ['house-first', false],
    ['car-sensible', true],
  ])(
    '%s: nothing is said about the shelf, whatever its sign – and the upkeep sentence stays when there is an upkeep',
    (id, mustHaveUpkeep) => {
      const world = pro(`r51-6-hint-${id}`)
      buyAsset(world, id)
      const snap = toSnapshot(world)
      expect(snap.coachBilling.household.shelfCents, 'the shelf really moves').not.toBe(0)
      const upkeep = weeklyAssetUpkeepCents(world)
      if (mustHaveUpkeep) expect(upkeep, 'this rung really has an upkeep').toBeGreaterThan(0)

      const wrapper = mountStrip(snap)
      expect(wrapper.find('.budget-shelf').exists(), 'the shelf paragraph is gone').toBe(false)
      expect(wrapper.text(), 'and so are its words').not.toContain('The shelf is in that')
      // The surviving sentence is byte-identical to what shipped, or absent when there is nothing to keep.
      expect(wrapper.findAll('.hint').map((n) => flat(n.text()))).toEqual(
        upkeep > 0 ? [`Keeping what you own is ${formatCents(upkeep)} a week of that, and it is real money.`] : [],
      )
      wrapper.unmount()
    },
  )

  it('⭐⭐ a household that paper gains would have kept in the black now reads SHORT, to the dollar', () => {
    // The owner's shape: cash coming in is less than cash going out, and a big rising shelf used to
    // sit on top and turn it into «left over». Self-coached and the dearest masseur rung, exactly as
    // `round28-household-shared.test.ts` §2's losing case poses a household in the red – and $5M in a
    // deposit, which gains thousands a week on paper and puts not one dollar in the wallet.
    const world = pro('r28f-parity-2', { ...DEFAULT_PROFILE, coachTier: 'self' })
    hireMasseur(world, true)
    setMasseurSessions(world, ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions)
    buyAsset(world, 'deposit', 5_000_000_00)
    const snap = toSnapshot(world)
    const h = snap.coachBilling.household
    expect(h.shelfCents, 'the deposit really gains on paper').toBeGreaterThan(0)
    expect(h.netCents, 'and in CASH the family is short').toBeLessThan(0)
    expect(h.netCents + h.shelfCents, 'the old arithmetic would have said LEFT OVER – the $1,187 shape').toBeGreaterThan(0)

    const wrapper = mountStrip(snap)
    const figs = flat(wrapper.get('.household-figs').text())
    expect(figs).toContain(`${formatCents(h.incomeCents)} in`)
    expect(figs).toContain(`${formatCents(h.outgoingCents)} out`)
    expect(figs, 'the sign is in the word, the magnitude is the shortfall').toContain(`${formatCents(-h.netCents)} short`)
    expect(figs).not.toContain('left over')
    expect(figs, 'no minus sign anywhere in the figures (the dash is the separator)').not.toMatch(/[-−]\s*\$/)
    expect(wrapper.get('.household-figs strong.short').text(), 'the shortfall figure carries the `short` mark').toBe(
      formatCents(-h.netCents),
    )
    expect(wrapper.find('.budget-shelf').exists()).toBe(false)
    wrapper.unmount()
  })
})
