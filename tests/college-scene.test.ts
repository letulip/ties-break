// THE COLLEGE SCENE – THE GRADUATE'S SHELF (T1) AND THE STUDENT CABINET ON THE HANDOVER (T4).
//
// The spec is docs/specs/the-college-scene-2026-09.md; the rulings this file is built against are
// docs/plans/college-scene-rulings-2026-09.md, and TWO OF THEM OVERTURN THE SPEC. Where a case below
// pins something the spec's prose does not say, the ruling it obeys is named at the case.
//
// ⚠⚠ THE CAREERS HERE ARE **POSED**, not lived, and that is a deliberate departure from
// tests/wave10-handover.test.ts's own law («every career in this file is LIVED»). The reason is the
// STATE, not the cost: a graduate with a thin account is a four-year scholarship followed by no tour
// earnings at all, and the econ walker's policies answer the fork by playing on. What is under test
// is a pure read of `world.college` and `world.kidFundsCents` – `dynastyHandoverOf` draws nothing –
// so posing the two records tests exactly the clause and nothing else. ⚠ The one thing a posed world
// must never be used for is a BAND nobody can earn, and that is why §A keeps the pure-function pin
// beside the floor: `dynastyBackgroundOf`'s own corridor arithmetic is still measured to the cent in
// wave10-handover §B, on careers that were walked.
//
// MUTATION ARMS – each applied, RUN, and reverted, with the count of what went red, because «it
// fails» is the claim and «one of six, this one» is the measurement:
//   · `dynastyBackgroundFloored`'s graduate clause stripped (`return band` unconditionally): **1 red
//     of 6** – §A's graduate, and ONLY it. ⚠ That is the arithmetic rather than a thin net: every
//     other case in §A asserts the band the UNFLOORED read already returns, so the positive case is
//     the only one that can see this mutation at all. The next arm is what keeps them honest.
//   · the `band !== 'working'` guard dropped, i.e. the floor made a MAP: **1 red** – §A's
//     floor-never-a-ceiling case, which is what stops that case being vacuous.
//   · the fold's `wonTheLeague(year.league)` -> `year.league !== null` (count every year that HELD a
//     championship): **2 red of 19** – §B1's four-shape career (3 for 2) and §B1's lost-year cell
//     (1 for 0). The leagueless cell stays green, which is correct: it is the arm the mutation keeps.
//   · the v88 -> v89 step's back-fill line deleted: **1 red** – §B2's crafted payload, and only it.
//     Every golden fixture stays green, which is the finding §B2's first case asserts.
//   · the step's `??=` -> `=` (the clobber): **1 red** – §B2's keep-branch case, which is what makes
//     the crafted payload worth crafting rather than a second copy of the back-fill case.
//   · the booth fork's two arms swapped (`collegeTitles` read before `proTitles`): **1 red** – §B3's
//     «TITLED still wins when both are set», which is what stops that case being vacuous.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, dynastyBackgroundOf, dynastyHandoverOf, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ENDINGS } from '../src/engine/ending'
import { ECONOMY } from '../src/engine/economy'
import { boothLineageLines } from '../src/viz/commentary'
import { boothLineageAt, lineageLicensed } from '../src/engine/world/spotlight'
import { DEFAULT_PROFILE, type CollegeLeagueRun, type CollegeState, type CollegeYear } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const rec = (w: unknown): Record<string, unknown> => w as unknown as Record<string, unknown>

/** A career with nothing posed on it yet – `kidFundsCents` opens at 0, which IS the working
 *  corridor, so «a thin account» needs no line of setup and cannot be mistaken for one. */
function posed(seed: string): WorldState {
  return createWorld(seed, DEFAULT_PROFILE, `c-${seed}`)
}

/** One banked college year. ⚠ EVERY NUMBER BUT `league` IS INERT HERE: the clause under test reads
 *  `years.length` and each row's `league`, so the measurements are filled with honest-looking
 *  constants rather than left out, and nothing in this file asserts on them. */
function year(index: number, league: CollegeLeagueRun | null): CollegeYear {
  return {
    index,
    fromWeek: 300 + (index - 1) * 52,
    untilWeek: 300 + index * 52,
    startSkill: 50,
    endSkill: 52,
    startRank: null,
    endRank: null,
    fundsDeltaCents: 0,
    callUp: null,
    league,
  }
}

