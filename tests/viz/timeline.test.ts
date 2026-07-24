import { describe, it, expect } from 'vitest'
import {
  buildTimeline,
  computeEndsSwaps,
  POINT_START,
  SERVE_FLIGHT,
  RALLY_FLIGHT,
  POINT_END,
  POINT_END_BIG,
  GAME_END,
  SET_END,
  CHANGE_ENDS,
  MATCH_END,
  POINT_END_GAP,
  OOH_GAP,
  GAME_END_GAP,
  SET_END_GAP,
} from '../../src/viz/timeline'
import { simulateMatch } from '../../src/engine/match/engine'
import { createScore, awardPoint } from '../../src/engine/match/scoring'
import { rngFromSeed } from '../../src/engine/rng'
import type { MatchPlayer, MatchOptions, Side } from '../../src/engine/match/types'
import type {
  AnnotatedMatch,
  AnnotatedPoint,
  Shot,
  TimelineEvent,
  TimelineEventKind,
} from '../../src/viz/types'

const EPS = 1e-9

// --- hand-built fixture builders -------------------------------------------

type ShotKind = Shot['kind']

function shot(kind: ShotKind, by: Side = 0): Shot {
  return {
    by,
    kind,
    direction: kind === 'rally' ? 'cross' : 'T',
    bounce: { x: 0, y: 5 },
    result: 'in',
  }
}

interface PointSpec {
  n: number
  shots: ShotKind[]
  breakPoint?: boolean
  setPointFor?: Side | null
  matchPointFor?: Side | null
  tiebreak?: boolean
  gameEnd?: boolean
  setEnd?: boolean
  // Optional overrides (default to the historic server=0 / winner=0 / last-shot 'in' so every
  // existing fixture is unchanged). Needed to build 'ooh' reaction points: a converted break
  // point (server !== winner) or a long rally whose last shot is a winner.
  server?: Side
  winner?: Side
  lastResult?: Shot['result']
}

function makePoint(spec: PointSpec): AnnotatedPoint {
  const shots: Shot[] = spec.shots.map((k, i) => shot(k, (i % 2) as Side))
  if (spec.lastResult && shots.length) {
    shots[shots.length - 1] = { ...shots[shots.length - 1], result: spec.lastResult }
  }
  return {
    entry: {
      pointNumber: spec.n,
      server: spec.server ?? 0,
      tiebreak: spec.tiebreak ?? false,
      breakPoint: spec.breakPoint ?? false,
      setPointFor: spec.setPointFor ?? null,
      matchPointFor: spec.matchPointFor ?? null,
      winner: spec.winner ?? 0,
      pServe: 0.6,
      scoreAfter: '',
    },
    rally: { pointNumber: spec.n, shots, ace: false, doubleFault: false },
    winProbA: 0.5,
    deuceCourt: true,
    gameEnd: spec.gameEnd ?? false,
    setEnd: spec.setEnd ?? false,
  }
}

function makeMatch(specs: PointSpec[]): AnnotatedMatch {
  const result = {
    winner: 0 as Side,
    sets: [{ a: 6, b: 4 }],
    stats: [] as never as AnnotatedMatch['result']['stats'],
    log: [],
    totalPoints: specs.length,
    seed: 'hand-built',
  } as unknown as AnnotatedMatch['result']
  return { result, points: specs.map(makePoint) }
}

/** Expected [kind, duration, pointIndex, shotIndex?] for a full-mode event stream. */
type Exp = [TimelineEventKind, number, number, number?]

function expectSequence(events: TimelineEvent[], expected: Exp[]) {
  expect(events.length).toBe(expected.length)
  let t = 0
  for (let i = 0; i < expected.length; i++) {
    const [kind, duration, pointIndex, shotIndex] = expected[i]
    const ev = events[i]
    expect(ev.kind).toBe(kind)
    expect(ev.pointIndex).toBe(pointIndex)
    expect(Math.abs(ev.duration - duration)).toBeLessThan(EPS)
    // strict sequencing: each t == running sum of prior durations
    expect(Math.abs(ev.t - t)).toBeLessThan(EPS)
    if (shotIndex === undefined) {
      expect(ev.shotIndex).toBeUndefined()
    } else {
      expect(ev.shotIndex).toBe(shotIndex)
    }
    t += duration
  }
}

