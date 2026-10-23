// ⭐ r53 step 11 – WEATHER STAGE 2: the match reads the day (docs/specs/weather-2026-10.md §4, §4.2).
// Mutation-verified (M11): heat on one side only, an extra draw on the match stream, and the rain's
// rest at `possible` each turn this file red.
import { describe, expect, it, vi } from 'vitest'

const draws = new Map<string, number>()
vi.mock('../src/engine/rng', async (importOriginal) => {
  const m = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...m,
    rngFromSeed: (seed: string) => {
      const r = m.rngFromSeed(seed)
      const counted = (() => {
        draws.set(seed, (draws.get(seed) ?? 0) + 1)
        return r()
      }) as typeof r
      return Object.assign(counted, r)
    },
  }
})

import type { MatchPlayer, MatchWeather } from '../src/engine/match/types'
import { HEAT_MAX_FACTOR, heatFatigueFactor, playedWeather, weatherLevers } from '../src/engine/match/weather'
import { basePServe, calibratedPServe, fatigueTerm, heatFatigueTerm, heatLegsFactor, modifiedPServe, nerveAndLegs, retireHazard } from '../src/engine/match/point'
import { fastMatchProbability, recordedMatchOptions, simulateMatch } from '../src/engine/match/engine'
import { createScore, contextOf } from '../src/engine/match/scoring'
import { annotateMatch } from '../src/engine/match/rally'
import { tournamentRunStrain } from '../src/engine/condition'
import { championWeatherRef, weatherTailOf } from '../src/engine/world/tournamentClose'
import { buildCommentary } from '../src/viz/commentary'

const P = (o: Partial<MatchPlayer> & { id: string }): MatchPlayer =>
  ({ name: o.id, serve: 55, ret: 55, composure: 55, stamina: 55, groundstrokes: 55, ...o }) as MatchPlayer
const day = (t: number, wind: MatchWeather['wind'] = 'none', rain: MatchWeather['rain'] = 'none'): MatchWeather => ({ temperatureC: t, wind, rain })
const opts = (w?: MatchWeather, surface: 'hard' | 'clay' | 'grass' = 'hard') => ({ surface, tour: 'wta' as const, seed: 's', ...(w ? { weather: w } : {}) })

