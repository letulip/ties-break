// A-06 / T6.10 – `world/lifeBeat.ts` §15 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ weight: TWO OF THE WAVE-11 STREAMS LIVE IN THIS PACKAGE NOW AND THEY MUST NOT BE CONFUSED.
// ⚠ weight: ALL THREE ARE READ BY T3.9's INVENTORY
// ⚠ THE HAZARD DIRECTION, as `bereavement.ts`'s header sets it out: this module imports the hub (`kidAgeNow`)…
// ⚠ weight: `setWeightEnabled` TRAVELS WITH THE SECTION AND THAT IS NOT A TIDY-UP.
// → docs/notes/life-beats/weight.md#weightts-header
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { temperamentFor } from '../../spirit'
import { addEvent } from '../ledger'
import { guardNotEndedForGood } from '../constants'
import { kidAgeNow } from '../lifeBeat'
import type { Temperament } from '../../spirit'
import type { WorldState } from '../state'

// 15. THE WEIGHT – ⚠⚠ THE SWITCH, THE HIDDEN WINDOW, AND THE TWO GRIEFS (wave 11) –
// `docs/specs/the-weight-2026-09.md` is the canon,
// `docs/plans/life-wave-11-builder-2026-09.md` the step-by-step, and
// `docs/design/the-months-before-she-says-2026-09.md` the design underneath. It is §15 for
// §14's own stated reason: appended rather than renumbered.
//
// ⚠⚠ weight: THE ONE THING THIS SECTION MUST NEVER MODEL IS THE PARENT AS THE CAUSE
// → docs/notes/life-beats/weight.md#weightts-15--the-weight

/** ⭐⭐⭐ v87 – THE SWITCH, BOTH WAYS, AND ITS ONE WRITER OUTSIDE `createWorld` (RULED 22.09:
 *  «only for the weight, set at new-career creation (the creation flow ASKS), changeable both
 *  ways in settings later»). `setCoachOnEventWeeks`'s shape (`world/coachMarket.ts`) and
 *  nothing more.
 *
 *  ⚠⚠ setWeightEnabled: RE-AIMED 26.09 (B-P3-01), AND THE SHAPE CLAIM IS NOW **HALF** TRUE
 *  ⚠ setWeightEnabled: NO COPY WAS WRITTEN FOR ANY OF THIS
 *  ⚠⚠ setWeightEnabled: IT WRITES ONE FIELD AND DELETES NOTHING, WHICH IS THE **OTHER HALF OF THE RULING**
 *  ⚠ setWeightEnabled: AND THERE IS NO «EFFECTIVE FROM NEXT WEEK» ANYWHERE.
 *  ⚠ setWeightEnabled: ZERO DRAWS: one assignment.
 *  → docs/notes/life-beats/weight.md#setweightenabled--v87--the-switch-both-ways-and-its-one-writer
 */
export function setWeightEnabled(world: WorldState, on: boolean): void {
  // ⚠ W2-ENDINGS (added 26.09, B-P3-01): the career must still have a next week. The engine
  // re-validates every command because the worker is not the gate – a tab left open behind the
  // epilogue must not be able to flip a career setting for a girl who has retired.
  //
  // ⚠⚠ setWeightEnabled: `guardNotEndedForGood` AND NOT `guardNotEnded`, AND THAT IS THE RULING'S INTENT RATHER THAN AN EXCEPTION…
  // ⚠⚠ setWeightEnabled: DO NOT "TIDY" THIS BACK TO `guardNotEnded` FOR SYMMETRY WITH THE EIGHTEEN.
  // → docs/notes/life-beats/weight.md#setweightenabled--w2-endings-2609-b-p3-01--the-career-must-still-have-a-next-week
  guardNotEndedForGood(world)
  world.weightEnabled = on
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T4) – **HER WEEKLY CHANCE OF LOSING IT, GIVEN HER AGE AND
 *  NOTHING ELSE.** Pure, zero draws, no writes, and **it takes no `WorldState` at all** – which
 *  is the boundary law written into the signature rather than into a comment.
 *
 *  ⚠⚠ pregnancyLossChanceAt: THE READ-SET IS THE WHOLE POINT OF THIS FUNCTION'S SHAPE.
 *  ⚠ pregnancyLossChanceAt: THE LAST RUNG WHOSE `fromAge` SHE HAS REACHED WINS
 *  → docs/notes/life-beats/weight.md#pregnancylosschanceat--v87-t4--her-weekly-chance-of-losing-it
 */
export function pregnancyLossChanceAt(ageYears: number): number {
  let perWeek = 0
  for (const rung of ECONOMY.weight.lossPerWeekByAge) if (ageYears >= rung.fromAge) perWeek = rung.perWeek
  return perWeek
}

/** ⭐⭐⭐ v87 T4 – **IS THIS A WEEK THE LOSS HAZARD RUNS AT ALL.** Pure, zero draws, no writes,
 *  and a `false` here means ZERO DRAWS rather than a discarded one – `pregnancyEligible`'s own
 *  law, and the reason this is a predicate of its own: a reader must see, in ONE place, that
 *  the whole of eligibility is decided before any stream exists.
 *
 *  ⚠⚠ pregnancyLossEligible: **THE WEEK IS INSIDE THE RESEARCH'S OWN WINDOW**…
 *  ⚠ pregnancyLossEligible: AND NOTHING ABOUT HER PLAN, HER TRAVEL, HER SPIRIT, HER BOND OR HIS ANSWER IS IN HERE
 *  → docs/notes/life-beats/weight.md#pregnancylosseligible--v87-t4--is-this-a-week-the-loss-hazard-runs-at-all
 */
