// ⭐⭐ ROUND 39 #11 – THE ACADEMY FAMILY SAYS ITS ONE TOTAL, under the rungs it adds up.
//
// THE OWNER, 08.09: «видимо вторая половина её, но ее не видно, поэтому и был вопрос, т.к. в
// интерфейсе доход около 17к». On his save the four stages earn $0 / $4,346 / $11,438 / $17,385 a
// week – $33,169 together – and the shelf only ever said the per-rung figures, so he read the staff
// rung's $17k as the whole academy. The build is ONE line on the academy family section: the total,
// summed from the rows' own `incomeCents` – the field every card under it prints – so the total and
// the rungs cannot disagree (`academyIncomeCents` in MoneyScreen.vue carries the argument).
//
// The fixture is his save's own shape at test size: a delivered stage that earns NOTHING (the land –
// its base is 0 by design, business.ts: «The land alone is a field and earns nothing») above two
// delivered stages that earn, so the sum is genuinely a sum of several displayed figures and not one
// figure echoed. At reputation 1.0 (no finished pro season) the engine's rungs are whole dollars –
// courts $950.00, clubhouse $2,500.00 – so the dollar arithmetic below has no rounding seam in it.
//
// ⚠ MUTATION-VERIFIED (08.09, logged in docs/rounds/round-39.md item 11): the computed's reduce
// given `.filter((r) => r.id !== 'academy-building')` (one rung dropped from the sum) -> the
// equality arm red ($950 against the cards' $3,450); the draw predicate `> 0` loosened to `>= 0`
// -> the owns-nothing arm red (a total over nothing). Both restored -> green.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ The runner-sized ceiling, round36-review.test.ts's own arithmetic: real engine weeks under a
// 2-core CI runner measured 4-5x this machine. The walks are hoisted out of the cases; 30s can only
// fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { SHELF_TAB_LABELS, openShelfTab } from './shelf'

/** A real career, walked by the real engine – shop-tab.test.ts's recipe, shared by every file that
 *  reaches the shelf. */
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

/**
 * ⚠ WALKED ONCE PER FIXTURE, OUTSIDE THE CASES – round36-review.test.ts's lesson. Each snapshot is
 * read-only data, so one career serves every arm that reads it.
 *
 * The three rungs, written directly: an owned row with no `readyWeek` is what «delivered» means
 * (shared/protocol/profile.ts), and r39-owned-shelf-paid.test.ts is the recipe. `buyAsset` would
 * put a stage ON ORDER (`incomeCents` 0 until delivery), and walking the build out in a component
 * suite buys nothing these assertions need.
 */
function earningFixture(): Snapshot {
  const w = walk('r39-11-academy-total', 20)
  w.fundsCents = 60_000_000_00
  w.assets = [
    { id: 'academy-land', boughtWeek: 0, paidCents: 2_000_000_00, valueCents: 2_000_000_00 },
    { id: 'academy-courts', boughtWeek: 0, paidCents: 3_000_000_00, valueCents: 3_000_000_00 },
    { id: 'academy-building', boughtWeek: 0, paidCents: 4_000_000_00, valueCents: 4_000_000_00 },
  ]
  return toSnapshot(w)
}
const earningSnap = earningFixture()

/** The same career shape with the academy never started – the shelf's ordinary state, which is the
 *  state every earlier fixture in this suite mounts. The brand row is deliberately owned: if any
 *  OTHER family were ever given a total, this is the family it would leak onto first. */
function ownsNothingFixture(): Snapshot {
  const w = walk('r39-11-academy-none', 20)
  w.fundsCents = 60_000_000_00
  w.assets = [{ id: 'merch-brand', boughtWeek: 0, paidCents: 250_000_00, valueCents: 250_000_00 }]
  return toSnapshot(w)
}
const ownsNothingSnap = ownsNothingFixture()

