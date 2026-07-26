import { describe, it, expect } from 'vitest'
import {
  RIVAL_STYLE,
  matchesForFinish,
  reconstructRun,
  rivalCondition,
  rivalConditions,
} from '../src/engine/season/rival'
import { conditionMatchFactor, matchDrain } from '../src/engine/condition'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Rivals become real — Part A: rival fatigue, DERIVED from the results ledger.
//
// The whole slice is a pure derivation: no new WorldState field, no schema bump, ZERO RNG draws.
// A rival's condition is reconstructed from the rows she already has in `world.results` –
// `points` inverts through `TIERS[tier].points` to a finish index, the finish index gives how
// many matches she played, and from there the SAME matchDrain / tournamentRunStrain / recovery /
// conditionMatchFactor the kid uses do the rest.
// ---------------------------------------------------------------------------

const R = ECONOMY.condition

/** One ledger row for `ai-x` at `week`, finishing `finish` at `tier`. */
function row(tier: TierId, finish: number, week: number, playerId = 'ai-x'): SeasonResult {
  return { playerId, week, points: TIERS[tier].points[finish], tier }
}

describe('A1 — reconstruction: (tier, points) round-trips to the right match count', () => {
  it('champion plays log2(drawSize) matches and a first-round exit plays exactly 1, every tier', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const rounds = Math.log2(def.drawSize)
      // Every tier awards points at EVERY finish (the arrays are strictly positive), so every
      // entrant of every draw leaves a reconstructible row – nobody is invisible to the ledger.
      expect(def.points.length).toBe(rounds + 1)
      expect(def.points.every((p) => p > 0)).toBe(true)

      expect(reconstructRun(row(tier, 0, 1))).toMatchObject({ tier, matches: rounds }) // champion
      expect(reconstructRun(row(tier, rounds, 1))).toMatchObject({ tier, matches: 1 }) // R1 exit
    }
  })

  it('every (tier, finish) inverts to the finish it came from, and the match count is monotone', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      let prev = Infinity
      for (let finish = 0; finish <= rounds; finish++) {
        const run = reconstructRun(row(tier, finish, 3))
        expect(run.tier).toBe(tier)
        // finish f (f > 0) = lost in round `rounds - f`, so she played `rounds - f + 1` matches;
        // the champion (f = 0) played every round.
        expect(run.matches).toBe(finish === 0 ? rounds : rounds - finish + 1)
        expect(run.matches).toBeLessThanOrEqual(prev) // deeper finish ⇒ never fewer matches
        prev = run.matches
      }
    }
  })

  it('matchesForFinish: runner-up plays as many matches as the champion, R1 exit plays one', () => {
    expect(matchesForFinish(3, 0)).toBe(3) // 8-draw champion: R1 + SF + F
    expect(matchesForFinish(3, 1)).toBe(3) // runner-up plays the same three
    expect(matchesForFinish(3, 2)).toBe(2) // semifinalist
    expect(matchesForFinish(3, 3)).toBe(1) // first round
    expect(matchesForFinish(5, 0)).toBe(5) // 32-draw champion
    expect(matchesForFinish(5, 5)).toBe(1)
  })

  it("the run's strain IS tournamentRunStrain over score-less matches – one drain rule, both sides", () => {
    // AI-vs-AI records carry no scoreline (they resolve closed-form), so every rival match takes
    // matchDrain's score-less branch: straightSets + the tier surcharge. Identical to what the kid
    // would pay for a straight-sets match at that tier – never a private rival formula.
    const run = reconstructRun(row('j300', 0, 4))
    expect(run.matches).toBe(5)
    expect(run.strain).toBe(5 * matchDrain('j300', undefined))
    expect(run.strain).toBe(30) // 5 × (1 straight-sets + 5 j300 surcharge)
    expect(reconstructRun(row('local', 3, 4)).strain).toBe(matchDrain('local', undefined)) // 1
  })
})

