import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'

const EVENTS_CAP = 400 // mirrors world.ts

describe('world (phase-3 living season)', () => {
  it('same seed -> identical world after 520 weeks', () => {
    const runs = [0, 1].map(() => {
      const world = createWorld('deterministic')
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 520; i++) tickWeek(world, rng)
      return world
    })
    expect(runs[0]).toEqual(runs[1])
  })

  it('training-heavy plans cost more than light ones (same seed, same draws)', () => {
    const run = (plan: { train: number; rest: number }) => {
      const world = createWorld('plan-cost')
      world.plan = plan
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 200; i++) tickWeek(world, rng)
      return world
    }
    const grind = run({ train: 85, rest: 15 })
    const light = run({ train: 60, rest: 40 })
    expect(grind.week).toBe(light.week)
    expect(grind.fundsCents).toBeLessThan(light.fundsCents)
  })

  it('grows a cohort and a rolling season from the seed', () => {
    const world = createWorld('grows')
    expect(world.cohort.length).toBe(199)
    // at least 26 future weeks are always scheduled
    const future = world.season.filter((e) => e.week > world.week)
    expect(future.length).toBeGreaterThanOrEqual(1)
    const maxWeek = Math.max(...world.season.map((e) => e.week))
    expect(maxWeek - world.week).toBeGreaterThanOrEqual(26)
    // the season keeps rolling as time passes
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 100; i++) tickWeek(world, rng)
    const maxAfter = Math.max(...world.season.map((e) => e.week))
    expect(maxAfter - world.week).toBeGreaterThanOrEqual(26)
  })

  it('caps the event feed but never prunes keep:true events', () => {
    const world = createWorld('bounded')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 500; i++) tickWeek(world, rng)
    expect(world.week).toBe(500)
    // non-kept events are capped
    const nonKept = world.events.filter((e) => !e.keep)
    expect(nonKept.length).toBeLessThanOrEqual(EVENTS_CAP)
    // the week-0 "career started" keep:true info event survives 500 weeks of pruning
    const start = world.events.find((e) => e.week === 0 && e.type === 'info')
    expect(start).toBeTruthy()
    expect(start!.keep).toBe(true)
  })

  it('records prevKidRank as the kid rank from the START of the resolved week', () => {
    const world = createWorld('prev-rank')
    expect(world.prevKidRank).toBeNull()
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 20; i++) {
      const rankBeforeTick = world.kidRank
      tickWeek(world, rng)
      expect(world.prevKidRank).toBe(rankBeforeTick)
    }
  })

  it('cohort drift is identical week-by-week regardless of entry choices (RNG discipline)', () => {
    const entered = createWorld('discipline')
    const skipped = createWorld('discipline')
    const rngA = rngFromSeed('discipline')
    const rngB = rngFromSeed('discipline')

    // The entered world commits to the earliest still-open event; the skipped world does not.
    const target = entered.season.find((e) => e.deadlineWeek >= entered.week)
    expect(target).toBeTruthy()
    // r-gate (season-life-01b): points-based eligibility. This guard is about RNG discipline, not the
    // ladder, so grant a throwaway result worth the tier's minPoints ONLY for the enterEvent gate
    // check, then drop it before any tick – the main-stream draws must stay byte-identical to the
    // skipped world (local's min is 0, needing no grant).
    const min = TIERS[target!.tier].enterPointBand[0]
    const marker = { playerId: KID_ID, week: entered.week, points: min, tier: target!.tier }
    if (min > 0) entered.results.push(marker)
    enterEvent(entered, target!.id)
    if (min > 0) entered.results = entered.results.filter((r) => r !== marker)
    expect(entered.entries).toContain(target!.id)
    expect(skipped.entries).toHaveLength(0)

    for (let w = 0; w < 60; w++) {
      tickWeek(entered, rngA)
      // A reveal week pauses; finalize + close it so time keeps moving. The main-stream draws
      // (drift + AI) already ran during the tick, so this never touches the cohort or the rng.
      if (entered.pendingTournament) {
        skipTournament(entered)
        closeTournament(entered)
      }
      tickWeek(skipped, rngB)
      // Entering / skipping must never perturb the main weekly stream, so cohort
      // drift lands identically in both worlds every single week.
      expect(entered.cohort).toEqual(skipped.cohort)
    }
    // ...but the kid actually played, so only the entered world has kid match events.
    expect(entered.events.some((e) => e.type === 'match')).toBe(true)
    expect(skipped.events.some((e) => e.type === 'match')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Save/reload replay of the AI world. The canonical AI tournaments run on the event-scoped
// stream `seed:aitour:<event.id>`, derived from two IMMUTABLE things – the world seed and the
// event id – so a reloaded career resolves the same brackets by construction, not because the
// worker managed to fast-forward the main stream onto exactly the right draw.
// ---------------------------------------------------------------------------
describe('AI tournaments replay across a save/reload', () => {
  // Result rows worth a tier's CHAMPION points – the winners of the brackets that resolved from
  // `fromWeek` on. Keyed by week + points so two events stacked in one week stay distinct.
  const CHAMPION_POINTS = new Set(TIER_LADDER.map((t) => TIERS[t].points[0]))
  function championsFrom(world: WorldState, fromWeek: number): string[] {
    return world.results
      .filter((r) => r.playerId !== KID_ID && r.week >= fromWeek && CHAMPION_POINTS.has(r.points))
      .map((r) => `w${r.week}:${r.points}:${r.playerId}`)
      .sort()
  }

  // Exactly what sim.worker.ts's restoreRng does: a fresh stream fast-forwarded by one draw-batch
  // per elapsed week against a probe career.
  function restoreRng(loaded: WorldState) {
    const r = rngFromSeed(loaded.seed)
    const probe = createWorld(loaded.seed, loaded.profile)
    for (let w = 0; w < loaded.week; w++) tickWeek(probe, r)
    return r
  }

  function newWorld(freezeCohort: boolean): WorldState {
    const world = createWorld('replay-mid-season')
    // Frozen skills isolate the RNG question: drift still draws its 4 per player, it just lands
    // on +0, so a diverging main stream can no longer reach the brackets through the cohort.
    if (freezeCohort) for (const p of world.cohort) p.growth = 0
    return world
  }

  function runTo(week: number, freezeCohort = false): WorldState {
    const world = newWorld(freezeCohort)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < week; i++) tickWeek(world, rng)
    return world
  }

  function saveReload(world: WorldState): WorldState {
    // The real round-trip the worker performs: a JSON payload back through migrateSave.
    return migrateSave(JSON.parse(JSON.stringify(world))) as unknown as WorldState
  }

  it('a mid-season save/reload reproduces the same AI champions', () => {
    const straight = runTo(30)

    const reloaded = saveReload(runTo(20))
    const restored = restoreRng(reloaded)
    for (let i = 0; i < 10; i++) tickWeek(reloaded, restored)

    expect(championsFrom(straight, 21).length).toBeGreaterThan(0)
    expect(championsFrom(reloaded, 21)).toEqual(championsFrom(straight, 21))
    expect(reloaded.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      straight.results.filter((r) => r.playerId !== KID_ID),
    )
  })

  it('...even if the reloaded main stream lands on the WRONG draw (replay-safe by construction)', () => {
    const straight = runTo(30, true)

    const reloaded = saveReload(runTo(20, true))
    // A deliberately BROKEN restore: a stream that never saw the first 20 weeks, so every
    // main-stream draw from here on is the wrong one. The brackets must not care.
    const wrong = rngFromSeed(reloaded.seed)
    for (let i = 0; i < 10; i++) tickWeek(reloaded, wrong)

    expect(championsFrom(straight, 21).length).toBeGreaterThan(0)
    expect(championsFrom(reloaded, 21)).toEqual(championsFrom(straight, 21))
  })
})

describe('score presentation', () => {
  it('flipScore mirrors every set', async () => {
    const { flipScore } = await import('../src/engine/world')
    expect(flipScore('2-6 6-4 1-6')).toBe('6-2 4-6 6-1')
    expect(flipScore('7-6')).toBe('6-7')
  })
})
