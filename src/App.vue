<script setup lang="ts">
// Package I – app shell: slim header + 5-tab bottom bar, or the full-screen
// onboarding wizard when there is no active career. No router – a plain ref
// switch, per spec.
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore } from './stores/game'
import { needRefresh, applyUpdate } from './pwa'
import { weekRange } from './shared/dates'
import { useKidEmotion } from './composables/kidEmotion'
// R10-7: the sticky bar's primary button says what the week AHEAD holds (tournament / vacation /
// practice / exams / off-season / training). All of the derivation lives in the composable – this
// file only renders the label it hands back.
import { useWeekAhead } from './composables/weekAhead'
import { playSfx } from './audio/sfx'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingWizard from './components/OnboardingWizard.vue'
import OnboardingTour from './components/OnboardingTour.vue'
import TournamentFlow from './components/TournamentFlow.vue'
import SeasonSummaryDialog from './components/SeasonSummaryDialog.vue'
import InjuryStopDialog from './components/InjuryStopDialog.vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import SeasonScreen from './components/screens/SeasonScreen.vue'
import KidScreen from './components/screens/KidScreen.vue'
import StatsScreen from './components/screens/StatsScreen.vue'
import MoneyScreen from './components/screens/MoneyScreen.vue'
import MoreScreen from './components/screens/MoreScreen.vue'

// Round 5 item 23: a small accent dot on the Season tab until the player has visited it
// since the last "New events on the calendar" marker. UI-only state (localStorage), no
// engine change – the marker text itself is emitted from world.ts's ensureSeason.
const SEASON_SEEN_KEY = 'tb:lastSeenSeasonWeek'
// Round 5 item 10: the coach-mark tour is shown once, ever, per device.
const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'

const game = useGameStore()

// R9-13/15/16: the header avatar comes from the SHARED useKidEmotion composable (R8-6a/6b
// freshness rules + R9-11 win-immunity + the R9-16 stage-by-age resolver), so the header
// crop, the Home player card and the Kid screen portrait can never disagree. Face crops live
// in public/avatars/{stage}-{emotion}.webp (256×256; jun per round5-brand, young/teen cut in
// round-9 pt5 to the same framing). START_AGE 14 ⇒ the game opens on young-* art.
const { cropUrl: avatarUrl } = useKidEmotion()
const weekAhead = useWeekAhead()

onMounted(() => game.init())

// Round-6 item 2: the splash screen shows on EVERY launch, once init() has settled
// (game.ready) – before either the onboarding wizard or the tab shell. Plain per-mount
// ref, not persisted: "every launch" means every page load, not "once ever".
const splashDone = ref(false)

// 'money' stays a valid CONTENT state (MoneyScreen unchanged, reached via the header
// W/$ pill) but round-6 dropped its bottom-tab button in favor of Stats – see TABS below.
type TabId = 'home' | 'play' | 'kid' | 'stats' | 'money' | 'more'
const tab = ref<TabId>('home')

// Package J: the 'play' tab id stays (per spec – no router, minimal diff) but
// is now the Season tab (calendar placeholder + the old exhibition block).
// Round-6: emoji tab glyphs replaced by the owner's SVG icon set (public/icons/*.svg,
// tinted via CSS mask so they follow the button's text color exactly – see `.tab-icon`
// in style.css and `iconUrl()` below). 'money' has no entry here on purpose (see TabId).
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'play', icon: 'season', label: 'Season' },
  { id: 'kid', icon: 'kid-girl', label: 'Kid' },
  { id: 'stats', icon: 'stats', label: 'Stats' },
  { id: 'more', icon: 'more', label: 'More' },
]
function iconUrl(icon: string): string {
  return `${import.meta.env.BASE_URL}icons/${icon}.svg`
}
// R9-16 (owner icon pair): the KID tab glyph grows up with her – kid-girl.svg while she is a
// junior, woman.svg from age 18 (man.svg stays reserved for the future boys' tour, like
// kid-boy.svg). Same CSS-mask tinting path as every other tab icon.
const kidTabIcon = computed(() => ((game.snapshot?.ageYears ?? 14) >= 18 ? 'woman' : 'kid-girl'))
function tabIcon(t: { id: TabId; icon: string }): string {
  return t.id === 'kid' ? kidTabIcon.value : t.icon
}

