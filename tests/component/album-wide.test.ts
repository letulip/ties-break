// ⭐⭐⭐ THE ALBUM AT 768 AND 1024 – THE MOUNTED NET (docs/specs/the-album-2026-09.md §6; the owner's
// mockups AX and AW, and the README beside them).
//
// ⚠⚠ WHAT THIS FILE IS ACTUALLY GUARDING, because it is not «does the wide layout look right». The
// README's contract is that the BOOK does not change and only the WINDOW does – «Адаптив меняет
// только окно просмотра, но не порядок, размер и количество страниц» – so every claim below is one
// of two kinds:
//
//   THE WINDOW MOVED   the page is 540 / 556 and fits whole, the pan affordance is gone, the
//                      chapters came out from behind their button;
//   THE BOOK DID NOT   the same sheets in the same order, the pager counting the same real number,
//                      `Back` present and `Career summary` absent, at all three widths.
//
// ⚠ AND ONE MECHANICAL CLAIM UNDERNEATH BOTH: the ladder in `src/style.css` and the constants in
// `albumWire.ts` are two spellings of the README's three numbers, and the film's pitch is a third.
// Nothing in the app can notice them drifting apart – a page half a gutter out of register still
// renders, still pages and still reads as an album – so they are JOINED here: scale × leaf = sheet,
// step − sheet = gutter, and an arrow press moves the film by exactly that step, at each width.
//
// ⚠ MOUNTED AND NOT SOURCE-PINNED (CLAUDE.md's gotcha, and `album-mobile.test.ts`'s own header
// argues it at length for this layer): every number is read off the mounted element through the real
// cascade, because a pin that read `width: 540px` out of a stylesheet would stay green against a
// media query two rules below it that never fires.
//
// ⚠⚠ MUTATION-VERIFIED. Every `it` was watched failing before it was believed; the measured reds are
// in this file's own ledger at the bottom.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// ⚠⚠ THE APP'S OWN SHEET, AND HERE IT IS THE SUBJECT AND NOT THE BACKDROP. The three page sizes are
// `--album-sheet` on `:root` in this file; without the import every `var()` below resolves to
// nothing and the whole ladder reads as absent, which is the correct behaviour and is why the import
// is not optional.
import '../../src/style.css'

import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import AlbumChapterRail from '../../src/components/album/AlbumChapterRail.vue'
import {
  LEAF_PX,
  SHEET_DESKTOP_PX,
  SHEET_DESKTOP_STEP_PX,
  SHEET_GAP_PX,
  SHEET_PX,
  SHEET_STEP_PX,
  SHEET_TABLET_PX,
  SHEET_TABLET_STEP_PX,
} from '../../src/components/album/albumWire'
import { DESKTOP, TABLET, setViewport, type Viewport } from './fits'
import { bookOf, chapterOf } from './albumFixture'

/** ⚠ 1024 EXACTLY, AND IT IS NOT `fits.ts`'s DESKTOP. That one is 1280 – the top of the band, where
 *  the width cap is read – and this one is the BOTTOM of it, which is the number mockup AW is drawn
 *  at and the only place where «556 of page plus two arrows fits in the reading column» is tight
 *  enough to be a claim. Both are exercised below: the ladder is asserted at 1024 and at 1280, so a
 *  rule that only holds at one end of the desktop band is caught. */
const DESKTOP_1024: Viewport = { width: 1024, height: 850 }
const MOBILE: Viewport = { width: 390, height: 844 }

/** The three widths, with the page each one is supposed to draw. */
const LADDER = [
  { name: '390', vp: MOBILE, sheet: SHEET_PX, step: SHEET_STEP_PX },
  { name: '768', vp: TABLET, sheet: SHEET_TABLET_PX, step: SHEET_TABLET_STEP_PX },
  { name: '1024', vp: DESKTOP_1024, sheet: SHEET_DESKTOP_PX, step: SHEET_DESKTOP_STEP_PX },
  { name: '1280', vp: DESKTOP, sheet: SHEET_DESKTOP_PX, step: SHEET_DESKTOP_STEP_PX },
] as const

