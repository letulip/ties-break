// ROUND 28 ITEM 8, THE FOLLOW-UP – THE SAME STRIP ON THE SUPPORT STAFF TAB, AND IT IS THE SAME ONE.
//
// The owner, having approved the strip on the Coaches tab («это хорошо»): «а мы можем эту шкалу на
// вкладке массажиста тоже показывать?»
//
// ⭐ HIS REASONING IS THE GOOD PART, AND IT DECIDES WHAT THIS FILE MEASURES. The masseur's salary is
// one of the lines that strip TOTALS, and the dial that sets its size lives on that tab – so the one
// screen where a player chooses a rung was the one screen that could not see what the rung does to
// the household's week. §3 below is that sentence as an assertion.
//
// ⚠⚠ AND THE DEFECT THIS FILE EXISTS TO PREVENT IS NOT "the strip is missing" – it is "the strip is
// there TWICE". Two tabs quoting one figure from two computations drift apart on the first template
// edit, and that is the exact shape of the bug this strip was written to fix one level down: the
// coaching meter beside it read the current ROSTER ROW's price instead of `coachBilling.weeklyCents`
// and told a self-coached family it was committing $0.00 a week while it paid court rent. So §2 is
// the load-bearing test in this file: BOTH surfaces, ONE world, and the SAME string.
//
// HOW THE SHARING IS ACTUALLY GUARANTEED, because a test can only witness it: `HouseholdStrip.vue`
// takes NO PROPS. It reads `snapshot.coachBilling.household` itself, so a host cannot hand it a
// different number, and there is nothing for a second implementation to be.
//
// ⚠ MUTATION-VERIFIED, three mutations, each applied alone and reverted. What each ACTUALLY
// reddened, measured rather than predicted – and the ASYMMETRY between A and B is the whole record:
//
//   A. THE SHARED SOURCE MOVED – `householdWeekly` with the masseur term forced to 0 -> tests in
//      BOTH files redden together: §1 and §2's second case and §3 here, plus §1 and §2 of
//      round28-household-block.test.ts (the Coaches tab's own file). Five reds across two surfaces
//      from one engine edit is what "they read the same source" looks like from the outside.
//   B. ⭐⭐ THE SHARING BROKEN – `<HouseholdStrip />` on the Support staff tab replaced by
//      hand-rolled markup quoting `coachBilling.weeklyCents` alone, i.e. the second implementation
//      this file exists to forbid, making exactly the mistake a copy plausibly makes (forgetting the
//      masseur) -> §1's hired test, BOTH of §2 and §3 redden, and round28-household-block.test.ts
//      stays ENTIRELY GREEN. That asymmetry is the proof: the Coaches-tab file cannot see a second
//      implementation on the other tab, and §2 can. One surface moved and the parity test caught it.
//   C. the dial handler disconnected (`pressRung` made a no-op) -> §3 ALONE, with masseur-card.test.ts
//      green beside it – the bonus claim is its own claim and not a restatement of §1.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET: `.budget-household` and `.household-strip` are global (they are the coach
// meter's own visual family), so without this the strip mounts unstyled and §2's comparison would be
// measuring two equally broken renders.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  hireMasseur,
  masseurWeeklyCents,
  setMasseurSessions,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A professional career – her first counting W finish on the never-pruned mark, the ONE door both
 *  the masseur and the shelf open behind. Built through the real protocol. */
