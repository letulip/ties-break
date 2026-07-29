<script setup lang="ts">
// U0 #4 – PAPER NOTE. A scrap of real paper laid on the page: warm stock, a 2px corner (paper is
// not rounded), the paper shadow, and Caveat inside it.
//
// ⚠ U0 SHIPPED THIS WITH NO CALLER AND SAID SO. IT HAS TWO NOW, AND TWO OF ITS THREE SHAPES WERE
// WRONG. U2 (screen D, Weekly Story) is the first real caller - the week's handwritten line laid
// over the week painting, and the "Next goal" scrap taped under the summary grid - and it is the
// two-caller test U0 correctly flagged this component had never had. What that test found, and
// what changed, is written out below so the next reader does not have to diff it against the
// prototype themselves. U0's own note is kept underneath, because the reason it had no caller is
// still the reason there is nothing on Home or Season to fold in.
//
//   `torn`  WAS a saw-tooth mask - a zigzag bottom edge - and the design has no such object
//           anywhere. `docs/design/prototype/screens.dc.html` cuts every single piece of paper with
//           a `clip-path` polygon instead (5 of them, no other treatment), and the handoff's
//           principle 1 says so in words: "у неё рваный край через clip-path". A zigzag is a
//           DECORATION; the polygon is a sheet of paper that was torn off a pad, which is why all
//           four edges move by a fraction of a percent rather than one edge turning into teeth.
//           So `torn` is now that cut, and it takes a DIRECTION, because the prototype's five
//           polygons are two shapes: four dip at the top-left and one dips at the top-right. D uses
//           one of each on the same screen - two scraps that are visibly not the same piece of
//           paper - and that is what the prop is for.
//   `marginRule`  WAS `border-left`, which puts the red rule ON the paper's left edge. An exercise
//           book has paper on BOTH sides of its margin: the design's is a 1px line inset 17px, and
//           the prototype draws it as an absolutely positioned child inside the clipped box. A
//           border also cannot survive `torn` - `clip-path` would shave it off with the corner.
//           It is a pseudo-element now, at the design's own 17px, and it is clipped WITH the paper
//           instead of against it.
//   `tilt`, `ruled`, `tape`  survived the test unchanged.
//
// U0's original note on why it had no caller, unchanged and still true:
//   docs/specs/ui-components.md §4 says PaperNote "absorbs the diary note on Home and the
//   hand-written blocks on Season". Neither exists. Measured against the code on this branch:
//     * Season has no handwriting at all - not one Caveat rule, not one light surface.
//     * Home's two handwritten lines (`.memory-line`, `.coach-sign`) are Caveat on the DARK card,
//       not on paper. The only paper object in the whole app is the memory POLAROID, which is U0 #5.
//   So there is nothing here to absorb, and inventing a caller - putting cream paper where a
//   signed-off screen has dark card today - would be a redesign.
withDefaults(
  defineProps<{
    /** Degrees as a number, OR any CSS angle (one of the `--tilt-*` tokens, say). The design's own
     *  paper rotations: -4 · -3 · -0.8 · -0.5 · +0.4 · +2 · +3 · +6. */
    tilt?: number | string
    /** Ruled stock – the design's 26px repeating rule. */
    ruled?: boolean
    /** A hand-cut edge instead of a clean rectangle: the design's paper `clip-path`, never a drawn
     *  zigzag. `'left'` (and `true`) dips at the top-left, `'right'` at the top-right – two cuts, so
     *  two notes on one page are not the same sheet of paper twice. */
    torn?: boolean | 'left' | 'right'
    /** A strip of tape across the top edge. */
    tape?: boolean
    /** The red margin rule of a school exercise book: 1px, inset 17px, paper on both sides. */
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
      'tb-paper--torn': torn === true || torn === 'left',
      'tb-paper--torn-right': torn === 'right',
      'tb-paper--margin': marginRule,
    }"
    :style="{ transform: `rotate(${typeof tilt === 'number' ? `${tilt}deg` : tilt})` }"
  >
    <span v-if="tape" class="tb-paper-tape" aria-hidden="true"></span>
    <slot />
  </div>
</template>

<style scoped>
.tb-paper {
  /* THE PAPER LAYER'S SECOND INK (docs/design/tokens.css --paper-ink-soft), declared HERE rather
     than in `src/style.css` beside the other five paper tokens - which is where it belongs and
     where it should be lifted the moment that sheet reopens. This wave has six screens building on
     one branch and the sheet is frozen against them, so a token that only paper can use is declared
     on the paper. It INHERITS, so anything slotted into a note can write `var(--paper-ink-soft)`:
     screen D's "Next goal" label is the first, and every annotation on a scrap after it. */
  --paper-ink-soft: #4a4235;
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

/* The margin rule of a school exercise book: a 1px line INSET 17px, with paper either side of it,
   and the padding that clears it. A child of the paper rather than a border on it, so `torn` clips
   the rule together with the sheet instead of shaving it off at the corners. */
.tb-paper--margin {
  padding-left: 26px;
}

.tb-paper--margin::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--paper-margin-rule);
}

/* THE HAND-CUT EDGE. Every sheet of paper in the design is cut with one of these two polygons -
   all four sides move, by a fraction of a percent, the way a page torn off a pad does. The
   difference between them is which top corner dips, and it is the whole reason the prop takes a
   direction: two scraps on one screen must not be the same cut twice. */
.tb-paper--torn {
  clip-path: polygon(0.6% 2%, 99.4% 0%, 100% 96%, 0% 100%);
}

.tb-paper--torn-right {
  clip-path: polygon(0.6% 0%, 99.4% 2%, 100% 100%, 0% 97%);
}

/* ⚠ A CUT SHEET KEEPS ITS SHADOW, and getting that back needs a different property. `clip-path`
   clips a box-shadow away with everything else outside the polygon, so in the prototype every torn
   note silently lost the shadow its own markup asks for - and the handoff's principle 1 says paper
   is laid on the page "всегда с небольшим наклоном и тенью", always with a slight tilt AND a shadow.
   `drop-shadow` is the same value (`--shadow-paper` is offset/offset/blur/colour, which is exactly
   what the filter takes) applied to the SILHOUETTE rather than to the box, so the shadow follows the
   torn edge instead of being erased by it. Only torn paper pays for the filter; a clean sheet keeps
   the cheaper box-shadow. */
.tb-paper--torn,
.tb-paper--torn-right {
  box-shadow: none;
  filter: drop-shadow(var(--shadow-paper));
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
