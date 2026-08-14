// WHAT A BIG DRAW COSTS – the priced unknown of W3-ACT2 (act2-pro-tour.md §9: «big draws (48/96/128
// – sim cost and Draw-view are the two priced unknowns)»).
//
//   npx vite-node tools/big-draw-cost.ts [--seeds N] [--weeks N]
//
// THE QUESTION. The real ladder's top rungs are not 32-draws: a Grand Slam is 128, a WTA 1000 is 56
// or 96. The brief for this wave says measure the cost before committing and, if it is prohibitive,
// ship at a reduced draw with the deviation stated rather than silently keep 32 and call it a Slam.
// This tool is that measurement, and it reports the cost in the two units it can actually be paid in:
//
//   1. TIME – a 128-draw is 127 AI-AI matches against a 32-draw's 31. Wall-clock per bracket, at
//      each size, on the real `runTournament` with real cohort players.
//   2. POPULATION – and this is the one that decides it. `selectEntrants` treats a draw it cannot
//      fill as a crash rather than a compromise, so it carries an escape ladder: in-band ⇒ of-age ⇒
//      EVERYBODY. A draw bigger than the eligible population therefore does not fail loudly. It
//      quietly fills a Grand Slam with children.
//
// ⚠⚠ THE ANSWER CHANGED UNDER THIS TOOL (W3-FIELD3, 04.08), WHICH IS WHY IT EXISTS.
//
// When it was written the canonical AI bracket was LIVE-ONLY by design – `drawAiEntrants` drew from
// `world.cohort` and nothing else, because a DERIVED field pro must never write a persisted result
// row (living-field.md §8.3) – so a 128-draw was contested by 128 of the 199 CHILDREN in the world,
// 18.3% of them under the rung's own age gate and the youngest thirteen. That measurement is what
// shipped the majors at draw 32 with the deviation stated in `calendar.ts`.
//
// W3-FIELD3 separated the two facts the old fence held together: a pro is now IN the canonical W
// draw and still writes NO row. So the canonical universe below is the one the engine actually uses
// – LIVE cohort ∪ 364 derived professionals, positioned by the merged W standings – and the numbers
// this prints are the population argument re-taken against it. ⚠ IT STILL CHANGES NO SHIPPED DRAW
// SIZE: the tool patches `drawSize` in memory to ask the counterfactual, and the decision about the
// real majors is the owner's to make with the table in hand.
//
// WHAT IT PRINTS, per candidate draw size: the eligible population, the in-band candidate count, the
// share of the drawn field that came from OUTSIDE the entrant band (backfill – the exact failure the
// L6 guard exists to catch), the share that is UNDER the tier's own age gate, and the youngest
// player the draw contains.
//
// ⚠ IT PATCHES `TIERS[tier].drawSize` IN MEMORY to ask the counterfactual, which is the fatigue
// bench's own `withScenario` idiom (`as const` is compile-time only, nothing is written back to any
// file). Every draw it takes is on a probe world's own purpose-scoped sub-streams; the MAIN weekly
// stream is never touched. MEASUREMENT ONLY: no engine number is written from here.

import { createWorld, tickWeek, inTrack, KID_ID, seasonIndexOf } from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, isTierAgeOpen, TIER_SHORT } from '../src/engine/season/calendar'
import { selectEntrants, isEntrantBand, runTournament } from '../src/engine/season/tournament'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { fieldProsFor, isFieldProId, mergedWtaRanking, universeForTier } from '../src/engine/season/fieldPros'
import type { TierId, SeasonEvent, AiPlayer, RankingRow } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 4)
const WEEKS = argOf('weeks', 260)
const SAMPLE_EVERY = 13

/** The candidate draw sizes. Powers of two only – `runTournament` is a pure single-elimination fold
 *  with no bye machinery, so a real 56-draw IS a 64-bracket and a real 30-draw IS a 32 one. */
const SIZES = [32, 64, 128] as const

/** The rung the counterfactual is asked about: the biggest one, whose real draw is 128. */
const tierArg = args.indexOf('--tier')
const TIER: TierId = (tierArg >= 0 ? args[tierArg + 1] : 'slam') as TierId

interface Cell {
  draws: number
  /** cohort players clearing the tier's own age gate, summed over sampled weeks */
  ofAge: number
  /** cohort players inside the tier's entrant window */
  inBand: number
  /** drawn players who were NOT in the entrant window – `selectEntrants`' backfill */
  outOfBand: number
  /** drawn players who do not clear the tier's age gate – the escape ladder's last rung */
  underAge: number
  youngest: number
  slots: number
}

