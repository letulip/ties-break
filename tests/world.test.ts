import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek, enterEvent, skipTournament, closeTournament } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'

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
    enterEvent(entered, target!.id)
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

describe('score presentation', () => {
  it('flipScore mirrors every set', async () => {
    const { flipScore } = await import('../src/engine/world')
    expect(flipScore('2-6 6-4 1-6')).toBe('6-2 4-6 6-1')
    expect(flipScore('7-6')).toBe('6-7')
  })
})
