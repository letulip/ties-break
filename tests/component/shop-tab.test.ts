// ⭐⭐ THE SHELF, MOUNTED – the fourth chapter of the Budget tab (v63, the shop slice 1).
// docs/specs/the-shop-2026-08.md §2.
//
// ⚠ THE HOUSE RULE THIS FILE IS WRITTEN UNDER (round20-ui.test.ts's header): mount the real SFC
// against a REAL snapshot built by the real engine, never a hand-written snapshot shape, and never a
// source pin for a rendering claim. Every figure asserted below is one `toSnapshot` produced.
//
// ⚠ AND THE THREE THINGS §2 FORBIDS ARE ASSERTED AS ABSENCES, which is the only way to test a rule
// written as a prohibition: «never a locked row, a progress bar or a teaser». A shelf that quietly
// grew a greyed-out row with a "reach $60,000 to unlock" bar would pass every positive test here.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, buyAsset, skipTournament, closeTournament, type WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, setViewport, PHONE } from './fits'
// ⭐⭐ ROUND 30 #5 – THE SHELF HAS SIX SEGMENTS NOW, so a mounted test reaches a rung by pressing the
// tab a player would press. Every claim in this file is the one it always made; what changed is the
// route to the row. The helpers' own header carries the argument, including why «every rung is on
// the shelf» is now walked rather than counted in one document.
import { allShelfRows, openShelfTab, shelfRow, shelfText } from './shelf'

/** A real career, walked by the real engine – `tests/helpers/career.ts`'s own recipe, kept local
 *  because these fixtures need the world afterwards (the professional mark, the purchase) and that
 *  helper deliberately returns only the snapshot. */
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

/** ⚠ THE DOOR IS OPENED THE WAY THE ENGINE OPENS IT – `activeLadderOf`'s professional arm reads the
 *  never-pruned `bestFinishByTier` mark. Walking a career to a real counting W-series result would
 *  take hundreds of weeks per test in a suite whose whole point is that it is fast; writing the mark
 *  is the same one-way door, set at its own source. */
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

