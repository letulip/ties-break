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
//
// ⚠⚠ AND ONE CLAUSE OF `adCategoryOpen` HAD NO MOUNTED WITNESS UNTIL 27.09: `'slam'`.
// `docs/specs/engine-ui-parity-2026-09.md` §5 item 3 recorded it rather than leaving it implicit – the
// per-reason arms of W3's T3.3 were run one clause at a time, and disabling the Slam clause reddened a
// unit case and NOTHING ON A SCREEN, because THIS file's only fixture (#150, no banked seasons) shows
// the lifetime row closed whether the clause is there or not: its tenure counter is 0 of 3 either way.
// So the clause was guarded at the primitive and at the letter and UNGUARDED at the shelf, which is the
// coverage §5 asked the next wave to close. `worldWithTenureNoSlam` is the tenure-met fixture that
// closes it, and its arm is at the bottom of this file with the measured output.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { openBillsTab } from './shelf'
import { createWorld, kidAgeYears, toSnapshot, KID_ID, type WorldState } from '../../src/engine/world'
import { acceptOffer, reviewAdOffer } from '../../src/engine/world/sponsors'
import { activeKitDeal, adCategoryOf, adWritesAt } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type SeasonHistoryEntry, type Snapshot } from '../../src/shared/protocol'
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

/** One banked season that ENDED inside the top 10 – `capstoneSeasonsOf`'s only input. The shape is
 *  `tests/round29p4-ad-portfolio.test.ts`' `seasonAt`, which is the engine-side file this one pairs
 *  with, so the two sides pose the same career. */
function seasonAt(index: number, endRank: number): SeasonHistoryEntry {
  return {
    seasonIndex: index,
    endRank: 40,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0 },
      wta: { endRank, points: 0, wins: 0, losses: 0 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  } as SeasonHistoryEntry
}

/** ⭐⭐⭐ THE TENURE-MET, SLAM-LESS CAREER – the fixture `'slam'` needed and this file did not have.
 *
 *  Enough banked top-10 seasons for BOTH crowns and NO Slam on the ledger, at a rank that stands in
 *  the top band so both crowning rows are drawn at all (`adPortfolioView` skips them when
 *  `band === null`). That makes the Slam the ONLY difference between the two rows on one screen, which
 *  is what turns «the lifetime row is closed» into a statement about this clause rather than about her
 *  tenure – the anti-vacuity the old #150 fixture could not provide. */
