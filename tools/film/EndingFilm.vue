<script setup lang="ts">
/* NO GOOD ENDING. NO BAD ENDING. – the stage.
 *
 * ⭐ WHAT IS REAL: everything inside the window. It is an iframe running the SHIPPED app against a
 * fixture career that was put on this origin's disk through the shipped import door
 * (`decodeExportFile`) and the shipped write (`adoptAutosave`) – see `install-ending.ts`. Every
 * ending on screen was latched by `answerFork`, `answerRetirement`, `resolveEndings` or
 * `resolveLeaving`; the film navigates the real epilogue and turns its real pages.
 *
 * The strings this file owns are the editorial captions and the small note under the phone, and they
 * are drawn OUTSIDE the window in lanes of their own – the brief's one hard layout rule is that the
 * copy floats above or beside the capture and never covers a control.
 *
 * ⚠ THE FRAME IS A FIXED 414 x 896 AND THE SCALE IS A TRANSFORM. Measured on the previous film: root
 * `zoom` inside a frame does NOT move the layout box (clientWidth/innerWidth/body all answer the
 * element's own width at every zoom), so the iframe ELEMENT is the phone's viewport. Fixed at
 * 414 x 896 it lays out as a phone at every scale, `matchMedia('(min-width: 768px)')` answers false,
 * and Chromium re-rasterises the transform at the effective scale.
 *
 * ⚠ THE FRAME IS NEVER DESTROYED BETWEEN SHOTS, only re-pointed at `/` when the film switches
 * career. A `v-if` would cost the whole boot each time and the recorder cuts the boot out anyway.
 */
import { ref } from 'vue'

const LOGO_LINE = '/logo-tb-line-light.svg'
const LOGO_LINE_2 = '/logo-tb-line-2-light.svg'

/** 414 x 896 at 1.54 is 638 x 1380 – the whole phone, centred, inside an 828-wide frame. */
const SCALE = 1.54

const mode = ref<'phone' | 'logo'>('phone')
const lit = ref(1)
const panelLit = ref(1)
const capLines = ref<string[]>([])
const capKey = ref(0)
const note = ref('')
const quote = ref('')
const badge = ref('')
const logoStep = ref(0)
const frame = ref<HTMLIFrameElement | null>(null)

/** `**like this**` is the film's one emphasis, and it is the app's own `--danger` red. Restrained by
 *  construction: a line may mark a phrase, never a whole sentence. */
function parts(line: string): { text: string; red: boolean }[] {
  return line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((chunk) =>
    chunk.startsWith('**') && chunk.endsWith('**') ? { text: chunk.slice(2, -2), red: true } : { text: chunk, red: false },
  )
}

;(window as any).__stage = {
  caption(lines: string[]): void {
    capLines.value = lines
    capKey.value += 1
  },
  note(text: string): void {
    note.value = text
  },
  /** ⭐ HER OWN SENTENCE, quoted off the save. It gets its own size because it is hers and long –
   *  the caption's two-line rule is about the film's editorial voice, not about her. */
  quote(text: string): void {
    quote.value = text
    capKey.value += 1
  },
  badge(text: string): void {
    badge.value = text
  },
  mode(m: 'phone' | 'logo'): void {
    mode.value = m
  },
  logoStep(n: number): void {
    logoStep.value = n
  },
  lit(on: boolean): void {
    lit.value = on ? 1 : 0
  },
  panel(on: boolean): void {
    panelLit.value = on ? 1 : 0
  },
  /** Re-point the window at the app, which boots into whichever career was touched last. */
  reload(): void {
    if (frame.value) frame.value.src = `/?t=${Date.now()}`
  },
  report: () => ({
    caption: capLines.value.slice(),
    quote: quote.value,
    note: note.value,
    badge: badge.value,
    src: frame.value?.src ?? '',
    fonts: (document as any).fonts?.status ?? 'unknown',
    scale: SCALE,
  }),
}
</script>

