<script setup lang="ts">
// U0 #4 – PAPER NOTE. A scrap of real paper laid on the page: warm stock, a 2px corner (paper is
// not rounded), the paper shadow, and Caveat inside it.
//
// ⚠ THIS ONE HAS NO CALLER YET, AND THE SPEC IS WRONG ABOUT WHY IT SHOULD.
// docs/specs/ui-components.md §4 says PaperNote "absorbs the diary note on Home and the
// hand-written blocks on Season". Neither exists. Measured against the code on this branch:
//   * Season has no handwriting at all - not one Caveat rule, not one light surface.
//   * Home's two handwritten lines (`.memory-line`, `.coach-sign`) are Caveat on the DARK card, not
//     on paper. The only paper object in the whole app is the memory POLAROID, which is U0 #5.
// So there is nothing here to absorb, and inventing a caller - putting cream paper where a signed-
// off screen has dark card today - would be a redesign. It is built because it is #5 of the seven
// the handoff says to build first and screens D / G / L / M are about to need it, and it is built
// from `docs/design/tokens.css` rather than from a screen. Whoever gives it its first caller gets
// to be the one who proves its shape; until then it has NOT had the two-caller test the rest of
// this slice had, and that is stated here rather than left for the next reader to discover.
withDefaults(
  defineProps<{
    /** Degrees. The design's paper rotations: -4 · -3 · -0.8 · -0.5 · +0.4 · +2 · +3 · +6. */
    tilt?: number
    /** Ruled stock – the design's 26px repeating rule. */
    ruled?: boolean
    /** A torn bottom edge instead of a clean one. */
    torn?: boolean
    /** A strip of tape across the top edge. */
    tape?: boolean
    /** The red margin rule down the left, as on a school exercise book. */
    marginRule?: boolean
  }>(),
  { tilt: 0, ruled: false, torn: false, tape: false, marginRule: false },
)
</script>

<template>
  <div
    class="tb-paper"
    :class="{
      'tb-paper--ruled': ruled,
      'tb-paper--torn': torn,
      'tb-paper--margin': marginRule,
    }"
    :style="{ transform: `rotate(${tilt}deg)` }"
  >
    <span v-if="tape" class="tb-paper-tape" aria-hidden="true"></span>
    <slot />
  </div>
</template>

<style scoped>
.tb-paper {
  position: relative;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: var(--radius-paper);
  background: var(--paper-card);
  box-shadow: var(--shadow-paper);
  color: var(--paper-ink);
  font-family: var(--font-hand);
  font-size: 17px;
  line-height: 1.3;
}

/* Lined stock. The ruling is a repeating gradient rather than drawn elements, so the note can hold
   any amount of text without the paper and the writing ever getting out of step. */
.tb-paper--ruled {
  background-color: var(--paper-lined);
  background-image: var(--paper-ruling);
}

/* The margin rule of a school exercise book, and the padding that respects it. */
.tb-paper--margin {
  padding-left: 24px;
  border-left: 2px solid var(--paper-margin-rule);
}

/* A torn bottom edge: a saw-tooth mask, so what shows through is the PAGE behind the paper rather
   than a painted zigzag that would be the wrong colour on any other background. */
.tb-paper--torn {
  -webkit-mask-image: linear-gradient(#000 0 0),
    conic-gradient(from -45deg at 50% 100%, #000 90deg, transparent 0);
  mask-image: linear-gradient(#000 0 0),
    conic-gradient(from -45deg at 50% 100%, #000 90deg, transparent 0);
  -webkit-mask-size: 100% calc(100% - 6px), 12px 6px;
  mask-size: 100% calc(100% - 6px), 12px 6px;
  -webkit-mask-repeat: no-repeat, repeat-x;
  mask-repeat: no-repeat, repeat-x;
  -webkit-mask-position: top, bottom;
  mask-position: top, bottom;
  padding-bottom: 18px;
}

.tb-paper-tape {
  position: absolute;
  left: 50%;
  top: -8px;
  width: 54px;
  height: 16px;
  transform: translateX(-50%) rotate(-1.5deg);
  background: var(--paper-tape);
  box-shadow: var(--shadow-tape);
}
</style>
