<script setup lang="ts">
/* TWO TALENTED PLAYERS. TWO VERY DIFFERENT CAREERS. – the stage.
 *
 * ⭐ WHAT IS REAL: everything inside the two windows. Each window is an iframe running the SHIPPED
 * app against a career that was put on that origin's disk through the shipped import door
 * (`decodeExportFile`) and the shipped write (`adoptAutosave`) – see `install-save.ts`. The film
 * never draws a game value: it navigates the real screens and crops them. The strings this file
 * owns are the floating captions, the two name labels and their context lines, and they are drawn
 * OUTSIDE the windows, in a lane of their own, so they can never be mistaken for game UI.
 *
 * ⚠ TWO ORIGINS, ONE PER CAREER. IndexedDB is per origin, so two panels of the same app on one port
 * would be two tabs fighting over one database. The left panel is served on 5843 and the right on
 * 5844 – two dev servers over the same worktree – which is also why the stage cannot script either
 * frame: the right one is cross-origin. The RECORDER drives both frames directly (Playwright can),
 * and this file only ever does layout, crop and copy.
 *
 * ⚠ THE FRAMES ARE NEVER RE-CREATED. `display` is never toggled off and `v-if` is never used on
 * them: a reload would put the app back on its splash and lose the screen the shot is standing on.
 *
 * ⚠ THE CROP IS THE SAME RECT ON BOTH SIDES, always – the brief's «same crop and scale for
 * corresponding cards». The recorder measures the card inside each frame, takes the union, and hands
 * ONE rect to `crop()`.
 *
 * ⚠⚠ THE FRAME IS A FIXED 414 x 896 AND THE SCALE IS A TRANSFORM, and that is MEASURED rather than
 * inherited from the last film. Root `zoom` inside the frame does NOT move the layout box: probed
 * here, `documentElement.clientWidth`, `innerWidth`, `body` and `.tab-bar` all answered 370 at zoom
 * 1 AND at zoom 0.893, with `getComputedStyle().zoom` reading back the value. The iframe ELEMENT is
 * the phone's viewport, full stop – so the element stays 414 x 896 for the length of the film, the
 * app lays out as a phone, `matchMedia('(min-width: 768px)')` answers false, and the only thing that
 * moves is `transform: scale`, which Chromium re-rasterises at the effective scale (checked on a
 * still at 1.15: type is sharp, not upscaled). The recorder refuses a take where the layout box is
 * anything but 414.
 */
import { ref } from 'vue'

const LOGO_LINE = '/logo-tb-line-light.svg'
const LOGO_LINE_2 = '/logo-tb-line-2-light.svg'

type Crop = { zoom: number; x: number; y: number; w: number; h: number }

/** The establishing geometry: a whole phone, both of them, inside the panel area. 414 x 696 at 1.15
 *  is 476 x 800 – two of those plus the gap is 992 of the 1080. */
/** ⚠ THE WHOLE PHONE, TAB BAR INCLUDED. The layout viewport inside each frame is a fixed 414 x 896
 *  for the length of the film – it is never resized, so the app never reflows mid-shot and a scroll
 *  position taken in one shot still means the same thing in the next. The establishing crop is
 *  therefore the whole of it at 800/896, and every close-up is a SLICE of the same document. */
const FULL: Crop = { zoom: 800 / 896, x: 0, y: 0, w: 414, h: 896 }

const mode = ref<'panels' | 'logo'>('panels')
const lit = ref(1)
/** The panels dissolve on their own so a caption that spans two shots does not blink between them. */
const floorLit = ref(1)
const crop = ref<Crop>(FULL)
const capLines = ref<string[]>([])
const capKey = ref(0)
const nameA = ref('Zoe Slavic')
const nameB = ref('Alice Martin')
const whenA = ref('')
const whenB = ref('')
const note = ref('')
const logoStep = ref(0)

const frameA = ref<HTMLIFrameElement | null>(null)
const frameB = ref<HTMLIFrameElement | null>(null)

/** ⚠ THE LABEL IS AS WIDE AS THE PANEL IT NAMES. Fixed at 476 it sat off-centre over every crop
 *  narrower than the establishing one, which reads as the two columns being out of line. */
function whoStyle(): Record<string, string> {
  return { width: `${Math.round(crop.value.w * crop.value.zoom)}px` }
}
function winStyle(): Record<string, string> {
  const c = crop.value
  return { width: `${Math.round(c.w * c.zoom)}px`, height: `${Math.round(c.h * c.zoom)}px` }
}
/** The frame keeps a phone's own box; the window shows a scaled slice of it. */
function frameStyle(): Record<string, string> {
  const c = crop.value
  return {
    transform: `scale(${c.zoom})`,
    left: `${-(c.x * c.zoom).toFixed(1)}px`,
    top: `${-(c.y * c.zoom).toFixed(1)}px`,
  }
}

;(window as any).__stage = {
  /** 1 or 2 lines. Changing the key restarts the 8px rise, which is the only motion the copy has. */
  caption(lines: string[]): void {
    capLines.value = lines
    capKey.value += 1
  },
  labels(a: string, b: string, whenLeft: string, whenRight: string): void {
    nameA.value = a
    nameB.value = b
    whenA.value = whenLeft
    whenB.value = whenRight
  },
  note(text: string): void {
    note.value = text
  },
  crop(c: Crop | null): void {
    crop.value = c ?? FULL
  },
  full: () => FULL,
  mode(m: 'panels' | 'logo'): void {
    mode.value = m
  },
  logoStep(n: number): void {
    logoStep.value = n
  },
  lit(on: boolean): void {
    lit.value = on ? 1 : 0
  },
  floor(on: boolean): void {
    floorLit.value = on ? 1 : 0
  },
  /** What the recorder writes into the provenance note, read off the live DOM rather than retyped. */
  report: () => ({
    crop: { ...crop.value },
    caption: capLines.value.slice(),
    labels: { a: nameA.value, b: nameB.value, whenA: whenA.value, whenB: whenB.value, note: note.value },
    urls: { a: frameA.value?.src ?? '', b: frameB.value?.src ?? '' },
    fonts: (document as any).fonts?.status ?? 'unknown',
  }),
}
</script>