export function pregnancyLossEligible(world: WorldState): boolean {
  if (!world.weightEnabled) return false
  const pregnancy = world.pregnancy
  if (pregnancy === null) return false
  const since = world.week - pregnancy.conceivedWeek
  return since >= ECONOMY.weight.lossFromWeek && since < ECONOMY.weight.lossUntilWeek
}

/** ⭐⭐⭐ v87 T4 – **THE WEEKLY ROLL, AND THE ONE PLACE A PREGNANCY ENDS WITHOUT A BIRTH.**
 *
 *  ⚠⚠ rollPregnancyLoss: THE LINE ORDER IS THE RULE, `rollPregnancy`'s own four steps inherited whole – never draw-and-discard
 *  ⚠ rollPregnancyLoss: THE KEY IS THE PREGNANCY'S OWN IDENTITY PLUS THE WEEK
 *  ⚠⚠ rollPregnancyLoss: IT IS DELIBERATELY NOT `seed:life:loss:<week>`
 *  ⚠ rollPregnancyLoss: `<` AND NOT `<=`, `rollPregnancy`'s own note: `rngFromSeed` can return exactly 0…
 *  ⚠⚠ rollPregnancyLoss: IT WRITES THE SHOCK AND `accrueSpirit` PRICES IT THE SAME WEEK
 *  → docs/notes/life-beats/weight.md#rollpregnancyloss--v87-t4--the-weekly-roll-the-one-place-a-pregnancy-ends-without-a-birth
 */
export function rollPregnancyLoss(world: WorldState): void {
  if (!pregnancyLossEligible(world)) return
  const chance = pregnancyLossChanceAt(kidAgeNow(world))
  if (chance === 0) return
  const pregnancy = world.pregnancy!
  if (rngFromSeed(`${world.seed}:life:pregnancy-loss:${pregnancy.conceivedWeek}:${world.week}`)() >= chance) return
  const told = world.week >= pregnancy.announcedWeek
  world.pregnancy = null
  world.pregnancyLossWeeks.push(world.week)
  // ⚠ THE MARK IS WRITTEN AFTER THE RECORD IS CLEARED AND THE ORDER IS FREE: nothing between these
  // lines reads either. Written this way round so the clear reads as the event and the rest as its
  // consequences.
  world.spiritShock = { week: world.week, kind: 'loss' }
  const line = lossLineFor(world, told)
  if (line === null) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    lifeKind: 'expecting',
    // ⚠ NO AMOUNT AND NO PRICE IN THE WORDS (§3j's rule 4). ⚠ `keep: true` for the pause row's own
    // reason: `pruneEvents` drops ordinary rows at sixty weeks and this arc is longer than that.
    text: line,
  })
}

/** ⭐⭐⭐ v87 T4 – **WHAT SHE SAYS, OR THE SILENCE THAT IS THE TELLING.** ⚠ ⚠ DRAFT – every word
 *  is the builder's draft for the owner (invariant 4), listed verbatim in the wave's report.
 *
 *  ⚠⚠ lossLineFor: `null` IS A FIRST-CLASS ANSWER AND IS THE DESIGN'S STRONGEST SCENE, not a gap in the pool.
 *  ⚠ lossLineFor: RULED 22.09 (question 2): «both branches build – open tells, private is silence»…
 *  ⚠ lossLineFor: TWO CELLS PER OPEN VOICE, AND THE SECOND IS WHAT THE HIDDEN WINDOW MADE REACHABLE.
 *  ⚠ lossLineFor: NO NAME AND NO GENDER FOR THE ONE SHE MARRIED (§3g/§3h), NO SEX FOR THE CHILD
 *  ⚠ lossLineFor: AND NO LINE LINKS IT TO ANYTHING HE SAID.
 *  → docs/notes/life-beats/weight.md#losslinefor--v87-t4--what-she-says-or-the-silence-that-is-the-telling
 */
function lossLineFor(world: WorldState, told: boolean): string | null {
  const voice = temperamentFor(world.seed, world.dynasty?.motherTemperament)
  const cell = LOSS_HER_LINE[voice]
  if (cell === null) return null
  return told ? cell.told : cell.untold
}

/** ⚠ ⚠ DRAFT – see `lossLineFor`. `null` is the private branch and is the design's ruling, not an
 *  unwritten cell. */
const LOSS_HER_LINE: Record<Temperament, { told: string; untold: string } | null> = {
  sunny:
    {
      told: 'She rang the same evening and did not soften it. "We lost it. I did not want you to hear it from anyone else, and I would like you here."',
      untold:
        'She rang the same evening and said two things in one breath. "There was a child coming and there is not any more. I had not told you yet. I would like you here."',
    },
  fiery:
    {
      told: 'She called once, said it flat out, and was off the phone inside a minute. "We lost it. I am not talking about it. I will ring you when I am ready to."',
      untold:
        'She called once, said it flat out, and was off the phone inside a minute. "I was pregnant. I am not any more. I am not talking about it. I will ring you when I am ready to."',
    },
  // ⚠⚠ THE SILENCE, AND IT IS RULED RATHER THAN UNWRITTEN. `quiet` and `deep` tell nobody: the arc
  // simply stops, and what the parent has to read is the absence. See `lossLineFor`'s block.
  quiet: null,
  deep: null,
}

