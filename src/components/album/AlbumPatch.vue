<script setup lang="ts">
// THE CLUB PATCH – the embroidered crest sewn onto the opening sheet (mockup AY, bottom left).
//
// ⚠⚠ THE NAME IS NEVER THIS FILE'S. «RIVERSIDE TENNIS» on the mockup is the mockup's invention, and
// spec §8b rules what replaces it: our childhood club and academy are nameless, so the engine pulls
// a name from a small pool of FICTIONAL ones, keyed off the seed – stable when the album is opened
// again, and stepping on no trademark. It arrives as a string; this component sews it on.
//
// THE CREST IS TWO BORDER-RADII AND NOTHING ELSE. A shield is a rectangle whose bottom corners run
// away with themselves; an elliptical radius on the bottom pair is exactly that curve, and it costs
// no path, no mask and no file.
defineProps<{ name: string }>()
</script>

<template>
  <div class="album-patch">
    <p class="album-patch-name">{{ name }}</p>
    <!-- Crossed racquets: two ellipse outlines leaning against each other, each with its handle as
         a pseudo-element. Drawn rather than lettered, because at 14px a glyph font would be a
         smudge and this reads as stitching. -->
    <span class="album-patch-mark" aria-hidden="true">
      <span></span>
      <span></span>
    </span>
  </div>
</template>

<style scoped>
.album-patch {
  --album-patch-cloth: #1d3868;
  --album-patch-thread: #e6ddc4;

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
  background: linear-gradient(160deg, #24447a, var(--album-patch-cloth));
  color: var(--album-patch-thread);
  text-align: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.34);
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

.album-patch-mark {
  display: block;
  position: relative;
  height: 22px;
  margin-top: 6px;
}

.album-patch-mark span {
  position: absolute;
  left: 50%;
  top: 0;
  width: 9px;
  height: 13px;
  border: 1.2px solid var(--album-patch-thread);
  border-radius: 50%;
}

.album-patch-mark span::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 1.2px;
  height: 8px;
  background: var(--album-patch-thread);
}

.album-patch-mark span:first-child {
  transform: translateX(-50%) rotate(-24deg);
}

.album-patch-mark span:last-child {
  transform: translateX(-50%) rotate(24deg);
}
</style>
