<script setup lang="ts">
// Round-6 – extracted from KidScreen.vue so the same markup can also live inside the
// Home player card's "How ranking points work" popover (RankHelpDialog.vue) without
// duplicating it. Pure presentation over a `CountingResult[]`; the caller owns fetching
// them off the snapshot.
import { computed } from 'vue'
import { TIERS } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'
import type { CountingResult } from '../shared/protocol'
import { weekLabel } from '../shared/dates'

const props = defineProps<{
  results: CountingResult[]
  /** What to say when the list is empty. Optional, defaulting to the copy this component has always
   *  used - the ONE caller that overrides it is the two-ladder rank explainer, where the generic line
   *  ("enter a tournament to earn ranking points") is actively wrong: a girl can have played forty
   *  domestic tournaments and still hold an empty INTERNATIONAL list, because the two tables have no
   *  exchange rate. A prop rather than a second paragraph at the call site, so the empty state stays
   *  one sentence in one place. */
  emptyNote?: string
}>()

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
        <td class="num">{{ weekLabel(c.week) }}</td>
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
  <p v-else class="hint">{{ emptyNote ?? 'No counted results yet – enter a tournament to earn ranking points.' }}</p>
</template>
