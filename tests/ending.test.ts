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
  ENDING_TITLE,
  bankruptcyDue,
  careerEndingInjuryDue,
  debtWeeks,
  detectEnding,
  endingForForkAnswer,
  endingForRetirement,
  forkDue,
  // ⭐ THE LONG GOODBYE, STEP 4 – her own last word, pinned through the engine's symbol rather than
  // through a spelling (`RELEASE_LINE_PREFIX` / `CAREER_ENDED_REFUSAL`'s own precedent).
  LAST_WORD_OPENING,
  lastWordLine,
  plateauReading,
  retirementDue,
  weeksLostSoFar,
  type AutoEndingView,
  type PlateauView,
} from '../src/engine/ending'
import {
  closeTournament,
  collegeLeagueRevealOpen,
  skipTournament,
  createWorld,
  advanceWeeks,
  tickWeek,
  answerFork,
  answerRetirement,
  chooseGift,
  pendingBirthday,
  resumeFromCollege,
  enterEvent,
  hireCoach,
  bookVacation,
  setKitGrade,
  inCollege,
  latchEnding,
  measureCollegeOffer,
  lastRungSeasonIndexOf,
  plateauViewOf,
  resolveCollegeDeparture,
  resolveEndings,
  buildEndingView,
  buildAlbum,
  captureBreakEven,
  toSnapshot,
  LAST_OFFER_NOT_A_QUESTION,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed, resumeMain, initMainState, type Rng } from '../src/engine/rng'
import { nextAcademicYearStart, schoolEndWeek } from '../src/engine/kidLife'
import { DEFAULT_PROFILE, LADDER_TRACKS } from '../src/shared/protocol'
import type { CareerEndingType, SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
// ⭐ THE LONG GOODBYE, STEP 2 – the walk (phase 4 of the tick) and the curve the threshold is read
// against. See the describe block that spends them for why the walk is not a whole `tickWeek`.
import { kidAgeExact, kidAgeYears } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { ageAtPhysicalShare } from '../src/engine/development'

/** ⭐⭐⭐ ROUND 26 #6 RE-AIM – THE PRESS THAT ANSWERS THE CHAMPIONSHIP. `resumeFromCollege` now PAUSES
 *  the year on the College League week the way it already pauses on her birthday, because the owner
 *  had been told about the tournament instead of shown it. So every walk here answers the reveal the
 *  way the player does – «Skip all rounds», then the finale's «Continue», which are `skipTournament`
 *  and `closeTournament` dispatched at the college reveal. Nothing measured below moved; the walk
 *  answers one more question and its press ceiling grows by one a year. The full note is in
 *  tests/college-league.test.ts, and the flow itself in tests/round26-college-flow.test.ts. */
function answerLeagueReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}


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