// No active snapshot once init() has settled means: no auto-loaded slot and no
// in-progress career (fresh install, or a client-side reset from More).
const showOnboarding = computed(() => game.ready && !game.snapshot)

// A career appearing after onboarding must land on Home, not whatever tab was
// active before the reset (e.g. More, where "New career" lives).
watch(
  () => game.snapshot,
  (now, before) => {
    if (now && !before) {
      tab.value = 'home'
      // Consume the one-shot "first ever career" signal exactly once, regardless of
      // whether the tour actually launches (already seen on this device -> skip it).
      if (game.firstEverCareer) {
        game.$patch({ firstEverCareer: false })
        if (!localStorage.getItem(TOUR_SEEN_KEY)) showTour.value = true
      }
    }
  },
)

function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
const week = computed(() => game.snapshot?.week ?? 0)
const weekDates = computed(() => weekRange(week.value))
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatFunds(fundsCents.value))

// --- Season tab "new events" accent dot (item 23) ---------------------------
// `lastSeenSeasonWeek` is mirrored into a reactive ref: a plain localStorage.getItem()
// inside a computed isn't a tracked dependency, so the dot wouldn't clear until some
// UNRELATED reactive change (e.g. the next tick) happened to force a re-evaluation.
const lastSeenSeasonWeek = ref(Number(localStorage.getItem(SEASON_SEEN_KEY) ?? '-1'))
const seasonHasNew = computed(() => {
  const events = game.snapshot?.events ?? []
  let latest = -1
  for (const e of events) {
    if (e.type === 'info' && e.text === 'New events on the calendar' && e.week > latest) latest = e.week
  }
  return latest >= 0 && latest > lastSeenSeasonWeek.value
})
watch(tab, (t) => {
  if (t === 'play') {
    lastSeenSeasonWeek.value = week.value
    localStorage.setItem(SEASON_SEEN_KEY, String(week.value))
  }
})

// --- R9-21b: news cue – a soft "тилинь" + a Season-style accent dot on the Home tab -----
// News = the non-financial events HomeScreen's feed shows (expense/income live on Money).
// "Last looked at the feed" ≈ the Home tab being active: seen is marked when Home becomes
// active and whenever a snapshot lands while it is. The cue fires on any genuinely NEW news
// event (id above the last-seen watermark), whatever tab is up – the owner's complaint was
// missing news entirely while week-skipping. Watermark persisted per career (event ids are
// per-career counters, so a global key would collide across careers).
const newsSeenKey = () => `tb:lastSeenNewsId:${game.snapshot?.careerId ?? ''}`
const lastSeenNewsId = ref(Number(localStorage.getItem(newsSeenKey()) ?? '-1'))
const latestNewsId = computed(() => {
  const events = game.snapshot?.events ?? []
  let latest = -1
  for (const e of events) {
    if (e.type !== 'expense' && e.type !== 'income' && e.id > latest) latest = e.id
  }
  return latest
})
const homeHasNews = computed(() => tab.value !== 'home' && latestNewsId.value > lastSeenNewsId.value)
function markNewsSeen(): void {
  if (latestNewsId.value > lastSeenNewsId.value) {
    lastSeenNewsId.value = latestNewsId.value
    localStorage.setItem(newsSeenKey(), String(latestNewsId.value))
  }
}
watch(
  () => game.snapshot?.careerId,
  () => {
    // switching careers re-reads that career's own watermark (never dings on a plain load)
    lastSeenNewsId.value = Number(localStorage.getItem(newsSeenKey()) ?? '-1')
    if (lastSeenNewsId.value < 0) markNewsSeen()
  },
)
watch(tab, (t) => {
  if (t === 'home') markNewsSeen()
})
watch(latestNewsId, (now, before) => {
  if (before !== undefined && before >= 0 && now > before) playSfx('clickSoft') // тилинь
  if (tab.value === 'home') markNewsSeen()
})

// --- coach-mark onboarding tour (item 10) ------------------------------------
const showTour = ref(false)
function dismissTour(): void {
  showTour.value = false
  localStorage.setItem(TOUR_SEEN_KEY, '1')
}

// Package K2: a corrupted-generation recovery is rare and stays a one-time hint –
// dismissing it just patches the flag back to false (same pattern MoreScreen uses
// for the client-side "New career" reset, no store change needed).
function dismissRecovered(): void {
  game.$patch({ recovered: false })
}