// --- simulated fixture (real MatchResult + simplified annotations) ----------

const MIRROR: MatchPlayer = { id: 'm', name: 'Mirror', serve: 50, ret: 50, composure: 50, stamina: 50 }

/**
 * Build an AnnotatedMatch from a real MatchResult WITHOUT importing rally.ts.
 * gameEnd/setEnd/deuceCourt are recovered by replaying the log through the
 * Phase-1 scoring FSM; rallies are a deterministic *simplified* stand-in
 * (short, front-loaded) — enough to exercise the timeline, not the real
 * Package-D rally model.
 */
function annotateForViz(result: ReturnType<typeof simulateMatch>): AnnotatedMatch {
  const score = createScore(0)
  const points: AnnotatedPoint[] = []
  const n = result.log.length
  for (let i = 0; i < n; i++) {
    const entry = result.log[i]
    const wasTiebreak = score.inTiebreak
    const prevSetsLen = score.sets.length
    const preSum = score.game.a + score.game.b
    awardPoint(score, entry.winner)
    const matchOver = score.winner !== null
    let gameEnd: boolean
    let setEnd: boolean
    if (wasTiebreak) {
      const tbEnded = !score.inTiebreak
      gameEnd = tbEnded
      setEnd = tbEnded
    } else {
      gameEnd = score.game.a === 0 && score.game.b === 0
      setEnd = score.sets.length > prevSetsLen || (matchOver && gameEnd)
    }

    const rng = rngFromSeed(result.seed + '#' + entry.pointNumber)
    const r = rng()
    const count = r < 0.8 ? 1 : r < 0.95 ? 2 : 3
    const server = entry.server
    const shots: Shot[] = []
    for (let s = 0; s < count; s++) {
      const by = (s % 2 === 0 ? server : (1 - server)) as Side
      shots.push({
        by,
        kind: s === 0 ? 'serve1' : 'rally',
        direction: s === 0 ? 'T' : 'cross',
        bounce: { x: 0, y: 5 },
        result: s === count - 1 ? 'winner' : 'in',
      })
    }

    points.push({
      entry,
      rally: { pointNumber: entry.pointNumber, shots, ace: false, doubleFault: false },
      winProbA: i === n - 1 ? (result.winner === 0 ? 1 : 0) : 0.5,
      deuceCourt: preSum % 2 === 0,
      gameEnd,
      setEnd,
    })
  }
  return { result, points }
}

function simAnnotated(seed: string): AnnotatedMatch {
  const o: MatchOptions = { surface: 'hard', tour: 'atp', seed }
  return annotateForViz(simulateMatch(MIRROR, MIRROR, o))
}

// ---------------------------------------------------------------------------

describe('timeline — exported constants match the spec', () => {
  it('has the documented speed-1 timing constants', () => {
    expect(POINT_START).toBe(0.5)
    expect(SERVE_FLIGHT).toBe(0.55)
    expect(RALLY_FLIGHT).toBe(0.42)
    expect(POINT_END).toBe(0.5)
    expect(POINT_END_BIG).toBe(0.9)
    expect(GAME_END).toBe(0.7)
    expect(SET_END).toBe(1.6)
    expect(MATCH_END).toBe(2.0)
  })

  it('has the crowd-reaction trailing-gap sizes (reaction leads the next point-start)', () => {
    // Ordinary non-reaction points keep the tiny breath; reaction points get a longer hold so
    // the crowd cue (fired at the scoring instant) clearly precedes the next hit.
    expect(POINT_END_GAP).toBe(0.15)
    expect(OOH_GAP).toBe(1.0)
    expect(GAME_END_GAP).toBe(1.3)
    expect(SET_END_GAP).toBe(1.9)
  })
})

