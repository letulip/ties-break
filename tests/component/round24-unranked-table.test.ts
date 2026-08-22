// =================================================================================================
// ROUND 24 #4, MOUNTED – the standings column that printed a place on a table nobody was ranked in
// =================================================================================================
//
// `LadderView.rank` has been nullable since the two-ladders wave, so the TILE at the top of Stats has
// always said "Unranked" honestly. The table underneath it prints `r.rank` for every row, and on a
// table where nobody has scored that printed a place for all two hundred of them – the owner's «world
// number one», one line under a tile saying she was not ranked at all.
//
// The engine half of the fix is in `assignCompetitionRanks` (an all-zero table now sends every row to
// the bottom of itself, so the column would say 200 rather than 1). That is the right NUMBER and still
// the wrong WORD: a rank is a statement about who is ahead of whom, and on this table there is nobody
// to be ahead of. A dash, exactly as the age column beside it does for a fact it does not have.
//
// ⚠ WHY MOUNTED. The claim is about what the player SEES, and it is a claim about two files agreeing:
// `computeStandings` always includes the top of the table in its window (top 10 + a window around
// her), so the screen can read "nobody in this table has scored" off the rows it was handed without
// re-deriving anything. A source pin cannot tell that from a lucky slice.
//
// ⚠ MUTATION-VERIFIED – the arms are listed in the report; each was watched failing.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The screen's dialogs prime audio on mount; sound has no business in a table test.
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, recomputeKidRank, toSnapshot, tableSize, type WorldState } from '../../src/engine/world'
import { cohortIds } from '../../src/engine/world/ladder'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A career whose junior window has emptied – the state the college freeze left behind. */
function emptiedWorld(): WorldState {
  const world = createWorld('round24-stats', DEFAULT_PROFILE) as WorldState
  world.results = []
  recomputeKidRank(world)
  return world
}

function mountStats(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(StatsScreen, { global: { stubs: { teleport: true } } })
}

async function showTrack(wrapper: ReturnType<typeof mountStats>, label: string): Promise<void> {
  const button = wrapper.findAll('button').find((b) => b.text().trim() === label)
  expect(button, `the ${label} pill must exist`).toBeTruthy()
  await button!.trigger('click')
}

/** The standings table's rank column, one string per row, found BY NAME (D8). */
function rankColumn(wrapper: ReturnType<typeof mountStats>, label: string): string[] {
  const table = wrapper.findAll('table').find((t) => t.attributes('aria-label') === `${label} ranking`)
  expect(table, `the ${label} standings must be findable by name`).toBeTruthy()
  return table!
    .findAll('tbody tr')
    .filter((tr) => !tr.classes('standings-gap'))
    .map((tr) => tr.findAll('td')[0].text().trim())
}

describe('round 24 #4 – an unranked table does not render a number', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('THE OWNER\'S SCREEN: nobody has scored, so no row prints a place', async () => {
    const world = emptiedWorld()
    const wrapper = mountStats(toSnapshot(world))
    await showTrack(wrapper, 'International')
    const column = rankColumn(wrapper, 'International')
    expect(column.length).toBeGreaterThan(0)
    expect(column.every((c) => c === '–')).toBe(true)
    // The two numbers it must never print: the tie floor's "1" (the defect) and the bottom of the
    // table (the honest engine value, which is still the wrong word for "not ranked").
    expect(column).not.toContain('1')
    expect(column).not.toContain(String(tableSize(world, 'itf')))
  })

  it('...and the tile above it already said so – the two now agree', async () => {
    const wrapper = mountStats(toSnapshot(emptiedWorld()))
    await showTrack(wrapper, 'International')
    expect(wrapper.text()).toContain('Unranked')
    expect(wrapper.text()).not.toContain('#1')
  })

  it('ONE rival with a point and the column is a ranking again – the rule is inert', async () => {
    const world = emptiedWorld()
    world.results = [{ playerId: cohortIds(world)[0], week: world.week, points: 100, tier: 'j30' }]
    recomputeKidRank(world)
    const wrapper = mountStats(toSnapshot(world))
    await showTrack(wrapper, 'International')
    const column = rankColumn(wrapper, 'International')
    expect(column[0]).toBe('1')
    expect(column.filter((c) => c === '–')).toHaveLength(0)
    // She has still not scored, so HER line is still "Unranked" – the per-player rule is a different
    // and finer one than the table's, and it did not move.
    expect(wrapper.text()).toContain('Unranked')
  })

  it('⚠ THE DEPENDENCY: the standings window always carries the top of the table', async () => {
    // The screen reads "nobody here has scored" off the rows it was handed. That is only equal to
    // "nobody in the table has scored" because `computeStandings` always includes index 0, and the
    // table is sorted points-descending. Pinned here so a future windowing change cannot quietly make
    // the screen's question a different one.
    const world = emptiedWorld()
    world.results = [{ playerId: cohortIds(world)[0], week: world.week, points: 100, tier: 'j30' }]
    recomputeKidRank(world)
    const standings = toSnapshot(world).ladders.itf.standings
    expect(standings[0].points).toBe(100)
    expect(standings[0].rank).toBe(1)
  })
})
