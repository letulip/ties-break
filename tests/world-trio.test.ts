// fix/world-trio — three defects that all live in src/engine/world.ts, pinned together.
//
//   1. A WHOLE SEASON DISAPPEARED from the career history. `maybeFireSeasonWrapUp` keyed
//      `seasonHistory` on `weekYear(seasonFirstWeek)` — a CALENDAR year derived from a date — and
//      that value repeats: a season is 52 weeks = 364 days, so its opening Monday walks ~1.25 days
//      earlier a year and steps back over New Year at season 5. `weekYear(208)` and `weekYear(260)`
//      are BOTH 2035, so the dedup guard read season 5 as already banked and dropped its row. The
//      identity is now the SEASON INDEX; the year is derived from the index, for display only.
//
//   2. THE ENGINE STILL PRINTED THE ABSOLUTE WEEK. `ui/week-numbering` (R11-6) introduced
//      `weekLabel()` and swept 33 render sites, but 14 strings written by the ENGINE still embedded
//      the raw index — the ledger read "Entry fee: Local Open (W57)" under a "W3 '32" header.
//
//   3. `angry` HAD ART AND NO TRIGGER. The owner's call: anger fires on consecutive losses, with
//      the threshold drawn per streak in 4..6 so the player cannot count to a fixed number. The
//      draw must come from a purpose-scoped sub-stream (the frozen MAIN capture cannot move) and
//      must be STABLE for the life of one streak (or her face flickers sad/angry on one screen).
import { describe, it, expect } from 'vitest'
import { worldSource } from './worldSource'
import { readFileSync, readdirSync } from 'node:fs'
import {
  availabilityStatus,
  bookPractice,
  bookVacation,
  cancelPractice,
  cancelVacation,
  closeTournament,
  computeLossStreak,
  createWorld,
  enterEvent,
  tierOpenFor,
  seasonIndexOf,
  seasonStartWeek,
  skipTournament,
  tickWeek,
  toSnapshot,
  withdrawEvent,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { seasonYear, weekLabel, weekYear, WEEKS_IN_SEASON } from '../src/shared/dates'
import {
  avatarEmotion,
  ANGER_STREAK_MAX,
  ANGER_STREAK_MIN,
  resultShowsOnHerFace,
} from '../src/shared/avatarEmotion'
import type { LossStreak, WorldEvent, WorldMatch } from '../src/shared/protocol'

/** Tick `weeks` weeks, resolving any tournament reveal immediately so time keeps moving
 *  (the harness shape shared with seasonWrapUp/round10-view). */
function run(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
  }
  return world
}

/** The week season `k`'s wrap-up fires on (the season's first off-season week). */
const wrapWeekOf = (k: number) => k * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)

/** A career that actually COMPETES: enters every event she is eligible and available for, then
 *  ticks. `run` above only lets time pass – a kid who never enters anything plays no matches, so
 *  she can neither produce a tournament summary nor a losing streak. Funds are topped up because
 *  money is not what these cases are about (the same shortcut tests/ladder.test.ts L11 takes). */
function playCareer(seed: string, weeks: number, onWeek?: (w: WorldState) => boolean): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    for (const e of world.season) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      // TWO LADDERS (docs/specs/two-ladders.md): ask the ENGINE'S OWN gate. `isTierEligible` is the
      // DOMESTIC half only – a points band – and j60/j300 have no meaningful one any more ([0, MAX]),
      // so it waved every international event through and enterEvent threw on the rank gate behind it.
      if (!tierOpenFor(world, e.tier)) continue
      if (availabilityStatus(world, e).level === 'blocked') continue
      world.fundsCents = 500_000_00
      enterEvent(world, e.id)
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (onWeek?.(world)) break
  }
  return world
}

// ===========================================================================
// ITEM 1 — the season that vanished.
// ===========================================================================

