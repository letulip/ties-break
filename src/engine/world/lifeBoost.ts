// ⭐⭐ ROUND 46 #22 – THE DEV LIFE-EVENT BOOST, the one switch behind the owner's ask.
//
// The owner, round 46 (05.10, verbatim): «хотел дождаться, чтобы она родила, но так и не случилось
// - может быть в целях разработки можно в найстройках сделать переключатель, поднимающий шансы
// наступления этих событий в разы для отладки?» The design was DECIDED before this file existed
// (docs/rounds/round-46.md, bundle B1) and this is that design, not a new one.
//
// ⚠ TRANSIENT BY CONSTRUCTION. A module-level flag in the WORKER's realm, set by the dev command
// `devLifeBoost` and gone with the worker. It is on no `WorldState`, so it is in no save, no golden
// fixture and no hash: a career played under it carries the OUTCOMES (an early wedding is a real
// wedding), never the switch. The worker is a single-world session, so a module-level flag is the
// honest size of this – a per-world field would be persisted state wearing a «transient» label.
//
// ⚠ IT MULTIPLIES THE PROBABILITY AT THE COMPARE AND NOWHERE ELSE. Every hazard it touches already
// rolls ONE uniform on its own purpose-scoped sub-stream (`seed:life:wedding:<week>` and its
// siblings) and takes ZERO draws on an ineligible week; the boost changes only the right-hand side
// of `u >= p`. So (1) the uniform a week sees is the SAME uniform with the switch on or off, which
// makes «ON can only bring an event earlier under one seed, never later» a theorem rather than a
// hope (`u < p` implies `u < 8p`); (2) MAIN is never tapped – none of these hazards takes an rng
// parameter at all; and (3) OFF is `p * 1`, bit-identical in IEEE-754, so the regression arm is
// byte-identity rather than closeness. `tests/life-moment-boost.test.ts` holds all three.
//
// ⚠ WHAT IT DELIBERATELY DOES NOT BOOST: the ENDING hazard (`rollEnds`) – a debug switch that made
// attachments collapse eight times as often would defeat its own purpose – and every GATE. Age, the
// episode's depth and the cooldowns stay exactly as they were, so a boosted career still cannot
// marry at twenty-one; it waits the same years for the gate and far less for the roll.
//
// ⚠ A leaf: it imports nothing, so every hazard module may import it without a cycle.

/** «в разы» – eight, the factor the decided design named. One constant so the More screen's label
 *  and the tests read the number from here. */
export const LIFE_EVENT_BOOST_FACTOR = 8

let factor = 1

/** The ONE writer – the worker's dev command. `false` restores exactly 1, not «a small number». */
export function setLifeEventBoost(on: boolean): void {
  factor = on ? LIFE_EVENT_BOOST_FACTOR : 1
}

/** Is the switch on right now – what the snapshot reports so the More screen shows the worker's own
 *  state rather than a belief of its own. */
export function lifeEventBoostOn(): boolean {
  return factor !== 1
}

/** The right-hand side of a big-life-event hazard's compare. With the switch off it returns `p`
 *  bit for bit (`p * 1`). Takes the probability and returns a probability: no gate, no draw. */
export function boostedChance(p: number): number {
  return p * factor
}
