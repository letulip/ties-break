<script setup lang="ts">
// U0 #5 – POLAROID. Cream paper, a fat bottom lip, a tilt, and a photograph inside it. The only
// LIGHT surface in the app, and the reason Home's memory card reads as a page from an album rather
// than as a thumbnail in a list.
//
// Absorbs `.memory-polaroid` on Home. The Money screen's trip photo (G, 130x126) is the next caller
// and needs nothing new from it - which is the test this shape was designed against.
//
// WHAT THE CALLER STILL OWNS: where the polaroid sits and how wide it is. A polaroid is dropped ON
// something, and only the thing it is dropped on knows where. What it may NOT own is the frame -
// the padding, the paper, the shadow and the tilt are the object, and they live here.
withDefaults(
  defineProps<{
    src: string
    alt?: string
    /** Degrees as a number, OR any CSS angle – so a caller can hand it one of the `--tilt-*`
     *  tokens and keep the angle in the design's own vocabulary rather than in a template. */
    tilt?: number | string
    /** The photo window's height in px. The frame's WIDTH comes from the caller's own layout. */
    photoHeight?: number
    /** `object-position` and friends – Home steers the crop by the face centre. */
    photoStyle?: Record<string, string> | undefined
    /** A strip of tape across the top edge, for a polaroid that is stuck rather than dropped. */
    tape?: boolean
    /** WHAT SOMEBODY WROTE UNDER THE PICTURE, on the lip, in the app's handwriting face.
     *
     *  ⚠ THE OWNER ASKED FOR IT HERE AND NOT BESIDE THE PHOTO (05.08, the album): «лучше прямо на
     *  карточке полароида нашим рукописным шрифтом писать, мне кажется это будет еще аутентичнее».
     *  The fat bottom lip is the reason this component exists at all - it is the strip a person
     *  actually writes on before putting a photograph in an album - so the caption is a SLOT on the
     *  object rather than a redesign of it. Absent by default: every shipped caller passes nothing
     *  and keeps the 12px lip it has today. */
    caption?: string
  }>(),
  { alt: '', tilt: 0, photoHeight: 52, photoStyle: undefined, tape: false, caption: '' },
)
</script>

<template>
  <div
    class="tb-polaroid"
    :class="{ 'tb-polaroid--taped': tape }"
    :style="{ transform: `rotate(${typeof tilt === 'number' ? `${tilt}deg` : tilt})` }"
  >
    <span v-if="tape" class="tb-polaroid-tape" aria-hidden="true"></span>
    <img :src="src" :alt="alt" :style="{ height: `${photoHeight}px`, ...photoStyle }" />
    <p v-if="caption" class="tb-polaroid-caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.tb-polaroid {
  padding: 4px 4px 12px;
  border-radius: var(--radius-mark);
  background: var(--polaroid-paper);
  box-shadow: var(--shadow-polaroid);
}

.tb-polaroid img {
  display: block;
  width: 100%;
  object-fit: cover;
}

/* Only a TAPED polaroid becomes a positioning context. Home's is placed by its own caller
   (`position: absolute` on the card corner) and must not have that quietly overwritten. */
.tb-polaroid--taped {
  position: relative;
}

/* THE LIP, WRITTEN ON. Caveat, a size up on the body face (the house rule at style.css:345 - the
   handwriting face needs 3-4px more than the sans to read at the same weight), inked in the paper's
   own dark rather than the app's text colour, because this surface is the only LIGHT one in the app
   and the app's ink is mixed for the dark ones. Centred, because that is where a person writes.

   The lip grows to hold it: 12px of paper with nothing on it, and room for a line when there is
   one. Two lines maximum - a caption is somebody's handwriting, not a paragraph - and it wraps
   rather than truncating, because a clipped word in handwriting reads as a rendering fault. */
.tb-polaroid-caption {
  margin: 8px 4px 0;
  font-family: var(--font-hand);
  font-size: 17px;
  line-height: 1.15;
  text-align: center;
  color: var(--paper-ink);
  overflow-wrap: anywhere;
}

/* The design's own tape: a translucent warm strip laid over the top edge, never a drawn rectangle. */
.tb-polaroid-tape {
  position: absolute;
  left: 50%;
  top: -7px;
  width: 42px;
  height: 14px;
  transform: translateX(-50%) rotate(-2deg);
  background: var(--paper-tape);
  box-shadow: var(--shadow-tape);
}
</style>
