import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { computeMatchStats, formatDuration, POINT_SECONDS } from '../../src/engine/match/matchStats'
import type { MatchOptions, MatchPlayer, Surface } from '../../src/engine/match/types'
import {
  expectedServeSpeed,
  LEGACY_SNAPSHOT_AGE,
  SECOND_SERVE_DROP,
  SPEED_JITTER,
} from '../../src/engine/match/serveSpeed'

function annotate(seed: string, a: MatchPlayer, b: MatchPlayer, surface: Surface = 'hard') {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  const result = simulateMatch(a, b, opts)
  return { annotated: annotateMatch(result, a, b, opts), result }
}

// `groundstrokes: 50` both sides by default (v25): the rally term multiplies a difference, so a
// level pair leaves every stat in this file byte-identical.
const P = (over: Partial<MatchPlayer>): MatchPlayer => ({
  id: 'p',
  name: 'P',
  serve: 50,
  ret: 50,
  composure: 50,
  stamina: 50,
  groundstrokes: 50,
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

  // ⚠ RE-AIMED BY THE SERVE-SPEED SLICE (docs/specs/equipment-and-serve-speed.md §1). The GUARDED
  // FACT - that the reported speed rises with serve skill, and that a big server's max clears a weak
  // server's - is unchanged and still asserted. What had to move is the BANDS, because they were
  // written against constants that no longer exist: the old model was `128 + skill x 0.45`, and this
  // test's own last line said so out loud ("base 128 + 18 + 8"). Those numbers described a floor that
  // gave every fourteen-year-old a good adult's serve, which is the bug the slice exists to fix.
  //
  // The bands below are stated as the MODEL'S OWN prediction rather than as fresh literals, so they
  // cannot drift away from the curve the way the hard-coded 128 did. `P()` builds players with no
  // age, which resolves to LEGACY_SNAPSHOT_AGE - the career-start fourteen - so this whole block now
  // reads as "a fourteen-year-old's serve", which it always implicitly was.
  it('serve speed rises with serve skill (bands for skill 40 vs 90)', () => {
    const opp = P({ id: 'o', name: 'Opp', serve: 55, ret: 55 })
    const strong = P({ id: 's', name: 'Strong', serve: 90 })
    const weak = P({ id: 'w', name: 'Weak', serve: 40 })
    const s90 = computeMatchStats(annotate('speed', strong, opp).annotated, strong, opp)
    const s40 = computeMatchStats(annotate('speed', weak, opp).annotated, weak, opp)

    // side 0 is the serve-skill player under test. Averages mix first and second serves, so they sit
    // below the first-serve mean; the max is a first serve at the top of the jitter band.
    const mean40 = expectedServeSpeed(LEGACY_SNAPSHOT_AGE, 40)
    const mean90 = expectedServeSpeed(LEGACY_SNAPSHOT_AGE, 90)
    expect(s40.serveSpeed.avg[0]).toBeGreaterThan(mean40 - SECOND_SERVE_DROP)
    expect(s40.serveSpeed.avg[0]).toBeLessThan(mean40 + SPEED_JITTER)
    expect(s90.serveSpeed.avg[0]).toBeGreaterThan(mean90 - SECOND_SERVE_DROP)
    expect(s90.serveSpeed.avg[0]).toBeLessThan(mean90 + SPEED_JITTER)
    expect(s90.serveSpeed.avg[0]).toBeGreaterThan(s40.serveSpeed.avg[0] + 10)
    expect(s90.serveSpeed.max[0]).toBeGreaterThan(s40.serveSpeed.max[0])
    // ...and no serve can beat its own mean plus the jitter band - the replacement for the old
    // literal 155, derived from the model instead of copied out of it.
    expect(s40.serveSpeed.max[0]).toBeLessThanOrEqual(Math.round(mean40 + SPEED_JITTER))
    expect(s90.serveSpeed.max[0]).toBeLessThanOrEqual(Math.round(mean90 + SPEED_JITTER))

    // ⚠ AND THE REGRESSION THAT STARTED ALL THIS, pinned so it cannot come back: the old floor meant
    // nobody in this game had ever served slower than about 120 km/h. A weak fourteen-year-old now
    // does, which is what a weak fourteen-year-old does.
    expect(s40.serveSpeed.avg[0]).toBeLessThan(120)
  })

  // THE NEW HALF OF THE MODEL: the same skill is a different serve at a different age. This is the
  // fact the shipped model could not state at all - it had no age term, so a fourteen-year-old and a
  // nineteen-year-old with the same `serve` served identically.
  it('serve speed rises with AGE at a fixed skill, and hits the owner\'s two checkpoints', () => {
    const opp = P({ id: 'o', name: 'Opp', serve: 55, ret: 55, age: 16 })
    const speeds = [14, 16, 19].map((age) => {
      const her = P({ id: 'h', name: 'H', serve: 50, age })
      return computeMatchStats(annotate(`age-${age}`, her, opp).annotated, her, opp).serveSpeed.avg[0]
    })
    expect(speeds[1]).toBeGreaterThan(speeds[0])
    expect(speeds[2]).toBeGreaterThan(speeds[1])
    // Five years of growing is worth more than 20 km/h at a fixed skill - the age term is a real
    // term, not a rounding nudge.
    expect(speeds[2] - speeds[0]).toBeGreaterThan(20)

    // The owner's own two checkpoints, to the km/h. These are the numbers he approved and they are
    // the reason SPEED_PER_SKILL and the logistic's steepness are what they are.
    expect(expectedServeSpeed(14, 40)).toBeCloseTo(117, 0)
    expect(expectedServeSpeed(19, 75)).toBeCloseTo(161, 0)
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
