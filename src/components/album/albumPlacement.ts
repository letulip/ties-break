// ⭐⭐ WHERE A NOTE AND A LOOSE LINE MAY SIT ON A SHEET – A PURE RESOLVER, ROUND 45 #6.
//
// THE OWNER'S SENTENCE (02.10): «Расположение фото в альбоме конфликтуют с надписями в самом альбоме
// и с некоторыми записками, которые перекрывают надписи на фото, надо подумать как лучше сделать».
//
// ⚠ WHAT WAS WRONG IS GEOMETRY, MEASURED IN A REAL BROWSER (a throwaway Playwright run over the seeded
// `pro` career, 6 sheets, Chromium, Caveat loaded). Nothing here is engine-composed: every coordinate of
// a sheet is a pixel number in `AlbumLayoutA/B/C.vue`, and the engine hands over only text. The texts
// are what vary – a note is 3 to 7 ruled lines, a caption 1 to 3, the loose line 1 to 5 – and the CSS
// numbers were drawn for the mockup's short ones. So, before this file:
//   * layout B: the pasted note is bottom-anchored at y 275 and GROWS UPWARD, so a 5-6 line note
//     (232px tall) covered both top-row captions on both sheets measured;
//   * layout C: the note is anchored at y 434 and grew up into the hero's caption on both sheets;
//   * layout A: the loose line (x 120..320, y 422) ran under the second photograph's caption on both;
//   * layout C's second photograph hangs 27-47px past the page edge, so its caption is clipped.
//
// ⭐ THE RULE, IN TWO SENTENCES. A note or a loose line may stand where the layout drew it only if no
// caption band – the lip of a photograph, from the bottom of its picture to the bottom of its card –
// touches it; otherwise it takes the cheapest free spot (pixels walked, plus a price for every picture
// it would cover, for every rung the photograph windows shrink and for a wider note), and if no spot
// exists at all it is stacked directly below the lowest caption it would have hit.
// THE CAPTIONS ARE THE ONE THING IT NEVER TOUCHES: bare paper is preferred, then a spot clear of the
// furniture too (title, patch, pass, tag), then one that may cover a doodle, and the furniture is given
// up in that order before a caption is.
//
// ⚠ IT IS PURE ON PURPOSE: no DOM, no clock, no random, nothing but the sheet it is handed. That is
// what lets a sweep over hundreds of real sheets be the evidence – happy-dom does not lay boxes out, so
// a mounted test cannot measure an overlap and this can. The heights it works with are an ESTIMATE of
// how Caveat wraps (`HAND_EM`), and `tests/round45-album-placement.test.ts` pins that estimate against
// the real Chromium measurements it was taken from: it may over-count a line, it may never under-count.
import { SHEET_PX } from '../../shared/protocol'
import type { AlbumFrame, AlbumLayout, AlbumSheetModel } from '../../shared/protocol'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** One photograph as the page will draw it: where, how big its window is, and the band that is its
 *  caption (null when there is nothing written on it). */
export interface PhotoPlacement {
  x: number
  y: number
  w: number
  photoH: number
  tilt: number
  lines: number
  box: Box
  band: Box | null
}

export interface SheetPlacement {
  photos: PhotoPlacement[]
  note: Box | null
  line: Box | null
  /** The photograph windows were drawn at this fraction of the layout's own height (1 = as drawn). */
  scale: number
  /** True when neither the note nor the line touches any caption band. */
  clear: boolean
}

/** Average advance of the app's handwriting face, in em. ⚠ MEASURED, NOT CHOSEN: the six real sheets
 *  (22 wrapped elements) wrap at 0.37-0.39em; 0.40 is the next round number above, so the estimate
 *  runs a line long now and then and never short. */
export const HAND_EM = 0.4

/** `Polaroid.vue`'s own numbers – padding 4/4/12, the caption's 8px margin, 17px at 1.15. Pinned
 *  against that file in the test. */
export const POLAROID = { top: 4, side: 4, bottom: 12, capGap: 8, capSide: 4, capFont: 17, capLine: 19.55 }