describe('item 1 — the collision that ate a season', () => {
  it('THE MECHANISM: two consecutive seasons really do open in the same calendar year', () => {
    // Not a hypothetical. This is the arithmetic the old key was built on, stated out loud.
    expect(weekYear(4 * WEEKS_IN_SEASON)).toBe(2035) // season 4 opens Jan 1, 2035
    expect(weekYear(5 * WEEKS_IN_SEASON)).toBe(2035) // season 5 opens Dec 31, 2035
    expect(seasonStartWeek(wrapWeekOf(4))).toBe(208)
    expect(seasonStartWeek(wrapWeekOf(5))).toBe(260)
    // ...and it is the ONLY such pair inside any career the game can reach, which is exactly what
    // made it survive four rounds of tests: a suite that stops at season 2 can never see it.
    const collisions = []
    for (let k = 0; k < 40; k++) {
      for (let j = 0; j < k; j++) {
        if (weekYear(k * WEEKS_IN_SEASON) === weekYear(j * WEEKS_IN_SEASON)) collisions.push([j, k])
      }
    }
    expect(collisions).toEqual([[4, 5]])
  })

  it('THE FIX: the identity is the index, and an index cannot collide', () => {
    const seen = new Set<number>()
    for (let k = 0; k < 40; k++) {
      const idx = seasonIndexOf(wrapWeekOf(k))
      expect(idx).toBe(k)
      expect(seen.has(idx)).toBe(false)
      seen.add(idx)
    }
    // The DISPLAY year is derived from the index, so it is unique too – and it is the same year
    // weekLabel prints for the weeks inside that season, so a row header and a ledger line agree.
    expect(seasonYear(4)).toBe(2035)
    expect(seasonYear(5)).toBe(2036)
    expect(weekLabel(5 * WEEKS_IN_SEASON)).toBe("W1 '36")
  })

  // ⚠ THE REGRESSION PIN. This is the case that fails on the parent commit: it banks FIVE rows
  // (2031-2035) instead of six, because season 5 hashes to a year season 4 already claimed.
  it('runs to season 6 and banks SIX distinct seasons – none silently dropped', () => {
    const world = run('trio-six-seasons', wrapWeekOf(5))
    expect(world.seasonHistory.length).toBe(6)

    const seasons = world.seasonHistory.map((h) => h.seasonIndex)
    expect(seasons).toEqual([0, 1, 2, 3, 4, 5])
    expect(new Set(seasons).size).toBe(6)

    // ...and no two rows PRINT the same season either – the table has to be readable, not just
    // internally unique. Seasons 4 and 5 are the pair that used to read "2035" twice.
    const printed = world.seasonHistory.map((h) => seasonYear(h.seasonIndex))
    expect(printed).toEqual([2031, 2032, 2033, 2034, 2035, 2036])
    expect(new Set(printed).size).toBe(6)
  })

  it('the wrap-up MILESTONE fires once per season, six distinct texts, six distinct keys', () => {
    const world = run('trio-six-milestones', wrapWeekOf(5))
    const wraps = world.events.filter((e) => e.milestoneKey?.startsWith('season-wrap-'))
    expect(wraps.map((e) => e.milestoneKey)).toEqual([
      'season-wrap-0',
      'season-wrap-1',
      'season-wrap-2',
      'season-wrap-3',
      'season-wrap-4',
      'season-wrap-5',
    ])
    // The key was already the index and was therefore already correct – it is the TEXT that used to
    // announce "Season 2035 wrap-up" two years running while the row behind it was being dropped.
    const named = wraps.map((e) => /Season (\d{4}) wrap-up/.exec(e.text)![1])
    expect(named).toEqual(['2031', '2032', '2033', '2034', '2035', '2036'])
    expect(new Set(named).size).toBe(6)
  })

  it('the popup and the history table name the SAME season', () => {
    const world = run('trio-agree', wrapWeekOf(5))
    const newest = world.seasonHistory[world.seasonHistory.length - 1]
    expect(newest.seasonIndex).toBe(5)
    expect(world.lastSeasonSummary!.seasonYear).toBe(seasonYear(newest.seasonIndex))
    expect(world.lastSeasonSummary!.seasonYear).toBe(2036)
    // and the figures behind the two records are the same season's figures
    expect(newest.points).toBe(world.lastSeasonSummary!.points)
    expect(newest.wins).toBe(world.lastSeasonSummary!.wins)
    expect(newest.losses).toBe(world.lastSeasonSummary!.losses)
  })

  it('is still written ONCE per season – the whole off-season never duplicates a row', () => {
    // The guard has to keep working in the direction it was RIGHT about: re-entering the wrap-up
    // week's branch for a season already banked must stay a no-op.
    const world = run('trio-idempotent', wrapWeekOf(5) + OFF_SEASON_WEEKS)
    expect(world.seasonHistory.map((h) => h.seasonIndex)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('the season 5 row carries real figures – it is a season, not a placeholder', () => {
    const world = run('trio-six-seasons', wrapWeekOf(5))
    const row = world.seasonHistory.find((h) => h.seasonIndex === 5)!
    expect(row.endFundsCents).toBe(world.fundsCents)
    expect(row.endRank).toBe(world.kidRank)
    expect(Number.isFinite(row.points)).toBe(true)
    expect(row.wins + row.losses).toBeGreaterThanOrEqual(0)
    // no strings: the row stays the tiny numeric record R10-9 promised
    expect(Object.values(row).every((v) => typeof v === 'number')).toBe(true)
  })

  it('surfaces the six seasons on the snapshot, oldest first', () => {
    const world = run('trio-six-snapshot', wrapWeekOf(5))
    const snap = toSnapshot(world)
    expect(snap.seasonHistory.map((h) => h.seasonIndex)).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('item 1 — the v16 migration', () => {
  /** A v15-shaped save carrying pre-v16 `year`-keyed history rows. */
  function legacySave(years: number[]): Record<string, unknown> {
    const raw = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v15.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    return {
      ...raw,
      seasonHistory: years.map((year) => ({
        year,
        endRank: 100,
        points: 10,
        wins: 1,
        losses: 2,
        fundsDeltaCents: -100,
        endFundsCents: 500,
      })),
    }
  }

  it('re-keys a legacy year onto the index that WROTE it (exact, not approximate)', () => {
    const migrated = migrateSave(legacySave([2031, 2032, 2033, 2034, 2035]))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.seasonHistory.map((h) => h.seasonIndex)).toEqual([0, 1, 2, 3, 4])
    // 2035 belongs to season FOUR, not five: the buggy writer kept the first season to claim a
    // year and dropped later claimants, so the smallest index yielding a year is its author.
    expect(seasonYear(migrated.seasonHistory[4].seasonIndex)).toBe(2035)
  })

  it('recovers the year the DROP had cost seasons past the collision', () => {
    // A legacy career that ran past season 5: its 2036 row was written by season SIX (season 5's
    // row never existed – that is the bug), so the index must be 6, not 2036 - 2031.
    const migrated = migrateSave(legacySave([2034, 2035, 2036, 2037]))
    expect(migrated.seasonHistory.map((h) => h.seasonIndex)).toEqual([3, 4, 6, 7])
  })

  it('drops the stale key and keeps every figure', () => {
    const migrated = migrateSave(legacySave([2031, 2032]))
    for (const row of migrated.seasonHistory) {
      expect('year' in row).toBe(false)
      expect(row.endRank).toBe(100)
      expect(row.points).toBe(10)
      expect(row.endFundsCents).toBe(500)
    }
  })

  it('is idempotent – re-migrating an already-v16 save changes nothing', () => {
    const once = migrateSave(legacySave([2031, 2032, 2035]))
    const twice = migrateSave(structuredClone(once))
    expect(twice.seasonHistory).toEqual(once.seasonHistory)
  })

  it('a career with no banked seasons migrates to an empty history', () => {
    const migrated = migrateSave(legacySave([]))
    expect(migrated.seasonHistory).toEqual([])
  })
})

// ===========================================================================
// ITEM 2 — the engine's own texts.
// ===========================================================================

const ENGINE_DIR = new URL('../src/engine/', import.meta.url)

/** Every engine source file, recursively. */
function engineFiles(dir = ENGINE_DIR, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = `${prefix}${entry.name}`
    if (entry.isDirectory()) out.push(...engineFiles(new URL(`${entry.name}/`, dir), `${rel}/`))
    else if (entry.name.endsWith('.ts')) out.push(rel)
  }
  return out
}

describe('item 2 — no engine text prints a raw absolute week', () => {
  // tests/week-numbering.test.ts guards the VIEW layer and deliberately skips src/engine (the
  // engine counts absolute weeks and must keep doing so). This is the other half of that guard:
  // the engine may THINK in absolute weeks, but everything it WRITES for a player goes through the
  // one shared formatter.
  const files = engineFiles()

  it('the sweep is complete – `W${...}` survives nowhere under src/engine', () => {
    const offenders = files.filter((f) => /W\$\{/.test(readFileSync(new URL(f, ENGINE_DIR), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('the engine reaches for the SHARED formatter, and does not grow one of its own', () => {
    const world = readFileSync(new URL('world.ts', ENGINE_DIR), 'utf8')
    expect(world).toMatch(/import \{[^}]*\bweekLabel\b[^}]*\} from '\.\.\/shared\/dates'/)
    // The layering allows this: shared/dates.ts imports nothing, so engine -> shared is the same
    // one-way seam world.ts already uses for shared/protocol and shared/format. What must NOT
    // happen is a second formatter appearing inside the engine to avoid the import.
    for (const f of files) {
      expect(readFileSync(new URL(f, ENGINE_DIR), 'utf8'), f).not.toMatch(/function weekLabel\b/)
    }
  })

  it('an entry made in the SECOND season reads "W… \'32", never the absolute index', () => {
    // Deep into season 2, where absolute and in-season week are impossible to confuse.
    const world = run('trio-entry-label', WEEKS_PER_YEAR + 4)
    world.fundsCents = 9_999_999_00
    const target = world.season.find(
      (e) => e.week > world.week && world.week <= e.deadlineWeek && e.tier === 'local',
    )!
    expect(target.week).toBeGreaterThan(WEEKS_PER_YEAR) // an absolute index past 52
    enterEvent(world, target.id)

    const written = world.events.filter((e) => e.week === world.week).map((e) => e.text)
    const fee = written.find((t) => t.startsWith('Entry fee:'))!
    const entered = written.find((t) => t.startsWith('Entered '))!
    for (const text of [fee, entered]) {
      expect(text).toContain(weekLabel(target.week))
      // the raw index must not appear anywhere in the line
      expect(text).not.toContain(`W${target.week}`)
      expect(text).not.toMatch(/W\d{2,} /)
      // player copy: short dash only, no Cyrillic
      expect(text).not.toMatch(/—/)
      expect(text).not.toMatch(/[Ѐ-ӿ]/)
    }
    expect(weekLabel(target.week)).toMatch(/^W\d{1,2} '32$/)
  })

  it('the tournament summary dates the run with the label, not the index', () => {
    const world = playCareer('trio-summary-label', WEEKS_PER_YEAR + 60)
    const summaries = world.events.filter((e) => e.type === 'tournament')
    expect(summaries.length).toBeGreaterThan(0)
    // at least one of them is from the SECOND season, where the two numberings differ
    expect(summaries.some((e) => e.week >= WEEKS_PER_YEAR)).toBe(true)
    for (const e of summaries) {
      expect(e.text).toContain(weekLabel(e.week))
      expect(e.text).not.toMatch(/, W\d+\)/) // "(hard, W57)" is the bug
      expect(e.text).not.toMatch(/—/)
      expect(e.text).not.toMatch(/[\u0400-\u04ff]/)
    }
  })

  it('planner bookings (vacation + practice) label their week too', () => {
    const world = run('trio-planner-label', WEEKS_PER_YEAR + 6)
    world.fundsCents = 9_999_999_00

    /** The next future week that takes a booking of the given kind. */
    function freeWeek(book: (w: number) => void): number {
      for (let w = world.week + 1; w < world.week + 30; w++) {
        try {
          book(w)
          return w
        } catch {
          /* week is blocked (entry / blackout / already booked) – try the next */
        }
      }
      throw new Error('no bookable week')
    }

    const vw = freeWeek((w) => bookVacation(world, w, 'staycation'))
    const pw = freeWeek((w) => bookPractice(world, w, true))
    cancelVacation(world, vw)
    cancelPractice(world, pw)

    const texts = world.events.filter((e) => e.week === world.week).map((e) => e.text)
    const touching = texts.filter((t) => /vacation|practice|rental|Booked:/i.test(t))
    expect(touching.length).toBeGreaterThanOrEqual(4)
    for (const t of touching) {
      expect(t, t).not.toMatch(/\bW\d+\b(?! ')/) // "W74" is the bug; "W22 '32" is the label
      expect(t).not.toMatch(/—/)
      expect(t).not.toMatch(/[Ѐ-ӿ]/)
    }
    expect(texts.some((t) => t.includes(weekLabel(vw)))).toBe(true)
    expect(texts.some((t) => t.includes(weekLabel(pw)))).toBe(true)
  })

  it('a withdrawal and a post-deadline cancellation both label their week', () => {
    const world = run('trio-withdraw-label', WEEKS_PER_YEAR + 3)
    world.fundsCents = 9_999_999_00
    const target = world.season.find(
      (e) => e.week > world.week && world.week <= e.deadlineWeek && e.tier === 'local',
    )!
    enterEvent(world, target.id)
    withdrawEvent(world, target.id)
    const text = world.events.filter((e) => e.text.startsWith('Withdrew from')).pop()!.text
    expect(text).toContain(weekLabel(target.week))
    expect(text).not.toContain(`W${target.week}`)
  })
})

// ===========================================================================
// ITEM 3 — anger on a run of losses.
// ===========================================================================

const kidMatch = (won: boolean) => ({ winnerId: won ? KID_ID : 'ai-1' }) as unknown as WorldMatch

/** A competitive (tournament) match event. */
const played = (id: number, week: number, won: boolean): WorldEvent => ({
  id,
  week,
  type: 'match',
  text: won ? 'beat someone' : 'lost to someone',
  match: kidMatch(won),
})

/** A booked practice friendly – same event shape, `friendly: true`. */
const friendly = (id: number, week: number, won: boolean): WorldEvent => ({
  ...played(id, week, won),
  friendly: true,
})

/** A walkover / medical withdrawal – an `injury` event carrying no match at all. */
const notPlayed = (id: number, week: number): WorldEvent => ({
  id,
  week,
  type: 'injury',
  text: 'Walkover: too injured to play the Local Open – 0 pts, entry fee forfeited.',
})

/** A world with a hand-built event feed – the streak is a pure read over `events`. */
function worldWithEvents(seed: string, events: WorldEvent[]): WorldState {
  const world = createWorld(seed)
  world.events = events
  return world
}

describe('item 3 — the pure decision only COMPARES', () => {
  const base = { week: 10, condition: 80, injured: false }
  const streak = (losses: number, angerAt: number): LossStreak => ({ losses, startWeek: 3, angerAt })

  // ⚠ R12-16 RE-SPECIFIED THIS COMPARISON (owner playtest 27.07: once the streak had crossed, she
  // was angry on every single loss after it – a permanent face, where the design intent was a
  // mood). `>=` became `===`: only the CROSSING loss is angry.
  it('the CROSSING loss is angry – exactly the one that broke her', () => {
    const lastResult = { week: 10, won: false, lostFinal: false, tier: 'national' as const }
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(4, 4) })).toBe('angry')
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(6, 6) })).toBe('angry')
  })

  it('R12-16: every LATER loss in the same streak is sad again – anger is a moment, not a mask', () => {
    const lastResult = { week: 10, won: false, lostFinal: false, tier: 'national' as const }
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(5, 4) })).toBe('sad')
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(7, 5) })).toBe('sad')
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(20, 4) })).toBe('sad')
  })

  it('one short of the threshold is still sad – the run has to be finished, not started', () => {
    const lastResult = { week: 10, won: false, lostFinal: false, tier: 'national' as const }
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(3, 4) })).toBe('sad')
    expect(avatarEmotion({ ...base, lastResult, lossStreak: streak(5, 6) })).toBe('sad')
  })

  it('THE ORDERING: every existing softener still outranks anger', () => {
    const long = streak(9, 4) // far past any threshold
    // R8-6a — runner-up is 2nd place, a GOOD result. Nine losses deep, she is still composed.
    expect(
      avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: true }, lossStreak: long }),
    ).toBe('serious')
    // R9-11a — a Local Open exit is not a tragedy, and it is not an outrage either.
    expect(
      avatarEmotion({
        ...base,
        lastResult: { week: 10, won: false, lostFinal: false, tier: 'local' },
        lossStreak: long,
      }),
    ).toBe('serious')
    // R9-11b — a fresh champion is shielded; the shield covers anger too.
    expect(
      avatarEmotion({
        ...base,
        lastResult: { week: 10, won: false, lostFinal: false, tier: 'national' },
        lastTitle: { tier: 'national', week: 9 },
        lossStreak: long,
      }),
    ).toBe('serious')
  })

  it('a win is happy however long the run WAS – nothing outranks the result that ended it', () => {
    expect(
      avatarEmotion({
        ...base,
        lastResult: { week: 10, won: true, lostFinal: false, tier: 'national' },
        lossStreak: streak(9, 4),
      }),
    ).toBe('happy')
  })

  it('anger decays with the result – a stale loss returns her to the idle ladder', () => {
    // ⚠ RE-AIMED by R14-1: the injured rung of the idle ladder returns `rehab`, not `injury` – the
    // layoff is a state and wears its own painting for its whole length, while `injury` became the
    // face of the moment she went down (the popup's, not this function's). The PROTECTED FACT is
    // untouched and is the whole point of this test: a STALE loss stops driving her face, whatever
    // the streak was, and the idle ladder takes over. Only the name of the injured rung moved.
    const stale = { week: 9, won: false, lostFinal: false, tier: 'national' as const }
    const long = streak(9, 4)
    expect(avatarEmotion({ ...base, lastResult: stale, lossStreak: long })).toBe('norm')
    expect(avatarEmotion({ ...base, condition: 30, lastResult: stale, lossStreak: long })).toBe('tired')
    expect(avatarEmotion({ ...base, injured: true, lastResult: stale, lossStreak: long })).toBe('rehab')
    // and the anger the streak would have caused is gone in every one of those states
    for (const injured of [false, true]) {
      expect(avatarEmotion({ ...base, injured, lastResult: stale, lossStreak: long })).not.toBe('angry')
    }
  })

  it('the threshold band is the owner\'s 4..6', () => {
    expect([ANGER_STREAK_MIN, ANGER_STREAK_MAX]).toEqual([4, 6])
  })
})

