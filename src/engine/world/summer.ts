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
// ⚠ AND SINCE W4-SCHOOL THE SAME FILE OWNS THE WEEK AFTER SCHOOL, because it is the same week. The
// owner: «Школа должна когда-то закончиться... а тренировки и прогресс должны удвоиться». Once the
// last school year is over, EVERY week has no school in it - so the summer block's predicate stopped
// being about the summer and started being about school, which is what it was always describing.
// One predicate, one set of refusals, two windows: the holidays while she is still at school, and
// the whole year once she is not. `ECONOMY.school.loadFactor` is a knob of its own only because its
// window is four times as wide and had to be swept separately (docs/specs/school-ends-2026-08.md).
import { ECONOMY } from '../economy'
import { dayCapacity, doublingShare, planWeek } from '../plan'
import { isSummerWeek } from '../season/calendar'
import { schoolIsOver } from '../kidLife'
import { knockRestWeek } from '../knock'
import { vacationForWeek } from './bookings'
import { isCompetitionWeek } from './knock'
import type { WorldState } from '../world'

/** Is she out of school this week? The world's own answer, so no caller re-derives it. */
export function pastSchool(world: WorldState): boolean {
  return schoolIsOver(world.week, world.profile.birthMonth)
}

/**
 * IS THIS WEEK A REAL SCHOOL-FREE TRAINING WEEK? The single predicate both halves read, so the
 * development bonus and the fatigue cost can never disagree about which weeks are which.
 *
 * The five refusals, and each one is a week she is not doing two sessions a day in:
 *   * SCHOOL HAS IT. Neither the holidays nor past the last grade, so the lessons are on;
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
  if (!isSummerWeek(world.week) && !pastSchool(world)) return false
  if (world.injury !== null) return false
  if (vacationForWeek(world, world.week) !== undefined) return false
  if (isCompetitionWeek(world)) return false
  if (knockRestWeek(world.knock, world.week)) return false
  return true
}

// =================================================================================================
// ⚠⚠ v47 – THE BONUS FOLLOWS THE DOUBLING, NOT THE CALENDAR (docs/specs/training-dials.md §3)
// =================================================================================================
//
// THE OWNER RULED THIS IN ADVANCE, 10.08: «да.» So the bench measures the SIZE of the change, not
// whether to make it – see docs/specs/training-dials.md §12 item 1, whose fallback stays available
// only if the sweep says the magnitude is wrong.
//
// THE ARGUMENT IS DOUBLE-COUNTING, and it only became true when the player could act. Until v47 the
// +40% and the -3 were a property of the WINDOW: granted automatically to every school-free training
// week, whether or not she was actually on court twice a day, because there was no way for anybody to
// decide that she was. The read-out has been claiming «N days on, two sessions a day» over a plan that
// could not express it. Now the plan can. Paying the bonus regardless would pay him for a choice he
// did not make, and would leave the doubled week and the undoubled one identical – i.e. it would make
// the new control decoration on the one axis where it has real teeth.
//
// SO: A FULLY DOUBLED SCHOOL-FREE WEEK REPRODUCES 1.4 AND -3 EXACTLY, and an undoubled one gets 1.0
// and 0. `doublingShare` is the interpolation and it is the only new arithmetic in the file.
//
// ⚠ AND A MIGRATED CAREER IS NEVER DOUBLED. The v46 -> v47 migration lays one session on each session
// day and never two – it may not invent a doubled week his old plan never stated – so a loaded career's
// school-free weeks come back at 1.0 until he ticks a second session onto a day. That is the single
// most consequential consequence of this slice, it is measured on `school-ends-2026-08.md`'s own
// harness (tools/school-bench.ts §4), and it is the reason the byte-identity claim in §10 is scoped to
// the weeks the block does not touch.
//
// ⚠ RNG: still nothing here draws, on any stream. `doublingShare` counts array lengths.

/** The multiplier the block puts on `growWeek`'s whole rate, or exactly 1 on every other week - so a
 *  career that never sees a school-free training week is byte-identical to the one it was.
 *
 *  ⚠ THE TWO WINDOWS NEVER STACK. Past school every week is school-free, holidays included, so the
 *  post-school factor is read FIRST and a September at nineteen and a July at nineteen are the same
 *  week - which they are. */
export function summerLoadFactor(world: WorldState): number {
  if (!summerBlockWeek(world)) return 1
  const full = pastSchool(world) ? ECONOMY.school.loadFactor : ECONOMY.summerBlock.loadFactor
  return 1 + (full - 1) * doublingShare(planWeek(world.plan))
}

/** ...and what the fuller week costs her, in condition points, or 0. Integer, like every other term
 *  in the accumulator. Applied BESIDE `accrueCondition` (see the knob's own note for why it is not
 *  applied inside it).
 *
 *  ⚠ §12 ITEM 2 – WHAT A PARTLY DOUBLED WEEK COSTS. `summerBlock.conditionCost = 3` is the price of a
 *  FULLY doubled week and the middle needed a rule; this is it, and it satisfies both constraints the
 *  spec set. It stays INTEGER («no fractions», the owner's own round-9 redesign of the accumulator),
 *  and it reproduces 0 and the full charge at the two ends exactly. A six-session week doubling one of
 *  its three possible days pays 1. */
export function summerConditionCost(world: WorldState): number {
  if (!summerBlockWeek(world)) return 0
  const full = pastSchool(world) ? ECONOMY.school.conditionCost : ECONOMY.summerBlock.conditionCost
  return Math.round(full * doublingShare(planWeek(world.plan)))
}

/** HOW MANY SESSIONS ONE DAY OF THIS WEEK MAY HOLD – one at school, two without. The world's own
 *  answer, so the screen never re-derives the predicate and the plan tab's capacity dots and the
 *  engine's doubling can never disagree about which week is which.
 *
 *  ⚠ IT IS `summerBlockWeek`, THE WHOLE PREDICATE, refusals included. §3 says so explicitly: one
 *  session on «the days `summerBlockWeek()` already refuses: injured, at a tournament, on a booked
 *  family week, or resting a knock». A week she is not training through is not a week she is training
 *  through twice. */
export function summerDayCapacity(world: WorldState): number {
  return dayCapacity(summerBlockWeek(world))
}
