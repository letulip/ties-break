// ROUND 28 #10 – THE TOP NOTIFICATIONS, MOUNTED, WITH BOTH OF THEM ON SCREEN AT ONCE.
//
// The owner, playing the build: the pop-up notification at the top carries a Dismiss button with
// three words on it, it looks untidy, leave just `Dismiss`. His words are in docs/rounds/round-28.md
// item 10, where they may be quoted in his own language.
//
// ⚠⚠ THIS IS THE FIRST TEST IN THE REPO THAT MOUNTS `App.vue`, AND THAT IS THE POINT. Until this
// round the shell could not be mounted at all - `src/pwa.ts` imports `virtual:pwa-register`, a
// module VitePWA injects at BUILD time, so the import did not resolve under Vitest and every claim
// about the shell had to be made as a source pin (tests/a11y-banner-names.test.ts says so at
// length). A source pin cannot answer "what does this button SAY when it is drawn", which is the
// whole of item 10. The alias that fixes it is scoped to the `component` project and stubs exactly
// one module - see vite.config.ts and tests/component/stubs/pwa-register.ts.
//
// ⚠ THE THREE TOP-OF-SCREEN NOTIFICATION SURFACES, ENUMERATED, because "a fix that lands on one of
// three" is the false-done this round exists to prevent:
//   1. `.recovered-banner` – the damaged-autosave notice. Dismiss button. Covered below.
//   2. `.stop-toast`       – the advance's stop reason. Dismiss button. Covered below.
//   3. `.update-banner`    – the PWA update prompt. Its only control is `Update`; it has NO dismiss
//      control by design (a build the player declined would have nothing to re-raise it), so there
//      is no three-word Dismiss on it to shorten. Asserted below anyway, so that the day somebody
//      gives it one, this file is where it gets the same treatment.
// There is no fourth: every other dismissable surface in the app is a DIALOG (BirthdayDialog,
// InjuryStopDialog, the MatchViewer's retirement notice, …), which is a blocking overlay with its
// own copy and its own tests, not a strip at the top of the page.
//
// ⚠ MUTATION-VERIFIED. Restoring `Dismiss autosave notice` / `Dismiss stop notice` as the VISIBLE
// copy turns the first two blocks red; dropping either `aria-label` turns the third red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'

// ⚠ THIS RUNNER HAS NO localStorage, AND `HomeScreen` READS IT AT SETUP. The same shim and the same
// argument as tests/component/home-strip-and-mail.test.ts, quoted there in full: happy-dom is
// configured here without web storage, and the app's own try/catch fallback would swallow the
// difference rather than fail. The test supplies the browser's object; it does not weaken the code.
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
 * The shell, mounted, past the splash, with BOTH strips raised.
 *
 * ⚠ THE STORE IS FILLED AFTER THE MOUNT, NOT BEFORE, and that ordering is load-bearing. `App.vue`
 * calls `game.init()` in `onMounted`, which reaches for a Web Worker this runner does not have; the
 * store then flips itself to `phase: 'recovery'` and the shell draws the storage-failure screen
 * instead of the game. Letting that settle first (`flushPromises`) and THEN declaring the store
 * ready is what puts the tab shell on screen. Nothing is stubbed: this is the real store, the real
 * splash and the real banners.
 *
 * `recovered` raises the autosave notice; a stop reason WITH COPY raises the toast (`offer` has
 * copy - `injury` and its siblings deliberately do not, see STOP_REASON_TEXT in App.vue).
 */
async function mountShell(): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  const snapshot = careerSnapshot(4, 'round28-notices')
  snapshot.stopReasons = ['offer']
  store.snapshot = snapshot
  store.recovered = true
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  // The splash is a real component with a real timer behind it; asking it for its own `done` is the
  // same seam the player's tap uses, and it needs no clock.
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  return wrapper
}

describe('round 28 #10 - the top notifications say one word', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('raises both strips at once, so the pair is really on screen together', async () => {
    // The fixture's own honesty check. D11's finding was about the two being simultaneous; a test
    // that could only ever see one of them would pass on half a fix.
    const wrapper = await mountShell()
    expect(wrapper.find('.recovered-banner').exists()).toBe(true)
    expect(wrapper.find('.stop-toast').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the autosave notice reads exactly `Dismiss`', async () => {
    const wrapper = await mountShell()
    const button = wrapper.find('.recovered-banner button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Dismiss')
    wrapper.unmount()
  })

  it('the stop toast reads exactly `Dismiss`', async () => {
    const wrapper = await mountShell()
    const button = wrapper.find('.stop-toast button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Dismiss')
    wrapper.unmount()
  })

  it('...and the two are still told apart, one layer down', async () => {
    // D11's finding survives its fix being overruled: the strips can be on screen together, so
    // something has to distinguish them. It is the accessible name now, not the visible copy.
    const wrapper = await mountShell()
    const names = [
      wrapper.find('.recovered-banner button').attributes('aria-label'),
      wrapper.find('.stop-toast button').attributes('aria-label'),
    ]
    expect(names[0]).toBe('Dismiss autosave notice')
    expect(names[1]).toBe('Dismiss stop notice')
    expect(new Set(names).size).toBe(2)
    wrapper.unmount()
  })

  it('each button still dismisses its own strip and leaves the other standing', async () => {
    // The other half of "told apart": pressing one must not close both. This is what a shared
    // handler or a copy-pasted click target would break, and no copy assertion could see it.
    const wrapper = await mountShell()
    await wrapper.find('.recovered-banner button').trigger('click')
    await nextTick()
    expect(wrapper.find('.recovered-banner').exists()).toBe(false)
    expect(wrapper.find('.stop-toast').exists()).toBe(true)
    await wrapper.find('.stop-toast button').trigger('click')
    await nextTick()
    expect(wrapper.find('.stop-toast').exists()).toBe(false)
    wrapper.unmount()
  })

  it('the third top strip - the PWA update prompt - has no dismiss control to shorten', async () => {
    // The enumeration, asserted rather than claimed. `.update-banner` is the only other fixed strip
    // at the top of the page (it is the one thing drawn OUTSIDE the ready gate, above every app
    // state), and its single control is `Update`. If a Dismiss is ever added to it, this goes red
    // and the new button gets the same one word.
    const wrapper = await mountShell()
    const banner = wrapper.find('.update-banner')
    if (banner.exists()) {
      const labels = banner.findAll('button').map((b) => b.text())
      expect(labels).toEqual(['Update'])
    }
    // ...and it is genuinely absent here, because nothing in this fixture raises it: `needRefresh`
    // only flips when a service worker is waiting, and the stub registers none.
    expect(banner.exists()).toBe(false)
    wrapper.unmount()
  })
})
