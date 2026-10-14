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
import { COACH_REAL_SITUATION_ID, SMALL_TALK_SUBJECTS, smallTalkSituationIdOf, smallTalkSubjectFor } from './smallTalkCopy'
import { coachTalkCheckpointAt, coachWeeksTogether } from '../coachFeel'
import { coachSinceWeek } from '../coachStint'
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
  SMALL_TALK_EXCLUDE_LAST,
  SMALL_TALK_STANCE_ID,
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

/** ⭐⭐⭐ ROUND 52 J1 (14.10) – DOES HER BOND LET HER CONFIDE? THE ONE SPELLING, asked in three places that used to write the clause for themselves (twice already, once as `> 0` and once as `<= 0`):
 *  the lottery's gate (`smallTalkEligible`), the checkpoint talk (`raiseCoachCheckpointTalk`) and the diary fact that says a checkpoint was SHUT (`coachTalkShutRead`).
 *
 *  THE OWNER, 14.10 (round 52, his answers on the close №1), approving the recommendation – «давай по рекомендациям»: at a strained or cold bond she does not confide at a stint checkpoint either (the
 *  checkpoint talk keeps the bond gate every small talk has), AND THE SILENCE SHOWS: a checkpoint the bond shuts leaves a parent-voice note on the week's scrap, so the player sees what the relationship cost.
 *  ⚠ The gate and the note must therefore read ONE answer: two spellings would let a band open the talk and print the silence in the same week, or do neither. The table (`smallTalkPerWeek`) is zero at
 *  `strained` and `cold` and positive at `steady` and `close`; the bond is read as the roll reads it (`?? ECONOMY.bond.start`, a save with no bond yet). Pure, no draw. */
function bondLetsHerConfide(world: WorldState): boolean {
  return smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start)) > 0
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
  return bondLetsHerConfide(world)
}

/** ⭐⭐⭐ ROUND 52 H3 (14.10) – THE THREE ROWS OF EACH STINT CHECKPOINT, warm / unsure / cold, by the checkpoint's week (`COACH_TALK_CHECKPOINTS`, world/coachFeel.ts):
 *  12 is her first impression (R67–R69), 32 half a year (R70–R72), 56 a year together (R73–R75). IDS AND NOTHING ELSE – which of the three she says is not decided here:
 *  `reachableSituations` already holds the one spelling of her side (her real `coachFeel`), of the stint's window, of college and of her voice, and the pick below asks IT, so there
 *  is no second table of sides to drift from the facts. `tests/r52-coach-talk-checkpoints.test.ts` pins each id to its row and its fact. */
export const COACH_TALK_CHECKPOINT_ROWS: Readonly<Record<number, readonly string[]>> = {
  12: ['the-thing-that-makes-sense', 'practice-feels-different', 'the-thing-she-cannot-name'],
  32: ['half-a-year-and-it-fits', 'half-a-year-and-still-unsure', 'months-in-and-still-waiting'],
  56: ['a-year-and-she-would-not-swap', 'a-year-and-she-still-does-not-know', 'a-year-in-we-need-to-talk'],
}

/** ⭐⭐⭐ ROUND 52 H3 (14.10) – WHICH STINT CHECKPOINT IS OPEN THIS WEEK AND HAS NOT BEEN SPOKEN, or `null`.
 *
 *  ⚠ THE LOG IS THE MEMORY, as `smallTalkThisSeason`'s is: a checkpoint is SPOKEN when a small-talk row of one of its three situations was raised at a week at or after
 *  `coachSinceWeek + cp`. Nothing persisted, so there is no schema move, and a row the lottery raised INSIDE the window counts exactly like the forced one (she has said it; she
 *  does not say it again). The comparison is on the STINT: a re-hire or a release moves `coachSinceWeek`, so the rows of the old stint fall behind the new `from` and the
 *  checkpoints start over – a new coach is a new first impression.
 *  ⚠ A ROW RAISED BEFORE `from` DOES NOT COUNT (the lottery's R67 at week 8 is not the three-month talk). Pure, no draw, no key: the cheap clauses come first, so every
 *  week outside a window and every stint with nobody employed returns before the log is read. */
