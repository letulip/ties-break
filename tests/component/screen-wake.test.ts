// ROUND-16 #20 – THE SCREEN STAYS AWAKE WHILE A MATCH RUNS, MOUNTED.
//
// «Keep the screen awake during a match». The behaviour is a lock taken from the platform and given
// back, with no surface of any kind – no toggle, no setting, no string – so there is nothing here a
// source pin could honestly assert. What can be asserted is what the component DOES to a wake-lock
// API that is standing there counting: `src/composables/screenWake.ts` is driven through every one
// of its four events, twice over – once on a bare harness that owns the predicate, and once on the
// real `MatchViewer`, which is the component every match surface in the game mounts.
//
// ⚠ THE PREDICATE IS `playbackClock`'s `playing` AND THERE IS DELIBERATELY NO SECOND ONE. The
// MatchViewer cases below are what proves the wiring rather than the composable: they never touch
// `playing` themselves, they open a match and skip it to the result, and the lock follows.
//
// ⚠ MUTATION-VERIFIED. Deleting the `release()` from `useScreenWake`'s `onBeforeUnmount` turns
// "unmounting gives the lock back" and "the real viewer gives it back when it closes" RED and leaves
// every other case green – which is the point: a watcher cannot cover teardown, because the
// component's effect scope is stopped as part of it. The red output is reported with the wave.
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, toRef } from 'vue'
import { useScreenWake } from '../../src/composables/screenWake'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

// =================================================================================================
// THE PLATFORM, COUNTING
// =================================================================================================

interface WakeLockSpy {
  /** the `type` argument of every `request()` the code has made, in order */
  requests: string[]
  /** how many sentinels have been handed back */
  releases: number
  /** flip to refuse the next request the way a browser does – with a REJECTED promise */
  refuse: boolean
}

/**
 * Put a counting `navigator.wakeLock` in place. ⚠ It is defined rather than assigned: happy-dom has
 * no Screen Wake Lock API at all (checked below, and that absence is itself one of the cases), so
 * there is no property here to write to.
 */
function installWakeLock(): WakeLockSpy {
  const spy: WakeLockSpy = { requests: [], releases: 0, refuse: false }
  const api = {
    request(type: string): Promise<{ release: () => Promise<void> }> {
      spy.requests.push(type)
      if (spy.refuse) return Promise.reject(new Error('NotAllowedError: the document is not visible'))
      return Promise.resolve({
        release(): Promise<void> {
          spy.releases++
          return Promise.resolve()
        },
      })
    },
  }
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, writable: true, value: api })
  return spy
}

function removeWakeLock(): void {
  Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, 'wakeLock')
}

/** Put the screen away / bring it back, the way a phone does (the idiom match-viewer-clock uses). */
async function setHidden(hidden: boolean): Promise<void> {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
  await settle()
}

/**
 * Let the watcher run AND the request promise resolve. A `nextTick` alone only gets as far as the
 * watcher callback, which then awaits the API – so a test that stopped there would read the counts
 * before the answer arrived and pass for the wrong reason.
 */
async function settle(): Promise<void> {
  for (let i = 0; i < 4; i++) await nextTick()
}

// =================================================================================================
// THE TWO THINGS UNDER TEST
// =================================================================================================

/** A component that is nothing but the composable and the predicate it rides. */
const Harness = defineComponent({
  props: { live: { type: Boolean, required: true } },
  setup(props) {
    useScreenWake(toRef(props, 'live'))
    return () => h('div', 'harness')
  },
})

