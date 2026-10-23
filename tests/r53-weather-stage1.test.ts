// ⭐ ROUND 53 · STEP 10 – WEATHER, STAGE 1: facts and words, zero effect on play (docs/specs/weather-2026-10.md §3).
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { rngFromSeed } from '../src/engine/rng'
import { climateBand, climateSeason, eventTemperature, eventWeather, weatherLinePicks } from '../src/engine/season/preview'
import { conditionsNote, buildPreview } from '../src/viz/preview'
import { TRAVEL_NOTES } from '../src/engine/diary/travelNotes'
import { tournamentWeatherIn } from '../src/engine/diary/weatherFacts'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import type { MatchPlayer, Surface } from '../src/engine/match/types'
import type { WorldEvent } from '../src/shared/protocol'

const SURFACES: Surface[] = ['hard', 'clay', 'grass']

describe('§3.1 the climate is a table by season-week and surface', () => {
  it('names the season from the season-week (offset 0 = week 1 = January)', () => {
    expect(climateSeason(0)).toBe('winter') // season-week 1
    expect(climateSeason(7)).toBe('winter') // 8
    expect(climateSeason(8)).toBe('shoulder') // 9
    expect(climateSeason(20)).toBe('shoulder') // 21
    expect(climateSeason(21)).toBe('summer') // 22
    expect(climateSeason(34)).toBe('summer') // 35
    expect(climateSeason(35)).toBe('shoulder') // 36
    expect(climateSeason(46)).toBe('shoulder') // 47
    expect(climateSeason(47)).toBe('winter') // 48
    expect(climateSeason(51)).toBe('winter') // 52
    expect(climateSeason(52)).toBe('winter') // the next season's week 1
    expect(climateSeason(52 * 3 + 25)).toBe('summer')
  })
  it('holds the spec table', () => {
    expect(climateBand(0, 'hard')).toEqual([8, 18])
    expect(climateBand(10, 'hard')).toEqual([14, 26])
    expect(climateBand(25, 'hard')).toEqual([22, 38])
    expect(climateBand(0, 'clay')).toEqual([12, 20])
    expect(climateBand(10, 'clay')).toEqual([15, 27])
    expect(climateBand(25, 'clay')).toEqual([24, 34])
    expect(climateBand(10, 'grass')).toEqual([16, 26])
    expect(climateBand(25, 'grass')).toEqual([20, 30])
  })
  it('every drawn temperature lies inside its band', () => {
    for (const surface of SURFACES) {
      for (let week = 0; week < 104; week++) {
        const [lo, hi] = climateBand(week, surface)
        const t = eventWeather('b', { id: `e-w${week}`, surface, week }).temperatureC
        expect(t).toBeGreaterThanOrEqual(lo)
        expect(t).toBeLessThanOrEqual(hi)
      }
    }
  })
})

