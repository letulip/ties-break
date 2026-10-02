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
    const b = inline(w.find(noteSel).element)
    return { ...b, h: noteHeight(sheet, b.w) }
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
    expect(inline(w.find(noteSel).element)).toMatchObject({ x: p.note?.x, y: p.note?.y, w: p.note?.w })
    expect(inline(w.find(lineSel).element)).toMatchObject({ x: p.line?.x, y: p.line?.y, w: p.line?.w })
    const imgs = w.findAll('img').map((i) => num((i.element as HTMLImageElement).style.height))
    expect(imgs).toEqual(p.photos.map((x) => x.photoH))
  })

  it('⭐ #7: every picture window anchors its crop 10% from the top, not the centre', () => {
    const imgs = w.findAll('img')
    expect(imgs.length).toBeGreaterThanOrEqual(2)
    for (const i of imgs) expect((i.element as HTMLImageElement).style.objectPosition).toBe('50% 10%')
  })
})

describe('round 45 #6 · crowded pages give the photographs a rung', () => {
  it('a real layout B page that cannot clear its captions at full size draws smaller windows – and still clears them', () => {
    // A SHAPE THE ENGINE ACTUALLY ASSEMBLED (one of the 31 of 67 layout B sheets over 48 posed careers that
    // needed a smaller window): two frames, no pass, a 109-character note. Data for the geometry, not a claim
    // about copy. The sheet is found by the resolver's own verdict first, so the test cannot go idle.
    const base = crowded('B')
    const sheet: AlbumSheetModel = {
      ...base,
      chapterTitle: 'The final chapter',
      frames: base.frames.slice(0, 2).map((f, k) => ({ ...f, caption: ['Nothing said. A new schedule.', 'Dates on the calendar, in pen.'][k] ?? '' })),
      note: {
        text: "A year that went back up. You did not mention it at all, and next season's schedule arrived in the same week.",
        dateLabel: 'Dec 19 – Dec 25',
        ageLabel: 'Age 33',
        lines: [],
      },
      line: 'Straight back to the planning.',
      ticket: null,
    }
    expect(placeSheet(sheet).scale, 'this shape needs a smaller window, or the ladder is dead code').toBeLessThan(1)
    const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    const drawn = LAYOUTS.B.photos.map((p) => p.photoH)
    const got = w.findAll('img').map((i) => num((i.element as HTMLImageElement).style.height))
    expect(got.some((h, k) => h < (drawn[k] ?? 0)), `windows ${got} against drawn ${drawn}`).toBe(true)
    const bands = bandsFromDom(w)
    const b = inline(w.find('.album-b-note').element)
    expect(bands.filter((x) => touches({ ...b, h: noteHeight(sheet, b.w) }, x))).toEqual([])
  })
})