describe('timeline — event sequencing and durations (full mode)', () => {
  it('emits point-start -> shots (rally order) -> point-end (+game/set flags), then match-end', () => {
    const match = makeMatch([
      // point 0: 3 shots, ordinary point-end, no game/set end
      { n: 1, shots: ['serve1', 'rally', 'rally'] },
      // point 1: fault then 2nd serve then a rally shot; break point (long point-end);
      // this point ends a game AND a set
      { n: 2, shots: ['serve1', 'serve2', 'rally'], breakPoint: true, gameEnd: true, setEnd: true },
    ])
    const tl = buildTimeline(match, 'full')
    expectSequence(tl.events, [
      ['point-start', POINT_START, 0],
      ['shot', SERVE_FLIGHT, 0, 0],
      ['shot', RALLY_FLIGHT, 0, 1],
      ['shot', RALLY_FLIGHT, 0, 2],
      ['point-end', POINT_END, 0],
      // Round-7 item 10: tiny quiet gap after p0's point-end (p0 is not the final point).
      ['gap', POINT_END_GAP, 0],
      ['point-start', POINT_START, 1],
      ['shot', SERVE_FLIGHT, 1, 0],
      ['shot', SERVE_FLIGHT, 1, 1],
      ['shot', RALLY_FLIGHT, 1, 2],
      ['point-end', POINT_END_BIG, 1],
      // p1 is the final point: no trailing gaps (its game-end/set-end run straight into match-end).
      ['game-end', GAME_END, 1],
      ['set-end', SET_END, 1],
      ['match-end', MATCH_END, 1],
    ])
    // duration == last event's t + its duration
    const last = tl.events[tl.events.length - 1]
    expect(Math.abs(tl.duration - (last.t + last.duration))).toBeLessThan(EPS)
    expect(tl.mode).toBe('full')
  })

  it('events are strictly non-decreasing in t and gapless for a simulated match', () => {
    const match = simAnnotated('viz-e-3')
    for (const mode of ['full', 'key'] as const) {
      const tl = buildTimeline(match, mode)
      for (let i = 1; i < tl.events.length; i++) {
        const prev = tl.events[i - 1]
        const cur = tl.events[i]
        expect(cur.t).toBeGreaterThanOrEqual(prev.t - EPS)
        expect(Math.abs(cur.t - (prev.t + prev.duration))).toBeLessThan(1e-6)
      }
      const last = tl.events[tl.events.length - 1]
      expect(Math.abs(tl.duration - (last.t + last.duration))).toBeLessThan(1e-6)
    }
  })
})

describe('timeline — mode coverage', () => {
  // p0 plain (non-key); p1 game-end; p2 break point + set point; p3 tiebreak; p4 final + match point + set end.
  const match = makeMatch([
    { n: 1, shots: ['serve1', 'rally'] },
    { n: 2, shots: ['serve1'], gameEnd: true },
    { n: 3, shots: ['serve1', 'rally'], breakPoint: true, setPointFor: 0 },
    { n: 4, shots: ['serve1'], tiebreak: true },
    { n: 5, shots: ['serve1', 'rally'], matchPointFor: 0, gameEnd: true, setEnd: true },
  ])

  const pointIndicesOf = (events: TimelineEvent[]) =>
    new Set(events.filter((e) => e.kind !== 'match-end').map((e) => e.pointIndex))

  it('full covers every point index exactly once', () => {
    const tl = buildTimeline(match, 'full')
    const starts = tl.events.filter((e) => e.kind === 'point-start').map((e) => e.pointIndex)
    expect(starts).toEqual([0, 1, 2, 3, 4])
    expect(pointIndicesOf(tl.events)).toEqual(new Set([0, 1, 2, 3, 4]))
  })

  it('key is a subset of full and includes every BP/SP/MP/tiebreak/game-end point plus the final point', () => {
    const full = pointIndicesOf(buildTimeline(match, 'full').events)
    const key = pointIndicesOf(buildTimeline(match, 'key').events)
    for (const idx of key) expect(full.has(idx)).toBe(true)
    // key must include: game-end(1), BP+SP(2), tiebreak(3), final+MP+setEnd(4)
    expect(key.has(1)).toBe(true)
    expect(key.has(2)).toBe(true)
    expect(key.has(3)).toBe(true)
    expect(key.has(4)).toBe(true)
    // and must exclude the plain point 0
    expect(key.has(0)).toBe(false)
    expect(key).toEqual(new Set([1, 2, 3, 4]))
  })

  it('skip has only a single match-end event referencing the final point', () => {
    const tl = buildTimeline(match, 'skip')
    expect(tl.events.length).toBe(1)
    expect(tl.events[0].kind).toBe('match-end')
    expect(tl.events[0].pointIndex).toBe(4)
    expect(Math.abs(tl.events[0].duration - MATCH_END)).toBeLessThan(EPS)
    expect(Math.abs(tl.duration - MATCH_END)).toBeLessThan(EPS)
  })

  it('the final point is always included in key even when it carries no key flag', () => {
    // a two-point match where the last point has no flags at all
    const m = makeMatch([
      { n: 1, shots: ['serve1'], gameEnd: true },
      { n: 2, shots: ['serve1', 'rally'] },
    ])
    const key = pointIndicesOf(buildTimeline(m, 'key').events)
    expect(key.has(1)).toBe(true)
  })
})

