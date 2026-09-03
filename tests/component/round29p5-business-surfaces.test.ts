// ROUND 29 PART FOUR P7 – THE BUSINESSES' THREE SURFACES, MOUNTED: fame's one line where the
// sponsors live, the shop's business family with the earning line, and the household strip naming
// the two income streams it totals.
//
// ⚠ WHY MOUNTED (CLAUDE.md: «Prefer a mounted test to a source pin»): the engine derives fame and
// both incomes correctly whether or not any screen prints them – an engine-side assertion cannot
// fail on a line the player never sees, which is exactly how the round29p2 ladder shipped legible
// only in the inbox. Every figure asserted below is compared against the SNAPSHOT'S OWN NUMBER,
// never against a re-derivation in this file.
//
// ⚠ MUTATIONS, EACH APPLIED ALONE AND WATCHED FAIL BEFORE THIS FILE WAS BELIEVED – what each
// ACTUALLY reddened, counted from the runs:
//   MA the fame line's `{{ fame }}` replaced with a hard-coded 0 → §1's number assertion (1 red);
//   MB `toSnapshot` deriving `fame: 0` unconditionally → §1's >0 arm (1 red – the mounted line
//      and the snapshot agree about the wrong number, and the arm about the WORLD catches it);
//   MC the strip's business hint deleted from HouseholdStrip.vue → §3's line arm (1 red);
//   MD the shop row's earning line deleted from MoneyScreen.vue → BOTH §2 arms (2 red – merch's
//      quote and every academy stage's);
//   ME `SHOP_FAMILIES` without the business entry → §2's family arm (1 red: the head and the
//      merch row vanish together; the academy arm rightly survives – its family still renders).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { openBillsTab, openShelfTab } from './shelf'
import {
  academyWeeklyIncomeCents,
  buyAsset,
  createWorld,
  merchFamilyWeeklyIncomeCents,
  merchWeeklyIncomeCents,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../../src/engine/world'
import { reviewAdOffer, acceptOffer } from '../../src/engine/world/sponsors'
import { adWritesAt } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type SeasonHistoryEntry, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'

/** An adult career with a signed watches deal (the p4 panel file's own probe idiom), a Slam title
 *  for a real fame floor, the owner's own reputation ladder, and both businesses bought. */
function businessWorld(seed = 'p5a-surfaces'): WorldState {
  let hit = -1
  for (let w = 300; w < 500; w++) {
    if (adWritesAt(seed, w, ECONOMY.advertising.offerChance, 'watches')) {
      hit = w
      break
    }
  }
  if (hit < 0) throw new Error(`the watches dice never said yes near "${seed}"`)
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = hit
  world.results.push({ playerId: KID_ID, week: hit, points: 100, tier: 'w100' })
  world.kidRankWta = 150
  world.bestFinishByTier.w15 = 0
  world.trophiesByTier.slam.titles.push(hit - 4)
  world.seasonHistory = [98, 42, 23, 8].map(
    (endRank, i): SeasonHistoryEntry => ({
      seasonIndex: i,
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
    }),
  )
  reviewAdOffer(world)
  const letter = world.offers.find((o) => o.kind === 'ad' && o.state === 'open')
  if (letter) acceptOffer(world, letter.id)
  world.fundsCents = 15_000_000_00
  buyAsset(world, 'merch-brand')
  for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) buyAsset(world, id)
  return world
}

async function mountMoneyTab(snap: Snapshot, label: string): Promise<VueWrapper> {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === label)
  expect(pill, `the ${label} tab control`).toBeTruthy()
  await pill!.trigger('click')
  return wrapper
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// 1 – FAME'S ONE LINE, WHERE THE SPONSORS LIVE
// =================================================================================================
describe('§1 the fame line on the Bills portfolio card', () => {
  it('⭐⭐ says how known she is, with the engine\'s own whole number', async () => {
    const world = businessWorld()
    const snap = toSnapshot(world)
    expect(snap.fame, 'a Slam winner is known').toBeGreaterThan(0)
    expect(Number.isInteger(snap.fame), 'rounded ONCE at the boundary').toBe(true)
    const wrapper = await mountMoneyTab(snap, 'Bills')
    // ⚠ RE-AIMED, ROUND 30 #5 – the fame line lives on the portfolio card, and that card is now
    // behind the `Advs Portfolio` segment of Bills. The claim is untouched.
    await openBillsTab(wrapper, 'Advs Portfolio')
    const line = wrapper.find('.ad-fame-line')
    expect(line.exists(), 'the fame line lives on the portfolio card').toBe(true)
    expect(line.text()).toContain(`How known she is – ${snap.fame} of 100`)
  })

  it('...and is not there for a junior: no portfolio card, no fame line', () => {
    const world = createWorld('p5a-junior', DEFAULT_PROFILE)
    const store = useGameStore()
    store.snapshot = toSnapshot(world)
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    expect(wrapper.find('.ad-fame-line').exists()).toBe(false)
  })
})

