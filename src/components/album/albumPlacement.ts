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
// ⭐ ROUND 45 #6b – THE OWNER'S OWN IDEA, 02.10 («может быть пересмотреть размер самих записочек»): a LONG
// NOTE IS WRITTEN SMALLER. Three things changed and nothing else: (1) a long note is DRAWN SMALLER – the
// whole scrap, hand and ruling and margins together (`NOTE_STEPS`: 1, 0.9, 0.82) – chosen HERE, from its
// text's length, so the page and the model agree; (2) layout C's hero picture is something a note never covers while any other spot exists – the
// windows give way first, and only the last tier (captions kept, nothing else) may cover it; (3) a rung of
// shrunk photograph windows costs 40 a percent now, not 15 – with a smaller note the kindest tier is
// reachable at a larger rung, and the price keeps it that way. B6's before/after is in the test.
//
// ⚠ IT IS PURE ON PURPOSE: no DOM, no clock, no random, nothing but the sheet it is handed. That is
// what lets a sweep over hundreds of real sheets be the evidence – happy-dom does not lay boxes out, so
// a mounted test cannot measure an overlap and this can. The heights it works with are an ESTIMATE of
// how Caveat wraps (`HAND_EM`), and `tests/round45-album-placement.test.ts` pins that estimate against
// the real Chromium measurements it was taken from: it may over-count a line, it may never under-count.
// ⭐⭐ ROUND 47 #9 – THE HEADING'S OWN BOX, AND THE PHOTOGRAPH THAT HUNG INSIDE IT (owner, 06.10: «иногда у этих заголовков оверлап с написанным на
// странице случается … вроде место есть»). MEASURED IN REAL CHROMIUM over these same 335 sheets: layout A collides with its heading on 0 sheets, B has
// no heading, and layout C on ALL 121 – the heading's third line, the years («Age 13 – 15»), lies UNDER the hero photograph, the whole text of it. No
// note and no caption is involved: C's hero slot began at y 100 and the title block reserves y 26..122, so the photograph was drawn 22px into a box this
// file itself holds for the title. The resolver never saw it because it only moves a note and a loose line – a photograph's slot is a TABLE ENTRY, and
// nothing compared the table with its own furniture. «Sometimes» is A and C alternating. THE FIX IS IN THE TABLE: the heading is one step smaller and 83px
// tall (`HEAD_H`, was 96), and C's hero hangs `HERO_GAP` under it with its window giving the same pixels back at the bottom edge, so nothing under the
// hero moves – the note strip, the second photograph and round 45's guard counts are the ones that were tuned. `tests/r47-b3-album-headings.test.ts`
// compares EVERY photograph slot, at every rung, with the heading's box (the comparison that was missing) and the placed note and line with it.
//
// ⭐⭐ ROUND 47 #14 – THE SMALL SNAPSHOT IN THE GAP (`placeFiller`). A sheet with no ticket (layout B) or no side tag (layout C) leaves the frame that
// object would have hung in EMPTY – this file has always reserved it (`passBox`, the tag's box) and nothing is drawn there. The snapshot is hung in that
// frame and only there, AFTER the note, the line and the photographs are settled and WITHOUT moving any of them: it takes the first of a short list of
// spots that touches nothing, and a sheet with no such spot goes without. That is the whole of the guard – no window shrinks and no note moves because a
// snapshot was asked for, so no count in round 45's sweep can change.
//
// ⭐⭐ ROUND 48 B3 – THREE THINGS MORE IN THIS FILE (owner, 07.10 – docs/rounds/round-48.md, items 1 and 2), and none of them moves a photograph window:
//   #2  `HEAD_AIR` – the LOOSE LINE keeps 24px to the right of the heading's box. On his save it sat 10px from the last letter of «The tour», in the heading's own band, and
//       read as one run of handwriting; a box that merely does not touch is clear to this resolver and is not clear to a reader.
//   #1a `placeFiller`'s SECOND PASS – layout B's strip is 400px wide, so a snapshot that carries a `pair` hangs the second one beside the first, leaning the other way.
//   #1b/#1c `placeSheet`'s TAIL GATE – a tag or pass the book's tail hung (`tail: true`, `albumBook.ts`'s `hangTail`) is an ask, not a fact of the sheet: it is drawn only where the
//       note and the loose line leave its frame clear, the tag trying a rung smaller first (`TAIL_TAG_RUNGS`), and a page with no room goes without it – exactly the placement it had.
// A 335-sheet sweep holds the guard: windows are at a shrunk rung on A 0 / B 22 / C 29 sheets before and after (`tests/r48-b3-album-tail.test.ts`; B's ceiling of 22 is untouched).
import { SHEET_PX } from '../../shared/protocol'
import type { AlbumFrame, AlbumLayout, AlbumNote, AlbumSheetModel } from '../../shared/protocol'

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
  note: NoteBox | null
  line: Box | null
  /** The photograph windows were drawn at this fraction of the layout's own height (1 = as drawn). */
  scale: number
  /** True when neither the note nor the line touches any caption band. */
  clear: boolean
  /** ⭐ ROUND 47 #14 – the small snapshot hung in the gap the ticket or the tag would have filled, or null (`placeFiller`). */
  filler: FillerPlacement | null
  /** ⭐ ROUND 48 #1b / #1c – WHETHER THE SHEET'S TAG / TICKET IS DRAWN. Always, for one of the sheet's own; for one the book's tail HUNG (`tail`) only where the gap is
   *  clear of the note and the loose line – a page with no room goes without it and its snapshot (if any) takes the gap. `tagScale` is the rung the tag hangs at. */
  tagDrawn: boolean
  ticketDrawn: boolean
  tagScale: number
}

