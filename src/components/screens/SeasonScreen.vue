<script setup lang="ts">
// Package J – Season tab (replaces the Package I "Play" tab in the shell; the
// exhibition block moves here verbatim under a renamed heading, plus a new
// Calendar placeholder card).
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import MatchViewer from '../MatchViewer.vue'
import { simulateMatch } from '../../engine/match/engine'
import { annotateMatch } from '../../engine/match/rally'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { AnnotatedMatch } from '../../viz/types'

const game = useGameStore()

// --- Calendar: Phase-3 placeholder rows, labeled by the current plan's train/
// rest split (same >=70 threshold the worker uses for week-log flavor). No real
// tournament schedule exists yet.
const week = computed(() => game.snapshot?.week ?? 0)
const trainHeavy = computed(() => (game.snapshot?.plan.train ?? 0) >= 70)
const calendarRows = computed(() =>
  Array.from({ length: 4 }, (_, i) => ({
    week: week.value + i + 1,
    label: trainHeavy.value ? 'Training block' : 'Rest block',
  })),
)

// --- Friendly match: exhibition block, moved from the old PlayScreen.vue -----
const exhibitionSurface: Surface = 'clay'
const kidName = computed(() => game.snapshot?.profile.kidName ?? 'Vera')
const exhibitionPlayerA = computed<MatchPlayer>(() => ({
  id: 'vera',
  name: kidName.value,
  serve: 58,
  ret: 55,
  composure: 42,
  stamina: 61,
}))
const exhibitionPlayerB: MatchPlayer = { id: 'top-seed', name: 'Top seed', serve: 63, ret: 60, composure: 70, stamina: 65 }
const exhibitionSeed = ref('')
const exhibitionMatch = ref<AnnotatedMatch | null>(null)

function playExhibition() {
  const seed = exhibitionSeed.value.trim() || `exhibition-${Date.now().toString(36)}`
  const opts: MatchOptions = { surface: exhibitionSurface, tour: 'wta', seed }
  const result = simulateMatch(exhibitionPlayerA.value, exhibitionPlayerB, opts)
  exhibitionMatch.value = annotateMatch(result, exhibitionPlayerA.value, exhibitionPlayerB, opts)
}
</script>

<template>
  <section>
    <h2>Calendar</h2>
    <table>
      <tbody>
        <tr v-for="row in calendarRows" :key="row.week">
          <th>W{{ row.week }}</th>
          <td>{{ row.label }}</td>
        </tr>
      </tbody>
    </table>
    <p class="hint">Real calendar and tournaments – Phase 3</p>
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
    />
  </section>
</template>
