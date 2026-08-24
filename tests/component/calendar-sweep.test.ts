// THE DAY-CROSS SWEEP, MOUNTED, ON A FAKE CLOCK – R2-11 / ARCH-06.
//
// ⚠ WHY THIS FILE EXISTS AND WHAT IT REPLACES. The sweep's only cover was a set of source pins in
// `tests/calendar-screen.test.ts` reading the screen's own text back at itself
// (`expect(screen).toContain('let timers: ReturnType<typeof setTimeout>[] = []')`). The review named
// them: "Its 1,079-line source test pins timer and skip implementation strings", and named the fix:
// "Convert the animation assertions to a mounted fake-timer test." A pin on a timer proves the word
// `setTimeout` is in the file. It cannot tell you the sixth day is struck out at 2,571ms, and it
// certainly cannot tell you that switching careers mid-sweep disarms an irreversible act.
//
// ⚠ AND A TIMER ONLY REAL TIME CAN EXERCISE IS A TEST NOBODY RUNS. Three seconds of wall clock per
// case, times a dozen cases, is a suite that gets skipped. `vi.useFakeTimers()` makes the whole
// timeline instantaneous AND exact – the boundary cases below step to `at[i] - 1` and then to
// `at[i]`, which no real clock can do reliably.
//
// ⚠ MUTATION-VERIFIED. Each block names, in its own comment, the mutation that turns it red. Nothing
// in here was believed on a green run alone.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { calendarWeekFor } from '../../src/composables/weekDays'
import { DAY_CROSS_PACE, dayCrossPace, dayCrossSchedule } from '../../src/composables/dayCross'
import type { Snapshot } from '../../src/shared/protocol'

/** A career on `seed`, ticked `weeks` weeks. The walk is the real engine – nothing here is a stub. */
function snapshotAt(weeks: number, seed: string): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⚠ THE WEEKS ARE CHOSEN, NOT ASSUMED, and the fixture test below proves each choice. Week 3 of this
 *  career is an ordinary training week with NO beat on it (so the schedule is seven even steps and
 *  nothing about a hold can hide inside a boundary case); week 6 carries exactly one. */
const PLAIN_WEEK = 3
const BEAT_WEEK = 6
const SEED = 'cal-sweep'
/** A DIFFERENT career, for the switch. Same week number on purpose: if the sweep only watched the
 *  week it would see no change at all, which is the bug this fixture is shaped to catch. */
const OTHER_SEED = 'cal-sweep-2'

/** The timeline the sweep is going to run, computed independently of the component – the same way
 *  `runningScore` in the MatchViewer net restates the rules of tennis rather than asking the thing
 *  under test what the answer is. */
function plannedFor(snap: Snapshot) {
  const week = calendarWeekFor(snap, snap.week + 1)
  const pace = DAY_CROSS_PACE[dayCrossPace()]
  return { week, pace, plan: dayCrossSchedule(week.days.map((d) => d.beat !== null), pace) }
}

function mountCalendar() {
  return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
}
type Wrapper = ReturnType<typeof mountCalendar>

/** How many day heads currently carry the struck-out class – the sweep's only visible output. */
function crossedCount(w: Wrapper): number {
  return w.findAll('.cal-time-day--crossed').length
}
/** The index of the day the sweep is pausing on, or -1. */
function heldIndex(w: Wrapper): number {
  return w.findAll('.cal-col').findIndex((c) => c.classes().includes('cal-col--held'))
}
function advancesEmitted(w: Wrapper): number {
  return w.emitted('advance')?.length ?? 0
}

/** Press the week button. ⚠ THE PRESS IS A REAL CLICK on the real CTA, so the capture listener that
 *  the whole skip mechanism hangs off is in the path – see `skipSweep`'s note in
 *  `composables/dayCrossSweep.ts` for the bug that ordering fixes. */
async function pressGo(w: Wrapper): Promise<void> {
  const go = w.find('.cal-go-btn')
  expect(go.exists(), 'the calendar drew no week button to press').toBe(true)
  await go.trigger('click')
  await nextTick()
}

