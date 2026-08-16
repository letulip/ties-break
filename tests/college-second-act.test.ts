// ⭐⭐ P5 – WHAT IS BEHIND THE DOOR: the college years, the early return, and the one week that is
// not hers (docs/specs/college-as-a-second-act-2026-08.md).
//
// WHAT THIS FILE IS ABOUT. Before this phase the college answer spent 208 weeks in a single command
// and handed back a twenty-two-year-old with a line of text. Three things are asserted here and each
// of them is a property rather than a string:
//
//   1. THE FREEZE IS SPENT ONE YEAR AT A TIME AND SHE MAY LEAVE. Reality's own case is one year and
//      not four, so the shape of the block was wrong as well as its content. The early return is a
//      real command, refused engine-side before the first year is spent.
//   2. THE CALL-UP COSTS THE MAIN STREAM NOTHING AND PAYS HER NOTHING. It draws on
//      `seed:callup:<week>`, a purpose-scoped sub-stream (CLAUDE.md invariant 2), and it awards
//      neither ranking points nor money because the sport awards neither – so it may never appear in
//      `world.results` and may never move a rank.
//   3. INPUT-INDEPENDENCE SURVIVES ALL OF IT. `tests/ending.test.ts` already proves that going to
//      college cannot move the MAIN sequence; this file proves the same of the years INSIDE it, one
//      call at a time, because the number of commands changed and the property must not have.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  advanceWeeks,
  tickWeek,
  answerFork,
  resumeFromCollege,
  endCollegeEarly,
  collegeEpilogueLine,
  inCollege,
  buildEndingView,
  toSnapshot,
} from '../src/engine/world'
import { NATIONAL_TEAM, callUpLine, rollCallUp, rubberWinChance } from '../src/engine/nationalTeam'
import { rngFromSeed, initMainState } from '../src/engine/rng'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'

function freshWorld(seed = 'p5-college'): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  return { world, rng: rngFromSeed(world.seed) }
}

/** A career standing at the fork with the college answer available. */
function atTheFork(seed: string): { world: WorldState; rng: Rng } {
  const { world, rng } = freshWorld(seed)
  world.fork = { askedWeek: world.week, answer: null }
  return { world, rng }
}

// =================================================================================================
// 1. FOUR YEARS, ONE AT A TIME – AND SHE MAY LEAVE AFTER ANY OF THEM
// =================================================================================================
describe('P5 – the college years are lived one at a time', () => {
  it('⭐ each call spends exactly one year and re-latches the ending with the next one', () => {
    const { world, rng } = atTheFork('p5-one-year')
    const from = world.week
    answerFork(world, 'college')
    // The ending the FORK writes already points one year out, not four – that single expression is
    // the whole of "one at a time".
    expect(world.ending!.resumesWeek).toBe(from + WEEKS_PER_YEAR)

    resumeFromCollege(world, rng)
    expect(world.week).toBe(from + WEEKS_PER_YEAR)
    expect(world.college!.years).toHaveLength(1)
    expect(world.ending?.type, 'the latch goes back on, so the question can be asked').toBe('college')
    expect(world.ending!.resumesWeek).toBe(from + 2 * WEEKS_PER_YEAR)
    expect(inCollege(world), 'still on the scholarship').toBe(true)
  }, 60_000)

  it('⭐ THE EARLY RETURN: she leaves after one year and the career resumes there', () => {
    // The sport's own case. Diana Shnaider left NC State after about a season.
    const { world, rng } = atTheFork('p5-early-return')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    const leftAt = world.week
    endCollegeEarly(world)
    expect(world.ending, 'the latch comes off for good').toBeNull()
    expect(world.college!.doneWeek).toBe(leftAt)
    // ⚠ `untilWeek` MOVES BACK rather than a second flag being set – that is what makes `inCollege`
    // false, and it is what keeps all six of the freeze's guards answering with one rule.
    expect(world.college!.untilWeek).toBe(leftAt)
    expect(inCollege(world), 'the freeze is over').toBe(false)
    expect(world.college!.years).toHaveLength(1)
  }, 60_000)

  it('⚠ she may NOT leave a year she has not spent, and the engine is the gate', () => {
    // CLAUDE.md invariant 1: the worker is not the gate. The screen stops drawing the button and
    // this is what makes that a rule rather than a decoration.
    const { world } = atTheFork('p5-no-zero-exit')
    answerFork(world, 'college')
    expect(() => endCollegeEarly(world)).toThrow(/not spent a year/)
  })

  it('⚠ and neither command works on a career that is not on the college branch', () => {
    const { world, rng } = freshWorld('p5-not-college')
    expect(() => resumeFromCollege(world, rng)).toThrow(/not at college/)
    expect(() => endCollegeEarly(world)).toThrow(/not at college/)
  })

  it('the fourth year needs no question: it finishes the course and clears the latch itself', () => {
    const { world, rng } = atTheFork('p5-full-course')
    answerFork(world, 'college')
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(world, rng)
    expect(world.ending).toBeNull()
    expect(world.college!.years).toHaveLength(ENDINGS.collegeYears)
    expect(inCollege(world)).toBe(false)
  }, 90_000)

  it('⚠ the year card is measured at BOTH ENDS, because nothing else in the save can rebuild it', () => {
    // `pruneResults` deletes a result 52 weeks after it happened and `financeWeeks` keeps a 60-week
    // window, so by the fourth year's card the first year's rank and balance are simply gone. The
    // row is a new FACT – the same argument `CareerTotals` makes.
    const { world, rng } = atTheFork('p5-year-card')
    const fundsBefore = world.fundsCents
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    const year = world.college!.years[0]
    expect(year.index).toBe(1)
    expect(year.untilWeek - year.fromWeek).toBe(WEEKS_PER_YEAR)
    expect(year.startSkill).toBeGreaterThan(0)
    expect(year.endSkill).toBeGreaterThanOrEqual(year.startSkill)
    expect(year.fundsDeltaCents).toBe(world.fundsCents - fundsBefore)
  }, 60_000)
})

