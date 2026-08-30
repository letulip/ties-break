<script setup lang="ts">
// SCREEN H – THE CALENDAR (design handoff §H "Calendar (Week View)", parked since 29.07 with the
// owner's own ruling: THE CONCEPT COMES FIRST. This is the concept, agreed, built.)
//
// ⚠ THE OWNER'S RULINGS BELOW ARE TRANSLATED, NOT SUMMARISED. This is a `.vue`, so its comments are
// English – and every ruling in this file is quoted in his own words, under its own date, in
// docs/decisions.md (17.08.2026, "eighteen owner rulings"). Translate one, never shorten it: the
// reasoning IS the record, and the record now lives in two places rather than one.
//
// -------------------------------------------------------------------------------------------------
// WHY IT EXISTS, in his words
// -------------------------------------------------------------------------------------------------
// A training week today is "skip, or match + skip" - one or two clicks and the end-of-week screen -
// which feels thin next to a tournament trip. He asked for MORE DECORATION, BUT DECORATION THAT
// MEANS SOMETHING (his words verbatim in docs/decisions.md): a
// calendar tab that is ACTIVE on the weeks that currently have nothing to them, the day layout from
// her training plan across the days, matches marked, injury weeks legible, markers for the
// tournaments she could actually enter, and a real main action button like Home's.
//
// -------------------------------------------------------------------------------------------------
// WHAT THIS SCREEN IS NOT, because the app already has two things it could be mistaken for
// -------------------------------------------------------------------------------------------------
//
// IT IS NOT THE SEASON PLANNER. Season is the FEED: every week in the horizon, as a card, with the
// booking and entry controls on it. That screen answers "what shall I do with the next two months".
// This one answers "what is she about to spend the next seven days on", and its one act is to spend
// them. The overlap is deliberate and it is one item: a tournament she could enter is reachable from
// both, and from here it is reachable in ONE tap on the thing itself rather than as one card among
// twenty. The owner named that item the most valuable part of the slice, and it is why the markers
// are not garnish.
//
// IT IS NOT THE WEEK'S STORY. Screen D (ThisWeekScreen + WeekRecapCard) is about the week that just
// ENDED. This is the week about to START, which is why the grid is `week + 1` and not today - the
// same week the main button plays. Pressing the button here ends up on D, which is the beat the owner
// described: the days cross themselves out, and the story opens as the week closes.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THE TAB IS LIVE ON EVERY WEEK, AND THAT IS A DEPARTURE FROM THE LITERAL ASK
// -------------------------------------------------------------------------------------------------
// He said "a Calendar tab, made ACTIVE on non-tournament weeks". Read as a dynamic disabled state
// that is a worse screen and a worse tab bar, for a reason the app has already written down once: the
// placeholder was dimmed rather than absent precisely so the bar would read as "next" rather than as
// "broken" (App.vue's TABS note), and a tab that greys out on a third of the weeks reads as broken
// every time. tests/round13-nav.test.ts also pins the bar to exactly five entries in exactly one
// order, and that pin is the owner's.
//
// So the tab is always live and the SCREEN honours the sentence instead: on a tournament week the
// grid says she is away, the day marks stop pretending she is training, the crossing-out animation
// stands down (the tournament flow owns that week end to end), and the button is the trip's. The
// calendar defers to the trip rather than being taken away from him.
//
// -------------------------------------------------------------------------------------------------
// WHERE THE FACTS COME FROM
// -------------------------------------------------------------------------------------------------
// `composables/weekDays.ts` - the day layout, the look-ahead rows, and the argument for every
// convention in them (which days are sessions, which one is the gym, where a booked match lands).
// Nothing on this screen is derived twice, and nothing here is editable: docs/specs/
// coach-as-load-manager.md risk (b) rules out weekly load sliders, so the grid DISPLAYS what the plan
// preset already means and the plan itself is still set on the This-week screen.
//
// `composables/weekAction.ts` - the main button. It is ONE button in two projections, not two
// buttons: Home's floating pill and this screen's CTA read the same label, the same mode and the same
// blocked state, and the press routes into the shell's one handler. See that file for the whole
// argument and for the arrival-gate bug it is written against.
import { computed, onMounted, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { useCalendarWeek, useLookAhead, DAY_LONG, type CalendarDay, type DayKind } from '../../composables/weekDays'
// The SECOND drawing of the same week: the design's time x day grid. What a day of each kind looks
// like across a morning and an afternoon is a rule with content in it, so it lives in a pure module
// beside the day layout rather than in this template - see composables/weekGrid.ts for the owner's
// two rulings behind it (the engine keeps no time of day, and the age band is a parameter from the
// first version).
import { GRID_HOURS, blockOffset, hourLabel, hourTop, weekGridFor } from '../../composables/weekGrid'
// The scrap of paper beside the grid. Deliberately NOT licensed against the week - see the module's
// header for the owner's ruling and for why the pick is made here rather than by the sim.
import { fridgeNoteFor, type NoteMood } from '../../composables/fridgeNote'
import { useWeekAction } from '../../composables/weekAction'
// Slice 2: the crossing-out sweep, in TWO composables and no longer in this file at all.
// `dayCross.ts` is the SCHEDULE and the preference (both paces, the beat holds, the localStorage
// pair, the reduced-motion rule) – all pure. `dayCrossSweep.ts` is the STATE OWNER the review asked
// for (R2-11 / ARCH-06): the crossed/held counters, every timer, the cancel paths and the skip. What
// is left here is the seven spans that draw it and the three getters the owner is wired to.
import { useDayCrossSweep } from '../../composables/dayCrossSweep'
import { weekDateLine, weekDayNumbers, weekLabel, weekRange } from '../../shared/dates'
import { formatCents, entryFeeLabel } from '../../shared/money'
// D4 (docs/specs/e2e-coverage.md §12): the ONE accessible name for an Enter, shared with Season.
import { enterActionName } from '../../composables/eventName'
// The upcoming-event card's shared parts, owned once and drawn by the Season feed too.
import { firstMatchLabel, firstMatchTitle, useEventCard } from '../../composables/eventCard'
// The app's one red-to-green ramp, shared with the three condition rings. `{ fraction }` names the
// scale IN the call: this number is a 0..1 chance, not a 0..100 percentage, and the signature will
// not let the two be confused.
import { readingColor } from '../../composables/readingColor'
import ScreenShell from '../ui/ScreenShell.vue'
import PaperNote from '../ui/PaperNote.vue'
import TakeoverShell from '../ui/TakeoverShell.vue'
import Card from '../ui/Card.vue'
import Eyebrow from '../ui/Eyebrow.vue'
import IconButton from '../ui/IconButton.vue'
import AppIcon from '../ui/AppIcon.vue'
import PrimaryPill from '../ui/PrimaryPill.vue'
import ProgressRing from '../ui/ProgressRing.vue'
import SurfaceMark from '../ui/SurfaceMark.vue'
import type { UpcomingEvent } from '../../shared/protocol'

// THE SCREEN ASKS, THE SHELL ACTS - the idiom Home and Kid already use for `navigate`, and the reason
// it matters more here than there: advancing a week is the one irreversible act in this game, so there
// must be exactly ONE place in the app that performs it. App.vue's `playWeek` is that place; this
// screen never touches `game.advance`, which is the property tests/round13-nav.test.ts holds every
// tab screen to.
const emit = defineEmits<{ advance: []; autoPlayed: [] }>()

/** ⚠ THE PRESS ARRIVED FROM SOMEWHERE ELSE. "We press training week – we see the calendar and a
 *  short animation of the week going by" (owner, 31.07; his words verbatim in docs/decisions.md):
 *  the week button on Home no longer spends the week
 *  where it is pressed - it brings the player HERE and this screen plays it, because the sweep is
 *  what stands in for a trip on a week with no tournament in it.
 *
 *  ⚠ A ONE-SHOT, AND IT IS CONSUMED ON MOUNT RATHER THAN WATCHED. The shell sets the flag in the same
 *  tick it switches the tab, so this component is CREATED with the flag already true and a watcher
 *  would never see it change. Consuming it in `onMounted` and telling the shell to clear it is what
 *  keeps "open the Calendar tab by hand" from spending a week: the flag is false by then. */
const props = defineProps<{ autoPlay?: boolean }>()

const game = useGameStore()

const calendar = useCalendarWeek()
const lookAhead = useLookAhead()
const action = useWeekAction()

const week = computed(() => game.snapshot?.week ?? 0)
/** The header's line, for the week the grid is about. One formatter, shared with Home's hero. */
const dateLine = computed(() => weekDateLine(week.value + 1))

/** She is laid up across the week the grid shows – the red chip on the grid's own head. Read off the
 *  layout rather than re-derived: `calendarWeekFor` has already asked the engine's window predicate. */
const injuredNow = computed(() => calendar.value?.days[0]?.kind === 'rehab')
/** She is at a tournament across the week the grid shows – the one week whose COURT is her own, and
 *  therefore the one week that may name it (see the verdict line under the grid).
 *
 *  ⚠ THE HEADER'S SURFACE CHIP IS GONE BECAUSE OF THIS, and the owner's reason is the whole of it
 *  (31.07): the calendar was naming the surface of the championship currently being played – the one
 *  she did not even travel to – and that is surplus, so it had to go (his words verbatim in
 *  docs/decisions.md). On a training week `calendar.surface` is the dominant
 *  surface of the season BLOCK - the court of an event that is running that week and that she is not
 *  at - so the calendar was reporting somebody else's tournament on a page about her own week.
 *  `calendarWeekFor` overrides both the surface and its verdict with the EVENT's on a week she is
 *  playing one, which is why that week keeps its court and every other week now names none. */
const awayNow = computed(() => calendar.value?.days[0]?.kind === 'away')
/** The layoff's clock, for the chips' tooltips. Same arithmetic every other surface prints, so the
 *  DATE can never differ from the Season screen's plaque even though the sentence has a different
 *  lead (a calendar has room to name what is wrong with her; a 6px chip has not). */
const layoffNote = computed(() => {
  const s = game.snapshot
  return s?.injury ? `Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}` : ''
})

// --- the grid's vocabulary ---------------------------------------------------------------------
// One word per day kind, and it is the ACCESSIBLE name rather than a caption: the cell shows a mark
// and, on the two days that are not the week's default, a word. A screen reader gets the sentence.
const KIND_WORD: Record<DayKind, string> = {
  court: 'on court',
  gym: 'in the gym',
  rest: 'rest day',
  match: 'practice match',
  away: 'away at the tournament',
  off: 'no tennis',
  school: 'school exams',
  rehab: 'rehab',
  // ⭐ ROUND 28 #6 – the sponsor's shoot. A day, not a week: the days around it are still the plan's.
  shoot: 'at the shoot',
}
function dayName(d: Pick<CalendarDay, 'index' | 'kind'>): string {
  return `${DAY_LONG[d.index]} – ${KIND_WORD[d.kind]}`
}

/** THE WEEK IN HOURS. Null only when there is no snapshot to draw one from.
 *
 *  ⚠ IT USED TO BE NULL ON FOUR KINDS OF WEEK, AND THE OWNER OVERRULED THAT (31.07): it most
 *  certainly SHOULD be drawn, no difference at all – only the contents of the grid will be different
 *  (his words verbatim in docs/decisions.md). A trip, a family
 *  week, the exam fortnight and a layoff all draw the grid now, each with its own content, and this
 *  screen no longer keeps a second, plainer drawing for them. What each week is made of and the
 *  convention behind it live in composables/weekGrid.ts, where the ordinary week's conventions
 *  already lived; this file draws what it is handed.
 *
 *  The dates come from the shared formatter, so the heads over the columns and the span printed in
 *  the header above them are the same seven days. Her age comes off the snapshot: the calendar does
 *  not compute it and cannot disagree with the Kid screen about it. */
const grid = computed(() => {
  const week = calendar.value
  const snap = game.snapshot
  return week && snap ? weekGridFor(week, snap.ageYears, weekDayNumbers(week.week), snap.seed) : null
})

/** WHICH POOL THE SCRAP COMES FROM. The domestic pool is the default and stays unlicensed (the
 *  owner's 30.07 ruling, in full, in composables/fridgeNote.ts); the two week pools exist because on
 *  a week that HAS a big fact in it a note about that fact is simply true - "good luck in the exam",
 *  "we have got our fingers crossed for you" (31.07; both in his own words in docs/decisions.md).
 *
 *  ⚠ A FAMILY WEEK AND A LAYOFF STAY DOMESTIC, deliberately: "enjoy the holiday" and "hope it heals"
 *  are claims about how the week GOES, and the fridge does not know that in advance. Exams and a
 *  tournament are facts the week already contains before it is played. */
const NOTE_MOOD: Record<DayKind, NoteMood> = {
  court: 'home',
  gym: 'home',
  rest: 'home',
  match: 'home',
  away: 'trip',
  off: 'home',
  school: 'exam',
  rehab: 'home',
  // ⭐ ROUND 28 #6 – A SHOOT DAY KEEPS THE DOMESTIC POOL, with the family week and the layoff and
  // for their reason: the two week pools exist for facts the week already CONTAINS before it is
  // played, and this screen's own week is the ordinary one either way - the shoot takes some of its
  // days, never all of them, so `days[0].kind` (which is what picks the mood) is a training day on
  // almost every shoot week anyway. A scrap about the shoot would be a note about how a working day
  // GOES, which the fridge does not know.
  shoot: 'home',
}

/** THE NOTE ON THE FRIDGE DOOR. Off `(seed, week)` and the week's own kind, so it is the same scrap
 *  every time this week is looked at and a different one next week. The WEEK is the calendar's own -
 *  the one the grid draws and the button plays - so the paper and the picture beside it can never be
 *  about different weeks. See composables/fridgeNote.ts: no engine draw, no sub-stream, no licence. */
const fridgeNote = computed(() => {
  const snap = game.snapshot
  const week = calendar.value
  return snap && week
    ? fridgeNoteFor(snap.seed, week.week,
        NOTE_MOOD[week.days[0]?.kind ?? 'court'],
        snap.diary.facts.lifeStage,
      )
    : ''
})

// --- (d) THE MARKER'S CARD ----------------------------------------------------------------------
// «TAPPING A TOURNAMENT MARKER shows just THAT event's card – not the whole Season feed – with
// enter-or-close.»
//
// ⚠ AND THE CARD IS ITS OWN CONFIRMATION, which is why there is no ConfirmDialog behind the Enter
// here and there is one on Season. On Season the Enter sits on a scrolling feed, where the fee is one
// chip among six and the coach's caution is a line the player has already scrolled past - so the
// confirm is where the numbers get said out loud one last time. Here the whole screen IS the one
// event: the entry fee, the travel bill, the engine's fatigue caution and the coach's own sentence
// are all on it, above two controls that mean enter and close. A modal over a modal to re-read what
// is already on screen would be the tap this flow exists to remove.
const marker = ref<UpcomingEvent | null>(null)
function openMarker(e: UpcomingEvent): void {
  marker.value = e
}
function closeMarker(): void {
  marker.value = null
}
/** Enter, then leave: the entry is made, the calendar behind now shows the trip on that week, and
 *  there is nothing further to decide on this card. Withdrawing and cancelling stay on the Season
 *  screen, where the whole horizon is in view - this card is a door in, not an entry manager. */
function enterMarker(e: UpcomingEvent): void {
  game.enterEvent(e.id)
  marker.value = null
}

const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
function fundsShort(e: UpcomingEvent): boolean {
  return fundsCents.value < e.entryFeeCents
}
// ⚠ THE MARKER CARD'S FOUR SHARED FACTS ARE `composables/eventCard.ts` NOW – the scholarship's
// share, the court's verdict for her build, the photograph, and the odds ring's colour. All four
// were written out here AND on the Season screen, and one of them under a different name: this file
// called it `surfaceVerdict` and Season called it `surfaceNote`, the same call to
// `surfaceStyleHint`, so a grep for either name found one copy and reported no duplication.
// The names the two screens read best under are kept – `surfaceVerdict` is this file's word for it
// and the shared module took that word – but there is one definition behind them.
const { academyCoverPct, surfaceVerdict, venueUrl } = useEventCard()

// --- (b) THE DAYS CROSS THEMSELVES OUT ----------------------------------------------------------
//
// ⚠ THE SWEEP IS `composables/dayCrossSweep.ts` NOW (R2-11 / ARCH-06), AND ONLY THE DRAWING IS LEFT.
// The review counted four state owners in this one script - screen orchestration, the grid
// projection, the event modal and "a timer/lifecycle-driven irreversible day-cross sweep" - and the
// fourth is the only one of them that can spend a week. Everything that made it an owner (the
// crossed/held counters, every timer, the watch, the unmount hook, the run and the skip) moved out
// verbatim, comments included; the owner's rulings behind it are all in that file's header.
//
// WHAT STAYS HERE IS THE PART THAT IS ABOUT THIS SCREEN: seven spans with a struck-out class on
// them, the capture listener on the shell, and the three getters below - which is why the composable
// takes getters rather than the store. The press is still handed back through `emit('advance')`, so
// this screen still never touches `game.advance` (tests/round13-nav.test.ts's property).
const sweep = useDayCrossSweep({
  week: () => calendar.value,
  // A week landing under the sweep, or a career switched underneath it, both stand it down. The
  // career id is in the identity for the second one: another save's timers left armed over an
  // irreversible act is exactly the hazard the cancel paths exist for.
  runId: () => [game.snapshot?.careerId, game.snapshot?.week].join(':'),
  onFinish: () => emit('advance'),
})
const { crossed, heldIndex, running, strokeMs, skippable } = sweep
const skipSweep = sweep.skip

// --- (e) THE MAIN ACTION ------------------------------------------------------------------------
/** Hand the press to the sweep, which hands it to the shell – after the strokes, or straight away
 *  when there is no sweep to run (off, reduced motion, or a week another surface owns). Nothing about
 *  what a press COSTS lives on this screen. */
function runWeek(): void {
  if (action.value.disabled || running.value) return
  sweep.play()
}
/** The shell asked for the week to be played here: take the flag off it and run the sweep. See the
 *  note at `props` for why this is a mount hook and not a watcher. */
onMounted(() => {
  if (!props.autoPlay) return
  emit('autoPlayed')
  runWeek()
})

/** ⚠ THE SCREEN'S OWN CTA STANDS DOWN WHILE A REVEAL IS PAUSED, and the two controls would otherwise
 *  land on the same pixels. App.vue's floating bar is GLOBAL on `pending` - that is the wave-2 split
 *  (resuming an overlay costs nothing, so it is available on every tab) and it is what lets R13-8's
 *  deleted paused-tournament banner stay deleted. So resume is the shell's arm and this screen does
 *  not draw a second copy of it: same state, same handler, one button on screen. */
const showGo = computed(() => !game.snapshot?.pending)
</script>

<template>
  <template v-if="game.snapshot && calendar">
    <!-- THE SKIP: a tap anywhere on the screen ends a running sweep at once. It is on the shell rather
         than on the grid because a skip the player has to aim at is not a skip, and `skipSweep` is a
         no-op when nothing is running, so an ordinary tap on an ordinary day costs nothing.
         `.capture` is load-bearing – see the note at `skipSweep` for the bug it fixes. -->
    <ScreenShell
      class="cal"
      :class="{ 'has-go': showGo, running }"
      :style="{ '--cal-stroke-ms': `${strokeMs}ms` }"
      @click.capture="skipSweep"
    >
      <template #header>
        <!-- ⚠ THE COURT USED TO BE NAMED HERE AND IT WAS SOMEBODY ELSE'S. The header carried a
             surface mark off `calendar.surface`, which on a training week is the dominant surface of
             the SEASON BLOCK - that is, the court of whatever tournament is running that week, an
             event she did not enter and is not at. Struck off by the owner on 31.07 (his sentence is
             quoted at `awayNow` in the script, where it may be quoted in his own language). It is
             worse than clutter: a page about HER week was reporting somebody else's tournament. The
             week she is actually playing one still names its court, one card down. -->
        <div class="cal-topbar">
          <div>
            <h2 class="cal-title">Calendar</h2>
            <p class="cal-dates">{{ dateLine }}</p>
          </div>
        </div>
      </template>

      <!-- ============================================================================
           THE WEEK, ONCE, ON EVERY WEEK OF A CAREER.

           The design's time x day grid: seven columns, hours down the side, a coloured
           block for each thing she does. It used to draw only on an ordinary training
           week, and the other four kinds - a trip, a family week, the exam fortnight, a
           layoff - fell back to a plainer strip of seven day cells. The owner overruled
           that on 31.07: the grid draws on every week and only its CONTENT differs. The
           strip and its stand-down line are deleted rather than left unreachable.

           What each kind of week is made of, and the convention behind every hour in it,
           is composables/weekGrid.ts's business and none of this file's. Nothing here is
           a control.
           ============================================================================ -->
      <Card class="cal-week">
        <div class="cal-week-head">
          <Eyebrow>{{ calendar.title }}</Eyebrow>
          <span v-if="injuredNow" class="pill avail-chip red" :title="layoffNote">injury</span>
        </div>

        <div v-if="grid" class="cal-time">
          <!-- The head: the day and its date, off the shared formatter. The strokes live here
               rather than over the columns - crossing a day off a calendar is a line through its
               NAME, and a 360px column with a line at its waist reads as a mistake. -->
          <div class="cal-time-head" aria-hidden="true">
            <span class="cal-time-gut"></span>
            <div class="cal-time-days">
              <span
                v-for="d in grid"
                :key="d.index"
                class="cal-time-day"
                :class="{ 'cal-time-day--crossed': d.index < crossed }"
              >
                <b>{{ d.short }}</b>
                <i>{{ d.date }}</i>
                <span class="cal-day-cross"></span>
              </span>
            </div>
          </div>

          <div class="cal-time-body">
            <div class="cal-time-gut" aria-hidden="true">
              <span
                v-for="h in GRID_HOURS"
                :key="h"
                class="cal-time-hour"
                :style="{ top: hourTop(h) }"
              >{{ hourLabel(h) }}</span>
            </div>
            <ul class="cal-time-cols" :aria-label="`The seven days of ${dateLine}`">
              <li
                v-for="d in grid"
                :key="d.index"
                class="cal-col"
                :class="{
                  'cal-col--beat': d.beat !== null,
                  'cal-col--crossed': d.index < crossed,
                  'cal-col--held': d.index === heldIndex,
                }"
                :aria-label="dayName(d)"
              >
                <span
                  v-for="(b, i) in d.blocks"
                  :key="i"
                  class="cal-block"
                  :class="`cal-block--${b.kind}`"
                  :style="blockOffset(b)"
                  :title="b.label"
                >{{ b.label }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- The read-out. It IS the legend: rather than a row of glyphs and their names, the week says
             what it is in the same parent's voice every other surface in this app uses for a week. -->
        <p class="cal-readout">{{ calendar.readout }}</p>
        <!-- ⚠ THE COURT'S VERDICT, ON THE ONE WEEK THE COURT IS HERS. `calendarWeekFor` overrides
             both the surface and the verdict with the EVENT's on a week she is playing one, so this
             sentence is "clay is not her surface" the week before she plays on clay - which is the
             useful reading, and the reason the data on `CalendarWeek` survives the header's deletion
             rather than following it. On every other week it would be the same borrowed fact the
             owner struck off the header, one card lower, so it is gated on the trip rather than on
             the verdict merely existing. -->
        <p v-if="awayNow && calendar.surfaceNote" class="cal-court">
          <SurfaceMark :surface="calendar.surface" size="sm" :show-name="false" />
          <span>{{ calendar.surfaceNote }}</span>
        </p>
      </Card>

      <!-- THE FRIDGE NOTE. The design tapes a scrap of paper under the grid with a line in a
           parent's handwriting on it, and this is that scrap. It rides with the GRID, which is now
           every week of a career rather than the ordinary ones only.
           ⚠ THE POOL IS NOT LICENSED AGAINST THE WEEK, WHICH IS THE OWNER'S OWN RULING (30.07). A
           note on a fridge asserts nothing about the week - it is milk, the bins and a rain jacket -
           so there is nothing for an honesty pin to check. What 31.07 added is a small layer on top:
           on the two weeks that carry a fact a parent would mention - the exams, a tournament - the
           scrap may speak to it, because on that week it is true. See `NOTE_MOOD` above. -->
      <PaperNote v-if="grid" class="cal-note" :tilt="-0.8" ruled torn tape>
        <span class="cal-note-label">Notes</span>
        <span class="cal-note-text">{{ fridgeNote }}</span>
      </PaperNote>

      <!-- ============================================================================
           THE LOOK-AHEAD, and the markers. A row is a BAND rather than seven cells because
           the sim has no day resolution past the plan - see composables/weekDays.ts. A row
           carrying a tournament she can act on is a button; every other row is a statement.
           ============================================================================ -->
      <section class="bare cal-ahead-block">
        <h2>Weeks after that</h2>
        <ul class="cal-ahead">
          <li v-for="row in lookAhead" :key="row.week" class="cal-ahead-item">
            <button
              v-if="row.event"
              class="cal-marker"
              type="button"
              :aria-label="`${row.note}, ${row.label}, ${row.dates} – open this tournament`"
              @click="openMarker(row.event)"
            >
              <span class="cal-ahead-week">{{ row.label }}</span>
              <span class="cal-marker-body">
                <span class="cal-marker-name">{{ row.note }}</span>
                <SurfaceMark :surface="row.event.surface" size="sm" />
              </span>
              <span v-if="row.event.entered" class="pill ok">Entered</span>
              <span v-else-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
              <AppIcon v-else class="cal-marker-go" name="dollar" :size="14" />
            </button>
            <div v-else class="cal-band" :class="`cal-band--${row.kind}`">
              <span class="cal-ahead-week">{{ row.label }}</span>
              <span class="cal-band-name">{{ row.note }}</span>
              <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
            </div>
          </li>
        </ul>
        <p class="hint cal-foot-note">
          Only tournaments she can enter are marked here – the whole calendar, and every booking, live
          on the Season tab.
        </p>
      </section>

      <!-- (e) THE MAIN ACTION, in Home's own shape: the export's CTA pill, floating, centred, one
           thumb off the tab bar. Same state and same handler as Home's - see composables/weekAction.ts
           for why that is one composable and not two computeds. -->
      <template v-if="showGo" #footer>
        <div class="cal-go">
          <!-- A SKIP NOBODY IS TOLD ABOUT IS NOT A SKIP. The hint takes the same slot the blocked
               reason does, and the two can never collide: a blocked button cannot start a sweep. -->
          <p v-if="skippable" class="cal-go-note cal-go-skip">Tap anywhere to skip</p>
          <!-- R10-16's doctrine: a disabled control says why, on screen, rather than being dead. -->
          <p v-else-if="action.blockedNote" class="cal-go-note">{{ action.blockedNote }}</p>
          <PrimaryPill
            variant="cta"
            class="cal-go-btn"
            :disabled="action.disabled"
            @click="runWeek"
          >
            {{ action.label }}
          </PrimaryPill>
        </div>
      </template>
    </ScreenShell>

    <!-- (d) ONE EVENT'S CARD, from its marker. The app's one full-screen takeover idiom, so the card
         is the whole screen and there is no feed around it. The cross is the close: this card decides
         one thing and has no screen after it, which is the app's stated rule for when an exit may be
         a bare cross. -->
    <TakeoverShell v-if="marker" :title="marker.label">
      <template #sub>
        <SurfaceMark :surface="marker.surface" size="sm" />
        <!-- ⚠ A SEPARATOR IS NOT OPTIONAL HERE, AND `.event-place-sep` IS NOT AVAILABLE TO BORROW.
             `.tf-sub` sets only a top margin, so its children sit flush - measured at 375, the court
             and the week rendered as "HardW6 '31". The Season screen solves the identical problem in
             the identical slot with a 1px hairline rule, but that class lives in ITS scoped block, so
             using the name here rendered an unstyled empty span and changed nothing. Same object,
             stated where this screen can see it. (The class genuinely wants to be shared vocabulary -
             two screens now draw it - and that is written down in the report rather than smuggled into
             the global sheet by a screen that only needs one of it.) -->
        <span class="cal-card-sep"></span>
        <span class="hint cal-card-when">{{ weekLabel(marker.week) }}</span>
      </template>
      <template #exit>
        <IconButton icon="close" label="Close this tournament" title="Close" @click="closeMarker" />
      </template>

      <Card variant="photo" pad="16px 16px 12px" class="cal-card">
        <div class="cal-card-art">
          <img :src="venueUrl(marker)" alt="" />
          <span class="cal-card-scrim"></span>
        </div>

        <!-- WHICH DAYS, in full. The header names the week in the game's own shorthand; a trip is
             something a family has to book time off for, so the card spells the actual dates out.
             `weekRange` is the shared formatter's self-contained shape (it names the year, because
             nothing else on this card does). -->
        <p class="cal-card-days">{{ weekRange(marker.week) }}</p>

        <p v-if="surfaceVerdict(marker.surface)" class="cal-card-fit">{{ surfaceVerdict(marker.surface) }}</p>

        <div class="cal-card-money">
          <p class="cal-card-money-label">Travel budget</p>
          <p class="cal-card-money-figure">{{ formatCents(marker.travelCostCents) }}</p>
          <p v-if="academyCoverPct > 0" class="cal-card-money-sub">academy covers {{ academyCoverPct }}%</p>
        </div>

        <div class="controls cal-card-chips">
          <!-- ⭐ #28: see SeasonScreen - "no entry fee" is a fact, "$0" is a hole. -->
          <span class="entry-fee">{{ entryFeeLabel(marker.entryFeeCents) }}</span>
          <span class="pill">closes {{ weekLabel(marker.deadlineWeek) }}</span>
          <span v-if="marker.entered" class="pill ok">Entered</span>
        </div>

        <div class="cal-card-odds">
          <ProgressRing
            class="cal-card-ring"
            :value="marker.preview.firstMatchChance"
            :color="readingColor({ fraction: marker.preview.firstMatchChance })"
            :label="firstMatchLabel(marker.preview)"
            :title="firstMatchTitle(marker.preview)"
          >
            <b>{{ Math.round(marker.preview.firstMatchChance * 100) }}</b><i>%</i>
          </ProgressRing>
          <p class="cal-card-odds-note">First round vs {{ marker.preview.opponentName }}</p>
          <!-- ⚠⚠ THE "Rating 1642 vs 1801" LINE WAS HERE AND IS REMOVED BY OWNER RULING (round 21).
               His words, in translation because this file carries no Cyrillic: "I did not ask for
               this, it is surplus information, please take it out." The line shipped one commit
               earlier on a reading of his D&D request that he had not made - he asked for odds that
               are not all the same and that a player is not made to bang her head against, and a
               second number on the card is not that. The ruling itself is quoted in its own words in
               docs/decisions.md, which is where the Russian belongs.

               ⚠ THE MODULE BEHIND IT IS NOT REMOVED and this is deliberate, not an oversight:
               `src/engine/match/rating.ts` reproduces this engine's own match probability to 1.03
               points across every reachable build and all three surfaces, and it is mutation-verified
               in `tests/rating.test.ts`. It simply has no surface. Putting one back is HIS decision
               and not a refactor - `tests/rating.test.ts`'s last block is the guard that says so and
               will go red if this line returns. -->
        </div>

        <!-- Both cautions are the ENGINE's own sentences, and they are independent: one is the rule
             (she is under the tier's condition floor) and one is a person's read of her, so a card
             can carry either, both or neither. Neither is a block - the parent may push. -->
        <p v-if="marker.cautionReason === 'fatigued'" class="caution-note">
          {{ marker.cautionDetail ?? 'Exhausted – racing risks injury.' }}
        </p>
        <p v-if="marker.coachCaution" class="coach-note">{{ marker.coachCaution }}</p>

        <!-- ⚠ P4's COLLEGE NOTE WAS HERE AND IS REMOVED (owner, 16.08). This card is its own
             confirmation, so it carried the same sentence the Season confirm did - a result here can
             cost the college place. Nothing closes the college branch on a result any more, so the
             sentence would be warning about a consequence that cannot happen, next to an active
             Enter. The record of the rule is on the retired `ENDINGS.collegeClosedFromTier`. -->

        <div class="controls cal-card-actions">
          <template v-if="marker.entered">
            <p class="hint cal-card-done">She is in. Withdrawing lives on the Season tab.</p>
          </template>
          <template v-else>
            <!-- ⚠ THE NAME SAYS WHICH TOURNAMENT (defect D4, docs/specs/e2e-coverage.md §12). This
                 card is a takeover about ONE event, so the ambiguity here is across screens rather
                 than within one - the same word, on two live surfaces, meaning two different
                 tournaments. It reads the same `enterActionName` Season's feed does, so the two can
                 never name one event differently; the visible word is unchanged and is still the
                 first word of the name (WCAG 2.5.3). -->
            <PrimaryPill
              :risky="marker.cautionReason === 'fatigued'"
              :disabled="fundsShort(marker) || game.busy"
              :aria-label="enterActionName(marker)"
              @click="enterMarker(marker)"
            >
              Enter
            </PrimaryPill>
            <span v-if="fundsShort(marker)" class="hint cal-card-broke">Not enough funds</span>
          </template>
        </div>
      </Card>
    </TakeoverShell>
  </template>
</template>

<style scoped>
/* =================================================================================================
   THE CALENDAR'S OWN STYLES
   =================================================================================================
   Same rule the redesign wave settled on: shared vocabulary lives in `src/style.css` or in
   `src/components/ui/`, and what ONE screen composes lives scoped in that screen's file. Every
   selector below has exactly one consumer, this page. What is deliberately NOT here, because it is
   already shared: `.pill` / `.controls` / `.hint` / `section h2` / `.avail-chip` / `.entry-fee` /
   `.caution-note` / `.coach-note` (the app's own vocabulary), the card and its photograph
   (ui/Card.vue), the surface mark, the CTA pill and the ring.
   ================================================================================================= */

/* --- the header: Season's own shape, so two calendar-ish screens open the same way --------------- */
.cal-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 14px;
}

