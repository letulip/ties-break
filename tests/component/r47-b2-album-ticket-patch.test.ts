// ROUND 47 B2 – THE ALBUM'S TICKET AND ITS CLUB PATCH (ledger items 8c, 8d and 16).
//
// 8c  «Еще на этом билете дублируется Champion, давай только рукописный оставим.» The pass printed the stage twice –
//     in the title («World Tour 1000 Champion», the display face) and on the stub, in the album's own hand. Now it is
//     printed ONCE, on the stub.
// 8d  «Row, Gate давай везде в одну строку писать, а то где-то в две получается.» Measured in Chromium (06.10): the
//     stub's «Row 32 / Seat 32F» line broke in two on every pass with a two-digit row or seat (ROW over 32, SEAT over
//     32F). `white-space: nowrap` alone would have run the widest pair off the ticket's edge – it needs 105.2px and the
//     old stub had 90.5 inside its padding – so the stub is wider too, and both are held here.
// 16  «whitegate club и саму бирку тоже можно сделать по аналогии с билетом разными цветами и с разными названиями
//     вымышленными, иконка … со скрещенными ракетками во вложении». The club patch is a stepped family now: the pass's
//     own four cloths, a fictional name off the engine's pool, and his crossed-racquets icon inline.
//
// ⚠ WHAT THIS CANNOT SEE: happy-dom lays nothing out, so «one line» is held as the computed `white-space` of every
// element on those two lines PLUS the stub's declared width against the measured worst case – the measurement itself is
// the Chromium run in the round-47 ledger. The arithmetic below is the page's, not a second opinion about it.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical (`cmp`):
//   the title back to `{{ ticket.tier }} {{ ticket.stage }}`        -> 8c red on all five stages;
//   `white-space: nowrap` removed from the row line and its spans    -> 8d red on all four steps;
//   `.album-pass-stub` width 134 -> 116                              -> 8d's room case red;
//   the patch's `:class="album-patch-<step>"` deleted                -> 16 red (steps, four cloths, the sheet binding);
//   the inline <svg> deleted                                         -> 16 red (the icon case);
//   `fill="currentColor"` -> `fill="#000000"`                         -> 16 red (the tint case).
import '../../src/style.css'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlbumTicketPass from '../../src/components/album/AlbumTicketPass.vue'
import AlbumPatch from '../../src/components/album/AlbumPatch.vue'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import { ALBUM_PATCH_POOL } from '../../src/engine/world/albumBook'
import type { AlbumTierStep } from '../../src/shared/protocol'
import { contrastRatio, effectiveBackground, parseColor } from './contrast'
import { sheetOf } from './albumFixture'

const STEPS: readonly AlbumTierStep[] = ['budget', 'middle', 'high', 'elite']
const STAGES = ['Champion', 'Runner-up', 'Semifinalist', 'Quarterfinalist', 'Round of 16'] as const

const BASE = sheetOf({ layout: 'B' }).ticket!

/** What the page's own stylesheet DECLARES for `font-family` on a selector – read off the CSSOM (the component's scoped
 *  rule), because happy-dom's computed `font-family` does not resolve `var(--font-hand)` and answers «Times New Roman»,
 *  which would make a computed-style arm vacuous. */
function declaredFont(selector: string): string {
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      const r = rule as CSSStyleRule
      if (r.selectorText && new RegExp(`${selector.replace('.', '\\.')}(\\[|$|,|\\s)`).test(r.selectorText) && r.style.fontFamily) return r.style.fontFamily
    }
  }
  throw new Error(`no stylesheet rule declares a font-family for ${selector} – the arm would pass on nothing`)
}

function mountPass(over: Partial<typeof BASE> = {}) {
  return mount(AlbumTicketPass, { props: { ticket: { ...BASE, ...over } }, attachTo: document.body })
}

// ===================================================================================================
// 8c · THE STAGE IS PRINTED ONCE, IN THE HANDWRITING
// ===================================================================================================

