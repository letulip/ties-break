// ⭐ ROUND 46 #1 (1a + 1b) – THE LISTED CARD'S TWO BUTTONS ARE ONE ROW ON EVERY FAMILY, AND ITS SELL READS `Sell now` IN YELLOW.
//
// owner, 05.10 (the whole message is on `shopSellRowNote` in src/composables/shop.ts): when an item is listed «withdraw» sits above «sell» on the
// cars, put them in one row; once listed «sell» becomes «sell now» and yellow; on the houses the two lie one on top of the other; check every
// section and make them the same.
//
// WHAT THIS CAN AND CANNOT SEE. happy-dom has no layout, so nothing here measures a pixel: the claims are STRUCTURAL – the two buttons are
// siblings in ONE container, that container is the same class on every family, and the Sell control's label and fill follow `row.listing`.
// The fit at 375px (does the pair stay on one line next to a painting?) is a layout claim: it was MEASURED in a real browser, and the numbers are
// in the round-46 ledger (item 1) – not here, because a test that cannot see a pixel must not claim one.
//
// THE FAMILIES ARE DATA, NOT A LIST I TYPED: `listAsset` is the engine's own word for «this can be listed», so the arm below tries every
// non-investment rung and counts the families that took it – and then asserts that set covers car, house, boat and plane, which is the
// owner's «check every section» as an executable fact.
//
// MUTATIONS (run on this file, each restored byte for byte, `cmp` clean – the verdicts are in the round-46 ledger, item 1):
//   * ShopPanel.vue: `shop-action--sell-now` taken off the listed Sell            -> the label-and-class arm goes red
//   * ShopPanel.vue: Withdraw put back in the badge's `.shop-row-listing` block   -> the one-row arms go red on every family that lists
//   * ShopPanel.vue: the fill's `background: var(--warning)` made `transparent`   -> the yellow-token arm goes red
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { SALE_LABELS } from '../../src/composables/shop'
import { useGameStore } from '../../src/stores/game'
import { createWorld, listAsset, toSnapshot, type WorldState } from '../../src/engine/world'
import { shopCatalogue, shopItem } from '../../src/engine/world/assets'
import { revalueAssets } from '../../src/engine/world/shop'
import type { OwnedAsset, Snapshot } from '../../src/shared/protocol'
// ⚠ THE APP'S OWN STYLESHEET – without it no token resolves and the colour measurements below are vacuous.
import '../../src/style.css'
import { contrastRatio, parseColor } from './contrast'
import { shelfRow } from './shelf'

const CAR = 'car-sensible'

/** Bought this week, so nothing has depreciated and a thin-market premise cannot move under the arm. */
function ownedRow(id: string, week: number): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: week, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week, cents: item.entryCents }] }
}

/** A hand-built career at `week` that owns exactly these rungs, revalued, and rich enough that nothing is «cannot afford». */
function worldOwning(seed: string, ids: readonly string[], week = 100): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.fundsCents = 500_000_000_00
  world.assets = ids.map((id) => ownedRow(id, week))
  revalueAssets(world)
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

type Mounted = Awaited<ReturnType<typeof mountShop>>

const rungsOf = (family: string) => shopCatalogue().filter((rung) => rung.family === family)

/** What a card's control row IS, as data: the container's classes, the children in order, and what each button reads and wears. */
async function controlsOf(wrapper: Mounted, id: string) {
  const row = await shelfRow(wrapper, shopItem(id)!.label)
  const buttons = row.findAll('button.shop-action')
  const container = buttons[0]?.element.parentElement ?? null
  return {
    row,
    buttons,
    container,
    signature: {
      texts: buttons.map((b) => b.text()),
      oneContainer: container !== null && buttons.every((b) => b.element.parentElement === container),
      containerClasses: container ? [...container.classList].sort() : [],
      containerChildren: container ? [...container.children].map((c) => c.tagName.toLowerCase()) : [],
      badgeBlockHoldsButton: row.find('.shop-row-listing button').exists(),
      fills: buttons.map((b) => b.classes().includes('shop-action--sell-now')),
    },
  }
}

