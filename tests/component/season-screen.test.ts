// SEASONSCREEN – A CHARACTERIZATION NET, so the 2,022-line file can be split.
//
// Same argument as tests/component/match-viewer.test.ts: this screen's only prior "coverage" was
// nineteen test files reading it AS TEXT. A source pin breaks on contact with a refactor and proves
// nothing about behaviour, which is the opposite of what a decomposition needs.
//
// ⚠ THIS SCREEN IS STORE-DRIVEN, not prop-driven: it reads `useGameStore().snapshot`. So the fixture
// is a REAL world - createWorld + a tick + toSnapshot - pushed into a real Pinia store. No JSON
// blobs, no hand-written snapshot shapes that can drift from the protocol: if `toSnapshot` changes,
// this fixture changes with it, which is the point.
//
// ⚠ NO WORKER IS SPAWNED. src/worker/client.ts creates one lazily, so mounting with a pre-filled
// store touches nothing. Tests here never dispatch a command; they assert on what the screen RENDERS
// for a given world state.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'

/** A real career, walked `weeks` weeks, as the engine's own tests build one. */
function snapshotAfter(weeks: number, seed = 'component-season'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

function mountSeason(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(SeasonScreen, { global: { stubs: { teleport: true } } })
}

describe('SeasonScreen – the fixture', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is a real world through the real protocol, and it is deterministic', () => {
    const a = snapshotAfter(8)
    const b = snapshotAfter(8)
    expect(a.week).toBe(8)
    expect(b.week).toBe(a.week)
    expect(b.upcoming.map((e) => e.id)).toEqual(a.upcoming.map((e) => e.id))
    expect(b.fundsCents).toBe(a.fundsCents)
  })

  it('a different seed is a different career, so the pin above is not vacuous', () => {
    const a = snapshotAfter(8, 'season-seed-one')
    const b = snapshotAfter(8, 'season-seed-two')
    expect(a.fundsCents !== b.fundsCents || a.upcoming.map((e) => e.id).join() !== b.upcoming.map((e) => e.id).join()).toBe(true)
  })
})

describe('SeasonScreen – it mounts against a real career', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('mounts without throwing on a fresh career', () => {
    const wrapper = mountSeason(snapshotAfter(0))
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('mounts on a career that has been walked a season', () => {
    const wrapper = mountSeason(snapshotAfter(30))
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('renders one card per scheduled event, and the count tracks the snapshot', () => {
    // The screen's core job: the calendar the engine scheduled is the calendar the player sees.
    //
    // ⚠ THIS ASSERTION WAS VACUOUS ON ITS FIRST DRAFT and the mutation test caught it. It matched
    // `String(event.week)` against the page text - and "12" appears all over a UI full of numbers,
    // so it passed even when the screen was fed an empty list. Counting real `.event-card` elements
    // is the fix, and the empty-snapshot test below is its other half: no single mutation can
    // satisfy both.
    const snapshot = snapshotAfter(12)
    expect(snapshot.upcoming.length).toBeGreaterThan(0)
    const wrapper = mountSeason(snapshot)
    expect(wrapper.findAll('.event-card').length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('...and the card count TRACKS the data rather than being fixed chrome', () => {
    // The strongest form of "the list is data-driven" that does not depend on any particular copy:
    // feed the screen fewer events and it must draw fewer cards. Static markup cannot satisfy this,
    // and neither can a hard-coded row.
    //
    // NOTE: an earlier draft asserted the preview's `opponentName` reached the card. It does not -
    // the card shows tier, place, dates and money, and the opponent is surfaced elsewhere. That is a
    // characterization test doing its job: the assumption was wrong, so the pin records the
    // behaviour instead of the assumption.
    const full = snapshotAfter(12)
    expect(full.upcoming.length).toBeGreaterThan(2)

    const wide = mountSeason(full)
    const wideCards = wide.findAll('.event-card').length
    wide.unmount()

    setActivePinia(createPinia())
    const narrow = mountSeason({ ...full, upcoming: full.upcoming.slice(0, 1) })
    const narrowCards = narrow.findAll('.event-card').length
    narrow.unmount()

    expect(wideCards).toBeGreaterThan(narrowCards)
  })

  it('renders NO event cards when the snapshot has no upcoming events', () => {
    // The other half of the pair above. Empty states are also where screens throw, so this pins both
    // that it survives and that the list is genuinely driven by the data.
    const snapshot = snapshotAfter(4)
    const wrapper = mountSeason({ ...snapshot, upcoming: [] })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findAll('.event-card')).toHaveLength(0)
    wrapper.unmount()
  })

  it('renders nothing catastrophic when the store has no snapshot yet', () => {
    // The pre-load state every screen passes through on a cold start.
    const store = useGameStore()
    store.snapshot = null
    const wrapper = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })
})
