import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  withdrawEvent,
  skipTournament,
  KID_ID,
  PARENT_INCOME_CENTS,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { simulateMatch } from '../src/engine/match/engine'

// The earliest event whose entry deadline has not yet passed.
function firstEnterable(world: WorldState) {
  return world.season.find((e) => e.deadlineWeek >= world.week)!
}

describe('entry validation', () => {
  it('charges the fee on enter and refunds it on withdraw, with News + ledger events', () => {
    const world = createWorld('entry')
    const event = firstEnterable(world)
    const fee = TIERS[event.tier].entryFeeCents
    const before = world.fundsCents

    enterEvent(world, event.id)
    expect(world.entries).toContain(event.id)
    expect(world.fundsCents).toBe(before - fee)
    // an expense (ledger) event and an entry (News) event are both emitted
    expect(world.events.some((e) => e.type === 'expense' && e.amountCents === -fee)).toBe(true)
    expect(world.events.some((e) => e.type === 'entry')).toBe(true)

    withdrawEvent(world, event.id)
    expect(world.entries).not.toContain(event.id)
    expect(world.fundsCents).toBe(before)
    expect(world.events.some((e) => e.type === 'income' && e.amountCents === fee)).toBe(true)
  })

  it('rejects a duplicate entry', () => {
    const world = createWorld('dup')
    const event = firstEnterable(world)
    enterEvent(world, event.id)
    expect(() => enterEvent(world, event.id)).toThrow(/already/i)
  })

  it('rejects entry once the deadline has passed', () => {
    const world = createWorld('late')
    const rng = rngFromSeed(world.seed)
    // an event a few weeks out; walk to the week AFTER its deadline but BEFORE the event
    const event = world.season.find((e) => e.week >= 5)!
    while (world.week < event.week - 1) tickWeek(world, rng)
    expect(world.week).toBeGreaterThan(event.deadlineWeek)
    expect(world.week).toBeLessThan(event.week)
    expect(() => enterEvent(world, event.id)).toThrow(/deadline/i)
  })

  it('rejects entry when funds are short', () => {
    const world = createWorld('broke')
    world.fundsCents = 10 // 10 cents — below any tier's entry fee
    const event = firstEnterable(world)
    expect(() => enterEvent(world, event.id)).toThrow(/funds/i)
  })
})

