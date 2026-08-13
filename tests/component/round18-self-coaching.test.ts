// ⭐ ROUND-18 #4 – THE SELF-COACHING TICK, AND THE PANEL IT LOCKS.
//
// The owner, 13.08, having already ruled the shape: «Галочка самокоучинга – она дублирующий элемент
// управления для отказа от коуча, мы это уже обсуждали. Пока галочка не стоит – вся панель
// неактивна, на ней можно просто дефолты оставить, а можно вообще всё убрать (можно и твой замок
// поверх нарисовать оверлеем с коротким пояснением).»
//
// ⚠ WHAT THIS IS NOT, and it is the reason every claim below is about the SCREEN. There is no new
// engine state: `coachTier === 'self'` is the bottom rung of the one coach ladder that has shipped
// since v23, the tick READS `coachId` and writes nothing, and `growWeek` still multiplies
// `trainFactor(plan)` by `coachFactor(tier, fit)` at every rung. A test asserting anything about
// what a locked week is WORTH would be asserting a change nobody made.
//
// ⚠ WHY IT IS MOUNTED. The three claims are "the tick reads the career", "every control is dead"
// and "the press reaches the confirm that already exists" - rendered state and dispatch, none of
// which a source pin can see. The disabled state is read off the ELEMENTS (`disabled`, and
// `aria-checked` for the tick, which is what a screen reader reads) rather than off a class name: a
// panel that merely LOOKS locked is the defect, not the fix.
//
// ⚠ MUTATION-VERIFIED – seven mutations, each one watched failing before the test was believed, and
// each recorded with what it actually reddened rather than with what it was expected to:
//   1. the `!panelLive` arm dropped from `locked()` -> "EVERY box in the grid is dead" goes red
//      ALONE, and it reports "15 of 35 boxes are still pressable" – the other 20 are the engine's
//      own three limits, which is exactly why the panel lock has to be its own arm.
//   2. `:disabled="game.busy || !panelLive"` back to `:disabled="game.busy"` on the presets -> "and
//      so are the three presets" goes red alone. The pills are a second writer of the same week, so
//      a lock that only reaches the grid is a lock with a hole in it, and these are two tests.
//   3. `selfCoached` pinned to `true` -> SEVEN red: the whole coach-hired half of this file plus
//      round-17's twin of it, while every self-coached test stays green. The asymmetry is the point
//      – the panel was never wrong for a family coaching her itself.
//   4. `toggleSelf` emitting `coaches` in both directions -> both confirm tests go red and the
//      untick test stays green. That pair IS the control: one door, two different rooms.
//   5. `toggleSelf` calling `game.setPlan(...)` before it emits -> "the tick did not touch the week"
//      goes red in BOTH directions while every confirm assertion still passes, which is what makes
//      "opens the confirm" and "changes nothing by itself" one honest test rather than two halves.
//   6. the lock's `v-if="!panelLive"` deleted -> the self-coached "no lock" test goes red, with
//      round-17's twin ("says nothing about a coach when nobody is being paid") beside it.
//   7. `lockTitle` reduced to a nameless "Your coach sets her week." -> the lock test goes red on
//      the NAME, which is the half that answers "why can I not touch this" with a person.
//   8. `.hw-panel { position: relative }` -> `static` -> "the lock is drawn OVER the panel" goes red
//      alone. That one declaration is the difference between the treatment the owner chose and an
//      explanation shoved into the flow above a live-looking grid.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HerWeekTab from '../../src/components/HerWeekTab.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot, type WeekPlan } from '../../src/shared/protocol'

/** A real career through the real engine, so the coach on it is one the roster actually produced and
 *  `coachId` is the engine's own answer rather than a poked field. `self` is the one tier
 *  `openingCoachId` returns `null` for, which is what makes it the self-coached case. */
