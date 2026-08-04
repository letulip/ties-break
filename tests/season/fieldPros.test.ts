// THE FIELD TIER'S GUARDS (living-field phase W, 01.08). What this suite pins, in order of what it
// would cost to lose:
//
//   1. the field is a PURE DERIVATION – deterministic per (seed, season), season-varying, never in
//      the save's populations (world.cohort, world.results stay fp-free through live ticks);
//   2. the merged W table is a real ranking – strictly ordered, every LIVE points-holder exactly
//      once, competition rank numbers;
//   3. the calibration – the honest-rank promise ("five W15 titles is not #9"), the merged table's
//      points-to-rank curve against the REAL WTA anchors (W2-FIELD2's pacing requirement), and the
//      acceptance cuts at the grown field size;
//   4. the scope fence – W rungs draw from cohort ∪ field, every other rung provably from the
//      cohort alone (phase 2 owns the J/domestic side).
//
// The frozen MAIN capture (41550 / e6b0c709) is NOT re-proved here – five suites already re-derive
// it from the live engine (tests/condition.test.ts B1 above all), and they ran green with the
// merged table live, which is the strongest form of the claim.

import { describe, it, expect } from 'vitest'
import {
  FIELD,
  fieldProsFor,
  fieldSeasonOf,
  isFieldProId,
  mergedWtaRanking,
  universeForTier,
} from '../../src/engine/season/fieldPros'
import { power } from '../../src/engine/season/cohort'
import { rivalGroundstrokes, rivalConditions } from '../../src/engine/season/rival'
import { selectEntrants } from '../../src/engine/season/tournament'
import { BEST_N_BY_TRACK, computeRanking } from '../../src/engine/season/ranking'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'
import {
  createWorld,
  tickWeek,
  recomputeKidRank,
  acceptanceRank,
  seasonIndexOf,
  inTrack,
  KID_ID,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'

const SEED = 'field-guards'

function prosOf(seed = SEED, season = 0, taken: readonly string[] = []) {
  return fieldProsFor(seed, season, taken)
}

describe('the field is a pure derivation', () => {
  it('same (seed, season, taken names) – identical set, twice over', () => {
    const a = prosOf()
    const b = prosOf()
    // The memo hands back the same instance; a cold re-derivation must match it byte for byte.
    expect(b).toEqual(a)
    const cold = fieldProsFor(SEED, 1, [])
    const again = fieldProsFor(SEED, 0, [])
    expect(again).toEqual(a)
    expect(cold).not.toEqual(a)
  })

  it('the season index turns the field over – natural turnover, nothing stored', () => {
    const s0 = prosOf(SEED, 0)
    const s1 = prosOf(SEED, 1)
    // Regenerated per season: same ids (the namespace is positional), different people.
    const changed = s0.filter((p, i) => p.name !== s1[i].name || p.serve !== s1[i].serve)
    expect(changed.length).toBeGreaterThan(FIELD.size / 2)
  })

  it('the season arithmetic is the world\'s own seasonIndexOf – the two may never disagree', () => {
    for (const week of [0, 1, 51, 52, 103, 104, 519]) {
      expect(fieldSeasonOf(week)).toBe(seasonIndexOf(week))
    }
  })

  it('shape: FIELD.size pros, fp- ids disjoint from every live id, professional ages, the pyramid', () => {
    const world = createWorld(SEED)
    const pros = prosOf(SEED, 0, world.cohort.map((p) => p.name))
    expect(pros.length).toBe(FIELD.size)
    const liveIds = new Set([...world.cohort.map((p) => p.id), KID_ID])
    for (const p of pros) {
      expect(isFieldProId(p.id)).toBe(true)
      expect(liveIds.has(p.id)).toBe(false)
      expect(p.ageYears).toBeGreaterThanOrEqual(FIELD.ageBand[0])
      expect(p.ageYears).toBeLessThanOrEqual(FIELD.ageBand[1])
      expect(p.wtaPoints).toBeGreaterThanOrEqual(1)
      // Stored = derived: the fifth attribute agrees with the engine's own derivation for her id.
      expect(p.groundstrokes).toBe(rivalGroundstrokes(p))
    }
    // The pyramid holds where the brief needs it to: the elite storey's MEAN core sits in the
    // 60-70 band, clearly above the reference strong junior (power 56.75). The lower storeys'
    // bands are calibration constants pinned by the bench, not here – see FIELD's table comment
    // for why they moved off the first draft.
    const elites = pros.filter((p) => p.strengthTier === 'elite')
    const eliteMean = elites.reduce((s, p) => s + power(p), 0) / elites.length
    expect(eliteMean).toBeGreaterThanOrEqual(60)
    expect(eliteMean).toBeLessThanOrEqual(70)
  })

  // ⚠ THE FOURTH STOREY (W2-FIELD2, act2-pro-tour.md §8.1). Three claims, and each is the answer to
  // a way the storey could be built and be useless.
  it('the fourth storey is a head, not a taller middle: strictly above elite, top-heavy, world-scale', () => {
    const world = createWorld(SEED)
    const pros = prosOf(SEED, 0, world.cohort.map((p) => p.name))
    const top = pros.filter((p) => p.strengthTier === 'tourElite')
    expect(top.length).toBe(64)
    // 1. STRICTLY ABOVE the storey below, in SKILL – the band [67, 77] cannot overlap elite's
    //    [56, 66], so the weakest tourElite still out-cores the strongest elite. Measured with the
    //    ±6 attribute spread live, so this is the property after the shape is dealt, not before.
    const elites = pros.filter((p) => p.strengthTier === 'elite')
    const meanCore = (xs: typeof pros) => xs.reduce((s, p) => s + power(p), 0) / xs.length
    expect(meanCore(top)).toBeGreaterThan(meanCore(elites) + 8)
    // 2. TOP-HEAVY, which is what the storey's gamma buys: one or two genuine world-#1-scale names exist and
    //    the MEDIAN of the storey does not. Without this the storey is 64 co-#1s and the table's
    //    head reads like a spreadsheet.
    const pts = top.map((p) => p.wtaPoints).sort((a, b) => b - a)
    const median = pts[Math.floor(pts.length / 2)]
    expect(pts[0]).toBeGreaterThan(8000)
    expect(median).toBeLessThan(pts[0] / 3)
    // ...and the CURVE below it is the real one's, which is the pacing requirement's own test: the
    // table must not go flat under her. Anchors from the real WTA rows, ±40% (the bench prints the
    // exact fit; this pin is the shape, not the decimals).
    const merged = mergedWtaRanking([], pros)
    const near = (rank: number, real: number) => {
      const got = merged[rank - 1].points
      expect(got, `#${rank} holds ${got}, real ~${real}`).toBeGreaterThan(real * 0.6)
      expect(got, `#${rank} holds ${got}, real ~${real}`).toBeLessThan(real * 1.4)
    }
    near(50, 1400)
    near(100, 850)
    near(150, 520)
    near(300, 190)
    // The HEAD is a 1-in-64 order statistic over a gamma-6.5 band, so it is genuinely seed-noisy
    // (measured #10 across four seeds: 4067 / 4308 / 5033 / 6244 against a real ~4000) and gets a
    // wide band rather than a false precision. The rows below #50 are what the pacing rests on and
    // they are stable to a few percent: #50 1249-1340, #100 822-869, #300 184-194.
    expect(merged[9].points).toBeGreaterThan(2500)
    expect(merged[9].points).toBeLessThan(7500)
    // 3. WORLD-SCALE, and the seam with the storey below is CONTINUOUS rather than a cliff: the
    //    weakest tourElite lands near the strongest elite, so the standings do not fall off a
    //    ledge at #64. (Points are not strictly monotone across the seam – the age ramp is allowed
    //    to blur it, exactly as FIELD's table says.)
    const bestElite = Math.max(...elites.map((p) => p.wtaPoints))
    expect(Math.min(...pts)).toBeGreaterThan(bestElite / 2)
  })

  it('names dedupe against the live cohort and within the field', () => {
    const world = createWorld(SEED)
    const cohortNames = world.cohort.map((p) => p.name)
    const pros = prosOf(SEED, 0, cohortNames)
    const live = new Set(cohortNames)
    // No new collision with a girl the player already knows. (The cohort's own internal duplicate
    // – two persisted "Uma Tamm" – is not ours to fix and not touched.)
    for (const p of pros) expect(live.has(p.name), p.name).toBe(false)
    // ...and the field itself reads as distinct people, to the limit the salted re-draws promise.
    const seen = new Set(pros.map((p) => p.name))
    expect(seen.size).toBe(pros.length)
  })
})

describe('the merged W table is a real ranking', () => {
  it('strictly ordered, every LIVE points-holder exactly once, competition ranks', () => {
    const world = createWorld(SEED)
    // A live table with some earned W rows: a few cohort girls and the kid hold points.
    const results = [
      { playerId: world.cohort[3].id, week: 0, points: 20, tier: 'w35' as const },
      { playerId: world.cohort[7].id, week: 0, points: 10, tier: 'w15' as const },
      { playerId: KID_ID, week: 0, points: 50, tier: 'w15' as const },
    ]
    const live = computeRanking(results, 0, BEST_N_BY_TRACK.wta, [...world.cohort.map((p) => p.id), KID_ID], inTrack('wta'))
    const pros = prosOf(SEED, 0, world.cohort.map((p) => p.name))
    const merged = mergedWtaRanking(live, pros)

    expect(merged.length).toBe(live.length + pros.length)
    // Points never rise going down the table, and rank numbers are the competition convention:
    // rank = index of the first row holding those points, +1.
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].points).toBeLessThanOrEqual(merged[i - 1].points)
      if (merged[i].points === merged[i - 1].points) expect(merged[i].rank).toBe(merged[i - 1].rank)
      else expect(merged[i].rank).toBe(i + 1)
    }
    // Every LIVE points-holder exactly once, kid included – and every id exactly once, full stop.
    const ids = merged.map((r) => r.playerId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of live) expect(ids).toContain(r.playerId)
    // Earned beats derived on a tie: the cohort girl on 20 sorts above every 20-point pro.
    const cohortAt20 = merged.findIndex((r) => r.playerId === world.cohort[3].id)
    const firstProAt20 = merged.findIndex((r) => r.points === 20 && isFieldProId(r.playerId))
    if (firstProAt20 >= 0) expect(cohortAt20).toBeLessThan(firstProAt20)
  })
})

