// ROUND 41 #19's FIXTURE – one seven-week layoff, two suites.
//
// The unit suite (tests/round41-injury-forecast.test.ts) asks the ENGINE what the view carries; the
// component suite (tests/component/round41-injury-forecast.test.ts) mounts the real InjuryStopDialog
// over the same worlds and reads the card. Two questions about one fixture, so the fixture is written
// once.
//
// ⚠ NOTHING VUE IN HERE – it is imported by the `unit` project as well (see helpers/mountSeason.ts).
import { createWorld, tickWeek, type WorldState } from '../../src/engine/world'
import { onsetInjury } from '../../src/engine/world/injury'
import { BODY_REGIONS } from '../../src/engine/body'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

/** A real career, eight weeks in, with money so nothing below is about bankruptcy. */
export function base(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  return world
}

/** ⚠ THE LAYOFF LENGTH IS SEARCHED FOR, NOT ASSERTED INTO EXISTENCE (injury-cancelled-row.test.ts's
 *  own idiom). `onsetInjury` draws severity and weeks-out off the stream it is handed, so a
 *  sub-stream seed is picked whose draw yields the length the arm needs – the generator, the order
 *  and the arity are untouched, and the injury that lands is one the engine could really have
 *  rolled. Nothing here touches MAIN. */
export function seedForExactLayoff(world: WorldState, weeks: number): string {
  for (let i = 0; i < 1500; i++) {
    const probe = JSON.parse(JSON.stringify(world)) as WorldState
    onsetInjury(probe, rngFromSeed(`r41-19-probe:${i}`), 'week', BODY_REGIONS)
    if (probe.injury?.totalWeeks === weeks) return `r41-19-probe:${i}`
  }
  throw new Error(`no draw produced a layoff of exactly ${weeks} weeks`)
}

/** The owner's own case: a seven-week layoff and a masseur on the daily rung. */
export function sevenWeeksAndADailyMasseur(seed: string, hired = true): WorldState {
  const world = base(seed)
  world.masseurHired = hired
  world.masseurSessionsPerWeek = 7 // 'Daily' – rehabExtraEveryNWeeks: 1
  onsetInjury(world, rngFromSeed(seedForExactLayoff(world, 7)), 'week', BODY_REGIONS)
  return world
}