describe('#1/#2 the fork, asked when school ends', () => {
  // ⚠ RE-AIMED BY ROUND 24 #5 (owner: «пункт 5 запускай как обсудили»). The predicate used to read
  // her AGE («due once she is nineteen»); it reads the WEEK against `schoolEndWeek` now – the ask
  // moved off her birthday to the week school ends, and enrolment moved to the departure. The
  // anchor weeks are the measured ones from docs/specs/school-ends-2026-08.md §2: 242 (Jan–Aug
  // births), 294 (Sep–Dec).
  it('is due once school is over and never once asked', () => {
    expect(forkDue(schoolEndWeek(6) - 1, 6, false)).toBe(false)
    expect(forkDue(schoolEndWeek(6), 6, false)).toBe(true)
    expect(forkDue(schoolEndWeek(6) + 300, 6, true)).toBe(false)
    // ...and the cohort split is the school's, not the draw sheet's: a December girl leaves a year
    // later in absolute weeks than a June girl, so her fork waits for HER September.
    expect(schoolEndWeek(6)).toBe(242)
    expect(schoolEndWeek(12)).toBe(294)
    expect(forkDue(242, 12, false)).toBe(false)
    expect(forkDue(294, 12, false)).toBe(true)
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
      // ⭐ THE LONG GOODBYE §3a – a body still at its peak, so the fixture's DEFAULT is "not final"
      // and every case below that wants the last offer has to say so with a number. `plateauReading`
      // never reads this field; only `retirementDue` does.
      physicalShare: 1,
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

  // ⚠⚠ RE-AIMED FOR THE LONG GOODBYE (§3a), NOT WEAKENED, AND THE RE-AIM IS THE POINT OF THE STEP.
  // This read `ageYears: 37` against `ageYears: ENDINGS.stopAskingAgeYears` and asserted that 38 is
  // where the game stops asking. There is no such age any more: the constant is deleted and the last
  // offer is a share of her own peak physical. So the two arms below hold the AGE FIXED and move
  // only the body – which is the whole claim, and which the old shape could not have made.
  it('⭐⭐ the offer is final when her BODY crosses, and the age is not consulted at all', () => {
    const old = { ageYears: 44, lastRungSeasonIndex: 12 }
    const strong = retirementDue(plateauView({ ...old, physicalShare: ENDINGS.lastOfferPeakShare + 0.01 }))
    const spent = retirementDue(plateauView({ ...old, physicalShare: ENDINGS.lastOfferPeakShare - 0.01 }))
    expect(strong?.final, 'a body above the threshold is asked again, at any age').toBe(false)
    expect(spent?.final, 'a body below it is asked for the last time').toBe(true)
    expect(spent?.reason).toBe('age')
  })

  it('⭐ ...and it is final EXACTLY when the share crosses, not before', () => {
    const at = (physicalShare: number) =>
      retirementDue(plateauView({ ageYears: 33, lastRungSeasonIndex: 12, physicalShare }))?.final
    // ⚠ `<=` IS THE SHIPPED BOUNDARY: standing exactly at the threshold is the off-season the
    // question runs out. One hundredth either side is what makes this an assertion about the
    // comparison rather than about the constant's value.
    expect(at(ENDINGS.lastOfferPeakShare + 0.0001)).toBe(false)
    expect(at(ENDINGS.lastOfferPeakShare)).toBe(true)
    expect(at(ENDINGS.lastOfferPeakShare - 0.0001)).toBe(true)
    // and a body that has not started declining is never the last offer, whatever her age
    expect(at(1)).toBe(false)
  })

  it('⚠ `askFromAgeYears` still gates EVERYTHING – a ruined body at 28 is not asked at all', () => {
    // The share means nothing before the decline exists, and this is the guard that says so. A view
    // at 28 with 10% of her peak left is physically impossible in the engine (`declineStart` is 29,
    // so the share is exactly 1 until then) – which is precisely why it is the right fixture: even
    // handed an absurd body, the rule refuses to raise an age offer before 29.
    const wrecked = retirementDue(plateauView({ ageYears: 28, lastRungSeasonIndex: 12, physicalShare: 0.1 }))
    expect(wrecked, 'nothing fires before 29 whatever the share says').toBeNull()
    // ...and one year later the same body IS asked, so the null above is the gate and not the fixture
    const asked = retirementDue(plateauView({ ageYears: 29, lastRungSeasonIndex: 12, physicalShare: 0.1 }))
    expect(asked?.reason).toBe('age')
    expect(asked?.final).toBe(true)
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

// =================================================================================================
// ⭐⭐⭐ THE LONG GOODBYE, STEP 2 – THE LAST OFFER LEAVES THE BIRTHDAY AND FINDS HER BODY
// =================================================================================================
//
// docs/specs/the-long-goodbye-2026-08.md §3a, on the owner's reading of the news (26.08): «Roger
// Federer играл активно до 41 года … отсюда у меня мысли на тему нашей жесткой концовки в 38».
// `ENDINGS.stopAskingAgeYears` is deleted; `retirementDue` reads the share of her own peak physical.
//
// ⚠ EVERY CLAIM BELOW IS MADE OF A REAL `WorldState` AND GOES THROUGH `resolveEndings`, for the same
// reason round-19 #1's block further down does: a hand-built `PlateauView` would pass whatever
// `plateauViewOf` did to the numerator and the denominator, and the numerator and the denominator
// are the whole mechanic here.
describe('⭐⭐ the last offer, read off a walked body', () => {
  const WRAP_WEEK = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

  interface Wrap {
    week: number
    /** whole years, as `plateauViewOf` reads them */
    ageYears: number
    /** ...and fractional, which is what the body is actually a function of */
    exact: number
    share: number
    final: boolean | null
  }

  /** Walk a career to `toAge`, raising the offer through the REAL `resolveEndings` on every
   *  off-season wrap week and reading the world back.
   *
   *  ⚠ THE GROWTH PHASE FOR THE WALK, `resolveEndings` FOR THE RULE, and the split is deliberate –
   *  it is step 1's own argument (tests/peak-physical.test.ts) applied to step 1's own field.
   *  Reaching the decline is 27 years and a full `tickWeek` costs ~5.6 ms of tournaments, finance,
   *  brackets and AI against 0.035 ms for `growAndLive`, which IS `tickWeek`'s phase 4 and the only
   *  code in the engine that writes `world.skills` or `world.peakPhysical`. So the walk is cheap and
   *  the READER is real: nothing here re-implements the trigger, computes a share by hand, or builds
   *  a view. ⚠ Nothing latches an ending during the walk either, and that is a property rather than
   *  luck – the two automatic endings need money and injuries, and neither phase is being run.
   *
   *  ⚠ WHAT OPENS THE GAP BETWEEN TWO BODIES IS THE GIRL, NOT THE MANAGEMENT, and that is measured
   *  rather than assumed. `gain = rate * headroom`, so growth is headroom-limited and by 30 almost
   *  everyone is near their own ceiling: across the whole span from working/self-coached/Light to
   *  wealthy/elite/Grind, ONE seed's peak moves about 8%. Across seeds it moves 26%, because
   *  `potential` is what actually differs. So the wrecked/kept pair below varies both. */
  function walkTheWraps(cfg: {
    seed: string
    background?: 'working' | 'middle' | 'wealthy'
    coachTier?: 'self' | 'budget' | 'middle' | 'high' | 'elite'
    train?: number
    toAge: number
    /** stop on the week the offer becomes final – i.e. walk a career the way a game ends one */
    stopAtFinal?: boolean
  }): { world: WorldState; wraps: Wrap[] } {
    const world = createWorld(cfg.seed, {
      ...DEFAULT_PROFILE,
      ...(cfg.background ? { background: cfg.background } : {}),
      ...(cfg.coachTier ? { coachTier: cfg.coachTier } : {}),
    })
    const rng = rngFromSeed(world.seed)
    if (cfg.train !== undefined) world.plan = { ...world.plan, train: cfg.train }
    // the fork answered, so `resolveEndings` reaches step 7d instead of stopping at 7c
    world.fork = { askedWeek: 300, answer: 'continue', offer: null }
    const wraps: Wrap[] = []
    const ageNow = () => kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    while (ageNow() < cfg.toAge) {
      world.week += 1
      growAndLive(world, rng)
      if (world.week % WEEKS_PER_YEAR !== WRAP_WEEK) continue
      resolveEndings(world)
      const view = plateauViewOf(world)
      const raised = world.retirementOffer
      wraps.push({
        week: world.week,
        ageYears: view.ageYears,
        exact: ageNow(),
        share: view.physicalShare,
        final: raised?.final ?? null,
      })
      if (raised?.final) {
        if (cfg.stopAtFinal) break
        // ⚠ RE-AIMED, NOT WEAKENED (the long goodbye step 4). It read «SHE CANNOT REFUSE THE LAST
        // ONE – `answerRetirement` throws on it by design», which was a rule ABOUT HER; the last
        // offer is now her own statement and there is no refusal to make. The throw is still there
        // and this line still has to route around it, but it guards an illegal MESSAGE now
        // (`LAST_OFFER_NOT_A_QUESTION`), not a refusal she is forbidden. These walks are about WHEN
        // the offer turns final rather than about what she says, so the card is taken off the table
        // by hand and the next off-season is allowed to raise it again, which is what lets a walk
        // read the share past the crossing. `stopAtFinal` is the arm that ends properly.
        world.retirementOffer = null
      } else if (raised) {
        // ...and every offer before it is answered the way a player answers it: «One more year, she
        // said. Same as last time.» The REAL command, so `oneMoreYearCount` is real too.
        answerRetirement(world, false)
      }
    }
    return { world, wraps }
  }

  it('⭐⭐⭐ 70% IS TODAY\'S RULE: the off-season her body first falls to 70% is the off-season she is first 38', () => {
    // THE PROOF THAT THIS IS A GENERALISATION AND NOT A NEW RULE, and it is pinned independently of
    // whatever the dial is set to, so it goes on being true after the threshold moves. `70%` is a
    // literal on purpose: it is the row of §3a's table that reproduces the deleted
    // `ENDINGS.stopAskingAgeYears = 38`, and if this line ever needs changing then the claim the
    // change was sold on has stopped holding.
    const { wraps } = walkTheWraps({ seed: 'goodbye-generalisation', toAge: 40 })
    const byBody = wraps.find((w) => w.share <= 0.7)
    const byBirthday = wraps.find((w) => w.ageYears >= 38)
    expect(byBody, 'she never fell to 70% inside the walk').toBeDefined()
    expect(byBody!.week, 'the body and the birthday name the same off-season').toBe(byBirthday!.week)
    expect(byBody!.ageYears).toBe(38)
    // ⚠ AND THE YEAR BEFORE IS ABOVE IT – otherwise the line above would be satisfied by a rule that
    // fires on every wrap. She is 37 with 71.2% left, which is the season the old rule also left open.
    const before = wraps[wraps.indexOf(byBody!) - 1]
    expect(before.ageYears).toBe(37)
    expect(before.share).toBeGreaterThan(0.7)
  })

  it('⭐⭐ the last offer arrives on the first off-season AFTER her body crosses, and never before it', () => {
    const { wraps } = walkTheWraps({ seed: 'goodbye-lands', toAge: 44 })
    const first = wraps.find((w) => w.final === true)
    expect(first, 'no last offer was ever raised inside the walk').toBeDefined()
    // Threshold-independent: the crossing is continuous, the question is annual, so the offer lands
    // in the year that follows the crossing – it may not anticipate it and may not be a year late.
    const crossing = ageAtPhysicalShare(ENDINGS.lastOfferPeakShare)
    expect(first!.exact, 'the offer anticipated the crossing').toBeGreaterThanOrEqual(crossing)
    expect(first!.exact, 'the offer was more than a season late').toBeLessThan(crossing + 1)
    // ...and every earlier off-season from 29 asked the same question WITHOUT being the last one,
    // which is the decade of "one more year" the spec insists this change does not touch.
    const asked = wraps.filter((w) => w.ageYears >= ENDINGS.askFromAgeYears && w.week < first!.week)
    expect(asked.length, 'she was asked every off-season from 29').toBe(first!.ageYears - ENDINGS.askFromAgeYears)
    expect(asked.every((w) => w.final === false)).toBe(true)
    // ⭐ AND WHERE THE SHIPPED DIAL PUTS IT, AS A NUMBER, so moving the constant has to come past
    // this line. §3a's 41.2 is the CROSSING; the question is asked once a winter, so on
    // `DEFAULT_PROFILE`'s 15 June birthday the offer itself lands at 41.5 – still 41, still Federer.
    expect(ENDINGS.lastOfferPeakShare, 'the owner\'s ruling of 26.08: «я бы взял 55% по уходу»').toBe(0.55)
    expect(first!.ageYears).toBe(41)
    expect(first!.exact).toBeCloseTo(41.503, 3)
  })

  it('⚠⚠ AND IT IS AGE-EQUIVALENT TODAY: two bodies 25% apart read the SAME share, off-season for off-season', () => {
    // ⚠⚠ THIS PINS A MEASURED FACT, NOT A DESIGN GOAL, AND IT IS THE OPPOSITE OF §3's PROMISE.
    // The spec says «a body wrecked by 33 finishes at 33»; TODAY IT DOES NOT, and this is the test
    // that says so out loud instead of letting the sentence stand unchecked. Why it cannot: the peak
    // is frozen the week `declineStart` arrives (`ageFactor` returns 0 from 29, so the gain term is
    // gone) and `growWeek`'s loss is PROPORTIONAL per attribute – so every career leaves 29 at a
    // share of exactly 1 and loses the same fraction of it every week thereafter. A wrecked body has
    // a lower PEAK, which is real tennis and no part of a ratio to that same peak.
    //
    // ⚠ SO IT IS A TRIPWIRE, AND A DELIBERATE ONE. The day something lands that lowers her physical
    // relative to her own peak – an atrophy term, a peak that keeps rising past 29, anything – this
    // goes red, and the right response is to re-aim it at the new spread rather than to delete it.
    const kept = walkTheWraps({ seed: 'goodbye-13', background: 'wealthy', coachTier: 'elite', train: 85, toAge: 43 })
    const never = walkTheWraps({ seed: 'goodbye-11', background: 'working', coachTier: 'self', train: 60, toAge: 43 })
    // 69.45 against 55.25 – the widest pair in a fourteen-seed sweep of both extremes of the game's
    // own management axes. If the premise ever stops holding this line is what says so.
    expect(kept.world.peakPhysical / never.world.peakPhysical, 'the two bodies really are different')
      .toBeGreaterThan(1.2)
    expect(kept.wraps.length).toBe(never.wraps.length)
    for (let i = 0; i < kept.wraps.length; i++) {
      const a = kept.wraps[i]
      const b = never.wraps[i]
      expect(b.share, `age ${a.ageYears}: the kept body and the wrecked one read differently`)
        .toBeCloseTo(a.share, 6)
      expect(b.final, `age ${a.ageYears}: they were asked for the last time in different years`).toBe(a.final)
    }
  })

  // ⚠ RE-AIMED, NOT DELETED (the long goodbye step 4). Step 2 pinned the two lines that used to
  // interpolate `ENDINGS.stopAskingAgeYears`, and the CLAIM it was making – no constant survives in
  // either, both read the age she actually reached – is still exactly the claim being made here.
  // What moved is the wording around the number, because step 4 put her in the sentence: the feed
  // line was «She is 41. Nobody is going to ask her again» (the game announcing it has stopped
  // asking) and is now her own last word, and the epilogue's «the last time anybody asked» named a
  // question nobody asks any more. Both are pinned THROUGH THE ENGINE'S OWN SYMBOL now, so a
  // re-wording moves the assertion with the copy instead of breaking it.
  it('⚠ the last-offer event and the epilogue print HER age and HER line, and no constant survives in either', () => {
    const { world, wraps } = walkTheWraps({ seed: 'goodbye-copy', toAge: 43, stopAtFinal: true })
    const last = wraps.find((w) => w.final === true)!
    const said = world.events.filter((e) => e.text.includes(LAST_WORD_OPENING))
    expect(said).toHaveLength(1)
    // ⚠ THE NUMBER IS RE-DERIVED FROM HER CLOCK RATHER THAN COMPARED TO A LITERAL, which is what
    // makes this dial-independent: move `lastOfferPeakShare` and the sentence follows her age,
    // because there is no constant left in it to disagree with.
    const herAge = kidAgeYears(last.week, world.profile.birthMonth, world.profile.birthDay)
    expect(said[0].text).toBe(`She is ${herAge}. ${lastWordLine(world.oneMoreYearCount)}`)
    // ⭐ AND THE LINE REALLY IS READING HER STATE, not printing a fixed sentence with a symbol's
    // name on it: this walk answers every non-final offer with «one more year», so the count is real
    // and the branch that spends it is the one that ran.
    expect(world.oneMoreYearCount, 'the walk filed real refusals').toBeGreaterThan(0)
    expect(said[0].text).toContain(`She has said one more year ${world.oneMoreYearCount} times`)

    // ...and the epilogue's own detail line, through the real answer.
    world.week = last.week
    world.retirementOffer = { askedWeek: last.week, seasonIndex: 0, reason: 'age', final: true }
    answerRetirement(world, true)
    expect(world.ending?.type).toBe('natural')
    expect(world.ending?.detail).toBe(`${herAge}, and nobody had to ask her`)
  })

  // ⚠ THE OTHER FIVE ENDINGS ARE UNTOUCHED, AND THIS IS WHERE THAT IS CHECKED. Step 4 rewrote ONE
  // branch of ONE detail line, and `latchEnding` composes every ending's feed row out of the same
  // two halves – `${ENDING_TITLE[type]} – ${detail}.` – so a detail that stopped being a fragment
  // would break a sentence in five places nobody was looking at. College is in the list on purpose:
  // it is an ending that can be RESUMED, so its row is read by a player whose career is still alive.
  it('⚠ the epilogue line still reads for every ending type, college included', () => {
    // ⚠ EVERY DETAIL COMES OFF ITS REAL PRODUCER. A table of six hand-written fragments would pass
    // this test while the engine wrote something else entirely.
    const hurt = autoView({
      freshInjurySeverity: 'severe',
      injuryHistory: [{ severity: 'severe', weeksOut: 18 }, { severity: 'major', weeksOut: 10 }],
    })
    const details: Record<CareerEndingType, string> = {
      stopped: endingForForkAnswer('stop', 265, 19, ENDINGS.collegeYears, WEEKS_PER_YEAR)!.detail,
      college: endingForForkAnswer('college', 265, 19, ENDINGS.collegeYears, WEEKS_PER_YEAR)!.detail,
      bankruptcy: detectEnding(autoView({ fundsCents: -1, debtSinceWeek: 0, week: 100 }))!.detail,
      injury: detectEnding(hurt)!.detail,
      natural: endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }, 1453, 41, 4).detail,
      plateau: endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'plateau', final: false }, 700, 26, 0).detail,
    }
    for (const type of Object.keys(details) as CareerEndingType[]) {
      const { world } = freshWorld(`epilogue-${type}`)
      latchEnding(world, { type, week: world.week, ageYears: 30, detail: details[type], resumesWeek: null })
      const row = world.events.find((e) => e.text.startsWith(ENDING_TITLE[type]))
      expect(row, `${type}: the latch wrote no line`).toBeDefined()
      expect(row!.text, `${type}`).toBe(`${ENDING_TITLE[type]} – ${details[type]}.`)
      // A fragment, not a sentence: no capital opening it and no full stop of its own, or the
      // composed row reads «She played until she was done – She was 41..».
      expect(details[type], `${type}: the detail ends in its own full stop`).not.toMatch(/\.$/)
      expect(row!.text, `${type}: the row is not a sentence`).toMatch(/^[A-Z].*\.$/)
      expect(row!.text, `${type}: a long dash reached the player's record`).not.toMatch(/[—―]/)
    }
    // ⭐ AND THE ONE THAT MOVED SAYS SO, so this is not a vacuous sweep over six strings.
    expect(details.natural).toBe('41, and nobody had to ask her')
    expect(details.natural, 'the epilogue still names a question nobody asks').not.toContain('asked')
  })
})

// --- the world side -------------------------------------------------------------------------------

function freshWorld(seed = 'ending-test') {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(seed)
  return { world, rng }
}

/** ⚠ ROUND 24 #5 – the college answer RESERVES; enrolment happens at the DEPARTURE (the next
 *  academic-year September, `fork.departsWeek`). The freeze cases in this file are about the YEARS,
 *  so this helper walks the gap the way a player's world does – it simply ticks – and hands back
 *  the enrolled career. The walked-gap semantics themselves are pinned in
 *  tests/college-departure.test.ts. */
function answerCollegeAndDepart(world: WorldState, rng: Rng): void {
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) tickWeek(world, rng)
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
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    expect(advanceWeeks(world, rng, 1)).toEqual(['fork'])
    world.fork = { askedWeek: world.week, answer: 'continue', offer: null }
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
    expect(advanceWeeks(world, rng, 1)).toEqual(['retirement'])
  })

  it('answering is the only exit, and an unprompted answer is refused', () => {
    const { world } = freshWorld()
    expect(() => answerFork(world, 'stop')).toThrow(/not open/)
    expect(() => answerRetirement(world, true)).toThrow(/asked/)
  })

  // ===============================================================================================
  // ⭐⭐ THE COLLEGE ANSWER IS UNCONDITIONAL – AN OWNER RULING OF 16.08, AND IT RETIRES A WHOLE BLOCK
  // ===============================================================================================
  // WHAT WAS HERE, AND WHY IT IS NOT: eleven cases across three sections – round-17 #6's gate ("the
  // college answer closes once a professional result has counted"), P4's four decoupling proofs, and
  // P4's four warning cases. Every one of them tested `ENDINGS.collegeClosedFromTier` or something
  // that read it, and the owner removed the rule: «collegeClosedFromTier – так ведь нет же там
  // никакой связи с w75, мы же всё узнали. Колледж – это независимая ветка карьеры с отдельным
  // функционалом и турнирами, альтернативная.»
  //
  // ⚠ THE REASONING IS NOT LOST – it is on the retired constant in `src/engine/ending.ts`, which is
  // where a reader looking for "why did the college door used to shut" will go. What matters here is
  // that this file's coverage did not simply shrink: the three cases below are the SAME properties
  // asserted in the direction the ruling puts them, and each is mutation-verified against the obvious
  // way to reintroduce the rule.
  //
  // ⚠⚠ AND P4's DECOUPLING PROOFS ARE RETIRED RATHER THAN DELETED-AS-REDUNDANT. They moved
  // `w75.acceptsRank` over 450/300/1/5000 and `w75.points` to and from zero and asserted the college
  // answer did not follow. With no college rule at all there is nothing left for a calendar constant
  // to couple to, so the property they defended is now structural rather than tested – which is a
  // stronger state than a passing test, and is the only reason it is acceptable to lose them.
  it('⭐⭐ the college answer survives ANY result – there is no rung that spends it', () => {
    const { world } = freshWorld('fork-college-unconditional')
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    // The exact career round-17 #6 was about: a professional ranking and a real result at the rung
    // that used to take the answer away. She won the thing.
    world.bestFinishByTier = { w75: 0, wta250: 1, w15: 0 }
    answerFork(world, 'college')
    expect(world.fork?.answer, 'the answer is taken').toBe('college')
    // ⚠ RE-AIMED BY ROUND 24 #5, NOT WEAKENED: the answer RESERVES now – the four years begin at
    // the DEPARTURE, the next academic-year September – so "she is in the four years" is asserted
    // at the departure instead of at the click. The property under test is unchanged: no result of
    // any kind spends the answer or the place.
    expect(world.fork?.departsWeek).toBe(nextAcademicYearStart(world.week))
    expect(world.college, 'the hold – reserved, not enrolled').toBeNull()
    world.week = world.fork!.departsWeek!
    resolveCollegeDeparture(world)
    expect(world.college, 'and at the departure she is in the four years, which P5 built and this ruling leaves alone').not.toBeNull()
    expect(world.college?.untilWeek).toBe(world.week + ENDINGS.collegeYears * 52)
  })

  it('⭐ ...and the card is told nothing that could remove an answer', () => {
    // The inverse of the pin this replaces, which read `expect(toSnapshot(world).fork?.collegeOpen)`.
    // `collegeOpen` was on the wire so the dialog could stop drawing an answer `answerFork` would
    // refuse; with no refusal the flag is gone, and the card draws three answers always.
    //
    // ⚠ RE-AIMED FOR v51, NOT WEAKENED (docs/specs/what-the-college-place-costs-2026-08.md). The
    // fork now carries a THIRD fact – `offer`, what the college answer costs – so "exactly two facts"
    // is no longer the claim. The claim that mattered is the one kept: **no flag on this wire decides
    // whether an answer is drawn.** `offer` is not `collegeOpen` under a new name and the two cases
    // below are what make that a tested statement rather than an assurance:
    //   * the whole key set is pinned, so a `collegeOpen` (or any other new gate) trips this; and
    //   * the strongest possible college-closing career – a W75 TITLE, exactly round-17 #6's case –
    //     still produces an offer with a place in it, so nothing on the wire went back to reading a
    //     professional result.
    const { world } = freshWorld('fork-college-wire')
    world.bestFinishByTier = { w75: 1, j300: 2, j60: 4 }
    world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
    const fork = toSnapshot(world).fork
    expect(fork, 'the fork is still on the wire').not.toBeNull()
    expect(Object.keys(fork!).sort(), 'three facts, and none of them is a gate').toEqual([
      'ageYears',
      'askedWeek',
      'offer',
    ])
    expect('collegeOpen' in fork!, 'the flag has not come back under its own name either').toBe(false)
    // ⚠⚠ AND THE W75 TITLE BOUGHT HER NOTHING AND COST HER NOTHING. The offer reads her JUNIOR
    // record; the professional title is not an input, so a programme still offered her a place.
    // ⚠ RE-AIMED FOR THE 17.08 REBUILD, NOT LOOSENED. A tier is a PLACE now and the offer carries a
    // quote for each, so "was she offered a place" is "does the cheapest quote fund her".
    // ⚠ RE-AIMED AGAIN BY ROUND 26 #2 (second pass) AND STILL NOT LOOSENED: `q.open` is gone with the
    // residence rule (v61), so the cheapest place is simply the first one – every place is hers.
    const cheapest = fork!.offer?.quotes[0] ?? null
    expect(cheapest, 'a W75 champion is still quoted a college place').not.toBeNull()
    expect(cheapest!.athleticShare).toBeGreaterThan(0)
  })

  it('⚠ ...and no entry card warns about a college place any more, because none can cost it', () => {
    // P4 put `costsCollege` on every card at or above the college rung. The rule is gone, so the
    // FIELD is gone: a warning that states a consequence which cannot happen is worse on an entry
    // card than no warning at all. Asserted structurally, so restoring the field trips this.
    const { world } = freshWorld('college-warning-retired')
    const snap = toSnapshot(world)
    expect(snap.upcoming.length, 'not a vacuous pass – there are cards to check').toBeGreaterThan(0)
    for (const e of snap.upcoming) {
      expect(Object.prototype.hasOwnProperty.call(e, 'costsCollege'), `${e.tier} carries no college flag`).toBe(false)
    }
  })

  // ⚠ RE-AIMED, NOT DELETED (the long goodbye step 4). The old title was «the last offer cannot be
  // refused, because the question has run out» and the pin was `/last time/` – a SPELLING, and the
  // spelling was of a sentence about what she is not allowed to do. Both halves move: the last offer
  // is not a question, so there is no refusal to forbid, and what is left is a guard against an
  // illegal MESSAGE reaching a command that no card can produce. Pinned by symbol now, on the
  // `CAREER_ENDED_REFUSAL` precedent.
  it('⚠ a refusal aimed at the last offer is an illegal message, and it is refused loudly', () => {
    const { world } = freshWorld()
    world.retirementOffer = { askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }
    expect(() => answerRetirement(world, false)).toThrow(LAST_OFFER_NOT_A_QUESTION)
    // ⭐ AND IT REFUSED RATHER THAN HALF-RAN: nothing was counted, nothing was written, and the
    // offer is still standing. `mutate` clones the world before a command touches it, so a throw
    // here can only ever leave the career exactly as it was – this is that promise, asserted.
    expect(world.oneMoreYearCount, 'the refusal counted a year she never asked for').toBe(0)
    expect(world.retirementOffer, 'the refusal cleared the offer on its way out').not.toBeNull()
    expect(world.events.some((e) => e.text.startsWith('One more year')), 'it wrote her a line she never said')
      .toBe(false)
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
    world.fork = { askedWeek: 300, answer: 'continue', offer: null }
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
    world.fork = { askedWeek: world.week, answer: null, offer: null }
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
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    answerCollegeAndDepart(world, rng)
    expect(world.ending?.type).toBe('college')
    expect(world.college).not.toBeNull()
    expect(inCollege(world)).toBe(true)
    const from = world.week
    for (let year = 1; year <= ENDINGS.collegeYears; year++) {
      // ⚠ ROUND 24 («да, день рождения делай»): the year PAUSES on her birthday week now, so a year
      // is press-answer-press. Every original assertion is unchanged and asked at the same boundary.
      for (let press = 0; press < 4 && world.college!.years.length < year; press++) {
        resumeFromCollege(world, rng)
        answerLeagueReveal(world)
        if (pendingBirthday(world) !== null) chooseGift(world, 'day')
      }
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
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    answerCollegeAndDepart(world, rng)
    // Press-answer-press (round 24): each year pauses on her birthday week.
    for (let press = 0; press < 4 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerLeagueReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    const kidResults = world.results.filter((r) => r.playerId === 'KID')
    expect(kidResults).toHaveLength(0)
  }, 90_000)

  it('the family stops paying: no coaching is billed across the freeze', () => {
    const { world, rng } = freshWorld('college-money')
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    answerCollegeAndDepart(world, rng)
    const spentBefore = world.careerTotals.spentCents
    const from = world.week
    // Press-answer-press (round 24): each year pauses on her birthday week – and the gift charges
    // nothing, which is exactly what this case goes on to measure.
    for (let press = 0; press < 4 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerLeagueReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
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
    a.fork = { askedWeek: a.week, answer: null, offer: null }
    // ⚠ ROUND 24 #5 – the answer reserves and A WALKS the gap to its September departure with
    // ordinary ticks (the same weeks B ticks), then spends the four years. The reservation, the
    // departure, the release and the enrolment must all cost the MAIN stream not one draw.
    answerCollegeAndDepart(a, rngA)
    // ⚠ ROUND 24 – AND THE PROPERTY GETS STRONGER, NOT DIFFERENT: the years pause on her birthdays
    // and the gifts are answered mid-walk, so the arm now proves that pausing, answering and
    // resuming cost the MAIN stream not one draw either. The B arm never pauses at all.
    for (let press = 0; press < 4 * ENDINGS.collegeYears && a.ending?.type === 'college'; press++) {
      resumeFromCollege(a, rngA)
      // ⚠ ROUND 26 #6: and the championship's reveal is answered mid-walk too – the arm now proves
      // that watching a tournament costs the MAIN stream not one draw either.
      answerLeagueReveal(a)
      if (pendingBirthday(a) !== null) chooseGift(a, 'day')
    }
    while (b.week < a.week) tickWeek(b, rngB)
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
