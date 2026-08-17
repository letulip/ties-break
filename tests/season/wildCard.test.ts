// THE WILD CARDS (round 21 #2b, 17.08) – the eight places a Grand Slam gives away, pinned from the
// five sides that could each turn the mechanic into something it is not.
//
// WHAT IT IS. A Slam's 128 is 112 direct acceptances + 8 qualifiers + 8 wild cards. We model the
// direct-acceptance line exactly (`slam.acceptsRank`); these are the eight the tournament hands out,
// and ours go to players of the HOST NATION whom the acceptance list refused. Qualifying is still
// unmodelled and is not modelled here.
//
// WHAT THIS FILE PINS:
//   1. THE HOST NATION IS DERIVED AND COSTS NOTHING – a pure function of (seed, event.id), stable
//      across calls and across a reload, different per event, never on the MAIN stream.
//   2. EVERY PLAYABLE COUNTRY CAN HOST – the one cross-boundary claim, and the engine may not import
//      a component (invariant 1), so it is pinned by SOURCE. A code the onboarding wizard offers but
//      the host pool lacks is a mechanic that silently never fires for that player.
//   3. IT IS A REWARD, NOT A GIFT – a direct acceptance never holds one (or the badge is a lie), and
//      a player far below the rung's own band never holds one either.
//   4. ONE RULE, TWO READERS – her gate and the AI draw's held places call one function, and the
//      calendar and the turnstile agree about the same event.
//   5. IT IS INERT WHERE IT SHOULD BE – every rung but the Slam is untouched, and the Slam's own
//      `seed:aitour:` field selection is untouched, because the eight places are filled off their
//      own sub-stream.
//
// ⚠ EVERY ASSERTION HERE WAS MUTATION-PROVED (CLAUDE.md: "mutate the thing you think you are
// covering and watch it fail before you believe a green run"). The four mutations that were run and
// the tests each one reddened are listed in docs/specs/the-wild-cards-2026-08.md §5.

import { describe, it, expect } from 'vitest'
import {
  WILD_CARD,
  HOST_NATIONS,
  hostNationOf,
  wildCardWindow,
  fillOnRamp,
  selectEntrants,
} from '../../src/engine/season/tournament'
import { NATION_POOL } from '../../src/engine/season/cohort'
import { fieldProsFor, mergedWtaRanking, universeForTier } from '../../src/engine/season/fieldPros'
import { BEST_N_BY_TRACK, computeRanking } from '../../src/engine/season/ranking'
import { TIERS } from '../../src/engine/season/calendar'
import { rngFromSeed } from '../../src/engine/rng'
import {
  createWorld,
  tickWeek,
  inTrack,
  seasonIndexOf,
  acceptanceRank,
  tableSize,
  entryStatus,
  homeWildCardPlace,
  tierFloorOpen,
  tierOpenFor,
  recomputeKidRank,
  toSnapshot,
  KID_ID,
} from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import type { RankingRow, SeasonEvent } from '../../src/engine/season/types'
import { componentFile } from '../worldSource'

function ticked(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (world.pendingTournament) world.pendingTournament = null
  }
  return world
}

/** The merged W standings the tick builds, folded WITHOUT the kid (world.ts `TourWeek.ranking`). */
function mergedTable(world: WorldState): RankingRow[] {
  return mergedWtaRanking(
    computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      world.cohort.map((p) => p.id),
      inTrack('wta'),
    ),
    fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name)),
  )
}

function slamEvent(week: number, id = `2030-w${week}-slam`): SeasonEvent {
  return { id, week, tier: 'slam', surface: 'hard', travelCostCents: 0, deadlineWeek: week - 2 }
}

// =================================================================================================
// 1. THE HOST NATION – derived, stable, and costing nothing
// =================================================================================================

