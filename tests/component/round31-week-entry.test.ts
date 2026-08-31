// ⭐⭐ ROUND 31 #1 – ONE SCREEN, TWO ARRIVALS, AND THE TAP'S REASON SURVIVES THE TRIP.
//
// The owner, playing the build: pressing `Next tournament` on Home gives him a page that opens with
// the results of the week just gone, and the whole tournament block only below it. His words are in
// docs/rounds/round-31.md item 1, where they may be quoted in his own language.
//
// ⚠⚠ THE ORDER IS NOT THE DEFECT, AND THIS FILE EXISTS BECAUSE OF THAT. After a tick the week's
// story belongs on top - it is the design's own beat and the reason the tab grows an accent dot on a
// fresh recap - so simply swapping the two blocks would have answered his tap by breaking the
// arrival he never complained about. That is round 30 #1's trade exactly: one reading fixed by
// another going wrong, and he had to ask for it back.
//
// What was missing is that `navigate('week')` named a DESTINATION and threw the REASON away, so the
// screen could not tell his tap from a tick. The fix carries the reason (App.vue's `openWeek`, the
// `entry` prop) and this file holds BOTH arrivals in the same build:
//
//   1. from Home's plate  -> the tournament is first;
//   2. from a resolved week -> the story is first.
//
// ⭐ (2) IS THE ONE THAT MATTERS. It is the regression this change is most likely to cause, and the
// hardest arm of it is the one below where the week resolves WHILE the player is standing on the
// screen he reached from the plate: the tab does not change on that path, so nothing but App.vue's
// own reset can take the top back.
//
// ⚠ MUTATION-VERIFIED, EACH CLAIM AGAINST ITS OWN ARM (measured, not asserted):
//   * dropping `&& !tournamentFirst` / `&& tournamentFirst` from ThisWeekScreen's two `v-if`s
//     - i.e. going back to one card in the old position - turns the Home-plate arms red and leaves
//       the tick arms green;
//   * deleting App.vue's `if (advanced || runClosed) weekEntry.value = 'story'` - or folding it into
//     the `tab.value = 'week'` branch beside it - turns the week-resolves-while-standing-here arm
//     red and leaves every other arm green;
//   * pointing Home's plate back at a plain tab move turns the shell arms red and leaves the
//     prop-level pair green.
// Two of those are the two halves of the trade, and they fail apart, which is the property that
// makes this a net rather than a pair of restatements.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { recapExists } from '../../src/composables/weekRecap'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND `HomeScreen` READS IT AT SETUP. Same shim and same argument
// as tests/component/round28-top-notices.test.ts, quoted there in full: happy-dom is configured here
// without web storage, and the app's own try/catch fallback would swallow the difference rather than
// fail. The test supplies the browser's object; it does not weaken the code.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/**
 * ONE career, walked by the real engine, with something really ENTERED - the only state Home's
 * `Next tournament` plate opens onto, and the only state where this fix does anything.
 *
 * ⚠ ONE WORLD, TWO SNAPSHOTS, AND THAT IS LOAD-BEARING. App.vue's post-advance watcher only counts a
 * week as advanced when `careerId` matches (a fresh `createWorld` per snapshot would read as a
 * career SWITCH and skip every branch this file is about), so the second snapshot has to come from
 * ticking the same world on.
 *
 * ⚠ AND THE ENTRY IS PICKED SEVERAL WEEKS OUT on purpose: a tournament resolving on the tick would
 * set `pending`, `recapExists` would answer false, and the story would be absent rather than
 * demoted - an arm that cannot see the thing it is about. The fixture asserts that it did not.
 */
function enteredCareer(seed: string): { arrival: Snapshot; afterTick: Snapshot } {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const here = toSnapshot(world)
  const target = here.upcoming.find((e) => e.eligible && !e.entered && e.week >= here.week + 3)
  expect(target, 'the fixture must have something she may enter, and not this week').toBeTruthy()
  enterEvent(world, target!.id)
  const arrival = toSnapshot(world)
  tickWeek(world, rng)
  const afterTick = toSnapshot(world)

  // The fixture's own honesty checks. Every arm below asserts about the ORDER of two blocks, so an
  // arm where one of them is not drawn at all would pass on nothing.
  for (const [name, snap] of [
    ['arrival', arrival],
    ['afterTick', afterTick],
  ] as const) {
    expect(snap.careerId, `${name} must be the same career`).toBe(arrival.careerId)
    expect(recapExists(snap), `${name} must have a week story to tell`).toBe(true)
    expect(snap.upcoming.some((e) => e.entered), `${name} must still have a tournament entered`).toBe(true)
  }
  expect(afterTick.week, 'the second snapshot is a week later').toBe(arrival.week + 1)
  return { arrival, afterTick }
}

