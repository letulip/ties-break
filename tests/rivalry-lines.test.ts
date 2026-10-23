// ⭐ ROUND 53 · STEP 6 – RIVALS IN THE COMMENTARY (round 17 #22, the owner's «добавим что недорого», 21.10).
//
// THREE HALVES, AND THE THIRD IS THE ONE THAT MATTERS: the engine counts the record (A), the lines say
// it (B), and EVERY LINE'S CLAIM IS TRUE OF THE RECORD IT WAS CHOSEN FOR (C). The claim table below is
// written HERE, in the test, from what each sentence MEANS – not read back off the `holds` it is
// checking – so a line whose predicate lies (says «has never beaten» when she has) is chosen by the
// grid and then refused by the table.
//
// ⚠ MUTATION-VERIFIED, each naming what was broken to watch it fail:
//   * `pre-never-beaten`.holds -> `r.wins <= 1 && r.meetings >= 2`      -> C's grid goes red (a 1-win record is told «never»).
//   * `pre-lost-last`.holds -> `true`                                  -> C's grid goes red on every record she won last.
//   * headToHead: drop the `friendly` skip                            -> A's practice arm goes red.
//   * headToHead: compare `oppName` without `formatShortName`         -> A's «found by the short spelling» arm goes red.
//   * `buildCommentary` ignores `rivalry`                              -> D's «exactly one beat» arm goes red.
//   * (the `taken` guard in `buildCommentary` was mutated too, 60 seeds: NO red – a changeover's first point
//     is never another beat's anchor on these fixtures, so D's «every control beat survives» arm is a
//     tripwire for the day it is, not a proof the guard works. Said here rather than claimed.)
import { describe, expect, it } from 'vitest'
import { createWorld } from '../src/engine/world'
import { headToHead } from '../src/engine/world/headToHead'
import { RIVALRY_IN, RIVALRY_PRE, rivalryInLines, rivalryPreLine } from '../src/viz/rivalry'
import { buildCommentary, type Beat } from '../src/viz/commentary'
import { buildPreview, type PreviewInput } from '../src/viz/preview'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import type { MatchOptions, MatchPlayer } from '../src/engine/match/types'
import type { HeadToHead } from '../src/shared/protocol/competition'
import type { WorldEvent } from '../src/shared/protocol/events'

// ---------------------------------------------------------------------------------------------
// A. THE COUNT
// ---------------------------------------------------------------------------------------------
const P = (id: string, name: string): MatchPlayer => ({ id, name, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 })

function row(id: number, week: number, opp: string, won: boolean, over: { score?: string; friendly?: boolean; eventId?: string; retired?: boolean } = {}): WorldEvent {
  return {
    id,
    week,
    type: 'match',
    text: 'x',
    ...(over.friendly ? { friendly: true } : {}),
    match: {
      round: 0,
      aId: 'kid',
      bId: 'opp',
      winnerId: won ? 'kid' : 'opp',
      score: over.score ?? '6-4 3-6 7-6',
      ...(over.retired ? { retiredId: 'opp' } : {}),
      eventId: over.eventId ?? `ev-${id}`,
      surface: 'hard',
      oppName: opp,
      a: P('kid', 'Kid'),
      b: P('opp', opp),
    },
  } as WorldEvent
}

function worldWith(events: WorldEvent[], week = 60) {
  const w = createWorld('h2h-unit')
  w.week = week
  w.events = events
  return w
}

describe('A · headToHead counts the feed', () => {
  it('three meetings, one win, the last one lost -> the numbers', () => {
    const w = worldWith([
      row(1, 5, 'Mia Novak', true, { score: '6-2 6-3' }),
      row(2, 30, 'Mia Novak', false, { score: '3-6 6-4 4-6' }),
      row(3, 50, 'Mia Novak', false, { score: '2-6 4-6' }),
      row(4, 51, 'Ines Duval', true),
    ])
    expect(headToHead(w, 'M. Novak')).toEqual({ meetings: 3, wins: 1, losses: 2, lastWeek: 50, lastWon: false, lastSets: 2, recent: 2 })
  })

  it('no meetings -> null; a spelling that differs at all -> null (exact short-name match)', () => {
    const w = worldWith([row(1, 10, 'Mia Novak', true)])
    expect(headToHead(w, 'I. Duval')).toBeNull()
    expect(headToHead(w, 'M Novak')).toBeNull()
    expect(headToHead(w, 'm. novak')).toBeNull()
    expect(headToHead(w, 'M. Novak')).not.toBeNull()
    expect(headToHead(worldWith([]), 'M. Novak')).toBeNull()
  })

  it('a practice row is not a meeting, and the tournament on deck is skipped', () => {
    const w = worldWith([row(1, 10, 'Mia Novak', true, { friendly: true }), row(2, 20, 'Mia Novak', false, { eventId: 'now' })])
    expect(headToHead(w, 'M. Novak')?.meetings).toBe(1)
    expect(headToHead(w, 'M. Novak', 'now')).toBeNull()
  })

  it('a retirement says nothing about the sets, and the window is a rolling 52 weeks', () => {
    const w = worldWith([row(1, 5, 'Mia Novak', true), row(2, 55, 'Mia Novak', true, { score: '6-1 2-0', retired: true })], 60)
    expect(headToHead(w, 'M. Novak')).toMatchObject({ lastSets: null, lastWon: true, recent: 1 })
  })
})