/** What the resolver settles BEFORE the snapshot is asked for – the snapshot never moves any of it. */
type PlacedCore = Omit<SheetPlacement, 'filler' | 'tagDrawn' | 'ticketDrawn' | 'tagScale'>

/** ⭐ ROUND 47 #14 – WHERE A SMALL SNAPSHOT MAY HANG: its card (`w` wide, a `photoH` window, leaning `tilt` degrees) and the spots to try, first free one
 *  wins. `home` is the index in `fixed` of the object whose frame it hangs in (B's pass, C's tag) – every OTHER piece of furniture is an obstacle. Every
 *  spot's swing box lies inside that frame; the sweep holds it. */
export interface FillerDef {
  w: number
  photoH: number
  tilt: number
  home: number
  spots: readonly { x: number; y: number }[]
  /** ⭐ ROUND 48 #1a – the gap is a WIDE strip: a sheet whose snapshot carries a `pair` may hang the second one beside the first, leaning the other way
   *  (`-tilt`), at the first of the same `spots` that touches neither the first nor anything else. Layout B's strip is 400px; C's column is 110 and has none. */
  pair?: boolean
}

/** A placed snapshot: the card as the page draws it, and `box` – the card with the swing of its lean, which is what the obstacles and the sweep are
 *  measured against. */
export interface FillerPlacement {
  x: number
  y: number
  w: number
  photoH: number
  tilt: number
  box: Box
  /** ⭐ ROUND 48 #1a – the second snapshot beside this one, placed only where the strip really had room for two (`FillerDef.pair`); absent otherwise. */
  pair?: FillerPlacement
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

/** ⭐ A LONG NOTE IS DRAWN SMALLER: a text of up to `upTo` characters is drawn at `step` of its size. Two
 *  steps, 0.9 and 0.82 (the 17px hand reads as 15.3px and 13.9px) – the floor is where Caveat still reads on
 *  a phone-sized page, not a measured limit. ⚠ THE WHOLE SCRAP STEPS, NOT ONLY THE LETTERS: it is laid out at
 *  its full 17px in a box 1/step wider and drawn at `step` from its corner (`noteSpot`), so the 26px
 *  ruling, the margins and the wrap are the calibrated ones, in proportion. The first cut stepped the font
 *  alone on the same 26px ruling and measured nothing (B: 45 sheets shrunk -> 44): a note's height comes in
 *  whole rows of 26px and the free strip under B's photographs holds three or four of them. */
export interface NoteStep {
  upTo: number
  step: number
}
export const NOTE_STEPS: readonly NoteStep[] = [
  { upTo: 72, step: 1 },
  { upTo: 100, step: 0.9 },
  { upTo: Infinity, step: 0.82 },
]

/** The characters a note carries – its sentence AND the checklist under it, read as one run.
 *
 *  ⭐ LB-note (owner 10.10, decisions.md №38): THE JOINT LENGTH PICKS THE HAND, AND THE HAND IS THE SMALLER ONE.
 *  The checklist lies under the prose in the SAME scrap, so the scrap has one size and the length that earns it is
 *  both blocks together – a sentence that fits at full size, plus three league rows, is a long note and is written
 *  at the step a long note earns (`NOTE_STEPS`). That is the night recommendation's default for the sub-question
 *  («the lesser hand», not the «+16–44px of prose» variant it named beside it): №38 ruled the layout and this
 *  sub-question rides that default. A note with only one of the two reads exactly as it always did. */
export function noteLength(note: AlbumNote): number {
  return [note.text, note.lines.join(' ')].filter((block) => block.length > 0).join(' ').length
}

/** The hand a note is written in, as a fraction of 17px. */
export function noteStep(note: AlbumNote | null | undefined, steps: readonly NoteStep[] = NOTE_STEPS): number {
  if (!note) return 1
  const len = noteLength(note)
  return (steps.find((s) => len <= s.upTo) ?? steps[steps.length - 1])?.step ?? 1
}

/** ⭐ THE HANDS A NOTE MAY BE WRITTEN IN ON A SHEET: the one its length earned, then every smaller step down
 *  to the floor. The first is what it is written in when the page has room; the others are what the
 *  resolver may spend – at `stepCost` each, far under a rung of photograph window – BEFORE it shrinks any
 *  window, so the windows give way only when even the smallest honest note cannot fit. */
export function noteHands(note: AlbumNote | null | undefined, steps: readonly NoteStep[] = NOTE_STEPS): number[] {
  const base = noteStep(note, steps)
  return [...new Set(steps.map((s) => s.step))].filter((st) => st <= base).sort((a, b) => b - a)
}

/** The resolver's prices, as DATA so a before-arm can be run (round 45 #6b's sweep runs B6's knobs beside
 *  these). Units are pixels walked: a picture's hidden pixel² costs `coverCost`, a rung of shrunk windows
 *  costs `shrinkCost` a percent (a rung is 8%), a wider note costs `widenCost` a step. */
export interface Tuning {
  steps: readonly NoteStep[]
  shrinkCost: number
  widenCost: number
  coverCost: number
  /** One step smaller than the hand the note's length earned (`noteHands`). */
  stepCost: number
  /** Letting a note rest on a polaroid's white BORDER – the frame round the picture, with no picture and no
   *  caption under it. B6 made that impossible (`Infinity`) and shrank windows to get 3px of clearance. */
  borderCost: number
  /** When true a layout's hero picture (`LayoutDef.hero`) is kept clear in every tier but the last. */
  protectHero: boolean
  /** A layout's note slot, replaced – the page never sets it; the sweep runs B6's old C slot beside today's. */
  slots?: Partial<Record<AlbumLayout, NoteSlot>>
  /** ⭐ ROUND 48 #2 – the air the LOOSE LINE keeps to the right of the heading's box (`HEAD_AIR`; absent = that). `0` is the geometry before round 48: the sweep runs it
   *  beside today's so the «before» is measured live and cannot go idle. */
  headAir?: number
}
export const TUNING: Tuning = { steps: NOTE_STEPS, shrinkCost: 40, widenCost: 20, coverCost: 0.02, stepCost: 30, borderCost: 150, protectHero: true }

/** A pasted note is a box that also says the hand it is written in. */
export interface NoteBox extends Box {
  step: number
}

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
 *  do not fit side by side – measured wrapping at 125px and 130px of content), and the ruled text –
 *  the sentence, then the checklist's rows under it, each line wrapped on its own (one `<li>` each).
 *  ⭐ `step` is the size it is drawn at (`noteStep`): the scrap is laid out at its full size in a box
 *  `w / step` wide – so the wrap is the CALIBRATED one, nothing is re-measured – and every pixel of it is
 *  scaled by `step`, rounded UP. */
