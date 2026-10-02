// =================================================================================================
// ⭐⭐ ROUND 45 #1b – THE SHOOT-AND-TOURNAMENT WEEK PAYS PER SHOOTING DAY (owner, 02.10)
// =================================================================================================
//
// Shown the condition table, whose last line read «shoot week −7», the owner: «неделя съёмок… давай
// по 1 за каждый съемочный день, это может быть вполне справедливо» (docs/decisions.md 02.10, «THE
// TARIFF IS HIS LEVER»; docs/rounds/round-45.md 1b). The flat week it replaces was round 29 #3's
// reading of «+1 в день» as seven days, and the shoot was never seven days long.
//
// ⚠ WHERE THE DAYS COME FROM – NOTHING HERE IS A NEW MODEL. On a week she is also playing, the schedule
// has drawn the shoot since round 30 #2 on every MATCH DAY of the trip (`TRIP_SHOOT`, hung by
// `tripMatchDay` in composables/weekGrid.ts), and the match days are the draw's own rounds,
// `log2(drawSize)` – the owner's own «на локалах 3 дня, National 4 (вроде), основная масса 5, а на 1000
// вообще 6 (Шлем 7)». The engine now charges the days the schedule draws (`clashShootDays`,
// world/medical.ts). The picture half of that sentence – the card and the schedule naming one number of
// days – is asserted in the mounted file, tests/component/round29-shoot-clash-ui.test.ts.
//
// ⚠ EVERY CLAIM IS READ OUT OF A WORLD AND NOT OFF THE SOURCE: the card's number is the snapshot's
// `shootClash.conditionCost`, the charge is `world.condition` before and after `accrueCondition`, and the
// two must agree – the parity class, one function behind both (`clashShootDays`).
//
// ⚠ MUTATION-VERIFIED, and named (02.10): put the flat week back at the charge site (`accrueCondition`'s
// multiplier a literal 7, where `PLAN_DAYS` stood) and the per-rung charge arm reddens on every rung whose
// length is not seven – local, regional, wta250, wta1000; put it back at the card (`buildShootClashPrompt`)
// and the card arm reddens on the same four. The Slam's seven is the ONE rung where the old flat week and
// the new count agree, so it cannot catch a revert by itself and is not asked to.
import { describe, expect, it } from 'vitest'
import { accrueCondition, answerShootClash, toSnapshot, type WorldState } from '../src/engine/world'
import { clashShootDays } from '../src/engine/world/medical'
import { ECONOMY } from '../src/engine/economy'
import type { TierId } from '../src/engine/season/types'
import { clashWorld, CLASH } from './helpers/scenarios/clash'

const AD = ECONOMY.advertising

/** THE OWNER'S OWN TABLE, rung by rung: an 8-draw is 3 days, a 16-draw 4, every 32-draw 5, the 1000's
 *  64-draw 6, the Slam's 128-draw 7. Typed in as numbers on purpose – a table derived from the catalogue
 *  would restate the engine's own arithmetic and agree with it however it moved. */
const RUNGS: Array<[TierId, number]> = [
  ['local', 3],
  ['regional', 4],
  ['wta250', 5],
  ['wta1000', 6],
  ['slam', 7],
]

/** The shipped clash fixture (one named shoot week, one entered event on it) with its event moved to
 *  `tier` – the only thing that differs between the rungs. */
function tierWorld(seed: string, tier: TierId, opts?: Parameters<typeof clashWorld>[1]): WorldState {
  const world = clashWorld(seed, opts)
  world.season = world.season.map((e) => ({ ...e, tier }))
  return world
}

/** Her condition after the collision week's accrual, read straight off the world – the
 *  `round29-shoot-clash.test.ts` shape. */
function conditionAfterAccrual(w: WorldState): number {
  w.week = CLASH
  w.condition = 50
  accrueCondition(w, true)
  return w.condition
}

describe('round 45 #1b – the clash week costs one point per day the event runs', () => {
  it('the rate is still the owner\'s one point, and it is the only knob', () => {
    expect(AD.clashConditionPerDay).toBe(1)
  })

  it.each(RUNGS)('%s runs %i days: the card and the charge both say so', (tier, days) => {
    const both = tierWorld(`r45-1b-${tier}`, tier)
    // THE CARD – derived per snapshot, the week BEFORE the collision, which is where the question is asked.
    const card = toSnapshot(both).shootClash
    expect(card, 'the engine raised no question for this rung').not.toBeNull()
    expect(card!.conditionCost, 'the card is not printing the days the event runs').toBe(AD.clashConditionPerDay * days)
    answerShootClash(both, 'play-both')

    // THE CHARGE – the same week with the shoot somewhere else, so the shoot is the only difference.
    const control = tierWorld(`r45-1b-${tier}`, tier, { shootWeeks: [CLASH + 20] })
    const spent = conditionAfterAccrual(control) - conditionAfterAccrual(both)
    expect(spent, 'the week did not cost one point per shooting day').toBe(AD.clashConditionPerDay * days)
    expect(spent, 'the card and the charge name different numbers').toBe(card!.conditionCost)
  })

  it('every rung but the Slam is cheaper than the flat week it replaces – the Slam IS that week', () => {
    const flat = 7
    for (const [tier, days] of RUNGS) {
      if (tier === 'slam') expect(days).toBe(flat)
      else expect(days, tier).toBeLessThan(flat)
    }
  })

  it('a week she is entered in nothing has no shooting day to price (a hand-built world, never a live one)', () => {
    const world = tierWorld('r45-1b-none', 'local')
    expect(clashShootDays(world, CLASH)).toBe(3)
    world.entries = []
    expect(clashShootDays(world, CLASH), 'no entry, no collision – nothing to price').toBe(0)
  })
})