// =================================================================================================
// 2 – THE SHOP: THE BUSINESS FAMILY, AND THE EARNING LINE ON AN OWNED EARNER
// =================================================================================================
describe('§2 the shop shelf carries the business family and quotes what it earns', () => {
  it('⭐⭐ the merch row sits under its own family head and says what it brings in right now', async () => {
    const world = businessWorld('p5a-shop')
    const snap = toSnapshot(world)
    const merchRow = snap.shop.rows.find((r) => r.id === 'merch-brand')!
    // ⚠⚠ RE-AIMED AT ROUND 35 #9, NEVER LOOSENED, AND THE CLAIM IS THIS ARM'S OWN TITLE: the row
    // «says what it brings in right now». What it brings the FAMILY changed on 03.09 – her ramp
    // comes off the brand's week at the banking site («в недельном доходе будет семье на руки сумма
    // меньше») – so the card follows the till, which is the equality this line has always asserted.
    // Only the function on the right-hand side moved with the money.
    expect(merchRow.incomeCents).toBe(merchFamilyWeeklyIncomeCents(world))
    expect(merchRow.incomeCents).toBeGreaterThan(0)
    // ⚠ AND THE GROSS IS STILL THE GROSS – the figure `brandGrossWorthCents` multiplies. The two
    // must not have collapsed into one number, which is exactly what a split placed in the rate
    // would have done.
    expect(merchRow.incomeCents, 'her cut really came off').toBeLessThan(merchWeeklyIncomeCents(world))
    const wrapper = await mountMoneyTab(snap, 'Shop')
    // ⚠ RE-AIMED, ROUND 30 #5 – «Business (Academy is subdivision inside)»: the brand and the
    // academy share ONE segment, so this presses it. The family heading is unchanged word for word
    // (invariant 4) and is still what separates the two inside the tab.
    await openShelfTab(wrapper, 'Business')
    const heads = wrapper.findAll('.shop-family-head').map((n) => n.text())
    expect(heads).toContain('The business')
    const earners = wrapper.findAll('.shop-row-earning').map((n) => n.text())
    expect(earners).toContain(`Brings in ${formatCents(merchRow.incomeCents)} a week right now`)
  })

  it('⭐ every delivered academy stage quotes its own share, and the shares sum to the ledger\'s line', async () => {
    const world = businessWorld('p5a-shop-academy')
    const snap = toSnapshot(world)
    const stageRows = snap.shop.rows.filter((r) => r.family === 'academy' && r.incomeCents > 0)
    expect(stageRows.length).toBe(3) // the land is a field
    expect(stageRows.reduce((s, r) => s + r.incomeCents, 0)).toBe(academyWeeklyIncomeCents(world))
    const wrapper = await mountMoneyTab(snap, 'Shop')
    // ⚠ RE-AIMED, ROUND 30 #5 – AND THIS IS THE ARM THAT PROVES THE SUBDIVISION. The academy has no
    // tab of its own: its four stages are reached through `Business`, which is exactly what «Academy
    // is subdivision inside» asks for. If the map in `SHELF_TAB_FAMILIES` ever gave the academy its
    // own segment, this would go red on the tab it presses.
    await openShelfTab(wrapper, 'Business')
    const earners = wrapper.findAll('.shop-row-earning').map((n) => n.text())
    for (const row of stageRows) {
      expect(earners).toContain(`Brings in ${formatCents(row.incomeCents)} a week right now`)
    }
  })
})

// =================================================================================================
// 3 – THE HOUSEHOLD STRIP NAMES WHAT IT TOTALS (round 28 #8's law, extended)
// =================================================================================================
describe('§3 the strip\'s business line', () => {
  it('⭐⭐ names the two streams, in the figures the engine banked into the IN total', () => {
    const world = businessWorld('p5a-strip')
    const snap = toSnapshot(world)
    const merch = snap.coachBilling.household.merchCents
    const academy = snap.coachBilling.household.academyIncomeCents
    expect(merch).toBeGreaterThan(0)
    expect(academy).toBeGreaterThan(0)
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(SupportStaffTab, { global: { stubs: { teleport: true } } })
    const line = wrapper.find('.budget-business')
    expect(line.exists(), 'the strip names the businesses').toBe(true)
    expect(line.text()).toContain(formatCents(merch + academy))
    expect(line.text()).toContain(`merch ${formatCents(merch)}`)
    expect(line.text()).toContain(`the academy ${formatCents(academy)}`)
  })

  it('...and is silent for a family with no business – no $0 noise on a junior strip', () => {
    const world = createWorld('p5a-strip-quiet', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const store = useGameStore()
    store.snapshot = toSnapshot(world)
    const wrapper = mount(SupportStaffTab, { global: { stubs: { teleport: true } } })
    expect(wrapper.find('.budget-business').exists()).toBe(false)
  })
})
