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
  careerAt,
  fieldProsFor,
  fieldSeasonOf,
  isFieldProId,
  mergedWtaRanking,
  universeForTier,
} from '../../src/engine/season/fieldPros'
import { power } from '../../src/engine/season/cohort'
import { rivalGroundstrokes, rivalConditions } from '../../src/engine/season/rival'
import { ON_RAMP, fillOnRamp, selectEntrants } from '../../src/engine/season/tournament'
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
  proDoors,
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

  // ⚠⚠ RE-AIMED BY W4-LIVES (04.08), AND THE OLD ASSERTION WAS PINNING THE DEFECT.
  //
  // It read: `changed.length` (name or serve differing one season later) `> FIELD.size / 2`, with
  // the comment "Regenerated per season: same ids (the namespace is positional), different people."
  // That was true and it was the bug: docs/specs/world-strength-audit-2026-08.md measured what it
  // cost - 47% of professionals got YOUNGER year on year, 0.00 of 364 ever retired, and over 96
  // measured seasons not one simulated athlete ever held a top-100 chair. The owner's ruling: they
  // must age, they must leave, and somebody may hold the top for several years running.
  //
  // So the property is INVERTED and strengthened rather than dropped: most of the field is the SAME
  // PERSON a season later and is exactly one year older, and a realistic minority has been replaced.
  it('a season passes: the same people, one year older, and a minority replaced', () => {
    const s0 = prosOf(SEED, 0)
    const s1 = prosOf(SEED, 1)
    let stayed = 0
    let replaced = 0
    for (let i = 0; i < s0.length; i++) {
      const before = s0[i]
      const after = s1[i]
      // A chair keeps its id and its storey for ever - that is the world's SHAPE, deliberately held.
      expect(after.id).toBe(before.id)
      expect(after.strengthTier).toBe(before.strengthTier)
      // ⚠ IDENTITY IS THE CAREER INDEX, NOT THE NAME. The name dedupe is order-dependent over the
      // whole field, so a pro can legitimately re-draw her surname when somebody ahead of her in the
      // array is replaced - the cosmetic edge `makeFieldPro` documents. Comparing names here would
      // read that as a different person and this test would be about the dedupe instead.
      if (careerAt(SEED, i, 1).index === careerAt(SEED, i, 0).index) {
        stayed += 1
        // THE RULING, AS AN ASSERTION: "+1 to everyone's age when the season ends".
        expect(after.ageYears, after.id).toBe(before.ageYears + 1)
        // ...and her GAME does not move, only her book – see `careerArc` for why the two are split.
        expect(after.ret).toBe(before.ret)
        expect(after.composure).toBe(before.composure)
        expect(after.stamina).toBe(before.stamina)
        expect(after.potential).toEqual(before.potential)
      } else {
        replaced += 1
        // A newcomer is a debutante, never a mid-career import.
        expect(after.ageYears, after.id).toBeLessThanOrEqual(FIELD.career.debutAge[1])
        expect(after.ageYears, after.id).toBeGreaterThanOrEqual(FIELD.career.debutAge[0])
      }
    }
    // The rate is a tour's, not foam and not a photograph: measured 27.2 of 364 a season over
    // 4 seeds x 24 seasons (bench:world section D). The band is wide because this is ONE season of
    // ONE seed; what it forbids is the two failure modes on either side of it.
    expect(stayed).toBeGreaterThan(FIELD.size * 0.8)
    expect(replaced).toBeGreaterThan(0)
    expect(replaced).toBeLessThan(FIELD.size * 0.2)
  })

  // The other half of the ruling: they LEAVE, and the chair is refilled by somebody new. Walked over
  // a whole career's worth of seasons so a departure is certain rather than likely.
  it('nobody plays for ever: every chair changes hands inside one career span', () => {
    const span = FIELD.career.retireAge[1] - FIELD.career.debutAge[0] + 1
    let handedOver = 0
    for (let i = 0; i < FIELD.size; i++) {
      if (careerAt(SEED, i, span).index > careerAt(SEED, i, 0).index) handedOver += 1
    }
    // A career tops out at retireAge.hi - debutAge.lo seasons, so after that many nobody who was
    // sitting at season 0 can still be there.
    expect(handedOver).toBe(FIELD.size)
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
    // ⚠ THE CHAIR COUNT IS ACCUMULATED WEEK BY WEEK, AND THE OLD ONE WAS BROKEN (W3-ONRAMP, 04.08).
    // It used to be read off `world.season` AFTER the loop – but `ensureSeason` drops resolved weeks
    // (`world.season = world.season.filter((e) => e.week >= world.week)`), so the denominator was
    // ONE week's chairs against thirty weeks of rows. It passed only because the numerator was zero,
    // which is exactly the closed loop this wave came to fix; the moment a LIVE row existed the
    // comparison read 178 rows against 64 chairs. Counted here as the weeks go by, it is the number
    // the sentence always meant.
    let wSlots = 0
    for (let w = 0; w < 30; w++) {
      for (const e of world.season) {
        if (e.week === world.week + 1 && TIERS[e.tier].track === 'wta') wSlots += TIERS[e.tier].drawSize
      }
      tickWeek(world, rng)
    }
    // Thirty weeks of canonical brackets on every rung, W rungs included: the ledger holds
    // thousands of rows and not one belongs to a derived player.
    //
    // ⚠ THE REASON THIS HOLDS CHANGED UNDER IT, WHICH MAKES IT THE MOST LOAD-BEARING GUARD IN THE
    // FILE (W3-FIELD3, 04.08). It used to hold trivially – a pro was never in a canonical draw at
    // all, so she could not write a row from one. She is in them now, on every W rung, and the rule
    // survives because `runAiTournament` skips the ledger row for an `fp-` id instead. So this
    // assertion stopped being a restatement of the scope fence and became the ONE mechanical check
    // that derived players never reach persisted state – delete the skip and this line, and only
    // this line, catches it. See the superseded fence on `universeForTier` for why the two facts
    // ("in the draw", "leaves a row") were separated rather than kept together.
    expect(world.results.length).toBeGreaterThan(1000)
    expect(world.results.some((r) => isFieldProId(r.playerId))).toBe(false)
    expect(world.cohort.some((p) => isFieldProId(p.id))).toBe(false)
    // ...and she really was IN the draws, or the assertion above would be vacuous again. A W event's
    // ledger rows are strictly fewer than its chairs, because the missing ones are the professionals'.
    const wRows = world.results.filter((r) => r.tier !== undefined && TIERS[r.tier].track === 'wta' && r.week >= 0)
    expect(wSlots).toBeGreaterThan(0)
    expect(wRows.length).toBeLessThan(wSlots)
  })
})