describe('A2 — a tier-less row (legacy saves / pre-history) is handled explicitly', () => {
  // `SeasonResult.tier` is OPTIONAL and every AI row written before this slice omitted it. Such a
  // row is reconstructed by MINIMUM STRAIN over the (tier, finish) pairs that could have produced
  // those points: deterministic, never a crash, and never "free".
  it('never crashes and never treats the row as free', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      for (let finish = 0; finish <= rounds; finish++) {
        const { tier: _t, ...legacy } = row(tier, finish, 2)
        const run = reconstructRun(legacy)
        expect(run.matches).toBeGreaterThanOrEqual(1)
        expect(run.strain).toBeGreaterThan(0)
      }
    }
  })

  it('resolves an AMBIGUOUS points value to the cheapest reading, deterministically', () => {
    // 30 points is a Local title (3 matches, no surcharge = 3), a J30 last-16 (2 × 4 = 8) or a
    // J300 first round (1 × 6 = 6). The cheapest reading wins: a legacy row can never invent
    // fatigue the rival may not have earned.
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })
    expect(run).toMatchObject({ tier: 'local', matches: 3, strain: 3 })
    // ...and it is a pure function: same row, same answer, every time.
    expect(reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })).toEqual(run)
  })

  it('a points value that matches no tier at all costs one straight-sets match at the entry tier', () => {
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 777 })
    expect(run.matches).toBe(1)
    expect(run.strain).toBe(matchDrain(TIER_LADDER[0], undefined))
  })
})

describe('A3 — the same drain + the same time recovery the kid uses', () => {
  it('a quiet rival sits at full condition', () => {
    expect(rivalCondition([], 'ai-x', 20)).toBe(R.max)
    expect(rivalCondition([row('j300', 0, 1, 'ai-other')], 'ai-x', 20)).toBe(R.max) // not her row
  })

  it('a five-match J300 run costs exactly the run strain, and recovers recoveryBase per quiet week', () => {
    const ledger = [row('j300', 0, 10)]
    expect(rivalCondition(ledger, 'ai-x', 10)).toBe(R.max - 30) // 70 – the run week itself
    // A tournament week earns matchWeekRecoveryBase (0 shipped); every quiet week earns
    // recoveryBase, +blackoutBonus on an off-season/exam week. Weeks 11-14 are all plain.
    expect(rivalCondition(ledger, 'ai-x', 11)).toBe(R.max - 30 + R.recoveryBase)
    expect(rivalCondition(ledger, 'ai-x', 14)).toBe(R.max - 30 + 4 * R.recoveryBase)
  })

  it('rivals get NO plan slider, NO physio and NO vacation – that asymmetry is the player edge', () => {
    // The kid on the 60/40 preset recovers recoveryBase + 2 on a free week, +1 more on physio.
    // A rival recovers the base alone: four quiet weeks buy her exactly 4 * recoveryBase. Dug out
    // of a deep enough hole (a J300 title, 30) that the ceiling clamp cannot flatter the reading.
    const deep = [row('j300', 0, 10)]
    const gained = rivalCondition(deep, 'ai-x', 14) - rivalCondition(deep, 'ai-x', 10)
    expect(gained).toBe(4 * R.recoveryBase)
    expect(gained).toBeLessThan(4 * (R.recoveryBase + 2)) // strictly worse than the careful kid
  })

  it('clamps to the same [min, max] bounds', () => {
    // Eight back-to-back J300 titles (240 strain) cannot push her below the floor...
    const brutal = Array.from({ length: 8 }, (_, i) => row('j300', 0, 3 + i))
    expect(rivalCondition(brutal, 'ai-x', 10)).toBe(R.min)
    // ...and no amount of rest lifts her over the ceiling.
    expect(rivalCondition([row('local', 3, 1)], 'ai-x', 1 + 5 * R.max)).toBe(R.max)
  })

  it('is bounded work: only the last ECONOMY.condition.rivalFatigueWindowWeeks weeks are scanned', () => {
    const window = R.rivalFatigueWindowWeeks
    expect(window).toBeGreaterThan(0)
    const ancient = [row('j300', 0, 100 - window - 1)] // one week outside the window
    expect(rivalCondition(ancient, 'ai-x', 100)).toBe(R.max)
    const inside = [row('j300', 0, 100 - window + 1)]
    expect(rivalCondition(inside, 'ai-x', 100)).toBeLessThan(R.max)
  })

  it('is deterministic and pure: same ledger, same week, same number – and the ledger is not mutated', () => {
    const ledger = [row('j60', 1, 8), row('j30', 3, 11), row('national', 0, 12)]
    const snapshot = JSON.stringify(ledger)
    const a = rivalCondition(ledger, 'ai-x', 13)
    const b = rivalCondition(ledger.slice().reverse(), 'ai-x', 13) // order-independent
    expect(b).toBe(a)
    expect(JSON.stringify(ledger)).toBe(snapshot)
  })

  it('rivalConditions batches the whole field and agrees with the single-player function', () => {
    const ledger = [row('j60', 1, 8, 'ai-1'), row('j30', 3, 11, 'ai-2'), row('national', 0, 12, 'ai-1')]
    const map = rivalConditions(ledger, 13)
    expect(map.get('ai-1')).toBe(rivalCondition(ledger, 'ai-1', 13))
    expect(map.get('ai-2')).toBe(rivalCondition(ledger, 'ai-2', 13))
    expect(map.get('ai-never-played')).toBeUndefined() // absent = full condition, by construction
  })
})

