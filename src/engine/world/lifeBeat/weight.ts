// A-06 / T6.10 – `world/lifeBeat.ts` §15 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ TWO OF THE WAVE-11 STREAMS LIVE IN THIS PACKAGE NOW AND THEY MUST NOT BE CONFUSED. §16's note
// said it in the hub and it still holds one directory over: this module owns
// `seed:life:pregnancy-loss:<conceivedWeek>:<week>` and `seed:life:window:<conceivedWeek>`, and
// `world/lifeBeat/bereavement.ts` owns `seed:life:loss:<week>`. Two different facts may never share a
// key, and these three live under nearly the same word. ⚠ ALL THREE ARE READ BY T3.9's INVENTORY
// (`tests/life-beat-keys.test.ts`, 26 keys, set equality) through `engineModuleSource`, which is why
// this file sits FLAT in `world/lifeBeat/`: a rename of one of them re-deals every career's deaths and
// conception windows and NOTHING ELSE goes red.
//
// ⚠ THE HAZARD DIRECTION, as `bereavement.ts`'s header sets it out: this module imports the hub
// (`kidAgeNow`), so the hub re-exports NOTHING of it – `src/engine/world.ts` takes the four names off
// `./world/lifeBeat/weight` and re-exports them on its existing export statement, and
// `world/phaseHerWeek.ts` asks this module for `rollPregnancyLoss`. The barrel's frozen name set does
// not move; the edge runs world.ts → weight → lifeBeat and the hub reaches `world.ts` only as
// `import type`, which TypeScript erases.
//
// ⚠ `setWeightEnabled` TRAVELS WITH THE SECTION AND THAT IS NOT A TIDY-UP. It is the SWITCH the whole
// section is gated on (`world.weightEnabled`, RULED 22.09), it is a member of the short
// `guardNotEndedForGood` list on a reason recorded at its own call, and
// `tests/principles-unknown-answers.test.ts` is the net that the terminal latch refuses while the
// college freeze passes. Its body is unchanged, guard and comment included.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { temperamentFor } from '../../spirit'
import { addEvent } from '../ledger'
import { guardNotEndedForGood } from '../constants'
import { kidAgeNow } from '../lifeBeat'
import type { Temperament } from '../../spirit'
import type { WorldState } from '../state'

