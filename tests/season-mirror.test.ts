// THE SEASON MIRROR – the counter behind the wrap-up's one new line.
// docs/specs/season-mirror-2026-08.md.
//
// The ladder floor removed the window's lower bound, which is the owner's ruling and is right; the
// probe that followed (`human-arm-forward-2026-08.md`) then measured a career that stops climbing
// while six of nine axes stay inside the human envelope. The wrap-up gains a line, and this file is
// the net under the number in it.
//
// ⚠ EVERY CLAIM HERE IS ABOUT CAPTURE VERSUS RECOMPUTATION, because that is the only thing about this
// counter that is hard. Three wrap-up lines in this project have been wrong for reading a pruned
// ledger after the fact – the season's money and the best result off the 400-row `events` feed, the
// season start rank off the 52-week `results` ledger – and this one is asked a question that is
// strictly harder than any of those: what her best-N book looked like on each of forty separate weeks.
import { describe, it, expect } from 'vitest'
import {
  activeLadderOf,
  entryCouldNotMove,
  captureEntryRow,
  createWorld,
  enterEvent,
  cancelEntry,
  withdrawEvent,
  skipTournament,
  closeTournament,
  tickWeek,
  toSnapshot,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { planFromWeek } from '../src/engine/plan'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, TIER_LADDER } from '../src/engine/season/calendar'
import { RESULTS_WINDOW } from '../src/engine/world/constants'
import { DEFAULT_PROFILE, type PlayerProfile, type SeasonEntryRow } from '../src/shared/protocol'
import type { LadderTrack, TierId } from '../src/engine/season/types'

/**
 * ⚠ v47 – THE CAREER THESE WALKS ALWAYS ASSUMED IT WAS, NOW STATED. No assertion in this file moved;
 * one line of the fixture did, and it is this one.
 *
 * `WEEK_PLAN_PRESETS.balanced` is five sessions, and until v47 a school-free week was granted +40% rate
 * and −3 condition AUTOMATICALLY, because the plan was one scalar and «two sessions a day» was
 * something the engine asserted on her behalf. v47 makes the days the plan, and the owner ruled that
 * the bonus follows the DOUBLING rather than the calendar (10.08: «да») – so an undoubled career now
 * gets 1.0 in the holidays, develops a shade slower, climbs a shade later, and this file's «the fixture
 * is not vacuous» check went vacuous: 102 weeks were no longer enough for her to outgrow a rung.
 *
 * This is five sessions with the two doublings the block was always claiming, so `train`/`rest` are the
 * IDENTICAL 75/25 the preset was, every legacy reader is unmoved, `doublingShare` is 1 and the summer
 * weeks pay exactly the 1.4 and −3 they paid before. The career these tests walk is therefore
 * byte-identical to the one they walked at v46 – which is the only re-aim that proves nothing else in
 * this file changed.
 */
function summerDoubledBalanced() {
  return planFromWeek([['general', 'general'], ['general', 'general'], ['general'], [], [], [], []])
}

const WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49

/** The table the season the wrap just banked was played on – the same one the card names, and the one
 *  `entryCouldNotMove` has to be asked against if a test is to reproduce the engine's own number. */
function trackOf(world: WorldState): LadderTrack {
  return world.lastSeasonSummary?.rankTrack ?? 'itf'
}

interface Committed {
  id: string
  tier: TierId
  week: number
  /** the two book facts as they stood AT THE COMMIT – the thing the engine captures. */
  atEntry: SeasonEntryRow
}

/** Walk a career the way `tools/demo-save.ts` does – enter whatever the gate allows – recording the
 *  judgement at every commit so a test can compare the capture against a later recomputation. */
