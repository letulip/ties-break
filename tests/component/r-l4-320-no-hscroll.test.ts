// R-L4 – NO HORIZONTAL SCROLL AT 320 PX: THE STATS SCREEN AND THE FAMILY BUDGET.
// The owner, 10.10, over the LQA runner's route 7: «гориз. скролл точно надо чинить, не должно быть» (docs/decisions.md, the 10.10 rulings, №41).
//
// WHAT WAS MEASURED, in real Chromium at 320x568 on the `pro` e2e career, in English (the runner had it in Russian; the numbers are the same, so
// the defect is the layout's and not the translation's): Stats +23 px (`documentElement.scrollWidth` 343 on a 320 viewport), Family budget +12 px
// (332), Home 0. Three objects carry it, and none of them is a wide table:
//   1. the Stats ranking-table switcher – National / International / Professional ask 297 px of a 254 px row (`.tab-pill` pads 16 px a side);
//   2. the Stats header tiles – "Professional rank | Points | Professional W–L" ask 310 px (318 on the `engaged` career) of the same 254 px row;
//   3. the Family-budget chapter switcher – Spending / Bills / History / Shop ask 316 px of a 288 px row (`.as-chapter` pads 18 px a side).
// Swept over 11 of the 13 e2e careers x 6 widths (320 … 375) x every segmented pill on both screens: overflow from 320 up to 350 px (+1 at 350, on
// `engaged`), none at 359, 360 or 375. The other two careers (`ending`, `unheard`) stand an overlay in front of the tab bar and never reach Stats.
//
// ⚠⚠ WHY THIS FILE DOES NOT READ `scrollWidth`, and why that is not a shortcut. happy-dom parses the CSS and does no layout: `scrollWidth`,
// `clientWidth` and every rect are ZERO, so `scrollWidth <= clientWidth + 1` is `0 <= 1` on the broken CSS and on the fixed one – an arm that
// cannot go red (e2e/responsive.spec.ts says the same in its own header, and it is the reason that file exists). What a mounted test CAN ask,
// through the real cascade, is the repo's own width model: `assertInlineRowFits` walks the room a row is left by its ancestors and charges every
// control its label plus its COMPUTED padding. That answer is only worth having if the model's room is Chromium's room, so the first arm below
// pins the instrument to the browser's measured 254 / 288 – a screen that stops being mounted inside the real shell would make every fit below
// lax, and this is what says so.
//
// THE FIX IS AT WIDTHS UNDER 360 ONLY (`@media (max-width: 359px)`, the breakpoint `.money-artefacts` already steps aside at), so 375 and up is the
// layout it was: the 375 arm reads the same objects at 375x667 and asks for the shared metrics, no wrap, and the SAME vertical padding at both
// widths (a pill that is tighter sideways but not shorter is the only change a 320 phone is allowed to see). In the browser that is a fact and not
// only a pin: the full-document geometry (every element's rect) was fingerprinted before and after over 11 careers x 5 widths (360, 361, 375, 390,
// 412) x every segmented pill – 715 states, all identical – and the Family-budget page is exactly as tall at 320 as it was; Stats is 74 px taller
// there, the one wrapped tile row.
//
// THE LAST ARM IS THE ONE A MOUNTED TEST WOULD OTHERWISE MISS. happy-dom injects the screens' scoped styles AFTER the shared sheet and the
// production bundle puts the sheet LAST, so a selector that merely TIES the sheet's passes here and loses in Chromium (measured: without the
// `.as-chapter` compound the Family-budget pills kept their 18 px and the row wrapped). It applies the sheet once more after the screen is in, and
// reads the pill from there.
//
// MUTATION TABLE (each run alone against this file, the fixed CSS restored byte for byte after each): the old CSS on both screens – 8 of 11 red
// (the instrument and the control stay green, as they must); every `flex-wrap` dropped – 4; the side padding dropped – 6; the `@media` wrapper
// dropped, so the fix leaks to 375 – 3; a shorthand `padding` that also shortens the pill – 2; the tile caption reflowed instead of the row
// wrapped – 1; the Family-budget selector without its compound – 1 (the arm above).
//
// ⚠ NO USER-FACING WORDING IS TOUCHED OR ASSERTED HERE (CLAUDE.md invariant 4): the fix is CSS in two scoped blocks, and the one rule that looks like
// the culprit – `.stats-tile-label { white-space: nowrap }` – is deliberately LEFT as it is, with its «DO NOT "FIX" IT» note: the label is a caption
// that stays on one line, and at 320 the ROW is what gives (it wraps a tile to a second line instead of pushing the page sideways).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { resetI18nForTests } from '../../src/i18n'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertInlineRowFits, availableWidth, demandedWidth, lengthPx, setViewport, type Viewport } from './fits'

