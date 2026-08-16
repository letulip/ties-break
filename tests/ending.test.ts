// W2-ENDINGS – the six endings, the latch, and the two properties that make the design safe.
//
// The two that matter most are at the bottom of the file and they are not about copy:
//   1. `tickWeek` STAYS TOTAL. A latched world that is ticked anyway draws exactly what an unended
//      twin draws, so `replayMainState` (the MAIN-position recovery) cannot desync on a career that
//      went bankrupt mid-replay.
//   2. INPUT-INDEPENDENCE SURVIVES COLLEGE. Going to college suppresses four years of bills, and
//      every one of those suppressions is POST-DRAW - so a player's answer at the fork cannot move
//      the MAIN sequence. That is invariant 2 and it is a fairness property, not a tidiness one.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { migrateSave } from '../src/engine/migrations'
import {
  ENDINGS,
  bankruptcyDue,
  collegeDoorOpen,
  careerEndingInjuryDue,
  debtWeeks,
  detectEnding,
  endingForForkAnswer,
  endingForRetirement,
  forkDue,
  plateauReading,
  retirementDue,
  weeksLostSoFar,
  type AutoEndingView,
  type PlateauView,
} from '../src/engine/ending'
import {
  createWorld,
  advanceWeeks,
  tickWeek,
  answerFork,
  answerRetirement,
  collegeStillOpen,
  entryCostsCollege,
  resumeFromCollege,
  enterEvent,
  hireCoach,
  bookVacation,
  setKitGrade,
  inCollege,
  latchEnding,
  lastRungSeasonIndexOf,
  plateauViewOf,
  resolveEndings,
  buildEndingView,
  buildAlbum,
  skipTournament,
  closeTournament,
  captureBreakEven,
  toSnapshot,
} from '../src/engine/world'
import { rngFromSeed, resumeMain, initMainState } from '../src/engine/rng'
import { DEFAULT_PROFILE, LADDER_TRACKS } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'

function autoView(over: Partial<AutoEndingView> = {}): AutoEndingView {
  return {
    week: 100,
    ageYears: 16,
    fundsCents: 5000_00,
    debtSinceWeek: null,
    cheapestEntryFeeCents: 40_00,
    freshInjurySeverity: null,
    injuryHistory: [],
    ...over,
  }
}

describe('#3 bankruptcy – a spell, never a floor', () => {
  it('counts the spell inclusively from the week it started', () => {
    expect(debtWeeks({ week: 100, debtSinceWeek: null })).toBe(0)
    expect(debtWeeks({ week: 100, debtSinceWeek: 100 })).toBe(1)
    expect(debtWeeks({ week: 107, debtSinceWeek: 100 })).toBe(8)
  })

  it('latches at exactly N consecutive weeks and not one earlier', () => {
    const n = ENDINGS.bankruptcyGraceWeeks
    const under = autoView({ fundsCents: -1000_00, debtSinceWeek: 100, week: 100 + n - 2 })
    const at = autoView({ fundsCents: -1000_00, debtSinceWeek: 100, week: 100 + n - 1 })
    expect(bankruptcyDue(under)).toBe(false)
    expect(bankruptcyDue(at)).toBe(true)
  })

  it('a solvent week is the whole defence – one recovery and the spell is nothing', () => {
    // The spell is reset by the caller (`resolveEndings`), so from the predicate's side a solvent
    // family is simply never due, however long it was under before.
    expect(bankruptcyDue(autoView({ fundsCents: 1_00, debtSinceWeek: 0, week: 500 }))).toBe(false)
  })

  it('⚠ the second clause is REDUNDANT, and this is the test that says so out loud', () => {
    // The contract words it as "funds below zero AND unable to fund the cheapest entry for N weeks".
    // The engine's own affordability test is `fundsCents >= entryFeeCents`, so a family below zero
    // cannot afford an entry of ANY price - not even a free one, because -1 >= 0 is false. The
    // conjunction therefore adds nothing on every calendar this game can generate, which is exactly
    // what P1 argued; it is written out because the contract words it that way and because a rung
    // that one day ships with a NEGATIVE fee (a paid-appearance rung) would need it.
    const freeEntry = autoView({ fundsCents: -1, debtSinceWeek: 0, week: 100, cheapestEntryFeeCents: 0 })
    expect(bankruptcyDue(freeEntry)).toBe(true)
    // ...and here is the one shape it does rescue: a rung that PAYS her to turn up.
    const paidToPlay = autoView({ fundsCents: -1, debtSinceWeek: 0, week: 100, cheapestEntryFeeCents: -50_00 })
    expect(bankruptcyDue(paidToPlay)).toBe(false)
  })
})

describe('#4 the career-ending injury – a story, never a difficulty setting', () => {
  const lost = (weeks: number, severity = 'moderate') => [{ severity, weeksOut: weeks }]

  it('needs BOTH the fresh severe and the weeks already lost', () => {
    const n = ENDINGS.injuryPriorWeeksOut
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'severe', injuryHistory: lost(n - 1) }))).toBe(false)
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'major', injuryHistory: lost(n + 40) }))).toBe(false)
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'severe', injuryHistory: lost(n) }))).toBe(true)
  })

  it('⚠ the accumulation is WEEKS, not layoffs – the counted rule was measured at 0.0% and dropped', () => {
    // Three separate months off court end a career; three niggles do not, because they are not
    // three months. The count-of-major rule P1 proposed could not fire at all on the shipped injury
    // model - see ENDINGS.injuryPriorWeeksOut for the instrumented numbers.
    const manyTiny = Array.from({ length: 30 }, () => ({ severity: 'minor', weeksOut: 1 }))
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'severe', injuryHistory: manyTiny }))).toBe(true)
    const threeMonths = [
      { severity: 'moderate', weeksOut: 6 },
      { severity: 'moderate', weeksOut: 6 },
      { severity: 'major', weeksOut: 9 },
    ]
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'severe', injuryHistory: threeMonths }))).toBe(true)
  })

  it('an unbroken body survives even the worst single roll', () => {
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: 'severe', injuryHistory: [] }))).toBe(false)
  })

  // ⚠ THE PRUNE, AND WHY THE RULE STOPPED READING THE LIST ALONE (v40,
  // docs/specs/fatigue-injury-audit-2026-08.md §6). `rollInjury` keeps the last twenty layoffs and
  // drops the rest, so summing `injuryHistory` under-counted exactly the bodies this predicate is
  // about - the accumulator got SHORTER the more broken she was. `careerTotals.weeksLostToInjury`
  // is the monotone counter; `weeksLostSoFar` takes the larger of the two so that neither a
  // hand-built view (history, no counter) nor a migrated save (counter back-filled from the same
  // pruned list) can ever fire the ending on weeks she did not lose.
  it('reads the monotone counter when the pruned history has forgotten half the body', () => {
    const n = ENDINGS.injuryPriorWeeksOut
    const shortHistory = [{ severity: 'minor', weeksOut: 2 }]
    // the visible history is two weeks; the career total says she has lost five months
    expect(weeksLostSoFar(autoView({ injuryHistory: shortHistory, weeksLostToInjury: n + 30 }))).toBe(n + 30)
    expect(
      careerEndingInjuryDue(
        autoView({ freshInjurySeverity: 'severe', injuryHistory: shortHistory, weeksLostToInjury: n + 30 }),
      ),
    ).toBe(true)
    // ...and it never goes the other way: a counter BELOW the surviving history cannot shrink it
    expect(weeksLostSoFar(autoView({ injuryHistory: lost(n + 5), weeksLostToInjury: 0 }))).toBe(n + 5)
  })

  it('an ongoing layoff is not a fresh injury', () => {
    expect(careerEndingInjuryDue(autoView({ freshInjurySeverity: null, injuryHistory: lost(90) }))).toBe(false)
  })
})

