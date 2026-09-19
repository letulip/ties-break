<script setup lang="ts">
// ⭐⭐⭐ THE ALBUM – ONE BOOK, THREE WINDOWS (spec §6, mockups AY / AX / AW).
//
// ⚠⚠ THE CONTENT MODEL DOES NOT CHANGE ACROSS THE THREE WIDTHS, and that is the README's contract in
// its own words: «Адаптив меняет только окно просмотра, но не порядок, размер и количество страниц.»
// Same sheets, same order, same count, same pager, same chapters. What changes is how much of a page
// the screen can hold at once:
//
//   390   the screen is NARROWER than the page, so the page pans – everything below.
//   768   the page fits whole at 540px. The film's window narrows to exactly one sheet, the pan
//         affordance goes (there is nothing left to pan to), and the chapters come out from behind
//         their button as a strip that scrolls sideways.
//   1024  the same, at 556px, with the chapters as a grid.
//
// ⚠ AND THE WIDTHS ARE CSS's, NOT THIS FILE'S. The breakpoints are the app's own ladder in
// src/style.css (768 / 1024, the owner's 03.09 ruling), the three page sizes are `--album-sheet` on
// :root, and every rule that draws the wide layout is inside a `min-width` query at the bottom of
// this file – so a phone computes exactly what it computed before they existed. The one thing the
// SCRIPT needs from all that is the film's pitch, and it reads it rather than deciding it: see
// `readStep`.
//
// ⚠⚠ THE ONE RULE THAT SHAPES THE PHONE: THE SHEET IS NOT SQUEEZED. 470px square, on a screen
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
// ⚠ THE ARITHMETIC IS DONE IN DECLARED NUMBERS AND NEVER IN MEASUREMENTS. `current = round(scrollLeft
// / step)`, where `step` is the pitch the stylesheet laid the film out at. Reading
// `getBoundingClientRect()` instead would buy nothing – the layout cannot disagree with the
// stylesheet – and would cost the whole thing its testability, because happy-dom runs no layout
// engine at all (`tests/component/fits.ts`'s header is this repo's standing note on that wall). The
// one place a measurement IS read is the right-edge gradient, which is decoration, and it fails SAFE
// when there is nothing to measure: no width means "assume the page continues".
//
// ⚠⚠ THE PITCH IS A TOKEN NOW, BECAUSE THE PAGE HAS THREE SIZES AND THE FILM HAS TO HAVE THE SAME
// THREE. It was a bundled constant while the page was only ever 470 wide; at 768 the sheets are laid
// out 556 apart and scrolling to `N × 486` would land every page two thirds of a gutter out of
// register – visible as the previous sheet's edge peeking in beside the arrow, at every width but
// one. `readStep` reads `--album-step` off `:root`, where the stylesheet that laid the film out
// declared it, so the number that moves the scroller and the number the scroller was built at are
// the same number. `SHEET_STEP_PX` stays as the floor if the token is unreadable.
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
// are somewhere else entirely. ⚠ IT IS NOT A MOBILE-ONLY OMISSION – AW and AX draw the same four
// sections and the same product lockup and tagline, and they are deferred at all three widths for the
// one reason: of the four, `Career Summary` does not exist as a screen at all, so three quarters of a
// shell is not a smaller version of it. The album keeps its own header until that section is built.
import { computed, onMounted, ref } from 'vue'
import IconButton from '../ui/IconButton.vue'
import AlbumSheet from '../album/AlbumSheet.vue'
import AlbumChapterRail from '../album/AlbumChapterRail.vue'
import AlbumChaptersSheet from '../album/AlbumChaptersSheet.vue'
import { SHEET_GAP_PX, SHEET_STEP_PX } from '../../shared/protocol'
import type { AlbumBook } from '../../shared/protocol'

