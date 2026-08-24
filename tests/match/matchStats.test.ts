import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { computeMatchStats, formatDuration } from '../../src/viz/match/matchStats'
import { matchDurationSeconds } from '../../src/viz/matchClock'
import type { MatchOptions, MatchPlayer, Surface } from '../../src/engine/match/types'
import {
  expectedServeSpeed,
  LEGACY_SNAPSHOT_AGE,
  pointServeSpeeds,
  SECOND_SERVE_DROP,
  SPEED_JITTER,
} from '../../src/engine/match/serveSpeed'
import type { Side } from '../../src/engine/match/types'

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

  // ⚠ THE PIN THE COURT SCREEN'S LIVE SERVE SPEED RESTS ON (owner, 31.07, after playing: the score
  // centred under the court and «в зависимости от того, кто подает, будем скорость подачи писать»).
  //
  // That reading is the SECOND reader of this number. The first is the "Max serve" row of the box
  // score right below it, and a live 158 followed a click later by a max of 161 for a match whose
  // fastest serve was that one is the kind of disagreement that makes a player stop trusting every
  // other number on the screen too.
  //
  // They cannot disagree because there is one loop - `pointServeSpeeds` - and both call it. This test
  // is what makes that claim checkable rather than architectural: it re-derives the box score's whole
  // serve-speed block from the per-point readings the VIEWER walks, and demands the two be equal.
  // A second stream, a changed draw order, or a serve counted twice all fail here.
  it('the per-point readings and the box score are one number: avg/max re-derive exactly', () => {
    const a = P({ id: 'a', name: 'A', serve: 71, age: 15.6 })
    const b = P({ id: 'b', name: 'B', serve: 44, ret: 58 }) // no age -> LEGACY_SNAPSHOT_AGE
    for (const seed of ['agree-1', 'agree-2', 'agree-3']) {
      const { annotated } = annotate(seed, a, b)
      const box = computeMatchStats(annotated, a, b)

      const sum: [number, number] = [0, 0]
      const count: [number, number] = [0, 0]
      const max: [number, number] = [0, 0]
      let serves = 0
      let seconds = 0
      for (const point of annotated.points) {
        const struck = pointServeSpeeds(annotated.result.seed, point, a, b)
        // Every serve SHOT in the point is read exactly once, in strike order, and nothing else is.
        const serveShots = point.rally.shots
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s.kind === 'serve1' || s.kind === 'serve2')
        expect(struck.map((r) => r.shotIndex)).toEqual(serveShots.map(({ i }) => i))
        expect(struck.map((r) => r.side)).toEqual(serveShots.map(({ s }) => s.by))
        expect(struck.map((r) => r.secondServe)).toEqual(serveShots.map(({ s }) => s.kind === 'serve2'))
        for (const r of struck) {
          sum[r.side] += r.kmh
          count[r.side]++
          if (r.kmh > max[r.side]) max[r.side] = r.kmh
          serves++
          if (r.secondServe) seconds++
        }
        // Re-reading a point is free of side effects on the stream - the viewer looks the same point
        // up on every frame the serve is on screen, so this is the property that makes that safe.
        expect(pointServeSpeeds(annotated.result.seed, point, a, b)).toEqual(struck)
      }

      const avg = (side: Side): number => (count[side] ? Math.round(sum[side] / count[side]) : 0)
      expect(box.serveSpeed.max).toEqual(max)
      expect(box.serveSpeed.avg).toEqual([avg(0), avg(1)])
      // The fixture has to actually exercise both branches, or "they agree" is a claim about nothing.
      expect(serves).toBeGreaterThan(annotated.points.length) // some points went to a second serve
      expect(seconds).toBeGreaterThan(0)
    }
  })

  /**
   * ⚠ RE-AIMED, R17 #24, AND THE RE-AIM IS THE ITEM. This used to read "duration estimate is
   * totalPoints * 42 s formatted h:mm" and it pinned exactly that: a flat constant per point,
   * whatever the point contained. The owner asked for a live elapsed clock on the court, which needs
   * to know where INSIDE a match a reading stands - a total cannot answer that - so the model moved
   * to viz/matchClock.ts and counts what the match holds (rally shots, changeovers, set breaks).
   *
   * WHAT THE PIN IS FOR is unchanged and is the half that matters: the box score's duration and the
   * clock over the court are ONE number, so this asserts the box score reads the shared model rather
   * than keeping arithmetic of its own. The second assertion is the reason the first one matters -
   * the two derivations are genuinely different, so agreeing is a fact and not a tautology.
   */
  it('duration comes from the shared match clock, not from arithmetic of its own', () => {
    const a = P({ id: 'a', name: 'A' })
    const b = P({ id: 'b', name: 'B' })
    const { annotated, result } = annotate('dur', a, b)
    const s = computeMatchStats(annotated, a, b)
    expect(s.durationEstimate).toBe(formatDuration(matchDurationSeconds(annotated)))
    expect(s.durationEstimate).not.toBe(formatDuration(result.totalPoints * 42))
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
