// =================================================================================================
// ROUND 41 #22 (shipped on v78) – THE FUND CHART'S PURCHASE MARKS AND THEIR MICRO-POPUP, MOUNTED
// =================================================================================================
//
// THE OWNER, round 41 #22: «В index fund можем делать отметки на графике когда была покупка с микро
// попап при hover/клике с суммой и датой?»
//
// ⚠⚠ THE ITEM WAITED A MONTH FOR A SCHEMA MOVE AND THAT WAIT IS THE HALF WORTH REMEMBERING. Round 41
// measured that nothing persisted could answer «when, and how much» – `boughtWeek` is the first buy
// only, `paidCents` a blended net sum, the feed prunable, the ledger a weekly total – and REFUSED the
// degraded single-mark version, which would have printed a number the family never paid on any
// topped-up holding. v78's `OwnedAsset.entries` is the road; this file is the screen at the end of it.
//
// ⚠ MOUNTED AND NOT PINNED (CLAUDE.md's own «prefer a mounted test to a source pin»). Every claim
// below is read off the rendered DOM through the real cascade, and the two geometry claims are read
// off computed boxes rather than off the numbers the component happens to hold.
//
// ⚠ THE ARMS THIS FILE WAS MUTATION-VERIFIED WITH, and their measured red counts are in the bundle's
// report:
// Scope for every count: this file + `tests/component/round34-money-shelf.test.ts` (28 green).
//
//   ARM A  `chartMarks` returns `[]` for every row                12 RED  every case that looks for
//                                                                        a mark
//   ARM B  the out-of-window `continue` neutered                   1 RED  the out-of-window case
//          (`if (buy.week < points[0].week)` -> `if (false)`)
//   ARM C  `markAlign` made to always return `'center'`            4 RED  §C's four viewport cases
//   ARM D  `toggleMark` made open-only (never closes)              1 RED  the second-tap case
//   ARM E  `shopView` sends `purchases: []` whatever is owned     12 RED  the whole file, from the
//                                                                        wire rather than the screen
//
// ⚠ ARM C's FIRST FORM MEASURED **0 RED** – a null arm, and it is recorded rather than quietly
// replaced. It removed `.fund-chart-pop`'s `max-width`, which changes nothing at all because the
// bubble is `white-space: nowrap`; what that null exposed is that §C was pinning the bubble's FIT and
// saying nothing about its PLACEMENT, which is the half that actually failed at 375px. The lean
// assertion inside §C is what the null bought.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'

import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { buyAsset, createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { formatCents } from '../../src/shared/money'
import { monthLabel } from '../../src/shared/dates'
import type { Snapshot } from '../../src/shared/protocol'
import { PHONE, DESKTOP, TABLET, setViewport, availableWidth, demandedWidth, lengthPx } from './fits'

/** ⚠ THE FOURTH WIDTH IS THE BUNDLE'S OWN ASK (375 / 768 / 900 / 1280) and it is not in `fits.ts`
 *  because nothing else measures it: 900 is the small-laptop width where a two-column shelf first
 *  appears, which is the layout change between `TABLET` and `DESKTOP`. Declared here rather than
 *  added to the shared file, so the shared four stay the shared four. */
const LAPTOP = { width: 900, height: 800 }
import { openShelfTab } from './shelf'

/** A career with real purchases into the fund. ⚠ BOUGHT THROUGH `buyAsset` AND NEVER POKED ONTO THE
 *  ROW: the marks are supposed to be what the engine recorded when the family actually bought, and a
 *  hand-written `entries` array would test the template against a shape no command produces. */
function withFundBuys(weeks: number[], readWeek = READ_WEEK, stake = 50_000_00): WorldState {
  const world = createWorld('r41-marks')
  world.fundsCents = 5_000_000_00
  for (const week of weeks) {
    world.week = week
    buyAsset(world, 'index-fund', stake)
  }
  // ⚠ READ FROM A WEEK WITH A CHART BEHIND IT **AND THE PURCHASES INSIDE THE OPEN WINDOW**, which is
  // two requirements and the second one bit first. `unitPriceHistory` is as long as the months that
  // have actually happened, so a young career has no line at all; and the picker OPENS on 12 months,
  // so a purchase made three years before the read week is correctly not drawn. A fixture that got
  // either wrong would have reported «no marks» for a reason that has nothing to do with the marks.
  world.week = readWeek
  return world
}

/** The week every case reads from: late enough for a five-year chart, and the default 12-month window
 *  then covers roughly `READ_WEEK - 52 .. READ_WEEK`. */
const READ_WEEK = 452

async function mountShop(snapshot: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  await openShelfTab(wrapper, 'Invest')
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  setViewport(DESKTOP)
  document.body.innerHTML = ''
})