export function coachTalkCheckpointDue(world: WorldState): number | null {
  if (world.coachId === null) return null
  const cp = coachTalkCheckpointAt(coachWeeksTogether(world))
  if (cp === null) return null
  const ids = COACH_TALK_CHECKPOINT_ROWS[cp] ?? []
  const from = coachSinceWeek(world) + cp
  const spoken = lifeLogOf(world).some(
    (row) => row.kind === 'small-talk' && row.week >= from && ids.includes(smallTalkSituationIdOf(row.detail) ?? ''),
  )
  return spoken ? null : cp
}

/** ⭐⭐⭐ ROUND 52 J1 (14.10), WIDENED BY J1b (14.10) – THE CHECKPOINT THE BOND SHUT: the band that shut it, on the FIRST WEEK OF ITS WINDOW ON WHICH THE LINE COULD BE HEARD, or `null`. This is the diary fact `coachTalkShut`.
 *
 *  THE OWNER, 14.10 (round 52, his answers on the close №1): «давай по рекомендациям» – at `strained` / `cold` she does not confide at a stint checkpoint either (`raiseCoachCheckpointTalk` keeps the bond gate),
 *  AND THE SILENCE SHOWS: the week note says the talk that would have told him whether this is the right coach did not happen, so he sees what the relationship cost.
 *
 *  ⚠ J1b, 14.10 – IT IS NOT «THE FIRST WEEK» ANY MORE, AND THE REASON IS J1's OWN MEASUREMENT: asked on the window's first week alone, the note printed on 62 of 144 shut checkpoints (43.1%) and was LOST TO A TRAVELLING WEEK on 78 (54.2%) –
 *  a tournament, a journey or the week home; stints begun at week 0 read 72%, the same three calendar weeks in every career. The architect's ruling: 43% is not «the silence shows». The window is four weeks long ([cp, cp + `COACH_FEEL.periodWeeks`),
 *  `coachTalkCheckpointAt`) and the talk is still due, and still shut, in all of them, so the fact WAITS for the first week of it on which the line could be heard, and is on no other week.
 *
 *  PRESENT at week w iff ALL of:
 *   (a) a coach is employed, w is inside a checkpoint's window, that checkpoint is still due and unspoken (`coachTalkCheckpointDue` – a talk she gave INSIDE the window clears it), and the bond does not let her confide (`bondLetsHerConfide`): J1's clauses, unchanged;
 *   (b) `heardAt(w)` – w is a week the line could be heard;
 *   (c) `heardAt(u)` is false for EVERY earlier week u of the window (`coachSinceWeek + cp` <= u < w) – the note has not had its week yet. (c) is what makes it ONCE per checkpoint: after the week it prints on, every later week of the window has an earlier week it could have printed on.
 *  ⚠ A WINDOW WHOSE FOUR WEEKS ARE ALL AWAY PRINTS NOTHING (J1 counted 10%): that is the price of a note said only at the table, not a defect, and the checkpoint is then skipped for good as the talk itself is (`coachTalkCheckpointAt`).
 *
 *  ⚠⚠ `heardAt` IS THE DIARY'S ANSWER AND NOT A SPELLING OF THIS MODULE'S: `toSnapshot` hands in `silenceHeardAtFor(view)` (diary.ts), which asks `silenceCouldBeHeard` – the licence's own three inputs, `underOneRoof`, `notTravellingWeek` and
 *  `injured === null`, the predicate the four lines are licensed by – of the week's journey facts, read by THE SAME helper `assembleDiaryFacts` reads the current week with (`weekAwayOf`, diary/weekAway.ts). So «could the line be heard at week u» has one spelling for
 *  u = w and for every earlier u, and this module holds none of it: it holds the window arithmetic (the world's) and nothing about travel (the diary's). It is a parameter and not an import, so the world layer reaches no further into the diary than the snapshot already does.
 *
 *  ⚠ WHAT THE EARLIER WEEKS ARE READ WITH (J1b's approximation, COUNTED in the spec's addendum – no history is invented): the EVENTS of week u are the log's and exact (a refunded trip nets to 0 at u as it does at w, and three weeks back is inside the capped feed: weekAway.ts);
 *  three inputs have NO per-week record and take TODAY'S value – her life stage (the roof), an injury (she is not laid off today, or (b) would have stopped us, but she may have been at u and healed since) and the bond and the spoken state (a week at which the bond was open and the talk was
 *  merely held by another beat reads as shut). Each of these can only make the rule MISS a window whose first free week was hidden behind it; none can print a checkpoint twice, because a week that printed was hearable under today's values too and so hides every later week.
 *  ⚠ WHAT IT STILL DOES NOT ASK: whether another beat held the week (a different reason for the same silence – the bond is the only one the note names) or whether the week is a PLAIN one (a holiday, an exam week, the off-season is still a table). The roof, the journey and the layoff are `heardAt`'s.
 *  ⚠ THE SNAPSHOT READS THE BOND AFTER THIS TICK, while the roll read last week's settled value (`phaseHerWeek`, `rollSmallTalk` runs before `accrueSpirit`): at a band edge the two can differ by a week. The next window week is read
 *  by the roll with the new value, so a talk the roll shut and the snapshot calls open is still raised in the window; the spec's addendum counts both edges.
 *  Derived, nothing persisted, ZERO draws (no MAIN, no new stream). The cheap clauses come first, so the log is read, and the earlier weeks asked, only inside a checkpoint's window at a shut bond (at most four weeks of a stint's first 56, three times). */
