import { describe, it, expect } from 'vitest'
import { TIERS, buildSeason, isOffSeasonWeek, OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'

function countByTier(events: SeasonEvent[]): Record<TierId, number> {
  const c: Record<TierId, number> = { local: 0, regional: 0, national: 0, itf: 0 }
  for (const e of events) c[e.tier]++
  return c
}

describe('TIERS — tier catalogue', () => {
  it('has exactly the four tiers with the spec economy numbers (whole cents)', () => {
    expect(Object.keys(TIERS).sort()).toEqual(['itf', 'local', 'national', 'regional'])

    expect(TIERS.local.drawSize).toBe(8)
    expect(TIERS.local.everyNWeeks).toBe(2)
    expect(TIERS.local.entryFeeCents).toBe(40_00)
    expect(TIERS.local.travelCostCents).toEqual([60_00, 120_00])
    expect(TIERS.local.points).toEqual([30, 18, 10, 5])

    expect(TIERS.regional.drawSize).toBe(16)
    expect(TIERS.regional.everyNWeeks).toBe(4)
    expect(TIERS.regional.entryFeeCents).toBe(75_00)
    expect(TIERS.regional.travelCostCents).toEqual([150_00, 400_00])
    expect(TIERS.regional.points).toEqual([80, 48, 28, 14, 6])

    expect(TIERS.national.drawSize).toBe(32)
    expect(TIERS.national.everyNWeeks).toBe(13)
    expect(TIERS.national.entryFeeCents).toBe(120_00)
    expect(TIERS.national.travelCostCents).toEqual([400_00, 900_00])
    expect(TIERS.national.points).toEqual([200, 120, 70, 35, 15, 6])
  })

  it('itf is present but locked (everyNWeeks 0)', () => {
    expect(TIERS.itf.everyNWeeks).toBe(0)
    expect(TIERS.itf.id).toBe('itf')
  })

  it('each tier points array length matches rounds + 1', () => {
    for (const t of Object.values(TIERS)) {
      if (t.everyNWeeks === 0) continue
      const rounds = Math.log2(t.drawSize)
      expect(t.points.length).toBe(rounds + 1)
    }
  })

  it('every id field equals its record key', () => {
    for (const [key, def] of Object.entries(TIERS)) expect(def.id).toBe(key)
  })
})

describe('buildSeason — determinism', () => {
  it('same seed + span produces a deep-equal season', () => {
    const a = buildSeason('world-1:season', 0, 52)
    const b = buildSeason('world-1:season', 0, 52)
    expect(a).toEqual(b)
  })

  it('a different seed changes surfaces / travel costs', () => {
    const a = buildSeason('seed-A', 0, 52)
    const b = buildSeason('seed-B', 0, 52)
    expect(a).not.toEqual(b)
  })
})

describe('buildSeason — 52-week structure', () => {
  const events = buildSeason('struct-seed', 0, 52)

  it('yields 26 local / 13 regional / 4 national / 0 itf', () => {
    expect(countByTier(events)).toEqual({ local: 26, regional: 13, national: 4, itf: 0 })
  })

  it('never schedules two events in the same week', () => {
    const weeks = events.map((e) => e.week)
    expect(new Set(weeks).size).toBe(weeks.length)
  })

  it('deadline is always the end of week - 2', () => {
    for (const e of events) expect(e.deadlineWeek).toBe(e.week - 2)
  })

  it('local events never share a week with a national event', () => {
    const nationalWeeks = new Set(events.filter((e) => e.tier === 'national').map((e) => e.week))
    for (const e of events) if (e.tier === 'local') expect(nationalWeeks.has(e.week)).toBe(false)
  })

  it('all weeks fall inside the requested span and events come sorted', () => {
    for (const e of events) {
      expect(e.week).toBeGreaterThanOrEqual(0)
      expect(e.week).toBeLessThan(52)
    }
    const weeks = events.map((e) => e.week)
    expect(weeks).toEqual([...weeks].sort((x, y) => x - y))
  })

  it('every event has a valid surface and a travel cost within its tier band', () => {
    for (const e of events) {
      expect(['hard', 'clay', 'grass']).toContain(e.surface)
      const [lo, hi] = TIERS[e.tier].travelCostCents
      expect(e.travelCostCents).toBeGreaterThanOrEqual(lo)
      expect(e.travelCostCents).toBeLessThanOrEqual(hi)
    }
  })

  it('ids follow the `${year}-w${week}-${tier}` shape and are unique', () => {
    const ids = new Set<string>()
    for (const e of events) {
      expect(e.id).toBe(`${Math.floor(e.week / 52)}-w${e.week}-${e.tier}`)
      ids.add(e.id)
    }
    expect(ids.size).toBe(events.length)
  })
})

describe('buildSeason — surface weighting', () => {
  it('roughly follows hard 50 / clay 35 / grass 15 over many seasons', () => {
    const tally = { hard: 0, clay: 0, grass: 0 }
    let total = 0
    for (let s = 0; s < 60; s++) {
      for (const e of buildSeason(`surf-${s}`, 0, 52)) {
        tally[e.surface]++
        total++
      }
    }
    // Loose bands — this only guards against a badly wrong weighting.
    expect(tally.hard / total).toBeGreaterThan(0.4)
    expect(tally.hard / total).toBeLessThan(0.6)
    expect(tally.grass / total).toBeGreaterThan(0.08)
    expect(tally.grass / total).toBeLessThan(0.22)
    expect(tally.clay / total).toBeGreaterThan(0.27)
    expect(tally.clay / total).toBeLessThan(0.43)
  })
})

describe('isOffSeasonWeek — Round 5 items 16/21', () => {
  it('flags exactly the last 3 weeks of year 0 (weeks 49, 50, 51)', () => {
    for (let w = 0; w < 49; w++) expect(isOffSeasonWeek(w)).toBe(false)
    expect(isOffSeasonWeek(49)).toBe(true)
    expect(isOffSeasonWeek(50)).toBe(true)
    expect(isOffSeasonWeek(51)).toBe(true)
    expect(isOffSeasonWeek(52)).toBe(false) // year 1 begins fresh
  })

  it('repeats every WEEKS_PER_YEAR weeks (every season year gets the same 3-week gap)', () => {
    for (let year = 0; year < 5; year++) {
      const base = year * WEEKS_PER_YEAR
      for (let off = 0; off < WEEKS_PER_YEAR - OFF_SEASON_WEEKS; off++) {
        expect(isOffSeasonWeek(base + off)).toBe(false)
      }
      for (let off = WEEKS_PER_YEAR - OFF_SEASON_WEEKS; off < WEEKS_PER_YEAR; off++) {
        expect(isOffSeasonWeek(base + off)).toBe(true)
      }
    }
  })
})

describe('buildSeason — off-season carries no events (Round 5 items 16/21)', () => {
  it('never places an event in an off-season week, over many seeds/years', () => {
    for (let year = 0; year < 6; year++) {
      for (let s = 0; s < 10; s++) {
        const events = buildSeason(`off-${year}-${s}`, year * 52, 52)
        for (const e of events) expect(isOffSeasonWeek(e.week)).toBe(false)
      }
    }
  })

  it('tier counts are unaffected by the reserved off-season weeks', () => {
    const events = buildSeason('off-counts', 0, 52)
    expect(countByTier(events)).toEqual({ local: 26, regional: 13, national: 4, itf: 0 })
  })
})

describe("buildSeason — a career's first season never opens already-closed (round-5 item 2)", () => {
  it('places no first-block event before week 3, so every entry deadline is >= 1', () => {
    // Many seeds: the earliest event must never carry a deadline in the past at week 0.
    for (let s = 0; s < 40; s++) {
      const events = buildSeason(`first-${s}`, 0, 52)
      for (const e of events) {
        expect(e.week).toBeGreaterThanOrEqual(3)
        expect(e.deadlineWeek).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('still yields the full first-season counts inside the floored window', () => {
    expect(countByTier(buildSeason('first-counts', 0, 52))).toEqual({ local: 26, regional: 13, national: 4, itf: 0 })
  })

  it('does NOT floor later year-blocks (they already start at 52, 104, …)', () => {
    const events = buildSeason('later', 52, 52)
    expect(Math.min(...events.map((e) => e.week))).toBeGreaterThanOrEqual(52)  })
})

describe('buildSeason — offset spans', () => {
  it('keeps every event inside [fromWeek, fromWeek + weeks) and counts scale', () => {
    const events = buildSeason('offset-seed', 52, 52)
    for (const e of events) {
      expect(e.week).toBeGreaterThanOrEqual(52)
      expect(e.week).toBeLessThan(104)
    }
    expect(countByTier(events)).toEqual({ local: 26, regional: 13, national: 4, itf: 0 })
  })
})