function careerSnapshot(coachTier: CoachTier, seed = `r18-self-${coachTier}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** The tab alone, with both commands stubbed – nothing here wants a round trip, and every test in
 *  this file is allowed to assert that a command was NOT sent. */
function mountTab(coachTier: CoachTier) {
  const store = useGameStore()
  store.snapshot = careerSnapshot(coachTier)
  const setPlan = vi.fn(async (_plan: WeekPlan) => {})
  const hireCoach = vi.fn(async (_id: string | null) => {})
  store.setPlan = setPlan as unknown as typeof store.setPlan
  store.hireCoach = hireCoach as unknown as typeof store.hireCoach
  const wrapper = mount(HerWeekTab, { global: { stubs: { teleport: true } } })
  return { wrapper, store, setPlan, hireCoach }
}

/** The tick, read the way a screen reader reads it. `role="checkbox"` + `aria-checked` rather than a
 *  class, for the reason round18-coach.test.ts states about the tabs: a plate that looks right and
 *  announces nothing would pass a class assertion. */
function tick(wrapper: { find: (s: string) => { attributes: (a: string) => string | undefined } }) {
  return wrapper.find('.hw-self')
}

describe('round-18 #4 – with a coach hired the tick is clear and the panel is dead', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the tick is clear, and it says so where it can be heard', () => {
    const { wrapper, store } = mountTab('middle')
    expect(store.snapshot!.coachId, 'the fixture really has somebody hired').not.toBeNull()

    const box = wrapper.find('.hw-self')
    expect(box.exists(), 'the tick is on the tab').toBe(true)
    expect(box.attributes('role')).toBe('checkbox')
    expect(box.attributes('aria-checked'), 'nobody has ticked "I coach her myself"').toBe('false')
    // ...and it is still pressable, because it is the way out of the state it is reporting.
    expect(box.attributes('disabled'), 'the tick itself stays live').toBeUndefined()
    wrapper.unmount()
  })

  it('EVERY box in the grid is dead – all thirty-five of them, whatever the week holds', () => {
    const { wrapper } = mountTab('middle')
    const boxes = wrapper.findAll('input.hw-box')
    expect(boxes.length, 'five kinds by seven days').toBe(35)
    const live = boxes.filter((b) => b.attributes('disabled') === undefined)
    // Named with the count, because "some box is live" is the failure and the message should say
    // which. The claim is the owner's own «вся панель неактивна» and it is the whole panel.
    expect(live.length, `${live.length} of 35 boxes are still pressable`).toBe(0)
    wrapper.unmount()
  })

  it('...and so are the three presets, which are a second way to write the same week', () => {
    // A preset is `setPlan` in one press. Disabling the grid and leaving the pills would leave the
    // panel writable through the fast path, which is the exact hole a class-only lock would leave.
    const { wrapper } = mountTab('middle')
    const pills = wrapper.findAll('.hw-presets .option-pill')
    expect(pills.length).toBe(3)
    for (const pill of pills) expect(pill.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('the lock is drawn OVER the panel, and the panel is still there underneath it', () => {
    // ⚠ WHICH OF THE OWNER'S THREE TREATMENTS THIS IS, checked rather than described. He allowed
    // dead defaults, no controls at all, or a lock overlay; this is the third, and the third is only
    // the third if the dials are still on the page and the lock is laid on top of them. An overlay
    // that pushed the panel down would be a fourth thing nobody chose, and it is one missing
    // `position: relative` away - happy-dom has no layout, but it does have the cascade.
    //
    // ⚠ MUTATION-VERIFIED: `position: relative` dropped from `.hw-panel` -> this goes red alone.
    const store = useGameStore()
    store.snapshot = careerSnapshot('middle')
    const wrapper = mount(HerWeekTab, { attachTo: document.body })

    const panel = wrapper.find('.hw-panel')
    const lock = wrapper.find('.hw-lock')
    const dials = wrapper.find('.hw-dials')
    expect(panel.exists() && lock.exists() && dials.exists()).toBe(true)
    expect(getComputedStyle(panel.element).position, 'the panel is what the lock is positioned in').toBe(
      'relative',
    )
    expect(getComputedStyle(lock.element).position, 'and the lock is laid over it').toBe('absolute')
    // The defaults are still visible under it - dimmed, which is the LOOK of the lock, while
    // `disabled` above is the mechanism.
    expect(Number(getComputedStyle(dials.element).opacity)).toBeLessThan(1)
    expect(wrapper.findAll('input.hw-box').length, 'the week is still drawn under the lock').toBe(35)
    wrapper.unmount()
  })

  it('the lock says WHO has the week and HOW to take it back – and claims nothing about the numbers', () => {
    const { wrapper, store } = mountTab('middle')
    const lock = wrapper.find('.hw-lock')
    expect(lock.exists(), 'the overlay is drawn over the panel').toBe(true)

    const name = store.snapshot!.coachMarket.find((r) => r.current)?.name
    expect(name, 'the fixture names its coach').toBeTruthy()
    const said = lock.text()
    expect(said, 'the answer to "why can I not touch this" is a person').toContain(name as string)
    expect(said, 'and the way back is the control above it').toContain('I coach her myself')

    // ⚠ THE ENGINE DID NOT CHANGE AND THE COPY MAY NOT SAY IT DID. The plan and the coach are
    // separate multipliers in `growWeek`, so a lock on the pen must not become a claim about the
    // sum. These are the words that would be a lie: the parent's matrix is still what runs.
    for (const lie of ['faster', 'better', 'improve', 'worth more', 'growth']) {
      expect(said.toLowerCase(), `the lock must not claim the engine changed ("${lie}")`).not.toContain(lie)
    }
    wrapper.unmount()
  })
})

describe('round-18 #4 – self-coached, the tick is set and the panel is live', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the tick is set, and there is no lock over anything', () => {
    const { wrapper, store } = mountTab('self')
    expect(store.snapshot!.coachId, 'the fixture has nobody hired').toBeNull()
    expect(tick(wrapper).attributes('aria-checked')).toBe('true')
    expect(wrapper.find('.hw-lock').exists(), 'nothing is locked').toBe(false)
    wrapper.unmount()
  })

  it('the controls are live, and a press still writes the week', async () => {
    const { wrapper, setPlan } = mountTab('self')
    const boxes = wrapper.findAll('input.hw-box')
    const live = boxes.filter((b) => b.attributes('disabled') === undefined)
    // Not "all 35": the three engine limits (a full day, six sessions, four sessions) still disable
    // boxes on a live panel, and that is what tests/component/dials-screen.test.ts is about. What
    // this asserts is that the PANEL is not the thing refusing.
    expect(live.length, 'the grid is pressable').toBeGreaterThan(0)
    for (const pill of wrapper.findAll('.hw-presets .option-pill')) {
      expect(pill.attributes('disabled')).toBeUndefined()
    }

    await live[0].trigger('change')
    expect(setPlan, 'a tick on a live panel is a command').toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('round-18 #4 – ticking it is firing him, and unticking it is not hiring anyone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The whole screen, so "the existing confirm" is the one the Coaches tab opens rather than a
   *  double of it – there is exactly one `ConfirmDialog` for letting a coach go and this proves the
   *  tick reaches THAT one. */
  function mountMarket(coachTier: CoachTier) {
    const store = useGameStore()
    store.snapshot = careerSnapshot(coachTier)
    const setPlan = vi.fn(async (_plan: WeekPlan) => {})
    const hireCoach = vi.fn(async (_id: string | null) => {})
    store.setPlan = setPlan as unknown as typeof store.setPlan
    store.hireCoach = hireCoach as unknown as typeof store.hireCoach
    const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
    return { wrapper, store, setPlan, hireCoach }
  }

  async function openWeekTab(wrapper: ReturnType<typeof mountMarket>['wrapper']) {
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Her week')
    await pill!.trigger('click')
    await nextTick()
  }

  it('TICKING IT WITH A COACH HIRED opens the confirm that already exists, and changes nothing by itself', async () => {
    const { wrapper, store, setPlan, hireCoach } = mountMarket('middle')
    await openWeekTab(wrapper)
    expect(wrapper.find('.hw-self').exists(), 'the tick is on the week tab').toBe(true)
    expect(wrapper.find('.dialog-card').exists(), 'nothing is open yet').toBe(false)

    await wrapper.find('.hw-self').trigger('click')
    await nextTick()

    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists(), 'the release confirm opened').toBe(true)
    // ⚠ IT IS THE EXISTING ONE, WHICH IS WHAT MAKES THE PRICE ONE SENTENCE RATHER THAN TWO. These
    // three phrases are `releaseMessage`'s own, written for the Coaches tab's button and asserted
    // there by tests/component/round17-surfaces.test.ts: the coach by name, that she is self-coached
    // from this week, and what the bill becomes.
    const said = dialog.text()
    const name = store.snapshot!.coachMarket.find((r) => r.current)?.name
    expect(said).toContain(name as string)
    expect(said).toContain('self-coached')
    expect(said).toContain('court time only')

    // AND THE PRESS PERFORMED NOTHING. Not the plan - the tick is not a plan control - and not the
    // release either, which is the confirm's to fire once the question is answered.
    expect(setPlan, 'the tick did not touch the week').not.toHaveBeenCalled()
    expect(hireCoach, 'and did not fire anybody behind the dialog').not.toHaveBeenCalled()
    expect(store.snapshot!.coachId, 'the career still has its coach').not.toBeNull()
    wrapper.unmount()
  })

  it('...and answering that confirm is what lets him go, through the one command that ever could', async () => {
    const { wrapper, hireCoach } = mountMarket('middle')
    await openWeekTab(wrapper)
    await wrapper.find('.hw-self').trigger('click')
    await nextTick()
    const confirm = wrapper
      .findAll('.dialog-card button')
      .find((b) => b.text() === 'Coach her yourself')
    expect(confirm, 'the dialog offers the affirmative in the screen\'s own words').toBeTruthy()
    await confirm!.trigger('click')
    expect(hireCoach).toHaveBeenCalledTimes(1)
    expect(hireCoach.mock.calls[0][0], 'releasing is `hireCoach(null)` and nothing else').toBeNull()
    wrapper.unmount()
  })

  it('UNTICKING IT SELF-COACHED hires nobody – it sends the player to the list where a person is chosen', async () => {
    const { wrapper, setPlan, hireCoach } = mountMarket('self')
    // Self-coached the screen already lands on Her week (round-18 #3), so this is where the player is.
    expect(wrapper.find('.hw-self').attributes('aria-checked')).toBe('true')

    await wrapper.find('.hw-self').trigger('click')
    await nextTick()

    // The list, not a hire and not a dialog: a coach is a person and the tick names none.
    expect(wrapper.findAll('.cm-row').length, 'the coaches list is what opened').toBeGreaterThan(3)
    expect(wrapper.findAll('.hw-row').length, 'and the dials are behind it now').toBe(0)
    expect(wrapper.find('.dialog-card').exists(), 'nothing was asked, because nothing was decided').toBe(false)
    expect(hireCoach, 'nobody was hired').not.toHaveBeenCalled()
    expect(setPlan, 'and the week was not touched').not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
