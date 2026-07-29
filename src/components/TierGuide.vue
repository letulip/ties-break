<script setup lang="ts">
// Round 5 item 7 – the "?" tour guide: a static overlay explaining the tier ladder.
// TIERS (calendar.ts) is the single source of truth; this just renders it, in ladder order.
// Ladder-up: all six rungs are live, so the guide carries the OPENS-AT column too – the
// overlapping entry thresholds are the thing the player most needs to read off one screen
// ("what do I need to earn to get there, and what is still open to me now?").
import { computed } from 'vue'
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'

defineEmits<{ close: [] }>()

const TIER_ORDER: TierId[] = [...TIER_LADDER]

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
  opensAt: string
  locked: boolean
}
const rows = computed<TierRow[]>(() =>
  TIER_ORDER.map((id) => {
    const t = TIERS[id]
    const [min, max] = t.enterPointBand
    return {
      id,
      label: t.label,
      drawSize: t.drawSize,
      entryFee: formatDollars(t.entryFeeCents),
      travelRange: `${formatDollars(t.travelCostCents[0])}–${formatDollars(t.travelCostCents[1])}`,
      points: t.points.join(' / '),
      // "0+" / "180+" for a tier that never closes, "65–230" for one she graduates out of.
      opensAt: max === Number.MAX_SAFE_INTEGER ? `${min}+` : `${min}–${max}`,
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
              <th>Your points</th>
              <th>Draw</th>
              <th>Entry fee</th>
              <th>Travel</th>
              <th>Points (W / F / SF / …)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" :class="{ 'guide-row-locked': r.locked }">
              <td>{{ r.label }}{{ r.locked ? ' 🔒' : '' }}</td>
              <td class="num">{{ r.opensAt }}</td>
              <td class="num">{{ r.drawSize }}</td>
              <td class="num">{{ r.entryFee }}</td>
              <td class="num">{{ r.travelRange }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">
        The bands overlap on purpose – there is always more than one place to go. The Junior Tour is
        international travel from age 13, and it pays no prize money: points only, until the pro tour.
      </p>
    </div>
  </div>
</template>
