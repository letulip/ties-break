// ROUND 47 B3 – LEDGER ITEM 9: «в альбоме очень крупные заголовки на страницах, можно чуть уменьшить, а еще иногда у этих заголовков оверлап с написанным
// на странице случается, что тоже странновато, вроде место есть».
//
// TWO CLAIMS, BOTH MEASURED IN REAL CHROMIUM BEFORE ANY CODE (06.10, the 335 sheets of the 48 posed careers, phone width, Caveat loaded):
//   1. THE SIZE – the chapter's name 44 -> 38px, the «– Chapter N» kicker 19 -> 17, the years 21 -> 19, the gaps 4/8 -> 3/6: the block 96 -> 83px.
//   2. THE OVERLAP – layout A 0 collisions of 147, B has no heading, layout C 121 of 121: the heading's third line, the years («Age 18 – 22»), lay UNDER
//      the hero photograph, the whole text of it (25.9px tall) – the screenshot of the old page does not show the line at all. After: 0 of 335.
//
// ⭐ THE CLASS, said once: a photograph's SLOT is a table entry (`LAYOUTS` in albumPlacement.ts) and the resolver only ever moved a note and a loose
// line, so nothing compared the table with its own furniture. C's hero slot began at y 100 and the title block reserved y 26..122.
//
// ⚠ WHAT THIS CANNOT SEE: happy-dom lays nothing out, so the sweep below is the RESOLVER'S OWN FRAMES (the table's numbers). The thing that saw «the years
// line is under the photograph» is the Chromium run; what keeps the two from drifting apart is the first two describes – the page's CSS held against `HEAD_H`
// and the estimate held against Chromium's own widths.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical – the list is in the round-47 ledger, item 9.
import { describe, it, expect } from 'vitest'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { ALBUM_CHAPTER_TITLES } from '../src/engine/world/albumBook'
import { HEAD_H, LAYOUTS, POLAROID, SCALES, placeSheet, touches, type Box } from '../src/components/album/albumPlacement'
import { sheetOf } from './component/albumFixture'
import { sweepSheets } from './helpers/albumSweep'
import { componentFile } from './worldSource'
import type { AlbumLayout, AlbumSheetModel } from '../src/shared/protocol'

const titleFile = componentFile('components/album/AlbumSheetTitle.vue')

