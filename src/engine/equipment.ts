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
// ⚠⚠ AND THAT BOUND SURVIVED THE QUALITY LADDER *STRUCTURALLY*, WHICH IS THE HEADLINE OF W3-KIT.
// The player now chooses a rung per line (`KitGrade`: alloy / composite / performance / pro), and a
// rung does exactly two things - it starts a line partway down its own wear curve, and it stretches
// or shortens that curve. Both land INSIDE the `clamp01` below, so every state the ladder can reach
// is a state the wear model could already reach and the whole ladder lives inside
// [FRESH_KIT, SPENT_KIT]. MEASURED, tools/kit-bench.ts on this branch:
//
//     nominal swing, fresh -> fully spent   2.01 skill points  <  2.40 (one year of relative age)
//     ...and it is UNCHANGED by the ladder, because the ladder cannot leave that interval;
//     realised swing, alloy -> pro          1.02 skill points  <  2.26 (the whole coach ladder)
//
// The second number is what the ladder is actually WORTH to a career, and it is the one to watch: it
// is a choice the parent makes, not an accident of birth, and it is still smaller than the coach.


//
// ⚠ KID-ONLY, and deliberately. A rival has no family, no ledger and no gear purchases - her
// attributes are a drifted abstraction, not a girl with a kit bag. Giving the cohort a derived kit
// would be inventing a fact about 199 players to cancel a fact about one. The cost is that the kid
// carries a small average penalty the field does not; it is measured and reported rather than hidden
// (tools/kit-bench.ts §3).
//
// PURE, ZERO RNG. Wear is arithmetic over purchase weeks that the gear sub-streams already decide.

import { ECONOMY, weeksSinceGear, type GearCategory } from './economy'
import type { FamilyBackground, KitGrade, KitGrades, KitLine, KitState } from '../shared/protocol'
import type { MatchPlayer } from './match/types'

/** THE LADDER'S OWN ORDER, worst first. The one place "up" and "down" are defined - `setKitGrade`
 *  reads it to decide whether a move is a purchase or a downgrade, and the Money screen draws the
 *  rungs in it. A rung inserted anywhere but the ends re-prices every save holding a rung above it,
 *  which is why the sequence is written down once. */
export const KIT_GRADES: readonly KitGrade[] = ['alloy', 'composite', 'performance', 'pro']

/** ⚠ WHICH BILL IS WHICH LINE - the equipment model's vocabulary (`KitLine`: strings / frame / shoes,
 *  what the MATCH reads) against the ledger's (`GearCategory`: stringing / rackets / shoes, what the
 *  FAMILY pays). ONE map, and it lives here rather than in world.ts (where it was born) because the
 *  price of a rung has to be answerable from the equipment model itself now - `kitLinePriceCents`
 *  below is called from the snapshot and from the till, and world.ts is downstream of both.
 *
 *  Apparel is deliberately absent from the values: it is not a line the match reads, no rung can
 *  cover it, and no quality ladder is offered on it. */
export const GEAR_CATEGORY_LINE: Partial<Record<GearCategory, KitLine>> = {
  stringing: 'strings',
  rackets: 'frame',
  shoes: 'shoes',
}

/** ...and the way back, derived from the map above so the two can never disagree. */
export const LINE_GEAR_CATEGORY: Record<KitLine, GearCategory> = {
  strings: 'stringing',
  frame: 'rackets',
  shoes: 'shoes',
}

/** Every line on the ladder's second rung: the game exactly as it shipped, and what a career from
 *  before W3-KIT migrates onto. Also the default for every pure caller that does not care. */
export const DEFAULT_KIT_GRADES: KitGrades = { strings: 'composite', frame: 'composite', shoes: 'composite' }

/** A brand-new career's kit, and a migrated one's: the shipped rung on every line, and no
 *  over-the-counter purchase behind her. */
export function defaultKitState(): KitState {
  return { grade: { ...DEFAULT_KIT_GRADES }, sinceWeek: { strings: 0, frame: 0, shoes: 0 } }
}

/** WHAT ONE PURCHASE OF `line` COSTS at `grade`, in cents. The MID of the background's own band from
 *  `ECONOMY.gear` times the rung's price factor - so the wealth corridor still sets the base (a
 *  wealthy family's frames were always dearer) and the rung multiplies it, exactly as the brief asks.
 *
 *  ⚠ DETERMINISTIC AND DRAW-FREE, deliberately. The recurring bill `resolveGear` charges is a real
 *  draw off `seed:gear:<category>` and stays one; this is the SHOP WINDOW, and a price that re-rolled
 *  every time the screen re-rendered would be a price nobody could act on. Same argument
 *  `vacationPriceCents` makes for quoting from a fixed (seed, week) key. */
