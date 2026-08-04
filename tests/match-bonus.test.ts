// THE MATCH BONUS FIRES – the regression net for a term that was dead code for the whole life of
// the development model.
//
// WHAT WAS WRONG. `ECONOMY.development.matchBonus` (0.18, capped at 3 matches) multiplies a week's
// growth rate by up to 1.54, and world.ts fed it `matchesThisWeek` counted as
// `world.events.filter(e => e.week === world.week ...)`. `tickWeek` increments `world.week` at its
// first statement and reaches the growth step long before the week's draw is played: the match rows
// are written by `revealNextRound` / `skipTournament`, which are COMMANDS the caller issues after
// the tick returns. So the filter asked for rows that could not exist yet and the answer was 0 –
// measured over 31,000 weeks of career against 20,659 matches actually played
// (docs/specs/skill-model-audit-2026-08.md section 9).
//
// WHY THIS TEST IS AT THE WORLD LEVEL AND NOT ON `growWeek`. `growWeek` was never broken: hand it
// `matchesThisWeek: 3` and it has always multiplied correctly. The bug was entirely in WHICH WEEK
// world.ts looked at, so a unit test of the pure function would have passed throughout. The thing
// that has to be pinned is the wiring.
//
// MUTATION-VERIFIED: putting `world.week` back in place of `world.week - 1` in world.ts turns the
// first assertion below from a 1.3x ratio to exactly 1.0, and it fails.
import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldEvent, WorldMatch } from '../src/shared/protocol'

/** A competitive match row for a given week – the same minimal shape tests/world-trio.test.ts uses. */
function played(id: number, week: number, friendly = false): WorldEvent {
  return {
    id,
    week,
    type: 'match',
    text: 'beat someone',
    match: { winnerId: 'kid' } as unknown as WorldMatch,
    ...(friendly ? { friendly: true } : {}),
  }
}

/** One tick of growth on a girl with plenty of headroom, with `count` match rows already on the
 *  feed for the week that has just finished. Returns the serve gained by that single week.
 *
 *  Everything else is held identical: same seed, same week, same plan, same coach – so the weekly
 *  luck draw (`seed:growth:<week>`) is the same number in every arm and the only thing that can
 *  move the result is the match bonus. */
function serveGainedInAWeek(count: number, friendly = false): number {
  const world = createWorld('match-bonus-probe', DEFAULT_PROFILE)
  world.skills = { serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
  world.potential = { serve: 90, ret: 90, composure: 90, stamina: 90, groundstrokes: 90 }
  // The rows belong to the week that has just finished, which is the one `growWeek` must read.
  for (let i = 0; i < count; i++) world.events.push(played(1000 + i, world.week, friendly))
  const before = world.skills.serve
  tickWeek(world, rngFromSeed(world.seed))
  return world.skills.serve - before
}

describe('the match bonus reaches growWeek', () => {
  it('a week after competition develops more than a week after training', () => {
    const training = serveGainedInAWeek(0)
    const oneMatch = serveGainedInAWeek(1)
    expect(training).toBeGreaterThan(0)
    // 1 + 1 x 0.18 = 1.18, and nothing else in the week differs.
    expect(oneMatch / training).toBeCloseTo(1 + ECONOMY.development.matchBonus, 5)
  })

  it('scales with the number of matches and stops at matchBonusCap', () => {
    const training = serveGainedInAWeek(0)
    const cap = ECONOMY.development.matchBonusCap
    for (let n = 1; n <= cap; n++) {
      expect(serveGainedInAWeek(n) / training).toBeCloseTo(1 + n * ECONOMY.development.matchBonus, 5)
    }
    // Past the cap a fourth match is fatigue, not education – the condition model charges for it.
    expect(serveGainedInAWeek(cap + 2) / training).toBeCloseTo(
      1 + cap * ECONOMY.development.matchBonus,
      5,
    )
  })

  it('a practice friendly teaches nothing – `friendly` rows are excluded', () => {
    expect(serveGainedInAWeek(2, true)).toBeCloseTo(serveGainedInAWeek(0), 10)
  })
})
