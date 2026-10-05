// SUCCESSION S2a – `legacyInputOf`, THE PURE READER OF A FINISHED CAREER
// (docs/specs/succession-2026-10.md §1, §3, §4; engine/world/succession.ts).
//
// ⚠⚠ THREE CAREERS ARE WALKED AND NONE IS PRESET – `openCareer` + `stepCareerWeek` out of
// tools/econ-bench.ts, the only honest way a test reaches a late-career state (wave 10's rule). Two
// of them reach a REAL latched ending on their own (a bankruptcy at week 141, an injury at week 592);
// the third is the 'player' policy's career, which reaches the top-100 and never latches an ending in
// the 1600 weeks the bench allows. For the rows a walk cannot produce – a Slam, a farewell kind –
// the ending is latched through the REAL `latchEnding` and the Slam is a title week on the real shelf,
// on a clone of a walked world. That is posing on top of a lived career, not instead of one, and the
// file says which is which at every case.
//
// MUTATION-VERIFIED 06.10, each applied, RUN and restored byte-identical (`cmp` 0), with the count of
// what went red – «it fails» is the claim and «five of 32, these five» is the measurement:
//   · every multiplier above the floor flattened to 1.0: **5 red**, all of them in §3 – the literal
//     table, rows 1, 2 and 3, and the ceiling case. Row 4 stays green on purpose: 1.0 is what it expects.
//   · `world.startYear` dropped from the two `weekYear` calls: **2 red** – §1's real-child case and §2's
//     start-year case.
//   · «best house / best car» turned into «cheapest»: **1 red** – §5's rung case.
//   · `injury`'s ceiling lifted from `early` to `held`: **3 red** – row 4 (the REAL injury career), the
//     ceiling case and the injury row of the matrix.
//
// ⚠ A BIRTH IS POSED THE WAY WAVE 10'S §A POSES IT (`children.push`): no career this suite can afford
// to walk has a child, and what the reader asks of a birth is the one row the mechanic leaves behind.
//
// ⚠ THE MULTIPLIER NUMBERS ARE PINNED AS LITERALS ON PURPOSE. They are §4's table, a ruling, so a test
// that compared the reader with `LEGACY_SAVINGS_MULTIPLIER[band]` would stay green on a flattened
// table – which is exactly the mutation this file exists to see.
import { beforeAll, describe, expect, it } from 'vitest'
import { assembleAlbum, buildEndingView, type WorldState } from '../src/engine/world'
import { kidAgeYears } from '../src/engine/world/age'
import { latchEnding } from '../src/engine/world/endings'
import { bestRankOn } from '../src/engine/world/ladder'
import {
  LEGACY_BANDS,
  LEGACY_DAUGHTER_LAG_YEARS,
  LEGACY_ENDING_CEILING,
  LEGACY_SAVINGS_MULTIPLIER,
  LEGACY_SOLID_RANK,
  legacyBandOf,
  legacyInputOf,
  type LegacyBand,
} from '../src/engine/world/succession'
import { weekYear } from '../src/shared/dates'
import type { CareerEndingType, OwnedAsset } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

/** ⚠ THE CAP IS A BELT, NOT A HORIZON (wave 10's note): each walk stops the moment its own condition
 *  holds, and the number exists so a regression that made it unreachable fails as a red assertion and
 *  not as a hung suite. */
const CAP_WEEKS = 1600

const walked = new Map<string, { world: WorldState; weeks: number }>()

/** Walk one bench cell until `stop` says so, an ending latches, or the cap. Memoised per cell: each
 *  is walked ONCE and every case reads (or clones) the same lived career. */
function walk(
  preset: number,
  policyIndex: number,
  seedIndex: number,
  stop: (world: WorldState, weeks: number) => boolean = () => false,
): { world: WorldState; weeks: number } {
  const key = `${preset}/${policyIndex}/${seedIndex}`
  const hit = walked.get(key)
  if (hit) return hit
  const policy = POLICIES[policyIndex]
  const { world, rng } = openCareer(PRESETS[preset], seedIndex, policy)
  let weeks = 0
  while (world.ending === null && weeks < CAP_WEEKS && !stop(world, weeks)) {
    stepCareerWeek(world, rng, policy)
    weeks += 1
  }
  const lived = { world, weeks }
  walked.set(key, lived)
  return lived
}

