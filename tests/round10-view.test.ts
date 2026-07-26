// Round-10 VIEWING + HISTORY tests. Split out of `round10.test.ts` at integration: the
// correctness agent and the viewing agent each created that filename independently (an add/add
// conflict). Two files instead of one merged import block - the correctness half keeps the
// original name, this half owns R10-6 (finale applause), R10-12 (the live friendly) and R10-9
// (season history).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  bookPractice,
  toSnapshot,
  skipTournament,
  finishLabel,
  SAVE_SCHEMA_VERSION,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import type { WorldEvent } from '../src/shared/protocol'

// ---------------------------------------------------------------------------
// Round 10, the viewing + history branch.
//   R10-9  season history (schema v14): the append-only per-season record.
//   R10-12 the booked friendly, watched LIVE: the viewer re-simulates the engine's committed
//          record, so watching can never change the result (and adds no engine draw).
// R10-6 (the finale applause landing on the deciding point) is audio wiring inside
// MatchViewer/TournamentFlow – vitest runs in the `node` environment with no <audio>, so that one
// is verified in the browser, not here.
// ---------------------------------------------------------------------------

/** Tick `weeks` weeks, resolving any tournament reveal immediately so time keeps moving
 *  (same harness shape as tests/seasonWrapUp.test.ts). */
function run(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
  }
  return world
}

describe('R10-9 — season history (v14)', () => {
  it('appends one row at each wrap-up, oldest first, matching that season\'s summary', () => {
    // Week 49 is the first season's wrap-up; 101 is the second's. Stopping ON the second wrap
    // keeps `world.fundsCents` at exactly what that season closed with (see below).
    const world = run('r10-history', 101)
    expect(world.seasonHistory.length).toBe(2)
    const years = world.seasonHistory.map((h) => h.year)
    expect(years).toEqual([...years].sort((a, b) => a - b))

    // The newest row is the season the (overwritten) summary still describes – same figures.
    const last = world.seasonHistory[1]
    const summary = world.lastSeasonSummary!
    expect(last.year).toBe(summary.seasonYear)
    expect(last.endRank).toBe(summary.endRank)
    expect(last.points).toBe(summary.points)
    expect(last.wins).toBe(summary.wins)
    expect(last.losses).toBe(summary.losses)
    expect(last.fundsDeltaCents).toBe(summary.fundsDeltaCents)
    // The closing balance is the funds she wrapped the season with.
    expect(last.endFundsCents).toBe(world.fundsCents)
  })

  it('keeps the FIRST season after the summary has been overwritten (the whole point)', () => {
    const world = run('r10-history-2', 102)
    const first = world.seasonHistory[0]
    // The summary now describes season 2, so the only place season 1 survives is the history.
    expect(world.lastSeasonSummary!.seasonYear).toBe(first.year + 1)
    expect(typeof first.wins).toBe('number')
    expect(typeof first.losses).toBe('number')
    expect(first.year).toBeLessThan(world.lastSeasonSummary!.seasonYear)
  })

  it('is written ONCE per season – ticking through the whole off-season never duplicates a year', () => {
    const world = run('r10-history-once', 60) // week 49 wrap + the rest of the off-season
    expect(world.seasonHistory.length).toBe(1)
    const years = world.seasonHistory.map((h) => h.year)
    expect(new Set(years).size).toBe(years.length)
  })

  it('grows per SEASON, not per week, and every row is a tiny numeric record', () => {
    const shortRun = run('r10-history-size', 60)
    const longRun = run('r10-history-size', 110)
    expect(shortRun.seasonHistory.length).toBe(1)
    expect(longRun.seasonHistory.length).toBe(2) // 50 more weeks -> exactly one more row
    for (const row of longRun.seasonHistory) {
      // No strings anywhere: the save must not grow by prose per season.
      expect(Object.values(row).every((v) => typeof v === 'number')).toBe(true)
      expect(JSON.stringify(row).length).toBeLessThan(160)
    }
  })

  it('stores bestFinish as an index the UI renders with the shared finish label', () => {
    const world = run('r10-history-best', 110)
    for (const row of world.seasonHistory) {
      if (row.bestFinish === undefined) continue
      expect(row.bestFinish).toBeGreaterThanOrEqual(0)
      // Same wording the finale card and the wrap-up milestone use.
      expect(world.lastSeasonSummary!.bestResultText.length).toBeGreaterThan(0)
      expect(finishLabel(row.bestFinish).length).toBeGreaterThan(0)
    }
    expect(finishLabel(0)).toBe('Champion')
    expect(finishLabel(2)).toBe('Semifinalist')
  })

  it('surfaces the history on the snapshot (oldest first, copied out)', () => {
    const world = run('r10-history-snap', 102)
    const snap = toSnapshot(world)
    expect(snap.seasonHistory.length).toBe(world.seasonHistory.length)
    expect(snap.seasonHistory).toEqual(world.seasonHistory)
    // A copy, not the live array: mutating the snapshot can't reach the world.
    snap.seasonHistory[0].points = -1
    expect(world.seasonHistory[0].points).not.toBe(-1)
  })

  it('a fresh career starts with an empty history', () => {
    const world = createWorld('r10-history-fresh')
    expect(world.seasonHistory).toEqual([])
    expect(toSnapshot(world).seasonHistory).toEqual([])
  })
})

