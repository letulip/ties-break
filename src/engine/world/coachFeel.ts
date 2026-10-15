// HER FEEL FOR THE COACH SHE HAS – the world-level reading of `chemistry.ts` §5c (round 52 F1, 14.10).
//
// The owner: «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы
// у игрока была какая-то обратная связь от ребенка для принятия решения в случае если химия не растет или незаметно».
// The arithmetic is `coachFeelOf` (pure, in the chemistry leaf); this file only fetches its five arguments off a world.
//
// ⚠⚠ A LEAF, AND IT HAS TO BE ONE: three readers need it and one of them is the life-beat hub (`lifeBeat.ts`, the
// small-talk hunch), which cannot import `coachMarket.ts` (coachMarket -> endings -> lifeBeat is a cycle that
// `tests/import-cycles.test.ts` refuses). So this module imports `../coach` (the roster, itself a leaf), `../chemistry`,
// `./age`, `./coachStint` (where `coachSinceWeek` moved for exactly this reason) and a TYPE – nothing that reaches back.
//
// ⚠ ZERO MAIN DRAWS AND NOTHING PERSISTED. The affinity is re-derived (`affinityFor` is a pure function of the career's
// seed and the coach's identity), the stint's age is a read of the ledger, and the only randomness is the feel's own
// purpose-scoped sub-stream. A snapshot cut ten times in a row, or before and after a reload, says the same thing.

import { coachById, type Coach } from '../coach'
import { COACH_FEEL, affinityFor, coachFeelOf } from '../chemistry'
import type { CoachFeel } from '../../shared/protocol'
import { ageAtWeek } from './age'
import { coachSinceWeek } from './coachStint'
import type { WorldState } from './state'

/** ⭐ THE PAIR'S AFFINITY FOR THIS WORLD – the ONE spelling of «which four facts make `A`», read by the tick
 *  (`phaseGrowth.ts`'s `accrueCoachPair`, the only writer of `world.coachPairs`) and by her feel. Before round 52 the
 *  tick spelled the call out inline; two spellings of the same four arguments is how a feel and the level it reads
 *  would come to disagree about who the pair is, so the tick now calls this too.
 *
 *  ⚠ HER BIRTH TEMPERAMENT AND NEVER THE EXPRESSED ONE – `world.temperament` is BIRTH, FOREVER (that field's own
 *  note), and the affinity must be a pure function of `(seed, coachId)` plus those two traits or «every variation
 *  reproducible» stops being true. Zero draws on any shared stream. */
export function coachPairAffinity(world: WorldState, coach: Coach): number {
  return affinityFor(world.seed, coach.id, world.temperament, coach.manner)
}

/** ⭐ THE STINT'S AGE IN WEEKS – the ONE spelling (round 52 H2, 14.10). Her feel, the week notes' period test and the half-year and year facts of R70–R75
 *  all ask «how long has she had THIS coach», and three inline copies of `world.week - coachSinceWeek(world)` is how the feel and the window that gates a
 *  conversation about it would come to disagree by a week. It restarts on every hire and every release (`coachSinceWeek`'s own rule). Pure, zero draws. */
export function coachWeeksTogether(world: WorldState): number {
  return world.week - coachSinceWeek(world)
}

/** ⭐⭐⭐ HOW SHE FEELS ABOUT THE COACH SHE HAS RIGHT NOW – `null` when nobody is employed (the parent on the court has
 *  no coach to feel anything about; the snapshot then carries no key at all, see `Snapshot.coachFeel`).
 *
 *  `weeksTogether` is `world.week - coachSinceWeek(world)`: the stint's age, which restarts on EVERY hire and release
 *  (both arms count, `coachSinceWeek`'s own rule) – a new coach is a new first impression. A pair with no row yet
 *  (she has not trained with him a single paid week) reads chem 0, and `coachFeelOf` says «too early» for its first
 *  six weeks, so this cannot lean on nothing.
 *
 *  ⚠ A COACH THE ROSTER DOES NOT KNOW READS `null` TOO – the tick resolves him the same way (`coachById`) and accrues
 *  nothing for an id it cannot find, so there is no pair to have a feeling about. Never reached by a legal career. */
