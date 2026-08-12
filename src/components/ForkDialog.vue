<script setup lang="ts">
// THE FORK AT NINETEEN – the most expensive click in the game (adult-tour-and-endings.md's own
// closing risk note), and the second act beginning.
//
// Three answers, and TWO OF THEM END THE CAREER. That is why it BLOCKS rather than toasts: the
// engine refuses to tick until it is answered, exactly the contract an undecided knock has, and
// there is deliberately no way out of this card that is not a choice.
//
// ⚠ IT MAY NOT RECOMMEND. Ruling 4, 30.07: «"stop" CAN be the right answer at 19... a real ending
// without shame». A game about honest economics whose fork quietly styles one button as the correct
// one lies exactly where it promised not to. So the three answers get the same weight, the card
// puts the numbers on the table and says nothing about what they mean, and there is no default.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'
import { formatCents } from '../shared/money'
import { activeLadderOfSnapshot, type ForkAnswer } from '../shared/protocol'

const game = useGameStore()
const fork = computed(() => game.snapshot?.fork ?? null)
const snap = computed(() => game.snapshot ?? null)

// ⭐ ROUND-17 #6/#16 – A RANK PRINTED WITHOUT ITS TABLE IS NOT A FACT, and this card was the worst
// place in the game to make that mistake.
//
// It read `snap.kidRank`, which is an ALIAS of the INTERNATIONAL (junior) table - and this card is
// the one that opens with "The junior ladder is behind her." So the most expensive click in the game
// was being decided on a number from the table that had just closed, under a label that named no
// table at all. `activeLadderOfSnapshot` is the repo's own answer to "which rank is her rank" and it
// exists, in its own words, "BECAUSE `snapshot.kidRank` IS THE WRONG ANSWER TO AN OBVIOUS QUESTION";
// this card had simply never been converted.
//
// ⚠ AND `unranked` WAS UNREACHABLE, which is the second half of the same defect. `kidRank` is never
// null - `recomputeKidRank` falls back to `tableSize(...)`, the tie floor - so the ternary always
// took its first branch and a girl with no counting result printed her floor position as if it were
// a standing. `LadderView.rank` IS nullable and means it, so the honest branch is live again.
// `label` comes off the helper itself, so this card cannot invent a name for a table.
const ladder = computed(() => activeLadderOfSnapshot(snap.value))
const rankHead = computed(() => `Her ${ladder.value.label.toLowerCase()} rank`)
const rankValue = computed(() => (ladder.value.rank === null ? 'unranked' : `#${ladder.value.rank}`))

const stage = computed(() => portraitStage(snap.value?.ageYears ?? 19))
const artUrl = computed(() => portraitUrl(stage.value, 'serious'))
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-serious`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

async function answer(a: ForkAnswer): Promise<void> {
  await game.answerFork(a)
}
</script>

<template>
  <div v-if="fork" class="dialog-overlay">
    <div class="dialog-card fork-card">
      <img class="fork-art" :src="artUrl" :style="artStyle" alt="" />
      <p class="fork-kicker">She is {{ fork.ageYears }}</p>
      <h2 class="fork-title">The junior ladder is behind her.</h2>
      <p class="fork-lede">
        Every rung she has been climbing is closed on age now. The next one pays prize money and
        costs more than it pays until she is good. Nobody has to keep going.
      </p>

      <dl class="fork-facts">
        <div>
          <dt>The family has</dt>
          <dd>{{ formatCents(snap?.fundsCents ?? 0) }}</dd>
        </div>
        <div>
          <dt>{{ rankHead }}</dt>
          <dd>{{ rankValue }}</dd>
        </div>
        <div>
          <dt>Spent so far</dt>
          <dd>{{ formatCents(snap?.careerTotals.spentCents ?? 0) }}</dd>
        </div>
        <div>
          <dt>The tennis has paid</dt>
          <dd>{{ formatCents(snap?.careerTotals.prizeCents ?? 0) }}</dd>
        </div>
      </dl>

      <div class="fork-answers">
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('continue')">
          <strong>Turn professional</strong>
          <span>W15 and up. Real cheques, real bills, and the family keeps paying.</span>
        </button>
        <!-- ⭐ ROUND-17 #6: THE SCHOLARSHIP IS NOT ALWAYS ON THE TABLE. A girl who has already scored
             at W75 or above has taken professional prize money, and that spends her college
             eligibility – the reasoning is on `ENDINGS.collegeClosedFromTier`. Absent rather than
             disabled: a greyed button with a tooltip would still read as an answer she is refusing,
             and this card «may not recommend». `answerFork` refuses it engine-side regardless. -->
        <button
          v-if="fork.collegeOpen"
          class="fork-answer"
          type="button"
          :disabled="game.busy"
          @click="answer('college')"
        >
          <strong>Take the scholarship</strong>
          <span>Four years of student tennis. No ranking points, and the money goes the other way.</span>
        </button>
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('stop')">
          <strong>Stop here</strong>
          <span>She had a childhood in the sport. That is a whole thing to have had.</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fork-card {
  max-width: 460px;
  text-align: left;
}

.fork-art {
  display: block;
  width: 100%;
  height: 148px;
  object-fit: cover;
  border-radius: var(--radius-panel);
  margin-bottom: 14px;
}

.fork-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.fork-title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.fork-lede {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.fork-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 0 18px;
}

.fork-facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fork-facts dt {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.fork-facts dd {
  margin: 0;
  font-size: 15px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* THREE ANSWERS, ONE WEIGHT. No primary, no accent, no ordering cue beyond the order they are
   written in - the card is not allowed to have an opinion. */
.fork-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fork-answer {
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

.fork-answer:disabled {
  opacity: 0.5;
  cursor: default;
}

.fork-answer strong {
  font-size: 15px;
  font-weight: 600;
}

.fork-answer span {
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-soft);
}
</style>
