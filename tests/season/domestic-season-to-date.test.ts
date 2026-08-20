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
// THE DOMESTIC TABLE COUNTS THE SEASON – round 23 items 12 and 13, the owner's ruling
// =================================================================================================
//
// He reported a rival's national total falling 600+ → 400+ "right after my win", and said in the same
// sentence what he believed the table was: «таблица должна просто показывать 6 лучших ЗА СЕЗОН».
// The measurement found nothing subtracted – 51 falls over 6 seeds × 110 weeks, 51 of them a row
// leaving the 52-week window, 0 unexplained, his own case a National title of 200 ageing out at 53
// weeks – so the gap was between the rule and his expectation of it. Shown three options he chose
// the second: «да, это мелочь, а будет хорошо, мне кажется. Тем более, что первый сезон у нас
// показательный.»
//
// WHAT THIS FILE GUARDS, and each one is a thing that can silently come undone:
//
//   1. THE PROPERTY HE BOUGHT – a domestic total never falls inside a season, and resets at the wrap.
//      Asserted twice: on a synthetic ledger (exactly, week by week) and on a real walked world.
//   2. THE TRACKS THAT DID NOT MOVE – ITF and WTA are still a rolling 52 weeks, because they model
//      real tours that genuinely work that way. A future "make it consistent" tidy-up trips here.
//   3. THE SECOND COPY OF THE SEASON ARITHMETIC – `windowFromWeek(w, 'seasonToDate')` must equal
//      `world/ledger.ts`'s `seasonStartWeek(w)` at every week, negative ones included. `season/` may
//      not import `world/`, so the arithmetic is written twice on purpose and pinned here.
//   4. THE LIST ADDS UP TO THE TOTAL – `computeCountingResults` explains the number beside it, so it
//      must borrow the WINDOW as well as the width. This is the assertion that would have caught the
//      half-finished version of this change: a domestic total of 200 over a list summing to 430.

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

