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
/** Round 4 item 3: the "changing ends" beat length. Numerically equal to POINT_END_BIG
 *  today but kept as its own named constant since it's a conceptually different beat. */
export const CHANGE_ENDS = 0.9

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

/** Per-point ends-swap state, precomputed once over the whole match (see computeEndsSwaps). */
export interface EndsState {
  /** physical mapping in effect WHILE point i is being played: true = sides are
   *  swapped from the initial layout (side 0 defends the "other" physical baseline). */
  swappedDuring: boolean[]
  /** true when a change-ends beat should play immediately after point i's own events
   *  (point-end/game-end/set-end), before the next point-start. */
  changeEndsAfter: boolean[]
}

/**
 * Real-tennis change-of-ends rule (round 4 item 3): a LOCAL games-in-set counter resets
 * to 0 at every set boundary; ends swap whenever that counter is odd (1, 3, 5…). "Carried
 * across set boundaries by the same rule" is exactly this reset-and-reapply — no
 * cross-set arithmetic is needed: a set's last game already swaps automatically when its
 * total is odd, and when the total is even the next set's first game swaps instead,
 * which the same local-odd test produces for free. A concluded tiebreak always lands on
 * an odd local game index (a breaker only starts at 6-6 = 12 games played), so it always
 * swaps ends too, via the very same rule. During an UNFINISHED tiebreak, an independent
 * point counter fires an extra swap every 6 combined points (the ITF tiebreak rule); if
 * the tiebreak's final point happens to also be a multiple of 6, only the (already-true)
 * end-of-game rule fires for it, so there is never a double toggle.
 *
 * The beat is suppressed on the match's very last point index: nothing plays "changing
 * ends" after the match is already over.
 */
export function computeEndsSwaps(points: AnnotatedPoint[]): EndsState {
  const n = points.length
  const swappedDuring: boolean[] = new Array(n)
  const changeEndsAfter: boolean[] = new Array(n)
  const lastIndex = n - 1
  let swapped = false
  let gamesInSet = 0
  let tbPoints = 0

  for (let i = 0; i < n; i++) {
    swappedDuring[i] = swapped
    const p = points[i]
    let toggle = false

    if (p.gameEnd) {
      gamesInSet++
      if (gamesInSet % 2 === 1) toggle = true
      tbPoints = 0
      if (p.setEnd) gamesInSet = 0
    } else if (p.entry.tiebreak) {
      tbPoints++
      if (tbPoints % 6 === 0) toggle = true
    }

    changeEndsAfter[i] = toggle && i !== lastIndex
    if (toggle) swapped = !swapped
  }

  return { swappedDuring, changeEndsAfter }
}

export function buildTimeline(match: AnnotatedMatch, mode: ViewMode): Timeline {
  const points = match.points
  const lastIndex = points.length - 1
  const ends = computeEndsSwaps(points)
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
      if (ends.changeEndsAfter[i]) emit('change-ends', CHANGE_ENDS, i)
    }
  }

  // The match-end beat closes every mode (including 'skip', which shows nothing else).
  emit('match-end', MATCH_END, lastIndex < 0 ? 0 : lastIndex)

  return { events, duration: t, mode }
}
