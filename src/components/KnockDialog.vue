<script setup lang="ts">
// W4 – THE ORDINARY WEEK'S ONE DECISION.
//
// The owner, 30.07, asking a second time: «Чтобы тренировочные недели не просто скипались нужно
// всё-таки видимо пришло время сделать какое-то пошаговый события Что происходит на этих неделях
// когда нет матчей а только тренировки». The first slice gave the training week a voice (a note on
// the Weekly Story); this is the half it deferred – «any choice with a cost».
//
// She came off court sore. Rest it and lose the week's work, or send her back out and take the odds.
// The design, the numbers and the anti-farming argument all live in src/engine/knock.ts.
//
// ⚠ IT IS THE ONE DIALOG IN THE APP WITH NO WAY OUT THAT IS NOT AN ANSWER. Every other popup has a
// Continue (or a dismiss, or an overlay click) because every other popup is REPORTING something that
// already happened. This one is asking, and `advanceWeeks` refuses to tick a single week until the
// answer is in – so a Cancel would strand the career, and `@click.self` is deliberately NOT wired.
// That is not a trap: both buttons are valid answers to the question, and neither is a wrong move.
//
// THE COPY COMES OFF THE SNAPSHOT, NOT OUT OF THIS FILE. `knockPrompt` carries the parent's line, the
// coach's read and the two cost sentences, all assembled in the engine (buildKnockPrompt) where they
// can be tested – the same rule KidScreen keeps. The template's own words are the two verbs and the
// two labels, and nothing else.
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { playSfx } from '../audio/sfx'
import { weekLabel } from '../shared/dates'

const game = useGameStore()
const prompt = computed(() => game.snapshot?.knockPrompt ?? null)
const week = computed(() => game.snapshot?.week ?? 0)

// Guards a double-tap while the worker round-trips. `decideKnock` throws on an already-answered
// knock, so without this a fast second press would surface an error toast for a decision that
// actually succeeded.
const sending = ref(false)
async function decide(choice: 'rest' | 'push'): Promise<void> {
  if (sending.value) return
  sending.value = true
  try {
    await game.decideKnock(choice)
  } finally {
    sending.value = false
  }
}

// The same alert the injury stop uses. Deliberately the SAME sound and not a new one: to the parent
// this is the same kind of moment, one notch quieter, and a bespoke sting would oversell it.
onMounted(() => playSfx('ooh'))

// D1 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD. `useDialogFocus`'s header carries
// the argument and the honest limit; the one thing decided HERE is that Escape is passed no handler,
// because this dialog has no way out that is not an answer (see the ⚠ note at the top of this file).
// Escape falls through to the browser, which does nothing with it, and the card keeps the focus.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <div v-if="prompt" class="dialog-overlay">
    <!-- role/aria-modal on the CARD and not on the scrim: the backdrop is not part of the dialog,
         it is what the dialog is over. `tabindex="-1"` is the focus trap's landing place for the
         case where a dialog has no controls; this one always has two. -->
    <div
      ref="card"
      class="dialog-card season-summary injury-stop knock-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="knock-dialog-kicker knock-dialog-title"
      tabindex="-1"
    >
      <!-- BOTH LINES ARE THE NAME, in the order they are read on screen: the kicker says which week
           and whether it has happened before, the title says which part of her. Either one alone
           would name the dialog worse than the card names itself to somebody looking at it. -->
      <p id="knock-dialog-kicker" class="season-summary-kicker">
        {{ prompt.repeat ? 'The same knock again' : 'A knock' }} – {{ weekLabel(week) }}
      </p>
      <h2 id="knock-dialog-title" class="season-summary-title">Her {{ prompt.part }}.</h2>
      <p class="knock-line">{{ prompt.line }}</p>
      <p class="hint knock-read">{{ prompt.read }}</p>

      <!-- THE TWO COSTS, SIDE BY SIDE AND SPELLED OUT. This is the legibility requirement: the
           player has to be able to see what he traded, in the currency he traded it in, before he
           taps. The sentences are the engine's (`restCost` / `pushCost`) and vary with the repeat. -->
      <div class="knock-choices">
        <button class="knock-choice" :disabled="sending" @click="decide('rest')">
          <span class="knock-choice-verb">Rest it</span>
          <span class="knock-choice-cost">{{ prompt.restCost }}</span>
        </button>
        <button class="knock-choice knock-choice--push" :disabled="sending" @click="decide('push')">
          <span class="knock-choice-verb">Train through it</span>
          <span class="knock-choice-cost">{{ prompt.pushCost }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