describe('detectEnding – bankruptcy leads, and neither is a verdict', () => {
  it('reports bankruptcy ahead of the injury when a week is both', () => {
    const both = autoView({
      fundsCents: -1,
      debtSinceWeek: 0,
      week: 100,
      freshInjurySeverity: 'severe',
      injuryHistory: [{ severity: 'severe', weeksOut: 18 }, { severity: 'major', weeksOut: 10 }],
    })
    expect(detectEnding(both)?.type).toBe('bankruptcy')
  })

  it('says nothing at all about a healthy solvent week', () => {
    expect(detectEnding(autoView())).toBeNull()
  })
})

describe('#1/#2 the fork at nineteen', () => {
  it('is due once she is nineteen and never once answered', () => {
    expect(forkDue(18, false)).toBe(false)
    expect(forkDue(19, false)).toBe(true)
    expect(forkDue(24, true)).toBe(false)
  })

  it('"continue" is the only answer that is not an ending', () => {
    expect(endingForForkAnswer('continue', 260, 19)).toBeNull()
    expect(endingForForkAnswer('stop', 260, 19)?.type).toBe('stopped')
    const college = endingForForkAnswer('college', 260, 19)
    expect(college?.type).toBe('college')
    // ⚠ THE ONLY ENDING THAT RESUMES, and its resume week is on the row.
    // ⭐ GUARD RE-AIMED, NOT WEAKENED (P5, 16.08): the row now points ONE year out and not four,
    // because the freeze is spent a year at a time and the early return is the sport's own case
    // (docs/specs/college-as-a-second-act-2026-08.md). `collegeYears` is still the length of the
    // COURSE – it is on the detail line and it is what `CollegeProgressView.totalYears` counts – so
    // the constant is asserted here too rather than dropped from the file.
    expect(college?.resumesWeek).toBe(260 + 52)
    expect(college?.detail).toContain(String(ENDINGS.collegeYears))
  })
})

describe('#5/#6 the natural end, and the plateau reading of it', () => {
  const flat = (from: number, count: number, rank: number) =>
    Array.from({ length: count }, (_, i) => ({ seasonIndex: from + i, endRank: rank }))

  function plateauView(over: Partial<PlateauView> = {}): PlateauView {
    return {
      ageYears: 26,
      seasonIndex: 12,
      // ⚠ THE WINDOW MUST NOT BEAT WHAT CAME BEFORE IT. A plateau is "she is where she is going to
      // be", so the later seasons sit slightly WORSE than her best - improving inside the window is
      // the one thing that disqualifies it, and this fixture used to have it the other way round.
      seasonEndRanks: [...flat(6, 4, 175), ...flat(10, 3, 180)],
      lastRungSeasonIndex: 6,
      ...over,
    }
  }

  it('will not read a plateau on a girl who has not had a career yet', () => {
    expect(plateauReading(plateauView({ ageYears: ENDINGS.plateauFromAgeYears - 1 }))).toBe(false)
  })

  it('needs a full window of seasons, and something before it to compare against', () => {
    expect(plateauReading(plateauView({ seasonEndRanks: flat(10, 3, 175) }))).toBe(false)
  })

  it('a rung cleared inside the window is not a plateau', () => {
    expect(plateauReading(plateauView({ lastRungSeasonIndex: 11 }))).toBe(false)
  })

  it('an improvement inside the window is not a plateau', () => {
    expect(plateauReading(plateauView({ seasonEndRanks: [...flat(6, 4, 175), ...flat(10, 3, 40)] }))).toBe(false)
  })

  it('a collapse is not a plateau either – both halves of the flatness test are load-bearing', () => {
    const collapsing = [
      ...flat(6, 4, 175),
      { seasonIndex: 10, endRank: 182 },
      { seasonIndex: 11, endRank: 260 },
      { seasonIndex: 12, endRank: 400 },
    ]
    expect(plateauReading(plateauView({ seasonEndRanks: collapsing }))).toBe(false)
  })

  it('reads a real plateau', () => {
    expect(plateauReading(plateauView())).toBe(true)
  })

  it('⚠ 38 is where the game STOPS ASKING – the offer is still an offer, it is just the last one', () => {
    const at37 = retirementDue(plateauView({ ageYears: 37, lastRungSeasonIndex: 12 }))
    const at38 = retirementDue(plateauView({ ageYears: ENDINGS.stopAskingAgeYears, lastRungSeasonIndex: 12 }))
    expect(at37?.final).toBe(false)
    expect(at38?.final).toBe(true)
    expect(at38?.reason).toBe('age')
  })

  it('the plateau puts the SAME question in front of her early, and the type says which it was', () => {
    const early = retirementDue(plateauView({ ageYears: 26 }))
    expect(early?.reason).toBe('plateau')
    expect(endingForRetirement(early!, 600, 26, 0).type).toBe('plateau')
    const late = retirementDue(plateauView({ ageYears: 31, lastRungSeasonIndex: 12 }))
    expect(endingForRetirement(late!, 900, 31, 3).type).toBe('natural')
    expect(endingForRetirement(late!, 900, 31, 3).detail).toContain('3 more years')
  })
})

// --- the world side -------------------------------------------------------------------------------

function freshWorld(seed = 'ending-test') {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(seed)
  return { world, rng }
}

