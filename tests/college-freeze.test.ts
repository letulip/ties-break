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
//   RULE 1  `answerFork(…, 'college')` RELEASES every outstanding entry – full refund, slot back, no
//           forfeit and no penalty, however late it lands («Мы ни за что не наказываем»).
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
  createWorld,
  tickWeek,
  enterEvent,
  answerFork,
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

/** The four years, spent one at a time exactly as the epilogue's button spends them. */
function spendTheYears(world: WorldState, rng: Rng): void {
  for (let y = 0; y < ENDINGS.collegeYears && world.ending?.type === 'college'; y++) {
    resumeFromCollege(world, rng)
  }
}

// =================================================================================================
// ⭐⭐ THE CHAIN, END TO END – the guard the round is actually about
// =================================================================================================
describe('the freeze keeps the world playing', () => {
  it('⭐⭐⭐ a career that reaches the fork WITH A LIVE ENTRY graduates into a world that has been playing', () => {
    const { world, rng } = playedCareer('r24-chain', 60)
    openTheFork(world)
    const entry = bookAnEntry(world, 4)
    expect(entry, 'the reproduction needs a live entry – this is the owner\'s week-270 W500').not.toBeNull()
    expect(world.entries, 'and it is outstanding when the fork is answered').toContain(entry!)

    answerFork(world, 'college')
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
describe('rule 1 – an outstanding entry is released when the freeze starts', () => {
  it('⭐ the fee comes back in full, the slot comes back, and nothing is charged', () => {
    const { world } = playedCareer('r24-release', 60)
    openTheFork(world)
    const entry = bookAnEntry(world, 4)
    expect(entry).not.toBeNull()
    const event = world.season.find((e) => e.id === entry)!
    const fee = TIERS[event.tier].entryFeeCents
    const fundsBefore = world.fundsCents
    const penaltiesBefore = world.penalties.length
    const suspendedBefore = world.suspendedUntilWeek

    answerFork(world, 'college')

    expect(world.entries, 'nothing outlives the fork').toHaveLength(0)
    expect(world.fundsCents - fundsBefore, 'the whole fee, not a forfeit and not a part of one').toBe(fee)
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
    // Lists close two weeks out (`deadlineWeek = week - 2`), so an entry taken three weeks ahead and
    // still standing two weeks later is a real, reachable state – and it is the state every other
    // exit in the game FORFEITS the fee in. This one may not.
    const { world, rng } = playedCareer('r24-late-release', 60)
    world.fundsCents = 500_000_00
    const entry = bookAnEntry(world, 5)
    expect(entry).not.toBeNull()
    const event = world.season.find((e) => e.id === entry)!
    let ticks = 0
    while (world.week <= event.deadlineWeek && world.week < event.week - 1 && ticks < 8) {
      tickWeek(world, rng)
      finishAnyReveal(world)
      ticks++
    }
    expect(world.week, 'the list has closed with her name on it').toBeGreaterThan(event.deadlineWeek)
    expect(world.entries, 'and she is still on it').toContain(entry!)

    openTheFork(world)
    const fundsBefore = world.fundsCents
    answerFork(world, 'college')

    expect(world.entries).toHaveLength(0)
    expect(world.fundsCents - fundsBefore, 'full refund – she is not pulling out, the game is').toBe(
      TIERS[event.tier].entryFeeCents,
    )
    expect(world.penalties, 'and no price for the closed list either').toHaveLength(0)
  }, 60_000)

  it('⚠ the feed does not tell him HE withdrew her – the 05.08 misattribution bug, in college colours', () => {
    const { world } = playedCareer('r24-release-voice', 60)
    openTheFork(world)
    expect(bookAnEntry(world, 4)).not.toBeNull()
    const before = world.events.length
    answerFork(world, 'college')
    const written = world.events.slice(before).filter((e) => e.type === 'entry')
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
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    answerFork(world, 'college')
    expect(world.pendingTournament, 'the reveal survived the answer – this is the hazard').not.toBeNull()
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
    resumeFromCollege(world, rng)
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
    resumeFromCollege(world, rng)
    expect(inCollege(world), 'one year down, three to go').toBe(true)

    // ⚠ PUT THERE BY HAND ON PURPOSE. Rule 1 releases everything at the fork and no command can add
    // an entry behind the latch, so this is the state a FUTURE route would arrive in – a college
    // fixture, an imported save, a mechanic nobody has written yet. The rule has to hold anyway.
    const target = world.season.find((e) => e.week > world.week && e.week < world.week + WEEKS_PER_YEAR)
    expect(target, 'the calendar reaches into the coming year').toBeDefined()
    world.entries.push(target!.id)

    resumeFromCollege(world, rng)

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
