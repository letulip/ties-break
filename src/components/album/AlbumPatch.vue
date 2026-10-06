<script setup lang="ts">
// THE CLUB PATCH – the embroidered crest sewn onto the opening sheet (mockup AY, bottom left).
//
// ⚠⚠ THE NAME IS NEVER THIS FILE'S. «RIVERSIDE TENNIS» on the mockup is the mockup's invention, and
// spec §8b rules what replaces it: our childhood club and academy are nameless, so the engine pulls
// a name from a small pool of FICTIONAL ones, keyed off the seed – stable when the album is opened
// again, and stepping on no trademark. It arrives as a string; this component sews it on.
//
// ⭐⭐ ROUND 47 #16 – IT GOES THE TICKET'S WAY («по аналогии с билетом разными цветами и с разными названиями
// вымышленными, иконка на эту бирку со скрещенными ракетками во вложении»):
//   * THE CLOTH CARRIES THE RANK, exactly as the pass's ink does. `patch.step` is the design system's tier step,
//     decided engine-side (`albumChapterStep` in albumBook.ts, off `ALBUM_TIER_STEP`), and the four cloths below are the
//     PASS'S OWN four pairs – `--tier-<step>` scaled ×0.38 (the face) and ×0.27 (the deep end of the sheen) – so the
//     album still adds no colour of its own. The hexes are literal for the pass's reason (`color-mix()` computes to the
//     empty string under happy-dom) and `tests/component/r47-b2-album-ticket-patch.test.ts` re-derives all eight from
//     `--tier-*` at runtime.
//   * THE MARK IS HIS ICON, INLINE. The crossed racquets he attached (`public/icons/tennis-svgrepo-com.svg`, kept as
//     received; his alternative, the ball, sits beside it as `tennis-ball-2-svgrepo-com.svg` – one swap away: replace the
//     two `<path d>` below with its paths). Reworked from `fill="#000000"` at 800px to `fill="currentColor"` at 22px, so
//     the thread colour tints it and the step's cloth sits behind it. INLINE AND NOT A MASKED FILE, like the baggage tag's
//     cord: a CSS mask is exactly what a raster export of the page would leave empty.
import type { AlbumClubPatch } from '../../shared/protocol'

defineProps<{ patch: AlbumClubPatch }>()
</script>

<template>
  <div class="album-patch" :class="`album-patch-${patch.step}`">
    <p class="album-patch-name">{{ patch.name }}</p>
    <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools (tennis-svgrepo-com.svg, his attachment) -->
    <svg class="album-patch-mark" viewBox="0 0 64.006 64.006" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M61.188,18.038c-4.755-4.755-13.946-3.3-20.487,3.24c-3.123,3.124-5.2,6.941-5.847,10.747 c-0.609,3.582,0.118,6.76,2.023,9.075l-4.874,4.875l-4.875-4.876c4.021-4.906,2.43-13.567-3.821-19.82 c-6.543-6.54-15.732-7.996-20.488-3.24c-2.35,2.348-3.275,5.808-2.606,9.74c0.646,3.807,2.723,7.624,5.847,10.748 c3.943,3.943,8.85,6.038,13.167,6.038c2.442,0,4.693-0.676,6.478-2.061l4.886,4.886l-9.656,9.658c-0.391,0.391-0.391,1.023,0,1.414 c0.195,0.195,0.451,0.293,0.707,0.293c0.256,0,0.512-0.098,0.707-0.293l9.656-9.658l9.656,9.658 c0.195,0.195,0.451,0.293,0.707,0.293c0.256,0,0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.024,0-1.414l-9.656-9.658l4.886-4.886 c1.784,1.386,4.034,2.061,6.478,2.061c4.317,0,9.224-2.095,13.167-6.038c3.124-3.124,5.2-6.94,5.847-10.748 C64.463,23.846,63.537,20.386,61.188,18.038z M7.473,37.112c-2.833-2.833-4.712-6.267-5.289-9.668 c-0.557-3.276,0.171-6.114,2.049-7.991c1.516-1.515,3.602-2.241,5.927-2.241c3.773,0,8.167,1.916,11.733,5.481 c5.762,5.763,7.215,13.685,3.24,17.66C21.157,44.326,13.235,42.873,7.473,37.112z M61.822,27.443 c-0.577,3.402-2.456,6.835-5.289,9.668c-5.764,5.763-13.685,7.214-17.66,3.24c-1.877-1.877-2.604-4.715-2.048-7.991 c0.578-3.402,2.456-6.836,5.289-9.669c3.566-3.566,7.96-5.481,11.732-5.481c2.323,0,4.412,0.726,5.927,2.241 C61.651,21.329,62.379,24.167,61.822,27.443z" />
      <path d="M33.003,15.253c2.757,0,5-2.243,5-5c0-2.757-2.243-5-5-5c-2.757,0-5,2.243-5,5C28.003,13.01,30.246,15.253,33.003,15.253z M33.003,7.253c1.654,0,3,1.346,3,3s-1.346,3-3,3c-1.654,0-3-1.346-3-3S31.349,7.253,33.003,7.253z" />
    </svg>
  </div>