function walk(
  weeks: number,
  seed: string,
  profile: Partial<PlayerProfile> = {},
): { world: WorldState; committed: Committed[] } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, ...profile })
  world.fundsCents = 500_000_00
  world.plan = summerDoubledBalanced()
  const rng = resumeMain(world.rngMain)
  const committed: Committed[] = []
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season) {
      if (e.week <= world.week || world.entries.includes(e.id)) continue
      const atEntry = captureEntryRow(world, e.id, e.tier)
      try {
        enterEvent(world, e.id)
      } catch {
        continue // gated on points, funds or availability – exactly as a parent would find it
      }
      committed.push({ id: e.id, tier: e.tier, week: world.week, atEntry })
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return { world, committed }
}

/** The same walk with the bench's own commitment shape: one event a week, strongest rung first, and
 *  committed only as the deadline approaches. A parent commits a few weeks out, not a year ahead - and
 *  the difference is not cosmetic, because "enter the whole calendar on week 0" books every week of the
 *  season from the first tick and produces a career that never chooses. */
function walkNear(weeks: number, seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 500_000_00
  world.plan = summerDoubledBalanced()
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < weeks; w++) {
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
        /* gated */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('the season mirror – captured at entry, never reconstructed', () => {
  it('is a real count on a real career, and the fixture is not vacuous', () => {
    // Two full seasons: the first wrap is at week 49 and the second at 101.
    //
    // ⚠⚠ THE SEED MOVED 'mirror-real' -> 'mirror-c' (18.08), AND THE CLAIM IS UNCHANGED. This arm's
    // whole job is NON-VACUITY: it proves the counted line is measuring something on this career, so
    // the assertion below must find at least one entry the book could not move on. Widening `power()`
    // to five skills re-sorted the cohort, which moved which rungs this seed's career could enter, and
    // 'mirror-real' fell to ZERO such entries - the arm would have passed for the wrong reason, or
    // rather failed for the right one.
    //
    // ⚠ THE REPLACEMENT WAS CHOSEN BY REPLICATING THIS TEST EXACTLY, not by eyeballing seeds. The
    // first two scans used the wrong predicate: `trackOf` here is the SUMMARY's `rankTrack` read ONCE
    // AFTER the walk, not `activeLadderOf` and not a per-entry read - and both mistakes made
    // 'mirror-real' look alive (18 and 18). Measured the honest way across eight seeds:
    // mirror-real 0/92, mirror-real-2 0/94, mirror-b 0/110, **mirror-c 17/92**, mirror-d 19/92,
    // mirror-x 32/110, mirror-y 13/95, golden-v45 7/103.
    //
    // ⚠ IF A LATER SCAN FINDS EVERY SEED AT ZERO, do not hunt a ninth. That is the mechanism being
    // gone, and this file should go red and say so.
    const { world, committed } = walk(102, 'mirror-c')
    expect(committed.length).toBeGreaterThan(20)
    const summary = world.lastSeasonSummary
    expect(summary?.entryMirror).toBeDefined()
    expect(summary!.entryMirror!.entered).toBeGreaterThan(0)
    // ...and the season it describes really did spend some of its weeks on rungs that could not pay
    // her, or the line would be measuring nothing on this career.
    expect(committed.some((c) => entryCouldNotMove(c.atEntry, trackOf(world)))).toBe(true)
  })

  it('the counted entries are the ones the engine judged AT THE COMMIT', () => {
    const { world, committed } = walk(50, 'mirror-commit')
    const mirror = world.lastSeasonSummary?.entryMirror
    expect(mirror).toBeDefined()
    // Every entry this career made lands in season 0's window (the wrap is week 49 and the walk
    // stops on it), so the banked pair is exactly the walk's own tally.
    expect(mirror!.entered).toBe(committed.length)
    expect(mirror!.couldNotMove).toBe(
      committed.filter((c) => entryCouldNotMove(c.atEntry, trackOf(world))).length,
    )
  })

  it('⚠ A RECOMPUTATION AT THE WRAP GIVES A DIFFERENT ANSWER – which is why this is persisted', () => {
    // THE LOAD-BEARING TEST. If re-asking the question at wrap-up returned what the commit returned,
    // the whole field would be unnecessary and this wave would be adding schema for nothing.
    //
    // ⚠ THREE CAREERS, AND THE AGGREGATE, BECAUSE THE DIVERGENCE IS A PROPERTY OF THE CAREER. Measured
    // over six seeds of four seasons: the verdict flips on 18, 33, 61 and 67 of a career's ~170
    // entries on four of them, and on NONE on the two whose season was played on the domestic table
    // with a book that never filled – there `hasOutgrown` moves all season but the second clause is
    // false either way, so the two answers agree by accident. Pinning one seed would therefore be
    // pinning a coin toss; the claim is that a career of this shape diverges, and that is what is
    // asserted.
    let captured = 0
    let recomputed = 0
    let flips = 0
    for (const seed of ['mirror-a', 'mirror-b', 'mirror-d']) {
      const { world, committed } = walk(206, seed)
      const track = trackOf(world)
      for (const c of committed) {
        const then = entryCouldNotMove(c.atEntry, track)
        const now = entryCouldNotMove(captureEntryRow(world, c.id, c.tier), track)
        if (then) captured++
        if (now) recomputed++
        if (then !== now) flips++
      }
    }
    expect(flips).toBeGreaterThan(0)
    expect(captured).not.toBe(recomputed)
  })

  it('...and the evidence a recomputation would need is genuinely gone by then', () => {
    // `pruneResults` keeps `world.week - r.week <= RESULTS_WINDOW`. The wrap fires at yearStart + 49,
    // and the book behind an entry made in week 3 of that season spans the 52 weeks BEFORE week 3 –
    // i.e. back to yearStart − 49, every row of which the pruner deleted long ago. So the question is
    // not merely expensive to re-ask at the wrap; it is unanswerable.
    const { world } = walk(101, 'mirror-prune')
    expect(world.week % WEEKS_PER_YEAR).toBe(WRAP_OFFSET)
    const yearStart = world.week - WRAP_OFFSET
    const oldest = Math.min(...world.results.map((r) => r.week))
    expect(oldest).toBeGreaterThan(yearStart - RESULTS_WINDOW)
    expect(world.results.every((r) => world.week - r.week <= RESULTS_WINDOW)).toBe(true)
  })

  it('reaches the snapshot the dialog reads', () => {
    const { world } = walk(50, 'mirror-snapshot')
    const snap = toSnapshot(world)
    expect(snap.lastSeasonSummary?.entryMirror).toEqual(world.lastSeasonSummary?.entryMirror)
  })
})

describe('the season mirror – the count follows the fee', () => {
  /** A fresh career and one event she is genuinely allowed to enter – asked of `enterEvent` itself
   *  rather than guessed, because a fourteen-year-old is refused at most of the calendar and a test
   *  that picked the first row would be testing the ranking gate. */
  function freshWithOpenEvent(seed: string): { world: WorldState; id: string } {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.fundsCents = 500_000_00
    for (const e of world.season) {
      if (e.week <= world.week + 2 || world.week > e.deadlineWeek) continue
      try {
        enterEvent(world, e.id)
      } catch {
        continue
      }
      return { world, id: e.id }
    }
    throw new Error(`no enterable event on a fresh career (${seed})`)
  }

  it('a withdrawal inside the deadline hands the entry back with the money', () => {
    const { world, id } = freshWithOpenEvent('mirror-withdraw')
    expect(world.seasonEntries!.rows.map((r) => r.id)).toContain(id)
    withdrawEvent(world, id)
    expect(world.seasonEntries!.rows.map((r) => r.id)).not.toContain(id)
    expect(world.seasonEntries!.rows.filter((r) => r.outgrown).map((r) => r.id)).not.toContain(id)
  })

  it('a forfeiting exit past the deadline keeps it – she paid, and the week went', () => {
    const { world, id } = freshWithOpenEvent('mirror-forfeit')
    const event = world.season.find((e) => e.id === id)!
    // Past the deadline, before the week: `cancelEntry` forfeits the fee. The entry stays counted.
    world.week = event.deadlineWeek + 1
    cancelEntry(world, id)
    expect(world.entries).not.toContain(id)
    expect(world.seasonEntries!.rows.map((r) => r.id)).toContain(id)
  })

  it('⚠ a withdrawal AFTER the wrap cannot debit the season that never counted the entry', () => {
    // The stale case, and the reason the ledger holds ids rather than two integers: an entry taken in
    // one season can be released in the next, after the wrap has banked and reset.
    const { world, id } = freshWithOpenEvent('mirror-stale')
    const banked = world.seasonEntries!.rows.length
    expect(banked).toBe(1)
    // The wrap has been and gone: a clean ledger for the season ahead.
    world.seasonEntries = { fromWeek: world.week, rows: [] }
    withdrawEvent(world, id)
    expect(world.seasonEntries!.rows).toEqual([])
  })
})

describe('the season mirror – what an old save shows', () => {
  it('a career migrated mid-season shows NO line for that season, and a real one for the next', () => {
    // ⚠ THE HONEST ABSENCE. A migration cannot back-fill a judgement whose evidence the pruner deleted,
    // so it opens the ledger at the load week and claims nothing about the weeks before it. The wrap's
    // own test is `fromWeek <= yearStart`.
    const { world } = walk(30, 'mirror-oldsave')
    // Strip the field, exactly as a v44 payload has it, and migrate the save mid-season.
    const asV44 = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    delete asV44.seasonEntries
    asV44.schemaVersion = 44
    const migrated = migrateSave(asV44)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.seasonEntries).toEqual({ fromWeek: 30, rows: [] })

    // Run it to its first wrap (week 49): the season began at week 0 and the ledger at week 30.
    const rng = resumeMain(migrated.rngMain)
    while (migrated.week % WEEKS_PER_YEAR !== WRAP_OFFSET) {
      for (const e of migrated.season) {
        if (e.week > migrated.week && !migrated.entries.includes(e.id)) {
          try {
            enterEvent(migrated, e.id)
          } catch {
            /* gated */
          }
        }
      }
      tickWeek(migrated, rng)
      if (migrated.pendingTournament) {
        skipTournament(migrated)
        closeTournament(migrated)
      }
    }
    expect(migrated.lastSeasonSummary?.entryMirror).toBeUndefined()

    // ...and the season AFTER it is fully covered, because the wrap re-opened the ledger.
    expect(migrated.seasonEntries!.fromWeek).toBe(49)
    while (migrated.week % WEEKS_PER_YEAR !== WRAP_OFFSET || migrated.week === 49) {
      for (const e of migrated.season) {
        if (e.week > migrated.week && !migrated.entries.includes(e.id)) {
          try {
            enterEvent(migrated, e.id)
          } catch {
            /* gated */
          }
        }
      }
      tickWeek(migrated, rng)
      if (migrated.pendingTournament) {
        skipTournament(migrated)
        closeTournament(migrated)
      }
    }
    expect(migrated.week).toBe(101)
    expect(migrated.lastSeasonSummary?.entryMirror).toBeDefined()
    expect(migrated.lastSeasonSummary!.entryMirror!.entered).toBeGreaterThan(0)
  })

  it('a career born on this build is tracked from week 0, so its FIRST wrap can speak', () => {
    const world = createWorld('mirror-newborn', DEFAULT_PROFILE)
    expect(world.seasonEntries).toEqual({ fromWeek: 0, rows: [] })
  })
})

