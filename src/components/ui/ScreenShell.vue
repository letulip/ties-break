<script setup lang="ts">
// U0 #1 – SCREEN SHELL. The vertical stack every screen in this system assumes:
//
//   header   flex: none   – whatever must not scroll away with the content
//   body     flex: 1      – the screen itself, `min-height: 0` so a scroller inside it can bound
//   footer   flex: none   – whatever sits under the content but above the app's own bars
//
// WHAT THIS DOES NOT OWN, and the honest reason why.
//
// The handoff (docs/design/README.md §"Переиспользуемые компоненты") says ScreenShell owns the
// screen's side gutter, at 14px (22px for onboarding). OUR shell does not, and must not in this
// slice: the gutter lives on `#app` as `--app-pad-x`, it is 16px rather than 14, and Home's
// full-bleed hero CANCELS it by that exact token (`.diary-hero` margins). Re-homing the gutter here
// would move both edges of every screen by 2px and put the hero's cancellation out of reach of the
// value it cancels - a redesign, and this slice is a refactor. So `gutter` is opt-IN: pass a number
// and this element pads itself; pass nothing and it inherits the app frame it has always inherited.
// The onboarding wave, which genuinely needs 22, has a prop waiting for it.
//
// NOT the tab bar either - the bar stays exactly as it is (owner's ruling, docs/specs/ui-inventory
// §4 Q1), and it is App.vue's, not a screen's.
withDefaults(defineProps<{ gutter?: number | null }>(), { gutter: null })
</script>

<template>
  <div class="tb-screen" :style="gutter === null ? undefined : { paddingInline: `${gutter}px` }">
    <div v-if="$slots.header" class="tb-screen-head"><slot name="header" /></div>
    <div class="tb-screen-body"><slot /></div>
    <div v-if="$slots.footer" class="tb-screen-foot"><slot name="footer" /></div>
  </div>
</template>

<style scoped>
.tb-screen {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tb-screen-head,
.tb-screen-foot {
  flex: none;
}

/* The body is itself a column, so a screen's blocks stack in it exactly the way they stacked in the
   hand-rolled `.diary` wrapper this replaces. `min-height: 0` is the half of the pair that lets an
   inner scroller actually bound itself instead of growing the page. */
.tb-screen-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
