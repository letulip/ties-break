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
  resumeFromCollege,
  enterEvent,
  hireCoach,
  bookVacation,
  setKitGrade,
  inCollege,
  latchEnding,
  buildEndingView,
  buildAlbum,
  skipTournament,
  closeTournament,
  captureBreakEven,
  toSnapshot,
} from '../src/engine/world'
import { rngFromSeed, resumeMain, initMainState } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

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
    expect(college?.resumesWeek).toBe(260 + ENDINGS.collegeYears * 52)
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

describe('#2 college – the only ending that resumes', () => {
  it('latches, freezes four years, and gives them back in one command', () => {
    const { world, rng } = freshWorld('college-test')
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    expect(world.ending?.type).toBe('college')
    expect(world.college).not.toBeNull()
    expect(inCollege(world)).toBe(true)
    const from = world.week
    resumeFromCollege(world, rng)
    expect(world.ending).toBeNull()
    expect(world.week).toBe(from + ENDINGS.collegeYears * WEEKS_PER_YEAR)
    expect(inCollege(world)).toBe(false)
    expect(world.college?.doneWeek).toBe(world.week)
  }, 60_000)

  it('⚠ she comes back with no ranking at all, and no rule was written for it', () => {
    // She entered nothing for 208 weeks, so every result she owned has aged out of the rolling
    // 52-week window. "No ranking at all" is what the ladder already does to a player who does not
    // play - §5.1 bought for free.
    const { world, rng } = freshWorld('college-rank')
    for (let i = 0; i < 40; i++) tickWeek(world, rng)
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    resumeFromCollege(world, rng)
    const kidResults = world.results.filter((r) => r.playerId === 'KID')
    expect(kidResults).toHaveLength(0)
  }, 60_000)

  it('the family stops paying: no coaching is billed across the freeze', () => {
    const { world, rng } = freshWorld('college-money')
    world.fork = { askedWeek: world.week, answer: null }
    answerFork(world, 'college')
    const spentBefore = world.careerTotals.spentCents
    const from = world.week
    resumeFromCollege(world, rng)
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
  }, 60_000)
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
    resumeFromCollege(a, rngA)
    for (let i = 0; i < ENDINGS.collegeYears * WEEKS_PER_YEAR; i++) tickWeek(b, rngB)
    expect(a.week).toBe(b.week)
    expect(a.rngMain.n).toBe(b.rngMain.n)
    expect(a.rngMain.s).toBe(b.rngMain.s)
  }, 60_000)
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