// =================================================================================================
// 2. THE VIEW THE SCREEN IS ALLOWED TO SEE
// =================================================================================================
describe('P5 – the college progress view', () => {
  it('is null on every ending that is not an open college question', () => {
    const { world, rng } = atTheFork('p5-view-null')
    answerFork(world, 'college')
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(world, rng)
    // She is out: no ending, so no view at all.
    expect(buildEndingView(world)).toBeNull()
  }, 90_000)

  it('⚠ `final` means THE NEXT YEAR IS THE LAST ONE, and it is false until it is', () => {
    const { world, rng } = atTheFork('p5-view-final')
    answerFork(world, 'college')
    expect(buildEndingView(world)!.college!.yearsDone).toBe(0)
    expect(buildEndingView(world)!.college!.final, 'four years still to run').toBe(false)
    for (let y = 1; y < ENDINGS.collegeYears; y++) {
      resumeFromCollege(world, rng)
      const view = buildEndingView(world)!.college!
      expect(view.yearsDone).toBe(y)
      expect(view.totalYears).toBe(ENDINGS.collegeYears)
      expect(view.last!.index).toBe(y)
      expect(view.final, `after year ${y}`).toBe(y + 1 >= ENDINGS.collegeYears)
    }
  }, 90_000)

  it('the snapshot carries it, so a reload lands back on the same question', () => {
    const { world, rng } = atTheFork('p5-view-snapshot')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    const snap = toSnapshot(world)
    expect(snap.ending!.college).not.toBeNull()
    expect(snap.ending!.college!.yearsDone).toBe(1)
  }, 60_000)
})

