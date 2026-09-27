<script setup lang="ts">
// THE PLAN PRESET ROW – E-02 (docs/review-principles-2026-09-26/05-ui.md), T4.12. Three screens light
// a training preset and each of them had its own row: `HerWeekTab` (the dials' fast path),
// `CoachMarketScreen` (the training regulator, half of every price on that screen) and
// `ThisWeekScreen` (the week's own plan block). The rows were three spellings of one control.
//
// ⚠ ON `ui/SegmentedRow.vue`'s CONTRACT, NOT INSIDE IT, and the difference is deliberate: a segmented
// row is a PLATE with exactly one chosen segment and a required `v-model`. These rows are none of the
// three – they are `.option-row` / `.option-pill`, the app's other shape; a week that is no preset's
// selects NOTHING, which is the whole of the owner's ruling; and every one of them can be disabled
// (the Coach market and This week on `game.busy`, Her week on the coach's lock as well). What IS
// borrowed is that component's own sentence about itself: «a segmented row is a NAMED group of real
// buttons carrying `aria-pressed`, and the chosen one is a value rather than a position.» The value,
// the `aria-pressed` and the real buttons are here.
//
// ⚠ THE PILLS ARE A TOGGLE GROUP AND NOT A RADIO GROUP, which is what decides the attribute. The app
// has real radio groups – `PrologueCard`, `KnockDialog`, `BirthdayDialog`, `LifeBeatDialog`,
// `OnboardingWizard` – and they carry `role="radiogroup"` named by the question they answer,
// `role="radio"`, `aria-checked`, a mark beside the label that says so on screen, and the shared
// arrow-key handler `composables/radioGroupKeys.ts`. This row carries none of that and must not, for
// two reasons that are behaviour rather than taste:
//   * NOTHING SELECTED IS A LEGAL STATE HERE – a hand-arranged week is no preset's, which is exactly
//     what ruling 7a made true on all three screens. A radio group with no checked radio is a broken
//     radio group; three buttons reading `aria-pressed="false"` say precisely what the screen says.
//   * PRESSING THE LIT PILL STILL FIRES `setPlan` – it re-lays the week. A checked radio does nothing.
// So the arrow-key handler is deliberately not bound: these are buttons, each one its own tab stop,
// which is the correct keyboard shape for a group of toggles.
//
// ⚠ AND IT INVENTS NO WORD (CLAUDE.md invariant 4). The labels arrive as PROPS so each host passes the
// words it already rendered – three label sets, three orders, byte-identical per host – and the row
// carries no name of its own. `SegmentedRow`'s other half, `groupLabel`, would need three new sentences
// to say what each of these rows IS, and a sentence is the owner's; the row is shipped without one
// rather than with one an agent chose. `tests/component/principles-w4-preset-parity.test.ts` asserts
// both halves: every label byte-identical, and no name here.
//
// ⚠ NO ELEMENT WAS ADDED. Root `.option-row`, three `.option-pill` buttons, one text node each – the
// shipped markup, so no host's block is taller than it was and the popup law has nothing new to
// measure. The host's own class (`hw-presets`, `cm-plan`) and inline style fall through to the root,
// which also keeps the host's SCOPED rules on the row: a child component's root element carries its
// parent's scope id.
import type { PlanPresetKey } from '../../engine/plan'

defineProps<{
  /** In the HOST's display order, with the HOST's own label on each. */
  options: readonly { value: PlanPresetKey; label: string }[]
  /** `presetOf(week)`'s answer – the engine's, never a predicate of this component's own. */
  active: PlanPresetKey | null
  disabled?: boolean
}>()

const emit = defineEmits<{ pick: [key: PlanPresetKey] }>()
</script>

<template>
  <div class="option-row">
    <button
      v-for="o in options"
      :key="o.value"
      class="option-pill"
      :class="{ selected: o.value === active }"
      :aria-pressed="o.value === active"
      :disabled="disabled"
      @click="emit('pick', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
