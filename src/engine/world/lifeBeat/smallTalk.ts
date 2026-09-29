// A-06 / T6.10 – `world/lifeBeat.ts` §7 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ smallTalk: THE MOST COUPLED OF THE SEVEN, AND IT MOVED LAST FOR THAT REASON.
// ⚠ smallTalk: THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports the hub…
// ⚠ smallTalk: THE COPY IS A SEPARATE MODULE, `world/lifeBeat/smallTalkCopy.ts` (T6.8)
// ⚠ smallTalk: FOUR SUB-STREAMS LIVE HERE NOW
// → docs/notes/life-beats/smallTalk.md#smalltalkts-header
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { bondBandOf, moodRegisterOf, spiritBandOf } from '../../spirit'
import { seasonIndexOf } from '../ledger'
import { SMALL_TALK_SUBJECTS, smallTalkSubjectFor } from './smallTalkCopy'
import {
  drawSmallTalkFrame,
  lifeLogOf,
  lifeStageOf,
  liveSoftBeat,
  pendingLifeBeat,
  presenceOf,
  raiseLifeBeat,
  reachableSituations,
  smallTalkDetailFor,
  voiceOf,
  withoutRecentSituations,
  SMALL_TALK_SUBJECT_WEIGHT,
} from '../lifeBeat'
import type { SmallTalkSubject } from './smallTalkCopy'
import type { SmallTalkSituation } from '../lifeBeat'
import type { BondBand, MoodRegister } from '../../../shared/protocol/narrative'
import type { WorldState } from '../state'

// 7. TIER-1 SMALL TALK – ⚠⚠ THE WEEK SHE COMES WITH SOMETHING SMALL (the private life, wave 3:
// T8) – `docs/plans/life-wave-3-builder-2026-09.md` §2 T8, constants in `ECONOMY.life` (§4's
// last row). Sections 5 and 6 above are ONE attachment's whole arc; this is the layer's other
// half – the ordinary week in which nothing happened except that she talked to her parent.
//
// ⚠⚠ smallTalk: THE FOURTH AND LAST STREAM OF THE WAVE, and it is the one this file has been reserving
// ⚠ smallTalk: RE-AIMED 12.09 BY WAVE 4's T2
// ⚠ smallTalk: RE-AIMED AGAIN BY T4: `:ends:<week>:react`
// ⚠⚠ smallTalk: ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK.
// ⚠ smallTalk: AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON
// ⚠ smallTalk: IT RAISES A BEAT AND WRITES NO FEED ROW
// → docs/notes/life-beats/smallTalk.md#smalltalkts-7--tier-1-small-talk

/** THE WEEKLY CHANCE, BY BOND BAND (`ECONOMY.life.smallTalkPerWeek`, brief §4's proposal). Takes the
 *  BAND rather than the world – `arrivalHazardFor`'s own doctrine – so a corridor test and the bench
 *  can sweep the table without posing a world per cell. */
export function smallTalkChanceFor(band: BondBand): number {
  return ECONOMY.life.smallTalkPerWeek[band]
}

/** ⭐⭐ HOW MANY SMALL-TALK ROWS THIS SEASON ALREADY HOLDS – **THE LOG IS THE COUNTER**, and
 *  there is no new state anywhere in this step (who-she-is §5b line item 6).
 *
 *  ⚠⚠ smallTalkThisSeason: TWO FILTERS AND BOTH ARE LOAD-BEARING, which is why this is a function rather than a `length`.
 *  → docs/notes/life-beats/smallTalk.md#smalltalkthisseason--how-many-small-talk-rows-this-season-already-holds
 */
export function smallTalkThisSeason(world: WorldState): number {
  const season = seasonIndexOf(world.week)
  let count = 0
  for (const row of lifeLogOf(world)) {
    if (row.kind === 'small-talk' && seasonIndexOf(row.week) === season) count++
  }
  return count
}

/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ smallTalkEligible: A PREDICATE OF ITS OWN FOR `arrivalEligible`'s OWN REASON
 *  ⚠ smallTalkEligible: v74 T15 – `pendingLifeBeat` reads BLOCKING rows now, so this clause says exactly what it always meant…
 *  ⚠ smallTalkEligible: AND IT IS THE **LIVE** ONE AND NOT ANY UNANSWERED ONE
 *  ⚠ smallTalkEligible: IT COUNTS RAISED ROWS, ANSWERED…
 *  ⚠⚠ smallTalkEligible: THIS CLAUSE IS THE SHORT-CIRCUIT AND NOT AN OPTIMISATION
 *  ⚠ smallTalkEligible: IT IS ALSO WHY THE CARD CANNOT EXIST AT `cold`
 *  → docs/notes/life-beats/smallTalk.md#smalltalkeligible--the-gate--all-three-and-a-false-here-means-zero
 */
export function smallTalkEligible(world: WorldState): boolean {
  if (pendingLifeBeat(world) !== null) return false
  if (liveSoftBeat(world) !== null) return false
  if (smallTalkThisSeason(world) >= ECONOMY.life.smallTalkCapPerSeason) return false
  return smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start)) > 0
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `'small-talk'` row.
 *
 *  ⚠ rollSmallTalk: AND THE SECOND RULING, HONOURED HERE
 *  ⚠⚠ rollSmallTalk: THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED.
 *  ⚠ rollSmallTalk: THE BOND AND THE SPIRIT IT READS ARE LAST WEEK'S SETTLED VALUES
 *  ⚠ rollSmallTalk: THE SUBJECT IS DERIVED AND NEVER DRAWN (`smallTalkSubjectFor`)
 *  → docs/notes/life-beats/smallTalk.md#rollsmalltalk--the-weekly-roll--the-one-writer-of-a-small-talk-row
 */
