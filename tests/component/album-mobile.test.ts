// ⭐⭐⭐ THE ALBUM AT 390 – THE MOUNTED NET (docs/specs/the-album-2026-09.md §3, §4, §6; the owner's
// mockups AY and AZ).
//
// ⚠ MOUNTED AND NOT SOURCE-PINNED, which is CLAUDE.md's own gotcha and is load-bearing here more
// than usual: this layer is ALL layout. A pin that read `width: 470px` out of the stylesheet would
// stay green against a `max-width: 100%` two rules below it that cancels it, and "the sheet is not
// squeezed to the phone" is the single claim the whole design rests on. So the width is read off the
// mounted element through the real cascade (`css: true`), the pan is driven by moving `scrollLeft`
// and the parts of each layout are counted in the rendered tree.
//
// ⚠⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed. The measured
// reds are recorded against each block in this file's own ledger, at the bottom.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync, readdirSync } from 'node:fs'
// ⚠ `resolve(__dirname, …)` AND NOT `new URL(…, import.meta.url)`. In the component project a test
// file's `import.meta.url` is not a `file:` URL (happy-dom's document base is an http one), so
// `fileURLToPath` throws on it – measured here, 19.09. `tests/component/a11y-sweep.test.ts` reads
// the tree the same way for the same reason.
import { join, resolve } from 'node:path'

// ⚠⚠ THE APP'S OWN SHEET, BECAUSE `.dialog-overlay` AND `.dialog-card` LIVE IN IT. The round-20
// measurement reads the overlay's `position: fixed` and the card's `max-height` off the real
// cascade; without this import both resolve to nothing and `measureDialog` refuses to answer, which
// is the correct behaviour and is also why every other dialog test here imports it.
import '../../src/style.css'

import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import { SHEET_PX, SHEET_STEP_PX } from '../../src/components/album/albumWire'
import { ALBUM_CORPUS } from '../../src/engine/world/albumCorpus'
import { region } from '../helpers/source'
import { PHONE, assertDismissReachable, setViewport } from './fits'
import { bookOf, chapterOf, hand, sheetOf } from './albumFixture'

/** One `.vue` file, read whole.
 *
 *  ⚠ THE PATH IS A VARIABLE AND NEVER AN INLINE LITERAL, and `tests/worldSource.ts`'s
 *  `componentFile()` CANNOT be used from this project for exactly that reason: Vite rewrites an
 *  inline `new URL('…', import.meta.url)` into its own asset resolver and the result is an http URL,
 *  so `readFileSync` throws «The URL must be of scheme file». Measured here, and
 *  `round36-rail-dashboard.test.ts` carries the identical helper with the identical note.
 *
 *  ⚠ IT IS THE `.vue` ALONE – never widened to the components it imports – which is what the
 *  NEGATIVE claim below requires (CLAUDE.md's pin hygiene). */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

/** What a sentence looks like when it ends: two lowercase letters and a full stop, a bang or a
 *  question mark. Chrome carries none of these – «Chapter of», «Left half», «Close», «Sheet of». */
const SENTENCE = /[a-z]{2}[.!?]/g

/** The TEXT NODES of a template – tags removed, and removed properly.
 *
 *  ⚠ A QUOTE-AWARE WALK AND NOT `/<[^>]*>/g`, which is what this started as and which was WRONG in
 *  the way this repo keeps paying for: a `>` inside an attribute value (`:disabled="current >=
 *  sheets.length - 1"`) ends the match early, and the rest of the expression spills into the text
 *  the scanner then reads as prose. It reported `ts.` from `sheets.length` as a sentence. */
function textNodes(template: string): string {
  let out = ''
  let i = 0
  while (i < template.length) {
    const lt = template.indexOf('<', i)
    if (lt === -1) return out + template.slice(i)
    out += ` ${template.slice(i, lt)} `
    let j = lt + 1
    let quote = ''
    while (j < template.length) {
      const c = template[j]
      if (quote) {
        if (c === quote) quote = ''
      } else if (c === '"' || c === "'") quote = c
      else if (c === '>') break
      j++
    }
    i = j + 1
  }
  return out
}

/** The values of STATIC attributes only – `title="…"`, `aria-label="…"`. Bound ones (`:x`, `@x`,
 *  `v-x`) are expressions, and `sheets.length` in an expression is not a sentence however much it
 *  looks like the end of one. */
