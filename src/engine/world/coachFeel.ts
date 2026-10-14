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
    world.week - coachSinceWeek(world),
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
  const weeksTogether = world.week - coachSinceWeek(world)
  return weeksTogether > 0 && weeksTogether % COACH_FEEL.periodWeeks === 0 ? feel : null
}
