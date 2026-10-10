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
//
// ⚠⚠ AND SINCE E-09 / T4.8 (27.09) THE FIVE SHIPPED COPIES THIS FILE WAS WRITTEN FOR ARE GONE, which
// is what the header above has claimed to be «a home for» since 05.09. U-02 was fixed where it was
// MEASURED – on the nine silent surfaces – and never reached the five that already rendered the
// sentence by hand, so the two busiest screens in the app said a refusal with no live region at all.
// ⚠ FOUR MOVED FIRST AND THE FIFTH FOLLOWED THE SAME DAY. `SeasonScreen.vue`'s copy was another
// builder's file in the same wave, so this note recorded it as E-09's one open site; that builder
// landed it later on 27.09 and the record is kept in order rather than rewritten, because «four of
// five is not five» was true for a few hours and the wave's claim depended on it. Every hand-rolled
// copy now reads this element.
//
// ⚠ `except` IS MoreScreen'S GUARD AND NOTHING ELSE, and it is the finding's own first option. That
// screen's Saves strip renders `saveOp.message` in its own row a few lines up, so the one sentence
// this element must NOT repeat is that one – «Import failed – …» printed twice, once as the operation's
// result and once as the store's error, was the reason its copy carried a hand-written condition. The
// prop is a SENTENCE to suppress, never a sentence to write: there is still no wording in this file and
// there may never be one (CLAUDE.md invariant 4).
import { computed } from 'vue'
import { SAVE_CONFLICT_RELOAD_LABEL, useGameStore } from '../../stores/game'
import { errorText } from '../../composables/errorText'

const props = defineProps<{
  /** A sentence this surface has already said somewhere else, and must not say twice. */
  except?: string | null
}>()

const game = useGameStore()

// ⭐ L3-7 (10.10; and, for a refused save file, its sentence `errorC` beside the code – the L3-7 close-out): the sentence is the store's `error` read THROUGH ITS CODE (`errorText`): a known code is the `t()` of that very sentence, an unknown or absent one is the raw `error` as before. The `except`
// comparison stays on the raw sentence – it asks whether this is the one the Saves strip already printed, which is a fact about the sentence and not about the language.
const shown = computed(() => (game.error && game.error !== props.except ? errorText(game.errorCode, game.error, game.errorC) : ''))

// T7.0: the Reload label is the STORE's (SAVE_CONFLICT_RELOAD_LABEL) – this file renders what the store owns, no wording of its own.
// ⚠⚠ THE BUTTON IS INSIDE THE `<p>` AND THE `<p>` STAYS THE ONLY ROOT, ON PURPOSE: Vue hands a parent's scoped-style attribute to a
// child's root element only when the child HAS ONE root, and a sibling `<button>` made this a fragment – KidScreen's and HomeScreen's
// scoped `.error { grid-column }` stopped matching EVERY store error (measured: '1 / -1' became '', and no gate saw it). The `<br>`
// puts the button under the sentence without any CSS. tests/component/principles-w7-reload.test.ts (i) is the guard.
// ⚠ AND THE `<p>` RENDERS ONLY WHEN THERE IS A SENTENCE TO SHOW, as it always did: that is what keeps a kind that outlived its
// sentence (a fixture clearing `error` by assignment – round36-error-surfaces.test.ts does) from drawing an orphan Reload, and
// MoreScreen's `except` from drawing one beside the strip's own copy of the sentence. (h) and the w4 «not twice» case are the guards.
const offerReload = computed(() => game.errorKind === 'save-conflict')

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <p v-if="shown" class="error" role="status">
    {{ shown }}<br v-if="offerReload" /><button v-if="offerReload" type="button" @click="reload">{{ SAVE_CONFLICT_RELOAD_LABEL }}</button>
  </p>
</template>
