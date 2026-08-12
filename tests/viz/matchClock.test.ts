// ROUND 17 #24 – THE DIEGETIC CLOCK'S OWN PROPERTIES.
//
// The mounted net (tests/component/match-viewer.test.ts) is where the SCREEN's claims live - the
// reading advances, it advances at different rates, it lands on the box score's number. What is
// checked here is what the model itself has to be true of, over a real corpus rather than one match:
// that the durations look like tennis, that they are driven by what a match CONTAINS, and that the
// playback map is monotone and total.
import { describe, it, expect } from 'vitest'
import {
  MATCH_CLOCK,
  buildClockTrack,
  clockSecondsAt,
  formatMatchClock,
  matchDurationSeconds,
  pointStartSeconds,
} from '../../src/viz/matchClock'
import { buildTimeline } from '../../src/viz/timeline'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer, Surface } from '../../src/engine/match/types'

const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

function play(seed: string, surface: Surface = 'hard'): AnnotatedMatch {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  return annotateMatch(simulateMatch(A, B, opts), A, B, opts)
}

function corpus(n: number): AnnotatedMatch[] {
  const out: AnnotatedMatch[] = []
  for (let i = 0; i < n; i++) out.push(play(`clock-${i}`, SURFACES[i % SURFACES.length]))
  return out
}

describe('the match clock reads like tennis', () => {
  it('⚠ a two-setter is about an hour and a quarter and a three-setter about two', () => {
    // The owner's own ⚠ on the item: it must CORRELATE WITH A REAL MATCH DURATION. Measured over 400
    // seeded matches the medians are 1:19 and 1:58 (tools/match-clock-probe.ts); the bands below are
    // the p10..p90 of that measurement, widened at each end, so this fails when the model drifts and
    // not when one unusual seed turns up.
    const two: number[] = []
    const three: number[] = []
    for (const m of corpus(120)) {
      const minutes = matchDurationSeconds(m) / 60
      ;(m.result.sets.length >= 3 ? three : two).push(minutes)
    }
    const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
    expect(two.length, 'the corpus had no straight-sets matches at all').toBeGreaterThan(20)
    expect(three.length, 'the corpus had no three-setters at all').toBeGreaterThan(20)
    expect(median(two), `median two-setter ${median(two).toFixed(0)} min`).toBeGreaterThan(60)
    expect(median(two), `median two-setter ${median(two).toFixed(0)} min`).toBeLessThan(100)
    expect(median(three), `median three-setter ${median(three).toFixed(0)} min`).toBeGreaterThan(95)
    expect(median(three), `median three-setter ${median(three).toFixed(0)} min`).toBeLessThan(145)
    // ...and no match anywhere in the corpus lands somewhere tennis does not go.
    for (const m of [...two, ...three]) {
      expect(m).toBeGreaterThan(35)
      expect(m).toBeLessThan(200)
    }
  })

  it('⚠ is driven by what the match CONTAINS, not by a constant per point or per set', () => {
    // The model this replaced was `42 s x totalPoints`, and the thing that model could not do is tell
    // two matches with the same number of points apart. Over a corpus, seconds-per-point has to
    // VARY - a long-rally match on clay takes longer than a short-point match with the same count.
    const perPoint = corpus(60).map((m) => matchDurationSeconds(m) / m.points.length)
    const min = Math.min(...perPoint)
    const max = Math.max(...perPoint)
    expect(max - min, `every match came out at ${min.toFixed(1)} s/point`).toBeGreaterThan(3)
    // And a set break really is worth more than a point: two matches of the same length in points,
    // one of them a set longer, is the case a per-point constant gets wrong.
    const m = play('clock-shape')
    const starts = pointStartSeconds(m)
    const gaps = m.points.map((_, i) => starts[i + 1] - starts[i])
    const setEndGaps = gaps.filter((_, i) => m.points[i].setEnd && i < m.points.length - 1)
    const plainGaps = gaps.filter((_, i) => !m.points[i].gameEnd)
    expect(setEndGaps.length).toBeGreaterThan(0)
    expect(Math.min(...setEndGaps)).toBeGreaterThan(Math.max(...plainGaps) + MATCH_CLOCK.setBreak / 2)
  })

  it('the last point costs no rest - a match does not have a changeover at the end of it', () => {
    for (const m of corpus(12)) {
      const starts = pointStartSeconds(m)
      const last = m.points.length - 1
      const lastGap = starts[last + 1] - starts[last]
      expect(lastGap).toBeCloseTo(m.points[last].rally.shots.length * MATCH_CLOCK.secondsPerShot, 6)
    }
  })
})

describe('the playback map', () => {
  it('⚠ reaches the SAME duration in every view mode, which is what makes the key cut honest', () => {
    for (const m of corpus(12)) {
      const total = matchDurationSeconds(m)
      for (const mode of ['full', 'key', 'skip'] as const) {
        const timeline = buildTimeline(m, mode)
        const track = buildClockTrack(m, timeline)
        expect(clockSecondsAt(track, timeline.duration), mode).toBeCloseTo(total, 6)
      }
    }
  })

  it('is monotone and total: never runs backwards, and is defined off both ends', () => {
    const m = play('clock-monotone')
    const timeline = buildTimeline(m, 'full')
    const track = buildClockTrack(m, timeline)
    let last = -1
    for (let t = -5; t <= timeline.duration + 5; t += timeline.duration / 400) {
      const at = clockSecondsAt(track, t)
      expect(at, `the clock ran backwards at t=${t.toFixed(1)}`).toBeGreaterThanOrEqual(last)
      last = at
    }
    expect(clockSecondsAt(track, -100)).toBe(0)
    expect(clockSecondsAt(track, timeline.duration * 10)).toBeCloseTo(matchDurationSeconds(m), 6)
  })

  it('a match with no points at all does not throw and reads zero', () => {
    const empty: AnnotatedMatch = { ...play('clock-empty'), points: [] }
    expect(matchDurationSeconds(empty)).toBe(0)
    const track = buildClockTrack(empty, buildTimeline(empty, 'full'))
    expect(clockSecondsAt(track, 0)).toBe(0)
  })
})

describe('formatMatchClock', () => {
  it('is always h:mm:ss, so the band beside it never changes width', () => {
    expect(formatMatchClock(0)).toBe('0:00:00')
    expect(formatMatchClock(7)).toBe('0:00:07')
    expect(formatMatchClock(61)).toBe('0:01:01')
    expect(formatMatchClock(3600)).toBe('1:00:00')
    expect(formatMatchClock(4 * 3600 + 5 * 60 + 9)).toBe('4:05:09')
  })

  it('FLOORS rather than rounds - a clock that reads a minute before one has passed is wrong', () => {
    expect(formatMatchClock(59.9)).toBe('0:00:59')
    expect(formatMatchClock(119.99)).toBe('0:01:59')
  })

  it('a negative reading is impossible and is clamped rather than printed', () => {
    expect(formatMatchClock(-10)).toBe('0:00:00')
  })
})

describe('the clock draws no randomness, like everything else that narrates a match', () => {
  it('is a pure function of the match, twice in a row and with Math.random booby-trapped', () => {
    const m = play('clock-det')
    const real = Math.random
    Math.random = () => {
      throw new Error('the match clock must not draw randomness')
    }
    try {
      expect(pointStartSeconds(m)).toEqual(pointStartSeconds(m))
      expect(matchDurationSeconds(m)).toBeGreaterThan(0)
    } finally {
      Math.random = real
    }
  })
})
