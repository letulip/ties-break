// THE CLOSED LOOP AT THE FOOT OF THE PROFESSIONAL LADDER – how often does a LIVE cohort player earn
// a W-tier point, and who is actually standing in the W table?
//
//   npx vite-node tools/w-onramp-probe.ts [--seeds N] [--seasons N] [--verbose]
//
// WHY IT EXISTS. W3-FIELD3 ("the canonical w brackets are played by professionals") made the W-track
// canonical draws select from LIVE cohort ∪ 364 derived field pros against the MERGED W standings.
// The merged table sorts on points, every derived pro holds three figures of them and every LIVE
// junior starts on zero – so the whole cohort sits at positions 364+ of a 563-row table while a W15
// draw is filled, position-biased, from the head of its own band (~#124 down). A LIVE junior can
// therefore never be drawn into a W event; never being drawn, she can never earn a W point; never
// earning one, she can never leave position 364. That is a closed loop, and it means the only player
// in the world who will ever hold a W point is the kid.
//
// WHAT IT MEASURES, per season and averaged over seeds:
//
//   LIVE W ROWS     W-track ledger rows the canonical brackets write for NON-KID players. This is the
//                   headline: it is exactly "a cohort player was in a professional draw", because
//                   `runAiTournament` writes one row per LIVE entrant (points 0 included).
//   LIVE W POINTS   what those rows paid – the half that moves a standing.
//   EARNERS         distinct cohort players holding a non-zero W best-16 sum at the season boundary.
//   COMPOSITION     of the merged W standings at several depths: cohort / pro / kid.
//   LEDGER          `world.results` length at the horizon, and the tick's own wall-clock cost.
//
// ⚠ THE KID DOES NOTHING HERE, ON PURPOSE. The question is whether the WORLD moves on its own: if
// the only W points in the table are hers, the standings above her are a backdrop rather than a
// population. Her own trajectory is a different question and has its own bench (tools/ladder-walk.ts).
//
// MEASUREMENT ONLY: every number is read off the public engine after a normal `tickWeek`. No engine
// constant is written from here, and every draw the probe causes is the engine's own.

import { createWorld, tickWeek, inTrack, KID_ID, seasonIndexOf } from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum } from '../src/engine/season/ranking'
import { resumeMain } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ON_RAMP } from '../src/engine/season/tournament'
import { fieldProsFor, isFieldProId, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalConditions } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 6)
const SEASONS = argOf('seasons', 8)
const VERBOSE = args.includes('--verbose')
// ⚠ PATCHES THE LIVE `ON_RAMP` OBJECT, which is the `BEST_N_BY_TRACK` / fatigue-bench idiom: the
// engine reads the field, nothing is written back to any file, and `--slots 0` is the pre-fix arm.
ON_RAMP.slots = argOf('slots', ON_RAMP.slots)

/** The depths the standings are read at – a career passes through all of them. */
const DEPTHS = [25, 50, 100, 200, 300, 400, 500] as const

interface SeasonRow {
  season: number
  /** W-track ledger rows written for LIVE non-kid players this season */
  liveRows: number
  /** what those rows paid */
  livePoints: number
  /** distinct cohort ids holding a non-zero W best-16 sum at the boundary */
  earners: number
  /** the best LIVE non-kid W points total at the boundary, and where it stands in the merged table */
  topPoints: number
  topRank: number
  /** cohort players inside each depth of the merged W standings */
  cohortAt: number[]
  ledgerRows: number
  /** LIVE rows and W events, per rung – where on the ladder the on-ramp actually lands */
  byTier: Map<string, { rows: number; pts: number; events: number }>
}

function isWtaRow(tier: string | undefined): boolean {
  return tier !== undefined && TIERS[tier as keyof typeof TIERS].track === 'wta'
}

/** The merged W standings exactly as every surface reads them (world/ladder.ts `rankingFor`). */
function mergedTable(world: WorldState) {
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const live = computeRanking(
    world.results,
    world.week,
    BEST_N_BY_TRACK.wta,
    [...world.cohort.map((p) => p.id), KID_ID],
    inTrack('wta'),
  )
  return mergedWtaRanking(live, pros)
}

