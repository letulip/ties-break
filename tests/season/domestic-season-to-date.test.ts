import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  inTrack,
  seasonStartWeek,
  KID_ID,
  kidPoints,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import {
  BEST_N_BY_TRACK,
  WINDOW_BY_TRACK,
  computeRanking,
  windowFromWeek,
  windowedBestSum,
  type SeasonResult,
} from '../../src/engine/season/ranking'
import { cohortIds } from '../../src/engine/world/ladder'
import { computeCountingResults } from '../../src/engine/world/snapshot'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// =================================================================================================
// ⚠⚠ RE-AIMED AT ROUND 42 ITEM 7 (15.09.2026) – ONE WINDOW FOR ALL THREE TABLES
// =================================================================================================
//
// THE FILE KEEPS ITS NAME AND ITS WALKS AND INVERTS ITS CLAIM, which is the honest shape here: every
// property below is still a property OF THE DOMESTIC WINDOW, and the owner has now ruled that window
// twice. Renaming the file would have hidden that history behind a `git log --follow` nobody runs.
//
// ROUND 23 #12/#13 (20.08) made the domestic table season-to-date. He had reported a rival's national
// total falling 600+ → 400+ "right after my win" and said in the same sentence what he believed the
// table was: «таблица должна просто показывать 6 лучших ЗА СЕЗОН». Nothing was ever subtracted – 51
// falls over 6 seeds × 110 weeks, 51 of them a row leaving the 52-week window, 0 unexplained.
//
// ROUND 42 #7 (15.09) PUTS IT BACK, on his own word and asked twice («второй раз пишу» about «каждый
// год заново надо набирать национальный ранг»). Offered a latch on the entry gates he named the
// MECHANISM instead: «A — защёлка, но такая же, как и на взрослых турнирах, тот же механизм — окно в
// 52 недели и выбираем лучшие 6 результатов, окно "ползет"», and confirmed it with the 20.08 receipts
// in front of him: «да, но будет везде корректно, окно в 52 недели и очки.» So #12's and #13's
// phenomena RETURN and are accepted as the correct model's own behaviour – which is why the arms that
// used to assert their absence are now the arms that assert their presence, by measurement.
//
// WHAT THIS FILE GUARDS NOW, and each one is a thing that can silently come undone:
//
//   1. THE PROPERTY HE RULED FOR – a domestic total is a crawling 52-week window: a result ages out
//      52 weeks after it was won, one row at a time, and NOTHING happens at the season boundary.
//      Asserted twice: on a synthetic ledger (exactly, week by week) and on a real walked world.
//   2. ⭐ THE SECOND JOB THE ONE RULING DOES – the domestic ENTRY FLOOR stops slamming. Round 34 #1's
//      undone half («мне снова закрылся регионарный») is fixed by arithmetic rather than by a latch,
//      and `tests/round34-ladder-plaques.test.ts` walks the career that proves it.
//   3. ⚠ THE TRACKS THAT NEVER MOVED, still stated – ITF and WTA have been a rolling 52 weeks through
//      both rulings, because they model real tours that genuinely work that way. The pin now reads
//      all three as `'rolling52'`, which is also what `StatsScreen.vue`'s hand-written `+ 53` drop
//      arithmetic depends on: that line has no season arm any more, so this is its guard.
//   4. THE SECOND COPY OF THE SEASON ARITHMETIC – `windowFromWeek(w, 'seasonToDate')` must equal
//      `world/ledger.ts`'s `seasonStartWeek(w)` at every week, negative ones included. `season/` may
//      not import `world/`, so the arithmetic is written twice on purpose and pinned here. ⚠ KEPT
//      THOUGH NO TRACK USES THE ARM: `tools/domestic-season-to-date.ts` patches the constant to build
//      its B arm, and a B arm whose arithmetic had rotted would measure the rot, not the ruling.
//   5. THE LIST ADDS UP TO THE TOTAL – `computeCountingResults` explains the number beside it, so it
//      must borrow the WINDOW as well as the width. This is the assertion that would have caught the
//      half-finished version of either change: a domestic total of 200 over a list summing to 430.

