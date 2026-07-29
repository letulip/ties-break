<script setup lang="ts">
// U0 #3 – EYEBROW. The design's "section heading inside a card": uppercase 10px / 800 / 0.1em, in
// the one accent. ONE COLOUR MEANS "READ THIS" - every card on Home is labelled in it, the strips
// below its fold are labelled in it, and nothing else on the page is that colour.
//
// ⚠ THE SPEC'S LIST OF WHAT THIS ABSORBS IS WRONG, and following it would have been a redesign.
// docs/specs/ui-components.md §3 names ten class names as "the eyebrow, implemented ten times".
// Measured against the sheet, only TWO of them are this object - `.note-kicker` and
// `.diary-strip h2`, and those two were already merged into one rule (the css-dry pass). The other
// eight are a DIFFERENT object:
//   `.news-week-label` `.ledger-week-label` `.tf-round` `.tf-champ-label` `.tf-bracket-title`
//   `.season-summary-kicker`   – the app's MUTED label: `--muted`, `--label-size` (11px),
//                                `--label-track` (0.08em), normal weight. Not lime, not 10/800.
//   `.tf-badge`                – a pill: padding, `--radius-pill`, and its colour comes from a
//                                variant class.
//   `.donut-center-cap`        – an SVG <text> node inside the Money donut (`fill`, `text-anchor`,
//                                3 user units). Not HTML, and not a heading at all.
// `src/style.css` said so itself, right above the rule: "NOT the same object as the app's other
// uppercase labels: those are MUTED, at 11-12px and three different trackings. That is an open
// question in the audit, not a group." Recolouring six muted labels to lime is a design decision
// for the owner, not something to smuggle in under an extraction.
//
// `position: relative` is part of the object: a kicker sits above the card's own absolutely
// positioned art (Home's venue arch, the memory polaroid), and it has to be positioned to do that.
withDefaults(defineProps<{ as?: 'p' | 'h2' | 'h3' | 'span' | 'div' }>(), { as: 'p' })
</script>

<template>
  <component :is="as" class="tb-eyebrow"><slot /></component>
</template>

<style scoped>
.tb-eyebrow {
  position: relative;
  margin: 0;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}
</style>
