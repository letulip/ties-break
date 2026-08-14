// ⭐⭐ ROUND-20 #2 – THE INJURY REPORT'S "CANCELLED" ROW, AGAINST A REAL INJURY.
//
// Owner, 13.08: he was laid up across two weeks that each carried a tournament and the popup said
// nothing had been cancelled. Two separate faults were behind that, both reproduced below on REAL
// careers through the REAL engine rather than on hand-built snapshots – which is the whole point,
// because both faults are about the engine and the surface disagreeing.
//
//   (1) THE COUNT WAS BLIND. The row finds the layoff's withdrawals by their opening words, because
//       a `WorldEvent` carries no release reason. It matched `'Withdrew from '` – the one sentence
//       `releaseEntry` wrote until 05.08, when `releasedBy` split it so the desk's own action would
//       stop being reported as a receipt for a choice the player never made. The injury arm writes
//       `'Taken out of ...'`; the popup was never repointed, so from that day it could see only
//       withdrawals the PLAYER made. Measured here: a 9-week layoff releases two entries and refunds
//       both fees, and the pre-fix row rendered "Nothing".
//
//   (2) "NOTHING CANCELLED" IS NOT "NOTHING LOST", and the old fallback said the opposite of the
//       truth. `releaseEntry` refuses past the deadline, and lists close two weeks out – so a layoff
//       that lands on or near the event week cancels NOTHING and she stays on the list: fee
//       committed, no appearance, the week resolves as a walkover. The row answered that with
//       "Nothing – every entry stands". That is the shape he was in, twice running.
//
// ⚠ WHY THE FIXTURES ARE DRIVEN AND NOT WRITTEN. A hand-built `events: [{ text: 'Taken out of ...' }]`
// would assert this file's own spelling against the component's, and both could be wrong together –
// which is exactly the failure being fixed. `onsetInjury` is the engine's real onset path (the same
// one `rollInjury` calls); everything the row reads is written by it.
//
// ⚠ MUTATION-VERIFIED, each block naming what was broken to watch it fail:
//   * the filter put back to `startsWith('Withdrew from ')` -> "lists what the layoff cancelled" red,
//     on the shipped defect itself rather than on an invented one.
//   * the fallback restored to "every entry stands"          -> "says what it forfeited" red.
//   * the switch in `releaseEntry` made to write a literal that drifts from `RELEASE_LINE_PREFIX`
//                                                             -> "quotes the ENGINE's own sentence"
//     red, naming the drifted line. That is the mutation this file exists to catch, and it is the
//     one the old spelling-to-spelling arrangement could not.
//   ⚠ AND ONE MUTATION DELIBERATELY STAYS GREEN: RENAMING `RELEASE_LINE_PREFIX.injury` ITSELF.
//     Both sides read it, so both move together and the report keeps working - which is the whole
//     property being bought here, not a hole in the net. What must never pass again is the two sides
//     disagreeing, and that is the mutation above.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The dialog plays a cue on mount; audio has no business in a copy test (same shim as
// injury-surfacing.test.ts).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  toSnapshot,
  RELEASE_LINE_PREFIX,
} from '../../src/engine/world'
import { TIERS } from '../../src/engine/season/calendar'
import { onsetInjury } from '../../src/engine/world/injury'
import { BODY_REGIONS } from '../../src/engine/body'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

/** A real career, eight weeks in, with money so nothing below is really about bankruptcy. */
function base(seed: string) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  return world
}

/** ⚠ THE LAYOFF LENGTH IS SEARCHED FOR, NOT ASSERTED INTO EXISTENCE. `onsetInjury` draws severity
 *  and weeks-out off the stream it is handed, so a sub-stream seed is picked whose draw yields the
 *  length this test needs – the generator, the order and the arity are all untouched, and the injury
 *  that lands is one the engine could really have rolled. */
function seedForLayoff(world: WorldState, min: number): string {
  for (let i = 0; i < 400; i++) {
    const probe = JSON.parse(JSON.stringify(world)) as WorldState
    onsetInjury(probe, rngFromSeed(`layoff-probe:${i}`), 'week', BODY_REGIONS)
    if ((probe.injury?.totalWeeks ?? 0) >= min) return `layoff-probe:${i}`
  }
  throw new Error(`no draw produced a layoff of ${min}+ weeks`)
}

