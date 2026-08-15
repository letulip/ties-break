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
//
// ⭐ ROUND-21 #8 – AND THE MISSING DOOR NOW SAYS WHY IT IS MISSING. The owner, after a full career:
// «В 19 не было варианта выбрать колледж, только про или завязать».
//
// ⚠ MEASURED BEFORE ANYTHING WAS BUILT, because "the dialog does not draw it" and "the engine says
// it is shut" are different bugs with different fixes. `tools/econ-bench.ts`'s own `player` policy –
// the model of a reasonable parent, fitted to the owner's own envelope – over 9 presets x 3 seeds:
// **26 of 26 careers that reached the fork had `collegeStillOpen === false`**, and `snapshot.fork.
// collegeOpen` carried that faithfully to this card every time. Under the `grinder` policy (enters
// nothing on the paid rungs) it was open 13 of 13. So the engine is the one closing it, the flag and
// the arm below are correct, and what he met was a card that had silently dropped a third of itself.
// The rung that shuts it is W75 with a best finish of 0-3 of 5 – she reached the quarters or won it,
// not the wooden spoon the 13.08 ruling was about.
//
// ⚠ SO THE FIX IS A SENTENCE, NOT A BUTTON. The round-17 note below chose ABSENT over disabled, and
// that is still right – a greyed answer reads as one she is refusing. What was wrong is that absent
// and never-existed looked identical. Saying which rung took it is not a recommendation: it is the
// same fact the other two answers put on the table, and it is what stops a player counting doors and
// concluding the game forgot one. Whether W75 is the right rung at all is task #102's question, and
// the 26-of-26 measurement is the material for it – it is not decided here.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { ENDINGS } from '../engine/ending'
import { TIER_SHORT } from '../engine/season/calendar'
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

// ⭐ #8: the rung comes off `ENDINGS`, never out of the template. The same rule the tour briefing
// keeps ("this component owns no words with a number in them") – if the door ever moves to W100 this
// sentence moves with it, and `tests/component/endings-ui.test.ts` pins that no rung name is typed
// into the file at all.
const closedFromTier = computed(() => TIER_SHORT[ENDINGS.collegeClosedFromTier])

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

      <!-- ⭐ ROUND-21 #8: WHY THERE ARE TWO ANSWERS AND NOT THREE. Above the answers, not below
           them, so the last thing in the card's flow stays a control the player can reach - the
           height check in tests/component/fits.ts measures the dismiss box off the card's own
           bottom edge. Not an answer, not a button, and it carries no opinion about the two that
           are left. -->
      <p v-if="!fork.collegeOpen" class="fork-shut">
        There are two answers here and not three: the college place closed the first time she took a
        real result at {{ closedFromTier }} or above. Prize money at that level spends her college
        eligibility, and nothing gives it back.
      </p>

      <div class="fork-answers">
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('continue')">
          <strong>Turn professional</strong>
          <span>W15 and up. Real cheques, real bills, and the family keeps paying.</span>
        </button>
        <!-- ⭐ ROUND-17 #6: THE COLLEGE PLACE IS NOT ALWAYS ON THE TABLE. A girl who has already
             scored at W75 or above has taken professional prize money, and that spends her college
             eligibility – the reasoning is on `ENDINGS.collegeClosedFromTier`. Absent rather than
             disabled: a greyed button with a tooltip would still read as an answer she is refusing,
             and this card «may not recommend». `answerFork` refuses it engine-side regardless.

             ⚠ AND IT SAYS "COLLEGE", NOT "THE SCHOLARSHIP" (round-17 B, 12.08). It used to read
             "Take the scholarship", which is the SAME WORD the academy's travel grant uses in the
             feed, on the Money screen and on the season card – and the academy is a thing she may
             be holding right now. The owner read the two as one and asked whether a W75+ result
             before nineteen would cost her the academy. It does not, and cannot: they are separate
             mechanisms that shared a noun. `docs/specs/round17-triage.md` §B has the evidence; this
             button's job is to make sure nobody has to go and read it. -->
        <button
          v-if="fork.collegeOpen"
          class="fork-answer"
          type="button"
          :disabled="game.busy"
          @click="answer('college')"
        >
          <strong>Take the college place</strong>
          <span>Four years of student tennis on a college scholarship. No ranking points, and the money goes the other way.</span>
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

/* ⭐ ROUND-21 #8 – the closed-door note. Typed as the lede is, one shade quieter: it is context for
   the answers below it, not a fourth thing to weigh. */
.fork-shut {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-dim);
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
