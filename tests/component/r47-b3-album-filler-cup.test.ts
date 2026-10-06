// ROUND 47 B3 – THE MOUNTED HALF: the small snapshot (item 14), the cup (item 15) and the heading's rendered size (item 9).
//
// ⚠ NO BOX IS MEASURED HERE (happy-dom lays nothing out). What a mount CAN say is what the page was TOLD: the inline left/top/width the layout binds from the
// resolver, the picture's `src` / `alt` / crop, and which `d` the cup draws. The geometry is `tests/r47-b3-album-*.test.ts` over 335 sheets and the Chromium run
// in the round-47 ledger.
//
// 15  «иконка кубка у нас есть хорошая, используй ее пожалуйста вместо этого текущего немного странного кубка». THE OLD ONE: the album's `trophy` doodle in
//     `AlbumDoodleMark.vue` (a hand-drawn pen cup whose stem ended 3 units above its base). THE GOOD ONE: `public/icons/trophy.svg` – the Trophies tab icon
//     (`AppIcon name="trophy"`). The doodle now draws that file's own path.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical – the list is in the round-47 ledger.
import '../../src/style.css'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, readdirSync } from 'node:fs'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import AlbumDoodleMark from '../../src/components/album/AlbumDoodleMark.vue'
import { placeSheet } from '../../src/components/album/albumPlacement'
import { sheetOf } from './albumFixture'
import type { AlbumLayout, AlbumSheetModel } from '../../src/shared/protocol'

const ROOT = `${process.cwd()}/`
const art = { art: 'images/weeks/off-1.webp' }
const bare = (layout: 'B' | 'C'): AlbumSheetModel => ({ ...sheetOf({ layout }), ticket: null, tag: null, filler: art })

describe('round 47 #14 · the small snapshot, mounted', () => {
  it.each(['B', 'C'] as const)('layout %s: the snapshot is drawn where the resolver put it, as a captionless decorative picture with the base prefixed', (layout) => {
    const sheet = bare(layout)
    const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    const el = w.find('.album-filler')
    expect(el.exists(), 'the layout drew no snapshot').toBe(true)
    const placed = placeSheet(sheet).filler
    expect(placed).not.toBeNull()
    const style = (el.element as HTMLElement).style
    expect([style.left, style.top, style.width]).toEqual([`${placed?.x}px`, `${placed?.y}px`, `${placed?.w}px`])
    const img = el.find('img')
    expect(img.attributes('src')).toBe(`${import.meta.env.BASE_URL}${art.art}`)
    expect(img.attributes('alt'), 'decoration: no alt string, no copy').toBe('')
    expect(el.attributes('aria-hidden')).toBe('true')
    expect((img.element as HTMLImageElement).style.height).toBe(`${placed?.photoH}px`)
    expect((img.element as HTMLImageElement).style.objectPosition, 'the crop keeps her in view, not the middle').toBe('80% 40%')
    expect(el.find('.tb-polaroid-caption').exists(), 'no caption: zero new strings').toBe(false)
    expect(el.find('.tb-polaroid-tape').exists()).toBe(true)
  })

  it('the snapshot is only drawn in a real gap: not on A, not beside a drawn ticket, not beside a drawn tag, and not when the sheet carries none', () => {
    const draws = (s: AlbumSheetModel): boolean => mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body }).find('.album-filler').exists()
    expect(draws({ ...sheetOf({ layout: 'A' }), filler: art })).toBe(false)
    expect(draws({ ...sheetOf({ layout: 'B' }), filler: art }), 'the ticket is drawn').toBe(false)
    expect(draws({ ...sheetOf({ layout: 'C' }), filler: art }), 'the tag is drawn').toBe(false)
    expect(draws({ ...bare('B'), filler: null })).toBe(false)
    expect(draws(bare('B'))).toBe(true)
  })
})

describe('round 47 #15 · the cup is the app\'s own', () => {
  const GOOD = /<path d="([^"]+)"/.exec(readFileSync(`${ROOT}public/icons/trophy.svg`, 'utf8'))?.[1] ?? ''
  const OLD = 'M8 4h8v5a4 4 0 0 1-8 0V4Z'

  it('the good cup is found and has a stem that reaches its base (a sanity check of the pin, not of the page)', () => {
    expect(GOOD).toMatch(/^M7 4h10v5/)
    expect(GOOD, 'the stem ends where the base is').toContain('M9 20h6M12 14v6')
  })

  it('the trophy doodle draws trophy.svg\'s own path – alone, and on every layout that can carry it', () => {
    const d = mount(AlbumDoodleMark, { props: { mark: 'trophy', size: 24 } }).find('path').attributes('d')
    expect(d).toBe(GOOD)
    for (const layout of ['A', 'B', 'C'] as AlbumLayout[]) {
      const w = mount(AlbumSheet, { props: { sheet: { ...sheetOf({ layout }), doodles: ['trophy'] } }, attachTo: document.body })
      expect(w.find(`.album-${layout.toLowerCase()}-doodle path`).attributes('d'), `layout ${layout}`).toBe(GOOD)
    }
  })

  it('the old cup is gone from the album: no file in the album kit carries its drawing', () => {
    const dir = `${ROOT}src/components/album/`
    for (const f of readdirSync(dir)) {
      const src = readFileSync(`${dir}${f}`, 'utf8')
      expect(src, `${f} still draws the old cup`).not.toContain(OLD)
      expect(src, `${f} still has its floating foot`).not.toContain('M12 13v4m-3 3h6')
    }
  })

  it('the other five marks are untouched', () => {
    const d = (mark: 'heart' | 'sun' | 'smile' | 'globe' | 'plane'): string | undefined => mount(AlbumDoodleMark, { props: { mark } }).find('path').attributes('d')
    expect(d('heart')).toContain('M12 20c-4-3-7-5.5-7-9')
    expect(d('plane')).toContain('M21 4 3 11.2')
    expect(d('sun')).toContain('M12 8.5a3.5')
    expect(d('smile')).toContain('M12 3.5a8.5')
    expect(d('globe')).toContain('M3.5 12h17')
  })
})

describe('round 47 #9 · the heading, rendered', () => {
  it('layout C\'s chapter heading is drawn at 38 / 17 / 19px, and the same on A', () => {
    for (const layout of ['A', 'C'] as const) {
      const w = mount(AlbumSheet, { props: { sheet: sheetOf({ layout }) }, attachTo: document.body })
      const size = (sel: string): string => getComputedStyle(w.find(sel).element).fontSize
      expect([size('.album-title-name'), size('.album-title-no'), size('.album-title-age')], `layout ${layout}`).toEqual(['38px', '17px', '19px'])
    }
  })
})
