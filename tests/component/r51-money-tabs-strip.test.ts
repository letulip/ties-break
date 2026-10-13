// R51 №1a – THE FAMILY-BUDGET CHAPTER STRIP SCROLLS INSIDE ITSELF (owner, 13.10: «нужен скролл самих пилюль горизонтальный в этом
// случае без горизонтального скролла страницы»).
//
// WHAT THIS FILE CAN AND CANNOT PROVE. happy-dom parses the cascade and does no layout, so «the page does not scroll sideways» is
// unaskable here – `e2e/r51-money-tabs.spec.ts` measures it in Chromium at 375 px in Russian, and `r-l4-320-no-hscroll.test.ts` says
// the same of its own instrument. What a mounted test CAN ask, through the real cascade, is the CSS CONTRACT the ruling is made of:
// the strip is a sideways scroller that does not hand its scroll end to the page, it never wraps at ANY width (the ruling replaced the
// sub-360 wrap of 19a2f525 – one mechanism), and its pills keep the width their word asks for. The last arm proves the WIRING with
// stubbed rectangles: a chapter change from anywhere scrolls the strip, and nothing else (`scrollIntoView` drags the page too).
//
// ⚠ TWO NAMES FOR TWO QUESTIONS (tests/pin-hygiene): the style block is read through `sfc` (the `.vue` ALONE – the only honest source
// for a NEGATIVE claim, and the `flex-wrap: wrap` is gone is one); the wiring is asked of the mounted screen, not of a widened source.
//
// MUTATION TABLE (each run alone, the tree restored byte for byte after – the report of R51 B13 has the hashes): the `.money-tabs`
// CSS block reverted to its pre-R51 form – the computed `overflow-x`, `flex-wrap` and `flex-shrink` arms red at both widths, and
// the source-pin arms red; `useRevealActivePill(…)` deleted from the screen – the wiring arm red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'

import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { resetI18nForTests } from '../../src/i18n'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, setViewport, type Viewport } from './fits'
import { after } from '../helpers/source'

/** ⚠ NOT `componentFile()`: that helper resolves against `import.meta.url`, which under happy-dom is an http scheme and throws (the
 *  `component` project's established reader is cwd-relative – `r47-raise-another-route.test.ts` records the same discovery). The claim
 *  it is used for is still the NEGATIVE one `componentFile` exists for: the `.vue` ALONE, never widened by a composable. */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

/** The shared stylesheet as text, so a test can apply it AFTER the screens' own scoped styles – the order the production bundle has. */
const SHEET = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

/** The v46 golden save, migrated and snapshotted – a REAL career (the same fixture the R-L4 net mounts the screen with). */
function goldenSnapshot(): Snapshot {
  const world = migrateSave(JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8'))) as WorldState
  return toSnapshot(world)
}
let golden: Snapshot

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  golden ??= goldenSnapshot()
})
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

/** The screen mounted inside the REAL shell (`#app` gutters, `main.app-content`). ⚠ `setViewport` runs BEFORE the mount – happy-dom caches a
 *  media query on an element's first computed-style read, so a late call measures the previous width. */
function mountMoney(vp: Viewport): VueWrapper {
  setViewport(vp)
  const app = document.createElement('div')
  app.id = 'app'
  const main = document.createElement('main')
  main.className = 'app-content with-next-week-bar'
  app.appendChild(main)
  document.body.appendChild(app)
  useGameStore().snapshot = golden
  return mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: main })
}

const stripOf = (w: VueWrapper): HTMLElement => w.get('.money-tabs').element as HTMLElement
const pillsOf = (w: VueWrapper): HTMLElement[] => w.findAll('.money-tabs button.tab-pill').map((b) => b.element as HTMLElement)

/** The two orders the cascade can have: the screens' scoped styles after the sheet (happy-dom's own) and the sheet AFTER them (the production
 *  bundle's) – the R-L4 note in MoneyScreen.vue measured that a tie between the two is settled differently, so the contract is asked in both. */
const ORDERS: { name: string; sheetLast: boolean }[] = [
  { name: 'the screen\'s styles after the sheet', sheetLast: false },
  { name: 'the sheet applied AFTER the screen\'s styles (the production order)', sheetLast: true },
]

describe('R51 №1a – the chapter strip is a sideways scroller of its own, at every width', () => {
  for (const order of ORDERS) {
    for (const [width, vp] of [['375', PHONE], ['320', NARROW_PHONE]] as const) {
      it(`${width} px, ${order.name}: scrolls sideways itself, keeps one line, does not chain, pills do not shrink`, () => {
        const late = document.createElement('style')
        if (order.sheetLast) {
          late.setAttribute('data-r51', 'the shared sheet, applied after the screens')
          late.textContent = SHEET
          document.head.appendChild(late)
        }
        try {
          const w = mountMoney(vp)
          const strip = getComputedStyle(stripOf(w))
          expect(strip.overflowX, 'the strip must scroll sideways on its own, or the four Russian words push the PAGE sideways').toBe('auto')
          expect(strip.flexWrap, 'the ruling replaced the wrap: there is no width at which this row wraps').toBe('nowrap')
          expect(
            strip.getPropertyValue('overscroll-behavior-x'),
            'reaching the strip\'s end must not drag the page behind it (the scroll chain .bt-tabs and .guide-table-wrap already cut)',
          ).toBe('contain')
          const pills = pillsOf(w)
          expect(pills.length, 'Spending / Bills / History / Shop').toBe(4)
          for (const pill of pills) {
            const cs = getComputedStyle(pill)
            expect(cs.flexShrink, `“${pill.textContent?.trim()}” would be squeezed before the strip scrolls`).toBe('0')
            expect(cs.flexGrow).toBe('0')
          }
          w.unmount()
        } finally {
          late.remove()
        }
      })
    }
  }

  it('control: the OTHER segmented rows of the screen are not scrollers – the ruling is scoped to the budget strip', () => {
    const w = mountMoney(PHONE)
    const window12 = w.get('.money-window').element as HTMLElement
    expect(getComputedStyle(window12).overflowX, 'the period switcher is a different object and keeps its plate').not.toBe('auto')
    w.unmount()
  })
})

