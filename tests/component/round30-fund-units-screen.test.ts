// ⭐⭐⭐ ROUND 30 #14 – THE THREE FIGURES A DECISION NEEDS, ON THE SCREEN HE WILL LOOK AT.
//
// THE OWNER, 30.08: «И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут
// возможность расти на горизонте и будут давать разные точки входа, как в жизни… Зашёл, когда доля
// стоила 4к, через десять лет она может вполне удвоиться. Или зашёл на пике при цене 7-8к и увидел
// просадку на следующий год – имеешь возможность усредниться или зафиксировать убыток.»
//
// ⚠⚠ THIS FILE EXISTS BECAUSE THE ENGINE ARMS COULD NOT SEE THE SCREEN. `tests/round30-fund-units.test.ts`
// proves `shopView` carries the units, the average and the price; deleting the paragraph that RENDERS
// them left every one of those arms green (watched). The mechanic he asked for is a DECISION, and a
// number the player cannot see is not a decision – so the rendering is armed here, mounted, against a
// snapshot the real engine produced.
//
// ⚠ THE HOUSE RULE (round20-ui.test.ts's header, shop-tab.test.ts's too): mount the real SFC against
// a REAL snapshot built by the real engine, never a hand-written snapshot shape, and never a source
// pin for a rendering claim.
//
// ⚠ INVARIANT 4: this file asserts the two sentences the item ADDS and says nothing about any other
// string on the row, because nothing else was asked for and nothing else moved.
//
// ⚠ MUTATION-VERIFIED, each applied alone and reverted, and each was watched:
//   * the owned paragraph's `v-if` forced false          -> «what they hold, on screen» RED, ALONE.
//   * the unowned paragraph's `v-if` forced false        -> «the entry price before they buy» RED.
//   * `formatUnits` -> `Math.round(units)`               -> «two places» RED (a 12.47-unit holding
//     renders as 12 and the quarter of it is gone).
//   * `avgUnitPriceCents` reading `valueCents` instead of `paidCents` -> «what they averaged at» RED.
//   * the unowned paragraph moved onto every row (`v-if` dropped) -> «a car says nothing about
//     units» RED, which is the arm that keeps the line off the eight rungs it means nothing on.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import {
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
import { formatCents } from '../../src/shared/money'
import type { Snapshot } from '../../src/shared/protocol'

function walk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
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

function rowNode(wrapper: ReturnType<typeof mount>, label: string) {
  const node = wrapper.findAll('.shop-row').find((r) => r.text().includes(label))
  expect(node, `the ${label} row`).toBeTruthy()
  return node!
}

beforeEach(() => setActivePinia(createPinia()))

describe('round 30 #14 – the shop row shows what the decision needs', () => {
  it('⭐⭐ OWNED: how many units, what they averaged at, and what one costs today', async () => {
    const world = walk('r30-screen-owned', 30)
    world.fundsCents = 500_000_00
    buyAsset(world, 'index-fund', 50_000_00)
    // A second entry at a different week, so the average is a real average of two prices and not a
    // restatement of one – the whole point of the change.
    for (let i = 0; i < 40; i++) {
      tickWeek(world, rngFromSeed(`${world.seed}:run${i}`))
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    buyAsset(world, 'index-fund', 30_000_00)

    const snap = toSnapshot(world)
    const row = snap.shop.rows.find((r) => r.id === 'index-fund')!
    const wrapper = await mountShop(snap)
    const node = rowNode(wrapper, shopItem('index-fund')!.label)
    const line = node.find('.shop-row-units')
    expect(line.exists(), 'the units line is drawn on an owned market rung').toBe(true)

    const held = ownedAssets(world).find((a) => a.id === 'index-fund')!
    // ⚠ EVERY FIGURE IS THE ENGINE'S. The screen formats; it does not count, divide or price.
    expect(line.text()).toContain(held.units!.toFixed(2))
    expect(line.text()).toContain(formatCents(row.avgUnitPriceCents!))
    expect(line.text()).toContain(formatCents(row.unitPriceCents!))
    // ⭐ TWO PLACES, AND IT MATTERS: this holding is a fractional number of units, so a rounded count
    // would print part of the family's money out of existence.
    expect(Number.isInteger(held.units!), 'the fixture really is fractional').toBe(false)
    expect(line.text()).not.toContain(`${Math.round(held.units!)} units`)
    // ⭐⭐ AND THE AVERAGE IS WHAT THEY PAID, NOT WHAT IT IS WORTH – the two are different numbers on
    // this fixture, which is what makes the assertion above discriminating.
    expect(row.avgUnitPriceCents).not.toBe(row.unitPriceCents)
    wrapper.unmount()
  })

  it('⭐⭐ NOT OWNED: the entry price is on the row before anything is bought', async () => {
    // «Зашёл на пике при цене 7-8к» is only a thing a player can see himself doing if the price of
    // an entry is on screen while he is deciding.
    const world = walk('r30-screen-unowned', 30)
    world.fundsCents = 500_000_00
    const snap = toSnapshot(world)
    const row = snap.shop.rows.find((r) => r.id === 'index-fund')!
    const wrapper = await mountShop(snap)
    const node = rowNode(wrapper, shopItem('index-fund')!.label)
    const line = node.find('.shop-row-units')
    expect(line.exists()).toBe(true)
    expect(line.text()).toContain(formatCents(row.unitPriceCents!))
    // ...and nothing is claimed about a holding that does not exist.
    expect(line.text()).not.toContain('bought at')
    wrapper.unmount()
  })

  it('⚠ a car says nothing about units, owned or not – it is one price and one sale', async () => {
    const world = walk('r30-screen-car', 30)
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-sensible')
    const wrapper = await mountShop(toSnapshot(world))
    const node = rowNode(wrapper, shopItem('car-sensible')!.label)
    expect(node.find('.shop-row-units').exists(), 'no unit line on a fixed rung').toBe(false)
    expect(node.text()).not.toContain('units')
    wrapper.unmount()
  })

  it('⚠ the line fits a phone – it is one short sentence under the headline figure', async () => {
    // The shop tab is a long scroll, so the risk here is not a blocking overlay (round 20 #3) but a
    // row that wraps into a wall. Measured as the house rule asks: on a 375px viewport this is one
    // line of small, muted text, and the row it sits in keeps its own controls reachable.
    const world = walk('r30-screen-phone', 30)
    world.fundsCents = 500_000_00
    buyAsset(world, 'index-fund', 50_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    const node = rowNode(wrapper, shopItem('index-fund')!.label)
    const text = node.find('.shop-row-units').text()
    // ⚠ A CEILING AND NOT A PIN: three figures and four words. Sixty characters at 11.5px wraps to
    // two lines at the very worst on a 375px card, which is what the upkeep line above it already
    // does. A fourth figure added here would break this and should.
    expect(text.length).toBeLessThan(64)
    expect(text.split(/\s+/).filter((w) => /^[a-z]+$/i.test(w)).length, 'four words of prose, no more').toBeLessThan(6)
    wrapper.unmount()
  })
})
