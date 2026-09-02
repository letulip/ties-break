// =================================================================================================
// ⭐⭐ ROUND 34 – THE SHELF, AS HE SEES IT: #15 the sum, #16 the order, #18 the frame, #19 the
// chart, #20 the row
// =================================================================================================
//
// Five items from the same evening, all five about the shop, and all five are claims about what
// the SCREEN does. That is why every one of them is mounted here rather than pinned in source: a
// grep proving `is-owned` appears in an SFC says nothing about whether the card the player is
// looking at is painted, and CLAUDE.md's own gotcha is the house rule – «prefer a mounted test to a
// source pin».
//
// His words, kept here because a .vue file carries no Cyrillic even in a comment
// (tests/template-copy-rules.test.ts) and because a test that quotes the ask cannot drift from it:
//
//   #15  «Сумма дохода на savings меняется вниз если деньги вывести…» – the engine half, and the
//        reproduction that identified which figure he meant, are tests/round34-savings-income.test.ts
//   #16  «Business пододвинуть к Invest в магазине»
//   #18  «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую,
//        как с тренером делали»
//   #19  «для индексного фонда давай график нарисуем с точками его стоимости за пай с возможностью
//        выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет» – where the points come from, and why
//        nothing is stored, is tests/round34-fund-chart.test.ts
//   #20  «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»
//
// ⚠⚠ MUTATION-VERIFIED, EACH ARM AGAINST ITS OWN CHANGE. The ledger, run one at a time against the
// shipped code with the change reverted:
//
//   * `SHELF_TAB_OPTIONS` put back in its round-30 order (Business fourth) -> «Business is the
//     segment next to Invest» RED, and `round30-subtabs.test.ts`'s rendered-pills assertion RED with
//     it, because that file reads the same `SHELF_TAB_LABELS` this one does.
//   * `:class="{ 'is-owned': ... }"` deleted from the shelf's `Card` -> all three #18 arms RED, the
//     three #20 arms and both #16 arms still green.
//   * the `is-owned` predicate widened to `true` (every rung framed) -> all three #18 arms RED
//     again, and they fail for three DIFFERENT reasons – the unowned card now carries the class, it
//     now paints the accent, and the framed set no longer equals what the engine says is owned.
//     A frame that means nothing is caught as loudly as a frame that is missing.
//   * `.shop-row.is-owned`'s three declarations deleted from the style block, TEMPLATE UNTOUCHED ->
//     «it is the coach's own frame» RED **alone**; the class-presence arms stay green. That is the
//     reason both are written: one says the card is marked, the other says the mark is painted, and
//     only the second one can tell that the paint went missing.
//   * the `.shop-stake-row` wrapper unwound, so the field and the button are siblings of the card
//     body again -> all three #20 arms RED, both #16 and all three #18 green.
//   * `.shop-stake-input`'s width 8.5em -> 30em, STRUCTURE UNTOUCHED -> the 375x667 `fits` arm RED
//     and NOTHING else in the file. That is the one that says the row was measured against a phone:
//     the controls are still in one row element, they simply no longer fit on his screen.
//   * `changeCents` put back to `valueCents - paidCents` in `shopView` -> the #15 arm RED alone, and
//     with it the engine file's own arms. The sentence on screen is the sentence the engine wrote.
//   * the range picker's `@click` made a no-op, labels untouched -> «each of his four windows draws
//     its own number of months» RED **and** «the axis names the window it is showing» RED. A picker
//     that changes the label and not the picture is exactly what those two exist to catch.
//   * `chartPoints`' `slice(-chartMonths)` -> `slice()` (always the whole series) -> all three #19
//     picture arms RED, including «one dot a month», which is the one that pins the DEFAULT window.
//   * `.fund-chart-range`'s `padding` 4px 9px -> 40px 90px, nothing else -> the 375x667 range-picker
//     arm RED alone: four controls that no longer stand on one line of a phone.
//   ⚠ The engine-side mutations for #19 – the month walk, the mean, the `volBps` predicate, the
//     series length – are in tests/round34-fund-chart.test.ts's own ledger.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
// ⚠ THE APP'S OWN SHEET. `.cm-row.current` – the frame #18 points at – lives in src/style.css, and
// the shelf's own rules live in MoneyScreen's scoped block. Both are needed: this file compares one
// against the other through the real cascade, and without the sheet that comparison is vacuous.
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { buyAsset, createWorld, revalueAssets, sellAsset, toSnapshot, type WorldState } from '../../src/engine/world'
import type { Snapshot } from '../../src/shared/protocol'
import { PHONE, assertInlineRowFits, setViewport } from './fits'
import { SHELF_TAB_LABELS, openShelfTab, shelfRow } from './shelf'

