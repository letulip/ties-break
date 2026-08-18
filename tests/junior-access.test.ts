// JUNIOR ACCESS – the Junior Accelerator and the W15 reserved place (P1 step 1,
// docs/specs/junior-access-2026-08.md; the plan is docs/plans/college-and-the-junior-ladder.md).
//
// WHAT THIS FILE PROTECTS, and every one of the five is a way the change could have been wrong
// rather than a restatement of the code:
//
//   1. THE STANDING IS THE BANKED YEAR-END ONE. The rule says "year-end junior rank", so it reads
//      persisted history and not today's fold. A live read would hand her a W75 place the week she
//      climbed into the junior top five and take it away the week she slipped out.
//   2. THE ALLOWANCE IS POOLS, NOT A PER-RUNG COUNTER. "3 tournaments up to W100, 2 up to W75" is a
//      sentence a counter cannot represent: the three W100 places may be spent lower, the two W75
//      ones may not be spent higher. A per-rung counter passes the easy cases and gets both of those
//      backwards, so the test walks them explicitly.
//   3. AN ADULT IS UNTOUCHED, AND SO ARE W15 AND THE WTA'S OWN RUNGS. The Accelerator is a junior's
//      route. The day it capped a professional, or barred a seventeen-year-old from a major, it
//      would be modelling a rule that does not exist.
//   4. THE W15 DOOR READS A RANKING. It read 120 ITF junior POINTS, which was ours; the sport's own
//      door is the junior reserved place and it reads a combined junior RANKING. Two girls with the
//      same points and different fields must now get different answers – that IS the change.
//   5. THE CALENDAR AND THE TURNSTILE STILL AGREE (R10-5). `tierFloorOpen` and `entryStatus` are one
//      rule at two surfaces; a new refusal that reached only one of them is the exact disagreement
//      tests/rankingGate.test.ts exists for, arriving through a new door.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  entryStatus,
  juniorAccessOpen,
  kidAgeYears,
  kidPoints,
  recomputeKidRank,
  tickWeek,
  tierFloorOpen,
  yearEndJuniorRank,
  acceleratorAdmits,
  acceleratorUsage,
  juniorReservedRank,
  tableSize,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { acceleratorCapacityAtOrAbove, acceleratorRowFor, ACCELERATOR } from '../src/engine/world/entryCaps'
import { JUNIOR_MAX_AGE_YEARS, TIERS, W_SERIES } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { SeasonHistoryEntry } from '../src/shared/protocol'

// --- fixtures -----------------------------------------------------------------------------------

