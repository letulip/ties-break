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
import { NATIONAL_TEAM, binomial, callUpLine, rollCallUp, rubberWinChance } from '../src/engine/nationalTeam'
import { rngFromSeed, initMainState } from '../src/engine/rng'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { COLLEGE_TIERS, collegeOfferFor } from '../src/engine/collegeOffer'
import { coachFactor } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { growWeek, type KidSkills } from '../src/engine/development'
import { coachWorksThisWeek } from '../src/engine/world'
import { COLLEGE_TRIP_WEEKS, collegeCoachFactor, collegeMatchesThisWeek } from '../src/engine/world/college'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CollegeTier } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'

function freshWorld(seed = 'p5-college'): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  return { world, rng: rngFromSeed(world.seed) }
}

/** A career standing at the fork with the college answer available. */
function atTheFork(seed: string): { world: WorldState; rng: Rng } {
  const { world, rng } = freshWorld(seed)
  world.fork = { askedWeek: world.week, answer: null, offer: null }
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

  it('⚠ the rubbers are a REAL binomial – every one of them has the same chance', () => {
    // The shortcut this replaced – one uniform against `played` growing thresholds – flattered her:
    // the second and third rubbers came out easier than the first. Measured over the whole [0,1)
    // interval, each rubber's marginal must be `p` and the count must be monotone in the uniform.
    const p = 0.4
    const n = 3
    const steps = 20_000
    let total = 0
    let previous = -1
    for (let i = 0; i < steps; i++) {
      const k = binomial(n, p, i / steps)
      expect(k, 'monotone in the uniform, so a luckier draw is never worse').toBeGreaterThanOrEqual(previous)
      previous = k
      total += k
    }
    // E[wins] = n*p, to within the discretisation of the sweep.
    expect(total / steps).toBeCloseTo(n * p, 2)
    // And the degenerate ends are exact rather than nearly right.
    expect(binomial(0, p, 0.9)).toBe(0)
    expect(binomial(3, 1, 0)).toBe(3)
    expect(binomial(3, 0, 0.999999)).toBe(0)
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
    expect(line).toMatch(/[Qq]ualifying/)
  }, 60_000)

  it('⚠ THE SIGN IS A DIFFERENT SENTENCE: a family further under water is not "worse better off"', () => {
    const { world, rng } = atTheFork('p5-epilogue-debt')
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    world.college!.years = world.college!.years.map((y) => ({ ...y, fundsDeltaCents: -412_300 }))
    const line = collegeEpilogueLine(world)
    expect(line).toContain('$4,123 further under')
    expect(line).not.toContain('better off')
    expect(line).not.toContain('worse better')
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

    college.fork = { askedWeek: college.week, answer: null, offer: null }
    answerFork(college, 'college')
    resumeFromCollege(college, rngA)
    for (let i = 0; i < WEEKS_PER_YEAR; i++) tickWeek(control, rngB)

    expect(college.week).toBe(control.week)
    // The two streams have been pulled the same number of times: the next value off each is equal.
    expect(rngA()).toBe(rngB())
  }, 60_000)
})

// =================================================================================================
// ⭐⭐ ROUND 21 #5 – THE COLLEGE SEASON IS TWO TRIPS, NOT THIRTEEN WEEKS
// =================================================================================================
//
// ⚠⚠ THE SHRINK NEEDS A GUARD BECAUSE THE THING IT PROTECTS IS A DESIGN RULING AND NOT A NUMBER.
// College is the SHORTCUT – «1-2 национальных выезда в год и перелистывание 1 года за клик» – and a
// thirteen-week dual-match season at one to three matches a week is a playable season inside the one
// branch that exists to be a page-turn, in weeks the parent is not at and cannot act on. Nothing
// tested `COLLEGE_MATCH_SEASON` at all when it shipped, so it could have grown back silently.
//
// ⚠ AND IT IS A COUNT AND NOTHING ELSE. `collegeMatchesThisWeek` feeds `growWeek`; it writes no
// result row, awards no ranking points and no money, because the sport awards neither – so a result
// for it would break the `prizeCentsFor` invariant to no purpose.

/** A career enrolled at a named place, with the offer the ledger and the season both read. */
function enrolledAt(tier: CollegeTier, seed = 'r21-trips'): WorldState {
  const { world, rng } = freshWorld(seed)
  const offer = collegeOfferFor(
    {
      juniorBests: { j300: 3 },
      juniorTitles: 4,
      background: 'middle',
      country: 'US',
      familyIncomeCents: 31_000_00,
      familyAssetsCents: 40_000_00,
    },
    rngFromSeed(`${seed}:offer`),
  )
  world.fork = { askedWeek: world.week, answer: null, offer }
  answerFork(world, 'college', tier)
  void rng
  return world
}