/** The room each row is left by the app shell on a 320 viewport, MEASURED in Chromium on 10.10 (the `.tab-row` boxes' own widths): `#app`'s 16 px
 *  gutters, then `section`'s 16 px padding and 1 px border on Stats; the gutters alone on the Family budget. If a gutter or a card pad ever moves
 *  on purpose, re-read `getBoundingClientRect().width` of `.stats-ladder-row` (Stats tab) and `.money-tabs` (Home › Family budget) in a real
 *  browser at 320x568 – the e2e `pro` career shows both – and move these two numbers with it. */
const CHROMIUM_ROOM_320 = { statsRow: 254, moneyRow: 288 }

/** The shared stylesheet as text, so a test can apply it AFTER the screens' own scoped styles – the order the production bundle has. */
const SHEET = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

/** The v46 golden save, migrated and snapshotted – a REAL career (the L2-7 net's fixture). Sixteen, all three ranking tables with counting
 *  results, the professional one active – so the ladder has its three pills and the header its three tiles. */
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
})

/** A screen mounted inside the REAL shell: `#app` carries the 16 px gutters and `main.app-content` is what a screen sits in. ⚠ WITHOUT THIS the
 *  walked room is the whole viewport less the section's own chrome, 32 px too wide, and every fit below is laxer than the phone. ⚠ `setViewport`
 *  runs BEFORE the mount – happy-dom caches a media query on an element's first computed-style read, so a late call measures the previous width. */
function mountScreen(screen: typeof StatsScreen | typeof MoneyScreen, vp: Viewport): VueWrapper {
  setViewport(vp)
  const app = document.createElement('div')
  app.id = 'app'
  const main = document.createElement('main')
  main.className = 'app-content with-next-week-bar'
  app.appendChild(main)
  document.body.appendChild(app)
  useGameStore().snapshot = golden
  return mount(screen, { global: { stubs: { teleport: true } }, attachTo: main })
}

/** A computed length, and a REFUSAL when the cascade did not resolve it – `fits.ts`'s own `num` reads an unresolved `var()` as 0, and a silent
 *  zero here would turn a missing padding into a perfect fit. */
function px(value: string, what: string): number {
  const n = lengthPx(value, 0)
  if (!Number.isFinite(n)) throw new Error(`${what}: the cascade left "${value}", which is not a length – the measurement cannot be trusted`)
  return n
}

const pillsOf = (w: VueWrapper, rowSelector: string): HTMLElement[] =>
  w.findAll(`${rowSelector} button.tab-pill`).map((b) => b.element as HTMLElement)

describe('R-L4 – the instrument: the walked room is the room Chromium measured', () => {
  it('Stats: the ladder row is left 254 px at 320 – the 16 px gutters, the 16 px section pad and its 1 px border', () => {
    const w = mountScreen(StatsScreen, NARROW_PHONE)
    const row = w.get('.stats-ladder-row').element
    expect(px(getComputedStyle(document.getElementById('app')!).paddingLeft, '#app padding-left'), 'the shell gutter').toBe(16)
    expect(availableWidth(row, NARROW_PHONE), 'a mounted screen no longer sees the real shell').toBeCloseTo(CHROMIUM_ROOM_320.statsRow, 0)
    w.unmount()
  })

  it('Family budget: the chapter row is left 288 px at 320 – the 16 px gutters and nothing else', () => {
    const w = mountScreen(MoneyScreen, NARROW_PHONE)
    const row = w.get('.money-tabs').element
    expect(availableWidth(row, NARROW_PHONE), 'a mounted screen no longer sees the real shell').toBeCloseTo(CHROMIUM_ROOM_320.moneyRow, 0)
    w.unmount()
  })
})

