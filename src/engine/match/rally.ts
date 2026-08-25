// Package D – rally generation. The engine's log is authoritative for WHO wins
// each point; rally generation is pure presentation: it replays the log through
// the scoring FSM to annotate per-point context, then synthesizes a plausible,
// deterministic rally that is consistent with the recorded winner. It never
// influences outcomes. RNG is seeded per point and independent of the outcome RNG.

import type { MatchPlayer, MatchOptions, MatchResult, Side } from './types'
// R2-06: the annotation vocabulary and the court's own dimensions come from the neutral leaf
// `shared/matchViz.ts`, NOT from `viz/types.ts` where they used to live. This module PRODUCES a
// `Rally`; the renderer consumes one; a contract both sides need cannot be owned by one of them,
// and an engine file importing `src/viz` is invariant 1 backwards. `viz/types.ts` re-exports every
// name below, so nothing on the presentation side moved. See tests/engine-viz-direction.test.ts.
import type {
  AnnotatedMatch,
  AnnotatedPoint,
  CourtPoint,
  Rally,
  Shot,
  ServeDirection,
  RallyDirection,
  ShotResult,
} from '../../shared/matchViz'
import { COURT } from '../../shared/matchViz'
import { createScore, awardPoint } from './scoring'
import { basePServe } from './point'
import { rngFromSeed, type Rng } from '../rng'
import { expectedServeSpeed, LEGACY_SNAPSHOT_AGE } from './serveSpeed'
import { matchWinProbability } from './liveProb'

// --- tunable constants (exported for reference/tests) ------------------------
export const FIRST_SERVE_IN = 0.62
// Rolled BEFORE the first-serve draw on receiver-won points (architect ruling):
// DF -> both serves fault; otherwise the normal serve flow (second serve in).
export const DF_GIVEN_RECEIVER_WIN = 0.09
export const ACE_GIVEN_SERVER_WIN: Record<'atp' | 'wta', number> = { atp: 0.1, wta: 0.06 }
export const WINNER_ENDING = 0.3
const FIRST_FAULT_OUT = 0.85 // a missed serve is 'out' 85% / 'net' 15%
const RALLY_ERROR_OUT = 0.7 // a non-winner rally error is 'out' 70% / 'net' 30%

// Front-loaded rally-length buckets: [lo, hi, weight]. Length counts alternating
// shots (the in-serve is shot 1); faulted serves are not counted here.
const LENGTH_BUCKETS: [number, number, number][] = [
  [2, 3, 0.38],
  [4, 5, 0.27],
  [6, 8, 0.2],
  [9, 12, 0.1],
  [13, 18, 0.05],
]

// Serve direction weights and their |x| landing bands inside the service box.
const SERVE_DIR: [ServeDirection, number][] = [
  ['T', 0.4],
  ['wide', 0.4],
  ['body', 0.2],
]
const SERVE_X_BAND: Record<ServeDirection, [number, number]> = {
  T: [0, 0.55],
  body: [0.9, 2.2],
  wide: [3.0, 4.0],
}
const SERVE_DEPTH: [number, number] = [3.2, 6.2]

// Rally direction weights.
const RALLY_DIR: [RallyDirection, number][] = [
  ['cross', 0.6],
  ['middle', 0.2],
  ['line', 0.2],
]

// --- small RNG helpers -------------------------------------------------------
function uniform(rng: Rng, lo: number, hi: number): number {
  return lo + rng() * (hi - lo)
}
function pickWeighted<T>(rng: Rng, entries: [T, number][]): T {
  let r = rng()
  for (const [value, w] of entries) {
    if (r < w) return value
    r -= w
  }
  return entries[entries.length - 1][0]
}
function sampleLength(rng: Rng): number {
  let r = rng()
  for (const [lo, hi, w] of LENGTH_BUCKETS) {
    if (r < w) return lo + Math.floor(rng() * (hi - lo + 1))
    r -= w
  }
  const [lo, hi] = [LENGTH_BUCKETS[LENGTH_BUCKETS.length - 1][0], LENGTH_BUCKETS[LENGTH_BUCKETS.length - 1][1]]
  return lo + Math.floor(rng() * (hi - lo + 1))
}
function sgn(x: number): 1 | -1 {
  return x >= 0 ? 1 : -1
}