describe('§3.2 the four draws, in order, on the one sub-stream', () => {
  it('replays the sub-stream: temperature first, then wind, rain, line-pick', () => {
    for (let i = 0; i < 40; i++) {
      const event = { id: `2031-w${i}-j60`, surface: SURFACES[i % 3], week: i }
      const rng = rngFromSeed(`seedx:weather:${event.id}`)
      const [lo, hi] = climateBand(event.week, event.surface)
      const first = rng()
      const u2 = rng()
      const u3 = rng()
      const u4 = rng()
      const w = eventWeather('seedx', event)
      expect(w.temperatureC).toBe(Math.round(lo + first * (hi - lo)))
      expect(w.wind).toBe(u2 < 0.7 ? 'none' : u2 < 0.92 ? 'fresh' : 'strong')
      expect(w.linePick).toBe(u4)
      expect(typeof u3).toBe('number')
      expect(eventTemperature('seedx', event)).toBe(w.temperatureC)
    }
  })
  it('keeps the temperature byte-identical to the pre-change formula wherever its band is the old one', () => {
    // The old formula: round(lo + first·(hi−lo)) on the SAME first draw, bands 12–26 / 16–28 / 19–29.
    // No new band equals an old one, so every temperature moves; what must NOT move is the draw it comes from.
    for (let i = 0; i < 30; i++) {
      const id = `p-${i}`
      const first = rngFromSeed(`s:weather:${id}`)()
      const old = Math.round(12 + first * 14)
      const w = eventWeather('s', { id, surface: 'hard', week: 0 })
      expect(w.temperatureC).toBe(Math.round(8 + first * 10))
      expect(Math.round(12 + first * 14)).toBe(old)
    }
  })
  it('the odds hold within two points over 5000 draws, rain by surface', () => {
    const N = 5000
    const want: Record<Surface, number> = { clay: 0.13, hard: 0.07, grass: 0.14 }
    let strong = 0
    const falling: Record<Surface, number> = { clay: 0, hard: 0, grass: 0 }
    const possible: Record<Surface, number> = { clay: 0, hard: 0, grass: 0 }
    for (const surface of SURFACES) {
      for (let i = 0; i < N; i++) {
        const w = eventWeather('odds', { id: `o-${i}`, surface, week: i % 52 })
        if (surface === 'hard' && w.wind === 'strong') strong++
        if (w.rain === 'falling') falling[surface]++
        if (w.rain === 'possible') possible[surface]++
      }
    }
    expect(Math.abs(strong / N - 0.08)).toBeLessThan(0.02)
    for (const s of SURFACES) expect(Math.abs(falling[s] / N - want[s]), `${s} falling`).toBeLessThan(0.02)
    expect(Math.abs(possible.clay / N - 0.22)).toBeLessThan(0.02)
  })
  it('weatherLinePicks splits one number into 3 / 2 / 2 picks, all in range', () => {
    for (let i = 0; i <= 1000; i++) {
      const p = weatherLinePicks(i / 1001)
      expect([0, 1, 2]).toContain(p.temp)
      expect([0, 1]).toContain(p.wind)
      expect([0, 1]).toContain(p.rain)
    }
    expect(weatherLinePicks(0.9999999)).toMatchObject({ temp: 2, wind: 1, rain: 1, heatRemark: 2, windRemark: 2, rainRemark: 1 })
  })
  it('W3: the first three picks are byte-identical to the shipped formula; the booth picks are in range', () => {
    // the shipped arithmetic, inline – the mutation net for «nothing existing moved»
    const old = (x: number) => {
      const a = x * 3
      const temp = Math.min(2, Math.floor(a))
      const b = (a - temp) * 2
      const wind = Math.min(1, Math.floor(b))
      const rain = Math.min(1, Math.floor((b - wind) * 2))
      return { temp, wind, rain }
    }
    const seen = { heat: new Set<number>(), wind: new Set<number>(), rain: new Set<number>() }
    for (let i = 0; i <= 1000; i++) {
      const x = i / 1001
      const p = weatherLinePicks(x)
      expect({ temp: p.temp, wind: p.wind, rain: p.rain }, `x=${x}`).toEqual(old(x))
      expect([0, 1, 2]).toContain(p.heatRemark)
      expect([0, 1, 2]).toContain(p.windRemark)
      expect([0, 1]).toContain(p.rainRemark)
      seen.heat.add(p.heatRemark)
      seen.wind.add(p.windRemark)
      seen.rain.add(p.rainRemark)
    }
    expect([seen.heat.size, seen.wind.size, seen.rain.size]).toEqual([3, 3, 2])
  })
})

describe('§3.3 the words', () => {
  const TEMPS = [10, 16, 21, 26, 33]
  it('three distinct lines per band; pick 0 is the shipped sentence', () => {
    for (const c of TEMPS) {
      const texts = [0, 1, 2].map((k) => conditionsNote(c, k).text)
      expect(new Set(texts).size, `${c}°`).toBe(3)
      expect(conditionsNote(c).text).toBe(texts[0])
    }
    expect(conditionsNote(21).text).toBe('A comfortable day for it, and no excuses in the air.')
  })
  it('a career of consecutive events does not repeat the same pick more than chance', () => {
    let repeats = 0
    let prev = -1
    const N = 900
    for (let i = 0; i < N; i++) {
      const k = weatherLinePicks(eventWeather('rep', { id: `2031-w${i}-j60`, surface: 'hard', week: i % 52 }).linePick).temp
      if (k === prev) repeats++
      prev = k
    }
    expect(repeats / N).toBeGreaterThan(1 / 3 - 0.07)
    expect(repeats / N).toBeLessThan(1 / 3 + 0.07)
  })
  it('the preview adds a wind and a rain line only when the day has them, and none for a caller without weather', () => {
    const A: MatchPlayer = { id: 'a', name: 'Vera Novak', serve: 62, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 15.2 }
    const B: MatchPlayer = { id: 'b', name: 'Ines Duval', serve: 48, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 16.9 }
    const input = { a: A, b: B, heroSide: 0 as const, surface: 'hard' as const, tour: JUNIOR_TOUR, heroRank: 12, oppRank: 34, event: null, temperatureC: 21 }
    const keys = (w?: Parameters<typeof buildPreview>[0]['weather']) => buildPreview({ ...input, weather: w }).map((l) => l.key)
    expect(keys(undefined)).not.toContain('wind')
    expect(keys(undefined)).not.toContain('rain')
    expect(buildPreview(input).find((l) => l.key === 'conditions')!.text).toBe('A comfortable day for it, and no excuses in the air.')
    expect(keys({ wind: 'none', rain: 'none', linePick: 0.5 })).toEqual(keys(undefined))
    const windy = buildPreview({ ...input, weather: { wind: 'strong', rain: 'falling', linePick: 0.1 } })
    expect(windy.map((l) => l.key)).toEqual(expect.arrayContaining(['conditions', 'wind', 'rain']))
    expect(windy.find((l) => l.key === 'wind')!.text).toMatch(/wind|gust/i)
    expect(windy.find((l) => l.key === 'rain')!.text).toMatch(/rain|drizzle/i)
    // the pick moves the temperature line (pick 0.9 -> third line) and not the shipped one
    const third = buildPreview({ ...input, weather: { wind: 'none', rain: 'none', linePick: 0.9 } }).find((l) => l.key === 'conditions')!.text
    expect(third).not.toBe('A comfortable day for it, and no excuses in the air.')
  })
})

