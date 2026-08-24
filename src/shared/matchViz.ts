// THE MATCH-ANNOTATION CONTRACT – neutral ground, owned by neither side (R2-06 / ARCH-04).
//
// ⚠ WHY THIS FILE EXISTS, AND IT IS A DIRECTION FIX RATHER THAN A NEW CONCEPT. Every declaration
// below stood in `src/viz/types.ts` verbatim, and three engine modules imported them from there:
// `match/rally.ts` (eight types plus the runtime `COURT`), `match/serveSpeed.ts` (`AnnotatedPoint`)
// and the box score. That is the engine depending on the presentation layer – invariant 1 pointing
// backwards – and nothing caught it: there was no runtime cycle, match outcomes never moved, and
// `scripts/engine-purity.mjs` only bans `vue`/`pinia` packages, so `src/viz` sailed straight past it.
//
// The vocabulary itself was never the problem. A rally is produced by `engine/match/rally.ts` and
// consumed by `viz/courtRenderer.ts`; a shot's bounce is a point on a real tennis court that both
// have to agree on. A contract two layers share belongs UNDER both of them, which is what
// `src/shared` is – already the home of `protocol/`, `money.ts` and `dates.ts`, and already a zone
// invariant 1 keeps framework-free.
//
// ⚠ WHAT DID *NOT* MOVE HERE, AND WHY THE LINE IS DRAWN EXACTLY THERE. `ViewMode`, `Timeline`,
// `TimelineEvent` and `TimelineEventKind` stayed in `src/viz/types.ts`. They describe PLAYBACK –
// what a screen shows, in what order, for how many seconds – and no engine module has ever named
// one. Moving them too would have made this file "the viz types, relocated", which is a rename
// rather than a boundary. What is here is what both sides genuinely share, and no more.
//
// ⚠ `src/viz/types.ts` RE-EXPORTS EVERY NAME BELOW, so this move cost its consumers nothing: the
// fifteen files that import `AnnotatedMatch` / `COURT` / `Shot` from `../viz/types` still compile
// against that path unchanged. Same barrel discipline `engine/world.ts` lives by. New PRESENTATION
// code may read either path; new ENGINE code must read this one, and
// `tests/engine-viz-direction.test.ts` fails the build if it does not.
//
// Court coordinates are in METRES, origin = net centre; side 0 defends y < 0, side 1 defends y > 0.

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
