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
//
// ⚠ RE-PINNED 26.07 by the MATCH BASE RAISE (owner decision): matchFatigue.straightSets 1 → 2 and
// hardMatch 2 → 3, so a SIMPLE match now costs 2 (Local) … 7 (J300) and the ceiling is 9. His rule
// ("+1 for a tiebreak or a third set", "+1 more for a three-TB epic") is unchanged — only the base
// moved, and hardMatch stays exactly one step above it. extraTiebreaks and tierMatchFatigue are
// untouched. Every table below is the same arithmetic one rung higher.
// ---------------------------------------------------------------------------

const SIMPLE = '6-3 6-4' // two sets, no tiebreak
const HARD = '6-4 3-6 6-4' // a third set
const EPIC = '7-6 6-7 7-6' // three tiebreak sets

describe('per-match cost = scoreline + tier surcharge', () => {
  // tier -> [simple, TB-or-3rd-set, 3 TB sets]
  const EXPECTED: Record<TierId, [number, number, number]> = {
    local: [2, 3, 4],
    regional: [3, 4, 5],
    national: [4, 5, 6],
    j30: [5, 6, 7],
    j60: [6, 7, 8],
    j300: [7, 8, 9],
  }

  it('the base is the owner-set 2 for a simple match, 3 for a hard one (one step above it)', () => {
    // Pinned as a PAIR: the owner's rule is "+1 for a TB or a 3rd set", so hardMatch is not a free
    // number — it must always be straightSets + 1, or the rule and the knobs have drifted apart.
    const f = ECONOMY.condition.matchFatigue
    expect(f.straightSets).toBe(2)
    expect(f.hardMatch).toBe(f.straightSets + 1)
    expect(f.extraTiebreaks).toBe(1) // untouched by the base raise
  })

  it('matches the reference table for every tier and every scoreline shape', () => {
    for (const tier of TIER_LADDER) {
      const [simple, hard, epic] = EXPECTED[tier]
      expect(matchDrain(tier, SIMPLE), `${tier} simple`).toBe(simple)
      expect(matchDrain(tier, HARD), `${tier} 3-setter`).toBe(hard)
      expect(matchDrain(tier, EPIC), `${tier} 3 TB sets`).toBe(epic)
    }
  })

  it('a match costs 2 to 9 across the whole ladder – 2 at Local, 9 for a J300 epic', () => {
    const all = TIER_LADDER.flatMap((t) => [matchDrain(t, SIMPLE), matchDrain(t, HARD), matchDrain(t, EPIC)])
    expect(Math.min(...all)).toBe(2)
    expect(Math.max(...all)).toBe(9)
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
  // Read straight off docs/specs/fatigue-reference.md. RE-PINNED for the base raise (base 1 → 2).
  // The row that matters most: at base 2 + shipped C a straight-sets TITLE costs exactly what the
  // pre-round-9 FLAT per-tournament strain used to charge — Local (3 matches) 8, Regional (4) 16,
  // National (5) 26 vs the old flat 8 / 16 / 26. The redesign is now cost-neutral at the top of a
  // draw and still cheap on an early exit, which is what the per-match design was for.
  const EXPECTED: Record<TierId, [number, number, number, number, number]> = {
    local: [2, 5, 8, 12, 16],
    regional: [3, 7, 11, 16, 21],
    national: [4, 9, 14, 20, 26],
    j30: [5, 11, 17, 24, 31],
    j60: [6, 13, 20, 28, 36],
    j300: [7, 15, 23, 32, 41],
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

  it("the owner's three-match Local reference case costs 9 (base 7 + ladder 2)", () => {
    // Two straight-sets matches and one three-setter, exactly the run he measured in the app.
    // RE-PINNED 6 → 9 by the base raise: the three per-match drains are 2 + 2 + 3 = 7 (were
    // 1 + 1 + 2 = 4); the ladder half is unchanged at 2. Same run in tests/round10.test.ts (R10-14).
    const run = [{ score: SIMPLE }, { score: SIMPLE }, { score: HARD }]
    expect(tournamentRunStrain('local', run)).toBe(9)
    expect(run.reduce((s, m) => s + matchDrain('local', m.score), 0)).toBe(7) // the base half
  })
})

describe('whole-run cost — the four proposed ladders (the doc grid), all matches simple', () => {
  // The variant grid the owner reads to choose a ladder, pinned so the doc's table cannot drift
  // into unasserted prose — the whole reason this file exists. Each ladder is patched onto the LIVE
  // knob (the same pattern the fatigue bench's `--scenario runfat-*` uses) and restored.
  //   off [0] · D [0,1,1,1,1] · C [0,1,1,2,2] SHIPPED · B [0,1,1,2,4] · A [0,1,2,3,4]
  // Cost at depth 1..5 = depth × per-match + the ladder's running sum. Generated from the engine
  // at base 2 and copied here; a base or ladder change fails this and the doc together.
  const LADDERS: Record<string, number[]> = {
    off: [0],
    D: [0, 1, 1, 1, 1],
    C: [0, 1, 1, 2, 2],
    B: [0, 1, 1, 2, 4],
    A: [0, 1, 2, 3, 4],
  }
  const GRID: Record<string, Record<TierId, number[]>> = {
    off: {
      local: [2, 4, 6, 8, 10],
      regional: [3, 6, 9, 12, 15],
      national: [4, 8, 12, 16, 20],
      j30: [5, 10, 15, 20, 25],
      j60: [6, 12, 18, 24, 30],
      j300: [7, 14, 21, 28, 35],
    },
    D: {
      local: [2, 5, 8, 11, 14],
      regional: [3, 7, 11, 15, 19],
      national: [4, 9, 14, 19, 24],
      j30: [5, 11, 17, 23, 29],
      j60: [6, 13, 20, 27, 34],
      j300: [7, 15, 23, 31, 39],
    },
    C: {
      local: [2, 5, 8, 12, 16],
      regional: [3, 7, 11, 16, 21],
      national: [4, 9, 14, 20, 26],
      j30: [5, 11, 17, 24, 31],
      j60: [6, 13, 20, 28, 36],
      j300: [7, 15, 23, 32, 41],
    },
    B: {
      local: [2, 5, 8, 12, 18],
      regional: [3, 7, 11, 16, 23],
      national: [4, 9, 14, 20, 28],
      j30: [5, 11, 17, 24, 33],
      j60: [6, 13, 20, 28, 38],
      j300: [7, 15, 23, 32, 43],
    },
    A: {
      local: [2, 5, 9, 14, 20],
      regional: [3, 7, 12, 18, 25],
      national: [4, 9, 15, 22, 30],
      j30: [5, 11, 18, 26, 35],
      j60: [6, 13, 21, 30, 40],
      j300: [7, 15, 24, 34, 45],
    },
  }

  it('matches the doc grid for every variant, tier and depth – and restores the shipped knob', () => {
    const knob = ECONOMY.condition as unknown as { runFatigueLadder: number[] }
    const shipped = knob.runFatigueLadder
    try {
      for (const [id, ladder] of Object.entries(LADDERS)) {
        knob.runFatigueLadder = ladder
        for (const tier of TIER_LADDER) {
          for (let depth = 1; depth <= 5; depth++) {
            const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
            expect(tournamentRunStrain(tier, run), `${id} ${tier} depth ${depth}`).toBe(GRID[id][tier][depth - 1])
          }
        }
      }
    } finally {
      knob.runFatigueLadder = shipped
    }
    expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 1, 2, 2])
  })
})

describe('a PRACTICE friendly stays at the floor of 1 — and now the −1 finally does something', () => {
  // world.ts playPracticeMatch: drain = max(1, matchDrain('local', score) − 1). The engine-level
  // pin (a real booked friendly, condition arithmetic included) is tests/planner.test.ts P6; this is
  // the canonical TABLE behind the doc.
  //
  // ⚠ THE ONE BEHAVIOUR CHANGE FOR PRACTICES. At base 1 a Local simple match cost 1, so the rule
  // was max(1, 0) = 1 and the −1 was dead arithmetic — every friendly cost 1 whatever the scoreline.
  // At base 2 the floor is reached by subtraction instead of by clamping (2 − 1 = 1), so the
  // scoreline finally grades a friendly: a slugfest costs MORE than a straightforward win.
  const friendlyDrain = (score: string): number => Math.max(1, matchDrain('local', score) - 1)

  it('straight sets still costs exactly 1 – the cheapest thing in the game is unchanged', () => {
    expect(friendlyDrain(SIMPLE)).toBe(1)
    expect(matchDrain('local', SIMPLE) - 1).toBe(1) // reached by the −1, no longer by the floor
  })

  it('a 3-set friendly now costs 2 (it used to cost 1) and a three-TB epic costs 3', () => {
    expect(friendlyDrain(HARD)).toBe(2)
    expect(friendlyDrain(EPIC)).toBe(3)
  })

  it('is never free and never dearer than the same match at a Local, whatever the scoreline', () => {
    for (const score of [SIMPLE, HARD, EPIC, '7-6 6-4', '7-6 6-7 6-3']) {
      expect(friendlyDrain(score)).toBeGreaterThanOrEqual(1)
      expect(friendlyDrain(score)).toBeLessThan(matchDrain('local', score))
    }
  })
})
