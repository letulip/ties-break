// THE MATCH CLOCK (round 17 item 24, owner: show the elapsed match time between the Live badge and
// the weather). A pure, RNG-free derivation of HOW LONG A MATCH TOOK from what the match actually
// contains - and, from that, where the reading stands at any position on the playback timeline.
//
// ---------------------------------------------------------------------------------------------
// ⚠ THE CLOCK IS DIEGETIC. IT MEASURES THE MATCH, NOT THE PLAYER'S WALL CLOCK
// ---------------------------------------------------------------------------------------------
// A two-setter is not twenty minutes long, and it is not the eight minutes of playback it takes to
// watch one either. The owner's ruling has two halves and this module is the first: the reading has
// to correlate with a real tennis match, and x1 / x2 / x4 have to advance it at different rates.
// Both fall out of ONE decision - the clock is a function of the PLAYBACK POSITION, not of elapsed
// real time. The viewer's playback clock already runs at `speed x` real seconds per timeline second,
// so a reading derived from it advances at exactly `speed x` too, with nothing here knowing what the
// speed pills say.
//
// `tests/component/match-viewer.test.ts` drives the rAF clock by hand at each speed and asserts the
// three rates against each other, which is the only honest way to check it.
//
// ---------------------------------------------------------------------------------------------
// WHERE THE DURATION COMES FROM - the match's own contents, never a constant per set
// ---------------------------------------------------------------------------------------------
// Four terms, and three of them are the rulebook's own numbers rather than anything invented here:
//
//   * BALL IN PLAY, per strike. The one term that is ours, and it is anchored: at the engine's
//     measured 5.7 shots per point (400 matches, tools/match-clock-probe.ts) `secondsPerShot: 1.4`
//     gives a mean rally of 8.0 seconds, which is the published women's-tennis rally duration. So
//     the length of a point is a function of how long the RALLY was - a 16-shot rally really does
//     take longer on this clock than an ace, which is the whole reason a shot count is the input.
//   * BETWEEN POINTS. The ITF allows 25 seconds; with the shot clock the tour average sits around
//     20-23. 23 is the pick and it is the only dial that was swept - see the spec.
//   * THE CHANGEOVER, 90 seconds, and it lands on exactly the games the ends actually change on
//     (1, 3, 5 ... of each set) because `computeEndsSwaps` already answers that question for the
//     playback's own "changing ends" beat. ⚠ A TIE-BREAK'S six-point end changes are NOT rest
//     periods under the rules and are not counted here: the test below is `gameEnd`, and the only
//     game a tie-break ends is its last point.
//   * THE SET BREAK, 120 seconds.
//
// MEASURED against 400 seeded matches across the three surfaces (tools/match-clock-probe.ts):
//
//   | matches      | shortest | p10  | median | p90   | longest |
//   |--------------|----------|------|--------|-------|---------|
//   | two sets     | 0:46     | 1:03 | 1:19   | 1:38  | 1:58    |
//   | three sets   | 1:21     | 1:36 | 1:58   | 2:24  | 2:45    |
//
// which is the shape of real women's tennis: straight sets a bit over an hour and a quarter, a
// three-setter a couple of hours. The flat `42 s x totalPoints` this replaced read 1:31 for the
// median two-setter - a straight-sets match as long as most three-setters - because a constant per
// point cannot know that a set break is two minutes and a point is twenty-three seconds.
//
// ⚠ AND IT IS THE SAME NUMBER THE BOX SCORE PRINTS. `MatchStats.durationEstimate` calls
// `matchDurationSeconds` rather than keeping its own arithmetic, for the reason the serve speed
// already lives by (viz/match/matchStats.ts): two readings of one fact, computed twice, are how
// two readings of one fact come to disagree.
//
// ⚠ NO RNG, in this module or under it. The inputs are the shot counts, the game/set flags and the
// change-of-ends rule - all pure functions of a resolved match.

import type { AnnotatedMatch, Timeline } from './types'
import { computeEndsSwaps } from './timeline'

/** The four terms, in seconds. Three of them are the rulebook's; see the header for the fourth. */
export const MATCH_CLOCK = {
  /** ball in play per strike - calibrated so the mean rally is the published 8 seconds */
  secondsPerShot: 1.4,
  /** the rest between two points of the same game (ITF allows 25; the tour plays ~20-23) */
  betweenPoints: 23,
  /** the sit-down on a change of ends */
  changeover: 90,
  /** the break between sets */
  setBreak: 120,
} as const