describe('item 3 — the engine counts the streak', () => {
  it('counts consecutive competitive losses back from the newest match', () => {
    const world = worldWithEvents('trio-streak-count', [
      played(1, 1, false),
      played(2, 2, false),
      played(3, 3, false),
    ])
    const s = computeLossStreak(world)!
    expect(s.losses).toBe(3)
    expect(s.startWeek).toBe(1)
  })

  it('a WIN breaks it – and it is the only thing that does', () => {
    const world = worldWithEvents('trio-streak-break', [
      played(1, 1, false),
      played(2, 2, false),
      played(3, 3, true), // the win
      played(4, 4, false),
      played(5, 5, false),
    ])
    const s = computeLossStreak(world)!
    expect(s.losses).toBe(2)
    expect(s.startWeek).toBe(4)
  })

  it('is null when her latest competitive match was a win, and before she has played one', () => {
    expect(computeLossStreak(worldWithEvents('a', [played(1, 1, false), played(2, 2, true)]))).toBeNull()
    expect(computeLossStreak(worldWithEvents('b', []))).toBeNull()
    expect(computeLossStreak(worldWithEvents('c', [notPlayed(1, 1)]))).toBeNull()
  })

  it('A FRIENDLY IS INVISIBLE: a practice loss does not extend the run (R11-2)', () => {
    const withFriendly = worldWithEvents('trio-friendly-loss', [
      played(1, 1, false),
      played(2, 2, false),
      friendly(3, 3, false),
    ])
    const s = computeLossStreak(withFriendly)!
    expect(s.losses).toBe(2)
    expect(s.startWeek).toBe(1)
  })

  it('A FRIENDLY IS INVISIBLE: a practice WIN does not launder a run of real defeats', () => {
    // The other direction, and the one that matters more: if a hit-out at the club could clear four
    // tournament losses, the friendly WOULD have moved her face – exactly what R11-2 forbids.
    const world = worldWithEvents('trio-friendly-win', [
      played(1, 1, false),
      played(2, 2, false),
      played(3, 3, false),
      friendly(4, 4, true),
      played(5, 5, false),
    ])
    const s = computeLossStreak(world)!
    expect(s.losses).toBe(4)
    expect(s.startWeek).toBe(1)
  })

  it('A WALKOVER / MEDICAL WITHDRAWAL IS INVISIBLE: it neither counts nor breaks', () => {
    const world = worldWithEvents('trio-walkover', [
      played(1, 1, false),
      played(2, 2, false),
      notPlayed(3, 3), // injured on the play week – she never took the court
      notPlayed(4, 4), // not cleared to play, entry forfeited
      played(5, 5, false),
    ])
    const s = computeLossStreak(world)!
    // 3 real defeats, not 5 (she did not lose those weeks) and not 1 (they did not absolve her).
    expect(s.losses).toBe(3)
    expect(s.startWeek).toBe(1)
  })

  it('the two invisibility rules are the SAME predicate the result walk uses', () => {
    // Not two parallel copies that can drift: R11-2's gate is one exported function, and the
    // engine's walk skips exactly what it rejects.
    expect(resultShowsOnHerFace(played(1, 1, false))).toBe(true)
    expect(resultShowsOnHerFace(friendly(2, 2, false))).toBe(false)
    expect(resultShowsOnHerFace(notPlayed(3, 3))).toBe(false)
    const src = worldSource()
    const walk = src.slice(src.indexOf('export function computeLossStreak'))
    expect(walk.slice(0, 600)).toContain('resultShowsOnHerFace(e)')
  })

  it('spans seasons – New Year is not something that happens to her', () => {
    const world = worldWithEvents('trio-cross-season', [
      played(1, WEEKS_PER_YEAR - 2, false),
      played(2, WEEKS_PER_YEAR - 1, false),
      played(3, WEEKS_PER_YEAR + 1, false),
      played(4, WEEKS_PER_YEAR + 2, false),
    ])
    const s = computeLossStreak(world)!
    expect(s.losses).toBe(4)
    expect(seasonIndexOf(s.startWeek)).toBe(0)
  })
})

