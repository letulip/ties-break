// ROUND 16 #18/#19 – THE TWO SURFACES THAT SAY SHE IS HURT, MOUNTED.
//
// Mounted rather than source-pinned on purpose (CLAUDE.md's own gotcha). The claim in both halves is
// about RENDERED COPY, and rendered copy is exactly what a source pin cannot check: the old box score
// really did contain the word "wins" and the real scoreline, and still told the owner nothing.
//
//   #18  the box score said **"Ines Duval wins 4-5"** on a retirement – a winner with fewer games
//        than the loser, no marker, no explanation – on the one screen whose whole job is to say what
//        happened. `result.retired` had been on the match since the retirement slice and no component
//        had ever read it.
//   #19  the injury popup has to say WHEN and WHY, and "why" now has two answers to tell apart,
//        because the retirement door is where 61% of injuries come in
//        (docs/specs/round16-injuries.md).
//
// ⚠ MUTATION-VERIFIED, and the counts are recorded because one of them is the interesting number.
// `retiredName` forced to null kills the retirement viewer test and correctly leaves the
// completed-match CONTROL green – which is what says the control is a control rather than a second
// copy of the same assertion. `circumstance` returning its off-court branch unconditionally kills
// both dialog retirement tests. Both mutations restored.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Both surfaces play a cue on mount; audio has no business in a copy test.
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { useGameStore } from '../../src/stores/game'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import { weekLabel } from '../../src/shared/dates'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { Snapshot } from '../../src/shared/protocol'

// =================================================================================================
// #19 – THE POPUP SAYS WHEN, AND WHY
// =================================================================================================

const INJURY = { kind: 'ankle strain', severity: 'moderate' as const, weeksRemaining: 5, totalWeeks: 5, sinceWeek: 40 }

/** The retirement row the dialog reads its circumstance off – the persisted match, exactly as
 *  `matchNews` writes it onto the event. */
function retirementEvent(over: Record<string, unknown> = {}) {
  return {
    id: 7,
    week: 40,
    type: 'match',
    text: 'R1: O. Smith retired against J. Novak 4-5',
    match: { round: 1, aId: KID_ID, bId: 'opp', winnerId: 'opp', score: '4-5', retiredId: KID_ID, oppName: 'Jana Novak' },
    ...over,
  }
}

function mountDialog(events: unknown[] = []) {
  const game = useGameStore()
  game.$patch({
    snapshot: { week: 40, ageYears: 16, careerId: 'c1', injury: { ...INJURY }, events } as unknown as Snapshot,
  })
  return mount(InjuryStopDialog)
}

