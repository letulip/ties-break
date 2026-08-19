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
// ⚠ AND THE TWO APPEARANCE STATES BELOW OBEY THAT SAME RULE (DRY-8, 19.08): `.as-bare` and
// `.as-chapter` live in `src/style.css` beside the plate they modify, NOT in a scoped block here, so
// the sentence below stays literally true. It also keeps the specificity story in one place - a
// shared `.tab-row.as-chapter` is (0,2,0) against the plate's (0,1,0), which is the same argument the
// three screens each used to make privately with a data-v attribute, and no `!important` either way.
//
// `.tab-row` / `.tab-pill` stay in `src/style.css` and this component declares NO styles of its own:
// the plate is shared vocabulary, and the draw's own `.bt-tabs` override still reaches its pills
// through it. What arrives with the component is the CONTRACT - a segmented row is a NAMED group of
// real buttons carrying `aria-pressed`, and the chosen one is a value rather than a position.
//
// The value is a string rather than an index so a caller can switch on its own union (a round id, a
// period id) instead of on a position it has to map back.
defineProps<{
  options: readonly { value: string; label: string; short?: string; title?: string }[]
  /** Bare, so the plate reads as a plate on a page background; `on-panel` inside a panel-toned card. */
  tone?: 'page' | 'on-panel'
  /** ⭐⭐ WHAT JOB THIS ROW IS DOING, which is a different question from `tone` (what it is sitting
   *  ON). Three screens had copied the same declarations to answer it – DRY-8 of the August review.
   *
   *  * `plate` (default) – the shared plate. Every existing caller, unchanged.
   *  * `bare` – the plate comes off. The owner, 02.08: «Мне не нравится круглая обводка у
   *    переключателя уровня турниров в stats, без нее было лучше... Давай просто кнопки оставим и
   *    всё». He ruled on a CONTROL, not on a screen, which is why this is a state of the control.
   *  * `chapter` – bare, AND a real touch target, for a row that picks the PAGE'S CHAPTERS. A second
   *    and narrower ruling, 05.08: «Верхние переключатели-вкладки в ledger и настройках сделать
   *    немного крупнее и с отступом внизу небольшим». Measured at his own 576-wide viewport before
   *    anything moved: the pill was 27px tall, against 51px for the bottom bar's `.tab-btn` – the
   *    app's own answer to "how big is a thing you navigate with" – and against the 44px both
   *    platform guidelines ask for. It was the smallest control on the page by a wide margin.
   *
   *  ⚠ WHY `chapter` IS NOT SIMPLY "BIGGER PILLS" GLOBALLY, and this is the objection the three
   *  copies were protecting: the shared `.tab-pill` is ALSO the draw's round switcher and the
   *  12w/season filter six pixels below one of these rows. Growing it globally would inflate a filter
   *  INSIDE a chapter to the size of the chapter picker above it – "two identical-looking rows
   *  stacked six pixels apart", which reads as one broken control. An opt-in state is precisely not
   *  global: the filter row simply does not ask for it.
   *
   *  ⚠ THE BOTTOM MARGIN STAYS WITH THE PAGE. It is page rhythm, not control identity, and the three
   *  callers legitimately differ (10px on Stats, 14px on the two the owner named together). */
  appearance?: 'plate' | 'bare' | 'chapter'
  /** What the group is, for screen readers. A row of pills with no name is a row of mystery.
   *  NOT called `ariaLabel`: Vue would let a caller write `aria-label` and have it fall through to
   *  the root as a plain attribute instead of binding the prop, which type-checks and then quietly
   *  does the wrong thing on the wrapper. A distinct name makes that impossible. */
  groupLabel: string
}>()

/** `v-model` – the ACTIVE option's value, never an index. */
const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="tab-row tb-seg"
    :class="{
      'on-panel': tone === 'on-panel',
      'as-bare': appearance === 'bare' || appearance === 'chapter',
      'as-chapter': appearance === 'chapter',
    }"
    role="group"
    :aria-label="groupLabel"
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