.cal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.cal-dates {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

/* --- THE WEEK CARD -------------------------------------------------------------------------------
   ⚠ THE SEVEN-CELL DAY STRIP THAT USED TO LIVE HERE IS GONE, with its court tints, its marks, its
   per-kind dots and the one-line note that said why the hours were not drawn. The grid draws on
   every week now (owner, 31.07), so every one of those rules was a rule for an unreachable branch -
   and this file's own house rule is that a dead branch gets deleted rather than commented out.
   What SURVIVED the deletion and is still shared with the grid: `.cal-day-cross`, the 1px stroke,
   because the sweep draws it through the day NAME in the grid's head. */
.cal-week {
  margin: 0;
}

.cal-week-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

/* --- THE TIME x DAY GRID -------------------------------------------------------------------------
   The design's own screen H: seven columns, the hours down the left, and a coloured block for each
   thing she does. WHAT IS IN A BLOCK is composables/weekGrid.ts's business and none of this file's;
   what is here is the canvas it is drawn on.

   THE HOUR IS ONE NUMBER. `--cal-hour-h` sets the row height and everything else follows it - the
   body's height is twelve of them (07:00 to 19:00), the hairlines repeat every two, and the blocks
   are positioned in PERCENTAGES of the whole span, so the grid re-scales from one declaration and
   there is no second table of pixel offsets to keep in step. 30px is measured rather than picked: a
   two-hour block is then 60px, which holds the design's 8.5px label on two lines inside a 40px-wide
   column at 375pt, and the whole grid is 360px - about what the mockup gives it.

   ⚠ `--cal-hour-h` IS THIS COMPONENT'S OWN PROPERTY, not a design token, which is exactly what
   tests/design-tokens.test.ts rule B allows (Card.vue's `--tb-card-pad` is the same idiom): a
   mechanism, not shared vocabulary. */
.cal-time {
  --cal-hour-h: 30px;
}

.cal-time-head,
.cal-time-body {
  display: flex;
}

/* The gutter the hour labels live in. 32px is "07:00" at 9.5px plus air. */
.cal-time-gut {
  position: relative;
  flex: none;
  width: 32px;
}

.cal-time-days,
.cal-time-cols {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cal-time-head {
  border-bottom: var(--stroke-hair) solid var(--line);
}

.cal-time-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 0 7px;
  border-left: var(--stroke-hair) solid var(--line);
}

/* The day and its date, the design's own pair. The date is the real one (shared/dates.ts), so the
   heads and the span in the header above them cannot disagree about which Monday this is. */
.cal-time-day b {
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--ink-dim);
}

