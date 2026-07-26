<script setup lang="ts">
// Package N – Season tab: the real yearly calendar (Package L/M). Next-8-weeks
// event cards with Enter/Withdraw behind ConfirmDialog, "My entries", a
// standings card, and – when the latest resolved week is a tournament week –
// a bracket card with a Watch -> MatchReplay link per kid match.
//
// Season planner (docs/specs/season-planner.md): OUTGROWN events disappear from the calendar
// (a UI filter – the engine keeps emitting them, so bench/history stay untouched), locked-ahead
// "Reach N pts" events stay visible, and every freed empty week becomes plannable via
// "+ Plan week" -> PlanWeekSheet (Practice / Vacation). A booked week renders with its package
// name and a Cancel. When she is worn out the screen OFFERS a rescue vacation – an offer, never
// an auto-book.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import ConfirmDialog from '../ConfirmDialog.vue'
import MatchReplay from '../MatchReplay.vue'
import MatchViewer from '../MatchViewer.vue'
import PlanWeekSheet from '../PlanWeekSheet.vue'
import TierGuide from '../TierGuide.vue'
import { simulateMatch } from '../../engine/match/engine'
import { annotateMatch } from '../../engine/match/rally'
import { kidMatchPlayer, isExamWeek, type PracticeCaution } from '../../engine/world'
import { isOffSeasonWeek } from '../../engine/season/calendar'
import { ECONOMY, vacationPackage, vacationPriceCents } from '../../engine/economy'
import { weekRange } from '../../shared/dates'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { AnnotatedMatch } from '../../viz/types'
import type { PracticeBooking, UpcomingEvent, VacationBooking, WorldEvent, WorldMatch } from '../../shared/protocol'

const game = useGameStore()
const base = import.meta.env.BASE_URL
// Round-7 item 18 / owner amendment: the this-week tournament row's watch control is now
// ICON-ONLY – the word "Watch" dropped, just the play.svg glyph, accent-yellow and sized like
// the bottom-tab icons (see .watch-play-icon / .watch-play-btn). Still a real button with an
// aria-label for accessibility. SeasonScreen only; the News "Watch" keeps its glyph per the owner.
const playIconStyle = {
  WebkitMaskImage: `url(${base}icons/play.svg)`,
  maskImage: `url(${base}icons/play.svg)`,
}

function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

const SURFACE_EMOJI: Record<string, string> = { hard: '🔵', clay: '🟠', grass: '🟢' }
const CALENDAR_HORIZON = 8 // mirrors world.ts's UPCOMING_WEEKS

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)
// CALENDAR DECLUTTER (spec §1): an OUTGROWN tournament is noise – she can never enter it again –
// so it leaves the calendar entirely and its week becomes plannable. Locked-ahead events
// ("Reach N pts") STAY: they are aspirational. Engine output is untouched.
const upcoming = computed(() => game.snapshot?.upcoming ?? [])
const visibleUpcoming = computed(() => upcoming.value.filter((e) => e.ineligibleReason !== 'outgrown'))
const myEntries = computed(() => upcoming.value.filter((e) => e.entered))
const vacations = computed<VacationBooking[]>(() => game.snapshot?.vacations ?? [])
const practices = computed<PracticeBooking[]>(() => game.snapshot?.practices ?? [])

// --- Round 5 item 7: tour guide overlay ---------------------------------------
const showTierGuide = ref(false)

