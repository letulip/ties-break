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
import AlbumPhoto from './AlbumPhoto.vue'
import AlbumNoteCard from './AlbumNoteCard.vue'
import AlbumTicketPass from './AlbumTicketPass.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import type { AlbumSheetModel } from './albumWire'

defineProps<{ sheet: AlbumSheetModel }>()
</script>

<template>
  <div class="album-b">
    <AlbumPhoto
      v-if="sheet.frames[0]"
      class="album-b-one"
      :frame="sheet.frames[0]"
      tape
      :tilt="-2"
      :photo-height="120"
    />

    <AlbumPhoto
      v-if="sheet.frames[1]"
      class="album-b-two"
      :frame="sheet.frames[1]"
      :tilt="2.4"
      :photo-height="104"
    />

    <!-- The portrait down the right edge. It overlaps the second landscape by design – the mockup
         has it sitting on top of that frame's bottom-right corner. -->
    <AlbumPhoto
      v-if="sheet.frames[2]"
      class="album-b-three"
      :frame="sheet.frames[2]"
      clip
      :tilt="1.6"
      :photo-height="140"
    />

    <AlbumNoteCard v-if="sheet.note" class="album-b-note" :note="sheet.note" :tilt="-0.8" />

    <p v-if="sheet.line" class="album-b-line">{{ sheet.line }}</p>

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
  left: 15px;
  top: 15px;
  width: 162px;
}

.album-b-two {
  position: absolute;
  left: 195px;
  top: 18px;
  width: 159px;
}

.album-b-three {
  position: absolute;
  left: 339px;
  top: 123px;
  width: 123px;
}

/* Bottom-anchored for the reason layout C's note spells out: a note that grows must grow away from
   the edge of the page, not through it. Its floor here is the pass. */
.album-b-note {
  position: absolute;
  left: 167px;
  bottom: 195px;
  width: 151px;
}

.album-b-line {
  position: absolute;
  left: 26px;
  top: 250px;
  width: 132px;
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