describe('the latch, on a real world', () => {
  it('advanceWeeks refuses to move an ended world, and reports the reason', () => {
    const { world, rng } = freshWorld()
    tickWeek(world, rng)
    const at = world.week
    latchEnding(world, { type: 'stopped', week: at, ageYears: 19, detail: 'x', resumesWeek: null })
    expect(advanceWeeks(world, rng, 4)).toEqual(['ending'])
    expect(world.week).toBe(at)
  })

  it('every mutating COMMAND refuses, and the reveal trio deliberately does not', () => {
    const { world, rng } = freshWorld()
    for (let i = 0; i < 6; i++) tickWeek(world, rng)
    const event = world.season.find((e) => e.deadlineWeek >= world.week)!
    latchEnding(world, { type: 'bankruptcy', week: world.week, ageYears: 15, detail: 'x', resumesWeek: null })
    expect(() => enterEvent(world, event.id)).toThrow(/ended/)
    expect(() => hireCoach(world, null)).toThrow(/ended/)
    expect(() => bookVacation(world, world.week + 3, 'staycation')).toThrow(/ended/)
    expect(() => setKitGrade(world, 'strings', 'pro')).toThrow(/ended/)
    // ⚠ AND THE RECORD OF WHAT SHE DID IS STILL READABLE. A guard that also blocked reads would
    // have made the epilogue impossible to build from the world it is about.
    expect(buildAlbum(world)).toHaveLength(7)
  })

  it('the fork and the offer BLOCK the advance exactly as a knock does', () => {
    const { world, rng } = freshWorld()
    tickWeek(world, rng)
    world.fork = { askedWeek: world.week, answer: null }
    expect(advanceWeeks(world, rng, 1)).toEqual(['fork'])
    world.fork = { askedWeek: world.week, answer: 'continue' }
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
    expect(advanceWeeks(world, rng, 1)).toEqual(['retirement'])
  })

  it('answering is the only exit, and an unprompted answer is refused', () => {
    const { world } = freshWorld()
    expect(() => answerFork(world, 'stop')).toThrow(/not open/)
    expect(() => answerRetirement(world, true)).toThrow(/asked/)
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #6 – THE SCHOLARSHIP IS NOT OFFERED TO A GIRL ALREADY ON THE TOUR
  // ===============================================================================================
  // The owner: the fork «offers the academy to a girl already earning on W75+». It did – the college
  // branch had no precondition of any kind. A player who has taken professional prize money has
  // spent her college eligibility, so it is not an answer she can choose; the card was offering a
  // door that is not there. `ENDINGS.collegeClosedFromTier` carries the reasoning and the marker is
  // the owner's own W75.
  it('⭐ the college answer closes once a professional result has counted', () => {
    const { world } = freshWorld('fork-college-gate')
    // A junior who has TRIED the tour keeps it: w15 opens at 16 and the game wants her to play some.
    world.bestFinishByTier = { w15: 1, j300: 0 }
    expect(collegeStillOpen(world), 'a W15 result is a junior trying the tour').toBe(true)

    // ...and a counting result at the owner's own marker closes it.
    world.bestFinishByTier = { w15: 1, w75: 2 }
    expect(collegeStillOpen(world), 'a W75 result is a professional on it').toBe(false)
    // ...as does anything above it.
    world.bestFinishByTier = { wta250: 3 }
    expect(collegeStillOpen(world)).toBe(false)

    // ⭐ BUT TURNING UP AND LOSING IS NOT A RESULT (owner, 13.08). The bench measured 12 of 25
    // closures as first-round losses: `w75.points` ends in a nominal 1 for the opening-round loser,
    // and that single point was shutting the door on the exact case the constant's own comment calls
    // safe. The rule now reads the FINISH, so it cannot drift with a points-table edit.
    const openingRound = TIERS.w75.points.length - 1
    world.bestFinishByTier = { w75: openingRound }
    expect(
      collegeStillOpen(world),
      'she entered one W75 and lost her first match – that is a junior trying the tour',
    ).toBe(true)
    // ...and winning one match there IS the line.
    world.bestFinishByTier = { w75: openingRound - 1 }
    expect(collegeStillOpen(world), 'she won a match at W75 – she is on the tour').toBe(false)

    // ⚠ THE INCONSISTENCY THIS ALSO SETTLES, pinned so a table edit cannot quietly restore it: W100
    // pays its opening-round loser 0 and W75 pays 1, so before the fix the SAME first-round loss kept
    // the door at one rung and took it at the other. Both are open now, for the same reason.
    expect(TIERS.w75.points[openingRound], 'w75 pays the wooden spoon').toBeGreaterThan(0)
    expect(TIERS.w100.points[TIERS.w100.points.length - 1], 'w100 does not').toBe(0)
    world.bestFinishByTier = { w100: TIERS.w100.points.length - 1 }
    expect(collegeStillOpen(world), 'the same loss, the other rung').toBe(true)
  })

  // ===============================================================================================
  // ⭐⭐ P4 – THE COLLEGE GATE READS ITS OWN RULE, AND NOTHING ELSE
  // ===============================================================================================
  // THE DEFECT, and it fired in front of us rather than being predicted: `TIERS.w75.acceptsRank`
  // decided BOTH who may enter a W75 AND the age at which the college ending stops existing, because
  // `ENDINGS.collegeClosedFromTier` names that same rung. Two unrelated decisions on one constant.
  // **P3 moved `w75.acceptsRank` from 450 to 300 and moved the college door with it**, and nothing in
  // the repo objected - `calendar.ts` had a note about the coupling, `ending.ts` had none, and no test
  // asserted anything either way.
  //
  // The gate no longer reads a single tuning number off `TIERS`. These three cases are what makes
  // that a property rather than a claim, and each one MOVES A CONSTANT and asserts the other does not
  // follow. ⚠ They mutate the shipped `TIERS` object and restore it in `finally`: the module is a
  // plain `Record`, so a throw between the two would leak into every later file in this worker.
  it('⭐⭐ P4 – moving the ENTRY rule does not move the college door', () => {
    const { world } = freshWorld('college-decoupled-entry')
    // She won a match at W75, so the door is shut. Nothing below changes that FACT - the only
    // question is whether an acceptance-list edit can change the ANSWER.
    world.bestFinishByTier = { w75: 2 }
    expect(collegeStillOpen(world)).toBe(false)

    const shipped = TIERS.w75.acceptsRank
    try {
      // P3's own move, and then the reverse of it, and then a value nothing would ever ship.
      for (const cut of [450, 300, 1, 5000]) {
        TIERS.w75.acceptsRank = cut
        expect(collegeStillOpen(world), `who may ENTER a W75 is not who has spent college (cut ${cut})`).toBe(false)
      }
      // ...and the same in the other direction, on a career that KEEPS the door.
      world.bestFinishByTier = { w75: TIERS.w75.points.length - 1 }
      for (const cut of [450, 300, 1, 5000]) {
        TIERS.w75.acceptsRank = cut
        expect(collegeStillOpen(world), `a first-round loss keeps it at every cut (cut ${cut})`).toBe(true)
      }
    } finally {
      TIERS.w75.acceptsRank = shipped
    }
    expect(TIERS.w75.acceptsRank, 'the shipped cut is back – later files read this object').toBe(shipped)
  })

  it('⭐⭐ P4 – and neither does re-sizing the rung\'s POINTS, which the gate used to read', () => {
    // The gate's old body was `finish >= points.length - 1 ? open : points[finish] > 0`, so the
    // LADDER'S PRIZE COLUMN was deciding where the college ending stops. A wave re-tuning w75's
    // points would have moved the door without mentioning it.
    const { world } = freshWorld('college-decoupled-points')
    const shipped = [...TIERS.w75.points]
    try {
      // Zero the whole table except the champion. Under the old rule every finish but 0 would have
      // "not counted" and the door would have sprung back open; the rule reads the FINISH now.
      TIERS.w75.points = [75, 0, 0, 0, 0, 0]
      world.bestFinishByTier = { w75: 2 }
      expect(collegeStillOpen(world), 'she still won two matches there, whatever they paid').toBe(false)
      // ...and pay the opening-round loser a fortune: still a first-round loss, still open.
      TIERS.w75.points = [75, 49, 29, 16, 9, 999]
      world.bestFinishByTier = { w75: 5 }
      expect(collegeStillOpen(world), 'the wooden spoon is not a result, at any price').toBe(true)
    } finally {
      TIERS.w75.points = shipped
    }
    expect(TIERS.w75.points, 'the shipped table is back').toEqual(shipped)
  })

  it('⭐⭐ P4 – what DOES move it is the college rule\'s own knob, and only that', () => {
    // The mirror of the two above: the same results, two different college rungs, two answers. This
    // is what stops the pair above passing vacuously - a `collegeStillOpen` that always said `false`
    // would satisfy them both.
    const results = [{ rungIndex: TIER_LADDER.indexOf('w75'), finish: 2, rounds: TIERS.w75.points.length }]
    expect(collegeDoorOpen(results, TIER_LADDER.indexOf('w75')), 'shut when the door is AT that rung').toBe(false)
    expect(collegeDoorOpen(results, TIER_LADDER.indexOf('w50')), 'shut when the door is BELOW it').toBe(false)
    expect(collegeDoorOpen(results, TIER_LADDER.indexOf('w100')), 'OPEN when the door is above it').toBe(true)
    // ...and the leaf takes no calendar constant to say so: `rounds` is the draw's depth, which is
    // structural, and the rule is "she got past the opening round".
    expect(collegeDoorOpen([{ rungIndex: 9, finish: 4, rounds: 5 }], 9), 'opening round of a 5-deep draw').toBe(true)
    expect(collegeDoorOpen([{ rungIndex: 9, finish: 3, rounds: 5 }], 9), 'one match won').toBe(false)
  })

  it('⚠ P4 – dropping the points read changed NO behaviour, and this is the pin that says so', () => {
    // The decoupling could ship as a decoupling rather than as a balance change for exactly one
    // reason: the clause it removed was dead. `points[finish] > 0` can only bite on an INTERIOR ZERO
    // - a finishing position that is not the opening round and still pays nothing - and no rung the
    // college rule can see has one. Asserted against the LIVE table, so the day a rung ships one this
    // says so instead of the door silently moving.
    const from = TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier)
    const closers = TIER_LADDER.slice(from)
    expect(closers.length, 'the college rule can see some rungs, or this pin is vacuous').toBeGreaterThan(0)
    for (const tier of closers) {
      const interior = TIERS[tier].points.slice(0, -1)
      expect(
        interior.filter((p) => p === 0),
        `${tier} pays every finishing position above the opening round – so "won a match" and "scored" agree there`,
      ).toEqual([])
    }
  })

  // ===============================================================================================
  // ⭐⭐ P4 (c) – THE WARNING BEFORE THE ENTRY THAT COSTS IT
  // ===============================================================================================
  // `collegeClosedFromTier` used to call the silence intentional - "it is a PRECONDITION and not a
  // WARNING" - on the strength of an NCAA rule that has been repealed twice and, since 15 April 2026,
  // carries no pre-enrolment cap at all. `endings-and-the-album.md` named the gap and left it to the
  // owner: "nothing at seventeen tells the player that a good week there spends something."
  it('⭐⭐ P4 – the engine says which entries can cost the college ending, before they do', () => {
    const { world } = freshWorld('college-warning')
    // A rung below the door costs nothing, however open the door is.
    expect(entryCostsCollege(world, 'w15'), 'a W15 is a junior trying the tour').toBe(false)
    expect(entryCostsCollege(world, 'w50')).toBe(false)
    // ...and one at or above it does, while there is something left to spend.
    expect(entryCostsCollege(world, ENDINGS.collegeClosedFromTier), 'the door rung itself').toBe(true)
    expect(entryCostsCollege(world, 'wta250'), 'and everything above it').toBe(true)

    // ⚠ ONCE IT IS SPENT THE CARD STOPS SAYING IT. A warning about a decision that has already been
    // taken is noise, and this game has a standing rule against surfaces that shout at nothing.
    world.bestFinishByTier = { w75: 1 }
    expect(collegeStillOpen(world), 'the door is shut now').toBe(false)
    expect(entryCostsCollege(world, 'wta250'), 'there is nothing left to spend').toBe(false)
  })

  it('⚠ P4 – and it stops the week the fork is answered, because there is no ending left to lose', () => {
    const { world } = freshWorld('college-warning-fork')
    expect(entryCostsCollege(world, 'w75'), 'before the fork').toBe(true)
    world.fork = { askedWeek: world.week, answer: null }
    expect(entryCostsCollege(world, 'w75'), 'the fork is OPEN – the answer is still to come').toBe(true)
    answerFork(world, 'continue')
    expect(entryCostsCollege(world, 'w75'), 'she answered – the college ending is gone either way').toBe(false)
  })

  it('⚠ P4 – the warning is a READ and changes no verdict: entry is still allowed', () => {
    // Ruling: the parent may always push, and the doctor's veto is this game's one exception. The
    // flag rides beside `eligible`, never inside `ineligibleReason`, so it cannot become a refusal.
    const { world } = freshWorld('college-warning-not-a-gate')
    const snap = toSnapshot(world)
    for (const e of snap.upcoming) {
      if (e.costsCollege) expect(e.eligible || e.ineligibleReason !== undefined, 'no new refusal code').toBe(true)
      // ...and it is never confused with the BODY's caution, which is a different sentence entirely.
      if (e.costsCollege) expect(e.cautionReason).not.toBe('costsCollege' as unknown as 'fatigued')
    }
  })

  it('⭐ ...and the engine refuses the answer, not just the button', () => {
    // CLAUDE.md invariant 1: the worker is not the gate. Hiding the button is the courtesy; this is
    // the rule. Mutation-verified by deleting the `collegeStillOpen` guard in `answerFork` – the
    // throw stops happening and this fails.
    const { world } = freshWorld('fork-college-refuse')
    world.bestFinishByTier = { w75: 1 }
    world.fork = { askedWeek: world.week, answer: null }
    expect(() => answerFork(world, 'college')).toThrow(/scholarship/)
    // ...and the fork is still open afterwards, so the career is not stranded by the refusal.
    expect(world.fork?.answer).toBeNull()
    // The other two answers are untouched – this removes an option, it does not steer.
    answerFork(world, 'continue')
    expect(world.ending).toBeNull()
  })

  it('⭐ ...and the card is told, so it never draws a button the engine would refuse', () => {
    const { world } = freshWorld('fork-college-wire')
    world.bestFinishByTier = { w75: 1 }
    world.fork = { askedWeek: world.week, answer: null }
    expect(toSnapshot(world).fork?.collegeOpen).toBe(false)
    world.bestFinishByTier = { j300: 0 }
    expect(toSnapshot(world).fork?.collegeOpen).toBe(true)
  })

  it('⚠ the last offer cannot be refused, because the question has run out', () => {
    const { world } = freshWorld()
    world.retirementOffer = { askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }
    expect(() => answerRetirement(world, false)).toThrow(/last time/)
    answerRetirement(world, true)
    expect(world.ending?.type).toBe('natural')
  })

  it('"one more year" clears the offer and is counted', () => {
    const { world } = freshWorld()
    world.retirementOffer = { askedWeek: 0, seasonIndex: 0, reason: 'age', final: false }
    answerRetirement(world, false)
    expect(world.retirementOffer).toBeNull()
    expect(world.oneMoreYearCount).toBe(1)
    expect(world.ending).toBeNull()
  })
})

// =================================================================================================
// ⭐ ROUND-19 #1 – THE PLATEAU ASKS THE TABLE SHE IS ON, AND COMPARES ONLY INSIDE IT
// =================================================================================================
//
// The owner, told twice in consecutive off-seasons that she «не двигается никуда» while climbing to
// #106 in the world. Reproduced on his own save with tools/plateau-probe.ts and written up in
// docs/rounds/round-19.md §1; these are the numbers that probe printed.
//
// ⚠ EVERY CLAIM HERE IS MADE OF A REAL `WorldState` AND GOES THROUGH `resolveEndings`, which is the
// only path that can raise the offer in a game. A hand-built `PlateauView` cannot fail the way this
// bug failed: the defect was in which COLUMN of the world the view is built from, so a test that
// builds the view itself would have passed on the broken code for ever.
describe('⭐ round-19 #1 – the plateau, on a real world', () => {
  /** Season 11's wrap-up week – `WEEKS_PER_YEAR - OFF_SEASON_WEEKS` into the season, the one week
   *  `resolveEndings` may raise the offer on. It is also the week his save was taken on. */
  const WRAP_WEEK_S11 = 11 * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - 3)

  /** One banked season. `alias` is the top-level `endRank`, which is and stays the ITF number (its
   *  own doc comment: «⚠ THE ITF ONE, always») – the column the rule used to read. `per` is the v46
   *  per-track record; a table she is missing from carries no `endRank` there, exactly as the wrap
   *  banks it, because a place in a table she holds no counting result in is not a place. */
  function bankedSeason(
    seasonIndex: number,
    alias: number,
    per: Partial<Record<LadderTrack, number>> | null,
  ): SeasonHistoryEntry {
    const row: SeasonHistoryEntry = {
      seasonIndex,
      endRank: alias,
      points: 0,
      wins: 0,
      losses: 0,
      fundsDeltaCents: 0,
      endFundsCents: 0,
    }
    // null = a row banked BEFORE v46, which carries no per-track figures at all and none can be
    // invented. Seasons 0-7 of his save are exactly these.
    if (per === null) return row
    const byTrack = {} as Record<LadderTrack, SeasonTrackRow>
    for (const track of LADDER_TRACKS) {
      const endRank = per[track]
      byTrack[track] = { points: 0, wins: 0, losses: 0, ...(endRank === undefined ? {} : { endRank }) }
    }
    return { ...row, byTrack }
  }

  /** A world parked on season 11's wrap week, with the fork long answered and the offer still to be
   *  raised – i.e. the exact state `resolveEndings` runs step 7d in. */
  function atTheWrap(seed: string, history: SeasonHistoryEntry[]) {
    const { world } = freshWorld(seed)
    world.week = WRAP_WEEK_S11
    world.fork = { askedWeek: 300, answer: 'continue' }
    world.seasonHistory = history
    return world
  }

  /** ...and a professional: one counting W result, ever, is what makes the paid table hers for good
   *  (`wtaEverCounted` / `activeLadderOf`, the one-way door). */
  function turnPro(world: ReturnType<typeof atTheWrap>): void {
    world.bestFinishByTier = { w75: 2 }
  }

  // His save, season by season, as the probe read it. Seasons 0-7 predate v46; 8-11 carry the pair.
  const HIS_CAREER = [
    bankedSeason(0, 127, null),
    bankedSeason(1, 13, null),
    bankedSeason(2, 6, null),
    bankedSeason(3, 6, null),
    bankedSeason(4, 111, null),
    bankedSeason(5, 102, null),
    bankedSeason(6, 74, null),
    bankedSeason(7, 74, null),
    bankedSeason(8, 82, { wta: 136 }),
    bankedSeason(9, 80, { wta: 169 }),
    bankedSeason(10, 77, { wta: 123 }),
    bankedSeason(11, 84, { wta: 106 }),
  ]

  it('⭐ a professional CLIMBING on her own table is not told she has gone as far as she is going', () => {
    const world = atTheWrap('round19-his-career', HIS_CAREER)
    turnPro(world)
    const view = plateauViewOf(world)

    // She is old enough to be asked and young enough that this can only be the plateau reading.
    expect(view.ageYears).toBeGreaterThanOrEqual(ENDINGS.plateauFromAgeYears)
    expect(view.ageYears).toBeLessThan(ENDINGS.askFromAgeYears)
    // The window is the PROFESSIONAL column, and the junior seasons are simply not in it – which is
    // what stops her #6 at sixteen from being the best-before no professional can ever beat.
    expect(view.seasonEndRanks).toEqual([
      { seasonIndex: 8, endRank: 136 },
      { seasonIndex: 9, endRank: 169 },
      { seasonIndex: 10, endRank: 123 },
      { seasonIndex: 11, endRank: 106 },
    ])

    resolveEndings(world)
    expect(world.retirementOffer, 'she climbed 169 -> 123 -> 106; nobody asks her to stop').toBeNull()

    // ...and this is what he was shown instead, for two seasons running: the SAME function over the
    // junior alias the rule used to read. Kept as an assertion so the regression stays legible.
    expect(
      plateauReading({ ...view, seasonEndRanks: HIS_CAREER.map((s) => ({ seasonIndex: s.seasonIndex, endRank: s.endRank })) }),
      'the ITF column reads flat at #80/#77/#84 against a junior best of #6',
    ).toBe(true)
  })

  it('⭐ ...and a professional who really has stopped moving still gets asked', () => {
    // The rule must still be able to fire, or the fix is just a switch-off. Same shape, same ages,
    // same code path - only the professional column is flat this time.
    const world = atTheWrap('round19-stalled', [
      bankedSeason(8, 82, { wta: 120 }),
      bankedSeason(9, 80, { wta: 128 }),
      bankedSeason(10, 77, { wta: 124 }),
      bankedSeason(11, 84, { wta: 130 }),
    ])
    turnPro(world)
    resolveEndings(world)
    expect(world.retirementOffer?.reason).toBe('plateau')
    expect(world.retirementOffer?.final).toBe(false)
  })

  it('⭐ a career banked before the per-track record existed DECLINES to fire', () => {
    // Rows older than v46 carry no figure for any table, and none can be reconstructed - the results
    // that made them were pruned years ago. Asking the question of the junior alias is what produced
    // the false plateau, so the rule refuses to ask at all: one off-season question nobody sees.
    const world = atTheWrap('round19-pre-v46', HIS_CAREER.map((s) => bankedSeason(s.seasonIndex, s.endRank, null)))
    turnPro(world)
    expect(plateauViewOf(world).seasonEndRanks).toEqual([])
    resolveEndings(world)
    expect(world.retirementOffer).toBeNull()
  })

  it('⭐ an incomplete window declines too – three comparable seasons, and one before them, or nothing', () => {
    // Season 10 was played on another table entirely, so the window is two rows and there is no
    // honest comparison to make. Same refusal, one row further in.
    const world = atTheWrap('round19-gappy', [
      bankedSeason(8, 82, { wta: 120 }),
      bankedSeason(9, 80, { wta: 128 }),
      bankedSeason(10, 77, { itf: 40 }),
      bankedSeason(11, 84, { wta: 130 }),
    ])
    turnPro(world)
    expect(plateauViewOf(world).seasonEndRanks).toHaveLength(3)
    resolveEndings(world)
    expect(world.retirementOffer).toBeNull()
  })

  // -----------------------------------------------------------------------------------------------
  // ...AND THE OTHER HALF OF THE RULE HAD THE SAME CONFUSION.
  // -----------------------------------------------------------------------------------------------
  // `lastRungSeasonIndexOf` answers «has she cleared a rung inside the window», and it walked all
  // sixteen rungs at once. TIER_LADDER is ONE strength order over three tables, so the global maximum
  // is the highest rung of whichever table she ever climbed highest - and for a girl whose table is
  // the national one, a junior final at sixteen outranks every domestic rung for the rest of her life.
  it('⭐ a rung cleared on HER table blocks the plateau, even with a bigger one on a table she left', () => {
    const world = atTheWrap('round19-rung-track', [
      bankedSeason(8, 90, { domestic: 40 }),
      bankedSeason(9, 90, { domestic: 44 }),
      bankedSeason(10, 90, { domestic: 46 }),
      bankedSeason(11, 90, { domestic: 42 }),
    ])
    // No W result ever and no live junior points, so the national table is hers (`activeLadderOf`).
    world.trophiesByTier.j300 = { titles: [], finals: [200] } // a junior final at ~sixteen
    world.trophiesByTier.national = { titles: [], finals: [600] } // ...and her first national final, this season
    resolveEndings(world)
    expect(world.retirementOffer, 'she cleared the top rung of her table this season').toBeNull()
    expect(lastRungSeasonIndexOf(world), 'the rung is read on her own table').toBe(11)

    // The junior shelf is still readable - it is simply another table's answer, and asking for it
    // explicitly is what says the scoping is deliberate rather than a lost trophy.
    expect(lastRungSeasonIndexOf(world, 'itf')).toBe(3)
    expect(lastRungSeasonIndexOf(world, 'wta')).toBeNull()
  })
})