export function noteHeight(sheet: AlbumSheetModel, w: number, step = 1): number {
  const note = sheet.note
  if (!note) return 0
  const inner = w / step - 2 * NOTE.padSide
  let rows = 0
  if (note.dateLabel || note.ageLabel) {
    const a = note.dateLabel?.length ?? 0
    const b = note.ageLabel?.length ?? 0
    const gap = a > 0 && b > 0 ? NOTE.whenGap : 0
    rows += (a + b) * NOTE.whenFont * HAND_EM + gap <= inner ? 1 : 2
  }
  // ⭐ LB-note: BOTH BLOCKS, the sentence and the checklist under it – the card draws both (`AlbumNoteCard.vue`), so a height that
  // counted only the sentence would reserve a box shorter than the scrap and the list's last rows would hang over whatever lies below it.
  rows += note.text ? wrapLines(note.text, inner, NOTE.font) : 0
  rows += note.lines.reduce((n, l) => n + wrapLines(l, inner, NOTE.font), 0)
  return Math.ceil((NOTE.padTop + NOTE.padBottom + rows * NOTE.rule) * step)
}

interface PhotoSlot {
  x: number
  y: number
  w: number
  photoH: number
  tilt: number
}

/** Where a layout draws its pasted note: the corner it is anchored by, and the widths it may be set in. */
export interface NoteSlot {
  x: number
  y: number
  anchor: 'top' | 'bottom'
  widths: readonly number[]
  right?: boolean
}

interface LayoutDef {
  photos: readonly PhotoSlot[]
  /** Note widths, as drawn first and then wider – a wider note is a shorter one. `right` pins the
   *  note's right edge to the page edge (layout A's note runs to it). */
  note: NoteSlot
  /** The loose line as drawn (`w`) and the other widths it may be set in – narrower is taller, wider is shorter. */
  line: { x: number; y: number; w: number; alt?: readonly number[]; font: number; lh: number }
  /** The photograph whose PICTURE a note or a line must not cover (layout C's hero – «the one picture that
   *  earned the whole page»), as an index into `photos`. */
  hero?: number
  /** ⭐ ROUND 47 #14 – where a small snapshot may hang when the object that lives in this layout's gap is not drawn (`placeFiller`). */
  filler?: FillerDef
  /** ⭐ ROUND 48 #2 – the index in `fixed` of the chapter heading, for the layouts that draw one (A and C – B opens nothing): the box whose right-hand side the loose
   *  line keeps `HEAD_AIR` clear of. */
  head?: number
  fixed(sheet: AlbumSheetModel): Box[]
}

