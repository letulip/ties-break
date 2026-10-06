<script setup lang="ts">
// LAYOUT A – THE OPENING SHEET WITH THE POLAROID (mockup AY, and AW at the wider widths).
//
// What it draws, in the order the mockup stacks them: the chapter title block, a big TAPED polaroid,
// the pasted note to its right, a second polaroid overlapping the first at the bottom right, the
// club patch, a doodle beside it, and the parent's loose line across the bottom.
//
// ⚠ ABSOLUTE POSITIONS, AND THE REASON IS THE OBJECT RATHER THAN LAZINESS. A page in an album is a
// COLLAGE: things overlap, lean and hang off the edge, and two of those three are exactly what a
// flow layout exists to prevent. The second polaroid sitting ON the first is the design (the owner's
// mockup has them overlapping by some 30px), and the note running past the right edge is what the
// pan is FOR – at 390 the reader discovers it by scrolling, which is the affordance the README
// describes.
//
// ⚠ EVERY SENTENCE HERE ARRIVES ON THE MODEL. The caption under a photograph, the writing on the
// note and the loose line are `albumCorpus.ts`'s three registers – about her, to her, and to nobody.
// This template contains no sentence of its own and must not grow one (invariant 4).
import { computed } from 'vue'
import AlbumPhoto from './AlbumPhoto.vue'
import AlbumNoteCard from './AlbumNoteCard.vue'
import AlbumPatch from './AlbumPatch.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import AlbumSheetTitle from './AlbumSheetTitle.vue'
import { noteSpot, placeSheet, spot } from './albumPlacement'
import type { AlbumSheetModel } from '../../shared/protocol'

const props = defineProps<{ sheet: AlbumSheetModel }>()

// ⭐ WHERE THE PHOTOGRAPHS, THE NOTE AND THE LOOSE LINE STAND IS ONE PURE FUNCTION'S ANSWER (round 45 #6,
// `albumPlacement.ts`): the drawing's own numbers live in its table and a note or a line that would sit
// on a photograph's caption is moved off it. This file binds the answer and owns no coordinate of them.
const placed = computed(() => placeSheet(props.sheet))
</script>

<template>
  <div class="album-a">
    <AlbumSheetTitle
      class="album-a-head"
      :index="sheet.chapterIndex"
      :title="sheet.chapterTitle"
      :age-label="sheet.ageLabel"
    />

    <AlbumPhoto
      v-if="sheet.frames[0] && placed.photos[0]"
      class="album-a-hero"
      :style="spot(placed.photos[0])"
      :frame="sheet.frames[0]"
      tape
      :tilt="placed.photos[0].tilt"
      :photo-height="placed.photos[0].photoH"
    />

    <AlbumNoteCard
      v-if="sheet.note && placed.note"
      class="album-a-note"
      :style="noteSpot(placed.note)"
      :note="sheet.note"
      torn="right"
      :tilt="1.4"
    />

    <AlbumPhoto
      v-if="sheet.frames[1] && placed.photos[1]"
      class="album-a-second"
      :style="spot(placed.photos[1])"
      :frame="sheet.frames[1]"
      clip
      :tilt="placed.photos[1].tilt"
      :photo-height="placed.photos[1].photoH"
    />

    <AlbumPatch v-if="sheet.patch" class="album-a-patch" :patch="sheet.patch" />

    <AlbumDoodleMark
      v-if="sheet.doodles[0]"
      class="album-a-doodle"
      :mark="sheet.doodles[0]"
      :size="26"
    />

    <p v-if="sheet.line && placed.line" class="album-a-line" :style="spot(placed.line)">{{ sheet.line }}</p>
  </div>
</template>

<style scoped>
.album-a {
  position: absolute;
  inset: 0;
}

.album-a-head {
  position: absolute;
  left: 34px;
  top: 26px;
}

.album-a-hero {
  position: absolute;
}

/* ⚠ IT RUNS OFF THE RIGHT EDGE ON PURPOSE. 342px of a 390 phone shows the picture and the first
   inch of the note; the rest is what the pan gives back. The sheet clips it (`overflow: hidden` on
   the paper), so nothing escapes the page – it is tucked under the edge, like a note stuck on
   slightly too far over. */
/* ⚠⚠ 484 WAS 14px PAST THE PAGE AND THE PAGE CLIPS (measured 19.09, real Chromium, border-box).
 * The first reading of this was «deliberate at 390 – the rest is what the pan gives back», and it
 * is wrong in a way worth writing down: the pan moves the WINDOW over the page, but the note is cut
 * by `AlbumPaper`'s own `overflow: hidden` at 470, so the last 14px of his sentence were gone at
 * EVERY width and no amount of panning brought them back. Same failure family as the B/C notes
 * anchored to the top: the sheet silently eating the owner's words. 294 + 176 = 470 exactly, which
 * is also the mockup's own proportion (AW puts the note's left edge at 63.3% of the page). */
.album-a-note {
  position: absolute;
}

.album-a-second {
  position: absolute;
}

.album-a-patch {
  position: absolute;
  left: 28px;
  top: 368px;
}

.album-a-doodle {
  position: absolute;
  left: 128px;
  top: 388px;
}

.album-a-line {
  position: absolute;
  margin: 0;
  font-size: 21px;
  line-height: 1.25;
  color: var(--paper-ink-soft);
}
</style>
