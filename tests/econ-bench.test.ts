import { describe, it, expect, vi } from 'vitest'

// Whole-horizon career replays are deterministic but SLOW, and they sit close enough to vitest's
// 5s default that a busy run tips them over - the gate then goes red on timing, not on a claim.
// Two independent reasons pile up: the suite runs eight files in parallel, and the ladder-up
// calendar made a 14->18 career far heavier (several draw-32 AI tournaments a week once she reaches
// the J-tiers). Same generous file-level timeout the fatigue bench already carries, same reason.
vi.setConfig({ testTimeout: 240_000 })
import {
  runCareer,
  openCareer,
  stepCareerWeek,
  mean,
  stddev,
  median,
  PRESETS,
  HORIZONS,
  WEEKS_PER_YEAR,
  SEASON_WRAP_OFFSET,
  START_AGE_YEARS,
  EXPENSE_CATS,
  INCOME_CATS,
  type SeedResult,
} from '../tools/econ-bench'
import { STARTING_FUNDS_CENTS, financeWindow } from '../src/engine/world'
import { ECONOMY, parentIncomeForWeekCents } from '../src/engine/economy'

// The economy bench (Part C, extended to whole-horizon in Wave 1) is a MEASUREMENT tool: it must be
// deterministic (same seed+preset+horizon ⇒ identical numbers, no wall-clock/Math.random) and its
// per-SEASON accounting must reconcile with the finance aggregate it reads – including PAST 60 weeks,
// where the engine's 60-week finance pruning would silently drop early seasons. These tests pin the
// stat helpers, determinism, the multi-season finance fold and survival flag.
//
// ⚠ THE REACH-TRACKER DESCRIBE LIVES IN tests/econ-reach.test.ts SINCE 01.08 (P6 (d)) — moved, not
// deleted: it alone was ~40s of Monte-Carlo, and one file that heavy sits inside birpc's hard 60s
// RPC timeout on a slow runner, failing `test:sim` with every test green. Same coverage, own file.

const middle = PRESETS.find((p) => p.background === 'middle')!
const working = PRESETS.find((p) => p.background === 'working')!
const wealthy = PRESETS.find((p) => p.background === 'wealthy')!

const H16 = HORIZONS.find((h) => h.weeks === 104)!
const H18 = HORIZONS.find((h) => h.weeks === 208)!

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

describe('runCareer determinism', () => {
  it('same preset+index+horizon reproduces byte-identical results (deep equal)', () => {
    const a = runCareer(middle, 0, H16.weeks)
    const b = runCareer(middle, 0, H16.weeks)
    expect(a).toEqual(b)
  })

  it('the seed varies by index, so different indices give different runs', () => {
    const a = runCareer(middle, 0, H16.weeks)
    const b = runCareer(middle, 1, H16.weeks)
    expect(a.seed).not.toBe(b.seed)
    expect(a).not.toEqual(b)
  })
})

describe('per-season capture fires (targetAge - 14) times', () => {
  it('a 14→18 run yields exactly 4 perSeason entries; 14→16 yields 2', () => {
    expect(runCareer(middle, 0, H18.weeks).perSeason).toHaveLength(4)
    expect(runCareer(middle, 0, H16.weeks).perSeason).toHaveLength(2)
    // guard: it holds across every preset, not just middle
    for (const preset of PRESETS) {
      expect(runCareer(preset, 0, H16.weeks).perSeason).toHaveLength(2)
      expect(runCareer(preset, 0, H18.weeks).perSeason).toHaveLength(4)
    }
  })
})

