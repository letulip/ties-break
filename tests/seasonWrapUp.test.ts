import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  revealTournamentRound,
  skipTournament,
  toSnapshot,
  flipScore,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { isOffSeasonWeek } from '../src/engine/season/calendar'

function run(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    // A tournament reveal pauses the world; resolve it immediately so time keeps moving.
    if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
  }
  return world
}

describe('off-season (Round 5 items 16/21)', () => {
  it('never schedules an event in an off-season week, across several years', () => {
    const world = run('off-season-calendar', 300)
    for (const e of world.season) expect(isOffSeasonWeek(e.week)).toBe(false)
  })

  it('fires the year-0 wrap-up milestone the moment the world ticks into week 49', () => {
    const world = createWorld('wrap-up-timing')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 48; i++) tickWeek(world, rng)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-0')).toBe(false)
    tickWeek(world, rng) // week 49
    expect(world.week).toBe(49)
    const wrap = world.events.find((e) => e.milestoneKey === 'season-wrap-0')
    expect(wrap).toBeTruthy()
    expect(wrap!.keep).toBe(true)
    expect(wrap!.text).toContain('Season 2031 wrap-up')
    expect(wrap!.text).toMatch(/rank #\d+/)
    expect(wrap!.text).toMatch(/\d+ pts this season/)
    expect(wrap!.text).toMatch(/\d+-\d+ \(W-L\)/)
    expect(wrap!.text).toMatch(/funds [+-]\$/)
    // the companion off-season flavor line lands the same week
    expect(world.events.some((e) => e.week === 49 && e.type === 'info' && e.text.includes('Off-season'))).toBe(true)
  })

  it('never fires the same year wrap-up twice, even ticking through the whole off-season', () => {
    const world = run('wrap-up-once', 60)
    const wraps = world.events.filter((e) => e.milestoneKey === 'season-wrap-0')
    expect(wraps.length).toBe(1)
  })

  it('fires a second wrap-up (season-wrap-1) at week 101 (49 + 52)', () => {
    const world = run('wrap-up-year1', 102)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-0')).toBe(true)
    expect(world.events.some((e) => e.milestoneKey === 'season-wrap-1')).toBe(true)
  })
})

describe('new-tournament calendar marker (Round 5 item 23)', () => {
  it('does not fire on a brand-new career (nothing "new" to a career that has never played)', () => {
    const world = createWorld('fresh-calendar')
    expect(world.events.some((e) => e.type === 'info' && e.text === 'New events on the calendar')).toBe(false)
  })

  it('fires once ongoing play generates a fresh calendar block', () => {
    const world = run('rolling-calendar', 60)
    expect(world.events.some((e) => e.type === 'info' && e.text === 'New events on the calendar')).toBe(true)
  })
})

describe('full bracket view (Round 5 item 5)', () => {
  function buildToPending(seed: string): WorldState {
    const world = createWorld(seed)
    const rng = rngFromSeed(seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEvent(world, event.id)
    while (world.week < event.week) tickWeek(world, rng)
    return world
  }

  it('is empty before any round is revealed', () => {
    const world = buildToPending('full-bracket-empty')
    const pending = toSnapshot(world).pending!
    expect(pending.fullBracket).toEqual([])
  })

  it('grows round by round and includes non-kid matches with resolved names', () => {
    const world = buildToPending('full-bracket-grow')
    revealTournamentRound(world)
    const pending = toSnapshot(world).pending!
    expect(pending.fullBracket.length).toBeGreaterThan(0)
    // every match in the revealed round(s) is present, not just the kid's
    expect(pending.fullBracket.every((m) => m.round <= 0)).toBe(true)
    for (const m of pending.fullBracket) {
      expect(m.aName.length).toBeGreaterThan(0)
      expect(m.bName.length).toBeGreaterThan(0)
      expect([m.aId, m.bId]).toContain(m.winnerId)
    }
    // the kid's own round-0 match is among them
    expect(pending.fullBracket.some((m) => m.aId === KID_ID || m.bId === KID_ID)).toBe(true)
  })

  it('normalises score to the WINNER\'s perspective regardless of which side (a/b) won', () => {
    // Regression: a kid match where the kid sits on side B used to flip the score to her
    // perspective while leaving the display order as a-then-b, so a losing side A read as
    // if it had won. `score` must always match the RAW MatchRecord flipped iff B won –
    // i.e. describe the winner's games first, no matter which side actually won.
    let sawKidOnB = false
    for (let i = 0; i < 20 && !sawKidOnB; i++) {
      const world = buildToPending(`score-orientation-${i}`)
      skipTournament(world)
      const raw = world.pendingTournament!.result.matches
      const pending = toSnapshot(world).pending!
      for (const m of pending.fullBracket) {
        const record = raw.find((r) => r.round === m.round && r.aId === m.aId && r.bId === m.bId)!
        if (!record.score) continue
        const expected = record.winnerId === record.bId ? flipScore(record.score) : record.score
        expect(m.score).toBe(expected)
        if (record.bId === KID_ID) sawKidOnB = true
      }
    }
    // Sanity: the loop actually exercised a kid-on-side-B match at least once across seeds.
    expect(sawKidOnB).toBe(true)
  })

  it('never exceeds the highest revealed round, and covers everything once finished', () => {
    const world = buildToPending('full-bracket-finish')
    skipTournament(world)
    const pending = toSnapshot(world).pending!
    const kidRounds = new Set(
      world.pendingTournament!.result.matches
        .filter((m) => m.aId === KID_ID || m.bId === KID_ID)
        .map((m) => m.round),
    )
    const maxRound = Math.max(...kidRounds)
    expect(pending.fullBracket.every((m) => m.round <= maxRound)).toBe(true)
    // total matches shown = every match up to and including the kid's last round
    const expectedCount = world.pendingTournament!.result.matches.filter((m) => m.round <= maxRound).length
    expect(pending.fullBracket.length).toBe(expectedCount)
  })
})
