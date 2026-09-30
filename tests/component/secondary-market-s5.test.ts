// THE SECONDARY MARKET, STEP S5 – THE SCREENS, MOUNTED: the popup a thing's Sell opens, the listed row's badge and Withdraw, the buyer's letter and
// the notice that an ad has gone quiet. (The engine's half – the quote, the listing, the stale letter and the parity of what «Sell now» pays with what
// the ledger writes – is tests/secondary-market-s5.test.ts.)
//
// ⚠ THE HOUSE RULES THIS FILE IS WRITTEN UNDER: mount the real SFC against a snapshot the real engine built (`toSnapshot`), and assert the RENDERED
// surface – never a source pin for a rendering claim. Two arms FEED the screen a number the engine did not compute (a fabricated quote, a fabricated
// stale week) and watch it come out the other side unchanged: that is what «the screen prints, never derives» means as a test, and it is the parity law
// (docs/specs/engine-ui-parity-2026-09.md) applied to this wave. The store's commands are SPIED, so the ARGUMENT a press sends is what is asserted.
//
// ⚠ MUTATION-VERIFIED (30.09, S5) – each arm applied ALONE, watched red and restored (byte-exact, by hash):
//   * the popup card grown past the phone (`.sale-dialog { max-height: none; overflow: visible; min-height: 1400px }`) -> ONE: the 375x667 dismiss arm
//   * template math on the quote (`weeksLo + 1`)                                            -> ONE: the quote-moves arm
//   * the confirm's amount wired back to `row.valueCents`                                   -> ONE: the parity arm (the fire price)
//   * the confirm's tail taken from `row.changeCents` instead of `fire.changeCents`         -> ONE: the same parity arm (the tail)
//   * the academy warning never drawn / drawn on every row                                   -> ONE each: the one-lot arm (the academy's side, and the car's side)
//   * the thin-market line never drawn / drawn on every row                                  -> ONE each: the thin arm (the elite car's side, and the first house's side)
//   * the stale wording one week late (`>` for `>=`)                                         -> ONE: the badge arm, at the engine's stale week
//   * Withdraw calling `listAsset` instead of `unlistAsset`                                  -> ONE: the same badge arm (the spy)
//   * the buyer's paper without its Sign / Refuse controls                                   -> ONE: the letter arm
//   * the notice rendered as a proposal                                                      -> ONE: the notice arm
//   * (S6, 30.09) the popup ignoring `quote.atHorizon` (always the range)                    -> ONE: the horizon arm
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { ECONOMY } from '../../src/engine/economy'
import { createWorld, listAsset, toSnapshot, type WorldState } from '../../src/engine/world'
import { raiseSaleLetter, raiseSaleStaleLetter } from '../../src/engine/offers'
import { shopCatalogue, shopItem } from '../../src/engine/world/assets'
import { revalueAssets } from '../../src/engine/world/shop'
import { formatCents } from '../../src/shared/money'
import { weekLabel } from '../../src/shared/dates'
import type { OwnedAsset, ShopRowView, Snapshot } from '../../src/shared/protocol'
// ⚠ THE APP'S OWN STYLESHEET – without it `.dialog-card`'s height cap is not in the cascade and the fit measurement is vacuous.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import { shelfRow } from './shelf'
import { mountInbox, withPost } from './inbox'
import { installMemoryStorage } from './setup'

// The inbox annotates letters with two per-device facts (read / binned), both in localStorage; this
// runner has none. ⚠ THE HELPER, NOT A HAND SHIM (caught 30.09 by principles-t514's RULE A ratchet
// at the wave boundary: a NEW file may not spell the fourteen lines itself – T5.10's helper is the
// one home). `backing` keeps the name the arms below already read.
const { backing } = installMemoryStorage()

const CAR = 'car-sensible'
const HOUSE = 'house-first'
const DEPOSIT = 'deposit'
const ACADEMY = shopCatalogue()
  .filter((rung) => rung.family === 'academy')
  .map((rung) => rung.id)
/** the dearest car on the shelf – the thin market */
const ELITE = shopCatalogue()
  .filter((rung) => rung.family === 'car')
  .sort((a, b) => b.entryCents - a.entryCents)[0]!.id

/** ⚠ BOUGHT THIS WEEK: a row bought at week 0 and revalued at week 150 has depreciated for three years, and a depreciated elite car is no longer thin –
 *  the premise «the engine calls the elite car thin» has to hold on the fixture, or the thin-line arm proves nothing. */
function ownedRow(id: string, week: number): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: week, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week, cents: item.entryCents }] }
}

