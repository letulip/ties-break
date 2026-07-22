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
</script>

<template>
  <div v-if="!game.ready" class="app-loading">Loading…</div>

  <OnboardingWizard v-else-if="showOnboarding" />

  <template v-else>
    <header class="app-header">
      <img class="avatar" :src="avatarUrl" alt="" />
      <span class="kid-name">{{ kidName }}</span>
      <span class="pill status-pill" :class="{ negative: fundsCents < 0 }">W{{ week }} · {{ funds }}</span>
    </header>

    <main class="app-content" :class="{ 'with-next-week-bar': tab === 'home' }">
      <HomeScreen v-if="tab === 'home'" />
      <SeasonScreen v-else-if="tab === 'play'" />
      <KidScreen v-else-if="tab === 'kid'" />
      <MoneyScreen v-else-if="tab === 'money'" />
      <MoreScreen v-else-if="tab === 'more'" />
    </main>

    <!-- Package J: sticky Next-week bar, Home tab only, fixed above the tab bar. -->
    <div v-if="tab === 'home'" class="next-week-bar">
      <button class="primary" :disabled="game.busy" @click="game.tick(1)">Next week ▶</button>
      <button :disabled="game.busy" @click="game.tick(52)">▶▶ 52</button>
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
