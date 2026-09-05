// ⚠⚠ U-07 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – HOME STILL DRAWS WHEN THE
// BROWSER HAS BLOCKED SITE DATA.
//
// A browser with site data blocked throws `SecurityError` on the PROPERTY ACCESS `localStorage`, not
// on the `getItem` call – so no `?.` helps, and a bare read at the top of a setup is an exception
// during setup: the component does not render at all. This one ran on HOME, the first screen of
// every career, for a one-time callout mark.
//
// ⚠ THE REVIEW'S LOCATION IS STALE AND THE DEFECT WAS NOT. It names `HomeScreen.vue:117, 121`; this
// morning's P2-6 moved the whole identity block into `composables/kidIdentity.ts`, where the two
// bare accesses arrived unchanged (128 and 133 on this tree). The screen is the same screen and the
// crash is the same crash – it is simply a composable's line now, and the mount below is what says
// so rather than a line number.
//
// ⚠ THE REVIEW SAID IT WAS UNVERIFIED, "by reading only". This is the verification: the throwing
// accessor is what a blocked browser does, asserted to really throw before the screen is mounted
// against it.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: restoring the bare
// `localStorage.getItem(KID_HINT_KEY)` in `kidIdentity.ts` makes the mount throw and the case goes
// red on the SecurityError. The log is in the wave's scratch as `u07-red.log`.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { resetKidHintForTests } from '../../src/composables/kidIdentity'
import { readLocal, writeLocal } from '../../src/composables/localStore'
import { careerSnapshot } from '../helpers/career'

/** The working shim every mounted suite installs – see tests/component/round28-top-notices.test.ts
 *  for the argument. It is also the CONTROL for the blocked case below. */
const backing = new Map<string, string>()
function installWorkingStorage(): void {
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
}

/** What a browser with site data blocked actually does: it throws on the PROPERTY, not on the call. */
function installBlockedStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
}

describe('⚠⚠ U-07 – a browser that blocks site data still gets the game', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    backing.clear()
    resetKidHintForTests()
    installWorkingStorage()
  })
  afterEach(installWorkingStorage)

  it('the fixture really is a blocked browser – the property itself throws', () => {
    installBlockedStorage()
    expect(() => localStorage.getItem('anything')).toThrow(/insecure/)
    // ...and it is the ACCESS that throws, not the call, which is the whole reason `?.` does not help.
    expect(() => (globalThis as unknown as { localStorage: unknown }).localStorage).toThrow()
  })

  it('⚠⚠ Home mounts and draws the hero with storage blocked', () => {
    installBlockedStorage()
    useGameStore().snapshot = careerSnapshot(6, 'u07-blocked')
    const wrapper = mount(HomeScreen, { attachTo: document.body })
    expect(wrapper.find('.diary-hero').exists(), 'the first screen of every career did not render').toBe(true)
    wrapper.unmount()
  })

  it('...and the one-time callout defaults to SHOWN, which is what an unread mark means', () => {
    installBlockedStorage()
    useGameStore().snapshot = careerSnapshot(6, 'u07-blocked-hint')
    const wrapper = mount(HomeScreen, { attachTo: document.body })
    expect(
      wrapper.find('.diary-kid-hint').exists(),
      'a storage failure silently spent the callout nobody could dismiss',
    ).toBe(true)
    wrapper.unmount()
  })

  it('⚠ the control – with storage working the screen is unchanged, and the mark still persists', async () => {
    useGameStore().snapshot = careerSnapshot(6, 'u07-working')
    const wrapper = mount(HomeScreen, { attachTo: document.body })
    const hint = wrapper.find('.diary-kid-hint')
    expect(hint.exists(), 'the callout is not on screen, so dismissing it proves nothing').toBe(true)
    await hint.trigger('click')
    expect(wrapper.find('.diary-kid-hint').exists(), 'the tap did not dismiss it').toBe(false)
    // The mark reached the shim, which is what makes it a once-ever callout rather than a once-a-mount one.
    expect(backing.size, 'nothing was written, so the callout comes back on the next device boot').toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('⚠ the shared guard answers rather than throwing, both ways', () => {
    installBlockedStorage()
    expect(readLocal('tb:anything'), 'a blocked read must answer "nothing", not explode').toBe(null)
    expect(() => writeLocal('tb:anything', '1'), 'a blocked write must be silent').not.toThrow()

    installWorkingStorage()
    writeLocal('tb:u07', 'yes')
    expect(readLocal('tb:u07')).toBe('yes')
  })
})
