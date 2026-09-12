// ROUND 41 #14 – «На Bills на все выбранные позиции добавить в скобках сколько недель осталось».
//
// Recon's derivability census (docs/rounds/round-41.md, item 14, "recon verdicts folded"): the
// bracket is buildable ONLY where a real term exists – the kit deal card and a filled ad row – and
// is refused on the physio retainer (a weekly toggle, no term), the academy scholarship (reviewed
// at the season boundary, no end week) and the lifetime ad row (`for life`, never lapses BY
// CONSTRUCTION, round-39.md:296-297). Those three are honest omissions, not gaps, so this file's
// only negative arm is the lifetime row – the other two have no term to assert the absence of.
//
// ⚠ WHY THIS IS A MOUNTED TEST. `MoneyScreen.vue`'s `weeksLeftBracket` is a template-facing function
// with no engine counterpart to pin – the claim under test is entirely "what the screen does with a
// real `untilWeek`", exactly the class CLAUDE.md names: "Prefer a mounted test to a source pin."
//
// THE FIXTURES ARE REAL DEALS, signed through the engine's own pure "what would this cell offer"
// functions (`kitTermsFor`/`adTermsForCategory`/`adLifetimeTerms`) pushed and signed directly
// (`raiseAdOffer` + `signOffer` – offers.ts's own documented use, and the same idiom
// tests/round29p4-ad-portfolio.test.ts's `signKit` already exercises), bypassing only the RANDOM
// raising step – which category or house writes is not what this item is about. `untilWeek` is
// always READ BACK off the signed offer rather than hand-derived, so a fixture can never disagree
// with the engine that built it.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { openBillsTab } from './shelf'
import { createWorld, type WorldState, toSnapshot } from '../../src/engine/world'
import { adLifetimeTerms, adTermsForCategory, kitTermsFor, raiseAdOffer, signOffer } from '../../src/engine/offers'
import { sponsorStandingOf } from '../../src/engine/world/sponsors'
import { weekLabel } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Offer, type Snapshot } from '../../src/shared/protocol'

/** A signed icon-rung kit deal (Aurelia, four seasons) – the exact rung the owner's 12.09 report
 *  measured (item 25, the same file). `standing` does not gate the icon branch of `kitTermsFor` (it
 *  only reads `ECONOMY.sponsorship.icon`), so a fresh, unranked world signs it exactly as a real
 *  WTA #4 would. */
function signIconKit(world: WorldState): Offer {
  const terms = kitTermsFor(sponsorStandingOf(world), 'icon')
  if (!terms) throw new Error('no icon kit terms')
  const offer: Offer = {
    id: `r41-14-kit-${world.week}`,
    kind: 'kit',
    week: world.week,
    deadlineWeek: world.week + 4,
    state: 'open',
    terms,
  }
  world.offers.push(offer)
  const signed = signOffer(world.offers, offer.id, world.week)
  if (!signed) throw new Error('the icon kit letter did not sign')
  return signed
}

/** A signed one-year `watches` deal at band 2 (WTA <= 100) – any ordinary trade category with a
 *  real, finite term. `adTermsForCategory` is offers.ts's own pure per-cell lookup. */
function signWatchesAd(world: WorldState): Offer {
  const terms = adTermsForCategory('watches', 2, 1)
  if (!terms) throw new Error('no watches terms at band 2')
  const offer = raiseAdOffer(world.offers, world.week, terms, world.week + 4)
  const signed = signOffer(world.offers, offer.id, world.week)
  if (!signed) throw new Error('the watches letter did not sign')
  return signed
}

/** A signed lifetime letter – never has an `untilWeek` at all (round 39 #3, `signOffer`'s own
 *  branch), which is exactly why it is the negative arm for this item's bracket. */
function signLifetimeAd(world: WorldState, brand: string): Offer {
  const terms = adLifetimeTerms(brand)
  const offer = raiseAdOffer(world.offers, world.week, terms, world.week + 4)
  const signed = signOffer(world.offers, offer.id, world.week)
  if (!signed) throw new Error('the lifetime letter did not sign')
  return signed
}

async function mountBills(snap: Snapshot, portfolioTab = false) {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  if (portfolioTab) await openBillsTab(wrapper, 'Advs Portfolio')
  return wrapper
}