// =================================================================================================
// ⭐ ROUND-19 #2 – ANSWERING THE QUESTION MAY NOT DESTROY THE SEASON'S WRAP-UP
// =================================================================================================
//
// The owner: «И по-моему за этим попапом скрылся или не показался попап с итогами сезона.» It was not
// a race - the recap was gated on the `'season-end'` STOP REASON, and a stop reason is a property of
// the advance that produced it. The offer is raised ON the wrap week by construction and outranks the
// recap (correctly), so answering it built a fresh snapshot with no reasons on it and the summary was
// gone for good. docs/rounds/round-19.md §2.
//
// The engine half of the fix is `seasonWrapDue`: the same beat, asked of STATE the world already
// holds, so no command can erase it. These are the assertions that a real command cannot.
describe('⭐ round-19 #2 – the wrap-up outlives the command that covered it', () => {
  /** A real career ticked to its first wrap-up week – week 49, where `maybeFireSeasonWrapUp` fires
   *  inside the tick's own deferred block. Nothing is hand-banked: the summary on this world is the
   *  one the engine wrote. */
  function atTheWrap(seed: string) {
    const { world, rng } = freshWorld(seed)
    while (world.week < WEEKS_PER_YEAR - 3) tickWeek(world, rng)
    return world
  }

  it('the recap is owed on the wrap week, and the ADVANCE is not what says so', () => {
    const world = atTheWrap('round19-wrap-week')
    expect(world.lastSeasonSummary, 'the engine banked season 0 here').not.toBeNull()
    // With the stop reasons, as the advance that stopped here delivers it...
    expect(toSnapshot(world, ['season-end']).seasonWrapPrompt).toBe(0)
    // ...and without them, which is every other snapshot this week can produce.
    expect(toSnapshot(world).seasonWrapPrompt).toBe(0)
    expect(toSnapshot(world).stopReasons).toBeUndefined()
  })

  it('⭐ ANSWERING THE RETIREMENT does not take the season summary with it', () => {
    const world = atTheWrap('round19-wrap-retirement')
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
    answerRetirement(world, false)
    const after = toSnapshot(world)
    // The mechanism of the bug, stated: the command really does produce a snapshot with no reasons.
    expect(after.stopReasons, 'only an advance sets these').toBeUndefined()
    // ...and the beat survives it anyway.
    expect(after.seasonWrapPrompt).toBe(0)
    expect(after.lastSeasonSummary).not.toBeNull()
    expect(after.retirementOffer).toBeNull()
  })

  it('⭐ ...and neither does ANSWERING THE FORK, which sits one rank above it in the same list', () => {
    // Reachable rather than theoretical: the fork is raised on her nineteenth BIRTHDAY week, and a
    // girl born in the second half of December turns nineteen in the off-season - the wrap week is
    // week 49 of the season, which is where December lands.
    const world = atTheWrap('round19-wrap-fork')
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'continue')
    const after = toSnapshot(world)
    expect(after.stopReasons).toBeUndefined()
    expect(after.seasonWrapPrompt).toBe(0)
    expect(after.lastSeasonSummary).not.toBeNull()
  })

  it('⚠ it is the SEASON that is compared, not merely "a summary exists on a wrap week"', () => {
    // `lastSeasonSummary` holds one season and is overwritten every year, so a wrap week whose own
    // fold has not run yet is still holding LAST year's recap - which is exactly the state a pending
    // tournament reveal leaves behind, because `finalizeTournament` runs the deferred block when the
    // reveal closes rather than when the advance returns. Showing that card would announce the wrong
    // season.
    const world = atTheWrap('round19-wrap-identity')
    world.week = WEEKS_PER_YEAR + (WEEKS_PER_YEAR - 3)
    expect(toSnapshot(world).seasonWrapPrompt, 'season 0 recap, season 1 wrap week').toBeNull()
    // ...and no ordinary week raises it either.
    world.week = WEEKS_PER_YEAR - 3 + 1
    expect(toSnapshot(world).seasonWrapPrompt).toBeNull()
  })
})