/** A run she won / a run she lost – the draw's own round count, never a hand-typed 3. */
const titleRun = (week: number): CollegeLeagueRun => ({ week, roundsWon: 3, rounds: 3 })
const lostRun = (week: number): CollegeLeagueRun => ({ week, roundsWon: 1, rounds: 3 })

/** The college record, posed. `done` is `leaveCollege`/`finishCollege`'s own write – both set
 *  `doneWeek` – so a LEAVER and a GRADUATE differ by `years.length` alone, which is the whole point
 *  of ruling A's predicate and the reason this helper takes the two separately. */
function college(years: CollegeYear[], doneWeek: number | null): CollegeState {
  return {
    fromWeek: 300,
    untilWeek: 300 + years.length * 52,
    doneWeek,
    years,
    pendingCallUp: null,
    pendingLeague: null,
  }
}

/** The full course, banked and closed – `ENDINGS.collegeYears` rows and a `doneWeek`, never a
 *  literal four (the count is data the architect can move). */
function graduate(seed: string): WorldState {
  const world = posed(seed)
  const rows = Array.from({ length: ENDINGS.collegeYears }, (_, i) => year(i + 1, null))
  world.college = college(rows, 300 + ENDINGS.collegeYears * 52)
  return world
}

// =================================================================================================
// A. THE FLOOR – THE GRADUATE'S SHELF (T1, spec §2 as RULING A corrects it)
// =================================================================================================

describe('college scene T1 A – the graduate hands over no lower than middle', () => {
  it('⭐⭐⭐ a graduate with an empty account hands over `middle` – his «ок» of 23.09', () => {
    // «Предложение в одну строку: концовка-колледж даёт полку не ниже "середины" - ок» (23.09).
    const world = graduate('cs-t1-grad')
    expect(world.kidFundsCents, 'her own account is empty, which is the working corridor').toBe(0)
    expect(dynastyBackgroundOf(world.kidFundsCents), 'and the unfloored band says so').toBe('working')
    expect(dynastyHandoverOf(world).background, 'the degree is the shelf').toBe('middle')
  })

  it('⭐⭐⭐ THE CONTROL – the same empty account with no college behind it still hands over `working`', () => {
    // Without this case the one above measures nothing: `middle` could be a new default rather than a
    // floor. A career that never enrolled is the door exactly as it shipped.
    const world = posed('cs-t1-control')
    expect(world.college, 'no scholarship in this story').toBe(null)
    expect(dynastyHandoverOf(world).background, 'the money is the whole answer here').toBe('working')
  })

  it('⭐⭐ A FLOOR AND NEVER A CEILING – a graduate who retires wealthy stays `wealthy`', () => {
    // ⚠ THE RESERVE IS READ FROM `ECONOMY`, never typed: `dynastyBackgroundOf`'s own law is that the
    // thresholds read the constants the bands are made of, and a hand-typed 120_000_00 here would be
    // the second spelling that law exists to forbid.
    const world = graduate('cs-t1-rich')
    world.kidFundsCents = ECONOMY.startingFundsCents.wealthy
    expect(dynastyHandoverOf(world).background, 'the clause raises a band and never lowers one').toBe('wealthy')
    // ...and the band in the middle is untouched too, which is what makes it a floor rather than a map.
    world.kidFundsCents = ECONOMY.startingFundsCents.middle
    expect(dynastyHandoverOf(world).background).toBe('middle')
  })

  it('⭐⭐⭐ RULING A\'S OWN REFUSAL – she enrolled, played one year and walked: `working`', () => {
    // ⚠⚠ THE CASE THAT SAYS WHAT THE CLAUSE READS. Ruling A refuses the fork answer by name: a girl
    // who enrolled and left after a year would be priced exactly like a graduate by
    // `world.fork?.answer === 'college'`, and what the owner ruled on is «a degree and a profession» –
    // one year is neither. `leaveCollege` sets `doneWeek` just as `finishCollege` does, so this world
    // differs from §A's graduate in `years.length` ALONE and nothing but `finishedTheCourse` refuses it.
    const world = posed('cs-t1-leaver')
    world.college = college([year(1, titleRun(312))], 352)
    expect(world.college.doneWeek, 'she is out – the same write the graduate gets').not.toBe(null)
    expect(world.college.years.length, 'but the course is not finished').toBeLessThan(ENDINGS.collegeYears)
    expect(dynastyHandoverOf(world).background, 'a year of student tennis is not a degree').toBe('working')
  })

  it('⚠ ...and neither is a course still being taken – no `doneWeek`, no degree', () => {
    // The other half of the refusal, and the half the album's `graduated` occasion is gated on too:
    // four banked years with the freeze still latched is a career that has not come out yet.
    const world = posed('cs-t1-inside')
    const rows = Array.from({ length: ENDINGS.collegeYears }, (_, i) => year(i + 1, null))
    world.college = college(rows, null)
    expect(dynastyHandoverOf(world).background).toBe('working')
  })

  it('⚠⚠ `dynastyBackgroundOf` ITSELF IS UNWIDENED – the floor is a wrapper, measured as one', () => {
    // The pure function is pinned to the cent in tests/wave10-handover.test.ts §B and those pins had
    // to stay green untouched. This case states the same thing from the college side: hand it the
    // graduate's own balance and it still answers `working`, because it has never seen a college.
    expect(dynastyBackgroundOf(0), 'a pure function of cents, unchanged').toBe('working')
    expect(dynastyBackgroundOf(ECONOMY.startingFundsCents.middle - 1)).toBe('working')
    expect(dynastyBackgroundOf(ECONOMY.startingFundsCents.middle)).toBe('middle')
  })
})

