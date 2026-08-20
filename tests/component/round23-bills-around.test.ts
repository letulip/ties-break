// ROUND 23 ITEM 17 – "Around" IN FRONT OF THE PRICES ON THE BILLS CARDS.
//
// The owner, 19.08: «Перед ценами на карточках Bills написать "Around", тогда точно не будет
// вопросов "почему ракетка стоит 920, а мы заплатили 1070?"»
//
// ⚠ HIS TWO NUMBERS RECONCILE, and the first test below re-derives them rather than quoting them:
// the card prices a rung at the MID of the family's band times the rung factor ($920 for a middle
// family's `pro` frame), while every replacement is a fresh draw from that same band times the same
// factor ($1,070 is a $267.50 draw out of $180-280). Both are the engine's; neither is wrong; the
// card simply never said which one it was.
//
// ⚠ AND THE WORD GOES ON THE KIT PRICES AND NOWHERE ELSE ON THIS TAB. The second test is the half
// that matters more, because it is the one the owner warned about: a qualifier on a figure that IS
// exact would be a new lie in place of an old confusion. The per-row argument is at `kitLines` in
// MoneyScreen.vue; this file holds it to it.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, acceptOffer, setKitGrade, type WorldState } from '../../src/engine/world'
import { raiseKitOffers, sponsorWindowOpensAt } from '../../src/engine/offers'
import { kitLinePriceCents } from '../../src/engine/equipment'
import { gearHitsUpTo } from '../../src/engine/economy'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type KitOfferTerms, type Snapshot } from '../../src/shared/protocol'

/** ⚠ THE TAB HAS TO BE PRESSED AND AWAITED – the Bills blocks sit behind a `v-if` on the screen's
 *  own tab state, so nothing about kit is in the document until the segment is clicked. Same idiom
 *  as tests/component/round21-bills.test.ts. */
