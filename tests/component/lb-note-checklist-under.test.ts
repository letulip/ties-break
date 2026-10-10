// LB-NOTE · THE CHECKLIST LIES UNDER THE PROSE – THE MOUNTED HALF (owner 10.10, decisions.md №38).
//
// WHAT THE OWNER RULED: the graduate's championship rows and the heirloom's cabinet are drawn UNDER the note's sentence, in the same scrap. Until then `AlbumNoteCard.vue` drew the list only when the note
// had NO prose (`v-else-if`), `noteOf` never leaves the prose empty, and the lines were on the wire and on no screen (`i18n-l3-6-album-display.test.ts` named it). The engine half – the sheet that carries
// the checklist is layout A, inside the owner's 20.09 laws – is `tests/lb-note-layout-pin.test.ts`. THIS FILE holds what only a mount can: the card, the resolver's reading of a two-block note, and the
// 375x667 phone.
//
// ⚠ NO BOX IS MEASURED HERE AND NONE IS FAKED. happy-dom lays nothing out (`fits.ts` says so at length), so a «bounding rect» below is built the way `round45-album-placement.test.ts` builds its caption
// bands: from the numbers the page was TOLD (the inline `left / top / width / scale` each layout binds) and from the rows of the text the page DREW (`wrapLines` over the rendered nodes, not over the
// model), and then compared with what the resolver reserved. The prose-above-list order itself is a fact of the CASCADE, so it is read off `getComputedStyle` (`css: true`), where a float, an absolute
// position or a flex row would show.
//
// ⚠ THE PHONE: `setViewport(PHONE)` RUNS BEFORE EVERY MOUNT – happy-dom caches a media query on an element's first computed-style read, so a late call measures the desktop column and the arm cannot redden.
//
// ⚠ THE SHEETS UNDER THE PHONE ARM ARE CHOSEN BY THE BEFORE-ARM: books the rotation ALONE (`planBook(…, false)`) would have laid on B and on C, found by search over the posed graduates, so the collision arm
// has something to fail on – on B the resolved note touched the pass on every sheet that drew one (292 of 292) and on C the tag (56 of 56), measured on 768 books when the pin went in.
//
// MUTATION LEDGER (each arm applied, RUN, the red pasted into the wave's report, restored byte-exact – 10.10; counts are of this file's 59 cases):
//   M1  `planBook` pins nothing                                  -> 14 red: 8 × "a checklist sheet is drawn on A: expected 'B' / 'C' to be 'A'" (5 B, 3 C) and 6 × "the note at 167,212 299.997x168 lies on drawn
//                                                                   furniture" – the boarding pass's box {x 22, y 315, w 400, h 121} four times and the tag's {x 327, y 77, w 110, h 271} twice. ⚠ THE FIRST CUT OF THIS
//                                                                   ARM WENT QUIET INSTEAD OF RED: it chose its sheets by what the book did (skip every sheet left off A), so with the pin gone it chose NOTHING. It
//                                                                   chooses from the before-arm and the shape now, and the first mutation run is what showed it.
//   M2  `AlbumNoteCard.vue` back to text-wins (`v-else-if`)      -> 28 red: the card's «both blocks are drawn», and on every one of the 13 mounted sheets «both blocks are drawn» and «the box covers the rows»
//   M3  `noteHeight` back to the sentence alone                  -> 14 red: "the scrap needs 274px (1 date + 4 sentence + 7 list rows at the 0.82 hand); the resolver reserved 125" and its kin, one per checklist sheet
//   M4  `.album-note-list` floated beside the sentence           -> 14 red: the card's «under, in flow» (listFloat 'right') and the same facts again on each mounted sheet. ⚠ THE FIRST CUT STAYED GREEN – it read `cssFloat`,
//                                                                   which happy-dom leaves empty while `getPropertyValue('float')` answers; the mutation is what showed it.
//   M5  `noteLength` back to text-wins                           -> 9 red: «the two blocks read as one run: expected 60 to be 102» and the floor hand not reached («expected 0.82 to be 0.9 / 1») on every sheet
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠⚠ THE APP'S OWN SHEET, BECAUSE `.dialog-overlay` AND `.dialog-card` LIVE IN IT (album-mobile.test.ts's note, unchanged): the Chapters card's dismiss is read off the real cascade.
import '../../src/style.css'
import AlbumNoteCard from '../../src/components/album/AlbumNoteCard.vue'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { LAYOUTS, NOTE, noteHeight, noteLength, noteStep, placeSheet, touches, wrapLines, type Box } from '../../src/components/album/albumPlacement'
import { assembleAlbum } from '../../src/engine/world'
import { planBook } from '../../src/engine/world/albumBook'
import { SHEET_PX, type AlbumBook, type AlbumNote, type AlbumSheetModel } from '../../src/shared/protocol'
import { PHONE, assertDismissReachable, setViewport } from './fits'
import { captionOf, dynastyOf, graduateOf, readChapters, seatOf } from '../helpers/lb-note-books'

