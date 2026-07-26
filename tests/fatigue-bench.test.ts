import { describe, it, expect, vi } from 'vitest'

// Monte-Carlo cells (30 seeds × 52-208 engine-weeks) finish in ~1-4s on a dev Mac but blow the
// 5s default on a 2-core CI runner (observed: the ordering + 104w-anchor tests timing out in the
// PR run). One generous file-level timeout instead of per-test surgery – these tests are
// deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import {
  PROFILES,
  POLICIES,
  FATIGUE_HORIZONS,
  SEEDS_PER_CELL,
  GRID_SEEDS,
  GRID_HORIZON_WEEKS,
  gridPolicies,
  SCENARIOS,
  RUNFAT_SCENARIOS,
  RUNFAT_LADDERS,
  ALL_SCENARIOS,
  parseScenarioArg,
  withScenario,
  effectivePhysio,
  plannerPolicies,
  GRID_PRACTICE,
  GRID_VACATION,
  NO_PLANNER,
  openFatigueCareer,
  stepFatigueWeek,
  runFatigueCareer,
  runCell,
  computeCellStats,
  sparkChar,
  sparkRows,
  mean,
  stddev,
  toCsv,
  type WeekFacts,
} from '../tools/fatigue-bench'
import { ECONOMY } from '../src/engine/economy'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// The fatigue bench is a MEASUREMENT tool for the round-9 condition math: it must be
// deterministic, its policy ordering must reflect the load-management axis it exists to compare,
// and its condition trace must be exactly the owner's formula – re-derived here INDEPENDENTLY
// from the ECONOMY knobs (no accrueCondition/matchDrain imports) and compared byte-for-byte.

const working = PROFILES.find((p) => p.background === 'working')!
const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachSetup === 'parent')!
const middleHired = PROFILES.find((p) => p.background === 'middle' && p.coachSetup === 'hired')!

const grinder = POLICIES.find((p) => p.id === 'grinder')!
const balanced = POLICIES.find((p) => p.id === 'balanced')!
const careful = POLICIES.find((p) => p.id === 'careful')!

const H52 = FATIGUE_HORIZONS.find((h) => h.weeks === 52)!
const H104 = FATIGUE_HORIZONS.find((h) => h.weeks === 104)!

describe('bench stat helpers', () => {
  it('mean / population stddev over a known fixture', () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(mean([])).toBe(0)
    expect(stddev([2, 4, 6])).toBeCloseTo(1.63299, 4)
    expect(stddev([5, 5, 5])).toBe(0)
  })

  it('sparkline blocks span the condition range and rows split per season', () => {
    expect(sparkChar(0)).toBe('▁')
    expect(sparkChar(100)).toBe('█')
    expect(sparkChar(50)).toBe('▅')
    const rows = sparkRows(Array.from({ length: 104 }, () => 75))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(52)
    expect(rows[1]).toHaveLength(52)
  })
})

describe('determinism (same cell → deep-equal)', () => {
  it('same (profile, policy, index, horizon) reproduces byte-identically', () => {
    const a = runFatigueCareer(middleHired, grinder, 0, H52.weeks)
    const b = runFatigueCareer(middleHired, grinder, 0, H52.weeks)
    expect(a).toEqual(b)
  })

  it('a whole cell reproduces deep-equal, and the seed varies by index only', () => {
    const a = runCell(working, careful, H52.weeks)
    const b = runCell(working, careful, H52.weeks)
    expect(a).toEqual(b)
    expect(a).toHaveLength(SEEDS_PER_CELL)
    expect(a[0].seed).not.toBe(a[1].seed)
    // Paired seeds: policy is NOT in the seed, so every policy faces the same world.
    expect(runFatigueCareer(working, grinder, 3, H52.weeks).seed).toBe(a[3].seed)
  })
})