// --- Round 5 items 1/3/16/21: every week in the horizon, not just eventful ones –
// training weeks and off-season weeks show as muted rows so tournaments sit visibly
// among ordinary weeks, each carrying its real calendar date range.
// Season planner: the muted rows now carry their PLAN – a booked vacation/practice, or the
// "+ Plan week" invitation on a genuinely empty week. Exam weeks say so instead of pretending
// to be ordinary training weeks (nothing is bookable there).
interface CalendarRow {
  week: number
  dates: string
  kind: 'event' | 'training' | 'off-season' | 'exam' | 'vacation' | 'practice'
  event?: UpcomingEvent
  vacation?: VacationBooking
  practice?: PracticeBooking
  /** an empty future week the parent may plan (vacation always, practice outside the off-season) */
  plannable: boolean
}
const calendarRows = computed<CalendarRow[]>(() => {
  const byWeek = new Map<number, UpcomingEvent>()
  for (const e of visibleUpcoming.value) byWeek.set(e.week, e)
  const rows: CalendarRow[] = []
  for (let w = week.value + 1; w <= week.value + CALENDAR_HORIZON; w++) {
    const e = byWeek.get(w)
    const vacation = vacations.value.find((v) => v.week === w)
    const practice = practices.value.find((p) => p.week === w)
    const exam = isExamWeek(w)
    const offSeason = isOffSeasonWeek(w)
    const kind: CalendarRow['kind'] = vacation
      ? 'vacation'
      : practice
        ? 'practice'
        : e
          ? 'event'
          : exam
            ? 'exam'
            : offSeason
              ? 'off-season'
              : 'training'
    rows.push({
      week: w,
      dates: weekRange(w),
      kind,
      event: e,
      vacation,
      practice,
      // "Empty" means empty FOR HER: a week whose only tournament is one she can NOT enter – a
      // locked-ahead "Reach N pts" card (the spec keeps those visible on purpose) or one whose
      // entry list has already closed – is still hers to plan. Otherwise the aspirational cards
      // sterilise most of the calendar and the planner has nowhere to go. An ENTERED week is
      // committed, an enterable one is a real decision she should make first, exam weeks belong
      // to school, and an already-planned week is done.
      plannable:
        !vacation &&
        !practice &&
        !exam &&
        (!e || (!e.entered && (!e.eligible || week.value > e.deadlineWeek))),
    })
  }
  return rows
})

function packageLabel(packageId: string): string {
  return vacationPackage(packageId)?.label ?? packageId
}

// A passed deadline swaps the Enter button for a muted "Entries closed" pill (round-5
// item 2); an open event only ever disables Enter for insufficient funds.
function entriesClosed(e: UpcomingEvent): boolean {
  return week.value > e.deadlineWeek
}
function fundsShort(e: UpcomingEvent): boolean {
  return fundsCents.value < e.entryFeeCents
}
// The HARD-lock label (Season-Life slice B): point-band (locked) or a hard availability
// block (injured / school exams / a booked family vacation). Fatigue is NOT here – it stays
// enterable with a soft caution. OUTGROWN never reaches this label any more: those events are
// filtered off the calendar (spec §1), so the case stays only as a defensive fallback.
// The injured detail names the return week (slice C) so the parent can plan around the layoff.
function lockLabel(e: UpcomingEvent): string {
  switch (e.ineligibleReason) {
    case 'outgrown':
      return 'Outgrown'
    case 'injured': {
      const s = game.snapshot
      return s?.injury ? `Injured – back wk ${s.week + s.injury.weeksRemaining}` : 'Injured – rest up'
    }
    case 'unavailable': {
      const vacation = vacations.value.find((v) => v.week === e.week)
      return vacation ? `Family vacation – ${packageLabel(vacation.packageId)}` : 'School exams this week'
    }
    default:
      return `Reach ${e.pointsToEnter} pts`
  }
}

// --- one shared confirm-popup slot (mirrors MoreScreen's pattern) ------------
interface PendingConfirm {
  message: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
}
const pendingConfirm = ref<PendingConfirm | null>(null)

function askEnter(e: UpcomingEvent): void {
  // Fatigue is a warned CHOICE: spell out the risk in the confirm, but keep the action available.
  const fatigued = e.cautionReason === 'fatigued'
  pendingConfirm.value = {
    message: fatigued
      ? `${e.cautionDetail ?? 'Exhausted – racing risks injury.'} Enter ${e.label} (W${e.week}, ${e.surface}) anyway? ` +
        `Entry fee ${formatDollars(e.entryFeeCents)}.`
      : `Enter ${e.label} (W${e.week}, ${e.surface})? Entry fee ${formatDollars(e.entryFeeCents)}.`,
    confirmLabel: fatigued ? 'Push through' : 'Enter',
    onConfirm: () => game.enterEvent(e.id),
  }
}
function askWithdraw(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message: `Withdraw from ${e.label} (W${e.week})? Entry fee ${formatDollars(e.entryFeeCents)} will be refunded.`,
    confirmLabel: 'Withdraw',
    onConfirm: () => game.withdrawEvent(e.id),
  }
}
function runConfirm(): void {
  const action = pendingConfirm.value
  pendingConfirm.value = null
  action?.onConfirm()
}

