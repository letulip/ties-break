// A-06 / T6.10 – `world/lifeBeat.ts` §16 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ THE FIRST HAZARD MODULE THAT NEEDS THE HUB, AND THAT IS WHY IT COULD NOT MOVE IN T6.8. The two
// sections T6.8 did move (§9 the leak, §10 the booth) reference nothing in the hub, so the hub could
// keep re-exporting their names for the barrel's sake. §16 calls `raiseLifeBeat` and `kidAgeNow`, so
// it imports the hub – and a hub re-export on top of that is an edge hub → kind against the edge
// kind → hub, which `tests/import-cycles.test.ts` refuses. T6.8 measured the pair with a real arm:
//
//     cycle over 2 modules:
//         src/engine/world/lifeBeat.ts       -> src/engine/world/lifeBeat/_arm.ts  { armRollBereavement }
//         src/engine/world/lifeBeat/_arm.ts  -> src/engine/world/lifeBeat.ts       { raiseLifeBeat }
//
// ⭐ SO THE BARREL TAKES THESE THREE NAMES FROM HERE, NOT FROM THE HUB (CLAUDE.md, the life-beat
// rule): `src/engine/world.ts` imports them off `./world/lifeBeat/bereavement` and re-exports them on
// the SAME export statement as before, so the barrel's frozen name set (T6.6's
// `tests/principles-a03-barrel-surface.test.ts`) does not move a single specifier of its own.
// `world/phaseHerWeek.ts` – the only other caller – asks this module for `rollBereavement` directly.
// The edge is now world.ts → bereavement → lifeBeat, and the hub reaches `world.ts` only through
// `import type`, which TypeScript erases. No cycle.
//
// ⚠ `WorldState` COMES FROM `../state`, THE MODULE THAT DECLARES IT, and never from the barrel:
// `tests/principles-a03-type-import-ratchet.test.ts` grandfathers the `world/*` files that predate
// that rule and fails a NEW one, so this file gets it right on arrival.
//
// ⚠ AND IT SITS FLAT IN `world/lifeBeat/`, which is A-06's own shape and the premise the hub's line
// ceiling is written on – a new beat KIND is a new module here, not a directory deeper.
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { kidAgeNow, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// =================================================================================================
// 16. A DEATH IN THE FAMILY – ⚠⚠ THE WORLD'S DICE, NEVER HER PERSONALITY'S (the weight, wave 11: T5)
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §4, his 23.08 «вплести похороны» and the numbers he drafted on
// 11.09, RULED as drafted constants on 22.09 (question 3). It is §16 for §14's and §15's own stated
// reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S SECOND STREAM, RESERVED IN WRITING ON 11.09 AND CREATED HERE:
//
//     seed:life:loss:<week>                 does somebody die, this week
//
// ⚠ IT IS THE KEY HE NAMED THAT DAY and it is deliberately NOT the pregnancy loss's
// `seed:life:pregnancy-loss:<conceivedWeek>:<week>` (§15). Two different facts may never share a
// key, and these two live in the same file under nearly the same word.
//
// ⚠⚠ THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN. A death is the world's
// dice; only the RESPONSE is hers – intensity prices depth (and therefore duration, under the
// one-rate law), openness prices expression. `bereavementChanceAt` takes NO ARGUMENTS AT ALL, which
// is the read-set fence pushed as far as it goes, and `tests/wave11-bereavement.test.ts` §B sweeps
// all four temperaments on shared seeds and asserts the realised weeks are identical.

/** ⭐⭐ THE WEEKLY CHANCE, AND IT IS A CONSTANT – his 11.09 0.08%/week, RULED 22.09 as a drafted
 *  number. Pure, zero draws, no writes, and it takes nothing.
 *
 *  ⚠⚠ A FUNCTION AND NOT A BARE CONSTANT READ, for `pregnancyChanceAt`'s own reason: `rollBereavement`
 *  returns on the CHANCE before it derives the stream, so «zero draws on an ineligible week» needs
 *  something to return on. It is also where a later retune would put a shape if one is ever ruled,
 *  and a reader looking for «what can move this number» finds one place rather than a grep. */
export function bereavementChanceAt(): number {
  return ECONOMY.weight.bereavement.perWeek
}

/** ⭐⭐ THE GATE – FOUR CLAUSES, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  1. ⭐⭐⭐ **THE SWITCH.** `world.weightEnabled`, RULED 22.09. Off means no draw at all.
 *  2. ⭐⭐ **THE ADULT RUNG** – `kidAgeExact >= ECONOMY.weight.bereavement.fromAgeYears` (23), his
 *     23.08 «начиная со ступени adult». ⚠ THE ASSET ENFORCES WHAT THE GATE PROMISES:
 *     `fem-euro-brunnet-adult-funeral.webp` exists at the `adult` band and nowhere else, so a
 *     bereavement below the rung would have no picture to wear. The 11.09 log says exactly that.
 *  3. ⭐⭐ **THE CAP** – `bereavementWeeks.length < capPerCareer` (2). A hard cap and not a shaped
 *     decay: past two the arc stops being a life and starts being a theme.
 *  4. ⭐⭐ **THE SPACING** – at least `spacingWeeks` (156) since the last one. Two deaths inside a
 *     season would read as a mechanic rather than as a life.
 *
 *  ⚠⚠ CLAUSES 3 AND 4 READ `world.bereavementWeeks` AND NEVER A DERIVED GUESS, which is the whole
 *  reason that list is persisted: a death writes no record of its own, and `spiritShock` holds ONE
 *  mark that clears itself when she recovers.
 *
 *  ⚠ AND NOTHING ABOUT HER TEMPERAMENT, HER SPIRIT, HER BOND, HER MARRIAGE OR HER SEASON IS IN HERE.
 *  That is the design law, and this gate is the half of the fence `bereavementChanceAt`'s empty
 *  signature cannot build on its own. */
export function bereavementEligible(world: WorldState): boolean {
  if (!world.weightEnabled) return false
  const b = ECONOMY.weight.bereavement
  if (kidAgeNow(world) < b.fromAgeYears) return false
  if (world.bereavementWeeks.length >= b.capPerCareer) return false
  const last = world.bereavementWeeks.reduce((w, at) => Math.max(w, at), -Infinity)
  if (world.bereavementWeeks.length > 0 && world.week - last < b.spacingWeeks) return false
  return true
}

/** ⭐⭐⭐ THE WEEKLY ROLL, AND THE ONE PLACE `spiritShock.kind` BECOMES `'bereavement'`.
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, `rollPregnancy`'s four steps inherited for the third time: the
 *  gate returns first, the CHANCE is computed second and returns if it is 0, and only then is the
 *  stream derived. Never draw-and-discard.
 *
 *  WHAT IT DOES, and the list is §4 in order:
 *    · the week joins `bereavementWeeks`, which the cap and the spacing then read;
 *    · `spiritShock` lands as `'bereavement'` – the depth is `ECONOMY.spirit.shock.bereavement`,
 *      intensity-scaled, and there is NO second recovery rate, no taper and no flag behind it
 *      (§5's one-rate law, refused in writing in `engine/spirit.ts` long before this kind existed);
 *    · the blocking card is raised, in her voice, with the funeral painting on it.
 *
 *  ⚠ THE DETAIL IS THE WEEK, as a string – machine-readable and never a rendered sentence (§G.2's
 *  law). It is the only fact the beat has, because the deceased is UNNAMED (RULED 22.09), and it is
 *  what makes two bereavements in one career distinguishable rows in `lifeLog`.
 *
 *  ⚠⚠ IT IS **NOT** ON THE ATTACHMENT MACHINERY (the design's §3e): its own shock kind, it can reach
 *  the parent in words and never in a number, and the psychologist reads the kind for free exactly
 *  as step 5 built him to. `tests/wave11-bereavement.test.ts` §D is the pin that he needed nothing.
 *
 *  ⚠ ZERO MAIN DRAWS: it takes no `Rng` and pulls only from `seed:life:loss:<week>`, so the frozen
 *  capture (41550 / e6b0c709) cannot see it. */
export function rollBereavement(world: WorldState): void {
  if (!bereavementEligible(world)) return
  const chance = bereavementChanceAt()
  if (chance === 0) return
  if (rngFromSeed(`${world.seed}:life:loss:${world.week}`)() >= chance) return
  world.bereavementWeeks.push(world.week)
  world.spiritShock = { week: world.week, kind: 'bereavement' }
  raiseLifeBeat(world, 'bereavement', String(world.week))
}