/** Every family whose rungs the engine lets the player list, with the world that lists its first rung (the academy is one lot: all its rungs). */
function listedWorldFor(family: string): { id: string; world: WorldState } | null {
  const rungs = rungsOf(family)
  const id = rungs[0]!.id
  const world = worldOwning(`r46-b7-${family}`, family === 'academy' ? rungs.map((r) => r.id) : [id])
  try {
    listAsset(world, id)
  } catch {
    return null
  }
  // ⚠ «accepted» is not «listed»: the engine's own snapshot is what says the row is on the market.
  return toSnapshot(world).shop!.rows.find((r) => r.id === id)?.listing !== undefined ? { id, world } : null
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('ROUND 46 #1a – Withdraw and Sell are ONE row, on every family that can list', () => {
  const families = [...new Set(shopCatalogue().map((r) => r.family))].filter((f) => f !== 'investment')

  it('the engine lets car, house, boat and plane list – the families the owner named are all under test', () => {
    const listable = families.filter((f) => listedWorldFor(f) !== null)
    for (const named of ['car', 'house', 'boat', 'plane']) expect(listable, `${named} can list`).toContain(named)
  })

  for (const family of families) {
    it(`${family}: a listed card draws Withdraw then Sell as the only two children of ONE .shop-stake-row`, async () => {
      const set = listedWorldFor(family)
      if (set === null) return // a family the engine does not let anyone list has no listed card to draw
      const { row, buttons, container, signature } = await controlsOf(await mountShop(toSnapshot(set.world)), set.id)
      expect(row.find('.shop-row-listing').exists(), `${family}: the badge's own block is drawn`).toBe(true)
      expect(signature.texts).toEqual([SALE_LABELS.withdraw, SALE_LABELS.sellNow])
      expect(signature.oneContainer, `${family}: both buttons share ONE parent`).toBe(true)
      expect(container!.classList.contains('shop-stake-row'), `${family}: that parent is the card's one control row`).toBe(true)
      expect(container!.classList.contains('is-listed')).toBe(true)
      expect([...container!.children], `${family}: nothing else lives in the row`).toEqual(buttons.map((b) => b.element))
      expect(signature.badgeBlockHoldsButton, `${family}: no button is left in the badge's block`).toBe(false)
    })
  }

  it('every family that lists draws the SAME row – the same container, the same children, the same fill', async () => {
    const signatures: { family: string; signature: Awaited<ReturnType<typeof controlsOf>>['signature'] }[] = []
    for (const family of families) {
      const set = listedWorldFor(family)
      if (set === null) continue
      setActivePinia(createPinia())
      signatures.push({ family, signature: (await controlsOf(await mountShop(toSnapshot(set.world)), set.id)).signature })
    }
    expect(signatures.length, 'at least the four named families were measured').toBeGreaterThanOrEqual(4)
    for (const { family, signature } of signatures) expect(signature, `${family} against ${signatures[0]!.family}`).toEqual(signatures[0]!.signature)
  })
})

describe('ROUND 46 #1b – once listed the Sell control reads Sell now and is yellow', () => {
  it('unlisted: the control reads Sell, wears no fill, and there is no Withdraw and no badge block', async () => {
    const { signature } = await controlsOf(await mountShop(toSnapshot(worldOwning('r46-b7-unlisted', [CAR]))), CAR)
    expect(signature.texts).toEqual(['Sell'])
    expect(signature.fills).toEqual([false])
    expect(signature.containerClasses).not.toContain('is-listed')
  })

  it('listed: the SAME control reads Sell now – the words he gave, and the one constant the popup already prints', async () => {
    const world = worldOwning('r46-b7-listed', [CAR])
    listAsset(world, CAR)
    const { buttons } = await controlsOf(await mountShop(toSnapshot(world)), CAR)
    const sell = buttons[1]!
    expect(sell.text()).toBe('Sell now')
    expect(sell.text()).toBe(SALE_LABELS.sellNow)
    expect(sell.classes()).toContain('shop-action--sell-now')
    expect(buttons[0]!.text()).toBe('Withdraw')
    expect(buttons[0]!.classes(), 'only the Sell control is yellow').not.toContain('shop-action--sell-now')
  })

  it('the yellow is the design system\'s warning token, and the ink on it is legible (WCAG AA)', () => {
    // ⚠ READ FROM THE COMPILED SHEET AND THE ROOT TOKENS, NOT FROM `getComputedStyle(button)`: happy-dom does not match the scoped `[data-v-…]`
    // selectors of an SFC, so every computed colour on a scoped component comes back EMPTY (measured on a plain `.shop-action`: `color`,
    // `background` and `border-color` all ''), and `assertLegible` on it would measure the card underneath and pass on anything. The rule is
    // asserted to declare the TOKENS, and the tokens are resolved where happy-dom does resolve them – on :root.
    mount(MoneyScreen, { global: { stubs: { teleport: true } } }) // the component's stylesheet is injected on first import; mounting is belt and braces
    const css = [...document.head.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
    const rule = /\.shop-action--sell-now(?:\[data-v-[0-9a-f]+\])?\s*\{([^}]*)\}/.exec(css)
    expect(rule, 'the sheet carries a rule for the yellow control').not.toBeNull()
    const declared: Record<string, string> = {}
    for (const decl of rule![1]!.split(';')) {
      const at = decl.indexOf(':')
      if (at > 0) declared[decl.slice(0, at).trim()] = decl.slice(at + 1).trim()
    }
    expect(declared['background'], 'the fill is the design token, not a hex').toBe('var(--warning)')
    expect(declared['color'], 'and the ink is the dark half of the on-fill pair').toBe('var(--on-lime)')
    const root = getComputedStyle(document.documentElement)
    const fill = parseColor(root.getPropertyValue('--warning').trim())
    const ink = parseColor(root.getPropertyValue('--on-lime').trim())
    const [r, g, b] = fill
    const max = Math.max(r, g, b)
    const delta = max - Math.min(r, g, b)
    const hue = (60 * (max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) + 360) % 360
    expect(hue, `the fill (${r}, ${g}, ${b}) is yellow`).toBeGreaterThanOrEqual(35)
    expect(hue).toBeLessThanOrEqual(65)
    expect(delta / max, 'and strongly saturated, not a wash').toBeGreaterThan(0.5)
    expect(contrastRatio([ink[0], ink[1], ink[2]], [r, g, b]), 'ink on the fill').toBeGreaterThanOrEqual(4.5)
  })

  it('and it is still the SELL control: it opens the market popup, which offers no List for an ad already up; Withdraw takes the ad down', async () => {
    const world = worldOwning('r46-b7-behaviour', [CAR])
    listAsset(world, CAR)
    const wrapper = await mountShop(toSnapshot(world))
    const unlist = vi.spyOn(useGameStore(), 'unlistAsset').mockResolvedValue(undefined as never)
    const { buttons } = await controlsOf(wrapper, CAR)
    await buttons[0]!.trigger('click')
    expect(unlist).toHaveBeenCalledWith(CAR)
    await buttons[1]!.trigger('click')
    expect(wrapper.find('.sale-dialog').findAll('.dialog-actions button').map((b) => b.text())).toEqual(['Keep it', 'Sell now'])
  })
})
