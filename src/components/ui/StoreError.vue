<script setup lang="ts">
// ⚠⚠ U-02 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE STORE'S REFUSAL, AND
// THE ONE ELEMENT THAT SAYS IT.
//
// `stores/game.ts` writes four player-facing sentences into `error` and owns every one of them:
// the cross-tab line (218), the generic refusal (221), "Simulation restarted from the last saved
// week." (241) and the stale-screen line (256). Until this component existed the sentence was
// rendered by five templates out of ten – so a command refused on Money, Calendar, Kid, This week
// or inside a takeover was a silent nothing, and the next tap cleared the explanation (`run` resets
// `error` at 192). W1-INTEGRITY-A and TB-05 exist precisely so that "nothing happened" is always
// explained; on more than half the app it was not.
//
// ⚠ THERE IS NO WORDING IN THIS FILE AND THERE MAY NEVER BE ONE (CLAUDE.md invariant 4). It renders
// whatever the store wrote, and its element, class and shape are the ones the five shipped copies
// already used – this is a home for them, not a new notice.
//
// ⚠ WHY A COMPONENT RATHER THAN ONE NOTICE IN THE APP SHELL. The review proposed a single `<p>` in
// `App.vue`'s frame, which cannot reach two of the surfaces that need it: `OnboardingWizard` is
// branched ABOVE the tab shell (it is what `showOnboarding` renders instead of it), and the five
// takeovers – the tournament flow, the two sheets, the letter and the fork – are fixed overlays
// painted OVER the frame, so a paragraph in the flow would sit behind them. Each surface also owns
// where the line may stand: Home's had to move inside `ScreenShell` in round 35 #11 because the
// hero's full-bleed margin was eating it, and the Kid screen is built the same way. One element,
// placed by the screen that knows its own paint order.
//
// `role="status"` because an error that appears without moving focus is announced by nothing
// otherwise; it is a polite live region, so it never interrupts.
import { useGameStore } from '../../stores/game'

const game = useGameStore()
</script>

<template>
  <p v-if="game.error" class="error" role="status">{{ game.error }}</p>
</template>
