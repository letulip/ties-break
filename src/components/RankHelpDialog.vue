<script setup lang="ts">
// Round-6 – "How ranking points work" popover, opened from the "?" on the Home player
// card's Junior rank row. Owner got confused twice by the best-6 windowed ranking, so
// this spells it out plainly: the same CountingResultsTable the Kid screen shows (so the
// player can see their own six counted results while reading the rule), plus three short
// rule lines. Same dialog-overlay/scrollable-card/pinned-close pattern as TierGuide.vue.
import { useGameStore } from '../stores/game'
import CountingResultsTable from './CountingResultsTable.vue'

defineEmits<{ close: [] }>()

const game = useGameStore()
</script>

<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="guide-card">
      <button class="replay-close" aria-label="Close" title="Close" @click="$emit('close')">✕</button>
      <p class="guide-title">How ranking points work</p>
      <CountingResultsTable :results="game.snapshot?.countingResults ?? []" />
      <ul class="rank-help-rules">
        <li class="hint">Season points = the sum of your 6 best tournament results from the last 52 weeks.</li>
        <li class="hint">A new result only raises the total if it beats the weakest of those six.</li>
        <li class="hint">Results older than 52 weeks drop out of the window – points must be defended.</li>
      </ul>
    </div>
  </div>
</template>
