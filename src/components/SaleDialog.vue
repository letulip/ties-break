<script lang="ts">
// ⚠ MODULE SCOPE, AND IT HAS TO BE A SECOND BLOCK – `ConfirmDialog`'s own reason: a counter inside `<script setup>` restarts for every instance, and two
// dialogs that share an `aria-labelledby` id read the wrong heading over the right buttons.
let headingSeq = 0
</script>

<script setup lang="ts">
// THE MARKET POPUP – the secondary market, S5 (docs/specs/secondary-market-2026-09.md §2g). What a THING's Sell opens: the engine's quote laid out
// – how long a sale may take, what offers may range between, what selling at once pays – and the three doors he asked for, List / Sell now / keep.
// His own sketch of it: «вы собираетесь продать (объект), это может занять от Н до К недель. Цена может варьироваться от текущей до более низкой».
//
// ⚠⚠ THIS COMPONENT PRINTS AND DERIVES NOTHING. Every line arrives already written (`saleDialogLines`, composables/shop.ts, off the row's
// `quote` – the parity law, docs/specs/engine-ui-parity-2026-09.md), the heading is the engine's name for the lot, and the only decisions here are
// which button was pressed. «Sell now» does not sell: it goes on to the ordinary confirm, so the irreversible press keeps its one question.
//
// ⚠ ON THE SHARED SHELL, AND THE SHELL'S FOUR DUTIES ARE KEPT (`ConfirmDialog`'s header states them): role + aria-modal + a name + `useDialogFocus`.
// Escape and the scrim both mean «keep» – the safe door, the one that commits nothing – and initial focus is on it because it is written first.
// ⚠ AND THE CARD IS THE SHARED `.dialog-card`, WHICH CARRIES THE HEIGHT BOUND (round-20 #3): a dialog that grows by one honest sentence at a time
// scrolls inside the phone instead of pushing its own way out off the screen. tests/component/secondary-market-s5.test.ts measures that on a
// 375x667 viewport and proves the measurement can fail.
import { useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'
import { SALE_LABELS } from '../composables/shop'

defineProps<{
  /** the engine's name for the lot (`ShopRowView.fire.label`) */
  heading: string
  /** the popup's lines, already written */
  lines: string[]
  /** false once the lot is already on the market: «List» would be refused, so it is not drawn – «Sell now» stays (the exit is never locked) */
  listable: boolean
}>()

const emit = defineEmits<{ list: []; sell: []; cancel: [] }>()

const headingId = `sale-dialog-heading-${++headingSeq}`

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('cancel'))
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('cancel')">
    <div
      ref="card"
      class="dialog-card sale-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="headingId"
      tabindex="-1"
    >
      <h3 :id="headingId" class="sale-dialog-heading">{{ heading }}</h3>
      <p v-for="(line, i) in lines" :key="i" class="dialog-message sale-dialog-line">{{ line }}</p>
      <div class="dialog-actions">
        <button class="sale-dialog-keep" @click="emit('cancel')">{{ SALE_LABELS.keep }}</button>
        <button class="sale-dialog-sell" @click="emit('sell')">{{ SALE_LABELS.sellNow }}</button>
        <button v-if="listable" class="primary sale-dialog-list" @click="emit('list')">{{ SALE_LABELS.list }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sale-dialog-heading {
  margin: 0 0 8px;
  font-size: 1.05rem;
  line-height: 1.3;
}

.sale-dialog-line {
  margin: 0 0 6px;
}
</style>
