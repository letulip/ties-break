// ⭐⭐⭐ ROUND 30 #8 AND #10, ON THE SCREEN HE WILL LOOK AT – and #11's one re-worded sentence.
//
// #8: «Merch brand давай предложим пользователю несколько вариантов именования при покупке… один из
// вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу.»
// #10: «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно предложить
// уже существующее название бренда (если он есть) или снова "ввести своё".»
//
// ⚠⚠ THIS FILE EXISTS BECAUSE THE ENGINE ARMS CANNOT SEE THE SCREEN – round 30 #14's own lesson,
// in the same shape: `tests/round30-brand-naming.test.ts` proves the suggestions, the rules and the
// command, and deleting the paragraph that RENDERS the picker would leave every one of those green.
// A naming control the player cannot reach is not «+100 к индивидуальности».
//
// ⚠⚠ AND IT CARRIES THE 375px MEASUREMENT, which for THIS item is the whole risk: the string on the
// row is PLAYER-AUTHORED. `sanitiseAssetName` caps it at 24 code points, but twenty-four unbroken
// letters is a word no browser breaks on its own, and the house's own gotcha is that a layout fails
// one honest sentence at a time. Measured against the viewport, not eyeballed.
//
// ⚠ INVARIANT 4: this file asserts the sentences these items ADD and #11's one licensed re-wording,
// and says nothing about any other string on the row.
//
// ⚠ MUTATION-VERIFIED – the measured log is at the foot of this file.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { shelfRow } from './shelf'
import { PHONE, lengthPx, setViewport } from './fits'
import {
  ASSET_NAME_MAX_CHARS,
  buyAsset,
  closeTournament,
  createWorld,
  ownedAssets,
  shopItem,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'

function shopper(seed: string, kidName = 'Vera', kidLastName = 'Martin'): WorldState {
  const world = createWorld(seed)
  world.bestFinishByTier.wta250 = 3
  world.profile = { ...world.profile, kidName, kidLastName }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 30_000_000_00
  return world
}

async function mountShop(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  setViewport(PHONE)
})

describe('round 30 #8/#10 – the picker is on the screen', () => {
  it('⭐⭐⭐ the brand row offers her names as chips AND a field to type one', async () => {
    const world = shopper('r30-8-screen')
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The merch brand')

    const chips = row.findAll('.shop-naming-chip')
    expect(chips.length, 'a handful of suggestions').toBeGreaterThanOrEqual(3)
    const labels = chips.map((c) => c.text())
    expect(labels, 'her initials').toContain('VM')
    expect(labels, 'her surname').toContain('Martin')

    // ⭐ «ОДИН ИЗ ВАРИАНТОВ "ВВЕСТИ СВОЁ НАЗВАНИЕ"» – the field, and it is a real text input rather
    // than a chip that opens something.
    const field = row.find('input.shop-naming-input')
    expect(field.exists(), 'the free-text field').toBe(true)
    expect(field.attributes('type')).toBe('text')
    // ⚠ THE CAP IS FELT WHILE TYPING and it is the ENGINE's constant, not a number retyped here.
    expect(field.attributes('maxlength')).toBe(String(ASSET_NAME_MAX_CHARS))
    // ...and it starts on the first suggestion, so a player who never touches it still buys a brand
    // with her name on it.
    expect((field.element as HTMLInputElement).value).toBe('VM')
    wrapper.unmount()
  })

  it('⭐⭐ pressing a chip fills the field, so there is one value on screen and never two', async () => {
    const world = shopper('r30-8-chip')
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The merch brand')
    const chip = row.findAll('.shop-naming-chip').find((c) => c.text() === 'Martin')!
    await chip.trigger('click')
    expect((row.find('input.shop-naming-input').element as HTMLInputElement).value).toBe('Martin')
    expect(chip.classes(), 'and the chip reads as chosen').toContain('is-on')
    wrapper.unmount()
  })

  it('⭐⭐⭐ what is typed is what is SENT – the whole point of the free-text option', async () => {
    const world = shopper('r30-8-send')
    const store = useGameStore()
    const spy = vi.spyOn(store, 'buyAsset').mockResolvedValue(undefined as unknown as void)
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The merch brand')
    const field = row.find('input.shop-naming-input')
    await field.setValue('Harefield')
    await row.find('button.shop-action').trigger('click')
    // ⚠ THE CONFIRM'S LABEL IS THE CALLER'S, NOT «Confirm» – `ConfirmDialog`'s own contract («the
    // caller owns every word of it, so a confirm can never be announced as a generic Confirm») and
    // MoneyScreen passes the verb the shelf uses for this rung.
    const confirm = wrapper.findAll('.dialog-actions button').find((b) => b.text().trim() === 'Buy it')
    expect(confirm, 'the confirm control').toBeTruthy()
    await confirm!.trigger('click')
    expect(spy).toHaveBeenCalledWith('merch-brand', 250_000_00, 'Harefield')
    spy.mockRestore()
    wrapper.unmount()
  })

  it('⚠ ...and a rung that names nothing sends no name and draws no picker', async () => {
    // The discriminating negative. Without it the arms above would pass on a picker rendered on
    // every row of the shelf, which is the shape of defect round 30 #14's own file caught in itself.
    const world = shopper('r30-8-none')
    const store = useGameStore()
    const spy = vi.spyOn(store, 'buyAsset').mockResolvedValue(undefined as unknown as void)
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The good saloon')
    expect(row.find('.shop-naming').exists(), 'a saloon is not named').toBe(false)
    await row.find('button.shop-action').trigger('click')
    await wrapper.findAll('.dialog-actions button').find((b) => b.text().trim() === 'Buy it')!.trigger('click')
    expect(spy).toHaveBeenCalledWith('car-good', 110_000_00, undefined)
    spy.mockRestore()
    wrapper.unmount()
  })

  it('⭐⭐ an OWNED brand shows what they called it, and the academy offers that name back', async () => {
    const world = shopper('r30-10-screen')
    buyAsset(world, 'merch-brand', undefined, 'Harefield')
    const wrapper = await mountShop(toSnapshot(world))

    const brand = await shelfRow(wrapper, 'The merch brand')
    expect(brand.find('.shop-row-given-name').text()).toContain('Harefield')
    expect(brand.find('.shop-naming').exists(), 'a named family does not ask again').toBe(false)

    // ⭐ HIS #10: the academy is offered the brand they already built, first.
    const land = await shelfRow(wrapper, 'The land')
    const chips = land.findAll('.shop-naming-chip').map((c) => c.text())
    expect(chips[0]).toBe('Harefield')
    expect(chips, 'and the name-derived options are still there').toContain('Martin Academy')
    wrapper.unmount()
  })
})