// --- the planner sheet ("+ Plan week") ---------------------------------------------------
interface SheetState {
  week: number
  tab: 'practice' | 'vacation'
  highlightPackageId?: string
}
const planSheet = ref<SheetState | null>(null)

function openPlanner(row: CalendarRow): void {
  // The off-season row opens on Vacation – the family week is its natural use (spec §4b).
  planSheet.value = { week: row.week, tab: row.kind === 'off-season' ? 'vacation' : 'practice' }
}

/** The sheet emitted a practice choice: confirm it (with the guardrail warning in the copy –
 *  the owner's «Она уже вымотана – ещё матч?» lands HERE, where the parent can still say yes). */
function confirmPractice(p: { week: number; withCoach: boolean; feeCents: number; caution: PracticeCaution }): void {
  const what = p.withCoach ? 'Practice match with the coach' : 'Practice match'
  pendingConfirm.value = {
    message:
      (p.caution.level === 'caution' ? `${p.caution.detail} ` : '') +
      `${what} in W${p.week} – ${formatDollars(p.feeCents)}. No ranking points.`,
    confirmLabel: p.caution.level === 'caution' ? 'Push through' : 'Book it',
    onConfirm: () => game.bookPractice(p.week, p.withCoach),
  }
  planSheet.value = null
}

function confirmVacation(v: { week: number; packageId: string; label: string; priceCents: number; gain: number }): void {
  pendingConfirm.value = {
    message:
      `${v.label} in W${v.week} – ${v.priceCents === 0 ? 'free' : formatDollars(v.priceCents)}, ` +
      `+${v.gain} condition. No tournaments that week.`,
    confirmLabel: 'Book it',
    onConfirm: () => game.bookVacation(v.week, v.packageId),
  }
  planSheet.value = null
}

function askCancelVacation(row: CalendarRow): void {
  const booking = row.vacation!
  pendingConfirm.value = {
    message: `Cancel ${packageLabel(booking.packageId)} in W${row.week}? ${
      booking.paidCents > 0 ? `${formatDollars(booking.paidCents)} comes back in full.` : 'Nothing was paid for it.'
    }`,
    confirmLabel: 'Cancel the trip',
    onConfirm: () => game.cancelVacation(row.week),
  }
}
function askCancelPractice(row: CalendarRow): void {
  const booking = row.practice!
  pendingConfirm.value = {
    message: `Cancel the practice match in W${row.week}? ${formatDollars(booking.paidCents)} comes back in full.`,
    confirmLabel: 'Cancel the match',
    onConfirm: () => game.cancelPractice(row.week),
  }
}

// --- the RESCUE prompt (spec §4b) -------------------------------------------------------
// The bench exposed the trap: a reactive "book when condition < 60" rule never fires for the
// load-manager, while the overloaded player has no booking habit at all – 5 of 6 packages never
// sell. So the game SURFACES the lever to whoever is low: below rescueCondition, with a bookable
// empty week ahead, it OFFERS a vacation, pre-filtered to the packages that bring her back above
// rescueTargetCondition. An offer – never an auto-book. Dismissible per session.
const rescueDismissed = ref(false)
const rescueWeek = computed<number | null>(() => calendarRows.value.find((r) => r.plannable)?.week ?? null)
/** The cheapest package that would return her above the target (the rescue pre-highlight). */
const rescuePackageId = computed<string | null>(() => {
  const w = rescueWeek.value
  const snap = game.snapshot
  if (w === null || !snap) return null
  const affordable = ECONOMY.vacation.packages.filter(
    (p) => snap.fundsCents >= vacationPriceCents(snap.seed, w, p.id, snap.profile.background),
  )
  if (affordable.length === 0) return null
  const clearing = affordable.find((p) => condition.value + p.conditionGain > ECONOMY.practice.rescueTargetCondition)
  return (clearing ?? affordable[affordable.length - 1]).id
})
const showRescue = computed(
  () =>
    !!game.snapshot &&
    !game.snapshot.injury &&
    !rescueDismissed.value &&
    condition.value < ECONOMY.practice.rescueCondition &&
    rescueWeek.value !== null,
)
function openRescue(): void {
  if (rescueWeek.value === null) return
  planSheet.value = {
    week: rescueWeek.value,
    tab: 'vacation',
    highlightPackageId: rescuePackageId.value ?? undefined,
  }
}

