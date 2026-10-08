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
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import { tierOpensWhen } from '../composables/tierState'
import { formatCents } from '../shared/money'
import { t } from '../i18n'
import type { TierId } from '../engine/season/types'
import IconButton from './ui/IconButton.vue'

const emit = defineEmits<{ close: [] }>()

// ⚠⚠ E-08 / T4.7 – THE LAST OF THE FOUR ROLELESS OVERLAYS, AND ITS SIBLING'S FIX IS THE WHOLE PATCH.
// This card had NO role, no trap, no Escape and no phone net: `getByRole('dialog')` found nothing
// while it was open, a screen reader was never told a card had opened at all, and Tab walked out of it
// into the tab bar behind the scrim. `composables/dialogFocus.ts` states why those halves have to
// arrive together rather than one at a time.
//
// ⚠ `RankHelpDialog.vue` IS THE PRECEDENT AND IT IS THE SAME `.guide-card`, which is what makes this
// four lines rather than a design: U-06 fixed the sibling on this very box, so the cap, the scroller
// and the pinned close are already measured for a phone – see the new fit case in
// tests/component/principles-w4-dialog-focus.test.ts, which asserts them here too rather than
// assuming the shared class.
//
// ⚠ ESCAPE IS PASSED, for the sibling's reason: this card already closes on a backdrop click, and
// Escape is the keyboard's spelling of that same gesture (the composable's rule – the blocking
// questions, which have no way out that is not an answer, pass nothing). It is a reference table; it
// asks nothing.
//
// ⚠ NOT ONE WORD MOVED (invariant 4): the title, the six column headings and the closing paragraph are
// exactly what they were, and the title simply gained an id so it can NAME the dialog.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('close'))

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
    const tier = TIERS[id]
    return {
      id,
      label: tier.label,
      drawSize: tier.drawSize,
      // ⭐ ROUND 17 #28, THE LAST SURFACE – flagged 13.08, marked `[x]`, and this cell was still
      // printing «$0». `shared/money.ts`' own rule: «A fact ("no entry fee") and a missing value
      // ("$0") must not look the same», and the only rung this can fire on is the slam, where it is
      // true. ⚠ NOT `entryFeeLabel` here, and the column is why: this is a `.num` cell under a
      // header that already reads «Entry fee», so the helper's full sentence would print «no entry
      // fee» under «Entry fee» and wrap a numeric column. One word is the same fact in this idiom.
      entryFee: tier.entryFeeCents === 0 ? t('fee|none') : formatCents(tier.entryFeeCents),
      travelRange: `${formatCents(tier.travelCostCents[0])}–${formatCents(tier.travelCostCents[1])}`,
      points: tier.points.join(' / '),
      // The gate the ENGINE applies, in one clause per condition – see `tierOpensWhen`. The live
      // acceptance cut comes off the snapshot for the two rungs that have one, so the guide quotes
      // the same number the entry gate and the Home plaque do.
      opensAt: tierOpensWhen(id, game.snapshot?.tierAcceptance?.[id]),
      locked: tier.everyNWeeks === 0,
    }
  }),
)
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <!-- ⚠ E-08 / T4.7: role/aria-modal on the CARD and not on the scrim, `tabindex="-1"` so the trap
         has a landing place, and the title element names it - the same four lines every other dialog in
         the app carries (R2-07), and `RankHelpDialog.vue`'s verbatim. -->
    <div
      ref="card"
      class="guide-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-guide-title"
      tabindex="-1"
    >
      <IconButton class="replay-close" icon="close" :label="t('Close tier guide')" :title="t('Close')" @click="emit('close')" />
      <p id="tier-guide-title" class="guide-title">{{ t('Tour guide') }}</p>
      <div class="guide-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t('Tier') }}</th>
              <th>{{ t('Opens at') }}</th>
              <th>{{ t('Draw') }}</th>
              <th>{{ t('Entry fee') }}</th>
              <th>{{ t('Travel') }}</th>
              <th>{{ t('Points (W / F / SF / …)') }}</th>
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
        {{ t('The bands overlap on purpose – there is always more than one place to go. The first four rungs open on national points; the top two take the best of the international ranking instead, and the two tables never meet. The Junior Tour is international travel from age 13, and it pays no prize money: points only, until the pro tour.') }}
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
