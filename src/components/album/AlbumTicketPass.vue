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
// ⭐⭐ THE INK CARRIES THE RANK, AND THE RAMP IS THE APP'S OWN – spec §4's «чем выше ступень, тем
// насыщеннее». `ticket.step` is one of the design system's four tier steps, decided engine-side by
// `ALBUM_TIER_STEP` (src/engine/world/albumBook.ts); this file turns that step into paint and makes
// no other decision. The previous note here said the pass would ship in one tone until he ruled a
// palette, on the reading that any ramp would be an invented one – but the app ALREADY owns a
// four-step ramp for exactly this concept: `--tier-budget` / `--tier-middle` / `--tier-high` /
// `--tier-elite`, declared in src/style.css off docs/design/tokens.css and painting the Coach
// Market's four tiers. Using his ramp is not inventing a palette; it is the opposite.
//
// ⚠⚠ AND EVERY INK BELOW IS THAT TOKEN TIMES ONE NUMBER, WHICH IS WHY THE ALBUM STILL ADDS NO
// COLOUR. A tier token is an accent tuned to sit on the dark app – #8fb2d6 is far too light to print
// near-white text on (measured 1.94:1, half of AA). A printed ticket is a deep ink, so each step's
// ink is its token scaled in sRGB: ×0.38 for the face, ×0.27 for the deep end of the sheen. The
// hexes are written out because `color-mix()` computes to the empty string under happy-dom, which
// would leave the contrast assertion measuring the sheet behind the pass instead of the pass –
// a vacuous guard, this repo's oldest failure family. So the numbers are literal AND
// `tests/component/album-rank-ink.test.ts` re-derives all eight from `--tier-*` at runtime: touch a
// token, or nudge a factor, and the pin goes red pointing at the exact channel.
import type { AlbumTicket } from '../../shared/protocol'

defineProps<{ ticket: AlbumTicket }>()
</script>

<template>
  <div class="album-pass" :class="[`album-pass-${ticket.step}`, ticket.paint ? `album-pass-${ticket.paint}` : '']">
    <div class="album-pass-main">
      <p class="album-pass-venue">{{ ticket.venue }}</p>
      <!-- ⭐ ROUND 47 #8c – THE STAGE IS PRINTED ONCE: on the stub, in the album's own hand. It used to be here too
           («World Tour 1000 Champion» over «Champion»), and he asked for only the handwritten one. -->
      <p class="album-pass-title">{{ ticket.tier }}</p>
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
  /* the elite step, so a pass that somehow arrived without a class is still a legible one */
  --album-pass-ink: #3b3051;
  --album-pass-ink-deep: #2a2239;
  --album-pass-paper: #f6eef2;

  display: flex;
  overflow: hidden;
  border-radius: 3px;
  /* ⚠ THE FLAT COLOUR IS DECLARED AND THE SHEEN RIDES ON TOP OF IT, rather than the sheen being the
     whole background. `background: linear-gradient(…)` leaves `background-color` TRANSPARENT, and a
     contrast measurement walking up from the text would then skip the pass entirely and read the
     album's own paper – it would have reported this ticket as dark-on-white. Declaring the LIGHTER
     end as the colour also makes the measurement the worst case: no pixel of the real face is
     lighter than the one the test measured. */
  background-color: var(--album-pass-ink);
  background-image: linear-gradient(105deg, var(--album-pass-ink-deep), var(--album-pass-ink));
  color: var(--album-pass-paper);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.32);
}

/* THE FOUR STEPS – each pair is `--tier-<step>` scaled ×0.38 and ×0.27 (the script header's note).
   In ladder order, which is also saturation order on the page: the domestic years, the junior tour,
   the W rungs, the tour proper. */
.album-pass.album-pass-budget {
  --album-pass-ink: #364451;
  --album-pass-ink-deep: #27303a;
}
.album-pass.album-pass-middle {
  --album-pass-ink: #4f561f;
  --album-pass-ink-deep: #383d16;
}
.album-pass.album-pass-high {
  --album-pass-ink: #563112;
  --album-pass-ink-deep: #3d230d;
}
.album-pass.album-pass-elite {
  --album-pass-ink: #3b3051;
  --album-pass-ink-deep: #2a2239;
}

/* ⭐ ROUND 48 #1c – THE SLAM TICKET'S GREEN (owner, 07.10: «на предпоследней зеленый билет на Шлем внизу»). The engine names the paint (`ticket.paint === 'slam'`,
   set only on the ticket the book's tail hangs for a Grand Slam the career reached) and this file owns the colour – and it is STILL no new colour: the app's own
   grass-court token `--surface-grass` (#5fb05a) times the pass's two factors, ×0.38 for the face and ×0.27 for the deep end. The hexes are written out for the same
   reason as the four steps' (`color-mix()` computes to the empty string under happy-dom), and `tests/component/r48-b3-album-tail.test.ts` re-derives both from the
   token. It sits AFTER the four steps at the same specificity, so it wins over the `elite` pair the Slam's step would otherwise paint. */
.album-pass.album-pass-slam {
  --album-pass-ink: #244322;
  --album-pass-ink-deep: #1a3018;
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
  white-space: nowrap;
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
  /* ⭐ ROUND 47 #8d – 134px, WAS 116: «Row» and «Seat» now stay on ONE line, and the widest pair the engine can
     deal («Row 30» + «Seat 30D») is 105.2px wide with the 4px gap, against the 90.5px the old stub had inside its
     padding (measured in Chromium, 06.10) – `nowrap` alone would have run it off the ticket's edge. 134 leaves 3px. */
  width: 134px;
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
  gap: 4px;
  white-space: nowrap;
  margin: 0;
  font-family: var(--font-body);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.78;
}

/* ⭐ ROUND 47 #8d – «Row …», «Gate …» ALWAYS ONE LINE. The two lines above carry it on the line AND on each word of
   it: a flex item is its own box and would otherwise break «Row 14» into «Row» over «14». */
.album-pass-foot span,
.album-pass-row span {
  white-space: nowrap;
}
</style>
