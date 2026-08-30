// =================================================================================================
// ROUND 26 #1, SECOND PASS – WHEN THE FOUR-WEEK PILL IS OFFERED, AND IT IS THE OWNER'S RULE
// =================================================================================================
//
// His ruling, 25.08, after playing the first pass:
//
//   «давай сделаем ее во-первых слева от основной, а во-вторых по условию, появляться она должна на
//    тех моментах, где либо в календаре нет ни одного события в ближайшие 5 недель, либо у нее
//    травма на 5+ недель или до конца травмы осталось не меньше 5 недель. Иначе это совершенно
//    дурной элемент управления получается, с которым пропускается всё, а еще и прямо под пальцем.»
//
// The first pass offered the span wherever the ENGINE could move time. Measured on a walked career
// below, that is **204 of 208 weeks (98.1 %)** – a permanent button under the thumb, which is
// exactly what he read it as. His rule, measured on the same walk, is **5 of 208 (2.4 %)**.
//
// This file is the gate and only the gate. Three things it deliberately does NOT re-test, because
// they are somebody else's file and duplicating them is how two answers to one question start:
//
//   * the engine's REFUSALS and the stop set – `tests/r2-13-advance-span.test.ts`, whose block D
//     also carries this round's proof that the new gate changed neither;
//   * the quiet-KIND rule ('tournament' / 'walkover' / 'practice' / 'vacation' are never offered a
//     span) – the same file, block D's last case;
//   * the pill's POSITION and its fit on a phone – `tests/component/round26-span-gate-ui.test.ts`,
//     which mounts the real shell because a source pin cannot say which control is on the left.
import { describe, expect, it, vi } from 'vitest'
import {
  LONG_LAYOFF_WEEKS,
  MULTI_WEEK_SPAN,
  QUIET_WINDOW_WEEKS,
  advanceRefusal,
  calendarClearAhead,
  closeTournament,
  createWorld,
  decideKnock,
  eventIsHers,
  longLayoff,
  pendingKnock,
  skipTournament,
  spanWorthOffering,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'
import { resumeMain, type Rng } from '../src/engine/rng'
import { isSuitable } from '../src/composables/weekDays'
import { multiOffered } from '../src/composables/weekAction'
import { DEFAULT_PROFILE, type Snapshot, type SnapshotInjury, type UpcomingEvent } from '../src/shared/protocol'

// One walked career of 208 weeks with a snapshot taken every week. Deterministic but slow, and the
// unit project runs many files in parallel – the same file-level ceiling `r2-13-advance-span.test.ts`
// carries, for the same reason.
vi.setConfig({ testTimeout: 240_000 })

// -------------------------------------------------------------------------------------------------
// THE WALK
// -------------------------------------------------------------------------------------------------

interface WeekRow {
  week: number
  snap: Snapshot
  /** the events on HER calendar inside his five-week window */
  hersAhead: UpcomingEvent[]
  /** how many weeks to the nearest one, or null when the window is empty */
  nearest: number | null
  /** could the engine have moved time at all – the FIRST pass's whole gate */
  engineCanMove: boolean
  /** does the owner's rule offer the span */
  offered: boolean
}

let WALK: WeekRow[] | null = null

/** A real career, walked week by week the way a harness must: reveals resolved, knocks answered and
 *  the fork continued on the way, so no case below is secretly a case about one of them. Nothing is
 *  entered and nothing is booked – this is the passive career the owner was playing when the pill
 *  was under his thumb every week. */
function walk(): WeekRow[] {
  if (WALK) return WALK
  const world = createWorld('r26-gate', DEFAULT_PROFILE)
  const rng: Rng = resumeMain(world.rngMain)
  const rows: WeekRow[] = []
  while (world.week < 208 && world.ending === null) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (world.fork !== null && world.fork.answer === null) world.fork.answer = 'continue'
    if (world.retirementOffer !== null) world.retirementOffer = null
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const snap = toSnapshot(world)
    const hersAhead = snap.upcoming.filter(
      (e) => e.week > snap.week && e.week <= snap.week + QUIET_WINDOW_WEEKS && eventIsHers(e, snap.week),
    )
    const hers = snap.upcoming.filter((e) => e.week > snap.week && eventIsHers(e, snap.week))
    rows.push({
      week: snap.week,
      snap,
      hersAhead,
      nearest: hers.length ? Math.min(...hers.map((e) => e.week)) - snap.week : null,
      engineCanMove: advanceRefusal(world) === null,
      offered: spanWorthOffering(snap.week, snap.upcoming, snap.injury),
    })
  }
  WALK = rows
  return rows
}

