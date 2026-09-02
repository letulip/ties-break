<script setup lang="ts">
// ⭐⭐ THE MUSIC SWITCH, AS AN ICON IN THE CORNER – owner, 02.09: «вынести выключение звука (или
// музыки) отдельной пиктограммой в правый верхний угол».
//
// ⚠⚠ IT IS THE EXISTING CONTROL, NOT A NEW ONE. Three things are borrowed rather than invented and
// each one is a place this could otherwise have grown a second setting:
//
//   * THE STATE is `tb-music-muted`, through `isMusicMuted()` / `setMusicMuted()` – the same two
//     functions More's `Music` row calls. Muting here is muted there and survives a reload; there
//     is no per-screen preference and nothing new is persisted.
//   * THE NAME is `AUDIO_COPY.music`, which is literally More's own row label, moved into a shared
//     module so the two surfaces cannot drift (see composables/audioCopy.ts). Not one new word.
//   * THE SEMANTICS are More's too: `role="switch"` with an honest `aria-checked`, so a screen
//     reader hears the same control it hears on the Sound screen. `aria-label` rather than
//     `aria-labelledby` only because there is no visible text to point at here.
//
// ⚠ AND IT IS THE *MUSIC* SWITCH, WHICH IS A CHOICE AND IS WORTH RECORDING. His words allowed
// either («звука (или музыки)»). The continuous sound during the prologue is the theme loop –
// SplashScreen calls `music.start()` on the tap that gets the player in, and the nine cards are the
// very next screen – while `sfx` is a click cue that only fires on a press. One icon can honestly
// report one flag: an icon that wrote BOTH keys would have no true state to draw whenever the two
// disagreed, which they can, because More can still set them independently.
//
// ⚠ WHY IT IS NOT IN `PrologueCard.vue`. The card's own fit measurement reads the way out off the
// card's bottom edge and requires `.prologue-answers` to be the LAST element in the card
// (tests/component/prologue-walk.test.ts asserts it by name). A control inside the card would
// either break that or add a row to the tallest screen in the game. This is a sibling of the
// overlay, `position: fixed`, so it costs the card no height at all and is in the same place on
// every one of the ten scenes.
import { ref } from 'vue'
import { isMusicMuted, setMusicMuted } from '../audio/music'
import { AUDIO_COPY } from '../composables/audioCopy'

/** Plain localStorage-backed state, read once on mount exactly as More's row reads it – no audio
 *  node is created here, so the control works before the track has ever played. */
const muted = ref(isMusicMuted())

function toggle(): void {
  setMusicMuted(!muted.value)
  muted.value = !muted.value
}
</script>

<template>
  <button
    class="mute-button"
    type="button"
    role="switch"
    :aria-checked="!muted"
    :aria-label="AUDIO_COPY.music"
    :title="AUDIO_COPY.music"
    @click="toggle"
  >
    <!-- The house icon idiom: a 22px inline stroke glyph on `currentColor`, exactly as Home's own
         header tools are drawn. `aria-hidden` because the button is already named. -->
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4z"></path>
      <template v-if="muted">
        <path d="m22 9-6 6"></path>
        <path d="m16 9 6 6"></path>
      </template>
      <template v-else>
        <path d="M15.5 8.5a5 5 0 0 1 0 7"></path>
        <path d="M18.5 5.5a9 9 0 0 1 0 13"></path>
      </template>
    </svg>
  </button>
</template>

<style scoped>
/* ⚠ FIXED TO THE SCREEN'S TOP-RIGHT, over the modal layer the prologue's own overlay sits on
   (`.dialog-overlay` is z-index 60) and under the update banner (70) and the coach tour (65), so
   nothing this can cover is something the player has to reach.

   The insets are the shell's own tokens rather than literals - src/style.css records what a guessed
   `-16px` cost the last time a hero was placed by eye - plus the notch, because this is the one
   control on the screen that sits under it.

   ⚠ EVERY COLOUR IS A DECLARED TOKEN WITH NO FALLBACK, the rule round-17 #3 wrote for this app: a
   `var(--x, #fff)` on a control that has to be readable is a second design nobody reviews. */
.mute-button {
  position: fixed;
  top: calc(var(--app-pad-top) + env(safe-area-inset-top, 0px));
  right: var(--app-pad-x);
  z-index: 61;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  /* ⚠ `50%`, NOT `--radius-pill`, and src/style.css is explicit about which goes where: the pill
     token is for a WIDE, SHORT element, where 999px is clamped to half the height and gives a
     capsule; 50% is for a SQUARE one, where it gives a real circle. This is 40x40. Putting the pill
     on it would work today and stop working the moment the box stopped being square. */
  border-radius: 50%;
  border: var(--stroke-hair) solid var(--line);
  background: var(--panel);
  color: var(--ink-2);
  cursor: pointer;
}

.mute-button:hover {
  background: var(--card-top);
}

/* Off reads as off: the glyph drops to the app's dim ink, which is the same signal every disabled
   or inactive control on this app uses, rather than a colour invented for this one button. */
.mute-button[aria-checked='false'] {
  color: var(--ink-dim);
}
</style>
