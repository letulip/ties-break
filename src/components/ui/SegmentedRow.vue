<script setup lang="ts">
// U0 #8 – SEGMENTED ROW. One rounded plate, the chosen segment filled solid accent, the rest muted.
// Options in, the active value out - so a screen that needs a switcher writes one line and cannot
// invent a thirteenth shape for it.
//
// Absorbs `.tab-row` / `.tab-pill`, the app's standard segmented control. Its one existing caller
// is BracketTabs (the draw's round switcher), and it is ported here - the spec calls that pair
// "already shared once ... this makes it official".
//
// ⚠ TWO THINGS THE SPEC ASKS THIS TO ABSORB, THAT IT DOES NOT, and both for the same reason: they
// are different objects today, and converging them would move a screen this slice may not move.
//   * SEASON'S PHASE STRIP (`.phase-strip`) is a five-column GRID with hairline dividers and two
//     lines per cell, and it is not a switcher at all - nothing is clickable, it is a read-out of
//     which surface block the current week falls in. Forcing it through here would have meant a
//     "not really a row, not really interactive" mode, which is exactly the special case the spec
//     itself says means the component is wrong. It stays as it is, in Season's own styles.
//   * THE MONEY SCREEN'S 12w/season toggle is `.option-row` / `.option-pill`, a THIRD shape. Money
//     is U1's screen; converging it belongs with whoever ports it, and it should then come here.
//
// The value type is generic so a caller can switch on its own union (a round id, a period id)
// rather than on an index it has to map back.
defineProps<{
  options: readonly { value: string; label: string; short?: string; title?: string }[]
  /** Bare, so the plate reads as a plate on a page background; `on-panel` inside a panel-toned card. */
  tone?: 'page' | 'on-panel'
  /** What the group is, for screen readers. A row of pills with no name is a row of mystery. */
  ariaLabel: string
}>()

/** `v-model` – the ACTIVE option's value, never an index. */
const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="tab-row tb-seg"
    :class="{ 'on-panel': tone === 'on-panel' }"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      v-for="o in options"
      :key="o.value"
      class="tab-pill"
      :class="{ active: o.value === model }"
      :aria-pressed="o.value === model"
      :aria-label="o.label"
      :title="o.title"
      @click="model = o.value"
    >
      {{ o.short ?? o.label }}
    </button>
  </div>
</template>

<style scoped>
/* `.tab-row` / `.tab-pill` stay in `src/style.css`: the plate is shared vocabulary, and the draw's
   own `.bt-tabs` override still reaches its pills through it. What this component adds is the
   CONTRACT - that a segmented row is a named group of real buttons with `aria-pressed`, and that
   the chosen one is a value rather than a position. */
</style>