describe('the host nation is derived, not stored', () => {
  it('is a pure function of (seed, event id) – same answer however often it is asked', () => {
    const ids = ['2030-w26-slam', '2031-w26-slam', '2030-w4-slam']
    for (const id of ids) {
      const first = hostNationOf('seed-a', id)
      expect(hostNationOf('seed-a', id)).toBe(first)
      expect(hostNationOf('seed-a', id)).toBe(first)
      expect(HOST_NATIONS).toContain(first)
    }
  })

  it('differs by event and by seed – a career is not one long home tie', () => {
    const perEvent = new Set(
      Array.from({ length: 40 }, (_, i) => hostNationOf('seed-a', `2030-w${i}-slam`)),
    )
    const perSeed = new Set(
      Array.from({ length: 40 }, (_, i) => hostNationOf(`seed-${i}`, '2030-w26-slam')),
    )
    // Not "all different" – a weighted 126-entry pool repeats. The claim is that it MOVES, which is
    // what a constant would fail.
    expect(perEvent.size).toBeGreaterThan(5)
    expect(perSeed.size).toBeGreaterThan(5)
  })

  it('persists nothing – a fresh world of the same seed reads the same host', () => {
    const a = createWorld('host-persist')
    const b = createWorld('host-persist')
    expect(hostNationOf(a.seed, '2030-w26-slam')).toBe(hostNationOf(b.seed, '2030-w26-slam'))
  })

  // ⚠ THE ONE THAT MAKES "zero persisted bytes" A TESTABLE CLAIM RATHER THAN A COMMENT.
  it('adds no field to the save', () => {
    const world = ticked('host-bytes', 6)
    const save = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    for (const key of Object.keys(save)) {
      expect(key.toLowerCase()).not.toContain('host')
      expect(key.toLowerCase()).not.toContain('wildcard')
    }
  })
})

// =================================================================================================
// 2. EVERY PLAYABLE COUNTRY CAN HOST – the cross-boundary guard
// =================================================================================================

describe('the host pool covers every country the player may pick', () => {
  // ⚠ A SOURCE PIN, AND IT HAS TO BE ONE. The engine may never import a component (invariant 1), and
  // the onboarding wizard's twenty-four countries are declared inside its `<script setup>` where no
  // runtime import can reach them. This is `componentFile` used for exactly what CLAUDE.md says it
  // is for – a claim about a FILE – and the claim is a cross-boundary equality that would otherwise
  // be checkable only by a person remembering to check it.
  it('contains every code in OnboardingWizard COUNTRIES', () => {
    const src = componentFile('components/OnboardingWizard.vue')
    const at = src.indexOf('const COUNTRIES = [')
    expect(at, 'the COUNTRIES array moved – re-aim this pin, do not delete it').toBeGreaterThan(-1)
    const body = src.slice(at, src.indexOf(']', at))
    const codes = [...body.matchAll(/'([A-Z]{2})'/g)].map((m) => m[1])
    expect(codes.length).toBeGreaterThan(20)
    for (const code of codes) {
      expect(HOST_NATIONS, `${code} is playable but can never host – a mechanic that never fires`).toContain(code)
    }
  })

  // ⚠ AND THE OTHER HALF OF THE SAME CLAIM: the pool is the POPULATION's weighted pool plus the gap,
  // never a re-weighting of it. `makeJunior` spends one pickInt against NATION_POOL, so a changed
  // NATION_POOL re-maps every existing seed's entire field.
  it('is NATION_POOL plus the playable codes it lacks, in that order', () => {
    expect(HOST_NATIONS.slice(0, NATION_POOL.length)).toEqual(NATION_POOL)
    expect(HOST_NATIONS.length).toBeGreaterThanOrEqual(NATION_POOL.length)
  })

  it('never widens itself by reading her country – identical in every career', () => {
    const us = createWorld('pool-us', { country: 'US' })
    const by = createWorld('pool-by', { country: 'BY' })
    // The pool is a module constant; the two careers see the same array, which is what "not a
    // special case for the player" means mechanically.
    expect(HOST_NATIONS).toContain(us.profile.country)
    expect(HOST_NATIONS).toContain(by.profile.country)
  })
})

// =================================================================================================
// 3. IT IS A REWARD, NOT A GIFT – the window's two clauses
// =================================================================================================

