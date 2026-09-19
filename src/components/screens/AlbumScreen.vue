<script setup lang="ts">
// ⭐⭐⭐ THE ALBUM, AT 390 – the mobile window onto the sheets (spec §6, mockup AY).
//
// ⚠⚠ THE ONE RULE THAT SHAPES EVERYTHING ELSE: THE SHEET IS NOT SCALED. 470px square, on a screen
// whose content column is about 358px wide. Squeezing it to fit is the obvious move and it is the
// wrong one, for a reason the owner's README measured rather than felt: at 342px the handwriting
// falls to 9–10px and stops being readable. So the screen is narrower than the page, and the page
// PANS – which is also what a real album does when you put it on a small table.
//
// HOW THE PAN AND THE INDICATOR WORK, because they are one mechanism and not two.
//
// The scroller holds EVERY sheet in a row, each 470 wide with a 16px gutter, and that is the
// README's «тот же скролл продолжается на вторую половину разворота»: panning right off the end of
// one sheet does not stop, it carries on into the next. So the pan and the pager are the SAME state
// – `scrollLeft` – and there is no second source of truth to fall out of step with it.
//
// ⚠ THE ARITHMETIC IS DONE IN CONSTANTS AND NEVER IN MEASUREMENTS. `current = round(scrollLeft /
// step)`, where `step` is `SHEET_PX + SHEET_GAP_PX` and the scroller is laid out at exactly those
// two numbers. Reading `getBoundingClientRect()` instead would buy nothing – the layout cannot
// disagree with the stylesheet – and would cost the whole thing its testability, because happy-dom
// runs no layout engine at all (`tests/component/fits.ts`'s header is this repo's standing note on
// that wall). The one place a measurement IS read is the right-edge gradient, which is decoration,
// and it fails SAFE when there is nothing to measure: no width means "assume the page continues".
//
// ⭐ «LEFT HALF» / «RIGHT HALF» IS ABOUT THE SPREAD, NOT ABOUT THE WINDOW. The README's content
// model: «Единица – половина листа (sheet), не разворот» – the unit of paging is one HALF of a
// spread. So sheets pair: an even index is a left-hand page, an odd one is the right-hand page
// facing it, and the little track beside the label is a two-position toggle showing which of the two
// you are on. That is what the mockup draws – a pill with the dot at one end – and it is why the
// chevron beside it moves a whole sheet rather than a few pixels.
//
// ⚠⚠ NO «CAREER SUMMARY» BUTTON, AND ITS ABSENCE IS A RULING. The mockup has one along the bottom;
// the owner's word on it is «наверное она не нужна тоже» (spec §9). It is not built.
//
// ⭐ `BACK` IS HERE FOR THE OPPOSITE REASON – it became necessary the moment the album stopped being
// only the last screen of a career. Spec §8b, his ruling of 19.09: «можно сделать вход в альбом как
// раз с плашки home где у нас recent memory... И тогда как раз кнопка Back пригодится, как в
// макетах.»
//
// ⚠ WHAT IS NOT HERE, DELIBERATELY: the four-section header from the mockup (Album · Career Summary ·
// Trophies · Statistics). Spec §8b makes the FINALE a shell of four sections, two of which are
// existing screens; that shell is a different piece of work from this one, and building half of it
// here would put a tab row on a screen reached from Home mid-career, where three of the four tabs
// are somewhere else entirely.
import { computed, ref } from 'vue'
import IconButton from '../ui/IconButton.vue'
import AlbumSheet from '../album/AlbumSheet.vue'
import AlbumChaptersSheet from '../album/AlbumChaptersSheet.vue'
import { SHEET_GAP_PX, SHEET_STEP_PX } from '../album/albumWire'
import type { AlbumBook } from '../album/albumWire'

// ⚠⚠ TEMPORARY SHAPE – `AlbumBook` is `src/components/album/albumWire.ts`'s stand-in until the
// engine's `src/engine/world/albumBook.ts` lands and the protocol re-exports it. See that file's
// header. Nothing in this component derives a fact from the book; it pages through it.
const props = defineProps<{ book: AlbumBook | null }>()
const emit = defineEmits<{ back: [] }>()

const pan = ref<HTMLElement | null>(null)
const scrolled = ref(0)
/** No width to read (happy-dom, or a first paint) means "the page continues" – the safe direction
 *  for an affordance: a gradient that should not be there is a smudge, a missing one is a dead end. */
const atFilmEnd = ref(false)

