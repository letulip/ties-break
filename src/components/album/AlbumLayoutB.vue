<script setup lang="ts">
// LAYOUT B – THREE PHOTOGRAPHS AND THE BOARDING PASS (mockup AZ-B). The ordinary sheet: it opens
// nothing, so it carries no chapter title and spends the whole page on the week itself.
//
// The owner's sentence about it is the brief and the acceptance test both: «Читается как поездка, а
// не как украшение» – two landscape frames across the top, one portrait down the right edge, the
// ruled note under them, and the long pass ANCHORING the bottom. The pass is anchored because it is
// the object that makes the page a journey; floated in the middle it would be a sticker.
//
// ⚠ Every string arrives on the model – captions, the note and the loose line are the corpus's.
import { computed } from 'vue'
import AlbumPhoto from './AlbumPhoto.vue'
import AlbumNoteCard from './AlbumNoteCard.vue'
import AlbumTicketPass from './AlbumTicketPass.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import { placeSheet, spot } from './albumPlacement'
import type { AlbumSheetModel } from '../../shared/protocol'

const props = defineProps<{ sheet: AlbumSheetModel }>()

// ⭐ WHERE THE PHOTOGRAPHS, THE NOTE AND THE LOOSE LINE STAND IS ONE PURE FUNCTION'S ANSWER (round 45 #6,
// `albumPlacement.ts`): the drawing's own numbers live in its table and a note or a line that would sit
// on a photograph's caption is moved off it. This file binds the answer and owns no coordinate of them.
const placed = computed(() => placeSheet(props.sheet))
</script>

<template>
  <div class="album-b">
    <AlbumPhoto
      v-if="sheet.frames[0] && placed.photos[0]"
      class="album-b-one"
      :style="spot(placed.photos[0])"
      :frame="sheet.frames[0]"
      tape
      :tilt="placed.photos[0].tilt"
      :photo-height="placed.photos[0].photoH"
    />

    <AlbumPhoto
      v-if="sheet.frames[1] && placed.photos[1]"
      class="album-b-two"
      :style="spot(placed.photos[1])"
      :frame="sheet.frames[1]"
      :tilt="placed.photos[1].tilt"
      :photo-height="placed.photos[1].photoH"
    />

    <!-- The portrait down the right edge. It overlaps the second landscape by design – the mockup
         has it sitting on top of that frame's bottom-right corner. -->
    <AlbumPhoto
      v-if="sheet.frames[2] && placed.photos[2]"
      class="album-b-three"
      :style="spot(placed.photos[2])"
      :frame="sheet.frames[2]"
      clip
      :tilt="placed.photos[2].tilt"
      :photo-height="placed.photos[2].photoH"
    />

    <AlbumNoteCard
      v-if="sheet.note && placed.note"
      class="album-b-note"
      :style="spot(placed.note)"
      :note="sheet.note"
      :tilt="-0.8"
    />

    <p v-if="sheet.line && placed.line" class="album-b-line" :style="spot(placed.line)">{{ sheet.line }}</p>

    <AlbumDoodleMark
      v-if="sheet.doodles[0]"
      class="album-b-doodle"
      :mark="sheet.doodles[0]"
      :size="24"
    />

    <AlbumTicketPass v-if="sheet.ticket" class="album-b-pass" :ticket="sheet.ticket" />
  </div>
</template>

<style scoped>
.album-b {
  position: absolute;
  inset: 0;
}

.album-b-one {
  position: absolute;
}

.album-b-two {
  position: absolute;
}

.album-b-three {
  position: absolute;
}

/* Bottom-anchored for the reason layout C's note spells out: a note that grows must grow away from
   the edge of the page, not through it. Its floor here is the pass. */
.album-b-note {
  position: absolute;
}

.album-b-line {
  position: absolute;
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  color: var(--paper-ink-soft);
}

.album-b-doodle {
  position: absolute;
  left: 131px;
  top: 268px;
}

/* ⚠ THE ANCHOR, AND IT IS AN ANCHOR IN THE CSS TOO. Pinned to both sides rather than given a width:
   the pass is the one object on the sheet that spans it, and a width would have to be re-derived
   every time the margins moved. */
.album-b-pass {
  position: absolute;
  left: 22px;
  right: 48px;
  bottom: 48px;
}
</style>