describe('timeline — point-end long variant on big points', () => {
  it('uses POINT_END_BIG exactly on breakPoint / setPointFor / matchPointFor, else POINT_END', () => {
    const match = makeMatch([
      { n: 1, shots: ['serve1'], breakPoint: true },
      { n: 2, shots: ['serve1'], setPointFor: 1 },
      { n: 3, shots: ['serve1'], matchPointFor: 0 },
      { n: 4, shots: ['serve1'] }, // ordinary
    ])
    const tl = buildTimeline(match, 'full')
    const pe = tl.events.filter((e) => e.kind === 'point-end')
    expect(pe.map((e) => e.pointIndex)).toEqual([0, 1, 2, 3])
    expect(Math.abs(pe[0].duration - POINT_END_BIG)).toBeLessThan(EPS)
    expect(Math.abs(pe[1].duration - POINT_END_BIG)).toBeLessThan(EPS)
    expect(Math.abs(pe[2].duration - POINT_END_BIG)).toBeLessThan(EPS)
    expect(Math.abs(pe[3].duration - POINT_END)).toBeLessThan(EPS)
  })
})

describe('computeEndsSwaps — round 4 item 3 (real side changes)', () => {
  it('swaps after the 1st and 3rd game of a set, not the 2nd; resets and reapplies fresh for the next set', () => {
    const points = [
      makePoint({ n: 1, shots: ['serve1'], gameEnd: true }), // game 1 of set 1 -> swap
      makePoint({ n: 2, shots: ['serve1'], gameEnd: true }), // game 2 -> even, no swap
      makePoint({ n: 3, shots: ['serve1'], gameEnd: true, setEnd: true }), // game 3 -> odd, swap; set ends
      makePoint({ n: 4, shots: ['serve1'], gameEnd: true }), // game 1 of set 2 -> swap again (carried across the boundary)
      makePoint({ n: 5, shots: ['serve1'] }), // filler so point 3 above isn't the match's last point
    ]
    const { swappedDuring, changeEndsAfter } = computeEndsSwaps(points)
    expect(swappedDuring).toEqual([false, true, true, false, true])
    expect(changeEndsAfter).toEqual([true, false, true, true, false])
  })

  it('suppresses the change-ends beat on the very last point of the match, even when the swap parity would fire', () => {
    const points = [makePoint({ n: 1, shots: ['serve1'], gameEnd: true, setEnd: true })]
    const { changeEndsAfter } = computeEndsSwaps(points)
    expect(changeEndsAfter).toEqual([false])
  })

  it('swaps every 6 combined points inside an unfinished tiebreak, plus once more at its conclusion (no double toggle)', () => {
    const points = [
      makePoint({ n: 1, shots: ['serve1'], tiebreak: true }), // tb point 1
      makePoint({ n: 2, shots: ['serve1'], tiebreak: true }), // tb point 2
      makePoint({ n: 3, shots: ['serve1'], tiebreak: true }), // tb point 3
      makePoint({ n: 4, shots: ['serve1'], tiebreak: true }), // tb point 4
      makePoint({ n: 5, shots: ['serve1'], tiebreak: true }), // tb point 5
      makePoint({ n: 6, shots: ['serve1'], tiebreak: true }), // tb point 6 -> mid-breaker swap
      makePoint({ n: 7, shots: ['serve1'], tiebreak: true }), // tb point 7
      makePoint({ n: 8, shots: ['serve1'], tiebreak: true, gameEnd: true, setEnd: true }), // breaker concludes -> swap (odd local game)
      makePoint({ n: 9, shots: ['serve1'] }), // filler so point 7 (index 7) above isn't the match's last point
    ]
    const { swappedDuring, changeEndsAfter } = computeEndsSwaps(points)
    expect(changeEndsAfter).toEqual([false, false, false, false, false, true, false, true, false])
    expect(swappedDuring).toEqual([false, false, false, false, false, false, true, true, false])
  })
})

