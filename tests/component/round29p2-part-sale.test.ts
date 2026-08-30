// ⭐⭐⭐ ROUND 29 PART TWO #4, THE MOUNTED HALF – THE NUMBER HE ASKED TO BE ABLE TO TYPE.
//
// THE OWNER, 29.08: «при продаже бумаг надо дать возможность только часть продавать, иными словами
// при продаже надо дать цифровой инпут для ввода суммы продажи.»
//
// ⚠ THE ENGINE HALF IS tests/round29p2-part-sale.test.ts – the wallet, the remaining holding, the
// P&L across two sales and the guards. THIS file is only about the surface: the box exists on the
// rungs that are divisible and on no others, the control says what pressing it will do, and the
// figure that reaches the command is the figure that was typed.
//
// ⚠ MOUNTED, NOT PINNED – CLAUDE.md's rule. `game.sellAsset` is spied so the ARGUMENT is what is
// asserted: a screen that drew a perfect box and then sold the whole holding would pass every
// rendering check ever written for it, and that is the defect this file exists to catch.
//
// ⚠ MUTATION-VERIFIED – each turns exactly the named arm red, and each was watched doing it:
//   * `partCents` dropped from `confirmShop`'s call -> "the typed figure reaches the command", ALONE.
//   * `isTopUp(row)` -> `false` on the sale label   -> "the box is on the investments", ALONE.
//   * `isTopUp(row)` -> `true`  on the sale label   -> "and on nothing else", ALONE.
//   * `canSell`'s ceiling clause deleted            -> "the control refuses an impossible amount".
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { shelfRow } from './shelf'
import { buyAsset, createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import type { Snapshot } from '../../src/shared/protocol'

/** ⚠ WEEK 0, NO WALK, AND THAT IS THE POINT OF PART TWO #6 SHOWING UP HERE: the shelf is open from
 *  the first week, so a fixture that owns a deposit needs no professional mark to build. */
function owning(seed: string, itemId: string, stakeCents?: number): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 1_000_000_00
  buyAsset(world, itemId, stakeCents)
  return world
}

async function mountShop(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

// ⚠ RE-AIMED, ROUND 30 #5 – the shelf is six segments now, so a row is reached by pressing the tab
// a player presses (a deposit is on `Invest`, a car on `Cars`). Every claim below is unchanged; the
// helper leaves the row's own segment open so its controls can still be clicked.
// tests/component/shelf.ts carries the argument.
const rowFor = shelfRow

beforeEach(() => setActivePinia(createPinia()))

describe('part two #4 – the sale takes a number', () => {
  it('⭐⭐ the typed figure reaches the command, and only that figure', async () => {
    const world = owning('p2ui-part-sale', 'deposit', 100_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    const store = useGameStore()
    const sell = vi.spyOn(store, 'sellAsset').mockResolvedValue(undefined as never)

    const row = (await rowFor(wrapper, 'A savings deposit'))
    const box = row.findAll('input.shop-sell-input')
    expect(box, 'the numeric input he asked for').toHaveLength(1)
    expect(box[0].attributes('type'), 'numeric, so a phone shows the right keypad').toBe('number')
    await box[0].setValue('30000')

    // ⚠ THE CONTROL SAYS WHAT PRESSING IT WILL DO – it stops saying «Sell it for $100,000» the moment
    // a smaller figure is in the box, which is the R10-16 pairing: the control and the outcome tell
    // one story.
    const button = row.findAll('button.shop-action').find((b) => b.text().includes('Take out'))
    expect(button, 'the control names the part').toBeTruthy()
    expect(button!.text()).toContain('Take out $30,000')
    await button!.trigger('click')

    // The confirm dialog is the last gate, and it says what stays behind.
    const dialogText = wrapper.text()
    expect(dialogText).toContain('Take $30,000 out of A savings deposit')
    expect(dialogText, 'and that the rest keeps working').toContain('the rest stays invested')
    const confirm = wrapper.findAll('button').find((b) => /confirm|yes|take|sell/i.test(b.text()) && b.text() !== button!.text())
    expect(confirm, 'a confirm control').toBeTruthy()
    await confirm!.trigger('click')

    expect(sell, 'the CENTS that were typed, and the id').toHaveBeenCalledWith('deposit', 30_000_00)
    wrapper.unmount()
  })

  it('⭐ leaving the box blank still sells the whole holding – the command sends no amount', async () => {
    // ⚠ THE BACKWARD-COMPATIBLE HALF, AND IT IS A REAL CLAIM: `undefined` is the engine's «sell the
    // lot», so a player who never touches the box gets exactly the behaviour that shipped before.
    const world = owning('p2ui-whole-sale', 'deposit', 100_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    const store = useGameStore()
    const sell = vi.spyOn(store, 'sellAsset').mockResolvedValue(undefined as never)

    const row = (await rowFor(wrapper, 'A savings deposit'))
    const button = row.findAll('button.shop-action').find((b) => b.text().includes('Sell it for'))
    expect(button!.text()).toContain('Sell it for $100,000')
    await button!.trigger('click')
    const confirm = wrapper.findAll('button').find((b) => /confirm|yes|sell/i.test(b.text()) && b.text() !== button!.text())
    await confirm!.trigger('click')
    expect(sell).toHaveBeenCalledWith('deposit', undefined)
    wrapper.unmount()
  })

  it('⚠ the box is on the investments and on nothing else – a car is sold whole', async () => {
    const world = owning('p2ui-car', 'car-sensible')
    const wrapper = await mountShop(toSnapshot(world))
    const row = (await rowFor(wrapper, 'The sensible estate'))
    expect(row.findAll('input.shop-sell-input'), 'no part sale on a car').toHaveLength(0)
    expect(
      row.findAll('button.shop-action').map((b) => b.text()),
      'and the whole sale is still offered',
    ).toContainEqual(expect.stringContaining('Sell it for'))
    wrapper.unmount()
  })

  it('⚠ the control refuses an impossible amount rather than sending it', async () => {
    // ADVISORY, NOT THE GATE: `sellAsset` re-derives the ceiling and returns its own sentence with
    // the figure in it. What this asserts is that a disabled control and a refused click cannot tell
    // two stories – ask for more than is held and nothing is pressable.
    const world = owning('p2ui-over', 'deposit', 100_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    const row = (await rowFor(wrapper, 'A savings deposit'))
    await row.findAll('input.shop-sell-input')[0].setValue('250000')
    const button = row.findAll('button.shop-action').find((b) => /Take out|Sell it for/.test(b.text()))!
    expect(button.attributes('disabled'), 'more than they hold is not pressable').toBeDefined()
    wrapper.unmount()
  })
})