const sheets = computed(() => props.book?.sheets ?? [])
const chapters = computed(() => props.book?.chapters ?? [])

const current = computed(() => {
  if (sheets.value.length === 0) return 0
  const i = Math.round(scrolled.value / SHEET_STEP_PX)
  return Math.min(Math.max(i, 0), sheets.value.length - 1)
})

const sheet = computed(() => sheets.value[current.value] ?? null)
/** Even index = the left-hand page of a spread, odd = the right-hand one facing it. */
const onRightHalf = computed(() => current.value % 2 === 1)

function goTo(index: number): void {
  const i = Math.min(Math.max(index, 0), Math.max(sheets.value.length - 1, 0))
  const el = pan.value
  if (el) el.scrollLeft = i * SHEET_STEP_PX
  // ⚠ WRITTEN HERE AS WELL AS BY THE SCROLL HANDLER, because a programmatic `scrollLeft` does not
  // always fire `scroll` synchronously and the pager must never lag a press it just answered.
  scrolled.value = i * SHEET_STEP_PX
  onScroll()
}

function onScroll(): void {
  const el = pan.value
  if (!el) return
  scrolled.value = el.scrollLeft
  const width = el.clientWidth
  atFilmEnd.value = width > 0 && el.scrollLeft + width >= el.scrollWidth - 1
}

const chaptersOpen = ref(false)

function pickChapter(firstSheet: number): void {
  chaptersOpen.value = false
  goTo(firstSheet)
}
</script>

<template>
  <div class="album">
    <header class="album-head">
      <IconButton
        class="back-link album-back"
        variant="bare"
        icon="back"
        label="Back to Home"
        @click="emit('back')"
      />
      <div v-if="sheet" class="album-head-id">
        <p class="album-head-chapter">
          Chapter {{ sheet.chapterIndex }} of {{ chapters.length || sheet.chapterIndex }}
        </p>
        <h2 class="album-head-title">{{ sheet.chapterTitle }}</h2>
        <p class="album-head-age">{{ sheet.ageLabel }}</p>
      </div>
    </header>

    <!-- THE WINDOW. Narrower than the page on purpose; see the header. -->
    <div class="album-stage">
      <div
        ref="pan"
        class="album-pan"
        :style="{ '--album-step': `${SHEET_STEP_PX}px`, '--album-gap': `${SHEET_GAP_PX}px` }"
        @scroll.passive="onScroll"
      >
        <AlbumSheet v-for="s in sheets" :key="s.id" :sheet="s" />
      </div>

      <!-- The affordance that the page continues sideways. `aria-hidden`: it says nothing a screen
           reader cannot already discover by moving through the sheets. -->
      <span v-if="!atFilmEnd" class="album-edge" aria-hidden="true"></span>

      <div v-if="sheets.length" class="album-half">
        <span class="album-half-label">{{ onRightHalf ? 'Right half' : 'Left half' }}</span>
        <span class="album-half-track" :class="{ 'is-right': onRightHalf }" aria-hidden="true">
          <span class="album-half-dot"></span>
        </span>
        <!-- ⚠ THE CHEVRONS ARE TYPOGRAPHIC, WHICH IS WHAT `IconButton`'s SLOT IS FOR (its own
             header: "the one control that is genuinely typographic ... because a question mark is
             a letter"). There is no chevron in `public/icons/`, and the mockup draws these two as
             the characters they are. The accessible name is on the button either way. -->
        <IconButton
          class="album-half-next"
          variant="bare"
          label="Next half"
          :disabled="current >= sheets.length - 1"
          @click="goTo(current + 1)"
        >
          &rsaquo;
        </IconButton>
      </div>
    </div>

    <footer v-if="sheets.length" class="album-foot">
      <div class="album-pager">
        <IconButton
          class="album-step"
          label="Previous sheet"
          :disabled="current === 0"
          @click="goTo(current - 1)"
        >
          &lsaquo;
        </IconButton>
        <ol class="album-dots">
          <li v-for="(s, i) in sheets" :key="s.id">
            <button
              type="button"
              class="album-dot"
              :class="{ 'is-current': i === current }"
              :aria-label="`Sheet ${i + 1}`"
              :aria-current="i === current ? 'true' : undefined"
              @click="goTo(i)"
            ></button>
          </li>
        </ol>
        <IconButton
          class="album-step"
          label="Next sheet"
          :disabled="current >= sheets.length - 1"
          @click="goTo(current + 1)"
        >
          &rsaquo;
        </IconButton>
      </div>

      <div class="album-foot-row">
        <!-- ⚠ THE REAL COUNT, NEVER TWELVE. Spec §3: the album has as many sheets as the career
             earned, and the counter says so. -->
        <p class="album-count">Sheet {{ current + 1 }} of {{ sheets.length }}</p>
        <button type="button" class="album-chapters-btn" @click="chaptersOpen = true">
          Chapters
        </button>
      </div>
    </footer>

    <AlbumChaptersSheet
      v-if="chaptersOpen"
      :chapters="chapters"
      :current-chapter="sheet?.chapterIndex ?? 0"
      @pick="pickChapter"
      @close="chaptersOpen = false"
    />
  </div>