/** `AlbumNoteCard.vue` + `PaperNote.vue`: padding 10/13/12 and a 26px ruling that the text sits on. */
export const NOTE = { padTop: 10, padBottom: 12, padSide: 13, rule: 26, font: 17, whenFont: 15, whenGap: 14 }

/** The photograph windows are tried at these fractions of their drawn height, widest first. */
export const SCALES: readonly number[] = [1, 0.92, 0.84, 0.76, 0.68]

const PAGE = SHEET_PX
/** Air kept between a moved item and what it avoids. */
const GAP = 2

/** How many lines `text` takes in a box `width` wide at `fontPx`, wrapping at spaces like a browser. */
export function wrapLines(text: string, width: number, fontPx: number): number {
  const perLine = Math.max(1, Math.floor(width / (fontPx * HAND_EM)))
  let lines = 1
  let used = 0
  for (const word of text.split(/\s+/)) {
    if (!word) continue
    let len = word.length
    if (used > 0 && used + 1 + len <= perLine) {
      used += 1 + len
      continue
    }
    if (used > 0) lines++
    while (len > perLine) {
      lines++
      len -= perLine
    }
    used = len
  }
  return lines
}

/** The height of a pasted note `w` wide: padding, the date row (one row, or two when the two labels
 *  do not fit side by side – measured wrapping at 125px and 130px of content), and the ruled text. */
export function noteHeight(sheet: AlbumSheetModel, w: number): number {
  const note = sheet.note
  if (!note) return 0
  const inner = w - 2 * NOTE.padSide
  let rows = 0
  if (note.dateLabel || note.ageLabel) {
    const a = note.dateLabel?.length ?? 0
    const b = note.ageLabel?.length ?? 0
    const gap = a > 0 && b > 0 ? NOTE.whenGap : 0
    rows += (a + b) * NOTE.whenFont * HAND_EM + gap <= inner ? 1 : 2
  }
  rows += note.text
    ? wrapLines(note.text, inner, NOTE.font)
    : note.lines.reduce((n, l) => n + wrapLines(l, inner, NOTE.font), 0)
  return NOTE.padTop + NOTE.padBottom + rows * NOTE.rule
}

interface PhotoSlot {
  x: number
  y: number
  w: number
  photoH: number
  tilt: number
}

interface LayoutDef {
  photos: readonly PhotoSlot[]
  /** Note widths, as drawn first and then wider – a wider note is a shorter one. `right` pins the
   *  note's right edge to the page edge (layout A's note runs to it). */
  note: { x: number; y: number; anchor: 'top' | 'bottom'; widths: readonly number[]; right?: boolean }
  line: { x: number; y: number; w: number; font: number; lh: number }
  fixed(sheet: AlbumSheetModel): Box[]
}

/** The title block grows with the chapter's name: 164px for «Growing up», 270px for «The breakthrough»
 *  (measured), which is 17px a character at its 44px size. */
function headBox(x: number, sheet: AlbumSheetModel): Box {
  return { x, y: 26, w: Math.max(164, Math.ceil(sheet.chapterTitle.length * 17)), h: 96 }
}

/** The boarding pass is bottom-anchored at 48px; its height follows the tier step (97 and 121
 *  measured on `middle` and `high`). */
function passBox(sheet: AlbumSheetModel): Box {
  const h = sheet.ticket && (sheet.ticket.step === 'high' || sheet.ticket.step === 'elite') ? 121 : 97
  return { x: 22, y: PAGE - 48 - h, w: 400, h }
}

/** THE THREE DRAWINGS' OWN NUMBERS – what `AlbumLayoutA/B/C.vue` carried as CSS before this file.
 *  The photographs, the note and the line are bound from here; the furniture (`fixed`) keeps its CSS
 *  and is mirrored here, which `tests/component/round45-album-placement.test.ts` holds against it. */
