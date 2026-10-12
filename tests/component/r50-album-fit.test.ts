// ⭐⭐⭐ r50 №2 – THE ALBUM FITS THE VIEWPORT HEIGHT ON LANDSCAPE TABLET/DESKTOP (owner, 12.10:
// «давай по vh впишем альбом на десктоп и планшете – все элементы управления будут прибиты к низу,
// а фрейм самого альбома займет оставшееся место… для альбомной ориентации планшетов и десктопов,
// на книжной всё нормально, можно только немного элементы управления нижние отодвинуть еще ниже,
// чуть больше воздуха дать до фрейма альбома»).
//
// WHAT THIS FILE GUARDS, in two layers:
//
//   THE ARITHMETIC   `sheetFor` (composables/albumFit.ts) is the pure twin the component calls and
//                    the pins' oracle – a table of run-verified values, the chrome constants named.
//   THE MECHANISM    mounted: the handler writes the three tokens INLINE on :root and the cascade
//                    follows (paper width, pitch, strip rail, the fit class); unmount CLEARS them –
//                    the root outlives mounts (album-wide's measured note), so a leak would poison
//                    the next mount; portrait keeps the ladder and gains only air under the frame.
//
// ⚠ VIEWPORT FIRST, THEN MOUNT, THEN `await nextTick()` BEFORE READING A CLASS-DRIVEN STYLE: the
// tokens are written imperatively inside `onMounted` (synchronous with `mount`), but the
// `album--fit` class arrives on Vue's next patch – and happy-dom caches a computed style against
// the element it was first read on, so a read before the class lands would stay the pre-fit answer
// for ever (measured in this repo, 19.09; re-measured for this wave's probe).
//
// ⚠⚠ MUTATION-VERIFIED (12.10, run → restore → state):
//   (i)  `onBeforeUnmount`'s token cleanup removed            -> the unmount arm below REDS
//        (first on `--album-sheet` still reading '530px' after unmount)
//   (ii) the re-register recipe's scroll line dropped
//        (`if (el) el.scrollLeft = was * step.value`)         -> the resize arm REDS on
//        `pan.scrollLeft` (stays 1638 against the re-registered 2148)
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import '../../src/style.css'

import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import {
  ENDING_CHROME_PX,
  SHELL_CHROME_PX,
  sheetFor,
} from '../../src/composables/albumFit'
import {
  LEAF_PX,
  SHEET_DESKTOP_PX,
  SHEET_GAP_PX,
  SHEET_PX,
  SHEET_TABLET_PX,
  SHEET_WIDE_PX,
  SHEET_WIDE_STEP_PX,
} from '../../src/shared/protocol'
import { DESKTOP, TABLET, setViewport, type Viewport } from './fits'
import { bookOf } from './albumFixture'

const px = (value: string): number => parseFloat(value)
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()
const inlineToken = (name: string): string => document.documentElement.style.getPropertyValue(name)

function mountAlbum(vp: Viewport, book = bookOf(4)) {
  setViewport(vp)
  return mount(AlbumScreen, { props: { book }, attachTo: document.body })
}

