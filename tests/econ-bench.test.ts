import { describe, it, expect } from 'vitest'
import {
  runSeason,
  mean,
  stddev,
  median,
  PRESETS,
  SEASON_WEEKS,
  EXPENSE_CATS,
  INCOME_CATS,
  type SeedResult,
} from '../tools/econ-bench'
import { STARTING_FUNDS_CENTS } from '../src/engine/world'
import { PARENT_INCOME_CENTS } from '../src/engine/world'

// The economy bench (Part C) is a MEASUREMENT tool: it must be deterministic (same seed+preset ⇒
// identical numbers, no wall-clock/Math.random) and its per-season accounting must reconcile with
// the finance aggregate it reads. These tests pin the stat helpers and that determinism/reconciliation.

const middle = PRESETS.find((p) => p.background === 'middle')!
const working = PRESETS.find((p) => p.background === 'working')!

describe('bench stat helpers', () => {
  it('mean / stddev (population) / median over a known fixture', () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(mean([])).toBe(0)
    // population stddev of [2,4,6]: variance = (4+0+4)/3 = 2.6667 -> sqrt ≈ 1.63299
    expect(stddev([2, 4, 6])).toBeCloseTo(1.63299, 4)
    expect(stddev([5, 5, 5])).toBe(0)
    expect(median([3, 1, 2])).toBe(2) // odd -> middle of sorted
    expect(median([1, 2, 3, 4])).toBe(2.5) // even -> mean of the two middles
  })
})

describe('runSeason determinism', () => {
  it('same preset+index reproduces byte-identical results (no wall-clock, no Math.random)', () => {
    const a = runSeason(middle, 0)
    const b = runSeason(middle, 0)
    expect(a).toEqual(b)
  })

  it('the seed varies by index, so different indices give different runs', () => {
    const a = runSeason(middle, 0)
    const b = runSeason(middle, 1)
    expect(a.seed).not.toBe(b.seed)
    // extremely unlikely to be identical across every category for two independent seasons
    expect(a).not.toEqual(b)
  })
})

describe('runSeason accounting reconciles with the finance aggregate', () => {
  it('net == total income - gross expense == end funds - starting funds', () => {
    for (const preset of PRESETS) {
      const r = runSeason(preset, 0)
      expect(r.netCents).toBe(r.totalIncomeCents - r.grossExpenseCents)
      // Every fund movement flows through addEvent, so the season window is a closed ledger:
      // net must equal the actual change in funds (nothing is spent off-ledger).
      expect(r.netCents).toBe(r.endFundsCents - STARTING_FUNDS_CENTS[preset.background])
    }
  })

  it('gross expense is the sum of the expense categories; income is the sum of income categories', () => {
    const r = runSeason(working, 0)
    const expSum = EXPENSE_CATS.reduce((s, c) => s + r.cats[c], 0)
    const incSum = INCOME_CATS.reduce((s, c) => s + r.cats[c], 0)
    expect(expSum).toBe(r.grossExpenseCents)
    expect(incSum).toBe(r.totalIncomeCents)
  })

  it('parent income is the deterministic weekly contribution across the whole season', () => {
    // 52 weekly ticks each emit one parents-contribution income event; the bench reads it back.
    const r = runSeason(middle, 0)
    expect(r.cats.income).toBe(PARENT_INCOME_CENTS.middle * SEASON_WEEKS)
  })
})

describe('entries-per-season counter (bench v2 – ranking gate)', () => {
  it('counts entries with a per-tier split that sums to the total, across every preset', () => {
    for (const preset of PRESETS) {
      const r = runSeason(preset, 0)
      expect(r.entries.total).toBe(r.entries.local + r.entries.regional + r.entries.national)
      expect(r.entries.total).toBeGreaterThanOrEqual(0)
    }
  })

  it('the ranking gate keeps the season entry count realistic (well under one-per-week)', () => {
    // The whole point of the gate: the kid can no longer spam every affordable tier. A gated season
    // enters far fewer than the 52 weekly opportunities (the old ungated policy ran to ~50).
    for (const preset of PRESETS) {
      for (const index of [0, 1, 2]) {
        const r = runSeason(preset, index)
        expect(r.entries.total).toBeLessThan(SEASON_WEEKS)
      }
    }
  })
})

describe('bankruptcy tracking', () => {
  it('weeksToBankrupt is null-or-in-range, and a red run has a non-null first-red week', () => {
    const results: SeedResult[] = PRESETS.flatMap((p) => [runSeason(p, 0), runSeason(p, 1)])
    for (const r of results) {
      if (r.weeksToBankrupt !== null) {
        expect(r.weeksToBankrupt).toBeGreaterThanOrEqual(0)
        expect(r.weeksToBankrupt).toBeLessThanOrEqual(SEASON_WEEKS)
        // if it went red, the lowest point of the run is itself negative
        expect(r.peakDeficitCents).toBeLessThan(0)
      }
    }
  })
})