describe('run structure', () => {
  it('weekly trace spans the horizon; bands partition it; W-L reconciles; seasons captured', () => {
    for (const policy of POLICIES) {
      const r = runFatigueCareer(middleSelf, policy, 1, H104.weeks)
      expect(r.weekly).toHaveLength(H104.weeks)
      expect(r.bandLow + r.bandMid + r.bandHigh).toBe(H104.weeks)
      expect(r.wins + r.losses).toBe(r.matchesPlayed)
      expect(r.endOfSeasonCondition).toHaveLength(H104.seasons) // wk49 of each season (pre-restore)
      expect(r.postOffSeasonCondition).toHaveLength(H104.seasons) // wk51 (after the blackout weeks)
      expect(r.seasonsWithInjury).toBeGreaterThanOrEqual(0)
      expect(r.seasonsWithInjury).toBeLessThanOrEqual(H104.seasons) // prevalence numerator is per season-year
      expect(r.injuriesTotal).toBe(
        r.injuriesBySeverity.minor + r.injuriesBySeverity.moderate + r.injuriesBySeverity.major + r.injuriesBySeverity.severe,
      )
      expect(r.trough).toBe(Math.min(...r.weekly.map((w) => w.condition)))
    }
  })

  it('the CSV time-series has one row per (seed, week) plus the header, labeled by scenario', () => {
    const runs = [runFatigueCareer(working, balanced, 0, H52.weeks)]
    const csv = toCsv([{ scenario: SCENARIOS[0], horizon: H52, profile: working, policy: balanced, runs }])
    expect(csv.trim().split('\n')).toHaveLength(1 + H52.weeks)
    expect(csv.split('\n')[1].startsWith('baseline,')).toBe(true)
  })
})

describe('policy ordering (the load-management axis)', () => {
  // Self-coached profiles are the clean read: physio is OFF for grinder/balanced there, so the
  // three policies actually differ in recovery. (On hired-coach profiles the default physio +2
  // saturates all three at the cap and the ordering collapses to a tie – a bench FINDING, not a
  // bench bug; see the anchor test below.)
  it('mean condition: grinder < balanced < careful (both self-coached profiles, 52w)', () => {
    for (const profile of [working, middleSelf]) {
      const g = computeCellStats(profile, grinder, H52, runCell(profile, grinder, H52.weeks))
      const b = computeCellStats(profile, balanced, H52, runCell(profile, balanced, H52.weeks))
      const c = computeCellStats(profile, careful, H52, runCell(profile, careful, H52.weeks))
      expect(g.meanCond).toBeLessThan(b.meanCond)
      expect(b.meanCond).toBeLessThan(c.meanCond)
    }
  })

  it('injuries/season: grinder > careful; the spec ≥3x anchor is NOT met – pinned as the round-9 finding', () => {
    // Pooled over both self-coached profiles at 52w for stability (paired seeds).
    const gRuns = [...runCell(working, grinder, H52.weeks), ...runCell(middleSelf, grinder, H52.weeks)]
    const cRuns = [...runCell(working, careful, H52.weeks), ...runCell(middleSelf, careful, H52.weeks)]
    const gInj = gRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    const cInj = cRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    expect(gInj).toBeGreaterThan(cInj) // direction holds
    // *** RE-PINNED 25.07 with the V2.1 flip (shipped: recoveryBase 1, match weeks 0, physio 1):
    // at 52w the pooled self-coached ratio sits ~2.6x (one season is too short for the grinder's
    // downward drift to fully separate tau), still shy of the spec's ≥3x. ***
    const ratio = gInj / cInj
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(3)
  })

  it('the C3 ≥3x anchor RETURNS at 104w under the shipped V2.1 knobs (multi-season drift)', () => {
    // The owner's target metric: across two seasons the enter-everything grinder drifts low
    // enough that fatigue-tau separation finally triples the careful player's injury rate.
    // *** SEEDS TRIMMED 25.07 (ladder-up): sim cost per week is no longer flat – once she climbs
    // into the J-tiers the calendar stacks several draw-32 AI tournaments EVERY week, so a 104w
    // career costs orders of magnitude more than a 52w one (measured uncontended: the 52w pooling
    // above runs in 1.5s, this one took 908s at 30 seeds and blew the CI timeout). 10 paired seeds
    // per cell (40 careers over two seasons) still separates a ~3-4x ratio cleanly;
    // `npm run bench:fatigue` keeps the full 30. ***
    const N = 10
    const gRuns = [...runCell(working, grinder, H104.weeks, N), ...runCell(middleSelf, grinder, H104.weeks, N)]
    const cRuns = [...runCell(working, careful, H104.weeks, N), ...runCell(middleSelf, careful, H104.weeks, N)]
    const gInj = gRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    const cInj = cRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    expect(gInj / cInj).toBeGreaterThanOrEqual(3)
  })
})

