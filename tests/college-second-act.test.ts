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
import { NATIONAL_TEAM, binomial, callUpLine, callUpOpponent, rollCallUp, rubberWinChance } from '../src/engine/nationalTeam'
import { KID_ID, callUpRubberId, callUpRubbersOf } from '../src/engine/world'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { STOP_PRECEDENCE } from '../src/shared/protocol'
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
import type { MatchPlayer } from '../src/engine/match/types'
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
    // ⚠ RE-AIMED BY THE COLLEGE WAVE, NOT WEAKENED. The competition's label now appears on TWO kinds
    // of row – the summary milestone this case was written about, and one `match` record per rubber
    // she played, because the rubbers are really played since that wave. Asserting `type` over the
    // whole filtered set therefore stopped describing anything. What the case is FOR is unchanged
    // and is now asserted twice: `keep: true` on every row, so `pruneResults` and `pruneEvents` still
    // cannot take the week away, plus the kind of each row named separately.
    const rows = world.events.filter((e) => e.text.includes(NATIONAL_TEAM.label))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(row.keep, 'every row of the week survives the prune').toBe(true)
    const summaries = rows.filter((e) => e.match === undefined)
    const rubbers = rows.filter((e) => e.match !== undefined)
    expect(summaries.length, 'one summary line per letter').toBeGreaterThan(0)
    for (const row of summaries) expect(row.type).toBe('milestone')
    for (const row of rubbers) expect(row.type).toBe('match')
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
// ⭐⭐⭐ THE COLLEGE WAVE – THE COMPETITION IS PLAYED, NOT SUMMARISED (the owner's item 3, 19.08)
// =================================================================================================
//
// «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие, т.е.
// тот же самый механизм в точности, кроме названий турниров.»
//
// The call-up, the fixture and the opponents were already here; what this block is about is that
// `binomial(n, p, u)` no longer DECIDES the rubbers. They go through `simulateMatch` under a stored
// seed, land in `world.events` as `match` rows with the record every other match in this game
// carries, and can therefore be replayed in the app's own viewer. Four properties, and the third is
// the one round 23 #16 taught:
//
//   1. THE RUBBERS ARE MATCHES. A record with a seed, two composed players and a scoreline, and
//      `rubbersWon` counted off them rather than drawn.
//   2. THE RECORD REPLAYS. `simulateMatch` is a pure function of (a, b, {surface, tour, seed}), so
//      re-running the stored one reproduces the match – which is exactly what the viewer does.
//   3. THE YEAR REPORTS IT. `resumeFromCollege` spends 52 weeks in ONE call with no player in it, so
//      a played match inside it that nothing carries out is a match nobody can watch.
//   4. IT STILL PAYS NOTHING AND COSTS NOTHING. Playing them was the ask; re-pricing the week was
//      not, and the whole reason the call-up could ship inside the freeze is that it is free.

/** Spend the whole course and hand back the first year that produced a letter. */
function collegeYearsWithACall(seed: string): { world: WorldState; stops: string[][] } {
  const { world, rng } = atTheFork(seed)
  answerFork(world, 'college')
  const stops: string[][] = []
  for (let y = 0; y < ENDINGS.collegeYears; y++) stops.push(resumeFromCollege(world, rng))
  return { world, stops }
}