describe('round 30 #8/#10 – the worst name a player can type fits a phone', () => {
  it('⭐⭐⭐ a 24-character unbroken name stays inside the card at 375x667', async () => {
    // ⚠⚠ THE WORST CASE THE ENGINE CAN PRODUCE, built through the real command so the string on
    // screen is one `sanitiseAssetName` really allows. 24 letters with no space in them is the
    // hardest thing to lay out, because nothing in it is a break opportunity.
    const world = shopper('r30-8-fit')
    buyAsset(world, 'merch-brand', undefined, 'W'.repeat(ASSET_NAME_MAX_CHARS))
    const stored = ownedAssets(world)[0].name!
    expect(stored, 'the fixture really is the worst case').toHaveLength(ASSET_NAME_MAX_CHARS)

    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The merch brand')
    const line = row.find('.shop-row-given-name')
    expect(line.exists()).toBe(true)

    const card = row.element
    const cardCs = getComputedStyle(card)
    const room =
      PHONE.width -
      (lengthPx(cardCs.paddingLeft, PHONE.width) || 0) -
      (lengthPx(cardCs.paddingRight, PHONE.width) || 0)
    expect(room, 'the card really has room to measure against').toBeGreaterThan(0)

    const cs = getComputedStyle(line.element)
    const fontSize = lengthPx(cs.fontSize, 0)
    expect(Number.isFinite(fontSize), 'the cascade reached the line').toBe(true)
    // ⚠ THE SAME ADVANCE `fits.ts` FITTED AGAINST REAL RENDERS (0.47 of the font size). The sentence
    // is «Trading as » plus the name, so the whole line is measured and not just the name.
    const widest = line.text().length * fontSize * 0.47
    expect(widest, `"${line.text()}" on one line at 375px`).toBeLessThan(room)

    // ⚠⚠ AND THE BELT, BECAUSE THE MEASUREMENT ABOVE IS AN ESTIMATE AND THE CAP IS A CHOICE: the
    // rule that lets a browser break an unbreakable word is declared, so a future re-tune of either
    // the cap or the type scale cannot make this row overflow – it can only make it wrap.
    expect(['anywhere', 'break-word'], 'the line may break a long word').toContain(cs.overflowWrap)
    wrapper.unmount()
  })

  it('⭐⭐ the chips wrap rather than pushing the card wide', async () => {
    const world = shopper('r30-8-chipfit', 'Alexandrina', 'Vasilievskaya')
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, 'The merch brand')
    const chips = row.findAll('.shop-naming-chip')
    expect(chips.length).toBeGreaterThan(0)
    // ⚠ THE LONGEST SUGGESTION THIS PROFILE CAN PRODUCE is the surname twice over, which is why the
    // fixture uses a long one: a short name would make this arm pass on any layout at all.
    expect(Math.max(...chips.map((c) => c.text().length)), 'a genuinely long chip').toBeGreaterThan(12)
    const wrap = getComputedStyle(row.find('.shop-naming-chips').element)
    expect(wrap.display, 'the chip row is a flex line').toContain('flex')
    expect(wrap.flexWrap, 'that wraps').toBe('wrap')
    for (const chip of chips) {
      const cs = getComputedStyle(chip.element)
      expect(cs.maxWidth, 'no chip may be wider than the card').toBe('100%')
    }
    wrapper.unmount()
  })
})