/**
 * MATCH SECONDS ELAPSED WHEN EACH POINT BEGINS, plus one final entry: the match's whole duration.
 *
 * Length is `points.length + 1`, so `starts[i]` is where point `i` starts and `starts[i + 1]` is
 * where it (and its rest) end. Total by construction, including a match with no points at all.
 */
export function pointStartSeconds(match: AnnotatedMatch): number[] {
  const points = match.points
  const ends = computeEndsSwaps(points)
  const starts: number[] = new Array(points.length + 1)
  const last = points.length - 1
  let t = 0
  for (let i = 0; i < points.length; i++) {
    starts[i] = t
    const p = points[i]
    t += p.rally.shots.length * MATCH_CLOCK.secondsPerShot
    // The rest AFTER this point. Nothing follows the last one - a match does not have a changeover
    // at the end of it - and the branches are ordered biggest-first because a set-ending point is a
    // game-ending point too.
    if (i === last) continue
    if (p.setEnd) t += MATCH_CLOCK.setBreak
    else if (p.gameEnd && ends.changeEndsAfter[i]) t += MATCH_CLOCK.changeover
    else t += MATCH_CLOCK.betweenPoints
  }
  starts[points.length] = t
  return starts
}

/** How long the whole match took, in match seconds. */
export function matchDurationSeconds(match: AnnotatedMatch): number {
  const starts = pointStartSeconds(match)
  return starts[starts.length - 1] ?? 0
}

/**
 * THE MAP FROM PLAYBACK POSITION TO MATCH TIME - a short ordered list of anchors, walked linearly.
 *
 * ⚠ IT IS BUILT PER TIMELINE, NOT PER MATCH, AND THAT IS WHAT MAKES 'key' MODE HONEST. The key cut
 * drops points the players nonetheless PLAYED, so the same match is 580 playback seconds in 'full'
 * and 184 in 'key' while being the same hour and twenty minutes of tennis either way. Anchoring each
 * SHOWN point's first beat to that point's true match-time start means the reading crosses the
 * skipped block while the shown point is on screen, and still arrives at the true final duration.
 * A per-point clock would instead report a 'key' match as twenty minutes long, which is the lie.
 */
export interface ClockTrack {
  /** playback seconds at speed 1, strictly ascending */
  ts: number[]
  /** match seconds at each of those playback times */
  secs: number[]
}

export function buildClockTrack(match: AnnotatedMatch, timeline: Timeline): ClockTrack {
  const starts = pointStartSeconds(match)
  const ts: number[] = []
  const secs: number[] = []
  const push = (t: number, s: number): void => {
    // Strictly ascending: two anchors at the same playback instant would make the lookup pick
    // arbitrarily between them, and the later one is always the better answer.
    if (ts.length > 0 && t <= ts[ts.length - 1]) {
      secs[secs.length - 1] = s
      return
    }
    ts.push(t)
    secs.push(s)
  }
  let seenPoint = -1
  for (const ev of timeline.events) {
    if (ev.kind === 'match-end') break
    if (ev.pointIndex === seenPoint) continue
    seenPoint = ev.pointIndex
    push(ev.t, starts[ev.pointIndex] ?? 0)
  }
  push(timeline.duration, starts[starts.length - 1] ?? 0)
  return { ts, secs }
}

/** The reading at playback position `t` (speed-1 timeline seconds), interpolated between anchors. */
export function clockSecondsAt(track: ClockTrack, t: number): number {
  const { ts, secs } = track
  if (ts.length === 0) return 0
  if (t <= ts[0]) return secs[0]
  if (t >= ts[ts.length - 1]) return secs[secs.length - 1]
  let i = 1
  while (i < ts.length && ts[i] < t) i++
  const span = ts[i] - ts[i - 1]
  const at = span > 0 ? (t - ts[i - 1]) / span : 1
  return secs[i - 1] + (secs[i] - secs[i - 1]) * at
}

/**
 * "1:23:45" - hours, minutes, seconds, always in that shape.
 *
 * ⚠ FIXED WIDTH ON PURPOSE. The reading sits in the court's top run-off band between two other
 * pieces of furniture; a form that dropped the hour under sixty minutes would change width mid-match
 * and shift everything beside it. Seconds are FLOORED, not rounded, because a clock that reads 1:00
 * before a minute has passed is wrong in the one direction people notice.
 */
export function formatMatchClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