describe('runCareer accounting reconciles with the finance aggregate', () => {
  it('net == total income - gross expense, and net == the sum of the per-season folds', () => {
    for (const preset of PRESETS) {
      for (const h of [H16, H18]) {
        const r = runCareer(preset, 0, h.weeks)
        expect(r.netCents).toBe(r.totalIncomeCents - r.grossExpenseCents)
        expect(r.netCents).toBe(r.perSeason.reduce((s, p) => s + p.netCents, 0))
      }
    }
  })

  it('gross expense is the sum of the expense categories; income is the sum of the income categories', () => {
    const r = runCareer(working, 0, H16.weeks)
    const expSum = EXPENSE_CATS.reduce((s, c) => s + r.cats[c], 0)
    const incSum = INCOME_CATS.reduce((s, c) => s + r.cats[c], 0)
    expect(expSum).toBe(r.grossExpenseCents)
    expect(incSum).toBe(r.totalIncomeCents)
  })

  it('parent income is the deterministic weekly contribution plus injury-withdrawal refunds (sponsor is a separate bucket)', () => {
    // yearStart-aligned folds capture, per season, weeks [52k .. 52k+49]: 49 weeks for season 0
    // (week 0 has no tick) and 50 weeks for every later season. Parent income is a fixed per-week
    // contribution. Season-Life slice C: an injury onset auto-withdraws pre-deadline entries and
    // the refund is an 'income'-category event (same bucket a manual withdrawal always used), so
    // cats.income = flat contribution x captured weeks + refunds banked inside captured folds –
    // reconstructed here by an independent replay.
    //
    // ⚠ RE-AIMED 30.07 (tune/rank-numbers). This used to also assert `cats.sponsor === 0`, on the
    // reasoning that "middle never banks the (working-only) local-sponsor cameo". That reasoning was
    // sound and is now incomplete: there are TWO sponsor mechanisms sharing the 'sponsor' bucket, and
    // the second one is new. The random CAMEO is still working-only (ECONOMY.sponsor.eligible) and a
    // middle career still never banks it. The local sponsor's ANNUAL GRANT is open to every
    // background on purpose - it is a reward for doing well on the national ladder, not a means-tested
    // subsidy, and a shop backing the local girl does not audit her parents. So middle now banks
    // grants and the bucket is non-zero.
    //
    // THE PROTECTED FACT IS THE ONE ABOVE IT, and it is untouched: `cats.income` must equal the
    // independently-replayed parent contribution plus refunds EXACTLY - i.e. no sponsor money has
    // leaked into the income bucket. That is what this case is for, and asserting the sponsor bucket
    // is a whole multiple of the grant is a sharper version of the same separation check than
    // asserting it is zero.
    // Round 12: the contribution GROWS per season (parentIncomeForWeekCents, +5-10% compounding),
    // so "weeks x flat constant" became "sum the per-week amount over the captured weeks". The
    // capture window per season is unchanged: weeks [52k .. 52k+49] of every season whose wrap
    // lands inside the horizon (49 weeks of season 0, 50 of each later one - week 52k is week 0
    // of the season and pays too).
    const capturedIncomeCents = (horizonWeeks: number) => {
      let total = 0
      for (let w = 0; w < horizonWeeks; w++) {
        const year = Math.floor(w / WEEKS_PER_YEAR)
        const inFold = w % WEEKS_PER_YEAR <= SEASON_WRAP_OFFSET && year * WEEKS_PER_YEAR + SEASON_WRAP_OFFSET <= horizonWeeks
        if (w > 0 && inFold) total += parentIncomeForWeekCents('bench-middle-0', 'middle', w)
      }
      return total
    }
    for (const h of [H16, H18]) {
      const r = runCareer(middle, 0, h.weeks)
      const { world, rng } = openCareer(middle, 0)
      let refundsCents = 0
      for (let i = 0; i < h.weeks; i++) {
        stepCareerWeek(world, rng)
        const year = Math.floor(world.week / WEEKS_PER_YEAR)
        const capturedWeek =
          world.week % WEEKS_PER_YEAR <= SEASON_WRAP_OFFSET && // inside the fold window [52k .. 52k+49]
          year * WEEKS_PER_YEAR + SEASON_WRAP_OFFSET <= h.weeks // ...of a season whose wrap lands in-horizon
        if (!capturedWeek) continue
        refundsCents += world.events
          .filter((e) => e.week === world.week && e.text.startsWith('Entry refunded'))
          .reduce((s, e) => s + (e.amountCents ?? 0), 0)
      }
      expect(r.cats.income).toBe(capturedIncomeCents(h.weeks) + refundsCents)
      // The sponsor bucket holds ONLY whole annual grants for a middle career (no cameo, which is
      // working-only), so it is an exact multiple of one of the two grant sizes and never a stray
      // fraction of the income line.
      const { seasonCents, topSeasonCents } = ECONOMY.sponsorship
      expect(r.cats.sponsor % seasonCents === 0 || r.cats.sponsor % topSeasonCents === 0).toBe(true)
      // ...and it is capped by the number of season boundaries inside the horizon: a grant lands at
      // weeks 52, 104, 156, 208, and the LAST one falls outside the finance fold (which closes at the
      // wrap, week 52k+49), so at most `floor(weeks/52) - 1` grants can appear in this bucket.
      const foldedBoundaries = Math.max(0, Math.floor(h.weeks / WEEKS_PER_YEAR) - 1)
      expect(r.cats.sponsor).toBeLessThanOrEqual(foldedBoundaries * topSeasonCents)
    }
  })
})