describe('round 41 #22 A – a mark for every purchase, and none for a purchase nobody made', () => {
  it('⭐⭐⭐ two purchases draw two marks, and an unowned fund draws none', async () => {
    const bare = createWorld('r41-marks-none')
    bare.week = READ_WEEK
    const empty = await mountShop(toSnapshot(bare))
    expect(empty.find('.fund-chart-plot').exists(), 'the chart itself is drawn either way').toBe(true)
    expect(empty.findAll('.fund-chart-mark').length, 'a fund nobody owns has no purchase to mark').toBe(0)

    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    expect(wrapper.findAll('.fund-chart-mark').length, 'one ring per purchase').toBe(2)
    expect(wrapper.findAll('.fund-chart-hit').length, 'and one pressable control per ring').toBe(2)
  })

  it('⭐⭐ a TOP-UP is its own mark, which is the whole reason the item needed a schema move', async () => {
    // ⚠ THE NEGATIVE IS THE ITEM. Before v78 a chart could have drawn ONE mark at `boughtWeek`, and
    // it would have carried `paidCents` – the blend of both buys – on the week of the first. Two
    // marks at two weeks is the thing that could not be built off the old save.
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    const labels = wrapper.findAll('.fund-chart-hit').map((n) => n.attributes('aria-label') ?? '')
    expect(labels.length).toBe(2)
    expect(labels[0], 'the first purchase names its own week').toContain(monthLabel(410))
    expect(labels[1], 'and the second names its own').toContain(monthLabel(440))
    expect(labels[0], 'each carries ITS OWN money and never the running total').toContain(formatCents(50_000_00))
    expect(labels[1]).toContain(formatCents(50_000_00))
  })

  it('⚠ a purchase older than the OPEN window is not drawn, rather than pinned to the edge', async () => {
    // A mark at the left edge of a six-month view would claim a week that view does not cover. The
    // picker is the control: narrow the window and the old mark leaves; widen it and it comes back.
    const wrapper = await mountShop(toSnapshot(withFundBuys([200, 440])))
    expect(wrapper.findAll('.fund-chart-mark').length, 'five years reaches both').toBeGreaterThan(0)
    const wide = wrapper.findAll('.fund-chart-range').find((n) => n.text().trim() === '5 years')
    expect(wide, 'the widest window').toBeTruthy()
    await wide!.trigger('click')
    const onFive = wrapper.findAll('.fund-chart-mark').length
    const narrow = wrapper.findAll('.fund-chart-range').find((n) => n.text().trim() === '6 months')
    expect(narrow, 'the narrowest window').toBeTruthy()
    await narrow!.trigger('click')
    const onSix = wrapper.findAll('.fund-chart-mark').length
    expect(onSix, 'a six-month window cannot reach a purchase made five years ago').toBeLessThan(onFive)
  })
})

