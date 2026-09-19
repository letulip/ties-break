// THE ALBUM BOOK – the wire shape of the career's whole story, as the album screens render it.
// docs/specs/the-album-2026-09.md; the engine half is src/engine/world/albumBook.ts, the
// handwriting is src/engine/world/albumCorpus.ts (generated from docs/specs/album-corpus-2026-09.md).
//
// ⚠⚠ A VIEW, NEVER PERSISTED, AND NEVER ON THE WEEKLY SNAPSHOT. The spec's §8b ruling: «Сборка
// альбома – по требованию, не в недельном снимке» – fifteen sheets of facts in every weekly
// `Snapshot` would bloat every tick, so the book is assembled when the section opens (the worker's
// `album` query) and thrown away. Nothing here touches `SAVE_SCHEMA_VERSION`; the one persisted
// fact the album added is `WorldState.prologueTrace` (v84), declared with the world.
//
// ⚠⚠ THESE SHAPES ARE `src/components/album/albumWire.ts`'s, MOVED HOME – that file's own header
// said so: «THE ALBUM'S WIRE TYPE BELONGS TO THE ENGINE … re-exported through `src/shared/protocol/*`
// … WHEN `world/albumBook.ts` LANDS: delete this file and re-point the four `import type` lines».
// The mobile sheet, the three layouts and their mounted tests were built and MEASURED against these
// exact fields, so the engine conforms to them rather than re-cutting a shape the screens already
// render.
//
// ⭐ THAT MOVE IS DONE (19.09). Every importer reads `shared/protocol` – the app's public path for a
// wire type – and the stand-in is deleted, so this is the only declaration in the tree. It cost
// nothing to join: the two shapes were IDENTICAL to the field, which is what `tests/albumBook.test.ts`
// §wire was there to guarantee while both existed, and that pin retired with its subject.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

/** The three arrangements of the same square sheet (spec §3, mockups AW and AZ). `A` and `C` open
 *  a chapter; `B` is the ordinary sheet with the boarding pass. */
export type AlbumLayout = 'A' | 'B' | 'C'

/** The six drawn marginalia the mockups list. Nothing here is a file – the UI draws them. */
export type AlbumDoodle = 'trophy' | 'heart' | 'sun' | 'smile' | 'globe' | 'plane'

/** One photograph in its polaroid: the painting resolved by the ladder of spec §4, and the
 *  corpus's caption on the lip – about her, third person.
 *
 *  ⚠ `art` IS A PATH RELATIVE TO THE APP's BASE URL – `avatarCropPath`'s own convention
 *  (`images/fem-euro-brunnet/…`), because the engine may not read `import.meta.env` and a leading
 *  slash breaks a `BASE_PATH` deploy. The rendering side prefixes `import.meta.env.BASE_URL`,
 *  exactly as `useKidEmotion` does for every other painting. The engine decided WHICH picture (the
 *  §4 ladder: event painting, then the travel scene, then the band-and-mood portrait) and the path
 *  is that decision spelled; `tests/albumBook.test.ts` sweeps every path the assembly can emit
 *  against the files on disk. */
export interface AlbumFrame {
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
   *  the note is prose – which is every corpus note today. */
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

// =================================================================================================
// THE PAGE'S THREE SIZES – the constants the pager and the mounted tests share. Moved with the wire
// from the stand-in; the long-form arguments for each number went with the components that render
// them (`AlbumScreen.vue`'s `readStep`, `AlbumPaper.vue`'s header) and the ladder holding all three
// spellings together is `tests/component/album-wide.test.ts`.
// =================================================================================================

/** The sheet is 470 CSS pixels and is NEVER scaled to the screen – squeezed to a phone's 342px the
 *  handwriting lands at 9–10px and stops being readable, so the screen pans instead (spec §6). */
export const SHEET_PX = 470
export const SHEET_GAP_PX = 16
export const SHEET_STEP_PX = SHEET_PX + SHEET_GAP_PX

/** The other two widths (spec §6): past 768 the window is exactly one sheet across. These are the
 *  spec's numbers; the cascade's own copy is `--album-sheet` on `:root`, and the mounted tests hold
 *  the ladder to both. */
export const SHEET_TABLET_PX = 540
export const SHEET_DESKTOP_PX = 556
export const SHEET_TABLET_STEP_PX = SHEET_TABLET_PX + SHEET_GAP_PX
export const SHEET_DESKTOP_STEP_PX = SHEET_DESKTOP_PX + SHEET_GAP_PX

/** The 470-pixel space the three collages are drawn in, and it never steps – a page grows by
 *  SCALING this frame, not by re-laying the furniture out. */
export const LEAF_PX = SHEET_PX