describe('round 30 #11 and #9 – what the rate line says now', () => {
  it('⭐⭐⭐ the merch row says what a business is worth, and the academy says it neither gains nor loses', async () => {
    // ⚠ #11 IS THE ONLY RE-WORDING ON THIS SCREEN AND IT IS LICENSED: «И как будто бы Holds its
    // value странно звучит тоже – это напрямую значит, что оно обесценивается, а это вроде бы не
    // совсем так». The engine was checked first (tests/round30-brand-value.test.ts §6): a rung at
    // rate 0 is worth what was paid for it forever and the sale is whole, so it does NOT depreciate.
    const world = shopper('r30-11-screen')
    const wrapper = await mountShop(toSnapshot(world))

    const merch = await shelfRow(wrapper, 'The merch brand')
    // ⭐⭐⭐ ROUND 30 #23 – THE SENTENCE IS UNTOUCHED AND THE NUMBER IN IT NOW MOVES. `earningsMultipleX`
    // on the ROW used to be the catalogue constant; it is now `base + what the career earned`
    // (`world/brand.ts`), so a career with nothing behind it reads the base and a career with
    // seasons, top-20 finishes and finals behind it reads more. ⚠ INVARIANT 4 IS INTACT: the wording
    // is byte-for-byte what round 30 #11 licensed – what changed is the value it interpolates, from a
    // number that had stopped being true to the one the shelf actually prices the row at.
    const base = shopItem('merch-brand')!.earningsMultipleX!
    expect(merch.find('.shop-row-rate').text()).toBe(`Worth ${base} years of what it sells`)
    expect(merch.text(), 'the sentence he read is gone from this row').not.toContain('Holds its value')

    // ⚠⚠ AND THE ARM THAT MAKES THAT A CLAIM RATHER THAN A RESTATEMENT: the SAME row, on a career
    // that has earned a higher multiple, says a bigger number through the same sentence. Without it
    // this test passes on a screen that had gone back to printing a constant.
    const earned = shopper('r30-11-screen-earned')
    earned.trophiesByTier.wta500 ??= { titles: [], finals: [] }
    earned.trophiesByTier.wta500.finals.push(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    const richer = await mountShop(toSnapshot(earned))
    const merchRicher = await shelfRow(richer, 'The merch brand')
    expect(merchRicher.find('.shop-row-rate').text()).toBe(`Worth ${base + 1} years of what it sells`)
    richer.unmount()

    const land = await shelfRow(wrapper, 'The land')
    expect(land.find('.shop-row-rate').text()).toBe('Neither gains nor loses')

    // ⚠ AND THE TWO SENTENCES THE ITEM DID **NOT** TOUCH ARE UNCHANGED, to the byte – invariant 4.
    const car = await shelfRow(wrapper, 'The good saloon')
    expect(car.find('.shop-row-rate').text()).toBe('Loses 9% a season')
    const fund = await shelfRow(wrapper, 'An index fund')
    expect(fund.find('.shop-row-rate').text()).toBe('Gains about 7% a season')
    wrapper.unmount()
  })
})

// =================================================================================================
// ⚠⚠ MUTATION LOG – measured, each applied ALONE and reverted. The full ten-mutation pass is run
// against BOTH halves and written up at the foot of `tests/round30-brand-naming.test.ts`; these are
// the ones that reddened HERE and nowhere else, which is what this file is for:
//
//  N1  the picker's `v-if` forced false                 -> 5 RED here, 0 in the engine file.
//  N2  the «Trading as» line's `v-if` forced false      -> 2 RED here, 0 in the engine file.
//  N3  `askBuy` sends `name: undefined`                 -> 1 RED here, ALONE, 0 in the engine file –
//      a screen that stops sending is invisible to every arm that calls `buyAsset` directly.
//  N4  ROUND 30 #23 – `shopView` sending the CATALOGUE base instead of the career's own multiple
//      -> 1 RED here (the rate line), alongside 1 in the engine file. ⚠ The arm that catches it is
//      the SECOND mount, on a career that has earned a higher multiple: an arm reading only the base
//      off the catalogue and comparing it with the screen is true of a constant too.
//  N9  `overflow-wrap: anywhere` removed from the line  -> 1 RED here, ALONE: the 375px arm. The
//      belt is measured, not decorative.
// =================================================================================================
