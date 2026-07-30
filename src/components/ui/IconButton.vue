<script setup lang="ts">
// THE ICON BUTTON - a control whose whole label is one glyph. The app had two shapes doing this job
// and no name for either, which is half of the owner's "some square, some round" (30.07): a 32px
// CIRCLE on a panel plate (`.replay-close` in four overlays, `.tier-guide-btn` in Season's header)
// and a BARE glyph with no plate at all (`.back-link` on three screen headers, `.diary-tool`,
// `.kid-tool`, `.week-close`). Both are real and they mean different things, so this component
// carries both and names them:
//
//   `plate` – it sits ON something (a photo, a dialog's corner, a header row). The circle is what
//             makes it hittable and legible against whatever is behind it.
//   `bare`  – it sits IN a header, in the reading order, and a plate would make it the loudest thing
//             on a screen whose subject is elsewhere. The glyph IS the affordance (the R3 owner
//             ruling that took the Coach Market's back arrow off its plate says exactly this).
//
// A CIRCLE IS `50%`, NEVER `--radius-pill`. The note at the top of src/style.css is about precisely
// this control: 999px on a square is clamped to half the height and looks identical, but on anything
// that is not square it is a capsule. `.tb-iconbtn` is square by construction, so both would render
// the same today - and the day someone gives it a label as well as a glyph, only `50%` would be
// wrong in a way that shows.
//
// WHY IT TAKES A NAME AND NOT A SLOT for the glyph: the point of the slice is that the icon is a
// COMPONENT, so the default path has to be the one that cannot drift. The slot is still there for
// the one control that is genuinely typographic - Season's "?" - because a question mark is a letter
// and drawing it as an asset would be silly.
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    /** Icon file basename under `public/icons/`. Omit and pass a default slot instead. */
    icon?: string
    /** Required when `icon` is used: the glyph is `aria-hidden`, so this is the control's name. */
    label?: string
    /** `plate` = the 32px circle; `bare` = the glyph alone. */
    variant?: 'plate' | 'bare'
    /** Glyph edge in px. The plate stays 32 either way; this sizes what is inside it. */
    iconSize?: number
    disabled?: boolean
  }>(),
  { icon: undefined, label: undefined, variant: 'plate', iconSize: 18, disabled: false },
)
</script>

<template>
  <button
    type="button"
    class="tb-iconbtn"
    :class="`tb-iconbtn--${variant}`"
    :disabled="disabled"
    :aria-label="label"
  >
    <AppIcon v-if="icon" :name="icon" :size="iconSize" />
    <slot v-else />
  </button>
</template>

<style scoped>
.tb-iconbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

/* The 32px round button, verbatim from `.replay-close` / `.tier-guide-btn`, which is the pair this
   absorbs. The plate is `--panel` and a hairline, so it reads as a small piece of chrome laid on
   the surface rather than as a hole in it. */
.tb-iconbtn--plate {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--panel);
  color: var(--text);
  font-size: 16px;
  line-height: 1;
}

/* No plate, no border, no padding: the R3 back control. Its box is still 32px so the thumb target
   survives, but nothing is drawn around the glyph. */
.tb-iconbtn--bare {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--muted);
}

.tb-iconbtn:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

/* `bare` has no border to light up, and turning the glyph lime for a mouse-over would spend the
   app's one accent on the least important control on the screen. It brightens to full ink instead -
   the behaviour `.back-link` already had. */
.tb-iconbtn--bare:hover:not(:disabled) {
  color: var(--text);
}

.tb-iconbtn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