<template>
  <div class="stage" :class="[mode, { lit: lit === 1 }]">
    <!-- ⚠ A FACE IS NOT LOADED UNTIL SOMETHING ASKS FOR IT. The stage opens with an empty lane, so
         `document.fonts.check('600 42px Sora')` answered false and the recorder refused a take whose
         type would in fact have been correct the moment the first caption rendered. This probe keeps
         Sora requested from the first paint, which is what makes the check meaningful. -->
    <span aria-hidden="true" class="font-probe">Sora</span>

    <div class="lane">
      <p v-if="quote" :key="'q' + capKey" class="quote">{{ quote }}</p>
      <p v-else-if="capLines.length" :key="capKey" class="cap">
        <span v-for="(l, i) in capLines" :key="i" class="cap-line">
          <span v-for="(p, j) in parts(l)" :key="j" :class="{ red: p.red }">{{ p.text }}</span>
        </span>
      </p>
    </div>

    <div class="floor" :class="{ dim: panelLit === 0 }">
      <div class="win">
        <iframe ref="frame" class="panel" :style="{ transform: `scale(${SCALE})` }" src="/"></iframe>
      </div>
      <p v-if="badge" class="badge">{{ badge }}</p>

      <div v-if="mode === 'logo'" class="logo-card">
        <img v-if="logoStep >= 1" class="logo-line" :src="LOGO_LINE" width="138" height="30" alt="Ties Break" />
        <img v-if="logoStep >= 2" class="logo-line two" :src="LOGO_LINE_2" width="139" height="30" alt="Ace Parent" />
      </div>
    </div>

    <p class="note">{{ note }}</p>
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  width: 828px;
  height: 1792px;
  background: #0a0e13;
  display: grid;
  grid-template-columns: 828px;
  grid-template-rows: 256px 1380px 156px;
  overflow: hidden;
  opacity: 1;
  transition: opacity 260ms ease;
}
/* ⚠ EVERY CHILD NAMES ITS OWN ROW, so a `v-if`'d sibling cannot move the rest (measured on the
   previous film: the floor fell into a 0-tall row and the logo landed on the caption). */
.lane {
  grid-row: 1;
}
.font-probe {
  position: absolute;
  left: -9999px;
  top: 0;
  font-family: 'Sora', system-ui, sans-serif;
  font-weight: 600;
  font-size: 42px;
}
.floor {
  grid-row: 2;
}
.note {
  grid-row: 3;
}
.stage.logo {
  grid-template-rows: 256px 1380px 156px;
}
.stage:not(.lit) {
  opacity: 0;
}

.lane {
  width: 828px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  overflow: hidden;
}
.cap {
  margin: 0;
  display: flex;
  flex-direction: column;
  /* centred rather than stretched, so each line's box hugs its text and the recorder can tell a
     wrapped line from a short one */
  align-items: center;
  max-width: 780px;
  gap: 10px;
  text-align: center;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: -0.015em;
  color: #f2f6f8;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
  animation: rise 220ms ease-out both;
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
.quote {
  margin: 0;
  max-width: 780px;
  text-align: center;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 30px;
  font-weight: 500;
  line-height: 1.42;
  letter-spacing: -0.01em;
  color: #dfe6ea;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
  animation: rise 220ms ease-out both;
}

/* THE ONE ACCENT, and it is the app's own red (`--danger`, #ef4b3a). */
.red {
  color: #ef4b3a;
}

.floor {
  width: 828px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 300ms ease;
}
.floor.dim {
  opacity: 0;
}
.win {
  position: relative;
  width: 638px;
  height: 1380px;
  overflow: hidden;
  border-radius: 26px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  background: #0a0e13;
}
.panel {
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  width: 414px;
  height: 896px;
  border: 0;
  background: #0a0e13;
  transform-origin: top left;
}
.stage.logo .win {
  display: none;
}
.badge {
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  margin: 0;
  padding: 7px 18px;
  border-radius: 999px;
  background: rgba(239, 75, 58, 0.14);
  border: 1px solid rgba(239, 75, 58, 0.5);
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #ef4b3a;
  white-space: nowrap;
}

.logo-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.logo-card .logo-line {
  width: 430px;
  height: 93px;
  animation: rise 360ms ease-out both;
}
.logo-card .logo-line.two {
  width: 433px;
  height: 93px;
}

.note {
  width: 828px;
  margin: 0;
  padding: 0 48px;
  align-self: center;
  text-align: center;
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 23px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: #7c8a93;
}
</style>
