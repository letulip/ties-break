// EXACTLY ONE TIMER OWNER DRIVES PLAYBACK – R2-11's hard rule ("Never allow two clock/timer owners"),
// asserted on a MOUNTED component rather than on the spelling of the source.
//
// -------------------------------------------------------------------------------------------------
// THE FINDING THIS FILE FREEZES
// -------------------------------------------------------------------------------------------------
// MatchViewer holds TWO HANDLES and has always had ONE OWNER. The rAF id drives the frame loop; the
// `setTimeout` id holds the take-your-seats pre-roll before the loop starts. They are not two clocks
// because neither can be armed except through `startClock()` and neither can survive `pauseInternal()`
// – one door in, one door out. That is the property worth freezing, and it is the property a source
// pin cannot express: "there is no SECOND thing that can start or stop playback" is a claim about
// everything the component does, not about a line of it.
//
// -------------------------------------------------------------------------------------------------
// HOW IT IS MEASURED
// -------------------------------------------------------------------------------------------------
// `requestAnimationFrame` and `setTimeout` are replaced with counting stubs, so at any instant the
// test knows exactly how many frame requests and how many timeouts the component is holding. Then:
//   * AT MOST ONE outstanding frame request, ever. A second frame loop is a second owner and shows
//     up here immediately.
//   * THE HOLD AND THE LOOP ARE NEVER BOTH ARMED. They are two states of one owner, not two owners.
//   * ONE DOOR CLOSES EVERYTHING. Hiding the screen must take the count of BOTH to zero – from the
//     pre-roll hold and from mid-playback alike – and showing it again must bring back exactly one.
//     A timer that a second owner armed would survive that door, which is the whole test.
//   * NOTHING OUTLIVES THE END OF THE MATCH, OR THE COMPONENT.
//
// ⚠ MUTATION-VERIFIED BY INTRODUCING A SECOND OWNER. Adding a second rAF loop to the viewer
// (`rafId2 = requestAnimationFrame(tick2)` beside the first) turns the "at most one" cases red;
// adding a `setTimeout` that `pauseInternal` does not clear turns the two visibility cases red.
// Both arms are reported with the wave.
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

const FRAME_MS = 250
/** SEATS_PREROLL_MS / min(speed, 2) is 1800ms at the default ×2; round up past it. */
const SEATS_HOLD_MS = 2000

function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}
function fixture(seed = 'one-clock') {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

/**
 * THE COUNTER. Every frame request and every timeout the component takes out is tracked by id, so
 * `frames()` and `timers()` are the number it is HOLDING right now – not the number it has ever
 * asked for (`framesArmed` is that, for the anti-vacuity check).
 *
 * ⚠ THE TIMEOUT WRAPPER GOES ON TOP OF THE FAKE ONE, not instead of it: `vi.useFakeTimers()` must
 * still be the thing that actually schedules, or `advanceTimersByTime` would have nothing to run.
 */
function clockSpy() {
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  vi.useFakeTimers()
  const fakeSetTimeout = globalThis.setTimeout
  const fakeClearTimeout = globalThis.clearTimeout

  const liveFrames = new Map<number, FrameRequestCallback>()
  const liveTimers = new Set<unknown>()
  let nextId = 1
  let framesArmed = 0
  let timersArmed = 0

  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const id = nextId++
    liveFrames.set(id, cb)
    framesArmed++
    return id
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    liveFrames.delete(id)
  }
  globalThis.setTimeout = ((fn: (...a: unknown[]) => void, ms?: number, ...args: unknown[]) => {
    let id: unknown
    id = fakeSetTimeout(() => {
      liveTimers.delete(id)
      fn(...args)
    }, ms)
    liveTimers.add(id)
    timersArmed++
    return id
  }) as unknown as typeof setTimeout
  globalThis.clearTimeout = ((id: unknown) => {
    liveTimers.delete(id)
    ;(fakeClearTimeout as (i: unknown) => void)(id)
  }) as unknown as typeof clearTimeout

  let now = 0
  return {
    frames: () => liveFrames.size,
    timers: () => liveTimers.size,
    framesArmed: () => framesArmed,
    timersArmed: () => timersArmed,
    /** Run the single outstanding frame request. Fails loudly if there is not exactly one. */
    async paint(): Promise<void> {
      expect(liveFrames.size, 'a paint was asked for with no single outstanding frame request').toBe(1)
      const [id, cb] = [...liveFrames.entries()][0]
      liveFrames.delete(id)
      now += FRAME_MS
      cb(now)
      await nextTick()
    },
    async advance(ms: number): Promise<void> {
      vi.advanceTimersByTime(ms)
      await nextTick()
    },
    restore(): void {
      vi.useRealTimers()
      globalThis.requestAnimationFrame = realRaf
      globalThis.cancelAnimationFrame = realCaf
      globalThis.setTimeout = fakeSetTimeout
      globalThis.clearTimeout = fakeClearTimeout
    },
  }
}

