<script setup lang="ts">
// A PHOTOGRAPH IN THE ALBUM: the app's own `Polaroid` – cream stock, fat bottom lip, shadow, tilt,
// and the caption written ON the lip – plus the one thing an album adds to a photograph, which is
// the paperclip that holds it down.
//
// ⚠ IT WRAPS `ui/Polaroid` RATHER THAN REDRAWING IT. The owner's ruling of 05.08 lives in that
// component's header («лучше прямо на карточке полароида нашим рукописным шрифтом писать») and the
// frame, the lip, the tape and the caption are already that object. What an album sheet adds is
// WHERE it is dropped and what holds it – which is what a caller owns.
//
// ⚠⚠ AND THERE IS NO DROP ZONE AND NO «or browse files». The mockups draw both, and the spec rules
// them out of the build in as many words (§2.1): the frames are OUR paintings, chosen by week and
// occasion, and the player uploads nothing. A dashed rectangle and an upload hint are the
// prototype's scaffolding, not the design.
import { computed } from 'vue'
import Polaroid from '../ui/Polaroid.vue'
import type { AlbumFrame } from '../../shared/protocol'

const props = withDefaults(
  defineProps<{
    frame: AlbumFrame
    /** A strip of tape across the top edge – a photograph that is STUCK rather than dropped. */
    tape?: boolean
    /** The paperclip, over the top-left corner. Drawn, like everything else on this page. */
    clip?: boolean
    tilt?: number | string
    /** The photo window's height in px; the frame's width is the layout's. */
    photoHeight?: number
  }>(),
  { tape: false, clip: false, tilt: 0, photoHeight: 150 },
)

/**
 * ⚠⚠ THE ENGINE'S PATH IS BASE-RELATIVE AND THE BASE IS ADDED HERE – the app's own rule for every
 * painting it owns, and `shared/protocol/album.ts` states it on the `art` field: «the engine may not
 * read `import.meta.env` and a leading slash breaks a `BASE_PATH` deploy. The rendering side
 * prefixes `import.meta.env.BASE_URL`, exactly as `useKidEmotion` does for every other painting.»
 *
 * ⚠ AND THE FAILURE IT PREVENTS ONLY EXISTS ON THE DEPLOYED BUILD, which is why it has to be a rule
 * rather than something anybody notices. `deploy.yml` builds with `BASE_PATH=/ties-break/`, so the
 * engine's `images/…` resolves against the PAGE's directory there and every frame in the album 404s;
 * locally the base is `/` and the bare path works by accident. Same reasoning as `art/preload.ts`'s
 * `base()`, `art/trophies.ts` and `AppIcon.vue` – nothing here is a new idea, it is the one the app
 * already has.
 */
const src = computed(() => `${import.meta.env.BASE_URL}${props.frame.art}`)
</script>

<template>
  <div class="album-photo">
    <Polaroid
      :src="src"
      :alt="frame.alt"
      :caption="frame.caption"
      :tape="tape"
      :tilt="tilt"
      :photo-height="photoHeight"
    />
    <span v-if="clip" class="album-clip" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.album-photo {
  position: relative;
}

/* THE PAPERCLIP, IN TWO BORDERS AND NOTHING ELSE. The outer loop is the element, the inner loop is
   its `::after`, both open at the bottom – which is the whole silhouette of a clip seen flat. It is
   drawn OVER the polaroid's own tilt because a clip is attached to the page, not to the photograph:
   it keeps its own angle while the picture under it leans. */
.album-clip {
  --album-clip-wire: #b9c2cc;

  position: absolute;
  left: 14px;
  top: -9px;
  width: 13px;
  height: 31px;
  border: 1.5px solid var(--album-clip-wire);
  border-bottom-color: transparent;
  border-radius: 7px 7px 0 0;
  transform: rotate(-9deg);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}

.album-clip::after {
  content: '';
  position: absolute;
  left: 2.5px;
  top: 5px;
  right: 2.5px;
  bottom: 6px;
  border: 1.5px solid var(--album-clip-wire);
  border-bottom-color: transparent;
  border-radius: 5px 5px 0 0;
}
</style>
