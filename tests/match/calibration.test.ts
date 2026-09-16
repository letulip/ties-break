import { describe, it, expect } from 'vitest'
import { simulateMatch, fastMatchProbability } from '../../src/engine/match/engine'
import { basePServe, modifiedPServe } from '../../src/engine/match/point'
import { pMatchBo3 } from '../../src/engine/match/closedForm'
import type { MatchPlayer, MatchOptions, PointContext, Tour, Surface, MatchResult } from '../../src/engine/match/types'

// All Monte Carlo runs use fixed string seeds, so every number below is deterministic.

// ⚠ `groundstrokes: 50` ON BOTH SIDES BY DEFAULT (v25), and that is not filler - it is what keeps
// every fixture in this file byte-identical. The rally term in `basePServe` multiplies a DIFFERENCE,
// so two players level off the ground contribute exactly zero and no calibration band moves.
function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

function baseOpts(over: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 's', ...over }
}

// Regular (non-tiebreak) games in a completed set: a 7-6 set has one tiebreak "game".
function regularGames(sets: MatchResult['sets']): number {
  let g = 0
  for (const s of sets) {
    const isTiebreakSet = (s.a === 7 && s.b === 6) || (s.a === 6 && s.b === 7)
    g += isTiebreakSet ? s.a + s.b - 1 : s.a + s.b
  }
  return g
}

// Hold rate over n mirror matches = holds / service games = 1 - breaks / regularGames.
function holdRate(tour: Tour, surface: Surface, n: number): number {
  const a = player({ id: 'a' })
  const b = player({ id: 'b' })
  let games = 0
  let breaks = 0
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(a, b, baseOpts({ tour, surface, seed: `hold-${tour}-${surface}-${i}` }))
    games += regularGames(r.sets)
    breaks += r.stats[0].breaksWon + r.stats[1].breaksWon
  }
  return 1 - breaks / games
}

// Fraction of matches side A (index 0) wins.
function winRateA(
  a: MatchPlayer,
  b: MatchPlayer,
  n: number,
  over: Partial<MatchOptions>,
  tag: string,
): number {
  let wins = 0
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(a, b, baseOpts({ ...over, seed: `${tag}-${i}` }))
    if (r.winner === 0) wins++
  }
  return wins / n
}

// Large Monte Carlo runs exceed vitest's default 5s per-test timeout; the sizes
// are fixed by the spec, so raise the timeout rather than shrink the samples.
const MC_TIMEOUT = 60000

