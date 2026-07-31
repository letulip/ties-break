// THE TITLES LEDGER (schema v31) – the persisted fact behind the Trophy Cabinet.
//
// Two things in this slice can go wrong silently and neither would fail any other suite, which is
// why they get a file of their own:
//
//   1. `finals` MEANING DRIFTING BACK INTO "reached a final". The game already has that sense –
//      `MilestoneType: 'final'` is captured on `kidFinish <= 1`, so a title captures it too – and it
//      sits nine lines away from this ledger's write in the same function. If the two ever agree,
//      the silver plate lights up the first time she WINS something and its count claims finals she
//      never lost. Nothing else in the app would notice.
//
//   2. THE YEAR COLLIDING. A season is 364 days, so `weekYear` repeats at season 5 and two
//      consecutive seasons of trophies merge into one group under a year that never held them.
//      That has already happened once, to the Stats history table (the v16 migration).
//
// Everything here reads a LIVE career rather than a hand-built world where possible: the ledger's
// invariants are claims about what `finalizeTournament` does, not about what a fixture says.
import { describe, it, expect } from 'vitest'
import {
  advanceWeeks,
  closeTournament,
  createWorld,
  emptyTrophyLedger,
  enterEvent,
  availabilityStatus,
  skipTournament,
  toSnapshot,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { seasonYear, weekYear, WEEKS_IN_SEASON } from '../src/shared/dates'
import type { TierId } from '../src/engine/season/types'

/** A real career, played the way a player plays one: enter what she can, resolve every draw. */
function playCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 9_999_999_00 // affordability is not what these tests are about
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* locked / unaffordable – the player would see it greyed out */
      }
    }
    if (world.knock && world.knock.choice === null) world.knock.choice = 'rest'
    advanceWeeks(world, rng, 1)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    if (world.knock && world.knock.choice === null) world.knock.choice = 'rest'
  }
  return world
}

describe('the ledger has a shelf for every tier, from week 0', () => {
  it('emptyTrophyLedger follows TIER_LADDER, so a new rung is a shelf the day it is added', () => {
    const shelves = emptyTrophyLedger()
    expect(Object.keys(shelves).sort()).toEqual([...TIER_LADDER].sort())
    for (const tier of TIER_LADDER) {
      expect(shelves[tier]).toEqual({ titles: [], finals: [] })
    }
  })

  it('a brand-new career carries all eighteen shelves, empty – the screen draws them locked', () => {
    const snap = toSnapshot(createWorld('cabinet-fresh'))
    for (const tier of TIER_LADDER) {
      expect(snap.trophiesByTier[tier].titles).toEqual([])
      expect(snap.trophiesByTier[tier].finals).toEqual([])
    }
  })

  it('⚠ the snapshot is a COPY, never a live view of the engine arrays', () => {
    const world = playCareer('cabinet-copy', 120)
    const snap = toSnapshot(world)
    const tier = TIER_LADDER.find((t) => world.trophiesByTier[t].finals.length > 0) ?? 'local'
    snap.trophiesByTier[tier].finals.push(9999)
    snap.trophiesByTier[tier].titles.push(9999)
    expect(world.trophiesByTier[tier].finals).not.toContain(9999)
    expect(world.trophiesByTier[tier].titles).not.toContain(9999)
  })
})

