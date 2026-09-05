// ⭐ U-08 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE TWO TIMERS THAT
// OUTLIVED THEIR SCREEN.
//
// The review's lifecycle table is nineteen rows and every listener, observer, frame and timer in the
// app is paired with a teardown – except two, both on More: `okTimer` was cleared only when the NEXT
// `saveOp` arrived, which cannot happen once the screen is gone, and the seed-copied tick was never
// held at all.
//
// ⚠ WHAT IT COSTS TODAY IS NOTHING, AND THAT IS WHY THE ASSERTION IS ABOUT THE TIMER RATHER THAN
// ABOUT A SYMPTOM. A ref write after unmount is a no-op in Vue 3, so no test can catch this by
// watching for a throw or a stray render – there is nothing to catch. What is real and measurable is
// that a timer is still scheduled after the component that owns it is gone, and `vi.getTimerCount()`
// is that number.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: removing the `onBeforeUnmount` block
// leaves both timers pending and the case goes red on the count. The log is in the wave's scratch as
// `u08-red.log`.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'

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

/** The one browser API `copySeed` needs; happy-dom ships no clipboard. */
function installClipboard(): void {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  })
}

/** ⚠ MoreScreen AND NOTHING ELSE CALLS THE WORKER ON MOUNT (`onMounted(() => game.refreshCareers())`)
 *  and there is no `Worker` under happy-dom, so leaving it alone is an unhandled rejection per mount
 *  – which vitest reports as an error and the run exits 1 with every test green. The same one-line
 *  stub tests/component/round20-ui.test.ts and a11y-sweep.test.ts both carry, for the same reason. */
function mountMore(seed: string): ReturnType<typeof mount> {
  const store = useGameStore()
  store.snapshot = careerSnapshot(4, seed)
  store.refreshCareers = async () => {}
  return mount(MoreScreen, { attachTo: document.body })
}

/** The seed sits behind the About tab; this is the section switcher's own control. */
async function openAbout(wrapper: ReturnType<typeof mount>): Promise<void> {
  const tab = wrapper.findAll('.tab-pill').find((b) => b.text() === 'About')
  expect(tab, 'the About section has no tab to open it').toBeTruthy()
  await tab!.trigger('click')
}

describe('⭐ U-08 – More leaves no timer running behind it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    backing.clear()
    installClipboard()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('⚠ both timers are pending while the screen is up, and gone the moment it is not', async () => {
    const wrapper = mountMore('u08-more')
    const store = useGameStore()

    const idle = vi.getTimerCount()

    // 1. the success row's auto-dismiss, armed the way a finished save arms it.
    store.saveOp = { op: 'save', status: 'ok' }
    await wrapper.vm.$nextTick()

    // 2. the seed-copied tick, armed by the control that arms it – which lives behind the About
    //    tab, so the walk in is the player's own tap on the section switcher.
    await openAbout(wrapper)
    const seed = wrapper.find('.seed-value')
    expect(seed.exists(), 'no seed control – there would be no second timer to leave behind').toBe(true)
    await seed.trigger('click')
    await flushPromises()

    const armed = vi.getTimerCount()
    expect(armed, 'neither timer was armed, so unmounting proves nothing').toBe(idle + 2)

    wrapper.unmount()
    expect(
      vi.getTimerCount(),
      'a timer is still scheduled against a screen the player has left',
    ).toBe(idle)
  })

  it('⚠ ...and a second copy inside the window resets the tick rather than inheriting it', async () => {
    // The other half of holding the handle: `copySeed` now clears before it re-arms, so two taps
    // leave ONE timer rather than two racing to clear the same flag.
    const wrapper = mountMore('u08-more-twice')
    const idle = vi.getTimerCount()

    await openAbout(wrapper)
    const seed = wrapper.find('.seed-value')
    await seed.trigger('click')
    await flushPromises()
    await seed.trigger('click')
    await flushPromises()
    expect(vi.getTimerCount(), 'two taps left two ticks running').toBe(idle + 1)

    // ...and the tick still does its job: the mark clears when the window is up.
    expect(wrapper.find('.seed-value').text()).toContain('✓')
    vi.advanceTimersByTime(1600)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.seed-value').text(), 'the copied mark never goes out').not.toContain('✓')
    wrapper.unmount()
  })
})