</template>

<style scoped>
.album {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.album-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.album-head-id {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.album-head-chapter,
.album-head-age {
  margin: 0;
  font-size: var(--label-size);
  color: var(--muted);
}

.album-head-title {
  margin: 2px 0;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
}

/* ⚠ THE STAGE CANCELS THE APP'S SIDE GUTTER. The sheet is already wider than the screen; paying
   16px of margin on each side of a page that overflows anyway would only make the pan longer for
   nothing. `--app-pad-x` is the frame's own token, so this moves with it. */
.album-stage {
  position: relative;
  margin-inline: calc(-1 * var(--app-pad-x));
}

.album-pan {
  display: flex;
  gap: var(--album-gap);
  padding-inline: var(--app-pad-x);
  overflow-x: auto;
  overflow-y: hidden;
  /* `proximity`, not `mandatory`: the pan is meant to STOP anywhere inside a sheet – that is the
     whole point of a page wider than the screen – and only settle onto a page edge when the reader
     is already most of the way there. */
  scroll-snap-type: x proximity;
  /* ⚠⚠ AND THIS LINE IS WHAT KEEPS THE PAGER'S ARITHMETIC TRUE, measured in Chromium 19.09 rather
     than reasoned about. `scroll-snap-align: start` aligns a sheet's edge with the SCROLLPORT's
     start edge, and the scroller pays the app's gutter as padding – so without a matching
     scroll-padding the snap point for sheet N is `16 + N * step`, and `goTo` scrolling to
     `N * step` was landing 16px short and then being nudged by the snap. The offset is constant and
     never accumulates, so `round(scrollLeft / step)` still named the right sheet; it was the
     PICTURE that was wrong, by one gutter, every time an arrow was pressed. With the scroll-padding
     the snap point IS `N * step`, and the settled sheet sits exactly on the app's gutter, which is
     where the mockup has it. */
  scroll-padding-inline: var(--app-pad-x);
  -webkit-overflow-scrolling: touch;
}

.album-edge {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 34px;
  pointer-events: none;
  /* ⚠ `transparent` AND NOT `rgba(10, 14, 19, 0)`, which is what this said first and is a hand-copy
     of `--bg`'s value – the two-sources-of-truth problem `tests/design-tokens.test.ts` exists for,
     one layer below where that gate can see it. Gradient interpolation is premultiplied, so
     `transparent` fades to the page colour rather than through grey. */
  background: linear-gradient(90deg, transparent, var(--bg));
}

/* THE INDICATOR, BOTTOM RIGHT, exactly where the mockup puts it: over the page's own bottom-right
   corner rather than under it, because the sheet already fills the width. */
.album-half {
  position: absolute;
  right: 10px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border-radius: var(--radius-pill);
  /* The page's own colour at 82%, mixed rather than re-typed – same reason as the edge above. */
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  color: var(--text);
}

.album-half-label {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 700;
}

/* The two-position track: the dot is at one end or the other, and which end it is at IS the
   sentence beside it. */
.album-half-track {
  position: relative;
  width: 28px;
  height: 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.14);
}

.album-half-dot {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 14px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  transition: transform 160ms ease;
}

.album-half-track.is-right .album-half-dot {
  transform: translateX(10px);
}

.album-foot {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.album-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* A typographic chevron needs a size and a line-height of its own; the icon variant gets both from
   the SVG it is holding. */
.album-step,
.album-half-next {
  font-size: 20px;
  line-height: 1;
}

.album-dots {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.album-dot {
  display: block;
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--muted);
  opacity: 0.45;
  cursor: pointer;
}

.album-dot.is-current {
  background: var(--accent);
  opacity: 1;
}

.album-foot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.album-count {
  margin: 0;
  font-size: var(--label-size);
  color: var(--muted);
}

.album-chapters-btn {
  flex: none;
  padding: 10px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--panel);
  color: var(--text);
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
</style>
