<script setup lang="ts">
// THE OPENING BLOCK OF A CHAPTER SHEET – the three lines at the top left of layouts A and C: the
// chapter's number, its name, and the years it covers. Handwritten, because the whole page is.
//
// ⚠ ALL THREE STRINGS ARE THE ENGINE'S. The chapter names are the owner's and still drafts (spec
// §9: «Названия пяти глав и все слова на листах – его»); the age range is formatted engine-side
// with the house's short dash. Nothing here writes a word – only the number's own «–» rule, which
// is the mockup's own mark and not copy.
//
// ⭐⭐ ROUND 47 #9 – «в альбоме очень крупные заголовки на страницах, можно чуть уменьшить»: ONE STEP DOWN, ALL THREE LINES, the hierarchy
// kept – the chapter's name 44 -> 38px (x0.86), the «– Chapter N» kicker 19 -> 17, the years 21 -> 19, and the gaps between them 4 / 8 -> 3 / 6, so
// the block is 83px tall (it was 96, measured in Chromium). ⚠ THE HEIGHT IS A NUMBER THE PAGE SHARES: layout C hangs its hero a few pixels under
// it and `albumPlacement.ts` reserves it (`HEAD_H`). The old 96px block reached 22px INTO the hero on every C sheet – the years line lay under the
// photograph. Both halves are held by `tests/r47-b3-album-headings.test.ts`; no word changed, only sizes.
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
  font-size: 17px;
  line-height: 1;
  color: var(--paper-ink-soft);
}

.album-title-name {
  margin: 3px 0 0;
  font-family: var(--font-hand);
  font-size: 38px;
  /* ⚠ 600 AND NOT 700, AND IT IS A SHIPPING FACT RATHER THAN A TASTE. Caveat is self-hosted at 400
     and 600 only, so a 700 here is a SYNTHESISED bold – the browser smearing the 400 – and
     `tests/component/round35-ui.test.ts`'s font census goes red on it by name. Measured: it did,
     on this very rule. 600 is the heaviest real Caveat the app has. */
  font-weight: 600;
  line-height: 1;
}

.album-title-age {
  margin: 6px 0 0 12px;
  font-size: 19px;
  line-height: 1;
  color: var(--paper-ink-soft);
}
</style>