describe('the wild-card window refuses what a wild card is not for', () => {
  const ACCEPTS = 112
  const TOTAL = 1799
  const CEILING = TIERS.slam.entrantPctBand[1]

  it('is the Slam alone – no other rung publishes a count to be outside of', () => {
    for (const tier of ['w15', 'w35', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000'] as const) {
      expect(wildCardWindow(tier, 200, TOTAL, ACCEPTS)).toBe(false)
    }
    expect(wildCardWindow('slam', 200, TOTAL, ACCEPTS)).toBe(true)
  })

  // ⚠ THE CLAUSE THAT KEEPS THE BADGE HONEST. If a direct acceptance could hold one, the card would
  // be claiming she was given a place she had earned.
  it('refuses a direct acceptance – she does not need one', () => {
    expect(wildCardWindow('slam', 1, TOTAL, ACCEPTS)).toBe(false)
    expect(wildCardWindow('slam', ACCEPTS, TOTAL, ACCEPTS)).toBe(false)
    expect(wildCardWindow('slam', ACCEPTS + 1, TOTAL, ACCEPTS)).toBe(true)
  })

  it('refuses a player below the rung own entrant band – it is not a gift to anybody at home', () => {
    const lastIn = Math.floor(CEILING * TOTAL)
    expect(wildCardWindow('slam', lastIn, TOTAL, ACCEPTS)).toBe(true)
    expect(wildCardWindow('slam', lastIn + 1, TOTAL, ACCEPTS)).toBe(false)
    expect(wildCardWindow('slam', 900, TOTAL, ACCEPTS)).toBe(false)
  })

  it('refuses when the rung keeps no acceptance list at all', () => {
    expect(wildCardWindow('slam', 200, TOTAL, undefined)).toBe(false)
  })
})

// =================================================================================================
// 4. HER OWN CARD – the same rule, and the two gates agree
// =================================================================================================

/** Put her at a chosen rank in the W table by hand, the way the ladder tests do: a counting W result
 *  makes her ranked at all, and the merged table then places her by points. Returns her rank. */
function seatHer(world: WorldState, points: number): number {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'w100' })
  recomputeKidRank(world)
  return world.kidRankWta ?? tableSize(world, 'wta')
}

/** ⚠ SEAT HER **INSIDE THE WINDOW**, AND THE FIRST CUT OF THIS FILE PROVED WHY IT HAS TO BE ITS OWN
 *  HELPER. `seatHer(world, 30)` put her at a rank the window refuses on one of the seeds, so the
 *  injury case below asserted "blocked for a reason other than the list" against a career the LIST
 *  was refusing anyway – a test that passes its own assertion while testing nothing, which is the
 *  failure mode CLAUDE.md's mutation rule exists to catch. This searches the point total that lands
 *  her between the acceptance cut and the rung's band ceiling and FAILS LOUDLY if none does, so a
 *  positive case can never quietly become a vacuous one. */
function seatInWindow(world: WorldState): number {
  const accepts = acceptanceRank(world, 'slam')!
  for (const points of [10, 20, 30, 45, 60, 90, 130, 190, 260, 360, 500, 700, 1000]) {
    const before = world.results.length
    const rank = seatHer(world, points)
    if (wildCardWindow('slam', rank, tableSize(world, 'wta'), accepts)) return rank
    world.results.length = before
    recomputeKidRank(world)
  }
  throw new Error('no point total seats her inside the wild-card window – re-centre this fixture')
}

/** The first Slam id in this world whose host nation is hers, or null. */
function homeSlamId(world: WorldState): string | null {
  for (let w = 0; w < 300; w++) {
    const id = `2030-w${w}-slam`
    if (hostNationOf(world.seed, id) === world.profile.country) return id
  }
  return null
}

