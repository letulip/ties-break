// SHE PLAYED vs SHE SCORED — the ledger records an APPEARANCE, `points` records the award.
//
// Wave B ("a first-round loss pays ZERO", tune/first-round-zero) pulled the two facts apart for the
// first time: until then every finish paid, so "has a row in `world.results`" was a faithful proxy
// for "was in that draw". With the first round worth 0 at every tier, the `points > 0` guard on the
// live write site deleted the only record that HALF OF EVERY DRAW had played – and `season/rival.ts`
// reconstructs a cohort player's tournament strain from exactly those rows, so a rival who lost her
// opener read as having RESTED. She banked `recoveryBase` for a week she spent travelling and
// playing, and the whole field ran systematically fresher than the tennis it had actually played.
//
// This file pins the repair from both ends:
//   R1  the RECORDING rule – every entrant of every draw leaves a row, scoring or not;
//   R2  the CONSEQUENCE   – no rival is ever charged zero strain for a week she played;
//   R3  the SEPARATION    – a scoreless row is invisible to the standings, byte for byte;
//   R4  the AGREEMENT     – pre-history and the live path write the same shape;
//   R5  the COST          – the fix adds no RNG draws, on any stream.
//
// Uniquely named on purpose (two agents once collided add/add on an identically named test file).