/** A hand-built career at `week` that owns exactly these rungs, every one DELIVERED and revalued – and rich enough that nothing is «cannot afford». */
function worldOwning(seed: string, ids: readonly string[], week = 100): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.fundsCents = 500_000_000_00
  world.assets = ids.map((id) => ownedRow(id, week))
  revalueAssets(world)
  return world
}

const rowOf = (snapshot: Snapshot, id: string): ShopRowView => snapshot.shop!.rows.find((r) => r.id === id)!

async function mountShop(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

/** Press a thing's Sell and return what the popup says. */
async function pressSell(wrapper: Awaited<ReturnType<typeof mountShop>>, id: string): Promise<void> {
  const row = await shelfRow(wrapper, shopItem(id)!.label)
  const sell = row.findAll('button.shop-action').find((b) => b.text() === 'Sell')
  expect(sell, `${id}: the Sell control`).toBeTruthy()
  await sell!.trigger('click')
}

const popup = (wrapper: Awaited<ReturnType<typeof mountShop>>) => wrapper.find('.sale-dialog')
const popupButtons = (wrapper: Awaited<ReturnType<typeof mountShop>>): string[] => popup(wrapper).findAll('.dialog-actions button').map((b) => b.text())

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
})

// ⚠ A FAILED ARM MUST NOT LEAK ITS ATTACHED TREE INTO THE NEXT ONE. The measured arms mount `attachTo: document.body`, and an assertion that throws
// skips the `unmount()` after it; the left-over overlay then sits in the document and the next arm's `document.querySelector('.dialog-overlay …')` finds
// IT instead of its own – found by the first mutation run, where a too-tall popup made an unrelated letter arm red as well.
afterEach(() => {
  document.body.innerHTML = ''
})