function injectEvent(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const e: SeasonEvent = {
    id: `acc-${week}-${tier}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** A banked season, carrying nothing but the one figure the Accelerator reads. `itfRank === null`
 *  is the v46 row's own "she held no counting ITF result", which is not a place. */
function bankedSeason(seasonIndex: number, itfRank: number | null, flatEndRank = 199): SeasonHistoryEntry {
  return {
    seasonIndex,
    endRank: flatEndRank,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0, ...(itfRank === null ? {} : { endRank: itfRank }) },
      wta: { points: 0, wins: 0, losses: 0 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

/** ⚠⚠ THE DEFAULT BOOK MEANS SOMETHING DIFFERENT SINCE 16.08, AND SO DOES ITS OPPOSITE. It used to
 *  be sized so every W acceptance cut took her, on the reasoning that the ONLY thing which could then
 *  refuse her above W15 was the Accelerator – true while the Accelerator was a CEILING, and the
 *  owner's question that day was why it was one. `ranking-points-by-tier.md` §4-C2 says in a
 *  primary-source quote that these rungs have no age floor above 14: a junior enters on her own rank
 *  like anyone else, and the reserved place is an EXTRA route for the girl the acceptance list would
 *  not reach.
 *
 *  So `wBook = 300` (rank ~#229) is now the girl who needs no programme at all, and `OFF_THE_LIST`
 *  below is the one the programme exists for. Every test whose subject is the Accelerator's own
 *  answer uses the latter – otherwise it asserts a refusal the rung never makes and passes for the
 *  wrong reason.
 *
 *  `juniorRank` is what last season banked.
 *
 *  ⚠ TICKED TO HER OWN AGE, not the calendar band's (the one-clock ruling, 09.08): `juniorAccessOpen`
 *  gates on `kidAgeAt`, so a fixture that stopped at a week would arrive a year out for a girl born
 *  late in the year and the age arm would silently stop being exercised. */
/** ONE professional point – a real ranking, and a hopeless one. Measured on this build: it puts her
 *  at world #1613 of an 1800-row table, outside every W cut on the ladder (W35's 700 is the loosest).
 *  ⚠ NOT ZERO, deliberately: `meetsAcceptanceCut` refuses an empty book before it ever compares a
 *  rank, so a zero would exercise the points guard and leave the rank arm – the arm these tests are
 *  about – untested. */
const OFF_THE_LIST = 1

function juniorWorld(seed: string, age: number, juniorRank: number | null, wBook = 300): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 500_000_00
  world.season = []
  world.results.push({ playerId: KID_ID, week: world.week, points: wBook, tier: 'w15' })
  world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
  world.onRampCleared = { itf: true, wta: true }
  world.seasonHistory = [bankedSeason(0, juniorRank)]
  world.seasonEntries = { fromWeek: world.week, rows: [] }
  recomputeKidRank(world)
  return world
}

/** Spend `count` Accelerator places at `tier` this season, exactly as `enterEvent` records them: one
 *  row on the season's own entry ledger, whose id carries the rung. */
function spend(world: WorldState, tier: TierId, count: number): void {
  for (let i = 0; i < count; i++) {
    world.seasonEntries!.rows.push({ id: `${2030}-w${i}-${tier}`, track: 'wta', outgrown: false, bookShut: false })
  }
}

// =================================================================================================
// 1. THE STANDING IS THE BANKED YEAR-END ONE
// =================================================================================================

describe('the year-end junior rank is read out of persisted history', () => {
  it('prefers the v46 per-table row, falls back to the flat one, and is null before any season closed', () => {
    const world = createWorld('yer-read')
    expect(yearEndJuniorRank(world), 'no season has closed yet').toBeNull()

    world.seasonHistory = [bankedSeason(0, 4, 199)]
    expect(yearEndJuniorRank(world), 'the v46 ITF row wins').toBe(4)

    // A row banked before v46 has no per-table figures and none can be invented – the flat `endRank`
    // is the ITF fold and is the only figure there is.
    const old = bankedSeason(0, null, 27)
    delete (old as Partial<SeasonHistoryEntry>).byTrack
    world.seasonHistory = [old]
    expect(yearEndJuniorRank(world), 'the pre-v46 fallback').toBe(27)

    // ...and a v46 row that says she held no counting ITF result says exactly that.
    world.seasonHistory = [bankedSeason(0, null, 200)]
    expect(yearEndJuniorRank(world), 'absent is unranked, not a place').toBeNull()
  })

  it('⚠ it is LAST season, so a career reads the most recent banked row', () => {
    const world = createWorld('yer-last')
    world.seasonHistory = [bankedSeason(0, 60), bankedSeason(1, 8), bankedSeason(2, 2)]
    expect(yearEndJuniorRank(world)).toBe(2)
  })
})

// =================================================================================================
// 2. THE ALLOWANCE IS POOLS
// =================================================================================================

describe('the Accelerator table is pools with ceilings, not a per-rung counter', () => {
  it('maps a year-end rank onto its row, and an unranked junior onto the empty one', () => {
    expect(acceleratorRowFor(1).pools.length, '#1 has places').toBeGreaterThan(0)
    expect(acceleratorRowFor(4), '4 and 5 share a row').toBe(acceleratorRowFor(5))
    expect(acceleratorRowFor(21).pools, '21+ is nothing above W15').toEqual([])
    expect(acceleratorRowFor(null).pools, 'no year-end ranking at all is the same answer').toEqual([])
  })

  it('⚠ capacity is read AT OR ABOVE a rung, which is what a ceiling means', () => {
    const one = acceleratorRowFor(1) // {W100 x3, W75 x2}
    expect(acceleratorCapacityAtOrAbove(one, 'w100'), 'only the W100 pool reaches W100').toBe(3)
    expect(acceleratorCapacityAtOrAbove(one, 'w75'), 'both pools reach W75').toBe(5)
    expect(acceleratorCapacityAtOrAbove(one, 'w35'), 'and both reach all the way down').toBe(5)
    const eleven = acceleratorRowFor(15) // {W50 x1, W35 x4}
    expect(acceleratorCapacityAtOrAbove(eleven, 'w75'), 'nothing in the 11-20 row reaches W75').toBe(0)
    expect(acceleratorCapacityAtOrAbove(eleven, 'w50')).toBe(1)
    expect(acceleratorCapacityAtOrAbove(eleven, 'w35')).toBe(5)
  })

  it('⚠⚠ THE TWO CASES A PER-RUNG COUNTER GETS BACKWARDS', () => {
    // #1 holds {W100 x3, W75 x2}. A counter keyed per rung would read "3 at W100, 2 at W75".
    const world = juniorWorld('acc-pools', 17, 1)
    // (a) THE HIGH PLACES MAY BE SPENT LOW. Three entries at W75 exhaust nothing at W75 alone – they
    //     eat into the W100 pool as well, because a W100 place serves a W75.
    spend(world, 'w75', 3)
    expect(acceleratorAdmits(world, world.week, 'w75', 1), 'two of the five are left').toBe(true)
    spend(world, 'w75', 2)
    expect(acceleratorAdmits(world, world.week, 'w75', 1), 'five spent is the whole allowance').toBe(false)
    expect(acceleratorAdmits(world, world.week, 'w100', 1), 'and nothing is left at W100 either').toBe(false)

    // (b) THE LOW PLACES MAY NOT BE SPENT HIGH. Three W100 entries exhaust the W100 pool, and the two
    //     W75 places that remain cannot be carried up to it.
    const b = juniorWorld('acc-pools-b', 17, 1)
    spend(b, 'w100', 3)
    expect(acceleratorAdmits(b, b.week, 'w100', 1), 'the W100 pool is spent').toBe(false)
    expect(acceleratorAdmits(b, b.week, 'w75', 1), 'but the W75 pair is not').toBe(true)
  })

  it('reports the allowance in `EntryCapUsage`\'s own shape, so a surface can print it', () => {
    const world = juniorWorld('acc-usage', 17, 3)
    const before = acceleratorUsage(world, world.week, 'w75', 3)
    expect(before.limit, '#3 holds {W100 x1, W75 x2} = three places at W75-or-above').toBe(3)
    expect(before.used).toBe(0)
    spend(world, 'w75', 2)
    const after = acceleratorUsage(world, world.week, 'w75', 3)
    expect(after.used).toBe(2)
    expect(after.remaining).toBe(1)
  })

  it('the allowance is a SEASON\'s, and the ledger the wrap-up resets is what carries it', () => {
    const world = juniorWorld('acc-season', 17, 15)
    spend(world, 'w35', 5)
    expect(acceleratorAdmits(world, world.week, 'w35', 15), 'the 11-20 row holds five').toBe(false)
    // The wrap-up replaces the ledger at the season boundary; that is the whole of the reset.
    world.seasonEntries = { fromWeek: world.week, rows: [] }
    expect(acceleratorAdmits(world, world.week, 'w35', 15), 'a fresh allowance next season').toBe(true)
  })
})

// =================================================================================================
// 3. WHO IT IS NOT ASKED OF
// =================================================================================================

describe('the Accelerator is a junior\'s route and nothing else', () => {
  it('⚠ AN ADULT ENTRANT IS UNTOUCHED – she enters on her professional ranking', () => {
    // OFF_THE_LIST: the junior arm only means something for a girl the rung's own cut does not take
    // – since 16.08 one who clears it walks in on her rank and the programme is never consulted.
    const junior = juniorWorld('acc-adult-j', 17, null, OFF_THE_LIST)
    expect(juniorAccessOpen(junior, junior.week, 'w75'), 'a junior off both lists is refused').toBe(false)
    const adult = juniorWorld('acc-adult-a', JUNIOR_MAX_AGE_YEARS + 1, null)
    expect(kidAgeYears(adult.week, adult.profile.birthMonth, adult.profile.birthDay)).toBeGreaterThan(JUNIOR_MAX_AGE_YEARS)
    expect(juniorAccessOpen(adult, adult.week, 'w75'), 'the same girl a year later is not').toBe(true)
  })

  it('⭐⭐ A JUNIOR WHO CLEARS THE RUNG\'S OWN CUT NEEDS NO PROGRAMME – the owner\'s 16.08 correction', () => {
    // THE CLAIM THIS FILE EXISTED WITHOUT FOR A DAY, and the reason the ceiling above was wrong.
    // `ranking-points-by-tier.md` §4-C2, quoting the 2026 ITF WTT Regulations: W75 has no age floor
    // of its own, the only thresholds anywhere are 14 and 18, and a 15-, 16- or 17-year-old is
    // limited only by her per-year COUNT. §4-A: the four rungs share one System of Merit section and
    // there is no threshold in it at all. So a seventeen-year-old inside the acceptance list enters
    // on it, exactly as a twenty-five-year-old does.
    //
    // ⚠ THE BANKED JUNIOR RANK IS `null` HERE, which is the whole point: she is on no junior list,
    // the Accelerator holds nothing for her, and the rung is open anyway.
    const world = juniorWorld('acc-own-cut', 17, null)
    expect(kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)).toBeLessThanOrEqual(JUNIOR_MAX_AGE_YEARS)
    expect(acceleratorAdmits(world, world.week, 'w75', null), 'the programme holds nothing for her').toBe(false)
    expect(juniorAccessOpen(world, world.week, 'w75'), 'and the rung is hers regardless').toBe(true)
    expect(tierFloorOpen(world, 'w75'), 'the calendar agrees').toBe(true)
    // ⚠ AND IT IS THE RANK DOING IT, not a hole in the gate: the same girl one point into the table
    // is refused, so this cannot pass by the rung having stopped refusing anybody.
    const hopeless = juniorWorld('acc-own-cut-b', 17, null, OFF_THE_LIST)
    expect(tierFloorOpen(hopeless, 'w75'), 'a junior outside the cut is still shut out').toBe(false)
  })

  it('W15 has its own door, so a junior is never left with nothing', () => {
    const world = juniorWorld('acc-w15', 17, null)
    expect(juniorAccessOpen(world, world.week, 'w15')).toBe(true)
    // ...and the calendar agrees: the bottom rung stays open on the reserved-place door.
    expect(tierFloorOpen(world, 'w15')).toBe(true)
  })

  it('⚠ THE WTA\'S OWN RUNGS ARE LEFT ALONE – the table stops at W100', () => {
    const world = juniorWorld('acc-wta', 17, null)
    for (const t of ['wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as const) {
      expect(W_SERIES.includes(t), `${t} is not a W-series event`).toBe(false)
      expect(juniorAccessOpen(world, world.week, t), `${t} is not the Accelerator's business`).toBe(true)
    }
  })
})