/** A world that owns one rung, bought with real money through the real command. ⚠ `buyAsset` and
 *  not a hand-written `assets` row: the framed state has to be one the game can actually produce. */
function owning(itemId: string, stakeCents?: number): WorldState {
  const world = createWorld('r34-shelf')
  world.fundsCents = 5_000_000_00
  buyAsset(world, itemId, stakeCents)
  return world
}

/** The Shop chapter, open, attached to the document – `fits.ts`'s own requirement: a detached tree
 *  gets none of the real cascade, so anything measured off it would be vacuous rather than wrong. */
async function mountShop(snapshot: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

describe('⭐ #16 – Business is next to Invest', () => {
  it('the shelf draws Business as the segment immediately after Invest', async () => {
    const wrapper = await mountShop(toSnapshot(createWorld('r34-order')))
    const labels = wrapper.findAll('.shelf-tabs .tab-pill').map((p) => p.text().trim())
    // ⚠ THE POSITION IS THE ITEM, so it is asserted as a position and not as a whole list: «next to
    // Invest» is true of exactly one index, and reading it off the rendered pills is what makes this
    // a statement about the screen.
    expect(labels.indexOf('Business'), 'Business sits second, right beside Invest').toBe(
      labels.indexOf('Invest') + 1,
    )
    // ...and the six are still the six. An item about ORDER must not be able to pass by dropping a
    // tab, and CLAUDE.md invariant 4 says the words themselves may not move either.
    expect(labels).toEqual([...SHELF_TAB_LABELS])
    expect(labels).toHaveLength(6)
  })

  it('the segment still opens the family it always opened', async () => {
    // ⚠ AN ORDER CHANGE THAT QUIETLY REPOINTED A TAB WOULD PASS THE TEST ABOVE. This is the other
    // half: press the moved segment and read what it shows.
    const wrapper = await mountShop(toSnapshot(createWorld('r34-order-2')))
    await openShelfTab(wrapper, 'Business')
    const heads = wrapper.findAll('.shop-family-head').map((h) => h.text())
    expect(heads, 'both families, the academy still a subdivision of Business').toEqual([
      'The business',
      'Her academy',
    ])
  })
})

describe('⭐ #18 – what they own is in the coach’s frame', () => {
  /** The three declarations `.cm-row.current` paints, read off a bare element through the real
   *  sheet. ⚠ THIS IS THE POINT OF THE ITEM: he asked for the frame «как с тренером делали», so the
   *  expected value is not a colour typed into this test – it is whatever the coach row draws today.
   *  Move `--accent` and both sides move together; write a second convention and this goes red. */
  function coachFrame(): { border: string; background: string; shadow: string } {
    const probe = document.createElement('div')
    probe.className = 'cm-row current'
    document.body.appendChild(probe)
    const cs = getComputedStyle(probe)
    const frame = { border: cs.borderTopColor, background: cs.backgroundColor, shadow: cs.boxShadow }
    probe.remove()
    return frame
  }

  it('an owned rung carries the frame and an unowned one does not', async () => {
    // The deposit is bought; the index fund beside it is not. Same family, same tab, one card apart.
    const wrapper = await mountShop(toSnapshot(owning('deposit', 50_000_00)))
    const mine = await shelfRow(wrapper, 'A savings deposit')
    const theirs = await shelfRow(wrapper, 'An index fund')
    expect(mine.classes(), 'the rung the family holds').toContain('is-owned')
    expect(theirs.classes(), 'the rung on the shelf beside it').not.toContain('is-owned')
  })

  it('the frame it paints is the coach card’s own, through the real cascade', async () => {
    const wrapper = await mountShop(toSnapshot(owning('deposit', 50_000_00)))
    const mine = await shelfRow(wrapper, 'A savings deposit')
    const theirs = await shelfRow(wrapper, 'An index fund')
    const coach = coachFrame()
    const cs = getComputedStyle(mine.element)
    // ⚠ ALL THREE, because the frame is all three. A border alone reads as a hairline – round-21
    // #11's own note in style.css is why the ring exists – and the wash is what makes an owned card
    // read as a different KIND of card rather than as a card with a coloured edge.
    expect(cs.borderTopColor, 'the accent border').toBe(coach.border)
    expect(cs.backgroundColor, 'the 7% accent wash').toBe(coach.background)
    expect(cs.boxShadow, 'the outer ring that makes it a frame').toBe(coach.shadow)
    // ...and it really is a difference: the unframed card next to it draws none of the three.
    const plain = getComputedStyle(theirs.element)
    expect(plain.borderTopColor, 'an unowned card keeps the card hairline').not.toBe(coach.border)
    expect(plain.boxShadow, 'and no ring').not.toBe(coach.shadow)
  })

  it('the frame follows ownership across the whole shelf, not just Invest', async () => {
    // ⚠ «В магазине те пункты» IS THE WHOLE SHOP, so the claim is walked over all six segments: the
    // framed set is exactly the set the engine says the family owns. A rule that only reached one
    // tab would pass both tests above.
    const wrapper = await mountShop(toSnapshot(owning('car-sensible')))
    const held = new Set(
      (useGameStore().snapshot?.shop?.rows ?? []).filter((r) => r.valueCents !== null).map((r) => r.label),
    )
    expect(held.size, 'the family holds exactly one thing').toBe(1)
    const framed: string[] = []
    for (const tab of SHELF_TAB_LABELS) {
      await openShelfTab(wrapper, tab)
      for (const card of wrapper.findAll('.shop-row')) {
        if (card.classes().includes('is-owned')) framed.push(card.find('.shop-row-name').text())
      }
    }
    expect(framed, 'framed on screen == owned in the engine').toEqual([...held])
  })
})

describe('⭐ #15 – the sentence on the savings card does not fall when money is taken out', () => {
  // ⚠ THE ENGINE HALF IS tests/round34-savings-income.test.ts, with the reproduction that identified
  // WHICH of the card's three numbers he was reading. This is the other half and it is a different
  // claim: the string a person sees is the string the engine wrote, before and after the withdrawal.
  // A screen that formatted the figure itself, or held a stale copy, would pass there and fail here.
  it('the printed gain and percentage survive a part sale', async () => {
    const world = owning('deposit', 100_000_00)
    world.week += 52 * 10
    revalueAssets(world)
    const wrapper = await mountShop(toSnapshot(world))
    const before = (await shelfRow(wrapper, 'A savings deposit')).find('.shop-row-change').text()
    expect(before, 'ten years of interest, on screen').toMatch(/^\+\$[\d,]+ since they bought it \(\d+%\)$/)

    // Take half out through the engine's own command, then re-render from the new snapshot.
    sellAsset(world, 'deposit', Math.round(world.assets[0].valueCents / 2))
    useGameStore().snapshot = toSnapshot(world)
    await nextTick()

    const after = (await shelfRow(wrapper, 'A savings deposit')).find('.shop-row-change').text()
    expect(after, 'the same sentence, word for word').toBe(before)
    // ...and the card really did change around it, so this is not a screen that failed to re-render.
    const worth = (await shelfRow(wrapper, 'A savings deposit')).find('.money-row').text()
    expect(worth, 'the holding on screen is half of what it was').not.toContain('$136,626')
  })
})

describe('⭐ #19 – the fund’s chart, and its four windows', () => {
  // ⚠ THE ENGINE HALF – where the points come from, that nothing is stored, and that a career which
  // predates the item has its whole chart – is tests/round34-fund-chart.test.ts. This file asks the
  // only question that one cannot: does pressing a range button change the picture on the card.
  async function fundCard(week: number) {
    const world = createWorld('r34-19-ui')
    world.week = week
    const wrapper = await mountShop(toSnapshot(world))
    return { wrapper, row: await shelfRow(wrapper, 'An index fund') }
  }

  it('the card draws a chart with one dot a month', async () => {
    const { row } = await fundCard(52 * 11)
    expect(row.find('.fund-chart').exists(), 'the chart is on the fund’s card').toBe(true)
    expect(row.find('.fund-chart-plot').exists(), 'and it is drawn').toBe(true)
    // ⚠ «с точками его стоимости за пай» – the dots ARE the item, so they are counted rather than
    // assumed from the presence of a line.
    expect(row.findAll('.fund-chart-dot').length).toBe(12)
    expect(row.find('.fund-chart-line').attributes('points')!.split(' ')).toHaveLength(12)
  })

  it('⭐⭐ each of his four windows draws its own number of months', async () => {
    // ⚠ ONE ARM PER BUTTON, and the counts are the windows themselves: 6 / 12 / 24 / 60. A picker
    // that changed the label and not the picture would pass a «the buttons exist» test.
    const { row } = await fundCard(52 * 11)
    const buttons = row.findAll('.fund-chart-range')
    expect(buttons.map((b) => b.text()), 'his four, spelled in English').toEqual([
      '6 months',
      '1 year',
      '2 years',
      '5 years',
    ])
    for (const [i, months] of [6, 12, 24, 60].entries()) {
      await buttons[i].trigger('click')
      await nextTick()
      expect(row.findAll('.fund-chart-dot').length, `the ${buttons[i].text()} window`).toBe(months)
      expect(buttons[i].classes(), 'and the pressed one says so').toContain('is-on')
      expect(buttons[i].attributes('aria-pressed')).toBe('true')
    }
  })

  it('the axis names the window it is showing, at both ends', async () => {
    const { row } = await fundCard(52 * 11)
    await row.findAll('.fund-chart-range')[0].trigger('click')
    await nextTick()
    const six = row.find('.fund-chart-axis').text()
    await row.findAll('.fund-chart-range')[3].trigger('click')
    await nextTick()
    const five = row.find('.fund-chart-axis').text()
    // Five years reaches further back than six months, so the left-hand label has to differ.
    expect(five, 'a wider window starts earlier').not.toBe(six)
    expect(five).toMatch(/^[A-Z][a-z]{2} '\d\d/)
  })

  it('⚠ a career too young for a line says so, and invents nothing', async () => {
    const { row } = await fundCard(2)
    expect(row.find('.fund-chart').exists(), 'the block is still there').toBe(true)
    expect(row.find('.fund-chart-plot').exists(), 'but there is no line to draw').toBe(false)
    expect(row.find('.fund-chart-empty').text()).toContain('One month of prices so far')
    expect(row.findAll('.fund-chart-dot')).toHaveLength(0)
  })

  it('⚠ no chart on the rungs that do not ride the market', async () => {
    const { wrapper } = await fundCard(400)
    const deposit = await shelfRow(wrapper, 'A savings deposit')
    expect(deposit.find('.fund-chart').exists(), 'the deposit’s price is a flat curve').toBe(false)
    const car = await shelfRow(wrapper, 'The sensible estate')
    expect(car.find('.fund-chart').exists()).toBe(false)
  })

  it('⚠ round-20 #3 – the four range controls fit inside a 375x667 phone', async () => {
    setViewport(PHONE)
    const { row } = await fundCard(52 * 11)
    const ranges = row.find('.fund-chart-ranges')
    assertInlineRowFits(
      ranges.element,
      row.findAll('.fund-chart-range').map((b) => b.element),
      PHONE,
      'the chart’s range picker',
    )
  })
})

describe('⭐ #20 – put more in / sell it stand beside their inputs', () => {
  it('each control is in one row with the field it acts on', async () => {
    const wrapper = await mountShop(toSnapshot(owning('index-fund', 200_000_00)))
    const row = await shelfRow(wrapper, 'An index fund')
    const lines = row.findAll('.shop-stake-row')
    expect(lines, 'the top-up line and the sell line').toHaveLength(2)
    for (const line of lines) {
      const field = line.find('input')
      const control = line.find('button')
      expect(field.exists(), 'the amount field is on this line').toBe(true)
      expect(control.exists(), 'and so is the control').toBe(true)
      // ⚠ STRUCTURE, NOT CLASS NAMES: the field and the button share ONE row element. A stacked
      // layout that happened to grow a `.shop-stake-row` class around each half separately would
      // fail here, which is the defect this assertion is shaped to catch.
      expect(field.element.closest('.shop-stake-row')).toBe(line.element)
      expect(control.element.parentElement).toBe(line.element)
    }
    // ...and they are the two he named, still saying what they always said.
    expect(lines[0].find('button').text()).toBe('Put more in')
    expect(lines[1].find('button').text()).toMatch(/^Sell it for \$/)
  })

  it('⚠ round-20 #3 – both rows really fit on one line at 375x667', async () => {
    // ⚠ A LARGE HOLDING ON PURPOSE. The sell control interpolates the whole value, so a family that
    // has run the fund for years is the widest this row ever gets – measuring the $5,000 case would
    // be measuring the easy one.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(owning('deposit', 1_000_000_00)))
    const row = await shelfRow(wrapper, 'A savings deposit')
    const lines = row.findAll('.shop-stake-row')
    expect(lines).toHaveLength(2)
    expect(lines[1].find('button').text(), 'the widest the control gets').toContain('$1,000,000')
    for (const line of lines) {
      assertInlineRowFits(
        line.element,
        [line.find('input').element, line.find('button').element],
        PHONE,
        `the ${line.find('button').text()} row`,
      )
    }
  })

  it('a rung with nothing to type keeps a single, full control', async () => {
    // ⚠ THE WRAPPER IS UNCONDITIONAL, so a car – which has one price and one sale – has to come out
    // of it unharmed. This is the arm that catches the alternative implementation, where the button
    // is duplicated behind two opposite `v-if`s and one copy silently loses a handler.
    const wrapper = await mountShop(toSnapshot(owning('car-sensible')))
    const row = await shelfRow(wrapper, 'The sensible estate')
    const lines = row.findAll('.shop-stake-row')
    expect(lines, 'one line, and it is the sale').toHaveLength(1)
    expect(lines[0].findAll('input'), 'a car has no amount to type').toHaveLength(0)
    expect(lines[0].findAll('button'), 'exactly one control, never two copies').toHaveLength(1)
    expect(lines[0].find('button').text()).toMatch(/^Sell it for \$/)
  })
})
