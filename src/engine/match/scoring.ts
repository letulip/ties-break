// Package A – tennis scoring state machine (best-of-3 only). Pure, RNG-free.
// Deuce/advantage are NOT stored states: they emerge from the margin rule over the
// raw point counters in `score.game`. See docs/specs/phase1-match-engine.md.

import type { MatchScore, Side, PointContext } from './types'

const SIDES: Side[] = [0, 1]

export function createScore(firstServer: Side = 0): MatchScore {
  return {
    sets: [{ a: 0, b: 0 }],
    game: { a: 0, b: 0 },
    inTiebreak: false,
    server: firstServer,
    winner: null,
  }
}

export function awardPoint(score: MatchScore, winner: Side): void {
  if (score.winner !== null) throw new Error('cannot award a point: the match is already decided')

  if (winner === 0) score.game.a++
  else score.game.b++

  if (score.inTiebreak) {
    if (tiebreakWon(score.game.a, score.game.b)) {
      completeSetViaTiebreak(score, winner)
    } else {
      advanceTiebreakServer(score)
    }
    return
  }

  if (!gameWon(score.game.a, score.game.b)) return

  // The point winner won the game (they scored the deciding point).
  const set = currentSet(score)
  if (winner === 0) set.a++
  else set.b++
  score.game = { a: 0, b: 0 }

  if (setDecidedByGames(set)) {
    completeSet(score, winner)
    return
  }
  if (set.a === 6 && set.b === 6) {
    // At 6-6 the tiebreak is the next "game"; its opener is the player due to serve.
    score.inTiebreak = true
    score.server = flip(score.server)
    return
  }
  // Normal game end: serve alternates.
  score.server = flip(score.server)
}

export function contextOf(score: MatchScore, pointNumber: number): PointContext {
  const server = score.server
  const tiebreak = score.inTiebreak
  const breakPoint = computeBreakPoint(score)

  let setPointFor: Side | null = null
  let matchPointFor: Side | null = null
  if (score.winner === null) {
    const completedBefore = completedSetCount(score)
    for (const s of SIDES) {
      // Probe by replaying the point on a clone rather than re-deriving win logic.
      const probe = structuredClone(score)
      awardPoint(probe, s)
      if (probe.winner === s) matchPointFor = s
      if (completedSetCount(probe) > completedBefore) setPointFor = s
    }
  }

  return { pointNumber, server, tiebreak, breakPoint, setPointFor, matchPointFor }
}

export function formatScore(score: MatchScore): string {
  const setsPart = score.sets.map((s) => `${s.a}-${s.b}`).join(' ')
  const hasPoints = score.game.a > 0 || score.game.b > 0
  if (!hasPoints) return setsPart
  const gamePart = score.inTiebreak
    ? `TB ${score.game.a}-${score.game.b}`
    : formatGamePoints(score.game.a, score.game.b)
  return `${setsPart} ${gamePart}`
}

// --- internals ---------------------------------------------------------------

function flip(side: Side): Side {
  return (1 - side) as Side
}

function currentSet(score: MatchScore) {
  return score.sets[score.sets.length - 1]
}

function gameWon(a: number, b: number): boolean {
  return Math.max(a, b) >= 4 && Math.abs(a - b) >= 2
}

function tiebreakWon(a: number, b: number): boolean {
  return Math.max(a, b) >= 7 && Math.abs(a - b) >= 2
}

function setDecidedByGames(set: { a: number; b: number }): boolean {
  return Math.max(set.a, set.b) >= 6 && Math.abs(set.a - set.b) >= 2
}

/** Completed sets in the array (the in-progress set is the last element until the match ends). */
function completedSetCount(score: MatchScore): number {
  return score.winner !== null ? score.sets.length : score.sets.length - 1
}

function setWinsSoFar(score: MatchScore): [number, number] {
  const wins: [number, number] = [0, 0]
  for (const s of score.sets) {
    if (s.a > s.b) wins[0]++
    else if (s.b > s.a) wins[1]++
  }
  return wins
}

function completeSet(score: MatchScore, setWinner: Side): void {
  const wins = setWinsSoFar(score) // the just-finished set is already in the array
  if (wins[setWinner] >= 2) {
    score.winner = setWinner // leave `sets` holding completed sets only
    return
  }
  score.sets.push({ a: 0, b: 0 })
  score.inTiebreak = false
  score.server = flip(score.server) // continuous alternation across the set boundary
}

function completeSetViaTiebreak(score: MatchScore, tbWinner: Side): void {
  const set = currentSet(score)
  if (tbWinner === 0) set.a = 7
  else set.b = 7 // record the set as 7-6 in games

  const opener = tiebreakOpenerFrom(score.server, score.game.a + score.game.b)
  score.game = { a: 0, b: 0 }
  score.inTiebreak = false

  const wins = setWinsSoFar(score)
  if (wins[tbWinner] >= 2) {
    score.winner = tbWinner
    return
  }
  score.sets.push({ a: 0, b: 0 })
  // The tiebreak counts as one game for rotation: the next set opens with the
  // player who did NOT serve the tiebreak's first point.
  score.server = flip(opener)
}

// Tiebreak serve pattern relative to the opener: point 1 = opener, then serves
// alternate every two points -> S, O, O, S, S, O, O, S, ...
// `tbFlip(i)` is 0 when the server of point i is the opener, 1 otherwise.
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

function advanceTiebreakServer(score: MatchScore): void {
  const played = score.game.a + score.game.b // index of the point just played
  const opener = tiebreakOpenerFrom(score.server, played)
  score.server = tiebreakServer(opener, played + 1)
}

function computeBreakPoint(score: MatchScore): boolean {
  if (score.inTiebreak) return false
  const receiver = flip(score.server)
  const receiverPoints = receiver === 0 ? score.game.a : score.game.b
  const serverPoints = receiver === 0 ? score.game.b : score.game.a
  return gameWon(receiverPoints + 1, serverPoints)
}

function formatGamePoints(a: number, b: number): string {
  if (a >= 3 && b >= 3) {
    if (a === b) return '40-40'
    return a > b ? 'Ad-40' : '40-Ad'
  }
  const names = ['0', '15', '30', '40']
  return `${names[a]}-${names[b]}`
}
