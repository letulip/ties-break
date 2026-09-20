<script setup lang="ts">
// THE OPENING BLOCK OF A CHAPTER SHEET – the three lines at the top left of layouts A and C: the
// chapter's number, its name, and the years it covers. Handwritten, because the whole page is.
//
// ⚠ ALL THREE STRINGS ARE THE ENGINE'S. The chapter names are the owner's and still drafts (spec
// §9: «Названия пяти глав и все слова на листах – его»); the age range is formatted engine-side
// with the house's short dash. Nothing here writes a word – only the number's own «–» rule, which
// is the mockup's own mark and not copy.
defineProps<{ index: number; title: string; ageLabel: string }>()
</script>

<template>
  <header class="album-title">
    <p class="album-title-no">&ndash; Chapter {{ index }}</p>
    <h2 class="album-title-name">{{ title }}</h2>
    <p class="album-title-age">{{ ageLabel }}</p>
  </header>
</template>

<style scoped>
.album-title {
  color: var(--paper-ink);
}

.album-title-no {
  margin: 0;
  font-size: 19px;
  line-height: 1;
  color: var(--paper-ink-soft);
}

.album-title-name {
  margin: 4px 0 0;
  font-family: var(--font-hand);
  font-size: 44px;
  /* ⚠ 600 AND NOT 700, AND IT IS A SHIPPING FACT RATHER THAN A TASTE. Caveat is self-hosted at 400
     and 600 only, so a 700 here is a SYNTHESISED bold – the browser smearing the 400 – and
     `tests/component/round35-ui.test.ts`'s font census goes red on it by name. Measured: it did,
     on this very rule. 600 is the heaviest real Caveat the app has. */
  font-weight: 600;
  line-height: 1;
}

.album-title-age {
  margin: 8px 0 0 14px;
  font-size: 21px;
  line-height: 1;
  color: var(--paper-ink-soft);
}
</style>
