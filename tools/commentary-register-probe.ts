// COMMENTARY REGISTER PROBE (round 16 item 11) - the measurement behind three constants in
// src/viz/commentary.ts: RAISED_IMPORTANCE, PEAK_IMPORTANCE and GAMES_MIN.
//
// Invariant 4: tuning is measured, not guessed. Three questions, one corpus:
//
//   1. WHAT DOES MORRIS IMPORTANCE ACTUALLY LOOK LIKE on this engine? It is a published measure with
//      no published scale for a simulated bo3 junior match, so the two register thresholds have to be
//      read off the distribution rather than borrowed. Reported over ALL points and, separately, over
//      the three score situations the escalation ladder cares about.
//   2. WHERE DO THE BEATS FALL once those thresholds are applied? The population that matters is not
//      "all points" but "points that already earned a row" - a ladder whose top step nothing reaches
//      is not a ladder.
//   3. HOW OFTEN WOULD A GAME RUN FIRE at three, four and five games? GAMES_MIN has to be rare enough
//      to be news and common enough to exist.
//
// Zero RNG of its own: every match is a seeded build, and importance is arithmetic.
//
//   npx vite-node tools/commentary-register-probe.ts

import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { awardPoint } from '../src/engine/match/scoring'
import { matchWinProbability } from '../src/engine/match/liveProb'
import { buildCommentary } from '../src/viz/commentary'
import type { AnnotatedPoint } from '../src/viz/types'
import type { MatchOptions, MatchPlayer, MatchScore, Side, Surface } from '../src/engine/match/types'

const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
const N = 200

/** The same recovery `commentary.ts` does, restated here so the probe is an INDEPENDENT check on it
 *  rather than a re-run of the code it is measuring. */
function baseServes(points: readonly AnnotatedPoint[]): [number, number] {
  const found: [number | null, number | null] = [null, null]
  let side: Side = points[0].entry.winner
  let len = 0
  for (const p of points) {
    const e = p.entry
    if (len < 3 && !e.breakPoint && e.pointNumber <= 120 && found[e.server] === null) found[e.server] = e.pServe
    if (len > 0 && side === e.winner) len++
    else {
      side = e.winner
      len = 1
    }
  }
  return [found[0] ?? 0.57, found[1] ?? 0.57]
}

function scoresBefore(points: readonly AnnotatedPoint[]): MatchScore[] {
  const out: MatchScore[] = []
  const done: { a: number; b: number }[] = []
  const games: [number, number] = [0, 0]
  const pts: [number, number] = [0, 0]
  for (const p of points) {
    out.push({
      sets: [...done.map((s) => ({ a: s.a, b: s.b })), { a: games[0], b: games[1] }],
      game: { a: pts[0], b: pts[1] },
      inTiebreak: p.entry.tiebreak,
      server: p.entry.server,
      winner: null,
    })
    pts[p.entry.winner]++
    if (p.gameEnd) {
      games[p.entry.winner]++
      pts[0] = 0
      pts[1] = 0
      if (p.setEnd) {
        done.push({ a: games[0], b: games[1] })
        games[0] = 0
        games[1] = 0
      }
    }
  }
  return out
}

function importance(before: MatchScore, pA: number, pB: number): number {
  const branch = (to: Side): number => {
    const copy: MatchScore = {
      sets: before.sets.map((s) => ({ a: s.a, b: s.b })),
      game: { a: before.game.a, b: before.game.b },
      inTiebreak: before.inTiebreak,
      server: before.server,
      winner: null,
    }
    awardPoint(copy, to)
    return matchWinProbability(copy, pA, pB)
  }
  return Math.abs(branch(0) - branch(1))
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
}

function stats(xs: number[]): string {
  const s = [...xs].sort((x, y) => x - y)
  const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
  return [
    `n=${String(xs.length).padStart(6)}`,
    `mean ${mean.toFixed(3)}`,
    `median ${quantile(s, 0.5).toFixed(3)}`,
    `p90 ${quantile(s, 0.9).toFixed(3)}`,
    `p99 ${quantile(s, 0.99).toFixed(3)}`,
    `max ${(s[s.length - 1] ?? 0).toFixed(3)}`,
  ].join('  ')
}