// =================================================================================================
// 15. THE WEIGHT – ⚠⚠ THE SWITCH, THE HIDDEN WINDOW, AND THE TWO GRIEFS (wave 11)
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` is the canon, `docs/plans/life-wave-11-builder-2026-09.md` the
// step-by-step, and `docs/design/the-months-before-she-says-2026-09.md` the design underneath. It is
// §15 for §14's own stated reason: appended rather than renumbered.
//
// ⚠⚠ THE ONE THING THIS SECTION MUST NEVER MODEL IS THE PARENT AS THE CAUSE, and it is a FINDING
// rather than a scruple (the design's §2, the research's §6.3): nothing in the evidence supports
// training as a cause of a pregnancy loss, and a game that priced one would be telling every player
// the sentence women already hear too often. So the boundary below is written into the SIGNATURES –
// both hazards take their arguments and read nothing else – and both are pinned by a sweep rather
// than by a comment.

/** ⭐⭐⭐ v87 – THE SWITCH, BOTH WAYS, AND ITS ONE WRITER OUTSIDE `createWorld` (RULED 22.09: «only
 *  for the weight, set at new-career creation (the creation flow ASKS), changeable both ways in
 *  settings later»). `setCoachOnEventWeeks`'s shape (`world/coachMarket.ts`) and nothing more.
 *
 *  ⚠⚠ RE-AIMED 26.09 (B-P3-01), AND THE SHAPE CLAIM IS NOW **HALF** TRUE – WHICH IS THE PRECISE
 *  READING, because it was «and nothing more» that was doing the lying. `setCoachOnEventWeeks` opens
 *  with a guard and this command opened with none, so a tab left open behind the epilogue could flip
 *  the weight for a girl who has retired. It has one now. But it is deliberately **not the same
 *  guard**: that command is a TOUR command and takes `guardNotEnded`, this one takes
 *  `guardNotEndedForGood`, so the college freeze passes through and a terminal latch still refuses.
 *  The two shapes agree that a setting needs a guard and part on WHICH – see the guard's own note in
 *  `world/constants.ts`, where this command is recorded as member six of that short list with its
 *  reason. A reader who "tidies" the two back together to make this sentence true again would be
 *  taking a working control away from a girl at university.
 *
 *  ⚠ NO COPY WAS WRITTEN FOR ANY OF THIS: the guard is existing, its sentence is existing, invariant 4
 *  is untouched. `tests/principles-unknown-answers.test.ts` holds all three halves – refused behind a
 *  terminal latch, writable both ways on a live career, and writable both ways INSIDE the freeze.
 *
 *  ⚠⚠ IT WRITES ONE FIELD AND DELETES NOTHING, WHICH IS THE **OTHER HALF OF THE RULING** and the
 *  half a future reader is most likely to get wrong: «turning it off stops NEW weight events and
 *  never deletes lived state». `pregnancyLossWeeks`, `bereavementWeeks`, the album, the diary and a
 *  live `spiritShock` all stand – a career that lived a loss has lived it, and a switch that tidied
 *  its own history away would be rewriting a life rather than stopping one. The test that toggles
 *  mid-career asserts BOTH halves, because only one of them is visible in this function.
 *
 *  ⚠ AND THERE IS NO «EFFECTIVE FROM NEXT WEEK» ANYWHERE. The flag is read at the top of each
 *  hazard, on the week the hazard runs, so the command's own snapshot is already the answer – which
 *  is what «changeable both ways, effective immediately» means when it is built rather than claimed.
 *
 *  ⚠ ZERO DRAWS: one assignment. It takes no `Rng`, so MAIN is structurally out of reach and the
 *  frozen capture (41550 / e6b0c709) cannot see it. */
export function setWeightEnabled(world: WorldState, on: boolean): void {
  // ⚠ W2-ENDINGS (added 26.09, B-P3-01): the career must still have a next week. The engine
  // re-validates every command because the worker is not the gate – a tab left open behind the
  // epilogue must not be able to flip a career setting for a girl who has retired.
  //
  // ⚠⚠ `guardNotEndedForGood` AND NOT `guardNotEnded`, AND THAT IS THE RULING'S INTENT RATHER THAN AN
  // EXCEPTION TO IT (26.09). Ruling 9's words are «refuses on an ended career». A COLLEGE FREEZE IS
  // NOT AN ENDED CAREER – it is a pause the career returns from, which is the whole reason
  // `guardNotEndedForGood` exists – and the switch's own ruling of 22.09 is «changeable both ways in
  // settings later». The switch lives on MoreScreen, `nav.tab-bar` renders unconditionally, and round
  // 24 D1's premise is that the tab shell sits UNDER the freeze, so the row is reachable and WORKING
  // at college today. `guardNotEnded` here would have taken a working control away from a girl at
  // university and answered the tap «She is at college – … this waits until she is back on tour»,
  // which is a behaviour change nobody asked for. So: a terminal latch refuses, the freeze passes.
  //
  // ⚠⚠ DO NOT "TIDY" THIS BACK TO `guardNotEnded` FOR SYMMETRY WITH THE EIGHTEEN. The two names are
  // the audit (`world/constants.ts` says so at the guard itself), and this command is a member of the
  // short list on its own reason, recorded there. The net is
  // `tests/principles-unknown-answers.test.ts`: the terminal latch refuses AND the freeze passes, and
  // swapping this one identifier reddens the second case while leaving the first green.
  guardNotEndedForGood(world)
  world.weightEnabled = on
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T4) – **HER WEEKLY CHANCE OF LOSING IT, GIVEN HER AGE AND NOTHING
 *  ELSE.** Pure, zero draws, no writes, and **it takes no `WorldState` at all** – which is the
 *  boundary law written into the signature rather than into a comment.
 *
 *  ⚠⚠ THE READ-SET IS THE WHOLE POINT OF THIS FUNCTION'S SHAPE. The design's §2 and the research's
 *  §6.3: nothing in the evidence supports training as a cause of loss, the concern in the sources is
 *  contact and falls, and age dominates the variance. So a game that let the training plan, the
 *  travel, the answers, `spirit` or `bond` reach this number would be asserting something untrue –
 *  and it would be telling every player the sentence women already hear too often, *you did this by
 *  not resting*. A function that cannot SEE the world cannot read it, and a later refactor that
 *  wanted to would have to widen this signature in front of a reviewer. `tests/wave11-loss.test.ts`
 *  §B sweeps plan, travel, spirit, bond and support across arms on shared seeds and asserts the
 *  realised hazard is identical, so the pin holds the property even if somebody re-plumbs the call.
 *
 *  ⚠ THE LAST RUNG WHOSE `fromAge` SHE HAS REACHED WINS, and an age under the first rung takes 0 –
 *  `pregnancyChanceAt`'s own law, read the same way so the two curves cannot be consumed differently.
 *  A 0 here takes ZERO DRAWS exactly as an ineligible week does, because `rollPregnancyLoss` returns
 *  on the chance before it derives the stream. */
export function pregnancyLossChanceAt(ageYears: number): number {
  let perWeek = 0
  for (const rung of ECONOMY.weight.lossPerWeekByAge) if (ageYears >= rung.fromAge) perWeek = rung.perWeek
  return perWeek
}

/** ⭐⭐⭐ v87 T4 – **IS THIS A WEEK THE LOSS HAZARD RUNS AT ALL.** Pure, zero draws, no writes, and a
 *  `false` here means ZERO DRAWS rather than a discarded one – `pregnancyEligible`'s own law, and
 *  the reason this is a predicate of its own: a reader must see, in ONE place, that the whole of
 *  eligibility is decided before any stream exists.
 *
 *  1. ⭐⭐⭐ **THE SWITCH.** `world.weightEnabled`, RULED 22.09. Off means no draw at all – not a draw
 *     whose outcome is discarded, which is invariant 2's named offence – so a career with the weight
 *     off taps the same sub-streams in the same order the same number of times as a pre-wave career.
 *     §8 row 6 measures it.
 *  2. A PREGNANCY IS LIVE. `world.pregnancy !== null`, and nothing else about it is read.
 *  3. ⚠⚠ **THE WEEK IS INSIDE THE RESEARCH'S OWN WINDOW** – `[conceivedWeek + lossFromWeek,
 *     conceivedWeek + lossUntilWeek)`. The constant's block carries the derivation; the short of it
 *     is that the 9.8/10.8/16.7% figures count recognised pregnancies between 6 and 20 GESTATIONAL
 *     weeks, which is conception weeks 4 to 18, and spreading them over the whole 39-week term would
 *     ship a different and much heavier event.
 *
 *  ⚠ AND NOTHING ABOUT HER PLAN, HER TRAVEL, HER SPIRIT, HER BOND OR HIS ANSWER IS IN HERE, which is
 *  worth saying because every one of them was available. That is the boundary law, and this gate is
 *  the other half of the fence `pregnancyLossChanceAt`'s signature builds. */
export function pregnancyLossEligible(world: WorldState): boolean {
  if (!world.weightEnabled) return false
  const pregnancy = world.pregnancy
  if (pregnancy === null) return false
  const since = world.week - pregnancy.conceivedWeek
  return since >= ECONOMY.weight.lossFromWeek && since < ECONOMY.weight.lossUntilWeek
}

/** ⭐⭐⭐ v87 T4 – **THE WEEKLY ROLL, AND THE ONE PLACE A PREGNANCY ENDS WITHOUT A BIRTH.**
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, `rollPregnancy`'s own four steps inherited whole: the gate returns
 *  first, the CHANCE is computed second and returns if it is 0, and only then is the stream derived.
 *  A week with the switch off, a week with no pregnancy, a week outside the research's window and a
 *  week whose age curve reads 0 all take ZERO draws – never draw-and-discard.
 *
 *  ⚠ THE KEY IS THE PREGNANCY'S OWN IDENTITY PLUS THE WEEK – `seed:life:pregnancy-loss:<conceivedWeek>:<week>`.
 *  The conception week is what makes it the PREGNANCY's stream (the spec's «a purpose key derived
 *  from the pregnancy's own identity»), and the week is what makes it one uniform per week rather
 *  than one per pregnancy. ⚠⚠ IT IS DELIBERATELY NOT `seed:life:loss:<week>`, which is the
 *  BEREAVEMENT's key, named in writing on 11.09 and created by T5: two different facts may never
 *  share a key, and these two are in the same section of the same file.
 *
 *  ⚠ `<` AND NOT `<=`, `rollPregnancy`'s own note: `rngFromSeed` can return exactly 0, and a hazard
 *  of 0 must be impossible rather than merely unlikely.
 *
 *  WHAT A LOSS DOES, and the list is the spec's §3 in order:
 *    · the record CLEARS – no birth, no comeback machinery, no `children.push`;
 *    · the week joins `pregnancyLossWeeks`, because the thing that ends cannot be the thing that
 *      remembers, and the cooldown below reads that list;
 *    · `spiritShock` lands as `'loss'` – the depth is `ECONOMY.spirit.shock.loss`, and there is no
 *      second recovery rate anywhere behind it (§5's one-rate law);
 *    · the words, if she is OPEN. A private girl says nothing at all, and the absence is the telling.
 *
 *  ⚠⚠ IT WRITES THE SHOCK AND `accrueSpirit` PRICES IT THE SAME WEEK, which is why the call site is
 *  inside the 1c block and above `accrueSpirit` – `landBirth`'s own arrangement, for the same
 *  mechanical reason: the pass that pays for a shock reads `shock.week === world.week`. */
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

/** ⭐⭐⭐ v87 T4 – **WHAT SHE SAYS, OR THE SILENCE THAT IS THE TELLING.** ⚠ ⚠ DRAFT – every word is
 *  the builder's draft for the owner (invariant 4), listed verbatim in the wave's report.
 *
 *  ⚠⚠ `null` IS A FIRST-CLASS ANSWER AND IS THE DESIGN'S STRONGEST SCENE, not a gap in the pool.
 *  RULED 22.09 (question 2): «both branches build – open tells, private is silence», and the
 *  design's §4 table is where the two branches come from: `sunny` «tells him, and wants him there»,
 *  `fiery` «tells him fast and loud, then does not want to discuss it», `quiet` «he may learn from
 *  the absence of entries, not from her», `deep` «⚠ the one who may not tell him at all». So a
 *  private girl's loss writes NO ROW: the diary band goes quiet, the portrait stops being pregnant,
 *  the entries re-open, and the parent works it out. «The parent learns from a silence, which is a
 *  thing this game can do and almost no other kind of game can» – the design's own sentence.
 *
 *  ⚠ TWO CELLS PER OPEN VOICE, AND THE SECOND IS WHAT THE HIDDEN WINDOW MADE REACHABLE. A loss can
 *  land before she has ever announced it (the research's window opens at conception week 4 and a
 *  private window runs to 12), so there is a real case where the parent is told about a pregnancy
 *  and its end in one sentence. A single cell would have had to presume he already knew, and would
 *  have been false on exactly the careers the window exists to create.
 *
 *  ⚠ NO NAME AND NO GENDER FOR THE ONE SHE MARRIED (§3g/§3h), NO SEX FOR THE CHILD (§3j's law – the
 *  row was never written), NO DATE AND NO NUMBER (rule 4), and no line states her interior as fact
 *  (the fallible-parent law). What each line says is what the PARENT was told and what he could see.
 *
 *  ⚠ AND NO LINE LINKS IT TO ANYTHING HE SAID. RULED 22.09 (question 5): if the loss follows a cold
 *  «too early», the game does NOT link them – the boundary law holds mechanically and the player
 *  draws his own line. A sentence here that so much as gestured at the answer he gave would be the
 *  game settling it for him. */
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

