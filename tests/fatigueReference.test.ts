import { describe, it, expect } from 'vitest'
import { matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// THE CANONICAL FATIGUE TABLES — the pin behind docs/specs/fatigue-reference.md.
//
// Why this file exists: the same question ("is the cumulative ladder actually being added?") was
// re-litigated three times, twice because a REPORT quoted a cost table without saying which tier it
// was for. Prose can be mislabeled; a table asserted against the live engine cannot. If a knob
// moves, this test fails and the doc is stale by definition — that is the point.
//
// Nothing here re-derives the rule. Every expected number is the owner's design read off the two
// knobs (scoreline + tier surcharge, then the cumulative ladder indexed WITHIN the run), so a
// failure means either a knob changed or the composition broke.
// ---------------------------------------------------------------------------

const SIMPLE = '6-3 6-4' // two sets, no tiebreak
const HARD = '6-4 3-6 6-4' // a third set
const EPIC = '7-6 6-7 7-6' // three tiebreak sets

describe('per-match cost = scoreline + tier surcharge', () => {
  // tier -> [simple, TB-or-3rd-set, 3 TB sets]
  const EXPECTED: Record<TierId, [number, number, number]> = {
    local: [1, 2, 3],
    regional: [2, 3, 4],
    national: [3, 4, 5],
    j30: [4, 5, 6],
    j60: [5, 6, 7],
    j300: [6, 7, 8],
  }

  it('matches the reference table for every tier and every scoreline shape', () => {
    for (const tier of TIER_LADDER) {
      const [simple, hard, epic] = EXPECTED[tier]
      expect(matchDrain(tier, SIMPLE), `${tier} simple`).toBe(simple)
      expect(matchDrain(tier, HARD), `${tier} 3-setter`).toBe(hard)
      expect(matchDrain(tier, EPIC), `${tier} 3 TB sets`).toBe(epic)
    }
  })

  it('a match costs 1 to 8 across the whole ladder – 1 at Local, 8 for a J300 epic', () => {
    const all = TIER_LADDER.flatMap((t) => [matchDrain(t, SIMPLE), matchDrain(t, HARD), matchDrain(t, EPIC)])
    expect(Math.min(...all)).toBe(1)
    expect(Math.max(...all)).toBe(8)
  })

  it('the tier surcharge is one step per rung, so a tier costs exactly +1 over the tier below', () => {
    for (let i = 1; i < TIER_LADDER.length; i++) {
      const below = matchDrain(TIER_LADDER[i - 1], SIMPLE)
      expect(matchDrain(TIER_LADDER[i], SIMPLE)).toBe(below + 1)
    }
  })

  it('a score-less record (a defensive path) is charged as straight sets, never as free', () => {
    for (const tier of TIER_LADDER) expect(matchDrain(tier, undefined)).toBe(matchDrain(tier, SIMPLE))
  })
})

describe('the cumulative ladder only starts on the SECOND match of a run', () => {
  it('the first match of a run never pays extra, at any ladder setting', () => {
    expect(runFatigueExtra(0)).toBe(0)
  })

  it('a one-match run costs exactly its match, so a first-round exit is ladder-free', () => {
    for (const tier of TIER_LADDER) {
      expect(tournamentRunStrain(tier, [{ score: SIMPLE }])).toBe(matchDrain(tier, SIMPLE))
    }
  })

  it('an empty run (a walkover, a skip, a medical withdrawal) costs nothing', () => {
    for (const tier of TIER_LADDER) expect(tournamentRunStrain(tier, [])).toBe(0)
  })

  it('a run longer than the ladder repeats its LAST rung – a bigger future draw can never cost 0', () => {
    const ladder = ECONOMY.condition.runFatigueLadder
    const last = ladder[ladder.length - 1]
    expect(runFatigueExtra(ladder.length)).toBe(last)
    expect(runFatigueExtra(ladder.length + 20)).toBe(last)
  })
})

describe('whole-run cost — the shipped ladder, all matches simple', () => {
  // tier -> cost at depth 1..5, under the SHIPPED ladder C = [0,1,1,2,2].
  // Read straight off docs/specs/fatigue-reference.md; the owner's own benchmark is the National
  // row: he priced "a five-match National run" at 25, which is variant A. Shipped C gives 21 —
  // this table is what makes that trade-off impossible to lose track of again.
  const EXPECTED: Record<TierId, [number, number, number, number, number]> = {
    local: [1, 3, 5, 8, 11],
    regional: [2, 5, 8, 12, 16],
    national: [3, 7, 11, 16, 21],
    j30: [4, 9, 14, 20, 26],
    j60: [5, 11, 17, 24, 31],
    j300: [6, 13, 20, 28, 36],
  }

  it('the shipped ladder is C = [0,1,1,2,2] (change this pin deliberately, never to make a test pass)', () => {
    expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 1, 2, 2])
  })

  it('matches the reference table at every tier and every depth', () => {
    for (const tier of TIER_LADDER) {
      for (let depth = 1; depth <= 5; depth++) {
        const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
        expect(tournamentRunStrain(tier, run), `${tier} depth ${depth}`).toBe(EXPECTED[tier][depth - 1])
      }
    }
  })

  it('the ladder is ADDITIVE on top of the per-match cost, never a replacement for it', () => {
    for (const tier of TIER_LADDER) {
      for (let depth = 1; depth <= 5; depth++) {
        const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
        const base = depth * matchDrain(tier, SIMPLE)
        let extra = 0
        for (let i = 0; i < depth; i++) extra += runFatigueExtra(i)
        expect(tournamentRunStrain(tier, run)).toBe(base + extra)
        expect(tournamentRunStrain(tier, run)).toBeGreaterThanOrEqual(base) // never cheaper than the matches
      }
    }
  })

  it("the owner's three-match Local reference case costs 6 (base 4 + ladder 2)", () => {
    // Two straight-sets matches and one three-setter, exactly the run he measured in the app.
    const run = [{ score: SIMPLE }, { score: SIMPLE }, { score: HARD }]
    expect(tournamentRunStrain('local', run)).toBe(6)
    expect(run.reduce((s, m) => s + matchDrain('local', m.score), 0)).toBe(4) // the base half
  })
})