function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** A real, engine-simulated match for the real viewer to draw. */
function fixture(seed = 'screen-wake') {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

/**
 * ⚠ WARM THE RENDERER UP BEFORE ANYTHING IS COUNTED – the same hazard match-viewer-clock.test.ts
 * documents: Vue's first mount in a process arms devtools machinery of its own, and a test that
 * measures the wrong thing is the failure mode this file is written against.
 */
beforeAll(() => {
  mount(defineComponent({ setup: () => () => 'warm-up' })).unmount()
})

/** ⚠ UNMOUNTED UNCONDITIONALLY: a viewer left behind by a failing test keeps its visibility
 *  listener, and the next test's `setHidden` would then be answered by a corpse. */
let live: { unmount: () => void } | null = null
afterEach(async () => {
  live?.unmount()
  live = null
  await setHidden(false)
  removeWakeLock()
  vi.restoreAllMocks()
})

// =================================================================================================
// THE COMPOSABLE, DRIVEN THROUGH ITS FOUR EVENTS
// =================================================================================================

describe('the screen wake lock follows the one live-match predicate', () => {
  it('a running match takes a SCREEN lock, and takes exactly one', async () => {
    const wake = installWakeLock()
    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()

    expect(wake.requests, 'a live match did not ask for a wake lock').toEqual(['screen'])
    expect(wake.releases, 'the lock was handed back before the match ended').toBe(0)

    // ...and a second predicate change that says the same thing does not take a second lock.
    await w.setProps({ live: true })
    await settle()
    expect(wake.requests.length, 'a second lock was taken on top of the first').toBe(1)
  })

  it('the end of the match gives it back', async () => {
    const wake = installWakeLock()
    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()
    expect(wake.releases).toBe(0)

    await w.setProps({ live: false })
    await settle()
    expect(wake.releases, 'the finished match is still holding the screen awake').toBe(1)
    expect(wake.requests.length, 'ending the match asked for another lock').toBe(1)
  })

  it('⚠ unmounting gives it back – the case a watcher cannot cover', async () => {
    // A component's effect scope is stopped as part of unmounting, so a predicate that flips during
    // teardown may never reach a watcher callback. Without `onBeforeUnmount`'s own release, the lock
    // outlives the screen it was taken for and the phone simply never sleeps again.
    const wake = installWakeLock()
    const w = mount(Harness, { props: { live: true } })
    await settle()
    expect(wake.requests).toEqual(['screen'])

    w.unmount()
    await settle()
    expect(wake.releases, 'the lock outlived the component that took it').toBe(1)

    // ...and the listener went with it: the door cannot be knocked on any more.
    await setHidden(true)
    await setHidden(false)
    expect(wake.requests.length, 'an unmounted screen answered a visibility change').toBe(1)
  })

  it('coming back to a still-running match asks again, because the platform kept the lock', async () => {
    const wake = installWakeLock()
    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()
    expect(wake.requests).toEqual(['screen'])

    // Going away: the platform has already released the lock, so our handle is dropped too – if it
    // were kept, the re-acquire below would be refused by our own bookkeeping.
    await setHidden(true)
    expect(wake.releases, 'the handle survived the screen going away').toBe(1)
    expect(wake.requests.length, 'a lock was taken while the screen was hidden').toBe(1)

    await setHidden(false)
    expect(wake.requests, 'coming back to a running match did not ask again').toEqual(['screen', 'screen'])
  })

  it('...and coming back to a match that has ENDED asks for nothing', async () => {
    // Anti-vacuity for the case above: the re-acquire is conditional on the predicate, so it must
    // NOT fire when the reason the lock went away was the match finishing.
    const wake = installWakeLock()
    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()
    await w.setProps({ live: false })
    await settle()
    expect(wake.requests.length).toBe(1)
    expect(wake.releases).toBe(1)

    await setHidden(true)
    await setHidden(false)
    expect(wake.requests.length, 'a finished match was woken up by a visibility change').toBe(1)
    expect(wake.releases, 'a lock nobody held was handed back').toBe(1)
  })
})

// =================================================================================================
// SILENCE IS THE FALLBACK
// =================================================================================================

describe('where the platform cannot answer, nothing happens at all', () => {
  /** Every way this code could reach a player who did not ask for anything. */
  function watchTheConsole() {
    return {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    }
  }

  it('no capability: not one call is made, nothing is thrown and nothing is logged', async () => {
    removeWakeLock()
    // Anti-vacuity: the absence has to be real, or this case says nothing. (happy-dom ships no
    // Screen Wake Lock API, which is exactly the environment a 2019 browser is in.)
    expect('wakeLock' in navigator, 'the test environment grew a wake lock API').toBe(false)
    const said = watchTheConsole()

    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()
    await setHidden(true)
    await setHidden(false)
    await w.setProps({ live: false })
    await settle()
    w.unmount()
    live = null
    await settle()

    expect(said.error, 'the player was told their browser is old').not.toHaveBeenCalled()
    expect(said.warn).not.toHaveBeenCalled()
    expect(said.log).not.toHaveBeenCalled()
  })

  it('a REFUSED request is swallowed, and the next one still works', async () => {
    // `request()` rejects when the document is not visible or the browser simply declines (battery
    // saver). That is an ordinary outcome of a normal call – it must not surface, and it must not
    // leave the composable believing a request is still out.
    const wake = installWakeLock()
    wake.refuse = true
    const said = watchTheConsole()

    const w = mount(Harness, { props: { live: true } })
    live = w
    await settle()
    expect(wake.requests, 'the refused request never happened').toEqual(['screen'])
    expect(wake.releases, 'a lock that was never granted was handed back').toBe(0)
    expect(said.error, 'a refusal reached the player').not.toHaveBeenCalled()
    expect(said.warn).not.toHaveBeenCalled()
    expect(said.log).not.toHaveBeenCalled()

    // ...and the refusal did not wedge it: the browser changes its mind, and the next ask lands.
    wake.refuse = false
    await setHidden(true)
    await setHidden(false)
    expect(wake.requests.length, 'a refusal left the composable thinking a request was still out').toBe(2)

    w.unmount()
    live = null
    await settle()
    expect(wake.releases, 'the lock taken after the refusal was never given back').toBe(1)
  })
})

// =================================================================================================
// THE REAL SURFACE – which is what proves the wiring rather than the composable
// =================================================================================================

describe('MatchViewer is the surface that holds it', () => {
  function mountViewer() {
    const { a, b, match } = fixture()
    const w = mount(MatchViewer, {
      props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
    })
    live = w
    return w
  }

  it('opening a match takes the lock – on a REPLAY, which is how most matches in the game are watched', async () => {
    // ⚠ THE CASE THAT RULES OUT THE OTHER PREDICATE. `mode` is `'replay'` here, exactly as it is when
    // a match is re-watched from the Home feed, the Season bracket or the college card's Watch
    // control. A wake lock wired to `mode === 'live'` would take nothing at all on this mount.
    const wake = installWakeLock()
    mountViewer()
    await settle()
    expect(wake.requests, 'opening a match did not keep the screen awake').toEqual(['screen'])
  })

  it('skipping to the result gives it back, because the match is no longer running', async () => {
    const wake = installWakeLock()
    const w = mountViewer()
    await settle()
    expect(wake.requests.length).toBe(1)

    const skip = w.findAll('button').find((b) => b.text() === 'Skip to the result')
    expect(skip, 'no skip control to end playback with').toBeTruthy()
    await skip!.trigger('click')
    await settle()

    expect(wake.releases, 'a match that has ended is still holding the screen awake').toBe(1)
    expect(wake.requests.length, 'ending the match asked for another lock').toBe(1)
  })

  it('⚠ closing the screen gives it back', async () => {
    // The second half of the mutation arm: every match surface in the game closes by unmounting this
    // component (a takeover dismissed, a tournament flow moving on), and the lock goes with it.
    const wake = installWakeLock()
    const w = mountViewer()
    await settle()
    expect(wake.requests.length).toBe(1)

    w.unmount()
    live = null
    await settle()
    expect(wake.releases, 'the closed match screen left the phone awake').toBe(1)
  })
})
