// PROBE (A1 research, 21.09.2026) – the favourite's curve: what chance does the closed form give
// a stronger player, as a function of the attribute gap the cohort actually produces?
//
// Owner's observation driving it: «меня смущает наша статистика побед… глубина проходов и вылеты,
// особенно на одаренных карьерах». If the curve is too flat at the gaps our tour really contains,
// three symptoms follow at once: gifted careers exit early, small-tier grinding under-pays, and
// twelve R1 exits at the big draws become the better points bet (the wave-8 A1 inversion).
//
// Zero MAIN draws: worlds are created and read, never ticked.

import { createWorld } from '../src/engine/world'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { fastMatchProbability } from '../src/engine/match/engine'
import type { AiPlayer } from '../src/engine/season/types'

const overall = (p: AiPlayer): number => (p.serve + p.ret + p.composure + p.stamina) / 4

const SEEDS = ['a1-probe:1', 'a1-probe:2', 'a1-probe:3', 'a1-probe:4', 'a1-probe:5']

type Pair = { gap: number; p: number }
const pairs: Pair[] = []
const spreads: { top10: number; mid: number; tail: number }[] = []

for (const seed of SEEDS) {
  const w = createWorld(seed)
  const sorted = [...w.cohort].sort((a, b) => overall(b) - overall(a))
  const n = sorted.length
  spreads.push({
    top10: sorted.slice(0, 10).reduce((s, p) => s + overall(p), 0) / 10,
    mid: sorted.slice(Math.floor(n / 2) - 5, Math.floor(n / 2) + 5).reduce((s, p) => s + overall(p), 0) / 10,
    tail: sorted.slice(n - 20).reduce((s, p) => s + overall(p), 0) / 20,
  })
  // every ordered pair among a 40-player sample spread across the table
  const sample: AiPlayer[] = []
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 40))) sample.push(sorted[i])
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const a = rivalMatchPlayer(sample[i], 'hard')
      const b = rivalMatchPlayer(sample[j], 'hard')
      const p = fastMatchProbability(a, b, { surface: 'hard', tour: 'wta', seed: `${seed}:p:${i}:${j}` })
      pairs.push({ gap: overall(sample[i]) - overall(sample[j]), p })
    }
  }
}

// bucket by gap
const buckets = new Map<number, { sum: number; n: number; min: number; max: number }>()
for (const { gap, p } of pairs) {
  const k = Math.min(30, Math.round(gap / 2.5) * 2.5)
  const b = buckets.get(k) ?? { sum: 0, n: 0, min: 1, max: 0 }
  b.sum += p; b.n += 1; b.min = Math.min(b.min, p); b.max = Math.max(b.max, p)
  buckets.set(k, b)
}

console.log('== the cohort spread (overall 0-100, 5 worlds averaged) ==')
const avg = (f: (s: typeof spreads[0]) => number) => (spreads.reduce((s, x) => s + f(x), 0) / spreads.length).toFixed(1)
console.log(`top-10 ${avg(s => s.top10)} · mid-table ${avg(s => s.mid)} · tail-20 ${avg(s => s.tail)}`)
console.log('== favourite win probability by attribute gap ==')
for (const k of [...buckets.keys()].sort((x, y) => x - y)) {
  const b = buckets.get(k)!
  console.log(`gap ${String(k).padStart(4)}  p(win) mean ${(b.sum / b.n).toFixed(3)}  [${b.min.toFixed(3)}..${b.max.toFixed(3)}]  n=${b.n}`)
}
console.log(`pairs total: ${pairs.length}`)

// == ARM 2 – the comeback staircase, denominated in the game's own Elo ==
import { coreForStanding, eloForStanding } from '../src/engine/season/fieldPros'

const ELO_PER_CORE = 20.2 // SKILL_LAW.eloPerCore – the module's own measured rate
function standingForElo(elo: number): number {
  // invert eloForStanding numerically over 1..1600
  let lo = 1, hi = 1600
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (eloForStanding(mid) > elo) lo = mid
    else hi = mid
  }
  return hi
}

console.log('\n== the staircase in Elo (game rate: 20.2 Elo/core) ==')
for (const rank of [15, 31, 60]) {
  const core = coreForStanding(rank)
  const elo = eloForStanding(rank)
  console.log(`returner at #${rank}: core ${core.toFixed(1)}, Elo ${elo.toFixed(0)}`)
  for (const { factor } of [{ factor: 0.6 }, { factor: 0.8 }, { factor: 0.9 }]) {
    const eff = core * factor
    const dElo = (core - eff) * ELO_PER_CORE
    const effElo = elo - dElo
    const asRank = standingForElo(effElo)
    console.log(`  x${factor}: effective core ${eff.toFixed(1)}  -${dElo.toFixed(0)} Elo -> ~${effElo.toFixed(0)}  ≈ plays like #${asRank}`)
  }
}
console.log('\n== what the research plausibly meant, in the same denomination ==')
for (const dElo of [100, 150, 200, 250]) {
  const factorAt31 = (coreForStanding(31) - dElo / ELO_PER_CORE) / coreForStanding(31)
  console.log(`-${dElo} Elo on a #31 (core ${coreForStanding(31).toFixed(1)}) = factor x${factorAt31.toFixed(3)}`)
}