/**
 * The shell, mounted, past the splash, sitting on Home with a real career loaded.
 *
 * ⚠ THE STORE IS FILLED AFTER THE MOUNT, NOT BEFORE - round28-top-notices.test.ts's finding, argued
 * there in full: `App.vue` calls `game.init()` in `onMounted`, reaches for a Web Worker this runner
 * does not have, and the store flips itself to `phase: 'recovery'`. Letting that settle and THEN
 * declaring the store ready is what puts the tab shell on screen.
 */
async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  store.snapshot = snapshot
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  return wrapper
}

/**
 * WHAT IS ON TOP, read off the document in document order.
 *
 * `querySelectorAll` returns matches in tree order, so one call answers "are both blocks drawn" and
 * "which comes first" together - and an assertion of the whole list fails if either half is wrong,
 * which a `toBe('tournament')` on the first element would not.
 */
function blockOrder(root: Element): string[] {
  return [...root.querySelectorAll('.recap-card, .next-tourn')].map((el) =>
    el.classList.contains('recap-card') ? 'story' : 'tournament',
  )
}

function weekScreenOf(wrapper: VueWrapper): Element {
  const screen = wrapper.findComponent(ThisWeekScreen)
  expect(screen.exists(), 'the This-week screen must be the one on show').toBe(true)
  return screen.element
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// =================================================================================================
describe('round 31 #1 - the screen honours what the arrival was for', () => {
  // The prop on its own, with no shell in the way: the two orders, from the same fixture, decided by
  // nothing but `entry`. If this pair cannot be told apart, nothing above it can be either.
  it('⭐ `entry="tournament"` puts the tournament in front of the story', () => {
    useGameStore().snapshot = enteredCareer('r31-prop-tournament').arrival
    const w = mount(ThisWeekScreen, { props: { entry: 'tournament' }, attachTo: document.body })
    expect(blockOrder(w.element)).toEqual(['tournament', 'story'])
    w.unmount()
  })

  it('⭐ the default is the story on top, which is what a tick, the tab and a reload all mean', () => {
    useGameStore().snapshot = enteredCareer('r31-prop-default').arrival
    // No `entry` prop at all - the shape every other mounted test of this screen already uses, and
    // the reason none of them had to change.
    const w = mount(ThisWeekScreen, { attachTo: document.body })
    expect(blockOrder(w.element)).toEqual(['story', 'tournament'])
    w.unmount()
  })

  it('⚠ a training week is untouched: with nothing entered there is nothing to promote', async () => {
    // `nearestEntered` is the same fact the panel renders by, so `entry` can never reorder a page
    // around a block that is not drawn. Home's plate opens onto this state too.
    const world = createWorld('r31-training-week', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    snap.upcoming = snap.upcoming.map((e) => ({ ...e, entered: false }))
    useGameStore().snapshot = snap
    const w = mount(ThisWeekScreen, { props: { entry: 'tournament' }, attachTo: document.body })
    expect(w.find('.next-tourn').exists(), 'nothing is entered, so there is no panel').toBe(false)
    expect(blockOrder(w.element), 'and the story keeps the top it always had').toEqual(['story'])
    w.unmount()
  })
})

// =================================================================================================
describe("round 31 #1 - his tap, end to end, through the shell he is playing", () => {
  it('⭐⭐ pressing `Next tournament` on Home lands on the tournament, not on last week', async () => {
    const { arrival } = enteredCareer('r31-plate-tap')
    const wrapper = await mountShell(arrival)

    // The card is a real `<button>` (`Card as="button"`), reached the way his thumb reaches it.
    const plate = wrapper.find('[data-tour="next-tournament"]')
    expect(plate.exists(), "Home's next-tournament plate must be on screen").toBe(true)
    await plate.trigger('click')
    await nextTick()

    expect(blockOrder(weekScreenOf(wrapper)), 'the tournament is what he asked for').toEqual([
      'tournament',
      'story',
    ])
    wrapper.unmount()
  })

  it('⚠ ...and the story is still THERE, with its close and its way off the page', async () => {
    // The promotion may not become a suppression. Nothing is dismissed, nothing is hidden: the same
    // card, one screenful down, with the same × in the header and the same footer control.
    const { arrival } = enteredCareer('r31-plate-keeps-story')
    const wrapper = await mountShell(arrival)
    await wrapper.find('[data-tour="next-tournament"]').trigger('click')
    await nextTick()

    const screen = weekScreenOf(wrapper)
    expect(screen.querySelector('.recap-card'), "the week's story is on the page").toBeTruthy()
    expect(screen.querySelector('.week-close'), 'and its × is still in the header').toBeTruthy()
    expect(wrapper.find('.week-proceed-btn').exists(), 'and its way off the page is still there').toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// ⭐⭐ THE GUARD THAT MATTERS. Everything above is the fix; this is the thing the fix could break.
describe('round 31 #1 - and a resolved week still opens on its story', () => {
  it('⭐⭐ a week resolving WHILE he stands on the screen he reached from the plate takes the top back', async () => {
    // The hard arm, and the reason `weekEntry` is reset by the snapshot watcher rather than only by
    // a tab change: on this path the tab never changes, because he is already on `week`.
    const { arrival, afterTick } = enteredCareer('r31-tick-while-here')
    const wrapper = await mountShell(arrival)
    await wrapper.find('[data-tour="next-tournament"]').trigger('click')
    await nextTick()
    expect(blockOrder(weekScreenOf(wrapper)), 'he arrived on the tournament').toEqual(['tournament', 'story'])

    // The week resolves. This is exactly what `game.advance` delivers to the shell: a new snapshot
    // for the same career, one week on.
    useGameStore().snapshot = afterTick
    await nextTick()

    expect(blockOrder(weekScreenOf(wrapper)), 'the new story outranks the old arrival').toEqual([
      'story',
      'tournament',
    ])
    wrapper.unmount()
  })

  it("⭐⭐ a week resolving from anywhere else opens the story on top, which is the beat that was already there", async () => {
    // The ordinary flow, untouched: he is on Home, the week resolves, the shell routes him to the
    // story - and the story is the first thing on it.
    const { arrival, afterTick } = enteredCareer('r31-tick-from-home')
    const wrapper = await mountShell(arrival)
    expect(wrapper.findComponent(ThisWeekScreen).exists(), 'he starts on Home').toBe(false)

    useGameStore().snapshot = afterTick
    await nextTick()

    expect(blockOrder(weekScreenOf(wrapper)), 'the story opened itself, on top').toEqual([
      'story',
      'tournament',
    ])
    wrapper.unmount()
  })

  it('⚠ a tick clears the reason even after he has walked away, so the next arrival is clean', async () => {
    // The reason is not a mode with an expiry: it is replaced at each of the screen's TWO doors, and
    // this is the one that says `story`. He arrives from the plate, leaves by the bar, and the week
    // then resolves somewhere else entirely - the story still opens on top.
    const { arrival, afterTick } = enteredCareer('r31-entry-then-leave')
    const wrapper = await mountShell(arrival)
    await wrapper.find('[data-tour="next-tournament"]').trigger('click')
    await nextTick()
    expect(blockOrder(weekScreenOf(wrapper))).toEqual(['tournament', 'story'])

    const bar = wrapper.findAll('.tab-btn')
    expect(bar.length, 'the bottom bar is on screen').toBeGreaterThan(0)
    await bar[0].trigger('click')
    await nextTick()
    expect(wrapper.findComponent(ThisWeekScreen).exists(), 'he really left the screen').toBe(false)

    useGameStore().snapshot = afterTick
    await nextTick()
    expect(blockOrder(weekScreenOf(wrapper)), 'the tick brought him back to his story').toEqual([
      'story',
      'tournament',
    ])
    wrapper.unmount()
  })
})
