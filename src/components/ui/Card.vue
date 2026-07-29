<script setup lang="ts">
// U0 #2 – CARD. A card is an OBJECT, and this component is the one place that says what makes it
// one. Two surfaces, because the app genuinely has two and they were already written as two shared
// rules in `src/style.css` (the notecard at the old line 1760, the photograph card at 1420):
//
//   gradient  THE NOTECARD. A vertical gradient rather than a flat fill (so it reads as lit from
//             above), a translucent hairline that cuts it out of the page rather than a drawn line,
//             and the radius ladder's card rung. The export's own idiom.
//             Absorbs `.note-card` (Home's grid), `.friendly-card` and `.diary-strip` (Season /
//             Home's strips).
//   photo     THE PHOTOGRAPH CARD. The same hairline and the same corners over a FLAT dark tone,
//             clipped, and laid out as a column so a painting can bleed into it from behind the
//             words. Absorbs `.event-card` and `.week-card` on Season.
//
// The design's own names for these two tones are `--surface-card-gradient` and `--surface-card-alt`
// (docs/design/tokens.css); ours are `--card-top`/`--card-bottom`, declared with those values.
//
// ⚠ THE RADIUS IS 18px, NOT THE 17 THE SPEC ASKS FOR. `--radius-card` is a rung of the app's radius
// ladder and the owner moved it 17 -> 18 on 29.07, after docs/specs/ui-components.md was written.
// This slice may not move a signed-off screen, so the rung wins and the spec's number is stale.
//
// THE CALLER KEEPS ITS OWN CLASS. `<Card class="event-card">` merges onto this root, so every
// screen-specific rule and every guard that reads a screen for its class name still finds it. What
// moved here is only what all five of those class names were saying identically.
withDefaults(
  defineProps<{
    /** The tag. Home's grid needs `button` (a card that is a door) and `article` (one that is not). */
    as?: 'div' | 'button' | 'article' | 'section' | 'li'
    variant?: 'gradient' | 'photo'
    /** Padding override, any CSS padding value. Defaults: 14px on `gradient`, 0 on `photo`. */
    pad?: string | number | null
  }>(),
  { as: 'div', variant: 'gradient', pad: null },
)
</script>

<template>
  <component
    :is="as"
    class="tb-card"
    :class="`tb-card--${variant}`"
    :style="pad === null ? undefined : { '--tb-card-pad': typeof pad === 'number' ? `${pad}px` : pad }"
  >
    <slot />
  </component>
</template>

<style scoped>
.tb-card {
  box-sizing: border-box;
  border: 1px solid var(--card-edge);
  border-radius: var(--radius-card);
  padding: var(--tb-card-pad, 14px);
}

.tb-card--gradient {
  background: linear-gradient(180deg, var(--card-top) 0%, var(--card-bottom) 100%);
}

/* The photograph card takes its height from its art rather than from padding, so it starts at zero
   and the two callers that want an inset (`.event-card`'s 16/16/6) pass one. */
.tb-card--photo {
  --tb-card-pad: 0;
  position: relative;
  overflow: hidden;
  background: var(--card-bottom);
  display: flex;
  flex-direction: column;
}
</style>