export const LAYOUTS: Record<AlbumLayout, LayoutDef> = {
  A: {
    photos: [
      { x: 24, y: 126, w: 245, photoH: 170, tilt: -1.2 },
      { x: 256, y: 275, w: 200, photoH: 130, tilt: 2.2 },
    ],
    note: { x: SHEET_PX, y: 92, anchor: 'top', widths: [176, 200, 230], right: true },
    line: { x: 120, y: 422, w: 200, font: 21, lh: 26.25 },
    fixed: (s) => [
      headBox(34, s),
      { x: 28, y: 368, w: 96, h: 83 },
      { x: 128, y: 388, w: 26, h: 26 },
    ],
  },
  B: {
    photos: [
      { x: 15, y: 15, w: 162, photoH: 120, tilt: -2 },
      { x: 195, y: 18, w: 159, photoH: 104, tilt: 2.4 },
      { x: 339, y: 123, w: 123, photoH: 140, tilt: 1.6 },
    ],
    note: { x: 167, y: 275, anchor: 'bottom', widths: [151, 220, 300] },
    line: { x: 26, y: 250, w: 132, font: 20, lh: 26 },
    fixed: (s) => [passBox(s), { x: 131, y: 268, w: 24, h: 24 }],
  },
  C: {
    photos: [
      { x: 26, y: 100, w: 276, photoH: 196, tilt: -0.8 },
      { x: 204, y: 332, w: 138, photoH: 100, tilt: 1.8 },
    ],
    note: { x: 28, y: 434, anchor: 'bottom', widths: [156, 220, 290] },
    line: { x: 388, y: 368, w: 74, font: 19, lh: 23.75 },
    fixed: (s) => [headBox(33, s), { x: 327, y: 77, w: 110, h: 271 }, { x: 368, y: 401, w: 24, h: 24 }],
  },
}

/** A photograph as the page draws it at one rung of the scale ladder. */
function photoOf(slot: PhotoSlot, frame: AlbumFrame, scale: number): PhotoPlacement {
  let photoH = Math.round(slot.photoH * scale)
  const lines = frame.caption ? wrapLines(frame.caption, slot.w - 2 * POLAROID.side - 2 * POLAROID.capSide, POLAROID.capFont) : 0
  const lip = POLAROID.bottom + (lines > 0 ? POLAROID.capGap + lines * POLAROID.capLine : 0)
  // A card must not hang off the page: its caption is on the lip, and the sheet clips what is past its
  // edge (layout C's second photograph hung 27-47px over it). The window gives the overflow back, down
  // to the smallest rung, and no further.
  const floor = Math.round(slot.photoH * (SCALES[SCALES.length - 1] as number))
  photoH = Math.max(Math.min(photoH, floor), Math.min(photoH, PAGE - POLAROID.top - lip - slot.y))
  const h = POLAROID.top + photoH + lip
  const box: Box = { x: slot.x, y: slot.y, w: slot.w, h }
  // The card leans by up to a few degrees about its centre: widen the band by what that swings.
  const pad = Math.ceil((Math.max(slot.w, h) / 2) * Math.sin((Math.abs(slot.tilt) * Math.PI) / 180)) + 1
  const band: Box | null =
    lines > 0
      ? { x: slot.x - pad, y: slot.y + POLAROID.top + photoH - pad, w: slot.w + 2 * pad, h: lip + 2 * pad }
      : null
  return { x: slot.x, y: slot.y, w: slot.w, photoH, tilt: slot.tilt, lines, box, band }
}

/** True when the interiors touch, with `GAP` of air counted as part of `b`. */
export function touches(a: Box, b: Box): boolean {
  return a.x < b.x + b.w + GAP && b.x - GAP < a.x + a.w && a.y < b.y + b.h + GAP && b.y - GAP < a.y + a.h
}

/** The free spot nearest to where `m` was drawn: every position at which an edge of `m` rests against
 *  an obstacle (or the page, or its own start) is a candidate, and the cheapest by pixels moved wins –
 *  vertical moves before horizontal ones, down before up, right before left, so the answer never
 *  depends on the order the obstacles were listed in. */
