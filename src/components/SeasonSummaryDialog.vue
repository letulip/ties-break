<script setup lang="ts">
// Round-7 item 4 – the end-of-season summary popup. Auto-shown on Home when a fresh snapshot
// arrives whose stop reasons include 'season-end' (App.vue owns that trigger, the client-side
// dismiss, and the R11-1 rule that an injury on the same week gets its dialog first);
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

// R11-12a: the owner read the single net-delta line as the season's SPEND and compared it against
// the wallet's "This season" total, which is gross spend – two right numbers that look like one
// wrong one. Spend and income now have their own rows (the same financeWindow fold the Money screen
// reads, over the same window), and the net keeps the bottom line. `undefined` on a summary banked
// before R11-12a, in which case only the net row shows, exactly as before.
const spentCents = computed(() => summary.value?.spentCents)
const earnedCents = computed(() => summary.value?.earnedCents)

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
            <th>Lost to injury</th>
            <!-- weeksInjured is optional (pre-slice-C summaries never stored it): default 0 -->
            <td class="num">{{ summary.weeksInjured ?? 0 }} wk</td>
          </tr>
          <tr v-if="spentCents !== undefined">
            <th>Spent this season</th>
            <td class="num negative">{{ formatSigned(-spentCents) }}</td>
          </tr>
          <tr v-if="earnedCents !== undefined">
            <th>Earned this season</th>
            <td class="num positive">{{ formatSigned(earnedCents) }}</td>
          </tr>
          <!-- v21: the scholarship never shows up in "Earned" – its travel half is a discount on
               the travel line, not income – so this is the only place the year's help is a number.
               Hidden at zero: a family nobody backed should not read a row of dashes. -->
          <tr v-if="(summary.academyCoveredCents ?? 0) > 0">
            <th>Academy covered</th>
            <td class="num positive">{{ formatSigned(summary.academyCoveredCents ?? 0) }}</td>
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
