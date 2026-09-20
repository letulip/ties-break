<script setup lang="ts">
// ONE SHEET: the paper, and whichever of the three arrangements this sheet earned.
//
// ⚠ THE LAYOUT IS THE ENGINE'S DECISION AND THIS IS ONLY THE SWITCH. Spec §3 decides it – the first
// sheet of a chapter opens (A or C, alternating, never twice in a row), the rest are ordinary (B) –
// and that rule belongs beside the selection it depends on, not in a component that can see one
// sheet at a time.
//
// ⚠ IT IS AN `<article>` WITH A LABEL, because a sheet is the unit a reader pages through and the
// pan is a scroller full of them: without a name each one is an anonymous box in the accessibility
// tree, and «Sheet 3» is the only thing that distinguishes them. The label is the chapter's own
// title, which is a string the engine already owns.
import AlbumPaper from './AlbumPaper.vue'
import AlbumLayoutA from './AlbumLayoutA.vue'
import AlbumLayoutB from './AlbumLayoutB.vue'
import AlbumLayoutC from './AlbumLayoutC.vue'
import type { AlbumSheetModel } from '../../shared/protocol'

defineProps<{ sheet: AlbumSheetModel }>()
</script>

<template>
  <AlbumPaper
    class="album-sheet"
    role="group"
    :aria-label="sheet.chapterTitle"
    :data-layout="sheet.layout"
  >
    <AlbumLayoutA v-if="sheet.layout === 'A'" :sheet="sheet" />
    <AlbumLayoutC v-else-if="sheet.layout === 'C'" :sheet="sheet" />
    <AlbumLayoutB v-else :sheet="sheet" />
  </AlbumPaper>
</template>

<style scoped>
.album-sheet {
  /* Each sheet is a snap point of the pan: the scroller lands on a page edge rather than halfway
     across a photograph. `proximity` on the scroller, not `mandatory` – see AlbumScreen. */
  scroll-snap-align: start;
}
</style>