const reachedTop100 = (world: WorldState, weeks: number): boolean =>
  weeks > 0 && weeks % 13 === 0 && (bestRankOn(world, 'wta') ?? Infinity) <= LEGACY_SOLID_RANK

let BANKRUPT: WorldState // a REAL bankruptcy ending, never on the pro table
let INJURY: WorldState //   a REAL injury ending, ranked on the pro table but nowhere near the top-100
let SOLID: WorldState //    a lived career that reached the top-100 (no ending of its own)

beforeAll(() => {
  BANKRUPT = walk(5, 0, 1).world
  INJURY = walk(3, 0, 0).world
  SOLID = walk(5, 1, 0, reachedTop100).world
}, 300_000)

const clone = (world: WorldState): WorldState => structuredClone(world)

/** A lived world with its ending latched as `kind` through the real `latchEnding`, and optionally a
 *  number of Slam title weeks on the real shelf. ⚠ THE ONLY POSING IN THIS FILE besides a birth and an
 *  owned asset; every call site says why the walk could not give it. */
function posed(base: WorldState, kind: CareerEndingType, slams = 0): WorldState {
  const world = clone(base)
  latchEnding(world, {
    type: kind,
    week: world.week,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay, world.startYear),
    detail: 'posed by the S2a suite',
    resumesWeek: null,
  })
  for (let i = 0; i < slams; i++) world.trophiesByTier.slam.titles.push(world.week - i)
  return world
}

const asset = (id: string, over: { boughtWeek?: number; valueCents?: number; readyWeek?: number } = {}): OwnedAsset => ({
  id,
  boughtWeek: 100,
  paidCents: 1_000_00,
  valueCents: 1_000_00,
  entries: [],
  ...over,
})

// =================================================================================================
// 0. THE DENOMINATORS – what the walked cells are, so no later arm runs on a world that is not the
//    one its name says (the repo's «print a non-empty denominator» rule)
// =================================================================================================

describe('S2a 0 – the lived careers are what this file says they are', () => {
  it('the bankruptcy never touched the pro table, the injury did and stayed outside the top-100, the solid career is inside it', () => {
    expect(BANKRUPT.ending?.type, 'a REAL bankruptcy latched').toBe('bankruptcy')
    expect(bestRankOn(BANKRUPT, 'wta'), 'a junior-and-ITF career: the pro table is untouched').toBe(null)

    expect(INJURY.ending?.type, 'a REAL injury latched').toBe('injury')
    const injured = bestRankOn(INJURY, 'wta')
    expect(injured, 'ranked on the pro table').not.toBe(null)
    expect(injured!, 'and never inside the top-100').toBeGreaterThan(LEGACY_SOLID_RANK)

    const solid = bestRankOn(SOLID, 'wta')
    expect(solid, 'the player-policy walk reached the top-100 inside the cap').not.toBe(null)
    expect(solid!).toBeLessThanOrEqual(LEGACY_SOLID_RANK)
    expect(solid!, 'and it is NOT №1, so only a Slam can make her «held»').toBeGreaterThan(1)
    expect(SOLID.trophiesByTier.slam.titles.length, 'no Slam yet – the held row poses one').toBe(0)
  })
})

// =================================================================================================
// 1. THE DAUGHTER, SOURCE (a): A REAL CHILD – her actual birth year, through the world's own calendar
// =================================================================================================