export function coachTalkShutRead(world: WorldState, heardAt: (week: number) => boolean): 'strained' | 'cold' | null {
  if (world.coachId === null) return null
  const cp = coachTalkCheckpointAt(coachWeeksTogether(world))
  if (cp === null) return null
  if (bondLetsHerConfide(world)) return null
  if (coachTalkCheckpointDue(world) === null) return null
  if (!heardAt(world.week)) return null
  for (let u = coachSinceWeek(world) + cp; u < world.week; u++) {
    if (heardAt(u)) return null
  }
  return bondBandOf(world.bond ?? ECONOMY.bond.start) === 'cold' ? 'cold' : 'strained'
}

/** ⭐⭐ ROUND 52 H3 – THE RECENCY MEMORY, AS A VETO: DID SHE JUST SAY THIS ONE? The owner's round-43 law (#8(a)): «они точно не должны так часто повторяться, иначе в чём смысл» – the ordinary pick keeps it by
 *  NARROWING the pool, but a checkpoint's pick is a pool of one, so the memory can only refuse. Without it the first draft repeated one of her last two conversations in 9 of 4728 (the lottery had raised the
 *  same coach situation in the weeks BEFORE the window opened, where it does not count as said): `tests/round51-school-story-pool.test.ts` «the memory still holds» caught it.
 *  Same width as the pool's (`SMALL_TALK_EXCLUDE_LAST` small-talk rows, newest first), same comparison (the stored detail). */
function repeatsOneOfHerLastTwo(world: WorldState, detail: string): boolean {
  const log = lifeLogOf(world)
  let looked = 0
  for (let i = log.length - 1; i >= 0 && looked < SMALL_TALK_EXCLUDE_LAST; i--) {
    if (log[i]!.kind !== 'small-talk') continue
    if (log[i]!.detail === detail) return true
    looked++
  }
  return false
}