describe('item 3 — the threshold is drawn once, off a purpose-scoped sub-stream', () => {
  it('lands inside 4..6 for every streak start a career can reach', () => {
    for (const seed of ['trio-a', 'trio-b', 'trio-c']) {
      for (let w = 0; w < 260; w++) {
        const s = computeLossStreak(worldWithEvents(seed, [played(1, w, false)]))!
        expect(s.angerAt).toBeGreaterThanOrEqual(ANGER_STREAK_MIN)
        expect(s.angerAt).toBeLessThanOrEqual(ANGER_STREAK_MAX)
      }
    }
  })

  it('IS STABLE ACROSS THE STREAK – it cannot flip her between sad and angry on one screen', () => {
    // The same streak, observed at every length it passes through. If the draw were keyed on
    // anything that moves (the length, the newest week, the render), this would wobble.
    const events: WorldEvent[] = []
    const seen = new Set<number>()
    for (let i = 0; i < 8; i++) {
      events.push(played(i + 1, 5 + i, false))
      const s = computeLossStreak(worldWithEvents('trio-stable', [...events]))!
      expect(s.startWeek).toBe(5)
      expect(s.losses).toBe(i + 1)
      seen.add(s.angerAt)
    }
    expect(seen.size).toBe(1) // ONE threshold for the whole run
  })

  it('a NEW streak draws a new threshold – the player cannot count to a fixed number', () => {
    const values = new Set<number>()
    for (let w = 0; w < 300; w++) {
      values.add(computeLossStreak(worldWithEvents('trio-spread', [played(1, w, false)]))!.angerAt)
    }
    expect([...values].sort()).toEqual([4, 5, 6]) // all three lengths really occur
  })

  it('the key is the STREAK START, and the sub-stream is scoped to it', () => {
    const src = worldSource()
    expect(src).toContain(':angry:${startWeek}')
    // it is a sub-stream, exactly like `:injury:<week>` and `:aitour:<eventId>`
    expect(src).toMatch(/rngFromSeed\(`\$\{world\.seed\}:angry:\$\{startWeek\}`\)/)
    // ...and it is NOT taken from the weekly stream: computeLossStreak accepts no Rng at all.
    const fn = src.slice(src.indexOf('export function computeLossStreak'))
    expect(fn.slice(0, 120)).not.toContain('rng:')
  })

  it('two careers with different seeds disagree about the same streak', () => {
    const events = [played(1, 7, false)]
    const a = computeLossStreak(worldWithEvents('trio-seed-a', events))!
    const b = computeLossStreak(worldWithEvents('trio-seed-b', events))!
    expect(a.startWeek).toBe(b.startWeek)
    // (not a guarantee for every pair – these two seeds are chosen because they differ)
    expect(a.angerAt === b.angerAt && a.angerAt === 4).toBe(false)
  })
})