// ⭐ THE SHAPE IS THE ENGINE'S NOW (19.09, the seam wave). `AlbumBook` was built here against a
// declared stand-in (`components/album/albumWire.ts`) while the engine half was in flight on the
// same branch; that file is deleted and this reads `shared/protocol`, the app's own public path for
// every wire type. Not one field moved in the join – the two declarations were identical to the
// field – so nothing in this component changed with it. It derives no fact from the book; it pages
// through it, and `App.vue` fetches it on entering the section (`game.loadAlbum()`).
const props = defineProps<{ book: AlbumBook | null }>()
const emit = defineEmits<{ back: [] }>()

const pan = ref<HTMLElement | null>(null)
const scrolled = ref(0)
/** No width to read (happy-dom, or a first paint) means "the page continues" – the safe direction
 *  for an affordance: a gradient that should not be there is a smudge, a missing one is a dead end. */
const atFilmEnd = ref(false)

const sheets = computed(() => props.book?.sheets ?? [])
const chapters = computed(() => props.book?.chapters ?? [])

/** The film's pitch – one page plus the gutter between two of them – as the STYLESHEET laid it out.
 *
 *  ⚠ A REF AND NOT A CALL INSIDE `current`, so the pager is reactive to the answer rather than to
 *  whoever happened to ask last: a window dragged across 768 changes the pitch, and a computed that
 *  read a non-reactive source would keep naming the sheet the old pitch pointed at until something
 *  else moved. */
const step = ref(SHEET_STEP_PX)

/** ⚠ `:root` AND NOT THE SCROLLER, and that is happy-dom's constraint rather than a preference: a
 *  custom property declared on an ancestor does NOT resolve on a descendant there (measured 19.09),
 *  while the document element's own properties do – so the one element whose declaration can be read
 *  in both a browser and the mounted layer is the root. Falls back to the phone's own pitch rather
 *  than to zero: a step of nothing would divide the pager by it. */
function readStep(): void {
  const declared = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--album-step'),
  )
  step.value = Number.isFinite(declared) && declared > 0 ? declared : SHEET_STEP_PX
}

onMounted(readStep)

const current = computed(() => {
  if (sheets.value.length === 0) return 0
  const i = Math.round(scrolled.value / step.value)
  return Math.min(Math.max(i, 0), sheets.value.length - 1)
})

const sheet = computed(() => sheets.value[current.value] ?? null)
/** Even index = the left-hand page of a spread, odd = the right-hand one facing it. */
const onRightHalf = computed(() => current.value % 2 === 1)