async function mountShop(snap: Snapshot) {
  useGameStore().snapshot = snap
  const wrapper = mount(MoneyScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop chapter').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

/** The academy family's own section of the open tab, found by its heading – never by position. */
function academySection(wrapper: VueWrapper) {
  const section = wrapper
    .findAll('.shop-family')
    .find((f) => f.find('.shop-family-head').text().trim() === 'Her academy')
  expect(section, 'the Her academy section under Business').toBeTruthy()
  return section!
}

/** The one dollar figure in a sentence, as a number of whole dollars. */
function dollarsOf(text: string): number {
  const m = text.match(/\$([\d,]+)/)
  expect(m, `a dollar figure in ${JSON.stringify(text)}`).toBeTruthy()
  return Number(m![1].replace(/,/g, ''))
}

describe('round 39 #11 – the academy family states its combined weekly income', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ the total line renders and its figure is the SUM of the per-rung figures on the cards', async () => {
    // The premise first: the career really has 2+ delivered, EARNING rungs, off the same snapshot
    // field the screen reads – so a green run can never be a sum over one figure or over none.
    const academyRows = earningSnap.shop.rows.filter((r) => r.family === 'academy')
    const earning = academyRows.filter((r) => r.incomeCents > 0)
    expect(earning.length, 'two delivered stages earn on this career').toBeGreaterThanOrEqual(2)

    const wrapper = await mountShop(earningSnap)
    await openShelfTab(wrapper, 'Business')
    const section = academySection(wrapper)

    // The per-rung lines the owner was adding up in his head: exactly the earning stages, no more –
    // the delivered land is on the shelf but says nothing, which is his save's own shape.
    const rungLines = section.findAll('.shop-row-earning')
    expect(rungLines.length, 'one earning line per earning stage').toBe(earning.length)

    const total = section.find('.shop-family-earning')
    expect(total.exists(), 'the family total is on the section').toBe(true)
    expect(total.text()).toContain('The whole academy brings in')
    expect(total.text()).toContain('a week right now')

    // ⭐ THE CLAIM OF THE ITEM: what the total says equals what the cards say, added up.
    const rungDollars = rungLines.map((line) => dollarsOf(line.text()))
    const totalDollars = dollarsOf(total.text())
    expect(totalDollars, 'the total is the sum of the displayed per-rung figures').toBe(
      rungDollars.reduce((a, b) => a + b, 0),
    )
    // …and both are the engine's own field, summed once – never a second arithmetic.
    const centsSum = academyRows.reduce((sum, r) => sum + r.incomeCents, 0)
    expect(totalDollars, 'the same number the snapshot rows add up to').toBe(Math.round(centsSum / 100))
    // The misreading the item is about: no single rung's figure can be the family's – with two
    // earning stages the total is strictly larger than any one line above it.
    for (const d of rungDollars) expect(totalDollars).toBeGreaterThan(d)

    // ⚠ Invariant 4's witness: the academy ALONE got a total. The brand's section shares the tab
    // and does not say one.
    const brand = wrapper
      .findAll('.shop-family')
      .find((f) => f.find('.shop-family-head').text().trim() === 'The business')
    expect(brand, 'the brand section shares the Business tab').toBeTruthy()
    expect(brand!.find('.shop-family-earning').exists(), 'no total leaks onto the brand').toBe(false)
    wrapper.unmount()
  })

  it('⭐ …and the line is ABSENT when the academy family owns nothing – on every shelf page', async () => {
    const academyRows = ownsNothingSnap.shop.rows.filter((r) => r.family === 'academy')
    expect(academyRows.every((r) => r.valueCents === null), 'the academy really is unowned').toBe(true)

    const wrapper = await mountShop(ownsNothingSnap)
    // All six pages, not just Business: the claim is that NO family carries the line here, which is
    // both halves of the guard – nothing over an unowned academy, and no total invented elsewhere.
    for (const label of SHELF_TAB_LABELS) {
      await openShelfTab(wrapper, label)
      expect(
        wrapper.find('.shop-family-earning').exists(),
        `no family total anywhere on the ${label} page of an academy-less career`,
      ).toBe(false)
    }
    wrapper.unmount()
  })
})