export function coachFeel(world: WorldState): CoachFeel | null {
  if (world.coachId === null) return null
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
  if (coach === null) return null
  return coachFeelOf(
    world.coachPairs?.[coach.id],
    coachPairAffinity(world, coach),
    coachWeeksTogether(world),
    world.seed,
    coach.id,
  )
}

/** ⭐⭐ R52 F3 (14.10) – HER FEEL ON THE WEEK SHE WAS ASKED AGAIN: the step on exactly the weeks the diary may let the
 *  parent hear it at the table, `null` on every other.
 *
 *  The owner chose the week notes as a channel for the hint and asked for it «изредка», not a line a week. So a note is
 *  licensed once per PERIOD: `COACH_FEEL.periodWeeks`, the weeks her doubt is redrawn on (`coachFeelScore`'s `period`
 *  is `floor(weeksTogether / periodWeeks)`, and this is the week that quotient turns over – read off the same
 *  constant, never a retyped 4). That is also the week her feel was re-read.
 *
 *  ⚠ NOT THE WEEK OF THE HIRE (`weeksTogether` 0). The hire stamps `coach-since-<week>` on the week the parent signs;
 *  the tick that follows is the first one this coach trains her in, so at 0 the week being told is the one BEFORE this
 *  coach, and a line about her quoting the coach would be about a stranger. A coach hired back whose gauge already
 *  speaks has a feel at 0 (F1b) and waits for the first week there was a practice to hear about.
 *
 *  ⚠ `too-early` IS NEVER READ: there is nothing to hint at yet, and a week that says nothing is the right note.
 *
 *  `feel` is passed IN rather than re-read: the snapshot has already asked `coachFeel(world)` once, and the tile, the
 *  hunch and the note must be the same answer. Derived, nothing persisted, zero draws. */
export function coachFeelRead(world: WorldState, feel: CoachFeel | null): Exclude<CoachFeel, 'too-early'> | null {
  if (feel === null || feel === 'too-early') return null
  const weeksTogether = coachWeeksTogether(world)
  return weeksTogether > 0 && weeksTogether % COACH_FEEL.periodWeeks === 0 ? feel : null
}

// ---------------------------------------------------------------------------------------------------------------------
// ⭐⭐ ROUND 52 H2 (14.10) – THE STINT'S WINDOWS: the six facts of R70–R75 (half a year together, a year together)
// ---------------------------------------------------------------------------------------------------------------------
// The owner: «нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше
// поменять». R67–R69 (the hub's `coach-feel-warm / -unsure / -cold`) are her first impression; these six are the same three sides at two later ages of the stint.
//
// ⚠ WHY THE TABLE LIVES IN THIS LEAF AND NOT IN THE HUB. `lifeBeat.ts` sits at its A-06 ceiling (`tests/principles-a06-life-beat-direction.test.ts`), and a
// fact that reads her feel and the stint's age is a read of THIS module's own two things. The hub spreads the table into `SMALL_TALK_FACT` and hands it
// `inCollege` (the C-07 clause, college.ts): the leaf cannot import the hub, and importing college.ts here would drag its fan-out into a module whose whole
// point is that nothing it imports reaches back. Passing the question in keeps ONE spelling of «is she at college this week».

/** Weeks together at which the half-year talks open: six feel periods (`COACH_FEEL.periodWeeks` is 4), half a year rounded DOWN to a period boundary, where her
 *  feel has just been redrawn. The design's checkpoints are weeks 12 / 28 / 56 (first impression, half a year, a year); 28 sits four weeks inside, the last four of the window. */
export const COACH_TALK_HALF_YEAR_FROM_WEEK = 24
/** …and closes at week 32: eight periods, which is also where the half-year checkpoint's own four weeks [28, 32) end.
 *
 *  ⚠ R52 J6 (15.10) – THE OWNER'S RULING ON R71, and why this is no longer 44. His question: «реплика говорит «полгода», но окно факта открыто с 24-й по 43-ю неделю, а
 *  обязательная точка — 32-я (почти восемь месяцев).» His answer: «Точку на 28-ю нед.» The window was [24, 44) – twelve weeks AFTER the old checkpoint, room for a retry – so
 *  ordinary small talk could say «half a year» as late as week 43, ten months in. It is [24, 32) now: the checkpoint (28) is the window's last four weeks, ordinary small talk
 *  has weeks 24 to 27 before it, and from week 32 no «half a year» line is true. It is sixteen weeks before the year window opens: «months» and «a year» are never both true. */