function worldWithTenureNoSlam(): WorldState {
  const seed = 'p4a-panel-slam'
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const adult = AD.junior.untilAgeYears
  let week = -1
  for (let w = 0; w < 900; w++) {
    if (kidAgeYears(w, world.profile.birthMonth, world.profile.birthDay) === adult) {
      week = w
      break
    }
  }
  if (week < 0) throw new Error(`no week at age ${adult} near "${seed}" – the fixture is broken`)
  world.week = week
  world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
  world.kidRankWta = 5
  const seasons = Math.max(AD.capstone.seasonsInTop10, AD.lifetime.seasonsInTop10)
  world.seasonHistory = Array.from({ length: seasons }, (_, i) => seasonAt(i, 5))
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

  // ⭐⭐⭐ B-03 / T3.3 (26.09) – THE THIRD ARM THE PARITY CONVENTION OWES A TEMPLATE
  // (docs/specs/engine-ui-parity-2026-09.md §2: «a third arm is owed where the surface is a
  // template»). The engine's row is asserted in tests/round29p4-ad-portfolio.test.ts; what only a
  // MOUNT can say is which of MoneyScreen's three closed-row spellings the kitless slot lands on –
  // the owner's ruling 5a is «closed, with the EXISTING «Not open yet»», and that string is chosen
  // inside the template's own ternary, where no engine assertion reaches.
  //
  // THE FIXTURE ALREADY POSED IT: `worldWithSignedAd` signs a WATCHES deal and nobody ever dresses
  // her, so this career's clothing slot is exactly the state the probe found on 316 of 316 sampled
  // weeks – and before T3.3 this very mount rendered «Open – nobody signed» over a letter
  // `reviewAdOffer` refuses.
  //
  // MUTATION ARM (the template's own, run alone): make the closed row's fallback print
  // `row.opensAtRank ? … : ''` → this case reddens on the missing sentence while every unit net,
  // including the engine-side arm above, stays green.
  it('⭐⭐ B-03 – a kitless clothing slot is closed on screen, in the sentence the shelf already had', async () => {
    const world = worldWithSignedAd()
    expect(activeKitDeal(world.offers, world.week), 'nobody dresses her in this fixture').toBeNull()
    const wrapper = await mountBills(toSnapshot(world))
    const clothing = wrapper.findAll('.ad-slot').find((r) => r.text().includes('Clothing'))
    expect(clothing, 'a Clothing row exists').toBeTruthy()
    expect(clothing!.classes()).toContain('is-closed')
    expect(clothing!.text()).toContain('Not open yet')
    // ...and none of the open row's promise survives in it: no «nobody signed», no cheque a letter
    // could not bring.
    expect(clothing!.text()).not.toContain('Open – nobody signed')
    expect(clothing!.text()).not.toContain('a year')
    wrapper.unmount()
  })

  // ⭐⭐⭐ THE WITNESS THE PARITY SPEC ASKED THE NEXT WAVE FOR (§5 item 3, recorded 26.09; built 27.09).
  //
  // MUTATION ARM, and it is the whole reason this case exists: disable the `'slam'` clause in
  // `src/engine/world/sponsors.ts` – the line that returns `{ open: false, reason: 'slam' }` when the
  // ledger holds fewer Slam titles than `ECONOMY.advertising.lifetime.slamTitles` – and THIS case
  // reddens, on a screen, where before §5's note it reddened only a unit case. Output in the wave's
  // report.
  it("⭐⭐⭐ `'slam'` on the shelf – tenure enough for both crowns, no Slam, and only the lifetime row is shut", async () => {
    const world = worldWithTenureNoSlam()
    // ANTI-VACUITY, stated as the fixture's own preconditions: the tenure IS met and the ledger is
    // empty of Slams, so nothing but this clause can be answering for the lifetime row.
    expect(world.trophiesByTier.slam?.titles ?? [], 'no Slam on the ledger').toEqual([])
    expect(world.seasonHistory.length, 'the tenure both crowns ask for is banked').toBeGreaterThanOrEqual(
      AD.lifetime.seasonsInTop10,
    )

    const wrapper = await mountBills(toSnapshot(world))
    const rows = wrapper.findAll('.ad-slot')

    // THE CAPSTONE IS OPEN on this very career, which is what makes the row below a statement about
    // the Slam: one clause, one difference, one screen.
    const capstone = rows.find((r) => r.text().includes('The capstone'))
    expect(capstone, 'a capstone row exists').toBeTruthy()
    expect(capstone!.classes(), 'the tenure gate did not open the capstone on a tenure-met career').toContain('is-open')

    // ...AND THE LIFETIME ROW IS SHUT, and it says which half is missing – the counted pair the
    // round-39 row was given, with the Slams first.
    const lifetime = rows.find((r) => r.text().includes('The lifetime deal'))
    expect(lifetime, 'a lifetime row exists').toBeTruthy()
    expect(lifetime!.classes(), 'a legend with no Slam was promised the biggest paper in the game').toContain('is-closed')
    expect(lifetime!.text()).toContain(`0 of ${AD.lifetime.slamTitles} Slams`)
    expect(lifetime!.text()).toContain(
      `${world.seasonHistory.length} of ${AD.lifetime.seasonsInTop10} top-10 seasons`,
    )
    // ...and none of the OPEN row's promise survives in it: no «nobody signed», no cheque.
    expect(lifetime!.text()).not.toContain('Open – nobody signed')
    expect(lifetime!.text()).not.toContain('a year')
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
