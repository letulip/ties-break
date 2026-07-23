<script setup lang="ts">
// Package I – Kid tab: portrait + profile table + a Phase 4 placeholder.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import type { CoachSetup, FamilyBackground, PlayStyle } from '../../shared/protocol'

const game = useGameStore()
// Raster art ships as webp (≤512 px, quality 82) via `npm run art`; PNG sources live in
// art-src/ (not served). Same portrait, webp filename.
const portraitUrl = `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-jun-norm-fs8.webp`

const BACKGROUND_LABEL: Record<FamilyBackground, string> = {
  wealthy: 'Wealthy',
  middle: 'Middle class',
  working: 'Working class',
}
const COACH_LABEL: Record<CoachSetup, string> = {
  parent: 'Parent-coached',
  hired: 'Hired coach',
}
const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  aggressive: 'Aggressive baseliner',
  counterpuncher: 'Counterpuncher',
  'serve-first': 'Big serve',
  'all-court': 'All-court',
}
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
const backgroundLabel = computed(() => (game.snapshot ? BACKGROUND_LABEL[game.snapshot.profile.background] : ''))
const coachingLabel = computed(() => (game.snapshot ? COACH_LABEL[game.snapshot.profile.coachSetup] : ''))
const playStyleLabel = computed(() => (game.snapshot ? PLAY_STYLE_LABEL[game.snapshot.profile.playStyle] : ''))
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Kid</h2>
      <img class="kid-portrait" :src="portraitUrl" :alt="kidName" loading="lazy" />
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
            <th>Background</th>
            <td>{{ backgroundLabel }}</td>
          </tr>
          <tr>
            <th>Coaching</th>
            <td>{{ coachingLabel }}</td>
          </tr>
          <tr>
            <th>Play style</th>
            <td>{{ playStyleLabel }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Skills &amp; development</h2>
      <p class="hint">Phase 4</p>
    </section>
  </template>
</template>
