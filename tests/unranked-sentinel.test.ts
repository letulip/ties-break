// THE UNRANKED SENTINEL, AND THE TABLE IT IS DENOMINATED IN (probe/world-strength, 04.08 –
// docs/specs/world-strength-audit-2026-08.md §6).
//
// THE BUG. Three ranking tables are folded from one ledger. Two of them – domestic and ITF – are the
// 199-strong cohort plus the kid, so `world.cohort.length + 1` was the right "she is below the whole
// field" sentinel and was spelled out by hand at every site that wanted one. The W table stopped
// being that shape when living-field phase W merged 364 derived professionals into it: it is 564
// rows. Every `?? world.cohort.length + 1` on the W side therefore read a girl with NO professional
// ranking at all as world #200 – which clears the acceptance cuts of W35 (#700), W50 (#550), W75
// (#450), W100 (#350), a WTA 125 (#250) and a WTA 250 (#200), and is worth a top-200 professional's
// brand valuation in `reviewSponsors`.
//
// It is the same "two currencies, no exchange rate" error this codebase has already removed twice,
// arriving through a default rather than through an addition, and `sponsors.ts` states the intended
// rule in its own comment – "a career that has never held a point in a table sits below the whole
// field rather than at the top of an empty one" – so the fix is the code being made to agree with
// itself. `world/mandatory.ts` had it right all along by refusing outright
// (`?? Number.MAX_SAFE_INTEGER`); the bottom of the table is used here instead only because two of
// these three surfaces have to print the number.
//
// ⚠ CONSERVATIVE BY CONSTRUCTION: the sentinel can only ever get BIGGER, so the fix can refuse where
// the old value admitted and never the reverse.
import { describe, expect, it } from 'vitest'
import {
  KID_ID,
  createWorld,
  recomputeKidRank,
  tableSize,
  hasOutgrown,
  tierFloorOpen,
  tierOpenFor,
  tickWeek,
  kidAgeYears,
  type WorldState,
} from '../src/engine/world'
import { kidPoints, rankIn, rankingFor } from '../src/engine/world/ladder'
import { FIELD } from '../src/engine/season/fieldPros'
import { TIERS } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import { engineModuleSource } from './worldSource'

