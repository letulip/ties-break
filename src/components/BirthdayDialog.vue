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
// because there is none on the wire either (engine/world/birthdayGift.ts: the field does not exist).
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
//
// ⭐⭐⭐ ROUND 45 #1 – THE PRESENTS SELECT, AND A PROCEED GIVES. The owner, on the deployed build:
// «в попапе дня рождения надо такой же паттерн использовать, как и в других местах – выбрали ответ –
// подтвердили кнопкой, чтобы не было случайных нажатий», and when the psychologist's ConfirmDialog
// was offered as the donor he named a different one: «скорее попап смол тока здесь больше подойдет».
// So the pattern here is the LIFE BEAT's, which KnockDialog already wears – round 42 #8's shape,
// copied rather than re-invented: a press on a row only MARKS it (the round-40 ball, `role="radio"`,
// `aria-checked`), and the Proceed that appears under the four is the one control that reaches
// `chooseGift`. Nothing about the question moved: there are still exactly four answers, still no way
// out that is not one of them, and the engine still re-validates the id it is handed.
//
// ⚠ THE PROCEED'S WORD IS NOT A NEW STRING. `Proceed` is the prologue's shipped confirm vocabulary
// (round 41 #9, `WALK_COPY.proceed`), the same word KnockDialog's own Proceed carries and the same
// one `lifeBeat.ts` hands the life beat. Invariant 4: reused verbatim, not coined.
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useDialogFocus } from '../composables/dialogFocus'
import StoreError from './ui/StoreError.vue'
import { playSfx } from '../audio/sfx'
import { weekLabel } from '../shared/dates'

const game = useGameStore()
const prompt = computed(() => game.snapshot?.birthdayPrompt ?? null)

// Guards a double-tap while the worker round-trips, exactly as KnockDialog does: `chooseGift` throws
// on a birthday that is already answered, so without this a fast second press would surface an error
// toast for a decision that actually succeeded.
const sending = ref(false)

/** ⭐ ROUND 45 #1 – WHICH PRESENT IS SELECTED, and it is the radio's `aria-checked`. Null on arrival,
 *  because nothing on this card may point at an answer – «не помечай, пусть игрок читает» is the
 *  owner's own rule about the ask, and a mark the player did not make would break it. It STAYS
 *  through a refused send: it is what he chose, not a claim the world took it. */
const chosen = ref<string | null>(null)

/** ⚠ AND IT IS CLEARED WHEN THE CARD GOES – `LifeBeatDialog`'s own watch, copied with the pattern
 *  rather than left behind. `App.vue` mounts this dialog under a `v-if`, so today the instance is
 *  destroyed between birthdays and this can never fire; it is here because the guarantee belongs to
 *  the CARD and not to whoever mounts it. Without it, a card that outlived its prompt would open next
 *  year with last year's present already marked and a Proceed standing under a question nobody has
 *  answered – which is «случайные нажатия» arriving by a different door, a year later. */
watch(prompt, (p) => {
  if (p === null) chosen.value = null
})

/** The first tap: mark the present. Giving it is `confirm()`'s alone – «чтобы не было случайных
 *  нажатий», which is the whole of the item. */
function select(giftId: string): void {
  if (sending.value) return
  chosen.value = giftId
}