/** A world walked `weeks` weeks with the kid entering whatever the calendar will let her into – the
 *  same "action-laden" walk `tools/domestic-season-to-date.ts` measures on, so a property proved here
 *  is a property of the careers the probe reports. */
function walk(seed: string, weeks: number, onWeek: (w: WorldState) => void): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE) as WorldState
  world.fundsCents = 5_000_000_00
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    const byRung = [...world.season].sort(
      (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
    )
    for (const e of byRung) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      try {
        enterEvent(world, e.id)
      } catch {
        /* gated – the point of the walk is that she plays what she may */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    onWeek(world)
  }
  return world
}

function domesticTotal(results: SeasonResult[], week: number, id: string): number {
  return windowedBestSum(results, week, id, BEST_N_BY_TRACK.domestic, inTrack('domestic'), WINDOW_BY_TRACK.domestic)
}

describe('round 42 #7 — one window for all three tables: best 6 of a crawling 52 weeks', () => {
  it('⚠ ships as rolling-52 on EVERY track – the one fold that answers for both ladders', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «ships as season-to-date on domestic ONLY», round 23 #12/#13).
    // His ruling names the mechanism: «тот же механизм — окно в 52 недели ... окно "ползет"». So the
    // claim this line guards flipped from "the domestic table is the odd one out, deliberately" to
    // "there is one window rule and three tables read it", and the second claim has a reader the
    // first did not: `StatsScreen.vue`'s window block spells the rolling drop date by hand
    // (`oldest.week + 53 - snap.week`) with no season arm left to fall into. If a future ruling puts
    // any track back on a season race, this line reddens BEFORE that screen starts promising a date
    // that never comes – which is the failure `world/ladder.ts:bookClosedTo` records from last time.
    expect(WINDOW_BY_TRACK.domestic).toBe('rolling52')
    expect(WINDOW_BY_TRACK.itf).toBe('rolling52')
    expect(WINDOW_BY_TRACK.wta).toBe('rolling52')
  })

  it('windowFromWeek(seasonToDate) IS seasonStartWeek – the second copy of the arithmetic, pinned', () => {
    // `season/ranking.ts` may not import `world/ledger.ts` (the edge runs the other way), so the
    // season boundary is written twice. Four seasons forward and one back, because a pre-history row
    // sits at a NEGATIVE week and `Math.floor` on a negative is exactly where a re-derivation drifts.
    for (let w = -WEEKS_PER_YEAR; w < 4 * WEEKS_PER_YEAR; w++) {
      expect(windowFromWeek(w, 'seasonToDate')).toBe(seasonStartWeek(w))
    }
    // ...and the rolling arm is the old predicate rewritten, term for term, at every week.
    for (let w = 0; w < 3 * WEEKS_PER_YEAR; w++) {
      for (const age of [0, 1, 51, 52, 53]) {
        const inOld = w - (w - age) <= 52
        expect((w - age) >= windowFromWeek(w, 'rolling52')).toBe(inOld)
      }
    }
  })

  it('⭐ a domestic total crawls: a row leaves 53 weeks after it was won, and the wrap does nothing (synthetic)', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «monotonic non-decreasing WITHIN a season and resets at the
    // wrap», round 23 #12/#13). The ledger below is UNCHANGED, deliberately – it was built to be
    // maximally hostile to the old claim (a National title in season 1 whose 53rd week falls
    // MID-season-2, the exact shape of his own 600 → 400) and that makes it maximally INFORMATIVE
    // about the new one: the same row that the old rule took out at the wrap is the row the new rule
    // takes out at week 56, and the test now says so in numbers instead of asserting it away.
    const rows: SeasonResult[] = [
      { playerId: 'p', week: 3, points: 200, tier: 'national' },
      { playerId: 'p', week: 7, points: 80, tier: 'regional' },
      { playerId: 'p', week: 11, points: 30, tier: 'local' },
      { playerId: 'p', week: 19, points: 120, tier: 'national' },
      { playerId: 'p', week: 27, points: 48, tier: 'regional' },
      { playerId: 'p', week: 33, points: 30, tier: 'local' },
      { playerId: 'p', week: 41, points: 18, tier: 'local' },
      // season 2 – she keeps playing
      { playerId: 'p', week: 54, points: 30, tier: 'local' },
      { playerId: 'p', week: 60, points: 80, tier: 'regional' },
      { playerId: 'p', week: 71, points: 200, tier: 'national' },
      { playerId: 'p', week: 83, points: 28, tier: 'regional' },
      { playerId: 'p', week: 90, points: 30, tier: 'local' },
      { playerId: 'p', week: 97, points: 120, tier: 'national' },
    ]
    // ⭐ THE PROPERTY, STATED AS A LAW OVER EVERY WEEK RATHER THAN AS A LIST OF SPECIAL ONES: a total
    // may only fall on a week that is exactly 53 weeks after a row she owns. That is «окно ползет» in
    // one line – every fall has a named row behind it and no fall has the calendar behind it.
    let prev = 0
    const falls: number[] = []
    for (let w = 0; w < 2 * WEEKS_PER_YEAR; w++) {
      const total = domesticTotal(rows, w, 'p')
      if (total < prev) {
        falls.push(w)
        expect(
          rows.some((r) => r.week === w - 53),
          `week ${w}: the total fell with no row leaving the window`,
        ).toBe(true)
      }
      prev = total
    }
    // The discriminator: without a real book this test would pass on an all-zero ledger. Her season-1
    // book peaks at the full best-6 and it is still whole at the wrap.
    expect(domesticTotal(rows, 51, 'p')).toBe(200 + 120 + 80 + 48 + 30 + 30)
    // ⭐⭐ THE ARM THAT FAILS UNDER THE OLD RULE, AND THE WHOLE OF HIS COMPLAINT IN THREE LINES.
    // Season-to-date read 0 here; the window rule he asked for carries the book across the boundary
    // untouched, so «каждый год заново надо набирать национальный ранг» stops being true of the game.
    expect(domesticTotal(rows, WEEKS_PER_YEAR, 'p')).toBe(domesticTotal(rows, WEEKS_PER_YEAR - 1, 'p'))
    expect(falls).not.toContain(WEEKS_PER_YEAR)
    // ⚠ AND THE ROW THAT USED TO DO THE DAMAGE DOES IT AGAIN, ON ITS OWN WEEK, BY A NAMED AMOUNT.
    // The week-3 National is 53 weeks old at week 56, so 200 leaves the book and the best-6 closes up
    // over the week-54 Local: 508 → 338. This is round 23 #12's accepted cost, measured rather than
    // asserted away – and it is what a defended ranking looks like from the inside.
    expect(domesticTotal(rows, 55, 'p')).toBe(508)
    expect(domesticTotal(rows, 56, 'p')).toBe(120 + 80 + 48 + 30 + 30 + 30)
    expect(falls).toContain(56)
    expect(rows.some((r) => r.week === 3 && r.points === 200)).toBe(true)
  })

  it('⭐ ...and on a real walked world: every fall is a row ageing out, and NONE of them is the wrap', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «no domestic leader ever loses points mid-season»). The claim
    // inverts with the ruling and gets STRICTER in the process: it is no longer "falls do not happen"
    // but "every fall has a named row behind it, and the calendar is behind none of them". That is
    // `tools/domestic-season-to-date.ts` §C's own classification – window / best-6 / UNEXPLAINED –
    // run as an assertion instead of printed, and 0 unexplained is the column the probe reports.
    //
    // The same walk as before: 2 seasons of a real career, watching everybody who reaches the top TEN.
    // ⚠ THE WATCH LIST IS BY PLAYER, NOT BY POSITION, and the first version of this test got it
    // wrong in a way that quietly passed. Sampling "this week's top three" loses a player the moment
    // she slips a place, and no before/after pair forms at all.
    //
    // ⚠ WHY `week - 53` IS THE WHOLE CLASSIFIER. The ranking window keeps `r.week >= w - 52` and
    // `pruneResults` keeps exactly the same rows, so a row at `w - 53` is present in last week's
    // ledger and gone from this one – the two rules are the same arithmetic and cannot disagree about
    // which row left. A fall on any other week would be a real defect, which is what this arm is for.
    const watch = new Set<string>()
    const last = new Map<string, number>()
    const lastRows = new Map<string, number[]>()
    let agedOutFalls = 0
    let unexplainedFalls = 0
    let observedRises = 0
    let biggestBook = 0
    const boundaryBooks: number[] = []
    walk('dom-probe-3', 2 * WEEKS_PER_YEAR, (w) => {
      const table = computeRanking(
        w.results,
        w.week,
        BEST_N_BY_TRACK.domestic,
        [...cohortIds(w), KID_ID],
        inTrack('domestic'),
        WINDOW_BY_TRACK.domestic,
      )
      for (const row of table.slice(0, 10)) watch.add(row.playerId)
      if (w.week > 0 && w.week % WEEKS_PER_YEAR === 0) {
        boundaryBooks.push(table.slice(0, 10).reduce((s, r) => s + r.points, 0))
      }
      for (const id of watch) {
        const total = domesticTotal(w.results, w.week, id)
        biggestBook = Math.max(biggestBook, total)
        const before = last.get(id)
        if (before !== undefined) {
          if (total < before) {
            if ((lastRows.get(id) ?? []).includes(w.week - 53)) agedOutFalls++
            else unexplainedFalls++
          } else if (total > before) observedRises++
        }
        last.set(id, total)
        lastRows.set(
          id,
          w.results.filter((r) => r.playerId === id && r.points > 0 && inTrack('domestic')(r)).map((r) => r.week),
        )
      }
    })
    // ⭐⭐ THE COLUMN THE PROBE REPORTS AND THE ONE THAT MATTERS: nothing falls without a reason.
    expect(unexplainedFalls, 'a domestic total fell with no row leaving the window').toBe(0)
    // The discriminators: a table nobody scores in, or one nothing ever leaves, satisfies the line
    // above trivially. Both halves of the crawl have to be observed for it to mean anything.
    expect(observedRises).toBeGreaterThan(20)
    expect(biggestBook).toBeGreaterThan(200)
    expect(agedOutFalls, 'nothing ever aged out – the window is not crawling').toBeGreaterThan(0)
    // ⭐⭐ AND THE BOUNDARY IS A WEEK LIKE ANY OTHER, which is his complaint answered on a real career.
    // Under round 23's rule the top ten read EXACTLY ZERO on the first week of every season – that is
    // what «каждый год заново» was. Asserted as the table's own book rather than as a fall count,
    // because a fall count cannot distinguish "nothing left the window this week" from "everything
    // did": a row 53 weeks old on the wrap week ages out then like any other, and one legitimately
    // does here. What may never happen again is the table arriving at the boundary empty.
    expect(boundaryBooks.length, 'the walk never reached a season boundary').toBeGreaterThan(0)
    for (const book of boundaryBooks) {
      expect(book, 'the domestic top ten opened a season at zero – the January cliff is back').toBeGreaterThan(0)
    }
  })

  it('⭐ the two junior tables now behave IDENTICALLY, measured rather than read off the constant', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «the ITF table still falls mid-season – the rolling window was
    // NOT changed under it»). That arm existed to prove the two tracks diverged on purpose; the
    // ruling deletes the divergence, so the honest form of the same test is that the SAME book folds
    // to the SAME number on both, week for week. `WINDOW_BY_TRACK` above says what we WROTE; this
    // says what the engine DOES, which is the half a constant read cannot reach.
    //
    // The same two results, once as J rows and once as domestic rows, at the same points and the same
    // weeks – so any difference in the two totals is the window and nothing else. Best-N is 6 on both
    // (`BEST_N_BY_TRACK`), which is what makes them comparable at all.
    const jRows: SeasonResult[] = [
      { playerId: 'p', week: 3, points: 100, tier: 'j300' },
      { playerId: 'p', week: 30, points: 60, tier: 'j60' },
    ]
    const domRows: SeasonResult[] = [
      { playerId: 'p', week: 3, points: 100, tier: 'national' },
      { playerId: 'p', week: 30, points: 60, tier: 'regional' },
    ]
    const itf = (w: number) => windowedBestSum(jRows, w, 'p', BEST_N_BY_TRACK.itf, inTrack('itf'), WINDOW_BY_TRACK.itf)
    const dom = (w: number) => domesticTotal(domRows, w, 'p')
    // The behaviour both tables share: the week-3 result is 53 weeks old at week 56 and leaves then –
    // in the middle of season 2 on the calendar, and on no particular week at all in the rule.
    expect(itf(55)).toBe(160)
    expect(itf(56)).toBe(60)
    // ⭐ ...and the domestic fold answers the same, week for week, across the boundary and past it.
    // Under round 23's rule `dom(52)` was 0 while `itf(52)` was 160: THE line this test is here for.
    for (let w = 0; w <= 2 * WEEKS_PER_YEAR; w++) {
      expect(dom(w), `week ${w}: the two junior tables disagree about one book`).toBe(itf(w))
    }
    // The discriminator: two folds that are both always zero would satisfy that loop.
    expect(dom(WEEKS_PER_YEAR)).toBe(160)
  })

  it('the counting-results list adds up to the total beside it, on the domestic table', () => {
    // ⚠ THE COHERENCE PIN, and the one that catches a HALF-APPLIED version of this change.
    // `computeCountingResults` (world/snapshot.ts) re-spells the window filter, and `kidPoints`
    // (world/ladder.ts) folds it through `WINDOW_BY_TRACK`. If only one of them learns the new rule,
    // the Kid screen prints a total over a list of rows that does not add to it – which that
    // function's own comment calls "the one thing this function must never do".
    //
    // ⚠ THE ROW-AGE BOUND IS RE-AIMED WITH THE RULING (round 42 #7): the list may no longer be
    // required to sit inside this season – it is required to sit inside the WINDOW, which is the same
    // bound `windowFromWeek` gives the fold. `seasonStartWeek` stays imported and pinned two tests
    // up, where it guards the second copy of the season arithmetic the probe's B arm still needs.
    let checked = 0
    let sawLastSeasonRow = false
    walk('dom-probe-0', WEEKS_PER_YEAR + 12, (w) => {
      const listed = computeCountingResults(w, 'domestic').reduce((s, r) => s + r.points, 0)
      expect(listed).toBe(kidPoints(w, 'domestic'))
      for (const r of computeCountingResults(w, 'domestic')) {
        expect(r.week).toBeGreaterThanOrEqual(windowFromWeek(w.week, WINDOW_BY_TRACK.domestic))
        expect(TIERS[r.tier!].track).toBe('domestic')
        if (r.week < seasonStartWeek(w.week)) sawLastSeasonRow = true
      }
      if (listed > 0) checked++
    })
    // The discriminator: an all-empty career would pass both assertions vacuously.
    expect(checked).toBeGreaterThan(20)
    // ⭐ AND THE CARRY-OVER IS OBSERVED RATHER THAN ASSUMED – a row she won LAST season is on the list
    // she is shown this season, which is «каждый год заново» not happening, in the counting table.
    expect(sawLastSeasonRow, 'no counted row survived the boundary – nothing carried over').toBe(true)
  })
})
