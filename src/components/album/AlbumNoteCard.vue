<script setup lang="ts">
// THE PASTED NOTE – the app's `PaperNote` on ruled stock with a hand-cut edge, carrying the
// corpus's `note`: the register that speaks TO her, second person («First day on court. You were so
// excited»).
//
// ⚠ THE RULING LIVES HERE AND NOWHERE ELSE ON THE SHEET. The README is explicit – «Линовка осталась
// только на приклеенных записках» – so the page under this scrap is unruled and this scrap is
// lined. That is what makes it read as something stuck ON the album rather than as part of it.
//
// ⚠⚠ THE DATE AND THE AGE ARE NOT CORPUS STRINGS AND MUST NOT BE. `albumCorpus.ts`'s own header
// says so: «no string here writes either, because a corpus cannot know them». They arrive already
// formatted from the engine, off the frame's own week, and this component only places them – above
// the writing, the way the mockup has them.
import PaperNote from '../ui/PaperNote.vue'
import type { AlbumNote } from '../../shared/protocol'

withDefaults(
  defineProps<{
    note: AlbumNote
    tilt?: number | string
    /** Which top corner the cut dips at – two scraps on one sheet are never the same tear twice. */
    torn?: 'left' | 'right'
    tape?: boolean
  }>(),
  { tilt: 0, torn: 'left', tape: false },
)
</script>

<template>
  <PaperNote class="album-note" ruled :torn="torn" :tape="tape" :tilt="tilt">
    <p v-if="note.dateLabel || note.ageLabel" class="album-note-when">
      <span v-if="note.dateLabel">{{ note.dateLabel }}</span>
      <span v-if="note.ageLabel">{{ note.ageLabel }}</span>
    </p>
    <!-- Prose, or the checklist form the mockups use when the note is three short facts rather
         than a sentence. One or the other, never both: the engine decides which shape the
         occasion earned. -->
    <p v-if="note.text" class="album-note-text">{{ note.text }}</p>
    <ul v-else-if="note.lines.length" class="album-note-list">
      <li v-for="(l, i) in note.lines" :key="i">{{ l }}</li>
    </ul>
  </PaperNote>
</template>

<style scoped>
/* THE HANDWRITING SITS ON THE RULES, which is the one thing a lined note gets wrong by default:
   `PaperNote`'s body is 17px/1.3 (22.1px) and the stock's ruling repeats every 26px, so the writing
   drifts off the lines by four pixels a row. Matching the line-height to the ruling costs nothing
   and is the difference between paper and a box with stripes behind it. */
.album-note :deep(.tb-paper) {
  padding: 10px 13px 12px;
  line-height: 26px;
}

.album-note-when {
  display: flex;
  gap: 14px;
  margin: 0;
  /* The date is the smaller hand – it was written first, at the top, before the sentence. */
  font-size: 15px;
  color: var(--paper-ink-soft);
}

.album-note-text {
  margin: 0;
}

.album-note-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