import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  createWorld,
  tickWeek,
  skipTournament,
  closeTournament,
  type WorldState,
} from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking, isCountingResult, windowedBestSum, type SeasonResult } from '../src/engine/season/ranking'
import { reconstructRun, rivalCondition, rivalConditions } from '../src/engine/season/rival'
import { ON_RAMP, fillOnRamp, resolveDoubleBookings, selectEntrants } from '../src/engine/season/tournament'
import { generateCohort } from '../src/engine/season/cohort'
import { generatePreHistory } from '../src/engine/season/prehistory'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { matchDrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { fieldProsFor, isFieldProId, mergedWtaRanking, universeForTier } from '../src/engine/season/fieldPros'
import { inTrack, proDoors } from '../src/engine/world/ladder'
import { seasonIndexOf } from '../src/engine/world/ledger'
import type { TierId } from '../src/engine/season/types'
import { firstRoundValue } from './openerValue'

const R = ECONOMY.condition

/** Advance a fresh career `weeks` weeks, committing any spawned kid run in-week (the same
 *  reveal-flow fast-forward the benches use). Returns the world at the end. */
function runWeeks(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** GROUND TRUTH for "who was in a draw in week w", replayed the way the engine picks it:
 *  `selectEntrants` on the event-scoped `seed:aitour:<event.id>` stream, against the kid-free
 *  ranking. Every entrant of a full draw plays at least one match, so entrance IS play. Built on its
 *  own `rngFromSeed` instance, so it can never perturb the career it is watching. */
/** The entrants the engine WILL draw for `week`, rebuilt exactly as `runAiTournaments` does.
 *
 *  ⚠ The fatigue map became load-bearing here (28.07): rivals are now gated on condition the same
 *  way the kid is, so a wrecked player is not in the draw at all. Rebuilding without it silently
 *  produced a DIFFERENT, larger field - which is what this helper's own test caught.
 *
 *  ⚠⚠ AND THE WEEK IS RESOLVED BEFORE IT IS PLAYED (31.07, fix/no-double-booking) - the same lesson
 *  a second time, and it is why this helper is a helper. A rival may no longer appear in two of a
 *  week's draws, so "what the engine draws" is a two-step answer: every event draws its own field on
 *  its own sub-stream exactly as before, and THEN `resolveDoubleBookings` decides the week (the
 *  higher tier keeps her; the loser backfills by standings position). Replaying only the first step
 *  reconstructs a field the engine no longer plays, which is precisely the failure R1 exists to
 *  catch - and did catch. Both steps here, in the tick's own order.
 *
 *  ⚠⚠⚠ AND THE WEEK NOW HAS TWO UNIVERSES (W3-FIELD3, 04.08) - the same lesson a THIRD time, which
 *  is the strongest argument this helper could have for existing. A W-track canonical event draws
 *  from LIVE cohort ∪ derived field pros against the MERGED W standings; the six junior/domestic
 *  rungs still draw from the cohort against the mixed junior fold. Rebuilding a W draw against the
 *  cohort alone reconstructs a field the engine has not played since this wave. */
function entrantsOfWeek(world: WorldState, week: number): Set<string> {
  const ranking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    week,
    BEST_N_BY_TRACK.itf,
    world.cohort.map((p) => p.id),
  )
  const pros = fieldProsFor(world.seed, seasonIndexOf(week), world.cohort.map((p) => p.name))
  const wtaRanking = mergedWtaRanking(
    computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      week,
      BEST_N_BY_TRACK.wta,
      world.cohort.map((p) => p.id),
      inTrack('wta'),
    ),
    pros,
  )
  const tourUniverse = universeForTier('w15', world.cohort, pros)
  const fatigue = rivalConditions(world.results, week)
  const doors = proDoors({ ...world, week }, wtaRanking)
  const drawn = world.season
    .filter((e) => e.week === week)
    .map((event) => ({
      event,
      entrants: selectEntrants(
        event,
        universeForTier(event.tier, world.cohort, pros),
        TIERS[event.tier].track === 'wta' ? wtaRanking : ranking,
        rngFromSeed(`${world.seed}:aitour:${event.id}`),
        fatigue,
      ),
      rng: rngFromSeed(`${world.seed}:aitour:${event.id}`),
    }))
  const out = new Set<string>()
  const fields = resolveDoubleBookings(drawn, world.cohort, ranking, fatigue, {
    universe: tourUniverse,
    ranking: wtaRanking,
  })
  // ⚠ THE HELD SLOTS ARE PART OF THE MIRROR NOW (W3-ONRAMP, 04.08), and they land exactly where the
  // tick puts them: AFTER the week is resolved, strongest rung first, from the players nobody has
  // booked (world.ts `fillWeekOnRamps`). A mirror that omitted them drew a field the tick never
  // played – measured on this fixture, six row-holders the replica had never selected, which is the
  // "ghost" this test is named after arriving from the mirror's side rather than the engine's.
  //
  // ⚠ The stream is the EVENT's own, re-derived here and advanced past `selectEntrants`' draws in the
  // same order the engine advances it, so the on-ramp reads the same numbers.
  const booked = new Set<string>()
  for (const field of fields.values()) for (const p of field) booked.add(p.id)
  const wDrawn = drawn
    .filter((d) => TIERS[d.event.tier].track === 'wta')
    .sort(
      (a, b) =>
        TIER_LADDER.indexOf(b.event.tier) - TIER_LADDER.indexOf(a.event.tier) ||
        (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0),
    )
  for (const d of wDrawn) {
    // advance a fresh stream past the selection draws, exactly as the live rng object stands
    const rng = rngFromSeed(`${world.seed}:aitour:${d.event.id}`)
    selectEntrants(
      d.event,
      universeForTier(d.event.tier, world.cohort, pros),
      wtaRanking,
      rng,
      fatigue,
    )
    const filled = fillOnRamp(
      d.event,
      fields.get(d.event.id) ?? d.entrants,
      wtaRanking,
      rng,
      { pool: world.cohort, ranking, admits: doors.at(d.event.tier), slots: ON_RAMP.slots },
      fatigue,
      booked,
    )
    fields.set(d.event.id, filled)
    for (const p of filled) booked.add(p.id)
  }
  for (const field of fields.values()) {
    // ⚠ LIVE ONLY, and it is the point of the wave rather than a convenience: a field pro plays the
    // bracket and leaves NO ledger row (world.ts `runAiTournament`), so "who holds a row" and "who
    // was in the draw" are the same question only for the live half of the world. The pros' side of
    // the draw is pinned in tests/season/fieldPros.test.ts.
    for (const p of field) if (!isFieldProId(p.id)) out.add(p.id)
  }
  return out
}

/** One ledger row for `id` at `week`, finishing `finish` at `tier`. */
function row(tier: TierId, finish: number, week: number, playerId = 'ai-x'): SeasonResult {
  return { playerId, week, points: TIERS[tier].points[finish], tier }
}

// ---------------------------------------------------------------------------

