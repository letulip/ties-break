// ROUND 50 №3 – THE MOUNTED HALF: the cup the resolver placed is what the page draws – `trophyArtUrl`'s own
// spelling with the base prefixed, decoration with no copy, standing at the resolver's spot and lean.
//
// ⚠ NO BOX IS MEASURED HERE (happy-dom lays nothing out). What a mount CAN say is what the page was TOLD:
// the inline left/top/width/rotate the layout binds from the resolver and the img's src/alt/aria-hidden.
// The geometry – the corner above the tag frame, the no-touch sweep over the titled careers – is
// `tests/r50-album-cups.test.ts`.
import '../../src/style.css'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { existsSync } from 'node:fs'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import { placeSheet } from '../../src/components/album/albumPlacement'
import { trophyArtUrl } from '../../src/art/trophies'
import { sheetOf } from './albumFixture'
import type { AlbumSheetModel } from '../../src/shared/protocol'

describe('round 50 №3 · the chapter cup, mounted', () => {
  it('the cup is drawn where the resolver put it: frameless transparent art, no copy, the one url builder', () => {
    const sheet: AlbumSheetModel = { ...sheetOf({ layout: 'C' }), cup: { tier: 'wta1000', metal: 'gold' } }
    const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    const img = w.find('img.album-c-cup')
    expect(img.exists(), 'the layout drew no cup').toBe(true)
    const placed = placeSheet(sheet).cup
    expect(placed).not.toBeNull()
    const el = img.element as HTMLImageElement
    expect([el.style.left, el.style.top, el.style.width]).toEqual([`${placed?.x}px`, `${placed?.y}px`, `${placed?.size}px`])
    expect(el.style.transform).toBe(`rotate(${placed?.tilt}deg)`)
    // ⚠ THE URL IS `trophyArtUrl`'s AND NOTHING ELSE – the one builder of that spelling (`art/trophies.ts`:
    // a second hand-built path is how the finale splash once 404'd), and the file it names is on disk.
    expect(img.attributes('src')).toBe(trophyArtUrl('wta1000', 'gold'))
    expect(img.attributes('src')).toContain('images/trophies/wta1000-gold.webp')
    expect(existsSync(`${process.cwd()}/public/images/trophies/wta1000-gold.webp`), 'the art is on disk').toBe(true)
    expect(img.attributes('alt'), 'decoration: no alt string, no copy (invariant 4)').toBe('')
    expect(img.attributes('aria-hidden')).toBe('true')
  })

  it('a sheet without a cup on the wire draws none', () => {
    const bare = mount(AlbumSheet, { props: { sheet: sheetOf({ layout: 'C' }) } })
    expect(bare.find('.album-c-cup').exists()).toBe(false)
  })
})
