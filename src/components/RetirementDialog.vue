<script setup lang="ts">
// THE NATURAL END'S OFFER (career-contract-v1.md §5.3) – asked in the off-season, blocking until
// answered, and offered again next year if she says no.
//
// ⚠ THE LAST OFFER IS NOT A RETIREMENT RULE AND THIS CARD IS WHERE THE DIFFERENCE IS CARRIED. The
// owner asked the right clarifying question about it, so the answer has to be legible on screen:
// from 29 the offer comes every off-season and she may always refuse; on the LAST one the offer is
// made and taken. So the final card has one button, and the copy on it says the question ran out -
// not that a mechanic retired her.
//
// ⚠⚠ AND IT USED TO SAY "THE FLOOR AT 38", WHICH IS NOW WRONG IN THE ONE WAY A COMMENT MUST NOT BE:
// it named a rule that no longer exists. `ENDINGS.stopAskingAgeYears` is deleted (the long goodbye,
// docs/specs/the-long-goodbye-2026-08.md §3a) and the last offer arrives when her physical falls
// below a share of her own peak - age 41 on a body kept well, earlier on one that never got there.
// ⭐ NOT ONE LINE OF THE TEMPLATE MOVED FOR THIS, and that is a fact about the card rather than a
// shortcut: the kicker already prints `snapshot.ageYears`, and the three headings already branch on
// `offer.final`, so a card written against a birthday renders a body-driven offer correctly with no
// edit at all. What the card still does NOT do is speak in her voice - that is step 4 of the spec,
// and it is the step that rewrites the copy below.
//
// ⚠ AND THE PLATEAU IS THE SAME OFFER, ASKED EARLY. «Не могу выйти в топ – уйду» is not a sixth
// mechanism (§5.2): it is a reading that puts this card in front of her before 29, and the reason
// is printed on it so the epilogue's own line about which of the two it was is already true here.
//
// ⭐ ROUND-19 #1 – AND THE PLATEAU CARD NAMES THE TABLE IT IS TALKING ABOUT. It read «Three seasons
// and the table has not moved», which was true of a table she had left: the rule was reading the
// junior alias while the owner watched her climb to #106 in the world. The rule now asks its question
// of the ladder she is currently on, so the sentence has to say which one, or it is the round-17 #16
// defect again («Season 2035 closed at #79» over no table at all).
//
// `activeLadderOfSnapshot` is the same one answer the fork card was re-aimed at in round-17 #6, and
// the week is safe to read it on: an open offer BLOCKS the world, so the table she is on when the
// card is drawn is the table the offer was raised about. Lower-cased into her sentence – she says
// "the professional table", not "Professional".
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { activeLadderOfSnapshot } from '../shared/protocol'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'

const game = useGameStore()
const offer = computed(() => game.snapshot?.retirementOffer ?? null)
const age = computed(() => game.snapshot?.ageYears ?? 29)
const tableName = computed(() => activeLadderOfSnapshot(game.snapshot).label.toLowerCase())

const stage = computed(() => portraitStage(age.value))
const artUrl = computed(() => portraitUrl(stage.value, 'serious'))
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-serious`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

async function answer(retire: boolean): Promise<void> {
  await game.answerRetirement(retire)
}

// ⭐⭐ R2-07 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD (composables/dialogFocus.ts
// carries the argument and the honest limit).
//
// ⚠⚠ ESCAPE IS PASSED NO HANDLER, AND THE FINAL CARD IS WHY IT CANNOT BE ANYTHING ELSE. From 29 the
// card draws two answers and the offer BLOCKS the world until one of them is in, so a dismissal
// would strand the career; on the last one it draws exactly ONE, because the question has run out, and a key
// that closed this card would either end a career on a stray press or hand back a card with no
// refusal left on it. Neither is a dismissal, so there is none.
//
// ⚠ AND "One more year" IS NOT THE ESCAPE EITHER, tempting as it looks. It is an ANSWER – the engine
// records it (`oneMoreYearCount` is on the ending screen) and the offer comes back next winter – so
// wiring it to Escape would let the keyboard file a decision the player never made, on the card
// whose whole subject is that the decision is hers. It is also absent on the final card, which is
// exactly where a uniform Escape policy would have shipped a dead key.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <div v-if="offer" class="dialog-overlay">
    <!-- ⭐⭐ R2-07 – role/aria-modal on the CARD and not on the scrim: the backdrop is not part of
         the dialog, it is what the dialog is over. `tabindex="-1"` is the trap's landing place for
         the frame in which `game.busy` has disabled the answers. NO handler on the scrim, for the
         same reason there is no Escape: every way out of this card is an answer. -->
    <div
      ref="card"
      class="dialog-card retire-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retire-dialog-kicker retire-dialog-title"
      tabindex="-1"
    >
      <img class="retire-art" :src="artUrl" :style="artStyle" alt="" />
      <!-- BOTH LINES ARE THE NAME, in the order they are read: when it is being asked and how old
           she is, then which of the three questions this winter is. ⚠ THE THREE HEADINGS SHARE ONE
           id AND THAT IS SAFE – they are `v-if`/`v-else-if`/`v-else`, so exactly one is ever in the
           document, and a per-branch id would make the name depend on which question was asked. -->
      <p id="retire-dialog-kicker" class="retire-kicker">Off-season – she is {{ age }}</p>

      <template v-if="offer.final">
        <h2 id="retire-dialog-title" class="retire-title">Nobody is going to ask her again.</h2>
        <p class="retire-lede">
          She has been answering this question every winter for years. This is the last winter it
          gets asked, and she has already said what she thinks.
        </p>
      </template>
      <template v-else-if="offer.reason === 'plateau'">
        <h2 id="retire-dialog-title" class="retire-title">She said it in the car.</h2>
        <!-- RE-WORDED 12.08. This used to end "- her words, not the game's", an aside meant to say
             "this is HER wish, nothing is being forced" - but it names THE GAME, which is a wall no
             line of copy here is allowed to break, and the owner read it as noise (round-17, his
             report of 12.08). Same meaning, said in-fiction.
             ROUND-19 #1: ...and it names the table now - see the note at the top of this file. -->
        <p class="retire-lede">
          Three seasons on the {{ tableName }} table and it has not moved. If she cannot reach the
          top, she would rather go now – that is how she put it. She will keep playing if you want
          her to.
        </p>
      </template>
      <template v-else>
        <h2 id="retire-dialog-title" class="retire-title">Is there another year in this?</h2>
        <p class="retire-lede">
          The off-season question, the way it gets asked from twenty-nine onward. There is no wrong
          answer and it will be asked again next winter.
        </p>
      </template>

      <div class="retire-answers">
        <button class="retire-answer" type="button" :disabled="game.busy" @click="answer(true)">
          <strong>That is enough</strong>
          <span>She stops here, on her own terms.</span>
        </button>
        <button
          v-if="!offer.final"
          class="retire-answer"
          type="button"
          :disabled="game.busy"
          @click="answer(false)"
        >
          <strong>One more year</strong>
          <span>The same answer she gave last winter.</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retire-card {
  max-width: 420px;
  text-align: left;
}

.retire-art {
  display: block;
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: var(--radius-panel);
  margin-bottom: 14px;
}

.retire-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.retire-title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.retire-lede {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.retire-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.retire-answer {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  padding: 12px 14px;
  border: var(--stroke-hair) solid var(--ink-dim);
  border-radius: var(--radius-control);
  background: transparent;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.retire-answer:disabled {
  opacity: 0.5;
  cursor: default;
}

.retire-answer strong {
  font-size: 15px;
  font-weight: 600;
}

.retire-answer span {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-soft);
}
</style>