describe('buildTimeline — round 4 item 3: change-ends events', () => {
  it('inserts a change-ends event (duration CHANGE_ENDS) right after a point that swaps parity, before the next point-start; suppressed on the final point', () => {
    const match = makeMatch([
      { n: 1, shots: ['serve1'] }, // point 0: nothing special
      { n: 2, shots: ['serve1'], gameEnd: true }, // point 1: 1st game of the match -> swap
      { n: 3, shots: ['serve1'], gameEnd: true, setEnd: true }, // point 2 (final): 2nd game -> even, no swap anyway
    ])
    const tl = buildTimeline(match, 'full')
    expectSequence(tl.events, [
      ['point-start', POINT_START, 0],
      ['shot', SERVE_FLIGHT, 0, 0],
      ['point-end', POINT_END, 0],
      ['gap', POINT_END_GAP, 0], // tiny gap after p0's point-end
      ['point-start', POINT_START, 1],
      ['shot', SERVE_FLIGHT, 1, 0],
      ['point-end', POINT_END, 1],
      ['gap', POINT_END_GAP, 1], // tiny gap after p1's point-end
      ['game-end', GAME_END, 1],
      ['gap', GAME_END_GAP, 1], // longer game gap, BEFORE the change-ends beat
      ['change-ends', CHANGE_ENDS, 1],
      ['point-start', POINT_START, 2],
      ['shot', SERVE_FLIGHT, 2, 0],
      ['point-end', POINT_END, 2],
      // p2 is the final point: no gaps at all (point-end -> game-end -> set-end -> match-end).
      ['game-end', GAME_END, 2],
      ['set-end', SET_END, 2],
      ['match-end', MATCH_END, 2],
    ])
  })

  it('never emits change-ends in skip mode (no point events at all)', () => {
    const match = makeMatch([{ n: 1, shots: ['serve1'], gameEnd: true, setEnd: true }])
    const tl = buildTimeline(match, 'skip')
    expect(tl.events.every((e) => e.kind !== 'change-ends')).toBe(true)
  })
})

