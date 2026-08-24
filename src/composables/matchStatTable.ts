// THE FIVE ROWS OF A BOX SCORE, AND THE LINE UNDER IT - written once, read by both match surfaces.
//
// ⚠ WHY IT EXISTS. `viz/match/matchStats.ts` already owns the ARITHMETIC and always did; what was
// duplicated is everything between that and the table: the row interface, the five labels, their
// order, the side-swap that turns an (a, b) pair into a (her, them) pair, the `km/h` suffix on the
// serve row, and the one-decimal rally figure. PracticeFlow.vue and TournamentFlow.vue each carried
// their own copy, and the two copies were identical - which is the dangerous kind, because the day
// they stop being identical nothing says so and one screen quietly reports a different match from
// the other. The box score is ONE readout of one fact, the same rule `serveSpeed.ts` and
// `matchClock.ts` are already kept by: two readings of one number, computed twice, is the bug.
//
// ⚠ IT TAKES `MatchStats`, NOT THE ANNOTATED MATCH, so each screen keeps its own gate. The friendly
// always has a match; the tournament's box score is one of five phases and has none until a round is
// played, so its stats are nullable and its `matchMeta` renders behind a `v-if`. Handing in the
// computed stats leaves that difference where it belongs - with the screen that has it - and it also
// means `computeMatchStats` is called ONCE per screen rather than once for the rows and again for
// the line beneath them, which is what the two hand-rolled copies each did.
//
// ⚠ `MatchStatRow`, NOT `StatRow`. `src/components/ui/StatRow.vue` is a different thing entirely -
// the Money screen's icon/label/figure row - and the two local interfaces this replaces were both
// called `StatRow`, one import away from being confused with it.
import type { MatchStats } from '../viz/match/matchStats'
import type { Side } from '../engine/match/types'

/** One line of the box score, already turned round to her point of view. */
export interface MatchStatRow {
  label: string
  kid: string
  opp: string
}

/** The line under the table: how long the points were, and how long the match was. */
export interface MatchStatMeta {
  rally: string
  duration: string
}

/**
 * The five rows, in this order, from her side.
 *
 * ⚠ THE ORDER AND THE LABELS ARE THE READOUT and are deliberately not a parameter: a friendly and a
 * final report the same five facts, and a player reading the second one should not have to find the
 * rows again. `kidSide` is the only thing that varies, and it varies per MATCH rather than per
 * screen - the engine stores a match a-vs-b, and she is whichever of the two she was drawn as.
 */
export function matchStatRows(stats: MatchStats, kidSide: Side): MatchStatRow[] {
  const k = kidSide
  const o: Side = k === 0 ? 1 : 0
  const pair = (v: [number, number]): { kid: string; opp: string } => ({ kid: String(v[k]), opp: String(v[o]) })
  return [
    { label: 'Aces', ...pair(stats.aces) },
    { label: 'Double faults', ...pair(stats.doubleFaults) },
    { label: 'Winners', ...pair(stats.winners) },
    { label: 'Unforced errors', ...pair(stats.unforcedErrors) },
    { label: 'Max serve', kid: `${stats.serveSpeed.max[k]} km/h`, opp: `${stats.serveSpeed.max[o]} km/h` },
  ]
}

/** The match-level line: mean rally to one decimal, and the duration the clock already formatted
 *  (`viz/matchClock.ts` decides it - this only reads it, and neither screen may format it again). */
export function matchStatMeta(stats: MatchStats): MatchStatMeta {
  return { rally: stats.meanRallyLength.toFixed(1), duration: stats.durationEstimate }
}