.cal-time-day i {
  font-style: normal;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
}

.cal-time-body {
  height: calc(12 * var(--cal-hour-h));
}

/* Each label sits ON its own rule rather than above it, which is what makes a block starting at
   15:00 line up with the words "15:00" instead of hanging under them. */
.cal-time-hour {
  position: absolute;
  left: 0;
  transform: translateY(-50%);
  font-family: var(--font-body);
  font-size: 9.5px;
  font-weight: 500;
  color: var(--ink-dim);
}

.cal-col {
  position: relative;
  border-left: var(--stroke-hair) solid var(--line);
  /* A rule every two hours – the prototype's own repeating gradient, expressed against the one
     hour height above so the rules cannot drift away from the labels. */
  background-image: repeating-linear-gradient(
    180deg,
    var(--line) 0 1px,
    transparent 1px calc(var(--cal-hour-h) * 2)
  );
}

/* The three days a week can PAUSE on wear the same soft wash the day strip gives them, and for the
   same reason: the hold has to land on a column the eye had already noticed. */
.cal-col--beat {
  background-color: var(--accent-wash);
}

.cal-block {
  position: absolute;
  left: 2px;
  right: 2px;
  overflow: hidden;
  padding: 3px 4px;
  border-radius: var(--radius-control);
  font-family: var(--font-body);
  font-size: 8.5px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
  word-break: break-word;
  /* ⚠ DARK INK, and it changed with the palette. The blocks used to be the `--event-*` family - mid-
     dark fills that wanted light text - and they are the `--cat-*` brights now (owner, 31.07: the
     calendar's colours were "sad and dreary" – his words, verbatim in docs/decisions.md). Lime, mint
     and amber under `--ink` would be light on
     light. This is the paper layer's ink, which is the darkest one the app declares. */
  color: var(--paper-ink);
}