const all: number[] = []
const onBreak: number[] = []
const onSet: number[] = []
const onMatch: number[] = []
const atBeats: number[] = []
const runCounts = new Map<number, number>() // GAMES_MIN candidate -> runs found
/** peak threshold -> how many beats above it sat on a game containing a real set or match point.
 *  The anti-vacuity check on the whole idea: if the top of the ladder is not where the stakes are,
 *  importance is measuring something other than what the ladder is about. */
const peakStakes = new Map<number, number>()
const PEAKS = [0.1, 0.12, 0.15, 0.18, 0.2, 0.25]
let sets = 0
let beats = 0
let matches = 0

for (let i = 0; i < N; i++) {
  const opts: MatchOptions = { surface: SURFACES[i % SURFACES.length], tour: 'wta', seed: `reg-${i}` }
  const res = simulateMatch(A, B, opts)
  const m = annotateMatch(res, A, B, opts)
  const [pA, pB] = baseServes(m.points)
  const before = scoresBefore(m.points)
  const imp = before.map((s) => importance(s, pA, pB))
  matches++
  sets += m.result.sets.length

  for (let k = 0; k < m.points.length; k++) {
    const e = m.points[k].entry
    all.push(imp[k])
    if (e.breakPoint) onBreak.push(imp[k])
    if (e.setPointFor !== null) onSet.push(imp[k])
    if (e.matchPointFor !== null) onMatch.push(imp[k])
  }

  for (const b of buildCommentary(m, A.name, B.name)) {
    const value = imp[b.pointIndex] ?? 0
    atBeats.push(value)
    beats++
    // Did the GAME this beat closed actually contain a set or match point? Walk back to the previous
    // game end, the same way the honesty tests do.
    let stakes = false
    for (let k = b.pointIndex; k >= 0; k--) {
      const e = m.points[k].entry
      if (e.setPointFor !== null || e.matchPointFor !== null) stakes = true
      if (k < b.pointIndex && m.points[k].gameEnd) break
    }
    if (stakes) for (const peak of PEAKS) if (value >= peak) peakStakes.set(peak, (peakStakes.get(peak) ?? 0) + 1)
  }

  // Game runs, per set, longest only - exactly the shape the beat uses.
  for (const min of [3, 4, 5]) {
    const bestPerSet = new Map<number, number>()
    let setIdx = 0
    let side: Side | null = null
    let len = 0
    for (const p of m.points) {
      if (!p.gameEnd) continue
      if (p.entry.winner === side) len++
      else {
        side = p.entry.winner
        len = 1
      }
      if (len >= min) bestPerSet.set(setIdx, Math.max(bestPerSet.get(setIdx) ?? 0, len))
      if (p.setEnd) setIdx++
    }
    runCounts.set(min, (runCounts.get(min) ?? 0) + bestPerSet.size)
  }
}

console.log(`MORRIS IMPORTANCE, ${matches} matches / ${sets} sets\n`)
console.log(`  all points   ${stats(all)}`)
console.log(`  break points ${stats(onBreak)}`)
console.log(`  set points   ${stats(onSet)}`)
console.log(`  match points ${stats(onMatch)}`)
console.log(`  at BEATS     ${stats(atBeats)}`)

console.log('\nPEAK THRESHOLD sweep - share of beats at the top of the ladder, and how many a match:\n')
for (const peak of [0.1, 0.12, 0.15, 0.18, 0.2, 0.25]) {
  const top = atBeats.filter((x) => x >= peak).length
  const stakes = peakStakes.get(peak) ?? 0
  console.log(
    `  peak ${peak.toFixed(2)}   ${((100 * top) / (atBeats.length || 1)).toFixed(0)}% of beats` +
      `   ${(top / matches).toFixed(1)} a match` +
      `   ${((100 * stakes) / (top || 1)).toFixed(0)}% of them on a real set/match point`,
  )
}

console.log('\nGAME RUNS per set, by minimum length:\n')
for (const min of [3, 4, 5]) {
  console.log(`  >= ${min} games   ${((runCounts.get(min) ?? 0) / sets).toFixed(2)} per set`)
}
console.log(`\n(beats built: ${beats}, ${(beats / matches).toFixed(1)} a match, ${(beats / sets).toFixed(2)} a set)`)