describe('R1 — every entrant of every draw leaves a row, scoring or not', () => {
  it('the rows written for a week cover the FULL draw of every LIVE-only event that week', () => {
    // The structural form of the claim: `runAiTournament` writes one row per entry in
    // `result.finishes`, and `finishes` is dense over the whole bracket. So the AI rows at a
    // resolved week must number exactly Σ drawSize over that week's events. Under the old guard
    // this was Σ drawSize / 2 – half the field, the half that won at least one match.
    //
    // ⚠ RE-AIMED AT THE LIVE-ONLY RUNGS BY W3-FIELD3 (04.08), AND THE CLAIM IS UNWEAKENED WHERE IT
    // STILL APPLIES. A W-track canonical bracket is now contested by derived professionals who leave
    // NO ledger row – that is the whole design (fieldPros.ts's superseded scope fence: she plays,
    // the tournament does not write her down) – so "Σ drawSize" was never going to be the count of a
    // W event's rows again. What it IS the count of, exactly, is the six junior/domestic rungs, whose
    // universe did not move by one player; measured on this fixture, 264 rows a week became 72 and
    // every one of the 72 is a junior in a junior draw. The W side of the same claim is asserted one
    // test down (row-holders ARE the entrants, live half) and, from the pros' end, in
    // tests/season/fieldPros.test.ts.
    const world = runWeeks('rival-rows-1', 12)
    let checked = 0
    let liveOnlySlots = 0
    for (let w = 1; w <= 12; w++) {
      const events = world.season.filter((e) => e.week === w)
      if (events.length === 0) continue
      const liveOnly = events.filter((e) => TIERS[e.tier].track !== 'wta')
      const expected = liveOnly.reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
      const rows = world.results.filter(
        (r) => r.week === w && r.playerId !== KID_ID && r.tier && TIERS[r.tier].track !== 'wta',
      )
      expect(rows.length).toBe(expected)
      liveOnlySlots += expected
      // ...and a W event never writes MORE rows than it has chairs. It writes fewer – the pros' are
      // missing – but the ceiling is the claim that would break if a pro ever reached the ledger.
      const wSlots = events.filter((e) => TIERS[e.tier].track === 'wta').reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
      const wRows = world.results.filter(
        (r) => r.week === w && r.playerId !== KID_ID && r.tier && TIERS[r.tier].track === 'wta',
      )
      expect(wRows.length).toBeLessThanOrEqual(wSlots)
      expect(wRows.some((r) => isFieldProId(r.playerId))).toBe(false)
      checked++
    }
    expect(checked).toBeGreaterThan(0) // the fixture really did play some weeks
    expect(liveOnlySlots).toBeGreaterThan(0) // ...and they were not all professional weeks
  })

  it('the row-holders ARE the entrants – no ghosts, no omissions', () => {
    const world = createWorld('rival-rows-2')
    const rng = rngFromSeed(world.seed)
    let weeksWithDraws = 0
    for (let i = 0; i < 10; i++) {
      const w = world.week + 1
      const entrants = entrantsOfWeek(world, w)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const holders = new Set(
        world.results.filter((r) => r.week === w && r.playerId !== KID_ID).map((r) => r.playerId),
      )
      if (entrants.size === 0) continue
      weeksWithDraws++
      expect([...holders].sort()).toEqual([...entrants].sort())
    }
    expect(weeksWithDraws).toBeGreaterThan(0)
  })

  it('a scoreless row is written with points 0 and its real tier, so it reconstructs EXACTLY', () => {
    const world = runWeeks('rival-rows-3', 12)
    const scoreless = world.results.filter((r) => r.points === 0 && r.week >= 0)
    expect(scoreless.length).toBeGreaterThan(0)
    for (const r of scoreless) {
      expect(r.tier).toBeDefined()
      const run = reconstructRun(r)
      // A first-round exit: one match at the tier she actually played, never "free", never the
      // cheapest-guess fallback that a tier-less row would fall back to.
      expect(run.tier).toBe(r.tier)
      expect(run.matches).toBe(1)
      expect(run.strain).toBe(matchDrain(r.tier as TierId, undefined))
    }
  })
})