/** ⭐⭐ ROUND 47 #9 – THE TITLE BLOCK, ONE STEP SMALLER AND MEASURED. `AlbumSheetTitle.vue` sets it at 17 / 38 / 19px (was 19 / 44 / 21) with 3 and 6px
 *  between the lines, all three at `line-height: 1`: 17 + 3 + 38 + 6 + 19 = 83px tall (it was 96). The block grows with the chapter's name – `HEAD_CHAR`
 *  is 14.7px a character at 38px, which is the 17px a character the 44px name measured in Chromium (270.2px for «The breakthrough», 16 letters) scaled by
 *  38/44 and rounded UP: the estimate may over-count a few pixels and never under-count, and `tests/r47-b3-album-headings.test.ts` holds all five
 *  names against Chromium's own widths. */
export const HEAD_H = 83
const HEAD_CHAR = 14.7

/** ⭐⭐ ROUND 48 #2 – THE AIR A LOOSE LINE KEEPS TO THE RIGHT OF THE HEADING (owner, 07.10: «оверлап текста и заголовка на одной из страниц всё еще есть … The Tour /
 *  Straight back to the planning – надо отодвинуть последний дальше вправо»). REPRODUCED IN REAL CHROMIUM on his own save (`adult-1`, layout A): the heading «The tour»
 *  is 111.8px of Caveat in a 120px box (`headBox`'s floor) and the loose line – the `season-recovery` occasion's, quiet voice; a corpus sentence, read and never retyped – was placed by the resolver at x 156 – exactly `GAP`
 *  past that box, 10px past the last letter – in the SAME BAND (y 37..90 against the heading's 26..109), so the two read as ONE run of handwriting. The model called it
 *  clear because a box that merely does not TOUCH is clear to a resolver; to a reader two bare lines of the same hand 10px apart are not.
 *  ⚠ IT IS THE LOOSE LINE'S AND NOT THE NOTE'S: the line is bare handwriting like the heading, the note is a paper card with an edge of its own, and the sweep never
 *  puts a note closer than 10px of BOX (26.6px of real text) to any heading – the 54 placements within 3px of a heading box are all loose lines. So the air is a strip
 *  `HEAD_AIR` wide on the heading's right that only the line must clear (`settle`'s `lineAir`), and only in the tiers where the heading itself is avoided.
 *  ⭐ 24 IS MEASURED AGAINST THE NOTE: the nearest a note sits to a heading is 26.6px of real text (the breakthrough chapter's 233.4px name against a note at x 294); the
 *  line now keeps `HEAD_AIR + GAP` plus the box's own slack (2.6px at the tightest title, 8.2px at «The tour») – at least 28.6px, so no bare line sits nearer to a heading
 *  than a pasted note ever does. `tests/r48-b3-album-tail.test.ts` runs the sweep with it and with 0, the before-arm. */
export const HEAD_AIR = 24
function headBox(x: number, sheet: AlbumSheetModel): Box {
  return { x, y: 26, w: Math.max(120, Math.ceil(sheet.chapterTitle.length * HEAD_CHAR)), h: HEAD_H }
}

/** ⭐⭐ ROUND 47 #9 – WHERE LAYOUT C HANGS ITS HERO: `HERO_GAP` UNDER THE HEADING'S BOX. It hung at y 100, which is 22px INTO the old 96px block and on top
 *  of the years line on every one of the 121 C sheets measured. The window's bottom edge stays where round 45 tuned everything under it (y 300 – the
 *  note's strip, the second photograph, the guard counts), so the pixels the hero gave up at the top come off its window, not off the page. */
const HERO_GAP = 5
const C_HERO_Y = 26 + HEAD_H + HERO_GAP
const C_HERO_BOTTOM = 300

/** ⭐⭐ ROUND 47 #8 – THE BOARDING PASS IS ONE HEIGHT, AND THE FRAME IS THE FLOOR UNDER WHAT IS ABOVE IT. Bottom-anchored
 *  at 34px (was 48), `PASS_H` tall (`min-height` in `AlbumLayoutB.vue` – the page and this table are mirrors, held by
 *  `tests/component/round46-album-pass-tilt.test.ts`), drawn at 0.9 and turned 5° clockwise ABOUT ITS TOP-LEFT
 *  CORNER: the turn only moves the rest of it DOWN and nothing of it rises above this box's top edge, which is
 *  where the strip the loose line is drawn in ends. (Round 46 turned it about the centre and the left end lifted
 *  17px into that strip, a lift the resolver was never taught – its options, measured, are in the round-46 ledger.)
 *
 *  ⚠ THE HEIGHT WAS A TABLE, 97 FOR THE TWO LOWER STEPS AND 121 FOR THE TWO UPPER, AND THE TABLE WAS STALE. Measured
 *  in Chromium over all sixteen rungs x six stages with the widest row and seat, the pass was 115, 121 or 134px:
 *  the Row/Seat line broke in two on EVERY one, a long stage broke in the stub, a long title broke. On the lower
 *  steps the real pass stood 18 to 37px above this frame before it was turned. Row/Seat are one line now, the stage
 *  is printed once, and the pass is held to one height, 121px (the tallest natural one, measured 120.64). It hangs as LOW
 *  as the page's 15px margin allows its lowest corner – the right end, 31px under the top-left and 108px of drawn height
 *  below that – which puts the frame's top at 315: 10px higher than the old frame on the two lower steps (325) and 14px
 *  LOWER than on the two upper (301). The round-45 sweep numbers over the 335 sheets are in the round-47 ledger. */
