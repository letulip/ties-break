// ⭐⭐⭐ ROUND 24 – THE FREEZE'S HYGIENE: the world must go on playing while she is at college.
//
// ⚠⚠ WHAT THIS FILE IS THE REGRESSION NET FOR – the owner's own dead career, measured end to end by
// `tools/college-freeze-probe.ts` (A1, 21.08) and reproduced here without the bench:
//
//   1. he entered a World Tour 500 for week 270, which is simply what a parent does;
//   2. he answered the fork with «college» on week 266, and that latches an ENDING over the app;
//   3. `resumeFromCollege` ticks the year with nobody watching, so on week 270 `tickWeek` step 2
//      found the entry and stashed a `computeShadowTournament` in `world.pendingTournament`;
//   4. that reveal was UNANSWERABLE – `EndingScreen` replaces the app shell and `TournamentFlow`
//      lives inside the shell, so while the college latch is on nothing in the app can draw it;
//   5. ⭐ and from that week `tickWeek` skipped the whole of step 5-6 (`if (!world.pendingTournament)`),
//      so `recomputeRankAndMilestones`, `housekeep` – and inside it `ensureSeason`, `pruneResults`,
//      `pruneEvents` – `settleMandatoryQuota`, `maybeFireSeasonWrapUp` and `resolveEndings` never ran
//      again. 204 weeks, no calendar, no results, no rank. His save at graduation: **0 season events,
//      1 result row, and `kidRank` 1** – a 200-row junior table on which nobody held a point, so
//      competition ranking tied them all at first and the game told him she was world number one.
//
// THE THREE RULES THIS FILE HOLDS, and each has an arm that dies when only that rule is removed:
//   RULE 1  the DEPARTURE releases every outstanding entry – full refund, slot back, no forfeit and
//           no penalty, however late it lands («Мы ни за что не наказываем»). ⚠ ROUND 24 #5 moved it
//           there from the answer, on the owner's own ruling: the college answer only RESERVES a
//           place now, the gap year is played, and `resolveCollegeDeparture` fires the release the
//           week she actually leaves – an entry made while she still plays IS a commitment she made.
//   RULE 2  `resumeFromCollege` REFUSES to spend a year over an unanswered reveal, at entry and
//           mid-loop. This is the rule that closes the CLASS: rule 1 kills the entry route, rule 2
//           kills every route, including one this wave has not thought of.
//   RULE 3  `tickWeek` step 2 cannot even CONSTRUCT a reveal while `inCollege(world)`.
//
// ⚠ THE FACTS ARE PINNED, NOT THE STRINGS. Every assertion below is a property of the world – the
// calendar has future events, the ledger has rows, the table has somebody holding a point, the fee
// came back, no week ticked – so a re-tuned calendar or a re-worded feed row cannot make it lie.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  skipTournament,
  collegeLeagueRevealOpen,
  createWorld,
  tickWeek,
  enterEvent,
  answerFork,
  chooseGift,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  closeTournament,
  inCollege,
  COLLEGE_REVEAL_REFUSAL,
  RELEASE_LINE_PREFIX,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { fullRanking } from '../src/engine/world/ladder'
import { resumeMain, type Rng } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ENDINGS } from '../src/engine/ending'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** ⭐⭐⭐ ROUND 26 #6 RE-AIM – THE PRESS THAT ANSWERS THE CHAMPIONSHIP. `resumeFromCollege` now
 *  PAUSES on the College League week the way it pauses on her birthday, because the owner's
 *  complaint was that the year reported the tournament and ticked on past it. So every walk here
 *  answers the reveal the way the player does – «Skip all rounds», then the finale's «Continue» –
 *  which is `skipTournament` + `closeTournament` dispatched at the college reveal. Nothing this
 *  suite MEASURES moved: the same birthdays, the same pauses, the same banked years.
 *  The full note is in tests/college-league.test.ts. */
function answerLeagueReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}


/** A career that has actually been played – a calendar, a cohort with a results ledger behind it and
 *  a junior table with real points on it. `tickWeek` is total (only `advanceWeeks` halts), so the
 *  loop closes any reveal it produces and keeps going. */
function playedCareer(seed: string, weeks: number): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  return { world, rng }
}

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** Book the latest entry she can afford inside `weeksOut`, exactly as the probe does. ⚠ NOTHING IS
 *  FORCED: if the engine refuses every candidate the helper returns null and the caller skips – an
 *  id written past a refusal would be reproducing our own fiction instead of his career. */