// --- serve placement ---------------------------------------------------------

// THE ACE RATE IS THE SERVE SPEED NOW (owner, 31.07: «если можем сделать так, чтобы скорость подачи
// менялась и на что-то в матче влияла - это будет топ»).
//
// ⚠ AND IT COSTS NO DOUBLE COUNTING, which is the only reason it is allowed. Read this file's own
// header: the engine's log already decided who won the point, and an ace is this layer NARRATING a
// won point as unreturned. So the speed changes what the match LOOKS like - box score, commentary -
// and cannot change who wins a single point. Feeding the speed into `basePServe` instead would
// replace a probability calibrated to 1.2 points over 88,500 matches with a physical model, and
// that is a project rather than a line.
//
// The shipped constants are preserved as the value at ACE_SPEED_REF, so a server of professional
// pace still aces at exactly the shipped rate on each surface. What is new is everybody else: below
// ACE_SPEED_FLOOR a serve is simply returnable and the ace disappears, which is why a fourteen-year-
// old at 117 km/h now aces about a third as often as a nineteen-year-old at 161. That was the point.
//
// RNG: the draw is untouched - still exactly one `rng()` per server-won point, in the same place.
// Only the threshold it is compared against moves, the same post-draw shape `injuryTau` uses.

/** The pace at which the shipped per-tour ace constant is reproduced exactly: a professional first
 *  serve, the speed the old flat model was implicitly describing for everybody. */
export const ACE_SPEED_REF = 155
/** Below this a serve is returnable at this level and aces stop. Roughly a fourteen-year-old's base
 *  before any skill is added, so a beginner's serve is put back in play. */
export const ACE_SPEED_FLOOR = 95
/** Ceiling on the multiplier, so the very biggest server tops out instead of running away. At 1.8 a
 *  180 km/h serve aces ~11% of the points she wins on serve, which is a real WTA power server. */
export const ACE_SPEED_MAX_FACTOR = 1.8

/** How much of the shipped ace rate a serve of `speed` km/h earns. Linear from 0 at the floor
 *  through 1 at the reference, capped. Pure, zero draws. */
export function aceSpeedFactor(speed: number): number {
  const raw = (speed - ACE_SPEED_FLOOR) / (ACE_SPEED_REF - ACE_SPEED_FLOOR)
  return Math.max(0, Math.min(ACE_SPEED_MAX_FACTOR, raw))
}

function aceProbability(opts: MatchOptions, serverSpeed: number): number {
  let p = ACE_GIVEN_SERVER_WIN[opts.tour]
  if (opts.surface === 'grass') p *= 1.5
  else if (opts.surface === 'clay') p *= 0.6
  return p * aceSpeedFactor(serverSpeed)
}

// Sign of the serve's landing x, from the deuce/ad court and the receiver's side.
function serveXSign(deuceCourt: boolean, receiver: Side): 1 | -1 {
  const base: 1 | -1 = receiver === 1 ? 1 : -1 // deuce-court default
  return (deuceCourt ? base : ((-base) as 1 | -1)) as 1 | -1
}
// Serve lands in the receiver's half: side 1 defends y>0, side 0 defends y<0.
function serveYSign(receiver: Side): 1 | -1 {
  return receiver === 1 ? 1 : -1
}

function inServe(
  rng: Rng,
  kind: 'serve1' | 'serve2',
  server: Side,
  receiver: Side,
  deuceCourt: boolean,
): Shot {
  const dir = pickWeighted(rng, SERVE_DIR)
  const xs = serveXSign(deuceCourt, receiver)
  const ys = serveYSign(receiver)
  const [xlo, xhi] = SERVE_X_BAND[dir]
  const bounce: CourtPoint = {
    x: xs * uniform(rng, xlo, xhi),
    y: ys * uniform(rng, SERVE_DEPTH[0], SERVE_DEPTH[1]),
  }
  return { by: server, kind, direction: dir, bounce, result: 'in' }
}