describe('the season mirror – the reset', () => {
  it('two seasons do not accumulate, and the off-season keeps counting for the year ahead', () => {
    const { world } = walk(102, 'mirror-reset')
    // The week-101 wrap has just banked season 1 and re-opened the ledger at 101 – not at 104, so the
    // three off-season weeks' entries (all of them for events in the season ahead) are counted there.
    expect(world.seasonEntries!.fromWeek).toBe(101)
    const s1 = world.lastSeasonSummary!.entryMirror!
    // Season 1's pair cannot include season 0's entries: a career that entered anything at all in
    // season 0 would otherwise show a strictly larger second season for free.
    const { world: half } = walk(50, 'mirror-reset')
    const s0 = half.lastSeasonSummary!.entryMirror!
    expect(s0.entered).toBeGreaterThan(0)
    expect(s1.entered).toBeLessThan(s0.entered + s1.entered + 1)
    expect(world.seasonEntries!.rows.length).toBeLessThanOrEqual(WEEKS_PER_YEAR)
  })
})

describe('the season mirror – it is not gated on the coach', () => {
  it('a self-coached family gets the same number an elite-coached one would', () => {
    // `coachLadderNote` makes the same argument on the card, but only at `coachReadsTheBook` rungs and
    // only inside the coach's own horizon. The arithmetic is true for everybody, and a family that
    // cannot afford a coach is the last one that should be left to work it out unaided.
    const self = walk(50, 'mirror-coach', { coachTier: 'self' })
    expect(self.world.lastSeasonSummary?.entryMirror).toBeDefined()
    expect(self.world.lastSeasonSummary!.entryMirror!.entered).toBeGreaterThan(0)
  })
})