describe('the unranked sentinel is denominated in the table it is a rank in', () => {
  it('the W table is the cohort PLUS the derived field; the other two are not', () => {
    const world = createWorld('sentinel-size')
    const live = world.cohort.length + 1
    expect(tableSize(world, 'domestic')).toBe(live)
    expect(tableSize(world, 'itf')).toBe(live)
    expect(tableSize(world, 'wta')).toBe(live + FIELD.size)
    // ...and it is the real table's real length, not an arithmetic guess beside it.
    expect(tableSize(world, 'wta')).toBe(rankingFor(world, 'wta').length)
    expect(tableSize(world, 'itf')).toBe(rankingFor(world, 'itf').length)
  })

  it('⚠ a missing W cache REFUSES a rung it used to clear', () => {
    // The state the fix is about: she holds a professional point (so the `kidPoints > 0` half of the
    // gate passes) but the rank cache is absent – exactly the shape `latchOnRamps`' own defensive
    // branch exists for ("a later step may never assume an earlier one's post-condition").
    const world = createWorld('sentinel-refuse')
    world.results.push({ playerId: KID_ID, week: world.week, points: 10, tier: 'w15' })
    recomputeKidRank(world)
    world.onRampCleared = { itf: true, wta: true }
    delete (world as Partial<WorldState>).kidRankWta
    // W100 accepts to its own cut. The old sentinel was 200 – inside the cut – so an unranked girl
    // walked in. The table she is unranked IN is far deeper than the cut, which is what refuses her.
    // ⚠ RE-AIMED BY P3 (16.08): the literal was 350 and the sourced chain took `w100.acceptsRank` to
    // 240 (docs/specs/acceptance-cuts-corrected-2026-08.md). The pin is re-aimed rather than deleted
    // and it is STRENGTHENED in the process: what this test needs is "the cut is inside the table",
    // which is the property the sentinel bug violated, and a hardcoded 350 asserted the ladder's
    // tuning instead – a number this file has no opinion about and which moved under it. The
    // inequality below is the real precondition, so it now survives the next chain change too.
    expect(TIERS.w100.acceptsRank).toBeDefined()
    expect(tableSize(world, 'wta')).toBeGreaterThan(TIERS.w100.acceptsRank!)
    expect(tierFloorOpen(world, 'w100')).toBe(false)
    // ...and the number a screen would print is the bottom of the W table, not the cohort's.
    expect(rankIn(world, 'wta')).toBe(tableSize(world, 'wta'))
    expect(rankIn(world, 'wta')).toBeGreaterThan(world.cohort.length + 1)
  })

  it('has exactly ONE derivation – no W-side site re-spells the cohort-sized default', () => {
    // A hygiene pin in the spirit of tests/pin-hygiene.test.ts: the third site (`reviewSponsors`)
    // has no cheap behavioural handle, and the defect was three copies of one expression drifting
    // apart. `tableSize` is the one derivation; nothing under src/engine/world may hand-roll it.
    // ⚠ COMMENTS ARE STRIPPED FIRST, and that is not tidiness: the fix's own doc comment quotes the
    // banned expression to explain it, and a raw `toContain` over the file would fail on the
    // explanation of the thing it is banning.
    const code = engineModuleSource('world')
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
      })
      .join('\n')
    expect(code).not.toContain('?? world.cohort.length + 1')
    expect(code).not.toContain('?? save.cohort.length + 1')
  })

  it('changes nothing on a world whose cache is present – which is every real one', () => {
    const world = createWorld('sentinel-neutral')
    world.results.push({ playerId: KID_ID, week: world.week, points: 10, tier: 'w15' })
    recomputeKidRank(world)
    // The one writer runs on every tick and every load, and the kid is always in her own roster, so
    // the sentinel is unreachable in play. That is the point: it is a landmine, not a live bug.
    expect(world.kidRankWta).toBeDefined()
    expect(rankIn(world, 'wta')).toBe(world.kidRankWta)
  })
})

// =================================================================================================
// ⚠⚠ THE FINDING THIS BRANCH REPORTS AND DELIBERATELY DOES NOT FIX (§4 of the audit). Pinned as a
// CHARACTERISATION – it records what the engine does today so that the owner's ruling, when it
// lands, has to walk past this comment. It is NOT an endorsement: the balance call is his.
// =================================================================================================