<template>
  <div class="stage" :class="[mode, { lit: lit === 1 }]">
    <!-- THE CAPTION LANE. 200px of its own, above everything: the brief's one hard layout rule is
         that the floating text never crosses a score, a face, a control or a card. -->
    <div class="lane">
      <p v-if="capLines.length" :key="capKey" class="cap">
        <span v-for="(l, i) in capLines" :key="i" class="cap-line">{{ l }}</span>
      </p>
    </div>

    <div v-if="mode !== 'logo'" class="names">
      <div class="who" :style="whoStyle()">
        <p class="who-name">{{ nameA }}</p>
        <p class="who-when">{{ whenA }}</p>
      </div>
      <div class="who" :style="whoStyle()">
        <p class="who-name b">{{ nameB }}</p>
        <p class="who-when">{{ whenB }}</p>
      </div>
    </div>

    <div class="floor" :class="{ dim: floorLit === 0 }">
      <div class="win" :style="winStyle()">
        <iframe ref="frameA" class="panel" :style="frameStyle()" src="http://localhost:5843/"></iframe>
      </div>
      <div class="win" :style="winStyle()">
        <iframe ref="frameB" class="panel" :style="frameStyle()" src="http://localhost:5844/"></iframe>
      </div>

      <div v-if="mode === 'logo'" class="logo-card">
        <img class="logo-line" :src="LOGO_LINE" width="138" height="30" alt="Ties Break" />
        <img v-if="logoStep >= 1" class="logo-line two" :src="LOGO_LINE_2" width="139" height="30" alt="Ace Parent" />
      </div>
    </div>

    <p v-if="mode !== 'logo'" class="note">{{ note }}</p>
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  width: 1080px;
  height: 1080px;
  background: #0a0e13;
  display: grid;
  /* ⚠ EXPLICIT COLUMN. An implicit grid column is content-sized, and with both windows hidden the
     floor collapses to zero – which is how a centred logo card ends up one word to a line. */
  grid-template-columns: 1080px;
  grid-template-rows: 196px 70px 778px 36px;
  overflow: hidden;
  opacity: 1;
  transition: opacity 240ms ease;
}
/* ⚠ THE LANE SURVIVES THE LOGO CARD. The brief's 46–50s puts «Talent is not a single number.» over
   it, and a 0-tall lane with `overflow: hidden` would clip the line away entirely. */
.stage.logo {
  grid-template-rows: 196px 0 848px 36px;
}
.stage:not(.lit) {
  opacity: 0;
}

/* ⚠ EVERY CHILD NAMES ITS OWN ROW. The labels and the note are `v-if`'d away on the logo card, and
   with auto-placement the floor then fell into the labels' 0-tall row – which put the logo card on
   top of the caption instead of under it. Explicit rows cannot be moved by a missing sibling. */
.lane {
  grid-row: 1;
  width: 1080px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48px;
  overflow: hidden;
}
.cap {
  margin: 0;
  display: flex;
  flex-direction: column;
  /* ⚠ CENTRED RATHER THAN STRETCHED, so each line's box HUGS ITS TEXT. That is what lets the
     recorder tell a wrapped line from a short one – a full-width block would measure the same
     either way, and «maximum two lines» would be a rule nothing could check. */
  align-items: center;
  max-width: 984px;
  gap: 8px;
  text-align: center;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 50px;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.015em;
  color: #f2f6f8;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
  animation: rise 200ms ease-out both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.cap-line {
  display: block;
}

.names {
  grid-row: 2;
  width: 1080px;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 0 44px;
}
.who {
  text-align: center;
}
.who-name {
  margin: 0;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f2f6f8;
}
.who-name.b {
  color: #cfe152;
}
.who-when {
  margin: 2px 0 0;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #8e9ba4;
}

.floor {
  grid-row: 3;
  width: 1080px;
  position: relative;
  opacity: 1;
  transition: opacity 250ms ease;
}
.floor.dim {
  opacity: 0;
}
.floor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
}
.win {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  background: #0a0e13;
}
.panel {
  display: block;
  position: absolute;
  width: 414px;
  height: 896px;
  border: 0;
  background: #0a0e13;
  transform-origin: top left;
}
.stage.logo .win {
  display: none;
}

/* ⚠ NOT `.logo`. The MODE is also spelled `logo` and lands on `.stage` as a class, so a card rule
   named `.logo` matched the stage itself – same specificity, later in the sheet, so its
   `display: flex` beat the stage's own `display: grid` and the whole 1080 square stopped being a
   grid. Every row then collapsed and the closing copy sat on top of the wordmark. */
.logo-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.logo-card .logo-line {
  width: 420px;
  height: 91px;
}
.logo-card .logo-line.two {
  width: 423px;
  height: 91px;
  animation: rise 320ms ease-out both;
}

.note {
  grid-row: 4;
  width: 1080px;
  margin: 0;
  text-align: center;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #6d7a83;
}
</style>
