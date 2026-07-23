import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { computeMatchStats, formatDuration, POINT_SECONDS } from '../../src/engine/match/matchStats'
import type { MatchOptions, MatchPlayer, Surface } from '../../src/engine/match/types'

function annotate(seed: string, a: MatchPlayer, b: MatchPlayer, surface: Surface = 'hard') {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  const result = simulateMatch(a, b, opts)
  return { annotated: annotateMatch(result, a, b, opts), result }
}

const P = (over: Partial<MatchPlayer>): MatchPlayer => ({
  id: 'p',
  name: 'P',
  serve: 50,
  ret: 50,
  composure: 50,
  stamina: 50,
  ...over,
})

describe('computeMatchStats', () => {
  it('is deterministic: same annotated match + players -> identical stats', () => {
    const a = P({ id: 'a', name: 'A', serve: 58 })
    const b = P({ id: 'b', name: 'B', ret: 56 })
    const { annotated } = annotate('stats-det', a, b)
    const s1 = computeMatchStats(annotated, a, b)
    const s2 = computeMatchStats(annotated, a, b)
    expect(s1).toEqual(s2)
    // and stable across an independent rebuild from the same seed
    const rebuilt = annotate('stats-det', a, b)
    expect(computeMatchStats(rebuilt.annotated, a, b)).toEqual(s1)
  })

  it('winners + unforced errors + aces + double faults = total points (each side counted)', () => {
    const a = P({ id: 'a', name: 'A', serve: 62, composure: 48 })
    const b = P({ id: 'b', name: 'B', ret: 60, serve: 44 })
    for (const seed of ['id-1', 'id-2', 'id-3', 'id-4', 'id-5']) {
      for (const surface of ['hard', 'clay', 'grass'] as const) {
        const { annotated, result } = annotate(seed, a, b, surface)
        const s = computeMatchStats(annotated, a, b)
        const tally =
          s.winners[0] +
          s.winners[1] +
          s.unforcedErrors[0] +
          s.unforcedErrors[1] +
          s.aces[0] +
          s.aces[1] +
          s.doubleFaults[0] +
          s.doubleFaults[1]
        expect(tally).toBe(result.totalPoints)
        expect(s.meanRallyLength).toBeGreaterThan(0)
      }
    }
  })

  it('serve speed rises with serve skill (bands for skill 40 vs 90)', () => {
    const opp = P({ id: 'o', name: 'Opp', serve: 55, ret: 55 })
    const strong = P({ id: 's', name: 'Strong', serve: 90 })
    const weak = P({ id: 'w', name: 'Weak', serve: 40 })
    const s90 = computeMatchStats(annotate('speed', strong, opp).annotated, strong, opp)
    const s40 = computeMatchStats(annotate('speed', weak, opp).annotated, weak, opp)

    // side 0 is the serve-skill player under test
    expect(s40.serveSpeed.avg[0]).toBeGreaterThan(125)
    expect(s40.serveSpeed.avg[0]).toBeLessThan(155)
    expect(s90.serveSpeed.avg[0]).toBeGreaterThan(150)
    expect(s90.serveSpeed.avg[0]).toBeLessThan(180)
    expect(s90.serveSpeed.avg[0]).toBeGreaterThan(s40.serveSpeed.avg[0] + 10)
    expect(s90.serveSpeed.max[0]).toBeGreaterThan(s40.serveSpeed.max[0])
    // a first serve at skill 40 never exceeds base 128 + 18 + 8
    expect(s40.serveSpeed.max[0]).toBeLessThanOrEqual(155)
  })

  it('duration estimate is totalPoints * 42 s formatted h:mm', () => {
    const a = P({ id: 'a', name: 'A' })
    const b = P({ id: 'b', name: 'B' })
    const { annotated, result } = annotate('dur', a, b)
    const s = computeMatchStats(annotated, a, b)
    expect(s.durationEstimate).toBe(formatDuration(result.totalPoints * POINT_SECONDS))
  })
})

describe('formatDuration', () => {
  it('formats seconds as h:mm', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(3600)).toBe('1:00')
    expect(formatDuration(3600 + 5 * 60)).toBe('1:05')
    expect(formatDuration(42)).toBe('0:01')
    expect(formatDuration(2 * 3600 + 33 * 60)).toBe('2:33')
  })
})