const hasLines = (s: AlbumSheetModel): boolean => (s.note?.lines.length ?? 0) > 0
const checklistSheet = (book: AlbumBook): AlbumSheetModel => book.sheets.find(hasLines)!

// ===============================================================================================
// 1. THE CARD – the sentence, then the list under it, in one flow
// ===============================================================================================

/** A real note carrying both blocks: the posed graduate's own (the corpus's sentence for her voice, three league rows under it). */
const realNote = (): AlbumNote => checklistSheet(assembleAlbum(graduateOf(3, 22))).note!

/** What the cascade says about where a block sits: the facts that would show a list BESIDE a sentence or lifted out of the flow. */
function flowFacts(card: ReturnType<typeof mount>): { order: boolean; textPos: string; listPos: string; listFloat: string; listDisplay: string; parentDisplay: string; listMarginTop: string; listPaddingTop: string; rowHeight: string } {
  const text = card.find('.album-note-text').element
  const list = card.find('.album-note-list').element
  const parent = list.parentElement!
  const lcs = getComputedStyle(list)
  return {
    order: Boolean(text.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) && text.parentElement === parent,
    textPos: getComputedStyle(text).position,
    listPos: lcs.position,
    // ⚠ `getPropertyValue`, NOT `cssFloat`: happy-dom answers the float on the first and an empty string on the second (probed 10.10, with the mutation in)
    listFloat: lcs.getPropertyValue('float'),
    listDisplay: lcs.display,
    parentDisplay: getComputedStyle(parent).display,
    listMarginTop: lcs.marginTop,
    listPaddingTop: lcs.paddingTop,
    rowHeight: getComputedStyle(list.querySelector('li')!).lineHeight,
  }
}

describe('LB-note · the card draws the sentence and the checklist under it', () => {
  it('⭐ both blocks are drawn – the sentence, then every row of the list – where the card used to draw the sentence alone', () => {
    const note = realNote()
    expect(note.text.length, 'the real note has a sentence').toBeGreaterThan(0)
    expect(note.lines.length, 'and a checklist').toBeGreaterThan(0)
    const w = mount(AlbumNoteCard, { props: { note } })
    expect(w.find('.album-note-text').text(), 'the sentence').toBe(note.text)
    expect(w.findAll('.album-note-list li').map((li) => li.text()), 'every row of the list, in order').toEqual([...note.lines])
    w.unmount()
  })

  it('⭐ UNDER, IN FLOW: the list follows the sentence in the same box – not floated, not lifted out of the flow, not a flex row – with no gap of its own (the rows stay on the 26px ruling)', () => {
    const w = mount(AlbumNoteCard, { props: { note: realNote() }, attachTo: document.body })
    const f = flowFacts(w)
    expect(f.order, 'the list comes after the sentence, inside the same parent').toBe(true)
    expect(f.textPos, 'the sentence is in the flow').not.toMatch(/absolute|fixed/)
    expect(f.listPos, 'the list is in the flow').not.toMatch(/absolute|fixed/)
    expect(f.listFloat, 'the list is not floated beside the sentence').not.toMatch(/left|right/)
    expect(f.listDisplay, 'the list is a block').not.toMatch(/inline|flex|grid|none/)
    expect(f.parentDisplay, 'the scrap lays its blocks one under another, never in a row').not.toMatch(/flex|grid/)
    expect(f.listMarginTop, 'no space between the blocks: a gap would knock every following row off the ruling').toMatch(/^0(px)?$/)
    expect(f.listPaddingTop).toMatch(/^0(px)?$/)
    expect(f.rowHeight, 'and each row of the list is one ruled line tall, the ruling the sentence sits on').toBe('26px')
    w.unmount()
  })

  it('either block may stand alone – a sentence with no facts draws no list, facts with no sentence draw no sentence', () => {
    const note = realNote()
    const prose = mount(AlbumNoteCard, { props: { note: { ...note, lines: [] } } })
    expect(prose.find('.album-note-text').exists()).toBe(true)
    expect(prose.find('.album-note-list').exists(), 'no facts, no list').toBe(false)
    prose.unmount()
    const facts = mount(AlbumNoteCard, { props: { note: { ...note, text: '' } } })
    expect(facts.find('.album-note-text').exists(), 'no sentence, none drawn').toBe(false)
    expect(facts.findAll('.album-note-list li')).toHaveLength(note.lines.length)
    facts.unmount()
  })
})