/* THE PALETTE, one static rule per block kind, and it is the WALLET'S palette (see the `--cat-*`
   block in src/style.css for why the two screens share one). Written out rather than composed from
   the kind at runtime for the reason the surface tints above give: a `var(--cat-${kind})` built in a
   template is a token reference no scanner can resolve, and an unresolved custom property paints
   nothing at all with no error anywhere.
   ⚠ SIX OF THESE TWELVE CANNOT BE REACHED TODAY, and that is deliberate rather than dead code - the
   list is the design's palette, and weekGrid.ts's DAY_SHAPES says beside each one what it is waiting
   for (a later age band, or a kind of week the grid does not draw). Keeping the map complete here
   means adding a band is a change to the table alone. */
.cal-block--training {
  background: var(--cat-coaching);
}
.cal-block--trainingAlt {
  background: var(--cat-gear);
}
.cal-block--gym {
  background: var(--cat-physio);
}
.cal-block--school {
  background: var(--cat-school);
}
.cal-block--schoolLong {
  background: var(--cat-other);
}
.cal-block--drills {
  background: var(--cat-stringing);
}
.cal-block--match {
  background: var(--cat-practice);
}
.cal-block--matchLong {
  background: var(--cat-practice);
}
.cal-block--study {
  background: var(--cat-study);
}
.cal-block--travel {
  background: var(--cat-travel);
}
.cal-block--rest {
  background: var(--cat-rest);
}
/* The two the wallet had and the grid did not, until the four weeks the grid used to refuse arrived
   with hours in them: the physio blue of a layoff week, the warm pink of a family one. Same reading
   on both screens - what an hour costs there is what it is here. */
