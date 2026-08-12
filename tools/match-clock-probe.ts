// R17 #24 – WHAT A MATCH IN THIS ENGINE ACTUALLY CONTAINS, so the diegetic clock's constants are
// calibrated against real tennis durations rather than guessed at (invariant 4).
//
// Throwaway measurement harness for docs/specs/round17-match-screen.md §2. Run: vite-node tools/match-clock-probe.ts
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { computeEndsSwaps } from '../src/viz/timeline'
import type { MatchPlayer, MatchOptions, Surface } from '../src/engine/match/types'

const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

const SECONDS_PER_SHOT = Number(process.env.SPS ?? 1.4)
const BETWEEN_POINTS = Number(process.env.BP ?? 20)
const CHANGEOVER = Number(process.env.CO ?? 90)
const SET_BREAK = Number(process.env.SB ?? 120)

interface Row {
  sets: number
  points: number
  games: number
  shots: number
  seconds: number
}

const rows: Row[] = []
for (let i = 0; i < 400; i++) {
  const opts: MatchOptions = { surface: SURFACES[i % 3], tour: 'wta', seed: `probe-${i}` }
  const m = annotateMatch(simulateMatch(A, B, opts), A, B, opts)
  const ends = computeEndsSwaps(m.points)
  let shots = 0
  let games = 0
  let seconds = 0
  const last = m.points.length - 1
  for (let p = 0; p <= last; p++) {
    const pt = m.points[p]
    shots += pt.rally.shots.length
    if (pt.gameEnd) games++
    seconds += pt.rally.shots.length * SECONDS_PER_SHOT
    if (p === last) continue
    if (pt.setEnd) seconds += SET_BREAK
    else if (pt.gameEnd && ends.changeEndsAfter[p]) seconds += CHANGEOVER
    else seconds += BETWEEN_POINTS
  }
  rows.push({ sets: m.result.sets.length, points: m.points.length, games, shots, seconds })
}

function stat(xs: number[]): string {
  const s = [...xs].sort((a, b) => a - b)
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))]
  const mean = s.reduce((a, b) => a + b, 0) / s.length
  return `min ${s[0].toFixed(1)}  p10 ${at(0.1).toFixed(1)}  med ${at(0.5).toFixed(1)}  mean ${mean.toFixed(1)}  p90 ${at(0.9).toFixed(1)}  max ${s[s.length - 1].toFixed(1)}`
}

console.log(`shot ${SECONDS_PER_SHOT}s  between ${BETWEEN_POINTS}s  changeover ${CHANGEOVER}s  set break ${SET_BREAK}s`)
for (const nSets of [2, 3]) {
  const sub = rows.filter((r) => r.sets === nSets)
  if (!sub.length) continue
  console.log(`\n=== ${nSets}-set matches (${sub.length} of ${rows.length}) ===`)
  console.log(`points       ${stat(sub.map((r) => r.points))}`)
  console.log(`games        ${stat(sub.map((r) => r.games))}`)
  console.log(`shots/point  ${stat(sub.map((r) => r.shots / r.points))}`)
  console.log(`MINUTES      ${stat(sub.map((r) => r.seconds / 60))}`)
  console.log(`old 42s/pt   ${stat(sub.map((r) => (r.points * 42) / 60))}`)
}
console.log(`\nALL points   ${stat(rows.map((r) => r.points))}`)
console.log(`ALL minutes  ${stat(rows.map((r) => r.seconds / 60))}`)