function freeSpot(m: Box, obstacles: readonly Box[], soft: readonly Box[] = []): { box: Box; cost: number } | null {
  const xs = new Set<number>([m.x, 0, PAGE - m.w])
  const ys = new Set<number>([m.y, 0, PAGE - m.h])
  for (const o of obstacles) {
    xs.add(Math.ceil(o.x + o.w + GAP))
    xs.add(Math.floor(o.x - m.w - GAP))
    ys.add(Math.ceil(o.y + o.h + GAP))
    ys.add(Math.floor(o.y - m.h - GAP))
  }
  const spots: { x: number; y: number; cost: number; rank: number }[] = []
  for (const x of xs) {
    for (const y of ys) {
      if (x < 0 || y < 0 || x + m.w > PAGE || y + m.h > PAGE) continue
      const rank = (x === m.x ? 0 : 4) + (y === m.y ? 0 : 2) + (y >= m.y ? 0 : 1)
      const at = { x, y, w: m.w, h: m.h }
      const cover = soft.reduce((n, o) => n + overlapArea(at, o), 0)
      spots.push({ x, y, cost: Math.abs(x - m.x) + Math.abs(y - m.y) + COVER_COST * cover, rank })
    }
  }
  spots.sort((p, q) => p.cost - q.cost || p.rank - q.rank || p.x - q.x || p.y - q.y)
  for (const s of spots) {
    const at = { x: s.x, y: s.y, w: m.w, h: m.h }
    if (!obstacles.some((o) => touches(at, o))) return { box: at, cost: s.cost }
  }
  return null
}

function noteDrawnAt(def: LayoutDef, sheet: AlbumSheetModel, w: number): Box {
  const h = noteHeight(sheet, w)
  const { x, y, anchor, right } = def.note
  return { x: right ? x - w : x, y: anchor === 'bottom' ? y - h : y, w, h }
}

function lineDrawnAt(def: LayoutDef, sheet: AlbumSheetModel): Box | null {
  if (!sheet.line) return null
  const { x, y, w, font, lh } = def.line
  return { x, y, w, h: wrapLines(sheet.line, w, font) * lh }
}

/** Both movers against one obstacle set, the note first and the line avoiding it. Null when either
 *  has no free spot. */
function settle(
  def: LayoutDef,
  sheet: AlbumSheetModel,
  obstacles: readonly Box[],
  noteW: number,
  soft: readonly Box[],
): { note: Box | null; line: Box | null; cost: number } | null {
  const noteAt = sheet.note ? noteDrawnAt(def, sheet, noteW) : null
  const n = noteAt ? freeSpot(noteAt, obstacles, soft) : null
  if (noteAt && !n) return null
  const lineAt = lineDrawnAt(def, sheet)
  const l = lineAt ? freeSpot(lineAt, n ? [...obstacles, n.box] : obstacles, soft) : null
  if (lineAt && !l) return null
  return { note: n?.box ?? null, line: l?.box ?? null, cost: (n?.cost ?? 0) + (l?.cost ?? 0) }
}

/** Where the note and the line would be with NO resolving at all – the layout's own drawing. The
 *  «before» of round 45 #6. */
export function drawnPlacement(sheet: AlbumSheetModel): { note: Box | null; line: Box | null; bands: Box[] } {
  const def = LAYOUTS[sheet.layout]
  const bands = bandsOf(def, sheet, 1)
  return {
    note: sheet.note ? noteDrawnAt(def, sheet, def.note.widths[0] ?? 0) : null,
    line: lineDrawnAt(def, sheet),
    bands,
  }
}

function photosOf(def: LayoutDef, sheet: AlbumSheetModel, scale: number): PhotoPlacement[] {
  return sheet.frames.slice(0, def.photos.length).map((f, i) => photoOf(def.photos[i] as PhotoSlot, f, scale))
}

function bandsOf(def: LayoutDef, sheet: AlbumSheetModel, scale: number): Box[] {
  return photosOf(def, sheet, scale).flatMap((p) => (p.band ? [p.band] : []))
}