// ===============================================================================================
// 2. THE RESOLVER READS BOTH BLOCKS – the hand and the height
// ===============================================================================================

describe('LB-note · the resolver reads a two-block note', () => {
  it('⭐ the JOINT length picks the hand, and the hand is the smaller one: a sentence that fits at full size and a list under it are written at the step a long note earns', () => {
    // data for the geometry, not copy: 60 characters of sentence (full size) and 41 of list read as one run of 102 -> the floor
    const sentence = 'x'.repeat(60)
    const list = ['y'.repeat(20), 'z'.repeat(20)]
    const note: AlbumNote = { text: sentence, dateLabel: null, ageLabel: null, lines: list }
    expect(noteStep({ ...note, lines: [] }), 'the sentence alone is a short note').toBe(1)
    expect(noteStep({ ...note, text: '' }), 'the list alone is a short note').toBe(1)
    expect(noteLength(note), 'the two blocks read as one run, a space between').toBe(60 + 1 + 41)
    expect(noteStep(note), 'together they are a long one').toBe(0.82)
    // and on the real thing: the prose of every posed voice alone is full size, the graduate with her rows under it is not
    for (const voice of ['sunny', 'fiery', 'quiet', 'deep'] as const) {
      const world = graduateOf(3, 22)
      world.temperament = voice
      const real = checklistSheet(assembleAlbum(world)).note!
      expect(noteStep(real), `${voice}: the joint hand is never larger than the sentence's own`).toBeLessThanOrEqual(noteStep({ ...real, lines: [] }))
      expect(noteStep(real), `${voice}: and here it is the floor`).toBe(0.82)
    }
  })

  it('⭐ the height counts the sentence AND the list: a note that carries both reserves more than the sentence alone, by exactly the rows of the list', () => {
    const sheet = checklistSheet(assembleAlbum(graduateOf(3, 22)))
    const prose = { ...sheet, note: { ...sheet.note!, lines: [] } } as AlbumSheetModel
    const w = 176
    const inner = w / 0.82 - 2 * NOTE.padSide
    const listRows = sheet.note!.lines.reduce((n, l) => n + wrapLines(l, inner, NOTE.font), 0)
    expect(listRows, 'the list is not empty').toBeGreaterThan(0)
    expect(noteHeight(sheet, w, 0.82) - noteHeight(prose, w, 0.82), 'the extra height is the list\'s rows on the 26px ruling, drawn at the hand').toBe(
      Math.ceil((NOTE.padTop + NOTE.padBottom + (wrapLines(sheet.note!.text, inner, NOTE.font) + listRows + 1) * NOTE.rule) * 0.82) -
        Math.ceil((NOTE.padTop + NOTE.padBottom + (wrapLines(sheet.note!.text, inner, NOTE.font) + 1) * NOTE.rule) * 0.82),
    )
  })
})

// ===============================================================================================
// 3. AT 375x667 – the checklist sheet on a phone
// ===============================================================================================

const num = (v: string): number => Number.parseFloat(v)

/** What the page drew for a sheet's note, from the rendered nodes alone: where the scrap stands and the rows its two blocks wrote. */
function drawnNote(w: ReturnType<typeof mount>, layout: string): { x: number; y: number; step: number; width: number; when: number; prose: number; list: number; need: number } {
  const el = w.find(`.album-${layout.toLowerCase()}-note`).element as HTMLElement
  const step = Number(/scale\(([\d.]+)\)/.exec(el.style.transform)?.[1] ?? 1)
  const laidOut = num(el.style.width)
  const inner = laidOut - 2 * NOTE.padSide
  const spans = [...el.querySelectorAll('.album-note-when span')].map((s) => s.textContent ?? '')
  const lettersWide = spans.reduce((n, s) => n + s.length, 0) * NOTE.whenFont * 0.4 + (spans.length === 2 ? NOTE.whenGap : 0)
  const when = spans.length === 0 ? 0 : lettersWide <= inner ? 1 : 2
  const prose = wrapLines(el.querySelector('.album-note-text')?.textContent ?? '', inner, NOTE.font) * (el.querySelector('.album-note-text') ? 1 : 0)
  const list = [...el.querySelectorAll('.album-note-list li')].reduce((n, li) => n + wrapLines(li.textContent ?? '', inner, NOTE.font), 0)
  const need = Math.ceil((NOTE.padTop + NOTE.padBottom + (when + prose + list) * NOTE.rule) * step)
  return { x: num(el.style.left), y: num(el.style.top), step, width: laidOut * step, when, prose, list, need }
}

