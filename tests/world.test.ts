import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'

describe('world (phase-0 placeholder)', () => {
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

  it('keeps the log bounded', () => {
    const world = createWorld('bounded')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 1000; i++) tickWeek(world, rng)
    expect(world.log.length).toBeLessThanOrEqual(200)
    expect(world.week).toBe(1000)
  })
})
