<script setup lang="ts">
// U3 – SCREEN F, "Match Day", as the owner reads it (docs/specs/ui-inventory.md §4 Q2).
//
// The handoff presents F and I as two live views of a match. The owner overruled that, and his
// reading is better: **I is the live match** (MatchViewer, the court) and **F is the PORTRAIT
// TREATMENT** – the big painted scene with a glass plate over its foot – used BEFORE a match and
// reused AFTER it on the result screens. So there is one live view, no switcher, and this file is
// the one place the treatment is written down.
//
// THREE CALLERS, which is what licenses a component rather than a copy:
//   * TournamentFlow, the pre-match card of every tournament round;
//   * PracticeFlow, the same card for a booked friendly ("F Match Day does the same job" –
//     ui-inventory §2);
//   * TournamentFlow again, on the finale, where the poster's photograph keeps the face-table crop
//     (the poster frames a small square, so a crop is its whole mechanism – see `.tf-poster-photo`
//     there).
//
// WHAT IT OWNS: the card, the painting, the two scrims and the round pill. WHAT THE CALLER OWNS:
// what is written on the glass plate. Same division as ui/Polaroid.vue – the frame is the object,
// where it sits and what is in it is the screen's business.
//
// THE PAINTING IS HERS. We ship no match-scene art and none is coming (owner, §4 Q4: "art is
// settled"), so F's `match-live` slot is filled by the emotion-correct portrait the rest of the app
// already uses – warmed by src/art/preload.ts before the tournament week opens.
//
// ⚠ THE WHOLE PAINTING, UNCROPPED (owner, 01.08): «ничего не надо нормировать, просто изображение
// в полную высоту и всё, какое есть - такое и ок». This card used to be a fixed-height cover crop
// steered by the face table (src/art/faceRects.ts), and the crop was the complaint: the paintings
// frame her head at different sizes (teen-serious 182px of 512 against young-serious 124), so the
// close-up jumped from band to band and the teen band read far too tight. A scale-normalisation
// pass was designed and REJECTED – the ruling is that the scene simply shows the painting. So the
// card is the painting's own square (width-bound, aspect-ratio 1/1), the img is `contain` and can
// crop nothing, and this component no longer reads the face table at all. The scrims and the glass
// plate ride over the art exactly as before – the foot of a full painting is her midriff rather
// than her knees, which is what the plate always wanted to sit on anyway.
import { computed } from 'vue'
import Card from './ui/Card.vue'
import { finaleUrl } from '../art/preload'
import type { AvatarEmotion, PortraitStage } from '../shared/avatarEmotion'

const props = defineProps<{
  /** her age band – the caller reads it off `useKidEmotion()`, never off her age directly */
  stage: PortraitStage
  /** which painting: `serious` before a match she is about to play, `happy` / `sad` after */
  emotion: AvatarEmotion
  /** the round pill over the top-left corner ("Quarterfinal", "Friendly at the club") */
  label?: string
  /** FILL THE CALLER'S COLUMN instead of being the painting's own square (owner, 02.08: «вернуть
   *  картину на весь экран, как в макете», and 03.08 again: «занимала всё возможное пространство,
   *  надо вернуть увеличение для этого»). The design's F is `flex:1; min-height:0` of the screen
   *  with the art slot at `inset:0`, and this prop is that geometry PLUS the magnification that
   *  makes it read like F – see `.scene--fill .scene-art` for why `cover` here is not the crop the
   *  01.08 ruling rejected. Default off – the friendly's card keeps the whole painting. */
  fill?: boolean
}>()

const src = computed(() => finaleUrl(props.stage, props.emotion))
</script>

<template>
  <Card variant="photo" class="scene" :class="{ 'scene--fill': fill }">
    <img class="scene-art" :src="src" alt="" />
    <!-- The design's two scrims (§F): a light one at the head so the round pill keeps its edge, and
         the heavy 220px one at the foot that the glass plate sits in. -->
    <span class="scene-scrim" aria-hidden="true"></span>
    <p v-if="label" class="scene-round">{{ label }}</p>
    <div class="scene-plate">
      <slot />
    </div>
  </Card>
</template>