describe('heat – heatFatigueFactor', () => {
  it('is 1 at and below 27°, 1.6 at 38°, linear between, flat above, 1 without weather', () => {
    expect(heatFatigueFactor(undefined)).toBe(1)
    expect(heatFatigueFactor(12)).toBe(1)
    expect(heatFatigueFactor(27)).toBe(1)
    expect(heatFatigueFactor(38)).toBeCloseTo(HEAT_MAX_FACTOR, 12)
    expect(heatFatigueFactor(40)).toBeCloseTo(1.6, 12)
    expect(heatFatigueFactor(32.5)).toBeCloseTo(1.3, 12)
    expect(heatFatigueFactor(28) - heatFatigueFactor(27)).toBeCloseTo(heatFatigueFactor(30) - heatFatigueFactor(29), 12)
  })
  // ⚠ RE-AIMED 22.10 (r53 W1, variant V1 – the owner's «жару делаем под калибровку 2.73 % на снятие,
  // реши какой вариант лучше», the architect's choice). Step 11 pinned «the loop multiplies fatigue by
  // the factor, the closed form's legs by the same factor». V1 makes her tire EARLIER instead – onset
  // 120 / heat, cap × heat – so the loop's shift is no longer 0.6 × the gap and the closed form scales
  // its legs by a FITTED `heatLegsFactor`. The pins now hold the RELATIONS (heat 1 is byte-identical,
  // the onset, the cap, the even pair, the mirror's shape, the untouched hazard), never the fitted
  // slope's value: that is the bench's to move (spec weather-2026-10 §4, «⚖ 22.10»).
  it('heat 1 is fatigueTerm exactly – every match without weather is byte-identical', () => {
    for (let n = 0; n <= 400; n += 7)
      for (const st of [0, 13, 30, 40, 55, 70, 87, 100]) {
        expect(heatFatigueTerm(n, st, 1)).toBe(fatigueTerm(n, st))
        expect(heatLegsFactor(1)).toBe(1)
      }
    const ctx = { ...contextOf(createScore(0), 200), pointNumber: 200 }
    const fit = P({ id: 'f', stamina: 80 })
    const tired = P({ id: 't', stamina: 30 })
    expect(modifiedPServe(0.6, fit, tired, ctx, null, 1)).toBe(modifiedPServe(0.6, fit, tired, ctx, null))
    expect(nerveAndLegs(fit, tired, 1)).toBe(nerveAndLegs(fit, tired))
  })
  it('at 38° she tires EARLIER – the onset is 75 points, not 120, and the cap is 0.048', () => {
    const h = heatFatigueFactor(38)
    const st = 30
    const at = (n: number) => {
      const ctx = { ...contextOf(createScore(0), n), pointNumber: n }
      return modifiedPServe(0.6, P({ id: 's', stamina: st }), P({ id: 'r', stamina: 100 }), ctx, null, h)
    }
    // the receiver at stamina 100 carries no fatigue, so any drop below 0.6 is the server's own
    for (const n of [1, 40, 74, 75]) expect(at(n)).toBe(0.6)
    for (const n of [76, 90, 110, 120]) {
      expect(at(n)).toBeLessThan(0.6)
      expect(0.6 - at(n)).toBeCloseTo(heatFatigueTerm(n, st, h), 12)
    }
    expect(heatFatigueTerm(76, st, h)).toBeCloseTo(1 * 0.0003 * 1.6 * 0.7, 12)
    expect(heatFatigueTerm(10_000, st, h)).toBeCloseTo(0.048, 12)
    expect(heatFatigueTerm(10_000, st, 1)).toBe(0.03)
    // a mild day keeps the old onset: point 120 none, 121 some
    expect(heatFatigueTerm(120, st, 1)).toBe(0)
    expect(heatFatigueTerm(121, st, 1)).toBeGreaterThan(0)
  })
  it('equal legs still cancel at any heat; unequal legs pay more the hotter it is; the hazard is untouched', () => {
    const ctx = { ...contextOf(createScore(0), 200), pointNumber: 200 }
    for (const h of [1, 1.2, heatFatigueFactor(34), 1.6]) {
      const even = [P({ id: 'a', stamina: 40 }), P({ id: 'b', stamina: 40 })] as const
      expect(modifiedPServe(0.6, even[0], even[1], ctx, null, h)).toBe(modifiedPServe(0.6, even[0], even[1], ctx, null, 1))
    }
    const fit = P({ id: 'f', stamina: 80 })
    const tired = P({ id: 't', stamina: 30 })
    const shift = (h: number) => modifiedPServe(0.6, fit, tired, ctx, null, h) - modifiedPServe(0.6, fit, tired, ctx, null, 1)
    expect(shift(1.6)).toBeCloseTo(heatFatigueTerm(200, 30, 1.6) - heatFatigueTerm(200, 80, 1.6) - (fatigueTerm(200, 30) - fatigueTerm(200, 80)), 12)
    expect(shift(1.6)).toBeGreaterThan(shift(heatFatigueFactor(34)))
    expect(shift(heatFatigueFactor(34))).toBeGreaterThan(0)
    // ⚠ the retirement anchor (2.73 %, RETIRE_K) stands by construction: the hazard reads the
    // UNCHANGED fatigue × heat, exactly as in step 11 – V1 moved the score, not the stopping.
    expect(retireHazard(200, 30, 1, 1.6)).toBeCloseTo(1.6 * retireHazard(200, 30, 1), 12)
    expect(retireHazard(100, 30, 1, 1.6)).toBe(0)
  })
  it('the closed form mirrors it: the legs term scales by the fitted heatLegsFactor, the nerve term does not', () => {
    const fit = P({ id: 'f', stamina: 80 })
    const tired = P({ id: 't', stamina: 40 })
    expect(nerveAndLegs(fit, tired, 1.6)).toBeCloseTo(heatLegsFactor(1.6) * nerveAndLegs(fit, tired), 12)
    // the mirror reads the loop's earlier onset as MORE than the bare factor – that is why it is fitted
    expect(heatLegsFactor(1.6)).toBeGreaterThan(1.6)
    expect(heatLegsFactor(heatFatigueFactor(38))).toBeGreaterThan(heatLegsFactor(heatFatigueFactor(34)))
    const legs38 = calibratedPServe(fit, tired, opts(day(38))) - basePServe(fit, tired, opts(day(38)))
    expect(legs38).toBeCloseTo(nerveAndLegs(fit, tired, 1.6), 12)
    const nerve = P({ id: 'n', composure: 80 })
    expect(nerveAndLegs(nerve, P({ id: 'x' }), 1.6)).toBeCloseTo(nerveAndLegs(nerve, P({ id: 'x' })), 12)
  })
})