describe('R2 — nobody is charged zero strain for a week she played', () => {
  it('the reconstruction sees strain for EVERY appearance, and the pre-fix reading did not', () => {
    const world = createWorld('rival-strain-1')
    const rng = rngFromSeed(world.seed)
    let appearances = 0
    let blindNow = 0
    let blindBefore = 0
    for (let i = 0; i < 14; i++) {
      const w = world.week + 1
      const entrants = entrantsOfWeek(world, w)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const mine = new Map<string, SeasonResult[]>()
      for (const r of world.results) {
        if (r.week !== w || r.playerId === KID_ID) continue
        const list = mine.get(r.playerId)
        if (list) list.push(r)
        else mine.set(r.playerId, [r])
      }
      for (const id of entrants) {
        appearances++
        const rows = mine.get(id) ?? []
        const now = rows.reduce((s, r) => s + reconstructRun(r).strain, 0)
        // The counterfactual: what the reconstruction saw while the write site guarded on points.
        const before = rows.filter(isCountingResult).reduce((s, r) => s + reconstructRun(r).strain, 0)
        if (now === 0) blindNow++
        if (before === 0) blindBefore++
      }
    }
    expect(appearances).toBeGreaterThan(400) // 436 in year 1, before the age-13 J tiers open
    expect(blindNow).toBe(0)
    // ...and the bias this replaces was not a rounding error: a third to a half of every draw.
    //
    // ⚠ RE-AIMED 0.4 -> 0.3 BY W3-ACT2, AND THE MOVE IS THE HISTORICAL BIAS SHRINKING RATHER THAN
    // THE FIX WEAKENING. `blindNow` is still exactly 0, which is this test's actual subject. What
    // moved is the COUNTERFACTUAL: the four act-3 rungs pay every entrant something (a nominal 1 at
    // 250/500, a real 65/130 at the 1000s and the Slams), so a first-round exit there would have
    // left a row even under the old points-only write site. Fewer of year 1's appearances are
    // therefore invisible to the old rule - measured 0.336 against 0.456 before the wave - and the
    // bound is re-aimed to the number the claim is really making ("this was never a rounding
    // error"), not deleted.
    expect(blindBefore / appearances).toBeGreaterThan(0.3)
  })

  it('the cohort really is tireder than the points-only ledger would have said', () => {
    const world = runWeeks('rival-strain-2', 20)
    const full = rivalConditions(world.results, world.week)
    const pointsOnly = rivalConditions(world.results.filter(isCountingResult), world.week)
    const meanOf = (m: Map<string, number>) =>
      world.cohort.reduce((s, p) => s + (m.get(p.id) ?? R.max), 0) / world.cohort.length
    expect(meanOf(full)).toBeLessThan(meanOf(pointsOnly))
    // Nobody can come out FRESHER for having a record of a week she played.
    for (const p of world.cohort) {
      expect(full.get(p.id) ?? R.max).toBeLessThanOrEqual(pointsOnly.get(p.id) ?? R.max)
    }
  })

  it('one first-round exit costs exactly one score-less match at that tier – the shared drain', () => {
    // The unit form of the whole slice: playing costs, whatever it paid. Read off the engine's own
    // drain family (never a private rival formula), at every tier.
    //
    // ⚠ "WHATEVER IT PAID" GAINED A SECOND VALUE with W2-LADDER: the real chart pays a nominal 1
    // to an opening-round loser from W50 up (tests/wave-b-points.test.ts NOMINAL_ONE_TIERS), so an
    // exit row is scoreless at most rungs and a 1-point row at the chart-1 trio. The DRAIN claim -
    // this test's actual subject - is identical either way, and asserting the split here keeps the
    // fixture honest about what the engine really writes.
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      const exit = row(tier, rounds, 10)
      // ⚠ W3-ACT2's third case, same reason as above - see tests/wave-b-points.test.ts.
      expect(exit.points).toBe(
        firstRoundValue(tier),
      )
      expect(rivalCondition([exit], 'ai-x', 10)).toBe(R.max - matchDrain(tier, undefined))
      // ...and it is strictly worse than the same week spent at home.
      expect(rivalCondition([exit], 'ai-x', 10)).toBeLessThan(rivalCondition([], 'ai-x', 10))
    }
  })
})

