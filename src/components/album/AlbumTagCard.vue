<script setup lang="ts">
// THE BAGGAGE TAG – layout C's tall object, hanging beside the big photograph on a drawn string
// (mockup AZ-C).
//
// WHAT IS REAL ON IT (spec §4): the stage it was won at, our own rank for the event, the
// tournament's FICTIONAL name out of the calendar, and her age that week. ⚠ The mockup's «ITF W15»
// is a trademark twice over and cannot ship; `tier` is whatever the engine's own ladder calls it.
//
// ⚠ THE STRING IS AN INLINE `<path>` AND THE ONLY ONE ON THIS SHEET. Everything else here is CSS –
// the tag, the punched hole, the dashed rule, the hatch along the bottom. A cord is the one shape
// that is genuinely a CURVE: two rotated divs give a V, and a V is a coat hanger rather than a piece
// of string. The README's constraint is about the PAPER's texture, where a filter comes out empty on
// raster export; a two-point path with no filter on it has neither problem.
//
// ⚠ ONE TONE, PENDING HIS PALETTE – the same open question as the pass (spec §9). Rank is meant to
// deepen the colour; the ramp is his to give.
import type { AlbumTag } from '../../shared/protocol'

defineProps<{ tag: AlbumTag }>()
</script>

<template>
  <div class="album-tag">
    <svg class="album-tag-string" viewBox="0 0 60 34" aria-hidden="true">
      <path d="M4 33 C 12 8, 26 2, 30 2 C 34 2, 48 8, 56 33" />
    </svg>
    <div class="album-tag-card">
      <span class="album-tag-hole" aria-hidden="true"></span>
      <p class="album-tag-stage">{{ tag.stage }}</p>
      <p class="album-tag-tier">{{ tag.tier }}</p>
      <p class="album-tag-place">
        <span>{{ tag.place }}</span>
        <span>{{ tag.ageLabel }}</span>
      </p>
      <div class="album-tag-hatch" aria-hidden="true"></div>
    </div>
  </div>
</template>

<style scoped>
.album-tag {
  --album-tag-paper: #bcd4ea;
  --album-tag-ink: #1d3552;
  --album-tag-rule: rgba(29, 53, 82, 0.55);

  display: flex;
  flex-direction: column;
  align-items: center;
}

/* The cord hangs from a point ABOVE the tag, so the string is drawn first and the card beneath it
   is pulled up by a negative margin – the knot goes through the hole rather than stopping at it. */
.album-tag-string {
  width: 60px;
  height: 34px;
  fill: none;
  stroke: var(--album-tag-ink);
  stroke-width: 1.2;
  opacity: 0.68;
}

.album-tag-card {
  position: relative;
  width: 100%;
  margin-top: -3px;
  padding: 18px 10px 0;
  overflow: hidden;
  border-radius: 3px;
  background: var(--album-tag-paper);
  color: var(--album-tag-ink);
  text-align: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
}

/* THE PUNCHED HOLE – a dark disc, not a transparent one. A real hole would show the album's own
   paper through it and would have to be cut with a mask; at 10px the difference is invisible and
   the mask is one more thing that can come out empty. */
.album-tag-hole {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 10px;
  height: 10px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: #14202e;
}

.album-tag-stage {
  margin: 12px 0 0;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.album-tag-tier {
  margin: 2px 0 8px;
  font-family: var(--font-heading);
  font-size: 26px;
  font-weight: 800;
  line-height: 1.05;
}

.album-tag-place {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding-top: 8px;
  border-top: 1px dashed var(--album-tag-rule);
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* The hatched block along the bottom of every baggage tag, which is where the airline's own code
   goes. A repeating gradient because it IS regular – unlike the pass's barcode, which is not. */
.album-tag-hatch {
  height: 58px;
  margin: 10px -10px 0;
  background-image: repeating-linear-gradient(
    180deg,
    var(--album-tag-ink) 0 1.5px,
    rgba(255, 255, 255, 0) 1.5px 4.5px
  );
}
</style>
