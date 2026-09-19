<script setup lang="ts">
// THE BOARDING PASS – layout B's anchor along the bottom of the sheet (mockup AZ-B). The owner's
// own sentence about it is the brief: «Читается как поездка, а не как украшение» – it reads as the
// trip, not as decoration. That is why it is long and low and carries real facts rather than being
// a coloured rectangle with a word on it.
//
// WHAT IS REAL AND WHAT IS FLAVOUR (spec §4). Real: the tournament's rank, its stage, the calendar
// date of that week, the venue. Flavour, and ruled to be drawn freely: the gate, the seat, the row
// and the barcode – but derived engine-side from the seed, so re-opening the album does not
// reshuffle them. This component invents neither; both arrive on the model.
//
// ⚠⚠ THE NAMES ON THE MOCKUP CANNOT SHIP. «WTA 1000» is a trademark and the spec says so directly:
// our ranks are our own (`World Tour N` and the W-steps in `season/calendar.ts`). `tier` is
// whatever the engine hands over, and this file has no opinion about it.
//
// ⚠ ONE TONE, PENDING HIS PALETTE. Spec §4 wants the colour to carry the rank – «чем выше ступень,
// тем насыщеннее» – and §9 lists the palette as HIS, still open. Inventing a five-step ramp here
// would be exactly the wording-and-colour decision invariant 4 keeps out of an agent's hands, so
// the pass ships in one ink until he rules; nothing else about it changes when he does.
import type { AlbumTicket } from '../../shared/protocol'

defineProps<{ ticket: AlbumTicket }>()
</script>

<template>
  <div class="album-pass">
    <div class="album-pass-main">
      <p class="album-pass-venue">{{ ticket.venue }}</p>
      <p class="album-pass-title">{{ ticket.tier }} {{ ticket.stage }}</p>
      <p class="album-pass-foot">
        <span>{{ ticket.dateLabel }}</span>
        <span>{{ ticket.gate }}</span>
      </p>
    </div>
    <!-- THE PERFORATION. A dashed border on the stub, not a drawn row of dots: a border can never
         fall out of step with the height of the thing it is tearing off. -->
    <div class="album-pass-stub">
      <p class="album-pass-stage">{{ ticket.stage }}</p>
      <div class="album-pass-code" aria-hidden="true">
        <span v-for="(w, i) in ticket.bars" :key="i" :style="{ width: `${w}px` }"></span>
      </div>
      <p class="album-pass-row">
        <span>{{ ticket.row }}</span>
        <span>{{ ticket.seat }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.album-pass {
  --album-pass-ink: #8d2f56;
  --album-pass-ink-deep: #6f2343;
  --album-pass-paper: #f6eef2;

  display: flex;
  overflow: hidden;
  border-radius: 3px;
  background: linear-gradient(105deg, var(--album-pass-ink-deep), var(--album-pass-ink));
  color: var(--album-pass-paper);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.32);
}

.album-pass-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}

.album-pass-venue {
  margin: 0;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.82;
}

/* The one thing on the pass set in the app's display face: a printed ticket is not handwriting, and
   the contrast between this line and the handwriting around it on the page is the point. */
.album-pass-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}

.album-pass-foot {
  display: flex;
  gap: 18px;
  margin: 0;
  font-family: var(--font-body);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.78;
}

.album-pass-stub {
  flex: none;
  width: 116px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 10px;
  border-left: 1.5px dashed rgba(246, 238, 242, 0.62);
}

/* The stub is the half somebody WRITES on – the round of the draw, in the album's own hand. */
.album-pass-stage {
  margin: 0;
  font-family: var(--font-hand);
  font-size: 19px;
  line-height: 1;
  text-align: right;
}

/* THE BARCODE, FROM THE WIDTHS AND NOTHING ELSE. Bars are elements rather than a repeating
   gradient because the widths are irregular by design – a regular one is a hatch, not a code. */
.album-pass-code {
  display: flex;
  align-items: stretch;
  gap: 2px;
  height: 30px;
}

.album-pass-code span {
  flex: none;
  background: var(--album-pass-paper);
  opacity: 0.92;
}

.album-pass-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  font-family: var(--font-body);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.78;
}
</style>