describe('⚠ the acceptance cuts against a truncated table (characterisation, not an invariant)', () => {
  /** A live mid-career world at `age`, with the ITF on-ramp latched and a synthetic W book.
   *
   *  ⚠ RE-AIMED, NOT WEAKENED (one-clock ruling, 09.08): it ticked until `ageAtWeek` reached `age`,
   *  which is now the coach market's restocking clock and not her. Every rung it then asks about gates
   *  on HER age, so a June default profile arrived at week 156 aged sixteen and W75 refused her - the
   *  helper's own contract («a world AT `age`») had quietly stopped being true. It ticks to her real
   *  age now, which costs the fixture a few more weeks and not one assertion. */
  function worldAt(seed: string, age: number, book: number): WorldState {
    const world = createWorld(seed)
    const rng = resumeMain(world.rngMain)
    while (kidAgeYears(world.week, world.profile.birthMonth) < age) tickWeek(world, rng)
    if (book > 0) world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
    world.onRampCleared = { itf: true, wta: true }
    // ⚠ RE-AIMED, NOT WEAKENED (P1, docs/specs/junior-access-2026-08.md). A SECOND, ORTHOGONAL gate
    // now stands in front of the W rungs for a JUNIOR – the Junior Accelerator – and at seventeen
    // this fixture's girl is one. Without a banked year-end junior standing she has no Accelerator
    // places at all, W35 and up are shut whatever her professional book says, and every stage of the
    // slide below would read `['w15']` for a reason that has nothing to do with the acceptance cuts
    // this file is about. Banking a year-end junior #1 puts her past that gate so the CUTS are what
    // the fixture measures, exactly as `onRampCleared` above puts her past the on-ramp latch. The new
    // gate has its own suite (tests/junior-access.test.ts); this one is not it.
    world.seasonHistory = [
      {
        seasonIndex: 0,
        endRank: 1,
        points: 0,
        wins: 0,
        losses: 0,
        byTrack: {
          domestic: { points: 0, wins: 0, losses: 0 },
          itf: { endRank: 1, points: 0, wins: 0, losses: 0 },
          wta: { points: 0, wins: 0, losses: 0 },
        },
        fundsDeltaCents: 0,
        endFundsCents: 0,
      },
    ]
    recomputeKidRank(world)
    return world
  }

  // ⚠⚠ RE-AIMED BY LADDER-PACE STEP 1 (05.08), AND THE RE-AIM IS THE FIX THIS PAIR EXISTS TO CATCH.
  // Both assertions below used to record a DEFECT: three of the ten W cuts sat past the end of the
  // pointed table and therefore refused nobody, so one ranking point opened W75, `tierOutgrown` shut
  // W15 behind it, and the documented three-stage slide never happened. The audit's own words were
  // "three documented stages of the ladder do not exist".
  //
  // `FIELD.size` 364 -> 520 puts 156 more pointed rows underneath, so the pointed depth passes W75's
  // #450 cut and W75 STOPS BEING INERT. Nothing about the cuts moved – `acceptsRank` is an absolute
  // rank precisely so it survives a deeper population (TierDef.acceptsRank says so in as many words:
  // "it is a fact about the sport, it does not move when FIELD.size does"). What moved is the table.
  //
  // NEITHER ASSERTION IS WEAKENED. The first still names every inert cut and still requires the two
  // that a career stalls under to bite; the count it asserts went from three to two, and it is
  // asserted as an exact SET rather than a loop so a fourth going inert is red. The second no longer
  // characterises a defect, so it is turned into the POSITIVE property it was blocking – the slide
  // is one rung at a time, W15 survives her first point, and the stages are pinned by name.
  // ⚠⚠ RE-AIMED A SECOND TIME BY POPULATION-1600 (05.08), AND THE INERT SET IS NOW **EMPTY** – which
  // is this guard reaching the end of the road it was built to travel. `FIELD.size` 520 -> 1,600
  // puts 1,080 more pointed rows underneath, so W50's #550 and W35's #700 are both well inside the
  // pointed table and every one of the ten W cuts refuses somebody. Nothing about the cuts moved for
  // the second wave running – `acceptsRank` is an absolute rank precisely so it survives a deeper
  // population, and TierDef.acceptsRank says so in as many words.
  //
  // ⚠ AN EMPTY EXPECTED SET IS A WEAKER ASSERTION THAN A NAMED ONE, SO IT DOES NOT STAND ALONE.
  // `expect(inert).toEqual([])` cannot tell "every cut bites" from "the loop found nothing to look
  // at", so the positive form is asserted underneath it over the WHOLE ladder rather than the three
  // rungs the old version named: every W cut in the game is strictly inside the pointed depth. That
  // is the property, and it is now stated at full width.
  it('every W acceptance cut bites: the inert set is empty on a 1,600-strong table', () => {
    const world = worldAt('cuts-truncated', 17, 0)
    const pointed = rankingFor(world, 'wta').filter((r) => r.points > 0).length
    // 1,600 derived pros hold a book; the rest of the ~1,800 rows are LIVE players, most on nothing.
    expect(pointed).toBeGreaterThanOrEqual(FIELD.size)
    expect(pointed).toBeLessThan(FIELD.size + 60)
    const W_CUTS = ['w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as const
    // The SET of inert cuts, exactly. A cut looser than the pointed depth is not a cut.
    const inert = W_CUTS.filter((t) => TIERS[t].acceptsRank! > pointed)
    expect(inert).toEqual([])
    // ...and the positive form, which is what carries the meaning now that the negative one is
    // empty: every cut on the ladder refuses somebody, not merely the three a career stalls under.
    expect(W_CUTS.length).toBe(9)
    for (const tier of W_CUTS) {
      expect(TIERS[tier].acceptsRank!, `${tier} gates`).toBeLessThan(pointed)
    }
  })

  // ⚠⚠ RE-AIMED A SECOND TIME BY POINTS-BY-THE-BOOK CORRECTION 3 (05.08), AND AGAIN THE RE-AIM IS
  // THE FIX. This test's own subject – «her first W point» – was a state the sport does not have:
  // 2026 WTA Rulebook §VIII.A.2.b requires points in three tournaments OR ten points before a player
  // appears on the rankings at all, so a one-point book is now no book. The 1 below therefore stops
  // meaning "the smallest ranking there is" and starts meaning "not ranked", which would have made
  // the assertion vacuous rather than false – so the probe moves to the smallest book the rule
  // ACTUALLY admits (ten points, exactly the threshold) and the one-point case is pinned separately
  // below as the new negative property. Nothing is weakened: the same three stages are still named,
  // still asserted as exact lists, and the "climbed" stage is untouched.
  // ⚠⚠ RE-AIMED A THIRD TIME BY POPULATION-1600 (05.08), AND THE SLIDE HAS GROWN A STAGE, WHICH IS
  // THE FIX RATHER THAN A REGRESSION. On a 719-row table the smallest ranking the rulebook admits
  // (ten points) stood at ~#521 and cleared W35's #700 and W50's #550 at once, so her first ranking
  // opened THREE rungs and the ladder's first two stages happened in the same week. On the 1,800-row
  // table it stands at ~#1,142 and clears neither: the window at first ranking is **W15 alone**, and
  // W35 and W50 are reached one book at a time. Every cut is where it was; the table is what moved.
  //
  // AND THAT IS THE SPORT'S OWN SHAPE, not a nicety – `real-ladder-pace.md` §1b measures #600 → #400
  // at 4.8 months and #400 → #200 at 11.9, i.e. the bottom of the ladder is several distinct stages
  // and not one. The books below are read off the shipped table (`bench:points --only 13`, the DOORS
  // block): #700 carries 37 points, #550 carries 59, #450 carries 90.
  it('the entry rung SURVIVES her first W ranking, and the window slides ONE rung at a time', () => {
    // `tierOutgrown` closes a rung when the rung three above it opens. Three above W15 is W75, whose
    // cut is #450 – and a ten-point book now stands at ~#1,142, outside it by a distance. So the
    // first ranking opens nothing at all above the on-ramp and W15 stays hers.
    const at16 = worldAt('trapdoor-16', 16, 10)
    expect(tierOpenFor(at16, 'w15')).toBe(true)

    const at17 = worldAt('trapdoor-17', 17, 10)
    expect(tierFloorOpen(at17, 'w75')).toBe(false)
    expect(tierOpenFor(at17, 'w15')).toBe(true)

    // STAGE 1 – the first ranking. W15 alone.
    const stage1 = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) => tierOpenFor(at17, t))
    expect(stage1).toEqual(['w15'])

    // STAGE 2 – a book past #700 opens W35 and nothing else.
    const at35 = worldAt('trapdoor-w35', 17, 50)
    const stage2 = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) => tierOpenFor(at35, t))
    expect(stage2).toEqual(['w15', 'w35'])

    // STAGE 3 – a book past #550 opens W50, and W15 is STILL hers: three above W15 is W75, and W75
    // is still shut. This is the stage the shipped table used to hand her on her first point.
    const at50 = worldAt('trapdoor-w50', 17, 75)
    const stage3 = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) => tierOpenFor(at50, t))
    expect(stage3).toEqual(['w15', 'w35', 'w50'])

    // STAGE 4 – and the entry rung is PASSED only when the rung THREE above it opens, exactly one
    // book later. This is the assertion the whole family exists for.
    //
    // ⚠ RE-AIMED 06.08 (docs/specs/ladder-floor-2026-08.md) FROM `tierOpenFor` TO `hasOutgrown`, and
    // the claim is the same claim: the window slides one rung at a time. What changed is which
    // function carries the ceiling. `tierOpenFor` is the FLOOR alone since the owner's ruling on
    // backlog #84 – the lower bound stops being a wall and becomes a sorting key – so asking it
    // about the slide would now be asking the wrong function and the case would pass on a rule it is
    // not about. Both halves are asserted: W15 is still HERS (open) and it is now BEHIND her.
    const climbed = worldAt('trapdoor-climbed', 17, 140)
    expect(tierFloorOpen(climbed, 'w75')).toBe(true)
    expect(hasOutgrown(climbed, 'w15')).toBe(true)
    expect(tierOpenFor(climbed, 'w15'), 'passed, and still enterable').toBe(true)
    // ...and one book earlier it was not: the slide is one rung at a time, which is the property.
    expect(hasOutgrown(at50, 'w15')).toBe(false)
    const workingLater = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter(
      (t) => tierOpenFor(climbed, t) && !hasOutgrown(climbed, t),
    )
    expect(workingLater).toEqual(['w35', 'w50', 'w75'])
  })

  // THE NEW POSITIVE PROPERTY, and it is the state the paragraph above used to probe with: a single
  // ranking point is not a ranking. Both limbs of §VIII.A.2.b are pinned, and both directions –
  // under the threshold she is off the list and the second rung stays shut; over it (by EITHER
  // limb) she is on it and the second rung opens. Written as behaviour rather than as a constant so
  // it survives a re-tune of the threshold itself.
  it('§VIII.A.2.b – one W point is not a ranking, and either limb of the minimum is', () => {
    const one = worldAt('minimum-one-point', 17, 1)
    expect(kidPoints(one, 'wta')).toBe(0)
    expect(tierFloorOpen(one, 'w35')).toBe(false)
    // ...and the ladder does NOT go dark on her: the on-ramp rung has no acceptance list, so the
    // rung she is standing on is still open. A minimum that left her nothing to enter would be the
    // boredom failure the owner has ruled against twice.
    expect(tierOpenFor(one, 'w15')).toBe(true)

    // limb (ii): ten points in a single tournament. ⚠ THE ASSERTION THAT FOLLOWS IT MOVED WITH THE
    // POPULATION AND THE SUBJECT DID NOT. What this test is about is §VIII.A.2.b – whether she is ON
    // THE LIST – and `kidPoints` is that question; W35's door was only ever the observable used to
    // read it. On a 1,800-row table ten points stands at ~#1,142, outside W35's #700 cut, so the
    // door is the wrong observable and asserting it would be asserting the ladder's pace inside a
    // test about the rulebook's eligibility rule. The direct form is used instead, in both
    // directions, and it is STRICTLY STRONGER: `kidPoints` reads 0 under the threshold and the full
    // book over it. The ladder's own stages are pinned by name in the slide test above.
    const ten = worldAt('minimum-ten-points', 17, 10)
    expect(kidPoints(ten, 'wta')).toBe(10)
    // ...and being on the list is what opens a door AT ALL: the on-ramp rung is open either way, but
    // an unranked girl cannot clear any acceptance cut in the game, and a ranked one clears the ones
    // her book reaches. Asserted as the general property rather than against one rung's number.
    expect(tierFloorOpen(ten, 'wta125')).toBe(false)
    const bigger = worldAt('minimum-ranked-climbs', 17, 300)
    expect(kidPoints(bigger, 'wta')).toBe(300)
    expect(tierFloorOpen(bigger, 'w35')).toBe(true)
    expect(tierFloorOpen(bigger, 'w75')).toBe(true)

    // limb (i): three tournaments that scored, on a total FAR below ten – the limb that cannot be
    // reached by making one result bigger.
    const three = worldAt('minimum-three-events', 17, 0)
    for (let i = 0; i < 3; i++) {
      three.results.push({ playerId: KID_ID, week: three.week - i, points: 1, tier: 'w15' })
    }
    recomputeKidRank(three)
    expect(kidPoints(three, 'wta')).toBe(3)
    // two of the same three is still nothing – the limb is a real edge and not a formality.
    const two = worldAt('minimum-two-events', 17, 0)
    for (let i = 0; i < 2; i++) {
      two.results.push({ playerId: KID_ID, week: two.week - i, points: 1, tier: 'w15' })
    }
    recomputeKidRank(two)
    expect(kidPoints(two, 'wta')).toBe(0)
  })
})
