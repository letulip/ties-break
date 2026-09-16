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
// ⭐⭐⭐ ROUND 42 #8 – THE TWO BRANCHES SELECT, AND A PROCEED RECORDS. They used to commit on the
// first tap, which is the same single-tap family the life beat was in – and the owner's six
// unremembered `push` choices at weeks 210–350 are almost certainly fast taps on this card (his own
// item 27: «мне казалось я нигде не пушил»). His ruling: «Надо сделать как на прологе "выбор +
// proceed"» and «вот не надо нам там фокус». So the branches are radios now (round 40's selecting
// idiom, the ball and all), the Proceed under them is the one control that reaches `decideKnock`,
// and focus at open lands on the CARD, never on a branch – a held Enter arriving with the dialog
// presses nothing. Nothing about the question changed: both branches are still valid answers, and
// the dialog still has no way out that is not one.
//
// THE COPY COMES OFF THE SNAPSHOT, NOT OUT OF THIS FILE. `knockPrompt` carries the parent's line, the
// coach's read and the two cost sentences, all assembled in the engine (buildKnockPrompt) where they
// can be tested – the same rule KidScreen keeps. The template's own words are the two verbs, the two
// labels and the Proceed – the confirm word is the prologue's own shipped vocabulary
// (`WALK_COPY.proceed`, round 41 #9), reused rather than coined (invariant 4; DRAFT recorded in
// docs/rounds/round-42.md #8).
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

/** ⭐ ROUND 42 #8 – WHICH BRANCH IS SELECTED, and it is the radio's `aria-checked`. Null on arrival
 *  (nothing is marked before he marks it – the card may not recommend), and it STAYS through a
 *  refused send: it is what he selected, not a claim the world took it. */
const chosen = ref<'rest' | 'push' | null>(null)

/** The first tap: mark the branch. Recording is `confirm()`'s alone – round 42 #8's whole point. */
function select(choice: 'rest' | 'push'): void {
  if (sending.value) return
  chosen.value = choice
}

/** The second tap: the Proceed, and the ONE control that reaches the engine. */
async function confirm(): Promise<void> {
  const choice = chosen.value
  if (choice === null || sending.value) return
  sending.value = true
  try {
    await game.decideKnock(choice)
  } finally {
    sending.value = false
  }
}

/** ⭐ THE RADIO GROUP'S OWN KEYS – `LifeBeatDialog`'s handler and the same documented variation:
 *  the arrows move FOCUS and do not select, because selecting on focus would mark a branch of her
 *  body's question with an arrow key. Space and Enter are the button's own. */
function onGroupKey(event: KeyboardEvent): void {
  const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
  if (!forward && !back) return
  const group = event.currentTarget as HTMLElement
  const items = [...group.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
  const at = items.indexOf(document.activeElement as HTMLButtonElement)
  if (at < 0) return
  event.preventDefault()
  items[(at + (forward ? 1 : items.length - 1)) % items.length]?.focus()
}

// The same alert the injury stop uses. Deliberately the SAME sound and not a new one: to the parent
// this is the same kind of moment, one notch quieter, and a bespoke sting would oversell it.
onMounted(() => playSfx('ooh'))

// D1 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD. `useDialogFocus`'s header carries
// the argument and the honest limit; the one thing decided HERE is that Escape is passed no handler,
// because this dialog has no way out that is not an answer (see the ⚠ note at the top of this file).
// Escape falls through to the browser, which does nothing with it, and the card keeps the focus.
// ⭐⭐ ROUND 42 #8 / #17(c) – focus OPENS on the card, never on a branch («вот не надо нам там
// фокус»), and on close it is NOT handed back to the week button: this dialog is raised over the
// Proceed press, and returning there re-fires a held Enter – one of #17's three measured
// double-advance mechanisms. Both arguments live on `DialogFocusOptions` in dialogFocus.ts.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, undefined, { focusOn: 'card', restore: false })
</script>

<template>
  <div v-if="prompt" class="dialog-overlay">
    <!-- role/aria-modal on the CARD and not on the scrim: the backdrop is not part of the dialog,
         it is what the dialog is over. `tabindex="-1"` is the focus trap's landing place - and since
         round 42 #8 it is also where focus OPENS, so an arriving keypress presses nothing. -->
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
           taps. The sentences are the engine's (`restCost` / `pushCost`) and vary with the repeat.
           ⭐⭐⭐ ROUND 42 #8 – a real radio group now, named by the part of her it is about: the
           first tap marks a branch (the ball says so on screen), and only the Proceed below records.
           No positional selector and no marked default anywhere - the card may not recommend. -->
      <div class="knock-choices" role="radiogroup" aria-labelledby="knock-dialog-title" @keydown="onGroupKey">
        <button
          class="knock-choice"
          type="button"
          role="radio"
          :aria-checked="chosen === 'rest'"
          :disabled="sending"
          @click="select('rest')"
        >
          <span class="knock-mark" aria-hidden="true"></span>
          <span class="knock-choice-text">
            <span class="knock-choice-verb">Rest it</span>
            <span class="knock-choice-cost">{{ prompt.restCost }}</span>
          </span>
        </button>
        <button
          class="knock-choice knock-choice--push"
          type="button"
          role="radio"
          :aria-checked="chosen === 'push'"
          :disabled="sending"
          @click="select('push')"
        >
          <span class="knock-mark" aria-hidden="true"></span>
          <span class="knock-choice-text">
            <span class="knock-choice-verb">Train through it</span>
            <span class="knock-choice-cost">{{ prompt.pushCost }}</span>
          </span>
        </button>
      </div>

      <!-- ⭐⭐⭐ ROUND 42 #8 – THE PROCEED. Appears when a branch is selected (never before), records
           it through `decideKnock`, and is the card's LAST element while rendered - which is what
           the phone-fit measurement reads the way out off. The word is the prologue's shipped
           confirm vocabulary (round 41 #9), not a coinage. -->
      <button v-if="chosen !== null" class="knock-proceed" type="button" :disabled="sending" @click="confirm()">
        Proceed
      </button>
    </div>
  </div>
</template>