describe('sheetFor – the ceiling\'s arithmetic, with the chrome constants named', () => {
  // The chrome is CONSTANTS, not DOM measurement (happy-dom lays nothing out and the component's
  // own header rules measuring): shell = 24 top pad + 70 head + 72 row-gaps + 66 strip + 8 dots +
  // 18 counter + 12 bottom air = 270; ending = its own 24/48 paddings over the same album chrome
  // = 306. A drifted addend moves every row of this table at once.
  it('⚠ the chrome constants are the recon\'s named addends', () => {
    expect(SHELL_CHROME_PX, 'shell: 24 + 70 + 72 + 66 + 8 + 18 + 12').toBe(270)
    expect(ENDING_CHROME_PX, 'ending: 24 + 48 + 70 + 72 + 66 + 8 + 18').toBe(306)
  })

  it('⚠⚠ the table of run-verified values', () => {
    // 1280x800 (fits.ts\'s own DESKTOP): shallow – the sheet shrinks under the rung
    expect(sheetFor(1280, 800)).toBe(800 - SHELL_CHROME_PX) // 530
    expect(sheetFor(1280, 800)! > SHEET_PX && sheetFor(1280, 800)! < SHEET_WIDE_PX).toBe(true)
    // 1280x1100: taller than cap + chrome – the rung CAPS the ceiling (no void-pinning above it)
    expect(sheetFor(1280, 1100)).toBe(SHEET_WIDE_PX) // 700
    // 1024x768: the 1024 band, shallow – under its own 640 rung
    expect(sheetFor(1024, 768)).toBe(768 - SHELL_CHROME_PX) // 498
    expect(sheetFor(1024, 768)! < SHEET_DESKTOP_PX).toBe(true)
    // portrait tablet: null – the ladder rules, nothing changes
    expect(sheetFor(768, 1024)).toBeNull()
    // phones, both orientations: the width gate takes portrait, the floor takes landscape
    // (844 is past the 768 gate, but 390 − 270 = 120 of room is under the 470 floor)
    expect(sheetFor(390, 844)).toBeNull()
    expect(sheetFor(844, 390)).toBeNull()
    // degenerate shallow desktop: 500 − 270 = 230 < 470 – fall back to ladder + scroll
    expect(sheetFor(1280, 500)).toBeNull()
    // the floor's exact edge: 740 − 270 = 470 fits, one pixel less does not
    expect(sheetFor(768, 740)).toBe(SHEET_PX)
    expect(sheetFor(768, 739)).toBeNull()
    // the ending host pays its own chrome: 850 − 306 = 544, still under the 640 rung
    expect(sheetFor(1024, 850, 'ending')).toBe(850 - ENDING_CHROME_PX) // 544
    expect(sheetFor(1024, 850, 'ending')! < SHEET_DESKTOP_PX).toBe(true)
  })
})