function staticAttrText(template: string): string {
  return [...template.matchAll(/\s(?![:@]|v-)[a-zA-Z][\w-]*="([^"]*)"/g)].map((m) => m[1]).join(' \n ')
}

const MOBILE = { width: 390, height: 844 }

/** Rendered text with the template's own wrapping collapsed – what a reader sees. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** happy-dom runs no layout, so `scrollLeft` is a plain property here – which is exactly what makes
 *  the pan testable: the component's own arithmetic is done in constants (see `albumWire.ts`), so
 *  moving the property is moving the pan. */
async function panTo(w: ReturnType<typeof mount>, px: number): Promise<void> {
  const pan = w.find('.album-pan')
  ;(pan.element as HTMLElement).scrollLeft = px
  await pan.trigger('scroll')
}

function mountAlbum(book = bookOf(3), vp = MOBILE) {
  setViewport(vp)
  return mount(AlbumScreen, { props: { book }, attachTo: document.body })
}

describe('the album at 390 – the sheet, the pan and the chrome', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 1. THE SHEET IS 470 AND IS NOT SCALED TO THE SCREEN
  // ===============================================================================================
  //
  // The whole design rests on this one refusal. His README measured the alternative: squeezed into a
  // 390 phone's content column the handwriting lands at 9–10px and stops being readable.
  //
  // ⚠ THREE ASSERTIONS AND NOT ONE, because a width can be cancelled three different ways and each
  // of them is a real edit somebody might make "to fix the overflow": a smaller width, a `max-width`
  // that clamps it, and a `flex` shrink that takes it away inside the scroller. All three read off
  // the mounted element, so all three see the cascade the player gets.
  it('⚠ the sheet is 470px at a 390 viewport, with nothing cancelling it', () => {
    const w = mountAlbum()
    const paper = w.find('.album-paper')
    expect(paper.exists(), 'no sheet was drawn at all').toBe(true)

    const cs = getComputedStyle(paper.element)
    expect(cs.width, 'the sheet is not 470px wide').toBe(`${SHEET_PX}px`)
    expect(
      ['', 'none'].includes(cs.maxWidth),
      `the sheet declares max-width: ${cs.maxWidth}, which squeezes it to the phone`,
    ).toBe(true)
    // `flex: none` expands to flex-grow/shrink/basis; the shrink is the half that matters inside a
    // flex row, and `1` is the default that quietly takes the width back.
    expect(cs.flexShrink, 'the sheet shrinks inside the pan, so its width is a suggestion').toBe('0')
    w.unmount()
  })

  it('...and it is square, which is what «квадратный лист» means in CSS', () => {
    const w = mountAlbum()
    expect(getComputedStyle(w.find('.album-paper').element).aspectRatio.replace(/\s/g, '')).toBe('1/1')
    w.unmount()
  })

  // ===============================================================================================
  // 2. THE PAPER IS THE RECIPE HE WROTE DOWN
  // ===============================================================================================
  //
  // ⚠ THE NUMBERS ARE THE CLAIM, not "there is a background". Three `repeating-linear-gradient`s at
  // 41 / 117 / 74 degrees with periods of 3 / 4 / 5px: the angles make the flecks irregular and the
  // coprime periods are what stop the overlay from banding. A file or an SVG filter would be the
  // other two ways to get a texture and the README rules both out – the filter because it comes out
  // empty on raster export.
  it('⚠ the paper is CSS alone – his three angles, his three periods, no file and no filter', () => {
    const w = mountAlbum()
    const cs = getComputedStyle(w.find('.album-paper').element)
    const bg = cs.backgroundImage

    for (const [deg, period] of [
      ['41deg', '3px'],
      ['117deg', '4px'],
      ['74deg', '5px'],
    ]) {
      expect(bg, `the ${deg} ruling is missing from the paper`).toContain(`repeating-linear-gradient(${deg}`)
      expect(bg, `no ruling repeats at ${period}`).toContain(period)
    }
    // Two aged corners and the wash from the top left – three radial gradients in all.
    expect(bg.match(/radial-gradient/g)?.length ?? 0, 'the ageing and the wash are not both there').toBeGreaterThanOrEqual(3)
    expect(bg, 'the paper reaches for a file – the README forbids it').not.toContain('url(')
    expect(bg + cs.filter, 'an SVG filter is on the paper – it renders empty on raster export').not.toContain('#')
    // happy-dom hands back the declared value rather than a resolved rgb() triple.
    expect(cs.backgroundColor.replace(/\s/g, '').toLowerCase(), 'the stock is not his #e7dcc2').toBe('#e7dcc2')
    w.unmount()
  })

  // ===============================================================================================
  // 3. THE PAN, AND THE INDICATOR THAT TRACKS IT
  // ===============================================================================================
  //
  // The scroller holds every sheet in a row, so panning right off one page continues onto the next –
  // the README's «тот же скролл продолжается на вторую половину разворота». The indicator names
  // which half of the spread you are on, and the pager follows the same `scrollLeft`: one state, so
  // the two can never disagree.
  it('⚠ the pan is a real scroller and the sheets sit in it one after another', () => {
    const w = mountAlbum(bookOf(4))
    const cs = getComputedStyle(w.find('.album-pan').element)
    expect(cs.overflowX, 'the sheets cannot be panned – there is nothing to scroll').toBe('auto')
    expect(w.findAllComponents(AlbumSheet), 'the film does not hold every sheet').toHaveLength(4)
    w.unmount()
  })

  it('⚠⚠ panning one sheet along flips the indicator and moves the pager with it', async () => {
    const w = mountAlbum(bookOf(4))
    expect(said(w.find('.album-half-label').text())).toBe('Left half')
    expect(w.find('.album-half-track').classes()).not.toContain('is-right')
    expect(said(w.find('.album-count').text())).toBe('Sheet 1 of 4')

    await panTo(w, SHEET_STEP_PX)
    expect(said(w.find('.album-half-label').text()), 'the indicator did not follow the pan').toBe('Right half')
    expect(w.find('.album-half-track').classes(), 'the track did not move with its own label').toContain('is-right')
    expect(said(w.find('.album-count').text()), 'the pager did not follow the pan').toBe('Sheet 2 of 4')

    // And on again: the third sheet is the left-hand page of the next spread.
    await panTo(w, SHEET_STEP_PX * 2)
    expect(said(w.find('.album-half-label').text())).toBe('Left half')
    expect(said(w.find('.album-count').text())).toBe('Sheet 3 of 4')
    w.unmount()
  })

  it('...and a pan that stops half way still belongs to the sheet it is mostly on', async () => {
    const w = mountAlbum(bookOf(4))
    // A third of the way across the first sheet is still the first sheet – the pan is meant to stop
    // anywhere inside a page, which is the whole point of a page wider than the screen.
    await panTo(w, Math.round(SHEET_STEP_PX * 0.3))
    expect(said(w.find('.album-count').text())).toBe('Sheet 1 of 4')
    expect(said(w.find('.album-half-label').text())).toBe('Left half')
    w.unmount()
  })

  it('⚠ the pager arrows and the dots drive the same scroller, not a second counter', async () => {
    const w = mountAlbum(bookOf(5))
    const pan = w.find('.album-pan').element as HTMLElement

    await w.find('.album-pager .album-step:last-of-type').trigger('click')
    expect(pan.scrollLeft, 'the next arrow did not move the pan').toBe(SHEET_STEP_PX)
    expect(said(w.find('.album-count').text())).toBe('Sheet 2 of 5')

    await w.findAll('.album-dot')[4].trigger('click')
    expect(pan.scrollLeft, 'a dot did not move the pan').toBe(SHEET_STEP_PX * 4)
    expect(said(w.find('.album-count').text())).toBe('Sheet 5 of 5')
    w.unmount()
  })

  // ===============================================================================================
  // 4. THE PAGER COUNTS WHAT THE CAREER EARNED
  // ===============================================================================================
  //
  // ⚠ NEVER TWELVE. The mockups say «Sheet 1 of 12» because the mockup has twelve; spec §3 rules the
  // real number: «счётчик внизу считает реальное M, а не двенадцать». A career that earned seven
  // sheets has seven dots and says seven.
  it('⚠⚠ the count and the dots are the book\'s own length, never the mockup\'s twelve', () => {
    for (const n of [1, 7, 13]) {
      const w = mountAlbum(bookOf(n))
      expect(said(w.find('.album-count').text()), `a ${n}-sheet album miscounts itself`).toBe(`Sheet 1 of ${n}`)
      expect(w.findAll('.album-dot'), `a ${n}-sheet album drew the wrong number of dots`).toHaveLength(n)
      w.unmount()
    }
  })

  // ===============================================================================================
  // 5. BACK – HIS RULING OF 19.09, AND THE REASON THE SECTION NEEDED ONE
  // ===============================================================================================
  //
  // The album stopped being only the last screen of a career the moment it was reachable from Home
  // mid-career (spec §8b), and a screen you can enter is a screen you must be able to leave.
  it('⚠ Back exists, is named, and asks the shell to go back', async () => {
    const w = mountAlbum()
    const back = w.find('.album-back')
    expect(back.exists(), 'there is no way out of the album').toBe(true)
    expect(back.attributes('aria-label'), 'the way out has no name a test or a reader could find').toBeTruthy()
    await back.trigger('click')
    expect(w.emitted('back'), 'pressing Back filed nothing').toHaveLength(1)
    w.unmount()
  })

  // ===============================================================================================
  // 6. NO «CAREER SUMMARY» BUTTON – AN ABSENCE THAT IS A RULING
  // ===============================================================================================
  //
  // It is on the mockup and it is not built: «наверное она не нужна тоже» (spec §9). An absence has
  // to be pinned or it comes back the next time somebody reads the picture.
  it('⚠ the bottom bar carries no Career summary button', () => {
    const w = mountAlbum()
    const text = said(w.text()).toLowerCase()
    expect(text, 'the Career summary button came back off the mockup').not.toContain('career summary')
    w.unmount()
  })

  // ===============================================================================================
  // 7. CHAPTERS – A BUTTON AT THIS WIDTH, AND ITS CARD CAN BE CLOSED ON A PHONE
  // ===============================================================================================
  //
  // ⚠⚠ ROUND-20 #3. `AlbumChaptersSheet` is a BLOCKING overlay, so the law applies in full: its
  // dismiss control's box has to land inside a 375x667 viewport through the real cascade, and the
  // card has to be BOUNDED so the next chapter added to a long career cannot push it off again.
  // `assertDismissReachable` checks both halves.
  it('⚠⚠ the Chapters card can be closed on a 375x667 phone, and stays closable when it grows', async () => {
    setViewport(PHONE)
    const long = {
      chapters: Array.from({ length: 5 }, (_, i) => chapterOf(i + 1, i, 3)),
      sheets: bookOf(15).sheets,
    }
    const w = mount(AlbumScreen, { props: { book: long }, attachTo: document.body })
    await w.find('.album-chapters-btn').trigger('click')

    const card = w.find('.album-chapters-card')
    expect(card.exists(), 'the Chapters button opened nothing').toBe(true)
    assertDismissReachable(card.element, w.find('.album-chapters-close').element, PHONE, 'the album\'s Chapters card')
    w.unmount()
  })

  it('⚠ the chapter rail is a BUTTON at this width – a rail would take half the screen', () => {
    const w = mountAlbum()
    expect(w.find('.album-chapters-btn').exists(), 'the Chapters door is gone').toBe(true)
    expect(w.find('.album-chapters-card').exists(), 'the rail is standing open on a phone').toBe(false)
    w.unmount()
  })

  it('...and picking a chapter pans to its first sheet and closes the card', async () => {
    const book = { chapters: [chapterOf(1, 0, 2), chapterOf(2, 2, 2)], sheets: bookOf(4).sheets }
    setViewport(MOBILE)
    const w = mount(AlbumScreen, { props: { book }, attachTo: document.body })
    await w.find('.album-chapters-btn').trigger('click')
    await w.findAll('.album-chapters-row')[1].trigger('click')

    expect((w.find('.album-pan').element as HTMLElement).scrollLeft).toBe(SHEET_STEP_PX * 2)
    expect(said(w.find('.album-count').text())).toBe('Sheet 3 of 4')
    expect(w.find('.album-chapters-card').exists(), 'the card stayed open over the sheet it just opened').toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// 8. THE THREE LAYOUTS, EACH DRAWING ITS OWN PARTS
// =================================================================================================
//
// Spec §3 and mockup AZ. The claim per layout is the LIST of objects the mockup has on it – a sheet
// that silently lost its boarding pass still renders, still paginates and still reads as an album
// page, which is exactly why the parts are counted rather than eyeballed.
describe('the three layouts draw what the mockups have on them', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function sheetAt(layout: 'A' | 'B' | 'C') {
    setViewport(MOBILE)
    return mount(AlbumSheet, { props: { sheet: sheetOf({ layout }) }, attachTo: document.body })
  }

  it('⚠ A – the opener: title, taped hero, note, a second photo over it, the patch, a doodle, a line', () => {
    const w = sheetAt('A')
    expect(w.find('.album-paper').attributes('data-layout')).toBe('A')
    expect(w.find('.album-title-name').exists(), 'the chapter has no name on its own opening page').toBe(true)
    expect(w.find('.album-title-age').exists(), 'the opener does not say which years it covers').toBe(true)
    expect(w.findAll('.tb-polaroid'), 'the opener does not carry two photographs').toHaveLength(2)
    expect(w.find('.tb-polaroid--taped').exists(), 'the hero is not taped down').toBe(true)
    expect(w.find('.album-clip').exists(), 'the second photograph is not clipped to the page').toBe(true)
    expect(w.find('.tb-paper--torn-right').exists(), 'the note has a machine-cut edge').toBe(true)
    expect(w.find('.album-patch').exists(), 'the club patch is missing').toBe(true)
    expect(w.find('.album-doodle').exists(), 'nobody drew on the page').toBe(true)
    expect(w.find('.album-a-line').exists(), 'the loose handwritten line is missing').toBe(true)
    w.unmount()
  })

  it('⚠ B – three photographs and the boarding pass anchoring the bottom', () => {
    const w = sheetAt('B')
    expect(w.find('.album-paper').attributes('data-layout')).toBe('B')
    expect(w.findAll('.tb-polaroid'), 'B is not three photographs').toHaveLength(3)
    expect(w.find('.album-title-name').exists(), 'an ordinary sheet opened a chapter').toBe(false)

    const pass = w.find('.album-pass')
    expect(pass.exists(), 'the boarding pass is missing – the page is decoration, not a trip').toBe(true)
    // The perforation is a dashed border on the stub, and the barcode is the widths the engine sent.
    expect(getComputedStyle(w.find('.album-pass-stub').element).borderLeftStyle, 'the pass has no perforation').toBe('dashed')
    expect(w.findAll('.album-pass-code span').length, 'the barcode has no bars').toBeGreaterThan(6)
    expect(getComputedStyle(pass.element).position, 'the pass is not anchored to the bottom of the sheet').toBe('absolute')
    w.unmount()
  })

  it('⚠ C – one big photograph, and the tall tag on its drawn string', () => {
    const w = sheetAt('C')
    expect(w.find('.album-paper').attributes('data-layout')).toBe('C')
    expect(w.find('.album-title-name').exists(), 'C is an opener and has no chapter name').toBe(true)
    expect(w.findAll('.tb-polaroid'), 'C is the hero plus one smaller frame').toHaveLength(2)
    expect(w.find('.album-tag-card').exists(), 'the baggage tag is missing').toBe(true)
    expect(w.find('.album-tag-string path').exists(), 'the tag is not hanging on anything').toBe(true)
    expect(w.find('.album-tag-hole').exists(), 'the tag has no punched hole').toBe(true)
    expect(w.find('.album-doodle').exists(), 'nobody drew on the page').toBe(true)
    w.unmount()
  })

  it('...and no layout reaches for an image file for its trimmings – they are drawn', () => {
    for (const layout of ['A', 'B', 'C'] as const) {
      const w = sheetAt(layout)
      // The only `<img>` on a sheet is a PHOTOGRAPH. Everything else – tape, clip, patch, pass,
      // tag, doodle – is drawn, which is the README's «всё нарисовано кодом».
      const imgs = w.findAll('img')
      expect(imgs.length, `layout ${layout} draws its trimmings with pictures`).toBe(
        w.findAll('.tb-polaroid').length,
      )
      w.unmount()
    }
  })
})

// =================================================================================================
// 9. ⚠⚠ INVARIANT 4 – NOT ONE SENTENCE ON A SHEET IS THIS LAYER'S
// =================================================================================================
//
// Every word of handwriting is the owner's, generated from his document into
// `src/engine/world/albumCorpus.ts`. This is the assertion that catches the edit nobody means to
// make: somebody fixing a layout types the mockup's caption into the template "as a placeholder",
// and it ships. A copy-review cannot catch it, because the page looks exactly as it should.
//
// Two arms, and they fail differently:
//   POSITIVE – what the sheet renders IS the corpus's three registers, character for character;
//   NEGATIVE – no component under `components/album/` carries a sentence of its own, and no corpus
//              string exists anywhere in `src/` outside the corpus itself.
describe('every sentence on a sheet comes from the corpus', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ the note, the caption and the loose line are the corpus\'s own strings', () => {
    const words = hand('first-court', 'deep')
    setViewport(MOBILE)
    const w = mount(AlbumSheet, {
      props: { sheet: sheetOf({ layout: 'A', occasion: 'first-court', voice: 'deep' }) },
      attachTo: document.body,
    })
    const text = said(w.text())
    expect(text, 'the note is not the one the engine handed over').toContain(words.note)
    expect(text, 'the caption on the lip is not the corpus\'s').toContain(words.caption)
    expect(text, 'the loose line is not the corpus\'s').toContain(words.line)
    w.unmount()
  })

  it('...and the voice is the one the engine chose, not one this layer picked', () => {
    setViewport(MOBILE)
    const fiery = hand('first-court', 'fiery')
    const w = mount(AlbumSheet, {
      props: { sheet: sheetOf({ layout: 'A', occasion: 'first-court', voice: 'fiery' }) },
      attachTo: document.body,
    })
    expect(said(w.text())).toContain(fiery.note)
    expect(said(w.text()), 'the sheet renders a voice it was not given').not.toContain(hand('first-court', 'quiet').note)
    w.unmount()
  })

  // ⚠ A NEGATIVE CLAIM ABOUT A FILE, SO IT READS THE `.vue` ALONE (`sfc` above) AND NEVER WIDENS TO
  // the components it imports – tests/pin-hygiene.test.ts's rule, and the reason it exists.
  const ALBUM_DIR = resolve(__dirname, '../../src/components/album')
  const albumFiles = readdirSync(ALBUM_DIR).filter((f) => f.endsWith('.vue'))

  it('⚠⚠ no album component carries a sentence of its own in its template', () => {
    expect(albumFiles.length, 'the scan found no components – it would pass on anything').toBeGreaterThan(6)
    const offenders: string[] = []

    for (const file of [
      ...albumFiles.map((f) => `../../src/components/album/${f}`),
      '../../src/components/screens/AlbumScreen.vue',
    ]) {
      const template = region(sfc(file), '<template>', '</template>').replace(/<!--[\s\S]*?-->/g, '')
      // A binding is the engine's word arriving, not this file's.
      const text = textNodes(template).replace(/\{\{[\s\S]*?\}\}/g, ' ')
      const written = [...text.match(SENTENCE) ?? [], ...staticAttrText(template).match(SENTENCE) ?? []]
      if (written.length) offenders.push(`${file}: ${written.join(' ')}`)
    }
    expect(
      offenders.join('\n'),
      'a sentence was typed into a template – the handwriting is the corpus\'s (invariant 4)',
    ).toBe('')
  })

  it('...and that scan can actually see a sentence when there is one', () => {
    // ⚠ ANTI-VACUITY, AND IT IS NOT DECORATION HERE. The first version of the stripper above used
    // `/<[^>]*>/g` for tags and stopped at the `>` inside `:disabled="current >= sheets.length - 1"`,
    // which spilled an expression into the "text" it was reading and reported `ts.` as a sentence.
    // That is this repo's standing failure – a search that quietly answers a different question – so
    // the scanner is proved on a fixture in both directions rather than trusted.
    const clean = '<div :disabled="a >= b.length - 1">{{ sheet.line }}</div>'
    expect(textNodes(clean).replace(/\{\{[\s\S]*?\}\}/g, ' ').match(SENTENCE)).toBeNull()
    const dirty = '<p>She asked if she could try.</p>'
    expect(textNodes(dirty).match(SENTENCE), 'the scanner cannot see a sentence at all').not.toBeNull()
    const titled = '<p title="She asked if she could try.">{{ x }}</p>'
    expect(staticAttrText(titled).match(SENTENCE), 'a sentence in an attribute walks past').not.toBeNull()
  })

  it('⚠⚠ and no corpus string exists anywhere in src/ outside the corpus itself', () => {
    const SRC = resolve(__dirname, '../../src') + '/'
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.(vue|ts)$/.test(e.name) && !full.endsWith('albumCorpus.ts')) files.push(full)
      }
    }
    walk(SRC)
    expect(files.length, 'the scan read nothing').toBeGreaterThan(50)

    // Every string the corpus holds, in all three registers and all four voices.
    const strings = new Set<string>()
    for (const occasion of ALBUM_CORPUS) {
      for (const voice of Object.values(occasion.voices)) {
        strings.add(voice.note)
        strings.add(voice.caption)
        strings.add(voice.line)
      }
    }
    expect(strings.size, 'the corpus read as empty – this guard would pass on anything').toBeGreaterThan(300)

    const copies: string[] = []
    for (const path of files) {
      const text = readFileSync(path, 'utf8')
      for (const s of strings) {
        if (text.includes(s)) copies.push(`${path.slice(SRC.length)} holds «${s}»`)
      }
    }
    expect(copies.join('\n'), 'a corpus string was copied into the app – it must be read, not retyped').toBe('')
  })
})

