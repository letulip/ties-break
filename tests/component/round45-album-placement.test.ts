// ROUND 45 #6 + #7 – THE MOUNTED HALF. `tests/round45-album-placement.test.ts` holds the resolver's rectangle
// math over 335 real sheets; this file holds that the COMPONENTS render through it.
//
// ⚠ NO BOX IS MEASURED HERE AND NONE IS FAKED. happy-dom lays nothing out, so `getBoundingClientRect`
// would answer zeros and prove nothing. What a mount CAN give is what the page was TOLD: the inline
// `left/top/width` each layout binds and the `height` each picture window was drawn at. The caption bands
// below are rebuilt from those rendered numbers alone – not from `placeSheet`'s own output – and the
// note and the loose line must stand clear of them.
//
// ⭐ MUTATION-VERIFIED (02.10): `placeSheet` replaced by the layout's own drawing -> the «clear of every
// caption» test goes red on all three layouts; `:photo-style="ALBUM_CROP"` removed from AlbumPhoto ->
// the crop test goes red (and the source pin in the unit file with it).
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import { LAYOUTS, POLAROID, drawnPlacement, noteHeight, placeSheet, touches, wrapLines, type Box } from '../../src/components/album/albumPlacement'
import { sheetOf } from './albumFixture'
import type { AlbumLayout, AlbumSheetModel } from '../../src/shared/protocol'

/** The longest note and the longest caption in the corpus (127 and 45 characters, measured over 335
 *  sheets) – the shape every layout was drawn too small for. Data for the geometry, not a claim about copy. */
const LONG_NOTE = 'You came back up the table this year and you talked about the two weeks in the middle where it turned, not about the end of it.'
const LONG_CAPTION = 'A photograph of the ceiling she waited under.'

function crowded(layout: AlbumLayout): AlbumSheetModel {
  const s = sheetOf({ layout })
  return {
    ...s,
    note: { text: LONG_NOTE, dateLabel: 'Nov 10 – Nov 16', ageLabel: 'Age 14', lines: [] },
    frames: s.frames.map((f) => ({ ...f, caption: LONG_CAPTION })),
  }
}

const num = (v: string): number => Number.parseFloat(v)
const inline = (el: Element): Box => {
  const st = (el as HTMLElement).style
  return { x: num(st.left), y: num(st.top), w: num(st.width), h: 0 }
}

/** ⭐ #6b: a note drawn smaller is laid out 1/step wide and scaled from its corner, so what it occupies on the
 *  page is the inline width TIMES the scale – read off the rendered style, never off the resolver. */
const scaleOf = (el: Element): number => Number(/scale\(([\d.]+)\)/.exec((el as HTMLElement).style.transform)?.[1] ?? 1)
const noteInline = (el: Element): Box & { step: number } => {
  const b = inline(el)
  const step = scaleOf(el)
  return { x: b.x, y: b.y, w: b.w * step, h: 0, step }
}

/** The caption band of each rendered photograph, from the rendered numbers only. */
function bandsFromDom(root: ReturnType<typeof mount>): Box[] {
  return root.findAll('.album-photo').map((p) => {
    const box = inline(p.element)
    const img = p.find('img').element as HTMLImageElement
    const pol = p.find('.tb-polaroid').element as HTMLElement
    const tilt = num(/rotate\((-?[\d.]+)deg\)/.exec(pol.style.transform)?.[1] ?? '0')
    const caption = p.find('.tb-polaroid-caption').text()
    const lines = wrapLines(caption, box.w - 2 * POLAROID.side - 2 * POLAROID.capSide, POLAROID.capFont)
    const lip = POLAROID.bottom + POLAROID.capGap + lines * POLAROID.capLine
    const h = POLAROID.top + num(img.style.height) + lip
    const pad = Math.ceil((Math.max(box.w, h) / 2) * Math.sin((Math.abs(tilt) * Math.PI) / 180)) + 1
    return { x: box.x - pad, y: box.y + POLAROID.top + num(img.style.height) - pad, w: box.w + 2 * pad, h: lip + 2 * pad }
  })
}