/** the first season boundary at or after enrolment, so a season week can be addressed directly */
const yearStart = (world: WorldState) => world.college!.fromWeek - (world.college!.fromWeek % WEEKS_PER_YEAR) + WEEKS_PER_YEAR

describe('⭐⭐ the college season is two national trips a year', () => {
  it('plays her only on the trip weeks, and at the place\'s own rate', () => {
    const world = enrolledAt('private')
    const base = yearStart(world)
    const played: number[] = []
    for (let s = 0; s < WEEKS_PER_YEAR; s++) {
      world.week = base + s
      played[s] = collegeMatchesThisWeek(world)
    }
    for (const w of COLLEGE_TRIP_WEEKS) {
      expect(played[w], `trip week ${w} at the private place`).toBe(COLLEGE_TIERS.private.matchesPerWeek)
    }
    const busy = played.map((n, i) => (n > 0 ? i : -1)).filter((i) => i >= 0)
    expect(busy, 'and no other week of the season is a match week').toEqual([...COLLEGE_TRIP_WEEKS])
  })

  it('⚠ the cheap place plays fewer on the same weeks – the tier still differs', () => {
    const cheap = enrolledAt('state')
    const dear = enrolledAt('private')
    const w = COLLEGE_TRIP_WEEKS[0]
    cheap.week = yearStart(cheap) + w
    dear.week = yearStart(dear) + w
    expect(collegeMatchesThisWeek(cheap)).toBe(COLLEGE_TIERS.state.matchesPerWeek)
    expect(collegeMatchesThisWeek(cheap)).toBeLessThan(collegeMatchesThisWeek(dear))
  })

  // ⚠⚠ MUTATION PROOF OF THE SHRINK ITSELF, AND THE FIRST VERSION OF IT WAS VACUOUS – recorded
  // because it is the exact failure CLAUDE.md names. It skipped any week that is IN
  // `COLLEGE_TRIP_WEEKS`, so restoring the thirteen-week block `[4, 17)` skipped every candidate and
  // the case passed green on the very configuration it exists to forbid. **A guard derived from the
  // constant it guards cannot fail.** So the count is pinned against HIS OWN NUMBER – «1-2
  // национальных выезда в год» – and the old block's weeks are written out as literals.
  it('⚠⚠ is at most his two trips, and the thirteen-week block cannot come back', () => {
    expect(COLLEGE_TRIP_WEEKS.length, 'one or two national trips a year, and no more').toBeLessThanOrEqual(2)
    const world = enrolledAt('private')
    const base = yearStart(world)
    // the old block was `{ fromSeasonWeek: 4, toSeasonWeek: 17 }` – thirteen consecutive weeks
    let matchWeeks = 0
    for (let w = 4; w < 17; w++) {
      world.week = base + w
      if (collegeMatchesThisWeek(world) > 0) matchWeeks += 1
    }
    expect(matchWeeks, 'the old thirteen-week block is not a season any more').toBeLessThanOrEqual(2)
  })

  it('⚠ neither trip is the national-team week, so three weeks of tennis read as three beats', () => {
    expect(COLLEGE_TRIP_WEEKS as readonly number[]).not.toContain(NATIONAL_TEAM.seasonWeek)
  })

  it('⚠ and a girl who is not at college plays none of them', () => {
    const world = enrolledAt('private')
    const base = yearStart(world)
    world.college = null
    world.week = base + COLLEGE_TRIP_WEEKS[0]
    expect(collegeMatchesThisWeek(world)).toBe(0)
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 21 – THE PROGRAMME COACHES HER, AND THE FAMILY IS STILL NOT PAYING FOR IT
// =================================================================================================
//
// The owner's ruling of 17.08: «да, она училась и работала, мы точно знаем на сколько за каждый год в
// колледже надо прибавить». What this block guards is not the SIZE of that – the three rungs are ours
// and §10 of `the-college-answers-2026-08.md` says so – but the two properties that make the size
// safe to tune:
//
//   1. THE DIMENSION IS INDEPENDENT OF THE CALENDAR. It rides on `coachesAt`, not on the trip count,
//      so a future change to `COLLEGE_TRIP_WEEKS` cannot zero it again the way the season shrink did.
//   2. ⚠⚠ THE BILL DOES NOT MOVE WITH THE RATE. Everywhere else in this game those two are one
//      predicate (`coachWorksThisWeek`, and its own comment says why). Here they must come apart,
//      because the scholarship's whole economic point is that the family stops paying – so a coach
//      fee appearing during the freeze is the regression this block exists to catch.
describe('⭐⭐⭐ the college programme coaches her, and the family is not billed for it', () => {
  it('⭐ coaches her at the place\'s own rung, and a dearer place coaches her better', () => {
    const cheap = enrolledAt('state')
    const middle = enrolledAt('national')
    const dear = enrolledAt('private')
    const f = (w: WorldState) => collegeCoachFactor(w)!
    expect(f(cheap)).toBe(coachFactor('budget', 'good'))
    expect(f(middle)).toBe(coachFactor('middle', 'good'))
    expect(f(dear)).toBe(coachFactor('high', 'good'))
    expect(f(cheap)).toBeLessThan(f(middle))
    expect(f(middle)).toBeLessThan(f(dear))
  })

  // ⚠⚠ AND IT BEATS THE RATE SHE USED TO GET, WHICH IS THE DEFECT THIS FIXES. Before round 21 the
  // college weeks passed `coach: null`, so `growWeek` developed her at `self` – the parent on the
  // court – for a girl at a university with a squad. Even the cheapest place is above that now.
  it('⭐⭐ every place develops her faster than the parent-on-the-court rate she used to get', () => {
    const self = coachFactor('self', ECONOMY.coach.selfFit)
    for (const tier of ['state', 'national', 'private'] as const) {
      expect(collegeCoachFactor(enrolledAt(tier))!, `${tier} against self`).toBeGreaterThan(self)
    }
  })

  // ⚠ THE TOP RUNG IS DELIBERATELY NOT REACHED – a university programme is not better than the best
  // coach in the world, and `elite` stays something only money on tour buys.
  it('⚠ and none of them reaches the elite rung', () => {
    const elite = coachFactor('elite', 'good')
    for (const tier of ['state', 'national', 'private'] as const) {
      expect(collegeCoachFactor(enrolledAt(tier))!, `${tier} against elite`).toBeLessThan(elite)
    }
  })

  // ⚠⚠ THE OWNER'S RULING, GUARDED. «the family stops paying» – so the rate moves and the bill does
  // not. `coachWorksThisWeek` is what the retainer reads and it must stay false for every week of the
  // freeze, however good the coaching is.
  it('⚠⚠ charges the family no coach fee for any of it', () => {
    const world = enrolledAt('private')
    const base = yearStart(world)
    for (const w of [0, 8, 20, 40]) {
      world.week = base + w
      expect(coachWorksThisWeek(world), `season week ${w}`).toBe(false)
    }
    expect(collegeCoachFactor(world), 'and she is still being coached in that same week').toBeDefined()
  })

  it('⚠ is silent outside college, and on a career that was never quoted a place', () => {
    const world = enrolledAt('private')
    const base = yearStart(world)
    world.week = base + 8
    expect(collegeCoachFactor(world)).toBeDefined()
    const migrated = enrolledAt('private')
    migrated.week = base + 8
    migrated.fork = { ...migrated.fork!, offer: null }
    expect(collegeCoachFactor(migrated), 'a v51 career was never quoted a place').toBeUndefined()
    world.college = null
    expect(collegeCoachFactor(world), 'and a girl on tour is coached by whoever she hired').toBeUndefined()
  })

  // ⚠⚠ AND THE OVERRIDE IS INERT WHERE IT IS NOT SUPPLIED, which is what keeps every shipped career's
  // growth byte-identical. Mutation-proved in the same case: hand it a different factor and the same
  // week produces different skills, so the `undefined` branch is not passing vacuously.
  it('⚠⚠ leaves every non-college week byte-identical, and really does bite when supplied', () => {
    const args = {
      skills: { serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 } as KidSkills,
      potential: { serve: 90, ret: 90, composure: 90, stamina: 90, groundstrokes: 90 } as KidSkills,
      ageYears: 20,
      plan: WEEK_PLAN_PRESETS.balanced,
      coach: null,
      playStyle: 'all-court' as const,
      matchesThisWeek: 0,
      seed: 'override-inert',
      week: 300,
    }
    expect(growWeek(args), 'undefined is the historical path').toEqual(growWeek({ ...args, coachFactorOverride: undefined }))
    const coached = growWeek({ ...args, coachFactorOverride: coachFactor('high', 'good') })
    expect(coached.serve, 'a high-rung programme develops her faster than the parent does').toBeGreaterThan(
      growWeek(args).serve,
    )
  })
})
