<script setup lang="ts">
// ⭐⭐⭐ THE HANDOVER – phase 4 of docs/specs/childhood-prologue-build-2026-09.md §5, which calls it
// «the most important screen in the game», and the reason is not decoration: it is the first thing a
// player sees that is about HER rather than about menus, and it is where a weak draw stops being a
// hundred-hour ambush.
//
// THREE THINGS ON ONE SCREEN, in this order and no other:
//   1. THE FORMED ROSE – the radar she arrives with, drawn by the SHIPPED component off the
//      snapshot's own axes. Safe by §1d: the fog is about where she IS («how wrong we might be about
//      where she is», SkillsRadar.vue), not about her ceiling, so showing it reveals nothing about
//      potential and does not weaken the fog at all.
//   2. THE COACH'S READ, IN HIS VOICE, WITH NO NUMBER – §8a's approved drafts, in the vocabulary
//      the coach already has. The band comes from the game's own `coachRoomNote`; the sentence comes
//      from `src/prologue/handover.ts`. ⚠ He is allowed to be WRONG, and that is what keeps the fog
//      meaning something.
//   3. THE HONEST CHOICE – go on with her, or raise another child. ⚠ Worded as a choice about HER,
//      never as a mechanic: his ruling (§2.3) is that the game says NOTHING about rerolling, odds or
//      a floor.
//
// ⚠⚠ IT HOLDS NO COPY, exactly as `PrologueCard.vue` holds none. Every player-facing sentence comes
// through a binding from `src/prologue/handover.ts`, so replacing his copy stays a table edit – and
// `tests/prologue-handover.test.ts` asserts this template contains no sentence of its own.
//
// ⚠ WHY IT SITS ON `.dialog-overlay` / `.dialog-card` LIKE THE NINE CARDS. That is where round-20
// #3's fix lives (`max-height: 100%; overflow-y: auto`, argued in src/style.css), and this surface
// is the WORST case that rule exists for: a blocking card carrying a picture, a paragraph, a figure
// and two controls, at the one moment a career can still be refused. A dialog that grows past a
// 375x667 phone strands the player with no way forward – and here there is nothing behind it to go
// back to. The controls are LAST in the flow so `measureDialog` can read their box off the card's
// own bottom edge, which is only the truth when nothing follows them.
import { computed, useTemplateRef } from 'vue'
import SkillsRadar from './SkillsRadar.vue'
import { useDialogFocus } from '../composables/dialogFocus'
import { HANDOVER_COPY, handoverKicker, handoverRoseTitle, spentLine, weeklySpentLine } from '../prologue/handover'
import type { RadarAxis } from '../shared/protocol'

const props = defineProps<{
  /** the rose she arrives with – the snapshot's own axes, drawn by the shipped component */
  axes: readonly RadarAxis[]
  /** ⭐⭐⭐ ROUND 35 #7 – HOW OLD SHE ACTUALLY IS, off the world. `Snapshot.ageYears` is
   *  `kidAgeAt(world, world.week)` – the ONE clock (the 09.08 ruling), the same number Home prints
   *  and every age-keyed gate reads. The two lines that name an age on this screen are spelled from
   *  it and from nothing else.
   *
   *  ⚠ IT ARRIVES ALREADY SPELLED, by the game's own speller (`ageInWords`), and `src/prologue`'s
   *  own importer pin is why – see the note over `handoverKicker`. The container calls it.
   *
   *  ⚠ REQUIRED, so a mount that forgets it cannot compile. The owner met this screen asserting
   *  «She is fourteen» over a girl born in June, who is thirteen; an optional prop with a default of
   *  fourteen would be the same caption with a longer route to it. */
  ageWord: string
  /** ⭐ WHERE SHE STANDS TODAY, already chosen for her band – see `coachBaseReadFor`. It is the
   *  BASE and it is what the nine years BUILT; `read` below is the ROOM and it is what she was born
   *  with. Two props rather than one joined string, so the screen can space them as two sentences
   *  and a test can name which of the two moved. Empty renders nothing – the same total-by-omission
   *  handling the money line has. */
  base?: string
  /** his sentence, already chosen for her band – see `coachReadFor` */
  read: string
  /** what the nine years cost, in cents (house law: money is in cents everywhere) */
  spentCents: number
  /** ⭐ PHASE 11 – WHAT SHE PLAYED, already folded into a sentence by `playedLine`. The prologue's
   *  tournaments are thrown away here (pool.ts's third guard), so this screen is the last place they
   *  can be mentioned at all – and the player watched them. Empty renders nothing, which is the same
   *  total-by-omission handling `base` has and the honest answer for a childhood that entered none:
   *  a screen may not report a year the player did not live. */
  played?: string
  busy?: boolean
}>()