describe('the popup a thing\'s Sell opens', () => {
  it('⚠ the dismiss control stays inside a 375x667 phone – on the LONGEST popup the shelf can produce, the whole academy', async () => {
    setViewport(PHONE)
    const world = worldOwning('s5-fit', ACADEMY, 200)
    const wrapper = await mountShop(toSnapshot(world), true)
    await pressSell(wrapper, ACADEMY[0]!)
    expect(popup(wrapper).exists(), 'the popup opened').toBe(true)
    const quote = rowOf(toSnapshot(world), ACADEMY[0]!).quote!
    // the worst case really is the worst case: three lines, the thin line if the engine says so, and the academy's own warning
    expect(popup(wrapper).findAll('.sale-dialog-line').length, 'three lines and the academy warning at least').toBeGreaterThanOrEqual(4)
    expect(quote.thinMarket, 'and the whole academy is a thin market').toBe(true)
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    assertDismissReachable(card, dismiss, PHONE, 'the secondary market popup (S5)')
    wrapper.unmount()
  })

  it('⭐ the quote on screen IS the snapshot\'s quote: fed other numbers, the popup prints those – and follows them when they move', async () => {
    const snapshot = toSnapshot(worldOwning('s5-quote', [CAR]))
    const fed = rowOf(snapshot, CAR)
    fed.quote = { ...fed.quote!, weeksLo: 7, weeksHi: 41, corridorLoCents: 1_234_00, corridorHiCents: 5_678_00, fireCents: 999_00, thinMarket: false }
    const wrapper = await mountShop(snapshot)
    await pressSell(wrapper, CAR)
    const text = popup(wrapper).text()
    expect(text, 'the wait, from the quote').toContain('It may take 7 to 41 weeks to sell.')
    expect(text, 'the corridor, from the quote').toContain(`Offers may range from ${formatCents(1_234_00)} to ${formatCents(5_678_00)}.`)
    expect(text, 'the fire price, from the quote').toContain(`Selling now pays ${formatCents(999_00)}, at once.`)
    // the engine moves the numbers under an open popup (a new tick's snapshot): the popup follows, it holds no copy
    const next = toSnapshot(worldOwning('s5-quote', [CAR]))
    const moved = rowOf(next, CAR)
    moved.quote = { ...moved.quote!, weeksLo: 9, weeksHi: 52, corridorLoCents: 2_222_00, corridorHiCents: 8_888_00, fireCents: 1_111_00, thinMarket: false }
    useGameStore().snapshot = next
    await nextTick()
    const after = popup(wrapper).text()
    expect(after).toContain('It may take 9 to 52 weeks to sell.')
    expect(after).toContain(`Offers may range from ${formatCents(2_222_00)} to ${formatCents(8_888_00)}.`)
    expect(after).toContain(`Selling now pays ${formatCents(1_111_00)}, at once.`)
    wrapper.unmount()
  })

  it('⭐ (S6) a quote at the horizon prints «or more» – the popup follows the ENGINE\'S flag, never a range that ends in the engine\'s cap', async () => {
    const BOAT = 'boat-launch'
    const snapshot = toSnapshot(worldOwning('s6-horizon', [BOAT]))
    const quote = rowOf(snapshot, BOAT).quote!
    expect(quote.atHorizon, 'the premise: the engine says a launch may never sell').toBe(true)
    const wrapper = await mountShop(snapshot)
    await pressSell(wrapper, BOAT)
    const text = popup(wrapper).text()
    expect(text, 'the line that has no upper end, off the engine\'s own low end').toContain(`It may take ${quote.weeksLo} weeks or more to sell – there may be no buyer at all.`)
    expect(text, 'and not a range that ends where the engine stopped counting').not.toContain(`It may take ${quote.weeksLo} to ${quote.weeksHi} weeks to sell.`)
    // the same numbers with the flag off: the ordinary sentence – the screen reads the flag, and not the size of `weeksHi`
    const next = toSnapshot(worldOwning('s6-horizon', [BOAT]))
    const fed = rowOf(next, BOAT)
    fed.quote = { ...fed.quote!, atHorizon: false }
    useGameStore().snapshot = next
    await nextTick()
    const after = popup(wrapper).text()
    expect(after).toContain(`It may take ${quote.weeksLo} to ${quote.weeksHi} weeks to sell.`)
    expect(after).not.toContain('weeks or more')
    wrapper.unmount()
  })

  it('⭐ PARITY: «Sell now» asks the ordinary question about the QUOTE\'S fire price and the ENGINE\'S tail – never the card\'s value – and Sell it sends the id alone', async () => {
    const snapshot = toSnapshot(worldOwning('s5-fire', [CAR]))
    const fed = rowOf(snapshot, CAR)
    // a fire price and a tail that are NOT the card's value and NOT a subtraction the screen could do from the row's own figures
    fed.quote = { ...fed.quote!, fireCents: 4_321_00 }
    fed.fire = { label: fed.fire!.label, changeCents: -1_500_00 }
    expect(fed.valueCents, 'the premise: the fire price is not the card').not.toBe(4_321_00)
    const wrapper = await mountShop(snapshot)
    const store = useGameStore()
    const sell = vi.spyOn(store, 'sellAsset').mockResolvedValue(undefined as never)
    await pressSell(wrapper, CAR)
    const sellNow = popup(wrapper).findAll('.dialog-actions button').find((b) => b.text() === 'Sell now')
    expect(sellNow, 'the Sell now door').toBeTruthy()
    await sellNow!.trigger('click')
    expect(popup(wrapper).exists(), 'the popup closed and the ordinary question opened').toBe(false)
    const question = wrapper.find('.dialog-message').text()
    expect(question, 'the amount is the fire price and the tail is the engine\'s').toBe(
      `Sell ${fed.fire.label} for ${formatCents(4_321_00)}? That is ${formatCents(1_500_00)} less than it cost.`,
    )
    expect(question, 'and it never prints the card\'s value').not.toContain(formatCents(fed.valueCents!))
    expect(sell, 'nothing is sold before the question is answered').not.toHaveBeenCalled()
    const confirm = wrapper.findAll('.dialog-actions button').find((b) => b.text() === 'Sell it')
    await confirm!.trigger('click')
    expect(sell, 'the id alone – the engine prices the sale').toHaveBeenCalledWith(CAR, undefined)
    wrapper.unmount()
  })

  it('the academy\'s popup carries the one-lot warning and a car\'s does not', async () => {
    const world = worldOwning('s5-warning', [CAR, ...ACADEMY], 200)
    const wrapper = await mountShop(toSnapshot(world))
    await pressSell(wrapper, ACADEMY[0]!)
    expect(popup(wrapper).text(), 'the academy sells as one lot').toContain('The academy sells as one lot – every stage goes together, not the courts alone.')
    await popup(wrapper).findAll('.dialog-actions button').find((b) => b.text() === 'Keep it')!.trigger('click')
    expect(popup(wrapper).exists(), 'Keep it closes it').toBe(false)
    await pressSell(wrapper, CAR)
    expect(popup(wrapper).exists()).toBe(true)
    expect(popup(wrapper).text(), 'a car is not an academy').not.toContain('sells as one lot')
    wrapper.unmount()
  })

  it('the thin-market line is on the elite car and not on the first house – the engine\'s own predicate, read', async () => {
    const snapshot = toSnapshot(worldOwning('s5-thin', [ELITE, HOUSE], 150))
    expect(rowOf(snapshot, ELITE).quote!.thinMarket, 'the premise: the engine calls the elite car thin').toBe(true)
    expect(rowOf(snapshot, HOUSE).quote!.thinMarket, 'and the first house not').toBe(false)
    const wrapper = await mountShop(snapshot)
    await pressSell(wrapper, ELITE)
    expect(popup(wrapper).text()).toContain('Few buyers can pay this much – it may not sell at all.')
    await popup(wrapper).findAll('.dialog-actions button').find((b) => b.text() === 'Keep it')!.trigger('click')
    await pressSell(wrapper, HOUSE)
    expect(popup(wrapper).exists()).toBe(true)
    expect(popup(wrapper).text(), 'the house is not a thin market').not.toContain('may not sell at all')
    wrapper.unmount()
  })

  it('List puts the ad up by id alone; an already-listed thing is offered Sell now and Keep it, and no List', async () => {
    const snapshot = toSnapshot(worldOwning('s5-list', [CAR]))
    const wrapper = await mountShop(snapshot)
    const list = vi.spyOn(useGameStore(), 'listAsset').mockResolvedValue(undefined as never)
    await pressSell(wrapper, CAR)
    expect(popupButtons(wrapper), 'three doors on an unlisted thing').toEqual(['Keep it', 'Sell now', 'List'])
    await popup(wrapper).findAll('.dialog-actions button').find((b) => b.text() === 'List')!.trigger('click')
    expect(list).toHaveBeenCalledWith(CAR)
    expect(popup(wrapper).exists(), 'and the popup closes').toBe(false)
    wrapper.unmount()

    const world = worldOwning('s5-list-listed', [CAR])
    listAsset(world, CAR)
    const listed = await mountShop(toSnapshot(world))
    await pressSell(listed, CAR)
    expect(popupButtons(listed), 'the exit is never locked, and List would be refused').toEqual(['Keep it', 'Sell now'])
    listed.unmount()
  })

  it('parked cash is untouched: the deposit\'s Sell goes straight to the ordinary question, no popup', async () => {
    const world = worldOwning('s5-cash', [DEPOSIT])
    const wrapper = await mountShop(toSnapshot(world))
    await pressSell(wrapper, DEPOSIT)
    expect(popup(wrapper).exists(), 'no market popup for money').toBe(false)
    expect(wrapper.find('.dialog-message').text()).toMatch(/^Sell .* for \$/)
    wrapper.unmount()
  })
})