export function rollSmallTalk(world: WorldState): void {
  if (!smallTalkEligible(world)) return
  const chance = smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start))
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY. `<` and not `<=`, `rollArrival`'s own note: `rngFromSeed`
  // can return exactly 0, and a chance of 0 must be unreachable rather than merely rare. (It cannot
  // reach this line at all today – the gate refuses it – and the comparison agrees with the gate
  // rather than relying on it.)
  if (rngFromSeed(`${world.seed}:life:smalltalk:${world.week}`)() >= chance) return
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  // ⭐⭐⭐ ROUND 42 #24 – WHAT SHE COMES WITH, DRAWN RATHER THAN DERIVED (spec §2), and it happens
  // in THIS order for a reason: the situations she could honestly bring are found FIRST, and the
  // subject is drawn over the subjects that survived.
  //
  // owner (rollSmallTalk): «они точно не должны так часто повторяться, иначе в чём смысл»
  // ⚠ rollSmallTalk: IT NARROWS THE POOL BEFORE THE SUBJECT IS DRAWN, NOT AFTER.
  // → docs/notes/life-beats/smallTalk.md#rollsmalltalk--round-42-24--what-she-comes-with-drawn-rather-than-derived
  const reachable = withoutRecentSituations(world, reachableSituations(world, voiceOf(world), lifeStageOf(world)))
  if (reachable.length === 0) {
    // ⚠ THE LEGACY ROW, AND IT IS THE SHIPPED BEAT RATHER THAN A DEGRADED ONE. No situation is
    // written for this girl at this stage on this career, so she opens with the pool that has always
    // served her and the card behaves exactly as it did before this round – three generic answers,
    // no second line. ⚠ ZERO EXTRA KEYS ON THIS PATH: the two streams below are not derived at all,
    // which is the same «the gate returns before the stream exists» discipline the hazard itself
    // keeps, one level in.
    raiseLifeBeat(world, 'small-talk', smallTalkSubjectFor(register))
    return
  }
  // ⚠⚠ TWO NEW KEYS, EACH ANSWERING EXACTLY ONE QUESTION, EACH CARRYING ITS OWN WEEK – the 09.09
  // split-key law. `:subject:` says WHICH SMALL THING and `:situation:` says WHICH ONE OF THAT KIND;
  // reading both off `seed:life:smalltalk:<week>` would have been two facts sharing a key, which is
  // the one thing that law forbids. ⚠ AND NEITHER IS MAIN: `rngFromSeed` is a purpose-scoped
  // sub-stream re-derived at this call site and persisting nothing, so the frozen capture
  // (41550 / e6b0c709) cannot see this function – `tests/condition.test.ts` does not move.
  const subject = drawSmallTalkSubject(world.seed, world.week, register, reachable)
  const pool = reachable.filter((s) => s.subject === subject)
  const at = pickInt(rngFromSeed(`${world.seed}:life:smalltalk:situation:${world.week}`), 0, pool.length - 1)
  // ⚠ THE DETAIL IS THE SUBJECT **AND THE SITUATION** – machine-readable, never a rendered
  // sentence (`LifeBeatRecord`), and it is what `lifeBeatSaid`, the option labels and her
  // replies are all selected with.
  //
  // ⚠ rollSmallTalk: IT IS DRAWN AFTER THE SITUATION AND THE ORDER IS NOT LOAD-BEARING
  // → docs/notes/life-beats/smallTalk.md#rollsmalltalk--the-detail-is-the-subject-and-the-situation
  const frame = drawSmallTalkFrame(world, presenceOf(lifeStageOf(world)))
  raiseLifeBeat(world, 'small-talk', smallTalkDetailFor(pool[at].subject, pool[at].id), undefined, frame)
}

/** ⭐⭐ WHICH SMALL THING, WEIGHTED BY THE WEEK'S REGISTER AND NARROWED TO WHAT SHE COULD
 *  HONESTLY BRING (spec §2).
 *
 *  ⚠ drawSmallTalkSubject: THE ROSTER IT WALKS IS THE REACHABLE ONE, not `SMALL_TALK_SUBJECTS`.
 *  ⚠ drawSmallTalkSubject: THE ORDER IS `SMALL_TALK_SUBJECTS`' OWN and not the reachable list's…
 *  → docs/notes/life-beats/smallTalk.md#drawsmalltalksubject--which-small-thing-weighted-by-the-weeks-register
 */
function drawSmallTalkSubject(
  seed: string,
  week: number,
  register: MoodRegister,
  reachable: readonly SmallTalkSituation[],
): SmallTalkSubject {
  const live = SMALL_TALK_SUBJECTS.filter((s) => reachable.some((r) => r.subject === s))
  const weights = SMALL_TALK_SUBJECT_WEIGHT[register]
  const total = live.reduce((sum, s) => sum + weights[s], 0)
  let roll = rngFromSeed(`${seed}:life:smalltalk:subject:${week}`)() * total
  for (const subject of live) {
    roll -= weights[subject]
    if (roll < 0) return subject
  }
  // Unreachable while every weight is positive; a total that floats a hair low lands on the last row
  // rather than on `undefined` – `drawForkWant`'s own tail.
  return live[live.length - 1]
}