/** Step the fake clock and let Vue paint. */
async function tick(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('the day-cross sweep – the fixture is real and the schedule is not vacuous', () => {
  it('week 3 is an animating training week with seven days and NO beat on it', () => {
    const { week, plan } = plannedFor(snapshotAt(PLAIN_WEEK, SEED))
    expect(week.animates, 'a week another surface owns runs no sweep at all').toBe(true)
    expect(week.days.length).toBe(7)
    expect(week.days.filter((d) => d.beat !== null).length).toBe(0)
    // Seven even steps at the brisk pace: 3000/7 = 428.57..., so at[0]=429 and total=3000.
    expect(plan.at.length).toBe(7)
    expect(plan.total).toBe(DAY_CROSS_PACE.brisk.sweepMs)
    expect(plan.at[0]).toBe(429)
    expect(plan.at[6]).toBe(3000)
  })

  it('week 6 carries exactly one beat, so the hold has something to hold on', () => {
    const { week, plan, pace } = plannedFor(snapshotAt(BEAT_WEEK, SEED))
    expect(week.animates).toBe(true)
    const beats = week.days.map((d) => d.beat !== null)
    expect(beats.filter(Boolean).length).toBe(1)
    // ...and the hold really does lengthen the run, or the assertions below would pass on either.
    expect(plan.total).toBe(DAY_CROSS_PACE.brisk.sweepMs + pace.holdMs)
  })

  it('the two careers are genuinely different careers, or the switch test is vacuous', () => {
    const one = snapshotAt(PLAIN_WEEK, SEED)
    const two = snapshotAt(PLAIN_WEEK, OTHER_SEED)
    expect(two.careerId).not.toBe(one.careerId)
    // ...and they are parked on the SAME week, so only the career id can trip the watch.
    expect(two.week).toBe(one.week)
  })

  it('the button is live on that week – a blocked CTA would start no sweep', async () => {
    useGameStore().snapshot = snapshotAt(PLAIN_WEEK, SEED)
    const w = mountCalendar()
    expect(w.find('.cal-go-btn').attributes('disabled')).toBeUndefined()
    w.unmount()
  })
})

describe('the day-cross sweep – a day is struck out AT its boundary and never inside one', () => {
  // ⚠ MUTATION ARM: change `crossed.value = i + 1` to `crossed.value = i` in
  // `composables/dayCrossSweep.ts` and the boundary case below goes red at the first step
  // (expected 1, got 0). Change `plan.at[i]` to `plan.at[i] - 1` and it goes red the other way.
  it('nothing is crossed one millisecond before the first day is due', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    expect(crossedCount(w), 'the press itself crossed something out').toBe(0)
    await tick(plan.at[0] - 1)
    expect(crossedCount(w), `a day was struck out before ${plan.at[0]}ms`).toBe(0)
    await tick(1)
    expect(crossedCount(w), `Monday was not struck out at ${plan.at[0]}ms`).toBe(1)
    w.unmount()
  })

  it('every one of the seven crosses lands exactly on its own boundary', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    let at = 0
    for (let i = 0; i < plan.at.length; i++) {
      await tick(plan.at[i] - 1 - at)
      expect(crossedCount(w), `day ${i} was struck out early`).toBe(i)
      await tick(1)
      expect(crossedCount(w), `day ${i} was not struck out at ${plan.at[i]}ms`).toBe(i + 1)
      at = plan.at[i]
    }
    w.unmount()
  })

  it('NOTHING MOVES INSIDE A DAY: the whole gap between two boundaries changes nothing', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    // Land exactly on the third boundary, then walk the whole of the fourth day in ten steps.
    await tick(plan.at[2])
    expect(crossedCount(w)).toBe(3)
    const gap = plan.at[3] - plan.at[2]
    expect(gap, 'the two boundaries are the same instant – nothing to walk').toBeGreaterThan(10)
    for (let step = 1; step < 10; step++) {
      await tick(Math.floor(gap / 10))
      expect(crossedCount(w), `a day was struck out inside day 3 (${step}/10 of the way)`).toBe(3)
      expect(advancesEmitted(w), 'the week was spent mid-sweep').toBe(0)
    }
    w.unmount()
  })

  // ⚠ MUTATION ARM: drop the `timers.push(setTimeout(finishSweep, plan.total))` line and this goes
  // red with 0 advances; move it to `plan.at[6]` on a week with a hold and the beat test goes red.
  it('the advance fires once, at the end, and not one millisecond before', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    await tick(plan.total - 1)
    expect(advancesEmitted(w), 'the week was spent before the sweep finished').toBe(0)
    await tick(1)
    expect(advancesEmitted(w), 'the sweep finished without spending the week').toBe(1)
    // ...and it stays at one however long the clock runs on.
    await tick(10_000)
    expect(advancesEmitted(w), 'the sweep spent the week twice').toBe(1)
    w.unmount()
  })

  it('a beat holds the sweep on its day, and then it carries on – the pause the owner asked for', async () => {
    const snap = snapshotAt(BEAT_WEEK, SEED)
    const { week, plan, pace } = plannedFor(snap)
    const beatDay = week.days.findIndex((d) => d.beat !== null)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    await tick(plan.at[beatDay])
    expect(crossedCount(w)).toBe(beatDay + 1)
    expect(heldIndex(w), 'the sweep did not visibly hold on the day with the beat').toBe(beatDay)
    await tick(pace.holdMs - 1)
    expect(heldIndex(w), 'the hold let go early').toBe(beatDay)
    await tick(1)
    expect(heldIndex(w), 'the hold never let go').toBe(-1)
    // ...and the day AFTER the beat waited for the hold rather than borrowing time from it.
    expect(crossedCount(w), 'the sweep ran on through its own pause').toBe(beatDay + 1)
    w.unmount()
  })
})

