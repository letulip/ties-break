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
import AlbumFillerPhoto from './AlbumFillerPhoto.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import { noteSpot, placeSheet, spot } from './albumPlacement'
import type { AlbumSheetModel } from '../../shared/protocol'

const props = defineProps<{ sheet: AlbumSheetModel }>()

// ⭐ WHERE THE PHOTOGRAPHS, THE NOTE AND THE LOOSE LINE STAND IS ONE PURE FUNCTION'S ANSWER (round 45 #6,
// `albumPlacement.ts`): the drawing's own numbers live in its table and a note or a line that would sit
// on a photograph's caption is moved off it. This file binds the answer and owns no coordinate of them.
const placed = computed(() => placeSheet(props.sheet))

// ⭐ ROUND 48 #1a – the SECOND small snapshot of a wide strip, as the `AlbumFillerPhoto` it draws with (`filler.pair` is its picture's path, `placed.filler.pair` where
// the resolver found room for two).
const pairFiller = computed(() => (props.sheet.filler?.pair ? { art: props.sheet.filler.pair } : null))
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
      :style="noteSpot(placed.note)"
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

    <!-- ⭐ ROUND 48 #1c – a pass the book's TAIL hung is drawn only where the strip is clear (`placed.ticketDrawn`); a pass of the sheet's own is always drawn. -->
    <AlbumTicketPass v-if="sheet.ticket && placed.ticketDrawn" class="album-b-pass" :ticket="sheet.ticket" />

    <!-- ⭐ ROUND 47 #14 – a ticketless sheet's strip is empty; the resolver hangs a small snapshot in it when there is room (`placeFiller`). -->
    <AlbumFillerPhoto
      v-if="sheet.filler && placed.filler"
      :style="spot(placed.filler)"
      :filler="sheet.filler"
      :tilt="placed.filler.tilt"
      :photo-height="placed.filler.photoH"
    />

    <!-- ⭐ ROUND 48 #1a – a horizontal gap wide enough for two takes a SECOND snapshot beside the first (his vacation-pair ask, quoted in docs/rounds/round-48.md item 1): the strip is 400px wide and holds two. -->
    <AlbumFillerPhoto
      v-if="pairFiller && placed.filler?.pair"
      :style="spot(placed.filler.pair)"
      :filler="pairFiller"
      :tilt="placed.filler.pair.tilt"
      :photo-height="placed.filler.pair.photoH"
    />
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
   every time the margins moved.
   ⭐⭐ ROUND 47 #8 – «ниже опустить» AND «на 10% меньше». ONE transform, three words, and ONE origin:
     * `scale(0.9)` – ten percent smaller, type and all (the box stays the 400px frame the resolver holds);
     * `rotate(5deg)` – round 46's attitude, untouched (clockwise);
     * `transform-origin: 0 0` – the turn is about the TOP-LEFT corner, so the swing is spent DOWNWARDS: the right
       end drops ~31px into the page's lower margin, the left foot leans out ~9px, and nothing rises above the
       frame's top edge. About the centre (round 46) the left end lifted 17px into the strip the loose line is
       drawn in, and on the lower steps the box itself stood above the frame (see `passBox`) – the overlap he saw.
       `passBox` in `albumPlacement.ts` keeps the loose line above that edge.
     * `translateX(4px)` – the leaning foot would otherwise stand 12.5px from the page edge; 4px keeps it at 16.7
       (round 46's own >= 15px margin).
   `min-height` is `PASS_H`'s twin: the pass is ONE height, so the frame is one number (see `passBox`). `bottom: 34px`
   is where that frame sits: the turned pass's lowest corner (the right end, 31px below the top-left and 108px of
   drawn height under it) lands 15px from the page's edge – the same margin the photographs keep – and no lower.
   `tests/component/round46-album-pass-tilt.test.ts` reads all of it off the mounted page. */
.album-b-pass {
  position: absolute;
  left: 22px;
  right: 48px;
  bottom: 34px;
  min-height: 121px;
  transform-origin: 0 0;
  transform: translateX(4px) rotate(5deg) scale(0.9);
}
</style>