function run(seed: string): { rows: SeasonRow[]; tickMs: number; ticks: number } {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  const rows: SeasonRow[] = []
  let season = 0
  let liveRows = 0
  let livePoints = 0
  let tickMs = 0
  let ticks = 0
  let byTier = new Map<string, { rows: number; pts: number; events: number }>()
  const cell = (t: string) => {
    let c = byTier.get(t)
    if (!c) byTier.set(t, (c = { rows: 0, pts: 0, events: 0 }))
    return c
  }

  for (let w = 0; w < SEASONS * WEEKS_PER_YEAR; w++) {
    const t0 = performance.now()
    tickWeek(world, rng)
    tickMs += performance.now() - t0
    ticks += 1
    for (const e of world.season) {
      if (e.week === world.week && TIERS[e.tier].track === 'wta') cell(e.tier).events += 1
    }
    for (const r of world.results) {
      if (r.week !== world.week) continue
      if (r.playerId === KID_ID) continue
      if (!isWtaRow(r.tier)) continue
      liveRows += 1
      livePoints += r.points
      const c = cell(r.tier!)
      c.rows += 1
      c.pts += r.points
    }
    if (seasonIndexOf(world.week) !== season) {
      const table = mergedTable(world)
      const posOf = new Map(table.map((r, i) => [r.playerId, i]))
      let earners = 0
      let topPoints = 0
      let topId = ''
      for (const p of world.cohort) {
        const pts = windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.wta, inTrack('wta'))
        if (pts > 0) earners += 1
        if (pts > topPoints) {
          topPoints = pts
          topId = p.id
        }
      }
      rows.push({
        season,
        liveRows,
        livePoints,
        earners,
        topPoints,
        topRank: topId ? (posOf.get(topId) ?? -1) + 1 : 0,
        cohortAt: DEPTHS.map(
          (d) => table.slice(0, d).filter((r) => !isFieldProId(r.playerId) && r.playerId !== KID_ID).length,
        ),
        ledgerRows: world.results.length,
        byTier,
      })
      season = seasonIndexOf(world.week)
      liveRows = 0
      livePoints = 0
      byTier = new Map()
    }
  }
  return { rows, tickMs, ticks }
}