describe('⭐⭐⭐ the college competition is played', () => {
  it('⭐⭐ 1. the rubbers are REAL MATCHES, and the count in the record is what happened on court', () => {
    const { world } = collegeYearsWithACall('college-rubbers-played')
    const calls = world.college!.years.filter((y) => y.callUp !== null)
    expect(calls.length, 'at least one letter over four years').toBeGreaterThan(0)
    let anyPlayed = 0
    for (const year of calls) {
      const call = year.callUp!
      const rubbers = callUpRubbersOf(world, call.week)
      expect(rubbers, `week ${call.week}: one record per rubber she played`).toHaveLength(call.rubbersPlayed)
      anyPlayed += call.rubbersPlayed
      // ⚠ THE COUNT IS DERIVED FROM THE ROWS, which is the whole of the change. Before this wave it
      // was `binomial(played, rubberWinChance(skillMean), u)` and no match existed to disagree with.
      const won = rubbers.filter((m) => m.winnerId === KID_ID).length
      expect(won, `week ${call.week}: rubbersWon is counted off the court`).toBe(call.rubbersWon)
      for (const m of rubbers) {
        expect(m.seed, 'a record with no seed cannot be replayed').toBeTruthy()
        expect(m.score, 'a real scoreline, not a summary').toMatch(/\d-\d/)
        expect(m.aId).toBe(KID_ID)
        expect(m.a.serve, 'her side is the composed player, not a stub').toBeGreaterThan(0)
        expect(m.b.serve, 'and so is the woman across the net').toBeGreaterThan(0)
        expect(m.surface).toBe(NATIONAL_TEAM.surface)
      }
    }
    expect(anyPlayed, 'over four years she took the court at least once').toBeGreaterThan(0)
  }, 120_000)

  it('⭐⭐ 2. the stored record REPLAYS – the same mechanism, exactly, as any other match', () => {
    // This is the owner's «так же, как и наши текущие» as a mechanical claim: `MatchReplay` and
    // `PracticeFlow` both re-run `simulateMatch(a, b, {surface, tour, seed})` and draw the result.
    // If a rubber's record did not reproduce, the viewer would show a different match from the one
    // the record says she played.
    const { world } = collegeYearsWithACall('college-rubbers-replay')
    const all = world.college!.years.flatMap((y) => (y.callUp ? callUpRubbersOf(world, y.callUp.week) : []))
    expect(all.length).toBeGreaterThan(0)
    for (const m of all) {
      const again = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      expect(again.sets.map((s) => `${s.a}-${s.b}`).join(' '), 'byte-for-byte, off the stored seed').toBe(m.score)
      expect(again.winner === 0 ? KID_ID : m.bId).toBe(m.winnerId)
    }
  }, 120_000)

  it('⭐⭐⭐ 3. THE YEAR REPORTS THE WEEK – the four-year loop stops where the player can see it', () => {
    // ⚠⚠ THE GUARD, AND IT FAILS IF THE STOP STOPS STOPPING. Round 23 #16 was an academy verdict on
    // the one week a `+4` could never land on; this is a competition inside a call that spends the
    // whole year. `resumeFromCollege` returns the reasons exactly as `advanceWeeks` does, `mutate`
    // puts them on the snapshot, and the epilogue's year card is what opens the matches.
    const { world, stops } = collegeYearsWithACall('college-rubbers-report')
    const years = world.college!.years
    expect(years.length).toBeGreaterThan(0)
    let reported = 0
    for (let i = 0; i < years.length; i++) {
      const hadACall = years[i].callUp !== null
      expect(
        stops[i].includes('call-up'),
        `year ${i + 1} ${hadACall ? 'had a letter and must say so' : 'had none and must not invent one'}`,
      ).toBe(hadACall)
      if (hadACall) reported += 1
    }
    expect(reported, 'at least one year of the four reported its competition').toBeGreaterThan(0)
    // ...and every returned list is in STOP_PRECEDENCE order, like an advance's.
    for (const list of stops) {
      const order = list.map((r) => STOP_PRECEDENCE.indexOf(r as never))
      expect([...order].sort((a, b) => a - b), 'precedence order, not insertion order').toEqual(order)
    }
  }, 120_000)

  it('⚠ 3b. a year that RE-LATCHES the epilogue reports both, and the last year reports no ending', () => {
    // R11-1's rule on a second producer: one call can be several things at once. The three years
    // that ask «another year?» hand back 'ending' too – the epilogue is the surface that renders it –
    // and the fourth takes the latch off for good, so the tab shell is what the player lands on.
    const { world, stops } = collegeYearsWithACall('college-rubbers-both')
    for (let i = 0; i < stops.length - 1; i++) {
      expect(stops[i], `year ${i + 1} re-latches the question`).toContain('ending')
    }
    expect(stops[stops.length - 1], 'the course is finished: no latch left').not.toContain('ending')
    expect(world.ending).toBeNull()
  }, 120_000)

  it('⚠ 4. it still pays nothing and costs nothing: no result, no rank, no cheque, no condition', () => {
    const before = atTheFork('college-rubbers-free')
    answerFork(before.world, 'college')
    const world = before.world
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(world, before.rng)
    expect(world.results.filter((r) => r.playerId === KID_ID), 'her column of the ledger is empty').toHaveLength(0)
    expect(world.entries).toHaveLength(0)
    // ⚠ AND THE ROWS ARE MARKED SO FOUR SUBSYSTEMS KEEP IGNORING THEM. `friendly` is the one
    // predicate the radar (R11-2), the avatar's emotion, the knock history and the Weekly Story read
    // to decide whether a match is evidence about her form. A rubber that pays nothing and takes
    // nothing must not silently become evidence in all four at once.
    const rows = world.events.filter((e) => e.match?.eventId.startsWith('nations-w'))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.type).toBe('match')
      expect(row.friendly, 'not evidence – it awards nothing and takes nothing').toBe(true)
      expect(row.keep, 'kept, so the week is still watchable four years later').toBe(true)
      expect(row.amountCents, 'no money changes hands').toBeUndefined()
      expect(row.text).toContain('no ranking points')
    }
  }, 120_000)

  it('⚠ 5. the played rubber TRACKS THE MODEL IT REPLACED – the calibration is measured, not asserted', () => {
    // `NATIONAL_TEAM.rubber.standard` means "the level at which she is an even bet", and it now means
    // it as a PERSON: `callUpOpponent` draws the woman across the net around that mean. So a girl AT
    // the standard has to come out near even against her, or the constant stopped meaning what both
    // halves of this file claim it means.
    //
    // ⚠⚠ MEASURED BEFORE IT WAS BELIEVED (CLAUDE.md invariant 4), n = 2,000 per row, against the
    // model this replaces – `rubberWinChance` – over the whole band a college-age girl occupies:
    //
    //     skill mean │  model p │ played p
    //         50     │  0.260   │  0.211
    //         54     │  0.340   │  0.294
    //         58     │  0.420   │  0.407
    //         62     │  0.500   │  0.479   <- the standard: still an even match
    //         66     │  0.580   │  0.615
    //         70     │  0.660   │  0.726
    //         76     │  0.780   │  0.838
    //
    // ⭐ THE CURVE TRACKS AND IS SLIGHTLY STEEPER, which is the honest shape of the change: a linear
    // 0.02-per-point model versus a real match engine, where a skill edge compounds over a set. It
    // COSTS NOTHING – a rubber pays no points and no money, takes no condition and feeds no
    // development – so this is a different line in the record, not a re-balance.
    //
    // ⚠ THE BAND BELOW IS WIDE ON PURPOSE. This is a guard against the calibration falling over (a
    // mirror match coming out 90/10), not a tuning pin. n is 300 here, so a 4-sigma band.
    const level: MatchPlayer = {
      id: KID_ID,
      name: 'Level Player',
      serve: NATIONAL_TEAM.rubber.standard,
      ret: NATIONAL_TEAM.rubber.standard,
      composure: NATIONAL_TEAM.rubber.standard,
      stamina: NATIONAL_TEAM.rubber.standard,
      groundstrokes: NATIONAL_TEAM.rubber.standard,
      age: 21,
    }
    let won = 0
    const n = 300
    for (let i = 0; i < n; i++) {
      const { player: opp } = callUpOpponent(`cal-${i}`, rngFromSeed(`calibration:rubbers:${i}`))
      const res = simulateMatch(level, opp, {
        surface: NATIONAL_TEAM.surface,
        tour: JUNIOR_TOUR,
        seed: `calibration:rubber:${i}`,
      })
      if (res.winner === 0) won += 1
    }
    const rate = won / n
    expect(rate, `a level player wins ${(rate * 100).toFixed(1)}% of rubbers – the model says 50%`).toBeGreaterThan(0.4)
    expect(rate).toBeLessThan(0.6)
  }, 120_000)

  it('⚠ the opponent is a real player, drawn around the standard, and her side is drawn whole', () => {
    // Nine draws each, `tiesInTheWeek` of them per week whether or not she plays them all – so who
    // her nation drew is a fact about the week, not about how many rubbers the captain gave her.
    const rng = rngFromSeed('shape:rubbers:295')
    const squad = [0, 1, 2].map((i) => callUpOpponent(`nations-w295-r${i}`, rng))
    const { standard, } = NATIONAL_TEAM.rubber
    for (const { player, nation } of squad) {
      expect(nation, 'a country on her shirt, out of the world\'s own pool').toMatch(/^[A-Z]{2}$/)
      expect(player.name).toMatch(/^\S+ \S+$/)
      for (const attr of [player.serve, player.ret, player.composure, player.stamina, player.groundstrokes]) {
        expect(attr).toBeGreaterThanOrEqual(standard - NATIONAL_TEAM.opponentSpread)
        expect(attr).toBeLessThanOrEqual(standard + NATIONAL_TEAM.opponentSpread)
      }
      const [lo, hi] = NATIONAL_TEAM.opponentAgeBand
      expect(player.age!).toBeGreaterThanOrEqual(lo)
      expect(player.age!).toBeLessThanOrEqual(hi)
    }
    expect(new Set(squad.map((s) => s.player.name)).size, 'three different women').toBe(3)
    // Deterministic: the same stream gives the same side.
    const again = [0, 1, 2].map((i) => callUpOpponent(`nations-w295-r${i}`, rngFromSeed('shape:rubbers:295')))[0]
    expect(again).toEqual(squad[0])
  })

  it('⚠ the epilogue view carries the rubbers, so the card that reports the week can OFFER it', () => {
    const { world } = collegeYearsWithACall('college-rubbers-view')
    // Wind back to a boundary that still has an open question and a letter behind it.
    const year = world.college!.years.find((y) => y.callUp !== null && y.callUp.rubbersPlayed > 0)
    expect(year, 'a year in which she took the court').toBeDefined()
    const rubbers = callUpRubbersOf(world, year!.callUp!.week)
    expect(rubbers).toHaveLength(year!.callUp!.rubbersPlayed)
    // and the id names no tier, so the commentary correctly claims no occasion (see `occasionOf`).
    for (const m of rubbers) expect(m.eventId).toBe(callUpRubberId(year!.callUp!.week, m.round))
  }, 120_000)
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