describe('R-L4 – Stats at 320x568', () => {
  it('⚠ the ranking-table switcher stands on ONE line: three pills inside 254 px (it asked for 297)', () => {
    const w = mountScreen(StatsScreen, NARROW_PHONE)
    const row = w.get('.stats-ladder-row').element
    const pills = pillsOf(w, '.stats-ladder-row')
    expect(pills.length, 'the golden career has all three ranking tables').toBe(3)
    assertInlineRowFits(row, pills, NARROW_PHONE, 'Stats › the ranking-table switcher')
    // The guarantee under the look: a longer word, a bigger font or a fourth table costs a second line, never a page that scrolls sideways.
    expect(getComputedStyle(row).flexWrap, 'the switcher may wrap rather than overflow').toBe('wrap')
    w.unmount()
  })

  it('⚠ the three header tiles may wrap, and each fits a line of its own – so the row cannot push the page sideways', () => {
    const w = mountScreen(StatsScreen, NARROW_PHONE)
    const row = w.get('.stats-header-row').element
    const tiles = w.findAll('.stats-header-row .stats-tile')
    expect(tiles.length, 'rank, points, season W–L').toBe(3)
    const room = availableWidth(row, NARROW_PHONE)
    const gap = px(getComputedStyle(row).columnGap || getComputedStyle(row).gap, 'the tile gap')
    let sideBySide = gap * (tiles.length - 1)
    for (const tile of tiles) {
      const cs = getComputedStyle(tile.element)
      const chrome =
        px(cs.paddingLeft, 'tile padding-left') + px(cs.paddingRight, 'tile padding-right') + px(cs.borderLeftWidth, 'tile border-left') + px(cs.borderRightWidth, 'tile border-right')
      const label = tile.get('.stats-tile-label').element
      const value = tile.get('.stats-tile-value').element
      const alone = chrome + Math.max(demandedWidth(label, room), demandedWidth(value, room))
      // ⚠ THE LABEL STAYS ONE LINE (`white-space: nowrap`, untouched): that is what makes a tile as wide as its caption, and why the ROW has to give.
      expect(getComputedStyle(label).whiteSpace, 'the caption is a fixed one-line caption – the fix must not reflow it').toBe('nowrap')
      expect(alone, `a tile (“${label.textContent?.trim()}”) asks ${alone.toFixed(0)}px of a ${room.toFixed(0)}px row on its own line`).toBeLessThanOrEqual(room)
      sideBySide += alone
    }
    const wraps = getComputedStyle(row).flexWrap === 'wrap'
    expect(
      wraps || sideBySide <= room,
      `the tiles ask ${sideBySide.toFixed(0)}px side by side of a ${room.toFixed(0)}px row and the row does not wrap – the third tile is off the side of the phone`,
    ).toBe(true)
    w.unmount()
  })
})

describe('R-L4 – the Family budget at 320x568', () => {
  it('⚠ the chapter switcher stands on ONE line: four pills inside 288 px (it asked for 316)', () => {
    const w = mountScreen(MoneyScreen, NARROW_PHONE)
    const row = w.get('.money-tabs').element
    const pills = pillsOf(w, '.money-tabs')
    expect(pills.map((p) => p.textContent?.trim()), 'the chapters the golden career shows').toEqual(['Spending', 'Bills', 'History', 'Shop'])
    assertInlineRowFits(row, pills, NARROW_PHONE, 'Family budget › the chapter switcher')
    expect(getComputedStyle(row).flexWrap, 'the switcher may wrap rather than overflow').toBe('wrap')
    w.unmount()
  })

  it('control: the period switcher already fitted at 320 and still does (it is not part of the fix)', () => {
    const w = mountScreen(MoneyScreen, NARROW_PHONE)
    const row = w.get('.money-window').element
    assertInlineRowFits(row, pillsOf(w, '.money-window'), NARROW_PHONE, 'Family budget › the period switcher')
    w.unmount()
  })
})

/** What the shared stylesheet gives a pill, read off a bare probe so no number of the stylesheet's is spelled here. */
function sharedPill(chapter: boolean): CSSStyleDeclaration {
  const row = document.createElement('div')
  row.className = chapter ? 'tab-row as-chapter' : 'tab-row'
  const pill = document.createElement('button')
  pill.className = 'tab-pill'
  row.appendChild(pill)
  document.body.appendChild(row)
  return getComputedStyle(pill)
}

