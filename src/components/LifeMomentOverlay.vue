<script setup lang="ts">
// ⭐⭐ ROUND 46 #11c – THE FULL-SCREEN MOMENT: the wedding day and the birth, SHOWN.
//
// The owner, round 46 #11 (05.10, verbatim): «Я дождался свадьбы, но самого экрана этого события не было!
// Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать оверлей
// на весь экран, например.»
//
// WHAT WAS WRONG: `landWedding` and `landBirth` resolve as a feed line plus an album milestone – a silent
// resolution – so the wedding day passed as one more row although the bride painting has been on disk since
// the art set shipped. The funeral and both announcement cards are life BEATS and already have a card
// (`LifeBeatDialog`, the funeral with its painting). This is the missing one: the DAYS.
//
// ⚠⚠ THIS COMPONENT OWNS NO SENTENCE – `LifeBeatDialog`'s own law, for its own reason. The line is the feed's
// kept text for the day and the control's label is `LIFE_MOMENT_CONFIRM`; both arrive on `snapshot.lifeMoment`,
// engine-assembled, and are rendered verbatim. A component with words of its own is a second place the words
// can be edited from (CLAUDE.md invariant 4), and `tests/component/life-moment-overlay.test.ts` asserts the
// rendered text is EXACTLY those two strings.
//
// ⚠⚠ A BLOCKING OVERLAY THAT CANNOT BE DISMISSED ON A PHONE KILLS A CAREER – CLAUDE.md's popup law, round-20
// #3. So the card is the shared `dialog-card` (its height cap and scroll are the app's, in `style.css`) and the
// ONE control is the last thing in it; the mounted test measures that control's box inside 375x667 and was
// watched going red on a too-tall mutation before it was trusted. The control is not disabled by anything –
// closing this card has no engine consequence, which is exactly why (unlike an answer card) Escape may close it.
//
// FOCUS lands on the CARD and is not handed back (`LifeBeatDialog`'s own reasoning): this overlay is raised over
// the press that played the week, and returning focus to that button re-fires a held Enter.
import { computed, useTemplateRef } from 'vue'
import { portraitUrl } from '../art/preload'
import { useKidEmotion } from '../composables/kidEmotion'
import { useLifeMoment } from '../composables/lifeMoment'
import { useDialogFocus } from '../composables/dialogFocus'
import { playSfx } from '../audio/sfx'
// ⚙ L2-10b (08.10) – THE LAW HOLDS, AND THE ONE CONTROL LABEL IS READ THROUGH THE CATALOG: `t(moment.confirm)` looks the engine's own literal (`LIFE_MOMENT_CONFIRM`, a CERTAIN
// `Continue` key already) up as a DYNAMIC key, LifeBeatDialog's L2-9b seat exactly. The line stays the feed's kept text, verbatim; English renders itself.
import { eventText, t } from '../i18n'

const { moment, dismiss: dismissMoment } = useLifeMoment()
const { stage } = useKidEmotion()

/** ⚠ THE KIND CROSSES THE WIRE AND THE VIEW RESOLVES THE BAND (`BEAT_FACE`'s seam in LifeBeatDialog): the
 *  engine may not name a file, and `portraitUrl` resolves the band BEFORE it builds the name, so a wedding at
 *  thirty-one asks for the one band `bride` is painted in rather than a file that is not on disk. */
const art = computed(() => (moment.value === null ? null : portraitUrl(stage.value, moment.value.face)))

function dismiss(): void {
  playSfx('clickSoft')
  dismissMoment()
}

const card = useTemplateRef<HTMLElement>('card')
useDialogFocus(card, dismiss, { focusOn: 'card', restore: false })
</script>

<template>
  <div v-if="moment" class="dialog-overlay life-moment-scrim">
    <!-- The role and `aria-modal` go on the CARD, not on the scrim; `tabindex="-1"` is the focus trap's
         landing place. The card is named by the line it carries – there is no heading, and inventing one
         would be a sentence of this component's own. -->
    <div
      ref="card"
      class="dialog-card life-moment"
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-moment-line"
      tabindex="-1"
    >
      <!-- ⚠ `alt=""` – atmosphere beside a line that already says what happened; a screen reader that read
           the picture too would say it twice (LifeBeatDialog's own note on its funeral painting). -->
      <img v-if="art" class="life-moment-art" :src="art" alt="" />
      <p id="life-moment-line" class="life-moment-line">{{ eventText({ text: moment.line, c: moment.lineC }) }}</p>
      <button type="button" class="life-moment-go" @click="dismiss">{{ t(moment.confirm) }}</button>
    </div>
  </div>
</template>

<style scoped>
/* Shares `dialog-overlay` / `dialog-card` with the other popups, so the scrim, the box and the height cap
   cannot drift from them – the cap is what keeps the control reachable (see the header). What is local is
   the painting and the line. */
.life-moment {
  text-align: center;
}

.life-moment-art {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  object-position: 50% 30%;
  border-radius: 10px;
  margin: 0 0 14px;
}

.life-moment-line {
  margin: 0 0 16px;
  line-height: 1.45;
}

.life-moment-go {
  width: 100%;
}
</style>