const emit = defineEmits<{
  (e: 'go-on'): void
  (e: 'start-again'): void
}>()

const copy = HANDOVER_COPY
/** ⭐⭐ ROUND 35 #7 – THE TWO LINES THAT NAME AN AGE, SPELLED OFF THE CLOCK. Everything else on this
 *  screen is still a bound table entry; these two are the same table's sentence with the world's own
 *  number in it, and `src/prologue/handover.ts` carries the account of why they had to move. */
const kicker = computed(() => handoverKicker(props.ageWord))
const roseTitle = computed(() => handoverRoseTitle(props.ageWord))
const spent = computed(() => spentLine(props.spentCents))
// ⭐ THE SAME TOTAL, SAID PER WEEK – his idea, and the one figure on this screen that is about the
// game rather than about the childhood: a coach is billed by the week, and the player meets that
// bill one screen from here. Derived in the table, never typed – see `weeklySpentLine`.
const spentWeekly = computed(() => weeklySpentLine(props.spentCents))

// Named `cardEl` and not `card` for the reason PrologueCard.vue records: a local called `card`
// shadows a prop of that name and the whole screen renders off null.
const cardEl = useTemplateRef<HTMLElement>('cardEl')
// A modal, and Escape is passed no handler: the two controls ARE the only two ways out of this
// screen, and dismissing it would be answering the question by accident.
useDialogFocus(cardEl)
</script>