.cal-block--physio {
  background: var(--cat-physio);
}
.cal-block--vacation {
  background: var(--cat-vacation);
}

/* ⭐ ROUND 29 P14 – THE PRESS ROOM, on the wallet's `other` grey. It is the one block kind the
   design export never carried (there was no tournament week in the grid when it was drawn), so it
   borrows a declared token rather than inventing a fourteenth colour – the `--event-*` family is the
   record of what the owner sent and a new row in it would make that record lie. Grey is also the
   right reading: a press conference is neither her tennis nor her school, it is an hour the sport
   takes, and the wallet spells exactly that hour «other». */
.cal-block--press {
  background: var(--cat-other);
}

/* The tournament block is the one the design OUTLINES – its border is the thirteenth token, and the
   only place in the palette where a colour is a stroke rather than a fill. Its caller is the trip
   week's middle days (weekGrid.ts's TRIP_ARC), which is what it was always waiting for. */
.cal-block--tournament {
  background: var(--cat-entry);
  border: var(--stroke-hair) solid var(--cat-coaching);
  font-weight: 700;
}

/* --- (b) THE CROSSING-OUT SWEEP -----------------------------------------------------------------
   One 1px line per cell, drawn left to right by a transform. `scaleX` rather than an animated `width`
   on purpose: a transform is composited, so seven of them running in sequence cost no layout at all,
   and the same declaration reverses for free when the grid is put back.
   The DURATION comes from the composable through `--cal-stroke-ms` (see the note at `strokeMs`): the
   pace is a setting with two values and a stylesheet cannot read a setting. */
