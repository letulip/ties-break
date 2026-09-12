// ⭐⭐ ROUND 39 #4 – THE GREY `paid $N` LEAVES THE OWNED BOATS AND PLANES.
//
// THE OWNER, 08.09: «В яхтах и (подразумеваю) самолётах на уже купленных тоже убрать с карточки
// серую надпись „paid ..."». The «тоже» is round 36 review #12/#13 (cars, academy) and round 35 #7
// (houses) asked for on the two families those rounds deliberately left – the mechanism is the
// same one line: `SHELF_NO_PAID_META` in MoneyScreen.vue grows `boat` and `plane`, and the meta
// simply stops being passed. Nothing on the card is re-worded, moved or restyled.
//
// WHAT LEGITIMATELY KEPT THE CAPTION AT THE TIME, and why each kept it:
//   * the `On order` card – water and air are BUILT to order, and on that card the paid figure was
//     the ONLY money figure (no «Worth now», no gain line), so removing it would have LOST the
//     number – the exact check round 36 documented before the caption could go from an owned card.
//     «Ordered, not bought» is the shelf's own word for it, and round 36 never touched that row
//     either. ⚠⚠ ROUND 41 #2 SUPERSEDES THIS BULLET – see the re-aimed arm below;
//   * `investment` and `business` – the two families no round has named. Invariant 4 does not let
//     the change spread on its own; `round35-shop.test.ts` holds the brand's witness arm. STILL
//     TRUE, untouched by round 41.
//
// ⚠ MUTATION-VERIFIED (08.09, logged in docs/rounds/round-39.md item 4): `'boat'` removed from
// `SHELF_NO_PAID_META` -> the owned-yacht arm red; `'plane'` removed -> the owned-plane arm red;
// both restored -> green. The PRESENT arms below are what keeps either mutation from being
// satisfiable by deleting the caption everywhere.
//
// ⚠⚠ MUTATION-VERIFIED AGAIN (12.09, round 41 #2, logged in docs/rounds/round-41.md item 2): the
// `On order` StatRow's removed `:meta` restored -> BOTH the re-aimed boat arm and the new plane arm
// below go red simultaneously (one unconditional template site, one mutation point, two families);
// reverted -> green. This is the OPPOSITE mutation direction from the one above it – 08.09 proved
// the caption could not be deleted from EVERYWHERE by accident, 12.09 proves it cannot be RESTORED
// to the On-order card by accident either. Both stand.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ The runner-sized ceiling, round36-review.test.ts's own arithmetic: real engine weeks under a
// 2-core CI runner measured 4-5x this machine. The walk is hoisted out of the cases; 30s can only
// fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  buyAsset,
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { shelfRow } from './shelf'

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

/** Rich enough that no rung is greyed for money alone. */
function rich(seed: string, weeks = 20): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

/**
 * ⚠ WALKED ONCE, OUTSIDE THE CASES – round36-review.test.ts's lesson. The snapshot is read-only
 * data, so one career serves every arm.
 *
 * The five rungs, and why each shape:
 *   * `yacht` / `plane-small` DELIVERED, written directly: an owned row with no `readyWeek` is what
 *     «delivered» means (shared/protocol/profile.ts), and walking 52-156 real weeks in a component
 *     suite would buy nothing these assertions need – round29-shop-elite.test.ts's own recipe. They
 *     are written BEFORE the three buys below, which append.
 *   * `boat-launch` AND `plane` bought for real, so each draws its own `On order` card – water and
 *     air, round 41 #2's exact census (⚠ THIS caption's history moved on 12.09 – see the re-aimed
 *     arm below, it no longer "keeps" anything).
 *   * `merch-brand` bought for real (business delivers instantly) – the family he did not name.
 */
function fixture(): Snapshot {
  const w = rich('r39-4-shelf-paid')
  w.assets = [
    { id: 'yacht', boughtWeek: 0, paidCents: 12_000_000_00, valueCents: 12_000_000_00 },
    { id: 'plane-small', boughtWeek: 0, paidCents: 7_000_000_00, valueCents: 7_000_000_00 },
  ]
  buyAsset(w, 'boat-launch')
  buyAsset(w, 'plane')
  buyAsset(w, 'merch-brand')
  return toSnapshot(w)
}
const snap = fixture()