describe('formula spot-check: independent condition-trace recomputation (byte-equal)', () => {
  // Replays one seed per policy and recomputes the weekly condition trace from the ECONOMY
  // knobs alone: +recoveryBase, the rest-slider threshold bonus on match-free weeks (0/1/2),
  // +physio bonus, +blackout bonus, then the per-match drains (straight sets 1 / 3-setter-or-TB
  // 2 / +1 past two TB sets, + tier surcharge), each side clamped to [min,max] exactly like the
  // engine's accrue-then-commit order. NO engine condition function is imported.
  function independentTrace(facts: WeekFacts[], restPercent: number, physioActive: boolean): number[] {
    const k = ECONOMY.condition
    const clamp = (x: number) => Math.min(k.max, Math.max(k.min, x))
    /** the season-planner drain of a friendly, re-derived from its scoreline: max(1, local − 1). */
    const practiceDrainOf = (score: string): number => {
      const sets = score ? score.split(' ') : []
      const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
      let d = sets.length >= 3 || tiebreaks >= 1 ? k.matchFatigue.hardMatch : k.matchFatigue.straightSets
      if (tiebreaks > 2) d += k.matchFatigue.extraTiebreaks
      return Math.max(1, d + k.tierMatchFatigue.local - 1)
    }
    let c: number = k.start
    const out: number[] = []
    for (const f of facts) {
      // match week → matchWeekRecoveryBase (the V2 knob; == recoveryBase at the shipped
      // default); match-free week → recoveryBase + the rest-slider threshold bonus.
      let bonus = 0
      for (const { minRest, bonus: b } of k.restRecoveryBonus) {
        if (restPercent >= minRest) {
          bonus = b
          break // first (highest) matching threshold wins – never interpolated
        }
      }
      // WEEK-TYPE LADDER (season-planner spec §4): tournament week 0 base · PRACTICE week keeps
      // the base but FORFEITS the slider bonus · free/vacation week base + slider.
      let recovery = f.played
        ? k.matchWeekRecoveryBase
        : f.practiced
          ? k.recoveryBase
          : k.recoveryBase + bonus
      if (physioActive) recovery += ECONOMY.physio.conditionBonusPerWeek
      const offset = ((f.week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
      const offSeason = offset >= WEEKS_PER_YEAR - OFF_SEASON_WEEKS
      const exam = ECONOMY.availability.examWeeks.some(([lo, hi]) => offset >= lo && offset <= hi)
      if (offSeason || exam) recovery += k.blackoutBonus
      c = clamp(c + recovery)
      // then the planner's own two effects, in the engine's order: the vacation package's gain,
      // then the friendly's drain.
      if (f.vacationResolvedId) {
        const pkg = ECONOMY.vacation.packages.find((p) => p.id === f.vacationResolvedId)!
        c = clamp(c + pkg.conditionGain)
      }
      if (f.practiced) c = clamp(c - practiceDrainOf(f.practiceScore))
      let strain = 0
      f.matchScores.forEach((score, i) => {
        const sets = score ? score.split(' ') : []
        const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
        let d = sets.length >= 3 || tiebreaks >= 1 ? k.matchFatigue.hardMatch : k.matchFatigue.straightSets
        if (tiebreaks > 2) d += k.matchFatigue.extraTiebreaks
        // CUMULATIVE RUN FATIGUE (owner 26.07): the run's i-th match (0-based) also pays the
        // ladder's extra – re-derived here from the knob, including the repeat-last-value rule
        // for a run longer than the ladder. Her first match of the run always pays 0.
        const ladder = k.runFatigueLadder
        const extra = ladder.length === 0 ? 0 : ladder[Math.min(i, ladder.length - 1)]
        strain += d + k.tierMatchFatigue[f.tierPlayed as TierId] + extra
      })
      c = clamp(c - strain)
      out.push(c)
    }
    return out
  }

  it('the engine trace matches the owner-math recomputation byte-for-byte (all 3 policies, 104w)', () => {
    for (const policy of POLICIES) {
      const { world, rng } = openFatigueCareer(middleSelf, policy, 0)
      const physioActive = world.physioActive // constant for the whole run (the bench never toggles)
      const facts: WeekFacts[] = []
      const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
      for (let i = 0; i < H104.weeks; i++) facts.push(stepFatigueWeek(world, rng, policy, plannerState))

      const engineTrace = facts.map((f) => f.condition)
      const recomputed = independentTrace(facts, policy.plan.rest, physioActive)
      expect(JSON.stringify(recomputed)).toBe(JSON.stringify(engineTrace)) // byte-equal

      // and the runner reports the same trace (runFatigueCareer wraps stepFatigueWeek)
      const r = runFatigueCareer(middleSelf, policy, 0, H104.weeks)
      expect(r.weekly.map((w) => w.condition)).toEqual(engineTrace)
      // the trace must actually exercise matches, or the drain arm was never tested
      expect(facts.some((f) => f.matchScores.length > 0)).toBe(true)
    }
  })

  it('the trace ALSO matches under the v2 scenario (live knobs) – recoveryBase is wired exactly', () => {
    // Inside withScenario(v2) both the engine AND the recomputation read the patched knobs
    // (recoveryBase 2 instead of the shipped 1), so byte-equality proves the whole knob set
    // lands on exactly the right weeks.
    const v2 = SCENARIOS.find((s) => s.id === 'v2')!
    withScenario(v2, () => {
      for (const policy of POLICIES) {
        const { world, rng } = openFatigueCareer(middleSelf, policy, 0)
        const physioActive = world.physioActive
        const facts: WeekFacts[] = []
        // ONE shared planner state for the whole career – the alternating practice cursor and the
        // once-a-year off-season booking live there (runFatigueCareer does exactly the same).
        const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
        for (let i = 0; i < H104.weeks; i++) facts.push(stepFatigueWeek(world, rng, policy, plannerState))
        const engineTrace = facts.map((f) => f.condition)
        expect(JSON.stringify(independentTrace(facts, policy.plan.rest, physioActive))).toBe(
          JSON.stringify(engineTrace),
        )
        expect(facts.some((f) => f.matchScores.length > 0)).toBe(true)
      }
    })
  })

  it('physio wiring: careful forces on; grinder/balanced follow the coach default; grid "off" forces off', () => {
    expect(openFatigueCareer(middleSelf, careful, 0).world.physioActive).toBe(true)
    expect(openFatigueCareer(middleSelf, grinder, 0).world.physioActive).toBe(false)
    expect(openFatigueCareer(middleHired, grinder, 0).world.physioActive).toBe(true)
    const off = gridPolicies().find((p) => p.physio === 'off')!
    expect(openFatigueCareer(middleHired, off, 0).world.physioActive).toBe(false) // overrides the hired default
    const on = gridPolicies().find((p) => p.physio === 'on')!
    expect(openFatigueCareer(middleSelf, on, 0).world.physioActive).toBe(true) // overrides the parent default
  })
})

describe('factorial grid (owner 25.07: unbundled axes)', () => {
  it('is the full 3x2x2 = 12-cell factorial with unique ids, built as data', () => {
    const grid = gridPolicies()
    expect(grid).toHaveLength(12)
    expect(new Set(grid.map((p) => p.id)).size).toBe(12)
    for (const plan of [85, 75, 60]) {
      for (const margin of [null, 10]) {
        for (const ph of ['on', 'off'] as const) {
          expect(
            grid.some((p) => p.plan.train === plan && p.entryConditionMargin === margin && p.physio === ph),
          ).toBe(true)
        }
      }
    }
    expect(GRID_SEEDS).toBeLessThan(SEEDS_PER_CELL) // reduced seed count is deliberate and logged
    expect(GRID_HORIZON_WEEKS).toBe(104)
  })

  it('a grid cell is deterministic and carries the money coupling (coaching/physio/endFunds)', () => {
    const policy = gridPolicies().find((p) => p.id === '85/15·all·off')!
    const a = runCell(middleSelf, policy, 52, 3)
    const b = runCell(middleSelf, policy, 52, 3)
    expect(a).toEqual(b)
    for (const r of a) {
      expect(r.coachingSpendCents).toBeGreaterThan(0) // coaching bleeds every week
      expect(typeof r.endFundsCents).toBe('number')
      // physio OFF: no retainer, so any physio-category spend can only be injury bills (rehab/onset)
      if (r.physioSpendCents > 0) expect(r.injuriesTotal).toBeGreaterThan(0)
    }
  })

  it('the plan axis moves the wallet: 85/15 coaching spend > 60/40 on the same seed (planFactor)', () => {
    const grind = gridPolicies().find((p) => p.id === '85/15·all·off')!
    const light = gridPolicies().find((p) => p.id === '60/40·all·off')!
    const a = runFatigueCareer(middleSelf, grind, 0, 52)
    const b = runFatigueCareer(middleSelf, light, 0, 52)
    expect(a.coachingSpendCents).toBeGreaterThan(b.coachingSpendCents)
  })
})

describe('scenarios (V2.1 SHIPPED as baseline; v2/legacy patched live)', () => {
  const legacy = SCENARIOS.find((s) => s.id === 'legacy')!
  const v2 = SCENARIOS.find((s) => s.id === 'v2')!

  it('RE-PINNED 25.07: the V2.1 values ARE the shipped engine defaults', () => {
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0) // tournament week = travel + competition
    expect(ECONOMY.condition.recoveryBase).toBe(1) // free-week ladder 1/2/3 ("все чуть ниже к концу сезона")
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(1)
    // scenario roles: baseline unpatched + full; v2 = previous candidate; legacy = round-9 audit
    expect(SCENARIOS.find((s) => s.id === 'baseline')!.patch).toEqual({})
    expect(v2.patch).toEqual({ recoveryBase: 2 })
    expect(v2.grid).toBe(false)
    expect(legacy.patch).toEqual({ recoveryBase: 2, matchWeekRecoveryBase: 2, physioConditionBonusPerWeek: 2 })
    expect(legacy.grid).toBe(false)
  })

  it('withScenario patches, runs, and ALWAYS restores – zero leakage into baseline runs', () => {
    const before = runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    const legacyRun = withScenario(legacy, () => {
      expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(2)
      expect(ECONOMY.condition.recoveryBase).toBe(2)
      expect(ECONOMY.physio.conditionBonusPerWeek).toBe(2)
      return runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    })
    // restored exactly to the shipped V2.1 values
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0)
    expect(ECONOMY.condition.recoveryBase).toBe(1)
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(1)
    // legacy (far more recovery) rides higher than the shipped baseline; baseline reproduces after
    expect(legacyRun.meanCondition).toBeGreaterThan(before.meanCondition)
    expect(runFatigueCareer(middleSelf, grinder, 0, H52.weeks)).toEqual(before)

    // v2 (recoveryBase 2) recovers more than the shipped V2.1 baseline, and also restores
    const v2run = withScenario(v2, () => {
      expect(ECONOMY.condition.recoveryBase).toBe(2)
      return runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    })
    expect(ECONOMY.condition.recoveryBase).toBe(1)
    expect(v2run.meanCondition).toBeGreaterThan(before.meanCondition)
  })

  it('restores even when the run throws', () => {
    expect(() =>
      withScenario(legacy, () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0)
    expect(ECONOMY.condition.recoveryBase).toBe(1)
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(1)
  })

  it('scenario runs are deterministic per scenario', () => {
    const a = withScenario(v2, () => runFatigueCareer(working, careful, 1, H52.weeks))
    const b = withScenario(v2, () => runFatigueCareer(working, careful, 1, H52.weeks))
    expect(a).toEqual(b)
  })
})

// ---------------------------------------------------------------------------
// CUMULATIVE RUN FATIGUE (owner idea 26.07) – the four ladders he proposed, benched against the
// pre-ladder engine. The bench must (a) carry his table verbatim, (b) patch and restore the array
// knob as safely as it does the scalars, and (c) leave the default sweep's cost untouched.
// ---------------------------------------------------------------------------
describe('run-fatigue ladder scenarios (owner idea 26.07)', () => {
  const byId = (id: string) => RUNFAT_SCENARIOS.find((s) => s.id === id)!

  it("carries the owner's four ladders verbatim (+ the pre-ladder reference), variant C shipped", () => {
    // his table: extra per 2nd/3rd/4th/5th match, totalling 10 / 8 / 6 / 4 over a five-match run
    expect(RUNFAT_LADDERS.a).toEqual([0, 1, 2, 3, 4])
    expect(RUNFAT_LADDERS.b).toEqual([0, 1, 1, 2, 4])
    expect(RUNFAT_LADDERS.c).toEqual([0, 1, 1, 2, 2])
    expect(RUNFAT_LADDERS.d).toEqual([0, 1, 1, 1, 1])
    for (const [id, total] of [['a', 10], ['b', 8], ['c', 6], ['d', 4]] as [string, number][]) {
      expect(RUNFAT_LADDERS[id].reduce((s, x) => s + x, 0)).toBe(total)
      expect(RUNFAT_LADDERS[id][0]).toBe(0) // her first match of a run never costs extra
    }
    expect(RUNFAT_LADDERS.off).toEqual([0]) // the pre-idea engine: no cumulative fatigue at all
    // C is the SHIPPED default, so the runfat-c section must be a no-op patch on the engine
    expect(ECONOMY.condition.runFatigueLadder).toEqual(RUNFAT_LADDERS.c)
    // the five sections are headline-only and OPT-IN: the default sweep's cost is unchanged
    expect(SCENARIOS.map((s) => s.id)).toEqual(['baseline', 'v2', 'legacy'])
    expect(RUNFAT_SCENARIOS).toHaveLength(5)
    for (const s of RUNFAT_SCENARIOS) {
      expect(s.grid).toBe(false)
      expect(s.plannerGrid).toBe(false)
      expect(s.patch.runFatigueLadder).toBeDefined()
    }
    expect(ALL_SCENARIOS).toHaveLength(SCENARIOS.length + RUNFAT_SCENARIOS.length)
    expect(new Set(ALL_SCENARIOS.map((s) => s.id)).size).toBe(ALL_SCENARIOS.length)
  })

  it('withScenario patches the ladder, restores it on return AND on a throw, and never mutates it', () => {
    const shipped = ECONOMY.condition.runFatigueLadder
    const shippedCopy = [...shipped]
    withScenario(byId('runfat-a'), () => {
      expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 2, 3, 4])
      // the patch works on a COPY – scribbling on the live array can't reach the shipped one
      ECONOMY.condition.runFatigueLadder[0] = 99
    })
    expect(ECONOMY.condition.runFatigueLadder).toBe(shipped) // the very same instance is back
    expect(ECONOMY.condition.runFatigueLadder).toEqual(shippedCopy)
    expect(RUNFAT_LADDERS.a).toEqual([0, 1, 2, 3, 4]) // and the table itself is intact

    expect(() =>
      withScenario(byId('runfat-off'), () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    expect(ECONOMY.condition.runFatigueLadder).toEqual(shippedCopy)
  })

  it('runfat-c IS the shipped engine (byte-identical careers); runfat-off is the pre-ladder one', () => {
    const shippedRun = runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    expect(withScenario(byId('runfat-c'), () => runFatigueCareer(middleSelf, grinder, 0, H52.weeks))).toEqual(
      shippedRun,
    )
    // no ladder at all = strictly less strain on the same paired seed, so she rides higher and
    // the per-week strain the bench reports is smaller wherever she played more than one match.
    const off = withScenario(byId('runfat-off'), () => runFatigueCareer(middleSelf, grinder, 0, H52.weeks))
    expect(off.meanCondition).toBeGreaterThan(shippedRun.meanCondition)
    const deepWeeks = shippedRun.weekly.filter((w) => w.matches > 1).length
    expect(deepWeeks).toBeGreaterThan(0) // the ladder arm was actually exercised
  })

  it('the steepest ladder costs the most condition: off > D > A on the same paired seeds', () => {
    const pooled = (id: string) =>
      mean(
        withScenario(byId(id), () =>
          runCell(middleSelf, grinder, H52.weeks, 10).map((r) => r.meanCondition),
        ),
      )
    const off = pooled('runfat-off')
    const d = pooled('runfat-d')
    const a = pooled('runfat-a')
    expect(off).toBeGreaterThan(d) // any ladder costs something
    expect(d).toBeGreaterThan(a) // +1 flat costs less than +1,+2,+3,+4
  })

  it('--scenario takes a comma-separated list of known ids and rejects anything else', () => {
    expect(parseScenarioArg([])).toBeNull()
    expect(parseScenarioArg(['--scenario', 'baseline'])).toEqual(['baseline'])
    expect(parseScenarioArg(['--scenario', 'runfat-off,runfat-a,runfat-d'])).toEqual([
      'runfat-off',
      'runfat-a',
      'runfat-d',
    ])
    expect(() => parseScenarioArg(['--scenario', 'nope'])).toThrow('--scenario must be')
    expect(() => parseScenarioArg(['--scenario', 'baseline,nope'])).toThrow('--scenario must be')
    expect(() => parseScenarioArg(['--scenario'])).toThrow('--scenario must be')
  })
})

describe('season planner (REAL mechanics – bookings through the engine commands)', () => {
  it('the grinder practises hard and never books a package; the others do both', () => {
    const g = runFatigueCareer(middleSelf, grinder, 0, H104.weeks)
    expect(g.practicesPlayed).toBeGreaterThan(30) // ~every plannable week over two seasons
    expect(g.practiceSpendCents).toBeGreaterThan(0)
    expect(g.vacationsTotal).toBe(0)
    expect(g.vacationSpendCents).toBe(0)

    const b = runFatigueCareer(middleSelf, balanced, 0, H104.weeks)
    // alternating: fewer friendlies than the grinder on the same seed/world
    expect(b.practicesPlayed).toBeLessThan(g.practicesPlayed)
    // the off-season family week is the scheduled default -> at least one package per season year
    expect(b.vacationsTotal).toBeGreaterThanOrEqual(1)

    // careful books friendlies only while fresh (>= 80) – but she ALSO enters far fewer
    // tournaments, so she has more plannable weeks and can out-practise the grinder. That is a
    // real finding of the planner slice, not a bug: load management frees the calendar.
    const c = runFatigueCareer(middleSelf, careful, 0, H104.weeks)
    expect(c.practicesPlayed).toBeGreaterThan(0)
    expect(c.vacationsTotal).toBeGreaterThanOrEqual(1)
  })

  it('a friendly awards NO ranking points: practices never move points/matches counters', () => {
    // Same world, planner on vs off: entries/points are driven by tournaments only.
    const withPractice = { ...balanced, id: 'bal+pract' }
    const withoutPlanner = { ...balanced, id: 'bal-noplan', planner: { ...NO_PLANNER } }
    const a = runFatigueCareer(middleSelf, withPractice, 0, H52.weeks)
    const b = runFatigueCareer(middleSelf, withoutPlanner, 0, H52.weeks)
    // matchesPlayed counts TOURNAMENT matches only (the friendly is never a result)
    expect(a.matchesPlayed).toBeGreaterThan(0)
    expect(b.matchesPlayed).toBeGreaterThan(0)
    expect(a.practicesPlayed).toBeGreaterThan(0)
    expect(b.practicesPlayed).toBe(0)
  })

  it('the guardrail caution + the rescue trigger actually fire and are counted', () => {
    // The grinder books through the caution every time she is worn out or on a streak.
    const g = runFatigueCareer(working, grinder, 0, H104.weeks)
    expect(g.cautionedPracticeBookings).toBeGreaterThan(0)
    // A rescue-enabled policy takes rescue bookings on at least some seeds of a 104w cell.
    const rescued = runCell(working, careful, H104.weeks, 10).reduce((s, r) => s + r.rescueBookings, 0)
    expect(rescued).toBeGreaterThan(0)
  })

  it('planner money reconciles: spend is positive iff something was booked', () => {
    for (const policy of POLICIES) {
      const r = runFatigueCareer(middleHired, policy, 2, H104.weeks)
      expect(r.practiceSpendCents >= 0).toBe(true)
      expect(r.vacationSpendCents >= 0).toBe(true)
      if (r.practicesPlayed > 0) expect(r.practiceSpendCents).toBeGreaterThan(0)
      expect(r.vacationsTotal).toBe(Object.values(r.vacationsByPackage).reduce((s, n) => s + n, 0))
    }
  })

  // Wave-2: the bench's own copy of the "which package?" rule is gone – it measures the rule the
  // UI ships (recommendVacationPackage), and the default player's habit tracks the offer knob.
  it('the rescue habit tracks the shipped offer knobs instead of hard-coded thresholds', () => {
    expect(balanced.planner.rescueBelow).toBe(ECONOMY.practice.rescueCondition)
    expect(balanced.planner.targetAbove).toBe(ECONOMY.practice.rescueTargetCondition)
    // the careful parent still aims higher than the prompt does
    expect(careful.planner.targetAbove).toBeGreaterThan(ECONOMY.practice.rescueTargetCondition)
  })

  it("the doctor's veto is counted, and only the degenerate policy ever meets it", () => {
    const floor = ECONOMY.availability.medicalFloor
    // *** RE-PINNED 25.07 (ladder-up union): this used to hardcode `working` + seed 3, because
    // that was the crash cell when the calendar topped out at national. With the J-tiers the
    // degenerate cell MOVED – an 8k family now runs out of money on international travel before
    // her body runs out (economy throttles her first), while a wealthy grinder can afford to keep
    // playing until she craters. The invariant under test is not "this profile" but "the grinder
    // is the only policy that ever reaches the floor", so the assertion now searches the grinder
    // across profiles instead of naming one – calendar- and economy-shift proof. ***
    const grinderRuns = PROFILES.map((p) => runFatigueCareer(p, grinder, 3, H104.weeks))
    expect(grinderRuns.some((r) => r.weeksBelowMedicalFloor > 0)).toBe(true)
    expect(grinderRuns.some((r) => r.medicalBlocks > 0)).toBe(true)
    // *** RE-PINNED 26.07 (CUMULATIVE RUN FATIGUE): this used to assert an exact 0. The veto gates
    // ENTRY – and entries commit up to ENTRY_LOOKAHEAD weeks BEFORE the event – so it can stop her
    // signing up while wrecked, never stop a run she entered healthy from wrecking her. With the
    // ladder charging extra for every subsequent match of the same run, a grinder bottoms out at 0
    // again for a few weeks of a 104-week career. It stays a TAIL (< 10% of weeks), not the pin the
    // pre-veto bench flagged as degenerate, and only for the grinder. ***
    for (const r of grinderRuns) expect(r.weeksAt0).toBeLessThan(0.1 * H104.weeks)
    // The load-managing policies never go near it – proof the floor is far below normal play.
    for (const policy of [balanced, careful]) {
      const r = runFatigueCareer(working, policy, 3, H104.weeks)
      expect(r.medicalBlocks).toBe(0)
      expect(r.weeksBelowMedicalFloor).toBe(0)
      expect(Math.min(...r.weekly.map((w) => w.condition))).toBeGreaterThanOrEqual(floor)
    }
  })

  it('the planner grid is the 3×2 axis built as data, with the planner OFF in the factorial grid', () => {
    const grid = plannerPolicies()
    expect(grid).toHaveLength(GRID_PRACTICE.length * GRID_VACATION.length)
    expect(new Set(grid.map((p) => p.id)).size).toBe(grid.length)
    for (const p of grid) expect(p.plan).toEqual(WEEK_PLAN_PRESETS.balanced) // default player
    // the plan × entry × physio grid must stay planner-free, or its axes are no longer isolated
    for (const p of gridPolicies()) {
      expect(p.planner.practice).toBe('never')
      expect(p.planner.rescueBelow).toBeNull()
      expect(p.planner.offSeasonPackageId).toBeNull()
    }
  })

  it('the economy read reconciles: the tier split sums to entries, spend nets, survival is the flag', () => {
    for (const policy of POLICIES) {
      const r = runFatigueCareer(middleSelf, policy, 1, H104.weeks)
      // every committed entry is booked under exactly one tier
      expect(TIER_LADDER.reduce((s, t) => s + r.entriesByTier[t], 0)).toBe(r.entries)
      // trips + fees are real money and can only be a PART of what the family spent
      expect(r.travelSpendCents).toBeGreaterThan(0)
      expect(r.entryFeeSpendCents).toBeGreaterThan(0)
      expect(r.travelSpendCents + r.entryFeeSpendCents).toBeLessThan(r.totalSpendCents)
      // survival is exactly "the balance never went negative"
      expect(r.survived).toBe(r.weeksToBankrupt === null)
      if (r.weeksToBankrupt !== null) expect(r.weeksToBankrupt).toBeLessThanOrEqual(H104.weeks)
    }
  })

  it('effectivePhysio mirrors the career wiring', () => {
    expect(effectivePhysio(middleSelf, grinder)).toBe(false)
    expect(effectivePhysio(middleHired, grinder)).toBe(true)
    expect(effectivePhysio(middleSelf, careful)).toBe(true)
    const off = gridPolicies().find((p) => p.physio === 'off')!
    expect(effectivePhysio(middleHired, off)).toBe(false)
  })
})