/** The two wide ones – what this file is about. */
const WIDE = LADDER.filter((w) => w.name !== '390')

const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** ⚠ VIEWPORT FIRST, THEN MOUNT, ALWAYS. happy-dom evaluates a media query on an element's first
 *  computed-style read and caches it there (`fits.ts`'s note, measured 04.09), so a viewport set
 *  after mounting measures the previous screen and looks exactly like a rule that is missing. */
function mountAlbum(vp: Viewport, book = bookOf(4)) {
  setViewport(vp)
  return mount(AlbumScreen, { props: { book }, attachTo: document.body })
}

/** A number out of a computed length. NaN when there is nothing to read, so a missing declaration
 *  fails an assertion instead of quietly becoming zero. */
const px = (value: string): number => parseFloat(value)

describe('the ladder is the README\'s three widths, and nothing drifts off it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 1. THE PAGE IS THE SIZE HIS README SAYS, AT EACH WIDTH
  // ===============================================================================================
  //
  // «AW / AX: квадратный лист виден целиком (556px / 540px)», and at 390 it stays 470 and pans. The
  // width is read off the mounted paper through the real cascade for the reason the phone's own file
  // gives: this layer is all layout, and a stylesheet pin cannot see the rule that cancels it.
  it('⚠⚠ the page measures 470 / 540 / 556 at 390 / 768 / 1024', () => {
    for (const { name, vp, sheet } of LADDER) {
      const w = mountAlbum(vp)
      const paper = w.find('.album-paper')
      expect(paper.exists(), `no page was drawn at ${name}`).toBe(true)
      expect(px(getComputedStyle(paper.element).width), `the page is the wrong size at ${name}`).toBe(
        sheet,
      )
      w.unmount()
    }
  })

  // ===============================================================================================
  // 2. THE THREE SPELLINGS OF ONE NUMBER, JOINED
  // ===============================================================================================
  //
  // ⚠ THIS IS THE TEST THAT MAKES THE REST HONEST. The page's size, the scale the collage is drawn
  // at and the pitch the film is laid out at are three declarations that must agree, and CSS cannot
  // derive any of them from the others (a length divided by a length is not a number `calc()` will
  // hand back here, and happy-dom evaluates no `calc()` at all). So they are spelled out – and a
  // spelled-out derived number is exactly what this repo keeps paying for, unless something asserts
  // the derivation.
  it('⚠⚠ scale × leaf is the page, at every width', () => {
    for (const { name, vp, sheet } of LADDER) {
      const w = mountAlbum(vp)
      const paper = w.find('.album-paper')
      const leaf = w.find('.album-leaf')
      expect(leaf.exists(), `the collage has no reference frame at ${name}`).toBe(true)

      const leafCs = getComputedStyle(leaf.element)
      expect(px(leafCs.width), 'the 470-space stopped being 470 – every collage is drawn against it').toBe(
        LEAF_PX,
      )
      const scale = parseFloat(leafCs.transform.replace(/^scale\(/, ''))
      expect(Number.isFinite(scale), `the page does not scale its collage at ${name}`).toBe(true)
      expect(
        Math.round(scale * LEAF_PX),
        `at ${name} the collage is drawn at ${Math.round(scale * LEAF_PX)}px on a ${sheet}px page`,
      ).toBe(px(getComputedStyle(paper.element).width))
      w.unmount()
    }
  })

  it('⚠⚠ the film\'s pitch is the page plus one gutter, at every width', () => {
    for (const { name, vp, sheet, step } of LADDER) {
      // ⚠⚠ THE MOUNT IN FRONT OF THIS READ IS NOT DECORATION, and it cost a red to find. happy-dom
      // caches a computed style against the element it was read on and re-evaluates the media
      // queries when the tree changes – and `document.documentElement` is the ONE element that
      // outlives every mount in a file, so reading the root after a bare `setViewport` hands back
      // the PREVIOUS viewport's answer. Measured here, 19.09: `--album-step` came back 486px at 768
      // with nothing mounted in front of it, and 556px with the screen mounted first. ⚠ THE
      // COMPONENT CANNOT HIT THIS – it reads the token from `onMounted`, which is an insertion by
      // definition – and a browser recomputes either way; it is a property of this runner, and of
      // any test that reads a token off the root.
      const w = mountAlbum(vp)
      const declared = px(
        getComputedStyle(document.documentElement).getPropertyValue('--album-step'),
      )
      expect(declared, `the film has no declared pitch at ${name}`).toBe(step)
      expect(
        declared - sheet,
        `at ${name} the pitch is ${declared} against a ${sheet}px page – ${declared - sheet} of gutter`,
      ).toBe(SHEET_GAP_PX)
      w.unmount()
    }
  })

  // ===============================================================================================
  // 3. …AND THE SCROLLER IS LAID OUT AT THAT PITCH, WHICH IS THE ONLY WAY TO KNOW IT
  // ===============================================================================================
  //
  // ⚠ A DECLARATION IS NOT A MECHANISM. The two tests above prove the stylesheet agrees with itself;
  // this one proves the SCRIPT reads the same number. It is the regression the wide widths were most
  // likely to ship: the pitch was a bundled constant while the page was only ever 470 wide, and a
  // film laid out 556 apart but scrolled 486 at a time lands every page two thirds of a gutter out of
  // register – which still renders, still pages, and looks like a rounding bug forever.
  it('⚠⚠ an arrow moves the film by the width\'s own pitch, not by the phone\'s', async () => {
    for (const { name, vp, step } of LADDER) {
      const w = mountAlbum(vp)
      const pan = w.find('.album-pan').element as HTMLElement

      await w.find('.album-pager .album-step:last-of-type').trigger('click')
      expect(pan.scrollLeft, `the next arrow moved the film wrong at ${name}`).toBe(step)
      expect(said(w.find('.album-count').text()), `the pager lost the page at ${name}`).toBe(
        'Sheet 2 of 4',
      )

      await w.findAll('.album-dot')[3].trigger('click')
      expect(pan.scrollLeft, `a dot moved the film wrong at ${name}`).toBe(step * 3)
      expect(said(w.find('.album-count').text())).toBe('Sheet 4 of 4')
      w.unmount()
    }
  })
})

describe('at 768 and 1024 the page fits, and the window says so', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 4. THE WINDOW IS EXACTLY ONE PAGE WIDE
  // ===============================================================================================
  //
  // «квадратный лист виден целиком» has two halves and only one of them is the page's size. A 556px
  // page inside a 772px window is also «whole», with 196px of the NEXT page standing behind the
  // arrow – which is not what AW draws and not what one-sheet paging means. So the window is clipped
  // to the page: same film, same `scrollLeft`, one page visible.
  it('⚠⚠ the film\'s window is the page and no more, at both wide widths', () => {
    for (const { name, vp, sheet } of WIDE) {
      const w = mountAlbum(vp)
      const cs = getComputedStyle(w.find('.album-pan').element)
      expect(px(cs.width), `the window is not one page wide at ${name}`).toBe(sheet)
      expect(
        px(getComputedStyle(w.find('.album-paper').element).width),
        `the page and its window disagree at ${name}`,
      ).toBe(px(cs.width))
      // The phone's gutter compensation goes with the gutter: with padding the snap point for sheet
      // N is `gutter + N × step`, and `goTo` scrolls to `N × step`.
      expect(px(cs.paddingLeft) || 0, `the window still pays the app's gutter at ${name}`).toBe(0)
      w.unmount()
    }
  })

  // ===============================================================================================
  // 5. ⚠⚠ THE PAN AFFORDANCE IS ABSENT, NOT INVISIBLE
  // ===============================================================================================
  //
  // The edge gradient and the «Left half» pill describe a mechanism this width does not have: there
  // is no half of a page off screen and no edge for a gradient to fade into. `display: none` takes
  // the box AND the accessibility node (src/style.css states exactly this beside `.rail-dash`), which
  // is why it is the house's answer to «only on one width» rather than a `v-if` on `matchMedia`.
  //
  // ⚠ THE TEST NAMES THE FAILURE IT IS FOR. `opacity: 0` and `visibility: hidden` both make the two
  // objects invisible and leave them in the tree, hittable by the first and announced by neither –
  // and that is the state somebody reaches for when a wide layout has a stray gradient in it. So the
  // assertion is `display: none` exactly, and the two near-misses are called out by name.
  it('⚠⚠ the edge gradient and the half-indicator are gone at 768 and 1024 – not faded', () => {
    for (const { name, vp } of WIDE) {
      const w = mountAlbum(vp)
      for (const sel of ['.album-edge', '.album-half']) {
        const el = w.find(sel)
        if (!el.exists()) continue // gone from the tree entirely is stronger still
        const cs = getComputedStyle(el.element)
        expect(cs.display, `${sel} is still drawn at ${name}`).toBe('none')
      }
      w.unmount()
    }
  })

  it('...and at 390 both are drawn, which is what makes the claim above a claim', () => {
    const w = mountAlbum(MOBILE)
    for (const sel of ['.album-edge', '.album-half']) {
      const el = w.find(sel)
      expect(el.exists(), `${sel} is missing from the phone`).toBe(true)
      expect(getComputedStyle(el.element).display, `${sel} stopped being drawn on a phone`).not.toBe(
        'none',
      )
    }
    w.unmount()
  })

  // ===============================================================================================
  // 6. THE ARROWS STAND AT THE PAGE'S SIDES
  // ===============================================================================================
  //
  // ⚠ WHY THIS IS A PLACEMENT CLAIM AND NOT A BOX MEASUREMENT: happy-dom runs no layout engine, so
  // «the arrow is 12px left of the page» is not a question this runner can answer at all. What it CAN
  // answer is which grid area each control was placed in, and that is the whole of the mockup's move
  // – the two arrows leave the row under the page and take the table on either side of it.
  //
  // ⚠ AND THE SECOND HALF IS THAT NOTHING WAS DUPLICATED TO DO IT. Two arrows in the tree, at every
  // width, is what keeps the accessibility tree identical across the ladder; a wide-only pair with
  // the phone's pair hidden beside it would be two controls with one name.
  it('⚠ the two arrows move to the page\'s sides, and there are still only two of them', () => {
    for (const { name, vp } of WIDE) {
      const w = mountAlbum(vp)
      const arrows = w.findAll('.album-pager .album-step')
      expect(arrows, `the pager lost an arrow at ${name}`).toHaveLength(2)

      const cs = getComputedStyle(w.find('.album').element)
      expect(
        cs.gridTemplateAreas.replace(/\s+/g, ' '),
        `the wide frame is not a grid at ${name}`,
      ).toContain('prev sheet next')
      expect(
        getComputedStyle(w.find('.album-foot').element).display,
        `the foot still boxes its children at ${name}, so nothing of it can reach the page's sides`,
      ).toBe('contents')
      expect(getComputedStyle(arrows[0].element).gridArea, `the ‹ arrow is not beside the page at ${name}`)
        .toContain('prev')
      expect(getComputedStyle(arrows[1].element).gridArea, `the › arrow is not beside the page at ${name}`)
        .toContain('next')
      w.unmount()
    }
  })

  it('...and at 390 the frame is not a grid at all, so the arrows stay under the page', () => {
    const w = mountAlbum(MOBILE)
    expect(getComputedStyle(w.find('.album').element).display, 'the phone grew the wide frame').toBe(
      'flex',
    )
    expect(getComputedStyle(w.find('.album-foot').element).display, 'the phone lost its foot').toBe(
      'flex',
    )
    w.unmount()
  })
})

