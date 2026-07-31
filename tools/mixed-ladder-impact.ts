// HOW MUCH DOES THE MIXED AI LADDER ACTUALLY CHANGE? — the owner, 31.07, on the finding the ladder
// audit reported but deliberately did not fix: «давай подробнее понимать в чем дело, если есть
// дефект, надо понять как с ним быть.»
//
// THE DEFECT. `tickWeek` builds ONE ranking for the whole AI world:
//     computeRanking(results-without-kid, week, ids)          // <- no `countsFor` predicate
// and `computeRanking`'s own doc says "Absent => every result counts". So national points and ITF
// points are ADDED - the one thing docs/specs/two-ladders.md says must never happen, because they
// are different currencies with no exchange rate. That table then decides `selectEntrants` (who is
// in every field, at every tier) and the seeding inside every draw.
//
// THE QUESTION THIS ANSWERS is not "is it wrong" - it is - but "how much does it move", because the
// fix is not a code change. `selectEntrants` consumes MAIN-stream draws, so re-pointing it re-orders
// the selection and moves the frozen capture (41550 / e6b0c709) and every golden pin with it. That
// is a re-pin slice with a bench pass, and it should be bought with a number.
import { createWorld, tickWeek, KID_ID } from '../src/engine/world'
import { computeRanking } from '../src/engine/season/ranking'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { Track } from '../src/engine/season/types'

const SEEDS = 10
const WEEKS = 156

const onlyTrack =
  (track: Track) =>
  (r: SeasonResult): boolean =>
    r.tier ? TIERS[r.tier].track === track : track === 'domestic'

/** Spearman-ish: mean |rank difference| over players ranked in the split table. */
function topKOverlap(a: { playerId: string }[], b: { playerId: string }[], k: number): number {
  const A = new Set(a.slice(0, k).map((r) => r.playerId))
  const B = b.slice(0, k).map((r) => r.playerId)
  return B.filter((id) => A.has(id)).length / Math.max(1, Math.min(k, a.length, b.length))
}

const rows: { track: Track; k: number; overlap: number[]; seedSwap: number[] }[] = [
  { track: 'domestic', k: 8, overlap: [], seedSwap: [] },
  { track: 'domestic', k: 32, overlap: [], seedSwap: [] },
  { track: 'itf', k: 8, overlap: [], seedSwap: [] },
  { track: 'itf', k: 32, overlap: [], seedSwap: [] },
]
let topSeedChanged = 0
let samples = 0

for (let s = 0; s < SEEDS; s++) {
  const seed = `mix-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  for (let w = 0; w < WEEKS; w++) {
    tickWeek(world, rng)
    if (w % 13 !== 12) continue
    const ids = world.cohort.map((p) => p.id)
    const results = world.results.filter((r) => r.playerId !== KID_ID)
    const mixed = computeRanking(results, world.week, ids)
    for (const row of rows) {
      const split = computeRanking(results, world.week, ids, onlyTrack(row.track))
      row.overlap.push(topKOverlap(mixed, split, row.k))
      if (row.k === 8) {
        if (mixed[0]?.playerId !== split[0]?.playerId) topSeedChanged++
        samples++
      }
    }
  }
}

const pct = (xs: number[]) => ((xs.reduce((a, b) => a + b, 0) / xs.length) * 100).toFixed(1)
console.log(`careers=${SEEDS}  weeks=${WEEKS}  samples per row=${rows[0].overlap.length}`)
console.log('\nHow much of the SPLIT table survives in the MIXED one the engine actually uses:')
for (const r of rows) {
  console.log(`  ${r.track.padEnd(9)} top-${String(r.k).padEnd(3)} overlap ${pct(r.overlap)}%`)
}
console.log(`\nThe #1 player differs between mixed and split: ${((topSeedChanged / samples) * 100).toFixed(1)}% of samples`)