const PASS_H = 121
function passBox(sheet: AlbumSheetModel): Box {
  // ⚠ A SHEET WITHOUT A TICKET DRAWS NO PASS (`v-if="sheet.ticket"` in `AlbumLayoutB.vue`) AND KEEPS THE BOTTOM EDGE ROUND
  // 45 TUNED THE RESOLVER AGAINST – 97px under the old 48px anchor. Reserving the new frame there would shrink windows
  // for a pass nobody draws (measured: B at a shrunk rung on 25 of 67 sheets, where the guard allows 22).
  if (!sheet.ticket) return { x: 22, y: PAGE - 48 - 97, w: 400, h: 97 }
  return { x: 22, y: PAGE - 34 - PASS_H, w: 400, h: PASS_H }
}

/** ⭐ ROUND 47 #14 – THE TWO PLACES A SMALL SNAPSHOT HANGS (`placeFiller`). Each spot is inside the frame the missing object leaves: B's strip under the
 *  photographs, where the boarding pass would hang (`passBox` keeps it reserved on a ticketless sheet), and C's right-hand column, where the baggage tag
 *  would hang (its box is in `fixed`). B's spots run RIGHT TO LEFT – the loose line and the note are on the left – and C's run down the column from beside
 *  the hero's middle. Every spot's swing box lies inside its frame; the test holds it. */
const B_FILLER: FillerDef = { w: 128, photoH: 72, tilt: 2.4, home: 0, spots: [288, 240, 192, 144, 96, 48].map((x) => ({ x, y: 330 })), pair: true }
const C_FILLER: FillerDef = { w: 100, photoH: 68, tilt: -2.6, home: 1, spots: [168, 126, 210, 252, 92].map((y) => ({ x: 332, y })) }

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
    line: { x: 120, y: 422, w: 200, alt: [150, 110], font: 21, lh: 26.25 },
    head: 0,
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
    line: { x: 26, y: 250, w: 132, alt: [200, 270], font: 20, lh: 26 },
    filler: B_FILLER,
    fixed: (s) => [passBox(s), { x: 131, y: 268, w: 24, h: 24 }],
  },
  C: {
    photos: [
      { x: 26, y: C_HERO_Y, w: 276, photoH: C_HERO_BOTTOM - POLAROID.top - C_HERO_Y, tilt: -0.8 },
      { x: 204, y: 332, w: 138, photoH: 100, tilt: 1.8 },
    ],
    // ⭐ ROUND 45 #6b: the only paper that is free in C is the strip UNDER the hero and LEFT of the second
    // photograph (x 12..198, about 120px tall at the hero's drawn height), so the slot is as WIDE as that
    // strip and sits at the page's lower margin – 156/220/290 offered widths the strip never had, and a
    // narrower, taller note (the first guess) is exactly the shape that does not fit a wide, short strip.
    note: { x: 12, y: 462, anchor: 'bottom', widths: [150, 186] },
    hero: 0,
    line: { x: 388, y: 368, w: 74, alt: [110], font: 19, lh: 23.75 },
    filler: C_FILLER,
    head: 0,
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
function freeSpots(
  m: Box,
  obstacles: readonly Box[],
  soft: readonly Box[],
  coverCost: number,
  limit: number,
): { box: Box; cost: number }[] {
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
      spots.push({ x, y, cost: Math.abs(x - m.x) + Math.abs(y - m.y) + coverCost * cover, rank })
    }
  }
  spots.sort((p, q) => p.cost - q.cost || p.rank - q.rank || p.x - q.x || p.y - q.y)
  const out: { box: Box; cost: number }[] = []
  for (const s of spots) {
    const at = { x: s.x, y: s.y, w: m.w, h: m.h }
    if (obstacles.some((o) => touches(at, o))) continue
    out.push({ box: at, cost: s.cost })
    if (out.length >= limit) break
  }
  return out
}

function freeSpot(m: Box, obstacles: readonly Box[], soft: readonly Box[] = [], coverCost = TUNING.coverCost): { box: Box; cost: number } | null {
  return freeSpots(m, obstacles, soft, coverCost, 1)[0] ?? null
}

/** How many of the note's nearest free spots are tried before the loose line gives up: the nearest one can be
 *  the very spot the line needed, and a window shrinks to make room for a line the note could have left room for. */
const NOTE_SPOTS = 6

function noteDrawnAt(def: LayoutDef, sheet: AlbumSheetModel, w: number, step = 1): Box {
  const h = noteHeight(sheet, w, step)
  const { x, y, anchor, right } = def.note
  return { x: right ? x - w : x, y: anchor === 'bottom' ? y - h : y, w, h }
}