/** A layoff of a stated shape, laid on a real week of the walk. The house idiom (round10, round12,
 *  masseur.test.ts all build `world.injury` by hand): `rollInjury` draws its own length, and a case
 *  about "five or more" cannot be written against a number the dice picked. */
function hurt(totalWeeks: number, weeksRemaining: number, sinceWeek: number): SnapshotInjury {
  return { kind: 'ankle strain', severity: 'moderate', weeksRemaining, totalWeeks, sinceWeek }
}

/** A week of the walk whose calendar is BUSY – so an arm-2 case is not passing on arm 1. */
function busyWeek(): WeekRow {
  const row = walk().find((r) => r.hersAhead.length > 0 && r.engineCanMove)
  expect(row, 'the walk really does contain a busy week').toBeTruthy()
  return row!
}

// =================================================================================================
// A. ARM 1 – NOTHING ON HER CALENDAR FOR FIVE WEEKS
// =================================================================================================
describe('round 26 #1 – arm 1: an empty five-week window (DELETED by round 30 #3)', () => {
  it('⭐⭐ a quiet stretch offers NOTHING – the arm he deleted, on the weeks it used to fire on', () => {
    // ⚠⚠ INVERTED BY ROUND 30 #3, NEVER DELETED, AND THE INVERSION IS THE POINT. This case read «so
    // the pill is on offer» and was the measurement arm 1 rested on. The owner played the repaired
    // control and struck the arm out:
    //
    //   «Нам в это время приходят письма и идёт запись на новые турниры – давай вообще эту кнопку
    //    про 6 недель уберём. Её можно оставить только на длинные травмы» (30.08)
    //
    // ⚠ WHAT IS STILL ASSERTED IS THE SAME PAIR OF FACTS, and keeping them together is what makes
    // this a record rather than a hole: the window really IS empty on these weeks
    // (`calendarClearAhead` is unchanged and still measures it), and an empty window is no longer a
    // reason to offer a skip. A quiet FIXTURE LIST is not a quiet stretch – those are the weeks the
    // letters arrive and the entry lists open, which is the fact the original measurement could not
    // see, and it is why deleting the case would have deleted the evidence.
    const quiet = walk().filter((r) => r.hersAhead.length === 0)
    // The measurement, and the reason this case is not vacuous: they exist and they are rare.
    expect(quiet.length, 'a walked career really does contain quiet stretches').toBeGreaterThan(0)
    for (const row of quiet) {
      expect(calendarClearAhead(row.week, row.snap.upcoming), `w${row.week}: the window is empty`).toBe(true)
      expect(row.snap.injury, `w${row.week}: this arm is about a HEALTHY quiet week`).toBeNull()
      expect(multiOffered(row.snap, 'training'), `w${row.week}: the deleted arm is back`).toBe(false)
      // ...and the layoff arm would have offered it on the very same week, which is what keeps this
      // from passing on a control that has simply stopped existing.
      expect(
        multiOffered({ ...row.snap, injury: hurt(20, 20, row.week - 1) }, 'training'),
        `w${row.week}: the surviving arm is dead too`,
      ).toBe(true)
    }
  })

  it('⚠ ...and a week with an event four weeks out does not', () => {
    const four = walk().filter((r) => r.nearest === 4)
    expect(four.length, 'the walk really does contain such weeks – otherwise this proves nothing').toBeGreaterThan(0)
    for (const row of four) {
      expect(calendarClearAhead(row.week, row.snap.upcoming), `w${row.week}: four weeks out is inside the window`).toBe(false)
      expect(multiOffered(row.snap, 'training'), `w${row.week}: so no pill`).toBe(false)
      // ⚠ AND THE ADVANCE ITSELF IS UNTOUCHED. This is an OFFER rule: the week button still spends
      // the week, and `advanceWeeks` would still run a span if something called it. Withholding the
      // pill is not a refusal, and the day these two lines disagree the gate has become one.
      expect(row.engineCanMove, `w${row.week}: the engine could still have moved time`).toBe(true)
    }
  })

  it('⚠⚠ the window is (week, week + 5] – both ends pinned, and today excluded', () => {
    // Synthetic, because a walked career cannot be asked to produce an event on each of six exact
    // offsets. `entered: true` makes every row unambiguously hers, so this case is about the WINDOW
    // and not about eligibility.
    const at = (offset: number): UpcomingEvent[] => [
      { week: 40 + offset, entered: true, eligible: false, deadlineWeek: 0 } as unknown as UpcomingEvent,
    ]
    expect(calendarClearAhead(40, at(0)), "today's own event is the week button's business, not this one").toBe(true)
    for (const offset of [1, 2, 3, 4, 5]) {
      expect(calendarClearAhead(40, at(offset)), `+${offset} is inside his five weeks`).toBe(false)
    }
    expect(calendarClearAhead(40, at(6)), '+6 is past them').toBe(true)
    expect(calendarClearAhead(40, []), 'and an empty calendar is empty').toBe(true)
    expect(QUIET_WINDOW_WEEKS, 'the number is his, written once').toBe(5)
  })

  it('⚠ "no event" means no event OF HERS – the look-ahead marker rule, not every dated row', () => {
    // ⚠⚠ THIS IS THE DESIGN DECISION OF THE WHOLE ITEM AND IT IS MEASURED, NOT ARGUED. The literal
    // reading – any row in `world.season` – was built first and walked: it fired on 0 of 900 weeks
    // across three careers, because the generated tour always has SOMETHING at some rung within
    // five weeks, so the pill could never appear at all. `eventIsHers` is the predicate the
    // look-ahead markers under the week grid are already drawn from, and the calendar's own doctrine
    // is that «empty means empty FOR HER».
    const week = 40
    const locked = { week: 43, entered: false, eligible: false, deadlineWeek: 44 } as unknown as UpcomingEvent
    const closed = { week: 43, entered: false, eligible: true, deadlineWeek: 39 } as unknown as UpcomingEvent
    const open = { week: 43, entered: false, eligible: true, deadlineWeek: 42 } as unknown as UpcomingEvent
    const inIt = { week: 43, entered: true, eligible: false, deadlineWeek: 0 } as unknown as UpcomingEvent
    expect(calendarClearAhead(week, [locked]), 'a rung she is locked out of is not her week').toBe(true)
    expect(calendarClearAhead(week, [closed]), 'nor is one whose entry list has closed').toBe(true)
    expect(calendarClearAhead(week, [open]), 'one she may walk into is').toBe(false)
    expect(calendarClearAhead(week, [inIt]), 'and one she is already in certainly is').toBe(false)
  })

  it('⚠⚠ ONE implementation of "is this event hers" – the markers and the pill are the same function', () => {
    // The whole of the "one question, one function" law for arm 1, as an identity rather than as an
    // argument. `composables/weekDays.ts` re-exports the engine's predicate under its historical
    // name; if somebody re-spells either side, these stop being the same object.
    expect(isSuitable, 'the calendar marker rule IS the pill rule').toBe(eventIsHers)
  })
})