.cal-day-cross {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 1px;
  background: var(--ink-2);
  opacity: 0.85;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--cal-stroke-ms, 280ms) cubic-bezier(0.25, 0.8, 0.3, 1);
}

/* THE SWEEP OVER THE GRID. One stroke and one dimming: the line goes through the day's NAME
   (crossing a day off a calendar is a line through its head, not through 360px of column) and the
   column behind it steps back with its blocks. A struck-out day steps back rather than disappearing,
   which is the difference between "these days are gone" and "this grid is now blank". */
.cal-time-day--crossed .cal-day-cross {
  transform: scaleX(1);
}

.cal-col--crossed {
  opacity: 0.45;
  transition: opacity var(--cal-stroke-ms, 280ms) ease;
}

/* THE PAUSE, MADE VISIBLE. While the sweep waits on a match, an injury or a knock, that one column
   breathes – so the hold reads as the week stopping on something rather than as the animation
   stuttering. It also un-dims: the point of the pause is to be looked at. */
.cal-col--held {
  opacity: 1;
  animation: cal-held 900ms ease-in-out infinite;
}

@keyframes cal-held {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--accent-wash);
  }
  50% {
    box-shadow: 0 0 0 4px var(--accent-wash);
  }
}

/* ⚠ AND NONE OF IT RUNS UNDER `prefers-reduced-motion`. The composable already refuses to schedule the
   sweep (see `dayCrossRuns`), so this is the belt to that braces: it also kills the transitions, so a
   class left on a cell by a cancelled sweep cannot animate its way back out. An animation is precisely
   what this OS switch is about. */