/** ⭐⭐⭐ ROUND 52 H3 (14.10) – THE CHECKPOINT TALK, RAISED: `true` when this week she brought up the coach on her own.
 *
 *  The owner: «нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять».
 *
 *  ⚠ IT IGNORES THE WEEKLY CHANCE AND THE SEASON CAP, AND THAT IS THE POINT, not an oversight: those two exist to keep ORDINARY chatter rare and spread out, and a talk that is DUE
 *  at a fixed week of the stint is not chatter – gating it by an 8% die is the lottery the owner asked to be rid of, and a season already full of small things must not eat
 *  the one conversation that tells him whether to keep the coach. (The row still lands in the log, so it counts toward the season's tally for the chatter that follows.)
 *  ⚠ WHAT IT DOES NOT IGNORE: a coach in the chair (`coachTalkCheckpointDue`), a bond band that lets her confide at all – the SAME clause the lottery (`bondLetsHerConfide`, one spelling since R52 J1)
 *  stops at, so at `strained` / `cold` she does not confide here either (the tile and the week notes still speak; the clause is one line if he rules otherwise) – and
 *  the room another beat leaves (`pendingLifeBeat` / `liveSoftBeat`, the lottery's own two guards: one at a time). Blocked, it tries again NEXT week until the window closes.
 *  ⚠ THE PICK IS DETERMINED: the checkpoint's three situations are found through `reachableSituations`, so her real feel, the stint's window, college and her voice have already
 *  said which (at most one of the three is true at once; `too-early` is on no side). No subject draw, no situation draw. ⚠ THE RECENCY MEMORY STILL APPLIES, AS A VETO (`repeatsOneOfHerLastTwo`): a situation
 *  she said one or two conversations ago is not said again, so that week is a held week like any other (it tries the next; after the window the checkpoint is skipped). The FRAME is still drawn, on its own
 *  purpose-scoped key, because every small-talk row carries one.
 *  ⚠ ZERO MAIN DRAWS: no `rng`, only `seed:smalltalk:frame:<week>` and the feel's own sub-stream. */
function raiseCoachCheckpointTalk(world: WorldState): boolean {
  const cp = coachTalkCheckpointDue(world)
  if (cp === null) return false
  if (!bondLetsHerConfide(world)) return false
  if (pendingLifeBeat(world) !== null || liveSoftBeat(world) !== null) return false
  const stage = lifeStageOf(world)
  const ids = COACH_TALK_CHECKPOINT_ROWS[cp] ?? []
  const row = reachableSituations(world, voiceOf(world), stage).find((s) => ids.includes(s.id))
  if (row === undefined) return false
  const detail = smallTalkDetailFor(row.subject, row.id)
  if (repeatsOneOfHerLastTwo(world, detail)) return false
  raiseLifeBeat(world, 'small-talk', detail, undefined, drawSmallTalkFrame(world, presenceOf(stage)))
  return true
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
  // ⭐ ROUND 52 H3 – A DUE STINT CHECKPOINT TAKES THE WEEK BEFORE THE LOTTERY IS ASKED (see `raiseCoachCheckpointTalk`); on every other week it returns false having derived nothing.
  if (raiseCoachCheckpointTalk(world)) return
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

/** ⭐⭐⭐ ROUND 51 №8 (14.10) – DID THE PARENT ANSWER HER «IS MY COACH ACTUALLY GOOD» WITH `view`, IN A STINT THAT BEGAN AT `sinceWeek`? The reading of the coach's chemistry opens on
 *  exactly this (`coachReadingOpened`, world/coachMarket.ts).
 *
 *  ⚠ DERIVED, NEVER STORED: `answerLifeBeat` already persists the option id on the never-pruned `lifeLog` row – no schema key, no migration.
 *  ⚠ `row.week > sinceWeek`, STRICTLY: the tick adds its week first and raises its beats after (`phaseHerWeek`, «ruling P») while a hire is a command stamped with the week the world then stands in,
 *  so a row raised in the week a coach arrived was raised BEFORE them. The week it was ANSWERED is not stored: a card left across a change of coach counts for the old stint (closed, never opened for a stranger).
 *  ⚠ HERE AND NOT IN THE HUB: it is tier 1's own reading (A-06's direction), and `coachMarket` can import this module because the hub already sits below it (`coachMarket -> endings -> lifeBeat`). */
export function coachRealViewedSince(world: WorldState, sinceWeek: number): boolean {
  return lifeLogOf(world).some(
    (row) =>
      row.kind === 'small-talk' &&
      row.answer === SMALL_TALK_STANCE_ID.respond &&
      smallTalkSituationIdOf(row.detail) === COACH_REAL_SITUATION_ID &&
      row.week > sinceWeek,
  )
}
