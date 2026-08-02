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
import { TIERS, hasAcceptanceList } from '../src/engine/season/calendar'

// Build a world paused on the kid's entered tournament (pendingTournament set, not yet revealed).
function buildToPending(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  // ⚠ AND IT MUST BE A POINTS-BANDED DOMESTIC RUNG (task #17). The grant below is a one-marker
  // trick that speaks only one of the three languages the entry gate now speaks: it opens a POINTS
  // BAND. It says nothing to an acceptance list (J60/J300, W35/W100 read a RANK), nothing to an
  // on-ramp reading the table beneath it (J30 reads domestic, W15 reads ITF junior), and nothing at
  // all to an age gate - and she is fourteen here. That was always true; it survived on the calendar
  // happening to put a domestic event first, and adding a third family moved which event that is.
  // This case is about the reveal flow, so the fixture states the rung it can set up rather than
  // relying on an ordering it does not control.
  const event = world.season.find(
    (e) =>
      e.week >= 5 &&
      e.deadlineWeek >= world.week &&
      TIERS[e.tier].track === 'domestic' &&
      !hasAcceptanceList(e.tier),
  )!
  // r-gate (season-life-01b): points-based eligibility. Grant the kid a throwaway result worth the
  // tier's minPoints ONLY for the enterEvent gate check, then drop it before any tick so nothing
  // downstream shifts (local's min is 0, needing no grant).
  const min = TIERS[event.tier].enterPointBand[0]
  const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
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

    // finalize side effects: exactly one summary, no summary before finalize.
    const summaries = world.events.filter((e) => e.type === 'tournament' && e.week === eventWeek)
    expect(summaries.length).toBe(1)

    // ⚠ RE-PINNED by wave B "first-round loss pays ZERO" (tune/first-round-zero). This used to
    // assert a result row unconditionally. Since a first-round exit now banks nothing and
    // finalizeTournament only pushes a row when `points > 0`, "she played" and "she scored" have
    // come apart. Assert the RULE rather than one seed's luck: the row exists exactly when she won
    // at least one match. That is a strictly stronger check than the old unconditional one, and it
    // holds whichever way this seed's bracket falls.
    const kidWon = world.pendingTournament!.result.matches.some(
      (m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID,
    )
    const banked = world.results.some((r) => r.playerId === KID_ID && r.week === eventWeek)
    expect(banked).toBe(kidWon)
    // ...while the summary event fires either way – the week is always on the record.
    const playedEvent = world.season.find((e) => e.id === world.pendingTournament!.eventId)!
    expect(summaries[0].text).toContain(TIERS[playedEvent.tier].label)
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
    // ⚠ SEED-WALKED by the random-draw change (28.07). The precondition below is that she exits
    // EARLY, which used to be reliable on any seed - she met the top seed in round one, every time.
    // Now the draw is random and 'probe-2' happens to send her to the final, which makes the
    // precondition false. Which seed loses is not the subject; that the FULL bracket keeps running
    // past her exit is.
    let world!: WorldState
    let finalRound = 0
    for (let i = 0; i < 30; i++) {
      const w = buildToPending(`probe-2-${i}`)
      const e = w.season.find((x) => x.id === w.pendingTournament!.eventId)!
      const fr = Math.log2(TIERS[e.tier].drawSize) - 1

      const finish = w.pendingTournament!.result.finishes[KID_ID]
      // ⚠ RE-AIMED 29.07 (partial seeding): `finish === 0` excluded only the CHAMPION, but a
      // RUNNER-UP also plays every round, so there are no "rounds after her exit" to find and the
      // precondition below fails. She is drawn by her standing now and reaches finals she used to
      // miss, which is how this surfaced. The protected fact is unchanged: a full bracket must span
      // rounds she was not in.
      if (finish === undefined || finish <= 1) continue // champion or runner-up – no early exit
      world = w
      finalRound = fr
      break
    }
    expect(world, 'no seed in 30 gave her an early exit').toBeTruthy()

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
