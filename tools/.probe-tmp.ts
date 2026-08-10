import { createWorld, tickWeek, enterEvent, skipTournament, closeTournament, KID_ID } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'

let found = 0
for (let s = 0; s < 8 && found < 4; s++) {
  const world = createWorld(`probe-${s}`)
  const rng = rngFromSeed(world.seed)
  const strongestFirst = [...TIER_LADDER].reverse()
  for (let i = 0; i < 52 * 4 && found < 4; i++) {
    world.fundsCents = Math.max(world.fundsCents, 1_000_000_00)
    if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
      for (const tier of strongestFirst) {
        const e = world.season.find(
          (x) => x.tier === tier && x.deadlineWeek >= world.week && x.deadlineWeek - world.week <= 2 &&
            !world.entries.includes(x.id) && !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (!e) continue
        try { enterEvent(world, e.id); break } catch { /* next rung */ }
      }
    }
    const before = world.events.length
    tickWeek(world, rng)
    if (world.pendingTournament) {
      const hit = world.pendingTournament.result.matches.some((m) => m.retiredId === KID_ID)
      skipTournament(world)
      closeTournament(world)
      if (hit) {
        found++
        console.log(`\n===== career ${s}, week ${world.week} =====`)
        for (const e of world.events.slice(before)) console.log(`  [${e.type}] ${e.text}`)
        console.log(`  injury:`, JSON.stringify(world.injury))
      }
    }
  }
}