// ---------------------------------------------------------------------------------------------
// B/C. THE LINES, AND THE CLAIM EACH ONE MAKES
// ---------------------------------------------------------------------------------------------
/** What each sentence MEANS, stated from its words and not from its `holds`. */
const CLAIM: Record<string, (r: HeadToHead) => boolean> = {
  'pre-never-beaten': (r) => r.meetings >= 2 && r.losses === r.meetings, // «have met N times, and she has won every one»
  'pre-third-in-a-year': (r) => r.recent === 2, // this is the third meeting inside a year
  'pre-won-every': (r) => r.meetings >= 2 && r.wins === r.meetings,
  'pre-lost-last': (r) => r.lastWon === false,
  'pre-won-last': (r) => r.lastWon === true,
  'in-three-sets': (r) => r.lastSets === 3,
  'in-straight-sets': (r) => r.lastSets === 2,
  'in-split-record': (r) => r.wins >= 1 && r.losses >= 1,
  'in-met-often': (r) => r.recent >= 3,
}

/** every record the engine could produce for 1-5 meetings */
function allRecords(): HeadToHead[] {
  const out: HeadToHead[] = []
  for (let meetings = 1; meetings <= 5; meetings++)
    for (let wins = 0; wins <= meetings; wins++)
      for (const lastWon of [true, false]) {
        if (wins === 0 && lastWon) continue
        if (wins === meetings && !lastWon) continue
        for (let recent = 0; recent <= Math.min(meetings, 4); recent++)
          for (const lastSets of [null, 2, 3]) out.push({ meetings, wins, losses: meetings - wins, lastWeek: 40, lastWon, lastSets, recent })
      }
  return out
}