describe('S2a 1 – a real child: her actual birth year', () => {
  it('⭐⭐ is the year of her recorded birth WEEK, read with the world\'s own startYear', () => {
    const world = clone(INJURY)
    const bornWeek = world.ending!.week - 120
    world.children.push({ bornWeek, sex: 'girl' })

    expect(legacyInputOf(world).daughterBirthYear, 'her real birth week, through the one calendar').toBe(
      weekYear(bornWeek, world.startYear),
    )

    // ⚠ THE S1 PARAMETERISATION, NOT THE DEFAULT: the same career in a calendar that began in 2040 is
    // answered in 2040's years. A reader that dropped the argument answers 2031's and goes red here.
    world.startYear = 2040
    const shifted = legacyInputOf(world).daughterBirthYear
    expect(shifted).toBe(weekYear(bornWeek, 2040))
    expect(shifted, 'the answer moved with the world\'s calendar').not.toBe(weekYear(bornWeek, 2031))
  })

  it('takes the FIRST daughter – the row the wizard already reads as `childBirthdays[0]`', () => {
    const world = clone(INJURY)
    const first = world.ending!.week - 600
    const second = world.ending!.week - 20
    world.children.push({ bornWeek: first, sex: 'girl' }, { bornWeek: second, sex: 'girl' })
    expect(weekYear(first, world.startYear), 'the two births are years apart, so the case can tell them apart').not.toBe(
      weekYear(second, world.startYear),
    )
    expect(legacyInputOf(world).daughterBirthYear).toBe(weekYear(first, world.startYear))
  })

  it('a boy is not the heiress – a boys-only record falls to the epilogue\'s synthesized year', () => {
    const world = clone(INJURY)
    world.children.push({ bornWeek: world.ending!.week - 120, sex: 'boy' })
    expect(legacyInputOf(world).daughterBirthYear).toBe(
      weekYear(world.ending!.week, world.startYear) + LEGACY_DAUGHTER_LAG_YEARS,
    )
  })
})

// =================================================================================================
// 2. THE DAUGHTER, SOURCE (b): NO CHILD – «a daughter came later», the year the story stopped plus two
// =================================================================================================

describe('S2a 2 – no child: the ending\'s year plus two', () => {
  it('⭐⭐ two REAL endings, each `children` empty, each answering endingYear + 2', () => {
    expect(LEGACY_DAUGHTER_LAG_YEARS, 'the architect\'s brief: endingYear + 2').toBe(2)
    for (const world of [BANKRUPT, INJURY]) {
      expect(world.children, 'a walked career with no birth').toEqual([])
      const endingYear = weekYear(world.ending!.week, world.startYear)
      expect(legacyInputOf(world).daughterBirthYear).toBe(endingYear + 2)
    }
  })

  it('moves with the world\'s start year, and the two sources distinguish themselves by `children` alone', () => {
    const world = clone(BANKRUPT)
    world.startYear = 2040
    expect(legacyInputOf(world).daughterBirthYear).toBe(weekYear(world.ending!.week, 2040) + 2)
    expect(legacyInputOf(world).daughterBirthYear).not.toBe(weekYear(world.ending!.week, 2031) + 2)
    world.children.push({ bornWeek: world.ending!.week - 30, sex: 'girl' })
    expect(legacyInputOf(world).daughterBirthYear, 'one pushed row flips the source').toBe(
      weekYear(world.ending!.week - 30, 2040),
    )
  })
})

// =================================================================================================
// 3. THE MULTIPLIER – §4's four rows, hit end to end, and the whole kind-by-fact matrix
// =================================================================================================