describe('the listed row: its badge, its stale wording and its Withdraw', () => {
  it('the badge counts the weeks from the engine\'s `sinceWeek`, flips to its quiet wording AT the engine\'s `staleAtWeek` – not a week before – and Withdraw sends the id alone', async () => {
    const world = worldOwning('s5-badge', [CAR], 100)
    listAsset(world, CAR)
    const week = 100
    const feed = (sinceWeek: number, staleAtWeek: number): Snapshot => {
      const snapshot = toSnapshot(world)
      rowOf(snapshot, CAR).listing = { sinceWeek, staleAtWeek }
      return snapshot
    }
    const wrapper = await mountShop(feed(week - 3, week + 2))
    const unlist = vi.spyOn(useGameStore(), 'unlistAsset').mockResolvedValue(undefined as never)
    const rowText = async () => (await shelfRow(wrapper, shopItem(CAR)!.label)).text()
    expect(await rowText(), 'three weeks up, not yet stale').toContain('On the market · 3 weeks')
    // one week before the engine's stale week: still the fresh wording
    useGameStore().snapshot = feed(week - 3, week + 1)
    await nextTick()
    expect(await rowText()).toContain('On the market · 3 weeks')
    expect(await rowText()).not.toContain('gone quiet')
    // AT the stale week: the quiet wording
    useGameStore().snapshot = feed(week - 3, week)
    await nextTick()
    expect(await rowText(), 'the flip is exactly the engine\'s week').toContain('Interest has gone quiet · 3 weeks on the market')
    expect(await rowText()).not.toContain('On the market ·')
    // one week is one week, not «1 weeks»
    useGameStore().snapshot = feed(week - 1, week + 5)
    await nextTick()
    expect(await rowText()).toContain('On the market · 1 week')
    expect(await rowText()).not.toContain('1 weeks')
    // Withdraw: one tap, the id alone, no question
    const row = await shelfRow(wrapper, shopItem(CAR)!.label)
    const withdraw = row.findAll('button.shop-action').find((b) => b.text() === 'Withdraw')
    expect(withdraw, 'the Withdraw control').toBeTruthy()
    await withdraw!.trigger('click')
    expect(unlist).toHaveBeenCalledWith(CAR)
    expect(wrapper.find('.dialog-card').exists(), 'no confirmation – taking an ad down is free').toBe(false)
    wrapper.unmount()
  })

  it('an unlisted thing shows neither badge nor Withdraw', async () => {
    const wrapper = await mountShop(toSnapshot(worldOwning('s5-no-badge', [CAR])))
    const row = await shelfRow(wrapper, shopItem(CAR)!.label)
    expect(row.text()).not.toContain('On the market')
    expect(row.findAll('button.shop-action').map((b) => b.text())).not.toContain('Withdraw')
    wrapper.unmount()
  })
})

