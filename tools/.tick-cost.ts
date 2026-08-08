// TICK COST – wall clock for the two things a week costs: tickWeek and toSnapshot.
import { createWorld, tickWeek, toSnapshot, skipTournament, closeTournament } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
const REPS = 5
const WEEKS = 400
const tickMs: number[] = []
const snapMs: number[] = []
for (let r = 0; r < REPS; r++) {
  const w = createWorld(`tick-cost-${r}`)
  const rng = rngFromSeed(w.seed)
  let t = 0
  let s = 0
  for (let i = 0; i < WEEKS; i++) {
    const a = performance.now()
    tickWeek(w, rng)
    if (w.pendingTournament) { skipTournament(w); closeTournament(w) }
    const b = performance.now()
    toSnapshot(w)
    const c = performance.now()
    t += b - a
    s += c - b
  }
  tickMs.push(t / WEEKS)
  snapMs.push(s / WEEKS)
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
console.log(`tickWeek   median ${med(tickMs).toFixed(3)} ms/week   (${tickMs.map((x) => x.toFixed(2)).join(' ')})`)
console.log(`toSnapshot median ${med(snapMs).toFixed(3)} ms/week   (${snapMs.map((x) => x.toFixed(2)).join(' ')})`)
