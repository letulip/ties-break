/**
 * pressure-set-census – HOW BIG IS THE PRESSURE SET, measured rather than estimated.
 *
 * Round 42 #34, lever 1. Until this round nerve acted on ONE kind of point – the break point, a
 * measured 11.23% of served points – and `docs/specs/the-price-of-nerve-2026-09.md` §the build
 * sized the new price against a widened set it estimated at «~25% of points». An estimate that the
 * price is scaled against is a number that has to be measured, so this is the measurement.
 *
 * It prints the share of played points that each member of the set reaches, the share the UNION
 * reaches (which is the number the price is scaled against – the members overlap heavily: a match
 * point is usually also a set point and often a break point), and the same census restricted to the
 * matches a real bracket plays, so the answer is not an artefact of two mirror players.
 *
 * ⚠ IT READS THE ENGINE'S OWN PREDICATE. `isPressurePoint` is imported from `match/point.ts` and
 * every `PointLogEntry` carries the five facts the engine decided the point on, so this tool cannot
 * drift from the loop it is describing – it re-asks the shipped function rather than re-deriving
 * the rule. That is the `tiebreakServer` lesson applied to a bench.
 *
 * ZERO RNG DISCIPLINE: every match is seeded off a key private to this bench (`pressure:*`).
 * Nothing here touches MAIN and the tool never constructs a World.
 *
 * Run:
 *   npx vite-node tools/pressure-set-census.ts [--sims N]
 */
import { simulateMatch } from '../src/engine/match/engine'
import { isPressurePoint } from '../src/engine/match/point'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
import type { MatchOptions, MatchPlayer } from '../src/engine/match/types'

const argv = process.argv.slice(2)
const num = (flag: string, dflt: number): number => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt
}
const SIMS = num('--sims', 4000)

const OPTS: MatchOptions = { surface: 'hard', tour: 'wta', seed: '' }
const pct = (x: number): string => `${(100 * x).toFixed(2)}%`.padStart(8)

function build(id: string, core: number, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age: 22, ...over }
}

interface Census {
  points: number
  servedPoints: number
  breakPoint: number
  /** break points as a share of SERVED points – the 11.23% the old price was scaled against */
  tiebreak: number
  setPoint: number
  matchPoint: number
  decidingClose: number
  union: number
}

function census(a: MatchPlayer, b: MatchPlayer, key: string): Census {
  const c: Census = {
    points: 0,
    servedPoints: 0,
    breakPoint: 0,
    tiebreak: 0,
    setPoint: 0,
    matchPoint: 0,
    decidingClose: 0,
    union: 0,
  }
  for (let i = 0; i < SIMS; i++) {
    const res = simulateMatch(a, b, { ...OPTS, seed: `pressure:${key}:${i}` })
    for (const e of res.log) {
      c.points++
      // Every point is served by somebody; the distinction only matters for the break-point rate,
      // which the r38 instrument quotes per SERVED point and which is quoted back in point.ts.
      c.servedPoints++
      if (e.breakPoint) c.breakPoint++
      if (e.tiebreak) c.tiebreak++
      if (e.setPointFor !== null) c.setPoint++
      if (e.matchPointFor !== null) c.matchPoint++
      if (e.decidingClose) c.decidingClose++
      if (isPressurePoint(e)) c.union++
    }
  }
  return c
}

function report(label: string, c: Census): void {
  console.log(`\n  ${label}  (${c.points.toLocaleString('en-US')} points over ${SIMS.toLocaleString('en-US')} matches)`)
  console.log(`    break point                 ${pct(c.breakPoint / c.points)}`)
  console.log(`    every point of a tiebreak   ${pct(c.tiebreak / c.points)}`)
  console.log(`    set point                   ${pct(c.setPoint / c.points)}`)
  console.log(`    match point                 ${pct(c.matchPoint / c.points)}`)
  console.log(`    deciding set, closing games ${pct(c.decidingClose / c.points)}`)
  console.log(`    ---------------------------------------`)
  console.log(`    THE UNION (isPressurePoint) ${pct(c.union / c.points)}`)
  const naive =
    (c.breakPoint + c.tiebreak + c.setPoint + c.matchPoint + c.decidingClose) / c.points
  console.log(`    (sum of the five, which double-counts: ${pct(naive)} – the overlap is the difference)`)
}

const pros = fieldProsFor('pressure-census', 0)
const table = mergedWtaRanking([], pros)
const byId = new Map(pros.map((pro) => [pro.id, pro]))
const at = (rank: number): MatchPlayer => {
  const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
  const pro = byId.get(row.playerId)
  if (!pro) throw new Error(`no pro behind rank ${rank}`)
  return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
}

console.log('pressure-set-census – what share of points nerve is spent on, round 42 #34 lever 1')
console.log(`  wta · hard · full condition · ${SIMS.toLocaleString('en-US')} matches per block`)
report('two mirror players, core 62', census(build('a', 62), build('b', 62), 'mirror'))
report('the big-shot build against the standing at #20', census(
  build('alice', 0, { serve: 68, ret: 70, composure: 52, stamina: 65, groundstrokes: 73 }),
  at(20),
  'alice-20',
))
report('the nerve build against the standing at #80', census(
  build('zoe', 0, { serve: 65, ret: 58, composure: 78, stamina: 60, groundstrokes: 63 }),
  at(80),
  'zoe-80',
))
