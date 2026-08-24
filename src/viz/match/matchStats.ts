// Owner item 14 – a box score for a played match, derived purely from the annotated match.
// The engine's log decides WHO wins each point; the rally annotation adds the shot-level detail
// (winners, errors, aces, double faults). Serve speeds are seeded per point from the match seed so
// the same match always reports the same speeds. Pure and total.
//
// ⚠ THE SPEED IS NO LONGER "A DETERMINISTIC COSMETIC LAYER", which is what this header used to call
// it, and the owner's complaint was exactly that: «лишь бы он на что-то влиял вообще». Two things
// changed and neither one feeds km/h back into who wins a point:
//
//   1. The model itself moved to ./serveSpeed.ts and grew an AGE term, so the number is now her
//      age's number rather than a constant with her skill added to it.
//   2. The ace rate in ./rally.ts is derived FROM that speed. An ace is a description of a point the
//      engine has already awarded (rally.ts's own header: "It never influences outcomes"), so
//      narrating more of them costs nothing and double-counts nothing.
//
// `basePServe` still decides points from `serve` alone. Feeding the km/h in on top would count the
// same talent twice - and `basePServe` is calibrated to 1.2 points over 88,500 simulated matches, so
// that swap is a project of its own and deliberately not this one.
//
// Note: `AnnotatedMatch` carries no player skills, so the two players are passed in for the serve
// skill and the age the speed model needs (a documented widening of the item's one-arg signature).
//
// ⚠ AND THIS FILE MOVED HERE FROM `src/engine/match/matchStats.ts` (R2-06 / ARCH-04), CODE
// UNCHANGED. It is a BOX SCORE: a table of readings for a screen, derived from a match the engine
// has already decided. Nothing in `src/engine`, `src/worker` or `src/db` has ever imported it – its
// only callers are `TournamentFlow.vue`, `PracticeFlow.vue` and `composables/matchStatTable.ts` –
// while it imported the runtime clock out of `viz/matchClock.ts`, which is the engine depending on
// the presentation layer. The other two options both cost more and bought less: relocating the
// clock into a shared leaf would have dragged `viz/timeline.ts` with it (`computeEndsSwaps`), and
// leaving the module in the engine behind a contract would have kept a presentation-only concept
// filed under the engine. So the module moved to where its readers and its dependency already were.
// The direction is now viz -> engine throughout, and `tests/engine-viz-direction.test.ts` holds it.

import type { AnnotatedMatch } from '../../shared/matchViz'
import type { MatchPlayer, Side } from '../../engine/match/types'
import { pointServeSpeeds } from '../../engine/match/serveSpeed'
// R17 #24: the duration is derived by viz/matchClock.ts and read here rather than computed again.
// Same rule the serve speed above lives by, and the same reason - the live clock on the court and
// the "duration" row of this box score are ONE number, so there is one place that decides it.
import { matchDurationSeconds } from '../matchClock'

export interface MatchStats {
  /** rally shots that ended the point as a clean winner, by side */
  winners: [number, number]
  /** rally net/out errors by the side that lost the point (serve faults excluded), by side */
  unforcedErrors: [number, number]
  aces: [number, number]
  doubleFaults: [number, number]
  /** mean shots per point across the whole match (match level, not per side) */
  meanRallyLength: number
  /** deterministic serve speeds in km/h, avg + max per side */
  serveSpeed: { avg: [number, number]; max: [number, number] }
  /** how long the match took, formatted `h:mm` – see viz/matchClock.ts for where it comes from */
  durationEstimate: string
}

// The speed model lives in ./serveSpeed.ts (age curve + skill term + jitter), because rally.ts needs
// the same numbers for the ace rate and two copies of a curve is one copy too many.
//
// ⚠ AND SO DOES THE SEEDING NOW (31.07). One rng per point, seeded from the match seed + the point
// number, with every serve in the point drawing from it in strike order - unchanged in every
// respect except that the loop that does it is `serveSpeed.pointServeSpeeds` rather than eight lines
// of this file. The owner asked for the serve speed LIVE on the court screen, which made the box
// score the second reader of a number rather than the only one; the two must not be able to
// disagree, so there is exactly one loop and both call it. Copying it back here would be a bug even
// if the copy started out identical.

/** Format seconds as `h:mm` (e.g. 7014 s -> "1:56"). */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds - hours * 3600) / 60)
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

// ⚠ `POINT_SECONDS = 42` WAS THE WHOLE DURATION MODEL AND IT IS GONE (R17 #24). A flat forty-two
// seconds per point, whatever the point contained: measured over 400 seeded matches it read 1:31 for
// the MEDIAN two-setter - a straight-sets match as long as most three-setters - because a constant
// per point cannot know that a set break is two minutes, a changeover ninety seconds and a point
// twenty-three. `viz/matchClock.ts` counts those four terms and puts the same median at 1:19. The
// item that removed it is the LIVE clock on the court, which needs to know where inside the match a
// reading stands and not merely what the whole thing came to.

export function computeMatchStats(
  annotated: AnnotatedMatch,
  playerA: MatchPlayer,
  playerB: MatchPlayer,
): MatchStats {
  const winners: [number, number] = [0, 0]
  const unforcedErrors: [number, number] = [0, 0]
  const aces: [number, number] = [0, 0]
  const doubleFaults: [number, number] = [0, 0]
  const speedSum: [number, number] = [0, 0]
  const speedCount: [number, number] = [0, 0]
  const speedMax: [number, number] = [0, 0]
  let shotTotal = 0

  const seed = annotated.result.seed
  for (const point of annotated.points) {
    const rally = point.rally
    const winner = point.entry.winner
    const loser: Side = winner === 0 ? 1 : 0
    shotTotal += rally.shots.length
    if (rally.ace) aces[point.entry.server]++
    if (rally.doubleFault) doubleFaults[point.entry.server]++

    // The serves, from the one shared per-point stream (see the note above).
    for (const struck of pointServeSpeeds(seed, point, playerA, playerB)) {
      speedSum[struck.side] += struck.kmh
      speedCount[struck.side]++
      if (struck.kmh > speedMax[struck.side]) speedMax[struck.side] = struck.kmh
    }
    for (const shot of rally.shots) {
      if (shot.kind === 'serve1' || shot.kind === 'serve2') continue
      // A rally stroke: a clean winner is by the point winner; a net/out error is by the loser.
      if (shot.result === 'winner') winners[shot.by]++
      else if ((shot.result === 'net' || shot.result === 'out') && shot.by === loser) unforcedErrors[shot.by]++
    }
  }

  const points = annotated.points.length
  const avg = (side: Side): number => (speedCount[side] ? Math.round(speedSum[side] / speedCount[side]) : 0)

  return {
    winners,
    unforcedErrors,
    aces,
    doubleFaults,
    meanRallyLength: points ? shotTotal / points : 0,
    serveSpeed: { avg: [avg(0), avg(1)], max: speedMax },
    durationEstimate: formatDuration(matchDurationSeconds(annotated)),
  }
}