function lineDrawnAt(def: LayoutDef, sheet: AlbumSheetModel, w = def.line.w): Box | null {
  if (!sheet.line) return null
  const { x, y, font, lh } = def.line
  return { x, y, w, h: wrapLines(sheet.line, w, font) * lh }
}

/** Both movers against one obstacle set, the note first and the line avoiding it. Null when either
 *  has no free spot. */
function settle(
  def: LayoutDef,
  sheet: AlbumSheetModel,
  obstacles: readonly Box[],
  noteW: number,
  step: number,
  soft: readonly Box[],
  tuning: Tuning,
  /** ⭐ ROUND 48 #2 – extra obstacles for the LOOSE LINE alone: the air to the right of the heading (`headAirOf`). */
  lineAir: readonly Box[] = [],
): { note: NoteBox | null; line: Box | null; cost: number } | null {
  const noteAt = sheet.note ? noteDrawnAt(def, sheet, noteW, step) : null
  const notes = noteAt ? freeSpots(noteAt, obstacles, soft, tuning.coverCost, NOTE_SPOTS) : [null]
  const widths = [def.line.w, ...(def.line.alt ?? [])]
  let best: { note: NoteBox | null; line: Box | null; cost: number } | null = null
  for (const n of notes) {
    if (best && (n?.cost ?? 0) >= best.cost) break
    // the loose line is set at the width that costs least: its drawn one, or a narrower/wider one at `widenCost`
    let l: { box: Box; cost: number } | null = null
    if (sheet.line) {
      for (let li = 0; li < widths.length; li++) {
        const at = lineDrawnAt(def, sheet, widths[li] as number)
        const f = at ? freeSpot(at, n ? [...obstacles, ...lineAir, n.box] : [...obstacles, ...lineAir], soft, tuning.coverCost) : null
        if (f && (!l || f.cost + tuning.widenCost * li < l.cost)) l = { box: f.box, cost: f.cost + tuning.widenCost * li }
      }
      if (!l) continue
    }
    const cost = (n?.cost ?? 0) + (l?.cost ?? 0)
    if (!best || cost < best.cost) best = { note: n ? { ...n.box, step } : null, line: l?.box ?? null, cost }
  }
  return best
}