describe('the chapters change shape three times and stay the same list', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const book = () => ({
    chapters: [chapterOf(1, 0, 2), chapterOf(2, 2, 2), chapterOf(3, 4, 2)],
    sheets: bookOf(6).sheets,
  })

  // ===============================================================================================
  // 7. A GRID AT 1024, A STRIP THAT PANS AT 768, A BUTTON AT 390
  // ===============================================================================================
  //
  // The README gives each shape its reason: at 1024 «все 6 глав сеткой под листом», at 768 «та же
  // лента, скроллится горизонтально», and on a phone the rail «занял бы полэкрана», so it is a press.
  it('⚠ 1024 – a grid under the page, with no scroller left in it', () => {
    const w = mountAlbum(DESKTOP_1024, book())
    const list = w.find('.album-rail-list')
    expect(list.exists(), 'there is no chapter rail on a desktop').toBe(true)
    const cs = getComputedStyle(list.element)
    expect(cs.display, 'the chapters are not a grid at 1024').toBe('grid')
    expect(cs.overflowX, 'the grid still declares a scroller – that is the 768 strip in disguise').toBe(
      'visible',
    )
    expect(w.findAll('.album-rail-plate'), 'the grid is not the career\'s own chapters').toHaveLength(3)
    w.unmount()
  })

  it('⚠ 768 – the same plates in one row that pans sideways', () => {
    const w = mountAlbum(TABLET, book())
    const cs = getComputedStyle(w.find('.album-rail-list').element)
    expect(cs.display, 'the strip is not a row at 768').toBe('flex')
    expect(cs.overflowX, 'the strip cannot be panned, so its later chapters are unreachable').toBe(
      'auto',
    )
    expect(w.findAll('.album-rail-plate')).toHaveLength(3)
    w.unmount()
  })

  it('⚠⚠ 390 – the rail is gone and the button is back', () => {
    const w = mountAlbum(MOBILE, book())
    expect(
      getComputedStyle(w.find('.album-rail').element).display,
      'the rail is standing open on a phone – it would take half the screen',
    ).toBe('none')
    expect(
      getComputedStyle(w.find('.album-chapters-btn').element).display,
      'the phone lost its Chapters door',
    ).not.toBe('none')
    w.unmount()
  })

  it('⚠ ...and past 768 the button closes, because the room it opens is already on the page', () => {
    for (const { name, vp } of WIDE) {
      const w = mountAlbum(vp, book())
      expect(
        getComputedStyle(w.find('.album-chapters-btn').element).display,
        `two doors to the same list at ${name}`,
      ).toBe('none')
      w.unmount()
    }
  })

  // ===============================================================================================
  // 8. THE RAIL IS A WAY THROUGH THE BOOK, NOT A PICTURE OF IT
  // ===============================================================================================
  it('⚠⚠ a plate pans the film to that chapter\'s first sheet, at both wide widths', async () => {
    for (const { name, vp, step } of WIDE) {
      const w = mountAlbum(vp, book())
      await w.findAll('.album-rail-plate')[2].trigger('click')

      expect(
        (w.find('.album-pan').element as HTMLElement).scrollLeft,
        `the third chapter's plate did not open it at ${name}`,
      ).toBe(step * 4)
      expect(said(w.find('.album-count').text())).toBe('Sheet 5 of 6')
      w.unmount()
    }
  })

  it('⚠ the plate is a NUMBER, never a photograph – a 40px drop zone cannot hold a frame\'s hint', () => {
    const w = mountAlbum(DESKTOP_1024, book())
    const rail = w.find('.album-rail')
    expect(rail.findAll('img'), 'the chapter plates reach for pictures').toHaveLength(0)
    expect(said(rail.findAll('.album-rail-no')[1].text()), 'the plate does not carry its number').toBe(
      '2',
    )
    w.unmount()
  })

  // ⚠ INVARIANT 4, THE POSITIVE ARM, FOR THE ONE COMPONENT THIS WAVE ADDED. `album-mobile.test.ts`
  // scans every file under `components/album/` for a sentence typed into a template and this file is
  // now in that scan; what a scan cannot say is that what the rail DOES render is the engine's. So:
  // mounted with known chapters, the rail says their words and nothing else of its own.
  it('⚠⚠ every word on a plate arrives on the chapter – the rail authors none of them', () => {
    setViewport(DESKTOP_1024)
    const chapters = [chapterOf(1, 0, 2), chapterOf(2, 2, 2)]
    const w = mount(AlbumChapterRail, {
      props: { chapters, currentChapter: 1 },
      attachTo: document.body,
    })
    for (const c of chapters) {
      const plate = w.findAll('.album-rail-plate')[c.index - 1]
      expect(said(plate.find('.album-rail-no').text())).toBe(String(c.index))
      expect(said(plate.find('.album-rail-title').text())).toBe(c.title)
      expect(said(plate.find('.album-rail-age').text())).toBe(c.ageLabel)
      // ⚠ AND NOTHING ELSE ON THE PLATE, which is the half the three reads above cannot say. The
      // whitespace is stripped from both sides rather than collapsed: the three spans are laid out
      // by the flex box around them and the template puts no text between them, so what is rendered
      // is `1Chapter 1Age 5 – 8` – the separation is the layout's, not a character's. Comparing with
      // spaces in it would be asserting a typographic accident.
      const tight = (s: string): string => s.replace(/\s+/g, '')
      expect(tight(plate.text()), `chapter ${c.index} says something of the rail's own`).toBe(
        tight(`${c.index}${c.title}${c.ageLabel}`),
      )
    }
    w.unmount()
  })
})