describe('round 47 #8c · the stage is printed once – the handwritten one', () => {
  for (const stage of STAGES) {
    it(`«${stage}»: exactly one printing, on the stub, in the album's hand – and the title is the rank alone`, () => {
      const w = mountPass({ stage })
      const printings = w.text().split(stage).length - 1
      expect(printings, `«${stage}» is printed ${printings} times on the ticket: ${w.text()}`).toBe(1)
      const leaves = w.findAll('*').filter((e) => e.element.children.length === 0 && e.text().includes(stage))
      expect(leaves, 'the one printing is not one element').toHaveLength(1)
      const hit = leaves[0]!
      expect(hit.classes(), 'the printing is not the stub\'s').toContain('album-pass-stage')
      expect(declaredFont('.album-pass-stage'), 'the stage is not set in the handwriting face').toMatch(/font-hand/)
      expect(declaredFont('.album-pass-title'), 'the title is the display face, not the hand').toMatch(/font-heading/)
      expect(w.find('.album-pass-title').text(), 'the title carries the rank and nothing else').toBe(BASE.tier)
      w.unmount()
    })
  }

  it('«Champion» – the word he named – matches /champion/i exactly once on the whole ticket', () => {
    const w = mountPass({ stage: 'Champion', tier: 'World Tour 1000', step: 'elite' })
    expect(w.text().match(/champion/gi) ?? [], w.text()).toHaveLength(1)
    w.unmount()
  })
})

// ===================================================================================================
// 8d · «ROW …», «GATE …» ALWAYS ONE LINE
// ===================================================================================================

/** The widest «Row n» + «Seat nL» the engine can deal (`flavourFor`: row 1–32, seat 1–32 and A–F), measured in
 *  Chromium on 06.10: «Row 30» 45.25px + «Seat 30D» 55.95px + the 4px gap. */
const ROW_AND_SEAT_WIDEST = 105.2
/** What the stub spends on anything but the text: padding 12 + 12 and the 1.5px perforation. */
const STUB_CHROME = 12 + 12 + 1.5

describe('round 47 #8d · Row and Gate are ONE line, and the stub has the room for it', () => {
  for (const step of STEPS) {
    it(`the ${step} step: every element on the Row/Seat line and the Date/Gate line is white-space: nowrap`, () => {
      const w = mountPass({ step, row: 'Row 30', seat: 'Seat 30D', gate: 'Gate 9', dateLabel: 'Oct 28 – Nov 3' })
      const lines = [...w.findAll('.album-pass-row, .album-pass-row span, .album-pass-foot, .album-pass-foot span')]
      expect(lines, 'the lines were not found – the arm would pass on nothing').toHaveLength(6)
      for (const el of lines) {
        expect(getComputedStyle(el.element).whiteSpace, `${el.element.tagName.toLowerCase()}.${el.classes().join('.')} may wrap`).toBe('nowrap')
      }
      expect(w.findAll('.album-pass-row span').map((s) => s.text()), 'the row line carries both words, each one phrase').toEqual(['Row 30', 'Seat 30D'])
      expect(w.findAll('.album-pass-foot span').map((s) => s.text())).toEqual(['Oct 28 – Nov 3', 'Gate 9'])
      w.unmount()
    })
  }

  it('⚠ nowrap alone would clip: the stub is wide enough for the widest row + seat the engine can deal', () => {
    const w = mountPass()
    const stub = Number.parseFloat(getComputedStyle(w.find('.album-pass-stub').element).width)
    expect(Number.isFinite(stub), 'the stub reports no width').toBe(true)
    expect(stub - STUB_CHROME, `the stub is ${stub}px; its text box is ${stub - STUB_CHROME}px and «Row 30 / Seat 30D» needs ${ROW_AND_SEAT_WIDEST}`).toBeGreaterThanOrEqual(ROW_AND_SEAT_WIDEST)
    w.unmount()
  })
})

// ===================================================================================================
// 16 · THE CLUB PATCH GOES THE TICKET'S WAY
// ===================================================================================================

/** The design system's token for a step, read off the LIVE document (`src/style.css` declares the four on `:root`). */
function token(step: AlbumTierStep): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--tier-${step}`).trim()
  // ⚠ THROWS RATHER THAN RETURNING '' – an absent token would make every derivation compare black with black.
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--tier-${step} is ${JSON.stringify(value)}, not a hex – is src/style.css loaded?`)
  const [r, g, b] = parseColor(value)
  return [r, g, b]
}
const scaled = (step: AlbumTierStep, factor: number): [number, number, number] =>
  token(step).map((v) => Math.round(v * factor)) as [number, number, number]
