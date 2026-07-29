<script setup lang="ts">
// U0 #7 – PRIMARY PILL. The app's ONE affirmative button, so six screens do not each invent a CTA.
//
// ⚠ WHAT IT DOES AND DOES NOT ABSORB, because the spec asks for two different objects at once.
// docs/specs/ui-components.md §7 says "lime pill + shadow, radius 999" AND "absorbs `.primary`".
// Those are not the same button in this app:
//   * `.primary` is the affirmative button everywhere - lime fill, dark ink, `--radius-control`
//     (8px), no shadow. TWELVE files use it, from dialogs to the onboarding wizard.
//   * the export's CTA - 999 radius, `--shadow-cta` under it - is `.next-week-btn`, and it exists
//     exactly once, in App.vue's floating bar.
// Rounding `.primary` to 999 would restyle every dialog in the app, which this slice may not do. So
// the DEFAULT is `.primary` exactly as it is today, `cta` is the export's pill for a screen that
// wants the big affirmative, and `ghost` is the quiet segment variant the spec asks for.
//
// `.primary` itself stays in `src/style.css`: it is shared vocabulary with twelve consumers, not
// one screen's business, and moving it here would break the eleven callers that still write the
// class by hand. What this component gives the screens after us is ONE door - import it, and the
// two variants that do not exist as classes arrive with it.
withDefaults(
  defineProps<{
    variant?: 'solid' | 'cta' | 'ghost'
    disabled?: boolean
    /** "You may still take this risk": the amber-outlined affirmative (Season's fatigued Enter). */
    risky?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'solid', disabled: false, risky: false, type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    class="primary tb-pill"
    :class="[`tb-pill--${variant}`, { risky }]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
/* `solid` adds nothing: it IS `.primary`, and saying its four declarations again here would be the
   second copy this component exists to prevent. */

/* The export's CTA pill, verbatim from the design and from `.next-week-btn`, which is the one
   instance of it we already ship: the capsule, the 12/26 inset and the lime glow under it. */
.tb-pill--cta {
  border: none;
  border-radius: var(--radius-pill);
  box-shadow: 0 8px 24px var(--accent-glow);
  padding: 12px 26px;
  font-size: 14.5px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

/* The quiet half of a segmented pair: the capsule shape without the fill, so the two read as one
   control with one of them chosen. */
.tb-pill--ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--text);
  border-radius: var(--radius-pill);
  font-weight: 600;
}

.tb-pill--ghost:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--accent);
  filter: none;
}
</style>