/** Put the screen away / bring it back, the way a phone does. */
async function setHidden(hidden: boolean): Promise<void> {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
  await nextTick()
}

/**
 * ⚠ WARM THE RENDERER UP BEFORE ANY SPY GOES IN, or the count is one too high and the test reads it
 * as a second owner. Measured: Vue's `setDevtoolsHook` arms a 3,000 ms `setTimeout` inside
 * `ensureRenderer()`, once per process, on the FIRST mount – so whichever test mounted first counted
 * it as the component's. Mounting a trivial component here spends that once, on the real clock,
 * before any test installs its stubs. (A test that measures the wrong thing is the failure mode this
 * whole file is written against; it may as well not have one in its own harness.)
 */
beforeAll(() => {
  mount(defineComponent({ setup: () => () => 'warm-up' })).unmount()
})

let spy: ReturnType<typeof clockSpy> | null = null
/** ⚠ UNMOUNTED UNCONDITIONALLY. A test that fails mid-run never reaches its own `w.unmount()`, and a
 *  viewer left mounted keeps its visibility listener – so the NEXT test's `setHidden(false)` resumes
 *  two clocks and reports a second owner that is really the previous test's corpse. It happened. */
let liveViewer: { unmount: () => void } | null = null
afterEach(async () => {
  liveViewer?.unmount()
  liveViewer = null
  await setHidden(false)
  spy?.restore()
  spy = null
  vi.useRealTimers()
})

function mountViewer() {
  const { a, b, match } = fixture()
  const w = mount(MatchViewer, {
    props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
  })
  liveViewer = w
  return w
}

