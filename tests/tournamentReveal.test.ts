import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  revealTournamentRound,
  skipTournament,
  closeTournament,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { TIERS } from '../src/engine/season/calendar'

// Build a world paused on the kid's entered tournament (pendingTournament set, not yet revealed).
function buildToPending(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
  // r-gate (season-life-01): a fresh kid ranks #1 (field tied at 0 pts) → eligible for national only.
  // Enter at a rank inside the event's band, then restore the real rank so nothing downstream shifts.
  const savedRank = world.kidRank
  world.kidRank = TIERS[event.tier].enterRankBand[0]
  enterEvent(world, event.id)
  world.kidRank = savedRank
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.week).toBe(event.week)
  expect(world.pendingTournament).toBeTruthy()
  expect(world.pendingTournament!.finished).toBe(false)
  return world
}

describe('tournament reveal – reveal, do not re-run', () => {
  it('reveal round-by-round lands on the exact same world as skip all-at-once', () => {
    const base = buildToPending('reveal-det')
    const a = structuredClone(base)
    const b = structuredClone(base)

    // reveal one round at a time until the run finalizes
    let guard = 0
    while (a.pendingTournament && !a.pendingTournament.finished && guard++ < 30) {
      revealTournamentRound(a)
    }
    // resolve everything at once
    skipTournament(b)

    expect(a.pendingTournament!.finished).toBe(true)
    expect(b.pendingTournament!.finished).toBe(true)
    // Byte-identical: same events (ids + order), results, rank, and pending state.
    expect(a).toEqual(b)

    // and after closing, both are clean, resolved, identical worlds
    closeTournament(a)
    closeTournament(b)
    expect(a.pendingTournament).toBeNull()
    expect(a).toEqual(b)
  })

  it('emits one match event per revealed round, then the summary + points on finalize', () => {
    const world = buildToPending('reveal-events')
    const eventWeek = world.week
    const kidMatchCount = world.pendingTournament!.result.matches.filter(
      (m) => m.aId === KID_ID || m.bId === KID_ID,
    ).length

    let matches = 0
    while (world.pendingTournament && !world.pendingTournament.finished) {
      revealTournamentRound(world)
      matches++
      const emitted = world.events.filter((e) => e.type === 'match' && e.week === eventWeek).length
      expect(emitted).toBe(matches)
    }
    expect(matches).toBe(kidMatchCount)

    // finalize side effects: exactly one summary, kid points recorded, no summary before finalize
    const summaries = world.events.filter((e) => e.type === 'tournament' && e.week === eventWeek)
    expect(summaries.length).toBe(1)
    expect(world.results.some((r) => r.playerId === KID_ID && r.week === eventWeek)).toBe(true)
  })

  it('revealed match records reproduce via simulateMatch (already committed, never re-decided)', () => {
    const world = buildToPending('reveal-replay')
    skipTournament(world)
    const kidMatches = world.events.filter((e) => e.type === 'match' && e.match)
    expect(kidMatches.length).toBeGreaterThanOrEqual(1)
    for (const ev of kidMatches) {
      const m = ev.match!
      const replay = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      const winnerId = replay.winner === 0 ? m.aId : m.bId
      expect(winnerId).toBe(m.winnerId)
      expect(replay.sets.map((s) => `${s.a}-${s.b}`).join(' ')).toBe(m.score)
    }
  })

  it('the snapshot exposes a reveal view that fills in as rounds are revealed', () => {
    const world = buildToPending('reveal-view')
    const pre = toSnapshot(world).pending!
    expect(pre).toBeTruthy()
    expect(pre.finished).toBe(false)
    expect(pre.bracket.length).toBe(0)
    expect(pre.kidMatch).toBeTruthy() // a record to watch this round
    expect(pre.opponent.name.length).toBeGreaterThan(0)

    revealTournamentRound(world)
    const mid = toSnapshot(world).pending!
    expect(mid.bracket.length).toBe(1) // the first round now shows on the path strip

    skipTournament(world)
    const done = toSnapshot(world).pending!
    expect(done.finished).toBe(true)
    expect(done.bracket.length).toBeGreaterThanOrEqual(1)
    expect(done.tierLabel.length).toBeGreaterThan(0)
    // champion iff finish index 0
    expect(typeof done.kidChampion).toBe('boolean')
  })

  // Round-7 (spectate): once the kid's run is FINISHED the full bracket is no longer capped at
  // her played rounds – it exposes every round through the Final (no spoilers left), so the flow
  // can spectate the tournament past her exit. `probe-2` is a draw of 8 in which the kid loses
  // her opening match, leaving the whole draw (SF, Final) to unfold without her.
  it('once finished, fullBracket spans every round through the Final, incl. non-kid later rounds', () => {
    const world = buildToPending('probe-2')
    const event = world.season.find((e) => e.id === world.pendingTournament!.eventId)!
    const drawSize = TIERS[event.tier].drawSize
    const finalRound = Math.log2(drawSize) - 1

    skipTournament(world)
    const view = toSnapshot(world).pending!
    expect(view.finished).toBe(true)

    // precondition: the kid really did exit early (played fewer rounds than the whole draw has)
    const kidRounds = view.bracket.length
    expect(kidRounds).toBeGreaterThanOrEqual(1)
    expect(kidRounds).toBeLessThan(finalRound + 1)
    expect(view.kidChampion).toBe(false)

    // the full bracket now reaches the Final round index...
    const rounds = view.fullBracket.map((m) => m.round)
    expect(Math.max(...rounds)).toBe(finalRound)

    // ...and the rounds AFTER her exit are present and contain no kid match
    const laterMatches = view.fullBracket.filter((m) => m.round >= kidRounds)
    expect(laterMatches.length).toBeGreaterThan(0)
    expect(laterMatches.every((m) => m.aId !== KID_ID && m.bId !== KID_ID)).toBe(true)

    // the Final match (kid absent) determines the tournament champion
    const finalMatch = view.fullBracket.find((m) => m.round === finalRound)!
    expect(finalMatch.aId !== KID_ID && finalMatch.bId !== KID_ID).toBe(true)
    expect([finalMatch.aId, finalMatch.bId]).toContain(finalMatch.winnerId)
  })

  it('a paused reveal survives a structured-clone round-trip (schema v8 persistence)', () => {
    const world = buildToPending('reveal-persist')
    const restored = structuredClone(world)
    expect(restored.pendingTournament).toBeTruthy()
    skipTournament(restored)
    expect(restored.pendingTournament!.finished).toBe(true)
    expect(restored.events.some((e) => e.type === 'tournament' && e.week === restored.week)).toBe(true)
  })
})
