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
import { computed } from 'vue'
import AlbumPhoto from './AlbumPhoto.vue'
import AlbumNoteCard from './AlbumNoteCard.vue'
import AlbumTagCard from './AlbumTagCard.vue'
import AlbumFillerPhoto from './AlbumFillerPhoto.vue'
import AlbumDoodleMark from './AlbumDoodleMark.vue'
import AlbumSheetTitle from './AlbumSheetTitle.vue'
import { noteSpot, placeSheet, spot } from './albumPlacement'
import { trophyArtUrl } from '../../art/trophies'
import type { AlbumSheetModel } from '../../shared/protocol'

const props = defineProps<{ sheet: AlbumSheetModel }>()

// ⭐ WHERE THE PHOTOGRAPHS, THE NOTE AND THE LOOSE LINE STAND IS ONE PURE FUNCTION'S ANSWER (round 45 #6,
// `albumPlacement.ts`): the drawing's own numbers live in its table and a note or a line that would sit
// on a photograph's caption is moved off it. This file binds the answer and owns no coordinate of them.
const placed = computed(() => placeSheet(props.sheet))

const tagStyle = computed(() => (placed.value.tagScale < 1 ? { transform: `scale(${placed.value.tagScale})`, transformOrigin: '50% 0' } : undefined))

// ⭐ r50 №3 – the cup stands where the resolver said, leaning as it said; the art url is `trophyArtUrl`'s,
// the one builder of that spelling (`art/trophies.ts` – the engine ships only the rung and the metal).
const cupStyle = computed(() => {
  const cup = placed.value.cup
  return cup ? { ...spot({ x: cup.x, y: cup.y, w: cup.size }), transform: `rotate(${cup.tilt}deg)` } : undefined
})
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
      v-if="sheet.frames[0] && placed.photos[0]"
      class="album-c-hero"
      :style="spot(placed.photos[0])"
      :frame="sheet.frames[0]"
      tape
      :tilt="placed.photos[0].tilt"
      :photo-height="placed.photos[0].photoH"
    />

    <!-- ⭐ ROUND 48 #1b – a tag the book's TAIL hung is drawn only where the column is clear, at the rung the resolver found (`placed.tagDrawn`, `placed.tagScale`);
         a tag of the sheet's own is always drawn at its own size. It hangs from its string, so the rung shrinks it about the top edge's middle. -->
    <AlbumTagCard v-if="sheet.tag && placed.tagDrawn" class="album-c-tag" :style="tagStyle" :tag="sheet.tag" />

    <!-- ⭐ ROUND 47 #14 – a tagless sheet's column is empty; the resolver hangs a small snapshot in it when there is room (`placeFiller`). -->
    <AlbumFillerPhoto
      v-if="sheet.filler && placed.filler"
      :style="spot(placed.filler)"
      :filler="sheet.filler"
      :tilt="placed.filler.tilt"
      :photo-height="placed.filler.photoH"
    />

    <!-- ⭐ r50 №3 – the chapter's best cup in the sheet's free corner: frameless transparent art whose shadow
         is a drop-shadow along the alpha edge (his words, quoted verbatim beside `.album-c-cup`'s CSS
         below – templates carry no Cyrillic by the copy rule).
         Decoration like the snapshot – no alt, no copy; which cup is the engine's (`sheet.cup`), where is the
         resolver's (`placed.cup`), and a sheet with no clear corner shows none. -->
    <img
      v-if="sheet.cup && placed.cup"
      class="album-c-cup"
      :style="cupStyle"
      :src="trophyArtUrl(sheet.cup.tier, sheet.cup.metal)"
      alt=""
      aria-hidden="true"
    />

    <AlbumNoteCard
      v-if="sheet.note && placed.note"
      class="album-c-note"
      :style="noteSpot(placed.note)"
      :note="sheet.note"
      :tilt="-1.1"
    />

    <AlbumPhoto
      v-if="sheet.frames[1] && placed.photos[1]"
      class="album-c-second"
      :style="spot(placed.photos[1])"
      :frame="sheet.frames[1]"
      clip
      :tilt="placed.photos[1].tilt"
      :photo-height="placed.photos[1].photoH"
    />

    <AlbumDoodleMark
      v-if="sheet.doodles[0]"
      class="album-c-doodle"
      :mark="sheet.doodles[0]"
      :size="24"
    />

    <p v-if="sheet.line && placed.line" class="album-c-line" :style="spot(placed.line)">{{ sheet.line }}</p>
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
}

.album-c-second {
  position: absolute;
}

/* r50 №3 – the trophy lies on the paper with only its shadow anchoring it: no card and no border, the
   drop-shadow follows the cut-out's alpha edge, which is what makes it read as an object on the page
   rather than a pasted rectangle. */
/* ⚠ r50 №3 (12.10), the owner's words verbatim (the template comment points here): «без рамки,
   просто прозрачный фон и картинка с тенюшкой». */
.album-c-cup {
  position: absolute;
  filter: drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.3));
}

.album-c-doodle {
  position: absolute;
  left: 368px;
  top: 401px;
}

.album-c-line {
  position: absolute;
  margin: 0;
  font-size: 19px;
  line-height: 1.25;
  color: var(--paper-ink-soft);
}
</style>