describe('mounted – the handler writes the tokens, the cascade follows, unmount clears', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠⚠ 1280x800 landscape: inline tokens, the paper follows, the rail is the strip – and UNMOUNT clears', async () => {
    const fitted = sheetFor(DESKTOP.width, DESKTOP.height)! // 530
    const w = mountAlbum(DESKTOP)
    await nextTick() // the class lands on Vue\'s first patch after onMounted

    expect(inlineToken('--album-sheet'), 'the handler did not write the fitted sheet').toBe(`${fitted}px`)
    expect(
      px(getComputedStyle(w.find('.album-paper').element).width),
      'the paper does not follow the inline token',
    ).toBe(fitted)
    const step = px(getComputedStyle(document.documentElement).getPropertyValue('--album-step'))
    expect(step - fitted, 'the pitch is not the fitted page plus one gutter').toBe(SHEET_GAP_PX)
    const scale = parseFloat(
      getComputedStyle(w.find('.album-leaf').element).transform.replace(/^scale\(/, ''),
    )
    expect(Math.round(scale * LEAF_PX), 'scale × leaf stopped being the page under the fit').toBe(fitted)

    expect(w.element.classList.contains('album--fit'), 'the fit class is not on the album root').toBe(true)
    const rail = getComputedStyle(w.find('.album-rail-list').element)
    expect(rail.display, 'the rail still wears the 1280 grid under the fit – ≈134px of chrome eating the sheet').toBe('flex')
    expect(rail.overflowX, 'the strip cannot be panned').toBe('auto')
    // «прибиты к низу»: the air under the frame goes while the column is pinned
    expect(getComputedStyle(w.find('.album-stage').element).marginBottom).toBe('0px')

    w.unmount()
    // ⚠ THE CLEANUP ARM (mutation i): the root outlives mounts – a leftover rung would poison the
    // next mount and the next test alike.
    expect(inlineToken('--album-sheet'), 'unmount left the sheet token on :root').toBe('')
    expect(inlineToken('--album-scale'), 'unmount left the scale token on :root').toBe('')
    expect(inlineToken('--album-step'), 'unmount left the step token on :root').toBe('')
  })

  it('⚠ a tall landscape screen stops at the rung cap – the ceiling is a ceiling, not a size', async () => {
    const w = mountAlbum({ width: 1280, height: 1100 })
    await nextTick()
    expect(inlineToken('--album-sheet')).toBe(`${SHEET_WIDE_PX}px`)
    expect(px(getComputedStyle(w.find('.album-paper').element).width)).toBe(SHEET_WIDE_PX)
    w.unmount()
  })

  it('⚠⚠ a resize re-registers the pan at the NEW pitch (mutation ii: drop the scroll line and this reds)', async () => {
    const w = mountAlbum(DESKTOP, bookOf(6))
    await nextTick()
    const pan = w.find('.album-pan').element as HTMLElement
    const fittedStep = sheetFor(DESKTOP.width, DESKTOP.height)! + SHEET_GAP_PX // 546

    await w.findAll('.album-dot')[3].trigger('click')
    expect(pan.scrollLeft, 'the dot did not land on the fitted pitch').toBe(3 * fittedStep) // 1638

    // Shrink the window under the floor: the fit lets go, the rung returns, and the pan must be
    // RE-REGISTERED at the rung\'s own pitch – `current` is `round(scrollLeft / step)`, so a
    // scrollLeft left in old-pitch units names a sheet the picture is not on (the cross-rung drag
    // bug this handler also fixes).
    setViewport({ width: 1280, height: 500 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(inlineToken('--album-sheet'), 'the floor did not clear the fit').toBe('')
    expect(w.element.classList.contains('album--fit')).toBe(false)
    expect(pan.scrollLeft, 'the pan was not re-registered at the rung pitch').toBe(3 * SHEET_WIDE_STEP_PX) // 2148
    expect(said(w.find('.album-count').text()), 'the pager lost the sheet across the transition').toBe('Sheet 4 of 6')
    w.unmount()
  })

  it('⚠⚠ portrait tablet: the ladder stands, no inline token exists, and the frame gains its 12px of air', async () => {
    const w = mountAlbum(TABLET) // 768x1024
    await nextTick()
    expect(sheetFor(TABLET.width, TABLET.height), 'the oracle itself must refuse portrait').toBeNull()
    expect(inlineToken('--album-sheet'), 'portrait must write no token').toBe('')
    expect(px(getComputedStyle(w.find('.album-paper').element).width), 'the 768 rung moved').toBe(SHEET_TABLET_PX)
    expect(w.element.classList.contains('album--fit')).toBe(false)
    // his second sentence: portrait only gains air under the frame
    expect(getComputedStyle(w.find('.album-stage').element).marginBottom).toBe('12px')
    w.unmount()
  })

  it('⚠ the phone\'s share of the air is 10px, under the base rule', () => {
    const w = mountAlbum({ width: 390, height: 844 })
    expect(getComputedStyle(w.find('.album-stage').element).marginBottom).toBe('10px')
    w.unmount()
  })

  it('⚠⚠ the epilogue host gets the SIZE CEILING only – its own chrome, and never the fit class', async () => {
    // The ending is a fixed takeover whose content continues below the book (the record, the
    // handoff), so the book is ceiling-clamped but never pinned – `closest(\'.ending\')` is the
    // handler\'s host detection, and r48-b3\'s mounted arm reads the same number through the real
    // EndingScreen.
    setViewport({ width: 1024, height: 850 })
    const host = document.createElement('div')
    host.className = 'ending'
    document.body.appendChild(host)
    const w = mount(AlbumScreen, { props: { book: bookOf(4) }, attachTo: host })
    await nextTick()
    const ceiling = sheetFor(1024, 850, 'ending')! // 544
    expect(inlineToken('--album-sheet')).toBe(`${ceiling}px`)
    expect(px(getComputedStyle(w.find('.album-paper').element).width)).toBe(ceiling)
    expect(w.element.classList.contains('album--fit'), 'the ending must never be bottom-pinned').toBe(false)
    w.unmount()
    expect(inlineToken('--album-sheet'), 'the ending host must clean up like the shell').toBe('')
    host.remove()
  })
})
