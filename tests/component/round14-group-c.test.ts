// ROUND 14, GROUP C – the owner's items 1, 2 and 9 of 06.08, each proved by a MOUNT.
//
// Same discipline as tests/component/season-screen.test.ts: a real world through the real protocol,
// pushed into a real Pinia store, and the assertion is on what the component RENDERS and what
// clicking it does. Every test in here was mutation-verified – the behaviour was broken, the test
// watched go red, and the behaviour restored.
//
// ⚠ NO WORKER IS SPAWNED. `src/worker/client.ts` creates one lazily, so a pre-filled store touches
// nothing; the store's own command methods are stubbed where a test needs to see one dispatched.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, bookVacation } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { vacationPackage } from '../../src/engine/economy'
import type { Offer, Snapshot } from '../../src/shared/protocol'

/** A real career, walked `weeks` weeks. */
function worldAfter(weeks: number, seed = 'r14-group-c') {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

/** A career with a family week booked inside SeasonScreen's 8-week feed, plus the week it went on.
 *  The week is FOUND by asking the engine rather than assumed: `assertPlannable` refuses exam weeks,
 *  entered weeks and weeks already carrying a plan, and which of those a given seed lands on is not
 *  this test's business. */
function careerWithVacation(packageId = 'seaside'): { snapshot: Snapshot; week: number } {
  const world = worldAfter(20)
  world.fundsCents = 500_000_00 // the trip must be affordable; the price itself is not under test
  for (let w = world.week + 1; w <= world.week + 8; w++) {
    try {
      bookVacation(world, w, packageId)
      return { snapshot: toSnapshot(world), week: w }
    } catch {
      // that week refuses a trip – try the next one
    }
  }
  throw new Error('no bookable week in the feed horizon')
}

function mountSeason(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(SeasonScreen, { global: { stubs: { teleport: true } } })
}

// ===========================================================================
// ITEM 1 – a booked vacation can be cancelled, from where booking lives.
//
// The 29.07 ruling put NO control on the painted card ("a booked week is a statement, not a
// control, and cancelling lives where booking does – tap the card and the planner opens"). The
// planner never grew the cancel, and every package has art, so every booking was uncancellable.
// The routing is KEPT and the missing half is built; these tests are that half.
// ===========================================================================
describe('R14-1 – the booked family week is cancellable through the planner', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture really books a trip inside the feed, so nothing below is vacuous', () => {
    const { snapshot, week } = careerWithVacation()
    expect(snapshot.vacations.map((v) => v.week)).toContain(week)
    expect(week).toBeGreaterThan(snapshot.week)
    expect(week).toBeLessThanOrEqual(snapshot.week + 8)
  })

  it('the painted card carries no button of its own – the 29.07 routing is unchanged', () => {
    const { snapshot } = careerWithVacation()
    const wrapper = mountSeason(snapshot)
    const card = wrapper.find('.week-card.vacation')
    expect(card.exists()).toBe(true)
    expect(card.findAll('button')).toHaveLength(0)
    wrapper.unmount()
  })

  it('tapping the card opens the planner ON THE BOOKING, not on a tab whose buttons would throw', async () => {
    // The dead control this replaces: the sheet used to open on Practice for a booked week, and
    // every Book there could only throw assertPlannable's "That week is already a family vacation".
    const { snapshot } = careerWithVacation()
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const sheet = wrapper.findComponent(PlanWeekSheet)
    expect(sheet.exists()).toBe(true)
    expect(sheet.text()).toContain('Cancel the trip')
    // the tab strip stands down with the two panes it switches between
    expect(sheet.find('.plan-tabs').exists()).toBe(false)
    expect(sheet.text()).not.toContain('Court rental')
    wrapper.unmount()
  })

  it('the sheet names the package and the money, so the refund is stated before the press', async () => {
    const { snapshot } = careerWithVacation()
    const label = vacationPackage('seaside')!.label
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const text = wrapper.findComponent(PlanWeekSheet).text()
    expect(text).toContain(label)
    expect(text).toContain('comes back in full')
    wrapper.unmount()
  })

  it('Cancel the trip raises the SAME confirm the fallback row raises, and only then dispatches', async () => {
    const { snapshot, week } = careerWithVacation()
    const store = useGameStore()
    const cancel = vi.spyOn(store, 'cancelVacation').mockResolvedValue(undefined)
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const sheetButtons = wrapper.findComponent(PlanWeekSheet).findAll('button')
    const cancelButton = sheetButtons.find((b) => b.text() === 'Cancel the trip')!
    expect(cancelButton).toBeTruthy()
    await cancelButton.trigger('click')

    // ⚠ NOTHING IS SPENT OR REFUNDED ON THE FIRST PRESS. Money always gets a confirm here.
    expect(cancel).not.toHaveBeenCalled()
    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain(vacationPackage('seaside')!.label)
    expect(dialog.text()).toContain('comes back in full')
    // ...and the sheet has stood down, so the confirm is the only thing being decided
    expect(wrapper.findComponent(PlanWeekSheet).exists()).toBe(false)

    const confirm = dialog.findAll('button').find((b) => b.text() === 'Cancel the trip')!
    await confirm.trigger('click')
    expect(cancel).toHaveBeenCalledWith(week)
    wrapper.unmount()
  })

  it('an UNBOOKED week still opens the two-tab planner – the booked pane is not the new default', async () => {
    // The other half of the pair above: no single mutation can satisfy both.
    const world = worldAfter(20)
    const snapshot = toSnapshot(world)
    const wrapper = mountSeason(snapshot)
    const plan = wrapper.findAll('button').find((b) => b.text() === '+ Plan week')
    expect(plan).toBeTruthy()
    await plan!.trigger('click')

    const sheet = wrapper.findComponent(PlanWeekSheet)
    expect(sheet.find('.plan-tabs').exists()).toBe(true)
    expect(sheet.text()).not.toContain('Cancel the trip')
    wrapper.unmount()
  })
})
