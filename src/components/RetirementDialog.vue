<script setup lang="ts">
// THE NATURAL END'S OFFER (career-contract-v1.md §5.3) – asked in the off-season, blocking until
// answered, and offered again next year if she says no.
//
// ⭐⭐⭐ THE LONG GOODBYE STEP 4 - THE FINAL OFFER IS NOT A QUESTION ANY MORE, AND THIS CARD IS
// WHERE THAT STOPPED BEING A MATTER OF WORDING. From 29 the offer comes every off-season, the
// parent answers it, and she may always refuse: that path below is UNTOUCHED, down to the byte. On
// the LAST one the parent is no longer handed a question with one legal answer - it is HER line,
// the card acknowledges it, and there is no refusal control on it because there is nothing to
// refuse.
//
// ⚠⚠ WHAT THIS HEADER USED TO SAY, AND IT IS THE WHOLE REASON STEP 4 EXISTS: «the copy on it says
// the question ran out - not that a mechanic retired her». That is a card apologising for its own
// shape. The engine's `answerRetirement` carried the same apology in its header and both are gone:
// the difference between "we are retiring you" and "nobody is going to ask again" is carried by
// WHOSE VOICE IT IS, not by how carefully the sentence is phrased.
//
// ⚠ HER LINE IS THE ENGINE'S, IMPORTED AS A SYMBOL AND NOT RETYPED HERE (`lastWordLine`,
// src/engine/ending.ts). It is written once and reaches three surfaces - this card, the off-season
// feed line, and the epilogue's detail - so they cannot drift apart, and a test pins the line
// through the symbol rather than through a spelling (`RELEASE_LINE_PREFIX`'s own precedent, and
// the reason `InjuryStopDialog` imports that one). ⚠ This is a SHARED SENTENCE, not prose being
// parsed for facts: R2-02's rule stands untouched - no number on this card is recovered from
// rendered English.
//
// ⚠⚠ AND IT USED TO SAY "THE FLOOR AT 38", WHICH IS NOW WRONG IN THE ONE WAY A COMMENT MUST NOT BE:
// it named a rule that no longer exists. `ENDINGS.stopAskingAgeYears` is deleted (the long goodbye,
// docs/specs/the-long-goodbye-2026-08.md §3a) and the last offer arrives when her physical falls
// below a share of her own peak - age 41 on a body kept well, earlier on one that never got there.
// Step 2 moved not one line of this template for that, because the kicker already prints
// `snapshot.ageYears` and the headings already branch on `offer.final`.
//
// ⚠ WHAT HER LINE MAY NOT SAY, MEASURED RATHER THAN GUESSED - the full argument is on
// `LAST_WORD_OPENING` in src/engine/ending.ts. In one line: she opens her last seasons BETTER, not
// worse, so nothing here may read as "she is too tired to go on"; and her body's share is a
// function of her age alone, so nothing here may read as "she wore out faster" or "you did this".
//
// ⭐⭐⭐ ROUND 30 #7 – THE AGE LEDE WAS RE-WORDED, AND IT IS THE ONE STRING THIS ITEM MOVES.
//
// THE OWNER, 30.08: «Что-то не так с попапом "теперь каждый год начиная с 29 лет" - звучит как
// механический приговор безысходности пока что, надо что-то с этим сделать».
//
// ⚠⚠ THE MECHANIC IS CORRECT AND WAS NOT TOUCHED. What was wrong is that the sentence announced a
// SCHEDULE - «the way it gets asked from twenty-nine onward» is the game explaining its own rule,
// and a rule read out at a person is a verdict. It also was not the whole truth, which is the half
// that makes the kinder version the more accurate one as well
// (docs/specs/the-long-goodbye-2026-08.md):
//
//   * the question is asked every off-season from 29 and she MAY ALWAYS REFUSE - that path is
//     untouched here, down to the byte;
//   * how many refusals she has is NOT a fixed count and not a countdown. The last offer arrives
//     when her physical falls below 55% of HER OWN PEAK (§3a, his ruling of 26.08), which is age
//     ~41.2 on a body kept well and earlier on one that never got there. Every one of those years
//     is bought with physio, load and luck;
//   * and the corridor fades rather than stopping - §4a's recovery curve returns less each year
//     from 29 on, so the body is the thing that decides, continuously.
//
// ⚠ NO NUMBER FROM THE ENGINE IS SPELLED OUT IN THE NEW SENTENCE, deliberately: «41» is
// `ENDINGS.lastOfferPeakShare` seen through a curve, and a prose figure that cannot move with its
// constant is the R2-02 hazard pointing the other way. «As many winters as her body gives her» is
// exactly what the rule says and stays true at any share he ever sets it to.
//
// ⚠ THE OTHER TWO HEADINGS AND EVERY CONTROL ARE UNTOUCHED (invariant 4, and item 7 asked for one
// popup): the final card is hers and the plateau card is her own reason, and neither is what he was
// reading. `tests/component/last-word.test.ts` still holds all three to the byte.
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
//
// ⭐⭐⭐ ROUND 31 #9 – AND THE AGE BRANCH NOW SAYS WHICH YEAR IT IS. The lede above answers «why is
// this being asked»; it could not answer «how far gone is she», because the number that knows –
// `physicalShare`, 100% at 28 and 93.1% at 31.7 on his own save – never left the engine. The card
// gains ONE paragraph under the lede, picked by the share off `declineRung`
// (composables/declineVoice.ts, where the owner's three approved sentences live).
//
// ⚠⚠ HIS ROUND-30 LEDE IS UNTOUCHED, DOWN TO THE BYTE, and it is a separate `<p>` for exactly that
// reason. «ADDED TO HIS ROUND-30 LEDE, NOT REPLACING IT» – round-31 §11. `tests/component/
// last-word.test.ts` pins that sentence literally and stays green because nothing about it moved.
//
// ⚠ THE OTHER TWO READINGS DRAW NOTHING NEW. The plateau card is a RESULTS reading (§7.2: «a
// body-driven last word and a results-driven mid-career question are different things») and the
// final card is already hers – a rung under her own last word would be the game talking over her.
//
// ⚠ AND NOTHING IS DRAWN HERE, ON PURPOSE. The band picks the sentence, so re-opening this card
// cannot change it – round 31 #4's defect, which he reported the first time it happened.
import { computed, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { activeLadderOfSnapshot } from '../shared/protocol'
import { lastWordLine } from '../engine/ending'
import { declineRung } from '../composables/declineVoice'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'

const game = useGameStore()
const offer = computed(() => game.snapshot?.retirementOffer ?? null)
const age = computed(() => game.snapshot?.ageYears ?? 29)
const tableName = computed(() => activeLadderOfSnapshot(game.snapshot).label.toLowerCase())

// ⭐⭐ HER LAST WORD. The kicker one line up already carries her age, which is why the card renders
// the line ALONE while the feed prints `She is 41.` in front of it - the same sentence, and neither
// surface repeats the other's furniture.
const lastWord = computed(() => lastWordLine(game.snapshot?.oneMoreYearCount ?? 0))

// ⭐⭐ WHICH YEAR IT IS, off the share alone – null at her peak and on any snapshot that carries no
// share, which is what keeps this paragraph off the card until there is something true to put in it.
const rung = computed(() => declineRung(game.snapshot?.physicalShare))

const stage = computed(() => portraitStage(age.value))
const artUrl = computed(() => portraitUrl(stage.value, 'serious'))
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-serious`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

// ⚠ THE SINGLE CONTROL ON THE FINAL CARD ACKNOWLEDGES; ON EVERY OTHER CARD IT ANSWERS. It is the
// same button element on purpose rather than a second one behind a `v-if`: the non-final path must
// render byte-identically to what shipped, and a duplicated control is how that quietly stops being
// true. `answer(true)` is what both file, because acknowledging her line and taking the offer are
// the same transition - what differs is who decided, and she did.
const answerLabel = computed(() => (offer.value?.final ? 'All right' : 'That is enough'))
const answerNote = computed(() =>
  offer.value?.final ? 'Nothing to answer here. She has told you what happens next.' : 'She stops here, on her own terms.',
)

async function answer(retire: boolean): Promise<void> {
  await game.answerRetirement(retire)
}

// ⭐⭐ R2-07 – IT IS A MODAL, AND NOW IT SAYS SO AND HOLDS THE KEYBOARD (composables/dialogFocus.ts
// carries the argument and the honest limit).
//
// ⚠⚠ ESCAPE IS PASSED NO HANDLER, AND THE FINAL CARD IS WHY IT CANNOT BE ANYTHING ELSE. From 29 the
// card draws two answers and the offer BLOCKS the world until one of them is in, so a dismissal
// would strand the career; on the last one it draws exactly ONE, because there is no question on it
// to answer, and a key that closed this card would either end a career on a stray press or hand back
// a card she has already spoken on. Neither is a dismissal, so there is none.
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

      <!-- ⭐⭐⭐ THE LAST ONE IS HERS. The heading reports her, the lede IS her - `lastWordLine`,
           the engine's own sentence, rendered rather than retyped. It read «Nobody is going to ask
           her again», which is the game announcing that it has stopped asking; she was not in it. -->
      <template v-if="offer.final">
        <h2 id="retire-dialog-title" class="retire-title">She told you at the end of the season.</h2>
        <p class="retire-lede">{{ lastWord }}</p>
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
      <!-- ⭐⭐⭐ ROUND 30 #7 – RE-WORDED, AND THE LEDE ONLY. See the note at the top of this file for
           what the mechanic actually promises and why the old sentence was not the whole of it. -->
      <template v-else>
        <h2 id="retire-dialog-title" class="retire-title">Is there another year in this?</h2>
        <p class="retire-lede">
          Twenty-nine is when the question starts being asked, not a countdown to anything. There is
          no wrong answer, and she can say no for as many winters as her body gives her.
        </p>
        <!-- ⭐⭐⭐ ROUND 31 #9 – HOW FAR GONE SHE IS, which the lede above deliberately does not say.
             Its own paragraph so the sentence he approved in round 30 stays byte-identical; absent
             entirely while she is at her peak, so this card reads exactly as it always did until the
             week the engine says otherwise. The three sentences are in composables/declineVoice.ts. -->
        <p v-if="rung" class="retire-rung">{{ rung }}</p>
      </template>

      <div class="retire-answers">
        <button class="retire-answer" type="button" :disabled="game.busy" @click="answer(true)">
          <strong>{{ answerLabel }}</strong>
          <span>{{ answerNote }}</span>
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

/* ROUND 31 #9 – the rung, set exactly as the lede it follows: it is a second paragraph of one
   thought, not a second kind of thing. Adjacent block margins collapse to 18px, so the gap to the
   answers is unchanged whether this paragraph is on the card or not – no negative margin, which is
   also what keeps `tests/component/fits.ts` measuring a real box rather than a clever one. */
.retire-rung {
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