describe('round 23 #12/#13 — the domestic table counts this season, not a rolling 52 weeks', () => {
  it('ships as season-to-date on domestic ONLY; the two real tours keep their rolling window', () => {
    // ⚠ THE GUARD FOR THE HALF OF THE RULING THAT SAYS "NOT THE OTHERS". The domestic rungs are our
    // own invention and are free to behave the way a player expects; "a rolling, 52-week period" is
    // the WTA rulebook's own phrase and ITF Juniors Reg 10 is the same shape. A tidy-up that made
    // all three agree would be importing our convenience into two models of real governing bodies.
    expect(WINDOW_BY_TRACK.domestic).toBe('seasonToDate')
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

  it('⭐ a domestic total is monotonic non-decreasing WITHIN a season and resets at the wrap (synthetic)', () => {
    // A book built to be maximally hostile to the claim: a National title in season 1 whose 53rd
    // week falls MID-season-2 (the exact shape of his own 600 → 400), plus enough rows that the
    // best-6 is genuinely full.
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
    let prev = 0
    const wrapDrops: number[] = []
    for (let w = 0; w < 2 * WEEKS_PER_YEAR; w++) {
      const total = domesticTotal(rows, w, 'p')
      if (w % WEEKS_PER_YEAR === 0) {
        // The one place a total is allowed to fall: the season's own first week.
        if (w > 0) {
          expect(total).toBeLessThan(prev)
          wrapDrops.push(w)
        }
        expect(total).toBe(0)
      } else {
        expect(total).toBeGreaterThanOrEqual(prev)
      }
      prev = total
    }
    // The discriminator: without a real book this test would pass on an all-zero ledger. Her season-1
    // book peaks at the full best-6, and the wrap is a genuine cliff, not a rounding.
    expect(domesticTotal(rows, 51, 'p')).toBe(200 + 120 + 80 + 48 + 30 + 30)
    expect(wrapDrops).toEqual([WEEKS_PER_YEAR])
    // ⚠ AND THE ROW THAT USED TO DO THE DAMAGE IS PROVED PRESENT. Under the old rule the week-3
    // National left the window at week 56 and took 200 points out of a mid-season total; here it is
    // already gone at the wrap, and week 56 is a week like any other.
    expect(domesticTotal(rows, 55, 'p')).toBe(domesticTotal(rows, 56, 'p'))
    expect(rows.some((r) => r.week === 3 && r.points === 200)).toBe(true)
  })

  it('⭐ ...and on a real walked world: no domestic leader ever loses points mid-season', () => {
    // The same property, on the engine rather than on a hand-built array – 2 seasons of a real
    // career, watching everybody who reaches the top TEN. (Top ten rather than top three so that a
    // leader who slips a place stays observable: the probe solves the same problem by carrying last
    // week's leaders forward, and a wider slice is the cheaper way to do it inside a test.) This is
    // the assertion his report maps onto: `tools/domestic-season-to-date.ts` §C is this over 6 seeds
    // and 110 weeks.
    // ⚠ THE WATCH LIST IS BY PLAYER, NOT BY POSITION, and the first version of this test got it
    // wrong in a way that quietly passed. Sampling "this week's top three" loses a player the moment
    // she slips a place – and at a wrap EVERY total is zero, so the table re-orders completely and no
    // before/after pair forms at all. The test then reported 0 mid-season falls AND 0 wrap falls,
    // i.e. it proved nothing twice. Watch anyone who has ever reached the top ten, and read her total
    // every week whatever her position.
    const watch = new Set<string>()
    const last = new Map<string, number>()
    let midSeasonFalls = 0
    let wrapFalls = 0
    let observedRises = 0
    let biggestBook = 0
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
      for (const id of watch) {
        const total = domesticTotal(w.results, w.week, id)
        biggestBook = Math.max(biggestBook, total)
        const before = last.get(id)
        if (before !== undefined) {
          if (total < before) {
            if (w.week % WEEKS_PER_YEAR === 0) wrapFalls++
            else midSeasonFalls++
          } else if (total > before) observedRises++
        }
        last.set(id, total)
      }
    })
    expect(midSeasonFalls).toBe(0)
    // The discriminators: a table nobody scores in would satisfy the line above trivially.
    expect(observedRises).toBeGreaterThan(20)
    expect(biggestBook).toBeGreaterThan(200)
    // ...and the reset is real and is the ONLY fall, which is the shape of the ruling.
    expect(wrapFalls).toBeGreaterThan(0)
  })

  it('the ITF table still falls mid-season – the rolling window was NOT changed under it', () => {
    // ⚠ THE OTHER DIRECTION OF THE SAME CLAIM, and it needs to be a real observation rather than a
    // constant read: `WINDOW_BY_TRACK.itf === 'rolling52'` above says what we WROTE, this says what
    // the engine DOES. A J result 53 weeks old must still leave an ITF book mid-season.
    const rows: SeasonResult[] = [
      { playerId: 'p', week: 3, points: 100, tier: 'j300' },
      { playerId: 'p', week: 30, points: 60, tier: 'j60' },
    ]
    const itf = (w: number) => windowedBestSum(rows, w, 'p', BEST_N_BY_TRACK.itf, inTrack('itf'), WINDOW_BY_TRACK.itf)
    expect(itf(55)).toBe(160)
    expect(itf(56)).toBe(60) // week 3 + 53, and week 56 is the middle of season 2
    expect(itf(56)).toBeLessThan(itf(55))
  })

  it('the counting-results list adds up to the total beside it, on the domestic table', () => {
    // ⚠ THE COHERENCE PIN, and the one that catches a HALF-APPLIED version of this change.
    // `computeCountingResults` (world/snapshot.ts) re-spells the window filter, and `kidPoints`
    // (world/ladder.ts) folds it through `WINDOW_BY_TRACK`. If only one of them learns the new rule,
    // the Kid screen prints a total over a list of rows that does not add to it – which that
    // function's own comment calls "the one thing this function must never do".
    let checked = 0
    walk('dom-probe-0', WEEKS_PER_YEAR + 12, (w) => {
      const listed = computeCountingResults(w, 'domestic').reduce((s, r) => s + r.points, 0)
      expect(listed).toBe(kidPoints(w, 'domestic'))
      // ...and no row on the list may predate this season, which is what makes the sum agree.
      for (const r of computeCountingResults(w, 'domestic')) {
        expect(r.week).toBeGreaterThanOrEqual(seasonStartWeek(w.week))
        expect(TIERS[r.tier!].track).toBe('domestic')
      }
      if (listed > 0) checked++
    })
    // The discriminator: an all-empty career would pass both assertions vacuously.
    expect(checked).toBeGreaterThan(20)
  })
})