/** ⭐ ROUND 48 #2 – THE AIR STRIP: `air` px wide, as tall as the heading's box, on its right-hand side – or none, for a layout with no heading (B) or an air of 0. */
function headAirOf(def: LayoutDef, sheet: AlbumSheetModel, air: number): Box[] {
  if (def.head === undefined || air <= 0) return []
  const head = def.fixed(sheet)[def.head]
  return head ? [{ x: head.x + head.w, y: head.y, w: air, h: head.h }] : []
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

/** ⭐ THE RESOLVER. A sheet in, the positions out. See the header for the rule. `tuning` is the prices and
 *  the hand's steps: the page always passes the default, the sweep passes B6's beside it to measure «before». */
export function placeSheet(sheet: AlbumSheetModel, tuning: Tuning = TUNING): SheetPlacement {
  // ⭐⭐ ROUND 48 #1b / #1c – THE TAIL'S TAG AND TICKET ARE ASKS, NOT GIVENS. The sheet is resolved WITH the object in its frame (that is the geometry the page will
  // draw); if the note or the loose line ended up on that frame the object is not drawn – the tag first tries a rung smaller (`TAIL_TAG_RUNGS`: a page too full for a
  // tag at 110px has room for one at 88) – and the sheet is resolved again WITHOUT it, which is exactly the placement it had before the tail was asked for. A tag or a
  // ticket of the sheet's own never goes through this: it is a fact of the sheet and is always drawn (that is the old behaviour, untouched).
  let seen = sheet
  let core = resolveSheet(seen, tuning)
  let tagScale = 1
  if (sheet.tag?.tail) {
    const rung = TAIL_TAG_RUNGS.find((r) => !crowds(core, tailTagBox(r)))
    if (rung === undefined) seen = { ...seen, tag: null }
    else tagScale = rung
  }
  if (sheet.ticket?.tail && crowds(core, passBox(sheet))) {
    seen = { ...seen, ticket: null }
    core = resolveSheet(seen, tuning)
  }
  return { ...core, filler: placeFiller(seen, core), tagDrawn: seen.tag != null, ticketDrawn: seen.ticket != null, tagScale }
}

/** ⭐ ROUND 48 #1b – THE TAIL TAG'S FOOTPRINT: layout C's column, as tall as «World Tour 1000» really draws it – MEASURED in real Chromium on his own save's last page
 *  (07.10): the tier's name wraps to THREE lines at 26px in the tag's 90px of ink, so the element is 284.1px tall (y 77..361.1) where `LAYOUTS.C`'s frame says 271. The
 *  frame is what the resolver reserves for every tag and is not touched; this is what a tag the TAIL hangs is checked against. The rungs shrink it about its top
 *  edge's middle (`transform-origin: 50% 0` – it hangs from its string) and never below 0.8, where the tier's name is still 20px. */
const TAIL_TAG: Box = { x: 327, y: 77, w: 110, h: 285 }
export const TAIL_TAG_RUNGS: readonly number[] = [1, 0.9, 0.8]
export function tailTagBox(scale: number): Box {
  return { x: TAIL_TAG.x + (TAIL_TAG.w * (1 - scale)) / 2, y: TAIL_TAG.y, w: TAIL_TAG.w * scale, h: TAIL_TAG.h * scale }
}

/** True when the resolved note or loose line touches `box`. */
function crowds(core: PlacedCore, box: Box): boolean {
  return [core.note, core.line].some((m) => m && touches(m, box))
}

function resolveSheet(sheet: AlbumSheetModel, tuning: Tuning): PlacedCore {
  const slot = tuning.slots?.[sheet.layout]
  const def = slot ? { ...LAYOUTS[sheet.layout], note: slot } : LAYOUTS[sheet.layout]
  const hands = noteHands(sheet.note, tuning.steps)
  // 1. THE KINDEST ARRANGEMENT FIRST, and each tier gives up one more thing than the one before it: bare
  //    paper (the note and the line touch no photograph at all) -> captions and every piece of furniture
  //    kept clear -> a sticker (a doodle) may be covered -> only the captions are kept. Inside a tier the
  //    photograph windows are tried at the widest rung that allows it and the note at its drawn width
  //    before a wider one – a smaller photograph is a smaller price than a note over somebody's face.
  //    ⭐ #6b: a layout's HERO picture is kept clear through the fourth tier too, and the fifth (captions
  //    only) is the one place a note may cover it – the windows give way, and the furniture, before it does.
  const furniture = def.fixed(sheet)
  const solid = furniture.filter((x) => !isSticker(x))
  const hero = tuning.protectHero && def.hero !== undefined ? def.hero : null
  const kept = (photos: PhotoPlacement[]): Box[] => {
    const h = hero === null ? undefined : photos[hero]
    return h ? [pictureOf(h)] : []
  }
  type Tier = (k: { photos: PhotoPlacement[]; bands: Box[] }) => Box[]
  // ⭐ ROUND 48 #2 – `air`: the tiers that avoid the heading (all furniture, or every piece but a sticker) also keep the loose line `HEAD_AIR` off its right side; the two
  // give-up tiers that ignore furniture ignore the air with it.
  const headAir = headAirOf(def, sheet, tuning.headAir ?? HEAD_AIR)
  // The first tier is two kinds of bare paper priced against each other: clear of every CARD, and – at
  // `borderCost` – clear of every PICTURE and caption but resting on a white border.
  const bare: { tier: Tier; price: number; air: boolean }[] = [
    { tier: ({ photos, bands }) => [...bands, ...photos.map((p) => padded(p.box)), ...furniture], price: 0, air: true },
    { tier: ({ photos, bands }) => [...bands, ...photos.map((p) => padded(pictureOf(p))), ...furniture], price: tuning.borderCost, air: true },
  ]
  const tiers: { tier: Tier; air: boolean }[] = [
    { tier: ({ photos, bands }) => [...bands, ...furniture, ...kept(photos)], air: true },
    { tier: ({ photos, bands }) => [...bands, ...solid, ...kept(photos)], air: true },
    { tier: ({ photos, bands }) => [...bands, ...kept(photos)], air: false },
  ]
  if (hero !== null) tiers.push({ tier: ({ bands }) => bands, air: false })
  // Within a tier EVERY rung is tried and the cheapest wins – pixels walked, plus a price for each picture
  // covered, plus a price for each step the photographs were shrunk and for a wider note – because the first
  // rung that merely has room is not the best one: at full size a long note's only spot can be on top of
  // the big photograph, while one rung down it fits below it.
  for (const group of [bare, ...tiers.map((t) => [{ ...t, price: 0 }])]) {
    let best: { score: number; out: PlacedCore } | null = null
    for (const { tier, price, air } of group) {
      if (!Number.isFinite(price)) continue
      for (const scale of SCALES) {
        const photos = photosOf(def, sheet, scale)
        const bands = photos.flatMap((p) => (p.band ? [p.band] : []))
        const soft = photos.map(pictureOf)
        for (let hi = 0; hi < hands.length; hi++) {
          for (let wi = 0; wi < def.note.widths.length; wi++) {
            const got = settle(def, sheet, tier({ photos, bands }), def.note.widths[wi] as number, hands[hi] as number, soft, tuning, air ? headAir : [])
            if (!got) continue
            const score = got.cost + price + tuning.shrinkCost * Math.round((1 - scale) * 100) + tuning.widenCost * wi + tuning.stepCost * hi
            if (!best || score < best.score) best = { score, out: { photos, note: got.note, line: got.line, scale, clear: true } }
          }
        }
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
  const step = hands[hands.length - 1] as number
  const drawn = sheet.note ? noteDrawnAt(def, sheet, w, step) : null
  let note: NoteBox | null = null
  if (drawn) {
    const above = bands.filter((b) => b.x < drawn.x + drawn.w && drawn.x < b.x + b.w)
    const floor = above.reduce((y, b) => Math.max(y, Math.ceil(b.y + b.h + GAP)), 0)
    note = { ...drawn, y: Math.min(Math.max(drawn.y, floor), PAGE - drawn.h), step }
  }
  const lineAt = lineDrawnAt(def, sheet)
  const line = lineAt ? (freeSpot(lineAt, bands)?.box ?? lineAt) : null
  const clear = ![note, line].some((m) => m && bands.some((b) => touches(m, b)))
  return { photos, note, line, scale, clear }
}

/** ⭐⭐ ROUND 47 #14 – THE SMALL SNAPSHOT IN THE GAP. See the header. It is a POST-PASS ON PURPOSE: it reads what `resolveSheet` settled and moves none
 *  of it, so asking for a snapshot cannot cost a photograph window a rung or a note a spot. It yields (null) on a sheet whose ticket or tag IS drawn (the
 *  gap is not a gap), on a layout with no slot, and when no listed spot clears every card, caption band, note, loose line and piece of furniture. */
function placeFiller(sheet: AlbumSheetModel, core: PlacedCore): FillerPlacement | null {
  const def = LAYOUTS[sheet.layout]
  const f = def.filler
  if (!sheet.filler || !f) return null
  if (sheet.layout === 'B' ? sheet.ticket : sheet.tag) return null
  const h = POLAROID.top + f.photoH + POLAROID.bottom
  const pad = Math.ceil((Math.max(f.w, h) / 2) * Math.sin((Math.abs(f.tilt) * Math.PI) / 180)) + 1
  const furniture = def.fixed(sheet).filter((_, i) => i !== f.home)
  const placed = [core.note, core.line].flatMap((m) => (m ? [m] : []))
  const obstacles = [...core.photos.flatMap((p) => [padded(p.box), ...(p.band ? [p.band] : [])]), ...furniture, ...placed]
  /** The first of `f.spots` whose swing box lies on the page and touches no obstacle (and nothing in `extra`). */
  const fit = (tilt: number, extra: readonly Box[]): FillerPlacement | null => {
    for (const s of f.spots) {
      const box: Box = { x: s.x - pad, y: s.y - pad, w: f.w + 2 * pad, h: h + 2 * pad }
      if (box.x < 0 || box.y < 0 || box.x + box.w > PAGE || box.y + box.h > PAGE) continue
      if (obstacles.some((o) => touches(box, o)) || extra.some((o) => touches(box, o))) continue
      return { x: s.x, y: s.y, w: f.w, photoH: f.photoH, tilt, box }
    }
    return null
  }
  const first = fit(f.tilt, [])
  if (!first || !f.pair || !sheet.filler.pair) return first
  // ⭐ ROUND 48 #1a – THE SECOND SNAPSHOT, BESIDE THE FIRST. Placed AFTER it, against the same obstacles plus the first one's swing box, and leaning the OTHER way –
  // so it moves nothing the first settled, and a strip with no room for two simply shows one. The mirrored lean has the same magnitude, so the same swing pad holds.
  const second = fit(-f.tilt, [first.box])
  return second ? { ...first, pair: second } : first
}

/** The picture window of a card – what a note over a photograph hides. */
function pictureOf(p: PhotoPlacement): Box {
  return { x: p.x, y: p.y + POLAROID.top, w: p.w, h: p.photoH }
}

function overlapArea(a: Box, b: Box): number {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
}

// THE PRICES ARE `TUNING`'s (above). `coverCost` 0.02: a note that must cover a 20,000px² picture would
// rather walk 400px, so it walks to bare paper whenever bare paper is anywhere near. `shrinkCost` was 15 a
// percent in B6 and is 40 since #6b – a rung is 8%, so a rung is 320 of walking now, and a note walks
// (or widens) before the windows give way.

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

/** The inline style that puts a pasted note where the resolver said – and, when it is drawn smaller, as a
 *  scrap laid out at full size in a box `1/step` wider and scaled by `step` from its top-left corner, which is
 *  where the resolver put it. */
export function noteSpot(b: NoteBox): Record<string, string> {
  if (b.step === 1) return spot(b)
  // ⭐ ROUND 47 B3 – ROUNDED DOWN, NEVER UP: the page must not draw a note wider than the resolver reserved. Rounding to the nearest hundredth drew a note
  // 186 reserved as 186.0006 wide, and the mounted sweep (`tests/component/round45-album-placement.test.ts`) read that as touching a caption band the resolver
  // had left exactly `GAP` of air from. Invisible – a ten-thousandth of a pixel – and still the page contradicting its own reservation.
  return { left: px(b.x), top: px(b.y), width: px(Math.floor((b.w / b.step) * 100) / 100), transform: `scale(${b.step})`, transformOrigin: '0 0' }
}

/** The inline style that puts a box where the resolver said. */
export function spot(b: { x: number; y: number; w?: number }): Record<string, string> {
  return b.w === undefined ? { left: px(b.x), top: px(b.y) } : { left: px(b.x), top: px(b.y), width: px(b.w) }
}