/** The second tap: the Proceed, and the ONE control that reaches the engine. */
async function confirm(): Promise<void> {
  const giftId = chosen.value
  if (giftId === null || sending.value) return
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

/** ⭐ THE RADIO GROUP'S OWN KEYS – `LifeBeatDialog`'s handler and `KnockDialog`'s copy of it, with
 *  the same documented variation: the arrows move FOCUS and do not select, because selecting on
 *  focus would hand her a present with an arrow key. Space and Enter are the button's own. */
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
      <h2 id="birthday-dialog-title" class="season-summary-title">{{ prompt.heading }}</h2>

      <!-- ⭐ THE ASK, IN PROSE, AND NOTHING BELOW IT IS MARKED. One of the four rows answers this and
           three do not; the player reads. -->
      <p id="birthday-ask" class="birthday-ask">{{ prompt.ask }}</p>

      <!-- ⚠⚠ W2 (26.09) – THE STORE'S REFUSAL, ABOVE THE FOUR ROWS – ForkDialog's own arrangement and
           its reason. This card has no dismiss BY RULING (the header: «nothing» must be an explicit
           button, never a dismissal), so a refused Proceed left the player looking at four rows that
           were all answers to a question already refused, with nothing said. Reached without any
           engine bug by a second tab's SAVE_CONFLICT, whose sentence names the way out, and by B-02's
           refused mutation.
           ⚠ ABOVE `.birthday-choices`, so the rows and their Proceed stay last in the flow – which is
           where `measureDialog` reads the way out off. The card is capped and scrolls, so a line that
           appears only on a refusal cannot put the Proceed out of reach: measured with the line up at
           375x667 and 320x568 in tests/component/principles-w2-blocking-card-refusal.test.ts.
           ⚠ NO NEW WORDING, and nothing here marks an answer: `StoreError` renders whatever the store
           already wrote (invariant 4) and carries no class the do-not-mark ruling could catch on. -->
      <StoreError />

      <!-- FOUR ROWS IN A COLUMN, the owner's own ruling (quoted in full on the script side, where the
           house convention keeps his words and where the no-Cyrillic-in-a-template rule allows them).
           Four stacked rows fit on a 375px screen where four side-by-side buttons would not. The ORDER
           is the engine's and it is drawn, so no position carries information. Every row is the same
           class: there is no modifier here that could single one out.

           ⭐⭐⭐ ROUND 45 #1 – AND THEY SELECT NOW. A real radio group, named by the ask, exactly as
           the life beat's and the knock's are: the first tap marks a present (the ball says so on
           screen) and only the Proceed below gives it. No positional selector and no marked default
           anywhere: the owner's do-not-mark ruling, quoted on the script side, binds the SELECTION
           idiom as strictly as it bound the old rows. -->
      <div class="birthday-choices" role="radiogroup" aria-labelledby="birthday-ask" @keydown="onGroupKey">
        <button
          v-for="option in prompt.options"
          :key="option.id"
          class="birthday-choice"
          type="button"
          role="radio"
          :aria-checked="chosen === option.id"
          :disabled="sending"
          @click="select(option.id)"
        >
          <span class="birthday-mark" aria-hidden="true"></span>
          <span class="birthday-choice-text">
            <span class="birthday-choice-label">{{ option.label }}</span>
            <span class="birthday-choice-note">{{ option.note }}</span>
          </span>
        </button>
      </div>

      <!-- ⭐⭐⭐ ROUND 45 #1 – THE PROCEED. It APPEARS when a present is selected and never before (a
           way on drawn under an unanswered question would be offering to leave a card that is still
           asking), it is the ONE control that reaches `chooseGift`, and its word is the prologue's
           shipped confirm vocabulary rather than a coinage. While it is rendered it is the card's
           LAST element, which is what the phone-fit measurement reads the way out off. -->
      <button
        v-if="chosen !== null"
        class="birthday-proceed"
        type="button"
        :disabled="sending"
        @click="confirm()"
      >
        Proceed
      </button>
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
   predictable, which is exactly what «не помечай» forbids.

   ⭐⭐ ROUND 45 #1 – THE ROW GAINED THE BALL AND KEPT EVERYTHING ELSE. `.knock-choice`'s own shape,
   because that card made exactly this move one round earlier: the box becomes a row so the mark can
   sit left of a label/note column that is otherwise untouched. ⚠ THE TOKENS DO NOT MOVE. The wash and
   the soft edge are the four rows' shipped colours (round-17 #3's fix, every colour a declared token
   with no fallback) – converting a card to select-then-Proceed is not licence to repaint it, and the
   knock kept its own two grounds through the same conversion. */
.birthday-choice {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 11px 13px;
  text-align: left;
  border: 1px solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  cursor: pointer;
}

/* The label and its note, the column they always were – `min-width: 0` so a long present wraps
   inside the box instead of pushing the row wider than the card. */
.birthday-choice-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

/* THE MARK IS THE BALL – the round-40 selection idiom, byte-for-byte `.knock-mark`'s and
   `.life-beat-mark`'s box, so a radio on this card and a radio in a life beat are one control. The
   empty ring is the control being findable at all; the taken state is the ball itself. `aria-hidden`
   because the state is on the button – a decorative circle that announced itself would say it twice.
   Both states share a border box, so nothing on the row moves on a press. */
.birthday-mark {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  border: var(--stroke-hair) solid var(--accent-soft);
  background: transparent;
}

.birthday-choice[aria-checked='true'] .birthday-mark {
  border-color: var(--accent);
  background: var(--accent);
}

/* ⚠ THE STATE IS THE MARK AND THE EDGE, NEVER A FILL – `.life-beat-choice`'s rule and `.knock-choice`'s
   copy of it, kept so the selected present and the three unselected ones are read against the SAME
   ground. A fill would be the card marking an answer, which is the one thing it may never do. */
.birthday-choice[aria-checked='true'] {
  border-color: var(--accent);
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

/* ⭐ THE ADVANCE IDIOM for the one control that gives the present – the same declarations
   `.knock-proceed` and `.life-beat-proceed` carry, with the rows' own box metrics so the card does
   not jump when it appears. Every colour a declared token with no fallback (round-17 #3). */
.birthday-proceed {
  width: 100%;
  margin-top: 8px;
  padding: 11px 13px;
  text-align: center;
  border: var(--stroke-hair) solid var(--accent-soft);
  border-radius: var(--radius-frame);
  background: var(--accent-wash);
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  cursor: pointer;
}

.birthday-proceed:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
