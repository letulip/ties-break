<script setup lang="ts">
// Package I – app shell: slim header + 5-tab bottom bar, or the full-screen
// onboarding wizard when there is no active career. No router – a plain ref
// switch, per spec.
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore } from './stores/game'
import OnboardingWizard from './components/OnboardingWizard.vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import SeasonScreen from './components/screens/SeasonScreen.vue'
import KidScreen from './components/screens/KidScreen.vue'
import MoneyScreen from './components/screens/MoneyScreen.vue'
import MoreScreen from './components/screens/MoreScreen.vue'

const game = useGameStore()
// Face crops from the stage "norm" portraits (public/avatars, generated via scripts;
// see docs/decisions.md). Junior stage until the sim grows an age.
const avatarUrl = `${import.meta.env.BASE_URL}avatars/jun.png`

onMounted(() => game.init())

type TabId = 'home' | 'play' | 'kid' | 'money' | 'more'
const tab = ref<TabId>('home')

// Package J: the 'play' tab id stays (per spec – no router, minimal diff) but
// is now the Season tab (calendar placeholder + the old exhibition block).
const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'home', emoji: '🏠', label: 'Home' },
  { id: 'play', emoji: '📅', label: 'Season' },
  { id: 'kid', emoji: '👧', label: 'Kid' },
  { id: 'money', emoji: '💰', label: 'Money' },
  { id: 'more', emoji: '☰', label: 'More' },
]

// No active snapshot once init() has settled means: no auto-loaded slot and no
// in-progress career (fresh install, or a client-side reset from More).
const showOnboarding = computed(() => game.ready && !game.snapshot)

// A career appearing after onboarding must land on Home, not whatever tab was
// active before the reset (e.g. More, where "New career" lives).
watch(
  () => game.snapshot,
  (now, before) => {
    if (now && !before) tab.value = 'home'
  },
)

function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatFunds(fundsCents.value))

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
watch(
  () => game.snapshot,
  () => {
    stopToastDismissed.value = false
  },
)
const showStopToast = computed(() => !!game.snapshot?.stopReason && !stopToastDismissed.value)
const STOP_REASON_TEXT: Record<string, string> = {
  tournament: 'Stopped: this week’s tournament just wrapped up.',
  deadline: 'Stopped: an entry deadline is coming up next week.',
  funds: 'Stopped: funds ran below zero.',
}
const stopReasonText = computed(() => STOP_REASON_TEXT[game.snapshot?.stopReason ?? ''] ?? '')
function dismissStopToast(): void {
  stopToastDismissed.value = true
}
</script>

<template>
  <div v-if="!game.ready" class="app-loading">Loading…</div>

  <OnboardingWizard v-else-if="showOnboarding" />

  <template v-else>
    <header class="app-header">
      <img class="avatar" :src="avatarUrl" alt="" />
      <span class="kid-name">{{ kidName }}</span>
      <button class="pill status-pill" :class="{ negative: fundsCents < 0 }" @click="tab = 'money'">
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
      <MoneyScreen v-else-if="tab === 'money'" />
      <MoreScreen v-else-if="tab === 'more'" />
    </main>

    <!-- Package N: sticky Next-week bar, Home tab only, fixed above the tab bar.
         Both buttons now go through `advance` (weeks: 1|4) so either one can stop
         early on a tournament week / imminent deadline / funds crossing zero. -->
    <div v-if="tab === 'home'" class="next-week-bar">
      <button class="primary" :disabled="game.busy" @click="game.advance(1)">Next week ▶</button>
      <button :disabled="game.busy" @click="game.advance(4)">▶▶ 4</button>
    </div>

    <nav class="tab-bar">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab-btn"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        <span class="tab-emoji">{{ t.emoji }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </button>
    </nav>
  </template>
</template>