describe('finance read is correct PAST the 60-week pruning window (the crux)', () => {
  it('cumulative net == sum of the two per-year folds, and != the pruned financeWindow(fw,0)', () => {
    // A 14→16 run is 104 weeks, well past the engine's 60-week finance retention. Coaching bleeds
    // every single week, so spend accrues in both seasons.
    const r = runCareer(middle, 0, H16.weeks)
    expect(r.perSeason).toHaveLength(2)
    // The bench sums the per-season folds captured AT each wrap (before pruning eats the early weeks).
    expect(r.netCents).toBe(r.perSeason.reduce((s, p) => s + p.netCents, 0))
    // The naive read financeWindow(financeWeeks, 0) at horizon end only sees the last ~60 weeks (the
    // ledger was pruned), so it must NOT equal the true cumulative net – this guards the pruning bug.
    expect(r.naiveNetCents).not.toBe(r.netCents)
    expect(Math.abs(r.netCents - r.naiveNetCents)).toBeGreaterThan(0)
  })

  it('the naive read really is the pruned window and undercounts the horizon', () => {
    // Independent replay: open the same career, tick 104 weeks, and confirm the ledger no longer
    // reaches back to week 0 (so financeWindow(fw,0) is a partial, pruned read).
    const { world, rng } = openCareer(middle, 0)
    for (let i = 0; i < H16.weeks; i++) stepCareerWeek(world, rng)
    const earliestWeek = Math.min(...world.financeWeeks.map((w) => w.week))
    expect(earliestWeek).toBeGreaterThan(0) // early weeks have been pruned away
    const naive = financeWindow(world.financeWeeks, 0)
    expect(naive.startWeek).toBe(0)
    // it only aggregates the retained tail, never the full career
    expect(world.financeWeeks.length).toBeLessThanOrEqual(60)
  })
})

describe('survival flag and bankruptcy tracking', () => {
  it('survived === (weeksToBankrupt === null) across presets and horizons', () => {
    for (const preset of PRESETS) {
      for (const index of [0, 1]) {
        for (const h of [H16, H18]) {
          const r = runCareer(preset, index, h.weeks)
          expect(r.survived).toBe(r.weeksToBankrupt === null)
        }
      }
    }
  })

  it('weeksToBankrupt is null-or-in-range, and a red run has a negative peak deficit', () => {
    const results: SeedResult[] = PRESETS.flatMap((p) => [runCareer(p, 0, H16.weeks), runCareer(p, 1, H16.weeks)])
    for (const r of results) {
      if (r.weeksToBankrupt !== null) {
        expect(r.weeksToBankrupt).toBeGreaterThanOrEqual(0)
        expect(r.weeksToBankrupt).toBeLessThanOrEqual(H16.weeks)
        expect(r.peakDeficitCents).toBeLessThan(0)
      }
    }
  })
})

describe('entries-per-career counter (ranking gate)', () => {
  it('the per-tier split sums to the total, and the gate keeps entries under one-per-week', () => {
    for (const preset of PRESETS) {
      for (const index of [0, 1, 2]) {
        const r = runCareer(preset, index, H16.weeks)
        // RE-PINNED by ladder-up Part B: the split covers the whole six-rung catalogue now
        // (local/regional/national + j30/j60/j300), not the three hard-coded playable tiers.
        expect(r.entries.total).toBe(Object.values(r.entries.byTier).reduce((s, n) => s + n, 0))
        expect(r.entries.total).toBeGreaterThanOrEqual(0)
        expect(r.entries.total).toBeLessThan(H16.weeks)
      }
    }
  })
})

describe('end-state fields', () => {
  it('endRank / endPoints are exposed and consistent with the reach proxy', () => {
    const r = runCareer(wealthy, 0, H16.weeks)
    expect(Number.isInteger(r.endRank)).toBe(true)
    expect(r.endPoints).toBeGreaterThanOrEqual(0)
    // sanity: STARTING_FUNDS is a real preset number the report leans on
    expect(STARTING_FUNDS_CENTS[wealthy.background]).toBeGreaterThan(0)
    expect(START_AGE_YEARS).toBe(14)
  })
})