describe('#2 college – the only ending that resumes', () => {
  // ⭐ GUARDS RE-AIMED, NOT WEAKENED (P5, 16.08, docs/specs/college-as-a-second-act-2026-08.md).
  // `resumeFromCollege` used to spend all four years in ONE call; it spends ONE year now and
  // re-latches the ending with the next year's date, because reality's own case is an early return
  // (Diana Shnaider left NC State after about a season and is inside the WTA top 15). Every
  // assertion below still asks its original question – the freeze holds, the family stops paying,
  // she comes back with nothing on the table – it is just asked across four calls instead of one.
  it('latches, freezes four years, and gives them back one year at a time', () => {
    const { world, rng } = freshWorld('college-test')
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    expect(world.ending?.type).toBe('college')
    expect(world.college).not.toBeNull()
    expect(inCollege(world)).toBe(true)
    const from = world.week
    for (let year = 1; year <= ENDINGS.collegeYears; year++) {
      resumeFromCollege(world, rng)
      expect(world.week, `after year ${year}`).toBe(from + year * WEEKS_PER_YEAR)
      expect(world.college!.years, `one row per year lived`).toHaveLength(year)
      // The latch goes back on for every year but the last – that is what makes the question exist.
      if (year < ENDINGS.collegeYears) expect(world.ending?.type, `year ${year}`).toBe('college')
    }
    expect(world.ending).toBeNull()
    expect(world.week).toBe(from + ENDINGS.collegeYears * WEEKS_PER_YEAR)
    expect(inCollege(world)).toBe(false)
    expect(world.college?.doneWeek).toBe(world.week)
  }, 90_000)

  it('⚠ she comes back with no ranking at all, and no rule was written for it', () => {
    // She entered nothing for 208 weeks, so every result she owned has aged out of the rolling
    // 52-week window. "No ranking at all" is what the ladder already does to a player who does not
    // play - §5.1 bought for free.
    const { world, rng } = freshWorld('college-rank')
    for (let i = 0; i < 40; i++) tickWeek(world, rng)
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    for (let year = 0; year < ENDINGS.collegeYears; year++) resumeFromCollege(world, rng)
    const kidResults = world.results.filter((r) => r.playerId === 'KID')
    expect(kidResults).toHaveLength(0)
  }, 90_000)

  it('the family stops paying: no coaching is billed across the freeze', () => {
    const { world, rng } = freshWorld('college-money')
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    const spentBefore = world.careerTotals.spentCents
    const from = world.week
    for (let year = 0; year < ENDINGS.collegeYears; year++) resumeFromCollege(world, rng)
    // ⚠ THE SPAN IS [fromWeek, untilWeek): `untilWeek` is her FIRST WEEK BACK, and it is billed like
    // any other, so it is excluded here. `financeWeeks` prunes to 60 weeks, so this is the last
    // fourteen months of the freeze - which is exactly the stretch a bug would have to survive.
    const until = world.college!.untilWeek
    const coachingInFreeze = world.financeWeeks
      .filter((w) => w.week > from && w.week < until)
      .reduce((s, w) => s + (w.byCategory.coaching ?? 0), 0)
    expect(coachingInFreeze).toBe(0)
    // ...and the balance is HIGHER than it was, because the parent kept working.
    expect(world.careerTotals.earnedCents).toBeGreaterThan(0)
    expect(world.careerTotals.spentCents).toBeGreaterThanOrEqual(spentBefore)
  }, 90_000)
})