<template>
  <!-- ⭐⭐ ROUND 35 #2/#5 - THE SAME GROUND THE NINE CARDS ARE ON. The owner asked for the prologue
       to be drawn without the framed backing plate, and for the rest of its screens to be brought up
       to the manner of the one he liked; the handover is one of the rest. `.prologue-overlay` is the
       shared modifier in src/style.css and it changes nothing structural - the fixed full-screen
       scrim and this card's inherited `max-height: 100%; overflow-y: auto` are untouched. -->
  <div class="dialog-overlay prologue-overlay">
    <div
      ref="cardEl"
      class="dialog-card handover-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-kicker handover-title"
      tabindex="-1"
    >
      <p id="handover-kicker" class="handover-kicker">{{ kicker }}</p>
      <h2 id="handover-title" class="handover-title">{{ copy.title }}</h2>

      <!-- 1. THE FORMED ROSE, drawn by the shipped component off the snapshot's own axes. The
           picture's height is declared in the style block below rather than left to the layout -
           see the rule there for why a measurement that cannot see the tallest thing on the card is
           a measurement that always passes. -->
      <div class="handover-rose">
        <SkillsRadar :axes="axes" :title="roseTitle" />
      </div>

      <!-- 2. THE COACH'S READ, AND SINCE PHASE 7 IT IS TWO SENTENCES UNDER ONE LABEL. No name and no
           pronoun on the label - R15-7: every professional is unnamed, and the person who taught her
           for nine years was never given a gender.

           ⭐⭐ THE ORDER IS THE ARGUMENT AND IT IS NOT INTERCHANGEABLE. The BASE goes first - where
           she stands today, which is what the player just spent nine cards building - and the ROOM
           follows, which is what she was born with and what no childhood can move. Read the other
           way round the screen would open on a verdict about her ceiling and then footnote the
           player's own nine years; read this way it says what you made, and then what she came
           with. `src/prologue/handover.ts` carries the whole of that distinction.

           ⚠ ONE LABEL FOR BOTH, because both are his and a second label would be a new sentence on
           a screen whose every word is a draft the owner has not approved. -->
      <div class="handover-read">
        <p class="handover-read-label">{{ copy.coachLabel }}</p>
        <p v-if="base" class="handover-read-line handover-read-base">{{ base }}</p>
        <p class="handover-read-line">{{ read }}</p>
      </div>

      <!-- WHAT SHE PLAYED, ONCE, AND ONLY IF SHE DID. One line, above the money, because it is
           still about her and the money is about you. -->
      <p v-if="played" class="handover-played">{{ played }}</p>

      <!-- THE MONEY, ONCE. §2.4: the cards name their costs in relative terms and carry no figure at
           all; the total surfaces here and nowhere else in the prologue. -->
      <p class="handover-spent">{{ spent }} {{ spentWeekly }}</p>

      <!-- 3. THE HONEST CHOICE, LAST IN THE FLOW. Nothing here marks one of them as the one to take:
           the whole subject of this screen is that the decision is yours. Same rule, and the same
           absence of a positional selector, as `.prologue-answer`. -->
      <div class="handover-answers">
        <button class="handover-answer" type="button" :disabled="busy" @click="emit('go-on')">
          {{ copy.goOn }}
        </button>
        <button class="handover-answer" type="button" :disabled="busy" @click="emit('start-again')">
          {{ copy.startAgain }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The scrim, the panel and the height bound are `.dialog-overlay` / `.dialog-card` and are not
   restated here - see the script header. What is local is the width, the four blocks and the pair
   of controls.

   ⚠ EVERY COLOUR IS A DECLARED APP TOKEN WITH NO FALLBACK, for the reason round-17 #3 wrote down and
   `.prologue-answer` repeats: `var(--card, #fff)` shipped four buttons at a measured 1.09:1 on a
   dialog the player could not dismiss. A fallback is honest only where the token is optional. */
/* ⭐⭐ ROUND 35 #2/#5 - NO BACKING PLATE, exactly as `.prologue-card`. The panel tone, the hairline
   and the corners come off; the ground is `--bg`, which is what the app paints its own screens, and
   the side padding stays because text run to the bezel is not what any screen in this app does.
   ⚠ THE HEIGHT CAP AND THE SCROLLER ARE `.dialog-card`'S AND ARE NOT TOUCHED. This card is the worst
   case round-20 #3 exists for - a blocking screen with a picture, a paragraph, a figure and two
   controls, at the one moment a career can still be refused - and `tests/component/
   prologue-handover.test.ts` measures it. */
.handover-card {
  max-width: 420px;
  padding: 16px;
  border: 0;
  border-radius: 0;
  background: var(--bg);
  text-align: left;
}

.handover-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.handover-title {
  margin: 0 0 10px;
  font-family: var(--font-heading);
  font-size: 20px;
  line-height: 1.25;
  color: var(--ink);
}

.handover-rose {
  margin: 0 0 14px;
}

/* ⚠⚠ THE PICTURE'S HEIGHT IS DECLARED, AND IT IS NOT COSMETIC - it is what makes the round-20 #3
   measurement honest on this card. `tests/component/fits.ts` reads an explicit `height` off a box
   and falls back to STACKING THE CHILDREN when there is none; an svg's children are paths, which
   stack to almost nothing, so the tallest element on the card would measure as a fraction of itself
   and every fit number here would be optimistic. happy-dom does no layout and cannot know the
   viewBox's aspect - so the aspect is stated.

   194px IS THE VIEWBOX'S OWN HEIGHT (`viewBox="0 0 300 194"`, and the svg's `max-width` is 300), so
   this is the height the picture already draws at and not a crop: below 300px of room the viewBox
   letterboxes inside the box rather than distorting, which is `preserveAspectRatio`'s default and
   what every other surface drawing this component already gets. The pin in
   tests/component/prologue-handover.test.ts holds the two numbers together, so a rose that grows
   silently reddens instead of quietly pushing the controls down a scroll. */
.handover-rose :deep(.radar-svg) {
  height: 194px;
}

/* Set apart by a rail rather than by a heading, exactly as `.prologue-read` is: what he thinks is a
   different KIND of sentence from what the screen states. */
.handover-read {
  margin: 0 0 12px;
  padding: 0 0 0 10px;
  border-left: 3px solid var(--accent-soft);
}

.handover-read-label {
  margin: 0 0 3px;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
}

.handover-read-line {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink-2);
}

/* ⭐ THE BASE SENTENCE SITS ABOVE THE ROOM SENTENCE AND READS AS THE SAME VOICE, so it takes the
   same rule and adds only the gap. Not one step quieter and not one step louder: they are two
   statements the coach makes about the same girl, and marking one of them as the important one
   would be the screen deciding which the parent should care about. Same reasoning, and the same
   absence of a positional selector, as `.handover-answer`. */
.handover-read-base {
  margin-bottom: 6px;
}

/* WHAT SHE PLAYED. The money line's own treatment, one step brighter, because it is about her and
   the line under it is about the bill. */
.handover-played {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-2);
}

.handover-spent {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--ink-soft);
}

.handover-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ⚠ ONE RULE FOR BOTH ROWS AND NO POSITIONAL SELECTOR, for the reason `.prologue-answer` gives: a
   `:first-child` here would be the screen pointing at the answer it prefers, on the one screen whose
   entire subject is that the choice is the parent's. */
.handover-answer {
  display: block;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  font-size: 15px;
  line-height: 1.3;
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  cursor: pointer;
}

.handover-answer:hover:not(:disabled) {
  background: var(--accent-fill);
}

.handover-answer:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