describe('S2a 3 – the savings multiplier, §4 row by row', () => {
  it('⭐⭐⭐ the table is §4\'s, as literals: 3.0 / 2.0 / 1.3 / 1.0, lowest band first, inside [1.0, 3.0]', () => {
    expect(LEGACY_BANDS).toEqual(['early', 'faded', 'solid', 'held'])
    expect(LEGACY_SAVINGS_MULTIPLIER).toEqual({ held: 3.0, solid: 2.0, faded: 1.3, early: 1.0 })
    const money = LEGACY_BANDS.map((band) => LEGACY_SAVINGS_MULTIPLIER[band])
    expect(money, 'the order of the bands IS the order of the money').toEqual([...money].sort((a, b) => a - b))
    for (const x of money) {
      expect(x, 'never poorer than an ordinary start').toBeGreaterThanOrEqual(1.0)
      expect(x, 'never so rich the junior-years tension disappears').toBeLessThanOrEqual(3.0)
    }
  })

  it('⭐⭐⭐ ROW 1 – held a Slam, left at the top: 3.0  (a lived top-100 career + a Slam title + the real `peak` latch)', () => {
    const input = legacyInputOf(posed(SOLID, 'peak', 1))
    expect(input.endingKind).toBe('peak')
    expect(input.motherSlamTitles).toBe(1)
    expect(input.savingsMultiplier).toBe(3.0)
  })

  it('⭐⭐⭐ ROW 2 – a solid pro career, top-100 reached: 2.0  (the same lived career, a natural end, no Slam)', () => {
    const input = legacyInputOf(posed(SOLID, 'natural'))
    expect(input.motherSlamTitles).toBe(0)
    expect(input.savingsMultiplier).toBe(2.0)
  })

  it('⭐⭐⭐ ROW 3 – faded before the top: 1.3  (the lived injury career, ranked on the pro table, re-latched as a natural end)', () => {
    const input = legacyInputOf(posed(INJURY, 'natural'))
    expect(input.motherPeakRank, 'on the pro table and outside the top-100').toBeGreaterThan(LEGACY_SOLID_RANK)
    expect(input.savingsMultiplier).toBe(1.3)
  })

  it('⭐⭐⭐ ROW 4 – early/forced: 1.0  (two REAL endings, no posing: the bankruptcy and the injury)', () => {
    expect(legacyInputOf(BANKRUPT).savingsMultiplier).toBe(1.0)
    // ⚠ THE INJURY IS RANKED ON THE PRO TABLE – its facts alone say «faded» (1.3). It is FORCED, and the
    // ending's ceiling is what keeps it at 1.0: the case that tells the ceiling from the achievement.
    const input = legacyInputOf(INJURY)
    expect(input.motherPeakRank).not.toBe(null)
    expect(input.savingsMultiplier).toBe(1.0)
  })

  it('the CEILING binds: a forced ending prices a Slam champion at 1.0, a quiet fade at 2.0 – and neither is a farewell', () => {
    expect(legacyInputOf(posed(SOLID, 'injury', 2)).savingsMultiplier, 'forced beats a Slam').toBe(1.0)
    expect(legacyInputOf(posed(SOLID, 'bankruptcy', 2)).savingsMultiplier).toBe(1.0)
    expect(legacyInputOf(posed(SOLID, 'plateau', 2)).savingsMultiplier, 'the quiet fade is a solid pro at most').toBe(2.0)
    expect(legacyInputOf(posed(SOLID, 'fall', 2)).savingsMultiplier).toBe(2.0)
    expect(legacyInputOf(posed(SOLID, 'family', 1)).savingsMultiplier, 'a farewell by choice follows the achievement').toBe(3.0)
  })

  it('a world with NO latched ending reads the floor, never a guess upward', () => {
    const world = clone(SOLID)
    expect(world.ending, 'the lived career has not ended').toBe(null)
    world.trophiesByTier.slam.titles.push(world.week)
    const input = legacyInputOf(world)
    expect(input.endingKind).toBe('')
    expect(input.savingsMultiplier).toBe(1.0)
  })

  // ---- the whole matrix, over the pure classifier -----------------------------------------------

  type Facts = 'held' | 'solid' | 'faded' | 'none'
  type Row = Record<Facts, LegacyBand>
  const FAREWELL: Row = { held: 'held', solid: 'solid', faded: 'faded', none: 'early' }
  const QUIET_FADE: Row = { held: 'solid', solid: 'solid', faded: 'faded', none: 'early' }
  const FORCED: Row = { held: 'early', solid: 'early', faded: 'early', none: 'early' }
  const EXPECTED: Record<CareerEndingType | '', Row> = {
    peak: FAREWELL,
    natural: FAREWELL,
    family: FAREWELL,
    plateau: QUIET_FADE,
    fall: QUIET_FADE,
    injury: FORCED,
    bankruptcy: FORCED,
    stopped: FORCED,
    college: FORCED,
    '': FORCED,
  }
  /** `[bestRank, slams]` cells. №1 alone, a Slam alone (at #37), and both – the three ways to «held»;
   *  rank 100 is exactly the bar and 101 is the first rank outside it. */
  const FACTS: Record<Facts, Array<[number | null, number]>> = {
    held: [[1, 0], [37, 1], [1, 3]],
    solid: [[2, 0], [100, 0]],
    faded: [[101, 0], [284, 0]],
    none: [[null, 0]],
  }

  it('the ceiling table is TOTAL over the nine kinds', () => {
    expect(Object.keys(LEGACY_ENDING_CEILING).sort()).toEqual(
      ['bankruptcy', 'college', 'fall', 'family', 'injury', 'natural', 'peak', 'plateau', 'stopped'],
    )
  })

  for (const [kind, row] of Object.entries(EXPECTED)) {
    it(`matrix – ${kind === '' ? '(no ending)' : kind}: ${(Object.keys(row) as Facts[]).map((f) => `${f}→${row[f]}`).join('  ')}`, () => {
      for (const facts of Object.keys(FACTS) as Facts[]) {
        for (const [bestRank, slams] of FACTS[facts]) {
          expect(legacyBandOf(kind, bestRank, slams), `${kind || 'no ending'} · rank ${bestRank} · ${slams} slams`).toBe(row[facts])
        }
      }
    })
  }
})