describe('the book does not change when the window does', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 9. THE COUNT IS THE CAREER'S, AT EVERY WIDTH
  // ===============================================================================================
  //
  // ⚠ NEVER TWELVE, and never twelve at a WIDER width either. The mockups say «Sheet 1 of 12» at all
  // three sizes because the mockup has twelve sheets; spec §3 rules the real number. This is the
  // claim a responsive pass is most likely to break by accident, because a wide layout is usually
  // built against the picture.
  it('⚠⚠ the counter and the dots are the book\'s own length at 390, 768 and 1024', () => {
    for (const { name, vp } of LADDER) {
      for (const n of [1, 7, 13]) {
        const w = mountAlbum(vp, bookOf(n))
        expect(said(w.find('.album-count').text()), `a ${n}-sheet album miscounts itself at ${name}`)
          .toBe(`Sheet 1 of ${n}`)
        expect(w.findAll('.album-dot'), `wrong number of dots at ${name}`).toHaveLength(n)
        w.unmount()
      }
    }
  })

  it('⚠ every sheet the book holds is still in the film at every width', () => {
    for (const { name, vp } of LADDER) {
      const w = mountAlbum(vp, bookOf(9))
      expect(w.findAll('.album-sheet'), `the film dropped pages at ${name}`).toHaveLength(9)
      w.unmount()
    }
  })

  // ===============================================================================================
  // 10. BACK AT EVERY WIDTH, AND NO CAREER SUMMARY AT ANY
  // ===============================================================================================
  //
  // Both are rulings of his and they point opposite ways. `Back`: «тогда как раз кнопка Back
  // пригодится, как в макетах» – the album is reachable from Home mid-career, so a screen you can
  // enter is a screen you must be able to leave, at every size. `Career summary`: «наверное она не
  // нужна тоже» – it is on AW and AX and it is not built, and an absence has to be pinned or it comes
  // back the next time somebody reads the picture. This time it was read twice.
  it('⚠ Back is present and works at 390, 768 and 1024', async () => {
    for (const { name, vp } of LADDER) {
      const w = mountAlbum(vp)
      const back = w.find('.album-back')
      expect(back.exists(), `there is no way out of the album at ${name}`).toBe(true)
      expect(getComputedStyle(back.element).display, `Back is not drawn at ${name}`).not.toBe('none')
      expect(back.attributes('aria-label'), `the way out is unnamed at ${name}`).toBeTruthy()
      await back.trigger('click')
      expect(w.emitted('back'), `Back filed nothing at ${name}`).toHaveLength(1)
      w.unmount()
    }
  })

  it('⚠⚠ no Career summary button at any width, including the two the mockups draw it on', () => {
    for (const { name, vp } of LADDER) {
      const w = mountAlbum(vp)
      expect(
        said(w.text()).toLowerCase(),
        `the Career summary button came back off the mockup at ${name}`,
      ).not.toContain('career summary')
      w.unmount()
    }
  })
})