function pro(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

/** The Support staff tab, mounted directly – it is a tab component and the strip is at its head. */
function mountStaff(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(SupportStaffTab, { global: { stubs: { teleport: true } } })
}

/** The whole screen, on the Coaches tab – mounted the way round21-coach.test.ts mounts it, by
 *  pressing the pill, so the address of the strip is under test too. */
async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** The rendered strip, as one string – what a parent actually reads. */
function stripText(wrapper: { find: (s: string) => { exists: () => boolean; text: () => string } }): string {
  const strip = wrapper.find('.budget-household')
  expect(strip.exists(), 'the household strip is drawn').toBe(true)
  return strip.text()
}

// =================================================================================================
// 1 – IT IS ON THE TAB HE ASKED FOR, hired and not hired
// =================================================================================================
describe('§1 the strip on the Support staff tab', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ renders with the household figures, and the masseur is in the OUT figure once hired', () => {
    const world = pro('r28f-hired')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurHired).toBe(true)

    // ⚠ REBUILT FROM THE SNAPSHOT'S OTHER FIELDS, never read back off `coachBilling.household` – the
    // claim is that the strip prints the SUM of the lines, and comparing the total with itself is
    // green on any arithmetic at all.
    const expectedOut = snap.coachBilling.weeklyCents + snap.masseurSalaryCents
    const wrapper = mountStaff(snap)
    const text = stripText(wrapper)
    expect(text).toContain(`${formatCents(expectedOut)} out`)
    expect(text).toContain(`${formatCents(snap.coachBilling.weeklyIncomeCents)} in`)
    wrapper.unmount()
  })

  it('...and without him the OUT figure is the training bill alone', () => {
    // The negative half, so the test above cannot pass on a strip that adds a constant either way.
    const world = pro('r28f-unhired')
    const snap = toSnapshot(world)
    expect(snap.masseurHired).toBe(false)
    const wrapper = mountStaff(snap)
    const text = stripText(wrapper)
    expect(text).toContain(`${formatCents(snap.coachBilling.weeklyCents)} out`)
    expect(text).not.toContain(`${formatCents(snap.coachBilling.weeklyCents + snap.masseurSalaryCents)} out`)
    wrapper.unmount()
  })

  it('the strip opens the tab rather than hiding under the payroll – he could not find the last one', () => {
    // ⚠ NOT DECORATION. This chapter exists BECAUSE the masseur was at the bottom of a 1223-line
    // template and the owner never found him («я вот не нашел, кстати»). A budget printed below the
    // roster would repeat that mistake on the same screen, so the position is a claim.
    const world = pro('r28f-order')
    hireMasseur(world, true)
    const wrapper = mountStaff(toSnapshot(world))
    const html = wrapper.html()
    expect(html.indexOf('budget-household'), 'the strip is in the markup').toBeGreaterThanOrEqual(0)
    expect(
      html.indexOf('budget-household') < html.indexOf('data-staff'),
      'the household comes before the first payroll card',
    ).toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// 2 – ⭐⭐ THE GUARD THAT MATTERS: ONE WORLD, TWO SURFACES, ONE NUMBER
// =================================================================================================
describe('§2 both surfaces print the same week', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** ⚠ THE SAME SNAPSHOT OBJECT IS HANDED TO BOTH MOUNTS. Building two worlds from one seed would
   *  compare two computations and could pass while the surfaces read different fields; one object
   *  makes the only possible difference the RENDER. */
  async function bothOf(snap: Snapshot): Promise<{ coaches: string; staff: string }> {
    const coachesWrapper = await mountCoaches(snap)
    const coaches = stripText(coachesWrapper)
    coachesWrapper.unmount()
    const staffWrapper = mountStaff(snap)
    const staff = stripText(staffWrapper)
    staffWrapper.unmount()
    return { coaches, staff }
  }

  it('⭐⭐ the Coaches tab and the Support staff tab print the SAME strip, to the character', async () => {
    const world = pro('r28f-parity')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    const { coaches, staff } = await bothOf(snap)

    // ⚠ THE ARM CONTAINS SOMETHING TO DISAGREE ABOUT: the masseur is hired, so the OUT figure is a
    // sum of two lines rather than one number that would match by coincidence.
    expect(snap.masseurSalaryCents).toBeGreaterThan(0)
    expect(coaches, 'the strip really rendered on the Coaches tab').toContain(' out')
    expect(staff, 'and on the Support staff tab').toContain(' out')
    expect(staff, 'and they are the same sentence').toBe(coaches)
  })

  it('...and they still agree on a household of a different SHAPE – one running at a loss', async () => {
    // Two surfaces that agree on one world and not another are not sharing, they are coinciding. So
    // the second case differs in every way the strip can differ: self-coached (no roster row at all),
    // nothing banked (no interest), the payroll at its DEAREST rung – and therefore a household in
    // the red, which exercises the `short` branch the first case never reaches.
    const world = createWorld('r28f-parity-2', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.bestFinishByTier.w15 = 0 // the professional door, so the payroll can be staffed
    world.fundsCents = 0
    hireMasseur(world, true)
    const dearest = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions
    setMasseurSessions(world, dearest)

    const snap = toSnapshot(world)
    expect(snap.coachBilling.household.netCents, 'this household really is short').toBeLessThan(0)
    const { coaches, staff } = await bothOf(snap)
    expect(staff, 'the losing case reads identically too').toBe(coaches)
    expect(staff, 'and it says which way it points').toContain('short')
  })
})

// =================================================================================================
// 3 – ⭐ AND THE DIAL MOVES IT, WHICH IS THE WHOLE REASON HE ASKED
// =================================================================================================
describe('§3 pressing a rung moves the household figure on the same tab', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ the OUT figure moves by exactly the difference between the two rungs', async () => {
    const world = pro('r28f-dial')
    hireMasseur(world, true)
    const rungs = ECONOMY.masseur.rungs
    const cheapest = rungs[0].sessions
    const dearest = rungs[rungs.length - 1].sessions
    expect(dearest, 'the market really sells more than one rung').not.toBe(cheapest)

    setMasseurSessions(world, cheapest)
    const store = useGameStore()
    store.snapshot = toSnapshot(world)
    const before = masseurWeeklyCents(world)

    // ⚠ THE REAL CLICK PATH AND THE REAL ENGINE COMMAND. The store's action is an RPC to a worker
    // that does not exist in a component test, so it is replaced by one that runs the SAME engine
    // function the worker would run and re-snapshots – which keeps the button, the handler and the
    // engine's own pricing under test, and fakes only the transport.
    const spy = vi.spyOn(store, 'setMasseurSessions').mockImplementation(async (sessions: number) => {
      setMasseurSessions(world, sessions)
      store.snapshot = toSnapshot(world)
    })

    const wrapper = mount(SupportStaffTab, { global: { stubs: { teleport: true } } })
    const outBefore = stripText(wrapper)
    expect(outBefore).toContain(`${formatCents(store.snapshot!.coachBilling.weeklyCents + before)} out`)

    const buttons = wrapper.findAll('.staff-rung')
    expect(buttons.length).toBe(rungs.length)
    await buttons[rungs.length - 1].trigger('click')
    await nextTick()

    expect(spy, 'the press really reached the command').toHaveBeenCalledWith(dearest)
    const after = masseurWeeklyCents(world)
    expect(after - before, 'the dearer rung really costs more').toBeGreaterThan(0)

    const outAfter = stripText(wrapper)
    expect(outAfter, 'the strip moved under his thumb').not.toBe(outBefore)
    expect(outAfter).toContain(`${formatCents(store.snapshot!.coachBilling.weeklyCents + after)} out`)
    wrapper.unmount()
    spy.mockRestore()
  })
})