describe('the break-even milestone – captured, never reconstructed', () => {
  it('fires the week prize passes spend, once, and only on prize money', () => {
    const { world } = freshWorld()
    world.careerTotals = { earnedCents: 900_00, spentCents: 500_00, prizeCents: 0, weeksLostToInjury: 0 }
    captureBreakEven(world)
    expect(world.milestones.filter((m) => m.type === 'break-even')).toHaveLength(0)
    world.careerTotals.prizeCents = 600_00
    world.week = 400
    captureBreakEven(world)
    captureBreakEven(world)
    const rows = world.milestones.filter((m) => m.type === 'break-even')
    expect(rows).toHaveLength(1)
    expect(rows[0].week).toBe(400)
  })
})

describe('the album – seven pages, every career', () => {
  it('has exactly seven, in slot order, with a visible reason on every one', () => {
    const { world, rng } = freshWorld('album-test')
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    latchEnding(world, { type: 'stopped', week: world.week, ageYears: 19, detail: 'x', resumesWeek: null })
    const album = buildAlbum(world)
    expect(album.map((p) => p.slot)).toEqual([1, 2, 3, 4, 5, 6, 7])
    for (const p of album) expect(p.why.length).toBeGreaterThan(0)
  })

  it('⚠ SLOT 3 IS EMPTY FOR THE NINETEEN-YEAR-OLD WHO NEVER TURNED PRO, and says so plainly', () => {
    const { world, rng } = freshWorld('album-19')
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    latchEnding(world, { type: 'stopped', week: world.week, ageYears: 19, detail: 'x', resumesWeek: null })
    const slot3 = buildAlbum(world)[2]
    expect(slot3.empty).toBe(true)
    expect(slot3.fact).toBeNull()
    // No consolation: the page may not soften the answer the player was allowed to give.
    expect(slot3.why.toLowerCase()).not.toMatch(/but |still |at least/)
  })

  it('slot 5 has no empty face to build – the fallback fills even for a career that never was', () => {
    const { world } = freshWorld('album-worst')
    world.seasonHistory = [
      { seasonIndex: 0, endRank: 90, points: 1, wins: 1, losses: 1, fundsDeltaCents: 0, endFundsCents: 0 },
      { seasonIndex: 1, endRank: 160, points: 1, wins: 1, losses: 1, fundsDeltaCents: 0, endFundsCents: 0 },
    ]
    const slot5 = buildAlbum(world)[4]
    expect(slot5.empty).toBe(false)
    expect(slot5.why).toContain('70')
  })

  it('the hand-off asks whether there was a child, and v1 always answers no', () => {
    const { world } = freshWorld()
    latchEnding(world, { type: 'natural', week: 900, ageYears: 31, detail: 'x', resumesWeek: null })
    const view = buildEndingView(world)!
    expect(view.handoff.childBorn).toBe(false)
    expect(view.handoff.freshCapitalFork).toBe(true)
  })

  it('the snapshot carries the epilogue as a FIELD, so a reload still shows it', () => {
    const { world } = freshWorld()
    latchEnding(world, { type: 'plateau', week: 700, ageYears: 27, detail: 'x', resumesWeek: null })
    const snap = toSnapshot(world)
    expect(snap.ending).not.toBeNull()
    expect(snap.ending!.album).toHaveLength(7)
    expect(snap.stopReasons).toBeUndefined()
  })
})

