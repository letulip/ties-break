import { describe, it, expect } from 'vitest'
import { matchWinProbability } from '../../src/engine/match/liveProb'
import { pMatchBo3 } from '../../src/engine/match/closedForm'
import {
  createScore,
  awardPoint,
  tiebreakServer,
  tiebreakOpenerFrom,
} from '../../src/engine/match/scoring'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { basePServe } from '../../src/engine/match/point'
import type { MatchScore, MatchPlayer, MatchOptions, Side } from '../../src/engine/match/types'

// ⚠ `groundstrokes: 50` ON BOTH SIDES BY DEFAULT (v25), and that is not filler - it is what keeps
// every fixture in this file byte-identical. The rally term in `basePServe` multiplies a DIFFERENCE,
// so two players level off the ground contribute exactly zero and no calibration band moves.
function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}
function opts(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 'seed-0', ...overrides }
}

// A fresh in-progress score (server 0, love-all first set).
function freshScore(server: Side = 0): MatchScore {
  return createScore(server)
}

describe('liveProb — required test 1: fresh match equals closed-form Bo3', () => {
  it('equal p -> 0.5 within 1e-9', () => {
    for (const p of [0.5, 0.55, 0.6, 0.62, 0.7]) {
      expect(matchWinProbability(freshScore(), p, p)).toBeCloseTo(0.5, 9)
    }
  })

  it('equals pMatchBo3(pA, pB) within 1e-9 for unequal p (both serve orders)', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.7, 0.6],
      [0.58, 0.63],
      [0.55, 0.5],
      [0.62, 0.63],
    ]
    for (const [pA, pB] of pairs) {
      expect(matchWinProbability(freshScore(0), pA, pB)).toBeCloseTo(pMatchBo3(pA, pB), 9)
      // serve order is irrelevant to the fresh-match probability
      expect(matchWinProbability(freshScore(1), pA, pB)).toBeCloseTo(pMatchBo3(pA, pB), 9)
    }
  })

  it('the two orientations of a fresh match sum to 1', () => {
    const pairs: [number, number][] = [
      [0.65, 0.62],
      [0.7, 0.6],
      [0.55, 0.5],
    ]
    for (const [pA, pB] of pairs) {
      const forward = matchWinProbability(freshScore(), pA, pB)
      const backward = matchWinProbability(freshScore(), pB, pA)
      expect(forward + backward).toBeCloseTo(1, 9)
    }
  })
})

describe('liveProb — required test 2: winProbA after the last point is the indicator', () => {
  it('across 10 matches the final annotated winProbA is exactly 1 or 0', () => {
    const a = player({ id: 'a', name: 'A', serve: 60, ret: 50 })
    const b = player({ id: 'b', name: 'B', serve: 52, ret: 55 })
    for (let i = 0; i < 10; i++) {
      const o = opts({ seed: `final-${i}`, tour: i % 2 ? 'wta' : 'atp' })
      const result = simulateMatch(a, b, o)
      const ann = annotateMatch(result, a, b, o)
      const last = ann.points[ann.points.length - 1]
      expect(last.winProbA).toBe(result.winner === 0 ? 1 : 0)
    }
  })

  it('a decided MatchScore returns exactly 1 or 0 regardless of p', () => {
    const decidedA: MatchScore = {
      sets: [
        { a: 6, b: 4 },
        { a: 6, b: 3 },
      ],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: 0,
    }
    const decidedB: MatchScore = { ...decidedA, sets: [{ a: 4, b: 6 }, { a: 3, b: 6 }], winner: 1 }
    expect(matchWinProbability(decidedA, 0.61, 0.59)).toBe(1)
    expect(matchWinProbability(decidedB, 0.61, 0.59)).toBe(0)
  })
})

