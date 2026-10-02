// =================================================================================================
// ⭐⭐ ROUND 45 #1b – THE SHOOT-AND-TOURNAMENT WEEK IS TWO SHOOTING DAYS, THREE CONDITION EACH (owner, 02.10)
// =================================================================================================
//
// Shown the condition table, whose last line read «shoot week −7», the owner: «неделя съёмок… давай
// по 1 за каждый съемочный день, это может быть вполне справедливо» (docs/decisions.md 02.10, «THE
// TARIFF IS HIS LEVER»; docs/rounds/round-45.md 1b). The flat week it replaces was round 29 #3's
// reading of «+1 в день» as seven days, and the shoot was never seven days long.
//
// ⚠⚠ RE-AIMED 02.10, THIRD BATCH – THIS FILE'S FIRST BUILD PINNED THE WRONG DAYS, AND IT IS KEPT HERE AS HISTORY. B12 read
// «съемочный день» as the event's MATCH DAYS (`log2(drawSize)`: 3 local / 4 regional / 5 / 6 / 7 Slam), because the schedule
// drew the Shoot block on every match day – round 30's agent choice, never his – and the table below was that arithmetic. Shown
// it, the owner: «у нас же там когда съемки + турнир нагрузка сильнее, но съемочных дней всего 2… можно за каждый съемочный день по 2 или даже по 3 кондишна снимать. Что думаешь?» – ruled with the
// architect's concurrence: the clash shoot is TWO days, each costing THREE, so SIX per clash, flat across tiers (docs/decisions.md
// 02.10, «THIRD BATCH»). The table is therefore ONE number five times, and it stays five arms on purpose: a flat table is how a
// future tier-coupling regression shows – a rung whose price drifts back to its draw's rounds goes red on its own line.
//
// ⚠ EVERY CLAIM IS READ OUT OF A WORLD AND NOT OFF THE SOURCE: the card's number is the snapshot's
// `shootClash.conditionCost`, the charge is `world.condition` before and after `accrueCondition`, and the
// two must agree – the parity class, one function behind both (`clashShootDays`). The picture half of
// the sentence – the schedule drawing the Shoot block on exactly those two days – is asserted in the mounted
// file, tests/component/round29-shoot-clash-ui.test.ts, over the engine's own `clashShootDays`.
//
// ⚠ MUTATION-VERIFIED, and named (02.10, third batch), each watched red and restored byte-identical:
//   (a) `clashShootDays` back to `Math.log2(TIERS[event.tier].drawSize)` – a draw's rounds are 3..7, never 2, so every per-rung
//       arm reddens (card, charge and day count), and so does the flat arm;
//   (b) `ECONOMY.advertising.clashConditionPerDay` back to 1 – the rate arm, and the card and charge on every rung (2 points,
//       not 6);
//   (c) the grid drawing the Shoot block on every match day again (`matchDay < TRIP_SHOOT_DAYS` dropped in `tripMatchDay`) –
//       the schedule's count in tests/component/round29-shoot-clash-ui.test.ts, which this file cannot see.
import { describe, expect, it } from 'vitest'
import { accrueCondition, answerShootClash, toSnapshot, type WorldState } from '../src/engine/world'
import { clashShootDays } from '../src/engine/world/medical'
import { ECONOMY } from '../src/engine/economy'
import type { TierId } from '../src/engine/season/types'
import { clashWorld, CLASH } from './helpers/scenarios/clash'

const AD = ECONOMY.advertising

/** THE OWNER'S NUMBERS, typed in as numbers on purpose – a figure derived from the constant under test would restate the
 *  engine's own arithmetic and agree with it however it moved. Two days («съемочных дней всего 2»), three each («по 2 или даже
 *  по 3», ruled three), six per clash. */
const SHOOT_DAYS = 2
const PER_DAY = 3
const PER_CLASH = 6

/** One rung per way a draw can be sized: an 8-draw, a 16, every 32-draw, the 1000's 64, the Slam's 128. The price is the same
 *  at all five – the point of the table is that no rung may disagree. */
const RUNGS: TierId[] = ['local', 'regional', 'wta250', 'wta1000', 'slam']

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

describe('round 45 #1b – the clash week costs three points on each of the shoot\'s two days', () => {
  it('the rate is the owner\'s three, and it is the only knob', () => {
    expect(AD.clashConditionPerDay).toBe(PER_DAY)
  })

  it.each(RUNGS)('%s: two shooting days, six points – the card and the charge both say so', (tier) => {
    const both = tierWorld(`r45-1b-${tier}`, tier)
    expect(clashShootDays(both, CLASH), 'the shoot is not two days long at this rung').toBe(SHOOT_DAYS)
    // THE CARD – derived per snapshot, the week BEFORE the collision, which is where the question is asked.
    const card = toSnapshot(both).shootClash
    expect(card, 'the engine raised no question for this rung').not.toBeNull()
    expect(card!.conditionCost, 'the card is not printing two days at three').toBe(PER_CLASH)
    answerShootClash(both, 'play-both')

    // THE CHARGE – the same week with the shoot somewhere else, so the shoot is the only difference.
    const control = tierWorld(`r45-1b-${tier}`, tier, { shootWeeks: [CLASH + 20] })
    const spent = conditionAfterAccrual(control) - conditionAfterAccrual(both)
    expect(spent, 'the week did not cost two days at three').toBe(PER_CLASH)
    expect(spent, 'the card and the charge name different numbers').toBe(card!.conditionCost)
  })

  it('the price is FLAT – the entered event\'s tier does not enter it, on the card or on the day count', () => {
    const cards = new Set(RUNGS.map((tier) => toSnapshot(tierWorld(`r45-1b-flat-${tier}`, tier)).shootClash!.conditionCost))
    expect([...cards], 'the clash price follows the tier again').toEqual([PER_CLASH])
    const days = new Set(RUNGS.map((tier) => clashShootDays(tierWorld(`r45-1b-flat-${tier}`, tier), CLASH)))
    expect([...days], 'the shoot\'s length follows the draw again').toEqual([SHOOT_DAYS])
  })

  it('a week she is entered in nothing has no shooting day to price (a hand-built world, never a live one)', () => {
    const world = tierWorld('r45-1b-none', 'local')
    expect(clashShootDays(world, CLASH)).toBe(SHOOT_DAYS)
    world.entries = []
    expect(clashShootDays(world, CLASH), 'no entry, no collision – nothing to price').toBe(0)
  })
})