describe('the day-cross sweep – the cancel paths, which is the half that can hurt someone', () => {
  // ⚠ MUTATION ARM: drop `careerId` from the `runId` getter in CalendarScreen.vue (leaving the week,
  // which does not change on a load) and this goes red twice – the strokes stay on screen and the
  // dead career's advance fires.
  it('A CAREER SWITCH MID-SWEEP STANDS IT DOWN, and the old career never spends a week', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    const store = useGameStore()
    store.snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    await tick(plan.at[2])
    expect(crossedCount(w), 'the sweep never got going, so there is nothing to cancel').toBe(3)

    // The load: another career, on the same week number.
    store.snapshot = snapshotAt(PLAIN_WEEK, OTHER_SEED)
    await nextTick()
    expect(crossedCount(w), 'the new career opened on a pre-crossed grid').toBe(0)
    expect(w.find('.cal-go-skip').exists(), 'the skip hint survived the switch').toBe(false)

    // ...and the timers of the career nobody is looking at are disarmed.
    await tick(plan.total * 2)
    expect(advancesEmitted(w), 'a switched-away career advanced a week by itself').toBe(0)
    w.unmount()
  })

  it('...and so does the week landing under it, which is the same watch', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    const store = useGameStore()
    store.snapshot = snap
    const w = mountCalendar()
    await pressGo(w)
    await tick(plan.at[3])
    expect(crossedCount(w)).toBe(4)

    store.snapshot = snapshotAt(PLAIN_WEEK + 1, SEED)
    await nextTick()
    expect(crossedCount(w), 'the next week arrived pre-crossed').toBe(0)
    await tick(plan.total * 2)
    expect(advancesEmitted(w)).toBe(0)
    w.unmount()
  })

  // ⚠ MUTATION ARM: delete `onBeforeUnmount(resetSweep)` from the composable and this goes red on
  // the timer count – the orphaned timers survive the screen.
  //
  // ⚠ AND IT IS THE TIMER COUNT RATHER THAN THE EMIT, WHICH IS A FINDING ABOUT THE TEST AND NOT
  // ABOUT THE COMPONENT. The obvious assertion – unmount, run the clock, `expect(emitted('advance'))
  // .toBe(0)` – PASSES with the unmount hook deleted, because `@vue/test-utils` stops recording
  // emits once a wrapper is unmounted: the observation is blind exactly where this test needs to
  // see. Measured, not assumed: with the hook removed the probe read 0 instead of the 1 that the
  // orphaned timer really does fire. `vi.getTimerCount()` observes the thing the guarantee is
  // actually about – no timer of this screen's outlives it – and it is not blind.
  it('UNMOUNTING MID-SWEEP disarms it – a tab switch may not spend a week', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)
    await tick(plan.at[1])
    expect(crossedCount(w)).toBe(2)
    expect(vi.getTimerCount(), 'the sweep armed no timers, so there is nothing to disarm').toBeGreaterThan(0)

    w.unmount()
    expect(vi.getTimerCount(), 'a timer outlived the screen that armed it').toBe(0)
    // ...and running the clock on cannot resurrect it.
    await tick(plan.total * 2)
    expect(vi.getTimerCount()).toBe(0)
  })

  // ⚠ MUTATION ARM: remove `if (!running.value) return` from `skipSweep` and the first case goes red
  // (the opening press cancels its own sweep and the week is spent instantly, 5ms after the press –
  // the measured bug the capture listener exists for).
  it('A TAP ANYWHERE SKIPS, and the press that STARTS the sweep is not one', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)

    // The opening press must not have skipped its own sweep.
    expect(advancesEmitted(w), 'the press that started the sweep also ended it').toBe(0)
    expect(crossedCount(w)).toBe(0)
    expect(w.find('.cal-go-skip').exists(), 'the skip was never offered').toBe(true)

    await tick(plan.at[1])
    expect(crossedCount(w)).toBe(2)
    // ...and now a tap anywhere on the shell ends it at once.
    await w.find('.cal').trigger('click')
    await nextTick()
    expect(crossedCount(w), 'the skip did not strike the rest of the week out').toBe(7)
    expect(advancesEmitted(w), 'the skip did not spend the week').toBe(1)
    // ...instantly: no clock ran between the tap and the advance.
    expect(w.find('.cal-go-skip').exists(), 'the screen still invites a skip with nothing left').toBe(false)
    w.unmount()
  })

  it('a skipped sweep does not then fire its own scheduled end a second time', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)
    await tick(plan.at[0])
    await w.find('.cal').trigger('click')
    await nextTick()
    expect(advancesEmitted(w)).toBe(1)
    await tick(plan.total * 2)
    expect(advancesEmitted(w), 'the cleared timers fired anyway').toBe(1)
    w.unmount()
  })

  it('a second press cannot start a second sweep on top of a running one', async () => {
    const snap = snapshotAt(PLAIN_WEEK, SEED)
    const { plan } = plannedFor(snap)
    useGameStore().snapshot = snap
    const w = mountCalendar()
    await pressGo(w)
    await tick(plan.at[1])
    // The button is still on screen; pressing it is a TAP, so it skips rather than restarting.
    await pressGo(w)
    expect(crossedCount(w)).toBe(7)
    expect(advancesEmitted(w), 'the second press started a second sweep').toBe(1)
    await tick(plan.total * 2)
    expect(advancesEmitted(w)).toBe(1)
    w.unmount()
  })
})