// =================================================================================================
// 4. PARITY – the ending view's own numbers, on the same world
// =================================================================================================

describe('S2a 4 – the reader quotes the numbers the ending view carries', () => {
  it('⭐⭐ name, surname, pro-table peak, Slam shelf and kind equal the view\'s dynasty block, and the peak equals the view\'s own best rank where the pro table is her highest ladder', () => {
    const world = posed(SOLID, 'natural', 2)
    world.profile.kidName = 'Zoya'
    world.profile.kidLastName = 'Quillfeather'
    const view = buildEndingView(world)!
    const input = legacyInputOf(world)

    expect(input.motherName).toBe('Zoya')
    expect(input.surname).toBe('Quillfeather')
    expect(input.motherName).toBe(view.dynasty.motherName.first)
    expect(input.surname).toBe(view.dynasty.motherName.last)

    expect(input.motherPeakRank).toBe(view.dynasty.motherCareer.bestRank)
    expect(input.motherPeakRank, 'the primitive the block itself folds').toBe(bestRankOn(world, 'wta'))
    expect(view.bestRankTrack, 'on this career the pro table IS the highest ladder reached').toBe('wta')
    expect(input.motherPeakRank, 'so the epilogue\'s own «best rank» is the same number').toBe(view.bestRank)

    expect(input.motherSlamTitles).toBe(view.dynasty.motherCareer.slams)
    expect(input.motherSlamTitles).toBe(world.trophiesByTier.slam.titles.length)
    expect(input.motherSlamTitles).toBe(2)
    expect(input.motherSlamTitles, 'a shelf is part of the cabinet').toBeLessThanOrEqual(view.titles)

    expect(input.endingKind).toBe(view.dynasty.motherCareer.endingKind)
    expect(input.endingKind).toBe(view.ending.type)
  })

  it('a junior-only career answers null for the peak – the pro table alone, the architect\'s 22.09 rule – while the epilogue shows her junior best', () => {
    const view = buildEndingView(BANKRUPT)!
    const input = legacyInputOf(BANKRUPT)
    expect(input.motherPeakRank).toBe(null)
    expect(input.motherPeakRank).toBe(view.dynasty.motherCareer.bestRank)
    expect(view.bestRank, 'the epilogue still shows the ladder she did reach').not.toBe(null)
    expect(input.motherSlamTitles).toBe(0)
  })
})

// =================================================================================================
// 5. THE HOUSE AND THE CAR
// =================================================================================================