<style scoped>
/* `Card variant="photo"` is already a clipped flex column with no inset, which is exactly what a
   card a painting bleeds into needs; all this adds is the positioning context for the art.

   ⚠ THE CARD IS THE PAINTING'S OWN SQUARE (owner, 01.08 – see the header). The paintings are
   512x512, so `aspect-ratio: 1 / 1` on the card IS "the image at full height": width-bound, the
   whole painting, nothing cropped. The old fixed `height` prop went with the crop – a fixed height
   plus a full painting would letterbox, and a prop nobody passed was already just the number 396. */
.scene {
  position: relative;
  aspect-ratio: 1 / 1;
}

/* THE FILL GEOMETRY (see the prop). `flex: 1 1 0; min-height: 0` is what lets the card absorb
   exactly the height the caller's column has left over – natural-height neighbours (a path strip,
   nothing else) keep theirs, the scene takes the rest, and the column therefore FITS its scrollport
   instead of overflowing it. `aspect-ratio: auto` releases the square; the img below stays
   `contain`, so releasing the box never crops the painting – it letterboxes, and the spare band
   falls under the scrims. AFTER `.scene` in this file on purpose: same specificity, so source order
   is the tiebreak. */
.scene--fill {
  flex: 1 1 0;
  min-height: 0;
  aspect-ratio: auto;
}

/* `contain`, not `cover`, and on a square box over a square painting the two would render the same
   pixels today – the point of saying `contain` is that this img CANNOT crop, whatever shape a
   future card or a future painting takes. No `object-position`: there is nothing to steer when
   everything is in frame. */
.scene-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ⚠ FILLED, THE PAINTING IS MAGNIFIED TO COVER THE BOX - and this is the owner's 03.08 second pass
   on the same screen: «я бы хотел, чтобы картинка вела себя как на макете F. Match Day, т.е.
   занимала всё возможное пространство, надо вернуть увеличение для этого». The first pass released
   the square and left the img `contain`, which is why it did not read like F: a square painting in
   a portrait box leaves a dead band, and the design's art slot is `inset: 0` with nothing behind
   it. `cover` is the magnification he is asking for.

   IT DOES NOT REOPEN THE 01.08 RULING, and the difference is worth stating because the two sound
   alike. What was rejected then was NORMALISATION - a per-painting scale steered by the face table,
   so that every band framed her head at one size; the complaint was a fixed 396px window that
   turned teen-serious into a tight close-up. This is one geometry for every painting, no face
   table, no per-band number: the picture fills the space it is given. The friendly's card is
   untouched (`fill` defaults off) and keeps the whole painting in its own square.

   TOP, NOT BOTTOM. Under `cover` the crop lands on whichever axis is not binding, and on the wide
   boxes (desktop, landscape) that is the vertical one - so anchoring at the top keeps her head
   complete and spends the crop at the foot, which is where the glass plate sits anyway. On the
   tall mobile box the height binds, the crop is horizontal and symmetric, and this line is inert. */
.scene--fill .scene-art {
  object-fit: cover;
  object-position: center top;
}

/* Values from the design's F (docs/design/README.md §F "Сцена"): the foot scrim runs to
   rgba(12,18,24,.8), and the head gets the hero's own light wash so the pill reads on a bright
   court. Written out here rather than tokenised for the same reason Home and Season write their
   glass out: `src/style.css` is the collision point for six screens being built at once. */
.scene-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 10, 14, 0.62) 0%, rgba(6, 10, 14, 0.1) 26%, transparent 44%),
    linear-gradient(180deg, transparent 46%, rgba(12, 18, 24, 0.55) 72%, rgba(12, 18, 24, 0.8) 100%);
}

/* The muted section label, not the lime eyebrow (U0's ⚠: `.tf-round` and friends are a DIFFERENT
   object) – here on a glass chip, because a bare label disappears into a painting. */
.scene-round {
  position: relative;
  align-self: flex-start;
  margin: 12px 0 0 12px;
  padding: 5px 11px;
  border-radius: var(--radius-pill);
  background: rgba(10, 15, 20, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: var(--label-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--label-track);
  color: var(--ink-2);
}

/* The design's coach overlay, doing our job instead: the glass plate at the foot of the scene
   (radius, hairline, blur and inset from §F), carrying whatever the screen has to say about the
   match that is about to be played. */
.scene-plate {
  position: relative;
  margin: auto 12px 12px;
  padding: 12px 13px 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: rgba(10, 15, 20, 0.62);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
