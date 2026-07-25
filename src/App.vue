<script setup lang="ts">
// Package I – app shell: slim header + 5-tab bottom bar, or the full-screen
// onboarding wizard when there is no active career. No router – a plain ref
// switch, per spec.
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore } from './stores/game'
import { needRefresh, applyUpdate } from './pwa'
import { weekRange } from './shared/dates'
import { avatarEmotion, type LastKidResult } from './shared/avatarEmotion'
import { KID_ID } from './engine/world'
import SplashScreen from './components/SplashScreen.vue'
import OnboardingWizard from './components/OnboardingWizard.vue'
import OnboardingTour from './components/OnboardingTour.vue'
import TournamentFlow from './components/TournamentFlow.vue'
import SeasonSummaryDialog from './components/SeasonSummaryDialog.vue'
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

// Round-8 R8-6a/R8-6b (supersedes round 5's lastKidMatchWon heuristic): the header avatar
// emotion is decided by the pure helper in src/shared/avatarEmotion.ts. A result emotion
// (happy / sad / serious-for-a-lost-final) only lasts until the next weekly tick; after
// that the face reflects her current state (injury / tired / serious / norm). Face crops
// live in public/avatars/jun-{norm,happy,sad,serious,tired,injury}.webp (256×256, cropped
// from the fem-euro-brunnet jun art via the round5-brand offsets convention). Junior stage
// until the stage-by-age portrait slice lands.
const lastKidResult = computed<LastKidResult | null>(() => {
  const events = game.snapshot?.events
  if (!events) return null
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    const match = e.match
    if (!match) continue
    const won = match.winnerId === KID_ID
    // R8-6a: a loss in the FINAL = runner-up = a good result. The same week's tournament
    // summary carries finishIdx 1 exactly when her run ended in the final.
    const lostFinal =
      !won && events.some((t) => t.type === 'tournament' && t.week === e.week && t.finishIdx === 1)
    return { week: e.week, won, lostFinal }
  }
  return null
})
const avatarUrl = computed(() => {
  const emotion = avatarEmotion({
    week: game.snapshot?.week ?? 0,
    condition: game.snapshot?.condition ?? 100,
    injured: !!game.snapshot?.injury,
    lastResult: lastKidResult.value,
  })
  return `${import.meta.env.BASE_URL}avatars/jun-${emotion}.webp`
})

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
watch(
  () => game.snapshot,
  () => {
    stopToastDismissed.value = false
    seasonSummaryDismissed.value = false
  },
)
// The tournament stop is owned by the full-screen TournamentFlow overlay and the season-end stop
// by SeasonSummaryDialog (both show off the snapshot); deadline/funds stops keep the toast.
const showStopToast = computed(
  () =>
    !!game.snapshot?.stopReason &&
    game.snapshot.stopReason !== 'tournament' &&
    game.snapshot.stopReason !== 'season-end' &&
    !stopToastDismissed.value,
)
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
const STOP_REASON_TEXT: Record<string, string> = {
  deadline: 'Stopped: an entry deadline is coming up next week.',
  funds: 'Stopped: funds ran below zero.',
  injury: 'Stopped: she picked up an injury – see the news.',
}
const stopReasonText = computed(() => STOP_REASON_TEXT[game.snapshot?.stopReason ?? ''] ?? '')
function dismissStopToast(): void {
  stopToastDismissed.value = true
}
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
      <button class="primary" data-tour="next-week" :disabled="game.busy" @click="game.advance(1)">Next week ▶</button>
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
        <span class="tab-icon" :style="{ WebkitMaskImage: `url(${iconUrl(t.icon)})`, maskImage: `url(${iconUrl(t.icon)})` }"></span>
        <span class="tab-label">{{ t.label }}</span>
        <span v-if="t.id === 'play' && seasonHasNew" class="tab-dot"></span>
      </button>
    </nav>

    <!-- Foreground tournament: a full-screen overlay shown whenever a reveal is in progress. -->
    <TournamentFlow v-if="game.snapshot?.pending" />

    <!-- Round-7 item 4: end-of-season summary popup at the W49→50 boundary. -->
    <SeasonSummaryDialog v-if="showSeasonSummary" @continue="dismissSeasonSummary" />

    <!-- Round 5 item 10: one-shot coach-mark tour after the very first career ever. -->
    <OnboardingTour v-if="showTour" @done="dismissTour" />
  </template>
</template>