describe('weekly parent income', () => {
  it('emits an income event BEFORE costs each week, sized by family background', () => {
    for (const background of ['wealthy', 'middle', 'working'] as const) {
      const world = createWorld(`inc-${background}`, { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(world.seed)
      const fundsBefore = world.fundsCents
      tickWeek(world, rng)
      const weekEvents = world.events.filter((e) => e.week === world.week).sort((a, b) => a.id - b.id)
      // the parent contribution is the very first event of the week (before the base-cost expense)
      expect(weekEvents[0].type).toBe('income')
      expect(weekEvents[0].text).toContain("Parents' contribution")
      expect(weekEvents[0].amountCents).toBe(PARENT_INCOME_CENTS[background])
      // funds moved by exactly income minus the week's net spend (income is added to funds)
      const netDelta = world.fundsCents - fundsBefore
      const totalSigned = weekEvents.reduce((s, e) => s + (e.amountCents ?? 0), 0)
      expect(netDelta).toBe(totalSigned)
    }
  })
})

describe('news match texts use short names for everyone', () => {
  it('renders the kid as "V. Last" and the opponent as "X. Last"', () => {
    const world = createWorld('short-names') // default profile: Vera Martin
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEvent(world, event.id)
    while (world.week < event.week) tickWeek(world, rng)
    // The tournament week pauses into a reveal; resolve it so the match events are emitted.
    expect(world.pendingTournament).toBeTruthy()
    skipTournament(world)
    const matchEv = world.events.find((e) => e.type === 'match' && e.week === event.week)!
    expect(matchEv.text).toContain('V. Martin')
    // opponent side also short-formed: an initial, a dot, a space, then a surname
    expect(matchEv.text).toMatch(/[A-Z]\. [A-Z][a-z]+/)
  })
})

describe('a tournament week the kid entered', () => {
  it('emits travel, per-round match and one tournament event, and awards ranking points', () => {
    const world = createWorld('tourney-week')
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEvent(world, event.id)

    while (world.week < event.week) tickWeek(world, rng)
    expect(world.week).toBe(event.week)

    // travel is charged during the tick; the rest of the run is deferred to the reveal flow.
    expect(
      world.events.some((e) => e.type === 'expense' && e.week === event.week && e.text.includes('Travel')),
    ).toBe(true)
    expect(world.pendingTournament).toBeTruthy()
    // Resolve the whole run at once (the "skip tournament" path) and check the committed outcome.
    skipTournament(world)
    expect(world.pendingTournament!.finished).toBe(true)

    // one tournament summary event
    const summaries = world.events.filter((e) => e.type === 'tournament' && e.week === event.week)
    expect(summaries.length).toBe(1)

    // per-round kid match events, each replayable from its stored seed + skill snapshots
    const kidMatches = world.events.filter((e) => e.type === 'match' && e.week === event.week)
    expect(kidMatches.length).toBeGreaterThanOrEqual(1)
    for (const ev of kidMatches) {
      const m = ev.match!
      expect(m).toBeTruthy()
      expect(m.seed).toBeTruthy()
      expect([m.aId, m.bId]).toContain(KID_ID)
      const replay = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      const winnerId = replay.winner === 0 ? m.aId : m.bId
      expect(winnerId).toBe(m.winnerId)
      expect(replay.sets.map((s) => `${s.a}-${s.b}`).join(' ')).toBe(m.score)
    }

    // the kid scored ranking points (every finish in these tiers is worth > 0)
    expect(world.results.some((r) => r.playerId === KID_ID && r.week === event.week)).toBe(true)
    // and AI results for the same event landed too (the canonical field always plays)
    expect(world.results.some((r) => r.playerId !== KID_ID && r.week === event.week)).toBe(true)
  })
})

describe('advance stop reasons', () => {
  it('stops on the entered tournament week (stopReason: tournament)', () => {
    const world = createWorld('adv-tournament')
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEvent(world, event.id)
    // fast-forward to the week just before the event, so advance hits it on the first tick
    while (world.week < event.week - 1) tickWeek(world, rng)
    expect(world.week).toBe(event.week - 1)

    const stop = advanceWeeks(world, rng, 4)
    expect(world.week).toBe(event.week)
    expect(stop).toBe('tournament')
  })

  it('stops before an imminent affordable regional+ deadline (stopReason: deadline)', () => {
    const world = createWorld('adv-deadline')
    const rng = rngFromSeed(world.seed)
    // ample funds, no entries -> the only early stop available is a deadline warning
    const stop = advanceWeeks(world, rng, 20)
    expect(stop).toBe('deadline')
    expect(world.week).toBeLessThan(20)
    const soon = world.season.some(
      (e) =>
        (e.tier === 'regional' || e.tier === 'national') &&
        !world.entries.includes(e.id) &&
        world.fundsCents >= TIERS[e.tier].entryFeeCents &&
        (e.deadlineWeek === world.week || e.deadlineWeek === world.week + 1),
    )
    expect(soon).toBe(true)
  })

  it('stops when funds are below zero (stopReason: funds)', () => {
    const world = createWorld('adv-funds')
    const rng = rngFromSeed(world.seed)
    // start deep in debt: no single sponsor gift can lift funds back to >= 0 in one tick
    world.fundsCents = -50_000_00
    const stop = advanceWeeks(world, rng, 4)
    expect(world.fundsCents).toBeLessThan(0)
    expect(stop).toBe('funds')
  })
})
