// THE ANSWER A HARNESS GIVES WHEN IT IS NOT MEASURING HER – ONE IMPLEMENTATION, FOR `tools/` AND
// `tests/` BOTH. `npm run bench:*`, the e2e fixture generator and `tests/helpers/career.ts` all walk
// careers past questions they never meant to price, and this is the single place that answers them.
//
// ⚠ UNDERSCORE-PREFIXED, ON `tools/_seeds.ts`' OWN CONVENTION. `tools/` is otherwise flat and every
// other file in it is an instrument you run; the prefix is what says "shared module, not a bench".
//
// ⚠ AND `tools/` IS THE HOME RATHER THAN `tests/`, WHICH IS THE DIRECTION THE REPOSITORY ALREADY
// RUNS: 25 files under `tests/` import from `tools/`, and no file under `tools/` imports from
// `tests/`. Putting the helper the other way round would have been the first edge pointing back.
//
// ⚠⚠ WHY IT EXISTS, AND IT IS A FINDING RATHER THAN A CONVENIENCE. Until v74 there was exactly ONE
// `LifeBeatKind`, so `answerLifeBeat(world, 'listen')` was a complete answer to any pending beat, and
// 46 sites across 38 tools wrote that line out by hand. Wave 3's T6 adds `'met'`, raised on
// `knownWeek` – any week from her sixteenth birthday on – and `'listen'` is not one of ITS
// answers: the engine deliberately refuses an unoffered option id («That is not one of the answers
// this beat offered»), so every one of those call sites threw the first time its career met somebody,
// and any walker that handled no beat at all simply stalled, because `advanceWeeks` refuses to tick
// while a row is unanswered. One helper, asked of the row's OWN kind, is what stops the next beat
// kind doing it again.
//
// ⚠⚠ AND IT IS INVISIBLE TO THE GATE, WHICH IS WHY IT WAS REPAIRED DELIBERATELY RATHER THAN FOUND.
// Every one of those 46 lines TYPECHECKS – `answerLifeBeat` takes a `string` – so `npm run check`
// was green across the whole breakage. It was measured by running the tools: `npm run e2e:fixtures`
// exited 1 at `tools/e2e-fixtures.ts:202`, and `tools/spirit-bench.ts`, whose `try/catch` swallows
// the throw, exited 0 while its own census printed 842 beats raised and ZERO answered over a 4-seed
// grid – with `bond @ fork` NaN in both arms, because `answerFork` refuses behind an open row.
import { answerLifeBeat, pendingLifeBeat, pendingLifeBeatOptions, type WorldState } from '../src/engine/world'
import type { LifeBeatKind } from '../src/shared/protocol'

/** ⭐⭐ ANSWER WHATEVER BEAT IS WAITING, WITH THE ANSWER THAT COSTS NOTHING, AND KEEP ANSWERING UNTIL
 *  THE QUEUE IS EMPTY. Returns how many it cleared.
 *
 *  ⚠ BOND-NEUTRAL BY CONSTRUCTION. It takes the option whose delta is zero, so a beat a harness never
 *  meant to live cannot move the number that harness is measuring – and it THROWS if a kind has no
 *  such option rather than picking one, because a silently chosen answer would move every bond
 *  reading downstream of it by an unknown amount. Today that is `'listen'` on `'fork-opinion'`
 *  (`beatListened` is 0) and `'wary'` on `'met'` (`metWary` is 0), which is byte-for-byte what the
 *  46 hand-written lines did on the one kind that used to exist.
 *
 *  ⚠⚠ AND IT ASKS THE ENGINE FOR **THIS ROW'S** PRICES, NOT FOR THE TABLE (v74 T7, 11.09). The
 *  wants flip re-prices two of `'met'`'s four answers for a girl who asked that it be kept quiet, so
 *  `LIFE_BEAT_OPTIONS` is no longer «what an answer costs» – it is the `'open'` column of it.
 *  Reading the record directly would have been asking one question and paying for another: today the
 *  two agree (`wary` is 0 in both readings, which is exactly what the flip being an OVERLAY
 *  guarantees) and NOTHING any bench measures moves, but the agreement would be a coincidence this
 *  file depended on rather than a property it checked. `pendingLifeBeatOptions` is the engine's own
 *  reading, so the zero this picks is the zero `answerLifeBeat` will charge. */
export function drainLifeBeats(world: WorldState, except?: LifeBeatKind): number {
  let cleared = 0
  for (let guard = 0; guard < 200; guard++) {
    const row = pendingLifeBeat(world)
    // ⚠ `except` IS FOR A HARNESS WHOSE SUBJECT IS ONE OF THE KINDS: a walk that drained the beat it
    // was built to reach would delete the thing the file is about (`tools/spirit-bench.ts`'s two
    // arms are the live case). Everything else is cleared.
    if (row === null || row.kind === except) return cleared
    const free = pendingLifeBeatOptions(world)?.find((o) => o.bond === 0)
    if (!free) throw new Error(`${row.kind} has no bond-neutral answer – a walk cannot drain it without moving the number`)
    answerLifeBeat(world, free.id)
    cleared++
  }
  throw new Error('a life-beat queue that will not drain')
}
