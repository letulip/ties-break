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
// ⭐⭐ ROUND-21 #8 IS RETIRED BY A LATER RULING OF THE OWNER'S OWN, AND THAT IS RECORDED RATHER
// THAN DROPPED. After a full career he asked why the card had only two answers, and #8 built a
// sentence explaining which rung had taken the third. On 16.08 he removed the rule that could take
// it: college is an independent branch of the career, alternative to the tour, and no result closes
// it. **There is no shut door left to explain**, so the sentence is gone and the third answer is
// unconditional. docs/specs/college-is-its-own-branch-2026-08.md §4 states the retirement.
//
// ⚠ THE MEASUREMENT THAT #8 RESTED ON IS KEPT, because it is the evidence the complaint was real
// rather than a misread screen: `tools/econ-bench.ts`'s `player` policy over 9 presets x 3 seeds had
// **26 of 26 careers reach the fork with the college answer already spent**, and the flag carried
// that faithfully to this card every time - the engine was closing it, not the dialog. Under the
// `grinder` policy (which enters nothing on the paid rungs) it was open 13 of 13. That is why the
// third answer now needs no flag at all: the state it guarded against was the normal one.
//
// ⚠ AND ABSENT-OVER-DISABLED, the round-17 note's own choice, is now moot rather than overruled.
// There is no case in which this card draws two answers.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { TIERS, TIER_SHORT } from '../engine/season/calendar'
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

// ⚠ #8's RUNG LOOKUP WENT WITH #8's SENTENCE (16.08). It read `TIER_SHORT[ENDINGS.collegeClosedFromTier]`
// and existed so no rung name was ever typed into this file – a rule this component still keeps, and
// `tests/component/endings-ui.test.ts` still pins. The figure below is the only rung name left here
// and it comes off `TIERS` the same way.
//
// ⭐⭐ P4 – THE RESULT ARM, AND IT IS A FACT ON THE TABLE RATHER THAN A GATE.
//
// The owner's original intent for the fork was a fork FOR THE GIRLS WHOSE RESULTS ARE NOT VERY GOOD
// (14.08 – his own words are quoted in `docs/specs/college-gate-decoupled-2026-08.md`, which is the
// place for them; this file is English-only). The research found exactly one line that separates the
// populations: #200, the rank at which our own ladder says the main tour starts admitting her.
// Measured over 90 careers
// (research §5c): it excludes the strongest third almost perfectly (1 of 30), keeps the door for
// half of the weakest third, and is the only candidate in the whole sweep that beats a coin flip -
// 47 points of separation.
//
// ⚠ AND IT IS NOT A NEW CONSTANT. `TIERS[TOUR_RUNG].acceptsRank` is already 200 and already means
// this; a fitted number would have been a number this card invented about her chances.
//
// ⚠⚠ IT DOES NOT GATE ANYTHING, AND THAT IS THE 15.08 RULING, NOW DOUBLY TRUE. The owner cancelled
// the money arm outright - there is nothing for us to do here, in his words - and on 16.08 he removed
// the result arm as well, so the third answer is drawn unconditionally and this number gates nothing
// whatever. What it does is let the player see where she stands against the tour she would be turning
// professional into - which is the same job the four figures beside it already do.
//
// ⚠ SO IT MAY NOT BE A SENTENCE. Ruling 4 (30.07): the card «may not recommend». A line reading
// "the tour would not take her" is one comparison away from advice about which answer to pick, and
// this card is not allowed to have that opinion. It is a NUMBER IN THE SAME LIST as her funds and
// her rank, said in the card's own idiom, and the player does the comparing.
const TOUR_RUNG = 'wta250' as const
const tourAdmits = computed(() => TIERS[TOUR_RUNG].acceptsRank ?? null)
const tourHead = computed(() => `${TIER_SHORT[TOUR_RUNG]} admits down to`)