describe('round 41 #14 – "(N weeks left)" on the Bills page\'s real terms', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // Ten full seasons in – comfortably adult (nothing here goes through the advertising age gate
  // anyway, since it signs directly) and a season boundary that lands on a round number.
  const KIT_SIGN_WEEK = 520

  function worldWithKitDeal(seed: string): { world: WorldState; kit: Offer } {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.week = KIT_SIGN_WEEK
    const kit = signIconKit(world)
    return { world, kit }
  }

  it('⭐⭐ the kit deal card counts down in the plural – "(N weeks left)"', async () => {
    const { world, kit } = worldWithKitDeal('r41-14-kit-plural')
    world.week = kit.untilWeek! - 14
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text(), 'the deal term is on screen').toContain('Aurelia')
    expect(wrapper.text(), 'the bracket names the real countdown').toContain('(14 weeks left)')
    wrapper.unmount()
  })

  it('⭐ singular reads "(1 week left)", not "(1 weeks left)"', async () => {
    const { world, kit } = worldWithKitDeal('r41-14-kit-singular')
    world.week = kit.untilWeek! - 1
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text()).toContain('(1 week left)')
    expect(wrapper.text(), 'never the plural on the singular week').not.toContain('(1 weeks left)')
    wrapper.unmount()
  })

  it('⭐⭐ the final week reads "(last week)", never "(0 weeks left)"', async () => {
    const { world, kit } = worldWithKitDeal('r41-14-kit-lastweek')
    // `activeKitDeal` is inclusive of `untilWeek` itself (offers.ts:201-211) – the deal is still
    // live on this exact week, which is what makes it the boundary rather than the day after.
    world.week = kit.untilWeek!
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text()).toContain('(last week)')
    expect(wrapper.text(), 'nobody counts down to a number that means "gone"').not.toContain('(0 weeks left)')
    wrapper.unmount()
  })

  const AD_SIGN_WEEK = 300

  function worldWithAdRows(seed: string): { world: WorldState; watches: Offer; lifetime: Offer } {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.week = AD_SIGN_WEEK
    const watches = signWatchesAd(world)
    const lifetime = signLifetimeAd(world, 'Aurelia')
    return { world, watches, lifetime }
  }

  it('⭐⭐ a filled ad row carries the same bracket, off the same function', async () => {
    const { world, watches } = worldWithAdRows('r41-14-ad-row')
    world.week = watches.untilWeek! - 14
    const wrapper = await mountBills(toSnapshot(world), true)
    const rows = wrapper.findAll('.ad-slot')
    const watchesRow = rows.find((r) => r.text().includes('Watches'))
    expect(watchesRow, 'the watches row').toBeTruthy()
    expect(watchesRow!.text(), 'the running-out date is still there').toContain(weekLabel(watches.untilWeek!))
    expect(watchesRow!.text(), 'and the same bracket the kit deal carries').toContain('(14 weeks left)')
    wrapper.unmount()
  })

  it('⚠ the lifetime row carries no bracket – it has no term to count down (round 39 #3)', async () => {
    const { world, watches } = worldWithAdRows('r41-14-ad-lifetime')
    world.week = watches.untilWeek! - 14 // same week as the arm above – the two rows coexist
    const wrapper = await mountBills(toSnapshot(world), true)
    const rows = wrapper.findAll('.ad-slot')
    const lifetimeRow = rows.find((r) => r.text().includes('lifetime'))
    expect(lifetimeRow, 'the lifetime row').toBeTruthy()
    expect(lifetimeRow!.text(), 'the honest sentence is untouched').toContain('for life')
    expect(lifetimeRow!.text(), 'no fabricated countdown').not.toContain('left)')
    expect(lifetimeRow!.text(), 'and not the final-week word either').not.toContain('last week')
    wrapper.unmount()
  })

  // ⚠ MUTATION-VERIFIED (12.09, round 41 #14): `weeksLeftBracket` forced to return `''`
  // unconditionally -> RED on all four positive arms above (the kit plural, the kit singular, the
  // kit final week, and the ad row), simultaneously – one function, one mutation point, for both
  // surfaces; the lifetime arm's negative claim is untouched (an absent bracket is still absent).
  // `left <= 0` narrowed to `left < 0` -> RED on the "final week" arm ALONE (it prints
  // "(0 weeks left)" instead of "(last week)"), green on the other three – proving that arm
  // actually pins the edge word and not merely "a bracket exists". Both reverted; see the ledger
  // for the restored, green table.
})
