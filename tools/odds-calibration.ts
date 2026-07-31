// IS THE PREVIEW'S PERCENTAGE HONEST? — scratch bench, owner's item 8 (31.07):
// «пишет шанс обыграть на j30 84%, приезжаем, ставит нас #124 против #22, проигрыш и вылет в первом
// раунде. Точно правильно считает??»
//
// The event card quotes `fastMatchProbability` — a CLOSED FORM, no momentum, no RNG. Her actual
// match is played by `simulateMatch`, point by point, with momentum ON by default. If the two
// disagree, every percentage on every card is wrong in the same direction.
//
// One question: over many played matches at a known quoted probability, does she win that share?
import { fastMatchProbability, simulateMatch } from '../src/engine/match/engine'
import type { MatchPlayer, MatchOptions } from '../src/engine/match/types'

function player(id: string, s: number): MatchPlayer {
  return { id, name: id, serve: s, ret: s, composure: s, stamina: s, groundstrokes: s }
}

const base = (seed: string, momentum: boolean): MatchOptions => ({
  surface: 'hard',
  tour: 'wta',
  seed,
  momentum,
})

const RUNS = 300
const BUCKET = 20 // 5% buckets

function run(momentum: boolean) {
  const buckets = new Map<number, { n: number; won: number; quoted: number }>()
  for (let a = 30; a <= 90; a += 3) {
    for (let b = 30; b <= 90; b += 3) {
      const A = player('kid', a)
      const B = player('opp', b)
      const q = fastMatchProbability(A, B, base('', momentum))
      if (q < 0.02 || q > 0.98) continue
      const key = Math.min(BUCKET - 1, Math.floor(q * BUCKET))
      const rec = buckets.get(key) ?? { n: 0, won: 0, quoted: 0 }
      let won = 0
      for (let r = 0; r < RUNS; r++) {
        if (simulateMatch(A, B, base(`cal:${a}:${b}:${r}`, momentum)).winner === 0) won++
      }
      rec.n += RUNS
      rec.won += won
      rec.quoted += q * RUNS
      buckets.set(key, rec)
    }
  }
  return buckets
}

for (const momentum of [true, false]) {
  console.log(`\n=== momentum ${momentum ? 'ON (how her match is played)' : 'OFF'} ===`)
  console.log('quoted%  realised%      n    gap')
  const buckets = run(momentum)
  let worst = 0
  for (const key of [...buckets.keys()].sort((x, y) => x - y)) {
    const r = buckets.get(key)!
    const quoted = (r.quoted / r.n) * 100
    const realised = (r.won / r.n) * 100
    const gap = realised - quoted
    if (Math.abs(gap) > Math.abs(worst)) worst = gap
    console.log(
      `${quoted.toFixed(1).padStart(6)}  ${realised.toFixed(1).padStart(9)}  ${String(r.n).padStart(6)}  ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}`,
    )
  }
  console.log(`worst bucket gap: ${worst >= 0 ? '+' : ''}${worst.toFixed(1)} points`)
}