describe('A4 — a deep run leaves a soft week behind her, and it heals', () => {
  // Two identical rivals carrying the SAME recent load (the live world never hands anyone a blank
  // ledger); one then plays a five-match J300, the other sits the week out.
  const history = (id: string): SeasonResult[] => [
    row('j30', 2, 4, id),
    row('j60', 3, 7, id),
    row('j30', 1, 9, id),
  ]
  const runner = [...history('ai-run'), row('j300', 0, 12, 'ai-run')]
  const rester = history('ai-rest')

  it('the week after a five-match run she is measurably weaker; the rival who sat out is not', () => {
    const cRun = rivalCondition(runner, 'ai-run', 13)
    const cRest = rivalCondition(rester, 'ai-rest', 13)
    expect(cRun).toBeLessThan(cRest)
    // ...and the gap is big enough to cross the strength knee, so it shows up on court.
    expect(conditionMatchFactor(cRun)).toBeLessThan(conditionMatchFactor(cRest))
  })

  it('the owner curve still holds: a FRESH rival pays condition for one deep run, not strength', () => {
    // 100 − 30 = 70 = matchStrengthKnee exactly, so a rival arriving fresh at a J300 and winning it
    // walks away tired but undamaged. Fatigue bites on ACCUMULATED load, which is the point.
    const fresh = rivalCondition([row('j300', 0, 12, 'ai-fresh')], 'ai-fresh', 13)
    expect(fresh).toBeLessThan(R.max)
    expect(conditionMatchFactor(fresh)).toBe(1)
  })

  it('after enough quiet weeks the two converge again', () => {
    const quiet = 13 + R.rivalFatigueWindowWeeks
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(rivalCondition(rester, 'ai-rest', quiet))
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(R.max)
  })
})

describe('A5 — the style thresholds are exported, documented knobs', () => {
  it('sits inside the cohort generation ranges (serve/ret 30-60, stamina 30-70)', () => {
    expect(RIVAL_STYLE.serveEdge).toBeGreaterThan(0)
    for (const t of [RIVAL_STYLE.highServe, RIVAL_STYLE.highRet]) {
      expect(t).toBeGreaterThan(30)
      expect(t).toBeLessThan(60)
    }
    expect(RIVAL_STYLE.highStamina).toBeGreaterThan(30)
    expect(RIVAL_STYLE.highStamina).toBeLessThan(70)
  })
})