describe('§3.3 the diary and the photo caption', () => {
  const trip = (heatDay: boolean, rainDay: boolean) =>
    ({ heatDay, rainDay, wonTitle: false, lostFinal: false, reachedFinal: false, matchesWon: 0, firstRound: false, retired: false, injured: false, abroad: false, firstAbroad: false, birthdayAge: null, lifeStage: 'school', scene: 'car', mood: 'happy', tier: 'j60', finishIdx: 3, week: 5, injuryWeeks: 0, conditionBand: 'fresh' }) as unknown as Parameters<(typeof TRAVEL_NOTES)[number]['license']>[0]
  it('the travel notes for heat and rain are licensed only on a day with that fact', () => {
    const heat = TRAVEL_NOTES.find((n) => n.text.startsWith('It was baking out there'))!
    const rain = TRAVEL_NOTES.find((n) => n.text.startsWith('Rain at the courts.'))!
    expect(heat.license(trip(true, false))).toBe(true)
    expect(heat.license(trip(false, true))).toBe(false)
    expect(rain.license(trip(false, true))).toBe(true)
    expect(rain.license(trip(true, false))).toBe(false)
  })
  it('the facts come from the played event only: no match, no weather', () => {
    const ev = (week: number, friendly = false): WorldEvent =>
      ({ week, type: 'match', match: { eventId: '2031-w25-j60', surface: 'hard' }, friendly }) as unknown as WorldEvent
    const none = tournamentWeatherIn([], 25, 's')
    expect(none).toEqual({ heatDay: false, rainDay: false })
    expect(tournamentWeatherIn([ev(25, true)], 25, 's')).toEqual(none)
    expect(tournamentWeatherIn([ev(24)], 25, 's')).toEqual(none)
    // the same call the plate's engine makes
    const w = eventWeather('s', { id: '2031-w25-j60', surface: 'hard', week: 25 })
    expect(tournamentWeatherIn([ev(25)], 25, 's')).toEqual({ heatDay: w.temperatureC >= 30, rainDay: w.rain === 'falling' })
    // the threshold is 30 and not a looser or stricter number: find a summer hard day in 30..35 and a day in 24..29
    const day = (lo: number, hi: number) => {
      for (let i = 0; i < 400; i++) {
        const id = `2031-w25-x${i}`
        const t = eventWeather('s', { id, surface: 'hard', week: 25 }).temperatureC
        if (t >= lo && t <= hi) return id
      }
      throw new Error('no such day')
    }
    const at = (id: string): WorldEvent => ({ week: 25, type: 'match', match: { eventId: id, surface: 'hard' }, friendly: false }) as unknown as WorldEvent
    expect(tournamentWeatherIn([at(day(30, 35))], 25, 's').heatDay).toBe(true)
    expect(tournamentWeatherIn([at(day(24, 29))], 25, 's').heatDay).toBe(false)
  })
})

describe('§3.4 and the contract: stage 1 touches no match', () => {
  it('src/engine/match names no weather at all', () => {
    for (const f of readdirSync('src/engine/match')) {
      if (!f.endsWith('.ts')) continue
      expect(readFileSync(`src/engine/match/${f}`, 'utf8'), f).not.toMatch(/eventWeather|eventTemperature|:weather:|windLevel|RainState/)
    }
  })
})