// ⭐⭐ WHAT THE THIRD ANSWER COSTS – v51, docs/specs/what-the-college-place-costs-2026-08.md.
//
// The button used to promise "four years on a college scholarship" and the engine then charged
// nothing, so the card was making a claim about money that the simulation did not honour. It says
// what is on the table now: which programme, how much of the bill the award covers, and what is left
// for the family.
//
// ⚠⚠ IT STILL MAY NOT RECOMMEND (ruling 4, 30.07). These are FIGURES IN THE SAME REGISTER as the
// four already on the card – her funds, her rank, what she has spent, what the tennis has paid – and
// the comparison is the player's. No sentence here says college is affordable, unaffordable, better
// or worse than the tour.
//
// ⚠ AND THE THIRD ANSWER IS STILL UNCONDITIONAL. There is no value of `offer` that removes a button:
// `programme === null` means nobody offered her a funded place, and the copy says she can enrol and
// pay rather than that the answer is gone. The owner's ruling of 16.08 is what this card is drawn
// against and nothing here bends it.
//
// ⚠ `offer === null` IS A MIGRATED CAREER (v50 and earlier, fork already open) and it falls back to
// the pre-v51 line. Never "refused" – see the v51 migration.
const offer = computed(() => fork.value?.offer ?? null)
const PROGRAMME_LABEL: Record<string, string> = {
  strong: 'A strong programme',
  solid: 'A solid programme',
  small: 'A small programme',
}
const programmeLine = computed(() => {
  const o = offer.value
  if (!o) return null
  return o.programme === null ? 'No programme has offered a place' : PROGRAMME_LABEL[o.programme]
})
const pct = (share: number): string => `${Math.round(share * 100)}%`
// The two layers, as one line each, and they are two lines because they are two different things.
const awardLine = computed(() => {
  const o = offer.value
  if (!o) return null
  return o.programme === null ? 'Walk-on, no athletics award' : `${pct(o.athleticShare)} of the bill`
})
const aidLine = computed(() => {
  const o = offer.value
  if (!o || o.needShare <= 0) return null
  return `${pct(o.needShare)} need-based`
})
const billLine = computed(() => {
  const o = offer.value
  if (!o) return null
  return o.familyPerYearCents <= 0 ? 'Nothing' : `${formatCents(o.familyPerYearCents)} a year`
})

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
        <!-- ⭐⭐ P4's result arm – a fifth figure, not a fifth opinion. It sits beside her rank on
             purpose: the two numbers next to each other are the whole of what this card is allowed
             to say about her chances, and the comparison is the player's to make. -->
        <div v-if="tourAdmits !== null">
          <dt>{{ tourHead }}</dt>
          <dd>#{{ tourAdmits }}</dd>
        </div>
      </dl>

      <div class="fork-answers">
        <button class="fork-answer" type="button" :disabled="game.busy" @click="answer('continue')">
          <strong>Turn professional</strong>
          <span>W15 and up. Real cheques, real bills, and the family keeps paying.</span>
        </button>
        <!-- ⭐⭐ THE THIRD ANSWER IS UNCONDITIONAL (owner, 16.08). Round-17 #6 had made it depend on
             `fork.collegeOpen`, on the reasoning that a girl who had scored at W75 or above had spent
             her college eligibility. That reasoning was an NCAA rule which no longer exists, and the
             ruling that replaced it is simpler: college is a separate branch of the career, not a
             consolation the tour can take away. So the card draws three answers, always, and
             `answerFork` no longer refuses this one.

             ⚠ AND IT SAYS "COLLEGE", NOT "THE SCHOLARSHIP" (round-17 B, 12.08). It used to read
             "Take the scholarship", which is the SAME WORD the academy's travel grant uses in the
             feed, on the Money screen and on the season card – and the academy is a thing she may
             be holding right now. The owner read the two as one and asked whether a W75+ result
             before nineteen would cost her the academy. It does not, and cannot: they are separate
             mechanisms that shared a noun. `docs/specs/round17-triage.md` §B has the evidence; this
             button's job is to make sure nobody has to go and read it. -->
        <button
          class="fork-answer"
          type="button"
          :disabled="game.busy"
          @click="answer('college')"
        >
          <strong>Take the college place</strong>
          <!-- ⚠ THE OLD LINE SAID "the money goes the other way" AND IT WAS A CLAIM THE ENGINE DID
               NOT HONOUR. It was true of the balance – she stops travelling, the coach stops billing
               – and false about the scholarship, which paid $0 and covered a bill that did not
               exist. The line below states the same trade without asserting the direction, and the
               figures under it are what the direction actually is this career. -->
          <span v-if="offer">Four years of student tennis. No ranking points, and the tour moves on without her.</span>
          <span v-else>Four years of student tennis on a college scholarship. No ranking points, and the money goes the other way.</span>
        </button>
        <!-- ⭐⭐ THE OFFER, UNDER THE BUTTON IT BELONGS TO – three short rows, no sentence, no advice.
             It sits BELOW the answer rather than inside it so the three answers keep the equal weight
             ruling 4 requires: a button carrying three extra rows of detail is a recommendation drawn
             in whitespace. -->
        <dl v-if="offer" class="fork-offer">
          <div>
            <dt>The place</dt>
            <dd>{{ programmeLine }}</dd>
          </div>
          <div>
            <dt>The award covers</dt>
            <dd>{{ awardLine }}<template v-if="aidLine"> + {{ aidLine }}</template></dd>
          </div>
          <div>
            <dt>The family pays</dt>
            <dd>{{ billLine }}</dd>
          </div>
        </dl>
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

/* ⭐⭐ THE OFFER (v51). Three rows, deliberately in the FACTS idiom and not the ANSWERS idiom: no
   border, no press target, nothing that could read as a fourth thing to choose. It is quieter than
   the buttons it sits under, which is the only styling opinion ruling 4 permits – the card may not
   emphasise an answer, and it may not make an answer's detail look like an answer either.

   ⚠ IT MUST NOT GROW A max-height OF ITS OWN. The card's bound is on the shared `.dialog-card`
   (`max-height: 100%; overflow-y: auto`, round-20 #3) and the whole point of putting it there was
   that one box owns the scroll. A cap here would nest a second scroller inside the first and hide
   the family's bill behind it – exactly the class of defect the round-20 gotcha is about. */
.fork-offer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 2px 0 2px;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  background: var(--panel-sunk, transparent);
}

.fork-offer div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.fork-offer dt {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.fork-offer dd {
  margin: 0;
  font-size: 13px;
  color: var(--ink);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