@media (prefers-reduced-motion: reduce) {
  .cal-day-cross,
  .cal-col {
    transition: none;
  }
  .cal-col--held {
    animation: none;
  }
}

.cal-readout {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--ink-2);
}

.cal-court {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}

/* --- THE FRIDGE NOTE -----------------------------------------------------------------------------
   The design's own scrap: narrower than the column it sits under (264 of 390 in the prototype), so
   it reads as a piece of paper laid on the page rather than as another card in the stack, and tilted
   off one of the design's own angles.
   ⚠ THE INSET GOES THROUGH `:deep`, because PaperNote's root is a positioned WRAPPER - the tape has
   to live outside `torn`'s clip-path or a taped note loses the half of its strip that hangs over the
   top edge. What positions the scrap on the page is the wrapper's; what is written on the paper is
   the sheet's. See src/components/ui/PaperNote.vue and tests/paper-note.test.ts. */
.cal-note {
  margin: 14px 0 0 4px;
  max-width: 280px;
}

.cal-note :deep(.tb-paper) {
  padding: 14px 26px 18px 18px;
}

/* The label is the design's small printed word on ruled stock – NOT handwriting, so it takes the
   body face and the paper's second ink, exactly as screen D's "Next goal" label does. */
.cal-note-label {
  display: block;
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--paper-ink-soft);
}

.cal-note-text {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  line-height: 1.3;
}

/* --- THE LOOK-AHEAD ----------------------------------------------------------------------------- */
.cal-ahead-block {
  margin-top: 18px;
}

