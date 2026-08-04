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
import { rankIn, rankingFor } from '../src/engine/world/ladder'
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

  it('three W cuts sit past the end of the POINTED table, so they refuse nobody', () => {
    const world = worldAt('cuts-truncated', 17, 0)
    const pointed = rankingFor(world, 'wta').filter((r) => r.points > 0).length
    // 364 derived pros hold a book; the rest of the 564 rows are LIVE players, most on nothing. So
    // the table's pointed depth is ~385 and a cut looser than that is not a cut.
    expect(pointed).toBeGreaterThan(FIELD.size)
    expect(pointed).toBeLessThan(420)
    for (const tier of ['w35', 'w50', 'w75'] as const) {
      expect(TIERS[tier].acceptsRank!, `${tier} is inert`).toBeGreaterThan(pointed)
    }
    // ...and the two rungs that DO bite are the ones a career actually stalls under.
    expect(TIERS.w100.acceptsRank!).toBeLessThan(pointed)
    expect(TIERS.wta125.acceptsRank!).toBeLessThan(pointed)
  })

  it('⚠ so the entry rung of the professional tour closes on her FIRST W point, from 17', () => {
    // `tierOutgrown` closes a rung when the rung three above it opens. Three above W15 is W75, whose
    // cut (#450) is past the pointed depth – so one point opens W75 and the same point shuts W15.
    // At 16 the W75 age gate (17) short-circuits the closure, which is why this only bites from 17.
    const at16 = worldAt('trapdoor-16', 16, 10)
    expect(tierOpenFor(at16, 'w15')).toBe(true)

    const at17 = worldAt('trapdoor-17', 17, 1)
    expect(tierFloorOpen(at17, 'w75')).toBe(true)
    expect(tierOpenFor(at17, 'w15')).toBe(false)

    // The documented slide is one rung at a time – `tierOutgrown`'s own worked example names the
    // stages "{j60, j300, w15} -> {j300, w15, w35} -> {w15, w35, w50} -> {w35, w50, w75}". The
    // engine's real floors skip straight from {w15} to {w35, w50, w75}: three at once.
    const open = (['w15', 'w35', 'w50', 'w75', 'w100'] as const).filter((t) => tierOpenFor(at17, t))
    expect(open).toEqual(['w35', 'w50', 'w75'])
  })
})
