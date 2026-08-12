<script setup lang="ts">
// THE NATURAL END'S OFFER (career-contract-v1.md §5.3) – asked in the off-season, blocking until
// answered, and offered again next year if she says no.
//
// ⚠ THE FLOOR AT 38 IS NOT A RETIREMENT RULE AND THIS CARD IS WHERE THE DIFFERENCE IS CARRIED. The
// owner asked the right clarifying question about it, so the answer has to be legible on screen: 38
// is the age at which the game STOPS ASKING. From 29 the offer comes every off-season and she may
// always refuse; at 38 the LAST offer is made and taken. So the final card has one button, and the
// copy on it says the question ran out - not that a mechanic retired her.
//
// ⚠ AND THE PLATEAU IS THE SAME OFFER, ASKED EARLY. «Не могу выйти в топ – уйду» is not a sixth
// mechanism (§5.2): it is a reading that puts this card in front of her before 29, and the reason
// is printed on it so the epilogue's own line about which of the two it was is already true here.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'

const game = useGameStore()
const offer = computed(() => game.snapshot?.retirementOffer ?? null)
const age = computed(() => game.snapshot?.ageYears ?? 29)

const stage = computed(() => portraitStage(age.value))
const artUrl = computed(() => portraitUrl(stage.value, 'serious'))
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-serious`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

async function answer(retire: boolean): Promise<void> {
  await game.answerRetirement(retire)
}
</script>

<template>
  <div v-if="offer" class="dialog-overlay">
    <div class="dialog-card retire-card">
      <img class="retire-art" :src="artUrl" :style="artStyle" alt="" />
      <p class="retire-kicker">Off-season – she is {{ age }}</p>

      <template v-if="offer.final">
        <h2 class="retire-title">Nobody is going to ask her again.</h2>
        <p class="retire-lede">
          She has been answering this question every winter for years. This is the last winter it
          gets asked, and she has already said what she thinks.
        </p>
      </template>
      <template v-else-if="offer.reason === 'plateau'">
        <h2 class="retire-title">She said it in the car.</h2>
        <!-- ⚠ RE-WORDED 12.08. This used to end «– her words, not the game's», an aside meant to say
             "this is HER wish, nothing is being forced" – but it names THE GAME, which is a wall no
             line of copy here is allowed to break, and the owner read it as noise («правда зачем-то
             там написано… вот это я не очень понял»). Same meaning, said in-fiction. -->
        <p class="retire-lede">
          Three seasons and the table has not moved. If she cannot reach the top, she would rather
          go now – that is how she put it. She will keep playing if you want her to.
        </p>
      </template>
      <template v-else>
        <h2 class="retire-title">Is there another year in this?</h2>
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