/** The SOLID furniture the sheet really draws, from the page's own table (`LAYOUTS[x].fixed`, which `round45` / `round46` hold against the CSS): a heading, a patch, a pass, a tag. Stickers may be covered by design. */
function drawnFurniture(w: ReturnType<typeof mount>, sheet: AlbumSheetModel): Box[] {
  const all = LAYOUTS[sheet.layout].fixed(sheet)
  const solid = (b: Box): boolean => b.w > 26 || b.h > 26
  const present: Record<AlbumSheetModel['layout'], (i: number) => boolean> = {
    A: (i) => i === 0 || (i === 1 && w.find('.album-a-patch').exists()),
    B: (i) => i === 0 && w.find('.album-b-pass').exists(),
    C: (i) => i === 0 || (i === 1 && w.find('.album-c-tag').exists()),
  }
  return all.filter((b, i) => solid(b) && present[sheet.layout](i))
}

/** The sheets the phone arm mounts: graduates the ROTATION ALONE would have laid on B (with a pass) and on C (with a tag) – the before-arm – plus the first of those it leaves on A as a control, and the heirloom's. */
function phoneSheets(): { label: string; sheet: AlbumSheetModel; rotationSeat: string }[] {
  const out: { label: string; sheet: AlbumSheetModel; rotationSeat: string }[] = []
  const want: Record<string, number> = { B: 5, C: 5, A: 2 }
  for (const age of [21, 22]) {
    for (let i = 0; i < 48; i++) {
      const world = graduateOf(i, age)
      const book = assembleAlbum(world)
      const read = readChapters(book, captionOf('graduated', world))
      const seat = seatOf(planBook(read.chapters, false)[read.at]!, read.k)
      // ⚠ THE SELECTION MAY NOT LOOK AT THE PIN'S OWN OUTPUT (the first cut skipped every sheet the book left off A, and with the pin removed it selected NOTHING and the arm went quiet instead of red – M1 caught it).
      // It reads the before-arm and the shape alone: the ONE shape no arrangement can seat – the fifth frame of a full seven, which `lb-note-layout-pin.test.ts` proves is the only one by brute force – keeps
      // the rotation's layout by arithmetic, so it is not a sheet of this arm.
      if (read.sizes[read.at] === 7 && read.k === 4) continue
      if ((want[seat] ?? 0) <= 0) continue
      want[seat] = (want[seat] ?? 0) - 1
      out.push({ label: `graduate ${i} @${age} (rotation alone: ${seat})`, sheet: checklistSheet(book), rotationSeat: seat })
    }
  }
  for (const [n, over] of [{}, { titles: 0, bestRank: null, slams: 0 }, { titles: 2, bestRank: 17 }].entries()) {
    out.push({ label: `heirloom ${n}`, sheet: checklistSheet(assembleAlbum(dynastyOf(`lbn-m-${n}`, over))), rotationSeat: 'A' })
  }
  return out
}

