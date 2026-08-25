// THE SWEEP THAT CROSSES THE DAYS OUT – the STATE OWNER, lifted out of CalendarScreen.vue (R2-11 /
// ARCH-06). Its sibling `dayCross.ts` is the SCHEDULE and the PREFERENCE: both paces, the beat holds,
// the two localStorage flags and the reduced-motion rule, all pure. This file is the running thing –
// the crossed/held counters, the timers, the cancel paths and the skip.
//
// -------------------------------------------------------------------------------------------------
// WHY IT LEFT THE SCREEN, in the review's own words
// -------------------------------------------------------------------------------------------------
// ARCH-06: "CalendarScreen.vue is 1,359 lines. Its script owns screen orchestration, grid projection,
// event modal state and a timer/lifecycle-driven irreversible day-cross sweep." Four owners in one
// file, and the fourth is the only one that can advance a career. It also names the fix exactly:
// "extract only `useDayCrossSweep`, owning crossed/held/running state, timers, watch/unmount, run and
// skip. Convert the animation assertions to a mounted fake-timer test. Keep the calendar grid and the
// event card in the screen."
//
// ⚠ NOTHING ABOUT THE ANIMATION CHANGED IN THE MOVE. Every comment below is the screen's own, carried
// verbatim, because the reasoning IS the record (CLAUDE.md's rule for moved code) – and every ruling
// in it is the owner's, quoted under its own date in docs/decisions.md.
//
// -------------------------------------------------------------------------------------------------
// ⚠ IT TAKES GETTERS, NOT A STORE
// -------------------------------------------------------------------------------------------------
// The screen reads `useGameStore()`; this file does not, and that is what makes the sweep testable
// without a career. `week()` is the calendar week the grid is drawing, `runId()` is the identity the
// sweep resets on (career + week), and `onFinish()` is the press being handed back to the shell. The
// screen wires all three to what it already had, so the composition root stays the store-aware one –
// TOK-08's rule, and the same shape `useEventCard`/`useWeekAction` already have.
import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import { DAY_CROSS_PACE, dayCrossPace, dayCrossRuns, dayCrossSchedule } from './dayCross'
import { DAY_LONG, type CalendarWeek } from './weekDays'

export interface DayCrossSweep {
  /** how many days are struck out right now – the template's `d.index < crossed` */
  crossed: Ref<number>
  /** the day the sweep is pausing on, or null. It pulses while the hold runs. */
  heldIndex: Ref<number | null>
  /** does the sweep own this press? ⚠ TRUE FROM THE LAST STROKE UNTIL THE NEW SNAPSHOT LANDS – see
   *  `skippable` for why that gap matters and why the two are different questions. */
  running: Ref<boolean>
  /** how long ONE stroke is drawn over, handed to CSS as a custom property */
  strokeMs: Ref<number>
  /** is there anything left to skip? */
  skippable: ComputedRef<boolean>
  /** take the press: run the sweep, or hand it straight back when there is no sweep to run */
  play: () => void
  /** any tap while the sweep is running ends it immediately */
  skip: () => void
  /** put everything back; never advances anything by itself */
  reset: () => void
}

export interface DayCrossSweepOptions {
  /** the calendar week the grid is drawing, live – null before a snapshot arrives */
  week: () => CalendarWeek | null
  /** the career+week identity: when it changes, the sweep stands down (see the watch below) */
  runId: () => string
  /** the week is over: hand the press to the shell. THE SCREEN NEVER ADVANCES ANYTHING ITSELF. */
  onFinish: () => void
}

