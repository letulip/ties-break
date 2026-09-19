<script setup lang="ts">
// ⭐⭐⭐ THE PAPER – THE SQUARE SHEET EVERY LAYOUT IS DRAWN ON, AND IT IS ENTIRELY CSS.
//
// ⚠⚠ NO FILE AND NO SVG FILTER, AND THAT IS THE OWNER'S OWN CONSTRAINT RATHER THAN A PREFERENCE.
// His README beside the mockups (`album_responsive/README.md`) says why in one clause: an SVG
// filter «выпадает пустой при растровом экспорте» – it comes out EMPTY on raster export, so a
// texture built on `feTurbulence` is a texture that exists on his screen and not in the picture he
// sends back. A raster tile would be the other failure: a repeating image at this scale bands
// visibly and costs a request. Gradients are the one recipe that is neither.
//
// THE RECIPE, HIS, NUMBER FOR NUMBER:
//   * `#e7dcc2` – the stock.
//   * three very fine `repeating-linear-gradient`s at 41deg / 117deg / 74deg with periods of
//     3 / 4 / 5px. ⚠ THE THREE PERIODS ARE PAIRWISE COPRIME ON PURPOSE: 3, 4 and 5 beat against
//     each other over 60px, so the overlay reads as irregular speckle instead of as three sets of
//     stripes. Change one of them to 2, 4 and 6 and the moire becomes legible – that is the whole
//     of why the numbers are written down rather than chosen at the keyboard.
//   * two aged blotches in the corners, and a light wash from the top left.
//
// RULING LINES ARE NOT HERE. «Линовка осталась только на приклеенных записках» – the ruling belongs
// to the notes pasted ON the paper (`PaperNote`'s `ruled`), never to the page under them.
//
// ⚠ THE SIZE IS THE OTHER HALF OF THE OBJECT and it is not negotiable at this width: 470px square,
// NOT scaled down to the viewport. See `SHEET_PX` in `albumWire.ts` for the measured reason.
import { SHEET_PX } from './albumWire'
</script>

<template>
  <div class="album-paper" :style="{ width: `${SHEET_PX}px` }">
    <slot />
  </div>
</template>

<style scoped>
.album-paper {
  /* Private to this file – not design-system vocabulary, so it is declared where it is used
     (tests/design-tokens.test.ts rule B allows exactly this and forbids a copied shared token). */
  --album-stock: #e7dcc2;
  --album-fleck: rgba(116, 94, 56, 0.055);
  --album-fleck-soft: rgba(116, 94, 56, 0.042);
  --album-fleck-light: rgba(255, 250, 236, 0.075);
  --album-age: rgba(138, 110, 62, 0.16);
  --album-wash: rgba(255, 253, 244, 0.5);

  position: relative;
  /* ⚠ `flex: none` MATTERS AS MUCH AS THE WIDTH. The scroller above is a flex row, and a flex item
     with a width still shrinks by default – which is exactly how a 470px sheet becomes a 342px one
     on a phone without a single line of the layout admitting it. */
  flex: none;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 2px;
  background-color: var(--album-stock);
  background-image:
    /* the wash, from the top left */
    radial-gradient(118% 96% at 7% 3%, var(--album-wash), rgba(255, 253, 244, 0) 58%),
    /* two aged blotches, opposite corners so the page has a diagonal rather than a frame */
    radial-gradient(36% 29% at 97% 7%, var(--album-age), rgba(138, 110, 62, 0) 72%),
    radial-gradient(42% 33% at 3% 96%, var(--album-age), rgba(138, 110, 62, 0) 74%),
    /* and the three fine rulings whose beat is the speckle */
    repeating-linear-gradient(41deg, var(--album-fleck) 0 1px, rgba(255, 255, 255, 0) 1px 3px),
    repeating-linear-gradient(117deg, var(--album-fleck-soft) 0 1px, rgba(255, 255, 255, 0) 1px 4px),
    repeating-linear-gradient(74deg, var(--album-fleck-light) 0 1px, rgba(255, 255, 255, 0) 1px 5px);
  color: var(--paper-ink);
  font-family: var(--font-hand);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
}
</style>