describe('round 41 #22 B – the micro-popup, at hover AND at tap', () => {
  it('⭐⭐⭐ nothing is open until something is pressed, and a tap opens exactly one bubble', async () => {
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    expect(wrapper.find('.fund-chart-pop').exists(), 'the card is quiet until asked').toBe(false)

    await wrapper.findAll('.fund-chart-hit')[0].trigger('click')
    await nextTick()
    const pops = wrapper.findAll('.fund-chart-pop')
    expect(pops.length, 'one bubble, never one per mark').toBe(1)
    // ⚠ THE TWO FIGURES THE OWNER NAMED – «с суммой и датой» – read off the rendered bubble.
    expect(pops[0].text(), 'the date').toContain(monthLabel(410))
    expect(pops[0].text(), 'and the sum').toContain(formatCents(50_000_00))
  })

  it('⭐⭐ HOVER opens it too, which is the other half of «при наведении/нажатии»', async () => {
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    await wrapper.findAll('.fund-chart-hit')[1].trigger('mouseenter')
    await nextTick()
    expect(wrapper.find('.fund-chart-pop').exists(), 'a pointer over the mark is enough').toBe(true)
    expect(wrapper.find('.fund-chart-pop').text()).toContain(monthLabel(440))
    await wrapper.findAll('.fund-chart-hit')[1].trigger('mouseleave')
    await nextTick()
    expect(wrapper.find('.fund-chart-pop').exists(), 'and leaving closes it').toBe(false)
  })

  it('⭐⭐⭐ a SECOND tap closes it – the only way to dismiss one on a touch screen', async () => {
    // ⚠ THE PHONE IS THE CASE THIS EXISTS FOR. There is no `mouseleave` on a touch device, so a
    // bubble that only ever opened would sit on the chart until the row re-rendered.
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    await wrapper.findAll('.fund-chart-hit')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.fund-chart-pop').exists()).toBe(true)
    await wrapper.findAll('.fund-chart-hit')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.fund-chart-pop').exists(), 'pressing the same mark again puts it away').toBe(false)
  })

  it('⚠ the control is a real button and says whether its bubble is open', async () => {
    // Keyboard reachability and the disclosure state, which an SVG `<circle>` could give neither.
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    const hit = wrapper.findAll('.fund-chart-hit')[0]
    expect(hit.element.tagName, 'a button, so Tab reaches it').toBe('BUTTON')
    expect(hit.attributes('aria-expanded'), 'closed to begin with').toBe('false')
    await hit.trigger('focus')
    await nextTick()
    expect(wrapper.find('.fund-chart-pop').exists(), 'focus alone opens it').toBe(true)
    expect(wrapper.findAll('.fund-chart-hit')[0].attributes('aria-expanded')).toBe('true')
  })
})