export const COACH_TALK_HALF_YEAR_UNTIL_WEEK = 32
/** Weeks together at which the year talks open: twelve periods, a year rounded DOWN to a period; the year checkpoint (56) sits eight weeks inside. */
export const COACH_TALK_YEAR_FROM_WEEK = 48
/** …and closes at week 64: sixteen periods, so the window is [48, 64) – the checkpoint's own four weeks [56, 60) in the middle, ordinary small talk on weeks 48 to 55 and 60 to 63.
 *
 *  ⚠ R52 J6 (15.10) – THE OWNER'S RULING ON R73–R75, and why this is no longer infinity. This used to be «NO CEILING, AS BRIEFED: «a year» is a floor and the stint does not get
 *  younger», and the note beside it said that if the owner wanted it tighter this was the one constant. He did. His question: ««год» доступен с 48-й недели без верхней границы.
 *  Может ли R73–R75 выпасть в обычном small talk спустя два-три года с тем же тренером?» It could – every week of a stint of three years. His answer: «Окно 48–63 нед.»
 *  So «a year in» is said in a stint's second year and not after it; a girl who has had the same coach for three years hears neither «half a year» nor «a year». The facts read
 *  this constant, so the lottery, the pool and the checkpoint stay in agreement without a second spelling. */
export const COACH_TALK_YEAR_UNTIL_WEEK = 64

/** The three SIDES of the scale, spelled as the hub spells them for R67–R69 (`coach-feel-warm / -unsure / -cold`). ⚠ Two spellings of one thing: the parity test
 *  in `tests/r52-coach-feel-talk.test.ts` (section L) holds them together, inside the windows, over a grid that reaches every step. `too-early` is in none. */
const WARM_SIDE: readonly CoachFeel[] = ['seems-good', 'good']
const UNSURE_SIDE: readonly CoachFeel[] = ['unsure']
const COLD_SIDE: readonly CoachFeel[] = ['seems-off', 'off']

export const COACH_FEEL_STINT_FACTS = [
  'coach-feel-warm-half',
  'coach-feel-unsure-half',
  'coach-feel-cold-half',
  'coach-feel-warm-year',
  'coach-feel-unsure-year',
  'coach-feel-cold-year',
] as const
export type CoachFeelStintFact = (typeof COACH_FEEL_STINT_FACTS)[number]

/** The hub's fact signature: the world, and the pass's ONE lazy read of her feel (R52 F5). Declared here because this leaf must not import the hub's type. */
type StintFactRead = (world: WorldState, feelOnce: () => CoachFeel | null) => boolean

/** ⭐⭐ THE SIX FACTS, as the hub's `SMALL_TALK_FACT` entries: her feel on one side AND the stint inside one window. `refuse` is the hub's `inCollege` – the coach does
 *  not work in college weeks, so a girl in a dorm has no stint to be a year into.
 *
 *  ⚠ THE CHEAP CLAUSES FIRST AND THE FEEL LAST: no coach and college need no read, and outside its window a fact never asks `feelOnce` at all, so a career in
 *  its second week of a stint costs the pass nothing. `coachFeel` is `null` with nobody employed and `null` is in no side. Pure and zero-draw: the only
 *  randomness is the feel's own purpose-scoped sub-stream, never MAIN. */