async function mountShop(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  // ⚠ `attachTo: document.body` FOR THE MEASURED CASE ONLY, and `fits.ts` says why: a detached tree
  // gets none of the real cascade, so a fit measured off it would be vacuous rather than wrong.
  const wrapper = mount(MoneyScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  // ⚠ THE TAB HAS TO BE PRESSED AND AWAITED – the chapter blocks sit behind a `v-if` on the screen's
  // own tab state, so nothing about the shelf is in the document until the segment is clicked.
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('the shelf is a fourth chapter of the Budget tab, and nothing else', () => {
  it('⭐ §2 – one more segment on the chapter picker, no new navigation', async () => {
    const wrapper = await mountShop(toSnapshot(professional(walk('shop-ui-tab', 20))))
    expect(wrapper.findAll('.money-tabs .tab-pill').map((t) => t.text())).toEqual([
      'Spending',
      'Bills',
      'History',
      'Shop',
    ])
    // The three other chapters really are gone while this one shows – it is one `v-if` block, not a
    // fourth screen bolted under the third.
    expect(wrapper.find('.money-summary').exists()).toBe(false)
    expect(wrapper.find('.money-kit').exists()).toBe(false)
    expect(wrapper.find('.money-shop').exists()).toBe(true)
    // ⚠ RE-AIMED, ROUND 30 #5: `.money-shop` is now the «The shelf» plate at the head of the
    // chapter and the rungs are free-standing cards in `.shelf-feed` beneath it – «карточки лежат
    // без общей подложки». Both are asserted, because "the shelf is one chapter" is the claim and
    // it is now made by two elements.
    // ⚠⚠ RE-AIMED AT ROUND 35 #3, NEVER LOOSENED – THE SHOP OPENS ON ITS HOME. He asked for a front
    // door («главная магазина становится главной с текущей the shelf, выбором категорий из 6
    // карточек»), so pressing `Shop` now lands on the plate and the six category cards, and the
    // rungs and their switcher arrive one press later. Both halves are still asserted here and the
    // claim is the same claim – «the shelf is ONE chapter of this screen, not a fourth screen bolted
    // under the third» – which the two-level shop makes MORE pointed rather than less: the home is
    // still inside the `screenTab === 'shop'` block, the chapter picker above is untouched, and
    // nothing was navigated to.
    expect(wrapper.find('.shelf-cats').exists(), 'the home offers the six categories').toBe(true)
    expect(wrapper.find('.shelf-feed').exists(), 'and no rungs until one is chosen').toBe(false)
    expect(wrapper.find('.shelf-tabs').exists(), 'and no switcher on the home').toBe(false)
    await openShelfTab(wrapper, 'Cars')
    expect(wrapper.findAll('.money-tabs .tab-pill'), 'the chapter picker is untouched').toHaveLength(4)
    expect(wrapper.find('.shelf-feed').exists(), 'the rungs are laid on the page').toBe(true)
    expect(wrapper.find('.shelf-tabs').exists(), 'and the shelf has its own tabs').toBe(true)
    wrapper.unmount()
  })

  it('⭐⭐ ROUND 29 PART TWO #6 – the junior years get THE WHOLE SHELF, rows and controls', async () => {
    // ⚠⚠ RE-AIMED, NOT DELETED, AND IT IS THE EXACT INVERSION. This arm read «the junior years get
    // ONE SENTENCE – no rows, no controls, nothing to look at» and asserted §2's shut shelf. His
    // ruling of 29.08 overturns §2 on this point (his words are in `shopAlwaysOpenNote` in
    // MoneyScreen.vue, because Cyrillic may not appear in a template or a test's own template), so
    // the same fixture must now show everything. ⭐ This is the arm that would catch the gate
    // creeping back, and it is the evidence for what a fourteen-year-old can now see and buy.
    const world = walk('shop-ui-junior', 20)
    const snap = toSnapshot(world)
    expect(snap.ageYears, 'the fixture really is a junior career').toBeLessThan(16)
    const wrapper = await mountShop(snap)
    // EVERY rung is drawn – the shelf is a window, and it is open.
    // ⚠ RE-AIMED, ROUND 30 #5, AND THE CLAIM IS UNCHANGED: §2's rule is that every price is on
    // screen whether the family can reach it or not, and with six segments the honest form of that
    // is REACHABLE ACROSS THE SIX rather than present in one document. `allShelfRows` presses each
    // tab in turn – if a rung fell out of the map in `SHELF_TAB_FAMILIES` it would go missing here.
    const everyRung = await allShelfRows(wrapper)
    expect(everyRung).toHaveLength(snap.shop.rows.length)
    expect(everyRung.length).toBeGreaterThan(5)
    // ⚠ AND THE THREE PROHIBITIONS OF §2 STILL HOLD, which is the half of the old arm that survives
    // his ruling untouched: no locked row, no progress bar, no teaser. They are asserted as
    // absences because that is the only way to test a rule written as a prohibition.
    // ⚠ RE-AIMED at `.shelf-feed`, which is where the rungs live now – asserted against
    // `.money-shop` it would have been a check on a plate that no longer contains a single row.
    expect(wrapper.findAll('.shelf-feed progress')).toHaveLength(0)
    expect(await shelfText(wrapper), 'no locked sentence is left to print').not.toContain('opens with her professional career')
    // ⚠⚠ AND SOMETHING IS ACTUALLY PRESSABLE AT FOURTEEN – a shelf drawn but dead would be the
    // «locked row» §2 forbids wearing a different hat. The deposit is the cheapest rung at $1,000
    // and this family's starting funds clear it, so its control is live.
    const deposit = await shelfRow(wrapper, 'A savings deposit')
    expect(deposit, 'the deposit is on the junior shelf').toBeTruthy()
    const button = deposit.findAll('button.shop-action').find((b) => b.text().includes('Put it in'))
    expect(button, 'and it has a control').toBeTruthy()
    expect(button!.attributes('disabled'), 'which a fourteen-year-old family can really press').toBeUndefined()
    wrapper.unmount()
  })

  it('⭐⭐ §2 – an EMPTY shelf names the cheapest thing and its price, and shows every row anyway', async () => {
    const snap = toSnapshot(professional(walk('shop-ui-empty', 20)))
    const wrapper = await mountShop(snap)
    const text = wrapper.text()
    // The engine chose the row and the words quote it – the screen does not sort the catalogue.
    // ⚠ THIS SENTENCE IS ON THE «The shelf» PLATE, which is above the tabs and true on all six, so
    // it is still read off the chapter as it opens.
    expect(snap.shop.cheapestId).toBe('deposit')
    expect(text).toContain('The cheapest thing here is')
    expect(text).toContain('A savings deposit')
    expect(text).toContain('$1,000')
    // ...and every rung is on the shelf, priced, whether the family can reach it or not.
    // ⚠ RE-AIMED, ROUND 30 #5 – walked across the six segments; $300,000 is a car and lives one tab
    // away from the one the chapter opens on, which is precisely why the walk is the assertion.
    expect(await allShelfRows(wrapper)).toHaveLength(snap.shop.rows.length)
    expect(await shelfText(wrapper)).toContain('$300,000')
    wrapper.unmount()
  })
})

describe('what the shelf says about a thing the family owns', () => {
  function ownedSnapshot(seed: string): Snapshot {
    const world = professional(walk(seed, 20))
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-good')
    // Two seasons of 9%, written straight onto the stored value: the same figure `revalueAssets`
    // reaches by ticking, without paying for 104 ticks in a component suite.
    world.assets[0].valueCents = 91_091_00
    return toSnapshot(world)
  }

  it('⭐⭐ §3b – prints the loss, and prints the ENGINE’s figures rather than its own', async () => {
    const snap = ownedSnapshot('shop-ui-owned')
    const row = snap.shop.rows.find((r) => r.id === 'car-good')!
    expect(row.changeCents).toBe(-18_909_00)
    expect(row.changePct).toBe(-17)
    const wrapper = await mountShop(snap)
    // ⚠ RE-AIMED, ROUND 30 #5: a car lives on the `Cars` segment, so the text this arm reads is the
    // shelf's across its six tabs rather than the one page that happens to be open first.
    const text = await shelfText(wrapper)
    // ⚙ ROUND 36 REVIEW #12 – «С купленной машины убираем paid серые буквы», so the $110,000 this
    // line used to look for is no longer printed on a car. ⚠ THE ARM IS NOT WEAKENED BY DROPPING
    // IT: what it is really about is that the SCREEN subtracts nothing, and the two figures below
    // are the engine's own. What it costs is a figure on the card, and the check that it is not
    // LOST is where the removal is argued – round35-shop.test.ts's «Worth now» arm, which asserts
    // the worth and the gain are both still there and that paid is their difference.
    expect(text, 'and the purchase price is gone from the car with it').not.toContain('paid $110,000')
    expect(text).toContain('$91,091') // worth now
    expect(text).toContain('-$18,909') // the loss, signed
    expect(text).toContain('(-17%)') // ...and as a whole percentage
    // ⚠⚠ THE SECOND ROUNDING IS THE DEFECT THIS CHECKS FOR (owner, 26.08 – whole numbers reach the
    // interface, rounded ONCE at the boundary). -17.19% is what the raw ratio is; if the component
    // did its own arithmetic it would be free to print -17.2 or -18, and this is the assertion that
    // catches it: the string on screen is the snapshot's own integer.
    expect(text).not.toContain('17.1')
    expect(text).not.toContain('17.2')
    expect(text).toContain(`(${row.changePct}%)`)
    wrapper.unmount()
  })

  it('⭐ a rung that is owned offers a SALE at the stored value and no second Buy', async () => {
    const wrapper = await mountShop(ownedSnapshot('shop-ui-sell'))
    // ⚠ RE-AIMED, ROUND 30 #5 – the car's own segment, opened the way a player opens it.
    // ⚠ RE-AIMED AT ROUND 35 #5 – `car-good`'s label is «The luxury four-by-four» since 03.09 (his
    // painting for the $110,000 rung is a four-by-four). Label only; the claim is the one it made.
    const car = await shelfRow(wrapper, 'The luxury four-by-four')
    expect(car, 'the owned car is on the shelf').toBeTruthy()
    const actions = wrapper.findAll('.shop-action').map((b) => b.text())
    // ⚠ RE-AIMED AT ROUND 35 #12 – the control is «Sell» and the figure lives in the field beside
    // it now (his frame, his ruling on the word). The claim – an owned rung offers a sale – stands.
    expect(actions.some((t) => t === 'Sell')).toBe(true)
    // One row per rung, and the owned one cannot be bought again – the engine refuses a second copy,
    // and the screen must not offer what the engine refuses.
    // ⚠⚠ RE-AIMED AT ROUND 35 #12, NEVER LOOSENED, AND THE CLAIM IS SHARPER THAN IT WAS. It used to
    // count the value inside the sell control's own label, which is a string that no longer exists;
    // what it was really asserting is that an OWNED rung offers no Buy. That is now said directly,
    // and the stored value is asserted where it actually lives – on the card, once.
    expect(actions, 'no second Buy on a rung they already own').not.toContain('Buy')
    expect(car.text(), 'the stored value is on the card').toContain('$91,091')
    expect(actions.filter((t) => t === 'Sell'), 'exactly one sale control').toHaveLength(1)
    wrapper.unmount()
  })

  it('⚠ a rung the family cannot afford keeps its price and loses only its control', async () => {
    const snap = toSnapshot(professional(walk('shop-ui-afford', 20)))
    const wrapper = await mountShop(snap)
    // ⚠ RE-AIMED, ROUND 30 #5 – found by pressing its tab, asserted exactly as before.
    const unreasonable = await shelfRow(wrapper, 'The unreasonable one')
    expect(unreasonable.text(), 'the price is still on screen').toContain('$300,000')
    expect(unreasonable.find('.shop-action').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('the purchase asks first, and the question fits a phone', () => {
  it('⭐ a Buy opens a confirm that names the thing and the price', async () => {
    const snap = toSnapshot(professional(walk('shop-ui-confirm', 20)))
    // Enough for the sensible car, so exactly one control is pressable and the test cannot press a
    // different row than it means to.
    snap.fundsCents = 70_000_00
    const wrapper = await mountShop(snap)
    // ⚠ RE-AIMED, ROUND 30 #5 – `shelfRow` leaves the row's own segment open, so the control it
    // returns is the one on screen and the click is the click a player makes.
    const buy = (await shelfRow(wrapper, 'The sensible estate')).find('.shop-action')
    await buy.trigger('click')
    const card = wrapper.find('.dialog-card')
    expect(card.exists(), 'the confirm is up').toBe(true)
    expect(card.text()).toContain('Buy The sensible estate for $60,000?')
    wrapper.unmount()
  })

  it('⭐⭐ ...and its dismiss control is inside a 375x667 phone (CLAUDE.md’s dialog rule)', async () => {
    setViewport(PHONE)
    const snap = toSnapshot(professional(walk('shop-ui-fit', 20)))
    snap.fundsCents = 70_000_00
    const wrapper = await mountShop(snap, true)
    // ⚠ RE-AIMED, ROUND 30 #5 – same row, reached through its segment.
    await (await shelfRow(wrapper, 'The sensible estate')).find('.shop-action').trigger('click')
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up').toBeTruthy()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (shop purchase)')
    wrapper.unmount()
  })
})
