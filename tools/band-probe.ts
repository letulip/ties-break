// THE CANDIDATE-COUNT PROBE for the W2-LADDER rungs' entrant windows (act2-pro-tour.md §2:
// "entrantPctBand MEASURED the way W100's 0.55 was").
//
//   npx vite-node tools/band-probe.ts [--seeds N] [--weeks N]
//
// THE QUESTION, exactly the one W100's own comment table answers: how many candidates does a
// window leave AT ITS NARROWEST, against a draw of 32? A tier's entrant window has to be wider
// than its own draw or the field stops moving week to week - and worse, `selectEntrants`' backfill
// starts reaching OUTSIDE the band, which is how a "prestige" draw quietly fills with whoever is
// fit (the L6 lesson, caught at 0.256 against a 0.25 window on the pre-field W100).
//
// THE METHOD, the W100 comment's own ("5 careers x 312 weeks sampled every 13th week"), updated to
// the machinery the W rungs actually draw from since living-field phase W: the candidate universe
// is LIVE cohort ∪ field pros, positions come from the MERGED W standings folded WITHOUT the kid
// (computeShadowTournament's own independence rule), and the age gate is applied before the band -
// `selectEntrants` filters its universe through `isTierAgeOpen` first, so a window's usable depth
// is a function of BOTH numbers. Careers tick the real engine with no entries, which is the state
// any career meets those weeks in (the AI world is input-independent by construction).
//
// Pure measurement: reads the live engine, writes nothing, and every draw it takes is on
// purpose-scoped sub-streams a probe world owns. The numbers land in the three new rungs' own
// `entrantPctBand` comments (season/calendar.ts) - this file is how they are re-derived.

import { createWorld, tickWeek, inTrack, KID_ID, seasonIndexOf } from '../src/engine/world'
import { computeRanking } from '../src/engine/season/ranking'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, isTierAgeOpen } from '../src/engine/season/calendar'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 5)
const WEEKS = argOf('weeks', 312)
const SAMPLE_EVERY = 13
const DRAW = 32

/** The rungs being measured, plus w100 so the historical [0, 0.55] row can be restated against the
 *  post-field universe (its own comment carries the pre-field numbers). */
const TIERS_PROBED: readonly TierId[] = ['w50', 'w75', 'w100', 'wta125']

/** Upper bounds swept at floor 0. The band FLOOR barely moves the count (it shaves the handful of
 *  head rows), so the sweep is over the half that decides depth; a nonzero floor's exact count is
 *  printed separately for the shipped bands below. */
const UPPER_BOUNDS = [0.15, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.55]

interface Cell {
  min: number
  sum: number
  n: number
}
const cells = new Map<string, Cell>()
function record(key: string, count: number): void {
  const c = cells.get(key)
  if (!c) cells.set(key, { min: count, sum: count, n: 1 })
  else {
    c.min = Math.min(c.min, count)
    c.sum += count
    c.n += 1
  }
}

function sampleWeek(world: WorldState): void {
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  // ⚠ COUNT-INVARIANT TO THE WINDOW WIDTH (BEST_N): a candidate count is a function of the window
  // and the universe size only - percentiles are ordinal, and a permutation cannot change how many
  // rows sit inside a share. So this probe's numbers hold identically under best-6 and best-16.
  const live = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    world.cohort.map((p) => p.id),
    inTrack('wta'),
  )
  const merged = mergedWtaRanking(live, pros)
  const total = merged.length
  const posOf = new Map<string, number>()
  merged.forEach((r, i) => posOf.set(r.playerId, i))
  const universe = [...world.cohort, ...pros]
  for (const tier of TIERS_PROBED) {
    const ofAge = universe.filter((p) => isTierAgeOpen(tier, p.ageYears))
    const pcts = ofAge.map((p) => ((posOf.get(p.id) ?? total - 1) + 1) / total)
    for (const hi of UPPER_BOUNDS) {
      record(`${tier} [0, ${hi.toFixed(2)}]`, pcts.filter((pct) => pct <= hi).length)
    }
    // ...and the tier's SHIPPED band exactly as isEntrantBand reads it, floor included.
    const [lo, hi] = TIERS[tier].entrantPctBand
    record(`${tier} shipped`, pcts.filter((pct) => pct >= lo && pct <= hi).length)
  }
}

for (let s = 0; s < SEEDS; s++) {
  const world = createWorld(`band-probe-${s}`)
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < WEEKS; w++) {
    tickWeek(world, rng)
    if (world.week % SAMPLE_EVERY === 0) sampleWeek(world)
  }
  console.error(`  career ${s + 1}/${SEEDS} done (${WEEKS} weeks)`)
}

console.log(
  `BAND PROBE - candidates inside the window (age gate applied) over ${SEEDS} careers x ${WEEKS} weeks,` +
    ` sampled every ${SAMPLE_EVERY}th week, draw ${DRAW}`,
)
console.log('tier + window -> MIN (mean) candidates; a window must clear 32 with margin at its MINIMUM')
for (const tier of TIERS_PROBED) {
  const rows: string[] = []
  for (const hi of UPPER_BOUNDS) {
    const c = cells.get(`${tier} [0, ${hi.toFixed(2)}]`)!
    rows.push(`[0, ${hi.toFixed(2)}] -> ${c.min} (${(c.sum / c.n).toFixed(0)})`)
  }
  console.log(`  ${tier}:  ${rows.join('   ')}`)
  const s = cells.get(`${tier} shipped`)!
  const [lo, hi] = TIERS[tier].entrantPctBand
  console.log(`  ${tier} SHIPPED [${lo}, ${hi}] -> min ${s.min} (mean ${(s.sum / s.n).toFixed(0)})`)
}