function goTo(index: number): void {
  const i = Math.min(Math.max(index, 0), Math.max(sheets.value.length - 1, 0))
  // ⚠ RE-READ ON EVERY PRESS, which is what makes a window resized across 768 correct itself at the
  // next arrow rather than at the next reload. It costs one read of an already-computed style.
  readStep()
  const el = pan.value
  if (el) el.scrollLeft = i * step.value
  // ⚠ WRITTEN HERE AS WELL AS BY THE SCROLL HANDLER, because a programmatic `scrollLeft` does not
  // always fire `scroll` synchronously and the pager must never lag a press it just answered.
  scrolled.value = i * step.value
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
      <!-- ⚠⚠ `tabindex="0"` IS AN ACCESSIBILITY FIX AND NOT DECORATION (19.09, found by the e2e axe
           pass the moment this screen got a station). WCAG's `scrollable-region-focusable`, impact
           SERIOUS: a box that scrolls must be reachable from a keyboard, either because something
           inside it can take focus or because it can itself. THIS FILM IS THE ONE SCROLLER IN THE APP
           WHERE NEITHER WAS TRUE – every other horizontal scroller here holds buttons or links, so
           the rule has never fired before; a sheet of this album holds photographs and handwriting
           and not one focusable thing, so without this the whole page was pannable by finger and by
           mouse and by nothing else. One attribute makes the film a tab stop whose arrow keys scroll
           it, which is the browser's own behaviour and needs no handler from us.
           ⚠ NO `aria-label` WITH IT, DELIBERATELY: that would be a new sentence in the product, and
           the copy is the owner's (invariant 4). The rule asks for reachability, not for a name. -->
      <div
        ref="pan"
        class="album-pan"
        tabindex="0"
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

    <!-- THE CHAPTERS, OPEN ON THE PAGE. ⚠ In the tree at every width and drawn only past 768 – the
         component's own first rule, and the reason is beside it. Below 768 the same list is behind
         the «Chapters» button at the foot of the screen. -->
    <AlbumChapterRail
      v-if="chapters.length"
      :chapters="chapters"
      :current-chapter="sheet?.chapterIndex ?? 0"
      @pick="pickChapter"
    />

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
  /* ⚠⚠ THE THREE DECLARATIONS A FINGER-DRAGGED STRIP NEEDS, and they are not this file's taste –
     they are the house rule `tests/touch-and-scroll.test.ts` exists for, learned from a shipped
     regression the owner felt within a day of the merge (04.09): «скролл заедает либо в одну, либо в
     другую сторону, а некоторые клики… сначала не срабатывают, а потом становятся выделением
     текста». This screen shipped without all three and the pin went red on it, which is the pin
     working. Each answers one half of that sentence:
       · `touch-action: pan-x pan-y` – BOTH axes, named. The album's pan is the reader's finger and
         not our code (unlike `weekPager`, which drives `scrollLeft` itself and so gives the browser
         `pan-y` alone), so the browser keeps the horizontal axis – but a VERTICAL gesture that
         begins on a sheet must still scroll the page behind it, and `pan-x` alone freezes it. That
         half-fix is the one 04.09 got wrong, and it is written down in the pin.
       · `overscroll-behavior-x: contain` – without it, reaching the last sheet CHAINS and drags the
         page. `SeasonHistoryTable` has carried this line since it shipped.
       · `user-select: none` – a press-and-hold on a photograph otherwise resolves as a text
         selection and swallows the gesture. ⚠ It is scoped to the FILM, not to the album: the
         chapters sheet, the header and everything outside this box stay selectable, which is the
         narrow form of the rule the same file's second half insists on. */
  touch-action: pan-x pan-y;
  overscroll-behavior-x: contain;
  user-select: none;
  -webkit-user-select: none;
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

/* =================================================================================================
   ⭐⭐⭐ 768 AND UP – THE PAGE FITS, SO THE WINDOW STOPS BEING A KEYHOLE (mockups AX and AW)
   =================================================================================================

   Everything below is inside a `min-width` query and nothing above it was touched, which is the only
   spelling under which «390 unchanged» is a fact rather than a hope.

   ⚠⚠ THE TEMPLATE DOES NOT FORK, AND THAT IS THE POINT OF THE GRID. The mockups move two controls
   the phone puts in a row under the sheet – `‹` and `›` – to the sheet's own sides, and a second copy
   of them rendered for wide screens would be two controls with one name in the tree, half of them
   dead at any width. So `.album-foot` and `.album-pager` become `display: contents`: their boxes go,
   their children become items of THIS grid, and the DOM a screen reader walks is the same DOM at
   every width. The pager's two arrows are still `.album-pager .album-step` for anything that looks
   for them.

   The frame, then, is:

       head   head   head        the chapter's name, and Back
       prev  sheet   next        the page, with an arrow standing in the table on each side
       rail   rail   rail        the chapters
       dots   dots   dots        the pager
       foot   foot   foot        «Sheet N of M» */
@media (min-width: 768px) {
  .album {
    display: grid;
    /* ⚠ THE PAGE TAKES WHAT IT NEEDS AND THE TWO STRIPS OF TABLE SPLIT THE REST, which is not the
       obvious `auto 1fr auto` – that one gives the whole surplus to the middle and parks the arrows
       against the edges of the screen. Measured against AW at 1024: the page starts 228px in and the
       `‹` sits at 120, i.e. in the MIDDLE of the 228px strip beside it, not at its far end. Equal
       side tracks plus `justify-self: center` below is that placement, and it holds at any width
       because it is expressed as the strip rather than as a number. */
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-areas:
      'head head head'
      'prev sheet next'
      'rail rail rail'
      'dots dots dots'
      'foot foot foot';
    /* ⚠ THE ARROWS ARE CENTRED ON THE PAGE BY THE ROW, not by an offset anybody has to maintain:
       they share a grid row with the sheet, so «vertically centred on the page» is what the default
       alignment of that row already means. */
    align-items: center;
    row-gap: 18px;
    column-gap: 12px;
  }

  .album-head {
    grid-area: head;
  }

  .album-stage {
    grid-area: sheet;
    justify-self: center;
    /* The phone cancels the frame's gutter because its page is wider than the screen; here the page
       is narrower than the column and the gutter is simply the inset it sits in. */
    margin-inline: 0;
  }

  /* ⭐⭐ THE WINDOW IS EXACTLY ONE PAGE WIDE, AND THAT IS WHAT REPLACES THE PAN. A film whose window
     is wider than its page would show the next sheet standing behind the arrow – 196px of it at 768 –
     which is neither what AX draws nor what «одна половина листа» means. Clipping it is what makes
     the pager the only way to turn a page at this width.
     ⚠ `overflow-x: hidden` STILL SCROLLS PROGRAMMATICALLY. It refuses a finger, not `scrollLeft`, so
     the mechanism under the arrows is the same one the phone pans by – one film, one `scrollLeft`,
     one source of truth about which page is in the window. */
  .album-pan {
    width: var(--album-sheet);
    overflow-x: hidden;
    padding-inline: 0;
    /* ⚠ AND THE SCROLL PADDING GOES WITH THE PADDING IT COMPENSATED. On the phone the scroller pays
       the app's gutter and the snap point is `gutter + N × step` without it; here there is no gutter
       to pay, so the snap point IS `N × step` – which is what `goTo` scrolls to. */
    scroll-padding-inline: 0;
  }

  /* ⚠⚠ THE PAN AFFORDANCE IS NOT HIDDEN, IT IS GONE. `display: none` takes the box AND the
     accessibility node (src/style.css says exactly this beside `.rail-dash`), which is the honest
     state for two objects that describe a mechanism this width does not have: there is no half of a
     page off-screen to promise, and no edge for a gradient to fade into. A dimmed gradient or an
     `opacity: 0` pill would be the same lie drawn faintly. */
  .album-edge,
  .album-half {
    display: none;
  }

  .album-rail {
    grid-area: rail;
  }

  /* The two rows of chrome the phone stacks under the sheet are grid items now – see the header. */
  .album-foot,
  .album-pager {
    display: contents;
  }

  /* ⚠ `:first-of-type` / `:last-of-type` COUNT BUTTONS AMONG THEIR SIBLINGS, and `display: contents`
     changes boxes rather than the tree – so these still mean "the first and last button inside
     `.album-pager`", which is the prev and the next arrow with the dots between them. */
  .album-step:first-of-type {
    grid-area: prev;
    justify-self: center;
  }

  .album-step:last-of-type {
    grid-area: next;
    justify-self: center;
  }

  .album-dots {
    grid-area: dots;
  }

  .album-foot-row {
    grid-area: foot;
    /* The Chapters door is gone at this width (below), so the counter is the only thing left in the
       row and `space-between` would park it against the left edge of a 1024px page. */
    justify-content: center;
  }

  /* ⚠ THE DOOR CLOSES BECAUSE THE ROOM IS ALREADY OPEN. The chapters are on the page from 768 up, so
     a button that opens the same list over the top of them is a second way to the same place – and
     the one the README gives a reason for is the phone's: «рейл занял бы полэкрана». */
  .album-chapters-btn {
    display: none;
  }
}
</style>
