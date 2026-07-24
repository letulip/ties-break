<script setup lang="ts">
// Round 5 item 7 – the "?" tour guide: a static overlay explaining the tier ladder.
// TIERS (calendar.ts) is the single source of truth; this just renders it. The ITF row
// is shown too (locked) so the player understands what's coming.
import { computed } from 'vue'
import { TIERS } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'

defineEmits<{ close: [] }>()

const TIER_ORDER: TierId[] = ['local', 'regional', 'national', 'itf']

function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

interface TierRow {
  id: TierId
  label: string
  drawSize: number
  entryFee: string
  travelRange: string
  points: string
  locked: boolean
}
const rows = computed<TierRow[]>(() =>
  TIER_ORDER.map((id) => {
    const t = TIERS[id]
    return {
      id,
      label: t.label,
      drawSize: t.drawSize,
      entryFee: formatDollars(t.entryFeeCents),
      travelRange: `${formatDollars(t.travelCostCents[0])}–${formatDollars(t.travelCostCents[1])}`,
      points: t.points.join(' / '),
      locked: t.everyNWeeks === 0,
    }
  }),
)
</script>

<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="guide-card">
      <button class="replay-close" aria-label="Close tier guide" title="Close" @click="$emit('close')">✕</button>
      <p class="guide-title">Tour guide</p>
      <div class="guide-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Draw</th>
              <th>Entry fee</th>
              <th>Travel</th>
              <th>Points (W / F / SF / …)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" :class="{ 'guide-row-locked': r.locked }">
              <td>{{ r.label }}{{ r.locked ? ' 🔒' : '' }}</td>
              <td class="num">{{ r.drawSize }}</td>
              <td class="num">{{ r.entryFee }}</td>
              <td class="num">{{ r.travelRange }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Junior events pay no prize money – that starts on the pro tour (real ITF rule).</p>
    </div>
  </div>
</template>