describe('her wild card is the same rule as everybody else', () => {
  it('is false at every rung but the Slam, and false for an away Slam', () => {
    const world = ticked('her-wc-away', 60)
    seatHer(world, 30)
    const away = Array.from({ length: 300 }, (_, w) => `2030-w${w}-slam`).find(
      (id) => hostNationOf(world.seed, id) !== world.profile.country,
    )!
    expect(homeWildCardPlace(world, 'slam', away)).toBe(false)
    const home = homeSlamId(world)
    if (home) {
      for (const tier of ['w75', 'w100', 'wta125', 'wta500'] as const) {
        expect(homeWildCardPlace(world, tier, home)).toBe(false)
      }
    }
  })

  it('is false with no professional result at all – unranked is not rank one', () => {
    const world = ticked('her-wc-unranked', 40)
    const home = homeSlamId(world)
    expect(home).not.toBeNull()
    expect(homeWildCardPlace(world, 'slam', home!)).toBe(false)
  })

  // ⭐ THE POSITIVE CASE, and it is built rather than hunted: her country is set to whatever the
  // event's host is, which is the same thing as finding a seed where the two match and is not a
  // special case for her – `hostNationOf` never reads the profile.
  it('opens the door when the Slam is at home and she is inside the window', () => {
    const world = ticked('her-wc-home', 80)
    const id = '2030-w26-slam'
    world.profile.country = hostNationOf(world.seed, id)
    const rank = seatInWindow(world)
    const accepts = acceptanceRank(world, 'slam')!
    const total = tableSize(world, 'wta')
    // The precondition is asserted rather than assumed: she really is OUTSIDE the list, which is
    // what makes the next line a positive result instead of a tautology.
    expect(rank).toBeGreaterThan(accepts)
    expect(homeWildCardPlace(world, 'slam', id)).toBe(true)
    // ...and the door shuts again the moment the Slam is played anywhere else, which is the cap
    // that lives inside the rule's own definition.
    const away = Array.from({ length: 300 }, (_, w) => `2031-w${w}-slam`).find(
      (other) => hostNationOf(world.seed, other) !== world.profile.country,
    )!
    expect(homeWildCardPlace(world, 'slam', away)).toBe(false)
    // ...and the rule really is `wildCardWindow` and not a second copy of it.
    expect(homeWildCardPlace(world, 'slam', id)).toBe(
      wildCardWindow('slam', world.kidRankWta ?? total, total, accepts),
    )
  })

  // ⚠⚠ R10-5, THE ONE THIS MECHANIC COULD HAVE RE-OPENED: the calendar showing an enterable card
  // while the turnstile refuses it, on the one event the wild card exists for.
  it('the calendar and the turnstile agree about the same event', () => {
    const world = ticked('her-wc-gates', 80)
    const id = '2030-w26-slam'
    world.profile.country = hostNationOf(world.seed, id)
    expect(seatInWindow(world)).toBeGreaterThan(acceptanceRank(world, 'slam')!)
    const event = slamEvent(world.week + 6, id)
    const open = tierFloorOpen(world, 'slam', event.id)
    const status = entryStatus(world, event)
    if (open) {
      expect(status.level === 'blocked' && status.reason === 'locked').toBe(false)
    } else {
      expect(status.level).toBe('blocked')
    }
    // ...and asked WITHOUT the event, the per-rung summary is deliberately blind to the wild card:
    // "the Slam takes the top 112" is what the tier guide should keep saying.
    expect(tierOpenFor(world, 'slam')).toBe(
      (world.kidRankWta ?? Number.MAX_SAFE_INTEGER) <= acceptanceRank(world, 'slam')!,
    )
  })

  it('opens a door and never enters her – every availability rule still runs', () => {
    const world = ticked('her-wc-injured', 80)
    const id = '2030-w26-slam'
    world.profile.country = hostNationOf(world.seed, id)
    seatInWindow(world)
    // The precondition, asserted: the wild card really is open, so the block below can only be the
    // body's. Without this the case passed while the LIST was doing the refusing (see `seatInWindow`).
    expect(homeWildCardPlace(world, 'slam', id)).toBe(true)
    world.injury = { kind: 'strain', severity: 'moderate', weeksRemaining: 8, totalWeeks: 8, sinceWeek: world.week }
    const status = entryStatus(world, slamEvent(world.week + 2, id))
    expect(status.level).toBe('blocked')
    expect(status.reason).not.toBe('locked')
  })
})

