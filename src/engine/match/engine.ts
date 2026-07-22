// Package C – the match simulation loop and its closed-form fast path.
// Consumes the scoring FSM (scoring.ts), the point model (point.ts) and the
// closed-form math (closedForm.ts); adds only the RNG-driven point loop and stats.

import type {
  MatchPlayer,
  MatchOptions,
  MatchResult,
  SideMatchStats,
  PointContext,
  PointLogEntry,
  Side,
} from './types'
import { createScore, awardPoint, contextOf, formatScore } from './scoring'
import { basePServe, modifiedPServe, type Streak } from './point'
import { pMatchBo3 } from './closedForm'
import { rngFromSeed } from '../rng'

// Closed-form match win probability from base serve strengths only. No RNG, no
// per-point modifiers – the world "fast sim" path when a full log isn't needed.
export function fastMatchProbability(a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): number {
  return pMatchBo3(basePServe(a, b, opts), basePServe(b, a, opts))
}

function emptyStats(): SideMatchStats {
  return {
    pointsWon: 0,
    servePointsPlayed: 0,
    servePointsWon: 0,
    breakPointsFaced: 0,
    breakPointsSaved: 0,
    breaksWon: 0,
    longestPointStreak: 0,
  }
}

// True when the side holding `myPts` wins the game by winning the next point
// (raw margin rule, mirroring scoring.ts's gameWon over in-progress counters).
function winsGameNext(myPts: number, oppPts: number): boolean {
  const m = myPts + 1
  return Math.max(m, oppPts) >= 4 && m - oppPts >= 2
}

export function simulateMatch(a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): MatchResult {
  const rng = rngFromSeed(opts.seed)
  const score = createScore(opts.firstServer)
  const players: [MatchPlayer, MatchPlayer] = [a, b]
  // Base serve-win prob per server; constant across the match (skills/surface only).
  const baseServe: [number, number] = [basePServe(a, b, opts), basePServe(b, a, opts)]
  const momentumOn = opts.momentum !== false

  const stats: [SideMatchStats, SideMatchStats] = [emptyStats(), emptyStats()]
  const log: PointLogEntry[] = []

  // Current consecutive-points streak, tracked over the whole match. Reused (not
  // reallocated) each point so the hot loop stays allocation-light.
  let streakSide: Side = 0
  let streakLen = 0
  const streakObj: Streak = { side: 0, length: 0 }

  let pointNumber = 0

  while (score.winner === null) {
    pointNumber++
    const server = score.server
    const receiver: Side = server === 0 ? 1 : 0

    // Set/match point can only arise on a point that both completes a game AND
    // sits in a set where a side is one game from winning it (or in a tiebreak).
    // On every other point setPointFor/matchPointFor are provably null, so the
    // O(structuredClone) contextOf probe is skipped and the context is built
    // directly. The result is identical to contextOf's on every point (asserted
    // by the equivalence test).
    const set = score.sets[score.sets.length - 1]
    let ctx: PointContext
    if (score.inTiebreak) {
      ctx = contextOf(score, pointNumber)
    } else {
      const serverPts = server === 0 ? score.game.a : score.game.b
      const receiverPts = server === 0 ? score.game.b : score.game.a
      const breakPoint = winsGameNext(receiverPts, serverPts)
      const gamePoint = breakPoint || winsGameNext(serverPts, receiverPts)
      if (gamePoint && (set.a >= 5 || set.b >= 5)) {
        ctx = contextOf(score, pointNumber)
      } else {
        ctx = { pointNumber, server, tiebreak: false, breakPoint, setPointFor: null, matchPointFor: null }
      }
    }

    // Momentum uses the streak state entering this point; gated by the option.
    let streakArg: Streak | null = null
    if (momentumOn && streakLen > 0) {
      streakObj.side = streakSide
      streakObj.length = streakLen
      streakArg = streakObj
    }
    const p = modifiedPServe(baseServe[server], players[server], players[receiver], ctx, streakArg)

    const serverWins = rng() < p
    const winner: Side = serverWins ? server : receiver

    const wasTiebreak = ctx.tiebreak
    awardPoint(score, winner)

    // Log after awardPoint so scoreAfter reflects the post-point score.
    log.push({
      pointNumber,
      server,
      tiebreak: ctx.tiebreak,
      breakPoint: ctx.breakPoint,
      setPointFor: ctx.setPointFor,
      matchPointFor: ctx.matchPointFor,
      winner,
      pServe: p,
      scoreAfter: formatScore(score),
    })

    // Stats.
    const sv = stats[server]
    sv.servePointsPlayed++
    if (serverWins) sv.servePointsWon++
    stats[winner].pointsWon++
    if (ctx.breakPoint) {
      sv.breakPointsFaced++
      if (serverWins) sv.breakPointsSaved++
    }
    // A regular game just completed iff it wasn't a tiebreak point and the game
    // counters reset to 0-0. If the receiver won that game, it's a break.
    if (!wasTiebreak && score.game.a === 0 && score.game.b === 0 && winner === receiver) {
      stats[receiver].breaksWon++
    }

    // Update the running streak and per-side longest streak.
    if (streakLen > 0 && streakSide === winner) {
      streakLen++
    } else {
      streakSide = winner
      streakLen = 1
    }
    if (streakLen > stats[streakSide].longestPointStreak) {
      stats[streakSide].longestPointStreak = streakLen
    }
  }

  return {
    winner: score.winner as Side,
    sets: score.sets,
    stats,
    log,
    totalPoints: pointNumber,
    seed: opts.seed,
  }
}