/** The two segmented rows this fix tightens: where they live and whether they are the chapter kind (`appearance="chapter"`, the taller pill). */
const SWITCHERS: { name: string; screen: typeof StatsScreen | typeof MoneyScreen; row: string; chapter: boolean }[] = [
  { name: 'Stats › the ranking-table switcher', screen: StatsScreen, row: '.stats-ladder-row', chapter: false },
  { name: 'Family budget › the chapter switcher', screen: MoneyScreen, row: '.money-tabs', chapter: true },
]

describe('R-L4 – 375 and up is the layout it was', () => {
  for (const o of SWITCHERS) {
    it(`${o.name}: the shared pill metrics, no wrap – and at 320 only the SIDES give, never the height`, () => {
      setViewport(PHONE)
      const shared = sharedPill(o.chapter)
      const sharedSide = px(shared.paddingLeft, 'shared pill padding-left')
      const sharedTop = px(shared.paddingTop, 'shared pill padding-top')
      document.body.innerHTML = ''

      const phone = mountScreen(o.screen, PHONE)
      const phoneRow = phone.get(o.row).element
      const phonePill = getComputedStyle(pillsOf(phone, o.row)[0])
      expect(getComputedStyle(phoneRow).flexWrap, 'at 375 the switcher does not wrap').not.toBe('wrap')
      expect(px(phonePill.paddingLeft, 'pill padding-left @375'), 'at 375 the pill keeps the shared side padding').toBe(sharedSide)
      expect(px(phonePill.paddingRight, 'pill padding-right @375')).toBe(sharedSide)
      phone.unmount()
      document.body.innerHTML = ''

      const narrow = mountScreen(o.screen, NARROW_PHONE)
      const narrowPill = getComputedStyle(pillsOf(narrow, o.row)[0])
      expect(px(narrowPill.paddingLeft, 'pill padding-left @320'), 'at 320 the pill is tighter sideways').toBeLessThan(sharedSide)
      expect(px(narrowPill.paddingTop, 'pill padding-top @320'), 'and exactly as tall: the vertical padding is the shared one').toBe(sharedTop)
      expect(px(narrowPill.paddingBottom, 'pill padding-bottom @320')).toBe(sharedTop)
      narrow.unmount()
    })
  }

  it('the Stats header tiles: no wrap at 375, wrap at 320', () => {
    const phone = mountScreen(StatsScreen, PHONE)
    expect(getComputedStyle(phone.get('.stats-header-row').element).flexWrap, 'at 375 the three tiles stand in one row').not.toBe('wrap')
    phone.unmount()
    document.body.innerHTML = ''
    const narrow = mountScreen(StatsScreen, NARROW_PHONE)
    expect(getComputedStyle(narrow.get('.stats-header-row').element).flexWrap, 'at 320 the third tile drops to a second line').toBe('wrap')
    narrow.unmount()
  })
})

describe('R-L4 – the tightening does not depend on which stylesheet comes last', () => {
  // ⚠⚠ MEASURED IN CHROMIUM (10.10), AND THE REASON THIS ARM EXISTS. In the production bundle the shared sheet comes AFTER the screens' scoped
  // styles; here the screens' styles are injected after the sheet. A selector that only TIES the sheet's (a scoped `.money-tabs :deep(.tab-pill)`
  // is (0,3,0), the sheet's `.tab-row.as-chapter .tab-pill` is (0,3,0)) therefore wins in this file and LOSES in the browser: built that way the
  // Family-budget pills kept their 18 px and the row wrapped to a second line. So the sheet is applied once more AFTER the screen is in, and the
  // pill is read from there – an arm that can only pass if the screen's selector wins on specificity and not on position.
  for (const o of SWITCHERS) {
    it(`${o.name}: with the shared sheet applied AFTER the screen's own styles the pills are still tighter than the shared metric`, () => {
      setViewport(PHONE)
      const sharedSide = px(sharedPill(o.chapter).paddingLeft, 'shared pill padding-left')
      document.body.innerHTML = ''

      const late = document.createElement('style')
      late.setAttribute('data-r-l4', 'the shared sheet, applied after the screens')
      late.textContent = SHEET
      document.head.appendChild(late)
      try {
        const narrow = mountScreen(o.screen, NARROW_PHONE)
        const pill = getComputedStyle(pillsOf(narrow, o.row)[0])
        expect(
          px(pill.paddingLeft, 'pill padding-left @320, sheet last'),
          'the shared rule won on position – the screen\'s selector only ties it',
        ).toBeLessThan(sharedSide)
        narrow.unmount()
      } finally {
        late.remove()
      }
    })
  }
})
