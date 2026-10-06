<script setup lang="ts">
// A SMALL SNAPSHOT OF HER RESTING OR ON HOLIDAY – ROUND 47 #14 (owner, 06.10: «небольшие добавлять на те страницы, где убрали горизонтальный билет
// или боковую бирку, чтобы пустоту немного заполнить»).
//
// THE APP'S OWN `Polaroid`, SMALLER, WITH NOTHING WRITTEN ON IT: the same stock, lip, shadow, lean and strip of tape as the album's photographs, in a window
// a third of their size, stuck in the gap a ticketless or tagless sheet leaves. Where it hangs is `albumPlacement.ts`'s (`placeFiller`); which picture
// is the engine's (`AlbumSheetModel.filler`, from `albumBook.ts`); this file draws it.
//
// ⚠ NO CAPTION AND NO ALT, ON PURPOSE. A caption is a sentence and an alt is a string, and the owner's copy is his (invariant 4): the picture is
// DECORATION in the gap of a page – `alt=""`, hidden from assistive tech, like the doodle that shares the sheet – and a describing alt would be a draft
// for his pass, which is a decision to ask for and not one to take.
//
// ⚠ THE PATH IS BASE-RELATIVE AND THE BASE IS ADDED HERE, the album's own rule for every painting it owns (`AlbumPhoto.vue` spells the reason): the
// engine may not read `import.meta.env`, and a leading slash breaks a `BASE_PATH` deploy.
//
// ⚠ THE CROP ANCHORS ON HER, NOT ON THE MIDDLE. These paintings are wide (1.6:1 to 2.5:1) and the window is nearer square, so `object-fit: cover` cuts
// the sides – and in every picture of both sets she sits right of centre (66-79 % of the width for the holiday set, `MoneyScreen.vue`'s own measurement),
// so the default centred crop takes her face off. `80% 40%` keeps her in view and the horizon where the painter put it.
import { computed } from 'vue'
import Polaroid from '../ui/Polaroid.vue'
import type { AlbumFiller } from '../../shared/protocol'

const props = withDefaults(defineProps<{ filler: AlbumFiller; tilt?: number; photoHeight?: number }>(), { tilt: 0, photoHeight: 72 })

const src = computed(() => `${import.meta.env.BASE_URL}${props.filler.art}`)
const CROP = { objectPosition: '80% 40%' } as const
</script>

<template>
  <div class="album-filler" aria-hidden="true">
    <Polaroid :src="src" alt="" tape :tilt="tilt" :photo-height="photoHeight" :photo-style="CROP" />
  </div>
</template>

<style scoped>
.album-filler {
  position: absolute;
}
</style>
