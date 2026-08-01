import { describe, it, expect } from 'vitest'
import { matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
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
//
// ⚠ RE-AIMED 31.07 by the ADULT RUNGS (task #17), and this one is a LONGER LADDER rather than a
// different rule. W15/W35/W100 joined the catalogue with surcharges 6/7/8, continuing the same
// +1-per-rung extrapolation the J family already used, so a SIMPLE match now costs 2 (Local) … 10
// (W100) and the ceiling is 12. Not one existing number in this file moved; every table simply grew
// three rows, because every table here is exhaustive over `TierId` on purpose - a new rung must not
// be able to reach the engine without somebody writing down what it costs.
//
// ⚠ RE-AIMED 01.08 (R15-6): THE W FAMILY IS REPRICED, TWO LEVERS, OWNER'S RULING ON BOTH.
//   1. The surcharges dropped 6/7/8 -> 4/5/6. Asked directly, the owner agreed the W15 drops were
//      too deep for what the field is TODAY - measured, the W15 entrant field median sits at ~#53
//      of 200 (mean skill 50.2) against the J300 field's ~#20 (53.9), so the softest international
//      field was priced as the hardest week. The seam j300 (5) -> w15 (4) now DROPS by design;
//      each family stays +1 per rung inside itself. When the living-field population makes the W
//      fields real, w35/w100 are re-priced UPWARD, measured - the comment on the knob says so.
//   2. The cumulative run ladder is PER FAMILY: «может быть будет иметь смысл использовать другой
//      кумулятивный механизм для мировой серии, с меньшими надбавками просто. Я несколько тогда
//      предлагал». Domestic + J keep his measured ladder C ([0,1,1,2,2]) - not one of their cells
//      below moved - and the W family runs his flattest proposal D ([0,1,1,1,1]).
// A straight-sets W15 TITLE run therefore costs 34 (was 46), W35 39 (was 51), W100 44 (was 56),
// and the ceiling of a single match is 10 (a three-TB W100 epic), was 12.
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
    // ⚠ RE-AIMED AGAIN 01.08 (R15-6), NOT WEAKENED - same composition, repriced surcharges. The W
    // rows were 8/9/10 · 9/10/11 · 10/11/12 under the +1-over-J300 extrapolation; the owner's
    // ruling (see the file header) prices the family one step over the J ENTRY rungs instead,
    // because today's W fields are measurably the softest international draws in the game. The
    // arithmetic is untouched: `matchDrain = scoreline + tierMatchFatigue[tier]`, +1 per rung
    // INSIDE the family, and a W15 simple (6) now equals a J60 simple - which is roughly what
    // their fields actually are.
    w15: [6, 7, 8],
    w35: [7, 8, 9],
    w100: [8, 9, 10],
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

  // ⚠ RE-AIMED 31.07 (9 -> 12, the adult rungs), RE-AIMED AGAIN 01.08 (12 -> 10, R15-6): the W
  // reprice pulled the family's surcharges down to 4/5/6, so the most expensive match in the game
  // is a three-tiebreak W100 epic at 10. The assertion still pins BOTH ends of the range against
  // the live engine and still names which rung holds each end. The floor is untouched at 2: a
  // straight-sets Local match costs what it always did.
  it('a match costs 2 to 10 across the whole ladder – 2 at Local, 10 for a W100 epic', () => {
    const all = TIER_LADDER.flatMap((t) => [matchDrain(t, SIMPLE), matchDrain(t, HARD), matchDrain(t, EPIC)])
    expect(Math.min(...all)).toBe(2)
    expect(Math.max(...all)).toBe(10)
    expect(matchDrain('local', SIMPLE)).toBe(2)
    expect(matchDrain('w100', EPIC)).toBe(10)
  })

  // ⚠ RE-AIMED 01.08 (R15-6), AND THIS IS THE PIN THE REPRICE HAD TO MOVE. It read "+1 over the
  // tier below" across the WHOLE nine-rung ladder, which was true while the W family extrapolated
  // +1 over J300 and is exactly the claim the owner overruled: the W surcharges are priced for
  // TODAY's soft fields, one step over the J ENTRY rungs, so the j300 -> w15 seam DROPS. What is
  // pinned now is the shape that is actually designed: +1 per rung INSIDE each family, and the
  // seam's drop stated as its own assertion - so a hand that "fixes" the dip back up meets this
  // test and the knob's comment together.
  it('the surcharge is one step per rung INSIDE each family, and the J -> W seam drops by design', () => {
    for (const track of ['domestic', 'itf', 'wta'] as const) {
      const rungs = TIER_LADDER.filter((t) => TIERS[t].track === track)
      for (let i = 1; i < rungs.length; i++) {
        const below = matchDrain(rungs[i - 1], SIMPLE)
        expect(matchDrain(rungs[i], SIMPLE), `${rungs[i]} vs ${rungs[i - 1]}`).toBe(below + 1)
      }
    }
    // The domestic -> junior seam still steps UP (+1, j30 over national)...
    expect(matchDrain('j30', SIMPLE)).toBe(matchDrain('national', SIMPLE) + 1)
    // ...and the junior -> professional seam steps DOWN, w15 landing level with j60: the entry rung
    // of the adult game is priced one step over the entry rung of the junior one, not over its top.
    expect(matchDrain('w15', SIMPLE)).toBe(matchDrain('j300', SIMPLE) - 1)
    expect(matchDrain('w15', SIMPLE)).toBe(matchDrain('j30', SIMPLE) + 1)
  })

  it('a score-less record (a defensive path) is charged as straight sets, never as free', () => {
    for (const tier of TIER_LADDER) expect(matchDrain(tier, undefined)).toBe(matchDrain(tier, SIMPLE))
  })
})

