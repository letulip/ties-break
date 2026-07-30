<script setup lang="ts">
// THE ICON, ONCE (owner, 30.07: «Surface type similar icon across every screen – it means this icon
// is not a component»). He was diagnosing the surface ring, but the sentence is true of every glyph
// in the app: an icon that is repeated MARKUP is an icon that drifts, and this app had four separate
// idioms for drawing one - a masked `<span>` hand-built in App.vue's tab bar, inline `<svg>` in six
// components, a `&larr;`/`✕` CHARACTER in seven templates, and an emoji in three.
//
// This is the door for the FILE idiom: everything under `public/icons/`. It keeps App.vue's mask
// technique, because that technique is the reason one file can serve every colour - a mask takes
// only the SVG's alpha and paints it in the caller's own ink, so `back.svg` is the same file in the
// Coach Market's muted grey and on the tournament hero's white-on-art.
//
// WHY A MASK AND NOT `<img>`: an `<img>` renders the file's own colours, so a themed glyph needs one
// file per colour. Why not inline `<svg>`: that is the markup this component exists to stop
// repeating, and it cannot be cached by the browser as an asset.
//
// WHAT THE CALLER OWNS: the size and the colour. Colour arrives as `currentColor` - set `color` on
// the caller and the glyph follows - so no caller ever passes a colour to this component, and the
// one-accent rule cannot be broken through it.
//
// ⚠ NOT a replacement for a glyph that is genuinely part of a sentence. `.strip-arrow`'s `→` between
// two chips is punctuation, not an icon, and it stays a character.
withDefaults(
  defineProps<{
    /** File basename under `public/icons/`, e.g. `back` -> `public/icons/back.svg`. */
    name: string
    /** Square edge in px. The tab bar's 20 is the default because it is the app's commonest size. */
    size?: number
  }>(),
  { size: 20 },
)

// BASE_URL, not a bare absolute path: the PWA ships under a sub-path and a leading-slash URL would
// 404 there. Same expression App.vue's `iconUrl` already uses.
const iconUrl = (name: string): string => `${import.meta.env.BASE_URL}icons/${name}.svg`
</script>

<template>
  <span
    class="tb-icon"
    aria-hidden="true"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      WebkitMaskImage: `url(${iconUrl(name)})`,
      maskImage: `url(${iconUrl(name)})`,
    }"
  ></span>
</template>

<style scoped>
/* The mask geometry only. `background-color: currentColor` is the whole colour contract: the glyph
   is whatever ink the caller is already using, and it follows hover and disabled states for free
   because those change `color`. */
.tb-icon {
  display: block;
  flex: none;
  background-color: currentColor;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
</style>
