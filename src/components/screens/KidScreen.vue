<script setup lang="ts">
// Package I – Kid tab: portrait + profile table + a Phase 4 placeholder.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import CountingResultsTable from '../CountingResultsTable.vue'
import { useKidEmotion } from '../../composables/kidEmotion'
import type { FamilyBackground, PlayStyle } from '../../shared/protocol'
import { COACH_TIER_LABEL } from '../../engine/coach'

const game = useGameStore()
// THE DOOR TO THE COACH MARKET (screen T). It lives on the Coaching row rather than on Home for two
// reasons: the row already names who coaches her, so "tap it to change that" needs no new concept;
// and Home's coach card is designed as the coach's MESSAGE FEED, whose guard test deliberately pins
// that region money-free - a price-bearing market door would fight both the design and the test.
// The shell owns `tab`; this screen only asks (the same rule HomeScreen follows).
const emit = defineEmits<{ navigate: ['market'] }>()
// Raster art ships as webp only (≤512 px, quality 82-75), converted by the build itself
// (vite.config.ts -> scripts/optimize-art.mjs). The masters live outside the repo, in the
// gitignored art-src/, and are never served. R9-15/16: the BIG portrait reflects her CURRENT
// state and age stage via the shared composable – art exists for every stage×emotion.
const { portraitUrl } = useKidEmotion()

const BACKGROUND_LABEL: Record<FamilyBackground, string> = {
  wealthy: 'Wealthy',
  middle: 'Middle class',
  working: 'Working class',
}
const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  aggressive: 'Aggressive baseliner',
  counterpuncher: 'Counterpuncher',
  'serve-first': 'Big serve',
  'all-court': 'All-court',
}
// Round-6: birth month row (relative-age-effect groundwork, round-3 QA item 16).
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', FR: 'France', ES: 'Spain', IT: 'Italy', DE: 'Germany',
  RU: 'Russia', RS: 'Serbia', CH: 'Switzerland', CZ: 'Czechia', PL: 'Poland', UA: 'Ukraine',
  KZ: 'Kazakhstan', BY: 'Belarus', AU: 'Australia', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', BR: 'Brazil', AR: 'Argentina', CA: 'Canada', NL: 'Netherlands', SE: 'Sweden',
}

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
const kidFullName = computed(() => {
  const p = game.snapshot?.profile
  return p ? `${p.kidName} ${p.kidLastName}`.trim() : ''
})
const countryDisplay = computed(() => {
  const code = game.snapshot?.profile.country ?? ''
  if (!code) return ''
  return `${COUNTRY_NAMES[code] ?? code} ${flagEmoji(code)}`
})
const birthMonthLabel = computed(() => (game.snapshot ? MONTHS[game.snapshot.profile.birthMonth - 1] ?? '' : ''))
const backgroundLabel = computed(() => (game.snapshot ? BACKGROUND_LABEL[game.snapshot.profile.background] : ''))
// Who she trains with TODAY, which is `world.coachId` and not the rung chosen at onboarding – the
// two part company the first time the market is used.
const coachName = computed(() => {
  const snap = game.snapshot
  if (!snap) return ''
  const row = snap.coachMarket.find((c) => c.current)
  return row ? `${row.name} – ${COACH_TIER_LABEL[row.tier]} tier` : COACH_TIER_LABEL['self']
})
const playStyleLabel = computed(() => (game.snapshot ? PLAY_STYLE_LABEL[game.snapshot.profile.playStyle] : ''))

// --- Counting results (round-5 item 1b): the kid's best-6, 52-week window. Its point
// total equals the standings points, so the ranking stops looking like a bug. Table
// markup lives in the shared CountingResultsTable.vue (round-6 – also used by the Home
// player card's best-6 help popover). --
const countingResults = computed(() => game.snapshot?.countingResults ?? [])
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Kid</h2>
      <img
        class="kid-portrait"
        :src="portraitUrl"
        :alt="kidName"
        width="512"
        height="512"
        decoding="async"
        loading="lazy"
      />
      <table style="margin-top: 12px">
        <tbody>
          <tr>
            <th>Name</th>
            <td>{{ kidFullName }}</td>
          </tr>
          <tr>
            <th>Country</th>
            <td>{{ countryDisplay }}</td>
          </tr>
          <tr>
            <th>Birth month</th>
            <td>{{ birthMonthLabel }}</td>
          </tr>
          <tr>
            <th>Background</th>
            <td>{{ backgroundLabel }}</td>
          </tr>
          <tr>
            <th>Coaching</th>
            <td>
              <button class="linkish" @click="emit('navigate', 'market')">{{ coachName }} &rsaquo;</button>
            </td>
          </tr>
          <tr>
            <th>Play style</th>
            <td>{{ playStyleLabel }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Counting results (best 6)</h2>
      <p class="hint" style="margin-top: 0">
        Your rank counts your six best results from the last 52 weeks – this total is your ranking points.
      </p>
      <CountingResultsTable :results="countingResults" />
    </section>

    <section>
      <h2>Skills &amp; development</h2>
      <p class="hint">Phase 4</p>
    </section>
  </template>
</template>