// =================================================================================================
// 4. THE W15 DOOR READS A RANKING
// =================================================================================================

describe('W15 is the junior reserved place, and it reads a junior RANKING', () => {
  it('⚠ THE SAME POINT TOTAL, TWO FIELDS, TWO ANSWERS – which the point band could not say', () => {
    // Both girls hold the IDENTICAL ITF book, comfortably past the 120 points the retired band asked
    // for. The only difference is the field around them – which is the whole of what a ranking is,
    // and the whole of what a point total cannot see.
    const strong = createWorld('w15-rank-strong')
    // The cohort's prehistory is stripped so she really is at the top of the table; without this a
    // fresh world already carries three seasons of rival results (season/prehistory.ts).
    strong.results = strong.results.filter((r) => r.playerId === KID_ID)
    strong.results.push({ playerId: KID_ID, week: strong.week, points: 150, tier: 'j60' })
    recomputeKidRank(strong)

    const buried = createWorld('w15-rank-buried')
    buried.results.push({ playerId: KID_ID, week: buried.week, points: 150, tier: 'j60' })
    for (const p of buried.cohort) {
      buried.results.push({ playerId: p.id, week: buried.week, points: 400, tier: 'j300' })
    }
    recomputeKidRank(buried)

    expect(kidPoints(strong, 'itf'), 'the same book').toBe(kidPoints(buried, 'itf'))
    expect(kidPoints(strong, 'itf'), 'and both clear the retired 120-point band').toBeGreaterThanOrEqual(120)
    expect(strong.kidRank, 'top of the table').toBeLessThanOrEqual(juniorReservedRank(tableSize(strong, 'itf')))
    expect(buried.kidRank, 'the whole cohort above her').toBeGreaterThan(juniorReservedRank(tableSize(buried, 'itf')))
    expect(tierFloorOpen(strong, 'w15'), 'the reserved place takes her').toBe(true)
    expect(tierFloorOpen(buried, 'w15'), 'and refuses the identical book in a stronger field').toBe(false)
  })

  it('⚠ UNRANKED IS NOT RANK ONE – a fresh fourteen-year-old does not walk onto the pro tour', () => {
    const world = createWorld('w15-unranked')
    // With every ITF row removed the whole field ties at zero, and competition ranking hands every
    // member of a tie the same number – so she reads #1 on a table nobody has a place in.
    world.results = world.results.filter((r) => r.tier === undefined || r.tier === 'local')
    recomputeKidRank(world)
    expect(kidPoints(world, 'itf'), 'she holds no ITF point').toBe(0)
    expect(world.kidRank, 'and the tie at zero reads as the top of the list').toBeLessThanOrEqual(
      juniorReservedRank(tableSize(world, 'itf')),
    )
    expect(tierFloorOpen(world, 'w15'), 'a tie at zero is not an acceptance list').toBe(false)
  })

  it('the latch still holds the door open once she has crossed it', () => {
    const world = createWorld('w15-latch')
    world.onRampCleared = { itf: true, wta: true }
    expect(tierFloorOpen(world, 'w15'), 'set once, never cleared').toBe(true)
  })
})