describe('the calibration pins (bench: tools/field-quality.ts, 01.08)', () => {
  it('five W15 titles is a two-figure rank behind a real head – the honest-rank promise', () => {
    // Measured at the phase-W calibration: 51 pros above 50 pts, and the 50-point girl landed #52
    // of 500. The pin was the RANGE the architecture promises (#40-80), so a constants re-tune
    // inside the promise would not shuffle this file – but #9, the number this slice exists to
    // kill, could never come back.
    //
    // ⚠⚠ RE-AIMED #40-80 -> #300-420 BY W2-FIELD2's POINTS LIFT, AND IT IS THE PACING REQUIREMENT
    // RATHER THAN A WEAKENING (the owner, via the architect: «the climb must take roughly as long
    // as it does in life, not 1-2 seasons»). Five W15 titles is 50 WTA points, and 50 real points is
    // past #600 in the world. The old #40-80 was only reachable because the field held NOBODY in the
    // middle: the pre-wave table's #300 held 9 points and its #500 held 0, so any real result
    // teleported her up it. That flatness IS the "top of the world in two seasons" defect, seen from
    // her side of the table, and the whole distribution was lifted to the real curve's anchors to
    // remove it (FIELD's table carries the achieved fit).
    //
    // WHAT THE PIN DEFENDS IS UNCHANGED and is now much harder to lose: the number this test exists
    // to kill is "#9" - five titles at the ENTRY RUNG of the professional game printing a top-ten
    // world ranking. The floor at 300 kills it with three hundred places to spare; the ceiling at
    // 420 catches the opposite failure, a field so heavy that a real result moves nothing at all.
    // Measured: 364 of 364 pros hold more than 50 W points, and she lands #365 of 564.
    const world = createWorld('field-cal-pin')
    for (let i = 0; i < 5; i++) {
      world.results.push({ playerId: KID_ID, week: world.week, points: 10, tier: 'w15' })
    }
    recomputeKidRank(world)
    expect(world.kidRankWta).toBeGreaterThanOrEqual(300)
    expect(world.kidRankWta).toBeLessThanOrEqual(420)
  })

  it('acceptance cuts: an absolute rank on the W rungs, a share of the live table elsewhere', () => {
    // ⚠⚠ RE-AIMED BY W2-FIELD2, AND THE RE-AIM IS THE FIX IT PINS. This asserted that a W rung's cut
    // is `enterPct` x the merged table's size - a SHARE - which was the right unit for as long as
    // that table was a compressed artefact. Once the table carried the real points-to-rank curve the
    // share bit in real ranks: W35's 0.5 resolved to ~219 W points while a perfect best-16 window of
    // W15 TITLES caps at 160, so the second rung of the ladder was unreachable from the first (six
    // careers x nine seasons, tools/ladder-walk.ts: best rank ever reached #449-468 against a cut of
    // 282 - not one of them would have cleared W35 in its life). The W rungs now carry the real
    // tour's own cuts, and this pins the UNITS rather than the numbers.
    const world = createWorld('field-cal-pin')
    // The W rungs: an absolute rank, straight off the tier definition, INDEPENDENT of how many
    // players happen to exist - which is the property that broke when it was a share.
    for (const tier of ['w35', 'w50', 'w75', 'w100', 'wta125'] as TierId[]) {
      expect(acceptanceRank(world, tier)).toBe(TIERS[tier].acceptsRank)
      expect(TIERS[tier].enterPct, `${tier} must not carry both units`).toBeUndefined()
    }
    // ...and they still TIGHTEN up the ladder, which is the one thing a ladder must do.
    const cuts = (['w35', 'w50', 'w75', 'w100', 'wta125'] as TierId[]).map((t) => TIERS[t].acceptsRank!)
    for (let i = 1; i < cuts.length; i++) expect(cuts[i]).toBeLessThan(cuts[i - 1])
    // W15 is the on-ramp: no list at all, because a rank gate on the first rung of a table is a
    // closed loop. It reads her ITF junior points instead.
    expect(acceptanceRank(world, 'w15')).toBeUndefined()
    // The ITF rungs' lists did not move by a single place – their table IS a population artefact
    // (199 juniors, no external anchor), so a share is still the honest unit there.
    expect(acceptanceRank(world, 'j60')).toBe(Math.round(TIERS.j60.enterPct! * (world.cohort.length + 1)))
    expect(acceptanceRank(world, 'j300')).toBe(Math.round(TIERS.j300.enterPct! * (world.cohort.length + 1)))
  })
})

