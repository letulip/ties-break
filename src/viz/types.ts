// Shared contract for Phase 2 (match visualization). Source of truth for
// rally generation (engine/match/rally.ts), live win probability (engine/match/liveProb.ts),
// the playback timeline (viz/timeline.ts) and the canvas renderer (viz/courtRenderer.ts).

import type { Side, MatchResult, PointLogEntry } from '../engine/match/types'

/** Court coordinates in meters. Origin = net center; side 0 defends y < 0, side 1 defends y > 0. */
export interface CourtPoint {
  x: number
  y: number
}

export const COURT = {
  /** singles half-width */
  halfWidth: 4.115,
  /** baseline distance from net */
  halfLength: 11.885,
  /** service line distance from net */
  serviceLine: 6.4,
  /** doubles half-width (visual margin only) */
  doublesHalfWidth: 5.485,
} as const

export type ServeDirection = 'wide' | 'body' | 'T'
export type RallyDirection = 'cross' | 'middle' | 'line'
export type ShotResult = 'in' | 'winner' | 'net' | 'out'

export interface Shot {
  by: Side
  kind: 'serve1' | 'serve2' | 'rally'
  direction: ServeDirection | RallyDirection
  /** where the ball lands; for result 'net' the y is ~0 */
  bounce: CourtPoint
  result: ShotResult
}

export interface Rally {
  pointNumber: number
  /** alternating hitters starting with the server; serve faults repeat the server */
  shots: Shot[]
  ace: boolean
  doubleFault: boolean
}

export interface AnnotatedPoint {
  entry: PointLogEntry
  rally: Rally
  /** side A's match-win probability AFTER this point (1 or 0 after the last point) */
  winProbA: number
  /** true if this point was served into the deuce court (even point-parity in the game) */
  deuceCourt: boolean
  /** a regular game ended with this point */
  gameEnd: boolean
  /** a set ended with this point */
  setEnd: boolean
}

export interface AnnotatedMatch {
  result: MatchResult
  points: AnnotatedPoint[]
}

/** Playback modes: 'skip' shows no points (straight to the result screen). */
export type ViewMode = 'full' | 'key' | 'skip'

export type TimelineEventKind =
  | 'point-start' // camera/score setup for the point
  | 'shot' // ball flight ending at shot.bounce
  | 'point-end' // flash result, update score overlay
  | 'game-end'
  | 'set-end'
  // Round 4 item 3: ends-change beat. Inserted right after the qualifying point's own
  // point-end/game-end/set-end, before the next point-start (never after the match's
  // final point – see computeEndsSwaps in timeline.ts).
  | 'change-ends'
  // Round-7 item 10: a silent, static hold (no shot, no cue) so applause has room to ring
  // out before the next point's first hit. Emitted after each point-end (tiny) and after a
  // game-end/set-end (longer), never on the match's final point. Carries the trailing
  // point's index; the viewer just holds the court on that point while it elapses.
  | 'gap'
  | 'match-end'

export interface TimelineEvent {
  kind: TimelineEventKind
  /** seconds from playback start, at speed 1 */
  t: number
  /** seconds this event spans, at speed 1 */
  duration: number
  pointIndex: number
  /** for kind 'shot': index into the rally's shots */
  shotIndex?: number
}

export interface Timeline {
  events: TimelineEvent[]
  /** total seconds at speed 1 */
  duration: number
  mode: ViewMode
}
