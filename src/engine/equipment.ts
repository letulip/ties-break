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
import type { FamilyBackground, KitLine } from '../shared/protocol'
import type { MatchPlayer } from './match/types'

/** Wear per line, 0 = as new, 1 = at the end of its service life.
 *
 *  ⚠ KEYED BY `KitLine` RATHER THAN BY THREE HAND-WRITTEN FIELDS (01.08, the brand ladder). A
 *  sponsorship rung is now a LIST OF LINES it covers, and that list is typed `KitLine[]` in the
 *  protocol - so if the two were spelled separately a rung could name a line this record does not
 *  have, and the compiler would not care. One type, one set of keys. */
export type KitWear = Record<KitLine, number>

/** HOW FRESH SOMEBODY ELSE IS KEEPING HER KIT, PER LINE - a ceiling on wear for the lines a signed
 *  deal covers, and nothing at all for the lines it does not.
 *
 *  ⚠ IT IS PARTIAL, AND THAT IS THE WHOLE BRAND LADDER IN ONE TYPE. Before this slice there was one
 *  rung, it supplied all three lines, and the cap was a single number; the rungs above it supply
 *  different SUBSETS, so an absent key has to mean "this line is hers" rather than "no cap given". A
 *  scalar could not say that. */
export type KitFreshCap = Partial<KitWear>

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
 *
 * ⚠ `freshCap` IS THE ONE THING THAT IS NOT DERIVED, and it is deliberately the smallest possible
 * shape of that (31.07, the kit sponsor). A signed kit deal means somebody else is supplying her, and
 * a supplied player restrings when the bed dies rather than when the budget allows - so no COVERED
 * line of her kit is allowed past this much wear while the deal runs. It is passed IN rather than
 * read off a world, so this function stays pure and every existing caller's answer is byte-identical:
 * the default is `null`, which is "nobody is supplying her", which is what every career was.
 *
 * ⚠ AND IT IS PER LINE SINCE THE BRAND LADDER (01.08). The cap used to be one number over all three
 * lines, because there was one rung and it supplied all three. It now arrives as a `KitFreshCap`
 * whose ABSENT KEYS ARE THE DESIGN: a local deal caps `strings` and says nothing about `frame`, so
 * her frame ages at exactly the rate an unsponsored girl's does. That is what makes "which of my
 * lines are covered" a real question with a cost attached, and it is why an absent key must never
 * fall back to some default cap.
 *
 * The cap only ever SUBTRACTS wear, so a sponsored girl sits between her unsponsored self and fresh
 * kit and never past it - `applyKit` can still only ever take attributes down. See engine/offers.ts
 * `kitFreshCap` for why a ceiling rather than a shorter purchase cadence.
 */
export function kitWearAt(
  seed: string,
  background: FamilyBackground,
  week: number,
  freshCap: KitFreshCap | null = null,
): KitWear {
  const e = ECONOMY.equipment
  const sinceStrings = weeksSinceGear(seed, 'stringing', background, week)
  const sinceFrame = weeksSinceGear(seed, 'rackets', background, week)
  const sinceShoes = weeksSinceGear(seed, 'shoes', background, week)
  const cap = (line: KitLine, w: number) => {
    const ceiling = freshCap?.[line]
    return ceiling === undefined ? w : Math.min(w, ceiling)
  }
  return {
    strings: cap('strings', clamp01(sinceStrings / e.stringLifeWeeks)),
    // The frame is the one line with a flat head: sound is sound, however old, and only past
    // `frameSoundWeeks` does it start being the patched racket.
    frame: cap('frame', clamp01((sinceFrame - e.frameSoundWeeks) / e.framePatchWeeks)),
    shoes: cap('shoes', clamp01(sinceShoes / e.shoeLifeWeeks)),
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