// --- kidRank: only needed here now for the Friendly-match viewer's rank-a prop – the
// full standings table moved to the Stats tab (round-6). ---------------------------
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)

// --- this week's tournament: only kid matches are ever recorded as `match`
// events, so the list below IS the kid's path – nothing else to highlight
// against. Rank-movement arrows would need last week's rank, which the
// Snapshot doesn't carry, so they're left out (see report: spec conflict). ---
// A PRACTICE friendly is also a `match` event, so it is filtered out here and gets its own
// card below – it is not part of any tournament and awards no points.
const thisWeekMatches = computed<WorldEvent[]>(
  () => game.snapshot?.events.filter((e) => e.type === 'match' && !e.friendly && e.week === week.value) ?? [],
)
const thisWeekSummary = computed<WorldEvent | null>(
  () => game.snapshot?.events.find((e) => e.type === 'tournament' && e.week === week.value) ?? null,
)
const thisWeekFriendly = computed<WorldEvent | null>(
  () => game.snapshot?.events.find((e) => e.type === 'match' && e.friendly && e.week === week.value) ?? null,
)

// --- replay overlay --------------------------------------------------------------
const replayMatch = ref<WorldMatch | null>(null)
function watchMatch(e: WorldEvent): void {
  if (e.match) replayMatch.value = e.match
}

// --- Friendly match (Package J, restored per architect ruling: owner-approved –
// sparring now, a training tool in Phase 4). Player A is the kid's ACTUAL current
// build, reconstructed the same deterministic way the worker does (kidMatchPlayer,
// exported from engine/world.ts); the opponent stays the fixed "Top seed" block.
// This is the sandbox hit-out; a BOOKED practice match (above) is the real, costed one. --
const exhibitionSurface: Surface = 'clay'
const kidName = computed(() => game.snapshot?.profile.kidName ?? 'Vera')
const exhibitionPlayerA = computed<MatchPlayer>(() =>
  game.snapshot
    ? kidMatchPlayer(game.snapshot)
    : { id: 'kid', name: kidName.value, serve: 50, ret: 50, composure: 50, stamina: 50 },
)
const exhibitionPlayerB: MatchPlayer = { id: 'top-seed', name: 'Top seed', serve: 63, ret: 60, composure: 70, stamina: 65 }
const exhibitionSeed = ref('')
const exhibitionMatch = ref<AnnotatedMatch | null>(null)