describe('the scope fence – phase W is the W track and nothing else', () => {
  const NON_W: TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']

  it('universeForTier: the six non-W rungs get the cohort BY REFERENCE; the W rungs get the union', () => {
    const world = createWorld(SEED)
    const pros = prosOf(SEED, 0, world.cohort.map((p) => p.name))
    for (const tier of NON_W) {
      // Reference equality, not just equal membership: nothing was even copied for these rungs.
      expect(universeForTier(tier, world.cohort, pros)).toBe(world.cohort)
    }
    // ⚠ TEN W RUNGS SINCE W3-ACT2 - the fence is per TRACK, so the act-3 rungs inherited it exactly
    // as the W2-LADDER ones did, and the arithmetic below still proves the fence covers the whole
    // catalogue rather than merely the rungs somebody remembered to list.
    const W: TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']
    for (const tier of W) {
      const u = universeForTier(tier, world.cohort, pros)
      expect(u.length).toBe(world.cohort.length + pros.length)
    }
    expect(TIER_LADDER.length).toBe(NON_W.length + W.length) // the fence covers the whole catalogue
  })

  it('selectEntrants over the phase-W universe: every non-W draw is fp-free, a W15 draw is not', () => {
    const world = createWorld(SEED)
    const pros = prosOf(SEED, 0, world.cohort.map((p) => p.name))
    const fatigue = rivalConditions(world.results, world.week)
    const mixed = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.itf,
      world.cohort.map((p) => p.id),
    )
    const wtaLive = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      world.cohort.map((p) => p.id),
      inTrack('wta'),
    )
    const merged = mergedWtaRanking(wtaLive, pros)
    const eventFor = (tier: TierId): SeasonEvent => ({
      id: `probe-${tier}`,
      week: 4,
      tier,
      surface: 'hard',
      travelCostCents: 0,
      deadlineWeek: 2,
    })
    for (const tier of NON_W) {
      const entrants = selectEntrants(
        eventFor(tier),
        universeForTier(tier, world.cohort, pros),
        mixed,
        rngFromSeed(`${SEED}:probe:${tier}`),
        fatigue,
      )
      expect(entrants.some((p) => isFieldProId(p.id)), tier).toBe(false)
    }
    const w15 = selectEntrants(
      eventFor('w15'),
      universeForTier('w15', world.cohort, pros),
      merged,
      rngFromSeed(`${SEED}:probe:w15`),
      fatigue,
    )
    // The point of the slice: a W15 field is made of professionals now. (At a fresh world the
    // whole entrant window is pros – LIVE girls only reach it by earning W points.)
    expect(w15.filter((p) => isFieldProId(p.id)).length).toBeGreaterThan(16)
  })

  it('a live career never writes a field pro into the save: results and cohort stay fp-free', () => {
    const world = createWorld('field-fence-live')
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < 30; w++) tickWeek(world, rng)
    // Thirty weeks of canonical brackets on every rung, W rungs included: the ledger holds
    // thousands of rows and not one belongs to a derived player – field pros play only in HER
    // shadow draws, which award nothing to anyone but her.
    expect(world.results.length).toBeGreaterThan(1000)
    expect(world.results.some((r) => isFieldProId(r.playerId))).toBe(false)
    expect(world.cohort.some((p) => isFieldProId(p.id))).toBe(false)
  })
})
