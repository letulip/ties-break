// A-06 / T6.10 – `world/lifeBeat.ts` §7 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ THE MOST COUPLED OF THE SEVEN, AND IT MOVED LAST FOR THAT REASON. §7 reaches TWELVE names in the
// hub – four of them in §3c-2, round 42's situation layer – which is why it is imported from here as a
// list rather than one or two helpers. Every one of those names stays in the hub on P4's own rule: the
// hub still CALLS §3c-2 (§3k's `buildLifeBeatPrompt` reads it eight times), so §3c-2 is the hub's, and
// a section the hub calls is not ready to move.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub, so the hub re-exports NOTHING of it. `src/engine/world.ts` takes the four names off
// `./world/lifeBeat/smallTalk` and re-exports them on its existing export statement, so the barrel's
// frozen name set (T6.6) does not move a specifier; `world/phaseHerWeek.ts` asks this module for
// `rollSmallTalk`. The edge runs world.ts → smallTalk → lifeBeat, and the hub reaches `world.ts` only as
// `import type`, erased.
//
// ⚠ THE COPY IS A SEPARATE MODULE, `world/lifeBeat/smallTalkCopy.ts` (T6.8), and this file reads it as a
// SIBLING – the subjects, the subject picker and the `SmallTalkSubject` type. The hub reads it too,
// because the prompt is assembled hub-side. A copy leaf may be read by the hub and by a hazard alike;
// what it may never do is import one back. That is CLAUDE.md's life-beat rule and the reason a kind is
// never one file with both halves.
//
// ⚠ FOUR SUB-STREAMS LIVE HERE NOW – `seed:life:small-talk:<season>`, `:small-talk-week:<season>`,
// `:small-talk-subject:<week>` and `:small-talk-situation:<week>` – and they stay in T3.9's inventory
// (`tests/life-beat-keys.test.ts`, 26 keys, set equality) because the file is FLAT in `world/lifeBeat/`,
// which is what `engineModuleSource` reads. A key that left that inventory would re-deal every career's
// small talk with nothing going red.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
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

// =================================================================================================
// 7. TIER-1 SMALL TALK – ⚠⚠ THE WEEK SHE COMES WITH SOMETHING SMALL (the private life, wave 3: T8)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T8, constants in `ECONOMY.life` (§4's last row).
// Sections 5 and 6 above are ONE attachment's whole arc; this is the layer's other half – the
// ordinary week in which nothing happened except that she talked to her parent.
//
// ⚠⚠ THE FOURTH AND LAST STREAM OF THE WAVE, and it is the one this file has been reserving:
//
//     seed:life:smalltalk:<week>           does she come with something small, this week
//
// (seed, calendar)-keyed like the other three, so a player cannot manufacture a conversation by
// playing the week differently. `seed:life:ends:*` is WAVE 4's and does not exist on this tree.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2: `seed:life:ends:<week>` now DOES exist, in §8 below, and this
// section still does not derive it – which is the claim the sentence was making and the one the
// count-keys pin in tests/wave3-small-talk.test.ts §B holds `rollSmallTalk` to. ⚠ RE-AIMED AGAIN BY
// T4: `:ends:<week>:react` exists now too (§3e, `drawEndsRead`), and this section still derives
// neither of them – which is, again, the whole of the claim.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural (nothing here
// takes an `Rng`, so the frozen capture 41550 / e6b0c709 cannot see this file). The second is T3's
// load-bearing rule inherited whole: `smallTalkEligible` decides EVERYTHING – the pending queue, the
// season cap and the two bands priced at zero – and `rollSmallTalk` returns on it BEFORE the stream
// is derived. A `strained` or `cold` home takes no draw at all; it never compares one against 0.
//
// ⚠ AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON – the finding T3 recorded and
// this step inherits verbatim. Every key here carries its own week, so a discarded draw shifts no
// other week's value and «two worlds produce identical later verdicts» stays green under the very
// draw-and-discard mutation it would be written to catch. `tests/wave3-small-talk.test.ts` §B counts
// the keys the gate reached, in an array the code under test cannot see, with a positive control.
//
// ⚠ IT RAISES A BEAT AND WRITES NO FEED ROW – not here and not on the answer (see `ANSWER_EVENT`).

/** THE WEEKLY CHANCE, BY BOND BAND (`ECONOMY.life.smallTalkPerWeek`, brief §4's proposal). Takes the
 *  BAND rather than the world – `arrivalHazardFor`'s own doctrine – so a corridor test and the bench
 *  can sweep the table without posing a world per cell. */
export function smallTalkChanceFor(band: BondBand): number {
  return ECONOMY.life.smallTalkPerWeek[band]
}

