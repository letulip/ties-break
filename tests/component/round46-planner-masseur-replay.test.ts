// =================================================================================================
// ROUND 46 R1 – THE PLANNER SHEET'S PRACTICE LOCK follows the masseur's replay for the played week
// =================================================================================================
//
// The owner, 06.10: «прогнозные ладно еще, но вот показывать injured когда уже здорова – это не ок и
// вводит в заблуждение.» B2 gave the home verdict and the Calendar the played week's replay (round 46
// #16); the planner sheet still asked the CLINIC's number, so for the owner's state – two weeks on the
// plaque, the daily masseur buying the last one back at the next tick – the Practice tab said «Injured»
// for a week the tick clears her for.
//
// ⚠ MOUNTED, NOT PINNED. The engine half (the gate, `assertPlannable`, `layoffBlock`, the injury report
// against the tick, 54 cells) lives in tests/round46-arrival-masseur-parity.test.ts. What only a mount can
// say is that the rows the OWNER SEES – the Book control's label and the layoff paragraph – say what the
// tick will do. ⚠ AND THE FENCE IS HERE TOO: a forecast week (two or more ticks out) keeps the clinic's
// lock, because the owner's own word on those is «ладно ещё».
//
// Mutation-verified (see the ledger): switch the replay off in `layoffCoversWeekAsPlayed` and the first
// arm reds; widen it to every week and the third does.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

const PLAYED_WEEK = 11

/** B2's owner state, built the same way: week 10, a layoff WRITTEN rather than rolled, the masseur on a
 *  rung (or nobody). No entry and no event on the week, so the sheet is a plain training week and the
 *  only thing that can lock its Practice tab is the layoff. */
function injuredWorld(c: { weeksRemaining: number; totalWeeks: number; rehabWeekAtTick: number; sessions: number | null }): WorldState {
  const world = createWorld('r46-planner-replay', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = PLAYED_WEEK - 1
  world.physioActive = false
  world.condition = 100
  world.fundsCents = 1_000_000_00
  world.entries = []
  world.masseurHired = c.sessions !== null
  if (c.sessions !== null) world.masseurSessionsPerWeek = c.sessions
  world.injury = {
    kind: 'ankle sprain',
    severity: 'moderate',
    weeksRemaining: c.weeksRemaining,
    totalWeeks: c.totalWeeks,
    sinceWeek: PLAYED_WEEK - c.rehabWeekAtTick,
  }
  return world
}

function mountSheet(world: WorldState, week: number) {
  const store = useGameStore()
  store.snapshot = toSnapshot(world)
  return mount(PlanWeekSheet, { props: { week, initialTab: 'practice' as const } })
}

/** The Book control, whatever it currently says – its label is the sheet's own verdict on the week. */
function bookControl(w: ReturnType<typeof mountSheet>) {
  return w.findAll('button').find((b) => /Injured|Not cleared to play|Book anyway|Book the match/.test(b.text()))
}

describe('⭐⭐ round 46 R1 – the planner sheet\'s Practice lock tells the tick\'s story for the played week', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ THE OWNER\'S STATE: clinic says two weeks, the daily masseur buys one back – the played week\'s friendly is bookable and the sheet does not say injured', () => {
    const world = injuredWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: 7 })
    const w = mountSheet(world, PLAYED_WEEK)
    // Both halves of the state, so a change that removes either fails HERE rather than making the arm vacuous.
    expect(useGameStore().snapshot?.injury?.weeksRemaining, 'the plaque keeps the clinic\'s number – round 34').toBe(2)
    expect(useGameStore().snapshot?.injury?.expectedWeeks, 'and the wire carries the tick\'s – round 41').toBe(1)
    const book = bookControl(w)
    expect(book, 'the sheet renders a Book control').toBeTruthy()
    expect(book!.text(), 'the Book control').toContain('Book the match')
    expect(book!.text()).not.toContain('Injured')
    expect(w.text(), 'and no layoff paragraph: she is fit when the week is played').not.toContain('A friendly is still a match')
    w.unmount()
  })

  it('⚠ CONTROL – no masseur: the same layoff still locks the played week, and the paragraph says why', () => {
    const world = injuredWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: null })
    const w = mountSheet(world, PLAYED_WEEK)
    expect(useGameStore().snapshot?.injury?.expectedWeeks, 'nobody buys a week back').toBeUndefined()
    const book = bookControl(w)
    expect(book!.text()).toContain('Injured')
    expect(book!.attributes('disabled'), 'a lock is a disabled control').toBeDefined()
    expect(w.text()).toContain('A friendly is still a match')
    w.unmount()
  })

  it('⚠ SCOPE FENCE – a forecast week keeps the clinic\'s lock though the replay would clear her a week earlier', () => {
    // Daily rung, six weeks left: the clinic window is [10, 16), his replay clears her at the top of 13.
    // Week 14 is out on the clinic's reading and NOT on his – and it stays locked: it is a FORECAST (the
    // parent can still fire him), and widening the replay to it would read `14 < 10 + 3` = false.
    const world = injuredWorld({ weeksRemaining: 6, totalWeeks: 9, rehabWeekAtTick: 3, sessions: 7 })
    expect(toSnapshot(world).injury?.expectedWeeks, 'the replay says back at 13').toBe(3)
    const w = mountSheet(world, 14)
    const book = bookControl(w)
    expect(book!.text()).toContain('Injured')
    expect(book!.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('A friendly is still a match')
    w.unmount()
  })
})