// =================================================================================================
// ⚠⚠ THE MUTATION LEDGER – every claim above was watched failing before it was believed.
// =================================================================================================
//
// Measured on this branch, one mutation at a time, restored between each:
// `npx vitest run --project component tests/component/album-mobile.test.ts` (22 tests in the file).
// The counts are what the runner printed, not what was predicted – two of them were not what was
// predicted, and both are noted.
//
//  1. `AlbumPaper.vue`: the width binding -> `width: '100%'`             -> 1 RED
//     ⚠ PREDICTED 2, MEASURED 1. The square test stayed green: happy-dom reports `aspect-ratio` as
//     declared and never resolves it against a used width, so «is it square» cannot see a width
//     change here. The claim is still worth its line – it catches the ratio being DROPPED – but it
//     is not a second witness for the width, and saying so is cheaper than somebody re-deriving it.
//  2. `AlbumPaper.vue`: `flex: none` removed                             -> 1 RED (flexShrink)
//  3. `AlbumPaper.vue`: the 117deg/4px ruling deleted                    -> 1 RED (the recipe)
//  4. `AlbumPaper.vue`: the stock changed to #e8dcc3                     -> 1 RED
//  5. `AlbumScreen.vue`: `current` pinned to 0                           -> 3 RED
//     (the indicator flip, the arrows-and-dots test, the chapter pick)
//  6. `AlbumScreen.vue`: `onRightHalf` inverted                          -> 2 RED (both indicator arms)
//  7. `AlbumScreen.vue`: the counter's `sheets.length` replaced by 12     -> 5 RED
//     (every test that reads «Sheet N of M» – which is the point: the count is not a decoration on
//     one screen, it is what the pan, the arrows and the chapter jump are all checked against)
//  8. `AlbumScreen.vue`: the Back control removed                        -> 1 RED
//  9. `AlbumScreen.vue`: a «Career summary» pill added to the foot       -> 3 RED
//     ⚠ ONE OF THE THREE IS THE CLAIM AND TWO ARE THE MUTATION'S OWN SHAPE: the added button reuses
//     `.album-chapters-btn`, so `find` takes it instead of the real one and the two Chapters tests
//     fall over with it. The claim's own test is the one naming «career summary».
// 10. `.dialog-card`'s `max-height` removed from `src/style.css`         -> 1 RED (the 375x667 arm,
//     failing on the cap – round-20 #3's own mutation, and the reason that bound lives on the shared
//     card rather than on any one dialog)
// 11. `AlbumChaptersSheet.vue`: the Close button removed                 -> 1 RED (375x667 arm)
// 12. `AlbumLayoutB.vue`: the boarding pass removed                      -> 1 RED
// 13. `AlbumLayoutC.vue`: the tag's `<path>` deleted                     -> 1 RED
// 14. `AlbumLayoutA.vue`: `tape` dropped from the hero                   -> 1 RED
// 15. `AlbumLayoutA.vue`: `{{ sheet.line }}` replaced by the mockup's own literal
//     «Some journeys start with a simple "Can I?"»                      -> 2 RED
//     ⭐ AND THE PAIR IS THE POINT: the no-sentence scan AND the no-corpus-string-in-src scan both
//     fire. Either alone has a hole – the first would miss a paraphrase pasted into an attribute,
//     the second would miss an invented sentence that is not in the corpus at all.
