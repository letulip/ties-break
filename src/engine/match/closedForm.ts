// Closed-form / exact-DP win probabilities for the iid Markov model. Given each
// side's point-win-on-serve probability, these return exact game/set/tiebreak/
// match probabilities with no simulation. q = 1 - p throughout.

import type { Side } from './types'

// Probability the server holds a game (O'Malley / standard iid formula).
export function pGame(p: number): number {
  const q = 1 - p
  const straightish = p * p * p * p * (1 + 4 * q + 10 * q * q)
  const fromDeuce = (20 * Math.pow(p * q, 3) * p * p) / (1 - 2 * p * q)
  return straightish + fromDeuce
}

// True when side A serves point n (1-based) of a tiebreak A opens: A serves
// point 1, then serve alternates every two points -> A on n % 4 in {1, 0}.
function tiebreakServerIsA(n: number): boolean {
  const r = n % 4
  return r === 1 || r === 0
}

// Probability side A wins a tiebreak it opens (serves point 1).
export function pTiebreak(pA: number, pB: number): number {
  const qA = 1 - pA
  const qB = 1 - pB
  // From 6-6 serves alternate one point each; A wins iff it takes a two-point block.
  const fromSixAll = (pA * qB) / (pA * qB + qA * pB)

  const memo = new Map<number, number>()
  function win(a: number, b: number): number {
    if (a >= 7 && a - b >= 2) return 1
    if (b >= 7 && b - a >= 2) return 0
    if (a === 6 && b === 6) return fromSixAll
    const key = a * 100 + b
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    const n = a + b + 1
    const val = tiebreakServerIsA(n)
      ? pA * win(a + 1, b) + qA * win(a, b + 1)
      : (1 - pB) * win(a + 1, b) + pB * win(a, b + 1)
    memo.set(key, val)
    return val
  }
  return win(0, 0)
}

// Probability side A wins the set. Games alternate serve from firstServer.
export function pSet(pA: number, pB: number, firstServer: Side = 0): number {
  const holdA = pGame(pA) // A wins its own service game
  const winReturnGame = 1 - pGame(pB) // A wins B's service game

  const memo = new Map<number, number>()
  function win(a: number, b: number): number {
    if (a >= 6 && a - b >= 2) return 1
    if (b >= 6 && b - a >= 2) return 0
    if (a === 6 && b === 6) {
      // Server due for the tiebreak = whoever serves game (a+b+1 = 13th).
      const aOpensTiebreak = (firstServer + a + b) % 2 === 0
      return aOpensTiebreak ? pTiebreak(pA, pB) : 1 - pTiebreak(pB, pA)
    }
    const key = a * 100 + b
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    const aServesThisGame = (firstServer + a + b) % 2 === 0
    const pWinGame = aServesThisGame ? holdA : winReturnGame
    const val = pWinGame * win(a + 1, b) + (1 - pWinGame) * win(a, b + 1)
    memo.set(key, val)
    return val
  }
  return win(0, 0)
}

// Best-of-3 match probability: M(s) = s^2 (1 + 2(1 - s)). Set probability is
// independent of who serves first, so firstServer is irrelevant here.
export function pMatchBo3(pA: number, pB: number): number {
  const s = pSet(pA, pB)
  return s * s * (1 + 2 * (1 - s))
}
