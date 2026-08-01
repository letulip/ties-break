import { describe, it, expect, vi } from 'vitest'

// The determinism smoke below replays one short career TWICE on the live engine – deterministic but
// not free, and the unit project runs many files in parallel. Same contention-budget reasoning as
// the sibling bench tests (vite.config.ts): the real cost is a couple of seconds on an idle core.
vi.setConfig({ testTimeout: 60_000 })

import {
  counterfactualLedger,
  shadowAiRows,
  peerIds,
  countInversions,
  rankOf,
  pointsOf,
  armShadowCapture,
  runDualCareer,
  toCsv,
  median,
  WINDOW_WEEKS,
  CELL_PROFILE,
  CELL_POLICY,
  type PlayedEventCapture,
} from '../tools/dual-universe-bench'
import { computeRanking, type SeasonResult } from '../src/engine/season/ranking'
import { inTrack, KID_ID } from '../src/engine/world'
import { TIERS } from '../src/engine/season/calendar'
import type { RankingRow } from '../src/engine/season/types'

// The bench's whole claim to honesty is that the counterfactual ledger is a MECHANICAL mirror:
// canonical AI rows of her played events swapped for shadow-derived rows, nothing else moved, her
// own rows untouchable, the engine's 52-week window respected. These tests pin that contract on a
// hand-built fixture, plus the determinism the house rules demand of every bench (same cell twice,
// byte-identical CSV).

const J30 = TIERS.j30.points // live table – the fixture derives expectations, never hardcodes them

function row(playerId: string, week: number, points: number, tier?: SeasonResult['tier']): SeasonResult {
  return tier === undefined ? { playerId, week, points } : { playerId, week, points, tier }
}

describe('counterfactualLedger (P5 Phase A – the swap contract)', () => {
  // Week 10, j30: canonical bracket paid c1..c3; the shadow bracket she actually played had
  // r1 champion, kid runner-up, r2 quarter-ish, r3 scoreless. Week 10 also ran a local event
  // (different tier – must not be touched), week 9 ran another j30 (different week – untouched).
  const played: Pick<PlayedEventCapture, 'week' | 'tier' | 'finishes'>[] = [
    { week: 10, tier: 'j30', finishes: { [KID_ID]: 1, r1: 0, r2: 2, r3: 5 } },
  ]
  const results: SeasonResult[] = [
    row('c1', 10, J30[0], 'j30'),
    row('c2', 10, J30[1], 'j30'),
    row('c3', 10, 0, 'j30'),
    row(KID_ID, 10, J30[1], 'j30'), // her own row – finalizeTournament's, identical in both universes
    row('l1', 10, 30, 'local'), // same week, different tier: not her event, stays
    row('c1', 9, J30[2], 'j30'), // different week, same tier: last week's j30, stays
    row('old', 10, 99), // tier-less pre-r5 history: never swapped
  ]

  it('swaps exactly the canonical AI rows of the played (week, tier) for shadow rows', () => {
    const cf = counterfactualLedger(results, played, 20)
    // canonical AI rows of (10, j30) are gone…
    expect(cf.some((r) => r.playerId === 'c1' && r.week === 10)).toBe(false)
    expect(cf.some((r) => r.playerId === 'c2')).toBe(false)
    expect(cf.some((r) => r.playerId === 'c3')).toBe(false)
    // …replaced by the shadow finish table, paid off the live tier points, kid excluded from the
    // AI rows (her own row is already there), scoreless appearance rows kept (dense mirror)
    expect(cf).toContainEqual(row('r1', 10, J30[0], 'j30'))
    expect(cf).toContainEqual(row('r2', 10, J30[2], 'j30'))
    expect(cf).toContainEqual(row('r3', 10, J30[5] ?? 0, 'j30'))
    expect(cf.filter((r) => r.playerId === KID_ID)).toEqual([row(KID_ID, 10, J30[1], 'j30')])
    // …and everything that was not her event is byte-untouched
    expect(cf).toContainEqual(row('l1', 10, 30, 'local'))
    expect(cf).toContainEqual(row('c1', 9, J30[2], 'j30'))
    expect(cf).toContainEqual(row('old', 10, 99))
  })

  it('respects the engine window: a played event older than WINDOW_WEEKS is not swapped', () => {
    const cf = counterfactualLedger(results, played, 10 + WINDOW_WEEKS + 1)
    expect(cf).toEqual(results) // no swap, no additions – both universes' rows are pruned by then anyway
  })

  it('a played event exactly at the window edge still swaps (same <= rule as pruneResults)', () => {
    const cf = counterfactualLedger(results, played, 10 + WINDOW_WEEKS)
    expect(cf.some((r) => r.playerId === 'r1')).toBe(true)
    expect(cf.some((r) => r.playerId === 'c1' && r.week === 10)).toBe(false)
  })

  it('never moves HER points: best-6 identical over both ledgers', () => {
    const roster = [KID_ID, 'c1', 'c2', 'c3', 'r1', 'r2', 'r3', 'l1']
    const real = computeRanking(results, 20, roster, inTrack('itf'))
    const cf = computeRanking(counterfactualLedger(results, played, 20), 20, roster, inTrack('itf'))
    expect(pointsOf(cf, KID_ID)).toBe(pointsOf(real, KID_ID))
    // …while the swap visibly moves the RIVALS: c1 loses the canonical title points, r1 gains them
    expect(pointsOf(real, 'c1')).toBeGreaterThan(pointsOf(cf, 'c1'))
    expect(pointsOf(cf, 'r1')).toBeGreaterThan(pointsOf(real, 'r1'))
  })

  it('shadowAiRows is dense over the draw and pays off the tier table, kid excluded', () => {
    const rows = shadowAiRows({ [KID_ID]: 0, a: 1, b: 5 }, 7, 'j30')
    expect(rows).toEqual([row('a', 7, J30[1], 'j30'), row('b', 7, J30[5] ?? 0, 'j30')])
  })
})