describe('calibration — service hold rate bands (10k mirror matches)', () => {
  it(
    'ATP hard hold rate is in [0.74, 0.84]',
    () => {
      const hold = holdRate('atp', 'hard', 10000)
      expect(hold).toBeGreaterThanOrEqual(0.74)
      expect(hold).toBeLessThanOrEqual(0.84)
    },
    MC_TIMEOUT,
  )

  it(
    'WTA hard hold rate is in [0.60, 0.72]',
    () => {
      const hold = holdRate('wta', 'hard', 10000)
      expect(hold).toBeGreaterThanOrEqual(0.6)
      expect(hold).toBeLessThanOrEqual(0.72)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — fairness of equal players', () => {
  it(
    'equal players with momentum on win ~50% each over 20k matches',
    () => {
      const rate = winRateA(player({ id: 'a' }), player({ id: 'b' }), 20000, { momentum: true }, 'fair')
      expect(rate).toBeGreaterThanOrEqual(0.48)
      expect(rate).toBeLessThanOrEqual(0.52)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — Monte Carlo tracks the closed form', () => {
  it(
    'MC(50k) match win prob is within 0.015 of pMatchBo3 (base ~ 0.65 vs 0.62)',
    () => {
      // Neutralize the non-iid modifiers so MC estimates the closed form directly:
      // composure 100 (no big-point penalty), equal stamina (fatigue cancels), momentum off.
      const a = player({ id: 'a', serve: 62.5, ret: 50, composure: 100, stamina: 100 })
      const b = player({ id: 'b', serve: 43.75, ret: 50, composure: 100, stamina: 100 })
      const o = baseOpts({ tour: 'atp', surface: 'hard', momentum: false })
      // Confirm the crafted regime.
      expect(basePServe(a, b, o)).toBeCloseTo(0.65, 10)
      expect(basePServe(b, a, o)).toBeCloseTo(0.62, 10)

      const expected = fastMatchProbability(a, b, o) // pMatchBo3(0.65, 0.62)
      const mc = winRateA(a, b, 50000, { tour: 'atp', surface: 'hard', momentum: false }, 'mc')
      expect(Math.abs(mc - expected)).toBeLessThan(0.015)
    },
    MC_TIMEOUT,
  )
})

// =================================================================================================
// ⭐⭐ ROUND 38, C4 – THE CLOSED FORM AND THE POINT LOOP ARE ONE MODEL, MEASURED.
// =================================================================================================
//
// ⚠ THIS IS THE REGRESSION NET FOR THE WHOLE SLICE, and it is built so it CANNOT pass on the old
// model. Each cell asserts two things about the same 20,000 matches:
//
//   1. the CALIBRATED closed form (`fastMatchProbability`, what the card quotes and what resolves
//      every AI-vs-AI match) is within a point of what the loop actually produces;
//   2. the UNCALIBRATED one (`pMatchBo3(basePServe…)`, the pre-C4 formula, evaluated live off the
//      function C4 did not touch) is NOT – it misses by at least three times as much.
//
// The second assertion is the mutation proof: revert `fastMatchProbability` to `basePServe` and both
// halves collapse onto the same number, so line 1 fails and line 2 fails with it.
//
// ⚠ THE TWO CELLS ARE THE OWNER'S OWN CASES, from `docs/specs/next-waves-2026-09.md` §C4: «stamina
// 30 against 90; composure 30 against 80 is 1.7 pp». Measured pre-C4 by
// `tools/r38-closed-form-residual.ts` over 315 cells x 20,000 matches: the composure case reproduced
// his 1.7 pp exactly (1.68), and the stamina case read 4.77 pp here against the 5.1 pp the spec
// quotes from a different pair. Both close to under a point.
describe('calibration — C4: the closed form is the match she plays', () => {
  const CASES = [
    { tag: 'stamina 30 v 90', a: player({ id: 'a', stamina: 90 }), b: player({ id: 'b', stamina: 30 }) },
    { tag: 'composure 30 v 80', a: player({ id: 'a', composure: 80 }), b: player({ id: 'b', composure: 30 }) },
  ]

  for (const { tag, a, b } of CASES) {
    it(
      `${tag}: the calibrated form tracks the loop, the uncalibrated one does not (20k)`,
      () => {
        const over = { tour: 'wta' as const, surface: 'hard' as const }
        const o = baseOpts(over)
        const mc = winRateA(a, b, 20000, over, `c4-${tag.replace(/ /g, '-')}`)
        const calibrated = fastMatchProbability(a, b, o)
        const uncalibrated = pMatchBo3(basePServe(a, b, o), basePServe(b, a, o))
        const after = Math.abs(mc - calibrated)
        const before = Math.abs(mc - uncalibrated)
        // 1 pp, against a 0.35 pp standard error on 20,000 matches.
        expect(after, `${tag}: calibrated ${calibrated} vs mc ${mc}`).toBeLessThan(0.01)
        // ...and the model it replaced is out by a multiple of that, which is what C4 bought.
        expect(before, `${tag}: uncalibrated ${uncalibrated} vs mc ${mc}`).toBeGreaterThan(3 * after)
      },
      MC_TIMEOUT,
    )
  }
})

describe('calibration — momentum is bounded', () => {
  it(
    '|winRate(momentum on) - winRate(momentum off)| < 0.02 for equal players (20k each)',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const on = winRateA(a, b, 20000, { momentum: true }, 'mom')
      const off = winRateA(a, b, 20000, { momentum: false }, 'mom')
      expect(Math.abs(on - off)).toBeLessThan(0.02)
    },
    MC_TIMEOUT,
  )
})

// =================================================================================================
// ⚠⚠ RE-AIMED BY ROUND 42 #34 – THE PRICE OF NERVE, AND THE BAND MOVED BECAUSE THE OWNER MOVED IT.
// =================================================================================================
//
// The band used to be (0.50, 0.60) and the measurement sat at 0.526. Round 42 #34 measured what that
// meant on a build the game really deals – **+20 composure bought +0.4 pp of match win rate against
// groundstrokes' +18.0 pp, forty times** – and the owner ruled (15.09): «надо поднять цену нервов…
// у нас будет честно понятно, что каждый показатель влияет на что-то в игре», target **+4 pp**.
//
// This fixture is the widest composure gap the game can express (100 against 0 – five times the 20
// points the price list is quoted over), so it moves by five times as much and lands at **0.734**.
// The re-aim is the ITEM, not a regression: docs/specs/the-price-of-nerve-2026-09.md wrote 0.68–0.75
// down as prediction P13 before a line of `src/` moved, and the measurement is inside it.
//
// ⚠ THE UPPER WALL IS STILL A WALL AND IS WHAT THIS TEST IS FOR. A wing worth more than a serve
// point would decide careers off the seed draw, which is the complaint that started #34; 0.80 is
// where composure would be buying more than `serve` does over the same span.
describe('calibration — composure matters but is bounded', () => {
  it(
    'composure 100 vs composure 0 (else mirror 50s) wins in (0.65, 0.80) over 20k',
    () => {
      const composed = player({ id: 'a', composure: 100 })
      const nervy = player({ id: 'b', composure: 0 })
      const rate = winRateA(composed, nervy, 20000, {}, 'comp')
      expect(rate).toBeGreaterThan(0.65)
      expect(rate).toBeLessThan(0.8)
    },
    MC_TIMEOUT,
  )
})

// =================================================================================================
// ⭐⭐ ROUND 42 #34 – AND THE OTHER HALF OF THE CHANGE: A PAIR LEVEL IN COMPOSURE IS BYTE-IDENTICAL.
// =================================================================================================
//
// The new pressure term is `(receiver.composure − server.composure) / 100 × PRESSURE_NERVE_MAX`, a
// DIFFERENCE, so it is exactly 0 between two players level in the wing – `x - 0 === x` for every
// finite x. That is what lets the tour's hold rate, the fairness fixture above and the upset corridor
// survive a change to a quarter of the points BY CONSTRUCTION rather than by luck, and it is why the
// Klaassen–Magnus dock was left where it was instead of being re-shaped into the difference (that
// dock is NOT zero for a level pair, so re-shaping it would have moved every hold rate in the game).
//
// ⚠ ASSERTED AGAINST `modifiedPServe` ITSELF AND NOT AGAINST A REMEMBERED NUMBER, on the same
// reasoning tests/match/point.test.ts uses for `nerveAndLegs`: a pin holding a constant would go
// green again the moment somebody re-tuned the constant, and the property is not about the constant.
// MEASURED CONFIRMATION, for the record: with the term at 0.07 and at 0, the ATP hard hold rate over
// 10,000 mirror matches is 0.78681362 both times, WTA 0.66370895, the fairness fixture 0.49955000 –
// identical to eight decimal places, which is what "the term is not there" looks like from outside.
describe('calibration — round 42 #34: the pressure term is invisible to a level pair', () => {
  it('every pressure point is byte-identical for two players level in composure', () => {
    const o = baseOpts({ tour: 'wta' })
    // Deliberately NOT level in everything else: the claim is about composure alone, so the pair
    // carries a serve gap, a return gap and a rally gap that the base form does read.
    const a = player({ id: 'a', serve: 61, ret: 48, groundstrokes: 70, composure: 73, stamina: 55 })
    const b = player({ id: 'b', serve: 52, ret: 66, groundstrokes: 44, composure: 73, stamina: 55 })
    const base = basePServe(a, b, o)
    // The five facts that make a point a pressure point, one at a time and then all at once.
    const contexts: PointContext[] = [
      { pointNumber: 7, server: 0, tiebreak: false, breakPoint: false, setPointFor: null, matchPointFor: null },
      { pointNumber: 7, server: 0, tiebreak: false, breakPoint: true, setPointFor: null, matchPointFor: null },
      { pointNumber: 7, server: 0, tiebreak: true, breakPoint: false, setPointFor: null, matchPointFor: null },
      { pointNumber: 7, server: 0, tiebreak: false, breakPoint: false, setPointFor: 1, matchPointFor: null },
      { pointNumber: 7, server: 0, tiebreak: false, breakPoint: false, setPointFor: 1, matchPointFor: 1 },
      { pointNumber: 7, server: 0, tiebreak: false, breakPoint: false, setPointFor: null, matchPointFor: null, decidingClose: true },
      { pointNumber: 7, server: 0, tiebreak: true, breakPoint: true, setPointFor: 0, matchPointFor: 0, decidingClose: true },
    ]
    for (const ctx of contexts) {
      // The ONLY term that may act here is the break-point dock, which reads the server's composure
      // alone and is untouched by #34. Anything else on the sheet would be the new term leaking.
      const expected = base - (ctx.breakPoint ? (1 - a.composure / 100) * 0.03 : 0)
      const got = modifiedPServe(base, a, b, ctx, null)
      expect(got, `pressure ctx ${JSON.stringify(ctx)}`).toBe(expected)
    }
  })

  it('...and it is NOT zero the moment the two are unlevel – the mutation arm for the test above', () => {
    const o = baseOpts({ tour: 'wta' })
    const a = player({ id: 'a', composure: 73 })
    const b = player({ id: 'b', composure: 43 })
    const base = basePServe(a, b, o)
    const tb: PointContext = { pointNumber: 7, server: 0, tiebreak: true, breakPoint: false, setPointFor: null, matchPointFor: null }
    // A tiebreak point carries no dock of its own, so the whole difference is the new term: a
    // 30-point edge to the server, i.e. `0.30 × PRESSURE_NERVE_MAX` added to her p.
    expect(modifiedPServe(base, a, b, tb, null) - base).toBeCloseTo(0.3 * 0.07, 12)
  })
})

describe('calibration — performance', () => {
  it(
    'runs 10,000 simulateMatch calls in under 3 seconds',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const t0 = performance.now()
      for (let i = 0; i < 10000; i++) {
        simulateMatch(a, b, baseOpts({ tour: 'atp', surface: 'hard', seed: `perf-${i}` }))
      }
      const elapsed = performance.now() - t0
      expect(elapsed).toBeLessThan(3000)
    },
    MC_TIMEOUT,
  )
})

describe('calibration — match length sanity', () => {
  it(
    'mean totalPoints of ATP mirror matches is in [120, 220]',
    () => {
      const a = player({ id: 'a' })
      const b = player({ id: 'b' })
      const n = 3000
      let total = 0
      for (let i = 0; i < n; i++) {
        total += simulateMatch(a, b, baseOpts({ tour: 'atp', surface: 'hard', seed: `len-${i}` })).totalPoints
      }
      const mean = total / n
      expect(mean).toBeGreaterThanOrEqual(120)
      expect(mean).toBeLessThanOrEqual(220)
    },
    MC_TIMEOUT,
  )
})