// =================================================================================================
// W3-FIELD3 (04.08) – THE CANONICAL BRACKETS. The two acceptance criteria of the wave that moved
// fieldPros.ts's scope fence, pinned from the outside: a W event of the real weekly tick is played
// by professionals, and the world can say the name of one who wins.
// =================================================================================================
describe('the canonical W brackets are played by professionals', () => {
  /** The canonical draw the tick WILL make for `event`, rebuilt exactly as `drawAiEntrants` does:
   *  the merged universe, the kid-free merged W standings, the event's own `seed:aitour:` stream.
   *  A mirror rather than an observation, because the canonical field is never stored – the same
   *  shape `entrantsOfWeek` has in tests/rival-fatigue.test.ts, and for the same reason. */
  function canonicalDraw(world: ReturnType<typeof createWorld>, event: SeasonEvent) {
    const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
    const ranking = mergedWtaRanking(
      computeRanking(
        world.results.filter((r) => r.playerId !== KID_ID),
        world.week,
        BEST_N_BY_TRACK.wta,
        world.cohort.map((p) => p.id),
        inTrack('wta'),
      ),
      pros,
    )
    const fatigue = rivalConditions(world.results, world.week)
    const rng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
    const drawn = selectEntrants(
      event,
      universeForTier(event.tier, world.cohort, pros),
      ranking,
      rng,
      fatigue,
    )
    if (TIERS[event.tier].track !== 'wta') return drawn
    // ⚠ AND THE HELD SLOTS, or this stops being a mirror (W3-ONRAMP, 04.08). The tick fills them
    // AFTER the week is resolved, from the players nobody has booked (world.ts `fillWeekOnRamps`);
    // this is a single-event mirror, so the only booked players are the draw's own.
    return fillOnRamp(
      event,
      drawn,
      ranking,
      rng,
      {
        pool: world.cohort,
        ranking: computeRanking(
          world.results.filter((r) => r.playerId !== KID_ID),
          world.week,
          BEST_N_BY_TRACK.itf,
          world.cohort.map((p) => p.id),
        ),
        admits: proDoors(world, ranking).at(event.tier),
        slots: ON_RAMP.slots,
      },
      fatigue,
      new Set(drawn.map((p) => p.id)),
    )
  }

  it('a W draw of the live tick is professionals, and every one of them clears the age gate', () => {
    const world = createWorld('canonical-w-field')
    const rng = rngFromSeed(world.seed)
    let checked = 0
    for (let w = 0; w < 30; w++) {
      const upcoming = world.season.filter((e) => e.week === world.week + 1 && TIERS[e.tier].track === 'wta')
      tickWeek(world, rng)
      if (world.pendingTournament) world.pendingTournament = null
      for (const event of upcoming) {
        const drawn = canonicalDraw(world, event)
        expect(drawn.length, event.id).toBe(TIERS[event.tier].drawSize)
        // THE POINT OF THE WAVE. Before it, this number was 0 on every W event ever run.
        expect(drawn.filter((p) => isFieldProId(p.id)).length, event.id).toBeGreaterThan(0)
        // ...and the gates the fence was protecting are the SAME gates, applied to more people: no
        // entrant of a professional draw is under the rung's own minimum age. This is the assertion
        // tools/big-draw-cost.ts measures the counterfactual of at 64 and 128.
        const min = TIERS[event.tier].minAgeYears ?? 0
        for (const p of drawn) expect(p.ageYears, `${event.id} ${p.id}`).toBeGreaterThanOrEqual(min)
        checked++
      }
    }
    expect(checked, 'the fixture really did schedule W events').toBeGreaterThan(0)
  })

  it('a W-tour champion can be a professional, and the news says her name', () => {
    // W100 and up make the news (world.ts `NEWSWORTHY_FROM` – a feed-budget cut, not a taste one),
    // and their cadence is 13 weeks / seeded anchors, so a career has to run a while to collect one.
    const world = createWorld('canonical-w-news')
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < 60; w++) {
      tickWeek(world, rng)
      if (world.pendingTournament) world.pendingTournament = null
    }
    const titles = world.events.filter((e) => e.text.includes('won the'))
    expect(titles.length, 'the W tour reported some champions').toBeGreaterThan(0)
    // Every name printed is a real person's, never a raw `fp-<n>` leaking onto a surface.
    for (const t of titles) expect(t.text).not.toContain(FIELD.idPrefix)
    // ...and at least one of them is a professional's, which is the criterion in one line: before
    // this wave no canonical W draw contained a pro, so no W-tour news line could ever name one.
    const proNames = new Set(
      fieldProsFor(world.seed, 0, world.cohort.map((p) => p.name))
        .concat(fieldProsFor(world.seed, 1, world.cohort.map((p) => p.name)))
        .map((p) => p.name.split(' ').slice(-1)[0]),
    )
    expect(titles.some((t) => [...proNames].some((n) => t.text.includes(n)))).toBe(true)
  })

  it('the ledger stays LIVE-sized: a W event writes fewer rows than it has chairs, and no fp row', () => {
    // The persisted-state half of the shape, measured rather than asserted structurally. A pro in a
    // canonical draw costs ZERO bytes: she plays, and the tournament does not write her down.
    const world = createWorld('canonical-w-ledger')
    const rng = rngFromSeed(world.seed)
    // The chairs, counted as the calendar reveals them – see the sibling case above for why reading
    // `world.season` after the loop is a one-week denominator wearing a career's clothes.
    let wChairs = 0
    for (let w = 0; w < 40; w++) {
      for (const e of world.season) {
        if (e.week === world.week + 1 && TIERS[e.tier].track === 'wta') wChairs += TIERS[e.tier].drawSize
      }
      tickWeek(world, rng)
      if (world.pendingTournament) world.pendingTournament = null
    }
    const wRows = world.results.filter((r) => r.tier !== undefined && TIERS[r.tier].track === 'wta')
    expect(wRows.some((r) => isFieldProId(r.playerId))).toBe(false)
    // The professionals absorb MOST of the W calendar: a LIVE player with no W points sits below all
    // 364 of them in the merged table, so the direct acceptances are professional through and
    // through. What she gets instead is the held slots.
    //
    // ⚠⚠ RE-AIMED 0 -> (0, chairs) BY W3-ONRAMP (04.08), AND THE OLD NUMBER WAS THE BUG. This line
    // read `.toBe(0)` and said so as a FACT rather than a target, with the closed-loop note in
    // tests/rivals.test.ts C2 spelling out why it was a defect waiting for a wave: a cohort player
    // could not be drawn into a W event, so she could not earn a W point, so she could never rise
    // out of the position that kept her out of the draw. The kid was the only player in the world
    // who would ever hold a W point. The on-ramp opens the same door the kid has always had
    // (`tierFloorOpen`'s W arm, now asked of a cohort id through `proDoors`), and the assertion
    // becomes the two-sided one the design actually wants:
    //
    //   * NOT ZERO – the loop is open, cohort players are on the professional ladder;
    //   * STILL BELOW THE CHAIRS – the pros still fill the great majority of every draw, and no
    //     `fp-` id ever reaches the ledger (asserted one line up, unweakened).
    //
    // Measured, 4 worlds x 12 seasons, tools/w-onramp-probe.ts: 0.0 -> 119.8 LIVE W rows a season
    // (0.60 per cohort player), against ~3,170 the week before W3-FIELD3 – i.e. the world moves
    // again without the professional tour going back to being played by children.
    const liveW = wRows.filter((r) => r.playerId !== KID_ID)
    expect(liveW.length).toBeGreaterThan(0)
    expect(wChairs).toBeGreaterThan(0)
    expect(liveW.length).toBeLessThan(wChairs / 2)
  })
})