// =================================================================================================
// 5. THE CALENDAR AND THE TURNSTILE AGREE
// =================================================================================================

describe('R10-5: one rule, two surfaces', () => {
  it('⚠ a rung the Accelerator shuts is shut at the door too, and the refusal names the rule', () => {
    // OFF_THE_LIST: a rung shuts on a junior only when BOTH doors are shut – her own rank and the
    // reserved place. With the default book she clears W75's cut and the calendar is right to open.
    const world = juniorWorld('acc-r105', 17, null, OFF_THE_LIST)
    const ev = injectEvent(world, world.week + 3, 'w75')
    expect(tierFloorOpen(world, 'w75'), 'the calendar says shut').toBe(false)
    const gate = entryStatus(world, ev)
    expect(gate.level, 'and so does the turnstile').toBe('blocked')
    expect(gate.detail ?? '', 'the refusal names the programme and her standing').toMatch(/junior/i)
  })

  it('⚠ THE SWEEP: no rung, at any junior standing, is open on one surface and shut on the other', () => {
    for (const juniorRank of [null, 1, 3, 8, 15, 40] as const) {
      const world = juniorWorld(`acc-sweep-${juniorRank}`, 17, juniorRank)
      // A season part-spent, so the allowance arm is exercised as well as the row arm.
      spend(world, 'w50', 1)
      spend(world, 'w75', 1)
      for (const tier of W_SERIES) {
        if (TIERS[tier].minAgeYears !== undefined && TIERS[tier].minAgeYears! > 17) continue
        const ev = injectEvent(world, world.week + 3, tier)
        const calendar = tierFloorOpen(world, tier)
        const door = entryStatus(world, ev)
        // The turnstile carries availability as well as the ladder, so the implication runs one way:
        // a rung the calendar shuts must never be enterable. (The reverse is `caution`/`blocked` for
        // fatigue and weeks off, which is not this file's subject.)
        if (!calendar) {
          expect(door.level, `${juniorRank} / ${tier}`).toBe('blocked')
        }
      }
    }
  })
})

// =================================================================================================
// 6. THE MUTATION CHECK – the rule has to be able to bite
// =================================================================================================

describe('the table is load-bearing', () => {
  it('⚠ emptying the Accelerator shuts every rung above W15 for a junior, and restoring it reopens them', () => {
    // Mutate the thing the file claims to cover and watch the verdict move – a rule that cannot be
    // switched off is a rule this suite is not actually testing.
    // OFF_THE_LIST: with the default book her own rank opens W75 and emptying the table would move
    // nothing – the mutation has to bite on the arm it is aimed at, which is the reserved place.
    const world = juniorWorld('acc-mutate', 17, 1, OFF_THE_LIST)
    expect(tierFloorOpen(world, 'w75'), '#1 holds W75 places her rank does not').toBe(true)
    const rows = ACCELERATOR.rows
    try {
      ACCELERATOR.rows = [{ throughRank: Number.MAX_SAFE_INTEGER, pools: [] }]
      expect(tierFloorOpen(world, 'w75'), 'with no places, the same girl is refused').toBe(false)
    } finally {
      ACCELERATOR.rows = rows
    }
    expect(tierFloorOpen(world, 'w75'), 'and the restore puts her back').toBe(true)
  })
})
