// Package E – playback timeline. Pure and fully testable: turns an AnnotatedMatch
// into a flat, strictly-sequential list of timed events at speed 1. The Vue layer
// owns the clock and simply walks these events; it never recomputes timing.

import type { AnnotatedMatch, AnnotatedPoint, Timeline, TimelineEvent, ViewMode } from './types'

// Speed-1 timing constants (seconds). Exported so tests pin them to the spec.
export const POINT_START = 0.5
export const SERVE_FLIGHT = 0.55
export const RALLY_FLIGHT = 0.42
export const POINT_END = 0.5
export const POINT_END_BIG = 0.9
export const GAME_END = 0.7
export const SET_END = 1.6
export const MATCH_END = 2.0

/** A point is "big" (long point-end) when it is a break/set/match point. */
function isBigPoint(p: AnnotatedPoint): boolean {
  const e = p.entry
  return e.breakPoint || e.setPointFor !== null || e.matchPointFor !== null
}

/** Points shown in 'key' mode: any consequential point, plus always the final point. */
function isKeyPoint(p: AnnotatedPoint, index: number, lastIndex: number): boolean {
  if (index === lastIndex) return true
  const e = p.entry
  return (
    e.breakPoint ||
    e.setPointFor !== null ||
    e.matchPointFor !== null ||
    e.tiebreak ||
    p.gameEnd ||
    p.setEnd
  )
}

export function buildTimeline(match: AnnotatedMatch, mode: ViewMode): Timeline {
  const points = match.points
  const lastIndex = points.length - 1
  const events: TimelineEvent[] = []
  let t = 0

  const emit = (kind: TimelineEvent['kind'], duration: number, pointIndex: number, shotIndex?: number) => {
    const ev: TimelineEvent = { kind, t, duration, pointIndex }
    if (shotIndex !== undefined) ev.shotIndex = shotIndex
    events.push(ev)
    t += duration
  }

  if (mode !== 'skip') {
    for (let i = 0; i <= lastIndex; i++) {
      const p = points[i]
      if (mode === 'key' && !isKeyPoint(p, i, lastIndex)) continue

      emit('point-start', POINT_START, i)
      for (let s = 0; s < p.rally.shots.length; s++) {
        const shot = p.rally.shots[s]
        emit('shot', shot.kind === 'rally' ? RALLY_FLIGHT : SERVE_FLIGHT, i, s)
      }
      emit('point-end', isBigPoint(p) ? POINT_END_BIG : POINT_END, i)
      if (p.gameEnd) emit('game-end', GAME_END, i)
      if (p.setEnd) emit('set-end', SET_END, i)
    }
  }

  // The match-end beat closes every mode (including 'skip', which shows nothing else).
  emit('match-end', MATCH_END, lastIndex < 0 ? 0 : lastIndex)

  return { events, duration: t, mode }
}