async function mountBills(snap: Snapshot) {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  expect(wrapper.text(), 'the Bills tab is really the one showing').toContain('Her kit')
  return wrapper
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

/** The owner's own family: a middle background, deep enough in that the kit has real age on it. */
function plainCareer(): WorldState {
  const world = createWorld('round23-around', { ...DEFAULT_PROFILE, background: 'middle' })
  world.week = 160
  return world
}

/** ...and one under a signed deal, so the COVERED arm of the price span is a real contract rather
 *  than a hand-set flag. Recipe from tests/component/round21-bills.test.ts. */
function sponsoredCareer(): WorldState {
  const standing = { nationalRank: 1, itfRank: 20, itfRanked: true, wtaRank: 999, wtaRanked: false }
  const week = sponsorWindowOpensAt(WEEKS_PER_YEAR - 1)
  for (let attempt = 0; attempt < 30; attempt++) {
    const world = createWorld(`round23-around-deal-${attempt}`, { ...DEFAULT_PROFILE, background: 'middle' })
    world.week = week
    const raised = raiseKitOffers({ offers: world.offers, seed: world.seed, week, standing })
    const letter = raised.find((o) => (o.terms as KitOfferTerms).tier === 'national')
    if (!letter) continue
    acceptOffer(world, letter.id)
    world.week = world.offers[0].fromWeek!
    return world
  }
  throw new Error('no seed near "round23-around-deal" was written to by National in 30 tries')
}

describe('Round 23 #17 – the Bills kit prices say they are estimates', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ the confusion is real: the card quotes $920 and a replacement can bill $1,070', () => {
    // The card's number, from the engine's own pricer – the mid of the band times the rung factor.
    const quoted = kitLinePriceCents('middle', 'frame', 'pro')
    expect(quoted, "the owner's 920, re-derived rather than quoted").toBe(920_00)

    // ...and what the till actually bills on a replacement: a draw from the SAME band, which
    // world.ts then multiplies by the same rung factor. Every hit is a different number, and the
    // spread straddles the quote in both directions – which is the whole complaint.
    const factor = 4 // ECONOMY.equipment.grades.pro.priceFactor, the multiplier world.ts applies
    const bills = gearHitsUpTo('round23-around', 'rackets', 'middle', 20 * WEEKS_PER_YEAR).map(
      (h) => h.amountCents * factor,
    )
    expect(bills.length, 'twenty seasons produce a run of replacements').toBeGreaterThan(10)
    expect(Math.min(...bills), 'some replacements come in under the quote').toBeLessThan(quoted)
    expect(Math.max(...bills), 'and some come in over it – the owner saw $1,070').toBeGreaterThan(quoted)
    // The band's own bounds, so nothing here can drift away from ECONOMY.gear.
    expect(Math.min(...bills)).toBeGreaterThanOrEqual(180_00 * factor)
    expect(Math.max(...bills)).toBeLessThanOrEqual(280_00 * factor)
  })

  it('every rung price on the Bills card carries the qualifier', async () => {
    const wrapper = await mountBills(toSnapshot(plainCareer()))
    const prices = wrapper.findAll('.kit-rung-price')
    // Three lines, four rungs each.
    expect(prices.length, 'the whole kit ladder is on screen').toBe(12)
    for (const p of prices) {
      expect(clean(p.text()), 'a rung price without the qualifier').toMatch(/^Around \$/)
    }
    wrapper.unmount()
  })

  it('⚠ the covered arm carries it too – "free" is a quote as well', async () => {
    const wrapper = await mountBills(toSnapshot(sponsoredCareer()))
    const covered = wrapper.findAll('.kit-rung-price.is-covered')
    expect(covered.length, 'a signed national deal covers at least one line').toBeGreaterThan(0)
    for (const p of covered) {
      expect(clean(p.text()), 'a covered rung price without the qualifier').toMatch(/^Around \$/)
    }
    // ...and it never says "Around free": the word leads the span and the struck sticker follows it.
    expect(wrapper.text()).not.toContain('Around free')
    wrapper.unmount()
  })

  it('⚠⚠ and it goes on NOTHING ELSE on this tab – the exact figures stay exact', async () => {
    // A career with money already committed on every other Bills row: a signed deal with allowance
    // spent against it, and an academy that has really paid for travel.
    const world = sponsoredCareer()
    setKitGrade(world, 'frame', 'pro') // spends real allowance, so the deal row carries a real total
    world.academy = { level: 0.5, sinceWeek: 52, seasonIndex: 1, coveredCents: 1_234_00 }
    const wrapper = await mountBills(toSnapshot(world))

    // Every occurrence of the word, and every one of them must be a kit rung price.
    const inKit = wrapper.findAll('.kit-rung-approx').length
    const onScreen = (clean(wrapper.text()).match(/Around/g) ?? []).length
    expect(inKit, 'the qualifier is on the kit ladder').toBeGreaterThan(0)
    expect(onScreen, 'and it appears nowhere the kit ladder is not').toBe(inKit)

    // The four rows it deliberately stays off, each read as the screen prints it. Committed money
    // and a printed range: see the audit at `kitLines` in MoneyScreen.vue for why each is exact.
    const rows = wrapper.findAll('.money-panel-note').map((n) => clean(n.text()))
    const started = rows.find((t) => t.startsWith('Started this career with'))
    expect(started, 'the starting budget is on the Budget card').toBeTruthy()
    expect(started, 'a career start is a historical fact, not a quote').toMatch(/^Started this career with \$[\d,]+(\.\d\d)?\.$/)

    const physio = clean(wrapper.get('.physio-cost').text())
    expect(physio, 'the retainer is already printed as the corridor\'s true bounds').toMatch(/^\$\d+-\d+\/wk$/)

    const dealRow = wrapper.findAll('.money-row').map((n) => clean(n.text()))
    const allowance = dealRow.find((t) => t.includes('Allowance left this season'))
    expect(allowance, 'the sponsor allowance row is on screen').toBeTruthy()
    expect(allowance, 'a contract pot and a real spend – both exact').not.toContain('Around')

    const academyRow = dealRow.find((t) => t.includes('Travel they have paid'))
    expect(academyRow, 'the academy row is on screen').toBeTruthy()
    expect(academyRow, 'money the academy has already paid').toContain('$1,234')
    expect(academyRow).not.toContain('Around')

    wrapper.unmount()
  })
})
