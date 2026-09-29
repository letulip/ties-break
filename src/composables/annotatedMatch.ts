// ⭐⭐ ONE REPLAY RECIPE FOR THE FOUR SCREENS THAT RE-WATCH A STORED MATCH – F-08 / C-04, 27.09.
//
// ⚠ WHAT THIS FILE IS. `MatchReplay`, `PracticeFlow`, `TournamentFlow` and `PrologueLocalOpen` each
// built the same three lines: the options a record was played under, `simulateMatch` on the stored
// seed, `annotateMatch` over the result. Four copies, matched against the engine's four RECORDING
// sites by convention only – and a replay is a RE-SIMULATION, so its only link to the scoreline
// printed beside it is option equality. The day the engine records under different options a missed
// copy shows a match that ends with a different score from the feed line above it (August's
// «Replay recipe copy-pasted 3x», 05.09's C.7 `useAnnotatedMatch`, then F-08 with the prologue
// weekend as a fourth). The options half of the recipe now belongs to the engine
// (`recordedMatchOptions`, the same function the recorders build with) and the annotation half
// belongs here.
//
// ⚠ IT IS A PURE FUNCTION AND IMPORTS NO VUE, deliberately. Each screen keeps its own `computed`
// around it – two of them replay a required prop and two replay a nullable one, and a composable
// that had to answer both would hand back `AnnotatedMatch | null` to callers whose viewer requires
// an `AnnotatedMatch`. Reactivity stays where it was; only the recipe moved. It also means the
// tests that assert «every stored record replays» can call exactly what the screens call, which is
// the whole of C-04: before this they proved the TESTS' spelling reproduced the engine.
import { recordedMatchOptions, simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import type { MatchPlayer, Surface } from '../engine/match/types'
import type { AnnotatedMatch } from '../shared/matchViz'

/** Everything a replay needs off a record: the two skill snapshots as they were at match time, the
 *  court, and the seed the engine wrote. A `WorldMatch` satisfies it as it stands; the prologue's
 *  `MatchRecord` carries no surface (its weekend's event does) and no players (the draw does), so
 *  that screen composes the shape from what it has. */
export interface ReplayableMatch {
  surface: Surface
  seed?: string
  a: MatchPlayer
  b: MatchPlayer
}

/** Re-run a recorded match and annotate it – the whole of what a re-watch is. Draws no MAIN
 *  randomness and writes nothing: `simulateMatch` is a pure function of `(a, b, opts)` and the
 *  stored seed is the options' seed, so this reproduces the committed match point for point. */
export function replayMatch(rec: ReplayableMatch): AnnotatedMatch {
  const opts = recordedMatchOptions(rec)
  return annotateMatch(simulateMatch(rec.a, rec.b, opts), rec.a, rec.b, opts)
}
