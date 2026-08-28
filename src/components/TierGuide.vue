<script setup lang="ts">
// Round 5 item 7 – the "?" tour guide: a static overlay explaining the tier ladder.
// TIERS (calendar.ts) is the single source of truth; this just renders it, in ladder order.
// Ladder-up: all six rungs are live, so the guide carries the OPENS-AT column too – the
// overlapping entry thresholds are the thing the player most needs to read off one screen
// ("what do I need to earn to get there, and what is still open to me now?").
//
// ⚠ THE OPENS-AT COLUMN WAS LYING ABOUT THE TOP TWO RUNGS (31.07, fix/ladder-separation), and it is
// half of the owner's «когда открываются турниры разных типов? Что-то раньше было в интерфейсе видно
// и понятно, а теперь не очень». It rendered `enterPointBand` – which WAS the one entry rule when
// this screen was written – as "65–250" / "150+". Since the two-ladder slice J60 and J300 gate on an
// acceptance list read off the international ranking and carry `[0, MAX]` as a formality, so this
// column printed **"0+"** for them: the two hardest tiers in the game, advertised as needing
// nothing. (No trademark in this file, deliberately – see the fiction guard in tests/ladder.test.ts,
// which reads the whole source and not only the template.) The condition comes from
// `tierOpensWhen` now, which reads the gate the engine actually applies and re-words itself when that
// gate is re-tuned.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import { tierOpensWhen } from '../composables/tierState'
import { formatCents } from '../shared/money'
import type { TierId } from '../engine/season/types'
import IconButton from './ui/IconButton.vue'

defineEmits<{ close: [] }>()

const game = useGameStore()

const TIER_ORDER: TierId[] = [...TIER_LADDER]


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
    return {
      id,
      label: t.label,
      drawSize: t.drawSize,
      // ⭐ ROUND 17 #28, THE LAST SURFACE – flagged 13.08, marked `[x]`, and this cell was still
      // printing «$0». `shared/money.ts`' own rule: «A fact ("no entry fee") and a missing value
      // ("$0") must not look the same», and the only rung this can fire on is the slam, where it is
      // true. ⚠ NOT `entryFeeLabel` here, and the column is why: this is a `.num` cell under a
      // header that already reads «Entry fee», so the helper's full sentence would print «no entry
      // fee» under «Entry fee» and wrap a numeric column. One word is the same fact in this idiom.
      entryFee: t.entryFeeCents === 0 ? 'none' : formatCents(t.entryFeeCents),
      travelRange: `${formatCents(t.travelCostCents[0])}–${formatCents(t.travelCostCents[1])}`,
      points: t.points.join(' / '),
      // The gate the ENGINE applies, in one clause per condition – see `tierOpensWhen`. The live
      // acceptance cut comes off the snapshot for the two rungs that have one, so the guide quotes
      // the same number the entry gate and the Home plaque do.
      opensAt: tierOpensWhen(id, game.snapshot?.tierAcceptance?.[id]),
      locked: t.everyNWeeks === 0,
    }
  }),
)
</script>

<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="guide-card">
      <IconButton class="replay-close" icon="close" label="Close tier guide" title="Close" @click="$emit('close')" />
      <p class="guide-title">Tour guide</p>
      <div class="guide-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Opens at</th>
              <th>Draw</th>
              <th>Entry fee</th>
              <th>Travel</th>
              <th>Points (W / F / SF / …)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" :class="{ 'guide-row-locked': r.locked }">
              <td>{{ r.label }}{{ r.locked ? ' 🔒' : '' }}</td>
              <!-- a sentence now, not a band – no `.num`, and it may wrap -->
              <td class="guide-opens">{{ r.opensAt }}</td>
              <td class="num">{{ r.drawSize }}</td>
              <td class="num">{{ r.entryFee }}</td>
              <td class="num">{{ r.travelRange }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- The two currencies, named, because the column above now mixes them: the domestic rungs open
           on national points and the top two open on a place in the international table, and the two
           never convert into one another. -->
      <p class="hint">
        The bands overlap on purpose – there is always more than one place to go. The first four rungs
        open on national points; the top two take the best of the international ranking instead, and
        the two tables never meet. The Junior Tour is international travel from age 13, and it pays no
        prize money: points only, until the pro tour.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* The opens-at cell carries a short sentence rather than a band, so it may wrap where the numeric
   columns must not. Local to this overlay: `src/style.css` is shared vocabulary. */
.guide-opens {
  min-width: 9em;
}
</style>