async function mountShop() {
  useGameStore().snapshot = snap
  const wrapper = mount(MoneyScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop chapter').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

describe('round 39 #4 – an owned boat or plane no longer names what was paid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ the delivered yacht: `paid $` gone, and the figure is NOT lost with the line', async () => {
    const wrapper = await mountShop()
    const yacht = await shelfRow(wrapper, 'The yacht')
    expect(yacht.find('.shop-row-owned').exists(), 'the yacht really is the owned card').toBe(true)
    expect(yacht.text(), 'the purchase price is off the owned yacht').not.toContain('paid $')
    // ⚠⚠ The check that had to pass before the line could go, round 35 #7's own reason («раз
    // прибавка и так видна»): what was paid is «Worth now» minus the gain, and both stay on the card.
    expect(yacht.text(), 'the current worth is still the figure on the row').toContain('Worth now')
    expect(yacht.text(), 'and the gain is still its own line').toContain('since you bought it')
    wrapper.unmount()
  })

  it('⭐⭐ …and the delivered plane, by the same rule', async () => {
    const wrapper = await mountShop()
    const plane = await shelfRow(wrapper, 'The small plane')
    expect(plane.find('.shop-row-owned').exists(), 'the plane really is the owned card').toBe(true)
    expect(plane.text(), 'the purchase price is off the owned plane').not.toContain('paid $')
    expect(plane.text(), 'the current worth is still the figure on the row').toContain('Worth now')
    expect(plane.text(), 'and the gain is still its own line').toContain('since you bought it')
    wrapper.unmount()
  })

  // ⚠⚠ RE-AIMED BY ROUND 41 #2, NOT LOOSENED. This arm used to assert the OPPOSITE – that the
  // ordered card KEPT `paid $900,000` because "no «Worth now» and no gain line on this card, so
  // `paid $N` is the only money on it". That reasoning was sound on 08.09 and is kept, amended, at
  // MoneyScreen.vue's `SHELF_NO_PAID_META` comment block. It stopped being the ruling on 12.09: the
  // owner read this exact card as the SAME leftover round 39 #4 removed from the owned card above –
  // «Не убрали paid from water на заказанных, надо и другие категории проверить» – so the figure is
  // now gone from the `On order` StatRow unconditionally, and this arm asserts the ABSENCE instead.
  it('⚠⚠ round 41 #2 – the On order card no longer says what was paid', async () => {
    const wrapper = await mountShop()
    const ordered = await shelfRow(wrapper, 'The sailing boat')
    expect(ordered.text(), 'a fresh boat is a contract, not a boat').toContain('On order')
    // The date is still the point of the card (round 29 #5, §3f) – only the caption is gone.
    expect(ordered.text(), 'the delivery date is still on the card').toMatch(/W\d+ '\d+/)
    expect(ordered.text(), 'the ordered boat no longer names what was paid').not.toContain('paid $')
    wrapper.unmount()
  })

  // ⚠⚠ ROUND 41 #2 – HIS OWN STEER, «и другие категории проверить» is part of the item, not an
  // afterthought. The template site the arm above pins is UNCONDITIONAL (no `family` check at all),
  // so air has to lose the caption with no code of its own asking for it – this arm is the census
  // half of the item, proving the same fix reaches the second (and last) family that can ever be
  // "on order" today.
  it('⚠⚠ round 41 #2 – and so does the ordered plane (air), the same unconditional site', async () => {
    const wrapper = await mountShop()
    const plane = await shelfRow(wrapper, 'The plane')
    expect(plane.text(), 'a fresh plane is a contract, not a plane').toContain('On order')
    expect(plane.text(), 'the ordered plane no longer names what was paid').not.toContain('paid $')
    wrapper.unmount()
  })

  it('⚠ the merch brand is untouched – he named water and air, not the shelf', async () => {
    const wrapper = await mountShop()
    const brand = await shelfRow(wrapper, 'The merch brand')
    expect(brand.find('.shop-row-owned').exists(), 'the brand really is the owned card').toBe(true)
    expect(brand.text(), 'a family no round has named still says what was paid').toContain('paid $')
    wrapper.unmount()
  })
})