describe('wind and rain – the levers at their seams', () => {
  const fav = P({ id: 'fav', serve: 65, ret: 62, groundstrokes: 62 })
  const dog = P({ id: 'dog', serve: 52, ret: 52, groundstrokes: 52 })
  it('a calm, mild, dry day is byte-identical to no weather at all', () => {
    for (const w of [day(20), day(27), day(25, 'none', 'possible'), day(22, 'none', 'falling')])
      expect(basePServe(fav, dog, opts(w))).toBe(basePServe(fav, dog, opts()))
    expect(fastMatchProbability(fav, dog, opts(day(27, 'none', 'possible')))).toBe(fastMatchProbability(fav, dog, opts()))
  })
  it('fresh –3 pp / +5%, strong –6 pp / +10%; rain falls on clay only, –2 pp / +5%', () => {
    expect(weatherLevers(day(20, 'fresh'), 'hard')).toEqual({ firstServePp: 0.03, errorRise: 0.05 })
    expect(weatherLevers(day(20, 'strong'), 'hard')).toEqual({ firstServePp: 0.06, errorRise: 0.1 })
    expect(weatherLevers(day(20, 'none', 'falling'), 'clay')).toEqual({ firstServePp: 0.02, errorRise: 0.05 })
    expect(weatherLevers(day(20, 'none', 'falling'), 'grass')).toEqual({ firstServePp: 0, errorRise: 0 })
    expect(weatherLevers(day(20, 'none', 'possible'), 'clay')).toEqual({ firstServePp: 0, errorRise: 0 })
  })
  it('the wind is symmetric: every server loses, and the gap between them narrows', () => {
    const calm = [basePServe(fav, dog, opts()), basePServe(dog, fav, opts())]
    const windy = [basePServe(fav, dog, opts(day(20, 'strong'))), basePServe(dog, fav, opts(day(20, 'strong')))]
    expect(windy[0]).toBeLessThan(calm[0])
    expect(windy[1]).toBeLessThan(calm[1])
    expect(windy[0] - windy[1]).toBeLessThan(calm[0] - calm[1])
    expect(fastMatchProbability(fav, dog, opts(day(20, 'strong')))).toBeLessThan(fastMatchProbability(fav, dog, opts()))
  })
})

describe('the match stream – no new draw', () => {
  it('one draw per point on the match seed and two on the retirement stream, weather or none', () => {
    const a = P({ id: 'a', stamina: 30 })
    const b = P({ id: 'b', serve: 60, stamina: 45 })
    for (const w of [undefined, day(38, 'strong', 'falling')]) {
      draws.clear()
      const seed = `stream:${w ? 'w' : 'n'}`
      const r = simulateMatch(a, b, { ...opts(w, 'clay'), seed })
      expect(draws.get(seed)).toBe(r.totalPoints)
      expect(draws.get(`${seed}:ret`)).toBe(2)
      expect([...draws.keys()].sort()).toEqual([seed, `${seed}:ret`].sort())
    }
  })
  it('a replay carries the day: recordedMatchOptions reads MatchRecord.weather, and a calm day records nothing', () => {
    expect(recordedMatchOptions({ surface: 'hard', seed: 'x', weather: day(35) }).weather).toEqual(day(35))
    expect('weather' in recordedMatchOptions({ surface: 'hard', seed: 'x' })).toBe(false)
    expect(playedWeather({ ...day(26, 'none', 'possible'), linePick: 0.3 } as MatchWeather)).toBeUndefined()
    expect(playedWeather({ ...day(28), linePick: 0.3 } as MatchWeather)).toEqual(day(28))
    expect(playedWeather({ ...day(20, 'none', 'falling'), linePick: 0.3 } as MatchWeather)).toEqual(day(20, 'none', 'falling'))
  })
  it('closed form = loop with weather on, as it is without (coarse Monte-Carlo; tools/weather-bench.ts is the fine one)', () => {
    const fav = P({ id: 'fav', serve: 64, ret: 60, stamina: 75 })
    const dog = P({ id: 'dog', serve: 52, ret: 52, stamina: 35 })
    for (const w of [undefined, day(38, 'strong'), day(36, 'none', 'falling')]) {
      const n = 1500
      let wins = 0
      for (let i = 0; i < n; i++) if (simulateMatch(fav, dog, { ...opts(w, 'clay'), seed: `par:${i}` }).winner === 0) wins++
      expect(Math.abs(wins / n - fastMatchProbability(fav, dog, opts(w, 'clay')))).toBeLessThan(0.035)
    }
  })
})