describe('R3 — a scoreless appearance is invisible to the standings', () => {
  it('adding scoreless rows changes no points, no rank, and no ORDER', () => {
    const scoring: SeasonResult[] = [
      { playerId: 'a', week: 10, points: 400, tier: 'j30' },
      { playerId: 'b', week: 12, points: 400, tier: 'j30' },
      { playerId: 'c', week: 8, points: 80, tier: 'regional' },
    ]
    // 'a' picks up a later scoreless week than 'b': under a naive ledger read that would flip the
    // recency tie-break between two players level on 400, and with it their entrant percentiles.
    const withBlanks: SeasonResult[] = [
      ...scoring,
      { playerId: 'a', week: 20, points: 0, tier: 'j60' },
      { playerId: 'd', week: 21, points: 0, tier: 'local' },
    ]
    const roster = ['a', 'b', 'c', 'd']
    expect(computeRanking(withBlanks, 30, 6, roster)).toEqual(computeRanking(scoring, 30, 6, roster))
    expect(windowedBestSum(withBlanks, 30, 'a', 6)).toBe(windowedBestSum(scoring, 30, 'a', 6))
    // 'd' has played all season and won nothing: 0 points, last, exactly like a player with no rows.
    const table = computeRanking(withBlanks, 30, 6, roster)
    expect(table.find((r) => r.playerId === 'd')?.points).toBe(0)
  })

  it('scoreless rows never consume a best-6 slot', () => {
    const rows: SeasonResult[] = [
      { playerId: 'a', week: 1, points: 30, tier: 'local' },
      ...Array.from({ length: 8 }, (_, i) => ({ playerId: 'a', week: 2 + i, points: 0, tier: 'j30' as TierId })),
      { playerId: 'a', week: 20, points: 18, tier: 'local' },
    ]
    expect(windowedBestSum(rows, 30, 'a', 6)).toBe(48)
  })

  it('a player seen ONLY in scoreless rows does not appear in a roster-less table', () => {
    const rows: SeasonResult[] = [
      { playerId: 'a', week: 1, points: 30, tier: 'local' },
      { playerId: 'ghost', week: 2, points: 0, tier: 'j30' },
    ]
    expect(computeRanking(rows, 10, 6).map((r) => r.playerId)).toEqual(['a'])
  })
})

describe('R4 — pre-history and the live path now write the same shape', () => {
  it('both produce scoreless rows, and both stamp the tier on them', () => {
    const seed = 'rival-agree'
    const ph = generatePreHistory(seed, generateCohort(seed))
    const phZero = ph.filter((r) => r.points === 0)
    expect(phZero.length).toBeGreaterThan(0)
    for (const r of phZero) expect(r.tier).toBeDefined()

    const world = runWeeks(seed, 12)
    const liveZero = world.results.filter((r) => r.points === 0 && r.week >= 0)
    expect(liveZero.length).toBeGreaterThan(0)
    for (const r of liveZero) expect(r.tier).toBeDefined()
  })

  it('pre-history is unchanged by the fix: the live path is the one that moved', () => {
    // The counts the wave-B write-up measured, re-read from the engine. If this file ever has to
    // change these numbers, `generatePreHistory` moved – which this slice explicitly did not do.
    const expected: Record<string, { total: number; zero: number }> = {
      'fresh-ph': { total: 672, zero: 49 },
      'bench-wealthy-0': { total: 684, zero: 52 },
      counting: { total: 679, zero: 64 },
    }
    for (const [seed, want] of Object.entries(expected)) {
      const rows = generatePreHistory(seed, generateCohort(seed))
      expect(rows.length).toBe(want.total)
      expect(rows.filter((r) => r.points === 0).length).toBe(want.zero)
    }
  })
})

describe('R5 — the fix costs nothing on any RNG stream', () => {
  it('recording an appearance draws no randomness: same seed, same stream, same length', () => {
    // Writing a row is pure bookkeeping AFTER the bracket has resolved. Captured directly rather
    // than inferred: the main stream for a fixture career must be identical to a bare replay of
    // `rngFromSeed(seed)` for the same number of pulls. (The frozen 41550 / e6b0c709 capture that
    // guards the absolute count lives in tests/condition.test.ts B1 and tests/injuries.test.ts.)
    const world = createWorld('rival-rng')
    const raw = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = raw()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 20; i++) tickWeek(world, rng)
    const replay = rngFromSeed('rival-rng')
    const expected = Array.from({ length: draws.length }, () => replay())
    expect(draws).toEqual(expected)
    // ...and the week really did write appearance rows, so the property is not vacuous.
    expect(world.results.some((r) => r.points === 0 && r.week >= 0)).toBe(true)
  })
})
