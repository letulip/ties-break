// ROUND 53 STEP 2 – ONE FIXTURE, TWO SUITES (tests/r53-masseur-release.test.ts and the mounted
// tests/component/r53-masseur-release.test.ts read the same world, so the popup and the engine cannot be
// checked against two different layoffs). A hired masseur, a six-week layoff dealt this week whose
// cadence saves two of them, and three entries: week+2 (lost with him or without), week+4 (the gap:
// back with him, out without) and week+8 (safe either way).
import { createWorld, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { masseurRehabWeeksAhead } from '../../src/engine/world/masseur'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

export const NOW = 10
export const IN_GAP = 'r53-gap'
export const LOST_EITHER_WAY = 'r53-lost'
export const SAFE = 'r53-safe'

export function layoffWithAMasseur(seed: string, opts: { hired?: boolean; injured?: boolean; weeks?: number } = {}): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = NOW
  world.bestFinishByTier.w15 = 0 // the professional door, so the masseur card is unlocked and offers «Let go»
  world.masseurHired = opts.hired ?? true
  // The rung whose cadence saves exactly two weeks of a six-week layoff is found, not assumed.
  const weeks = opts.weeks ?? 6
  if (opts.injured ?? true) {
    world.injury = { kind: 'knee', severity: 'moderate', weeksRemaining: weeks, totalWeeks: weeks, sinceWeek: NOW }
  }
  for (const rung of ECONOMY.masseur.rungs) {
    world.masseurSessionsPerWeek = rung.sessions
    if (masseurRehabWeeksAhead(world) === 2 || world.injury === null) break
  }
  for (const [id, offset] of [[LOST_EITHER_WAY, 2], [IN_GAP, 4], [SAFE, 8]] as const) {
    world.season.push({ id, week: NOW + offset, tier: 'national', surface: 'hard', travelCostCents: 100_00, deadlineWeek: NOW + offset - 2 })
    world.entries.push(id)
  }
  world.season.sort((a, b) => a.week - b.week)
  return world
}