describe('MatchViewer – exactly one timer owner drives playback', () => {
  it('the hold and the loop are never both armed: one owner, two states', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await nextTick()

    // Mounted at the settings default (×2): the pre-match hold is out, the loop is not.
    expect(d.timers(), 'the pre-match hold is not the only timeout the mount armed').toBe(1)
    expect(d.frames(), 'a frame loop started underneath the pre-match hold').toBe(0)

    await d.advance(SEATS_HOLD_MS)
    // ...and the moment the hold expires the loop takes over. Still exactly one thing running.
    expect(d.timers(), 'the hold survived its own expiry').toBe(0)
    expect(d.frames(), 'the hold handed over to something other than exactly one frame loop').toBe(1)
    w.unmount()
  })

  it('AT MOST ONE outstanding frame request, on every paint of a real walk', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await d.advance(SEATS_HOLD_MS)

    for (let i = 0; i < 400; i++) {
      if (d.frames() === 0) break // playback finished and stopped asking
      expect(d.frames(), `two frame loops were live at paint ${i}`).toBe(1)
      expect(d.timers(), `a timeout was armed alongside the loop at paint ${i}`).toBe(0)
      await d.paint()
    }
    // ...and the walk really happened, so the loop above is not vacuous.
    expect(d.framesArmed(), 'the clock never ran').toBeGreaterThan(100)
    w.unmount()
  })

  it('ONE DOOR: hiding the screen during the PRE-ROLL takes the hold with it', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await nextTick()
    expect(d.timers()).toBe(1)

    await setHidden(true)
    // The pre-roll is a `setTimeout`, which a hidden tab does NOT throttle away – if it survived, the
    // clock would start behind the player's back. Both counts must be zero.
    expect(d.timers(), 'the pre-match hold outlived the screen going away').toBe(0)
    expect(d.frames(), 'a frame loop outlived the screen going away').toBe(0)
    // ...and running the clock on cannot start anything while the screen is away.
    await d.advance(SEATS_HOLD_MS * 4)
    expect(d.frames(), 'playback started while the screen was hidden').toBe(0)

    await setHidden(false)
    // Coming back starts EXACTLY ONE thing. (The beat is already spent, so it is the loop.)
    expect(d.frames() + d.timers(), 'coming back started more than one clock').toBe(1)
    w.unmount()
  })

  it('ONE DOOR: hiding the screen mid-playback stops everything, and showing it starts one thing', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await d.advance(SEATS_HOLD_MS)
    for (let i = 0; i < 12; i++) await d.paint()
    expect(d.frames()).toBe(1)

    await setHidden(true)
    expect(d.frames(), 'the frame loop outlived the screen going away').toBe(0)
    expect(d.timers(), 'a timeout outlived the screen going away').toBe(0)

    await setHidden(false)
    expect(d.frames(), 'coming back started more than one frame loop').toBe(1)
    expect(d.timers(), 'coming back armed a timeout as well as the loop').toBe(0)
    w.unmount()
  })

  it('a match the player never started is not resumed by coming back', async () => {
    // Anti-vacuity for the door above: the resume is conditional, so the counts must NOT come back
    // when the clock was already stopped for another reason.
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await d.advance(SEATS_HOLD_MS)
    for (let i = 0; i < 4; i++) await d.paint()

    // Skip to the result: playback is over, by the door that does not involve visibility at all.
    const skip = w.findAll('button').find((b) => b.text() === 'Skip to the result')
    expect(skip, 'no skip control to end playback with').toBeTruthy()
    await skip!.trigger('click')
    await nextTick()
    expect(d.frames(), 'the skip left a frame loop running').toBe(0)
    expect(d.timers(), 'the skip left a timeout armed').toBe(0)

    await setHidden(true)
    await setHidden(false)
    expect(d.frames() + d.timers(), 'coming back restarted a finished match').toBe(0)
    w.unmount()
  })

  it('nothing outlives the end of the match', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await d.advance(SEATS_HOLD_MS)
    for (let i = 0; i < 4000; i++) {
      if (d.frames() === 0) break
      await d.paint()
    }
    expect(d.frames(), 'the finished match is still asking for frames').toBe(0)
    expect(d.timers(), 'the finished match left a timeout armed').toBe(0)
    // ...and it really did finish rather than merely stop being driven.
    expect(w.text(), 'the match did not reach its end').toContain('Watch again')
    w.unmount()
  })

  it('nothing outlives the component', async () => {
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await d.advance(SEATS_HOLD_MS)
    for (let i = 0; i < 12; i++) await d.paint()
    expect(d.frames()).toBe(1)

    w.unmount()
    expect(d.frames(), 'a frame loop outlived the component').toBe(0)
    expect(d.timers(), 'a timeout outlived the component').toBe(0)
    // ...and the listener went with it: the door cannot be knocked on any more.
    await setHidden(true)
    await setHidden(false)
    expect(d.frames() + d.timers(), 'an unmounted viewer answered a visibility change').toBe(0)
  })

  it('...and the pre-roll hold is armed at ×2 but not at ×4, which is the same owner deciding', async () => {
    // Anti-vacuity for the first case: if the hold were unconditional, "one owner, two states" would
    // be a description of a constant rather than of a decision.
    const d = clockSpy()
    spy = d
    const w = mountViewer()
    await nextTick()
    expect(d.timers(), 'the ×2 opening did not arm the pre-match hold').toBe(1)

    const fast = w.findAll('button').find((b) => b.text() === '4×')
    expect(fast, 'no ×4 pill').toBeTruthy()
    await fast!.trigger('click')
    await nextTick()
    // A speed change alone does not restart the run, so step the hold out and let the loop begin.
    await d.advance(SEATS_HOLD_MS)
    expect(d.frames()).toBe(1)
    expect(d.timers()).toBe(0)

    // "Watch again" is a fresh run at ×4: no cue, no hold, straight into the loop.
    for (let i = 0; i < 4000; i++) {
      if (d.frames() === 0) break
      await d.paint()
    }
    const again = w.findAll('button').find((b) => b.text().startsWith('Watch again'))
    expect(again, 'no Watch again control').toBeTruthy()
    await again!.trigger('click')
    await nextTick()
    expect(d.timers(), '×4 armed a pre-match hold it is supposed to skip').toBe(0)
    expect(d.frames(), '×4 did not go straight into exactly one loop').toBe(1)
    w.unmount()
  })
})
