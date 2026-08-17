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
import { WILD_CARD } from '../../src/engine/season/tournament'

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

// =================================================================================================
// ⭐⭐ THE WILD-CARD BADGE (round 21 #2b, 17.08) – MOUNTED, because a source pin would prove nothing
// =================================================================================================
//
// CLAUDE.md's gotcha in one line: "prefer a mounted test to a source pin". The claim this makes is
// about what the SCREEN renders for a given engine flag, and the flag is `UpcomingEvent.wildCard` –
// derived at snapshot time, set only when the acceptance list would have refused her. See
// docs/specs/the-wild-cards-2026-08.md and `WILD_CARD` in engine/season/tournament.ts.
//
// ⚠ NO DIALOG WAS ADDED OR LENGTHENED BY THIS ITEM, so no 375x667 fit assertion is owed here – the
// owner asked for a marker on the tournament card and that is the whole of the surface. The
// round-20 rule is about a popup outgrowing a phone; a pill inside `.controls` (which is
// `display: flex; flex-wrap: wrap`) wraps onto its own line instead of growing the card.
describe('SeasonScreen – the wild-card badge', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The snapshot with the engine's flag forced onto the first card, which is the only thing the
   *  screen is allowed to have an opinion about. */
  function withFlagOnFirstCard(flag: boolean) {
    const snapshot = snapshotAfter(8)
    expect(snapshot.upcoming.length).toBeGreaterThan(0)
    // ⚠ EVERY CARD, NOT THE FIRST. The first draft flagged `upcoming[0]` and rendered nothing: the
    // screen's `calendarRows` is a WEEK-keyed list and it does not necessarily lead with the first
    // row of `upcoming`, so "the first card" is a fact about the array and not about the screen.
    // Flagging the set and asserting "at least one" is the claim that is actually about rendering.
    const upcoming = snapshot.upcoming.map((e) => (flag ? { ...e, wildCard: true } : e))
    return { ...snapshot, upcoming }
  }

  it('says "wild card" on the card the engine flagged', () => {
    const wrapper = mountSeason(withFlagOnFirstCard(true))
    const badges = wrapper.findAll('.wildcard-chip')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0].text().toLowerCase()).toContain('wild card')
    wrapper.unmount()
  })

  it('says nothing at all when the engine did not flag it', () => {
    // ⚠ THE HALF THAT MAKES THE OTHER ONE MEAN SOMETHING. A badge that renders unconditionally would
    // pass the test above and be a lie on every card in the game.
    const wrapper = mountSeason(withFlagOnFirstCard(false))
    expect(wrapper.findAll('.wildcard-chip')).toHaveLength(0)
    expect(wrapper.text().toLowerCase()).not.toContain('wild card')
    wrapper.unmount()
  })

  it('explains itself in the engine own count, never a literal eight', () => {
    // The tooltip quotes `WILD_CARD.slots`, so a bench that sweeps the constant cannot leave a
    // sentence behind saying the old number. Read through the rendered attribute rather than the
    // source, which is what makes this a behaviour claim.
    const wrapper = mountSeason(withFlagOnFirstCard(true))
    const title = wrapper.find('.wildcard-chip').attributes('title') ?? ''
    expect(title).toContain(String(WILD_CARD.slots))
    expect(title.toLowerCase()).toContain('host nation')
    wrapper.unmount()
  })
})
