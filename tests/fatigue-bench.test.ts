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
import { runFatigueExtra } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { matchDrain } from '../src/engine/condition'
import { reconstructRun } from '../src/engine/season/rival'
import { TIERS, WEEKS_PER_YEAR, OFF_SEASON_WEEKS, SUMMER_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// The fatigue bench is a MEASUREMENT tool for the round-9 condition math: it must be
// deterministic, its policy ordering must reflect the load-management axis it exists to compare,
// and its condition trace must be exactly the owner's formula – re-derived here INDEPENDENTLY
// from the ECONOMY knobs (no accrueCondition/matchDrain imports) and compared byte-for-byte.

const working = PROFILES.find((p) => p.background === 'working')!
// ⚠ RE-AIMED by the coach ladder: the bench's profiles moved from `coachSetup: 'parent' | 'hired'`
// to rungs of the ladder ('self' / 'middle'). Same two middle-family cells, same contrast – the
// self-coached family against the one paying a coach – so every assertion below is unchanged.
const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!
const middleHired = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'middle')!

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
      // ⚠ THE SUMMER TRAINING BLOCK (W3-SUMMER), and it goes exactly HERE because that is where the
      // engine puts it: after the accrue-and-clamp, before the vacation gain, in its own clamp -
      // the same slot the knock's rest credit occupies. She has no school in the holidays and trains
      // twice a day, so the week is fuller and costs `summerBlock.conditionCost`.
      //
      // Re-derived from the window and the facts rather than by calling `summerBlockWeek`, exactly as
      // the blackout arm above re-derives `isBlackoutWeek` - this trace's whole job is to recompute
      // the arithmetic WITHOUT the engine's own helpers, or it would only be checking that a function
      // equals itself.
      //
      // ⚠ "A COMPETITION WEEK" IS `played || medicalWithdrawal`, NOT `played` ALONE, and getting that
      // wrong is what this recomputation caught on its first pass (season 2 drifted while season 1
      // matched). `isCompetitionWeek` asks whether she is ENTERED in a scheduled event and not hurt -
      // it does not ask whether a run was computed - so a girl withdrawn on the doctor's orders at the
      // arrival check is still a competition week to the engine, and she gets no training block. That
      // is right: she is not on court twice a day, she is a girl too tired to be cleared. `played`
      // alone cannot see her, because no shadow run exists. The three outcomes of being entered are
      // exactly `played` / `walkover` (which implies `injured`) / `medicalWithdrawal`, so those two
      // flags plus `injured` reconstruct the predicate completely.
      //
      // The rest map one for one: outside the window, a layoff (`injured`), a booked family week
      // (`vacationResolvedId`).
      //
      // ⚠ THE ONE REFUSAL THE FACTS CANNOT SEE IS A RESTED KNOCK, and it is safe here rather than
      // ignored: `knockRestWeek` needs a knock whose `choice` has been ANSWERED, and this bench never
      // calls `decideKnock`, so every knock it rolls stays undecided and the branch cannot fire. If a
      // future bench policy starts answering knocks, this recomputation needs a `knockRested` fact.
      const summerOffset = ((f.week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
      const inSummer = summerOffset >= SUMMER_WEEKS[0] && summerOffset <= SUMMER_WEEKS[1]
      const competed = f.played || f.medicalWithdrawal
      if (inSummer && !f.injured && !competed && !f.vacationResolvedId) {
        c = clamp(c - ECONOMY.summerBlock.conditionCost)
      }
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
    expect(openFatigueCareer(middleHired, off, 0).world.physioActive).toBe(false) // overrides the paid-coach default
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

  // ⚠ RE-AIMED (name and reason only): the mechanism it credits, `planFactor`, is retired. The plan
  // moved the coaching bill by 0.91 -> 1.06 through that factor; it now moves it through HOURS,
  // 4 -> 6 sessions a week, which is the same fact with three times the force behind it.
  it('the plan axis moves the wallet: 85/15 coaching spend > 60/40 on the same seed (hours)', () => {
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

  // ⚠ RE-PINNED 03.08 (W2-FATIGUE: recoveryBase 1 -> 8, docs/specs/fatigue-reprice-2026-08.md §3),
  // AND THE TWO REFERENCE SCENARIOS CHANGED SIDES. `v2` (base 2) and `legacy` (2/2/2) were both
  // MORE generous than the shipped engine and are now both LESS: the re-price raised the base past
  // them, so they have gone from "the candidates we rejected for being too kind" to "the audit
  // trail of a season that could not be recovered". Their patches are untouched on purpose - they
  // are history, and history does not get retuned - but every direction this block asserts about
  // them is re-aimed below, with the reversal stated rather than smuggled.
  it('RE-PINNED 25.07 and again 03.08: the shipped values ARE the engine defaults', () => {
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0) // tournament week = travel + competition
    expect(ECONOMY.condition.recoveryBase).toBe(8) // free-week ladder 8/9/10 (the W2 re-price)
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
    // restored exactly to the shipped values
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0)
    expect(ECONOMY.condition.recoveryBase).toBe(8)
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(1)
    // ⚠ DIRECTION REVERSED 03.08, and it is the same fact this line always asserted: the scenario
    // that recovers MORE rides higher. `legacy` used to be that one (2/2/2 against 1/0/1); the
    // re-price took the shipped base to 8, so a grinder's free weeks - which is most of her year -
    // now pay 8 where legacy pays 2, and legacy rides BELOW. What is guarded is unchanged: the patch
    // really reaches the run, and the baseline reproduces byte-for-byte afterwards.
    expect(legacyRun.meanCondition).toBeLessThan(before.meanCondition)
    expect(runFatigueCareer(middleSelf, grinder, 0, H52.weeks)).toEqual(before)

    // v2 (recoveryBase 2) recovers LESS than the shipped baseline now, and also restores
    const v2run = withScenario(v2, () => {
      expect(ECONOMY.condition.recoveryBase).toBe(2)
      return runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    })
    expect(ECONOMY.condition.recoveryBase).toBe(8)
    expect(v2run.meanCondition).toBeLessThan(before.meanCondition)
  })

  it('restores even when the run throws', () => {
    expect(() =>
      withScenario(legacy, () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0)
    expect(ECONOMY.condition.recoveryBase).toBe(8)
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

  it('a ladder scenario moves the COHORT too, or the comparison measures half the game', () => {
    // The wave-3 integration decision is that the ladder is SHARED, so a `--scenario runfat-*` run
    // has to re-price the rivals as well as the kid – otherwise the table the owner reads to choose
    // a variant has the cohort permanently on variant C. Cheap direct check (no career sim): a
    // rival's reconstructed five-match J300 title, which routes through the same
    // tournamentRunStrain the kid does.
    const flat = 5 * matchDrain('j300', undefined) // 30 – the five per-match drains alone
    const j300Title = (): number => reconstructRun({ playerId: 'ai-x', week: 1, points: TIERS.j300.points[0], tier: 'j300' }).strain
    expect(j300Title()).toBe(flat + 6) // shipped variant C
    withScenario(byId('runfat-off'), () => expect(j300Title()).toBe(flat))
    withScenario(byId('runfat-a'), () => expect(j300Title()).toBe(flat + 10))
    withScenario(byId('runfat-d'), () => expect(j300Title()).toBe(flat + 4))
    expect(j300Title()).toBe(flat + 6) // and restored
  })

  it('the bench REPORTS the cohort half: switching scenario moves a RIVAL-side number, not just a kid one', () => {
    // The re-sweep gate (owner 26.07). The test above proves the shared ladder at the level of ONE
    // reconstructed run; this one proves it end-to-end through the numbers the report actually
    // prints. It has to be a RIVAL-side column: the module-load caching bug moved the kid while the
    // whole cohort stayed on variant C, and every kid-side column looked perfectly healthy while it
    // did. Cohort condition is derived from the results ledger, so a steeper ladder must drag the
    // field down and push more of it under the strength knee.
    const cell = (id: string) => {
      const runs = withScenario(byId(id), () =>
        [0, 1, 2].map((i) => runFatigueCareer(middleSelf, grinder, i, H52.weeks)),
      )
      return computeCellStats(middleSelf, grinder, H52, runs)
    }
    const off = cell('runfat-off')
    const a = cell('runfat-a')
    // sampled at all, and a real cohort read (never the kid's own condition wearing a rival hat:
    // the kid grinds herself into the 40s while the 199-player field averages higher).
    // ⚠ RE-BOUNDED 50 -> 40 by W2-LADDER, the C2 finding reaching this gate: the 164-event
    // calendar loads the same 199 rivals with 25 more W draws a season, and the field's mean under
    // runfat-off measures ~46 (was 80s at six rungs, 50s at nine). The read is still a genuine
    // COHORT number - it moves with the scenario switch below, which is this test's actual claim -
    // and the remedy for the level itself is the living-field population (W2-FIELD2 re-measures;
    // tests/rivals.test.ts C2 carries the full sweep and the mechanism).
    //
    // ✅⚠ W2-FIELD2 RE-MEASURED IT AND THE BOUND STAYS AT 40. Same cell, same three seeds, the two
    // band sets on identical code: off.rivalCondMean 46.3 (W2-LADDER bands) -> 45.4 (shipped), and
    // the runfat-a arm 42.4 -> 42.0. So the level did NOT come back toward 50 and the 50 is not
    // recoverable by this wave: the population grew by 64 professionals and absorbed exactly none
    // of the cohort's W load, because the canonical `seed:aitour:` brackets are LIVE-only by
    // fieldPros.ts's scope fence. The full argument, the sweep and the act-3 item that would fix it
    // live in tests/rivals.test.ts C2. Bound left where W2-LADDER set it - 40 against a measured
    // 45.4 is the same margin the re-bound was chosen with, and tightening onto 45 would pin
    // today's number.
    expect(off.rivalCondMean).toBeGreaterThan(40)
    expect(off.rivalCondMean).toBeLessThan(ECONOMY.condition.max)
    // THE assertion: the steepest ladder tires her opponents too.
    expect(a.rivalCondMean).toBeLessThan(off.rivalCondMean)
    expect(a.rivalPctBelowKnee).toBeGreaterThan(off.rivalPctBelowKnee)
    // and the same holds for the field she actually MET, not only the calendar at large
    expect(a.rivalPlayWeekCondMean).toBeLessThan(off.rivalPlayWeekCondMean)
  })

  it('the run-depth histogram reconciles with the matches it came from', () => {
    // The distribution the ladder is indexed BY, so it has to be exact: every committed run lands in
    // exactly one bucket and the bucket index IS the match count (the top bucket absorbs anything
    // deeper, which the current calendar's 32-draw never reaches past 5).
    const r = runFatigueCareer(middleSelf, grinder, 0, H104.weeks)
    expect(r.runDepthCounts[0]).toBe(0) // a committed run always has >= 1 match
    expect(r.runDepthCounts.reduce((s, n) => s + n, 0)).toBe(r.runsCommitted)
    expect(r.runDepthCounts.reduce((s, n, d) => s + d * n, 0)).toBe(r.matchesPlayed)
    expect(r.runsCommitted).toBe(r.weekly.filter((w) => w.matches > 0).length)
    const st = computeCellStats(middleSelf, grinder, H104, [r])
    expect(st.runDepthPct.reduce((s, p) => s + p, 0)).toBeCloseTo(100, 6)
    // The previous sweep's headline finding, re-pinned as a RANGE rather than a point: single-match
    // runs are the modal outcome, which is why the shallow ladder variants are hard to tell apart.
    expect(st.runDepthPct[1]).toBeGreaterThan(20)
    expect(st.meanRunDepth).toBeGreaterThan(1)
    expect(st.meanRunDepth).toBeLessThanOrEqual(5)
  })

  it('runfat-c IS the shipped engine (byte-identical careers); runfat-off is the pre-ladder one', () => {
    const shippedRun = runFatigueCareer(middleSelf, grinder, 0, H52.weeks)
    expect(withScenario(byId('runfat-c'), () => runFatigueCareer(middleSelf, grinder, 0, H52.weeks))).toEqual(
      shippedRun,
    )
    // *** RE-SHAPED 28.07 by the random draw. This asserted `off.meanCondition > shipped` – no
    // ladder at all should mean less strain, so she should ride higher. Measured after the change:
    // off 38.15 vs shipped 38.62, i.e. INVERTED.
    //
    // Same mechanism the sibling test below already documents, now reaching this one: the ladder is
    // a BRAKE on depth. Turn it off and she is fresher, wins more, and plays MORE matches – and the
    // extra base fatigue of those matches outweighs the ladder she is no longer paying. The random
    // draw amplified it because she now wins first rounds she used to be rigged to lose, so there
    // are more deep runs on both arms for the effect to work with.
    //
    // So the ordering is not a property of this engine and is not pinned. What IS pinned is what
    // this test is actually for: runfat-c is byte-identical to shipped (above), the ladder arm is
    // genuinely exercised, and turning it off CHANGES the career rather than being a no-op. ***
    const off = withScenario(byId('runfat-off'), () => runFatigueCareer(middleSelf, grinder, 0, H52.weeks))
    expect(off).not.toEqual(shippedRun)
    const deepWeeks = shippedRun.weekly.filter((w) => w.matches > 1).length
    expect(deepWeeks).toBeGreaterThan(0) // the ladder arm was actually exercised
  })

  it('the steepest ladder charges the most run strain, and A is felt in mean condition', () => {
    // *** RE-SHAPED (wave-3 integration): this asserted a strict off > D > A ordering on MEAN
    // CONDITION, which held while the ladder was the kid's alone. It no longer does at the shallow
    // end - measured off 64.88 vs D 65.00, i.e. INVERTED by 0.12 of a point - and the two reasons
    // are both features of this wave, not noise:
    //   1. The ladder is now SHARED, so a steeper ladder also tires her RIVALS; she survives more
    //      rounds, which changes how her own weeks are spent.
    //   2. The doctor checks on ARRIVAL. A withdrawal turns what would have been a draining
    //      tournament week into a full free-week recovery, so charging MORE strain can buy back
    //      condition through more withdrawals.
    // Mean condition is therefore a downstream, confounded quantity. What the ladder DIRECTLY does is
    // charge strain, so that is what is ordered now - and A, the only variant with a real gap to the
    // pack (expected extra ~1.01 vs ~0.71 per run), must still be visible in condition. ***
    const strain = (id: string) =>
      withScenario(byId(id), () =>
        [0, 1, 2, 3, 4].reduce((sum, i) => sum + runFatigueExtra(i, 'national'), 0),
      )
    expect(strain('runfat-off')).toBe(0)
    expect(strain('runfat-d')).toBeLessThan(strain('runfat-a')) // +1 flat < +1,+2,+3,+4
    expect(strain('runfat-c')).toBeLessThan(strain('runfat-a'))
    const pooled = (id: string) =>
      mean(
        withScenario(byId(id), () =>
          runCell(middleSelf, grinder, H52.weeks, 10).map((r) => r.meanCondition),
        ),
      )
    // the steepest ladder IS felt where it is steep enough to matter
    expect(pooled('runfat-a')).toBeLessThan(pooled('runfat-off'))
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
