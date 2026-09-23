// WAVE 12, T3 – THE DIVORCE'S ALBUM LINE, MOUNTED.
//
// `docs/specs/the-parting-2026-09.md` §5, his «можно» of 23.09. The album keeps one line for a
// marriage that ended, and the line settles nothing.
//
// ⚠⚠ MOUNTED AND NOT SOURCE-PINNED, and the scroll is built by the ENGINE rather than typed here –
// which is what makes this a test rather than a photograph of a literal. The world is posed, the
// branch is run, `buildScroll` is asked, and the screen renders what it is handed. A label typed
// into this file would have gone green against an invention.
//
// ⚠ THE MUTATION ARM IS RECORDED AT THE FOOT OF THE FILE with its measured count.

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { buildScroll, createWorld, kidAgeExact, rollEnds, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import type { AlbumPage, EndingView, LoveEpisode, ScrollSeason, Snapshot } from '../../src/shared/protocol'
import '../../src/style.css'

const WEDDING = ECONOMY.wedding

/** A career whose marriage ends on the week it is parked at – posed, then run through the real
 *  branch, so the scroll below is the engine's own. ⚠ The latch is written straight onto the row
 *  rather than walked to: `tests/wave12-parting.test.ts` §C is where the walk lives, and repeating
 *  it here would buy a slow test the same claim. */
function careerWithADivorce(seed: string): WorldState {
  const world = createWorld(seed)
  world.season = []
  let adult = 0
  while (kidAgeExact(adult, world.profile.birthMonth, world.profile.birthDay) < WEDDING.ageGate) adult++
  const row: LoveEpisode = {
    id: 'p:1', sinceWeek: adult - WEDDING.minEpisodeWeeks, endedWeek: null, knownWeek: adult - 100,
    wants: 'open', partnerId: 'p:1', publicWeek: null, publicWrong: false,
    airedMetWeek: null, airedEndedWeek: null, latchedWeek: adult - 20, partnerName: 'Mateo',
  }
  world.loveEpisodes = [row]
  world.lifeLog = [{ week: adult - 100, kind: 'met', detail: 'p:1', answer: 'wary' }]
  world.week = adult
  // force the ending: this file is about what the album SHOWS, not about when the dice land.
  rollEnds({ ...world, week: adult } as WorldState)
  world.loveEpisodes[0].endedWeek = adult
  world.milestones.push({ type: 'divorce', week: adult, kind: 'p:1' })
  return world
}

function albumPage(slot: number): AlbumPage {
  return {
    slot, why: `why ${slot}`, caption: `caption ${slot}`, fact: `fact ${slot}`,
    week: 52 * slot, seasonIndex: slot, stage: 'teen', emotion: 'norm',
  } as AlbumPage
}

function viewWith(scroll: ScrollSeason[]): EndingView {
  return {
    ending: { type: 'stopped', week: 265, ageYears: 19, detail: 'she stopped', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
    scroll,
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: { earnedCents: 10000, spentCents: 5000000, prizeCents: 0, weeksLostToInjury: 0 },
    money: moneyOf({ earnedCents: 10000, spentCents: 5000000, prizeCents: 0, weeksLostToInjury: 0 }),
    seasonsPlayed: 5, bestRank: 88, bestRankTrack: 'wta', titles: 2, oneMoreYearCount: 0,
    academy: null, lifetimeDeal: null, college: null, dynasty: dynastyOf(),
  } as EndingView
}

/** Mount the epilogue and OPEN THE RECORD, because the scroll is behind a door: `scrollOpen` starts
 *  `false` and «The whole record» is the button that turns it. ⚠ Measured rather than assumed – the
 *  first draft asserted against the closed screen and read the album's seven pages instead. */
async function mountWith(scroll: ScrollSeason[]) {
  const store = useGameStore()
  store.snapshot = { ending: viewWith(scroll) } as unknown as Snapshot
  const w = mount(EndingScreen, { attachTo: document.body })
  // ⚠ THE DOOR IS ON THE **LAST** PAGE – the album is seven pages turned one at a time and the
  // record's link lives on the foot of the seventh. `tests/component/endings-ui.test.ts` walks it
  // the same way; measured rather than assumed, because the first draft looked for the button on
  // page one and found nothing.
  for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
  const open = w.findAll('.ending-link').find((b) => b.text() === 'The whole record')
  expect(open, 'the door to the record is on the last page').toBeDefined()
  await open!.trigger('click')
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('wave 12 T3 – the divorce on the album’s record', () => {
  it('⭐⭐⭐ the engine builds the row and the screen renders its label', async () => {
    const scroll = buildScroll(careerWithADivorce('w12-album-mount'))
    const labels = scroll.flatMap((s) => s.rows).map((r) => r.label)
    expect(labels, 'the engine put the line on the scroll').toContain('The marriage ended')
    const w = await mountWith(scroll)
    expect(w.text(), 'and the screen draws it').toContain('The marriage ended')
  })

  it('⭐⭐ the line settles nothing – no name, no fault, no duration, no money on the row', async () => {
    // ⚠ THE ASSERTION IS THE ABSENCE, and the absences are the spec's §5 («the album does not settle
    // who was right») made checkable. The husband's name is ON the episode – the fixture gives him
    // one – so a row that reached for it would have found something.
    const world = careerWithADivorce('w12-album-neutral')
    const row = buildScroll(world).flatMap((s) => s.rows).find((r) => r.label === 'The marriage ended')!
    expect(row.detail ?? null, 'no detail cell at all').toBeNull()
    const rendered = (await mountWith(buildScroll(world))).text()
    for (const forbidden of ['Mateo', 'p:1', 'fault', 'years']) {
      expect(rendered.includes(forbidden), `the record never says "${forbidden}"`).toBe(false)
    }
  })

  it('⭐⭐ two marriages leave two rows, not one', () => {
    const world = careerWithADivorce('w12-album-two')
    world.milestones.push({ type: 'divorce', week: world.week + 300, kind: 'p:2' })
    const rows = buildScroll(world).flatMap((s) => s.rows).filter((r) => r.label === 'The marriage ended')
    expect(rows, 'the identity is the episode, so the second one is its own line').toHaveLength(2)
  })
})

// =================================================================================================
// THE MUTATION ARM – measured, not predicted
// =================================================================================================
//
// Scope: this file alone (3 cases), control GREEN first, the arm applied by a scripted string edit
// and undone by the inverse.
//
//   ARM  `SCROLL_LABEL.divorce` blanked to `''` in src/engine/world/album.ts   3 RED (all of them),
//                                                                             control green before
//                                                                             and after the revert.
//                                                                             ⭐ All three, including
//                                                                             the two-marriages case,
//                                                                             because every one of
//                                                                             them finds its row BY
//                                                                             THE LABEL – which is
//                                                                             what «pin what the
//                                                                             string IS» buys.
