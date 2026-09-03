// THE ADVERTISING PORTFOLIO, MOUNTED – round 29 part four P6/§8's own surface requirement: «⭐ So
// concurrency is not "N deals" – it is one deal per CATEGORY … which is instantly legible on
// screen: the portfolio is a shelf of named categories, filled or empty.»
//
// ⚠ WHY THIS IS A MOUNTED TEST. The engine derives `adPortfolio` correctly whether or not any
// screen prints it – an engine-side assertion cannot fail on a shelf the player never sees, which
// is exactly how the round-29p2 ladder shipped legible only in the inbox. CLAUDE.md: «Prefer a
// mounted test to a source pin.»
//
// THE FIXTURE IS A REAL DEAL: the letter is raised by `reviewAdOffer` on a week its own dice write,
// signed through `acceptOffer`, and the snapshot is `toSnapshot`'s – nothing here is a hand-built
// portfolio row.
//
// ⚠ MUTATIONS, EACH APPLIED ALONE AND WATCHED FAIL BEFORE THIS FILE WAS BELIEVED:
//   * `toSnapshot` deriving `adPortfolio: []` unconditionally → every arm below reddens on the
//     missing panel;
//   * the filled row printing the category label without the deal's brand → the filled arm's
//     row-scoped brand assertion;
//   * the closed fragrance row rendered as 'open' → the closed arm (it demands the gate sentence
//     INSIDE that row, and 'open' rows carry a cheque instead);
//   * the age gate dropped from the derivation → the junior arm (the panel must NOT mount at 14).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { openBillsTab } from './shelf'
import { createWorld, toSnapshot, KID_ID, type WorldState } from '../../src/engine/world'
import { acceptOffer, reviewAdOffer } from '../../src/engine/world/sponsors'
import { adCategoryOf, adWritesAt } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'

const AD = ECONOMY.advertising

/** A real adult career at the bottom band with a signed WATCHES deal, through the engine's own
 *  gate, dice and signature – the probe idiom of tests/round29p4-ad-portfolio.test.ts. */
function worldWithSignedAd(): WorldState {
  const seed = 'p4a-panel'
  let hit = -1
  for (let w = 300; w < 500; w++) {
    if (adWritesAt(seed, w, AD.offerChance, 'watches')) {
      hit = w
      break
    }
  }
  if (hit < 0) throw new Error('the watches dice never said yes near "p4a-panel"')
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = hit
  world.results.push({ playerId: KID_ID, week: hit, points: 100, tier: 'w100' })
  world.kidRankWta = 150
  reviewAdOffer(world)
  const letter = world.offers.find(
    (o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === 'watches' && o.state === 'open',
  )
  if (!letter) throw new Error('the gate did not raise the watches letter on its own true week')
  acceptOffer(world, letter.id)
  return world
}

async function mountBills(snap: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  // ⚠ RE-AIMED, ROUND 30 #5 – Bills has two segments now (`Her Kit` / `Advs Portfolio`, his own
  // spellings) and the portfolio is behind the second. Every assertion in this file is the one it
  // always made; what changed is that the page needs one more press to reach the card, exactly as a
  // player's does. tests/component/shelf.ts carries the argument.
  await openBillsTab(wrapper, 'Advs Portfolio')
  return wrapper
}

describe('the portfolio shelf on the Bills page – categories filled/empty, the live deal named', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ the filled slot names the live deal, in its own row, with its own money and term', async () => {
    const world = worldWithSignedAd()
    const deal = world.offers.find((o) => o.kind === 'ad' && o.state === 'signed')!
    const t = deal.terms as AdOfferTerms
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text()).toContain('The advertising portfolio')

    // THE ROW ITSELF, not the page's text – the bills-quota discipline: a brand printed anywhere
    // cannot tell the filled slot from a stray mention. The watches row must carry the brand, the
    // per-year fee and the term, and no other row may claim them.
    const rows = wrapper.findAll('.ad-slot')
    expect(rows.length).toBeGreaterThanOrEqual(5)
    const watches = rows.find((r) => r.text().includes('Watches'))!
    expect(watches, 'a Watches row exists').toBeTruthy()
    expect(watches.classes()).toContain('is-filled')
    expect(watches.text()).toContain(t.brand)
    expect(watches.text()).toContain(`${formatCents(t.cashCents)} a year`)
    expect(watches.text()).toContain((t.termYears ?? 1) === 1 ? 'one year' : `${t.termYears} years`)

    // ...an OPEN slot says so and quotes the band's own cheque – the empty half of «filled or
    // empty», priced by the engine, never the screen.
    const drinks = rows.find((r) => r.text().includes('Drinks'))!
    expect(drinks.classes()).toContain('is-open')
    expect(drinks.text()).toContain('Open – nobody signed')
    // ⚠ index 1 since round 34: a band was prepended at ≤400, and a career at #150 stands at ≤200
    expect(drinks.text()).toContain(formatCents(AD.categories.drinks.feeCentsByBand[1]!))

    // ...and a CLOSED slot names its gate instead of a cheque: fragrance is the icon-band category
    // and this career stands at #150.
    const fragrance = rows.find((r) => r.text().includes('Fragrance'))!
    expect(fragrance.classes()).toContain('is-closed')
    expect(fragrance.text()).toContain('Opens inside WTA #10')
    expect(fragrance.text()).not.toContain('a year')

    // ...and the capstone row shows the tenure ladder's own count, so the end of the shelf is
    // visible from the first professional rung.
    const capstone = rows.find((r) => r.text().includes('The capstone'))!
    expect(capstone.classes()).toContain('is-closed')
    expect(capstone.text()).toContain(`0 of ${AD.capstone.seasonsInTop10} top-10 seasons`)
    wrapper.unmount()
  })

  it('⚠ no shelf for a junior – the panel is absent at fourteen, not empty', async () => {
    const world = createWorld('p4a-panel-junior', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.find('.ad-slot').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('The advertising portfolio')
    wrapper.unmount()
  })
})