describe('R51 №1a – the source: the wrap is GONE from every rule that names the strip', () => {
  const sfc = repoFile('src/components/screens/MoneyScreen.vue')
  /** The style block with its comments cut out, so a note that QUOTES `flex-wrap: wrap` cannot satisfy or trip a pin. */
  const css = after(sfc, '<style scoped>').replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]!.trim() }))
  const stripRules = rules.filter((r) => r.selector.includes('.money-tabs'))

  it('the instrument finds the strip\'s rules (a selector scan that matches nothing would pass every negative below)', () => {
    expect(stripRules.length, 'the `.money-tabs` rule, the pill rules and the sub-360 sides').toBeGreaterThanOrEqual(4)
  })

  it('.money-tabs carries overflow-x: auto, overscroll-behavior-x: contain and a nowrap line', () => {
    const own = stripRules.find((r) => r.selector === '.money-tabs')
    expect(own, 'the strip\'s own rule').toBeDefined()
    expect(own!.body).toMatch(/overflow-x:\s*auto/)
    expect(own!.body).toMatch(/overscroll-behavior-x:\s*contain/)
    expect(own!.body).toMatch(/flex-wrap:\s*nowrap/)
  })

  it('⚠ no rule that names .money-tabs wraps – not at 360, not at 320, not anywhere (one mechanism)', () => {
    // `flex-wrap:\s*wrap` also catches `wrap-reverse` and cannot match `nowrap`, whose `wrap` does not start right after the colon.
    for (const r of stripRules) expect(r.body, `${r.selector} wraps`).not.toMatch(/flex-wrap:\s*wrap/)
  })

  it('the sub-360 media block is no longer a wrap guard: what remains of it only tightens the pills\' sides', () => {
    const media = after(sfc, '<style scoped>').replace(/\/\*[\s\S]*?\*\//g, '')
    const block = /@media \(max-width: 359px\)\s*\{\s*\.money-tabs[^{]*\{([^{}]*)\}\s*\}/.exec(media)
    expect(block, 'the first sub-360 block of the screen is the strip\'s sides').not.toBeNull()
    expect(block![1]).toMatch(/padding-left:\s*12px/)
    expect(block![1]).not.toMatch(/flex-wrap/)
  })
})

describe('R51 №1a – the wiring: a chapter change scrolls the strip, and nothing else', () => {
  it('pressing a pill that is cut by the strip\'s edge scrolls the STRIP to it – never the page, never scrollIntoView', async () => {
    const w = mountMoney(PHONE)
    const strip = stripOf(w)
    const pills = pillsOf(w)

    // Layout is stubbed (happy-dom has none): the Russian row at 375 – four pills of 95, 146, 95, 95 px, a 2 px gap, a 343 px window
    // starting 16 px from the screen's left edge. The fourth pill (Shop) hangs off the right edge by 94 px.
    const WIDTHS = [95, 146, 95, 95]
    const GAP = 2
    const STRIP_LEFT = 16
    const starts = WIDTHS.map((_, i) => WIDTHS.slice(0, i).reduce((a, b) => a + b + GAP, 0))
    let scrollLeft = 0
    Object.defineProperty(strip, 'scrollLeft', { configurable: true, get: () => scrollLeft, set: (v: number) => { scrollLeft = v } })
    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 343 })
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 437 })
    strip.getBoundingClientRect = () => ({ left: STRIP_LEFT, right: STRIP_LEFT + 343, width: 343 }) as DOMRect
    pills.forEach((pill, i) => {
      pill.getBoundingClientRect = () => ({ left: STRIP_LEFT + starts[i]! - scrollLeft, width: WIDTHS[i] }) as DOMRect
    })
    const scrollTo = vi.fn((o: ScrollToOptions) => { scrollLeft = o.left ?? 0 })
    strip.scrollTo = scrollTo as unknown as typeof strip.scrollTo
    const pageScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const intoView = vi.fn()
    for (const pill of pills) pill.scrollIntoView = intoView

    await w.findAll('.money-tabs button.tab-pill')[3]!.trigger('click')
    await nextTick()
    await nextTick()

    expect(pills[3]!.getAttribute('aria-pressed'), 'the click really changed the chapter').toBe('true')
    expect(scrollTo, 'the chapter change must scroll the strip once').toHaveBeenCalledTimes(1)
    // pill 4 spans 342..437 in the strip's coordinates: its right edge plus the air asks for 445 - 343 = 102, and the strip can only
    // scroll 437 - 343 = 94, so the clamp answers and the last pill ends flush with the end of the row.
    expect(scrollLeft, 'the strip stops at the end of its content').toBe(94)
    expect(pageScroll, 'the page must not be scrolled by a chapter change').not.toHaveBeenCalled()
    expect(intoView, 'scrollIntoView would drag the page vertically too').not.toHaveBeenCalled()
    w.unmount()
  })
})