export function kitLinePriceCents(background: FamilyBackground, line: KitLine, grade: KitGrade): number {
  const [lo, hi] = ECONOMY.gear[LINE_GEAR_CATEGORY[line]].priceCents[background]
  return Math.round(((lo + hi) / 2) * ECONOMY.equipment.grades[grade].priceFactor)
}

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
 *
 * ⚠ AND `kit` IS THE SECOND THING THAT IS NOT DERIVED (W3-KIT, schema v37) - the rung the PLAYER
 * chose per line, plus the week she was last handed a new one of them over the counter. It is
 * OPTIONAL and defaults to `null`, which reads as "the shipped rung, and no hand purchase" - so every
 * existing caller, every test and every pure probe gets a byte-identical answer and the migration is
 * a no-op on wear by construction.
 *
 * The rung does exactly two things and both are inside the `clamp01` below:
 *   `startWear`  where on this line's curve a brand-new one of these STARTS. An alloy frame is
 *                bought at 0.40 of a service life, which is the honest sentence about it: it plays
 *                like a good frame that is already partly gone.
 *   `lifeFactor` how long the curve is. Cheap kit dies faster, tour kit barely at all.
 * Because both live under the clamp, the ladder can never take her past `SPENT_KIT` or above
 * `FRESH_KIT` - the anti-destiny bound at the top of this file is structural, not tuned.
 *
 * ⚠ `sinceWeek` IS A SECOND CLOCK, NOT A SECOND SCHEDULE. The family's recurring buys are untouched -
 * same sub-stream, same cadence, same bills - and this is only the over-the-counter purchase the
 * player made, so a frame bought this week reads as new this week. The line takes whichever of the
 * two purchases is MORE RECENT, which is what "she is holding the newer one" means. Zero means she
 * has never bought by hand, and `week - 0 = week` is exactly what `weeksSinceGear` returns before the
 * first scheduled hit - so the min is a no-op there too.
 */
export function kitWearAt(
  seed: string,
  background: FamilyBackground,
  week: number,
  freshCap: KitFreshCap | null = null,
  kit: KitState | null = null,
): KitWear {
  const e = ECONOMY.equipment
  const grade = kit?.grade ?? DEFAULT_KIT_GRADES
  const since = (line: KitLine, category: GearCategory) => {
    const scheduled = weeksSinceGear(seed, category, background, week)
    const bought = kit ? week - kit.sinceWeek[line] : scheduled
    return Math.min(scheduled, Math.max(0, bought))
  }
  const sinceStrings = since('strings', 'stringing')
  const sinceFrame = since('frame', 'rackets')
  const sinceShoes = since('shoes', 'shoes')
  const cap = (line: KitLine, w: number) => {
    const ceiling = freshCap?.[line]
    return ceiling === undefined ? w : Math.min(w, ceiling)
  }
  const rung = (line: KitLine) => e.grades[grade[line]]
  return {
    strings: cap(
      'strings',
      clamp01(rung('strings').startWear.strings + sinceStrings / (e.stringLifeWeeks * rung('strings').lifeFactor)),
    ),
    // The frame is the one line with a flat head: sound is sound, however old, and only past
    // `frameSoundWeeks` does it start being the patched racket. ⚠ THE RUNG STRETCHES BOTH HALVES -
    // a tour frame stays sound longer AND takes longer to become the patched one - which is what
    // keeps "sound is sound" true at every rung instead of only at the shipped one.
    frame: cap(
      'frame',
      clamp01(
        rung('frame').startWear.frame +
          (sinceFrame - e.frameSoundWeeks * rung('frame').lifeFactor) /
            (e.framePatchWeeks * rung('frame').lifeFactor),
      ),
    ),
    shoes: cap('shoes', clamp01(rung('shoes').startWear.shoes + sinceShoes / (e.shoeLifeWeeks * rung('shoes').lifeFactor))),
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
 * The injury half of the kit: what worn soles and a dead frame do to the weekly injury threshold.
 *
 * 1 in new kit, rising to `1 + shoeInjuryRise + frameInjuryRise` with both lines at the end of their
 * life. Applied POST-DRAW inside `injuryTau`, exactly like the vacation recovery buff and the knock
 * factor - the occurrence roll is already drawn by then, so this moves whether she gets hurt and
 * never which numbers come out of any stream.
 *
 * ⚠ THE SHOES' BACKGROUND-NEUTRALITY GUARD IS RE-AIMED, NOT DROPPED (W3-KIT). It used to read
 * "nobody buys their way out of a rolled ankle", and its evidence was that `ECONOMY.gear.shoes` has
 * the same 10-14 week cadence for every family so only the price differed. That is still true OF THE
 * CADENCE, and it is no longer the whole story: the owner asked for a quality ladder the player buys
 * («экип влияет и на травмы»), so a family that spends on `performance` or `pro` shoes really does
 * get a lower threshold. What the guard protects now is the shape of that, and the shape holds:
 *   * the FLOOR is new kit, at exactly 1 - the top rung cannot go below it, so no amount of money
 *     buys a safety BONUS, it only buys back the penalty of playing on worn kit;
 *   * it is a CHOICE and not a background. A working family that puts its gear budget into shoes gets
 *     precisely what a wealthy one does, and pays the same corridor-scaled multiple of its own bill.
 * The prevalence cost of each rung is measured in tools/fatigue-bench.ts against the researched
 * 46-54%/season band rather than asserted here.
 *
 * ⚠ THE FRAME HALF IS NEW AND DELIBERATELY SMALL. A stiff dead frame is a tennis-elbow story, which
 * is the honest reason equipment hurts arms at all; it is priced at 0.12 against the shoes' 0.20 on
 * the research's own 48%-lower-limb / 28%-upper split, and realised frame wear on a career that buys
 * on cadence is 0.04 or less - so it multiplies tau by ~1.005 for every shipped save and only bites
 * on the rung a player has to choose. See `ECONOMY.equipment.frameInjuryRise`, including what it
 * deliberately does NOT do (steer which part gets hurt).
 */
export function kitInjuryFactor(wear: KitWear): number {
  const e = ECONOMY.equipment
  return 1 + wear.shoes * e.shoeInjuryRise + wear.frame * e.frameInjuryRise
}