// =================================================================================================
// B. THE STUDENT CABINET ON THE HANDOVER (T4, schema v89 – ruling E)
// =================================================================================================

describe('college scene T4 B1 – the fold equals the banked `wonTheLeague` count', () => {
  it('⭐⭐⭐ a multi-year career counts the years she WON and no other kind of year', () => {
    // ⚠ FOUR SHAPES IN ONE CAREER, and two of them must count ZERO – which is what makes this case a
    // measurement of the fold rather than of a loop. Year 1 she won, year 2 she lost in the
    // quarterfinal, year 3 held no championship at all (`league: null` – a v55 save migrated
    // mid-freeze or a year an ending cut short before the fixture's week, `CollegeYear.league`'s own
    // two legitimate nulls), year 4 she won again.
    const world = posed('cs-t4-fold')
    world.college = college(
      [year(1, titleRun(312)), year(2, lostRun(364)), year(3, null), year(4, titleRun(468))],
      500,
    )
    expect(dynastyHandoverOf(world).motherCareer.collegeTitles, 'two title years of four').toBe(2)
  })

  it('⚠ the two zero shapes, alone, so neither can hide behind the other', () => {
    const lost = posed('cs-t4-lost')
    lost.college = college([year(1, lostRun(312))], 352)
    expect(dynastyHandoverOf(lost).motherCareer.collegeTitles, 'a year she played is not a year she won').toBe(0)

    const leagueless = posed('cs-t4-null')
    leagueless.college = college([year(1, null), year(2, null)], 404)
    expect(dynastyHandoverOf(leagueless).motherCareer.collegeTitles, 'a year with no championship counts nothing').toBe(0)
  })

  it('⚠ a career that never enrolled counts 0 – REQUIRED, never optional, so 0 is the value and not an absence', () => {
    // Ruling E in one assertion: the field is a count, 0 is its honest value, and an optional field
    // would be a second spelling of zero.
    const world = posed('cs-t4-none')
    expect(world.college).toBe(null)
    const career = dynastyHandoverOf(world).motherCareer
    expect(career.collegeTitles).toBe(0)
    expect('collegeTitles' in career, 'the key is THERE at zero, which is what "required" buys').toBe(true)
  })

  it('⚠⚠ the student cabinet is not the pro cabinet – nothing the fold counts reaches `titles`, `proTitles` or `slams`', () => {
    // The field exists for exactly this, and `proTitles`' own lesson is that the separation has to be
    // asserted rather than described: a student championship pays no ranking points and no cheque, so
    // a career whose ONLY silverware is student silverware hands over an empty tour cabinet.
    const world = posed('cs-t4-not-pro')
    world.college = college([year(1, titleRun(312)), year(2, titleRun(364))], 404)
    const career = dynastyHandoverOf(world).motherCareer
    expect(career.collegeTitles, 'two student titles').toBe(2)
    expect(career.titles, 'and not one trophy on any shelf the album counts').toBe(0)
    expect(career.proTitles, 'and nothing at all on the tour').toBe(0)
    expect(career.slams).toBe(0)
    expect(career.bestRank, 'and no ranking, because a student field awards none').toBe(null)
  })
})

