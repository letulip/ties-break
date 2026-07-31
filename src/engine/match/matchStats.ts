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

import type { AnnotatedMatch } from '../../viz/types'
import type { MatchPlayer, Side } from './types'
import { rngFromSeed } from '../rng'
import { LEGACY_SNAPSHOT_AGE, serveSpeedOf } from './serveSpeed'

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
  /** rough wall-clock estimate, `totalPoints * 42 s`, formatted `h:mm` */
  durationEstimate: string
}

// The speed model lives in ./serveSpeed.ts (age curve + skill term + jitter), because rally.ts needs
// the same numbers for the ace rate and two copies of a curve is one copy too many. One rng per
// point (seeded from the match seed + point number) drives every serve shot in it - unchanged.

/** Format seconds as `h:mm` (e.g. 7014 s -> "1:56"). */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds - hours * 3600) / 60)
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

export const POINT_SECONDS = 42

export function computeMatchStats(
  annotated: AnnotatedMatch,
  playerA: MatchPlayer,
  playerB: MatchPlayer,
): MatchStats {
  const serveSkill: [number, number] = [playerA.serve, playerB.serve]
  const age: [number, number] = [playerA.age ?? LEGACY_SNAPSHOT_AGE, playerB.age ?? LEGACY_SNAPSHOT_AGE]
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

    // Per-point serve-speed rng: every serve struck in the point draws from it, in order.
    const speedRng = rngFromSeed(`${seed}:spd:${point.entry.pointNumber}`)
    for (const shot of rally.shots) {
      if (shot.kind === 'serve1' || shot.kind === 'serve2') {
        const side = shot.by
        const spd = serveSpeedOf(speedRng, age[side], serveSkill[side], shot.kind === 'serve2')
        speedSum[side] += spd
        speedCount[side]++
        if (spd > speedMax[side]) speedMax[side] = spd
        continue
      }
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
    durationEstimate: formatDuration(annotated.result.totalPoints * POINT_SECONDS),
  }
}
