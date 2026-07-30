<script setup lang="ts">
// THE SURFACE MARK (owner, 30.07: «Surface type similar icon across every screen – it means this
// icon is not a component»). He is right, and the inventory is worse than the sentence suggests: the
// three surfaces of this game were being drawn SIX different ways across five files.
//
//   1. the concentric ring, hand-written three times - SeasonScreen twice, TournamentFlow once - and
//      all three DIFFERENT: one carried the engine's title and `aria-hidden`, one hard-coded both the
//      surface (`surf-clay`) and its name as literal text, one had neither the title nor the
//      aria-hidden and kept the name outside the mark entirely;
//   2. `const SURFACE_EMOJI = { hard: '🔵', clay: '🟠', grass: '🟢' }` - the SAME LINE, copy-pasted
//      into three files, feeding four `<span class="pill">` badges;
//   3. four places that print the bare name with no mark at all.
//
// Two of those are colour systems that disagree: the emoji hues are not `--surface-hard/clay/grass`,
// so the same clay court was orange in one place and a different orange in another. The ring wins -
// it is the design's, it uses the tokens, and it scales.
//
// ⚠ THE CSS STAYS IN `src/style.css`, deliberately, and this is the one place in the U-series where
// a component does NOT bring its own styles. `.surface-mark` / `.surface-ring` are still written by
// hand in TournamentFlow.vue, which belongs to another slice this round; moving the rules in here
// would blank that screen's mark the moment this lands. So this component EMITS the existing class
// contract and the sheet keeps the rules, which also means tests/round11-view.test.ts's CSS-body
// assertions go on reading exactly what they read before. When TournamentFlow adopts this, the rules
// can follow it in.
//
// WHAT THE CALLER OWNS: whether the surface is NAMED beside the ring, and how big the ring is. A
// friendly-match subtitle wants 15px and no name; a calendar row wants 19px and the name.
import type { Surface } from '../../engine/match/types'

withDefaults(
  defineProps<{
    surface: Surface
    /** Print the surface name beside the ring. Off for a mark inside a tile that labels itself. */
    showName?: boolean
    /** `md` = the calendar row's 19px ring; `sm` = the 15px one a subtitle line wants. */
    size?: 'md' | 'sm'
    /** The engine's "Grass – suits her game" reading, when the caller has one. */
    title?: string
  }>(),
  { showName: true, size: 'md', title: undefined },
)
</script>

<template>
  <span class="surface-mark" :class="[`surf-${surface}`, { 'surface-mark--sm': size === 'sm' }]" :title="title">
    <span class="surface-ring" aria-hidden="true"><i></i></span>
    <template v-if="showName">{{ surface }}</template>
  </span>
</template>