function emptyCell(): Cell {
  return { draws: 0, ofAge: 0, inBand: 0, outOfBand: 0, underAge: 0, youngest: 99, slots: 0 }
}

const cells = new Map<number, Cell>(SIZES.map((s) => [s, emptyCell()]))

/** The canonical bracket's own universe and standings, rebuilt exactly as `tickWeek` builds them:
 *  since W3-FIELD3 that is LIVE cohort ∪ this season's derived professionals, positioned by the
 *  MERGED W standings folded WITHOUT the kid. This is the population the counterfactual is about,
 *  and it is the whole of what moved – the draw sizes below are the same counterfactual as before. */
function canonical(world: WorldState): { cohort: AiPlayer[]; ranking: RankingRow[] } {
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const live = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.wta,
    world.cohort.map((p) => p.id),
    inTrack('wta'),
  )
  return { cohort: universeForTier(TIER, world.cohort, pros), ranking: mergedWtaRanking(live, pros) }
}

function sampleWeek(world: WorldState): void {
  const { cohort, ranking } = canonical(world)
  const total = ranking.length || cohort.length
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total

  const event: SeasonEvent = {
    id: `probe-w${world.week}-${TIER}`,
    week: world.week,
    tier: TIER,
    surface: 'hard',
    travelCostCents: 0,
    deadlineWeek: world.week - 2,
  }

  const ofAge = cohort.filter((p) => isTierAgeOpen(TIER, p.ageYears)).length
  const inBand = cohort.filter(
    (p) => isTierAgeOpen(TIER, p.ageYears) && isEntrantBand(TIER, pctOf(p.id)),
  ).length

  for (const size of SIZES) {
    ;(TIERS[TIER] as { drawSize: number }).drawSize = size
    const rng = rngFromSeed(`${world.seed}:probe:${event.id}:${size}`)
    const drawn = selectEntrants(event, cohort, ranking, rng)
    const c = cells.get(size)!
    c.draws += 1
    c.ofAge += ofAge
    c.inBand += inBand
    c.slots += drawn.length
    for (const p of drawn) {
      if (!isEntrantBand(TIER, pctOf(p.id))) c.outOfBand += 1
      if (!isTierAgeOpen(TIER, p.ageYears)) c.underAge += 1
      c.youngest = Math.min(c.youngest, p.ageYears)
    }
  }
}

/** Wall clock for one bracket at each size, on a real cohort field. The bracket is AI-only (no kid),
 *  so every match is `fastMatchProbability` + one draw – exactly what the canonical loop runs. */
function timeBrackets(world: WorldState): Map<number, number> {
  const out = new Map<number, number>()
  const { cohort, ranking } = canonical(world)
  const event: SeasonEvent = {
    id: `probe-timing-${TIER}`,
    week: world.week,
    tier: TIER,
    surface: 'hard',
    travelCostCents: 0,
    deadlineWeek: world.week - 2,
  }
  for (const size of SIZES) {
    ;(TIERS[TIER] as { drawSize: number }).drawSize = size
    const rng = rngFromSeed(`${world.seed}:probe:timing:${size}`)
    const entrants = selectEntrants(event, cohort, ranking, rng)
    const field = entrants.map((p) => rivalMatchPlayer(p, event.surface))
    const REPS = 200
    const t0 = performance.now()
    for (let i = 0; i < REPS; i++) {
      runTournament(event, field, null, world.seed, rngFromSeed(`${world.seed}:probe:run:${size}:${i}`))
    }
    out.set(size, (performance.now() - t0) / REPS)
  }
  return out
}

const shippedDraw = TIERS[TIER].drawSize
let timings = new Map<number, number>()

for (let s = 0; s < SEEDS; s++) {
  const world = createWorld(`big-draw-${s}`)
  const rng = rngFromSeed(`${world.seed}:probe:main`)
  for (let w = 0; w < WEEKS; w++) {
    ;(TIERS[TIER] as { drawSize: number }).drawSize = shippedDraw
    tickWeek(world, rng)
    if (world.pendingTournament) world.pendingTournament = null
    if (world.week % SAMPLE_EVERY === 0) sampleWeek(world)
  }
  if (s === 0) timings = timeBrackets(world)
}
;(TIERS[TIER] as { drawSize: number }).drawSize = shippedDraw