describe('round 41 #22 C – it fits a phone, measured through the real cascade', () => {
  // ⚠⚠ ROUND-20 #3's LAW, APPLIED TO A BUBBLE RATHER THAN A DIALOG: a thing that appears over a card
  // gets measured against a 375x667 viewport before it ships, and «it reads well» is not that
  // measurement. This one cannot strand the player the way `TourBriefingDialog` did – it is not a
  // blocking overlay – but `.tb-card--photo` sets `overflow: hidden`, so a bubble that ran past the
  // plot is CUT IN HALF, which is the same failure wearing a smaller costume.
  //
  // ⚠ THE INSTRUMENT IS `demandedWidth`, NOT `boxOf`. `boxOf` answers the HEIGHT question (it returns
  // `{h, marginTop, marginBottom}`), and this is a width question – the first draft read `.width` off
  // it, got `undefined`, and every assertion compared `NaN`, which fails loudly rather than passing
  // silently only because the comparison happened to be `<=`. The bubble is `white-space: nowrap` and
  // a flex COLUMN, so its width is the wider of its two lines plus its own padding and border.

  /** The widest the bubble actually wants to be, in px – its own chrome plus the longer of its lines. */
  const popWidth = (pop: Element): number => {
    const cs = getComputedStyle(pop)
    const chrome =
      lengthPx(cs.paddingLeft, 0) + lengthPx(cs.paddingRight, 0)
      + lengthPx(cs.borderLeftWidth, 0) + lengthPx(cs.borderRightWidth, 0)
    const lines = [...pop.children].map((line) => demandedWidth(line, 0))
    return chrome + Math.max(0, ...lines)
  }

  for (const vp of [PHONE, TABLET, LAPTOP, DESKTOP]) {
    it(`⭐⭐⭐ at ${vp.width}x${vp.height} the bubble stays inside the plot, at the FIRST mark and at the LAST`, async () => {
      setViewport(vp)
      // Two purchases near the two ends of the open window, which is where a clamp either works or
      // does not – a bubble centred on a mark at 4% of the width is the one that leaves the card.
      const wrapper = await mountShop(toSnapshot(withFundBuys([404, 448])))
      const hits = wrapper.findAll('.fund-chart-hit')
      expect(hits.length, 'both ends are drawn').toBe(2)
      const room = availableWidth(wrapper.find('.fund-chart-plot-wrap').element, vp)
      expect(room, 'the plot has real room at this width').toBeGreaterThan(100)
      for (const [i, hit] of hits.entries()) {
        await hit.trigger('click')
        await nextTick()
        const pop = wrapper.find('.fund-chart-pop')
        expect(pop.exists(), `mark ${i} opens`).toBe(true)
        // ⭐⭐⭐ THE WHOLE BUBBLE FITS THE PLOT'S OWN WIDTH – which is the constraint, and it took two
        // goes to say it. The first version measured the bubble's HALF-width against an 18% margin,
        // because the first design centred the bubble on the mark and clamped `left` to `[18%, 82%]`.
        // THAT VERSION WENT RED AT 375px: half-width 77.6 against a margin of 62.8, so the first and
        // last marks would have had their bubble cut off by `.tb-card--photo`'s `overflow: hidden` on
        // the owner's own phone. The bubble now lives in a row that spans the plot with
        // `max-width: 100%`, so the honest question is simply «does it fit at all», asked at the
        // width that decides it.
        expect(popWidth(pop.element), `mark ${i}: the bubble fits inside the plot at ${vp.width}px`)
          .toBeLessThanOrEqual(room)
        // ⭐⭐ AND THE OTHER HALF OF THE GEOMETRY: the bubble LEANS toward the mark rather than
        // sitting in the middle of the chart. ⚠ THIS LINE EXISTS BECAUSE ITS ABSENCE WAS MEASURED.
        // The first arm run against this section – the bubble's `max-width` removed – came in at
        // **0 RED**, a null arm, because `white-space: nowrap` means `max-width` constrains nothing
        // anyway and the width assertion above is about the CONTENT. So §C was pinning the fit and
        // saying nothing at all about the placement that the fit depends on. A `justify-content`
        // that stopped tracking the mark is now red here, which is the regression that actually
        // matters: it is how the centred-and-clamped shape would come back.
        const lean = getComputedStyle(wrapper.find('.fund-chart-poprow').element).justifyContent
        expect(lean, `mark ${i}: the bubble leans toward its own end of the plot`)
          .toBe(i === 0 ? 'flex-start' : 'flex-end')
        await hit.trigger('click')
        await nextTick()
      }
    })
  }

  it('⭐ the tap target is a thumb and not a 4px circle', async () => {
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(withFundBuys([410, 440])))
    const cs = getComputedStyle(wrapper.findAll('.fund-chart-hit')[0].element)
    // ⚠ 24px IS THE FLOOR AND THE SHIPPED SIZE IS 30 – the painted ring is 7 viewBox units across,
    // which at a 351px card is about 8px. That gap is the whole reason the control is an HTML button
    // over the SVG rather than the `<circle>` itself.
    expect(lengthPx(cs.width, 0), 'wide enough to press').toBeGreaterThanOrEqual(24)
    expect(lengthPx(cs.height, 0), 'and tall enough').toBeGreaterThanOrEqual(24)
  })
})
