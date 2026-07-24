<script setup lang="ts">
// Round-6 – extracted from KidScreen.vue so the same markup can also live inside the
// Home player card's "How ranking points work" popover (RankHelpDialog.vue) without
// duplicating it. Pure presentation over a `CountingResult[]`; the caller owns fetching
// them off the snapshot.
import { computed } from 'vue'
import { TIERS } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'
import type { CountingResult } from '../shared/protocol'

const props = defineProps<{ results: CountingResult[] }>()

const total = computed(() => props.results.reduce((sum, c) => sum + c.points, 0))

function tierLabel(tier?: TierId): string {
  return tier ? TIERS[tier].label : '–'
}
</script>

<template>
  <table v-if="results.length">
    <thead>
      <tr>
        <th>Week</th>
        <th>Tier</th>
        <th>Pts</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(c, i) in results" :key="i">
        <td class="num">W{{ c.week }}</td>
        <td>{{ tierLabel(c.tier) }}</td>
        <td class="num">{{ c.points }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="counting-total">
        <th>Total</th>
        <td></td>
        <td class="num">{{ total }}</td>
      </tr>
    </tfoot>
  </table>
  <p v-else class="hint">No counted results yet – enter a tournament to earn ranking points.</p>
</template>