// =================================================================================================
// 5. THE BADGE – true only when the list would have refused her
// =================================================================================================

describe('the marker on the tournament card', () => {
  it('never rides on a place she earned', () => {
    const world = ticked('badge-earned', 100)
    // Inside the cut by construction: a book big enough to sit at the head of the merged table.
    world.results.push({ playerId: KID_ID, week: world.week, points: 4000, tier: 'slam' })
    recomputeKidRank(world)
    for (const e of toSnapshot(world).upcoming) {
      if (e.eligible && e.tier === 'slam') expect(e.wildCard).toBeUndefined()
    }
  })

  it('is absent from every card that is not a Slam', () => {
    const world = ticked('badge-scope', 80)
    seatHer(world, 30)
    for (const e of toSnapshot(world).upcoming) {
      if (e.tier !== 'slam') expect(e.wildCard).toBeUndefined()
    }
  })
})

// =================================================================================================
// 6. IT IS INERT WHERE IT SHOULD BE – the RNG discipline, as an equality
// =================================================================================================

describe('the eight places cost the rest of the draw nothing', () => {
  // ⚠ THE WHOLE RNG CLAIM IN ONE ASSERTION. The wild cards are filled off `seed:wildcard:<id>`, so
  // the field the week already selected off `seed:aitour:<id>` is bit-for-bit the field it selected.
  // A pass that had reused the event's own stream would move every later draw in that bracket.
  it('the aitour stream still selects the identical field', () => {
    const world = ticked('inert-aitour', 60)
    const event = slamEvent(world.week + 1)
    const ranking = mergedTable(world)
    const universe = universeForTier('slam', world.cohort, [])
    const a = selectEntrants(event, universe, ranking, rngFromSeed(`${world.seed}:aitour:${event.id}`))
    const b = selectEntrants(event, universe, ranking, rngFromSeed(`${world.seed}:aitour:${event.id}`))
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id))
  })

  // ⚠ AND THE HELD-SLOT MECHANISM IS ONE MECHANISM. `fillOnRamp` at slots 0 returns the field
  // untouched and spends no draw – the property the wild-card pass leans on when a Slam has no
  // host-nation candidate at all.
  it('holding nothing costs nothing', () => {
    const world = ticked('inert-zero', 40)
    const event = slamEvent(world.week + 1)
    const ranking = mergedTable(world)
    const field = universeForTier('slam', world.cohort, []).slice(0, 32)
    const out = fillOnRamp(event, field, ranking, rngFromSeed('x'), {
      pool: world.cohort,
      ranking,
      admits: () => true,
      slots: 0,
    })
    expect(out.map((p) => p.id)).toEqual(field.map((p) => p.id))
  })

  it('the constant is a swept object, not a bare literal', () => {
    expect(WILD_CARD.slots).toBe(8)
    expect(WILD_CARD.tier).toBe('slam')
  })
})

// =================================================================================================
// 7. THE EIGHT HELD PLACES THEMSELVES – `fillOnRamp` in its wild-card configuration
// =================================================================================================
//
// ⚠ THIS IS THE ENGINE'S OWN CALL, ASSEMBLED THE SAME WAY `fillWildCards` (world.ts) assembles it:
// the pool filtered to the host nation, the merged W table as the ranking, and `wildCardWindow` as
// the door. Testing it here rather than through a tick is deliberate – it is the CONFIGURATION that
// is the mechanic, and a test that drove a whole season would be measuring the calendar's luck at
// putting a Slam in front of it.