describe('timeline — round-7 item 10: quiet gaps so applause never overlaps the next hit', () => {
  it('emits a tiny gap after every non-final point-end, and a longer gap after game-end / set-end', () => {
    const m = makeMatch([
      { n: 1, shots: ['serve1'] }, // p0: plain
      { n: 2, shots: ['serve1'], gameEnd: true }, // p1: game ends
      { n: 3, shots: ['serve1'], gameEnd: true, setEnd: true }, // p2: set ends
      { n: 4, shots: ['serve1'] }, // p3: final (plain)
    ])
    const events = buildTimeline(m, 'full').events

    // every non-final point-end (p0,p1,p2) is immediately followed by a tiny POINT_END_GAP
    for (const idx of [0, 1, 2]) {
      const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === idx)
      expect(peAt).toBeGreaterThanOrEqual(0)
      const next = events[peAt + 1]
      expect(next.kind).toBe('gap')
      expect(next.pointIndex).toBe(idx)
      expect(Math.abs(next.duration - POINT_END_GAP)).toBeLessThan(EPS)
    }

    // game-end (p1) is immediately followed by a GAME_END_GAP
    const geAt = events.findIndex((e) => e.kind === 'game-end' && e.pointIndex === 1)
    expect(events[geAt + 1].kind).toBe('gap')
    expect(Math.abs(events[geAt + 1].duration - GAME_END_GAP)).toBeLessThan(EPS)

    // set-end (p2) is immediately followed by a SET_END_GAP
    const seAt = events.findIndex((e) => e.kind === 'set-end' && e.pointIndex === 2)
    expect(events[seAt + 1].kind).toBe('gap')
    expect(Math.abs(events[seAt + 1].duration - SET_END_GAP)).toBeLessThan(EPS)
  })

  it('suppresses all gaps on the match final point (point-end runs straight into game-end)', () => {
    const m = makeMatch([
      { n: 1, shots: ['serve1'], gameEnd: true },
      { n: 2, shots: ['serve1'], gameEnd: true, setEnd: true }, // final point, game+set end
    ])
    const events = buildTimeline(m, 'full').events
    expect(events.some((e) => e.kind === 'gap' && e.pointIndex === 1)).toBe(false)
    const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === 1)
    expect(events[peAt + 1].kind).toBe('game-end')
  })

  it('emits no gap events in skip mode', () => {
    const m = makeMatch([{ n: 1, shots: ['serve1'], gameEnd: true, setEnd: true }])
    const tl = buildTimeline(m, 'skip')
    expect(tl.events.every((e) => e.kind !== 'gap')).toBe(true)
  })

  it('gaps are silent holds: a gap never coincides with a shot and never changes the point index mid-hold', () => {
    const m = simAnnotated('viz-e-7')
    const events = buildTimeline(m, 'full').events
    for (let i = 0; i < events.length; i++) {
      if (events[i].kind !== 'gap') continue
      // a gap carries a real point index and a positive duration
      expect(events[i].pointIndex).toBeGreaterThanOrEqual(0)
      expect(events[i].duration).toBeGreaterThan(0)
      // a gap is never a shot (no ball in flight during the quiet hold)
      expect(events[i].shotIndex).toBeUndefined()
    }
  })
})

describe('timeline — crowd-reaction trailing gaps (reaction leads the next point-start)', () => {
  it('gives an ordinary converted-break-point (no game/set end) the longer OOH_GAP', () => {
    const m = makeMatch([
      // p0: receiver (winner 1) converts a break point off server 0, ends cleanly, but this
      // synthetic point ends NO game/set -> ordinary 'ooh' point -> OOH_GAP.
      { n: 1, shots: ['serve1', 'rally'], breakPoint: true, server: 0, winner: 1 },
      { n: 2, shots: ['serve1'] }, // filler final point
    ])
    const events = buildTimeline(m, 'full').events
    const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === 0)
    expect(events[peAt + 1].kind).toBe('gap')
    expect(Math.abs(events[peAt + 1].duration - OOH_GAP)).toBeLessThan(EPS)
  })

  it('gives an ordinary long-rally winner (>=8 shots, no game/set end) the longer OOH_GAP', () => {
    const longRally: ShotKind[] = ['serve1', 'rally', 'rally', 'rally', 'rally', 'rally', 'rally', 'rally']
    const m = makeMatch([
      { n: 1, shots: longRally, lastResult: 'winner' }, // 8 shots, last a winner -> 'ooh'
      { n: 2, shots: ['serve1'] }, // filler final point
    ])
    const events = buildTimeline(m, 'full').events
    const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === 0)
    expect(events[peAt + 1].kind).toBe('gap')
    expect(Math.abs(events[peAt + 1].duration - OOH_GAP)).toBeLessThan(EPS)
  })

  it('keeps the tiny POINT_END_GAP after a reaction point that ALSO ends a game (its lead is the game gap)', () => {
    const m = makeMatch([
      // Converted break point that ends the game: point-end gap stays tiny; the crowd's lead
      // before the next point comes from the (longer) GAME_END_GAP after the game-end beat.
      { n: 1, shots: ['serve1', 'rally'], breakPoint: true, server: 0, winner: 1, gameEnd: true },
      { n: 2, shots: ['serve1'] }, // filler final point
    ])
    const events = buildTimeline(m, 'full').events
    const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === 0)
    expect(events[peAt + 1].kind).toBe('gap')
    expect(Math.abs(events[peAt + 1].duration - POINT_END_GAP)).toBeLessThan(EPS)
    const geAt = events.findIndex((e) => e.kind === 'game-end' && e.pointIndex === 0)
    expect(events[geAt + 1].kind).toBe('gap')
    expect(Math.abs(events[geAt + 1].duration - GAME_END_GAP)).toBeLessThan(EPS)
  })

  it('leaves an ordinary NON-reaction point on the tiny POINT_END_GAP', () => {
    const m = makeMatch([
      { n: 1, shots: ['serve1', 'rally'] }, // plain point, no reaction
      { n: 2, shots: ['serve1'] },
    ])
    const events = buildTimeline(m, 'full').events
    const peAt = events.findIndex((e) => e.kind === 'point-end' && e.pointIndex === 0)
    expect(events[peAt + 1].kind).toBe('gap')
    expect(Math.abs(events[peAt + 1].duration - POINT_END_GAP)).toBeLessThan(EPS)
  })
})