/** ⭐⭐ HOW MANY SMALL-TALK ROWS THIS SEASON ALREADY HOLDS – **THE LOG IS THE COUNTER**, and there is
 *  no new state anywhere in this step (who-she-is §5b line item 6).
 *
 *  ⚠⚠ TWO FILTERS AND BOTH ARE LOAD-BEARING, which is why this is a function rather than a `length`.
 *  `lifeLog` is the whole life: it also holds `'fork-opinion'` (once a career) and `'met'` (once an
 *  attachment), and it is never pruned. A count that read the log's LENGTH would cap her small talk
 *  on the week she was told there is someone, and a count that forgot the season would cap it for
 *  the rest of her life at four conversations. `seasonIndexOf` is the engine's ONE definition of
 *  «this season» (world/ledger.ts) – the same one the Money screen's window and the season wrap-up
 *  read, so a season can never mean two spans on two surfaces. */
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
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s OWN REASON: a reader has to be able to see, in
 *  one place, that the whole of eligibility is decided before any stream exists. Pure, zero draws,
 *  no writes.
 *
 *  1. NOTHING BLOCKING IS ALREADY WAITING (the brief's «fires only when no beat is already pending
 *     that week»). The queue is answered one card at a time and the week is already stopped; adding a
 *     small thing behind the biggest news of her life would make the parent answer them in the wrong
 *     order for the rest of the week. ⚠ v74 T15 – `pendingLifeBeat` reads BLOCKING rows now, so this
 *     clause says exactly what it always meant: she does not come with something small on the week
 *     she has been asked the biggest question of her life.
 *  2. ⭐⭐ v74 T15 – AND NOT WHILE SHE IS STILL WAITING TO BE HEARD ON THE LAST ONE («one at a time»,
 *     who-she-is §5b's amendment). A live unanswered soft row already has a card on the hub; a second
 *     would either queue behind it invisibly or replace it, and replacing it is how «never lost»
 *     stops being true. ⚠ AND IT IS THE **LIVE** ONE AND NOT ANY UNANSWERED ONE: an expired row is
 *     the record of a moment that passed, and a career that fell silent for ever because one
 *     conversation went unanswered in week 9 would be the deferral's own bug wearing a TTL.
 *  3. THE SEASON CAP – four, off the log itself. ⚠ IT COUNTS RAISED ROWS, ANSWERED OR NOT (§5b's
 *     amendment: «the season cap counts raised rows whether answered or not»), which is what
 *     `smallTalkThisSeason` has always done: the row is the counter and the answer is not part of it.
 *  4. THE BAND'S OWN CHANCE IS ABOVE ZERO. ⚠⚠ THIS CLAUSE IS THE SHORT-CIRCUIT AND NOT AN
 *     OPTIMISATION: `strained` and `cold` are priced at 0, and a 0 compared against a DRAWN uniform
 *     would take a draw on a week the design says is silent. `>` and not `>=` for `rollArrival`'s
 *     own reason in reverse – a chance of zero must be impossible rather than merely unlikely.
 *     ⚠ IT IS ALSO WHY THE CARD CANNOT EXIST AT `cold`: nothing raises a row there, so nothing is
 *     ever live there – «the silence is still the line». */
export function smallTalkEligible(world: WorldState): boolean {
  if (pendingLifeBeat(world) !== null) return false
  if (liveSoftBeat(world) !== null) return false
  if (smallTalkThisSeason(world) >= ECONOMY.life.smallTalkCapPerSeason) return false
  return smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start)) > 0
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `'small-talk'` row.
 *
 *  ⭐⭐ IT IS CALLED AGAIN SINCE v74 T15 (11.09.2026), THROUGH THE SOFT PATH. The history is kept
 *  because it is the reason this section is shaped the way it is: T8 shipped the raise through tier
 *  2's HARD pause, §5b prices tier 1 «soft – answerable, never lost», and the owner ruled the raise
 *  off («вариант 3»: raise reverted, engine kept) for exactly as long as it took to specify the
 *  surface. T15 built it – `LIFE_BEAT_BLOCKING` declares the kind non-blocking, `pendingLifeBeat`
 *  narrows to blocking rows, `liveSoftBeat` holds the three-week window and a Home card opens the
 *  same dialog – so `world/phaseHerWeek.ts` calls this again, in the position the deferral's note
 *  reserved for it, and a raised row now stops nothing.
 *  ⚠ AND THE SECOND RULING, HONOURED HERE: NO AGE GATE. She talks at any age – a child bringing a
 *  parent a worry, a joy or a question is natural at any age, and tier 1 is texture rather than part
 *  of the romance layer – so `smallTalkEligible` does NOT inherit `arrivalEligible`'s
 *  sixteenth-birthday gate, and must not acquire one.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. The line order IS the rule;
 *  moving the roll above the gate would break it silently, because every key here carries its own
 *  week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND AND THE SPIRIT IT READS ARE LAST WEEK'S SETTLED VALUES, because it is written to run
 *  before `accrueSpirit` – `rollArrival`'s own argument one section up, and for the same reason:
 *  what she brings to the table is about the week that has just been lived, not about what this same
 *  tick is on its way to doing to her. (T15 restored the call site to exactly that position, which is
 *  the one the deferral's note reserved.)
 *
 *  ⚠ THE SUBJECT IS DERIVED AND NEVER DRAWN (`smallTalkSubjectFor`) – the wave owns four stream keys
 *  and this one answers a single question. */
export function rollSmallTalk(world: WorldState): void {
  if (!smallTalkEligible(world)) return
  const chance = smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start))
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY. `<` and not `<=`, `rollArrival`'s own note: `rngFromSeed`
  // can return exactly 0, and a chance of 0 must be unreachable rather than merely rare. (It cannot
  // reach this line at all today – the gate refuses it – and the comparison agrees with the gate
  // rather than relying on it.)
  if (rngFromSeed(`${world.seed}:life:smalltalk:${world.week}`)() >= chance) return
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  // ⭐⭐⭐ ROUND 42 #24 – WHAT SHE COMES WITH, DRAWN RATHER THAN DERIVED (spec §2), and it happens in
  // THIS order for a reason: the situations she could honestly bring are found FIRST, and the subject
  // is drawn over the subjects that survived. Drawing the subject first and then discovering it has
  // no situation would leave the beat with a choice between a re-roll (a second read off one key) and
  // a silent fall-through (a heading about a worry over an opener about a coach).
  // ⭐⭐⭐ ROUND 43 #8(a) – AND WHAT SHE SAID LAST TIME IS TAKEN OFF THE TABLE FIRST. The owner got
  // `watching-players` twice running («они точно не должны так часто повторяться, иначе в чём
  // смысл»), and that was a GUARANTEE rather than bad luck: the draw excluded nothing said before,
  // so a subject holding one situation repeated VERBATIM the moment the weights picked it twice.
  // ⚠ IT NARROWS THE POOL BEFORE THE SUBJECT IS DRAWN, NOT AFTER. Drawing the subject over the full
  // reachable set and then excluding inside it is the same defect `reachable` itself was built to
  // avoid one paragraph up – a single-situation subject would win the weights and then have nothing
  // left to offer, and the beat would owe a re-roll or a fall-through.
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
  // ⚠ THE DETAIL IS THE SUBJECT **AND THE SITUATION** – machine-readable, never a rendered sentence
  // (`LifeBeatRecord`), and it is what `lifeBeatSaid`, the option labels and her replies are all
  // selected with. STAMPED AND NEVER RE-DERIVED, `'fork-counsel'`'s own argument: the row is live for
  // three weeks and is re-assembled on every `toSnapshot`, so a re-derivation could hand the parent a
  // different small thing from the one she came with – and could hand him one whose competitive fact
  // has since gone false.
  // ⭐⭐⭐ ROUND 44 – AND THE SCENE SHE SAYS IT IN IS DRAWN HERE AND STAMPED WITH IT. The frame is the
  // third key of this step and it is the only one that is NOT keyed `:life:` – the frame pool spec
  // names it in full («`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)` – never MAIN, invariant
  // 2») and the spelling is his document's, carried rather than tidied.
  // ⚠ IT IS DRAWN AFTER THE SITUATION AND THE ORDER IS NOT LOAD-BEARING – each key carries its own
  // week, so neither draw can move the other. What IS load-bearing is that it happens on the RAISE:
  // the exclusion reads the log as it stands now, and a frame derived later would be re-decided on
  // every snapshot.
  const frame = drawSmallTalkFrame(world, presenceOf(lifeStageOf(world)))
  raiseLifeBeat(world, 'small-talk', smallTalkDetailFor(pool[at].subject, pool[at].id), undefined, frame)
}

/** ⭐⭐ WHICH SMALL THING, WEIGHTED BY THE WEEK'S REGISTER AND NARROWED TO WHAT SHE COULD HONESTLY
 *  BRING (spec §2). `drawForkWant`'s own shape – weights, one uniform, a walk down the list – and its
 *  own (seed, calendar) key discipline, so a player cannot manufacture a subject by playing the week
 *  differently.
 *
 *  ⚠ THE ROSTER IT WALKS IS THE REACHABLE ONE, not `SMALL_TALK_SUBJECTS`. A subject with no situation
 *  behind it this week has no mass at all, which is what keeps the two draws independent: the second
 *  one always has something to pick.
 *
 *  ⚠ THE ORDER IS `SMALL_TALK_SUBJECTS`' OWN and not the reachable list's, so the walk is stable
 *  under a re-ordering of the catalogue – the same seed and week give the same subject whatever order
 *  the situations happen to sit in. */
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