describe('liveProb — required test 3: monotone sanity', () => {
  it('holding a match point -> prob > 0.9 for the holder', () => {
    // A won the first set, serving at 5-4, 40-30 in set 2 -> match point for A.
    const matchPointA: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 5, b: 4 }],
      game: { a: 3, b: 2 }, // 40-30, A serving
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(matchPointA, 0.62, 0.62)).toBeGreaterThan(0.9)

    // Mirror: B holds the match point -> A's prob < 0.1.
    const matchPointB: MatchScore = {
      sets: [{ a: 4, b: 6 }, { a: 4, b: 5 }],
      game: { a: 2, b: 3 }, // B serving, 30-40
      inTiebreak: false,
      server: 1,
      winner: null,
    }
    expect(matchWinProbability(matchPointB, 0.62, 0.62)).toBeLessThan(0.1)
  })

  it('down a set at equal p -> prob < 0.5', () => {
    const downASet: MatchScore = {
      sets: [{ a: 4, b: 6 }, { a: 0, b: 0 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(downASet, 0.6, 0.6)).toBeLessThan(0.5)
  })

  it('up a set at equal p -> prob > 0.5 (complement of down a set)', () => {
    const upASet: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 0, b: 0 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(upASet, 0.6, 0.6)).toBeGreaterThan(0.5)
  })

  it('up a break in set 3 at 4-3, equal p -> > 0.5', () => {
    // Decider (one set each). A leads 4-3 having broken once; B serves the 8th game.
    const set3Break: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 4, b: 3 }],
      game: { a: 0, b: 0 },
      inTiebreak: false,
      server: 1, // B to serve game 8
      winner: null,
    }
    expect(matchWinProbability(set3Break, 0.6, 0.6)).toBeGreaterThan(0.5)
  })

  it('leading in a decider tiebreak at equal p -> > 0.5', () => {
    const tb: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 6, b: 6 }],
      game: { a: 5, b: 2 }, // TB 5-2 to A
      inTiebreak: true,
      server: 0,
      winner: null,
    }
    expect(matchWinProbability(tb, 0.6, 0.6)).toBeGreaterThan(0.5)
  })
})

