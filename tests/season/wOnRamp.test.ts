// THE ON-RAMP'S GUARDS (W3-ONRAMP, 04.08) – the closed loop at the foot of the professional ladder,
// pinned shut from four sides.
//
// WHAT THE LOOP WAS. W3-FIELD3 made the W-track canonical brackets select from LIVE cohort ∪ 364
// derived professionals against the MERGED W standings. That table sorts on points; every derived
// pro holds three figures of them and every LIVE player starts on nought, so the whole cohort sat at
// positions 364+ of a 563-row table while a W15 draw was filled position-biased from the head of its
// own band (~#124). A cohort player could not be DRAWN into a W event; not being drawn she could not
// EARN a W point; not earning one she could not LEAVE the position that kept her out. Measured on
// the shipped engine: 0.0 LIVE W ledger rows a season, on every seed, for ever.
//
// WHAT THIS FILE PINS:
//   1. THE LOOP IS OPEN     – a live career puts cohort players on the professional table.
//   2. THE DOOR IS HERS     – `proDoors` is `tierFloorOpen`'s W arm asked of a cohort id, and it
//                             REFUSES: the entry rung reads junior points, the rungs above read a
//                             professional result and the rung's own rank cut.
//   3. THE PROS STILL PLAY  – a held slot is a slot, not the draw. `ON_RAMP.slots` is a ceiling.
//   4. THE DIRECT ACCEPTANCES ARE UNTOUCHED, DRAWS INCLUDED – the on-ramp only ever APPENDS to the
//      event's sub-stream, and it displaces the LAST acceptances and nobody else. This is the RNG
//      discipline of the whole change expressed as an equality a test can hold.
//
// Uniquely named on purpose (two agents once collided add/add on an identically named test file).

import { describe, it, expect } from 'vitest'
import {
  ON_RAMP,
  fillOnRamp,
  selectEntrants,
  type OnRamp,
} from '../../src/engine/season/tournament'
import { fieldProsFor, isFieldProId, mergedWtaRanking, universeForTier } from '../../src/engine/season/fieldPros'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum } from '../../src/engine/season/ranking'
import { TIERS } from '../../src/engine/season/calendar'
import { rivalConditions } from '../../src/engine/season/rival'
import { rngFromSeed } from '../../src/engine/rng'
import { createWorld, tickWeek, inTrack, seasonIndexOf, KID_ID, proDoors } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../../src/engine/season/types'

/** A world with a real professional calendar behind it. The kid enters nothing – every W row this
 *  produces was earned by a cohort player in a canonical bracket, which is the whole claim. */
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

/** The AI side's mixed ordinal fold – the table a cohort player HAS a place in. */
function juniorTable(world: WorldState): RankingRow[] {
  return computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.itf,
    world.cohort.map((p) => p.id),
  )
}

