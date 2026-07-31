// EQUIPMENT CONDITION - the three gear lines that were already billed and did nothing.
// docs/specs/equipment-and-serve-speed.md §2. The knobs, and the full argument for each of them,
// live on `ECONOMY.equipment`; this file is only the arithmetic.
//
// THE SHAPE, in one paragraph. Each line carries a CONDITION that decays with the weeks since the
// purchase already on the ledger and is restored by that purchase. Fresh kit is exactly neutral -
// every factor is 1 and every attribute comes back byte-identical, the property `applySurfaceStyle`
// established and the reason the frozen pins survive this slice. Wear only ever subtracts.
//
// ⚠ IT IS CONDITION, NOT VINTAGE (the owner's padel correction: «чиненая ракетка работает хуже, чем
// пусть и старая, но целая»). Nothing here reads the PRICE of anything. An old sound frame is fine;
// a patched one is not.
//
// ⚠ AND EQUIPMENT MUST NEVER MAKE BACKGROUND DESTINY. The wealthy family already buys better gear
// more often - that is in ECONOMY.gear's price table - so a generous coefficient here would let
// money buy strokes and would invert this project's own standing rule at the last minute. The whole
// swing is therefore sized UNDER one year of the relative age effect (SKILL_POINTS_PER_YEAR = 2.4)
// and measured by tools/kit-bench.ts before any coefficient was kept.
//
// ⚠ KID-ONLY, and deliberately. A rival has no family, no ledger and no gear purchases - her
// attributes are a drifted abstraction, not a girl with a kit bag. Giving the cohort a derived kit
// would be inventing a fact about 199 players to cancel a fact about one. The cost is that the kid
// carries a small average penalty the field does not; it is measured and reported rather than hidden
// (tools/kit-bench.ts §3).
//
// PURE, ZERO RNG. Wear is arithmetic over purchase weeks that the gear sub-streams already decide.

import { ECONOMY, weeksSinceGear } from './economy'
import type { FamilyBackground } from '../shared/protocol'
import type { MatchPlayer } from './match/types'

/** Wear per line, 0 = as new, 1 = at the end of its service life. */
export interface KitWear {
  strings: number
  frame: number
  shoes: number
}

/** As-new kit: the neutral element. `applyKit(p, FRESH_KIT)` returns `p` byte-identical. */
export const FRESH_KIT: KitWear = { strings: 0, frame: 0, shoes: 0 }

/** Fully spent kit on every line at once - the worst end of the swing. Never reached in a real
 *  career (the family always buys on its cadence); it exists so the bench can measure the bound. */
export const SPENT_KIT: KitWear = { strings: 1, frame: 1, shoes: 1 }

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/**
 * Her kit's wear at `week`, derived - NOTHING IS PERSISTED FOR THIS.
 *
 * ⚠ AND THAT IS THE HEADLINE OF THIS FILE, because it is what a schema bump would have cost. Gear
 * purchases are scheduled deterministically off per-category sub-streams from (seed, background),
 * and `resolveGear` bills them unconditionally - a family that cannot afford a restring buys it
 * anyway and goes further into the red. So the purchase weeks of a career are a pure function of
 * two things the save already holds, and condition is a pure function of those weeks. There is no
 * durable state to add, no migration, no fixture and no README row.
 */
export function kitWearAt(seed: string, background: FamilyBackground, week: number): KitWear {
  const e = ECONOMY.equipment
  const sinceStrings = weeksSinceGear(seed, 'stringing', background, week)
  const sinceFrame = weeksSinceGear(seed, 'rackets', background, week)
  const sinceShoes = weeksSinceGear(seed, 'shoes', background, week)
  return {
    strings: clamp01(sinceStrings / e.stringLifeWeeks),
    // The frame is the one line with a flat head: sound is sound, however old, and only past
    // `frameSoundWeeks` does it start being the patched racket.
    frame: clamp01((sinceFrame - e.frameSoundWeeks) / e.framePatchWeeks),
    shoes: clamp01(sinceShoes / e.shoeLifeWeeks),
  }
}

/** Per-attribute multipliers for a state of kit. 1 = untouched; every value is <= 1. */
export function kitMultipliers(wear: KitWear): Record<'serve' | 'ret' | 'stamina' | 'groundstrokes', number> {
  const e = ECONOMY.equipment
  return {
    serve: 1 - wear.strings * e.stringWear.serve - wear.frame * e.frameWear.serve,
    ret: 1 - wear.strings * e.stringWear.ret - wear.shoes * e.shoeWear.ret,
    stamina: 1 - wear.shoes * e.shoeWear.stamina,
    groundstrokes: 1 - wear.strings * e.stringWear.groundstrokes - wear.frame * e.frameWear.groundstrokes,
  }
}

/**
 * Her MatchPlayer as her kit lets her play it. Pure arithmetic, zero RNG, the input untouched -
 * the same contract `applySurfaceStyle` keeps, and an untouched attribute (`composure`, and every
 * attribute of a girl in fresh kit) comes back byte-identical.
 *
 * ⚠ THE SERVE SPEED READOUT MOVES FOR FREE HERE, and that is the point of the whole slice. The box
 * score derives km/h from the EFFECTIVE `serve` (match/serveSpeed.ts), so a dead string bed shows up
 * on the "Max serve" row without a single km/h ever being fed back into the match. Nothing is
 * counted twice: `basePServe` reads these same attributes and only these.
 */
export function applyKit(player: MatchPlayer, wear: KitWear): MatchPlayer {
  const m = kitMultipliers(wear)
  return {
    ...player,
    serve: player.serve * m.serve,
    ret: player.ret * m.ret,
    stamina: player.stamina * m.stamina,
    groundstrokes: player.groundstrokes * m.groundstrokes,
  }
}

/**
 * The injury half of the shoes: what worn soles do to the weekly injury threshold.
 *
 * 1 in new shoes, rising to `1 + shoeInjuryRise` at the end of their life. Applied POST-DRAW inside
 * `injuryTau`, exactly like the vacation recovery buff and the knock factor - the occurrence roll is
 * already drawn by then, so this moves whether she gets hurt and never which numbers come out of any
 * stream. Shoe cadence is background-neutral, so this is the one equipment effect that is the same
 * for every family by construction: nobody buys their way out of a rolled ankle.
 */
export function kitInjuryFactor(wear: KitWear): number {
  return 1 + wear.shoes * ECONOMY.equipment.shoeInjuryRise
}