// =================================================================================================
// 3. THE ONE WEEK THAT IS NOT HERS – AND IT PAYS NOTHING, IN BOTH CURRENCIES
// =================================================================================================
describe('P5 – the national-team call-up', () => {
  it('⭐⭐ pays NO ranking points and NO money: it never touches results, entries or funds', () => {
    // Research §0.4 / §5.5 / §5.6: no player ranking-points provision anywhere in the competition's
    // regulations, no row in the WTA chart, and player prize money "For the Finals only". A week
    // that awards neither is not a tournament, and `finalizeTournament`'s "a result cannot award one
    // without the other" invariant is therefore not being bent – there is no result.
    const { world, rng } = atTheFork('p5-callup-pays-nothing')
    answerFork(world, 'college')
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(world, rng)
    const calls = world.college!.years.filter((y) => y.callUp !== null)
    expect(calls.length, 'at least one letter over four years').toBeGreaterThan(0)
    // ⚠ HERS, not the ledger's length: the AI field plays every week of those years and its rows are
    // the whole point of the world still ticking. What must be empty is HER column.
    expect(world.results.filter((r) => r.playerId === 'KID')).toHaveLength(0)
    expect(world.entries).toHaveLength(0)
  }, 90_000)

  it('⚠ it fires ONLY inside the freeze – a career on the tour never sees one', () => {
    // The scope decision, asserted rather than asserted-in-a-comment. The competition's real minimum
    // age is fourteen, so she is eligible for it every year of her career; a call-up week ON THE
    // TOUR would displace a paying week, which is a balance change P6's re-measure owns.
    const { world, rng } = freshWorld('p5-callup-tour-only')
    advanceWeeks(world, rng, 3 * WEEKS_PER_YEAR)
    const news = world.events.filter((e) => e.text.includes(NATIONAL_TEAM.label))
    expect(news, 'three seasons on the tour and not one letter').toHaveLength(0)
  }, 90_000)

  it('⚠ it lands in the record with `keep: true`, so the album still has it four years later', () => {
    const { world, rng } = atTheFork('p5-callup-record')
    answerFork(world, 'college')
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(world, rng)
    const rows = world.events.filter((e) => e.text.includes(NATIONAL_TEAM.label))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.type).toBe('milestone')
      expect(row.keep).toBe(true)
    }
  }, 90_000)

  it('⚠ the same seed gives the same weeks, and a REPLAY of the same week is identical', () => {
    // The sub-stream is re-derived at the call site and persists nothing, so the same `(seed, week)`
    // is the same letter however many times it is asked.
    const a = rollCallUp({ ageYears: 20, skillMean: 60 }, rngFromSeed('x:callup:333'))
    const b = rollCallUp({ ageYears: 20, skillMean: 60 }, rngFromSeed('x:callup:333'))
    expect(a).toEqual(b)
  })

  it('⚠ FOUR DRAWS ALWAYS, whether or not the letter comes – the count cannot depend on the outcome', () => {
    // The same post-draw discipline the sponsor gift keeps. Counted through a wrapper, over enough
    // seeds that both branches are certainly represented.
    let called = 0
    let notCalled = 0
    for (let week = 0; week < 200; week++) {
      const inner = rngFromSeed(`count:callup:${week}`)
      let pulls = 0
      const counting: Rng = () => {
        pulls++
        return inner()
      }
      const out = rollCallUp({ ageYears: 20, skillMean: 60 }, counting)
      expect(pulls, `week ${week}`).toBe(4)
      if (out) called++
      else notCalled++
    }
    expect(called, 'both branches were exercised').toBeGreaterThan(0)
    expect(notCalled, 'both branches were exercised').toBeGreaterThan(0)
  })

  it('⚠ nobody under the real minimum age is ever called', () => {
    // §5.7, Reg 13.1.1. Fourteen, reached by the first day of the tie.
    for (let week = 0; week < 60; week++) {
      const out = rollCallUp(
        { ageYears: NATIONAL_TEAM.minAgeYears - 1, skillMean: 90 },
        rngFromSeed(`young:callup:${week}`),
      )
      expect(out).toBeNull()
    }
  })

  it('⚠ her nation\'s finish is NOT about her – the strongest player draws the same spread', () => {
    // Research §11.1.2: "Nothing else we model pays her on somebody else's result." Here the payment
    // is zero either way, which is the sharper version of the same point.
    const strong: number[] = []
    const weak: number[] = []
    for (let week = 0; week < 400; week++) {
      const s = rollCallUp({ ageYears: 22, skillMean: 95 }, rngFromSeed(`n:callup:${week}`))
      const w = rollCallUp({ ageYears: 22, skillMean: 20 }, rngFromSeed(`n:callup:${week}`))
      if (s) strong.push(s.nationFinish)
      if (w) weak.push(w.nationFinish)
    }
    expect(strong.length).toBeGreaterThan(50)
    expect(strong, 'identical draws, identical placings').toEqual(weak)
  })

  it('the rubber chance moves with her and is bounded at both ends', () => {
    expect(rubberWinChance(NATIONAL_TEAM.rubber.standard)).toBeCloseTo(0.5, 6)
    expect(rubberWinChance(0)).toBe(NATIONAL_TEAM.rubber.floor)
    expect(rubberWinChance(100)).toBe(NATIONAL_TEAM.rubber.ceiling)
    expect(rubberWinChance(70)).toBeGreaterThan(rubberWinChance(50))
  })

  it('⚠ the line says the two things that make the week what it is, and grades nothing', () => {
    const line = callUpLine({ rubbersPlayed: 2, rubbersWon: 1, nationFinish: 11 })
    expect(line).toContain('no declining it')
    expect(line).toContain('No prize money and no ranking points')
    // The album's own rule (career-contract-v1.md §6): the game never grades her.
    expect(line.toLowerCase()).not.toMatch(/unlucky|deserved|brave|sadly|at least|but /)
    // And the bench case is stated rather than hidden – research §5.7: representation is deemed to
    // occur on nomination, not on playing.
    expect(callUpLine({ rubbersPlayed: 0, rubbersWon: 0, nationFinish: 3 })).toContain('never took the court')
  })

  it('⚠ names are FICTIONAL – no trademark is constructible from the label', () => {
    // CLAUDE.md Style: ITF/WTA/ATP and the real competitions are trademarks.
    const label = NATIONAL_TEAM.label.toLowerCase()
    for (const word of ['billie', 'jean', 'king', 'davis', 'itf', 'wta', 'atp', 'olympic', 'united cup']) {
      expect(label, `"${word}" must not appear in a shipped event name`).not.toContain(word)
    }
  })
})