function enterable(world: WorldState, from: number, to: number) {
  return world.season
    .filter(
      (e) =>
        e.week > from &&
        e.week <= to &&
        e.deadlineWeek >= world.week &&
        entryStatus(world, e).level !== 'blocked',
    )
    .sort((a, b) => a.week - b.week)
}

/** A career entered for two tournaments on CONSECUTIVE weeks, ticked to the first of them – so both
 *  lists have closed and neither week has resolved. The seed is searched for rather than asserted:
 *  which rungs a calendar puts side by side is the calendar's business, and pinning a seed to it
 *  would make this test break on a calendar change that has nothing to do with injuries. */
function consecutivePair() {
  for (let s = 0; s < 30; s++) {
    const state = base(`closed-lists-${s}`)
    const options = enterable(state, state.week + 2, state.week + 20)
    const first = options.find((a) => options.some((b) => b.week === a.week + 1))
    if (!first) continue
    const second = options.find((b) => b.week === first.week + 1)!
    enterEvent(state, first.id)
    enterEvent(state, second.id)
    const rng = rngFromSeed(state.seed)
    let ok = true
    while (state.week < first.week) {
      state.fundsCents = Math.max(state.fundsCents, 200_000_00)
      tickWeek(state, rng)
      if (state.week === first.week) break // arrived: the arrival beat itself is the state we want
      // Anything that resolves an entry early, or hurts her on the way, changes the shape under
      // test rather than reproducing it - try another seed.
      if (state.pendingTournament || state.entries.length !== 2 || state.injury) {
        ok = false
        break
      }
    }
    if (ok && state.week === first.week && state.entries.length === 2 && !state.injury) {
      return { state, pair: { first, second } }
    }
  }
  throw new Error('no seed produced two entered tournaments on consecutive weeks')
}

function mountReport(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(InjuryStopDialog)
}

/** The Cancelled cell: the row is found by its heading, so the assertions below are about the
 *  answer rather than about where it happens to sit in the table. */
function cancelledCell(w: ReturnType<typeof mount>): string {
  const row = w.findAll('tr').find((tr) => tr.find('th').text() === 'Cancelled')
  expect(row, 'the report still has a Cancelled row').toBeTruthy()
  return row!.find('td').text()
}

describe('⭐⭐ round-20 #2 (1) – the layoff DID cancel entries, and the row could not see them', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lists what the layoff cancelled, and the fees that came back with it', () => {
    const world = base('cancelled-open')
    const wk = world.week
    // Two events far enough out that their lists are still open when the injury lands.
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    expect(open.length, 'two enterable events with open lists').toBe(2)
    for (const e of open) enterEvent(world, e.id)

    // A layoff long enough to swallow both of them.
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)

    // THE ENGINE'S SIDE, asserted before the screen's, so a green run cannot mean "nothing happened".
    const rows = world.events.filter((e) => e.week === wk && e.type === 'entry')
    const released = rows.filter((e) => e.text.startsWith(RELEASE_LINE_PREFIX.injury))
    expect(released.length, 'the engine released both entries').toBe(2)
    expect(world.entries.length, 'and she holds neither any more').toBe(0)
    const refunds = world.events.filter((e) => e.week === wk && e.text.startsWith('Entry refunded'))
    expect(refunds.length, 'both fees came back').toBe(2)

    // ...AND THE SCREEN'S. This is the assertion the shipped popup failed.
    const w = mountReport(toSnapshot(world))
    const cell = cancelledCell(w)
    expect(cell, 'the report no longer claims nothing happened').not.toContain('Nothing')
    for (const e of open) expect(cell, `${e.tier} is named`).toContain(TIERS[e.tier].label)
    expect(cell.match(/Withdrawn:/g)?.length, 'one line per cancelled entry').toBe(2)
    expect(cell, 'and the money is on the row').toMatch(/Fees refunded: \+/)
    // The reason clause belongs to the news feed, not to a cell already headed "Cancelled".
    expect(cell).not.toContain('she is not fit for that week')
    w.unmount()
  })

  it('⚠ the row quotes the ENGINE\'s own sentence – the prefix is one definition, not two', () => {
    // The property the shared constant buys. If these two ever disagree again the report goes quiet
    // rather than wrong, which is why this is asserted directly instead of inferred from the copy.
    const world = base('prefix-agree')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 1)
    expect(open.length).toBe(1)
    enterEvent(world, open[0].id)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)

    // ⚠ FOUND WITHOUT THE PREFIX, or this assertion would be reading its own answer back: the entry
    // rows this week are the `Entered ...` one `enterEvent` wrote and the release the injury wrote.
    const line = world.events.find(
      (e) => e.week === wk && e.type === 'entry' && !e.text.startsWith('Entered '),
    )
    expect(line, 'the engine wrote a release row').toBeTruthy()
    expect(line!.text.startsWith(RELEASE_LINE_PREFIX.injury), line!.text).toBe(true)

    const w = mountReport(toSnapshot(world))
    // Whatever the sentence is, the SCREEN carries the part of it that names the event.
    const named = line!.text.slice(RELEASE_LINE_PREFIX.injury.length).replace(/,.*$/, '')
    expect(cancelledCell(w)).toContain(named)
    w.unmount()
  })
})