console.log(
  `BIG DRAW COST – rung "${TIER_SHORT[TIER]}" (shipped draw ${shippedDraw}), ` +
    `${SEEDS} worlds x ${WEEKS} weeks sampled every ${SAMPLE_EVERY}th`,
)
{
  const probe = createWorld('big-draw-0')
  const probePros = fieldProsFor(probe.seed, seasonIndexOf(probe.week), probe.cohort.map((p) => p.name))
  console.log(
    `  the canonical bracket's universe is LIVE COHORT ∪ FIELD PROS since W3-FIELD3 ` +
      `(${probe.cohort.length} juniors aged 13-19 + ${probePros.length} professionals aged 16-30 = ` +
      `${probe.cohort.length + probePros.length}); the ${TIER_SHORT[TIER]} age gate is ${TIERS[TIER].minAgeYears}+`,
  )
}
console.log(
  `  entrant window ${JSON.stringify(TIERS[TIER].entrantPctBand)} · ` +
    `matches per bracket: ${SIZES.map((s) => `${s}-draw ${s - 1}`).join(' · ')}`,
)

console.log('\n  draw   of-age in world    in-band   drawn   out-of-band   under-age   youngest   ms/bracket')
for (const size of SIZES) {
  const c = cells.get(size)!
  const per = (n: number) => (n / Math.max(1, c.draws)).toFixed(1)
  const pct = (n: number) => `${((100 * n) / Math.max(1, c.slots)).toFixed(1)}%`
  console.log(
    `  ${String(size).padStart(4)}   ${per(c.ofAge).padStart(15)}   ${per(c.inBand).padStart(7)}` +
      `   ${per(c.slots).padStart(5)}   ${pct(c.outOfBand).padStart(11)}   ${pct(c.underAge).padStart(9)}` +
      `   ${String(c.youngest).padStart(8)}   ${(timings.get(size) ?? 0).toFixed(2).padStart(10)}`,
  )
}

// THE VERDICT, computed rather than eyeballed. A draw is HONEST when it can be filled from the
// players the rung's own rules admit; it is a fiction when the escape ladder has to reach past them.
console.log('\n  verdict')
for (const size of SIZES) {
  const c = cells.get(size)!
  const ofAge = c.ofAge / Math.max(1, c.draws)
  const underAgePct = (100 * c.underAge) / Math.max(1, c.slots)
  const outPct = (100 * c.outOfBand) / Math.max(1, c.slots)
  const verdict =
    underAgePct > 0
      ? `BROKEN – ${underAgePct.toFixed(0)}% of the draw is under the age gate (${ofAge.toFixed(0)} eligible players for ${size} chairs)`
      : outPct > 50
        ? `FICTION – ${outPct.toFixed(0)}% of the draw is backfill from outside the entrant window`
        : `OK – ${outPct.toFixed(0)}% backfill, ${ofAge.toFixed(0)} eligible players`
  console.log(`    ${String(size).padStart(4)}: ${verdict}`)
}

// WHO IS ACTUALLY IN THE DRAW – the other half of the population question, and the one the old
// LIVE-only run could not ask at all. A 128-draw is only honest if the people filling it are
// professionals rather than the world's juniors reached for by the escape ladder, so the share of
// each draw that is derived is printed beside the window it came from.
{
  const world = createWorld('big-draw-merged')
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const { cohort, ranking } = canonical(world)
  const [lo, hi] = TIERS[TIER].entrantPctBand
  console.log(
    `\n  for scale: the MERGED table (live ∪ ${pros.length} field pros) is ${ranking.length} rows, and the ` +
      `${TIER_SHORT[TIER]} window [${lo}, ${hi}] is ${Math.round((hi - lo) * ranking.length)} of them.`,
  )
  console.log('\n  draw   from the professional field   from the live cohort')
  for (const size of SIZES) {
    ;(TIERS[TIER] as { drawSize: number }).drawSize = size
    const event: SeasonEvent = {
      id: `probe-mix-${TIER}`,
      week: world.week,
      tier: TIER,
      surface: 'hard',
      travelCostCents: 0,
      deadlineWeek: world.week - 2,
    }
    const drawn = selectEntrants(event, cohort, ranking, rngFromSeed(`${world.seed}:probe:mix:${size}`))
    const fp = drawn.filter((p) => isFieldProId(p.id)).length
    console.log(
      `  ${String(size).padStart(4)}   ${String(fp).padStart(26)}   ${String(drawn.length - fp).padStart(20)}`,
    )
  }
  ;(TIERS[TIER] as { drawSize: number }).drawSize = shippedDraw
}