describe('the condition toll – the rain is rest', () => {
  it('a match the rain held up costs one less; possible and dry cost the same', () => {
    const dry = tournamentRunStrain('local', [{ score: '6-4 6-4' }, { score: '6-4 3-6 6-2' }])
    expect(tournamentRunStrain('local', [{ score: '6-4 6-4', weather: { rain: 'falling' } }, { score: '6-4 3-6 6-2', weather: { rain: 'falling' } }])).toBe(dry - 2)
    expect(tournamentRunStrain('local', [{ score: '6-4 6-4', weather: { rain: 'possible' } }, { score: '6-4 3-6 6-2' }])).toBe(dry)
  })
})

describe('the words – result-row tail and the booth', () => {
  const w = (t: number, wind: string, rain: string, linePick = 0.2) => ({ temperatureC: t, wind, rain, linePick })
  it('a tail only when the feature holds: rain falling, then 30°+, then a strong wind', () => {
    expect(weatherTailOf(w(29, 'fresh', 'possible'))).toBeNull()
    expect(championWeatherRef('A. Name', 'J60', 'hard', w(29, 'fresh', 'possible'))).toBeNull()
    expect(weatherTailOf(w(30, 'none', 'none'))).toBe('heat')
    expect(weatherTailOf(w(34, 'strong', 'falling'))).toBe('rain')
    expect(weatherTailOf(w(20, 'strong', 'none'))).toBe('wind')
    expect(championWeatherRef('A. Name', 'J60', 'hard', w(31, 'none', 'none'))?.k).toBe('🏆 {0} won the {1} ({2}) in exhausting heat.')
    expect(championWeatherRef('A. Name', 'J60', 'clay', w(20, 'none', 'falling', 0.7))?.k).toContain('thanks to the rain')
    expect(championWeatherRef('A. Name', 'J60', 'clay', w(20, 'none', 'falling', 0.1))?.k).toContain('despite the rain')
    expect(championWeatherRef('A. Name', 'J60', 'hard', w(20, 'strong', 'none'))?.k).toContain('in a strong wind')
  })
  it('the booth plays the pause when rain is falling, and the default log is byte-identical', () => {
    const a = P({ id: 'a' })
    const b = P({ id: 'b' })
    const o = opts(undefined, 'clay')
    const m = annotateMatch(simulateMatch(a, b, { ...o, seed: 'booth-rain' }), a, b, { ...o, seed: 'booth-rain' })
    const plain = buildCommentary(m, 'Ann', 'Bea')
    expect(buildCommentary(m, 'Ann', 'Bea', null, null, null, null, null, null)).toEqual(plain)
    const wet = buildCommentary(m, 'Ann', 'Bea', null, null, null, null, null, { temperatureC: 20, wind: 'none', rain: 'falling' }).filter((x) => x.kind === 'booth')
    expect(wet.length).toBeGreaterThanOrEqual(1)
    expect(wet.length).toBeLessThanOrEqual(2)
    expect(wet[0].text).toContain('under cover')
  })
})