describe('⚠ gold and silver are DISJOINT: `finals` means she LOST the final', () => {
  const world = playCareer('cabinet-disjoint', 260)
  const snap = toSnapshot(world)

  it('a career actually produces both, or this suite is proving nothing', () => {
    const titles = TIER_LADDER.reduce((n, t) => n + snap.trophiesByTier[t].titles.length, 0)
    const finals = TIER_LADDER.reduce((n, t) => n + snap.trophiesByTier[t].finals.length, 0)
    expect(titles).toBeGreaterThan(0)
    expect(finals).toBeGreaterThan(0)
  })

  it('no week is in both arrays – one final produces exactly one piece of silverware', () => {
    for (const tier of TIER_LADDER) {
      const { titles, finals } = snap.trophiesByTier[tier]
      for (const week of titles) expect(finals, `${tier} w${week}`).not.toContain(week)
    }
  })

  it('a title week is NOT counted as a lost final – the trap `<= 1` would spring', () => {
    // The milestone ledger captures `final` on `kidFinish <= 1`, so it holds a `final` row for
    // every tier she has ever WON. If this ledger ever copied that rule, the silver count would
    // include titles. Pinned by comparing the two directly: every tier she has a title at is a tier
    // the MILESTONE ledger calls a final, and this ledger must still be able to say she lost none.
    const wonTiers = TIER_LADDER.filter((t) => snap.trophiesByTier[t].titles.length > 0)
    expect(wonTiers.length).toBeGreaterThan(0)
    for (const tier of wonTiers) {
      const milestoneSaysFinal = world.milestones.some((m) => m.type === 'final' && m.tier === tier)
      expect(milestoneSaysFinal, `milestones should hold a final row for ${tier}`).toBe(true)
      // ...and the cabinet's own count is free to be smaller, including zero. What must NEVER
      // happen is the two counts being forced equal by a shared `<= 1`.
      const cab = snap.trophiesByTier[tier]
      expect(cab.finals.length).toBeLessThanOrEqual(cab.finals.length + cab.titles.length)
      for (const week of cab.titles) expect(cab.finals).not.toContain(week)
    }
  })

  it('agrees with `bestFinishByTier`, the only other record of the same events', () => {
    for (const tier of TIER_LADDER) {
      const { titles, finals } = snap.trophiesByTier[tier]
      const best = snap.bestFinishByTier[tier]
      if (titles.length > 0) expect(best, `${tier} has titles`).toBe(0)
      if (finals.length > 0) expect(best, `${tier} has lost finals`).toBeLessThanOrEqual(1)
      // ...and the reverse: a high-water mark of 0 means at least one title is on the shelf.
      if (best === 0) expect(titles.length, `${tier} best is champion`).toBeGreaterThan(0)
    }
  })

  it('both arrays are ASCENDING, so the screen can group by year without sorting', () => {
    for (const tier of TIER_LADDER) {
      const { titles, finals } = snap.trophiesByTier[tier]
      expect(titles).toEqual([...titles].sort((a, b) => a - b))
      expect(finals).toEqual([...finals].sort((a, b) => a - b))
    }
  })

  it('every recorded week is a week the career actually reached', () => {
    for (const tier of TIER_LADDER) {
      for (const week of [...snap.trophiesByTier[tier].titles, ...snap.trophiesByTier[tier].finals]) {
        expect(week).toBeGreaterThanOrEqual(0)
        expect(week).toBeLessThanOrEqual(world.week)
      }
    }
  })
})

describe('⚠ the year under a trophy is the SEASON year, and `weekYear` would collide', () => {
  it('the collision is real and this is the shape of it: seasons 4 and 5 share a calendar year', () => {
    // The exact pair shared/dates.ts documents, re-derived here so the cabinet's choice is defended
    // by a fact rather than by a comment.
    expect(weekYear(208)).toBe(weekYear(260))
    expect(seasonYear(4)).not.toBe(seasonYear(5))
  })

  it('seasonYear(floor(week / 52)) is total and strictly increasing across a whole career', () => {
    let previous = -Infinity
    for (let season = 0; season < 20; season++) {
      const year = seasonYear(Math.floor((season * WEEKS_IN_SEASON) / WEEKS_IN_SEASON))
      expect(year).toBeGreaterThan(previous)
      previous = year
      // every week of the season answers with the SAME year – a group cannot split mid-season
      for (const offset of [0, 1, 26, 51]) {
        const week = season * WEEKS_IN_SEASON + offset
        expect(seasonYear(Math.floor(week / WEEKS_IN_SEASON))).toBe(year)
      }
    }
  })

  it('two consecutive seasons of trophies never merge into one group', () => {
    const weeks = [208, 260] // one title in season 4, one in season 5
    const years = new Set(weeks.map((w) => seasonYear(Math.floor(w / WEEKS_IN_SEASON))))
    expect(years.size).toBe(2)
    // ...whereas the wrong derivation would have shown a single "2x'35"
    expect(new Set(weeks.map(weekYear)).size).toBe(1)
  })
})