describe('liveProb — required test 4: never NaN / out of range over real matches', () => {
  it('every annotated winProbA of 20 simulated matches is a finite number in [0, 1]', () => {
    const a = player({ id: 'a', name: 'A', serve: 61, ret: 49 })
    const b = player({ id: 'b', name: 'B', serve: 53, ret: 56 })
    for (let i = 0; i < 20; i++) {
      const surface = (['hard', 'clay', 'grass'] as const)[i % 3]
      const o = opts({ seed: `range-${i}`, surface, tour: i % 2 ? 'wta' : 'atp' })
      const result = simulateMatch(a, b, o)
      const ann = annotateMatch(result, a, b, o)
      for (const pt of ann.points) {
        expect(Number.isFinite(pt.winProbA)).toBe(true)
        expect(pt.winProbA).toBeGreaterThanOrEqual(0)
        expect(pt.winProbA).toBeLessThanOrEqual(1)
      }
    }
  })

  it('directly probes matchWinProbability on every post-point score without NaN', () => {
    const a = player({ id: 'a', serve: 58, ret: 52 })
    const b = player({ id: 'b', serve: 55, ret: 54 })
    const o = opts({ seed: 'probe-1', surface: 'clay' })
    const pA = basePServe(a, b, o)
    const pB = basePServe(b, a, o)
    const result = simulateMatch(a, b, o)
    // Replay to reconstruct each post-point score and probe liveProb directly.
    const score = createScore(o.firstServer ?? 0)
    for (const e of result.log) {
      awardPoint(score, e.winner)
      const v = matchWinProbability(score, pA, pB)
      expect(Number.isFinite(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

// =================================================================================================
// ⚠ CROSS-CONSUMER ROTATION PARITY (review TB-01, P1). READ BEFORE EDITING.
//
// `scoring.ts` and `liveProb.ts` each used to carry a private, byte-equivalent copy of the tiebreak
// serve rotation – `tbFlip` / `tiebreakServer` / `tiebreakOpenerFrom` – kept in sync by hand under a
// comment citing a "touch-only-my-files rule". Correct one copy and not the other and the match
// SERVES with one rotation while the displayed live probability ASSUMES another. Nothing failed:
// every existing test here checks liveProb against itself or against closedForm, and the scoring
// rotation tests never look at liveProb. The rotation now has one owner (scoring.ts) and liveProb
// imports it, but the import is not the guard – this block is.
//
// The guard is behavioural, not a source pin, so it survives any future re-layout and still fails if
// someone reintroduces a local copy in liveProb and edits it. It works through the ONE-STEP
// IDENTITY: a live win probability must equal the probability re-derived one point ahead,
//
//     P(X) == p_next * P(X after A wins the point) + (1 - p_next) * P(X after B wins the point)
//
// where BOTH the successor states AND the identity of the next server come from `scoring.awardPoint`
// – i.e. from the rotation the match actually serves – while every P comes from liveProb. liveProb's
// own reconstruction (`tiebreakOpenerFrom` then `tiebreakServer`) is self-inverse at the immediate
// next point, so a divergent rotation stays invisible one point out; it shows up as soon as
// liveProb's multi-point lookahead is forced to agree with scoring's actual single steps, which is
// exactly what this identity does. Measured deviation on agreeing rotations is 2.2e-16 (float noise)
// on every reachable state, boundary states included – hence the 1e-12 tolerance, ~4 orders of
// magnitude clear of the noise and ~10 orders clear of a real disagreement.
//
// ⚠ pA and pB must stay SERVE-DOMINANT (pA != 1 - pB). With pA == 1 - pB it does not matter who
// serves, every probability is rotation-independent, and this whole block passes on a broken engine.
//
// ⚠ MUTATION-VERIFIED, three mutations, each applied alone and watched red before this was believed.
// The two `it`s below cover DIFFERENT halves of the chain and neither is redundant – the mutation
// that reddens one leaves the other green:
//
//   A. liveProb gets its local copy back with the pairing off by one (`(i - 1) / 2`).
//      -> 4 red: this parity test AND three pre-existing closed-form tests. Blunt: that particular
//         drift also moves the FRESH-set number, so origin/main would have caught this one.
//   B. liveProb gets a local `tiebreakOpenerFrom` only, drifting only for i > 1 – so a fresh 0-0
//      tiebreak is byte-identical and every closed-form test still passes.
//      -> 1 red, and it is the first `it` here. 90 others green. THIS IS THE FINDING: on origin/main
//         that drift ships silently, and it is the honest reason this block exists.
//   C. the match's own rotation drifts while the helper stays put: `advanceTiebreakServer` in
//      scoring.ts advanced to `played + 2`.
//      -> 3 red: the SECOND `it` here plus the two pre-existing scoring rotation tests. The first
//         `it` stays GREEN, because liveProb re-anchors on `score.server` at every state and so
//         follows the state machine wherever it goes. That blind spot is exactly what the second
//         `it` is for. Do not merge them.
// =================================================================================================

describe('liveProb x scoring – tiebreak serve rotation parity', () => {
  // An in-progress tiebreak at 6-6 in the current set, with `done` sets already banked.
  function tiebreakAt(a: number, b: number, server: Side, done: [number, number][] = []): MatchScore {
    return {
      sets: [...done.map(([x, y]) => ({ a: x, b: y })), { a: 6, b: 6 }],
      game: { a, b },
      inTiebreak: true,
      server,
      winner: null,
    }
  }

  // Serve-dominant on both sides: A wins 0.9 of its own points and only 0.1 on the other serve, so
  // any disagreement about who serves a point moves the number hard.
  const PAIRS: [number, number][] = [
    [0.9, 0.9],
    [0.8, 0.75],
    [0.72, 0.85],
  ]
  const CONTEXTS: [string, [number, number][]][] = [
    ['0-0 in sets', []],
    ['1-0 in sets', [[7, 5]]],
    ['0-1 in sets', [[5, 7]]],
  ]

  it('liveProb agrees with the rotation scoring actually serves, on every reachable tiebreak state', () => {
    let checked = 0
    for (const [pA, pB] of PAIRS) {
      for (const [label, done] of CONTEXTS) {
        for (let a = 0; a <= 9; a++) {
          for (let b = 0; b <= 9; b++) {
            if (Math.max(a, b) >= 7 && Math.abs(a - b) >= 2) continue // that tiebreak is already over
            for (const server of [0, 1] as Side[]) {
              const here = tiebreakAt(a, b, server, done)
              const ifA = structuredClone(here)
              awardPoint(ifA, 0) // scoring advances the rotation, not us
              const ifB = structuredClone(here)
              awardPoint(ifB, 1)
              // The next point's server is scoring's `score.server`, read off the real state machine.
              const pNext = here.server === 0 ? pA : 1 - pB
              const oneStep =
                pNext * matchWinProbability(ifA, pA, pB) + (1 - pNext) * matchWinProbability(ifB, pA, pB)
              expect(
                matchWinProbability(here, pA, pB),
                `${label} TB ${a}-${b} server ${server} @ pA=${pA} pB=${pB}`,
              ).toBeCloseTo(oneStep, 12)
              checked++
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(500) // the sweep really ran
  })

  it('the shared helper reproduces the server sequence awardPoint writes, over a long tiebreak', () => {
    // The other half of the chain: scoring's own exported rotation vs scoring's state machine. With
    // the identity above this closes the loop scoring -> shared helper -> liveProb.
    for (const first of [0, 1] as Side[]) {
      const score = tiebreakAt(0, 0, first)
      const opener = score.server
      const fromMachine: Side[] = []
      const fromHelper: Side[] = []
      for (let i = 1; i <= 40; i++) {
        fromMachine.push(score.server)
        fromHelper.push(tiebreakServer(opener, i))
        awardPoint(score, (i % 2) as Side) // alternate so the tiebreak never reaches margin 2
        expect(score.inTiebreak, `tiebreak ended early at point ${i}`).toBe(true)
      }
      expect(fromHelper).toEqual(fromMachine)
      // ...and the inverse recovers the opener from any point in the sequence.
      for (let i = 1; i <= 40; i++) {
        expect(tiebreakOpenerFrom(fromMachine[i - 1], i), `opener from point ${i}`).toBe(opener)
      }
    }
  })
})