// --- the two properties ---------------------------------------------------------------------------

describe('⚠ tickWeek stays TOTAL', () => {
  it('a latched world draws exactly what an unended twin draws', () => {
    const seed = 'total-tick'
    const a = createWorld(seed, { ...DEFAULT_PROFILE })
    const b = createWorld(seed, { ...DEFAULT_PROFILE })
    a.rngMain = initMainState(seed)
    b.rngMain = initMainState(seed)
    const rngA = resumeMain(a.rngMain)
    const rngB = resumeMain(b.rngMain)
    for (let i = 0; i < 12; i++) tickWeek(a, rngA)
    for (let i = 0; i < 12; i++) tickWeek(b, rngB)
    expect(a.rngMain.n).toBe(b.rngMain.n)
    // Latch one of them and keep ticking BOTH: this is what `replayMainState` does to a probe world
    // that goes bankrupt mid-replay, and if the tick short-circuited here the two would part.
    latchEnding(a, { type: 'bankruptcy', week: a.week, ageYears: 14, detail: 'x', resumesWeek: null })
    for (let i = 0; i < 12; i++) tickWeek(a, rngA)
    for (let i = 0; i < 12; i++) tickWeek(b, rngB)
    expect(a.rngMain.n).toBe(b.rngMain.n)
    expect(a.rngMain.s).toBe(b.rngMain.s)
  })
})