describe('R10-9 — v14 migration', () => {
  it('is at schema 14', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(14)
  })

  it('seeds the history from a v13 save\'s lastSeasonSummary (and is idempotent)', () => {
    const v13 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v13.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v13))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.seasonHistory.length).toBe(1)
    const summary = migrated.lastSeasonSummary!
    expect(migrated.seasonHistory[0]).toEqual({
      year: summary.seasonYear,
      endRank: summary.endRank,
      points: summary.points,
      wins: summary.wins,
      losses: summary.losses,
      fundsDeltaCents: summary.fundsDeltaCents,
      endFundsCents: migrated.fundsCents,
    })
    // bestFinish is not reconstructed from the summary's prose.
    expect(migrated.seasonHistory[0].bestFinish).toBeUndefined()
    // Re-migrating changes nothing – no duplicated season, no reset.
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  it('gives a career that never finished a season an empty history', () => {
    // A v13 save from the first season (no wrap-up has happened, so no summary to seed from).
    const v13 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v13.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const midFirstSeason = { ...structuredClone(v13), week: 20, lastSeasonSummary: null }
    delete (midFirstSeason as { seasonHistory?: unknown }).seasonHistory
    const migrated = migrateSave(midFirstSeason)
    expect(migrated.lastSeasonSummary).toBeNull()
    expect(migrated.seasonHistory).toEqual([])
  })

  it('never touches an existing v14 history (a real career\'s seasons survive re-migration)', () => {
    const v14 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v14.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v14))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.seasonHistory).toEqual(v14.seasonHistory)
    expect(migrated.seasonHistory.length).toBe(2)
  })
})

describe('R10-12 — watching the booked friendly cannot change it', () => {
  /** A career with a practice booked for next week, ticked into that week. */
  function playPracticeWeek(seed: string): { world: WorldState; friendly: WorldEvent } {
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    // Walk forward until a bookable week comes up, book it, then tick INTO it.
    for (let i = 0; i < 40; i++) {
      const next = world.week + 1
      try {
        world.fundsCents = 9_999_999_00 // the fee is not what this test is about
        bookPractice(world, next, false)
      } catch {
        tickWeek(world, rng)
        if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
        continue
      }
      tickWeek(world, rng)
      if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
      const friendly = world.events.find((e) => e.type === 'match' && e.friendly && e.week === world.week)
      if (friendly) return { world, friendly }
    }
    throw new Error('no practice match resolved')
  }

  it('re-simulating the stored record reproduces the engine\'s committed result exactly', () => {
    const { friendly } = playPracticeWeek('r10-practice')
    const m = friendly.match!
    // EXACTLY what the viewer does (PracticeFlow/MatchReplay): the stored players + stored seed.
    const replayed = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' })
    const replayedScore = replayed.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    const replayedWinnerId = replayed.winner === 0 ? m.aId : m.bId
    expect(replayedScore).toBe(m.score)
    expect(replayedWinnerId).toBe(m.winnerId)
    // …and twice more: a re-watch is byte-identical too (pure function of the stored inputs).
    const again = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' })
    expect(again).toEqual(replayed)
  })

  it('the friendly is a real kid match record, on its own private stream, worth zero points', () => {
    const { world, friendly } = playPracticeWeek('r10-practice-2')
    const m = friendly.match!
    expect(friendly.friendly).toBe(true)
    expect([m.aId, m.bId]).toContain(KID_ID)
    // The private practice stream (never the main weekly one).
    expect(m.seed).toBe(`${world.seed}:practicematch:${world.week}:m`)
    // Zero ranking points: no results row was written for this week.
    expect(world.results.some((r) => r.playerId === KID_ID && r.week === world.week)).toBe(false)
  })

  it('watching mutates nothing: the world is byte-identical after the replay', () => {
    const { world, friendly } = playPracticeWeek('r10-practice-3')
    const m = friendly.match!
    const before = structuredClone(world)
    // Watch it (twice, and via the annotated path the component uses).
    simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' })
    simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' })
    expect(world).toEqual(before)
  })
})