describe('table lookups', () => {
  const table: RankingRow[] = [
    { playerId: 'a', points: 100, rank: 1 },
    { playerId: 'b', points: 80, rank: 2 },
    { playerId: KID_ID, points: 60, rank: 3 },
    { playerId: 'c', points: 40, rank: 4 },
    { playerId: 'd', points: 20, rank: 5 },
  ]

  it('rankOf falls back to one past the table (recomputeKidRank convention)', () => {
    expect(rankOf(table, 'a')).toBe(1)
    expect(rankOf(table, 'ghost')).toBe(6)
  })

  it('peerIds takes ±span table places around her, excluding her', () => {
    expect(peerIds(table, KID_ID, 1)).toEqual(['b', 'c'])
    expect(peerIds(table, KID_ID, 10)).toEqual(['a', 'b', 'c', 'd'])
    expect(peerIds(table, 'ghost', 10)).toEqual([])
  })

  it('countInversions is strict on both sides and dedups the beaten list', () => {
    const cf: RankingRow[] = [
      { playerId: 'b', points: 80, rank: 1 }, // b above her in BOTH – no inversion
      { playerId: KID_ID, points: 60, rank: 2 },
      { playerId: 'a', points: 50, rank: 3 }, // a: above real (rank 1), below cf – inversion
      { playerId: 'c', points: 40, rank: 4 }, // c below her in both – no inversion
      { playerId: 'd', points: 20, rank: 5 },
    ]
    expect(countInversions(['a', 'a', 'b', 'c'], table, cf, KID_ID)).toBe(1)
    expect(countInversions([], table, cf, KID_ID)).toBe(0)
  })

  it('median of odd/even/empty lists', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(Number.isNaN(median([]))).toBe(true)
  })
})

describe('armShadowCapture', () => {
  it('fires on non-null assignment only, and the property still reads/writes normally', () => {
    const seen: object[] = []
    const w: { pendingTournament: object | null } = { pendingTournament: null }
    armShadowCapture(w as never, (p) => seen.push(p))
    const fake = { eventId: 'x' }
    w.pendingTournament = fake
    expect(w.pendingTournament).toBe(fake)
    w.pendingTournament = null
    expect(w.pendingTournament).toBeNull()
    expect(seen).toEqual([fake])
  })
})

describe('determinism (house rule: seeds only – same cell twice, byte-identical CSV)', () => {
  it('same seed, same horizon ⇒ identical measurements and identical CSV bytes', () => {
    const horizon = { weeks: 104, measureAt: [52, 104] }
    const a = runDualCareer(CELL_PROFILE, CELL_POLICY, 0, horizon)
    const b = runDualCareer(CELL_PROFILE, CELL_POLICY, 0, horizon)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    // fingerprint passed as a fixed string: the CSV builder itself must be pure
    expect(toCsv([a], 'test-fp')).toBe(toCsv([b], 'test-fp'))
    // and the run measured something real: she is on the table at both measurement weeks
    expect(a.points).toHaveLength(2)
    expect(a.points[0].week).toBe(52)
    expect(a.points[1].week).toBe(104)
  })
})