describe('⚠ the v31 back-fill is a deliberate NO-OP – it creates the shape, never the history', () => {
  /** A v30 save that is FULL of evidence a back-fill could have been tempted by. */
  function v30WithEvidence(): Record<string, unknown> {
    return {
      schemaVersion: 30,
      careerId: 'evidence',
      seed: 'evidence',
      week: 300,
      fundsCents: 100_000,
      profile: {
        kidName: 'Vera',
        kidLastName: 'Martin',
        gender: 'girl',
        country: 'US',
        background: 'middle',
        coachTier: 'high',
        playStyle: 'aggressive',
        birthMonth: 5,
        birthDay: 12,
      },
      // The high-water marks say she has WON two tiers...
      bestFinishByTier: { local: 0, regional: 0, national: 1 },
      // ...and the milestone ledger even knows the weeks of the FIRST of each.
      milestones: [
        { type: 'title', week: 40, tier: 'local' },
        { type: 'final', week: 40, tier: 'local' },
        { type: 'title', week: 150, tier: 'regional' },
      ],
    }
  }

  it('creates eighteen empty shelves and mines nothing, however much evidence is in the save', () => {
    const migrated = migrateSave(v30WithEvidence())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const tier of TIER_LADDER) {
      expect(migrated.trophiesByTier[tier], tier).toEqual({ titles: [], finals: [] })
    }
    // The evidence is untouched – the migration reads nothing and rewrites nothing.
    expect(migrated.bestFinishByTier).toEqual({ local: 0, regional: 0, national: 1 })
    expect(migrated.milestones).toHaveLength(3)
  })

  it('WHY: the evidence that survives would give a confident WRONG count, not a partial one', () => {
    // `milestones` is firsts-only by identity, so a five-time champion leaves ONE row. A back-fill
    // reading it would print "1 title, in 2031" under a cup that was won five times - a number with
    // a year on it that never happened. This asserts the premise rather than the behaviour, so the
    // day somebody proposes mining it the test says why not.
    const world = playCareer('cabinet-firsts', 260)
    const wonTier = TIER_LADDER.find((t) => world.trophiesByTier[t].titles.length > 1)
    expect(wonTier, 'need a tier won more than once for this to mean anything').toBeDefined()
    const titleRows = world.milestones.filter((m) => m.type === 'title' && m.tier === wonTier)
    expect(titleRows).toHaveLength(1)
    expect(world.trophiesByTier[wonTier as TierId].titles.length).toBeGreaterThan(1)
  })

  it('is idempotent, and rebuilds a save whose field arrived malformed', () => {
    const broken = { ...v30WithEvidence(), trophiesByTier: 'not an object' }
    const migrated = migrateSave(broken)
    for (const tier of TIER_LADDER) expect(migrated.trophiesByTier[tier]).toEqual({ titles: [], finals: [] })
    // Running the current schema through again changes nothing.
    const again = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(again.trophiesByTier).toEqual(migrated.trophiesByTier)
  })
})

describe('a missing shelf heals itself – no future rung needs a migration', () => {
  it('finalizeTournament creates the row rather than throwing, the way v30 had to be taught', () => {
    // The exact failure `LadderTrack` gaining `wta` produced: a save migrated before a rung existed
    // reaches the write with no shelf for it. Simulated by deleting one from a live world.
    const world = createWorld('cabinet-heal')
    world.fundsCents = 9_999_999_00
    delete (world.trophiesByTier as Partial<Record<TierId, unknown>>)['local']
    const rng = rngFromSeed(world.seed)
    expect(() => {
      for (let w = 0; w < 60; w++) {
        for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
          if (world.entries.includes(e.id)) continue
          try {
            if (availabilityStatus(world, e).level === 'blocked') continue
            enterEvent(world, e.id)
          } catch {
            /* locked */
          }
        }
        if (world.knock && world.knock.choice === null) world.knock.choice = 'rest'
        advanceWeeks(world, rng, 1)
        while (world.pendingTournament) {
          if (!world.pendingTournament.finished) skipTournament(world)
          closeTournament(world)
        }
        if (world.knock && world.knock.choice === null) world.knock.choice = 'rest'
      }
    }).not.toThrow()
    // ...and the snapshot still reports every shelf the screen expects to draw.
    const snap = toSnapshot(world)
    for (const tier of TIER_LADDER) expect(snap.trophiesByTier[tier]).toBeDefined()
  })
})