function bookAnEntry(world: WorldState, weeksOut: number): string | null {
  const cand = world.season
    .filter((e) => e.week > world.week && e.week <= world.week + weeksOut && world.week <= e.deadlineWeek)
    .sort((a, b) => b.week - a.week)
  for (const e of cand) {
    try {
      enterEvent(world, e.id)
      return e.id
    } catch {
      // her rank or her purse refuses this rung – try the next one down
    }
  }
  return null
}

/** ⚠ THE FIXTURE'S ONE THUMB ON THE SCALE, AND IT IS DELIBERATE. Four college years is 208 weeks of
 *  base costs; this file is about the freeze's HOUSEKEEPING and a career that went bankrupt halfway
 *  through would be measuring the family budget instead. Zero RNG implications – `resolveBaseCosts`
 *  draws its three whatever the balance is. */
function openTheFork(world: WorldState): void {
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: null }
}

/** ⚠ ROUND 24 #5 RE-AIM – the college answer RESERVES now and the freeze starts at the DEPARTURE
 *  (`fork.departsWeek`, the next academic-year September), which is where rule 1's release moved to.
 *  This walks the gap the way the player's world does – ordinary ticks, reveals closed – and stops
 *  on the latch. The gap-and-departure semantics themselves are pinned in
 *  tests/college-departure.test.ts; this file keeps asking its original freeze questions. */