describe.each(['A', 'B', 'C'] as const)('round 45 #6 · layout %s on the longest words', (layout) => {
  const sheet = crowded(layout)
  const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
  const noteSel = `.album-${layout.toLowerCase()}-note`
  const lineSel = `.album-${layout.toLowerCase()}-line`
  const def = LAYOUTS[layout]
  const lineBox = (): Box => {
    const b = inline(w.find(lineSel).element)
    return { ...b, h: wrapLines(sheet.line, b.w, def.line.font) * def.line.lh }
  }
  const noteBox = (): Box => {
    const b = noteInline(w.find(noteSel).element)
    return { ...b, h: noteHeight(sheet, b.w, b.step) }
  }

  it('is not vacuous: the layout\'s own drawing puts a note or a line on a caption of this very sheet', () => {
    const d = drawnPlacement(sheet)
    const hit = [d.note, d.line].some((m) => m && d.bands.some((b) => touches(m, b)))
    expect(hit, 'the unresolved drawing of the crowded sheet must collide, or this test is idle').toBe(true)
  })

  it('⭐ the rendered note and loose line stand clear of every rendered caption band', () => {
    const bands = bandsFromDom(w)
    expect(bands.length, 'the photographs were rendered').toBeGreaterThanOrEqual(2)
    for (const m of [noteBox(), lineBox()]) {
      expect(bands.filter((b) => touches(m, b)), `a mover at ${m.x},${m.y} ${m.w}x${m.h} touches a caption`).toEqual([])
    }
  })

  it('renders through the resolver: the inline positions ARE its answer', () => {
    const p = placeSheet(sheet)
    const n = noteInline(w.find(noteSel).element)
    expect([n.x, n.y, n.step]).toEqual([p.note?.x, p.note?.y, p.note?.step])
    expect(n.w, 'the page occupies the width the resolver reserved').toBeCloseTo(p.note?.w ?? 0, 1)
    expect(inline(w.find(lineSel).element)).toMatchObject({ x: p.line?.x, y: p.line?.y, w: p.line?.w })
    const imgs = w.findAll('img').map((i) => num((i.element as HTMLImageElement).style.height))
    expect(imgs).toEqual(p.photos.map((x) => x.photoH))
  })

  it('⭐ #6b: the long note is DRAWN SMALLER – the layout binds the resolver\'s step with its position', () => {
    const p = placeSheet(sheet)
    expect(p.note?.step, 'a 127-character note is written below full size').toBeLessThan(1)
    const el = w.find(noteSel).element as HTMLElement
    expect(scaleOf(el)).toBe(p.note?.step)
    expect(el.getAttribute('style') ?? '').toMatch(/transform-origin:\s*0(px)? 0(px)?/)
    // it was laid out wider, so the same scrap drawn at `step` is as wide as the resolver reserved
    expect(Number.parseFloat(el.style.width)).toBeGreaterThan(p.note?.w ?? 0)
  })

  it('⭐ #7: every picture window anchors its crop 10% from the top, not the centre', () => {
    const imgs = w.findAll('img')
    expect(imgs.length).toBeGreaterThanOrEqual(2)
    for (const i of imgs) expect((i.element as HTMLImageElement).style.objectPosition).toBe('50% 10%')
  })
})

describe('round 45 #6b · beside the hero, not on it – the windows give a rung first', () => {
  it('the longest note on layout C: the hero window draws smaller, and the rendered note stands clear of the rendered hero PICTURE', () => {
    // The crowded sheet is the shape the strip under the hero cannot hold at full size (a 127-character note and
    // two 45-character captions): the resolver must spend rungs, or this test is idle and says so.
    const sheet = crowded('C')
    expect(placeSheet(sheet).scale, 'the longest note needs the hero window to give, or the ladder is dead code').toBeLessThan(1)
    const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    const hero = w.find('.album-c-hero')
    const at = inline(hero.element)
    const drawn = LAYOUTS.C.photos[0]?.photoH ?? 0
    const windowH = num((hero.find('img').element as HTMLImageElement).style.height)
    expect(windowH, `hero window ${windowH} against drawn ${drawn}`).toBeLessThan(drawn)
    const picture: Box = { x: at.x, y: at.y + POLAROID.top, w: at.w, h: windowH }
    const n = noteInline(w.find('.album-c-note').element)
    const note: Box = { ...n, h: noteHeight(sheet, n.w, n.step) }
    expect(touches(note, picture), `the note at ${note.x},${note.y} ${note.w}x${note.h} touches the hero picture`).toBe(false)
    expect(bandsFromDom(w).filter((x) => touches(note, x))).toEqual([])
  })
})
