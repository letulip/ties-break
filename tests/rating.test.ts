// THE RATING'S ONE PROMISE: the difference of two ratings predicts the match those two players
// actually play. Everything else about the number is decoration; this is the property the owner's
// D&D request rests on, so it is measured across the whole reachable build range rather than spot-
// checked, and it is mutation-verified (raise RATING_BASE's slope or drop the surface argument and
// the max error blows past the bound).

import { describe, it, expect } from 'vitest'
import { ratingOf, chanceFromRatings, RATING_BASE } from '../src/engine/match/rating'
import { fastMatchProbability } from '../src/engine/match/engine'
import type { MatchPlayer, Surface } from '../src/engine/match/types'

const build = (id: string, core: number, extra: Partial<MatchPlayer> = {}): MatchPlayer => ({
  id,
  name: id,
  serve: core,
  ret: core,
  composure: core,
  stamina: core,
  groundstrokes: core,
  ...extra,
})

describe('the rating predicts the match it labels', () => {
  it('an average build is the scale origin', () => {
    expect(ratingOf(build('avg', 50), 'hard', 'wta')).toBe(RATING_BASE)
  })

  it("the world #1 of the shipped population reads about the live list's own number one", () => {
    // SKILL_LAW.top is 76.4 – the core the population puts at world #1; the live 2026 list's #1 is 2195.
    const r = ratingOf(build('no1', 76.4), 'hard', 'wta')
    expect(r).toBeGreaterThan(2150)
    expect(r).toBeLessThan(2240)
  })

  it('is monotone in skill', () => {
    let prev = -Infinity
    for (const core of [20, 30, 40, 50, 60, 70, 80]) {
      const r = ratingOf(build(`c${core}`, core), 'hard', 'wta')
      expect(r).toBeGreaterThan(prev)
      prev = r
    }
  })

  it("⚠ THE PROMISE: a rating gap reproduces the engine's own match probability to a point", () => {
    const surfaces: Surface[] = ['hard', 'clay', 'grass']
    let worst = 0
    let worstCase = ''
    for (const surface of surfaces) {
      for (let a = 18; a <= 80; a += 2) {
        for (let b = 18; b <= 80; b += 2) {
          const pa = build('a', a)
          const pb = build('b', b)
          const truth = fastMatchProbability(pa, pb, { surface, tour: 'wta', seed: '' })
          const quoted = chanceFromRatings(ratingOf(pa, surface, 'wta'), ratingOf(pb, surface, 'wta'))
          const err = Math.abs(truth - quoted)
          if (err > worst) {
            worst = err
            worstCase = `${surface} ${a} vs ${b}: truth ${(100 * truth).toFixed(1)}% quoted ${(100 * quoted).toFixed(1)}%`
          }
        }
      }
    }
    // MEASURED 17.08 at ELO_PER_SERVE_EDGE = 3870: worst case 1.03 points over the whole reachable
    // range and all three surfaces. The bound is 1.5 so a re-fit has somewhere to land; it is NOT
    // slack for a worse definition – the previous shape missed by 7.98 and this test is what caught it.
    expect(worst, worstCase).toBeLessThan(0.015)
  })

  it('⚠ AND THE GAP IS EXACT EVEN WHEN THE BUILDS ARE NOTHING ALIKE', () => {
    // The reference cancels algebraically, so a lopsided build is rated as correctly as a flat one.
    const server = build('server', 50, { serve: 78, ret: 30, groundstrokes: 66 })
    const grinder = build('grinder', 50, { serve: 34, ret: 74, groundstrokes: 41 })
    const truth = fastMatchProbability(server, grinder, { surface: 'clay', tour: 'wta', seed: '' })
    const quoted = chanceFromRatings(ratingOf(server, 'clay', 'wta'), ratingOf(grinder, 'clay', 'wta'))
    expect(Math.abs(truth - quoted)).toBeLessThan(0.015)
  })

  it('⚠ TWO BUILDS THAT TRADE SERVE FOR RETURN RATE THE SAME, because the model says they are the same', () => {
    // Not a rounding artefact and not a defect: `basePServe` enters serve and return with equal and
    // opposite weight, so (serve+25, ret-25) is the same player to this engine. Recorded so nobody
    // "fixes" the rating to disagree with the match it is quoting.
    expect(ratingOf(build('a', 50, { serve: 75, ret: 25 }), 'hard', 'wta')).toBe(ratingOf(build('b', 50), 'hard', 'wta'))
  })

  it('⚠ COMPOSURE AND STAMINA ARE INVISIBLE TO IT, exactly as they are to the card it explains', () => {
    // They act through `modifiedPServe` (big points, past point 120), never through `basePServe`.
    // `fastMatchProbability` – the number the calendar card has always shown – cannot see them
    // either, so the rating is neither more nor less complete than the ring beside it.
    expect(ratingOf(build('a', 50, { composure: 99, stamina: 99 }), 'hard', 'wta')).toBe(
      ratingOf(build('b', 50, { composure: 1, stamina: 1 }), 'hard', 'wta'),
    )
  })

  it('the formula is the published one: 100 points is a 64% favourite', () => {
    expect(chanceFromRatings(1700, 1600)).toBeCloseTo(0.64, 2)
    expect(chanceFromRatings(1800, 1600)).toBeCloseTo(0.76, 2)
    expect(chanceFromRatings(1600, 1600)).toBe(0.5)
  })
})