function walkToDeparture(world: WorldState, rng: Rng): void {
  for (let i = 0; i < WEEKS_PER_YEAR + 4 && world.ending === null; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure latched the college ending').toBe('college')
}

/** Walk to `weeksBefore` weeks short of the departure – the last playable stretch of the gap, where
 *  an entry can be booked that is still OUTSTANDING when she leaves (play week past the departure). */
function walkToJustBeforeDeparture(world: WorldState, rng: Rng, weeksBefore: number): number {
  const departs = world.fork!.departsWeek!
  while (world.week < departs - weeksBefore) {
    tickWeek(world, rng)
    if (world.pendingTournament) finishAnyReveal(world)
  }
  return departs
}

/** `bookAnEntry`, bounded to a play-week window – rule 1's cases need the play week ON or JUST past
 *  the departure (outstanding when she leaves), and the past-deadline case needs it close enough
 *  that the list provably closed first. Same engine-refusal discipline: nothing is forced. */
function bookAnEntryBetween(world: WorldState, fromWeek: number, toWeek: number): string | null {
  const cand = world.season
    .filter((e) => e.week > world.week && e.week >= fromWeek && e.week <= toWeek && world.week <= e.deadlineWeek)
    .sort((a, b) => b.week - a.week)
  for (const e of cand) {
    try {
      enterEvent(world, e.id)
      return e.id
    } catch {
      // her rank or her purse refuses this rung – try the next one down
    }
  }
  return null
}

/** The four years, spent one at a time exactly as the epilogue's button spends them.
 *
 *  ⚠ RE-AIMED BY THE COLLEGE BIRTHDAY (round 24, «да, день рождения делай»): a year now PAUSES on
 *  her birthday week so the gift dialog can be answered, so spending it is press-answer-press. The
 *  day together is the one option every birthday offers, so it is always a legal answer. */
function spendTheYears(world: WorldState, rng: Rng): void {
  // ⚠ ROUND 26 #6 re-aim: a year now holds THREE stops at the outside – the championship, her
  // birthday, and the year's end – so the ceiling goes from 3 presses a year to 4. Nothing measured
  // below moved; the walk simply answers one more question, the way a player does.
  for (let press = 0; press < 4 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerLeagueReveal(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
}

/** Press until ONE more year is banked – the boundary every card is read at. */
function spendOneYear(world: WorldState, rng: Rng): void {
  const before = world.college!.years.length
  for (let press = 0; press < 4 && world.college!.years.length === before && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerLeagueReveal(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
}

// =================================================================================================
// ⭐⭐ THE CHAIN, END TO END – the guard the round is actually about
// =================================================================================================
describe('the freeze keeps the world playing', () => {
  it('⭐⭐⭐ a career that reaches the DEPARTURE with a live entry graduates into a world that has been playing', () => {
    // ⚠ ROUND 24 #5 RE-AIM, NOT A WEAKENING: the entry has to be outstanding when the FREEZE starts,
    // and the freeze starts at the departure now – so the reproduction books it in the gap's last
    // stretch, with a play week past the September she leaves on. The owner's week-270 W500 shape,
    // relocated to where the release relocated.
    const { world, rng } = playedCareer('r24-chain', 60)
    openTheFork(world)
    answerFork(world, 'college')
    const departs = walkToJustBeforeDeparture(world, rng, 4)
    const entry = bookAnEntryBetween(world, departs, departs + 4)
    expect(entry, 'the reproduction needs a live entry – this is the owner\'s week-270 W500').not.toBeNull()
    expect(
      world.season.find((e) => e.id === entry)!.week,
      'and its play week is past the departure, so it is outstanding when she leaves',
    ).toBeGreaterThanOrEqual(departs)

    walkToDeparture(world, rng)
    expect(world.entries, 'nothing outlives the departure').toHaveLength(0)
    spendTheYears(world, rng)

    // She is out the other side: four years banked, the latch off, the tab shell back.
    expect(world.college!.years).toHaveLength(ENDINGS.collegeYears)
    expect(world.ending, 'graduated – the latch comes off for good').toBeNull()
    expect(inCollege(world)).toBe(false)

    // ⭐ THE FOUR COUNTERS THAT WERE ZERO IN HIS SAVE. Thresholds, not equalities: the point is that
    // the world PLAYED, and the exact numbers are a function of the calendar's tuning.
    expect(world.pendingTournament, 'no reveal survived the freeze').toBeNull()
    expect(world.season.length, 'the calendar was rebuilt every week – his read 0').toBeGreaterThan(0)
    expect(
      world.season.filter((e) => e.week > world.week).length,
      'and it has a FUTURE, which is what the calendar screen draws – his read 0',
    ).toBeGreaterThan(0)
    expect(world.results.length, 'the ledger kept its rolling window – his held 1 row').toBeGreaterThan(100)

    // ⭐ AND THE TABLE IS NOT DEGENERATE. `pruneResults` deleting everything is what tied all 200 rows
    // at #1 on zero points and told him his daughter was world number one.
    const table = fullRanking(world)
    expect(table.length).toBeGreaterThan(0)
    expect(
      table.filter((r) => r.points > 0).length,
      'somebody in the field holds a junior point – 0 here is the all-ties-at-first bug',
    ).toBeGreaterThan(0)
  }, 120_000)
})

// =================================================================================================
// RULE 1 – THE RELEASE, AND WHAT IT MAY NOT COST HER
// =================================================================================================
describe('rule 1 – an outstanding entry is released when the freeze starts, and the freeze starts at the departure', () => {
  it('⭐ the fee comes back in full, the slot comes back, and nothing is charged', () => {
    // ⚠ ROUND 24 #5 RE-AIM: the release fires AT THE DEPARTURE now, in the departure week's own
    // resolved tick – so «the whole fee» is asserted as the release's own ledger row (the one
    // `releaseEntry` writes, amount = the fee, at the departure week) rather than as a funds delta a
    // week of income and base costs would smear. Every other assertion is the original, asked at the
    // moment the release actually happens.
    const { world, rng } = playedCareer('r24-release', 60)
    openTheFork(world)
    answerFork(world, 'college')
    const departs = walkToJustBeforeDeparture(world, rng, 4)
    const entry = bookAnEntryBetween(world, departs, departs + 4)
    expect(entry).not.toBeNull()
    const event = world.season.find((e) => e.id === entry)!
    expect(event.week, 'outstanding at the departure').toBeGreaterThanOrEqual(departs)
    const fee = TIERS[event.tier].entryFeeCents
    const penaltiesBefore = world.penalties.length
    const suspendedBefore = world.suspendedUntilWeek

    walkToDeparture(world, rng)

    expect(world.entries, 'nothing outlives the departure').toHaveLength(0)
    const refunds = world.events.filter(
      (e) => e.week === departs && e.type === 'income' && e.text === `Entry refunded: ${TIERS[event.tier].label}`,
    )
    expect(refunds, 'one refund row, at the departure week').toHaveLength(1)
    expect(refunds[0].amountCents, 'the whole fee, not a forfeit and not a part of one').toBe(fee)
    // ⚠ «МЫ НИ ЗА ЧТО НЕ НАКАЗЫВАЕМ» IS THE ASSERTION, not a comment above one. `cancelEntry`'s late
    // arm can charge `lateWithdrawalPoints` and the no-show beat in `tickWeek` charges more; the
    // release must reach neither.
    expect(world.penalties, 'no late-withdrawal points, no no-show').toHaveLength(penaltiesBefore)
    expect(world.suspendedUntilWeek).toBe(suspendedBefore)
    expect(
      world.internationalEntryWeeks.includes(event.week) || world.proEntryWeeks.includes(event.week),
      'the year\'s slot follows the fee back – she never participated',
    ).toBe(false)
  }, 60_000)

  it('⭐ AND IT REFUNDS PAST THE ENTRY DEADLINE TOO – the one release that does', () => {
    // Lists close two weeks out (`deadlineWeek = week - 2`), so an entry whose play week straddles
    // the departure has ALWAYS had its list close before she leaves – the past-deadline arm is not
    // an edge of the redesign, it is its ordinary case, and it is the state every other exit in the
    // game FORFEITS the fee in. This one may not.
    const { world, rng } = playedCareer('r24-late-release', 60)
    openTheFork(world)
    answerFork(world, 'college')
    const departs = walkToJustBeforeDeparture(world, rng, 4)
    // ⚠ SELECTED BY THE DEADLINE ITSELF, not by week arithmetic: the case needs a list that closes
    // BEFORE she leaves for an event that plays AT or AFTER – deadlines are not uniformly week−2
    // across rungs, so the candidate filter asks the calendar rather than assuming the offset.
    const cand = world.season
      .filter((e) => e.week >= departs && e.deadlineWeek < departs && world.week <= e.deadlineWeek)
      .sort((a, b) => b.week - a.week)
    let entry: string | null = null
    for (const e of cand) {
      try {
        enterEvent(world, e.id)
        entry = e.id
        break
      } catch {
        // her rank or her purse refuses this rung – try the next one down
      }
    }
    expect(entry).not.toBeNull()
    const event = world.season.find((e) => e.id === entry)!
    expect(event.week, 'outstanding at the departure').toBeGreaterThanOrEqual(departs)

    walkToDeparture(world, rng)

    expect(departs, 'the list HAD closed with her name on it – the past-deadline arm was really taken').toBeGreaterThan(
      event.deadlineWeek,
    )
    expect(world.entries).toHaveLength(0)
    const refunds = world.events.filter(
      (e) => e.week === departs && e.type === 'income' && e.text === `Entry refunded: ${TIERS[event.tier].label}`,
    )
    expect(refunds, 'full refund – she is not pulling out, the game is').toHaveLength(1)
    expect(refunds[0].amountCents).toBe(TIERS[event.tier].entryFeeCents)
    expect(world.penalties, 'and no price for the closed list either').toHaveLength(0)
  }, 60_000)

  it('⚠ the feed does not tell him HE withdrew her – the 05.08 misattribution bug, in college colours', () => {
    const { world, rng } = playedCareer('r24-release-voice', 60)
    openTheFork(world)
    answerFork(world, 'college')
    const departs = walkToJustBeforeDeparture(world, rng, 4)
    expect(bookAnEntryBetween(world, departs, departs + 4)).not.toBeNull()
    walkToDeparture(world, rng)
    // ⚠ ROUND 24 #5 – the desk speaks at the DEPARTURE now, so the record is read at that week.
    const written = world.events.filter((e) => e.week === departs && e.type === 'entry')
    expect(written.length, 'the release is on the record').toBeGreaterThan(0)
    for (const row of written) {
      expect(row.text.startsWith(RELEASE_LINE_PREFIX.parent), row.text).toBe(false)
      expect(row.text.startsWith(RELEASE_LINE_PREFIX.college), row.text).toBe(true)
    }
  }, 60_000)
})

// =================================================================================================
// RULE 2 – THE REFUSAL THAT CLOSES THE CLASS
// =================================================================================================
describe('rule 2 – resumeFromCollege will not tick past an open reveal', () => {
  /** ⚠⚠ A REACHABLE STATE, NOT A CONSTRUCTED ONE, AND THAT IS WHY RULE 2 IS NOT REDUNDANT WITH RULE 1.
   *  `finalizeTournament` calls `resolveEndings` WHILE `pendingTournament` is still set – the fork can
   *  be raised, and answered, with the finale still on screen (`composables/blockingOverlay.ts` says so
   *  in its own header, and 'ending' is in its INTERRUPTS set). So a career can enter the freeze
   *  holding a reveal that no entry release could have prevented. */
  function atCollegeWithAnOpenReveal(seed: string): { world: WorldState; rng: Rng } {
    const { world, rng } = playedCareer(seed, 60)
    world.fundsCents = 500_000_00
    const entry = bookAnEntry(world, 4)
    expect(entry).not.toBeNull()
    const event = world.season.find((e) => e.id === entry)!
    while (world.week < event.week) tickWeek(world, rng)
    expect(world.pendingTournament, 'her run is on screen and unresolved').not.toBeNull()
    // ⚠ ROUND 24 #5 RE-AIM: the answer only RESERVES now, so the latch can no longer arrive by
    // answering over the finale. The route that still reaches «freeze + open reveal» is the header
    // comment's own mechanism pointed at the departure: `finalizeTournament` calls `resolveEndings`
    // WHILE `pendingTournament` is still set, and `resolveCollegeDeparture` runs inside it – so a
    // career whose reservation comes due on the very week of its finale latches with the reveal
    // still open. The reservation is written by hand (this fixture's own idiom, one line up from
    // where it used to hand-open the fork) and the finale is revealed to the end.
    world.fork = { askedWeek: world.week, answer: 'college', offer: null, departsWeek: world.week }
    for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
      revealTournamentRound(world)
    }
    expect(world.ending?.type, 'the departure latched over the finale').toBe('college')
    expect(world.pendingTournament, 'the reveal survived the departure – this is the hazard').not.toBeNull()
    return { world, rng }
  }

  it('⭐⭐⭐ it REFUSES, and not one week is spent', () => {
    const { world, rng } = atCollegeWithAnOpenReveal('r24-refuse')
    const weekBefore = world.week
    const drawsBefore = world.rngMain.n
    const latchBefore = world.ending

    expect(() => resumeFromCollege(world, rng)).toThrow(COLLEGE_REVEAL_REFUSAL)

    expect(world.week, 'no week ticked – the refusal is at entry, above every mutation').toBe(weekBefore)
    expect(world.rngMain.n, 'and the MAIN stream did not move either').toBe(drawsBefore)
    expect(world.college!.years, 'no year was opened or banked').toHaveLength(0)
    expect(world.ending, 'the epilogue is still there to ask the question again').toBe(latchBefore)
  }, 60_000)

  it('⭐ and the refusal is not a dead end: close the reveal and the same click works', () => {
    const { world, rng } = atCollegeWithAnOpenReveal('r24-refuse-recover')
    finishAnyReveal(world)
    expect(world.pendingTournament).toBeNull()
    const from = world.week
    // ⚠ Press-answer-press (round 24): the year pauses on her birthday and lands on the same boundary.
    spendOneYear(world, rng)
    expect(world.week, 'the year is spent, exactly as it always was').toBe(from + WEEKS_PER_YEAR)
    expect(world.college!.years).toHaveLength(1)
  }, 60_000)

  it('⚠ the guard stands in BOTH positions – at entry and inside the loop', async () => {
    // ⚠ A SOURCE PIN, AND IT IS THE HONEST INSTRUMENT HERE RATHER THAN A SHORTCUT. Rule 3 makes a
    // mid-loop reveal UNCONSTRUCTIBLE, so there is no behavioural route left to drive it – which is
    // the whole point of a tripwire. `tests/dev-fast-forward.test.ts` pins the worker's identical
    // pair the same way, for the same reason, and its own header states the trade: a guard whose only
    // witness is a regex is a guard a refactor can silently drop, so the behavioural half above
    // drives the real engine and this half only asserts the second position still exists.
    const { worldFunction } = await import('./worldSource')
    const body = worldFunction('resumeFromCollege')
    expect(body, 'the function was found').not.toBe('')
    const refusals = body.split('COLLEGE_REVEAL_REFUSAL').length - 1
    expect(refusals, 'entry and mid-loop').toBe(2)
    const loopAt = body.indexOf('tickWeek(world, rng)')
    expect(loopAt).toBeGreaterThan(0)
    expect(
      body.slice(loopAt),
      'the mid-loop guard sits after the tick, so a week that opens a reveal stops there',
    ).toContain('COLLEGE_REVEAL_REFUSAL')
  })
})

// =================================================================================================
// RULE 3 – THE REVEAL CANNOT BE BUILT INSIDE THE FREEZE
// =================================================================================================
describe('rule 3 – tickWeek plays no tournament for a girl who is at college', () => {
  it('⭐ an entry that appears INSIDE the freeze cannot start a run, and the world keeps its books', () => {
    const { world, rng } = playedCareer('r24-inside', 60)
    openTheFork(world)
    answerFork(world, 'college')
    walkToDeparture(world, rng)
    spendOneYear(world, rng)
    expect(inCollege(world), 'one year down, three to go').toBe(true)

    // ⚠ PUT THERE BY HAND ON PURPOSE. Rule 1 releases everything at the fork and no command can add
    // an entry behind the latch, so this is the state a FUTURE route would arrive in – a college
    // fixture, an imported save, a mechanic nobody has written yet. The rule has to hold anyway.
    const target = world.season.find((e) => e.week > world.week && e.week < world.week + WEEKS_PER_YEAR)
    expect(target, 'the calendar reaches into the coming year').toBeDefined()
    world.entries.push(target!.id)

    spendOneYear(world, rng)

    expect(world.pendingTournament, 'no run was ever computed for her').toBeNull()
    expect(world.college!.years, 'and the year was spent normally').toHaveLength(2)
    expect(world.season.filter((e) => e.week > world.week).length, 'the calendar is still ahead of her').toBeGreaterThan(0)
    expect(world.results.length, 'and the ledger is still being written').toBeGreaterThan(100)
    expect(
      fullRanking(world).filter((r) => r.points > 0).length,
      'the table still has points on it',
    ).toBeGreaterThan(0)
  }, 120_000)
})

// =================================================================================================
// ⭐⭐ THE BELT – v55, THE ALREADY-BROKEN CAREER'S ONE DOOR BACK IN
// =================================================================================================
//
// ⚠⚠ THE MIGRATION IS REQUIRED RATHER THAN OPTIONAL, AND THE MEASUREMENT IS WHY. The claim it
// replaces was "his save heals with one tap in the app". It does not: read against the owner's own
// w474 file, `toSnapshot(world).pending` is **null** even though `world.pendingTournament` is
// `5-w270-wta500 finished=true` – because `pendingView` gives up when `eventById` cannot find the
// event, and the same freeze that stranded the reveal emptied `world.season` (0 events). So
// `TournamentFlow`'s `v-if="game.snapshot?.pending && !tournamentHidden"` is false, the sticky bar's
// `v-if="tab === 'home' || game.snapshot?.pending"` resume button never renders, `useWeekAction`
// returns `advance` instead of `resume`, and `advanceWeeks` answers 'tournament' with no tick and no
// toast ('tournament' is deliberately absent from `STOP_REASON_TEXT`). The state hides its own close
// button. The three rules above stop new careers reaching it; this is the repair for the ones that
// already have.
describe('v55 – a stranded reveal is cleared on load', () => {
  const goldenV54 = new URL('./fixtures/saves/v54.json', import.meta.url)
  const loadV54 = (): Record<string, unknown> =>
    JSON.parse(readFileSync(goldenV54, 'utf8')) as Record<string, unknown>

  it('⭐⭐ a reveal whose event is no longer on the calendar is cleared', async () => {
    const { migrateSave } = await import('../src/engine/migrations')
    const save = loadV54()
    // The owner's footprint, injected into a REAL v54 payload rather than hand-built: a finished
    // reveal for an event the calendar no longer holds. ⚠ The shipped fixture itself is never
    // edited – append-only applies to the corpus as well as to the migrations.
    save.pendingTournament = {
      eventId: 'gone-w270-wta500',
      revealedRounds: 4,
      finished: true,
      players: {},
      result: { matches: [] },
    }
    const migrated = migrateSave(save)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.pendingTournament, 'the seal is broken – the career can be played again').toBeNull()
  })

  it('⚠ ...and a reveal that the app CAN still draw is left exactly where it is', async () => {
    // The control, and it is what makes the predicate a mechanism rather than a blunt clear: a
    // reveal whose event is still scheduled mounts `TournamentFlow` normally, so there is nothing
    // wrong with it and a migration that touched it would be discarding a run she is mid-way through.
    const { migrateSave } = await import('../src/engine/migrations')
    const save = loadV54()
    const season = save.season as Array<{ id: string }>
    expect(season.length, 'the golden career has a calendar').toBeGreaterThan(0)
    save.pendingTournament = {
      eventId: season[0].id,
      revealedRounds: 1,
      finished: false,
      players: {},
      result: { matches: [] },
    }
    const migrated = migrateSave(save)
    expect(migrated.pendingTournament, 'untouched').not.toBeNull()
    expect(migrated.pendingTournament!.eventId).toBe(season[0].id)
  })
})