describe('item 3 — the snapshot carries it, and the MAIN stream never sees it', () => {
  it('the streak reaches the UI on the snapshot', () => {
    const world = worldWithEvents('trio-snapshot', [played(1, 1, false), played(2, 2, false)])
    const snap = toSnapshot(world)
    expect(snap.lossStreak).toEqual(computeLossStreak(world))
    expect(snap.lossStreak!.losses).toBe(2)
  })

  it('is null on a snapshot of a career that has not lost its latest match', () => {
    expect(toSnapshot(worldWithEvents('trio-snap-null', [played(1, 1, true)])).lossStreak).toBeNull()
  })

  it('THE FROZEN CAPTURE CANNOT MOVE: snapshotting every week draws nothing on the MAIN stream', () => {
    // The invariance test's own shape (tests/condition.test.ts B1), reduced to the one claim this
    // item has to make: taking a snapshot – which is what computes the streak and draws the
    // threshold – consumes ZERO draws from the weekly stream.
    function record(snapshotEveryWeek: boolean): number[] {
      const world = createWorld('bench-working-0')
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        if (snapshotEveryWeek) toSnapshot(world)
      }
      return draws
    }
    const without = record(false)
    const with_ = record(true)
    expect(with_.length).toBe(without.length)
    expect(with_).toEqual(without)
    // ⚠ v35: the frozen-count echo (41550) left this line — one documented pin lives in
    // condition.test.ts B1 and drifts are loud THERE; a second copy here was the old regime's
    // re-pin tax in miniature. Non-vacuity is all this arm still owes.
    expect(without.length).toBeGreaterThan(0)
  })
})