function faultServe(
  rng: Rng,
  kind: 'serve1' | 'serve2',
  server: Side,
  receiver: Side,
  deuceCourt: boolean,
): Shot {
  const dir = pickWeighted(rng, SERVE_DIR)
  const xs = serveXSign(deuceCourt, receiver)
  const ys = serveYSign(receiver)
  const net = rng() >= FIRST_FAULT_OUT
  let bounce: CourtPoint
  let result: ShotResult
  if (net) {
    result = 'net'
    bounce = { x: xs * uniform(rng, 0.2, 3.5), y: 0 }
  } else {
    result = 'out'
    // long (past the service line) or wide of the box, by 0.1..0.8 m.
    if (rng() < 0.5) {
      bounce = {
        x: xs * uniform(rng, 0.2, 3.8),
        y: ys * uniform(rng, COURT.serviceLine + 0.1, COURT.serviceLine + 0.8),
      }
    } else {
      bounce = {
        x: xs * uniform(rng, COURT.halfWidth + 0.1, COURT.halfWidth + 0.8),
        y: ys * uniform(rng, SERVE_DEPTH[0], SERVE_DEPTH[1]),
      }
    }
  }
  return { by: server, kind, direction: dir, bounce, result }
}

// --- rally-stroke placement --------------------------------------------------
function rallyShot(rng: Rng, hitter: Side, prevBounce: CourtPoint, result: ShotResult): Shot {
  const dir = pickWeighted(rng, RALLY_DIR)
  const ys = (hitter === 0 ? 1 : -1) as 1 | -1 // ball lands on the opponent's half

  // Landing x-half relative to the hitter's current position (the previous bounce).
  const prevXSign: 1 | -1 = prevBounce.x === 0 ? 1 : sgn(prevBounce.x)
  let xSign: 1 | -1
  if (dir === 'cross') xSign = (-prevXSign) as 1 | -1
  else if (dir === 'line') xSign = prevXSign
  else xSign = rng() < 0.5 ? 1 : -1 // middle: sign is cosmetic

  let bounce: CourtPoint
  if (result === 'net') {
    bounce = { x: xSign * uniform(rng, 0.1, 3.6), y: 0 }
  } else if (result === 'out') {
    if (rng() < 0.5) {
      // long: beyond the baseline
      bounce = { x: xSign * uniform(rng, 0.4, 3.6), y: ys * uniform(rng, 11.9, 13.0) }
    } else {
      // wide: beyond the singles sideline
      bounce = { x: xSign * uniform(rng, 4.2, 5.3), y: ys * uniform(rng, 6.5, 11.5) }
    }
  } else if (result === 'winner') {
    // deeper or wider than a neutral ball, but inside the court.
    if (rng() < 0.5) {
      bounce = { x: xSign * uniform(rng, 0.4, 3.6), y: ys * uniform(rng, 9.0, 11.6) }
    } else {
      bounce = { x: xSign * uniform(rng, 3.2, 4.05), y: ys * uniform(rng, 6.5, 11.5) }
    }
  } else {
    // neutral 'in'
    if (dir === 'middle') {
      bounce = { x: xSign * uniform(rng, 0.0, 1.4), y: ys * uniform(rng, 6.5, 11.5) }
    } else {
      bounce = { x: xSign * uniform(rng, 0.4, 3.8), y: ys * uniform(rng, 6.5, 11.5) }
    }
  }
  return { by: hitter, kind: 'rally', direction: dir, bounce, result }
}