describe('⭐⭐ round-20 #2 (2) – nothing was cancelled, and something was still lost', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('says what it FORFEITED when the lists had already closed – his own shape', () => {
    // ⚠ TWO TOURNAMENTS ON CONSECUTIVE WEEKS, which is his report word for word, and it is also the
    // ONLY arrangement in which both lists can be shut with neither week played: lists close two
    // weeks out, so `deadline(N+1) = N - 1` and the one week that is past both deadlines and not yet
    // finished is week N itself. That is why he saw it twice running rather than once.
    const world = consecutivePair()
    const { first, second } = world.pair
    const wk = world.state.week
    expect(wk, 'the first list has shut').toBeGreaterThan(first.deadlineWeek)
    expect(wk, 'and so has the second').toBeGreaterThan(second.deadlineWeek)
    expect(second.week, 'consecutive weeks, as he described').toBe(first.week + 1)

    onsetInjury(world.state, rngFromSeed(seedForLayoff(world.state, 3)), 'week', BODY_REGIONS)
    expect(
      world.state.events.filter((e) => e.week === wk && e.text.startsWith(RELEASE_LINE_PREFIX.injury))
        .length,
      'the engine cancelled nothing – there was nothing it was allowed to cancel',
    ).toBe(0)
    expect(world.state.entries.length, 'and she is still on both lists').toBe(2)

    const w = mountReport(toSnapshot(world.state))
    const cell = cancelledCell(w)
    expect(cell, 'it still answers the question honestly').toContain('Nothing')
    expect(cell, '...but never with the sentence that was backwards').not.toContain('every entry stands')
    expect(cell, 'the lists are named as the reason').toContain('closed')
    expect(cell, 'and what it actually costs her is on the row').toContain('Forfeited:')
    // The one the LOOK-AHEAD can see. `upcoming` starts at week+1, so the event on the injury's own
    // week is not on this row - App.vue's `walkover` stop reason is the surface for that one, and
    // claiming it here would be this file inventing a fact the snapshot does not carry.
    expect(cell).toContain(TIERS[second.tier].label)
    w.unmount()
  })

  it('a layoff that reaches nothing she holds says exactly that, and nothing more', () => {
    // The genuinely empty case, and the control that keeps the two above from being vacuous: no
    // entries at all, so there is nothing to cancel and nothing to forfeit.
    const world = base('no-entries')
    expect(world.entries.length).toBe(0)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 3)), 'week', BODY_REGIONS)

    const w = mountReport(toSnapshot(world))
    const cell = cancelledCell(w)
    expect(cell).toContain('Nothing')
    expect(cell).not.toContain('Withdrawn:')
    expect(cell).not.toContain('Forfeited:')
    w.unmount()
  })
})
