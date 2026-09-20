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
// ⚠ THE SIZE IS THE OTHER HALF OF THE OBJECT and it is not negotiable on a phone: 470px square, NOT
// scaled down to the viewport. See `SHEET_PX` in `shared/protocol/album.ts` for the measured reason.
//
// ⭐⭐⭐ AND AT 768 / 1024 IT GROWS, TO 540 AND 556 – the README's own numbers – WITHOUT THE COLLAGE
// INSIDE IT MOVING. That second clause is the whole of `.album-leaf` below, and it is worth the
// paragraph because the obvious implementation is the wrong one.
//
// The three layouts (`AlbumLayoutA/B/C.vue`) are absolute-positioned IN PIXELS against a 470px page:
// `left: 294px` for the pasted note, `top: 422px` for the loose line. A page that simply became 556px
// wide would leave that furniture huddled in the top-left corner under 86px of empty stock. Rewriting
// all three as percentages is the other obvious move, and it loses the thing the collage is made of –
// type sizes and photo heights are not percentages, so the handwriting would stay at 21px on a page
// half again as big.
//
// ⚠ SO THE PAGE SCALES ITS LEAF. `.album-leaf` is the 470-space the collages are drawn in; the paper
// is the sized box; `transform: scale()` between them means one number moves the whole page, type and
// photographs included. THE MOCKUPS SAY THIS IS THE DESIGN RATHER THAN A SHORTCUT: the pasted note
// begins at 62.5% of the sheet's width in AY (390) and at 62.2% in AW (1024) – the same collage
// photographed at two sizes. `transform` is rastered after layout, so the handwriting is not a
// stretched bitmap; it is set at 21 × 1.183 = 24.8px and hinted there.
//
// ⚠ THE FOUR NUMBERS LIVE ON `:root` (src/style.css), NOT HERE, and the reason is one file over:
// `AlbumScreen.vue`'s scroller has to be exactly one page wide past 768, and a custom property
// declared in this scoped stylesheet does not reach that one. `tests/component/album-wide.test.ts`
// holds the ladder to the README's three widths and to `shared/protocol/album.ts`'s constants.
</script>

<template>
  <div class="album-paper">
    <!-- The reference frame. Everything a layout positions is positioned against THIS box, at every
         width, which is why a collage never has to know how big the page it is on has become. -->
    <div class="album-leaf">
      <slot />
    </div>
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
  /* ⚠ THE LADDER IS READ, NOT DECLARED – see the header. Below 768 this token IS 470px, so not one
     pixel of the phone's page moves. */
  width: var(--album-sheet);
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

/* THE 470-SPACE. Square, positioned (so a layout's `inset: 0` means THIS box and not the page), and
   scaled from its top-left corner so that the scaled edge lands exactly on the page's edge:
   470 × 1.1489 = 540, 470 × 1.183 = 556. Below 768 the scale is 1 and this element is the page.
   ⚠ `transform-origin` IS LOAD-BEARING. The default is the centre, which would grow the leaf
   outwards in both directions and hang 35px of collage off the left edge of the page under the
   `overflow: hidden` above – a page that looks right on the right and is cropped on the left. */
.album-leaf {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--album-leaf);
  height: var(--album-leaf);
  transform: scale(var(--album-scale));
  transform-origin: left top;
}
</style>