const channels = (css: string): [number, number, number] => {
  const [r, g, b] = parseColor(css)
  return [r, g, b]
}

function mountPatch(step: AlbumTierStep, name: string = 'Whitegate Club') {
  return mount(AlbumPatch, { props: { patch: { name, step } }, attachTo: document.body })
}

describe('round 47 #16 · the club patch is a stepped family – the pass\'s own cloths, a pool name, his crossed racquets', () => {
  it('every step paints its own cloth: the step class, four DIFFERENT colours, each the pass\'s pair (the step\'s token ×0.38 and ×0.27)', () => {
    const faces = new Set<string>()
    for (const step of STEPS) {
      const w = mountPatch(step)
      const el = w.find('.album-patch').element
      expect(w.find('.album-patch').classes(), `the patch lost its step class`).toContain(`album-patch-${step}`)
      const face = getComputedStyle(el).backgroundColor
      expect(channels(face), `${step}: the cloth's face is --tier-${step} ×0.38`).toEqual(scaled(step, 0.38))
      expect(channels(getComputedStyle(el).getPropertyValue('--album-patch-ink-deep').trim()), `${step}: the sheen's deep end is ×0.27`).toEqual(scaled(step, 0.27))
      faces.add(face)
      w.unmount()
    }
    expect(faces.size, 'four steps, four cloths').toBe(4)
  })

  it('a pool name is sewn on, and the crossed-racquets icon is INLINE and tinted by the thread (currentColor)', () => {
    for (const name of ALBUM_PATCH_POOL) {
      const w = mountPatch('high', name)
      expect(w.find('.album-patch-name').text(), 'the name on the cloth is the one the model carries').toBe(name)
      const icon = w.find('svg.album-patch-mark')
      expect(icon.exists(), `«${name}»: no inline <svg> icon on the patch`).toBe(true)
      expect(icon.attributes('fill'), 'the icon is not tinted by the thread').toBe('currentColor')
      expect(icon.attributes('viewBox'), 'his racquets are a 64x64 drawing').toBe('0 0 64.006 64.006')
      expect(icon.findAll('path'), 'his icon is two paths – the racquets and the ball').toHaveLength(2)
      expect(w.find('img').exists(), 'the icon is a picture file and not inline').toBe(false)
      expect(icon.attributes('aria-hidden'), 'a decoration, hidden from the accessibility tree').toBe('true')
      w.unmount()
    }
  })

  it('the thread colours the icon: what `currentColor` resolves to on the patch is the cream thread, on every step', () => {
    for (const step of STEPS) {
      const w = mountPatch(step)
      expect(channels(getComputedStyle(w.find('.album-patch').element).color), `${step}: the thread`).toEqual([230, 221, 196])
      w.unmount()
    }
  })

  it('the name and the icon are legible on every cloth – thread on cloth, at the lighter end of the sheen (the worst case)', () => {
    for (const step of STEPS) {
      const w = mountPatch(step)
      const el = w.find('.album-patch-name').element
      const ratio = contrastRatio(channels(getComputedStyle(el).color), effectiveBackground(el))
      expect(ratio, `${step}: the club's name is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      w.unmount()
    }
  })

  it('two clubs print two names; and layout A binds the model – the name AND the step – onto the sheet', () => {
    const a = mountPatch('budget', ALBUM_PATCH_POOL[0])
    const b = mountPatch('budget', ALBUM_PATCH_POOL[1])
    expect(a.find('.album-patch-name').text()).not.toBe(b.find('.album-patch-name').text())
    a.unmount()
    b.unmount()
    const sheet = { ...sheetOf({ layout: 'A' }), patch: { name: 'Fairhaven Club', step: 'high' as const } }
    const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
    const patch = w.find('.album-patch')
    expect(patch.exists(), 'layout A drew no patch').toBe(true)
    expect(patch.classes()).toContain('album-patch-high')
    expect(patch.find('.album-patch-name').text()).toBe('Fairhaven Club')
    w.unmount()
  })
})
