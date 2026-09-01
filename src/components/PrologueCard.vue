<script setup lang="ts">
// ONE SCREEN, AND IT DRAWS WHICHEVER ROW IT IS GIVEN – phase 2 of
// docs/specs/childhood-prologue-build-2026-09.md §7: «Cards are a table, not nine components.»
//
// ⚠⚠ IT HOLDS NO COPY. Every player-facing sentence comes from `src/prologue/cards.ts` through a
// `{{ }}` binding, and `tests/prologue-cards.test.ts` asserts that this template contains no
// sentence of its own. That is what makes replacing the owner's copy a table edit rather than a
// refactor – and it matters here more than usual, because HE HAS NOT SEEN ONE WORD OF THE NINE
// CARDS. §8: «⭐ The copy below is DRAFTED, not decided … It ships only with his word.»
//
// ⚠ WHY IT IS BUILT ON `.dialog-overlay` / `.dialog-card` RATHER THAN AS ITS OWN FULL-SCREEN BOX.
// The shared card is where round-20 #3's fix lives – `max-height: 100%; overflow-y: auto` on the
// panel, argued at length in src/style.css – and this surface is exactly the shape that produced
// that defect: a BLOCKING card with prose above the way out, which grows by one honest sentence at a
// time until Continue is off the bottom of a phone. Sitting on the shared box means the bound is
// structural from the first commit and `tests/component/fits.ts` measures the real cascade rather
// than a private copy of it. The nine cards are also the FIRST thing a new player ever sees, so a
// career that stops here stops before it starts.
//
// ⚠ AND THE CONTROLS ARE LAST IN THE FLOW, deliberately: `measureDialog` reads the dismiss control's
// box off the card's own bottom edge once the card is scrolled to its end, which is only the truth
// when nothing follows it.
//
// THE ORDER ON THE CARD, and it is the argument of §"what a card shows about her" in cards.ts: the
// scene, then what you can SEE of her (whether she is enjoying it, and what the person teaching her
// makes of it), then the answers. No number about her appears anywhere on this screen at any age.
// The formed rose is the HANDOVER's payload (§5) and phase 4's to spend.
import { computed, useTemplateRef } from 'vue'
import { useDialogFocus } from '../composables/dialogFocus'
import type { PrologueCard, PrologueOption } from '../prologue/cards'
import type { Warmth } from '../prologue/run'

const props = defineProps<{
  card: PrologueCard
  /** which arm of `her` / `coach` this run has earned – see `warmthAt` */
  warmth: Warmth
  /** the twelfth's derived reasons, empty on every other card */
  reasons?: readonly string[]
  busy?: boolean
}>()

const emit = defineEmits<{
  /** the id of the option or origin taken, or null for a card with nothing to decide */
  (e: 'answer', id: string | null): void
}>()

/** ⭐ ONE LIST, THREE KINDS OF CARD. An origin card, a decision card and a quiet card all render the
 *  same column of controls, so nothing below branches on which card it is drawing and a card that
 *  changes kind changes no markup. The quiet card's single control is synthesised from
 *  `continueLabel`, which is why it has no note. */
const controls = computed<{ id: string | null; label: string; note: string }[]>(() => {
  const list: readonly PrologueOption[] | undefined = props.card.origins ?? props.card.options
  if (list) return list.map((o) => ({ id: o.id, label: o.label, note: o.note }))
  return [{ id: null, label: props.card.continueLabel, note: '' }]
})

const her = computed(() => props.card.her[props.warmth])
const coach = computed(() => props.card.coach[props.warmth])

// ⚠ NAMED `cardEl` AND NOT `card`: `<script setup>` exposes both the props and the locals to the
// template, and a local called `card` SHADOWS the `card` prop – the whole screen renders off `null`
// and every mounted test dies on `Cannot read properties of null`. Cost one run to find.
const cardEl = useTemplateRef<HTMLElement>('cardEl')
// It is a modal and it says so. Escape is passed no handler: there is no way out of a year of her
// childhood that is not an answer, which is the same reason KnockDialog and BirthdayDialog pass none.
useDialogFocus(cardEl)
</script>

