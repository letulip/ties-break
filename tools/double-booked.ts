// CAN ONE RIVAL PLAY TWO TOURNAMENTS IN THE SAME WEEK? The owner, 31.07: «они физически не могут
// сразу везде играть, ведь так?» `selectEntrants` is called once per event with the SAME condition
// map (derived once before the week's brackets run) and no cross-event exclusion, so nothing in the
// code prevents it. This counts how often it actually happens.
import { createWorld, tickWeek } from '../src/engine/world'
import { selectEntrants } from '../src/engine/season/tournament'
import { computeRanking } from '../src/engine/season/ranking'
import { rivalConditions } from '../src/engine/season/rival'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'

let weeksWithTwo = 0, collisions = 0, playerWeeks = 0, doubled = 0
for (let s = 0; s < 6; s++) {
  const seed = `dbl-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:b`)
  for (let w = 0; w < 156; w++) {
    tickWeek(world, rng)
    const scheduled = world.season.filter((e) => e.week === world.week)
    if (scheduled.length < 2) continue
    weeksWithTwo++
    const ids = world.cohort.map((p) => p.id)
    const ranking = computeRanking(world.results, world.week, ids)
    const cond = rivalConditions(world.results, world.week)
    const seen = new Map<string, number>()
    for (const e of scheduled) {
      const r = rngFromSeed(`${seed}:probe:${e.id}`)
      for (const p of selectEntrants(e, world.cohort, ranking, r, cond)) {
        seen.set(p.id, (seen.get(p.id) ?? 0) + 1)
      }
    }
    for (const [, n] of seen) { playerWeeks++; if (n > 1) { doubled++; collisions += n - 1 } }
  }
}
console.log(`weeks with 2+ events: ${weeksWithTwo}`)
console.log(`player-weeks in a draw: ${playerWeeks}`)
console.log(`DOUBLE-BOOKED player-weeks: ${doubled} (${((doubled / playerWeeks) * 100).toFixed(1)}%)`)
console.log(`extra events created by it: ${collisions}`)
