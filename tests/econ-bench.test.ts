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
  REACH_TARGET_MONEY,
  REACH_PRO_RANK,
  REACH_PRO_POINTS,
  EXPENSE_CATS,
  INCOME_CATS,
  type SeedResult,
} from '../tools/econ-bench'
import { STARTING_FUNDS_CENTS, kidPoints, financeWindow } from '../src/engine/world'
import { PARENT_INCOME_CENTS } from '../src/engine/world'

// The economy bench (Part C, extended to whole-horizon in Wave 1) is a MEASUREMENT tool: it must be
// deterministic (same seed+preset+horizon ⇒ identical numbers, no wall-clock/Math.random) and its
// per-SEASON accounting must reconcile with the finance aggregate it reads – including PAST 60 weeks,
// where the engine's 60-week finance pruning would silently drop early seasons. These tests pin the
// stat helpers, determinism, the multi-season finance fold, the reach tracker and survival flag.

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

  it('parent income is the deterministic weekly contribution plus injury-withdrawal refunds (no sponsor for middle)', () => {
    // yearStart-aligned folds capture, per season, weeks [52k .. 52k+49]: 49 weeks for season 0
    // (week 0 has no tick) and 50 weeks for every later season. Parent income is a fixed per-week
    // contribution. Season-Life slice C: an injury onset auto-withdraws pre-deadline entries and
    // the refund is an 'income'-category event (same bucket a manual withdrawal always used), so
    // cats.income = flat contribution x captured weeks + refunds banked inside captured folds –
    // reconstructed here by an independent replay. Middle never banks the (working-only)
    // local-sponsor cameo, so cats.sponsor stays 0.
    const capturedIncomeWeeks = (horizonWeeks: number) => 49 + 50 * (horizonWeeks / WEEKS_PER_YEAR - 1)
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
      expect(r.cats.income).toBe(PARENT_INCOME_CENTS.middle * capturedIncomeWeeks(h.weeks) + refundsCents)
      expect(r.cats.sponsor).toBe(0)
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

describe('reach tracker (points/rank proxy – prize money is not modeled)', () => {
  it('reachedWeek is the FIRST week the target predicate holds (14→16 = national eligibility)', () => {
    // Independent replay of the SAME deterministic career: find the first week kidPoints crosses the
    // national-eligibility proxy (>= REACH_TARGET_MONEY) and confirm runCareer recorded exactly that.
    for (const preset of PRESETS) {
      for (const index of [0, 1, 2, 3, 4]) {
        const r = runCareer(preset, index, H16.weeks)
        const { world, rng } = openCareer(preset, index)
        let firstCross: number | null = null
        for (let i = 0; i < H16.weeks; i++) {
          stepCareerWeek(world, rng)
          if (firstCross === null && kidPoints(world) >= REACH_TARGET_MONEY) firstCross = world.week
        }
        expect(r.reachedWeek).toBe(firstCross)
      }
    }
  })

  it('a career that clears the target has a non-null reachedWeek; one that never does is null', () => {
    // The 14→16 money proxy (kidPoints >= 150) is a genuine climb, so some working careers clear it
    // and others never accumulate 150 points inside 104 weeks – exercising BOTH the non-null and null
    // branches deterministically.
    const workingH16 = Array.from({ length: 30 }, (_, i) => runCareer(working, i, H16.weeks))
    expect(workingH16.some((r) => r.reachedWeek !== null)).toBe(true) // some clear it
    expect(workingH16.some((r) => r.reachedWeek === null)).toBe(true) // some never do
    for (const r of workingH16) {
      if (r.reachedWeek !== null) {
        expect(r.reachedWeek).toBeGreaterThan(0)
        expect(r.reachedWeek).toBeLessThanOrEqual(H16.weeks)
      }
    }
  })

  it('the 14→18 pro proxy guards the rank arm with hasResults (no rank credit until a counting result)', () => {
    // RE-PINNED by ladder-up Part A (cohort pre-history). The degeneracy this guard was written
    // against – a brand-new career tying the whole 0-point field at dense-rank 1, so an unguarded
    // `kidRank <= 50` "reached pro" at week 1 – is now fixed AT SOURCE: the cohort carries a real
    // season of results, so the point-less kid is the ONLY 0-point player and starts ranked LAST.
    // The guard is kept (it is still the correct predicate, and it is what stops a future
    // ranking change from re-opening the hole), but the assertion is inverted to pin the fix.
    //
    // ⚠ RE-PINNED 200 -> 195 by wave B "first-round loss pays ZERO" (tune/first-round-zero). She is
    // no longer the ONLY 0-point player: pre-history draws first-round exits, which are now worth
    // 0, so a handful of cohort players share the bottom rank with her (5 here). What this test
    // actually needs is unchanged and is what is asserted: she starts FAR outside the top 50 with
    // no counting result, so the unguarded `kidRank <= 50` arm would still be wrong at week 1 and
    // the hasResults guard is still doing real work. Full note in tests/season/prehistory.test.ts.
    const fresh = openCareer(wealthy, 0)
    expect(fresh.world.kidRank).toBe(195)
    expect(fresh.world.kidRank).toBeGreaterThan(REACH_PRO_RANK)
    expect(kidPoints(fresh.world)).toBe(0) // ...and still no counting result

    // reachedWeek(pro) must match an INDEPENDENT replay of the GUARDED predicate, and must NOT be the
    // week-1 degenerate value: the rank arm only fires once she owns a counting result (points > 0),
    // which mirrors the engine's `ranked = countingResults.length > 0` signal.
    for (const preset of PRESETS) {
      for (const index of [0, 1, 2]) {
        const r = runCareer(preset, index, H18.weeks)
        const { world, rng } = openCareer(preset, index)
        let firstReach: number | null = null
        for (let i = 0; i < H18.weeks; i++) {
          stepCareerWeek(world, rng)
          const pts = kidPoints(world)
          const hasResults = pts > 0 // == computeCountingResults(world).length > 0 (every kid result scores)
          const met = (hasResults && world.kidRank <= REACH_PRO_RANK) || pts >= REACH_PRO_POINTS
          if (firstReach === null && met) firstReach = world.week
        }
        expect(r.reachedWeek).toBe(firstReach)
        expect(r.reachedWeek).not.toBe(1) // the guard kills the week-1 degeneracy (null or a real week)
        if (r.reachedWeek !== null) expect(r.reachedWeek).toBeGreaterThan(2) // only after a scoring result lands
      }
    }
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