describe('item 3 — end to end on a real career', () => {
  it('a real losing run produces a real threshold, and the face follows it', () => {
    // Walk a career until she is genuinely on a run of losses, then check the whole chain:
    // engine streak -> snapshot -> pure decision.
    let observed: LossStreak | null = null
    // ⚠ THE SEED MOVED 05.08 (fix/outgrown-entry) AND THE RULE DID NOT – which is exactly what this
    // fixture's own message asks for ("tune the fixture, not the rule"). Honouring a committed entry
    // at an outgrown rung means she now PLAYS a handful of draws this career used to be withdrawn
    // from, so `trio-e2e` walks a different set of matches and its crossing loss fell outside five
    // seasons. Every assertion below is unchanged; only the career that reaches them is. Verified
    // against the pre-change tree, where this file is green with the old seed and green with this
    // one is what the new tree needs.
    const world = playCareer('trio-e2e-honoured', 5 * WEEKS_PER_YEAR, (w) => {
      const s = computeLossStreak(w)
      // R12-16: stop on the CROSSING loss (`===`), not merely at-or-past it – past it her face is
      // `sad` again by design, so a `>=` walk could land on a week the assertion below would fail
      // on for the right reason.
      if (s && s.losses === s.angerAt) {
        observed = s
        return true
      }
      return false
    })
    expect(observed, 'no losing run of 4+ in 5 seasons – tune the fixture, not the rule').not.toBeNull()
    expect(observed!.angerAt).toBeGreaterThanOrEqual(ANGER_STREAK_MIN)
    expect(observed!.angerAt).toBeLessThanOrEqual(ANGER_STREAK_MAX)

    const snap = toSnapshot(world)
    expect(snap.lossStreak).toEqual(observed)
    // The decision the Kid screen makes with exactly this snapshot, for the loss that just landed.
    expect(
      avatarEmotion({
        week: snap.week,
        condition: snap.condition,
        injured: !!snap.injury,
        lastResult: { week: snap.week, won: false, lostFinal: false, tier: 'national' },
        lossStreak: snap.lossStreak,
      }),
    ).toBe('angry')
  })
})
