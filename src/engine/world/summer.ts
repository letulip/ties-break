// THE SUMMER TRAINING BLOCK - nine weeks with no school in them, and what the engine does about it.
//
// THE OWNER'S RULING (W3-SUMMER), correcting an objection rather than proposing a feature: «я играл и
// брал отпуска между турнирами пропуская и коучинговые сессии в том числе, если мы летом сделаем
// реальную нагрузку с 2 тренировками в день я не вижу ничего плохого, это как раз частично
// компенсирует недостаток тренерских недель в другие периоды, т.е. сделает прокачку эффективнее и
// более полной.»
//
// ⚠ IT IS VOLUME, NOT A BETTER MULTIPLIER, and everything in this file follows from that. She has no
// school, so she is on court twice a day rather than once; the week is FULLER, not luckier. So it
// lands on `growWeek`'s `loadFactor` - the knob whose own note says it means "HOW MUCH OF THE WEEK
// SHE ACTUALLY TRAINED" - and on the condition accumulator, and it touches neither the coach, the
// plan slider nor the luck draw. A summer week develops ~40% more and costs 3 condition; the numbers
// and their argument are on `ECONOMY.summerBlock`.
//
// ⚠ AND IT IS NEVER MANDATORY, which is the half the owner's own habit demands. He takes holidays
// between tournaments and skips the coaching sessions inside them; a player who books a family week
// in July loses the block for that week and gets the package's condition gain instead. That is a
// TRADE, and the predicate below is written as a list of the five weeks that are not hers to train
// through rather than as a penalty applied to the ones that are.
//
// ⚠ RNG: nothing here draws, on any stream. Both effects are post-draw arithmetic on state the world
// already holds, so the frozen MAIN capture (41550 / e6b0c709) cannot see the block at all.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is TYPE-ONLY, so world.ts imports these values with no runtime
// cycle - the shape every `world/*.ts` leaf keeps.
import { ECONOMY } from '../economy'
import { isSummerWeek } from '../season/calendar'
import { knockRestWeek } from '../knock'
import { vacationForWeek } from './bookings'
import { isCompetitionWeek } from './knock'
import type { WorldState } from '../world'

/**
 * IS THIS WEEK A REAL SUMMER TRAINING BLOCK WEEK? The single predicate both halves read, so the
 * development bonus and the fatigue cost can never disagree about which weeks are which.
 *
 * The five refusals, and each one is a week she is not doing two sessions a day in:
 *   * it is not the holidays at all;
 *   * SHE IS HURT. A layoff is a layoff; `rollInjury` runs earlier in the tick, so this is current;
 *   * THE FAMILY IS AWAY. The booked holiday is the trade the owner's own habit describes - she
 *     loses the block, and `resolveVacation` pays her the package's rest instead;
 *   * SHE IS AT A TOURNAMENT. A competition week is already a different kind of week: it earns the
 *     match bonus and pays the tournament's own fatigue, and drawing a training block on top of it
 *     would be counting one week twice;
 *   * SHE IS RESTING A KNOCK. `knockRestWeek` writes the week off the training court entirely, and a
 *     week she is not training in cannot be a week she is training twice a day in. The two factors
 *     would otherwise multiply into something that is neither.
 */
export function summerBlockWeek(world: WorldState): boolean {
  if (!isSummerWeek(world.week)) return false
  if (world.injury !== null) return false
  if (vacationForWeek(world, world.week) !== undefined) return false
  if (isCompetitionWeek(world)) return false
  if (knockRestWeek(world.knock, world.week)) return false
  return true
}

/** The multiplier the block puts on `growWeek`'s whole rate, or exactly 1 on every other week - so a
 *  career that never sees a summer training week is byte-identical to the one it was. */
export function summerLoadFactor(world: WorldState): number {
  return summerBlockWeek(world) ? ECONOMY.summerBlock.loadFactor : 1
}

/** ...and what the fuller week costs her, in condition points, or 0. Integer, like every other term
 *  in the accumulator. Applied BESIDE `accrueCondition` (see the knob's own note for why it is not
 *  applied inside it). */
export function summerConditionCost(world: WorldState): number {
  return summerBlockWeek(world) ? ECONOMY.summerBlock.conditionCost : 0
}