function playExhibition(): void {
  const seed = exhibitionSeed.value.trim() || `exhibition-${Date.now().toString(36)}`
  const opts: MatchOptions = { surface: exhibitionSurface, tour: 'wta', seed }
  const result = simulateMatch(exhibitionPlayerA.value, exhibitionPlayerB, opts)
  exhibitionMatch.value = annotateMatch(result, exhibitionPlayerA.value, exhibitionPlayerB, opts)
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <!-- Round-6: the Calendar/Standings segmented control is gone – standings moved to
         the new Stats tab, so Season is calendar-only now. The "?" tour-guide button stays. -->
    <div class="season-topbar">
      <h2 style="margin: 0">Season</h2>
      <button class="tier-guide-btn" aria-label="Tour guide" title="Tour guide" @click="showTierGuide = true">?</button>
    </div>

    <!-- Rescue prompt (spec §4b): an OFFER when she is worn out, never an auto-book. -->
    <div v-if="showRescue" class="rescue-card">
      <p class="rescue-title">She is worn out – maybe a family week?</p>
      <p class="hint" style="margin: 0">
        Condition {{ condition }}/100. A week away in W{{ rescueWeek }} would bring her back
        fresher – nothing is booked until you say so.
      </p>
      <div class="controls" style="margin-top: 10px">
        <button class="primary" @click="openRescue">See the options</button>
        <button @click="rescueDismissed = true">Not now</button>
      </div>
    </div>

    <section v-if="thisWeekMatches.length">
      <h2>This week's tournament</h2>
      <p v-if="thisWeekSummary" class="tournament-summary">{{ thisWeekSummary.text }}</p>
      <ol class="bracket-list">
        <li v-for="m in thisWeekMatches" :key="m.id" class="bracket-row">
          <span>{{ m.text }}</span>
          <button v-if="m.match" class="watch-play-btn sfx-watch" aria-label="Watch match" @click="watchMatch(m)">
            <span class="watch-play-icon" :style="playIconStyle"></span>
          </button>
        </li>
      </ol>
    </section>

    <!-- A booked practice match that has just been played: watchable, zero ranking points. -->
    <section v-if="thisWeekFriendly">
      <h2>This week's practice match</h2>
      <ol class="bracket-list">
        <li class="bracket-row">
          <span>{{ thisWeekFriendly.text }}</span>
          <button
            v-if="thisWeekFriendly.match"
            class="watch-play-btn sfx-watch"
            aria-label="Watch practice match"
            @click="watchMatch(thisWeekFriendly)"
          >
            <span class="watch-play-icon" :style="playIconStyle"></span>
          </button>
        </li>
      </ol>
    </section>

    <section v-if="myEntries.length">
      <h2>My entries</h2>
      <div class="entries-strip">
        <span v-for="e in myEntries" :key="e.id" class="pill ok">{{ e.label }} · W{{ e.week }}</span>
      </div>
    </section>

    <section>
      <h2>Calendar</h2>
      <div class="event-cards">
        <template v-for="row in calendarRows" :key="row.week">
          <div v-if="row.kind === 'event' && row.event" class="event-card">
            <div class="event-card-top">
              <span class="event-tier">{{ row.event.label }}</span>
              <span class="pill">{{ SURFACE_EMOJI[row.event.surface] }} {{ row.event.surface }}</span>
            </div>
            <p class="hint" style="margin-top: 8px">
              W{{ row.event.week }} · {{ row.dates }} · entry {{ formatDollars(row.event.entryFeeCents) }} · travel ~{{
                formatDollars(row.event.travelCostCents)
              }}
            </p>
            <div class="controls" style="margin-top: 8px">
              <!-- Round-7 item 21: past tense once the window has shut. -->
              <span class="pill" :class="{ negative: week > row.event.deadlineWeek && !row.event.entered }">
                {{ week > row.event.deadlineWeek ? 'Closed' : 'closes' }} W{{ row.event.deadlineWeek }}
              </span>
              <span v-if="row.event.entered" class="pill ok">Entered</span>
            </div>
            <div class="controls" style="margin-top: 12px">
              <button
                v-if="row.event.entered"
                :disabled="week > row.event.deadlineWeek || game.busy"
                @click="askWithdraw(row.event)"
              >
                Withdraw
              </button>
              <!-- Round-8 6b: `lock` brightens the label to soft amber (pill stays disabled). -->
              <span v-else-if="entriesClosed(row.event)" class="pill muted lock">
                Entries closed W{{ row.event.deadlineWeek }}
              </span>
              <!-- HARD locks: ranking gate ('locked') OR a hard availability block (injured /
                   school exams / a booked family vacation). Fatigue is NOT here – it stays
                   enterable (see below). -->
              <span v-else-if="!row.event.eligible" class="pill muted lock">
                🔒 {{ lockLabel(row.event) }}
              </span>
              <template v-else>
                <!-- Fatigued is a soft, warned CHOICE: the Enter stays ACTIVE and amber, with a
                     "race anyway?" warning – never greyed out. -->
                <button
                  class="primary"
                  :class="{ risky: row.event.cautionReason === 'fatigued' }"
                  :disabled="fundsShort(row.event) || game.busy"
                  @click="askEnter(row.event)"
                >
                  Enter
                </button>
                <span v-if="fundsShort(row.event)" class="hint" style="margin: 0">Not enough funds</span>
                <p v-else-if="row.event.cautionReason === 'fatigued'" class="caution-note">
                  Exhausted – race anyway? Rest would be wiser.
                </p>
              </template>
              <!-- She cannot enter this one (locked ahead, or the list has closed), so the week is
                   still hers to plan: a friendly or a family week. The aspirational card stays –
                   the week just stops being dead. -->
              <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
            </div>
          </div>

          <!-- A PLANNED week: the booking reads back with its package/match name + a Cancel. When
               the week also carried a (locked) tournament, the row NAMES it, so a planned week
               never makes a calendar entry vanish without explanation – cancel and it is back. -->
          <div v-else-if="row.kind === 'vacation' && row.vacation" class="calendar-row-muted planned">
            <span class="hint" style="margin: 0">
              W{{ row.week }} · {{ row.dates }} · 🏖 {{ packageLabel(row.vacation.packageId) }}
              <template v-if="row.event"> · skipping {{ row.event.label }}</template>
            </span>
            <button :disabled="game.busy" @click="askCancelVacation(row)">Cancel</button>
          </div>
          <div v-else-if="row.kind === 'practice' && row.practice" class="calendar-row-muted planned">
            <span class="hint" style="margin: 0">
              W{{ row.week }} · {{ row.dates }} · 🎾 Practice match{{ row.practice.withCoach ? ' + coach' : '' }}
              <template v-if="row.event"> · instead of {{ row.event.label }}</template>
            </span>
            <button :disabled="game.busy" @click="askCancelPractice(row)">Cancel</button>
          </div>

          <!-- An empty week: plannable (or an exam block, which is nobody's to plan). -->
          <div
            v-else
            class="calendar-row-muted"
            :class="{ 'off-season': row.kind === 'off-season', exam: row.kind === 'exam' }"
          >
            <span class="hint" style="margin: 0">
              W{{ row.week }} · {{ row.dates }} ·
              {{
                row.kind === 'off-season'
                  ? 'Off-season – the natural family week'
                  : row.kind === 'exam'
                    ? 'School exams'
                    : 'Training week'
              }}
            </span>
            <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
          </div>
        </template>
      </div>
      <p class="hint">
        Weeks can carry more than one event now – she can only play one, so the pick is yours.
      </p>
    </section>

    <section>
      <h2>Friendly match</h2>
      <div class="controls">
        <input v-model="exhibitionSeed" type="text" placeholder="seed (optional)" />
        <button class="primary" @click="playExhibition">Play match</button>
        <span class="pill">{{ kidName }} vs Top seed · Clay</span>
      </div>
      <MatchViewer
        v-if="exhibitionMatch"
        :match="exhibitionMatch"
        :player-a="exhibitionPlayerA"
        :player-b="exhibitionPlayerB"
        :surface="exhibitionSurface"
        :rank-a="kidRank"
        :rank-b="null"
        mode="live"
      />
    </section>

    <PlanWeekSheet
      v-if="planSheet"
      :week="planSheet.week"
      :initial-tab="planSheet.tab"
      :highlight-package-id="planSheet.highlightPackageId"
      @book-practice="confirmPractice"
      @book-vacation="confirmVacation"
      @close="planSheet = null"
    />
    <ConfirmDialog
      v-if="pendingConfirm"
      :message="pendingConfirm.message"
      :confirm-label="pendingConfirm.confirmLabel"
      @confirm="runConfirm"
      @cancel="pendingConfirm = null"
    />
    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <TierGuide v-if="showTierGuide" @close="showTierGuide = false" />
  </template>
</template>
