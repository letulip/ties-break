<script setup lang="ts">
// Round-7 item 4 – the end-of-season summary popup. Auto-shown on Home when a fresh snapshot
// arrives with stopReason 'season-end' (App.vue owns that trigger + the client-side dismiss);
// reads the structured `lastSeasonSummary` the engine banked at wrap-up time. «Таблички» style:
// the figures live in a plain stats table, same rhythm as the rest of the app.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

defineEmits<{ continue: [] }>()

const game = useGameStore()
const summary = computed(() => game.snapshot?.lastSeasonSummary ?? null)

function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

// Rank move over the season (rank improves when the number goes DOWN).
const rankMove = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const s = summary.value
  if (!s || s.startRank === null || s.startRank === s.endRank) return { dir: 'flat', by: 0 }
  return s.startRank > s.endRank
    ? { dir: 'up', by: s.startRank - s.endRank }
    : { dir: 'down', by: s.endRank - s.startRank }
})
</script>

<template>
  <div v-if="summary" class="dialog-overlay" @click.self="$emit('continue')">
    <div class="dialog-card season-summary">
      <p class="season-summary-kicker">Season {{ summary.seasonYear }} · wrap-up</p>
      <h2 class="season-summary-title">That's a season.</h2>
      <table class="season-summary-table">
        <tbody>
          <tr>
            <th>Final rank</th>
            <td>
              <span class="rank-value">#{{ summary.endRank }}</span>
              <span v-if="rankMove.dir === 'up'" class="rank-move up">↑{{ rankMove.by }}</span>
              <span v-else-if="rankMove.dir === 'down'" class="rank-move down">↓{{ rankMove.by }}</span>
              <span v-else class="rank-move flat">–</span>
              <span v-if="summary.startRank !== null" class="hint season-summary-from">from #{{ summary.startRank }}</span>
            </td>
          </tr>
          <tr>
            <th>Season points</th>
            <td class="num">{{ summary.points }}</td>
          </tr>
          <tr>
            <th>Match record</th>
            <td class="num">{{ summary.wins }}–{{ summary.losses }}</td>
          </tr>
          <tr>
            <th>Best result</th>
            <td>{{ summary.bestResultText }}</td>
          </tr>
          <tr>
            <th>Funds this season</th>
            <td class="num" :class="{ negative: summary.fundsDeltaCents < 0, positive: summary.fundsDeltaCents >= 0 }">
              {{ formatSigned(summary.fundsDeltaCents) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p class="hint season-summary-note">Off-season now: rest, school, family time.</p>
      <div class="dialog-actions">
        <button class="primary" @click="$emit('continue')">Continue</button>
      </div>
    </div>
  </div>
</template>
