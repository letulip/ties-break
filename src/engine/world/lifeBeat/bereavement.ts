// A-06 / T6.10 – `world/lifeBeat.ts` §16 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ bereavement: THE FIRST HAZARD MODULE THAT NEEDS THE HUB, AND THAT IS WHY IT COULD NOT MOVE IN T6.8.
// ⚠ bereavement: `WorldState` COMES FROM `../state`, THE MODULE THAT DECLARES…
// ⚠ bereavement: AND IT SITS FLAT IN `world/lifeBeat/`, which is A-06's own shape and the premise the hub's line ceiling is written…
// → docs/notes/life-beats/bereavement.md#bereavementts-header
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { kidAgeNow, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// 16. A DEATH IN THE FAMILY – ⚠⚠ THE WORLD'S DICE, NEVER HER PERSONALITY'S (the weight, wave
// 11: T5) – `docs/specs/the-weight-2026-09.md` §4, his 23.08 «вплести похороны» and the
// numbers he drafted on 11.09, RULED as drafted constants on 22.09 (question 3). It is §16 for
// §14's and §15's own stated reason: appended rather than renumbered.
//
// ⚠⚠ bereavement: THE WAVE'S SECOND STREAM, RESERVED IN WRITING ON 11.09 AND CREATED HERE
// ⚠ bereavement: IT IS THE KEY HE NAMED THAT DAY and it is deliberately NOT the pregnancy loss's…
// ⚠⚠ bereavement: THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN.
// → docs/notes/life-beats/bereavement.md#bereavementts-16--a-death-in-the-family

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
 *  owner (bereavementEligible), 23.08: «начиная со ступени adult»
 *  ⚠ bereavementEligible: THE ASSET ENFORCES WHAT THE GATE PROMISES
 *  ⚠⚠ bereavementEligible: CLAUSES 3 AND 4 READ `world.bereavementWeeks` AND NEVER A DERIVED GUESS
 *  ⚠ bereavementEligible: AND NOTHING ABOUT HER TEMPERAMENT, HER SPIRIT, HER BOND, HER MARRIAGE OR HER SEASON IS IN HERE.
 *  → docs/notes/life-beats/bereavement.md#bereavementeligible--the-gate--four-clauses-and-a-false-here-means-zero
 */
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
 *  ⚠⚠ rollBereavement: THE LINE ORDER IS THE RULE, `rollPregnancy`'s four steps inherited for the third time: gate, chance, then the stream
 *  ⚠ rollBereavement: THE DETAIL IS THE WEEK, as a string
 *  ⚠⚠ rollBereavement: IT IS **NOT** ON THE ATTACHMENT MACHINERY (the design's §3e)
 *  ⚠ rollBereavement: ZERO MAIN DRAWS: it takes no `Rng` and pulls only from `seed:life:loss:<week>`…
 *  → docs/notes/life-beats/bereavement.md#rollbereavement--the-weekly-roll--where-spiritshockkind-becomes-bereavement
 */
export function rollBereavement(world: WorldState): void {
  if (!bereavementEligible(world)) return
  const chance = bereavementChanceAt()
  if (chance === 0) return
  if (rngFromSeed(`${world.seed}:life:loss:${world.week}`)() >= chance) return
  world.bereavementWeeks.push(world.week)
  world.spiritShock = { week: world.week, kind: 'bereavement' }
  raiseLifeBeat(world, 'bereavement', String(world.week))
}