describe('#19 – the injury popup says WHEN and WHY', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('names the injury, how bad it is, and how long she is out', () => {
    const w = mountDialog()
    const text = w.text()
    expect(text).toContain('ankle strain')
    expect(text).toContain('Moderate')
    expect(text).toContain('5 wks')
    w.unmount()
  })

  it('an ordinary layoff says it came on OFF court, and claims nothing more than that', () => {
    const w = mountDialog()
    const text = w.text()
    expect(text).toContain('Off court')
    // ⚠ THE NEGATIVE IS THE POINT. The engine records nothing about WHERE a weekly-roll injury
    // happened – it can land on a training week, a travel week, an arrival week or a family holiday
    // – so the dialog must not invent one. "She felt it in training" is the sentence this surface is
    // forbidden to write.
    expect(text).not.toContain('training')
    expect(text).not.toContain('mid-match')
    w.unmount()
  })

  it('a RETIREMENT says she stopped on court, names who she was playing, and keeps her round', () => {
    const w = mountDialog([retirementEvent()])
    const text = w.text()
    expect(text).toContain('She had to stop.')
    expect(text).toContain('On court')
    expect(text).toContain('Jana Novak')
    // The ruling of 10.08 in the one place a frightened parent will read it: the tournament is not
    // wiped, the round she had already reached is hers.
    expect(text).toContain('The round she had reached is hers')
    w.unmount()
  })

  it('a PRACTICE retirement is told apart from a tournament one – there is no round to keep', () => {
    const w = mountDialog([retirementEvent({ friendly: true })])
    const text = w.text()
    expect(text).toContain('practice match')
    expect(text).not.toContain('The round she had reached is hers')
    w.unmount()
  })

  it('an opponent RETIRING against her is not her injury, and must not colour this dialog', () => {
    // `retiredId && retiredId !== KID_ID` is the whole test for "her opponent stopped" – she won that
    // one. A dialog that matched on "a retirement happened this week" would tell her she stopped.
    const w = mountDialog([
      retirementEvent({ match: { round: 1, aId: KID_ID, bId: 'opp', winnerId: KID_ID, score: '6-4 2-1', retiredId: 'opp', oppName: 'Jana Novak' } }),
    ])
    const text = w.text()
    expect(text).toContain('Off court')
    expect(text).not.toContain('On court')
    w.unmount()
  })

  it('WHEN comes off the injury itself, not off "now"', () => {
    const game = useGameStore()
    game.$patch({
      snapshot: { week: 44, ageYears: 16, careerId: 'c1', injury: { ...INJURY, weeksRemaining: 1 }, events: [] } as unknown as Snapshot,
    })
    const w = mount(InjuryStopDialog)
    // Week 40 is the layoff's own week; week 44 is today. The kicker must date the INJURY, and the
    // two labels must differ or the assertion proves nothing.
    expect(weekLabel(40)).not.toBe(weekLabel(44))
    expect(w.find('.season-summary-kicker').text()).toContain(weekLabel(40))
    w.unmount()
  })
})

// =================================================================================================
// #18 – THE BOX SCORE SAYS SOMEBODY RETIRED
// =================================================================================================

function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** A pair with nothing left in the tank, played until one of them stops – the same construction
 *  tests/viz/commentary.test.ts uses, because a retirement is ~2.7% of matches and hoping for one in
 *  a fixture is how a test goes green having never taken the arm it is about. */
function retiredFixture() {
  const a = player({ id: 'a', name: 'Vera Novak', stamina: 10 })
  const b = player({ id: 'b', name: 'Ines Duval', stamina: 10 })
  for (let i = 0; i < 400; i++) {
    const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: `r16-boxscore-${i}` }
    const res = simulateMatch(a, b, opts)
    if (!res.retired) continue
    return { a, b, match: annotateMatch(res, a, b, opts) }
  }
  throw new Error('the fixture must actually produce a retirement')
}

function completedFixture() {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r16-boxscore-complete' }
  const res = simulateMatch(a, b, opts)
  expect(res.retired, 'the control fixture must NOT be a retirement').toBeUndefined()
  return { a, b, match: annotateMatch(res, a, b, opts) }
}

async function mountFinished(f: ReturnType<typeof retiredFixture>) {
  const w = mount(MatchViewer, {
    props: { match: f.match, playerA: f.a, playerB: f.b, surface: 'hard' as const, mode: 'replay' as const },
  })
  const skip = w.findAll('button').find((b) => b.text() === 'Skip to the result')!
  await skip.trigger('click')
  return w
}

describe('#18 – a match that ended in a retirement says so where the result is read', () => {
  it('the box score carries the sport’s marker AND a sentence, so "wins 4-5" cannot stand alone', async () => {
    const f = retiredFixture()
    const w = await mountFinished(f)
    const retiredName = f.match.result.retired!.side === 0 ? 'Vera Novak' : 'Ines Duval'
    expect(w.find('.mv-final').text()).toContain('ret.')
    expect(w.find('.mv-final-note').text()).toBe(`${retiredName} retired hurt.`)
    w.unmount()
  })

  it('...and a completed match carries neither, so the marker means something', async () => {
    const w = await mountFinished(completedFixture())
    expect(w.find('.mv-final').text()).not.toContain('ret.')
    expect(w.find('.mv-final-note').exists()).toBe(false)
    w.unmount()
  })
})