function eventFor(tier: TierId, week: number): SeasonEvent {
  return {
    id: `onramp-probe-${tier}-${week}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 0,
    deadlineWeek: week - 2,
  }
}

// =================================================================================================
// 1. THE LOOP IS OPEN
// =================================================================================================
describe('the cohort can reach the professional ladder', () => {
  it('a live career leaves LIVE W ledger rows – the number that was exactly zero', () => {
    const world = ticked('onramp-loop', 40)
    const wRows = world.results.filter(
      (r) => r.playerId !== KID_ID && r.tier !== undefined && TIERS[r.tier].track === 'wta',
    )
    // ⚠ THE ONE ASSERTION THE WHOLE WAVE IS ABOUT. It read 0 on every seed and every horizon before
    // this fix, by construction rather than by luck – see the file header.
    expect(wRows.length).toBeGreaterThan(0)
    // ...and they were won, not granted: some of them PAID, so the standings actually move.
    expect(wRows.some((r) => r.points > 0)).toBe(true)
    // ...and a derived professional still never reaches persisted state (W3-FIELD3's law, unmoved).
    expect(wRows.some((r) => isFieldProId(r.playerId))).toBe(false)
  })

  it('...and those points put cohort players ON the merged W table, above the point-less block', () => {
    const world = ticked('onramp-table', 60)
    const table = mergedTable(world)
    const holders = world.cohort.filter(
      (p) => windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.wta, inTrack('wta')) > 0,
    )
    expect(holders.length).toBeGreaterThan(0)
    // Every one of them outranks a cohort player who has never earned a professional point, which is
    // what "she is on the ladder" means in a table sorted on points.
    const posOf = new Map(table.map((r, i) => [r.playerId, i]))
    const holderIds = new Set(holders.map((p) => p.id))
    const worstHolder = Math.max(...holders.map((p) => posOf.get(p.id) ?? table.length))
    const bestNonHolder = Math.min(
      ...world.cohort.filter((p) => !holderIds.has(p.id)).map((p) => posOf.get(p.id) ?? table.length),
    )
    expect(worstHolder).toBeLessThan(bestNonHolder)
  })
})

// =================================================================================================
// 2. THE DOOR IS THE KID'S DOOR – and it refuses
// =================================================================================================
describe('proDoors is tierFloorOpen asked of a cohort id', () => {
  it('the entry rung reads JUNIOR points; a girl with neither junior points nor a pro week is refused', () => {
    const world = ticked('onramp-door-w15', 30)
    const admits = proDoors(world, mergedTable(world)).at('w15')
    const itf = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.itf,
      world.cohort.map((p) => p.id),
      inTrack('itf'),
    )
    const itfPoints = new Map(itf.map((r) => [r.playerId, r.points]))
    const playedW = new Set(
      world.results
        .filter((r) => r.tier !== undefined && TIERS[r.tier].track === 'wta' && r.playerId !== KID_ID)
        .map((r) => r.playerId),
    )
    const floor = TIERS.w15.enterPointBand[0]
    let refused = 0
    for (const p of world.cohort) {
      const expected = (itfPoints.get(p.id) ?? 0) >= floor || playedW.has(p.id)
      expect(admits(p.id), p.id).toBe(expected)
      if (!expected) refused += 1
    }
    // THE DOOR HAS TO BITE, or it is not a door. Most of a junior cohort never clears it.
    expect(refused).toBeGreaterThan(world.cohort.length / 2)
  })

  it('a rung with an acceptance list needs a professional result AND the rung’s own rank cut', () => {
    const world = ticked('onramp-door-w100', 60)
    const table = mergedTable(world)
    const rankOf = new Map(table.map((r) => [r.playerId, r.rank]))
    const admits = proDoors(world, table).at('w100')
    const cut = TIERS.w100.acceptsRank!
    for (const p of world.cohort) {
      const pts = windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.wta, inTrack('wta'))
      expect(admits(p.id), p.id).toBe(pts > 0 && (rankOf.get(p.id) ?? Number.MAX_SAFE_INTEGER) <= cut)
    }
    // ...and a point-less cohort player is refused by EVERY rung that has a list, which is the half
    // of the ladder the on-ramp deliberately does not open. Nobody walks into a major.
    const pointless = world.cohort.find(
      (p) => windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.wta, inTrack('wta')) === 0,
    )
    expect(pointless).toBeTruthy()
    const doors = proDoors(world, table)
    for (const tier of ['w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'slam'] as TierId[]) {
      expect(doors.at(tier)(pointless!.id), tier).toBe(false)
    }
  })
})

// =================================================================================================
// 3 + 4. A HELD SLOT IS A SLOT, AND THE DIRECT ACCEPTANCES ARE UNTOUCHED
// =================================================================================================
describe('the held slots take the last acceptances and nothing else', () => {
  /** The two arms of one draw: the same event, the same universe, the same table, the same fresh
   *  stream – with and without an on-ramp. */
  function arms(world: WorldState, tier: TierId, slots: number) {
    const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
    const universe = universeForTier(tier, world.cohort, pros)
    const table = mergedTable(world)
    const event = eventFor(tier, world.week)
    const fatigue = rivalConditions(world.results, world.week)
    const onRamp: OnRamp = {
      pool: world.cohort,
      ranking: juniorTable(world),
      admits: proDoors(world, table).at(tier),
      slots,
    }
    const counted = (): { rng: () => number; count: () => number } => {
      const raw = rngFromSeed(`${world.seed}:aitour:${event.id}`)
      let n = 0
      return {
        rng: () => {
          n += 1
          return raw()
        },
        count: () => n,
      }
    }
    const a = counted()
    const withoutOnRamp = selectEntrants(event, universe, table, a.rng, fatigue)
    const b = counted()
    const drawn = selectEntrants(event, universe, table, b.rng, fatigue)
    const withOnRamp = fillOnRamp(
      event,
      drawn,
      table,
      b.rng,
      onRamp,
      fatigue,
      new Set(drawn.map((p) => p.id)),
    )
    return { withoutOnRamp, withOnRamp, drawsWithout: a.count(), drawsWith: b.count(), onRamp }
  }

  it('a W draw keeps its size, and at most ON_RAMP.slots of it are LIVE on-ramp entrants', () => {
    const world = ticked('onramp-share', 45)
    for (const tier of ['w15', 'w35', 'w50', 'w75'] as TierId[]) {
      const { withOnRamp } = arms(world, tier, ON_RAMP.slots)
      expect(withOnRamp.length, tier).toBe(TIERS[tier].drawSize)
      const live = withOnRamp.filter((p) => !isFieldProId(p.id))
      expect(live.length, tier).toBeLessThanOrEqual(ON_RAMP.slots)
      // ...so the draw is still overwhelmingly professional, which is what W3-FIELD3 bought.
      expect(withOnRamp.length - live.length, tier).toBeGreaterThanOrEqual(TIERS[tier].drawSize - ON_RAMP.slots)
    }
  })

  it('the acceptances that survive are exactly the pre-on-ramp field minus its LAST k', () => {
    const world = ticked('onramp-displace', 45)
    const { withoutOnRamp, withOnRamp } = arms(world, 'w35', ON_RAMP.slots)
    const added = withOnRamp.filter((p: AiPlayer) => !withoutOnRamp.some((q: AiPlayer) => q.id === p.id))
    expect(added.length).toBeGreaterThan(0)
    // Whoever stepped aside is the TAIL of the direct-acceptance list, in that list's own order –
    // which is what a qualifier or a wildcard displaces on a real entry list, and the reason this is
    // an equality rather than a bound.
    const kept = withoutOnRamp.slice(0, withoutOnRamp.length - added.length).map((p: AiPlayer) => p.id)
    const survived = withOnRamp.filter((p: AiPlayer) => withoutOnRamp.some((q: AiPlayer) => q.id === p.id))
    expect(survived.map((p: AiPlayer) => p.id).sort()).toEqual([...kept].sort())
  })

  it('the on-ramp only APPENDS draws: the professional side is keyed by the same numbers', () => {
    const world = ticked('onramp-stream', 45)
    const { drawsWithout, drawsWith, withoutOnRamp, withOnRamp } = arms(world, 'w50', ON_RAMP.slots)
    // MORE draws, never fewer, never re-ordered: the candidate keying above runs first and untouched,
    // and the on-ramp's own one-draw-per-band-candidate loop is appended after it. That is what makes
    // "the direct acceptances are unchanged" a property of the code's shape.
    expect(drawsWith).toBeGreaterThan(drawsWithout)
    const droppedCount = withoutOnRamp.filter((p: AiPlayer) => !withOnRamp.some((q: AiPlayer) => q.id === p.id)).length
    expect(droppedCount).toBeLessThanOrEqual(ON_RAMP.slots)
    // ...and with the slots turned off it is byte-identical AND draw-identical to no on-ramp at all.
    const off = arms(world, 'w50', 0)
    expect(off.drawsWith).toBe(off.drawsWithout)
    expect(off.withOnRamp.map((p: AiPlayer) => p.id)).toEqual(off.withoutOnRamp.map((p: AiPlayer) => p.id))
  })

  it('a non-W rung is never given one – the junior/domestic draws replay with NO on-ramp', () => {
    // ⚠ THE SEAM IS PER TRACK, AND THIS IS THE ONLY HONEST WAY TO PIN IT. Handing a J rung an
    // on-ramp would NOT be a no-op (its door has no acceptance list either, so `proDoors` falls
    // through to the same junior-points read), which is precisely why the claim has to be tested
    // against the ENGINE rather than against the function: `fillWeekOnRamps` visits W events only,
    // so a replica that fills nothing must reproduce the row-holders the tick wrote. Widen that
    // filter and this line is what fails.
    const world = createWorld('onramp-junior')
    const rng = rngFromSeed(world.seed)
    let checked = 0
    for (let w = 0; w < 12; w++) {
      // ONE EVENT ON THE WEEK, or `resolveDoubleBookings` is the thing being measured instead: a J
      // rung sharing a week with a W rung has its field rearranged after the draw, by design.
      const whole = world.season.filter((e) => e.week === world.week + 1)
      const upcoming = whole.filter((e) => TIERS[e.tier].track !== 'wta')
      const pros = fieldProsFor(world.seed, seasonIndexOf(world.week + 1), world.cohort.map((p) => p.name))
      const mixed = computeRanking(
        world.results.filter((r) => r.playerId !== KID_ID),
        world.week + 1,
        BEST_N_BY_TRACK.itf,
        world.cohort.map((p) => p.id),
      )
      const fatigue = rivalConditions(world.results, world.week + 1)
      const replay = new Map<string, string[]>()
      for (const event of upcoming) {
        replay.set(
          event.id,
          selectEntrants(
            event,
            universeForTier(event.tier, world.cohort, pros),
            mixed,
            rngFromSeed(`${world.seed}:aitour:${event.id}`),
            fatigue,
          ).map((p) => p.id),
        )
      }
      tickWeek(world, rng)
      if (world.pendingTournament) world.pendingTournament = null
      if (whole.length !== 1 || upcoming.length !== 1) continue
      const [event] = upcoming
      const holders = world.results
        .filter((r) => r.week === world.week && r.tier === event.tier && r.playerId !== KID_ID)
        .map((r) => r.playerId)
      expect([...holders].sort(), event.id).toEqual([...replay.get(event.id)!].sort())
      checked += 1
    }
    expect(checked, 'the fixture really did run some single-event junior weeks').toBeGreaterThan(0)
  })
})