// =================================================================================================
// B. ARM 2 – A LONG LAYOFF
// =================================================================================================
describe('round 26 #1 – arm 2: five or more weeks out', () => {
  it('⭐⭐ a six-week layoff offers the pill, on a week whose calendar is BUSY', () => {
    const row = busyWeek()
    expect(row.hersAhead.length, 'the fixture is busy, so arm 1 cannot be what passes this').toBeGreaterThan(0)
    expect(calendarClearAhead(row.week, row.snap.upcoming)).toBe(false)
    const snap: Snapshot = { ...row.snap, injury: hurt(6, 6, row.week) }
    expect(longLayoff(snap.week, snap.injury), 'six is five or more').toBe(true)
    expect(multiOffered(snap, 'training'), 'so the pill is on offer with a full calendar behind it').toBe(true)
  })

  it('⚠ a three-week layoff does not', () => {
    const row = busyWeek()
    const snap: Snapshot = { ...row.snap, injury: hurt(3, 3, row.week) }
    expect(longLayoff(snap.week, snap.injury), 'three is not five').toBe(false)
    expect(multiOffered(snap, 'training'), 'and neither arm holds, so no pill').toBe(false)
  })

  it('⭐ a layoff with five weeks REMAINING offers it even though it started long ago', () => {
    // His second clause: «до конца травмы осталось не меньше 5 недель». Eight weeks dealt, three
    // spent, five to run – the layoff is old and the pill is still right.
    const row = busyWeek()
    const snap: Snapshot = { ...row.snap, injury: hurt(8, 5, row.week - 3) }
    expect(snap.injury!.sinceWeek, 'it really did start weeks ago').toBeLessThan(snap.week)
    expect(longLayoff(snap.week, snap.injury), 'five still to run').toBe(true)
    expect(multiOffered(snap, 'training')).toBe(true)
    // …and four to run is not five, which is where the clause actually bites.
    const four: Snapshot = { ...row.snap, injury: hurt(4, 4, row.week) }
    expect(longLayoff(four.week, four.injury), 'four to run, four dealt – neither term').toBe(false)
    expect(multiOffered(four, 'training')).toBe(false)
  })

  it('⚠ a healthy week never takes this arm', () => {
    const row = busyWeek()
    expect(row.snap.injury, 'the walk left her healthy on this week').toBeNull()
    expect(longLayoff(row.week, null)).toBe(false)
    expect(multiOffered(row.snap, 'training')).toBe(false)
  })

  it('⚠⚠ THE REMAINING TERM IS SUBSUMED TODAY, AND THIS IS THE PIN THAT NOTICES WHEN IT STOPS BEING', () => {
    // The honest state of the rule, measured rather than assumed. `rollInjury` opens a layoff with
    // `weeksRemaining === totalWeeks` and nothing in the engine ever raises it (`injury.ts`
    // decrements at the top of a week, the masseur decrements again), so remaining <= total always
    // and `remaining >= 5` implies `total >= 5`. The consequence: no career this engine can produce
    // is caught by the second term alone, and mutating it away turns nothing red.
    //
    // It is kept because the owner named it and because it is the term that survives a layoff being
    // extended or `totalWeeks` re-based. So the term is exercised HERE, against the one shape that
    // separates the two – a state today's engine cannot reach – and the day it becomes reachable
    // this case is already asserting the right answer.
    const w = 100
    expect(longLayoff(w, hurt(3, 6, w)), 'total 3 / remaining 6: only the second term can catch this').toBe(true)
    expect(longLayoff(w, hurt(3, 4, w)), 'total 3 / remaining 4: neither term').toBe(false)
    // …and the subsumption itself, over every pair the engine CAN produce (remaining <= total).
    for (let total = 1; total <= 12; total++) {
      for (let remaining = 0; remaining <= total; remaining++) {
        expect(longLayoff(w, hurt(total, remaining, w)), `total ${total} / remaining ${remaining}`).toBe(
          total >= LONG_LAYOFF_WEEKS,
        )
      }
    }
    expect(LONG_LAYOFF_WEEKS, 'his number, written once').toBe(5)
  })
})

