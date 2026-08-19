// ⭐ ROUND-22 – WHO THE WEEK TAB SAYS HER COACH IS, AND WHY IT MAY NEVER BE `profile.coachTier`.
//
// THE REPORT: «the coach tile reads `coachMarket.find(c => c.current)` rather than `profile.coachTier`,
// so my first attempt left a middle-tier coach under the self-coached child.»
//
// ⚠ THE SHIPPED READING IS THE RIGHT ONE, AND THE PROPOSED SOURCE IS THE DEFECT. Measured before a
// line was changed, on real careers through the real engine:
//
//   * `current` is `world.coachId === coach.id` (engine/world/coachMarket.ts) – a derivation of the
//     ONE field that records who she trains with, not a second opinion about it. A career onboarded
//     at `middle` and released mid-career carries ZERO current rows, at every age band from 14 to 21,
//     for all sixteen roster ids. The tile therefore names nobody the moment the coach goes.
//   * `profile.coachTier` is the ONBOARDING record and `hireCoach` never touches it – world.ts says so
//     over `coachId` ("the two part company the first time the Coach Market is used") and
//     world/player.ts says it again over the match edge ("reading the profile here would hand a fired
//     coach's edge to a self-coaching parent for the rest of the career"). Measured: release the
//     middle-tier coach and `profile.coachTier` is STILL `middle` while `coachId` is null.
//
// So the owner's sentence describes what his first attempt did, and this file is the pin that stops
// it being attempted a second time: two careers whose PROFILE and whose COACH disagree, mounted, with
// the assertions written on the rendered screen.
//
// ⚠ MUTATION-VERIFIED – two mutations of HerWeekTab.vue, each watched failing and then restored, and
// each recorded with the assertion it actually reddened rather than the one it was expected to:
//   1. `selfCoached` -> `(game.snapshot?.profile.coachTier ?? 'self') === 'self'` – the first attempt
//      itself – reddens the RELEASED test ALONE, at «nothing sets her week but the family: expected
//      true to be false»: the lock is drawn back over a self-coached child's week.
//   2. `coachName` -> the first row on the profile's rung instead of the current one reddens the
//      SWAPPED test alone, on the name: «expected 'Carla Sartori sets her week...' to contain 'Carla
//      Lytvyn'» – the tab naming the middle-tier coach at a girl who trains with the budget one. The
//      released test stays green under it, because a screen with no lock prints no name at all, which
//      is why the two cases are one file and not one test.
//
// ⚠ NOT MUTATED, deliberately: `current: world.coachId === coach.id` in engine/world/coachMarket.ts is
// the same reading one file upstream, but it is another agent's path in a shared checkout and a
// temporary edit there is one `git commit` away from being somebody else's problem.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HerWeekTab from '../../src/components/HerWeekTab.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hireCoach, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot, type WeekPlan } from '../../src/shared/protocol'

/** A real career through the real engine, opened on the profile's rung and then handed to `fn` – so
 *  the state under test is one `hireCoach` produced rather than a poked snapshot field. */
function career(seed: string, fn: (world: ReturnType<typeof createWorld>) => void) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  const openingName = nameOf(toSnapshot(world), world.coachId)
  fn(world)
  return { world, snapshot: toSnapshot(world), openingName }
}

/** The name on the row with THIS id – read off `coachId`, which is the authority, so the expectation
 *  never borrows the `current` flag the assertions are about. */
function nameOf(snapshot: Snapshot, id: string | null): string {
  const row = snapshot.coachMarket.find((r) => r.id === id)
  expect(row, `the roster knows ${id}`).toBeTruthy()
  return row!.name
}

function mountTab(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  store.setPlan = vi.fn(async (_plan: WeekPlan) => {}) as unknown as typeof store.setPlan
  store.hireCoach = vi.fn(async (_id: string | null) => {}) as unknown as typeof store.hireCoach
  return mount(HerWeekTab, { global: { stubs: { teleport: true } } })
}

describe('round-22 – the week tab reads who she trains with, not the rung she onboarded on', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a career that HIRED at middle and then let him go names nobody, and locks nothing', () => {
    const { world, snapshot, openingName } = career('r22-released', (w) => hireCoach(w, null))

    // The divergence this test exists for, stated as a fact about the fixture: the profile still
    // remembers the rung, the career no longer has the man.
    expect(world.profile.coachTier, 'the ONBOARDING record is untouched by a release').toBe('middle')
    expect(snapshot.coachId, 'and she is self-coached from this week').toBeNull()
    expect(snapshot.coachMarket.filter((r) => r.current).length, 'so no card is her card').toBe(0)

    // The lock first, because the lock IS the reported symptom: an overlay saying a coach sets the
    // week of a child nobody is coaching.
    const wrapper = mountTab(snapshot)
    expect(wrapper.find('.hw-lock').exists(), 'nothing sets her week but the family').toBe(false)
    expect(wrapper.text(), 'and the man she let go is not on the screen').not.toContain(openingName)
    expect(wrapper.find('.hw-self').attributes('aria-checked'), 'the tick reads the career').toBe('true')
    wrapper.unmount()
  })

  it('a career that SWAPPED down a rung names the coach she has, not the rung she chose', () => {
    // The sharper half: a name is still printed, so a profile-sourced tile would look plausible and
    // be wrong. She onboarded at middle and trains with a BUDGET coach; the lock must say so.
    const budgetId = 'budget-2'
    const { world, snapshot, openingName } = career('r22-swapped', (w) => hireCoach(w, budgetId))

    expect(world.profile.coachTier, 'the profile still says middle').toBe('middle')
    expect(snapshot.coachId, 'while the career says budget').toBe(budgetId)
    const hiredName = nameOf(snapshot, budgetId)
    expect(hiredName, 'the two are different people').not.toBe(openingName)

    const wrapper = mountTab(snapshot)
    const lock = wrapper.find('.hw-lock')
    expect(lock.exists(), 'a hired coach is what locks the panel').toBe(true)
    expect(lock.text(), 'the lock names the coach she actually has').toContain(hiredName)
    expect(wrapper.text(), 'and not the one her onboarding rung would resolve to').not.toContain(openingName)
    wrapper.unmount()
  })
})