// =================================================================================================
// 4. WHAT SHE COMES BACK WITH – MEASURED, NOT ASSERTED
// =================================================================================================
describe('P5 – the epilogue line', () => {
  it('⚠ it no longer says "four years" after one, and it never says "a degree" she has not got', () => {
    const { world, rng } = atTheFork('p5-epilogue-early')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    endCollegeEarly(world)
    const line = world.events.filter((e) => e.type === 'milestone').at(-1)!.text
    expect(line).toContain('1 year of student tennis')
    expect(line).not.toContain('Four years')
    expect(line.toLowerCase()).not.toContain('degree')
  }, 60_000)

  it('states the money, because that is the one thing the years demonstrably did', () => {
    const { world, rng } = atTheFork('p5-epilogue-money')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    const line = collegeEpilogueLine(world)
    expect(line).toMatch(/\$[\d,]+ better off/)
    expect(line).toMatch(/qualifying/)
  }, 60_000)

  it('⚠ and it reports the CALL-UPS honestly, including none at all', () => {
    const { world, rng } = atTheFork('p5-epilogue-calls')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    world.college!.years = world.college!.years.map((y) => ({ ...y, callUp: null }))
    expect(collegeEpilogueLine(world)).toContain('Her country never called')
  }, 60_000)
})

// =================================================================================================
// 5. THE PROPERTY THAT MAY NOT MOVE – INPUT-INDEPENDENCE
// =================================================================================================
describe('⚠ P5 – the college years cost the MAIN stream nothing', () => {
  it('a year at college taps exactly as many MAIN draws as a year of the same weeks anywhere else', () => {
    // CLAUDE.md invariant 2. The call-up rides `seed:callup:<week>` and every other new step is pure
    // state, so a career that answered "college" and a career that did not must be in the SAME
    // position on the MAIN stream after the same number of weeks.
    const college = createWorld('p5-independence', { ...DEFAULT_PROFILE })
    const control = createWorld('p5-independence', { ...DEFAULT_PROFILE })
    college.rngMain = initMainState(college.seed)
    control.rngMain = initMainState(control.seed)

    const rngA = rngFromSeed(college.seed)
    const rngB = rngFromSeed(control.seed)

    college.fork = { askedWeek: college.week, answer: null }
    answerFork(college, 'college')
    resumeFromCollege(college, rngA)
    for (let i = 0; i < WEEKS_PER_YEAR; i++) tickWeek(control, rngB)

    expect(college.week).toBe(control.week)
    // The two streams have been pulled the same number of times: the next value off each is equal.
    expect(rngA()).toBe(rngB())
  }, 60_000)
})
