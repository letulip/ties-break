// ROUND 41 #25 – «даже тикер в 12к годовых на форму заканчивается раньше года, в августе уже 0».
//
// Recon's verdict (docs/rounds/round-41.md, "recon verdicts folded", item 25): the "12k ticker" IS
// the icon kit deal's SEASON ALLOWANCE (Aurelia, `seasonCents: 12_000_00`) – a ceiling, not a
// subscription – and the corpus reproduces his August to the week (wealthy x pro burns ≈$388/wk ->
// ≈31 weeks -> early August). The engine is working as designed; what it owed him was the FORECAST.
// The build: the kit card gains a projected-empty line, rendered only when a deal is live, the
// allowance is not yet spent, the pace is positive, at least four weeks of the season have gone by
// (a two-week-old season extrapolates garbage), and the projection still lands inside the season
// (past the boundary the allowance resets, so "runs out" would be false – sponsors.ts:104-108).
//
// ⚠ WHY THIS IS A MOUNTED TEST. `kitAllowanceProjectedEmptyWeek` is entirely a MoneyScreen.vue
// computed with no engine counterpart to pin – the claim under test is "what the screen tells the
// parent about a real `KitDealView`", exactly the class CLAUDE.md names: "Prefer a mounted test to
// a source pin."
//
// THE FIXTURE IS A REAL DEAL, signed through the engine's own pure "what would this cell offer"
// function (`kitTermsFor`) pushed and signed directly (offers.ts's own documented use, the same
// idiom tests/round29p4-ad-portfolio.test.ts's `signKit` already exercises) – nothing here is a
// hand-built `KitDealView`. Only `coveredCents` (what she has actually spent this season) is poked
// directly afterwards, exactly as `r39-owned-shelf-paid.test.ts`'s own fixture pokes `fundsCents` –
// a raw persisted number on the offer, read back by the engine's own `kitDealView`, never a
// hand-built derived figure.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, type WorldState, toSnapshot } from '../../src/engine/world'
import { kitTermsFor, signOffer } from '../../src/engine/offers'
import { sponsorStandingOf } from '../../src/engine/world/sponsors'
import { weekLabel } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Offer, type Snapshot } from '../../src/shared/protocol'

/** A signed icon-rung kit deal (Aurelia, $12,000/season, four seasons) – the exact rung the owner's
 *  12.09 report measured. `standing` does not gate the icon branch of `kitTermsFor` (it only reads
 *  `ECONOMY.sponsorship.icon`), so a fresh, unranked world signs it exactly as a real WTA #4 would. */
function signIconKit(world: WorldState): Offer {
  const terms = kitTermsFor(sponsorStandingOf(world), 'icon')
  if (!terms) throw new Error('no icon kit terms')
  const offer: Offer = {
    id: `r41-25-kit-${world.week}`,
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

async function mountBills(snap: Snapshot) {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  return wrapper
}

describe("round 41 #25 – the kit allowance's projected-empty line", () => {
  beforeEach(() => setActivePinia(createPinia()))

  const KIT_SIGN_WEEK = 520 // season 10 starts exactly here (520 = 10 * 52)

  function worldWithKitDeal(seed: string): { world: WorldState; kit: Offer } {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.week = KIT_SIGN_WEEK
    const kit = signIconKit(world)
    return { world, kit }
  }

  it('⭐⭐ a heavy burner mid-season sees the pace and the week it runs out', async () => {
    const { world, kit } = worldWithKitDeal('r41-25-heavy')
    world.week = KIT_SIGN_WEEK + 10 // ten weeks into the season – past the four-week floor
    kit.coveredCents = 388_00 * 10 // ≈$388/wk, the recon's own wealthy x pro figure
    // Hand math, so the assertion is not just "the mutation's own arithmetic read back":
    // remaining = 12,000 - 3,880 = $8,120; pace = $388/wk; 8120/388 = 20.93 -> 21 more weeks.
    const projectedWeek = world.week + 21
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text(), 'the pace line is on the card').toContain('At this pace it runs out around')
    expect(wrapper.text(), 'naming the week the hand math predicts').toContain(weekLabel(projectedWeek))
    wrapper.unmount()
  })

  it('⭐⭐ a light burner whose projection would land past the season end shows nothing', async () => {
    const { world, kit } = worldWithKitDeal('r41-25-light')
    world.week = KIT_SIGN_WEEK + 10
    kit.coveredCents = 40_00 * 10 // $40/wk – remaining/pace runs to week +290, well past +52
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text(), 'the allowance is not spent, so the "gone" note is absent too').not.toContain('is spent')
    expect(wrapper.text(), 'and the projection is silent rather than naming a week that is a lie').not.toContain(
      'At this pace it runs out',
    )
    wrapper.unmount()
  })

  it('⭐ a season under four weeks old prints nothing, however heavy the early spend', async () => {
    const { world, kit } = worldWithKitDeal('r41-25-early')
    world.week = KIT_SIGN_WEEK + 2 // two weeks in – a real week's spend would extrapolate garbage
    kit.coveredCents = 250_00 * 2 // $250/wk – heavy enough that, absent the floor, IT WOULD render
    const wrapper = await mountBills(toSnapshot(world))
    expect(wrapper.text(), 'a two-week-old season is refused on purpose').not.toContain('At this pace it runs out')
    wrapper.unmount()
  })

  // ⚠ MUTATION-VERIFIED (12.09, round 41 #25), each applied alone, run, and reverted:
  //   * the season-end guard (`projectedWeek >= seasonStart + WEEKS_PER_YEAR`) dropped -> RED on the
  //     "light burner" arm only (it now prints a week 290 weeks out; the other two arms untouched);
  //   * the four-week floor (`weeksElapsed < 4`) dropped -> RED on the "early-season" arm only (its
  //     heavy $250/wk pace now prints a line, which is exactly the garbage the floor exists to stop);
  //   * `kitAllowanceProjectedEmptyWeek` forced to `null` unconditionally -> RED on the "heavy
  //     burner" arm (the one positive claim in this file that a line renders at all).
  // See the ledger for the restored, green table.
})
