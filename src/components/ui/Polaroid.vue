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
    /** Degrees. The paper rotations the design uses run -4 .. +6; Home's memory sits at -7. */
    tilt?: number
    /** The photo window's height in px. The frame's WIDTH comes from the caller's own layout. */
    photoHeight?: number
    /** `object-position` and friends – Home steers the crop by the face centre. */
    photoStyle?: Record<string, string> | undefined
    /** A strip of tape across the top edge, for a polaroid that is stuck rather than dropped. */
    tape?: boolean
  }>(),
  { alt: '', tilt: 0, photoHeight: 52, photoStyle: undefined, tape: false },
)
</script>

<template>
  <div
    class="tb-polaroid"
    :class="{ 'tb-polaroid--taped': tape }"
    :style="{ transform: `rotate(${tilt}deg)` }"
  >
    <span v-if="tape" class="tb-polaroid-tape" aria-hidden="true"></span>
    <img :src="src" :alt="alt" :style="{ height: `${photoHeight}px`, ...photoStyle }" />
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
