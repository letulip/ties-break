<script setup lang="ts">
// ⭐⭐ ROUND 29 #3 – THE SHOOT LANDED ON A TOURNAMENT WEEK, AND THE PLAYER DECIDES.
//
// The owner, on the exemption round 28 shipped: «но она же осталась на турнирной неделе, значит надо
// понять как с ней быть. И варианты пользователю предложить.» He was offered a fork between moving
// the shoot and paying for it and ruled that the choice belongs to the PARENT, naming all the arms
// himself. His words are in docs/rounds/round-29.md, where they may be quoted in his own language.
//
// ⚠ IT IS A DIALOG WITH NO WAY OUT THAT IS NOT AN ANSWER – KnockDialog's own rule, and here it is
// forced twice over. `advanceWeeks` refuses to tick while the question stands, so a Cancel would
// strand the career; and two of the four arms stop being POSSIBLE once the week begins
// (`cancelEntry` refuses on the week itself, and a shoot cannot be moved out of a week being lived),
// so a dismiss would silently pick one of the other two for him. `@click.self` is deliberately not
// wired and Escape is passed no handler.
//
// ⚠ EVERY NUMBER IS THE ENGINE'S. `shootClash` carries the week, the brand, the rung, the fee, the
// week a move would land on and what each arm costs (`buildShootClashPrompt`); this file adds the
// four verbs and nothing else. Money through `formatCents`, which takes CENTS.
//
// ⚠ THE MOVE ARM IS CONDITIONAL, and that is R10-16's doctrine rather than tidiness: when the term
// has no week left to move to, `moveToWeek` is null and the option is not drawn at all. A button
// that cannot act is the bug; three answers are still a decision.
import { computed, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import StoreError from './ui/StoreError.vue'
import { formatCents } from '../shared/money'
import type { ShootClashChoice } from '../shared/protocol'

const game = useGameStore()
const prompt = computed(() => game.snapshot?.shootClash ?? null)

// Guards a double-tap while the worker round-trips: `answerShootClash` throws on a collision that is
// no longer open, so without this a fast second press surfaces an error toast for a decision that
// actually succeeded. KnockDialog's own guard, same reason.
const sending = ref(false)
async function decide(choice: ShootClashChoice): Promise<void> {
  if (sending.value) return
  sending.value = true
  try {
    await game.answerShootClash(choice)
  } finally {
    sending.value = false
  }
}

/** What pulling out of the tournament costs, in the engine's own terms – the fee is handed back
 *  while the list is open and forfeited once it has closed, and the tour's commitment rule adds its
 *  own price where the event binds her. */
const withdrawCost = computed(() => {
  const p = prompt.value
  if (!p) return ''
  const fee = p.entryRefunded
    ? `the ${formatCents(p.entryFeeCents)} entry comes back`
    : `the ${formatCents(p.entryFeeCents)} entry is forfeited`
  return p.mandatoryPenalty ? `${fee}, and a late withdrawal counts against her.` : `${fee}.`
})

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <div v-if="prompt" class="dialog-overlay">
    <div
      ref="card"
      class="dialog-card season-summary injury-stop knock-dialog shoot-clash-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shoot-clash-kicker shoot-clash-title"
      tabindex="-1"
    >
      <p id="shoot-clash-kicker" class="season-summary-kicker">Two things at once – {{ prompt.weekLabel }}</p>
      <h2 id="shoot-clash-title" class="season-summary-title">
        {{ prompt.brand }} want her that week, and so does the {{ prompt.eventLabel }}.
      </h2>
      <p class="hint knock-read">Something has to give. All four answers are hers to make.</p>

      <!-- ⚠⚠ W2 (26.09) – THE STORE'S REFUSAL, ABOVE THE FOUR ANSWERS – ForkDialog's own arrangement
           and its reason. There is no dismiss on this card and two of its four arms stop being
           possible once the week begins (the file header), so a refused answer used to leave the
           parent looking at four controls that were all answers to a question just refused, with
           nothing said. Reached without any engine bug by a second tab's SAVE_CONFLICT, whose
           sentence names the way out, and by B-02's refused mutation.
           ⚠ ABOVE `.knock-choices`: `measureDialog` reads the last answer's box off the card's bottom
           edge, so the answers stay last in the flow. This is the TALLEST blocking card in the app
           (four two-line answers), so it is the one the phone verdict matters most on – measured with
           the line up at 375x667 and 320x568 in
           tests/component/principles-w2-blocking-card-refusal.test.ts.
           ⚠ NO NEW WORDING: `StoreError` renders whatever the store already wrote (invariant 4). -->
      <StoreError />

      <div class="knock-choices">
        <button class="knock-choice" :disabled="sending" @click="decide('withdraw')">
          <span class="knock-choice-verb">Pull out of the {{ prompt.eventLabel }}</span>
          <span class="knock-choice-cost">She shoots, and {{ withdrawCost }}</span>
        </button>
        <button
          v-if="prompt.moveToWeek !== null"
          class="knock-choice"
          :disabled="sending"
          @click="decide('move-shoot')"
        >
          <span class="knock-choice-verb">Move the shoot to {{ prompt.moveToLabel }}</span>
          <span class="knock-choice-cost">She plays as planned and the campaign waits – nothing is paid for it.</span>
        </button>
        <button class="knock-choice" :disabled="sending" @click="decide('cancel-shoot')">
          <span class="knock-choice-verb">Cancel the shoot</span>
          <span class="knock-choice-cost"
            >She plays as planned, and {{ prompt.brand }} take back {{ formatCents(prompt.cancelShootCents) }} of the
            campaign fee.</span
          >
        </button>
        <button class="knock-choice knock-choice--push" :disabled="sending" @click="decide('play-both')">
          <span class="knock-choice-verb">Do both</span>
          <span class="knock-choice-cost"
            >Lights, flights and a draw in one week – {{ prompt.conditionCost }} condition off the week.</span
          >
        </button>
      </div>
    </div>
  </div>
</template>