// =================================================================================================
// C. ONE QUESTION, ONE FUNCTION
// =================================================================================================
describe('round 26 #1 – the screen and the engine cannot disagree about the five weeks', () => {
  it('⚠⚠ the snapshot\'s clip cannot hide a member of his window', () => {
    // The whole argument for letting the shell answer this off `Snapshot.upcoming`: `upcoming` is
    // `world.season` clipped to (week, week + UPCOMING_WEEKS], and his window is narrower. Asserted
    // as a constant AND driven over the walk by id, so a future narrowing of UPCOMING_WEEKS to four
    // fails here rather than silently shortening the rule.
    expect(QUIET_WINDOW_WEEKS, 'the clip is wider than the question').toBeLessThanOrEqual(UPCOMING_WEEKS)
    for (const row of walk()) {
      const ids = new Set(row.snap.upcoming.map((e) => e.id))
      const inWindow = row.snap.upcoming.filter((e) => e.week > row.week && e.week <= row.week + QUIET_WINDOW_WEEKS)
      for (const e of inWindow) expect(ids.has(e.id), `w${row.week}: ${e.id} survived the clip`).toBe(true)
    }
  })

  it('⚠ the pill reads the gate and nothing else – no fourth opinion in the composable', () => {
    // `multiOffered` is allowed exactly three clauses of its own (pending / blocking / quiet kind),
    // and every one of them is the ENGINE's refusal asked of the snapshot. On the weeks where none
    // of the three fires, its answer must be `spanWorthOffering`'s, byte for byte.
    let checked = 0
    for (const row of walk()) {
      if (!row.engineCanMove || row.snap.pending) continue
      expect(multiOffered(row.snap, 'training'), `w${row.week}`).toBe(row.offered)
      checked++
    }
    expect(checked, 'the sweep really covered the career').toBeGreaterThan(150)
  })

  it('⚠⚠ THE MEASUREMENT, THREE RULINGS DEEP: 204 of 208 weeks, then 5, and now 0', () => {
    // ⚠⚠ RE-AIMED BY ROUND 30 #3 AND IT IS THE HISTORY OF THE CONTROL IN THREE NUMBERS. The first
    // pass offered the pill wherever the engine could move (204 / 208). Round 26 #1 narrowed it to
    // the owner's two arms (5 / 208). Round 30 #3 deleted the calendar arm outright, so on a HEALTHY
    // walked career the answer is now ZERO – and «a rule that never fires is not a rule» has become
    // the point rather than the objection: what fires it is a long layoff, which this passive walk
    // does not contain and the line below supplies.
    const rows = walk()
    const couldMove = rows.filter((r) => r.engineCanMove).length
    const offered = rows.filter((r) => r.offered).length
    expect(rows.length, 'a full four seasons walked').toBe(208)
    expect(couldMove, 'the FIRST pass would have offered it on nearly every week').toBeGreaterThan(rows.length * 0.9)
    expect(offered, 'a healthy career is offered no skip at all now – his ruling, as a number').toBe(0)
    // ⚠ AND THE RULE IS NOT MERELY DEAD, which is the arm this measurement needs to stay honest: lay
    // a long layoff on any of those weeks and the surviving arm fires on every one of them.
    const hurtOffers = rows.filter((r) =>
      spanWorthOffering(r.week, r.snap.upcoming, hurt(20, 20, r.week - 1)),
    ).length
    expect(hurtOffers, 'the layoff arm fires on none of them either – the control is simply gone').toBe(rows.length)
  })
})