</template>

<style scoped>
.album-patch {
  /* the budget step, so a patch that somehow arrived without a class is still a legible one */
  --album-patch-thread: #e6ddc4;
  --album-patch-ink: #364451;
  --album-patch-ink-deep: #27303a;

  width: 96px;
  padding: 16px 10px 14px;
  /* ⚠ 1.5px AND NOT 2px, and the rule is the owner's of 30.07 rather than a preference here: nothing
     in the app is OUTLINED with more than a hairline, and this crest shipped at 2 and went red on
     `tests/ui-control-system.test.ts`. The pin's own carve-out is what 1.5 sits in – a drawn stroke
     on the design's 24x24 / 1.5-1.9 grid is ARTWORK rather than an edge – and it is the weight the
     crossed racquets inside this patch were already drawn at (1.2px), so the stitching now reads as
     one hand instead of two. ⭐ NOT added to the pin's `KNOWN` list: that list is for a width that is
     a MECHANISM (the runner-up's gradient border, invisible at 1px), and an embroidered edge that
     looks the same a half-pixel thinner is not one. */
  border: 1.5px solid var(--album-patch-thread);
  border-radius: 8px 8px 50% 50% / 8px 8px 38% 38%;
  /* ⚠ THE FLAT COLOUR IS DECLARED AND THE SHEEN RIDES ON TOP OF IT – the pass's reason: a contrast measurement
     walking up from the text must find a colour, and the lighter end is the worst case. */
  background-color: var(--album-patch-ink);
  background-image: linear-gradient(160deg, var(--album-patch-ink), var(--album-patch-ink-deep));
  color: var(--album-patch-thread);
  text-align: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.34);
}

/* THE FOUR STEPS – the pass's own pairs: `--tier-<step>` ×0.38 and ×0.27. In ladder order. */
.album-patch.album-patch-budget {
  --album-patch-ink: #364451;
  --album-patch-ink-deep: #27303a;
}
.album-patch.album-patch-middle {
  --album-patch-ink: #4f561f;
  --album-patch-ink-deep: #383d16;
}
.album-patch.album-patch-high {
  --album-patch-ink: #563112;
  --album-patch-ink-deep: #3d230d;
}
.album-patch.album-patch-elite {
  --album-patch-ink: #3b3051;
  --album-patch-ink-deep: #2a2239;
}

.album-patch-name {
  margin: 0;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* 22px, the height the drawn racquets it replaces stood at, so the patch is still the 83px box `albumPlacement`
   holds for it. The glyph is solid, so at this size it reads as embroidery and not as a smudge. */
.album-patch-mark {
  display: block;
  width: 22px;
  height: 22px;
  margin: 6px auto 0;
}
</style>
