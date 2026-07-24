import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  withdrawEvent,
  skipTournament,
  toSnapshot,
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

  it('a fresh career has no already-closed event at week 0 (round-5 item 2)', () => {
    for (const seed of ['fresh-a', 'fresh-b', 'fresh-c']) {
      const world = createWorld(seed)
      expect(world.week).toBe(0)
      for (const e of world.season) {
        expect(e.deadlineWeek).toBeGreaterThanOrEqual(1)
        expect(world.week).toBeLessThanOrEqual(e.deadlineWeek) // still enterable at start
      }
    }
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

  it('reports the tournament champion in the news when the kid did not win it', () => {
    // Over several seeds the kid rarely wins her first event; find one she didn't, and assert
    // a "won the ... " news line naming someone else appears that week.
    let checked = 0
    for (const seed of ['champ-a', 'champ-b', 'champ-c', 'champ-d', 'champ-e']) {
      const world = createWorld(seed)
      const rng = rngFromSeed(world.seed)
      const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
      enterEvent(world, event.id)
      while (world.week < event.week) tickWeek(world, rng)
      skipTournament(world)
      const kidWonIt = world.pendingTournament!.result.finishes[KID_ID] === 0
      const championLine = world.events.find((e) => e.week === event.week && / won the /.test(e.text))
      if (kidWonIt) {
        expect(championLine).toBeUndefined() // her own title is celebrated by the summary/milestone
      } else {
        expect(championLine).toBeTruthy()
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('class-flavored expenses (round-5 item 10)', () => {
  it('working swaps the video-session line for a public-courts clinic', () => {
    const world = createWorld('flavor-working', { ...DEFAULT_PROFILE, background: 'working' })
    world.plan = { train: 85, rest: 15 } // train-heavy → train flavor list
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 200; i++) tickWeek(world, rng)
    const flavors = world.events.filter((e) => e.type === 'expense').map((e) => e.text)
    expect(flavors).not.toContain('Video session: studying her last matches')
    expect(flavors).toContain('Group clinic at the public courts')
  })

  it('wealthy adds premium recovery lines to the rest pool', () => {
    const world = createWorld('flavor-wealthy', { ...DEFAULT_PROFILE, background: 'wealthy' })
    world.plan = { train: 60, rest: 40 } // rest-heavy → rest flavor list
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 300; i++) tickWeek(world, rng)
    const flavors = new Set(world.events.filter((e) => e.type === 'expense').map((e) => e.text))
    expect(flavors.has('Physio session') || flavors.has('Massage & recovery')).toBe(true)
  })

  it('scales the base expense by background (working < middle < wealthy) for the same draw', () => {
    const baseCost = (background: 'working' | 'middle' | 'wealthy') => {
      const w = createWorld('bg-cost', { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(w.seed)
      tickWeek(w, rng)
      // no entries → the only week-1 expense event is the base cost
      const ev = w.events.find((e) => e.type === 'expense' && e.week === 1)!
      return -ev.amountCents!
    }
    expect(baseCost('working')).toBeLessThan(baseCost('middle'))
    expect(baseCost('middle')).toBeLessThan(baseCost('wealthy'))
  })

  it('cohort drift + AI results are identical across backgrounds (RNG discipline extended)', () => {
    const run = (background: 'working' | 'wealthy') => {
      const w = createWorld('bg-discipline', { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 60; i++) tickWeek(w, rng)
      return w
    }
    const working = run('working')
    const wealthy = run('wealthy')
    // Background only changes funds/flavor text – never the main-stream draw sequence.
    expect(working.cohort).toEqual(wealthy.cohort)
    expect(working.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      wealthy.results.filter((r) => r.playerId !== KID_ID),
    )
  })
})

describe('kid counting-results transparency (round-5 item 1b)', () => {
  it('exposes the best-6 counted results whose points sum equals the standings points', () => {
    const world = createWorld('counting')
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEvent(world, event.id)
    while (world.week < event.week) tickWeek(world, rng)
    skipTournament(world)
    const snap = toSnapshot(world)
    expect(snap.countingResults.length).toBeGreaterThanOrEqual(1)
    // each counted kid result carries the tier it was earned at (new r5 field)
    expect(snap.countingResults.every((c) => typeof c.tier === 'string')).toBe(true)
    // the list sum equals the kid's standings points (the whole point of the transparency)
    const kidStanding = snap.standings.find((row) => row.isKid)!
    const sum = snap.countingResults.reduce((s, c) => s + c.points, 0)
    expect(sum).toBe(kidStanding.points)
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