// Package N: `stopReason` lives ON the snapshot (only `advance` ever sets it –
// `tick`/enterEvent/etc. never do), not as an independent store flag, so a local
// dismiss flag is reset whenever a fresh snapshot arrives (any action) and set
// when the user dismisses the toast by hand.
const stopToastDismissed = ref(false)
// Round-7 item 4: the season-end stop is owned by SeasonSummaryDialog, not the toast. A fresh
// snapshot resets both dismiss flags (any action re-arms them).
const seasonSummaryDismissed = ref(false)
// R9-21a: the injury stop is owned by the blocking InjuryStopDialog (the quiet toast buried
// it – the owner only noticed the withdrawal three weeks later). Same dismiss lifecycle.
const injuryStopDismissed = ref(false)
watch(
  () => game.snapshot,
  () => {
    stopToastDismissed.value = false
    seasonSummaryDismissed.value = false
    injuryStopDismissed.value = false
  },
)

// R9-9a: the TournamentFlow splash's "← Back" hides the overlay WITHOUT resolving anything –
// the week stays paused on the engine side. A persistent banner offers Resume; any change of
// the pending run (skipped, closed, a different event) re-arms the overlay.
const tournamentHidden = ref(false)
watch(
  () => game.snapshot?.pending?.eventId,
  () => {
    tournamentHidden.value = false
  },
)
// The tournament stop is owned by the full-screen TournamentFlow overlay, the season-end stop by
// SeasonSummaryDialog and the injury stop by InjuryStopDialog (all three show off the snapshot);
// deadline/funds/medical stops keep the toast.
//
// R10-16 (owner playtest 26.07 – "an EMPTY popup appeared on Home, no text at all, just a Dismiss
// button"). THE BUG: this condition excluded the stop reasons that own a dialog BY NAME, and when
// R9-21a moved 'injury' onto its own blocking dialog it was removed from STOP_REASON_TEXT but never
// added to that exclusion list. So a fresh injury satisfied the toast's condition with no copy to
// put in it, and the toast rendered as an empty bar with a lone Dismiss.
//
// THE FIX is to stop maintaining a second list at all: the toast shows iff there is something to
// say. Any future StopReason that gets its own dialog (or simply lacks copy) can no longer produce
// an empty popup – the copy map is the single source of truth for what the toast is for.
//
// 'injury' / 'tournament' / 'season-end' are absent from STOP_REASON_TEXT precisely BECAUSE they own
// a dialog, so they now fall out of the toast for free instead of needing to be listed twice.
const STOP_REASON_TEXT: Record<string, string> = {
  deadline: 'Stopped: an entry deadline is coming up next week.',
  funds: 'Stopped: funds ran below zero.',
  // A withdrawal costs her an entry AND its fee, so it must never slide past during a multi-week
  // advance – the same trap the owner hit with a silent injury withdrawal.
  medical: 'Stopped: she was not cleared to play – withdrawn on medical advice.',
}
const stopReasonText = computed(() => STOP_REASON_TEXT[game.snapshot?.stopReason ?? ''] ?? '')
const showStopToast = computed(() => !!stopReasonText.value && !stopToastDismissed.value)
function dismissStopToast(): void {
  stopToastDismissed.value = true
}
// The end-of-season summary popup: auto-shows on Home when `advance` reports 'season-end' and a
// summary is present, until the player hits Continue (client-side flag).
const showSeasonSummary = computed(
  () =>
    tab.value === 'home' &&
    game.snapshot?.stopReason === 'season-end' &&
    !!game.snapshot?.lastSeasonSummary &&
    !seasonSummaryDismissed.value,
)
function dismissSeasonSummary(): void {
  seasonSummaryDismissed.value = true
}
// R9-21a: the injury stop popup – blocking, on Home (advance only ever runs from Home's bar),
// until Continue. The dialog itself plays the alert sfx on mount.
const showInjuryStop = computed(
  () =>
    tab.value === 'home' &&
    game.snapshot?.stopReason === 'injury' &&
    !!game.snapshot?.injury &&
    !injuryStopDismissed.value,
)
</script>