/** ⭐ THE RESOLVER. A sheet in, the positions out. See the header for the rule. */
export function placeSheet(sheet: AlbumSheetModel): SheetPlacement {
  const def = LAYOUTS[sheet.layout]
  // 1. THE KINDEST ARRANGEMENT FIRST, and each tier gives up one more thing than the one before it: bare
  //    paper (the note and the line touch no photograph at all) -> captions and every piece of furniture
  //    kept clear -> a sticker (a doodle) may be covered -> only the captions are kept. Inside a tier the
  //    photograph windows are tried at the widest rung that allows it and the note at its drawn width
  //    before a wider one – a smaller photograph is a smaller price than a note over somebody's face.
  const furniture = def.fixed(sheet)
  const solid = furniture.filter((x) => !isSticker(x))
  const tiers: ((k: { photos: PhotoPlacement[]; bands: Box[] }) => Box[])[] = [
    ({ photos, bands }) => [...bands, ...photos.map((p) => padded(p.box)), ...furniture],
    ({ bands }) => [...bands, ...furniture],
    ({ bands }) => [...bands, ...solid],
    ({ bands }) => bands,
  ]
  // Within a tier EVERY rung is tried and the cheapest wins – pixels walked, plus a price for each picture
  // covered, plus a price for each step the photographs were shrunk and for a wider note – because the first
  // rung that merely has room is not the best one: at full size a long note's only spot can be on top of the
  // big photograph, while one rung down it fits below it.
  for (const tier of tiers) {
    let best: { score: number; out: SheetPlacement } | null = null
    for (const scale of SCALES) {
      const photos = photosOf(def, sheet, scale)
      const bands = photos.flatMap((p) => (p.band ? [p.band] : []))
      const soft = photos.map(pictureOf)
      for (let wi = 0; wi < def.note.widths.length; wi++) {
        const got = settle(def, sheet, tier({ photos, bands }), def.note.widths[wi] as number, soft)
        if (!got) continue
        const score = got.cost + SHRINK_COST * Math.round((1 - scale) * 100) + WIDEN_COST * wi
        if (!best || score < best.score) best = { score, out: { photos, note: got.note, line: got.line, scale, clear: true } }
      }
    }
    if (best) return best.out
  }
  // 3. No free spot anywhere: STACK BELOW the lowest caption the note would have touched, inside the
  //    page, and say so (`clear` false) instead of pretending.
  const scale = SCALES[SCALES.length - 1] as number
  const photos = photosOf(def, sheet, scale)
  const bands = photos.flatMap((p) => (p.band ? [p.band] : []))
  const w = def.note.widths[def.note.widths.length - 1] as number
  const drawn = sheet.note ? noteDrawnAt(def, sheet, w) : null
  let note: Box | null = null
  if (drawn) {
    const above = bands.filter((b) => b.x < drawn.x + drawn.w && drawn.x < b.x + b.w)
    const floor = above.reduce((y, b) => Math.max(y, Math.ceil(b.y + b.h + GAP)), 0)
    note = { ...drawn, y: Math.min(Math.max(drawn.y, floor), PAGE - drawn.h) }
  }
  const lineAt = lineDrawnAt(def, sheet)
  const line = lineAt ? (freeSpot(lineAt, bands)?.box ?? lineAt) : null
  const clear = ![note, line].some((m) => m && bands.some((b) => touches(m, b)))
  return { photos, note, line, scale, clear }
}

/** The picture window of a card – what a note over a photograph hides. */
function pictureOf(p: PhotoPlacement): Box {
  return { x: p.x, y: p.y + POLAROID.top, w: p.w, h: p.photoH }
}

function overlapArea(a: Box, b: Box): number {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
}

/** Pixels of travel one pixel² of a covered picture is worth: a note that must cover a 20,000px² picture
 *  would rather walk 400px, so it walks to bare paper whenever bare paper is anywhere near. */
const COVER_COST = 0.02

/** Pixels of travel one percent of photograph window is worth (a rung is 8%), and one step wider for a note. */
const SHRINK_COST = 15
const WIDEN_COST = 20

/** A doodle is the one furniture that is only a sticker: 24-26px a side. */
function isSticker(b: Box): boolean {
  return b.w <= 26 && b.h <= 26
}

/** A little air round a card for the lean it sits at. */
function padded(b: Box): Box {
  return { x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6 }
}

/** `px()` for an inline style. */
export function px(n: number): string {
  return `${n}px`
}

/** The inline style that puts a box where the resolver said. */
export function spot(b: { x: number; y: number; w?: number }): Record<string, string> {
  return b.w === undefined ? { left: px(b.x), top: px(b.y) } : { left: px(b.x), top: px(b.y), width: px(b.w) }
}
