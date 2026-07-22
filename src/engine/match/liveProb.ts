// Package D – live win probability. Exact DP for side A's probability of winning
// the match from an arbitrary in-progress MatchScore. No simulation, no RNG.
// Composes: current game (deuce closed form), current set (game counters with
// serve alternation), tiebreak-from-state (6-6 closed form), and the best-of-3
// layer over set wins. Memoized where subproblems overlap.

import type { MatchScore, Side } from './types'
import { pGame } from './closedForm'

function flip(s: Side): Side {
  return (1 - s) as Side
}

// Tiebreak serve helpers. scoring.ts owns the canonical versions but does not
// export them; these mirror it exactly (touch-only-my-files rule).
function tbFlip(i: number): 0 | 1 {
  if (i === 1) return 0
  const pair = Math.floor((i - 2) / 2)
  return pair % 2 === 0 ? 1 : 0
}
function tiebreakServer(opener: Side, i: number): Side {
  return tbFlip(i) === 0 ? opener : flip(opener)
}
function tiebreakOpenerFrom(serverOfI: Side, i: number): Side {
  return tbFlip(i) === 0 ? serverOfI : flip(serverOfI)
}

// P(A wins the CURRENT regular game) from raw counters (a, b), given who serves.
// The deuce region (both >= 3) collapses to the closed form p^2 / (1 - 2pq).
function gameWinProbA(a: number, b: number, server: Side, pA: number, pB: number): number {
  const p = server === 0 ? pA : 1 - pB // P(A wins one point in this game)
  const q = 1 - p
  const denom = p * p + q * q // == 1 - 2pq
  const deuceWin = denom === 0 ? 0 : (p * p) / denom
  function win(x: number, y: number): number {
    if (x >= 4 && x - y >= 2) return 1
    if (y >= 4 && y - x >= 2) return 0
    if (x >= 3 && y >= 3) {
      const d = x - y
      if (d === 0) return deuceWin
      if (d === 1) return p + q * deuceWin // A holds advantage
      return p * deuceWin // B holds advantage (d === -1)
    }
    return p * win(x + 1, y) + q * win(x, y + 1)
  }
  return win(a, b)
}

// P(A wins the CURRENT tiebreak) from raw counters (a0, b0). `serverNext` serves
// point (a0 + b0 + 1). Serve rotation is reconstructed from the opener; from any
// tie state (both >= 6, equal) A wins with the two-point-block closed form.
function tiebreakWinProbA(
  a0: number,
  b0: number,
  serverNext: Side,
  pA: number,
  pB: number,
): number {
  const opener = tiebreakOpenerFrom(serverNext, a0 + b0 + 1)
  const pAOnPoint = (n: number): number => (tiebreakServer(opener, n) === 0 ? pA : 1 - pB)
  const tieDen = pA * (1 - pB) + (1 - pA) * pB
  const fromTie = tieDen === 0 ? 0.5 : (pA * (1 - pB)) / tieDen
  const memo = new Map<number, number>()
  function win(a: number, b: number): number {
    if (a >= 7 && a - b >= 2) return 1
    if (b >= 7 && b - a >= 2) return 0
    if (a >= 6 && b >= 6) {
      const d = a - b
      if (d === 0) return fromTie
      const pNext = pAOnPoint(a + b + 1)
      if (d === 1) return pNext + (1 - pNext) * fromTie
      return pNext * fromTie // d === -1
    }
    const key = a * 100 + b
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    const pNext = pAOnPoint(a + b + 1)
    const val = pNext * win(a + 1, b) + (1 - pNext) * win(a, b + 1)
    memo.set(key, val)
    return val
  }
  return win(a0, b0)
}

// P(A wins a set) from a games score (ga, gb) at love in the next game, where
// `srv` serves that next game. Mirrors closedForm.pSet but with explicit server
// tracking and arbitrary starting games; at 6-6 defers to the tiebreak DP.
function setWinProbAFromGames(
  ga: number,
  gb: number,
  srv: Side,
  pA: number,
  pB: number,
): number {
  const holdA = pGame(pA) // A serves -> A wins the game (holds)
  const breakA = 1 - pGame(pB) // B serves -> A wins the game (breaks)
  const memo = new Map<number, number>()
  function win(a: number, b: number, s: Side): number {
    if (a >= 6 && a - b >= 2) return 1
    if (b >= 6 && b - a >= 2) return 0
    if (a === 6 && b === 6) return tiebreakWinProbA(0, 0, s, pA, pB) // s opens the TB
    const key = (a * 100 + b) * 2 + s
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    const pWin = s === 0 ? holdA : breakA
    const val = pWin * win(a + 1, b, flip(s)) + (1 - pWin) * win(a, b + 1, flip(s))
    memo.set(key, val)
    return val
  }
  return win(ga, gb, srv)
}

// P(A wins the in-progress set) from the full current-set state.
function currentSetWinProbA(score: MatchScore, pA: number, pB: number): number {
  const cur = score.sets[score.sets.length - 1]
  if (score.inTiebreak) {
    return tiebreakWinProbA(score.game.a, score.game.b, score.server, pA, pB)
  }
  const pGameA = gameWinProbA(score.game.a, score.game.b, score.server, pA, pB)
  const nextSrv = flip(score.server) // serve alternates once this game ends
  const ifA = setWinProbAFromGames(cur.a + 1, cur.b, nextSrv, pA, pB)
  const ifB = setWinProbAFromGames(cur.a, cur.b + 1, nextSrv, pA, pB)
  return pGameA * ifA + (1 - pGameA) * ifB
}

// Best-of-3 layer: combine set wins so far with the current set and fresh sets.
function combineBo3(setsA: number, setsB: number, cur: number, s: number): number {
  if (setsA >= 1 && setsB >= 1) return cur // current set decides the match
  if (setsA === 1 && setsB === 0) return cur + (1 - cur) * s
  if (setsA === 0 && setsB === 1) return cur * s
  // 0-0: after the current set, remaining sets are fresh (prob s each)
  const from10 = s + (1 - s) * s // A leads 1-0 in sets, fresh sets
  const from01 = s * s // A trails 0-1 in sets, fresh sets
  return cur * from10 + (1 - cur) * from01
}

/**
 * Side A's probability of winning the match from an arbitrary in-progress
 * MatchScore. `pA`/`pB` are each side's point-win-on-serve probability;
 * `score.server` selects who is serving. Exact and deterministic.
 */
export function matchWinProbability(score: MatchScore, pA: number, pB: number): number {
  if (score.winner !== null) return score.winner === 0 ? 1 : 0

  // Completed sets are all but the last element (the in-progress set).
  let setsA = 0
  let setsB = 0
  for (let i = 0; i < score.sets.length - 1; i++) {
    const st = score.sets[i]
    if (st.a > st.b) setsA++
    else if (st.b > st.a) setsB++
  }

  const cur = currentSetWinProbA(score, pA, pB)
  const sFull = setWinProbAFromGames(0, 0, 0, pA, pB) // fresh set (serve-order independent)
  return combineBo3(setsA, setsB, cur, sFull)
}
