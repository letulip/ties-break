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

// Round-7 item 10: trailing "quiet gap" beats so applause never overlaps the next hit.
// A tiny hold after every point-end, and a longer hold after a game-end / set-end, all
// BEFORE the next point-start. These are silent, static holds – timing only, no new cues.
//
// Round-7 (crowd-reaction pass): the reaction cues now fire at the SCORING instant (each
// event's START, see MatchViewer.startEvent), so these trailing gaps are what make the
// crowd's reaction clearly LEAD the next hit instead of overlapping it. They were grown so
// the reaction gets its moment: game-break and set-break gaps roughly doubled, and an
// ordinary point that earns an 'ooh' (converted break point / long-rally winner but no
// game/set end) now gets its own ~1s hold. Ordinary non-reaction points keep the tiny breath.
/** Tiny breath after an ordinary (non-reaction) point-end – no crowd cue to lead. */
export const POINT_END_GAP = 0.15
/** Hold after an ordinary point that triggers an 'ooh' but ends no game/set, so the reaction
 *  leads the next serve. Only these points use it; plain points keep POINT_END_GAP. */
export const OOH_GAP = 1.0
/** Trailing quiet after a game-end, so game applause rings out before the next hit. */
export const GAME_END_GAP = 1.3
/** Trailing quiet after a set-end (longer – the set-break applause is bigger). */
export const SET_END_GAP = 1.9

/** A point is "big" (long point-end) when it is a break/set/match point. */
function isBigPoint(p: AnnotatedPoint): boolean {
  const e = p.entry
  return e.breakPoint || e.setPointFor !== null || e.matchPointFor !== null
}

/** Mirror of MatchViewer's 'ooh' reaction test (kept in sync deliberately): a point earns a
 *  crowd 'ooh' when it ends cleanly (not on a miss) AND is either a converted break point
 *  (receiver wins a break point) or a long rally (>= 8 shots) finished with a winner. Used
 *  only to size the trailing quiet gap so the reaction leads the next point-start; the cue
 *  itself is decided independently in MatchViewer.startEvent. */
function isReactionPoint(p: AnnotatedPoint): boolean {
  const shots = p.rally.shots
  const lastShot = shots[shots.length - 1]
  if (lastShot?.result === 'out' || lastShot?.result === 'net') return false
  const e = p.entry
  const brokeServe = e.breakPoint && e.winner !== e.server
  const longWinnerRally = shots.length >= 8 && lastShot?.result === 'winner'
  return brokeServe || longWinnerRally
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
 * across set boundaries by the same rule" is exactly this reset-and-reapply – no
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

      // Round-7 item 10: the trailing quiet gaps exist only to give applause room before
      // the NEXT point-start. On the match's final point there is no next point (match-end
      // follows, itself a long beat), so all gaps are suppressed there – same "not on the
      // last point" rule the change-ends beat already uses.
      const notLast = i !== lastIndex

      emit('point-start', POINT_START, i)
      for (let s = 0; s < p.rally.shots.length; s++) {
        const shot = p.rally.shots[s]
        emit('shot', shot.kind === 'rally' ? RALLY_FLIGHT : SERVE_FLIGHT, i, s)
      }
      emit('point-end', isBigPoint(p) ? POINT_END_BIG : POINT_END, i)
      if (notLast) {
        // Trailing gap before the next point-start. An ordinary point that earns an 'ooh'
        // (converted break point / long-rally winner) but ends NO game/set gets the longer
        // OOH_GAP so the reaction leads the next serve; game/set-ending points keep the tiny
        // breath here (their bigger trailing quiet is the game-end/set-end gap below), and
        // plain points keep the tiny breath too.
        const oohOnly = !p.gameEnd && !p.setEnd && isReactionPoint(p)
        emit('gap', oohOnly ? OOH_GAP : POINT_END_GAP, i)
      }
      if (p.gameEnd) emit('game-end', GAME_END, i)
      if (p.gameEnd && notLast) emit('gap', GAME_END_GAP, i)
      if (p.setEnd) emit('set-end', SET_END, i)
      if (p.setEnd && notLast) emit('gap', SET_END_GAP, i)
      if (ends.changeEndsAfter[i]) emit('change-ends', CHANGE_ENDS, i)
    }
  }

  // The match-end beat closes every mode (including 'skip', which shows nothing else).
  emit('match-end', MATCH_END, lastIndex < 0 ? 0 : lastIndex)

  return { events, duration: t, mode }
}
