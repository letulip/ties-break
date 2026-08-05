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
  tierFloorOpen,
  tierOpenFor,
  tickWeek,
  ageAtWeek,
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
    // W100 accepts to #350. The old sentinel was 200 – inside the cut – so an unranked girl walked
    // in. The table she is unranked IN is 564 rows, and 564 > 350.
    expect(TIERS.w100.acceptsRank).toBe(350)
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
  /** A live mid-career world at `age`, with the ITF on-ramp latched and a synthetic W book. */
  function worldAt(seed: string, age: number, book: number): WorldState {
    const world = createWorld(seed)
    const rng = resumeMain(world.rngMain)
    while (ageAtWeek(world.week) < age) tickWeek(world, rng)
    if (book > 0) world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
    world.onRampCleared = { itf: true, wta: true }
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
  it('the inert W cuts are now W35 and W50 alone – W75 bites again', () => {
    const world = worldAt('cuts-truncated', 17, 0)
    const pointed = rankingFor(world, 'wta').filter((r) => r.points > 0).length
    // 520 derived pros hold a book; the rest of the ~719 rows are LIVE players, most on nothing.
    expect(pointed).toBeGreaterThanOrEqual(FIELD.size)
    expect(pointed).toBeLessThan(FIELD.size + 60)
    // The SET of inert cuts, exactly. A cut looser than the pointed depth is not a cut.
    const inert = (['w35', 'w50', 'w75', 'w100', 'wta125'] as const).filter(
      (t) => TIERS[t].acceptsRank! > pointed,
    )
    expect(inert).toEqual(['w35', 'w50'])
    // ...and every cut a career actually stalls under bites.
    for (const tier of ['w75', 'w100', 'wta125'] as const) {
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
  it('the entry rung SURVIVES her first W ranking, and the window slides one rung at a time', () => {
    // `tierOutgrown` closes a rung when the rung three above it opens. Three above W15 is W75, whose
    // cut is #450 – and a ten-point book now stands at ~#521, outside it. So the first ranking opens
    // nothing above W50 and W15 stays hers, which is the ladder's own documented worked example.
    const at16 = worldAt('trapdoor-16', 16, 10)
    expect(tierOpenFor(at16, 'w15')).toBe(true)

    const at17 = worldAt('trapdoor-17', 17, 10)
    expect(tierFloorOpen(at17, 'w75')).toBe(false)
    expect(tierOpenFor(at17, 'w15')).toBe(true)

    // `tierOutgrown`'s own worked example names the stages "{j60, j300, w15} -> {j300, w15, w35} ->
    // {w15, w35, w50} -> {w35, w50, w75}". One point is the third of those, and it is now what the
    // engine really produces instead of skipping three rungs at once.
    const open = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) => tierOpenFor(at17, t))
    expect(open).toEqual(['w15', 'w35', 'w50'])

    // ...and the NEXT stage is reached by playing, not by holding one point: a book that clears
    // W75's cut is what closes W15, exactly one rung later.
    const climbed = worldAt('trapdoor-climbed', 17, 140)
    expect(tierFloorOpen(climbed, 'w75')).toBe(true)
    expect(tierOpenFor(climbed, 'w15')).toBe(false)
    const openLater = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) =>
      tierOpenFor(climbed, t),
    )
    expect(openLater).toEqual(['w35', 'w50', 'w75'])
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

    // limb (ii): ten points in a single tournament.
    const ten = worldAt('minimum-ten-points', 17, 10)
    expect(kidPoints(ten, 'wta')).toBe(10)
    expect(tierFloorOpen(ten, 'w35')).toBe(true)

    // limb (i): three tournaments that scored, on a total FAR below ten – the limb that cannot be
    // reached by making one result bigger.
    const three = worldAt('minimum-three-events', 17, 0)
    for (let i = 0; i < 3; i++) {
      three.results.push({ playerId: KID_ID, week: three.week - i, points: 1, tier: 'w15' })
    }
    recomputeKidRank(three)
    expect(kidPoints(three, 'wta')).toBe(3)
    expect(tierFloorOpen(three, 'w35')).toBe(true)
    // two of the same three is still nothing – the limb is a real edge and not a formality.
    const two = worldAt('minimum-two-events', 17, 0)
    for (let i = 0; i < 2; i++) {
      two.results.push({ playerId: KID_ID, week: two.week - i, points: 1, tier: 'w15' })
    }
    recomputeKidRank(two)
    expect(kidPoints(two, 'wta')).toBe(0)
  })
})
