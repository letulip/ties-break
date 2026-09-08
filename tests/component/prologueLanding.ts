// ⚠⚠ ROUND 40 #3 – WHY EVERY PROLOGUE WALK IN tests/component STEPS A CLOCK NOW, AND WHY IT IS NOT
// A SLEEP.
//
// The container holds a finished card for `PROLOGUE_LANDING_MS` before it advances, so that the
// answer the player just took is on screen long enough to be seen (docs/rounds/round-40.md, item 3).
// A walk that pressed and looked would now find the SAME card, so every suite that drives the real
// component has to let that hold elapse.
//
// ⚠ IT MAY NOT BE A REAL WAIT. Five suites walk this component and a nine-year walk holds SEVEN
// times, so a real `await sleep(200)` per answer would add seconds to the component project on every
// run – and, worse, would be a race: a machine under load (CLAUDE.md's own contention note) would
// paint late and the walk would read the old card. The clock is FAKED and STEPPED instead, so the
// hold is exact and costs nothing.
//
// ⚠⚠ AND THE FAKE CLOCK IS SCOPED TO THE PRESS RATHER THAN TO THE SUITE, which is the one design
// decision in this file. A suite-wide `vi.useFakeTimers()` would also be sitting under the match
// viewer, the transitions and the weekend flow that these same walks drive – all of which run on
// timers this file knows nothing about. Installed for the click and uninstalled before Vue paints,
// it can only ever affect the landing it exists for.
import { vi } from 'vitest'
import { nextTick } from 'vue'
import { PROLOGUE_LANDING_MS } from '../../src/components/ChildhoodPrologue.vue'

export { PROLOGUE_LANDING_MS }

/**
 * Press something on a prologue card and let whatever it started LAND.
 *
 * ⚠ HARMLESS ON A PRESS THAT SCHEDULES NOTHING – the year's own answer on a card that still has its
 * tournament question open, the way on off a quiet card, a weekend's skip. There is no timer to
 * fire, so stepping the clock does nothing at all and the caller does not have to know which kind of
 * control it just pressed.
 */
export async function landing(click: () => Promise<unknown>): Promise<void> {
  // ⚠ ONLY `setTimeout` / `clearTimeout`. `vi.useFakeTimers()` with no argument also fakes `Date`,
  // `performance` and `requestAnimationFrame`, and the walks below open the real match viewer, which
  // is driven by all three.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await click()
    vi.advanceTimersByTime(PROLOGUE_LANDING_MS)
  } finally {
    // ⚠ BEFORE THE PAINT, DELIBERATELY. The landing's callback has already run by here and Vue's
    // flush is a microtask, so the screen the advance opens – a weekend, the viewer, the next card –
    // mounts under the REAL clock, exactly as it does in the app.
    vi.useRealTimers()
  }
  await nextTick()
}