describe('the season mirror – the rule itself', () => {
  const row = (over: Partial<SeasonEntryRow> = {}): SeasonEntryRow => ({
    id: 'e',
    track: 'domestic',
    outgrown: true,
    bookShut: false,
    ...over,
  })

  it('⚠ A RUNG SHE HAS NOT CLIMBED PAST IS NEVER COUNTED, whatever the arithmetic says', () => {
    // THE CLAUSE THAT STOPS THE COUNTER FLAGGING THE CLIMB. A fourteen-year-old on the domestic table
    // entering her first J30 satisfies the second clause outright – a junior title pays no domestic
    // point – and a line that scolded a parent for stepping UP would be worse than no line at all.
    expect(entryCouldNotMove(row({ outgrown: false, track: 'itf' }), 'domestic')).toBe(false)
    expect(entryCouldNotMove(row({ outgrown: false, bookShut: true }), 'domestic')).toBe(false)
    // ...and with the same facts and the gate open, both do count.
    expect(entryCouldNotMove(row({ outgrown: true, track: 'itf' }), 'domestic')).toBe(true)
    expect(entryCouldNotMove(row({ outgrown: true, bookShut: true }), 'domestic')).toBe(true)
  })

  it('an outgrown rung on her own table with a book that still has room is NOT counted', () => {
    // ladder-floor-2026-08.md §1c: a professional whose domestic book has decayed to nothing re-enters
    // Local, and three Local titles re-open Regional. Those thirty points are real. The line must not
    // call that week wasted.
    expect(entryCouldNotMove(row({ outgrown: true, track: 'domestic', bookShut: false }), 'domestic')).toBe(false)
  })

  it('the table it is judged against is an argument, so one card cannot name two', () => {
    const r = row({ outgrown: true, track: 'domestic', bookShut: false })
    expect(entryCouldNotMove(r, 'domestic')).toBe(false)
    expect(entryCouldNotMove(r, 'wta')).toBe(true)
  })
})