describe('LB-note · the checklist sheet at 375x667', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const sheets = phoneSheets()

  it('is not vacuous: the search found graduates the rotation alone would have laid on B and on C', () => {
    expect(sheets.filter((s) => s.rotationSeat === 'B').length, 'a sheet the rotation alone would have put on B').toBeGreaterThanOrEqual(3)
    expect(sheets.filter((s) => s.rotationSeat === 'C').length, 'and on C').toBeGreaterThanOrEqual(3)
  })

  describe.each(sheets)('$label', ({ sheet }) => {
    // ⚠ BEFORE THE MOUNT, EVERY TIME – see the header.
    const mountIt = (): ReturnType<typeof mount> => {
      setViewport(PHONE)
      return mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    }

    it('⭐⭐ the sheet is layout A – the pin, read off what the page drew', () => {
      const w = mountIt()
      expect(w.find('[data-layout]').attributes('data-layout'), 'a checklist sheet is drawn on A').toBe('A')
      expect(sheet.layout).toBe('A')
      w.unmount()
    })

    it('⭐ both blocks are drawn on the sheet, UNDER in flow, and the cascade agrees with the card', () => {
      const w = mountIt()
      const note = `.album-${sheet.layout.toLowerCase()}-note`
      expect(w.find(`${note} .album-note-text`).exists(), 'the sentence').toBe(true)
      expect(w.findAll(`${note} .album-note-list li`).map((li) => li.text()), 'the list').toEqual([...sheet.note!.lines])
      const f = flowFacts(w)
      expect(f.order && !/absolute|fixed/.test(f.listPos) && !/left|right/.test(f.listFloat) && !/flex|grid/.test(f.parentDisplay), JSON.stringify(f)).toBe(true)
      w.unmount()
    })

    it('⭐ the box the resolver reserved covers the rows the page DREW – and the prose rect sits above the list rect, both inside it and inside the page', () => {
      const w = mountIt()
      const n = drawnNote(w, sheet.layout)
      const reserved = placeSheet(sheet).note!
      expect(n.list, 'the page drew list rows').toBeGreaterThan(0)
      expect(n.need, `the scrap needs ${n.need}px (${n.when} date + ${n.prose} sentence + ${n.list} list rows at the ${n.step} hand); the resolver reserved ${reserved.h}`).toBeLessThanOrEqual(reserved.h)
      // the two blocks as boxes: the sentence from the first ruled row after the date, the list from the row after the sentence's last
      const proseTop = n.y + (NOTE.padTop + n.when * NOTE.rule) * n.step
      const prose: Box = { x: n.x, y: proseTop, w: n.width, h: n.prose * NOTE.rule * n.step }
      const list: Box = { x: n.x, y: prose.y + prose.h, w: n.width, h: n.list * NOTE.rule * n.step }
      expect(list.y, 'the list starts where the sentence ends').toBeGreaterThanOrEqual(prose.y + prose.h)
      expect(list.y + list.h + NOTE.padBottom * n.step, 'and ends inside the reserved scrap').toBeLessThanOrEqual(reserved.y + reserved.h + 1)
      expect(n.x + n.width, 'the scrap is not cut by the page\'s right edge').toBeLessThanOrEqual(SHEET_PX + 0.5)
      expect(reserved.y + reserved.h, 'and not by its bottom: the last row of the list is on the paper').toBeLessThanOrEqual(SHEET_PX)
      expect(n.step, 'written at the floor hand the joint length earned').toBe(noteStep(sheet.note!))
      w.unmount()
    })

    it('⭐⭐ the note touches no pass, no tag, no heading and no patch the sheet draws – by construction, as it is an A', () => {
      const w = mountIt()
      const n = drawnNote(w, sheet.layout)
      const reserved = placeSheet(sheet).note!
      const note: Box = { x: n.x, y: n.y, w: n.width, h: reserved.h }
      const hit = drawnFurniture(w, sheet).filter((b) => touches(note, b))
      expect(hit, `the note at ${note.x},${note.y} ${note.w}x${note.h} lies on drawn furniture`).toEqual([])
      expect(w.find('.album-b-pass').exists() || w.find('.album-c-tag').exists(), 'and the sheet draws neither a pass nor a tag for it to land on').toBe(false)
      w.unmount()
    })
  })

  it('⭐ the album\'s exits are inside the phone with a checklist book open: the Back control is the first thing in the flow, and the Chapters card can be closed (standing guards – the note cannot move either)', async () => {
    setViewport(PHONE)
    const book = assembleAlbum(graduateOf(3, 22))
    const w = mount(AlbumScreen, { props: { book }, attachTo: document.body })
    const back = w.find('.album-back')
    expect(back.exists(), 'the Back control is there').toBe(true)
    const head = w.find('.album-head').element
    expect(head.nextElementSibling?.classList.contains('album-stage'), 'the header is above the sheets and in the flow').toBe(true)
    expect(getComputedStyle(head).position, 'the header is not pulled out of the flow').not.toMatch(/absolute|fixed/)
    expect(getComputedStyle(back.element).position, 'nor is the control').not.toMatch(/absolute|fixed/)
    await w.find('.album-chapters-btn').trigger('click')
    const card = w.find('.album-chapters-card')
    expect(card.exists(), 'the Chapters button opened nothing').toBe(true)
    assertDismissReachable(card.element, w.find('.album-chapters-close').element, PHONE, 'the Chapters card with a checklist book open')
    w.unmount()
  })
})