// --- one point's rally -------------------------------------------------------
function generateRally(
  opts: MatchOptions,
  pointNumber: number,
  server: Side,
  winner: Side,
  deuceCourt: boolean,
  /** jitter-free serve speed of each side, km/h - the ace rate's only new input */
  speeds: [number, number],
): Rally {
  const receiver: Side = (1 - server) as Side
  const rng = rngFromSeed(opts.seed + '#' + pointNumber)
  const shots: Shot[] = []

  // Double fault is decided BEFORE the first-serve draw (architect ruling):
  // on a receiver-won point, DF with conditional probability 0.09 -> both serves fault.
  if (winner === receiver && rng() < DF_GIVEN_RECEIVER_WIN) {
    shots.push(faultServe(rng, 'serve1', server, receiver, deuceCourt))
    shots.push(faultServe(rng, 'serve2', server, receiver, deuceCourt))
    return { pointNumber, shots, ace: false, doubleFault: true }
  }

  // Non-DF point: normal serve flow. A missed first serve always leads to an in
  // second serve (the in-serve below), regardless of who won the point.
  const firstIn = rng() < FIRST_SERVE_IN
  if (!firstIn) shots.push(faultServe(rng, 'serve1', server, receiver, deuceCourt))
  const inServeKind: 'serve1' | 'serve2' = firstIn ? 'serve1' : 'serve2'

  if (winner === server) {
    // Server won: chance of an ace (unreturned in-serve), scaled by how hard she actually serves.
    if (rng() < aceProbability(opts, speeds[server])) {
      shots.push(inServe(rng, inServeKind, server, receiver, deuceCourt))
      return { pointNumber, shots, ace: true, doubleFault: false }
    }
  }

  // Normal point: the in-serve, then a rally to the recorded winner.
  shots.push(inServe(rng, inServeKind, server, receiver, deuceCourt))

  // Target length (alternating shots incl. the in-serve as shot 1).
  let target = sampleLength(rng)
  if (opts.surface === 'clay') target += 1
  else if (opts.surface === 'grass') target = Math.max(2, target - 1)

  const winnerEnding = rng() < WINNER_ENDING
  const endResult: ShotResult = winnerEnding ? 'winner' : rng() < RALLY_ERROR_OUT ? 'out' : 'net'

  // Parity fix-up: the forced last hitter is the point winner (winner ending) or
  // the loser (error ending). Shot i is by server if i is odd, receiver if even.
  // SYMMETRIC (architect ruling): wrong parity moves the target ±1 by a 50/50
  // draw from this rally's RNG stream; -1 that would drop below 2 non-fault
  // shots becomes +1 (a naive clamp to 2 would break the parity itself).
  const requiredHitter: Side = winnerEnding ? winner : ((1 - winner) as Side)
  const hitterOf = (i: number): Side => (i % 2 === 1 ? server : receiver)
  if (hitterOf(target) !== requiredHitter) {
    const down = rng() < 0.5
    target = down && target - 1 >= 2 ? target - 1 : target + 1
  }

  let prev = shots[shots.length - 1].bounce // in-serve bounce (on the receiver's side)
  for (let i = 2; i <= target; i++) {
    const hitter = hitterOf(i)
    const result: ShotResult = i === target ? endResult : 'in'
    const shot = rallyShot(rng, hitter, prev, result)
    shots.push(shot)
    prev = shot.bounce
  }

  return { pointNumber, shots, ace: false, doubleFault: false }
}

/**
 * Replay the match log through the scoring FSM, annotating each point with its
 * rally, pre-point deuce/ad court, game/set-end flags, and the post-point live
 * win probability for side A.
 */
export function annotateMatch(
  result: MatchResult,
  a: MatchPlayer,
  b: MatchPlayer,
  opts: MatchOptions,
): AnnotatedMatch {
  const pA = basePServe(a, b, opts)
  const pB = basePServe(b, a, opts)
  // Jitter-free, so the ace rate is a property of the PLAYER and not of the point: within one match
  // every serve she strikes is the same girl's serve, and the +/-8 is how hard she happened to hit
  // that one. Resolved once here rather than per point - `expectedServeSpeed` is pure.
  const speeds: [number, number] = [
    expectedServeSpeed(a.age ?? LEGACY_SNAPSHOT_AGE, a.serve),
    expectedServeSpeed(b.age ?? LEGACY_SNAPSHOT_AGE, b.serve),
  ]
  const score = createScore(opts.firstServer ?? 0)
  const points: AnnotatedPoint[] = []

  for (const entry of result.log) {
    // Pre-point context.
    const server = score.server
    const deuceCourt = (score.game.a + score.game.b) % 2 === 0
    const bTiebreak = score.inTiebreak
    const bSetsLen = score.sets.length

    const rally = generateRally(opts, entry.pointNumber, server, entry.winner, deuceCourt, speeds)

    // Advance the FSM, then read post-point flags and live probability.
    awardPoint(score, entry.winner)

    const matchEnded = score.winner !== null
    const setEnd = matchEnded || score.sets.length > bSetsLen
    const regularGameEnd = !bTiebreak && score.game.a === 0 && score.game.b === 0
    const gameEnd = setEnd || regularGameEnd
    const winProbA = matchWinProbability(score, pA, pB)

    points.push({ entry, rally, winProbA, deuceCourt, gameEnd, setEnd })
  }

  return { result, points }
}