describe('⚠ input-independence survives college', () => {
  // ⭐ GUARD RE-AIMED, NOT WEAKENED (P5, 16.08). The suppressions are unchanged and so is the
  // property; what moved is that four years now take four commands instead of one, and the whole
  // point of the assertion is that the NUMBER OF COMMANDS cannot be visible on the MAIN stream.
  // `tests/college-second-act.test.ts` asks the same question of a single year.
  it('four years of suppressed bills cost the MAIN stream not one draw', () => {
    const seed = 'college-invariance'
    const a = createWorld(seed, { ...DEFAULT_PROFILE })
    const b = createWorld(seed, { ...DEFAULT_PROFILE })
    a.rngMain = initMainState(seed)
    b.rngMain = initMainState(seed)
    const rngA = resumeMain(a.rngMain)
    const rngB = resumeMain(b.rngMain)
    // A goes to college; B does nothing at all. Same seed, same weeks, same MAIN sequence.
    a.fork = { askedWeek: a.week, answer: null }
    answerFork(a, 'college')
    for (let y = 0; y < ENDINGS.collegeYears; y++) resumeFromCollege(a, rngA)
    for (let i = 0; i < ENDINGS.collegeYears * WEEKS_PER_YEAR; i++) tickWeek(b, rngB)
    expect(a.week).toBe(b.week)
    expect(a.rngMain.n).toBe(b.rngMain.n)
    expect(a.rngMain.s).toBe(b.rngMain.s)
  }, 90_000)
})

// --- acceptance: a PRE-WAVE save opens, plays, and can reach an ending ----------------------------

describe('⚠ a career saved before this wave existed', () => {
  // The golden corpus already proves every historical fixture MIGRATES (tests/goldenSaves.test.ts).
  // That is a shape check. This is the behavioural one the wave was asked for: take the last save
  // shape that shipped WITHOUT any of this - v38, a real career at week 60 - migrate it, and then
  // actually play it until the story stops. If the v39 back-fills were wrong in any way that
  // mattered, this is where it would show: a fork that re-asks a decision she made years ago, a debt
  // spell reconstructed into an instant death, or a `careerTotals` that cannot be added to.
  it('migrates, ticks, and reaches a real ending', () => {
    const raw = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v38.json', import.meta.url), 'utf8'),
    ) as unknown
    const world = migrateSave(raw)
    const rng = rngFromSeed(world.seed)

    // the back-fills, checked before a single week is played
    expect(world.ending).toBeNull()
    expect(world.college).toBeNull()
    expect(world.retirementOffer).toBeNull()
    expect(world.oneMoreYearCount).toBe(0)
    expect(world.careerTotals.spentCents).toBeGreaterThan(0)
    // week 60 is age 15, so she is UNDER nineteen and the fork is hers still to answer
    expect(world.fork).toBeNull()

    const openedAt = world.week
    // Play it. No entries, no commands - just the weeks, exactly as a fast-forward would.
    for (let i = 0; i < 1400 && world.ending === null; i++) {
      if (world.fork !== null && world.fork.answer === null) {
        answerFork(world, 'continue')
        continue
      }
      if (world.retirementOffer !== null) {
        answerRetirement(world, world.retirementOffer.final || world.retirementOffer.reason === 'plateau')
        continue
      }
      // ⚠ THE REVEAL TRIO IS UNGUARDED ON PURPOSE, and this is where that matters: a migrated save
      // arrives holding entries, so the very first weeks produce tournaments to close. If those were
      // guarded, a career that latched on a tournament week could never clear `pendingTournament` -
      // the one piece of state `advanceWeeks` refuses to tick past.
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
        continue
      }
      tickWeek(world, rng)
    }

    expect(world.week).toBeGreaterThan(openedAt)
    expect(world.ending).not.toBeNull()
    // ...and the epilogue it lands on is a real one, built from a career that predates it.
    const view = buildEndingView(world)!
    expect(view.album).toHaveLength(7)
    expect(view.album.every((p) => p.why.length > 0)).toBe(true)
    expect(view.totals.spentCents).toBeGreaterThan(0)
  }, 60_000)
})