describe('the cumulative ladder only starts on the SECOND match of a run', () => {
  it('the first match of a run never pays extra, in EITHER family', () => {
    // ⚠ RE-AIMED 01.08 (R15-6): the ladder is per family now, so the property is asserted on both -
    // a first match is free whichever table the tournament is on.
    for (const tier of TIER_LADDER) expect(runFatigueExtra(0, tier), tier).toBe(0)
  })

  it('a one-match run costs exactly its match, so a first-round exit is ladder-free', () => {
    for (const tier of TIER_LADDER) {
      expect(tournamentRunStrain(tier, [{ score: SIMPLE }])).toBe(matchDrain(tier, SIMPLE))
    }
  })

  it('an empty run (a walkover, a skip, a medical withdrawal) costs nothing', () => {
    for (const tier of TIER_LADDER) expect(tournamentRunStrain(tier, [])).toBe(0)
  })

  it('a run longer than its ladder repeats the LAST rung – a bigger future draw can never cost 0', () => {
    // Both families' ladders, each against its own last value (C ends on 2, D on 1).
    const c = ECONOMY.condition.runFatigueLadder
    expect(runFatigueExtra(c.length, 'national')).toBe(c[c.length - 1])
    expect(runFatigueExtra(c.length + 20, 'j300')).toBe(c[c.length - 1])
    const d = ECONOMY.condition.runFatigueLadderWta
    expect(runFatigueExtra(d.length, 'w15')).toBe(d[d.length - 1])
    expect(runFatigueExtra(d.length + 20, 'w100')).toBe(d[d.length - 1])
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
    // ⚠ RE-AIMED 01.08 (R15-6), NOT WEAKENED, and BOTH levers show in these three rows: the
    // per-match half is the repriced surcharge (4/5/6) and the ladder half is the owner's own
    // variant D ([0,1,1,1,1] - «с меньшими надбавками просто») instead of C. Depth x per-match +
    // the running D sum 0,1,2,3,4. The line worth reading is still the last one: a straight-sets
    // W15 TITLE run costs 34 (was 46), W35 39 (was 51), W100 44 (was 56) - and every domestic and
    // junior cell above is BYTE-IDENTICAL to the 26.07 tables, which is the other half of the
    // ruling: only the professional family moved.
    w15: [6, 13, 20, 27, 34],
    w35: [7, 15, 23, 31, 39],
    w100: [8, 17, 26, 35, 44],
  }

  it('the shipped ladders are C = [0,1,1,2,2] for domestic+J and D = [0,1,1,1,1] for the W family (change deliberately, never to make a test pass)', () => {
    expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 1, 2, 2])
    // R15-6, the owner's second lever - his own measured variant D, flattest of the four he priced.
    expect(ECONOMY.condition.runFatigueLadderWta).toEqual([0, 1, 1, 1, 1])
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
    // `runFatigueExtra(i, tier)` reads the tier's OWN family ladder (R15-6), so this identity now
    // also proves the composition picks the right ladder per rung.
    for (const tier of TIER_LADDER) {
      for (let depth = 1; depth <= 5; depth++) {
        const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
        const base = depth * matchDrain(tier, SIMPLE)
        let extra = 0
        for (let i = 0; i < depth; i++) extra += runFatigueExtra(i, tier)
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
  //   off [0] · D [0,1,1,1,1] · C [0,1,1,2,2] SHIPPED dom+J · B [0,1,1,2,4] · A [0,1,2,3,4]
  // Cost at depth 1..5 = depth × per-match + the ladder's running sum. Generated from the engine
  // at base 2 and copied here; a base or ladder change fails this and the doc together.
  //
  // ⚠ RE-AIMED 01.08 (R15-6): the grid patches BOTH family knobs to each variant, so every cell
  // still answers the one question it always did - "what would ladder X charge this run" - across
  // the whole nine-rung catalogue. The W columns are recomputed for the repriced surcharges
  // (4/5/6); the shipped SPLIT (C for dom+J, D for the W family) is pinned in the shipped-tables
  // suite above, not here - this grid is the menu, that pin is the order.
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
      w15: [6, 12, 18, 24, 30],
      w35: [7, 14, 21, 28, 35],
      w100: [8, 16, 24, 32, 40],
    },
    D: {
      local: [2, 5, 8, 11, 14],
      regional: [3, 7, 11, 15, 19],
      national: [4, 9, 14, 19, 24],
      j30: [5, 11, 17, 23, 29],
      j60: [6, 13, 20, 27, 34],
      j300: [7, 15, 23, 31, 39],
      w15: [6, 13, 20, 27, 34],
      w35: [7, 15, 23, 31, 39],
      w100: [8, 17, 26, 35, 44],
    },
    C: {
      local: [2, 5, 8, 12, 16],
      regional: [3, 7, 11, 16, 21],
      national: [4, 9, 14, 20, 26],
      j30: [5, 11, 17, 24, 31],
      j60: [6, 13, 20, 28, 36],
      j300: [7, 15, 23, 32, 41],
      w15: [6, 13, 20, 28, 36],
      w35: [7, 15, 23, 32, 41],
      w100: [8, 17, 26, 36, 46],
    },
    B: {
      local: [2, 5, 8, 12, 18],
      regional: [3, 7, 11, 16, 23],
      national: [4, 9, 14, 20, 28],
      j30: [5, 11, 17, 24, 33],
      j60: [6, 13, 20, 28, 38],
      j300: [7, 15, 23, 32, 43],
      w15: [6, 13, 20, 28, 38],
      w35: [7, 15, 23, 32, 43],
      w100: [8, 17, 26, 36, 48],
    },
    A: {
      local: [2, 5, 9, 14, 20],
      regional: [3, 7, 12, 18, 25],
      national: [4, 9, 15, 22, 30],
      j30: [5, 11, 18, 26, 35],
      j60: [6, 13, 21, 30, 40],
      j300: [7, 15, 24, 34, 45],
      w15: [6, 13, 21, 30, 40],
      w35: [7, 15, 24, 34, 45],
      w100: [8, 17, 27, 38, 50],
    },
  }

  it('matches the doc grid for every variant, tier and depth – and restores the shipped knobs', () => {
    const knob = ECONOMY.condition as unknown as { runFatigueLadder: number[]; runFatigueLadderWta: number[] }
    const shipped = knob.runFatigueLadder
    const shippedWta = knob.runFatigueLadderWta
    try {
      for (const [id, ladder] of Object.entries(LADDERS)) {
        knob.runFatigueLadder = ladder
        knob.runFatigueLadderWta = ladder
        for (const tier of TIER_LADDER) {
          for (let depth = 1; depth <= 5; depth++) {
            const run = Array.from({ length: depth }, () => ({ score: SIMPLE }))
            expect(tournamentRunStrain(tier, run), `${id} ${tier} depth ${depth}`).toBe(GRID[id][tier][depth - 1])
          }
        }
      }
    } finally {
      knob.runFatigueLadder = shipped
      knob.runFatigueLadderWta = shippedWta
    }
    expect(ECONOMY.condition.runFatigueLadder).toEqual([0, 1, 1, 2, 2])
    expect(ECONOMY.condition.runFatigueLadderWta).toEqual([0, 1, 1, 1, 1])
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
