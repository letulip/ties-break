// ⭐ ROUND 41 #28 – THE BUILD RING, MOUNTED. The owner, 12.09 (second visit, same round): «давай на
// плитках тех айтемов в магазине, которые нуждаются в постройке длительной (академия, яхты,
// самолеты) добавим в уголке картинки наш круглый гаудж (переиспользуем компонент), чтобы он
// показывал в процентах прогресс стройки от 0 до 100… Только его надо сделать чуть меньше размером,
// чем на главной».
//
// So: the export's own ProgressRing (Home's condition ring), at the NEW 36px size, on the art
// corner of a tile the engine says is still being built. The predicate is `readyWeek`/`buildWeeks`
// – never a family list – so the academy's stages, the boats and the planes all get it the day
// they order, and an instant rung can never grow one.
//
// House rule (round29-shop-elite's header): mount the real SFC against a REAL snapshot built by
// the real engine. The mid-build states are week surgery on a real world – the snapshot is a pure
// read and `readyWeek` is persisted at purchase, so serving 13 of the yacht's 52 weeks is one
// field; the DELIVERY flip (readyWeek → null) is the engine's own tick machinery and is covered by
// round29-shop-elite §2, not re-proven here.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
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

function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

function rich(seed: string, weeks = 20): WorldState {
  const w = professional(walk(seed, weeks))
  w.fundsCents = 60_000_000_00
  return w
}

/** A yacht ordered, then `served` of its 52 build weeks passed – by week surgery, see header. */
function orderedAt(seed: string, served: number): Snapshot {
  const w = rich(seed)
  buyAsset(w, 'yacht')
  w.week += served
  return toSnapshot(w)
}

async function mountShop(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('round 41 #28 – the build ring on a tile that builds to order', () => {
  it('⭐⭐ 13 weeks served reads 13/buildWeeks of the circle, at the smaller 36px, on the art corner', async () => {
    const snap = orderedAt('r41-ring-25', 13)
    // ⚠ The expected figure is the ROW's own arithmetic, not a hand-typed constant – the first cut
    // of this test assumed the yacht builds in 52 weeks and the engine said 156 (the catalogue's
    // own number). Reading buildWeeks off the snapshot keeps the arm honest against a catalogue
    // retune AND still reddens if the component divides by anything else (the mutation below).
    const row = snap.shop.rows.find((r) => r.id === 'yacht')!
    const expected = String(Math.round((13 / row.buildWeeks!) * 100))
    const wrapper = await mountShop(snap)
    const yacht = await shelfRow(wrapper, 'The yacht')
    const ring = yacht.find('.build-ring')
    expect(ring.exists(), 'the ring is on the ordered tile').toBe(true)
    // «чуть меньше размером, чем на главной» – Home's is 46; this one is the new 36.
    expect(ring.classes(), 'the 36px size he asked for').toContain('tb-ring--36')
    expect(ring.find('b').text(), `13 of ${row.buildWeeks} weeks`).toBe(expected)
    // The spoken sentence carries the ready week through weekLabel – DRAFT, on the ledger item.
    expect(ring.attributes('aria-label')).toMatch(new RegExp(`^${expected}% built – ready W\\d+`))
    // And it sits on the painting, not in the text column: the ring's parent chain includes the
    // art band, which is what «в уголке картинки» means.
    expect(yacht.find('.shop-row-art .build-ring').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the order week reads 0, and a stale over-due row clamps at 100 – never past the circle', async () => {
    const fresh = await mountShop(orderedAt('r41-ring-0', 0))
    expect((await shelfRow(fresh, 'The yacht')).find('.build-ring b').text()).toBe('0')
    fresh.unmount()
    // Week surgery past the due date leaves readyWeek set (no tick ran to deliver) – the reading
    // must clamp, not print 128%. The real screen can meet this for one render on a load.
    const stale = await mountShop(orderedAt('r41-ring-over', 200))
    expect((await shelfRow(stale, 'The yacht')).find('.build-ring b').text()).toBe('100')
    stale.unmount()
  })

  it('⚠ the negative arm – no ring anywhere before the order, and none on an instant rung', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r41-ring-none')))
    // Nothing is ordered in this world, so no tile anywhere carries the ring…
    expect(wrapper.find('.build-ring').exists()).toBe(false)
    // …including the yacht's own tile, which has the art band and would be the first to lie.
    const yacht = await shelfRow(wrapper, 'The yacht')
    expect(yacht.find('.build-ring').exists()).toBe(false)
    wrapper.unmount()
  })
})
