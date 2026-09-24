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
//   · the fold's `wonTheLeague(year.league)` -> `year.league !== null`: see §B.
//   · the v88 -> v89 step's back-fill line removed: see §B.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, dynastyBackgroundOf, dynastyHandoverOf, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ENDINGS } from '../src/engine/ending'
import { ECONOMY } from '../src/engine/economy'
import { boothLineageLines } from '../src/viz/commentary'
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