<template>
  <!-- PWA update prompt (registerType 'prompt'): fixed above everything, all app states. -->
  <div v-if="needRefresh" class="update-banner">
    <span>New version available</span>
    <button class="primary" @click="applyUpdate">Update</button>
  </div>

  <div v-if="!game.ready" class="app-loading">Loading…</div>

  <SplashScreen v-else-if="!splashDone" @done="splashDone = true" />

  <OnboardingWizard v-else-if="showOnboarding" />

  <template v-else>
    <header class="app-header" data-tour="home-header">
      <img class="avatar" :src="avatarUrl" alt="" />
      <span class="kid-name">{{ kidName }}</span>
      <button
        class="pill status-pill"
        :class="{ negative: fundsCents < 0 }"
        :title="weekDates"
        @click="tab = 'money'"
      >
        W{{ week }} · {{ funds }}
      </button>
    </header>

    <div v-if="game.recovered" class="recovered-banner">
      <span>Autosave was damaged – restored the previous one.</span>
      <button @click="dismissRecovered">Dismiss</button>
    </div>

    <div v-if="tab === 'home' && showStopToast" class="stop-toast">
      <span>{{ stopReasonText }}</span>
      <button @click="dismissStopToast">Dismiss</button>
    </div>

    <!-- R9-9a: the week is paused on a hidden tournament – a persistent Resume affordance on
         every tab, so backing out of the splash can never strand the career. -->
    <div v-if="game.snapshot?.pending && tournamentHidden" class="stop-toast tournament-paused">
      <span>Tournament week: {{ game.snapshot.pending.tierLabel }} – the week is paused.</span>
      <button class="primary" @click="tournamentHidden = false">Resume</button>
    </div>

    <main class="app-content" :class="{ 'with-next-week-bar': tab === 'home' }">
      <HomeScreen v-if="tab === 'home'" />
      <SeasonScreen v-else-if="tab === 'play'" />
      <KidScreen v-else-if="tab === 'kid'" />
      <StatsScreen v-else-if="tab === 'stats'" />
      <MoneyScreen v-else-if="tab === 'money'" />
      <MoreScreen v-else-if="tab === 'more'" />
    </main>

    <!-- Package N: sticky Next-week bar, Home tab only, fixed above the tab bar.
         Both buttons now go through `advance` (weeks: 1|4) so either one can stop
         early on a tournament week / imminent deadline / funds crossing zero. -->
    <div v-if="tab === 'home'" class="next-week-bar">
      <!-- R10-7: one button, a label that names the plan for the week it is about to play. -->
      <button
        class="primary next-week-btn"
        :class="`plan-${weekAhead.kind}`"
        data-tour="next-week"
        :disabled="game.busy"
        @click="game.advance(1)"
      >
        {{ weekAhead.label }}
      </button>
      <button :disabled="game.busy" @click="game.advance(4)">▶▶ 4</button>
    </div>

    <nav class="tab-bar">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab-btn"
        :class="{ active: tab === t.id }"
        :data-tour="`tab-${t.id}`"
        @click="tab = t.id"
      >
        <span class="tab-icon" :style="{ WebkitMaskImage: `url(${iconUrl(tabIcon(t))})`, maskImage: `url(${iconUrl(tabIcon(t))})` }"></span>
        <span class="tab-label">{{ t.label }}</span>
        <span v-if="t.id === 'play' && seasonHasNew" class="tab-dot"></span>
        <!-- R9-21b: unread-news dot, same accent treatment as the Season tab's. -->
        <span v-else-if="t.id === 'home' && homeHasNews" class="tab-dot"></span>
      </button>
    </nav>

    <!-- Foreground tournament: a full-screen overlay shown whenever a reveal is in progress.
         R9-9a: the splash's Back hides it (nothing resolved); the banner above resumes it. -->
    <TournamentFlow v-if="game.snapshot?.pending && !tournamentHidden" @back="tournamentHidden = true" />

    <!-- Round-7 item 4: end-of-season summary popup at the W49→50 boundary. -->
    <SeasonSummaryDialog v-if="showSeasonSummary" @continue="dismissSeasonSummary" />

    <!-- R9-21a: a fresh injury stops the advance with a BLOCKING popup (kind, layoff, what was
         auto-withdrawn + refunds) and an alert sfx – no more quiet missable toast. -->
    <InjuryStopDialog v-if="showInjuryStop" @continue="injuryStopDismissed = true" />

    <!-- Round 5 item 10: one-shot coach-mark tour after the very first career ever. -->
    <OnboardingTour v-if="showTour" @done="dismissTour" />
  </template>
</template>
