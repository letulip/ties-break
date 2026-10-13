// =================================================================================================
// ⭐⭐⭐ ROUND 51 #19 – THE FUND CARD PRINTS THE POSITION THAT IS LEFT, AS THE OWNER SEES IT
// =================================================================================================
//
// THE ITEM, 13.10: «Индексный фонд всё ещё не пересчитывается после продажи долей, см. скриншот,
// +62673 показывается всё еще хотя там явно написано сколько стоит и сколько заплачено»
//
// THE RULING, 13.10 evening: «была сумма, скажем 100к, ее положили, пришел процент, скажем 50 - стало
// 150к, доходность видна, мы сняли со счета 50к, там снова осталось 100к - какая теперь доходность?
// Мне кажется 0, прибыль изъята. … мы должны пересчитывать тоже в момент добавления (это кстати есть,
// доходность размывается) и в момент снятия (а этого нет)»
//
// THIS FILE IS THE MOUNTED HALF. The engine half (the formula table, the invariant, the sequence, the
// telescoping memos) is tests/round51-bank-model-sale.test.ts; the claim here is about what a PERSON
// reads: one real `shopView` snapshot goes into the real MoneyScreen, and the sentence on the card,
// the lines beside it and the sell-confirm dialog are read back off the DOM.
//
// ⚠ THE LIVE ROW IS POSED THROUGH THE REAL COMMAND FIRST. `buyAsset` opens the fund, then the position
// the owner's screenshot showed is written onto the row (paid 32,110 / worth 48,564 / the realised
// memory a pre-ruling sale left: 51,219). The realised COST is not his real figure (the brief does not
// carry it) – any figure shows the fold, which is the point of the mutation below.
//
// ⚠⚠ MUTATION-VERIFIED, 14.10, ONE AT A TIME (`git hash-object` of the three touched sources identical before and after every restore):
//   * the view half reverted (`changeCents` folds `realisedGainCents` back in)  -> the live-row arm RED printing «+$67,673 since you bought it (211%)» where
//     «+$16,454 since you bought it (51%)» is expected, and the owner's-example arm RED printing «+$50,000 (50%)» where «+$0 (0%)» is expected: 2 RED / 2 green.
//     With the percentage's base reverted too (`paid + realisedCost`) the same two arms go RED, still 2 / 2.
//   * the sale half reverted to the shipped pro-rata release                    -> 3 RED / 1 green: the example prints «+$33,333 since you bought it (50%)» (a third of the
//     profit realised, the rest still on the card) and both dialog arms go RED on their LEDGER half.
//   * the confirm-dialog preview back to a share of the row's gain (composables/shop.ts) -> the two dialog arms RED and nothing else (2 / 2): the engine files stay green.
//   * the underwater clamp removed from `bankSaleSplit`                         -> the underwater dialog arm RED alone (1 / 3).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
// ⚠ THE APP'S OWN SHEET, for the same reason tests/component/round34-money-shelf.test.ts imports it:
// the real cascade or nothing.
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { buyAsset, createWorld, sellAsset, shopItem, toSnapshot, type WorldState } from '../../src/engine/world'
import type { Snapshot } from '../../src/shared/protocol'
import { shelfRow } from './shelf'

const FUND = 'index-fund'
const fundLabel = (): string => shopItem(FUND)!.label

/** A world that owns the fund, bought through the real command, its POSITION then posed. */
function posedFund(seed: string, paidCents: number, valueCents: number): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  buyAsset(world, FUND, 40_000_00)
  const held = world.assets.find((a) => a.id === FUND)!
  held.paidCents = paidCents
  held.valueCents = valueCents
  return world
}

/** The Shop chapter, open, attached to the document – `fits.ts`'s own requirement. */
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

describe('⭐⭐⭐ the card, as he reads it', () => {
  it('his live fund row: worth 48,564, paid 32,110 => +$16,454 (51%), reconciling with its own lines – no folded 67,673', async () => {
    const world = posedFund('r51-19-live-card', 32_110_00, 48_564_00)
    const held = world.assets.find((a) => a.id === FUND)!
    held.realisedGainCents = 51_219_00
    held.realisedCostCents = 44_000_00
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, fundLabel())

    // the two lines the sentence has to reconcile with
    const worth = row.find('.money-row').text()
    expect(worth, 'worth now').toContain('$48,564')
    expect(worth, 'and what was paid').toContain('$32,110')
    // the sentence: 48,564 - 32,110 = 16,454, over the 32,110 that is still in = 51%
    expect(row.find('.shop-row-change').text()).toBe('+$16,454 since you bought it (51%)')
    expect(row.find('.shop-row-change').text(), 'the folded figure the shipped card printed').not.toContain('67,673')
  })

  it('the owner\'s own example, through the real command: 150k worth on 100k paid, 50k taken out, the card reads +$0 (0%)', async () => {
    const world = posedFund('r51-19-example-card', 100_000_00, 150_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    expect((await shelfRow(wrapper, fundLabel())).find('.shop-row-change').text()).toBe('+$50,000 since you bought it (50%)')

    sellAsset(world, FUND, 50_000_00)
    useGameStore().snapshot = toSnapshot(world)
    await nextTick()

    const row = await shelfRow(wrapper, fundLabel())
    expect(row.find('.money-row').text(), 'there is 100k left in the account').toContain('$100,000')
    expect(row.find('.shop-row-change').text(), '«Мне кажется 0, прибыль изъята.»').toBe('+$0 since you bought it (0%)')
  })
})

describe('⭐⭐ the sell-confirm quotes the figure the ledger will write', () => {
  /** Type `dollars` into the row's amount field, press Sell, and return everything the confirm dialog says. */
  async function dialogFor(world: WorldState, dollars: string): Promise<string> {
    const wrapper = await mountShop(toSnapshot(world))
    const row = await shelfRow(wrapper, fundLabel())
    await row.findAll('input.shop-stake-input')[0].setValue(dollars)
    const sell = row.findAll('button.shop-action').find((b) => b.text() === 'Sell')
    expect(sell, 'the Sell control').toBeTruthy()
    await sell!.trigger('click')
    return wrapper.text()
  }

  it('inside the profit: the dialog and the ledger both call the 50k profit, not a share of it', async () => {
    const dialog = await dialogFor(posedFund('r51-19-dialog-profit', 100_000_00, 150_000_00), '50000')
    expect(dialog).toContain(`Take $50,000 out of ${fundLabel()}`)
    expect(dialog, 'all of it is profit').toContain('That part is $50,000 more than it cost')

    const world = posedFund('r51-19-dialog-profit', 100_000_00, 150_000_00)
    sellAsset(world, FUND, 50_000_00)
    expect(world.events[world.events.length - 1].text, 'the ledger names the same figure').toContain('$50,000 more than it cost')
  })

  it('under water: the dialog and the ledger both say «exactly what it cost» – returned principal, the loss rides on', async () => {
    const dialog = await dialogFor(posedFund('r51-19-dialog-uw', 100_000_00, 50_000_00), '25000')
    expect(dialog).toContain(`Take $25,000 out of ${fundLabel()}`)
    expect(dialog).toContain('That part is exactly what it cost')

    const world = posedFund('r51-19-dialog-uw', 100_000_00, 50_000_00)
    sellAsset(world, FUND, 25_000_00)
    expect(world.events[world.events.length - 1].text).toContain('exactly what it cost')
  })
})