describe('timeline — duration bands on real simulated matches (ATP mirror, fixed seeds)', () => {
  // NOTE ON THE BAND: with the mandated timing constants and the Phase-1 engine's
  // point counts, only reel-length matches fit the spec's full<=240s-ish ceiling
  // (there is a ~1.55s/point floor). We therefore assert the band over the mirror
  // matches short enough for the highlight reel (<=130 points); longer matches are
  // reported as a spec tension. Rallies here are the simplified stand-in above.
  //
  // Round 4 item 3 raised both ceilings slightly (240->260, 90->100): every game that
  // swaps ends adds a real CHANGE_ENDS (0.9s) beat. Round-7 item 10 re-centred them again
  // (260->290, 100->120): the trailing quiet gaps (POINT_END_GAP after every point-end,
  // GAME_END_GAP/SET_END_GAP after game/set breaks) so applause never overlaps the next hit
  // also legitimately lengthen playback. Round-7 crowd-reaction pass re-centres once more
  // (290->305, 120->135): the reaction cues now fire at the scoring instant, and the trailing
  // gaps were grown so the crowd clearly LEADS the next hit — GAME_END_GAP 0.5->1.3, SET_END_GAP
  // 0.9->1.9, plus a new OOH_GAP (1.0) on ordinary reaction points. Measured across these 50
  // fixed seeds post-change: full ∈ [244.5, 290.6], key ∈ [90.0, 124.5] for the reel-length
  // subset — both ceilings keep ~14s/~10s of headroom above the observed max, and 290.6s@1x
  // still lands at 145s (~2.4min) at the UI's default 2x speed, inside the owner's 2-3.5min target.
  const seeds = Array.from({ length: 50 }, (_, i) => `viz-e-${i}`)
  const matches = seeds.map(simAnnotated)

  it('key duration <= full duration and skip == match-end for every fixture', () => {
    for (const m of matches) {
      const full = buildTimeline(m, 'full')
      const key = buildTimeline(m, 'key')
      const skip = buildTimeline(m, 'skip')
      expect(key.duration).toBeLessThanOrEqual(full.duration + EPS)
      expect(Math.abs(skip.duration - MATCH_END)).toBeLessThan(EPS)
    }
  })

  it('reel-length matches (<=130 pts) land in full [100,305]s and key [15,135]s', () => {
    const reel = matches.filter((m) => m.result.totalPoints <= 130)
    expect(reel.length).toBeGreaterThanOrEqual(8)
    for (const m of reel) {
      const full = buildTimeline(m, 'full').duration
      const key = buildTimeline(m, 'key').duration
      expect(full).toBeGreaterThanOrEqual(100)
      expect(full).toBeLessThanOrEqual(305)
      expect(key).toBeGreaterThanOrEqual(15)
      expect(key).toBeLessThanOrEqual(135)
    }
  })

  it('the canonical fixture (viz-e-3) has full and key durations inside the spec bands', () => {
    const m = simAnnotated('viz-e-3')
    const full = buildTimeline(m, 'full').duration
    const key = buildTimeline(m, 'key').duration
    expect(full).toBeGreaterThanOrEqual(100)
    expect(full).toBeLessThanOrEqual(305)
    expect(key).toBeGreaterThanOrEqual(15)
    expect(key).toBeLessThanOrEqual(135)
  })
})