<template>
  <div class="dialog-overlay">
    <div
      ref="cardEl"
      class="dialog-card prologue-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prologue-kicker prologue-title"
      tabindex="-1"
    >
      <p id="prologue-kicker" class="prologue-kicker">{{ card.kicker }}</p>
      <h2 id="prologue-title" class="prologue-title">{{ card.title }}</h2>
      <p class="prologue-lede">{{ card.lede }}</p>

      <!-- WHAT YOU CAN SEE OF HER, AND IT IS NEVER A NUMBER. Two sentences: whether she is enjoying
           it, and what the person teaching her makes of it. The full argument is in cards.ts. -->
      <div class="prologue-read">
        <p class="prologue-read-line">{{ her }}</p>
        <p class="prologue-read-line prologue-read-coach">{{ coach }}</p>
      </div>

      <!-- WHY THE TWELFTH SAYS WHAT IT READ. Present only on the fork, where a card that simply
           arrived would read as a dice roll - and there are no dice in it. -->
      <ul v-if="reasons && reasons.length" class="prologue-reasons">
        <li v-for="reason in reasons" :key="reason">{{ reason }}</li>
      </ul>

      <!-- THE ANSWERS, LAST IN THE FLOW. One rule for every row: nothing here marks one of them as
           the one to take, on a card whose whole subject is that the choice is yours. -->
      <div class="prologue-answers">
        <button
          v-for="control in controls"
          :key="control.id ?? 'go-on'"
          class="prologue-answer"
          type="button"
          :disabled="busy"
          @click="emit('answer', control.id)"
        >
          <span class="prologue-answer-label">{{ control.label }}</span>
          <span v-if="control.note" class="prologue-answer-note">{{ control.note }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The scrim, the panel and the height bound are `.dialog-overlay` / `.dialog-card` and are not
   restated here - see the script header for why this surface sits on the shared box. What is local
   is the width, the three text blocks and the column of answers.

   ⚠ EVERY COLOUR IS A DECLARED APP TOKEN WITH NO FALLBACK. Round-17 #3 is the reason and
   BirthdayDialog.vue carries the full account: `var(--card, #fff)` and `var(--ink, #1c1c1e)` shipped
   four buttons of near-white text on white, at a measured 1.09:1, on a dialog the player could not
   dismiss. A fallback is honest only where the token is optional; for a colour that has to be
   readable it is a second design nobody reviews. */
.prologue-card {
  max-width: 420px;
  text-align: left;
}

.prologue-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.prologue-title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.prologue-lede {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}

/* Set apart from the lede by a rail rather than by a heading: it is a different KIND of sentence -
   the scene is what happened, these two are what you can see of her - and a label above it («How she
   is doing») would be the screen telling the player how to read two sentences it could simply
   show. */
.prologue-read {
  margin: 0 0 14px;
  padding: 0 0 0 10px;
  border-left: 3px solid var(--accent-soft);
}

.prologue-read-line {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-2);
}

.prologue-read-coach {
  margin-top: 4px;
  color: var(--ink-soft);
}

.prologue-reasons {
  margin: 0 0 14px;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.prologue-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ⚠ ONE RULE FOR EVERY ROW, AND NO POSITIONAL SELECTOR ANYWHERE. `:first-child` or `:nth-child`
   here would be a mark by another name - the screen pointing at the answer it prefers on a card
   whose entire subject is that the decision is the parent's. Same reasoning, and the same tokens, as
   `.birthday-choice`: the two are the same object and should not drift apart. */
.prologue-answer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  cursor: pointer;
}

.prologue-answer:hover:not(:disabled) {
  background: var(--accent-fill);
}

.prologue-answer:disabled {
  opacity: 0.55;
  cursor: default;
}

.prologue-answer-label {
  font-size: 15px;
  line-height: 1.3;
  color: var(--text);
}

.prologue-answer-note {
  font-size: 12px;
  line-height: 1.35;
  color: var(--muted);
}
</style>