// --- (b) THE DAYS CROSS THEMSELVES OUT ----------------------------------------------------------
//
// A SIMPLE ANIMATION OF THE DAYS BEING CROSSED OUT – the owner's own words, verbatim in
// docs/decisions.md. It runs through, or pauses on a match / an injury / a knock
// and then continues, and it ends on the end-of-week screen. The last clause is already true and costs
// nothing: the sweep finishes, the advance fires, and App.vue's own door takes the player to the
// week's story exactly as it does from Home.
//
// ⚠ IT IS THE SCREEN'S DECORATION, NOT THE BUTTON'S, and that is why Home's press still advances
// instantly. The two controls share their STATE (label, mode, blocked) and that is what "one button in
// two projections" is about; the sweep is a property of the surface that draws seven days, and Home
// draws none. A player who wants the beat presses it here.
//
// CANCELLABLE, AND SKIPPABLE BY A TAP ANYWHERE.
//   * every timer is held in one array and cleared together, from the skip, from a career/week change,
//     and from `onBeforeUnmount` - so a tab switch mid-sweep cannot advance a week from a screen that
//     is no longer on the page, which is the one way an animation in front of an irreversible act can
//     actually hurt someone;
//   * a tap during the sweep goes straight to the end: strike everything out, fire the advance. No
//     confirmation, no "are you sure" - it is a skip, and skips are instant or they are not skips.
export function useDayCrossSweep(options: DayCrossSweepOptions): DayCrossSweep {
  const crossed = ref(0)
  const heldIndex = ref<number | null>(null)
  const running = ref(false)
  /** How long ONE stroke is drawn over – a single step of the sweep, so a line finishes as the next one
   *  starts. Handed to CSS as a custom property rather than written into the sheet, because the duration
   *  is one constant with two settings and a stylesheet cannot read a setting. Seeded from the default
   *  pace so the very first stroke of a session is not drawn instantly. */
  const strokeMs = ref(dayCrossSchedule(new Array(DAY_LONG.length).fill(false), DAY_CROSS_PACE.brisk).strokeMs)
  let timers: ReturnType<typeof setTimeout>[] = []

  function clearTimers(): void {
    for (const t of timers) clearTimeout(t)
    timers = []
  }

  /** Put everything back. Used by the cancel paths; never advances anything by itself. */
  function resetSweep(): void {
    clearTimers()
    running.value = false
    heldIndex.value = null
    crossed.value = 0
  }

  /** The week is over: hand the press to the shell. `running` stays true and the strokes stay drawn until
   *  this screen unmounts (the story opens over it) or the new week resets them below – a grid that
   *  un-crosses itself for one frame before the story appears would read as the sweep failing. */
  function finishSweep(): void {
    clearTimers()
    heldIndex.value = null
    options.onFinish()
  }

  // A week landing under the sweep puts the grid back: with the automatic week story switched off the
  // player stays right here, and `calendar` has already recomputed to the NEXT week ahead - which must
  // not arrive pre-crossed.
  //
  // ⚠ AND A CAREER SWITCH IS THE SAME EVENT, which is why the identity carries the career id and not
  // just the week number. Loading another save mid-sweep leaves the timers of a career nobody is
  // looking at armed over an irreversible act; the reset disarms them, and the advance never fires.
  watch(
    () => options.runId(),
    () => resetSweep(),
  )
  onBeforeUnmount(resetSweep)

  /** THE SKIP. Any tap on the calendar while the sweep is running ends it immediately.
   *
   *  ⚠ IT IS A CAPTURE LISTENER, AND THAT IS THE BUG FIX RATHER THAN A FLOURISH. On the bubble phase the
   *  press that STARTS the sweep also arrives here - the CTA's own handler runs first, sets `running`, and
   *  the same click then bubbles to the shell and cancels the sweep it had just begun. Measured in the
   *  browser: the sweep reached seven struck-out days 5ms after the press, every time. On capture the
   *  order is inverted, so the first press sees `running: false` and falls through to the button, and
   *  every LATER press - anywhere, the button included - is a skip. No flag, no timer, no guessing at
   *  which element was tapped. (The listener itself is still the screen's, on the shell it draws.) */
  function skipSweep(): void {
    if (!running.value) return
    crossed.value = options.week()?.days.length ?? 0
    finishSweep()
  }

  /** Is there anything left to skip? The hint is gated on this rather than on `running` alone: `running`
   *  stays true from the last stroke until the new snapshot lands (it means "the sweep owns this press",
   *  which is what keeps a second press from starting a second sweep in that gap), and inviting a skip
   *  when the week is already over would be a control that does nothing. */
  const skippable = computed(() => running.value && crossed.value < (options.week()?.days.length ?? 0))

  /** Hand the press to the shell – after the sweep, or straight away when there is no sweep to run.
   *  The handler is the shell's either way, so nothing about what a press COSTS lives on this screen. */
  function play(): void {
    const week = options.week()
    // Off, or a system reduced-motion preference, or a week another surface owns: the old behaviour,
    // byte for byte - press, advance. That is the whole promise of the switch.
    if (!week || !dayCrossRuns(week.animates)) {
      options.onFinish()
      return
    }
    const pace = DAY_CROSS_PACE[dayCrossPace()]
    const plan = dayCrossSchedule(
      week.days.map((d) => d.beat !== null),
      pace,
    )
    strokeMs.value = plan.strokeMs
    running.value = true
    crossed.value = 0
    week.days.forEach((day, i) => {
      timers.push(
        setTimeout(() => {
          crossed.value = i + 1
          if (day.beat === null) return
          // the pause the owner asked for, and it is VISIBLE: the held day pulses while the sweep waits
          heldIndex.value = i
          timers.push(setTimeout(() => (heldIndex.value = null), pace.holdMs))
        }, plan.at[i]),
      )
    })
    timers.push(setTimeout(finishSweep, plan.total))
  }

  return { crossed, heldIndex, running, strokeMs, skippable, play, skip: skipSweep, reset: resetSweep }
}