export function coachFeelStintFacts(refuse: (world: WorldState) => boolean): Record<CoachFeelStintFact, StintFactRead> {
  const read =
    (from: number, until: number, side: readonly CoachFeel[]): StintFactRead =>
    (world, feelOnce) => {
      if (world.coachId === null || refuse(world)) return false
      const weeks = coachWeeksTogether(world)
      if (weeks < from || weeks >= until) return false
      const feel = feelOnce()
      return feel !== null && side.includes(feel)
    }
  return {
    'coach-feel-warm-half': read(COACH_TALK_HALF_YEAR_FROM_WEEK, COACH_TALK_HALF_YEAR_UNTIL_WEEK, WARM_SIDE),
    'coach-feel-unsure-half': read(COACH_TALK_HALF_YEAR_FROM_WEEK, COACH_TALK_HALF_YEAR_UNTIL_WEEK, UNSURE_SIDE),
    'coach-feel-cold-half': read(COACH_TALK_HALF_YEAR_FROM_WEEK, COACH_TALK_HALF_YEAR_UNTIL_WEEK, COLD_SIDE),
    'coach-feel-warm-year': read(COACH_TALK_YEAR_FROM_WEEK, COACH_TALK_YEAR_UNTIL_WEEK, WARM_SIDE),
    'coach-feel-unsure-year': read(COACH_TALK_YEAR_FROM_WEEK, COACH_TALK_YEAR_UNTIL_WEEK, UNSURE_SIDE),
    'coach-feel-cold-year': read(COACH_TALK_YEAR_FROM_WEEK, COACH_TALK_YEAR_UNTIL_WEEK, COLD_SIDE),
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// ⭐⭐⭐ ROUND 52 H3 (14.10) – THE STINT CHECKPOINTS: the weeks of a coaching stint at which her talk about the coach ARRIVES ON ITS OWN
// ---------------------------------------------------------------------------------------------------------------------
// The owner: «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или
// лучше поменять». R67–R75 are ordinary small talk, so a stint met any one of them on a lottery (the H2 measurement: R70 and R71 did not drop once in 36 careers). The
// mechanism that raises them at a fixed point of the stint lives in `world/lifeBeat/smallTalk.ts` (it needs the life log, which this leaf must not import); the WEEKS are here,
// beside the windows they have to sit inside.

/** ⭐⭐⭐ THE WEEKS TOGETHER AT WHICH SHE BRINGS UP THE COACH WITHOUT WAITING FOR THE LOTTERY: 12 (about three months – her first impression, once the six «too early»
 *  weeks are well behind), 28 (about six and a half months, the last four weeks of the half-year window [24, 32)) and 56 (about thirteen months, eight weeks inside the year window [48, 64)).
 *
 *  ⚠ R52 J6 (15.10) – THE HALF-YEAR CHECKPOINT MOVED FROM 32 TO 28, the owner's ruling. His question on R71: «реплика говорит «полгода», но окно факта открыто с 24-й по 43-ю неделю,
 *  а обязательная точка — 32-я (почти восемь месяцев).» His answer: «Точку на 28-ю нед.» 28 is seven feel periods (7 x 4), so it is still a week her feel was just re-read, and
 *  its window [28, 32) ends exactly where the half-year window does. The year checkpoint stays at 56.
 *
 *  ⚠ EVERY ONE A MULTIPLE OF `COACH_FEEL.periodWeeks` (4): her doubt is redrawn on a period boundary (`coachFeelScore`'s `floor(weeksTogether / periodWeeks)`), so the week
 *  a checkpoint opens is a week her feel was JUST re-read – she talks about the coach on the freshest reading she has. A checkpoint that fell mid-period would speak
 *  from a feel up to three weeks old. `tests/r52-coach-talk-checkpoints.test.ts` pins the multiples and the two containments.
 *
 *  ⚠ NOT A TABLE OF CHANCES: a checkpoint is a week the talk is DUE, not a week it may drop. The owner's complaint was exactly «раз в 19 лет». */
export const COACH_TALK_CHECKPOINTS: readonly number[] = [12, 28, 56]

/** WHICH CHECKPOINT'S WINDOW THIS STINT AGE IS INSIDE, or `null`. A window is ONE FEEL PERIOD long: [cp, cp + `COACH_FEEL.periodWeeks`) – four tries for a week another beat
 *  did not take, and ⚠ AFTER IT THE CHECKPOINT IS SKIPPED FOR GOOD: «a year in» said at week 60 is no longer on time, her feel has been re-read since, and the next
 *  checkpoint (or the ordinary lottery) is the right place for the next word. Pure, no world, no draw. */
export function coachTalkCheckpointAt(weeksTogether: number): number | null {
  return COACH_TALK_CHECKPOINTS.find((cp) => weeksTogether >= cp && weeksTogether < cp + COACH_FEEL.periodWeeks) ?? null
}