const runs: SeasonRow[][] = []
let msTotal = 0
let tickTotal = 0
for (let s = 0; s < SEEDS; s++) {
  const r = run(`w-onramp-${s}`)
  runs.push(r.rows)
  msTotal += r.tickMs
  tickTotal += r.ticks
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const f = (x: number, d = 1) => x.toFixed(d)

console.log(
  `W ON-RAMP PROBE – ${SEEDS} worlds x ${SEASONS} seasons, ON_RAMP.slots = ${ON_RAMP.slots}, the kid enters nothing`,
)
console.log('')
console.log('  season   liveRows   livePts   earners   best live row (pts @ merged rank)   ledger')
for (let s = 0; s < SEASONS; s++) {
  const cell = runs.map((r) => r[s]).filter(Boolean)
  if (!cell.length) continue
  console.log(
    `  ${String(s).padStart(6)}   ${f(mean(cell.map((c) => c.liveRows))).padStart(8)}   ` +
      `${f(mean(cell.map((c) => c.livePoints))).padStart(7)}   ${f(mean(cell.map((c) => c.earners))).padStart(7)}   ` +
      `${f(mean(cell.map((c) => c.topPoints))).padStart(11)} @ ${f(mean(cell.map((c) => c.topRank)), 0).padStart(4)}` +
      `                ${f(mean(cell.map((c) => c.ledgerRows)), 0).padStart(6)}`,
  )
}

const last = runs.map((r) => r[r.length - 1]).filter(Boolean)
console.log('')
console.log(`  MERGED W STANDINGS at the horizon (season ${SEASONS - 1}) – cohort rows inside each depth:`)
console.log(`    depth   ${DEPTHS.map((d) => String(d).padStart(6)).join('')}`)
console.log(
  `    cohort  ${DEPTHS.map((_, i) => f(mean(last.map((c) => c.cohortAt[i]))).padStart(6)).join('')}`,
)

const RUNGS = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']
console.log('')
console.log(`  WHERE THE LIVE ROWS LAND, last season – events a season, live rows, live rows per event (of 32):`)
console.log(`    rung      ${RUNGS.map((t) => t.padStart(8)).join('')}`)
const cellOf = (t: string, pick: (c: { rows: number; pts: number; events: number }) => number) =>
  mean(last.map((c) => pick(c.byTier.get(t) ?? { rows: 0, pts: 0, events: 0 })))
console.log(`    events    ${RUNGS.map((t) => f(cellOf(t, (c) => c.events), 0).padStart(8)).join('')}`)
console.log(`    liveRows  ${RUNGS.map((t) => f(cellOf(t, (c) => c.rows), 0).padStart(8)).join('')}`)
console.log(
  `    per event ${RUNGS.map((t) => {
    const ev = cellOf(t, (c) => c.events)
    return (ev ? f(cellOf(t, (c) => c.rows) / ev, 2) : '-').padStart(8)
  }).join('')}`,
)
console.log(`    livePts   ${RUNGS.map((t) => f(cellOf(t, (c) => c.pts), 0).padStart(8)).join('')}`)

// ---------------------------------------------------------------------------------------------
// THE COHORT'S BODY, in tests/rivals.test.ts C2's own unit and methodology (20-week window over the
// last ticked weeks, medians across the 199). The on-ramp puts professional load BACK on the cohort,
// and C2's knee claim ("the median rival is fit EVERY week") was restored by W3-FIELD3 taking it
// away – so this is the number that says whether the repair is being spent.
// ---------------------------------------------------------------------------------------------
const C2_WEEKS = 20
function bodyOf(seed: string): { minMedian: number; worstFloored: number; heavy: number; everShare: number; wRowsPerRival: number } {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < 40; w++) tickWeek(world, rng)
  const flooredWeeks = new Map<string, number>()
  const medians: number[] = []
  for (let w = world.week - C2_WEEKS + 1; w <= world.week; w++) {
    const conds = rivalConditions(world.results, w)
    const vals: number[] = []
    for (const p of world.cohort) {
      const c = conds.get(p.id) ?? ECONOMY.condition.max
      vals.push(c)
      if (c <= ECONOMY.condition.min) flooredWeeks.set(p.id, (flooredWeeks.get(p.id) ?? 0) + 1)
    }
    vals.sort((a, b) => a - b)
    medians.push(vals[Math.floor(vals.length / 2)])
  }
  const wRows = world.results.filter(
    (r) => r.playerId !== KID_ID && isWtaRow(r.tier) && world.week - r.week < C2_WEEKS,
  ).length
  return {
    minMedian: Math.min(...medians),
    worstFloored: Math.max(0, ...flooredWeeks.values()),
    heavy: [...flooredWeeks.values()].filter((n) => n >= C2_WEEKS / 2).length,
    everShare: flooredWeeks.size / world.cohort.length,
    wRowsPerRival: wRows / world.cohort.length,
  }
}
const bodies = Array.from({ length: SEEDS }, (_, s) => bodyOf(`w-onramp-body-${s}`))
console.log('')
console.log(`  THE COHORT'S BODY (C2 methodology: ${SEEDS} seeds x 40 ticked weeks, ${C2_WEEKS}-week window):`)
console.log(
  `    minMedian ${Math.min(...bodies.map((b) => b.minMedian))}-${Math.max(...bodies.map((b) => b.minMedian))}` +
    ` (knee ${ECONOMY.condition.matchStrengthKnee})` +
    ` · worst floored ${Math.min(...bodies.map((b) => b.worstFloored))}-${Math.max(...bodies.map((b) => b.worstFloored))}/${C2_WEEKS}` +
    ` · heavy ${Math.min(...bodies.map((b) => b.heavy))}-${Math.max(...bodies.map((b) => b.heavy))}` +
    ` · ever ${f(100 * Math.min(...bodies.map((b) => b.everShare)))}-${f(100 * Math.max(...bodies.map((b) => b.everShare)))}%` +
    ` · W rows/rival ${f(mean(bodies.map((b) => b.wRowsPerRival)), 2)}`,
)

const totalRows = runs.map((r) => r.reduce((a, b) => a + b.liveRows, 0))
const totalPts = runs.map((r) => r.reduce((a, b) => a + b.livePoints, 0))
console.log('')
console.log(
  `  RATE over the whole horizon: ${f(mean(totalRows), 1)} live W rows / career ` +
    `(${f(mean(totalRows) / SEASONS, 2)} a season, ${f(mean(totalRows) / SEASONS / 199, 3)} per cohort player per season)`,
)
console.log(`  POINTS: ${f(mean(totalPts), 1)} live W points / career`)
console.log(`  TICK COST: ${f(msTotal / tickTotal, 3)} ms/tick over ${tickTotal} ticks`)

if (VERBOSE) {
  for (let i = 0; i < runs.length; i++) {
    console.log(`  seed ${i}: ${runs[i].map((r) => r.liveRows).join(' ')}`)
  }
}
