<script lang="ts">
// ⚠ MODULE SCOPE, ON ConfirmDialog's OWN PRECEDENT AND FOR ITS OWN REASON. `useId` counts per app
// INSTANCE, so two roots both produce `v-0`; a module counter is unique per document, which is what
// `aria-labelledby` actually needs. Only one of these is ever up at a time today – the shell owns
// the span – but a per-instance id is one refactor away from being wrong and costs nothing now.
let spanSeq = 0
</script>

<script setup lang="ts">
// ⭐⭐ R2-13 PHASE 1 – WHAT THE FOUR WEEKS DID, ALL OF IT, ON ONE CARD.
//
// ⚠⚠ THIS COMPONENT IS THE PRICE OF THE SECOND BUTTON, AND IT IS NOT OPTIONAL. The engine has
// supported a four-week advance from the beginning; what stopped it being a feature was never the
// engine, it was that a span reports its LAST week and this app tells the story of a week through
// surfaces that are all about the CURRENT one – `WeekRecapCard` renders `snapshot.week` and nothing
// else, and the news feed is a scroll the player has no reason to open. This codebase has already
// paid for that twice and written both invoices down:
//
//   * R12-15, the walkover: an entry fee forfeited while she was laid up, "and the only trace was
//     one line in a news feed the player had no reason to open – because the click that caused it
//     had just promised a tournament."
//   * Round-23 #16, the academy's verdict (the owner: «Что-то я не увидел когда академия появилась,
//     покрывающая расходы на поездки»). It fires at `week % 52 === 0`, the advance hard-stops at
//     `% 52 === 49`, and the shell's step is FOUR – so 49 + 4 = 53 made it the one week of the
//     season a player stepping by four could never land on. It passed in silence for a whole career.
//
// Both were fixed by adding a STOP. A span control that only stopped would re-open them from the
// other end: the stop is about the week the span ENDED on, and the weeks it went through would have
// no surface at all. So the span reports every week it spent, and it reports every row those weeks
// wrote – see `spanDigest`, which filters on the week window and on nothing else, deliberately.
//
// ⚠ IT IS A DIALOG AND NOT A TOAST, AND THAT IS A SIZE DECISION RATHER THAN AN IMPORTANCE ONE. The
// stop toast is one sentence on a 520px strip; four weeks of a real career is a dozen rows. On the
// shared `.dialog-card` the content is capped and scrolls (round-20 #3's fix lives on that rule), so
// the way out cannot be pushed off a phone however long a career's bills get –
// `tests/component/r2-13-span-report.test.ts` measures exactly that, and mutates the cap off to
// prove the measurement can fail.
//
// ⚠ NOTHING IS COMPUTED HERE. The digest is the engine's (`engine/world/multiWeek.ts`), so the same
// function answers "what happened in between" for the card and for the test that asserts nothing
// was dropped. A component that grouped rows itself would be a second opinion about a span.
import { computed, useTemplateRef } from 'vue'
import type { SpanWeek } from '../engine/world/multiWeek'
import { useDialogFocus } from '../composables/dialogFocus'
import { weekLabel } from '../shared/dates'
import { formatCentsSigned } from '../shared/money'

const props = defineProps<{
  /** the week the player pressed on – EXCLUSIVE, so the heading names the first week that happened */
  from: number
  /** the week the advance landed on – inclusive */
  to: number
  /** every row those weeks wrote, grouped, oldest first (`spanDigest`) */
  digest: SpanWeek[]
}>()

const emit = defineEmits<{ close: [] }>()

const titleId = `week-span-title-${++spanSeq}`

/** "W12 '31 – W15 '31". Short dash, the app's own week label, both ends named: a span whose heading
 *  said only "4 weeks" would be the one fact the player can already see on the button. */
const heading = computed(() =>
  props.to > props.from + 1 ? `${weekLabel(props.from + 1)} – ${weekLabel(props.to)}` : weekLabel(props.to),
)

/** How many weeks actually happened. It is NOT always the span: the engine stops early on every
 *  reason it has, so a press for four that met a fresh injury in the second week says two. Saying
 *  four there would be the button lying about what it spent. */
const weeksSpent = computed(() => Math.max(0, props.to - props.from))

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, () => emit('close'))
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div ref="card" class="dialog-card week-span" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
      <h2 :id="titleId" class="week-span-title">{{ heading }}</h2>
      <!-- The sentence names the number of weeks the press actually bought, which is the one thing
           the card knows that the rows do not say. -->
      <p class="week-span-lead">{{ weeksSpent }} {{ weeksSpent === 1 ? 'week' : 'weeks' }} passed. Everything they raised is below.</p>
      <!-- R10-16's doctrine, in the one state that can produce it: a card with nothing on it is the
           empty-popup bug, so the empty case says what it means instead of rendering a blank. -->
      <p v-if="digest.length === 0" class="week-span-empty">Nothing was raised in that time.</p>
      <section v-for="w in digest" :key="w.week" class="week-span-week">
        <h3 class="week-span-week-head">{{ weekLabel(w.week) }}</h3>
        <ul class="week-span-rows">
          <li v-for="row in w.rows" :key="row.id" class="week-span-row">
            <span class="week-span-text">{{ row.text }}</span>
            <span
              v-if="row.amountCents !== undefined"
              class="week-span-amount num"
              :class="row.amountCents < 0 ? 'negative' : 'positive'"
              >{{ formatCentsSigned(row.amountCents) }}</span
            >
          </li>
        </ul>
      </section>
      <div class="dialog-actions">
        <button class="primary" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