describe('college scene T4 B2 – v89, the back-fill and the corpus that cannot see it', () => {
  it('⭐⭐ every golden fixture migrates to v89 with a NULL dynasty – so the writing branch is unreachable from the corpus', () => {
    // The measured reason the crafted case below has to exist, stated as an assertion rather than in a
    // comment: `??=` versus `=` is invisible to a corpus whose every payload takes the other branch.
    const migrated = rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v88.json`, 'utf8'))))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.dynasty, 'the door is the only producer of a record, and taking it builds a NEW world').toBe(null)
  })

  it('⭐⭐⭐ the step BACK-FILLS 0 into a record a v88 save already carries – crafted, because the corpus cannot hold one', () => {
    // ⚠ NO ENGINE PATH ON THIS TREE PRODUCES THIS PAYLOAD. tests/wave10-handover.test.ts §D is the
    // precedent and the reason is verbatim: the only producer of a real record is the ending's door,
    // and taking it builds a NEW world at the current version, so the corpus back-fills `dynasty`
    // itself and never reaches inside it. This is the one thing in the repo that sees the new line.
    const carried = {
      generation: 3,
      ancestorSeed: 'crafted-root',
      raisedOnTour: true,
      motherName: { first: 'Vera', last: 'Martin' },
      motherTemperament: 'quiet',
      motherCareer: { titles: 4, proTitles: 2, bestRank: 11, slams: 0, endedWeek: 812, endingKind: 'family' },
    }
    const save = JSON.parse(readFileSync(`${SAVES}/v88.json`, 'utf8'))
    save.dynasty = JSON.parse(JSON.stringify(carried))
    const migrated = rec(migrateSave(save))
    const career = (migrated.dynasty as { motherCareer: Record<string, unknown> }).motherCareer
    expect(career.collegeTitles, 'the honest count of what a pre-v89 save recorded').toBe(0)
    // ...and NOTHING ELSE of the record moved – the back-fill is one key, not a rewrite.
    expect({ ...career, collegeTitles: undefined }, 'every sibling field survives intact').toEqual({
      ...carried.motherCareer,
      collegeTitles: undefined,
    })
    expect((migrated.dynasty as { generation: number }).generation, 'a line three generations deep survives').toBe(3)
  })

  it('⚠ the step KEEPS a count a save already holds – the `=` arm, which `||=` would also clobber at zero', () => {
    // ⚠ TWO HAZARDS IN ONE CASE. A plain `=` overwrites any stored count; `||=` overwrites a stored
    // **0** – the commonest value this key can hold – and neither is visible to the corpus. A save
    // carrying a real count can only exist once a v89 build has written one, which is tomorrow's
    // save, which is exactly why the case is crafted today.
    const save = JSON.parse(readFileSync(`${SAVES}/v88.json`, 'utf8'))
    save.dynasty = {
      generation: 2,
      ancestorSeed: 'crafted-root-2',
      raisedOnTour: false,
      motherName: { first: 'Vera', last: 'Martin' },
      motherTemperament: 'sunny',
      motherCareer: { titles: 0, proTitles: 0, collegeTitles: 3, bestRank: 40, slams: 0, endedWeek: 700, endingKind: 'college' },
    }
    const migrated = rec(migrateSave(save))
    const career = (migrated.dynasty as { motherCareer: { collegeTitles: number } }).motherCareer
    expect(career.collegeTitles, 'three student titles are hers and the upgrade does not spend them').toBe(3)
  })

  it('⚠ a NULL dynasty is left exactly null – the guard is the statement, not a defensive read', () => {
    const save = JSON.parse(readFileSync(`${SAVES}/v88.json`, 'utf8'))
    expect(save.dynasty, 'the fixture carries none').toBe(null)
    const migrated = rec(migrateSave(save))
    expect(migrated.dynasty, 'and the step does not grow her a mother').toBe(null)
  })
})

describe('college scene T4 B3 – the booth\'s third arm, INSIDE the shipped licence', () => {
  it('⭐⭐⭐ `collegeTitles 1 / proTitles 0` takes the college pool, and 0/0 falls back to KNOWN', () => {
    const collegePool = boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 1, slams: 0 })
    const known = boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 0, slams: 0 })
    expect(collegePool, 'a third true thing needs a third pool').not.toBe(known)
    expect(collegePool.length, 'one or two lines, and never one – `variant` needs something to cycle').toBe(2)
  })

  it('⭐⭐⭐ TITLED still wins when BOTH are set – the bigger claim, never the smaller one', () => {
    // ⚠ THE ORDER IS THE CLAIM. A mother with a tour cabinet AND a student one is spoken of by the
    // tour one; the student title beside it is texture the booth does not owe.
    const both = boothLineageLines({ side: 0, proTitles: 6, collegeTitles: 2, slams: 1 })
    const titled = boothLineageLines({ side: 0, proTitles: 6, collegeTitles: 0, slams: 1 })
    expect(both, 'the pro cabinet is read first').toBe(titled)
  })

  it('⚠⚠ not one college line claims a PROFESSIONAL stage, names the mother, or reads a number', () => {
    // The three rules the pool inherits, asserted rather than trusted. The win each line names is the
    // STUDENT one in as many words, which is why the register stays honest: a student title is not a
    // WTA title, and the booth may not blur them.
    for (const line of boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 1, slams: 0 }).map((f) => f('Nadia'))) {
      expect(line, `it says the win happened HERE: ${line}`).not.toMatch(/won here|won it here|won this|trophies with that name/i)
      expect(line, `it claims a tour cabinet: ${line}`).not.toMatch(/title with|tour title|trophy cabinet/i)
      expect(line, `it names the student register: ${line}`).toMatch(/student|college/i)
      expect(line, line).not.toMatch(/Alice|Martin|Vera/)
      expect(line, line).not.toMatch(/\d/)
    }
  })

  it('⚠ the ENGINE\'s licence is untouched – a mother with only a student cabinet still says nothing', () => {
    // ⚠⚠ RULING D, as the one assertion that could catch it being overturned. `lineageLicensed`'s ⚠⚠
    // is a SHIPPED ruling of the dynasty spec §2 – «A COLLEGE-FORK MOTHER LICENSES NOTHING» – and the
    // college scene's §4.3 read literally would widen it. The pool above is a fork INSIDE the licence,
    // so a mother the press never knew still buys her daughter no booth on any rung.
    const world = createWorld('cs-t4-booth', DEFAULT_PROFILE, 'c-cs-t4-booth', undefined, {
      generation: 1,
      childSeed: 'cs-t4-booth:dynasty:1',
      background: 'middle',
      raisedOnTour: false,
      motherName: { first: 'Alice', last: 'Martin' },
      motherCountry: 'US',
      childBirthdays: [],
      motherTemperament: 'sunny',
      motherCareer: { titles: 0, proTitles: 0, collegeTitles: 3, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'college' },
    })
    expect(lineageLicensed(world), 'three student titles and a career the press never saw').toBe(false)
    for (const tier of ['local', 'w15', 'wta1000', 'slam'] as const) {
      expect(boothLineageAt(world, tier), tier).toBe(null)
    }
  })

  it('⭐⭐ ...and the LIVE shape reaches it: a known mother with a student title gets the college pool', () => {
    // The career ruling D names: college at nineteen, the student title, the degree, back to the tour,
    // a WTA ranking inside the news bar. The licence opens on the RANKING (`motherWasKnown`) exactly
    // as it shipped, and the third arm is what she then has to say.
    const world = createWorld('cs-t4-live', DEFAULT_PROFILE, 'c-cs-t4-live', undefined, {
      generation: 1,
      childSeed: 'cs-t4-live:dynasty:1',
      background: 'middle',
      raisedOnTour: false,
      motherName: { first: 'Alice', last: 'Martin' },
      motherCountry: 'US',
      childBirthdays: [],
      motherTemperament: 'sunny',
      motherCareer: { titles: 0, proTitles: 0, collegeTitles: 1, bestRank: 12, slams: 0, endedWeek: 900, endingKind: 'natural' },
    })
    expect(lineageLicensed(world), 'the ranking is the licence, unchanged').toBe(true)
    const packet = boothLineageAt(world, 'slam')
    expect(packet, 'the student count rides the packet').toEqual({ proTitles: 0, collegeTitles: 1, slams: 0 })
    expect(boothLineageLines({ side: 0, ...packet! }), 'and the copy forks on it').toBe(
      boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 1, slams: 0 }),
    )
  })
})