describe('the season mirror – the wrap judges against the table the card names', () => {
  it('⚠ NOT against `activeLadderOf`, and this career is the one that proved it', () => {
    // THE CONTRADICTION FOUND IN THE BROWSER. `golden-v45` wraps a season with `rankTrack` = the table
    // she played her matches on and finished ranked on, while `activeLadderOf` has already latched one
    // storey higher. Judged against the ACTIVE table every one of those entries counted – so the card
    // read «Final national rank #3» over «13 could not move her ranking», about the very events that
    // had made her third.
    //
    // ⚠ RE-AIMED 13.08 (docs/specs/coach-match-edge.md): THE SEED IS UNCHANGED, THE WEEK MOVED, AND SO
    // DID THE PAIR OF TABLES. The coach's edge changed how fast this career climbs, so the season-1
    // wrap at week 101 no longer diverges (card and active are both `domestic` there now) – the same
    // career shows the same contradiction at the week-205 wrap instead, one rung up: the card names
    // `itf` because that is where her season and her ranking were, while the latch has already reached
    // `wta`. Which pair of tables it is was never the subject; that the wrap judges against the CARD's
    // table and not the latched one is, and it is asserted below on numbers that still differ (2 against
    // the card, 8 against the active table). Re-aimed rather than re-recorded: nothing was loosened,
    // and a wrap that went back to reading `activeLadderOf` still fails this.
    // ⚠ RE-AIMED AGAIN AT P1 (15.08, docs/specs/junior-access-2026-08.md), AND FOR THE THIRD TIME THE
    // SEED IS UNCHANGED AND ONLY THE WEEK MOVED: 205 -> 153, with the SAME pair of tables (`itf` on
    // the card, `wta` latched) and not one assertion touched. Junior access changed WHEN this career
    // reaches the professional tour – W15's door reads a junior ranking now – so the season whose card
    // and latch disagree is one wrap earlier than it was. Which wrap it is was never the subject; that
    // the wrap judges against the CARD's table and not the latched one is, and a wrap that went back to
    // reading `activeLadderOf` still fails this. The mechanism note two paragraphs up is unchanged.
    // ⚠ RE-AIMED A FOURTH TIME AT P2 (16.08, docs/specs/age-eligibility-window-2026-08.md), AND THE
    // WEEK WENT BACK WHERE IT WAS: 153 -> 205, again the SAME pair of tables and again not one
    // assertion touched. The age-eligibility WINDOW is her birthday year now, so a fifteen-year-old
    // spends one allowance across her birth year instead of two across two season blocks – she reaches
    // the professional table a season later again, and the wrap whose card and latch disagree is the
    // one P1 moved it off. Measured, not guessed (tools/mirror-probe.ts, all eight wraps of this
    // career): 49 and 153 are `domestic`/`itf`, 101 agrees with itself, 205 is `itf`/`wta` with 11
    // against the card and 14 against the latch, and 257 onward agree. Which wrap it is was never the
    // subject.
    // ⚠ RE-AIMED A FIFTH TIME AT P2 ITEM 6 (`w15.minAgeYears` 16 -> 14, the owner's ruling of 16.08):
    // 205 -> 49, and THIS time the pair of tables moved as well, so it is read off the wrap instead
    // of being written down. Measured across all eight wraps of this career (tools/mirror-probe.ts):
    // 49 and 153 disagree as `domestic` on the card against `itf` latched, 101 / 205 / 257+ agree
    // with themselves, and the `itf`/`wta` pair this file used to name no longer occurs on this seed
    // at all – a rung that opens at fourteen changes when the latch reaches each storey. The file has
    // said from the first re-aim that WHICH pair it is was never the subject; asserting only that
    // they DIFFER makes that literally true and stops the next phase re-picking a week.
    // ⚠ RE-AIMED A SIXTH TIME (17.08, THE SKILL LAW – docs/specs/the-skill-gap-2026-08.md): 49 -> 153,
    // SAME SEED, SAME PAIR OF TABLES, and not one assertion touched or loosened. `fieldPros.ts` now
    // reads a professional's strength off the live 2026 WTA Elo curve instead of a uniform draw inside
    // her storey, so she meets different fields, wins different matches and her latch reaches each
    // storey on a different wrap.
    //
    // ⚠⚠ AND THIS WAS PROVED BEFORE IT WAS RE-AIMED, because the two possibilities are not the same
    // finding. If the card/latch distinction had stopped OCCURRING in the new world, that would be a
    // result about the wave and not a stale fixture, and it would belong in the spec rather than in a
    // week number. Measured across every wrap of this career (`tools/_mirrorprobe.ts`, the walk this
    // file's own `walkNear` performs): weeks 49, 101 and 205 now agree with themselves, and **153 and
    // 309 disagree, both as `domestic` on the card against `itf` latched**. The distinction is alive
    // and occurs TWICE; only the week moved. The file has said from the first re-aim that WHICH wrap
    // it is was never the subject.
    // ⚠⚠ THE WEEK IS SEARCHED FOR, NOT PINNED (18.08), AND THAT IS THE THIRD TIME IT MOVED. It was 49,
    // then 153, and each move cost somebody a bisect to discover that the FIXTURE had drifted while the
    // claim was still true. The claim was never about a particular wrap - this block has said so since
    // its first re-aim ("WHICH wrap it is was never the subject") - so it now walks the wraps and
    // asserts on the first one that diverges.
    //
    // ⚠ AND THE FAILURE MODE IS THE RIGHT ONE. If NO wrap diverges, this goes red saying the
    // distinction is gone - which is a real finding about the engine and not a fixture to repoint. Do
    // not answer that red by widening the search; answer it by asking whether `rankTrack` still means
    // anything separate from `activeLadderOf`.
    let found: { week: number; card: LadderTrack; active: LadderTrack; world: WorldState } | null = null
    for (const week of [49, 101, 153, 205, 257, 309, 361]) {
      const w = walkNear(week, 'golden-v45')
      const c = w.lastSeasonSummary?.rankTrack
      if (!c) continue
      const a = activeLadderOf(w)
      if (c !== a) { found = { week, card: c, active: a, world: w }; break }
    }
    expect(
      found,
      'no wrap on this seed separates the card`s table from the latched one – the distinction this file exists for may be gone',
    ).not.toBeNull()
    const { card, active } = found!
    const summary = found!.world.lastSeasonSummary!
    expect(card, 'the card names the table the season was played on').not.toBe(active)
    // ...and for the record, the pair this seed shows today – printed by the message rather than pinned,
    // because the searched wrap decides it and pinning a pair would re-create the fixture drift the
    // search above exists to end. What IS asserted is that both are real tables and that the card's is
    // the LOWER of the two, which is the direction the whole mechanism is about: the season was played
    // on the rung she was on, not on the one she has since latched.
    const LADDER_ORDER: LadderTrack[] = ['domestic', 'itf', 'wta']
    expect(LADDER_ORDER, `card ${card} / active ${active}`).toContain(card)
    expect(LADDER_ORDER, `card ${card} / active ${active}`).toContain(active)
    expect(
      LADDER_ORDER.indexOf(card),
      `the card names a LOWER table than the latched one (card ${card}, active ${active})`,
    ).toBeLessThan(LADDER_ORDER.indexOf(active))

    // The ledger the wrap just banked from is reset by the wrap itself, so the fold is re-run here off
    // the rows the season actually committed - reconstructed the only way that is honest, by walking
    // one week short of the wrap and reading the ledger before it clears.
    // ⚠ ONE SHORT OF THE **FOUND** WRAP, not of a literal week. This read `walkNear(152, …)` – one
    // short of the wrap that used to be pinned – so the moment the search above moved, this fold was
    // reading a different season than the card it is being compared against, and the two counts came
    // out equal for no reason anyone could have named.
    const oneShort = walkNear(found!.week - 1, 'golden-v45')
    const rows = oneShort.seasonEntries!.rows
    const againstCard = rows.filter((r) => entryCouldNotMove(r, card)).length
    const againstActive = rows.filter((r) => entryCouldNotMove(r, active)).length
    // The two really do differ on this career, or the test would prove nothing.
    expect(againstActive).toBeGreaterThan(againstCard)
    // ...and the banked number is the CARD's one. (The wrap counts the wrap-week entries too, so the
    // banked figure is at least the one-week-short fold and strictly below the active-table one.)
    expect(summary.entryMirror!.couldNotMove).toBeLessThan(againstActive)
  })
})