describe('B/C · every line is true of the record it is chosen for', () => {
  it('the claim table covers exactly the lines that exist', () => {
    expect([...RIVALRY_PRE, ...RIVALRY_IN].map((l) => l.id).sort()).toEqual(Object.keys(CLAIM).sort())
    expect(RIVALRY_PRE.length + RIVALRY_IN.length).toBe(9)
  })

  it('across the whole grid: a record gets exactly one pre-match line, and its claim holds', () => {
    const grid = allRecords()
    expect(grid.length).toBeGreaterThan(100)
    for (const r of grid) {
      const said = rivalryPreLine('Vera', 'Ines', r)
      expect(said, JSON.stringify(r)).not.toBeNull()
      expect(CLAIM[said!.id](r), `${said!.id} on ${JSON.stringify(r)}`).toBe(true)
    }
  })

  it('across the whole grid: every in-match remark on offer is true, and no true remark is hidden', () => {
    for (const r of allRecords()) {
      const offered = rivalryInLines(r).map((l) => l.id)
      for (const id of offered) expect(CLAIM[id](r), `${id} on ${JSON.stringify(r)}`).toBe(true)
      for (const l of RIVALRY_IN) expect(offered.includes(l.id), `${l.id} on ${JSON.stringify(r)}`).toBe(CLAIM[l.id](r))
    }
  })

  it('every line is reachable, and the words carry the numbers the predicate used', () => {
    const grid = allRecords()
    for (const l of RIVALRY_PRE) {
      const r = grid.find((g) => rivalryPreLine('Vera', 'Ines', g)?.id === l.id)
      expect(r, `${l.id} is never chosen`).toBeDefined()
    }
    for (const l of RIVALRY_IN) expect(grid.some((g) => l.holds(g)), `${l.id} never holds`).toBe(true)
    const never = rivalryPreLine('Vera', 'Ines', { meetings: 3, wins: 0, losses: 3, lastWeek: 1, lastWon: false, lastSets: 2, recent: 1 })
    expect(never?.line.text).toBe('Vera and Ines have met 3 times, and Ines has won every one.')
    const split = RIVALRY_IN.find((l) => l.id === 'in-split-record')!.say('Vera', 'Ines', { meetings: 3, wins: 2, losses: 1, lastWeek: 1, lastWon: true, lastSets: 3, recent: 1 })
    expect(split.text).toBe('Coming in, the head-to-head reads Vera 2, Ines 1.')
    const often = RIVALRY_IN.find((l) => l.id === 'in-met-often')!.say('Vera', 'Ines', { meetings: 4, wins: 2, losses: 2, lastWeek: 1, lastWon: true, lastSets: 3, recent: 4 })
    expect(often.text).toBe('Vera and Ines have already met 4 times in the past year.')
  })

  it('never met, or no record -> nothing', () => {
    expect(rivalryPreLine('Vera', 'Ines', null)).toBeNull()
    expect(rivalryPreLine('Vera', 'Ines', undefined)).toBeNull()
    expect(rivalryInLines(null)).toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------
// D. THE COMMENTARY AND THE PREVIEW CARRY IT, AND ONLY WHEN GIVEN
// ---------------------------------------------------------------------------------------------
function fixtureMatch(seed: string): { a: MatchPlayer; b: MatchPlayer; match: ReturnType<typeof annotateMatch> } {
  const a = P('a', 'Vera Novak')
  const b = P('b', 'Ines Duval')
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}
const SPLIT: HeadToHead = { meetings: 3, wins: 2, losses: 1, lastWeek: 40, lastWon: true, lastSets: 3, recent: 1 }
const MUTE: HeadToHead = { meetings: 1, wins: 1, losses: 0, lastWeek: 40, lastWon: true, lastSets: null, recent: 1 }
const said = (beats: Beat[]): Beat[] => beats.filter((b) => b.kind === 'booth')

describe('D · the log and the preview', () => {
  it('with a record the log gains exactly ONE booth beat, and it is a line whose claim holds', () => {
    const allowed = new Set(rivalryInLines(SPLIT).flatMap((l) => [l.say('Vera', 'Ines', SPLIT).text, l.say('Ines', 'Vera', SPLIT).text]))
    let spoke = 0
    for (let i = 0; i < 60; i++) {
      const { a, b, match } = fixtureMatch(`rivalry-${i}`)
      const control = buildCommentary(match, a.name, b.name)
      const withIt = buildCommentary(match, a.name, b.name, null, null, null, null, { side: 0, record: SPLIT })
      const extra = said(withIt).length - said(control).length
      expect(extra).toBeLessThanOrEqual(1)
      // never on top of a beat the tennis already had: every beat of the control is still in the log
      for (const c of control) expect(withIt.some((x) => x.pointIndex === c.pointIndex && x.text === c.text), `lost ${c.text}`).toBe(true)
      if (extra === 1) {
        spoke++
        const beat = said(withIt).find((x) => !said(control).some((c) => c.pointIndex === x.pointIndex && c.text === x.text))!
        expect(allowed.has(beat.text), beat.text).toBe(true)
        expect(beat.keyMoment).toBe(false)
        expect(withIt.length).toBe(control.length + 1)
      }
    }
    expect(spoke).toBeGreaterThan(10)
  })

  it('null, omitted, or a record no remark fits -> byte-identical to the control', () => {
    for (let i = 0; i < 6; i++) {
      const { a, b, match } = fixtureMatch(`rivalry-control-${i}`)
      const control = JSON.stringify(buildCommentary(match, a.name, b.name))
      expect(JSON.stringify(buildCommentary(match, a.name, b.name, null, null, null, null, null))).toBe(control)
      expect(JSON.stringify(buildCommentary(match, a.name, b.name, null, null, null, null, { side: 1, record: MUTE }))).toBe(control)
    }
  })

  it('the preview gains one row only when given a record, and is byte-identical without', () => {
    const input: PreviewInput = {
      a: P('a', 'Vera Novak'),
      b: P('b', 'Ines Duval'),
      heroSide: 0,
      surface: 'hard',
      tour: JUNIOR_TOUR,
      heroRank: 10,
      oppRank: 12,
      event: { tier: 'j300', roundLabel: 'Quarterfinal' },
      temperatureC: 20,
    }
    const control = buildPreview(input)
    expect(buildPreview({ ...input, headToHead: null })).toEqual(control)
    const with_ = buildPreview({ ...input, headToHead: SPLIT })
    expect(with_.length).toBe(control.length + 1)
    expect(with_.filter((l) => l.key === 'rivalry')).toHaveLength(1)
    expect(with_.find((l) => l.key === 'rivalry')?.text).toBe('Vera and Ines have played before, and Vera won the last one.')
    expect(with_.filter((l) => l.key !== 'rivalry')).toEqual(control)
  })
})
