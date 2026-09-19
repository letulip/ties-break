<script setup lang="ts">
// THE MARGINALIA – the six things somebody draws on an album page while writing on it: a trophy, a
// heart, a sun, a smile, a globe, a paper plane (the README's own list).
//
// ⚠ WHY THESE ARE INLINE `<path>`s AND THE PAPER IS NOT. The README bans SVG for the TEXTURE, and
// names the reason: a filter «выпадает пустой при растровом экспорте» – `feTurbulence` renders
// empty on raster export, so the page would lose its stock. A doodle has no filter on it. What it
// does have is the thing CSS cannot give: a PEN LINE – one continuous open stroke with round caps
// and no fill, which is what makes a heart on a page read as drawn rather than as a symbol pasted
// on. Three of the six (heart, sun, smile) could be built from radii; the other three cannot, and
// six marks drawn two different ways would not look like one person's pen.
//
// ⚠ NO GLYPH FONT AND NO EMOJI, which is the other road and the wrong one: an emoji is somebody
// else's colour drawing, renders differently on every platform, and would be the only full-colour
// object on a sheet of paper.
import type { AlbumDoodle } from '../../shared/protocol'

defineProps<{ mark: AlbumDoodle; size?: number }>()

/** viewBox 24x24 for all six, so one stroke width reads the same on every mark. */
const PATHS: Record<AlbumDoodle, string> = {
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 1.5H5.5a3 3 0 0 0 3 3M16 5.5h2.5a3 3 0 0 1-3 3M12 13v4m-3 3h6',
  heart: 'M12 20c-4-3-7-5.5-7-9a3.6 3.6 0 0 1 7-1.6A3.6 3.6 0 0 1 19 11c0 3.5-3 6-7 9Z',
  sun: 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4',
  smile: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM9 10v.8m6-.8v.8M8.5 14.5a4.5 4.5 0 0 0 7 0',
  globe: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5Z',
  plane: 'M21 4 3 11.2l6.6 2.4M21 4l-9 16-2.4-6.4M21 4 9.6 13.6',
}
</script>

<template>
  <svg
    class="album-doodle"
    :style="{ width: `${size ?? 30}px`, height: `${size ?? 30}px` }"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path :d="PATHS[mark]" />
  </svg>
</template>

<style scoped>
.album-doodle {
  display: block;
  fill: none;
  /* The ink is the page's, softened – a doodle is the same pen as the handwriting, pressed
     lighter, and never a second colour on a sheet that only has one. */
  stroke: var(--paper-ink-soft);
  stroke-width: 1.15;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.78;
}
</style>
