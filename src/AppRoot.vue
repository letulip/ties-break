<script setup lang="ts">
// THE ROOT THE APP MOUNTS (L1a, spec §3.4): the first-run locale prompt in front of `App.vue`.
//
// ⚠ WHY A ROOT OF ITS OWN AND NOT A BRANCH IN App.vue. The owner asked for the language question
// «может даже до всего остального для первого входа» – before the splash, before the recovery
// screen, before the wizard. App.vue's top-level chain (`recovery → Loading → splash → prologue →
// wizard → shell`) is the boot flow, a 2,000-line file that dozens of mounted tests and source pins
// read; this wrapper puts the question ahead of ALL of it without touching one branch of it, and
// without those tests meeting a prompt they never asked for. `game.init()` runs when `App` mounts,
// i.e. right after the answer – a few hundred milliseconds later on the one launch that asks.
//
// ⚠ THREE STATES, AND ONLY ONE OF THEM IS EVER BLANK. Never answered → the prompt. Answered and its
// language on screen → the app. Answered but the catalog is still loading (a returning Russian
// player's first frame) → nothing yet, bounded by `CATALOG_TIMEOUT_MS`, so a chunk that cannot be
// fetched costs four seconds of an empty page and then English, never a stuck one. English players
// are never in the third state.
import App from './App.vue'
import LocalePrompt from './components/LocalePrompt.vue'
import { initLocale, localeSettled, needsLocaleChoice } from './i18n'

void initLocale()
</script>

<template>
  <LocalePrompt v-if="needsLocaleChoice" />
  <App v-else-if="localeSettled" />
</template>