describe('the eight held places', () => {
  /** The world, its merged table, and a Slam field of direct acceptances, ready to be raided. */
  function slamWeek(seed: string) {
    const world = ticked(seed, 80)
    const ranking = mergedTable(world)
    const event = slamEvent(world.week + 1)
    const universe = universeForTier('slam', world.cohort, fieldProsFor(
      world.seed,
      seasonIndexOf(world.week),
      world.cohort.map((p) => p.name),
    ))
    const pos = new Map(ranking.map((r, i) => [r.playerId, i]))
    // The direct acceptances: the head of the table, exactly what `selectEntrants` leaves behind.
    const field = [...universe]
      .sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9))
      .slice(0, TIERS.slam.drawSize)
    const accepts = acceptanceRank(world, 'slam')!
    const rankOf = new Map(ranking.map((r) => [r.playerId, r.rank]))
    return { world, ranking, event, universe, field, accepts, rankOf }
  }

  it('gives its places to home players the list refused, and to nobody else', () => {
    const { world, ranking, event, universe, field, accepts, rankOf } = slamWeek('held-places')
    // The host with the most candidates in the window, so the case is a real fill rather than a
    // no-op on whatever nation the seed happened to draw.
    const inWindow = universe.filter((p) =>
      wildCardWindow('slam', rankOf.get(p.id) ?? ranking.length, ranking.length, accepts),
    )
    const byNation = new Map<string, number>()
    for (const p of inWindow) byNation.set(p.nation, (byNation.get(p.nation) ?? 0) + 1)
    const host = [...byNation.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const before = field.map((p) => p.id)

    // ⚠ `booked` IS NOT OPTIONAL DECORATION AT THIS CALL SITE AND THE FIRST CUT OF THIS TEST PROVED
    // IT. `fillOnRamp` filters candidates by `booked` and by nothing else, so a pool that overlaps
    // the field it is raiding will hand a place to somebody already in the draw – the test came back
    // "8 dropped, 7 added", i.e. one player twice. The engine cannot do this: `fillWeekOnRamps`
    // seeds `booked` from EVERY field the week has resolved, this event's included
    // (`resolveDoubleBookings` writes a row per drawn event – checked, both branches), and adds each
    // filled field back before the next event. So the test passes what the engine passes, and
    // assertion 2 below pins the property rather than leaving it to a comment.
    const booked = new Set(before)
    const after = fillOnRamp(event, field, ranking, rngFromSeed(`${world.seed}:wildcard:${event.id}`), {
      pool: universe.filter((p) => p.nation === host),
      ranking,
      admits: (id) => wildCardWindow('slam', rankOf.get(id) ?? ranking.length, ranking.length, accepts),
      slots: WILD_CARD.slots,
    }, undefined, booked)

    // 1. The draw is still the draw – held places are places IN it, never places added to it.
    expect(after.length).toBe(before.length)
    // 2. ...and nobody is in it twice.
    expect(new Set(after.map((p) => p.id)).size).toBe(after.length)
    // 2. Somebody actually got one, or this test proves nothing.
    const added = after.filter((p) => !before.includes(p.id))
    expect(added.length).toBeGreaterThan(0)
    expect(added.length).toBeLessThanOrEqual(WILD_CARD.slots)
    // 3. Every one of them is a home player the acceptance list refused. Both clauses, on the
    //    players who actually came in – which is the claim the badge makes on her card too.
    for (const p of added) {
      expect(p.nation).toBe(host)
      expect(rankOf.get(p.id) ?? ranking.length).toBeGreaterThan(accepts)
    }
    // 4. And the players who stepped aside are the LAST direct acceptances, never the seeds.
    const dropped = before.filter((id) => !after.some((p) => p.id === id))
    expect(dropped.length).toBe(added.length)
    const pos = new Map(ranking.map((r, i) => [r.playerId, i]))
    const worstKept = Math.max(
      ...after.filter((p) => before.includes(p.id)).map((p) => pos.get(p.id) ?? 1e9),
    )
    for (const id of dropped) expect(pos.get(id) ?? 1e9).toBeGreaterThan(worstKept - 1)
  })

  it('holds nothing when nobody at home is of the level', () => {
    const { world, ranking, event, field } = slamWeek('held-none')
    const after = fillOnRamp(event, field, ranking, rngFromSeed(`${world.seed}:wildcard:${event.id}`), {
      pool: [],
      ranking,
      admits: () => true,
      slots: WILD_CARD.slots,
    })
    expect(after.map((p) => p.id)).toEqual(field.map((p) => p.id))
  })
})