describe('S2a 5 – the house and the car', () => {
  it('⭐⭐ a career that owns neither answers null and null – the three lived worlds (none of the bench policies buys the shelf)', () => {
    // ⚠ «NO HOUSE» IS AN EMPTY LIST, NOT A MISSING ONE: `assets` is a required field of every legal
    // world (migrations default it, and `assembleAlbum` reads it unguarded), so the empty array is
    // the real state this arm has to hold.
    for (const world of [BANKRUPT, INJURY, SOLID]) {
      expect(world.assets, 'the lived career bought nothing from the shelf').toEqual([])
      const input = legacyInputOf(world)
      expect(input.houseId).toBe(null)
      expect(input.carId).toBe(null)
    }
  })

  it('⭐⭐ the BEST house and the BEST car by rung – not by purchase order and not by what each is worth now', () => {
    const world = clone(INJURY)
    world.assets = [
      // bought first and worth the most today – and the LOWER rung
      asset('house-first', { boughtWeek: 10, valueCents: 900_000_00 }),
      asset('house-villa', { boughtWeek: 300, valueCents: 1_00 }),
      asset('car-good', { boughtWeek: 20 }),
      asset('car-sensible', { boughtWeek: 400, valueCents: 900_000_00 }),
    ]
    const input = legacyInputOf(world)
    expect(input.houseId).toBe('house-villa')
    expect(input.carId).toBe('car-good')
  })

  it('a stage still under construction is not owned, and a boat, a plane or a deposit is neither a house nor a car', () => {
    const world = clone(INJURY)
    world.assets = [
      asset('house-first'),
      asset('house-headland', { readyWeek: world.week + 40 }),
      asset('boat-launch'),
      asset('plane-small'),
      asset('deposit'),
    ]
    const input = legacyInputOf(world)
    expect(input.houseId, 'the headland is a contract, not a house: the first house stands').toBe('house-first')
    expect(input.carId).toBe(null)
  })
})

// =================================================================================================
// 6. PURITY, AND THE HEIRLOOM
// =================================================================================================

describe('S2a 6 – pure, and the heirloom is the album\'s own book', () => {
  it('⭐⭐⭐ two calls are deep-equal and the world is BYTE-identical after (a full world: ending, Slam, child, house, car)', () => {
    const world = posed(SOLID, 'peak', 2)
    world.children.push({ bornWeek: world.week - 200, sex: 'girl' })
    world.assets = [asset('house-garden'), asset('car-nineteen')]

    const before = JSON.stringify(world)
    const first = legacyInputOf(world)
    const second = legacyInputOf(world)
    expect(second, 'same world, same input').toEqual(first)
    expect(JSON.stringify(world), 'the world was only read – its save is byte-identical, rngMain included').toBe(before)
    expect(first.houseId).toBe('house-garden')
    expect(first.carId).toBe('car-nineteen')
  })

  it('⭐⭐ the heirloom is exactly what the album screen would show, plain data, and small', () => {
    const world = posed(SOLID, 'natural', 1)
    const input = legacyInputOf(world)
    expect(input.heirloomAlbum, 'the album module\'s own assembly, no second format').toEqual(assembleAlbum(world))
    expect(input.heirloomAlbum.sheets.length, 'a lived career earned pages').toBeGreaterThan(0)

    const json = JSON.stringify(input.heirloomAlbum)
    expect(JSON.parse(json), 'it survives a JSON round trip strictly equal').toStrictEqual(input.heirloomAlbum)
    expect(JSON.parse(JSON.stringify(input)), 'and so does the whole input').toStrictEqual(input)
    // measured 1 to 9 KB over fourteen walked careers; the book is bounded by chapters x frames, so this
    // is a sanity ceiling and not a budget
    expect(json.length, 'the blob is small').toBeLessThan(64_000)
  })

  it('does not throw on a career with nothing to show: no latched ending, no child, no house, no car, no title', () => {
    const world = clone(BANKRUPT)
    world.ending = null
    expect(world.children, 'no child').toEqual([])
    expect(world.assets, 'no house, no car').toEqual([])
    const input = legacyInputOf(world)
    expect(input.endingKind).toBe('')
    expect(input.savingsMultiplier).toBe(1.0)
    expect(input.houseId).toBe(null)
    expect(input.carId).toBe(null)
    expect(Number.isFinite(input.daughterBirthYear)).toBe(true)
  })
})
