<script setup lang="ts">
// ⭐ v48 – HER BIRTHDAY, AND WHAT YOU GIVE HER. docs/specs/birthday-and-gifts.md.
//
// The owner, 11.08: «День рождения как-то незаметно проходит… Важный момент, всё-таки» – round-16 #9.
//
// ⚠ IT IS THE SECOND DIALOG IN THE APP WITH NO WAY OUT THAT IS NOT AN ANSWER, and here that is a
// RULING rather than a consequence. The owner asked for the popup to fire ALWAYS («я бы оставил
// попап на ДР всегда»), and that forces one thing: "nothing" must be an explicit BUTTON, never a
// dismissal. If this could be closed with an X, then closing it would silently become the "gave
// nothing" branch – and the player would make that choice by accident, every year, and never know.
// So there are four buttons, all four are answers, `@click.self` is deliberately NOT wired, and
// Escape is passed no handler.
//
// ⚠ AND THERE IS NO PRICE ON THIS SCREEN. The owner: «про цену момент, давай не будем это учитывать
// в нашем кошельке вообще.» Nothing is charged, so nothing may be shown – a displayed price that is
// never taken would be a lie on the screen. There is no cents value anywhere in this component,
// because there is none on the wire either (see protocol `BirthdayGift`: the field does not exist).
//
// ⭐ SHE ASKS FOR SOMETHING, AND NOTHING MARKS THE ANSWER. The owner, 11.08: «отличный ход написать в
// этом попапе что-то вроде "она просила …" и один из вариантов это удовлетворит, другие нет», and
// then «не помечай, пусть игрок читает». So: the ask is one line of prose above the four rows, and
// there is no highlight, no badge, no ordering rule and no class that could grow one. This component
// COULD NOT mark the answer even if a later hand wanted it to – `askedId` is not on the snapshot at
// all, and `chooseGift` re-derives it engine-side. The only correspondence is the English.
//
// THE COPY COMES OFF THE SNAPSHOT, NOT OUT OF THIS FILE – the same rule KnockDialog and KidScreen
// keep. `birthdayPrompt` carries the ask and the four labelled rows, all assembled in
// engine/world/birthday.ts where they can be tested. This template's own words are the kicker.
import { computed, ref, useTemplateRef } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import { playSfx } from '../audio/sfx'
import { weekLabel } from '../shared/dates'

const game = useGameStore()
const prompt = computed(() => game.snapshot?.birthdayPrompt ?? null)

// Guards a double-tap while the worker round-trips, exactly as KnockDialog does: `chooseGift` throws
// on a birthday that is already answered, so without this a fast second press would surface an error
// toast for a decision that actually succeeded.
const sending = ref(false)
async function choose(giftId: string): Promise<void> {
  if (sending.value) return
  sending.value = true
  try {
    await game.chooseGift(giftId)
    // ⚠ `clickSoft` AND NOT A NEW ASSET, and nothing at all on MOUNT. KnockDialog opens on `ooh`
    // because a knock is an alert; a birthday is not, and the celebration this scene owns is the
    // confetti on Home rather than a sting over the choice. No sound the manifest does not have.
    playSfx('clickSoft')
  } finally {
    sending.value = false
  }
}

// FOUR ROWS, IN A COLUMN – the owner, 11.08: «в колонку ставь, там хватит места». Four stacked rows
// fit on a 375px screen where four side-by-side buttons would not, and it settles the layout question
// the spec's §5 had been holding open. His words live here rather than in the template because a Vue
// `<template>` may carry no Cyrillic (tests/template-copy-rules.test.ts), which is the same rule that
// keeps KidScreen's owner quotes on its script side.
//
// D1 – IT IS A MODAL, AND IT SAYS SO AND HOLDS THE KEYBOARD. Escape is passed no handler for the
// reason at the top of this file: there is no way out that is not an answer.
const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card)
</script>

<template>
  <div v-if="prompt" class="dialog-overlay">
    <div
      ref="card"
      class="dialog-card season-summary birthday-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="birthday-dialog-kicker birthday-dialog-title"
      tabindex="-1"
    >
      <p id="birthday-dialog-kicker" class="season-summary-kicker">
        Her birthday – {{ weekLabel(prompt.week) }}
      </p>
      <h2 id="birthday-dialog-title" class="season-summary-title">She is {{ prompt.age }} today.</h2>

      <!-- ⭐ THE ASK, IN PROSE, AND NOTHING BELOW IT IS MARKED. One of the four rows answers this and
           three do not; the player reads. -->
      <p class="birthday-ask">{{ prompt.ask }}</p>

      <!-- FOUR ROWS IN A COLUMN, the owner's own ruling (quoted in full on the script side, where the
           house convention keeps his words and where the no-Cyrillic-in-a-template rule allows them).
           Four stacked rows fit on a 375px screen where four side-by-side buttons would not. The ORDER
           is the engine's and it is drawn, so no position carries information. Every row is the same
           class: there is no modifier here that could single one out. -->
      <div class="birthday-choices">
        <button
          v-for="option in prompt.options"
          :key="option.id"
          class="birthday-choice"
          :disabled="sending"
          @click="choose(option.id)"
        >
          <span class="birthday-choice-label">{{ option.label }}</span>
          <span class="birthday-choice-note">{{ option.note }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Shares `dialog-overlay` / `dialog-card` / `season-summary*` with the other blocking popups, so the
   scrim, the card and the two heading lines cannot drift apart from them. What is local is the ask
   line and the column of four.

   ⚠ EVERY COLOUR HERE IS A DECLARED APP TOKEN WITH NO FALLBACK, AND THAT IS THE FIX FOR ROUND-17 #3.
   This block shipped writing `background: var(--card, #fff)` and `color: var(--ink, #1c1c1e)` – a
   light-theme pair, in a dark app. `--card` and `--hairline` are declared NOWHERE in this codebase,
   so the fallbacks won and the buttons painted white; `--ink` IS declared, at `#f2f6f8`. The result
   was four buttons of near-white text on white – a MEASURED 1.09:1 – on the one dialog in the game
   the player cannot dismiss, so a player who could not read them was looking at four blank rows with
   no way past. `tests/component/birthday-dialog.test.ts` now measures the ratio through the real
   cascade; `tests/design-tokens.test.ts` rule A never could, because it skips any `var()` that
   carries a fallback, which is what both broken references were.

   THE TOKENS ARE KNOCKDIALOG'S, not a new palette: `.knock-choice` is the same object – a stacked
   two-line choice row in a blocking popup – and the two should not drift apart. A fallback is only
   honest when the token is optional; for a colour that must be legible it is a second, unreviewed
   design nobody ever looks at. */
.birthday-ask {
  margin: 10px 0 14px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text);
}

.birthday-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ⚠ ONE RULE FOR ALL FOUR, AND NO `:first-child` / `:nth-child` ANYWHERE. Any positional selector
   here would be a mark by another name the moment the engine's shuffle put the answer somewhere
   predictable, which is exactly what «не помечай» forbids. */
.birthday-choice {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  border: 1px solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  cursor: pointer;
}

/* All four together, so the hover cannot become a mark either. */
.birthday-choice:hover:not(:disabled) {
  background: var(--accent-fill);
}

.birthday-choice:disabled {
  opacity: 0.55;
  cursor: default;
}

.birthday-choice-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.birthday-choice-note {
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--muted);
}
</style>