describe('the buyer\'s letter, through the inbox', () => {
  /** A career that holds a listed car, and the buyer's letter for it as the engine writes it. */
  function withBuyer(priceCents: number) {
    const world = worldOwning('s5-letter', [CAR], 100)
    listAsset(world, CAR)
    const letter = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents })
    return { world, letter, snapshot: withPost(toSnapshot(world), [letter], world.week) }
  }

  it('the list row and the paper say who wrote, what about, at what price and until when – and Sign / Refuse reach the store with the id', async () => {
    const { letter, snapshot } = withBuyer(61_234_00)
    const label = shopItem(CAR)!.label
    const price = formatCents(61_234_00)
    const wrapper = await mountInbox(snapshot, { attachTo: document.body })
    const rows = wrapper.findAll('.inbox-open')
    expect(rows, 'one letter in the post').toHaveLength(1)
    expect(rows[0]!.text(), 'the list row: the sender').toContain('A buyer')
    expect(rows[0]!.text(), 'and the subject').toContain(`${label} – an offer of ${price}`)
    await rows[0]!.trigger('click')
    await nextTick()
    const paper = wrapper.find('.offer-letter').text()
    expect(paper, 'the price printed on the paper').toContain(`A buyer offers ${price} for ${label}.`)
    expect(paper, 'the week it stands to').toContain(`The offer stands until ${weekLabel(letter.deadlineWeek)}.`)
    expect(paper, 'and what refusing does').toContain('Refusing it leaves the listing up.')
    const store = useGameStore()
    const sign = vi.spyOn(store, 'signOffer').mockResolvedValue(undefined as never)
    const refuse = vi.spyOn(store, 'refuseOffer').mockResolvedValue(undefined as never)
    // Sign: the question first, then the store – with the id
    await wrapper.find('button.offer-sign').trigger('click')
    await nextTick()
    expect(document.querySelector('.dialog-overlay .dialog-message')!.textContent, 'the sale question').toBe(
      `Sell ${label} for ${price}? The sale settles this week and cannot be undone.`,
    )
    expect(sign, 'nothing is signed before the question is answered').not.toHaveBeenCalled()
    const confirm = [...document.querySelectorAll('.dialog-overlay .dialog-actions button')].find((b) => b.textContent === 'Sign it') as HTMLButtonElement
    confirm.click()
    await flushPromises()
    expect(sign).toHaveBeenCalledWith(letter.id)
    // Refuse: one press, straight to the store
    await wrapper.find('button.offer-refuse').trigger('click')
    expect(refuse).toHaveBeenCalledWith(letter.id)
    wrapper.unmount()
  })

  it('the notice that an ad has gone quiet renders its words, the market\'s memory from the economy table – and no controls at all', async () => {
    const world = worldOwning('s5-notice', [CAR], 100)
    listAsset(world, CAR)
    const notice = raiseSaleStaleLetter(world.offers, world.week, 100, { itemId: CAR, priceCents: 0 })
    const label = shopItem(CAR)!.label
    const wrapper = await mountInbox(withPost(toSnapshot(world), [notice], world.week), { attachTo: document.body })
    const rows = wrapper.findAll('.inbox-open')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text(), 'the sender is the market').toContain('The market')
    expect(rows[0]!.text(), 'the subject restates the opening').toContain(`Interest in ${label} has gone quiet`)
    await rows[0]!.trigger('click')
    await nextTick()
    const paper = wrapper.find('.offer-letter').text()
    expect(paper).toContain(`Interest in ${label} has gone quiet.`)
    expect(paper, 'the two honest moves').toContain('You can wait it out, or withdraw it and try again later')
    expect(paper, 'and the memory window, from ECONOMY').toContain(`buyers remember an ad for about ${ECONOMY.shop.secondary.memoryWeeks} weeks`)
    expect(wrapper.find('button.offer-sign').exists(), 'nothing to sign').toBe(false)
    expect(wrapper.find('button.offer-refuse').exists(), 'nothing to refuse').toBe(false)
    wrapper.unmount()
  })
})