// =================================================================================================
// ⚠⚠ THE MUTATION LEDGER – every claim above was watched failing before it was believed.
// =================================================================================================
//
// Measured on this branch, one mutation at a time, restored between each and the file diffed after
// every application so that a no-op could not be read as a green arm:
// `npx vitest run --project component tests/component/album-wide.test.ts tests/component/album-mobile.test.ts`
// – 20 tests in this file, 22 in the phone's. The counts are what the runner printed, not what was
// predicted; where the two differed it says so.
//
// A. THIS FILE'S OWN CLAIMS
//  1. `--album-sheet` at 768 -> 470px (the page refuses to grow)      -> 3 RED here, 0 in mobile
//  2. `--album-step` at 1024 -> 486px (the phone's pitch, kept)       -> 3 RED here, 0 in mobile
//  3. `--album-scale` at 1024 -> 1 (the page grows, the collage does not) -> 1 RED here
//  4. `.album-edge, .album-half { display: none }` -> `opacity: 0`    -> 1 RED here
//     ⭐ THE MUTATION THIS TEST EXISTS FOR: the affordance is invisible and still in the tree, which
//     is the state a wide layout reaches for when it has a stray gradient on it.
//  5. `.album-pan { width: var(--album-sheet) }` deleted at 768+      -> 1 RED here
//     ⚠ PREDICTED 2, MEASURED 1: the page's size and its window's are asserted in the same `it`, so
//     the two halves of «it fits whole» cannot fail separately. Said here rather than left for
//     somebody to re-derive.
//  6. `.album-chapters-btn { display: none }` deleted at 768+         -> 1 RED here
//  7. `.album-rail { display: none }` (the base state) deleted        -> 1 RED here, 0 in mobile
//     ⚠ THE ZERO IS THE POINT: the phone's own file asks whether `.album-chapters-card` is open, not
//     whether a rail is drawn, so a rail appearing on a phone is invisible to it. That is exactly
//     why this arm is here rather than there.
//  8. the rail's `@media (min-width: 1024px)` block deleted           -> 1 RED here
//  9. `AlbumScreen.vue`: `readStep` pinned to `SHEET_STEP_PX`         -> 2 RED here, 0 in mobile
//     ⭐ AND THE ZERO IS THE WHOLE ARGUMENT FOR THIS FILE: at 390 the constant IS the pitch, so the
//     phone's net cannot see the wide widths losing theirs.
// 10. `.album-foot { display: contents }` deleted at 768+             -> 1 RED here
// 11. a «Career summary» pill added to the foot                       -> 1 RED here, 3 in mobile
//     (theirs counts two more because the added pill reuses `.album-chapters-btn` and `find` takes
//     it instead of the real one – their ledger's own note on the same mutation, unchanged)
//
// B. THE PREVIOUS BUILDER'S ARMS, RE-MEASURED UNDER THE NEW MECHANISM
//    One of their fifteen mutations no longer exists as written, because the number it mutated moved
//    out of the bundle and into the cascade. It was re-run in its new spelling, and it and the two
//    arms this wave's script changes could have weakened still measure what their ledger records:
//  1'. their #1 (`AlbumPaper`'s width binding -> `100%`) is now the CSS declaration
//      `width: var(--album-sheet)` -> `100%`                          -> 1 RED in mobile (as recorded)
//      …and 3 RED here, which is the same claim arriving from the other side.
//  5'. their #5 (`current` pinned to 0) is unchanged in spelling      -> 3 RED in mobile (as recorded)
//  7'. their #7 (the counter's `sheets.length` -> 12)                 -> 5 RED in mobile (as recorded)
//      …and 3 RED here.