// =================================================================================================
// D. THE ENGINE NEVER READS THIS GATE
// =================================================================================================
describe('round 26 #1 – the gate is an OFFER rule and the engine does not know it exists', () => {
  it('⚠⚠ a world the pill is withheld on still ticks four weeks, and still stops where it stopped', () => {
    // The direction that matters. If this gate ever became a refusal, a busy career would lose the
    // ability to advance – and it is the one property no source pin can state.
    const row = busyWeek()
    expect(row.offered, 'the pill is withheld here').toBe(false)
    const world = createWorld('r26-gate-runs', DEFAULT_PROFILE)
    const rng: Rng = resumeMain(world.rngMain)
    const before: number = world.week
    expect(advanceRefusal(world), 'nothing refuses').toBeNull()
    // Walk it forward the ordinary way and confirm time really moved – `advanceWeeks` is exercised
    // in r2-13's own file; what this asserts is that the new predicate is not in its path.
    for (let i = 0; i < MULTI_WEEK_SPAN; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      if (pendingKnock(world)) decideKnock(world, 'rest')
    }
    expect(world.week, 'four weeks spent').toBe(before + MULTI_WEEK_SPAN)
  })

  it('⚠ and the predicate is pure – it mutates nothing it is handed', () => {
    const row = busyWeek()
    const snapshotBefore = JSON.stringify({ upcoming: row.snap.upcoming, injury: row.snap.injury })
    const injury = hurt(6, 6, row.week)
    spanWorthOffering(row.week, row.snap.upcoming, injury)
    calendarClearAhead(row.week, row.snap.upcoming)
    longLayoff(row.week, injury)
    expect(JSON.stringify({ upcoming: row.snap.upcoming, injury: row.snap.injury })).toBe(snapshotBefore)
    expect(injury, 'and the injury it was handed is the injury it hands back').toEqual(hurt(6, 6, row.week))
  })
})