.cal-ahead {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

/* A row is one line at 375: the week label at a fixed 58px so seven of them form a column the eye can
   run down, then the band, then whatever chip the week has earned. */
.cal-marker,
.cal-band {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: var(--stroke-hair) solid var(--line);
  border-radius: var(--radius-chip);
  background: none;
  text-align: left;
}

.cal-ahead-week {
  flex: none;
  width: 58px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink-soft);
}

/* THE MARKER. An enterable tournament is the one row on this screen that is a door, so it is the one
   row with the accent on it - the app's "read this" colour, spent on the thing the owner called the
   most valuable item in the slice. */
.cal-marker {
  cursor: pointer;
  background: var(--accent-wash);
  border-color: var(--accent-soft);
  color: var(--ink);
}

.cal-marker:hover {
  background: var(--accent-fill);
  border-color: var(--accent);
}

.cal-marker-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cal-marker-name {
  min-width: 0;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-marker-go {
  flex: none;
  color: var(--accent);
}

.cal-band-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A booked week is a decision he has already made, so it reads a step brighter than an ordinary
   training week without becoming a control. */
.cal-band--vacation .cal-band-name,
.cal-band--practice .cal-band-name {
  color: var(--ink-2);
  font-weight: 600;
}

/* ⭐ ROUND 24 #5 – the departure week. A decision already made, so the booked-week idiom applies;
   it reads a step firmer still because it is the one row in the list the family cannot rebook. */
.cal-band--college .cal-band-name {
  color: var(--ink);
  font-weight: 700;
}

/* ⭐ AD STEP 2 (§4a) – a shoot week the signed letter named. A decision already made, so it reads at
   the booked-week level (the vacation/practice weight, not college's: the week is still hers). */
.cal-band--shoot .cal-band-name {
  color: var(--ink-2);
  font-weight: 600;
}

.cal-foot-note {
  margin-top: 10px;
}

/* --- (e) THE MAIN ACTION ------------------------------------------------------------------------
   Home's geometry, deliberately RE-STATED rather than shared, and for the reason the This-week
   screen's own footer already gives at length: the shell's floating strip is the ADVANCE bar, this
   file may not reuse its class and may not even name it, and a pinned guard reads every screen file
   for that string (tests/round13-nav.test.ts). Two controls that look alike and cost wildly different
   things must not answer to one name - and here they cost the same thing, which makes the discipline
   MORE important rather than less: the act still belongs to the shell.
   The SHAPE is properly shared - the pill is `PrimaryPill variant="cta"`, which IS the export's CTA
   (U0 #7) and the same object App.vue's button renders by hand - so the two cannot drift in
   appearance. `pointer-events` follows the same pattern: the strip is transparent so the calendar
   scrolls under it and only the pill takes a press. */
.cal-go {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 58px;
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  pointer-events: none;
  z-index: 39;
}

.cal-go-note {
  margin: 0;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--panel);
  border: var(--stroke-hair) solid var(--warning);
  font-size: 11.5px;
  color: var(--warning);
  text-align: center;
  pointer-events: auto;
}

/* The skip hint is not a warning, so it borrows the slot and none of the alarm. */
.cal-go-skip {
  border-color: var(--line);
  color: var(--ink-soft);
}

.cal-go-btn {
  pointer-events: auto;
  min-width: 206px;
  max-width: 100%;
}

/* ...and the page has to end above it. The shell reserves 96px under the content on every tab that is
   not Home, which is short of this pill's own footprint (58px of clearance plus its height), so the
   last look-ahead row sat under the button at 375. Paid only while the button is there. */
.cal.has-go {
  padding-bottom: 62px;
}

/* --- (d) THE ONE EVENT'S CARD ------------------------------------------------------------------- */
.cal-card {
  margin: 0;
}

/* The painted court, bleeding in from the right under the export's own dissolve. The FRAME is this
   screen's (a card that is a takeover's whole content is taller than a feed card, so the picture
   takes more of it), and the four declarations that make an image fill a frame it did not size are
   the SHARED rule in `src/style.css` – `.cal-card-art img` is the fifth selector on it, which is the
   note that rule now carries. */
.cal-card-art {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 68%;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 42%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 42%);
  pointer-events: none;
}

/* The vertical scrim, so a bright court never eats the type at either end. Same four-stop shape the
   Season card's uses, over the same page colour. */
.cal-card-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 17, 23, 0.55) 0%,
    rgba(11, 17, 23, 0.12) 34%,
    rgba(11, 17, 23, 0.55) 78%,
    rgba(11, 17, 23, 0.86) 100%
  );
}

/* The hairline between the surface mark and the week in the takeover's subtitle. Same 1px x 13px rule
   the Season screen draws in the same slot; see the note at the call site for why it is re-stated.
   ⚠ `display: inline-block` IS THE LOAD-BEARING DECLARATION, and measuring is the only way anyone
   finds that out. `.tf-sub` sets a top margin and nothing else - it is NOT a flex container - so a
   bare <span> in it stays INLINE, where `width` and `height` do not apply at all: the first cut
   measured 0px wide and 21px tall (its line box) and drew nothing, which looked exactly like the
   scoped-class mistake it had just replaced. Season's copy of this rule gets away without the
   declaration only because its OTHER call site sits inside a flex row, which blockifies it. */
.cal-card-sep {
  display: inline-block;
  width: 1px;
  height: 13px;
  margin: 0 8px;
  vertical-align: middle;
  background: rgba(255, 255, 255, 0.22);
  flex: none;
}

/* The dates and the court's verdict are ONE block – two facts about the same trip – so the gap
   between them is 2px and the gap to the money below is paid once, by the money. That way a neutral
   court (no verdict line at all) does not leave the dates hanging on the figure. */
.cal-card-days {
  position: relative;
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

.cal-card-fit {
  position: relative;
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.cal-card-money {
  position: relative;
  margin: 12px 0;
}

.cal-card-money-label {
  margin: 0;
  font-size: var(--label-size);
  letter-spacing: var(--label-track);
  text-transform: uppercase;
  color: var(--muted);
}

.cal-card-money-figure {
  margin: 2px 0 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.cal-card-money-sub {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--accent);
}

.cal-card-chips,
.cal-card-actions,
.cal-card-odds {
  position: relative;
}

.cal-card-odds {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.cal-card-odds-note {
  margin: 0;
  font-size: 12px;
  color: var(--ink-soft);
}

.cal-card-actions {
  margin-top: 14px;
}

.cal-card-when,
.cal-card-broke,
.cal-card-done {
  margin: 0;
}
</style>
