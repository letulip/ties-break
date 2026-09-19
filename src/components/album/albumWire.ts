// ⚠⚠⚠ TEMPORARY – THIS FILE IS A STAND-IN AND MUST BE DELETED.
//
// THE ALBUM'S WIRE TYPE BELONGS TO THE ENGINE, in `src/engine/world/albumBook.ts` (the on-demand
// assembly the spec names in §8b: «альбом собирается при открытии раздела, как рыночные виды») and
// re-exported through `src/shared/protocol/*` like every other snapshot view. That module did not
// exist when this layer was built – the engine half of the wave was still in flight on the same
// branch – so rather than block, this file mirrors the model the spec describes and the mockups
// draw, so the mobile sheet could be built, mounted and measured against a real shape.
//
// ⚠ WHEN `world/albumBook.ts` LANDS: delete this file and re-point the four `import type` lines in
// `components/album/*` and `components/screens/AlbumScreen.vue` at the protocol's own export. Every
// name here was chosen to be renameable in one pass; nothing in this layer derives a fact, and no
// component reads anything the engine does not hand it.
//
// ⚠⚠ AND NOT ONE STRING ON A SHEET IS DECIDED HERE. Invariant 4: the handwriting is
// `src/engine/world/albumCorpus.ts`'s, generated from the owner's document, and the fields below are
// the holes it arrives in – `caption` is the corpus's `caption`, `note.text` its `note`, `line` its
// `line`. This layer renders them and never authors one.

/** The three arrangements of the same square sheet (spec §3, mockups AW and AZ). */
export type AlbumLayout = 'A' | 'B' | 'C'

/** The six drawn marginalia the README lists. Nothing here is a file. */
export type AlbumDoodle = 'trophy' | 'heart' | 'sun' | 'smile' | 'globe' | 'plane'

/** One photograph in its polaroid: the painting resolved by the ladder of spec §4, and the
 *  corpus's caption on the lip – about her, third person. */
export interface AlbumFrame {
  /** Resolved engine-side: event painting, then travel scene, then the band-and-mood portrait. */
  art: string
  /** The `<img>` alt. Engine-side, because only the selector knows what the painting is OF. */
  alt: string
  /** Corpus `caption`. May be empty – not every frame is written under. */
  caption: string
}

/** The pasted note: the corpus's `note` (to her, second person), over the frame's own week. The
 *  date and the age are the ENGINE's formatting – «Даты с неделями можно писать вполне и возраст
 *  тоже можно использовать» – and no corpus string carries either. */
export interface AlbumNote {
  text: string
  dateLabel: string | null
  ageLabel: string | null
  /** The checklist form: short ruled lines instead of a paragraph (mockup AZ-B, AZ-C). Empty when
   *  the note is prose. */
  lines: readonly string[]
}

/** The boarding pass that anchors layout B. Rank, stage, date and place are the world's; the
 *  seat, gate, row and barcode are flavour the engine derives from the seed so a re-read of the
 *  album does not reshuffle them (spec §4). ⚠ Its `tier` is one of OUR fictional ranks – never
 *  `WTA 1000`, never `ITF W15`. */
export interface AlbumTicket {
  tier: string
  stage: string
  venue: string
  dateLabel: string
  gate: string
  seat: string
  row: string
  /** Bar widths in px, seed-derived. The barcode is drawn from this and nothing else. */
  bars: readonly number[]
}

/** The tall baggage tag of layout C, on its drawn string. Same rule about names as the ticket. */
export interface AlbumTag {
  stage: string
  tier: string
  place: string
  ageLabel: string
}

/** One sheet – the unit of paging, and the unit the pager counts. */
export interface AlbumSheetModel {
  id: string
  layout: AlbumLayout
  /** 1-based, for «Chapter N of M» on an opener. */
  chapterIndex: number
  chapterTitle: string
  /** «Age 5 – 8» – short dash, engine-side. */
  ageLabel: string
  frames: readonly AlbumFrame[]
  note: AlbumNote | null
  /** Corpus `line` – the parent thinking aloud, loose in the margin. */
  line: string
  ticket: AlbumTicket | null
  tag: AlbumTag | null
  /** The club patch's fictional name, pulled from the seed (spec §8b). */
  patch: string | null
  doodles: readonly AlbumDoodle[]
}

/** A chapter, as the Chapters sheet lists it. `firstSheet` is an index into `AlbumBook.sheets`. */
export interface AlbumChapter {
  index: number
  title: string
  ageLabel: string
  sheetCount: number
  firstSheet: number
}

/** The whole album, assembled on demand. ⚠ `sheets.length` is what the career EARNED – the pager
 *  counts it and never twelve (spec §3: «счётчик внизу считает реальное M, а не двенадцать»). */
export interface AlbumBook {
  chapters: readonly AlbumChapter[]
  sheets: readonly AlbumSheetModel[]
}

/**
 * ⭐⭐ THE SHEET IS 470 CSS PIXELS AND IS NEVER SCALED TO THE SCREEN, and the reason is measured
 * rather than aesthetic – it is the README's own: squeezed to a 390-wide phone's 342px of content
 * the handwriting would land at 9–10px and stop being readable. So the screen is narrower than the
 * sheet, and the sheet PANS instead (spec §6).
 *
 * ⚠ THE STEP IS A CONSTANT AND NOT A MEASUREMENT. `scrollLeft` arithmetic built on
 * `getBoundingClientRect()` would be untestable here (happy-dom does no layout) and, worse, would
 * disagree with itself for one frame after a resize. The scroller lays its sheets out at exactly
 * these two numbers, so the same two numbers are what the pager scrolls by.
 */
export const SHEET_PX = 470
export const SHEET_GAP_PX = 16
export const SHEET_STEP_PX = SHEET_PX + SHEET_GAP_PX

/**
 * ⭐⭐ THE OTHER TWO WIDTHS (spec §6, README: «AW / AX: квадратный лист виден целиком (556px /
 * 540px)»). Past 768 the screen is WIDER than the page, so the page stops panning and the window
 * becomes exactly one sheet across.
 *
 * ⚠⚠ THESE ARE THE SPEC'S NUMBERS AND NOT THE MECHANISM'S. What actually sizes the page is
 * `--album-sheet` on `:root` in `src/style.css`, because the box and the window are two scoped
 * stylesheets in two SFCs and only a :root token reaches both. These three constants are what
 * `tests/component/album-wide.test.ts` holds that ladder to – the README on one side, the cascade on
 * the other – so a step that is edited in the stylesheet alone goes red instead of silently becoming
 * the new design. ⚠ Nothing in the app reads them to draw with; the one runtime reader is the
 * scroller's fallback below.
 */
export const SHEET_TABLET_PX = 540
export const SHEET_DESKTOP_PX = 556
export const SHEET_TABLET_STEP_PX = SHEET_TABLET_PX + SHEET_GAP_PX
export const SHEET_DESKTOP_STEP_PX = SHEET_DESKTOP_PX + SHEET_GAP_PX

/** The 470-pixel space the three collages are drawn in, and it never steps – see `--album-leaf` in
 *  `src/style.css`. A page grows by SCALING this frame, not by re-laying the furniture out. */
export const LEAF_PX = SHEET_PX
