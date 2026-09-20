<script setup lang="ts">
// LAYOUT C – ONE BIG PHOTOGRAPH AND THE BAGGAGE TAG (mockup AZ-C). The other opening sheet, and the
// reason there are two: A spends its page on a beginning (a patch, a doodle, a small second frame),
// C spends it on a single picture that earned the whole page, with the tag hanging beside it.
//
// The mockup's own proportions: the hero carries roughly two thirds of the sheet, the tall tag hangs
// on its drawn string to the right of it, and the note and the smaller photograph sit underneath.
//
// ⚠ A and C ALTERNATE AND NEVER REPEAT BACK TO BACK (spec §3) – but that is the ENGINE's choice,
// made when it assembles the book. This component renders the layout it is handed and knows nothing
// about the one before it.
import AlbumPhoto from './AlbumPhoto.vue'
import AlbumNoteCard from './AlbumNoteCard.vue'
import AlbumTagCard from './AlbumTagCard.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import AlbumSheetTitle from './AlbumSheetTitle.vue'
import type { AlbumSheetModel } from '../../shared/protocol'

defineProps<{ sheet: AlbumSheetModel }>()
</script>

<template>
  <div class="album-c">
    <AlbumSheetTitle
      class="album-c-head"
      :index="sheet.chapterIndex"
      :title="sheet.chapterTitle"
      :age-label="sheet.ageLabel"
    />

    <AlbumPhoto
      v-if="sheet.frames[0]"
      class="album-c-hero"
      :frame="sheet.frames[0]"
      tape
      :tilt="-0.8"
      :photo-height="196"
    />

    <AlbumTagCard v-if="sheet.tag" class="album-c-tag" :tag="sheet.tag" />

    <AlbumNoteCard v-if="sheet.note" class="album-c-note" :note="sheet.note" :tilt="-1.1" />

    <AlbumPhoto
      v-if="sheet.frames[1]"
      class="album-c-second"
      :frame="sheet.frames[1]"
      clip
      :tilt="1.8"
      :photo-height="100"
    />

    <AlbumDoodleMark
      v-if="sheet.doodles[0]"
      class="album-c-doodle"
      :mark="sheet.doodles[0]"
      :size="24"
    />

    <p v-if="sheet.line" class="album-c-line">{{ sheet.line }}</p>
  </div>
</template>

<style scoped>
.album-c {
  position: absolute;
  inset: 0;
}

.album-c-head {
  position: absolute;
  left: 33px;
  top: 26px;
}

.album-c-hero {
  position: absolute;
  left: 26px;
  top: 100px;
  width: 276px;
}

/* The tag hangs from the same line the hero's tape sits on, which is what makes the string read as
   fastened to the page rather than as floating beside it. */
.album-c-tag {
  position: absolute;
  left: 327px;
  top: 77px;
  width: 110px;
}

/* ⚠⚠ ANCHORED TO THE BOTTOM AND NOT TO THE TOP, AND IT IS THE SAME FAILURE AS ROUND-20 #3 WEARING
   DIFFERENT CLOTHES: a note grows by one honest sentence at a time and nothing objects until its
   last line is past the edge of the page, where the sheet's own `overflow: hidden` silently cuts it
   off. The mockup's note is three short lines; the corpus has four-line ones, and which of the two a
   sheet gets is the engine's choice, not this file's. Anchored from the bottom, a longer note grows
   UPWARDS into the empty middle of the page and the parent's last line is always readable. */
.album-c-note {
  position: absolute;
  left: 28px;
  bottom: 36px;
  width: 156px;
}

.album-c-second {
  position: absolute;
  left: 204px;
  top: 332px;
  width: 138px;
}

.album-c-doodle {
  position: absolute;
  left: 368px;
  top: 401px;
}

.album-c-line {
  position: absolute;
  left: 388px;
  top: 368px;
  width: 74px;
  margin: 0;
  font-size: 19px;
  line-height: 1.25;
  color: var(--paper-ink-soft);
}
</style>
