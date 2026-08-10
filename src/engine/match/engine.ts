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
import { basePServe, modifiedPServe, retireHazard, type Streak } from './point'
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

// =================================================================================================
// SHE CAN STOP – the retirement, and why it is sampled the way it is
// =================================================================================================
//
// ⚠ THE ONE THING THAT MATTERS ABOUT THIS CODE: IT ADDS NO DRAW TO `rngFromSeed(opts.seed)`.
//
// The obvious implementation – one uniform per point inside the loop, against the hazard – would
// have re-based the point sequence of EVERY match in the game. Not the MAIN weekly stream (a match
// runs on `seed:<eventId>:r<round>`, an event-scoped sub-stream), so the frozen capture would have
// survived; but every scoreline in every save, every calibration band, every pinned box score and
// every re-run the visualiser performs would have moved, for a feature that fires in 2.73% of
// matches. That is a very large blast radius bought for nothing.
//
// So the two uniforms – ONE PER SIDE, drawn unconditionally, before the first point – come off
// `seed:ret`, a sub-stream private to this match seed. Consequences, all of them load-bearing:
//
//   * a match in which nobody retires is BYTE-IDENTICAL to the same match before this slice. Same
//     points, same winner, same stats, same log. Verified by reproduction, not asserted.
//   * the retirement is a pure function of `(a, b, opts)` exactly as the rest of the match is, so
//     MatchReplay / TournamentFlow / PracticeFlow re-run the stored `WorldMatch` and get the SAME
//     truncated match back with no new field to pass. That is the whole reason it lives in here
//     rather than being decided by the world after the fact.
//   * conditional pulls are impossible: both uniforms are taken before anything is compared.
//
// THE SAMPLER. Per point, per side, `retireHazard` gives a small probability that this player stops
// after it. Walking those forward and firing at the first point where the running SUM passes the
// side's uniform samples the stopping point from exactly that discrete hazard (the linear form –
// the sum is 0.03-0.10 over a whole match, where the union bound and 1-exp(-H) agree to a fraction
// of a percent, and a sum that never reaches u is the common case: she plays it out).
//
// ⚠ TRUNCATION IS NOT AN APPROXIMATION. The points up to n are the points this match played,
// whatever happens after n – the hazard reads only state up to n, so cutting the trajectory at n
// gives precisely the match that was played up to the moment she stopped. Nothing is "rewritten".
//
// ⚠ BOTH SIDES CARRY IT, and neither is "the kid": this function has never known which side the
// player is and must not learn. The rate is therefore calibrated as the research states it – the
// share of MATCHES that end in a retirement by either player – and the world decides what a
// retirement MEANS for the side it happens to (engine/world.ts finalizeTournament). Her opponent
// stopping is a full, undiscounted win for her, which is what the rulebooks say and what
// `MatchResult.winner` already means.

export function simulateMatch(a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): MatchResult {
  const rng = rngFromSeed(opts.seed)
  const score = createScore(opts.firstServer)
  const players: [MatchPlayer, MatchPlayer] = [a, b]
  // The two retirement uniforms and their running hazards. Drawn HERE, unconditionally and off a
  // stream nothing else touches – see the block comment above for why that is the whole feature.
  const retRng = rngFromSeed(`${opts.seed}:ret`)
  const retU: [number, number] = [retRng(), retRng()]
  const retH: [number, number] = [0, 0]
  let retired: { side: Side; pointNumber: number } | null = null
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

    // ...and then, between points, one of them may not come back out. Checked AFTER the point is
    // scored because that is when a player retires: the point she was in the middle of is played.
    // Skipped once the match is already decided – you cannot retire from a match you have just won,
    // and without this guard a hazard that fires on match point would steal a completed result.
    if (score.winner === null) {
      retH[0] += retireHazard(pointNumber, players[0].stamina)
      retH[1] += retireHazard(pointNumber, players[1].stamina)
      // Side 0 is asked first purely so the tie is TOTAL rather than order-of-evaluation-dependent.
      // Both firing on the same point needs two independent uniforms to be passed by two sums that
      // differ by the stamina ratio, on the same point, and has never been observed.
      const side: Side | null = retH[0] > retU[0] ? 0 : retH[1] > retU[1] ? 1 : null
      if (side !== null) {
        retired = { side, pointNumber }
        score.winner = side === 0 ? 1 : 0
      }
    }
  }

  // A retirement at the change of ends leaves an empty set on the sheet. Real result sheets print
  // "6-4 ret.", not "6-4 0-0 ret." – it is the one case where the partial set says nothing that the
  // completed sets have not already said. Anything with a point in it is kept.
  const sets = score.sets
  if (retired && sets.length > 1 && sets[sets.length - 1].a === 0 && sets[sets.length - 1].b === 0) {
    sets.pop()
  }

  return {
    winner: score.winner as Side,
    sets,
    stats,
    log,
    totalPoints: pointNumber,
    seed: opts.seed,
    // Absent, not `undefined`-valued, on the overwhelming majority of matches: an optional key that
    // is never written is the shape every historical save and every hand-built fixture already has.
    ...(retired ? { retired } : {}),
  }
}