function rule(src: string, selector: string): string {
  const m = new RegExp(`${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(src)
  if (!m) throw new Error(`no rule ${selector}`)
  return m[1] as string
}
function px(block: string, prop: string): number {
  const m = new RegExp(`(?:^|[;\\s])${prop}:\\s*(-?[\\d.]+)px`).exec(block)
  if (!m) throw new Error(`no ${prop} in: ${block.trim().slice(0, 60)}`)
  return Number(m[1])
}
const stub = (chapterTitle: string): AlbumSheetModel => ({ chapterTitle, ticket: null, tag: null }) as unknown as AlbumSheetModel
const headOf = (layout: 'A' | 'C', chapterTitle = 'The breakthrough'): Box => LAYOUTS[layout].fixed(stub(chapterTitle))[0] as Box

describe('round 47 #9 · the heading is one step smaller – and the resolver reserves the number the page renders', () => {
  it('the name is 38px (was 44), the kicker 17 (was 19), the years 19 (was 21)', () => {
    expect(px(rule(titleFile, '.album-title-name'), 'font-size')).toBe(38)
    expect(px(rule(titleFile, '.album-title-no'), 'font-size')).toBe(17)
    expect(px(rule(titleFile, '.album-title-age'), 'font-size')).toBe(19)
    expect(titleFile, 'the 44px name is gone').not.toMatch(/font-size:\s*44px/)
  })

  it('the block is HEAD_H tall – 17 + 3 + 38 + 6 + 19 at line-height 1 – in the CSS and in both layouts\' furniture', () => {
    const no = rule(titleFile, '.album-title-no')
    const name = rule(titleFile, '.album-title-name')
    const age = rule(titleFile, '.album-title-age')
    for (const b of [no, name, age]) expect(b).toMatch(/line-height:\s*1;/)
    expect(px(no, 'font-size') + px(name, 'margin') + px(name, 'font-size') + px(age, 'margin') + px(age, 'font-size')).toBe(HEAD_H)
    expect(HEAD_H, 'Chromium measured 83px on all five names').toBe(83)
    expect(headOf('A').h).toBe(HEAD_H)
    expect(headOf('C').h).toBe(HEAD_H)
  })

  it('the width estimate never under-counts Chromium\'s own widths for the five names (and over-counts by at most 15 %)', () => {
    // MEASURED 06.10, Chromium, Caveat 600 at 38px: the name's text box, per chapter title.
    const REAL: Record<string, number> = { 'The beginning': 181.2, 'Growing up': 141.7, 'The breakthrough': 233.4, 'The tour': 111.8, 'The final chapter': 224.1 }
    expect(Object.keys(REAL).sort(), 'a new or renamed chapter title must be measured here').toEqual(Object.values(ALBUM_CHAPTER_TITLES).sort())
    for (const [title, real] of Object.entries(REAL)) {
      const w = headOf('A', title).w
      expect(w, `«${title}»: estimate ${w} against Chromium's ${real}`).toBeGreaterThanOrEqual(real)
      expect(w, `«${title}» is over-counted by more than 15 %`).toBeLessThanOrEqual(real * 1.15)
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// THE OVERLAP – the table, then the sweep, then the worst words.
describe('round 47 #9 · no photograph starts inside the heading, at any rung', () => {
  it('every photograph slot of A and C starts below the heading box – leaning included', () => {
    for (const layout of ['A', 'C'] as const) {
      const head = headOf(layout, 'The final chapter')
      LAYOUTS[layout].photos.forEach((slot, i) => {
        const lean = (slot.w / 2) * Math.sin((Math.abs(slot.tilt) * Math.PI) / 180)
        expect(slot.y - lean, `layout ${layout} photo ${i}: top edge ${slot.y} (lifted ${lean.toFixed(1)} by its lean) against the heading's bottom ${head.y + head.h}`).toBeGreaterThanOrEqual(head.y + head.h)
      })
    }
  })

  it('C\'s hero gave its pixels back at the BOTTOM: the window still ends at y 300, so the note strip, the second photograph and the guard counts are the tuned ones', () => {
    const hero = LAYOUTS.C.photos[0]
    expect(hero?.y).toBe(114)
    expect((hero?.y ?? 0) + POLAROID.top + (hero?.photoH ?? 0)).toBe(300)
    expect(SCALES[0]).toBe(1)
  })
})

const sheets = sweepSheets()
const headingFor = (s: AlbumSheetModel): Box | null => (s.layout === 'B' ? null : (LAYOUTS[s.layout].fixed(s)[0] as Box))
function contentOf(s: AlbumSheetModel): { what: string; box: Box }[] {
  const p = placeSheet(s)
  return [
    ...p.photos.map((x, i) => ({ what: `photo ${i}`, box: x.box })),
    ...p.photos.flatMap((x, i) => (x.band ? [{ what: `caption ${i}`, box: x.band }] : [])),
    ...(p.note ? [{ what: 'note', box: p.note as Box }] : []),
    ...(p.line ? [{ what: 'loose line', box: p.line }] : []),
    ...(p.filler ? [{ what: 'snapshot', box: p.filler.box }] : []),
  ]
}
const hitsOf = (s: AlbumSheetModel): string[] => {
  const h = headingFor(s)
  return h ? contentOf(s).filter((c) => touches(c.box, h)).map((c) => c.what) : []
}

describe('round 47 #9 · the sweep – the heading box meets no content box on any of the 335 sheets', () => {
  it('is not vacuous: the OLD numbers (a 96px block, the hero at y 100) meet on every C sheet and on no A sheet', () => {
    const byLayout = (l: AlbumLayout): number => sheets.filter((s) => s.layout === l).length
    expect(byLayout('A')).toBeGreaterThan(100)
    expect(byLayout('C')).toBeGreaterThan(100)
    const OLD_HEAD = (s: AlbumSheetModel): Box => ({ x: 33, y: 26, w: Math.max(164, Math.ceil(s.chapterTitle.length * 17)), h: 96 })
    const OLD_HERO: Box = { x: 26, y: 100, w: 276, h: 4 + 196 + 12 }
    const collidingC = sheets.filter((s) => s.layout === 'C' && touches(OLD_HERO, OLD_HEAD(s))).length
    expect(collidingC, 'the measured «121 of 121»: the old table put the hero inside the title\'s box on every C sheet').toBe(byLayout('C'))
    const OLD_HERO_A: Box = { x: 24, y: 126, w: 245, h: 4 + 170 + 12 }
    expect(sheets.filter((s) => s.layout === 'A' && touches(OLD_HERO_A, { ...OLD_HEAD(s), x: 34 })).length, 'layout A never collided').toBe(0)
  })

  it('⭐ ZERO sheets where the heading box meets a photograph, a caption, the note, the loose line or the snapshot', () => {
    const bad = sheets.map((s) => ({ s, hits: hitsOf(s) })).filter((x) => x.hits.length > 0)
    expect(bad.map((x) => `${x.s.layout} ${x.s.id}: ${x.hits.join(', ')}`), `${bad.length} of ${sheets.length} sheets collide with their heading`).toEqual([])
  })
})

describe('round 47 #9 · the worst words – the longest note, caption and loose line under each of the five names', () => {
  const voices = ALBUM_CORPUS.flatMap((o) => Object.values(o.voices))
  const longest = (key: 'note' | 'caption' | 'line'): string => voices.reduce((a, v) => (v[key].length > a.length ? v[key] : a), '')
  const crowded = (layout: AlbumLayout, chapterTitle: string): AlbumSheetModel => {
    const s = sheetOf({ layout, chapterTitle })
    return {
      ...s,
      note: { text: longest('note'), dateLabel: 'Nov 10 – Nov 16', ageLabel: 'Age 14', lines: [] },
      line: longest('line'),
      frames: s.frames.map((f) => ({ ...f, caption: longest('caption') })),
    }
  }

  it('the corpus words are what the geometry was drawn too small for (a note of 100+ characters, a caption of 40+)', () => {
    expect(longest('note').length).toBeGreaterThan(100)
    expect(longest('caption').length).toBeGreaterThan(40)
  })

  it.each(['A', 'C'] as const)('layout %s: nothing meets the heading under any chapter name', (layout) => {
    for (const title of Object.values(ALBUM_CHAPTER_TITLES)) {
      expect(hitsOf(crowded(layout, title)), `«${title}»`).toEqual([])
    }
  })
})
