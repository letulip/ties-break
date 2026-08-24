// PLAYBACK TYPES for Phase 2 (match visualization) – what a screen shows, in what order, for how
// long. Source of truth for the playback timeline (viz/timeline.ts), the canvas renderer
// (viz/courtRenderer.ts) and MatchViewer's own state.
//
// ⚠ THE ANNOTATION CONTRACT MOVED OUT OF THIS FILE AND THIS FILE RE-EXPORTS IT (R2-06 / ARCH-04).
// `CourtPoint`, `COURT`, `Shot`, `Rally`, `AnnotatedPoint`, `AnnotatedMatch` and the three direction
// /result unions now live in `src/shared/matchViz.ts`, unchanged, because the ENGINE needs them too:
// `engine/match/rally.ts` produces a `Rally` and `engine/match/serveSpeed.ts` reads an
// `AnnotatedPoint`, and until this move both reached UP into `src/viz` to get them – invariant 1
// pointing backwards, which nothing caught because it deadlocked nothing and changed no outcome.
// A contract two layers share belongs under both of them.
//
// ⚠ THE RE-EXPORT IS NOT A COURTESY, IT IS THE REASON THE MOVE WAS AFFORDABLE. 14 files (24.08)
// read a moved name off this path and NONE of them had to change; the barrel is the same discipline
// `engine/world.ts` keeps for its own importers. Presentation code may keep reading either path.
//
// ⚠ COUNT IT, DO NOT QUOTE IT – and the cheap way to count is WRONG here. Two of the fourteen spell
// the import across several lines, so a per-line `^import.*from '…viz/types'` pattern skips both and
// answers 13. Match against the whole file text with the `[\s\S]*?` form the two architecture tests
// use, over the file list `git grep -lE "from '[^']*viz/types'" -- src tests tools e2e` gives:
// 14 read a moved name, 4 read only the playback types below.
//
// ⚠ ENGINE code may NOT – it reads `shared/matchViz` directly, and
// `tests/engine-viz-direction.test.ts` fails the build the moment an engine file imports this file.
//
// What stayed: `ViewMode`, `TimelineEventKind`, `TimelineEvent`, `Timeline`. No engine module has
// ever named one of them, and they are about the WATCHING rather than the match.

export type {
  CourtPoint,
  ServeDirection,
  RallyDirection,
  ShotResult,
  Shot,
  Rally,
  AnnotatedPoint,
  AnnotatedMatch,
} from '../shared/matchViz'
// ⚠ THE ONE RUNTIME NAME HERE: the court's own dimensions, re-exported as a value rather than a
// type. `viz/geometry.ts`, `viz/courtRenderer.ts` and MatchViewer read it off this path.
export { COURT } from '../shared/matchViz'

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
